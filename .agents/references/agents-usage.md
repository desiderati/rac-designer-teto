# Agents Usage

Use this reference when the repository has Codex custom agents under
`.codex/agents/` and the user asks `Agents Usage`, enables team mode, or asks
for automatic agent orchestration.

## Intent Separation

- `Agents Usage` or `@Agents Usage`: explain how agent orchestration works in
  this repository.
- `Agents Examples`, `Agents Example`, `@Agents Examples`, or `@Agents Example`:
  show examples from `.agents/references/agents-examples.md` and do not spawn
  subagents.
- `league of agents`, `liga dos agentes`, `modo equipe`, `@League of Agents`,
  or similar phrases: evaluate whether subagents should be used for the current
  task.

Do not treat a request for examples as permission to execute agents.
Do not treat `@Agents Usage` or `@Agents Examples` as permission to execute
agents.

## Team-Mode Flow

When the user enables team mode:

1. Read `.agents/prompts/league-of-agents.prompt.md`.
2. Read `.agents/references/agents-roles.md`.
3. Decide whether delegation is useful.
4. If useful, choose the smallest sufficient set of agents.
5. Define scope, out-of-scope, inputs, expected output, and write boundary for
   each delegated agent.
6. Consolidate outputs before responding to the user.

The project-scoped `@League of Agents` custom agent is a shortcut for this
same flow. It is an orchestration entrypoint, not an additional specialist
role.

## When To Use Agents

Use agents when role separation creates concrete value:

- product scope and technical design need separate judgment
- architecture, implementation, tests, and review can proceed as separate
  fronts
- root-cause investigation has independent hypotheses or evidence sources
- codebase exploration can reduce uncertainty before design or implementation
- security triage or contextual security review materially reduces release risk
- documentation review and implementation review should remain independent
- a final specialist review materially reduces delivery risk

## When Not To Use Agents

Keep work centralized when:

- the task is simple
- the workflow is linear and sequential
- delegation would duplicate effort
- write scopes cannot be separated cleanly
- consolidation would be more expensive than the task itself

## Recommended Chat Triggers

```text
@League of Agents investigue este bug e use os agentes adequados apenas se isso agregar valor.
```

```text
league of agents: investigate this bug and use the appropriate agents only if useful.
```

```text
liga dos agentes: desenhe a solução, especifique testes e implemente apenas se o plano estiver claro.
```

```text
modo equipe: use produto, arquitetura, qualidade, implementação e revisão quando isso agregar valor.
```

```text
league of agents: map this area with `code-explorer`, then design and implement the smallest safe change.
```

```text
modo equipe: use `security-advisor` para revisar superfícies sensíveis antes da resposta final.
```

```text
@Agents Examples
```

```text
@Agents Usage
```

```text
Agents Usage
```

```text
Agents Examples
```

## Parent-Agent Responsibilities

The parent agent remains accountable for:

- deciding whether delegation is justified
- avoiding overlapping scopes
- passing only necessary context
- consolidating contradictions
- preserving repository rules
- producing the final user-facing answer
