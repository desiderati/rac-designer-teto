#!/usr/bin/env python3
"""Flag Markdown documentation claims that are not backed by repository evidence.

This validator enforces a single editorial rule promised by this skill:
"every statement must be backed by repository evidence". It parses a
Markdown documentation artifact and reports likely-false claims by
cross-checking against the actual repository tree.

Checks:

1. Path-like backticked tokens with explicit repository prefixes, or with
   surrounding prose that makes a local path claim, resolve to an existing file
   or directory. Example: a note that says "see `scripts/foo.sh`" must actually
   have that file on disk.

2. Paths referenced inside fenced code blocks (with explicit prefix like
   `./`, `docs/`, `scripts/`, `src/`, `tests/`, `.agents/`) are
   cross-checked against the repository tree.

3. Heuristic filter: tokens that look like shell commands, contractual values,
   external IDs, runtime locations, placeholders, model names, or bare artifact
   names without local-path claim context are not treated as path claims.

The validator is intentionally conservative — a missing reference is a
failure, an ambiguous token is ignored. This keeps false positives low
and keeps the tool useful in real editorial reviews.

Exit codes:
- 0: documentation evidence check passes
- 1: at least one path-like claim does not resolve on disk
- 2: usage error (README or repo root not found)

Usage:
    python scripts/validate_readme_evidence.py path/to/README.md
    python scripts/validate_readme_evidence.py path/to/REPOSITORY-OVERVIEW.md
    python scripts/validate_readme_evidence.py --repo-root . path/to/README.md
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path
from typing import Iterable, Iterator, List, NoReturn, Set, Tuple

BACKTICK_RE = re.compile(r"`([^`\n]+)`")
FENCE_RE = re.compile(r"^```")
PATH_PREFIX_PATTERNS = (
    "./",
    "../",
    ".\\",
    "..\\",
    "docs/",
    "docs\\",
    "scripts/",
    "scripts\\",
    "src/",
    "src\\",
    "tests/",
    "tests\\",
    "templates/",
    "templates\\",
    "references/",
    "references\\",
    "examples/",
    "examples\\",
    "prompts/",
    "prompts\\",
    "agents/",
    "agents\\",
    "assets/",
    "assets\\",
    ".agents/",
    ".agents\\",
    ".github/",
    ".github\\",
    "graphify-out/",
    "graphify-out\\",
)

# Tokens that look like prose mentions, not filesystem references.
_COMMAND_HINTS = (" ", "|", ">", "<", "$", "--", "  ")
_LOCAL_PATH_CLAIM_HINTS = (
    "see ",
    "read ",
    "open ",
    "load ",
    "run ",
    "execute ",
    "refer to ",
    "file ",
    "path ",
    "script ",
    "module ",
    "consulte ",
    "leia ",
    "abra ",
    "carregue ",
    "rode ",
    "execute ",
    "arquivo ",
    "caminho ",
    "script ",
    "módulo ",
    "modulo ",
)
_NON_LOCAL_CONTRACT_HINTS = (
    "baseline",
    "contract",
    "contractual",
    "convention",
    "external",
    "external id",
    "iam",
    "input",
    "literal",
    "model",
    "output",
    "pattern",
    "placeholder",
    "profile",
    "runtime",
    "score",
    "target repo",
    "target-repo",
    "valor",
    "valores",
    "contrato",
    "contratual",
    "convenção",
    "convencao",
    "entrada",
    "externo",
    "externa",
    "id iam",
    "insumo",
    "insumos",
    "literal",
    "modelo",
    "padrão",
    "padrao",
    "placeholder",
    "repositório alvo",
    "repositórios alvo",
    "repositório alvo",
    "repositórios alvo",
    "repo alvo",
    "saída",
    "saida",
)
# Well-known "virtual" path hints the skill mentions purely as concept.
_CONCEPTUAL_PATHS = {
    "docs/",
    "src/",
    "tests/",
    "scripts/",
    "templates/",
    "references/",
    "examples/",
    "prompts/",
    "agents/",
    "assets/",
    ".agents/",
    ".agents/prompts/",
    ".agents/refactorings/",
    ".agents/refactorings/prompts/",
    ".agents/refactorings/heuristics/",
    ".agents/templates/",
    "docs/architecture-decisions/",
    "REPOSITORY-OVERVIEW.md",
    "graphify-out/",
    "nanobanana-output/",
}
_PATH_PREFIX_RE = "|".join(re.escape(prefix) for prefix in PATH_PREFIX_PATTERNS)
_FENCE_PATH_RE = re.compile(
    r"(?<![A-Za-z0-9._/\\-])"
    r"((?:"
    + _PATH_PREFIX_RE
    + r")"
      r"[^\s`\"'()<>{}\[\],;:]+)"
)
_PLACEHOLDER_HINTS = (
    "{",
    "}",
    "<",
    ">",
    "*",
    "YYYY",
    "yyyy",
    "AAAAMMDD",
    "target-repo",
)
_EXTENSION_LITERAL_TOKENS = {".canvas", ".md"}
_DOMAIN_LIKE_RE = re.compile(r"^[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+){2,}$")
PathClaim = Tuple[int, str]


def _fail(message: str, code: int = 2) -> NoReturn:
    print(f"[validate_readme_evidence] error: {message}", file=sys.stderr)
    sys.exit(code)


def _is_command_like(token: str) -> bool:
    return any(hint in token for hint in _COMMAND_HINTS)


def _has_local_path_claim_context(line: str) -> bool:
    lowered = line.lower()
    if any(hint in lowered for hint in _NON_LOCAL_CONTRACT_HINTS):
        return False
    return any(hint in lowered for hint in _LOCAL_PATH_CLAIM_HINTS)


def _looks_like_path(token: str, line: str = "") -> bool:
    token = token.strip()
    if not token:
        return False
    if _is_command_like(token):
        return False
    if token.startswith(("http://", "https://", "mailto:")):
        return False
    if token in _EXTENSION_LITERAL_TOKENS:
        return False
    if "/" not in token and "\\" not in token and _DOMAIN_LIKE_RE.match(token):
        return False
    if token.startswith(PATH_PREFIX_PATTERNS):
        has_explicit_file_extension = re.search(
            r"\.[A-Za-z0-9]{1,6}(?:$|[/?#])", token.rstrip("/\\")
        ) is not None
        if (
                not has_explicit_file_extension
                and _has_local_path_claim_context(line) is False
                and any(hint in line.lower() for hint in _NON_LOCAL_CONTRACT_HINTS)
        ):
            return False
        return True
    has_extension = re.search(r"\.[A-Za-z0-9]{1,6}$", token) is not None
    if "/" in token or "\\" in token:
        return _has_local_path_claim_context(line)
    if has_extension:
        return _has_local_path_claim_context(line)
    return False


def _normalize(token: str) -> str:
    token = token.strip().rstrip(",.;:)")
    token = token.replace("\\", "/")
    if token.startswith("./"):
        token = token[2:]
    return token


def _looks_placeholder_like(token: str) -> bool:
    return any(hint in token for hint in _PLACEHOLDER_HINTS)


def _extract_backticked_paths(text: str) -> Iterable[PathClaim]:
    for line_index, line in enumerate(text.splitlines(), start=1):
        for match in BACKTICK_RE.finditer(line):
            token = match.group(1)
            if _looks_placeholder_like(token):
                continue
            if _looks_like_path(token, line):
                yield line_index, _normalize(token)


def _extract_fenced_code_paths(text: str) -> Iterable[PathClaim]:
    in_fence = False
    for line_index, line in enumerate(text.splitlines(), start=1):
        if FENCE_RE.match(line.strip()):
            in_fence = not in_fence
            continue
        if not in_fence:
            continue
        if any(hint in line.lower() for hint in _NON_LOCAL_CONTRACT_HINTS):
            continue
        for match in _FENCE_PATH_RE.finditer(line):
            token = _normalize(match.group(1))
            if _looks_placeholder_like(token):
                continue
            yield line_index, token


def _resolve(repo_root: Path, rel_path: str) -> Path:
    if rel_path.endswith("/"):
        rel_path = rel_path[:-1]
    return (repo_root / rel_path).resolve()


def _path_exists_under(root: Path, rel_path: str) -> bool:
    candidate = _resolve(root, rel_path)
    try:
        candidate.relative_to(root)
    except ValueError:
        return False
    if candidate.exists():
        return True

    parts = Path(rel_path).parts
    if parts and parts[0] == root.name:
        skill_local_candidate = _resolve(root, "/".join(parts[1:]))
        try:
            skill_local_candidate.relative_to(root)
        except ValueError:
            return False
        return skill_local_candidate.exists()

    return False


def _candidate_roots(repo_root: Path, readme_parent: Path) -> List[Path]:
    roots = [repo_root]
    if readme_parent != repo_root:
        roots.append(readme_parent)
    elif (repo_root / "SKILL.md").is_file() and repo_root.parent != repo_root:
        roots.append(repo_root.parent)
    return roots


def _resolves_on_disk(repo_root: Path, readme_parent: Path, rel_path: str) -> bool:
    if rel_path in _CONCEPTUAL_PATHS:
        return True
    return any(
        _path_exists_under(root, rel_path)
        for root in _candidate_roots(repo_root, readme_parent)
    )


def _iter_path_claims(text: str) -> Iterator[PathClaim]:
    yield from _extract_backticked_paths(text)
    yield from _extract_fenced_code_paths(text)


def _collect_unresolved_claims(
        text: str, repo_root: Path, readme_parent: Path
) -> tuple[Set[PathClaim], List[str]]:
    seen: Set[PathClaim] = set()
    violations: List[str] = []

    for claim in _iter_path_claims(text):
        if claim in seen:
            continue
        seen.add(claim)

        line_index, token = claim
        if not _resolves_on_disk(repo_root, readme_parent, token):
            violations.append(
                f"line {line_index}: claimed path '{token}' does not resolve under {repo_root}"
            )

    return seen, violations


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("readme", type=Path, help="Path to the Markdown file to validate")
    parser.add_argument(
        "--repo-root",
        type=Path,
        default=None,
        help="Repository root used to resolve path claims. Defaults to the README's parent directory.",
    )
    args = parser.parse_args()

    if not args.readme.is_file():
        _fail(f"README not found: {args.readme}")

    repo_root = (args.repo_root or args.readme.parent).resolve()
    if not repo_root.is_dir():
        _fail(f"repo root is not a directory: {repo_root}")

    text = args.readme.read_text(encoding="utf-8")
    seen, violations = _collect_unresolved_claims(text, repo_root, args.readme.parent.resolve())

    if violations:
        print(
            f"[validate_readme_evidence] FAILED with {len(violations)} unresolved claim(s):",
            file=sys.stderr,
        )
        for item in violations:
            print(f"  - {item}", file=sys.stderr)
        return 1

    checked = len(seen)
    print(
        f"[validate_readme_evidence] OK: {args.readme} ({checked} path claim(s) verified against {repo_root})"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
