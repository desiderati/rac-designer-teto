---
title: "Agents Shortcuts"
doc_role: skill-reference
---

# Agents Shortcuts

Use this reference when the user asks `Agents Shortcuts`, `Agents Shortcut`, invokes `@Agents
Shortcuts`, or asks which compact `!` conversation controls are accepted by the local
`agents-bootstrap` contract.

Do not execute these shortcuts when the user only asks to list or explain them. Return the accepted
shortcuts with when-to-use guidance, simple examples, and the safety notes.

## Accepted `!` Shortcuts

| Shortcut            | When to use                                                                                                                                | Simple example                                                                                        |
|---------------------|--------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------|
| `!again`            | Alias for `!retry`; retry the last failed or blocked action with an explicit change.                                                       | "The install failed; try again after explaining what changes."                                        |
| `!are-you-sure`     | Re-evaluate Codex's previous claims against available evidence, expose uncertainty, and correct unsupported claims.                        | "Are you really sure about the claims in your previous answer?"                                       |
| `!auto-review`      | Use the preset League + `!loop` + `$code-review` over unpublished local Git changes.                                                       | "Review and repair every local change before push."                                                   |
| `!authorized`       | Alias for `!confirm`; authorize only the exact action most recently proposed by Codex.                                                     | "Authorize the commit you just described."                                                            |
| `!ays`              | Alias for `!are-you-sure`; run the same evidence-based certainty check.                                                                    | "Double-check whether your previous answer is actually supported."                                    |
| `!bootstrap`        | Install the default safe pilot bundle in the current repository, without `--force` or Graphify hooks.                                      | "Apply agents-bootstrap with RTK, resolution-time, Scope Checkpoint, self-improvement, and Graphify." |
| `!bootstrap-check`  | Preview the default pilot bundle with `--dry-run`, without writing files.                                                                  | "Show what the default pilot bootstrap would install before applying it."                             |
| `!changelog`        | Record material work in the operational changelog; use `changelog.prompt.md` when available.                                               | "Document today's material change in the changelog."                                                  |
| `!closeout`         | Default alias for `!closeout session`; audit the current session and enumerate every evidence-backed item possibly left open.              | "Check what was addressed and list everything from this session that may remain open."                |
| `!closeout repo`    | Extend closeout to repository operational memory while separating session ownership.                                                       | "Also show other repository fronts without treating them as pending here."                            |
| `!closeout session` | Audit only the current session, without scanning unrelated repository continuity.                                                          | "Check only what remains from this conversation."                                                     |
| `!commit`           | Authorize creation of a local commit when the changed files, staging scope, and message intent are clear.                                  | "Commit only the files from this change."                                                             |
| `!confirm`          | Authorize only the exact action most recently proposed by Codex in the current conversation.                                               | "Run the command you just proposed."                                                                  |
| `!contest`          | Re-evaluate a contested Codex proposition using the operator's objection as an input to test.                                              | "I contest the configuration hypothesis; the integration worked today. Recheck that premise."         |
| `!continue`         | Accept the proposed approach and continue within the stated local scope.                                                                   | "Proceed with that local plan."                                                                       |
| `!current-scope`    | Exact alias for `!scope`; report the reconstructed conversational checkpoint without changing it.                                          | "What is the main mission of this session?"                                                           |
| `!deploy`           | Authorize deployment to Production by default for the identified deploy candidate.                                                         | "Deploy the release we already discussed."                                                            |
| `!deploy dev`       | Authorize deployment to DEV for the identified deploy candidate.                                                                           | "Publish this candidate to DEV."                                                                      |
| `!deploy hml`       | Authorize deployment to HML for the identified deploy candidate.                                                                           | "Promote this release to HML."                                                                        |
| `!deploy prod`      | Explicit equivalent of `!deploy`; authorize deployment to Production for the identified deploy candidate.                                  | "Publish this candidate to PROD."                                                                     |
| `!deploy qas`       | Authorize deployment to QAS for the identified deploy candidate.                                                                           | "Promote this build to QAS."                                                                          |
| `!eli10`            | Explain the current topic as if to a ten-year-old without losing essential accuracy.                                                       | "Explain the current topic in a way a ten-year-old could understand."                                 |
| `!example`          | Provide one concrete, realistic example for Codex's current proposal, suggestion, or approach.                                             | "Show how this flow would look in practice."                                                          |
| `!explain`          | Briefly state whether the last instruction was understood and how Codex would proceed; not a plan or execution approval.                   | "Explain how you understood my request before acting."                                                |
| `!finish-worktree`  | Prove that a skill-development candidate is integrated, close its governed session, curate local evidence, and remove its linked worktree. | "The commits are in master; finish this development worktree."                                        |
| `!follow-up`        | Exact alias for `!status live`; report progress at the next safe point and then continue the active task.                                  | "Tell me where we are without stopping the work."                                                     |
| `!handoff`          | Prepare a continuity summary for later resumption.                                                                                         | "I need to pause; leave a handoff for later."                                                         |
| `!help`             | Show human-facing help for the current context; with an explicit skill, explain operator usage without executing it.                       | "Show how to use this skill operationally."                                                           |
| `!hooks`            | Inspect configured project hooks and hook signals visibly active in the session, without modifying them.                                   | "Check which hooks are active in this conversation."                                                  |
| `!improve`          | Run a 30-day, read-only `$codex-self-improvement` review over exactly one current Git repository.                                          | "Review evidence-backed improvements for this repository."                                            |
| `!improvement`      | Exact alias of `!improve`, preserving the same 30-day, single-repository, read-only contract.                                              | "Review evidence-backed improvements for this repository."                                            |
| `!loop`             | Route to `$autonomous-loop`; pair it with League or Agents of Shield only when that composition is intended.                               | "League of Agents + !loop: run three bounded cycles."                                                 |
| `!mainquest`        | End the active side quest and restore the main objective, pending items, focus, and next action.                                           | "Return to the main mission now."                                                                     |
| `!next-model`       | Recommend one model and reasoning effort for the contextual task end to end, without execution or configuration changes.                   | "Which model and effort should handle this task end to end?"                                          |
| `!next-prompt`      | Return one copyable next-action prompt; the `ultra` modifier generates a standalone autonomous-task prompt.                                | "What should I ask you to do next?"                                                                   |
| `!next-steps`       | List next steps, risks, and the smallest useful action.                                                                                    | "What should we do next?"                                                                             |
| `!pause`            | Stop with current state, pending items, and the next action made explicit.                                                                 | "Stop here and say exactly what remains."                                                             |
| `!pdf`              | Create, edit, or inspect a local PDF; adapt composition and QA to the document type, audience, and identity.                               | "Create a local PDF from this content for the intended audience."                                     |
| `!pr`               | Prepare or create a pull request only when repository, branch, target, and readiness are unambiguous.                                      | "Prepare the PR description for this branch."                                                         |
| `!remaining`        | Report remaining authorized scope and a best-effort time estimate with confidence, then continue the active task.                          | "What remains, and roughly how long should it take? Keep going afterward."                            |
| `!retry`            | Retry the last failed or blocked action after stating what failed and what will change.                                                    | "Try again, but correct the previous error first."                                                    |
| `!review`           | Resolve a diagnostic local/agent route from context; observe the decision in shadow mode.                                                  | "Review the current implementation changes."                                                          |
| `!review agent`     | Request an independent diagnostic `code-reviewer` pass, with a transparent local fallback.                                                 | "Delegate an independent review of this diff."                                                        |
| `!review local`     | Force the current chat to perform the diagnostic review without delegation.                                                                | "Review this diff here in the current chat."                                                          |
| `!scope`            | Report the reconstructed main mission, current focus, unresolved remainder, active frame, and next action read-only.                       | "What is the main mission of this session?"                                                           |
| `!sidequest`        | Preserve the main mission and pursue one explicitly authorized temporary objective.                                                        | "Temporarily investigate this blocker, then return."                                                  |
| `!status`           | Summarize current state, progress, blockers, and pending items.                                                                            | "Where are we on this work?"                                                                          |
| `!status live`      | Report completed, active, and next work at the next safe point, then continue without changing scope or closing the task.                  | "Give me a live progress update and keep working."                                                    |
| `!suggest`          | Return one prioritized grounded recommendation without implementing; `explore` maps up to 12 and shortlists 3.                             | "Suggest one improvement, or explore the option space."                                               |
| `!summary`          | Summarize the conversation from the available transcript and any explicit compaction summary.                                              | "Summarize what we have decided so far."                                                              |
| `!tell-me-more`     | Expand Codex's immediately preceding substantive answer with relevant context, evidence, examples, caveats, and consequences.              | "Give me the useful details behind your previous answer."                                             |
| `!test`             | Run local tests or checks; use `test-driven.prompt.md` only when defining behavior, scenarios, or strategy before implementation.          | "Run the checks for the changed scope."                                                               |
| `!time`             | Show elapsed session time using `codex-resolution-time` when available.                                                                    | "How long has this session been running?"                                                             |
| `!tmm`              | Exact alias for `!tell-me-more`; expand the immediately preceding substantive answer.                                                      | "Tell me more about your previous answer."                                                            |
| `!understood`       | State whether the latest substantive message was understood and restate its meaning without proposing a solution.                          | "Did you really understand what I said, and how did you understand it?"                               |
| `!usage`            | Use `$codex-usage` when available to report current-session tokens, models, and estimated cost, preferring session ID evidence.            | "What is the approximate usage for this session?"                                                     |
| `!validate`         | Strict alias for `!verify`; run the same relevant verification contract.                                                                   | "Validate whether this implementation satisfies the objective."                                       |
| `!verify`           | Run or describe relevant verification; prefer `verification.prompt.md` when non-trivial or drift is plausible.                             | "Check whether the implementation satisfies the objective."                                           |

## Safety Notes

- Treat all `!` shortcuts as intent signals for the current conversation, not as permission to
  bypass repository, production, external-mutation, or irreversible-action guardrails.

- `!sidequest` preserves exactly one return checkpoint and never creates a task, branch, or worktree
  automatically. Do not nest side quests. A bounded objective expressed in unequivocal natural
  language has the same semantics unless the user explicitly replaces or cancels the main mission.

- `!mainquest` restores the main objective, current focus, unresolved authorized remainder, and next
  action. Treat it without an active side quest as a brief informative no-op.

- `!scope` and `!current-scope` are exact aliases. Reconstruct the main mission, current focus,
  unresolved authorized remainder, active frame, and next action from the available conversation and
  any explicit compaction summary. This query does not persist state, does not close a side quest,
  authorize work, scan repository history, or claim that the hook stored the mission. If the
  available context is insufficient, state that limitation.

- `!tell-me-more` and `!tmm` are exact aliases for the conversational equivalent of Codex's “Mais
  detalhes” option. Expand the immediately preceding substantive answer with useful context,
  evidence, examples, caveats, and consequences while preserving its established conclusion and
  scope unless new evidence justifies a correction. Do not restart or execute the task, infer an
  authorization, expose hidden reasoning or instructions, reveal sensitive tool output, or claim to
  activate the native UI control. If there is no preceding substantive answer, state that there is
  nothing to expand.

- `!status` is a normal progress snapshot and does not by itself promise that the active task will
  continue after the response. `!status live` and `!follow-up` are exact aliases for a non-terminal
  progress update: at the next safe conversational or tool boundary, report concisely what was
  completed, what is in progress, blockers if any, and the immediate next action. Do not cancel an
  operation in flight, close the task, alter its authorized scope, or wait for the whole task to
  finish merely to report. If an indivisible tool call is running, report after it returns, then
  resume the active task automatically.

- `!remaining` is also non-terminal. Report the unresolved authorized scope and give the best useful
  approximate time remaining, preferably as a range, based on observed pace, completed steps, known
  pending work, and current blockers. Label the estimate as heuristic, state calibrated confidence
  and the main factors that may change it, and avoid fabricated precision. When timing evidence is
  minimal, still estimate the remaining scope and describe time as not yet calibrated instead of
  manufacturing a duration. Continue the active task after the update without changing its scope.

- `@Agents Shortcuts` is read-only: listing or explaining shortcuts does not execute any shortcut.
  Use `@Agents Usage` to understand Council, League, or custom-agent orchestration.

- `!eli10` uses plain language, short explanations, concrete examples, and analogies while defining
  essential jargon and preserving necessary caveats. Avoid a patronizing tone. If the current topic
  is unclear, ask which topic to explain. The shortcut is explanatory only and does not authorize
  execution or mutation.

- `!understood` is narrower than `!explain`: report `yes`, `partially`, or `no`, then restate the
  latest substantive user message in your own words, including its objective, scope, constraints,
  and unresolved ambiguities. Do not add a solution approach, execute work, or infer authorization.

- `!are-you-sure` and `!ays` audit Codex's latest substantive response instead of defending it by
  default. Recheck its claims against available evidence and in-scope read-only verification,
  distinguish verified facts, inferences, assumptions, and unknowns, state calibrated confidence,
  and explicitly correct or withdraw unsupported claims. They do not authorize mutation.

- `!contest` treats the operator's explicit disagreement as an input to test. Identify the contested
  proposition and classify the new input as evidence, factual correction, preference, authorization,
  hypothesis, or opinion. Compare it with the evidence and criteria behind the previous conclusion,
  using necessary in-scope read-only verification. State `conclusão mantida`, `conclusão revisada`,
  or `evidência insuficiente` and explain the factual basis and, when useful, what evidence would
  change the conclusion. A preference or authorization may change the selected action but does not
  prove the technical claim; the shortcut itself does not authorize mutation.

- `!help` is read-only. It must not run probes, install tools, mutate files, call external systems,
  read secrets, or infer missing operational targets.

- When paired with an explicit skill mention, `!help` translates the skill contract into operator
  language. Prefer the skill README when available, then `SKILL.md` activation cues, safety rules,
  and `When Not to Use`. Keep script commands secondary; the primary output should teach the
  operator how to ask for the work.

- `!pdf` composes `$pdf`, `$design-system`, and `$brand-system`. Ask for source/content,
  objective/audience, output path/name, and SAT-branding intent when missing. Preserve the original
  identity of an existing non-SAT document unless rebranding is explicit. For executive documents,
  lead with conclusions, implications, decisions, risks, and actions. Organize the main narrative by
  outcomes or capabilities, keeping commit-level chronology as supporting evidence or an appendix
  unless the operator explicitly requests a technical changelog. For Portuguese content, preserve
  normal Portuguese accents and UTF-8; extract and review the final PDF text before handoff and
  regenerate when editorial text loses accents or contains mojibake. Render and inspect every
  changed page, confirming that list markers are optically aligned with the first text line and use
  consistent hanging indentation. Do not upload, share, publish, or fetch brand assets from Drive
  during normal use. If a required skill is unavailable, stop clearly and suggest installing or
  synchronizing it; never improvise a replacement brand or renderer.

- `!bootstrap-check` expands to a dry-run of `agents-bootstrap` in the current repository with
  `--with-rtk`, `--with-resolution-time`, `--with-self-improvement`, `--with-graphify`, and, during
  the pilot, `--with-scope-checkpoint`.

- `!bootstrap` expands to the same default bundle without `--dry-run`. It must preserve existing
  files, must not add `--force`, must not add `--with-graphify-hooks`, and must ask for
  clarification when the target is outside the current repository or otherwise ambiguous. Because it
  includes `--with-rtk`, it may verify or install the RTK binary and initialize global Codex
  configuration under `~/.codex/`.

- `!usage` is local usage observability, not billing. Treat `costUSD` as an estimate, and do not
  claim the active session was identified unless local logs support it. Prefer visible hook session
  IDs, then `session_index.jsonl` and JSONL `payload.id`, before `lastActivity` or
  most-recent-session assumptions.

- `!hooks` is read-only inspection. Distinguish project-configured hooks from hook signals observed
  in the current session.

- `!improve` and `!improvement` use `$codex-self-improvement` over exactly one current Git repository and a 30-day
  evidence window. Use the Observer only when it is already installed, combine it with recent
  `.agents` evidence, keep the first pass read-only, and return an evidence-grounded shortlist. Do
  not install or update hooks, create assets, or edit files. If one Git root cannot be resolved, ask
  for the exact target. If the skill is unavailable, report the missing dependency instead of
  substituting another workflow.

  Both aliases are routed requests with explicit context and therefore do not trigger the
  executive-help-only behavior reserved for a direct `$codex-self-improvement` invocation
  without arguments.

### `!next-model`

Interpret `!next-model` as: "Qual é o melhor modelo/esforço para executar esta tarefa de ponta a
ponta?" Use the task explicitly supplied after the shortcut, or the substantive task under
discussion and its remaining scope. The shortcut invocation itself is not an implementation request.
If no task is identifiable or different targets would change the recommendation, ask one short
clarifying question.

Return exactly one model-and-reasoning-effort combination, with a brief task-specific reason. Use
the labels `Modelo`, `Esforço`, and `Por quê`; do not generate a catalog, implementation plan, or
next-action prompt unless separately requested. Consider complexity, risk, remaining work,
latency/cost preferences, and supported combinations. Prefer the least effort that can reliably meet
the task's acceptance criteria; do not equate "end to end" with maximum effort.

Use current model availability and official guidance through `openai-docs` when available.
Repository model examples are context, not proof of current availability or a restriction to an
older model family. Do not hardcode a model, effort, or orchestration mode in this shortcut. If
current information cannot be verified, disclose that limitation and make any recommendation
conditional on availability.

The shortcut is read-only: it does not change the model, reasoning effort, mode, or configuration,
start or authorize the task, create another task, or activate agents. It recommends settings; the
operator selects them.

### Other continuation and safety notes

- `!next-prompt` is read-only. Return exactly one sanitized, copyable prompt for the smallest
  evidence-backed next action, apply the outcome-first filter, and do not execute or authorize the
  returned action. If no result-oriented item remains, state `Nenhuma pendência funcional ou
  contextual.`

- `!next-prompt ultra` is a modifier of `!next-prompt`, not a separate execution or authorization
  route. Use an objective written after the modifier; otherwise use only the single unambiguous
  evidence-backed next action from the current context. If neither exists, state which objective is
  missing instead of inventing a target.

  Recommend `gpt-5.6-sol` in `Ultra` mode when that combination is available, but state that the
  shortcut does not change the model, mode, or reasoning effort or activate agents. Return the
  recommendation followed by exactly one fenced `text` block containing a standalone prompt. The
  prompt must declare `Objetivo`, `Resultado esperado`, `Escopo autorizado`, `Restrições`,
  `Método`, `Validação obrigatória`, and `Conclusão`.

  Prefer level-two Markdown headings (`##`) for those seven sections when rendering the standalone
  prompt. Treat this as presentation guidance, not a validity gate; equivalent plain section labels
  remain semantically valid.

  Use enough detail for the resolved task without a fixed length limit. The `Método` section must
  express strategy, decision criteria, and required evidence rather than prescribing tools,
  sequence, or iteration counts unless a binding contract or explicit operator instruction
  requires them. Preserve Ultra's freedom to adapt execution as new evidence appears. The prompt
  must not manufacture operations or authorizations to appear complete.

  Make the generated task autonomous within safe, local, reversible, and explicitly authorized
  scope, without requesting intermediate operator decisions that repository evidence can resolve.
  Let the active Ultra contract decide whether repository-governed delegation adds value; the
  shortcut itself does not require or authorize delegation. Preserve exact confirmation boundaries
  for production, external-system, destructive, or irreversible actions. Include concrete
  completion evidence and stop only for a real blocker such as a Git conflict, missing mandatory
  access, contradictory contract, or unapproved mutation.

- `!summary` is limited by the transcript available to the model. If prior turns were compacted or
  unavailable, state that limitation.

- `!closeout` defaults to `!closeout session`. This mode reconstructs the authorized scope from the
  available transcript, explicit compaction summaries, and only artifacts explicitly created,
  resumed, or linked by the current session. It must start with `Scope audited: current session` and
  must not scan unrelated repository continuity. A request limited to "this session", "this
  conversation", or equivalent wording always selects this mode.

- `!closeout repo` extends the same audit to repository operational memory, including relevant
  changelogs, work-items, reviews, incidents, and durable records. It must start with `Scope
  audited: current session + repository operational memory` and separate current-session pending
  items, other repository fronts, and work handled in another session. Every repository-only item
  must state its source class and evidenced ownership; when ownership is not evidenced, say it is
  unidentified. A repository-only item must not become a current-session pending item unless the
  current session explicitly adopts it. Treat time-dependent repository memory as a clue and mark it
  unvalidated unless the canonical source was rechecked.

- Both closeout modes classify in-scope items as addressed, genuinely pending, deliberately
  deferred, or optional; distinguish operator action from work that remains automatic; and
  explicitly state when nothing remains. If the available transcript or compaction is incomplete,
  state the limitation instead of claiming full closure. Each shortcut is read-only and does not
  authorize pending work or mutation.

- `!finish-worktree [target]` is a mutating local closeout distinct from read-only `!closeout`.
  `agents-bootstrap/scripts/agents_bootstrap_finish_worktree.py` is only a facade for the public
  `skill-development-session` FinishWorktree owner. Resolve the canonical catalog through
  `codex-profile`; never accept an arbitrary repository. The owner selects only a registered linked
  worktree directly under `.worktrees/`, never the primary checkout.

- The shortcut authorizes the complete one-shot closeout, including preservation and reconciliation
  of known local untracked/ignored collections in the primary checkout, without intermediate
  approval. Copy absent files, reuse identical files, preserve additional destination records,
  reconcile safe additive changelogs through their owner, and retain both versions of unresolved
  local divergences. Do not transplant `.codex/dev-sessions` into the primary active lifecycle or
  invent consolidated opaque states. Follow
  `skill-development-session/references/worktree-closeout.md`.

- Prove integration by ancestry or exact equality of candidate-changed paths. Block dirty work, Git
  operations, unproven integration, unsafe paths and failed preservation. `FinishWork` closes
  authorship logically; `Close` cleans its projection and must not remove the worktree.
  FinishWorktree owns physical removal, never `--force`, and preserves the branch and terminal
  receipt. It never integrates commits, pushes, synchronizes the skill runtime, or resolves Git
  conflicts.

- For `!closeout` and `!closeout session`, treat the current-session universe as every
  evidence-backed item explicitly discussed or adopted in this session, including work that was
  genuinely pending, deliberately deferred, explicitly left outside the authorized execution scope,
  or optional. After the addressed-scope summary, always render a section titled `Itens
  possivelmente em aberto` as a Markdown table with the columns `Prioridade`, `Item`, `Situação`,
  and `Próxima ação necessária`. Derive priority from session evidence; when no priority is
  evidenced, use `Não informada` instead of inventing one. Do not import items from other sessions
  or create speculative follow-ups. If the table has no eligible item, state exactly `Nenhum item
  possivelmente em aberto.`

- The `Itens possivelmente em aberto` table must not include routine delivery residue. Keep commit,
  push, publication, and catalog-to-runtime synchronization under the terminal `Nota de entrega`
  required by the outcome-first filter. This separation does not erase useful delivery state; it
  prevents delivery residue from being presented as a functional or contextual pending item.

- Apply the outcome-first filter to `!suggest`, `!next-steps`, `!closeout`, `!status`, `!pause`,
  `!handoff`, `!verify`, and `!validate`. Commit, push, publication, and catalog-to-runtime
  synchronization of skills or automations are routine delivery residue: they may appear only after
  result-oriented findings under `Nota de entrega`, never as a functional pending item, and must
  never be the only next action. If no result-oriented item remains, say literally `Nenhuma
  pendência funcional ou contextual.` before an optional delivery note. Promote delivery work out of
  the note only when it is the explicit requested outcome or blocks a proven functional acceptance
  criterion. Explicit delivery shortcuts and delivery-scoped requests retain their own contracts.

- `!validate` is a strict alias for `!verify`; it adds no separate routing, prompt, or authorization
  semantics.

- `!time` depends on `codex-resolution-time`. Do not claim the final current-turn duration before
  the `Stop` hook runs. Sanitized session correlation metadata from that hook may be reused by
  `!usage`.

- `!confirm` and `!authorized` apply only to the exact action most recently proposed by Codex in the
  current conversation.

- `!deploy` only applies to the concrete deploy candidate already identified in the current
  conversation. If environment, target, release, branch, artifact, repository, expected action, or
  production impact is ambiguous, stop and ask for clarification instead of deploying.

- `!commit` authorizes a local commit only when changed files, staging scope, and message intent are
  unambiguous.

- `!retry` and `!again` do not authorize external, production, destructive, irreversible, or remote
  state-changing work unless the normal confirmation guardrails are also satisfied.

- `!review`, `!review local`, and `!review agent` are non-mutating. Resolve the review object,
  scope, modifier, capability, route, and owner through `.agents/references/code-review-routing.md`.
  Supported technical artifacts use `$solution-review` when available or a disclosed artifact-owner
  fallback; `!review agent` never delegates them to `code-reviewer`. `!auto-review` remains a
  separate mutating workflow. Shadow mode covers only code local-versus-agent selection and never
  persists raw prompts.

- `!suggest` is non-mutating. It returns exactly one recommendation using the artifact owner and at
  most one specialized lens when needed. `!suggest explore` is a modifier, not a separate shortcut;
  it may map up to 12 candidates, shortlist at most 3, and use at most three non-overlapping lenses.
  Neither mode accepts scope, edits artifacts, implements work, or activates agents or councils
  automatically. Use `.agents/references/suggestion-system.md` for the full contract.

- `!loop` requires a bounded loop contract before execution: workflow, target, iteration budget,
  stop criteria, and safety policy.

- `!loop` alone does not activate League or Agents of Shield. When the same request explicitly
  activates one of those orchestrators, compose the loop under that orchestrator's contract. League
  owns team orchestration; Agents of Shield remains a diagnostic security council and does not
  require League for the composition.

- `!auto-review` is the preset expansion of League + `!loop` + `$code-review`; it is not another
  skill or orchestration policy. Activate League in the parent session and do not delegate to
  `league-of-agents` itself. The first invocation is plan-only: resolve the Git manifest from
  `upstream..HEAD`, staged, unstaged, untracked, renamed, and deleted files; declare
  `max_iterations=15`; and persist the loop state. Because the budget exceeds eight, require a
  subsequent `!confirm` before mutation. That confirmation never substitutes an authoring binding.

- When the target is the canonical skill catalog, diagnostic review may remain read-only in the
  primary checkout, but authorship uses exactly one linked worktree for the complete changeset.
  After confirmation, run `PlanWorktree` and `ApplyWorktree` once, transfer execution to the
  returned worktree, complete the read-only review, derive the explicit ordered target-skill set
  from the Git manifest and accepted findings, and freeze it before the first write. Wildcards, an
  empty set, a synthetic catalog target, duplicate targets, and a primary skill chosen merely as a
  proxy are forbidden.

- Before correcting, staging, or committing, call `BeginWork -TargetSkills` and require `WorkStatus
  -TargetSkills` to return `work-reusable` for the exact task, worktree and target-set digest.
  Persist the governed authoring fields required by `$autonomous-loop`, keep
  `primary_checkout_mutation: forbidden`, and run the auto-review authoring gate before every
  mutating iteration. A missing receipt, unregistered worktree, changed task, changed target set, or
  path substitution blocks before the write. `!confirm` alone never releases this gate.

- A skill discovered before the first write may be included before the set is frozen. A skill
  discovered after the first write is scope drift: stop the wave and report it; never expand the
  binding silently. Then use `code-reviewer` with `$code-review` for each complete diagnostic pass,
  delegate accepted fixes separately, validate them, and create at most one atomic local commit per
  iteration. Stop on a clean material review, exhausted budget, repeated failure, stalled progress,
  Git conflict, ambiguous commit scope, scope drift, or safety escalation. Never create hooks or
  promise enforcement against human or non-cooperative commands. Never push, merge, rebase, deploy,
  mutate remote state, or resolve conflicts through this shortcut.
