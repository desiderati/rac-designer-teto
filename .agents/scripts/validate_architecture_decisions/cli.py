#!/usr/bin/env python3
"""Validate Architecture Decision Records in a repository.

The validator is intentionally small and deterministic. It checks the SAT ADR
contract distributed by agents-bootstrap:

1. ADR files live under docs/architecture-decisions/.
2. ADR filenames follow ADR-NNN-{slug}.md.
3. Numbers are sequential, starting at ADR-001.
4. Frontmatter has a matching adr_number and an allowed status.
5. OBSIDIAN.md links every ADR when OBSIDIAN.md exists.
6. Obvious duplicates by slug or normalized title are reported.

Markdown index files such as README.md may live beside ADRs, but are not ADR
records and are ignored by this validator.

Exit codes:
- 0: ADR validation passes, or the repository has no ADR directory yet
- 1: at least one ADR contract violation was found
- 2: usage error

Usage:
    python scripts/validate_architecture_decisions.py --repo-root .
    python scripts/validate_architecture_decisions.py --repo-root ../target-repo --adr-dir docs/architecture-decisions
"""

from __future__ import annotations

import argparse
import re
import sys
import unicodedata
from dataclasses import dataclass
from pathlib import Path
from typing import NoReturn


ADR_FILENAME_RE = re.compile(r"^ADR-(\d{3})-[a-z0-9]+(?:-[a-z0-9]+)*\.md$")
ADR_REFERENCE_RE = re.compile(r"ADR-\d{3}")
FRONTMATTER_RE = re.compile(r"\A---\r?\n(?P<body>.*?)\r?\n---", re.DOTALL)
VALID_STATUSES = {"proposed", "accepted", "deprecated", "superseded"}
DEFAULT_ADR_DIR = Path("docs/architecture-decisions")
DEFAULT_OBSIDIAN_PATH = Path("OBSIDIAN.md")
NON_ADR_FILENAMES = {"README.md"}


@dataclass(frozen=True)
class AdrRecord:
    path: Path
    relative_path: Path
    number: int
    adr_number: str
    slug: str
    title: str
    status: str
    supersedes: tuple[str, ...]
    superseded_by: tuple[str, ...]


def _fail(message: str, code: int = 2) -> NoReturn:
    print(f"[validate_architecture_decisions] error: {message}", file=sys.stderr)
    sys.exit(code)


def _strip_quotes(value: str) -> str:
    value = value.strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in {'"', "'"}:
        return value[1:-1].strip()
    return value


def _parse_frontmatter(text: str) -> dict[str, str]:
    match = FRONTMATTER_RE.search(text)
    if not match:
        return {}

    fields: dict[str, str] = {}
    for raw_line in match.group("body").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or ":" not in line:
            continue
        key, value = line.split(":", 1)
        fields[key.strip()] = _strip_quotes(value)
    return fields


def _extract_title(text: str, fields: dict[str, str], fallback: str) -> str:
    title = fields.get("title", "").strip()
    if title:
        return title
    for line in text.splitlines():
        stripped = line.strip()
        if stripped.startswith("# "):
            return stripped[2:].strip()
    return fallback


def _normalize_title(title: str) -> str:
    without_adr = re.sub(r"\bADR-\d{3}\b", " ", title, flags=re.IGNORECASE)
    normalized = unicodedata.normalize("NFKD", without_adr)
    ascii_text = normalized.encode("ascii", "ignore").decode("ascii")
    collapsed = re.sub(r"[^a-z0-9]+", "-", ascii_text.lower()).strip("-")
    return collapsed


def _references_from(value: str) -> tuple[str, ...]:
    return tuple(ADR_REFERENCE_RE.findall(value or ""))


def _record_from_path(repo_root: Path, path: Path) -> tuple[AdrRecord | None, list[str]]:
    violations: list[str] = []
    match = ADR_FILENAME_RE.match(path.name)
    if not match:
        return None, [f"{path}: filename must match ADR-NNN-{{slug}}.md"]

    number = int(match.group(1))
    adr_number = f"ADR-{number:03d}"
    slug = path.stem.removeprefix(f"{adr_number}-")
    relative_path = path.relative_to(repo_root)
    text = path.read_text(encoding="utf-8")
    fields = _parse_frontmatter(text)

    if not fields:
        violations.append(f"{relative_path}: missing YAML frontmatter")

    declared_number = fields.get("adr_number", "").strip()
    if declared_number != adr_number:
        violations.append(
            f"{relative_path}: adr_number must be {adr_number}, got {declared_number or '<missing>'}"
        )

    doc_role = fields.get("doc_role", "").strip()
    if doc_role != "architecture-decision-record":
        violations.append(
            f"{relative_path}: doc_role must be architecture-decision-record"
        )

    status = fields.get("status", "").strip()
    if status not in VALID_STATUSES:
        violations.append(
            f"{relative_path}: status must be one of {sorted(VALID_STATUSES)}, got {status or '<missing>'}"
        )

    title = _extract_title(text, fields, fallback=slug)
    supersedes = _references_from(fields.get("supersedes", ""))
    superseded_by = _references_from(fields.get("superseded_by", ""))

    if status == "superseded" and not superseded_by:
        violations.append(f"{relative_path}: superseded ADR must set superseded_by")

    return (
        AdrRecord(
            path=path,
            relative_path=relative_path,
            number=number,
            adr_number=adr_number,
            slug=slug,
            title=title,
            status=status,
            supersedes=supersedes,
            superseded_by=superseded_by,
        ),
        violations,
    )


def _validate_sequence(records: list[AdrRecord]) -> list[str]:
    if not records:
        return []
    numbers = sorted(record.number for record in records)
    expected = list(range(1, numbers[-1] + 1))
    if numbers == expected:
        return []
    expected_text = ", ".join(f"ADR-{number:03d}" for number in expected)
    actual_text = ", ".join(f"ADR-{number:03d}" for number in numbers)
    return [f"ADR numbers must be sequential: expected {expected_text}; got {actual_text}"]


def _validate_obsidian_links(
    repo_root: Path,
    records: list[AdrRecord],
    obsidian_path: Path,
) -> list[str]:
    full_obsidian_path = repo_root / obsidian_path
    if not full_obsidian_path.exists():
        return []

    text = full_obsidian_path.read_text(encoding="utf-8")
    violations: list[str] = []
    for record in records:
        relative_posix = record.relative_path.as_posix()
        relative_without_suffix = record.relative_path.with_suffix("").as_posix()
        if (
            record.path.name not in text
            and relative_posix not in text
            and relative_without_suffix not in text
        ):
            violations.append(
                f"{obsidian_path}: missing link to {relative_posix}"
            )
    return violations


def _validate_duplicates(records: list[AdrRecord]) -> list[str]:
    violations: list[str] = []
    by_slug: dict[str, AdrRecord] = {}
    by_title: dict[str, AdrRecord] = {}

    for record in records:
        previous_slug = by_slug.get(record.slug)
        if previous_slug:
            violations.append(
                f"{record.relative_path}: duplicate ADR slug also used by {previous_slug.relative_path}"
            )
        else:
            by_slug[record.slug] = record

        normalized_title = _normalize_title(record.title)
        if not normalized_title:
            continue
        previous_title = by_title.get(normalized_title)
        if previous_title:
            violations.append(
                f"{record.relative_path}: duplicate ADR title also used by {previous_title.relative_path}"
            )
        else:
            by_title[normalized_title] = record

    return violations


def _validate_cross_references(records: list[AdrRecord]) -> list[str]:
    by_number = {record.adr_number for record in records}
    violations: list[str] = []
    for record in records:
        for related in (*record.supersedes, *record.superseded_by):
            if related not in by_number:
                violations.append(
                    f"{record.relative_path}: related ADR {related} does not exist"
                )
    return violations


def validate(repo_root: Path, adr_dir: Path, obsidian_path: Path) -> tuple[int, list[str]]:
    target_dir = repo_root / adr_dir
    if not target_dir.exists():
        return 0, [f"[validate_architecture_decisions] OK: no ADR directory at {adr_dir}"]
    if not target_dir.is_dir():
        return 1, [f"{adr_dir}: ADR path exists but is not a directory"]

    records: list[AdrRecord] = []
    violations: list[str] = []
    for path in sorted(target_dir.glob("*.md")):
        if path.name in NON_ADR_FILENAMES:
            continue
        record, record_violations = _record_from_path(repo_root, path)
        violations.extend(record_violations)
        if record is not None:
            records.append(record)

    violations.extend(_validate_sequence(records))
    violations.extend(_validate_obsidian_links(repo_root, records, obsidian_path))
    violations.extend(_validate_duplicates(records))
    violations.extend(_validate_cross_references(records))

    if violations:
        return 1, violations
    return 0, [f"[validate_architecture_decisions] OK: {len(records)} ADR record(s) validated"]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--repo-root",
        type=Path,
        default=Path("."),
        help="Repository root. Defaults to the current directory.",
    )
    parser.add_argument(
        "--adr-dir",
        type=Path,
        default=DEFAULT_ADR_DIR,
        help="ADR directory relative to the repo root.",
    )
    parser.add_argument(
        "--obsidian",
        type=Path,
        default=DEFAULT_OBSIDIAN_PATH,
        help="OBSIDIAN.md path relative to the repo root.",
    )
    args = parser.parse_args()

    repo_root = args.repo_root.resolve()
    if not repo_root.is_dir():
        _fail(f"repo root is not a directory: {repo_root}")

    code, messages = validate(repo_root, args.adr_dir, args.obsidian)
    stream = sys.stderr if code else sys.stdout
    if code:
        print(
            f"[validate_architecture_decisions] FAILED with {len(messages)} violation(s):",
            file=stream,
        )
        for message in messages:
            print(f"  - {message}", file=stream)
    else:
        for message in messages:
            print(message, file=stream)
    return code


if __name__ == "__main__":
    sys.exit(main())
