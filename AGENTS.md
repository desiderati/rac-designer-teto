# AGENTS.md

Installed from `agents-bootstrap` skill version `0.181.5-beta`.

## Scope

This file applies to local development sessions using Agents Bootstrap. In Manus or another external
agent environment, follow the host's project and task instructions. Keep Bootstrap setup, refresh,
shortcuts, hooks, and local tools outside application work. Preserve the pack files.

## Context

`.agents/` holds operational artifacts, `.codex/agents/` the role pack, and this file routes to
`.agents/references/`.

## Workspace Kind Resolution

Before repository-scoped work, run `git rev-parse --show-toplevel` in the active directory. Use the
returned Git root, including linked worktrees where `.git` is a file.

Only when Git reports that no work tree exists, check for at least one independent child repository
and root `AGENTS.md` and `.agents/`. All three are required for aggregator mode. Report other Git
errors and stop repository-scoped work.

Aggregator mode refreshes existing scaffolds only.
Never run repository-level Git operations from an aggregator root. Use the appropriate child for
commits, pushes, stashes, branches, and repository bootstrap.

## Skill Development Contract

- Resolve `sat.codex_skills_repo` via `codex-profile` to the canonical Git repository.
- For catalog skill authoring, use `skill-development-session` in a linked worktree automatically;
  `.codex/skills` only as runtime. Other repositories stay in the current checkout unless this chat
  invokes `!init-worktree`.
- For catalog skill authoring, fail closed: never fall back silently to runtime. Require the
  `skill-validation` gate and Ruff for changed Python.

## Mandatory Initial Reading

Read `SEMANTIC-VERSIONING.md` before release choices. Read existing `README.md`, `CONTRIBUTING.md`,
workflow references and relevant continuity. Use `OBSIDIAN.md` only for an unknown canonical source.
Read `SOUL.md` if it exists when interpreting repository agent philosophy, decision style,
orchestration norms, or communication posture. `AGENTS.md` remains the authoritative operational contract.
Read `.agents/errors.md` if it exists; do not create it as a routine startup artifact.
Discover first; cap reads at 200 lines or 32 KiB, chunk larger files, and never batch full-file reads.

## Core Operating Principles

- Avoid blind trial and error and direct coding for non-trivial tasks.
- Separate facts, hypotheses, evidence, assumptions, and pending questions.
- Prioritize root causes over symptoms.
- Preserve continuity; keep changelogs factual and durable documentation curated.
- Load worked examples and use subagents only when they add clear value.

## Epistemic Independence Lock

- Treat user objections, questions, and hypotheses as claims to evaluate, not conclusions to adopt.
- Do not change a conclusion because of the objection's tone, repetition, or perceived authority.
- Classify new input as evidence, factual correction, preference, authorization, hypothesis, or
  opinion before using it.
- Compare the new input with the existing evidence and the criteria behind the prior conclusion.
- Revise a conclusion only for new evidence, a corrected premise, or an identified reasoning flaw;
  state exactly what caused the revision.
- Without a new basis, maintain the conclusion and explain why. Uncertainty alone does not justify
  reversing it.
- Preferences and authorizations may change the selected action, but they are not evidence that the
  technical conclusion changed.
- Apply the same scrutiny to the user's position and the prior response. Do not confuse intellectual
  independence with reflexive disagreement.
- When a conclusion is challenged, report `conclusion maintained`, `conclusion revised`, or
  `insufficient evidence`, followed by the factual basis.

## Conditional Tool Routing

Frontend: follow `.agents/references/frontend-workflow.md` for mandatory routing.

- At most one discovery step may precede direct reading or execution.
- Do not chain Obsidian and Graphify unless the selected document proves that an unknown code
  relationship must be resolved.
- Known command: execute through RTK with bounded output and one public handler call.
- Known GCP skill and action: open the selected skill and invoke its public launcher directly; do
  not consult a routing index.
- Unknown GCP skill or action: when `skill-routing-index.json` exists, consult it as the single
  discovery step, select one skill/action, then open only that skill's canonical source.
- Unknown document or rule: consult `OBSIDIAN.md`, choose one of at most three paths, then read the
  canonical source.
- Unknown code relationship: query an existing Graphify index with a small budget, then read at most
  three source files. Never rebuild the graph during a normal operation.
- Known file and symbol: open the target directly without either index.
- RTK is the executor boundary for external executables. PowerShell cmdlets remain direct.
- Mechanical prerequisites belong inside the handler; the model decides again only on ambiguity,
  required human confirmation, or a real failure.

## Memory Usage

Saved memories must be treated as contextual clues, not as current facts.

Revalidate operational memories against the current canonical source before acting.

Stable user preferences may be applied directly. Operational states, versions, canonical paths, next
IDs, deployments, permissions, environment status, and time-dependent decisions must always be
revalidated before guiding execution or presenting conclusions.

## Execution Discipline

- State objective, assumptions, and success evidence before non-trivial implementation.

- Ask when ambiguity affects scope, behavior, risk, data, or production safety.

- Prefer the smallest cohesive change that preserves the touched contract.

- Isolate broader refactors; close after objective and evidence checks.

## Execution Efficiency

Reuse valid evidence; justify repeats. Preserve gates.
Details: `.agents/references/agents-roles.md`.

## Scope Checkpoint

Track mission, total scope, trajectory, and one detour. Continue only for a deliverable, evidenced
blocker, or `!sidequest`; otherwise recenter. Focus never contracts scope. Hook reminders are static
and consultative: no blocking, persistence, tool-count inference, or state rehydration.

## Operational Outcome Lock

When an authorized operational outcome remains unresolved, finish it before hardening. A new command
or package requires a scope-expansion checkpoint. Passing tests and code readiness do not replace
validated state.

## Scope Integrity Lock

A focus subset never replaces the authorized multi-item universe unless explicitly narrowed. Before
changes, reconcile total, focus, restriction source, and unresolved remainder; implicit contraction
or expansion requires a checkpoint.

## Web Navigation and Testing

For web/local navigation, interaction, inspection, screenshots, or verification, first use the
Codex Browser `iab` via the
`browser:control-in-app-browser` skill. Use standalone Playwright only after a Browser attempt fails,
lacks capability, or the user asks. If falling back, state why. Internal Playwright, such as
`tab.playwright`, is allowed in `iab`.

## Windows Shell Runtime

On Windows, use `pwsh.exe -NoLogo -NoProfile -NonInteractive`; use `powershell.exe` only for 5.1 or
when 7 is absent. RTK wraps executables, not cmdlets. With global enforcement, route executables via
`rtk` (`rtk proxy` for raw output) and run cmdlets directly. Use `.ps1`/`-File`, never nested
`pwsh -Command`; use `rg --glob`; collect `foreach` before pipes.

Only a proven syntax or argument error with evidence that nothing executed permits a retry:
correct the syntax once without asking, only if action, target, environment, effect, and
authorization remain unchanged. If that attempt fails, stop and diagnose; do not retry again.
A policy, security, or permission denial is not a syntax error. Never bypass such a refusal
using another command, language, or API; stop the denied action and report the blocker.
If the cause is inconclusive, restrict work to read-only diagnosis. If partial execution is
possible, verify the resulting state in read-only mode before deciding whether any retry is safe
and authorized. Never repeat blindly. The hook never edits/runs; this is not `!retry`.

## Interaction and Safety Guardrails

- If any fact, statistic, date, path, command, API, or technical behavior is uncertain, say so
  before relying on it. Do not invent facts, statistics, dates, commands, paths, behaviors, or
  decisions.

- Match explanation depth to the user's context: do not over-explain what is already clear, and do
  not omit context needed for a safe decision.

- Before substantially rewriting, removing, restructuring, or changing the tone of user-authored
  content, describe the exact intended change and why, then wait for explicit confirmation.

- Do not send, post, publish, share, email, invite, schedule, deploy, migrate, or execute
  irreversible or external state-changing actions unless the exact action is authorized in the
  current message or by the narrow Jira/JSM route under Production Guardrails.

- Deployments, pushes to environments, migrations, schema changes, external mutations, and commands
  with irreversible side effects always require one of those authorization routes. User-requested
  read-only inspection may proceed unless it touches sensitive data or an unrequested surface.

- For architecture decisions, complex debugging, non-trivial features, or other long-term technical
  choices, work through the problem before implementation: identify uncertainty, compare trade-offs,
  and make the recommendation explicit.

- Before starting large or high-impact work, show 2-3 viable approaches and wait for the user to
  choose unless an approved plan already selects the approach.

## Chat Control Shortcuts

`!` shortcuts are scoped intent signals, never safety bypasses.

Before interpreting or executing any shortcut, read `.agents/references/agents-shortcuts.md`.

Apply its Chat title markers contract.
For chat tables, apply its Chat Table Presentation rule.

`!init-worktree` requests public SDS `InitWorktree` for the current Git repository. Follow the
naming, ownership and governance contract in that reference; missing or incompatible policy blocks
before mutation. Never install or synchronize a skill automatically.

`!worktrees` inventories worktrees and proven session bindings
read-only. Follow that reference; no cleanup. In the SAT catalog, correlate accessible chats through
SDS; never read private bindings or infer identity.

`!history` requests a playful activity and work-pattern summary. Follow that reference's exact
expansion and declared history or conversation fallback; never invent activity or enable observation.

`!finish-worktree [target]` runs review, commit, direct FF or governed GCR, verified SDS cleanup
and selective skill sync unless excluded. Follow the scoped shortcut contract. Public SDS
`FinishWorktree` remains cleanup-only. Discussion does not invoke it; no push.

## Git Branch Discipline

Codex must not create or switch working branches unless the user explicitly requests that exact Git
action in the current conversation, or a governed workflow such as PR preparation requires it and
the branch, target, and readiness are unambiguous.

A new story, ticket, epic, task, or change round is not implicit authorization to create a new
branch. Continue on the current branch and separate each scoped change with repository-compliant
commits unless the user deliberately asks for a different branch strategy.

If the branch target or intent is ambiguous, stop and ask for clarification before running branch,
checkout, worktree, merge, rebase, cherry-pick, pull, or PR-preparation commands.

Repository-specific permissions belong to GRG. Follow the selected profile in the managed
Repository Git Governance section; do not import restrictions from another profile.

## Git Freshness Guardrail

When hook context says refs show the branch behind upstream or diverged, pause before writing and
ask how to synchronize. Ask for `git merge --ff-only` only when behind and the operator chooses it.

Outgoing commits, dirty worktrees, or missing session fetch are not freshness blockers.

Do not run fetch, pull, merge, rebase, stash, or conflict-resolution commands without explicit
current-session confirmation. Divergence or in-progress Git operations require read-only diagnosis.

## Worktree Integration

Follow `.agents/references/agents-shortcuts.md` for sealed/unsealed routing, fast-forward-only
incorporation and same-result consent. Preserve seals, ownership and gates. Reconcile-only stops
before commit/integration; never squash, create merge commits or rebase sealed sources.

## Git Conflict Guardrail

Codex must never resolve Git conflicts for the user.

The only allowed scripted exception is the `$bitbucket-pull-request` governed `git merge --squash`
continuation on the expected `pr/*` branch, when the user explicitly asks for `ours` or `theirs`,
chooses exactly one side, and approves the exact confirmation phrase required by that skill. Do not
offer this option proactively.

If a merge, rebase, cherry-pick, revert, stash, pull, patch application, or any other Git operation
produces conflicts, stop write work and follow `.agents/references/git-conflict-guardrails.md`.

Only read-only diagnosis is allowed while conflicts are unresolved, except the bounded abort of a
rebase initiated by the incorporation flow, as defined in the conflict guardrails. Commit creation or Git operation
continuation is allowed if and only if the user has resolved the conflicts manually, except for the
narrow `$bitbucket-pull-request` scripted exception above.

## Language and Delivery

- Respond in Portuguese in this repository context, unless explicitly asked otherwise.

- Keep documentation in Portuguese when the document belongs to the project context, unless a
  specific file or prompt requires another language.

- Use proper accents in Portuguese text.

- Use plain Markdown in chat responses, including trace notes. Do not use raw HTML such as
  `<details>` and `<summary>` to create collapsible sections. This rule applies only to chat
  responses; HTML files produced as deliverables remain allowed.

- Do not invent facts, commands, paths, behaviors, or decisions that are not grounded in repository
  evidence.

## Production Guardrails

- Before any action that could touch infrastructure, credentials, customer data, deployment,
  release, remote APIs, security controls, or GCP/Bitbucket/Jira/VPN resources, classify the target
  explicitly as one of: `local-only`, `read-only`, `security-sensitive`, `production-adjacent`, or
  `Prod/state-changing`.

- `security-sensitive` and `production-adjacent` targets remain limited to read-only inspection,
  diagnosis, planning, `security-scan`/`security-review`, and documentation until the exact next
  action is classified.

- `Prod/state-changing` requires literal current-session authorization naming the action,
  target, environment, mutation, validation, and rollback or stop condition. As a narrow
  alternative, a governed skill may consume fresh Jira/JSM approval only when it declares Jira as
  its source and binds approval id, aggregate decision, completion, issue id/revision, request type,
  full scope, mutation, validation, and rollback or stop condition.

- The Jira/JSM route requires aggregate `finalDecision=approved` on the exact stage. Treat status,
  Activity, transition timing, actor correlation, and individual votes only as supporting evidence.
  Re-read the request and approval immediately before the first
  mutation; missing, pending, declined, malformed, ambiguous, or drifted evidence fails closed.

- Treat any GCP resource carrying the tag `Prod` as production-critical.

- No state-changing action may be executed against a `Prod`-tagged resource without explicit user
  confirmation in the current session or the exact governed Jira/JSM authorization route above.

- Until one of the allowed authorization routes is proven, restrict work to read-only inspection,
  diagnosis, planning, and documentation.

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

- Preserve operational identity only when it is the minimum evidence needed to audit grant,
  revocation, authorization, or execution. Prefer an immutable principal, ticket, or equivalent
  reference; use a name or email only when no equivalent traceability exists and omit additional
  personal attributes.

- In the same final chat response, include a concise `Production audit:` section. Each bullet must
  be written in the final response language and capture the executed action, affected target, and
  observed result.

- In SAT repositories that interact with the shared production stack, `sat-eam-prd-shared-01` in
  project `sat-eam-prd` must be treated with this production rule.

## Workflow Router

Binding references:

- `.agents/references/agents-workflow.md`: prompt map, sequences and workflow visual.
- `.agents/references/prompt-routing.md`: prompt fitness, ambiguity, phrase routing and chaining.
- `.agents/references/code-review-routing.md`: review modes, scope, shadow and delegation.
- `.agents/references/local-continuity.md`: structure, work-items, skips, deviations and changelogs.
- `.agents/references/documentation-governance.md`: Graphify, README impact, knowledge consolidation and overview.
- `.agents/references/collaboration-and-automation.md`: automation, collaboration, improvements, quality and `🤖` agent-created chats.
- `.agents/references/git-conflict-guardrails.md`: conflict prohibition, read-only diagnosis and post-user-resolution continuation.
- `.agents/references/agents-roles.md`: roles, prompt/skill mappings and write boundaries.
- `.agents/references/agents-usage.md`: team triggers, agent selection and example help.
- `.agents/references/next-workflow.md`: `!next-workflow [ui]`.

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

- Use `.agents/prompts/council-of-agents.prompt.md` for Council triggers below.

- Use `.agents/prompts/agents-of-shield.prompt.md` when the user explicitly invokes `@Agents of
  Shield` or asks for the `agents of shield` security council.

- Use `.agents/prompts/fellowship-of-architects.prompt.md` when the user explicitly invokes
  `@Fellowship of Architects` or asks for the `fellowship of architects` architecture council.

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

Before custom-agent delegation, read `.agents/references/agents-roles.md`; for review intent, read
`.agents/references/code-review-routing.md`. Agents require explicit intent or router selection.

Direct `@Brainstorm` loads `.agents/prompts/brainstorm.prompt.md` and
`.agents/references/brainstorm.md`; it accepts only an unclear idea, requirement, or solution and
hands off first to `product-owner` or `solutions-architect`. Clear incidents and clear
maintenance/refactoring in unknown code bypass it to `support-analyst` and `code-explorer`;
Brainstorm only reclassifies those cases. It authorizes orchestration, not writing, councils,
implementation, Git, deploy, or external mutation.

Explicit delegation triggers:

- League: `league of agents`, project-scoped `@League of Agents`, or `!review auto`.
  Read `.agents/prompts/league-of-agents.prompt.md`; evaluate delegation.

- Council: `council this`, `pressure test this`, `stress test this`, `war room this`,
  `premortem this`, `debate this`, `council of agents`, or `@Council of Agents`.
  Read `.agents/prompts/council-of-agents.prompt.md`; run only for real stakes, uncertainty,
  and a meaningful trade-off.

- Shield: `agents of shield` or `@Agents of Shield`.
  Read `.agents/prompts/agents-of-shield.prompt.md` and
  `.agents/references/security-advisor-profiles.md`; run only when the security question
  benefits from the fixed profile set.

- Fellowship: `fellowship of architects` or `@Fellowship of Architects`.
  Read `.agents/prompts/fellowship-of-architects.prompt.md` and
  `.agents/references/solutions-architect-profiles.md`; run only when the architecture question
  benefits from the fixed profile set.

Also read `.agents/references/agents-usage.md` and
`.agents/references/agents-roles.md` before agent evaluation or execution.

When the user says `Agents Usage` or invokes `@Agents Usage`, do not spawn subagents. Read
`.agents/references/agents-usage.md` and explain how agent orchestration works in this repository.

For `Agents Shortcuts`, `Agents Shortcut`, `@Agents Shortcuts`, or shortcut-list queries, read
`.agents/references/agents-shortcuts.md`. Return all shortcuts and guardrails using its
Presentation contract; never execute shortcuts, rename chats or spawn subagents.

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

For `@Models Usage`, read `.agents/references/models-usage.md`; do not spawn or change config.
Alone, list GPT-6 examples; with a task, recommend one model-effort pair.

## Local Continuity Rules

Use `.agents/work-items/` selectively, but create or resume a work-item before the first remote
mutation or when losing the sequence of discoveries, decisions, validations, and pending items would
materially harm continuity.

An operational changelog entry is mandatory in the same session when material technical work, operational
diagnosis, remote mutation, deployment, documentation promotion, or evidence-backed technical
decision happened.

Never use `git status` as evidence that the day's changelog exists or was updated. Verify local
continuity artifacts directly in the filesystem.

Use `.agents/errors.md` only for clear agent execution errors evidenced by the user or transcript.
Keep it local and gitignored; reference work-items or changelogs only with plain local paths when
useful.

## Continuation Suggestions

After material PRD, ADR, or plan work, silently apply `.agents/references/suggestion-system.md`;
otherwise only on concrete signal. It emits 0–3 suggestions without loading a skill solely for that
purpose. Preserve scope; apply the delivery-residue filter in `prompt-routing.md`.

`!next-prompt` returns exactly one sanitized, copyable prompt for the smallest evidence-backed next
action. It remains read-only: it neither executes nor authorizes the prompt it returns. If no
result-oriented item remains, state `Nenhuma pendência funcional ou contextual.`

`!next-prompt meta` is a modifier of `!next-prompt` for preparing a standalone Codex goal prompt.
Do not recommend a model or reasoning effort, create a goal, execute it, or activate agents. Return exactly one fenced `text` block whose standalone
prompt preserves the normal authorization boundary and avoids intermediate operator decisions only
when evidence can resolve them safely. Allow enough detail for the resolved task without a fixed
length limit. Use `Método` for strategy, decision criteria, and required evidence rather than
prescribing tools, sequence, or iteration counts unless a binding contract or explicit operator
instruction requires them. Adapt execution to new evidence; never invent operations or authority.
Prefer level-two Markdown headings (`##`) for the
seven standard sections. Treat this as presentation guidance, not a validity gate; equivalent plain
section labels remain semantically valid.

Place `Próximos passos:`, optional `Melhorias sugeridas:`, and `Sugestão de prompt para próxima
ação:` before trace notes (`Scaffold usage`, `Skills usage`, `Hooks`). Omit them when complete or
action is trivial, administrative-only, ambiguous, or blocked without a safe resume prompt.
See `suggestion-system.md`. Use at most 3 grounded ideas; omit weak/generic ideas.

For the suggested prompt, use exactly one fenced code block with one sanitized paragraph: no
secrets, raw logs, instructions, hidden reasoning, or nested fences. After an unambiguous validated
dry-run/plan, suggest the exact confirmation phrase and do not add another planning turn. Otherwise
ask for planning or explicit confirmation instead of execution. Keep `Production audit:` before
traces.

## Scaffold Usage Trace

Report only `.agents/prompts/`, `.agents/templates/`, and `.agents/examples/` files actually read or
applied under `Scaffold usage`, grouped as prompts, templates and examples. Omit empty categories;
existence, routing or mention is not use. Do not emit the `Scaffold usage` note when no prompt,
template, or example was actually read or applied.

## Skills Usage Trace

Report only skills whose `SKILL.md` instructions were actually read or whose workflow was actually
applied under `Skills usage`: one bullet per skill, name and terse use. Existence or mention is not
use. Do not emit the `Skills usage` note when no skill was actually used.

## Hooks Trace

Include `Hooks` only for signals visible in session context or materially affecting work:

- `{hook-slug}`: terse description of the visible hook signal.

Do not list hooks merely because they are configured in `.codex/hooks.json`.
Do not emit the `Hooks` note when no hook signal was visible.

## Knowledge Graph Interoperability

When a repository uses Graphify:

- Use Graphify only when the structural relationship is unknown. If the file and symbol are known,
  open the source directly.

- Query an existing `graphify-out/graph.json` with `query`, `path`, or `explain`, use a small budget,
  and return at most three source files before reading the canonical sources.

- Never rebuild the graph or export an Obsidian vault automatically during a normal task. Build and
  incremental update are deliberate index-maintenance operations.

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

<!-- BEGIN SAT REPOSITORY GOVERNANCE -->
## Repository Git Governance

- Explicit profile: `single-environment-line`.
- Single primary line: main.
- Before Git operations, validate `.agents/repository-governance.toml` with
  `$git-repository-governance`; never infer permission from topology.
- `DELEGATE` requires the named governed workflow. `DENY`, `INVALID`, and
  `UNCONFIGURED` are fail-closed.
<!-- END SAT REPOSITORY GOVERNANCE -->

@RTK.md

## Identidade documental deste projeto

O RAC Designer TETO usa a identidade TETO e não deve receber o banner SAT. A política
`.agents/documentation-policy.json` define `sat_banner: forbidden` para o validador local;
esta decisão específica prevalece sobre os modelos genéricos de documentação SAT.
