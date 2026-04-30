# Documentation Governance

## Knowledge graph interoperability

When a repository uses Graphify:

- If `graphify-out/GRAPH_REPORT.md` exists, read it before broad architecture or context searches across raw files.
- Treat Graphify outputs as a derived structural index for navigation and retrieval, not as the canonical source of
  truth.
- If Graphify output conflicts with source code, versioned docs, or explicit technical decisions, prefer those primary
  sources.

---


## Documentation update rules

- Follow the instructions in `.agents/prompts/readme.prompt.md`
- Technical change does not automatically mean `README.md` update
- Review documentation impact explicitly when setup, commands, env vars, workflow, usage, or documented behavior may
  have changed
- Do not rewrite README for style only
- Do not add speculative instructions
- Do not document behavior that has not been validated
- Locate and inspect the actual changed files, commands, configuration, or workflow before proposing a `README.md`
  update; if that evidence cannot be found, stop and request it
- If README is not the right destination, point to a better place:
    - changelog
    - runbook
    - architecture doc
- the versioned knowledge base referenced by `OBSIDIAN.md`, or another canonical repository document when `OBSIDIAN.md`
  is absent
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

### Promotion criteria

Only promote changelog content into durable knowledge when at least one of these is true:

- the problem happened more than once
- a relevant technical decision was made
- a reusable diagnosis or correction pattern emerged
- an important trap or anti-pattern was identified
- the case deserves a runbook
- the operational, architectural, or security impact was meaningful

### Consolidation discipline

When consolidating into the versioned knowledge base referenced by `OBSIDIAN.md`, or into the repository's canonical
documentation location when `OBSIDIAN.md` is absent:

- do not copy raw changelog text
- preserve `.agents/incidents/` as the factual record of the concrete case when that convention exists
- treat `.agents/refactorings/` as local operational input; promote reusable conclusions, changelog facts, or ADRs
  instead of treating the local refactoring record as canonical documentation
- treat `.agents/code-reviews/` as local operational input; promote only reusable conclusions, not the local review
  artifact itself
- extract reusable learning
- remove redundancy
- group similar cases
- update existing notes before creating new ones when possible
- before writing notes or updating `OBSIDIAN.md`, present a consolidation plan listing what will be promoted, what will
  be ignored, and which notes will be updated or created, then ask for confirmation
- propose only localized updates to `OBSIDIAN.md`, not full rewrites

When the repository maintains a versioned knowledge base, use `docs/` as the default directory unless a stronger
canonical documentation location is explicitly reflected in `OBSIDIAN.md` or another repository document.

---

## Repository overview rules

- Follow the instructions in `.agents/prompts/repository-overview.prompt.md`
- Use `REPOSITORY-OVERVIEW.md` as the default durable destination for a non-technical repository overview
- Update `OBSIDIAN.md` only locally to index the overview when needed
- Do not turn `OBSIDIAN.md` into a narrative overview
- Do not use `README.md` as a substitute for `REPOSITORY-OVERVIEW.md` when the request is for a richer
  functional description


