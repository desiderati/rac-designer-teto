# AGENTS.md

Installed from `agents-bootstrap` skill version `0.59.1-beta`.

## Context

This repository uses a structured agent workflow to improve technical quality, reduce
trial-and-error behavior, preserve continuity across sessions, and keep documentation aligned with
the real system state.

The `.agents/` directory is the repository-local operational workspace. It contains prompts,
templates, examples, references, changelogs, work-items, and optional local diagnostic records.

The `.codex/agents/` directory contains project-scoped Codex custom agents when the bootstrap
installs the standard role pack.

This file is the kernel and router. Detailed workflow rules live under `.agents/references/` after
bootstrap.

## Mandatory Initial Reading

Before non-trivial analysis, implementation, documentation updates, or knowledge consolidation:

1. Read `README.md` if it exists.

2. Read `SOUL.md` if it exists when interpreting repository agent philosophy, decision style,
   orchestration norms, or communication posture. `AGENTS.md` remains the authoritative operational
   contract.

3. Read `CONTRIBUTING.md` if it exists.

4. Read `OBSIDIAN.md` if it exists.

5. Read relevant docs referenced from `OBSIDIAN.md`.

6. Read `.agents/errors.md` if it exists; do not create it as a routine startup artifact.

7. Read relevant `.agents/references/*.md` for the workflow branch in use.

8. Read relevant recent changelogs, work-items, incident records, bug analyses, code reviews, or
   refactoring records when they affect continuity.

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

## Memory Usage

Saved memories must be treated as contextual clues, not as current facts.

Before acting on any operational memory, Codex must revalidate the information against the
appropriate source of truth: local files, repository state, local configuration, runtime state,
external services, or current documentation.

Stable user preferences may be applied directly. Operational states, versions, canonical paths, next
IDs, deployments, permissions, environment status, and time-dependent decisions must always be
revalidated before guiding execution or presenting conclusions.

## Execution Discipline

- Before non-trivial implementation, make the objective, assumptions, and success evidence explicit
  enough that the work can be checked.

- Do not choose silently between plausible interpretations when the ambiguity affects scope,
  behavior, risk, data, or production safety.

- Prefer the smallest cohesive change that satisfies the current objective and preserves the local
  code contract.

- Do not introduce duplication, fragile shortcuts, or inconsistent local patterns merely to keep the
  diff small.

- Refactor within the implementation when it is necessary to keep the change coherent, avoid newly
  introduced duplication, or preserve the touched code's contract.

- Split refactoring into a separate cycle when it broadens scope, touches unrelated behavior,
  requires its own baseline or regression evidence, or would make review harder.

- Do not close non-trivial work until the result has been checked against the stated objective and
  the planned validation evidence.

## Interaction and Safety Guardrails

- If any fact, statistic, date, path, command, API, or technical behavior is uncertain, say so
  before relying on it. Do not invent facts, statistics, dates, commands, paths, behaviors, or
  decisions.

- Match explanation depth to the user's context: do not over-explain what is already clear, and do
  not omit context needed for a safe decision.

- Before substantially rewriting, removing, restructuring, or changing the tone of user-authored
  content, describe the exact intended change and why, then wait for explicit confirmation.

- Do not send, post, publish, share, email, invite, schedule, deploy, migrate, or execute
  irreversible or external state-changing actions unless the user explicitly confirms that exact
  action in the current message.

- Deployments, pushes to environments, migrations, schema changes, external mutations, and commands
  with irreversible side effects always require explicit in-session confirmation. User-requested
  read-only inspection may proceed unless it touches sensitive data or an unrequested external
  surface.

- For architecture decisions, complex debugging, non-trivial features, or other long-term technical
  choices, work through the problem before implementation: identify uncertainty, compare trade-offs,
  and make the recommendation explicit.

- Before starting large or high-impact work, show 2-3 viable approaches and wait for the user to
  choose unless an approved plan already selects the approach.

## Chat Control Shortcuts

The user may use compact `!` shortcuts to steer the current conversation. Treat them as explicit
intent signals, not as permission to bypass repository, production, external-mutation, or
irreversible-action guardrails.

- `!next-steps`: list the next steps, risks, and smallest useful action.

- `!status`: summarize current state, progress, blockers, and pending items.

- `!usage`: use `$codex-usage` when available to report the current conversation/session weight,
  including tokens, models, and estimated cost. Prefer a visible session ID from hook context, then
  local `session_index.jsonl` and JSONL `payload.id` evidence, before falling back to
  `lastActivity`, file dates, or most-recent-session assumptions. If the current session cannot be
  identified from local logs, say so and ask for a session identifier or use the most recent session
  only when that assumption is explicit.

- `!hooks`: inspect and summarize hooks configured for the current project and hooks visibly active
  in this session. Distinguish configured hooks from observed session signals; do not mutate hook
  configuration.

- `!summary`: summarize what has been said since the start of the session using the available
  transcript and any explicit compaction summary. If earlier content is unavailable, state that
  limit instead of inventing details.

- `!time`: report elapsed session time using `codex-resolution-time` when available. Do not claim
  the final current-turn duration before the `Stop` hook runs; if no timer signal is available, say
  so. If the hook exposes sanitized session correlation metadata, it may be reused to identify the
  current chat for `!usage`.

- `!explain`: briefly state whether you understood the user's last instruction and how you would
  proceed to solve it. This is not a plan and does not authorize execution.

- `!continue`: accept the proposed approach and continue within the stated local scope.

- `!confirm`: authorize the exact action most recently proposed by Codex in the current
  conversation.

- `!authorized`: same meaning as `!confirm`; use this alias only for the exact action most recently
  proposed by Codex in the current conversation.

- `!bootstrap-check`: run a dry-run of the default `agents-bootstrap` bundle in the current
  repository with `--with-rtk`, `--with-resolution-time`, `--with-self-improvement`, and
  `--with-graphify`; do not include `--with-graphify-hooks` or `--force`.

- `!bootstrap`: run the same default `agents-bootstrap` bundle in the current repository without
  `--dry-run`, preserving existing files by default. Do not add `--force`, do not add
  `--with-graphify-hooks`, and ask for clarification when the target is outside the current
  repository or otherwise ambiguous. Because this includes `--with-rtk`, it may verify or install
  the RTK binary and initialize global Codex configuration under `~/.codex/`.

- `!verify`: run or describe the relevant verification before closing the task. Use
  `.agents/prompts/verification.prompt.md` when available and the verification is non-trivial or
  drift is plausible.

- `!test`: run the appropriate local tests or checks for the current scope. Use
  `.agents/prompts/test-driven.prompt.md` only when the user wants test scenarios, behavior, or
  strategy specified before implementation.

- `!review`: review the current state in code-review posture. Use the local code-review workflow or
  `code-reviewer` custom agent when available and coordination adds value.

- `!changelog`: record the material work in the operational changelog. Use
  `.agents/prompts/changelog.prompt.md` when available.

- `!suggest`: suggest one grounded improvement, next action, or workflow refinement for the current
  context. Do not implement it unless the user explicitly agrees.

- `!example`: provide one concrete, realistic example for the proposal, suggestion, or approach
  Codex just made. This is illustrative only and does not authorize execution.

- `!retry` or `!again`: retry the last failed or blocked action after stating what failed and what
  will change, or why the failure is likely transient. Do not repeat the same failing action
  blindly; if the action touches external, production, destructive, irreversible, or remote state,
  all normal confirmation guardrails still apply.

- `!loop`: route the current request to the `$autonomous-loop` workflow when available. Use it only
  for bounded iterative work with a clear workflow, target, iteration budget, stop criteria, and
  safety policy; if those inputs are missing or mutation would be ambiguous, default to planning or
  help instead of running.

- `!handoff`: prepare a continuity summary for later resumption.

- `!help`: provide human-facing help for the current context. If no skill, agent, or workflow is
  explicitly referenced, summarize accepted shortcuts and help entrypoints. If a skill is explicitly
  referenced, explain operationally how to use that skill, which inputs are needed, what Codex will
  do, and what requires explicit authorization. Do not execute the skill.

- `!pause`: stop with current state, pending items, and the next action made explicit.

- `!commit`: authorize creation of a local commit for the current scoped changes according to the
  repository convention. If changed files, staging scope, or message intent are ambiguous, stop and
  ask for clarification.

- `!pr`: prepare or create a pull request only when repository, branch, target, and readiness are
  unambiguous.

- `!deploy`: authorize deployment to Production by default.

- `!deploy dev`, `!deploy qas`, `!deploy hml`, or `!deploy prod`: authorize deployment to the named
  environment; `prod` is equivalent to the default `!deploy`.

`!deploy` only applies to the concrete deploy candidate already identified in the current
conversation. If environment, target, release, branch, artifact, repository, expected action, or
production impact is ambiguous, stop and ask for clarification instead of deploying.

## Git Conflict Guardrail

Codex must never resolve Git conflicts for the user.

If a merge, rebase, cherry-pick, revert, stash, pull, patch application, or any other Git operation
produces conflicts, stop write work and follow `.agents/references/git-conflict-guardrails.md`.

Only read-only diagnosis is allowed while conflicts are unresolved. Commit creation or Git operation
continuation is allowed if and only if the user has resolved the conflicts manually.

## Language and Delivery

- Respond in Portuguese in this repository context, unless explicitly asked otherwise.

- Keep documentation in Portuguese when the document belongs to the project context, unless a
  specific file or prompt requires another language.

- Use proper accents in Portuguese text.

- Do not invent facts, commands, paths, behaviors, or decisions that are not grounded in repository
  evidence.

## Production Guardrails

- Treat any GCP resource carrying the tag `Prod` as production-critical.

- No state-changing action may be executed against a `Prod`-tagged resource without explicit user
  confirmation in the current session.

- Until explicit confirmation is granted, restrict work to read-only inspection, diagnosis,
  planning, and documentation.

- When there is uncertainty about whether a target is production-critical, stop and request
  confirmation instead of assuming the change is safe.

- After an explicitly authorized state-changing production action completes, create a production
  change audit record from `.agents/templates/production-changes.template.md` under
  `.agents/production-changes/YYYY-MM/YYYYMMDD-{slug}.production-change.md`. Do not create the
  record before the mutation; it must describe what actually happened, including authorization,
  affected resources/files/configuration, evidence, validation, risk, rollback, and pending
  follow-up.

- Production change records and the final `Production audit:` section must use sanitized evidence
  only. Never include complete secrets, tokens, cookies, private keys, sensitive personal data,
  intact financial payloads, or raw logs containing credentials.

- In the same final chat response, include a concise `Production audit:` section. Each bullet must
  be written in the final response language and capture the executed action, affected target, and
  observed result.

- In SAT repositories that interact with the shared production stack, `sat-eam-prd-shared-01` in
  project `sat-eam-prd` must be treated with this production rule.

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

- `.agents/references/git-conflict-guardrails.md`
  - absolute prohibition on resolving Git conflicts, allowed read-only
    diagnosis, and the narrow post-user-resolution continuation rule.

- `.agents/references/agents-roles.md`
  - installed custom agent roles, prompt and skill mappings, and write
    boundaries.

- `.agents/references/agents-usage.md`
  - team-mode triggers, when to use agents, when not to use them, and help
    routing for examples.

- `.agents/references/agents-shortcuts.md`
  - accepted compact `!` chat control shortcuts and their guardrails.

## Prompt Entrypoints

- Use `.agents/prompts/bug-analysis.prompt.md` for bugs, regressions, critical debugging, incidents,
  and root-cause analysis.

- Use `.agents/prompts/solution-design.prompt.md` when multiple technical approaches have meaningful
  trade-offs.

- Use `.agents/prompts/architecture-decision.prompt.md` for proposed or accepted ADRs under
  `docs/architecture-decisions/`.

- Use `.agents/prompts/implementation-planning.prompt.md` for non-trivial implementation plans.

- Use `.agents/prompts/league-of-agents.prompt.md` when the user explicitly says `league of agents`
  or directly invokes `@League of Agents`.

- Use `.agents/prompts/council-of-agents.prompt.md` when the user explicitly asks to pressure-test a
  high-stakes decision with one of these Council/Fellowship entries:
    - `council this`
    - `pressure test this`
    - `stress test this`
    - `war room this`
    - `premortem this`
    - `debate this`
    - `council of agents`
    - `fellowship of agents`
    - direct invocation through `@Council of Agents`
    - direct invocation through `@Fellowship of Agents`

- Use `.agents/prompts/test-driven.prompt.md` when behavior should be specified before
  implementation.

- Use `.agents/prompts/subagent-execution.prompt.md` only when parallel decomposition has clear
  value.

- Use `.agents/prompts/verification.prompt.md` after non-trivial implementation when drift is
  plausible.

- Use `.agents/prompts/changelog.prompt.md` to register material technical work.

- Use `.agents/prompts/readme.prompt.md`, `.agents/prompts/knowledge-base.prompt.md`, and
  `.agents/prompts/repository-overview.prompt.md` for documentation work.

## Custom Agent Roles

When `.codex/agents/*.toml` exists, use `.agents/references/agents-roles.md` before delegating work
to role-specific subagents.

Installed custom agents are not automatic triggers. Use them only when subagent decomposition has
clear value and the parent agent can consolidate the results.

Treat these user phrases as explicit authorization to evaluate custom-agent delegation for the
current task:

- `league of agents`
- direct invocation through the project-scoped `@League of Agents` custom agent

When one of those phrases appears, read `.agents/prompts/league-of-agents.prompt.md`,
`.agents/references/agents-usage.md`, and `.agents/references/agents-roles.md`, then decide whether
to delegate.

Treat these user phrases as explicit authorization to evaluate Council of Agents for the current
decision:

- `council this`

- `pressure test this`

- `stress test this`

- `war room this`

- `premortem this`

- `debate this`

- `council of agents`

- `fellowship of agents`

- direct invocation through the project-scoped `@Council of Agents` or `@Fellowship of Agents`
  custom agent

When one of those phrases appears, read `.agents/prompts/council-of-agents.prompt.md`,
`.agents/references/agents-usage.md`, and `.agents/references/agents-roles.md`, then run the council
only when the question has real stakes, uncertainty, and a meaningful trade-off.

When the user says `Agents Usage` or invokes `@Agents Usage`, do not spawn subagents. Read
`.agents/references/agents-usage.md` and explain how agent orchestration works in this repository.

When the user says `Agents Shortcuts`, `Agents Shortcut`, invokes `@Agents Shortcuts`, or asks which
`!` shortcuts are accepted, do not spawn subagents. Read `.agents/references/agents-shortcuts.md`
and return the accepted shortcuts with their guardrails. Do not execute the shortcuts.

When the user says `!help` without an explicit skill, agent, or workflow, do not spawn subagents.
Read `.agents/references/agents-shortcuts.md` and return concise human-facing help for the current
context, including the accepted shortcuts and help entrypoints.

When the user invokes an explicit skill together with `!help`, read that skill's `SKILL.md` and,
when available, its `README.md`. Return operator-facing usage help for that skill: what it is for,
when to use it, how an operator should ask for the work in natural language, which inputs are
needed, what Codex will check or do, and what requires explicit authorization. Do not execute the
skill.

When the user says `Agents Examples`, `Agents Example`, invokes `@Agents Examples`, or invokes
`@Agents Example`, do not spawn subagents. Read `.agents/references/agents-examples.md` and return
concise examples for each installed custom agent.

## Local Continuity Rules

Use `.agents/work-items/` selectively, but create or resume a work-item before the first remote
mutation or when losing the sequence of discoveries, decisions, validations, and pending items would
materially harm continuity.

A daily changelog entry is mandatory in the same session when material technical work, operational
diagnosis, remote mutation, deployment, documentation promotion, or evidence-backed technical
decision happened.

Never use `git status` as evidence that the day's changelog exists or was updated. Verify local
continuity artifacts directly in the filesystem.

Use `.agents/errors.md` only for clear agent execution errors evidenced by the user or transcript.
Keep it local and gitignored; reference work-items or changelogs only with plain local paths when
useful.

## Scaffold Usage Trace

When the session uses repo-local scaffold artifacts, keep a concise trace of what was actually read
or applied.

Before final delivery for non-trivial work, include a short `Scaffold usage` note only when at least
one prompt, template, or example was actually read or applied. Include only categories that have at
least one file:

- prompts: paths under `.agents/prompts/` actually used
- templates: paths under `.agents/templates/` actually used
- examples: paths under `.agents/examples/` actually used

Report only `.agents/prompts/`, `.agents/templates/`, and `.agents/examples/` files actually read or
applied. Do not list a routed prompt, example, template, or directory merely because it exists, was
mentioned by `AGENTS.md`, or would have been relevant. Do not emit the `Scaffold usage` note when no
prompt, template, or example was actually read or applied.

## Skills Usage Trace

When the session uses Codex skills, keep a concise trace of which skills were actually read or
applied.

Before final delivery for non-trivial work, include a short `Skills usage` note only when at least
one skill was actually used. Include one bullet per skill with the skill name and a terse
description of how it was used.

Report only skills whose `SKILL.md` instructions were actually read or whose workflow was actually
applied. Do not list skills merely because they exist, were available, were mentioned, or would have
been relevant. Do not emit the `Skills usage` note when no skill was actually used.

## Hooks Trace

When hook signals are visibly active in the current session, keep a concise trace of which hooks
affected the conversation context.

Before final delivery for non-trivial work, include a short `Hooks` note only when at least one hook
signal was visible or materially affected the session. Use one bullet per hook:

- `{hook-slug}`: terse description of the visible hook signal.

Report only hooks evidenced by visible session context, such as hook status messages or
`additionalContext`. Do not list hooks merely because they are configured in `.codex/hooks.json`. Do
not emit the `Hooks` note when no hook signal was visible.

## Knowledge Graph Interoperability

When a repository uses Graphify:

- If `graphify-out/GRAPH_REPORT.md` exists, read it before broad architecture or context searches
  across raw files.

- Treat Graphify outputs as a derived structural index for navigation and retrieval, not as the
  canonical source of truth.

- If Graphify output conflicts with source code, versioned docs, or explicit technical decisions,
  prefer those primary sources.

## Final Quality Bar

Before final delivery, confirm that the result is grounded in repository evidence, preserves
existing local contracts, includes appropriate validation, and records operational continuity when
the workflow requires it.

If the session used an active `.agents/work-items/` record and the task has ended, reconcile that
work-item before the final response: mark it concluded, canceled, interrupted, or leave it active
with a concrete handoff and retention reason. Do not wait for the user to ask for this close-out
explicitly. Chat archival or silence is not completion evidence. Do not wait for a final operator
phrase when repository evidence is enough; otherwise keep the item `interrompido` or `ativo` with
handoff.

<!-- knowledge-base:start -->
## Knowledge Base

@KNOWLEDGE_BASE.md
<!-- knowledge-base:end -->

@RTK.md
