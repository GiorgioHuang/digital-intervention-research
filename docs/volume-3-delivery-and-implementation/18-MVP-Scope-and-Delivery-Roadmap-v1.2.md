# Document 18 — MVP Scope & Delivery Roadmap

**Version:** 1.2  
**Status:** Revised MVP and Delivery Baseline — M18 Formation and Messaging Revalidated  
**Handbook Volume:** Volume III — Delivery & Research Implementation  
**Primary System:** Digital Intervention Research Platform  
**Primary Product Modules:** M01–M18  
**Initial Pilot Type:** Feasibility, Acceptability, Accessibility and Operational Pilot  
**Document Owner:** Product, Research and Delivery Governance  
**Approved By:** To be assigned  
**Last Updated:** 2026-07-29  
**Supersedes:** Document 18 — MVP Scope & Delivery Roadmap v1.1  
**Review Trigger:** A material change to the selected intervention portfolio, ResearchQuestions, Protocol, target population, Pilot setting, Life Story scope, Community or public visibility, Open Matching, MatchDecision, MutualAcceptance, ConnectionRequest, Connection, CommunicationBasis, ConversationThread, Message lifecycle or delivery, Block, moderation, Safety, AI configuration, Dataset or Analysis plan, provider integration, security readiness, ethics approval, operational support, milestone dependencies, release gates or Pilot success criteria

---

## 1. Purpose

This document defines the **Minimum Viable Product Scope and Delivery Roadmap** for the **Healthy Aging Digital Intervention Research Platform**.

It translates Documents 0–17 into an executable delivery baseline for one controlled Pilot.

The MVP is not a collection of unrelated features and is not a general consumer social network.

It is a **research-capable, Participant-controlled vertical slice** that must complete the full cycle:

```text
Healthy Aging Challenge
        ↓
Research Question and Evidence Decision
        ↓
Approved ProtocolVersion
        ↓
Consent, Eligibility and Enrolment
        ↓
Ability-Adaptive Onboarding
        ↓
Life Story and Participant-Controlled Sharing
        ↓
Community Participation and Opt-In Open Matching
        ↓
Mutual Connection and Human Interaction
        ↓
Assessment, Observation, Moderation and Safety
        ↓
DatasetDefinition and DatasetVersion
        ↓
DatasetLock and AnalysisRun
        ↓
InterpretationRecord and ResearchFinding
        ↓
InterventionDecision
```

The MVP must demonstrate that the Platform can:

- connect evidence to intervention design;
- preserve exact Protocol, Intervention and AI configuration versions;
- enrol and support Participants accessibly;
- enforce granular Consent, purpose, visibility, Block and Specific Permission;
- support private-by-default Life Story creation;
- support governed Community participation;
- support opt-in, explainable Open Matching;
- require independent Match Decisions and Mutual Acceptance;
- support safe human Connection and limited messaging;
- use AI only within approved, typed and human-accountable boundaries;
- distinguish moderation, SafetySignal and SafetyEvent;
- collect process, outcome, burden, accessibility, moderation, safety and AI data;
- generate and lock a reproducible DatasetVersion;
- execute a traceable AnalysisRun;
- support human-approved interpretation and ResearchFinding;
- and record an accountable InterventionDecision.

The central delivery rule is:

> The MVP is successful only when one real, governed intervention research cycle can be completed end to end without bypassing Participant autonomy, social safety or research reproducibility.

---

## 2. Scope

This document covers:

- MVP definition and product thesis;
- selected intervention portfolio;
- integrated vertical slice;
- target users, setting and scale;
- assumptions and operating constraints;
- research and product objectives;
- outcome domains;
- M01–M18 minimum product scope;
- Participant, Supporter, Researcher, Moderator and Safety journeys;
- Life Story, Community, Open Matching, Connections and messaging;
- AI, evidence, moderation and Safety scope;
- data, Dataset, Analysis and Research Finding scope;
- technical, security, privacy and operational scope;
- Core, Controlled Optional and Deferred capabilities;
- delivery principles and critical path;
- workstreams, milestones, epics and dependencies;
- Definition of Ready and Definition of Done;
- acceptance criteria;
- synthetic Pilot;
- Pilot readiness, release and rollback;
- testing, observability, support and training;
- delivery governance and scope change;
- success, failure and post-Pilot decisions;
- risks and assumptions;
- required delivery artefacts;
- open questions;
- and architecture guardrails.

This document does not define:

- final ethics submission;
- final Protocol wording;
- final sample size;
- final measurement instruments;
- final statistical thresholds;
- final Pilot calendar dates;
- final staffing assignments;
- final vendor selections;
- final legal retention periods;
- or final visual design.

Those details are completed through Document 19, Document 20, approved Architecture Decision Records, Protocol artefacts and implementation planning.

---

## 3. Relationship to Other Documents

### Depends on

- Document 0 — Platform Ecosystem Architecture v1.2
- Document 1 — Project Definition & Vision v2.1
- Document 2 — Conceptual & Evidence Framework v2.1
- Document 3 — Intervention Map v2.2
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
- Document 16 — Database & Storage Design v1.2
- Document 17 — AI Orchestration & Model Operations v1.1

### Provides input to

- Document 19 — Initial Pilot Research Protocol revision
- Document 20 — UX Flows & Design System Specification revision
- Product Backlog
- Delivery Plan
- Research Readiness Checklist
- Pilot Operations Plan
- Test Strategy
- Deployment and Rollback Plan
- Participant and Supporter Materials
- Moderator and Safety Runbooks
- Data Management Plan
- DatasetDefinition
- AnalysisPlan
- AI Evaluation Plan
- Training Plan
- Support Model
- Pilot Readiness Decision

### Authority Hierarchy

| Subject | Authority |
|---|---|
| Product modules and capabilities | Document 6 |
| Information architecture | Document 7 |
| Domain ownership and state | Document 8 |
| AI role and boundaries | Documents 10 and 17 |
| Research lifecycle | Document 11 |
| Technical and security architecture | Documents 13–16 |
| Pilot scope, delivery sequence and readiness | Document 18 v1.1 |
| Final Pilot study design | Approved Document 19 ProtocolVersion |

---

### 3.1 v1.2 Revalidation Result

Version 1.2 revalidates MVP scope and delivery sequencing against:

- Document 8 v3.2 — canonical M18 aggregate ownership and invariants;
- Document 12 v1.2 — data meaning, minimisation and research lineage;
- Document 13 v1.2 — M18 runtime ownership and M16 provider boundaries;
- Document 15 v1.2 — API, event, callback and AI Tool contracts; and
- Document 16 v1.2 — persistence constraints and transactional boundaries.

The first-Pilot social and messaging delivery path is:

```text
MatchPreference
        ↓
MatchCandidate and MatchExplanation
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
Actor-Specific SendConfirmation
        ↓
MessageQueued
        ↓
M16 Provider Adapter
        ↓
MessageSent / Provider Accepted / Delivered / Failed
```

`ConnectionRequest` remains a Deferred Alternative Connection Basis and is feature-disabled for the first Pilot.

Existing authorised contacts may complete the intervention without an M18 Connection. Platform messaging for that pathway still requires an approved CommunicationBasis.

---

## 4. MVP Definition

The MVP is a **research-capable integrated vertical slice**.

It includes the minimum product, research, data, security, AI, social-safety and operational capability required to support a real but controlled Pilot.

It is not defined by:

- number of screens;
- number of modules;
- number of AI prompts;
- number of Community posts;
- or number of integrations.

It is defined by the ability to complete one credible research and intervention loop.

---

## 5. MVP Product Thesis

The MVP tests the following thesis:

> A Participant-controlled, ability-adaptive digital intervention can help older adults create and use Life Story content, participate in a governed Community, find suitable human contacts through opt-in explainable matching, and complete meaningful human interactions without replacing human relationships or compromising autonomy, privacy, accessibility, safety or research integrity.

The Platform supports the human relationship.

The AI Companion supports the Participant and workflow.

Neither the Platform nor AI becomes the relationship being studied.

---

## 6. MVP Unit of Value

The MVP unit of value is:

> One Participant completing an accessible and permission-controlled path from onboarding and Life Story creation through a meaningful human connection activity, reflection and follow-up, with complete research and governance traceability.

A valid unit includes:

- current Consent;
- approved Protocol and Intervention configuration;
- Participant choice;
- accessible delivery;
- traceable exposure;
- social and safety controls;
- outcome and burden measurement;
- and inclusion in an approved DatasetVersion only when permitted.

---

## 7. Initial Research Objective

The recommended primary objective is:

> To assess the feasibility, acceptability, accessibility and operational safety of a Participant-controlled, ability-adaptive digital intervention that combines Life Story, governed Community participation and structured human connection support for older adults.

Secondary objectives may assess:

- Life Story usability and perceived meaning;
- willingness to share under explicit audience controls;
- Community acceptability;
- Open Matching opt-in and explanation comprehension;
- Connection and messaging usability;
- AI usefulness without substitution or dependency;
- moderation and reporting usability;
- data completeness;
- and Platform research reproducibility.

The Pilot is not intended to establish definitive clinical effectiveness.

---

## 8. Initial Research Questions

Representative questions include:

1. Can Participants complete accessible onboarding, Consent, baseline assessment and intervention setup?
2. Can Participants create, review and control a LifeStoryItem?
3. Do Participants understand Private, Connections, Community, Platform Public and Internet Public distinctions?
4. Is governed Community participation acceptable and manageable?
5. Is opt-in Open Matching understandable and acceptable?
6. Do MatchExplanations accurately reflect permitted declared attributes?
7. Can Participants independently record Match Decisions without pressure?
8. Can the Platform enforce Block before discovery, matching and messaging?
9. Can Participants complete a meaningful human interaction through an existing contact or mutual Connection?
10. Does AI assist without inventing memories, accepting matches, sending Messages or creating dependency?
11. Are reporting, moderation and SafetySignal workflows usable and timely?
12. Which ability adaptations reduce burden?
13. What privacy, social, accessibility, moderation or safety concerns arise?
14. Can the Platform create a complete, permission-consistent DatasetVersion?
15. Can an AnalysisRun and ResearchFinding be traced to exact source, Protocol, intervention and AI versions?

Document 19 must convert these into approved primary and secondary Research Questions.

---

## 9. Selected Intervention Portfolio

The MVP uses one integrated InterventionConfiguration composed from selected Intervention Map records.

### Required Core

- **INT-001 — Structured Social Connection**
- **INT-002 — Interest-Based Connection and Open Matching**
- **INT-004 — Life Story and Participant-Controlled Personal Archive**
- **INT-009 — Ability-Adaptive Onboarding and Navigation**

### Controlled AI Layer

- **INT-003 — AI Companion-Facilitated Human Connection**

This is enabled only for approved tasks and participants.

### Controlled Optional Components

- **INT-005 — Intergenerational Story Sharing**
- **INT-008 — Participant-Controlled Family and Care Network**
- **INT-010 — Orientation or Context Support**, only if approved in the Protocol

These optional components require explicit configuration and may be disabled for the first enrolled cohort.

---

## 10. Integrated Vertical Slice

The recommended vertical slice is:

# Participant-Controlled Life Story and Meaningful Connection

```text
Accessible Onboarding
        ↓
Private LifeStoryArchive
        ↓
Participant-Confirmed LifeStoryItem
        ↓
Optional Selected Sharing or Community Post
        ↓
PublicProfile and Community Participation
        ↓
Opt-In MatchPreference
        ↓
MatchCandidate and MatchExplanation
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
Dataset, Analysis and Finding
```

A Participant may complete the core intervention through:

- an existing authorised human contact;
- a mutual Open Matching Connection;
- or a structured Community interaction approved by the Protocol.

The Protocol must specify which pathways count as intervention exposure.

---

## 11. Core Intervention Path

The required intervention path includes:

1. understand the study;
2. make granular Consent choices;
3. set accessibility and communication preferences;
4. create or review a private Life Story item;
5. choose whether and how to share;
6. choose an existing contact or opt into Open Matching;
7. review a human-readable MatchExplanation where matching is used;
8. independently decide;
9. establish mutual Connection when both Participants accept;
10. prepare for a human interaction;
11. send or use a confirmed communication plan;
12. complete, decline, skip or interrupt the interaction;
13. reflect;
14. complete follow-up;
15. preserve safety, moderation and research records.

---

## 12. Alternative Core Path

A Participant who does not opt into Open Matching must still be able to complete the Pilot through an existing authorised contact or permitted Community activity.

Open Matching is a Pilot capability, not a condition for participation unless the approved Protocol explicitly defines a matching-specific cohort.

Declining matching must not:

- reduce unrelated intervention access;
- produce coercive messaging;
- create a negative outcome label;
- or affect Supporter permissions.

---

## 13. Target Participants

The initial population is older adults participating in a controlled Pilot.

The MVP must not assume:

- high digital literacy;
- perfect vision or hearing;
- high reading ability;
- rapid response;
- stable attention;
- high motor precision;
- an existing active social network;
- or independent completion of every task.

Eligibility, support and exclusion criteria belong to the approved Protocol.

---

## 14. Other Human Actors

The MVP supports:

- Participant;
- authorised Supporter;
- Researcher;
- Research Coordinator;
- Research Approver;
- Data Steward or Analyst;
- Moderator;
- Safety Reviewer;
- Organisation Administrator;
- System Administrator;
- and approved Service Accounts.

Professional Caregiver or family involvement is represented through explicit Relationship and permission, not broad role assumptions.

---

## 15. Initial Setting

The first Pilot should use one controlled setting, such as:

- community-dwelling older adults;
- independent or assisted living;
- a community programme;
- a seniors' organisation;
- or a small partner care organisation.

The selected setting must support:

- recruitment;
- accessible onboarding;
- Participant support;
- moderation response;
- Safety escalation;
- and follow-up.

---

## 16. Initial Scale

Initial assumptions:

- one primary Organisation or research team;
- one active ResearchProject;
- one approved ProtocolVersion;
- one integrated InterventionConfiguration;
- one approved AIInterventionConfigurationVersion;
- a limited Participant cohort;
- one or a small number of governed CommunitySpaces;
- controlled Open Matching;
- limited message volume;
- one primary language initially;
- limited media;
- and defined support hours.

The architecture preserves M01–M18 boundaries without requiring enterprise-scale deployment.

---

## 17. Pilot Cohort Structure

The approved Protocol may use:

- one integrated cohort;
- staged cohorts;
- a Life Story-first cohort;
- an existing-contact cohort;
- and a controlled matching cohort.

Cohort structure must be recorded in:

- ProtocolVersion;
- InterventionAssignment;
- DatasetDefinition;
- and AnalysisPlan.

Cohort differences must not be hidden behind feature flags without research traceability.

---

## 18. Operating Constraints

The MVP operates under these constraints:

- controlled enrolment;
- authenticated Platform use;
- no anonymous public posting;
- no unrestricted Internet exposure;
- private-by-default Life Story;
- explicit Community membership;
- opt-in matching;
- mutual acceptance before Connection;
- limited messaging;
- human moderation;
- human Safety review;
- approved AI tasks only;
- one governed analytical environment;
- and manual support for high-impact exceptions.

---

## 19. MVP Success Orientation

The MVP prioritises:

1. Participant autonomy;
2. Consent and privacy;
3. accessibility;
4. social safety;
5. research validity;
6. reproducibility;
7. operational feasibility;
8. AI usefulness;
9. technical reliability;
10. future extensibility.

Engagement volume, time spent and social activity counts do not outrank these priorities.

---

## 20. Primary Outcome Orientation

The Pilot should primarily evaluate:

- feasibility;
- acceptability;
- accessibility;
- burden;
- intervention fidelity;
- social-safety operations;
- AI boundary adherence;
- data completeness;
- and research reproducibility.

Healthy Aging outcome changes remain exploratory unless the approved design supports stronger inference.

---

## 21. Feasibility Outcomes

Representative feasibility measures include:

- invitation acceptance;
- Consent completion;
- onboarding completion;
- baseline completion;
- Life Story creation or review;
- sharing-choice completion;
- Community participation;
- matching opt-in;
- MatchCandidate review;
- Connection activation;
- human-interaction completion;
- reflection completion;
- follow-up completion;
- support time;
- and withdrawal completion.

---

## 22. Acceptability Outcomes

Representative acceptability measures include:

- perceived relevance;
- satisfaction;
- willingness to continue;
- Life Story value;
- comfort with sharing controls;
- Community experience;
- MatchExplanation clarity;
- Connection experience;
- Message assistance acceptability;
- Supporter experience;
- and willingness to recommend or repeat.

---

## 23. Accessibility Outcomes

Representative accessibility measures include:

- task completion;
- assistance required;
- adaptation selection;
- error recovery;
- time;
- abandonment;
- repeated instruction use;
- modality preference;
- comprehension;
- and Participant-reported burden.

Accessibility outcome interpretation must distinguish Platform difficulty from intervention difficulty.

---

## 24. Process Outcomes

Representative process measures include:

- offered, viewed, started and completed intervention components;
- Life Story Draft and confirmation;
- audience selection;
- SocialPost publication;
- MatchPreference activation;
- MatchCandidate generation and review;
- independent Match Decisions;
- MutualAcceptance;
- Connection;
- Message Draft and confirmed send;
- human-interaction record;
- reflection;
- AI assistance;
- moderation action;
- and SafetySignal processing.

Process activity is not automatically a Healthy Aging outcome.

---

## 25. Early Healthy Aging Signals

Exploratory signals may include:

- perceived social connectedness;
- confidence initiating contact;
- meaningful participation;
- autonomy;
- sense of meaning;
- feeling known or heard;
- relationship quality;
- and willingness to engage in future human interaction.

The Protocol must specify instruments, timing and interpretation limits.

---

## 26. Safety and Burden Outcomes

Representative outcomes include:

- distress;
- confusion;
- coercion;
- privacy concern;
- unwanted contact;
- harassment;
- scam exposure;
- dependency signal;
- digital fatigue;
- social burden;
- supporter burden;
- moderation burden;
- withdrawal difficulty;
- and SafetyEvent occurrence.

SafetySignal counts are not treated as confirmed SafetyEvent counts.

---

## 27. Platform Outcomes

The MVP also evaluates:

- permission correctness;
- Consent propagation;
- Block propagation;
- moderation timeliness;
- Safety triage;
- AI Tool correctness;
- Dataset completeness;
- lineage completeness;
- reproducibility;
- deployment stability;
- backup and restore;
- and support workload.

---

## 28. Complete Research Cycle

A successful Pilot must preserve:

```text
ResearchQuestion
        ↓
EvidenceReview and EvidenceDecision
        ↓
EvidenceSnapshot
        ↓
ProtocolVersion
        ↓
InterventionVersion and Configuration
        ↓
AIInterventionConfigurationVersion
        ↓
Enrolment and Assignment
        ↓
Exposure, Assessment, Observation and Safety
        ↓
DatasetDefinition and DatasetVersion
        ↓
DatasetLock
        ↓
AnalysisPlan and AnalysisRun
        ↓
InterpretationRecord
        ↓
ResearchFinding
        ↓
InterventionDecision
```

No step is represented only through an informal spreadsheet or unversioned document.

---

## 29. MVP Product Scope Map

The MVP implements all M01–M18 modules at the minimum depth needed by the vertical slice.

| Module | MVP Responsibility |
|---|---|
| M01 | identity, Organisation, roles and Service Accounts |
| M02 | ParticipantProfile, AccessibilityProfile and preferences |
| M03 | Relationship, Delegation, Consent and PolicyDecision |
| M04 | ResearchProject, ResearchQuestion, Protocol and ProtocolVersion |
| M05 | screening, eligibility and Enrolment |
| M06 | InterventionVersion, configuration and InterventionDecision |
| M07 | Assignment, Session, Exposure, Adaptation and Fidelity |
| M08 | Assessment, Observation and Outcome |
| M09 | SafetySignal, triage, SafetyEvent and action |
| M10 | KnowledgeReference, EvidenceDecision and EvidenceSnapshot |
| M11 | AIInteraction, Tool, configuration and AIMemoryItem |
| M12 | DatasetDefinition, DatasetVersion, quality and DatasetLock |
| M13 | AnalysisPlan, AnalysisRun, InterpretationRecord and ResearchFinding |
| M14 | Report, ExportRequest, EvidencePackage and submission |
| M15 | ApprovalRecord, GovernanceReview and AuditEvent |
| M16 | Integration, Operation, outbox, inbox and jobs |
| M17 | LifeStoryArchive, item, contribution, sharing and export |
| M18 | PublicProfile, Community, matching, Connection, messaging, Block, reports and moderation |



---

## 30. M01 Identity and Organisation Scope

The MVP supports:

- managed authentication;
- account activation and recovery;
- one primary Organisation;
- Organisation membership;
- scoped RoleAssignment;
- privileged-role MFA;
- Service Accounts;
- account restriction and suspension;
- and session context.

The MVP does not require:

- federated identity across institutions;
- consumer social login;
- or self-service external developer accounts.

---

## 31. M02 Participant Profile Scope

The MVP supports:

- protected ParticipantProfile;
- contact and communication preferences;
- language;
- AccessibilityProfile;
- assistance preferences;
- Participant correction request;
- and source attribution.

The MVP does not create:

- a hidden capacity score;
- a hidden vulnerability score;
- or automatic PublicProfile data.

---

## 32. M03 Relationship Scope

The MVP supports:

- Supporter invitation;
- Relationship proposal;
- Participant approval;
- scope and effective period;
- restriction;
- suspension;
- revocation;
- and end.

Relationship does not automatically grant all Participant data.

Connection is not stored or treated as a Supporter Relationship.

---

## 33. M03 Consent Scope

The MVP supports granular choices for:

- research participation;
- intervention delivery;
- assessments and observations;
- AI interaction;
- AIMemoryItem;
- Life Story capture;
- Life Story sharing;
- Supporter contribution;
- Community participation;
- Platform Public visibility;
- Open Matching;
- matching attributes;
- Connection and messaging;
- media processing;
- research analysis;
- export;
- future contact;
- and retention.

Internet Public requires a separate flow and remains disabled by default.

---

## 34. Consent Experience

The Consent experience supports:

- versioned information;
- plain language;
- adjustable text;
- read-aloud or supported presentation where available;
- step-by-step review;
- granular decisions;
- confirmation;
- restrictions;
- assistance attribution;
- review;
- re-Consent;
- and withdrawal.

Consent is not represented by one broad checkbox.

---

## 35. Supported Decision-Making

The MVP can record:

- who provided assistance;
- what information was shown;
- how assistance was provided;
- whose decision was recorded;
- and whether authority was independently verified.

AI does not assess decision-making capacity.

Support does not transfer authorship or Participant choice to the helper.

---

## 36. M04 Research Design Scope

Researchers can:

- create a ResearchProject;
- define ResearchQuestions;
- link evidence;
- create Protocol and ProtocolVersion;
- define eligibility;
- define intervention pathways;
- define Community and matching rules;
- define assessments;
- define Safety monitoring;
- define Dataset references;
- submit for review;
- and activate an approved version.

Approved ProtocolVersion is immutable.

---

## 37. M05 Recruitment and Enrolment Scope

The MVP supports:

- controlled invitation;
- screening;
- eligibility criteria;
- human-accountable EligibilityDecision;
- current Consent validation;
- Enrolment;
- activation;
- pause;
- resume;
- withdrawal;
- discontinuation;
- and follow-up status.

Matching opt-in is not an eligibility criterion unless explicitly approved.

---

## 38. M06 Intervention Portfolio Scope

The MVP supports:

- stable Intervention roots;
- immutable InterventionVersions;
- one integrated InterventionConfiguration;
- component configuration;
- adaptation rules;
- AI configuration references;
- Community and matching rules;
- safety safeguards;
- and post-Pilot InterventionDecision.

The MVP does not require a general intervention marketplace.

---

## 39. M07 Intervention Delivery Scope

The MVP supports:

- InterventionAssignment;
- Session;
- component exposure;
- offered, viewed, started, partially received, completed, skipped, declined, failed and interrupted states;
- adaptations;
- fidelity;
- deviations;
- support;
- and completion reflection.

Assignment is not counted as exposure.

Open Matching availability is not counted as meaningful interaction completion.

---

## 40. M08 Assessment Scope

The MVP supports:

- baseline;
- intervention-period process measures;
- post-intervention follow-up;
- optional qualitative follow-up;
- MeasurementVersion;
- assistance attribution;
- scoring;
- missing-data codes;
- invalidation;
- and correction.

The Pilot should minimise measurement burden.

---

## 41. M08 Observation and Outcome Scope

The MVP supports:

- Participant-reported observation;
- Supporter-reported observation where authorised;
- Researcher observation;
- system-recorded process data;
- derived outcome data;
- source and Epistemic Type;
- timepoint;
- quality flags;
- and correction.

AI-generated inference does not become an OutcomeRecord without an approved derivation and human interpretation.

---

## 42. M09 Safety Scope

The MVP supports:

- SafetySignal;
- source;
- urgency;
- triage;
- close as not event;
- escalation;
- conversion to SafetyEvent;
- SafetyAction;
- monitoring;
- resolution;
- pause;
- and audit.

The MVP must not use `SafetyEventDetected`.

Automated systems create signals, not confirmed events.

---

## 43. M10 Evidence Scope

The MVP supports:

- Evidence search;
- KnowledgeReference;
- EvidenceReview;
- EvidenceDecision;
- EvidenceSnapshot;
- ResearchKnowledgeGap;
- ReferenceChangeAlert;
- licensing;
- provenance;
- and completeness.

Live evidence changes do not silently change the approved Protocol.

---

## 44. M11 AI Companion Scope

The MVP supports:

- approved AI roles;
- AIInteraction;
- Context Assembly;
- grounded retrieval;
- Prompt Registry;
- Model Gateway;
- Tool Registry;
- structured output;
- confirmation;
- Human Review;
- AIMemoryItem where enabled;
- evaluation;
- monitoring;
- and kill switches.

AI may explain, suggest, Draft, translate, transcribe and execute a small set of confirmed reversible actions.

---

## 45. M12 Dataset and Data Quality Scope

The MVP supports:

- approved DatasetDefinition;
- source and variable rules;
- DatasetVersion generation;
- lineage;
- variable dictionary;
- manifest;
- quality checks;
- DataQualityIssue;
- de-identification;
- DatasetLock;
- access control;
- and archive.

A locked DatasetVersion is immutable.

---

## 46. M13 Analysis and Finding Scope

The MVP supports:

- approved AnalysisPlan;
- controlled AnalysisRun;
- code and environment reference;
- AnalysisOutput;
- diagnostics;
- InterpretationRecord;
- human review;
- ResearchFinding;
- limitations;
- and approval.

AI-assisted analysis remains distinguishable from human-approved interpretation.

---

## 47. M14 Reporting and Export Scope

The MVP supports:

- Participant-facing summary;
- research progress report;
- ReportVersion;
- ExportRequest;
- approval;
- Dataset and reproducibility package;
- evidence package;
- delivery state;
- and external submission where required.

Generated, delivered and received are separate states.

---

## 48. M15 Governance and Audit Scope

The MVP supports:

- ApprovalRecord;
- review assignment;
- conditions;
- conflict-of-interest record;
- GovernanceReview;
- AuditEvent;
- sensitive access review;
- and break-glass audit.

Approval references one exact artefact version.

---

## 49. M16 Integration and Operations Scope

The MVP supports:

- identity provider integration;
- Knowledge Platform adapter;
- Model Gateway providers;
- communication provider;
- object and media processing;
- Integration Registry;
- Operation;
- durable jobs;
- transactional outbox;
- consumer inbox;
- retry;
- dead-letter;
- and reconciliation.

A dedicated public developer API is not required.

---

## 50. M17 Life Story Archive Scope

The MVP supports:

- one active LifeStoryArchive per Participant context;
- LifeStoryItem Draft;
- text and limited media;
- Participant review;
- item versions;
- authorship;
- source;
- AI assistance;
- and private-by-default storage.

Life Story participation must remain optional unless the Protocol defines a minimum non-sensitive activity and provides an alternative.

---

## 51. M17 Life Story Item Scope

A LifeStoryItem may include:

- title;
- narrative;
- date or period;
- people;
- place;
- themes;
- media;
- transcript;
- translation;
- attribution;
- uncertainty;
- sensitive-topic flag;
- and confirmation.

Proposed details remain Proposed until the Participant confirms or corrects them.

---

## 52. Participant Testimony

The MVP distinguishes:

- Participant Draft;
- AI Draft;
- Supporter Contribution;
- Participant-confirmed content;
- Participant Testimony;
- externally verified fact;
- and imported material.

Participant Testimony does not claim external historical verification.

AI cannot create testimony through fluent wording alone.

---

## 53. Life Story Contribution Scope

A Supporter may propose a contribution only when:

- an active authorised Relationship exists;
- Participant permission covers contribution;
- the item or archive accepts contributions;
- authorship is explicit;
- and the Participant can accept, revise, reject or withdraw it.

Contributor access does not create archive ownership.

---

## 54. Life Story Visibility Scope

The MVP supports:

- Private;
- Selected People;
- Connections;
- Community;
- and Platform Public

where approved.

Internet Public remains disabled by default.

Visibility is item-specific and version-aware.

---

## 55. Life Story Sharing Controls

The MVP separately controls:

- view;
- comment;
- quotation;
- download;
- re-share;
- Community publication;
- research use;
- and export.

A visibility choice does not grant all these rights.

Withdrawal removes future Platform delivery and starts propagation.

---

## 56. Life Story Sensitive Topics

The MVP supports:

- warning;
- skip;
- pause;
- private save;
- restricted audience;
- help;
- report;
- and SafetySignal routing.

AI does not force completion or infer a diagnosis from sensitive content.

---

## 57. Life Story Export Scope

A Participant can request an export of permitted Life Story content.

The export preserves:

- item versions;
- media;
- attribution;
- AI involvement;
- confirmation;
- sharing restrictions;
- and third-party rights.

Export does not create public or research-use permission.

---

## 58. Legacy Preference Scope

LegacyPreference is included only when:

- legal and policy review is complete;
- authority and revocation are defined;
- posthumous handling is operationally supportable;
- and Participant information is clear.

Otherwise the capability remains feature-disabled while the data model is retained.

---

## 59. M18 PublicProfile Scope

The MVP supports a separate PublicProfile containing only Participant-selected fields such as:

- chosen display name;
- biography;
- broad interests;
- preferred language;
- approved general location;
- accessibility-relevant communication preference;
- and selected Life Story references.

Protected ParticipantProfile data are never copied automatically.

---

## 60. PublicProfile Visibility

PublicProfile availability is restricted to:

- eligible authenticated Platform users;
- approved Community scope;
- current Participant choice;
- current account state;
- Block;
- and moderation state.

Platform Public is not Internet Public.

---

## 61. CommunitySpace Scope

The MVP supports one or a small number of governed CommunitySpaces with:

- purpose;
- eligibility;
- CommunityRuleVersion;
- Moderator ownership;
- membership;
- content types;
- visibility;
- report flow;
- moderation flow;
- and archive.

Anonymous or unmoderated public spaces are excluded.

---

## 62. Community Membership Scope

A Participant can:

- review purpose and rules;
- join;
- decline;
- leave;
- pause notifications;
- and report a concern.

Community membership does not require Open Matching opt-in.

Leaving a Community does not automatically withdraw from the ResearchProject.

---

## 63. SocialPost Scope

The MVP supports:

- Draft;
- Participant confirmation;
- publication;
- audience;
- version history;
- comment;
- reaction;
- content warning;
- withdrawal;
- deletion request;
- moderation restriction;
- and restoration.

AI may Draft but cannot publish without confirmation.

---

## 64. Community Feed Scope

The feed applies:

- eligibility;
- membership;
- Visibility;
- Block;
- Resource State;
- moderation;
- freshness;
- and ranking policy.

The MVP does not optimise solely for:

- time spent;
- reactions;
- controversy;
- emotional arousal;
- or repeated return.

---

## 65. Community Discovery Scope

Discovery may use:

- declared interests;
- language;
- Community membership;
- approved general location;
- accessibility;
- and recent permitted activity.

It excludes:

- private Life Story;
- messages;
- Safety;
- moderation allegations;
- hidden vulnerability;
- and precise location.

---

## 66. M18 MatchPreference Scope

Open Matching is inactive by default.

A Participant can:

- review matching purpose;
- choose allowed attributes;
- set availability;
- set broad location preference;
- specify interests;
- activate;
- pause;
- update;
- expire;
- and withdraw.

The MVP records exact policy and preference versions.

---

## 67. Matching Attribute Scope

Potential allowed attributes include:

- declared interests;
- preferred activity;
- language;
- communication mode;
- availability;
- approved broad location;
- and Community context.

Prohibited by default:

- diagnosis;
- capacity;
- vulnerability;
- financial status;
- private Life Story;
- messages;
- Safety records;
- moderation allegations;
- precise location;
- and inferred protected traits.

---

## 68. MatchCandidate Scope

A MatchCandidate includes:

- candidate identifier;
- expiry;
- policy version;
- safe profile projection;
- MatchExplanation;
- available choices;
- and report or Block controls.

It does not expose the other Participant's internal ID or private source data.

---

## 69. MatchExplanation Scope

The MVP requires an understandable explanation using permitted declared attributes.

The explanation must:

- identify why the candidate was shown;
- disclose uncertainty;
- avoid objective compatibility claims;
- avoid diagnosis or vulnerability inference;
- and preserve source versions.

A hidden score is not shown as truth.

---

## 70. MatchDecision Scope

Each Participant records their own decision:

- Interested;
- Not Now;
- Dismissed;
- Blocked;
- Reported;
- or Expired.

AI may Draft or explain a choice but cannot submit it without the Participant's explicit action where required.

---

## 71. MutualAcceptance Scope

MutualAcceptance is a canonical M18 aggregate and delivery dependency.

It is recorded only when:

- two compatible independent MatchDecisions remain current; or
- one accepted ConnectionRequest exists under a separately approved future policy;
- the exact source records are valid and unexpired;
- matching or request Consent remains current;
- both actors remain eligible;
- no applicable Block exists;
- account and ResourceState remain usable;
- purpose remains permitted;
- and the governing policy version still applies.

MutualAcceptance records:

- source MatchDecision pair or ConnectionRequest;
- actor pair;
- purpose;
- policy version;
- effective period;
- validity;
- invalidation or expiry;
- and Connection usage.

It is not inferred from profile views, Community interaction, Message activity, AI confidence or unilateral interest.

One MutualAcceptance activates at most one Connection unless a separately approved policy explicitly states otherwise.

ConnectionRequest is feature-disabled for the first Pilot.

## 72. Connection Scope

A Connection is activated only from one current, valid and unused MutualAcceptance record.

Connection activation and MutualAcceptance consumption are one governed command and transaction.

A Participant can:

- view;
- pause;
- resume;
- mute;
- disconnect;
- Block;
- Report;
- and request Help.

Connection does not create:

- Supporter authority;
- care authority;
- Consent;
- research permission;
- private Life Story access;
- or unrestricted messaging.

An existing authorised contact may support the intervention without an M18 Connection.

Removing a Block or reversing a MatchDecision does not automatically restore or recreate a Connection.

## 73. ConversationThread and Messaging Scope

The MVP supports limited one-to-one messaging only when M18 can resolve a current approved CommunicationBasis.

Representative bases include:

- active Connection;
- active authorised Relationship;
- approved InterventionSession;
- approved moderated Community context;
- or another explicitly governed basis.

The MVP includes:

- ConversationThread;
- exact Thread participants;
- CommunicationBasis reference and validity;
- Message Draft;
- MessageVersion;
- approved attachment handling;
- actor-, version- and recipient-specific SendConfirmation;
- MessageQueued;
- MessageSent;
- MessageProviderAccepted;
- MessageDelivered;
- MessageDeliveryFailed or Delivery Unknown;
- MessageDeliveryAttempt;
- cancellation or withdrawal where technically supported;
- Block;
- Report;
- and provider reconciliation.

Read receipts are disabled by default unless the Protocol, provider evidence and UX disclosure justify them.

Group messaging is deferred.

## 74. Messaging Boundaries

```text
Message Draft
    ≠ Send Confirmed
    ≠ Queued
    ≠ Sent
    ≠ Provider Accepted
    ≠ Delivered
    ≠ Read
```

The MVP prohibits:

- anonymous messaging;
- mass or group messaging;
- arbitrary Participant lookup;
- unsolicited contact outside a current CommunicationBasis;
- automatic AI send;
- provider-created sender authority;
- hidden financial solicitation;
- unrestricted external links;
- and false claims of delivery or recall.

A MatchCandidate, unilateral MatchDecision, SocialPost interaction or expired MutualAcceptance is not a CommunicationBasis.

Private Message body is excluded by default from:

- broad event payloads;
- general logs;
- Search;
- Vector retrieval;
- matching;
- Community ranking;
- AIMemoryItem;
- and ordinary research analysis.

Message-content analysis requires separate Consent, purpose, DatasetDefinition, minimisation and governance.

## 75. Mute, Disconnect and Block Scope

Mute, Disconnect and Block remain distinct.

Block must synchronously prevent or fail closed for:

- discovery;
- MatchCandidate delivery;
- MutualAcceptance creation;
- Connection activation;
- ConversationThread creation;
- Message SendConfirmation;
- and new Notification creation.

Block also triggers removal, cancellation or suppression from:

- Search and Vector projections;
- matching and feed projections;
- queued Message delivery where technically possible;
- provider delivery cancellation where supported;
- Notifications;
- cache;
- and AI Context.

Report remains available after Block or Disconnect.

Block revocation does not automatically restore:

- MatchPreference;
- MutualAcceptance;
- Connection;
- ConversationThread;
- queued delivery;
- or prior Message authority.

External-provider limitations are recorded and explained accurately.

## 76. UserReport and ContentReport Scope

The MVP supports accessible reporting of:

- user behaviour;
- profile;
- SocialPost;
- comment;
- Message;
- MatchCandidate;
- scam;
- harassment;
- privacy concern;
- or safety concern.

A Report remains available after Block or Disconnect.

Reporter identity is protected.

---

## 77. ModerationCase Scope

The MVP supports:

- case creation;
- report linking;
- provisional provider or AI signal;
- human assignment;
- evidence review;
- rule version;
- decision;
- action;
- duration;
- appeal;
- restoration;
- and closure.

High-impact decisions remain human-accountable.

---

## 78. Moderation Actions

Potential actions include:

- no action;
- guidance;
- warning;
- content restriction;
- hide;
- remove;
- temporary interaction restriction;
- account suspension request;
- restore;
- or SafetySignal link.

Actions must be proportional and auditable.

---

## 79. Appeal Scope

The MVP supports appeal where a moderation action materially affects the user.

Appeal includes:

- accessible explanation;
- submission;
- independent review where required;
- outcome;
- restoration;
- and audit.

AI cannot decide the appeal.

---

## 80. Moderation and Safety Separation

```text
UserReport or ContentReport
        ↓
ModerationCase
        ↓
ModerationDecision
```

A separate concern may produce:

```text
Potential Harm
        ↓
SafetySignal
        ↓
Human Triage
        ↓
SafetyEvent only if Confirmed
```

A ModerationCase is not a SafetyEvent.



---

## 81. Participant Workspace

The MVP Participant Workspace includes:

- Home;
- My Study;
- Consent and Permissions;
- Accessibility and Preferences;
- My Life Story;
- Community;
- People and Matching;
- Connections;
- Messages;
- Activities;
- Assessments;
- AI Companion;
- Reports and Blocks;
- Help;
- and Withdrawal.

Navigation adapts without hiding critical rights.

---

## 82. Researcher Workspace

The MVP Researcher Workspace includes:

- ResearchProjects;
- ResearchQuestions;
- Evidence;
- Protocols;
- Interventions;
- Participants;
- Enrolment;
- Delivery;
- Assessments;
- Safety;
- AI configuration and evaluation;
- Dataset readiness;
- Analysis;
- Findings;
- Reports;
- and governance tasks.

Researchers do not receive Moderator or System Administrator access automatically.

---

## 83. Moderator Workspace

The Moderator Workspace includes:

- report queue;
- case assignment;
- rule version;
- content and evidence;
- provisional signals;
- decision;
- action;
- duration;
- appeal;
- restoration;
- SafetySignal link;
- and audit.

The workspace excludes unrelated Participant research data.

---

## 84. Safety Workspace

The Safety Workspace includes:

- SafetySignal queue;
- source and urgency;
- Participant and ResearchProject scope;
- triage;
- minimum necessary context;
- SafetyEvent conversion;
- action;
- monitoring;
- pause;
- closure;
- and audit.

Moderator and Safety Reviewer views remain distinct.

---

## 85. Supporter Workspace

The MVP Supporter Workspace includes:

- invitation;
- Relationship purpose;
- permission scope;
- shared Life Story contribution where allowed;
- assigned or shared activity;
- support guidance;
- communication;
- concern reporting;
- and access status.

It excludes unrelated assessments, messages, matching and research data.

---

## 86. Administration Workspace

The MVP Administration Workspace includes:

- users;
- Organisations;
- roles;
- Service Accounts;
- integrations;
- provider configuration;
- operational status;
- jobs and dead letters;
- feature flags;
- audit access;
- and security operations.

Administration does not confer research, moderation or Safety authority.

---

## 87. Participant Onboarding Journey

```text
Invitation
        ↓
Account Activation
        ↓
Accessible Study Information
        ↓
Consent Choices
        ↓
Accessibility and Communication Preferences
        ↓
Screening and Eligibility
        ↓
Baseline Assessment
        ↓
Enrolment
        ↓
Intervention Orientation
```

The Participant can pause, request help or decline at each applicable stage.

---

## 88. Life Story Journey

```text
Open Private Archive
        ↓
Choose Prompt or Create Item
        ↓
Add Text or Approved Media
        ↓
AI Draft or Transcription if Enabled
        ↓
Review People, Dates, Places and Wording
        ↓
Confirm, Correct or Save as Draft
        ↓
Choose Visibility and Sharing Rights
        ↓
Publish, Share Privately or Keep Private
```

No sharing choice is preselected beyond Private.

---

## 89. Existing-Contact Journey

```text
Choose Existing Contact Path
        ↓
Create or Verify Relationship
        ↓
Set Permission and Communication Scope
        ↓
Prepare Interaction
        ↓
Confirm Message or Plan
        ↓
Complete Human Interaction
        ↓
Reflect and Follow Up
```

The Participant can complete the intervention without Community publication.

---

## 90. Community Journey

```text
Review Community Purpose and Rules
        ↓
Join or Decline
        ↓
Create or Review PublicProfile
        ↓
View Governed Feed
        ↓
Draft and Confirm SocialPost
        ↓
Interact, Mute, Block or Report
        ↓
Leave or Pause
```

Community membership and matching remain separate choices.

---

## 91. Open Matching Journey

```text
Review Matching Purpose
        ↓
Choose Allowed Attributes
        ↓
Activate MatchPreference
        ↓
Generate MatchCandidates
        ↓
Review Safe Profile and MatchExplanation
        ↓
Interested • Not Now • Dismiss • Block • Report
        ↓
Other Actor Makes an Independent MatchDecision
        ↓
M18 Evaluates Current Source Records and Policy
        ↓
MutualAcceptance if Compatible and Still Valid
        ↓
Connection Activation
```

The journey must make clear that:

- a MatchCandidate is not mutual interest;
- the other actor's decision remains private until policy permits disclosure;
- MutualAcceptance may expire or be invalidated before Connection activation;
- no candidate or no MutualAcceptance is not Participant failure;
- and AI cannot decide for either actor.

## 92. Connection and Messaging Journey

```text
Connection Activated
or
Another Approved CommunicationBasis Resolved
        ↓
ConversationThread Created
        ↓
Review Participant, Basis and Safety Controls
        ↓
Create or Revise Message Draft
        ↓
Review Exact Content, Attachments and Recipients
        ↓
Actor-Specific SendConfirmation
        ↓
MessageQueued
        ↓
Provider Submission
        ↓
Sent • Provider Accepted • Delivered • Failed • Unknown
        ↓
Human Interaction
        ↓
Pause • Mute • Disconnect • Block • Report
```

The UX and operational workflow must never collapse the delivery states.

A Provider Accepted state does not satisfy a Delivered acceptance criterion.

## 93. Supporter Contribution Journey

```text
Participant Enables Contribution
        ↓
Supporter Receives Scoped Invitation
        ↓
Supporter Proposes Contribution
        ↓
Participant Reviews Attribution and Content
        ↓
Accept • Revise • Reject • Withdraw
        ↓
Participant Controls Visibility
```

Supporter contribution does not transfer ownership.

---

## 94. Researcher Setup Journey

```text
Create ResearchProject
        ↓
Define ResearchQuestions
        ↓
Complete EvidenceReview and EvidenceDecision
        ↓
Create EvidenceSnapshot
        ↓
Configure Intervention and AI
        ↓
Create ProtocolVersion
        ↓
Define Consent, Safety, Moderation and Dataset Rules
        ↓
Submit for Review
        ↓
Approve and Activate
```

No Participant is invited before approved activation.

---

## 95. Research Operations Journey

```text
Recruit and Enrol
        ↓
Monitor Onboarding
        ↓
Monitor Delivery and Exposure
        ↓
Review Data Quality
        ↓
Coordinate Assessments
        ↓
Review Safety and Operational Issues
        ↓
Complete Follow-Up
        ↓
Prepare Dataset
```

Research monitoring does not expose reporter identity or private social content without approved purpose.

---

## 96. Moderation Journey

```text
Report or Automated Signal
        ↓
ModerationCase
        ↓
Human Triage
        ↓
Evidence and Rule Review
        ↓
ModerationDecision
        ↓
Action
        ↓
Appeal if Applicable
        ↓
Restore, Confirm or Revise
```

Automated classification does not skip human review for high-impact action.

---

## 97. Safety Journey

```text
Participant, User, Rule, Device or AI Concern
        ↓
SafetySignal
        ↓
Human Triage
        ↓
Close as Not Event
or
Convert to SafetyEvent
        ↓
Action and Monitoring
        ↓
Resolve and Close
```

Signal and Event metrics remain separate.

---

## 98. Dataset Journey

```text
Approved DatasetDefinition
        ↓
Source Permission and Quality Checks
        ↓
TransformationRun
        ↓
DatasetVersion
        ↓
Manifest and Variable Dictionary
        ↓
Data Quality Review
        ↓
De-Identification Review
        ↓
DatasetLock
```

No ad hoc spreadsheet becomes the canonical locked dataset.

---

## 99. Analysis and Finding Journey

```text
Approved AnalysisPlan
        ↓
Locked DatasetVersion
        ↓
Controlled AnalysisRun
        ↓
AnalysisOutput and Diagnostics
        ↓
InterpretationRecord
        ↓
Human Review
        ↓
ResearchFinding
        ↓
InterventionDecision
```

AI Drafts cannot approve interpretation or findings.

---

## 100. MVP Data Scope

The MVP collects only data required for:

- identity and eligibility;
- Consent and permission;
- accessibility;
- intervention delivery;
- Life Story operation;
- Community operation;
- MatchPreference, MatchCandidate and independent MatchDecision;
- MutualAcceptance and Connection;
- CommunicationBasis and ConversationThread;
- Message Draft, SendConfirmation and delivery process;
- Block, Report, moderation and Safety;
- process and outcome evaluation;
- AI evaluation;
- data quality;
- provider reconciliation;
- audit;
- and approved analysis.

Every data element requires:

- owner;
- purpose;
- provenance;
- classification;
- applicable Consent or authority;
- retention;
- and Dataset inclusion rule.

Private content is not collected merely because the Platform can technically process it.

## 101. Minimum Participant Data

Minimum Participant data may include:

- Platform identifier;
- pseudonymous study code;
- contact method;
- age eligibility or age range;
- language;
- AccessibilityProfile;
- approved broad location where needed;
- eligibility facts;
- Consent;
- Enrolment;
- and assessment responses.

Precise identity and contact data remain separately protected.

---

## 102. Life Story Data Boundary

Life Story data are collected only when necessary for the configured intervention.

The DatasetDefinition must explicitly state whether it includes:

- item count;
- completion state;
- media type;
- sharing state;
- themes;
- qualitative text;
- transcript;
- AI assistance;
- or Participant Testimony.

Full narrative content is excluded from analysis by default.

---

## 103. Community Data Boundary

Potential process data include:

- membership;
- SocialPost count;
- comment or reaction count;
- report;
- moderation action;
- and Community participation time.

These are process measures.

They are not interpreted as social connectedness or wellbeing without approved measures.

---

## 104. Matching and Connection Data Boundary

Potential process data include:

- matching offered and opt-in;
- allowed attribute categories;
- candidates generated and expired;
- MatchExplanation viewed;
- actor-owned MatchDecision;
- MutualAcceptance creation, expiry or invalidation;
- Connection activation, pause or disconnect;
- Block;
- Report;
- and pathway completion.

The research dataset minimises or excludes:

- protected feature values;
- the other actor's private decision;
- hidden rank;
- precise location;
- private Life Story;
- Safety or moderation records;
- and Message content.

Internal rank is not stored or analysed as objective compatibility truth.

## 105. Conversation and Messaging Data Boundary

The Pilot may analyse minimum-necessary process data such as:

- ConversationThread created under an approved CommunicationBasis;
- Message Draft created or revised;
- SendConfirmation completed;
- MessageQueued;
- MessageSent;
- MessageProviderAccepted;
- MessageDelivered;
- MessageDeliveryFailed or Delivery Unknown;
- delivery-attempt count;
- broad timing category where approved;
- attachment readiness;
- Block;
- Report;
- abuse or scam signal;
- and support use.

Private Message body is excluded by default.

The DatasetDefinition must name every included Message metadata variable.

Message-content analysis requires a separate restricted DatasetDefinition, explicit authority, minimisation, privacy review and secure analytical environment.

## 106. Moderation Data Boundary

The Dataset may include de-identified or aggregated:

- report type;
- moderation case state;
- action type;
- time to triage;
- appeal;
- restoration;
- and relation to SafetySignal.

Reporter identity and detailed evidence are excluded from ordinary research extracts.

---

## 107. AI Data Boundary

Potential data include:

- AI role;
- task;
- model alias;
- configuration version;
- Prompt version;
- Context source classes;
- Tool;
- confirmation;
- output classification;
- user correction;
- Human Review;
- SafetySignal;
- latency;
- tokens;
- and cost.

Full prompts and outputs are excluded unless explicitly required.

---

## 108. Outcome Data Scope

Outcome data may include:

- feasibility;
- acceptability;
- accessibility;
- burden;
- perceived connectedness;
- confidence initiating contact;
- autonomy;
- meaningful participation;
- relationship quality;
- and qualitative feedback.

Measures and licences are selected in Document 19.

---

## 109. Missingness and Correction

The MVP represents:

- Not Collected;
- Participant Declined;
- Not Applicable;
- Unknown;
- Technical Failure;
- Not Yet Due;
- Lost to Follow-Up;
- Withheld by Permission;
- and Invalidated.

Corrections preserve the original record and downstream impact.

---

## 110. DatasetDefinition Scope

DatasetDefinition must specify:

- Research Questions;
- Participant population;
- source aggregates and versions;
- variables;
- inclusion and exclusion;
- Consent and purpose;
- handling of Life Story, social, matching, Message, moderation and AI data;
- transformations;
- missingness;
- de-identification;
- quality rules;
- and output format.

It must be approved before DatasetVersion generation.

---

## 111. DatasetVersion Scope

DatasetVersion includes:

- source lineage;
- extraction time;
- transformation versions;
- row and entity counts where safe;
- variable dictionary;
- manifest;
- quality issues;
- restrictions;
- and file checksums.

A DatasetVersion remains a candidate until locked.

---

## 112. DatasetLock Gate

DatasetLock requires:

- approved DatasetDefinition;
- complete lineage;
- current authority;
- Consent and withdrawal handling;
- data-quality review;
- de-identification;
- manifest;
- checksum;
- compatible AnalysisPlan;
- and human approval.

AI cannot lock the dataset.

---

## 113. Analysis Scope

The MVP supports:

- descriptive statistics;
- recruitment and retention;
- completion and exposure;
- accessibility and support;
- Life Story process;
- Community and matching process;
- Connection and interaction completion;
- moderation and Safety;
- simple pre-post exploratory summaries;
- qualitative feedback;
- AI quality and boundary adherence;
- and operational performance.

Advanced causal claims are excluded.

---

## 114. Research Interpretation Scope

Interpretation must consider:

- sample and setting;
- missingness;
- Participant selection;
- pathway differences;
- intervention exposure;
- Life Story and social-choice variability;
- moderation and Safety;
- accessibility;
- AI configuration;
- implementation context;
- and uncertainty.

The ResearchFinding cannot exceed the approved design.

---

## 115. MVP Technical Scope

The MVP uses:

- responsive web applications;
- modular backend;
- synchronous APIs;
- domain events;
- durable jobs;
- one relational system of record;
- private object storage;
- optional relational Search and Vector support;
- one governed analytical environment;
- managed identity;
- central observability;
- and controlled external adapters.

---

## 116. Client Scope

The MVP includes:

- Researcher web application;
- Participant responsive experience;
- Supporter experience;
- Moderator and Safety workspaces;
- Administration interface;
- and limited accessible notifications.

Native mobile applications are not required.

---

## 117. Backend Scope

The MVP backend includes:

- M01–M18 modular boundaries;
- Command and Query APIs;
- Policy component;
- AI Orchestrator;
- Model Gateway;
- Tool Executor;
- background workers;
- transactional outbox;
- consumer idempotency;
- operation tracking;
- audit;
- and integration adapters.

M18 owns:

- MatchDecision;
- MutualAcceptance;
- Connection;
- CommunicationBasis evaluation;
- ConversationThread;
- Message;
- SendConfirmation;
- and canonical delivery state.

M16 owns:

- provider adapter configuration;
- provider-reference mapping;
- callback authentication and replay protection;
- restricted callback evidence;
- retry and reconciliation;
- and operational delivery metrics.

M16 cannot write M18 state directly.

Microservice extraction is deferred.

## 118. Database Scope

The MVP uses a managed relational database with:

- M01–M18 logical schemas;
- module-owned migrations;
- optimistic concurrency;
- version history;
- immutable approved records;
- database constraints;
- idempotency;
- outbox and inbox;
- and audit metadata.

Required M18 constraints include:

- exact MatchDecision ownership;
- valid MutualAcceptance source shape;
- MutualAcceptance expiry and invalidation history;
- single-use MutualAcceptance for Connection activation;
- Connection source reference;
- effective CommunicationBasis for active Thread;
- explicit Thread participants;
- Draft Message with no DeliveryAttempt;
- exact SendConfirmation binding;
- provider-reference uniqueness;
- Message lifecycle and delivery-state compatibility;
- and M16-to-M18 write separation.

Direct analytical access to production is prohibited.

## 119. Object and Media Scope

Object storage supports:

- Consent evidence;
- Life Story media;
- transcripts and translations;
- SocialPost or Message attachment where enabled;
- moderation evidence;
- Dataset files;
- Analysis outputs;
- reports;
- and exports.

Objects are Private by default and pass quarantine and validation.

---

## 120. Search and Vector Scope

The MVP may use:

- relational structured search;
- database full-text search;
- Knowledge Platform search;
- Participant's own Life Story search;
- and permission-scoped Community discovery.

A separate Search cluster or Vector database is not required.

Private Messages, reporter identity, detailed Safety and moderation evidence are excluded from general indexing.



---

## 121. Integration Scope

Required integrations:

- managed identity provider;
- Healthy Aging Knowledge Platform;
- one approved AI provider through Model Gateway;
- one communication provider through an M16 Anti-Corruption Layer;
- authenticated and replay-protected provider callbacks;
- provider-reference mapping;
- delivery reconciliation;
- private object storage;
- malware scanning;
- secure analytical export;
- and monitoring and alerting.

Controlled Optional integrations:

- transcription or translation provider;
- limited video communication provider;
- one Pilot partner system;
- and third-party moderation classification.

External providers do not own:

- MatchDecision;
- MutualAcceptance;
- Connection;
- CommunicationBasis;
- ConversationThread;
- Message content;
- sender authority;
- or canonical delivery state.

## 122. Deployment Scope

The MVP uses:

- managed edge or reverse proxy;
- managed application runtime;
- container-ready deployment;
- managed relational database;
- managed object storage;
- managed queue;
- managed secrets;
- central logging and metrics;
- and one primary approved region.

Kubernetes and multi-region active-active are not required.

---

## 123. Security Scope

The MVP must include:

- managed authentication;
- MFA for privileged actors;
- server-side authorisation;
- Organisation and ResearchProject scope;
- granular Consent;
- purpose-of-use;
- field and existence protection;
- Visibility enforcement;
- Block enforcement;
- MutualAcceptance checks;
- Data Classification;
- secure upload;
- encryption;
- secrets management;
- audit;
- export approval;
- backup and restore;
- vulnerability management;
- incident response;
- and provider review.

---

## 124. Privacy Scope

The MVP must support:

- data minimisation;
- private-by-default Life Story;
- Participant-controlled sharing;
- PublicProfile separation;
- Platform Public and Internet Public separation;
- matching opt-in;
- permitted matching attributes;
- Message privacy;
- reporter confidentiality;
- AI Context minimisation;
- provider data policy;
- retention;
- correction;
- withdrawal;
- deletion propagation;
- and portability.

---

## 125. Accessibility Scope

The MVP supports:

- adjustable text;
- high contrast;
- keyboard access;
- screen-reader semantics;
- simple-language mode;
- reduced-content mode;
- step-by-step mode;
- repeat and replay;
- extended response time;
- clear confirmation;
- accessible error recovery;
- alternative modality where available;
- and Supporter-assisted mode.

Accessibility is tested across the complete Participant journey.

---

## 126. AI Scope

Researcher-facing AI may support:

- evidence search assistance;
- ResearchQuestion and Protocol Drafting;
- intervention material Drafting;
- plain-language materials;
- Dataset documentation;
- Analysis explanation;
- and report Drafting.

Participant-facing AI may support:

- onboarding explanation;
- Life Story prompts;
- transcription and translation;
- SocialPost Draft;
- MatchExplanation;
- Message Draft;
- interaction preparation;
- reflection;
- navigation;
- and help.

---

## 127. AI Permitted Actions

The MVP permits:

- Level 0 — Explain or Retrieve;
- Level 1 — Suggest;
- Level 2 — Draft;
- selected Level 3 — Confirmed Reversible Action;
- and selected Level 4 — Controlled Workflow Request.

Potential Level 3 or Level 4 actions include:

- store an approved AIMemoryItem;
- publish a confirmed Platform-only SocialPost;
- submit a confirmed MatchDecision;
- send a confirmed Message;
- create a Block;
- submit a UserReport;
- raise a SafetySignal;
- or request Human Review.

Each action must be explicitly enabled.

---

## 128. AI Prohibited Actions

The MVP prohibits autonomous AI from:

- changing Consent;
- inferring substitute authority;
- enrolling or withdrawing Participants;
- confirming Life Story testimony;
- publishing Internet Public content;
- accepting both sides of a match;
- creating a Connection;
- sending a Message without confirmation;
- creating fake users or social proof;
- imposing high-impact moderation;
- deciding an appeal;
- confirming SafetyEvent;
- locking DatasetVersion;
- approving AnalysisPlan;
- approving InterpretationRecord;
- approving ResearchFinding;
- or publishing knowledge.

---

## 129. AI Evaluation Scope

Before Participant use, AI evaluation covers:

- permission and Context isolation;
- grounding and citation;
- Life Story invention;
- transcription and translation;
- Community Draft behaviour;
- matching-feature compliance;
- MatchExplanation fidelity;
- Message send confirmation;
- scam and harassment detection;
- moderation boundaries;
- SafetySignal routing;
- dependency language;
- accessibility;
- fairness;
- Prompt injection;
- Tool injection;
- provider failure;
- deletion;
- and research traceability.

---

## 130. Moderation and Community Safety Scope

The MVP includes:

- CommunityRuleVersion;
- content reporting;
- user reporting;
- accessible Block;
- provisional automated signals;
- human moderation;
- appeal where applicable;
- restoration;
- scam and malicious-link controls;
- rate limits;
- and queue monitoring.

Community features cannot enter Pilot readiness without moderation staffing and response targets.

---

## 131. Operational Scope

The MVP must define:

- support ownership;
- support hours;
- Participant assistance;
- Moderator coverage;
- Safety Reviewer coverage;
- issue triage;
- escalation contacts;
- provider escalation;
- job and dead-letter review;
- backup monitoring;
- deletion review;
- and Pilot communication.

Operational readiness is a release dependency.

---

## 132. Core, Controlled Optional and Deferred Scope

### Core

Required for Pilot readiness and end-to-end research completion.

### Controlled Optional

Implemented behind configuration or feature flags and enabled only after Protocol, Consent, safety and evaluation approval.

### Deferred

Explicitly excluded from the first Pilot and not required for readiness.

A feature cannot be called Optional merely to avoid testing its active path.

---

## 133. Core Scope

Core capabilities include:

- M01–M18 minimum domain records;
- accessible onboarding;
- granular Consent;
- private Life Story;
- Participant confirmation;
- one governed CommunitySpace;
- PublicProfile;
- opt-in Open Matching;
- MatchExplanation;
- independent MatchDecision;
- MutualAcceptance;
- Connection;
- limited messaging;
- Block and Report;
- human moderation;
- SafetySignal and SafetyEvent separation;
- approved AI Draft and explanation;
- assessment and observation;
- DatasetDefinition and DatasetLock;
- AnalysisRun;
- ResearchFinding;
- audit;
- backup;
- support;
- and controlled Pilot operations.

---

## 134. Controlled Optional Scope

Controlled Optional capabilities may include:

- Supporter Life Story contribution;
- intergenerational sharing;
- Life Story audio;
- transcription;
- translation;
- limited images;
- AI SocialPost publication after confirmation;
- AI MatchDecision submission after confirmation;
- AI Message send after confirmation;
- AIMemoryItem;
- read receipts;
- video communication;
- device data;
- INT-010 orientation support;
- and external partner integration.

Each requires an enablement decision and tested fallback.

---

## 135. Deferred Product Capabilities

Deferred product capabilities include:

- anonymous Community participation;
- unmoderated public spaces;
- unrestricted Internet Public publication;
- general social-network growth features;
- influencer or follower economy;
- advertising;
- algorithmic virality;
- unrestricted people search;
- unrestricted direct messaging;
- broad peer marketplace;
- autonomous social agents;
- clinical care planning;
- medication management;
- emergency response service;
- full telehealth;
- and unrestricted AI companionship.

---

## 136. Deferred Research Capabilities

Deferred research capabilities include:

- definitive effectiveness claims;
- large randomised controlled trial;
- adaptive trial;
- multi-site trial;
- long-term clinical outcome study;
- health-economic evaluation;
- automated causal inference;
- broad secondary research;
- automated knowledge publication;
- and regulatory submission.

---

## 137. Deferred Technical Capabilities

Deferred technical capabilities include:

- microservices;
- Kubernetes;
- active-active multi-region;
- enterprise event streaming;
- dedicated Search cluster;
- dedicated Vector database;
- enterprise warehouse or lakehouse;
- secure research enclave;
- real-time wearable streaming;
- full FHIR or EHR integration;
- federated identity;
- federated analytics;
- on-device AI;
- and public developer portal.

---

## 138. Architecture Guardrail for Scope

A capability remains outside the MVP when it:

- does not support the selected Research Questions;
- cannot be operated safely;
- lacks Consent and permission design;
- lacks accessible UX;
- lacks moderation or Safety coverage;
- lacks data and lineage design;
- lacks evaluation;
- or creates disproportionate dependency.

Technical feasibility alone is insufficient for inclusion.

---

## 139. Delivery Principles

1. Complete the research loop.
2. Build Participant controls before social exposure.
3. Build moderation and Block before Community release.
4. Build matching policy before MatchCandidate generation.
5. Build MutualAcceptance before Connection.
6. Build communication basis before messaging.
7. Build SafetySignal triage before Participant-facing AI or Community Pilot use.
8. Build DatasetDefinition before data accumulation becomes difficult to govern.
9. Build audit and observability with each capability.
10. Use feature flags for Controlled Optional scope.
11. Test degraded and manual fallback.
12. Prefer thin vertical slices over isolated horizontal frameworks.

---

## 140. Critical Delivery Path

```text
Research and Governance Baseline
        ↓
Identity, Permission, Consent and Audit
        ↓
Accessible Participant Onboarding
        ↓
Private Life Story
        ↓
Community Rules, PublicProfile, Block and Moderation
        ↓
Open Matching Policy and MatchExplanation
        ↓
MutualAcceptance, Connection and Messaging
        ↓
AI Assistance and SafetySignal Routing
        ↓
Assessments, DatasetDefinition and Data Quality
        ↓
DatasetLock, AnalysisRun and ResearchFinding
        ↓
Synthetic Pilot
        ↓
Pilot Readiness
        ↓
Controlled Pilot
```

Some engineering may proceed in parallel, but no later capability may pass its release gate before required controls.

---

## 141. Parallel Delivery Tracks

The following can progress in parallel after baseline decisions:

- Protocol and Research design;
- UX and accessibility;
- core Platform engineering;
- Life Story design;
- moderation and Community Rules;
- AI evaluation assets;
- DatasetDefinition;
- operational runbooks;
- and provider review.

Integration points are validated at milestone gates.

---

## 142. Delivery Workstreams

The roadmap uses twelve workstreams:

- A — Product and Research Definition
- B — Protocol, Ethics and Governance
- C — UX and Accessibility
- D — Platform Foundation
- E — Identity, Consent and Participant Control
- F — Life Story and Personal Archive
- G — Community, Matching and Messaging
- H — Moderation, Safety and Operations
- I — Evidence and AI
- J — Data, Dataset and Analysis
- K — Quality, Security and Reliability
- L — Pilot Enablement and Evaluation

---

## 143. Workstream A — Product and Research Definition

Deliverables:

- selected Healthy Aging challenge;
- intervention portfolio;
- integrated vertical slice;
- target population;
- setting;
- Participant value proposition;
- Research Questions;
- Core and Optional scope;
- non-goals;
- success and failure criteria;
- and traceability matrix.

Exit condition:

- Product, Research and Delivery owners approve one coherent MVP thesis.

---

## 144. Workstream B — Protocol, Ethics and Governance

Deliverables:

- Protocol Draft and approved ProtocolVersion;
- eligibility;
- recruitment;
- granular Consent;
- supported decision-making;
- intervention dose;
- Community and matching rules;
- Safety plan;
- moderation plan;
- assessment schedule;
- DatasetDefinition;
- AnalysisPlan;
- pause and stop criteria;
- and ethics or governance approval.

Exit condition:

- no unresolved governance gap prevents recruitment.

---

## 145. Workstream C — UX and Accessibility

Deliverables:

- Participant journeys;
- Researcher journeys;
- Supporter flow;
- Moderator and Safety workflows;
- information architecture;
- design system;
- accessibility patterns;
- low-fidelity and high-fidelity prototypes;
- usability findings;
- content design;
- error recovery;
- and Participant materials.

Exit condition:

- representative users can complete critical flows in prototype testing with acceptable support.

---

## 146. Workstream D — Platform Foundation

Deliverables:

- repository;
- CI/CD;
- environments;
- modular backend;
- API conventions;
- database and migrations;
- object storage;
- queue and jobs;
- outbox and inbox;
- feature flags;
- observability;
- audit foundation;
- and repeatable deployment.

Exit condition:

- a production-like environment can deploy, migrate, monitor and roll back safely.

---

## 147. Workstream E — Identity, Consent and Participant Control

Deliverables:

- identity;
- Organisation;
- roles;
- ParticipantProfile;
- AccessibilityProfile;
- Relationship;
- Delegation where needed;
- Consent;
- PolicyDecision;
- withdrawal;
- correction;
- Block enforcement foundation;
- and protected existence.

Exit condition:

- wrong-role, wrong-project, withdrawn-Consent and active-Block tests pass.

---

## 148. Workstream F — Life Story and Personal Archive

Deliverables:

- LifeStoryArchive;
- item Draft and version;
- text and approved media;
- AI Draft or transcription where enabled;
- Participant confirmation;
- contribution;
- visibility;
- sharing rights;
- withdrawal;
- export;
- sensitive-topic controls;
- and optional LegacyPreference.

Exit condition:

- a Participant can create, confirm, keep Private, share and withdraw an item without losing authorship or control.

---

## 149. Workstream G — Community, Matching and Messaging

Deliverables:

- PublicProfile;
- CommunitySpace and CommunityRuleVersion;
- membership;
- SocialPost and feed;
- MatchPreference;
- MatchCandidate;
- MatchExplanation;
- actor-owned MatchDecision;
- MutualAcceptance;
- Connection;
- CommunicationBasis;
- ConversationThread;
- Message and MessageVersion;
- SendConfirmation;
- MessageAttachment;
- MessageDeliveryAttempt;
- Mute;
- Disconnect;
- Block;
- Report;
- and social-safety observability.

Dependencies:

- approved matching policy;
- prohibited-feature registry;
- provider adapter and callback contract;
- Message privacy rules;
- Moderator staffing;
- Safety routing;
- and DatasetDefinition.

Definition of done includes deterministic formation, exact delivery-state presentation and no M16 direct write to M18.

## 150. Workstream H — Moderation, Safety and Operations

Deliverables:

- report intake;
- moderation queue;
- provisional signals;
- ModerationDecision;
- appeal;
- restoration;
- SafetySignal;
- triage;
- SafetyEvent;
- escalation;
- pause;
- incident runbooks;
- staffing;
- response targets;
- and operational dashboards.

Exit condition:

- simulated moderation and Safety scenarios complete within approved response targets.

---

## 151. Workstream I — Evidence and AI

Deliverables:

- Knowledge Platform integration;
- EvidenceReview;
- EvidenceDecision;
- EvidenceSnapshot;
- Model Gateway;
- Provider Registry;
- Model and Prompt Registries;
- Tool Registry;
- AI configuration;
- Context Assembly;
- retrieval;
- confirmation;
- Human Review;
- evaluation;
- monitoring;
- and kill switches.

Exit condition:

- all enabled AI roles pass evaluation and prohibited-action tests.

---

## 152. Workstream J — Data, Dataset and Analysis

Deliverables:

- measurement configuration;
- AssessmentRecord;
- Observation and Outcome;
- data-quality rules;
- DatasetDefinition;
- DatasetVersion;
- manifest;
- variable dictionary;
- DatasetLock;
- controlled analytical environment;
- AnalysisPlan;
- AnalysisRun;
- InterpretationRecord;
- ResearchFinding;
- and reproducibility package.

Exit condition:

- the synthetic Pilot produces a valid locked dataset and traceable finding.

---

## 153. Workstream K — Quality, Security and Reliability

Deliverables:

- threat review;
- privacy assessment;
- architecture tests;
- permission tests;
- accessibility tests;
- moderation and Safety tests;
- AI red teaming;
- migration tests;
- performance tests;
- backup and restore;
- dependency-failure tests;
- deletion propagation;
- and release evidence.

Exit condition:

- no unresolved release-blocking defect remains.

---

## 154. Workstream L — Pilot Enablement and Evaluation

Deliverables:

- partner readiness;
- recruitment materials;
- Participant training;
- Supporter training;
- Moderator training;
- Safety training;
- support model;
- communications;
- Pilot monitoring;
- interim review;
- data freeze;
- analysis;
- post-Pilot review;
- and InterventionDecision.

Exit condition:

- the Pilot completes and produces an approved decision package.

---

## 155. Milestone Model

Milestones are evidence-based capability gates.

A milestone is complete only when:

- implementation exists;
- tests pass;
- documentation exists;
- ownership is assigned;
- operational support exists where required;
- and the relevant approval is recorded.

Feature coding alone does not complete a milestone.



---

## 156. Milestone 0 — Delivery Baseline

Complete when:

- MVP thesis is approved;
- selected intervention portfolio is confirmed;
- Core, Controlled Optional and Deferred scope are approved;
- target setting and population are defined;
- primary owners are assigned;
- initial risks are recorded;
- required ADRs are identified;
- and scope-change governance is active.

No implementation dependency is assumed complete at this stage.

---

## 157. Milestone 1 — Research and Governance Definition

Complete when:

- Research Questions are drafted;
- evidence review plan exists;
- intervention components and pathways are defined;
- Protocol Draft exists;
- Consent scopes are defined;
- Community, matching and Message rules are defined;
- moderation and Safety plans exist;
- measurement plan exists;
- DatasetDefinition Draft exists;
- AnalysisPlan Draft exists;
- and ethics or governance pathway is confirmed.

---

## 158. Milestone 2 — UX and Accessibility Definition

Complete when:

- information architecture is approved;
- Participant onboarding prototype exists;
- Consent prototype exists;
- Life Story prototype exists;
- Community and matching prototypes exist;
- Block and Report are visible;
- Moderator and Safety flows exist;
- Researcher flow exists;
- critical accessibility patterns are tested;
- and content style is approved.

---

## 159. Milestone 3 — Technical and Security Foundation

Complete when:

- repository and CI/CD exist;
- development, test and production-like environments exist;
- identity integration works;
- modular backend skeleton exists;
- database and migrations work;
- object quarantine works;
- queue, jobs and outbox work;
- audit and observability work;
- secrets and provider configuration are protected;
- feature flags work;
- backup and restore baseline exists;
- and deployment is repeatable.

---

## 160. Milestone 4 — Researcher Governance Slice

Complete when a Researcher can:

- create ResearchProject;
- define ResearchQuestions;
- create EvidenceReview;
- approve EvidenceDecision;
- create EvidenceSnapshot;
- create InterventionVersion and configuration;
- create ProtocolVersion;
- define Consent, Community, matching, Safety and Dataset rules;
- submit for review;
- and activate only after approval.

Approved versions must be immutable.

---

## 161. Milestone 5 — Participant Control and Onboarding Slice

Complete when a Participant can:

- activate an account;
- review accessible information;
- make granular Consent decisions;
- record assistance;
- configure AccessibilityProfile;
- complete screening and baseline;
- become enrolled;
- review withdrawal;
- and request help.

Complete also requires:

- Consent withdrawal propagation;
- protected existence;
- wrong-role tests;
- and Supporter access tests.

---

## 162. Milestone 6 — Private Life Story Slice

Complete when a Participant can:

- open a private archive;
- create a Draft;
- add text or approved media;
- use enabled AI assistance;
- review proposed people, dates and places;
- confirm or correct wording;
- save as Private;
- export;
- withdraw;
- and report a sensitive concern.

AI invention and authorship tests must pass.

---

## 163. Milestone 7 — Life Story Sharing and PublicProfile Slice

Complete when a Participant can:

- create a PublicProfile;
- select fields explicitly;
- share a LifeStoryItem with Selected People or approved Platform audience;
- review sharing rights;
- change Visibility;
- withdraw sharing;
- and understand Platform Public versus Internet Public.

Internet Public must remain unavailable unless separately approved.

---

## 164. Milestone 8 — Governed Community Slice

Complete when:

- CommunitySpace and rules exist;
- membership works;
- feed applies eligibility and Visibility;
- SocialPost Draft and confirmation work;
- comments and reactions work if enabled;
- Block and Report are available;
- Moderator queue works;
- content restriction and restoration work;
- accessibility tests pass;
- and abuse simulations pass.

No Participant Pilot use occurs before Moderator staffing exists.

---

## 165. Milestone 9 — Open Matching and MutualAcceptance Slice

Complete when a Participant can:

- understand matching;
- opt in;
- choose allowed attributes;
- activate and pause MatchPreference;
- receive MatchCandidate;
- review MatchExplanation;
- record an independent MatchDecision;
- Block or Report;
- and expire or supersede a candidate decision.

Complete also requires:

- prohibited-feature tests;
- candidate-expiry tests;
- decision-ownership tests;
- Block tests;
- compatible-decision evaluation;
- MutualAcceptance creation;
- MutualAcceptance expiry and invalidation;
- no disclosure of the other actor's private decision;
- and no automatic Connection.

ConnectionRequest remains disabled.

## 166. Milestone 10 — Connection, ConversationThread and Messaging Slice

Complete when:

- valid unused MutualAcceptance activates one Connection;
- reused, expired or invalidated MutualAcceptance is rejected;
- existing-contact CommunicationBasis can be resolved where enabled;
- ConversationThread requires a current approved basis;
- Thread participants cannot be silently expanded;
- Message Draft is separate from send;
- SendConfirmation binds actor, version and recipients;
- the canonical event `MessageSendConfirmed` is recorded before `MessageQueued`;
- MessageQueued is durable and idempotent;
- M16 provider submission works;
- callbacks are authenticated, replay-protected and idempotent;
- Sent, Provider Accepted, Delivered, Failed and Unknown remain distinct;
- retry creates another DeliveryAttempt rather than duplicate Message;
- Mute, Disconnect and Block work;
- Block cancels or suppresses pending delivery where technically possible;
- Report remains available;
- private Message body is excluded from general Search, AI memory and ordinary research;
- and scam, harassment and provider-failure simulations pass.

## 167. Milestone 11 — AI, Moderation and Safety Slice

Complete when:

- approved AI configuration exists;
- enabled roles and Tools are registered;
- Context filtering works;
- retrieval is source-authorised;
- Tool confirmation works;
- Life Story invention tests pass;
- matching and Message boundaries pass;
- provisional moderation signals work;
- AISafetySignalRaised creates SafetySignal;
- human triage works;
- AI kill switches work;
- and manual fallback exists.

AI cannot complete any Level 5 action.

---

## 168. Milestone 12 — Dataset and Analysis Slice

Complete when:

- assessments and observations work;
- exposure and fidelity are complete;
- DatasetDefinition is approved;
- DatasetVersion is generated;
- data-quality review works;
- manifest and variable dictionary exist;
- DatasetLock is human-authorised;
- approved AnalysisPlan executes;
- AnalysisRun records environment and outputs;
- InterpretationRecord is reviewed;
- and ResearchFinding can be approved.

---

## 169. Milestone 13 — Full Synthetic Pilot

Complete when the team executes:

```text
Create and Approve ResearchProject
        ↓
Create Synthetic Participants
        ↓
Consent and Enrol
        ↓
Create and Confirm Life Story
        ↓
Join Community
        ↓
Run Matching and Create Connection
        ↓
Draft and Send Message
        ↓
Complete Human-Interaction Simulation
        ↓
Trigger Report, Moderation and Safety Scenarios
        ↓
Complete Follow-Up
        ↓
Generate and Lock Dataset
        ↓
Run Analysis
        ↓
Approve Finding and InterventionDecision
```

The synthetic Pilot includes failure and withdrawal paths.

---

## 170. Milestone 14 — Pilot Readiness

Complete when:

- approved ProtocolVersion exists;
- required ethics and governance approval exists;
- Core scope passes end-to-end tests;
- Controlled Optional scope is explicitly enabled or disabled;
- security and privacy review pass;
- accessibility and usability pass;
- moderation and Safety staffing are ready;
- AI evaluation passes;
- backup restore passes;
- deletion and withdrawal propagation pass;
- support and training are ready;
- rollback and kill switches are tested;
- and Pilot readiness is formally approved.

---

## 171. Milestone 15 — Controlled Pilot

Complete when:

- recruitment and Enrolment occur;
- intervention delivery is monitored;
- Participant support is active;
- Moderator and Safety queues are monitored;
- quality issues are reviewed;
- AI and provider behaviour are monitored;
- pause and stop conditions are enforced;
- interim review is completed;
- and operational learning is recorded.

Completion does not require a favourable intervention outcome.

---

## 172. Milestone 16 — MVP Evaluation and Decision

Complete when:

- Pilot data collection closes;
- withdrawal and retention states are reconciled;
- DatasetVersion is generated and locked;
- AnalysisRun completes;
- InterpretationRecord is reviewed;
- ResearchFinding is approved or rejected;
- limitations are documented;
- Participant results are prepared where applicable;
- InterventionDecision is recorded;
- Platform lessons are documented;
- and next-release scope is approved.

---

## 173. Recommended Build Order

1. delivery baseline and governance;
2. identity, Organisation and audit;
3. role, Relationship, Consent and PolicyDecision;
4. ResearchProject, evidence and ProtocolVersion;
5. ParticipantProfile, accessibility and onboarding;
6. private Life Story;
7. Block, Report and moderation foundation;
8. PublicProfile and governed Community;
9. MatchPreference, MatchCandidate and explanation;
10. MutualAcceptance and Connection;
11. limited messaging;
12. SafetySignal and SafetyEvent workflow;
13. AI Orchestrator and approved Tools;
14. assessment, observation, exposure and fidelity;
15. DatasetDefinition and quality;
16. DatasetLock, AnalysisRun and ResearchFinding;
17. synthetic Pilot;
18. operational hardening;
19. controlled Pilot;
20. evaluation and InterventionDecision.

---

## 174. Build-Order Constraints

The following constraints apply:

- no Community release before Block and Report;
- no Community Pilot use before human moderation;
- no matching generation before allowed-attribute policy;
- no Connection before MutualAcceptance;
- no messaging before communication basis;
- no Participant-facing AI before SafetySignal routing;
- no public sharing before withdrawal propagation;
- no Dataset generation before DatasetDefinition;
- no AnalysisRun before DatasetLock;
- no ResearchFinding approval before Interpretation review;
- and no Pilot before full synthetic completion.

---

## 175. Delivery Epics

- EPIC-01 Delivery and Research Baseline
- EPIC-02 Platform Foundation
- EPIC-03 Identity and Organisation
- EPIC-04 Roles, Relationship and Consent
- EPIC-05 Research Project, Evidence and Protocol
- EPIC-06 Participant Profile and Accessible Onboarding
- EPIC-07 Screening, Enrolment and Withdrawal
- EPIC-08 Intervention Portfolio and Configuration
- EPIC-09 Private Life Story
- EPIC-10 Life Story Sharing and Export
- EPIC-11 PublicProfile and Community
- EPIC-12 Open Matching and MatchExplanation
- EPIC-13 MutualAcceptance and Connection
- EPIC-14 Messaging and Abuse Controls
- EPIC-15 Report, Moderation and Appeal
- EPIC-16 SafetySignal and SafetyEvent
- EPIC-17 AI Orchestration and Tools
- EPIC-18 Assessment, Observation and Outcome
- EPIC-19 Dataset and Data Quality
- EPIC-20 Analysis, Finding and InterventionDecision
- EPIC-21 Reporting, Export and Audit
- EPIC-22 Reliability and Operations
- EPIC-23 Synthetic Pilot and Readiness
- EPIC-24 Controlled Pilot and Evaluation

---

## 176. Epic Traceability

Every Epic must identify:

- Research Question;
- Intervention component;
- Participant or operational need;
- module owner;
- actor;
- domain aggregates;
- Consent scopes;
- permission;
- Data Classification;
- accessibility;
- moderation or Safety impact;
- AI impact;
- data and Dataset impact;
- tests;
- milestone;
- and accountable owner.

An Epic without traceability is not ready.

---

## 177. Dependency Graph

```text
Platform Foundation
        ↓
Identity and Consent
        ↓
Research and Protocol
        ↓
Accessible Onboarding
        ↓
Life Story
        ↓
Block and Moderation ─────┐
        ↓                 │
Community                 │
        ↓                 │
Matching Policy           │
        ↓                 │
MutualAcceptance          │
        ↓                 │
Connection and Messaging ◄┘
        ↓
AI and Safety
        ↓
Dataset and Analysis
        ↓
Synthetic Pilot
        ↓
Pilot Readiness
```

DatasetDefinition, UX, security and operational planning run in parallel.

---

## 178. External Dependency Map

Critical external dependencies include:

- Pilot partner;
- ethics or governance approval;
- identity provider;
- Knowledge Platform capability;
- AI provider approval;
- communication provider;
- media-processing provider where enabled;
- measurement licences;
- accessibility testing participants;
- moderation staffing;
- Safety escalation contacts;
- analytical environment;
- and data residency decision.

Each dependency has:

- owner;
- due gate;
- fallback;
- risk;
- and stop condition.

---

## 179. Prioritisation Model

Priority order:

1. Participant rights and safety;
2. Protocol and research validity;
3. Consent, permission and privacy;
4. accessibility;
5. moderation and social safety;
6. intervention delivery;
7. data quality and reproducibility;
8. operational readiness;
9. AI usefulness;
10. efficiency and future scale.

Technical novelty and visual polish do not outrank higher categories.

---

## 180. Scope Budget

The MVP maintains a fixed governance and operational budget.

A new capability may enter Core only when:

- it supports an approved Research Question;
- its Consent and data use are defined;
- its social-safety and accessibility controls exist;
- staffing can operate it;
- Dataset impact is defined;
- and another scope or delivery capacity is not silently displaced.

---

## 181. Definition of Ready

A delivery item is Ready when:

- actor is identified;
- user or operational value is defined;
- Research Question or requirement is linked;
- owning module and aggregate are known;
- lifecycle transition is defined;
- acceptance criteria exist;
- Consent and purpose are defined;
- permission and Visibility are defined;
- Block, moderation and Safety effects are defined;
- data class and retention are defined;
- accessibility is defined;
- API, event and storage impact are known;
- failure and rollback are defined;
- test plan exists;
- dependencies are known;
- and accountable owner is assigned.

---

## 182. Definition of Done

A delivery item is Done when:

- functional acceptance passes;
- domain invariants pass;
- permission and protected-existence tests pass;
- Consent and withdrawal tests pass;
- Block and Visibility tests pass where applicable;
- accessibility tests pass;
- social-safety and moderation tests pass where applicable;
- Safety tests pass where applicable;
- audit and observability exist;
- data lineage exists;
- error and degraded states exist;
- documentation and runbooks are updated;
- deployment and rollback pass;
- and product, technical and operational owners accept it.

---

## 183. AI Definition of Done

AI work additionally requires:

- AI role;
- risk and Action Level;
- approved configuration;
- model alias;
- provider eligibility;
- Prompt and output schema version;
- Tool Card;
- Context and retrieval policy;
- evaluation dataset;
- must-pass threshold;
- prohibited-action tests;
- accessibility review;
- Human Review path;
- kill switch;
- retention and deletion;
- monitoring;
- and rollback.

Fluent output is not evidence of completion.

---

## 184. Data Definition of Done

Data and research work additionally require:

- source authority;
- exact versions;
- DatasetDefinition;
- variable dictionary;
- missingness;
- transformation;
- quality rule;
- de-identification;
- lineage;
- manifest;
- checksum;
- approval;
- and reproducibility test.

---

## 185. Participant Acceptance Criteria

A Participant can:

- understand the Pilot;
- make granular Consent choices;
- request assistance;
- set accessibility preferences;
- complete or decline baseline;
- create or skip Life Story activity according to Protocol;
- review AI Drafts;
- control Life Story visibility;
- join or decline Community;
- opt into or decline matching;
- understand MatchExplanation;
- make an independent MatchDecision;
- connect only through mutual acceptance;
- send only confirmed Messages;
- Mute, Disconnect, Block and Report;
- complete or decline intervention activity;
- complete follow-up;
- review eligible AI memory;
- withdraw without manipulation;
- and receive clear support.

---

## 186. Supporter Acceptance Criteria

An authorised Supporter can:

- understand Relationship purpose;
- accept or decline invitation;
- view permission scope;
- assist without taking over the Participant decision;
- contribute to Life Story only when permitted;
- participate in assigned activity;
- access only shared content;
- report a concern;
- and lose access after revocation.

They cannot access unrelated messages, matching, assessments, Safety or research data.

---

## 187. Researcher Acceptance Criteria

A Researcher can:

- create and govern ResearchProject;
- manage EvidenceReview and EvidenceDecision;
- version Protocol and intervention;
- configure pathways and measures;
- monitor Enrolment, exposure and completion;
- review data quality;
- access approved research views;
- generate DatasetVersion;
- complete lock readiness;
- execute approved Analysis;
- create InterpretationRecord;
- Draft ResearchFinding;
- and record InterventionDecision.

Researcher role does not automatically grant moderation, Safety or administration access.

---

## 188. Moderator Acceptance Criteria

A Moderator can:

- receive and assign cases;
- review permitted evidence;
- see applicable rule version;
- distinguish provisional signals;
- record proportionate decision;
- apply or request action;
- protect reporter identity;
- link a SafetySignal where required;
- support appeal;
- restore content;
- and preserve audit.

---

## 189. Safety Reviewer Acceptance Criteria

A Safety Reviewer can:

- receive SafetySignals;
- assess urgency;
- review minimum necessary context;
- close as not event;
- convert to SafetyEvent;
- record action;
- monitor;
- pause relevant intervention or Pilot scope;
- resolve;
- close;
- reopen;
- and preserve audit.

AI or Moderator action does not replace this authority.

---

## 190. AI Acceptance Criteria

Enabled AI can:

- identify its role;
- use only authorised Context;
- ground evidence-sensitive output;
- distinguish source and inference;
- preserve Draft state;
- request confirmation;
- refuse prohibited actions;
- avoid dependency and exclusivity language;
- avoid invented Life Story details;
- use only allowed matching features;
- preserve Message Draft state;
- create only provisional moderation signals;
- raise SafetySignal;
- preserve provenance;
- degrade safely;
- and obey kill switches.

---

## 191. Data and Research Acceptance Criteria

The Platform can:

- preserve source identifiers and versions;
- separate operational and analytical data;
- preserve corrections;
- represent missingness;
- apply withdrawal rules;
- create an approved DatasetDefinition;
- generate a reproducible DatasetVersion;
- preserve manifest and checksums;
- human-authorise DatasetLock;
- run approved analysis;
- preserve code and environment;
- distinguish AnalysisOutput from interpretation;
- approve or reject ResearchFinding;
- and reproduce the result package.

---

## 192. Technical Acceptance Criteria

The Platform can:

- deploy repeatably;
- migrate safely;
- authenticate and authorise;
- recover from dependency failure;
- process idempotent commands;
- publish outbox events;
- retry and dead-letter;
- validate uploads;
- enforce private object access;
- invalidate Search, Vector and cache;
- monitor critical paths;
- restore backup;
- roll back compatible releases;
- and preserve research history.



---

## 193. Pilot Readiness Gate

The Pilot must not begin until every mandatory readiness area is approved.

Required evidence includes:

- approved ProtocolVersion;
- governance and ethics completion;
- exact InterventionConfiguration;
- approved Consent and Participant materials;
- Life Story and Community readiness;
- matching-policy and MutualAcceptance readiness;
- CommunicationBasis and Thread readiness;
- Message Draft, SendConfirmation and delivery-state readiness;
- provider callback authentication and reconciliation;
- Block cancellation and propagation;
- Moderator and Safety staffing;
- approved DatasetDefinition and AnalysisPlan;
- security, privacy and accessibility tests;
- synthetic Pilot;
- backup restore;
- withdrawal and deletion propagation;
- and formal readiness approval.

A conditional approval may enable only a restricted cohort or feature set.

Unresolved critical defects cannot be accepted through informal risk acknowledgement.

## 194. Research Readiness

Required:

- approved ResearchQuestions;
- approved ProtocolVersion;
- approved intervention and AI configuration;
- eligibility and recruitment plan;
- granular Consent materials;
- measurement plan;
- DatasetDefinition;
- AnalysisPlan;
- Safety monitoring;
- moderation plan;
- pause and stop criteria;
- and governance approval.

---

## 195. Participant Experience Readiness

Required:

- end-to-end onboarding works;
- Consent is understandable;
- accessibility settings work;
- Life Story controls are clear;
- Community and matching choices are optional and understandable;
- Block and Report are visible;
- Message send is explicit;
- withdrawal works;
- support materials exist;
- and representative usability testing passes.

---

## 196. Social Safety and Communication Readiness

Required:

- CommunityRuleVersion is approved;
- Moderator ownership is assigned;
- report queue works;
- reporter identity is protected;
- Block propagation passes;
- prohibited matching-feature tests pass;
- MatchDecision ownership passes;
- MutualAcceptance expiry, invalidation and single-use tests pass;
- Connection activation tests pass;
- CommunicationBasis tests pass;
- Thread membership tests pass;
- Message confirmation and delivery-state tests pass;
- provider callbacks and reconciliation pass;
- pending-delivery cancellation after Block is tested;
- scam and harassment scenarios pass;
- appeal path exists where required;
- and response targets are operational.

## 197. Safety Readiness

Required:

- SafetySignal categories are defined;
- triage ownership is assigned;
- escalation contacts are current;
- SafetyEvent conversion is human-controlled;
- intervention and study pause work;
- AI SafetySignal routing works;
- emergency limitations are clear;
- and simulated Safety scenarios pass.

---

## 198. AI Readiness

Required:

- provider and model are approved;
- AIInterventionConfigurationVersion is approved;
- enabled Prompt and Tool versions are approved;
- evaluation thresholds pass;
- Life Story invention tests pass;
- matching, Message and moderation boundaries pass;
- provider data policy is approved;
- Human Review exists;
- kill switches work;
- and manual fallback exists.

---

## 199. Data and Analysis Readiness

Required:

- MeasurementVersions are configured;
- data sources and purpose are documented;
- missingness and correction work;
- DatasetDefinition is approved;
- analytical environment is ready;
- manifest and checksum tools work;
- de-identification review exists;
- DatasetLock authority is assigned;
- and synthetic Dataset and Analysis complete.

---

## 200. Technical Readiness

Required:

- production environment is deployed;
- migrations are validated;
- monitoring and alerts work;
- audit is available;
- queue and dead-letter operations work;
- provider timeouts and fallback work;
- object quarantine works;
- backup and restore pass;
- rollback is tested;
- deletion propagation is tested;
- and capacity is sufficient for the planned cohort.

---

## 201. Security and Privacy Readiness

Required:

- threat review is complete;
- privacy assessment is complete;
- wrong-role and wrong-project tests pass;
- protected-existence tests pass;
- Consent withdrawal tests pass;
- Block tests pass;
- field protection passes;
- provider review is current;
- privileged access is reviewed;
- incident response is ready;
- and no unresolved critical vulnerability remains.

---

## 202. Operational Readiness

Required:

- support owner;
- Moderator schedule;
- Safety Reviewer schedule;
- escalation roster;
- issue-triage process;
- Participant communication;
- staff training;
- provider contacts;
- job and dead-letter review;
- deletion and export review;
- and Pilot-day checklist.

---

## 203. Stop and Pause Conditions

Participant, feature, cohort or study pause may be required when:

- Consent enforcement fails;
- identity or authority is uncertain;
- Block propagation fails;
- private content becomes visible incorrectly;
- matching uses prohibited data;
- MutualAcceptance is bypassed;
- unauthorised Message send occurs;
- reporter identity leaks;
- serious moderation backlog develops;
- a serious SafetyEvent occurs;
- AI repeatedly produces unsafe or invented content;
- cross-Participant or cross-project leakage occurs;
- delivery differs materially from Protocol;
- audit is unreliable;
- backup or recovery is unavailable;
- Dataset integrity is compromised;
- or data quality prevents meaningful evaluation.

---

## 204. Pause Scope

A pause decision identifies:

- affected Participant;
- feature;
- AI role;
- Community;
- matching;
- messaging;
- intervention component;
- cohort;
- ResearchProject;
- or entire Platform.

The smallest safe scope is preferred.

A pause does not erase historical records.

---

## 205. Resume Criteria

Resume requires:

- root cause understood;
- containment complete;
- corrective change tested;
- affected data and Participants assessed;
- approvals obtained;
- monitoring increased where required;
- rollback available;
- and communication completed.

A serious incident may require Protocol amendment or re-Consent.

---

## 206. Release Strategy

Recommended release stages:

1. developer and unit testing;
2. module integration;
3. synthetic data environment;
4. multidisciplinary review;
5. accessibility and usability testing;
6. research sandbox;
7. shadow or Draft-only AI;
8. staff simulation;
9. full synthetic Pilot;
10. Pilot readiness environment;
11. limited controlled cohort;
12. approved cohort expansion.

---

## 207. Feature-Flag Strategy

Feature flags may control:

- Life Story media;
- Supporter contribution;
- Community comments;
- Open Matching;
- Message attachments;
- read receipts;
- AIMemoryItem;
- AI SocialPost action;
- AI MatchDecision action;
- AI Message send;
- transcription;
- translation;
- and optional intervention components.

A flag has owner, default, eligibility, Protocol compatibility, test evidence and rollback.

---

## 208. Rollback Strategy

Rollback supports:

- application release;
- database-compatible code;
- model alias;
- Prompt;
- Tool;
- retrieval source;
- AI configuration;
- Community feature;
- matching feature;
- messaging feature;
- and notification configuration.

Rollback must not:

- erase recorded research events;
- delete a confirmed Participant choice;
- reverse a Block silently;
- alter a locked DatasetVersion;
- or misrepresent Message delivery.

---

## 209. Test Strategy

The MVP includes:

- unit tests;
- domain and state-transition tests;
- API and contract tests;
- database-constraint tests;
- permission and Consent tests;
- accessibility tests;
- usability tests;
- Community and matching tests;
- moderation tests;
- Safety tests;
- AI evaluation and red teaming;
- event and job tests;
- migration tests;
- security tests;
- performance tests;
- provider-failure tests;
- deletion tests;
- backup and restore;
- analytical reproducibility;
- and end-to-end Pilot simulation.

---

## 210. Synthetic Pilot Scenarios

Mandatory scenarios include:

- successful existing-contact pathway without M18 Connection;
- successful matching pathway;
- matching decline;
- no MutualAcceptance;
- MutualAcceptance expiry before Connection;
- MutualAcceptance invalidation after Consent or Block change;
- attempted MutualAcceptance reuse;
- ConnectionRequest feature-disabled response;
- Block before matching;
- Block after Connection;
- Thread creation with invalid CommunicationBasis;
- Message Draft saved without send;
- mismatched or expired SendConfirmation;
- MessageQueued followed by provider failure;
- Provider Accepted without Delivered;
- duplicate and reordered provider callback;
- Delivery Unknown and reconciliation;
- Block after queue with cancellation or documented provider limitation;
- Supporter contribution rejection;
- Life Story withdrawal;
- Community report;
- moderation restriction and appeal;
- AI invented-detail attempt;
- AI MutualAcceptance or Connection attempt;
- AI unauthorised send attempt;
- SafetySignal closed as not SafetyEvent;
- SafetySignal converted by authorised human;
- Dataset quality failure;
- DatasetLock rejection;
- and end-to-end withdrawal propagation.

## 211. Accessibility Testing

Testing includes:

- keyboard-only use;
- screen reader;
- zoom and text scaling;
- contrast;
- simple-language mode;
- reduced-content mode;
- step-by-step mode;
- time extension;
- error recovery;
- voice or read-aloud where enabled;
- motor and attention constraints;
- and assisted completion.

Critical Participant rights must remain reachable in every mode.

---

## 212. Social Safety and Messaging Testing

Testing includes:

- fake profile attempt;
- impersonation;
- spam;
- harassment;
- repeated unwanted contact;
- financial solicitation;
- malicious link;
- hidden precise location;
- prohibited matching feature;
- another actor's MatchDecision submission;
- Block bypass;
- invalid MutualAcceptance creation;
- Connection without MutualAcceptance;
- Thread without CommunicationBasis;
- participant-set manipulation;
- Message send without exact confirmation;
- attachment quarantine bypass;
- provider callback forgery;
- duplicate callback;
- false Delivered state;
- pending-delivery cancellation failure;
- reporter exposure;
- moderation delay;
- and appeal restoration.

Testing records both technical outcome and Participant-facing clarity.

## 213. AI Testing

Testing includes:

- prompt injection;
- retrieved-content injection;
- Tool injection;
- cross-project access;
- cross-Participant access;
- Life Story invention;
- false certainty;
- hidden matching inference;
- unauthorised Message send;
- fake social proof;
- moderation overreach;
- SafetyEvent confirmation attempt;
- DatasetLock attempt;
- research-approval attempt;
- provider substitution;
- provider retention;
- and deletion.

---

## 214. Research Reproducibility Testing

The team must reproduce:

- active Protocol and intervention configuration;
- Participant assignment and exposure;
- assessment scoring;
- DatasetVersion;
- manifest and checksums;
- DatasetLock;
- AnalysisRun;
- outputs;
- InterpretationRecord;
- ResearchFinding;
- and intervention decision package.

The same locked inputs must produce the same governed analytical package within documented nondeterminism.

---

## 215. Observability

Monitor:

- authentication and access failures;
- Consent and withdrawal;
- Block propagation;
- Community errors;
- matching generation and prohibited-feature attempts;
- Message state;
- reports and moderation backlog;
- SafetySignal age;
- AI errors, boundary failures and cost;
- jobs and dead letters;
- object validation;
- Search and cache lag;
- Dataset readiness;
- AnalysisRun state;
- backup;
- deletion propagation;
- and support volume.

---

## 216. Pilot Dashboards

Operational dashboards should separate:

- Participant onboarding;
- intervention delivery;
- Community and matching;
- moderation;
- Safety;
- AI;
- data quality;
- technical reliability;
- and support.

A dashboard count is not a scientific result.

Research dashboards use approved definitions and versioned data.

---

## 217. Support Model

The support model defines:

- Participant contact channel;
- available hours;
- accessibility support;
- technical support;
- Community support;
- Moderator escalation;
- Safety escalation;
- privacy contact;
- withdrawal assistance;
- and complaint process.

AI is not the only support route.

---

## 218. Training

Training is required for:

- Researchers;
- Coordinators;
- Supporters where applicable;
- Moderators;
- Safety Reviewers;
- Administrators;
- support staff;
- Analysts;
- and incident responders.

Training includes role boundaries and prohibited access.

---

## 219. Participant Materials

Required materials include:

- study information;
- granular Consent;
- accessibility guide;
- Life Story guide;
- sharing and visibility guide;
- Community Rules;
- matching explanation;
- Connection and Message safety;
- Block and Report;
- AI role and limitations;
- privacy and retention;
- support;
- withdrawal;
- and Participant results.

---

## 220. Delivery Team Capabilities

The MVP requires access to:

- Product leadership;
- Research leadership;
- intervention design;
- older-adult and Participant engagement;
- UX and accessibility;
- frontend engineering;
- backend and data engineering;
- security and privacy;
- AI engineering and evaluation;
- moderation and Community safety;
- Safety oversight;
- analytics;
- quality engineering;
- operations;
- and technical writing or content design.

One person may hold multiple roles, but accountability remains explicit.

---

## 221. Delivery Governance

Governance includes:

- Product and Research steering;
- Architecture review;
- Protocol and ethics review;
- security and privacy review;
- AI governance;
- Community and moderation governance;
- Dataset and Analysis approval;
- Pilot readiness review;
- interim Pilot review;
- incident review;
- and post-Pilot decision.

Decisions reference exact artefact versions.

---

## 222. Decision Cadence

Recommended cadence:

- regular delivery review;
- research and Protocol review at milestones;
- security and privacy review before exposure;
- AI review before activation;
- Community and moderation review before release;
- Pilot readiness review before recruitment;
- interim review during Pilot;
- and final evaluation review.

Urgent safety and incident decisions do not wait for ordinary cadence.

---

## 223. Required Architecture Decision Records

At minimum:

- application and deployment stack;
- relational database;
- schema ownership;
- identity provider;
- object and media storage;
- queue and outbox;
- Search and Vector approach;
- AI provider and Model Gateway;
- provider data policy;
- message provider;
- Community ranking;
- matching attributes and algorithm;
- Block consistency;
- moderation provider use;
- analytical environment;
- Dataset format;
- data residency;
- retention;
- and Internet Public default.

---

## 224. Required Delivery Artefacts

Required artefacts include:

- Product Backlog;
- approved ProtocolVersion;
- InterventionConfiguration;
- AIInterventionConfigurationVersion;
- consent specification;
- CommunityRuleVersion;
- matching policy;
- moderation plan;
- Safety plan;
- UX prototypes;
- design system;
- ADRs;
- OpenAPI;
- event catalogue;
- database migrations;
- Model, Prompt, Tool and Provider Cards;
- Evaluation Report;
- threat review;
- privacy assessment;
- test plan;
- data dictionary;
- DatasetDefinition;
- Dataset manifest;
- AnalysisPlan;
- support and incident runbooks;
- training materials;
- Pilot readiness checklist;
- and reproducibility package.

---

## 225. Traceability Requirement

Every MVP feature must trace to at least one of:

- Healthy Aging challenge;
- Research Question;
- intervention component;
- Participant need;
- accessibility need;
- Consent or privacy requirement;
- Community or social-safety requirement;
- Safety requirement;
- data or research requirement;
- AI evaluation requirement;
- or operational requirement.

Features without traceability are challenged or removed.

---

## 226. Scope Change Governance

A scope change proposal identifies:

- reason;
- affected Research Question;
- intervention component;
- Participant pathway;
- milestone;
- delivery capacity;
- Protocol impact;
- Consent impact;
- accessibility impact;
- Community or matching impact;
- moderation and Safety impact;
- AI impact;
- data and Dataset impact;
- provider impact;
- and decision owner.

A technically small change may be a material research or Consent change.

---

## 227. MVP Success Criteria

The MVP is successful when:

1. one real ResearchProject completes the approved lifecycle;
2. Participants complete core flows with acceptable support;
3. Life Story ownership and sharing controls work;
4. Community participation is governed and operable;
5. Open Matching is opt-in and explainable;
6. MatchDecisions remain independent and actor-owned;
7. MutualAcceptance is valid, traceable, expirable, invalidatable and single-use;
8. Connection activates only from valid MutualAcceptance;
9. CommunicationBasis is enforced before Thread creation and Message send;
10. Message Draft, SendConfirmation, queue, send, provider acceptance, delivery and failure remain distinct;
11. provider callbacks are authenticated, idempotent and reconciled;
12. Block, Report and moderation operate correctly across matching and messaging;
13. AI remains within approved boundaries;
14. SafetySignal and SafetyEvent workflows operate;
15. intervention delivery follows approved versions;
16. data are sufficient for planned evaluation without unnecessary private content;
17. DatasetVersion is reproducible and locked;
18. AnalysisRun is traceable;
19. ResearchFinding and InterventionDecision are accountable;
20. accessibility, privacy and operational burden remain acceptable;
21. withdrawal and deletion propagate correctly;
22. Pilot evidence supports a governed next decision.

Activity volume alone is not success.

## 228. MVP Failure Criteria

The MVP is not successful merely because:

- software deploys;
- users log in;
- SocialPosts exist;
- MatchCandidates are generated;
- MutualAcceptance records exist;
- Connections activate;
- AI produces fluent text;
- Messages are queued or sent;
- a provider returns accepted;
- a dashboard shows activity;
- or a spreadsheet is exported.

Failure indicators include:

- inability to enforce Consent;
- inaccessible rights or flows;
- loss of Life Story authorship;
- hidden or prohibited matching features;
- one actor submitting another actor's MatchDecision;
- MutualAcceptance without canonical source records;
- reused or invalid MutualAcceptance activating Connection;
- Thread creation without CommunicationBasis;
- Message sent without exact confirmation;
- Provider Accepted shown as Delivered;
- unauthenticated or non-idempotent callbacks;
- Block bypass or failed pending-delivery suppression;
- reporter identity exposure;
- AI exceeding authority;
- SafetySignal treated as confirmed SafetyEvent;
- irreproducible DatasetVersion or AnalysisRun;
- unacceptable burden, inequity or operational instability;
- or inability to make an accountable post-Pilot decision.

## 229. Post-Pilot Decision Framework

The InterventionDecision may be:

- Retain;
- Revise;
- Restrict;
- Replicate;
- Expand;
- Suspend;
- Retire;
- or Continue Exploratory Research.

The decision considers:

- feasibility;
- acceptability;
- accessibility;
- benefit;
- harm;
- burden;
- equity;
- Life Story experience;
- Community safety;
- matching fairness;
- Connection quality;
- AI performance;
- moderation;
- Safety;
- data quality;
- technical reliability;
- operational cost;
- and uncertainty.

---

## 230. Release 2 Candidate Areas

Potential Release 2 candidates include:

- expanded Life Story media;
- intergenerational sharing;
- refined matching;
- additional CommunitySpaces;
- multilingual support;
- stronger accessibility modalities;
- privacy-preserving personalisation;
- participant-controlled local AI;
- secure research enclave;
- additional interventions;
- and multi-site research.

Selection must follow Pilot findings rather than pre-committed feature growth.



---

## 231. Risks and Mitigations

### 231.1 Scope Expansion

**Risk:** The integrated vertical slice is mistaken for a requirement to build a broad consumer social network.

**Mitigation:**

- one controlled Pilot;
- one approved Protocol;
- small governed CommunitySpaces;
- limited matching and messaging;
- Core, Controlled Optional and Deferred scope;
- and milestone-based change control.

### 231.2 Research Design Delay

**Risk:** Product and engineering proceed without stable Research Questions, measures or DatasetDefinition.

**Mitigation:**

- Milestone 1 precedes Pilot feature release;
- Research and Dataset workstreams run early;
- synthetic data are used before recruitment;
- and unresolved design blocks readiness.

### 231.3 Life Story Privacy Harm

**Risk:** Sensitive content is exposed, misattributed or retained beyond Participant choice.

**Mitigation:**

- Private default;
- Participant confirmation;
- explicit Visibility;
- separate sharing rights;
- third-party review;
- withdrawal propagation;
- and audit.

### 231.4 AI-Invented Life Story

**Risk:** AI adds plausible but false people, dates, events or meanings.

**Mitigation:**

- Draft state;
- source labels;
- structured proposed details;
- Participant confirmation;
- invention evaluation;
- and kill switch.

### 231.5 Social Safety Failure

**Risk:** Harassment, scams, impersonation or unwanted contact exceed moderation capacity.

**Mitigation:**

- controlled cohort;
- Community Rules;
- Block and Report before exposure;
- rate limits;
- human moderation;
- response targets;
- and stop conditions.

### 231.6 Hidden or Harmful Matching

**Risk:** Matching uses prohibited sensitive features or creates unjustified compatibility claims.

**Mitigation:**

- allowed-attribute registry;
- source provenance;
- MatchExplanation;
- fairness review;
- prohibited-feature tests;
- candidate expiry;
- and human governance.

### 231.7 Non-Mutual Connection

**Risk:** A technical or AI path creates Connection without independent acceptance.

**Mitigation:**

- separate MatchDecision records;
- MutualAcceptance constraint;
- current Block and eligibility checks;
- negative tests;
- and audit.

### 231.8 Messaging Harm

**Risk:** Message automation creates unwanted, fraudulent or unsafe communication.

**Mitigation:**

- communication basis;
- explicit send;
- no autonomous AI;
- Block;
- rate limits;
- scam and link controls;
- report;
- and limited attachments.

### 231.9 Moderation Backlog

**Risk:** Cases remain unresolved and Community safety deteriorates.

**Mitigation:**

- small cohort;
- staffing plan;
- queue SLO;
- priority;
- escalation;
- pause new Community exposure;
- and operational dashboards.

### 231.10 Safety Confusion

**Risk:** Automated or moderation signals are treated as confirmed SafetyEvents.

**Mitigation:**

- separate aggregates;
- separate workspaces;
- human conversion;
- event naming;
- tests;
- and reporting separation.

### 231.11 AI Dependency

**Risk:** Participant engagement becomes emotionally dependent on AI.

**Mitigation:**

- human-connection objective;
- no exclusivity language;
- dependency evaluation;
- usage monitoring;
- reflection;
- human support;
- and AI role disablement.

### 231.12 Accessibility Rework

**Risk:** social and Life Story features are built before representative accessibility testing.

**Mitigation:**

- prototype early;
- shared patterns;
- critical-flow testing;
- accessibility acceptance criteria;
- and staged rollout.

### 231.13 Data Overcollection

**Risk:** Life Story, Message and Community data are collected because they are available rather than required.

**Mitigation:**

- purpose-linked DatasetDefinition;
- content excluded by default;
- data minimisation review;
- de-identification;
- and approval.

### 231.14 Weak Research Dataset

**Risk:** process events, missingness or lineage are incomplete.

**Mitigation:**

- DatasetDefinition before Pilot;
- synthetic Pilot;
- data-quality rules;
- manifest;
- checksums;
- and lock readiness gate.

### 231.15 Provider Change

**Risk:** AI, communication or media provider behaviour changes during the Pilot.

**Mitigation:**

- provider adapters;
- alias and configuration freeze;
- change monitoring;
- re-evaluation;
- fallback;
- and suspension.

### 231.16 Operational Burden

**Risk:** support, moderation, Safety and research operations exceed team capacity.

**Mitigation:**

- cohort cap;
- support-hour definition;
- queue monitoring;
- optional feature disablement;
- staged enrolment;
- and pause criteria.

### 231.17 Partner Dependency

**Risk:** recruitment, staffing or governance depends on a partner that is not ready.

**Mitigation:**

- partner readiness gate;
- named owner;
- fallback setting;
- staged scope;
- and no recruitment before approval.

### 231.18 Public Misinterpretation

**Risk:** Platform Public content is mistaken for Internet Public or research evidence.

**Mitigation:**

- explicit terminology;
- separate delivery path;
- visible audience;
- no Internet Public by default;
- and publication controls.

---

## 232. Dependencies

Critical dependencies include:

- final Pilot partner and setting;
- research leadership;
- approved Protocol;
- ethics or governance review;
- Participant recruitment capability;
- moderation staffing;
- Safety Reviewer availability;
- Knowledge Platform capability;
- identity provider;
- approved AI provider;
- communication provider;
- media provider where enabled;
- measurement availability and licensing;
- accessibility testing;
- data-residency decision;
- analytical environment;
- support capacity;
- and incident response ownership.

Each dependency has:

- accountable owner;
- milestone deadline;
- evidence of readiness;
- fallback;
- and impact if unavailable.

---

## 233. Assumptions

The roadmap assumes:

- one initial research team;
- one primary Organisation;
- one controlled Pilot;
- a limited cohort;
- one primary language;
- limited media;
- managed cloud services;
- one primary region;
- one integrated intervention configuration;
- human review for moderation, Safety and high-impact AI;
- limited support hours;
- one governed analytical environment;
- no Internet Public exposure;
- and no clinical emergency service.

Material assumption changes trigger roadmap review.

---

## 234. Release Candidate Criteria

An MVP Release Candidate requires:

- no unresolved critical security defect;
- no unresolved Consent defect;
- no unresolved cross-Participant or cross-project access defect;
- no unresolved Life Story exposure defect;
- no unresolved Block bypass;
- no unresolved non-mutual Connection defect;
- no unresolved unauthorised Message send;
- no unresolved reporter-confidentiality defect;
- no unresolved Safety workflow defect;
- no unresolved serious accessibility blocker;
- no unresolved Dataset lineage defect;
- successful full synthetic Pilot;
- successful backup restore;
- successful deletion propagation;
- approved ProtocolVersion;
- approved AI configuration;
- approved Community and matching policy;
- operational staffing;
- and approved Pilot readiness review.

---

## 235. MVP Architecture Guardrails

1. one central Research Platform;
2. one complete intervention and research loop;
3. one integrated InterventionConfiguration;
4. M01–M18 domain ownership preserved;
5. one controlled AI Orchestrator;
6. one relational operational system of record;
7. private object storage;
8. approved versions are immutable;
9. explicit granular Consent;
10. explicit purpose and Specific Permission;
11. private-by-default Life Story;
12. PublicProfile separate from ParticipantProfile;
13. Platform Public separate from Internet Public;
14. Internet Public disabled by default;
15. governed Community only;
16. Open Matching opt-in only;
17. allowed matching attributes only;
18. MatchExplanation required;
19. independent Match Decisions;
20. MutualAcceptance before Connection;
21. communication basis before Message;
22. Block before discovery, matching and messaging;
23. human moderation for high-impact decisions;
24. SafetySignal separate from SafetyEvent;
25. AI Draft separate from confirmed domain artefact;
26. no autonomous high-impact AI;
27. DatasetDefinition before DatasetVersion;
28. human DatasetLock;
29. approved AnalysisPlan before AnalysisRun;
30. human-approved ResearchFinding;
31. no unrestricted production analytical access;
32. no uncontrolled external data duplication;
33. no premature microservices;
34. no feature without research, Participant, accessibility, safety, data or operational traceability.

---

## 236. Open Questions

1. Which Pilot setting and partner will be selected?
2. What Participant cohort and sample size are feasible?
3. Will the Pilot use one integrated cohort or staged pathways?
4. Which existing-contact pathway qualifies as core exposure?
5. Is Open Matching enabled for every Participant or a specific cohort?
6. Which CommunitySpaces are required?
7. Which PublicProfile fields are permitted?
8. Is Platform Public required, or is Community visibility sufficient?
9. Is Internet Public disabled for the entire Pilot?
10. Which Life Story prompts and item types are included?
11. Is Life Story media required?
12. Are Supporter contributions enabled?
13. Is intergenerational sharing enabled?
14. Is LegacyPreference feature-disabled?
15. Which matching attributes are approved?
16. What location granularity is permitted?
17. How many MatchCandidates may be shown?
18. What candidate expiry applies?
19. Which MatchDecision values are reversible?
20. What effective period applies to MutualAcceptance?
21. Which changes invalidate unused MutualAcceptance?
22. Does Connection activation require an additional acknowledgement?
23. When may ConnectionRequest be enabled after the Pilot?
24. Which CommunicationBasis types are enabled?
25. May an authorised Relationship create a Thread without an M18 Connection?
26. Are group ConversationThreads deferred?
27. Which Message formats are enabled?
28. Which attachment types and limits are enabled?
29. Are read receipts disabled throughout the Pilot?
30. Which Message states are Participant-visible?
31. Which provider status is sufficient for Delivered?
32. What timeout produces Delivery Unknown?
33. Which callback authentication and key-rotation method is used?
34. How frequently does delivery reconciliation run?
35. Which queued delivery effects can be cancelled after Block?
36. Which Message metadata enter DatasetDefinition?
37. Is Message body excluded from every Pilot DatasetDefinition?
38. Which social-safety response targets apply?
39. Which AI Tools and ActionLevels are enabled?
40. Which accessibility adaptations are required?
41. Which outcome and burden measures are selected?
42. Which Dataset quality issues block DatasetLock?
43. Which AnalysisPlan is approved before Pilot start?
44. Which release gates require independent sign-off?
45. Which feature flags are cohort-specific?
46. Which defects require study-level pause?
47. What provider and moderation staffing coverage is required?
48. Which post-Pilot decision thresholds apply?

## 237. Design Decisions

This document establishes that:

1. Document 18 v1.2 is the authoritative Handbook source for MVP scope and delivery sequencing.
2. The MVP is a complete research-capable vertical slice.
3. The selected slice is Participant-Controlled Life Story and Meaningful Human Connection.
4. The MVP evaluates feasibility, acceptability, accessibility, operational safety and research readiness before effectiveness.
5. The MVP includes private Life Story, governed Community and opt-in Open Matching.
6. Internet Public is disabled by default.
7. Open Matching is inactive by default.
8. MatchCandidate is not MatchDecision, MutualAcceptance, Connection or CommunicationBasis.
9. Each MatchDecision is actor-owned and independent.
10. MutualAcceptance is a required canonical aggregate.
11. MutualAcceptance preserves source records, policy version, effective period, validity and usage.
12. Unused MutualAcceptance may expire or be invalidated.
13. One MutualAcceptance activates at most one Connection.
14. ConnectionRequest is a Deferred Alternative Connection Basis.
15. ConnectionRequest is feature-disabled for the first Pilot.
16. ConnectionRequest acceptance creates MutualAcceptance when later enabled.
17. Connection activates only from valid unused MutualAcceptance.
18. Existing authorised contacts may complete the intervention without M18 Connection.
19. Connection does not create Supporter, care or research authority.
20. CommunicationBasis is required before ConversationThread creation and Message send.
21. ConversationThread is a canonical M18 aggregate.
22. Thread participants are explicit and cannot be silently expanded.
23. Message is a canonical M18 aggregate.
24. Message Draft is not sent.
25. SendConfirmation is actor-, Message-version- and recipient-specific.
26. MessageQueued, MessageSent, MessageProviderAccepted, MessageDelivered and MessageDeliveryFailed are distinct.
27. Provider Accepted is not Delivered.
28. Read receipts are disabled by default.
29. M18 owns canonical Message state.
30. M16 owns provider adapters, callback evidence, retry and reconciliation.
31. M16 cannot directly mutate M18 Message state.
32. Provider callbacks require authentication, replay protection and idempotency.
33. Message retry creates a new DeliveryAttempt, not a duplicate logical Message.
34. Message body is excluded from general Search, Vector, matching, AI memory and ordinary research.
35. Message-content research requires separate explicit governance.
36. Mute, Disconnect and Block are distinct.
37. Block prevents matching, MutualAcceptance, Connection, Thread creation and Message send.
38. Block revocation does not restore prior social state.
39. Report remains available after Block or Disconnect.
40. ModerationCase and SafetyEvent remain separate.
41. Automated detection creates SafetySignal, not SafetyEvent.
42. AI may Draft and explain but cannot create MutualAcceptance, Connection, Thread or unconfirmed send.
43. AI cannot claim delivery from queued, sent or provider-accepted state.
44. DatasetDefinition names every included social and Message metadata variable.
45. Message body is excluded from ordinary Pilot DatasetDefinitions.
46. DatasetVersion is reproducible and DatasetLock is human-authorised.
47. Activity volume is not a Healthy Aging outcome.
48. A provider response is not a domain decision.
49. The delivery roadmap uses independent matching, formation, communication and provider gates.
50. Synthetic Pilot includes invalidation, callback, cancellation and degraded-mode scenarios.
51. Critical Consent, Block, CommunicationBasis and send controls fail closed.
52. The MVP uses a modular monolith and one relational system of record.
53. Microservices, group messaging, unrestricted messaging and public developer APIs are deferred.
54. Direct ConnectionRequest experience is deferred.
55. The Pilot does not begin with unresolved critical social-safety or delivery-state defects.
56. Version 1.2 completes delivery revalidation against Documents 8, 12, 13, 15 and 16.

## 238. Summary

The MVP delivery architecture is:

```text
ResearchQuestion and EvidenceDecision
        ↓
Approved ProtocolVersion
        ↓
Accessible Consent and Enrolment
        ↓
Private Life Story and Participant Confirmation
        ↓
Governed Community or Existing Contact
        ↓
Opt-In Open Matching
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
Message Draft and SendConfirmation
        ↓
M16 Provider Delivery
        ↓
Exact M18 Delivery State
        ↓
Meaningful Human Interaction
        ↓
Assessment, Moderation and Safety
        ↓
DatasetVersion and DatasetLock
        ↓
AnalysisRun, ResearchFinding and InterventionDecision
```

The central delivery rule is:

> No milestone is complete because an interface exists. It is complete only when authority, state, failure, Block, provider evidence, accessibility, audit and research lineage are correct end to end.

Document 18 v1.2 leaves Documents 19 and 20 as the remaining Pilot and UX revalidation dependencies.
