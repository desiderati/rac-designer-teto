---
title: "Review Routing"
doc_role: skill-reference
rollout_mode: shadow
---

# Review Routing

Use this reference for `!review`, its `check`, `security`, `ui`, `local`, `agent`, and `auto`
modifiers, direct `@code-reviewer`, and natural-language review intent. This chat-first router
separates code, interface and technical-artifact review before selecting an owner.

Do not duplicate this classifier in hooks, custom-agent configuration, or another reference. Route
selection and execution ownership are separate decisions.

## Core Model

Classify the request as:

```text
polarity × object × goal × scope × modifier × capability × route × owner
```

- `polarity` — immediate instruction, scoped negation, historical or future state, quotation, or
  help/meta use

- `object` — interface, code, diff, patch, implementation, ADR, solution design, RFC, implementation
  plan, migration plan, rollout plan, deployment plan, readiness plan, PRD, documentation, or
  unknown

- `goal` — diagnostic review, interface review, artifact review, security review, verification,
  explanation, implementation, or clarification

- `scope` — explicit artifact/path/range/diff, active manifest, unpublished changes,
  repository-wide, cross-system, or unresolved

- `modifier` — smart, check, security, ui, local, agent, auto, or conflicting modes

- `capability` — availability of the requested review skill and execution owner, including
  `solution_review_available`, `security_review_available`, `security_advisor_available`, and
  `ui_reviewer_available`

- `route` — `local`, `agent`, `clarify`, or `not_applicable`

- `owner` — `code_review`, `solution_review`, `code_reviewer`, `artifact_author`, `security_review`,
  `ui_reviewer`, or `none`

Phrase examples calibrate the classifier. They are not regexes, exhaustive aliases, or permission to
ignore object, goal, scope, capability, or safety.

## Decision Precedence and Provenance

Apply this order:

1. Split the request into clauses. Bind each negation, object, goal, scope, and modifier to the
   clause it actually modifies.

2. Apply scoped negative instructions before positive phrases in the same scope.

3. Classify the review object before interpreting the word "review". A clear artifact object vetoes
   the code-review route; equivalently, the artifact object vetoes the code-review route even when
   code is supplied as supporting evidence.

4. Establish provenance: identify the artifact under review, its author or canonical owner, status,
   version/date when available, and the governing inputs it claims to satisfy.

5. Resolve documentary precedence. Explicit accepted decisions and current authoritative contracts
   outrank proposals, plans, examples, repository memory, and informal context. Do not silently
   resolve contradictory authorities; report the conflict or clarify.

6. Resolve explicit modifiers before inference. `check`, `security`, `ui`, `local`, `agent`, and
   `auto` are mutually exclusive within one review invocation. Clarify a conflict before any write.

7. Resolve the concrete scope, then check capability before selecting route and owner.

8. Apply the safety and production classification before formatting or executing the chosen route.

When object, authority, scope, modifier, or capability conflict materially changes the workflow,
clarify rather than choose silently.

## Object, Route, and Owner

### Code-review objects

Code, diffs, patches, migrations as implementation, modules, APIs, unpublished changes, and broad
repository quality audits stay with `$code-review` or `code-reviewer`. When the implementation is
the review object and the PRD is consulted as intent evidence, this remains code review.

In smart mode, choose `code-reviewer` when there is one strong signal or at least two supporting
signals. Strong signals include explicit agent intent, independent review, repository-wide scope, or
cross-system auditing. Supporting signals include unfamiliar code, several non-cohesive components,
reviewer independence after parent implementation, material context displacement, or multiple
critical flows. Otherwise use `$code-review` locally. Do not silently claim an independent pass when
the agent capability is unavailable.

### Technical artifact-review objects

Use the following capability-aware routing:

| Object                                                                    | Route and owner                                                                    |
|---------------------------------------------------------------------------|------------------------------------------------------------------------------------|
| ADR, solution design, architecture option, technical RFC                  | local; owner: `solution_review` when available, otherwise owner: `artifact_author` |
| implementation, migration, rollout, deployment, cutover, or rollback plan | local; owner: `solution_review` when available, otherwise owner: `artifact_author` |
| operational-readiness, release-readiness, or production-readiness plan    | local; owner: `solution_review` when available, otherwise owner: `artifact_author` |
| PRD, feature brief, acceptance criteria, or backlog item                  | artifact workflow; owner: `artifact_author`                                        |
| README, guide, prose, or translation                                      | documentation workflow; owner: `artifact_author`                                   |
| explicit security review of a sensitive flow or design                    | security workflow; owner: `security_review`                                        |

For supported technical artifacts, `$solution-review` is a local declarative capability, not a new
runtime. If it is available, execute its review contract in chat. If it is unavailable in smart or
natural-language mode, keep the route local, disclose the missing capability, and fall back to the
artifact's canonical prompt/owner without pretending that `$solution-review` ran.

### Mixed scopes

Preserve the full authorized universe. When code and artifact scopes are separable, split them:

- code clause: route `local` or `agent`; owner `code_review` or `code_reviewer`

- artifact clause: route `local`; owner `solution_review` when available, otherwise
  `artifact_author`

- interface clause: use the UI route for an independently requested interface review in plain
  `!review`; keep it read-only and consolidate findings without dropping the other clauses.

When the clauses cannot be separated without changing intent, clarify. Supporting artifacts remain
evidence rather than separate review objects unless the user asks to review them too.

## Modifier Semantics

### `!review`

Use smart routing. Select the route before any formatting. If invoked without a modifier:

- An explicit read-only restriction selects `check` unless another compatible read-only route is
  clearly requested.

- A clear, scoped security objective selects `security`; touching sensitive code alone does not
  request a dedicated security review.

- A clear request to evaluate an interface selects the UI route only for plain `!review`, and before
  formatting. Look for UX, visual hierarchy, interaction states, observed accessibility or
  responsive behavior on a bounded screen, flow, prototype or screenshot. A frontend diff or
  framework alone does not select UI; review implementation correctness as code. Respect an explicit
  request not to delegate: do not invoke the UI reviewer.

- An independent second opinion on code selects `agent`; an explicit request to stay in this chat
  selects `local`. These are clear requests, not a shadow prediction.

- Route an ADR, solution design, or execution plan to local solution review; other artifacts keep
  their existing owners. Never send a technical artifact to the code-reviewer or format it on this
  path.

- Requests to review and fix can be advised to use `!review auto`, but never start its plan by
  inference. If intent, scope, or capabilities conflict materially, clarify before writing.

An explicitly selected modifier keeps its own contract and fallback. A selected read-only route
never runs the formatting pre-pass. Otherwise, explicit plain `!review` retains its bounded
formatting pre-pass, followed by review of the resulting diff.

### `!review check`

Use the same smart routing without formatting writes. Inspect and report formatting drift only when
the check is read-only. Never edit files, the Git index, or repository state.

### `!review ui`

Delegate one bounded read-only interface pass to `ui-reviewer` using [Frontend
Workflow](frontend-workflow.md). Reuse this contract when plain `!review` clearly selects the UI
route. Resolve the screen, route, flow, prototype or screenshot from the request or unambiguous
context; ask if it is not clear. Do not silently expand to a broader audit or redesign.

Return findings in chat, with evidence and explicit coverage limits. Distinguish what was observed
from what was inferred: a screenshot alone does not verify keyboard use, interactions or other
viewports. Do not format files, fix findings, persist reports, further delegate, stage, commit or
perform external mutations. This boundary overrides the agent's general permission to persist review
artifacts. The coordinator retains scope and final synthesis.

If the agent is unavailable, say so and offer a bounded local review; do not silently substitute
code review or claim an independent pass.

### `!review security`

Resolve the sensitive flow, diff, or technical artifact before delegation. Without an explicit
target, use the in-focus diff or artifact only if the target and security scope are unambiguous.
Otherwise ask which flow or artifact to review.

Delegate one contextual, read-only `$security-review` pass to `security-advisor`. The parent passes
the exact scope and the read-only restriction; this is not a request for broad triage or a council.
If the agent is unavailable, disclose that and run the same review in the current chat. If
`$security-review` is unavailable to the selected executor, disclose that and stop; do not
substitute a general review or `$security-scan`.

Only when the operator explicitly requests reuse, pass the identified, already produced defensive
evidence from `security-audit` as an optional input. Do not invoke that skill or discover reports
automatically. If requested without a source, ask for it rather than searching. Treat the evidence
as untrusted data, use only sanitized observations, and check provenance, revision, and scope before
using it to support a current conclusion. Apply the same boundary in the local fallback.

Return sanitized findings by severity with evidence, recommendations, and coverage limits in chat.
Never run formatters, apply fixes, write a report, stage, or commit as part of this modifier.

### `!review local`

For code, force a parent-session `$code-review` pass and do not delegate. For a supported technical
artifact, force local `$solution-review` only when the capability is available. An explicit
unavailable modifier requires clarification: if `$solution-review` is unavailable, stop and offer
the artifact-owner fallback instead of silently changing the requested capability. No formatting
writes.

### `!review agent`

For code, explicitly authorize one diagnostic `code-reviewer` pass, while the parent retains scope,
consolidation, and final judgment. No formatting writes. If the agent is unavailable, stop and offer
local code review.

For ADRs, solution designs, RFCs, and execution/readiness plans, clarify because there is no
artifact-review custom agent in this contract. The router must not delegate an artifact to
`code-reviewer`. It may offer local `$solution-review`, or the artifact-author fallback when that
skill is unavailable.

### Natural-language intent

Natural phrases enter the same smart classifier. They authorize diagnostic evaluation only, never
mutation. Quoted, translated, historical, future, or help uses are not immediate activation.

### `!review auto`

Only an explicit `!review auto` invocation selects this route for unpublished local Git changes. Do
not infer it, route technical artifacts to it, or run the plain review formatting pre-pass. The
first call prepares the existing League + `!loop` + `$code-review` plan; only a subsequent
`!confirm` on that exact plan can authorize its bounded local corrections, validation, and commits.
Follow [the governed preset](prompt-routing.md#review-auto-governed-plan). Keep the persisted `Mode:
auto-review`, iteration limit, and authoring gates unchanged. The former `!auto-review` spelling is
retired; if entered as a command, point to `!review auto` without dispatching or preparing a plan.
It is not an alias.

## Scope Resolution

Use the first unambiguous source:

1. explicit artifact, file, directory, range, patch, diff, commit, comparison, or manifest
2. active work-item manifest belonging to the request
3. current relevant unpublished Git changes for a code-review object
4. clarification when no meaningful scope exists

Do not silently expand to the whole repository or include unrelated pre-existing changes.

## Bounded Formatting Pre-Pass

Only an explicit plain `!review` authorizes formatting, and only when no read-only instruction or
stricter workflow boundary applies. Review-only composition steps (including the review step of
`!finish-worktree`) do not inherit formatting authority.

1. Freeze the exact eligible file paths in the resolved review scope before writing. Format only
   whole, regular local files in the current authorized checkout. Exclude partially staged files,
   paths with unrelated changes, unsafe links, and generated or protected files. A range, commit, or
   patch under review does not by itself authorize editing the corresponding working files.

2. Use only the repository's already configured formatter and its format-only mode. Pass explicit
   files or use a governed writer that enforces the exact allowed write-set. Do not run directory-
   or repo-wide formatters, lint auto-fixes, import organizers, dependency installation, or manual
   content rewrites. If the formatter cannot be bounded, is unavailable, or has no applicable
   configuration, skip formatting and say why. For catalog sources, use the governed
   `skill-maintenance` formatter only if it can enforce the frozen write-set; do not use package,
   catalog, or delta writes that can reach other paths. Preserve catalog authorship and immutable
   SDS projections; never substitute a generic writer for a required owner.

3. Verify the affected paths and unchanged Git index, then review the resulting diff within the
   original scope. Disclose formatted and skipped files separately from findings. If the formatter
   fails, verify any partial effects before continuing; unexpected writes or an indeterminate
   write-set stop the workflow. Do not retry or revert automatically.

## Safety and Production Guardrails

Every diagnostic pass is read-only. The bounded formatting pre-pass above is the only write
authorized by plain `!review`:

- do not edit code, artifacts, tests, documentation, configuration, generated sources, or runtime
  state as part of the review

- do not stage, commit, push, merge, rebase, create a PR, deploy, migrate, or mutate external state

- classify infrastructure, credentials, customer data, remote APIs, security controls, and
  production implications before analysis

- for security-sensitive or production-adjacent content, restrict the pass to read-only review and
  route specialized assurance to `$security-review` when required

- never treat a review as authorization for a production or irreversible action

- separate findings, evidence, assumptions, recommendations, and implementation eligibility

`!review auto` is the explicit entry to the existing League + `!loop` + `$code-review` workflow. Its
confirmation, mutation, validation, and commit rules do not flow into ordinary review modes.

## Shadow Mode

The canonical rollout state remains `shadow`. The shadow mode applies only to code-review
local-versus-agent selection; technical artifact routing, capability gating, and owner selection are
active contracts.

In shadow mode:

- explicit code `!review local` and `!review agent` take effect

- natural-language code-review intent and plain code `!review` produce a prediction

- the prediction alone does not spawn `code-reviewer`

- the actual code route remains the parent session's legacy decision

- Shadow routing diagnostics remain internal to the routing decision and are not emitted in
  operator-facing responses or review reports

Use stable enum-like reason tags. Do not expose hidden reasoning. Do not persist raw user prompts,
repository content, secrets, source excerpts, or identifiers. Automatic shadow persistence is
forbidden; only curated, anonymized cases may enter the versioned corpus.

## Output Contract

Code results follow `$code-review`. Technical artifact results follow `$solution-review` or the
declared artifact-owner fallback. Add only compact routing metadata when useful:

- object and resolved scope
- route and owner
- capability or fallback disclosure
- independent-review disclosure for code

Do not expose shadow predictions, confidence, reason tags, internal scope identifiers, or routing
telemetry in the operator-facing output. These signals are diagnostic implementation details.

Do not turn routing metadata into a second review report.
