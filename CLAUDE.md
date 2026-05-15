# CLAUDE.md

Installed from `agents-bootstrap` skill version `0.31.1-beta`.

This file exists only for compatibility with tools that look for `CLAUDE.md` at the repository root.

## Recommended reading order

1. `AGENTS.md`
2. `README.md`
3. `CONTRIBUTING.md` if present
4. `OBSIDIAN.md` if present

## Precedence rule

- `AGENTS.md` defines the operating rules for AI agents.
- Production guardrails and confirmation requirements for mutable infrastructure actions live in `AGENTS.md`.
- `README.md` is the canonical reference for repository description.
- `CONTRIBUTING.md`, when present, defines contribution rules and commit message conventions for the repository.
- `OBSIDIAN.md`, when present, organizes the navigable documentation base and usually points to the versioned knowledge
  base, by default under `docs/`.

In case of conflict, `AGENTS.md` takes precedence.

When a single `work-item.assets/` contains more than one plan or design for the same front, keep provenance explicit
with phase-qualified filenames and metadata for `fase`, `status`, and substitution relation.
