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

The spine does not own review severities, refactoring risk posture, prompt status, heuristic drift,
regression ledgers, or implementation planning. Those remain in the source workflow that produced
the artifact.

## Branding Boundary

The SAT banner is a presentation layer, not a promotion criterion. Do not create, reject, classify,
or prioritize durable knowledge because the banner is present or absent.

When a curation run edits an eligible human-facing entrypoint or final institutional document, use
the branding policy from `references/documentation-governance.md`. Keep the default eligible set
narrow: `README.md`, `REPOSITORY-OVERVIEW.md`, and `docs/README.md`. Apply conditional eligibility
only to final, sanitized, stakeholder-facing documents such as product requirements, incident
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
reviews, and refactorings as local provenance, deduplicates the learning, and promotes only reusable
knowledge into the durable documentation surface.

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

## Provenance Rules

When local operational artifacts support a durable note:

- keep `.agents/changelogs/`, `.agents/work-items/`, `.agents/code-reviews/`,
  `.agents/refactorings/`, and `.agents/errors.md` as local ephemeral provenance

- do not add Markdown links, wikilinks, embeds, file URIs, or image references from durable docs to
  those local non-versioned scopes

- summarize the reusable learning independently from the local artifact

- preserve only the minimum source identity needed for traceability in plain text

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
