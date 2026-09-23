---
title: "Suggestion System"
doc_role: skill-reference
---

# Suggestion System

Use this reference after materially creating or reviewing a PRD, ADR, or non-trivial implementation
plan, when an automatic final-delivery suggestion has real signal, or when the user invokes
`!suggest`, `!suggest explore`, or `!next-prompt`.

The mechanism is advisory and non-mutating. It discovers grounded gaps, adjacent capabilities,
cross-cutting risks, and useful stage transitions without silently expanding scope or converting
preferences into requirements.

## Core Model

Evaluate the current context as:

```text
artifact × stage × functional families × modifiers × transversal lenses
```

One context may have multiple artifacts, families, and modifiers. For example, a customer-order
table may combine collection/discovery, transaction/commerce, and identity/access concerns.

Every candidate must have:

- evidence from the request, artifact, repository, execution, or validation
- one origin: artifact gap, functional opportunity, transversal risk, or stage transition
- one current stage and at least one artifact or functional-family anchor
- a clear optionality label: required by evidence, recommended, optional, or deferred
- a user-visible benefit, risk reduction, or unblocking effect
- a bounded next decision; suggestions must not contain hidden implementation authorization

## Artifact Catalog

Artifact detection controls which questions are legitimate at the current stage and which owner may
be routed when deeper analysis is justified.

| Artifact group         | Representative artifacts                                                    | Preferred owner when available                                           | Typical suggestion focus                                          |
|------------------------|-----------------------------------------------------------------------------|--------------------------------------------------------------------------|-------------------------------------------------------------------|
| Product and discovery  | opportunity note, feature brief, PRD, backlog item, acceptance criteria     | `$prd-generation`, `product-owner`                                       | user outcome, actors, scope, rules, feature adjacency, metrics    |
| Diagnosis              | bug analysis, incident analysis, root-cause record, support case            | `bug-analysis.prompt.md`, `$incident-analysis`, `support-analyst`        | evidence gaps, containment, reproduction, hidden edge cases       |
| Technical decision     | ADR, option comparison, technology choice                                   | `architecture-decision.prompt.md`, `solutions-architect`                 | drivers, alternatives, consequences, reversibility, migration     |
| Solution and UI design | solution design, architecture diagram, UI specification, interaction design | `solution-design.prompt.md`, `$frontend-design`, `$architecture-diagram` | boundaries, flows, states, accessibility, responsive behavior     |
| Planning               | implementation plan, migration plan, delivery phase, rollout plan           | `implementation-planning.prompt.md`, `software-developer`                | dependencies, sequencing, tests, rollout, rollback, observability |
| Test specification     | scenarios, test strategy, quality plan, UAT criteria                        | `test-driven.prompt.md`, `quality-analyst`                               | behavior partitions, negative cases, fixtures, evidence, coverage |
| Review and assurance   | code review, security review, UI review, readiness review                   | `$code-review`, `$security-review`, `$security-scan`, `ui-reviewer`      | proven defects, regressions, missing evidence, release risk       |
| Refactoring            | refactoring front, structural migration, cleanup proposal                   | `$refactoring`, `solutions-architect`                                    | invariants, boundaries, duplication, migration, regression checks |
| Coordination           | work-item, handoff, milestone, execution status                             | local continuity workflow                                                | owner, blocker, dependency, decision, durable handoff             |
| Release and operations | changelog, release plan, runbook, deployment checklist                      | `$changelog`, relevant release or pipeline skill                         | compatibility, sequencing, rollback, monitoring, recovery         |
| Learning and knowledge | README, durable guide, postmortem, repository overview                      | `$documentation`, `$postmortem`, `$engineering-playbook`                 | evidence, audience, navigation, reusable learning, obsolescence   |
| Governance and support | policy, repository governance, service workflow, audit record               | relevant governance or service skill                                     | authorization, traceability, retention, SLA, escalation           |

Do not load every owner in this table. The routing budgets below are limits, not targets.

## Stages

Use the narrowest stage supported by evidence:

1. `discovery` — understand the problem, actors, context, and desired outcome.
2. `definition` — establish PRD scope, business rules, acceptance criteria, exclusions, and metrics.
3. `design` — compare user, interaction, data, and solution shapes before committing to one.
4. `decision` — record an ADR-worthy choice, its drivers, alternatives, and consequences.
5. `planning` — sequence implementation, tests, migrations, rollout, rollback, and evidence.
6. `implementation` — build the approved scope while preserving contracts.
7. `verification` — prove behavior, quality, compatibility, and acceptance.
8. `operation` — observe, support, recover, and evolve a running capability.
9. `learning` — consolidate evidence, decisions, incidents, and reusable guidance.

A suggestion may recommend a stage transition, but it must not pretend that the next stage is
already authorized.

## Functional Families

Functional families are multi-label classifiers, not fixed feature checklists. Generate only
opportunities supported by the actors, data, workflow, scale, and stage in evidence.

| Family                           | Opportunity clusters to consider                                                                                                                                                            |
|----------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Collection and discovery         | search semantics, filters and facets, sorting, pagination or infinite loading, column selection, saved views, bulk actions, export, selection persistence, empty/loading/error/stale states |
| Detail and history               | related entities, status timeline, contextual actions, documents, comments, audit history, deep links, print/share boundaries, previous/next navigation                                     |
| CRUD and forms                   | field validation, defaults, autocomplete, drafts, autosave, dirty-state protection, duplication, batch entry, confirmation, conflict handling, permission-sensitive fields                  |
| Workflow and case management     | state model, assignment, approval, rejection, cancellation, reopen, SLA, escalation, notifications, reprocessing, idempotency, transition history                                           |
| Transaction and commerce         | totals, taxes, discounts, inventory, payment states, retry, cancellation, refund, receipts, reconciliation, fraud signals, privacy boundaries                                               |
| Analytics and reporting          | period selection, segmentation, comparison, metric definitions, freshness, drill-down, annotations, targets, export, scheduled delivery                                                     |
| Scheduling and time              | time zone, recurrence, capacity, conflicts, reminders, reschedule, cancellation, waitlists, business calendars, daylight-saving behavior                                                    |
| Communication and collaboration  | channels, recipients, threading, mentions, templates, preferences, digest frequency, read state, mute, retry, moderation, delivery evidence                                                 |
| Identity and access              | invitation, authentication, recovery, role and scope, delegation, session lifecycle, audit, segregation of duties, privileged actions                                                       |
| Content, files, and media        | upload progress, preview, metadata, search, versioning, validation, retention, virus scanning, download policy, accessibility alternatives                                                  |
| Integration and synchronization  | mapping, preview, dry-run, validation, partial processing, error report, retry, reconciliation, rate limits, webhook idempotency, schema evolution                                          |
| Administration and configuration | defaults, validation, inheritance, feature flags, change history, import/export, environment scope, safe rollback                                                                           |
| Mobile and offline               | responsive hierarchy, touch targets, camera or scanner, low bandwidth, offline queue, resynchronization, conflict resolution, interrupted sessions                                          |
| Support and operations           | correlation IDs, diagnostics, status visibility, audit trail, recovery, replay, operator controls, support handoff, service degradation                                                     |

Modifiers refine these families. Common modifiers include multi-tenant, regulated, high-volume,
real-time, batch, public, internal, mobile-first, offline, legacy, international, and
security-sensitive.

## Transversal Lenses

Use lenses to find cross-cutting concerns that functional-family suggestions alone miss.

| Lens                          | Questions                                                                                                                     |
|-------------------------------|-------------------------------------------------------------------------------------------------------------------------------|
| UX and states                 | Are loading, empty, partial, stale, error, success, destructive, and recovery states explicit?                                |
| Accessibility                 | Is the flow operable by keyboard and assistive technology, with focus, names, contrast, and status feedback?                  |
| Responsiveness                | Does the information hierarchy survive narrow screens, zoom, touch, and dense data?                                           |
| Security and privacy          | What can be abused, exposed, injected, uploaded, enumerated, retained, or inferred?                                           |
| Permissions and audit         | Who may see or perform each action, and what evidence of change is required?                                                  |
| Integrity and consistency     | What prevents duplicates, invalid transitions, stale writes, partial updates, and conflicting sources?                        |
| Performance and scale         | What are the volume, latency, query, rendering, memory, concurrency, and rate-limit boundaries?                               |
| Reliability and recovery      | What happens on timeout, retry, duplicate delivery, dependency failure, partial success, and replay?                          |
| Observability and support     | Which logs, metrics, traces, correlation data, alerts, diagnostics, and runbooks make failure operable?                       |
| Compatibility and integration | Which consumers, schemas, APIs, migrations, versions, and fallback paths can break?                                           |
| Internationalization and time | Are locale, language, currency, number, time zone, calendar, and daylight-saving rules explicit?                              |
| Testing and delivery          | Which behavior partitions, negative cases, environments, rollout gates, rollback checks, and acceptance evidence are missing? |

## Candidate Generation

Perform the following pass:

1. Inventory explicit goals, exclusions, decisions, constraints, changed artifacts, validation
   evidence, unresolved questions, and previously declined suggestions.

2. Classify the active artifact, stage, functional families, modifiers, and applicable lenses.

3. Generate a small candidate pool from four origins:
    - artifact gap — missing information needed for the artifact to fulfill its contract
    - functional opportunity — adjacent capability that improves the requested user outcome
    - transversal risk — cross-cutting concern exposed by a lens
    - stage transition — the smallest useful move to the next lifecycle stage

4. State each non-required candidate as a question or option. Do not phrase it as an accepted
   requirement, defect, or committed scope.

5. Apply the hard gates, priority class, and score below.

6. Remove near-duplicates and diversify the result across origins or lenses when a lower-ranked
   candidate adds materially different value.

7. Return only the number allowed by the active mode.

## Hard Gates

Suppress a candidate when any condition below is true:

- the artifact, implementation, or accepted decision already covers it

- the user explicitly excluded, declined, or deferred it

- it duplicates another higher-value candidate

- it relies on an unsignaled assumption about users, data, volume, regulation, or architecture

- it turns a preference, common pattern, or tool convention into a requirement

- it is generic advice without a concrete anchor in the current context

- it would require an external, destructive, production, security-sensitive, or irreversible
  mutation that the user has not separately authorized

- it expands an ADR or implementation plan with product scope that belongs back in the PRD

- it labels an optional enhancement as a defect during implementation, verification, or review

- it is routine delivery residue such as commit, push, publication, or catalog-to-runtime
  synchronization of a skill or automation, unless delivery is the explicit requested outcome or
  blocks a proven functional acceptance criterion

When evidence is insufficient but the question is valuable, suggest clarifying the missing fact
instead of suggesting the feature itself.

## Priority and Scoring

Classify before scoring:

- `P0` — blocking correctness, safety, compliance, data integrity, or artifact admissibility gap
  proven by current evidence

- `P1` — high-value, high-risk-reduction, or strongly unblocking recommendation

- `P2` — useful optional improvement with bounded cost and clear benefit

- `P3` — speculative, weakly evidenced, broad, or better deferred candidate

Score surviving candidates with dimensions from `0` to `3`:

```text
score =
  2 × evidence
  + 2 × user_value
  + risk_reduction
  + stage_fit
  + unblock_power
  - effort
  - scope_expansion
  - uncertainty
```

Priority class dominates score. Use the score only to order candidates within a class and to make
trade-offs explicit; it cannot turn an unsupported candidate into a requirement.

For automatic output, require `evidence >= 2` and `score >= 8`. Explicit modes may surface a lower
score only when they label the uncertainty and ask a bounded clarification question.

## Modes

### Automatic

Run a silent pass after materially creating or reviewing a PRD, ADR, or non-trivial implementation
plan. Also run it after other material work when execution exposes a concrete opportunity.

- emit `0–3` suggestions, usually one
- use the automatic threshold and omit the section when no candidate passes
- do not load a new skill solely to generate suggestions
- keep accepted scope, exclusions, and current stage authoritative

### `!suggest`

Return exactly one highest-priority grounded recommendation:

- name the origin, anchor, benefit, and optionality

- explain the smallest user decision or next action

- do not implement, edit artifacts, or mutate state

- if no candidate survives, say that no grounded improvement is available and name the missing
  evidence rather than manufacturing one

### `!suggest explore`

Treat `explore` as a modifier of `!suggest`, not as a separate shortcut:

- generate up to 12 surviving candidates across artifact, functional, transversal, and stage origins
- return a ranked shortlist of at most 3, followed by the remaining candidate map grouped compactly
- expose relevant assumptions, trade-offs, and deferred questions
- remain non-mutating; exploration does not approve scope or implementation

### `!next-prompt`

Return exactly one sanitized, copyable prompt for the smallest evidence-backed next action:

- apply the same hard gates and outcome-first filter used for suggestions

- preserve the action's normal authorization boundary; the returned prompt must ask for planning or
  explicit confirmation whenever execution would otherwise be ambiguous or state-changing

- do not execute, authorize, or expand scope through the shortcut

- if no result-oriented item survives, state `Nenhuma pendência funcional ou contextual.`

### `!next-prompt ultra`

Treat `ultra` as a modifier of `!next-prompt`, not as execution authorization or a model-setting
command:

- use an explicit objective after the modifier or the single unambiguous evidence-backed next action
  from the current context

- recommend `gpt-5.6-sol` in `Ultra` mode when available, while stating that the shortcut does not
  change the model, mode, or reasoning effort or activate agents

- return the recommendation and exactly one fenced `text` block with a standalone prompt

- include `Objetivo`, `Resultado esperado`, `Escopo autorizado`, `Restrições`, `Método`, `Validação
  obrigatória`, and `Conclusão`

- prefer level-two Markdown headings (`##`) for those seven sections; treat this as presentation
  guidance, not a validity gate; equivalent plain section labels remain semantically valid

- use enough detail for the resolved task without a fixed length limit

- express strategy, decision criteria, and required evidence in `Método` rather than prescribing
  tools, sequence, or iteration counts unless a binding contract or explicit operator instruction
  requires them; preserve Ultra's freedom to adapt execution as new evidence appears

- do not manufacture operations or authorizations to make the prompt appear complete

- direct autonomous local work without requesting intermediate operator decisions when evidence can
  resolve them safely

- let the active Ultra and repository orchestration contracts decide whether delegation adds value;
  the shortcut does not authorize it

- preserve confirmation boundaries for production, external-system, destructive, or irreversible
  actions and stop on a real blocker

- if no single target can be resolved, state the missing objective instead of merging candidates or
  manufacturing scope

## Selective Skill Routing

Reuse an already loaded owner before loading another skill. Route only when the candidate quality
materially depends on a specialized contract:

| Mode               | Routing budget                                                              |
|--------------------|-----------------------------------------------------------------------------|
| Automatic          | no new skill solely for suggestions                                         |
| `!suggest`         | active artifact owner plus at most one specialized lens                     |
| `!suggest explore` | active artifact owner plus at most three non-overlapping specialized lenses |

Examples of selective lenses include `$frontend-design` for UI interaction, `$security-review` for a
clear sensitive flow, `$responsiveness` for a cross-viewport concern, `$database-operator` for an
evidenced data-operation constraint, and `$code-review` for an implementation defect question.

Never activate custom agents, League, Council, Agents of Shield, or Fellowship automatically for
suggestion generation. They require their own explicit activation and must not be used merely to
fill the routing budget.

## Stage Policy

- In PRDs, feature opportunities may be proposed as scope questions. Separate required, recommended,
  optional, and deferred items; add them to accepted scope only after the user agrees.

- In solution design, compare user and technical shapes without silently making the ADR decision.

- In ADRs, focus on drivers, alternatives, consequences, reversibility, migration, and follow-up
  decisions. Do not expand product functionality.

- In implementation plans, focus on dependencies, sequencing, tests, rollout, rollback,
  observability, and compatibility. Route adjacent product capabilities back to the PRD or a
  deferred backlog.

- During implementation and verification, preserve approved scope. Report a proven requirement gap
  as a defect; report an adjacent capability as an optional follow-up.

- During review, do not retroactively invent requirements. Evidence from code quality, security,
  compatibility, and accepted contracts may justify findings; common practice alone may not.

- In operation and learning, prefer evidence-backed recovery, observability, support, and reusable
  knowledge suggestions over speculative redesign.

## Output Contract

Automatic suggestions normally use:

```text
Melhorias sugeridas:
- [P1 | oportunidade funcional] Busca e paginação — reduzem o custo de localizar pedidos quando o volume crescer; confirmar volume esperado e campos pesquisáveis antes de incluir no PRD.
```

For `!suggest`, return one recommendation with its priority, origin, evidence anchor, benefit, and
next decision. For `!suggest explore`, show the ranked top three first, then the rest of the
candidate map without implying acceptance.

Routine delivery residue is not a suggestion candidate. When another outcome-oriented shortcut needs
to preserve it, place it after all result findings under `Nota de entrega`; it must never be the
only next action. If no result-oriented item remains, use `Nenhuma pendência funcional ou
contextual.` before the optional note.

Keep suggestions concise enough to support a decision. Load
`.agents/examples/suggestion-modes.example.md` only when concrete mode calibration is useful.
