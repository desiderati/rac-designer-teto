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
    - `!auto-review`

- Use `.agents/prompts/brainstorm.prompt.md` together with `.agents/references/brainstorm.md` only
  when the user directly invokes `@Brainstorm`. It accepts an unclear idea, requirement, or solution
  and hands off first to Product Owner or Solutions Architect. Clear incidents and clear
  maintenance/refactoring in unknown code bypass it to `support-analyst` and `code-explorer`;
  Brainstorm only reclassifies those cases and does not investigate them. The first version has no
  broad natural-language alias. This entrypoint does not authorize artifact authoring,
  implementation, Git, deployment, or external mutation.

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

- Use `.agents/references/code-review-routing.md` for `!review`, `!review local`, `!review agent`,
  `@code-reviewer`, and natural-language requests whose object may be implementation code, a Git
  change, an ADR, a solution design, or an execution/readiness plan. Resolve capability, route, and
  owner separately; supported technical artifacts use `$solution-review` when available and their
  canonical artifact owner as a disclosed fallback.

- Use `.agents/references/models-usage.md` as the answer source, without spawning subagents or
  changing configuration, when the user says "Models Usage" or `@Models Usage`. Without a task
  summary, return one examples-by-effort table for each GPT-6 model plus Ultra guidance as a
  distinct multi-agent mode. With a task summary, recommend exactly one GPT-6 model-and-effort
  combination and do not repeat the catalog tables.

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

| Shortcut            | Meaning                                                                                                           |
|---------------------|-------------------------------------------------------------------------------------------------------------------|
| `!again`            | Alias for `!retry`; retry only after explaining what failed and what will change.                                 |
| `!are-you-sure`     | Audit Codex's previous claims against available evidence and correct unsupported claims.                          |
| `!auto-review`      | Expand the preset League + `!loop` + `$code-review` over unpublished local Git changes.                           |
| `!authorized`       | Alias for `!confirm`; authorize the exact action most recently proposed by Codex.                                 |
| `!ays`              | Alias for `!are-you-sure`; run the same evidence-based certainty audit.                                           |
| `!bootstrap`        | Run the default safe `agents-bootstrap` bundle in the current repository.                                         |
| `!bootstrap-check`  | Run the same default `agents-bootstrap` bundle with `--dry-run`.                                                  |
| `!changelog`        | Record material work; use `changelog.prompt.md` when available.                                                   |
| `!closeout`         | Default to `!closeout session`; audit the current session and enumerate evidence-backed items possibly left open. |
| `!closeout repo`    | Extend closeout to repository memory while separating session ownership and provenance.                           |
| `!closeout session` | Audit only the current session without scanning unrelated repository continuity.                                  |
| `!commit`           | Authorize creation of a local commit for the current scoped changes according to the repository convention.       |
| `!confirm`          | Authorize the exact action most recently proposed by Codex in the current conversation.                           |
| `!contest`          | Re-evaluate a contested Codex proposition, classifying and testing the operator's objection.                     |
| `!continue`         | Accept the proposed approach and continue within the stated local scope.                                          |
| `!current-scope`    | Exact alias for `!scope`; report the reconstructed conversational checkpoint read-only.                           |
| `!deploy`           | Authorize deployment to Production by default.                                                                    |
| `!deploy dev`       | Authorize deployment to the DEV environment.                                                                      |
| `!deploy hml`       | Authorize deployment to the HML environment.                                                                      |
| `!deploy prod`      | Explicit equivalent of the default `!deploy`.                                                                     |
| `!deploy qas`       | Authorize deployment to the QAS environment.                                                                      |
| `!eli10`            | Explain the current topic as if to a ten-year-old without losing essential accuracy.                              |
| `!example`          | Provide one concrete, realistic example for Codex's proposal, suggestion, or approach without implementing.       |
| `!explain`          | Briefly confirm whether the last instruction was understood and how Codex would proceed; not a plan.              |
| `!finish-worktree`  | Validate integration, close the governed session, curate local evidence, and remove the proven linked worktree.   |
| `!follow-up`        | Exact alias for `!status live`; report progress at the next safe point and continue the active task.              |
| `!handoff`          | Prepare a continuity summary for later resumption.                                                                |
| `!help`             | Show human-facing help for the current context; with an explicit skill, explain operator usage read-only.         |
| `!hooks`            | Show configured project hooks and hooks visibly active in the current session without modifying them.             |
| `!improve`          | Run a 30-day, read-only `$codex-self-improvement` review over exactly one current Git repository.                 |
| `!improvement`      | Exact alias of `!improve`, with the same target, window, evidence, and no-mutation contract.                      |
| `!loop`             | Route to `$autonomous-loop`; compose with League or Agents of Shield only when named in the same request.         |
| `!mainquest`        | End the active side quest and restore the main objective, focus, unresolved remainder, and next action.          |
| `!next-model` | Recommend one model/effort for the task in context; read-only, without changing settings or starting work. |
| `!next-prompt`      | Return one copyable next-action prompt; `ultra` generates a standalone autonomous-task prompt.                    |
| `!next-steps`       | List next steps, risks, and the smallest useful action.                                                           |
| `!pause`            | Stop with current state, pending items, and the next action made explicit.                                        |
| `!pdf`              | Create, edit, or inspect a local PDF; adapt composition and QA to its type, audience, and identity.               |
| `!pr`               | Prepare or create a pull request only when repository, branch, target, and readiness are unambiguous.             |
| `!remaining`        | Report remaining authorized scope and a heuristic time estimate with confidence, then continue the active task.  |
| `!retry`            | Retry the last failed or blocked action after explaining what failed and what will change.                        |
| `!review`           | Resolve the diagnostic route and owner through `code-review-routing.md`; code agent choice is shadowed.           |
| `!review agent`     | Request `code-reviewer` for code; clarify rather than delegate a technical artifact to that agent.                |
| `!review local`     | Force the compatible local review capability; clarify if an explicit artifact capability is unavailable.          |
| `!scope`            | Report the reconstructed main mission, focus, unresolved remainder, active frame, and next action read-only.     |
| `!sidequest`        | Preserve the main mission and enter one explicitly authorized temporary objective.                                |
| `!status`           | Summarize current state, progress, blockers, and pending items.                                                   |
| `!status live`      | Report completed, active, and next work at the next safe point, then continue without changing scope.            |
| `!suggest`          | Return one prioritized grounded recommendation; `explore` maps up to 12 and shortlists 3.                         |
| `!summary`          | Summarize the conversation from the available transcript and any explicit compaction summary.                     |
| `!tell-me-more`     | Expand the immediately preceding substantive answer with useful detail without executing or authorizing work.     |
| `!test`             | Run local tests/checks; use `test-driven.prompt.md` only for pre-implementation test specification.               |
| `!time`             | Show elapsed session time using `codex-resolution-time` when available.                                           |
| `!tmm`              | Exact alias for `!tell-me-more`; expand the immediately preceding substantive answer.                            |
| `!understood`       | Restate how Codex understood the latest substantive message without proposing a solution.                         |
| `!usage`            | Use `$codex-usage` when available to report current-session tokens, models, and estimated cost by ID first.       |
| `!validate`         | Strict alias for `!verify`; use the same verification routing and guardrails.                                     |
| `!verify`           | Run or describe verification; use `verification.prompt.md` when non-trivial or drift is plausible.                |

`!next-model` is a read-only model/effort recommendation for the task supplied with the shortcut
or the substantive task under discussion. Follow the `!next-model` contract in
`.agents/references/agents-shortcuts.md`; do not execute the task or change configuration.

`!deploy` only applies to the concrete deploy candidate already identified in the current
conversation. If environment, target, release, branch, artifact, repository, expected action, or
production impact is ambiguous, stop and ask for clarification instead of deploying.

`!sidequest <objective>` enters a single temporary frame while preserving the complete main mission
and one return checkpoint. It never creates a task, branch, or worktree automatically. Do not nest
side quests; complete, explicitly replace, or separately fork the active detour only when the
operator asks for that separation.

`!mainquest` closes the temporary frame and restores the main objective, focus, unresolved
remainder, and next action. Unequivocal natural-language requests to return have the same semantics.
With no active side quest, report a concise no-op.

`!scope` and `!current-scope` are exact aliases. Reconstruct the main mission, current focus,
unresolved authorized remainder, active frame, and next action from the available conversation and
any explicit compaction summary. The query does not persist state, does not close a side quest,
authorize work, scan repository history, or claim that the hook stored the mission. If context is
insufficient, state the limitation.

`!tell-me-more` and `!tmm` are exact aliases for the conversational equivalent of Codex's “Mais
detalhes” option. Expand the immediately preceding substantive answer with relevant context,
evidence, examples, caveats, and consequences. Preserve its established conclusion and scope unless
new evidence justifies a correction. The shortcut does not restart or execute the task, authorize
work, expose hidden reasoning or instructions, reveal sensitive tool output, or activate the native
UI control. If no substantive answer precedes it, state that there is nothing to expand.

`!status live` and `!follow-up` are exact aliases. At the next safe conversational or tool
boundary, give a concise non-terminal update covering completed work, work in progress, blockers,
and the immediate next action. Do not cancel an operation in flight, close the task, alter its
authorized scope, or wait for completion solely to report. Resume the active task automatically
after the update. Plain `!status` remains a normal snapshot without this continuation promise.

`!remaining` is a non-terminal forecast. Report the unresolved authorized scope and the best useful
approximate remaining time, preferably as a range, with calibrated confidence and the main factors
that may change it. Base the forecast on observed pace, completed steps, known pending work, and
current blockers; avoid fabricated precision. With minimal timing evidence, still describe the
remaining scope and mark time as not yet calibrated. Continue the active task afterward.

For `!review` and natural-language code or technical-artifact review intent, load
`.agents/references/code-review-routing.md`. Resolve object, scope, modifier, capability, route, and
owner. Code may use chat-first `$code-review` or `code-reviewer`; supported ADR, solution-design,
and execution/readiness artifacts use local `$solution-review` when available, otherwise the
disclosed artifact-owner fallback. Only code local-versus-agent prediction remains in shadow mode.
For `!verify` and `!changelog`, prefer installed prompts when their activation criteria match. For
`!test`, run checks directly unless the user asks to define behavior, scenarios, or strategy first.

`!validate` is a strict alias for `!verify`; it does not define a separate prompt, verification
level, or authorization boundary.

`!closeout` defaults to `!closeout session`. Reconstruct only the current session from the available
transcript, explicit compaction summaries, and artifacts explicitly created, resumed, or linked by
that session. Start with `Scope audited: current session`; do not scan unrelated repository
continuity. Explicit wording such as "this session" or "this conversation" always selects this mode.

`!closeout repo` extends the audit to relevant repository operational memory. Start with `Scope
audited: current session + repository operational memory`; separate current-session pending items,
other repository fronts, and work handled in another session. Give every repository-only item a
source class and evidenced ownership, or say that ownership is unidentified. Never convert a
repository-only item into a current-session pending item unless this session explicitly adopts it.
Treat time-dependent memory as unvalidated until its canonical source is rechecked.

Both modes classify in-scope items as addressed, genuinely pending, deliberately deferred, or
optional; distinguish operator action from work that remains automatic; and explicitly state when
nothing remains. If evidence is incomplete, state the transcript or compaction limitation instead of
claiming full closure. Each shortcut is read-only and does not authorize pending work or mutation.

For `!closeout` and `!closeout session`, the current-session universe contains every evidence-backed
item explicitly discussed or adopted in this session, including work that is genuinely pending,
deliberately deferred, explicitly outside the authorized execution scope, or optional. After the
addressed-scope summary, always render `Itens possivelmente em aberto` as a Markdown table with the
columns `Prioridade`, `Item`, `Situação`, and `Próxima ação necessária`. Derive priority only from
session evidence and use `Não informada` when it is absent. Do not import items from other sessions
or invent speculative follow-ups. When no eligible item exists, state exactly `Nenhum item
possivelmente em aberto.`

The table must not include routine delivery residue. Preserve commit, push, publication, and
catalog-to-runtime synchronization only under the terminal `Nota de entrega` required below. This
keeps useful delivery state visible without classifying it as a functional or contextual pending
item.

### Outcome-first delivery residue filter

Apply this filter to automatic continuation suggestions and to `!suggest`, `!next-prompt`, `!next-steps`,
`!closeout`, `!status`, `!pause`, `!handoff`, `!verify`, and `!validate`:

- Rank functional gaps, evidence gaps, decisions, risks, and context-derived improvements before
  routine delivery residue.

- Treat commit, push, publication, and catalog-to-runtime synchronization of skills or automations
  as routine delivery residue. Do not count them as functional pending items or recommendations.

- When useful, preserve that residue as a terminal `Nota de entrega` after every result-oriented
  item. It must never be the only next action or mask another pending item.

- If no result-oriented item remains, state literally `Nenhuma pendência funcional ou contextual.`
  An optional delivery note may follow, but it is not a next action.

- Promote delivery work out of the note only when it is the explicit requested outcome or blocks a
  proven functional acceptance criterion. Even then, show all other material findings first.

This filter does not change explicit delivery shortcuts such as `!commit`, `!pr`, `!auto-review`,
`!bootstrap`, `!finish-worktree`, or `!changelog`, nor a request whose stated objective is delivery
or synchronization.

For `!finish-worktree [target]`, delegate through the `agents-bootstrap` facade to the public
`skill-development-session` FinishWorktree action. Only the catalog resolved through `codex-profile`
is eligible, regardless of caller cwd. Follow the owner's `references/worktree-closeout.md`:
prove integration and cleanliness, preserve/reconcile known local collections without another
confirmation, retain extra destination files and both versions of unresolved local differences,
then remove only the linked worktree while preserving the branch. Never merge, push, sync or resolve
Git conflicts. Keep `FinishWork` logical and `Close` limited to projection cleanup.

For `!next-prompt ultra`, treat `ultra` as a modifier of `!next-prompt`. Resolve the target from an
objective supplied after the modifier or from the single unambiguous evidence-backed next action in
the current context. Do not combine multiple pending items, infer a missing target, or silently
expand the authorized universe.

Recommend `gpt-5.6-sol` in `Ultra` mode when available, while stating that the shortcut does not
change the model, mode, or reasoning effort or activate agents. Return exactly one fenced `text`
block containing the copyable prompt. Make that prompt standalone by including `Objetivo`,
`Resultado esperado`, `Escopo autorizado`, `Restrições`, `Método`, `Validação obrigatória`, and
`Conclusão`.

Prefer level-two Markdown headings (`##`) for those seven sections when rendering the standalone
prompt. Treat this as presentation guidance, not a validity gate; equivalent plain section labels
remain semantically valid.

Use enough detail for the resolved task without a fixed length limit. In `Método`, express strategy,
decision criteria, and required evidence rather than prescribing tools, sequence, or iteration
counts unless a binding contract or explicit operator instruction requires them. Preserve Ultra's
freedom to adapt execution as new evidence appears. The prompt must not manufacture operations or
authorizations to appear complete.

The generated prompt may suppress intermediate operator decisions only for safe, local, reversible
choices resolved by repository evidence. It must preserve confirmation requirements for production,
external-system, destructive, or irreversible actions and must stop on a real blocker instead of
weakening a guardrail.

Ultra may use repository-governed delegation when the active product mode and local orchestration
contract support it. The shortcut neither requires nor authorizes delegation by itself.

Derive the workflow from the resolved objective. A read-only review must not gain worktree, editing,
or commit authorization. An implementation prompt may include those local actions only when the
current request already authorizes them or the generated prompt asks for that authorization.

For `!explain`, answer succinctly whether the user's last instruction is clear and how you would
approach the solution. Do not expand it into a full plan, and do not treat it as approval to execute
the solution.

For `!understood`, answer `yes`, `partially`, or `no` about whether the latest substantive user
message was understood, then restate its meaning in your own words. Include the objective, scope,
constraints, and any unresolved ambiguity. This is narrower than `!explain`: do not propose a
solution approach, execute work, or treat the shortcut as authorization.

For `!are-you-sure` and `!ays`, audit the claims in Codex's latest substantive response against the
available evidence and any necessary in-scope read-only verification. Separate verified facts,
inferences, assumptions, and unknowns; state calibrated confidence; and explicitly correct or
withdraw unsupported claims. Do not defend the prior response by default, invent evidence, execute
work, or treat either shortcut as authorization to mutate state.

For `!contest`, identify the proposition the operator contests and classify the objection as
evidence, factual correction, preference, authorization, hypothesis, or opinion. Compare it with
the evidence and criteria behind the previous conclusion, using necessary in-scope read-only
verification. Do not accept or reject the objection merely because it was asserted. State
`conclusão mantida`, `conclusão revisada`, or `evidência insuficiente`, with the factual basis and,
when useful, evidence that would change the conclusion. A preference or authorization can change
the chosen action without proving the technical claim. This shortcut does not authorize mutation.

For `!eli10`, explain the current topic as if to a ten-year-old. Use plain language, short
explanations, concrete examples, and analogies; define essential jargon and preserve necessary
caveats without a patronizing tone. If the topic cannot be resolved from the conversation, ask which
topic to explain. Keep the response explanatory only, and do not treat it as authorization to
execute or mutate anything.

For `!help`, provide concise human-facing help for the current context. If no skill, agent, or
workflow is explicitly referenced, summarize accepted shortcuts and help entrypoints. If a skill is
explicitly referenced, explain what the skill is for, when to use it, how an operator should ask for
the work in natural language, which inputs are needed, what Codex will check or do, and what
requires explicit authorization. Do not run scripts, probes, tools, external calls, installs, or
mutations.

For `!pdf`, compose `$pdf`, `$design-system`, and `$brand-system` to create, edit, or inspect a
local PDF. If context is incomplete, ask for source/content, objective/audience, output path/name,
and whether SAT branding applies. Preserve an existing non-SAT identity unless the user explicitly
asks for rebranding. For executive documents, lead with conclusions, implications, decisions, risks,
and actions. Organize the main narrative by outcomes or capabilities, keeping commit-level
chronology as supporting evidence or an appendix unless the user explicitly requests a technical
changelog. For Portuguese content, preserve normal Portuguese accents and UTF-8; extract and review
the final PDF text before handoff and regenerate when editorial text loses accents or contains
mojibake. Render and inspect changed pages, confirming that list markers are optically aligned with
the first text line and use consistent hanging indentation. Do not upload, share, publish, or fetch
brand assets from Drive during normal use. If a required skill is unavailable, stop clearly and
suggest installing or synchronizing it; do not substitute an arbitrary renderer or brand asset.

For `!bootstrap-check`, run `agents-bootstrap` in the current repository with `--dry-run`,
`--with-rtk`, `--with-resolution-time`, `--with-self-improvement`, `--with-graphify`, and, during
the pilot, `--with-scope-checkpoint`. Do not include `--with-graphify-hooks` or `--force`.

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

For `!improve` or `!improvement`, use `$codex-self-improvement` when available and resolve exactly one Git root for
the active workspace. Review the last 30 days using an already-installed Observer and recent
`.agents` evidence, keep the first pass read-only, and return an evidence-grounded shortlist. Do not
install or update hooks, create assets, or edit files. If the workspace does not resolve to exactly
one Git root, including an aggregator with multiple child repositories, ask for the exact target. If
the skill is unavailable, report the missing dependency instead of substituting another workflow.

The routing precedence is deterministic:

| Input                                                | Result                                                                 |
|------------------------------------------------------|------------------------------------------------------------------------|
| `!improve`                                           | Run the routed 30-day read-only review for one current Git repository. |
| `!improvement`                                       | Run exactly the same routed review as `!improve`.                      |
| `$codex-self-improvement` with no additional context | Show only executive help and stop.                                     |
| `$codex-self-improvement observer ...`               | Run the explicit observer action within its own contract.              |

Routed shortcuts already carry repository, time-window, evidence, and read-only context; they are
not empty direct invocations of the skill.

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

For `!suggest`, load `.agents/references/suggestion-system.md` and return exactly one prioritized,
grounded recommendation. The artifact owner plus at most one specialized lens may be used when
deeper analysis materially improves the result. Do not edit an artifact or implement the
recommendation.

For `!suggest explore`, treat `explore` as a modifier, not another shortcut. Generate up to 12
surviving candidates across artifact gaps, functional opportunities, transversal risks, and stage
transitions; shortlist at most 3. The artifact owner plus at most three non-overlapping specialized
lenses may be used. Do not activate agents or councils automatically, and do not turn explored
options into accepted scope.

For `!loop`, use `$autonomous-loop` when available. If the request lacks a workflow, target,
iteration budget, stop criteria, or safety policy, default to the loop planning or help posture
instead of autonomous execution. `!loop` does not authorize pushes, deploys, production changes,
destructive actions, or remote mutations.

`!loop` alone does not activate League or Agents of Shield. When the same request explicitly
activates League, compose the contracts: League owns role selection, delegation, adjudication,
validation, and consolidation; `$autonomous-loop` owns bounded iteration, durable state, progress,
stop criteria, and safety. This generic composition does not imply code review, a Git manifest,
fixes, or commits.

When the same request explicitly activates Agents of Shield, compose the council directly with
`$autonomous-loop`; League is not required. Agents of Shield remains diagnostic. Run complete
five-profile opening and closing passes, and require each intermediate `$security-scan` or
`$security-review` invocation to complete its declared diagnostic scope. Remediation remains a
separate, explicitly authorized handoff.

Generic `league of agents` and direct `@League of Agents` are team-orchestration entries; they do
not compose `$autonomous-loop` automatically. Composition occurs only when the same request also
invokes `!loop`, or through the `!auto-review` preset below.

For `!auto-review`, expand League + `!loop` + `$code-review`; do not create another skill or
orchestration policy. Activate the League contract in the parent session and do not spawn
`league-of-agents` as a child. Resolve the unpublished Git manifest from commits in
`upstream..HEAD`, staged changes, unstaged changes, untracked files, renames, and deletions. If the
upstream is missing, local refs show the branch behind or diverged, conflicts exist, the commit
scope is ambiguous, or unrelated pre-existing changes would be committed, stop before mutation.
Create the `$autonomous-loop` run contract with `max_iterations=15` and durable state, then remain
in plan mode until the user answers `!confirm`. That confirmation authorizes bounded local edits,
validation, and at most one atomic local commit per iteration; it does not authorize push, merge,
rebase, deploy, remote mutation, or conflict resolution. In each iteration, have `code-reviewer`
complete one `$code-review` pass, let the League parent adjudicate the complete finding set as
`investigate`, `fix`, `dismiss`, or `defer`, and delegate only `fix` findings separately to
`software-developer`. Read relevant memory and require concrete evidence or an explicit contract
before `fix`; a test written after selecting a behavior validates the implementation but does not
prove the requirement. Continue after dismissal or non-blocking deferral without pausing per
finding, then validate and commit only when checks pass. Stop when no proven eligible finding
remains, the budget is exhausted, progress stalls, the same failure repeats without new evidence, or
a safety/escalation boundary is reached.

For the canonical skill catalog, `!confirm` does not authorize writing in the primary checkout and
does not replace `$skill-development-session`. Use one governed worktree for the entire changeset,
finish the diagnostic pass before freezing the explicit canonical target set, bind that set with
`BeginWork -TargetSkills`, and require live `WorkStatus = work-reusable` plus the autonomous-loop
authoring gate before every mutating iteration. A target discovered after the first write is scope
drift and stops the wave. Do not use a synthetic target, wildcard, worktree per skill, or hook.

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
  Each invocation is a complete diagnostic pass over its declared scope, not one increment of an
  implicit loop. Neither capability activates `$autonomous-loop` by default. Security review may
  recommend fixes, but implementation, credential rotation, external calls, deploys, and production
  mutations require a separate explicit handoff and confirmation.

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
