#!/usr/bin/env python3
"""Validate daily operational changelog files against the scaffold contract.

Checks enforced:
- filename matches `AAAAMMDD.changelog.md` (8 digits, ASCII)
- top-level title `# Changelog - YYYY-MM-DD` with date matching the filename
- at least one entry block opening with `## [HH:MM] <title>`
- each entry contains the minimum mandatory sub-sections in order:
  `### Contexto`, `### Decisão tomada`, `### Alterações realizadas`,
  `### Validação`, `### Tags`
- repository mode rejects loose `.agents/changelogs/*.md` files and validates
  every `.agents/changelogs/YYYY-MM/*.changelog.md` file

Exits with non-zero status on any contract violation.
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

FILENAME_RE = re.compile(r"^(\d{4})(\d{2})(\d{2})\.changelog\.md$")
TITLE_RE = re.compile(r"^#\s+Changelog\s+-\s+(\d{4})-(\d{2})-(\d{2})\s*$", re.MULTILINE)
ENTRY_HEADER_RE = re.compile(r"^##\s+\[(\d{2}):(\d{2})\]\s+\S.*$", re.MULTILINE)

MANDATORY_ENTRY_SECTIONS = [
    "### Contexto",
    "### Decisão tomada",
    "### Alterações realizadas",
    "### Validação",
    "### Tags",
]


def _split_entries(content: str) -> list[str]:
    indices = [m.start() for m in ENTRY_HEADER_RE.finditer(content)]
    if not indices:
        return []
    indices.append(len(content))
    return [content[indices[i]:indices[i + 1]] for i in range(len(indices) - 1)]


def _check_filename(path: Path) -> tuple[list[str], tuple[str, str, str] | None]:
    match = FILENAME_RE.match(path.name)
    if not match:
        return (
            [f"filename {path.name!r} does not match `AAAAMMDD.changelog.md`"],
            None,
        )
    return [], (match.group(1), match.group(2), match.group(3))


def _check_title(content: str, filename_date: tuple[str, str, str] | None) -> list[str]:
    match = TITLE_RE.search(content)
    if not match:
        return ["missing top-level title `# Changelog - YYYY-MM-DD`"]
    if filename_date is None:
        return []
    title_date = (match.group(1), match.group(2), match.group(3))
    if title_date != filename_date:
        return [
            "title date does not match filename: "
            f"title={'-'.join(title_date)}, filename={'-'.join(filename_date)}"
        ]
    return []


def _check_entries(content: str) -> list[str]:
    errors: list[str] = []
    entries = _split_entries(content)
    if not entries:
        errors.append("no entry block matching `## [HH:MM] ...` was found")
        return errors
    for index, entry in enumerate(entries, start=1):
        cursor = 0
        for section in MANDATORY_ENTRY_SECTIONS:
            position = entry.find(section, cursor)
            if position == -1:
                errors.append(f"entry {index}: missing or out-of-order section {section!r}")
                cursor = len(entry)
                continue
            cursor = position + len(section)
    return errors


def validate_file(path: Path) -> list[str]:
    if not path.exists():
        raise FileNotFoundError(f"changelog file not found: {path}")
    filename_errors, filename_date = _check_filename(path)
    content = path.read_text(encoding="utf-8")
    return [
        *filename_errors,
        *_check_title(content, filename_date),
        *_check_entries(content),
    ]


def _relative(path: Path, root: Path) -> str:
    try:
        return path.relative_to(root).as_posix()
    except ValueError:
        return path.as_posix()


def _collect_loose_changelog_files(changelog_root: Path) -> list[Path]:
    if not changelog_root.exists():
        return []
    return sorted(path for path in changelog_root.glob("*.md") if path.is_file())


def _collect_canonical_changelog_files(changelog_root: Path) -> list[Path]:
    if not changelog_root.exists():
        return []
    return sorted(path for path in changelog_root.glob("*/*.changelog.md") if path.is_file())


def validate_repository(repo_root: Path) -> list[str]:
    changelog_root = repo_root / ".agents" / "changelogs"
    errors: list[str] = []

    for path in _collect_loose_changelog_files(changelog_root):
        errors.append(
            "loose changelog file outside monthly directory: "
            f"{_relative(path, repo_root)}"
        )

    canonical_files = _collect_canonical_changelog_files(changelog_root)
    for path in canonical_files:
        for error in validate_file(path):
            errors.append(f"{_relative(path, repo_root)}: {error}")

    if changelog_root.exists() and not canonical_files and not errors:
        errors.append("no canonical changelog files found under `.agents/changelogs/YYYY-MM/`")

    return errors


def validate(path: Path) -> list[str]:
    if path.is_dir():
        return validate_repository(path)
    return validate_file(path)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Validate daily operational changelog files against the scaffold contract."
    )
    parser.add_argument(
        "path",
        type=Path,
        help="path to a `AAAAMMDD.changelog.md` file or to a repository root",
    )
    args = parser.parse_args()
    try:
        errors = validate(args.path)
    except FileNotFoundError as error:
        print(str(error), file=sys.stderr)
        return 2
    if errors:
        print(f"changelog contract violations in {args.path}:", file=sys.stderr)
        for error in errors:
            print(f"  - {error}", file=sys.stderr)
        return 1
    print(f"ok: {args.path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
