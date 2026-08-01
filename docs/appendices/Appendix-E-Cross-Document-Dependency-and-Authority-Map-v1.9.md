# Appendix E — Cross-Document Dependency & Authority Map

**Version:** 1.9  
**Status:** Active Dependency Baseline — Conceptual Research Mode  
**Handbook Position:** Appendix E  
**Document Owner:** Architecture Governance  
**Last Updated:** 2026-07-31  
**Supersedes:** Appendix E — Cross-Document Dependency & Authority Map v1.8  
**Review Trigger:** A canonical-version change, authority change, new document, module-boundary change, Protocol amendment or unresolved dependency conflict

---

## 1. Purpose

This appendix defines:

- authority precedence;
- direct document dependencies;
- cross-cutting consistency relationships;
- required downstream revalidation;
- and implementation freeze points.

A document may refine an upstream rule for a narrower scope, but it may not silently redefine the upstream authority.

---

## 2. Handbook Layers

```text
Foundation
Document 0
        ↓
Project, Concept and Intervention Authority
Documents 1–5
        ↓
Product, Information and Domain Authority
Documents 6–12
        ↓
Technical Implementation Authority
Documents 13–17
        ↓
Conceptual Research, Prototype and UX Authority
Documents 18–20
```

---

## 2.1 Current Research-Mode Authority

Documents 1 v2.2, 11 v1.2, 18 v1.3, 19 v1.3 and 20 v1.3 establish the current conceptual and theoretical research mode.

This mode supersedes older statements that treated ethics, governance, provider, production or Pilot approval as prerequisites for beginning work.

Current theoretical research, synthetic simulation and non-production prototyping may proceed immediately.

Consent, Safety, audit and approval concepts remain part of the architecture being studied and may become operational requirements only in a separate future programme.

---

## 3. Authority Precedence by Subject

| Subject | Primary Authority | Refining Authorities |
|---|---|---|
| Ecosystem systems and ownership | Document 0 | README |
| Project mission, scope and success | Document 1 | Documents 18 and 19 |
| Conceptual, causal and outcome model | Document 2 | Documents 11 and 19 |
| Intervention definitions and versions | Document 3 | Documents 6, 18 and 19 |
| Roles, Relationships, Consent and permission semantics | Document 4 | Document 14 enforcement; Document 20 presentation |
| Ability adaptation principles | Document 5 | Documents 10, 11 and 20 |
| Product modules and capability ownership | Document 6 | Documents 8 and 13 |
| Workspaces and information architecture | Document 7 | Document 20 |
| Domain language, aggregates, invariants and domain events | Document 8 | Documents 12, 15 and 16 implementation |
| Evidence integration and Knowledge Platform boundary | Document 9 | Documents 15 and 17 |
| AI Companion product behaviour and human boundary | Document 10 | Document 17 runtime operations; Document 20 UX |
| Research and evaluation lifecycle | Document 11 | Document 19 conceptual research programme |
| Data semantics, identifiers, lineage and interoperability | Document 12 | Documents 15 and 16 |
| System topology and runtime architecture | Document 13 | Documents 14–17 |
| Security, privacy and Consent enforcement | Document 14 | Documents 15–17 and 20 |
| API, event, job, file and Tool contracts | Document 15 | Documents 16 and 17 implementation |
| Database, object, Search, Vector and analytical storage | Document 16 | Document 13 topology |
| AI orchestration, provider and model operations | Document 17 | Documents 10 and 14 constraints |
| Conceptual research scope and prototype roadmap | Document 18 | Documents 19 and 20 |
| Current conceptual research design | Document 19 | ConceptualResearchProtocol version |
| UX flows, states, components and content | Document 20 | Documents 4, 5, 7, 8, 14, 18 and 19 constraints |
| Handbook versions and review status | README and Appendix D | Appendices B, E and F |
| Cross-document architecture traceability | Appendix A | Documents 0–20, Appendix B and this Appendix E |
| Material architecture decisions, status and supersession | Appendix C | Primary source Documents 0–20, Appendix A Trace IDs and this Appendix E |

---

## 4. Direct Dependency Matrix

| Document | Hard Upstream Dependencies | Key Lateral Consistency Dependencies | Primary Downstream Consumers |
|---:|---|---|---|
| 0 | None | README | 1–20 |
| 1 | 0 | — | 2–20 |
| 2 | 0, 1 | 3, 11 | 3, 6, 8, 9, 11, 18, 19 |
| 3 | 0–2 | 6, 8, 11 | 6, 8, 18, 19, 20 |
| 4 | 0–3 | 5, 8, 14 | 6–20 |
| 5 | 0–4 | 10, 20 | 6, 7, 10, 11, 18–20 |
| 6 | 0–5 | 8 | 7–20 |
| 7 | 4–6, 8 | 10, 20 | 13, 18, 20 |
| 8 | 0–7 | 9–12 | 12–20 |
| 9 | 0–8 | 10–12 | 11, 15, 17–19 |
| 10 | 0–9 | 11, 14, 17 | 11–20 |
| 11 | 0–10 | 12, 19 | 12, 18–20 |
| 12 | 0–11 | 14–16 | 13–20 |
| 13 | 0–12 | 14–17 | 18–20 |
| 14 | 0–13 | 15–17 | 18–20 |
| 15 | 4, 8, 12–14 | 16, 17 | 18–20 and implementation |
| 16 | 8, 12–15 | 17 | 18–20 and implementation |
| 17 | 8, 10, 12–16 | 18–20 | AI implementation and Pilot |
| 18 | 0–17 | 19, 20 | Product backlog and future operational readiness |
| 19 | 0–18 | 20 | ConceptualResearchProtocol version, DatasetDefinition and AnalysisPlan |
| 20 | 0–19 | Component implementation | UX, QA, training and future operational readiness |

---

## 5. Governing Sequence

```text
Healthy Aging Challenge
        ↓
Conceptual and Evidence Framework
        ↓
InterventionVersion
        ↓
ResearchQuestion and EvidenceDecision
        ↓
ProtocolVersion
        ↓
InterventionConfiguration
        ↓
AIInterventionConfigurationVersion
        ↓
Consent, Eligibility and Enrolment
        ↓
Exposure, Assessment, Moderation and Safety
        ↓
DatasetDefinition and DatasetVersion
        ↓
DatasetLock
        ↓
AnalysisPlan and AnalysisRun
        ↓
InterpretationRecord and ResearchFinding
        ↓
InterventionDecision
```

---

## 6. Product and Domain Dependency

```text
Document 6 — Product Modules
        ↓
Document 8 — Canonical Domain Ownership
        ↓
Document 12 — Data Meaning and Lineage
        ↓
Document 15 — Interface Contracts
        ↓
Document 16 — Persistence
        ↓
Documents 18–20 — Delivery, Protocol and UX
```

Any new aggregate introduced downstream must first be reconciled with Document 8.

Document 8 v3.2 satisfies this rule for MutualAcceptance, ConversationThread and Message. Documents 12–20 have completed the corresponding revalidation, which is recorded in Appendix A and Appendix D.

---

## 7. Permission and Security Dependency

```text
Document 4 — Permission Semantics
        ↓
Document 8 — Domain Invariants
        ↓
Document 14 — Enforcement Architecture
        ↓
Document 15 — API and Tool Contracts
        ↓
Document 16 — Storage Controls
        ↓
Document 20 — Visible UX
```

A client, API, Tool, model or database role cannot independently grant authority.

---

## 8. Life Story Dependency

```text
Document 3 — INT-004
        ↓
Document 6 — M17
        ↓
Document 8 — Identity and Life Story Context
        ↓
Documents 12, 15 and 16 — Data, API and Storage
        ↓
Document 18 — Conceptual Research Scope
        ↓
Document 19 — Conceptual Research Protocol
        ↓
Document 20 — Participant UX
```

---

## 9. Community and Matching Dependency

```text
Document 3 — INT-001 and INT-002
        ↓
Document 6 — M18
        ↓
Document 8 — Community and Social Connection Context
        ↓
Documents 12, 14, 15 and 16
        ↓
Document 18 — Controlled Conceptual Prototype Scope
        ↓
Document 19 — Synthetic Scenario Programme
        ↓
Document 20 — Community, Matching, Connection and Message UX
```

The current Documents 0–20 M18 revalidation cycle is complete. Current work proceeds through traceable theory, synthetic evidence and prototype findings; external approval is not a current dependency.

---

## 10. AI Dependency

```text
Document 10 — AI Product and Human Boundary
        ↓
Document 17 — Orchestration and Model Operations
        ↓
Document 15 — Tool and Event Contracts
        ↓
Document 14 — Security and Provider Policy
        ↓
Documents 18–20 — Conceptual prototype, research protocol and UX
```

Document 10 governs what AI may do.

Document 17 governs how approved AI capability is operated.

---

## 11. Evidence and Research Dependency

```text
Document 2 — Evidence and Causal Concepts
        ↓
Document 9 — Evidence Integration
        ↓
Document 11 — Research and Evaluation
        ↓
Document 19 — Conceptual Research Protocol
        ↓
M12 Dataset and M13 Analysis
        ↓
M14 Reporting and External Submission
```

M10 owns evidence review and snapshots.

M13 owns ResearchFinding.

M14 owns external reporting and submission artefacts.

---

## 12. Safety and Moderation Dependency

```text
M18 UserReport or ContentReport
        ↓
ModerationCase and Human ModerationDecision
```

A separate concern may produce:

```text
Potential Harm
        ↓
M09 SafetySignal
        ↓
Human Triage
        ↓
SafetyEvent only if Confirmed
```

AI may raise `AISafetySignalRaised`; it does not own SafetyEvent.

---

## 13. Revalidation Rules

A change to the following requires downstream revalidation:

| Upstream Change | Required Revalidation |
|---|---|
| Document 0 system boundary | All Documents 1–20 |
| Document 3 intervention scope | Documents 6, 8, 11, 18, 19 and 20 |
| Document 4 permission formula | Documents 8, 10, 12–20 |
| Document 6 module ownership | Documents 7, 8 and 12–20 |
| Document 8 aggregate or event model | Documents 12–20 |
| Document 10 AI boundary | Documents 11, 14, 15, 17–20 |
| Document 11 evaluation model | Documents 12, 18–20 |
| Document 12 identifiers or lineage | Documents 13–20 |
| Document 14 Consent or security enforcement | Documents 15–20 |
| Document 15 contract | Documents 16–20 and implementation |
| Document 16 storage model | Documents 18–20 and implementation |
| Document 17 model or provider policy | Documents 18–20 and AI evaluation |
| Document 18 conceptual research scope | Documents 19 and 20 |
| Document 19 conceptual protocol | Document 20, simulations, prototype experiments and theoretical findings |
| Document 20 critical flow | QA, training, future operational readiness and analytics |

---

## 14. Conflict Resolution Precedence

When two documents disagree:

1. identify the subject;
2. apply the primary-authority table;
3. verify exact canonical versions in Appendix D;
4. inspect the affected Trace IDs and verification paths in Appendix A;
5. inspect the governing ADR and status in Appendix C, or create a Proposed ADR when no decision exists;
6. determine whether the downstream document is a permitted refinement or an unauthorised redefinition;
7. record unresolved conflict in Appendix F;
8. amend the primary source first;
9. update or supersede the ADR in Appendix C;
10. revalidate all downstream consumers;
11. update Appendix A, README and Appendix D.

---

## 15. Implementation Freeze Gates

The following must be stable before implementation freeze:

- M01–M18 ownership;
- M18 `Message`, `ConversationThread`, `MutualAcceptance` and `ConnectionRequest` decision;
- canonical event and UX analytics mapping;
- Consent scopes;
- visibility levels;
- Block propagation;
- AI Action Levels and Tool contracts;
- DatasetDefinition and DatasetLock authority;
- ProtocolVersion;
- Community and matching policy;
- moderation and Safety workflows;
- and Pilot feature flags.

---

## 16. Current Dependency and Research Status

The current canonical chain is:

```text
Document 1 v2.2 — Conceptual Research Foundation
        ↓
Document 11 v1.2 — Theoretical Evaluation Framework
        ↓
Document 18 v1.3 — Conceptual Research and Prototype Roadmap
        ↓
Document 19 v1.3 — Active Conceptual Research Protocol
        ↓
Document 20 v1.3 — Conceptual Prototype UX
```

The project has no external approval dependency in its current scope.

Current dependencies are intellectual and technical:

- source fidelity;
- explicit assumptions;
- formal consistency;
- synthetic-data provenance;
- reproducible simulations;
- traceable architecture decisions;
- and honest separation of theoretical, simulated and empirical claims.

A future project using real people, private data or production deployment would create a new dependency and approval map at that time.
