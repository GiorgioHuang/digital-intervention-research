# Appendix A — Architecture Traceability Matrix

**Version:** 1.3  
**Status:** Active Conceptual Research Traceability Baseline  
**Handbook Position:** Appendix A  
**Scope:** Canonical Documents 0–20 and supporting Handbook governance artefacts  
**Document Owner:** Architecture, Product and Research Governance  
**Last Updated:** 2026-07-31  
**Supersedes:** Appendix A — Architecture Traceability Matrix v1.2  
**Review Trigger:** A material change to mission, intervention portfolio, roles, permissions, module ownership, aggregate ownership, architecture decision, data meaning, API or event contracts, runtime topology, security controls, storage, conceptual prototype scope, conceptual research protocol, UX state, acceptance criteria or canonical document version

---

## 1. Purpose

This appendix provides the Handbook's authoritative cross-document traceability view.

It connects:

```text
Mission and Healthy Aging Challenge
        ↓
Conceptual Model and Evidence
        ↓
Intervention and Research Question
        ↓
Product Module and Bounded Context
        ↓
Aggregate, State, Command and Event
        ↓
Data, API, Runtime, Security and Storage
        ↓
Conceptual Research Work Package and Theoretical Protocol
        ↓
UX Flow and Verification Evidence
        ↓
Dataset, Analysis, Finding and Intervention Decision
```

The matrix is intended for:

- architecture review;
- product and research planning;
- implementation decomposition;
- theoretical review and future empirical planning;
- security and privacy review;
- API, event and database change control;
- conceptual research readiness;
- verification and validation;
- audit;
- and impact analysis.

This appendix records **traceability coverage**. It does not claim that software is implemented, that a provider is contracted, that a human-subject study is authorised or that an intervention is effective.

---

## 2. Traceability Principles

1. Every material requirement has a stable Trace ID.
2. Primary authority remains in Documents 0–20; this appendix links authorities but does not redefine them.
3. A downstream implementation may refine an upstream rule but may not silently change its meaning.
4. Product capability, bounded context, aggregate, API, storage and UX are different layers.
5. Traceability must preserve Participant rights, purpose, provenance, versions and human accountability.
6. Traceability includes negative requirements and prohibited actions.
7. Engagement and technical activity are not automatically Healthy Aging outcomes.
8. Architecture coverage, prototype implementation status, synthetic evidence and future empirical questions are reported separately.
9. A changed upstream authority triggers the downstream impact process in Appendix E.
10. Unresolved inconsistency is recorded in Appendix F.

---

## 3. Trace ID Convention

| Prefix | Trace Object |
|---|---|
| `DOC-xx` | Canonical Handbook document |
| `OBJ-xxx` | Strategic or Healthy Aging objective |
| `INT-xxx` | Canonical intervention identity from Document 3 |
| `M01`–`M18` | Product module |
| `ROLE-xx` | Human or system actor |
| `APR-xx` | Approval responsibility |
| `CTL-xxx` | Cross-cutting control |
| `RL-xx` | Research lifecycle stage |
| `MS-xx` | Delivery milestone |
| `M18-xx` | Community, matching, Connection and messaging state |
| `EVT-xxx` | Canonical event mapping |
| `ATR-xxx` | Architecture requirement |
| `CHG-xx` | Change-impact category |
| `ADR-xxx` | Architecture decision registered in Appendix C |

Trace IDs remain stable when wording is clarified. A materially different requirement receives a new ID and the old record is marked superseded rather than silently reused.

---

## 4. Authority and Precedence

```text
Documents 0–2
    Mission, conceptual and outcome authority
        ↓
Documents 3–5
    Intervention, permission and adaptation authority
        ↓
Documents 6–8
    Product, information and domain authority
        ↓
Documents 9–12
    Evidence, AI, research and data authority
        ↓
Documents 13–17
    Runtime, security, interface, storage and AI operations
        ↓
Documents 18–20
    Delivery, Pilot and UX implementation
```

Supporting appendices:

- **Appendix B** governs cross-document terminology and deprecated aliases.
- **Appendix C** governs material architecture decisions, decision status, rationale, consequences and review triggers.
- **Appendix D** governs canonical versions and review status.
- **Appendix E** governs authority precedence and revalidation.
- **Appendix F** governs unresolved consistency conflicts.
- **Appendix C**, when created, will govern individual Architecture Decision Records.

When two rows in this appendix appear to conflict, the primary source document and Appendix E take precedence.

---

## 5. Canonical Document Traceability Matrix

| Trace ID | Source | Title | Version | Primary Trace Responsibility | Review State | Canonical File |
|---|---|---|---|---|---|---|
| DOC-00 | Document 0 | Platform Ecosystem Architecture | 1.2 | Defines ecosystem systems, ownership boundaries, Handbook layers and governing sequence. | Reviewed | Document-0-Platform-Ecosystem-Architecture-v1.2.md |
| DOC-01 | Document 1 | Project Definition & Vision | 2.1 | Defines mission, scope, population, value proposition, success and non-success conditions. | Reviewed | Document-1-Project-Definition-and-Vision-v2.1.md |
| DOC-02 | Document 2 | Conceptual & Evidence Framework | 2.1 | Defines conceptual chain, mechanisms, moderators, outcomes, measurements, burden, harm and uncertainty. | Reviewed | Document-2-Conceptual-and-Evidence-Framework-v2.1.md |
| DOC-03 | Document 3 | Intervention Map | 2.3 | Defines Intervention identities, portfolio, evidence status, dependencies and MVP composition. | Reviewed | Document-3-Intervention-Map-v2.3.md |
| DOC-04 | Document 4 | User Roles & Permission Model | 3.0 | Defines actors, Relationships, Consent, permission, purposes, approvals and separation of duties. | Reviewed | Document-4-User-Roles-and-Permission-Model-v3.0.md |
| DOC-05 | Document 5 | Ability-Adaptive UX Principles | 2.1 | Defines ability-adaptive, accessible, reversible and semantically equivalent interaction principles. | Reviewed | Document-5-Ability-Adaptive-UX-Principles-v2.1.md |
| DOC-06 | Document 6 | Core Product Modules | 3.1 | Defines M01–M18 capability ownership, dependencies, MVP depth and module acceptance rules. | Reviewed | Document-6-Core-Product-Modules-v3.1.md |
| DOC-07 | Document 7 | Information Architecture | 3.0 | Defines role-specific workspaces, navigation, information hierarchy and cross-workspace composition. | Reviewed | Document-7-Information-Architecture-v3.0.md |
| DOC-08 | Document 8 | Core Domain Model & Ubiquitous Language | 3.2 | Defines canonical language, bounded contexts, aggregate ownership, invariants, states, commands and Domain Events. | Reviewed | Document-8-Core-Domain-Model-and-Ubiquitous-Language-v3.2.md |
| DOC-09 | Document 9 | Evidence & Knowledge Integration Architecture | 1.1 | Defines Knowledge Platform integration, EvidenceReview, EvidenceDecision, EvidenceSnapshot and knowledge feedback. | Reviewed | Document-9-Evidence-and-Knowledge-Integration-Architecture-v1.1.md |
| DOC-10 | Document 10 | AI Companion Architecture | 1.1 | Defines AI Companion roles, Context, memory, Tools, human authority and Participant-facing AI behaviour. | Reviewed | Document-10-AI-Companion-Architecture-v1.1.md |
| DOC-11 | Document 11 | Research & Evaluation Framework | 1.1 | Defines research lifecycle, study design, measures, process/effect evaluation, Dataset and Finding logic. | Reviewed | Document-11-Research-and-Evaluation-Framework-v1.1.md |
| DOC-12 | Document 12 | Data & Interoperability Architecture | 1.2 | Defines data meaning, identifiers, provenance, lineage, interoperability, minimisation and Dataset boundaries. | Reviewed | Document-12-Data-and-Interoperability-Architecture-v1.2.md |
| DOC-13 | Document 13 | System Context & Technical Architecture | 1.2 | Defines system context, module runtime ownership, topology, queues, provider placement and resilience. | Reviewed | Document-13-System-Context-and-Technical-Architecture-v1.2.md |
| DOC-14 | Document 14 | Security, Privacy & Consent Architecture | 1.1 | Defines security, privacy, Consent enforcement, Visibility, Block, provider, AI and research-data controls. | Reviewed | Document-14-Security-Privacy-and-Consent-Architecture-v1.1.md |
| DOC-15 | Document 15 | API, Event & Integration Specifications | 1.2 | Defines APIs, commands, errors, events, MCP Tools, callbacks, integration and compatibility contracts. | Reviewed | Document-15-API-Event-and-Integration-Specifications-v1.2.md |
| DOC-16 | Document 16 | Database & Storage Design | 1.2 | Defines relational schemas, constraints, object/Search/Vector storage, analytical storage, outbox and recovery. | Reviewed | Document-16-Database-and-Storage-Design-v1.2.md |
| DOC-17 | Document 17 | AI Orchestration & Model Operations | 1.1 | Defines model routing, Prompt and Tool operations, provider governance, evaluation, observability and AI incidents. | Reviewed | Document-17-AI-Orchestration-and-Model-Operations-v1.1.md |
| DOC-18 | Document 18 | Conceptual Research Scope & Prototype Roadmap | 1.3 | Defines theory work packages, synthetic scenarios, prototype checkpoints and conceptual success/failure criteria. | Active Conceptual Baseline | Document-18-Conceptual-Research-and-Prototype-Roadmap-v1.3.md |
| DOC-19 | Document 19 | Conceptual Research Programme & Theoretical Evaluation Protocol | 1.3 | Defines conceptual questions, formal methods, synthetic data, simulation, prototype experiments and epistemic boundaries. | Active Conceptual Baseline | Document-19-Conceptual-Research-Programme-and-Theoretical-Evaluation-Protocol-v1.3.md |
| DOC-20 | Document 20 | Conceptual Prototype UX Flows & Design System Specification | 1.2 | Defines exact UX flows, state presentation, design-system components, accessibility tests and release defects. | Reviewed | Document-20-Conceptual-Prototype-UX-and-Design-System-Specification-v1.3.md |

---

## 6. Strategic Objective Traceability

| Trace ID | Objective | Architecture Requirement | Primary Authority | Delivery and Verification Trace |
|---|---|---|---|---|
| OBJ-001 | Participant autonomy and control | Participants control Consent, Life Story, Visibility, matching, communication, AI memory and withdrawal. | D1 §§8–14, 19; D2 §§50, 79, 90; D4 §§23–34; D14 §§22–31; D20 Participant flows | D18 Participant acceptance; D19 acceptability/autonomy measures; D20 Consent, visibility, Block and withdrawal tests |
| OBJ-002 | Meaningful human connection | Technology supports human relationships rather than replacing them or optimising dependency. | D1 §§9.3–9.4, 16, 19; D2 §§37, 47; D3 INT-001–003; D11 §§26–28 | D18 vertical slice and success criteria; D19 human-connection measures; D20 interaction preparation/completion UX |
| OBJ-003 | Evidence-informed intervention design | Interventions trace to theory, evidence, mechanisms, KnowledgeReferences and EvidenceDecisions. | D2 §§17–35; D3 §§3–5; D9; D10 grounding rules | D18 Workstreams A/I; D19 EvidenceSnapshot and Protocol artefacts; D15/17 retrieval provenance tests |
| OBJ-004 | Research before claims | No product or AI activity is treated as benefit without governed evaluation and interpretation. | D1 §9.5 and §19; D2 §§57–89; D11; D19 §§120–169 | DatasetLock, AnalysisRun and ResearchFinding trace; non-success and failure criteria |
| OBJ-005 | Ability-adaptive and equitable access | Interaction adapts to ability, preference, language and context without changing rights or scientific meaning. | D2 §§65–79; D5; D20 §§285–309 | D18 accessibility gate; D19 accessibility measures; D20 accessibility and cross-device QA |
| OBJ-006 | Safety and social safety | Potential concerns become SafetySignals, human triage and, only when confirmed, SafetyEvents; Community harms use moderation and Block. | D8 §§48, 67–68; D14 §§21, 48, 50–54; D18 Workstream H; D19 Safety and moderation plan | Synthetic safety scenarios, moderation tests, pause/stop thresholds and human review |
| OBJ-007 | Privacy, purpose limitation and minimum necessary data | Every use is purpose-bound, permission-aware and minimised across APIs, AI, Search, providers and research. | D4 §§31–43, 56–60; D12 §§7–18, 40–49; D14; D15 §§33–36 | Security/privacy readiness; field/existence protection tests; DatasetDefinition variable review |
| OBJ-008 | AI as a controlled assistant | AI may explain, retrieve, suggest and Draft, but cannot take prohibited autonomous actions. | D10; D17; D4 §§48–55; D15 §§80–83 | AI Tool negative tests; confirmation and HumanReview evidence; AI incident and SafetySignal routing |
| OBJ-009 | Research reproducibility | DatasetDefinition, DatasetVersion, DatasetLock, AnalysisPlan, AnalysisRun and Finding remain distinct and traceable. | D8 §§51–53, 73–75; D11 §§29–40; D12; D16 §§35–36, 58–59 | D18 Milestone 12 and reproducibility tests; D19 DatasetDefinition and AnalysisPlan; manifests/checksums |
| OBJ-010 | Continuous learning and knowledge feedback | Findings produce accountable InterventionDecisions and governed feedback to the Knowledge Platform. | D0 §§11–13; D2 §§80–89; D9; D11 §§38–42 | EvidencePackage, ExternalSubmission and InterventionDecision lineage |
| OBJ-011 | Operational resilience and truthful degraded states | Dependency failure does not fabricate success, delivery, safety, analysis or approval. | D13 §§39–45; D15 §§66–75, 102; D16 backup/recovery; D17 degraded modes | Failure simulation, callback reconciliation, restore tests and exact UX failure states |
| OBJ-012 | Human accountability and separation of duties | High-impact decisions have accountable human owners and self-approval restrictions. | D4 §§44–47; D8 Governance and Audit context; D14 privileged access; D15 review contracts | ApprovalRecord, audit evidence, dual approval where required and negative permission tests |

---

## 7. Intervention Portfolio Traceability

| Intervention | Name | Current Scope | Primary Mechanisms | Principal Modules | Core Domain Records | Evaluation Trace | Primary Sources |
|---|---|---|---|---|---|---|---|
| INT-001 | Structured Social Connection | Required Core | Social connectedness, opportunity and supported interaction | M03, M06, M07, M08, M09, M18 | Connection/CommunicationBasis, InterventionAssignment, Session, Exposure, Reflection | Interaction completion, acceptability, burden, proximal connection outcomes | D3 INT-001; D18 core portfolio; D19 existing-contact and matching pathways |
| INT-002 | Interest-Based Connection and Open Matching | Required Core | Shared interests, agency, explainable discovery and mutual choice | M02, M03, M06, M07, M09, M18 | MatchPreference, MatchCandidate, MatchDecision, MutualAcceptance, Connection | Opt-in, candidate generation, explanation comprehension, MutualAcceptance, safety/fairness | D3 INT-002; D8 §§82–83; D18 Milestone 9; D19 §§123, 168; D20 §§143–157 |
| INT-003 | AI Companion-Facilitated Human Connection | Controlled AI Layer | Burden reduction, communication support and evidence-grounded preparation | M03, M07, M09, M10, M11, M17, M18 | AIInteraction, Tool invocation, Draft, HumanReview, SafetySignal | AI usefulness, accuracy, confirmation, burden, overreach and incident measures | D3 INT-003; D10; D17; D18 Workstream I; D19 AI measures; D20 AI UX |
| INT-004 | Life Story and Participant-Controlled Personal Archive | Required Core | Identity continuity, meaning, agency and selective sharing | M02, M03, M06, M07, M08, M11, M17 | LifeStoryArchive, LifeStoryItem, Contribution, Export, Visibility | Completion, authorship comprehension, sharing control, burden and qualitative meaning | D3 INT-004; D8 §41; D18 Milestones 6–7; D19 Life Story measures; D20 §§109–130 |
| INT-005 | Intergenerational Story Sharing | Controlled Optional | Reciprocity, contribution, intergenerational connection and meaning | M03, M06, M07, M08, M17, M18 | LifeStoryItem, selected sharing, Community or authorised Relationship | Participation, reciprocity, burden, privacy and qualitative experience | D3 INT-005; feature flag and Protocol approval required |
| INT-006 | Meaningful Daily Engagement | Portfolio Expansion | Routine, participation, interest and purposeful activity | M02, M06, M07, M08, M11 | InterventionAssignment, Session, Exposure, Adaptation, OutcomeRecord | Adherence, meaningful engagement, burden and proximal participation outcomes | D3 INT-006; outside initial integrated Pilot core |
| INT-007 | Contribution and Purpose | Portfolio Expansion | Agency, reciprocity, valued role and purpose | M03, M06, M07, M08, M18 | InterventionSession, contribution record or governed Community activity | Contribution, meaning, autonomy, burden and unintended pressure | D3 INT-007; future Protocol and InterventionVersion required |
| INT-008 | Participant-Controlled Family and Care Network | Controlled Optional | Support coordination, relationship clarity and Participant agency | M02, M03, M06, M07, M09, M17 | Relationship, SpecificPermission, Delegation, selected Life Story sharing | Support usefulness, Participant control, burden, conflict and revocation | D3 INT-008; M03 remains required even when intervention is disabled |
| INT-009 | Ability-Adaptive Onboarding and Navigation | Required Core | Access, burden reduction, confidence and inclusive participation | M02, M03, M05, M07, M08, M11 | AccessibilityProfile, preferences, adaptations, exposure and assistance provenance | Completion, assistance, usability, accessibility, missingness and equity | D3 INT-009; D5; D18 Milestone 5; D19 accessibility measures; D20 onboarding flows |
| INT-010 | External Memory and Orientation Support | Controlled Optional | Memory-demand reduction, orientation and confidence | M02, M03, M06, M07, M08, M11 | Preference, reminder/orientation support, AIInteraction and exposure | Usefulness, error, dependency, burden, autonomy and safety | D3 INT-010; separate risk, Consent and Protocol approval required |

### 7.1 Current Integrated MVP Configuration

```text
INT-009 — Ability-Adaptive Onboarding and Navigation
        +
INT-004 — Life Story and Participant-Controlled Personal Archive
        +
INT-001 — Structured Social Connection
        +
INT-002 — Interest-Based Connection and Open Matching
        +
INT-003 — Controlled AI Assistance
```

Controlled optional interventions require feature flags, approved InterventionConfiguration, Protocol authority and relevant Consent.

Portfolio-expansion interventions require a new or amended ProtocolVersion, approved InterventionVersion, DatasetDefinition impact review and updated verification evidence.

---

## 8. Product Module Capability and Implementation Traceability

| Module | Product Capability | Bounded Context | Principal Domain Records | Primary Human Roles | Product Source | Domain Source | API Source | Storage Source | Delivery Trace |
|---|---|---|---|---|---|---|---|---|---|
| M01 | Identity and Organisation Administration | Identity and Organisation | UserAccount; Organisation; OrganisationMembership; RoleAssignment; ServiceAccount | Organisation Administrator; System Administrator | D6 §25 | D8 §38 | D15 §39 | D16 §21 | D18 Milestones 3–5 |
| M02 | Participant Profile and Preferences | Participant and Preference | Participant; ParticipantProfile; AccessibilityProfile; communication and adaptation preferences | Participant; Research Coordinator; authorised Supporter | D6 §26 | D8 §39 | D15 §40 | D16 §22 | D18 Milestone 5 |
| M03 | Relationship, Consent and Permission | Relationship, Consent and Permission | Relationship; Consent; Delegation; SubstituteAuthority; PolicyDecision | Participant; Supporter; Coordinator; Privacy Reviewer; Approver | D6 §27 | D8 §40 | D15 §41 | D16 §§23–25 | D18 Milestones 1 and 5 |
| M04 | Research Project and Protocol | Research Design and Governance | ResearchProject; ResearchQuestion; Protocol; ProtocolVersion | Researcher; Coordinator; Research Approver; Safety/Privacy Reviewers | D6 §28 | D8 §43 | D15 §42 | D16 §26 | D18 Milestones 1 and 4 |
| M05 | Recruitment, Screening and Enrolment | Enrolment and Participation | ScreeningRecord; EligibilityDecision; Enrolment | Participant; Coordinator; Researcher; Approver | D6 §29 | D8 §44 | D15 §43 | D16 §27 | D18 Milestone 5 |
| M06 | Intervention Portfolio and Configuration | Intervention Portfolio | Intervention; InterventionVersion; InterventionConfiguration; InterventionDecision | Researcher; Intervention Owner; Evidence Reviewer; Approver | D6 §30 | D8 §45 | D15 §44 | D16 §28 | D18 Milestones 0–4 and 16 |
| M07 | Intervention Delivery | Intervention Delivery | InterventionAssignment; InterventionSession; Exposure; Adaptation; Fidelity | Participant; Coordinator; Researcher; Supporter where authorised | D6 §31 | D8 §46 | D15 §45 | D16 §29 | D18 Milestones 5–11 |
| M08 | Assessment, Observation and Outcome | Assessment, Observation and Outcome | AssessmentSchedule; AssessmentRecord; Observation; OutcomeRecord | Participant; Coordinator; Researcher; authorised observer | D6 §32 | D8 §47 | D15 §46 | D16 §§30–31 | D18 Milestones 11–12 and 15 |
| M09 | Safety and Escalation | Safety and Escalation | SafetySignal; SafetyEvent; SafetyAction | Participant/Supporter reporter; Coordinator; Safety Reviewer; Approver | D6 §33 | D8 §48 | D15 §47 | D16 §32 | D18 Milestones 11, 13–15 |
| M10 | Evidence Workspace and Knowledge Integration | Evidence and Knowledge Integration | KnowledgeReference; EvidenceReview; EvidenceDecision; EvidenceSnapshot; ResearchKnowledgeGap; ReferenceChangeAlert | Researcher; Evidence Reviewer; Approver; AI through controlled retrieval | D6 §34 | D8 §49 | D15 §48 | D16 §33 | D18 Milestones 1, 4 and 11 |
| M11 | AI Companion | AI Companion | AIConversation; AIInteraction; AIInterventionConfiguration; Version; AIMemoryItem | Participant; Researcher; Supporter; Caregiver; Administrators in context | D6 §35 | D8 §50 | D15 §49 and §§80–83 | D16 §34 | D18 Milestone 11 |
| M12 | Dataset and Data Quality | Dataset and Data Quality | DatasetDefinition; DatasetVersion; DataQualityIssue; TransformationRun; DatasetLock entity | Researcher; Data Manager/Analyst; Privacy Reviewer; Approver | D6 §36 | D8 §51 | D15 §50 | D16 §35 | D18 Milestone 12 |
| M13 | Analysis, Interpretation and Findings | Analysis, Interpretation and Findings | AnalysisPlan; AnalysisRun; InterpretationRecord; ResearchFinding | Researcher; Data Analyst; Research Approver; Safety/Privacy Reviewers | D6 §37 | D8 §52 | D15 §51 | D16 §36 | D18 Milestones 12 and 16 |
| M14 | Reporting and External Submission | Reporting and External Submission | Report; ReportVersion; ExportRequest; ExternalSubmission | Researcher; Coordinator; Approver; Privacy Reviewer | D6 §38 | D8 §53 | D15 §52 | D16 §37 | D18 Milestones 12 and 16 |
| M15 | Governance and Audit | Governance and Audit | ReviewRequest; ApprovalRecord; ConflictOfInterestRecord; AuditEvent | Approvers; Privacy/Safety Reviewers; Governance staff | D6 §39 | D8 §54 | D15 §53 | D16 §38 | D18 Milestones 1, 4 and all gates |
| M16 | Integration and Operations | Integration and Operations | ExternalSystem; ImportBatch; Operation; provider mapping/callback/reconciliation records | System Administrator; integration operations; authorised support | D6 §40 | D8 §55 | D15 §54 | D16 §39 and §57 | D18 Milestones 3, 10–13 |
| M17 | Life Story and Personal Archive | Identity and Life Story | LifeStoryArchive; LifeStoryItem; LifeStoryExport; LegacyPreference | Participant; authorised Supporter; Coordinator; Moderator where necessary | D6 §41 | D8 §41 | D15 §55 | D16 §40 | D18 Milestones 6–7 |
| M18 | Community, Social Connection and Open Matching | Community and Social Connection | PublicProfile; CommunitySpace; SocialPost; MatchPreference; MatchCandidate; MutualAcceptance; Connection; ConversationThread; Message; BlockRecord; ModerationCase; deferred ConnectionRequest | Participant; Moderator; Coordinator; Safety Reviewer; Researcher through scoped views | D6 §42 | D8 §42 | D15 §§56–58 | D16 §§41–45 | D18 Milestones 8–11 |

### 8.1 Module Boundary Rule

```text
Product Module
    ≠ Deployment Unit
    ≠ Database Schema
    ≠ Workspace
    ≠ Microservice
```

A module is the accountable capability and write-ownership boundary.

A module may be packaged with other modules in a modular monolith, but another module, provider, AI Tool, client or analytical process may not directly mutate its aggregate state.

---

## 9. Actor, Workspace and Approval Traceability

### 9.1 Actor and Workspace Matrix


| Trace ID | Actor | Primary Authority | Principal Workspaces | Principal Modules | Boundary | Sources |
|---|---|---|---|---|---|---|
| ROLE-01 | Participant | Own choices, testimony, preferences, MatchDecision, Message confirmation and rights actions. | Participant, Life Story, Community, Matching, Connection, Message, My Study | M02, M03, M05, M07, M08, M17, M18 | Cannot be overridden by Supporter convenience; supported decisions remain attributed to Participant. | D4 §7.1; D7; D20 Participant flows |
| ROLE-02 | Supporter | Provide scoped assistance, contribution or observation under current Relationship and SpecificPermission. | Supporter workspace; contribution and activity support | M02, M03, M07, M08, M17 | Relationship does not grant authority; cannot confirm Participant testimony, matching or Message send without verified authority. | D4 §7.2; D20 §§180–185 |
| ROLE-03 | Professional Caregiver | Provide scoped professional assistance or observation where authorised. | Care support view; Participant-specific authorised tasks | M03, M07, M08, M09 | Does not receive unrestricted clinical, Life Story or research access. | D4 §7.4; D6 workspace rules |
| ROLE-04 | Research Coordinator | Operate recruitment, enrolment, delivery, assessment and Participant support. | Research coordination, Participant list/detail, intervention monitoring | M02–M09, M15 | Cannot self-approve Protocol, Finding or DatasetLock unless separately assigned and permitted. | D4 §7.5; D20 §§72–77 |
| ROLE-05 | Researcher | Design ResearchQuestions, Protocols, interventions, datasets, analyses and findings. | Research Project, Evidence, Protocol, Dataset, Analysis and Reporting workspaces | M04, M06, M08, M10, M12–M14 | Drafting does not equal approval; production data access remains governed. | D4 §7.6; D20 §§57–91 |
| ROLE-06 | Data Analyst | Execute approved analyses against locked DatasetVersions. | Dataset and Analysis workspaces | M12, M13 | No direct production credentials; cannot redefine Dataset or approve Finding by default. | D4 §7.7; D11 §§32–40 |
| ROLE-07 | Research Approver | Approve ProtocolVersion, InterventionVersion, AnalysisPlan, Interpretation and ResearchFinding as assigned. | Review queues and approval views | M04, M06, M12, M13, M15 | Separation of duties, conflict-of-interest and self-approval rules apply. | D4 §§7.8, 44–47 |
| ROLE-08 | Evidence Reviewer | Assess evidence applicability, quality and EvidenceDecision. | Evidence workspace | M10, M15 | Does not publish external knowledge or approve unrelated research authority. | D4 §7.9; D9 |
| ROLE-09 | Safety Reviewer | Triage SafetySignals, confirm/close SafetyEvents and authorise SafetyActions. | Safety queue, triage and event views | M09, M15 | AI/provider cannot substitute; moderation and Safety remain separate. | D4 §7.10; D20 §§195–204 |
| ROLE-10 | Privacy Reviewer | Review Consent, data use, de-identification, export and privacy incidents. | Consent, Dataset, export and incident review | M03, M12, M14, M15 | Does not gain general Participant access outside review purpose. | D4 §7.11; D14 governance |
| ROLE-11 | Organisation Administrator | Manage Organisation membership and scoped roles. | Organisation administration | M01, M15 | Organisation membership does not grant Participant-data access. | D4 §7.12; D6 M01 |
| ROLE-12 | System Administrator | Operate platform infrastructure, integrations and restricted technical support. | System and integration administration | M01, M16 | Technical privilege does not create research, moderation or Safety authority; break-glass is exceptional. | D4 §7.13; D14 §§72–73 |
| ROLE-13 | AI Companion | Explain, retrieve, suggest, Draft and invoke approved Tools under effective AI permission. | Contextual AI entry points | M10, M11 plus owning modules through Tools | Cannot own Consent, MutualAcceptance, Connection, Message send, ModerationDecision, SafetyEvent, DatasetLock or ResearchFinding. | D4 §§48–55; D10; D17; D20 AI flows |

### 9.2 Approval Matrix


| Trace ID | Artefact or Action | Primary Approval Role | Required Evidence | Owning Modules | Sources |
|---|---|---|---|---|---|
| APR-01 | ProtocolVersion | Research Approver | Independent review; conflict-of-interest check; immutable after approval | M04 / M15 | D4 §44; D20 §§64–66 |
| APR-02 | InterventionVersion / Configuration | Research or designated Intervention Approver | EvidenceDecision, risks, safeguards, adaptation and dependencies reviewed | M06 / M15 | D3; D6 M06; D18 Workstream A |
| APR-03 | AIInterventionConfigurationVersion | AI Governance plus Research Approval | Models, Prompts, Tools, data classes, ActionLevels and provider policy | M11 / M15 | D10; D17; D20 §§68–69 |
| APR-04 | EvidenceDecision | Evidence Reviewer or designated Research Approver | Source version, applicability, quality, direction and uncertainty | M10 / M15 | D9; D20 §§59–63 |
| APR-05 | SafetyEvent closure | Safety Reviewer | Human rationale, actions, outcome and follow-up complete | M09 / M15 | D4 §44; D19 Safety plan |
| APR-06 | DatasetLock | Authorised Data or Research Approver | Quality, Consent, lineage, de-identification and AnalysisPlan readiness | M12 / M15 | D11 §32; D20 §§82–83 |
| APR-07 | AnalysisPlan | Research Approver | Questions, estimands/methods, missingness, subgroup and interpretation rules | M13 / M15 | D11 §33; D19 AnalysisPlan |
| APR-08 | InterpretationRecord | Research Approver | Uncertainty, harms, burden, equity and alternative explanations | M13 / M15 | D11 §37; D20 §87 |
| APR-09 | ResearchFinding | Research Approver | Exact AnalysisRun and InterpretationRecord; claim strength and limitations | M13 / M15 | D11 §38; D20 §§88–89 |
| APR-10 | External export/submission | Data/Privacy and Research approval as required | Recipient, purpose, minimisation, de-identification and expiry | M14 / M15 | D4 §§59–60; D14 §58 |

---

## 10. Cross-Cutting Control Traceability

| Trace ID | Control | Canonical Rule | Primary Authority | Implementation and Verification | Affected Scope |
|---|---|---|---|---|---|
| CTL-001 | Effective Permission | Role + Relationship + Consent + Purpose + Context + SpecificPermission + ResourceState | D4; D8 §40; D14 §§15–27 | D15 request context and negative tests; D20 permission summary | All modules |
| CTL-002 | Consent lifecycle | Versioned item-level decisions, restrictions, expiry, withdrawal, supersession and re-consent | D4 §§23–30; D14 §§22–25 | D18/19 Consent artefacts; D20 §§95–102; deletion propagation | M03, M05, M12, M15 |
| CTL-003 | Ability-adaptive access | Preference before inference; semantic equivalence; no rights change; accessible recovery | D5; D2 §§65–79 | D18 accessibility gate; D19 measures; D20 §§285–309 and QA | M02, M03, M07, M08, M11 |
| CTL-004 | Visibility and publication | Private, Selected People, Connections, Community, Platform Public and separately approved Internet Public remain distinct | D8 §§30–31; D14 §28; Appendix B | D20 audience/visibility components; Internet Public disabled in Pilot | M03, M17, M18 |
| CTL-005 | Life Story authorship | AI Draft and SupporterContribution do not become ParticipantTestimony without Participant confirmation | D8 §41 and Life Story invariants; D10 | D18 Milestones 6–7; D19 Life Story measures; D20 §§111–128 | M17, M11, M03 |
| CTL-006 | Governed Community | Eligibility, CommunityRuleVersion, Visibility, Block, Report, human moderation, appeal and restoration | D8 §42; D14 §§50, 53 | D18 Milestone 8; D19 Community thresholds; D20 §§134–142 and Moderator flows | M18, M09, M15 |
| CTL-007 | Open Matching | Inactive by default; approved declared attributes; explanation; independent MatchDecision; prohibited attributes excluded | D8 §§82, 112; D14 §51 | D18 Milestone 9; D19 §§123, 168; D20 §§143–154 | M18, M03, M09 |
| CTL-008 | MutualAcceptance and Connection | Canonical source decisions, current validity, expiry/invalidation and single-use Connection activation | D8 §§82–83, 113; D12 §27 | D15 §57; D16 §§42–43; D18/19 negative scenarios; D20 §§155–157 | M18 |
| CTL-009 | CommunicationBasis and Message | Thread and send require current basis; Draft, confirmation, queue, transport and delivery remain separate | D8 §§83, 113; D12 §28 | D15 §58; D16 §43; D18 Milestone 10; D19 measures; D20 §§158–162 | M18, M16, M03/M07 sources |
| CTL-010 | Block, Mute, Disconnect and Report | Distinct effects; Block overrides discovery, matching, Connection, Thread, send, notification and AI Context | D8 §42 and Block policy; D14 §21 | D16 §44; D18/19 Block scenarios; D20 §§164–168 | M18, M16, M11 |
| CTL-011 | SafetySignal versus SafetyEvent | Automated or AI detection creates provisional SafetySignal; authorised human confirms SafetyEvent | D8 §§67–68; D14 §54 | D18/19 synthetic scenarios; D20 §§195–203; AI negative tests | M09, M11, M15 |
| CTL-012 | AI authority | AI action is limited by human permission, approved configuration, task, Tool, data class and risk | D4 §§48–55; D10; D17 | D15 Tool contracts; D18 AI gate; D19 AI Consent/measures; D20 confirmation/refusal | M11 plus owning modules |
| CTL-013 | Evidence provenance | KnowledgeReference, EvidenceReview, EvidenceDecision and EvidenceSnapshot preserve external authority and exact versions | D2 §§20–35; D9 | D18 Workstream I; D19 Protocol artefacts; D15/17 retrieval records | M10, M04, M06 |
| CTL-014 | Data minimisation and lineage | Every datum has owner, purpose, provenance, class, retention and Dataset inclusion rule | D12; D14 §§29–31 | D19 data boundaries; D16 storage controls; D15 minimum event payload | All data-owning modules |
| CTL-015 | Dataset and analysis reproducibility | DatasetDefinition → DatasetVersion → DatasetLock → AnalysisPlan → AnalysisRun → InterpretationRecord → ResearchFinding | D8 §§51–53; D11 §§29–40 | D16 §§35–36, 58–59; D18 Milestone 12; D19 analysis | M12, M13, M15 |
| CTL-016 | Security and privacy | Deny by default, protected existence, encryption, secure providers, incident response and participant rights | D14 | D18 security/privacy gate; D15 security tests; D16 storage security; D20 error/rights UX | All modules |
| CTL-017 | Audit and separation of duties | High-impact actions preserve actor, purpose, source, decision, conflict and immutable audit | D4 §§44–47, 70–76; D8 §54 | ApprovalRecord, AuditEvent, negative self-approval tests and synthetic scenario and internal review evidence | M15 and all action owners |
| CTL-018 | Provider boundary | External provider evidence is translated through an Anti-Corruption Layer and never owns canonical domain state | D12 §§30–39; D13 integration placement; D14 provider security | D15 callback contracts; D16 M16/M18 write separation; reconciliation tests | M16 with M01/M10/M11/M18 |
| CTL-019 | Withdrawal, retention and deletion | Future actions stop; derived stores, providers and AI memory receive governed propagation; locked research history is handled explicitly | D4 §68; D12 deletion; D14 §§68–69; D16 deletion/recovery | D18/19 withdrawal scenarios; D20 §§174–179; reconciliation records | M03, M05, M12, M16, M17, M18 |
| CTL-020 | Failure and degraded modes | Unavailable dependencies produce accurate Pending, Failed, Unknown or restricted states rather than fabricated completion | D13 §§39–45; D15 §102; D17 degraded modes | Synthetic Pilot, provider outage, queue failure, Search/AI/Knowledge degradation and UX recovery tests | All runtime modules |

---

## 11. End-to-End Research Lifecycle Traceability

| Stage | Lifecycle Step | Owner | Canonical Records | Primary Sources | Required Evidence | Downstream Dependency |
|---|---|---|---|---|---|---|
| RL-01 | Healthy Aging Challenge and Problem Definition | D1 / D2 | HealthyAgingChallenge, ProblemDefinition, population/context | D0–D2 | Approved project rationale and conceptual trace | ResearchQuestion formation |
| RL-02 | Evidence discovery and applicability | M10 | KnowledgeReference, EvidenceReview, EvidenceDecision, EvidenceSnapshot | D2, D9, D15 §48 | Approved EvidenceDecision and immutable Snapshot | Protocol and InterventionVersion |
| RL-03 | ResearchQuestion and project design | M04 | ResearchProject, ResearchQuestion, objective, hypothesis | D8 §43; D11 §§7–9 | Approved question and project state | ProtocolVersion |
| RL-04 | Protocol definition and approval | M04 / M15 | Protocol, ProtocolVersion, approval references | D4 approval; D11 §10; D19 | Approved immutable ProtocolVersion | Screening, Consent and configuration |
| RL-05 | Intervention portfolio and configuration | M06 | InterventionVersion, InterventionConfiguration, AI configuration reference | D3; D6 M06; D10 | Approved exact intervention composition | Assignment and delivery |
| RL-06 | Recruitment, screening and eligibility | M05 | Invitation, ScreeningRecord, EligibilityDecision | D8 §44; D11 §11 | Human-accountable eligibility | Consent readiness and Enrolment |
| RL-07 | Granular Consent and Enrolment | M03 / M05 | Consent, PolicyDecision, Enrolment | D4; D14; D19 §§41 onward | Effective Consent and active Enrolment | InterventionAssignment |
| RL-08 | Intervention assignment and delivery | M07 | InterventionAssignment, Session, Exposure, Adaptation, Fidelity | D6 M07; D11 §12 | Traceable exposure and fidelity | Assessment and process measures |
| RL-09 | Participant intervention components | M17 / M18 / M11 | LifeStoryItem, Community activity, Match/Connection/Message process, AIInteraction | D3 core portfolio; D18 vertical slice | Participant-controlled interaction evidence | Reflection, assessment and qualitative data |
| RL-10 | Assessment, observation and outcome | M08 | AssessmentRecord, Observation, OutcomeRecord, missingness | D2 §§57–75; D11 §§14–17 | Versioned measurements and provenance | DatasetDefinition |
| RL-11 | Moderation, burden, harm and Safety | M18 / M09 | Report, ModerationCase, SafetySignal, SafetyEvent, action | D11 §§19–23, 28; D19 | Human dispositions and pause/stop evidence | Dataset and governance review |
| RL-12 | Dataset definition | M12 / M15 | DatasetDefinition, variable dictionary, inclusion/exclusion and de-identification rules | D11 §32; D12; D19 §150 | Approved extraction specification | DatasetVersion generation |
| RL-13 | Dataset generation and quality | M12 | DatasetVersion, TransformationRun, DataQualityIssue, manifest | D12; D16 §35 | Reproducible candidate dataset | Quality review and lock |
| RL-14 | Dataset lock | M12 / M15 | DatasetLock and DatasetVersionLocked | D8 §73; D15; D20 §§82–83 | Immutable approved analysis input | AnalysisRun |
| RL-15 | Analysis planning and execution | M13 | AnalysisPlan, AnalysisRun, AnalysisOutput | D11 §§33–36; D16 §36 | Reproducible code/environment/result | InterpretationRecord |
| RL-16 | Human interpretation | M13 / M15 | InterpretationRecord | D11 §37; D20 §87 | Approved interpretation with uncertainty and alternatives | ResearchFinding |
| RL-17 | ResearchFinding | M13 / M15 | ResearchFinding and claim classification | D2 §§84–88; D11 §38 | Approved, limited, rejected or superseded Finding | InterventionDecision and reporting |
| RL-18 | InterventionDecision | M06 / M15 | Retain, Revise, Restrict, Replicate, Expand, Suspend, Retire or Continue Research | D3; D11 §39 | Accountable portfolio decision | Next version or closure |
| RL-19 | Reporting, export and knowledge feedback | M14 / M10 | ReportVersion, ExportRequest, EvidencePackage, ExternalSubmission | D0 §12; D9; D11 §42 | Purpose-specific report and governed external feedback | Knowledge curation and future ResearchQuestions |

### 11.1 Research Lineage Invariant

```text
ResearchQuestion
→ EvidenceDecision
→ EvidenceSnapshot
→ ProtocolVersion
→ InterventionConfiguration
→ Enrolment
→ InterventionAssignment and Exposure
→ Assessment / Observation / Outcome
→ DatasetDefinition
→ DatasetVersion
→ DatasetLock
→ AnalysisPlan
→ AnalysisRun
→ InterpretationRecord
→ ResearchFinding
→ InterventionDecision
```

Where Life Story, Community, matching or messaging data are used, lineage additionally preserves:

- exact Consent and purpose;
- Visibility and audience;
- LifeStoryItem version;
- MatchPreference, MatchCandidate and MatchDecision versions;
- MutualAcceptance and Connection;
- CommunicationBasis and ConversationThread;
- exact Message process state;
- Block and moderation state;
- AI assistance provenance;
- provider translation evidence;
- and the DatasetDefinition decision to include or exclude each variable.

---

## 12. Delivery Milestone Traceability

| Milestone | Name | Scope | Primary Source | Exit Evidence | Principal Modules |
|---|---|---|---|---|---|
| MS-00 | Delivery Baseline | Canonical scope, versions, dependencies, backlog and governance artefacts | D18 §156 | Baseline approved; no unresolved authority conflict | All |
| MS-01 | Research and Governance Definition | ResearchQuestion, EvidenceDecision, Protocol, Consent, Safety, moderation and data plans | D18 §157 | Approvals and draft artefacts ready | M03, M04, M06, M09, M10, M15 |
| MS-02 | UX and Accessibility Definition | Role flows, content, accessibility modes, critical prototypes and tests | D18 §158 | Design and accessibility baseline approved | D02, M03, M17, M18 |
| MS-03 | Technical and Security Foundation | Identity, API edge, modular monolith, database, queue, storage, audit and provider boundaries | D18 §159 | Foundation and security controls pass | M01, M13–M16 |
| MS-04 | Researcher Governance Slice | ResearchProject, Evidence, Protocol, InterventionConfiguration, AI configuration and approvals | D18 §160 | End-to-end governed researcher flow | M04, M06, M10, M11, M15 |
| MS-05 | Participant Control and Onboarding Slice | Invitation, accessible Consent, profile, screening, Enrolment and rights | D18 §161 | Participant can enter and control study participation | M02, M03, M05 |
| MS-06 | Private Life Story Slice | Archive, Draft, AI assistance, confirmation, revision, withdrawal and export | D18 §162 | Authorship and private-by-default tests pass | M17, M11, M03 |
| MS-07 | Life Story Sharing and PublicProfile Slice | Item-level Visibility, selected sharing, Community/Platform Public rules and PublicProfile | D18 §163 | Audience and Consent controls pass | M17, M18, M03 |
| MS-08 | Governed Community Slice | CommunitySpace, rules, membership, SocialPost, Block, Report and moderation | D18 §164 | Moderator and social-safety readiness | M18, M09, M15 |
| MS-09 | Open Matching and MutualAcceptance Slice | MatchPreference, candidate, explanation, independent decisions and MutualAcceptance | D18 §165 | Prohibited-feature, expiry, Block and source tests pass | M18, M03, M09 |
| MS-10 | Connection, ConversationThread and Messaging Slice | Connection activation, CommunicationBasis, Thread, Draft, confirmation, delivery, Block and provider reconciliation | D18 §166 | Exact state, callback and privacy tests pass | M18, M16, M03/M07 |
| MS-11 | AI, Moderation and Safety Slice | AI Tools, HumanReview, moderation queue, SafetySignal triage and pause | D18 §167 | AI and Safety negative tests pass | M09, M11, M15, M18 |
| MS-12 | Dataset and Analysis Slice | DatasetDefinition, quality, lock, AnalysisPlan, AnalysisRun, Interpretation and Finding | D18 §168 | Reproducibility and approval tests pass | M12, M13, M15 |
| MS-13 | Full Synthetic Pilot | Complete success and failure paths with synthetic actors and provider simulations | D18 §169 | All mandatory scenarios pass or have governed exceptions | All |
| MS-14 | Conceptual Research Synthesis | Theory, architecture, synthetic data, simulation, prototype and contradiction review | D18 §§193–202 | Internal synthesis and revision decision | All |
| MS-15 | Controlled Pilot | Staged enrolment, monitoring, interim review, feature flags and pause controls | D18 §171; D19 | Protocol-compliant execution and audit | All Pilot modules |
| MS-16 | MVP Evaluation and Decision | DatasetLock, analysis, mixed-method interpretation, Finding and InterventionDecision | D18 §172 | Governed next decision and complete lineage | M06, M12–M15 |

### 12.1 Gate Interpretation

A milestone is not complete because:

- an endpoint exists;
- a screen renders;
- a table is present;
- an AI output is fluent;
- a provider returns success;
- or a test user completes the happy path.

Completion requires the applicable:

- authority;
- Consent and purpose;
- state and version;
- failure behaviour;
- Block and Safety behaviour;
- accessibility;
- audit;
- data lineage;
- negative testing;
- and approval evidence.

---

## 13. M18 Formation and Messaging Traceability

| Trace ID | State or Record | Entry Rule | Canonical Events | Participant UX | Permitted Research Process Data | Required Negative Test |
|---|---|---|---|---|---|---|
| M18-01 | MatchPreference | Participant opts in and selects approved attributes | MatchPreferenceActivated / Paused / Expired | Matching on/off and preferences | Opt-in, allowed categories, pause/withdrawal | Activation without Consent; prohibited attribute |
| M18-02 | MatchCandidate | Approved policy generates time-limited safe projection | MatchCandidateGenerated / Expired | Candidate card and expiry | Candidate count, expiry, explanation viewed | Blocked pair; private data leakage; fabricated candidate |
| M18-03 | MatchDecision | One actor records one decision for exact candidate version | MatchDecisionRecorded | Interested / Not Now / Dismiss / Block / Report | Actor-owned decision and reversal | Submitting other actor's decision; inference from profile view |
| M18-04 | MutualAcceptance | Compatible current independent decisions and current policy checks | MutualAcceptanceRecorded / Expired / Invalidated | Mutual interest confirmed, expired or unavailable | Creation, expiry, invalidation | Missing source; Block; Consent withdrawal; reuse |
| M18-05 | Connection | Valid unused MutualAcceptance is consumed to activate Connection | ConnectionActivated / Paused / Resumed / Disconnected | Connection state and controls | Activation, pause, disconnect | Arbitrary Connection; second activation from same acceptance |
| M18-06 | CommunicationBasis | Current approved basis permits Thread and send | Policy/evaluation record; no generic user event required | Why communication is permitted | Basis category only when approved | Candidate or unilateral decision treated as basis |
| M18-07 | ConversationThread | Exact participants, purpose and current basis | ConversationThreadCreated / Paused / Closed | Thread available or unavailable | Thread creation and state | Silent participant expansion; expired basis |
| M18-08 | Message Draft | Sender creates or revises content without external effect | MessageDraftCreated / Revised | Draft | Draft created/revised | Draft represented as sent; body enters general Search |
| M18-09 | SendConfirmation | Actor confirms exact Message version and recipients | MessageSendConfirmed | Send confirmed or confirmation required | Confirmation completed/abandoned | AI/helper confirmation; changed content after confirmation |
| M18-10 | Queue | Canonical command durably queues approved send | MessageQueued | Queued | Queue state and age | Queue failure shown as sent |
| M18-11 | Transport Send | M16 adapter submits the Message to provider or transport | MessageSent | Sent | Sent timestamp | Provider timeout treated as delivered |
| M18-12 | Provider Acceptance | Provider acknowledges technical acceptance | MessageProviderAccepted | Accepted by delivery service | Provider acceptance | Provider Accepted is not Delivered; false delivery presentation must fail |
| M18-13 | Delivery Outcome | Authenticated callback or reconciliation supports canonical outcome | MessageDelivered / MessageDeliveryFailed / MessageDeliveryCancelled | Delivered, failed or unknown | Delivery state, attempts and broad timing | Forged/duplicate callback; failed state hidden |
| M18-14 | Block and Report | Block immediately prevents new governed interaction; Report remains available | BlockCreated / BlockRevoked / UserReportSubmitted / ContentReportSubmitted | Blocked, report submitted, cancellation limitation | Block/report process measures | Block bypass; false external recall; reporter exposure |

### 13.1 Canonical M18 Boundaries

```text
MatchCandidate
    ≠ MatchDecision
    ≠ MutualAcceptance
    ≠ Connection
    ≠ CommunicationBasis
    ≠ ConversationThread
    ≠ Message
```

```text
Message Draft
    ≠ MessageSendConfirmed
    ≠ MessageQueued
    ≠ MessageSent
    ≠ MessageProviderAccepted
    ≠ MessageDelivered
    ≠ MessageRead
```

`ConnectionRequest` is a **Deferred Alternative Connection Basis** and is feature-disabled for the first Pilot.

---

## 14. Event and UX Analytics Mapping

| Trace ID | Canonical Domain Event | Owning Record | Module | UX Analytics or Interaction | Exact Meaning | Source |
|---|---|---|---|---|---|---|
| EVT-001 | ProtocolVersionApproved | ProtocolVersion | M04 | Approval UI success only after owning-domain result | Protocol approved | D8; D15 event catalogue |
| EVT-002 | ConsentRecorded | Consent | M03 | ConsentConfirmationSubmitted | Consent completed | D15 mapping pattern; D20 Consent |
| EVT-003 | LifeStoryItemConfirmed | LifeStoryItem | M17 | LifeStoryConfirmationSubmitted | Participant testimony confirmed | D8 Life Story; D20 §116 |
| EVT-004 | LifeStoryItemVisibilityChanged | LifeStoryItem | M17 | LifeStoryVisibilityChangeSubmitted | Audience changed | Replaces ambiguous LifeStoryVisibilityChanged alias |
| EVT-005 | PublicProfilePublished | PublicProfile | M18 | PublicProfileActivationSubmitted | Profile published to exact Platform audience | PublicProfileActivated is UX/legacy alias |
| EVT-006 | MatchDecisionRecorded | MatchDecision entity under MatchCandidate | M18 | MatchDecisionSubmitted | Decision saved | D15 §57; D20 §342 |
| EVT-007 | MutualAcceptanceRecorded | MutualAcceptance | M18 | No user click establishes this event | Mutual interest confirmed | MatchCompleted is prohibited ambiguity |
| EVT-008 | ConnectionActivated | Connection | M18 | ConnectionActivationSubmitted | Connection active | Separate from MutualAcceptance |
| EVT-009 | ConversationThreadCreated | ConversationThread | M18 | Thread creation requested | Conversation available | Requires current CommunicationBasis |
| EVT-010 | MessageSendConfirmed | Message | M18 | MessageSendConfirmationSubmitted | Send confirmed / queued next | Not Sent or Delivered |
| EVT-011 | MessageSent | Message | M18 after M16 evidence | No UX alias required | Sent to provider/transport | Distinct from provider acceptance |
| EVT-012 | MessageProviderAccepted | Message | M18 after M16 translation | Provider status viewed | Accepted by delivery service | Not Delivered |
| EVT-013 | MessageDelivered | Message | M18 after authenticated evidence | MessageDeliveryStatusViewed | Delivered | MessageDeliveryConfirmed is deprecated alias |
| EVT-014 | BlockCreated | BlockRecord | M18 | BlockConfirmationSubmitted | Block active | ActorBlocked is deprecated alias |
| EVT-015 | UserReportSubmitted / ContentReportSubmitted | Report record | M18 | Report form submitted | Report acknowledged | UserReported/ContentReported deprecated |
| EVT-016 | SafetySignalRecorded | SafetySignal | M09 | Concern submitted or AISafetySignalRaised | Concern awaiting triage | SafetyEventDetected is prohibited |
| EVT-017 | SafetyEventCreated | SafetyEvent | M09 | Human conversion/confirmation action | Confirmed SafetyEvent | Requires authorised human |
| EVT-018 | DatasetVersionLocked | DatasetVersion/DatasetLock | M12 | DatasetLockConfirmationSubmitted | Dataset locked | DatasetLockConfirmed is UX alias only |
| EVT-019 | AnalysisRunCompleted | AnalysisRun | M13 | Analysis run status viewed | Analysis completed | Not Interpretation or Finding |
| EVT-020 | ResearchFindingApproved | ResearchFinding | M13 | Finding approval submitted | Finding approved | Not external publication |

### 14.1 Event-Layer Rule

```text
UX Analytics Event
    = evidence that an interaction occurred

Domain Event
    = completed fact owned by the aggregate

Integration Event
    = deliberate stable cross-boundary contract

Operational Event
    = runtime condition

Audit Event
    = accountable access, decision or action evidence
```

A UX click, provider callback or AI response cannot impersonate a completed Domain Event.

---

## 15. Core Architecture Requirements Traceability Matrix

| Requirement | Concern | Required Outcome | Source Authority | Architecture Realisation | Verification Evidence | Coverage Status |
|---|---|---|---|---|---|---|
| ATR-001 | System ownership | Knowledge Platform, Research Platform and AI Companion retain distinct responsibilities. | D0, D1 | D6/D8 boundaries; D13 topology | Architecture review and integration contract test | Covered |
| ATR-002 | Participant-centred control | Participants retain understandable, reversible control over consent, content, matching, communication and withdrawal. | D1, D2 | D3–D5; D17/M18; D20 flows | Usability, Consent, visibility, Block and withdrawal tests | Conceptually covered; empirical evidence not claimed |
| ATR-003 | Canonical permission | Every sensitive action uses the full effective-permission formula. | D4 | D8 invariants; D14 enforcement; D15 request context; D16 controls | Positive/negative permission and protected-existence tests | Covered |
| ATR-004 | Immutable approved versions | Approved Protocol, Intervention, AI configuration, Dataset lock and Findings preserve version history. | D4, D8 | D6, D10–D13, D16 | State-transition and immutability tests | Covered |
| ATR-005 | Evidence traceability | Intervention and Protocol decisions trace to exact EvidenceDecisions and EvidenceSnapshots. | D2, D3, D9 | M10 APIs/storage; D18/19 artefacts | Evidence lineage and reference-change tests | Covered |
| ATR-006 | Ability adaptation | Adaptation reduces burden without changing rights, intervention meaning or measurement interpretation. | D5 | D2 conceptual rules; D11 evaluation; D20 UX | Accessibility, semantic-equivalence and adaptation-fidelity tests | Conceptually covered; empirical evidence not claimed |
| ATR-007 | Life Story authority | AI/supporter content cannot become ParticipantTestimony without Participant confirmation. | D3 INT-004; D8 | D12/D15/D16 M17; D20 Life Story flows | Authorship, confirmation, correction and withdrawal tests | Covered |
| ATR-008 | Governed Community | Community release requires rules, Block, Report, moderation, appeal and Safety routing. | D3, D8 | D14, D15, D16, D18 | Synthetic abuse, reporter-protection and appeal tests | Covered; operational staffing pending |
| ATR-009 | Opt-in matching | Open Matching is inactive by default and uses approved attributes only. | D3 INT-002; D8 | D12 §27; D14 §51; D15 §57; D16 §42 | Prohibited-feature, expiry, fairness and Block tests | Covered; policy approval pending |
| ATR-010 | Independent MatchDecision | One actor cannot submit or infer another actor's decision. | D8 | D15/D16 M18 contracts | Ownership and disclosure negative tests | Covered |
| ATR-011 | MutualAcceptance integrity | MutualAcceptance requires canonical source records, current validity and single-use activation. | D8 v3.2 | D12 §27; D15 §57; D16 §42 | Expiry, invalidation, Block and reuse tests | Covered |
| ATR-012 | Connection boundary | Connection is activated from MutualAcceptance and does not create Supporter, care or research authority. | D8 | D14 §20; D15 §57; D16 §43 | Connection-source and permission tests | Covered |
| ATR-013 | CommunicationBasis | ConversationThread and Message send require a current approved CommunicationBasis. | D8 v3.2 | D12 §28; D15 §58; D16 §43 | Invalid/expired basis and participant-set tests | Covered |
| ATR-014 | Exact Message state | Draft, confirmation, queued, sent, provider accepted, delivered, failed and unknown remain distinct. | D8/D15 | D12/D13/D16; D20 presentation | Callback, ordering, queue failure and UX comprehension tests | Covered; provider selection pending |
| ATR-015 | Message privacy | Message body is excluded from general Search, matching, AI memory and ordinary research by default. | D12/D14 | D15 event minimisation; D16 storage exclusion; D19 DatasetDefinition | Index inspection, AI context and dataset-variable tests | Covered |
| ATR-016 | Block propagation | Block prevents discovery, formation, Thread, send, notification and AI context and handles pending delivery honestly. | D8/D14 | D13 jobs; D15 contracts; D16 §44; D20 UX | Synchronous enforcement, propagation and provider-limitation tests | Covered |
| ATR-017 | Safety authority | AI and automation create SafetySignals, never confirmed SafetyEvents. | D8/D10 | D14; D15 events; D17; D20 Safety flows | AI negative tests and human-triage scenarios | Covered |
| ATR-018 | AI authority | AI cannot autonomously approve, publish, connect, send, moderate, confirm SafetyEvent, lock dataset or approve Finding. | D4/D10 | D15 Tool levels; D17 runtime; D20 confirmation | Explicit Level 5 negative-test suite | Covered |
| ATR-019 | Dataset reproducibility | Every analysed dataset has exact definition, lineage, quality state, lock and manifest. | D11/D12 | D15 APIs/events; D16 storage | Regeneration, checksum, quality and lock tests | Covered |
| ATR-020 | Analysis and claim separation | AnalysisOutput, InterpretationRecord, ResearchFinding, InterventionDecision and publication are separate. | D2/D8/D11 | D13–D16; D18/19 | Approval, lineage and prohibited-state-transition tests | Covered |
| ATR-021 | Security and privacy | Sensitive data are protected by deny-by-default, purpose limitation, encryption, secure providers and incident response. | D4/D14 | D13, D15–D17 | Security acceptance, penetration, provider and recovery tests | Conceptually covered; external approval not applicable |
| ATR-022 | Auditability | Every material access, action, approval and exceptional authority is attributable and reviewable. | D4/D8 | D14 audit; D15 trace; D16 AuditEvent storage | Audit completeness and tamper-evidence tests | Covered |
| ATR-023 | Failure truthfulness | Failure or uncertainty never appears as success, delivery, approval or benefit. | D1 non-success; D13/D15 | D16 reconciliation; D20 error states | Degraded-mode and UX state tests | Covered |
| ATR-024 | Withdrawal propagation | Withdrawal and deletion affect future actions and derived stores without silently rewriting locked research history. | D4/D12/D14 | D16 propagation/recovery; D18/19/20 flows | End-to-end withdrawal and restore tests | Covered |
| ATR-025 | Conceptual research scope boundary | Current research uses synthetic inputs and begins without external approval; human-subject research is a separate future programme. | D18/D19 | D20 research-critical defects; ADR-061–ADR-064 | Synthetic-only inputs, non-production environment and explicit epistemic labels | Active conceptual research |

### 15.1 Coverage Status Vocabulary

| Status | Meaning |
|---|---|
| Covered | Canonical architecture, downstream implementation design and verification path exist. |
| Conceptually covered; empirical evidence not claimed | Architecture is complete, but real-Participant evidence has not yet been collected. |
| Conceptually covered; external approval not applicable | Design exists, but a formal security, privacy, governance, ethics or provider approval remains. |
| Not applicable to current conceptual phase | The requirement cannot be considered launch-ready until the named approval is complete. |
| Deferred by design | The capability is intentionally outside the current Pilot and must not be activated accidentally. |

---

## 16. Verification Evidence Matrix

| Verification Domain | Required Evidence | Principal Sources | Launch Consequence |
|---|---|---|---|
| Domain invariants | Aggregate unit tests, policy tests and state-transition tests | D8, D15, D16 | Failure blocks affected capability |
| Permission and protected existence | Positive, negative, field, object, collection and existence tests | D4, D14, D15 | Failure blocks all sensitive use |
| Consent and withdrawal | Versioned Consent, re-consent, withdrawal and propagation tests | D4, D14, D18–D20 | Failure blocks recruitment |
| Accessibility | Keyboard, screen reader, cognitive, visual, motor, language and recovery tests | D5, D18–D20 | Critical failure blocks Pilot |
| Evidence provenance | Reference/version, EvidenceDecision and Snapshot lineage | D9, D10, D17 | Failure blocks Protocol/AI claim |
| AI authority | Tool allowlist, confirmation, refusal and prohibited-action tests | D10, D15, D17, D20 | Failure blocks affected AI Tool |
| Life Story authorship | Draft, contribution, confirmation, visibility, export and withdrawal tests | D8, D15–D20 | Failure blocks Life Story release |
| Community social safety | Rules, Block, Report, moderation, appeal and reporter protection | D14–D20 | Failure blocks Community |
| Matching | Attribute allowlist, explanation, expiry, actor ownership, Block and fairness | D8, D12, D14–D20 | Failure blocks Open Matching |
| MutualAcceptance and Connection | Source, current checks, expiry, invalidation and single-use | D8, D12, D15–D20 | Failure blocks Connection |
| Messaging | CommunicationBasis, participants, Draft, confirmation, delivery and privacy | D8, D12–D20 | Failure blocks messaging |
| Provider boundary | Signature, replay, mapping, idempotency, reconciliation and write separation | D13–D16, D18–D20 | Failure blocks provider delivery |
| Safety | Signal triage, close-as-not-event, human conversion, action and pause | D8–D11, D14–D20 | Failure blocks Pilot |
| Dataset | Definition, lineage, quality, de-identification, manifest and lock | D11–D16, D18–D20 | Failure blocks analysis |
| Analysis and Finding | Plan approval, reproducibility, interpretation and claim approval | D11–D16, D18–D20 | Failure blocks Finding |
| Security and privacy | Threat model, testing, provider review, encryption, audit and incident response | D14, D18 | Failure blocks identifiable data |
| Reliability and recovery | Queue, degraded state, backup, restore and reconciliation | D13, D15–D18, D20 | Critical failure blocks launch |
| Synthetic Pilot | Happy path and mandatory negative/degraded scenarios | D18 §210; D19 §§203–204 | Failure blocks real enrolment |
| Operational readiness | Staffing, support, monitoring, response targets and training | D18 §§193–220 | Failure blocks activation |
| Governance and ethics | Approved Protocol, ethics, privacy, security and readiness references | D18, D19, Appendix D | Failure blocks recruitment |

---

## 17. Change-Impact Traceability

| Change ID | Change Type | Primary Authority | Mandatory Downstream Review | Required Action |
|---|---|---|---|---|
| CHG-01 | Mission, scope or success criteria | D0–D2 | D3, D6, D11, D18, D19 | Revalidate objectives, non-goals, measures and Pilot progression. |
| CHG-02 | New or revised Intervention | D2, D3 | D6–D12, D18–D20 | Create/version Intervention record, evidence decision, mechanism/outcome trace and Protocol impact. |
| CHG-03 | Role, Relationship, Consent or permission change | D4 | D6–D8, D12–D16, D18–D20 | Revalidate APIs, policies, data fields, UX, audit, tests and re-consent. |
| CHG-04 | Ability-adaptive behaviour | D5 | D7, D10–D12, D18–D20 | Verify semantic equivalence, exposure/fidelity and measurement impact. |
| CHG-05 | Module or capability ownership | D6 | D8, D12, D13, D15, D16 | Resolve aggregate owner before changing runtime, API or schema. |
| CHG-06 | Workspace/navigation change | D7 | D4–D6, D8, D20 | Verify authority, protected existence, task flow and accessibility. |
| CHG-07 | New aggregate, invariant, state or Domain Event | D8 | D12–D16, D18–D20, Appendix B | Update data, API/event, runtime, storage, UX aliases, tests and glossary. |
| CHG-08 | Evidence or Knowledge Platform contract | D9 | D10–D12, D15, D17–D19 | Revalidate identifiers, snapshots, provider contract, AI grounding and Protocol evidence. |
| CHG-09 | AI model, Prompt, Tool, memory or provider | D10, D17 | D4, D8, D12–D16, D18–D20 | Version configuration; security/privacy review; evaluation and negative tests. |
| CHG-10 | Research design, outcome or measurement | D11 | D2–D4, D8, D12, D18–D20 | Protocol amendment, DatasetDefinition and AnalysisPlan impact review. |
| CHG-11 | Data meaning, identifier or interoperability | D12 | D8, D13–D16, D18–D20 | Schema/API/event migration, lineage and downstream consumer review. |
| CHG-12 | Runtime topology or provider placement | D13 | D14–D17, D18 | Revalidate trust boundaries, ownership, reliability, operations and costs. |
| CHG-13 | Security/privacy control | D14 | D4, D12–D20 | Threat/risk review, Participant material and test updates. |
| CHG-14 | API, event, file, Webhook or MCP contract | D15 | D12–D17 and all clients | Compatibility, consumer inventory, migration and contract tests. |
| CHG-15 | Database/storage/index/retention change | D16 | D12–D15, D18–D20 | Migration, backup/restore, deletion, residency and reproducibility review. |
| CHG-16 | Conceptual prototype scope, work package or feature | D18 | D3, D6–D17, D19, D20 | Update synthetic scenarios, theoretical questions, prototype and UX interpretation. |
| CHG-17 | Conceptual research protocol change | D19 | D1, D2, D8, D11, D18, D20 | Update questions, assumptions, methods, synthetic data, simulations and epistemic classification. |
| CHG-18 | UX state, wording or component | D20 | D4, D5, D7, D8, D14, D15, D18, D19 | Check domain meaning, analytics mapping, accessibility and release-blocking defects. |

### 17.1 Change-Control Procedure

For every material change:

1. identify the primary authority using Appendix E;
2. assign or reference a Trace ID;
3. update the authoritative source first;
4. identify downstream documents from the matrix;
5. update Appendix B when canonical language changes;
6. update APIs, events, schemas, UX and tests where applicable;
7. record an Architecture Decision in Appendix C when the change is architectural;
8. update canonical versions and status in Appendix D;
9. record unresolved conflicts in Appendix F;
10. update this appendix's coverage and evidence references.

---

## 18. Current Coverage Assessment

| Area | Architecture Coverage | Implementation or Operational Status |
|---|---|---|
| Mission, conceptual model and interventions | Complete canonical baseline | Future intervention expansion remains governed |
| Roles, Consent and permission | Complete canonical baseline | Requires implementation and security acceptance evidence |
| Ability-adaptive UX | Complete principles and Pilot UX baseline | Real-Participant accessibility evidence pending |
| M01–M18 capability ownership | Complete | Modular-monolith implementation to be delivered |
| Domain model and language | Complete current baseline | Future changes require Document 8 first |
| Evidence and Knowledge integration | Complete architecture | Provider capability and contract validation required |
| AI Companion and operations | Complete architecture | Model/provider selection and approved configurations required |
| Research and evaluation | Complete architecture | Synthetic findings and prototype observations may be produced; no empirical claims are made |
| Data, API, runtime and storage | Complete current baseline | Implementation and operational validation required |
| Security, privacy and Consent enforcement | Complete architecture | Formal review, testing and provider approval required |
| MVP delivery and readiness | Complete roadmap | Milestones and gates must be executed |
| Conceptual Research Protocol | Active | Document 19 v1.3 governs theoretical analysis, synthetic modelling and prototype research; external approval is not applicable |
| UX flows and design system | Complete current Pilot baseline | Prototypes, usability and accessibility evidence required |
| Cross-document consistency | Complete; no open consistency conflicts | Continue change-control discipline |
| Architecture Decision Register | Appendix C v1.0 active | 60 established ADRs, 25 open implementation/approval ADRs and 6 superseded legacy entries registered |

---

## 18.1 Current Conceptual Research Interpretation

For the current project:

- Trace coverage is evaluated against theory, formal models, synthetic scenarios, simulations and prototypes;
- external approval is not a coverage status;
- human-subject recruitment and empirical outcome evidence are outside scope;
- mock providers and local infrastructure are acceptable;
- and future empirical requirements are recorded as deferred research questions rather than current blockers.

Appendix C ADR-061 through ADR-064 govern this interpretation.

---

## 19. Maintenance Rules

This appendix is updated when:

- a canonical document changes version;
- a new requirement, intervention, module, aggregate, state or event is introduced;
- an authority moves between documents;
- a Pilot feature changes scope;
- a new provider or external system is approved;
- a verification method changes;
- a requirement is deferred, rejected or superseded;
- or implementation evidence becomes available.

Maintenance rules:

- do not delete historical Trace IDs;
- mark superseded records and provide the replacement ID;
- do not mark a requirement `Covered` without an architecture realisation and verification path;
- do not mark a requirement `Implemented` without implementation evidence;
- do not mark a Pilot requirement `Approved` without the formal approval reference;
- use canonical terminology from Appendix B;
- use architecture decision status and rationale from Appendix C;
- use canonical versions from Appendix D;
- use dependency and authority rules from Appendix E;
- and record unresolved inconsistencies in Appendix F.

---

## 20. Summary

The architecture traceability model is:

```text
Objective
    ↓
Architecture Decision
    ↓
Intervention
    ↓
Module
    ↓
Bounded Context and Aggregate
    ↓
Data, API, Runtime, Security and Storage
    ↓
Delivery Milestone
    ↓
Pilot Procedure
    ↓
UX State
    ↓
Verification Evidence
    ↓
Dataset, Analysis, Finding and Decision
```

The central rule is:

> A requirement is traceable only when its authority, implementation boundary, Participant-facing meaning, verification evidence and downstream research consequence are all identifiable.

The current Handbook has complete architectural traceability coverage for the Documents 0–20 baseline and an active Architecture Decision Register in Appendix C.

This does not replace:

- implementation evidence;
- formal architecture decisions;
- security or privacy approval;
- provider contractual approval;
- governance or research ethics approval;
- a separate future empirical or operational programme;
- or real-Participant evaluation.
