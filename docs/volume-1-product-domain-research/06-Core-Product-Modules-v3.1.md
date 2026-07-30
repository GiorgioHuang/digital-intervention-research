# Document 6 — Core Product Modules

**Version:** 3.1  
**Status:** Revised Product Module Baseline — MVP Scope Expanded  
**Handbook Volume:** Volume I — Product, Domain & Research Architecture  
**Primary System:** Digital Intervention Research Platform  
**Document Owner:** Product and Domain Architecture Governance  
**Approved By:** To be assigned  
**Last Updated:** 2026-07-29  
**Supersedes:** Document 6 — Core Product Modules v3.0  
**Domain Model Alignment Note:** This version includes two required MVP product and domain modules—**Life Story and Personal Archive** and **Community, Social Connection and Open Matching**. All eighteen module boundaries are aligned with Document 8 v3.2.

**Review Trigger:** A material change to module ownership, bounded-context mapping, platform scope, MVP capability, Life Story architecture, Community, Platform Public and Internet Public visibility, Open Matching, moderation, system boundaries, permission enforcement, AI Companion responsibilities, Knowledge Platform integration, safety workflow, Dataset lifecycle, research-finding workflow, or deployment decomposition

---

## 1. Purpose

This document defines the logical product modules of the **Healthy Aging Digital Intervention Research Platform**, the responsibility of each module, the boundaries between them, and the way they collaborate to complete an evidence-informed intervention research cycle.

The module architecture translates the Handbook's product, intervention, permission, accessibility, and domain rules into coherent product capabilities without prematurely defining technical deployment units.

> A product module owns one coherent business responsibility and its write model. It may compose information from other modules, but it must not silently become the owner of their records, permissions, approvals, or scientific decisions.

## 2. Scope

This document covers:

- logical product modules;
- module purpose and responsibility;
- module ownership of domain records;
- bounded-context mapping;
- module dependencies and collaboration;
- role- and permission-scoped product experiences;
- external Knowledge Platform integration;
- AI Companion placement;
- research, intervention, Life Story, Governed Community, Platform Public participation, Open Matching, moderation, safety, dataset, analysis, and finding workflows;
- MVP module depth;
- deferred capabilities;
- and module-governance rules.

This document does not define:

- physical database schemas;
- API payloads or endpoint details;
- event-envelope specifications;
- cloud infrastructure;
- deployment topology;
- final UX layouts or design tokens;
- Knowledge Platform ontology or curation workflow;
- model-provider implementation;
- or the final Pilot Protocol.

## 3. Relationship to Other Documents

### Depends on

- Document 0 — Platform Ecosystem Architecture v1.2
- Document 1 — Project Definition & Vision v2.1
- Document 2 — Conceptual & Evidence Framework v2.1
- Document 3 — Intervention Map v2.3
- Document 4 — User Roles & Permission Model v3.0
- Document 5 — Ability-Adaptive UX Principles v2.1
- Document 8 — Core Domain Model & Ubiquitous Language v3.2
- Batch 2 Handbook Consistency Review v1.0

### MVP Scope Amendment

The MVP requires:

- **INT-004 — Life Story and Personal Archive**;
- Governed Community and controlled Platform Public participation;
- and opt-in open matching.

These capabilities are not generic engagement features. They are governed intervention capabilities with Participant-controlled visibility, consent, moderation, matching transparency, blocking, reporting, safety, and research-evaluation requirements.

### Provides input to

- Document 7 — Information Architecture
- Document 9 — Evidence & Knowledge Integration Architecture
- Document 10 — AI Companion Architecture
- Document 11 — Research & Evaluation Framework
- Document 12 — Data & Interoperability Architecture
- Documents 13–17 — Technical Architecture
- Document 18 — MVP Scope & Delivery Roadmap
- Document 19 — Initial Pilot Research Protocol
- Document 20 — UX Flows & Design System Specification
- Appendix A — Architecture Traceability Matrix
- Appendix D — Document Status Register

---

# Part I — Product Module Principles

## 4. Domain-Aligned Modules

Modules should align with the bounded contexts and aggregate ownership defined by Document 8. Product convenience does not justify crossing authoritative write boundaries.

## 5. One Accountable Write Owner

Every material domain record has one owning module. Other modules may hold references, projections, caches, or approved snapshots.

## 6. Read Composition, Not Write Ownership

Dashboards and workspaces may compose cross-module read models. They do not gain authority to modify source aggregates.

## 7. Workflow Before Feature

A module exists to support a defined Participant, intervention, research, safety, governance, or operational workflow—not merely to group similar screens.

## 8. Intervention Before Engagement

Product success is intervention completion, meaningful Participant experience, safe human connection, research quality, and accountable learning—not maximum screen time or message volume.

## 9. Permission at Every Boundary

Module access and action availability are determined by effective permission, not by a role title, family relationship, organisation membership, or technical access alone.

## 10. AI as a Governed Capability

The AI Companion is one governed capability with contextual modes. Research, intervention-design, Participant, Supporter, and administrative assistance are not separate autonomous product authorities.

## 11. Evidence Before Intelligence

Evidence retrieval, provenance, uncertainty, applicability, and human Evidence Decisions remain visible before AI-supported recommendations or drafting.

## 12. Human Governance

Approval of Protocols, interventions, consent, Safety Events, Dataset Locks, interpretations, Research Findings, Intervention Decisions, and external submissions remains human-controlled.

## 13. Accessible and Ability-Adaptive

Participant-facing modules support understandable, reversible, and Participant-controlled adaptation without changing rights, Protocol meaning, intervention purpose, or measurement interpretation.

## 14. Version and Provenance by Default

Modules preserve exact Protocol, Intervention, AI configuration, measurement, dataset, analysis, and finding versions.

## 15. Loose Coupling

Modules evolve independently through stable domain contracts, references, commands, events, and Anti-Corruption Layers.

## 16. Modular Monolith Compatible

Logical module boundaries do not require microservices. The MVP may implement them in a modular monolith while preserving ownership and dependency rules.

## 17. Product Module Definition

A product module is a coherent business capability that normally contains:

- one primary bounded context or an explicitly governed group of closely related contexts;
- owned aggregate roots and write operations;
- application workflows;
- permission and policy checks;
- module-owned read models;
- domain events and integration contracts;
- user-facing entry points where applicable;
- and observability and governance obligations.

A module is not automatically a service, database schema, navigation item, team, or deployment.

---

# Part II — Ecosystem and Platform Boundary

## 18. Ecosystem

```text
Healthy Aging Knowledge Platform
        │
        │ evidence, ontology, theory, mechanisms,
        │ outcomes, measurements and provenance
        ▼
Evidence and Knowledge Integration Module
        │
        ▼
Digital Intervention Research Platform Modules
        │
        │ governed context and tools
        ▼
AI Companion
```

## 19. Research Platform Owns

- Research Projects and Research Questions;
- Participants and platform preferences;
- relationships, consent, delegation, permissions, and approval records;
- Protocols and Protocol Versions;
- interventions, Intervention Versions, configurations, and assignments;
- intervention delivery, exposure, adaptation, and fidelity;
- Life Story records, media, archive items, contribution attribution, sharing, export, and legacy preferences;
- public and community profiles, social content, communities, connection requests, matching preferences, match candidates, blocks, reports, and moderation cases;
- assessments, observations, Outcome Records, Safety Signals, and Safety Events;
- Evidence Reviews, Evidence Decisions, Evidence Snapshots, and local Research Knowledge Gaps;
- AI configuration and interaction records;
- Dataset Definitions, Dataset Versions, Dataset Locks, and quality records;
- Analysis Plans, Analysis Runs, Interpretation Records, Research Findings, and Intervention Decisions;
- reports, exports, and external-submission packages.

## 20. Knowledge Platform Owns

- authoritative evidence and Evidence Claims;
- ontology and terminology mappings;
- theories and mechanisms;
- Outcome Definitions and Measurement Definitions;
- source provenance and verification;
- curated Knowledge Gaps;
- semantic search and relationship traversal;
- and Knowledge Publication.

The **Healthy Aging Knowledge Graph** is a capability inside the Knowledge Platform. It is not an internal Research Platform module.

## 21. AI Companion Does Not Own

- evidence governance;
- Participant consent or relationship authority;
- Protocol approval;
- Intervention Version approval;
- eligibility or enrolment decisions;
- Safety Event confirmation or closure;
- Dataset Lock;
- Interpretation approval;
- Research Finding approval;
- Intervention Decision approval;
- or external Knowledge Publication.

---

# Part III — Product Module Architecture

## 22. Module Catalogue

| ID | Product Module | Primary Bounded Context | Classification | MVP |
|---|---|---|---|---|
| M01 | Identity and Organisation Administration | Identity and Organisation | Supporting | Required |
| M02 | Participant Profile and Preferences | Participant and Preference | Supporting Core | Required |
| M03 | Relationship, Consent and Permission | Relationship, Consent and Permission | Core Governance | Required |
| M04 | Research Project and Protocol | Research Design and Governance | Core | Required |
| M05 | Recruitment, Screening and Enrolment | Enrolment and Participation | Core | Required |
| M06 | Intervention Portfolio and Configuration | Intervention Portfolio | Core | Required |
| M07 | Intervention Delivery | Intervention Delivery | Core | Required |
| M08 | Assessment, Observation and Outcome | Assessment, Observation and Outcome | Core | Required |
| M09 | Safety and Escalation | Safety and Escalation | Core | Required |
| M10 | Evidence Workspace and Knowledge Integration | Evidence and Knowledge Integration | Core | Required |
| M11 | AI Companion | AI Companion | Core where used | Required, controlled |
| M12 | Dataset and Data Quality | Dataset and Data Quality | Core Research | Required |
| M13 | Analysis, Interpretation and Findings | Analysis, Interpretation and Findings | Core | Required |
| M14 | Reporting and External Submission | Reporting and External Submission | Supporting | Required, limited |
| M15 | Governance and Audit | Governance and Audit | Supporting Governance | Required |
| M16 | Integration and Operations | Integration and Operations | Generic Supporting | Required, limited |
| M17 | Life Story and Personal Archive | Identity and Life Story | Core Intervention | Required |
| M18 | Community, Social Connection and Open Matching | Community and Social Connection | Core Intervention | Required, controlled |

## 23. Module Dependency Direction

```text
M01 Identity and Organisation
        ↓
M02 Participant Profile and Preferences
        ↓
M03 Relationship, Consent and Permission
        ↓
M04 Research Project and Protocol
        ↓
M05 Recruitment, Screening and Enrolment
        ↓
M06 Intervention Portfolio and Configuration
        ↓
M07 Intervention Delivery
        ↓
M08 Assessment, Observation and Outcome
        ↓
M12 Dataset and Data Quality
        ↓
M13 Analysis, Interpretation and Findings
        ↓
M14 Reporting and External Submission
```

Cross-cutting modules are M09 Safety and Escalation, M10 Evidence Workspace and Knowledge Integration, M11 AI Companion, M15 Governance and Audit, and M16 Integration and Operations. M17 Life Story and Personal Archive and M18 Community, Social Connection and Open Matching are Participant-facing intervention modules that depend on M02, M03, M06–M11, and M15.

## 24. Module Ownership Rule

A product module owns only the write model assigned to its bounded context. It may consume other modules through:

- stable identifiers;
- versioned references;
- permission-scoped queries;
- read models;
- domain events;
- integration events;
- and explicit commands exposed by the owning module.

Direct cross-module table mutation is prohibited.

---

# Part IV — Detailed Module Responsibilities

## 25. M01 — Identity and Organisation Administration

### M01 — Purpose

Manage platform accounts, Organisations, Organisation Memberships, Role Assignments, Service Accounts, and identity verification without granting implicit Participant-data access.

### M01 — Owns

- UserAccount
- Organisation
- OrganisationMembership
- RoleAssignment
- ServiceAccount
- identity verification and account restrictions

### M01 — Does Not Own

- Participant consent
- interpersonal relationships
- research approval
- Participant profile content
- domain permissions derived from organisation membership

### M01 — Core Capabilities

- create and manage platform accounts;
- link and verify external identity-provider identities;
- create Organisations and membership records;
- assign scoped roles with start, expiry, and revocation;
- manage technical Service Accounts;
- review identity merge or split cases;
- apply account restrictions;
- provide role and actor references to permission evaluation.

### M01 — Primary Human Users

- Organisation Administrator
- System Administrator
- authorised identity operations staff

### M01 — Primary Dependencies

- M15 Governance and Audit
- M16 Integration and Operations

### M01 — Primary Outputs

- verified actor identity
- Organisation Membership
- scoped Role Assignment
- Service Account identity
- identity events

---

## 26. M02 — Participant Profile and Preferences

### M02 — Purpose

Manage the minimal Participant profile and Participant-controlled communication, language, accessibility, and notification preferences required for research and intervention participation.

### M02 — Owns

- Participant
- ParticipantProfile
- ParticipantContactMethod
- AccessibilityPreferenceRecord
- CommunicationPreferenceRecord
- profile corrections

### M02 — Does Not Own

- consent
- relationships
- screening or eligibility
- clinical records
- formal measurement results
- AI diagnostic inference

### M02 — Core Capabilities

- register a Participant and optionally link a User Account;
- manage preferred name and approved contact methods;
- record accessibility, communication, language, and notification preferences;
- record source and verification state for sensitive profile values;
- support correction and historical traceability;
- provide permission-scoped profile summaries to other modules;
- support temporary and persistent adaptation preferences.

### M02 — Primary Human Users

- Participant
- authorised Research Coordinator
- authorised Supporter for limited assistance

### M02 — Primary Dependencies

- M01
- M03
- M15

### M02 — Primary Outputs

- Participant reference
- profile read model
- accessibility preference
- communication preference
- correction history

---

## 27. M03 — Relationship, Consent and Permission

### M03 — Purpose

Determine who may perform which action on which resource, for which purpose and context, based on current relationships, consent, specific permissions, and resource state.

### M03 — Owns

- Relationship
- RelationshipPermission
- Consent
- ConsentDecision
- Delegation
- SupportedDecisionMakingRecord
- SubstituteAuthority
- PolicyDecision

### M03 — Does Not Own

- role assignment
- Participant profile
- Protocol content
- Intervention delivery records
- UI visibility as a hard-coded role matrix

### M03 — Core Capabilities

- propose, verify, activate, restrict, suspend, expire, and revoke relationships;
- present versioned consent and record item-level decisions;
- record restrictions, withdrawal, expiry, supersession, and re-consent requirements;
- manage delegation without expanding authority;
- record supported decision-making assistance and decision attribution;
- verify substitute authority and decision-specific scope;
- evaluate effective permission;
- provide permission traces and conditions to every sensitive module.

### M03 — Primary Human Users

- Participant
- Supporter
- Research Coordinator
- Privacy Reviewer
- Research Approver
- Organisation Administrator

### M03 — Primary Dependencies

- M01
- M02
- M04
- M15

### M03 — Primary Outputs

- effective consent state
- active relationship state
- PolicyDecision
- permission conditions
- revocation events
- re-consent requirement

---

## 28. M04 — Research Project and Protocol

### M04 — Purpose

Design and govern Research Projects, Research Questions, Protocol identities, immutable Protocol Versions, objectives, hypotheses, project phases, and research approvals.

### M04 — Owns

- ResearchProject
- ResearchQuestion
- Protocol
- ProtocolVersion
- ResearchObjective
- Hypothesis
- Protocol amendment records
- project phase history

### M04 — Does Not Own

- Participant Enrolment
- intervention execution
- assessment responses
- Dataset Versions
- analysis outputs
- external ethics authority

### M04 — Core Capabilities

- create and govern Research Projects;
- define Research Questions, objectives, populations, contexts, and hypotheses;
- draft, review, approve, activate, suspend, supersede, and archive Protocol Versions;
- define eligibility, consent, intervention, measurement, data, safety, and analysis requirements;
- record internal and external approval references;
- manage project lifecycle separately from operational phase;
- evaluate whether amendments require a new version and re-consent;
- preserve exact approved Protocol content.

### M04 — Primary Human Users

- Researcher
- Research Coordinator
- Research Approver
- Safety Reviewer
- Privacy Reviewer

### M04 — Primary Dependencies

- M03
- M06
- M08
- M09
- M10
- M15

### M04 — Primary Outputs

- approved Research Project
- approved Research Question
- Approved or Active Protocol Version
- project phase
- review requirements

---

## 29. M05 — Recruitment, Screening and Enrolment

### M05 — Purpose

Manage invitation, screening, Eligibility Decisions, consent readiness, Enrolment, participation state, withdrawal, discontinuation, and follow-up.

### M05 — Owns

- RecruitmentInvitation
- ScreeningRecord
- EligibilityDecision
- Enrolment
- WithdrawalRecord
- FollowUpStatusRecord

### M05 — Does Not Own

- Consent decisions themselves
- Protocol criteria definitions
- Intervention Assignment
- assessment scoring
- AI eligibility authority

### M05 — Core Capabilities

- invite prospective Participants;
- present screening tasks and record permitted screening data;
- evaluate criteria and record human-accountable Eligibility Decisions;
- verify consent and baseline readiness;
- create and activate Enrolment against an exact Protocol Version;
- pause, resume, complete, discontinue, or withdraw participation;
- record withdrawal scope and effects on future collection and delivery;
- track follow-up status and loss to follow-up.

### M05 — Primary Human Users

- Participant
- Research Coordinator
- Researcher
- Research Approver where required

### M05 — Primary Dependencies

- M02
- M03
- M04
- M08
- M15

### M05 — Primary Outputs

- EligibilityDecision
- active Enrolment
- withdrawal effect
- follow-up status
- participation events

---

## 30. M06 — Intervention Portfolio and Configuration

### M06 — Purpose

Manage stable Intervention identities, immutable Intervention Versions, evidence status and direction, dependencies, project-specific Intervention Configurations, and human Intervention Decisions.

### M06 — Owns

- Intervention
- InterventionVersion
- InterventionConfiguration
- InterventionDecision
- intervention lifecycle maturity
- evidence status and direction

### M06 — Does Not Own

- actual delivery sessions
- Participant assignments
- Outcome evaluation
- Knowledge Platform evidence
- AI model-provider configuration outside an approved AI configuration

### M06 — Core Capabilities

- create Intervention records and versioned definitions;
- define population, context, objective, components, dose, sequence, mechanism, outcomes, risks, safeguards, and adaptation range;
- record Evidence Status and Evidence Direction through approved Evidence Decisions;
- declare dependencies and approved AI role;
- compose project-specific Intervention Configurations;
- submit and approve versions and configurations;
- suspend, supersede, retire, and archive versions;
- record Retain, Revise, Restrict, Replicate, Expand, Suspend, Retire, or Continue Research decisions.

### M06 — Primary Human Users

- Researcher
- Intervention owner
- Evidence Reviewer
- Research Approver
- Safety Reviewer
- UX and accessibility reviewer

### M06 — Primary Dependencies

- M03
- M04
- M09
- M10
- M11
- M15

### M06 — Primary Outputs

- Approved Intervention Version
- Approved Intervention Configuration
- evidence status
- evidence direction
- InterventionDecision

---

## 31. M07 — Intervention Delivery

### M07 — Purpose

Assign approved Intervention Configurations and record actual sessions, component delivery, exposure, adaptations, fidelity, deviations, pause, and completion.

### M07 — Owns

- InterventionAssignment
- InterventionSession
- InterventionComponentDelivery
- ExposureRecord
- FidelityRecord
- InterventionAdaptationRecord
- DeliveryDeviationRecord

### M07 — Does Not Own

- Intervention Version definition
- consent
- Safety Event confirmation
- scientific effectiveness
- Research Finding
- Supporter relationship authority

### M07 — Core Capabilities

- assign an approved configuration to an eligible and enrolled Participant;
- schedule and present intervention activities;
- support Participant-controlled and approved ability adaptations;
- record offered, declined, started, received, completed, skipped, failed, or not-applicable component states;
- record actual exposure and dose;
- record fidelity to Protocol, Intervention, AI, safeguard, and adaptation requirements;
- record delivery deviations and corrective action;
- pause, resume, discontinue, or complete assignments;
- support optional AI-assisted preparation while keeping human interaction as the intended outcome.

### M07 — Primary Human Users

- Participant
- Supporter where authorised
- Professional Caregiver where assigned
- Research Coordinator
- Researcher

### M07 — Primary Dependencies

- M03
- M04
- M05
- M06
- M09
- M11
- M15
- M16

### M07 — Primary Outputs

- InterventionAssignment state
- session record
- exposure
- adaptation record
- fidelity record
- delivery deviation

---

## 32. M08 — Assessment, Observation and Outcome

### M08 — Purpose

Schedule and administer assessments, capture source-labelled responses and observations, calculate governed scores, record Outcome Records, missingness, accessibility support, and quality flags.

### M08 — Owns

- AssessmentSchedule
- AssessmentRecord
- AssessmentResponse
- AssessmentScore
- Observation
- OutcomeRecord
- assessment invalidation and quality flags

### M08 — Does Not Own

- external Measurement Definition authority
- Safety Event confirmation
- Dataset construction
- scientific interpretation
- clinical diagnosis

### M08 — Core Capabilities

- reference exact measurement-instrument versions;
- schedule baseline, during-intervention, post-activity, follow-up, and other Protocol timepoints;
- collect Participant responses with source and assistance provenance;
- record Supporter or staff observations as observations rather than verified facts;
- record approved ability and administration adaptations;
- calculate scores with algorithm-version provenance;
- record Outcome Records and quality flags;
- record explicit missing-data reasons;
- invalidate records without deleting history.

### M08 — Primary Human Users

- Participant
- Research Coordinator
- Researcher
- authorised Supporter or Professional Caregiver for scoped assistance or observation

### M08 — Primary Dependencies

- M02
- M03
- M04
- M05
- M07
- M09
- M10
- M15

### M08 — Primary Outputs

- AssessmentRecord
- AssessmentScore
- Observation
- OutcomeRecord
- missingness code
- quality flag

---

## 33. M09 — Safety and Escalation

### M09 — Purpose

Receive and triage Safety Signals, create or confirm governed Safety Events, record safety actions, evaluate stopping rules, and coordinate authorised intervention or project pauses.

### M09 — Owns

- SafetySignal
- SafetyEvent
- SafetyAction
- SafetyEscalation
- StoppingRuleEvaluation
- safety review history

### M09 — Does Not Own

- clinical diagnosis or emergency-service operation
- automatic AI confirmation of harm
- Participant consent
- general technical incident management

### M09 — Core Capabilities

- accept Participant, Supporter, staff, assessment, AI, automated-rule, integration, and technical Safety Signals;
- triage severity and urgency;
- close a signal as not a Safety Event with rationale;
- create or confirm a Safety Event through authorised human review;
- record seriousness, expectedness, relatedness, actions, and outcome;
- pause an Intervention Assignment where authorised;
- recommend Research Project pause or recruitment stop;
- evaluate Protocol stopping rules;
- escalate to separately governed human, clinical, emergency, privacy, or incident pathways.

### M09 — Primary Human Users

- Participant for reporting
- Supporter for reporting
- Research Coordinator
- Safety Reviewer
- Research Approver
- Privacy Reviewer where applicable

### M09 — Primary Dependencies

- M03
- M04
- M05
- M06
- M07
- M08
- M11
- M15
- M16

### M09 — Primary Outputs

- SafetySignal disposition
- SafetyEvent
- SafetyAction
- pause requirement
- stopping-rule result
- escalation record

---

## 34. M10 — Evidence Workspace and Knowledge Integration

### M10 — Purpose

Connect the Research Platform to the external Healthy Aging Knowledge Platform and support local evidence review, applicability decisions, immutable evidence snapshots, local Research Knowledge Gaps, and governed external submissions.

### M10 — Owns

- KnowledgeReference
- EvidenceReview
- EvidenceDecision
- EvidenceSnapshot
- ResearchKnowledgeGap
- ReferenceChangeAlert
- local evidence-package preparation

### M10 — Does Not Own

- Knowledge Platform ontology
- external evidence curation
- external Knowledge Publication
- intervention approval
- Research Finding approval

### M10 — Core Capabilities

- search and retrieve Knowledge Platform resources through MCP or REST;
- normalise identifiers and preserve provenance;
- display evidence quality, verification, direction, conflict, and uncertainty;
- attach Knowledge References to Research Questions, Protocols, interventions, outcomes, and measurements;
- conduct local Evidence Reviews;
- record and approve canonical Evidence Decisions;
- create immutable Evidence Snapshots;
- identify and manage local Research Knowledge Gaps;
- detect external reference changes and require re-review;
- prepare governed Knowledge Gap or finding submission packages.

### M10 — Primary Human Users

- Researcher
- Evidence Reviewer
- Research Approver
- Intervention owner
- AI Companion through controlled retrieval

### M10 — Primary Dependencies

- M03
- M04
- M06
- M15
- M16
- external Knowledge Platform

### M10 — Primary Outputs

- KnowledgeReference
- EvidenceDecision
- EvidenceSnapshot
- ResearchKnowledgeGap
- reference-change alert
- Evidence Package

---

## 35. M11 — AI Companion

### M11 — Purpose

Provide one permission-aware, evidence-grounded, role- and task-adaptive assistance capability for research workflows and approved intervention support.

### M11 — Owns

- AIConversation where used
- AIInteraction
- AIInterventionConfiguration
- AIInterventionConfigurationVersion
- AIContextRecord
- AIToolInvocation
- AIActionProposal
- AIActionRecord
- AIReviewRecord
- AIMemoryItem
- AIAdaptationRecord
- AI evaluation and incident records

### M11 — Does Not Own

- evidence, Protocol, intervention, consent, relationship, safety, dataset, interpretation, finding, or publication authority
- separate Research Assistant or Intervention Design Assistant products

### M11 — Core Capabilities

- support contextual Researcher, Participant, Supporter, Professional Caregiver, and Administrator modes;
- assemble minimum-necessary permission-scoped context;
- retrieve Knowledge Platform evidence through M10;
- explain, summarise, suggest, draft, translate, transcribe, and support navigation;
- propose allowlisted tool actions;
- request confirmation or human review;
- execute only approved and permitted reversible actions;
- support intervention preparation, reflection, and ability adaptation;
- store visible, correctable, purpose-bound memory where approved;
- raise a Safety Signal rather than confirm a Safety Event;
- record model, instruction, retrieval, tool, policy, and provider provenance.

### M11 — Primary Human Users

- Researcher
- Participant
- Supporter
- Professional Caregiver
- Organisation Administrator
- System Administrator within explicit context

### M11 — Primary Dependencies

- M01
- M02
- M03
- M04
- M06
- M07
- M08
- M09
- M10
- M15
- M16

### M11 — Primary Outputs

- classified AI output
- draft
- suggestion
- AIActionProposal
- confirmed AIActionRecord
- human-review request
- AIMemoryItem
- SafetySignal request

---

## 36. M12 — Dataset and Data Quality

### M12 — Purpose

Define, generate, review, de-identify, version, and lock governed research datasets with complete source lineage and explicit quality state.

### M12 — Owns

- DatasetDefinition
- DatasetVersion
- DatasetLock
- DatasetManifest
- DataQualityIssue
- TransformationRun
- DeIdentificationRecord
- imputation and correction records

### M12 — Does Not Own

- source operational records
- Analysis Plan
- scientific interpretation
- unrestricted secondary use
- external data authority

### M12 — Core Capabilities

- define population, variables, source records, time windows, transformations, missingness, quality, and de-identification rules;
- check consent, purpose, and Protocol compatibility;
- generate versioned datasets from module-owned source records;
- record exact lineage, code or rule versions, and checksums;
- detect and manage Data Quality Issues;
- support de-identification and disclosure restrictions;
- complete quality review;
- lock a Dataset Version through authorised human approval;
- create new versions for post-lock corrections.

### M12 — Primary Human Users

- Researcher
- Data Manager
- Research Approver
- Privacy Reviewer
- authorised analyst

### M12 — Primary Dependencies

- M03
- M04
- M05
- M07
- M08
- M09
- M11
- M15

### M12 — Primary Outputs

- approved DatasetDefinition
- DatasetVersion
- quality report
- DatasetLock
- de-identification record
- lineage manifest

---

## 37. M13 — Analysis, Interpretation and Findings

### M13 — Purpose

Plan and execute governed analysis, preserve reproducibility, support human interpretation, create approved Research Findings, and provide evidence for Intervention Decisions.

### M13 — Owns

- AnalysisPlan
- AnalysisRun
- AnalysisOutput
- InterpretationRecord
- ResearchFinding

### M13 — Does Not Own

- source operational data
- Dataset Lock
- Intervention Decision ownership
- external Knowledge Publication
- AI approval authority

### M13 — Core Capabilities

- create and approve versioned Analysis Plans;
- execute approved analysis against exact locked Dataset Versions;
- record code, parameters, environment, warnings, diagnostics, and outputs;
- support descriptive, feasibility, acceptability, accessibility, safety, process, outcome, and qualitative analysis;
- draft and approve Interpretation Records;
- record uncertainty, limitations, alternative explanations, burden, harm, accessibility, and equity;
- draft, review, approve, limit, reject, supersede, withdraw, and archive Research Findings;
- preserve null, negative, mixed, harmful, inconclusive, and implementation-failure findings;
- provide approved findings to M06 for an Intervention Decision.

### M13 — Primary Human Users

- Researcher
- authorised analyst
- Research Approver
- Safety Reviewer for safety findings
- Privacy Reviewer where required

### M13 — Primary Dependencies

- M03
- M04
- M10
- M11
- M12
- M15

### M13 — Primary Outputs

- Approved Analysis Plan
- AnalysisRun
- AnalysisOutput
- InterpretationRecord
- ResearchFinding

---

## 38. M14 — Reporting and External Submission

### M14 — Purpose

Create governed reports, Participant-facing summaries, approved exports, Evidence Packages, external submissions, and publication references without changing source records.

### M14 — Owns

- Report
- ReportVersion
- ParticipantSummary
- ExportRequest
- ExportFile
- EvidencePackage
- ExternalSubmission
- ExternalPublicationReference

### M14 — Does Not Own

- Research Finding approval
- Knowledge Platform curation
- Dataset ownership
- consent
- unreviewed AI text as final report

### M14 — Core Capabilities

- create audience- and purpose-specific reports;
- generate Participant-facing summaries from permitted information;
- prepare research and governance dashboards;
- request, review, approve, generate, deliver, and expire exports;
- apply consent, purpose, recipient, de-identification, and disclosure rules;
- prepare Evidence Packages from approved Research Findings;
- submit approved packages to external authorities or the Knowledge Platform process;
- record external responses, identifiers, publication references, corrections, or retractions.

### M14 — Primary Human Users

- Participant for approved summary
- Researcher
- Research Approver
- Privacy Reviewer
- authorised external-submission coordinator

### M14 — Primary Dependencies

- M03
- M10
- M12
- M13
- M15
- M16

### M14 — Primary Outputs

- approved report
- Participant summary
- approved export
- Evidence Package
- ExternalSubmission
- publication reference

---

## 39. M15 — Governance and Audit

### M15 — Purpose

Coordinate review, approval, separation of duties, Conflict of Interest, Policy Decisions, immutable audit, governance tasks, and Architecture Decisions.

### M15 — Owns

- ReviewRequest
- ReviewDecision
- ApprovalRecord
- ApprovalCondition
- ConflictOfInterestRecord
- AuditEvent
- ArchitectureDecision

### M15 — Does Not Own

- the substantive content of another module's aggregate
- technical logging as the sole audit record
- AI approval

### M15 — Core Capabilities

- create, assign, track, and complete Review Requests;
- record Approve, Approve with Conditions, Reject, Return for Revision, Abstain, or Not Applicable decisions;
- apply approval to exact artefact versions;
- enforce separation of duties and recusal;
- record Conflict of Interest and restrictions;
- record material Policy Decisions;
- provide append-only audit of sensitive actions and decisions;
- track governance obligations and overdue reviews;
- record Architecture Decisions and supersession.

### M15 — Primary Human Users

- Research Approver
- Safety Reviewer
- Privacy Reviewer
- Evidence Reviewer
- Organisation Administrator
- authorised architecture and governance roles

### M15 — Primary Dependencies

- M01
- M03
- all governed modules

### M15 — Primary Outputs

- ReviewRequest
- ReviewDecision
- ApprovalRecord
- Conflict of Interest restriction
- AuditEvent
- ArchitectureDecision

---

## 40. M16 — Integration and Operations

### M16 — Purpose

Connect identity, Knowledge, AI, communication, storage, partner, and other external systems while preserving local domain boundaries, reliability, reconciliation, and operational visibility.

### M16 — Owns

- ExternalSystem
- ExternalIdentifierMapping
- ImportBatch
- OutboxMessage
- InboxMessage
- WebhookDelivery
- DeadLetterMessage
- ReconciliationRecord
- IdempotencyRecord
- NotificationDelivery
- BackgroundJob

### M16 — Does Not Own

- external source authority
- domain permission decisions
- Participant consent
- domain aggregate mutation outside owning-module commands
- Knowledge Platform content

### M16 — Core Capabilities

- register and configure external systems and capabilities;
- manage connector authentication references and approved purposes;
- translate external identifiers and schemas through Anti-Corruption Layers;
- validate imports before issuing domain commands;
- deliver authenticated and idempotent webhooks;
- provide transactional outbox and reliable inbox processing;
- manage durable background jobs, retries, and dead letters;
- deliver privacy-aware notifications;
- reconcile external and local states;
- surface operational health, failures, and degraded modes.

### M16 — Primary Human Users

- System Administrator
- Organisation Administrator for scoped integrations
- technical operations staff

### M16 — Primary Dependencies

- M01
- M03
- M15
- external providers

### M16 — Primary Outputs

- validated import
- integration event delivery
- notification result
- reconciliation record
- operational status

---


## 41. M17 — Life Story and Personal Archive

### M17 — Purpose

Support **INT-004 — Life Story and Personal Archive** as a required MVP intervention by enabling Participants to create, organise, preserve, revise, export, and selectively or publicly share stories, photographs, voice recordings, timelines, values, traditions, and other identity-bearing material.

### M17 — Owns

- LifeStoryArchive;
- LifeStoryItem;
- LifeStoryMedia;
- LifeStoryTimelineEntry;
- LifeStoryContribution;
- LifeStoryPrompt;
- LifeStorySharingPolicy;
- LifeStoryAccessGrant;
- LifeStoryRevision;
- LifeStoryExport;
- LegacyPreference;
- posthumous-access instruction;
- and Life Story moderation or sensitivity-review references.

### M17 — Does Not Own

- the Participant profile;
- general Community or social content;
- relationship or consent authority;
- external historical truth;
- cognitive assessment;
- clinical reminiscence therapy;
- or family ownership of the Participant's story.

### M17 — Core Capabilities

- create a Participant-controlled personal archive;
- capture text, voice, photographs, captions, people, places, work, interests, music, recipes, values, and traditions;
- organise items into timelines, themes, collections, or story sequences;
- invite approved contributions from Supporters or community members;
- preserve contribution attribution and distinguish Participant testimony from externally verified fact;
- allow the Participant to review, approve, revise, hide, delete, restore, export, or share each item;
- support visibility levels such as Private, Selected People, Connections, Community, Platform Public, and separately consented Internet Public;
- support granular media, topic, audience, download, re-sharing, and posthumous-access rules;
- provide sensitive-topic warnings, skip controls, pause, and distress escalation;
- connect approved Life Story items to human conversation, community participation, and intergenerational exchange;
- support AI-assisted transcription, organisation, drafting, translation, and prompt suggestions without inventing memories or claiming historical verification;
- evaluate identity continuity, self-expression, meaning, relationship quality, burden, distress, and sharing outcomes.

### M17 — Primary Human Users

- Participant;
- Supporter where specifically invited;
- Researcher;
- Research Coordinator;
- Safety Reviewer where a concern is raised;
- Privacy Reviewer where public or legacy use is involved;
- and authorised moderator for shared or public content.

### M17 — Primary Dependencies

- M02 Participant Profile and Preferences;
- M03 Relationship, Consent and Permission;
- M04 Research Project and Protocol;
- M06 Intervention Portfolio and Configuration;
- M07 Intervention Delivery;
- M08 Assessment, Observation and Outcome;
- M09 Safety and Escalation;
- M11 AI Companion;
- M14 Reporting and External Submission;
- M15 Governance and Audit;
- M16 Integration and Operations;
- M18 Community, Social Connection and Open Matching for Governed Community or Platform Public sharing.

### M17 — Primary Outputs

- Participant-controlled LifeStoryArchive;
- attributed LifeStoryItem;
- approved sharing state;
- Life Story intervention exposure and fidelity;
- LifeStoryExport;
- LegacyPreference;
- SafetySignal where required;
- and research measures related to identity, meaning, connection, burden, and distress.

---

## 42. M18 — Community, Social Connection and Open Matching

### M18 — Purpose

Support **Governed Community**, controlled **Platform Public participation**, and **Open Matching** as required MVP capabilities that facilitate meaningful human connection rather than maximise attention or replace relationships.

### M18 — Owns

- CommunitySpace;
- CommunityMembership;
- PublicProfile;
- SocialPost;
- Comment;
- Reaction;
- Follow or Subscription;
- ConnectionRequest;
- Connection;
- MatchPreference;
- MatchAvailability;
- MatchCandidate;
- MatchExplanation;
- MatchDecision;
- MatchIntroduction;
- BlockRecord;
- MuteRecord;
- UserReport;
- ContentReport;
- ModerationCase;
- ModerationDecision;
- CommunityRule;
- and social-content visibility state.

### M18 — Does Not Own

- Participant consent;
- interpersonal Relationship authority outside its own connection records;
- Life Story source content;
- Safety Event confirmation;
- clinical or sensitive-trait inference;
- hidden compatibility scoring;
- or unrestricted access to Participant records.

### M18 — Core Capabilities

- create a public or community-facing profile using Participant-selected fields;
- allow Participants to publish approved text, images, voice, Life Story excerpts, interests, questions, invitations, and activity updates;
- support public, community, connections-only, selected-recipient, and private visibility;
- create topic-based communities and local or setting-based groups;
- support follows, reactions, comments, replies, invitations, and connection requests;
- enable opt-in open discovery beyond existing family or care relationships;
- allow Participants to define visible interests, matching goals, location or distance boundaries, availability, language, communication mode, and exclusion preferences;
- generate explainable Match Candidates using only permitted attributes;
- require mutual acceptance before a private connection or direct communication is activated;
- allow a Participant to dismiss, block, mute, report, disconnect, or pause matching;
- support human moderation, community rules, content reporting, appeals, and transparent enforcement;
- prevent use of inferred sensitive traits unless explicitly consented, justified, and approved;
- measure meaningful conversations, new connections, belonging, participation, relationship continuity, rejection burden, harassment, discrimination, privacy concern, and moderation outcomes;
- support AI-assisted discovery explanation, introduction drafting, content accessibility, translation, and moderation triage without autonomous banning, sensitive-trait inference, or impersonation.

### Public and Open Do Not Mean Unrestricted

The MVP uses the following distinction:

```text
Platform Public Participation
    = discoverable or viewable by an eligible authenticated Platform audience
      according to the Participant's chosen Visibility and current policy

Open Matching
    = opt-in discovery of eligible people beyond existing relationships
      using declared matching preferences and mutual acceptance

Unrestricted Exposure
    = no meaningful consent, privacy, eligibility, moderation, blocking,
      purpose, or audience boundary
      → prohibited
```

An optional `Internet Public` visibility may be supported only through a separate explicit consent and publication flow. It is never the default.

### M18 — Primary Human Users

- Participant;
- Supporter where authorised to assist rather than control;
- Research Coordinator;
- Researcher;
- Community Moderator;
- Safety Reviewer;
- Privacy Reviewer;
- and Organisation Administrator for scoped community configuration.

### M18 — Primary Dependencies

- M01 Identity and Organisation Administration;
- M02 Participant Profile and Preferences;
- M03 Relationship, Consent and Permission;
- M04 Research Project and Protocol;
- M05 Recruitment, Screening and Enrolment;
- M06 Intervention Portfolio and Configuration;
- M07 Intervention Delivery;
- M08 Assessment, Observation and Outcome;
- M09 Safety and Escalation;
- M11 AI Companion;
- M15 Governance and Audit;
- M16 Integration and Operations;
- M17 Life Story and Personal Archive for shared story content.

### M18 — Primary Outputs

- CommunitySpace and membership;
- Participant-controlled PublicProfile;
- SocialPost and interaction records;
- MatchCandidate and MatchExplanation;
- mutual Connection;
- block, mute, report, and moderation records;
- Governed Community and social-connection intervention exposure and fidelity;
- SafetySignal where required;
- and research measures related to connection, belonging, participation, safety, privacy, equity, and burden.

---

# Part V — Cross-Module Product Capabilities

## 43. Permission-Scoped Read Models

Cross-module workspaces should use purpose-built read models assembled after permission evaluation.

| Read Model | Representative Sources | Write Authority |
|---|---|---|
| Participant Home | M02, M03, M05, M07, M08, M09 | None; commands route to owning modules |
| Supporter Activity View | M03, M07, M08, M09 | Only explicitly permitted actions |
| Research Project Dashboard | M04–M15 | None; actions route to owning modules |
| Safety Review Queue | M03, M05, M07–M09, M11 | M09 only for safety records |
| Dataset Readiness View | M04, M05, M07–M12, M15 | M12 only for Dataset records |
| Finding Lineage View | M04, M06, M10, M12–M15 | M13 and M14 for owned records |
| Life Story Archive View | M02, M03, M07–M11, M14, M15, M17 | M17 only for Life Story records |
| Community and Discovery View | M02, M03, M07–M11, M15, M18 | M18 only for community, social, matching, and moderation records |

## 44. Search and Discovery

- Search is a cross-cutting experience, not a universal authority.
- Search results are filtered before disclosure by role, relationship, consent, purpose, context, specific permission, and Resource State.
- The existence of a protected Participant, Safety Event, Dataset, or Finding may itself be hidden.
- Knowledge search routes through M10 and preserves external verification and provenance.
- Search does not grant write permission.
- Public-profile and community-content discovery remains separate from protected research-record search.
- Match discovery uses only Participant-declared or separately authorised attributes and returns an explanation of the main matching basis.

## 45. Notifications

- Notification preferences are owned by M02.
- Permission, consent, and relationship eligibility are checked through M03.
- Notification delivery is owned operationally by M16.
- The originating module owns the business reason and linked task.
- Sensitive details should not appear unnecessarily on lock screens or shared devices.
- Revocation stops future affected notifications.

## 46. Files and Media

- Files and media are stored through technical services but remain owned by the domain record that gives them meaning.
- Consent, classification, retention, malware scanning, access, and export rules apply.
- Object storage must not become a generic domain owner.
- MVP media support includes Life Story and public/community social content required by the approved Intervention Configuration and Protocol.
- Public or community media requires visibility, moderation, reporting, export, deletion, and re-sharing controls.

## 47. Workflow Tasks

- A workflow task is not the state of the governed artefact.
- Review tasks are owned by M15.
- Operational tasks may be generated by owning modules.
- Completion of a task does not automatically approve or transition the artefact.
- Overdue tasks should not silently block Participant withdrawal or safety reporting.

## 48. Audit and Observability

- Domain audit is owned by M15.
- Technical logs and metrics are operational observability, not substitutes for Audit Events.
- Every module should emit traceable events for material actions.
- Sensitive payloads should not be copied unnecessarily into logs.
- Correlation and causation identifiers should connect cross-module workflows.

---

# Part VI — Module Collaboration

## 49. Research Question-to-Finding Flow

```text
M04 Research Project and Protocol
        ↓
M10 Evidence Workspace and Knowledge Integration
        ↓
M06 Intervention Portfolio and Configuration
        ↓
M04 Approved Protocol Version
        ↓
M05 Screening, Eligibility and Enrolment
        ↓
M03 Consent, Relationship and Permission
        ↓
M07 Intervention Delivery
        ↓
M08 Assessment, Observation and Outcome
        ↓
M09 Safety Review
        ↓
M12 Dataset Version and Dataset Lock
        ↓
M13 Analysis, Interpretation and Research Finding
        ↓
M06 Intervention Decision
        ↓
M14 Reporting and External Submission
```

## 50. Participant Intervention Flow

```text
Participant Invitation
        ↓
Accessible Project Information
        ↓
Consent and Preferences
        ↓
Eligibility and Enrolment
        ↓
Authorised Supporter Relationship
        ↓
Intervention Assignment
        ↓
Ability-Adaptive Activity
        ↓
Optional AI-Assisted Preparation
        ↓
Human Interaction
        ↓
Reflection and Assessment
        ↓
Follow-Up
        ↓
Withdrawal or Completion
```

## 51. AI-Assisted Action Flow

```text
Human Actor and Task
        ↓
M03 Effective Permission
        ↓
M11 Approved AI Configuration and Task
        ↓
Context and Retrieval
        ↓
Validated Draft / Suggestion / Action Proposal
        ↓
Confirmation or Human Review
        ↓
Command to Owning Module
        ↓
Owning Module Enforces Invariants
        ↓
Audit and Result
```

## 52. Safety Flow

```text
Participant / Supporter / Staff / Assessment / AI / Rule
        ↓
M09 SafetySignal
        ↓
Triage
        ↓
Human-Confirmed SafetyEvent where applicable
        ↓
SafetyAction
        ↓
M07 Assignment Pause or M04 Project Review
        ↓
Resolution, Monitoring, or Closure
```

## 53. Evidence Change Flow

```text
Knowledge Platform Change
        ↓
M10 ReferenceChangeAlert
        ↓
Affected Evidence Decisions Identified
        ↓
Human Re-Review
        ↓
Potential New Evidence Decision
        ↓
Potential New Protocol / Intervention / AI Configuration Version
        ↓
Re-Consent Evaluation
```

---

# Part VII — Permission and Workspace Rules

## 54. Effective Permission

```text
Role
+ Relationship
+ Consent
+ Purpose
+ Context
+ Specific Permission
+ Resource State
```

## 55. Module Access

- A navigation item is displayed only when the actor has at least one permitted task or visible resource in the current context.
- A role may create a candidate set of actions, but effective permission determines availability.
- Family relationship does not create a Family Portal with default Shared Progress or Alerts.
- A Supporter sees only explicitly shared or assigned content.
- A Professional Caregiver sees only organisation-assigned and Participant-authorised tasks and records.
- System Administrators receive operational visibility without default Participant-content access.
- Researchers see only projects, Participants, datasets, and findings within assigned scope and approved purpose.

## 56. MVP Human Roles

- Participant
- Supporter
- Research Coordinator
- Researcher
- Research Approver
- Safety Reviewer
- Privacy Reviewer where required
- Organisation Administrator
- System Administrator

A person may hold multiple roles, but the active scope, purpose, context, and resource state remain explicit.

## 57. Workspace Composition

| Workspace | Primary Modules | Permission Principle |
|---|---|---|
| Researcher Workspace | M04, M05, M06, M08–M15 | Project assignment, purpose, artefact state, and specific permission |
| Participant Workspace | M02, M03, M05, M07, M08, M09, M11, M14 | Participant self-access plus consent and task context |
| Supporter Workspace | M03, M07, M08, M09, M11 | Active relationship plus Participant consent and specific permission |
| Safety Workspace | M09, M15 | Safety role, project assignment, purpose, and restricted resource state |
| Administration Workspace | M01, M11 configuration view, M15, M16 | Administrative scope without research or Participant authority |
| Life Story Workspace | M02, M03, M07–M11, M14, M15, M17 | Participant ownership plus item-level sharing, contribution, export, and legacy permissions |
| Community and Matching Workspace | M02, M03, M05–M11, M15, M18 | Opt-in public/community visibility, matching preferences, mutual acceptance, moderation, block and report controls |

---

# Part VIII — Evidence and Knowledge Integration Rules

1. The Healthy Aging Knowledge Platform remains independently governed.
2. The Research Platform stores Knowledge References and approved Evidence Snapshots, not uncontrolled copies of external knowledge.
3. M10 is the only canonical product boundary for external knowledge retrieval and submission preparation.
4. Every evidence-backed design decision preserves provenance, version, verification state, directness, and uncertainty.
5. Unverified, weak, conflicting, null, and harmful evidence remains visible.
6. Local caching preserves source freshness and verification state.
7. A local Research Knowledge Gap is distinct from an externally curated Knowledge Gap.
8. A Research Finding is not automatically curated Knowledge Platform evidence.
9. External changes trigger review rather than silent local mutation.
10. AI retrieves knowledge through governed M10 capabilities and cannot bypass evidence policy.

---

# Part IX — AI Companion Product Rules

## 58. One AI Companion, Multiple Contextual Modes

- Research Workflow Support
- Evidence Review Support
- Intervention Design Support
- Participant Intervention Support
- Supporter Assistance
- Professional Caregiver Task Support
- Administration and Diagnostics Support
- Life Story Capture and Organisation Support
- Community Discovery, Matching Explanation, and Moderation Triage Support

These are modes or use cases of one governed AI Companion. They are not independent assistants with separate authority.

## 59. Effective AI Permission

```text
Human Actor Permission
∩ Approved AI Configuration
∩ Approved Task
∩ Tool Permission
∩ Consent
∩ Purpose
∩ Context
∩ Data Classification
∩ Action Risk
```

## 60. AI Action Levels

| Level | Product Behaviour | Example |
|---|---|---|
| L0 — Refuse or Escalate | No generation or action beyond safe guidance | Prohibited request or serious safety concern |
| L1 — Explain or Retrieve | Read-only assistance | Explain a consent section or retrieve evidence |
| L2 — Suggest | Non-binding suggestion | Suggest conversation prompts |
| L3 — Draft | Create editable text or structure | Draft a message or Protocol section |
| L4 — Confirmed Reversible Action | Execute an allowlisted, reversible action after confirmation | Save a confirmed draft or schedule a permitted reminder |
| L5 — Human-Approved Governed Action | Prepare command requiring authorised review | Submit a Protocol Version for approval |
| Prohibited | AI cannot perform | Approve consent, confirm Safety Event, lock dataset, approve finding |

## 61. AI Output Dimensions

- Epistemic Type
- Artefact Type
- Review Status
- Approval Status
- Safety Classification

A single AI output-status field must not combine these dimensions.

## 62. Participant Response Provenance

AI may capture or transcribe an explicitly provided Participant response. It must preserve the Participant as source, AI as capture or transformation mechanism, the original input where permitted, the transformation performed, and confirmation where required. AI-generated content must not be stored as Participant-authored information.

---

# Part X — Research Reproducibility and Data Rules

## 63. Version Traceability

The modules must preserve exact references among:

```text
ResearchQuestion
→ EvidenceDecision
→ EvidenceSnapshot
→ ProtocolVersion
→ InterventionVersion
→ InterventionConfiguration
→ AIInterventionConfigurationVersion
→ Enrolment
→ InterventionAssignment
→ Assessment and Outcome Records
→ DatasetDefinition
→ DatasetVersion
→ DatasetLock
→ AnalysisPlan
→ AnalysisRun
→ InterpretationRecord
→ ResearchFinding
→ InterventionDecision
```

## 64. Data Ownership

- Operational source records remain owned by their modules.
- M12 creates governed analytical datasets without becoming the owner of source records.
- M13 analyses exact locked Dataset Versions.
- M14 reports from approved or explicitly labelled draft sources.
- A generic Research Repository is prohibited.
- Cross-module analytics use Dataset Definitions and read models.

## 65. Dataset Lock

- A Dataset Version must complete quality review before lock.
- Dataset Lock requires human approval.
- A locked Dataset Version is immutable.
- Post-lock correction creates a new Dataset Version.
- AI may assist quality review but cannot lock the dataset.

## 66. Finding and Publication Separation

- Analysis Output is not a Research Finding.
- Interpretation is human-accountable.
- Research Finding approval state is separate from scientific direction.
- External submission state is separate from Research Finding state.
- Knowledge Platform publication does not mutate the historical local finding.

---

# Part XI — MVP Module Profile

## 67. MVP Product Objective

The first MVP must prove that the platform can responsibly complete an integrated **Ability-Adaptive Social Connection, Life Story, Governed Community, and Open Matching** intervention research cycle from Research Question to Research Finding.

> A collection of disconnected features is not a valid MVP.

## 68. MVP Intervention Composition

```text
INT-009 Ability-Adaptive Onboarding
        +
INT-008 Participant-Controlled Relationship and Permission
        +
INT-001 Structured Social Connection
        +
INT-002 Interest-Based Connection and Open Matching
        +
INT-004 Life Story and Personal Archive
        +
INT-005 Optional Intergenerational Story Sharing
        +
Governed Community and Platform Public Participation Capability
        +
INT-003 Optional AI Companion Support
```

## 69. MVP Capability Matrix

| Module | MVP Depth | Status |
|---|---|---|
| M01 | Accounts, one primary Organisation, scoped roles, privileged MFA support | Required |
| M02 | Participant registration, contact, language, accessibility and communication preferences | Required |
| M03 | Versioned consent, relationship invitation, specific permission, revocation, withdrawal effects | Required |
| M04 | One Research Project, Research Questions, immutable Protocol Versions, approval | Required |
| M05 | Invitation, screening, Eligibility Decision, Enrolment, pause, withdrawal, follow-up | Required |
| M06 | Initial intervention portfolio records, exact versions, one approved MVP configuration | Required |
| M07 | Assignment, activity delivery, component states, exposure, adaptation, fidelity, reflection | Required |
| M08 | Baseline and follow-up assessments, observations, scores, Outcome Records, missingness | Required |
| M09 | Safety Signal, triage, Safety Event, escalation, assignment pause, decision trail | Required |
| M10 | Knowledge retrieval, Knowledge References, Evidence Review, Evidence Decision, Snapshot | Required |
| M11 | Controlled Researcher and Participant support, limited tools, confirmation, no autonomous agents | Required |
| M12 | Dataset Definition, generation, quality review, Dataset Version, human Dataset Lock | Required |
| M13 | Approved Analysis Plan, limited analysis, Interpretation Record, Research Finding | Required |
| M14 | Participant summary, research report, controlled export, finding package preparation | Required, limited |
| M15 | Review Requests, approvals, separation of duties, immutable audit | Required |
| M16 | Identity, Knowledge, AI, email/notification, secure export, jobs and observability integration | Required, limited |
| M17 | Life Story archive, text/voice/photo items, attribution, selective/public sharing, revision, export, and legacy preference | Required |
| M18 | PublicProfile, CommunitySpaces, SocialPosts, comments, Open Matching, MutualAcceptance, Connection, Block, Report and moderation | Required, controlled |

## 70. MVP Researcher Capabilities

- create one Research Project and Research Questions;
- perform or attach an Evidence Review and approved Evidence Decision;
- create and version a Protocol and Intervention Configuration;
- submit governed artefacts for review and approval;
- invite, screen, enrol, and monitor Participants;
- configure baseline and follow-up assessments;
- monitor intervention delivery, adaptations, fidelity, and Safety Signals;
- generate and quality-review a Dataset Version;
- lock the dataset through human approval;
- execute a limited Analysis Plan;
- record interpretation and draft a Research Finding;
- record an Intervention Decision after approval;
- configure Life Story, Governed Community, Open Matching, moderation, and Platform Public or Internet Public visibility rules;
- evaluate Life Story, matching, community participation, moderation, safety, privacy, equity, and burden outcomes.

## 71. MVP Participant Capabilities

- activate or use an assisted account pathway;
- review accessible project information;
- provide, restrict, decline, or withdraw consent;
- set communication and accessibility preferences;
- complete screening and baseline assessment;
- invite or authorise a Supporter;
- receive the structured social-connection activity;
- use optional AI-supported preparation;
- review and confirm any message or plan;
- complete or decline the human interaction;
- reflect and complete follow-up;
- create, revise, organise, export, and share Life Story content;
- create a Participant-controlled PublicProfile;
- publish or respond to community content within selected visibility;
- opt into open matching and control matching preferences;
- accept, reject, block, mute, report, or disconnect from a match;
- report a concern, request help, pause, or withdraw.

## 72. MVP Supporter Capabilities

- receive and respond to a relationship invitation;
- view current permission and access status;
- access only the assigned or shared activity;
- help with approved onboarding or accessibility tasks;
- participate in the human interaction;
- provide an authorised observation where the Protocol permits;
- report a Safety Signal;
- contribute to a Life Story item only when invited and with attribution;
- participate in public or community discussion through their own identity and permissions;
- assist with matching choices without making the Participant's decision;
- lose future access promptly after revocation or expiry.

## 73. MVP AI Scope

- evidence query and summary drafting for researchers;
- Protocol and intervention text drafting;
- plain-language explanation;
- activity explanation;
- conversation-prompt suggestions;
- message drafting with separate send confirmation;
- reflection assistance;
- ability-adaptive navigation;
- limited allowlisted tool use;
- human-review requests;
- Safety Signal escalation;
- Life Story transcription, organisation, prompt suggestions, and translation;
- matching explanation and introduction drafting;
- accessible social-content drafting and translation;
- moderation triage and report summarisation under human authority.

## 74. Prohibited MVP AI Actions

- autonomous eligibility or Enrolment;
- autonomous consent decision or withdrawal;
- autonomous relationship creation or permission expansion;
- autonomous message sending;
- autonomous Safety Event confirmation or closure;
- autonomous Dataset Lock;
- autonomous Analysis Plan approval;
- autonomous Interpretation or Research Finding approval;
- unrestricted multi-agent workflows;
- general-purpose companion behaviour outside approved tasks.

## 75. MVP Integration Scope

| Integration | Requirement |
|---|---|
| Managed identity provider | Required |
| Healthy Aging Knowledge Platform through MCP or REST | Required |
| AI provider through Model Gateway | Required |
| Email or privacy-aware notification provider | Required |
| Secure object and export storage | Required |
| Media processing and malware scanning | Required for Life Story and social media |
| Moderation, reporting, and abuse-management capability | Required |
| One pilot-specific partner integration | Optional and Research Question-driven |
| Video communication provider | Optional and separately governed |
| Wearable or sensor source | Deferred for the initial MVP |

## 76. MVP Non-Goals

- unmoderated or anonymous public posting without accountability controls;
- default Internet-public exposure;
- matching without explicit opt-in;
- hidden or unexplainable compatibility scoring;
- matching based on inferred sensitive traits without explicit approved consent;
- automatic private messaging before mutual acceptance;
- engagement optimisation designed to maximise time, reactions, or dependency;
- family or Supporter control of a Participant's Life Story;
- permanent or posthumous Life Story access without Participant instruction;
- clinical diagnosis;
- medication management;
- emergency-response service;
- full EHR integration;
- unrestricted Supporter access;
- general-purpose chatbot behaviour;
- autonomous agents;
- automatic emotion recognition;
- hidden ability or capacity scoring;
- real-time wearable streaming;
- smart-home integration;
- enterprise-scale multi-tenancy;
- federated research networks;
- advanced policy modelling;
- Digital Twin models.

---

# Part XII — Deferred and Future Capabilities

## 77. Deferred Capabilities

- multi-organisation tenancy beyond the initial controlled Organisation;
- advanced cohort randomisation and adaptive trial support;
- automated Protocol generation beyond drafting support;
- unrestricted agent orchestration;
- comparative intervention simulation;
- real-time wearable and smart-home ingestion;
- advanced digital biomarkers;
- cross-platform federation with external public social networks;
- algorithmic matching using sensitive or inferred traits;
- large-scale public creator, advertising, or influencer features;
- advanced collaborative and posthumous digital-legacy services beyond the MVP consent model;
- voice-first or television-first experiences;
- federated analytics and research networks;
- automated Knowledge Platform write-back;
- advanced policy analysis;
- Digital Twin research models.

## 78. Controlled Expansion Rule

A deferred capability may be activated only after defining:

- the Healthy Aging challenge and target population;
- the intervention or research purpose;
- evidence and theory;
- module ownership;
- new or changed bounded contexts;
- consent and permission requirements;
- safety, privacy, accessibility, and equity implications;
- AI role and limits;
- data, retention, and interoperability requirements;
- evaluation and stopping criteria;
- and required Handbook revisions.

---

# Part XIII — Module Governance and Quality

## 79. Module Definition Template

Every module specification should identify:

- module name and identifier;
- purpose;
- primary bounded context;
- owned aggregate roots;
- owned commands and state transitions;
- does-not-own boundary;
- human users and service actors;
- permission inputs;
- upstream and downstream dependencies;
- read models;
- domain events and integration events;
- data classification;
- audit obligations;
- failure and degraded modes;
- public, community, connection, and private visibility rules where applicable;
- moderation, block, mute, report, appeal, and abuse-response obligations where applicable;
- MVP depth;
- and deferred capabilities.

## 80. Module Acceptance Criteria

1. Every write operation routes to one owning module.
2. Every sensitive action uses the canonical permission formula.
3. Every approved artefact references an exact version.
4. Every cross-module workflow preserves correlation and provenance.
5. Every AI action is classified, permission-checked, and traceable.
6. Every Participant-facing workflow supports accessible error, pause, help, and withdrawal paths.
7. Every Safety Signal reaches M09 without requiring a confirmed Safety Event.
8. Every Dataset Version preserves source lineage and quality state.
9. Every Research Finding preserves Protocol, intervention, dataset, analysis, and interpretation lineage.
10. Every external integration uses an Anti-Corruption Layer.
11. No module becomes a generic Research Repository.
12. No workspace grants access solely from a role or relationship label.
13. Public or community content uses explicit visibility, moderation, reporting, and deletion rules.
14. Matching is opt-in, explainable, mutually accepted before private connection, and supports block and report.
15. Life Story content remains Participant-controlled and contribution attribution is preserved.

## 81. Module Change Review

A material module change should assess:

- bounded-context ownership;
- aggregate movement or duplication;
- permission and consent impact;
- Participant and Supporter impact;
- Protocol and intervention version impact;
- Safety Signal and Safety Event impact;
- AI context and tool impact;
- Dataset and analysis lineage;
- API and event compatibility;
- storage migration;
- UX and accessibility;
- MVP and Pilot impact;
- and the need for an Architecture Decision Record.

## 82. Anti-Patterns

- one module owning all research artefacts;
- one Intervention Engine designing, delivering, measuring, evaluating, and approving interventions;
- role names used as hard-coded data-access levels;
- Family Portal with default Participant visibility;
- AI assistants represented as independent authorities;
- Safety Event created directly by AI detection;
- Assessment module interpreting scientific effectiveness;
- Reporting module changing source findings;
- integration adapter writing directly to another module's tables;
- Knowledge Platform cache treated as local evidence authority;
- Dataset finality inferred from a filename;
- dashboard completion treated as artefact approval;
- public visibility inferred from account creation;
- ranking designed only to maximise attention or reactions;
- hidden matching based on inferred sensitive traits;
- connection activation without mutual acceptance;
- Life Story contribution treated as ownership transfer.

---

# Part XIV — Open Questions

1. Which product modules should share one application deployment in the MVP?
2. Which modules require independent schema ownership inside the modular monolith?
3. Which M03 Policy Decisions require durable records rather than audit-only traces?
4. Which Participant profile fields require additional encryption or isolation?
5. Which Supporter relationship types and permissions are required for the first Pilot?
6. Which Protocol changes automatically trigger re-consent?
7. Which intervention adaptation changes remain within the approved configuration?
8. Which assessments and scoring algorithms will be licensed and implemented?
9. Which Safety Signal types require immediate human notification?
10. Which Safety Actions may pause an assignment automatically pending review?
11. Which Knowledge Platform capabilities are currently available through MCP and REST?
12. Which external-reference changes require Protocol, intervention, or AI re-review?
13. Which AI modes and tools are approved for the Pilot?
14. Which AI interactions require mandatory human review?
15. Which AI memory types, if any, are needed for the first Pilot?
16. Which data-quality issues block Dataset Lock?
17. Which de-identification rules apply to Participant summaries and exports?
18. Which analysis methods are required by the initial Protocol?
19. Which Research Finding approval roles and separation-of-duties rules apply?
20. Which approved findings should generate an Intervention Decision?
21. Which external submissions are required during the MVP?
22. Which read models should be synchronously current and which may be eventually consistent?
23. Which module events become public Integration Events?
24. Which degraded modes must preserve Participant access, withdrawal, and safety reporting?
25. Which exact public visibility levels are enabled in the first Pilot?
26. Is Internet Public publishing enabled, or only Platform Public and Community visibility?
27. Which content types are permitted for Platform Public participation?
28. Which moderation roles, response times, appeals, and escalation rules are required?
29. Which declared attributes may be used for open matching?
30. Which geographic, language, age, setting, and availability filters are allowed?
31. Which matching explanations must be shown to Participants?
32. Which Life Story items may be published publicly or reused in community content?
33. Which Life Story permissions apply to downloading, re-sharing, and posthumous access?
34. Which public-network and matching outcomes are part of the Pilot evaluation?
35. Which deferred capabilities require new bounded contexts rather than extensions?

---

# Part XV — Design Decisions

1. The platform uses eighteen logical product modules aligned with Document 8 v3.2. M17 and M18 are approved MVP modules for Life Story and Community and Social Connection capabilities.
2. Logical modules are not mandatory microservices.
3. Each material domain record has one accountable write owner.
4. Cross-module workspaces use read models and commands rather than shared write ownership.
5. The universal Research Repository is removed.
6. Intervention Portfolio and Intervention Delivery are separate modules.
7. Assessment, Observation and Outcome are separate from Dataset and Analysis.
8. Safety and Escalation is a first-class module.
9. SafetySignal and SafetyEvent are separate records.
10. AI may raise a Safety Signal but does not confirm a Safety Event.
11. The AI Layer is replaced by one governed AI Companion module.
12. Research Assistant, Intervention Design Assistant, and similar labels are AI Modes, not separate product authorities.
13. AI Orchestration and Model Gateway are technical implementation capabilities, not product-domain owners.
14. Family Portal and generic Caregiver Portal are replaced by a permission-scoped Supporter experience.
15. Professional Caregiver access requires role, assignment, relationship or applicable basis, consent, purpose, permission, context, and Resource State.
16. System Administrator access does not create Participant, research, evidence, or safety authority.
17. The Healthy Aging Knowledge Platform remains external and authoritative.
18. The Healthy Aging Knowledge Graph is a capability inside the Knowledge Platform.
19. Evidence Workspace is a local review and decision workspace, not an evidence authority.
20. Knowledge References and Evidence Snapshots preserve external provenance.
21. Evidence Decision uses the canonical Document 2 vocabulary.
22. Research Knowledge Gap is distinct from an external curated Knowledge Gap.
23. Protocol and Protocol Version are separate.
24. Material Protocol amendment creates a new Protocol Version.
25. Intervention and Intervention Version are separate.
26. Intervention Configuration composes exact approved versions.
27. Intervention delivery records actual exposure and fidelity rather than intended delivery alone.
28. Assessment Response, Observation, Outcome Record, Analysis Output, Interpretation Record, and Research Finding remain distinct.
29. A generic Outcome Evaluation module is removed.
30. Dataset Definition, Dataset Version, Dataset Lock, Analysis Plan, Analysis Run, Interpretation Record, and Research Finding remain distinct.
31. Dataset Lock is human-authorised.
32. Research Finding approval state is separate from scientific direction.
33. Intervention Decision is owned by the Intervention Portfolio module and may use multiple approved Research Findings.
34. External submission and publication are separate from local Research Finding state.
35. Notifications are a cross-module capability with preferences, permission, business reason, and delivery ownership separated.
36. Search and discovery are filtered before disclosure.
37. Accessible adaptation may change presentation and support but not domain authority or scientific meaning.
38. The first MVP implements all eighteen module boundaries at an appropriate limited depth.
39. The first MVP is an integrated Ability-Adaptive Social Connection, Life Story, Governed Community, and Open Matching vertical slice.
40. INT-004 Life Story and Personal Archive is required in the MVP.
41. Governed Community and controlled Platform Public participation are required in the MVP through Participant-controlled Visibility and moderation.
42. Open matching is required in the MVP through opt-in discovery, explainability, mutual acceptance, block, report, and safety controls.
43. Platform Public does not mean Internet Public: default Internet Public exposure, unmoderated posting, hidden sensitive-trait matching, and automatic private connection remain prohibited.
44. Wearables, broad clinical functions, and autonomous agents remain excluded from the first MVP.
45. The module architecture must support a complete Research Question-to-Research Finding loop.

## 83. Summary

```text
Research Question
        ↓
Evidence Decision
        ↓
Protocol Version
        ↓
Intervention Configuration
        ↓
Eligibility, Consent and Enrolment
        ↓
Intervention Assignment and Delivery
        ↓
Life Story, Governed Community and Open Matching
        ↓
Assessment, Outcome and Safety
        ↓
Dataset Version and Dataset Lock
        ↓
Analysis and Interpretation
        ↓
Research Finding
        ↓
Intervention Decision
        ↓
Reporting and External Submission
```

The module architecture is successful when every capability has a clear owner, every sensitive action has a complete permission basis, every approved artefact is versioned, every AI action remains governed, and every intervention—including Life Story, Governed Community, Platform Public participation and Open Matching—can be traced from evidence and design through Participant experience, moderation, safety, and data lineage to an accountable Research Finding.
