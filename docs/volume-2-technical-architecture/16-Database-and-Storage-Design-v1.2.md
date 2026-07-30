# Document 16 — Database & Storage Design

**Version:** 1.2  
**Status:** Revised Database and Storage Baseline — M18 Formation and Messaging Revalidated  
**Handbook Volume:** Volume II — Technical Architecture  
**Primary System:** Digital Intervention Research Platform  
**Primary Product Modules:** M01–M18  
**Document Owner:** Data Architecture and Database Governance  
**Approved By:** To be assigned  
**Last Updated:** 2026-07-29  
**Supersedes:** Document 16 — Database & Storage Design v1.1  
**Review Trigger:** A material change to aggregate ownership, M01–M18 module boundaries, relational schema strategy, tenancy, Consent or permission storage, Life Story, Community, Open Matching, MatchDecision, MutualAcceptance, ConnectionRequest, Connection, CommunicationBasis, ConversationThread, Message lifecycle or delivery, provider callbacks, Block, moderation, Safety, AI memory, Dataset or Analysis storage, object storage, Search or Vector retrieval, encryption, residency, retention, deletion propagation, research reproducibility, backup, recovery or storage technology

---

## 1. Purpose

This document defines the **Database & Storage Design** of the **Healthy Aging Digital Intervention Research Platform**.

It translates Documents 0–15 into an implementable persistence architecture for:

- operational domain records;
- Participant identity, profile and preferences;
- Relationship, Delegation, Consent and permission evidence;
- Research Projects, Protocol Versions and intervention configuration;
- recruitment, screening and Enrolment;
- intervention delivery, exposure, fidelity and adaptation;
- assessments, observations, outcomes and Safety;
- evidence, Knowledge References and immutable Evidence Snapshots;
- AI Interactions, tool activity, configuration and purpose-bound memory;
- Dataset Definitions, Dataset Versions, Dataset Locks and data quality;
- Analysis Plans, Analysis Runs, outputs, Interpretation Records and Research Findings;
- reports, exports and external submissions;
- Life Story, media, attribution and Legacy Preference;
- Public Profiles, Community content and public visibility;
- Open Matching, Match Candidates, Mutual Acceptance and Connections;
- messages, Block, reports, moderation and appeals;
- governance, audit, integration and operational state;
- object storage, media processing, Search, Vector and cache projections;
- analytical storage and reproducibility packages;
- and retention, deletion, backup and recovery.

The storage design must preserve:

- one accountable write owner per aggregate;
- canonical domain meaning;
- current Consent, purpose, visibility, Block and Resource State;
- authorship and source;
- exact version history;
- immutable approved artefacts;
- research lineage;
- Participant rights;
- and safe, auditable correction.

The central rule is:

> Storage is part of the domain, research and governance architecture. It must preserve not only values, but also who supplied them, who confirmed them, which version was used, what purpose was permitted, and which decision changed the state.

---

## 2. Scope

This document covers:

- logical storage architecture;
- storage technology responsibilities;
- primary relational database design;
- M01–M18 logical schemas and ownership;
- table, column and constraint conventions;
- identifiers and external mappings;
- base metadata and independent state dimensions;
- optimistic concurrency;
- immutable and versioned records;
- temporal history, corrections, supersession and archival;
- transaction boundaries and cross-module references;
- identity, Organisation, role and Service Account storage;
- Participant Profile, Accessibility Profile and Public Profile separation;
- Relationship, Delegation, Consent and Policy Decision storage;
- Research Project, Protocol, recruitment and Enrolment storage;
- intervention portfolio and delivery storage;
- assessment, observation, outcome and Safety storage;
- evidence and Knowledge integration storage;
- AI Interaction, context, tool, memory and incident storage;
- Dataset, data-quality, Analysis and Research Finding storage;
- reporting, export, external submission, governance and audit storage;
- integration, outbox, inbox, job and operation storage;
- Life Story, Community, matching, Connection, messaging and moderation storage;
- object, media, transcript and transformed-object storage;
- Search and Vector projections;
- cache design;
- analytical and research storage;
- lineage, terminology and identifier mapping;
- JSON, normalisation and data-type guidance;
- indexes, constraints, partitions, materialised views and query patterns;
- multi-Organisation and data-residency design;
- row-level security and database roles;
- encryption, tokenisation, masking and pseudonymisation;
- de-identification and re-identification review;
- data quality, missingness, correction and imputation;
- retention, deletion propagation and holds;
- backup, restore, disaster recovery and corruption response;
- migration, import, seed and test-data strategy;
- performance, capacity, cost and observability;
- MVP storage scope;
- deferred capabilities;
- and future evolution.

This document does not define:

- final SQL DDL;
- final ORM classes;
- final database or cloud vendor;
- final cryptographic parameters;
- final production retention schedule;
- final infrastructure-as-code;
- complete query plans;
- final statistical file formats for every study;
- final FHIR resource persistence;
- or complete database and object-store runbooks.

Those artefacts are derived during implementation and remain subordinate to this baseline.

---

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
- Document 13 — System Context & Technical Architecture v1.2
- Document 14 — Security, Privacy & Consent Architecture v1.1
- Document 15 — API, Event & Integration Specifications v1.2

### Provides input to

- Document 17 — AI Orchestration & Model Operations revision
- Document 18 — MVP Scope & Delivery Roadmap revision
- Document 19 — Initial Pilot Research Protocol revision
- Document 20 — UX Flows & Design System Specification revision
- Physical Data Dictionary
- SQL DDL and Migration Repository
- ORM and Repository Mappings
- Object-Storage Configuration
- Search and Vector Index Specifications
- Dataset Manifest Schema
- Analytical Environment Specification
- Backup and Restore Runbooks
- Retention and Deletion Schedule
- Database Access Standard
- Data Migration Plan
- Test Data Strategy
- Capacity and Performance Plan

### Authority Hierarchy

| Subject | Authority |
|---|---|
| Aggregate ownership and state | Document 8 |
| Evidence ownership and snapshots | Document 9 |
| AI records and memory | Document 10 |
| Dataset, Analysis and evaluation lifecycle | Document 11 |
| Data authority, classification and lineage | Document 12 |
| Runtime and deployment placement | Document 13 |
| Security, privacy and Consent controls | Document 14 |
| API, event and integration contracts | Document 15 |
| Physical persistence responsibilities and storage constraints | Document 16 v1.2 |

---

### 3.1 v1.2 Revalidation Result

Version 1.2 revalidates storage against:

- Document 8 v3.2 for M18 aggregate ownership and invariants;
- Document 12 v1.2 for data meaning, minimisation and lineage;
- Document 13 v1.2 for runtime ownership and provider placement; and
- Document 15 v1.2 for resources, commands, events and callback contracts.

The canonical persistence path is:

```text
match_decisions
        ↓
mutual_acceptances
        ↓
connections
        ↓
thread_communication_bases
        ↓
conversation_threads
        ↓
messages and message_versions
        ↓
message_send_confirmations
        ↓
message_delivery_attempts
        ↓
M16 provider_callback_records
        ↓
M18 canonical delivery-state transition
```

`connection_requests` remain present only for a deferred, feature-disabled alternative formation path.

---

## 4. Storage Architecture Objectives

### 4.1 Domain Integrity

Every aggregate is persisted by one owning module with enforceable invariants.

### 4.2 Research Reproducibility

Approved Protocol, intervention, Dataset, Analysis and Finding states remain reconstructable from exact versions and retained artefacts.

### 4.3 Participant Protection

Sensitive data remain classified, purpose-limited, permission-scoped, encrypted where required and removable from future use according to current authority.

### 4.4 Participant Control

Life Story, visibility, sharing, matching, Connection, messaging, AI memory, export and withdrawal are persisted as explicit choices rather than inferred settings.

### 4.5 Version Preservation

Material approved, confirmed or locked records are not silently overwritten.

### 4.6 Provenance

Source, actor, transformation, confirmation, uncertainty and external authority remain traceable.

### 4.7 Strong Critical Consistency

Consent withdrawal, Block, Mutual Acceptance, Connection activation, Safety disposition, Dataset Lock and approval use strongly consistent authoritative storage.

### 4.8 Operational Simplicity

The MVP uses a small, mature storage set with clear responsibilities.

### 4.9 Analytical Separation

Operational transactions, derived projections and analytical workloads remain separated.

### 4.10 Recoverability

Database, objects, audit and research artefacts can be restored and reconciled.

### 4.11 Safe Evolution

Logical boundaries support future service extraction without premature database proliferation.

---

## 5. Storage Design Principles

1. Relational system of record.
2. M01–M18 module-owned schemas.
3. One accountable write owner.
4. Shared physical database with logical isolation for the MVP.
5. Strong consistency for critical authority transitions.
6. Append or version material history.
7. Immutable approved and locked artefacts.
8. Metadata in relational storage; large content in object storage.
9. Derived indexes and embeddings are rebuildable.
10. Operational and analytical data remain distinct.
11. Current permission is never inferred from a stale projection.
12. Public visibility does not change Data Classification automatically.
13. Connection does not replace Relationship.
14. Block is authoritative.
15. MatchCandidate is not Connection.
16. SafetySignal is not SafetyEvent.
17. AnalysisOutput is not ResearchFinding.
18. AI memory is not Participant Profile or Life Story.
19. Corrections preserve the original record.
20. Deletion and withdrawal propagate to derived stores.
21. JSON is selective, versioned and validated.
22. Database constraints reinforce domain invariants.
23. Direct database access is exceptional.
24. Storage engines are introduced only for demonstrated needs.
25. Storage design remains accessible to governance and audit.

---

## 6. Logical Storage Architecture

```text
M01–M18 Application and Domain Modules
        ↓
Primary Relational Database
        ├── Module-Owned Schemas and Tables
        ├── Constraints and Version History
        ├── Permission, Consent and Resource-State Records
        ├── Audit, Outbox, Inbox and Operations
        └── Object and Derived-Store Metadata
        │
        ├── Object and Media Storage
        ├── Durable Queue
        ├── Cache
        ├── Search Index
        ├── Optional Vector Index
        ├── Governed Analytical Store
        └── Backup and Archive
```

The relational database remains authoritative for operational state.

Object, Search, Vector, cache and analytical stores do not acquire aggregate ownership.

---

## 7. Storage Technology Responsibilities

| Store | Responsibility | Not Authoritative For |
|---|---|---|
| Relational database | operational aggregates, versions, permissions, lineage, audit metadata | binary media content |
| Object storage | files, media, transcripts, reports, Dataset and Analysis artefacts | domain state or visibility |
| Durable queue | jobs and asynchronous delivery | completed business outcome |
| Cache | bounded performance acceleration | Consent, Block or Resource State |
| Search index | derived discovery projection | source truth or access authority |
| Vector index | derived semantic retrieval | identity, permission or matching decision |
| Analytical store | governed Dataset and Analysis workloads | operational mutation |
| Backup/archive | recovery and retention | current operational visibility |

---

## 8. Primary Relational Database

### 8.1 Reference Choice

A mature relational engine such as PostgreSQL is the reference choice.

This is an architectural recommendation rather than a final vendor mandate.

### 8.2 Required Capabilities

The database should support:

- ACID transactions;
- foreign keys;
- unique, check and exclusion constraints;
- partial and expression indexes;
- JSON with schema validation support;
- full-text search;
- row-level security options;
- encryption integration;
- partitioning;
- logical replication or change capture where needed;
- point-in-time recovery;
- mature migration tooling;
- and operational observability.

### 8.3 Managed Service Preference

A managed database is preferred where it provides:

- high availability;
- backup;
- encryption;
- patching;
- monitoring;
- and recovery

without removing auditability or data-residency control.

### 8.4 No Direct Client Access

Clients, AI providers, notebooks and external systems never connect directly to the transactional database.

### 8.5 Analytical Access

Research analysis receives governed Dataset Versions through M12 rather than production credentials.

---

## 9. M01–M18 Logical Schema Map

| Module | Logical Schema | Principal Aggregate Ownership |
|---|---|---|
| M01 | `identity_org` | UserAccount, Organisation, OrganisationMembership, RoleAssignment, ServiceAccount |
| M02 | `participant_profile` | ParticipantProfile, AccessibilityProfile, ParticipantPreference |
| M03 | `consent_permission` | Relationship, Delegation, Consent, PolicyDecision |
| M04 | `research_design` | ResearchProject, ResearchQuestion, Protocol, ProtocolVersion |
| M05 | `enrolment` | ScreeningRecord, EligibilityDecision, Enrolment |
| M06 | `intervention_portfolio` | Intervention, InterventionVersion, InterventionConfiguration, InterventionDecision |
| M07 | `intervention_delivery` | InterventionAssignment, InterventionSession, ExposureRecord, FidelityRecord |
| M08 | `assessment_outcome` | AssessmentSchedule, AssessmentRecord, Observation, OutcomeRecord |
| M09 | `safety` | SafetySignal, SafetyEvent, SafetyAction |
| M10 | `evidence` | KnowledgeReference, EvidenceReview, EvidenceDecision, EvidenceSnapshot, ResearchKnowledgeGap, ReferenceChangeAlert |
| M11 | `ai_companion` | AIConversation, AIInteraction, AIInterventionConfiguration, AIMemoryItem |
| M12 | `dataset_quality` | DatasetDefinition, DatasetVersion, DataQualityIssue, TransformationRun |
| M13 | `analysis_finding` | AnalysisPlan, AnalysisRun, InterpretationRecord, ResearchFinding |
| M14 | `reporting_submission` | Report, ReportVersion, ExportRequest, EvidencePackage, ExternalSubmission |
| M15 | `governance_audit` | ApprovalRecord, GovernanceReview, ConflictOfInterestRecord, AuditEvent |
| M16 | `integration_ops` | IntegrationRecord, ExternalSystemReference, IdentifierMapping, Operation, provider callback and reconciliation records |
| M17 | `life_story` | LifeStoryArchive, LifeStoryItem, LifeStoryContribution, LifeStoryExport, LegacyPreference |
| M18 | `community_social` | PublicProfile, CommunitySpace, CommunityMembership, SocialPost, MatchPreference, MatchCandidate, MutualAcceptance, Connection, ConversationThread, Message, BlockRecord, ModerationCase; ConnectionRequest deferred |

Technical schemas may additionally include:

- `storage_ops`;
- `search_projection`;
- `analytics_stage`;
- and `migration_admin`.

These schemas own technical records only and do not own domain aggregates.

M16 provider records may reference M18 Message and DeliveryAttempt identifiers but cannot update M18 tables directly.

---

## 10. Schema Ownership and Access

### 10.1 Write Boundary

Only the owning module's repository or approved stored operation may write an aggregate's tables.

### 10.2 Migration Boundary

Every table and migration has one module owner.

### 10.3 Read Boundary

Cross-module reads use:

- owning-module query interfaces;
- approved read-only views;
- explicit foreign-key references;
- or governed analytical extraction.

### 10.4 Database Roles

Database roles should separate:

- migration owner;
- application runtime;
- worker runtime;
- read-only projection builder;
- analytical loader;
- auditor;
- and emergency administrator.

### 10.5 No Shared Generic Repository

A generic repository must not allow arbitrary tables to be updated across modules.

### 10.6 Architecture Tests

CI should verify schema ownership, forbidden write dependencies and migration placement.

---

## 11. Naming Conventions

### 11.1 Tables

Use lower-case `snake_case`.

Representative examples:

```text
protocol_versions
life_story_items
match_candidates
dataset_versions
moderation_cases
```

### 11.2 Primary Keys

Use `id` as the canonical primary key.

### 11.3 Foreign Keys

Use explicit names:

```text
research_project_id
participant_id
protocol_version_id
source_life_story_item_id
```

### 11.4 Timestamps

Use:

```text
created_at
updated_at
effective_from
effective_to
approved_at
withdrawn_at
deleted_at
```

### 11.5 Actors

Use fields such as:

```text
created_by_actor_id
updated_by_actor_id
approved_by_actor_id
confirmed_by_participant_id
```

when the distinction matters.

### 11.6 Versions

Use distinct fields:

```text
record_version
version_number
schema_version
configuration_version
source_version
```

### 11.7 Boolean Naming

Booleans use positive, unambiguous names such as:

```text
is_active
is_current
requires_review
```

where a boolean is sufficient.

Material domain state should use typed state fields instead of many overlapping booleans.

---

## 12. Identifier Design

### 12.1 Canonical IDs

Canonical IDs are:

- opaque;
- stable;
- globally unique in Platform scope;
- non-semantic;
- and independent of mutable attributes.

### 12.2 Recommended Format

UUID, UUIDv7 or another sortable globally unique identifier may be used.

### 12.3 Human Codes

Human-readable study, Participant or case codes remain separate and may be scoped to an Organisation or Research Project.

### 12.4 Public IDs

PublicProfile, public content and external links may use separate public identifiers to reduce correlation with internal records.

### 12.5 External IDs

External identifiers are stored in M16 mappings and never used as primary keys.

### 12.6 Pair Keys

Pair relationships such as Connection and Block may use canonical ordered or directional pair keys to support uniqueness.

### 12.7 No Semantic Keys

Email, name, device serial, provider subject and registry code are not primary keys.

---

## 13. Base Record Metadata

Material records should include applicable metadata:

- ID;
- aggregate or parent ID;
- Organisation;
- Research Project;
- Participant;
- record version;
- schema version;
- created and updated time;
- creator and updater;
- source;
- purpose;
- Data Classification;
- Resource State;
- lifecycle, review and approval states;
- visibility where applicable;
- effective period;
- superseded reference;
- retention class;
- legal or research hold;
- correlation and trace;
- and deletion or archival marker.

Not every field belongs in every table.

Shared metadata must not collapse distinct domain meanings.

---

## 14. Independent State Dimensions

The database must not use one generic `status` for unrelated dimensions.

Separate columns or child tables represent applicable:

- lifecycle state;
- operational phase;
- review state;
- approval state;
- Visibility;
- quality state;
- Safety state;
- moderation state;
- publication state;
- retention state;
- external resolution state;
- MutualAcceptance validity and usage;
- Connection state;
- ConversationThread state;
- Message lifecycle state;
- SendConfirmation state;
- and Message delivery state.

Representative M18 values:

```text
mutual_acceptance_state = 'Active'
mutual_acceptance_usage = 'Unused'

connection_state = 'Active'

thread_state = 'Active'
communication_basis_state = 'Effective'

message_lifecycle_state = 'Draft'
send_confirmation_state = 'Not Confirmed'
message_delivery_state = 'Not Submitted'
```

Each state field has allowed values, transition owner, effective time and history where material.

Database checks prevent invalid combinations such as:

- Message lifecycle `Draft` with delivery state other than `Not Submitted`;
- Message delivery `Delivered` without a valid DeliveryAttempt;
- Active Connection without a source MutualAcceptance;
- active Thread without an effective CommunicationBasis;
- or consumed MutualAcceptance without a linked Connection.

---

## 15. Optimistic Concurrency

### 15.1 Record Version

Mutable aggregate roots use an integer `record_version`.

### 15.2 Update Condition

Updates include the expected version.

### 15.3 Conflict

A mismatched version aborts the transaction and returns a version conflict.

### 15.4 Governed Records

Concurrency protection is mandatory for:

- Consent;
- Relationship and Delegation;
- Protocol and Intervention configuration;
- Life Story visibility;
- Match Preference and Match Decision;
- Connection;
- Block;
- Moderation Decision;
- Safety Signal and Event;
- Dataset Version;
- Interpretation;
- Research Finding;
- and export approval.

### 15.5 No Last-Write-Wins Authority

Independent decisions such as the two sides of Mutual Acceptance are stored separately rather than merged through last-write-wins.

---

## 16. Temporal and Versioned Records

### 16.1 Stable Root and Version

Stable concepts and immutable versions use separate tables.

Examples:

```text
protocols
protocol_versions

interventions
intervention_versions

ai_intervention_configurations
ai_intervention_configuration_versions
```

### 16.2 Version Fields

A version record includes:

- root ID;
- version number;
- predecessor;
- effective period;
- state;
- content hash;
- schema version;
- created by;
- approved by;
- and supersession.

### 16.3 Current Pointer

A root may reference the current active version for efficient lookup.

The pointer is not the historical authority.

### 16.4 Bitemporal Need

Valid-time and system-time may be used where corrections, delayed imports or regulatory history require both.

The MVP should use explicit effective periods and append-only history before adopting a universal bitemporal engine.

### 16.5 Snapshot

A canonical serialised snapshot may accompany structured tables for exact reconstruction, but it does not replace relational constraints.

---

## 17. Immutable Approved and Locked Records

The following are immutable after applicable approval, confirmation or lock:

- approved ProtocolVersion;
- approved InterventionVersion;
- approved AIInterventionConfigurationVersion;
- approved EvidenceDecision version;
- EvidenceSnapshot;
- Participant-confirmed LifeStoryItemVersion where testimony preservation requires it;
- ModerationDecision;
- Safety Event decision history;
- DatasetLock;
- locked DatasetVersion content and manifest;
- approved AnalysisPlan;
- completed AnalysisRun input definition;
- approved InterpretationRecord version;
- approved ResearchFinding version;
- approved ReportVersion;
- and completed ExternalSubmission record.

Immutability is reinforced through:

- application command restrictions;
- database permissions;
- check constraints;
- restricted update paths;
- append-only version tables;
- content hashes;
- and audit.

Correction creates a new version, correction record, supersession or explicit withdrawal.

---

## 18. Soft Deletion, Tombstones and Archival

### 18.1 Soft Deletion

Soft deletion may preserve operational referential integrity.

### 18.2 Tombstone

A tombstone preserves:

- identifier;
- deletion time;
- reason class;
- authority;
- propagation state;
- and minimum lineage

without retaining unnecessary content.

### 18.3 Archival

Archival means inactive historical retention, not physical deletion.

### 18.4 Default Query Behaviour

Ordinary queries exclude deleted, withdrawn, expired or archived records unless the purpose permits them.

### 18.5 Hard Deletion

Hard deletion is allowed when:

- retention permits;
- no hold applies;
- referential impact is resolved;
- derived copies are identified;
- and audit evidence remains sufficient.

### 18.6 Public Takedown

Public delivery may stop immediately while backend retention or deletion workflow continues.

---

## 19. Cross-Module References and Foreign Keys

### 19.1 Local Foreign Keys

Strong foreign keys are used within a module.

### 19.2 Cross-Schema Foreign Keys

Cross-schema foreign keys may be used selectively in the modular monolith for stable identity and referential integrity.

### 19.3 No Cross-Owner Cascade

Cross-module delete or update cascade is prohibited where it would mutate another module's aggregate.

### 19.4 Reference Record

Where extraction or loose coupling is needed, store:

- target type;
- target ID;
- expected source version;
- source module;
- and resolution state.

### 19.5 Historical Reference

Approved artefacts reference exact versions rather than only current roots.

### 19.6 External Reference

External resources use M16 IdentifierMapping or ExternalSystemReference.

---

## 20. Transaction Boundaries

### 20.1 Single Aggregate

A transaction normally changes one aggregate.

### 20.2 Owning Module

A module may use a transaction across multiple owned records where a documented invariant requires it.

### 20.3 Strongly Consistent Critical Cases

Strong consistency is required for:

- Consent withdrawal and current effective state;
- Block creation and communication restriction;
- Match Decision and Mutual Acceptance evaluation;
- Connection activation;
- message communication-basis validation at send;
- Protocol activation;
- Dataset Lock;
- Safety Signal disposition;
- approval decision;
- and idempotent command result.

### 20.4 Cross-Module Workflow

Cross-module work uses commands, outbox events and persisted process state.

### 20.5 No Distributed Transaction Requirement

The MVP does not require distributed transactions.

### 20.6 Compensating Action

Compensation is explicit and never deletes historical decision evidence silently.

---

## 21. M01 Identity and Organisation Schema

Representative tables:

- `user_accounts`
- `external_identities`
- `organisations`
- `organisation_memberships`
- `role_definitions`
- `role_assignments`
- `service_accounts`
- `service_account_scopes`
- `sessions`
- `authentication_events`
- `recovery_requests`
- `account_restrictions`
- `account_state_history`

### 21.1 User Account

Stores stable Platform identity and lifecycle without making email or provider subject the primary key.

### 21.2 External Identity

Maps identity-provider issuer and subject to a UserAccount.

A unique constraint applies to issuer and subject.

### 21.3 Organisation Membership

Stores Organisation, user, role eligibility, effective period and state.

### 21.4 Role Assignment

Stores role, scope, assigner, approval, start, expiry and revocation.

### 21.5 Service Account

Stores non-secret metadata only.

Credentials remain in managed secrets infrastructure.

### 21.6 Session

Session records store opaque token references or revocation metadata, not reusable plaintext credentials.

---

## 22. M02 Participant Profile and Preference Schema

Representative tables:

- `participant_profiles`
- `participant_profile_fields`
- `participant_field_sources`
- `accessibility_profiles`
- `accessibility_preferences`
- `participant_preferences`
- `communication_preferences`
- `participant_contacts`
- `participant_addresses`
- `participant_external_identifiers`
- `profile_correction_requests`
- `profile_state_history`

### 22.1 Minimal Root

ParticipantProfile stores the minimum canonical Participant identity required by the Platform.

### 22.2 Field Source

Sensitive or material fields preserve:

- source;
- source actor;
- verification;
- effective time;
- confidence where inferred;
- and correction state.

### 22.3 Accessibility

Accessibility preferences remain separate from decision-making capacity and do not create hidden scores.

### 22.4 Sensitive Separation

Contact, address and identity-linkage data may use separate tables, encryption and access roles.

### 22.5 Public Profile Boundary

PublicProfile is not stored in M02.

M18 owns explicit public-profile projection choices.

### 22.6 AI Memory Boundary

AIMemoryItem is not copied into ParticipantProfile without a separately authorised profile update.

---

## 23. M03 Relationship and Delegation Schema

Representative tables:

- `relationships`
- `relationship_parties`
- `relationship_scope_items`
- `relationship_verifications`
- `relationship_state_history`
- `delegations`
- `delegation_scope_items`
- `delegation_verifications`
- `supported_decision_records`
- `substitute_authority_records`
- `authority_review_records`

### 23.1 Direction

Relationship is directional where permissions differ by direction.

### 23.2 Active Uniqueness

A partial unique constraint may prevent duplicate active relationships of the same type and scope.

### 23.3 Relationship Is Not Permission

The Relationship row does not contain a broad boolean such as `can_access_all`.

Specific permissions and Consent remain separate.

### 23.4 Supported Decision

A supported-decision record preserves:

- Participant;
- helper;
- information presented;
- type of assistance;
- whose decision was recorded;
- and attribution.

### 23.5 Substitute Authority

Substitute authority stores verified basis, scope, effective time, reviewer and limitations.

### 23.6 Connection Boundary

Connection is stored in M18. Connection does not satisfy a foreign key intended for Supporter authority.

---

## 24. M03 Consent Schema

Representative tables:

- `consent_forms`
- `consent_form_versions`
- `consents`
- `consent_scope_definitions`
- `consent_decisions`
- `consent_conditions`
- `consent_restrictions`
- `consent_presentations`
- `consent_assistance_records`
- `consent_authority_records`
- `consent_evidence_objects`
- `consent_withdrawals`
- `consent_supersessions`
- `consent_state_history`

### 24.1 Consent Root

Consent references:

- Participant;
- exact form version;
- purpose;
- effective period;
- authority basis;
- and lifecycle state.

### 24.2 Granular Scope

Scope rows separately represent choices for:

- research participation;
- intervention;
- assessment;
- AI interaction and memory;
- Life Story;
- public visibility;
- Community;
- Open Matching;
- messaging;
- device data;
- research use;
- secondary use;
- export;
- AI training;
- and Legacy Preference.

### 24.3 Append-Only Decision History

Grant, denial, restriction, expiry, withdrawal and supersession are append-recorded.

### 24.4 Effective Consent Projection

A materialised or cached effective-consent projection may improve reads.

The authoritative result is computed from current decision, restriction, time, purpose and withdrawal records.

### 24.5 Withdrawal Constraint

A withdrawal record cannot be removed through ordinary application access.

### 24.6 Evidence

Signature, recording or document evidence is stored in object storage with protected metadata.

---

## 25. M03 Policy Decision Storage

Representative tables:

- `policy_decisions`
- `policy_decision_inputs`
- `policy_decision_conditions`
- `policy_versions`
- `policy_cache_invalidations`

A material PolicyDecision may preserve:

- actor and role;
- Organisation and Research Project;
- Relationship;
- Consent version;
- purpose;
- Specific Permission;
- Resource State;
- visibility;
- Block;
- Mutual Acceptance;
- Data Classification;
- action risk;
- result;
- condition;
- reason code;
- policy version;
- freshness;
- and trace.

PolicyDecision storage supports audit and diagnosis.

It does not become the authoritative owner of Consent, Block or another domain fact.

High-freshness invalidation is required for Consent withdrawal, role change, Relationship revocation, Block, visibility reduction and account restriction.

---

## 26. M04 Research Project and Protocol Schema

Representative tables:

- `research_projects`
- `research_project_members`
- `research_project_phase_history`
- `research_questions`
- `research_objectives`
- `hypotheses`
- `protocols`
- `protocol_versions`
- `protocol_sections`
- `protocol_eligibility_criteria`
- `protocol_safety_rules`
- `protocol_community_rules`
- `protocol_matching_rules`
- `protocol_dataset_references`
- `protocol_approvals`
- `protocol_amendments`
- `protocol_snapshots`

### 26.1 Research Project

Lifecycle and operational phase are stored separately.

### 26.2 Protocol Root and Version

ProtocolVersion stores immutable version-specific content.

### 26.3 Exact References

A ProtocolVersion references exact:

- EvidenceDecision;
- EvidenceSnapshot;
- InterventionVersion;
- InterventionConfiguration;
- AIInterventionConfigurationVersion;
- Measurement Version;
- DatasetDefinition;
- safety rule;
- Community rule;
- matching policy;
- and approval.

### 26.4 Snapshot

A canonical snapshot and content hash support exact reconstruction.

### 26.5 Amendment

Amendment creates a new version and explicit lineage to the prior version.

---

## 27. M05 Recruitment, Screening and Enrolment Schema

Representative tables:

- `recruitment_campaigns`
- `recruitment_invitations`
- `screening_records`
- `screening_responses`
- `eligibility_decisions`
- `eligibility_criterion_results`
- `enrolments`
- `enrolment_state_history`
- `withdrawal_records`
- `discontinuation_records`
- `follow_up_status`

### 27.1 Screening

Screening records preserve ProtocolVersion, source, assistance and completion state.

### 27.2 Eligibility

EligibilityDecision preserves each criterion, source fact, reviewer, decision and reason.

### 27.3 Enrolment

Enrolment links:

- Participant;
- ResearchProject;
- ProtocolVersion;
- applicable Consent;
- cohort or arm;
- and lifecycle state.

### 27.4 No Silent Reassignment

Cohort, arm or Protocol changes preserve history.

### 27.5 Withdrawal

Research withdrawal is distinct from account closure, intervention pause, Community departure and matching pause.

---

## 28. M06 Intervention Portfolio Schema

Representative tables:

- `interventions`
- `intervention_versions`
- `intervention_components`
- `intervention_mechanism_references`
- `intervention_outcome_references`
- `intervention_safeguards`
- `intervention_adaptation_rules`
- `intervention_configurations`
- `intervention_configuration_items`
- `intervention_decisions`
- `intervention_version_approvals`
- `intervention_snapshots`

### 28.1 Stable Root

Intervention stores identity, title, purpose and maturity.

### 28.2 Immutable Version

InterventionVersion stores exact component and rule configuration.

### 28.3 Configuration

InterventionConfiguration binds a version to a Research Project or deployment context.

### 28.4 Social Components

Life Story, Community, matching and messaging settings remain explicit configuration references rather than untyped JSON flags.

### 28.5 Decision

InterventionDecision records outcome, rationale, evidence, limitations, exact versions and authority.

---

## 29. M07 Intervention Delivery Schema

Representative tables:

- `intervention_assignments`
- `assignment_state_history`
- `intervention_sessions`
- `session_state_history`
- `session_components`
- `exposure_records`
- `exposure_state_history`
- `fidelity_records`
- `adaptation_records`
- `delivery_deviations`
- `delivery_failures`
- `delivery_support_records`

### 29.1 Assignment

Assignment references exact Enrolment, ProtocolVersion, InterventionVersion, configuration and AI configuration.

### 29.2 Session

Planned and actual time are separate.

### 29.3 Exposure

Exposure uses explicit state such as:

- Offered;
- Viewed;
- Started;
- Partially Received;
- Completed;
- Skipped;
- Declined;
- Failed;
- Interrupted.

### 29.4 Assignment Is Not Exposure

No constraint or query may infer completion from assignment alone.

### 29.5 Adaptation

Adaptation records source, allowed rule, reason, change, confirmation and fidelity effect.

---

## 30. M08 Assessment Schema

Representative tables:

- `measurement_definitions`
- `measurement_versions`
- `assessment_schedules`
- `assessment_records`
- `assessment_response_items`
- `assessment_response_sources`
- `assessment_assistance_records`
- `assessment_scores`
- `assessment_score_calculations`
- `assessment_invalidations`
- `assessment_state_history`

### 30.1 Measurement Version

Every AssessmentRecord references an immutable MeasurementVersion.

### 30.2 Response Model

Typed response tables are preferred for known data types.

Validated JSON may support instrument-specific structures.

### 30.3 Assistance

Assistance preserves helper, method, Participant attribution and effect on administration.

### 30.4 Score

Scores preserve algorithm, version, inputs, missingness and calculation time.

### 30.5 Invalidation

Invalidation preserves original response and replacement reference.

---

## 31. M08 Observation and Outcome Schema

Representative tables:

- `observations`
- `observation_sources`
- `observation_corrections`
- `outcome_records`
- `outcome_values`
- `outcome_quality_flags`
- `outcome_derivations`
- `timepoints`

### 31.1 Observation

Observation preserves:

- epistemic type;
- author or source;
- subject;
- time;
- structured value;
- narrative;
- provenance;
- and sensitivity.

### 31.2 Fact and Interpretation

Observed data and human interpretation are stored separately where possible.

### 31.3 Outcome

OutcomeRecord references definition, measure, timepoint, value, unit, source, transformation and quality.

### 31.4 No Social Shortcut

Social Posts, Connections, messages or AI conversation do not automatically create OutcomeRecords.

---

## 32. M09 Safety Schema

Representative tables:

- `safety_signals`
- `safety_signal_sources`
- `safety_signal_triage`
- `safety_signal_state_history`
- `safety_events`
- `safety_event_relationships`
- `safety_actions`
- `safety_action_assignments`
- `safety_reviews`
- `safety_event_state_history`
- `stopping_rule_evaluations`
- `safety_access_audit`

### 32.1 Safety Signal

SafetySignal stores a potential concern and source.

### 32.2 Human Triage

Triage stores authorised reviewer, disposition, reason and time.

### 32.3 Safety Event

SafetyEvent exists only after confirmed conversion.

A foreign key may reference the originating SafetySignal.

### 32.4 Signal Closure

A signal closed as not an event remains retained according to policy.

### 32.5 Restricted Storage

Safety details may use separate encrypted fields and database roles.

### 32.6 No Automated Event Confirmation

No automated process has database permission to insert a confirmed SafetyEvent without the authorised command path.

---

## 33. M10 Evidence and Knowledge Schema

Representative tables:

- `knowledge_references`
- `knowledge_reference_versions`
- `evidence_searches`
- `evidence_search_results`
- `evidence_reviews`
- `evidence_review_items`
- `evidence_decisions`
- `evidence_decision_versions`
- `evidence_snapshots`
- `evidence_snapshot_items`
- `research_knowledge_gaps`
- `knowledge_gap_references`
- `reference_change_alerts`
- `knowledge_licence_constraints`

### 33.1 Knowledge Reference

Stores external system, canonical external identifier, version, provenance, verification, licensing and freshness.

### 33.2 Evidence Review

Stores query, inclusion, appraisal, applicability and reviewer state.

### 33.3 Evidence Decision

Stores Platform-owned decision outcome and limitations.

### 33.4 Evidence Snapshot

EvidenceSnapshot is an immutable entity with content hash and exact item versions.

### 33.5 External Change

ReferenceChangeAlert does not modify approved dependent artefacts.

### 33.6 No Generic Repository

Evidence, datasets and findings are not stored in a generic ResearchRepository table.

---

## 34. M11 AI Companion Schema

Representative tables:

- `ai_conversations`
- `ai_interactions`
- `ai_interaction_inputs`
- `ai_context_references`
- `ai_retrieval_records`
- `ai_output_records`
- `ai_output_classifications`
- `ai_tool_invocations`
- `ai_tool_results`
- `ai_action_proposals`
- `ai_confirmations`
- `ai_human_reviews`
- `ai_model_references`
- `ai_instruction_versions`
- `ai_intervention_configurations`
- `ai_intervention_configuration_versions`
- `ai_memory_items`
- `ai_memory_sources`
- `ai_memory_restrictions`
- `ai_evaluations`
- `ai_incidents`
- `ai_safety_signal_links`

### 34.1 AIInteraction

AIInteraction is the primary traceability unit.

### 34.2 Context Reference

Context stores protected source references, version, classification, purpose and inclusion reason.

### 34.3 Output Dimensions

Separate fields or child records represent:

- Epistemic Type;
- Artefact Type;
- Review Status;
- Approval Status;
- Safety Classification;
- Grounding Status;
- and Action Status.

### 34.4 Tool Invocation

Tool records preserve exact tool version, owning module, permission result, input reference, confirmation, result and side effect.

### 34.5 Provider Payload

Full prompt and response retention is purpose-specific.

Secure references and structured metadata are preferred over broad content retention.

### 34.6 AI Memory

AIMemoryItem is purpose-bound and separate from ParticipantProfile, LifeStoryArchive, MatchPreference, Message and research records.

### 34.7 No Direct Foreign Mutation

AI schema tables never substitute for the owning aggregate changed through a confirmed tool command.

---

## 35. M12 Dataset and Data Quality Schema

Representative tables:

- `dataset_definitions`
- `dataset_definition_versions`
- `dataset_variables`
- `dataset_source_rules`
- `dataset_inclusion_rules`
- `dataset_exclusion_rules`
- `dataset_transformation_specs`
- `dataset_versions`
- `dataset_version_sources`
- `dataset_version_files`
- `dataset_manifests`
- `dataset_variable_dictionaries`
- `dataset_locks`
- `dataset_access_grants`
- `data_quality_issues`
- `data_quality_issue_history`
- `data_quality_reviews`
- `transformation_runs`
- `deidentification_records`

### 35.1 Dataset Definition

DatasetDefinition records intended variables, sources, filters, transformations, missingness, de-identification, Consent and purpose rules.

### 35.2 Dataset Version

DatasetVersion records a generated immutable candidate dataset and exact source lineage.

### 35.3 Dataset Lock

DatasetLock is a governed entity within DatasetVersion and records:

- lock time;
- authoriser;
- approval;
- manifest hash;
- content hash;
- quality review;
- de-identification;
- and compatible AnalysisPlan.

### 35.4 Lock Constraint

Only one active lock may apply to a DatasetVersion.

A locked version cannot accept new source rows or transformed files.

### 35.5 Immutable Locked Version

A locked DatasetVersion is immutable.

Correction generates a new DatasetVersion.

### 35.6 Data Quality

Quality issues preserve original value, issue type, severity, owner, action and resolution.

---

## 36. M13 Analysis, Interpretation and Finding Schema

Representative tables:

- `analysis_plans`
- `analysis_plan_versions`
- `analysis_plan_approvals`
- `analysis_runs`
- `analysis_run_inputs`
- `analysis_run_parameters`
- `analysis_outputs`
- `analysis_diagnostics`
- `analysis_code_references`
- `analysis_environment_records`
- `interpretation_records`
- `interpretation_versions`
- `interpretation_approvals`
- `research_findings`
- `research_finding_versions`
- `research_finding_approvals`
- `finding_evidence_links`
- `finding_limitations`

### 36.1 Analysis Plan

An approved AnalysisPlan references a locked DatasetVersion and planned methods.

### 36.2 Analysis Run

AnalysisRun records exact:

- plan version;
- dataset lock;
- code commit;
- environment;
- packages;
- parameters;
- seed;
- executor;
- time;
- and result.

### 36.3 Analysis Output

AnalysisOutput may reference relational summary tables or object artefacts.

It is not an InterpretationRecord or ResearchFinding.

### 36.4 Interpretation

InterpretationRecord stores human interpretation, uncertainty, alternatives and limitations.

### 36.5 Research Finding

ResearchFinding stores the human-governed claim and exact supporting Interpretation and evidence.

### 36.6 External State

External submission and publication state remain in M14.

---

## 37. M14 Reporting and External Submission Schema

Representative tables:

- `reports`
- `report_versions`
- `report_sections`
- `report_templates`
- `report_generation_runs`
- `export_requests`
- `export_request_sources`
- `export_approvals`
- `export_packages`
- `export_files`
- `export_deliveries`
- `evidence_packages`
- `evidence_package_items`
- `external_submissions`
- `external_submission_attempts`
- `external_submission_responses`
- `external_publication_references`

### 37.1 Report Version

Approved ReportVersion is immutable.

### 37.2 Export

Export stores purpose, recipient, exact sources, restrictions, de-identification, manifest and delivery state.

### 37.3 Delivery State

Generated, delivered and received are distinct.

### 37.4 External Submission

Submission state does not change ResearchFinding state automatically.

### 37.5 Participant Export

Participant portability includes only permitted records and preserves third-party restrictions.

---

## 38. M15 Governance and Audit Schema

Representative tables:

- `approval_records`
- `approval_conditions`
- `approval_state_history`
- `governance_reviews`
- `governance_review_assignments`
- `conflict_of_interest_records`
- `privacy_reviews`
- `security_reviews`
- `audit_events`
- `audit_event_targets`
- `audit_access_records`
- `break_glass_records`
- `governance_holds`

### 38.1 Approval Record

Approval references one exact artefact type, ID and version.

### 38.2 Separation of Duties

Approval stores reviewer authority, conflict-of-interest result and authentication strength.

### 38.3 Audit

Audit is append-only or equivalently tamper-evident.

### 38.4 Sensitive Content

Audit records references and safe metadata instead of copying private Life Story, messages, reporter identity, Safety details or full AI prompts.

### 38.5 Break Glass

Break-glass records preserve reason, scope, expiry, access and retrospective review.


---

## 39. M16 Integration and Operations Schema

Representative tables:

- `integrations`
- `integration_capabilities`
- `integration_credentials_metadata`
- `external_system_references`
- `identifier_mappings`
- `mapping_versions`
- `integration_requests`
- `integration_responses`
- `integration_reconciliations`
- `integration_mismatches`
- `operations`
- `operation_state_history`
- `scheduled_jobs`
- `job_attempts`
- `outbox_messages`
- `inbox_messages`
- `dead_letter_records`
- `webhook_subscriptions`
- `webhook_deliveries`
- `file_exchange_packages`
- `import_reports`

### 39.1 Integration Record

Stores owner, purpose, capability, data scope, provider terms, location, retention, schema and lifecycle.

### 39.2 Credential Metadata

Only key references, rotation state and expiry are stored.

Secrets remain external.

### 39.3 Identifier Mapping

Stores external authority, canonical target, version, verification and resolution state.

### 39.4 Operation

Operation represents long-running work and preserves requester, purpose, state, result, error and trace.

### 39.5 Reconciliation

Mismatch records never silently overwrite the owning module's authoritative data.

---

## 40. M17 Life Story and Personal Archive Schema

Representative tables:

- `life_story_archives`
- `life_story_items`
- `life_story_item_versions`
- `life_story_item_people`
- `life_story_item_places`
- `life_story_item_dates`
- `life_story_item_themes`
- `life_story_item_media`
- `life_story_contributions`
- `life_story_contribution_versions`
- `life_story_confirmations`
- `life_story_visibility_rules`
- `life_story_shares`
- `life_story_third_party_rights`
- `life_story_disputes`
- `life_story_corrections`
- `life_story_withdrawals`
- `life_story_exports`
- `legacy_preferences`
- `legacy_preference_versions`
- `legacy_authority_records`

### 40.1 Archive

One Participant may have one active LifeStoryArchive per Platform context unless a documented need supports more.

### 40.2 Item Root and Version

LifeStoryItem is the stable root.

LifeStoryItemVersion preserves text, structured references, authorship, AI assistance, confirmation and content hash.

### 40.3 Authorship

Store separate fields for:

- creator;
- contributor;
- attributed speaker;
- Participant confirmer;
- AI involvement;
- and import source.

### 40.4 Participant Testimony

Participant Testimony state is explicit and cannot be inferred from creator or visibility.

### 40.5 Proposed Facts

People, places, dates and themes may have:

- Proposed;
- Participant Confirmed;
- Disputed;
- Corrected;
- or Withdrawn

state.

### 40.6 Visibility

Item visibility uses explicit rows or fields for:

- Private;
- Selected People;
- Connections;
- Community;
- Platform Public;
- Internet Public.

### 40.7 Sharing Rights

Quotation, download, re-sharing, research use and external publication are stored separately.

### 40.8 Third-Party Rights

Third-party subjects, disputes, takedowns and restrictions remain linked to exact item versions.

### 40.9 Legacy Preference

LegacyPreference is versioned, separately authorised and never changed through ordinary Supporter or AI access.

### 40.10 Life Story Is Not AI Memory

No automatic database trigger copies a Life Story item into AIMemoryItem.

---

## 41. M18 Public Profile and Community Schema

Representative tables:

- `public_profiles`
- `public_profile_versions`
- `public_profile_fields`
- `public_profile_visibility`
- `community_spaces`
- `community_rule_versions`
- `community_memberships`
- `community_membership_history`
- `social_posts`
- `social_post_versions`
- `post_visibility_rules`
- `comments`
- `comment_versions`
- `reactions`
- `feed_projection_records`
- `ranking_records`
- `content_restrictions`
- `content_takedowns`

### 41.1 Public Profile

PublicProfile references ParticipantProfile but owns only explicitly selected public fields.

### 41.2 No Protected Field Copy

Research participation, Consent, assessments, Safety, private Life Story, Supporter relationships and precise location are prohibited from automatic PublicProfile projection.

### 41.3 Community Rule Version

Community membership and content reference the rule version effective at the action time.

### 41.4 Social Post Version

Material edits create version history.

### 41.5 Visibility

Platform Public and Internet Public remain distinct values and delivery paths.

### 41.6 Ranking Record

A RankingRecord may preserve:

- policy version;
- candidate set reference;
- deterministic filters;
- reason category;
- rank;
- time;
- and fairness or safety flags.

It must not store a hidden vulnerability or capacity score.

### 41.7 Social Proof

Reaction uniqueness constraints may prevent duplicate identical reactions by one actor.

No system-generated fake actor or reaction is permitted.

---

## 42. M18 Open Matching and MutualAcceptance Schema

Representative tables:

- `match_preferences`
- `match_preference_versions`
- `match_attribute_definitions`
- `match_preference_attributes`
- `matching_policy_versions`
- `match_generation_operations`
- `match_candidate_sets`
- `match_candidates`
- `match_candidate_features`
- `match_explanations`
- `match_decisions`
- `match_decision_history`
- `mutual_acceptances`
- `mutual_acceptance_sources`
- `mutual_acceptance_state_history`
- `mutual_acceptance_invalidations`
- `connection_requests`
- `connection_request_state_history`
- `match_fairness_evaluations`
- `match_candidate_expirations`

### 42.1 MatchPreference

MatchPreference is inactive by default and references current Consent, purpose and policy.

Versioned preference content is immutable after activation.

### 42.2 Allowed Attributes

MatchAttributeDefinition records whether an attribute is allowed, prohibited, Consent-dependent, sensitive, derived or explanation-visible.

A database constraint prevents a prohibited attribute from being linked to an active matching policy.

### 42.3 Candidate Pair

MatchCandidate uses a canonical unordered pair plus directional presentation rows where necessary.

### 42.4 Candidate Uniqueness

A partial unique constraint prevents duplicate active candidates for the same pair, policy and generation window.

### 42.5 Block Exclusion

Candidate generation performs an authoritative Block check before insert.

A deferred or projection-only Block check is insufficient.

### 42.6 Feature Provenance

Every MatchCandidateFeature stores source record, source version, attribute definition, policy version, transformation and explanation visibility.

### 42.7 MatchExplanation

MatchExplanation stores selected human-readable reasons without protected data or hidden compatibility claims.

### 42.8 Independent MatchDecision

MatchDecision stores:

- decision ID;
- deciding actor;
- MatchCandidate and candidate version;
- decision value;
- confirmation reference;
- recorded time;
- expiry;
- superseded decision;
- and audit metadata.

A unique partial constraint prevents multiple simultaneous current final decisions by the same actor for one candidate version.

The other actor cannot update or delete the decision.

### 42.9 MutualAcceptance Root

`mutual_acceptances` stores:

- MutualAcceptance ID;
- actor A and actor B canonical pair;
- basis type;
- purpose;
- matching or request policy version;
- evaluated time;
- effective start and expiry;
- lifecycle state;
- validity state;
- usage state;
- invalidation reason;
- connection ID where consumed;
- aggregate version;
- and audit metadata.

`mutual_acceptance_sources` stores either:

- exactly two compatible current MatchDecision references; or
- exactly one accepted ConnectionRequest reference.

A check or deferred constraint enforces one valid source shape.

### 42.10 MutualAcceptance Creation

Creation occurs in one M18 transaction that:

1. locks or version-checks source decisions or request;
2. verifies actors and candidate pair;
3. verifies compatibility;
4. verifies Consent, eligibility, account, Block, expiry and policy;
5. inserts MutualAcceptance;
6. inserts source references;
7. inserts outbox record `MutualAcceptanceRecorded`.

Clients and M16 cannot insert MutualAcceptance directly.

### 42.11 Expiry and Invalidation

Expiry and invalidation are append-recorded.

The original source references are immutable.

Triggers or application constraints prevent an Invalidated or Expired record from being consumed for Connection activation.

### 42.12 Single-Use Connection Activation

A unique non-null constraint on `connection_id` and a usage-state check ensure one MutualAcceptance activates at most one Connection.

Connection activation and MutualAcceptance consumption occur in one transaction.

### 42.13 Deferred ConnectionRequest

`connection_requests` preserve sender, recipient, approved discovery or invitation basis, purpose, expiry, decision and state.

The table remains present for migration stability, but:

- first-Pilot application roles cannot insert or accept records;
- the feature flag is disabled;
- no public first-Pilot endpoint exposes it;
- and acceptance, when enabled later, creates MutualAcceptance rather than Connection directly.

### 42.14 No Compatibility Truth

Internal ranking values are operational ordering data and are never stored as objective compatibility truth.

---

## 43. M18 Connection, CommunicationBasis and Messaging Schema

Representative tables:

- `connections`
- `connection_participants`
- `connection_state_history`
- `connection_pauses`
- `disconnect_records`
- `communication_basis_types`
- `communication_basis_evaluations`
- `conversation_threads`
- `thread_participants`
- `thread_communication_bases`
- `thread_state_history`
- `messages`
- `message_versions`
- `message_send_confirmations`
- `message_lifecycle_history`
- `message_attachments`
- `message_delivery_attempts`
- `message_delivery_state_history`
- `message_provider_references`
- `message_delivery_receipts`
- `message_read_receipts`
- `message_withdrawals`
- `message_cancellations`
- `message_abuse_flags`

### 43.1 Connection

Connection references exactly one source MutualAcceptance.

A non-null foreign key and transaction rule prohibit an active Connection without valid source.

### 43.2 Pair and Context Uniqueness

A partial unique constraint may prevent duplicate active Connections for the same canonical actor pair, purpose and context.

### 43.3 Connection Is Not Relationship

Connection does not satisfy foreign keys intended for Supporter Relationship, Delegation or SubstituteAuthority.

### 43.4 CommunicationBasis

CommunicationBasis is represented through:

- a controlled basis type;
- source record ID and version;
- actors;
- purpose;
- effective period;
- restrictions;
- allowed modes;
- evaluation result;
- and invalidation time.

Representative source types include:

- Connection;
- Relationship;
- InterventionSession;
- moderated Community context;
- or another approved basis.

A polymorphic source reference uses a validated type registry and application-level referential checks where a direct foreign key is impossible.

### 43.5 ConversationThread

ConversationThread stores:

- Thread ID;
- purpose;
- lifecycle state;
- created, paused, closed and expired times;
- retention class;
- aggregate version;
- and audit metadata.

`thread_participants` stores exact actor membership with effective periods.

A unique constraint prevents duplicate active participant rows.

Thread membership changes require explicit commands and history.

### 43.6 Thread CommunicationBasis

`thread_communication_bases` stores the active evaluated basis and source version.

An active Thread requires one current effective basis.

A database constraint prevents more than one current primary basis unless a policy explicitly permits multiple bases.

### 43.7 Message Root

`messages` stores:

- Message ID;
- ConversationThread ID;
- sender actor;
- lifecycle state;
- send-confirmation state;
- delivery state;
- current version ID;
- recipient-set hash;
- retention state;
- aggregate version;
- and audit metadata.

Message body is not duplicated in the root row when a version or encrypted object reference is used.

### 43.8 MessageVersion

`message_versions` stores:

- Message ID;
- version number;
- content format;
- encrypted content or object reference;
- checksum;
- author;
- AI assistance reference;
- created time;
- and supersession.

Only Draft Messages may create a new editable version.

### 43.9 SendConfirmation

`message_send_confirmations` stores:

- Message ID;
- exact Message version;
- confirming actor;
- recipient-set hash;
- purpose;
- challenge or ceremony reference;
- effective and expiry time;
- idempotency key;
- and result.

A unique constraint prevents reuse of one confirmation for another Message version or recipient set.

### 43.10 Draft versus Delivery

A Draft Message:

- has delivery state `Not Submitted`;
- has no MessageDeliveryAttempt;
- may have zero or more quarantined or ready attachments;
- and may be revised.

A database check prevents a non-null provider reference or DeliveryAttempt for Draft lifecycle state.

### 43.11 MessageDeliveryAttempt

Each attempt stores:

- attempt ID and sequence;
- Message ID;
- provider adapter and version;
- requested time;
- provider reference;
- provider state;
- canonical mapped state;
- callback evidence reference;
- failure reason;
- retryability;
- next retry;
- reconciliation state;
- and audit.

A unique constraint applies to provider plus provider reference.

A unique constraint applies to Message plus attempt sequence.

### 43.12 Delivery State

Lifecycle and delivery state remain separate.

Allowed progression is enforced in the application layer and reinforced through transition tables or database checks.

`Provider Accepted` does not satisfy a query for `Delivered`.

### 43.13 Callback Evidence

Raw provider callback evidence belongs to M16 `integration_ops`.

M18 stores only validated reference, canonical mapped result and necessary provenance.

M16 application roles cannot directly update `community_social.messages`.

### 43.14 Retry, Cancellation and Withdrawal

Retry creates another DeliveryAttempt for the same logical Message.

Cancellation and withdrawal are append-recorded.

A withdrawal record does not claim external recall.

### 43.15 Message Search and Research

Message body is excluded from:

- general full-text Search;
- Vector indexes;
- MatchCandidate features;
- feed ranking;
- AIMemoryItem ingestion;
- and ordinary analytical extracts.

A restricted Message-content DatasetDefinition requires separate purpose, Consent, approval, minimisation and storage controls.

### 43.16 Attachment

MessageAttachment references M16 object metadata and M18 semantic ownership.

A ready attachment requires completed upload, malware scan, type and size validation, current permission and retention assignment.

---

## 44. M18 Mute, Disconnect and Block Schema

Representative tables:

- `mute_records`
- `disconnect_records`
- `block_records`
- `block_scope_items`
- `block_state_history`
- `block_propagation_records`
- `block_reconciliation_records`
- `blocked_pending_delivery_actions`

### 44.1 Distinct Effects

Mute, Disconnect and Block use separate tables and semantics.

### 44.2 Direction

BlockRecord is directional unless a policy explicitly creates reciprocal effects.

### 44.3 Active Uniqueness

A partial unique constraint prevents duplicate active Blocks for the same actor pair and scope.

### 44.4 Strong Consistency

Block insertion and authoritative prohibition occur in one transaction where feasible.

The command path immediately rejects:

- MatchCandidate delivery;
- MutualAcceptance creation;
- Connection activation;
- ConversationThread creation;
- Message SendConfirmation;
- and new Notification creation.

### 44.5 Propagation

Propagation records track removal or suppression from:

- discovery;
- Search;
- Vector;
- matching;
- MutualAcceptance evaluation;
- Connection activation;
- ConversationThread;
- Message queue;
- provider delivery where cancellable;
- Notification;
- feed;
- cache;
- and AI Context.

### 44.6 Pending Delivery

`blocked_pending_delivery_actions` records:

- Message or DeliveryAttempt;
- BlockRecord;
- cancellation or suppression requested;
- provider limitation;
- result;
- exception;
- and completion.

### 44.7 Protected Existence

Block data are not exposed to the blocked actor through ordinary queries.

### 44.8 Revocation

Block revocation is append-recorded and does not automatically restore MatchPreference, MutualAcceptance, Connection, ConversationThread or Message delivery.

---

## 45. M18 Reports, Moderation and Appeal Schema

Representative tables:

- `user_reports`
- `content_reports`
- `report_evidence_objects`
- `report_state_history`
- `moderation_cases`
- `moderation_case_reports`
- `moderation_case_assignments`
- `moderation_evidence`
- `provider_moderation_signals`
- `ai_moderation_signals`
- `moderation_decisions`
- `moderation_actions`
- `moderation_action_targets`
- `appeals`
- `appeal_reviews`
- `restoration_reviews`
- `content_restorations`
- `moderation_safety_links`
- `moderation_access_audit`

### 45.1 Reporter Identity

Reporter identity is stored separately or encrypted and classified as Moderation-Restricted.

### 45.2 Report State

Report acknowledgement and investigation state remain separate from moderation outcome.

### 45.3 Provider and AI Signal

Provider or AI classifications are stored as provisional signals with source and model or policy version.

### 45.4 Moderation Decision

ModerationDecision is immutable and references:

- authorised human reviewer;
- rule version;
- evidence;
- reason;
- proportionality;
- duration;
- action;
- and appeal.

### 45.5 Safety Link

Moderation may create or link a SafetySignal.

It does not create a confirmed SafetyEvent.

### 45.6 Appeal

Appeal stores independent reviewer, evidence, outcome and restoration.

### 45.7 Conflict of Interest

Moderator conflicts may be linked to M15 ConflictOfInterestRecord.

---

## 46. Technical Object Registry

A technical object registry may reside in `storage_ops`.

Representative tables:

- `stored_objects`
- `object_versions`
- `object_checksums`
- `object_classifications`
- `object_processing_states`
- `object_access_grants`
- `object_delivery_tokens`
- `object_retention_records`
- `object_deletion_records`

The technical registry owns:

- provider bucket and key;
- content length;
- media type;
- checksum;
- encryption and key reference;
- storage class;
- processing state;
- and deletion state.

The domain module owns:

- semantic meaning;
- attachment relationship;
- visibility;
- Consent;
- purpose;
- authorship;
- and research-use rules.

---

## 47. Object Storage Architecture

Object storage supports:

- Consent evidence;
- Protocol and Evidence artefacts;
- Life Story audio, image and video;
- transcripts and translations;
- Social Post and Message attachments;
- moderation evidence;
- assessment and interview media;
- Dataset files;
- Analysis outputs;
- reports;
- exports;
- Evidence Packages;
- and reproducibility bundles.

### 47.1 Opaque Storage Key

Keys use opaque identifiers rather than names, email addresses or Participant codes.

### 47.2 Private by Default

Objects are private by default.

### 47.3 Authorised Delivery

Sensitive delivery uses short-lived, audience-scoped tokens or application streaming.

### 47.4 No Domain State in Object Metadata Alone

Provider metadata does not become the sole record of visibility, authorship, Consent or retention.

### 47.5 Versioning

Object versioning is enabled for research-critical and Participant-controlled artefacts where appropriate.

### 47.6 Integrity

Checksums are verified at upload, transformation, export and restore.

---

## 48. Upload, Quarantine and Validation Storage

Representative tables:

- `upload_intents`
- `upload_parts`
- `upload_sessions`
- `quarantine_objects`
- `malware_scan_results`
- `file_type_validation_results`
- `media_metadata_results`
- `upload_confirmations`
- `upload_failures`

Upload lifecycle:

```text
Upload Intent
        ↓
Restricted Temporary Object
        ↓
Size and Type Validation
        ↓
Malware Scan
        ↓
Checksum and Metadata
        ↓
Owning-Domain Confirmation
        ↓
Permanent Object Registration
```

An uploaded object remains unavailable for publication or analysis until validation completes.

Quarantine has:

- restricted access;
- expiry;
- incident link;
- and explicit release or deletion decision.

---

## 49. Media Processing Storage

Representative tables:

- `media_processing_jobs`
- `media_processing_attempts`
- `media_derivatives`
- `transcription_runs`
- `transcript_versions`
- `translation_runs`
- `translation_versions`
- `thumbnail_records`
- `redaction_records`
- `media_quality_flags`

Every derivative preserves:

- source object and version;
- processor;
- model or software version;
- parameters;
- language;
- transformation;
- checksum;
- quality;
- review;
- and classification.

Derived transcript or thumbnail inherits source sensitivity unless validly reclassified.

AI transcription and translation do not automatically create Participant Testimony.

---

## 50. Public Object Delivery and CDN Storage

Platform Public and Internet Public use separate delivery profiles.

### 50.1 Platform Public

Requires authentication and current Platform eligibility.

### 50.2 Internet Public

Uses a separately approved object copy or delivery mapping with:

- public identifier;
- publication version;
- indexing policy;
- cache policy;
- takedown state;
- expiry where applicable;
- and audit.

### 50.3 Cache Invalidation

Visibility reduction, withdrawal, Block, moderation action or deletion triggers invalidation.

### 50.4 External Persistence

The Platform records that third-party caches or copies may remain outside direct control.

### 50.5 No Shared Private/Public Key

A private object should not become public merely by changing an ACL on the same long-lived URL where a separate controlled publication object is safer.

---

## 51. Search Storage

Search domains remain distinct:

- protected Participant and research search;
- Participant's own Life Story;
- Community discovery;
- Evidence and Knowledge;
- moderation;
- audit;
- and administration.

Representative projection fields include:

- source type and ID;
- source version;
- Organisation and Research Project;
- Participant or audience scope;
- visibility;
- Block-relevant party IDs where appropriate;
- Resource State;
- Data Classification;
- indexed fields;
- created and updated time;
- deletion generation;
- and projection version.

### 51.1 Source Authority

Search documents are derived and rebuildable.

### 51.2 Permission

Search result retrieval rechecks current authoritative permission.

### 51.3 Sensitive Exclusions

Private messages, reporter identity, detailed Safety records and moderation evidence are not included in general indexes.

### 51.4 Community

Community indexing applies eligibility, visibility, rule and moderation state before publication to search.

### 51.5 Deletion

Each source change has an index invalidation or rebuild path.

---

## 52. Vector Storage

Representative vector metadata:

- vector ID;
- namespace;
- source module;
- source type and ID;
- source version;
- chunk identifier;
- embedding model and version;
- purpose;
- Data Classification;
- visibility;
- Organisation and Research Project;
- Participant scope;
- consent or policy reference;
- created time;
- refresh state;
- and deletion generation.

### 52.1 Namespaces

Separate namespaces may cover:

- Knowledge Platform references;
- Research Project documents;
- Participant's own Life Story;
- permitted Community content;
- qualitative analysis;
- and AI evaluation.

### 52.2 Re-Authorisation

A retrieved candidate is re-authorised against the source record before use.

### 52.3 Block

Blocked or newly invisible content is excluded before final retrieval.

### 52.4 Rebuild

Embeddings are rebuildable from permitted current source versions.

### 52.5 Prohibited Use

Vector storage does not become a hidden matching, capacity, vulnerability or clinical scoring system.

### 52.6 MVP

A relational vector extension or provider-neutral abstraction is sufficient if Vector retrieval is needed.

---

## 53. Cache Storage

Caches may hold:

- stable reference data;
- approved public configuration;
- bounded session context;
- safe read models;
- provider capability metadata;
- and non-sensitive query results.

Caches must not be authoritative for:

- Consent;
- Block;
- Relationship revocation;
- Mutual Acceptance;
- visibility reduction;
- Safety state;
- Dataset Lock;
- or approval.

Cache records include:

- key scope;
- source version;
- policy version;
- created time;
- expiry;
- and invalidation generation.

Immediate invalidation is required for high-freshness authority changes.

Shared caches must not mix Organisations, Participants, purposes or visibility scopes.

---

## 54. Transactional Outbox Storage

Representative fields:

- outbox ID;
- event category and type;
- event schema version;
- source module;
- aggregate type, ID and version;
- occurred time;
- purpose;
- DataClassification;
- correlation, causation and trace;
- minimum payload;
- publication state;
- attempt count;
- next attempt;
- published time;
- and translation or Integration Event reference where applicable.

### 54.1 Atomic Write

Domain state and outbox record are committed in one transaction.

Representative atomic pairs include:

- BlockRecord and `BlockCreated`;
- MatchDecision and `MatchDecisionRecorded`;
- MutualAcceptance and `MutualAcceptanceRecorded`;
- Connection plus MutualAcceptance consumption and `ConnectionActivated`;
- ConversationThread and `ConversationThreadCreated`;
- Message SendConfirmation, Message queue state and `MessageSendConfirmed` plus `MessageQueued`;
- and DatasetLock plus `DatasetVersionLocked`.

### 54.2 Minimum Payload

Outbox does not contain Life Story text, Message body, reporter identity or restricted evidence when a reference is sufficient.

### 54.3 Ordering

Aggregate version supports ordered consumption.

M18 ordering is preserved per MatchCandidate, MutualAcceptance, Connection, ConversationThread and Message.

Representative Message sequence:

```text
MessageDraftCreated
        ↓
MessageSendConfirmed
        ↓
MessageQueued
        ↓
MessageSent
        ↓
MessageProviderAccepted
        ↓
MessageDelivered or MessageDeliveryFailed
```

### 54.4 Event Categories

Domain Events, Integration Events, UX Analytics Events, Operational Events and Audit Events remain distinguishable.

The outbox stores canonical producer facts and deliberate Integration Event records, not UI aliases.

### 54.5 Deprecated Alias Translation

Historical aliases such as `MessageDeliveryConfirmed`, `ActorBlocked`, `UserReported` and `DatasetLockConfirmed` are translated by versioned consumers or migration tools.

New producers emit canonical names.

### 54.6 Retention

Published records are retained according to operational, compatibility and audit needs.

### 54.7 No Event Authority

An outbox record is not a second aggregate record and does not grant resource access.

---

## 55. Inbox and Dead-Letter Storage

### 55.1 Inbox

Representative fields:

- consumer;
- message or event ID;
- schema version;
- aggregate version;
- received time;
- processed time;
- result;
- and trace.

A unique constraint prevents duplicate consumer effect for the same message.

### 55.2 Dead Letter

DeadLetterRecord stores:

- source;
- consumer;
- message reference;
- failure class;
- attempt history;
- owner;
- Data Classification;
- review state;
- next action;
- and trace.

### 55.3 Replay

Replay records purpose, actor, selected range, validation and outcome.

### 55.4 Sensitive Payload

Dead-letter storage avoids duplicating sensitive payloads where an encrypted reference suffices.

---

## 56. Job and Workflow Storage

Representative tables:

- `jobs`
- `job_dependencies`
- `job_attempts`
- `job_results`
- `job_schedules`
- `workflow_instances`
- `workflow_steps`
- `human_tasks`
- `workflow_compensations`
- `workflow_timeouts`

Jobs preserve:

- type;
- requester;
- purpose;
- source command or event;
- input versions;
- permission or approval reference;
- state;
- priority;
- retries;
- worker version;
- result;
- and trace.

Sensitive jobs revalidate current Consent, Block, Resource State and approval before execution.

Workflow instances do not own participating aggregates.

---

## 57. Notification and Provider Delivery Storage

Representative M16 tables:

- `notification_preferences`
- `notification_requests`
- `notification_templates`
- `notification_template_versions`
- `notification_deliveries`
- `provider_adapter_configs`
- `provider_endpoint_configs`
- `provider_callback_records`
- `provider_callback_replay_keys`
- `provider_reference_mappings`
- `provider_delivery_receipts`
- `provider_delivery_reconciliation`
- `provider_delivery_failures`
- `notification_acknowledgements`
- `notification_failures`

Notification remains distinct from M18 Message.

### 57.1 Notification Record

Notification records preserve business trigger, recipient, purpose, channel, template version, minimum data, quiet hours, accessibility choice, delivery state and provider reference.

### 57.2 Provider Callback Record

Provider callback records preserve:

- provider;
- endpoint and key version;
- signature result;
- timestamp;
- replay key;
- raw restricted payload or object reference;
- provider reference;
- mapped Message and DeliveryAttempt;
- provider status;
- translation version;
- canonical command result;
- idempotency result;
- and audit.

### 57.3 Access Boundary

M16 database roles may write callback, mapping, reconciliation and operational delivery tables.

They cannot directly update:

- M18 Message content;
- Message lifecycle;
- canonical Message delivery state;
- ConversationThread;
- CommunicationBasis;
- or Connection.

### 57.4 Reconciliation

Reconciliation records compare provider evidence with canonical M18 state without silently overwriting it.

A mismatch produces an M18 command, operational incident or manual review according to policy.

### 57.5 Sensitive Preview

Sensitive previews are generated at delivery time or stored separately with minimum retention.

---

## 58. Analytical Storage Architecture

Analytical storage supports:

- governed Dataset Versions;
- descriptive summaries;
- process and outcome evaluation;
- qualitative coding;
- fairness review;
- reproducible Analysis Runs;
- and approved dashboards.

### 58.1 Separation

Analytical storage is not used for operational mutation.

### 58.2 MVP Options

The MVP may use:

- a dedicated database schema;
- a separate analytical database;
- a secure notebook environment;
- or immutable Parquet packages loaded into an approved environment.

### 58.3 Identity

Analytical identifiers are pseudonymous where possible.

### 58.4 Network and Export

Access, network egress, download and export controls depend on Data Classification.

### 58.5 No Production Credential

Analytical users and notebooks do not receive production database credentials.

---

## 59. Physical Dataset Storage

A DatasetVersion may be stored as:

- relational analytical table;
- Parquet package;
- CSV package where justified;
- statistical file;
- qualitative corpus;
- or a combination described by its manifest.

The canonical MVP recommendation is:

- relational metadata and lineage;
- immutable Parquet or equivalent columnar files for analysis-ready data;
- and a variable dictionary and manifest.

Each file records:

- logical dataset partition;
- schema;
- row count;
- checksum;
- compression;
- encryption;
- object reference;
- and generation run.

CSV is an interchange format, not the preferred canonical high-integrity analytical format.

---

## 60. Dataset Manifest and Lock Storage

A DatasetManifest includes:

- DatasetDefinition version;
- DatasetVersion;
- source aggregate versions;
- extraction time;
- inclusion and exclusion;
- TransformationRuns;
- schema and variable dictionary;
- missingness;
- imputation;
- de-identification;
- file list;
- row and entity counts where safe;
- checksums;
- software;
- quality review;
- restrictions;
- and content hash.

DatasetLock stores:

- manifest hash;
- dataset content hash;
- lock authority;
- approval;
- time;
- compatible AnalysisPlan;
- and immutable state.

Database constraints prevent:

- a second active lock;
- modification of locked source lists;
- modification of locked files;
- and replacement of the manifest hash.

---

## 61. Transformation Storage

TransformationRun stores:

- exact inputs;
- exact output;
- transformation specification;
- code or query reference;
- software environment;
- parameters;
- actor or Service Account;
- start and end time;
- validation;
- warnings;
- quality flags;
- checksum;
- and state.

Transformation definitions are versioned.

Ad hoc manual changes to analytical files are prohibited outside a recorded TransformationRun.

For free text, audio, images, social graph and matching data, transformation records include redaction and re-identification review.

---

## 62. Analysis Artefact Storage

Representative object and relational artefacts include:

- analysis code reference;
- environment lock file or container digest;
- parameter file;
- random seed;
- logs;
- model objects;
- tables;
- figures;
- diagnostics;
- qualitative codebook;
- and result checksum.

AnalysisRun references exact artefact versions.

Completed AnalysisRun input definitions are immutable.

Outputs may be regenerated only as a new run.

ResearchFinding references approved InterpretationRecord, not an arbitrary file path.

---

## 63. Data Lineage Model

```text
Source Aggregate and Version
        ↓
Permission, Consent and Purpose Check
        ↓
DatasetDefinition
        ↓
TransformationRun
        ↓
DatasetVersion
        ↓
Data Quality Review
        ↓
DatasetLock
        ↓
AnalysisPlan
        ↓
AnalysisRun
        ↓
AnalysisOutput
        ↓
InterpretationRecord
        ↓
ResearchFinding
        ↓
InterventionDecision or ExternalSubmission
```

Lineage tables preserve:

- source type and ID;
- source version;
- relationship type;
- transformation;
- result version;
- actor;
- time;
- purpose;
- and trace.

Lineage is directional and queryable both upstream and downstream.

---

## 64. External Identifier Mapping

Representative tables:

- `external_systems`
- `external_identifier_mappings`
- `external_identifier_versions`
- `identifier_resolution_attempts`
- `identifier_conflicts`

A mapping stores:

- Platform entity type and ID;
- external system;
- external identifier;
- external version;
- authority;
- verification;
- effective period;
- status;
- and resolution notes.

Unique constraints prevent one active external identifier from mapping ambiguously without an explicit conflict state.

Identity matching is never performed solely by name or email.

---

## 65. Terminology and Code Storage

Representative tables:

- `terminology_systems`
- `terminology_versions`
- `terminology_codes`
- `terminology_code_designations`
- `terminology_mappings`
- `local_terms`
- `mapping_reviews`
- `unit_definitions`

Mapping types include:

- Exact;
- Equivalent;
- Broader;
- Narrower;
- Related;
- and Unmapped.

Terminology version and mapping reviewer are preserved.

External terminology content may be referenced instead of fully duplicated where licensing requires it.

---

## 66. JSON Storage Guidance

JSON is appropriate for:

- versioned provider payload snapshots;
- instrument-specific response structures;
- flexible AI output metadata;
- configuration snapshots;
- evidence query criteria;
- manifest extensions;
- and sparse experimental attributes.

JSON is not appropriate as the sole representation for:

- canonical ownership;
- Consent decisions;
- Block;
- Relationship;
- Match Decision;
- Mutual Acceptance;
- approval;
- Safety state;
- Dataset Lock;
- or key analytical variables

when structured relational fields and constraints are known.

Every material JSON document has:

- schema version;
- validation;
- size limit;
- migration strategy;
- and indexed fields where needed.

---

## 67. Normalisation Guidance

### 67.1 Operational Core

Operational aggregates use normalised relational structures sufficient to enforce invariants.

### 67.2 Version Snapshots

A serialised snapshot may coexist with structured data for exact reconstruction.

### 67.3 Read Models

Read models may be denormalised for permission-scoped performance.

### 67.4 Analytical Data

Analysis-ready data may use wide, columnar or star-like structures governed by DatasetDefinition.

### 67.5 Audit

Audit events use structured metadata and references rather than copying entire source rows.

### 67.6 No Premature Over-Normalisation

Very small stable value structures may remain inline when it improves clarity and does not weaken constraints.

---

## 68. Data Type Guidance

### 68.1 Timestamps

Use timezone-aware timestamps for events and decisions.

### 68.2 Local Date and Time

Store local date, local time, timezone and UTC instant separately when scheduling semantics require them.

### 68.3 Dates

Use date types for birth date and calendar dates.

### 68.4 Numeric Measures

Use precision appropriate to the Measurement Definition.

### 68.5 Units

Store canonical unit and original unit where conversion occurred.

### 68.6 Enumerations

Use controlled codes or database enums only when migration implications are understood.

### 68.7 Free Text

Free text stores language, source, authorship, sensitivity and redaction state where material.

### 68.8 Money

Where financial metadata is required, store amount and ISO currency code separately.

### 68.9 Boolean

Do not use nullable booleans where Unknown and Not Applicable require distinct states.

---

## 69. Database Constraint Strategy

Use database constraints for invariants that are stable and storage-local.

Representative constraints include:

- non-overlapping active version periods;
- unique external identity issuer and subject;
- one active role assignment per actor, role and scope where appropriate;
- one active Consent root per form and purpose where policy requires;
- one active Block per directional pair and scope;
- one active Match Preference per Participant and context;
- no self-match;
- one current final Match Decision per Participant and candidate version;
- one active Connection per pair and context;
- one active DatasetLock per DatasetVersion;
- immutable approved versions;
- valid state combinations;
- non-negative counts and doses;
- and required source version for derived data.

Complex permission and safety decisions remain in domain logic and are not reduced to database triggers alone.

---

## 70. Indexing Strategy

Indexes should follow observed query patterns.

Representative indexes include:

- active records by Organisation and Research Project;
- Participant by pseudonymous study code;
- current Consent by Participant, scope and purpose;
- active Relationship by source, target and type;
- ProtocolVersion by root and version number;
- active InterventionAssignment by Participant;
- Assessment by Participant, MeasurementVersion and timepoint;
- open SafetySignal by priority and owner;
- KnowledgeReference by external source and identifier;
- AIInteraction by Participant, project and time;
- DatasetVersion by definition and state;
- AnalysisRun by plan and dataset;
- LifeStoryItem by archive, visibility and time;
- SocialPost by Community, visibility and publication time;
- MatchCandidate by Participant, state and expiry;
- Connection by canonical pair;
- Message by thread and created time;
- active Block by blocker and blocked actor;
- open ModerationCase by priority and assignee;
- outbox by publication state and next attempt;
- Operation by state and priority.

Sensitive indexes should avoid storing plaintext values that require encryption.

---

## 71. Partial, Expression and Unique Indexes

### 71.1 Partial Index

Use partial indexes for:

- active assignments;
- open Safety Signals;
- current active Blocks;
- active Match Preferences;
- pending moderation cases;
- unpublished outbox messages;
- and non-deleted public content.

### 71.2 Expression Index

Use expression indexes for normalised email or provider identifiers only where privacy and encryption strategy permit.

### 71.3 Unique Index

Use unique indexes to enforce:

- version numbers within a root;
- provider identity mapping;
- active pair relationships;
- one reaction of a type per actor and target;
- idempotency key scope;
- and event consumer inbox identity.

### 71.4 Index Review

Indexes are reviewed for leakage, write cost, selectivity and operational value.

---

## 72. Query Patterns

Critical query patterns include:

- current effective Consent by Participant, purpose and scope;
- current Relationship and Specific Permission;
- active Block for an actor pair;
- current visibility and Resource State;
- Participant's active Enrolment and assignment;
- current Protocol and intervention configuration;
- pending assessments and human tasks;
- open Safety Signals;
- Evidence Snapshot lineage;
- AI Interaction trace;
- Participant's own Life Story items;
- eligible Community content;
- current Match Candidates and explanation;
- active Connection and communication basis;
- thread messages;
- open reports and moderation cases;
- Dataset lock readiness;
- AnalysisRun lineage;
- export approval and delivery;
- and deletion propagation state.

Queries should start from authoritative filters rather than retrieve broad data and filter only in application memory.

---

## 73. Partitioning

Partitioning is introduced for measured volume, maintenance or retention needs.

Potential candidates:

- AuditEvent by time;
- AIInteraction by time or project;
- Message by time;
- SocialPost activity by time;
- AssessmentResponse by project or time;
- outbox and inbox by time;
- device measurements by time;
- and analytical fact tables.

### 73.1 MVP

The MVP may avoid partitioning except for high-growth audit or event tables if volume justifies it.

### 73.2 Partition Key

Partition keys must support:

- query locality;
- retention;
- data residency;
- restore;
- and future extraction.

### 73.3 No Permission Boundary Assumption

Partitioning is not a substitute for permission or tenant isolation.

---

## 74. Read Models and Materialised Views

Read models may support:

- Participant Today view;
- Researcher project overview;
- Coordinator task queue;
- Safety queue;
- Moderator queue;
- Community feed;
- matching candidate view;
- Dataset readiness;
- Analysis progress;
- and audit summary.

Every read model includes:

- source versions;
- projection version;
- generated time;
- permission-relevant dimensions;
- freshness;
- and invalidation state.

A materialised view is never the sole authority for Consent, Block, Mutual Acceptance, approval or Dataset Lock.

---

## 75. Change Data Capture

Change Data Capture may support:

- analytical loading;
- Search and Vector projection;
- reconciliation;
- external integration;
- and future service extraction.

CDC is optional in the MVP.

When used, CDC must:

- preserve source table and version;
- avoid exposing restricted columns;
- use approved purpose;
- support deletion and withdrawal;
- and remain distinct from domain event semantics.

Raw database changes are not automatically published as business Integration Events.


---

## 76. Event-Sourced Record Guidance

The Platform does not require event sourcing for all aggregates.

Event-sourced or append-only patterns may be useful for:

- Consent decision history;
- approval history;
- Safety Signal and Event state history;
- moderation decisions and appeals;
- audit;
- and selected integration operations.

Before using event sourcing for an aggregate, define:

- event completeness;
- snapshot strategy;
- schema evolution;
- replay safety;
- deletion and privacy implications;
- correction semantics;
- and operational ownership.

An outbox event stream is not automatically a complete event-sourced aggregate history.

---

## 77. Multi-Organisation Data Model

### 77.1 Organisation Scope

Organisation-scoped tables include `organisation_id` where the domain requires it.

### 77.2 Research Project Scope

Research-scoped tables also include `research_project_id` or an exact project reference.

### 77.3 Global Resources

Global resources such as terminology or platform configuration are explicitly classified and do not omit Organisation scope by accident.

### 77.4 Participant Membership

A Participant may be associated with more than one Organisation or Research Project through explicit records.

### 77.5 No Tenant Inference

Tenant scope is not inferred only from the current user session or table location.

### 77.6 Cross-Organisation Research

Cross-Organisation Research Projects use:

- explicit participating Organisations;
- shared governance;
- purpose;
- data-sharing rules;
- residency;
- and approved analytical boundary.

### 77.7 Future Physical Isolation

Schema, database or regional isolation may be introduced for regulatory, contractual or scale needs.

---

## 78. Row-Level Security

Row-level security may provide defence in depth for:

- Organisation isolation;
- Research Project isolation;
- highly restricted Safety or moderation data;
- analytical datasets;
- and administrative read access.

### 78.1 Not Sole Enforcement

RLS does not replace application permission, Consent, purpose, visibility, Block or Resource State logic.

### 78.2 Session Context

RLS context must be set through trusted server-controlled session variables or separate database roles.

### 78.3 Connection Pooling

Pooling strategy must prevent context leakage between requests.

### 78.4 Background Jobs

Worker and migration roles use explicit policies and do not inherit unrestricted human scope.

### 78.5 Testing

RLS policies require automated wrong-Organisation, wrong-project and missing-context tests.

### 78.6 MVP Decision

Use RLS selectively after verifying operational complexity and pooling safety.

---

## 79. Encryption at Rest

At-rest encryption applies to:

- relational database;
- replicas;
- object storage;
- queue;
- cache where sensitive data may appear;
- Search and Vector stores;
- analytical storage;
- backups;
- and exports.

Managed storage encryption is the baseline.

Application- or field-level encryption is added where threat and access-separation requirements justify it.

Encryption state and key reference are retained as technical metadata.

Public visibility does not remove the need for at-rest protection of the authoritative record.

---

## 80. Field-Level Encryption and Tokenisation

Candidates for field-level protection include:

- external identity linkage;
- contact details;
- substitute-authority evidence;
- reporter identity;
- precise location;
- highly sensitive Life Story text;
- private Message body where architecture selects field encryption;
- Safety detail;
- moderation evidence;
- pseudonymisation linkage keys;
- and provider credentials metadata where any sensitive value remains.

### 80.1 Search Trade-Off

Encrypted fields cannot be broadly indexed without additional risk.

### 80.2 Tokenisation

Tokenisation may support equality matching for approved values without exposing plaintext.

### 80.3 Key Separation

Separate keys may be used by environment, purpose, classification or data domain.

### 80.4 Rotation

Rotation design distinguishes:

- key-reference rotation;
- lazy re-encryption;
- bulk re-encryption;
- and emergency compromise response.

### 80.5 No Encryption as Permission

Possession of a decryption capability remains separate from domain authorisation.

---

## 81. Masking and Redaction

Masking supports:

- support and operations views;
- audit views;
- export previews;
- demonstration;
- lower environments;
- and limited analytical access.

Examples:

- partial contact details;
- pseudonymous Participant code;
- hidden precise dates;
- coarsened location;
- redacted free text;
- protected reporter identity;
- and omitted message or Safety content.

Masking is purpose-specific.

A masked display does not create a de-identified dataset.

Redaction records preserve source, method, version, reviewer and reversibility where applicable.

---

## 82. Pseudonymisation Storage

Representative tables:

- `participant_pseudonyms`
- `pseudonym_scopes`
- `pseudonym_linkage_keys`
- `pseudonym_rotations`
- `linkage_access_records`

A pseudonym is scoped to:

- Research Project;
- Dataset Definition;
- external recipient;
- or another approved purpose.

The linkage key is stored separately with restricted access.

The same Participant should not use one universal research pseudonym across unrelated projects where linkability is unnecessary.

Pseudonymisation does not make data anonymous.

---

## 83. De-Identification Pipeline Storage

Representative records:

- `deidentification_policies`
- `deidentification_runs`
- `deidentification_actions`
- `reidentification_risk_reviews`
- `redaction_records`
- `release_reviews`

A de-identification run preserves:

- input DatasetVersion;
- policy and version;
- direct identifier removal;
- generalisation and suppression;
- free-text and multimedia treatment;
- social-graph treatment;
- location and date treatment;
- output;
- residual risk;
- reviewer;
- and approval.

High-risk sources include:

- Life Story;
- voice, face and images;
- Message content and metadata;
- social graph;
- Match Candidate and Connection patterns;
- precise dates and location;
- rare interests;
- Safety and moderation records;
- and public external data.

AI may assist detection but cannot be the sole release control.

---

## 84. Data Quality Storage

Representative tables:

- `data_quality_rules`
- `data_quality_rule_versions`
- `data_quality_checks`
- `data_quality_issues`
- `data_quality_issue_sources`
- `data_quality_resolutions`
- `data_quality_reviews`
- `data_quality_metrics`

Quality dimensions may include:

- completeness;
- validity;
- consistency;
- uniqueness;
- timeliness;
- provenance;
- conformance;
- and plausibility.

A quality issue stores:

- source record and version;
- rule;
- severity;
- original value;
- observed issue;
- owner;
- action;
- resolution;
- and effect on Dataset or Analysis.

A warning does not silently alter the source record.

---

## 85. Correction and Supersession Model

Corrections preserve:

- original record;
- correction request;
- requester;
- reason;
- evidence;
- reviewer;
- corrected value or version;
- effective time;
- and downstream impact.

Correction patterns include:

- append correction row;
- new immutable version;
- supersession;
- invalidation plus replacement;
- or source-system reconciliation.

Approved and locked records are never updated in place.

Downstream Dataset Versions, Analysis Runs, reports and Findings are evaluated for impact.

A correction does not erase the historical fact that the original value was previously used.

---

## 86. Missing Data and Imputation Storage

Missing data use controlled codes such as:

- Not Collected;
- Participant Declined;
- Not Applicable;
- Unknown;
- Device Failure;
- Integration Failure;
- Not Yet Due;
- Lost to Follow-Up;
- Withheld by Permission;
- and Invalidated.

Missingness is not represented solely by `null`.

Imputation records preserve:

- source variable;
- missingness code;
- method;
- algorithm and version;
- parameters;
- training or reference data;
- imputed value;
- uncertainty;
- actor or process;
- and time.

Original and imputed values remain separately identifiable.

AI-generated guesses are not silently stored as imputation.

---

## 87. Retention Architecture

Retention is driven by:

- data category;
- purpose;
- Consent;
- Protocol;
- visibility;
- safety;
- moderation;
- research integrity;
- contractual need;
- applicable obligation;
- and Participant choice.

Representative tables:

- `retention_policies`
- `retention_policy_versions`
- `record_retention_assignments`
- `retention_reviews`
- `retention_expirations`
- `archival_actions`

Retention metadata includes:

- policy;
- start event;
- target date;
- review date;
- hold;
- disposition;
- and authority.

Separate schedules apply to:

- identity and recovery;
- Consent evidence;
- Life Story;
- Community content;
- Match Candidates;
- Connections and messages;
- Blocks and reports;
- moderation;
- Safety;
- AI Interactions and memory;
- Dataset and Analysis artefacts;
- audit;
- and provider copies.

Retention does not preserve current visibility or permission.

---

## 88. Deletion and Withdrawal Propagation

Representative tables:

- `deletion_requests`
- `deletion_request_targets`
- `deletion_impact_assessments`
- `deletion_tasks`
- `deletion_propagation_records`
- `deletion_exceptions`
- `deletion_confirmations`
- `provider_deletion_requests`
- `public_takedown_records`

Propagation targets include:

- authoritative source record;
- dependent domain references;
- object storage;
- Search index;
- Vector index;
- cache;
- feed and Match Candidate generation;
- AI context and AIMemoryItem;
- pending job;
- export;
- external provider;
- public endpoint;
- and future Dataset generation.

### 88.1 Locked Dataset

A locked DatasetVersion is not silently edited.

The response may create:

- a new DatasetVersion;
- exclusion record;
- sensitivity analysis;
- withdrawal note;
- or approved retention exception.

### 88.2 Message and Third-Party Data

Deletion distinguishes:

- sender view;
- recipient view;
- logical withdrawal;
- Message-content deletion;
- attachment deletion;
- provider-held copies;
- Safety or moderation hold;
- legal obligation;
- and immutable locked DatasetVersion use.

A sender-side deletion does not imply recipient deletion or external-provider recall.

Pending Message deliveries are cancelled where technically possible.

Provider deletion, cancellation or retention results are tracked through M16 reconciliation records.

Message body remains excluded from ordinary analytical storage by default.

### 88.3 Verification

Propagation completes only after target confirmations or recorded exceptions.

### 88.4 Failure

Failed propagation creates an operational or privacy incident according to risk.

---

## 89. Holds and Preservation

Hold types may include:

- legal hold;
- safety hold;
- moderation evidence hold;
- research-integrity hold;
- incident-investigation hold;
- and audit hold.

A hold records:

- authority;
- purpose;
- scope;
- start;
- review;
- expiry;
- restrictions;
- and release.

Holds are least-scope and do not grant broader access.

A hold may delay physical deletion but does not automatically preserve public visibility, AI use, matching or future research use.

---

## 90. Backup Architecture

### 90.1 Database Backup

Use:

- automated snapshots;
- transaction-log or WAL retention;
- point-in-time recovery;
- encryption;
- integrity monitoring;
- and retention tiers.

### 90.2 Object Backup

Use provider durability, versioning, replication or separate backup according to artefact criticality.

### 90.3 Audit and Research Artefacts

Consent evidence, audit, Dataset manifests, locked Dataset files, Analysis artefacts and approved reports receive explicit backup coverage.

### 90.4 Configuration

Schema, migrations, infrastructure and domain configuration references remain version-controlled and recoverable.

### 90.5 Key Material

Recovery includes controlled key references and required key backup.

### 90.6 Backup Access

Backup access is more restricted than ordinary runtime access.

---

## 91. Restore Architecture

Restore procedures cover:

- database;
- object storage;
- audit;
- outbox and inbox;
- Search and Vector rebuild;
- cache invalidation;
- analytical packages;
- and provider reconciliation.

Restore testing verifies:

- schema and migration compatibility;
- object references and checksums;
- Consent and Block state;
- visibility and public takedown state;
- Connection and message basis;
- Dataset manifests and locks;
- Analysis lineage;
- audit availability;
- and deletion tombstones.

A restore must not re-enable withdrawn Consent, revoked Block, deleted AI memory or public content without reconciliation.

Restore results include data cut-off, exceptions and validation report.

---

## 92. Disaster Recovery

The MVP may use one primary region with:

- managed high availability;
- automated backup;
- point-in-time recovery;
- object durability;
- infrastructure recreation;
- and tested restore.

RPO and RTO are defined by capability criticality.

Manual continuity procedures must preserve:

- Consent and withdrawal;
- Block and Report;
- Safety Signal receipt;
- intervention pause;
- moderation backlog;
- and later reconciliation.

Multi-region active-active is not required for the MVP.

Provider and analytical-environment recovery are documented separately.

---

## 93. Database Migration Strategy

### 93.1 Version Control

Every schema migration is version-controlled and module-owned.

### 93.2 Forward Compatibility

Deployments use expand-and-contract where zero- or low-downtime compatibility is required.

### 93.3 Migration Phases

Typical phases:

1. add compatible schema;
2. deploy dual-read or dual-write only where justified;
3. backfill;
4. validate;
5. switch reads;
6. remove obsolete schema after the compatibility window.

### 93.4 Immutable Data

Migration of approved or locked artefacts preserves original content hash and lineage.

### 93.5 Destructive Change

Destructive changes require backup, impact analysis, validation and rollback or forward-fix plan.

### 93.6 Migration Audit

Production migrations record actor, release, time, result and affected schema.

---

## 94. Data Migration and Import

A migration plan defines:

- source authority;
- scope;
- identifier mapping;
- schema and terminology mapping;
- Data Classification;
- Consent and purpose;
- transformation;
- quality validation;
- duplicates;
- unresolved values;
- cutover;
- rollback;
- and reconciliation.

Imported records preserve original identifiers and source version.

Uncertain identity or semantic mappings enter quarantine.

Life Story, Community, message, moderation and Safety imports require additional rights, authorship and confidentiality review.

Migration does not create Participant Testimony or verified fact automatically.

---

## 95. Seed, Reference and Configuration Data

Seed data may include:

- role definitions;
- permission definitions;
- purpose codes;
- Data Classifications;
- Resource States;
- visibility codes;
- Consent scope definitions;
- event and error catalogues;
- terminology references;
- Community rule templates;
- matching attribute definitions;
- and data-quality rules.

Seed changes are version-controlled and environment-aware.

Production seed data are not silently replaced by development fixtures.

Research-critical configuration belongs in governed domain records rather than untracked seed scripts.

---

## 96. Test Data Strategy

Test data should cover:

- multiple Organisations and Research Projects;
- Participants with different accessibility needs;
- supported decision-making and substitute authority;
- Consent grant, restriction, expiry and withdrawal;
- Private, Community, Platform Public and Internet Public states;
- Life Story contributions and disputes;
- matching opt-in and Block;
- Mutual Acceptance and Connection;
- messages, reports and moderation;
- Safety Signals and confirmed Events;
- AI context and memory;
- missingness and quality issues;
- locked Dataset and Analysis lineage;
- retention and deletion;
- and provider failure.

Production identifiable data are not copied into test environments without approved de-identification.

Synthetic data should include realistic complexity without imitating real Participants too closely.

---

## 97. Data Access Layer and Repository Guidance

### 97.1 Repositories

Repositories align with aggregate ownership and transactions.

### 97.2 Query Services

Complex reads use purpose-specific query services or projections.

### 97.3 No Generic Mutation

A generic repository or admin endpoint must not update arbitrary tables.

### 97.4 Direct SQL

Direct SQL is appropriate for:

- migrations;
- performance-critical queries;
- analytical extraction;
- integrity checks;
- and operations

when reviewed and owned.

### 97.5 Transaction Context

Repository calls receive server-resolved actor, purpose and trace where audit or policy requires it.

### 97.6 Generated Code

Generated ORM mappings remain subordinate to the domain and database constraints.

---

## 98. ORM Guidance

The ORM should support:

- explicit schema mapping;
- optimistic concurrency;
- value objects;
- immutable version entities;
- partial updates;
- transactions;
- query projection;
- and migration integration.

Avoid:

- unrestricted lazy loading;
- automatic cascade delete across modules;
- implicit many-to-many tables without domain meaning;
- entity serialisation directly to APIs;
- and generic status conversion.

For high-volume response items, audit and analytical loading, purpose-built SQL or bulk interfaces may be preferable.

---

## 99. Stored Procedures and Database Functions

Stored procedures or functions may be used for:

- atomic idempotency registration;
- constrained Dataset Lock;
- partition maintenance;
- pseudonym generation;
- integrity validation;
- and carefully bounded administrative operations.

They should not hide broad domain logic that cannot be tested through module contracts.

Every stored routine has:

- owner;
- version;
- permission;
- migration;
- test;
- and audit behaviour.

Security-definer functions require specialist review.

---

## 100. Database Roles and Privileged Access

Representative roles:

- schema migration owner;
- application read/write by module;
- worker role;
- projection builder;
- analytical loader;
- read-only support;
- auditor;
- backup operator;
- and emergency administrator.

Application roles should not own tables.

Privileged access is:

- individually attributable;
- MFA-protected outside the database;
- time-limited where possible;
- network-restricted;
- audited;
- and reviewed.

Engineers do not receive routine unrestricted access to private Life Story, messages, reporter identity, Safety records or identifiable Dataset rows.

Emergency access does not create domain approval authority.

---

## 101. Data Residency and Routing

Every persisted data class has an approved residency profile.

Routing may depend on:

- Organisation;
- Research Project;
- Participant location or study site;
- Data Classification;
- purpose;
- external provider;
- and Consent.

Object, backup, Search, Vector and analytical stores must follow the same residency constraints as their source unless an approved transformation changes the classification.

Provider fallback cannot move data to an unauthorised region.

Cross-region replication is a processing activity and requires governance.

Residency metadata is stored in Integration, Dataset, object and deployment configuration records where relevant.


---

## 102. Performance, Capacity and Cost

### 102.1 Connection Pooling

Connection pools are sized by API, worker, migration and analytical workloads.

### 102.2 Query Monitoring

Monitor:

- latency;
- rows scanned;
- lock wait;
- deadlock;
- cache hit;
- index use;
- replication lag;
- and statement error.

### 102.3 N+1 Prevention

Repository and query design avoids repeated cross-module or per-row queries.

### 102.4 Write Amplification

Version history, audit, indexes and projections are assessed for write cost.

### 102.5 Object Cost

Storage-class transition and derivative retention reflect access frequency and research obligations.

### 102.6 Search and Vector Cost

Indexing and embedding are limited to approved use cases and current source versions.

### 102.7 Analytical Offloading

Heavy scans and statistical workloads run outside the operational database.

### 102.8 Capacity Model

Capacity planning includes:

- Participant count;
- Research Project count;
- assessment frequency;
- Message and Social Post volume;
- Life Story media size;
- AI Interaction retention;
- audit growth;
- Dataset generation;
- and backup retention.

### 102.9 Compression

Compression may be used for objects, analytical files, audit partitions and archived data where restore and query behaviour remain acceptable.

### 102.10 Cost Guardrails

Cost monitoring distinguishes:

- relational storage;
- provisioned compute;
- object storage and egress;
- backup;
- Search and Vector;
- analytics;
- and provider processing.

---

## 103. Storage Observability

Operational metrics include:

- database availability;
- connection saturation;
- query latency;
- lock and deadlock;
- transaction rollback;
- replication lag;
- backup age;
- restore-test result;
- object access and checksum failure;
- queue depth;
- outbox age;
- dead-letter count;
- cache invalidation failure;
- Search and Vector lag;
- Dataset generation duration;
- and analytical storage use.

Domain-critical storage metrics include:

- Consent projection staleness;
- Block propagation delay;
- duplicate active Connection attempt;
- message delivery-state mismatch;
- SafetySignal routing age;
- moderation backlog;
- public takedown propagation;
- AI memory deletion failure;
- DatasetLock readiness failure;
- lineage gaps;
- export checksum failure;
- and deletion-provider mismatch.

Logs avoid full sensitive values.

Storage traces connect command, transaction, outbox, job, object, provider and audit.

---

## 104. Storage Failure Modes

### 104.1 Primary Database Unavailable

Writes pause.

Clients receive accurate temporary failure.

No local client or cache write is represented as committed.

### 104.2 Read Replica Stale

Critical permission, Consent, Block, Connection, Safety and DatasetLock reads use the primary or a freshness-guaranteed path.

### 104.3 Object Storage Unavailable

Metadata may remain available, but upload, download, transformation and export report failure or pending state.

### 104.4 Queue Unavailable

A write continues only if required asynchronous safeguards can be safely delayed and the outbox remains durable.

### 104.5 Cache Unavailable

Authoritative database queries continue where capacity permits.

### 104.6 Search or Vector Unavailable

Structured navigation and direct authorised queries continue.

### 104.7 Analytical Store Unavailable

Operational intervention delivery continues.

Dataset and Analysis work remains pending.

### 104.8 Backup Failure

Immediate operational alert and remediation are required according to recovery risk.

### 104.9 Encryption or Key Service Failure

Sensitive reads or writes that require key access fail closed.

### 104.10 Deletion Propagation Failure

A tracked remediation record and privacy review are created.

### 104.11 Public Delivery Failure

The Platform does not claim content is published or removed until the relevant delivery state is confirmed.

---

## 105. Data Corruption Response

Potential corruption triggers include:

- checksum mismatch;
- invalid foreign-key relationship;
- impossible state combination;
- version regression;
- missing object;
- duplicate active authority record;
- Dataset manifest mismatch;
- Analysis artefact mismatch;
- and audit gap.

Response includes:

```text
Detect
    ↓
Contain Affected Writes
    ↓
Preserve Evidence
    ↓
Identify Source and Scope
    ↓
Restore, Reconstruct or Correct
    ↓
Reconcile Derived Stores
    ↓
Assess Participant and Research Impact
    ↓
Document and Prevent Recurrence
```

Corruption response must evaluate:

- Consent and permission;
- Participant-facing content;
- public exposure;
- matching and messaging;
- Safety and moderation;
- Dataset and Analysis;
- reports and external submissions;
- and backup integrity.

A corrupted approved artefact is not silently replaced without versioned corrective action.

---

## 106. MVP Relational Database Scope

The MVP implements relational storage for all M01–M18 logical boundaries at the depth required by the first vertical slice.

### M01–M03

- UserAccount;
- Organisation and membership;
- RoleAssignment;
- ParticipantProfile and AccessibilityProfile;
- Relationship and Delegation;
- Consent, scope, restriction, evidence and withdrawal;
- PolicyDecision and invalidation.

### M04–M09

- ResearchProject and ResearchQuestion;
- Protocol and ProtocolVersion;
- screening, eligibility and Enrolment;
- Intervention and InterventionVersion;
- InterventionConfiguration and InterventionDecision;
- Assignment, Session, Exposure, Adaptation and Fidelity;
- Assessment, Observation and Outcome;
- SafetySignal, triage, SafetyEvent and SafetyAction.

### M10–M16

- KnowledgeReference;
- EvidenceReview, EvidenceDecision and EvidenceSnapshot;
- ReferenceChangeAlert and ResearchKnowledgeGap;
- AIConversation, AIInteraction, tool and memory records;
- DatasetDefinition, DatasetVersion, quality review and DatasetLock;
- AnalysisPlan, AnalysisRun, output, InterpretationRecord and ResearchFinding;
- Report, ExportRequest, EvidencePackage and ExternalSubmission;
- ApprovalRecord, AuditEvent and GovernanceReview;
- Integration, Operation, outbox, inbox and job state.

### M17–M18

- LifeStoryArchive, item version, contribution, visibility and export;
- LegacyPreference where approved;
- PublicProfile;
- CommunitySpace, membership and SocialPost;
- MatchPreference, MatchCandidate, MatchExplanation and MatchDecision;
- MutualAcceptance and Connection;
- ConversationThread and Message;
- Mute, Disconnect and Block;
- UserReport, ContentReport, ModerationCase, ModerationDecision and Appeal.

---

## 107. MVP Object, Search and Vector Scope

### 107.1 Object Storage

The MVP supports private object storage for:

- Life Story media;
- Message attachments;
- evidence files;
- imports;
- exports;
- DatasetVersions;
- AnalysisOutputs;
- and reproducibility packages.

Message attachment objects remain quarantined until scan and validation complete.

### 107.2 Search

Search supports approved:

- PublicProfile;
- Community content;
- evidence metadata;
- Life Story metadata where permitted;
- research workspace metadata;
- and administrative records.

Private Message body is excluded.

ConversationThread may expose only permission-scoped metadata and safe summaries.

### 107.3 Vector

Vector retrieval is optional.

If enabled, it preserves source version, purpose, DataClassification, Visibility, Block state and deletion linkage.

Message body, moderation evidence, reporter identity, Safety details and hidden matching features are excluded by default.

### 107.4 Cache

Cache may store safe projections and short-lived permission results.

It is not authoritative for Consent, Block, MutualAcceptance, Connection, CommunicationBasis, Message send, Safety or DatasetLock.

### 107.5 Internet Public

Internet Public object delivery remains disabled by default.

---

## 108. MVP Analytical and Research Storage Scope

The MVP supports:

- approved DatasetDefinition;
- immutable DatasetVersion files;
- DatasetManifest and variable dictionary;
- data-quality review;
- human-authorised DatasetLock;
- approved AnalysisPlan;
- reproducible AnalysisRun;
- code and environment reference;
- AnalysisOutput;
- approved InterpretationRecord;
- ResearchFinding;
- and governed export.

The MVP may use one secure analytical environment.

Life Story, Community, matching, MutualAcceptance, Connection, ConversationThread, Message metadata and moderation data enter analytical storage only through explicit DatasetDefinition rules and current Consent or approved authority.

Message body is excluded from ordinary Pilot DatasetDefinitions.

A restricted Message-content DatasetDefinition requires:

- separate approved purpose;
- explicit Consent or lawful authority;
- minimisation;
- restricted variable definitions;
- restricted analytical environment;
- independent privacy review;
- and no general Search or Vector reuse.

---

## 109. MVP Storage Security and Operational Controls

The MVP includes:

- managed PostgreSQL or equivalent relational service;
- M01–M18 logical schema ownership;
- module-owned migrations;
- optimistic concurrency;
- database constraints for key invariants;
- encrypted storage;
- managed secrets and key references;
- selective field-level protection;
- object quarantine and malware scanning;
- private object delivery;
- transactional outbox;
- consumer idempotency;
- durable jobs;
- MutualAcceptance source and single-use constraints;
- Connection source constraint;
- CommunicationBasis validation;
- Thread participant constraints;
- Message Draft and delivery-state checks;
- provider-reference uniqueness;
- authenticated callback and replay storage;
- M16-to-M18 write separation;
- Block cancellation and propagation records;
- cache invalidation for Consent, Block, Visibility and communication state;
- Search source re-authorisation;
- Dataset and export checksums;
- automated backups;
- point-in-time recovery;
- restore testing;
- deletion propagation records;
- database access audit;
- performance monitoring;
- and data-quality checks.

Internet Public storage and delivery remain disabled by default.

Direct production database access is exceptional and audited.

---

## 110. MVP Storage Non-Goals

The MVP does not require:

- one physical database per module;
- distributed transactions;
- event sourcing for all aggregates;
- a graph database;
- a dedicated Vector database;
- a dedicated enterprise Search cluster;
- a data lake or data mesh;
- real-time streaming warehouse;
- multi-region active-active database;
- unrestricted analytical access;
- broad clinical-record persistence;
- real-time wearable ingestion;
- permanent public object URLs;
- hidden matching or vulnerability stores;
- direct ConnectionRequest activation;
- group or unrestricted messaging;
- Message-body Search, Vector or ordinary research indexing;
- automatic AI memory ingestion from Participant content;
- autonomous DatasetLock;
- or autonomous deletion without impact review.

---

## 111. Deferred Capabilities and Future Evolution

Deferred capabilities may include:

- independent module databases;
- Organisation-specific database isolation;
- regional sharding;
- dedicated audit ledger;
- dedicated Search and Vector clusters;
- secure research enclave;
- confidential computing;
- privacy-preserving record linkage;
- differential-privacy release;
- graph analytics for approved research;
- high-volume device lakehouse;
- real-time change streams;
- federated query;
- multi-site research storage;
- Participant-controlled data spaces;
- Community federation;
- portable Life Story packages;
- privacy-preserving matching;
- and advanced posthumous digital-legacy storage.

Future evolution must preserve:

- canonical identifiers;
- one write owner;
- current Consent and Block;
- Participant authorship and choices;
- public/private separation;
- Safety and moderation boundaries;
- immutable Dataset and Analysis lineage;
- audit;
- and reproducibility.

---

## 112. Open Questions

1. Which managed PostgreSQL-compatible service should be selected?
2. Should all M01–M18 modules use separate schemas from the first migration?
3. Which cross-schema foreign keys are required for the modular monolith?
4. Which critical invariants require database constraints or stored functions?
5. Should RLS be used for Organisation and ResearchProject isolation?
6. Which fields require application-level encryption?
7. Should private Message body use field encryption, object storage or database-native encryption?
8. Which Life Story media types are included?
9. Is Internet Public disabled throughout the Pilot?
10. Which PublicProfile fields are permitted?
11. Which LifeStoryItem states qualify as ParticipantTestimony?
12. Which third-party Life Story restrictions require separate encrypted storage?
13. Which matching attributes and derived features are allowed?
14. Which MatchCandidate uniqueness constraints apply across Communities?
15. What effective period applies to MutualAcceptance?
16. Which MutualAcceptance invalidation rules require database enforcement?
17. Should MutualAcceptance consumption and Connection activation use one transaction?
18. Which Connection uniqueness constraints apply?
19. When may ConnectionRequest database roles be enabled?
20. Which CommunicationBasis types are enabled?
21. How are polymorphic CommunicationBasis source references validated?
22. May one Thread have multiple active bases?
23. Are group ConversationThreads deferred?
24. Which Message formats and attachment types are enabled?
25. Which Message body storage strategy is selected?
26. Are read receipts disabled by default?
27. Which Message state transitions require database checks?
28. Which provider status maps to Delivered?
29. How long are provider callback records retained?
30. Which callback evidence fields require encryption?
31. Which retry and DeliveryUnknown rules apply?
32. Which queued deliveries can be cancelled after Block?
33. Which Block effects are synchronous and which use projection invalidation?
34. Which Message metadata may enter DatasetDefinitions?
35. Is Message body excluded from every first-Pilot DatasetDefinition?
36. Which reporter and moderation fields require field-level encryption?
37. Which Safety fields require a separate database role or schema?
38. Which AI prompt and response content is retained by default?
39. Which AIMemoryItem types are permitted?
40. Which object transformations and transcription providers are approved?
41. Which Search use cases require database full-text Search?
42. Is Vector retrieval required for Life Story?
43. Which Dataset format is canonical: Parquet, analytical tables or both?
44. Which secure analytical environment consumes locked DatasetVersions?
45. Which Analysis artefacts are retained for reproducibility?
46. Which records require partitioning before first Enrolment?
47. What are retention periods for Consent, Life Story, Messages, reports, AI, Safety and research records?
48. Which deletion targets use hard deletion, tombstone or archival?
49. How are provider deletion confirmations recorded?
50. What RPO and RTO apply to critical Participant controls?
51. Which restore tests must pass before Pilot launch?
52. Which residency constraints affect database, object, backup, Search, Vector and analytics?
53. Which direct database support actions require dual approval?
54. Which storage metrics become Pilot SLOs?
55. Which module is the first future extraction candidate?
56. Which stored routines are permitted?
57. Who approves schema changes affecting Consent, Visibility, matching, messaging, moderation, Safety or DatasetLock?

---

## 113. Design Decisions

This document establishes that:

1. Document 16 v1.2 is the authoritative Handbook source for database and storage design.
2. The primary operational system of record is relational.
3. The MVP uses one physical database with M01–M18 logical schemas.
4. Every aggregate has one accountable write-owning module.
5. Each module owns its tables, repositories and migrations.
6. Cross-module reads do not permit cross-module writes.
7. Clients, AI providers, notebooks and external systems do not access the transactional database directly.
8. Canonical identifiers are opaque, stable and non-semantic.
9. Independent state dimensions are not collapsed into one generic status.
10. Mutable aggregate roots use optimistic concurrency.
11. Multi-actor decisions do not use last-write-wins.
12. Approved and locked artefacts are immutable.
13. Strong consistency applies to Consent withdrawal, Block, MutualAcceptance, Connection activation, Message SendConfirmation, Safety disposition, DatasetLock and approval.
14. ParticipantProfile, PublicProfile and AIMemoryItem remain separate.
15. Relationship, MutualAcceptance, Connection and CommunicationBasis remain separate.
16. Connection does not create Supporter authority.
17. Open Matching is inactive by default.
18. MatchDecision is independently stored per actor and candidate version.
19. MutualAcceptance is a canonical M18 aggregate table set.
20. MutualAcceptance preserves exact source decisions or accepted ConnectionRequest.
21. MutualAcceptance source shape is constrained.
22. MutualAcceptance expiry and invalidation preserve history.
23. One MutualAcceptance activates at most one Connection.
24. MutualAcceptance consumption and Connection creation occur in one transaction.
25. ConnectionRequest is deferred and feature-disabled.
26. ConnectionRequest acceptance creates MutualAcceptance.
27. Connection has a non-null source MutualAcceptance.
28. Connection does not satisfy Relationship or Delegation foreign keys.
29. CommunicationBasis is stored as a validated basis type and source reference.
30. An active Thread requires an effective CommunicationBasis.
31. ConversationThread participants are explicit and time-bounded.
32. Thread participants cannot be silently added.
33. Message is a canonical M18 aggregate.
34. MessageVersion stores exact content and provenance.
35. Message Draft has no DeliveryAttempt.
36. SendConfirmation is actor-, version- and recipient-specific.
37. Message lifecycle and delivery state are separate.
38. Provider Accepted is not Delivered.
39. MessageDeliveryAttempt is separate from logical Message.
40. Provider-reference mapping is unique and auditable.
41. Raw callback evidence belongs to M16.
42. M16 roles cannot directly update M18 Message state.
43. Provider callbacks invoke M18 commands through the application boundary.
44. Retry creates another DeliveryAttempt, not another logical Message.
45. Cancellation and withdrawal do not claim external recall.
46. Message body is excluded from general Search and Vector.
47. Message body is excluded from ordinary research.
48. Restricted Message-content research requires separate DatasetDefinition and controls.
49. Message attachments require quarantine, scan and validation.
50. Mute, Disconnect and Block use separate records.
51. Block immediately prohibits matching, MutualAcceptance, Connection, Thread creation and Message send.
52. Block propagation covers Search, Vector, queue, provider, Notification and AI Context.
53. Block revocation does not restore previous state.
54. Reporter identity is restricted.
55. ModerationDecision is human-accountable and immutable.
56. SafetySignal and SafetyEvent use separate tables.
57. Automated processes cannot insert confirmed SafetyEvent outside the command path.
58. Domain Events and Integration Events are stored distinctly from UX Analytics and Operational Events.
59. Transactional outbox coordinates aggregate state and event publication.
60. Canonical event names follow Document 8 v3.2 and Document 15 v1.2.
61. Deprecated event aliases are translated explicitly.
62. Consumer inbox or equivalent protects idempotency.
63. Dead-letter replay is governed and audited.
64. Jobs revalidate time-sensitive authority.
65. Notification is distinct from Message.
66. M16 owns provider adapter, callback and reconciliation storage only.
67. Operational and analytical storage remain separate.
68. Analytical users do not receive production credentials.
69. DatasetDefinition precedes DatasetVersion generation.
70. DatasetLock is governed and immutable.
71. AnalysisRun references approved AnalysisPlan and locked DatasetVersion.
72. LifeStoryItem uses stable roots and versioned content.
73. ParticipantTestimony is explicit.
74. AI Draft and Supporter contribution do not automatically become ParticipantTestimony.
75. Platform Public and Internet Public are separate storage paths.
76. Internet Public is disabled by default.
77. Objects are private by default.
78. Search documents are derived and re-authorised.
79. Vector records preserve source version, purpose, classification and deletion state.
80. Cache is not authoritative for Consent, Block, MutualAcceptance, CommunicationBasis, Message send, Safety or DatasetLock.
81. JSON is used selectively and validated.
82. Database constraints reinforce stable storage-local invariants.
83. RLS may provide defence in depth but does not replace application policy.
84. Encryption does not create permission.
85. Pseudonymisation does not make data anonymous.
86. Public Visibility does not make data de-identified.
87. Missingness and imputation are explicit.
88. Retention does not preserve current Visibility or permission.
89. Deletion and withdrawal propagate to derived stores and providers.
90. Sender-side Message deletion does not imply recipient deletion.
91. Locked DatasetVersions are not silently edited during deletion.
92. Backups cover Consent, audit, Life Story, M18 social state and research-critical artefacts.
93. Restore reconciles withdrawn Consent, Block, public takedown, Message cancellation and deletion.
94. Migrations are version-controlled and module-owned.
95. Production identifiable data are not copied to lower environments without approval.
96. Direct production database access is exceptional and audited.
97. Heavy analytical workloads do not run against operational tables.
98. Storage observability includes MutualAcceptance, Message delivery, Block propagation and lineage metrics.
99. Supporting-store failure does not fabricate completion.
100. The MVP includes storage for MutualAcceptance, CommunicationBasis, ConversationThread, Message, DeliveryAttempt and callback evidence.
101. Direct ConnectionRequest activation, unrestricted messaging and Message-content indexing are deferred.
102. Version 1.2 completes storage revalidation against Documents 8 v3.2, 12 v1.2, 13 v1.2 and 15 v1.2.

---

## 114. Summary

The Database & Storage Design implements the Platform through:

```text
M01–M18 Domain Modules
        ↓
Module-Owned Relational Schemas
        ├── Versioned Domain Records
        ├── Consent, Visibility and Block
        ├── MutualAcceptance and Connection
        ├── ConversationThread and Message
        ├── Safety, Moderation and Governance
        ├── Dataset, Analysis and Research Lineage
        └── Audit, Outbox, Inbox and Operations
        │
        ├── Private Object and Media Storage
        ├── Search and Optional Vector Projections
        ├── Governed Analytical Environment
        └── Backup and Archive
```

The canonical M18 persistence path is:

```text
match_decisions
        ↓
mutual_acceptances
        ↓
connections
        ↓
communication_basis_evaluations
        ↓
conversation_threads
        ↓
messages and message_versions
        ↓
message_send_confirmations
        ↓
message_delivery_attempts
        ↓
M16 callback evidence and reconciliation
        ↓
M18 canonical delivery state
```

The central authority path is:

```text
Authenticated Domain Command
        ↓
Current Permission and State Validation
        ↓
Owning-Module Transaction
        ↓
Database Constraints and Version Check
        ↓
State and Outbox Commit
        ↓
Derived-Store and Provider Propagation
        ↓
Reconciliation, Audit and Lineage
```

The central rule is:

> A database row, object, index entry, embedding, cache value, analytical copy or provider record never acquires more authority than the current domain, Consent, purpose, Visibility, Block, CommunicationBasis and governance rules allow.

The MVP implements a small, rigorous storage foundation capable of supporting Life Story, governed Community, Open Matching, MutualAcceptance, Connection, limited messaging and reproducible research without sacrificing Participant autonomy.
