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

| Shortcut           | When to use                                                                                                                       | Simple example                                                                      |
|--------------------|-----------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------|
| `!again`           | Alias for `!retry`; retry the last failed or blocked action with an explicit change.                                              | "The install failed; try again after explaining what changes."                      |
| `!authorized`      | Alias for `!confirm`; authorize only the exact action most recently proposed by Codex.                                            | "Authorize the commit you just described."                                          |
| `!bootstrap`       | Install the default safe bootstrap bundle in the current repository, without `--force` or Graphify hooks.                         | "Apply agents-bootstrap with RTK, resolution-time, self-improvement, and Graphify." |
| `!bootstrap-check` | Preview the default bootstrap bundle with `--dry-run`, without writing files.                                                     | "Show what the default bootstrap would install before applying it."                 |
| `!changelog`       | Record material work in the operational changelog; use `changelog.prompt.md` when available.                                      | "Document today's material change in the changelog."                                |
| `!commit`          | Authorize creation of a local commit when the changed files, staging scope, and message intent are clear.                         | "Commit only the files from this change."                                           |
| `!confirm`         | Authorize only the exact action most recently proposed by Codex in the current conversation.                                      | "Run the command you just proposed."                                                |
| `!continue`        | Accept the proposed approach and continue within the stated local scope.                                                          | "Proceed with that local plan."                                                     |
| `!deploy`          | Authorize deployment to Production by default for the identified deploy candidate.                                                | "Deploy the release we already discussed."                                          |
| `!deploy dev`      | Authorize deployment to DEV for the identified deploy candidate.                                                                  | "Publish this candidate to DEV."                                                    |
| `!deploy hml`      | Authorize deployment to HML for the identified deploy candidate.                                                                  | "Promote this release to HML."                                                      |
| `!deploy prod`     | Explicit equivalent of `!deploy`; authorize deployment to Production for the identified deploy candidate.                         | "Publish this candidate to PROD."                                                   |
| `!deploy qas`      | Authorize deployment to QAS for the identified deploy candidate.                                                                  | "Promote this build to QAS."                                                        |
| `!example`         | Provide one concrete, realistic example for Codex's current proposal, suggestion, or approach.                                    | "Show how this flow would look in practice."                                        |
| `!explain`         | Briefly state whether the last instruction was understood and how Codex would proceed; not a plan or execution approval.          | "Explain how you understood my request before acting."                              |
| `!handoff`         | Prepare a continuity summary for later resumption.                                                                                | "I need to pause; leave a handoff for later."                                       |
| `!help`            | Show human-facing help for the current context; with an explicit skill, explain operator usage without executing it.              | "Show how to use this skill operationally."                                         |
| `!hooks`           | Inspect configured project hooks and hook signals visibly active in the session, without modifying them.                          | "Check which hooks are active in this conversation."                                |
| `!loop`            | Route to `$autonomous-loop` for bounded iterative work with explicit target, iteration budget, stop criteria, and safety policy.  | "Run up to three fix-and-validate cycles."                                          |
| `!next-steps`      | List next steps, risks, and the smallest useful action.                                                                           | "What should we do next?"                                                           |
| `!pause`           | Stop with current state, pending items, and the next action made explicit.                                                        | "Stop here and say exactly what remains."                                           |
| `!pr`              | Prepare or create a pull request only when repository, branch, target, and readiness are unambiguous.                             | "Prepare the PR description for this branch."                                       |
| `!retry`           | Retry the last failed or blocked action after stating what failed and what will change.                                           | "Try again, but correct the previous error first."                                  |
| `!review`          | Review the current state in code-review posture; use local review workflow or `code-reviewer` when coordination helps.            | "Look for bugs, regressions, and missing tests."                                    |
| `!status`          | Summarize current state, progress, blockers, and pending items.                                                                   | "Where are we on this work?"                                                        |
| `!suggest`         | Suggest one grounded improvement, next action, or workflow refinement without implementing it.                                    | "Suggest one useful next refinement."                                               |
| `!summary`         | Summarize the conversation from the available transcript and any explicit compaction summary.                                     | "Summarize what we have decided so far."                                            |
| `!test`            | Run local tests or checks; use `test-driven.prompt.md` only when defining behavior, scenarios, or strategy before implementation. | "Run the checks for the changed scope."                                             |
| `!time`            | Show elapsed session time using `codex-resolution-time` when available.                                                           | "How long has this session been running?"                                           |
| `!usage`           | Use `$codex-usage` when available to report current-session tokens, models, and estimated cost, preferring session ID evidence.   | "What is the approximate usage for this session?"                                   |
| `!verify`          | Run or describe relevant verification; prefer `verification.prompt.md` when non-trivial or drift is plausible.                    | "Check whether the implementation satisfies the objective."                         |

## Safety Notes

- Treat all `!` shortcuts as intent signals for the current conversation, not as permission to
  bypass repository, production, external-mutation, or irreversible-action guardrails.

- `@Agents Shortcuts` is read-only: listing or explaining shortcuts does not execute any shortcut.
  Use `@Agents Usage` to understand Council, League, or custom-agent orchestration.

- `!help` is read-only. It must not run probes, install tools, mutate files, call external systems,
  read secrets, or infer missing operational targets.

- When paired with an explicit skill mention, `!help` translates the skill contract into operator
  language. Prefer the skill README when available, then `SKILL.md` activation cues, safety rules,
  and `When Not to Use`. Keep script commands secondary; the primary output should teach the
  operator how to ask for the work.

- `!bootstrap-check` expands to a dry-run of `agents-bootstrap` in the current repository with
  `--with-rtk`, `--with-resolution-time`, `--with-self-improvement`, and `--with-graphify`.

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

- `!summary` is limited by the transcript available to the model. If prior turns were compacted or
  unavailable, state that limitation.

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

- `!loop` requires a bounded loop contract before execution: workflow, target, iteration budget,
  stop criteria, and safety policy.
