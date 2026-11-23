---
title: "Frontend Workflow"
doc_role: skill-reference
---

# Frontend Workflow

This is the shared operational selection contract for UI/frontend requests. The SKILL-009 guide
explains this contract for operators; consumers need only this installed reference and the selected
resources. Do not require a catalog checkout or hardcode its path.

## Recommendation and execution

Resolve two independent decisions: who owns the work and what the current request authorizes.

- In `!next-workflow ui` (or any workflow recommendation), select the route below and prepare the
  recommendation only. Do not spawn agents, change files, install resources or execute the route.

- For a live implementation/correction request, use the same selection criteria and actually
  delegate the bounded frontend task to `frontend-engineer` when available. This installed rule
  explicitly requests delegation, including cohesive frontend fixes; generic preferences for
  centralized execution do not cancel it.

- For review, exploration or an upstream decision, preserve that stage's write boundary. Selecting a
  specialist never authorizes implementation, Git actions, publication or external mutation.

This is instruction-based routing, not a native `auto_trigger` field, hook classifier or daemon.
Skill `allow_implicit_invocation` permits skill matching; it does not guarantee agent dispatch.
Prove observed activation with a real spawn, not a description or a declared route.

## Resolve intent before selecting resources

1. Resolve the immediate user instruction and full authorized scope. Quoted prompts, screenshots,
   examples, historical work and questions about agents are evidence, not execution requests.

2. Apply scoped negations and constraints first, including “do not implement”, “review only” and
   “somente na prévia”. Help and meta requests do not trigger execution.

3. Honor an explicitly chosen agent, skill or local/no-subagent mode within its actual capability.
   An explicit skill alone does not request a different agent. Do not override `software-developer`
   with `frontend-engineer` when the user explicitly selected the former.

4. Classify the outcome and stage, not just words such as frontend, responsive or polish. A frontend
   implementation task includes a bounded UI correction; a backend task with a frontend mentioned as
   context does not.

5. Split separable mixed-domain tasks without dropping backend, data, security or integration scope.
   Keep unresolved ownership with the coordinator; clarify only material ambiguity.

6. Inspect the selected agent/skill contract and capability before dispatch. Use only the smallest
   sufficient route; do not activate every row or manufacture a design phase for an existing UI.

## Selection matrix

| Requested outcome                                                                    | Owner and procedure                                                       | Boundary                                                                                        |
|--------------------------------------------------------------------------------------|---------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| Implement an approved direction or fix frontend behavior                             | `frontend-engineer` with `frontend-development`                           | Actually delegate in execution mode; preserve scope, stack, UI states, accessibility and tests. |
| Reproduce and correct UI reflow, overflow, unstable size or loading parity           | `frontend-engineer`, `frontend-development`, conditional `responsiveness` | Reproduce first; select audit/adapt/verify as needed; no aesthetic redesign.                    |
| Establish unresolved visual direction                                                | `ui-designer` or local `frontend-design`                                  | Produce a design contract; return it to the coordinator before implementation.                  |
| Review existing UI independently                                                     | `ui-reviewer`                                                             | Diagnostic only; the implementer cannot certify its own pass as independent.                    |
| Explicit Impeccable command, or clearly requested elaborate visual exploration/craft | `ui-impeccable-specialist` with `impeccable`                              | Delegate the selected command; preserve preflight, context and confirmation gates.              |
| Research UX patterns                                                                 | local `ui-ux-pro-max`                                                     | Focused input; no new global design system by default.                                          |
| Compare alternatives in conversation                                                 | local `visualize`                                                         | A conversational preview is not application implementation or validation.                       |
| Bounded non-frontend implementation or explicitly selected generalist                | `software-developer`                                                      | May use frontend skills locally; no mandatory chain of subagents.                               |
| Test strategy or independent verification that materially adds value                 | `quality-analyst`                                                         | Bounded quality work; no automatic cascade after every fix.                                     |

For alternatives, four variants alone do not require Impeccable; preserve the requested number and
origin of variants with consistent content and viewports. UI/UX Pro Max can guide corrections and
implementation as well as research.

Stitch proposals and extracted design descriptions remain inputs to `frontend-design`; they do not
override the product's approved design system. Use `design-system` for applicable SAT EAM adoption,
not to invent an alternative system. Resolve the actual stack and project contracts first.

## Optional companions

`frontend-development` supplies the baseline implementation contract. When `responsiveness` is
available and responsive/loading behavior is material, consult it and resolve the relevant mode.
Preserve basic responsive checks when the companion is absent and report limited coverage.

Do not turn one overflow fix into repository-wide setup. Missing `responsiveness.config.json` does
not authorize creating a full repository contract or installing a runner. When full `responsiveness
verify` is selected, its configuration and coverage requirements remain mandatory; report the
missing prerequisite instead of claiming that a few screenshots satisfy that mode.

Impeccable owns visual hierarchy, craft and the selected command. Responsiveness owns reflow,
overflow, wrapping, stable dimensions, representations, skeletons and loading fidelity. Reuse
approved visual decisions; return conflicts to the coordinator.

A functional bug, overflow or breakpoint alone does not trigger Impeccable. Explicit
`shape/craft/audit/polish` intent or a clearly scoped request for elaborate visual work does. “Show
alternatives before implementing” keeps the specialist in exploration; `audit` remains diagnostic.
Do not bypass `PRODUCT.md`, applicable design context, `IMPECCABLE_PREFLIGHT`, command references or
brief confirmation. Selection does not satisfy any of those gates.

## Coordination and handoff

The coordinator retains the full mission, adjudication, sequencing and final delivery.
`frontend-engineer` and `software-developer` are sibling implementers, not dependencies of each
other. Specialists do not recursively reroute their own delegated task or spawn their sibling;
return a bounded handoff to the coordinator when another owner is needed.

Before delegation, pass:

- objective, requested stage and authorization/write boundary;
- approved visual contract, stack evidence and observable expected behavior;
- files/surfaces owned, excluded paths and other active writers;
- relevant inputs, reproduction steps, viewport/state constraints and acceptance criteria;
- checks available, required evidence, missing capabilities and unresolved decisions.

Assign one writer per file at a time. Sequence Impeccable output and frontend integration when they
touch the same files. Preserve others' edits; never dispatch overlapping work to improve speed.
Reuse valid evidence, and distinguish observed application behavior from inferred source behavior.

Return files inspected/changed, procedure/command used, reproduction and correction, validation
actually performed, coverage, gates still pending and residual risks. Promote reusable visual
decisions through `ui-designer/frontend-design` only when that promotion is authorized.

## Capability and fallback

- Agent unavailable: disclose it. For an ordinary implementation, use the available baseline skill
  locally only if it preserves the authorized outcome; never claim that delegation occurred.

- Explicitly requested agent or independent pass unavailable: report the capability gap and obtain a
  compatible choice; do not silently replace independence or the named capability.

- Optional skill unavailable: keep baseline capability and name the narrower evidence. Do not
  install or synchronize resources as a routing side effect.

- Mandatory design decision, configuration, runner, data or browser unavailable: complete the checks
  possible and report the exact unverified requirement. Do not claim visual acceptance or change
  tooling without the relevant authorization.

Declared links are conditional procedure references or coordination handoffs. Installation
dependencies belong to the skill package manifest only when genuinely required; agent-to-agent
handoffs do not belong in `skill-dependencies.json`.

## Evidence and acceptance

Distribution/parsing tests prove packaging; contract checks prove declared rules. Neither proves a
model used the router. Behavioral acceptance requires a fresh isolated session that reads these
instructions, receives an ordinary frontend request without an agent mention, and actually spawns
`frontend-engineer`. Test the consultative shortcut and negative requests separately, with no spawn
or edits when those outcomes are forbidden.

For the piloti-editor case, use a disposable preview fixture: reproduce the size jump while width
decreases and the 729/730 px height transition. Preserve “somente na prévia”, use
`frontend-development` and conditional `responsiveness`, and do not activate Impeccable merely
because the defect is visual. Derive surrounding widths, container constraints, orientation and
states from the actual fixture; do not infer universal breakpoints from the reference screenshot.

Report commands, viewports, states and interactions actually reached. DOM or screenshot evidence
alone cannot certify keyboard/focus/loading/error behavior. Record catalog implementation, isolated
activation and installation in consumer projects as separate evidence classes. Never claim
deterministic model compliance, global activation or reloading of an already open chat.
