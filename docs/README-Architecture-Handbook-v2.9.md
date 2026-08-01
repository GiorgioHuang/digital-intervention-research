# Healthy Aging Digital Intervention Research Platform

## Architecture, Delivery & Research Handbook

**Version:** 2.9  
**Status:** Active Conceptual Research Handbook Baseline  
**Primary Mission:** Design, deliver, evaluate and continuously improve evidence-informed digital interventions that support Healthy Aging  
**Current Scope:** Conceptual and theoretical research, synthetic simulation and non-production prototype exploration; no external approval gate  
**Last Updated:** 2026-07-31  
**Document Owner:** Conceptual Research and Architecture  
**Supersedes:** README — Architecture Handbook v2.8  
**Review Trigger:** A material change to Handbook structure, canonical versions, authority, document status, open conflicts, dependency rules, conceptual research scope or governance artefacts

---

## 1. Purpose

This Handbook aligns:

- Healthy Aging concepts and evidence;
- intervention design;
- Participant rights and Consent;
- roles, Relationships and permissions;
- Life Story;
- Community and Open Matching;
- AI Companion;
- research design and evaluation;
- data, APIs and storage;
- security and privacy;
- conceptual research and prototype exploration;
- and accessible UX

around one accountable objective:

> Design, deliver and evaluate Participant-controlled digital interventions that support meaningful Healthy Aging outcomes without weakening human authority, privacy, accessibility, social safety or research reproducibility.

---

## 1.1 Current Project Mode

This is a conceptual research project.

Current work may begin immediately and consists of:

- theoretical analysis;
- evidence and source synthesis;
- conceptual and causal modelling;
- domain and architecture formalisation;
- synthetic personas and data;
- simulation;
- and non-production prototypes.

The project does not currently recruit people, deliver interventions to real Participants, use private human-subject data or deploy a production service.

Accordingly, research ethics approval, institutional governance approval, provider approval and production readiness are not current prerequisites.

Consent, Safety, audit and approval concepts remain in the Handbook as design properties of a possible future platform and as subjects of theoretical analysis.

---

## 2. Current Review State

```text
Documents 0–5
    Reviewed

Documents 6–12
    Reviewed

Documents 13–17
    Reviewed

Documents 18–20
    Reviewed

Full Documents 0–20 Cross-Document Review
    Completed — No Open Consistency Issues
```

The Handbook is no longer governed by pending Batch review labels.

Current issue status:

- **0 Blocking conflicts**
- **0 High conflicts**
- **0 Medium issues**
- **0 Low issues**

The full conflict register is Appendix F.

---

## 3. Current Governance Artefacts

| Artefact | Version | Purpose | Canonical File |
|---|---:|---|---|
| Handbook README | 2.9 | Overview, navigation, authority and current state | `README-Architecture-Handbook-v2.9.md` |
| Full Consistency Review | 1.0 | Documents 0–20 review evidence and findings | `Documents-0-20-Handbook-Consistency-Review-v1.0.md` |
| Appendix A | 1.3 | Architecture requirements, decisions, modules, lifecycle, events, delivery and verification traceability | `Appendix-A-Architecture-Traceability-Matrix-v1.3.md` |
| Appendix B | 1.1 | Cross-document ubiquitous language and deprecated terms | `Appendix-B-Cross-Document-Ubiquitous-Language-and-Glossary-v1.1.md` |
| Appendix D | 2.9 | Canonical versions, status and review matrix | `Appendix-D-Handbook-Version-and-Status-Matrix-v2.9.md` |
| Appendix E | 1.9 | Dependency, authority and revalidation rules | `Appendix-E-Cross-Document-Dependency-and-Authority-Map-v1.9.md` |
| Appendix F | 1.7 | Remaining consistency conflicts and resolution order | `Appendix-F-Remaining-Consistency-Conflict-Register-v1.7.md` |

| Appendix C | 1.2 | Architecture decisions, status, rationale, consequences, open choices and supersession | `Appendix-C-Architecture-Decision-Register-v1.2.md` |

---

## 4. Ecosystem

```text
Healthy Aging Knowledge Platform
            ↓
Digital Intervention Research Platform
            ↓
AI Companion
```

- **Knowledge Platform:** evidence, ontology, theory, mechanisms, outcomes, measurements and provenance.
- **Research Platform:** ResearchProjects, Participants, Consent, ProtocolVersions, InterventionVersions, delivery, evaluation, Datasets and ResearchFindings.
- **AI Companion:** permission-aware explanation, retrieval, Drafting, adaptation and controlled Tool use.

The Knowledge Platform does not own Participant research operations.

The AI Companion does not own Consent, SafetyEvent, ModerationDecision, DatasetLock, ResearchFinding or another module's aggregate.

---

## 5. Governing Sequence

```text
Healthy Aging Challenge
        ↓
Evidence and Theory
        ↓
InterventionVersion
        ↓
ResearchQuestion and EvidenceDecision
        ↓
ProtocolVersion
        ↓
Consent, Eligibility and Enrolment
        ↓
Intervention Delivery and Human Connection
        ↓
Assessment, Moderation and Safety
        ↓
DatasetDefinition and DatasetVersion
        ↓
DatasetLock
        ↓
AnalysisRun and InterpretationRecord
        ↓
ResearchFinding
        ↓
InterventionDecision
```

---

## 6. Current Pilot Vertical Slice

The current MVP and Pilot baseline is:

### Participant-Controlled Life Story and Meaningful Human Connection

```text
Accessible Onboarding
        ↓
Private Life Story
        ↓
Participant Confirmation
        ↓
Optional Governed Community
        ↓
Existing Contact or Opt-In Open Matching
        ↓
Independent MatchDecision
        ↓
MutualAcceptance
        ↓
Connection and Limited Messaging
        ↓
Meaningful Human Interaction
        ↓
Reflection and Follow-Up
        ↓
DatasetLock, AnalysisRun and ResearchFinding
```

Internet Public is disabled by default.

Open Matching is opt-in.

Connection requires mutual choice.

AI remains a controlled support capability rather than the human relationship.

---

## 7. Canonical Permission Model

```text
Effective Permission
        =
Role
+ Relationship
+ Consent
+ Purpose
+ Context
+ Specific Permission
+ Resource State
```

Document 4 is authoritative for human permission semantics.

Effective AI Permission additionally intersects:

```text
Human Actor Permission
∩ Approved AI Configuration
∩ Approved Task
∩ Tool Permission
∩ Data Classification
∩ Action Risk
```

Documents 10 and 17 are authoritative for AI permission.

---

## 8. Canonical Product Modules

| Module | Name |
|---|---|
| M01 | Identity and Organisation Administration |
| M02 | Participant Profile and Preferences |
| M03 | Relationship, Consent and Permission |
| M04 | Research Project and Protocol |
| M05 | Recruitment, Screening and Enrolment |
| M06 | Intervention Portfolio and Configuration |
| M07 | Intervention Delivery |
| M08 | Assessment, Observation and Outcome |
| M09 | Safety and Escalation |
| M10 | Evidence Workspace and Knowledge Integration |
| M11 | AI Companion |
| M12 | Dataset and Data Quality |
| M13 | Analysis, Interpretation and Findings |
| M14 | Reporting and External Submission |
| M15 | Governance and Audit |
| M16 | Integration and Operations |
| M17 | Life Story and Personal Archive |
| M18 | Community, Social Connection and Open Matching |

Logical modules are not mandatory microservices.

Document 6 governs product capability boundaries.

Document 8 governs canonical aggregate ownership.

---

## 9. Canonical Document Index

| ID | Volume | Document | Version | Consistency Review | Canonical File |
|---:|---|---|---:|---|---|
| 0 | Foundation | Platform Ecosystem Architecture | 1.2 | Reviewed | `Document-0-Platform-Ecosystem-Architecture-v1.2.md` |
| 1 | Volume I — Product, Domain & Research Architecture | Project Definition & Vision | 2.2 | Active Conceptual Research Foundation | `Document-1-Project-Definition-and-Vision-v2.2.md` |
| 2 | Volume I — Product, Domain & Research Architecture | Conceptual & Evidence Framework | 2.1 | Reviewed | `Document-2-Conceptual-and-Evidence-Framework-v2.1.md` |
| 3 | Volume I — Product, Domain & Research Architecture | Intervention Map | 2.3 | Reviewed — HC-001 Resolved | `Document-3-Intervention-Map-v2.3.md` |
| 4 | Volume I — Product, Domain & Research Architecture | User Roles & Permission Model | 3.0 | Reviewed | `Document-4-User-Roles-and-Permission-Model-v3.0.md` |
| 5 | Volume I — Product, Domain & Research Architecture | Ability-Adaptive UX Principles | 2.1 | Reviewed | `Document-5-Ability-Adaptive-UX-Principles-v2.1.md` |
| 6 | Volume I — Product, Domain & Research Architecture | Core Product Modules | 3.1 | Reviewed | `Document-6-Core-Product-Modules-v3.1.md` |
| 7 | Volume I — Product, Domain & Research Architecture | Information Architecture | 3.0 | Reviewed | `Document-7-Information-Architecture-v3.0.md` |
| 8 | Volume I — Product, Domain & Research Architecture | Core Domain Model & Ubiquitous Language | 3.2 | Reviewed — HC-002, HC-003, HC-004 and HC-008 Resolved | `Document-8-Core-Domain-Model-and-Ubiquitous-Language-v3.2.md` |
| 9 | Volume I — Product, Domain & Research Architecture | Evidence & Knowledge Integration Architecture | 1.1 | Reviewed | `Document-9-Evidence-and-Knowledge-Integration-Architecture-v1.1.md` |
| 10 | Volume I — Product, Domain & Research Architecture | AI Companion Architecture | 1.1 | Reviewed | `Document-10-AI-Companion-Architecture-v1.1.md` |
| 11 | Volume I — Product, Domain & Research Architecture | Research & Evaluation Framework | 1.2 | Active Conceptual Research and Theoretical Evaluation Baseline | `Document-11-Research-and-Evaluation-Framework-v1.2.md` |
| 12 | Volume I — Product, Domain & Research Architecture | Data & Interoperability Architecture | 1.2 | Reviewed — Revalidated against Documents 8 v3.2 and 15 v1.2 | `Document-12-Data-and-Interoperability-Architecture-v1.2.md` |
| 13 | Volume II — Technical Architecture | System Context & Technical Architecture | 1.2 | Reviewed — Revalidated against Documents 8, 12 and 15 | `Document-13-System-Context-and-Technical-Architecture-v1.2.md` |
| 14 | Volume II — Technical Architecture | Security, Privacy & Consent Architecture | 1.1 | Reviewed | `Document-14-Security-Privacy-and-Consent-Architecture-v1.1.md` |
| 15 | Volume II — Technical Architecture | API, Event & Integration Specifications | 1.2 | Reviewed — Revalidated against Document 8 v3.2 | `Document-15-API-Event-and-Integration-Specifications-v1.2.md` |
| 16 | Volume II — Technical Architecture | Database & Storage Design | 1.2 | Reviewed — Revalidated against Documents 8, 12, 13 and 15 | `Document-16-Database-and-Storage-Design-v1.2.md` |
| 17 | Volume II — Technical Architecture | AI Orchestration & Model Operations | 1.1 | Reviewed | `Document-17-AI-Orchestration-and-Model-Operations-v1.1.md` |
| 18 | Volume III — Conceptual Research & Prototype Exploration | Conceptual Research Scope & Prototype Roadmap | 1.3 | Active | `Document-18-Conceptual-Research-and-Prototype-Roadmap-v1.3.md` |
| 19 | Volume III — Conceptual Research & Prototype Exploration | Conceptual Research Programme & Theoretical Evaluation Protocol | 1.3 | Active — No Human-Subject Approval Required | `Document-19-Conceptual-Research-Programme-and-Theoretical-Evaluation-Protocol-v1.3.md` |
| 20 | Volume III — Conceptual Research & Prototype Exploration | Conceptual Prototype UX Flows & Design System Specification | 1.3 | Active | `Document-20-Conceptual-Prototype-UX-and-Design-System-Specification-v1.3.md` |

The detailed status and issue condition for each document is maintained in Appendix D.

---

## 10. Volume Structure

### Foundation

- Document 0 — Platform Ecosystem Architecture

### Volume I — Product, Domain and Research Architecture

- Documents 1–12

### Volume II — Technical Architecture

- Documents 13–17

### Volume III — Delivery, Pilot and UX

- Documents 18–20

### Appendices

- Cross-document governance, traceability, glossary, decisions, versions, dependencies and conflicts

---

## 11. Sources of Authority

| Subject | Primary Authority |
|---|---|
| Ecosystem mission and system boundaries | Document 0 |
| Project definition and scope | Document 1 |
| Conceptual, causal, outcome and evidence framework | Document 2 |
| Intervention definitions and lifecycle | Document 3 |
| Roles, Relationships, Consent and permission | Document 4 |
| Ability-adaptive UX principles | Document 5 |
| Product modules | Document 6 |
| Information architecture | Document 7 |
| Domain model, aggregates and canonical language | Document 8 |
| Evidence integration | Document 9 |
| AI Companion product behaviour | Document 10 |
| Research and evaluation framework | Document 11 |
| Data semantics and interoperability | Document 12 |
| Technical topology | Document 13 |
| Security, privacy and Consent enforcement | Document 14 |
| API, event and integration contracts | Document 15 |
| Database and storage implementation | Document 16 |
| AI orchestration and model operations | Document 17 |
| Conceptual research scope, work packages and prototype checkpoints | Document 18 |
| Conceptual research programme and theoretical evaluation method | Document 19 |
| UX flows and design system | Document 20 |
| Versions and review state | README and Appendix D |
| Cross-document language | Document 8 and Appendix B |
| Dependencies and conflict resolution | Appendices E and F |

A downstream document may refine an upstream rule for a narrower approved scope.

It may not silently redefine the upstream authority.

---

## 12. Critical Cross-Document Boundaries

### Evidence, Findings and Publication

```text
M10 EvidenceDecision and EvidenceSnapshot
        ≠
M13 ResearchFinding
        ≠
M14 EvidencePackage or External Submission
```

### Moderation and Safety

```text
ModerationCase
        ≠
SafetySignal
        ≠
SafetyEvent
        ≠
AIIncident
```

### Life Story and AI

```text
AI Draft
        ≠
Participant Testimony
```

### Matching and Connection

```text
MatchCandidate
        ≠
MatchDecision
        ≠
MutualAcceptance
        ≠
Connection
```

### Messaging

```text
Message Draft
        ≠
Sent Message
        ≠
Delivered Message
```

### Research Analysis

```text
DatasetVersion
        ≠
DatasetLock
        ≠
AnalysisOutput
        ≠
InterpretationRecord
        ≠
ResearchFinding
```

---

## 13. Resolved Domain Conflicts and Remaining Issues

### Resolved — HC-001

Document 3 v2.3 aligns governed Community and opt-in Open Matching with the current MVP.

### Resolved — HC-002

Document 8 v3.2 makes `ConversationThread` and `Message` canonical M18 aggregate roots.

### Resolved — HC-003

Document 8 v3.2 makes `MutualAcceptance` a canonical M18 aggregate root with exact source records, policy version, effective period, validity, expiry and invalidation.

### Resolved — HC-004

`ConnectionRequest` is now a Deferred Alternative Connection Basis. It is feature-disabled for the first Pilot and acceptance creates MutualAcceptance.

### Resolved — HC-008

Document 8 v3.2 §133 defines canonical Domain Event, Integration Event and UX Analytics Event mappings.

### Interface Revalidation Completed — Document 15

Document 15 v1.2 now implements the Document 8 v3.2 model through explicit resources, commands, errors, events, provider callbacks, AI Tools, compatibility rules and first-Pilot tests.

### Data, Runtime and Storage Revalidation Completed — Documents 12, 13 and 16

- Document 12 v1.2 now defines MutualAcceptance, CommunicationBasis, ConversationThread, Message and delivery lineage.
- Document 13 v1.2 now assigns canonical Message state to M18 and provider transport, callback and reconciliation responsibilities to M16.
- Document 16 v1.2 now enforces source, single-use, Thread-basis, Draft, delivery-attempt, Block and provider-write constraints.

### Delivery, Protocol and UX Revalidation Completed — Documents 18, 19 and 20

- Document 18 v1.2 now uses independent formation and messaging delivery gates.
- Document 19 v1.2 now measures MutualAcceptance, Connection, CommunicationBasis and exact Message process states without treating activity as benefit.
- Document 20 v1.2 now separates UX Analytics interactions from Domain Events and presents accurate confirmation and delivery states.


### Remaining Issues

There are no remaining open cross-document consistency conflicts.

The Handbook has no Blocking, High, Medium or Low consistency issues recorded in Appendix F.

Document 15 v1.2 has completed interface-contract revalidation against Document 8 v3.2.

All Documents 0–20 have completed the current M18 consistency revalidation cycle.

Document 19 v1.3 is an active conceptual research protocol and does not involve human subjects. Human-subject research and production deployment are separate future programmes, not pending gates on the current work.

## 14. Canonical Language

Use:

- Healthy Aging Knowledge Platform
- Digital Intervention Research Platform
- AI Companion
- ResearchProject
- Participant
- Supporter
- ProtocolVersion
- InterventionVersion
- EvidenceDecision
- EvidenceSnapshot
- ResearchFinding
- KnowledgeReference
- DatasetVersion
- DatasetLock
- AIInterventionConfigurationVersion
- LifeStoryItem
- Participant Testimony
- Governed Community
- Open Matching
- MatchCandidate
- MatchDecision
- MutualAcceptance
- Connection
- SafetySignal
- SafetyEvent
- ModerationCase
- Platform Public
- Internet Public

Avoid or deprecate:

- Friendly Companion
- generic Intelligence Layer or Chatbot Layer
- Family Member as permission
- Caregiver as automatic access
- Full Access
- SafetyEventDetected
- AISafetyEvent
- DatasetLocked
- AIChangedData
- Under Review
- ambiguous Public Social Networking
- Open Peer Matching

Appendix B contains the complete mapping.

---

## 15. Version and Review Conventions

### Document Version

- **Major:** material scope, authority, governance or domain change.
- **Minor:** material clarification preserving the core authority model.

### Document Status

- Active Handbook Baseline
- Revised Baseline
- Draft for Governance or Ethics Review
- Superseded
- Archived
- Planned

### Consistency Review State

- Reviewed
- Reviewed with Open Issue
- Reviewed with Blocking Conflict
- Reviewed — Contingent
- Reviewed — Draft

A document may be complete but still have an unresolved consistency conflict.

---

## 16. Maintenance Rules

1. Preserve superseded files; never silently overwrite canonical history.
2. Update README and Appendix D after every canonical-version change.
3. Record new cross-document terms in Appendix B.
4. Record material architecture decisions and status changes in Appendix C.
5. Amend the primary authority before downstream implementations.
6. Revalidate downstream documents using Appendix E.
7. Record unresolved issues in Appendix F.
8. Maintain Appendix A traceability from objective and intervention through implementation, verification, Dataset, Finding and InterventionDecision.
9. Keep Participant-facing plain language mapped to canonical domain language.
10. Distinguish domain events, integration events and UX analytics events.
11. Treat Document 19 v1.3 as the active conceptual research and theoretical evaluation authority.
12. Begin theoretical research immediately using public or supplied sources, synthetic data, simulated actors and non-production prototypes.

---

## 17. Recommended Next Research Sequence

1. Begin the theoretical research programme in Document 19 v1.3.
2. Build the synthetic persona, scenario and data framework.
3. Formalise the core propositions, mechanisms and invariants.
4. Implement the non-production reference prototype with mock providers.
5. Run simulation, counterexample and failure-mode experiments.
6. Record theoretical findings and revise Documents 1–20 when contradictions are discovered.
7. Treat any future human-subject or production initiative as a separate programme.

---

## 18. Central Project Rule

> Every Platform capability must connect to a defined Healthy Aging challenge, intervention purpose, Participant or research need, evidence context, permission boundary, measurable outcome and accountable decision process.
