# Custom Agent Roles

Use this reference when the repository has `.codex/agents/*.toml` installed from `agents-bootstrap`
or a compatible skill installer and the task could benefit from a specialized Codex subagent.

Custom agents are inert until an explicit agent/team request or an installed router selects a
diagnostic delegation mode. They are role contracts, not general automatic workflow triggers. The
base-pack exception is `.agents/references/code-review-routing.md`, which may select `code-reviewer`
only under its selective, shadowed, non-mutating contract.

Compatible skill installers may add role packs under `.codex/agents/` and matching contracts under
`.agents/references/agents-overlays/`. When such files exist, read the relevant overlay before
routing or delegating to those roles. Overlay content remains owned by its installing skill and must
not be inlined into or inferred from this base reference.

`agents-examples`, `agents-shortcuts`, `agents-usage`, and `models-usage` are read-only help
entrypoints. They explain the local agent pack or model selection and must not be treated as
delegation targets.

`league-of-agents` is an orchestration entrypoint for:

- `league of agents`
- direct `@League of Agents` invocation
- `!auto-review`

It loads the local League of Agents contract and must not be used as a downstream specialist
delegate. League remains non-looping unless the same request also invokes `!loop`; `!auto-review` is
the preset expansion of League + `!loop` + `$code-review`.

`brainstorm` is a solution-cycle orchestration entrypoint for an unclear idea, requirement, or solution:

- direct `@Brainstorm` invocation

It loads the local Brainstorm prompt and reference, maintains the solution state and handoff
correlation, and first routes only to `product-owner` or `solutions-architect`. A clear incident is
reclassified to `support-analyst`; clear maintenance or refactoring in unknown code is reclassified
to `code-explorer`. Those reclassifications do not authorize Brainstorm to investigate or to create
a handoff to either specialist. Invocation authorizes discovery and
orchestration only. It must not be used as a downstream specialist or treated as authorization to
write artifacts, implement, perform Git actions, deploy, or mutate external state.

`council-of-agents` is a decision-council entrypoint for:

- `council this`
- `pressure test this`
- `stress test this`
- `war room this`
- `premortem this`
- `debate this`
- `council of agents`
- direct `@Council of Agents` invocation

It loads the local Council of Agents contract and must not be used as a downstream specialist
delegate.

`agents-of-shield` is a security-council entrypoint for:

- `agents of shield`
- direct `@Agents of Shield` invocation

It loads the fixed Agents of Shield prompt plus the shared `security-advisor` profile catalog. It
must not be used as a downstream specialist delegate. Agents of Shield remains non-looping unless
the same request also invokes `!loop`; this composition does not require League and does not change
the council's diagnostic-only write boundary.

`fellowship-of-architects` is an architecture-council entrypoint for:

- `fellowship of architects`
- direct `@Fellowship of Architects` invocation

It loads the fixed Fellowship of Architects prompt plus the shared `solutions-architect` profile
catalog. It must not be used as a downstream specialist delegate.

## Routing Matrix

| Agent                      | Use for                                                                                                                                                                    | Primary prompts or skills                                                                                                                        | Write boundary                                                                                                                                   |
|----------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------|
| `agents-examples`          | Direct `@Agents Examples` helper for copyable local custom-agent examples                                                                                                  | `.agents/references/agents-examples.md`                                                                                                          | none                                                                                                                                             |
| `agents-shortcuts`         | Direct `@Agents Shortcuts` helper for compact `!` chat control shortcuts                                                                                                   | `.agents/references/agents-shortcuts.md`                                                                                                         | none                                                                                                                                             |
| `agents-usage`             | Direct `@Agents Usage` helper for local custom-agent orchestration policy                                                                                                  | `.agents/references/agents-usage.md`, `.agents/references/agents-roles.md`                                                                       | none                                                                                                                                             |
| `models-usage`             | Direct `@Models Usage` helper for GPT-6 examples-by-effort tables, Ultra guidance, or one contextual model-and-effort recommendation                                     | `.agents/references/models-usage.md`                                                                                                             | none                                                                                                                                             |
| `brainstorm`               | Direct `@Brainstorm` framing for unclear idea, requirement, or solution; next owner is Product Owner or Solutions Architect                                                | `.agents/prompts/brainstorm.prompt.md`, `.agents/references/brainstorm.md`                                                                       | orchestration and authorized continuity only; reclassify clear specialized cases without investigating them                                      |
| `council-of-agents`        | Council triggers: `council this`, `pressure test this`, `stress test this`, `war room this`, `premortem this`, `debate this`, `council of agents`, or `@Council of Agents` | `.agents/prompts/council-of-agents.prompt.md`, `.agents/references/agents-usage.md`, `.agents/references/agents-roles.md`                        | chairman orchestration, `.agents/council-sessions/` reports and transcripts; no specialist ownership                                             |
| `agents-of-shield`         | `agents of shield` or direct `@Agents of Shield` fixed five-profile security council                                                                                       | `.agents/prompts/agents-of-shield.prompt.md`, `.agents/references/security-advisor-profiles.md`, `.agents/references/agents-roles.md`            | diagnostic security advisory output only; no code fixes, credential changes, or external mutations                                               |
| `fellowship-of-architects` | `fellowship of architects` or direct `@Fellowship of Architects` fixed five-profile architecture council                                                                   | `.agents/prompts/fellowship-of-architects.prompt.md`, `.agents/references/solutions-architect-profiles.md`, `.agents/references/agents-roles.md` | architecture advisory output only; no implementation unless a separate bounded handoff is accepted                                               |
| `league-of-agents`         | `league of agents`, direct `@League of Agents`, or `!auto-review` team-mode orchestration entrypoint                                                                       | `.agents/prompts/league-of-agents.prompt.md`, `.agents/references/agents-usage.md`, `.agents/references/agents-roles.md`                         | orchestration only; no specialist ownership                                                                                                      |
| `code-reviewer`            | Code review, repository-wide architecture-quality audits, performance/scalability audits, regression risk, missing tests, review reports                                   | `$code-review`, `.agents/references/code-review-routing.md`                                                                                      | `.agents/code-reviews/` and work-item sidecars only                                                                                              |
| `ui-designer`              | Pre-implementation UI direction, `DESIGN.md` stewardship, design contracts                                                                                                 | `$frontend-design`; optional `$ui-ux-pro-max` inputs                                                                                             | `DESIGN.md`, design docs, design-decision docs, and work-item sidecars only                                                                      |
| `ui-reviewer`              | UI review, visual QA, accessibility-oriented interface critique                                                                                                            | `$frontend-design`, `$frontend-development`; recommend `ui-impeccable-specialist` when available and appropriate                                 | `.agents/code-reviews/` and work-item sidecars only                                                                                              |
| `ui-impeccable-specialist` | Optional Impeccable shape, craft, polish, audit, extract, and asset production                                                                                             | `$impeccable`; installed by `$impeccable-installer` when that ecosystem is active                                                                | delegated UI code, assets, tests, or review artifacts required by the selected Impeccable command                                                |
| `code-explorer`            | Codebase exploration, execution tracing, architecture overview inputs                                                                                                      | `$documentation`                                                                                                                                 | chat by default; work-item sidecar only when explicitly delegated                                                                                |
| `documentation-reviewer`   | Read-only documentation review                                                                                                                                             | `$documentation`                                                                                                                                 | none                                                                                                                                             |
| `documentation-curator`    | Bounded documentation curation, consolidation, and repair                                                                                                                  | `$documentation`                                                                                                                                 | documentation files explicitly in scope                                                                                                          |
| `support-analyst`          | Bug analysis, critical debugging, incident analysis, support diagnostics                                                                                                   | `.agents/prompts/bug-analysis.prompt.md`, `$incident-analysis`                                                                                   | `.agents/bug-analysis/`, `.agents/incidents/`, work-item sidecars                                                                                |
| `solutions-architect`      | Architecture decisions, solution design, clean architecture refactoring strategy                                                                                           | `.agents/prompts/architecture-decision.prompt.md`, `.agents/prompts/solution-design.prompt.md`, `$refactoring`, `$refactoring-heuristics`        | architecture, solution-design, ADR, and refactoring-planning documentation                                                                       |
| `product-owner`            | PRD, product requirements, acceptance criteria, scope decisions                                                                                                            | `$prd-generation`                                                                                                                                | PRDs, product docs, acceptance criteria, work-item sidecars                                                                                      |
| `software-developer`       | Bounded implementation work                                                                                                                                                | `.agents/prompts/implementation-planning.prompt.md`                                                                                              | code, tests, and docs only inside the delegated task scope                                                                                       |
| `quality-analyst`          | Test strategy, test specifications, quality review, validation planning                                                                                                    | `.agents/prompts/test-driven.prompt.md`, `.agents/prompts/verification.prompt.md`                                                                | quality artifacts and bounded test changes                                                                                                       |
| `security-advisor`         | Security triage, contextual security review, risk advisory                                                                                                                 | `$security-scan`, `$security-review`, `.agents/templates/security-analysis.template.md`                                                          | `.agents/security-analysis/`, `.agents/security-scans/`, `.agents/security-reviews/`, and sanitized `docs/security/SEC-00N-*` only when promoted |

## Operating Rules

### Execution efficiency

Use only context needed for the current deliverable; do not reread unchanged, available sources or
duplicate delegated work. Batch compatible checks with bounded output. Reuse validated evidence
only while its scope, code, dependencies, configuration, environment or freshness requirements
remain valid. Record scope, revision or content hash, command, result and evidence in existing
continuity when needed; explain an invalidation before repeating a check. Missing or conflicting
evidence requires verification. Mandatory gates and fresh-session requirements still prevail.
This is an execution policy, not a token quota or an automatic hook; do not add optional
investigations, change models, or weaken safety to reduce cost.

### Delegation and review

- Use subagents only when decomposition creates clear value in focus, speed, parallelism, separation
  of concerns, or context hygiene.

- Do not delegate from the Council of Agents workflow to `council-of-agents` itself; the parent
  agent acts as Chairman and uses advisor/reviewer subagents only when the runtime supports the full
  council protocol.

- Do not delegate from Agents of Shield or Fellowship of Architects to `agents-of-shield` or
  `fellowship-of-architects` themselves; the parent agent acts as Chairman and applies the fixed
  profile set from the corresponding prompt.

- Do not delegate from the League of Agents workflow to `league-of-agents` itself; delegate only to
  the smallest useful set of specialist roles.

- Do not delegate from the Brainstorm workflow to `brainstorm` or to the three
  council aggregators. The controlling agent retains ownership and acts as Chairman only after the
  operator authorizes the applicable protocol.

- Do not delegate to `agents-examples`, `agents-shortcuts`, `agents-usage`, or `models-usage`; they
  are help shortcuts and must remain read-only.

- Keep the parent agent responsible for orchestration, scope control, consolidation, and final
  user-facing judgment.

- For code-review intent, resolve the local/agent mode through
  `.agents/references/code-review-routing.md`. Keep chat-first as the default; explicit `!review
  agent` or `@code-reviewer` may request an independent pass.

- Do not assign overlapping write scopes to multiple agents.

- Use minimal-context handoffs: objective, revision, owned files, applicable contracts, acceptance
  criteria, exclusions and existing evidence. Prefer `fork_turns=none` when supported;
  full-history inheritance requires a concrete dependency on that history. Include required
  instructions and material decisions; never omit safety context to shorten the handoff.

- The parent must use delegated evidence instead of repeating the same inspection unless a gap,
  conflict or changed dependency invalidates it. Each handoff must identify work already completed
  and the remaining question; do not create parallel reviews of the same scope by default.

- When independent review is required, use one independent review per stabilized delta, then
  `closure-delta` for corrections and affected regression surfaces. Do not duplicate an unchanged
  accepted review. Broaden only for a concrete coverage gap, invalidated evidence or explicit
  requirement; preserve mandated security reviews, fresh test tasks and fixed council protocols.

- Prefer read-only agents for critique and workspace-write agents only when the role must produce
  artifacts.

- Review agents must complete one full pass over their delegated scope before returning. They must
  aggregate all material findings discovered in that pass and name uninspected surfaces instead of
  returning incremental batches.

- Workspace-write agents must not infer permission to edit outside their role boundary.

- If a role needs a prompt, mention the prompt file explicitly in the delegation request.

- If a role needs a skill, mention the skill name explicitly in the delegation request.

- `code-explorer` does not own `REPOSITORY-OVERVIEW.md`; it produces technical exploration inputs
  and recommends `documentation-curator` handoff for durable documentation.

- `security-advisor` does not fix code. It produces evidence-backed findings, recommends follow-up,
  and revalidates remediation when requested.

- `ui-designer` owns durable design memory and should update `DESIGN.md` only when the task
  explicitly asks for design-system consolidation.

- `ui-reviewer` diagnoses the existing interface and may recommend `ui-impeccable-specialist` when
  the next step needs Impeccable craft, polish, audit, extract, or reusable asset production.

- `code-reviewer` owns diagnostic performance review for code paths. It should separate measured
  bottlenecks, plausible scale risks, and unverified assumptions before recommending implementation
  or refactoring.

- `code-reviewer` must keep severity separate from proof and correction eligibility. For each
  material finding, it returns classification, concrete evidence, relevant memory or contract
  consulted, and an eligibility recommendation; the League parent retains final adjudication.

- When a `software-developer` task originates from a finding, the handoff must identify a parent-
  adjudicated `fix`, expected behavior, evidence, scope, and validation. An incomplete finding
  handoff returns to the parent for investigation or deferral instead of being broadened by the
  developer. Ordinary feature work with an explicit task contract is unaffected.

- `solutions-architect` may compare clean architecture refactoring strategy options when multiple
  target structures or dependency directions are plausible. Execution still belongs to
  `$refactoring` or to a bounded implementation delegate after the parent agent fixes scope and
  behavior invariants.

- `ui-impeccable-specialist` is optional and skill-provided. Do not assume it is available unless
  `.codex/agents/ui-impeccable-specialist.toml` exists.

- Security findings are persisted as sanitized historical records under
  `.agents/security-analysis/`, `.agents/security-scans/`, or `.agents/security-reviews/`. Durable
  promotion uses sanitized `docs/security/SEC-00N-{slug}.md`.

## Practical Delegation Examples

- Ask `solutions-architect` to compare two designs using
  `.agents/prompts/solution-design.prompt.md`, then ask `software-developer` to implement only the
  chosen contract.

- Invoke `council-of-agents` to pressure-test a high-stakes decision using
  `.agents/prompts/council-of-agents.prompt.md`, then let the parent Chairman synthesize the final
  verdict before any implementation handoff.

- Ask `product-owner` to draft acceptance criteria with `$prd-generation`, then ask
  `quality-analyst` to turn those criteria into test specifications.

- Ask `support-analyst` to isolate the likely root cause with
  `.agents/prompts/bug-analysis.prompt.md`, including hidden edge cases for critical or
  production-like debugging, then ask `software-developer` to implement the smallest fix and
  `code-reviewer` to review the result.

- Ask `documentation-reviewer` to find README drift, then ask `documentation-curator` to repair only
  the approved documentation findings.

- Ask `code-explorer` to map entry points, execution flow, dependencies, and reusable patterns
  before asking `solutions-architect` to design a change.

- Ask `code-reviewer` to audit an unfamiliar or repository-wide scope only when a diagnostic pass is
  the goal; ask `code-explorer` first when mapping the system would materially reduce uncertainty
  before the review.

- Ask `code-reviewer` to diagnose performance or scalability bottlenecks with `$code-review`; add
  `ui-reviewer` or `$frontend-development` only when the bottleneck is specifically render, state,
  bundle, or UI memory behavior.

- Ask `solutions-architect` to compare clean architecture refactoring strategy options only when
  there are meaningful structural alternatives; execute with `$refactoring` inside the bounded
  front.

- Ask `security-advisor` to run `$security-scan` for broad triage and `$security-review` for
  sensitive flows, then delegate fixes to `software-developer` only after the parent adjudicates
  them as proven, eligible `fix` findings.

- Ask `security-advisor` to handle `production security audit` requests by starting with
  `$security-scan` when the scope is broad or unknown, switching to `$security-review` for auth,
  authorization, API, injection, upload, data access, webhook, payment, or sensitive-data flows, and
  keeping remediation as a separate implementation handoff.

- Ask `ui-designer` to define visual direction and update `DESIGN.md` before implementation when the
  local design system is missing or stale.

- Ask `ui-reviewer` to review a screen or flow with `$frontend-design` after a frontend
  implementation is available, then ask `software-developer` to address only approved findings. If
  the finding requires Impeccable-level craft or polish and the optional agent is installed,
  delegate that follow-up to `ui-impeccable-specialist`.

## Consolidation Rule

Every delegated agent should return a compact result with:

- files inspected or changed
- evidence used
- decisions made
- open questions
- validation performed
- residual risks

The parent agent must reconcile contradictions before presenting conclusions or continuing
downstream work.
