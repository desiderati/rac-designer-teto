#!/usr/bin/env python3
"""Validate production change audit records without printing sensitive values."""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class Rule:
    name: str
    pattern: re.Pattern[str]


RULES = (
    Rule(
        "private-key-block",
        re.compile(r"-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----", re.IGNORECASE),
    ),
    Rule(
        "jwt-token",
        re.compile(r"\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b"),
    ),
    Rule(
        "bearer-token",
        re.compile(r"\bBearer\s+[A-Za-z0-9._~+/=-]{16,}", re.IGNORECASE),
    ),
    Rule(
        "basic-auth-header",
        re.compile(r"\bBasic\s+[A-Za-z0-9+/=]{16,}", re.IGNORECASE),
    ),
    Rule(
        "google-api-key",
        re.compile(r"\bAIza[0-9A-Za-z_-]{20,}\b"),
    ),
    Rule(
        "aws-access-key",
        re.compile(r"\b(?:AKIA|ASIA)[0-9A-Z]{16}\b"),
    ),
    Rule(
        "stripe-secret-key",
        re.compile(r"\bsk_(?:live|test)_[0-9A-Za-z]{16,}\b"),
    ),
    Rule(
        "github-token",
        re.compile(r"\b(?:ghp|gho|ghu|ghs|ghr)_[0-9A-Za-z]{20,}\b"),
    ),
    Rule(
        "slack-token",
        re.compile(r"\bxox[baprs]-[0-9A-Za-z-]{20,}\b"),
    ),
    Rule(
        "cookie-header",
        re.compile(
            r"\bCookie\s*:\s*[^<\n]*(?:session|token|auth|jwt|sid)[^<\n=]*=[^;\s]{8,}",
            re.IGNORECASE,
        ),
    ),
    Rule(
        "possible-secret-assignment",
        re.compile(
            r"""
            \b
            (?:password|passwd|pwd|secret|token|api[_-]?key|access[_-]?token|
               refresh[_-]?token|client[_-]?secret|authorization|cookie)
            \b
            \s*[:=]\s*
            (?!
                <[^>\n]{0,40}>
                |masked\b
                |redacted\b
                |\*{3,}
            )
            ['"]?
            [^\s'"`<>]{8,}
            """,
            re.IGNORECASE | re.VERBOSE,
        ),
    ),
)


@dataclass(frozen=True)
class Finding:
    path: Path
    line_number: int
    rule: str


def iter_record_paths(paths: list[Path]) -> list[Path]:
    records: list[Path] = []
    for path in paths:
        if path.is_dir():
            records.extend(sorted(path.rglob("*.production-change.md")))
        elif path.is_file():
            records.append(path)
    return sorted(dict.fromkeys(records))


def scan_record(path: Path) -> list[Finding]:
    findings: list[Finding] = []
    try:
        lines = path.read_text(encoding="utf-8").splitlines()
    except UnicodeDecodeError:
        findings.append(Finding(path=path, line_number=0, rule="non-utf8-file"))
        return findings
    except OSError:
        findings.append(Finding(path=path, line_number=0, rule="unreadable-file"))
        return findings

    for line_number, line in enumerate(lines, start=1):
        for rule in RULES:
            if rule.pattern.search(line):
                findings.append(Finding(path=path, line_number=line_number, rule=rule.name))
                break
    return findings


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Validate .agents/production-changes records for obvious unmasked "
            "sensitive values. Findings do not print the matched content."
        )
    )
    parser.add_argument(
        "paths",
        nargs="*",
        type=Path,
        default=[Path(".agents/production-changes")],
        help="Production change files or directories to scan.",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(sys.argv[1:] if argv is None else argv)
    records = iter_record_paths(args.paths)
    if not records:
        print("No production change records found.")
        return 0

    findings = [finding for record in records for finding in scan_record(record)]
    if findings:
        print("Production change record sanitization failed:")
        for finding in findings:
            line = "file" if finding.line_number == 0 else f"line {finding.line_number}"
            print(f"- {finding.path.as_posix()}:{line}: {finding.rule}")
        return 1

    print(f"Production change records validated: {len(records)} file(s).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
