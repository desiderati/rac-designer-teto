# Custom Agent Roles

Use this reference when the repository has `.codex/agents/*.toml` installed from `agents-bootstrap`
or a compatible skill installer and the task could benefit from a specialized Codex subagent.

Custom agents are inert until Codex is explicitly asked to spawn subagents. They are role contracts,
not automatic workflow triggers.

`agents-examples`, `agents-shortcuts`, and `agents-usage` are read-only help entrypoints. They
explain the local agent pack and must not be treated as delegation targets.

`league-of-agents` is an orchestration entrypoint for:

- `league of agents`
- direct `@League of Agents` invocation

It loads the local League of Agents contract and must not be used as a downstream specialist
delegate.

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

It loads the fixed Agents of Shield prompt plus the shared `security-advisor` profile catalog.
It must not be used as a downstream specialist delegate.

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
| `council-of-agents`        | Council triggers: `council this`, `pressure test this`, `stress test this`, `war room this`, `premortem this`, `debate this`, `council of agents`, or `@Council of Agents` | `.agents/prompts/council-of-agents.prompt.md`, `.agents/references/agents-usage.md`, `.agents/references/agents-roles.md`                        | chairman orchestration, `.agents/council-sessions/` reports and transcripts; no specialist ownership                                             |
| `agents-of-shield`         | `agents of shield` or direct `@Agents of Shield` fixed five-profile security council                                                                                       | `.agents/prompts/agents-of-shield.prompt.md`, `.agents/references/security-advisor-profiles.md`, `.agents/references/agents-roles.md`            | diagnostic security advisory output only; no code fixes, credential changes, or external mutations                                               |
| `fellowship-of-architects` | `fellowship of architects` or direct `@Fellowship of Architects` fixed five-profile architecture council                                                                   | `.agents/prompts/fellowship-of-architects.prompt.md`, `.agents/references/solutions-architect-profiles.md`, `.agents/references/agents-roles.md` | architecture advisory output only; no implementation unless a separate bounded handoff is accepted                                               |
| `league-of-agents`         | `league of agents` or direct `@League of Agents` team-mode orchestration entrypoint                                                                                        | `.agents/prompts/league-of-agents.prompt.md`, `.agents/references/agents-usage.md`, `.agents/references/agents-roles.md`                         | orchestration only; no specialist ownership                                                                                                      |
| `code-reviewer`            | Code review, repository-wide architecture-quality audits, performance/scalability audits, regression risk, missing tests, review reports                                   | `$code-review`                                                                                                                                   | `.agents/code-reviews/` and work-item sidecars only                                                                                              |
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

- Do not delegate to `agents-examples`, `agents-shortcuts`, or `agents-usage`; they are help
  shortcuts and must remain read-only.

- Keep the parent agent responsible for orchestration, scope control, consolidation, and final
  user-facing judgment.

- Do not assign overlapping write scopes to multiple agents.

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
  sensitive flows, then delegate fixes to `software-developer` only after findings are consolidated.

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
