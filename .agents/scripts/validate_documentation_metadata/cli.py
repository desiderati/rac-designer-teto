#!/usr/bin/env python3
"""Validate durable Markdown metadata and index connectivity.

This validator is intentionally deterministic and conservative. It checks the
documentation files selected by the caller for:

1. required YAML frontmatter fields, defaulting to `title` and `doc_role`;
2. outbound local-link durability by delegating to validate_durable_links.py;
3. transitive inbound reachability from OBSIDIAN.md for knowledge under docs/
   when OBSIDIAN.md exists;
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
    python scripts/documentation_validate_metadata.py --repo-root . docs OBSIDIAN.md
    python scripts/documentation_validate_metadata.py --repo-root . docs \
        --required-field title --required-field doc_role
    python scripts/documentation_validate_metadata.py --repo-root . docs --enforce-docs-governance
    python scripts/documentation_validate_metadata.py --repo-root . docs/path/to/file.md
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
import tomllib
import unicodedata
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, Iterator, NoReturn
from urllib.parse import unquote


FRONTMATTER_RE = re.compile(r"\A---\r?\n(?P<body>.*?)\r?\n---(?:\r?\n|$)", re.DOTALL)
INLINE_LINK_RE = re.compile(r"!?\[[^\]]*\]\(([^)\r\n]+)\)")
REFERENCE_DEF_RE = re.compile(r"^\s{0,3}\[[^\]\r\n]+\]:\s*(\S+)", re.MULTILINE)
REFERENCE_DEF_WITH_ID_RE = re.compile(
    r"^\s{0,3}\[(?P<id>[^\]\r\n]+)\]:\s*(?P<target>\S+)",
    re.MULTILINE,
)

VISIBLE_NAVIGATION_LINK_RE = re.compile(
    r"(?P<inline>(?<!\!)\[(?P<inline_label>[^\]]*)\]"
    r"\((?P<inline_target>[^)\r\n]+)\))"
    r"|(?P<reference>(?<!\!)\[(?P<reference_label>[^\]]+)\]"
    r"\[(?P<reference_id>[^\]]*)\])"
    r"|(?P<wikilink>(?<!\!)\[\[(?P<wikilink_target>[^\]\r\n]+)\]\])"
)

WIKILINK_RE = re.compile(r"!?\[\[([^\]\n]+)\]\]")
HTML_LINK_RE = re.compile(r"\b(?:href|src)=[\"']([^\"']+)[\"']", re.IGNORECASE)
FENCE_OPEN_RE = re.compile(r"^\s{0,3}(?P<fence>`{3,}|~{3,})")
REPO_ACRONYM_RE = re.compile(r"\A[A-Z][A-Z0-9-]*\Z")
DOCS_CANONICAL_NAME = "SIGLA-NNN[N]-slug.md"
DOCS_CANONICAL_NAME_RE = re.compile(
    r"\A(?P<sigla>[A-Z][A-Z0-9]*)-(?P<number>\d{3,4})-"
    r"[a-z0-9]+(?:-[a-z0-9]+)*"
    r"(?:\.[a-z0-9]+(?:-[a-z0-9]+)*)?\.md\Z"
)

DOCUMENT_ID_RE = re.compile(r"\A(?P<sigla>[A-Z][A-Z0-9]*)-(?P<number>\d{3,4})\Z")
STRUCTURED_PRD_NAME_RE = re.compile(
    r"\A(?P<sigla>PRD)-(?P<number>\d{3,4})-"
    r"(?P<slug>[a-z0-9]+(?:-[a-z0-9]+)*)\.prd\.json\Z"
)

LOOSE_SUPPORT_SUFFIXES = {".mmd", ".puml", ".txt"}
DEFAULT_REQUIRED_FIELDS = ("title", "doc_role")
DEFAULT_DOC_ROOTS = (
    "docs",
    ".agents/bug-analysis",
    ".agents/incidents",
    ".agents/production-changes",
    ".agents/risk-assessments",
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
NAVIGATION_SURFACES = (Path("README.md"), Path("OBSIDIAN.md"), DOCS_INDEX_PATH)
DURABLE_RECORD_PREFIXES = tuple(
    f"{root}/" for root in DEFAULT_DOC_ROOTS if root.startswith(".agents/")
)

OPAQUE_NAVIGATION_LABEL_RE = re.compile(
    r"\A(?:BUG|INC|PROD|RISK|SEC)-[A-Z0-9]+(?:-[A-Z0-9]+)*\Z",
    re.IGNORECASE,
)

PROTECTED_RELEASE_DIRS = {
    Path("docs/releases"),
    Path("docs/release-notes"),
}

CANONICAL_RELEASE_NOTES_DIR = Path("docs/release-notes")
LEGACY_RELEASE_NOTES_DIR = Path("docs/releases-notes")
SUPERPOWERS_OWNED_FILENAME_PATTERNS = (
    re.compile(
        r"\Adocs/superpowers/plans/"
        r"\d{4}-\d{2}-\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*\.md\Z"
    ),
    re.compile(
        r"\Adocs/superpowers/specs/"
        r"\d{4}-\d{2}-\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*-design\.md\Z"
    ),
)


@dataclass(frozen=True)
class ValidationTarget:
    path: Path
    relative_path: str
    frontmatter_required: bool


@dataclass(frozen=True)
class DocsGovernancePolicy:
    repo_acronym: str | None
    allowed_nested_readmes: frozenset[str]
    allowed_duplicate_identities: frozenset[tuple[str, int]]
    filename_patterns: tuple[re.Pattern[str], ...]


def _fail(message: str, code: int = 2) -> NoReturn:
    print(f"[validate_documentation_metadata] error: {message}", file=sys.stderr)
    sys.exit(code)


def _default_paths(repo_root: Path) -> list[Path]:
    paths = [
        repo_root / root for root in DEFAULT_DOC_ROOTS if (repo_root / root).exists()
    ]

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
    rel_parts = Path(rel_path).parts
    if path.name in ALWAYS_EXEMPT_FILENAMES:
        return False

    if "/" not in rel_path and path.name in ROOT_METADATA_OPTIONAL:
        return False

    if "generated" in rel_parts and path.name != "README.md":
        return False

    if rel_parts[:2] == ("docs", "documentation-assets"):
        return False

    if any(part.endswith(".assets") for part in rel_parts):
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


def _validate_repo_acronym(acronym: str, source: str) -> list[str]:
    if not acronym:
        return [f"{source}: missing repo_acronym"]

    if not REPO_ACRONYM_RE.fullmatch(acronym):
        return [
            f"{source}: repo_acronym must match {REPO_ACRONYM_RE.pattern}: {acronym}"
        ]

    return []


def _read_string_list(
    data: object,
    field_name: str,
    *,
    normalize_paths: bool = False,
) -> tuple[list[str], list[str]]:
    if data is None:
        return [], []

    if not isinstance(data, list):
        return [], [f"{field_name}: expected a list of strings"]

    values: list[str] = []
    violations: list[str] = []
    for index, item in enumerate(data):
        if not isinstance(item, str):
            violations.append(f"{field_name}[{index}]: expected a string")
            continue

        value = item.strip()
        if normalize_paths:
            value = value.replace("\\", "/").strip("/")

        if not value:
            violations.append(f"{field_name}[{index}]: value cannot be blank")
            continue

        values.append(value)

    return values, violations


def _compile_filename_patterns(
    raw_patterns: list[str],
    field_name: str,
) -> tuple[tuple[re.Pattern[str], ...], list[str]]:
    patterns: list[re.Pattern[str]] = []
    violations: list[str] = []
    for index, raw_pattern in enumerate(raw_patterns):
        try:
            patterns.append(re.compile(raw_pattern))
        except re.error as exc:
            violations.append(f"{field_name}[{index}]: invalid regex: {exc}")

    return tuple(patterns), violations


def _load_docs_governance_policy(
    repo_root: Path,
    config_path: Path,
    override: str | None,
) -> tuple[DocsGovernancePolicy | None, list[str]]:
    override_acronym: str | None = None
    if override:
        override_acronym = override.strip()
        violations = _validate_repo_acronym(override_acronym, "--repo-acronym")
        if violations:
            return None, violations

    full_config_path = (
        config_path if config_path.is_absolute() else repo_root / config_path
    )

    if not full_config_path.exists():
        return DocsGovernancePolicy(
            repo_acronym=override_acronym,
            allowed_nested_readmes=frozenset(),
            allowed_duplicate_identities=frozenset(),
            filename_patterns=tuple(),
        ), []

    try:
        data = tomllib.loads(full_config_path.read_text(encoding="utf-8"))
    except tomllib.TOMLDecodeError as exc:
        return None, [f"{config_path.as_posix()}: invalid TOML: {exc}"]

    configured_acronym = str(data.get("repo_acronym", "")).strip() or None
    acronym = override_acronym or configured_acronym
    violations: list[str] = []
    if configured_acronym:
        violations.extend(
            _validate_repo_acronym(configured_acronym, config_path.as_posix())
        )

    docs_governance = data.get("docs_governance", {})
    if docs_governance is None:
        docs_governance = {}

    if not isinstance(docs_governance, dict):
        violations.append(f"{config_path.as_posix()}: docs_governance must be a table")
        docs_governance = {}

    allowed_nested_readmes, readme_violations = _read_string_list(
        docs_governance.get("allowed_nested_readmes"),
        "docs_governance.allowed_nested_readmes",
        normalize_paths=True,
    )

    violations.extend(readme_violations)

    raw_duplicate_identities, identity_violations = _read_string_list(
        docs_governance.get("allowed_duplicate_identities"),
        "docs_governance.allowed_duplicate_identities",
    )

    violations.extend(identity_violations)
    allowed_duplicate_identities: set[tuple[str, int]] = set()
    for index, identity in enumerate(raw_duplicate_identities):
        match = DOCUMENT_ID_RE.fullmatch(identity)
        if match is None:
            violations.append(
                "docs_governance.allowed_duplicate_identities"
                f"[{index}]: expected SIGLA-NNN or SIGLA-NNNN: {identity}"
            )

            continue

        allowed_duplicate_identities.add(
            (match.group("sigla"), int(match.group("number")))
        )

    raw_filename_patterns, filename_pattern_violations = _read_string_list(
        docs_governance.get("filename_patterns"),
        "docs_governance.filename_patterns",
    )

    violations.extend(filename_pattern_violations)
    filename_patterns, regex_violations = _compile_filename_patterns(
        raw_filename_patterns,
        "docs_governance.filename_patterns",
    )

    violations.extend(regex_violations)

    if violations:
        return None, violations

    return DocsGovernancePolicy(
        repo_acronym=acronym,
        allowed_nested_readmes=frozenset(allowed_nested_readmes),
        allowed_duplicate_identities=frozenset(allowed_duplicate_identities),
        filename_patterns=filename_patterns,
    ), []


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


def _is_docs_support_path(relative_path: str) -> bool:
    parts = Path(relative_path).parts
    return parts[:2] == ("docs", "documentation-assets") or any(
        part.endswith(".assets") for part in parts
    )


def _is_protected_release_manifest(relative_path: str) -> bool:
    path = Path(relative_path)
    if path.suffix.lower() != ".md":
        return False

    if not path.stem.isdigit():
        return False

    return any(path.parent == release_dir for release_dir in PROTECTED_RELEASE_DIRS)


def _is_superpowers_owned_filename(relative_path: str) -> bool:
    return any(
        pattern.fullmatch(relative_path)
        for pattern in SUPERPOWERS_OWNED_FILENAME_PATTERNS
    )


def _validate_release_notes_contract(repo_root: Path) -> list[str]:
    violations: list[str] = []
    legacy_directory = repo_root / LEGACY_RELEASE_NOTES_DIR
    if legacy_directory.exists():
        violations.append(
            f"{LEGACY_RELEASE_NOTES_DIR.as_posix()}: legacy directory must be normalized to "
            f"{CANONICAL_RELEASE_NOTES_DIR.as_posix()}"
        )

    release_notes_directory = repo_root / CANONICAL_RELEASE_NOTES_DIR
    if not release_notes_directory.exists():
        return violations

    for entry in sorted(release_notes_directory.rglob("*")):
        relative = _relative_path(repo_root, entry.resolve())
        is_direct_numeric_markdown = (
            entry.is_file()
            and entry.parent == release_notes_directory
            and re.fullmatch(r"[0-9]+\.md", entry.name) is not None
        )

        if not is_direct_numeric_markdown:
            violations.append(
                f"{relative}: docs/release-notes accepts only direct numeric Markdown files "
                "(docs/release-notes/NN.md)"
            )

    return violations


def _nearest_parent_index(repo_root: Path, nested_readme: Path) -> Path:
    docs_root = repo_root / "docs"
    current = nested_readme.parent.parent
    while current != docs_root.parent:
        candidate = current / "README.md"
        if candidate.is_file():
            return candidate

        if current == docs_root:
            break

        current = current.parent

    return docs_root / "README.md"


def _direct_markdown_links(repo_root: Path, source: Path) -> set[str]:
    source_relative = _relative_path(repo_root, source.resolve())
    links: set[str] = set()
    for raw_target in _iter_markdown_targets(source):
        resolved = _resolve_local_markdown_target(
            repo_root, source_relative, raw_target
        )

        if resolved:
            links.add(resolved)

    return links


def _validate_nested_docs_indices(
    repo_root: Path, policy: DocsGovernancePolicy
) -> list[str]:
    docs_root = repo_root / "docs"
    violations: list[str] = []
    nested_readmes = sorted(
        path
        for path in docs_root.rglob("README.md")
        if path != docs_root / "README.md"
        and not _is_docs_support_path(_relative_path(repo_root, path))
    )

    for nested_readme in nested_readmes:
        relative = _relative_path(repo_root, nested_readme)
        if relative in policy.allowed_nested_readmes:
            continue

        parent_index = _nearest_parent_index(repo_root, nested_readme)
        parent_relative = _relative_path(repo_root, parent_index)
        parent_links = (
            _direct_markdown_links(repo_root, parent_index)
            if parent_index.is_file()
            else set()
        )

        if relative not in parent_links:
            violations.append(
                f"{relative}: nested index is not connected from parent index {parent_relative}"
            )

        nested_links = _collect_transitive_index_targets(repo_root, nested_readme)
        nested_directory = Path(relative).parent
        links_to_subtree_document = False
        for linked in nested_links:
            linked_path = Path(linked)
            if linked_path.name == "README.md" or _is_docs_support_path(linked):
                continue

            try:
                linked_path.relative_to(nested_directory)
            except ValueError:
                continue

            links_to_subtree_document = True
            break

        if not links_to_subtree_document:
            violations.append(
                f"{relative}: nested index does not link to a document in its subtree"
            )

    return violations


def _owner_links_asset_directory(
    repo_root: Path, owner: Path, asset_directory: Path
) -> bool:
    owner_relative = _relative_path(repo_root, owner.resolve())
    asset_relative = Path(_relative_path(repo_root, asset_directory.resolve()))
    for raw_target in _iter_markdown_targets(owner):
        resolved = _resolve_local_target_path(repo_root, owner_relative, raw_target)
        if resolved is None:
            continue

        if resolved == asset_relative or asset_relative in resolved.parents:
            return True

    return False


def _validate_asset_directory(
    repo_root: Path,
    asset_directory: Path,
    owner: Path,
) -> list[str]:
    asset_relative = _relative_path(repo_root, asset_directory.resolve())
    owner_relative = (
        _relative_path(repo_root, owner.resolve())
        if owner.exists()
        else _relative_path(repo_root, owner)
    )

    if not owner.is_file():
        return [
            f"{asset_relative}: orphan asset directory has no owner {owner_relative}"
        ]

    if not _owner_links_asset_directory(repo_root, owner, asset_directory):
        return [
            f"{asset_relative}: asset directory is not linked by owner {owner_relative}"
        ]

    return []


def _validate_docs_assets(repo_root: Path) -> list[str]:
    docs_root = repo_root / "docs"
    violations: list[str] = []
    central_root = docs_root / "documentation-assets"
    if central_root.is_dir():
        for child in sorted(central_root.iterdir()):
            child_relative = _relative_path(repo_root, child.resolve())
            if not child.is_dir():
                violations.append(
                    (
                        f"{child_relative}: documentation-assets must contain one directory "
                        "per root document"
                    )
                )

                continue

            owner = docs_root / f"{child.name}.md"
            violations.extend(_validate_asset_directory(repo_root, child, owner))

    adjacent_asset_directories = sorted(
        path
        for path in docs_root.rglob("*.assets")
        if path.is_dir() and central_root not in path.parents
    )

    for asset_directory in adjacent_asset_directories:
        owner_name = f"{asset_directory.name.removesuffix('.assets')}.md"
        owner = asset_directory.parent / owner_name
        asset_relative = _relative_path(repo_root, asset_directory.resolve())
        if asset_directory.parent == docs_root:
            violations.append(
                (
                    f"{asset_relative}: root document assets must use "
                    f"docs/documentation-assets/{asset_directory.name.removesuffix('.assets')}"
                )
            )

        violations.extend(_validate_asset_directory(repo_root, asset_directory, owner))

    return violations


def _is_structured_prd(path: Path) -> bool:
    return path.name.endswith(".prd.json")


def _validate_structured_prds(repo_root: Path) -> list[str]:
    docs_root = repo_root / "docs"
    violations: list[str] = []
    for path in sorted(docs_root.rglob("*.prd.json")):
        relative = _relative_path(repo_root, path.resolve())
        match = STRUCTURED_PRD_NAME_RE.fullmatch(path.name)
        if match is None:
            violations.append(
                f"{relative}: structured PRD filename must match PRD-NNN[N]-slug.prd.json"
            )

            continue

        raw = path.read_bytes()
        if raw.startswith(b"\xef\xbb\xbf"):
            violations.append(f"{relative}: UTF-8 BOM is not allowed")
            raw = raw[3:]

        try:
            text = raw.decode("utf-8")
        except UnicodeDecodeError as exc:
            violations.append(f"{relative}: invalid UTF-8 at byte {exc.start}")
            continue

        if unicodedata.normalize("NFC", text) != text:
            violations.append(f"{relative}: content must use Unicode NFC normalization")

        try:
            payload = json.loads(text)
        except json.JSONDecodeError as exc:
            violations.append(
                f"{relative}: invalid JSON: {exc.msg} at line {exc.lineno}"
            )

            continue

        metadata = payload.get("metadata") if isinstance(payload, dict) else None
        if not isinstance(metadata, dict):
            violations.append(f"{relative}: missing object metadata")
            continue

        expected_id = f"{match.group('sigla')}-{match.group('number')}"
        if metadata.get("id") != expected_id:
            violations.append(
                f"{relative}: metadata.id must equal filename identity {expected_id}"
            )

        for field in ("title", "status"):
            value = metadata.get(field)
            if not isinstance(value, str) or not value.strip():
                violations.append(
                    f"{relative}: metadata.{field} must be a non-empty string"
                )

    return violations


def _validate_document_id_uniqueness(
    repo_root: Path,
    allowed_duplicates: frozenset[tuple[str, int]],
) -> list[str]:
    docs_root = repo_root / "docs"
    identities: dict[tuple[str, int], list[str]] = {}
    for path in sorted(docs_root.rglob("*.md")):
        relative = _relative_path(repo_root, path.resolve())
        if _is_docs_support_path(relative) or _is_protected_release_manifest(relative):
            continue

        match = DOCS_CANONICAL_NAME_RE.fullmatch(path.name)
        if match:
            key = (match.group("sigla"), int(match.group("number")))
            identities.setdefault(key, []).append(relative)

    for path in sorted(docs_root.rglob("*.prd.json")):
        match = STRUCTURED_PRD_NAME_RE.fullmatch(path.name)
        if match:
            key = (match.group("sigla"), int(match.group("number")))
            identities.setdefault(key, []).append(
                _relative_path(repo_root, path.resolve())
            )

    return [
        f"{sigla}-{number:03d}: duplicate document identity: {', '.join(paths)}"
        for (sigla, number), paths in sorted(identities.items())
        if len(paths) > 1 and (sigla, number) not in allowed_duplicates
    ]


def _validate_loose_support_files(repo_root: Path) -> list[str]:
    docs_root = repo_root / "docs"
    violations: list[str] = []
    for path in sorted(docs_root.rglob("*")):
        if not path.is_file() or path.suffix.casefold() not in LOOSE_SUPPORT_SUFFIXES:
            continue

        relative = _relative_path(repo_root, path.resolve())
        if _is_docs_support_path(relative) or "generated" in Path(relative).parts:
            continue

        violations.append(
            f"{relative}: support artifact must be inside its owner's hybrid asset directory"
        )

    return violations


def _validate_orphan_adr_containers(repo_root: Path) -> list[str]:
    adr_root = repo_root / "docs" / "architecture-decisions"
    if not adr_root.is_dir():
        return []

    violations: list[str] = []
    for directory in sorted(path for path in adr_root.iterdir() if path.is_dir()):
        if not re.fullmatch(r"ADR-\d{3,4}-[a-z0-9]+(?:-[a-z0-9]+)*", directory.name):
            continue

        owner = adr_root / f"{directory.name}.md"
        if not owner.is_file():
            relative = _relative_path(repo_root, directory.resolve())
            violations.append(
                f"{relative}: ADR asset container has no owner Markdown {owner.name}"
            )

    return violations


def _validate_structured_document_reachability(repo_root: Path) -> list[str]:
    roots = [
        path
        for path in (repo_root / "OBSIDIAN.md", repo_root / DOCS_INDEX_PATH)
        if path.is_file()
    ]

    if not roots:
        return []

    reachable: set[str] = set()
    for root in roots:
        reachable.update(_collect_transitive_index_targets(repo_root, root))

    violations: list[str] = []
    for path in sorted((repo_root / "docs").rglob("*.prd.json")):
        relative = _relative_path(repo_root, path.resolve())
        if relative not in reachable:
            violations.append(
                f"{relative}: structured durable document is not reachable from a documentation index"
            )

    return violations


def _validate_docs_governance(
    repo_root: Path,
    *,
    policy: DocsGovernancePolicy | None,
    policy_violations: list[str],
) -> list[str]:
    docs_root = repo_root / "docs"
    if not docs_root.exists():
        return []

    violations = list(policy_violations)
    docs_readme = repo_root / DOCS_INDEX_PATH
    if not docs_readme.is_file():
        violations.append(
            f"{DOCS_INDEX_PATH.as_posix()}: missing root docs index; create docs/README.md"
        )

    if policy is None:
        return violations

    violations.extend(_validate_nested_docs_indices(repo_root, policy))
    violations.extend(_validate_docs_assets(repo_root))
    violations.extend(_validate_release_notes_contract(repo_root))
    violations.extend(_validate_structured_prds(repo_root))
    violations.extend(
        _validate_document_id_uniqueness(
            repo_root,
            policy.allowed_duplicate_identities,
        )
    )

    violations.extend(_validate_loose_support_files(repo_root))
    violations.extend(_validate_orphan_adr_containers(repo_root))
    violations.extend(_validate_structured_document_reachability(repo_root))

    docs_markdown = sorted(docs_root.rglob("*.md"))
    for markdown_path in docs_markdown:
        relative = _relative_path(repo_root, markdown_path.resolve())
        path = Path(relative)
        if _is_docs_support_path(relative):
            continue

        if _is_protected_release_manifest(relative):
            continue

        if relative == DOCS_INDEX_PATH.as_posix():
            continue

        if path.name == "README.md":
            continue

        if DOCS_CANONICAL_NAME_RE.fullmatch(path.name):
            continue

        if _is_superpowers_owned_filename(relative):
            continue

        if any(pattern.fullmatch(relative) for pattern in policy.filename_patterns):
            continue

        violations.append(f"{relative}: docs filename must match {DOCS_CANONICAL_NAME}")

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


def _iter_markdown_segments(markdown_path: Path) -> Iterator[str]:
    segment_lines: list[str] = []
    fence_marker: str | None = None
    fence_length = 0

    for line in markdown_path.read_text(encoding="utf-8").splitlines(keepends=True):
        line_without_ending = line.rstrip("\r\n")
        if fence_marker is not None:
            close_re = re.compile(
                rf"^\s{{0,3}}{re.escape(fence_marker)}{{{fence_length},}}\s*$"
            )

            if close_re.fullmatch(line_without_ending):
                fence_marker = None
                fence_length = 0

            continue

        fence_match = FENCE_OPEN_RE.match(line_without_ending)
        if fence_match:
            if segment_lines:
                yield "".join(segment_lines)
                segment_lines = []

            fence = fence_match.group("fence")
            fence_marker = fence[0]
            fence_length = len(fence)
            continue

        if not line_without_ending.strip():
            if segment_lines:
                yield "".join(segment_lines)
                segment_lines = []

            continue

        segment_lines.append(line)

    if segment_lines:
        yield "".join(segment_lines)


def _iter_markdown_targets(markdown_path: Path) -> Iterator[str]:
    for segment in _iter_markdown_segments(markdown_path):
        for match in INLINE_LINK_RE.finditer(segment):
            yield _normalize_index_target(_split_markdown_destination(match.group(1)))

        for match in REFERENCE_DEF_RE.finditer(segment):
            yield _normalize_index_target(_split_markdown_destination(match.group(1)))

        for match in WIKILINK_RE.finditer(segment):
            yield _normalize_index_target(match.group(1))

        for match in HTML_LINK_RE.finditer(segment):
            yield _normalize_index_target(match.group(1))


def _is_external_or_anchor_target(raw_target: str) -> bool:
    value = raw_target.strip()
    return (
        not value
        or value.startswith("#")
        or re.match(r"\A[a-zA-Z][a-zA-Z0-9+.-]*:", value) is not None
    )


def _normalize_relative_parts(path: Path) -> Path | None:
    parts: list[str] = []
    for part in path.parts:
        if part in ("", "."):
            continue

        if part == "..":
            if not parts:
                return None

            parts.pop()
            continue

        parts.append(part)

    return Path(*parts) if parts else Path(".")


def _resolve_local_target_path(
    repo_root: Path,
    source_relative_path: str,
    raw_target: str,
) -> Path | None:
    if _is_external_or_anchor_target(raw_target):
        return None

    normalized_target = _normalize_index_target(_split_markdown_destination(raw_target))
    if _is_external_or_anchor_target(normalized_target):
        return None

    target_path = Path(normalized_target)
    if target_path.is_absolute():
        target_path = Path(*target_path.parts[1:])
    elif target_path.parts and target_path.parts[0] in {
        ".agents",
        "docs",
        "graphify-out",
        "src",
    }:
        target_path = Path(*target_path.parts)
    else:
        target_path = Path(source_relative_path).parent / target_path

    target_path = _normalize_relative_parts(target_path)
    if target_path is None:
        return None

    return target_path


def _resolve_local_markdown_target(
    repo_root: Path,
    source_relative_path: str,
    raw_target: str,
) -> str | None:
    target_path = _resolve_local_target_path(
        repo_root, source_relative_path, raw_target
    )

    if target_path is None:
        return None

    absolute_target = repo_root / target_path
    if absolute_target.is_dir():
        readme = absolute_target / "README.md"
        if readme.is_file():
            return _relative_path(repo_root, readme.resolve())

        return None

    if absolute_target.is_file() and (
        absolute_target.suffix.lower() == ".md" or _is_structured_prd(absolute_target)
    ):
        return _relative_path(repo_root, absolute_target.resolve())

    if absolute_target.suffix == "":
        markdown_target = absolute_target.with_suffix(".md")
        if markdown_target.is_file():
            return _relative_path(repo_root, markdown_target.resolve())

    return None


def _navigation_fragment(raw_target: str) -> str:
    value = _split_markdown_destination(raw_target).strip()
    if value.startswith("<") and ">" in value:
        value = value[1 : value.find(">")]

    value = value.split("|", 1)[0]
    _, separator, fragment = value.partition("#")
    return unquote(fragment).strip().casefold() if separator else ""


def _resolve_navigation_wikilink(
    repo_root: Path,
    source_relative_path: str,
    raw_target: str,
) -> str | None:
    owner = raw_target.split("|", 1)[0].strip()
    normalized = _normalize_index_target(owner)
    if not normalized:
        return None

    if "/" in normalized or normalized.casefold().endswith(".md"):
        return _resolve_local_markdown_target(repo_root, source_relative_path, owner)

    matches = [
        _relative_path(repo_root, path.resolve())
        for path in repo_root.rglob("*.md")
        if ".git" not in path.parts and path.stem.casefold() == normalized.casefold()
    ]

    return matches[0] if len(matches) == 1 else None


def _visible_navigation_destinations(
    repo_root: Path,
    surface: Path,
) -> list[str]:
    relative = _relative_path(repo_root, surface.resolve())
    text = "\n".join(_iter_markdown_segments(surface))
    references = {
        " ".join(match.group("id").split()).casefold(): match.group("target")
        for match in REFERENCE_DEF_WITH_ID_RE.finditer(text)
    }

    destinations: list[str] = []
    for match in VISIBLE_NAVIGATION_LINK_RE.finditer(text):
        raw_target: str | None = None
        resolved: str | None = None
        if match.group("inline") is not None:
            raw_target = match.group("inline_target")
            resolved = _resolve_local_markdown_target(repo_root, relative, raw_target)
        elif match.group("reference") is not None:
            identifier = match.group("reference_id") or match.group("reference_label")
            raw_target = references.get(" ".join(identifier.split()).casefold())
            if raw_target:
                resolved = _resolve_local_markdown_target(
                    repo_root, relative, raw_target
                )
        else:
            raw_target = match.group("wikilink_target")
            resolved = _resolve_navigation_wikilink(repo_root, relative, raw_target)

        if resolved is None or raw_target is None:
            continue

        fragment = _navigation_fragment(raw_target)
        destinations.append(
            f"{resolved.casefold()}#{fragment}" if fragment else resolved.casefold()
        )

    return destinations


def _validate_navigation_link_uniqueness(repo_root: Path) -> list[str]:
    violations: list[str] = []
    for relative in NAVIGATION_SURFACES:
        surface = repo_root / relative
        if not surface.is_file():
            continue

        text = "\n".join(_iter_markdown_segments(surface))
        references = {
            " ".join(match.group("id").split()).casefold(): match.group("target")
            for match in REFERENCE_DEF_WITH_ID_RE.finditer(text)
        }

        for match in VISIBLE_NAVIGATION_LINK_RE.finditer(text):
            raw_target: str | None = None
            resolved: str | None = None
            if match.group("inline") is not None:
                label = match.group("inline_label")
                raw_target = match.group("inline_target")
                resolved = _resolve_local_markdown_target(
                    repo_root,
                    relative.as_posix(),
                    raw_target,
                )
            elif match.group("reference") is not None:
                label = match.group("reference_label")
                identifier = match.group("reference_id") or label
                raw_target = references.get(" ".join(identifier.split()).casefold())
                if raw_target:
                    resolved = _resolve_local_markdown_target(
                        repo_root,
                        relative.as_posix(),
                        raw_target,
                    )
            else:
                raw = match.group("wikilink_target")
                owner, separator, alias = raw.partition("|")
                label = alias if separator else Path(owner.split("#", 1)[0]).stem
                raw_target = raw
                resolved = _resolve_navigation_wikilink(
                    repo_root,
                    relative.as_posix(),
                    raw,
                )

            normalized_label = " ".join(label.split())
            if OPAQUE_NAVIGATION_LABEL_RE.fullmatch(normalized_label):
                violations.append(
                    f"{relative.as_posix()}: opaque navigation label "
                    f"{normalized_label!r} must include the document title"
                )

                continue

            if resolved and resolved.startswith(DURABLE_RECORD_PREFIXES):
                normalized_path_label = normalized_label.replace("\\", "/")
                resolved_path = Path(resolved)
                path_labels = {
                    resolved,
                    f"./{resolved}",
                    resolved_path.name,
                    resolved_path.stem,
                }

                if normalized_path_label.casefold() in {
                    candidate.casefold() for candidate in path_labels
                }:
                    violations.append(
                        f"{relative.as_posix()}: path-only durable-record label "
                        f"{normalized_label!r} must use the document title"
                    )

        counts: dict[str, int] = {}
        for destination in _visible_navigation_destinations(repo_root, surface):
            counts[destination] = counts.get(destination, 0) + 1

        for destination, count in sorted(counts.items()):
            if count > 1:
                violations.append(
                    f"{relative.as_posix()}: duplicate local navigation target "
                    f"{destination} ({count} occurrences)"
                )

    return violations


def _collect_transitive_index_targets(repo_root: Path, obsidian_path: Path) -> set[str]:
    obsidian_relative = _relative_path(repo_root, obsidian_path.resolve())
    reachable = {obsidian_relative}
    queue = [obsidian_relative]

    while queue:
        current_relative = queue.pop(0)
        current_path = repo_root / current_relative
        if not current_path.is_file() or current_path.suffix.lower() != ".md":
            continue

        for raw_target in _iter_markdown_targets(current_path):
            resolved = _resolve_local_markdown_target(
                repo_root, current_relative, raw_target
            )

            if resolved is None or resolved in reachable:
                continue

            reachable.add(resolved)
            queue.append(resolved)

    return reachable


def _validate_obsidian_reachability(
    repo_root: Path,
    targets: list[ValidationTarget],
    *,
    obsidian_path: Path,
) -> list[str]:
    if not obsidian_path.exists():
        return []

    reachable_targets = _collect_transitive_index_targets(repo_root, obsidian_path)
    obsidian_rel = _relative_path(repo_root, obsidian_path.resolve())
    violations: list[str] = []
    for target in targets:
        if not target.frontmatter_required:
            continue

        if not target.relative_path.startswith("docs/"):
            continue

        if target.relative_path == obsidian_rel:
            continue

        if target.relative_path not in reachable_targets:
            violations.append(
                f"{obsidian_rel}: missing index connection to {target.relative_path}"
            )

    return violations


def _durable_links_script() -> Path:
    module = Path(__file__).resolve()
    # Layout identity, not file existence, chooses the local delegate.
    if module.parts[-4:] == (
        "scripts",
        "documentation",
        "validate_documentation_metadata",
        "cli.py",
    ):
        return module.parents[2] / "documentation_validate_durable_links.py"

    return module.parents[1] / "validate_durable_links.py"


def _validate_durable_links(
    repo_root: Path, paths: list[Path]
) -> tuple[list[str], list[str]]:
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
        help=(
            "Markdown files or directories to scan. Defaults to durable documentation roots "
            "when present."
        ),
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
        help=(
            "Required YAML frontmatter field. Repeat to override the default "
            "title and doc_role requirements."
        ),
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
        help=(
            "Validate docs/ indices, three- or four-digit canonical names, protected releases, "
            "and the hybrid asset layout."
        ),
    )

    parser.add_argument(
        "--repo-acronym",
        help=(
            "Legacy repository acronym compatibility input. Canonical docs names are type-based "
            "and no longer require an acronym."
        ),
    )

    parser.add_argument(
        "--docs-governance-config",
        type=Path,
        default=DOCS_GOVERNANCE_CONFIG,
        help=(
            "Optional repository-local TOML config for localized docs_governance exceptions."
        ),
    )

    args = parser.parse_args()

    repo_root = args.repo_root.resolve()
    if not repo_root.is_dir():
        _fail(f"repo root is not a directory: {repo_root}")

    requested_paths = args.paths or _default_paths(repo_root)
    if not requested_paths:
        _fail(
            "no durable documentation paths found; pass at least one Markdown file or directory"
        )

    scan_roots = [
        path.resolve() if path.is_absolute() else (repo_root / path).resolve()
        for path in requested_paths
    ]

    targets = _collect_targets(repo_root, scan_roots)
    required_fields = tuple(args.required_fields or DEFAULT_REQUIRED_FIELDS)
    violations: list[str] = []
    ok_messages: list[str] = []

    violations.extend(_validate_frontmatter(targets, required_fields))
    violations.extend(_validate_navigation_link_uniqueness(repo_root))

    if args.enforce_docs_governance:
        docs_governance_policy, policy_violations = _load_docs_governance_policy(
            repo_root,
            args.docs_governance_config,
            args.repo_acronym,
        )

        violations.extend(
            _validate_docs_governance(
                repo_root,
                policy=docs_governance_policy,
                policy_violations=policy_violations,
            )
        )

    if not args.skip_index:
        obsidian_path = args.obsidian
        full_obsidian_path = (
            obsidian_path if obsidian_path.is_absolute() else repo_root / obsidian_path
        )

        violations.extend(
            _validate_obsidian_reachability(
                repo_root,
                targets,
                obsidian_path=full_obsidian_path.resolve(),
            )
        )

    if not args.skip_links:
        durable_messages, durable_violations = _validate_durable_links(
            repo_root, scan_roots
        )

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
