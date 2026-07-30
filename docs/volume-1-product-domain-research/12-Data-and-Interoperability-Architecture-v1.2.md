# Document 12 — Data & Interoperability Architecture

**Version:** 1.2  
**Status:** Revised Data and Interoperability Baseline — M18 Formation and Messaging Revalidated  
**Handbook Volume:** Volume I — Product, Domain & Research Architecture  
**Primary System:** Digital Intervention Research Platform  
**Primary Product Modules:** M01–M18  
**Document Owner:** Data, Interoperability and Research Governance  
**Approved By:** To be assigned  
**Last Updated:** 2026-07-28  
**Supersedes:** Document 12 — Data & Interoperability Architecture v1.1  
**Review Trigger:** A material change to domain ownership, Participant data, Consent or purpose enforcement, Life Story, Community, Open Matching, MatchDecision, MutualAcceptance, ConnectionRequest, Connection, CommunicationBasis, ConversationThread, Message lifecycle or delivery state, Block, moderation, SafetySignal or SafetyEvent, AIInteraction or AIMemoryItem data, EvidenceSnapshot, DatasetDefinition or DatasetLock, event mapping, data lineage, interoperability standards, external integrations, device data, retention, deletion or export requirements

---

## 1. Purpose

This document defines the **Data & Interoperability Architecture** of the **Healthy Aging Digital Intervention Research Platform**.

Its purpose is to establish how the platform represents, exchanges, protects, traces, and governs data required to:

- design digital interventions;
- enrol and support Participants;
- deliver interventions;
- record assessments, observations, outcomes, Safety Signals, Safety Events and moderation decisions;
- operate Participant-controlled Life Story and Personal Archive capabilities;
- operate Governed Community, controlled Platform Public participation, Open Matching, Connections and messaging;
- evaluate outcomes and implementation;
- operate the AI Companion;
- integrate with the Healthy Aging Knowledge Platform;
- connect with external care, research, community, and device systems;
- produce governed Dataset Definitions, versioned datasets, Dataset Locks and reproducible analyses;
- preserve authorship, visibility, research-use, publication and legacy boundaries;
- and support reporting, export, external submission, portability and future federation.

The architecture is designed for a **research platform that delivers and evaluates digital interventions**.

It is not intended to become:

- a general-purpose electronic health record;
- an uncontrolled data lake;
- a duplicate of the Healthy Aging Knowledge Platform;
- a generic customer-data platform;
- a surveillance system;
- an unrestricted social graph or advertising profile;
- a hidden vulnerability, capacity or compatibility scoring system;
- or a repository that collects data without a defined research, intervention, safety, moderation, governance, or operational purpose.

The central architectural requirement is:

> Every material data element must have a defined meaning, accountable write owner, purpose, provenance, consent and permission context, Data Classification, visibility where applicable, Resource State, lifecycle, retention rule, and relationship to the research or intervention workflow.

---

## 2. Scope

This document covers:

- data domains and ownership;
- canonical data models;
- Research Platform and Participant data boundaries;
- identifiers and identity resolution;
- relationship, Connection, block and identity boundaries;
- consent, purpose, Specific Permission and Resource State enforcement;
- operational, analytical, and research data;
- data lineage and provenance;
- interoperability patterns;
- APIs, events, files, and batch exchange;
- terminology and semantic consistency;
- external system integration;
- assessment and outcome data;
- Life Story, personal archive, contribution, sharing and Legacy Preference data;
- Public Profile, Community Space, Social Post, Comment and reaction data;
- Match Preference, Match Candidate, Match Explanation, Match Decision, introduction and Connection data;
- message, block, mute, disconnect, User Report, Content Report and Moderation Case data;
- Safety Signal, Safety Event, Privacy Review and AI Incident data;
- AI-generated and AI-derived data;
- device, wearable, and sensor data;
- qualitative and multimedia data;
- data quality;
- de-identification and pseudonymisation;
- Dataset Definition, generation, quality review, versioning, locking and lineage;
- analysis input and output lineage;
- visibility, publication, quotation, re-sharing and research-use boundaries;
- retention, archival, export, portability, deletion and legal hold;
- security and audit requirements;
- failure and degraded modes;
- MVP boundaries and future evolution.

This document does not define:

- final physical database schemas;
- cloud-provider configuration;
- final infrastructure topology;
- complete API contracts;
- final event payloads;
- jurisdiction-specific legal advice;
- external system procurement;
- full cybersecurity architecture;
- final statistical analysis methods;
- or the internal ontology of the Healthy Aging Knowledge Platform.

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
- Document 15 — API, Event & Integration Specifications v1.2 — cross-validated for interface and event contracts
- Documents 0–20 Handbook Consistency Review v1.0

### Provides input to

- Technical Architecture
- Security & Privacy Architecture
- API Specifications
- Event Catalogue
- Database Design
- Data Dictionary
- Analytics Architecture
- AI Data Pipeline Design
- Device and Wearable Integration
- Research Export Design
- Data Governance Policy
- Document 13 — System Context & Technical Architecture revision
- Document 14 — Security, Privacy & Consent Architecture revision
- Document 15 — API, Event & Integration Specifications revision
- Document 16 — Database & Storage Design revision
- Document 17 — AI Orchestration & Model Operations revision
- Document 18 — MVP Scope & Delivery Roadmap revision
- Document 19 — Initial Pilot Research Protocol revision
- Document 20 — UX Flows & Design System Specification revision
- MVP Delivery Plan

---

This document refines but does not redefine the canonical aggregate ownership, domain language, permission model, intervention architecture, evidence architecture, AI architecture or research lifecycle established by Documents 0–11.

### 3.1 v1.2 Revalidation Result

Version 1.2 revalidates the data architecture against:

- Document 8 v3.2 for canonical M18 ownership and language; and
- Document 15 v1.2 for resources, commands, events, provider callbacks and interoperability contracts.

The canonical M18 data lineage is:

```text
MatchPreference
        ↓
MatchCandidate
        ↓
Independent MatchDecision by Each Actor
        ↓
MutualAcceptance
        ↓
Connection
        ↓
CommunicationBasis
        ↓
ConversationThread
        ↓
Message Draft
        ↓
SendConfirmation
        ↓
DeliveryAttempts and Delivery State
```

`ConnectionRequest` remains a Deferred Alternative Connection Basis and is feature-disabled for the first Pilot.

---

## 4. Architectural Position

The Research Platform operates across explicit authority and data boundaries.

```text
Participants, Supporters, Professional Caregivers,
Researchers, Reviewers, Moderators, Organisations and Devices
                         │
                         ▼
Digital Intervention Research Platform
                         │
                         ├── Identity, Role and Organisation Data
                         ├── Participant Profile, Relationship and Consent Data
                         ├── Research Project and Protocol Data
                         ├── Intervention Delivery and Exposure Data
                         ├── Life Story and Personal Archive Data
                         ├── Governed Community, Platform Public and Matching Data
                         ├── Messaging, Block, Report and Moderation Data
                         ├── Assessment, Observation and Outcome Data
                         ├── Safety, Privacy and Governance Data
                         ├── AI Interaction, Memory and Evaluation Data
                         ├── Dataset, Analysis and Finding Data
                         ├── Audit, Provenance and Lineage Data
                         └── Knowledge References and Evidence Snapshots
                         │
                         ├──────────────► Healthy Aging Knowledge Platform
                         ├──────────────► External Care or Research Systems
                         ├──────────────► External Community and Service Systems
                         ├──────────────► Identity and Communication Providers
                         └──────────────► Devices, Wearables and Sensors
```

The Research Platform owns the data required to operate and evaluate its research and intervention workflows.

The Healthy Aging Knowledge Platform remains authoritative for curated evidence, theory, mechanisms, Outcome Definitions, Measurement Definitions, ontology, provenance and Knowledge Publication.

External systems remain authoritative for the source data they own.

The platform must preserve source attribution and must not silently:

- treat imported data as platform-originated data;
- treat publicly visible content as unrestricted data;
- treat a Connection as a Supporter relationship;
- treat AI inference as Participant testimony or fact;
- or treat an analytical dataset as the operational source of truth.

### 4.1 Authority, Visibility and Use Are Separate

```text
Data Authority
≠ Data Classification
≠ Visibility
≠ Consent
≠ Purpose of Use
≠ Research Inclusion
≠ Publication Permission
```

A Social Post may be Platform Public but still contain personal data, remain subject to Community Rules, and lack permission for research analysis, model training, quotation, Internet publication, or external redistribution.

### 4.2 One Accountable Write Owner

Every material aggregate has one owning bounded context and product module. Other modules may hold:

- identifiers;
- references;
- projections;
- caches;
- read models;
- snapshots;
- or approved analytical copies.

They do not gain authority to mutate the source aggregate.

### 4.3 Operational and Research Representations

Operational records answer what the platform currently does.

Research datasets answer a defined research question using approved inclusion, transformation, de-identification and quality rules.

An operational record is not silently rewritten by a research transformation, and a research dataset is not used as an operational write model.

## 5. Design Principles

### 5.1 Purpose Before Collection

Data should only be collected for an explicit intervention, research, safety, governance, or operational purpose.

### 5.2 Participant Before Dataset

Participants are not merely data sources.

The platform must preserve consent, dignity, context, withdrawal rights, and understandable data-use boundaries.

### 5.3 Domain Meaning Before Storage

The meaning of an entity or field must be defined before choosing its physical storage representation.

### 5.4 Provenance by Default

Every material record should preserve:

- source;
- actor;
- time;
- method;
- context;
- transformation;
- and version.

### 5.5 Separation of Data Domains

Operational, research, analytical, audit, AI, and external knowledge data must remain distinguishable.

### 5.6 References Before Duplication

External knowledge and external system records should be referenced where possible and copied only when operationally, legally, or scientifically necessary.

### 5.7 Minimum Necessary Access

Users and services should receive only the data required for their authorised purpose.

### 5.8 Interoperability Without Domain Surrender

The platform should map to external standards without allowing external schemas to replace its core domain language.

### 5.9 Reproducibility

Research datasets, transformations, analyses, and exports must be versioned and reconstructable.

### 5.10 Transparent Derivation

Derived, inferred, summarised, scored, and AI-generated data must remain distinguishable from observed or reported data.

### 5.11 Graceful Degradation

Integration failure must not silently corrupt records or create false certainty.

### 5.12 Evolution Without Historical Loss

Schemas and standards may change, but historical research records must remain interpretable.

### 5.13 Permission Before Context

Permission and purpose filtering occur before data are assembled for a user, API response, AI model, export, event consumer or analytical process.

### 5.14 Visibility Is Not Classification

Private, Selected People, Connections, Community, Platform Public and Internet Public are visibility scopes. They do not replace Data Classification or define research-use rights.

### 5.15 Participant-Controlled Content

Life Story, Public Profile, Social Post, message, Match Preference and other identity-bearing content preserve Participant control, authorship, contribution, visibility, reuse, withdrawal and third-party rights.

### 5.16 State Dimensions Remain Separate

Lifecycle state, approval state, review state, visibility, verification, resolution, quality, retention, moderation, safety and external-submission state are represented independently.

### 5.17 Safety and Moderation Separation

SafetySignal, SafetyEvent, UserReport, ContentReport, ModerationCase, ModerationDecision, Privacy Review, AIIncident and Technical Incident may be linked but must not be collapsed.

### 5.18 Data Product Before Export

Every governed research extract is produced from an approved DatasetDefinition and exact source lineage. A convenient query result is not automatically a research dataset.

### 5.19 Human Accountability for High-Impact Data Decisions

AI may assist mapping, classification, redaction, quality review and transformation. It cannot autonomously merge identities, grant data use, lock a DatasetVersion, approve an export, determine a SafetyEvent, impose a high-impact moderation action, or publish knowledge.

---

## 6. Data Architecture Overview

The platform separates data into logical domains aligned to Documents 6 and 8.

```text
M01 Identity and Organisation
        │
M02 Participant Profile and Preferences
        │
M03 Relationship, Consent and Permission
        │
M04 Research Project and Protocol
        │
M05 Recruitment, Screening and Enrolment
        │
M06 Intervention Portfolio and Configuration
        │
M07 Intervention Delivery and Exposure
        │
M08 Assessment, Observation and Outcome
        │
M09 Safety and Escalation
        │
M10 Evidence and Knowledge Integration
        │
M11 AI Companion
        │
M12 Dataset and Data Quality
        │
M13 Analysis, Interpretation and Findings
        │
M14 Reporting and External Submission
        │
M15 Governance and Audit
        │
M16 Integration and Operations
        │
M17 Life Story and Personal Archive
        │
M18 Community, Social Connection and Open Matching
```

These domains may share infrastructure in the MVP.

They remain logically distinct even when physically stored in the same database or object store.

### 6.1 Data Planes

| Plane | Purpose |
|---|---|
| Operational | current domain state and workflow execution |
| Content | Participant-controlled text, media, Life Story and social content |
| Research | purpose-bound collected research records |
| Analytical | Dataset Versions, transformations, features and analysis outputs |
| Governance | consent, policy, review, approval, moderation, safety and audit |
| AI | AI interactions, context, retrieval, tools, memory, evaluations and incidents |
| Integration | external identifiers, import records, mappings, events and exchange state |
| Knowledge Reference | external authoritative references and immutable evidence snapshots |

### 6.2 Storage Does Not Define Ownership

A relational database, object store, search index, vector index, analytics store or cache may hold a representation of an aggregate.

The bounded context remains the authority regardless of physical storage.

## 7. Data Domain Classification

### 7.1 Identity, Organisation and Access Data
- UserAccount;
- AuthenticationIdentity;
- Organisation;
- OrganisationMembership;
- RoleAssignment;
- ServiceAccount;
- session and credential metadata;
- access-policy references;
- and account lifecycle state.

### 7.2 Participant Profile and Preference Data
- ParticipantProfile;
- contact and communication preferences;
- AccessibilityProfile and AccessibilityPreference;
- language;
- device and connectivity context;
- declared interests;
- notification preferences;
- approved support needs;
- and source-labelled profile attributes.

### 7.3 Relationship, Consent and Permission Data
- Relationship;
- Delegation;
- supported-decision-making record;
- substitute-authority verification;
- Consent;
- ConsentVersion;
- purpose;
- Specific Permission;
- Resource State;
- PolicyDecision;
- and permission-audit evidence.

### 7.4 Research Design and Participation Data
- ResearchProject;
- ResearchQuestion;
- Protocol;
- ProtocolVersion;
- ScreeningRecord;
- EligibilityDecision;
- Enrolment;
- RecruitmentInvitation;
- WithdrawalRecord;
- cohort and arm references;
- and approval records.

### 7.5 Intervention Portfolio and Delivery Data
- Intervention;
- InterventionVersion;
- InterventionConfiguration;
- InterventionAssignment;
- InterventionSession;
- ExposureRecord;
- FidelityRecord;
- InterventionAdaptationRecord;
- DeliveryDeviation;
- and InterventionDecision.

### 7.6 Assessment, Observation and Outcome Data
- AssessmentSchedule;
- AssessmentRecord;
- AssessmentResponse;
- AssessmentScore;
- Observation;
- OutcomeRecord;
- MeasurementVersion reference;
- assistance and adaptation;
- and quality flags.

### 7.7 Life Story and Personal Archive Data
- LifeStoryArchive;
- LifeStoryItem;
- LifeStoryItemVersion;
- LifeStoryContribution;
- contributor attribution;
- Participant Testimony confirmation;
- media asset and transcript;
- sharing and visibility settings;
- quotation, download, re-sharing and research-use choices;
- export;
- withdrawal;
- and LegacyPreference.

### 7.8 Community, Social Connection and Matching Data
- PublicProfile;
- CommunitySpace;
- CommunityMembership;
- CommunityRuleVersion;
- SocialPost;
- Comment;
- Reaction;
- MatchPreference;
- MatchCandidate;
- MatchExplanation;
- MatchDecision;
- MutualAcceptance;
- deferred ConnectionRequest;
- MatchIntroduction;
- Connection;
- ConnectionStateChange;
- and approved ranking, candidate-generation, fairness or policy metadata.

### 7.9 Conversation, Messaging, Blocking, Reporting and Moderation Data
- CommunicationBasis;
- ConversationThread;
- ThreadParticipant;
- Message;
- MessageVersion;
- SendConfirmation;
- MessageAttachment;
- MessageDeliveryAttempt;
- MessageDeliveryState;
- MessageReceipt where enabled;
- MuteRecord;
- BlockRecord;
- DisconnectRecord;
- UserReport;
- ContentReport;
- ModerationCase;
- ModerationEvidence;
- ModerationDecision;
- ModerationAction;
- Appeal;
- and RestorationReview.

### 7.10 Safety, Privacy and Governance Data
- SafetySignal;
- SafetyEvent;
- SafetyAction;
- SafetyReview;
- stopping-rule decision;
- PrivacyReview;
- privacy incident;
- Protocol deviation;
- governance review;
- ApprovalRecord;
- ConflictOfInterestRecord;
- PolicyDecision;
- and AuditEvent.

### 7.11 Evidence and Knowledge Reference Data
- KnowledgeReference;
- EvidenceReview;
- EvidenceDecision;
- EvidenceSnapshot;
- ResearchKnowledgeGap;
- KnowledgeGapReference;
- ReferenceChangeAlert;
- CitationRecord;
- and external provenance.

### 7.12 AI Data
- AIConversation;
- AIInteraction;
- AIRequest;
- AIResponse;
- AIContextRecord;
- AIRetrievalRecord;
- AIToolInvocation;
- AIActionProposal;
- AIActionRecord;
- AIReviewRecord;
- AIMemoryItem;
- AIAdaptationRecord;
- AIEvaluationRecord;
- AIInterventionConfigurationVersion reference;
- AISafetySignalRaised event;
- and AIIncident.

### 7.13 Dataset, Analysis and Finding Data
- DatasetDefinition;
- DatasetVersion;
- DatasetLock;
- DatasetManifest;
- VariableDefinition;
- DataQualityIssue;
- TransformationRun;
- AnalysisPlan;
- AnalysisRun;
- AnalysisOutput;
- AnalysisDiagnostic;
- InterpretationRecord;
- ResearchFinding;
- ReportVersion;
- EvidencePackage;
- ExternalSubmission;
- and ExternalPublicationReference.

### 7.14 Device, Wearable and Sensor Data
- Device;
- DeviceAssignment;
- sensor;
- MeasurementStream;
- sample;
- calibration;
- firmware;
- device event;
- device quality issue;
- and raw, cleaned, aggregated or derived values.

### 7.15 Audit, Provenance and Integration Data
- actor;
- action;
- purpose;
- time;
- object and exact version;
- source;
- transformation;
- permission and PolicyDecision;
- access event;
- IntegrationRecord;
- ExternalSystemReference;
- IdentifierMapping;
- import and export manifest;
- schema version;
- and correlation, causation and trace identifiers.

## 8. Data Ownership and Authority

### 8.1 Authority Matrix

| Data or Aggregate | Accountable Write Owner |
|---|---|
| UserAccount, Organisation, RoleAssignment | M01 |
| ParticipantProfile and AccessibilityPreference | M02 |
| Relationship, Consent, Delegation and PolicyDecision | M03 |
| ResearchProject, ResearchQuestion, ProtocolVersion | M04 |
| ScreeningRecord, EligibilityDecision and Enrolment | M05 |
| InterventionVersion, InterventionConfiguration and InterventionDecision | M06 |
| InterventionAssignment, InterventionSession and ExposureRecord | M07 |
| AssessmentRecord, Observation and OutcomeRecord | M08 |
| SafetySignal, SafetyEvent and SafetyAction | M09 |
| KnowledgeReference, EvidenceReview, EvidenceDecision and EvidenceSnapshot | M10 |
| AIConversation, AIInteraction and AIMemoryItem | M11 |
| DatasetDefinition, DatasetVersion, DatasetLock and DataQualityIssue | M12 |
| AnalysisPlan, AnalysisRun, InterpretationRecord and ResearchFinding | M13 |
| ReportVersion, ExportRequest, EvidencePackage and ExternalSubmission | M14 |
| ApprovalRecord, governance review and AuditEvent | M15 |
| IntegrationRecord, ExternalSystemReference and operational exchange state | M16 |
| LifeStoryArchive, LifeStoryItem, LifeStoryContribution and LegacyPreference | M17 |
| PublicProfile, CommunitySpace, SocialPost, MatchCandidate, Connection, Message, BlockRecord and ModerationCase | M18 |

### 8.2 Platform-Owned Data

The Research Platform is authoritative for its operational, research, content, governance, AI, dataset, analysis, reporting and audit records listed above.

Ownership does not imply unrestricted use. Every use remains subject to:

```text
Role
+ Relationship
+ Consent
+ Purpose
+ Context
+ Specific Permission
+ Resource State
```

### 8.3 Externally Authoritative Data
- curated evidence, ontology, theories, mechanisms and knowledge verification;
- external health and care records;
- laboratory or external clinical results;
- external Community and service directories;
- identity-provider accounts;
- device manufacturer records;
- communication-provider delivery state;
- external research registries;
- and externally curated publications.

### 8.4 Imported Data

Imported data preserve source system, source identifier and version, source authority, receipt time, import method, original-payload reference where permitted, canonical mapping, transformation, validation and quarantine state, local purpose, Data Classification, retention and source-unavailability behaviour.

### 8.5 Data Stewardship

Authority and stewardship are distinct. A Platform actor may curate, correct, map or steward an imported record without becoming its original authoritative source.

### 8.6 Participant-Authored and Participant-Controlled Data

Participant-authored or Participant-controlled data preserve:

- creator and contributor;
- authorship type;
- Participant confirmation;
- original and edited versions;
- AI, transcription or translation assistance;
- visibility and audience;
- sharing, quotation, download and re-sharing choices;
- research-use and external-publication choices;
- third-party rights;
- correction and dispute history;
- withdrawal, retention, export, deletion and legacy rules.

A Supporter contribution is not Participant Testimony until explicitly confirmed.

### 8.7 Derived and Analytical Authority

A derived variable, AI classification, search index, vector embedding, analytical projection or report table is authoritative only for its defined derived purpose. It does not replace the source record.

## 9. Canonical Domain Model

### 9.1 Purpose

The platform maintains a canonical domain model independent of physical storage, AI providers and external transport standards.

Document 8 remains authoritative for aggregate names, ownership, lifecycle and ubiquitous language.

### 9.2 Canonical Aggregate Roots

Representative aggregate roots include:

- UserAccount; Organisation; ParticipantProfile; Relationship; Consent;
- ResearchProject; ResearchQuestion; Protocol; ProtocolVersion;
- ScreeningRecord; EligibilityDecision; Enrolment;
- Intervention; InterventionVersion; InterventionConfiguration;
- InterventionAssignment; InterventionSession;
- AssessmentSchedule; AssessmentRecord; Observation; OutcomeRecord;
- SafetySignal; SafetyEvent;
- KnowledgeReference; EvidenceReview; EvidenceDecision; EvidenceSnapshot;
- ResearchKnowledgeGap; ReferenceChangeAlert;
- AIConversation; AIInteraction; AIInterventionConfiguration;
- AIInterventionConfigurationVersion; AIMemoryItem;
- DatasetDefinition; DatasetVersion; DataQualityIssue; TransformationRun;
- AnalysisPlan; AnalysisRun; InterpretationRecord; ResearchFinding;
- Report; ReportVersion; ExportRequest; ExternalSubmission; ApprovalRecord;
- LifeStoryArchive; LifeStoryItem; PublicProfile; CommunitySpace; SocialPost;
- MatchPreference; MatchCandidate; Connection; ConversationThread;
- BlockRecord; UserReport; ContentReport; ModerationCase;
- IntegrationRecord; Device; and MeasurementStream.

### 9.3 Important Entities

- DatasetLock; DatasetManifest; VariableDefinition;
- LifeStoryContribution; LifeStoryItemVersion; LegacyPreference;
- CommunityMembership; CommunityRule; Comment; Reaction;
- MatchExplanation; MatchDecision; MatchIntroduction; Message;
- ModerationEvidence; ModerationDecision; ModerationAction; Appeal;
- SafetyAction; SafetyReview;
- AIRequest; AIResponse; AIContextRecord; AIRetrievalRecord;
- AIToolInvocation; AIActionProposal; AIActionRecord; AIReviewRecord;
- AIAdaptationRecord; AIEvaluationRecord;
- AnalysisOutput; AnalysisDiagnostic; EvidencePackage;
- and ExternalPublicationReference.

### 9.4 Representative Value Objects

- PersonName; DateRange; TimeRange; ContactMethod;
- LanguagePreference; AccessibilityPreference;
- ExternalIdentifier; VersionReference; ConsentScope; PurposeOfUse;
- SpecificPermission; ResourceState; VisibilityScope; DataClassification;
- MeasurementValue; Unit; Timepoint; MissingDataReason; QualityFlag;
- ProvenanceRecord; RetrievalContext; InterventionDose;
- OutcomeDefinitionReference; MeasurementDefinitionReference;
- SafetySeverity; Seriousness; Expectedness; Relatedness;
- RetentionRule; DeIdentificationState; EpistemicType;
- GroundingStatus; and ScientificDirection.

### 9.5 Canonical Meaning

A canonical concept defines meaning, accountable write owner, aggregate or entity type, lifecycle and independent state dimensions, relationships, required and optional properties, invariants, transitions, Data Classification, retention, deletion, audit and external mappings.

Physical databases, search indexes, vector stores, APIs and events implement or project this model rather than redefine it.

### 9.6 No Generic Status

The model must not use one `status` field to mix lifecycle, review, approval, visibility, moderation, verification, quality, resolution, retention, delivery or external-publication state.

## 10. Identifiers

### 10.1 Identifier Principles

Identifiers should be:

- stable;
- opaque where possible;
- globally unique within their intended scope;
- independent of mutable attributes;
- non-semantic unless a domain standard requires semantics;
- and preserved across versions.

### 10.2 Platform Identifiers

Platform entities should have canonical identifiers such as:

- Research Project ID;
- Participant ID;
- Protocol ID;
- Protocol Version ID;
- Intervention ID;
- Intervention Version ID;
- Assessment Record ID;
- Dataset Definition ID;
- Dataset Version ID;
- Dataset Lock ID;
- Analysis Run ID;
- Life Story Item ID;
- Social Post ID;
- Match Candidate ID;
- Connection ID;
- Moderation Case ID;
- Research Finding ID;
- and Audit Event ID.

### 10.3 External Identifiers

External identifiers may include:

- source-system identifiers;
- standards-based identifiers;
- CURIEs;
- URIs;
- device identifiers;
- registry identifiers;
- or partner-system identifiers.

### 10.4 Identifier Mapping

The platform should maintain explicit mappings:

```text
Platform Identifier
        ↔
External System
        ↔
External Identifier
        ↔
Version
        ↔
Resolution Status
```

### 10.5 No Identifier Reuse

Identifiers should not be reused after deletion, retirement, or archival.

### 10.6 Human-Readable Codes

Human-readable codes may be used for display or workflow convenience.

They should not replace canonical identifiers.

### 10.7 Public and External Identifiers

Internet-facing handles, public-profile URLs, share tokens and external publication references must be distinct from internal canonical identifiers.

Public identifiers should be revocable where appropriate, non-sequential, resistant to enumeration, scoped to the intended audience and unable to reveal protected resource existence after withdrawal, block or restriction.

### 10.8 Third-Party and Content Identifiers

Media, messages, Life Story contributions and Social Posts may refer to multiple people.

Identifiers and attribution must not imply that every named or depicted person is a Platform Participant or has consented to every use.

---

## 11. Identity Resolution

### 11.1 Purpose

Identity resolution determines whether records refer to the same person, organisation, device, or external resource.

### 11.2 Person Matching

Person matching may use:

- explicit external identifier;
- verified account;
- invitation relationship;
- contact information;
- demographic attributes;
- or manual confirmation.

### 11.3 No Automatic High-Risk Merge

Potential matches should not be automatically merged when an error could:

- expose private information;
- corrupt research data;
- assign the wrong intervention;
- affect matching or messaging;
- bypass a Block Record;
- corrupt Life Story attribution;
- expose moderation or reporter information;
- or affect safety.

### 11.4 Merge Record

A merge should preserve:

- original identifiers;
- merged identifier;
- rationale;
- reviewer;
- date;
- affected records;
- and rollback capability.

### 11.5 Split Record

Incorrect merges should support governed separation.

### 11.6 No Social-Graph Identity Inference

A shared name, photograph, contact, Community membership, Life Story mention, Connection or communication pattern is not sufficient to merge identities.

### 11.7 Blocked Existence Protection

Identity and discovery services should not reveal protected existence, exact account state or alternative identifiers to a blocked actor.

---

## 12. Participant Profile Architecture

### 12.1 Purpose

A Participant profile supports intervention delivery and research participation without becoming a complete medical record.

### 12.2 Profile Categories

The profile may include:

- identity;
- contact;
- language;
- communication preference;
- accessibility preference;
- living environment;
- social context;
- authorised Relationship references;
- Connection references as a separate social construct;
- matching opt-in and declared matching preferences by reference;
- digital access;
- intervention preferences;
- research enrolment;
- and safety-relevant information.

### 12.3 Sensitive Data

Sensitive data should be collected only when necessary.

Examples may include:

- health or cognitive information where separately justified;
- separately verified substitute-authority information;
- disability or accessibility information;
- location;
- financial vulnerability;
- sensitive matching attributes;
- precise location;
- or relationship conflict.

### 12.4 Profile Source

Each profile element should identify whether it was:

- Participant-reported;
- Supporter-reported;
- Professional Caregiver- or researcher-recorded;
- imported;
- observed;
- derived;
- or AI-inferred.

### 12.5 Preference Before Inference

The platform should prefer explicit preferences over inferred assumptions.

### 12.6 Profile Versioning

Material profile changes should preserve history where relevant to research interpretation.

### 12.7 No General Ability, Capacity or Vulnerability Score

The platform must not derive one hidden score that claims to represent general ability, decision-making capacity, frailty, social vulnerability or susceptibility.

Task-specific accessibility needs and approved support requirements remain source-labelled and purpose-bound.

### 12.8 Profile versus AI Memory

ParticipantProfile is the authoritative profile record.

AIMemoryItem is an AI personalisation record with its own purpose, visibility, correction and retention rules. AI memory cannot silently become a profile attribute.

---

## 13. Relationship, Connection and Block Data

### 13.1 Relationship Types

Representative governed Relationship types include:

- Supporter;
- Informal Caregiver;
- Professional Caregiver;
- Substitute Decision-Maker;
- Research Staff relationship;
- Organisation Representative;
- and other approved relationship types.

Family or friendship context is descriptive and does not create authority.

### 13.2 Relationship Properties

A Relationship preserves source and target actors, type, status, verification, start and end time, applicable consent, purpose, Specific Permissions, context, Resource State, delegation or substitute authority where separately verified, and history.

### 13.3 Relationship Is Not Permission

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

### 13.4 Connection Is Not Relationship Authority

A `Connection` records a mutually accepted social connection within M18.

A Connection does not automatically create Supporter status, access to private Participant Profile data, access to Life Story items, research participation, consent, care authority, or messaging outside the approved communication basis.

### 13.5 Block Record

A BlockRecord is an authoritative M18 enforcement record.

It may affect people discovery, Match Candidate generation, public-profile visibility, Connection requests, messaging, notifications, mentions and content delivery.

Block enforcement occurs before search ranking, AI context assembly and tool execution.

### 13.6 Relationship and Connection Changes

Revocation, expiry, pause, disconnect and block take operational effect without deleting historically necessary research and audit context.

Historical records remain purpose-restricted and must not be used to recreate current access.

## 14. Consent Data Architecture

### 14.1 Consent as a Versioned Aggregate

Consent is a versioned domain aggregate owned by M03.

A consent decision applies to exact scope, purpose, data, actors, time, conditions and version.

### 14.2 Consent Scope

Consent may cover separately:

- research participation;
- intervention delivery;
- assessment and observation;
- device and sensor data;
- AI interaction;
- AIMemoryItem storage;
- voice, image or video recording;
- transcription and translation;
- Life Story capture;
- Supporter contribution;
- Life Story sharing;
- quotation, download and re-sharing;
- Community participation;
- Public Profile;
- Platform Public visibility;
- Internet Public visibility;
- Open Matching;
- matching attributes;
- introduction and messaging;
- data collection;
- research analysis;
- secondary research;
- external data sharing;
- Evidence Package or external submission;
- AI training or model improvement;
- future contact;
- and Legacy Preference.

These scopes are not interchangeable.

### 14.3 Consent Record

A Consent record preserves Consent ID and version, Participant, Consent Form version, purpose, scope, data categories and resources, granted choices, restrictions, recipients, effective times, withdrawal, decision Supporter, separately verified substitute authority, assent where applicable, method, accessible format, comprehension support, AI or translation assistance, and audit history.

### 14.4 Consent Evaluation

```text
Consent Version
+ Purpose
+ Resource
+ Data Category
+ Actor
+ Context
+ Time
+ Conditions
+ Resource State
```

### 14.5 Withdrawal and Revocation

Withdrawal should stop future use where required, update permissions and Resource State, propagate to search, matching, messaging, visibility, AI context and export controls, preserve effective time, distinguish different withdrawal types, identify locked-dataset implications, evaluate derived and external copies, preserve only permitted legal, safety, audit or scientific history, and provide understandable confirmation.

### 14.6 Re-Consent

A new Consent version may be required when Protocol or Intervention Version changes, purpose or recipients change, AI configuration or memory changes, Life Story sharing or Legacy Preference changes, public visibility expands, matching attributes or ranking change, messaging or moderation use changes, Internet Public publication is introduced, devices or retention change, external submission changes, or secondary use expands.

### 14.7 Consent Is Not Publication Approval

Consent may be necessary but is not sufficient for a governed publication, external submission, high-risk export or Internet Public action. Separate permission, purpose, content review and approval may also be required.

## 15. Purpose of Use

### 15.1 Purpose Categories

Representative purposes include account and identity operation, intervention delivery, Participant support, accessibility adaptation, Life Story creation and sharing, Community participation, Open Matching, Connection and messaging, moderation, safety, research, data-quality review, analysis, reporting, external submission, separately governed care coordination, quality improvement, system operations, security, audit, legal compliance and approved secondary research.

### 15.2 Purpose Binding

Data access, processing, AI context, event consumption, transformation, dataset inclusion and export are bound to a declared purpose.

### 15.3 Purpose Limitation

Examples:

- Community visibility does not create research permission.
- Life Story sharing does not create model-training permission.
- Matching preference does not create general personalisation permission.
- Safety review access does not create Community moderation access.
- A Supporter relationship does not create assessment access.
- A locked research dataset does not create operational messaging authority.

### 15.4 Purpose Record

A purpose record preserves purpose code and version, description, owner, legal or governance basis, permitted data, actors and systems, compatible consent, transformations, outputs, retention, prohibitions and review trigger.

### 15.5 Secondary Use

Secondary use requires a new or compatible approved purpose, consent or other authorised basis, governance review, minimisation, dataset or export definition, de-identification review and traceable approval.

A data lake, analytics access or public visibility does not create secondary-use authority.

## 16. Data Classification, Visibility and Sensitivity

### 16.1 Data Classification Levels

- Public Information;
- Internal;
- Confidential;
- Sensitive Personal Data;
- Highly Sensitive Personal Data;
- Restricted Research Data;
- Safety-Restricted;
- Moderation-Restricted;
- and Secret or Credential Data.

### 16.2 Classification Factors

Classification considers identifiability, health or cognitive relevance, emotional and Life Story sensitivity, relationship and social sensitivity, location, message privacy, matching sensitivity, reporter confidentiality, safety impact, legal restriction, re-identification risk, third-party rights and Participant expectation.

### 16.3 Visibility Scope

- Private;
- Selected People;
- Connections;
- Community;
- Platform Public;
- Internet Public.

Visibility does not determine classification, research permission or external redistribution rights.

### 16.4 Representative Examples

| Data | Typical Classification | Possible Visibility |
|---|---|---|
| Public intervention description | Public Information | Platform Public or Internet Public |
| Internal Research Project phase | Internal | Restricted workspace |
| De-identified research summary | Confidential | Approved recipients |
| Participant assessment | Sensitive Personal Data | Private or authorised research roles |
| Consent, Relationship or Match Preference | Highly Sensitive Personal Data | Private |
| Private Life Story with third-party details | Highly Sensitive Personal Data | Private or Selected People |
| SocialPost with Platform Public Visibility | Sensitive or Confidential depending on content | Platform Public |
| Reporter identity | Moderation-Restricted | Authorised reviewers only |
| Safety Event detail | Safety-Restricted | Authorised safety roles |
| Credentials or linkage keys | Secret or Credential Data | No user-facing visibility |

### 16.5 Handling Rules

Classification and visibility influence access, masking, encryption, indexing, search existence protection, AI context, event payload, caching, logging, export, retention, deletion, approval and incident response.

### 16.6 Public Does Not Mean Anonymous

Platform Public or Internet Public content may remain identifiable personal data and may expose third parties.

The platform must not describe such content as anonymous merely because it is visible.

## 17. Operational Data

### 17.1 Purpose

Operational data supports current platform behaviour.

Examples include:

- active enrolment;
- upcoming session;
- current consent;
- intervention schedule;
- notification preference;
- task status;
- current assignment;
- current Life Story visibility;
- matching status;
- active Connections, blocks and messaging basis;
- active moderation restrictions;
- and current Safety or privacy restrictions.

### 17.2 Operational Truth

Operational records should represent the current approved state.

### 17.3 Historical State

Historical changes should remain available through version or audit records.

### 17.4 Transactional Consistency

Transactional consistency should be enforced within aggregate boundaries.

---

## 18. Research Data

### 18.1 Purpose

Research data support analysis, interpretation, and findings.

### 18.2 Research Data Categories

Research data may include:

- screening data;
- baseline data;
- intervention exposure;
- assessments;
- observations;
- outcomes;
- process measures;
- safety data;
- qualitative data;
- device data;
- AI interaction data;
- Life Story and contribution data where authorised;
- Community, public-social, matching, Connection and message data where authorised;
- moderation and report data;
- Safety Signal and Safety Event data;
- and implementation data.

### 18.3 Research Context

Every research record should identify:

- Research Project;
- Protocol Version;
- Participant or study unit;
- collection time;
- source;
- purpose;
- consent or other approved basis;
- Data Classification;
- source Resource State;
- and provenance.

### 18.4 Protocol Linkage

Research data should remain linked to the Protocol Version under which it was collected.

### 18.5 Research Data Lock

Governed analysis data are created through an approved DatasetDefinition, a generated DatasetVersion, quality review and DatasetLock. Operational records are not locked in place.

---

## 19. Intervention Data

### 19.1 Intervention Definition Data

Includes:

- Intervention ID;
- version;
- objective;
- components;
- mechanism;
- outcome model;
- risk;
- safeguard;
- adaptation rules;
- Life Story, Community, matching, messaging and moderation configuration where applicable;
- AIInterventionConfigurationVersion reference where applicable;
- and Evidence Decision and Evidence Snapshot references.

### 19.2 Intervention Assignment Data

Includes:

- Participant;
- Protocol Version;
- intervention arm;
- exact Intervention Version and Intervention Configuration;
- exact AI configuration where applicable;
- schedule;
- adaptation;
- and assignment state.

### 19.3 Intervention Delivery Data

Includes:

- session;
- component;
- planned time;
- actual time;
- delivery actor;
- completion;
- adaptation;
- technical issue;
- Participant response;
- relevant visibility, matching, messaging, moderation and safety state;
- and delivery provenance.

### 19.4 Exposure Data

Exposure should distinguish:

- offered;
- viewed;
- started;
- partially received;
- received where defined by the Protocol;
- completed;
- skipped;
- declined;
- failed;
- and interrupted.

### 19.5 Fidelity Data

Fidelity records should identify:

- required component;
- delivered component;
- deviation;
- reason;
- reviewer;
- and impact.

---

## 20. Assessment and Outcome Data

### 20.1 Assessment Data

Assessment data should preserve:

- instrument and exact Measurement Version;
- construct and Operational Definition reference;
- scoring algorithm version;
- administration mode;
- language;
- accessibility adaptation;
- response;
- score;
- assistance;
- state and completion;
- assistance source and degree;
- Participant authorship status;
- and quality flags.

### 20.2 Outcome Data

Outcome data should preserve:

- outcome definition;
- Measurement Version;
- timepoint;
- value;
- unit;
- interpretation;
- source;
- and provenance.

### 20.3 Units

Measurements should use explicit units where applicable.

Unit conversions should be:

- deterministic;
- traceable;
- versioned where logic changes;
- and non-destructive.

### 20.4 Coded Responses

Coded responses should preserve:

- code system;
- code;
- display;
- version;
- and mapping.

### 20.5 Free Text

Free text should remain linked to:

- author;
- context;
- language;
- time;
- consent;
- and access restrictions.

---

## 21. Observation Data

### 21.1 Observation Types

Representative observation types include:

- Participant statement;
- Supporter or Informal Caregiver observation;
- Professional Caregiver observation;
- researcher note;
- staff note;
- system event;
- environmental context;
- implementation note;
- or safety concern.

### 21.2 Source Distinction

The platform must distinguish observed fact from interpretation.

### 21.3 Structured and Unstructured Data

An Observation may contain:

- structured fields;
- coded values;
- narrative text;
- media;
- or external references.

### 21.4 Correction and Amendment

Corrections should preserve original content and amendment history.

### 21.5 Observation Epistemic Type

Every Observation should identify whether it is directly observed, Participant-reported, Supporter-reported, Professional Caregiver-reported, imported, system-recorded, device-generated, derived, AI-inferred or human-interpreted.

These types are not interchangeable.

### 21.6 Life Story and Social Content Are Not Observations by Default

A LifeStoryItem, SocialPost, Message, MatchDecision or ModerationCase may be referenced by an Observation or included in a research dataset under approved rules.

It does not automatically become an Observation merely because it contains text or behaviour.

---

## 22. Safety, Privacy and Incident Data

### 22.1 Safety Signal Data

A SafetySignal preserves source, Participant and Research Project context, linked content or event, times, preliminary urgency and uncertainty, triage state, reviewer, escalation, disposition and conversion or closure reference.

```text
Recorded
→ Awaiting Triage
→ In Review
→ Escalated
→ Converted to Safety Event
or Closed as Not a Safety Event
```

### 22.2 Safety Event Data

A SafetyEvent is created only after authorised human confirmation.

It preserves linked SafetySignal, exact Protocol and Intervention versions, severity, seriousness, expectedness, relatedness, Safety Actions, monitoring, resolution, reviewer, reporting state and provenance.

### 22.3 Signal Is Not Event

Rule, device, moderation or AI detection creates a SafetySignal. It does not create a confirmed SafetyEvent.

### 22.4 Moderation, Privacy, AI and Technical Incidents

```text
ModerationCase
≠ SafetySignal
≠ SafetyEvent
≠ Privacy Incident
≠ AIIncident
≠ Technical Incident
```

### 22.5 Restricted Access

Safety and incident data use stricter role, purpose, field, existence, logging, export, retention and break-glass controls.

### 22.6 Reporter Protection

Reporter identity and report content are not disclosed to the affected actor except through an approved moderation, legal or safety process.

### 22.7 No Safety Inference as Profile Truth

A SafetySignal, risk flag or moderation report must not silently become a permanent ParticipantProfile attribute, matching feature or general AI memory.

## 23. AI Data Architecture

### 23.1 Canonical AI Records

M11 owns AIConversation, AIInteraction, AIInterventionConfiguration, AIInterventionConfigurationVersion and AIMemoryItem.

Supporting records include AIRequest, AIResponse, AIContextRecord, AIRetrievalRecord, AIToolInvocation, AIActionProposal, AIActionRecord, AIReviewRecord, AIAdaptationRecord, AIEvaluationRecord and AIIncident.

### 23.2 AI Interaction Provenance

Every material AIInteraction preserves actor and mode, purpose, consent and permission result, Data Classification and Resource State, AI configuration, provider, model and model version, instruction version, context references, retrieval and Knowledge References, tools and policies, retained input/output references, validation, confirmation or review, final action, safety, times and trace identifiers.

### 23.3 Multidimensional AI Output Classification

| Dimension | Representative Values |
|---|---|
| Epistemic Type | Platform Fact; Retrieved Evidence; Participant-Provided Information; Human Decision; AI Inference; Suggestion; Draft; Unknown |
| Artefact Type | Explanation; Summary; Message Draft; Life Story Draft; Match Explanation; Moderation Triage Draft; Evidence Table; Action Proposal |
| Review Status | Not Reviewed; Human Review Required; In Review; Reviewed; Review Rejected; Superseded |
| Approval Status | Not Applicable; Not Approved; Approved; Approved with Conditions; Rejected; Withdrawn |
| Safety Classification | Routine; Sensitive; High Risk; Prohibited; Escalation Required |
| Grounding Status | Grounded; Partially Grounded; Retrieval Failed; Source Unavailable; General Model Knowledge |
| Action Status | None; Proposed; Confirmation Required; Review Required; Executed; Failed; Reversed |

### 23.4 AI-Derived Data

AI-derived classifications, summaries, codes, Match Reasons, proposed entities, translations, transcriptions, moderation labels, inferred preferences, risk flags and accessibility suggestions must not overwrite Participant testimony, observations, validated assessments, human moderation or safety decisions, consent, Relationship or Connection state, DatasetLock, InterpretationRecord or approved ResearchFinding.

### 23.5 AI Memory

AIMemoryItem preserves purpose, source, content type, Data Classification, consent basis, creation method, uncertainty, Participant visibility, correction and deletion, expiry, applicable modes, prohibited uses and provenance.

It remains separate from ParticipantProfile, LifeStoryArchive, MatchPreference, Message, SafetySignal, ModerationCase and research data.

### 23.6 Sensitive Prompt Context

The AI Orchestrator receives only minimum-necessary, permission-filtered context. Block, visibility, consent, purpose, Resource State and field restrictions are enforced before context assembly.

### 23.7 AI Training and Model Improvement

Platform data must not be used for provider training, internal model training, evaluation-dataset creation or general model improvement unless separately authorised and governed.

Community or Internet Public visibility does not create model-training permission.

### 23.8 Embeddings and Vector Indexes

Embeddings are derived data and preserve source record and version, embedding model and version, purpose, namespace, classification, visibility and permission filter, creation time, refresh, deletion and retrieval provenance.

A vector index must not bypass source-resource permission, withdrawal, block or deletion.

### 23.9 AI Safety Detection

The canonical AI domain event is `AISafetySignalRaised`, which creates or requests creation of a SafetySignal through M09.

There is no independent AI-owned SafetyEvent.

## 24. Evidence and Knowledge Reference Data

### 24.1 External Knowledge Boundary

The Research Platform stores KnowledgeReference, EvidenceReview, EvidenceDecision, EvidenceSnapshot, ResearchKnowledgeGap, KnowledgeGapReference, ReferenceChangeAlert, CitationRecord and permitted cache entries.

It does not duplicate external Knowledge Platform authority or silently create a local knowledge authority.

### 24.2 Knowledge Reference

A KnowledgeReference preserves local identifier, external system and capability, external identifier and resource type, external version, label, retrieval purpose, query and filters, retrieval time, verification state, provenance, citation, licensing, resolution state, warnings, capability limitations and linked EvidenceSnapshot where applicable.

### 24.3 Evidence Snapshot

EvidenceSnapshot is an immutable entity, not a Value Object or cache entry.

It preserves the exact evidence state used at a research or governance milestone, including external versions, permitted content, review context, EvidenceDecision, provenance, licensing, completeness and integrity information.

### 24.4 Research Knowledge Gap

ResearchKnowledgeGap is a local Research Platform aggregate.

KnowledgeGapReference points to an externally authoritative curated gap.

The two records remain distinct.

### 24.5 Reference Change

External change creates a ReferenceChangeAlert and human review.

It must not silently mutate an approved ProtocolVersion, InterventionVersion, AI configuration, DatasetVersion, InterpretationRecord or ResearchFinding.

### 24.6 Licensing and Copy Restrictions

Source licensing controls whether content may be stored, cached, quoted, embedded, used in AI context, included in an EvidenceSnapshot, exported or submitted externally.

Metadata-only or reference-only modes are used where required.

## 25. Qualitative, Multimedia and Life Story Data

### 25.1 Data Types

The platform may store or reference interview audio or video, transcript, photograph, voice message, Participant narrative, LifeStoryItem, diary entry, drawing, document, SocialPost or Comment, message, field note and qualitative code or memo.

These records retain their owning domain and do not become interchangeable merely because they contain text or media.

### 25.2 Media Asset Metadata

A media asset preserves asset identifier, owning aggregate, creator and contributors, capture and upload time, format, size, duration or dimensions, language, source device, integrity and malware-scan state, consent, visibility, sharing and reuse permissions, third-party rights, sensitivity, transcript and translation state, retention, deletion state and provenance.

### 25.3 Transcript and Translation Data

Transcripts and translations preserve source media and version, method, provider or human service, language and locale, speaker attribution, timestamps, confidence, corrections, reviewer, confirmation state and provenance.

### 25.4 AI Transcription and Drafting

AI-generated transcription, translation, title, summary or Life Story wording remains distinguishable from original media, human transcript, Participant-authored text, Participant-confirmed text and Participant Testimony.

### 25.5 LifeStoryArchive

LifeStoryArchive is Participant-controlled.

It includes LifeStoryItems, contributions, collections, timeline references, visibility, export and LegacyPreference.

It is not an AI memory store, medical record or research dataset.

### 25.6 LifeStoryItem

A LifeStoryItem preserves item identity and version, content and media, creator, contributor attribution, Participant Testimony state, AI assistance, confirmed or proposed people, places, dates and themes, lifecycle state, visibility, sharing and reuse choices, research-use choice, corrections and disputes, moderation and safety references, export, withdrawal and legacy behaviour.

Lifecycle and visibility are separate.

### 25.7 Life Story Contribution

A LifeStoryContribution preserves contributor, relationship and permission basis, content, attribution, proposed target item, Participant review, accepted, rejected, revised or withdrawn state, and provenance.

The contributor does not acquire ownership.

### 25.8 Third-Party and Sensitive Content

Life Story, photographs, messages and social content may include information about non-Participants.

The platform supports third-party rights review, restricted sharing, redaction, dispute, takedown and exclusion from research or public use.

### 25.9 Research Use Boundary

A LifeStoryItem or personal media asset enters a research DatasetVersion only through an approved DatasetDefinition, compatible consent, item-level eligibility, minimisation, third-party review and provenance.

### 25.10 Legacy Preference

LegacyPreference is a governed record controlling posthumous or incapacity-related handling where legally and operationally supported.

AI cannot create or change it, and a Supporter relationship does not create legacy authority.

## 26. Governed Community and Platform Public Data

### 26.1 Public Profile

PublicProfile is a separate M18 aggregate from ParticipantProfile.

It contains only fields explicitly selected for the intended visibility scope.

It must not automatically include research participation, consent, assessments, Safety records, private Life Story, Supporter relationships, precise location, financial or health data, or AI inference.

### 26.2 Community Space and Membership

CommunitySpace and CommunityMembership preserve identity, purpose, eligibility, visibility, Community Rules and version, membership role, join, leave, suspension and removal state, moderation basis and history.

### 26.3 Social Post, Comment and Reaction

Social content preserves author, original and edited versions, Community or audience, visibility, publication time, AI drafting assistance, attachments, quotation and re-sharing settings, moderation state, reports, withdrawal or deletion, and provenance.

### 26.4 Platform Public versus Internet Public

```text
Platform Public
    = visible to eligible authenticated platform users

Internet Public
    = visible without platform authentication
```

Internet Public requires separate consent, content review, indexing rules, revocation and export controls.

### 26.5 Ranking and Feed Data

Ranking or feed records preserve candidate set, eligibility, visibility, block and rule filters, ranking method and version, declared objective, features used, prohibited features, output order, explanation where required and evaluation provenance.

Ranking must not optimise solely for time, reactions, controversy or emotional dependency.

### 26.6 Social Metrics Boundary

Post, Comment, Reaction, follower, feed-view, message and session counts are process or engagement data.

They are not Healthy Aging outcomes by themselves.

---

## 27. Open Matching, MutualAcceptance and Connection Data

### 27.1 MatchPreference

MatchPreference preserves:

- opt-in state;
- purpose;
- declared goals and interests;
- language;
- communication mode;
- availability;
- coarse location boundary;
- inclusion and exclusion criteria;
- allowed and prohibited attribute references;
- sensitive-attribute permissions;
- policy version;
- activation, pause, expiry and withdrawal;
- and history.

Matching is inactive by default.

### 27.2 MatchCandidate

MatchCandidate preserves:

- canonical candidate pair or directional presentation;
- source MatchPreference versions;
- eligibility and Block checks;
- candidate-generation operation and policy version;
- declared or separately authorised features used;
- source versions and transformations;
- generation and expiry;
- MatchExplanation reference;
- fairness and accessibility metadata;
- and current decision availability.

A MatchCandidate is not a MatchDecision, MutualAcceptance, Connection or CommunicationBasis.

### 27.3 MatchExplanation

MatchExplanation identifies:

- permitted declared shared or complementary attributes;
- deterministic or approved policy reason;
- AI wording where used;
- uncertainty;
- excluded sensitive attributes;
- source versions;
- and explanation version.

It must not present an internal rank as objective compatibility truth.

### 27.4 Independent MatchDecision

MatchDecision preserves:

- deciding actor;
- exact MatchCandidate and version;
- decision value;
- confirmation where required;
- recorded time;
- supersession or reversal;
- expiry;
- purpose;
- and audit.

Canonical decisions may include:

- Interested;
- Not Now;
- Dismissed;
- Blocked;
- Reported;
- and Expired.

One actor cannot submit, infer or overwrite another actor's MatchDecision.

### 27.5 MutualAcceptance

MutualAcceptance is a canonical M18 aggregate and data record.

It preserves:

- MutualAcceptance ID;
- exact source MatchDecision pair or accepted ConnectionRequest;
- actor pair;
- basis type;
- purpose;
- matching or request policy version;
- evaluated time;
- effective period;
- lifecycle and validity state;
- invalidation reason;
- Connection usage;
- and audit.

It is created only after:

- compatible current independent MatchDecisions; or
- one accepted ConnectionRequest under a separately approved future policy;

and current eligibility, Consent, Block, expiry, account, ResourceState and policy checks.

Unused MutualAcceptance may expire or be invalidated.

One MutualAcceptance activates at most one Connection unless an explicitly approved policy states otherwise.

### 27.6 Deferred ConnectionRequest

ConnectionRequest remains canonical data for a future alternative formation path.

It preserves:

- sender and recipient;
- approved discovery or invitation basis;
- purpose;
- created and expiry time;
- recipient decision;
- state;
- Block and eligibility checks;
- and resulting MutualAcceptance reference.

It is not Open Matching and is feature-disabled for the first Pilot.

Acceptance creates MutualAcceptance rather than Connection directly.

### 27.7 Connection

Connection preserves:

- Participants;
- source MutualAcceptance;
- purpose;
- activation time;
- allowed scope;
- lifecycle state;
- pause;
- mute preference reference;
- disconnect;
- Block effect;
- reports;
- and history.

Connection does not create:

- Supporter Relationship;
- care authority;
- Consent;
- research permission;
- private Life Story access;
- or unrestricted messaging.

### 27.8 Matching Data Minimisation

Matching uses explicit declared attributes or separately approved derived features.

The Platform prohibits hidden use of:

- diagnosis;
- decision-making capacity;
- vulnerability;
- financial status;
- precise location;
- private Life Story;
- Message content;
- Safety records;
- moderation allegations;
- or protected traits

without explicit approved governance, Consent, evidence and Protocol authority.

---

## 28. CommunicationBasis, ConversationThread, Message, Block and Moderation Data

### 28.1 CommunicationBasis

CommunicationBasis preserves the approved reason permitting a ConversationThread or Message exchange.

Representative bases include:

- active Connection;
- active authorised Relationship;
- approved InterventionSession;
- approved moderated Community context;
- or another explicitly governed basis.

It records:

- basis type;
- source record and version;
- actors;
- purpose;
- effective period;
- restrictions;
- allowed communication modes;
- and current validity.

A MatchCandidate, unilateral MatchDecision, SocialPost interaction or expired MutualAcceptance is not a CommunicationBasis.

### 28.2 ConversationThread

ConversationThread preserves:

- Thread ID;
- exact participants;
- current CommunicationBasis reference;
- purpose;
- state;
- created, paused, closed or expired times;
- current Block and restriction effects;
- allowed modalities;
- retention class;
- and Message references.

A ConversationThread does not create or broaden the underlying Connection, Relationship, Consent or purpose.

Participants cannot be silently added.

### 28.3 Message and MessageVersion

Message preserves:

- Message ID;
- ConversationThread;
- sender;
- exact recipient set;
- current content version;
- lifecycle state;
- SendConfirmation state;
- attachment references;
- moderation or Safety links;
- retention;
- and audit.

MessageVersion preserves:

- exact body or encrypted object reference;
- format;
- author or AI drafting assistance;
- created time;
- checksum where applicable;
- and supersession.

A Message begins as Draft.

Draft creation and revision do not send it.

### 28.4 SendConfirmation

SendConfirmation preserves:

- confirming actor;
- exact Message ID and version;
- exact recipient set;
- purpose;
- challenge or ceremony reference where used;
- effective and expiry time;
- and result.

AI, provider, recipient or helper cannot create sender authority.

### 28.5 Message Delivery

Message lifecycle and delivery state remain separate.

Representative lifecycle states include:

- Draft;
- Confirmed for Send;
- Queued;
- Sending;
- Sent;
- Withdrawn;
- Cancelled;
- Expired;
- and Archived.

Representative delivery states include:

- Not Submitted;
- Queued;
- Sent to Provider or Transport;
- Provider Accepted;
- Delivered;
- Read where explicitly enabled;
- Delivery Failed;
- Delivery Unknown;
- Cancelled;
- and Expired.

`Sent`, `Provider Accepted`, `Delivered` and `Read` are not interchangeable.

### 28.6 MessageDeliveryAttempt

Each attempt preserves:

- Message;
- attempt number;
- provider and adapter version;
- provider reference;
- request time;
- callback evidence;
- mapped state;
- failure reason;
- retryability;
- reconciliation;
- and audit.

Retry creates another DeliveryAttempt rather than another logical Message unless the sender creates a new Message.

### 28.7 Provider Callback Data

Provider callback data preserve:

- authenticated source;
- signature and key reference;
- timestamp;
- replay result;
- provider status;
- provider reference;
- canonical Message and DeliveryAttempt mapping;
- raw restricted evidence;
- translated canonical command;
- and idempotency result.

Provider state is not the system of record.

### 28.8 Message Privacy and Research Boundary

Message body is excluded by default from:

- broad event payloads;
- general logs;
- general Search;
- Vector retrieval;
- MatchCandidate generation;
- Community ranking;
- AIMemoryItem;
- and ordinary research analysis.

Message-content analysis requires explicit Consent, approved purpose, DatasetDefinition, minimisation, restricted access and governance.

Message metadata may enter a DatasetDefinition only when necessary and explicitly specified.

### 28.9 Mute, Disconnect and Block

| Record | Primary Effect |
|---|---|
| MuteRecord | suppresses selected content or notifications without necessarily ending Connection or Thread |
| DisconnectRecord | ends a Connection |
| BlockRecord | prevents discovery, matching, MutualAcceptance, Connection activation, Thread creation, Message send, notification and AI Context according to policy |
| Report | creates an independent governance record |

Report remains available after Block or Disconnect.

Block revocation does not automatically restore MatchPreference, MutualAcceptance, Connection, ConversationThread or Message delivery.

### 28.10 UserReport and ContentReport

Reports preserve:

- reporter;
- affected actor, Message, attachment or content;
- category;
- narrative and evidence;
- time;
- urgency;
- reporter-protection rules;
- related BlockRecord;
- state;
- and routing.

Reporter identity remains restricted.

### 28.11 ModerationCase

ModerationCase preserves:

- reports and affected content or actors;
- CommunityRuleVersion;
- permitted evidence;
- provisional AI or provider classifications;
- human reviewer;
- ModerationDecision and action;
- SafetySignal or Privacy Review linkage;
- appeal;
- restoration;
- recurrence;
- and audit.

ModerationCase remains separate from SafetySignal and SafetyEvent.

### 28.12 Search and AI Isolation

Private Message content, moderation evidence, reporter identity and restricted content are excluded from ordinary Community Search, matching and general AI personalisation.

---

## 29. Device, Wearable and Sensor Data

### 29.1 Scope

Device data may include:

- activity;
- sleep;
- heart rate;
- mobility;
- location;
- environmental conditions;
- interaction data;
- or device status.

### 29.2 Device Registry

A Device record should preserve:

- device identifier;
- manufacturer;
- model;
- firmware;
- sensor type;
- Participant assignment;
- calibration;
- start and end date;
- and status.

### 29.3 Measurement Stream

A stream should preserve:

- source device;
- sensor;
- sampling interval;
- unit;
- timestamp;
- timezone;
- quality;
- and transformation.

### 29.4 Raw and Derived Data

The platform should distinguish:

- raw device data;
- cleaned data;
- aggregated data;
- derived features;
- and interpreted outcomes.

### 29.5 Device Time

Clock drift, timezone, and synchronisation should be managed explicitly.

### 29.6 Device Failure

Device failure should create quality flags rather than false values.

### 29.7 Participant Control

Participants should be informed about:

- what is collected;
- when;
- for what purpose;
- who can access it;
- and how to pause or stop collection where permitted.

---

## 30. External System Categories

### 30.1 Knowledge Systems

Examples:

- Healthy Aging Knowledge Platform;
- evidence repositories;
- terminology services;
- and guideline services.

### 30.2 Care Systems

Examples may include:

- electronic health records;
- care management systems;
- long-term care systems;
- and community care systems.

### 30.3 Research Systems

Examples may include:

- ethics systems;
- trial registries;
- electronic data capture systems;
- statistical environments;
- and research repositories.

### 30.4 Community Systems

Examples may include:

- programme directories;
- external Community or social-prescribing systems;
- volunteer systems;
- transport services;
- and social-prescribing systems.

### 30.5 Device Systems

Examples may include:

- wearable platforms;
- smart-home hubs;
- sensor gateways;
- and device-cloud APIs.

### 30.6 Identity and Communication Systems

Examples may include:

- identity providers;
- email;
- SMS;
- push notification;
- content moderation or abuse-report providers where approved;
- voice;
- video;
- and notification services.

---

## 31. Interoperability Patterns

### 31.1 Synchronous API

Used when an immediate response is required.

Examples:

- retrieve current assessment;
- resolve external identifier;
- check consent and Resource State;
- retrieve a permitted Match Candidate or Community resource;
- or request a knowledge service.

### 31.2 Asynchronous Event

Used when systems should react without direct coupling.

Examples:

- ParticipantEnrolled;
- AssessmentCompleted;
- SafetySignalRecorded;
- SafetyEventCreated;
- MatchCandidateGenerated;
- MutualAcceptanceRecorded;
- ModerationCaseCreated;
- DatasetVersionLocked;
- or ResearchFindingApproved.

### 31.3 Batch Exchange

Used for:

- dataset import;
- dataset export;
- historical migration;
- periodic device data;
- and external analysis.

### 31.4 File Exchange

Used where APIs are unavailable or inappropriate.

Files should include:

- manifest;
- schema version;
- checksums;
- source;
- date;
- and validation result.

### 31.5 Human-Mediated Exchange

Manual import or export may be appropriate for low-volume or high-governance workflows.

### 31.6 Integration Selection

The pattern should be selected according to:

- timeliness;
- volume;
- reliability;
- sensitivity;
- governance;
- external capability;
- and recovery requirements.

---

## 32. API Architecture

### 32.1 API Principles

APIs should be:

- resource-oriented where appropriate;
- versioned;
- permission-aware;
- purpose-aware;
- idempotent where possible;
- observable;
- and documented.

### 32.2 API Categories

Representative categories include:

- identity APIs;
- Participant APIs;
- Research Project APIs;
- Protocol APIs;
- intervention APIs;
- assessment APIs;
- outcome APIs;
- Life Story APIs;
- Community and Public Profile APIs;
- matching, Connection and messaging APIs;
- block, report and moderation APIs;
- Safety Signal and Safety Event APIs;
- Dataset Definition, Dataset Version and Analysis APIs;
- AI orchestration APIs;
- knowledge integration APIs;
- reporting APIs;
- and administration APIs.

### 32.3 API Context

Requests carry or resolve:

- authenticated actor or ServiceAccount;
- active role;
- Organisation and Research Project;
- Relationship or Connection where relevant;
- Consent;
- purpose;
- context;
- Specific Permission;
- Resource State;
- Data Classification;
- action risk;
- client and schema version;
- idempotency key where relevant;
- correlation and trace identifiers.

The API does not trust user-supplied permission claims without server-side evaluation.

### 32.4 API Response

Responses should preserve:

- resource version;
- source;
- warning;
- validation and Resource State;
- permission-filtered fields;
- visibility and completeness where applicable;
- warnings;
- and trace identifier.

### 32.5 API Versioning

Breaking changes require explicit version management.

### 32.6 Idempotency

Create or action APIs should support idempotency where duplicate submission could cause harm or inconsistency.

### 32.7 Field and Existence Protection

APIs may omit unauthorised fields, return purpose-specific projections, mask sensitive values, avoid confirming protected resource existence and use consistent error behaviour for blocked or inaccessible resources.

### 32.8 Command over Generic Mutation

High-impact changes use explicit domain commands such as approve Protocol Version, withdraw Consent, publish Social Post, accept Match Candidate, block actor, create Moderation Case, lock Dataset Version or approve Research Finding.

Generic PATCH access must not bypass domain invariants.

---

## 33. Event Architecture

### 33.1 Event Layers

The Platform distinguishes:

- Domain Event;
- Integration Event;
- UX Analytics Event;
- Operational Event;
- and Audit Event.

A UX interaction or provider callback does not automatically establish a completed Domain Event.

### 33.2 Event Envelope

An event preserves:

- Event ID;
- event category and type;
- schema version;
- occurred and recorded time;
- actor;
- aggregate;
- aggregate version;
- Organisation and ResearchProject;
- Participant where permitted;
- trace identifier;
- source module;
- purpose;
- DataClassification;
- correlation and causation identifiers;
- and minimum-necessary payload.

### 33.3 Representative Canonical Events

- UserAccountCreated;
- RelationshipApproved;
- ConsentRecorded;
- ConsentWithdrawn;
- ResearchProjectCreated;
- ProtocolVersionApproved;
- ParticipantEnrolled;
- InterventionAssigned;
- InterventionSessionStarted;
- InterventionExposureRecorded;
- AssessmentCompleted;
- ObservationRecorded;
- OutcomeRecorded;
- SafetySignalRecorded;
- SafetySignalTriaged;
- SafetyEventCreated;
- LifeStoryItemCreated;
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

### 33.4 Cross-Layer Event Mapping

| UX, Legacy or Provider Name | Canonical Domain Event |
|---|---|
| PublicProfileActivated | PublicProfilePublished |
| LifeStoryVisibilityChanged | LifeStoryItemVisibilityChanged |
| MatchCompleted | MutualAcceptanceRecorded or ConnectionActivated |
| MessageDeliveryConfirmed | MessageDelivered |
| ActorBlocked | BlockCreated |
| UserReported | UserReportSubmitted |
| ContentReported | ContentReportSubmitted |
| DatasetLockConfirmed | DatasetVersionLocked |
| SafetyEventDetected | SafetySignalRecorded or AISafetySignalRaised |

Aliases remain explicit translations and are not emitted by new canonical producers.

### 33.5 Event Versioning

Event payload changes preserve compatibility or introduce a new schema version.

### 33.6 Sensitive Event Data

General events exclude unnecessary:

- Life Story text;
- Message body;
- reporter identity;
- precise location;
- Safety detail;
- moderation evidence;
- and hidden matching data.

Consumers retrieve authorised detail through current APIs.

Event possession does not create ongoing access.

### 33.7 Delivery Semantics

Consumers tolerate duplicate and out-of-order delivery according to aggregate and event version.

Material events use transactional outbox or equivalent atomic publication.

### 33.8 Provider Callback Boundary

Communication-provider callback evidence is restricted integration data.

An authenticated M16 adapter translates it into an allowed M18 command.

The callback is not itself `MessageDelivered`.

---

## 34. Terminology and Semantic Interoperability

### 34.1 Canonical Vocabulary

The platform should use the ubiquitous language defined in Document 8.

### 34.2 External Terminologies

External terminology systems may be mapped where useful.

### 34.3 Terminology Record

A coded value should preserve:

- code system;
- code;
- display;
- version;
- mapping;
- and status.

### 34.4 Mapping Types

Mappings may be:

- Exact;
- Equivalent;
- Broader;
- Narrower;
- Related;
- or Unmapped.

### 34.5 No Silent Equivalence

Different concepts must not be treated as equivalent solely because labels are similar.

### 34.6 Local Terms

Local terms may be used but should have:

- definition;
- owner;
- version;
- and mapping status.

### 34.7 Canonical Social and Research Distinctions

Mappings must preserve:

- Participant versus Older Adult versus Resident;
- Relationship versus Connection;
- Supporter versus family member;
- Consent versus permission;
- Community versus Platform Public versus Internet Public;
- MatchCandidate versus Connection;
- SafetySignal versus SafetyEvent;
- ModerationCase versus SafetyEvent;
- LifeStoryItem versus qualitative research record;
- Participant Testimony versus verified historical fact;
- EvidenceDecision versus ResearchFinding;
- DatasetDefinition versus DatasetVersion;
- AnalysisOutput versus ResearchFinding.

### 34.8 Sensitive Mapping Review

Mappings involving health status, disability, cognitive status, protected traits, vulnerability, capacity, matching or safety require human governance and must not be inferred from label similarity.

---

## 35. Standards Alignment

The platform should align with established standards where they improve interoperability, safety, or reuse.

Potential areas include:

- health data exchange;
- research data models;
- terminology;
- measurement representation;
- identity;
- API description;
- event schemas;
- audit;
- and device data.

Standards should be adopted selectively.

The platform should not force all internal data into an external standard when doing so would:

- distort the research domain;
- remove intervention-specific meaning;
- weaken provenance;
- or increase implementation complexity without clear value.

### 35.1 Anti-Corruption Layer

External standard models should pass through adapters and mappers.

### 35.2 Standards Versioning

The standard and version used in an exchange should be recorded.

---

## 36. FHIR and Health-System Integration

Where healthcare interoperability is required, the platform may map selected records to compatible health-data resources.

Potential mappings may include:

- Participant identity;
- Consent;
- assessment;
- observation;
- questionnaire response;
- care team;
- device;
- and research study information.

The canonical Research Platform model remains authoritative for platform workflows.

### 36.1 Selective Mapping

Not every Research Platform entity requires an external health-data equivalent.

### 36.2 No Clinical Record Assumption

Importing health-system data does not make the Research Platform a clinical record system.

### 36.3 Clinical Data Use

Clinical data should be imported only when:

- relevant;
- authorised;
- necessary;
- and interpretable.

### 36.4 Social, Matching and Life Story Boundary

LifeStoryItem, SocialPost, MatchCandidate, Connection, Message and ModerationCase are not forced into clinical-record resources merely because a health standard is available.

Where exchange is required, an explicit use case, mapping and governance review are required.

### 36.5 Clinical Authority

Imported clinical data remain source-attributed. Research Platform staff and AI must not convert imported data into diagnosis, prescribing or medication-management authority.

---

## 37. Research Data Interoperability

### 37.1 Export Targets

Research data may need to support:

- statistical analysis;
- qualitative analysis;
- data repositories;
- collaborators;
- regulatory or ethics reporting;
- and external knowledge submission.

### 37.2 Export Package

An export should include:

- manifest;
- schema;
- data dictionary;
- Dataset Definition version;
- locked Dataset Version;
- Dataset Lock and manifest;
- provenance and source lineage;
- transformations;
- missing-data definitions;
- code mappings;
- consent, visibility, quotation, research-use and third-party restrictions;
- de-identification state and risk review;
- Analysis Plan and software environment where applicable;
- and checksums.

### 37.3 Tabular Export

Tabular formats may be used for analysis where appropriate.

### 37.4 Structured Export

Structured formats should preserve nested relationships, provenance, and versioning where required.

### 37.5 Export Reproducibility

The same locked dataset and export specification should produce a reproducible export.

### 37.6 Qualitative and Multimedia Export

Qualitative or multimedia export additionally preserves media and transcript linkage, speaker and contributor attribution, AI transcription or translation provenance, redactions, quotation permissions, third-party rights and access tooling.

### 37.7 Social and Matching Export

Community, matching, Connection, message and moderation data require explicit DatasetDefinition, purpose, consent or authorised basis, minimisation, reporter and blocked-actor protection, network and re-identification risk review, and recipient restrictions.

### 37.8 Evidence Package versus Research Dataset

EvidencePackage is a governed M14 reporting artefact.

It may reference a locked DatasetVersion, AnalysisRun, InterpretationRecord and ResearchFinding, but is not itself the research dataset.

---

## 38. Data Ingestion

### 38.1 Ingestion Stages

```text
Receive
    ↓
Identify Source
    ↓
Validate Structure
    ↓
Validate Meaning
    ↓
Check Consent, Permission, Purpose and Resource State
    ↓
Classify and Map to Canonical Model
    ↓
Apply Quality Flags
    ↓
Persist
    ↓
Audit
```

### 38.2 Structural Validation

Checks may include:

- required fields;
- format;
- type;
- schema version;
- identifier format;
- and checksum.

### 38.3 Semantic Validation

Checks may include:

- valid code;
- plausible value;
- unit;
- time relationship;
- Participant context;
- Relationship, Connection, Block and visibility compatibility;
- Protocol and Intervention Version compatibility;
- consent and purpose compatibility;
- and source authority.

### 38.4 Quarantine

Invalid or suspicious imports should be quarantined rather than silently accepted.

### 38.5 Manual Review

Some mappings or conflicts may require human review.

---

## 39. Data Transformation

### 39.1 Transformation Record

Every material transformation should preserve:

- input;
- output;
- rule;
- algorithm;
- code version;
- actor or process;
- time;
- and validation result.

### 39.2 Transformation Types

Examples include:

- unit conversion;
- code mapping;
- score calculation;
- aggregation;
- cleaning;
- de-identification;
- feature extraction;
- transcription;
- translation;
- and normalisation.

### 39.3 Non-Destructive Processing

Original data should remain available where permitted.

### 39.4 Reprocessing

Updated transformation logic should create new derived versions.

### 39.5 AI-Assisted Transformation

AI may assist transcription, translation, coding, redaction and feature suggestion.

The TransformationRun preserves model and instruction versions, source, output, confidence, human review and corrections.

High-risk redaction, identity resolution, safety classification and research-variable creation require human validation.

### 39.6 Embedding and Feature Generation

Embedding, feature extraction and model scoring are transformations.

They do not overwrite source records and are regenerated or deleted when their source, purpose, permission or model version changes.

---

## 40. Data Quality Architecture

### 40.1 Quality Dimensions

The platform should monitor:

- completeness;
- accuracy;
- validity;
- consistency;
- uniqueness;
- timeliness;
- provenance;
- comparability;
- and fitness for purpose.

### 40.2 Quality Rules

Rules may apply at:

- field level;
- record level;
- Participant level;
- Protocol level;
- dataset level;
- or integration level.

### 40.3 Quality Flags

Representative flags include:

- Missing;
- Invalid;
- Out of Range;
- Inconsistent;
- Duplicate;
- Late;
- Assisted;
- Derived;
- Imputed;
- Source Unverified;
- Device Failure;
- Mapping Uncertain;
- Visibility Mismatch;
- Consent Incompatible;
- Block Conflict;
- Attribution Uncertain;
- AI Generated;
- AI Inference Unreviewed;
- Moderation Restricted;
- or Manual Override.

### 40.4 Quality Issue

A quality issue should preserve:

- rule;
- affected record;
- severity;
- status;
- reviewer;
- resolution;
- accepted exception where applicable;
- affected Dataset Definitions and Versions;
- and impact.

### 40.5 No False Precision

Low-quality data should not be presented with misleading precision.

### 40.6 Domain-Specific Quality

Quality checks should include:

- Life Story authorship and attribution;
- transcript and translation accuracy;
- visibility and sharing compatibility;
- Mutual Acceptance and communication basis;
- block propagation;
- report and moderation linkage;
- SafetySignal versus SafetyEvent distinction;
- AI grounding and tool-result confirmation;
- Dataset lineage;
- and Analysis Plan compatibility.

### 40.7 Quality Does Not Create Permission

A technically complete and accurate record may still be unusable for a purpose because consent, permission, visibility, retention or Resource State is incompatible.

---

## 41. Time Architecture

### 41.1 Time Types

The platform should distinguish:

- event time;
- recorded time;
- imported time;
- scheduled time;
- effective time;
- processing time;
- consent effective time;
- visibility effective time;
- moderation action time;
- block effective time;
- source-reported time;
- and publication time.

### 41.2 Timezone

Timestamps should preserve timezone or a defined reference timezone.

### 41.3 Participant Local Time

Intervention schedules and notifications should respect Participant local time.

### 41.4 Historical Corrections

Corrected timestamps should preserve original values.

### 41.5 Device Time

Device clock drift and synchronisation status should be recorded where relevant.

---

## 42. Versioning

### 42.1 Versioned Objects

Versioning should apply to:

- Protocol;
- Intervention;
- consent form;
- assessment instrument;
- outcome definition;
- data schema;
- terminology mapping;
- AI configuration;
- Life Story Item;
- Community Rule;
- Match Preference and matching policy;
- moderation policy;
- Dataset Definition;
- Dataset Version;
- Analysis Plan;
- software environment;
- Report Version;
- and export specification.

### 42.2 Version Metadata

A version should preserve:

- version identifier;
- predecessor;
- change summary;
- author;
- date;
- approval;
- effective period;
- and status.

### 42.3 Immutable Approved Versions

Approved Protocol Versions, Intervention Versions, Evidence Snapshots, AI configuration versions, Dataset Definitions, locked Dataset Versions, approved Analysis Plans, approved Interpretation Records and Research Findings must not be modified in place.

### 42.4 Compatibility

Consumers should be able to identify compatible and incompatible versions.

---

## 43. Provenance and Lineage

### 43.1 Provenance

Provenance describes where a record, value, media asset, inference or decision came from.

Minimum provenance includes:

- source actor, system or device;
- source aggregate and exact version;
- method and purpose;
- collection or creation time;
- imported or generated time;
- transformation;
- AI involvement;
- reviewer;
- and integrity reference.

### 43.2 Lineage

Lineage describes how data changed, which versions were used and where outputs were consumed.

### 43.3 Canonical Research Lineage

```text
Source Aggregate and Version
        ↓
Collected or Imported Record
        ↓
Validation, Consent and Purpose Check
        ↓
Data Quality Flags and Corrections
        ↓
Approved DatasetDefinition
        ↓
TransformationRun
        ↓
DatasetVersion
        ↓
Quality Review and DatasetLock
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
        ↓
InterventionDecision
        ↓
Report, EvidencePackage and ExternalSubmission
```

### 43.4 Required Research Lineage

Material outputs are traceable to:

- Research Question;
- Evidence Decision and Evidence Snapshot;
- Protocol Version;
- Intervention Version and configuration;
- AI configuration where applicable;
- Enrolment and Intervention Assignment;
- source records and consent basis;
- Dataset Definition;
- Transformation Runs;
- locked Dataset Version;
- Analysis Plan;
- Analysis Run;
- code, software and environment;
- Interpretation Record;
- human reviews;
- and Research Finding.

### 43.5 Content and Social Lineage

When Life Story, Community, matching, message or moderation data are used, lineage additionally preserves item or record version, author and contributor, visibility at use time, research-use permission, block and moderation state, redaction, third-party rights review, and withdrawal or deletion after use.

### 43.6 AI Lineage

AI output remains traceable to AIInteraction, AI configuration, model and instruction versions, context references, Knowledge References, retrieval, tool calls, validation, human review and correction, final action and source-aggregate response.

### 43.7 Lineage Is Append-Only

Corrections and supersession add new lineage edges. They do not erase the historical path used for an approved research milestone.

## 44. Dataset Architecture

### 44.1 Dataset Definition

DatasetDefinition specifies a governed research data product.

It preserves:

- Dataset Definition ID and version;
- Research Project and Research Questions;
- purpose;
- approved users and outputs;
- source aggregates and exact fields;
- inclusion and exclusion criteria;
- time windows;
- consent, permission, visibility and Resource State requirements;
- variables and Operational Definitions;
- transformations;
- missingness and imputation rules;
- de-identification;
- Life Story, Community, matching, message, moderation, safety and AI-data rules;
- quality thresholds;
- retention;
- and ApprovalRecord.

### 44.2 Dataset Types

Representative types include screening, baseline, interim, safety, moderation and online-safety, process and implementation, analysis-ready quantitative, qualitative, Life Story research, Governed Community and social connection, matching and Connection, AI evaluation, device, reproducibility, and public or shared release datasets.

### 44.3 Dataset Version

DatasetVersion is generated from an approved DatasetDefinition and exact source versions.

It preserves Dataset Version ID, Dataset Definition version, purpose, Research Project and Protocol Version, extraction time, source manifest, included Participants and records, exclusions, Variable Definitions, Transformation Runs, corrections, de-identification, missingness and imputation, quality state, Dataset Manifest, checksum, lifecycle and supersession history.

### 44.4 Canonical Dataset Version State

```text
Draft
    ↓
Generated
    ↓
Quality Review
    ↓
Quality Reviewed
    ↓
Locked
    ↓
Analysed
```

A Dataset Version may later become Superseded or Archived.

### 44.5 Dataset Lock

DatasetLock is an entity and governed milestone within a DatasetVersion.

It records lock identity, scope, locked version, date, included records, exclusions, transformations, missingness, quality state, accepted unresolved issues, de-identification state, manifest, checksum, approver, purpose and compatible Analysis Plan references.

A locked DatasetVersion is immutable. Corrections create a new DatasetVersion.

### 44.6 Lock Readiness

A DatasetVersion cannot be locked until DatasetDefinition is approved, source lineage is complete, consent and purpose checks pass, visibility and third-party restrictions are resolved, quality review is complete, missingness and imputation are explicit, de-identification is documented, material issues are resolved or accepted, and intended Analysis Plans are compatible.

AI may assist quality review but cannot lock a DatasetVersion.

### 44.7 Variable Dictionary

Every DatasetVersion has a versioned variable dictionary including variable name and label, construct and Operational Definition, type, source aggregate and field, Measurement Version, unit and code set, missing values, transformation, derivation and algorithm version, classification, allowed use and limitations.

### 44.8 Dataset Access

```text
Role
+ Research Project Assignment
+ Consent or Approved Basis
+ Purpose
+ Context
+ Specific Permission
+ Resource State
+ De-Identification State
+ Approval
```

### 44.9 No Direct Operational Write-Back

Analysis or dataset corrections do not write directly into operational aggregates.

A validated source correction follows the owning-domain amendment workflow and may trigger a new DatasetVersion.

## 45. De-Identification and Pseudonymisation

### 45.1 Purpose

Research use may require reducing identifiability.

### 45.2 States

Representative states include:

- Identifiable;
- Pseudonymised;
- De-identified;
- Anonymised where genuinely applicable;
- and Synthetic.

### 45.3 Pseudonymisation

Pseudonymisation replaces direct identifiers while retaining controlled re-linkage.

### 45.4 De-Identification

De-identification should consider:

- direct identifiers;
- quasi-identifiers;
- rare combinations;
- free text;
- media;
- Life Story and free-text context;
- social network structure and rare interests;
- Match Candidate and Connection patterns;
- reporter and moderator information;
- dates;
- precise and coarse location;
- and device identifiers.

### 45.5 Re-Identification Risk

Risk should be assessed according to:

- dataset context;
- recipient;
- data richness;
- population size;
- external data availability;
- public or Internet-visible content;
- network uniqueness;
- multimedia biometrics;
- and AI-assisted linkage capability.

### 45.6 Linkage Key

Re-identification keys should be stored separately and access-controlled.

### 45.7 AI De-Identification

AI may assist with detecting identifiers but should not be the sole control for high-risk release.

### 45.8 Public Content and De-Identification

Publicly visible content is not automatically de-identified.

Quoting a distinctive Life Story, Social Post or combination of interests may re-identify a Participant even when account identifiers are removed.

### 45.9 Network and Matching Data

Social graphs, Match Candidate sets, Connection histories and message metadata may be highly identifying.

Release requires network-specific risk assessment and may require aggregation, perturbation, thresholding or exclusion.

### 45.10 Multimedia

Face, voice, background details, metadata and third-party presence require separate review. Removing a filename is not sufficient de-identification.

---

## 46. Data Minimisation

### 46.1 Collection Minimisation

Collect only what is needed for an approved purpose. Public, social, matching, Life Story, device and AI capabilities must not collect broad behavioural data merely because it may be useful later.

### 46.2 Access Minimisation

Expose only what is needed.

### 46.3 Retention Minimisation

Retain only as long as needed.

### 46.4 Prompt Minimisation

Provide AI models only the context required.

### 46.5 Export Minimisation

Exports should exclude unnecessary fields.

### 46.6 Search and Index Minimisation

Indexes contain only fields needed for the search purpose.

Private Life Story, messages, Safety records, reporter identity, precise location and sensitive Match Preferences are excluded from general search indexes.

### 46.7 Analytics Minimisation

Analytics should prefer purpose-specific events and aggregates rather than full content replication.

### 46.8 Social Graph Minimisation

The platform should avoid exposing complete Connection, matching or interaction graphs to users, services, AI models or researchers when aggregate or local-neighbourhood data are sufficient.

---

## 47. Retention and Archival

### 47.1 Retention Rule

A retention rule should preserve:

- data category;
- purpose;
- start trigger;
- retention period;
- archival requirement;
- deletion rule;
- and authority.

### 47.2 Retention Triggers

Examples include:

- Participant withdrawal;
- project completion;
- protocol closure;
- consent expiry;
- contract end;
- Community or matching opt-out;
- Connection disconnect or block;
- moderation resolution or appeal;
- Life Story withdrawal or Legacy Preference;
- external-provider contract end;
- or legal requirement.

### 47.3 Archival

Archived data should remain:

- readable;
- versioned;
- access-controlled;
- and auditable.

### 47.4 Long-Term Research Records

Some research records may require long-term preservation.

### 47.5 Media Retention

Media, messages, reporter evidence, AI prompts, matching candidates and unconfirmed Life Story Drafts may require shorter or more restrictive retention than structured research data.

### 47.6 Domain-Specific Retention

Separate rules should exist for account and identity, consent and authority evidence, Life Story and legacy, Community content, Match Candidates, Connections and messages, Block Records, reports and moderation evidence, Safety Signals and Safety Events, AI interactions and memory, operational research records, locked Dataset Versions, analyses and Research Findings, audit, and external submission.

### 47.7 Retention Conflict

When rules conflict, the platform records applicable authorities, data categories, preservation need, Participant request, selected disposition, reviewer and review date.

Retention does not preserve current visibility or access.

---

## 48. Deletion

### 48.1 Deletion Types

Representative types include:

- user-requested deletion;
- consent-driven deletion;
- retention expiry;
- administrative deletion;
- legal hold exception;
- research-preservation exception;
- third-party rights request;
- content moderation removal;
- message withdrawal where supported;
- or legacy disposition.

### 48.2 Soft and Hard Deletion

Soft deletion may preserve operational history.

Hard deletion should be used when required and appropriate.

### 48.3 Referential Integrity

Deletion must not create misleading orphan records.

### 48.4 Audit

Deletion should preserve an audit event without retaining deleted content unnecessarily.

### 48.5 Derived Data

Deletion impact on derived data, embeddings, indexes, caches, Dataset Versions, reports, external recipients and AI memory should be evaluated and recorded.

### 48.6 Withdrawal from Search, Matching and AI

Deletion or withdrawal propagates to search indexes, vector indexes, Match Candidate generation, feeds, AI context and memory, caches, recommendations, exports not yet released and future transformations.

### 48.7 Locked Research Data

A Participant request affecting a locked DatasetVersion is evaluated according to consent, Protocol, legal and research-preservation rules.

The original DatasetVersion is not silently edited. A new DatasetVersion or exclusion analysis is created where required.

### 48.8 Distributed Copies

The platform records whether data were sent to external providers, approved researchers, repositories, Knowledge Platform submission, Internet Public endpoints or Participant exports.

Deletion workflows identify recall, takedown, notice or irreversibility.

---

## 49. Data Export and Portability

### 49.1 Participant Export

Subject to governance and third-party rights, Participant export may include:

- ParticipantProfile and preferences;
- consent and sharing choices;
- Relationship and Connection summaries;
- intervention history;
- assessments and Participant-provided observations;
- LifeStoryArchive and media;
- contributions and attribution;
- PublicProfile and Participant-authored Social Posts;
- matching settings and Participant decisions;
- message history where supported;
- block and report records appropriate for disclosure;
- AI memory and selected AI interaction history;
- and sharing, quotation, download, research-use and LegacyPreference history.

Reporter identity, confidential moderation evidence, third-party content and restricted safety information may require exclusion or review.

### 49.2 Life Story Export

Life Story export preserves item versions, media and transcripts, attribution, Participant Testimony state, AI assistance, dates and collections, visibility and sharing choices, third-party restrictions and integrity manifest.

### 49.3 Research Export

Researchers may export only approved locked Dataset Versions, data dictionary, Dataset Definition, source and Transformation lineage, Analysis Plan and Analysis Run references, code mappings, de-identification documentation, analysis files, reports and reproducibility artefacts.

### 49.4 Export Controls

Exports enforce actor and role, Research Project, consent or approved basis, purpose, context, Specific Permission, Resource State, Dataset Lock, visibility and third-party restrictions, block and reporter protection, Data Classification, de-identification, recipient, retention and approval.

### 49.5 Export Manifest

Every material export includes export identity and version, creator and approver, recipient, purpose, data scope and source versions, Dataset Definition and Dataset Version where applicable, time, format and schema, de-identification state, restrictions and expiry, licensing, checksums, audit and trace identifiers.

### 49.6 Export State

- Draft;
- Validation;
- Awaiting Approval;
- Approved;
- Generating;
- Generated;
- Delivered;
- Failed;
- Revoked;
- Archived.

Delivery and recipient receipt remain separate where supported.

### 49.7 Portability Is Not Research Use

A Participant export does not authorise the platform or recipient to use the exported data for research, model training, publication or redistribution.

## 50. Import and Migration

### 50.1 Migration Principles

Migration should preserve:

- identifiers;
- meaning;
- provenance;
- version;
- audit;
- consent and purpose where known;
- visibility and sharing state;
- third-party rights;
- and unresolved mappings.

### 50.2 Legacy Data

Legacy data should be:

- assessed;
- mapped;
- validated;
- classified;
- and quality-flagged.

### 50.3 Unmapped Data

Unmapped data should remain visible as unresolved rather than forced into an incorrect model.

### 50.4 Migration Reconciliation

Migration should include counts, validation, and exception reporting.

### 50.5 Social, Life Story and Message Migration

Migration of Life Story, social, matching or message data requires authorship and attribution preservation, visibility mapping, block and moderation-state mapping, consent and research-use mapping, third-party review, media integrity and explicit treatment of unsupported features.

### 50.6 No Silent Public Expansion

Legacy content is not mapped to Platform Public or Internet Public unless the source scope and Participant choice clearly support that visibility.

---

## 51. Security Requirements for Data

### 51.1 Encryption

Sensitive data should be encrypted in transit and at rest.

### 51.2 Access Control

Access should evaluate:

- Role;
- Relationship or Connection;
- Consent;
- Purpose;
- Context;
- Specific Permission;
- Resource State;
- Data Classification;
- and action risk.

### 51.3 Segregation

Highly sensitive data may require logical or physical segregation.

### 51.4 Secrets

Credentials, tokens, and keys must not be stored in research records.

### 51.5 Audit Logging

Access to sensitive data should be auditable.

### 51.6 Break-Glass Access

Emergency access, if supported, should be:

- exceptional;
- justified;
- time-limited;
- and reviewed.

### 51.7 Field-Level and Context-Level Controls

Sensitive aggregates may expose different fields to Participant, Supporter, researcher, Safety Reviewer, Moderator, Privacy Reviewer, System Administrator and integration service.

System administration does not create content, research, safety or moderation authority.

### 51.8 Search, Index and Cache Security

Search indexes, vector stores, caches and analytics projections inherit source classification, visibility, block, purpose, deletion and retention controls.

### 51.9 Social Abuse and Enumeration Protection

Controls should prevent account enumeration, block bypass, scraping, mass matching, relationship inference, location inference, reporter discovery, media harvesting and unauthorised public export.

---

## 52. Audit Data Architecture

### 52.1 Audit Event

An Audit Event should include:

- actor;
- action;
- target;
- time;
- purpose;
- project;
- Participant where permitted;
- permission, consent and purpose decision;
- Resource State and Data Classification;
- result;
- source;
- trace identifier;
- and relevant version.

### 52.2 Audit Categories

Representative categories include:

- access and protected-existence decision;
- create, change and correction;
- review and approval;
- import, export and external delivery;
- deletion, withdrawal and retention;
- consent, delegation and PolicyDecision;
- Life Story sharing, withdrawal and legacy change;
- public publication;
- matching and MutualAcceptance;
- Connection, message, block and report actions;
- moderation and appeal;
- SafetySignal and SafetyEvent actions;
- AI context, memory, retrieval, tool and action;
- DatasetDefinition, generation, quality review and DatasetLock;
- analysis and ResearchFinding;
- integration and provider use;
- security and break-glass;
- and administration.

### 52.3 Append-Only History

Material audit history should be append-only.

### 52.4 Audit Privacy

Audit records should avoid unnecessary sensitive content.

---

## 53. Integration Governance

### 53.1 Integration Record

Each external integration should preserve:

- system;
- owner;
- purpose;
- data exchanged;
- Data Classification and visibility;
- direction;
- legal or governance basis;
- interface;
- version;
- authentication;
- retention;
- monitoring;
- and support contact.

### 53.2 Data Processing Agreement

Where required, external processing relationships should be documented.

### 53.3 Integration Approval

High-risk integrations should require governance review.

### 53.4 Periodic Review

Integrations should be reviewed for:

- continued purpose;
- security;
- quality;
- necessity;
- consent and purpose compatibility;
- data minimisation;
- deletion and provider-training behaviour;
- block, moderation and safety implications;
- and Participant impact.

### 53.5 Provider Data Use

Integration records explicitly state whether a provider may retain content, train models, improve services, use metadata, subcontract processing, transfer jurisdictions or create derived data.

Silence is not treated as permission.

### 53.6 Capability Negotiation

Integrations expose supported schema versions, actions, authentication, classifications, rate and size limits, deletion, idempotency, partial results and degraded modes.

---

## 54. Failure and Degraded Modes

### 54.1 External System Unavailable

The platform should identify:

- which data are unavailable;
- whether cached data are shown;
- freshness;
- and whether the workflow may continue.

### 54.2 Partial Import

Partial imports should be marked incomplete and not silently treated as complete.

### 54.3 Schema Mismatch

Schema mismatch should trigger:

- rejection;
- quarantine;
- mapping review;
- or compatible fallback.

### 54.4 Terminology Failure

Unknown codes should remain unresolved rather than mapped incorrectly.

### 54.5 Consent Check Failure

High-risk data use, AI context, public publication, matching, messaging, export and dataset generation should pause when consent or purpose cannot be verified.

### 54.6 Identity Match Uncertainty

Potential identity conflicts should require review.

### 54.7 Device Data Gap

Missing device data should produce a gap, not a normal value.

### 54.8 AI Context Failure

The AI Companion should not operate as though missing, stale, blocked, withdrawn or unauthorised context were current.

### 54.9 Export Failure

Failed exports should preserve:

- request;
- error;
- partial output status;
- and retry history.

### 54.10 Social or Matching Service Failure

The platform must not fabricate Community membership, publication, MatchCandidate, MatchDecision, MutualAcceptance, Connection, message delivery, block, report or moderation result.

Drafts may be preserved with clear unsent or unpublished state.

### 54.11 Moderation or Safety Service Failure

Safety-critical block and report controls should use deterministic fallback where possible.

Delayed reports, moderation backlog, unavailable reviewer state and affected exposure period are recorded.

A SafetySignal is not silently dropped or converted to a SafetyEvent.

### 54.12 Dataset or Lineage Failure

DatasetVersion generation or lock pauses when source lineage, consent, quality review, manifest or checksum is incomplete.

Analysis does not proceed as governed analysis against an unlocked DatasetVersion.

### 54.13 Deletion Propagation Failure

Failed removal from indexes, caches, AI memory, providers or public endpoints creates a tracked remediation record and Participant-facing state where appropriate.

### 54.14 Degraded-Mode Classification

Actions may be classified as:

- Continue;
- Continue with Warning;
- Read Only;
- Manual Review Required;
- Pause;
- or Block.

---

## 55. Observability

### 55.1 Integration Metrics

Monitor:

- request volume;
- latency;
- error rate;
- timeout;
- retry;
- rate limits;
- and availability.

### 55.2 Data Quality Metrics

Monitor:

- completeness;
- invalid records;
- duplicate records;
- unresolved mappings;
- missing consent;
- and late data.

### 55.3 Dataset Metrics

Monitor:

- DatasetDefinition approval;
- DatasetVersion generation and quality review;
- lock state and age;
- missingness;
- transformation failures;
- and access.

### 55.4 AI Data Metrics

Monitor:

- prompt size;
- retrieval success;
- tool success;
- citation coverage;
- human correction;
- invented Life Story detail;
- sensitive context leakage;
- block or visibility bypass attempt;
- MatchExplanation quality;
- moderation-assistance error;
- SafetySignal creation and disposition;
- and unsafe output.

### 55.5 Privacy Metrics

Monitor:

- unauthorised access attempts;
- export volume;
- consent failures;
- deletion requests;
- sensitive-data exposure;
- public-visibility changes;
- Internet Public publication;
- reporter-identity exposure;
- block bypass;
- provider training or retention violations;
- and deletion-propagation failures.

### 55.6 Social, Matching and Moderation Metrics

Monitor candidate generation and eligibility failure, MutualAcceptance violations, message delivery and abuse, block propagation, report and triage latency, moderation backlog, false decisions, appeal and restoration, fraud and harassment signals, public-exposure incidents, and equity.

### 55.7 Life Story Metrics

Monitor media-processing failure, transcription and translation correction, attribution dispute, invented-detail correction, visibility and sharing errors, withdrawal and export completion, third-party complaints and legacy-processing state.

---

## 56. Conceptual Data Flows

### 56.1 Participant Assessment Flow

```text
Participant or Authorised Assistant
        ↓
Permission, Consent and Protocol Check
        ↓
Assessment Interface and Measurement Version
        ↓
AssessmentRecord
        ↓
Validation, Assistance and Adaptation Record
        ↓
OutcomeRecord where defined
        ↓
DatasetDefinition
        ↓
DatasetVersion and Analysis
```

### 56.2 Intervention Delivery Flow

```text
ProtocolVersion
        ↓
InterventionVersion and Configuration
        ↓
InterventionAssignment
        ↓
InterventionSession
        ↓
Exposure, Adaptation, Fidelity and Deviation
        ↓
Assessment, Observation, Safety and Process Evaluation
```

### 56.3 Life Story Flow

```text
Participant or Authorised Contribution
        ↓
Consent, Permission and Item Context
        ↓
Draft Text or Media
        ↓
Transcription, Translation or AI Assistance
        ↓
Participant Review and Attribution
        ↓
LifeStoryItem Version
        ↓
Visibility and Reuse Choice
        ↓
Optional Sharing, Export or Research Inclusion
```

### 56.4 Community, Matching and Messaging Flow

```text
PublicProfile and Community Eligibility
        ↓
Visibility, Rule and Block Filters
        ↓
Community Content or MatchCandidate
        ↓
MatchExplanation and Independent MatchDecision
        ↓
MutualAcceptance where Applicable
        ↓
Connection
        ↓
Current CommunicationBasis
        ↓
ConversationThread
        ↓
Message Draft and SendConfirmation
        ↓
DeliveryAttempts and Delivery State
        ↓
Human Interaction, Block, Report or Moderation
```

### 56.5 AI-Assisted Flow

```text
User Request
        ↓
Human and AI Permission Intersection
        ↓
Minimum-Necessary Context Assembly
        ↓
Knowledge Retrieval and Typed Tools
        ↓
AIResponse with Provenance and Classification
        ↓
Participant Confirmation or Human Review
        ↓
Owning-Domain Command
        ↓
Confirmed Result, Failure or SafetySignal
```

### 56.6 Safety and Moderation Flow

```text
Concern, UserReport or ContentReport
        ↓
ModerationCase and/or SafetySignal
        ↓
Human Triage
        ↓
ModerationDecision, PrivacyReview or SafetyEvent
        ↓
Action, Monitoring, Appeal and Resolution
```

### 56.7 External Data Import Flow

```text
External Source
        ↓
Integration Adapter
        ↓
Structural and Semantic Validation
        ↓
Consent, Purpose and Authority Check
        ↓
Canonical Mapping
        ↓
Quality Flags and Quarantine
        ↓
Owning-Domain Record or External Reference
        ↓
Audit and Lineage
```

### 56.8 Research Dataset and Analysis Flow

```text
Approved DatasetDefinition
        ↓
Source Selection and Permission Evaluation
        ↓
TransformationRun
        ↓
DatasetVersion
        ↓
Quality Review and DatasetLock
        ↓
Approved AnalysisPlan
        ↓
AnalysisRun
        ↓
AnalysisOutput and Diagnostics
        ↓
InterpretationRecord
        ↓
ResearchFinding
```

### 56.9 Research Export Flow

```text
Approved Locked DatasetVersion or Report
        ↓
ExportSpecification
        ↓
De-Identification and Restriction Check
        ↓
Validation and Manifest
        ↓
Approval
        ↓
ExportPackage
        ↓
Delivery and Recipient Record
```

### 56.10 Deletion Propagation Flow

```text
Withdrawal, Deletion or Retention Trigger
        ↓
Authority and Preservation Review
        ↓
Owning-Domain State Change
        ↓
Indexes, Caches, AI Memory and Derived Data
        ↓
Pending Exports and Providers
        ↓
Public Endpoints and External Recipients
        ↓
Audit, Exceptions and Completion Status
```

## 57. Conceptual Service Boundaries

Representative logical responsibilities include:

- IdentityDataService;
- OrganisationDataService;
- ParticipantProfileDataService;
- RelationshipDataService;
- ConsentAndPermissionDataService;
- ResearchProjectDataService;
- ProtocolDataService;
- EnrolmentDataService;
- InterventionPortfolioDataService;
- InterventionDeliveryDataService;
- AssessmentDataService;
- ObservationAndOutcomeDataService;
- SafetySignalDataService;
- SafetyEventDataService;
- EvidenceReferenceDataService;
- AIInteractionDataService;
- AIMemoryDataService;
- LifeStoryDataService;
- MediaAssetService;
- CommunityDataService;
- MatchingDataService;
- ConnectionAndMessagingDataService;
- BlockAndReportDataService;
- ModerationDataService;
- DatasetDefinitionService;
- DatasetVersioningService;
- DatasetLockService;
- DataQualityService;
- TransformationService;
- AnalysisDataService;
- ReportingAndExportService;
- DeviceDataService;
- TerminologyService;
- IdentifierMappingService;
- ProvenanceAndLineageService;
- DeIdentificationService;
- ImportAndMigrationService;
- AuditDataService;
- IntegrationRegistryService;
- RetentionAndDeletionService.

These are logical boundaries and do not require one microservice per responsibility.

## 58. MVP Scope

### 58.1 MVP Data Domains

The MVP supports:

- UserAccount, Organisation and RoleAssignment;
- ParticipantProfile and AccessibilityPreference;
- Relationship, Consent and PolicyDecision;
- ResearchProject, ResearchQuestion and ProtocolVersion;
- ScreeningRecord, EligibilityDecision and Enrolment;
- InterventionVersion, InterventionConfiguration and InterventionAssignment;
- InterventionSession, ExposureRecord and FidelityRecord;
- AssessmentRecord, Observation and OutcomeRecord;
- SafetySignal and basic SafetyEvent workflow;
- KnowledgeReference, EvidenceDecision and EvidenceSnapshot;
- AIConversation, AIInteraction, AIInterventionConfigurationVersion and AIMemoryItem;
- DatasetDefinition, DatasetVersion, DatasetLock and DataQualityIssue;
- AnalysisPlan, AnalysisRun, InterpretationRecord and ResearchFinding;
- LifeStoryArchive, LifeStoryItem, LifeStoryContribution and LegacyPreference where enabled;
- PublicProfile, CommunitySpace, SocialPost and Comment;
- MatchPreference, MatchCandidate, MatchExplanation and MatchDecision;
- MutualAcceptance and Connection;
- CommunicationBasis, ConversationThread and Message;
- MessageVersion, SendConfirmation, MessageAttachment and MessageDeliveryAttempt;
- MuteRecord, BlockRecord, UserReport, ContentReport and ModerationCase;
- ReportVersion, ExportRequest and AuditEvent.

ConnectionRequest data contracts are deferred and feature-disabled for the first Pilot.

### 58.2 MVP Interoperability

The MVP includes:

- versioned REST APIs;
- explicit domain commands;
- canonical Domain Events;
- deliberate Integration Events;
- UX Analytics mapping;
- transactional outbox;
- idempotent consumers;
- Knowledge Platform MCP or governed REST integration;
- approved communication-provider adapter;
- authenticated provider callbacks;
- provider-reference mapping and delivery reconciliation;
- structured import and export;
- external identifier mapping;
- provenance and lineage;
- Consent, Block, CommunicationBasis and ResourceState checks;
- audit;
- schema versioning;
- and manual reconciliation where required.

### 58.3 MVP Dataset Capability

The MVP supports DatasetDefinition, variable dictionary, source manifest, DatasetVersion, TransformationRun, quality issues, de-identification, DatasetLock, locked export, AnalysisPlan and AnalysisRun references, lineage and access control.

Message body is excluded from ordinary Pilot DatasetDefinitions.

Any included Message metadata must be explicitly defined and minimised.

### 58.4 MVP Life Story and Social Data

The MVP supports:

- text, voice and photograph LifeStoryItems;
- transcription;
- attribution;
- Participant confirmation;
- granular Visibility;
- Life Story export;
- PublicProfile;
- CommunitySpace and CommunityRuleVersion;
- SocialPost and Comment;
- opt-in Open Matching;
- explainable MatchCandidates;
- independent MatchDecisions;
- MutualAcceptance;
- Connection;
- ConversationThread under current CommunicationBasis;
- Message Draft, SendConfirmation and delivery state;
- Mute, Disconnect, Block and Report;
- ModerationCase and human decision.

Internet Public is disabled by default.

### 58.5 MVP AI Data

The MVP records AIInteraction, model and configuration versions, permission and purpose result, Context references, KnowledgeReferences, Tools and domain results, output classification, confirmation or Human Review, AIMemoryItem changes, AISafetySignalRaised, failure and evaluation labels.

AI does not create MutualAcceptance, Connection, ConversationThread or Message send authority.

### 58.6 MVP Device Scope

Device integration may initially be limited to manual upload, one approved wearable source or simulated data.

Device data do not silently become outcomes.

### 58.7 MVP Constraints

The MVP may use:

- modular monolith;
- one transactional store;
- object storage for media;
- one Search index;
- optional Vector index with strict permission filtering;
- one analytical environment or export workflow;
- limited terminology mapping;
- scheduled lineage and deletion reconciliation;
- manual conflict review;
- and deferred real-time federation.

### 58.8 MVP Non-Goals

The MVP excludes:

- unrestricted public APIs;
- Internet Public publication by default;
- direct ConnectionRequest experience;
- unrestricted people search;
- unrestricted or group messaging;
- hidden social-graph, vulnerability or compatibility profiling;
- sensitive-trait matching without governance;
- Message-body Search, AI memory or ordinary research use;
- autonomous identity merge;
- autonomous SafetyEvent confirmation;
- autonomous high-impact ModerationDecision;
- autonomous DatasetLock or export approval;
- provider model training without authorisation;
- real-time multi-site federation;
- unrestricted health-record integration;
- and collection without approved purpose.

---

## 59. Deferred Capabilities

Deferred capabilities may include:

- multi-site data federation;
- cross-organisation master data management;
- advanced terminology services;
- real-time health-system integration;
- streaming wearable ingestion;
- smart-home event processing;
- imaging integration;
- genomic data;
- advanced privacy-preserving linkage;
- federated learning;
- secure research environments;
- dynamic consent;
- Participant-controlled data wallets;
- automated data-quality remediation;
- automated semantic mapping;
- synthetic data generation;
- privacy-preserving social-graph analytics;
- advanced matching-policy simulation;
- continuous moderation and fraud detection;
- posthumous digital-legacy exchange;
- Internet Public archival integration;
- and public research APIs.

---

## 60. Future Evolution

Future versions may support:

- federated research networks;
- cross-jurisdiction data spaces;
- privacy-preserving analytics;
- Participant-mediated data exchange;
- real-time adaptive interventions;
- longitudinal Healthy Aging records;
- digital biomarkers;
- multi-modal data;
- Participant-controlled data spaces and digital legacy;
- privacy-preserving Community and matching analytics;
- automated research lineage;
- policy data integration;
- external research observatories;
- and controlled data commons.

Future evolution must preserve:

- Participant rights;
- domain meaning;
- provenance;
- reproducibility;
- security;
- and accountable governance.

---

## 61. Design Decisions

This document establishes that:

1. Document 12 v1.2 is the authoritative Handbook source for logical data and interoperability architecture.
2. Canonical domain meaning and aggregate ownership are defined independently from physical storage and external standards.
3. Document 8 v3.2 governs M18 aggregate ownership and language.
4. Document 15 v1.2 governs API, event, provider and integration contracts.
5. Every material aggregate has one accountable write owner.
6. Storage, index, cache, projection, event and analytical copies do not acquire write authority.
7. Operational, content, research, analytical, governance, AI, integration and knowledge-reference planes remain distinguishable.
8. The Platform is not a general-purpose EHR, uncontrolled data lake, advertising profile or surveillance system.
9. Every material data element preserves meaning, owner, purpose, provenance, permission context, ResourceState, classification, lifecycle and retention.
10. Authority, DataClassification, Visibility, Consent, purpose, research inclusion and publication permission are separate.
11. Platform Public and Internet Public are distinct.
12. Public Visibility does not create research, model-training, quotation or redistribution permission.
13. Permission uses Role, Relationship, Consent, Purpose, Context, SpecificPermission and ResourceState.
14. Permission filtering occurs before API response, event detail, AI Context, Search, export and Dataset inclusion.
15. Relationship, MatchCandidate, MutualAcceptance, Connection and CommunicationBasis are distinct.
16. Connection does not create Supporter, care or research authority.
17. Open Matching is opt-in and MatchPreference-controlled.
18. MatchCandidate is not MatchDecision, MutualAcceptance, Connection or CommunicationBasis.
19. Each MatchDecision belongs to one deciding actor and exact candidate version.
20. MutualAcceptance is a canonical data aggregate.
21. MutualAcceptance preserves exact source records, actors, purpose, policy version, effective period, validity and Connection usage.
22. Unused MutualAcceptance may expire or be invalidated.
23. One MutualAcceptance activates at most one Connection unless separately approved.
24. ConnectionRequest is a Deferred Alternative Connection Basis and is disabled for the first Pilot.
25. Accepted ConnectionRequest creates MutualAcceptance rather than Connection directly.
26. Connection is activated from valid MutualAcceptance.
27. CommunicationBasis is required for ConversationThread creation and Message send.
28. CommunicationBasis may reference Connection, authorised Relationship, InterventionSession or another governed basis.
29. ConversationThread is a canonical M18 data aggregate.
30. ConversationThread preserves exact participants and cannot silently add another actor.
31. ConversationThread does not broaden Connection, Relationship, Consent or purpose.
32. Message is a canonical M18 data aggregate.
33. Message Draft is not SendConfirmed, Queued, Sent, ProviderAccepted, Delivered or Read.
34. MessageVersion preserves exact Draft content and provenance.
35. SendConfirmation is actor-, Message-version- and recipient-specific.
36. Message lifecycle and delivery state remain separate.
37. MessageDeliveryAttempt preserves provider, adapter, reference, evidence, state and retry.
38. Provider callbacks are restricted integration data and not the system of record.
39. Provider state cannot create sender authority or change Message content or recipients.
40. Failed or unknown delivery is not Delivered.
41. Message body is excluded by default from events, logs, Search, Vector, matching, AI memory and ordinary research.
42. Message-content analysis requires explicit Consent, purpose, DatasetDefinition, minimisation and governance.
43. Block enforcement occurs before discovery, matching, MutualAcceptance, Connection, Thread creation, Message send, notification, ranking and AI Context.
44. Block revocation does not restore MatchPreference, MutualAcceptance, Connection, ConversationThread or delivery.
45. Mute, Disconnect, Block and Report are distinct records.
46. Report remains available after Block or Disconnect.
47. Reporter identity receives restricted protection.
48. ModerationCase, SafetySignal, SafetyEvent, PrivacyIncident, AIIncident and TechnicalIncident remain separate.
49. Automated and AI detection creates SafetySignal, not confirmed SafetyEvent.
50. Domain Event, Integration Event, UX Analytics Event, Operational Event and Audit Event are distinct.
51. UX interaction and provider callback do not establish domain completion.
52. Canonical M18 events use Document 8 v3.2 names.
53. MessageDeliveryConfirmed is a deprecated alias for MessageDelivered.
54. ActorBlocked is a deprecated alias for BlockCreated.
55. DatasetLockConfirmed is a UX alias; DatasetVersionLocked is canonical.
56. Event possession does not create permission.
57. Material event publication uses transactional outbox or equivalent atomic mechanism.
58. Consumers are idempotent and tolerate duplicates.
59. LifeStory content remains Participant-controlled.
60. AI-generated Life Story wording remains Draft until Participant confirmation.
61. ParticipantProfile, PublicProfile and AIMemoryItem remain separate.
62. AIMemoryItem is not populated automatically from Life Story, matching or Messages.
63. KnowledgeReference and EvidenceSnapshot preserve external authority and exact versions.
64. Imported data preserve source authority, identifier, version, mapping, validation and purpose.
65. External standards use Anti-Corruption Layers and do not replace the canonical model.
66. Data transformations are non-destructive and versioned.
67. DatasetDefinition is approved before DatasetVersion generation.
68. DatasetVersion preserves exact source and transformation lineage.
69. DatasetLock is governed and immutable.
70. Correction after lock creates a new DatasetVersion.
71. AnalysisRun references an exact approved AnalysisPlan and locked DatasetVersion.
72. AnalysisOutput does not become InterpretationRecord or ResearchFinding.
73. Research exports include DatasetDefinition, locked DatasetVersion, lineage, restrictions and manifest.
74. De-identification is risk-based and does not assume public or social data are anonymous.
75. Deletion and withdrawal propagate to indexes, Vector stores, caches, AI memory, matching, feeds, pending Messages and providers.
76. Locked research data are not silently edited after withdrawal or correction.
77. High-impact changes use explicit domain commands rather than generic mutation.
78. Failure and degraded modes expose incompleteness and never fabricate matching, messaging, moderation, Safety or Dataset results.
79. The MVP includes Life Story, Community, Open Matching, MutualAcceptance, Connection, ConversationThread, Message, Block, Report and moderation data.
80. Internet Public, direct ConnectionRequest experience, unrestricted messaging and Message-content analysis are deferred.
81. Version 1.2 completes Document 12 revalidation against Documents 8 v3.2 and 15 v1.2.

---

## 62. Summary

The Data & Interoperability Architecture defines how the Platform represents and exchanges Participant, research, intervention, Life Story, Community, matching, messaging, moderation, Safety, AI, device and external data while preserving domain authority, rights, provenance and reproducible lineage.

The canonical social and messaging data path is:

```text
MatchPreference
        ↓
MatchCandidate
        ↓
Independent MatchDecision
        ↓
MutualAcceptance
        ↓
Connection
        ↓
CommunicationBasis
        ↓
ConversationThread
        ↓
Message Draft
        ↓
SendConfirmation
        ↓
MessageDeliveryAttempt
        ↓
Sent / Provider Accepted / Delivered / Failed
```

The canonical research path is:

```text
Define Meaning, Owner and Purpose
        ↓
Collect, Create or Import
        ↓
Validate Authority, Consent and Permission
        ↓
Classify and Apply Visibility and ResourceState
        ↓
Store in the Owning Domain
        ↓
Trace Provenance and Versions
        ↓
DatasetDefinition
        ↓
DatasetVersion
        ↓
Quality Review and DatasetLock
        ↓
AnalysisRun
        ↓
InterpretationRecord and ResearchFinding
```

The central rule is:

> Data do not gain authority because they can be collected, transmitted, indexed, embedded, delivered or analysed. Authority remains with the current domain record, Consent, purpose, permission, Visibility, Block, CommunicationBasis and governance state.

The Research Platform owns its research and intervention records.

The Knowledge Platform remains authoritative for curated knowledge.

External identity, communication, care, Community, research and device systems remain authoritative for their own source evidence but do not directly mutate canonical Platform records.

The AI Companion may consume and produce governed data, but its Context and outputs remain minimum-necessary, source-labelled, versioned, reviewable, deletion-aware and subordinate to human authority.
