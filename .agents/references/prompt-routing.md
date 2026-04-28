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
- a trivial, self-evident change does not need `verification` — go straight to changelog

### Ambiguity rule

If the problem is semantically ambiguous — the objective is unclear, the requirements contradict each other,
or the scope cannot be defined without assumptions — do not proceed to `solution-design` or any downstream
prompt. Stop and clarify with the requester first.

Designing on top of ambiguity produces artifacts that look structured but encode guesses. The cost of
clarifying before designing is always lower than the cost of redesigning after implementation.

This is a workflow gate, not a prompt. The agent does not need a separate tool to ask a question.

### Legacy code considerations

Legacy code does not exempt a task from the workflow, but it changes what each prompt produces:

- `test-driven` adapts its strategy: characterization tests, boundary testing, or change-only testing
  replace classical test-first when the code has low testability. The prompt handles this internally —
  the agent does not need to skip `test-driven` for legacy code, but should expect a different output
  shape (testability assessment + adapted strategy instead of pure test-first specifications).
- `solution-design` may need to evaluate "refactor first vs. work within current structure" as one
  of the alternatives.
- `implementation-planning` should flag low-testability areas in the risk section.

The key principle: legacy code means adapted strategy, not skipped steps.

### How to decide

Each prompt contains `when_to_use` and `when_not_to_use` (or equivalent) sections that define its activation
criteria. These sections are the deciding authority — not the sequence diagram, not the prompt map summary.

When the task does not clearly match any prompt's activation criteria:

1. Check whether the task is truly non-trivial. If it is trivial, skip the prompt layer entirely.
2. If non-trivial, identify which phase of the workflow the task belongs to (diagnose, design, plan, specify,
   execute, document, consolidate) and use the prompt for that phase.
3. If the task spans multiple phases, follow the standard sequence but skip phases that add no value.

Do not use a prompt just because it exists in the workflow. Every prompt invocation should produce an artifact
that the next step actually needs.

### Explicit phrase routing

To reduce ambiguity in natural-language requests, the agent may use the canonical phrase routing below as a
lightweight entrypoint into the prompt workflow.

This routing is a convenience layer, not the deciding authority.

### Precedence

1. If the user explicitly names a prompt file, use that prompt.
2. Otherwise, if the user uses one of the canonical phrases below, start from the mapped prompt.
3. If the request remains semantically ambiguous, stop and clarify before entering the prompt flow.
4. If the mapped prompt would skip a required upstream phase, run the upstream phase first.
5. If the actual task shape conflicts with the mapped phrase, follow the prompt activation criteria instead of the
   phrase.

Canonical phrases are preferred routing cues, not an exhaustive synonym list and not a substitute for judgment.

### Canonical phrase routing

- Use `.agents/prompts/bug-analysis.prompt.md` as the starting prompt when the user says things like
  "investigar a causa raiz", "analisar o bug", or "entender por que isso aconteceu".
- Use `.agents/prompts/solution-design.prompt.md` as the starting prompt when the user says things like
  "comparar abordagens", "avaliar a melhor solução", or "desenhar a abordagem".
- Use `.agents/prompts/architecture-decision.prompt.md` as the starting prompt when the user says things like
  "criar um ADR", "registrar esta decisão arquitetural", "atualizar um ADR", or
  "por que escolhemos esta arquitetura?".
- Use `.agents/prompts/implementation-planning.prompt.md` as the starting prompt when the user says things like
  "preparar o plano mínimo de correção", "montar o plano de implementação", or "quero um plano técnico mínimo".
- Use `.agents/prompts/test-driven.prompt.md` as the starting prompt when the user says things like
  "definir os testes antes", "especificar os cenários de teste", or "quero o contrato de testes".
- Use `.agents/prompts/verification.prompt.md` as the starting prompt when the user says things like
  "verificar se a implementação bate com o objetivo", "fazer a verificação pós-implementação", or
  "conferir se o resultado ficou alinhado".
- Use `.agents/prompts/subagent-execution.prompt.md` as the starting prompt when the user says things like
  "quebrar em frentes paralelas", "decompor para subagentes", or "executar em paralelo".
- Use `.agents/prompts/league-of-agents.prompt.md` as the starting prompt when the user says things like
  "league of agents", "liga dos agentes", "modo equipe", "modo subagentes", "executar com agentes",
  "usar orquestração", "trabalhe com os agentes adequados", or directly invokes `@League of Agents`.
- Use `.agents/references/agents-usage.md` as the answer source, without spawning subagents, when the user says
  "Agents Usage" or invokes `@Agents Usage`.
- Use `.agents/references/agents-examples.md` as the answer source, without spawning subagents, when the user says
  "Agents Examples", "Agents Example", `@Agents Examples`, or `@Agents Example`.
- Use `.agents/prompts/changelog.prompt.md` as the starting prompt when the user says things like
  "registrar no changelog", "compactar a sessão", or "deixar o registro factual".
- Use `.agents/prompts/readme.prompt.md` as the starting prompt when the user says things like
  "revisar impacto no README", "atualizar o README se necessário", or "checar se o README foi afetado".
- Use `.agents/prompts/knowledge-base.prompt.md` as the starting prompt when the user says things like
  "promover para conhecimento durável", "consolidar na base de conhecimento", or "atualizar a documentação canônica".
- Use `.agents/prompts/repository-overview.prompt.md` as the starting prompt when the user says things like
  "explicar o repositório para público não técnico", "atualizar o REPOSITORY-OVERVIEW", or
  "gerar visão funcional do repositório".

### Canonical skill routing when available

- When the repository has access to `agents-housekeeping`, prefer that skill when the user says things like
  "arquivar work-items", "mover work-items concluídos para `.archived`", "fazer housekeeping da `.agents`",
  "organizar a camada `.agents`", "reorganizar changelogs por mês", "ver o que está elegível para arquivamento", or
  "expurgar work-items arquivados".
- Start with a non-destructive `check` unless the user explicitly asks for a mutating housekeeping action.

### Canonical custom agent routing when available

When `.codex/agents/*.toml` exists, use `.agents/references/agents-roles.md` as
the canonical role map before delegating to custom agents. Use
`.agents/references/agents-usage.md` for the trigger policy and help routing.

This routing does not override prompt activation criteria. It only names the
best role once the parent agent has already decided that subagent delegation is
worth the coordination cost.

---

## Prompt chaining rules

When prompts are executed in sequence, the output of one prompt must be explicitly available as input for the next.

### Why this matters

The agent does not retain context across separate prompt invocations. If `solution-design` produces a design
contract and `implementation-planning` is invoked in a different context window or session, the contract must be
passed explicitly. Assuming the agent "remembers" leads to disconnected outputs.

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

- When a prompt produces output that feeds the next prompt in the sequence, the relevant output section must be
  explicitly referenced or included when invoking the downstream prompt.
- Do not duplicate the full output of the upstream prompt. Reference the specific section that matters.
- If the upstream output is unavailable (lost context, different session), reconstruct the relevant input from
  changelogs, documentation, or repository state before proceeding.
- If reconstruction is not possible, re-execute the upstream prompt rather than proceeding without its output.
- For non-trivial tasks that actually use a work-item, use the active work-item as the default local carrier of
  continuity between phases.

---

