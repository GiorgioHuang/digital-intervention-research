# Document 13 — System Context & Technical Architecture

**Version:** 1.2  
**Status:** Revised Technical Architecture Baseline — M18 Runtime and Messaging Revalidated  
**Handbook Volume:** Volume II — Technical Architecture  
**Primary System:** Digital Intervention Research Platform  
**Primary Product Modules:** M01–M18  
**Document Owner:** Technical Architecture and Engineering Governance  
**Approved By:** To be assigned  
**Last Updated:** 2026-07-29  
**Supersedes:** Document 13 — System Context & Technical Architecture v1.1  
**Review Trigger:** A material change to system boundaries, M01–M18 technical ownership, application topology, deployment units, MatchDecision, MutualAcceptance, ConnectionRequest, Connection, CommunicationBasis, ConversationThread, Message lifecycle or delivery, communication-provider adapters, data stores, Search or Vector retrieval, background processing, workflow orchestration, AI or Knowledge Platform integration, Life Story, Community, Open Matching, moderation, SafetySignal or SafetyEvent routing, Dataset and Analysis pipelines, availability targets or MVP technology strategy

---

## 1. Purpose

This document defines the **System Context & Technical Architecture** of the **Healthy Aging Digital Intervention Research Platform**.

It translates Documents 0–12 into an implementable software architecture while preserving the product, domain, evidence, research, AI, data, safety, moderation and Participant-control boundaries established in Volume I.

The document answers:

1. Which client applications, backend modules, workers, stores and external systems are required?
2. How do Product Modules M01–M18 map to technical modules and runtime responsibilities?
3. Which responsibilities remain inside the Research Platform and which remain external?
4. How do synchronous APIs, domain commands, events, jobs, files, search, AI and analytical workflows interact?
5. Which controls must remain deterministic and strongly consistent?
6. How should the expanded MVP be deployed?
7. How can the platform evolve without premature distributed-system complexity?

The architecture supports this complete lifecycle:

```text
Healthy Aging Challenge
        ↓
Research Question
        ↓
Evidence Review, Evidence Decision and Evidence Snapshot
        ↓
Protocol Version, Intervention Version and Configuration
        ↓
Eligibility, Consent and Enrolment
        ↓
Intervention Assignment and Actual Exposure
        ↓
Life Story, Community, Open Matching and Human Connection
        ↓
Assessment, Observation, Safety and Moderation
        ↓
Dataset Definition, Dataset Version and Dataset Lock
        ↓
Analysis Plan, Analysis Run and Interpretation Record
        ↓
Research Finding and Intervention Decision
        ↓
Report, Evidence Package and External Submission
```

The technical architecture must preserve:

- consent, purpose, Specific Permission and Resource State;
- relationship, Connection, Mutual Acceptance and Block boundaries;
- Participant-controlled authorship, visibility, sharing and withdrawal;
- domain ownership and typed state transitions;
- evidence provenance and historical snapshots;
- safety and moderation separation;
- AI context minimisation, tool control and human accountability;
- data lineage and research reproducibility;
- accessibility and ability-adaptive presentation;
- operational resilience and safe degradation;
- and the distinction between activity, process measures and Healthy Aging outcomes.

> The architecture must make unsafe or unauthorised transitions difficult to express, not merely difficult to discover in testing.

## 2. Scope

This document covers:

- system context and trust boundaries;
- human actors and external systems;
- client applications and permission-scoped workspaces;
- API edge and Backend-for-Frontend responsibilities;
- modular-monolith backend architecture;
- M01–M18 technical-module mapping;
- module contracts, command and query architecture;
- long-running workflows and process managers;
- synchronous APIs, asynchronous events and durable jobs;
- AI Orchestration, Model Gateway, tool execution and memory placement;
- Knowledge Platform integration;
- Life Story and media processing;
- Community, public-social, matching, Connection and messaging architecture;
- block, report, moderation, privacy and safety routing;
- transactional, object, search, vector and analytical storage;
- Dataset Definition, Dataset Version, Dataset Lock and Analysis pipelines;
- identity, authorisation, consent and purpose enforcement placement;
- notification and research-collaboration architecture;
- deployment topology and runtime environments;
- configuration, secrets, observability and audit;
- reliability, availability, performance, scalability and recovery;
- security-boundary overview;
- test, release and Architecture Decision Record strategy;
- expanded MVP technical scope;
- deferred capabilities, evolution path and architecture risks.

This document does not define:

- final authentication ceremonies;
- detailed privacy, consent or cryptographic controls;
- final API or event schemas;
- physical database and index schemas;
- final model-provider configuration;
- final cloud-vendor products;
- final infrastructure-as-code;
- detailed security operations;
- final statistical methods;
- or detailed UX flows.

Those responsibilities are refined by Documents 14–20 and implementation specifications.

## 3. Relationship to Other Documents

### Depends on

- Document 0 — Platform Ecosystem Architecture v1.2
- Document 1 — Project Definition & Vision v2.1
- Document 2 — Conceptual & Evidence Framework v2.1
- Document 3 — Intervention Map v2.3
- Document 4 — User Roles & Permission Model v3.0
- Document 5 — Ability-Adaptive UX Principles v2.1
- Document 6 — Core Product Modules v3.1
- Document 7 — Information Architecture v3.0
- Document 8 — Core Domain Model & Ubiquitous Language v3.2
- Document 9 — Evidence & Knowledge Integration Architecture v1.1
- Document 10 — AI Companion Architecture v1.1
- Document 11 — Research & Evaluation Framework v1.1
- Document 12 — Data & Interoperability Architecture v1.2
- Document 15 — API, Event & Integration Specifications v1.2
- Documents 0–20 Handbook Consistency Review v1.0

### Provides input to

- Document 14 — Security, Privacy & Consent Architecture revision
- Document 15 — API, Event & Integration Specifications revision
- Document 16 — Database & Storage Design revision
- Document 17 — AI Orchestration & Model Operations revision
- Document 18 — MVP Scope & Delivery Roadmap revision
- Document 19 — Initial Pilot Research Protocol revision
- Document 20 — UX Flows & Design System Specification revision
- Infrastructure Specifications
- Deployment and Recovery Runbooks
- Service-Level Objectives
- Engineering and Coding Standards
- Test Strategy
- Release Strategy
- Architecture Decision Records

### Authority Hierarchy

| Subject | Authority |
|---|---|
| Ecosystem and system ownership | Document 0 |
| Actors and effective permission | Document 4 |
| Product modules and MVP capability scope | Document 6 |
| Workspaces and information architecture | Document 7 |
| Aggregate ownership, state and ubiquitous language | Document 8 |
| Evidence integration | Document 9 |
| AI responsibilities and tool boundaries | Document 10 |
| Research, Dataset and Analysis lifecycle | Document 11 |
| Data authority, classification, visibility and interoperability | Document 12 |
| Technical components, topology and runtime interactions | Document 13 v1.2 |

### 3.1 v1.2 Revalidation Result

Version 1.2 revalidates the runtime architecture against:

- Document 8 v3.2 for M18 aggregate ownership and state;
- Document 12 v1.2 for data meaning and lineage; and
- Document 15 v1.2 for API, event, provider and AI Tool contracts.

The canonical runtime path is:

```text
M18 MatchDecision Pair
        ↓
M18 MutualAcceptance
        ↓
M18 Connection
        ↓
M18 CommunicationBasis Evaluation
        ↓
M18 ConversationThread
        ↓
M18 Message Draft and SendConfirmation
        ↓
M18 MessageQueued
        ↓
M16 Communication Adapter
        ↓
External Provider
        ↓
Authenticated Idempotent Callback
        ↓
M16 Translation and Reconciliation
        ↓
M18 Delivery-State Command
```

`ConnectionRequest` is present only as a deferred, feature-disabled code path for the first Pilot.

---

## 4. Technical Architecture Objectives

### 4.1 Research Workflow Integrity

The implementation preserves exact lineage among:

- ResearchProject and ResearchQuestion;
- EvidenceReview, EvidenceDecision and EvidenceSnapshot;
- ProtocolVersion;
- InterventionVersion and InterventionConfiguration;
- AIInterventionConfigurationVersion;
- Enrolment and InterventionAssignment;
- actual Exposure, Adaptation and Fidelity;
- AssessmentRecord, Observation, OutcomeRecord, SafetySignal and SafetyEvent;
- DatasetDefinition, DatasetVersion and DatasetLock;
- AnalysisPlan, AnalysisRun and AnalysisOutput;
- InterpretationRecord;
- ResearchFinding;
- InterventionDecision;
- and external reporting artefacts.

### 4.2 Safe Intervention and Social Capability Delivery

Automation must not bypass:

- eligibility;
- consent and withdrawal;
- Relationship and Specific Permission;
- Resource State;
- visibility and publication controls;
- Open Matching opt-in;
- Match Candidate eligibility and Mutual Acceptance;
- Block Records;
- Community Rules;
- moderation and appeal;
- Protocol safeguards;
- stopping rules;
- or required human escalation.

### 4.3 Participant Control

The architecture supports understandable, reversible controls for:

- consent;
- Life Story authorship and sharing;
- Community and public visibility;
- matching and Connection;
- messaging;
- AI memory;
- mute, disconnect, block and report;
- research use;
- export;
- withdrawal;
- and deletion.

### 4.4 Modular Evolution

M01–M18 are explicit technical modules with stable contracts and one accountable write owner per aggregate.

A module may later be extracted when evidence justifies independent deployment.

### 4.5 Low Initial Operational Complexity

The MVP minimises:

- distributed transactions;
- network-dependent domain rules;
- cross-service debugging;
- duplicated infrastructure;
- independent deployment coordination;
- and specialist operations burden.

### 4.6 Deterministic Critical Controls

The following are evaluated by deterministic platform logic, not by an LLM:

- authentication and session context;
- consent and effective permission;
- Resource State;
- visibility;
- eligibility;
- Block enforcement;
- Mutual Acceptance;
- message communication basis;
- Dataset Lock readiness;
- approval requirements;
- moderation authority;
- and Safety Signal or Safety Event transition authority.

### 4.7 Traceability

A material action is traceable across:

```text
Client Interaction
        ↓
API or Command Request
        ↓
Permission and Purpose Decision
        ↓
Application Use Case
        ↓
Domain Aggregate and State Transition
        ↓
Persistence and Outbox
        ↓
Event, Job or External Adapter
        ↓
Human Review or Confirmed Result
        ↓
Audit and Research Lineage
```

### 4.8 Replaceable External Dependencies

AI providers, Knowledge Platform capabilities, identity providers, communication providers, file processors, analytical environments and devices are accessed through controlled adapters.

### 4.9 Accessible Multi-Channel Experience

The architecture supports responsive web and progressive enhancement for:

- desktop;
- tablet;
- mobile;
- keyboard and screen reader;
- read-aloud and voice input;
- simplified and low-stimulation modes;
- Supporter-assisted use;
- and future native or device-specific clients.

### 4.10 Evidence, Operational and Analytical Separation

The architecture preserves distinctions between:

- authoritative external knowledge;
- operational source records;
- Participant-controlled content;
- public or Community visibility;
- observations and measurements;
- AI-generated and AI-derived data;
- governed Dataset Versions;
- Analysis Outputs;
- human-approved Interpretation Records;
- and Research Findings.

### 4.11 Secure and Private by Construction

Access control, purpose limitation, field and existence protection, data classification, audit, secret isolation and deletion propagation are architectural capabilities.

### 4.12 Reproducible Research

Approved configurations and milestones are versioned and reconstructable.

Locked Dataset Versions, approved Analysis Plans, Analysis Runs, Interpretation Records and Research Findings remain traceable and immutable according to their domain rules.

## 5. Architecture Principles

### 5.1 Modular Monolith First

The MVP uses a modular monolith as the primary backend architecture:

- one principal backend deployment unit;
- explicit M01–M18 modules;
- module-owned application and domain services;
- module-owned repositories and migrations;
- controlled cross-module interfaces;
- internal domain events;
- a shared runtime and transactional database where appropriate;
- and no unrestricted cross-module table access.

A modular monolith is not an unstructured monolith.

### 5.2 One Aggregate Write Owner

Only the owning module changes an aggregate.

Other modules use commands, queries, references, projections or events.

### 5.3 API-First at Client and External Boundaries

Clients and external systems communicate through versioned APIs, events or files.

Internal method calls may be used inside the modular monolith when they preserve module contracts.

### 5.4 Domain-Oriented Modules

Technical boundaries follow Product Modules and bounded contexts rather than controllers, database tables or framework packages.

### 5.5 Permission Before Data Assembly

Permission, consent, purpose, visibility, Block and Resource State filters execute before:

- query projection;
- search result assembly;
- AI context;
- tool invocation;
- export;
- event-detail retrieval;
- and dataset inclusion.

### 5.6 Background Work Is Explicit

Long-running, scheduled, retryable or integration-heavy work uses durable jobs or persisted workflows.

### 5.7 Events Communicate Completed Facts

Events represent material state changes and use minimum-necessary payloads.

They do not represent arbitrary method calls or grant continuing access.

### 5.8 External Systems Are Untrusted Boundaries

External data are authenticated, validated, normalised, source-attributed, classified and audited.

### 5.9 AI Is a Controlled Subsystem

All model access passes through M11 and the Model Gateway.

AI cannot directly mutate another aggregate, approve governed artefacts, create a Connection, publish content, impose high-impact moderation or confirm a SafetyEvent.

### 5.10 Knowledge Access Uses M10

Research, intervention and AI modules retrieve external authoritative knowledge only through M10.

### 5.11 Storage Supports Domain Responsibilities

Relational, object, search, vector, cache, audit and analytical storage serve different purposes.

Storage technology never changes aggregate authority.

### 5.12 Public Does Not Mean Unrestricted

Community, Platform Public and Internet Public are explicit technical scopes.

Public visibility does not bypass classification, consent, research-use, third-party-rights or export controls.

### 5.13 Safety and Moderation Remain Separate

ModerationCase, SafetySignal, SafetyEvent, Privacy Incident, AIIncident and Technical Incident use separate records and workflows.

### 5.14 Strong Consistency for Critical Transitions

Critical transitions remain inside a strongly consistent domain transaction where feasible, including:

- consent withdrawal;
- block creation;
- Match Decision and Mutual Acceptance;
- Connection activation;
- message-basis validation;
- Protocol activation;
- Dataset Lock;
- approval decisions;
- and Safety Signal disposition.

### 5.15 Eventual Consistency for Projections

Search indexes, dashboards, notifications, analytical projections and external consumers may be eventually consistent when the authoritative state remains protected.

### 5.16 Safe Degradation

A failed supporting capability does not fabricate success or remove critical controls.

### 5.17 Evolution Through Measured Need

Microservices, event streaming, multi-region deployment, dedicated search or vector clusters and advanced workflow engines are introduced only when justified by measured scale, isolation, resilience, team or regulatory needs.

## 6. System Context

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Human Actors                                                         │
│                                                                      │
│ Participants • Supporters • Informal and Professional Caregivers     │
│ Researchers • Coordinators • Evidence, Safety and Privacy Reviewers  │
│ Moderators • Research Approvers • Organisation and System Admins     │
└──────────────────────────────────┬───────────────────────────────────┘
                                   │
                                   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ Digital Intervention Research Platform                               │
│                                                                      │
│ M01–M16 Research, Evidence, AI, Data, Governance and Operations       │
│ M17 Life Story and Personal Archive                                  │
│ M18 Community, Social Connection, Open Matching and Moderation           │
└───────┬──────────────┬──────────────┬──────────────┬─────────────────┘
        │              │              │              │
        ▼              ▼              ▼              ▼
 Healthy Aging    Identity and   AI Model and   Communication,
 Knowledge        Directory      Media Providers Notification and
 Platform         Providers                      Approved Moderation
                                                   Providers
        │              │              │              │
        └──────────────┴──────────────┴──────────────┘
                                   │
                                   ▼
                       External Research, Care,
                       Device and Analytics Systems
```

### 6.1 Research Platform Boundary

The Research Platform owns its operational, content, research, AI, governance, dataset, analysis, reporting and audit records.

### 6.2 Knowledge Platform Boundary

The Healthy Aging Knowledge Platform remains authoritative for curated evidence, theory, mechanisms, Outcome Definitions, Measurement Definitions, ontology, provenance and Knowledge Publication.

### 6.3 External Source Boundary

External care, device, communication, identity and analytical systems remain authoritative for their source records or delivery state.

### 6.4 Trust Boundary Rule

Every boundary defines:

- identity;
- authentication;
- authorisation;
- purpose;
- encryption;
- data classification;
- schema and version;
- validation;
- retention;
- logging;
- timeout and retry;
- and degraded behaviour.

## 7. Human Actors

### 7.1 Participant

Uses the platform to manage participation, consent, intervention activities, assessments, Life Story, Community, Open Matching, Connections, messages, AI assistance, sharing, block, report, export and withdrawal.

### 7.2 Supporter

Uses explicitly authorised capabilities for shared activities, Life Story contributions, observations and communication.

Relationship status alone does not create access.

### 7.3 Informal Caregiver

May provide permitted assistance, observation or intervention support without acquiring clinical or substitute authority.

### 7.4 Professional Caregiver or Staff Member

May support assigned delivery, observations and Safety Signal reporting within organisation, Protocol and permission scope.

### 7.5 Researcher

Creates and manages Research Projects, questions, evidence, Protocol Versions, intervention configurations, datasets, analyses, interpretations, findings and reports within assigned authority.

### 7.6 Research Coordinator

Coordinates invitations, screening, consent, Enrolment, scheduling, assignments, operational follow-up and data-quality tasks.

### 7.7 Evidence Reviewer

Reviews Evidence Reviews, Knowledge References, applicability, Evidence Decisions, snapshots and Reference Change Alerts.

### 7.8 Safety Reviewer

Triages Safety Signals, confirms Safety Events where authorised, records actions and applies stopping-rule workflows.

### 7.9 Moderator

Reviews reports, Community Rules, content and interaction evidence, records Moderation Decisions and handles appeals within assigned scope.

### 7.10 Privacy Reviewer

Reviews sensitive data use, public visibility, export, retention, deletion and external sharing.

### 7.11 Research Approver

Approves governed Research Project, Protocol, Analysis Plan, Interpretation, Research Finding and external-submission steps as assigned.

### 7.12 Organisation Administrator

Manages organisation membership, scoped roles and approved configuration without default access to Participant content.

### 7.13 System Administrator

Manages runtime configuration, technical integrations and operational support.

System administration does not grant Participant-content, research, safety or moderation authority.

### 7.14 Knowledge Curator

Acts through the external Knowledge Platform and governed submission workflow rather than as an unrestricted Research Platform administrator.

## 8. External Systems

### 8.1 Healthy Aging Knowledge Platform

Provides governed evidence, ontology, theories, mechanisms, outcomes, measurements, provenance, search and external curation capabilities.

### 8.2 Identity and Directory Provider

Provides authentication, federation, multifactor authentication, recovery and directory functions where approved.

### 8.3 Communication Providers

May provide email, SMS, push, voice, video or delivery-state services.

A provider delivery event is not a Message-domain decision.

### 8.4 AI Model Providers

Provide model inference behind the Model Gateway.

Provider data retention, training, jurisdiction and subcontracting are explicit configuration and governance concerns.

### 8.5 Media Processing and Content Delivery Providers

May provide object storage, malware scanning, media transformation, transcription, translation or authorised content delivery.

### 8.6 Moderation or Abuse-Detection Providers

May provide provisional signals or content classification.

They do not own Moderation Decisions, Safety Events or Participant authority.

### 8.7 Research and Analytics Tools

May include statistical environments, notebook systems, qualitative-analysis tools, repositories and registries.

### 8.8 External Care and Service Systems

May provide authorised source data or receive approved reports.

Clinical exchange does not make the Research Platform an EHR.

### 8.9 Device and Wearable Platforms

May provide activity, sleep, mobility, environmental or device-status measurements.

### 8.10 Monitoring and Support Systems

Provide logs, metrics, traces, alerting, incident management and support-ticket integration.

## 9. Application Landscape

```text
Participant Responsive Web / PWA
Researcher and Coordinator Web Application
Supporter and Professional Caregiver Workspace
Safety, Privacy and Moderation Console
Organisation and System Administration Console
        │
        ▼
Managed Edge, Web Application Firewall and API Edge
        │
        ▼
Permission-Aware Backend-for-Frontend or API Composition
        │
        ▼
Digital Intervention Research Platform Backend
        │
        ├── M01–M18 Modular Domain Modules
        ├── Application Workflow and Policy Components
        ├── Outbox and Internal Event Bus
        └── Controlled External Adapters
        │
        ├── Relational Transactional Store
        ├── Object and Media Storage
        ├── Durable Queue and Scheduler
        ├── Cache
        ├── Search and Optional Vector Index
        ├── Audit and Observability
        └── Governed Analytical Store or Research Environment
        │
        ▼
Background Workers and Scheduled Jobs
        │
        ▼
Knowledge, AI, Identity, Communication, Media,
Moderation, Device, Care and Analytics Providers
```

The MVP may deliver several workspaces through one web application and one backend deployment while preserving logical and permission boundaries.

## 10. Client Applications

### 10.1 Participant Experience

Supports:

- Today and intervention activities;
- consent and sharing;
- assessments;
- Life Story capture and review;
- Community and Public Profile;
- Open Matching and Connections;
- messages;
- AI Companion;
- block, report and help;
- export and withdrawal.

It prioritises accessibility, low cognitive burden, clear source and state, safe recovery and Participant control.

### 10.2 Researcher and Coordinator Application

Supports Research Project, evidence, Protocol, intervention, recruitment, delivery, assessment, safety summary, datasets, analyses, interpretations, findings, reports and governance.

### 10.3 Supporter and Professional Caregiver Workspace

Exposes only current relationship-, assignment-, consent-, purpose- and resource-scoped capabilities.

### 10.4 Safety, Privacy and Moderation Console

Separates:

- Safety Signal triage and Safety Event review;
- Privacy Review;
- User and Content Reports;
- Moderation Cases, actions, appeals and restoration;
- and technical or AI incidents.

### 10.5 Administration Console

Separates organisation administration, system operations, integration configuration, AI configuration, Community configuration, audit and system health.

### 10.6 Mobile Strategy

The MVP may use responsive web or PWA delivery.

Native clients are considered when required for reliable push, offline support, media capture, device integration, secure local storage or specialised accessibility.

### 10.7 Shared Design System

All clients use a shared design system for semantic components, accessibility, adaptation, state presentation, confirmation, errors and safe degradation.

### 10.8 Client Is Not the Authority

Client visibility improves usability but never replaces server-side permission, consent, Block, Mutual Acceptance, domain-state or approval enforcement.

## 11. API Edge and Backend-for-Frontend

### 11.1 Responsibilities

The API Edge may provide:

- TLS termination and web-application protection;
- authentication-token validation;
- request-size and rate controls;
- correlation identifiers;
- API-version routing;
- schema validation;
- response compression;
- and coarse abuse controls.

### 11.2 Backend-for-Frontend

A Backend-for-Frontend or composition layer may create permission-scoped read models for different workspaces.

It may aggregate already authorised data but must not become a second domain model.

### 11.3 Existence and Field Protection

The edge and composition layer must support:

- omitted unauthorised fields;
- protected resource existence;
- safe counts and badges;
- blocked-actor behaviour;
- shared-device preview restrictions;
- and consistent errors.

### 11.4 No Business Authority at the Edge

The edge does not own:

- eligibility;
- consent;
- visibility;
- matching;
- Connection activation;
- message basis;
- moderation;
- Safety Event confirmation;
- Dataset Lock;
- or research approval.

### 11.5 No AI at the Edge

The edge does not invoke model providers or construct sensitive AI context.

## 12. Primary Backend Architecture

### 12.1 Modular Monolith

The primary backend is a modular monolith with:

- one principal runtime deployment;
- explicit M01–M18 module packages;
- module-owned application services, domain models, repositories and migrations;
- typed internal interfaces;
- internal domain events;
- shared technical infrastructure;
- and no direct client or model-provider access to persistence.

### 12.2 Conceptual Layers

```text
Interface Layer
        ↓
Application Layer
        ↓
Domain Layer
        ↓
Infrastructure Adapters
```

### 12.3 Interface Layer

Handles APIs, commands, queries, events, jobs and external messages.

### 12.4 Application Layer

Coordinates use cases, transactions, permission evaluation, workflow and calls to owning modules.

### 12.5 Domain Layer

Owns aggregates, entities, value objects, invariants, policies and domain events.

### 12.6 Infrastructure Adapters

Implement persistence, queues, files, indexes, model providers, Knowledge Platform interfaces, communication providers, devices and observability.

### 12.7 Dependency Direction

Domain modules do not depend on:

- web frameworks;
- database record classes;
- provider SDKs;
- external schemas;
- search-index documents;
- or AI prompts.

### 12.8 Shared Technical Kernel

A small technical kernel may provide:

- authenticated request context;
- identifiers and time;
- transaction and outbox support;
- structured errors;
- schema and event primitives;
- observability;
- and cryptographic or storage abstractions.

It must not contain shared mutable domain objects or one generic status model.

### 12.9 Deterministic Policy Components

Consent, permission, visibility, Block, matching eligibility, Mutual Acceptance and approval checks use deterministic policy components called by application services and domain policies.

## 13. Technical Module Map

| Module | Technical Module | Principal Aggregate Ownership |
|---|---|---|
| M01 | Identity and Organisation | UserAccount, Organisation, OrganisationMembership, RoleAssignment, ServiceAccount |
| M02 | Participant Profile and Preferences | ParticipantProfile, AccessibilityProfile, ParticipantPreference |
| M03 | Relationship, Consent and Permission | Relationship, Delegation, Consent, PolicyDecision |
| M04 | Research Project and Protocol | ResearchProject, ResearchQuestion, Protocol, ProtocolVersion |
| M05 | Recruitment, Screening and Enrolment | ScreeningRecord, EligibilityDecision, Enrolment |
| M06 | Intervention Portfolio and Configuration | Intervention, InterventionVersion, InterventionConfiguration, InterventionDecision |
| M07 | Intervention Delivery | InterventionAssignment, InterventionSession, ExposureRecord, FidelityRecord |
| M08 | Assessment, Observation and Outcome | AssessmentSchedule, AssessmentRecord, Observation, OutcomeRecord |
| M09 | Safety and Escalation | SafetySignal, SafetyEvent, SafetyAction |
| M10 | Evidence and Knowledge Integration | KnowledgeReference, EvidenceReview, EvidenceDecision, EvidenceSnapshot, ResearchKnowledgeGap, ReferenceChangeAlert |
| M11 | AI Companion | AIConversation, AIInteraction, AIInterventionConfiguration, AIInterventionConfigurationVersion, AIMemoryItem |
| M12 | Dataset and Data Quality | DatasetDefinition, DatasetVersion, DataQualityIssue, TransformationRun; DatasetLock as entity |
| M13 | Analysis, Interpretation and Findings | AnalysisPlan, AnalysisRun, InterpretationRecord, ResearchFinding |
| M14 | Reporting and External Submission | Report, ReportVersion, ExportRequest, EvidencePackage, ExternalSubmission |
| M15 | Governance and Audit | ApprovalRecord, GovernanceReview, ConflictOfInterestRecord, AuditEvent |
| M16 | Integration and Operations | IntegrationRecord, ExternalSystemReference, IdentifierMapping, provider adapters, callback evidence, delivery reconciliation and operational exchange state |
| M17 | Life Story and Personal Archive | LifeStoryArchive, LifeStoryItem, LifeStoryContribution, LifeStoryExport, LegacyPreference |
| M18 | Community, Social Connection and Messaging | PublicProfile, CommunitySpace, CommunityMembership, SocialPost, MatchPreference, MatchCandidate, MutualAcceptance, Connection, ConversationThread, Message, BlockRecord, ModerationCase; ConnectionRequest deferred |

### 13.1 Physical Packaging

The MVP may group modules into fewer code assemblies, but ownership and contracts remain explicit.

M18 may use internal packages for Community, Matching, Connection Formation, Conversation, Messaging, Block and Report, and Moderation.

Physical packaging does not merge aggregate ownership.

### 13.2 Cross-Context Entities

MatchExplanation, MatchDecision, MessageDeliveryAttempt, MessageAttachment, ModerationDecision, SafetyAction, DatasetLock and AnalysisOutput remain owned by their aggregate's module.

CommunicationBasis is evaluated by M18 from authoritative references owned by M18, M03 or M07.

It is not a new cross-module write owner.

### 13.3 M16 Communication Infrastructure

M16 owns provider-adapter configuration, provider credential references, callback authentication, replay protection, provider-reference mapping, restricted callback evidence, retry and reconciliation jobs, and operational delivery metrics.

M16 does not own Message content, sender authority, recipient membership, CommunicationBasis, ConversationThread, SendConfirmation or canonical delivery state.

### 13.4 Notifications

Notification preference and business trigger belong to the relevant domain context.

Channel delivery and provider state may use M16 infrastructure.

Notification remains distinct from M18 Message.

### 13.5 Research Collaboration

Review comments, tasks and requests attach to governed research artefacts and are not implemented as Participant Community or Message data.

---

## 14. Module Boundary Rules

### 14.1 Module-Owned Writes

Only the owning module writes its aggregates and tables.

### 14.2 Public Module Interfaces

A module exposes explicit:

- commands;
- queries;
- domain policies;
- reference resolvers;
- event contracts;
- and purpose-specific read models.

### 14.3 Cross-Module Reads

Cross-module reads use module queries, projections or replicated read models.

Direct table access is prohibited outside the owning repository except for approved analytical extraction through M12.

### 14.4 No Shared Mutable Domain Objects

Modules exchange identifiers, immutable values and contracts rather than mutable entity instances.

### 14.5 Transaction Boundaries

A transaction normally covers one aggregate or one owning module.

Strongly consistent multi-aggregate changes inside a module are permitted where a documented invariant requires them.

### 14.6 Cross-Module Workflow

Cross-module workflow uses application services, process managers or persisted sagas.

A process manager does not acquire ownership of the participating aggregates.

### 14.7 Domain and Integration Events

Domain events remain internal.

Integration events are deliberately selected, versioned and minimised.

### 14.8 Shared Physical Database

A shared database may be used in the MVP with:

- module schemas or ownership prefixes;
- separate repositories;
- migration ownership;
- database roles where practical;
- code checks preventing cross-module writes;
- and architecture tests.

### 14.9 Projection Freshness

A projection exposes its source version and freshness when staleness affects meaning or action.

### 14.10 No Permission by Projection

A cached or projected record never grants access beyond the current authoritative permission result.

## 15. Command and Query Architecture

### 15.1 Commands

Commands request explicit state transitions.

Representative commands include:

- CreateResearchProject;
- ApproveProtocolVersion;
- RecordEligibilityDecision;
- EnrolParticipant;
- WithdrawConsent;
- AssignIntervention;
- RecordExposure;
- ConfirmLifeStoryItem;
- ChangeLifeStoryVisibility;
- PublishSocialPost;
- RecordMatchDecision;
- ActivateConnectionAfterMutualAcceptance;
- SendMessage;
- BlockActor;
- SubmitUserReport;
- RecordModerationDecision;
- RecordSafetySignal;
- ConfirmSafetyEvent;
- ApproveEvidenceDecision;
- LockDatasetVersion;
- ApproveAnalysisPlan;
- ApproveInterpretation;
- ApproveResearchFinding;
- GenerateExport.

### 15.2 Command Contract

A command identifies:

- actor or ServiceAccount;
- role and Organisation;
- Research Project and Participant context;
- purpose;
- specific resource and expected version;
- Specific Permission;
- idempotency key where applicable;
- confirmation or ApprovalRecord;
- and correlation and trace identifiers.

### 15.3 Queries

Queries retrieve permission-scoped information without changing domain state.

### 15.4 Validation Layers

Validation occurs at:

- transport and schema;
- authentication;
- permission and purpose;
- application precondition;
- domain invariant;
- persistence and concurrency;
- external integration;
- and postcondition or delivery confirmation.

### 15.5 Authorisation Inputs

```text
Role
+ Relationship
+ Consent
+ Purpose
+ Context
+ Specific Permission
+ Resource State
```

Additional deterministic inputs include visibility, Block state, Mutual Acceptance, Data Classification and action risk.

### 15.6 Optimistic Concurrency

Versioned aggregates and approvals use expected-version checks.

### 15.7 Idempotency

Retryable commands use stable idempotency keys where duplicate execution could create multiple invitations, posts, messages, Connections, reports, exports or safety actions.

### 15.8 Explicit Result

Command results distinguish:

- accepted;
- completed;
- queued;
- confirmation required;
- review required;
- denied;
- conflicted;
- failed;
- and partially completed.

Generated text alone never proves execution.

## 16. Workflow and Process Management

### 16.1 Long-Running Workflows

Representative persisted workflows include:

- Research Project and Protocol approval;
- evidence review and Reference Change re-review;
- invitation, screening, consent and Enrolment;
- intervention assignment and pause;
- Life Story contribution and Participant confirmation;
- Life Story sharing, export and withdrawal;
- Community publication and moderation review;
- Open Matching, Mutual Acceptance and Connection activation;
- message delivery and failure;
- block and deletion propagation;
- report, Moderation Case, appeal and restoration;
- Safety Signal triage and Safety Event review;
- re-consent;
- Dataset generation, quality review and lock;
- Analysis Plan approval and Analysis Run;
- Interpretation and Research Finding approval;
- export and external submission.

### 16.2 Process Manager

A process manager may:

- persist workflow state;
- issue commands to owning modules;
- react to versioned events;
- wait for human tasks;
- schedule deadlines and reminders;
- compensate reversible steps;
- and expose current status.

### 16.3 Human Tasks

Human review remains explicit, assigned, timed and auditable.

No approval occurs through silence, timeout or AI confidence.

### 16.4 Workflow Durability

Long-running state is persisted and recoverable after restart.

### 16.5 Critical Consistency

Consent withdrawal, block creation, Mutual Acceptance, Connection activation, Dataset Lock and Safety Signal disposition must not rely only on eventually consistent projections.

### 16.6 No Hidden AI Workflow Authority

AI may draft, explain, propose and route.

It cannot advance a governed workflow without the required command, confirmation, reviewer or approval.

## 17. Synchronous Communication

### 17.1 Appropriate Uses

Synchronous APIs are appropriate for:

- interactive commands and queries;
- current permission, Consent, Visibility, Block and ResourceState checks;
- MatchDecision ownership;
- MutualAcceptance validation and Connection activation;
- CommunicationBasis evaluation;
- ConversationThread creation;
- Message Draft revision and SendConfirmation;
- current record retrieval;
- deterministic domain validation;
- and low-latency external capability calls.

### 17.2 Protocols

The MVP primarily uses HTTPS JSON APIs at client boundaries and governed MCP or provider APIs at external boundaries.

### 17.3 Strong-Consistency M18 Checks

The command path re-evaluates authoritative state for matching opt-in, MatchCandidate expiry, MatchDecision ownership, MutualAcceptance validity and usage, Block, Connection state, CommunicationBasis, Thread participants, Message version, recipients, attachment readiness and SendConfirmation.

Eventually consistent projections cannot establish these facts.

### 17.4 Timeouts and Cancellation

Every external call has an explicit timeout and cancellation behaviour.

A provider timeout does not change canonical Message delivery state to Delivered.

### 17.5 Retries

Only safe and idempotent operations are retried synchronously.

Message SendConfirmation, provider submission and callback processing use distinct idempotency scopes.

### 17.6 Correlation

Requests carry correlation and trace identifiers and preserve causation where a command initiates later jobs or events.

### 17.7 Failure Disclosure

Failure never presents a SocialPost, MatchDecision, MutualAcceptance, Connection, ConversationThread, Message, Report, Block, export, DatasetLock or external submission as completed without owning-module confirmation.

---

## 18. Asynchronous Communication

### 18.1 Appropriate Uses

Asynchronous processing supports:

- Notifications and provider delivery;
- Message delivery attempts and reconciliation;
- media scan and conversion;
- transcription and translation;
- Search and Vector indexing;
- evidence refresh;
- MatchCandidate generation after deterministic eligibility filtering;
- safe MutualAcceptance re-evaluation after relevant state changes;
- feed and recommendation projections;
- moderation queue enrichment;
- external imports;
- deletion propagation;
- Dataset generation and quality checks;
- export packaging;
- report generation;
- device import;
- AI evaluation;
- and long-running research workflows.

### 18.2 Internal Event Bus

The MVP may use an in-process event dispatcher with transactional outbox persistence or a queue-backed bus.

### 18.3 Durable Queue

A durable queue supports retries, delayed jobs, priorities, dead-letter handling and worker scaling.

Separate workload classes protect Consent and Block propagation, Safety and moderation, Message delivery, matching, AI, media and analytical work.

### 18.4 Eventual Consistency Boundaries

Eventually consistent projections may not be the sole authority for:

- Consent;
- Block;
- MatchDecision;
- MutualAcceptance;
- Connection activation;
- CommunicationBasis;
- ConversationThread usability;
- Message SendConfirmation;
- current Visibility;
- SafetySignal disposition;
- DatasetLock;
- or approval.

### 18.5 Message Delivery Worker

The worker:

1. loads the canonical Message and DeliveryAttempt;
2. revalidates current send authority where required;
3. checks Block and cancellation;
4. invokes the M16 provider adapter;
5. stores provider reference and operational result;
6. invokes an M18 state command through the application boundary;
7. schedules reconciliation where needed;
8. and emits canonical events through the outbox.

It never edits M18 tables directly.

### 18.6 Callback Processing

Provider callbacks terminate at an M16 ingress component that authenticates signature and key, checks timestamp and replay, maps provider reference, deduplicates, validates allowed status, stores restricted evidence, translates state and calls an M18 delivery command.

### 18.7 Audit and Initiator

Asynchronous work retains initiating actor, purpose, source command, aggregate versions, adapter version and trace.

---

## 19. Event Architecture

### 19.1 Event Types

The architecture distinguishes:

- Domain Events;
- Integration Events;
- UX Analytics Events;
- Operational Events;
- and Audit Events.

### 19.2 Representative Canonical Domain Events

- ConsentRecorded;
- ConsentWithdrawn;
- ProtocolVersionApproved;
- ParticipantEnrolled;
- InterventionExposureRecorded;
- AssessmentCompleted;
- SafetySignalRecorded;
- SafetySignalTriaged;
- SafetyEventCreated;
- EvidenceDecisionApproved;
- LifeStoryItemConfirmed;
- LifeStoryItemVisibilityChanged;
- SocialPostPublished;
- MatchCandidateGenerated;
- MatchDecisionRecorded;
- MutualAcceptanceRecorded;
- MutualAcceptanceExpired;
- MutualAcceptanceInvalidated;
- ConnectionActivated;
- ConnectionDisconnected;
- ConversationThreadCreated;
- ConversationThreadClosed;
- MessageDraftCreated;
- MessageSendConfirmed;
- MessageQueued;
- MessageSent;
- MessageProviderAccepted;
- MessageDelivered;
- MessageDeliveryFailed;
- MessageWithdrawn;
- BlockCreated;
- BlockRevoked;
- UserReportSubmitted;
- ContentReportSubmitted;
- ModerationCaseCreated;
- ModerationDecisionRecorded;
- AIInteractionCompleted;
- AISafetySignalRaised;
- DatasetDefinitionApproved;
- DatasetVersionGenerated;
- DatasetVersionLocked;
- AnalysisRunCompleted;
- InterpretationApproved;
- ResearchFindingApproved;
- ExternalSubmissionCompleted.

### 19.3 Integration Events

Integration Events are stable deliberately published contracts.

For communication delivery, representative M16 contracts may include:

- MessageDeliveryRequested;
- MessageDeliveryCancellationRequested;
- and MessageDeliveryStateChanged.

These are derived from canonical M18 facts and do not make M16 the Message owner.

### 19.4 UX Analytics Mapping

UX Analytics Events do not establish domain success.

| UX or Legacy Term | Canonical Domain Event |
|---|---|
| PublicProfileActivated | PublicProfilePublished |
| LifeStoryVisibilityChanged | LifeStoryItemVisibilityChanged |
| MatchCompleted | MutualAcceptanceRecorded or ConnectionActivated |
| MessageDeliveryConfirmed | MessageDelivered |
| ActorBlocked | BlockCreated |
| UserReported | UserReportSubmitted |
| DatasetLockConfirmed | DatasetVersionLocked |

### 19.5 Event Envelope

An event preserves Event ID and category, type and schema version, times, source module, aggregate type, ID and version, actor or ServiceAccount, Organisation and ResearchProject, purpose, DataClassification, correlation, causation, trace and minimum-necessary payload.

### 19.6 Sensitive Payload Rule

General events exclude private Life Story text, Message body, reporter identity, precise location, Safety detail, moderation evidence and hidden matching data.

Consumers retrieve permitted detail using current authority.

### 19.7 Outbox Pattern

Material events use a transactional outbox or equivalent atomic publication mechanism.

### 19.8 Consumer Idempotency and Ordering

Consumers tolerate duplicates and handle aggregate ordering.

```text
MatchDecisionRecorded
        ↓
MutualAcceptanceRecorded
        ↓
ConnectionActivated
        ↓
ConversationThreadCreated
        ↓
MessageDraftCreated
        ↓
MessageSendConfirmed
        ↓
MessageQueued
        ↓
MessageSent
        ↓
MessageProviderAccepted or MessageDelivered
```

### 19.9 Event Possession Is Not Permission

Receiving an event does not grant continuing access to the source resource.

### 19.10 Deprecated Aliases

New canonical producers do not emit SafetyEventDetected, ActorBlocked, UserReported, MessageDeliveryConfirmed, MatchCompleted, DatasetLocked or DatasetLockConfirmed.

Explicit versioned translation preserves historical compatibility.

---

## 20. Background Job Architecture

### 20.1 Representative Job Types

- reminders and notifications;
- media validation, virus scanning and transformation;
- transcription and translation;
- search and vector indexing;
- evidence refresh and reference-change checks;
- Match Candidate generation;
- feed projection;
- moderation enrichment;
- external import and reconciliation;
- deletion and retention propagation;
- data-quality checks;
- Dataset Version generation;
- approved Analysis Run execution where automated;
- report and export generation;
- device-data import;
- AI evaluation;
- and audit reconciliation.

### 20.2 Job Metadata

A job preserves:

- Job ID and type;
- state and priority;
- requester and purpose;
- source command or event;
- input references and exact versions;
- permission or approval reference where required;
- attempt count and next attempt;
- output reference;
- worker and software version;
- Data Classification;
- correlation and trace;
- and failure reason.

### 20.3 Job States

- Queued;
- Running;
- Waiting for External Dependency;
- Waiting for Human Review;
- Succeeded;
- Failed;
- Retrying;
- Cancelled;
- Dead-Lettered.

### 20.4 Scheduling

Durable scheduling is used instead of in-memory timers.

### 20.5 Job Safety

A job revalidates time-sensitive permission, consent, Block, Resource State and approval before performing a sensitive action.

### 20.6 Human Review

Failed safety-, moderation-, consent-, deletion-, dataset- or research-critical jobs are visible to assigned authorised actors.

## 21. AI Orchestration Placement

### 21.1 Controlled Entry Point

All model-provider access passes through M11.

### 21.2 AI Request Flow

```text
Actor or Platform Request
        ↓
Human Actor Permission
        ↓
Approved AI Configuration, Task and Tool Intersection
        ↓
Data Classification, Resource State and Action-Risk Check
        ↓
Minimum-Necessary Context Assembly
        ↓
Authorised Knowledge Retrieval through M10
        ↓
Typed Tool Selection
        ↓
Model Gateway
        ↓
Output Classification and Validation
        ↓
Participant Confirmation or Human Review
        ↓
Owning-Module Command
        ↓
Confirmed Result, Failure or SafetySignal
```

### 21.3 Model Gateway

The gateway abstracts provider, model, version, endpoint, capability, data-use policy, jurisdiction, cost, latency, availability and fallback.

### 21.4 Tool Registry

Every tool declares:

- owner module and domain command;
- schema and version;
- read or write behaviour;
- permitted AI modes;
- required human permission, consent and purpose;
- Data Classification and Resource State restrictions;
- action level and reversibility;
- confirmation and reviewer requirements;
- idempotency;
- rate and abuse limits;
- audit fields;
- and degraded behaviour.

### 21.5 Context Assembly

Context excludes unrelated Participant, Life Story, matching, message, safety and moderation records.

Block and visibility filters execute before the model sees content.

### 21.6 Domain Mutation

AI never directly writes another aggregate.

It proposes a typed command and receives the owning module's confirmed result.

### 21.7 Life Story Boundary

AI transcription, translation and wording remain Draft until Participant confirmation.

AI does not invent memories or change LegacyPreference.

### 21.8 Community and Matching Boundary

AI may explain Community Rules, draft content, help configure matching and explain a MatchCandidate.

It cannot publish, submit another actor's MatchDecision, create MutualAcceptance, activate or restore a Connection, create a ConversationThread without CommunicationBasis, confirm an unapproved send or claim Message delivery from a queued or provider-accepted result.

### 21.9 Moderation and Safety Boundary

AI may assist triage and raise `AISafetySignalRaised`.

It cannot impose a high-impact ModerationDecision or confirm a SafetyEvent.

### 21.10 AI Memory

AIMemoryItem is purpose-bound and separate from ParticipantProfile, LifeStoryArchive, MatchPreference, messages and research records.

### 21.11 Failure

Core non-AI workflows remain available when AI is unavailable.

## 22. Knowledge Platform Integration Placement

### 22.1 M10 Boundary

All authoritative external knowledge access passes through M10 and its Anti-Corruption Layer.

### 22.2 Adapter Responsibilities

The adapter handles:

- authentication;
- capability discovery;
- MCP, REST or other governed transport;
- query translation;
- response normalisation;
- identifier and version mapping;
- provenance and citation;
- licensing;
- cache and freshness;
- partial results;
- timeout, retry and circuit breaking;
- and trace.

### 22.3 No Direct Knowledge Calls

Research, intervention, AI and reporting modules do not call Knowledge Platform internals.

### 22.4 Local Records

The Research Platform stores KnowledgeReference, EvidenceReview, EvidenceDecision, EvidenceSnapshot, ResearchKnowledgeGap and ReferenceChangeAlert.

### 22.5 Historical Independence

Approved Evidence Decisions and immutable Evidence Snapshots remain available when live knowledge is unavailable.

### 22.6 External Submission

M14 coordinates approved EvidencePackage and ExternalSubmission workflows.

M10 supplies references, decisions, snapshots and provenance without taking ownership of the ResearchFinding or external submission.

## 23. Transactional Data Architecture

### 23.1 Primary Store

The MVP uses a relational database as the transactional system of record.

### 23.2 Rationale

The domain requires:

- transactions and constraints;
- versioned aggregates;
- rich relationships;
- optimistic concurrency;
- strong consistency for critical transitions;
- auditability;
- and governed research queries.

### 23.3 Module Ownership

Schemas, tables, repositories and migrations map to M01–M18 ownership.

### 23.4 Concurrency

Versioned records, approvals, matching decisions, Connections, Consent and Dataset Locks use concurrency control.

### 23.5 Encryption and Classification

Sensitive columns and records support classification-aware encryption, access and logging as defined in Documents 14 and 16.

### 23.6 Schema Migration

Migrations are version-controlled, tested, module-owned and compatible with safe release sequencing.

### 23.7 No Direct Client or AI Access

Clients, notebooks and model providers never access the transactional database directly.

### 23.8 Analytical Read Boundary

M12 creates governed extracts or replicas for analysis.

Researchers do not run unrestricted analysis queries against operational production tables.

## 24. Object and Media Storage

### 24.1 Uses

Object storage supports:

- Life Story media;
- interview and assessment media;
- documents;
- transcripts and translations;
- Social Post attachments;
- moderation evidence;
- research artefacts;
- Dataset exports;
- reports;
- Evidence Packages;
- and reproducibility packages.

### 24.2 Metadata Authority

Object metadata remains in the owning module and includes source aggregate, version, creator, attribution, classification, visibility, consent, purpose, checksum, processing, retention and deletion state.

### 24.3 Upload Flow

```text
Upload Intent and Permission
        ↓
Restricted Temporary Upload
        ↓
Size, Type and Malware Validation
        ↓
Checksum and Media Metadata
        ↓
Owning-Domain Confirmation
        ↓
Transcription, Transformation or Moderation Processing
        ↓
Authorised Delivery
```

### 24.4 Life Story and Third-Party Rights

Media may contain third parties.

Sharing, research use and public publication require item-specific controls and review.

### 24.5 Immutable Research Artefacts

Approved snapshots, locked dataset packages and approved report versions use retention, object versioning or write-once controls where appropriate.

### 24.6 Authorised Delivery

Sensitive objects use short-lived, audience-scoped delivery rather than permanent public URLs.

### 24.7 Public Media

Platform Public and Internet Public media use separate delivery paths, cache rules, takedown and revocation behaviour.

### 24.8 Processing Failure

Failed processing does not mark an item as published, transcribed, exported or safe.

## 25. Search Architecture

### 25.1 Search Domains

The architecture separates:

- Participant's own information search;
- protected platform-record search;
- Life Story search;
- Community discovery;
- matching candidate generation;
- Evidence and Knowledge search;
- moderation search;
- audit search;
- and administration search.

### 25.2 Search Processing

```text
Query and Purpose
        ↓
Candidate Source Selection
        ↓
Permission, Consent, Visibility, Block and Resource-State Filters
        ↓
Existence Protection
        ↓
Ranking within the Permitted Set
        ↓
Source-, State- and Freshness-Labelled Results
```

### 25.3 MVP Approach

The MVP may use relational structured search, database full-text search and Knowledge Platform semantic search.

A dedicated index is introduced only when justified.

### 25.4 Index Ownership

Indexes are derived projections and never the source of truth.

### 25.5 Sensitive Search

Private Life Story, messages, matching preferences, reporter identity, Safety records and moderation evidence use isolated search paths or remain unindexed.

### 25.6 Community Search

Community discovery applies visibility, eligibility, Community Rules, block, moderation and age or access policy before ranking.

### 25.7 Matching Is Not People Search

MatchCandidate generation is a governed M18 workflow.

It is not an unrestricted search endpoint.

### 25.8 Deletion and Revocation

Search and suggestion indexes receive prompt invalidation after consent withdrawal, visibility change, block, moderation action, account restriction or deletion.

## 26. Vector Retrieval

### 26.1 Permitted Uses

Vector retrieval may support:

- AI-assisted project-document search;
- Evidence and Knowledge retrieval through approved boundaries;
- Participant's own Life Story retrieval;
- permitted Community content retrieval;
- qualitative research coding assistance;
- and internal research artefact discovery.

### 26.2 Boundary

Vector retrieval never replaces:

- canonical identifiers;
- structured filters;
- permission and visibility;
- Block;
- purpose;
- provenance;
- or deterministic matching policy.

### 26.3 Derived-Data Record

Every embedding preserves source aggregate and version, model and version, purpose, namespace, classification, visibility, creation time, refresh and deletion state.

### 26.4 Namespace Isolation

Private Participant content, project documents, Community content, moderation evidence and external knowledge use separate logical namespaces and filters.

### 26.5 Source Validation

A retrieved vector candidate is re-authorised against the current source record before use.

### 26.6 MVP Decision

A separate vector database is optional.

The MVP may use a relational extension, provider-neutral retrieval layer or Knowledge Platform capability.

### 26.7 Prohibited Uses

Vector retrieval does not create hidden vulnerability, capacity or compatibility scores and does not bypass matching attributes or consent.

## 27. Analytics and Research Data Architecture

### 27.1 Operational and Analytical Separation

Operational aggregates remain in owning modules.

Research analysis uses governed analytical copies.

### 27.2 Canonical Pipeline

```text
Approved DatasetDefinition
        ↓
Source Selection with Consent, Purpose and Permission
        ↓
TransformationRun
        ↓
DatasetVersion
        ↓
Data Quality Review
        ↓
DatasetLock
        ↓
Approved AnalysisPlan
        ↓
AnalysisRun
        ↓
AnalysisOutput and Diagnostics
        ↓
Approved InterpretationRecord
        ↓
ResearchFinding
```

### 27.3 Dataset Definition

M12 owns the approved field, source, inclusion, exclusion, transformation, missingness, de-identification and retention specification.

### 27.4 Dataset Version and Lock

A locked DatasetVersion is immutable.

DatasetLock is a governed entity within the DatasetVersion and requires complete lineage, quality review and approval.

### 27.5 Analytical Store

The MVP may use governed extracts, a dedicated schema or a separate analytical database or research environment.

### 27.6 Analysis Execution

An AnalysisRun references an exact approved AnalysisPlan, locked DatasetVersion, code and software environment.

### 27.7 No Operational Write-Back

Analytical corrections do not directly mutate operational aggregates.

Validated source corrections follow the owning module and generate a new DatasetVersion where needed.

### 27.8 Sensitive Social and Content Data

Life Story, social, matching, message and moderation data require explicit DatasetDefinition rules, minimisation, network re-identification review, third-party protection and source lineage.

### 27.9 Preliminary Results

Dashboards label preliminary summaries and AnalysisOutputs distinctly from approved InterpretationRecords and ResearchFindings.

## 28. File and Dataset Export Architecture

### 28.1 Export Service

M14 coordinates:

- Participant exports;
- Life Story exports;
- locked research datasets;
- reports;
- Evidence Packages;
- reproducibility packages;
- and external submissions.

### 28.2 Export Workflow

```text
ExportRequest
        ↓
Permission, Consent, Purpose and Resource-State Check
        ↓
Approved Source or Locked DatasetVersion
        ↓
Third-Party, Reporter, Block and Visibility Review
        ↓
De-Identification and Validation
        ↓
Package and Manifest Generation
        ↓
Human Approval where Required
        ↓
Secure Delivery and Recipient Record
```

### 28.3 Asynchronous Generation

Large exports use durable jobs.

### 28.4 Manifest

The manifest records:

- export and schema version;
- creator, approver, recipient and purpose;
- source aggregates and versions;
- DatasetDefinition and DatasetVersion where applicable;
- transformations;
- de-identification;
- restrictions and expiry;
- licensing;
- checksums;
- and trace.

### 28.5 Delivery State

Generated is distinct from delivered and received.

### 28.6 Portability Boundary

A Participant export does not create research, model-training, publication or redistribution permission.

## 29. Identity and Authentication Placement

### 29.1 Identity Provider

Authentication may be delegated to a standards-based provider.

### 29.2 Platform Identity

M01 maintains UserAccount, Organisation, memberships, roles, ServiceAccounts and external identity linkage.

### 29.3 Authentication versus Authorisation

Authentication answers who the actor is.

Authorisation answers which action or field is allowed for a purpose, context and resource state.

### 29.4 Authenticated Context

The request context includes:

- User or ServiceAccount ID;
- Organisation;
- active role and scope;
- session and authentication strength;
- Research Project and Participant context where applicable;
- purpose;
- correlation and trace.

### 29.5 Step-Up Authentication

High-risk export, Internet Public publication, role change, break-glass access, identity merge and security actions may require stronger authentication.

### 29.6 No Social Identity Merge

Names, profiles, photos, Community memberships, Connections, messages or Life Story references do not automatically establish identity equivalence.

## 30. Authorisation Enforcement

### 30.1 Effective Permission

```text
Role
+ Relationship
+ Consent
+ Purpose
+ Context
+ Specific Permission
+ Resource State
```

Additional domain checks may include visibility, ownership, Block, Community membership, Mutual Acceptance, Data Classification, approval and action risk.

### 30.2 Enforcement Layers

Controls apply at:

- client discoverability;
- API edge and BFF;
- application service;
- domain policy;
- repository query and projection;
- search and vector retrieval;
- event-detail retrieval;
- background job;
- AI context and tool;
- dataset generation;
- export;
- and external adapter.

### 30.3 Server Authority

Client controls are not security authority.

### 30.4 Policy Component

The MVP uses a central policy-evaluation component plus owning-module domain policies.

The central component must not become a generic domain owner.

### 30.5 Decision Record

Sensitive decisions may record policy version, inputs, result, reason and trace.

### 30.6 Cache Invalidation

Permission caches use bounded lifetime and immediate invalidation for withdrawal, role change, relationship revocation, Block, moderation restriction and Resource State change.

### 30.7 Future Policy Engine

An external policy engine is considered only when multi-service or multi-organisation complexity justifies it.

## 31. Consent and Purpose Enforcement

### 31.1 Consent Evaluation Points

Consent is evaluated before:

- intervention delivery;
- assessment and observation;
- AI interaction and memory;
- Life Story capture, contribution, sharing and research use;
- Community and Public Profile;
- Platform Public or Internet Public publication;
- Open Matching and sensitive matching attributes;
- messaging and Supporter access;
- device collection;
- dataset inclusion;
- export and external sharing;
- secondary research;
- and model training.

### 31.2 Current Effective Consent

Evaluation includes exact Consent version, scope, purpose, resource, actor, context, time, conditions, withdrawal and Resource State.

### 31.3 Purpose Propagation

Sensitive commands, jobs, events, AI requests, dataset transformations and exports carry a governed purpose code.

### 31.4 Withdrawal Propagation

Withdrawal updates authoritative consent and triggers invalidation or propagation to:

- active workflows;
- search and vector indexes;
- matching;
- messages and notifications where applicable;
- AI context and memory;
- pending exports;
- future Dataset generation;
- and external providers.

### 31.5 Failure Behaviour

When consent or purpose cannot be verified, sensitive actions pause or block.

### 31.6 Consent Is Not Sufficient Alone

Publication, external submission, Dataset Lock and high-risk export may also require permission, content review, privacy review or ApprovalRecord.

### 31.7 Detailed Controls

Document 14 defines detailed security, privacy and consent implementation.

## 32. Notification and Messaging Delivery Architecture

### 32.1 Notification Types

- task and reminder;
- Consent and permission;
- social and Connection;
- matching;
- Message delivery;
- Safety;
- moderation;
- evidence change;
- research workflow;
- export;
- and system notice.

### 32.2 Notification versus Message

Notification is an attention or channel-delivery mechanism.

Message is an M18 aggregate within a ConversationThread and current CommunicationBasis.

A Notification may point to a Message but is not the Message.

### 32.3 M18 Message Ownership

M18 owns ConversationThread, participants, CommunicationBasis reference, Message content and versions, SendConfirmation, lifecycle state, canonical delivery state, attachments, moderation and Safety links, and retention.

### 32.4 M16 Delivery Infrastructure

M16 owns provider adapter, provider credential reference, routing, provider-reference mapping, callback ingress, callback evidence, retries, reconciliation, circuit breaker, quota and operational telemetry.

### 32.5 Delivery Flow

```text
M18 MessageSendConfirmed
        ↓
M18 MessageQueued and Outbox
        ↓
Message Delivery Worker
        ↓
M16 Communication Adapter
        ↓
Provider
        ↓
Authenticated Callback or Reconciliation
        ↓
M16 Translation
        ↓
M18 Delivery-State Command
        ↓
MessageSent / ProviderAccepted / Delivered / Failed
```

### 32.6 Delivery State

The system separately records requested, queued, sent to provider or transport, provider accepted, delivered, read where enabled, failed, unknown, cancelled and expired.

Provider acceptance is not delivery.

### 32.7 Preferences, Consent and Block

Channel selection and send execution respect preference, Consent, purpose, accessibility, quiet hours, shared-device settings, Block, moderation restrictions and current CommunicationBasis.

### 32.8 Sensitive Preview

Notification previews minimise Life Story, match, Message, Safety and moderation detail.

### 32.9 Cancellation and Withdrawal

Cancellation is attempted only before irreversible provider delivery where supported.

Withdrawal does not falsely claim recall from an external recipient.

### 32.10 Safety Alerts

Safety alerts use M09 escalation and acknowledgement rather than ordinary Notification alone.

### 32.11 Provider Failure

Provider failure leaves the Message in accurate Queued, Retrying, Failed or Delivery Unknown state.

The system does not represent Message or Notification as Delivered without supported evidence.

---

## 33. Research Collaboration Architecture

### 33.1 Scope

Research collaboration supports:

- comments;
- mentions;
- tasks;
- ReviewRequests;
- assignments;
- decisions;
- and external reviewer access.

### 33.2 Contextual Attachment

Collaboration attaches to a governed artefact such as ProtocolVersion, EvidenceDecision, DatasetVersion, AnalysisPlan, InterpretationRecord or ResearchFinding.

### 33.3 Access Inheritance

Comments and attachments inherit the parent artefact's permission, classification and retention boundary.

### 33.4 Separation from Community

Research collaboration is not implemented through CommunitySpace, SocialPost, public profiles, Connections or Participant messaging.

### 33.5 External Review

External reviewer access is purpose-bound, time-limited, field-scoped and audited.

## 34. Deployment Architecture

### 34.1 MVP Deployment Units

The MVP uses:

```text
Responsive Web / PWA
Backend API Application
Background Worker
Scheduled Job Runner
Relational Database
Object Storage
Durable Queue
Cache
Observability and Audit
Optional Search / Vector Capability
Governed Analytical Environment
```

The Backend API, Worker and Scheduler may share the same codebase and release version while running as separate processes.

### 34.2 Deployment Boundary versus Domain Boundary

One deployment unit may host many modules.

A module boundary does not require a network boundary.

### 34.3 Containerisation

Application processes are container-ready and use immutable release artefacts.

### 34.4 Orchestration

A simple managed container or application platform is preferred.

Kubernetes requires a demonstrated need for operational control, scale or portability.

### 34.5 Managed Services

Managed database, object storage, queue, secrets, identity and observability services are preferred when they reduce operational and security risk.

### 34.6 Stateless Processes

Backend and worker processes are stateless apart from bounded local caches and temporary processing files.

### 34.7 Workload Isolation

Queues or worker pools should separate:

- Participant-facing critical work;
- safety and moderation work;
- messages and notifications;
- media processing;
- AI requests and evaluation;
- search indexing;
- Dataset and Analysis work;
- export generation;
- and low-priority maintenance.

### 34.8 Safety-Critical Independence

Block, report, consent withdrawal, Safety Signal submission and essential Participant controls must not depend on AI, analytics, search or live Knowledge Platform availability.

### 34.9 Health Checks

Deployments expose:

- liveness;
- readiness;
- version;
- database and queue health;
- critical dependency health;
- migration state;
- and degraded capability state.

## 35. Reference MVP Topology

```text
Internet and Approved Client Networks
        │
        ▼
Managed DNS, TLS, CDN and Web Application Firewall
        │
        ├── Static Responsive Web / PWA
        │
        └── API Edge
                │
                ▼
       Backend API Application
                │
                ├── M01–M18 Modular Modules
                ├── Policy and Workflow Components
                ├── Outbox and Internal Event Dispatch
                └── External Adapters
                │
        ┌───────┼─────────┬───────────┬────────────┐
        ▼       ▼         ▼           ▼            ▼
 Relational  Object    Durable      Cache       Search /
 Database    Storage   Queue                    Vector Index
        │       │         │                          │
        └───────┴─────────┴──────────────┬───────────┘
                                         ▼
                         Worker and Scheduled Job Processes
                                         │
             ┌───────────────────────────┼───────────────────────────┐
             ▼                           ▼                           ▼
 Healthy Aging Knowledge         AI and Media Providers      Communication,
 Platform                        through Controlled          Identity, Device
                                 Gateways                    and Other Adapters
                                         │
                                         ▼
                          Governed Analytical Environment
                          and Approved Research Exports
```

### 35.1 Network Segmentation

The topology separates:

- public edge;
- application runtime;
- transactional and object data;
- workers;
- analytical access;
- and external adapters.

### 35.2 No Direct Researcher Database Access

Researchers and notebooks receive locked Dataset Versions through governed analytical delivery, not production database credentials.

### 35.3 Reference, Not Vendor Selection

This topology defines responsibilities and trust boundaries rather than final products.

## 36. Environment Strategy

### 36.1 Environments

Recommended environments:

- local development;
- shared development;
- automated test;
- integration test;
- staging;
- production;
- and isolated research sandbox where required.

### 36.2 Research Sandbox

The sandbox supports:

- synthetic or governed de-identified data;
- Protocol simulation;
- accessibility testing;
- AI and prompt evaluation;
- matching and moderation-policy testing;
- Dataset and Analysis reproducibility;
- and demonstration.

It is not an uncontrolled copy of production.

### 36.3 Environment Isolation

Production Participant, Life Story, message, matching, safety and moderation data are not copied into lower environments without approved de-identification and minimisation.

### 36.4 External Provider Isolation

Development and test environments use separate provider projects, keys, storage, callbacks and model-training settings.

### 36.5 Configuration Parity

Environments remain structurally similar enough to test deployment, migration, queue, permission and integration behaviour.

### 36.6 Feature Flags

Feature flags support technical rollout and emergency disablement.

They do not replace:

- ProtocolVersion;
- InterventionVersion;
- AIInterventionConfigurationVersion;
- CommunityRuleVersion;
- matching policy;
- moderation policy;
- or Participant assignment.

### 36.7 Test Clock and Determinism

Test environments should support deterministic time, scheduled-job control and fixed model or stub behaviour for reproducible workflows.

## 37. Configuration Architecture

### 37.1 Configuration Categories

- runtime and environment settings;
- integration endpoints and capability flags;
- feature flags;
- limits and rate controls;
- notification and media settings;
- policy references;
- Community and moderation technical settings;
- search and index configuration;
- job and queue configuration;
- and observability settings.

### 37.2 Versioned Domain Configuration

Research- or Participant-experience-critical configuration is represented as domain data:

- ProtocolVersion;
- InterventionVersion;
- InterventionConfiguration;
- AIInterventionConfigurationVersion;
- MeasurementVersion;
- ConsentFormVersion;
- CommunityRuleVersion;
- matching policy version;
- moderation policy version;
- DatasetDefinition;
- AnalysisPlan;
- and report template version where material.

### 37.3 Technical Configuration

Technical configuration is externalised from binaries and validated at startup or activation.

### 37.4 No Silent Substitution

A model, instruction, matching algorithm, ranking method, moderation policy, Measurement Version or research-critical configuration is not silently replaced during an active study.

### 37.5 Activation

Activation records effective time, scope, approver, compatibility and rollback behaviour.

### 37.6 Validation

Unsafe or incompatible configuration prevents activation and may prevent startup of the affected capability.

### 37.7 Configuration Drift

Production configuration drift is detected, reported and reconciled against version-controlled or governed desired state.

## 38. Secrets Management

### 38.1 Secret Types

- database and queue credentials;
- provider API keys;
- signing and encryption keys;
- webhook secrets;
- service-account credentials;
- object-delivery keys;
- and certificate material.

### 38.2 Storage

Secrets use a managed secrets service or equivalent protected store.

### 38.3 Access

Runtime identities receive only required secrets and do not expose them to clients, domain records, AI context, logs or analytical exports.

### 38.4 Rotation

Secrets support rotation without source-code changes and with documented provider transition.

### 38.5 No Secrets in Domain Data

Secrets are not stored in:

- Research records;
- prompts;
- Life Story or Community content;
- messages;
- audit payloads;
- event payloads;
- source control;
- or Dataset Versions.

### 38.6 Development Safety

Local development uses non-production credentials and prevents accidental production connection by default.

## 39. Observability Architecture

### 39.1 Signals

The platform collects:

- structured logs;
- metrics;
- traces;
- health and degraded-state indicators;
- job and queue status;
- integration state;
- audit events;
- and research-pipeline status.

### 39.2 End-to-End Correlation

A trace connects client, API, application command, domain transition, outbox event, job, external call and audit record.

### 39.3 Structured Logging

Logs include technical identifiers, module, operation, outcome, latency, trace and safe error fields.

### 39.4 Sensitive-Data Exclusion

Logs avoid:

- Life Story and message content;
- assessment responses;
- Match Preferences;
- reporter identity;
- Safety details;
- Consent documents;
- model prompts and outputs unless specifically governed;
- credentials;
- and full external payloads.

### 39.5 Core Metrics

- API latency and errors;
- database and connection-pool health;
- queue depth, age and dead letters;
- job duration and failure;
- integration latency and availability;
- media-processing state;
- search-index lag;
- permission and consent denials;
- export and deletion propagation;
- and availability by capability.

### 39.6 Domain-Critical Metrics

- Safety Signal triage age;
- unacknowledged safety alerts;
- moderation backlog and appeal age;
- block propagation failure;
- Mutual Acceptance violation attempt;
- message-delivery failure;
- public-publication errors;
- stale permission projection;
- Dataset lock readiness and failures;
- Analysis Run reproducibility;
- Evidence reference changes;
- AI grounding and tool failure;
- invented Life Story correction;
- sensitive context leakage;
- and provider data-use violations.

### 39.7 Tracing

Distributed tracing is used across processes and external calls when diagnosis requires it.

### 39.8 Audit Is Distinct

Operational telemetry may be sampled and retained for troubleshooting.

Governance audit is purpose-built, complete for required actions, access-controlled and tamper-evident.

### 39.9 Participant Experience Monitoring

Monitoring should detect excessive latency, repeated failure, inaccessible paths and inability to use consent, block, report, pause or withdrawal controls without collecting unnecessary behavioural surveillance.

## 40. Reliability Architecture

### 40.1 Dependency Isolation

External dependencies use adapters, timeouts, retries, circuit breakers, queues and capability-state reporting.

### 40.2 Retry Policy

Retries use bounded attempts, exponential backoff, jitter and idempotency.

Non-idempotent writes are not blindly retried.

### 40.3 Circuit Breaker

Repeated external failure temporarily stops calls and exposes degraded state.

### 40.4 Bulkheads

Resource pools isolate critical Participant, consent, block, safety and moderation workflows from:

- media processing;
- AI generation;
- search indexing;
- Dataset work;
- reports;
- and bulk imports.

### 40.5 Graceful Degradation

Examples:

- AI unavailable → deterministic and manual workflows continue;
- Knowledge Platform unavailable → approved Evidence Decisions and Snapshots remain available;
- search unavailable → structured navigation and direct lookup continue;
- vector unavailable → structured retrieval continues;
- notification provider unavailable → queue, alternate channel or manual follow-up;
- media processor unavailable → private Draft retained without false completion;
- matching worker unavailable → matching pauses without fabricated candidates;
- moderation enrichment unavailable → human queue remains available;
- analytics unavailable → intervention delivery continues;
- external analytical environment unavailable → locked Dataset Version remains preserved.

### 40.6 Critical Workflow Protection

Authentication, consent withdrawal, block, report, Safety Signal submission, Enrolment, Protocol enforcement and withdrawal fail safely.

### 40.7 No Fabricated Completion

The platform never represents an external or asynchronous operation as completed without authoritative confirmation.

### 40.8 Reconciliation

Periodic reconciliation verifies:

- provider delivery state;
- search and vector indexes;
- permission invalidation;
- deletion propagation;
- object metadata;
- event consumers;
- Dataset manifests;
- and external submissions.

### 40.9 Dead-Letter Operations

Dead-letter queues have ownership, alerting, replay rules, privacy controls and manual-resolution procedures.

## 41. Availability and Criticality

### 41.1 Capability Tiers

Capabilities are classified as:

- Critical;
- Important;
- Supporting;
- Experimental;
- or Deferred.

### 41.2 Critical Capabilities

Potentially Critical:

- authentication and current session;
- consent and permission evaluation;
- Participant access to current choices;
- intervention pause and withdrawal;
- block and report;
- Safety Signal submission and routing;
- current Protocol and assignment enforcement;
- core operational records;
- and essential staff review queues during operating hours.

### 41.3 Important Capabilities

Potentially Important:

- Life Story private capture;
- messaging;
- Community access;
- matching decisions;
- assessment;
- notification delivery;
- moderation workflow;
- Dataset generation and lock during research milestones.

### 41.4 Supporting Capabilities

Potentially Supporting:

- AI drafting;
- semantic search;
- advanced ranking;
- evidence refresh;
- analytical dashboards;
- report generation;
- and non-urgent exports.

### 41.5 Service Objectives

Formal SLOs are defined after Pilot operating hours, escalation model, staffing, Participant expectations and recovery requirements are known.

### 41.6 Dependency-Specific Objectives

Availability objectives distinguish the Research Platform from external provider availability and report effective degraded capability.

## 42. Performance Architecture

### 42.1 Priorities

Prioritise:

- responsive Participant navigation and current task;
- rapid consent, block, report and pause controls;
- predictable researcher and moderator queues;
- stable intervention delivery;
- bounded message and notification submission;
- and bounded AI first-response latency.

### 42.2 Pagination and Streaming

Large lists use cursor pagination.

Large files and media use streaming or multipart transfer.

### 42.3 Async Offloading

Long work is moved to jobs without hiding its pending state.

### 42.4 Caching

Caching may support:

- reference and terminology data;
- capability discovery;
- stable public content;
- safe read models;
- and external evidence metadata.

### 42.5 Unsafe Cache Prohibition

Consent, permission, Block, current visibility, Mutual Acceptance, message basis, Safety state and active Protocol state require explicit freshness and invalidation.

### 42.6 Search and Feed Budgets

Search and Community feed latency budgets include permission and Block filtering rather than measuring ranking alone.

### 42.7 AI Budgets

AI budgets distinguish:

- context assembly;
- retrieval;
- model latency;
- tool calls;
- validation;
- and confirmation.

Timeout does not trigger unreviewed fallback execution.

### 42.8 Background Budgets

Later SLOs should define:

- notification age;
- moderation queue age;
- Safety Signal triage age;
- media-processing completion;
- Match Candidate generation;
- search-index lag;
- Dataset generation;
- export generation;
- and deletion propagation.

### 42.9 Accessibility Performance

Performance budgets account for screen readers, low-bandwidth connections, larger content, voice input and shared devices.

## 43. Scalability Architecture

### 43.1 Initial Scaling

The MVP scales vertically and through multiple stateless API or worker instances.

### 43.2 Worker Scaling

Workers scale by queue depth, job type, priority and Data Classification.

### 43.3 Database Scaling

Use:

- correct indexing;
- query optimisation;
- connection pooling;
- read replicas where safe;
- table partitioning where justified;
- archival;
- and analytical offloading.

### 43.4 Object and Media Scaling

Object storage and content delivery scale independently from transactional metadata.

### 43.5 Search and Vector Scaling

A dedicated search or vector cluster is introduced only after measured relevance, volume, latency or isolation needs.

### 43.6 Module Extraction Triggers

A module may be extracted when one or more apply:

- independent scale;
- specialised runtime;
- security or data-residency isolation;
- failure isolation;
- materially different release cadence;
- clear team ownership;
- external reuse;
- or operational evidence that the modular monolith is insufficient.

### 43.7 Likely Extraction Candidates

Possible future candidates:

- M10 Knowledge Integration;
- M11 AI Orchestration and Model Gateway;
- media processing;
- notification delivery;
- device ingestion;
- M12/M13 analytical processing;
- M18 moderation or high-volume Community delivery;
- and M16 external integration workers.

### 43.8 Extraction Preconditions

Before extraction:

- ownership is stable;
- contracts are versioned;
- data migration is planned;
- distributed consistency is understood;
- observability exists;
- failure and rollback are tested;
- and operational ownership is assigned.

### 43.9 No Premature Split

Table count, code size, popularity of microservices or a one-to-one module-to-service preference are insufficient reasons.

## 44. Resilience and Recovery

### 44.1 Backup Scope

Back up:

- transactional databases;
- object metadata and critical objects;
- module configuration;
- Consent and authority evidence;
- Life Story and media according to retention;
- audit records;
- Dataset Definitions, locked Dataset Versions and manifests;
- Analysis Plans, code references and findings;
- and infrastructure configuration.

### 44.2 Object Versioning

Research-critical, Participant-controlled and governance-critical objects use version retention where appropriate.

### 44.3 Recovery Objectives

RPO and RTO are defined according to:

- Participant safety and autonomy;
- intervention continuity;
- message and moderation operations;
- data loss tolerance;
- research integrity;
- and operational cost.

### 44.4 Restore Testing

Restores are tested for:

- database;
- object storage;
- audit;
- queue state where supported;
- search and vector rebuild;
- Dataset manifests;
- and external-integration reconciliation.

### 44.5 Point-in-Time Consistency

Recovery procedures identify consistency among database records, objects, outbox events, indexes and provider state.

### 44.6 Audit Recovery

Audit is protected from unauthorised alteration and recoverable without exposing sensitive payloads.

### 44.7 Encryption-Key Recovery

Key backup and rotation procedures avoid making retained data permanently unreadable or broadly decryptable.

## 45. Disaster Recovery

### 45.1 MVP Approach

The MVP may use one primary region with:

- managed high availability where feasible;
- automated backups;
- infrastructure recreation;
- tested restore;
- replicated or durable object storage;
- provider reconfiguration;
- and documented continuity.

### 45.2 Manual Continuity

Pilot operations define manual procedures for:

- intervention pause;
- Participant and Supporter communication;
- Safety Signal receipt;
- block and report alternatives;
- moderation backlog;
- consent or withdrawal recording;
- and later data reconciliation.

### 45.3 Multi-Region

Multi-region deployment is introduced only when continuity, regulatory, data-residency or scale requirements justify the complexity.

### 45.4 External Dependency Recovery

Runbooks address identity, communication, AI, Knowledge, media, device, moderation and analytics providers separately.

### 45.5 Disaster Declaration and Return

The platform records declaration, affected capabilities, data cut-off, manual actions, restoration, reconciliation and return-to-normal approval.

## 46. Security Boundary Overview

Document 14 defines detailed controls.

System-level security boundaries include:

- Internet client to managed edge;
- edge to API and BFF;
- application runtime to transactional database;
- runtime to object storage and authorised content delivery;
- runtime to queue and workers;
- backend to AI and media providers;
- backend to Knowledge Platform;
- backend to identity and communication providers;
- backend to moderation or abuse-detection providers;
- backend to external care and device systems;
- operational platform to analytical environment;
- researcher access to locked datasets;
- export delivery to recipients;
- and administration or break-glass access.

Every boundary defines:

- identity and workload identity;
- authentication strength;
- encryption;
- authorisation and purpose;
- Data Classification;
- allowed payload and field minimisation;
- logging and audit;
- rate and abuse protection;
- timeout, retry and circuit breaking;
- retention and deletion;
- provider data use;
- and failure behaviour.

### 46.1 Public-Surface Boundary

Public Profile, Community and Internet-facing content receive protection against scraping, enumeration, impersonation, abuse, media harvesting and public-identifier correlation.

### 46.2 Analytical Boundary

Analytical users receive approved Dataset Versions rather than production-domain access.

### 46.3 Administrative Boundary

System administration is technically separated from Participant-content, research-approval, safety and moderation authority.

## 47. Testing Architecture

### 47.1 Test Layers

- unit tests;
- domain-invariant tests;
- module-boundary architecture tests;
- application and workflow tests;
- repository and migration tests;
- API and event contract tests;
- adapter tests;
- end-to-end tests;
- accessibility tests;
- privacy and security tests;
- AI and model-evaluation tests;
- data-lineage and reproducibility tests;
- performance and load tests;
- resilience and chaos tests;
- backup and disaster-recovery tests.

### 47.2 Critical Domain Rules

Direct tests cover:

- consent and withdrawal;
- Specific Permission and Resource State;
- field and existence protection;
- Life Story attribution and visibility;
- Platform Public versus Internet Public;
- matching opt-in and allowed attributes;
- MatchCandidate versus Connection;
- MutualAcceptance;
- block propagation;
- message communication basis;
- report availability after block;
- ModerationCase and SafetyEvent separation;
- AI-created SafetySignal;
- Protocol and Intervention version immutability;
- EvidenceDecision approval;
- DatasetLock readiness and immutability;
- AnalysisRun lineage;
- Interpretation and ResearchFinding approval;
- and external-submission separation.

### 47.3 Module Boundary Tests

Architecture tests detect:

- direct cross-module repository use;
- cross-module table writes;
- circular dependencies;
- provider SDK leakage into domain modules;
- and shared mutable domain models.

### 47.4 Contract Tests

Versioned internal and external contracts test backward and forward compatibility where required.

### 47.5 Synthetic and De-Identified Data

Lower environments use synthetic or governed de-identified data including realistic accessibility, language, matching, moderation and missingness scenarios.

### 47.6 AI Testing

AI tests include:

- permission-before-context;
- grounding and citation;
- retrieval failure;
- prompt and tool injection;
- tool schema and action-level enforcement;
- invented Life Story details;
- public-data leakage;
- hidden sensitive matching;
- Block and MutualAcceptance bypass attempts;
- moderation-assistance error;
- SafetySignal routing;
- memory correction and deletion;
- model and instruction drift;
- dependency and impersonation risk;
- and deterministic non-AI fallback.

### 47.7 Search and Index Tests

Test deletion, withdrawal, visibility change, block, moderation action and permission invalidation across search, suggestions and vector retrieval.

### 47.8 Research Reproducibility

The same approved DatasetDefinition, exact source snapshot, transformations, software and parameters should reproduce the same DatasetVersion and Analysis outputs within documented deterministic limits.

### 47.9 Degraded-Mode Tests

Test AI, Knowledge, search, vector, notification, media, moderation-provider and analytics outages without loss of critical Participant controls.

## 48. Release Architecture

### 48.1 Versioned Release

Each release records:

- application and module version;
- database schema and migration version;
- API and event schema versions;
- technical configuration;
- provider adapters;
- AI orchestration version;
- and release notes.

### 48.2 Domain Configuration Independence

Application release is separate from activation of:

- ProtocolVersion;
- InterventionVersion;
- AIInterventionConfigurationVersion;
- CommunityRuleVersion;
- matching policy;
- moderation policy;
- MeasurementVersion;
- DatasetDefinition;
- and AnalysisPlan.

### 48.3 Backward-Compatible Deployment

Database, API, event and job changes support safe sequencing and rollback.

### 48.4 Feature Rollout

Rollout may use internal preview, sandbox, Pilot cohort, Organisation scope and general availability.

### 48.5 Intervention Rollout

A technical feature flag cannot silently move a Participant to a new intervention or configuration.

### 48.6 High-Risk Rollout

Public publication, Open Matching, AI tools, moderation automation and sensitive data integrations use staged rollout, monitoring and kill switches.

### 48.7 Rollback

Technical rollback preserves already recorded domain events and applies explicit compensation or forward correction.

### 48.8 Database Migration Rollback

Destructive schema change requires backup, compatibility plan and data-preservation strategy rather than assuming simple reverse migration.

## 49. Technology Selection Principles

Technology is evaluated by:

- domain fit;
- team capability;
- operational simplicity;
- security and privacy;
- accessibility support;
- observability;
- interoperability;
- ecosystem maturity;
- cost;
- portability;
- data residency;
- provider data-use terms;
- and migration risk.

### 49.1 Preferred Characteristics

Preferred technologies are:

- widely supported;
- typed where valuable;
- standards-based;
- testable;
- observable;
- automatable;
- maintainable;
- and replaceable at external boundaries.

### 49.2 Critical Boundary Neutrality

Provider-specific behaviour is isolated at:

- identity;
- AI models;
- Knowledge Platform transport;
- communication;
- media processing;
- object storage;
- analytics;
- and device integration.

### 49.3 Pragmatic Internal Choices

The architecture does not abstract every internal library.

Abstraction protects meaningful volatility and authority boundaries.

### 49.4 Research Reproducibility

Analytical technology must support environment capture, code versioning, deterministic configuration and artefact retention.

### 49.5 Data and Content Suitability

Technology choices account for structured records, media, full text, vector retrieval, audit, social content and governed analytical workloads without forcing one store to serve every purpose.

## 50. Reference Technology Categories

This document does not mandate final products.

A reference MVP may use:

- a modern accessible web framework;
- a typed backend application framework;
- a relational database;
- managed object storage;
- a durable queue and scheduler;
- a managed identity provider;
- a managed application or container platform;
- infrastructure as code;
- centralised logs, metrics and traces;
- a provider-neutral AI Model Gateway;
- database full-text and optional vector capability;
- and a governed notebook or analytical environment.

### 50.1 Selection Guardrails

The selected stack must support:

- modular packaging;
- transactions and optimistic concurrency;
- safe migrations;
- background jobs;
- structured audit;
- object metadata;
- permission-scoped queries;
- testable provider adapters;
- and reproducible builds.

### 50.2 No Premature Platform Engineering

The MVP does not require a custom internal developer platform, service mesh or enterprise event platform.

## 51. Architecture Decision Records

Material technical decisions use ADRs.

Representative ADRs include:

- modular monolith and module packaging;
- backend language and framework;
- web/PWA strategy;
- transactional database and module schema strategy;
- object and media storage;
- queue and scheduler;
- identity provider;
- deployment platform;
- permission-policy implementation;
- outbox and event dispatch;
- search and vector strategy;
- AI Model Gateway and provider data-use policy;
- Knowledge Platform transport;
- media-processing pipeline;
- Community feed and matching implementation;
- moderation-provider use;
- analytical environment;
- Dataset generation and lock;
- observability and audit;
- backup and disaster recovery.

Each ADR records:

- context;
- decision;
- alternatives;
- rationale;
- consequences;
- security, privacy, accessibility and research implications;
- owner;
- date;
- status;
- and review trigger.

## 52. MVP Technical Scope

### 52.1 Client

The MVP provides Participant responsive web or PWA, Researcher and Coordinator application, Supporter workspace where required, Moderator and Safety workspaces, Administration and a shared ability-adaptive design system.

### 52.2 Backend Modules

The modular monolith implements all M01–M18 logical modules.

The first vertical slice includes identity, ParticipantProfile, Relationship and Consent, ResearchProject and Protocol, intervention delivery, assessment, Safety, evidence, AI, Dataset and Analysis, Life Story, Community, Open Matching, MutualAcceptance, Connection, CommunicationBasis, ConversationThread, Message, Block, Report and ModerationCase.

ConnectionRequest code and endpoints remain feature-disabled.

### 52.3 Runtime

- API process;
- Worker process;
- scheduler;
- relational database;
- object storage;
- durable queue;
- cache;
- observability and audit;
- governed analytical environment;
- optional Search or Vector capability;
- and one M16 communication-adapter boundary.

### 52.4 External Integrations

The MVP uses the Knowledge Platform, one or more AI providers through Model Gateway, one identity provider, at least one communication provider, media processing and structured import or export.

A third-party moderation provider is optional and cannot own final decisions.

### 52.5 Expanded Vertical Slice

```text
ResearchQuestion
        ↓
EvidenceDecision and EvidenceSnapshot
        ↓
ProtocolVersion
        ↓
Consent, Screening and Enrolment
        ↓
InterventionAssignment
        ↓
Life Story and Governed Community
        ↓
Open Matching where Chosen
        ↓
Independent MatchDecision
        ↓
MutualAcceptance
        ↓
Connection
        ↓
ConversationThread under CommunicationBasis
        ↓
Message Draft and SendConfirmation
        ↓
Provider Delivery and Human Interaction
        ↓
Assessment, SafetySignal and Moderation
        ↓
DatasetDefinition and DatasetVersion
        ↓
DatasetLock
        ↓
AnalysisPlan and AnalysisRun
        ↓
InterpretationRecord and ResearchFinding
```

### 52.6 Required Deterministic Controls

Required controls include Consent and withdrawal, permission and ResourceState, Life Story Visibility, Platform Public versus Internet Public, matching opt-in and attribute policy, MatchDecision ownership, MutualAcceptance validity and single use, Connection activation, CommunicationBasis, Thread participants, Message version and SendConfirmation, Block, provider callback authentication and idempotency, moderation authority, Safety transition, DatasetLock and approval.

### 52.7 MVP Technical Non-Goals

The MVP excludes microservices, Kubernetes, multi-region active-active, enterprise streaming, separate databases per module, unrestricted public APIs, Internet Public by default, direct ConnectionRequest experience, group or unrestricted messaging, general Message-body Search or Vector indexing, autonomous MutualAcceptance, Connection or Message send, autonomous high-impact moderation, autonomous SafetyEvent confirmation, autonomous DatasetLock or Finding approval, real-time wearable streaming and federated research infrastructure.

---

## 53. Deferred Technical Capabilities

Deferred capabilities may include:

- independently deployable domain services;
- advanced workflow-orchestration platform;
- streaming event backbone;
- dedicated search cluster;
- dedicated vector database;
- multi-region deployment;
- real-time device ingestion;
- secure research enclave;
- federated identity across institutions;
- advanced external policy engine;
- privacy-preserving distributed analytics;
- cross-Organisation social federation;
- advanced fraud and moderation systems;
- matching-policy simulation;
- Internet Public archival integration;
- advanced digital-legacy processing;
- and autonomous external agents under future governance.

Deferral does not permit the MVP to ignore the domain contracts required for future evolution.

## 54. Evolution Path

### 54.1 Phase 1 — Modular MVP

```text
Responsive Web / PWA
        ↓
M01–M18 Modular Monolith
        ↓
Relational Database
Object Storage
Queue and Workers
Governed Analytical Delivery
```

Focus:

- one complete research vertical slice;
- Life Story, Community and Open Matching;
- deterministic control boundaries;
- audit and lineage;
- and safe Pilot operations.

### 54.2 Phase 2 — Operational Strengthening

Add:

- stronger observability and SLOs;
- automated reconciliation;
- mature moderation and safety operations;
- dedicated analytical workflows;
- expanded adapters;
- improved offline and mobile support;
- and deployment automation.

### 54.3 Phase 3 — Selective Extraction

Extract only demonstrated pressure points.

Potential examples:

- AI Orchestration;
- Knowledge Integration;
- media processing;
- notification delivery;
- device ingestion;
- Dataset and Analysis processing;
- high-volume Community delivery;
- or moderation processing.

### 54.4 Phase 4 — Multi-Site and Federated Research

Potentially support:

- multi-site studies;
- institutional federation;
- distributed or privacy-preserving analytics;
- regional deployment;
- external research enclaves;
- and cross-Organisation governance.

### 54.5 Evolution Invariant

Every phase preserves aggregate ownership, permission, Participant control, evidence provenance, research lineage, safety, moderation separation and human accountability.

## 55. Architecture Risks

### 55.1 Premature Microservices

**Risk:** network complexity, duplicated policy, inconsistent domain logic and operational burden.

**Mitigation:** modular monolith, architecture tests, explicit interfaces and evidence-based extraction.

### 55.2 Module Boundary Erosion

**Risk:** shared tables, cross-module repository access and generic services recreate an unstructured monolith.

**Mitigation:** one write owner, schema and migration ownership, module APIs and dependency tests.

### 55.3 Permission and Consent Fragmentation

**Risk:** inconsistent enforcement across APIs, search, AI, jobs, exports and analytics.

**Mitigation:** shared request context, central policy component, owning-module rules, decision records and invalidation.

### 55.4 Public Visibility Leakage

**Risk:** Platform Public, Internet Public, search, cache or CDN behaviour exposes protected content or prevents revocation.

**Mitigation:** distinct publication paths, scoped identifiers, cache invalidation, takedown tests and explicit consent.

### 55.5 Social and Research Collaboration Collapse

**Risk:** Governed Community, Participant messaging and research-review comments are implemented as one generic collaboration model.

**Mitigation:** M18 social model remains separate from governed research collaboration.

### 55.6 Matching Bias and Hidden Profiling

**Risk:** sensitive or inferred traits, opaque compatibility scores, unfair candidate exposure or block failure.

**Mitigation:** declared features, deterministic filters, versioned policy, explanation, fairness evaluation and MutualAcceptance tests.

### 55.7 Moderation Backlog and Authority Confusion

**Risk:** provider or AI labels become final action, reports are delayed, or moderation is confused with Safety.

**Mitigation:** human-accountable decisions, separate records, queue SLOs, appeal and Safety/Privacy linkage.

### 55.8 AI Context Leakage or Hidden Mutation

**Risk:** unauthorised Life Story, messages, matching, safety or moderation data reach a model, or generated output changes domain state.

**Mitigation:** permission-before-context, typed tools, owning-domain commands, output classification and audit.

### 55.9 AI Provider Coupling

**Risk:** behaviour drift, cost volatility, data-use changes or unavailable models.

**Mitigation:** Model Gateway, configuration versions, provider policy records, evaluation and deterministic fallback.

### 55.10 External Knowledge Dependency

**Risk:** unavailable service, schema changes, stale references or licensing violations.

**Mitigation:** M10 Anti-Corruption Layer, capability discovery, EvidenceSnapshots, cache policy and degraded mode.

### 55.11 Search and Vector Permission Drift

**Risk:** stale indexes reveal withdrawn, blocked, moderated or deleted content.

**Mitigation:** source re-authorisation, invalidation events, reconciliation and index isolation.

### 55.12 Research and Operational Data Mixing

**Risk:** irreproducible analyses and accidental operational write-back.

**Mitigation:** DatasetDefinition, DatasetVersion, DatasetLock, analytical boundary and lineage.

### 55.13 Dataset and Analysis Lineage Drift

**Risk:** code, source, transformations or environment are not reproducible.

**Mitigation:** manifests, checksums, versioned transformations, locked data, AnalysisRun and artefact retention.

### 55.14 Event Payload Overexposure

**Risk:** private content is replicated into logs, queues or consumers.

**Mitigation:** minimum payload, classification, reference-based retrieval and retention controls.

### 55.15 Accessibility as Late Addition

**Risk:** exclusion, redesign and invalid research results.

**Mitigation:** shared adaptive design, accessibility tests, performance budgets and recorded adaptations.

### 55.16 Critical Dependency on AI or Search

**Risk:** Participant cannot block, report, withdraw or receive essential support during outage.

**Mitigation:** deterministic critical paths and explicit supporting-capability degradation.

### 55.17 Status Model Collapse

**Risk:** one generic status mixes lifecycle, review, visibility, quality, moderation and publication.

**Mitigation:** typed state dimensions from Document 8 and schema-level constraints.

## 56. Open Technical Questions

1. Which backend language and framework best support modular boundaries and typed contracts?
2. Should the initial client be responsive web, PWA or hybrid?
3. Which managed deployment platform best balances simplicity, privacy, observability, residency and cost?
4. Which identity provider supports Participants, Organisations, step-up authentication and future federation?
5. How should M01–M18 be grouped into code assemblies?
6. Should module persistence use schemas, table prefixes, roles or a combination?
7. Which queue and scheduler provide durable retries, priorities and delayed work?
8. Which actions require synchronous coordination rather than process-manager eventual consistency?
9. Which Search domains require a dedicated index?
10. Is Vector capability required for the first Life Story and Evidence workflows?
11. How will source re-authorisation work for Search and Vector retrieval?
12. Which media, transcription and translation providers meet requirements?
13. Which Model Gateway approach preserves model, Prompt, Tool and data-use provenance?
14. Which Knowledge Platform capabilities are available?
15. Which matching algorithm supports explanation and fairness?
16. Which matching attributes are allowed and prohibited?
17. What effective period and invalidation rules apply to MutualAcceptance?
18. Does Connection activation require an additional acknowledgement?
19. When may deferred ConnectionRequest be enabled?
20. Which CommunicationBasis types are enabled for Participant messaging?
21. May an authorised Relationship create a Thread without M18 Connection?
22. Are group ConversationThreads deferred?
23. Which Message formats and attachment types are enabled?
24. Are read receipts disabled by default?
25. Which Message states require synchronous transactions?
26. Which provider status maps to Delivered?
27. What timeout produces Delivery Unknown?
28. Which callback authentication and key-rotation mechanism is used?
29. How frequently does delivery reconciliation run?
30. Which queued delivery effects can be cancelled after Block?
31. How will Block invalidation propagate across Search, matching, Threads, Messages, Notifications and AI Context?
32. Is an external moderation provider required?
33. Which Safety and moderation queues need priority workers?
34. Which analytical environment receives locked DatasetVersions?
35. How are code, environment and AnalysisRuns captured reproducibly?
36. Which residency and provider-jurisdiction constraints apply?
37. Which Participant controls remain available offline or during partial outage?
38. Which availability and recovery objectives apply during Pilot hours?
39. Which provider integrations are required for the first vertical slice?
40. Is Internet Public disabled throughout the first Pilot?
41. Which module is the first likely extraction candidate?
42. Which ADRs must be approved before identifiable Participant data are accepted?

---

## 57. Design Decisions

This document establishes that:

1. Document 13 v1.2 is the authoritative source for technical system context, topology and runtime interaction.
2. The MVP uses a modular monolith.
3. M01–M18 remain logical modules with one write owner per aggregate.
4. One deployment unit does not permit unrestricted cross-module access.
5. Cross-module writes use owning-module commands.
6. Direct cross-module table writes are prohibited.
7. The Platform uses a relational transactional system of record.
8. Object and media bytes are separate from owning-domain metadata.
9. Search, Vector, cache and analytical stores are derived.
10. Clients and external systems use governed APIs, events or files.
11. Document 8 v3.2 governs M18 domain meaning.
12. Document 12 v1.2 governs M18 data lineage.
13. Document 15 v1.2 governs interface and event contracts.
14. Permission uses Role, Relationship, Consent, Purpose, Context, SpecificPermission and ResourceState.
15. Visibility, Block, MatchDecision, MutualAcceptance, CommunicationBasis, DataClassification and action risk are additional checks.
16. Consent withdrawal and Block are strongly consistent.
17. Open Matching is opt-in.
18. MatchCandidate is not MatchDecision, MutualAcceptance, Connection or CommunicationBasis.
19. Each MatchDecision is actor-owned.
20. MutualAcceptance is an M18 aggregate.
21. MutualAcceptance validity and single-use are authoritative M18 checks.
22. ConnectionRequest is deferred and feature-disabled.
23. Connection is activated from valid MutualAcceptance.
24. Connection does not create Supporter, care or research authority.
25. CommunicationBasis is required before Thread creation or Message send.
26. ConversationThread is owned by M18.
27. ConversationThread does not broaden the source basis.
28. Message is owned by M18.
29. Message Draft, SendConfirmation, queue, send, provider acceptance, delivery and read are separate.
30. M18 owns canonical Message lifecycle and delivery state.
31. M16 owns provider adapters, callback evidence, mapping, retries and reconciliation.
32. M16 does not own Message content, sender authority, Thread or canonical state.
33. Provider callback is evidence translated through M16.
34. Provider callbacks are authenticated, replay-protected and idempotent.
35. Provider Accepted is not Delivered.
36. Failure or uncertainty does not become Delivered.
37. Message delivery worker never writes M18 tables directly.
38. Message body is excluded from general logs, events, Search, Vector, matching, AI memory and ordinary research.
39. Block is checked before matching, MutualAcceptance, Connection, Thread and send.
40. Block revocation does not restore prior social or messaging state.
41. Notification remains distinct from Message.
42. Domain, Integration, UX Analytics, Operational and Audit Events are distinct.
43. UX interaction does not prove domain success.
44. Material events use an outbox.
45. Consumers are idempotent.
46. Canonical M18 event ordering is explicit.
47. Deprecated aliases are translated, not reused.
48. SafetySignal and SafetyEvent remain separate.
49. ModerationCase and Safety remain separate.
50. AI may Draft and explain but cannot create MutualAcceptance, Connection, Thread or unconfirmed send.
51. All model access passes through M11.
52. Knowledge access passes through M10.
53. Long-running work uses durable jobs.
54. Critical Participant controls do not rely solely on projections.
55. Operational and analytical storage remain separate.
56. DatasetLock is authoritative and immutable.
57. AnalysisRun uses approved AnalysisPlan and locked DatasetVersion.
58. Researchers do not receive production database credentials.
59. Search and Vector results are re-authorised.
60. Critical controls remain available when AI, Search, Knowledge or media processing fail.
61. The MVP uses separate API, Worker and Scheduler processes.
62. Workload isolation protects Consent, Block, Safety, Moderation and Message delivery.
63. Feature flags do not replace Protocol, Intervention, AI, Community, matching or Message policy versions.
64. Research-critical configuration is versioned.
65. Operational telemetry and governance audit are distinct.
66. Production data are not copied to lower environments without approved de-identification.
67. High-risk releases use staged rollout and kill switches.
68. Microservices, Kubernetes, enterprise streaming and active-active are deferred.
69. The MVP includes MutualAcceptance, CommunicationBasis, ConversationThread and Message delivery.
70. Internet Public and direct ConnectionRequest experience are disabled.
71. Version 1.2 completes runtime revalidation against Documents 8 v3.2, 12 v1.2 and 15 v1.2.

---

## 58. Summary

The System Context & Technical Architecture implements the Platform through:

```text
Ability-Adaptive Client Workspaces
        ↓
Permission-Aware API Edge
        ↓
M01–M18 Modular Monolith
        ↓
Relational Transactional Store
Object and Media Storage
Durable Queue and Workers
Search and Optional Vector Retrieval
Audit and Observability
        ↓
Controlled Knowledge, AI, Identity,
Communication, Media and Analytical Adapters
```

The canonical social runtime is:

```text
M18 MatchDecision
        ↓
M18 MutualAcceptance
        ↓
M18 Connection
        ↓
M18 CommunicationBasis
        ↓
M18 ConversationThread
        ↓
M18 Message Draft and SendConfirmation
        ↓
M18 MessageQueued
        ↓
M16 Provider Adapter
        ↓
Authenticated Callback or Reconciliation
        ↓
M18 Canonical Delivery State
```

The central implementation sequence is:

```text
Authenticate Actor
        ↓
Resolve Purpose and Context
        ↓
Evaluate Consent, Permission, Visibility,
Block, CommunicationBasis and Domain Preconditions
        ↓
Execute Owning-Module Command
        ↓
Persist State and Outbox Atomically
        ↓
Process Durable Events and Jobs
        ↓
Translate External Evidence
        ↓
Confirm Exact Domain Result
        ↓
Preserve Audit and Research Lineage
```

The central rule is:

> Use the simplest deployable topology that preserves domain ownership, Participant control, deterministic safeguards, exact communication state, evidence provenance, research reproducibility and accountable human decisions.

Distributed complexity is introduced only when measured product, research, scale, security, resilience or organisational requirements justify it.
