#!/usr/bin/env python3
"""Validate durable Markdown metadata and index connectivity.

This validator is intentionally deterministic and conservative. It checks the
documentation files selected by the caller for:

1. required YAML frontmatter fields, defaulting to `doc_role`;
2. outbound local-link durability by delegating to validate_durable_links.py;
3. inbound reachability from OBSIDIAN.md when OBSIDIAN.md exists;
4. optional docs/ governance when --enforce-docs-governance is passed.

Root-level operational contract files such as README.md, AGENTS.md,
CONTRIBUTING.md, SOUL.md, and OBSIDIAN.md are not forced to adopt YAML
frontmatter by default. Skill-facing SKILL.md files and historical
CHANGELOG.md files are also exempt. Generated support Markdown files under a
`generated/` directory are exempt unless they are the local README manifest.
All other scanned Markdown files are treated as durable documentation
candidates.

Exit codes:
- 0: metadata, durable links, and index connectivity pass
- 1: at least one documentation metadata or connection violation was found
- 2: usage or repository error

Usage:
    python scripts/validate_documentation_metadata.py --repo-root . docs OBSIDIAN.md
    python scripts/validate_documentation_metadata.py --repo-root . docs --required-field title --required-field doc_role
    python scripts/validate_documentation_metadata.py --repo-root . docs --enforce-docs-governance
    python scripts/validate_documentation_metadata.py --repo-root . docs/path/to/file.md
"""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
import tomllib
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, Iterator, NoReturn
from urllib.parse import unquote


FRONTMATTER_RE = re.compile(r"\A---\r?\n(?P<body>.*?)\r?\n---(?:\r?\n|$)", re.DOTALL)
INLINE_LINK_RE = re.compile(r"!?\[[^\]\n]*\]\(([^)\n]+)\)")
REFERENCE_DEF_RE = re.compile(r"^\s{0,3}\[[^\]\n]+\]:\s*(\S+)")
WIKILINK_RE = re.compile(r"!?\[\[([^\]\n]+)\]\]")
HTML_LINK_RE = re.compile(r"\b(?:href|src)=[\"']([^\"']+)[\"']", re.IGNORECASE)
REPO_ACRONYM_RE = re.compile(r"\A[A-Z][A-Z0-9-]*\Z")
DOCS_CANONICAL_NAME_TEMPLATE = "{repo_acronym}-{number}-{slug}.md"
DOCS_CANONICAL_NAME_RE_TEMPLATE = r"\A{repo_acronym}-\d{{3}}-[a-z0-9]+(?:-[a-z0-9]+)*\.md\Z"
DEFAULT_REQUIRED_FIELDS = ("doc_role",)
DEFAULT_DOC_ROOTS = (
    "docs",
    ".agents/bug-analysis",
    ".agents/incidents",
    ".agents/production-changes",
    ".agents/security-analysis",
    ".agents/security-scans",
    ".agents/security-reviews",
)
ROOT_METADATA_OPTIONAL = {
    "AGENTS.md",
    "CLAUDE.md",
    "CONTRIBUTING.md",
    "OBSIDIAN.md",
    "README.md",
    "REPOSITORY-OVERVIEW.md",
    "SOUL.md",
}
ALWAYS_EXEMPT_FILENAMES = {"CHANGELOG.md", "SKILL.md"}
DOCS_GOVERNANCE_CONFIG = Path(".agents/documentation.toml")
DOCS_INDEX_PATH = Path("docs/README.md")
PROTECTED_RELEASE_DIRS = {
    Path("docs/releases"),
    Path("docs/release-notes"),
}


@dataclass(frozen=True)
class ValidationTarget:
    path: Path
    relative_path: str
    frontmatter_required: bool


def _fail(message: str, code: int = 2) -> NoReturn:
    print(f"[validate_documentation_metadata] error: {message}", file=sys.stderr)
    sys.exit(code)


def _default_paths(repo_root: Path) -> list[Path]:
    paths = [repo_root / root for root in DEFAULT_DOC_ROOTS if (repo_root / root).exists()]
    obsidian = repo_root / "OBSIDIAN.md"
    if obsidian.exists():
        paths.append(obsidian)
    return paths


def _markdown_files(paths: Iterable[Path]) -> list[Path]:
    files: list[Path] = []
    for path in paths:
        if path.is_dir():
            files.extend(
                child
                for child in sorted(path.rglob("*.md"))
                if ".git" not in child.parts
            )
        elif path.is_file():
            files.append(path)
        else:
            _fail(f"documentation path not found: {path}")
    return sorted(dict.fromkeys(path.resolve() for path in files))


def _relative_path(repo_root: Path, path: Path) -> str:
    try:
        return path.relative_to(repo_root).as_posix()
    except ValueError:
        _fail(f"documentation path is outside repo root: {path}")


def _frontmatter_required(repo_root: Path, path: Path) -> bool:
    rel_path = _relative_path(repo_root, path)
    if path.name in ALWAYS_EXEMPT_FILENAMES:
        return False
    if "/" not in rel_path and path.name in ROOT_METADATA_OPTIONAL:
        return False
    if "generated" in Path(rel_path).parts and path.name != "README.md":
        return False
    return True


def _collect_targets(repo_root: Path, paths: Iterable[Path]) -> list[ValidationTarget]:
    targets: list[ValidationTarget] = []
    for path in _markdown_files(paths):
        targets.append(
            ValidationTarget(
                path=path,
                relative_path=_relative_path(repo_root, path),
                frontmatter_required=_frontmatter_required(repo_root, path),
            )
        )
    return targets


def _parse_frontmatter(text: str) -> dict[str, str] | None:
    match = FRONTMATTER_RE.search(text)
    if not match:
        return None

    fields: dict[str, str] = {}
    for raw_line in match.group("body").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or ":" not in line:
            continue
        key, value = line.split(":", 1)
        fields[key.strip()] = value.strip()
    return fields


def _load_repo_acronym(repo_root: Path, config_path: Path, override: str | None) -> tuple[str | None, list[str]]:
    if override:
        acronym = override.strip()
        if not REPO_ACRONYM_RE.fullmatch(acronym):
            return None, [f"--repo-acronym must match {REPO_ACRONYM_RE.pattern}: {override}"]
        return acronym, []

    full_config_path = config_path if config_path.is_absolute() else repo_root / config_path
    if not full_config_path.exists():
        return None, [
            (
                f"{config_path.as_posix()}: missing repo_acronym; create the config or pass "
                "--repo-acronym before enforcing docs governance"
            )
        ]

    try:
        data = tomllib.loads(full_config_path.read_text(encoding="utf-8"))
    except tomllib.TOMLDecodeError as exc:
        return None, [f"{config_path.as_posix()}: invalid TOML: {exc}"]

    acronym = str(data.get("repo_acronym", "")).strip()
    if not acronym:
        return None, [f"{config_path.as_posix()}: missing repo_acronym"]
    if not REPO_ACRONYM_RE.fullmatch(acronym):
        return None, [f"{config_path.as_posix()}: repo_acronym must match {REPO_ACRONYM_RE.pattern}: {acronym}"]
    return acronym, []


def _validate_frontmatter(
    targets: list[ValidationTarget], required_fields: tuple[str, ...]
) -> list[str]:
    violations: list[str] = []
    for target in targets:
        if not target.frontmatter_required:
            continue
        text = target.path.read_text(encoding="utf-8")
        fields = _parse_frontmatter(text)
        if fields is None:
            violations.append(f"{target.relative_path}: missing YAML frontmatter")
            continue
        for field in required_fields:
            value = fields.get(field, "").strip()
            if not value:
                violations.append(
                    f"{target.relative_path}: missing required frontmatter field '{field}'"
                )
    return violations


def _is_docs_path(relative_path: str) -> bool:
    path = Path(relative_path)
    return path.parts[:1] == ("docs",)


def _is_protected_release_manifest(relative_path: str) -> bool:
    path = Path(relative_path)
    if path.suffix.lower() != ".md":
        return False
    if not path.stem.isdigit():
        return False
    return any(path.parent == release_dir for release_dir in PROTECTED_RELEASE_DIRS)


def _validate_docs_governance(
    repo_root: Path,
    targets: list[ValidationTarget],
    *,
    repo_acronym: str | None,
    acronym_violations: list[str],
) -> list[str]:
    docs_root = repo_root / "docs"
    if not docs_root.exists():
        return []

    violations = list(acronym_violations)
    docs_readme = repo_root / DOCS_INDEX_PATH
    if not docs_readme.is_file():
        violations.append(
            f"{DOCS_INDEX_PATH.as_posix()}: missing unique docs index; create docs/README.md"
        )

    docs_targets = [target for target in targets if _is_docs_path(target.relative_path)]
    nested_readmes = [
        target.relative_path
        for target in docs_targets
        if Path(target.relative_path).name == "README.md" and target.relative_path != DOCS_INDEX_PATH.as_posix()
    ]
    for relative_path in nested_readmes:
        violations.append(
            f"{relative_path}: extra README.md under docs; keep docs/README.md as the unique docs index"
        )

    for target in docs_targets:
        relative = target.relative_path
        path = Path(relative)
        if _is_protected_release_manifest(relative):
            continue
        if relative == DOCS_INDEX_PATH.as_posix():
            continue
        if path.name == "README.md":
            continue
        if len(path.parts) == 2:
            violations.append(
                f"{relative}: loose docs file must be moved to a semantic subdirectory"
            )
            continue
        if repo_acronym is None:
            continue
        canonical_re = re.compile(
            DOCS_CANONICAL_NAME_RE_TEMPLATE.format(repo_acronym=re.escape(repo_acronym))
        )
        if not canonical_re.fullmatch(path.name):
            expected = DOCS_CANONICAL_NAME_TEMPLATE.format(
                repo_acronym=repo_acronym,
                number="NNN",
                slug="slug",
            )
            violations.append(
                f"{relative}: docs filename must match {expected}"
            )

    return violations


def _split_markdown_destination(raw: str) -> str:
    value = raw.strip()
    if value.startswith("<"):
        closing = value.find(">")
        if closing != -1:
            return value[1:closing].strip()
    return value.split()[0].strip()


def _normalize_index_target(raw: str) -> str:
    value = raw.strip()
    if value.startswith("<") and ">" in value:
        value = value[1 : value.find(">")]
    value = value.split("|", 1)[0]
    value = value.split("#", 1)[0].split("?", 1)[0]
    value = unquote(value.strip()).replace("\\", "/")
    if value.startswith("./"):
        value = value[2:]
    return value.strip("/")


def _iter_index_targets(obsidian_path: Path) -> Iterator[str]:
    text = obsidian_path.read_text(encoding="utf-8")
    in_fence = False
    for line in text.splitlines():
        if line.strip().startswith("```"):
            in_fence = not in_fence
            continue
        if in_fence:
            continue
        for match in INLINE_LINK_RE.finditer(line):
            yield _normalize_index_target(_split_markdown_destination(match.group(1)))
        reference_match = REFERENCE_DEF_RE.match(line)
        if reference_match:
            yield _normalize_index_target(_split_markdown_destination(reference_match.group(1)))
        for match in WIKILINK_RE.finditer(line):
            yield _normalize_index_target(match.group(1))
        for match in HTML_LINK_RE.finditer(line):
            yield _normalize_index_target(match.group(1))


def _target_indexed(target: ValidationTarget, index_targets: set[str]) -> bool:
    relative = target.relative_path
    without_suffix = str(Path(relative).with_suffix("")).replace("\\", "/")
    name = Path(relative).name
    stem = Path(relative).stem
    candidates = {relative, without_suffix, name, stem}
    return bool(candidates & index_targets)


def _validate_obsidian_reachability(
    repo_root: Path,
    targets: list[ValidationTarget],
    *,
    obsidian_path: Path,
) -> list[str]:
    if not obsidian_path.exists():
        return []

    index_targets = {target for target in _iter_index_targets(obsidian_path) if target}
    obsidian_rel = _relative_path(repo_root, obsidian_path.resolve())
    violations: list[str] = []
    for target in targets:
        if not target.frontmatter_required:
            continue
        if target.relative_path == obsidian_rel:
            continue
        if not _target_indexed(target, index_targets):
            violations.append(
                f"{obsidian_rel}: missing index connection to {target.relative_path}"
            )
    return violations


def _durable_links_script() -> Path:
    return Path(__file__).resolve().parents[1] / "validate_durable_links.py"


def _validate_durable_links(repo_root: Path, paths: list[Path]) -> tuple[list[str], list[str]]:
    script = _durable_links_script()
    if not script.exists():
        return [], [f"{script}: durable link validator is not available"]

    result = subprocess.run(
        [
            sys.executable,
            str(script),
            "--repo-root",
            str(repo_root),
            *(str(path) for path in paths),
        ],
        capture_output=True,
        text=True,
        check=False,
    )
    messages = [line for line in result.stdout.splitlines() if line.strip()]
    if result.returncode == 0:
        return messages, []
    violations = [line for line in result.stderr.splitlines() if line.strip()]
    if not violations:
        violations = [line for line in result.stdout.splitlines() if line.strip()]
    return messages, [f"durable link validation failed: {line}" for line in violations]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "paths",
        nargs="*",
        type=Path,
        help="Markdown files or directories to scan. Defaults to durable documentation roots when present.",
    )
    parser.add_argument(
        "--repo-root",
        type=Path,
        default=Path("."),
        help="Repository root used to resolve documentation paths.",
    )
    parser.add_argument(
        "--required-field",
        action="append",
        dest="required_fields",
        help="Required YAML frontmatter field. Repeat to override the default doc_role requirement.",
    )
    parser.add_argument(
        "--obsidian",
        type=Path,
        default=Path("OBSIDIAN.md"),
        help="OBSIDIAN.md path relative to the repo root for inbound index checks.",
    )
    parser.add_argument(
        "--skip-links",
        action="store_true",
        help="Skip outbound durable-link validation.",
    )
    parser.add_argument(
        "--skip-index",
        action="store_true",
        help="Skip inbound OBSIDIAN.md reachability validation.",
    )
    parser.add_argument(
        "--enforce-docs-governance",
        action="store_true",
        help="Validate docs/ index, root-file organization, protected release manifests, and canonical filenames.",
    )
    parser.add_argument(
        "--repo-acronym",
        help="Explicit repository acronym for docs filename governance. Overrides .agents/documentation.toml.",
    )
    parser.add_argument(
        "--docs-governance-config",
        type=Path,
        default=DOCS_GOVERNANCE_CONFIG,
        help="Repository-local TOML config carrying repo_acronym for docs governance.",
    )
    args = parser.parse_args()

    repo_root = args.repo_root.resolve()
    if not repo_root.is_dir():
        _fail(f"repo root is not a directory: {repo_root}")

    requested_paths = args.paths or _default_paths(repo_root)
    if not requested_paths:
        _fail("no durable documentation paths found; pass at least one Markdown file or directory")
    scan_roots = [
        path.resolve() if path.is_absolute() else (repo_root / path).resolve()
        for path in requested_paths
    ]
    targets = _collect_targets(repo_root, scan_roots)
    required_fields = tuple(args.required_fields or DEFAULT_REQUIRED_FIELDS)
    violations: list[str] = []
    ok_messages: list[str] = []

    violations.extend(_validate_frontmatter(targets, required_fields))

    if args.enforce_docs_governance:
        repo_acronym, acronym_violations = _load_repo_acronym(
            repo_root,
            args.docs_governance_config,
            args.repo_acronym,
        )
        violations.extend(
            _validate_docs_governance(
                repo_root,
                targets,
                repo_acronym=repo_acronym,
                acronym_violations=acronym_violations,
            )
        )

    if not args.skip_index:
        obsidian_path = args.obsidian
        full_obsidian_path = obsidian_path if obsidian_path.is_absolute() else repo_root / obsidian_path
        violations.extend(
            _validate_obsidian_reachability(
                repo_root,
                targets,
                obsidian_path=full_obsidian_path.resolve(),
            )
        )

    if not args.skip_links:
        durable_messages, durable_violations = _validate_durable_links(repo_root, scan_roots)
        ok_messages.extend(durable_messages)
        violations.extend(durable_violations)

    if violations:
        print(
            f"[validate_documentation_metadata] FAILED with {len(violations)} violation(s):",
            file=sys.stderr,
        )
        for item in violations:
            print(f"  - {item}", file=sys.stderr)
        return 1

    for message in ok_messages:
        print(message)
    checked = len(targets)
    frontmatter_checked = sum(1 for target in targets if target.frontmatter_required)
    print(
        "[validate_documentation_metadata] OK: "
        f"{checked} file(s), {frontmatter_checked} frontmatter candidate(s) validated"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
