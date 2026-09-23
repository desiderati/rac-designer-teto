#!/usr/bin/env python3
"""Check or enforce the canonical SAT banner on default documentation entrypoints.

Only existing repository-relative surfaces are considered:

- README.md
- REPOSITORY-OVERVIEW.md
- docs/README.md

Exit codes:
- 0: every existing default surface is compliant, or write completed
- 1: --check found a missing, duplicated, or misplaced banner
- 2: usage, path, or UTF-8 error
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path
from typing import NoReturn, Sequence


CANONICAL_BANNER = (
    "![SAT](https://storage.googleapis.com/branding-artifacts/banner.png)"
)

DEFAULT_SURFACES = (
    Path("README.md"),
    Path("REPOSITORY-OVERVIEW.md"),
    Path("docs") / "README.md",
)


def _fail(message: str, code: int = 2) -> NoReturn:
    print(f"[ensure_sat_banner] error: {message}", file=sys.stderr)
    raise SystemExit(code)


def _newline_for(text: str) -> str:
    first_lf = text.find("\n")
    if first_lf > 0 and text[first_lf - 1] == "\r":
        return "\r\n"

    return "\n"


def _frontmatter_end(lines: Sequence[str]) -> int:
    if not lines or lines[0].strip() != "---":
        return 0

    for index in range(1, len(lines)):
        if lines[index].strip() in {"---", "..."}:
            return index + 1

    return 0


_FENCE_START = re.compile(r"^[ \t]{0,3}(`{3,}|~{3,})")


def _fence_start(line: str) -> tuple[str, int] | None:
    match = _FENCE_START.match(line)
    if match is None:
        return None

    marker = match.group(1)
    return marker[0], len(marker)


def _is_fence_end(line: str, character: str, minimum_length: int) -> bool:
    return bool(
        re.match(
            rf"^[ \t]{{0,3}}{re.escape(character)}{{{minimum_length},}}[ \t]*$",
            line,
        )
    )


def _line_ending(line: str) -> str:
    if line.endswith("\r\n"):
        return "\r\n"

    if line.endswith(("\n", "\r")):
        return line[-1]

    return ""


def _protect_fenced_blocks(text: str) -> tuple[str, dict[str, tuple[str, bool]]]:
    """Replace fenced blocks with collision-free tokens before banner normalization."""
    output: list[str] = []
    protected: dict[str, tuple[str, bool]] = {}
    lines = text.splitlines(keepends=True)
    index = 0

    while index < len(lines):
        opening = _fence_start(lines[index])
        if opening is None:
            output.append(lines[index])
            index += 1
            continue

        block_lines = [lines[index]]
        index += 1
        while index < len(lines):
            block_lines.append(lines[index])
            if _is_fence_end(lines[index].rstrip("\r\n"), *opening):
                index += 1
                break

            index += 1

        block = "".join(block_lines)
        terminal = _line_ending(block_lines[-1])
        token_index = len(protected)
        token = f"SAT_FENCED_BLOCK_{token_index}_OPAQUE"
        while token in text:
            token_index += 1
            token = f"SAT_FENCED_BLOCK_{token_index}_OPAQUE"

        output.append(token + terminal)
        protected[token] = (block, bool(terminal))

    return "".join(output), protected


def _restore_fenced_blocks(
    text: str,
    protected: dict[str, tuple[str, bool]],
    newline: str,
) -> str:
    for token, (block, had_terminal) in protected.items():
        placeholder = token + newline if had_terminal else token
        text = text.replace(placeholder, block, 1)

    return text


def _remove_banner_lines(lines: Sequence[str]) -> list[str]:
    cleaned: list[str] = []
    fence: tuple[str, int] | None = None
    index = 0
    while index < len(lines):
        line = lines[index]
        if fence is not None:
            cleaned.append(line)
            if _is_fence_end(line, *fence):
                fence = None

            index += 1
            continue

        fence = _fence_start(line)
        if fence is not None:
            cleaned.append(line)
            index += 1
            continue

        if line.strip() != CANONICAL_BANNER:
            cleaned.append(line)
            index += 1
            continue

        index += 1
        if (
            cleaned
            and not cleaned[-1].strip()
            and index < len(lines)
            and not lines[index].strip()
        ):
            index += 1

    return cleaned


def normalize_banner(text: str) -> str:
    masked, protected = _protect_fenced_blocks(text)
    newline = _newline_for(masked)
    had_final_newline = text.endswith(("\n", "\r"))
    lines = masked.splitlines()
    cleaned = _remove_banner_lines(lines)
    insert_at = _frontmatter_end(cleaned)
    prefix = cleaned[:insert_at]
    suffix = cleaned[insert_at:]

    while suffix and not suffix[0].strip():
        suffix.pop(0)

    output = list(prefix)
    if output and output[-1].strip():
        output.append("")

    output.extend((CANONICAL_BANNER, ""))
    output.extend(suffix)

    normalized = newline.join(output)
    if had_final_newline:
        normalized += newline

    return _restore_fenced_blocks(normalized, protected, newline)


def _read_utf8(path: Path) -> str:
    raw = path.read_bytes()
    if raw.startswith(b"\xef\xbb\xbf"):
        _fail(f"{path}: UTF-8 BOM is not allowed")

    try:
        return raw.decode("utf-8")
    except UnicodeDecodeError as exc:
        _fail(f"{path}: invalid UTF-8 at byte {exc.start}: {exc.reason}")


def _eligible_files(repo_root: Path) -> list[Path]:
    files: list[Path] = []
    for relative in DEFAULT_SURFACES:
        candidate = repo_root / relative
        if not candidate.exists():
            continue

        if not candidate.is_file():
            _fail(f"default documentation surface is not a file: {candidate}")

        resolved = candidate.resolve()
        if not resolved.is_relative_to(repo_root):
            _fail(f"default documentation surface escapes repository root: {candidate}")

        files.append(candidate)

    return files


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--repo-root",
        type=Path,
        default=Path.cwd(),
        help="Repository root containing the default documentation entrypoints.",
    )

    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument(
        "--check", action="store_true", help="Fail when a banner repair is required."
    )

    mode.add_argument(
        "--write", action="store_true", help="Apply the canonical banner placement."
    )

    args = parser.parse_args(argv)

    repo_root = args.repo_root.resolve()
    if not repo_root.is_dir():
        _fail(f"repository root not found: {repo_root}")

    changed: list[Path] = []
    for path in _eligible_files(repo_root):
        original = _read_utf8(path)
        normalized = normalize_banner(original)
        if normalized == original:
            continue

        changed.append(path)
        if args.write:
            path.write_bytes(normalized.encode("utf-8"))

    if args.check and changed:
        for path in changed:
            print(
                f"[ensure_sat_banner] banner repair required: {path.relative_to(repo_root)}",
                file=sys.stderr,
            )

        return 1

    if args.write:
        for path in changed:
            print(f"[ensure_sat_banner] updated: {path.relative_to(repo_root)}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
