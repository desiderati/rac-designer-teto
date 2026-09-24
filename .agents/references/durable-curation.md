---
title: "Durable Curation Spine"
doc_role: operational-reference
---

# Durable Curation Spine

This reference is the shared backbone for promoting local operational learning into durable
repository knowledge. It exists to keep `code-review`, `refactoring`, and `knowledge-base.prompt.md`
aligned without moving their source-specific contracts into one oversized workflow.

## Minimal Extraction

The shared spine owns only the invariants that every durable-curation flow needs:

- local operational artifacts are source evidence, not durable destinations

- durable output belongs in `docs/`, `OBSIDIAN.md`, or ADRs

- promotion requires an explicit destination, evidence, validation, and blocker decision

- ADR candidates must use the repository architecture-decision flow

- local non-versioned provenance is plain text only, never a durable link

- durable versioned case records remain documentary sources even when reusable learning is also
  promoted into `docs/`

The spine does not own review severities, refactoring risk posture, prompt status, heuristic drift,
regression ledgers, or implementation planning. Those remain in the source workflow that produced
the artifact.

## Branding Boundary

The SAT banner is not a promotion criterion and never proves documentary quality. It is a mandatory
presentation requirement on every existing default entrypoint. Do not create, reject, classify, or
prioritize durable knowledge because the banner is present or absent.

During curation, use the branding policy and deterministic gate from
`references/documentation-governance.md`. Keep the mandatory default set narrow: `README.md`,
`REPOSITORY-OVERVIEW.md`, and `docs/README.md`. Apply conditional eligibility only when explicitly
in scope for final, sanitized, stakeholder-facing documents such as product requirements, incident
reports, execution runbooks, and engineering playbooks.

Never add the banner to `OBSIDIAN.md`, `SKILL.md`, `CHANGELOG.md`, ADRs, protected release
manifests, `.agents/**`, prompts, templates, examples, work-items, or local operational records.

## Source Roles

`code-review` is diagnostic provenance. It may identify reusable learning, documentation candidates,
ADR candidates, or bounded `refactoring` candidates. Its persisted local artifact must keep the
`Curadoria Durável` classification and any blocker that prevents promotion.

`refactoring` is execution provenance. It may identify durable decisions, prompt state, heuristic
drift, and ADR posture while preserving behavior invariants and validation evidence for the executed
front.

`knowledge-base.prompt.md` is the consolidation path. It consumes changelogs, work-items, code
reviews, and refactorings as local provenance; it also consumes durable versioned case records from
`.agents/production-changes/`, `.agents/risk-assessments/`, `.agents/security-analysis/`,
`.agents/security-scans/`, `.agents/security-reviews/`, `.agents/bug-analysis/`, and
`.agents/incidents/`. It deduplicates the learning and promotes only reusable synthesis into the
canonical knowledge base without deleting or demoting the original case record.

`agents-refactoring-curation` is retired as a separate automation. Its semantic work now belongs to
`refactoring` records and to this shared consolidation spine.

## Common Promotion Contract

Classify every candidate before writing durable documentation:

- `sem promoção`: no reusable durable output
- `conhecimento durável novo`: create a new durable note
- `conhecimento durável complementar`: update an existing durable note
- `candidato a ADR`: route through architecture-decision
- `candidato a refactoring`: hand off as bounded structural follow-up

Use exactly one promotion plan:

- `claro-seguro`: destination, evidence, validation, and rollback are explicit
- `pendente-revisao`: learning is real, but promotion needs judgment or wider merge work
- `não se aplica`: classification is `sem promoção`

Do not write durable documentation when the classification and promotion plan do not agree.

## Structured Source Fields

When a local source artifact can carry YAML frontmatter, prefer a structured `durable_curation`
block over prose-only signals. The structured block is a decision aid, not system evidence by
itself: the consolidation flow must still read the cited local artifacts and inspect the durable
destination before writing.

For work-items and single-case local artifacts, use this shape:

```yaml
durable_curation:
  schema_version: 1
  classification: untriaged
  promotion_plan: untriaged
  destination:
  already_covered_by: []
  requires_operator: true
  evidence_strength: ausente
  gate_scope: none
  reason:
```

Allowed `classification` values:

- `untriaged`: the artifact has no curation decision yet
- `sem_promocao`: no reusable durable output
- `conhecimento_duravel_novo`: create a new durable note
- `conhecimento_duravel_complementar`: update an existing durable note
- `candidato_adr`: route through architecture-decision
- `candidato_refactoring`: hand off as bounded structural follow-up

Allowed `promotion_plan` values:

- `untriaged`: no deterministic promotion decision yet
- `claro_seguro`: destination, evidence, validation, and rollback are explicit
- `pendente_revisao`: learning is real, but promotion needs judgment or wider merge work
- `nao_se_aplica`: classification is `sem_promocao`

Allowed `evidence_strength` values:

- `ausente`
- `fraca`
- `media`
- `forte`

Allowed `gate_scope` values:

- `none`
- `format_only`
- `docs_readme_obsidian`
- `adr`

Use `destination` only for the durable target to create or update, such as a note under `docs/` or
an ADR path. Use `already_covered_by` for tracked durable documents that already cover the learning.
Never put `.agents/work-items/`, `.agents/changelogs/`, `.agents/code-reviews/`,
`.agents/refactorings/`, local exports, screenshots, logs, `.tmp/`, `.obsidian/`, or `graphify-out/`
in either field as durable links.

Sanitized, Git-tracked records under `.agents/production-changes/`, `.agents/risk-assessments/`,
`.agents/security-analysis/`, `.agents/security-scans/`, `.agents/security-reviews/`,
`.agents/bug-analysis/`, and `.agents/incidents/` are not covered by that local non-versioned ban.
They may appear in `already_covered_by` or as documentary source links when repository governance
allows it.

For daily changelogs that can contain multiple entries, the changelog frontmatter may carry
file-level defaults and entry-specific decisions:

```yaml
durable_curation:
  schema_version: 1
  default_classification: untriaged
  default_promotion_plan: untriaged
  entries: []
```

Each `entries` item, when used, should identify the changelog entry by stable heading text or time,
point to a correlated work-item when one exists, and then reuse the same fields as the single-case
block. Work-item frontmatter remains the preferred source of structured curation when a changelog
and work-item describe the same case.

## Structured Decision Rules

Use structured fields conservatively:

- missing `durable_curation` or `classification: untriaged` means "fall back to normal triage"; it
  is not authorization to write durable documentation

- `classification: sem_promocao` with `promotion_plan: nao_se_aplica` lets the consolidation flow
  close the case as no-promotion unless other eligible source artifacts provide stronger contrary
  evidence

- `promotion_plan: claro_seguro` is actionable only when `classification` is a durable promotion
  value, `destination` is present, `requires_operator` is `false`, `evidence_strength` is `forte`,
  and the destination is compatible with existing durable documentation

- autonomous writing additionally requires an explicit current request to consolidate knowledge, an
  existing `OBSIDIAN.md`/`docs/` base, and a bounded additive update that does not substantially
  rewrite, remove, restructure, or retone user-authored content; otherwise present the plan and wait
  for confirmation

- `requires_operator: true`, `promotion_plan: pendente_revisao`, missing destination for a
  promotion, or non-strong evidence blocks autonomous writing

- `already_covered_by` supports deterministic no-promotion only after the referenced durable path
  exists, is tracked when linked, and actually covers the learning after inspection

## Provenance Rules

When local operational artifacts support a durable note:

- keep `.agents/changelogs/`, `.agents/work-items/`, `.agents/code-reviews/`,
  `.agents/refactorings/`, and `.agents/errors.md` as local ephemeral provenance

- do not add Markdown links, wikilinks, embeds, file URIs, or image references from durable docs to
  those local non-versioned scopes

- summarize the reusable learning independently from the local artifact

- preserve only the minimum source identity needed for traceability in plain text

When durable versioned case records support a durable note:

- keep the original sanitized case record as durable technical history

- link to it only when Git tracks the target and the link adds useful traceability

- extract reusable synthesis into `docs/` without copying the record wholesale

- never replace the original risk assessment, security record, bug analysis, incident, or
  production-change record with the synthesized note

## Fenced Code Boundary

During curation or Markdown formatting, treat complete fenced code blocks as semantically opaque.
Preserve the opening fence, info string, body, and closing fence line-for-line and
character-for-character. Do not join, reflow, reindent, reorder, or normalize whitespace inside the
fence. A semantic edit inside a fenced block is allowed only when the current task explicitly asks
for that code or configuration change and the change is supported by repository evidence.

## ADR Boundary

Create or update ADRs only through the repository architecture-decision flow:

- use `.agents/prompts/architecture-decision.prompt.md` when present

- use the bootstrapped or installed ADR template

- validate with `.agents/scripts/validate_architecture_decisions.py` when present, or the
  `documentation` skill validator fallback

Do not let a code review, refactoring record, or knowledge-base note define an ADR format on its
own.

## Validation Gates

After writing durable documentation, use the narrowest applicable checks:

- `validate_durable_links.py` for durable outbound links and local-link bans
- `validate_documentation_metadata.py` for frontmatter and `OBSIDIAN.md` reachability
- `validate_architecture_decisions.py` for ADR records
- `format_markdown.py --check` after Markdown formatting when the repository provides the formatter

If a needed validation command is absent, keep the promotion plan as `pendente-revisao` unless the
missing gate is irrelevant to the candidate.
