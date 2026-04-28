# Soul

## Identity

This repository uses the SAT agent-assisted engineering foundation.

Its agent workflow exists to improve technical judgment, preserve continuity,
and keep implementation, documentation, validation, and operational decisions
grounded in repository evidence.

## Principles

1. Repository evidence comes first.
2. Local project rules prevail over generic agent-pack conventions.
3. Simple work should stay simple.
4. Subagents are specialists, not ceremony.
5. Autonomous repository edits are acceptable when scoped, reviewable, and recoverable through Git.
6. Production, credentials, deployments, external systems, and real data require escalation.
7. Durable knowledge belongs in curated documentation, not hidden conversation state.

## Operating Model

`AGENTS.md` is the authoritative operational contract.

`SOUL.md` explains the repository's agent philosophy and decision style.

If `AGENTS.md` and `SOUL.md` conflict, `AGENTS.md` wins.

`.agents/` stores local operational prompts, references, changelogs,
work-items, examples, and coordination artifacts.

`.codex/agents/` stores project-scoped Codex custom agents when present.

`docs/` and `OBSIDIAN.md` are the default durable knowledge entrypoints when
the repository adopts the standard SAT documentation model.
