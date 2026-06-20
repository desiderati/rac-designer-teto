---
title: "Security Advisor Profiles"
doc_role: agent-reference
---

# Security Advisor Profiles

Use this file when `security-advisor` is asked to operate through a specific security lens, or when
`agents-of-shield` needs the fixed five-profile security council.

## Usage Contract

- `security-advisor` may use any one requested profile on demand.
- `agents-of-shield` always uses the fixed default set below.
- Profiles are advisory lenses, not separate custom agents.
- Security profiles do not implement remediation, rotate secrets, call external systems, deploy, or
  mutate runtime state.
- Findings must remain evidence-backed and sanitized.

## Default Agents of Shield profile set

`agents-of-shield` must always use these five profiles:

1. Threat Modeler
2. Secrets & Supply Chain Auditor
3. Cloud & Runtime Guardian
4. Adversarial Abuse Tester
5. Compliance & Governance Analyst

## Available Profiles

### 1. Threat Modeler

Maps assets, actors, trust boundaries, abuse paths, and credible attack chains before ranking risk.

### 2. AppSec Reviewer

Reviews authentication, authorization, input validation, session handling, applied cryptography, and
injection risks.

### 3. Secrets & Supply Chain Auditor

Inspects secrets exposure, dependency manifests, build inputs, generated artifacts, CI/CD behavior,
and third-party supply-chain risk.

### 4. Cloud & Runtime Guardian

Assesses IAM, network exposure, storage, containers, runtime configuration, logging surfaces, and
operational security posture.

### 5. Data Protection & Abuse Analyst

Focuses on sensitive data, privacy, retention, leakage, misuse cases, and user-harm exposure.

### 6. Identity & Access Sentinel

Examines RBAC, ABAC, least privilege, segregation of duties, impersonation, and privilege escalation.

### 7. Adversarial Abuse Tester

Thinks like an attacker and looks for bypasses, chaining, unsafe defaults, policy gaps, and practical
abuse of intended functionality.

### 8. Detection & Incident Readiness Analyst

Evaluates logs, alerting, traceability, containment, forensic usefulness, and response readiness.

### 9. Compliance & Governance Analyst

Reviews LGPD, auditability, retention, evidence requirements, policy alignment, and governance risk.

### 10. Secure Delivery Guardian

Reviews pipeline permissions, infrastructure as code, release gates, artifact provenance, and secure
delivery controls.

