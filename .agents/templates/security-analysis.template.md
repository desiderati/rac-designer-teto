---
title: "Security Analysis - <short case title>"
doc_role: security-analysis
status: draft
created: YYYY-MM-DD
updated: YYYY-MM-DD
tags: [ security-analysis ]
aliases: [ <short case title> ]
---

# Security Analysis

> Suggested historical destination:
> `.agents/security-analysis/YYYY-MM/yyyyMMdd-hhmm-{slug}.security-analysis.md`
>
> Durable promotion, when explicitly approved:
> `docs/security/SEC-00N-{slug}.md`

## Scope

- included paths, modules, flows, or change set:
- excluded paths or surfaces:
- runtime assumptions:

## Context

- actors, roles, tenants, or trust boundaries:
- sensitive assets or data:
- external systems, callbacks, jobs, or integrations:
- previous scan, review, code review, work item, or incident input:

## Checks Performed

- `$security-scan` surfaces considered:
- `$security-review` dimensions considered:
- commands or searches used:
- surfaces intentionally not inspected:

## Findings

| Severity                          | Type                                                                | Area | Masked Evidence | Recommendation | Status                                          |
|-----------------------------------|---------------------------------------------------------------------|------|-----------------|----------------|-------------------------------------------------|
| critical \| high \| medium \| low | risco-real \| hipotese \| recomendacao-preventiva \| fora-de-escopo |      |                 |                | open \| mitigated \| accepted \| false-positive |

## False Positives

| Item | Why It Is Not a Finding | Evidence |
|------|-------------------------|----------|
|      |                         |          |

## Commands Run

```text
<command and summarized output; never include complete secrets>
```

## Residual Risks

- risk:
- evidence limit:
- recommended follow-up:

## Escalation Required

- yes/no:
- reason:
- required owner or decision:

## Promotion

- promote to `docs/security/SEC-00N-{slug}.md`: yes/no
- next SEC number checked:
- sanitization performed:
- details intentionally omitted:

## Handling Rules

- Never include complete secrets, tokens, cookies, private keys, session data,
  payment data, or sensitive personal data.
- Mask credential-like values and include only the minimum evidence needed to
  support the finding.
- Do not include exploit payloads unless they are essential, safe, and reduced
  to non-sensitive form.
- Promotion to `docs/security/` requires explicit approval or an explicit
  parent-agent decision.
