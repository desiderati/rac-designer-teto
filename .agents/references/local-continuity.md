# Local Continuity

## Documentation and prompt structure

```text
.agents/
├── changelogs/
├── examples/
├── prompts/
├── references/
├── templates/
├── work-items/
└── errors.md (optional local-only; created lazily)
docs/
└── architecture-decisions/
CONTRIBUTING.md
OBSIDIAN.md
README.md
```

Optional durable directories when the repository adopts those conventions:

```text
.agents/bug-analysis/
.agents/incidents/
.agents/production-changes/
.agents/security-analysis/
.agents/security-scans/
.agents/security-reviews/
.agents/superpowers/
```

Optional local-only directories when the repository adopts those conventions:

```text
.agents/code-reviews/
.agents/council-sessions/
.agents/refactorings/
```

Optional local-only file:

```text
.agents/errors.md
```

### Directory purposes

- `.agents/changelogs/`
    - factual daily record of relevant technical work, decisions, evidence, validations, and pending items

- `.agents/examples/`
    - versioned worked examples for prompts
    - read only on demand, when the agent needs calibration for depth, structure, anti-patterns, or output shape

- `.agents/prompts/`
    - specialized prompts for execution by task type

- `.agents/references/`
    - installed operational references loaded on demand by `AGENTS.md`
    - source of detailed workflow contracts that would make the root
      `AGENTS.md` too large

- `.agents/templates/`
    - reusable templates for changelogs, work-items, knowledge-base notes, and other structured outputs

- `.agents/work-items/`
    - local, gitignored operational workspace for tasks that carry real continuity risk or local-only operational
      residue
    - default note uses `.agents/templates/work-item.template.md` as a lite checkpoint
    - `.agents/templates/work-item-full.template.md` exists only for phase-by-phase tracking when the lite note would
      hide meaningful state
    - if the work front needs local non-Markdown files, keep them in a sidecar such as
      `AAAAMMDD-{slug}.work-item.assets/` beside the note and promote only the relevant subset later
    - if the work front benefits from agent-readable structured artifacts such as task decomposition, validation
      summaries, or review references, keep them as derived files in that same sidecar, for example
      `task-plan.json`, `test-report.json`, or `review-links.json`
    - when a single `work-item.assets/` contains more than one plan or design for the same front, each artifact must
      use naming by phase in the basename and declare `fase`, `status` (futuro | aprovado | implementado |
      invalidado | equivalente local) and relação de substituição in the front matter ou metadata equivalente
    - `task-plan.json`, when used, must be derived from the plan produced by
      `.agents/prompts/implementation-planning.prompt.md` and only when it brings real execution or coordination value
    - do not create a root `.pipeline/` or another parallel source of truth by default; the active work-item remains
      the primary continuity anchor
    - not durable knowledge, not versioned, and must not be indexed by `OBSIDIAN.md`

- `.agents/errors.md`
    - optional, local, gitignored memory for clear agent execution errors evidenced by the user or transcript
    - create lazily only when there is a real agent error to record; do not create it as a routine startup artifact
    - use for mistakes such as acting without required confirmation, corrupting user-authored content, fabricating a
      fact, using the wrong target, or repeating an execution path after the user showed it was wrong
    - do not use for normal debugging attempts, failing tests in a TDD cycle, external service instability, or
      well-reasoned approaches that were discarded after new evidence
    - entries should be short and factual: date, agent/tool when known, what was done wrong, evidence, correction,
      prevention note, and optional plain local paths to related work-items or changelogs
    - Do not index `.agents/errors.md` in `OBSIDIAN.md`; promote only sanitized, recurring learning into `docs/` or
      repository guardrails when it becomes durable knowledge

- `.agents/bug-analysis/`
    - optional, versioned records of bug analyses, regressions and technical defect investigations
    - durable operational memory for context, expected versus actual flow, ranked hypotheses, validation and
      recommended or applied correction
    - if the analysis needs supporting files, keep them in a sidecar such as
      `yyyyMMdd-{bug-slug}.bug-analysis.assets/` beside the main document
    - may be indexed from `OBSIDIAN.md` when the repository treats those records as durable documentary sources
    - reusable learning should later be consolidated into `docs/`, guidelines or tests without deleting the original
      case record

- `.agents/incidents/`
    - optional, versioned incident records and concrete postmortems
    - durable operational memory for specific cases, preserving timeline, evidence, hypotheses, validation, and
      follow-up
    - if the incident needs non-Markdown evidence files, keep them in a sidecar such as
      `yyyyMMdd-{incident-slug}.incident.assets/` beside the main document
    - may be indexed from `OBSIDIAN.md` when the repository treats those records as durable documentary sources
    - reusable learning extracted from these cases should later be consolidated into `docs/`, runbooks, guidelines, or
      other canonical notes without deleting the case record

- `.agents/production-changes/`
    - optional, versioned production change records created after explicitly authorized state-changing production
      actions
    - use `.agents/templates/production-changes.template.md` and write records under
      `.agents/production-changes/YYYY-MM/YYYYMMDD-{slug}.production-change.md`
    - record what actually happened after execution, including authorization, affected resources/files/configuration,
      evidence, validation, risk, rollback, and pending follow-up
    - must never contain complete secrets, tokens, cookies, private keys, sensitive personal data, intact financial
      payloads, or raw logs containing credentials
    - mask credential-like values and keep only the minimum non-sensitive evidence needed to support the audit
    - include the compact `Production audit:` section in the final chat response for the same mutation, with bullets
      written in the final response language and one item per executed action, affected target, and observed result;
      those bullets must also be sanitized and must not paste raw command output
    - do not create the production change record before the mutation, because it is an audit record, not an approval
      request
    - when `.agents/scripts/validate_production_changes.py` is available, run it before final close-out whenever
      the record contains command, log, link, screenshot, payload, or configuration evidence
    - may be indexed from `OBSIDIAN.md` when the repository treats those records as durable documentary sources
    - reusable learning should later be consolidated into `docs/`, runbooks, guidelines, or other canonical notes
      without deleting the original change record

- `.agents/security-analysis/`, `.agents/security-scans/`, `.agents/security-reviews/`
    - optional, versioned and sanitized records for security advisor findings, broad security scans, and contextual
      security reviews
    - durable operational memory for concrete security investigations, preserving scope, masked evidence, severity,
      limits of analysis, false positives, and follow-up decisions
    - if the security record needs supporting files, keep them in a sidecar such as
      `yyyyMMdd-hhmm-{security-slug}.security-analysis.assets/` beside the main document
    - may be indexed from `OBSIDIAN.md` when the repository treats those records as durable documentary sources
    - must never contain complete secrets, private keys, session cookies, sensitive personal data, or intact financial
      payloads
    - reusable learning should later be consolidated into `docs/security/`, runbooks, guardrails, or tests without
      deleting the original case record

- `.agents/superpowers/`
    - optional, versioned operational workspace for artifacts produced by the Superpowers skill suite
    - when using Superpowers Skill in this repository, override the upstream default path and write files under
      `.agents/superpowers/<subdir>/`
    - preserve the upstream subdirectory intent below that root, such as `specs/`, `plans/`, or any future
      Superpowers-specific output class
    - promote to `docs/` only when the file becomes durable repository knowledge, policy, ADR, or runbook material

- `.agents/code-reviews/`
    - optional, local, gitignored records of structured code reviews kept beyond the current session
    - local diagnostic memory for findings, severity, scope, and recommendations tied to a concrete review pass
    - if the review needs supporting files, keep them in a sidecar such as
      `yyyyMMdd-hhmm-{review-slug}.code-review.assets/` beside the main document
    - not durable knowledge, not versioned, and must not be indexed by `OBSIDIAN.md`
    - reusable conclusions should later be consolidated into `docs/`, guidelines, or follow-up implementation work
      without treating the original local review as a documentary source

- `.agents/council-sessions/`
    - optional, local, gitignored workspace for Council of Agents outputs
    - stores `council-report-[timestamp].html` and
      `council-transcript-[timestamp].md`, usually under `YYYY-MM/`
    - not durable knowledge, not versioned, and must not be indexed by `OBSIDIAN.md`
    - reusable decisions should be promoted separately to `docs/`, ADRs, PRDs,
      plans, or changelogs when they become durable project knowledge

- `.agents/refactorings/`
    - optional, local, gitignored workspace for refactoring fronts, prompts, heuristics, execution records, and
      regression artifacts
    - local operational memory for what was planned, executed, validated, and which ADR recommendation remained at
      close-out
    - `prompts/` stores per-front prompts as `refactoring-{resource-slug}.prompt.md`
    - `prompts/.archived/YYYY-MM/` stores aged prompts retired by local retention policy
    - `heuristics/` stores reusable local heuristics with no TTL by default
    - `YYYY-MM/` stores execution records, regression artifacts, and sidecars when the round keeps local continuity
    - if the local refactoring record needs supporting files, keep them in a sidecar such as
      `yyyyMMdd-hhmm-{refactoring-slug}.refactoring.assets/` beside the main document
    - not durable knowledge, not versioned, and must not be indexed by `OBSIDIAN.md`
    - reusable lessons should later be consolidated into `docs/`, promoted to
      `docs/architecture-decisions/` as ADRs when they encode architectural decisions, or captured as guidelines
      without treating the local record itself as canonical documentation

- `.obsidian/`
    - optional local metadata for the Obsidian app; personal, local, and not versioned

- `OBSIDIAN.md`
    - optional versioned entrypoint for the navigable knowledge base of the repository
    - must not index `AGENTS.md`, `CLAUDE.md`, or the ephemeral operational layer under `.agents/`, such as
      `prompts/`, `references/`, `templates/`, `examples/`, `changelogs/`, `errors.md`, and `work-items/`
    - `.agents/bug-analysis/`, `.agents/incidents/`, `.agents/security-analysis/`, `.agents/security-scans/`, and
      `.agents/security-reviews/`, when adopted as versioned documentary sources for concrete cases, are allowed
      exceptions

- versioned knowledge base
    - usually lives under `docs/` by default when the repository keeps a versioned knowledge base

- `docs/architecture-decisions/`
    - canonical directory for ADRs when the repository adopts `docs/` as the versioned knowledge base
    - materialize this directory only when the first ADR is actually promoted
    - naming convention: `ADR-NNN-{slug}.md`
    - if an ADR needs supporting files, keep them beside the document in `ADR-NNN-{slug}.assets/`

- `CONTRIBUTING.md`
    - optional versioned baseline for contribution rules and commit message conventions
    - should stay portable and minimal when distributed by bootstrap
    - when the repository has more specific contribution rules elsewhere, the local canonical contract should prevail

- `README.md`
    - file containing the project description and setup instructions

---

## Mandatory initial reading

Before non-trivial analysis or execution:

1. Read `README.md` if it exists
2. Read `CONTRIBUTING.md` if it exists
3. Read `OBSIDIAN.md` if it exists
4. Read `.agents/errors.md` if it exists; do not create it as a routine startup artifact
5. Check relevant docs referenced from `OBSIDIAN.md` when that file exists
6. Check recent `.agents/changelogs/` entries when they help explain current constraints,
   previous attempts, or pending issues
7. Check relevant `.agents/bug-analysis/YYYY-MM/*.bug-analysis.md` records when previous
   defect history or bug continuity matters
8. Check relevant `.agents/incidents/YYYY-MM/*.incident.md` records when previous incident
   history or case continuity matters
9. Check relevant local `.agents/code-reviews/YYYY-MM/*.code-review.md` records when previous
   review history or review continuity matters
10. Check relevant local `.agents/refactorings/YYYY-MM/*.refactoring.md` records when previous
    refactoring history or front continuity matters
11. If continuing a task with an active or otherwise relevant `.agents/work-items/YYYY-MM/*.work-item.md`,
    read it before proceeding
12. Only then proceed to analysis, planning, or documentation review

Load `.agents/examples/*.example.md` only on demand. They are calibration aids, not mandatory initial context.

Do not operate in a documentation vacuum.

---

## Work-item rules

Only create or resume a local work-item when at least one of these is true:

- the task may cross sessions, multiple chat executions, or context compaction
- a pause, handoff, blocker, or branch switch is plausible
- there are local artifacts or evidence that should stay out of changelog or durable docs
- the work is investigatory or observational and may remain only partially promoted
- skips or deviations need explicit local coordination across phases
- the same work front already has local context and reopening it is cheaper than reconstructing it

The following are mandatory triggers and remove discretion. Create or resume a
work-item even if the task may still finish in the current session:

- any incident, diagnosis, or bug investigation that touches shared runtime,
  production, or another remote operational surface
- any remote or state-changing action outside the local workspace, including
  `n8n`, Apps Script, GCP, hosts, containers, deployments, restarts, or secret
  changes
- any session that creates local backups, exports, temporary payloads, logs, or
  evidence files that would be costly to reconstruct later
- any session where losing the exact sequence of findings, decisions,
  validations, or pending hardening work would materially harm the developer

If none of these is true and the task is likely to conclude inside the active context with direct promotion to
changelog, do not open a work-item by default.

- Create or resume a local work item under `.agents/work-items/YYYY-MM/YYYYMMDD-short-slug.work-item.md` only after that
  eligibility gate
- When a mandatory trigger exists, create or resume the work-item before the
  first remote mutation. If the trigger becomes clear only later in the
  session, stop and open or update the work-item immediately instead of
  deferring it to the end
- When the repository has access to `agents-housekeeping`, run only a non-destructive `check` for `work-items` before
  opening a new work-item and report how many archived candidates exist; do not move files automatically during
  work-item creation
- Start from `.agents/templates/work-item.template.md` for the lite default
- Switch to `.agents/templates/work-item-full.template.md` only when phase-by-phase tracking across sessions or work
  fronts adds real value
- Keep one active work-item per work front; if the work splits materially, open a new file instead of overloading one
  record
- Treat the work item as the primary local continuity artifact only while that continuity need really exists
- Keep the lifecycle explicit with a status such as the exact local values
  `ativo`, `bloqueado`, `interrompido`, `concluído`, or `cancelado`
- Keep entries concise: store canonical summaries and references, not long pasted outputs, raw logs, or large diffs
- When a work-item needs local files such as screenshots, exports, logs, or diffs, store them in a sidecar directory
  `.agents/work-items/YYYY-MM/AAAAMMDD-{slug}.work-item.assets/` beside the note, not in a shared `.agents/assets/`
  folder
- When the work front benefits from structured helper artifacts such as task decomposition, validation summaries, or
  review references, keep them as derived files in that same sidecar and treat the work-item as the primary
  source of truth
- When `task-plan.json` exists, treat it as an optional operational projection of the approved implementation plan, not
  as a substitute for the human plan itself
- When an external durable artifact exists (file, changelog, commit, ticket), reference it instead of duplicating it
- Because `.agents/work-items/` is local and gitignored, do not treat it as durable knowledge and do not index it in
  `OBSIDIAN.md`
- Because `.agents/work-items/` is local and gitignored, never use `git status`
  as evidence that the work-item exists, is current, or is unnecessary; inspect
  the filesystem explicitly when continuity matters
- Before ending a session with the task still open, update the handoff section with current state, next step,
  blockers, recent decisions, and any skips or deviations that still matter
- Before the final response of a session that used an active work-item, reconcile
  that item. If the task finished, mark it as `concluído` or `cancelado` and
  fill the closure fields. If the task did not finish, mark it as
  `interrompido` or keep it `ativo` with a concrete next step and retention
  reason. Do not depend on the user asking explicitly to close the item
- Chat archival, compaction, or silence is not enough evidence by itself. Do
  not wait for a final operator phrase when repository evidence proves
  completion; otherwise preserve the item as `interrompido` or `ativo` with
  handoff
- If the task pauses without completion, mark the work-item as `interrompido`; if it is abandoned by decision, mark it
  as `cancelado`
- When the task ends, promote only the relevant facts, decisions, validations, risks, and pending items to changelog or
  durable docs when appropriate
- If local evidence from a work-item becomes part of an incident, local code review, or refactoring artifact, move or
  regenerate only the relevant files under that artifact's own `.assets/` sidecar
- When concluding or canceling a work-item, validate before considering it closed:
    - `elegível para colapso após promoção?` must be explicitly decided
    - `referência do changelog / artefato durável` must be filled whenever promotion actually happened
    - if `reter localmente? sim`, also fill `motivo da retenção local`
- After promotion, either collapse the work-item to a short local stub, archive it locally with references to the
  durable artifacts, or keep it open only if continuity risk still remains
- `reter localmente? sim` is an explicit local hold and blocks automatic archiving or purge until the flag is removed
  or changed
- Never auto-delete a work-item that is active, blocked, interrupted, unpromoted, or still carries local-only evidence

---

## Skip and deviation rules

For non-trivial tasks, do not let skipped phases or changed decisions remain implicit.

- A `skip` is an applicable standard phase that was intentionally not executed. Record the skipped prompt or phase and
  why it was not needed or not applicable.
- A `decided deviation` is an intentional divergence from the chosen design, approved plan, or test specs that was
  recorded before proceeding.
- A `silent deviation` is a divergence discovered later with no prior record. Verification should treat silent
  deviations as risk by default.
- Record skips and decided deviations in the active work-item before moving to the next phase when a work-item exists.
- Record them at the moment of the decision, not retroactively after the outcome is already known.
- If no work-item was opened because the task stayed inside the active context, record only the skips or deviations
  that materially affect scope, risk, validation, pending work, or future continuity directly in the changelog.
- Promote skips or deviations to the changelog when they affect scope, risk, validation, pending work, or future
  session continuity.
- "I will remember later" is not a record. If it matters, write it down.

---

## Changelog rules

- Follow the instructions in `.agents/prompts/changelog.prompt.md`.
- Use daily changelogs under: `.agents/changelogs/YYYY-MM/AAAAMMDD.changelog.md`. If the monthly directory or the file
  for the day does not exist, create them.
- The template is located at `.agents/templates/changelog.template.md`.
- A daily changelog entry is mandatory in the same session whenever any of these
  happened:
    - material technical work, implementation, review, or validation with decisions
      or evidence worth preserving
    - incident diagnosis or operational investigation with non-trivial findings
    - remote mutation, publish, deploy, restart, activation, import,
      migration/schema change, or rollback
    - security-relevant decision, drift discovery, or runtime correction
    - durable documentation updates based on newly established operational facts
    - evidence-backed technical decision that affects future repository behavior
- When a session crosses one of the mandatory triggers above, do not postpone
  changelog creation to a vague end-of-session intent. Create or update the
  day's entry at the first stable checkpoint after the relevant facts are known
- Because `.agents/changelogs/` is local and gitignored, never use `git
  status` as evidence that the day's changelog exists or was updated; inspect
  the filesystem explicitly
- When a non-trivial task has an active work-item, use it as the primary local input when compacting the session into
  changelog form.
- Do not mirror the work-item structure verbatim in the changelog; promote only what remains durably relevant after the
  session.
- Leave handoff-only or evidence-staging details local unless they still matter for future sessions.
- If the task is concluded and the work-item no longer carries operational value, collapse it to a stub or archive it
  locally instead of keeping a second full narrative.
- If a relevant technical fact, discarded path, or decision is still unclear, ask for clarification before writing the
  entry.

---
