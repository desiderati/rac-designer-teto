# Collaboration and Automation

## Automation rules

Automation is allowed, including:

- end-of-session summarization
- last-commit-assisted changelog generation
- Git hooks that trigger an agent workflow
- scheduled consolidation routines

But automation must follow these rules:

- automation is a trigger or assistant, not blind authorship
- preserve technical meaning, not just file diffs
- keep links to evidence, decisions, and pending items
- avoid turning trivial changes into durable knowledge
- avoid duplication between changelog blocks and knowledge notes
- prefer real continuity over artificial volume

Git diffs and commits can help, but they do not replace reasoning about why the change happened.

---

## Collaboration rule for large work

Before starting large or high-impact work, confirm the objective and keep the scope explicit.

Large work includes:

- architectural changes
- broad refactors
- risky migrations
- multi-module behavior changes
- documentation moves with high coordination cost

---

## Workflow improvement signaling

When working on this repository's agent workflow, prompts, templates, or related operational conventions, the agent may
signal that there may be a useful improvement to the workflow itself, but only under strict conditions:

- only signal it at the end of the task or session, never in the middle of the main flow
- only signal it when there is real evidence of friction, ambiguity, redundancy, or a workflow gap
- signal at most one possible improvement per session
- classify the suggestion explicitly as either:
    - core improvement to the repository workflow
    - local adjustment for the current repository context or working style
- do not apply the improvement automatically
- do not turn the signal into a parallel planning flow unless the developer explicitly asks to explore or implement it

The preferred format is short and operational:

- possible improvement identified
- scope: core | local
- reason: what concrete friction or gap was observed
- smallest useful change: the minimum adjustment that would improve the workflow
- action: ask whether the developer wants to ignore it, record it, or implement it

This is a signal, not a self-modification mechanism.

---

## Final quality bar

Before considering a task complete, ask:

- Was the relevant context read first?
- Was the right prompt chosen for the task?
- Were facts separated from hypotheses?
- Was trial-and-error avoided?
- Was the smallest useful change preferred?
- Were production guardrails respected, including explicit confirmation before any state-changing action on

