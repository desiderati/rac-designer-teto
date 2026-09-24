# Documentation Governance

## Knowledge graph interoperability

When a repository uses Graphify:

- Use Graphify only when the structural relationship is unknown. If the file and symbol are known,
  open the source directly.

- Query an existing `graphify-out/graph.json` with `query`, `path`, or `explain`, use a small
  budget, and return at most three source files before reading the canonical sources.

- Never rebuild the graph or export an Obsidian vault automatically during a normal task. Build and
  incremental update are deliberate index-maintenance operations.

- Treat Graphify outputs as a derived structural index for navigation and retrieval, not as the
  canonical source of truth.

- If Graphify output conflicts with source code, versioned docs, or explicit technical decisions,
  prefer those primary sources.

## Conditional discovery

- Consult `OBSIDIAN.md` only when the canonical document or rule is unknown. It should return one to
  three candidate paths; read only the selected canonical source.

- At most one discovery step may precede direct reading or execution. Do not chain Obsidian and
  Graphify unless the selected document itself proves that a code relationship must be resolved.

- A known external command goes directly through RTK. Discovery indexes are not generic preflight.

---

## Documentation update rules

- Follow the instructions in `.agents/prompts/readme.prompt.md`

- When an explicit request or governed automation owns repository-surface maintenance, create an
  absent `README.md` from repository evidence and review an existing `README.md` incrementally from
  the bounded Git delta.

- Create automatically only when repository ownership, evidence, and write ownership are clear.
  Otherwise return `pendente_revisao` or the applicable stabilization result.

- Technical change does not automatically mean `README.md` update

- Review documentation impact explicitly when setup, commands, env vars, workflow, usage, or
  documented behavior may have changed

- Do not rewrite README for style only

- Do not add speculative instructions

- Do not document behavior that has not been validated

- If durable documentation conflicts with another durable document, flag the conflict before
  proceeding; do not silently choose one source when the choice changes behavior, scope, risk, or
  operational authority

- Locate and inspect the actual changed files, commands, configuration, or workflow before proposing
  a `README.md` update; if that evidence cannot be found, stop and request it

- If README is not the right destination, point to a better place:
    - changelog
    - runbook
    - architecture doc
    - the versioned knowledge base referenced by `OBSIDIAN.md`, or another canonical repository document when
      `OBSIDIAN.md` is absent
    - another project document

---

## Knowledge consolidation rules

### Daily

Perform light consolidation when useful:

- extract clearly reusable knowledge from recent changelogs
- prefer updating existing notes when the topic already exists
- keep changes small and targeted

### Weekly

Perform a more intelligent review:

- revise `OBSIDIAN.md` when the repository uses it

- merge duplicated or overlapping notes

- strengthen cross-links between notes

- promote recurring patterns into more solid notes or runbooks

- validate frontmatter, durable links, and inbound `OBSIDIAN.md` reachability for the durable
  documentation corpus; when `.agents/scripts/validate_documentation_metadata.py` is installed,
  prefer it before closing a curation pass

- format touched Markdown files with `.agents/scripts/format_markdown.py --write --line-width 100`,
  then rerun the same formatter with `--check --line-width 100` before closing a curation pass

- preserve UTF-8 without BOM and normal Portuguese accents in Markdown; do not use PowerShell
  `Set-Content` or `Out-File` for Markdown rewrites, and treat invalid UTF-8 or mojibake markers as
  blocking validation issues

### Promotion criteria

Only promote changelog content into durable knowledge when at least one of these is true:

- the problem happened more than once
- a relevant technical decision was made
- a reusable diagnosis or correction pattern emerged
- an important trap or anti-pattern was identified
- the case deserves a runbook
- the operational, architectural, or security impact was meaningful

### Consolidation discipline

When consolidating into the versioned knowledge base referenced by `OBSIDIAN.md`, or into the
repository's canonical documentation location when `OBSIDIAN.md` is absent:

- do not copy raw changelog text

- do not promote raw `.agents/errors.md` entries; promote only sanitized, recurring learning when it
  becomes durable knowledge or a guardrail update

- preserve `.agents/incidents/` as the factual record of the concrete case when that convention
  exists

- treat `.agents/refactorings/` as local operational input; promote reusable conclusions, changelog
  facts, or ADRs instead of treating the local refactoring record as canonical documentation

- treat `.agents/code-reviews/` as local operational input; promote only reusable conclusions, not
  the local review artifact itself

- treat `.agents/solution-reviews/` as local operational input; promote only reusable conclusions,
  not the local review artifact itself

- extract reusable learning

- remove redundancy

- group similar cases

- update existing notes before creating new ones when possible

- before writing notes or updating `OBSIDIAN.md`, present a consolidation plan listing what will be
  promoted, what will be ignored, and which notes will be updated or created, then ask for
  confirmation

- propose only localized updates to `OBSIDIAN.md`, not full rewrites

When the repository maintains a versioned knowledge base, use `docs/` as the default directory
unless a stronger canonical documentation location is explicitly reflected in `OBSIDIAN.md` or
another repository document.

### Docs governance rules

When performing broad curation of `docs/`, preserve release delivery artifacts:

- `docs/releases/<number>.md`
- `docs/release-notes/<number>.md`

The `<number>` segment must be numeric, such as `89` or `102`. These documents may be formatted and
validated for UTF-8, accents, frontmatter, and links, but must not be moved or renamed.

Reserve `docs/release-notes/` exclusively for direct numeric Markdown files. Nested directories,
support files, indexes, and identified names such as `RN-001-release.md` are invalid there.
Normalize the legacy alias `docs/releases-notes/` to `docs/release-notes/`, preserving `NN.md`
exactly. Restore a redundant name produced by sanitation, such as `DOC-089-89.md`, as
`docs/release-notes/89.md`.

Use `docs/README.md` as the GitHub-friendly root index for the `docs/` directory. Identified
documents may remain directly under `docs/` when they follow `SIGLA-NNN-slug.md` or
`SIGLA-NNNN-slug.md`; use semantic subdirectories such as `system-specifications`, `bug-analysis`,
`data-models`, `architecture-decisions`, `engineering-playbook`, `execution-runbooks`,
`product-requirements`, or `incident-reports` when a cohesive family benefits from its own lifecycle
or navigation.

Curate `README.md`, `docs/README.md`, and `OBSIDIAN.md` as complete semantic surfaces. Do not use
HTML comments to delimit generated navigation regions. Remove legacy `BEGIN SAT DOCUMENTATION
INDEX`, `BEGIN SAT DOCUMENTATION ROOT`, and `BEGIN SAT DURABLE RECORDS INDEX` blocks during the next
governed curation.

Keep every resolved local destination unique within each surface. Treat direct Markdown links,
reference links, and wikilinks as the same destination after path normalization; allow repeated
files only when their anchors are different.

Prefer the document's human-readable `title` as the link label. A canonical identity such as
`ADR-009` may prefix the title; an index-only opaque identifier such as `PROD-20260527-EFFC` must
not replace it.

Require `title` and `doc_role` frontmatter on primary durable Markdown. A nested `README.md` is
valid without local configuration when the nearest parent index links to it and it links to at least
one document in its own subtree. Keep `OBSIDIAN.md` curated rather than exhaustive; transitive
connections through `docs/README.md` and nested indexes are valid.

For Markdown documents under `docs/`, except indexes, support assets, and protected release
artifacts, use `{SIGLA}-{NNN}-{slug}.md` or `{SIGLA}-{NNNN}-{slug}.md`. `SIGLA` is the uppercase
documentary-family code; prefer a semantic role such as `TECH`, `PRD`, `MER`, `BUG`, `KB`, `PROMPT`
or `GIT` over a product acronym when the role is clear. A lowercase family qualifier such as `.prd`
may appear before `.md`.

Treat `PRD-NNN-slug.prd.json` and `PRD-NNNN-slug.prd.json` as primary structured durable documents.
Validate JSON syntax, UTF-8 without BOM, Unicode NFC, metadata identity and index reachability; do
not create an artificial Markdown owner. Reject duplicate primary identities.

Preserve generator-owned Superpowers documents at `docs/superpowers/plans/YYYY-MM-DD-slug.md` and
`docs/superpowers/specs/YYYY-MM-DD-slug-design.md`. This global exception applies only to the
filename gate: keep frontmatter, durable links, index reachability, Markdown formatting, and UTF-8
validation mandatory. Reject other `docs/superpowers/` subdirectories or filename shapes, and do not
silently rename valid generator-owned files. New transient Superpowers output may still belong under
`.agents/superpowers/`; this rule governs versioned documents intentionally present in `docs/`.

Store assets for a root document in `docs/documentation-assets/<complete-document-stem>/`. Store
assets for a nested document in an adjacent `<complete-document-stem>.assets/` directory. The owner
document must link to its assets; reject orphaned or unlinked asset directories and loose `.puml`,
`.mmd` or `.txt` support artifacts.

The default contract works without repository-local configuration. Keep `.agents/documentation.toml`
optional. Use `[docs_governance]` only for additive, localized filename or nested-index exceptions.
Use `[documentation_surfaces].intentionally_absent` only to suppress creation of an intentionally
absent root surface:

```toml
[documentation_surfaces]
intentionally_absent = ["REPOSITORY-OVERVIEW.md"]
```

The allowed values are exactly `README.md` and `REPOSITORY-OVERVIEW.md`. Honor the exception only
from valid Git-tracked config and only while the listed file is absent; an existing file remains
eligible for incremental review.

When `.agents/scripts/validate_documentation_metadata.py` is installed, run it with
`--enforce-docs-governance` for broad `docs/` curation.

Before returning organization-only findings during broad curation, run
`.agents/scripts/repair_documentation_structure.py --repo-root <repo-root> --plan`. When the current
phase explicitly authorizes sanitation, use `--apply` and pass every preexisting protected path with
repeated `--protected-path`. The repairer materializes reviewable casing, names, semantic placement,
frontmatter, indexes, links and assets; removes legacy navigation markers and exhaustive indices;
restores human-readable labels; keeps one reference per resolved local destination; records inferred
SIGLAs with rationale and confidence; preserves complete fenced blocks; and never stages, commits or
pushes.

After manual edits, rebuild the plan from the current tree and run an incremental finalization.
Never replay the previous plan over operator changes. Reconcile indexes, links, assets and
structured documents; restore only unambiguous prose accents; normalize non-fenced text to NFC;
remove BOM in formatter write mode; run formatter write/check and full gates; then recalculate the
approval hash.

---

## Repository overview rules

- Follow the instructions in `.agents/prompts/repository-overview.prompt.md`

- When an explicit request or governed automation owns repository-surface maintenance, create an
  absent `REPOSITORY-OVERVIEW.md` from repository evidence and review an existing overview
  incrementally from the bounded Git delta.

- Do not regenerate an existing overview from scratch merely because the repository changed.

- Use `REPOSITORY-OVERVIEW.md` as the default durable destination for a non-technical repository
  overview

- Update `OBSIDIAN.md` only locally to index the overview when needed

- Do not turn `OBSIDIAN.md` into a narrative overview

- Do not use `README.md` as a substitute for `REPOSITORY-OVERVIEW.md` when the request is for a
  richer functional description
