# Prompt Routing and Chaining

## Prompt fitness evaluation

Before invoking any prompt, determine whether it is the right tool for the task at hand.

### Decision rule

When in doubt about which prompt fits, prefer the lighter-weight option:

- a simple bug with a clear root cause does not need a full `bug-analysis` cycle — go straight to
  the fix and register it in the changelog

- an obvious approach does not need `solution-design` — go straight to `implementation-planning`

- a one-line fix does not need `test-driven` specifications — apply the fix and validate manually

- a single linear task does not need `subagent-execution`

- a trivial, self-evident change does not need `verification` — go straight to changelog when
  changelog is otherwise required

### Ambiguity rule

If the problem is semantically ambiguous — the objective is unclear, the requirements contradict
each other, or the scope cannot be defined without assumptions — do not proceed to `solution-design`
or any downstream prompt. Stop and clarify with the requester first.

Designing on top of ambiguity produces artifacts that look structured but encode guesses. The cost
of clarifying before designing is always lower than the cost of redesigning after implementation.

This is a workflow gate, not a prompt. The agent does not need a separate tool to ask a question.

### Legacy code considerations

Legacy code does not exempt a task from the workflow, but it changes what each prompt produces:

- `test-driven` adapts its strategy: characterization tests, boundary testing, or change-only
  testing replace classical test-first when the code has low testability. The prompt handles this
  internally — the agent does not need to skip `test-driven` for legacy code, but should expect a
  different output shape (testability assessment + adapted strategy instead of pure test-first
  specifications).

- `solution-design` may need to evaluate "refactor first vs. work within current structure" as one
  of the alternatives.

- `implementation-planning` should flag low-testability areas in the risk section.

The key principle: legacy code means adapted strategy, not skipped steps.

### How to decide

Each prompt contains `when_to_use` and `when_not_to_use` (or equivalent) sections that define its
activation criteria. These sections are the deciding authority — not the sequence diagram, not the
prompt map summary.

When the task does not clearly match any prompt's activation criteria:

1. Check whether the task is truly non-trivial. If it is trivial, skip the prompt layer entirely.

2. If non-trivial, identify which phase of the workflow the task belongs to (diagnose, design, plan,
   specify, execute, document, consolidate) and use the prompt for that phase.

3. If the task spans multiple phases, follow the standard sequence but skip phases that add no
   value.

Do not use a prompt just because it exists in the workflow. Every prompt invocation should produce
an artifact that the next step actually needs.

### Explicit phrase routing

To reduce ambiguity in natural-language requests, the agent may use the canonical phrase routing
below as a lightweight entrypoint into the prompt workflow.

This routing is a convenience layer, not the deciding authority.

### Precedence

1. If the user explicitly names a prompt file, use that prompt.

2. Otherwise, if the user uses one of the canonical phrases below, start from the mapped prompt.

3. If the request remains semantically ambiguous, stop and clarify before entering the prompt flow.

4. If the mapped prompt would skip a required upstream phase, run the upstream phase first.

5. If the actual task shape conflicts with the mapped phrase, follow the prompt activation criteria
   instead of the phrase.

Canonical phrases are preferred routing cues, not an exhaustive synonym list and not a substitute
for judgment.

### Canonical phrase routing

- Use `.agents/prompts/bug-analysis.prompt.md` as the starting prompt when the user says things like
  "investigar a causa raiz", "analisar o bug", "entender por que isso aconteceu", "debuggar uma
  falha crítica", "investigar um problema em produção", "não chute a causa", "explicar por que a
  falha acontece", or "avaliar edge cases". If the same request is also an operational incident,
  keep `$incident-analysis` responsible for the incident record and use `bug-analysis.prompt.md` for
  the technical defect diagnosis.

- Use `.agents/prompts/solution-design.prompt.md` as the starting prompt when the user says things
  like "comparar abordagens", "avaliar a melhor solução", or "desenhar a abordagem".

- Use `.agents/prompts/architecture-decision.prompt.md` as the starting prompt when the user says
  things like "criar um ADR", "registrar esta decisão arquitetural", "atualizar um ADR", or "por que
  escolhemos esta arquitetura?".

- Use `.agents/prompts/implementation-planning.prompt.md` as the starting prompt when the user says
  things like "preparar o plano mínimo de correção", "montar o plano de implementação", or "quero um
  plano técnico mínimo".

- Use `.agents/prompts/test-driven.prompt.md` as the starting prompt when the user says things like
  "definir os testes antes", "especificar os cenários de teste", or "quero o contrato de testes".

- Use `.agents/prompts/verification.prompt.md` as the starting prompt when the user says things like
  "verificar se a implementação bate com o objetivo", "fazer a verificação pós-implementação", or
  "conferir se o resultado ficou alinhado".

- Use `.agents/prompts/subagent-execution.prompt.md` as the starting prompt when the user says
  things like "quebrar em frentes paralelas", "decompor para subagentes", or "executar em paralelo".

- Use `.agents/prompts/league-of-agents.prompt.md` as the starting prompt when the user uses one of
  these League entries:
    - "league of agents"
    - direct invocation through `@League of Agents`

- Use `.agents/prompts/council-of-agents.prompt.md` as the starting prompt when the user uses one
  of these Council entries:
    - "council this"
    - "pressure test this"
    - "stress test this"
    - "war room this"
    - "premortem this"
    - "debate this"
    - "council of agents"
    - direct invocation through `@Council of Agents`

- Use `.agents/prompts/agents-of-shield.prompt.md` as the starting prompt when the user uses one
  of these security council entries:
    - "agents of shield"
    - direct invocation through `@Agents of Shield`

- Use `.agents/prompts/fellowship-of-architects.prompt.md` as the starting prompt when the user
  uses one of these architecture council entries:
    - "fellowship of architects"
    - direct invocation through `@Fellowship of Architects`

- Use `.agents/references/agents-usage.md` as the answer source, without spawning subagents, when
  the user says "Agents Usage" or invokes `@Agents Usage`.

- Use `.agents/references/agents-shortcuts.md` as the answer source, without spawning subagents,
  when the user says "Agents Shortcuts", "Agents Shortcut", invokes `@Agents Shortcuts`, or asks
  which `!` shortcuts are accepted.

- Use `.agents/references/agents-shortcuts.md` as the answer source, without executing shortcuts,
  when the user says `!help` alone or asks for help about accepted chat controls.

- When the user invokes an explicit skill together with `!help`, load that skill's `SKILL.md` and,
  when available, its `README.md`. Return operator-facing help for that skill. Do not execute the
  skill.

- Use `.agents/references/agents-examples.md` as the answer source, without spawning subagents, when
  the user says "Agents Examples", "Agents Example", `@Agents Examples`, or `@Agents Example`.

- Use `.agents/prompts/changelog.prompt.md` as the starting prompt when the user says things like
  "registrar no changelog", "compactar a sessão", or "deixar o registro factual".

- Use `.agents/prompts/readme.prompt.md` as the starting prompt when the user says things like
  "revisar impacto no README", "atualizar o README se necessário", or "checar se o README foi
  afetado".

- Use `.agents/prompts/knowledge-base.prompt.md` as the starting prompt when the user says things
  like "promover para conhecimento durável", "consolidar na base de conhecimento", or "atualizar a
  documentação canônica".

- Use `.agents/prompts/repository-overview.prompt.md` as the starting prompt when the user says
  things like "explicar o repositório para público não técnico", "atualizar o REPOSITORY-OVERVIEW",
  or "gerar visão funcional do repositório".

### Chat control shortcuts

The `!` shortcuts are compact conversation controls. Interpret them as scoped intent signals for the
current conversation, not as permission to skip safety checks or invent missing targets.

| Shortcut           | Meaning                                                                                                     |
|--------------------|-------------------------------------------------------------------------------------------------------------|
| `!again`           | Alias for `!retry`; retry only after explaining what failed and what will change.                           |
| `!authorized`      | Alias for `!confirm`; authorize the exact action most recently proposed by Codex.                           |
| `!bootstrap`       | Run the default safe `agents-bootstrap` bundle in the current repository.                                   |
| `!bootstrap-check` | Run the same default `agents-bootstrap` bundle with `--dry-run`.                                            |
| `!changelog`       | Record material work; use `changelog.prompt.md` when available.                                             |
| `!commit`          | Authorize creation of a local commit for the current scoped changes according to the repository convention. |
| `!confirm`         | Authorize the exact action most recently proposed by Codex in the current conversation.                     |
| `!continue`        | Accept the proposed approach and continue within the stated local scope.                                    |
| `!deploy`          | Authorize deployment to Production by default.                                                              |
| `!deploy dev`      | Authorize deployment to the DEV environment.                                                                |
| `!deploy hml`      | Authorize deployment to the HML environment.                                                                |
| `!deploy prod`     | Explicit equivalent of the default `!deploy`.                                                               |
| `!deploy qas`      | Authorize deployment to the QAS environment.                                                                |
| `!example`         | Provide one concrete, realistic example for Codex's proposal, suggestion, or approach without implementing. |
| `!explain`         | Briefly confirm whether the last instruction was understood and how Codex would proceed; not a plan.        |
| `!handoff`         | Prepare a continuity summary for later resumption.                                                          |
| `!help`            | Show human-facing help for the current context; with an explicit skill, explain operator usage read-only.   |
| `!hooks`           | Show configured project hooks and hooks visibly active in the current session without modifying them.       |
| `!loop`            | Route to `$autonomous-loop` for bounded iterative work with explicit target, budget, and stop criteria.     |
| `!next-steps`      | List next steps, risks, and the smallest useful action.                                                     |
| `!pause`           | Stop with current state, pending items, and the next action made explicit.                                  |
| `!pr`              | Prepare or create a pull request only when repository, branch, target, and readiness are unambiguous.       |
| `!retry`           | Retry the last failed or blocked action after explaining what failed and what will change.                  |
| `!review`          | Review in code-review posture; use local review workflow or `code-reviewer` when coordination helps.        |
| `!status`          | Summarize current state, progress, blockers, and pending items.                                             |
| `!suggest`         | Suggest one grounded improvement, next action, or workflow refinement without implementing it.              |
| `!summary`         | Summarize the conversation from the available transcript and any explicit compaction summary.               |
| `!test`            | Run local tests/checks; use `test-driven.prompt.md` only for pre-implementation test specification.         |
| `!time`            | Show elapsed session time using `codex-resolution-time` when available.                                     |
| `!usage`           | Use `$codex-usage` when available to report current-session tokens, models, and estimated cost by ID first. |
| `!verify`          | Run or describe verification; use `verification.prompt.md` when non-trivial or drift is plausible.          |

`!deploy` only applies to the concrete deploy candidate already identified in the current
conversation. If environment, target, release, branch, artifact, repository, expected action, or
production impact is ambiguous, stop and ask for clarification instead of deploying.

For `!verify`, `!review`, and `!changelog`, prefer installed prompts or custom agents when they
exist and their activation criteria match the task. For `!test`, direct test execution is the
default; route to `test-driven.prompt.md` only when the user is asking to define test behavior,
scenarios, or strategy before implementation.

For `!explain`, answer succinctly whether the user's last instruction is clear and how you would
approach the solution. Do not expand it into a full plan, and do not treat it as approval to execute
the solution.

For `!help`, provide concise human-facing help for the current context. If no skill, agent, or
workflow is explicitly referenced, summarize accepted shortcuts and help entrypoints. If a skill is
explicitly referenced, explain what the skill is for, when to use it, how an operator should ask for
the work in natural language, which inputs are needed, what Codex will check or do, and what
requires explicit authorization. Do not run scripts, probes, tools, external calls, installs, or
mutations.

For `!bootstrap-check`, run `agents-bootstrap` in the current repository with `--dry-run`,
`--with-rtk`, `--with-resolution-time`, `--with-self-improvement`, and `--with-graphify`. Do not
include `--with-graphify-hooks` or `--force`.

For `!bootstrap`, run the same default bundle without `--dry-run`, preserving existing files by
default. Do not add `--force`, do not add `--with-graphify-hooks`, and stop to clarify when the
target is outside the current repository or ambiguous. Because the bundle includes `--with-rtk`, it
may verify or install the RTK binary and initialize global Codex configuration under `~/.codex/`.

For `!usage`, use `$codex-usage` when available. Report the active conversation/session weight as
tokens, model data, and estimated cost when the local logs support it. Treat `costUSD` as an
estimate, not a bill. Prefer visible hook session IDs, then `session_index.jsonl` and JSONL
`payload.id` evidence, before using `lastActivity`, file dates, or most-recent-session assumptions.
If the active session cannot be identified, say that clearly and ask for a session identifier or use
the most recent session only when that assumption is explicit.

For `!hooks`, inspect hooks in read-only mode. Summarize hooks configured in the current project,
normally from `.codex/hooks.json` when it exists, and separately list hook signals visibly active in
the current session. Do not edit hook files or infer that a configured hook actually ran unless
there is session evidence.

For `!summary`, summarize the conversation from the start of the session using the transcript
currently available to the model and any explicit compaction summary. If earlier turns are
unavailable, state that limitation instead of inventing missing details.

For `!time`, use `codex-resolution-time` signals when available to report the elapsed session time.
Do not claim the final current-turn duration before the `Stop` hook runs. If no timer signal is
available, state that instead of inventing a duration. If the hook exposes sanitized session
correlation metadata, reuse that signal for `!usage` instead of falling back directly to date
heuristics.

For `!example`, provide one concrete, realistic example for the proposal, suggestion, or approach
Codex just made. Keep it illustrative, and do not treat it as approval to implement the example or
mutate state.

For `!loop`, use `$autonomous-loop` when available. If the request lacks a workflow, target,
iteration budget, stop criteria, or safety policy, default to the loop planning or help posture
instead of autonomous execution. `!loop` does not authorize pushes, deploys, production changes,
destructive actions, or remote mutations.

For `!retry` and `!again`, retry only the last failed or blocked action. State the failure and the
changed approach, or explain why the failure appears transient. Do not retry the same failing action
blindly, and do not treat these shortcuts as authorization for external, production, destructive,
irreversible, or remote state changes.

### Canonical skill routing when available

- When the repository has access to `agents-housekeeping`, prefer that skill when the user says
  things like "arquivar work-items", "mover work-items concluídos para `.archived`", "fazer
  housekeeping da `.agents`", "organizar a camada `.agents`", "reorganizar changelogs por mês", "ver
  o que está elegível para arquivamento", or "expurgar work-items arquivados".

- Start with a non-destructive `check` unless the user explicitly asks for a mutating housekeeping
  action.

- When the user says things like "otimizar performance", "reduzir uso de memória", "preparar para
  milhões de usuários", "encontrar gargalos", "faster rendering", "unnecessary rendering", or
  "performance bottlenecks", start with a diagnostic `$code-review` pass or `code-reviewer`
  delegation when the desired output is findings and optimization strategy. If the scope is frontend
  rendering, state churn, bundle/runtime, or UI memory behavior, use `$frontend-development` or
  `ui-reviewer` as the specialized frontend lens. Execute code changes only after the diagnostic
  scope and validation evidence are clear.

- When the user says things like "rebuild messy code", "clean architecture", "separar
  responsabilidades", "reduzir acoplamento", "new folder structure", "nova estrutura de pastas", or
  "preservar comportamento enquanto refatora", use `$refactoring` for structural execution. If the
  scope is repository-wide or unknown, run `$code-review` or `code-reviewer` first to identify
  bounded refactoring fronts. If multiple target structures have real trade-offs, use
  `.agents/prompts/solution-design.prompt.md` or `solutions-architect` before handing execution to
  `$refactoring`.

- When the user says things like "production security audit", "vulnerability report",
  "authentication flaws", "API weaknesses", "injection risks", "sensitive data exposure", or
  "infrastructure risks", route by scope. Use `$security-scan` for broad repository, infrastructure,
  secrets, dependency, endpoint, sensitive-configuration, generated-artifact, or unknown-scope
  triage. Use `$security-review` for a clear sensitive flow involving auth, authorization, API
  boundaries, input validation, uploads, data access, webhooks, payments, or sensitive information.
  Security review may recommend fixes, but implementation, credential rotation, external calls,
  deploys, and production mutations require a separate explicit handoff and confirmation.

- When the user says things like "senior DevOps", "production deployment", "deployment
  architecture", "configure CI/CD", "monitoring/logging strategy", "Docker/Kubernetes setup",
  "reduce downtime", "optimize scaling", "deployment workflow", or "production deployment
  checklist", route by intent before touching runtime systems. Use
  `.agents/prompts/solution-design.prompt.md` when deployment architecture, infrastructure
  alternatives, reliability, observability, scaling, or downtime strategy has meaningful trade-offs.
  Use `.agents/prompts/implementation-planning.prompt.md` when the need is rollout, rollback,
  compatibility, CI/CD change planning, deployment checklist, or release sequencing. Use bounded
  provider or release skills only for their explicit scope, such as `$bitbucket-pipelines` for
  listing or triggering validated custom Bitbucket pipelines and `$bitbucket-release-manager` for
  SAT release inventory or governed release branch creation. This routing never authorizes deploys,
  pushes, infrastructure mutation, credential changes, production state changes, or external-system
  changes without explicit current-session confirmation and the production-change audit contract.

### Canonical custom agent routing when available

When `.codex/agents/*.toml` exists, use `.agents/references/agents-roles.md` as the canonical role
map before delegating to custom agents. Use `.agents/references/agents-usage.md` for the trigger
policy and help routing.

This routing does not override prompt activation criteria. It only names the best role once the
parent agent has already decided that subagent delegation is worth the coordination cost.

For repository-wide phrases such as "audit the entire codebase", "review the architecture",
"optimize performance", or "find duplication, performance, scalability, and maintainability risks",
use the `code-reviewer` role when the desired output is diagnostic. Use `code-explorer` first only
when a compact execution-flow or architecture map would materially reduce uncertainty before the
review.

For clean architecture or messy-code rebuild requests, use `solutions-architect` only when
architectural alternatives need comparison. The execution handoff should go to `$refactoring` or a
bounded implementation delegate with explicit behavior invariants, target boundaries, and validation
evidence.

For production security audit requests, use `security-advisor` when delegation materially helps. It
should choose `$security-scan` for broad triage and `$security-review` for contextual sensitive-flow
review, then return severity-ranked sanitized findings and hand off fixes separately.

For senior DevOps or deployment-readiness requests, do not infer a dedicated DevOps executor role.
Start with `solution-design` when architecture/trade-offs matter and `implementation-planning` when
rollout/checklist sequencing matters. Only use pipeline, release, cloud, or deployment skills inside
their explicit bounded contracts, and keep real runtime mutation behind the normal production
confirmation and audit gates.

---

## Prompt chaining rules

When prompts are executed in sequence, the output of one prompt must be explicitly available as
input for the next.

### Why this matters

The agent does not retain context across separate prompt invocations. If `solution-design` produces
a design contract and `implementation-planning` is invoked in a different context window or session,
the contract must be passed explicitly. Assuming the agent "remembers" leads to disconnected
outputs.

### Chaining map

| Source prompt                      | Output artifact                       | Consumer prompt                                | How to pass                                                                                                |
|------------------------------------|---------------------------------------|------------------------------------------------|------------------------------------------------------------------------------------------------------------|
| `bug-analysis`                     | ranked hypotheses + recommended fix   | `solution-design` or `implementation-planning` | reference the diagnosis section that defines the problem and validated root cause                          |
| `solution-design`                  | design contract (section 7)           | `implementation-planning`                      | include the contract as the starting context for the plan                                                  |
| `solution-design` or executed work | architectural decision candidate      | `architecture-decision`                        | include the chosen approach, alternatives, rationale, consequences, and evidence source                    |
| `implementation-planning`          | execution plan (section 7)            | `test-driven`                                  | reference the plan steps and affected components as the scope for test specifications                      |
| `test-driven`                      | test specifications + coverage matrix | implementation                                 | use the specs as the acceptance criteria the code must satisfy                                             |
| implementation result              | changed files, code, config           | `verification`                                 | verification inspects the actual result and compares against objective, design, plan, and test specs       |
| `verification`                     | verdict (pass / partial / fail)       | `changelog` or execution                       | if pass/partial: proceed to changelog with deviations noted; if fail: return to execution with corrections |
| any prompt                         | relevant output                       | `changelog`                                    | the changelog captures what was decided and done, not the full output of each prompt                       |

### Rules

- When a prompt produces output that feeds the next prompt in the sequence, the relevant output
  section must be explicitly referenced or included when invoking the downstream prompt.

- Do not duplicate the full output of the upstream prompt. Reference the specific section that
  matters.

- If the upstream output is unavailable (lost context, different session), reconstruct the relevant
  input from changelogs, documentation, or repository state before proceeding.

- If reconstruction is not possible, re-execute the upstream prompt rather than proceeding without
  its output.

- For non-trivial tasks that actually use a work-item, use the active work-item as the default local
  carrier of continuity between phases.

---
