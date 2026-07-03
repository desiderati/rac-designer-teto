# Documentation Governance

## Knowledge graph interoperability

When a repository uses Graphify:

- If `graphify-out/GRAPH_REPORT.md` exists, read it before broad architecture or context searches
  across raw files.

- Treat Graphify outputs as a derived structural index for navigation and retrieval, not as the
  canonical source of truth.

- If Graphify output conflicts with source code, versioned docs, or explicit technical decisions,
  prefer those primary sources.

---

## Documentation update rules

- Follow the instructions in `.agents/prompts/readme.prompt.md`

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

Use `docs/README.md` as the GitHub-friendly root index for the `docs/` directory. This repository
also uses domain-specific READMEs as curated indexes, explicitly configured in
`.agents/documentation.toml`. Move loose `docs/*.md` files, except `docs/README.md`, into semantic
subdirectories such as `system-specifications`, `bug-analysis`, `data-models`,
`architecture-decisions`, `engineering-playbook`, `execution-runbooks`, `product-requirements`, or
`incident-reports`.

For Markdown documents under `docs/`, except indexes and protected release artifacts, use the
filename families configured in `.agents/documentation.toml`. The generic fallback is
`{REPO_ACRONYM}-{NNN}-{slug}.md`, with the repository acronym coming from explicit repository
configuration such as `repo_acronym = "SAT"`, or from explicit user confirmation before any rename.
Do not infer the acronym silently from the repository name.

When `.agents/scripts/validate_documentation_metadata.py` is installed, run it with
`--enforce-docs-governance` for broad `docs/` curation. In this repository, that gate reads
`.agents/documentation.toml` and accepts the local `ADR-*`, `BUS-*`, `PRD-*`, `PLAY-*`, `BACK-*` and
`UI-*` taxonomy. Use `--repo-acronym` only for one-off fallback validation when the config is absent
and the operator has already confirmed the acronym.

---

## Repository overview rules

- Follow the instructions in `.agents/prompts/repository-overview.prompt.md`

- Use `REPOSITORY-OVERVIEW.md` as the default durable destination for a non-technical repository
  overview

- Update `OBSIDIAN.md` only locally to index the overview when needed

- Do not turn `OBSIDIAN.md` into a narrative overview

- Do not use `README.md` as a substitute for `REPOSITORY-OVERVIEW.md` when the request is for a
  richer functional description
