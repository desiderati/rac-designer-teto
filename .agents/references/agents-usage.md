# Agents Usage

Use this reference when the repository has Codex custom agents under `.codex/agents/` and the user
asks `Agents Usage`, enables team mode, or asks for automatic agent orchestration.

## Intent Separation

When called, `Agents Usage` should explain the orchestration entrypoints with a short usage
description and a simple situation where each one fits. Do not list the compact `!` shortcuts here;
point the user to `@Agents Shortcuts` for that catalog.

| Command                                                                       | When to use                                                                                             | Simple example                                                                        |
|-------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------|
| `Agents Examples`, `Agents Example`, `@Agents Examples`, or `@Agents Example` | Show examples from `.agents/references/agents-examples.md` without spawning subagents.                  | "Show practical examples for the installed custom agents."                            |
| `Agents Shortcuts`, `Agents Shortcut`, or `@Agents Shortcuts`                 | Show compact `!` chat control shortcuts with when-to-use guidance and examples, without executing them. | "Which `!` commands can I use here?"                                                  |
| `Agents Usage` or `@Agents Usage`                                             | Explain how custom agent orchestration works in this repository.                                        | "When should I use subagents instead of keeping the work centralized?"                |
| `@Council of Agents` or `@Fellowship of Agents`                               | Directly invoke the project-scoped Council custom agent for a qualifying decision.                      | "@Council of Agents pressure test this architecture choice."                          |
| `@League of Agents`                                                           | Directly invoke the project-scoped League custom agent for team-mode orchestration.                     | "@League of Agents investigate this bug and use specialists only if useful."          |
| `council of agents`                                                           | Use the Council flow by its natural-language name.                                                      | "council of agents: should I build or buy this automation?"                           |
| `council this`                                                                | Use a compact textual cue for the Council flow when a decision needs structured debate.                 | "council this: should I buy a tool or build an internal automation?"                  |
| `debate this`                                                                 | Ask Council to compare competing positions before implementation.                                       | "debate this: should the integration live in the API or worker?"                      |
| `fellowship of agents`                                                        | Use the Fellowship alias for the same Council flow.                                                     | "fellowship of agents: I'm torn between these two release options."                   |
| `league of agents`                                                            | Evaluate whether subagents should be used for a non-trivial task with separable fronts.                 | "league of agents: investigate this bug and use specialists only if that adds value." |
| `premortem this`                                                              | Use the Council posture to identify likely failure modes before committing to a plan.                   | "premortem this: what will probably break in this rollout?"                           |
| `pressure test this`                                                          | Challenge a proposal, plan, or decision before it becomes implementation work.                          | "pressure test this migration plan before I start changing code."                     |
| `stress test this`                                                            | Stress-test a decision, plan, or assumption against likely failure pressure.                            | "stress test this: what breaks if traffic triples?"                                   |
| `war room this`                                                               | Use the Council posture for a tense or risky decision where containment, trade-offs, and timing matter. | "war room this: production is failing and I need to choose containment."              |

Do not treat a request for examples as permission to execute agents. Do not treat `@Agents Usage`,
`@Agents Shortcuts`, or `@Agents Examples` as permission to execute agents or shortcuts. Do not
treat an ordinary implementation request as a Council request unless the user asks for pressure
testing or multiple decision perspectives.

## Council-Mode Flow

When the user invokes one of the Council trigger phrases:

1. Read `.agents/prompts/council-of-agents.prompt.md`.

2. Read `.agents/references/agents-roles.md`.

3. Confirm the request is a high-stakes decision or meaningful trade-off.

4. Enrich the question with the smallest relevant workspace context.

5. Run the five advisor lenses independently when subagents are available.

6. Anonymize advisor responses for peer review.

7. Synthesize as Chairman, producing a clear recommendation and first action.

8. Save `council-report-[timestamp].html` and `council-transcript-[timestamp].md`, preferably under
   `.agents/council-sessions/YYYY-MM/`.

These trigger phrases are shortcuts for the same decision-council flow. They are not specialist
roles for downstream delegation.

## Team-Mode Flow

When the user enables team mode:

1. Read `.agents/prompts/league-of-agents.prompt.md`.
2. Read `.agents/references/agents-roles.md`.
3. Decide whether delegation is useful.
4. If useful, choose the smallest sufficient set of agents.
5. Define scope, out-of-scope, inputs, expected output, and write boundary for each delegated agent.
6. Consolidate outputs before responding to the user.

The `league of agents` phrase and direct `@League of Agents` invocation are shortcuts for this same
flow. They are orchestration entrypoints, not additional specialist roles.

## When To Use Agents

Use agents when role separation creates concrete value:

- a high-stakes decision benefits from independent pressure testing through Council of Agents
- product scope and technical design need separate judgment
- architecture, implementation, tests, and review can proceed as separate fronts
- root-cause investigation has independent hypotheses or evidence sources
- codebase exploration can reduce uncertainty before design or implementation
- security triage or contextual security review materially reduces release risk
- documentation review and implementation review should remain independent
- a final specialist review materially reduces delivery risk

## When Not To Use Agents

Keep work centralized when:

- the task is simple
- the question has one factual answer and does not need a decision council
- the workflow is linear and sequential
- delegation would duplicate effort
- write scopes cannot be separated cleanly
- consolidation would be more expensive than the task itself

## Recommended Chat Triggers

| Trigger                                                                                                   | Good fit                                                                              |
|-----------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------|
| `@Agents Examples`                                                                                        | "Show examples for the installed custom agents."                                      |
| `@Agents Shortcuts`                                                                                       | "List the accepted `!` shortcuts with simple examples."                               |
| `@Agents Usage`                                                                                           | "Explain when to use agents, Council, or League in this repository."                  |
| `@Council of Agents pressure test this pricing decision before I build anything.`                         | Direct Council invocation for high-stakes trade-off analysis.                         |
| `@Fellowship of Agents debate this release strategy before I commit.`                                     | Direct Fellowship alias for the same Council flow.                                    |
| `@League of Agents investigate this bug and use specialists only if useful.`                              | Direct League invocation for bounded team-mode evaluation.                            |
| `council of agents: should I hire someone or build an automation first?`                                  | Natural-language Council request.                                                     |
| `council this: should I hire someone or build an automation first?`                                       | Compact decision-council request.                                                     |
| `debate this: should this move to an async worker or stay synchronous?`                                   | Council request for comparing competing positions.                                    |
| `fellowship of agents: I'm torn between these two architecture approaches.`                               | Fellowship alias for a decision-council request.                                      |
| `league of agents: map this area with code-explorer, then design and implement the smallest safe change.` | Team-mode request with a specific exploration role and bounded implementation target. |
| `premortem this: identify how this rollout could fail before implementation.`                             | Council request focused on failure modes before execution.                            |
| `pressure test this: I'm choosing between these two architecture approaches.`                             | Council request for adversarial review of a proposal or choice.                       |
| `stress test this: what breaks if this endpoint receives ten times more traffic?`                         | Council request focused on pressure and failure modes.                                |
| `war room this: production is failing and I need to choose containment.`                                  | Council request for urgent decision pressure testing.                                 |

## Parent-Agent Responsibilities

The parent agent remains accountable for:

- deciding whether delegation is justified
- avoiding overlapping scopes
- passing only necessary context
- consolidating contradictions
- preserving repository rules
- producing the final user-facing answer
