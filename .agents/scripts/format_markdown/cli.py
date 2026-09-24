#!/usr/bin/env python3
"""Format repository Markdown documentation with conservative SAT conventions.

The formatter normalizes prose paragraphs and simple Markdown list items by
joining soft manual wraps before applying the configured line width. It aligns
GitHub-flavored Markdown tables for source readability while keeping
frontmatter, fenced code blocks, link reference definitions, headings,
horizontal rules, HTML-ish blocks, and complex list structures stable.

Exit codes:
- 0: files are formatted or were updated successfully
- 1: --check found files that need formatting
- 2: usage or path error

Usage:
    python scripts/documentation_format_markdown.py --check docs OBSIDIAN.md
    python scripts/documentation_format_markdown.py --write --line-width 100 docs
"""

from __future__ import annotations

import argparse
import re
import sys
import textwrap
import unicodedata
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, NoReturn, Sequence


DEFAULT_LINE_WIDTH = 100
ORDERED_ITEM_RE = re.compile(r"^(\s*)(\d+[.)])\s+(.*)$")
BULLET_ITEM_RE = re.compile(r"^(\s*)([-+*])\s+(.*)$")
ATX_HEADING_RE = re.compile(r"^\s{0,3}#{1,6}(?:\s|$)")
HR_RE = re.compile(r"^\s{0,3}([-*_])(?:\s*\1){2,}\s*$")
SETEXT_UNDERLINE_RE = re.compile(r"^\s{0,3}(?:=+|-+)\s*$")
REFERENCE_DEF_RE = re.compile(r"^\s{0,3}\[[^\]\n]+\]:\s+\S+")
HTML_BLOCK_RE = re.compile(r"^\s{0,3}</?[A-Za-z][^>]*>\s*$")
HTML_COMMENT_START_RE = re.compile(r"^\s{0,3}<!--")
SAT_OPERATOR_HELP_MARKER = "<!-- SAT_OPERATOR_HELP -->"
SAT_OPERATOR_HELP_ACTIVATION = "## Activation Cues"
TABLE_SEPARATOR_RE = re.compile(
    r"^\s{0,3}\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?\s*$"
)

TABLE_SEPARATOR_CELL_RE = re.compile(r"^(?P<left>:)?(?P<dashes>-{3,})(?P<right>:)?$")
INDENTED_CODE_RE = re.compile(r"^(?:    |\t)")
BLOCKQUOTE_RE = re.compile(r"^(\s{0,3}>\s?)(.*)$")
MOJIBAKE_MARKERS = (
    "Ãƒ",
    "Ã‚",
    "Ã¢",
    "Ã¡",
    "Ã£",
    "Ã§",
    "Ã©",
    "Ãª",
    "Ã­",
    "Ã³",
    "Ã´",
    "Ãµ",
    "Ãº",
    "â€",
    "ï¿½",
    "�",
)


@dataclass(frozen=True)
class FormatOptions:
    line_width: int = DEFAULT_LINE_WIDTH
    spaced_numbered_lists: str = "smart"
    spaced_bullet_lists: str = "smart-conservative"


@dataclass(frozen=True)
class ListItem:
    indent: str
    marker: str
    body_lines: tuple[str, ...]
    raw_lines: tuple[str, ...]
    is_ordered: bool
    is_complex: bool = False


@dataclass(frozen=True)
class TableAlignment:
    left: bool
    right: bool
    source_width: int


def _fail(message: str, code: int = 2) -> NoReturn:
    print(f"[format_markdown] error: {message}", file=sys.stderr)
    sys.exit(code)


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
            if path.suffix.lower() == ".md":
                files.append(path)
        else:
            _fail(f"documentation path not found: {path}")

    return sorted(dict.fromkeys(path.resolve() for path in files))


def _read_utf8(
    path: Path,
    *,
    allow_bom_repair: bool = False,
) -> tuple[str | None, str | None, bool]:
    try:
        data = path.read_bytes()
        had_bom = data.startswith(b"\xef\xbb\xbf")
        if had_bom:
            if not allow_bom_repair:
                return None, f"{path}: UTF-8 BOM is not allowed", True

            data = data[3:]

        return data.decode("utf-8"), None, had_bom
    except UnicodeDecodeError as exc:
        return None, f"{path}: invalid UTF-8 at byte {exc.start}: {exc.reason}", False


def _mojibake_issues(path: Path, text: str) -> list[str]:
    issues: list[str] = []
    for line_number, line in enumerate(text.splitlines(), start=1):
        for marker in MOJIBAKE_MARKERS:
            if marker in line:
                issues.append(
                    f"{path}:{line_number}: possible mojibake marker {marker!r}"
                )

                break

    return issues


def _fence_info(line: str) -> tuple[str, int] | None:
    stripped = line.lstrip()
    if stripped.startswith("```"):
        return "`", len(stripped) - len(stripped.lstrip("`"))

    if stripped.startswith("~~~"):
        return "~", len(stripped) - len(stripped.lstrip("~"))

    return None


def _normalize_non_fenced_unicode(text: str) -> str:
    """Normalize prose to NFC without changing any complete fenced block."""
    lines = text.splitlines(keepends=True)
    output: list[str] = []
    prose: list[str] = []
    fence_marker = ""
    fence_length = 0

    def flush_prose() -> None:
        if prose:
            output.append(unicodedata.normalize("NFC", "".join(prose)))
            prose.clear()

    for line in lines:
        if fence_marker:
            output.append(line)
            if _is_fence_close(line.rstrip("\r\n"), fence_marker, fence_length):
                fence_marker = ""
                fence_length = 0

            continue

        fence = _fence_info(line.rstrip("\r\n"))
        if fence:
            flush_prose()
            fence_marker, fence_length = fence
            output.append(line)
            continue

        prose.append(line)

    flush_prose()
    return "".join(output)


def _complete_fenced_blocks(text: str) -> list[str]:
    blocks: list[str] = []
    active: list[str] | None = None
    marker = ""
    length = 0
    for line in text.splitlines(keepends=True):
        bare = line.rstrip("\r\n")
        if active is not None:
            active.append(line)
            if _is_fence_close(bare, marker, length):
                blocks.append("".join(active))
                active = None
                marker = ""
                length = 0

            continue

        fence = _fence_info(bare)
        if fence:
            marker, length = fence
            active = [line]

    return blocks


def _restore_complete_fenced_blocks(text: str, original_blocks: Sequence[str]) -> str:
    output: list[str] = []
    active: list[str] | None = None
    marker = ""
    length = 0
    block_index = 0
    for line in text.splitlines(keepends=True):
        bare = line.rstrip("\r\n")
        if active is not None:
            active.append(line)
            if _is_fence_close(bare, marker, length):
                if block_index >= len(original_blocks):
                    raise ValueError("formatter produced an unexpected fenced block")

                output.append(original_blocks[block_index])
                block_index += 1
                active = None
                marker = ""
                length = 0

            continue

        fence = _fence_info(bare)
        if fence:
            marker, length = fence
            active = [line]
            continue

        output.append(line)

    if active is not None:
        output.extend(active)

    if block_index != len(original_blocks):
        raise ValueError("formatter removed or left a complete fenced block unclosed")

    return "".join(output)


def _is_fence_close(line: str, marker: str, length: int) -> bool:
    stripped = line.lstrip()
    return stripped.startswith(marker * length)


def _split_table_cells(line: str) -> tuple[str, ...] | None:
    stripped = line.strip()
    if "|" not in stripped:
        return None

    cells: list[str] = []
    current: list[str] = []
    code_delimiter_length = 0
    index = 0

    while index < len(stripped):
        char = stripped[index]
        if char == "`":
            run_end = index
            while run_end < len(stripped) and stripped[run_end] == "`":
                run_end += 1

            run_length = run_end - index
            current.extend(stripped[index:run_end])
            if code_delimiter_length == 0:
                code_delimiter_length = run_length
            elif run_length == code_delimiter_length:
                code_delimiter_length = 0

            index = run_end
            continue

        escaped = False
        if char == "|":
            backslash_count = 0
            previous = index - 1
            while previous >= 0 and stripped[previous] == "\\":
                backslash_count += 1
                previous -= 1

            escaped = backslash_count % 2 == 1

        if char == "|" and code_delimiter_length == 0 and not escaped:
            cells.append("".join(current).strip())
            current = []
        else:
            current.append(char)

        index += 1

    cells.append("".join(current).strip())
    if stripped.startswith("|") and cells and cells[0] == "":
        cells.pop(0)

    if stripped.endswith("|") and cells and cells[-1] == "":
        cells.pop()

    if len(cells) < 2:
        return None

    return tuple(cells)


def _separator_alignment(cell: str) -> TableAlignment | None:
    normalized = cell.strip()
    match = TABLE_SEPARATOR_CELL_RE.fullmatch(normalized)
    if not match:
        return None

    return TableAlignment(
        left=bool(match.group("left")),
        right=bool(match.group("right")),
        source_width=len(normalized),
    )


def _is_table_start(lines: Sequence[str], index: int) -> bool:
    if index + 1 >= len(lines):
        return False

    header_cells = _split_table_cells(lines[index])
    if header_cells is None or not TABLE_SEPARATOR_RE.match(lines[index + 1]):
        return False

    separator_cells = _split_table_cells(lines[index + 1])
    return separator_cells is not None and len(header_cells) == len(separator_cells)


def _is_table_line(line: str) -> bool:
    return _split_table_cells(line) is not None or bool(TABLE_SEPARATOR_RE.match(line))


def _has_hard_break(line: str) -> bool:
    return line.endswith("  ") or line.rstrip().endswith("\\")


def _list_match(line: str) -> re.Match[str] | None:
    return ORDERED_ITEM_RE.match(line) or BULLET_ITEM_RE.match(line)


def _is_special_start(lines: Sequence[str], index: int) -> bool:
    line = lines[index]
    if not line.strip():
        return True

    if _fence_info(line):
        return True

    if _list_match(line):
        return True

    if BLOCKQUOTE_RE.match(line):
        return True

    if ATX_HEADING_RE.match(line):
        return True

    if HR_RE.match(line):
        return True

    if SETEXT_UNDERLINE_RE.match(line):
        return True

    if REFERENCE_DEF_RE.match(line):
        return True

    if HTML_BLOCK_RE.match(line):
        return True

    if HTML_COMMENT_START_RE.match(line):
        return True

    if INDENTED_CODE_RE.match(line):
        return True

    return _is_table_start(lines, index)


def _split_frontmatter(lines: Sequence[str]) -> tuple[list[str], int]:
    if not lines or lines[0].strip() != "---":
        return [], 0

    for index in range(1, len(lines)):
        if lines[index].strip() in {"---", "..."}:
            return list(lines[: index + 1]), index + 1

    return [], 0


def _wrap_text(
    text: str, width: int, *, initial: str = "", subsequent: str = ""
) -> list[str]:
    available = max(20, width)
    wrapped = textwrap.wrap(
        text,
        width=available,
        initial_indent=initial,
        subsequent_indent=subsequent,
        break_long_words=False,
        break_on_hyphens=False,
    )

    return wrapped or [initial.rstrip()]


def _format_paragraph(
    lines: Sequence[str], options: FormatOptions, *, prefix: str = ""
) -> list[str]:
    output: list[str] = []
    current: list[str] = []
    current_hard_break: str | None = None

    def flush() -> None:
        nonlocal current, current_hard_break
        if not current:
            return

        text = " ".join(part.strip() for part in current if part.strip())
        width = max(20, options.line_width - len(prefix))
        wrapped = _wrap_text(text, width)
        if current_hard_break and wrapped:
            wrapped[-1] = f"{wrapped[-1]}{current_hard_break}"

        output.extend(f"{prefix}{line}" for line in wrapped)
        current = []
        current_hard_break = None

    for raw_line in lines:
        stripped_right = raw_line.rstrip()
        if stripped_right.endswith("\\"):
            current.append(stripped_right[:-1])
            current_hard_break = "\\"
            flush()
        elif raw_line.endswith("  "):
            current.append(stripped_right)
            current_hard_break = "  "
            flush()
        else:
            current.append(raw_line)

    flush()
    return output


def _format_blockquote(lines: Sequence[str], options: FormatOptions) -> list[str]:
    matches = [BLOCKQUOTE_RE.match(line) for line in lines]
    if not matches or any(match is None for match in matches):
        return list(lines)

    prefixes = {match.group(1) for match in matches if match is not None}
    if len(prefixes) != 1:
        return list(lines)

    prefix = next(iter(prefixes))
    bodies = [match.group(2) for match in matches if match is not None]
    if any(
        _fence_info(body) or _list_match(body) or _is_table_line(body)
        for body in bodies
    ):
        return list(lines)

    return _format_paragraph(bodies, options, prefix=prefix)


def _collect_paragraph(lines: Sequence[str], index: int) -> tuple[list[str], int]:
    collected: list[str] = []
    while index < len(lines) and not _is_special_start(lines, index):
        if index + 1 < len(lines) and SETEXT_UNDERLINE_RE.match(lines[index + 1]):
            break

        collected.append(lines[index])
        index += 1

    return collected, index


def _collect_sat_operator_help(
    lines: Sequence[str], index: int
) -> tuple[list[str], int] | None:
    """Keep the separately validated canonical operator-help block byte-stable."""
    if lines[index].strip() != SAT_OPERATOR_HELP_MARKER:
        return None

    for activation_index in range(index + 1, len(lines)):
        if lines[activation_index].strip() == SAT_OPERATOR_HELP_ACTIVATION:
            return list(lines[index:activation_index]), activation_index

    return None


def _collect_blockquote(lines: Sequence[str], index: int) -> tuple[list[str], int]:
    collected: list[str] = []
    while index < len(lines) and BLOCKQUOTE_RE.match(lines[index]):
        collected.append(lines[index])
        index += 1

    return collected, index


def _collect_fence(lines: Sequence[str], index: int) -> tuple[list[str], int]:
    opening = _fence_info(lines[index])
    if not opening:
        return [lines[index]], index + 1

    marker, length = opening
    collected = [lines[index]]
    index += 1
    while index < len(lines):
        collected.append(lines[index])
        if _is_fence_close(lines[index], marker, length):
            index += 1
            break

        index += 1

    return collected, index


def _collect_table(lines: Sequence[str], index: int) -> tuple[list[str], int]:
    collected: list[str] = []
    while index < len(lines) and lines[index].strip() and _is_table_line(lines[index]):
        collected.append(lines[index])
        index += 1

    return collected, index


def _render_table_row(cells: Sequence[str], cell_widths: Sequence[int]) -> str:
    rendered: list[str] = []
    for cell, total_width in zip(cells, cell_widths):
        content_width = total_width - 2
        rendered.append(f" {cell}{' ' * (content_width - len(cell))} ")

    return f"|{'|'.join(rendered)}|"


def _render_table_separator(
    alignments: Sequence[TableAlignment],
    cell_widths: Sequence[int],
) -> str:
    rendered: list[str] = []
    for alignment, total_width in zip(alignments, cell_widths):
        separator = ["-"] * total_width
        if alignment.left:
            separator[0] = ":"

        if alignment.right:
            separator[-1] = ":"

        rendered.append("".join(separator))

    return f"|{'|'.join(rendered)}|"


def _format_table(lines: Sequence[str]) -> list[str]:
    if len(lines) < 2:
        return list(lines)

    parsed_rows = [_split_table_cells(line) for line in lines]
    if any(row is None for row in parsed_rows):
        return list(lines)

    rows = [row for row in parsed_rows if row is not None]
    column_count = len(rows[0])
    if any(len(row) != column_count for row in rows):
        return list(lines)

    alignments = [_separator_alignment(cell) for cell in rows[1]]
    if any(alignment is None for alignment in alignments):
        return list(lines)

    resolved_alignments = [
        alignment for alignment in alignments if alignment is not None
    ]

    content_rows = [rows[0], *rows[2:]]
    cell_widths: list[int] = []
    for column_index, alignment in enumerate(resolved_alignments):
        content_width = max(len(row[column_index]) for row in content_rows)
        minimum_separator_width = 3 + int(alignment.left) + int(alignment.right)
        cell_widths.append(
            max(
                content_width + 2,
                alignment.source_width,
                minimum_separator_width,
            )
        )

    output = [_render_table_row(rows[0], cell_widths)]
    output.append(_render_table_separator(resolved_alignments, cell_widths))
    output.extend(_render_table_row(row, cell_widths) for row in rows[2:])
    return output


def _collect_list_item(lines: Sequence[str], index: int) -> tuple[ListItem, int, bool]:
    first_line = lines[index]
    match = _list_match(first_line)
    if not match:
        raise AssertionError("list collection started on a non-list line")

    indent, marker, first_body = match.group(1), match.group(2), match.group(3)
    is_ordered = bool(ORDERED_ITEM_RE.match(first_line))
    raw_lines = [first_line]
    body_lines = [first_body]
    base_indent = len(indent)
    is_complex = _has_hard_break(first_line)
    index += 1
    saw_separator_blank = False

    while index < len(lines):
        line = lines[index]
        if not line.strip():
            next_index = index + 1
            while next_index < len(lines) and not lines[next_index].strip():
                next_index += 1

            if next_index < len(lines):
                next_line = lines[next_index]
                next_indent = len(next_line) - len(next_line.lstrip(" "))
                next_match = _list_match(next_line)
                if next_indent > base_indent and not (
                    next_match and len(next_match.group(1)) <= base_indent
                ):
                    is_complex = True
                    raw_lines.append(line)
                    index += 1
                    continue

            saw_separator_blank = True
            break

        nested_match = _list_match(line)
        if nested_match:
            nested_indent = len(nested_match.group(1))
            if nested_indent <= base_indent:
                break

            is_complex = True
            raw_lines.append(line)
            index += 1
            continue

        if (
            _fence_info(line)
            or _is_table_start(lines, index)
            or INDENTED_CODE_RE.match(line)
        ):
            is_complex = True
            raw_lines.append(line)
            index += 1
            continue

        if (
            ATX_HEADING_RE.match(line)
            or HR_RE.match(line)
            or REFERENCE_DEF_RE.match(line)
            or HTML_COMMENT_START_RE.match(line)
        ):
            break

        line_indent = len(line) - len(line.lstrip(" "))
        if line_indent <= base_indent:
            break

        raw_lines.append(line)
        if _has_hard_break(line):
            is_complex = True

        body_lines.append(line.strip())
        index += 1

    return (
        ListItem(
            indent=indent,
            marker=marker,
            body_lines=tuple(body_lines),
            raw_lines=tuple(raw_lines),
            is_ordered=is_ordered,
            is_complex=is_complex,
        ),
        index,
        saw_separator_blank,
    )


def _collect_list_block(lines: Sequence[str], index: int) -> tuple[list[ListItem], int]:
    items: list[ListItem] = []
    while index < len(lines):
        if not _list_match(lines[index]):
            break

        item, index, _saw_blank = _collect_list_item(lines, index)
        items.append(item)
        while index < len(lines) and not lines[index].strip():
            if index + 1 < len(lines) and _list_match(lines[index + 1]):
                index += 1
                continue

            break

        if index >= len(lines) or not _list_match(lines[index]):
            break

    return items, index


def _format_list_item(item: ListItem, options: FormatOptions) -> list[str]:
    if item.is_complex:
        return _insert_blank_before_fences(item.raw_lines)

    if any("[[" in line or "]]" in line for line in item.raw_lines):
        return _insert_blank_before_fences(item.raw_lines)

    text = " ".join(part.strip() for part in item.body_lines if part.strip())
    first_prefix = f"{item.indent}{item.marker} "
    continuation_prefix = f"{item.indent}{' ' * (len(item.marker) + 1)}"
    width = max(20, options.line_width)
    return _wrap_text(
        text,
        width,
        initial=first_prefix,
        subsequent=continuation_prefix,
    )


def _list_spacing_mode(items: Sequence[ListItem], options: FormatOptions) -> str:
    return (
        options.spaced_numbered_lists
        if items[0].is_ordered
        else options.spaced_bullet_lists
    )


def _should_space_list(
    items: Sequence[ListItem],
    formatted_items: Sequence[Sequence[str]],
    options: FormatOptions,
) -> bool:
    mode = _list_spacing_mode(items, options)
    if mode == "always":
        return True

    if mode == "never":
        return False

    return any(
        item.is_complex or len(lines) > 1 for item, lines in zip(items, formatted_items)
    )


def _format_list_block(items: Sequence[ListItem], options: FormatOptions) -> list[str]:
    formatted_items = [_format_list_item(item, options) for item in items]
    spaced = _should_space_list(items, formatted_items, options)
    output: list[str] = []
    for index, item_lines in enumerate(formatted_items):
        if index and spaced:
            output.append("")

        output.extend(item_lines)

    return output


def _needs_blank_after_list(lines: Sequence[str], index: int) -> bool:
    if index >= len(lines) or not lines[index].strip():
        return False

    if ATX_HEADING_RE.match(lines[index]):
        return True

    return not _is_special_start(lines, index)


def _needs_blank_before_fence(output: Sequence[str]) -> bool:
    return bool(output) and output[-1] != ""


def _insert_blank_before_fences(lines: Sequence[str]) -> list[str]:
    output: list[str] = []
    in_fence = False
    fence_marker = ""
    fence_length = 0

    for line in lines:
        fence = _fence_info(line)
        opened_this_line = False
        if fence and not in_fence:
            if output and output[-1].strip():
                output.append("")

            fence_marker, fence_length = fence
            in_fence = True
            opened_this_line = True

        output.append(line)
        if (
            in_fence
            and not opened_this_line
            and _is_fence_close(line, fence_marker, fence_length)
        ):
            in_fence = False
            fence_marker = ""
            fence_length = 0

    return output


def format_markdown_text(text: str, options: FormatOptions | None = None) -> str:
    options = options or FormatOptions()
    text = _normalize_non_fenced_unicode(text)
    original_fenced_blocks = _complete_fenced_blocks(text)
    newline = (
        "\r\n" if "\r\n" in text and "\n" not in text.replace("\r\n", "") else "\n"
    )

    lines = text.splitlines()
    output: list[str] = []
    frontmatter, index = _split_frontmatter(lines)
    output.extend(frontmatter)

    while index < len(lines):
        line = lines[index]

        if not line.strip():
            output.append("")
            index += 1
            continue

        if _fence_info(line):
            if _needs_blank_before_fence(output):
                output.append("")

            block, index = _collect_fence(lines, index)
            output.extend(block)
            continue

        operator_help = _collect_sat_operator_help(lines, index)
        if operator_help is not None:
            block, index = operator_help
            output.extend(block)
            continue

        if HTML_COMMENT_START_RE.match(line):
            output.append(line)
            index += 1
            while "-->" not in output[-1] and index < len(lines):
                output.append(lines[index])
                index += 1

            continue

        if index + 1 < len(lines) and SETEXT_UNDERLINE_RE.match(lines[index + 1]):
            output.extend([lines[index], lines[index + 1]])
            index += 2
            continue

        if _is_table_start(lines, index):
            block, index = _collect_table(lines, index)
            output.extend(_format_table(block))
            continue

        if BLOCKQUOTE_RE.match(line):
            block, index = _collect_blockquote(lines, index)
            output.extend(_format_blockquote(block, options))
            continue

        if _list_match(line):
            items, index = _collect_list_block(lines, index)
            output.extend(_format_list_block(items, options))
            if _needs_blank_after_list(lines, index) and output and output[-1] != "":
                output.append("")

            continue

        if _is_special_start(lines, index):
            output.append(line)
            index += 1
            continue

        paragraph, index = _collect_paragraph(lines, index)
        output.extend(_format_paragraph(paragraph, options))

    formatted = newline.join(output).rstrip("\r\n") + newline
    return _restore_complete_fenced_blocks(formatted, original_fenced_blocks)


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "paths",
        nargs="+",
        type=Path,
        help="Markdown files or directories to format.",
    )

    parser.add_argument(
        "--line-width",
        type=int,
        default=DEFAULT_LINE_WIDTH,
        help="Preferred line width for reflowed prose and simple list items.",
    )

    parser.add_argument(
        "--style",
        choices=("sat-docs",),
        default="sat-docs",
        help="Formatting style preset. Only sat-docs is currently supported.",
    )

    parser.add_argument(
        "--spaced-numbered-lists",
        choices=("never", "always", "smart"),
        default="smart",
        help="Blank-line policy between ordered list items.",
    )

    parser.add_argument(
        "--spaced-bullet-lists",
        choices=("never", "always", "smart", "smart-conservative"),
        default="smart-conservative",
        help="Blank-line policy between bullet list items.",
    )

    parser.add_argument(
        "--allow-mojibake-markers",
        action="store_true",
        help=(
            "Do not fail on common mojibake markers. Use only when the markers "
            "are intentionally quoted examples."
        ),
    )

    mode = parser.add_mutually_exclusive_group()
    mode.add_argument(
        "--check", action="store_true", help="Fail when formatting changes are needed."
    )

    mode.add_argument("--write", action="store_true", help="Rewrite files in place.")
    args = parser.parse_args(argv)

    if args.line_width < 40:
        _fail("--line-width must be at least 40")

    files = _markdown_files(
        path.resolve() if path.is_absolute() else (Path.cwd() / path).resolve()
        for path in args.paths
    )

    if not files:
        _fail("no Markdown files found")

    options = FormatOptions(
        line_width=args.line_width,
        spaced_numbered_lists=args.spaced_numbered_lists,
        spaced_bullet_lists=args.spaced_bullet_lists,
    )

    changed: list[Path] = []
    encoding_errors: list[str] = []
    mojibake_errors: list[str] = []

    for path in files:
        original, read_error, had_bom = _read_utf8(path, allow_bom_repair=args.write)
        if read_error:
            encoding_errors.append(read_error)
            continue

        assert original is not None
        if not args.allow_mojibake_markers:
            current_mojibake_errors = _mojibake_issues(path, original)
            mojibake_errors.extend(current_mojibake_errors)
            if current_mojibake_errors:
                continue

        formatted = format_markdown_text(original, options)
        if formatted != original or had_bom:
            changed.append(path)
            if args.write:
                path.write_bytes(formatted.encode("utf-8"))

    if encoding_errors:
        print(
            f"[format_markdown] FAILED: {len(encoding_errors)} file(s) are not valid UTF-8",
            file=sys.stderr,
        )

        for item in encoding_errors:
            print(f"  - {item}", file=sys.stderr)

        return 2

    if mojibake_errors:
        print(
            f"[format_markdown] FAILED: {len(mojibake_errors)} possible mojibake issue(s)",
            file=sys.stderr,
        )

        for item in mojibake_errors:
            print(f"  - {item}", file=sys.stderr)

        return 1

    if changed and not args.write:
        print(
            f"[format_markdown] FAILED: {len(changed)} file(s) need formatting",
            file=sys.stderr,
        )

        for path in changed:
            print(f"  - {path}", file=sys.stderr)

        return 1

    action = "updated" if args.write else "checked"
    print(f"[format_markdown] OK: {len(files)} file(s) {action}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
