# Collaboration and Automation

## Agent-created chat titles

Use exactly one leading `🤖 ` to identify a visible chat created by another Codex session through an
already authorized `create_thread` or `fork_thread` action. This is an agent instruction, not a
native application badge or a guarantee against later manual renames.

- For `create_thread`, supply `title` as `🤖 <descriptive title>` at creation, preserving the
  operator's wording and other emojis. Do not add a second robot prefix when one is already present.

- For `fork_thread`, apply the prefix to the child through `set_thread_title` after obtaining its
  actual `threadId`; preserve the source chat. A pending `clientThreadId` is not a `threadId`. Use
  the creation operation's supported completion mechanism if available; otherwise report the marking
  as pending without inventing an ID, launching a watcher or creating an automation.

- On an already authorized agent rename, preserve one prefix when the chat has it or accessible
  evidence proves creation by another session. Use the new descriptive title without accumulating
  prefixes. A marker is a naming convention, not proof of provenance or authority.

- Respect an explicit request for an exact title or removal of the marker. A title suggestion
  without an exact-title requirement may receive the prefix.

- Do not mark manually created chats or chats of unknown origin. Branch names, worktrees,
  conversation content and participation of subagents do not prove chat creation. `spawn_agent` does
  not by itself create a user-visible chat covered by this convention.

- Check the title returned by the creation or rename tool when available. If normalization removes
  the prefix, use `set_thread_title` for the same newly created chat when supported. Claim marking
  as confirmed only when tool evidence confirms the resulting title; otherwise state that it is
  unverified or pending. On tool failure, report the failure without claiming success.

This convention does not authorize creating or forking chats, sending messages, renaming unrelated
or historical chats in bulk, or changing a title the operator explicitly chose. It applies only
within an already authorized chat-management action; retain the tool's ordinary authorization and
identity requirements.

## Native subagent continuation

For a proven descendant's `!finish-worktree`, the parent may coordinate a continuation of that
existing agent through the native agent controller when available. Preserve the original author
identity and forward only the requested target and authorized mode. A readable chat, a title, or an
app-server message refusal does not prove native resumability or its absence. Do not use
`send_message_to_thread` to initialize v2 subagents. Other chats retain their channel's consent
requirements; the closeout shortcut does not authorize sending to them. Verify the SDS receipt and
passive `InspectCloseout` result before reporting completion. The complete route and restricted
recovery are in `.agents/references/agents-shortcuts.md`.

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

Before starting large or high-impact work, confirm the objective and keep the scope explicit. Show
2-3 viable approaches and wait for the user to choose unless an approved upstream plan already
selected the approach.

Large work includes:

- architectural changes
- broad refactors
- risky migrations
- multi-module behavior changes
- documentation moves with high coordination cost

For architecture decisions, performance trade-offs, database design, complex debugging, non-trivial
features, or long-term technical decisions, make the trade-offs, assumptions, uncertainty, and scale
risks explicit before implementation. Do not hide a significant choice inside execution.

---

## Workflow improvement signaling

When working on this repository's agent workflow, prompts, templates, or related operational
conventions, the agent may signal that there may be a useful improvement to the workflow itself, but
only under strict conditions:

- only signal it at the end of the task or session, never in the middle of the main flow

- only signal it when there is real evidence of friction, ambiguity, redundancy, or a workflow gap

- signal at most one possible improvement per session

- classify the suggestion explicitly as either:
    - core improvement to the repository workflow
    - local adjustment for the current repository context or working style

- do not apply the improvement automatically

- do not turn the signal into a parallel planning flow unless the developer explicitly asks to
  explore or implement it

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

- Were production guardrails respected, including explicit confirmation before any state-changing
  action on production-critical or external runtime surfaces?

- Were external send, publish, share, invite, schedule, deploy, migration, schema, and irreversible
  actions confirmed in the current user message?

- If an agent execution error occurred, was `.agents/errors.md` updated only when the error was
  clear and evidenced by the user or transcript?
