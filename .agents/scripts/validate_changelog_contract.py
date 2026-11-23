#!/usr/bin/env python3
"""Validate daily-tree operational entries and preserved legacy daily files.

Checks enforced:
- new entries use operational-entry/2 metadata and YYYY/MM/DD placement
- incomplete independent files are violations, never valid events
- filename matches `AAAAMMDD.changelog.md` (8 digits, ASCII)
- top-level title `# Changelog - YYYY-MM-DD` with date matching the filename
- optional YAML frontmatter with `durable_curation` has a structurally valid
  mapping, unique keys, typed values, and independently validated entries
- legacy entry blocks open with `## [HH:MM] <title>` or explicit
  `## [horário não informado] <title>`; independent timestamps remain mandatory
- each entry contains the minimum mandatory sub-sections in order:
  `### Contexto`, `### Decisão tomada`, `### Alterações realizadas`,
  `### Validação`, `### Tags`
- repository mode inspects active Markdown under `.agents/changelogs/`, rejecting
  non-canonical placement; legacy daily files retain YYYY-MM date alignment
- cold files can be validated directly; repository mode excludes cold history

Exits with non-zero status on any contract violation.
"""

from __future__ import annotations

import argparse
from datetime import datetime
import json
import re
import stat
import sys
import unicodedata
from pathlib import Path, PureWindowsPath

FILENAME_RE = re.compile(r"^(\d{4})(\d{2})(\d{2})\.changelog\.md$")
MONTH_DIRECTORY_RE = re.compile(r"^(\d{4})-(\d{2})$")
TITLE_RE = re.compile(r"^#\s+Changelog\s+-\s+(\d{4})-(\d{2})-(\d{2})\s*$", re.MULTILINE)
ENTRY_HEADER_RE = re.compile(r"^##[ \t]+\[(\d{2}):(\d{2})\][ \t]+\S.*$")
UNKNOWN_TIME_ENTRY_HEADER_RE = re.compile(
    r"^##[ \t]+\[horário não informado\][ \t]+\S.*$"
)

ENTRY_BOUNDARY_RE = re.compile(r"^ {0,3}##(?:[ \t]+.*)?$")
FENCE_RE = re.compile(r"^ {0,3}(`{3,}|~{3,})(.*)$")
ENTRY_VIOLATION_RE = re.compile(r"\bentry\s+(\d+):")
CANONICAL_ERROR_RE = re.compile(r"^(?P<path>.+?\.changelog\.md):\s+(?P<detail>.+)$")
LOOSE_ERROR_RE = re.compile(
    r"^loose changelog file outside monthly directory:\s+(?P<path>.+?\.md)$"
)

YAML_KEY_RE = re.compile(r"^(?P<key>[A-Za-z_][A-Za-z0-9_]*):(?P<value>.*)$")

MANDATORY_ENTRY_SECTIONS = [
    "### Contexto",
    "### Decisão tomada",
    "### Alterações realizadas",
    "### Validação",
    "### Tags",
]

CURATION_CLASSIFICATIONS = {
    "untriaged",
    "sem_promocao",
    "conhecimento_duravel_novo",
    "conhecimento_duravel_complementar",
    "candidato_adr",
    "candidato_refactoring",
}

CURATION_PROMOTION_PLANS = {
    "untriaged",
    "claro_seguro",
    "pendente_revisao",
    "nao_se_aplica",
}

CURATION_EVIDENCE_STRENGTHS = {
    "ausente",
    "fraca",
    "media",
    "forte",
}

CURATION_GATE_SCOPES = {
    "none",
    "format_only",
    "docs_readme_obsidian",
    "adr",
}

CURATION_SCALAR_ENUMS = {
    "classification": CURATION_CLASSIFICATIONS,
    "default_classification": CURATION_CLASSIFICATIONS,
    "promotion_plan": CURATION_PROMOTION_PLANS,
    "default_promotion_plan": CURATION_PROMOTION_PLANS,
    "evidence_strength": CURATION_EVIDENCE_STRENGTHS,
    "gate_scope": CURATION_GATE_SCOPES,
}

CURATION_BOOLEAN_KEYS = {"requires_operator"}
MAX_COLLECTION_NODES = 10000


def _unsafe_path(path: Path) -> bool:
    """Inspect ancestors first, including broken links, without following targets."""
    for component in reversed((path, *path.parents)):
        try:
            info = component.lstat()
        except FileNotFoundError:
            continue
        except OSError:
            return True

        if stat.S_ISLNK(info.st_mode) or getattr(info, "st_file_attributes", 0) & 0x400:
            return True

        if component != path and not stat.S_ISDIR(info.st_mode):
            return True

    return False


def _extract_frontmatter(content: str) -> str | None:
    lines = content.splitlines()
    if not lines or lines[0].strip() != "---":
        return None

    for index, line in enumerate(lines[1:], start=1):
        if line.strip() == "---":
            return "\n".join(lines[1:index])

    return None


def _indent(line: str) -> int:
    return len(line) - len(line.lstrip(" "))


def _scalar(value: str) -> object:
    value = _strip_inline_comment(value).strip()
    if value == "":
        return None

    if value == "[]":
        return []

    if value.lower() == "true":
        return True

    if value.lower() == "false":
        return False

    if value.isascii() and value.isdigit():
        return int(value)

    if len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"'}:
        return value[1:-1]

    return value


def _strip_inline_comment(value: str) -> str:
    quote: str | None = None
    escaped = False
    for index, character in enumerate(value):
        if escaped:
            escaped = False
            continue

        if character == "\\" and quote == '"':
            escaped = True
            continue

        if character in {"'", '"'}:
            if quote is None:
                quote = character
            elif quote == character:
                quote = None

            continue

        if (
            character == "#"
            and quote is None
            and (index == 0 or value[index - 1].isspace())
        ):
            return value[:index]

    return value


def _parse_key_value(text: str) -> tuple[str, object] | None:
    match = YAML_KEY_RE.match(text)
    if not match:
        return None

    return match.group("key"), _scalar(match.group("value"))


def _parse_entry_items(
    lines: list[str],
    *,
    parent_indent: int,
) -> tuple[list[dict[str, object]], list[str]]:
    errors: list[str] = []
    meaningful = [
        line for line in lines if line.strip() and not line.lstrip().startswith("#")
    ]

    if not meaningful:
        return [], errors

    list_indent = _indent(meaningful[0])
    if list_indent <= parent_indent:
        return [], ["frontmatter durable_curation entries must be a YAML list"]

    items: list[dict[str, object]] = []
    current: dict[str, object] | None = None
    for line in meaningful:
        if "\t" in line[: len(line) - len(line.lstrip())]:
            errors.append(
                "frontmatter durable_curation must use spaces for indentation"
            )

            continue

        indentation = _indent(line)
        stripped = line.strip()
        if indentation == list_indent and stripped.startswith("-"):
            current = {}
            items.append(current)
            remainder = stripped[1:].strip()
            if remainder:
                parsed = _parse_key_value(remainder)
                if parsed is None:
                    errors.append(
                        "frontmatter durable_curation entries must contain mappings"
                    )

                    continue

                key, value = parsed
                current[key] = value

            continue

        if current is None or indentation <= list_indent:
            errors.append(
                "frontmatter durable_curation entries have invalid indentation"
            )

            continue

        parsed = _parse_key_value(stripped)
        if parsed is None:
            continue

        key, value = parsed
        if key in current:
            errors.append(
                f"frontmatter durable_curation entry has duplicate key: {key}"
            )
        else:
            current[key] = value

    return items, errors


def _parse_curation_mapping(
    frontmatter: str,
) -> tuple[dict[str, object] | None, list[str]]:
    lines = frontmatter.splitlines()
    errors: list[str] = []
    starts: list[int] = []
    curation_keys = (
        set(CURATION_SCALAR_ENUMS) | CURATION_BOOLEAN_KEYS | {"schema_version"}
    )

    for index, line in enumerate(lines):
        if line and not line[0].isspace():
            parsed = _parse_key_value(line)
            if parsed and parsed[0] == "durable_curation":
                starts.append(index)
            elif parsed and parsed[0] in curation_keys:
                errors.append(
                    f"frontmatter curation field must be inside durable_curation: {parsed[0]}"
                )

    if not starts:
        return None, errors

    if len(starts) > 1:
        errors.append("frontmatter must not repeat durable_curation")

    start = starts[0]
    parsed_header = _parse_key_value(lines[start])
    assert parsed_header is not None
    if parsed_header[1] is not None:
        errors.append("frontmatter durable_curation must be a mapping")
        return {}, errors

    block: list[str] = []
    for line in lines[start + 1 :]:
        if line.strip() and not line[0].isspace():
            break

        block.append(line)

    meaningful = [
        line for line in block if line.strip() and not line.lstrip().startswith("#")
    ]

    if not meaningful:
        errors.append("frontmatter durable_curation must be a mapping")
        return {}, errors

    direct_indent = min(_indent(line) for line in meaningful)
    if direct_indent < 2:
        errors.append("frontmatter durable_curation has invalid indentation")

    mapping: dict[str, object] = {}
    index = 0
    while index < len(block):
        line = block[index]
        if not line.strip() or line.lstrip().startswith("#"):
            index += 1
            continue

        if "\t" in line[: len(line) - len(line.lstrip())]:
            errors.append(
                "frontmatter durable_curation must use spaces for indentation"
            )

            index += 1
            continue

        if _indent(line) != direct_indent:
            index += 1
            continue

        parsed = _parse_key_value(line.strip())
        if parsed is None:
            errors.append("frontmatter durable_curation contains a non-mapping item")
            index += 1
            continue

        key, value = parsed
        if key in mapping:
            errors.append(f"frontmatter durable_curation has duplicate key: {key}")

        if key == "entries" and value is None:
            nested: list[str] = []
            cursor = index + 1
            while cursor < len(block):
                candidate = block[cursor]
                if candidate.strip() and _indent(candidate) <= direct_indent:
                    break

                nested.append(candidate)
                cursor += 1

            value, nested_errors = _parse_entry_items(
                nested,
                parent_indent=direct_indent,
            )

            errors.extend(nested_errors)
            index = cursor
        else:
            index += 1

        mapping.setdefault(key, value)

    return mapping, errors


def _split_entries(content: str) -> list[str]:
    # Split on every real H2, including malformed entry headers. Code examples
    # must neither create entries nor supply mandatory sections to their owner.
    entries: list[list[str]] = []
    fence = ""
    frontmatter = False
    for index, line in enumerate(content.splitlines()):
        if index == 0 and line.strip() == "---":
            frontmatter = True
            continue

        if frontmatter:
            if line.strip() == "---":
                frontmatter = False

            continue

        marker = FENCE_RE.fullmatch(line)
        if fence:
            if (
                marker
                and marker[1][0] == fence[0]
                and len(marker[1]) >= len(fence)
                and not marker[2].strip()
            ):
                fence = ""

            continue

        if marker and (marker[1][0] != "`" or "`" not in marker[2]):
            fence = marker[1]
            continue

        if ENTRY_BOUNDARY_RE.fullmatch(line):
            entries.append([line.strip()])
        elif entries:
            entries[-1].append(line)

    return ["\n".join(entry) for entry in entries]


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


def _check_frontmatter(content: str) -> list[str]:
    frontmatter = _extract_frontmatter(content)
    if frontmatter is None:
        return []

    scalars, errors = _parse_curation_mapping(frontmatter)
    if scalars is None:
        return errors

    if scalars.get("schema_version") != 1:
        errors.append("frontmatter durable_curation must declare `schema_version: 1`")

    if "classification" not in scalars and "default_classification" not in scalars:
        errors.append(
            "frontmatter durable_curation must declare `classification` or `default_classification`"
        )

    if "promotion_plan" not in scalars and "default_promotion_plan" not in scalars:
        errors.append(
            "frontmatter durable_curation must declare `promotion_plan` or `default_promotion_plan`"
        )

    for key, allowed_values in CURATION_SCALAR_ENUMS.items():
        value = scalars.get(key)
        if value is not None and value not in allowed_values:
            errors.append(f"frontmatter durable_curation has invalid {key}: {value}")

    for key in CURATION_BOOLEAN_KEYS:
        value = scalars.get(key)
        if value is not None and not isinstance(value, bool):
            errors.append(f"frontmatter durable_curation has invalid {key}: {value}")

    if "classification" in scalars and "default_classification" in scalars:
        errors.append(
            "frontmatter durable_curation must not combine classification with default_classification"
        )

    if "promotion_plan" in scalars and "default_promotion_plan" in scalars:
        errors.append(
            "frontmatter durable_curation must not combine promotion_plan with default_promotion_plan"
        )

    entries = scalars.get("entries", [])
    if not isinstance(entries, list):
        errors.append("frontmatter durable_curation entries must be a YAML list")
    else:
        for index, entry in enumerate(entries, start=1):
            if not isinstance(entry, dict):
                errors.append(
                    f"frontmatter durable_curation entry {index} must be a mapping"
                )

                continue

            for key, allowed_values in CURATION_SCALAR_ENUMS.items():
                value = entry.get(key)
                if value is not None and value not in allowed_values:
                    errors.append(
                        f"frontmatter durable_curation entry {index} has invalid {key}: {value}"
                    )

            for key in CURATION_BOOLEAN_KEYS:
                value = entry.get(key)
                if value is not None and not isinstance(value, bool):
                    errors.append(
                        f"frontmatter durable_curation entry {index} has invalid {key}: {value}"
                    )

            if "classification" in entry and "default_classification" in entry:
                errors.append(
                    f"frontmatter durable_curation entry {index} must not combine "
                    "classification with default_classification"
                )

            if "promotion_plan" in entry and "default_promotion_plan" in entry:
                errors.append(
                    f"frontmatter durable_curation entry {index} must not combine "
                    "promotion_plan with default_promotion_plan"
                )

    return errors


def _check_entries(content: str) -> list[str]:
    errors: list[str] = []
    entries = _split_entries(content)
    if not entries:
        errors.append("no entry block matching `## [HH:MM] ...` was found")
        return errors

    for index, entry in enumerate(entries, start=1):
        lines = entry.splitlines()
        header = ENTRY_HEADER_RE.fullmatch(lines[0])
        if header is None and UNKNOWN_TIME_ENTRY_HEADER_RE.fullmatch(lines[0]) is None:
            errors.append(
                f"entry {index}: invalid header; expected `## [HH:MM] <title>`"
                " or `## [horário não informado] <title>`"
            )
        elif header is not None and (int(header[1]) > 23 or int(header[2]) > 59):
            errors.append(f"entry {index}: invalid time; expected 00:00 through 23:59")

        sections = [line.rstrip() for line in lines[1:]]
        cursor = 0
        for section in MANDATORY_ENTRY_SECTIONS:
            try:
                position = sections.index(section, cursor)
            except ValueError:
                errors.append(
                    f"entry {index}: missing or out-of-order section {section!r}"
                )

                cursor = len(sections)
                continue

            cursor = position + 1

    return errors


def validate_independent_file(path: Path) -> list[str]:
    try:
        if (
            _unsafe_path(path)
            or not stat.S_ISREG(path.lstat().st_mode)
            or path.lstat().st_nlink != 1
            or path.lstat().st_size > 1024 * 1024
        ):
            raise ValueError

        content = path.read_bytes().decode("utf-8")
        header, body = content.split("\n---\n\n", 1)
        if not header.startswith("---\n") or not body.strip():
            raise ValueError

        data = json.loads(header[4:])
        required = {
            "schema",
            "id",
            "recorded_at",
            "refs",
            "corrects",
            "commit_required",
            "title",
        }

        if (
            not isinstance(data, dict)
            or not required <= set(data)
            or set(data) - required - {"occurred_at"}
            or data["schema"] != "operational-entry/2"
            or not isinstance(data["id"], str)
            or not re.fullmatch("[0-9a-f]{32}", data["id"])
            or type(data["commit_required"]) is not bool
        ):
            raise ValueError

        recorded = datetime.fromisoformat(data["recorded_at"])
        title = data["title"]
        if (
            not isinstance(title, str)
            or not title.strip()
            or title != title.strip()
            or len(title) > 240
            or any(ord(character) < 32 for character in title)
            or not body.startswith("# " + title + "\n\n")
            or not body[len(title) + 4 :].strip()
        ):
            raise ValueError

        normalized = unicodedata.normalize("NFKD", title)
        normalized = normalized.encode("ascii", "ignore").decode().lower()
        slug = re.sub(r"[^a-z0-9]+", "-", normalized).strip("-")[:64].rstrip("-")
        filename = (
            recorded.strftime("%Y%m%d-%H%M%S%f")
            + "-"
            + (slug or "registro")
            + "-"
            + data["id"]
            + ".entry.md"
        )

        active_parts = (
            recorded.strftime("%Y"),
            recorded.strftime("%m"),
            recorded.strftime("%d"),
        )

        valid_location = path.name == filename and (
            tuple(path.parts[-4:-1]) == active_parts
            or (
                path.parent.name == recorded.strftime("%Y-%m")
                and path.parent.parent.name == ".archived"
            )
        )

        if recorded.utcoffset() is None or not valid_location:
            raise ValueError

        if (
            "occurred_at" in data
            and datetime.fromisoformat(data["occurred_at"]).utcoffset() is None
        ):
            raise ValueError

        for key in ("refs", "corrects"):
            if (
                not isinstance(data[key], list)
                or len(data[key]) > 128
                or any(
                    not isinstance(v, str) or not v.strip() or "\n" in v or "\r" in v
                    for v in data[key]
                )
                or len(set(data[key])) != len(data[key])
            ):
                raise ValueError

        if any(
            not re.fullmatch("[0-9a-f]{32}", v) or v == data["id"]
            for v in data["corrects"]
        ):
            raise ValueError

        if any(
            ord(character) < 32 and character not in "\n\r\t" for character in content
        ):
            raise ValueError

        return []
    except (OSError, ValueError, TypeError, KeyError, UnicodeError):
        return ["invalid independent changelog entry"]


def validate_file(path: Path) -> list[str]:
    if _unsafe_path(path):
        return ["unsafe changelog path: link or reparse point"]

    if path.name.endswith(".entry.md"):
        return validate_independent_file(path)

    if not path.exists():
        raise FileNotFoundError(f"changelog file not found: {path}")

    filename_errors, filename_date = _check_filename(path)
    content = path.read_text(encoding="utf-8")
    parent_errors: list[str] = []
    parent_match = MONTH_DIRECTORY_RE.fullmatch(path.parent.name)
    if parent_match and filename_date:
        expected_parent = f"{filename_date[0]}-{filename_date[1]}"
        if path.parent.name != expected_parent:
            parent_errors.append(
                f"parent directory {path.parent.name!r} does not match filename month {expected_parent!r}"
            )

    return [
        *filename_errors,
        *parent_errors,
        *_check_frontmatter(content),
        *_check_title(content, filename_date),
        *_check_entries(content),
    ]


def _relative(path: Path, root: Path) -> str:
    try:
        return path.relative_to(root).as_posix()
    except ValueError:
        return path.as_posix()


def _collect_markdown_files(changelog_root: Path) -> list[Path]:
    """Bound traversal and retain unsafe nodes as violations, never follow links."""
    files: list[Path] = []
    pending = [changelog_root]
    observed = 0
    while pending:
        directory = pending.pop()
        if _unsafe_path(directory):
            files.append(directory)
            continue

        for path in directory.iterdir():
            observed += 1
            if observed > MAX_COLLECTION_NODES:
                raise ValueError("changelog inventory exceeds path limit")

            info = path.lstat()
            if _unsafe_path(path):
                files.append(path)
                continue

            if path.name in {".archived", ".views"}:
                continue

            if stat.S_ISDIR(info.st_mode):
                pending.append(path)
            elif path.name.endswith(".md"):
                files.append(path)

    return sorted(files)


def validate_repository(repo_root: Path) -> list[str]:
    changelog_root = repo_root / ".agents" / "changelogs"
    errors: list[str] = []

    if _unsafe_path(changelog_root):
        return [
            f"{_relative(changelog_root, repo_root)}: unsafe changelog collection path"
        ]

    try:
        info = changelog_root.lstat()
    except FileNotFoundError:
        return []
    except OSError:
        return [
            f"{_relative(changelog_root, repo_root)}: unreadable changelog collection"
        ]

    if not stat.S_ISDIR(info.st_mode):
        return [
            f"{_relative(changelog_root, repo_root)}: unsafe changelog collection anchor"
        ]

    try:
        collected = _collect_markdown_files(changelog_root)
    except (OSError, ValueError):
        return [
            f"{_relative(changelog_root, repo_root)}: unsafe or bounded changelog inventory"
        ]

    canonical_files: list[Path] = []
    for path in collected:
        if _unsafe_path(path) or not stat.S_ISREG(path.lstat().st_mode):
            errors.append(f"{_relative(path, repo_root)}: unsafe changelog path")
            continue

        relative = path.relative_to(changelog_root)
        if path.name.endswith(".entry.md"):
            if len(relative.parts) == 4:
                canonical_files.append(path)
            else:
                errors.append(
                    f"{_relative(path, repo_root)}: non-canonical independent entry location"
                )

            continue

        if len(relative.parts) == 1:
            errors.append(
                "loose changelog file outside monthly directory: "
                f"{_relative(path, repo_root)}"
            )

            continue

        if len(relative.parts) != 2 or not MONTH_DIRECTORY_RE.fullmatch(
            relative.parts[0]
        ):
            errors.append(
                "non-canonical changelog file outside `YYYY-MM/AAAAMMDD.changelog.md`: "
                f"{_relative(path, repo_root)}"
            )

            continue

        if not FILENAME_RE.fullmatch(path.name):
            if path.name.endswith(".entry.md"):
                canonical_files.append(path)
                continue

            errors.append(
                "non-canonical changelog filename in monthly directory: "
                f"{_relative(path, repo_root)}"
            )

            continue

        canonical_files.append(path)

    for path in canonical_files:
        for error in validate_file(path):
            errors.append(f"{_relative(path, repo_root)}: {error}")

    if changelog_root.exists() and not canonical_files and not errors:
        errors.append(
            "no canonical changelog files found under `.agents/changelogs/YYYY-MM/`"
        )

    return errors


def validate(path: Path) -> list[str]:
    if _unsafe_path(path):
        return ["unsafe changelog path: link or reparse point"]

    if path.is_dir():
        return validate_repository(path)

    return validate_file(path)


def _basename(path_text: str) -> str:
    clean_path = path_text.strip().strip("'\"")
    name = Path(clean_path).name
    if name == clean_path and "\\" in clean_path:
        name = PureWindowsPath(clean_path).name

    return name or clean_path


def _summary_location(path: Path, error: str) -> tuple[str, str]:
    canonical_match = CANONICAL_ERROR_RE.match(error)
    if canonical_match:
        return _basename(canonical_match.group("path")), canonical_match.group("detail")

    loose_match = LOOSE_ERROR_RE.match(error)
    if loose_match:
        return _basename(loose_match.group("path")), error

    return _basename(path.as_posix()), error


def format_error_summary(path: Path, errors: list[str]) -> str:
    grouped: dict[str, dict[str, object]] = {}
    for error in errors:
        file_name, detail = _summary_location(path, error)
        if file_name not in grouped:
            grouped[file_name] = {"violations": 0, "entries": set()}

        grouped[file_name]["violations"] = int(grouped[file_name]["violations"]) + 1
        entry_match = ENTRY_VIOLATION_RE.search(detail)
        if entry_match:
            entries = grouped[file_name]["entries"]
            assert isinstance(entries, set)
            entries.add(int(entry_match.group(1)))

    parts: list[str] = []
    for file_name, data in grouped.items():
        entries = data["entries"]
        violations = int(data["violations"])
        if isinstance(entries, set) and entries:
            parts.append(f"{file_name} (entries = {len(entries)})")
        else:
            parts.append(f"{file_name} (violations = {violations})")

    max_parts = 5
    visible_parts = parts[:max_parts]
    if len(parts) > max_parts:
        visible_parts.append(f"+{len(parts) - max_parts} files")

    target = ", ".join(visible_parts) if visible_parts else _basename(path.as_posix())
    return f"changelog contract violations in: {target}."


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Validate daily operational changelog files against the scaffold contract."
    )

    parser.add_argument(
        "--summary",
        action="store_true",
        help="emit a concise grouped error summary instead of every violation",
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
        if args.summary:
            print(format_error_summary(args.path, errors), file=sys.stderr)
        else:
            print(f"changelog contract violations in {args.path}:", file=sys.stderr)
            for error in errors:
                print(f"  - {error}", file=sys.stderr)

        return 1

    print(f"ok: {args.path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
