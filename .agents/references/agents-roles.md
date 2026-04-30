# Custom Agent Roles

Use this reference when the repository has `.codex/agents/*.toml` installed
from `agents-bootstrap` and the task could benefit from a specialized Codex
subagent.

Custom agents are inert until Codex is explicitly asked to spawn subagents.
They are role contracts, not automatic workflow triggers.

`agents-examples` and `agents-usage` are read-only help entrypoints. They
explain the local agent pack and must not be treated as delegation targets.

`league-of-agents` is an orchestration entrypoint for the `@League of Agents`
shortcut. It loads the local League of Agents contract and must not be used as
a downstream specialist delegate.

## Routing Matrix

| Agent                    | Use for                                                                   | Primary prompts or skills                                                                                                                 | Write boundary                                                                                                                                   |
|--------------------------|---------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------|
| `agents-examples`        | Direct `@Agents Examples` helper for copyable local custom-agent examples | `.agents/references/agents-examples.md`                                                                                                   | none                                                                                                                                             |
| `agents-usage`           | Direct `@Agents Usage` helper for local custom-agent orchestration policy | `.agents/references/agents-usage.md`, `.agents/references/agents-roles.md`                                                                | none                                                                                                                                             |
| `league-of-agents`       | Direct `@League of Agents` team-mode orchestration entrypoint             | `.agents/prompts/league-of-agents.prompt.md`, `.agents/references/agents-usage.md`, `.agents/references/agents-roles.md`                  | orchestration only; no specialist ownership                                                                                                      |
| `code-reviewer`          | Code review, regression risk, missing tests, review reports               | `$code-review`                                                                                                                            | `.agents/code-reviews/` and work-item sidecars only                                                                                              |
| `ui-reviewer`            | UI review, visual QA, accessibility-oriented interface critique           | `$frontend-design`, `$frontend-development`                                                                                               | `.agents/code-reviews/` and work-item sidecars only                                                                                              |
| `code-explorer`          | Codebase exploration, execution tracing, architecture overview inputs     | `$documentation`                                                                                                                          | chat by default; work-item sidecar only when explicitly delegated                                                                                |
| `documentation-reviewer` | Read-only documentation review                                            | `$documentation`                                                                                                                          | none                                                                                                                                             |
| `documentation-curator`  | Bounded documentation curation, consolidation, and repair                 | `$documentation`                                                                                                                          | documentation files explicitly in scope                                                                                                          |
| `support-analyst`        | Bug analysis, incident analysis, support diagnostics                      | `.agents/prompts/bug-analysis.prompt.md`, `$incident-analysis`                                                                            | `.agents/bug-analysis/`, `.agents/incidents/`, work-item sidecars                                                                                |
| `solutions-architect`    | Architecture decisions, solution design, refactoring strategy             | `.agents/prompts/architecture-decision.prompt.md`, `.agents/prompts/solution-design.prompt.md`, `$refactoring`, `$refactoring-heuristics` | architecture, solution-design, ADR, and refactoring-planning documentation                                                                       |
| `product-owner`          | PRD, product requirements, acceptance criteria, scope decisions           | `$prd-generator`                                                                                                                          | PRDs, product docs, acceptance criteria, work-item sidecars                                                                                      |
| `software-developer`     | Bounded implementation work                                               | `.agents/prompts/implementation-planning.prompt.md`                                                                                       | code, tests, and docs only inside the delegated task scope                                                                                       |
| `quality-analyst`        | Test strategy, test specifications, quality review, validation planning   | `.agents/prompts/test-driven.prompt.md`, `.agents/prompts/verification.prompt.md`                                                         | quality artifacts and bounded test changes                                                                                                       |
| `security-advisor`       | Security triage, contextual security review, risk advisory                | `$security-scan`, `$security-review`, `.agents/templates/security-analysis.template.md`                                                   | `.agents/security-analysis/`, `.agents/security-scans/`, `.agents/security-reviews/`, and sanitized `docs/security/SEC-00N-*` only when promoted |

## Operating Rules

- Use subagents only when decomposition creates clear value in focus, speed,
  parallelism, separation of concerns, or context hygiene.
- Do not delegate from the League of Agents workflow to `league-of-agents`
  itself; delegate only to the smallest useful set of specialist roles.
- Do not delegate to `agents-examples` or `agents-usage`; they are help
  shortcuts and must remain read-only.
- Keep the parent agent responsible for orchestration, scope control,
  consolidation, and final user-facing judgment.
- Do not assign overlapping write scopes to multiple agents.
- Prefer read-only agents for critique and workspace-write agents only when
  the role must produce artifacts.
- Workspace-write agents must not infer permission to edit outside their role
  boundary.
- If a role needs a prompt, mention the prompt file explicitly in the
  delegation request.
- If a role needs a skill, mention the skill name explicitly in the delegation
  request.
- `code-explorer` does not own `REPOSITORY-OVERVIEW.md`; it produces
  technical exploration inputs and recommends `documentation-curator` handoff for
  durable documentation.
- `security-advisor` does not fix code. It produces evidence-backed findings,
  recommends follow-up, and revalidates remediation when requested.
- Security findings are persisted as sanitized historical records under
  `.agents/security-analysis/`, `.agents/security-scans/`, or
  `.agents/security-reviews/`. Durable promotion uses sanitized
  `docs/security/SEC-00N-{slug}.md`.

## Practical Delegation Examples

- Ask `solutions-architect` to compare two designs using
  `.agents/prompts/solution-design.prompt.md`, then ask `software-developer` to
  implement only the chosen contract.
- Ask `product-owner` to draft acceptance criteria with `$prd-generator`, then
  ask `quality-analyst` to turn those criteria into test specifications.
- Ask `support-analyst` to isolate the likely root cause with
  `.agents/prompts/bug-analysis.prompt.md`, then ask `software-developer` to
  implement the smallest fix and `code-reviewer` to review the result.
- Ask `documentation-reviewer` to find README drift, then ask `documentation-curator`
  to repair only the approved documentation findings.
- Ask `code-explorer` to map entry points, execution flow, dependencies, and
  reusable patterns before asking `solutions-architect` to design a change.
- Ask `security-advisor` to run `$security-scan` for broad triage and
  `$security-review` for sensitive flows, then delegate fixes to
  `software-developer` only after findings are consolidated.
- Ask `ui-reviewer` to review a screen or flow with `$frontend-design` after a
  frontend implementation is available, then ask `software-developer` to address
  only approved findings.

## Consolidation Rule

Every delegated agent should return a compact result with:

- files inspected or changed
- evidence used
- decisions made
- open questions
- validation performed
- residual risks

The parent agent must reconcile contradictions before presenting conclusions or
continuing downstream work.
