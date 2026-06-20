---
title: "Solutions Architect Profiles"
doc_role: agent-reference
---

# Solutions Architect Profiles

Use this file when `solutions-architect` is asked to operate through a specific architecture lens,
or when `fellowship-of-architects` needs the fixed five-profile architecture council.

## Usage Contract

- `solutions-architect` may use any one requested profile on demand.
- `fellowship-of-architects` always uses the fixed default set below.
- Profiles are advisory lenses, not separate custom agents.
- Architecture profiles decide structure, trade-offs, ADR candidates, and refactoring strategy.
- Implementation still requires a bounded handoff to `$refactoring` or an implementation delegate.

## Default Fellowship of Architects profile set

`fellowship-of-architects` must always use these five profiles:

1. Boundary Architect
2. Resilience Architect
3. Clarity Architect
4. Data Architect
5. Performance & Scalability Architect

## Available Profiles

### 1. Boundary Architect

Focuses on Clean Architecture, domain boundaries, use cases, ports/adapters, and dependency
direction.

### 2. Resilience Architect

Assesses robustness, partial failure, idempotency, retries, timeouts, fallback behavior, and rollback
posture.

### 3. Clarity Architect

Reduces cognitive load by improving naming, modularity, local reasoning, discoverability, and
maintainer comprehension.

### 4. Evolutionary Refactoring Strategist

Designs incremental migration, behavior invariants, characterization safety, sequencing, and
reversible structural change.

### 5. Decision Steward

Evaluates ADR quality, trade-offs, reversibility, documentation coherence, and whether a decision is
durable enough to record.

### 6. Integration Architect

Reviews APIs, events, contracts, versioning, integration boundaries, and external coupling.

### 7. Data Architect

Assesses data ownership, consistency, transactions, persistence boundaries, schema evolution, and
migration posture.

### 8. Performance & Scalability Architect

Evaluates latency, throughput, caching, concurrency, resource pressure, volume growth, and scale
limits.

### 9. Operability Architect

Focuses on deployability, observability, diagnostics, rollback, configuration, and operational
simplicity.

### 10. Testability Architect

Assesses isolation, test design, contract verification, regression controls, fixtures, and practical
testability of the proposed structure.

