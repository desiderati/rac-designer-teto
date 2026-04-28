# AGENTS.md

Installed from `agents-bootstrap` skill version `0.25.0-beta`.

## Context

This repository uses a structured agent workflow to improve technical quality,
reduce trial-and-error behavior, preserve continuity across sessions, and keep
documentation aligned with the real system state.

The `.agents/` directory is the repository-local operational workspace. It
contains prompts, templates, examples, references, changelogs, work-items, and
optional local diagnostic records.

The `.codex/agents/` directory contains project-scoped Codex custom agents when
the bootstrap installs the standard role pack.

This file is the kernel and router. Detailed workflow rules live under
`.agents/references/` after bootstrap.

## Mandatory Initial Reading

Before non-trivial analysis, implementation, documentation updates, or
knowledge consolidation:

1. Read `README.md` if it exists.
2. Read `CONTRIBUTING.md` if it exists.
3. Read `OBSIDIAN.md` if it exists.
4. Read relevant docs referenced from `OBSIDIAN.md`.
5. Read relevant `.agents/references/*.md` for the workflow branch in use.
6. Read relevant recent changelogs, work-items, incident records, bug analyses,
   code reviews, or refactoring records when they affect continuity.

Do not operate in a documentation vacuum.

## Core Operating Principles

- Do not work in blind trial-and-error mode.
- Do not jump directly to code for non-trivial tasks.
- Separate facts, hypotheses, evidence, assumptions, and pending questions.
- Prioritize root cause analysis over symptom treatment.
- Preserve continuity between sessions.
- Keep changelogs factual and useful.
- Keep durable documentation curated, not noisy.
- Load worked examples only when they add value.
- Use subagents only when there is a clear gain.

## Language and Delivery

- Respond in Portuguese in this repository context, unless explicitly asked
  otherwise.
- Keep documentation in Portuguese when the document belongs to the project
  context, unless a specific file or prompt requires another language.
- Use proper accents in Portuguese text.
- Do not invent facts, commands, paths, behaviors, or decisions that are not
  grounded in repository evidence.

## Production Guardrails

- Treat any GCP resource carrying the tag `Prod` as production-critical.
- No state-changing action may be executed against a `Prod`-tagged resource
  without explicit user confirmation in the current session.
- Until explicit confirmation is granted, restrict work to read-only
  inspection, diagnosis, planning, and documentation.
- When there is uncertainty about whether a target is production-critical, stop
  and request confirmation instead of assuming the change is safe.
- In SAT repositories that interact with the shared production stack,
  `sat-eam-prd-shared-01` in project `sat-eam-prd` must be treated with this
  production rule.

## Workflow Router

Use these references as the authoritative detailed contracts:

- `.agents/references/agents-workflow.md`
  - prompt map, typical sequences, and workflow visual.
- `.agents/references/prompt-routing.md`
  - prompt fitness, ambiguity rules, phrase routing, and chaining rules.
- `.agents/references/local-continuity.md`
  - `.agents/` structure, work-items, skips, deviations, and changelog rules.
- `.agents/references/documentation-governance.md`
  - Graphify guidance, README impact, knowledge consolidation, and repository
    overview rules.
- `.agents/references/collaboration-and-automation.md`
  - automation, large-work collaboration, workflow improvement signaling, and
    final quality bar.
- `.agents/references/agents-roles.md`
  - installed custom agent roles, prompt and skill mappings, and write
    boundaries.
- `.agents/references/agents-usage.md`
  - team-mode triggers, when to use agents, when not to use them, and help
    routing for examples.

## Prompt Entrypoints

- Use `.agents/prompts/bug-analysis.prompt.md` for bugs, regressions, incidents,
  and root-cause analysis.
- Use `.agents/prompts/solution-design.prompt.md` when multiple technical
  approaches have meaningful trade-offs.
- Use `.agents/prompts/architecture-decision.prompt.md` for proposed or
  accepted ADRs under `docs/architecture-decisions/`.
- Use `.agents/prompts/implementation-planning.prompt.md` for non-trivial
  implementation plans.
- Use `.agents/prompts/league-of-agents.prompt.md` when the user explicitly
  enables team mode or automatic agent orchestration for the current task.
- Use `.agents/prompts/test-driven.prompt.md` when behavior should be specified
  before implementation.
- Use `.agents/prompts/subagent-execution.prompt.md` only when parallel
  decomposition has clear value.
- Use `.agents/prompts/verification.prompt.md` after non-trivial
  implementation when drift is plausible.
- Use `.agents/prompts/changelog.prompt.md` to register material technical work.
- Use `.agents/prompts/readme.prompt.md`,
  `.agents/prompts/knowledge-base.prompt.md`, and
  `.agents/prompts/repository-overview.prompt.md` for documentation work.

## Custom Agent Roles

When `.codex/agents/*.toml` exists, use `.agents/references/agents-roles.md`
before delegating work to role-specific subagents.

Installed custom agents are not automatic triggers. Use them only when
subagent decomposition has clear value and the parent agent can consolidate the
results.

Treat these user phrases as explicit authorization to evaluate custom-agent
delegation for the current task:

- `league of agents`
- `liga dos agentes`
- `modo equipe`
- `modo subagentes`
- `executar com agentes`
- `usar orquestracao`
- `orquestracao automatica de agentes`
- `trabalhe com os agentes adequados`
- `@League of Agents`

When one of those phrases appears, read
`.agents/prompts/league-of-agents.prompt.md`,
`.agents/references/agents-usage.md`, and
`.agents/references/agents-roles.md`, then decide whether to delegate.

When the user says `Agents Usage` or invokes `@Agents Usage`, do not spawn
subagents. Read `.agents/references/agents-usage.md` and explain how agent
orchestration works in this repository.

When the user says `Agents Examples`, `Agents Example`, invokes
`@Agents Examples`, or invokes `@Agents Example`, do not spawn subagents. Read
`.agents/references/agents-examples.md` and return concise examples for each
installed custom agent.

## Local Continuity Rules

Use `.agents/work-items/` selectively, but create or resume a work-item before
the first remote mutation or when losing the sequence of discoveries, decisions,
validations, and pending items would materially harm continuity.

A daily changelog entry is mandatory in the same session when material
technical work, operational diagnosis, remote mutation, deployment,
documentation promotion, or evidence-backed technical decision happened.

Never use `git status` as evidence that the day's changelog exists or was
updated. Verify local continuity artifacts directly in the filesystem.

## Knowledge Graph Interoperability

When a repository uses Graphify:

- If `graphify-out/GRAPH_REPORT.md` exists, read it before broad architecture
  or context searches across raw files.
- Treat Graphify outputs as a derived structural index for navigation and
  retrieval, not as the canonical source of truth.
- If Graphify output conflicts with source code, versioned docs, or explicit
  technical decisions, prefer those primary sources.

## Final Quality Bar

Before final delivery, confirm that the result is grounded in repository
evidence, preserves existing local contracts, includes appropriate validation,
and records operational continuity when the workflow requires it.

---

## Knowledge graph interoperability

When a repository uses Graphify:

- If `graphify-out/GRAPH_REPORT.md` exists, read it before broad architecture or context searches across raw files.
- Treat Graphify outputs as a derived structural index for navigation and retrieval, not as the canonical source of
  truth.
- If Graphify output conflicts with source code, versioned docs, or explicit technical decisions, prefer those primary
  sources.
