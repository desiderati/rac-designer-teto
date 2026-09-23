"""Plan or apply deterministic structural repairs to durable documentation.

The repairer owns structural sanitation only: canonical names, semantic placement, frontmatter,
indexes, local links, asset ownership, and root README casing. It never stages, commits, pushes, or
rewrites fenced code blocks.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import tomllib
import unicodedata
from dataclasses import asdict, dataclass
from pathlib import Path, PurePosixPath
from typing import Any, Iterable, Iterator, Sequence
from urllib.parse import unquote


SCHEMA_VERSION = 1
CANONICAL_NAME = "SIGLA-NNN[N]-slug.md"
CANONICAL_NAME_RE = re.compile(
    r"\A(?P<sigla>[A-Z][A-Z0-9]*)-(?P<number>\d{3,4})-"
    r"(?P<slug>[a-z0-9]+(?:-[a-z0-9]+)*)"
    r"(?P<qualifier>\.[a-z0-9]+(?:-[a-z0-9]+)*)?\.md\Z"
)

STRUCTURED_PRD_NAME_RE = re.compile(
    r"\A(?P<sigla>PRD)-(?P<number>\d{3,4})-"
    r"(?P<slug>[a-z0-9]+(?:-[a-z0-9]+)*)\.prd\.json\Z"
)

SUPPORT_SUFFIXES = {".mmd", ".puml", ".txt"}
FRONTMATTER_RE = re.compile(r"\A---\r?\n(?P<body>.*?)\r?\n---(?:\r?\n|$)", re.DOTALL)
FENCE_OPEN_RE = re.compile(r"^\s{0,3}(?P<fence>`{3,}|~{3,})")
INLINE_LINK_RE = re.compile(
    r"(?P<prefix>!?\[[^\]]*\]\()(?P<target>[^)\r\n]+)(?P<suffix>\))"
)

REFERENCE_DEF_RE = re.compile(
    r"(?P<prefix>^\s{0,3}\[[^\]\r\n]+\]:\s*)(?P<target>\S+)",
    re.MULTILINE,
)

REFERENCE_DEF_WITH_ID_RE = re.compile(
    r"^\s{0,3}\[(?P<id>[^\]\r\n]+)\]:\s*(?P<target>\S+)",
    re.MULTILINE,
)

NAVIGATION_LINK_RE = re.compile(
    r"(?P<inline>(?<!\!)\[(?P<inline_label>[^\]]*)\]"
    r"\((?P<inline_target>[^)\r\n]+)\))"
    r"|(?P<reference>(?<!\!)\[(?P<reference_label>[^\]]+)\]"
    r"\[(?P<reference_id>[^\]]*)\])"
    r"|(?P<wikilink>(?<!\!)\[\[(?P<wikilink_target>[^\]\r\n]+)\]\])"
)

WIKILINK_RE = re.compile(r"(?P<prefix>!?\[\[)(?P<target>[^\]\n]+)(?P<suffix>\]\])")
HTML_LINK_RE = re.compile(
    r"(?P<prefix>\b(?:href|src)=[\"'])(?P<target>[^\"']+)(?P<suffix>[\"'])",
    re.IGNORECASE,
)

LEGACY_NAVIGATION_MARKERS = (
    (
        "<!-- BEGIN SAT DOCUMENTATION INDEX -->",
        "<!-- END SAT DOCUMENTATION INDEX -->",
    ),
    (
        "<!-- BEGIN SAT DOCUMENTATION ROOT -->",
        "<!-- END SAT DOCUMENTATION ROOT -->",
    ),
    (
        "<!-- BEGIN SAT DURABLE RECORDS INDEX -->",
        "<!-- END SAT DURABLE RECORDS INDEX -->",
    ),
)

ASSETS_MARKER_BEGIN = "<!-- BEGIN SAT DOCUMENT ASSETS -->"
ASSETS_MARKER_END = "<!-- END SAT DOCUMENT ASSETS -->"
ROOT_SURFACES = ("README.md", "REPOSITORY-OVERVIEW.md", "OBSIDIAN.md")
NAVIGATION_SURFACES = ("README.md", "OBSIDIAN.md", "docs/README.md")
OPAQUE_DURABLE_LABEL_RE = re.compile(
    r"\A(?:BUG|INC|PROD|RISK|SEC)-[A-Z0-9]+(?:-[A-Z0-9]+)*\Z",
    re.IGNORECASE,
)

DURABLE_RECORD_ROLES = {
    ".agents/bug-analysis": "bug-analysis",
    ".agents/incidents": "incident-record",
    ".agents/production-changes": "production-change",
    ".agents/risk-assessments": "risk-assessment",
    ".agents/security-analysis": "security-analysis",
    ".agents/security-scans": "security-scan",
    ".agents/security-reviews": "security-review",
}

PROTECTED_RELEASE_DIRS = ("docs/releases/", "docs/release-notes/")
CANONICAL_RELEASE_NOTES_DIR = PurePosixPath("docs/release-notes")
LEGACY_RELEASE_NOTES_DIR = PurePosixPath("docs/releases-notes")
SANITIZED_RELEASE_NOTE_RE = re.compile(
    r"\ADOC-(?P<padded_number>\d{3})-(?P<number>\d+)\.md\Z"
)

SUPERPOWERS_PATTERNS = (
    re.compile(
        r"\Adocs/superpowers/plans/"
        r"\d{4}-\d{2}-\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*\.md\Z"
    ),
    re.compile(
        r"\Adocs/superpowers/specs/"
        r"\d{4}-\d{2}-\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*-design\.md\Z"
    ),
)

SIGLA_BY_DIRECTORY = {
    "architecture-decisions": "ADR",
    "bug-analysis": "BUG",
    "data-models": "MER",
    "engineering-playbook": "ENG",
    "execution-runbooks": "RUN",
    "git-governance": "GIT",
    "incident-reports": "INC",
    "knowledge-base": "KB",
    "product-requirements": "PRD",
    "prompts": "PROMPT",
    "security": "SEC",
    "system-specifications": "SPEC",
    "technical-specifications": "TECH",
}

DIRECTORY_BY_SIGLA = {
    "ADR": "architecture-decisions",
    "BUG": "bug-analysis",
    "DATA": "data-models",
    "ENG": "engineering-playbook",
    "GIT": "git-governance",
    "INC": "incident-reports",
    "KB": "knowledge-base",
    "MER": "data-models",
    "PRD": "product-requirements",
    "PROMPT": "prompts",
    "RUN": "execution-runbooks",
    "SEC": "security",
    "SPEC": "system-specifications",
    "TECH": "technical-specifications",
}

DOC_ROLE_BY_SIGLA = {
    "ADR": "architecture-decision",
    "BUG": "bug-analysis",
    "DATA": "data-model",
    "ENG": "engineering-playbook",
    "GIT": "git-governance",
    "INC": "incident-report",
    "KB": "knowledge-base",
    "MER": "data-model",
    "PRD": "product-requirement",
    "PROMPT": "prompt",
    "RUN": "execution-runbook",
    "SEC": "security-guide",
    "SPEC": "system-specification",
    "TECH": "technical-specification",
}

SIGLA_BY_DOC_ROLE = {value: key for key, value in DOC_ROLE_BY_SIGLA.items()}
SIGLA_KEYWORDS = (
    (re.compile(r"\badr\b|decis[aã]o de arquitetura", re.IGNORECASE), "ADR"),
    (re.compile(r"\bprd\b|requisito de produto", re.IGNORECASE), "PRD"),
    (re.compile(r"runbook|procedimento operacional", re.IGNORECASE), "RUN"),
    (re.compile(r"incidente|incident", re.IGNORECASE), "INC"),
    (re.compile(r"seguran[cç]a|security", re.IGNORECASE), "SEC"),
    (re.compile(r"modelo de dados|data model", re.IGNORECASE), "MER"),
    (re.compile(r"especifica[cç][aã]o|specification", re.IGNORECASE), "SPEC"),
)

PORTUGUESE_ACCENTED_WORDS = (
    "ação",
    "acentuação",
    "análise",
    "análises",
    "aplicação",
    "apresentação",
    "aprovação",
    "arquitetônica",
    "arquitetônico",
    "atenção",
    "atualização",
    "autenticação",
    "automação",
    "avaliação",
    "avaliações",
    "calibração",
    "catálogo",
    "célula",
    "células",
    "círculo",
    "classificação",
    "código",
    "comunicação",
    "conclusão",
    "configuração",
    "confiável",
    "conexão",
    "conteúdo",
    "correção",
    "correções",
    "criação",
    "critério",
    "critérios",
    "decisão",
    "definição",
    "definições",
    "descrição",
    "diagnóstico",
    "documentação",
    "domínio",
    "dossiê",
    "edição",
    "elegível",
    "evidência",
    "evidências",
    "execução",
    "exclusão",
    "especificação",
    "especificações",
    "estação",
    "evolução",
    "exceção",
    "expansão",
    "explícita",
    "explícito",
    "experiência",
    "fundação",
    "função",
    "genérico",
    "hipótese",
    "histórico",
    "ícone",
    "ícones",
    "implementação",
    "informação",
    "informações",
    "inicialização",
    "instalação",
    "inspeção",
    "integração",
    "integrações",
    "interação",
    "inventário",
    "invisível",
    "lógica",
    "manutenção",
    "método",
    "métodos",
    "migração",
    "não",
    "navegação",
    "negócio",
    "nível",
    "observação",
    "observações",
    "opção",
    "opções",
    "operação",
    "padrão",
    "paginação",
    "permissões",
    "política",
    "políticas",
    "prática",
    "práticas",
    "prático",
    "produção",
    "próprio",
    "próprios",
    "publicação",
    "reconciliação",
    "referência",
    "referências",
    "relação",
    "repositório",
    "repositórios",
    "requisição",
    "resolução",
    "revisão",
    "revisável",
    "segurança",
    "seleção",
    "separação",
    "serviço",
    "serviços",
    "símbolo",
    "sincronização",
    "solicitação",
    "solução",
    "também",
    "técnica",
    "técnicas",
    "técnico",
    "técnicos",
    "transação",
    "transações",
    "transição",
    "único",
    "únicos",
    "usuário",
    "usuários",
    "validação",
    "variável",
    "variáveis",
    "versão",
    "visível",
    "visão",
)

PORTUGUESE_ACCENT_REPLACEMENTS = {
    "".join(
        character
        for character in unicodedata.normalize("NFD", accented)
        if not unicodedata.combining(character)
    ): accented
    for accented in PORTUGUESE_ACCENTED_WORDS
}


class RepairError(RuntimeError):
    """Controlled structural-repair failure."""


@dataclass(frozen=True)
class Move:
    source: str
    target: str
    kind: str
    reason: str
    confidence: str


@dataclass(frozen=True)
class GateResult:
    gate: str
    status: str
    exit_code: int
    stdout: str
    stderr: str


@dataclass
class RepairPlan:
    repo_root: str
    moves: list[Move]
    content_targets: list[str]
    assumptions: list[str]
    warnings: list[str]
    protected_paths: list[str]


def _run_git(
    repo: Path,
    *args: str,
    check: bool = True,
    text: bool = True,
    env: dict[str, str] | None = None,
) -> subprocess.CompletedProcess[str] | subprocess.CompletedProcess[bytes]:
    result = subprocess.run(
        ["git", "-C", str(repo), *args],
        capture_output=True,
        text=text,
        encoding="utf-8" if text else None,
        errors="strict" if text else None,
        env=env,
        check=False,
    )

    if check and result.returncode != 0:
        stderr = (
            result.stderr.strip()
            if text
            else result.stderr.decode("utf-8", "replace").strip()
        )

        raise RepairError(f"git {' '.join(args)} failed: {stderr}")

    return result


def _git_text(repo: Path, *args: str) -> str:
    return str(_run_git(repo, *args).stdout).strip()


def _normalize_repo(path: Path) -> Path:
    root = Path(_git_text(path, "rev-parse", "--show-toplevel")).resolve()
    if not root.is_dir():
        raise RepairError(f"Git repository root does not exist: {root}")

    return root


def _normalize_relative(raw: str) -> str:
    normalized = raw.replace("\\", "/").strip()
    while normalized.startswith("./"):
        normalized = normalized[2:]

    path = PurePosixPath(normalized)
    if (
        not normalized
        or normalized.startswith("/")
        or any(part in {"", ".", ".."} for part in path.parts)
        or normalized == ".git"
        or normalized.startswith(".git/")
    ):
        raise RepairError(f"Invalid repository-relative path: {raw!r}")

    return normalized


def _tracked_paths(repo: Path) -> set[str]:
    output = bytes(_run_git(repo, "ls-files", "-z", text=False).stdout)
    return {
        item.decode("utf-8").replace("\\", "/") for item in output.split(b"\0") if item
    }


def _read_text(path: Path) -> tuple[str, str]:
    raw = path.read_bytes()
    if raw.startswith(b"\xef\xbb\xbf"):
        raw = raw[3:]

    try:
        text = raw.decode("utf-8")
    except UnicodeDecodeError as exc:
        raise RepairError(f"{path}: invalid UTF-8: {exc}") from exc

    newline = "\r\n" if b"\r\n" in raw else "\n"
    return text, newline


def _write_text(path: Path, text: str, newline: str) -> None:
    # Transformations already use the detected newline for inserted content. Writing the
    # resulting text verbatim preserves mixed line endings inside opaque fenced blocks.
    payload = text.encode("utf-8")
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, temporary_name = tempfile.mkstemp(
        dir=path.parent,
        prefix=f".{path.name}.",
        suffix=".tmp",
    )

    temporary = Path(temporary_name)
    try:
        with os.fdopen(fd, "wb") as handle:
            handle.write(payload)
            handle.flush()
            os.fsync(handle.fileno())

        os.replace(temporary, path)
    finally:
        if temporary.exists():
            temporary.unlink()


def _has_utf8_bom(path: Path) -> bool:
    return path.read_bytes().startswith(b"\xef\xbb\xbf")


def _relative(repo: Path, path: Path) -> str:
    try:
        return path.resolve().relative_to(repo).as_posix()
    except ValueError as exc:
        raise RepairError(f"Path outside repository: {path}") from exc


def _actual_relative_path(repo: Path, relative: str) -> str | None:
    current = repo
    actual_parts: list[str] = []
    for part in PurePosixPath(relative).parts:
        try:
            matches = [
                entry.name
                for entry in os.scandir(current)
                if entry.name.casefold() == part.casefold()
            ]
        except FileNotFoundError:
            return None

        if len(matches) != 1:
            return None

        actual_parts.append(matches[0])
        current /= matches[0]

    return PurePosixPath(*actual_parts).as_posix()


def _iter_markdown_files(root: Path) -> Iterator[Path]:
    if not root.exists():
        return

    for path in sorted(root.rglob("*")):
        if (
            path.is_file()
            and path.suffix.casefold() == ".md"
            and ".git" not in path.parts
        ):
            yield path


def _iter_structured_documents(root: Path) -> Iterator[Path]:
    if not root.exists():
        return

    for path in sorted(root.rglob("*.prd.json")):
        if (
            path.is_file()
            and ".git" not in path.parts
            and not _is_support_path(path.as_posix())
        ):
            yield path


def _structured_document_title(path: Path) -> str:
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError):
        return path.stem.removesuffix(".prd")

    if isinstance(payload, dict):
        metadata = payload.get("metadata")
        if isinstance(metadata, dict):
            title = metadata.get("title")
            if isinstance(title, str) and title.strip():
                return title.strip()

    return path.stem.removesuffix(".prd")


def _tracked_durable_records(repo: Path) -> list[Path]:
    tracked = _tracked_paths(repo)
    records: list[Path] = []
    for prefix in DURABLE_RECORD_ROLES:
        records.extend(
            repo / Path(relative)
            for relative in tracked
            if relative.startswith(prefix + "/") and relative.casefold().endswith(".md")
        )

    return sorted(set(path for path in records if path.is_file()))


def _parse_frontmatter(text: str) -> tuple[dict[str, str], re.Match[str] | None]:
    match = FRONTMATTER_RE.search(text)
    if not match:
        return {}, None

    fields: dict[str, str] = {}
    for line in match.group("body").splitlines():
        key, separator, value = line.partition(":")
        if separator:
            fields[key.strip()] = value.strip().strip("\"'")

    return fields, match


def _extract_title(text: str, fallback: str) -> str:
    fields, _ = _parse_frontmatter(text)
    if fields.get("title"):
        return fields["title"]

    for line in text.splitlines():
        if line.startswith("# "):
            return line[2:].strip()

    return fallback


def _slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    ascii_value = "".join(
        character for character in normalized if not unicodedata.combining(character)
    )

    ascii_value = ascii_value.encode("ascii", "ignore").decode("ascii").lower()
    slug = re.sub(r"[^a-z0-9]+", "-", ascii_value).strip("-")
    return slug or "documento"


def _strip_existing_identity(stem: str) -> str:
    value = re.sub(r"^[A-Za-z][A-Za-z0-9]*[-_. ]+\d{1,4}[-_. ]+", "", stem)
    value = re.sub(r"^\d{1,4}[-_. ]+", "", value)
    return value or stem


def _is_support_path(relative: str) -> bool:
    parts = PurePosixPath(relative).parts
    return (
        parts[:2] == ("docs", "documentation-assets")
        or any(part.endswith(".assets") for part in parts)
        or "generated" in parts
    )


def _is_protected_release(relative: str) -> bool:
    path = PurePosixPath(relative)
    return (
        path.suffix.casefold() == ".md"
        and path.stem.isdigit()
        and path.parent
        in {PurePosixPath(prefix.rstrip("/")) for prefix in PROTECTED_RELEASE_DIRS}
    )


def _is_release_notes_namespace(relative: str) -> bool:
    parts = PurePosixPath(relative).parts
    return len(parts) >= 2 and PurePosixPath(*parts[:2]) in {
        CANONICAL_RELEASE_NOTES_DIR,
        LEGACY_RELEASE_NOTES_DIR,
    }


def _canonical_release_note_target(relative: str) -> str | None:
    path = PurePosixPath(relative)
    if not _is_release_notes_namespace(relative):
        return None

    if path.suffix.casefold() != ".md":
        return None

    if path.stem.isdigit():
        number = path.stem
    else:
        sanitized = SANITIZED_RELEASE_NOTE_RE.fullmatch(path.name)
        if sanitized is None:
            return None

        number = sanitized.group("number")
        if int(sanitized.group("padded_number")) != int(number):
            return None

    return (CANONICAL_RELEASE_NOTES_DIR / f"{number}.md").as_posix()


def _is_superpowers_owned(relative: str) -> bool:
    return any(pattern.fullmatch(relative) for pattern in SUPERPOWERS_PATTERNS)


def _load_filename_exceptions(
    repo: Path,
) -> tuple[tuple[re.Pattern[str], ...], list[str]]:
    config = repo / ".agents" / "documentation.toml"
    if not config.exists():
        return (), []

    warnings: list[str] = []
    try:
        data = tomllib.loads(config.read_text(encoding="utf-8"))
    except (UnicodeDecodeError, tomllib.TOMLDecodeError) as exc:
        return (), [
            f"{_relative(repo, config)}: invalid optional config ignored: {exc}"
        ]

    table = data.get("docs_governance", {})
    raw_patterns = table.get("filename_patterns", []) if isinstance(table, dict) else []
    patterns: list[re.Pattern[str]] = []
    if not isinstance(raw_patterns, list):
        return (), [
            ".agents/documentation.toml: docs_governance.filename_patterns must be a list"
        ]

    for index, raw in enumerate(raw_patterns):
        if not isinstance(raw, str):
            warnings.append(
                f".agents/documentation.toml: filename_patterns[{index}] is not a string"
            )

            continue

        try:
            pattern = re.compile(raw)
        except re.error as exc:
            warnings.append(
                f".agents/documentation.toml: filename_patterns[{index}] is invalid: {exc}"
            )

            continue

        if not raw.startswith("^") and not raw.startswith(r"\A"):
            warnings.append(
                f".agents/documentation.toml: filename_patterns[{index}] is not anchored"
            )

            continue

        patterns.append(pattern)

    return tuple(patterns), warnings


def _infer_sigla(
    relative: str, title: str, fields: dict[str, str]
) -> tuple[str, str, str]:
    name = Path(relative).name
    existing = re.match(r"^(?P<sigla>[A-Z][A-Z0-9]{1,15})[-_. ]", name)
    if existing:
        return existing.group("sigla").upper(), "prefixo existente no nome", "alta"

    doc_role = fields.get("doc_role", "").strip().lower()
    if doc_role in SIGLA_BY_DOC_ROLE:
        return SIGLA_BY_DOC_ROLE[doc_role], f"doc_role={doc_role}", "alta"

    parts = PurePosixPath(relative).parts
    for part in reversed(parts[1:-1]):
        if part in SIGLA_BY_DIRECTORY:
            return SIGLA_BY_DIRECTORY[part], f"família semântica docs/{part}/", "alta"

    probe = f"{title} {name}"
    for pattern, sigla in SIGLA_KEYWORDS:
        if pattern.search(probe):
            return sigla, f"título ou nome compatível com {sigla}", "média"

    return (
        "DOC",
        "nenhuma família específica comprovada; fallback documental neutro",
        "baixa",
    )


def _candidate_number(name: str) -> int | None:
    for match in re.finditer(r"(?<!\d)(\d{1,4})(?!\d)", name):
        value = int(match.group(1))
        if 1 <= value <= 9999:
            return value

    return None


def _next_number(used: set[int]) -> int:
    for number in range(1, 1000):
        if number not in used:
            used.add(number)
            return number

    raise RepairError("No free documentation number remains for a SIGLA")


def _target_parent(relative: str, sigla: str) -> PurePosixPath:
    current = PurePosixPath(relative).parent
    if _is_release_notes_namespace(relative):
        semantic = DIRECTORY_BY_SIGLA.get(sigla)
        return PurePosixPath("docs", semantic) if semantic else PurePosixPath("docs")

    if current == PurePosixPath("docs"):
        return current

    if len(current.parts) > 1:
        return current

    semantic = DIRECTORY_BY_SIGLA.get(sigla)
    return PurePosixPath("docs", semantic) if semantic else current


def _move_target_for_document(
    relative: str,
    *,
    sigla: str,
    number: int,
    title: str,
) -> str:
    path = PurePosixPath(relative)
    stem = Path(path.name).stem
    qualifier = ""
    if stem.endswith(".prd"):
        stem = stem[: -len(".prd")]
        qualifier = ".prd"

    slug_source = _strip_existing_identity(stem)
    if _slugify(slug_source) in {"readme", "index", "documento"}:
        slug_source = title

    slug = _slugify(slug_source)
    width = 4 if number > 999 else 3
    name = f"{sigla}-{number:0{width}d}-{slug}{qualifier}.md"
    return (_target_parent(relative, sigla) / name).as_posix()


def _case_only_move(source: Path, target: Path) -> None:
    if source.as_posix() == target.as_posix():
        return

    target.parent.mkdir(parents=True, exist_ok=True)
    if source.as_posix().casefold() == target.as_posix().casefold():
        temporary = source.with_name(f".{source.name}.sat-case-{os.getpid()}")
        if temporary.exists():
            raise RepairError(f"Temporary casing path already exists: {temporary}")

        os.replace(source, temporary)
        os.replace(temporary, target)
        return

    os.replace(source, target)


def _path_is_protected(path: str, protected: set[str]) -> bool:
    folded = path.casefold()
    return any(
        folded == item.casefold()
        or folded.startswith(item.rstrip("/").casefold() + "/")
        or item.casefold().startswith(folded.rstrip("/") + "/")
        for item in protected
    )


def _support_owner(
    repo: Path,
    docs: Path,
    support_file: Path,
    document_moves: dict[str, str],
) -> str | None:
    markdown = [
        path
        for path in _iter_markdown_files(docs)
        if path.name.casefold() != "readme.md"
        and not _is_support_path(_relative(repo, path))
    ]

    exact = [
        path
        for path in markdown
        if path.parent == support_file.parent and path.stem == support_file.stem
    ]

    if len(exact) == 1:
        relative = _relative(repo, exact[0])
        return document_moves.get(relative, relative)

    identity = re.match(r"\A(?P<id>[A-Z][A-Z0-9]*-\d{3,4})-", support_file.name)
    if identity:
        candidates = [
            path
            for path in markdown
            if re.match(
                rf"\A{re.escape(identity.group('id'))}-",
                path.name,
            )
        ]

        if len(candidates) == 1:
            relative = _relative(repo, candidates[0])
            return document_moves.get(relative, relative)

    return None


def build_plan(repo: Path, protected_paths: Iterable[str]) -> RepairPlan:
    repo = _normalize_repo(repo)
    protected = sorted({_normalize_relative(path) for path in protected_paths})
    protected_set = set(protected)
    exceptions, warnings = _load_filename_exceptions(repo)
    moves: list[Move] = []
    assumptions: list[str] = []
    tracked = _tracked_paths(repo)

    readme_variants = sorted(
        path for path in tracked if "/" not in path and path.casefold() == "readme.md"
    )

    if len(readme_variants) > 1:
        raise RepairError("Repository tracks more than one root README casing variant")

    if readme_variants and readme_variants[0] != "README.md":
        source = _actual_relative_path(repo, readme_variants[0]) or readme_variants[0]
        move = Move(
            source=source,
            target="README.md",
            kind="case-normalization",
            reason="normalizar a superfície raiz canônica",
            confidence="alta",
        )

        moves.append(move)

    docs = repo / "docs"
    used: dict[str, set[int]] = {}
    documents: list[tuple[str, str, dict[str, str]]] = []
    normalized_release_note_sources: set[str] = set()
    normalized_release_note_targets: set[str] = set()
    if docs.exists():
        for path in _iter_markdown_files(docs):
            relative = _relative(repo, path)
            target = _canonical_release_note_target(relative)
            reason = (
                "normalizar o diretório de release notes preservando o nome numérico"
            )

            assumption = "release note numérica preservada no diretório canônico"
            if target is None or target == relative:
                canonical = CANONICAL_NAME_RE.fullmatch(path.name)
                if (
                    target is None
                    and _is_release_notes_namespace(relative)
                    and canonical
                ):
                    semantic = DIRECTORY_BY_SIGLA.get(canonical.group("sigla"))
                    parent = (
                        PurePosixPath("docs", semantic)
                        if semantic
                        else PurePosixPath("docs")
                    )

                    target = (parent / path.name).as_posix()
                    reason = "retirar documento identificado do namespace exclusivo de release notes"
                    assumption = (
                        "documento identificado preservado fora do namespace exclusivo"
                    )
                else:
                    continue

            if (
                repo / Path(target)
            ).exists() or target in normalized_release_note_targets:
                raise RepairError(
                    f"Release note target already exists while normalizing {relative}: {target}"
                )

            moves.append(
                Move(
                    source=relative,
                    target=target,
                    kind="document",
                    reason=reason,
                    confidence="alta",
                )
            )

            assumptions.append(f"{relative} -> {target}: {assumption} (confiança alta)")
            normalized_release_note_sources.add(relative)
            normalized_release_note_targets.add(target)

        for path in _iter_markdown_files(docs):
            relative = _relative(repo, path)
            if (
                relative in normalized_release_note_sources
                or _is_support_path(relative)
                or _is_protected_release(relative)
                or _is_superpowers_owned(relative)
                or path.name.casefold() == "readme.md"
                or any(pattern.fullmatch(relative) for pattern in exceptions)
            ):
                continue

            text, _ = _read_text(path)
            fields, _ = _parse_frontmatter(text)
            title = _extract_title(text, Path(relative).stem)
            documents.append((relative, title, fields))
            canonical = CANONICAL_NAME_RE.fullmatch(path.name)
            if canonical:
                used.setdefault(canonical.group("sigla"), set()).add(
                    int(canonical.group("number"))
                )

    reserved_targets = (
        {_relative(repo, path) for path in _iter_markdown_files(docs)}
        if docs.exists()
        else set()
    )

    for relative, title, fields in sorted(documents):
        if CANONICAL_NAME_RE.fullmatch(Path(relative).name):
            continue

        sigla, reason, confidence = _infer_sigla(relative, title, fields)
        numbers = used.setdefault(sigla, set())
        preferred = _candidate_number(Path(relative).stem)
        if preferred is not None and preferred not in numbers:
            numbers.add(preferred)
            number = preferred
        else:
            number = _next_number(numbers)

        target = _move_target_for_document(
            relative,
            sigla=sigla,
            number=number,
            title=title,
        )

        while target in reserved_targets and target != relative:
            number = _next_number(numbers)
            target = _move_target_for_document(
                relative,
                sigla=sigla,
                number=number,
                title=title,
            )

        reserved_targets.discard(relative)
        reserved_targets.add(target)
        if target != relative:
            moves.append(
                Move(
                    source=relative,
                    target=target,
                    kind="document",
                    reason=reason,
                    confidence=confidence,
                )
            )

            assumptions.append(
                f"{relative} -> {target}: SIGLA {sigla} escolhida por {reason} "
                f"(confiança {confidence})"
            )

    planned_casefold = {
        path.casefold() for move in moves for path in (move.source, move.target)
    }

    if docs.exists():
        tracked_by_casefold: dict[str, list[str]] = {}
        for tracked_path in tracked:
            if tracked_path.startswith("docs/"):
                tracked_by_casefold.setdefault(tracked_path.casefold(), []).append(
                    tracked_path
                )

        for path in sorted(item for item in docs.rglob("*") if item.is_file()):
            relative = _relative(repo, path)
            tracked_variants = tracked_by_casefold.get(relative.casefold(), [])
            if (
                len(tracked_variants) == 1
                and tracked_variants[0] != relative
                and relative.casefold() not in planned_casefold
            ):
                moves.append(
                    Move(
                        source=tracked_variants[0],
                        target=relative,
                        kind="case-normalization",
                        reason="normalizar o casing físico para o nome documental canônico",
                        confidence="alta",
                    )
                )

                planned_casefold.add(relative.casefold())

    document_moves = {
        move.source: move.target for move in moves if move.kind == "document"
    }

    if docs.exists():
        for support_file in sorted(
            path
            for path in docs.rglob("*")
            if path.is_file()
            and path.suffix.casefold() in SUPPORT_SUFFIXES
            and not _is_support_path(_relative(repo, path))
            and not _is_release_notes_namespace(_relative(repo, path))
        ):
            relative = _relative(repo, support_file)
            owner_target = _support_owner(repo, docs, support_file, document_moves)
            if owner_target is None:
                warnings.append(
                    f"{relative}: anexo solto sem proprietário inequívoco; revisão necessária"
                )

                continue

            owner_path = PurePosixPath(owner_target)
            if owner_path.parent == PurePosixPath("docs"):
                asset_parent = PurePosixPath(
                    "docs",
                    "documentation-assets",
                    owner_path.stem,
                )
            else:
                asset_parent = owner_path.with_name(owner_path.stem + ".assets")

            moves.append(
                Move(
                    source=relative,
                    target=(asset_parent / support_file.name).as_posix(),
                    kind="asset-file",
                    reason=f"associar anexo ao documento proprietário {owner_target}",
                    confidence="alta",
                )
            )

        for asset_dir in sorted(path for path in docs.rglob("*") if path.is_dir()):
            relative = _relative(repo, asset_dir)
            if relative == "docs/documentation-assets":
                continue

            if asset_dir.name.endswith(".assets"):
                owner_name = asset_dir.name[: -len(".assets")] + ".md"
                owner = asset_dir.with_name(owner_name)
                owner_relative = _relative(repo, owner)
                owner_target = document_moves.get(owner_relative, owner_relative)
                if not owner.exists() and owner_relative not in document_moves:
                    warnings.append(
                        f"{relative}: diretório de assets sem documento proprietário"
                    )

                    continue

                owner_target_path = PurePosixPath(owner_target)
                if owner_target_path.parent == PurePosixPath("docs"):
                    target = (
                        PurePosixPath(
                            "docs", "documentation-assets", owner_target_path.stem
                        )
                    ).as_posix()
                else:
                    target = owner_target_path.with_name(
                        owner_target_path.stem + ".assets"
                    ).as_posix()

                if target != relative:
                    moves.append(
                        Move(
                            source=relative,
                            target=target,
                            kind="asset-directory",
                            reason="acompanhar o documento proprietário na convenção híbrida",
                            confidence="alta",
                        )
                    )
            elif PurePosixPath(relative).parts[:2] == ("docs", "documentation-assets"):
                parts = PurePosixPath(relative).parts
                if len(parts) != 3:
                    continue

                owner_relative = f"docs/{asset_dir.name}.md"
                owner_target = document_moves.get(owner_relative, owner_relative)
                if (repo / owner_relative).exists() or owner_relative in document_moves:
                    target = (
                        f"docs/documentation-assets/{PurePosixPath(owner_target).stem}"
                    )

                    if target != relative:
                        moves.append(
                            Move(
                                source=relative,
                                target=target,
                                kind="asset-directory",
                                reason="acompanhar renomeação do documento raiz proprietário",
                                confidence="alta",
                            )
                        )
                else:
                    nested_matches = [
                        item
                        for item in _iter_markdown_files(docs)
                        if item.stem == asset_dir.name and item.parent != docs
                    ]

                    if len(nested_matches) == 1:
                        nested_relative = _relative(repo, nested_matches[0])
                        nested_target = document_moves.get(
                            nested_relative, nested_relative
                        )

                        target = (
                            PurePosixPath(nested_target)
                            .with_name(PurePosixPath(nested_target).stem + ".assets")
                            .as_posix()
                        )

                        moves.append(
                            Move(
                                source=relative,
                                target=target,
                                kind="asset-directory",
                                reason="reposicionar assets ao lado do único proprietário aninhado",
                                confidence="alta",
                            )
                        )
                    else:
                        warnings.append(
                            f"{relative}: nenhum proprietário raiz e associação aninhada não inequívoca"
                        )

    for move in moves:
        if _path_is_protected(move.source, protected_set) or _path_is_protected(
            move.target, protected_set
        ):
            raise RepairError(
                f"Structural repair would touch protected path: {move.source} -> {move.target}"
            )

    targets: dict[str, str] = {}
    for move in moves:
        folded = move.target.casefold()
        previous = targets.get(folded)
        if previous and previous != move.source:
            raise RepairError(
                f"Two repair operations target the same path: {previous} and {move.source}"
            )

        targets[folded] = move.source

    move_mapping = {move.source: move.target for move in moves}
    content_targets = {
        move_mapping.get(relative, relative) for relative, _, _ in documents
    }

    content_targets.update(
        surface for surface in ROOT_SURFACES if (repo / surface).is_file()
    )

    if docs.exists():
        content_targets.update(
            move_mapping.get(_relative(repo, path), _relative(repo, path))
            for path in _iter_markdown_files(docs)
        )

        content_targets.update(
            _relative(repo, path) for path in _iter_structured_documents(docs)
        )

        content_targets.update({"docs/README.md", "OBSIDIAN.md"})

    durable_records = _tracked_durable_records(repo)
    content_targets.update(_relative(repo, path) for path in durable_records)
    if durable_records:
        content_targets.add("OBSIDIAN.md")

    return RepairPlan(
        repo_root=str(repo),
        moves=moves,
        content_targets=sorted(content_targets),
        assumptions=sorted(set(assumptions)),
        warnings=sorted(set(warnings)),
        protected_paths=protected,
    )


def _split_target(raw: str) -> tuple[str, str, str]:
    value = raw.strip()
    wrapped = value.startswith("<") and value.endswith(">")
    if wrapped:
        value = value[1:-1]

    match = re.match(r"^(?P<path>[^#?]*)(?P<suffix>[#?].*)?$", value)
    if not match:
        return raw, "", ""

    return match.group("path"), match.group("suffix") or "", "<>" if wrapped else ""


def _is_external(raw: str) -> bool:
    lowered = raw.strip().lower()
    return (
        not lowered
        or lowered.startswith(
            ("#", "http:", "https:", "mailto:", "tel:", "data:", "file:")
        )
        or re.match(r"^[a-z][a-z0-9+.-]*:", lowered) is not None
        or re.match(r"^[a-zA-Z]:[\\/]", raw.strip()) is not None
    )


def _relative_link(source: str, target: str) -> str:
    source_parent = PurePosixPath(source).parent
    relative = os.path.relpath(
        PurePosixPath(target).as_posix(),
        start=source_parent.as_posix() or ".",
    ).replace("\\", "/")

    if not relative.startswith("."):
        return f"./{relative}"

    return relative


def _resolve_link(source: str, target: str) -> str | None:
    if _is_external(target):
        return None

    path_part, _, _ = _split_target(target)
    decoded = unquote(path_part).replace("\\", "/")
    if not decoded:
        return None

    combined = PurePosixPath(source).parent / PurePosixPath(decoded)
    normalized = os.path.normpath(combined.as_posix()).replace("\\", "/")
    if normalized.startswith("../") or normalized == "..":
        return None

    while normalized.startswith("./"):
        normalized = normalized[2:]

    return normalized


def _rewrite_target(
    raw: str,
    *,
    source_before: str,
    source_after: str,
    mapping: dict[str, str],
) -> str:
    target_path, suffix, wrapping = _split_target(raw)
    resolved = _resolve_link(source_before, target_path)
    if resolved is None:
        return raw

    destination = mapping.get(resolved, resolved)
    if destination == resolved and source_before == source_after:
        return raw

    rendered = _relative_link(source_after, destination) + suffix
    return f"<{rendered}>" if wrapping else rendered


def _rewrite_wikilink_target(raw: str, mapping: dict[str, str]) -> str:
    value = raw.strip()
    owner, separator, alias = value.partition("|")
    path_part, suffix, _ = _split_target(owner)
    original = unquote(path_part).replace("\\", "/").strip()
    if not original:
        return raw

    had_extension = original.casefold().endswith(".md")
    destination: str | None = None
    if "/" in original:
        normalized = original.lstrip("/")
        candidates = [normalized]
        if not had_extension:
            candidates.append(f"{normalized}.md")

        for candidate in candidates:
            if candidate in mapping:
                destination = mapping[candidate]
                break
    else:
        matches = [
            target
            for source, target in mapping.items()
            if source.casefold().endswith(".md")
            and (
                PurePosixPath(source).stem == original
                or PurePosixPath(source).name == original
            )
        ]

        if len(matches) == 1:
            destination = PurePosixPath(matches[0]).name

    if destination is None:
        return raw

    if not had_extension and destination.casefold().endswith(".md"):
        destination = destination[:-3]

    rewritten = destination + suffix
    if separator:
        rewritten += f"|{alias}"

    return rewritten


def _transform_non_fenced(text: str, transform: Any) -> str:
    lines = text.splitlines(keepends=True)
    output: list[str] = []
    chunk: list[str] = []
    fence_marker: str | None = None
    fence_length = 0

    def flush() -> None:
        if chunk:
            output.append(transform("".join(chunk)))
            chunk.clear()

    for line in lines:
        bare = line.rstrip("\r\n")
        if fence_marker is not None:
            output.append(line)
            close_re = re.compile(
                rf"^\s{{0,3}}{re.escape(fence_marker)}{{{fence_length},}}\s*$"
            )

            if close_re.fullmatch(bare):
                fence_marker = None
                fence_length = 0

            continue

        match = FENCE_OPEN_RE.match(bare)
        if match:
            flush()
            output.append(line)
            fence = match.group("fence")
            fence_marker = fence[0]
            fence_length = len(fence)
            continue

        chunk.append(line)

    flush()
    return "".join(output)


def _rewrite_links(
    text: str,
    *,
    source_before: str,
    source_after: str,
    mapping: dict[str, str],
) -> str:
    def transform(chunk: str) -> str:
        def replace(match: re.Match[str]) -> str:
            target = _rewrite_target(
                match.group("target"),
                source_before=source_before,
                source_after=source_after,
                mapping=mapping,
            )

            prefix = match.groupdict().get("prefix", "")
            suffix = match.groupdict().get("suffix", "")
            return f"{prefix}{target}{suffix}"

        chunk = INLINE_LINK_RE.sub(replace, chunk)
        chunk = REFERENCE_DEF_RE.sub(replace, chunk)
        chunk = WIKILINK_RE.sub(
            lambda match: (
                f"{match.group('prefix')}"
                f"{_rewrite_wikilink_target(match.group('target'), mapping)}"
                f"{match.group('suffix')}"
            ),
            chunk,
        )

        chunk = HTML_LINK_RE.sub(replace, chunk)
        return chunk

    return _transform_non_fenced(text, transform)


PROTECTED_PROSE_TOKEN_RE = re.compile(
    r"!?\[\[[^\]\r\n]+\]\]"
    r"|!?\[[^\]\r\n]*\.[A-Za-z0-9]{1,8}\](?=\()"
    r"|`+[^`\r\n]*`+"
    r"|https?://[^\s)>]+"
    r"|(?<=\]\()[^)\r\n]+"
    r"|(?<=\]:\s)[^\s]+"
    r"|(?:[A-Za-z]:[\\/]|(?:\.\.?/))\S+"
)


def _restore_word_case(source: str, replacement: str) -> str:
    if source.isupper():
        return source

    if source[:1].isupper():
        return replacement[:1].upper() + replacement[1:]

    return replacement


def _normalize_portuguese_prose(text: str) -> str:
    """Apply only unambiguous Portuguese accent repairs outside technical literals."""

    frontmatter = FRONTMATTER_RE.match(text)
    preserved_frontmatter = frontmatter.group(0) if frontmatter else ""
    prose_text = text[frontmatter.end() :] if frontmatter else text

    pattern = re.compile(
        r"\b("
        + "|".join(
            sorted(
                (re.escape(word) for word in PORTUGUESE_ACCENT_REPLACEMENTS),
                key=len,
                reverse=True,
            )
        )
        + r")\b",
        re.IGNORECASE,
    )

    def normalize_chunk(chunk: str) -> str:
        chunk = unicodedata.normalize("NFC", chunk)
        output: list[str] = []
        offset = 0
        for protected in PROTECTED_PROSE_TOKEN_RE.finditer(chunk):
            prose = chunk[offset : protected.start()]
            output.append(
                pattern.sub(
                    lambda match: _restore_word_case(
                        match.group(0),
                        PORTUGUESE_ACCENT_REPLACEMENTS[match.group(0).casefold()],
                    ),
                    prose,
                )
            )

            output.append(protected.group(0))
            offset = protected.end()

        output.append(
            pattern.sub(
                lambda match: _restore_word_case(
                    match.group(0),
                    PORTUGUESE_ACCENT_REPLACEMENTS[match.group(0).casefold()],
                ),
                chunk[offset:],
            )
        )

        return "".join(output)

    return preserved_frontmatter + _transform_non_fenced(prose_text, normalize_chunk)


def _fenced_blocks(text: str) -> list[str]:
    lines = text.splitlines(keepends=True)
    blocks: list[str] = []
    active: list[str] | None = None
    marker: str | None = None
    length = 0
    for line in lines:
        bare = line.rstrip("\r\n")
        if active is not None:
            active.append(line)
            close_re = re.compile(
                rf"^\s{{0,3}}{re.escape(marker or '')}{{{length},}}\s*$"
            )

            if close_re.fullmatch(bare):
                blocks.append("".join(active))
                active = None
                marker = None
                length = 0

            continue

        match = FENCE_OPEN_RE.match(bare)
        if match:
            fence = match.group("fence")
            marker = fence[0]
            length = len(fence)
            active = [line]

    return blocks


def _ensure_frontmatter(text: str, *, title: str, doc_role: str, newline: str) -> str:
    fields, match = _parse_frontmatter(text)
    missing: list[str] = []
    if not fields.get("title"):
        escaped = title.replace("\\", "\\\\").replace('"', '\\"')
        missing.append(f'title: "{escaped}"')

    if not fields.get("doc_role"):
        missing.append(f"doc_role: {doc_role}")

    if not missing:
        return text

    if match:
        body = match.group("body")
        replacement = (
            f"---{newline}{body}{newline}{newline.join(missing)}{newline}---{newline}"
        )

        return replacement + text[match.end() :]

    return f"---{newline}{newline.join(missing)}{newline}---{newline}{newline}{text}"


def _doc_role(path: Path, text: str) -> str:
    canonical = CANONICAL_NAME_RE.fullmatch(path.name)
    if canonical:
        return DOC_ROLE_BY_SIGLA.get(canonical.group("sigla"), "guide")

    relative = path.as_posix()
    for prefix, role in DURABLE_RECORD_ROLES.items():
        if relative.startswith(prefix + "/"):
            return role

    if relative.endswith("/README.md") or relative == "docs/README.md":
        return "docs-index"

    if _is_protected_release(relative):
        return "release-manifest"

    if _is_superpowers_owned(relative):
        return (
            "implementation-plan" if "/plans/" in relative else "design-specification"
        )

    fields, _ = _parse_frontmatter(text)
    return fields.get("doc_role") or "guide"


def _replace_managed_section(
    text: str,
    *,
    begin: str,
    end: str,
    body: str,
    newline: str,
) -> str:
    block = f"{begin}{newline}{body.rstrip()}{newline}{end}"
    begin_pattern = r"\s+".join(re.escape(part) for part in begin.split())
    end_pattern = r"\s+".join(re.escape(part) for part in end.split())
    pattern = re.compile(
        rf"{begin_pattern}.*?{end_pattern}",
        re.DOTALL,
    )

    matches = list(pattern.finditer(text))
    if len(matches) == 1:
        return pattern.sub(block, text, count=1)

    if len(matches) > 1:
        without_managed_blocks = pattern.sub("", text).rstrip("\r\n")
        separator = newline * 2 if without_managed_blocks else ""
        return f"{without_managed_blocks}{separator}{block}{newline}"

    stripped = text.rstrip("\r\n")
    separator = newline * 2 if stripped else ""
    return f"{stripped}{separator}{block}{newline}"


def _remove_legacy_navigation_markers(text: str, newline: str) -> str:
    """Remove legacy machine-owned navigation blocks instead of recreating them."""

    def remove(chunk: str) -> str:
        updated = chunk
        for begin, end in LEGACY_NAVIGATION_MARKERS:
            begin_pattern = r"\s+".join(re.escape(part) for part in begin.split())
            end_pattern = r"\s+".join(re.escape(part) for part in end.split())
            updated = re.sub(
                rf"(?:\r?\n){{0,2}}{begin_pattern}.*?{end_pattern}(?:\r?\n){{0,2}}",
                newline * 2,
                updated,
                flags=re.DOTALL,
            )

            for marker_pattern in (begin_pattern, end_pattern):
                updated = re.sub(
                    rf"(?m)^[ \t]*{marker_pattern}[ \t]*(?:\r?\n|$)",
                    "",
                    updated,
                )

        updated = re.sub(r"(?:\r?\n){3,}", newline * 2, updated)
        return updated

    return _transform_non_fenced(text, remove)


def _heading_section_span(text: str, title: str) -> tuple[int, int] | None:
    start: int | None = None
    offset = 0
    fence_marker: str | None = None
    fence_length = 0
    target_re = re.compile(rf"^##[ \t]+{re.escape(title)}[ \t]*$")
    heading_re = re.compile(r"^#{1,2}[ \t]+")
    for line in text.splitlines(keepends=True):
        bare = line.rstrip("\r\n")
        if fence_marker is not None:
            close_re = re.compile(
                rf"^\s{{0,3}}{re.escape(fence_marker)}{{{fence_length},}}\s*$"
            )

            if close_re.fullmatch(bare):
                fence_marker = None
                fence_length = 0

            offset += len(line)
            continue

        fence = FENCE_OPEN_RE.match(bare)
        if fence:
            marker = fence.group("fence")
            fence_marker = marker[0]
            fence_length = len(marker)
            offset += len(line)
            continue

        if start is None and target_re.fullmatch(bare):
            start = offset
        elif start is not None and heading_re.match(bare):
            return start, offset

        offset += len(line)

    return (start, len(text)) if start is not None else None


def _remove_heading_section(text: str, title: str) -> str:
    span = _heading_section_span(text, title)
    if span is None:
        return text

    start, end = span
    return f"{text[:start]}{text[end:]}"


def _append_heading_section(
    text: str,
    *,
    title: str,
    entries: Sequence[str],
    newline: str,
) -> str:
    stripped = text.rstrip("\r\n")
    if not entries:
        return stripped + newline

    body = newline.join((f"## {title}", "", *entries))
    separator = newline * 2 if stripped else ""
    return f"{stripped}{separator}{body}{newline}"


def _merge_heading_section(
    text: str,
    *,
    title: str,
    entries: Sequence[str],
    newline: str,
) -> str:
    if not entries:
        return text.rstrip("\r\n") + newline

    span = _heading_section_span(text, title)
    if span is None:
        return _append_heading_section(
            text,
            title=title,
            entries=entries,
            newline=newline,
        )

    start, end = span
    section = text[start:end].rstrip("\r\n")
    suffix = text[end:].lstrip("\r\n")
    merged = f"{section}{newline * 2}{newline.join(entries)}{newline}"
    if suffix:
        merged += f"{newline}{suffix}"

    return f"{text[:start]}{merged}"


def _h2_sections(text: str) -> tuple[str, list[tuple[str, str]]]:
    """Split an Markdown document into its preamble and visible H2 sections."""

    headings: list[tuple[int, str]] = []
    offset = 0
    fence_marker: str | None = None
    fence_length = 0
    heading_re = re.compile(r"^##[ \t]+(?P<title>.*?)[ \t]*$")
    for line in text.splitlines(keepends=True):
        bare = line.rstrip("\r\n")
        if fence_marker is not None:
            close_re = re.compile(
                rf"^\s{{0,3}}{re.escape(fence_marker)}{{{fence_length},}}\s*$"
            )

            if close_re.fullmatch(bare):
                fence_marker = None
                fence_length = 0

            offset += len(line)
            continue

        fence = FENCE_OPEN_RE.match(bare)
        if fence:
            marker = fence.group("fence")
            fence_marker = marker[0]
            fence_length = len(marker)
            offset += len(line)
            continue

        heading = heading_re.fullmatch(bare)
        if heading:
            headings.append((offset, heading.group("title").strip()))

        offset += len(line)

    if not headings:
        return text, []

    preamble = text[: headings[0][0]]
    sections = [
        (
            title,
            text[
                start : headings[index + 1][0]
                if index + 1 < len(headings)
                else len(text)
            ],
        )
        for index, (start, title) in enumerate(headings)
    ]

    return preamble, sections


def _retitle_h2_section(section: str, title: str, newline: str) -> str:
    _, separator, body = section.partition("\n")
    if not separator:
        return f"## {title}{newline}"

    return f"## {title}{newline}{body.lstrip(chr(13))}"


def _remove_orphaned_indented_list_items(section: str) -> str:
    """Drop nested list items whose top-level owner is no longer present."""

    output: list[str] = []
    has_list_owner = False
    for line in section.splitlines(keepends=True):
        bare = line.rstrip("\r\n")
        if re.match(r"^[ \t]{2,}[-*+]\s+\S", bare):
            if has_list_owner:
                output.append(line)

            continue

        if re.match(r"^[ \t]?[-*+]\s+\S", bare):
            has_list_owner = True
            output.append(line)
            continue

        if bare.strip() and not re.match(r"^[ \t]{2,}\S", bare):
            has_list_owner = False

        if not bare.strip() or has_list_owner or not re.match(r"^[ \t]{2,}\S", bare):
            output.append(line)

    return "".join(output)


def _remove_navigation_targets(
    repo: Path,
    source: str,
    text: str,
    targets: set[str],
) -> str:
    """Remove selected local links while preserving surrounding prose."""

    normalized_targets = {target.casefold() for target in targets}
    references = _reference_definitions(text)
    wikilinks = _wikilink_index(repo)

    def remove(chunk: str) -> str:
        output: list[str] = []
        cursor = 0
        for match in NAVIGATION_LINK_RE.finditer(chunk):
            resolved: str | None = None
            label: str
            if match.group("inline") is not None:
                raw_target = match.group("inline_target")
                resolved = _resolve_link(source, raw_target)
                label = match.group("inline_label")
            elif match.group("reference") is not None:
                label = match.group("reference_label")
                identifier = match.group("reference_id") or label
                raw_target = references.get(" ".join(identifier.split()).casefold())
                if raw_target:
                    resolved = _resolve_link(source, raw_target)
            else:
                raw_target = match.group("wikilink_target")
                owner, separator, alias = raw_target.partition("|")
                label = (
                    alias if separator else PurePosixPath(owner.split("#", 1)[0]).stem
                )

                resolved = _resolve_navigation_wikilink(
                    repo,
                    source,
                    raw_target,
                    index=wikilinks,
                )

            if resolved is None or resolved.casefold() not in normalized_targets:
                continue

            start, end = match.span()
            line_start = chunk.rfind("\n", 0, start) + 1
            line_break = chunk.find("\n", end)
            line_content_end = len(chunk) if line_break == -1 else line_break
            line_end = len(chunk) if line_break == -1 else line_break + 1
            prefix = chunk[line_start:start]
            suffix = chunk[end:line_content_end]
            if re.fullmatch(r"\s{0,3}[-*+]\s+", prefix) and not suffix.strip():
                output.append(chunk[cursor:line_start])
                cursor = line_end
                while cursor < len(chunk):
                    next_break = chunk.find("\n", cursor)
                    next_end = len(chunk) if next_break == -1 else next_break + 1
                    next_line = chunk[cursor:next_end].rstrip("\r\n")
                    if not next_line.strip() or re.match(r"^[ \t]{2,}\S", next_line):
                        cursor = next_end
                        continue

                    break

                continue

            output.append(chunk[cursor:start])
            output.append(label)
            cursor = end

        output.append(chunk[cursor:])
        return "".join(output)

    return _transform_non_fenced(text, remove)


def _reference_definitions(text: str) -> dict[str, str]:
    definitions: dict[str, str] = {}

    def collect(chunk: str) -> str:
        for match in REFERENCE_DEF_WITH_ID_RE.finditer(chunk):
            identifier = " ".join(match.group("id").split()).casefold()
            definitions[identifier] = match.group("target")

        return chunk

    _transform_non_fenced(text, collect)
    return definitions


def _wikilink_index(repo: Path) -> dict[str, list[str]]:
    index: dict[str, list[str]] = {}
    candidates = [
        repo / surface for surface in ROOT_SURFACES if (repo / surface).is_file()
    ]

    candidates.extend(_iter_markdown_files(repo / "docs"))
    candidates.extend(_tracked_durable_records(repo))
    for path in sorted(set(candidates)):
        relative = _relative(repo, path)
        index.setdefault(path.stem.casefold(), []).append(relative)

    return index


def _resolve_navigation_wikilink(
    repo: Path,
    source: str,
    raw: str,
    *,
    index: dict[str, list[str]],
) -> str | None:
    owner = raw.strip().split("|", 1)[0]
    target, _, _ = _split_target(owner)
    if not target:
        return None

    normalized = unquote(target).replace("\\", "/").strip()
    if "/" in normalized or normalized.casefold().endswith(".md"):
        candidate = (
            normalized
            if normalized.startswith(("docs/", ".agents/"))
            else _resolve_link(source, normalized)
        )

        if candidate is None:
            return None

        path = repo / Path(candidate)
        if path.is_file():
            return candidate

        if not candidate.casefold().endswith(".md"):
            markdown = repo / Path(f"{candidate}.md")
            if markdown.is_file():
                return f"{candidate}.md"

        return None

    matches = index.get(PurePosixPath(normalized).stem.casefold(), [])
    return matches[0] if len(matches) == 1 else None


def _visible_navigation_targets(repo: Path, source: str, text: str) -> set[str]:
    references = _reference_definitions(text)
    wikilinks = _wikilink_index(repo)
    targets: set[str] = set()

    def collect(chunk: str) -> str:
        for match in NAVIGATION_LINK_RE.finditer(chunk):
            resolved: str | None = None
            raw_target: str | None = None
            if match.group("inline") is not None:
                raw_target = match.group("inline_target")
                resolved = _resolve_link(source, raw_target)
            elif match.group("reference") is not None:
                identifier = match.group("reference_id") or match.group(
                    "reference_label"
                )

                raw_target = references.get(" ".join(identifier.split()).casefold())
                if raw_target:
                    resolved = _resolve_link(source, raw_target)
            else:
                raw_target = match.group("wikilink_target")
                resolved = _resolve_navigation_wikilink(
                    repo,
                    source,
                    raw_target,
                    index=wikilinks,
                )

            if resolved and raw_target:
                targets.add(_navigation_target_key(resolved, raw_target))

        return chunk

    _transform_non_fenced(text, collect)
    return targets


def _navigation_fragment(raw_target: str) -> str:
    owner = raw_target.strip().split("|", 1)[0]
    _, suffix, _ = _split_target(owner)
    if not suffix.startswith("#"):
        return ""

    return unquote(suffix[1:].split("?", 1)[0]).strip().casefold()


def _navigation_target_key(resolved: str, raw_target: str) -> str:
    fragment = _navigation_fragment(raw_target)
    return f"{resolved.casefold()}#{fragment}" if fragment else resolved.casefold()


def _has_navigation_target(targets: set[str], resolved: str) -> bool:
    normalized = resolved.casefold()
    return normalized in targets or any(
        target.startswith(f"{normalized}#") for target in targets
    )


def _deduplicate_navigation_links(repo: Path, source: str, text: str) -> str:
    """Keep the first visible link to each local destination and preserve later prose."""

    references = _reference_definitions(text)
    wikilinks = _wikilink_index(repo)
    seen: set[str] = set()

    def deduplicate(chunk: str) -> str:
        output: list[str] = []
        cursor = 0
        for match in NAVIGATION_LINK_RE.finditer(chunk):
            resolved: str | None = None
            label: str
            if match.group("inline") is not None:
                raw_target = match.group("inline_target")
                resolved = _resolve_link(source, raw_target)
                label = match.group("inline_label")
            elif match.group("reference") is not None:
                label = match.group("reference_label")
                identifier = match.group("reference_id") or label
                raw_target = references.get(" ".join(identifier.split()).casefold())
                if raw_target:
                    resolved = _resolve_link(source, raw_target)
            else:
                raw = match.group("wikilink_target")
                raw_target = raw
                owner, separator, alias = raw.partition("|")
                label = (
                    alias if separator else PurePosixPath(owner.split("#", 1)[0]).stem
                )

                resolved = _resolve_navigation_wikilink(
                    repo,
                    source,
                    raw,
                    index=wikilinks,
                )

            if resolved is None:
                continue

            key = _navigation_target_key(resolved, raw_target)
            if key not in seen:
                seen.add(key)
                continue

            start, end = match.span()
            line_start = chunk.rfind("\n", 0, start) + 1
            line_break = chunk.find("\n", end)
            line_content_end = len(chunk) if line_break == -1 else line_break
            line_end = len(chunk) if line_break == -1 else line_break + 1
            prefix = chunk[line_start:start]
            suffix = chunk[end:line_content_end]
            if re.fullmatch(r"\s{0,3}[-*+]\s+", prefix) and not suffix.strip():
                output.append(chunk[cursor:line_start])
                cursor = line_end
                continue

            output.append(chunk[cursor:start])
            output.append(label)
            cursor = end

        output.append(chunk[cursor:])
        return "".join(output)

    return _transform_non_fenced(text, deduplicate)


def _rewrite_opaque_durable_labels(repo: Path, source: str, text: str) -> str:
    titles: dict[str, str] = {}
    for record in _tracked_durable_records(repo):
        relative = _relative(repo, record)
        title = _extract_title(_read_text(record)[0], record.stem)
        titles[relative.casefold()] = title

    references = _reference_definitions(text)
    wikilinks = _wikilink_index(repo)

    def replace(match: re.Match[str]) -> str:
        raw_target: str | None = None
        if match.group("inline") is not None:
            label = match.group("inline_label")
            raw_target = match.group("inline_target")
            resolved = _resolve_link(source, raw_target)
        elif match.group("reference") is not None:
            label = match.group("reference_label")
            identifier = match.group("reference_id") or label
            raw_target = references.get(" ".join(identifier.split()).casefold())
            resolved = _resolve_link(source, raw_target) if raw_target else None
        else:
            raw = match.group("wikilink_target")
            owner, separator, alias = raw.partition("|")
            label = alias if separator else PurePosixPath(owner.split("#", 1)[0]).stem
            raw_target = raw
            resolved = _resolve_navigation_wikilink(
                repo,
                source,
                raw,
                index=wikilinks,
            )

        if resolved is None:
            return match.group(0)

        title = titles.get(resolved.casefold())
        if title is None:
            return match.group(0)

        normalized_label = " ".join(label.split()).replace("\\", "/")
        resolved_path = PurePosixPath(resolved)
        path_labels = {
            resolved,
            f"./{resolved}",
            resolved_path.name,
            resolved_path.stem,
        }

        if not OPAQUE_DURABLE_LABEL_RE.fullmatch(
            normalized_label
        ) and normalized_label.casefold() not in {
            candidate.casefold() for candidate in path_labels
        }:
            return match.group(0)

        if match.group("inline") is not None:
            return f"[{title}]({raw_target})"

        if match.group("reference") is not None:
            identifier = match.group("reference_id")
            rendered_identifier = identifier if identifier else label
            return f"[{title}][{rendered_identifier}]"

        owner, _, _ = match.group("wikilink_target").partition("|")
        return f"[[{owner}|{title}]]"

    def rewrite(chunk: str) -> str:
        return NAVIGATION_LINK_RE.sub(replace, chunk)

    return _transform_non_fenced(text, rewrite)


def _nearest_index(document: str, indexes: set[str]) -> str:
    parent = PurePosixPath(document).parent
    while parent.parts and parent != PurePosixPath("."):
        candidate = (parent / "README.md").as_posix()
        if candidate in indexes:
            return candidate

        parent = parent.parent

    return "docs/README.md"


def _build_index_entries(repo: Path) -> dict[str, list[tuple[str, str]]]:
    docs = repo / "docs"
    indexes = {
        _relative(repo, path)
        for path in _iter_markdown_files(docs)
        if path.name.casefold() == "readme.md"
    }

    indexes.add("docs/README.md")
    entries: dict[str, list[tuple[str, str]]] = {index: [] for index in indexes}
    for path in _iter_markdown_files(docs):
        relative = _relative(repo, path)
        if relative == "docs/README.md" or _is_support_path(relative):
            continue

        if path.name.casefold() == "readme.md":
            parent_index = _nearest_index(
                (PurePosixPath(relative).parent / "_child_.md").as_posix(),
                indexes - {relative},
            )

            if parent_index == relative:
                parent_index = "docs/README.md"

            title = _extract_title(_read_text(path)[0], path.parent.name)
            entries.setdefault(parent_index, []).append((relative, title))
            continue

        owner = _nearest_index(relative, indexes)
        title = _extract_title(_read_text(path)[0], path.stem)
        entries.setdefault(owner, []).append((relative, title))

    for path in _iter_structured_documents(docs):
        relative = _relative(repo, path)
        owner = _nearest_index(relative, indexes)
        entries.setdefault(owner, []).append(
            (relative, _structured_document_title(path))
        )

    for index in entries:
        entries[index] = sorted(set(entries[index]), key=lambda item: item[0])

    return entries


def _apply_moves(repo: Path, moves: Sequence[Move]) -> dict[str, str]:
    mapping: dict[str, str] = {}
    file_moves = [move for move in moves if move.kind != "asset-directory"]
    directory_moves = [move for move in moves if move.kind == "asset-directory"]
    for move in file_moves:
        source = repo / Path(move.source)
        actual = _actual_relative_path(repo, move.source)
        if actual:
            source = repo / Path(actual)

        target = repo / Path(move.target)
        if not source.exists():
            raise RepairError(f"Repair source no longer exists: {move.source}")

        if target.exists() and source.resolve() != target.resolve():
            raise RepairError(f"Repair target already exists: {move.target}")

        _case_only_move(source, target)
        mapping[move.source] = move.target

    canonical_release_notes = repo / Path(CANONICAL_RELEASE_NOTES_DIR.as_posix())
    legacy_release_notes = repo / Path(LEGACY_RELEASE_NOTES_DIR.as_posix())
    for release_notes_root in (canonical_release_notes, legacy_release_notes):
        if not release_notes_root.is_dir():
            continue

        nested_directories = sorted(
            (path for path in release_notes_root.rglob("*") if path.is_dir()),
            key=lambda path: len(path.parts),
            reverse=True,
        )

        for directory in nested_directories:
            if not any(directory.iterdir()):
                directory.rmdir()

    if legacy_release_notes.is_dir() and not any(legacy_release_notes.iterdir()):
        legacy_release_notes.rmdir()

    for move in directory_moves:
        source = repo / Path(move.source)
        target = repo / Path(move.target)
        if not source.exists():
            raise RepairError(f"Asset source no longer exists: {move.source}")

        if target.exists():
            raise RepairError(f"Asset target already exists: {move.target}")

        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.move(str(source), str(target))
        mapping[move.source] = move.target
        for child in target.rglob("*"):
            if child.is_file():
                suffix = child.relative_to(target).as_posix()
                mapping[f"{move.source}/{suffix}"] = f"{move.target}/{suffix}"

    return mapping


def _ensure_docs_index(repo: Path, protected: set[str]) -> list[str]:
    docs = repo / "docs"
    if not docs.exists():
        return []

    changed: list[str] = []
    root_index = docs / "README.md"
    if not root_index.exists():
        if _path_is_protected("docs/README.md", protected):
            raise RepairError(
                "Index creation would touch protected path: docs/README.md"
            )

        _write_text(
            root_index,
            '---\ntitle: "Índice da documentação"\ndoc_role: docs-index\n---\n\n'
            "# Documentação\n",
            "\n",
        )

        changed.append("docs/README.md")

    entries = _build_index_entries(repo)
    for index_relative, index_entries in sorted(entries.items()):
        index_path = repo / Path(index_relative)
        if not index_path.exists():
            continue

        text, newline = _read_text(index_path)
        title = _extract_title(text, index_path.parent.name or "Documentação")
        original = text
        text = _ensure_frontmatter(
            text, title=title, doc_role="docs-index", newline=newline
        )

        text = _remove_legacy_navigation_markers(text, newline)
        text = _remove_heading_section(text, "Conteúdo")
        existing_targets = _visible_navigation_targets(repo, index_relative, text)
        missing_entries = [
            f"- [{label}]({_relative_link(index_relative, target)})"
            for target, label in index_entries
            if not _has_navigation_target(existing_targets, target)
        ]

        text = _append_heading_section(
            text,
            title="Conteúdo",
            entries=missing_entries,
            newline=newline,
        )

        text = _deduplicate_navigation_links(repo, index_relative, text)
        if text != original:
            if _path_is_protected(index_relative, protected):
                raise RepairError(
                    f"Index repair would touch protected path: {index_relative}"
                )

            _write_text(index_path, text, newline)
            changed.append(index_relative)

    return changed


def _ensure_asset_owner_links(repo: Path, protected: set[str]) -> list[str]:
    docs = repo / "docs"
    if not docs.exists():
        return []

    pairs: list[tuple[Path, Path]] = []
    central = docs / "documentation-assets"
    if central.is_dir():
        for directory in sorted(path for path in central.iterdir() if path.is_dir()):
            pairs.append((docs / f"{directory.name}.md", directory))

    for directory in sorted(
        path
        for path in docs.rglob("*.assets")
        if path.is_dir() and central not in path.parents
    ):
        pairs.append(
            (
                directory.with_name(directory.name.removesuffix(".assets") + ".md"),
                directory,
            )
        )

    changed: list[str] = []
    for owner, asset_directory in pairs:
        if not owner.is_file():
            continue

        asset_files = sorted(
            path for path in asset_directory.rglob("*") if path.is_file()
        )

        if not asset_files:
            continue

        owner_relative = _relative(repo, owner)
        text, newline = _read_text(owner)
        links = [
            f"- [{asset.name}]({_relative_link(owner_relative, _relative(repo, asset))})"
            for asset in asset_files
        ]

        body = newline.join(["## Assets", "", *links])
        updated = _replace_managed_section(
            text,
            begin=ASSETS_MARKER_BEGIN,
            end=ASSETS_MARKER_END,
            body=body,
            newline=newline,
        )

        if updated == text:
            continue

        if _path_is_protected(owner_relative, protected):
            raise RepairError(
                f"Asset-link repair would touch protected path: {owner_relative}"
            )

        _write_text(owner, updated, newline)
        changed.append(owner_relative)

    return changed


def _ensure_obsidian_navigation(repo: Path, protected: set[str]) -> list[str]:
    """Recompose managed OBSIDIAN navigation without cumulative append sections."""

    has_docs = (repo / "docs").is_dir()
    obsidian = repo / "OBSIDIAN.md"
    if not has_docs and not obsidian.exists():
        return []

    if obsidian.exists():
        text, newline = _read_text(obsidian)
    else:
        text, newline = "# OBSIDIAN.md\n", "\n"

    original = text
    text = _remove_legacy_navigation_markers(text, newline)
    text = _rewrite_opaque_durable_labels(repo, "OBSIDIAN.md", text)

    managed_targets: set[str] = set()
    if has_docs:
        managed_targets.add("docs/README.md")

    if (repo / "REPOSITORY-OVERVIEW.md").is_file():
        managed_targets.add("REPOSITORY-OVERVIEW.md")

    text = _remove_navigation_targets(
        repo,
        "OBSIDIAN.md",
        text,
        managed_targets,
    )

    preamble, sections = _h2_sections(text)
    role_titles = {
        "usage": {"como usar", "how to use"},
        "base": {
            "base canônica",
            "base de conhecimento canônica",
            "canonical knowledge base",
        },
        "navigation": {
            "navegação inicial",
            "navegação inicial recomendada",
            "initial navigation",
            "recommended initial navigation",
        },
        "overview": {"visão funcional", "functional overview"},
        "records": {
            "índice documental completo",
            "registros documentais duráveis",
            "durable documentation records",
        },
        "rules": {"regras de curadoria", "curation rules"},
    }

    title_roles = {
        title: role for role, titles in role_titles.items() for title in titles
    }

    english_titles = {
        "how to use",
        "canonical knowledge base",
        "initial navigation",
        "recommended initial navigation",
        "functional overview",
        "durable documentation records",
        "curation rules",
    }

    portuguese_titles = set(title_roles) - english_titles
    visible_titles = [title.casefold() for title, _ in sections]
    english = sum(title in english_titles for title in visible_titles) > sum(
        title in portuguese_titles for title in visible_titles
    )

    labels = (
        {
            "usage": "How to use",
            "base": "Canonical knowledge base",
            "navigation": "Initial navigation",
            "overview": "Functional overview",
            "records": "Durable documentation records",
            "rules": "Curation rules",
            "base_link": "Documentation index",
            "overview_link": "Repository overview",
        }
        if english
        else {
            "usage": "Como usar",
            "base": "Base de conhecimento canônica",
            "navigation": "Navegação inicial",
            "overview": "Visão funcional",
            "records": "Registros documentais duráveis",
            "rules": "Regras de curadoria",
            "base_link": "Índice da documentação",
            "overview_link": "Visão funcional do repositório",
        }
    )

    preserved: dict[str, str] = {}
    custom_sections: list[str] = []
    for title, section in sections:
        role = title_roles.get(title.casefold())
        if role in {"base", "overview", "records"}:
            continue

        if role in {"usage", "navigation", "rules"}:
            if role not in preserved:
                normalized_section = _retitle_h2_section(
                    section,
                    labels[role],
                    newline,
                )

                if role == "navigation":
                    normalized_section = _remove_orphaned_indented_list_items(
                        normalized_section
                    )

                preserved[role] = normalized_section

            continue

        custom_sections.append(section)

    pieces: list[str] = [preamble]
    if "usage" in preserved:
        pieces.append(preserved["usage"])

    if has_docs:
        pieces.append(
            newline.join(
                (
                    f"## {labels['base']}",
                    "",
                    f"- [{labels['base_link']}](./docs/README.md)",
                )
            )
        )

    if "navigation" in preserved:
        pieces.append(preserved["navigation"])

    if (repo / "REPOSITORY-OVERVIEW.md").is_file():
        pieces.append(
            newline.join(
                (
                    f"## {labels['overview']}",
                    "",
                    f"- [{labels['overview_link']}](./REPOSITORY-OVERVIEW.md)",
                )
            )
        )

    pieces.extend(custom_sections)
    if "rules" in preserved:
        pieces.append(preserved["rules"])

    text = (newline * 2).join(
        piece.strip("\r\n") for piece in pieces if piece.strip("\r\n")
    ) + newline

    text = _deduplicate_navigation_links(repo, "OBSIDIAN.md", text)
    text = _transform_non_fenced(
        text,
        lambda chunk: re.sub(r"(?:\r?\n){3,}", newline * 2, chunk),
    )

    if text != original or not obsidian.exists():
        if _path_is_protected("OBSIDIAN.md", protected):
            raise RepairError(
                "Navigation repair would touch protected path: OBSIDIAN.md"
            )

        _write_text(obsidian, text, newline)
        return ["OBSIDIAN.md"]

    return []


def _deduplicate_root_navigation_surfaces(repo: Path, protected: set[str]) -> list[str]:
    changed: list[str] = []
    for relative in NAVIGATION_SURFACES:
        path = repo / Path(relative)
        if not path.is_file():
            continue

        text, newline = _read_text(path)
        updated = _remove_legacy_navigation_markers(text, newline)
        updated = _deduplicate_navigation_links(repo, relative, updated)
        if updated == text:
            continue

        if _path_is_protected(relative, protected):
            raise RepairError(
                f"Navigation deduplication would touch protected path: {relative}"
            )

        _write_text(path, updated, newline)
        changed.append(relative)

    return changed


def _run_gate(command: list[str], repo: Path, name: str) -> GateResult:
    completed = subprocess.run(
        command,
        cwd=repo,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        check=False,
    )

    return GateResult(
        gate=name,
        status="passou" if completed.returncode == 0 else "falhou",
        exit_code=completed.returncode,
        stdout=completed.stdout.strip(),
        stderr=completed.stderr.strip(),
    )


def _scripts_layout() -> tuple[Path, bool]:
    """Resolve the exact package layout without searching for alternate gates."""
    module = Path(__file__).resolve()
    canonical = module.parts[-4:] == (
        "scripts",
        "documentation",
        "repair_documentation_structure",
        "cli.py",
    )

    return module.parents[2 if canonical else 1], canonical


def _gate_script(scripts_dir: Path, legacy_name: str) -> Path:
    root, canonical = _scripts_layout()
    # Explicit external --scripts-dir keeps the established legacy gate contract.
    if canonical and scripts_dir.resolve() == root:
        names = {
            "format_markdown.py": "documentation_format_markdown.py",
            "ensure_sat_banner.py": "documentation_ensure_sat_banner.py",
            "validate_documentation_metadata.py": "documentation_validate_metadata.py",
            "validate_durable_links.py": "documentation_validate_durable_links.py",
            "validate_architecture_decisions.py": "documentation_validate_architecture_decisions.py",
        }

        return scripts_dir / names[legacy_name]

    return scripts_dir / legacy_name


def _run_gates(
    repo: Path,
    changed_paths: Sequence[str],
    scripts_dir: Path,
    protected: set[str],
) -> tuple[list[GateResult], bool, list[str]]:
    markdown = [
        str(repo / Path(path))
        for path in changed_paths
        if path.casefold().endswith(".md") and (repo / Path(path)).is_file()
    ]

    untracked = {
        item.decode("utf-8").replace("\\", "/")
        for item in bytes(
            _run_git(
                repo,
                "ls-files",
                "--others",
                "--exclude-standard",
                "-z",
                text=False,
            ).stdout
        ).split(b"\0")
        if item
    }

    pending_tracking = any(
        path.startswith("docs/")
        or path in {"README.md", "REPOSITORY-OVERVIEW.md", "OBSIDIAN.md"}
        for path in untracked
    )

    commands: list[tuple[str, list[str]]] = []
    standard_surfaces = [
        path
        for path in ("README.md", "REPOSITORY-OVERVIEW.md", "docs/README.md")
        if (repo / Path(path)).is_file()
    ]

    surface_hashes = {
        path: hashlib.sha256((repo / Path(path)).read_bytes()).hexdigest()
        for path in standard_surfaces
    }

    has_protected_standard_surface = any(
        _path_is_protected(path, protected) for path in standard_surfaces
    )

    if markdown:
        commands.append(
            (
                "formatacao_markdown_write",
                [
                    sys.executable,
                    str(_gate_script(scripts_dir, "format_markdown.py")),
                    "--write",
                    "--line-width",
                    "100",
                    *markdown,
                ],
            )
        )

    if not has_protected_standard_surface:
        commands.append(
            (
                "banner_sat_write",
                [
                    sys.executable,
                    str(_gate_script(scripts_dir, "ensure_sat_banner.py")),
                    "--repo-root",
                    str(repo),
                    "--write",
                ],
            )
        )

    commands.append(
        (
            "banner_sat_check",
            [
                sys.executable,
                str(_gate_script(scripts_dir, "ensure_sat_banner.py")),
                "--repo-root",
                str(repo),
                "--check",
            ],
        )
    )

    if markdown:
        commands.append(
            (
                "formatacao_markdown_check",
                [
                    sys.executable,
                    str(_gate_script(scripts_dir, "format_markdown.py")),
                    "--check",
                    "--line-width",
                    "100",
                    *markdown,
                ],
            )
        )

    metadata = [
        sys.executable,
        str(_gate_script(scripts_dir, "validate_documentation_metadata.py")),
        "--repo-root",
        str(repo),
        "--enforce-docs-governance",
    ]

    if pending_tracking:
        metadata.append("--skip-links")
    else:
        commands.append(
            (
                "links_duraveis",
                [
                    sys.executable,
                    str(_gate_script(scripts_dir, "validate_durable_links.py")),
                    "--repo-root",
                    str(repo),
                ],
            )
        )

    commands.append(("metadados_documentais", metadata))
    if any(path.startswith("docs/architecture-decisions/") for path in changed_paths):
        commands.append(
            (
                "adrs",
                [
                    sys.executable,
                    str(
                        _gate_script(scripts_dir, "validate_architecture_decisions.py")
                    ),
                    "--repo-root",
                    str(repo),
                ],
            )
        )

    results = [_run_gate(command, repo, name) for name, command in commands]
    failures = [result for result in results if result.exit_code != 0]
    if failures:
        details = "; ".join(
            f"{result.gate}: {result.stderr or result.stdout}" for result in failures
        )

        raise RepairError(f"Documentation gate failure: {details}")

    gate_changed_paths = [
        path
        for path, before in surface_hashes.items()
        if hashlib.sha256((repo / Path(path)).read_bytes()).hexdigest() != before
    ]

    return results, pending_tracking, gate_changed_paths


def apply_plan(
    plan: RepairPlan,
    *,
    scripts_dir: Path,
    run_gates: bool,
) -> dict[str, Any]:
    repo = Path(plan.repo_root)
    protected = set(plan.protected_paths)
    before_blocks: dict[str, list[str]] = {}
    for path in [repo / surface for surface in ROOT_SURFACES]:
        if path.is_file():
            before_blocks[_relative(repo, path)] = _fenced_blocks(_read_text(path)[0])

    if (repo / "docs").exists():
        for path in _iter_markdown_files(repo / "docs"):
            before_blocks[_relative(repo, path)] = _fenced_blocks(_read_text(path)[0])

    for path in _tracked_durable_records(repo):
        before_blocks[_relative(repo, path)] = _fenced_blocks(_read_text(path)[0])

    mapping = _apply_moves(repo, plan.moves)
    reverse_mapping = {target: source for source, target in mapping.items()}
    changed: set[str] = {
        item for move in plan.moves for item in (move.source, move.target)
    }

    markdown_paths = [
        path for surface in ROOT_SURFACES if (path := repo / surface).is_file()
    ]

    if (repo / "docs").exists():
        markdown_paths.extend(_iter_markdown_files(repo / "docs"))

    markdown_paths.extend(_tracked_durable_records(repo))
    for path in sorted(set(markdown_paths)):
        relative_after = _relative(repo, path)
        relative_before = reverse_mapping.get(relative_after, relative_after)
        had_bom = _has_utf8_bom(path)
        text, newline = _read_text(path)
        original = text
        text = _rewrite_links(
            text,
            source_before=relative_before,
            source_after=relative_after,
            mapping=mapping,
        )

        text = _normalize_portuguese_prose(text)
        if (
            relative_after.startswith("docs/") and not _is_support_path(relative_after)
        ) or any(
            relative_after.startswith(prefix + "/") for prefix in DURABLE_RECORD_ROLES
        ):
            title = _extract_title(text, path.stem)
            text = _ensure_frontmatter(
                text,
                title=title,
                doc_role=_doc_role(Path(relative_after), text),
                newline=newline,
            )

        if text != original or had_bom:
            if _path_is_protected(relative_after, protected):
                raise RepairError(
                    f"Content repair would touch protected path: {relative_after}"
                )

            _write_text(path, text, newline)
            changed.add(relative_after)

    if (repo / "docs").exists():
        for path in _iter_structured_documents(repo / "docs"):
            relative = _relative(repo, path)
            raw = path.read_bytes()
            payload = raw[3:] if raw.startswith(b"\xef\xbb\xbf") else raw
            try:
                text = payload.decode("utf-8")
            except UnicodeDecodeError as exc:
                raise RepairError(f"{path}: invalid UTF-8: {exc}") from exc

            normalized = unicodedata.normalize("NFC", text)
            if payload != raw or normalized != text:
                if _path_is_protected(relative, protected):
                    raise RepairError(
                        f"Structured-document repair would touch protected path: {relative}"
                    )

                _write_text(path, normalized, "\n")
                changed.add(relative)

    changed.update(_ensure_docs_index(repo, protected))
    changed.update(_ensure_asset_owner_links(repo, protected))
    changed.update(_ensure_obsidian_navigation(repo, protected))
    changed.update(_deduplicate_root_navigation_surfaces(repo, protected))

    after_mapping = {source: mapping.get(source, source) for source in before_blocks}
    for source, blocks in before_blocks.items():
        target = after_mapping[source]
        target_path = repo / Path(target)
        if (
            target_path.is_file()
            and _fenced_blocks(_read_text(target_path)[0]) != blocks
        ):
            raise RepairError(f"Unauthorized fenced-block drift in {target}")

    gates: list[GateResult] = []
    pending_tracking = False
    if run_gates:
        gates, pending_tracking, gate_changed_paths = _run_gates(
            repo,
            sorted(changed),
            scripts_dir.resolve(),
            protected,
        )

        changed.update(gate_changed_paths)
        for source, blocks in before_blocks.items():
            target = after_mapping[source]
            target_path = repo / Path(target)
            if (
                target_path.is_file()
                and _fenced_blocks(_read_text(target_path)[0]) != blocks
            ):
                raise RepairError(
                    f"Formatter changed an opaque fenced block in {target}"
                )

    return {
        "schema_version": SCHEMA_VERSION,
        "mode": "apply",
        "repo_root": str(repo),
        "status": "aplicado",
        "canonical_filename": CANONICAL_NAME,
        "moves": [asdict(move) for move in plan.moves],
        "content_targets": plan.content_targets,
        "assumptions": plan.assumptions,
        "warnings": plan.warnings,
        "changed_paths": sorted(changed),
        "pending_git_tracking": pending_tracking,
        "gates": [asdict(result) for result in gates],
        "staged": False,
        "committed": False,
        "pushed": False,
    }


def _render_plan(plan: RepairPlan) -> dict[str, Any]:
    return {
        "schema_version": SCHEMA_VERSION,
        "mode": "plan",
        "repo_root": plan.repo_root,
        "status": "planejado",
        "canonical_filename": CANONICAL_NAME,
        "moves": [asdict(move) for move in plan.moves],
        "content_targets": plan.content_targets,
        "assumptions": plan.assumptions,
        "warnings": plan.warnings,
        "protected_paths": plan.protected_paths,
        "staged": False,
        "committed": False,
        "pushed": False,
    }


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo-root", type=Path, required=True)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--plan", action="store_true")
    mode.add_argument("--apply", action="store_true")
    parser.add_argument(
        "--protected-path",
        action="append",
        default=[],
        help="Repository-relative path that the repairer must not touch. Repeat as needed.",
    )

    parser.add_argument(
        "--scripts-dir",
        type=Path,
        default=_scripts_layout()[0],
        help="Directory containing the documentation formatter and validators.",
    )

    parser.add_argument(
        "--skip-gates",
        action="store_true",
        help="Skip formatter and validators. Intended only for isolated tests.",
    )

    return parser


def main(argv: Sequence[str] | None = None) -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="strict")

    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8", errors="strict")

    args = build_parser().parse_args(argv)
    try:
        plan = build_plan(args.repo_root, args.protected_path)
        payload = (
            apply_plan(
                plan,
                scripts_dir=args.scripts_dir,
                run_gates=not args.skip_gates,
            )
            if args.apply
            else _render_plan(plan)
        )
    except (OSError, RepairError) as exc:
        print(
            json.dumps(
                {
                    "schema_version": SCHEMA_VERSION,
                    "status": "erro",
                    "error": str(exc),
                },
                ensure_ascii=False,
                sort_keys=True,
            ),
            file=sys.stderr,
        )

        return 2

    print(json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
