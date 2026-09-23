---
title: "Review Routing"
doc_role: skill-reference
rollout_mode: shadow
---

# Review Routing

Use this reference for `!review`, `!review local`, `!review agent`, direct `@code-reviewer`, and
natural-language requests to review implementation code or a technical decision or execution
artifact. It is the shared, diagnostic, chat-first router for `$code-review`, `$solution-review`,
the `code-reviewer` custom agent, and the artifact-author fallback.

Do not duplicate this classifier in hooks, custom-agent configuration, or another reference. Route
selection and execution ownership are separate decisions.

## Core Model

Classify the request as:

```text
polarity × object × goal × scope × modifier × capability × route × owner
```

- `polarity` — immediate instruction, scoped negation, historical or future state, quotation, or
  help/meta use

- `object` — code, diff, patch, implementation, ADR, solution design, RFC, implementation plan,
  migration plan, rollout plan, deployment plan, readiness plan, PRD, documentation, or unknown

- `goal` — diagnostic review, artifact review, security review, verification, explanation,
  implementation, or clarification

- `scope` — explicit artifact/path/range/diff, active manifest, unpublished changes,
  repository-wide, cross-system, or unresolved

- `modifier` — smart, local, agent, conflicting modes, or `!auto-review`

- `capability` — `$code-review`, `code-reviewer`, and `$solution-review` availability; represent the
  artifact capability gate explicitly as `solution_review_available`

- `route` — `local`, `agent`, `clarify`, or `not_applicable`

- `owner` — `code_review`, `solution_review`, `code_reviewer`, `artifact_author`, `security_review`,
  or `none`

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

6. Resolve explicit modifiers. `!review local` and `!review agent` are mutually exclusive.

7. Resolve the concrete scope, then check capability before selecting route and owner.

8. Apply the safety and production classification before executing the diagnostic pass.

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

When the clauses cannot be separated without changing intent, clarify. Supporting artifacts remain
evidence rather than separate review objects unless the user asks to review them too.

## Modifier Semantics

### `!review`

Use smart routing. Resolve object, scope, capability, route, and owner. The result is diagnostic,
chat-first, and non-mutating.

### `!review local`

For code, force a parent-session `$code-review` pass and do not delegate. For a supported technical
artifact, force local `$solution-review` only when the capability is available. An explicit
unavailable modifier requires clarification: if `$solution-review` is unavailable, stop and offer
the artifact-owner fallback instead of silently changing the requested capability.

### `!review agent`

For code, explicitly authorize one diagnostic `code-reviewer` pass, while the parent retains scope,
consolidation, and final judgment. If the agent is unavailable, stop and offer local code review.

For ADRs, solution designs, RFCs, and execution/readiness plans, clarify because there is no
artifact-review custom agent in this contract. The router must not delegate an artifact to
`code-reviewer`. It may offer local `$solution-review`, or the artifact-author fallback when that
skill is unavailable.

### Natural-language intent

Natural phrases enter the same smart classifier. They authorize diagnostic evaluation only, never
mutation. Quoted, translated, historical, future, or help uses are not immediate activation.

## Scope Resolution

Use the first unambiguous source:

1. explicit artifact, file, directory, range, patch, diff, commit, comparison, or manifest
2. active work-item manifest belonging to the request
3. current relevant unpublished Git changes for a code-review object
4. clarification when no meaningful scope exists

Do not silently expand to the whole repository or include unrelated pre-existing changes.

## Safety and Production Guardrails

Every route is diagnostic:

- do not edit code, artifacts, tests, documentation, configuration, generated sources, or runtime
  state as part of the review

- do not stage, commit, push, merge, rebase, create a PR, deploy, migrate, or mutate external state

- classify infrastructure, credentials, customer data, remote APIs, security controls, and
  production implications before analysis

- for security-sensitive or production-adjacent content, restrict the pass to read-only review and
  route specialized assurance to `$security-review` when required

- never treat a review as authorization for a production or irreversible action

- separate findings, evidence, assumptions, recommendations, and implementation eligibility

`!auto-review` remains a separate League + `!loop` + `$code-review` workflow. Its confirmation,
mutation, validation, and commit rules do not flow into ordinary review modes.

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
