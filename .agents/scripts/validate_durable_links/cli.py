#!/usr/bin/env python3
"""Reject durable Markdown links to local unversioned artifacts.

The documentation skill allows local operational files to inform knowledge
consolidation, but durable docs must not link to those files. This validator
checks Markdown files for local link targets and accepts them only when the
target is tracked by Git and is outside known local-only operational scopes.

Exit codes:
- 0: all local links are durable
- 1: at least one local link points to unversioned or blocked material
- 2: usage or repository error

Usage:
    python scripts/documentation_validate_durable_links.py --repo-root . docs OBSIDIAN.md
    python scripts/documentation_validate_durable_links.py --repo-root ../target-repo
"""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, Iterator, NoReturn
from urllib.parse import unquote


INLINE_LINK_RE = re.compile(r"(!?)\[([^\]]*)\]\(([^)\r\n]+)\)")
REFERENCE_DEF_RE = re.compile(r"^\s{0,3}\[[^\]\r\n]+\]:\s*(\S+)", re.MULTILINE)
WIKILINK_RE = re.compile(r"(!?)\[\[([^\]\n]+)\]\]")
HTML_LINK_RE = re.compile(r"\b(?:href|src)=[\"']([^\"']+)[\"']", re.IGNORECASE)
FENCE_OPEN_RE = re.compile(r"^\s{0,3}(?P<fence>`{3,}|~{3,})")
WINDOWS_ABSOLUTE_RE = re.compile(r"^[A-Za-z]:[\\/]")
IGNORED_SCHEMES = ("http:", "https:", "mailto:", "tel:", "data:")
BLOCKED_LOCAL_PREFIXES = (
    ".agents/work-items/",
    ".agents/changelogs/",
    ".agents/code-reviews/",
    ".agents/refactorings/",
    ".obsidian/",
    ".tmp/",
    "graphify-out/",
    "nanobanana-output/",
)


@dataclass(frozen=True)
class LinkClaim:
    file: Path
    line: int
    target: str
    kind: str
    is_wikilink: bool = False


def _fail(message: str, code: int = 2) -> NoReturn:
    print(f"[validate_durable_links] error: {message}", file=sys.stderr)
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
            files.append(path)
        else:
            _fail(f"documentation path not found: {path}")

    return sorted(dict.fromkeys(path.resolve() for path in files))


def _default_paths(repo_root: Path) -> list[Path]:
    paths = [repo_root / "OBSIDIAN.md", repo_root / "docs"]
    return [path for path in paths if path.exists()]


def _iter_markdown_segments(path: Path) -> Iterator[tuple[int, str]]:
    segment_start = 1
    segment_lines: list[str] = []
    fence_marker: str | None = None
    fence_length = 0

    for line_index, line in enumerate(
        path.read_text(encoding="utf-8").splitlines(keepends=True),
        start=1,
    ):
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
                yield segment_start, "".join(segment_lines)
                segment_lines = []

            fence = fence_match.group("fence")
            fence_marker = fence[0]
            fence_length = len(fence)
            continue

        if not line_without_ending.strip():
            if segment_lines:
                yield segment_start, "".join(segment_lines)
                segment_lines = []

            continue

        if not segment_lines:
            segment_start = line_index

        segment_lines.append(line)

    if segment_lines:
        yield segment_start, "".join(segment_lines)


def _line_number(segment_start: int, segment: str, offset: int) -> int:
    return segment_start + segment.count("\n", 0, offset)


def _split_markdown_destination(raw: str) -> str:
    value = raw.strip()
    if value.startswith("<"):
        closing = value.find(">")
        if closing != -1:
            return value[1:closing].strip()

    return value.split()[0].strip()


def _iter_links(path: Path) -> Iterator[LinkClaim]:
    for segment_start, segment in _iter_markdown_segments(path):
        claims: list[tuple[int, LinkClaim]] = []
        for match in INLINE_LINK_RE.finditer(segment):
            claims.append(
                (
                    match.start(),
                    LinkClaim(
                        file=path,
                        line=_line_number(segment_start, segment, match.start()),
                        target=_split_markdown_destination(match.group(3)),
                        kind="markdown-image" if match.group(1) else "markdown-link",
                    ),
                )
            )

        for match in REFERENCE_DEF_RE.finditer(segment):
            claims.append(
                (
                    match.start(),
                    LinkClaim(
                        file=path,
                        line=_line_number(segment_start, segment, match.start()),
                        target=_split_markdown_destination(match.group(1)),
                        kind="reference-link",
                    ),
                )
            )

        for match in WIKILINK_RE.finditer(segment):
            claims.append(
                (
                    match.start(),
                    LinkClaim(
                        file=path,
                        line=_line_number(segment_start, segment, match.start()),
                        target=match.group(2).strip(),
                        kind="wikilink-embed" if match.group(1) else "wikilink",
                        is_wikilink=True,
                    ),
                )
            )

        for match in HTML_LINK_RE.finditer(segment):
            claims.append(
                (
                    match.start(),
                    LinkClaim(
                        file=path,
                        line=_line_number(segment_start, segment, match.start()),
                        target=match.group(1).strip(),
                        kind="html-link",
                    ),
                )
            )

        for _, claim in sorted(claims, key=lambda item: item[0]):
            yield claim


def _strip_target_metadata(target: str, *, is_wikilink: bool) -> str:
    value = target.strip()
    if is_wikilink:
        value = value.split("|", 1)[0]

    value = value.split("#", 1)[0].split("?", 1)[0]
    return unquote(value.strip()).replace("\\", "/")


def _is_external_or_anchor(target: str) -> bool:
    value = target.strip().lower()
    return not value or value.startswith("#") or value.startswith(IGNORED_SCHEMES)


def _git_tracked_files(repo_root: Path) -> set[str]:
    result = subprocess.run(
        ["git", "-C", str(repo_root), "ls-files", "-z"],
        capture_output=True,
        text=False,
        check=False,
    )

    if result.returncode != 0:
        _fail(f"repo root is not a Git repository or cannot be inspected: {repo_root}")

    return {
        item.decode("utf-8").replace("\\", "/")
        for item in result.stdout.split(b"\0")
        if item
    }


def _is_blocked_local_scope(rel_path: str) -> bool:
    normalized = rel_path[2:] if rel_path.startswith("./") else rel_path.lstrip("/")
    for prefix in BLOCKED_LOCAL_PREFIXES:
        bare_prefix = prefix.rstrip("/")
        if normalized == bare_prefix or normalized.startswith(prefix):
            return True

    return False


def _tracked_path_exists(rel_path: str, tracked: set[str]) -> bool:
    normalized = rel_path.strip("/").replace("\\", "/")
    if normalized in tracked:
        return True

    if not Path(normalized).suffix and f"{normalized}.md" in tracked:
        return True

    directory_prefix = normalized.rstrip("/") + "/"
    return any(item.startswith(directory_prefix) for item in tracked)


def _tracked_wikilink_exists(target: str, tracked: set[str]) -> bool:
    normalized = target.strip("/").replace("\\", "/")
    if "/" in normalized:
        return _tracked_path_exists(normalized, tracked)

    return bool(_matching_bare_wikilink_paths(normalized, tracked))


def _matching_bare_wikilink_paths(target: str, tracked: set[str]) -> list[str]:
    return [
        item
        for item in tracked
        if item.endswith(".md")
        and (Path(item).stem == target or Path(item).name == target)
    ]


def _relative_target(
    claim: LinkClaim, repo_root: Path, target: str
) -> tuple[str | None, str | None]:
    if claim.is_wikilink and "/" not in target:
        return target, None

    if target.startswith("file:"):
        return None, "file URI links are local machine references"

    if WINDOWS_ABSOLUTE_RE.match(target):
        candidate = Path(target).resolve()
    elif target.startswith("/"):
        candidate = (repo_root / target.lstrip("/")).resolve()
    elif claim.is_wikilink:
        candidate = (repo_root / target).resolve()
    else:
        candidate = (claim.file.parent / target).resolve()

    try:
        return candidate.relative_to(repo_root).as_posix(), None
    except ValueError:
        return None, f"local link points outside repo root: {target}"


def _validate_claims(files: list[Path], repo_root: Path) -> tuple[int, list[str]]:
    tracked = _git_tracked_files(repo_root)
    checked = 0
    violations: list[str] = []

    for file_path in files:
        for claim in _iter_links(file_path):
            if _is_external_or_anchor(claim.target):
                continue

            target = _strip_target_metadata(claim.target, is_wikilink=claim.is_wikilink)
            if not target:
                continue

            rel_path, error = _relative_target(claim, repo_root, target)
            checked += 1
            if error:
                violations.append(
                    f"{claim.file}:{claim.line}: {claim.kind} target '{claim.target}' rejected: {error}"
                )

                continue

            assert rel_path is not None
            if _is_blocked_local_scope(rel_path):
                violations.append(
                    f"{claim.file}:{claim.line}: {claim.kind} target '{claim.target}' points to a local non-versioned scope"
                )

                continue

            if claim.is_wikilink and "/" not in rel_path:
                wikilink_matches = _matching_bare_wikilink_paths(rel_path, tracked)
                if any(_is_blocked_local_scope(match) for match in wikilink_matches):
                    violations.append(
                        f"{claim.file}:{claim.line}: {claim.kind} target '{claim.target}' resolves to a local non-versioned scope"
                    )

                    continue

                is_tracked = bool(wikilink_matches)
            elif claim.is_wikilink:
                is_tracked = _tracked_wikilink_exists(rel_path, tracked)
            else:
                is_tracked = _tracked_path_exists(rel_path, tracked)

            if not is_tracked:
                violations.append(
                    f"{claim.file}:{claim.line}: {claim.kind} target '{claim.target}' is not tracked by Git"
                )

    return checked, violations


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "paths",
        nargs="*",
        type=Path,
        help="Markdown files or directories to scan. Defaults to OBSIDIAN.md and docs/ when present.",
    )

    parser.add_argument(
        "--repo-root",
        type=Path,
        default=Path.cwd(),
        help="Repository root used to resolve and verify local link targets.",
    )

    args = parser.parse_args()

    repo_root = args.repo_root.resolve()
    if not repo_root.is_dir():
        _fail(f"repo root is not a directory: {repo_root}")

    requested_paths = args.paths or _default_paths(repo_root)
    if not requested_paths:
        _fail(
            "no documentation paths found; pass at least one Markdown file or directory"
        )

    scan_roots = [
        path.resolve() if path.is_absolute() else (Path.cwd() / path).resolve()
        for path in requested_paths
    ]

    files = _markdown_files(scan_roots)
    checked, violations = _validate_claims(files, repo_root)

    if violations:
        print(
            f"[validate_durable_links] FAILED with {len(violations)} violation(s):",
            file=sys.stderr,
        )

        for item in violations:
            print(f"  - {item}", file=sys.stderr)

        return 1

    print(
        f"[validate_durable_links] OK: {len(files)} file(s), {checked} local link(s) verified against Git"
    )

    return 0


if __name__ == "__main__":
    sys.exit(main())
