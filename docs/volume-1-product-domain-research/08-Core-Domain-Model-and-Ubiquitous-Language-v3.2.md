# Document 8 — Core Domain Model & Ubiquitous Language

**Version:** 3.2  
**Status:** Revised Domain Model Baseline — M18 Messaging and Mutual Acceptance Aligned  
**Handbook Volume:** Volume I — Product, Domain & Research Architecture  
**Primary System:** Digital Intervention Research Platform  
**Document Owner:** Domain Architecture Governance  
**Approved By:** To be assigned  
**Last Updated:** 2026-07-29  
**Supersedes:** Document 8 — Core Domain Model & Ubiquitous Language v3.1  
**Review Trigger:** A material change to system boundaries, canonical terminology, bounded contexts, aggregate ownership, lifecycle states, Consent or permission semantics, Life Story ownership, Community or public visibility, Open Matching, MatchDecision, MutualAcceptance, ConnectionRequest, Connection, ConversationThread, Message, communication basis, delivery state, Block, moderation, digital legacy, intervention or Protocol versioning, research-data lineage, AI authority, Safety semantics, or external integration boundaries

---

## 1. Purpose

This document defines the authoritative domain model and ubiquitous language of the **Healthy Aging Digital Intervention Research Platform**.

It establishes:

- the canonical business vocabulary;
- the platform's bounded contexts;
- the ownership of domain objects;
- aggregate roots and consistency boundaries;
- entities and value objects;
- domain policies and invariants;
- lifecycle and workflow state machines;
- commands and domain events;
- repositories and domain services;
- cross-context relationships;
- Anti-Corruption Layers;
- external-system boundaries;
- and the minimum canonical model required by the MVP.

This is a **Domain-Driven Design baseline**. It is not a physical database schema, ORM class model, API payload specification, user-interface sitemap, event-bus topic catalogue, or requirement that every bounded context become a microservice.

> Every material platform concept must have one canonical meaning, one accountable owner, one explicit lifecycle, and one traceable relationship to Participant rights, intervention delivery, research evaluation, or governance.

---

## 2. Scope

- identity and organisation membership;
- Participants and Participant preferences;
- relationships, consent, delegation, supported decision-making, substitute authority, and permission evaluation;
- Research Projects, Research Questions, Protocols, Protocol Versions, screening, eligibility, enrolment, withdrawal, and follow-up;
- interventions, Intervention Versions, Intervention Configurations, assignments, sessions, exposure, adaptations, fidelity, and delivery deviations;
- Life Story archives, items, media, contributions, sharing, export, correction, withdrawal, and digital-legacy preferences;
- public and community profiles, social content, Communities, Open Matching, MatchPreferences, MatchCandidates, MatchDecisions, MutualAcceptance, deferred ConnectionRequests, Connections, ConversationThreads, Messages, communication and delivery states, blocks, reports, moderation, and appeals;
- assessments, observations, outcomes, missingness, and measurement provenance;
- Safety Signals, Safety Events, safety actions, escalation, and stopping rules;
- Evidence Reviews, Knowledge References, Evidence Decisions, Evidence Snapshots, local Research Knowledge Gaps, and reference-change alerts;
- AI Companion interactions, configurations, tools, actions, memory, review, safety signals, and evaluation;
- Dataset Definitions, Dataset Versions, Dataset Lock, transformations, de-identification, and data-quality issues;
- Analysis Plans, Analysis Runs, Analysis Outputs, Interpretation Records, Research Findings, and Intervention Decisions;
- reports, exports, Evidence Packages, External Submissions, governance records, audit, and external-system references.

This document does not define the internal ontology or storage model of the **Healthy Aging Knowledge Platform**.

---

## 3. Relationship to Other Documents

### Depends on

- Document 0 — Platform Ecosystem Architecture v1.2
- Document 1 — Project Definition & Vision v2.1
- Document 2 — Conceptual & Evidence Framework v2.1
- Document 3 — Intervention Map v2.3
- Document 4 — User Roles & Permission Model v3.0
- Document 5 — Ability-Adaptive UX Principles v2.1
- Document 6 — Core Product Modules v3.1 for the approved MVP module-scope amendment
- Documents 0–20 Handbook Consistency Review v1.0
- Appendix B — Cross-Document Ubiquitous Language & Glossary v1.0
- Appendix E — Cross-Document Dependency & Authority Map v1.1
- Appendix F — Remaining Consistency Conflict Register v1.1

### Provides input to

- Document 6 — Core Product Modules
- Document 7 — Information Architecture
- Documents 9–12 — Evidence, AI, Research, and Data Architecture
- Documents 13–17 — Technical Architecture
- Documents 18–20 — MVP, Pilot, and UX
- Appendices A–D

## 4. Sources of Domain Authority

| Subject | Primary Authority |
|---|---|
| Ecosystem and system ownership | Document 0 |
| Project purpose and scope | Document 1 |
| Evidence, mechanisms, outcomes, and measurement semantics | Document 2 |
| Intervention identity, versions, lifecycle, evidence status, and decisions | Document 3 |
| Actors, relationships, consent, delegation, permission, and approval authority | Document 4 |
| Ability adaptation and sensitive inference | Document 5 |
| Approved product-module and MVP capability scope | Document 6 v3.1 |
| Canonical bounded contexts, aggregates, entities, events, and vocabulary | Document 8 |
| Evidence-integration implementation | Document 9 |
| AI Companion implementation | Document 10 |
| Research lifecycle and evaluation implementation | Document 11 |
| Data and interoperability implementation | Document 12 |
| Physical storage | Document 16 |

A downstream document may refine implementation. It must not silently redefine the canonical domain meaning in this document or an upstream authority.

### 4.1 v3.2 Consistency Resolution

Version 3.2 resolves the following Handbook conflicts:

- **HC-002:** `ConversationThread` and `Message` are now canonical M18 aggregate roots with explicit ownership, lifecycle, invariants, commands, events, repositories and MVP inclusion.
- **HC-003:** `MutualAcceptance` is now a canonical M18 aggregate root recording the exact compatible decisions or accepted request, policy version, effective period and validity required before Connection activation.
- **HC-004:** `ConnectionRequest` remains a canonical but **Deferred Alternative Connection Basis**. It is not part of the first Pilot's active Open Matching path. If enabled later, acceptance creates `MutualAcceptance`; it does not bypass it.

The current first-Pilot formation path is:

```text
MatchCandidate
        ↓
Independent MatchDecision by Each Participant
        ↓
MutualAcceptance
        ↓
Connection
        ↓
ConversationThread
        ↓
Message
```

Existing authorised contacts may complete an intervention without creating an M18 Connection. A private Platform ConversationThread for such a pathway still requires an approved `CommunicationBasis`.

---

# Part I — Domain Modelling Principles

## 5. Domain-Driven Design Position

The platform uses Domain-Driven Design to preserve meaning across product decisions, UX, research operations, APIs, events, storage, AI tools, reports, and external integrations.

## 6. Domain Model Layers

Ubiquitous Language drives Bounded Contexts; Bounded Contexts define Aggregates; Aggregates enforce invariants; application services coordinate commands; infrastructure implements persistence and integration.

## 7. Aggregate Principle

An aggregate defines a transactional consistency boundary, an aggregate root, permitted internal changes, invariant enforcement, and the events emitted after a valid state change.

## 8. Entity Principle

An entity has stable identity, continuity over time, a lifecycle, and history that matters independently of current attributes.

## 9. Value Object Principle

A value object has no independent identity, is defined by its values, should normally be immutable, and may be replaced rather than edited.

## 10. Domain Service Principle

A domain service represents domain logic that does not naturally belong to one aggregate and must not become a generic container for unrelated rules.

## 11. Application Service Principle

An application service authenticates and authorises the actor, loads aggregate roots, invokes domain behaviour, persists changes, publishes events, and returns a result.

## 12. Repository Principle

A repository exists for an aggregate root. The platform must not create a universal ResearchRepository that owns Protocols, consent, interventions, assessments, datasets, analyses, and findings.

## 13. Versioned Record Principle

A stable concept and its immutable approved versions are distinct. Protocol and ProtocolVersion, Intervention and InterventionVersion, and AIInterventionConfiguration and its versions must remain separate.

## 14. Immutable Approval Principle

Approved Protocol Versions, Intervention Versions, Evidence Decisions, Evidence Snapshots, locked Dataset Versions, approved Analysis Plans, Interpretation Records, Research Findings, and AI configuration versions are immutable.

## 15. State Separation Principle

Lifecycle maturity, version state, workflow-task state, approval decision, scientific conclusion, evidence direction, deployment state, external-submission state, and publication state are separate dimensions.

## 16. Authorship and Provenance Principle

Participant-authored, Supporter-provided, researcher-authored, imported, observed, calculated, AI-generated, AI-inferred, and human-approved information must remain distinguishable.

## 17. Human Governance Principle

AI and automated rules may retrieve, classify provisionally, suggest, draft, validate, detect a possible signal, or request review, but may not autonomously approve governed artefacts or decisions.

```text
Ubiquitous Language
        ↓
Bounded Contexts
        ↓
Aggregates and Invariants
        ↓
Entities and Value Objects
        ↓
Commands, Policies, and Domain Services
        ↓
Domain Events
        ↓
Application Services and Workflows
        ↓
APIs, Storage, Jobs, and Integrations
```

---

# Part II — Ecosystem and Model Boundaries

## 18. Ecosystem Boundary

```text
Healthy Aging Knowledge Platform
        │
        │ authoritative knowledge and provenance
        ▼
Knowledge Integration Anti-Corruption Layer
        │
        ▼
Digital Intervention Research Platform
        │
        │ governed AI use
        ▼
AI Companion and AI Orchestration
```

## 19. Healthy Aging Knowledge Platform Ownership

- authoritative evidence and Evidence Claims;
- ontology and terminology mappings;
- theories and mechanisms;
- outcome and measurement definitions;
- source provenance;
- curated Knowledge Gaps;
- knowledge verification state;
- and Knowledge Publication.

## 20. Research Platform Ownership

- Research Projects and Research Questions;
- Participants, consent, relationships, and permissions;
- Protocols and Protocol Versions;
- interventions, Intervention Versions, configurations, and delivery;
- Participant-controlled Life Story archives, story items, media, contributions, sharing, exports, and digital-legacy instructions;
- public and community profiles, social content, communities, matching, connections, blocks, reports, moderation, and appeals;
- assessments, observations, Outcome Records, Safety Signals, and Safety Events;
- Evidence Reviews, Evidence Decisions, Evidence Snapshots, and local Research Knowledge Gaps;
- AI configurations and interaction records;
- Dataset Versions, analyses, Interpretation Records, Research Findings, and Intervention Decisions;
- reports and external-submission packages.

## 21. AI Companion Boundary

- permission-aware assistance;
- evidence-grounded retrieval and explanation;
- role- and task-adaptive support;
- drafting, navigation, adaptation, reflection, and controlled tool use.

## 22. External Authority References

- KnowledgeReference;
- ExternalSystemReference;
- ExternalIdentifierMapping;
- IdentityProviderReference;
- ModelProviderReference;
- RegistryReference;
- DeviceSourceReference;
- ExternalPublicationReference.

The Healthy Aging Knowledge Graph is a capability inside the Knowledge Platform. The AI Companion is not a Participant, Supporter, Research Approver, Safety Reviewer, substitute decision-maker, or autonomous domain owner.

---

# Part III — Canonical Ubiquitous Language

## 23. Canonical Actor Terms

### User

A platform identity capable of authenticating or being represented by an authorised account.

### Participant

The canonical domain actor for a person invited to, screened for, enrolled in, or interacting through a Research Project.

### Older Adult

A population description, not a role or permission.

### Resident

A setting-specific description for a Participant in residential, assisted-living, or long-term care.

### Supporter

A person authorised to assist a Participant within a defined relationship, consent, purpose, permission, and resource state.

### Informal Caregiver

A Supporter providing unpaid or informal assistance.

### Professional Caregiver

A human platform role with an organisation and assignment basis for defined intervention or research-support tasks.

### Research Coordinator

A role responsible for recruitment, scheduling, enrolment, and follow-up.

### Researcher

A role responsible for research design, evidence review, analysis, interpretation, and drafting findings.

### Research Approver

A role authorised to approve specified research artefacts.

### Safety Reviewer

A role authorised to triage Safety Signals and review Safety Events.

### Privacy Reviewer

A role authorised to review privacy-sensitive use, disclosure, retention, deletion, or export.

### Organisation Administrator

A role authorised to manage organisation-scoped membership and configuration.

### System Administrator

A technical operations role without default access to Participant content.

## 24. Canonical Research Terms

### Research Project

The primary aggregate for a bounded research initiative. Do not use Study or Programme as the internal aggregate name.

### Research Project Phase

The operational phase, such as Recruitment or Analysis, separate from lifecycle state.

### Research Question

A version-aware research question linked to a Research Project.

### Protocol

The stable identity of a governed research Protocol.

### Protocol Version

An immutable approved or historical version of a Protocol.

### Eligibility Decision

A recorded decision about whether a Participant satisfies Protocol Version criteria.

### Enrolment

The governed link among Participant, Research Project, Protocol Version, consent, and participation state.

### Withdrawal

A Participant or authorised governance action ending or limiting participation.

## 25. Canonical Intervention Terms

### Intervention

A stable intervention identity defined in Document 3.

### Intervention Version

An immutable approved or historical definition of an intervention.

### Intervention Configuration

A Research Project-specific composition of Intervention Versions, dose, sequence, adaptations, AI configuration, and safeguards.

### Intervention Assignment

The governed assignment of an Intervention Configuration to a Participant or approved group.

### Intervention Session

A planned or actual delivery occurrence.

### Exposure

The extent to which the Participant was offered and received the intervention.

### Fidelity

The degree to which delivery followed approved versions, dose, components, safeguards, and adaptation rules.

### Intervention Decision

A human-approved Retain, Revise, Restrict, Replicate, Expand, Suspend, Retire, or Continue Research decision.

## 26. Canonical Measurement and Safety Terms

### Measurement Definition

An authoritative construct or measurement definition owned by the Knowledge Platform.

### Measurement Instrument Reference

A Research Platform reference to an instrument and version.

### Assessment Record

A governed record of one assessment administration.

### Observation

A source-labelled record of something observed or reported.

### Outcome Record

A measured or derived value linked to an Outcome Definition, timepoint, source, and quality state.

### Safety Signal

A report, observation, automated indication, or AI-detected possibility requiring triage.

### Safety Event

A governed record created or confirmed through authorised human review.

### Safety Action

An action taken in response to a Safety Signal or Safety Event.

### Stopping Rule Evaluation

A recorded evaluation of a Participant-level or Research Project-level stopping rule.

## 27. Canonical Evidence Terms

### Knowledge Reference

A versioned local reference to an authoritative Knowledge Platform resource.

### Evidence Review

An aggregate organising retrieval, selection, appraisal, and review for a defined purpose.

### Evidence Decision

A human-accountable decision about evidence applicability.

### Evidence Snapshot

An immutable record of the evidence state used at a research or governance milestone.

### Research Knowledge Gap

A locally identified unresolved question or evidence need.

### Knowledge Gap Reference

A reference to an authoritative Knowledge Platform Knowledge Gap.

### Evidence Package

A governed package prepared for review, reporting, or external submission.

## 28. Canonical AI Terms

### AI Companion

The canonical product and domain term for the platform AI capability.

### AI Mode

A role- and task-adaptive interaction mode, not a separate autonomous assistant.

### AI Interaction

One governed request-response or tool-assisted unit.

### AI Conversation

An optional grouping of related AI Interactions.

### AI Intervention Configuration

A governed configuration defining how AI participates in an Intervention Configuration.

### AI Context Record

A traceable record of sources, permissions, purpose, and redactions used to assemble AI context.

### AI Tool Invocation

A governed request to execute one allowlisted tool.

### AI Action Proposal

A proposed domain action that has not yet been executed.

### AI Memory Item

A purpose-bound, source-labelled, visible, correctable, and time-bounded memory item.

## 29. Canonical Data and Governance Terms

### Dataset Definition

A governed specification of population, variables, transformations, and quality rules.

### Dataset Version

An identified generated dataset with provenance and lifecycle.

### Dataset Lock

A human-authorised transition making a Dataset Version immutable for governed analysis.

### Data Quality Issue

A first-class record of missingness, inconsistency, invalid value, provenance concern, or transformation issue.

### Analysis Plan

A versioned and approvable plan for analysis.

### Analysis Run

One execution of an approved Analysis Plan against a defined Dataset Version.

### Analysis Output

An artefact produced by an Analysis Run.

### Interpretation Record

A human-authored explanation linking analysis outputs to Research Questions and limitations.

### Research Finding

An approved statement derived from defined Protocol, Dataset, Analysis, and Interpretation lineage.

### Review Request

A request for an authorised reviewer to assess a governed artefact.

### Approval Record

An immutable record of approval authority, decision, conditions, time, and artefact version.

### External Submission

A Research Platform record of a package submitted to an external authority or Knowledge Platform process.

## 30. Canonical Life Story Terms

### Life Story Archive

The Participant-controlled container for identity-bearing stories, memories, media, values, traditions, interests, roles, relationships, and life periods.

### Life Story Item

An independently identifiable, versioned, and shareable story, memory, media item, timeline entry, value statement, tradition, recipe, interest, or other identity-bearing record.

### Life Story Contribution

An attributed contribution proposed by a Supporter, community member, researcher, or other authorised actor.

A contribution does not transfer ownership of the Participant's archive or item.

### Participant Testimony

A statement presented as the Participant's own memory, experience, interpretation, or perspective.

Participant Testimony is not automatically an externally verified historical fact.

### Life Story Sharing Policy

The item-level rules governing audience, download, re-sharing, contribution, quotation, public visibility, export, expiry, and withdrawal.

### Life Story Access Grant

A specific, revocable access grant for one actor, audience, purpose, or context.

### Life Story Export

A governed export of selected Life Story content with scope, format, recipient, purpose, and disclosure rules.

### Legacy Preference

A Participant instruction covering future archive handling, memorialisation, posthumous access, deletion, transfer, or continued restriction.

Legacy Preference is not inferred from family relationship or prior sharing.

### Story Attribution

The record of who supplied, edited, translated, transcribed, verified, or approved content.

### Sensitive Story Topic

A Participant-designated or reviewed topic that may require warning, restricted visibility, additional confirmation, pause, support, or Safety Signal escalation.

## 31. Canonical Community, Social Connection and Messaging Terms

### Public Profile

A Participant-controlled profile containing only explicitly selected fields for Community or Platform discovery.

It is separate from the protected Participant Profile.

### Community Space

A governed topic, interest, local, research, intervention or setting-based social space with rules, eligibility, visibility, moderation and membership.

### Community Membership

A governed link between an actor and a Community Space.

Community Membership does not grant access to protected research or Participant records.

### Social Post

An independently identifiable item published to a selected audience.

A Social Post may reference a Life Story Item without transferring Life Story ownership.

### Comment

A response attached to a Social Post or another permitted Community object.

### Reaction

A lightweight response such as acknowledgement, interest or support.

Reaction counts are not Healthy Aging outcomes by themselves.

### Connection Request

A request by one eligible actor to establish a Connection with another actor under a separately approved direct-request policy.

`ConnectionRequest` is a **Deferred Alternative Connection Basis** for the first Pilot.

It is not part of Open Matching, does not create a Connection by itself and, if accepted, must produce a valid `MutualAcceptance` record before Connection activation.

### Match Preference

A Participant-declared description of matching goals, interests, language, communication mode, availability, broad location boundary, desired interaction and exclusions.

### Match Candidate

A temporary, explainable candidate generated for one Participant under an active MatchPreference, matching purpose and policy.

A MatchCandidate is not a Connection, a communication basis or evidence that the other actor is interested.

### Match Explanation

A Participant-facing explanation of the principal permitted declared attributes and approved rules that produced a MatchCandidate.

### Match Decision

One actor's independently recorded decision about one MatchCandidate.

Representative decisions include:

- Interested;
- Not Now;
- Dismissed;
- Blocked;
- Reported;
- and Expired.

A MatchDecision belongs only to the deciding actor and cannot be submitted by the other actor or inferred from profile viewing.

### Match Introduction

A controlled introduction made available after applicable eligibility and disclosure rules.

A MatchIntroduction does not itself create MutualAcceptance, Connection or messaging authority.

### Open Matching

Opt-in discovery of eligible people beyond existing Relationships using declared or separately authorised attributes.

Open Matching does not mean automatic Connection, unrestricted private messaging or hidden sensitive-trait scoring.

### Mutual Acceptance

A canonical aggregate recording that:

- two compatible independent MatchDecisions remain current; or
- one separately approved ConnectionRequest has been accepted;

and that all current eligibility, Consent, Block, policy, expiry and safety conditions required for Connection activation have passed.

MutualAcceptance references exact source decisions or request, participants, purpose, policy version and effective period.

It is not inferred from profile views, Community interaction, AI confidence or unilateral interest.

### Connection

A mutually authorised and revocable social connection activated from one valid MutualAcceptance record.

A Connection is not automatically:

- a Supporter Relationship;
- care authority;
- research permission;
- private Life Story access;
- or unrestricted communication authority.

### Communication Basis

The approved reason that permits a ConversationThread or Message exchange.

Representative bases include:

- Active Connection;
- active authorised Relationship;
- approved InterventionSession;
- approved moderated Community context;
- or another explicitly governed basis.

A MatchCandidate, unilateral MatchDecision or SocialPost interaction is not a CommunicationBasis.

### Conversation Thread

A governed M18 communication container linking the authorised participants, exact CommunicationBasis, current Block and permission state, Thread lifecycle and related Messages.

A ConversationThread does not create a Connection or expand the underlying CommunicationBasis.

### Message

An independently identifiable communication record within one ConversationThread.

A Message may begin as a Draft and later move through confirmation, queue, send, provider acceptance, delivery, failure or withdrawal states.

Drafting, confirming, sending and delivery are separate domain facts.

### Message Draft

A Message in Draft state that has not been authorised for delivery.

AI or another permitted helper may assist with a Message Draft.

A Message Draft is not a sent Message.

### Send Confirmation

The actor-specific, resource-specific and version-bound confirmation required before a Message leaves Draft state for delivery.

The model, recipient, provider or helper cannot confirm on behalf of the sender without separately verified authority.

### Message Delivery

The delivery lifecycle after Send Confirmation.

Representative facts include:

- Queued for Delivery;
- Sent to Provider or Transport;
- Provider Accepted;
- Delivered where supported;
- Delivery Failed;
- Cancelled;
- Expired;
- and Withdrawn where supported.

`Sent`, `Provider Accepted`, `Delivered` and `Read` are not interchangeable.

### Message Attachment

A governed file or media reference attached to one Message and subject to type, size, malware scanning, visibility, retention and reporting policy.

### Platform Public

Visible to eligible authenticated Platform users according to policy and the Participant's chosen visibility.

Platform Public is not the public Internet.

### Internet Public

Accessible outside the authenticated Platform.

Internet Public requires separate explicit Consent, publication safeguards, search-engine and caching disclosures, third-party rights review and withdrawal limitations.

### Block Record

A high-priority aggregate preventing discovery, matching, MutualAcceptance, Connection, ConversationThread creation, messaging, notification and AI Context use according to policy.

### Mute Record

A reversible preference suppressing selected content or notifications without necessarily ending a Connection or ConversationThread.

### User Report

A report about another actor's behaviour, identity, MatchCandidate, Connection or Message.

### Content Report

A report about a SocialPost, Comment, media item, PublicProfile, LifeStory reference, Message attachment or other content.

### Moderation Case

A governed case combining reports, permitted evidence, affected content or actors, reviewer assignment, decisions, actions, appeal and audit.

### Moderation Decision

A human-accountable decision to dismiss, warn, restrict, hide, remove, suspend, disconnect, ban, restore or escalate.

### Community Rule

A versioned rule applying to one CommunitySpace or the Platform-wide social environment.

## 32. Canonical Evidence Decision Outcomes


- Support
- Support with Conditions
- Insufficient Evidence
- Conflicting Evidence
- Restrict
- Do Not Proceed
- Research Required

`Provisional` and `Deferred` are workflow states. `Not Applicable` is an applicability result. `Requires Specialist Review` is a review requirement. They are not final Evidence Decision outcomes.

## 33. Prohibited or Deprecated Internal Terms

- Friendly Companion
- AI Agent Layer
- Intelligence Layer
- AI Research Assistant as a separate authority
- Patient, Subject, or Client for the canonical Participant
- Older Adult as a platform role
- Family Member as a permission
- Caregiver as an automatic access class
- Healthcare Professional as a baseline workspace
- Full Access or Shared Access
- Study as the Research Project aggregate
- Programme as the Research Project aggregate
- SafetyEventDetected
- ProtocolAmended as an in-place mutation event
- Knowledge Graph when referring to the whole Knowledge Platform
- AI Output Status as a single field combining epistemic, workflow, approval, and safety meanings
- Public as a synonym for unrestricted or Internet-public exposure
- Open Matching as automatic connection or automatic private messaging
- Family contribution as ownership of a Participant's Life Story
- Hidden compatibility or vulnerability score
- Engagement score as a Healthy Aging outcome
- AI-generated memory presented as Participant Testimony
- ActorBlocked as the canonical Block event; use BlockCreated
- ActorUnblocked as the canonical Block-revocation event; use BlockRevoked
- UserReported as the canonical report event; use UserReportSubmitted
- ContentReported as the canonical report event; use ContentReportSubmitted
- MatchCompleted as a synonym for MutualAcceptance or Connection activation
- Message sent as a synonym for Delivered

## 34. UX Alias Rule

A user-facing label may differ from the domain term only when its mapping is explicit, it does not change authority or meaning, and it remains stable within the workspace.

```text
Participant UX label: My Activities

Domain objects:
    InterventionAssignment
    InterventionSession
    InterventionComponentDelivery
```

---

# Part IV — Bounded Context Architecture

## 35. Bounded Context Overview

| Bounded Context | Classification | Primary Responsibility |
|---|---|---|
| Identity and Organisation | Supporting | User identities, Organisations, Organisation Memberships, Role Assignments, Service Accounts, identity verification, and identity resolution. |
| Participant and Preference | Supporting Core | Participant identity, minimal profile, communication preferences, accessibility preferences, corrections, and source provenance. |
| Relationship, Consent and Permission | Core Governance | Relationships, consent, delegation, supported decision-making, substitute authority, permission policy, and Policy Decisions. |
| Identity and Life Story | Core Intervention | Participant-controlled Life Story archives, items, media, contributions, sharing, export, correction, withdrawal, and digital-legacy preferences. |
| Community and Social Connection | Core Intervention | PublicProfiles, CommunitySpaces, social content, Open Matching, MutualAcceptance, Connections, ConversationThreads, Messages, blocks, reports, moderation and appeals. |
| Research Design and Governance | Core | Research Projects, Research Questions, Protocol identities, Protocol Versions, research objectives, hypotheses, approvals, and project phase. |
| Enrolment and Participation | Core | Invitation, screening, Eligibility Decisions, Enrolment, participation, withdrawal, and follow-up. |
| Intervention Portfolio | Core | Intervention identity, Intervention Versions, evidence status and direction, lifecycle maturity, configurations, and Intervention Decisions. |
| Intervention Delivery | Core | Assignments, sessions, component delivery, exposure, adaptations, fidelity, deviations, and operational pause. |
| Assessment, Observation and Outcome | Core | Assessment schedules, administrations, responses, scores, observations, Outcome Records, missingness, and invalidation. |
| Safety and Escalation | Core | Safety Signals, triage, Safety Events, safety actions, escalation, stopping-rule evaluation, and closure. |
| Evidence and Knowledge Integration | Core | Knowledge References, Evidence Reviews, Evidence Decisions, Evidence Snapshots, local gaps, and reference-change alerts. |
| AI Companion | Core where used | AI interactions, configurations, context, retrieval, tools, proposals, actions, memory, adaptation, safety signals, and evaluation. |
| Dataset and Data Quality | Core Research | Dataset Definitions, Dataset Versions, locking, transformations, de-identification, quality review, and quality issues. |
| Analysis, Interpretation and Findings | Core | Analysis Plans, Analysis Runs, outputs, Interpretation Records, and Research Findings. |
| Reporting and External Submission | Supporting | Reports, report versions, exports, Evidence Packages, External Submissions, and publication references. |
| Governance and Audit | Supporting Governance | Review Requests, Review Decisions, Approval Records, conflicts, Policy Decisions, audit, and architecture decisions. |
| Integration and Operations | Generic Supporting | External systems, identifier mappings, imports, notifications, background jobs, outbox, inbox, webhooks, and reconciliation. |

## 36. Context Dependency Direction

```text
Identity and Organisation
        ↓
Participant and Preference
        ↓
Relationship, Consent and Permission
        ├───────────────┬────────────────────┐
        ▼               ▼                    ▼
Identity and       Community and        Research Design
Life Story         Social Connection    and Governance
        ▲               ▲                    ↓
        └───────┬───────┘            Enrolment and Participation
                │                            ↓
                └────────────── Intervention Portfolio
                                             ↓
                                  Intervention Delivery
                                      ├──────┴──────┐
                                      ▼             ▼
                               Identity and     Community and
                               Life Story       Social Connection
                                      └──────┬──────┘
                                             ↓
                           Assessment, Observation and Outcome
                                             ↓
                               Dataset and Data Quality
                                             ↓
                       Analysis, Interpretation and Findings
                                             ↓
                          Reporting and External Submission
```

Evidence and Knowledge Integration, AI Companion, Safety and Escalation, Governance and Audit, and Integration and Operations are cross-cutting contexts. Identity and Life Story and Community and Social Connection are Participant-facing core intervention contexts.

## 37. No Circular Write Ownership

- Intervention Delivery does not edit consent.
- AI Companion does not edit a Research Finding.
- Reporting does not edit a locked Dataset Version.
- Evidence Integration does not edit Knowledge Platform evidence.
- Assessment does not confirm a Safety Event.
- System Administration does not bypass Participant permission.
- Cross-context workspaces compose read models but do not become write owners.
- Community and Social Connection does not read private Life Story content without an explicit item-level sharing basis.
- Publishing or referencing a Life Story Item in a Social Post does not transfer Life Story ownership.
- A MatchCandidate, MutualAcceptance, Connection, ConversationThread or Message does not automatically create a Supporter Relationship, Consent, care authority or research permission.
- Moderation may restrict content or interaction but does not confirm a Safety Event.

---

## 38. Identity and Organisation Context

### Identity and Organisation Context — Aggregate Roots

- UserAccount
- Organisation
- OrganisationMembership
- RoleAssignment
- ServiceAccount

### Identity and Organisation Context — Representative Entities

- UserIdentityLink
- IdentityVerification
- AccountRestriction
- AuthenticationEventReference
- IdentifierMergeRecord
- IdentifierSplitRecord

### Identity and Organisation Context — Representative Value Objects

- UserId
- OrganisationId
- ActorReference
- RoleCode
- Scope
- IdentityProviderSubject
- VerificationLevel
- AccountState
- MembershipState
- DateRange

### Identity and Organisation Context — Core Invariants

1. A Role Assignment requires an explicit scope.
2. Organisation Membership does not grant Participant-data access.
3. System Administrators do not receive default Participant-content access.
4. High-risk identity merges require human review.
5. Stable identifiers are not reused.
6. Service Accounts require a declared purpose and minimum scopes.
7. Authentication success does not imply domain authorisation.

### Identity and Organisation Context — Representative Commands

- CreateUserAccount
- LinkExternalIdentity
- VerifyIdentity
- CreateOrganisation
- AddOrganisationMembership
- AssignRole
- RestrictAccount
- RevokeRoleAssignment
- DisableServiceAccount
- ReviewPotentialIdentityMerge

### Identity and Organisation Context — Representative Domain Events

- UserAccountCreated
- ExternalIdentityLinked
- IdentityVerified
- OrganisationCreated
- OrganisationMembershipActivated
- OrganisationMembershipRevoked
- RoleAssigned
- RoleAssignmentRevoked
- AccountRestricted
- ServiceAccountDisabled
- IdentityMergeApproved
- IdentityMergeReversed

---

## 39. Participant and Preference Context

### Participant and Preference Context — Aggregate Roots

- Participant

### Participant and Preference Context — Representative Entities

- ParticipantProfile
- ParticipantContactMethod
- AccessibilityPreferenceRecord
- CommunicationPreferenceRecord
- LanguagePreferenceRecord
- NotificationPreferenceRecord
- ParticipantExternalIdentifier
- ParticipantProfileCorrection
- ParticipantStatusHistory

### Participant and Preference Context — Representative Value Objects

- ParticipantId
- PersonName
- PreferredName
- ContactMethod
- LanguageCode
- AccessibilityPreference
- CommunicationPreference
- NotificationPreference
- LivingContext
- SourceClassification
- VerificationState

### Participant and Preference Context — Core Invariants

1. Participant is the canonical actor, not Older Adult or Resident.
2. Profile data collection requires a defined purpose.
3. Explicit preference is preferred over inference.
4. AI inference is not stored as Participant-reported fact.
5. Sensitive profile values preserve source and verification state.
6. A Participant may exist without a platform login.
7. A Participant profile does not become organisational or family property.
8. Corrections preserve history where research interpretation requires it.

### Participant and Preference Context — Representative Commands

- RegisterParticipant
- LinkParticipantAccount
- UpdateParticipantProfile
- RecordAccessibilityPreference
- RecordCommunicationPreference
- CorrectParticipantProfile
- AddParticipantExternalIdentifier
- RestrictParticipantProfileField
- ArchiveParticipant

### Participant and Preference Context — Representative Domain Events

- ParticipantRegistered
- ParticipantAccountLinked
- ParticipantProfileUpdated
- AccessibilityPreferenceRecorded
- CommunicationPreferenceRecorded
- ParticipantProfileCorrected
- ParticipantExternalIdentifierAdded
- ParticipantArchived

---

## 40. Relationship, Consent and Permission Context

### Relationship, Consent and Permission Context — Aggregate Roots

- Relationship
- Consent
- Delegation
- SubstituteAuthority
- PolicyDecision

### Relationship, Consent and Permission Context — Representative Entities

- RelationshipVerification
- RelationshipPermission
- RelationshipRestriction
- RelationshipRevocation
- ConsentItem
- ConsentDecision
- ConsentRestriction
- ConsentEvidence
- ConsentSupportRecord
- ConsentWithdrawal
- ReConsentRequirement
- SupportedDecisionMakingRecord

### Relationship, Consent and Permission Context — Representative Value Objects

- RelationshipType
- RelationshipDirection
- ConsentScope
- PurposeOfUse
- SpecificPermission
- PermissionContext
- ResourceState
- PermissionCondition
- ActionRisk

### Relationship, Consent and Permission Context — Core Invariants

1. Deny by default.
2. Relationship is not permission.
3. Consent is not permission assignment.
4. Role is not sufficient.
5. Purpose is explicit and compatible.
6. Resource State may prohibit an otherwise valid action.
7. Revocation affects future access promptly.
8. Existence itself may be protected.
9. Field-level access may be narrower than object-level access.
10. Delegation cannot expand authority.
11. Self-approval is prohibited where separation of duties applies.
12. AI receives only the intersection of human permission and AI-specific policy.

### Relationship, Consent and Permission Context — Representative Commands

- ProposeRelationship
- VerifyRelationship
- ActivateRelationship
- RestrictRelationship
- RevokeRelationship
- PresentConsent
- RecordConsentDecision
- WithdrawConsent
- RequireReConsent
- CreateDelegation
- RevokeDelegation
- RecordSupportedDecisionMaking
- RegisterSubstituteAuthority
- EvaluatePermission

### Relationship, Consent and Permission Context — Representative Domain Events

- RelationshipProposed
- RelationshipVerified
- RelationshipActivated
- RelationshipRestricted
- RelationshipRevoked
- ConsentPresented
- ConsentDecisionRecorded
- ConsentWithdrawn
- ReConsentRequired
- DelegationCreated
- DelegationRevoked
- SupportedDecisionMakingRecorded
- SubstituteAuthorityRegistered
- PermissionAllowed
- PermissionDenied

---

## 41. Identity and Life Story Context

### Identity and Life Story Context — Purpose

Own the Participant-controlled creation, organisation, revision, attribution, sharing, export, withdrawal, and digital-legacy handling of identity-bearing Life Story content used by **INT-004 — Life Story and Personal Archive** and related interventions.

### Identity and Life Story Context — Aggregate Roots

- LifeStoryArchive
- LifeStoryItem
- LifeStoryExport
- LegacyPreference

### Identity and Life Story Context — Representative Entities

- LifeStoryMedia
- LifeStoryTimelineEntry
- LifeStoryContribution
- LifeStoryPromptResponse
- LifeStorySharingPolicy
- LifeStoryAccessGrant
- LifeStoryRevision
- StoryAttributionRecord
- SensitiveStoryTopicFlag
- LifeStoryWithdrawalRecord
- LifeStoryModerationReference

### Identity and Life Story Context — Representative Value Objects

- LifeStoryArchiveId
- LifeStoryItemId
- StoryTheme
- LifePeriod
- MediaType
- ParticipantTestimony
- Attribution
- ContributionRole
- VisibilityScope
- AudienceDefinition
- DownloadPermission
- ResharingPermission
- QuotationPermission
- ContributionPermission
- ReusePermission
- LegacyAccessInstruction
- StorySensitivity
- PublicDisclosureWarning

### Identity and Life Story Context — Core Invariants

1. The Participant controls the Life Story Archive and each Life Story Item unless a separately verified legal authority applies.
2. A Supporter or community contribution does not transfer ownership.
3. Every contribution preserves contributor identity, source, time, and Participant disposition.
4. Participant Testimony is not represented as externally verified historical fact unless a separate verification record exists.
5. Life Story Item lifecycle state is separate from visibility.
6. Private is the default visibility.
7. Platform Public and Internet Public are separate scopes.
8. Internet Public requires separate explicit consent and disclosure of indexing, copying, caching, and withdrawal limitations.
9. Public sharing does not imply download, quotation, re-sharing, training, or secondary-research permission.
10. A Social Post may reference or quote a Life Story Item only within the item's current sharing and reuse policy.
11. Revocation stops future platform access and distribution according to policy while preserving required audit and governed research lineage.
12. Legacy Preference is explicit, versioned, revocable while the Participant can decide, and never inferred from family relationship.
13. AI may transcribe, translate, organise, suggest prompts, or draft but may not invent a memory, speaker, event, date, relationship, or emotional meaning.
14. AI-generated wording remains a Draft until the Participant or authorised human confirms it.
15. Sensitive topics support warning, skip, pause, help, restricted audience, and Safety Signal escalation.
16. Moderation restriction preserves the original record, decision, rationale, appeal, and Participant-visible status where appropriate.
17. Deleting or hiding an item does not silently alter an approved historical Dataset Version or Research Finding.
18. Export requires explicit scope, purpose, recipient, format, disclosure rules, and current permission.
19. Posthumous access does not automatically pass to family, Supporters, Organisations, or the platform.
20. Life Story activity metrics are not interpreted as identity, wellbeing, or relationship outcomes without an approved measurement model.

### Identity and Life Story Context — Representative Commands

- CreateLifeStoryArchive
- CreateLifeStoryItem
- AddLifeStoryMedia
- ProposeLifeStoryContribution
- AcceptLifeStoryContribution
- RejectLifeStoryContribution
- ReviseLifeStoryItem
- ConfirmParticipantTestimony
- SetLifeStoryVisibility
- GrantLifeStoryAccess
- RevokeLifeStoryAccess
- PublishLifeStoryItemToCommunity
- PublishLifeStoryItemToPlatformPublic
- PublishLifeStoryItemToInternetPublic
- HideLifeStoryItem
- WithdrawLifeStoryItem
- RestoreLifeStoryItem
- RequestLifeStoryExport
- CompleteLifeStoryExport
- RecordLegacyPreference
- RevokeLegacyPreference
- FlagSensitiveStoryTopic
- RestrictLifeStoryItemForModeration
- RestoreLifeStoryItemAfterReview

### Identity and Life Story Context — Representative Domain Events

- LifeStoryArchiveCreated
- LifeStoryItemCreated
- LifeStoryMediaAdded
- LifeStoryContributionProposed
- LifeStoryContributionAccepted
- LifeStoryContributionRejected
- LifeStoryItemRevised
- ParticipantTestimonyConfirmed
- LifeStoryVisibilityChanged
- LifeStoryAccessGranted
- LifeStoryAccessRevoked
- LifeStoryItemPublishedToCommunity
- LifeStoryItemPublishedToPlatformPublic
- LifeStoryItemPublishedToInternetPublic
- LifeStoryItemHidden
- LifeStoryItemWithdrawn
- LifeStoryItemRestored
- LifeStoryExportRequested
- LifeStoryExportCompleted
- LegacyPreferenceRecorded
- LegacyPreferenceRevoked
- SensitiveStoryTopicFlagged
- LifeStoryItemRestrictedForModeration
- LifeStoryItemRestoredAfterReview

---

## 42. Community and Social Connection Context

### Community and Social Connection Context — Purpose

Own governed Community participation, PublicProfiles, social content, opt-in Open Matching, MutualAcceptance, Connections, ConversationThreads, Messages, blocking, reporting, moderation and appeals used to facilitate meaningful human connection.

### Community and Social Connection Context — Aggregate Roots

- PublicProfile
- CommunitySpace
- CommunityMembership
- SocialPost
- ConnectionRequest — Deferred Alternative Connection Basis
- MatchPreference
- MatchCandidate
- MutualAcceptance
- Connection
- ConversationThread
- Message
- BlockRecord
- ModerationCase

### Community and Social Connection Context — Representative Entities

- Comment
- Reaction
- FollowRecord
- SubscriptionRecord
- MatchAvailability
- MatchExplanation
- MatchDecision
- MatchIntroduction
- MutualAcceptanceDecisionReference
- ThreadParticipant
- MessageRevision
- MessageAttachment
- MessageDeliveryAttempt
- MessageReceipt
- MuteRecord
- UserReport
- ContentReport
- ModerationDecision
- ModerationAction
- ModerationAppeal
- CommunityRule
- CommunityRuleVersion
- SocialContentRevision
- SocialContentVisibilityRecord

### Community and Social Connection Context — Representative Value Objects

- PublicProfileId
- CommunitySpaceId
- CommunityMembershipId
- SocialPostId
- ConnectionRequestId
- MatchPreferenceId
- MatchCandidateId
- MatchDecisionId
- MutualAcceptanceId
- ConnectionId
- ConversationThreadId
- MessageId
- BlockRecordId
- ModerationCaseId
- VisibilityScope
- AudienceDefinition
- CommunityScope
- CommunityEligibility
- DeclaredInterest
- MatchingGoal
- CommunicationMode
- AvailabilityWindow
- LocationBoundary
- DistancePreference
- LanguagePreference
- InteractionPreference
- ExclusionPreference
- SensitiveAttributeUseRule
- MatchReason
- MatchScoreComponent
- MatchDecisionType
- MutualAcceptanceBasis
- MutualAcceptanceState
- ConnectionBasis
- ConnectionState
- CommunicationBasis
- ConversationThreadState
- MessageContent
- MessageLifecycleState
- MessageDeliveryState
- MessageRecipientSet
- AttachmentPolicy
- DeliveryProviderReference
- DeliveryFailureReason
- ReportCategory
- ModerationActionType
- ModerationSeverity
- AppealOutcome
- DiscoveryPolicy
- RankingObjective

### Community and Social Connection Context — Core Invariants

1. A PublicProfile contains only Participant-selected or separately authorised fields.
2. Protected ParticipantProfile, research, Consent, assessment, Safety and Life Story data are not PublicProfile data by default.
3. Platform Public is distinct from Internet Public.
4. Internet Public requires a separate explicit publication flow.
5. Social content has an explicit audience and Visibility at creation.
6. Public Visibility does not imply unrestricted reuse, download, quotation, model training or secondary research.
7. Open Matching is inactive by default, opt-in and purpose-specific.
8. MatchCandidates use declared or separately authorised attributes only.
9. Sensitive traits are not inferred or used for matching without explicit approved Consent, evidence, privacy review and Protocol authority.
10. Every MatchCandidate provides a meaningful MatchExplanation of the principal matching basis.
11. A MatchCandidate is not a MatchDecision, MutualAcceptance, Connection or CommunicationBasis.
12. Each MatchDecision is recorded independently for one deciding actor and exact MatchCandidate version.
13. A MatchDecision cannot be inferred from profile views, Community activity, AI confidence or another actor's action.
14. MutualAcceptance is an independently identifiable aggregate.
15. MutualAcceptance is created only from either:
    - two compatible current independent MatchDecisions; or
    - one accepted ConnectionRequest under a separately approved direct-request policy.
16. MutualAcceptance records exact source decision or request references, actors, purpose, policy version, evaluation time and effective period.
17. MutualAcceptance requires current eligibility, Consent, account state, no applicable Block, non-expired source records and all current policy checks.
18. MutualAcceptance may be invalidated or expired before Connection activation.
19. One MutualAcceptance record may activate at most one Connection unless a separately approved policy explicitly permits another use.
20. ConnectionRequest is not part of Open Matching.
21. ConnectionRequest is feature-disabled for the first Pilot.
22. Accepting a ConnectionRequest creates MutualAcceptance; it does not bypass MutualAcceptance.
23. A Connection is activated only from one valid MutualAcceptance record.
24. A Connection does not automatically become a Supporter Relationship, care authority, research permission, private Life Story access or unrestricted communication authority.
25. A ConversationThread requires one current approved CommunicationBasis.
26. A CommunicationBasis may reference an active Connection, an authorised Relationship, an approved InterventionSession, a moderated Community context or another explicitly governed basis.
27. A unilateral MatchDecision, MatchCandidate, SocialPost interaction or expired MutualAcceptance is not a CommunicationBasis.
28. A ConversationThread records exact participants and cannot silently add another actor.
29. A ConversationThread does not create or broaden the underlying Connection, Relationship, Consent or purpose.
30. Message is an independently identifiable aggregate within one ConversationThread.
31. Message Draft creation and revision do not send the Message.
32. Send Confirmation is actor-specific, Message-version-specific, recipient-specific and short-lived where required.
33. AI, a provider, recipient or helper cannot confirm a Message send for the sender without separately verified authority.
34. A Message may enter delivery only after current Permission, CommunicationBasis, Block, ResourceState, attachment and policy evaluation.
35. `Queued`, `Sent`, `Provider Accepted`, `Delivered`, `Read`, `Failed`, `Cancelled`, `Expired` and `Withdrawn` remain separate states.
36. A provider callback may update delivery state only through an authenticated, idempotent and mapped provider reference.
37. Provider state is not the system of record and cannot alter Message content or sender authority.
38. A failed or unknown delivery does not become Delivered.
39. Message retries preserve one logical Message and separate DeliveryAttempts unless the sender creates a new Message.
40. Message attachments require approved type, size, malware scan, storage, access and retention policy.
41. Message content is excluded by default from general Search, general Vector retrieval, MatchCandidate generation, Community ranking, AIMemoryItem and ordinary research analysis.
42. Any Message-content analysis requires explicit Consent, Purpose, DatasetDefinition, minimisation and governance.
43. A BlockRecord overrides discovery, matching, MutualAcceptance creation, Connection activation, ConversationThread creation, Message send, interaction, follow, notification and AI Context according to policy.
44. A Block created after a Message is queued triggers cancellation or suppression where technically possible and records any external-delivery limitation.
45. A Participant can dismiss, pause, mute, Block, Report, disconnect and opt out of matching.
46. Reporting remains available after blocking or disconnection.
47. Mute, Disconnect and Block are separate actions with separate effects.
48. Removing a Block does not automatically reactivate matching, MutualAcceptance, Connection or ConversationThread.
49. ModerationDecisions affecting content or account access are human-accountable at the approved action-risk level.
50. AI may triage reports or suggest moderation actions but may not autonomously impose a high-impact ban or decide a SafetyEvent.
51. Moderation preserves report, permitted evidence, reviewer, rationale, action, affected content, appeal and restoration history.
52. CommunityRules are versioned and visible.
53. Ranking must not optimise only for time, reactions, controversy, emotional dependency or compulsive return.
54. Matching and ranking should prioritise the approved intervention and research purpose, Safety, diversity, accessibility, fairness and Participant control.
55. Harassment, discrimination, impersonation, fraud, coercion, exploitation, privacy violation and unwanted contact are reportable categories.
56. SocialPosts referencing LifeStoryItems remain subject to the source item's sharing and reuse policy.
57. Deleting or removing a SocialPost or Message does not silently rewrite an approved locked DatasetVersion or ResearchFinding.
58. Follower, reaction, post, candidate, Connection, Message or session counts are process measures, not Healthy Aging outcomes by themselves.
59. Eligibility for Community, matching or messaging is defined by policy and Protocol where research participation is involved.
60. Minor participation, vulnerable-group access or Internet Public participation requires separately approved safeguards.
61. Anonymous or pseudonymous participation, where allowed, does not remove accountability or moderation traceability.
62. A Moderator does not receive unrestricted access to unrelated Participant, Message, Safety or research records.

### Community and Social Connection Context — Representative Commands

#### PublicProfile and Community

- CreatePublicProfile
- UpdatePublicProfile
- PublishPublicProfile
- UnpublishPublicProfile
- SetPublicProfileVisibility
- CreateCommunitySpace
- PublishCommunityRuleVersion
- JoinCommunitySpace
- LeaveCommunitySpace
- SuspendCommunityMembership

#### Social Content

- CreateSocialPostDraft
- ReviseSocialPost
- PublishSocialPost
- ChangeSocialPostVisibility
- WithdrawSocialPost
- DeleteSocialPost
- AddComment
- ReviseComment
- WithdrawComment
- AddReaction
- RemoveReaction
- FollowActor
- UnfollowActor

#### Deferred Direct Connection Request

- CreateConnectionRequest
- AcceptConnectionRequest
- DeclineConnectionRequest
- CancelConnectionRequest
- ExpireConnectionRequest

These commands remain feature-disabled for the first Pilot.

#### Open Matching and MutualAcceptance

- CreateMatchPreference
- ActivateOpenMatching
- PauseOpenMatching
- ExpireMatchPreference
- RequestMatchCandidateGeneration
- GenerateMatchCandidate
- ExpireMatchCandidate
- RecordMatchDecision
- EvaluateMutualAcceptance
- RecordMutualAcceptance
- ExpireMutualAcceptance
- InvalidateMutualAcceptance
- CreateMatchIntroduction

#### Connection

- ActivateConnection
- PauseConnection
- ResumeConnection
- DisconnectConnection

#### ConversationThread and Message

- CreateConversationThread
- PauseConversationThread
- CloseConversationThread
- CreateMessageDraft
- ReviseMessageDraft
- AddMessageAttachment
- RemoveMessageAttachment
- ConfirmMessageSend
- QueueMessageForDelivery
- RecordMessageSent
- RecordMessageProviderAccepted
- RecordMessageDelivered
- RecordMessageRead
- RecordMessageDeliveryFailure
- CancelMessageDelivery
- WithdrawMessage

#### Safety and Moderation Controls

- CreateBlock
- RevokeBlock
- CreateMute
- RemoveMute
- SubmitUserReport
- SubmitContentReport
- CreateModerationCase
- AssignModerationCase
- TriageModerationCase
- RecordModerationDecision
- ApplyModerationAction
- LinkModerationCaseToSafetySignal
- CloseModerationCase
- SubmitModerationAppeal
- RecordAppealDecision
- RestoreSocialContent

### Community and Social Connection Context — Representative Domain Events

#### PublicProfile and Community

- PublicProfileCreated
- PublicProfileUpdated
- PublicProfilePublished
- PublicProfileUnpublished
- PublicProfileVisibilityChanged
- CommunitySpaceCreated
- CommunityRuleVersionPublished
- CommunityMembershipActivated
- CommunityMembershipEnded
- CommunityMembershipSuspended

#### Social Content

- SocialPostDrafted
- SocialPostRevised
- SocialPostPublished
- SocialPostVisibilityChanged
- SocialPostWithdrawn
- SocialPostDeleted
- CommentCreated
- CommentUpdated
- CommentWithdrawn
- ReactionRecorded
- ReactionRemoved
- ActorFollowed
- ActorUnfollowed

#### Deferred Direct Connection Request

- ConnectionRequestCreated
- ConnectionRequestAccepted
- ConnectionRequestDeclined
- ConnectionRequestCancelled
- ConnectionRequestExpired

#### Open Matching and MutualAcceptance

- MatchPreferenceCreated
- MatchPreferenceActivated
- MatchPreferencePaused
- MatchPreferenceExpired
- MatchCandidateGenerationRequested
- MatchCandidateGenerated
- MatchCandidateExpired
- MatchDecisionRecorded
- MutualAcceptanceRecorded
- MutualAcceptanceExpired
- MutualAcceptanceInvalidated
- MatchIntroductionCreated

#### Connection

- ConnectionActivated
- ConnectionPaused
- ConnectionResumed
- ConnectionDisconnected

#### ConversationThread and Message

- ConversationThreadCreated
- ConversationThreadPaused
- ConversationThreadClosed
- MessageDraftCreated
- MessageDraftRevised
- MessageAttachmentAdded
- MessageAttachmentRemoved
- MessageSendConfirmed
- MessageQueued
- MessageSent
- MessageProviderAccepted
- MessageDelivered
- MessageRead
- MessageDeliveryFailed
- MessageDeliveryCancelled
- MessageWithdrawn

#### Blocking, Reporting and Moderation

- MuteCreated
- MuteRemoved
- BlockCreated
- BlockRevoked
- UserReportSubmitted
- ContentReportSubmitted
- ModerationCaseCreated
- ModerationCaseAssigned
- ModerationCaseTriaged
- ModerationDecisionRecorded
- ModerationActionRecorded
- ModerationCaseLinkedToSafetySignal
- ModerationCaseClosed
- AppealSubmitted
- AppealDecisionRecorded
- SocialContentRestored

---

## 43. Research Design and Governance Context


### Research Design and Governance Context — Aggregate Roots

- ResearchProject
- ResearchQuestion
- Protocol
- ProtocolVersion

### Research Design and Governance Context — Representative Entities

- ResearchObjective
- Hypothesis
- PopulationDefinition
- EligibilityCriterion
- AssignmentMethod
- MeasurementScheduleDefinition
- OutcomeSelection
- SafetyMonitoringDefinition
- StoppingRule
- ProtocolSection
- ProtocolAmendmentRecord
- ProjectPhaseHistory

### Research Design and Governance Context — Representative Value Objects

- ResearchProjectPhase
- StudyDesign
- PopulationDefinition
- EligibilityCriterion
- VersionReference
- ReviewDecision

### Research Design and Governance Context — Core Invariants

1. An Active Research Project requires an Approved or Active Protocol Version.
2. Approved Protocol Versions are immutable.
3. A material amendment creates a new Protocol Version.
4. A Protocol Version identifies consent requirements, Intervention Configurations, measurement, data, and safety requirements.
5. A Research Question cannot be silently rewritten after approval.
6. Research approval and external ethics or governance approval remain distinguishable records.
7. AI may draft but not approve Protocol content.

### Research Design and Governance Context — Representative Commands

- CreateResearchProject
- SubmitResearchProjectForReview
- ApproveResearchProject
- ActivateResearchProject
- SuspendResearchProject
- CompleteResearchProject
- CreateResearchQuestion
- ApproveResearchQuestion
- CreateProtocol
- DraftProtocolVersion
- SubmitProtocolVersionForReview
- ApproveProtocolVersion
- ActivateProtocolVersion
- SupersedeProtocolVersion

### Research Design and Governance Context — Representative Domain Events

- ResearchProjectCreated
- ResearchProjectSubmittedForReview
- ResearchProjectApproved
- ResearchProjectActivated
- ResearchProjectSuspended
- ResearchProjectCompleted
- ResearchQuestionCreated
- ResearchQuestionApproved
- ProtocolCreated
- ProtocolVersionDrafted
- ProtocolVersionSubmittedForReview
- ProtocolVersionApproved
- ProtocolVersionActivated
- ProtocolVersionSuperseded

---

## 44. Enrolment and Participation Context

### Enrolment and Participation Context — Aggregate Roots

- ScreeningRecord
- EligibilityDecision
- Enrolment

### Enrolment and Participation Context — Representative Entities

- RecruitmentInvitation
- WithdrawalRecord
- FollowUpStatusRecord
- EnrolmentStatusHistory

### Enrolment and Participation Context — Representative Value Objects

- EligibilityOutcome
- EnrolmentState
- WithdrawalScope
- BaselineReadiness
- CohortReference

### Enrolment and Participation Context — Core Invariants

1. Enrolment requires an approved Protocol Version.
2. Enrolment requires compatible effective consent.
3. Eligibility is linked to the evaluated Protocol Version.
4. Enrolment cannot silently move to another Protocol Version.
5. Withdrawal remains available according to Protocol and consent.
6. Paused participation is not withdrawal.
7. Supporter assistance does not change who made the decision.
8. AI may assist screening but does not make final eligibility or enrolment decisions.

### Enrolment and Participation Context — Representative Commands

- InviteParticipant
- StartScreening
- CompleteScreening
- RecordEligibilityDecision
- StartConsentProcess
- EnrolParticipant
- ActivateEnrolment
- PauseEnrolment
- ResumeEnrolment
- CompleteEnrolment
- WithdrawParticipant
- DiscontinueEnrolment

### Enrolment and Participation Context — Representative Domain Events

- ParticipantInvited
- ScreeningStarted
- ScreeningCompleted
- EligibilityDecisionRecorded
- ConsentProcessStarted
- ParticipantEnrolled
- EnrolmentActivated
- EnrolmentPaused
- EnrolmentResumed
- ParticipantWithdrawn
- EnrolmentDiscontinued
- EnrolmentCompleted

---

## 45. Intervention Portfolio Context

### Intervention Portfolio Context — Aggregate Roots

- Intervention
- InterventionVersion
- InterventionConfiguration
- InterventionDecision

### Intervention Portfolio Context — Representative Entities

- InterventionComponentDefinition
- MechanismLink
- OutcomeLink
- SafeguardDefinition
- AdaptationRangeDefinition
- InterventionDependency
- InterventionEvidenceAssessment

### Intervention Portfolio Context — Representative Value Objects

- InterventionDomain
- InterventionDose
- DeliveryMode
- EvidenceStatus
- EvidenceDirection
- InterventionDecisionType
- FidelityRequirement

### Intervention Portfolio Context — Core Invariants

1. Stable Intervention identity is separate from versions.
2. Material change requires a new Intervention Version.
3. Approved versions are immutable.
4. Evidence status and evidence direction are separate.
5. An Intervention Decision requires human approval.
6. AI does not approve evidence status or Intervention Decisions.
7. An Intervention Configuration references exact versions.
8. Ability adaptation cannot silently change intervention meaning.
9. Suspended Intervention Versions cannot receive new assignments.
10. Historical versions and decisions remain traceable.

### Intervention Portfolio Context — Representative Commands

- CreateIntervention
- DraftInterventionVersion
- SubmitInterventionVersionForReview
- ApproveInterventionVersion
- ActivateInterventionVersion
- SuspendInterventionVersion
- SupersedeInterventionVersion
- AssignInterventionEvidenceStatus
- CreateInterventionConfiguration
- ApproveInterventionConfiguration

### Intervention Portfolio Context — Representative Domain Events

- InterventionCreated
- InterventionVersionDrafted
- InterventionVersionSubmittedForReview
- InterventionVersionApproved
- InterventionVersionActivated
- InterventionVersionSuspended
- InterventionVersionSuperseded
- InterventionEvidenceStatusAssigned
- InterventionEvidenceDirectionRecorded
- InterventionConfigurationCreated
- InterventionDecisionRecorded

---

## 46. Intervention Delivery Context

### Intervention Delivery Context — Aggregate Roots

- InterventionAssignment
- InterventionSession

### Intervention Delivery Context — Representative Entities

- InterventionComponentDelivery
- ExposureRecord
- FidelityRecord
- InterventionAdaptationRecord
- DeliveryDeviationRecord
- AssignmentStatusHistory

### Intervention Delivery Context — Representative Value Objects

- AssignmentState
- ComponentDeliveryState
- ExposureAmount
- DeliveryMode
- AdaptationType
- DeviationSeverity

### Intervention Delivery Context — Core Invariants

1. Assignment references exact Protocol and Intervention Configuration versions.
2. Consent is checked before sensitive delivery.
3. Relationship permission is checked before Supporter involvement.
4. Message drafting and sending are separate actions.
5. Delivery records preserve actual rather than intended exposure.
6. Adaptations remain within approved range.
7. A delivery deviation cannot be hidden by marking a session complete.
8. Intervention Delivery does not determine scientific effectiveness.
9. AI-assisted delivery requires an active approved AI configuration.
10. Withdrawal or permission revocation stops future affected actions.

### Intervention Delivery Context — Representative Commands

- AssignIntervention
- ActivateInterventionAssignment
- PauseInterventionAssignment
- ResumeInterventionAssignment
- ScheduleInterventionSession
- StartInterventionSession
- RecordComponentDelivery
- RecordExposure
- RecordFidelity
- RecordDeliveryDeviation
- CompleteInterventionSession
- CompleteInterventionAssignment

### Intervention Delivery Context — Representative Domain Events

- InterventionAssigned
- InterventionAssignmentActivated
- InterventionAssignmentPaused
- InterventionAssignmentResumed
- InterventionSessionScheduled
- InterventionSessionStarted
- InterventionComponentOffered
- InterventionComponentReceived
- InterventionComponentCompleted
- InterventionExposureRecorded
- FidelityRecorded
- DeliveryDeviationRecorded
- InterventionSessionCompleted

---

## 47. Assessment, Observation and Outcome Context

### Assessment, Observation and Outcome Context — Aggregate Roots

- AssessmentSchedule
- AssessmentRecord
- Observation
- OutcomeRecord

### Assessment, Observation and Outcome Context — Representative Entities

- AssessmentResponse
- AssessmentScore
- AssessmentAssistance
- AssessmentInvalidation
- ObservationCorrection
- OutcomeQualityFlag

### Assessment, Observation and Outcome Context — Representative Value Objects

- InstrumentVersionReference
- MeasurementValue
- Unit
- Timepoint
- AdministrationMode
- AssistanceType
- MissingDataReason
- QualityFlag

### Assessment, Observation and Outcome Context — Core Invariants

1. Assessment references an exact instrument version.
2. Scoring preserves algorithm version.
3. Source and authorship are explicit.
4. Accessible adaptation is recorded.
5. Material measurement change may affect comparability.
6. Missingness reason is explicit where known.
7. Observation is not automatically an Outcome Record.
8. Outcome interpretation is not stored as raw observation.
9. Invalidated records remain historically traceable.
10. AI may capture or transcribe but does not falsify Participant response.

### Assessment, Observation and Outcome Context — Representative Commands

- ScheduleAssessment
- StartAssessment
- RecordAssessmentResponse
- RecordAssessmentAssistance
- CompleteAssessment
- InvalidateAssessment
- RecordObservation
- CorrectObservation
- RecordOutcome
- FlagOutcomeQuality

### Assessment, Observation and Outcome Context — Representative Domain Events

- AssessmentScheduled
- AssessmentStarted
- AssessmentResponseRecorded
- AssessmentAssistanceRecorded
- AssessmentCompleted
- AssessmentInvalidated
- ObservationRecorded
- ObservationCorrected
- OutcomeRecorded
- OutcomeQualityFlagged

---

## 48. Safety and Escalation Context

### Safety and Escalation Context — Aggregate Roots

- SafetySignal
- SafetyEvent

### Safety and Escalation Context — Representative Entities

- SafetyAction
- SafetyEscalation
- SafetyReview
- StoppingRuleEvaluation
- SafetyStatusHistory

### Safety and Escalation Context — Representative Value Objects

- SafetySignalSource
- SafetySeverity
- Seriousness
- Expectedness
- Relatedness
- TriageDecision

### Safety and Escalation Context — Core Invariants

1. AI or automation creates a Safety Signal, not a confirmed Safety Event.
2. Safety Event confirmation requires authorised human review.
3. Safety records preserve source and uncertainty.
4. Safety review is distinct from clinical diagnosis.
5. Safety action authority is explicit.
6. Closing a Safety Signal requires rationale.
7. Serious unresolved signals may block intervention delivery.
8. Safety data access is restricted.
9. Project pause and Participant pause are distinct.
10. A technical incident is not automatically Participant harm.

### Safety and Escalation Context — Representative Commands

- RecordSafetySignal
- TriageSafetySignal
- EscalateSafetySignal
- CloseSafetySignalAsNotEvent
- CreateSafetyEvent
- ReviewSafetyEvent
- RecordSafetyAction
- PauseInterventionForSafety
- RecommendProjectPause
- EvaluateStoppingRule
- ResolveSafetyEvent
- CloseSafetyEvent

### Safety and Escalation Context — Representative Domain Events

- SafetySignalRecorded
- SafetySignalTriaged
- SafetySignalEscalated
- SafetySignalClosedAsNotEvent
- SafetyEventCreated
- SafetyEventReviewStarted
- SafetyActionRecorded
- InterventionPausedForSafety
- ProjectPauseRecommended
- StoppingRuleEvaluated
- SafetyEventResolved
- SafetyEventClosed

---

## 49. Evidence and Knowledge Integration Context

### Evidence and Knowledge Integration Context — Aggregate Roots

- KnowledgeReference
- EvidenceReview
- EvidenceDecision
- EvidenceSnapshot
- ResearchKnowledgeGap
- ReferenceChangeAlert

### Evidence and Knowledge Integration Context — Representative Entities

- EvidenceSearch
- EvidenceAppraisal
- CitationRecord
- ApplicabilityAssessment
- EvidencePackageReference
- KnowledgeGapExternalSubmission

### Evidence and Knowledge Integration Context — Representative Value Objects

- ExternalIdentifier
- RetrievalContext
- ProvenanceRecord
- DirectnessAssessment
- EvidenceClassification
- VerificationState
- ReviewTrigger
- ChangeImpact

### Evidence and Knowledge Integration Context — Core Invariants

1. Knowledge Platform resources remain externally authoritative.
2. Every Knowledge Reference preserves identifier and provenance.
3. Evidence Decision is human-accountable.
4. Evidence Decision outcome uses the canonical vocabulary.
5. Evidence Snapshot is immutable and is an entity.
6. New external evidence triggers review, not silent mutation.
7. Research Knowledge Gap is distinguishable from external Knowledge Gap.
8. Null, conflicting, harmful, and insufficient evidence remain visible.
9. AI may draft but not approve an Evidence Decision.
10. External publication does not rewrite historical Research Findings.

### Evidence and Knowledge Integration Context — Representative Commands

- CreateEvidenceReview
- AddKnowledgeReference
- ResolveKnowledgeReference
- AppraiseEvidence
- SubmitEvidenceReview
- RecordEvidenceDecision
- ApproveEvidenceDecision
- CreateEvidenceSnapshot
- DetectExternalReferenceChange
- CreateReferenceChangeAlert
- IdentifyResearchKnowledgeGap
- PrioritiseResearchKnowledgeGap
- SubmitKnowledgeGapExternally

### Evidence and Knowledge Integration Context — Representative Domain Events

- EvidenceReviewCreated
- KnowledgeReferenceAttached
- KnowledgeReferenceResolved
- EvidenceReviewSubmitted
- EvidenceReviewApproved
- EvidenceDecisionRecorded
- EvidenceDecisionApproved
- EvidenceSnapshotCreated
- ExternalEvidenceChangeDetected
- ReferenceChangeAlertCreated
- EvidenceReReviewRequired
- ResearchKnowledgeGapIdentified
- ResearchKnowledgeGapPrioritised

---

## 50. AI Companion Context

### AI Companion Context — Aggregate Roots

- AIConversation
- AIInteraction
- AIInterventionConfiguration
- AIInterventionConfigurationVersion
- AIMemoryItem

### AI Companion Context — Representative Entities

- AIRequest
- AIResponse
- AIContextRecord
- AIRetrievalRecord
- AIToolInvocation
- AIActionProposal
- AIActionRecord
- AIReviewRecord
- AIAdaptationRecord
- AIEvaluationRecord
- AIIncident

### AI Companion Context — Representative Value Objects

- AIMode
- AIPurpose
- ModelReference
- InstructionVersion
- ToolPermission
- EpistemicType
- AIArtefactType
- AIReviewStatus
- AIApprovalStatus
- AISafetyClassification
- ActionLevel
- MemoryPolicy
- DegradedMode

### AI Companion Context — Core Invariants

1. AI identity remains explicit.
2. Permission is evaluated before context assembly.
3. Context uses minimum necessary data.
4. AI cannot directly mutate another aggregate.
5. Domain change occurs through an approved command or tool.
6. High-impact action requires confirmation or human review.
7. AI output provenance is preserved.
8. Model, instruction, retrieval, tool, and policy versions are recorded.
9. AI failure cannot break core non-AI workflow.
10. AI memory is visible and purpose-bound where applicable.
11. AI cannot approve governed artefacts.
12. AI cannot impersonate a human relationship.
13. AI detection creates a Safety Signal.
14. Silent model substitution is prohibited for governed intervention use.
15. AI interaction volume is not a Healthy Aging outcome.

### AI Companion Context — Representative Commands

- StartAIConversation
- RequestAIInteraction
- EvaluateAIPermission
- AssembleAIContext
- RetrieveAIKnowledge
- GenerateAIOutput
- ValidateAIOutput
- ProposeAIAction
- ConfirmAIAction
- ExecuteAIAction
- RequestAIHumanReview
- StoreAIMemoryItem
- ApplyAIAdaptation
- RaiseAISafetySignal
- ApproveAIConfigurationVersion

### AI Companion Context — Representative Domain Events

- AIConversationStarted
- AIInteractionRequested
- AIPermissionAllowed
- AIPermissionDenied
- AIContextAssembled
- AIRetrievalCompleted
- AIOutputGenerated
- AIOutputValidationFailed
- AIActionProposed
- AIActionConfirmed
- AIActionExecuted
- AIHumanReviewRequested
- AIOutputReviewed
- AIMemoryItemStored
- AIAdaptationApplied
- AISafetySignalRaised
- AIConfigurationVersionApproved

---

## 51. Dataset and Data Quality Context

### Dataset and Data Quality Context — Aggregate Roots

- DatasetDefinition
- DatasetVersion
- DataQualityIssue
- TransformationRun

### Dataset and Data Quality Context — Representative Entities

- DatasetLock
- DatasetManifest
- VariableDefinition
- DeIdentificationRecord
- CorrectionRecord
- ImputationRecord

### Dataset and Data Quality Context — Representative Value Objects

- DataClassification
- QualityFlag
- DeIdentificationState
- Checksum
- TransformationReference
- RetentionRule
- ImputationMethod

### Dataset and Data Quality Context — Core Invariants

1. Dataset Definition is approved before governed generation.
2. Dataset Version preserves exact source lineage.
3. Locked Dataset Version is immutable.
4. Correction after lock creates a new Dataset Version.
5. Analysis references an exact locked Dataset Version.
6. Quality issues remain traceable.
7. De-identification does not create unrestricted public data.
8. Consent and purpose are checked at generation and use.
9. AI may assist quality review but cannot lock the dataset.
10. Missingness and imputation are explicit.

### Dataset and Data Quality Context — Representative Commands

- CreateDatasetDefinition
- ApproveDatasetDefinition
- GenerateDatasetVersion
- RecordDataQualityIssue
- ResolveDataQualityIssue
- CompleteDatasetQualityReview
- LockDatasetVersion
- SupersedeDatasetVersion
- RunTransformation
- DeIdentifyDataset

### Dataset and Data Quality Context — Representative Domain Events

- DatasetDefinitionCreated
- DatasetDefinitionApproved
- DatasetVersionGenerated
- DataQualityIssueRecorded
- DataQualityIssueResolved
- DatasetQualityReviewCompleted
- DatasetVersionLocked
- DatasetVersionSuperseded
- TransformationRunCompleted
- DatasetDeIdentified

---

## 52. Analysis, Interpretation and Findings Context

### Analysis, Interpretation and Findings Context — Aggregate Roots

- AnalysisPlan
- AnalysisRun
- InterpretationRecord
- ResearchFinding

### Analysis, Interpretation and Findings Context — Representative Entities

- AnalysisOutput
- AnalysisDiagnostic
- QualitativeSynthesis
- SensitivityAnalysis
- FindingLimitation

### Analysis, Interpretation and Findings Context — Representative Value Objects

- AnalysisPopulation
- FindingType
- ScientificDirection
- GeneralisabilityStatement
- UncertaintyStatement

### Analysis, Interpretation and Findings Context — Core Invariants

1. Analysis Plan is approved before governed analysis.
2. Analysis Run references a locked Dataset Version.
3. Analysis Output is not a Research Finding.
4. Interpretation is human-accountable.
5. Research Finding is linked to exact versions and lineage.
6. Null, negative, harmful, mixed, and failed findings remain visible.
7. AI may draft but not approve interpretation or findings.
8. External publication does not change the historical Research Finding.
9. Superseded findings remain traceable.
10. Approved Research Findings may become inputs to an Intervention Decision owned by the Intervention Portfolio Context.

### Analysis, Interpretation and Findings Context — Representative Commands

- CreateAnalysisPlan
- SubmitAnalysisPlanForReview
- ApproveAnalysisPlan
- ExecuteAnalysisPlan
- RecordAnalysisOutput
- DraftInterpretation
- ApproveInterpretation
- DraftResearchFinding
- SubmitResearchFindingForReview
- ApproveResearchFinding
- RejectResearchFinding
- SupersedeResearchFinding

### Analysis, Interpretation and Findings Context — Representative Domain Events

- AnalysisPlanCreated
- AnalysisPlanSubmittedForReview
- AnalysisPlanApproved
- AnalysisRunStarted
- AnalysisRunCompleted
- AnalysisOutputRecorded
- InterpretationDrafted
- InterpretationApproved
- ResearchFindingDrafted
- ResearchFindingSubmittedForReview
- ResearchFindingApproved
- ResearchFindingRejected
- ResearchFindingSuperseded

---

## 53. Reporting and External Submission Context

### Reporting and External Submission Context — Aggregate Roots

- Report
- ReportVersion
- ExportRequest
- ExternalSubmission

### Reporting and External Submission Context — Representative Entities

- ParticipantSummary
- EvidencePackage
- ExportFile
- ExternalSubmissionResponse
- ExternalPublicationReference

### Reporting and External Submission Context — Representative Value Objects

- ReportPurpose
- Audience
- Recipient
- DisclosureRule
- SubmissionState
- PublicationState

### Reporting and External Submission Context — Core Invariants

1. Reports use approved or clearly labelled draft sources.
2. Export purpose and recipient are explicit.
3. Export requires permission and consent compatibility.
4. Sensitive exports require approval.
5. External submission does not transfer local ownership of Participant records.
6. External publication does not mutate local Research Findings.
7. Retraction or external correction is linked rather than hidden.
8. AI-generated report text remains labelled until human approval.

### Reporting and External Submission Context — Representative Commands

- CreateReport
- DraftReportVersion
- ApproveReportVersion
- RequestExport
- ApproveExport
- GenerateExport
- PrepareEvidencePackage
- PrepareExternalSubmission
- ApproveExternalSubmission
- SubmitExternalPackage
- RecordExternalPublicationReference

### Reporting and External Submission Context — Representative Domain Events

- ReportCreated
- ReportVersionDrafted
- ReportVersionApproved
- ExportRequested
- ExportApproved
- ExportGenerated
- EvidencePackagePrepared
- ExternalSubmissionPrepared
- ExternalSubmissionApproved
- ExternalSubmissionSubmitted
- ExternalPublicationReferenceRecorded

---

## 54. Governance and Audit Context

### Governance and Audit Context — Aggregate Roots

- ReviewRequest
- ApprovalRecord
- ConflictOfInterestRecord

### Governance and Audit Context — Representative Entities

- ReviewDecision
- ApprovalCondition
- PolicyDecisionReference
- AuditEvent
- ArchitectureDecision

### Governance and Audit Context — Representative Value Objects

- ReviewType
- ReviewState
- ReviewOutcome
- ApprovalType
- ConflictRestriction

### Governance and Audit Context — Core Invariants

1. No self-approval where separation of duties applies.
2. Approval applies to an exact version.
3. Review Request state is separate from artefact state.
4. Approval conditions remain enforceable.
5. Conflict of Interest may require recusal.
6. System Administrator is not a default governance approver.
7. AI is not an approver.
8. Audit events are append-only.
9. A final decision is superseded only by a governed new decision.
10. Policy Decisions preserve policy version and inputs.

### Governance and Audit Context — Representative Commands

- RequestReview
- AssignReview
- StartReview
- RequestAdditionalInformation
- RecordReviewDecision
- RecordApproval
- DeclareConflictOfInterest
- RecuseReviewer
- RecordPolicyDecision
- RecordAuditEvent
- RecordArchitectureDecision

### Governance and Audit Context — Representative Domain Events

- ReviewRequested
- ReviewAssigned
- ReviewStarted
- AdditionalInformationRequested
- ReviewDecisionRecorded
- ApprovalRecorded
- ConflictOfInterestDeclared
- ReviewerRecused
- PolicyDecisionRecorded
- AuditEventRecorded
- ArchitectureDecisionRecorded

---

## 55. Integration and Operations Context

### Integration and Operations Context — Aggregate Roots

- ExternalSystem
- ImportBatch

### Integration and Operations Context — Representative Entities

- ExternalIdentifierMapping
- OutboxMessage
- InboxMessage
- WebhookDelivery
- DeadLetterMessage
- ReconciliationRecord
- IdempotencyRecord
- NotificationDelivery
- BackgroundJob

### Integration and Operations Context — Representative Value Objects

- ExternalSystemCategory
- CapabilitySet
- IntegrationState
- DeliveryChannel
- DeliveryStatus
- SchemaVersion

### Integration and Operations Context — Core Invariants

1. External data retains source and authority.
2. Identifier mapping does not create ownership.
3. Imports are validated before domain commands are issued.
4. External payloads do not bypass aggregate invariants.
5. Outbox and inbox support reliable delivery.
6. Webhooks are authenticated and idempotent.
7. Notification content follows privacy and consent.
8. Integration failure does not silently corrupt research state.
9. Reconciliation is traceable.
10. Background workers act through Service Accounts and declared purposes.

### Integration and Operations Context — Representative Commands

- RegisterExternalSystem
- CreateIdentifierMapping
- StartImportBatch
- ValidateImportBatch
- CompleteImportBatch
- ScheduleNotification
- DeliverNotification
- ReconcileIntegration
- RetryDeadLetterMessage

### Integration and Operations Context — Representative Domain Events

- ExternalSystemRegistered
- ExternalIdentifierMapped
- ImportBatchStarted
- ImportBatchValidated
- ImportBatchCompleted
- NotificationScheduled
- NotificationDelivered
- NotificationFailed
- IntegrationReconciled
- DeadLetterMessageRetried

---

# Part V — Canonical State Registry

## 56. Relationship State

Proposed → Pending Verification → Active; Active may become Restricted, Suspended, Expired, or Revoked; Proposed or Pending may become Rejected.

## 57. Consent Decision and Effectiveness

Granted, Declined, Restricted, Deferred, Withdrawn, Expired, Superseded, or Re-Consent Required.

## 58. Research Project Lifecycle

Draft → In Review → Approved → Active → Completed → Archived; Active may become Suspended; Draft or In Review may become Cancelled.

## 59. Research Project Phase

Design, Setup, Recruitment, Intervention Delivery, Follow-Up, Data Preparation, Analysis, Reporting, and Closure.

## 60. Research Question State

Draft, In Review, Approved, Closed, Superseded, or Archived.

## 61. Protocol Version State

Draft → In Review → Approved → Active; Active may become Suspended, Superseded, or Archived; Draft or In Review may become Rejected.

## 62. Enrolment State

Invited → Screening → Eligible → Consenting → Enrolled → Active; Active may become Paused, Completed, Withdrawn, or Discontinued.

## 63. Intervention Lifecycle Maturity

Idea, Concept, Evidence Review, Co-Design, Prototype, Feasibility, Pilot, Evaluated, Controlled Deployment, Ongoing Monitoring, Suspended, or Retired.

## 64. Intervention Version State

Draft, In Review, Approved, Active, Suspended, Superseded, Retired, Archived, or Rejected.

## 65. Intervention Assignment State

Planned, Ready, Active, Paused, Completed, Discontinued, or Cancelled.

## 66. Assessment State

Scheduled, Available, In Progress, Completed, Partially Completed, Declined, Expired, Invalidated, or Cancelled.

## 67. Safety Signal State

Recorded → Awaiting Triage → In Review → Escalated, Converted to Safety Event, or Closed as Not a Safety Event.

## 68. Safety Event State

Open, In Review, Action Required, Monitoring, Resolved, Closed, or Reopened.

## 69. Evidence Review State

Draft, In Review, Approved, Returned for Revision, Superseded, or Archived.

## 70. Research Knowledge Gap Lifecycle

Identified → In Review → Prioritised → Linked to Research Question → Under Investigation → Partially Addressed → Addressed or Retained as Unresolved.

## 71. AI Interaction State

Requested, Permission Evaluation, Context Assembly, Retrieval, Generation, Validation, Awaiting Confirmation, Awaiting Human Review, Completed, Refused, Escalated, Failed, or Cancelled.

## 72. AI Configuration Version State

Draft, In Review, Approved, Active, Suspended, Superseded, Retired, Archived, or Rejected.

## 73. Dataset Version State

Draft → Generated → Quality Review → Quality Reviewed → Locked → Analysed; then Superseded or Archived.

## 74. Analysis Plan State

Draft, In Review, Approved, Active, Superseded, Archived, or Rejected.

## 75. Research Finding State

Draft, In Review, Approved, Approved with Limitations, Rejected, Superseded, Withdrawn, or Archived.

## 76. External Submission State

Draft, Prepared, In Review, Approved for Submission, Submitted, Returned for Revision, Accepted, Rejected, Withdrawn, Superseded, or Closed.

## 77. Review Request State

Requested, Assigned, In Review, Awaiting Information, Completed, Cancelled, or Expired.

## 78. Life Story Item State

- Draft
- In Review
- Active
- Hidden
- Restricted
- Withdrawn
- Archived
- Deleted with required tombstone and audit where applicable

Visibility is a separate dimension.

## 79. Life Story Contribution State

- Proposed
- In Review
- Accepted
- Rejected
- Withdrawn
- Superseded

## 80. Public Profile State

- Draft
- Active
- Hidden
- Suspended
- Withdrawn
- Deleted

## 81. Social Post State

- Draft
- Published
- Hidden
- Restricted
- Removed
- Deleted
- Archived
- Restored

## 82. Connection Formation States

### 82.1 ConnectionRequest State

- Draft
- Pending
- Accepted
- Declined
- Cancelled
- Expired
- Blocked
- Invalidated

`ConnectionRequest` is a Deferred Alternative Connection Basis and is feature-disabled for the first Pilot.

Acceptance does not directly activate a Connection. It provides one source basis for `MutualAcceptance`.

### 82.2 MutualAcceptance State

- Recorded
- Active
- Consumed by Connection Activation
- Expired
- Invalidated
- Superseded
- Archived

A MutualAcceptance record is immutable with respect to its source decisions or request, actor pair, purpose and policy version.

A change in source decisions, Consent, Block, eligibility or policy creates invalidation or a new MutualAcceptance evaluation rather than editing the original basis.

## 83. Connection, ConversationThread and Message States

### 83.1 Connection State

- Active
- Muted
- Paused
- Disconnected
- Blocked
- Superseded
- Archived

Mute is a preference dimension and may coexist with Active.

### 83.2 ConversationThread State

- Active
- Paused
- Closed
- Blocked
- Expired
- Archived

A Thread cannot remain usable when its CommunicationBasis is no longer effective.

### 83.3 Message Lifecycle State

- Draft
- Confirmed for Send
- Queued
- Sending
- Sent
- Withdrawn
- Cancelled
- Expired
- Archived

### 83.4 Message Delivery State

- Not Submitted
- Queued
- Sent to Provider or Transport
- Provider Accepted
- Delivered
- Read where explicitly supported
- Delivery Failed
- Delivery Unknown
- Cancelled
- Expired

Message lifecycle and delivery state are separate dimensions.

## 84. Match Candidate State

- Generated
- Available
- Viewed
- Expired
- Withdrawn
- Invalidated
- Reported
- Blocked

Interested, Not Now and Dismissed are MatchDecision values, not MatchCandidate lifecycle states.

## 85. Moderation Case State


- Reported
- Awaiting Triage
- In Review
- Awaiting Information
- Action Required
- Actioned
- Dismissed
- Appealed
- Resolved
- Closed
- Reopened

## 86. Canonical `In Review` Term

Use `In Review` as the canonical review state. Do not alternate among Under Review, Internal Review, Review Active, or Reviewing unless an external-system mapping requires it.

## 87. State Dimensions Must Remain Separate

| Dimension | Example |
|---|---|
| Aggregate lifecycle state | Research Project Active |
| Operational phase | Recruitment |
| Version state | Protocol Version Approved |
| Review task state | Review Request In Review |
| Review decision | Approve with Conditions |
| Evidence conclusion | Support with Conditions |
| Scientific direction | Research Finding Mixed |
| Deployment state | Intervention Version Active |
| External submission state | Submitted |
| External publication state | Publication reference confirmed |
| Life Story lifecycle state | Life Story Item Active |
| Visibility scope | Community or Platform Public |
| MutualAcceptance state | Active |
| Connection state | Active |
| ConversationThread state | Active |
| Message lifecycle state | Draft |
| Message delivery state | Not Submitted |
| MatchCandidate state | Available |
| Moderation Case state | In Review |

---

# Part VI — Cross-Context Models

## 88. Permission Decision Model

```text
Role
+ Relationship
+ Consent
+ Purpose
+ Context
+ Specific Permission
+ Resource State
        ↓
Allow
Allow with Conditions
Require Review
Restrict
Deny
```

## 89. Effective AI Permission

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

## 90. Research Lineage

```text
ResearchQuestion
        ↓
EvidenceReview and EvidenceDecision
        ↓
ProtocolVersion
        ↓
InterventionConfiguration
        ↓
Enrolment and InterventionAssignment
        ↓
Assessment / Observation / Outcome
        ↓
DatasetVersion
        ↓
AnalysisPlan and AnalysisRun
        ↓
InterpretationRecord
        ↓
ResearchFinding
        ↓
InterventionDecision
        ↓
ExternalSubmission
```

## 91. Safety Lineage

```text
Participant / Supporter / Staff / Assessment / AI / Rule
        ↓
SafetySignal
        ↓
Human Triage
        ↓
SafetyEvent where confirmed
        ↓
SafetyAction
        ↓
Assignment or Project Pause where authorised
```

## 92. Knowledge Integration Lineage

```text
Knowledge Platform Resource
        ↓
KnowledgeReference
        ↓
EvidenceReview
        ↓
EvidenceDecision
        ↓
EvidenceSnapshot
        ↓
ProtocolVersion / InterventionVersion / MeasurementSelection
```

## 93. AI Action Lineage

```text
Actor and Task
        ↓
Permission Evaluation
        ↓
AI Context Assembly
        ↓
Retrieval and Model
        ↓
Validated Output
        ↓
Draft / Suggestion / Action Proposal
        ↓
Human Confirmation or Review
        ↓
Domain Command
```

## 94. Life Story Contribution and Publication Lineage

```text
Participant or Invited Contributor
        ↓
LifeStoryContribution Proposed
        ↓
Participant Review
        ↓
Accepted LifeStoryItem Revision
        ↓
Item-Level Sharing Policy
        ↓
Selected People / Connections / Community / Platform Public
        ↓
Separate Internet Public Flow where explicitly consented
```

## 95. Open Matching, MutualAcceptance and Communication Lineage

### 95.1 First-Pilot Open Matching Path

```text
Participant Opt-In
        ↓
MatchPreference and Eligibility
        ↓
Permitted Attribute Selection
        ↓
MatchCandidate and MatchExplanation
        ↓
Independent MatchDecision by Participant A
        +
Independent MatchDecision by Participant B
        ↓
MutualAcceptance
        ↓
Connection
        ↓
ConversationThread under Active Connection Basis
        ↓
Message Draft
        ↓
Explicit Send Confirmation
        ↓
Queued / Sent / Provider Accepted / Delivered / Failed
        ↓
Pause / Mute / Disconnect / Block / Report
```

### 95.2 Deferred Direct-Request Path

```text
Approved Discovery or Invitation Basis
        ↓
ConnectionRequest
        ↓
Recipient Accepts
        ↓
MutualAcceptance
        ↓
Connection
```

The deferred path does not bypass MutualAcceptance.

### 95.3 Existing Authorised Contact Path

```text
Active Relationship or Approved InterventionSession
        ↓
CommunicationBasis Evaluation
        ↓
ConversationThread where Platform Messaging is Enabled
        ↓
Message Lifecycle
```

An existing-contact intervention may also occur outside Platform messaging and may complete without an M18 Connection.

## 96. Moderation Lineage


```text
UserReport or ContentReport
        ↓
ModerationCase
        ↓
Human Triage
        ↓
Evidence and Context Review
        ↓
ModerationDecision
        ↓
Warn / Restrict / Hide / Remove / Suspend / Restore / Escalate
        ↓
Appeal and Resolution
```

## 97. Visibility Model

```text
Private
    → only the owner and explicitly authorised operational actors

Selected People
    → named actors with item-level access

Connections
    → current eligible Connections

Community
    → members of one or more governed Community Spaces

Platform Public
    → eligible governed platform users

Internet Public
    → external publication through separate explicit consent
```

Visibility does not replace consent, purpose, download permission, re-sharing permission, quotation permission, or research-use permission.

## 98. AI Output Classification

| Dimension | Canonical Values |
|---|---|
| Epistemic Type | Platform Fact; Retrieved Evidence; User-Provided Information; Human Decision; AI Inference; Suggestion; Draft; Unknown |
| Artefact Type | Explanation; Summary; Draft Message; Draft Protocol Text; Draft Evidence Table; Classification; Recommendation; Risk Signal; Action Proposal; Translation; Transcription |
| Review Status | Not Reviewed; Human Review Required; In Review; Reviewed; Review Rejected; Review Superseded |
| Approval Status | Not Applicable; Not Approved; Approved; Approved with Conditions; Rejected; Withdrawn |
| Safety Classification | Routine; Sensitive; High Risk; Prohibited; Escalation Required |

## 99. Participant Response Capture Rule

AI may transcribe, structure, or route a Participant's explicitly provided response. The record must identify the Participant as source only when the Participant actually provided the content, identify AI as capture or transformation mechanism, preserve the original input reference where permitted, record transformation, and obtain confirmation where required.

AI must not generate a response and store it as Participant-authored.

---

# Part VII — Aggregate and Value Object Registries

## 100. Canonical Aggregate Root Registry

| Bounded Context | Aggregate Root |
|---|---|
| Identity and Organisation | UserAccount |
| Identity and Organisation | Organisation |
| Identity and Organisation | OrganisationMembership |
| Identity and Organisation | RoleAssignment |
| Identity and Organisation | ServiceAccount |
| Participant and Preference | Participant |
| Identity and Life Story | LifeStoryArchive |
| Identity and Life Story | LifeStoryItem |
| Identity and Life Story | LifeStoryExport |
| Identity and Life Story | LegacyPreference |
| Community and Social Connection | PublicProfile |
| Community and Social Connection | CommunitySpace |
| Community and Social Connection | CommunityMembership |
| Community and Social Connection | SocialPost |
| Community and Social Connection | ConnectionRequest |
| Community and Social Connection | MatchPreference |
| Community and Social Connection | MatchCandidate |
| Community and Social Connection | MutualAcceptance |
| Community and Social Connection | Connection |
| Community and Social Connection | ConversationThread |
| Community and Social Connection | Message |
| Community and Social Connection | BlockRecord |
| Community and Social Connection | ModerationCase |
| Relationship, Consent and Permission | Relationship |
| Relationship, Consent and Permission | Consent |
| Relationship, Consent and Permission | Delegation |
| Relationship, Consent and Permission | SubstituteAuthority |
| Relationship, Consent and Permission | PolicyDecision |
| Research Design and Governance | ResearchProject |
| Research Design and Governance | ResearchQuestion |
| Research Design and Governance | Protocol |
| Research Design and Governance | ProtocolVersion |
| Enrolment and Participation | ScreeningRecord |
| Enrolment and Participation | EligibilityDecision |
| Enrolment and Participation | Enrolment |
| Intervention Portfolio | Intervention |
| Intervention Portfolio | InterventionVersion |
| Intervention Portfolio | InterventionConfiguration |
| Intervention Portfolio | InterventionDecision |
| Intervention Delivery | InterventionAssignment |
| Intervention Delivery | InterventionSession |
| Assessment, Observation and Outcome | AssessmentSchedule |
| Assessment, Observation and Outcome | AssessmentRecord |
| Assessment, Observation and Outcome | Observation |
| Assessment, Observation and Outcome | OutcomeRecord |
| Safety and Escalation | SafetySignal |
| Safety and Escalation | SafetyEvent |
| Evidence and Knowledge Integration | KnowledgeReference |
| Evidence and Knowledge Integration | EvidenceReview |
| Evidence and Knowledge Integration | EvidenceDecision |
| Evidence and Knowledge Integration | EvidenceSnapshot |
| Evidence and Knowledge Integration | ResearchKnowledgeGap |
| Evidence and Knowledge Integration | ReferenceChangeAlert |
| AI Companion | AIConversation |
| AI Companion | AIInteraction |
| AI Companion | AIInterventionConfiguration |
| AI Companion | AIInterventionConfigurationVersion |
| AI Companion | AIMemoryItem |
| Dataset and Data Quality | DatasetDefinition |
| Dataset and Data Quality | DatasetVersion |
| Dataset and Data Quality | DataQualityIssue |
| Dataset and Data Quality | TransformationRun |
| Analysis, Interpretation and Findings | AnalysisPlan |
| Analysis, Interpretation and Findings | AnalysisRun |
| Analysis, Interpretation and Findings | InterpretationRecord |
| Analysis, Interpretation and Findings | ResearchFinding |
| Reporting and External Submission | Report |
| Reporting and External Submission | ReportVersion |
| Reporting and External Submission | ExportRequest |
| Reporting and External Submission | ExternalSubmission |
| Governance and Audit | ReviewRequest |
| Governance and Audit | ApprovalRecord |
| Governance and Audit | ConflictOfInterestRecord |
| Integration and Operations | ExternalSystem |
| Integration and Operations | ImportBatch |

## 101. Aggregate Reference Rule

Aggregates reference other aggregates by stable identifier and exact version where relevant. They do not embed and mutate another context's aggregate.

```text
InterventionAssignment
    references ParticipantId
    references ResearchProjectId
    references ProtocolVersionId
    references InterventionConfigurationId
    references ConsentId
```

## 102. Entity versus Value Object Rule

- A concept with stable identity, lifecycle, approval, provenance, or independent references is an Entity.
- A concept defined only by its values and replaced as a whole is a Value Object.
- EvidenceSnapshot is an Entity.
- ProtocolVersion is an Entity and aggregate root.
- InterventionVersion is an Entity and aggregate root.
- AIConversation is an Entity but not the primary authority boundary.
- LifeStoryItem, SocialPost, MatchCandidate, MutualAcceptance, Connection, ConversationThread, Message and ModerationCase are Entities with independent identity and lifecycle.
- VisibilityScope, MatchReason, Attribution, AudienceDefinition, CommunicationBasis, MessageDeliveryState and ModerationActionType are Value Objects.
- VersionReference, PurposeOfUse, DataClassification, MeasurementValue, and PermissionScope are Value Objects.

## 103. Identity and Reference Value Objects

- ActorReference
- UserId
- ParticipantId
- OrganisationId
- ResearchProjectId
- ProtocolVersionId
- InterventionVersionId
- DatasetVersionId
- ResearchFindingId
- PublicProfileId
- CommunitySpaceId
- ConnectionRequestId
- MatchPreferenceId
- MatchCandidateId
- MatchDecisionId
- MutualAcceptanceId
- ConnectionId
- ConversationThreadId
- MessageId
- BlockRecordId
- ModerationCaseId
- ExternalIdentifier
- ExternalSystemReference
- VersionReference
- CorrelationId
- TraceId

## 104. Time Value Objects

- Instant
- DateRange
- TimeRange
- DueWindow
- EffectivePeriod
- ReviewPeriod
- RetentionPeriod
- FollowUpWindow

## 105. Permission Value Objects

- RoleCode
- Scope
- RelationshipType
- RelationshipDirection
- ConsentScope
- PurposeOfUse
- SpecificPermission
- PermissionContext
- ResourceState
- PermissionCondition
- DataClassification
- ActionRisk

## 106. Research and Intervention Value Objects

- ResearchObjective
- Hypothesis
- PopulationDefinition
- EligibilityCriterion
- StudyDesign
- AssignmentMethod
- ResearchProjectPhase
- AnalysisPopulation
- InterventionDomain
- InterventionDose
- DeliveryMode
- AdaptationRange
- FidelityRequirement
- EvidenceStatus
- EvidenceDirection
- InterventionDecisionType

## 107. Measurement and Data Value Objects

- MeasurementValue
- Unit
- Timepoint
- InstrumentVersionReference
- ScoringVersion
- MissingDataReason
- QualityFlag
- AdministrationMode
- DataClassification
- RetentionRule
- DeIdentificationState
- TransformationReference
- Checksum
- ImputationMethod

## 108. Evidence and AI Value Objects

- RetrievalContext
- ProvenanceRecord
- CitationRecord
- ApplicabilityAssessment
- DirectnessAssessment
- VerificationState
- AIMode
- AIPurpose
- ModelReference
- InstructionVersion
- ToolPermission
- EpistemicType
- AIArtefactType
- AIReviewStatus
- AIApprovalStatus
- AISafetyClassification
- ActionLevel
- MemoryPolicy
- DegradedMode

---

## 109. Life Story, Community, Matching and Messaging Value Objects

- LifeStoryArchiveId
- LifeStoryItemId
- StoryTheme
- LifePeriod
- ParticipantTestimony
- Attribution
- ContributionRole
- VisibilityScope
- AudienceDefinition
- DownloadPermission
- ResharingPermission
- QuotationPermission
- ReusePermission
- LegacyAccessInstruction
- StorySensitivity
- PublicDisclosureWarning
- PublicProfileId
- CommunitySpaceId
- CommunityMembershipId
- SocialPostId
- ConnectionRequestId
- MatchPreferenceId
- MatchCandidateId
- MatchDecisionId
- MutualAcceptanceId
- ConnectionId
- ConversationThreadId
- MessageId
- BlockRecordId
- ModerationCaseId
- CommunityScope
- CommunityEligibility
- DeclaredInterest
- MatchingGoal
- CommunicationMode
- AvailabilityWindow
- LocationBoundary
- DistancePreference
- InteractionPreference
- ExclusionPreference
- SensitiveAttributeUseRule
- MatchReason
- MatchScoreComponent
- MatchDecisionType
- MutualAcceptanceBasis
- MutualAcceptanceState
- ConnectionBasis
- ConnectionState
- CommunicationBasis
- ConversationThreadState
- MessageContent
- MessageLifecycleState
- MessageDeliveryState
- MessageRecipientSet
- AttachmentPolicy
- DeliveryProviderReference
- DeliveryFailureReason
- ReportCategory
- ModerationActionType
- ModerationSeverity
- AppealOutcome
- DiscoveryPolicy
- RankingObjective

# Part VIII — Domain Policy and Service Registry


## 110. Life Story Ownership and Sharing Policy

Determines archive and item ownership, contribution authority, Participant review, audience, visibility, download, quotation, re-sharing, external publication, withdrawal, export, research use, and legacy handling.

## 111. Public Visibility Policy

Determines whether content may be Private, Selected People, Connections, Community, Platform Public, or Internet Public.

It evaluates consent, purpose, content classification, moderation state, Participant choice, Community Rules, and Resource State.

## 112. Matching Eligibility and Candidate Policy

Determines:

- who may opt into Open Matching;
- which declared or separately authorised attributes may be used;
- candidate eligibility;
- exclusions;
- Block state;
- matching purpose;
- diversity, fairness and accessibility constraints;
- MatchExplanation requirements;
- candidate limits;
- and expiry.

It does not create MatchDecisions, MutualAcceptance, Connections or communication authority.

## 113. MutualAcceptance, Connection and Communication Policy

### 113.1 MutualAcceptance Policy

Requires:

- two compatible current independent MatchDecisions; or
- one accepted ConnectionRequest under an approved alternative-basis policy;
- current actor and account eligibility;
- current Consent;
- current purpose;
- no applicable Block;
- non-expired source records;
- matching or request policy version;
- and any required Safety or moderation restriction check.

The policy creates one immutable `MutualAcceptance` aggregate referencing the exact source records.

### 113.2 Connection Activation Policy

Requires:

- one active and unused MutualAcceptance record;
- the same actor pair and purpose;
- current eligibility, Consent and no Block;
- a permitted Connection scope;
- and any required Safety restriction check.

Connection activation consumes or links the MutualAcceptance record so it cannot silently activate another Connection.

### 113.3 ConnectionRequest Policy

ConnectionRequest is a deferred alternative formation path.

If enabled, the policy requires an approved discovery or invitation basis, recipient eligibility, expiry, no Block and explicit recipient acceptance.

Acceptance creates MutualAcceptance and does not directly create Connection.

### 113.4 CommunicationBasis Policy

Determines whether a ConversationThread may exist and whether a Message may be sent.

A permitted basis may include:

- active Connection;
- active authorised Relationship;
- approved InterventionSession;
- approved moderated Community context;
- or another explicitly governed basis.

The basis is re-evaluated at Thread creation and each effectful Message action.

### 113.5 ConversationThread Policy

Requires:

- exact authorised participants;
- one current CommunicationBasis;
- current Consent and permission;
- no applicable Block;
- defined purpose;
- allowed communication mode;
- retention;
- and current ResourceState.

Thread membership cannot be silently expanded.

### 113.6 Message Send and Delivery Policy

Requires:

- one Draft Message version;
- actor-specific Send Confirmation;
- current ConversationThread;
- current CommunicationBasis;
- current sender and recipient eligibility;
- no applicable Block;
- approved attachment state;
- rate and abuse controls;
- and idempotency.

It separately governs:

- queue;
- provider submission;
- provider acceptance;
- delivery;
- failure;
- retry;
- withdrawal;
- and cancellation.

## 114. Moderation and Appeal Policy


Determines report routing, triage urgency, evidence access, reviewer authority, action-risk level, permitted moderation action, notification, appeal, restoration, and Safety Signal or privacy escalation.

## 115. Digital Legacy Policy

Determines whether a Legacy Preference is effective, who may act, which items are included, whether content is deleted, restricted, memorialised, exported, or retained, and how conflicts with consent, law, research retention, and external publication are handled.

## 116. Permission Evaluation Policy

Evaluates Role, Relationship, Consent, Purpose, Context, Specific Permission, and Resource State and produces a PolicyDecision.

## 117. Consent Effectiveness Policy

Evaluates current decisions, scope, purpose, restrictions, expiry, withdrawal, supersession, and re-consent requirements.

## 118. Relationship Applicability Policy

Evaluates direction, type, state, verification, purpose, scope, expiry, and revocation.

## 119. Eligibility Policy

Evaluates Protocol Version criteria against permitted screening data and produces an Eligibility Decision under human authority.

## 120. Enrolment Readiness Policy

Requires approved project and Protocol Version, eligibility, compatible consent, baseline readiness, and no blocking safety or governance condition.

## 121. Intervention Assignment Policy

Requires active Enrolment, approved configuration, effective consent, compatible Participant context, and no blocking Safety Action.

## 122. Evidence Applicability Policy

Evaluates quality, directness, population, context, mechanism, modality, outcome, measurement, burden, harm, accessibility, equity, transferability, and uncertainty.

## 123. AI Context Policy

Determines minimum necessary sources permitted to enter AI context.

## 124. AI Action Policy

Determines whether a proposed action is prohibited, draft-only, confirmation-required, review-required, or low-risk reversible.

## 125. Safety Escalation Policy

Determines urgency, reviewer role, escalation path, assignment pause, project-level review, and external handoff where separately governed.

## 126. Dataset Lock Policy

Requires approved definition, completed generation, quality review, resolved or accepted issues, manifest, consent and purpose compatibility, and human approval.

## 127. Research Finding Approval Policy

Requires approved Analysis Plan, locked Dataset Version, completed Analysis Run, approved Interpretation Record, limitations, conflict handling, and authorised approval.

## 128. Representative Domain Services

- IdentityResolutionService
- RoleAssignmentService
- PermissionEvaluationService
- ConsentEffectivenessService
- RelationshipVerificationService
- DelegationValidationService
- SubstituteAuthorityValidationService
- ProtocolVersioningService
- EligibilityEvaluationService
- EnrolmentService
- ReConsentEvaluationService
- WithdrawalImpactService
- InterventionVersioningService
- InterventionConfigurationService
- InterventionAssignmentService
- ExposureCalculationService
- FidelityEvaluationService
- AssessmentAdministrationService
- ScoringService
- OutcomeDerivationService
- SafetyTriageService
- SafetyEscalationService
- StoppingRuleService
- EvidenceApplicabilityService
- EvidenceSnapshotService
- ResearchKnowledgeGapService
- AIContextService
- AIOutputValidationService
- AIActionService
- AIMemoryService
- AISafetySignalService
- DatasetGenerationService
- DataQualityService
- DatasetLockService
- DeIdentificationService
- AnalysisExecutionService
- InterpretationService
- ResearchFindingService
- InterventionDecisionService
- ResearchLineageService
- LifeStoryArchiveService
- LifeStoryContributionService
- LifeStorySharingService
- LifeStoryExportService
- DigitalLegacyService
- PublicProfileService
- CommunityMembershipService
- SocialContentService
- MatchingEligibilityService
- MatchCandidateService
- MatchExplanationService
- MatchDecisionService
- MutualAcceptanceService
- ConnectionRequestService
- ConnectionService
- CommunicationBasisService
- ConversationThreadService
- MessageService
- MessageDeliveryService
- BlockAndMuteService
- ModerationService
- ModerationAppealService

These are logical business boundaries. They are not mandatory microservices.

---

# Part IX — Repository and Event Architecture

## 129. Repository Rules

1. Repository interfaces use domain terms.
2. Repositories exist for aggregate roots.
3. Repositories do not expose cross-context joins as mutation mechanisms.
4. Reporting uses read models.
5. Analytical extraction uses Dataset Definitions.
6. External resources use adapters and references.
7. Repository implementation is not specified by the domain model.

## 130. Representative Repositories

- AIConversationRepository
- AIInteractionRepository
- AIInterventionConfigurationRepository
- AIInterventionConfigurationVersionRepository
- AIMemoryItemRepository
- AnalysisPlanRepository
- AnalysisRunRepository
- ApprovalRecordRepository
- AssessmentRecordRepository
- AssessmentScheduleRepository
- ConflictOfInterestRecordRepository
- ConsentRepository
- DataQualityIssueRepository
- DatasetDefinitionRepository
- DatasetVersionRepository
- DelegationRepository
- EligibilityDecisionRepository
- EnrolmentRepository
- EvidenceDecisionRepository
- EvidenceReviewRepository
- EvidenceSnapshotRepository
- ExportRequestRepository
- ExternalSubmissionRepository
- ExternalSystemRepository
- ImportBatchRepository
- InterpretationRecordRepository
- InterventionAssignmentRepository
- InterventionConfigurationRepository
- InterventionDecisionRepository
- InterventionRepository
- InterventionSessionRepository
- InterventionVersionRepository
- KnowledgeReferenceRepository
- ObservationRepository
- OrganisationMembershipRepository
- OrganisationRepository
- OutcomeRecordRepository
- ParticipantRepository
- LifeStoryArchiveRepository
- LifeStoryItemRepository
- LifeStoryExportRepository
- LegacyPreferenceRepository
- PublicProfileRepository
- CommunitySpaceRepository
- CommunityMembershipRepository
- SocialPostRepository
- ConnectionRequestRepository
- MatchPreferenceRepository
- MatchCandidateRepository
- MutualAcceptanceRepository
- ConnectionRepository
- ConversationThreadRepository
- MessageRepository
- BlockRecordRepository
- ModerationCaseRepository
- PolicyDecisionRepository
- ProtocolRepository
- ProtocolVersionRepository
- ReferenceChangeAlertRepository
- RelationshipRepository
- ReportRepository
- ReportVersionRepository
- ResearchFindingRepository
- ResearchKnowledgeGapRepository
- ResearchProjectRepository
- ResearchQuestionRepository
- ReviewRequestRepository
- RoleAssignmentRepository
- SafetyEventRepository
- SafetySignalRepository
- ScreeningRecordRepository
- ServiceAccountRepository
- SubstituteAuthorityRepository
- TransformationRunRepository
- UserAccountRepository

## 131. Domain Event Definition

A Domain Event records a meaningful fact that occurred inside a bounded context. It uses past tense, identifies aggregate and version, preserves time and actor or system source, includes correlation and trace identifiers, and avoids unnecessary sensitive payload.

## 132. Event Categories

| Category | Meaning |
|---|---|
| Domain Event | Internal business fact. |
| Integration Event | Stable external contract derived from Domain Events. |
| Operational Event | Technical or workflow event such as job failure. |
| Audit Event | Governance record of an action or decision. |

## 133. Event Naming and Cross-Layer Mapping Rules

### 133.1 Naming Rules

| Use | Avoid |
|---|---|
| ProtocolVersionApproved | ProtocolAmended |
| SafetySignalRecorded | SafetyEventDetected |
| ResearchFindingApproved | FindingDone |
| DatasetVersionLocked | DatasetFinal or DatasetLocked |
| AIActionConfirmed | AIChangedData |
| LifeStoryItemPublishedToCommunity | StoryShared |
| MutualAcceptanceRecorded | MatchCompleted |
| ConnectionActivated | MatchCompleted |
| MessageSendConfirmed | MessageSent before transport |
| MessageDelivered | MessageSent as a delivery synonym |
| BlockCreated | ActorBlocked |
| UserReportSubmitted | UserReported |
| ModerationDecisionRecorded | ContentHandled |

### 133.2 Event-Layer Distinction

```text
Domain Event
    = internal business fact emitted by the owning aggregate

Integration Event
    = stable external contract derived from one or more Domain Events

UX Analytics Event
    = minimum-necessary record of user interaction or presentation state
```

A UX interaction event does not establish that the owning-domain action succeeded.

### 133.3 Canonical M18 Event Mapping

| UX or Legacy Name | Canonical Domain Event | Mapping Rule |
|---|---|---|
| `PublicProfileActivated` | `PublicProfilePublished` | UX activation is successful only after the PublicProfile aggregate publishes. |
| `LifeStoryVisibilityChanged` | `LifeStoryItemVisibilityChanged` | UX alias must include exact LifeStoryItem and version in domain mapping. |
| `MatchCompleted` | `MutualAcceptanceRecorded` or `ConnectionActivated` | The intended state must be named explicitly. |
| `MessageDraftCreated` | `MessageDraftCreated` | Same name may be used, but event category and source remain explicit. |
| `MessageSendConfirmed` | `MessageSendConfirmed` | Confirmation is not transport or delivery. |
| `MessageSent` | `MessageSent` | Means handed to the approved provider or transport according to the provider adapter contract. |
| `MessageDeliveryConfirmed` | `MessageDelivered` | `MessageDelivered` is the canonical domain fact. |
| `BlockCreated` | `BlockCreated` | Canonical replacement for `ActorBlocked`. |
| `BlockRemoved` | `BlockRevoked` | Revocation does not restore Connection or matching automatically. |
| `UserReportSubmitted` | `UserReportSubmitted` | Canonical replacement for `UserReported`. |
| `ContentReportSubmitted` | `ContentReportSubmitted` | Canonical replacement for `ContentReported`. |
| `ModerationCaseCreated` | `ModerationCaseCreated` | A case is not a SafetySignal or SafetyEvent. |
| `DatasetLockConfirmed` | `DatasetVersionLocked` | UX confirmation precedes or accompanies the owning M12 lock command; the canonical domain fact is `DatasetVersionLocked`. |

### 133.4 Message Event Semantics

```text
MessageDraftCreated
        ↓
MessageDraftRevised
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

`MessageRead` is optional and exists only where explicitly enabled and disclosed.

### 133.5 Migration Aliases

The following names are deprecated as canonical Domain Events:

- ActorBlocked;
- ActorUnblocked;
- UserReported;
- ContentReported;
- MessageDeliveryConfirmed;
- DatasetLocked;
- DatasetLockConfirmed;
- MatchCompleted;
- and SafetyEventDetected.

Historical events remain readable through explicit versioned translation.

## 134. Event Metadata


- event_id
- event_type
- event_version
- occurred_at
- aggregate_type
- aggregate_id
- aggregate_version
- actor_reference
- organisation_id
- research_project_id
- participant_id where permitted
- purpose
- correlation_id
- causation_id
- trace_id
- data_classification
- schema_version

## 135. Idempotency

Consumers must handle at-least-once delivery. Integration-event consumers should use event ID, idempotency key, aggregate version, or external message identifier to prevent duplicate effects.

---

# Part X — Anti-Corruption Layers

## 136. Knowledge Platform ACL

- KnowledgePlatformClient
- MCPClient
- KnowledgeReferenceMapper
- KnowledgeResourceTranslator
- ProvenanceTranslator
- CapabilityDetector
- KnowledgeVersionResolver
- KnowledgeSubmissionAdapter

## 137. Identity Provider ACL

- IdentityProviderClient
- ProviderSubjectMapper
- AuthenticationAssuranceMapper
- IdentityClaimTranslator

## 138. AI Model Provider ACL

- ModelProviderClient
- ModelAliasResolver
- ProviderResponseTranslator
- ToolCallTranslator
- TokenUsageMapper
- ProviderSafetyMetadataMapper

## 139. Communication Provider ACL

- EmailAdapter
- SMSAdapter
- PushAdapter
- VoiceAdapter
- ProviderMessageReferenceMapper
- ProviderCallbackAuthenticator
- DeliveryStatusTranslator
- DeliveryFailureTranslator
- ProviderIdempotencyMapper
- AttachmentDeliveryMapper

Provider callbacks update `Message` delivery state only through authenticated and idempotent translation.

The provider does not own Message content, sender authority, CommunicationBasis or final Platform state.

## 140. External Health or Research Data ACL

- ExternalRecordAdapter
- TerminologyMapper
- ImportValidator
- SourceAuthorityMapper
- DataTransformationAdapter

## 141. Device and Sensor ACL

- DeviceSourceAdapter
- CalibrationMapper
- DeviceQualityMapper
- SensorTransformationAdapter

External schemas and provider-specific state must not become the canonical Research Platform domain model.

---

## 142. Public Content, Search and Moderation Provider ACL

Where external services are used, this ACL maps indexing, search, media processing, malware scanning, content classification, spam or abuse signals, moderation queues, external publication, and removal responses to canonical SocialPost, LifeStoryItem, ContentReport, ModerationCase, and ExternalPublicationReference records.

Provider classification or removal decisions do not automatically become final platform moderation decisions.

# Part XI — Mapping to Product, Data, API, and UX

## 143. Recommended Product Module Boundaries

| Product or Application Module | Primary Bounded Context |
|---|---|
| Identity and Organisation Administration | Identity and Organisation |
| Participant Workspace | Participant and Preference |
| Life Story and Personal Archive | Identity and Life Story |
| Community, Social Connection and Open Matching | Community and Social Connection |
| Relationship and Consent Workspace | Relationship, Consent and Permission |
| Research Project Workspace | Research Design and Governance |
| Recruitment and Enrolment | Enrolment and Participation |
| Intervention Portfolio | Intervention Portfolio |
| Intervention Delivery | Intervention Delivery |
| Assessment and Observation | Assessment, Observation and Outcome |
| Safety Review | Safety and Escalation |
| Evidence Workspace | Evidence and Knowledge Integration |
| AI Companion | AI Companion |
| Dataset Workspace | Dataset and Data Quality |
| Analysis and Findings | Analysis, Interpretation and Findings |
| Reporting and Submission | Reporting and External Submission |
| Governance and Audit | Governance and Audit |
| Integration Administration | Integration and Operations |

## 144. Read Model Composition

A workspace may compose information from several contexts. The read model does not become the owner of those records.

```text
Participant Workspace Read Model
    ← Participant
    ← Enrolment
    ← Consent summary
    ← Intervention Assignments
    ← Assessment schedule
    ← Safety restrictions
    ← Supporter relationships
    ← Life Story summary and sharing state
    ← Community membership, MatchCandidates, MutualAcceptance, Connections, ConversationThreads and Message summaries
```

```text
Life Story Workspace Read Model
    ← Participant
    ← LifeStoryArchive
    ← LifeStoryItems
    ← Contribution queue
    ← Sharing policies
    ← Moderation restrictions
    ← Export and Legacy Preference

Community, Matching and Messaging Workspace Read Model
    ← PublicProfile
    ← CommunityMemberships
    ← SocialPosts and Comments
    ← MatchPreferences, MatchCandidates and MatchDecisions
    ← MutualAcceptance and Connections
    ← ConversationThreads and permission-scoped Message summaries
    ← Deferred ConnectionRequests where feature-enabled
    ← Blocks, reports and ModerationCases
```

## 145. Domain Model Before Database

- Document 16 implements the domain model through schemas, tables, constraints, repositories, projections, and audit.
- A table does not automatically represent an aggregate.
- An entity may require one table, several tables, object storage, or event records.
- Approved versions preserve immutable content, approval, effective time, checksum where applicable, and supersession.
- Domain events, Audit Events, and integration messages remain distinct even when stored in related infrastructure.

## 146. API Mapping

- APIs expose domain resources or explicit actions.
- Use explicit approve, activate, suspend, supersede, withdraw, lock, triage, confirm, and submit actions.
- Do not expose generic table CRUD as the domain contract.
- Aggregate updates use optimistic concurrency.
- Integration events expose stable minimum necessary facts.

```text
Examples:

/research-projects
/protocols/{id}/versions
/participants/{id}/consents
/intervention-assignments/{id}/pause
/life-story-items/{id}/visibility
/community-spaces/{id}/posts
/match-preferences/{id}/activate
/match-candidates/{id}/decisions
/mutual-acceptances/{id}
/connections/{id}/pause
/conversation-threads
/conversation-threads/{id}/messages
/messages/{id}/confirm-send
/messages/{id}/delivery-failure
/actors/{id}/block
/moderation-cases/{id}/decide
/safety-signals/{id}/triage
/datasets/{id}/lock
/research-findings/{id}/approve
```

## 147. UX Mapping

- Navigation is generated from effective permission, not role title alone.
- Participant, Supporter, Researcher, Safety, and Administration workspaces use permission-scoped read models.
- UI state labels map to canonical aggregate states.
- Accessible presentation may change wording and sequence but not domain meaning.
- Message Draft, Send Confirmation, queue, send, provider acceptance, delivery and failure remain separate.
- AI entry points are contextual rather than one unrestricted global chat authority.
- Life Story creation distinguishes Draft, Participant Testimony, contribution, verified fact and AI-assisted wording.
- Every LifeStoryItem and SocialPost exposes current Visibility and audience in understandable language.
- Open Matching requires visible opt-in, MatchPreference, MatchCandidate, MatchExplanation and an independent MatchDecision.
- MutualAcceptance is displayed only after the owning aggregate records it.
- Connection activation does not imply Supporter access or unrestricted messaging.
- ConversationThread creation displays or resolves the current CommunicationBasis.
- Block, Report, Mute, Disconnect, visibility change, deletion, appeal and withdrawal are first-class user flows.
- PublicProfile, Community, matching and messaging UX must not expose protected Participant or research fields by default.

---

# Part XII — MVP Canonical Model

## 148. MVP InterventionConfiguration

### Required Core Interventions

- INT-009 — Ability-Adaptive Onboarding and Navigation
- INT-004 — Life Story and Participant-Controlled Personal Archive
- INT-001 — Structured Social Connection
- INT-002 — Interest-Based Connection and Open Matching

### Controlled AI Layer

- INT-003 — optional AI Companion-Facilitated Human Connection under an approved AIInterventionConfigurationVersion

### Controlled Optional Interventions

- INT-005 — Intergenerational Story Sharing
- INT-008 — Participant-Controlled Family and Care Network
- INT-010 — External Memory and Orientation Support

The M03 Relationship, Consent and Permission context remains required whether or not INT-008 is enabled as an intervention.

### Required Social Capabilities

- governed Community;
- PublicProfile where required;
- Open Matching inactive by default;
- MatchExplanation;
- independent MatchDecision;
- MutualAcceptance;
- Connection;
- ConversationThread;
- limited Message Drafting and sending;
- Mute, Disconnect, Block and Report;
- human moderation;
- and SafetySignal routing.

Internet Public is disabled by default.

ConnectionRequest is feature-disabled for the first Pilot.

## 149. MVP Required Aggregate Roots

### Core Required

- UserAccount
- Organisation
- RoleAssignment
- Participant
- LifeStoryArchive
- LifeStoryItem
- LifeStoryExport
- PublicProfile
- CommunitySpace
- CommunityMembership
- SocialPost
- MatchPreference
- MatchCandidate
- MutualAcceptance
- Connection
- ConversationThread
- Message
- BlockRecord
- ModerationCase
- Relationship
- Consent
- ResearchProject
- ResearchQuestion
- Protocol
- ProtocolVersion
- EligibilityDecision
- Enrolment
- Intervention
- InterventionVersion
- InterventionConfiguration
- InterventionAssignment
- InterventionSession
- AssessmentSchedule
- AssessmentRecord
- Observation
- OutcomeRecord
- SafetySignal
- SafetyEvent
- KnowledgeReference
- EvidenceReview
- EvidenceDecision
- EvidenceSnapshot
- AIInteraction
- AIInterventionConfigurationVersion
- DatasetDefinition
- DatasetVersion
- DataQualityIssue
- AnalysisPlan
- AnalysisRun
- InterpretationRecord
- ResearchFinding
- InterventionDecision
- ReviewRequest
- ApprovalRecord
- ExportRequest
- ExternalSubmission

### Controlled Optional or Deferred

- LegacyPreference
- AIConversation
- AIMemoryItem
- ConnectionRequest
- additional CommunitySpace types
- Internet Public publication records where separately approved

## 150. MVP Participant-to-Finding Flow

```text
ResearchProject and ResearchQuestion
        ↓
EvidenceReview, EvidenceDecision and EvidenceSnapshot
        ↓
ProtocolVersion
        ↓
Participant Invitation, Screening and EligibilityDecision
        ↓
Granular Consent
        ↓
Enrolment
        ↓
Ability-Adaptive Onboarding
        ↓
Private Life Story Creation and Participant Confirmation
        ↓
Existing Authorised Contact
or
Governed Community
or
Opt-In Open Matching
        ↓
MatchCandidate and MatchExplanation where Matching is Chosen
        ↓
Independent MatchDecision by Each Participant
        ↓
MutualAcceptance
        ↓
Connection
        ↓
ConversationThread under Current CommunicationBasis
        ↓
Message Draft and Explicit Send Confirmation where Messaging is Used
        ↓
Meaningful Human Interaction
        ↓
Optional AI-Assisted Explanation, Drafting, Translation and Reflection
        ↓
Reflection, Assessment, Moderation and Safety Review
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

An existing authorised contact may complete the intervention without an M18 Connection or Platform Message.

## 151. MVP Explicit Non-Goals


- unmoderated or anonymous public posting without accountability controls;
- default Internet-public exposure;
- matching without explicit opt-in;
- automatic Connection or private messaging without MutualAcceptance and a current CommunicationBasis;
- direct ConnectionRequest activation in the first Pilot;
- unrestricted direct messaging;
- Message search, matching use, AI memory use or research analysis by default;
- hidden or unexplainable compatibility, vulnerability, or capacity scoring;
- matching based on inferred sensitive traits without separately approved consent and governance;
- engagement optimisation designed only to maximise time, reactions, controversy, or dependency;
- family, Supporter, Organisation, or platform ownership of a Participant's Life Story;
- posthumous Life Story access without an effective Legacy Preference or other verified authority;
- cognitive diagnosis;
- medication management;
- emergency response;
- real-time wearable ingestion;
- unrestricted sensor monitoring;
- EHR ownership;
- autonomous multi-agent workflows;
- automatic emotion recognition;
- hidden ability scoring;
- direct public Knowledge Publication by the Research Platform;
- multi-organisation research networks;
- unrestricted secondary data use.

---

# Part XIII — Validation and Testing

## 152. Aggregate Unit Tests

Aggregate tests cover:

- valid and invalid transitions;
- invariant enforcement;
- optimistic concurrency;
- version immutability;
- permission-sensitive commands;
- emitted Domain Events;
- correction and supersession;
- revocation and withdrawal effects;
- LifeStory ownership, contribution, Visibility, export and LegacyPreference;
- MatchDecision actor ownership;
- MutualAcceptance source references, expiry, invalidation and single-use Connection activation;
- ConnectionRequest deferred-state behaviour;
- Connection pause, disconnect and Block effects;
- ConversationThread participant and CommunicationBasis rules;
- Message Draft, Send Confirmation, delivery, failure, retry and withdrawal;
- Block override;
- moderation and appeal;
- and protected audit history.

## 153. Policy Tests

Policy tests cover:

- allowed and denied cases;
- expired or withdrawn Consent;
- revoked Relationship;
- wrong purpose;
- wrong ResourceState;
- AI configuration mismatch;
- Safety restriction;
- self-approval restriction;
- ConflictOfInterest restriction;
- Platform Public versus Internet Public;
- matching opt-in and attribute eligibility;
- prohibited matching attributes;
- candidate expiry;
- independent MatchDecisions;
- Block before MutualAcceptance;
- invalidation before Connection;
- accepted ConnectionRequest producing MutualAcceptance;
- CommunicationBasis at Thread creation and Message send;
- Message attachment policy;
- provider callback authentication;
- moderation authority and appeal;
- LifeStory item-level reuse, download, quotation and sharing;
- and digital-legacy conflict and expiry.

## 154. Cross-Context Contract Tests

Contract tests cover:

- Knowledge Platform ACL;
- identity provider;
- AI model provider;
- communication provider;
- notification provider;
- external data import;
- Domain Event to Integration Event translation;
- UX analytics mapping;
- outbox and inbox idempotency;
- provider delivery callbacks;
- public-content Search or indexing provider;
- media processing and malware scanning;
- external moderation or abuse-signal provider where used;
- Internet Public publication and removal where used;
- Block propagation to M11 AI Context and M16 operations;
- and deletion or withdrawal propagation.

## 155. Research Lineage Test

```text
ResearchQuestion
→ EvidenceDecision
→ ProtocolVersion
→ InterventionConfiguration
→ Enrolment
→ InterventionSession
→ AssessmentRecord
→ DatasetDefinition
→ DatasetVersion
→ DatasetLock
→ AnalysisRun
→ InterpretationRecord
→ ResearchFinding
```

Social and messaging lineage, where included, must additionally preserve:

- exact MatchPreference and MatchCandidate versions;
- MatchDecision references;
- MutualAcceptance;
- Connection and CommunicationBasis;
- ConversationThread and Message process state;
- Consent and purpose at use time;
- Block and moderation state;
- content minimisation;
- and exclusion of Message body by default.

## 156. Safety Test

Test that:

- AI raises a SafetySignal, not a SafetyEvent;
- an authorised reviewer creates or confirms a SafetyEvent;
- moderation and Safety remain separate;
- urgent Message or social concern can link to a SafetySignal;
- pause authority is enforced;
- closure requires rationale;
- and automated detection cannot become a confirmed event without review.

## 157. Life Story Lineage Test

```text
Participant
→ LifeStoryArchive
→ LifeStoryContribution or Participant Draft
→ Participant Review
→ LifeStoryItem Active
→ Item-Level Sharing Policy
→ Community or Public Reference
→ Intervention Exposure
→ Assessment and Outcome
→ DatasetVersion
→ ResearchFinding
```

The test verifies that AI Draft and SupporterContribution do not become ParticipantTestimony without Participant confirmation.

## 158. Matching, MutualAcceptance, Connection and Messaging Test

Test that:

- Open Matching is inactive by default;
- only eligible declared or separately authorised attributes are used;
- MatchExplanation is available;
- MatchDecision belongs to one actor and exact candidate;
- one actor cannot submit the other actor's decision;
- candidate views or AI confidence do not create interest;
- Block excludes candidate delivery and contact;
- compatible decisions create one MutualAcceptance record;
- MutualAcceptance preserves exact source references and policy version;
- expiry, Consent withdrawal or Block can invalidate unused MutualAcceptance;
- one MutualAcceptance activates at most one Connection;
- ConnectionRequest is feature-disabled for the first Pilot;
- an accepted ConnectionRequest, when later enabled, creates MutualAcceptance rather than bypassing it;
- Connection does not create Supporter, care or research authority;
- ConversationThread requires a current CommunicationBasis;
- Thread participants cannot be silently expanded;
- Message Draft does not send;
- Send Confirmation is exact and actor-specific;
- AI cannot confirm or send autonomously;
- Message delivery states remain distinct;
- provider callbacks are authenticated and idempotent;
- Message body is excluded from matching, general Search, AIMemoryItem and ordinary research by default;
- Mute, Disconnect and Block remain distinct;
- removing Block does not restore Connection automatically;
- and Report remains available after Block or Disconnect.

## 159. Moderation Test

Test that:

- UserReports and ContentReports can be submitted;
- Reporter identity is protected;
- triage routes to an authorised Moderator;
- AI or provider signals remain provisional;
- high-impact actions are human-accountable;
- Blocks and urgent restrictions are enforced;
- appeals preserve original history;
- restored content preserves the prior decision trail;
- Message evidence access is minimum necessary;
- and Safety or privacy escalation creates the correct separate record.

# Part XIV — Open Questions

1. Which bounded contexts should share one application module in the MVP?
2. Should ProtocolVersion be independently addressable as an aggregate root in every implementation?
3. Should AIInterventionConfiguration and its versions use separate roots or one versioned aggregate?
4. Which ParticipantProfile fields require independent aggregate protection?
5. Which Relationship types and SpecificPermissions are required for the first Pilot?
6. Which PolicyDecisions require durable storage rather than audit-only storage?
7. Which ReviewDecisions require dual approval?
8. Which Protocol changes automatically require Re-Consent?
9. Which intervention adaptations remain non-material?
10. Which measurement adaptations preserve equivalence?
11. Which SafetySignal types require immediate escalation?
12. Which SafetyEvent classifications are required for the Pilot?
13. Which ResearchKnowledgeGaps should be submitted externally?
14. Which Knowledge Platform version semantics are currently available?
15. Which AI artefact types require mandatory HumanReview?
16. Which AI actions may be low-risk and reversible in the MVP?
17. Which AIMemoryItem types are allowed in the Pilot?
18. Which DataQualityIssues block DatasetLock?
19. Which DatasetDefinition changes require a new DatasetVersion?
20. Which AnalysisOutputs require independent review?
21. Which ResearchFinding approval roles are required?
22. Which external-submission workflows are required in the MVP?
23. Which Domain Events become public Integration Events?
24. Which aggregates require separate encryption or stricter repository access?
25. Which read models are required for each workspace?
26. Which VisibilityScopes are enabled in the first Pilot?
27. Is Internet Public disabled throughout the first Pilot?
28. Which LifeStoryItem types may be shared with Community or Platform Public?
29. Which LifeStory content may be downloaded, quoted, re-shared, translated or included in AI Context?
30. Which contribution types require Participant review before becoming active?
31. Which LegacyPreference options are legally and operationally supportable?
32. Which CommunitySpace types are enabled?
33. Which CommunityRules and moderation service levels apply?
34. Which actors are eligible for PublicProfiles and Open Matching?
35. Which declared attributes may be used for matching?
36. Which attributes remain prohibited even when declared?
37. How are broad location and distance represented without exposing precise location?
38. Which fairness, diversity and accessibility constraints apply to candidate generation?
39. Which MatchExplanation is understandable and sufficient?
40. What candidate limit and expiry apply?
41. Which MatchDecision values are reversible and how is supersession recorded?
42. What effective period applies to MutualAcceptance?
43. Which conditions invalidate unused MutualAcceptance?
44. May a Connection be recreated after Disconnect, and what new basis is required?
45. When, if ever, is ConnectionRequest enabled after the first Pilot?
46. Which approved discovery or invitation bases permit a ConnectionRequest?
47. Which CommunicationBasis types are enabled for Participant messaging?
48. May an existing authorised Relationship create a ConversationThread without an M18 Connection?
49. Are one-to-one and group ConversationThreads both supported?
50. Which Message modalities and attachment types are enabled?
51. Are read receipts disabled by default?
52. What Message retention and deletion rules apply?
53. Which provider callbacks are considered authoritative enough to map to Delivered?
54. Which queued Message effects can be cancelled after Block?
55. Which Message metadata may enter DatasetVersions?
56. Which Message content, if any, requires a separately restricted DatasetDefinition?
57. Which blocking effects must propagate synchronously across modules?
58. Which moderation actions require dual review?
59. Which reports create a SafetySignal, PrivacyIncident or external escalation?
60. Which event migration aliases must be supported and for how long?

---

# Part XV — Design Decisions

1. Document 8 is the authoritative Handbook source for the Research Platform's canonical domain model and ubiquitous language.
2. The domain model is independent of database, API, UI and deployment structure.
3. The Healthy Aging Knowledge Platform remains an external authoritative system.
4. The Healthy Aging Knowledge Graph is a capability inside the Knowledge Platform.
5. The Research Platform stores KnowledgeReferences, EvidenceDecisions, EvidenceSnapshots and local ResearchKnowledgeGaps.
6. Participant is the canonical person actor.
7. Older Adult is a population description.
8. Resident is a setting-specific description.
9. Supporter is an authorised Relationship role.
10. Relationship type does not grant access.
11. OrganisationMembership does not grant Participant-data access.
12. Consent is distinct from RoleAssignment, Relationship permission, Delegation and SpecificPermission.
13. Effective Permission uses Role, Relationship, Consent, Purpose, Context, SpecificPermission and ResourceState.
14. AI permission is the intersection of human permission and AI-specific configuration, task, Tool, data and risk controls.
15. Supported decision-making is distinct from SubstituteAuthority.
16. SubstituteAuthority requires a verified authority basis and decision scope.
17. A stable concept and its approved versions are separate domain objects.
18. ProtocolVersion and InterventionVersion are immutable after approval.
19. Material amendment creates a new version.
20. ResearchProject lifecycle state and operational phase are separate.
21. Intervention lifecycle maturity and InterventionVersion state are separate.
22. Workflow-task state and artefact state are separate.
23. EvidenceDecision outcome uses the canonical vocabulary from Document 2.
24. EvidenceReview state is separate from EvidenceDecision outcome.
25. EvidenceStatus is separate from EvidenceDirection.
26. ResearchKnowledgeGap is distinct from an externally authoritative Knowledge Gap.
27. EvidenceSnapshot is an Entity, not a Value Object.
28. AIConversation is an optional interaction container, not the primary AI authority boundary.
29. AIInteraction is the primary unit of AI traceability.
30. AI output EpistemicType, ArtefactType, ReviewStatus, ApprovalStatus and SafetyClassification are separate.
31. AI may capture an explicitly provided Participant response only with source and confirmation provenance.
32. AI may raise a SafetySignal but may not confirm a SafetyEvent.
33. SafetySignal and SafetyEvent are separate aggregate roots.
34. SafetyEventDetected is not a canonical event.
35. Assessment response, Observation, OutcomeRecord, AnalysisOutput, InterpretationRecord and ResearchFinding are separate concepts.
36. Observation and interpretation remain distinguishable.
37. Missing data is not zero and preserves reason.
38. DatasetDefinition and DatasetVersion are separate.
39. DatasetLock is a human-authorised immutable transition.
40. Correction after DatasetLock creates a new DatasetVersion.
41. AnalysisPlan, AnalysisRun, AnalysisOutput, InterpretationRecord and ResearchFinding are separate.
42. ResearchFinding approval state is separate from scientific direction.
43. External submission and publication are separate from ResearchFinding state.
44. External publication does not mutate the local ResearchFinding.
45. InterventionDecision is a separate human-approved aggregate.
46. Null, negative, mixed, harmful, inconclusive and implementation-failure findings remain visible.
47. Repositories are defined for aggregate roots.
48. A generic ResearchRepository must not own all research records.
49. Cross-context workspaces use read models rather than cross-domain write ownership.
50. Domain Events use past tense and identify aggregate and version.
51. Domain, Integration, Operational, Audit and UX Analytics Events are distinct.
52. External systems are isolated through Anti-Corruption Layers.
53. Identity-provider claims do not automatically create domain roles.
54. Model-provider state is not the system of record.
55. Communication-provider state is not the system of record.
56. Imported data preserves external authority and provenance.
57. The MVP supports the complete ResearchQuestion-to-ResearchFinding loop.
58. The MVP uses permission-scoped Participant, Researcher, Supporter, Moderator, Safety and Administration views.
59. Life Story and Personal Archive is required for the first MVP.
60. Governed Community is required for the first MVP under Participant-controlled Visibility and moderation.
61. Open Matching is required for the first MVP through opt-in preferences, explainability, independent decisions, MutualAcceptance, Block, Report and Safety controls.
62. Identity and Life Story and Community and Social Connection are first-class bounded contexts.
63. Private is the default Life Story and social-content Visibility.
64. Platform Public is distinct from Internet Public.
65. Internet Public requires separate explicit Consent and publication safeguards.
66. A LifeStoryContribution does not transfer ownership.
67. ParticipantTestimony is distinct from verified historical fact.
68. AI may assist Life Story capture but may not invent memories or present Draft wording as ParticipantTestimony.
69. LegacyPreference is explicit and cannot be inferred from family Relationship.
70. Open Matching does not mean automatic Connection or private messaging.
71. MatchPreference is Participant-controlled and Open Matching is inactive by default.
72. MatchCandidate is temporary, purpose-bound, explainable and not a MatchDecision, MutualAcceptance, Connection or CommunicationBasis.
73. MatchDecision is independently owned by the deciding actor.
74. MatchDecision cannot be inferred from profile views, Community activity or AI confidence.
75. MutualAcceptance is a canonical M18 aggregate root.
76. MutualAcceptance references exact source MatchDecisions or accepted ConnectionRequest, actor pair, purpose, policy version and effective period.
77. MutualAcceptance requires current eligibility, Consent, no Block and non-expired source records.
78. Unused MutualAcceptance may expire or be invalidated.
79. One MutualAcceptance activates at most one Connection unless an explicitly approved policy states otherwise.
80. ConnectionRequest is a Deferred Alternative Connection Basis.
81. ConnectionRequest is not part of Open Matching.
82. ConnectionRequest is feature-disabled for the first Pilot.
83. Accepted ConnectionRequest creates MutualAcceptance and does not bypass it.
84. Connection is activated only from valid MutualAcceptance.
85. Connection does not automatically create a Supporter Relationship, care authority, Consent, research permission or private Life Story access.
86. Existing authorised contacts may complete an intervention without an M18 Connection.
87. CommunicationBasis is required before ConversationThread creation or Message send.
88. CommunicationBasis may reference an active Connection, authorised Relationship, approved InterventionSession, moderated Community context or another governed basis.
89. ConversationThread is a canonical M18 aggregate root.
90. ConversationThread records exact participants, purpose, CommunicationBasis and lifecycle.
91. ConversationThread does not create or broaden Connection, Relationship, Consent or permission.
92. Message is a canonical M18 aggregate root.
93. Message Draft is not a sent Message.
94. Message Draft, SendConfirmation, queue, send, provider acceptance, delivery, read, failure and withdrawal are separate facts.
95. SendConfirmation is actor-specific, Message-version-specific and recipient-specific.
96. AI cannot autonomously confirm or send a Message.
97. A Message may enter delivery only after current permission, CommunicationBasis, Block, ResourceState and attachment checks.
98. Message provider callbacks require authentication, idempotency and canonical state translation.
99. Message retries preserve one logical Message and separate DeliveryAttempts unless a new Message is created.
100. Message attachments require approved type, size, malware scanning, storage and retention policy.
101. Message body is excluded by default from general Search, Vector retrieval, matching, Community ranking, AIMemoryItem and ordinary research analysis.
102. Message-content analysis requires explicit Consent, Purpose, DatasetDefinition, minimisation and governance.
103. Mute, Disconnect and Block are distinct.
104. BlockRecord overrides discovery, matching, MutualAcceptance, Connection activation, ConversationThread creation, Message send, notification and AI Context according to policy.
105. Removing Block does not automatically restore matching, MutualAcceptance, Connection or ConversationThread.
106. Report remains available after Block or Disconnect.
107. ModerationCase, ModerationDecision, SafetySignal and SafetyEvent are separate concepts.
108. Reporter identity is protected by default.
109. High-impact moderation remains human-accountable.
110. Provider and AI moderation signals remain provisional.
111. Public, Community, matching, Connection, Message and engagement counts are process measures, not Healthy Aging outcomes by themselves.
112. Ranking and matching may not optimise only for attention, controversy, reactions or dependency.
113. SocialPosts referencing Life Story content remain subject to source sharing and reuse policy.
114. Wearables and broad clinical functionality remain outside the first MVP unless separately approved.
115. Document 6 should align modules with the bounded contexts defined here.
116. Document 7 should align workspaces and navigation with canonical actors, permissions, aggregates and state machines.
117. Documents 9–12 should refine, not redefine, this model.
118. Documents 13–17 should implement runtime, security, interface, storage and AI operations without changing domain meaning.
119. Documents 18–20 should use the M18 formation and messaging model defined in v3.2.
120. The canonical term for active review is In Review.
121. Historical and superseded records remain traceable.
122. BlockCreated is the canonical block event; ActorBlocked is a deprecated alias.
123. UserReportSubmitted and ContentReportSubmitted are canonical report events.
124. MessageDelivered is the canonical delivery fact; MessageDeliveryConfirmed is a deprecated alias.
125. DatasetVersionLocked is the canonical M12 lock event; DatasetLockConfirmed is a UX interaction alias.
126. Version 3.2 resolves HC-002 by assigning ConversationThread and Message to M18.
127. Version 3.2 resolves HC-003 by making MutualAcceptance an explicit aggregate root.
128. Version 3.2 resolves HC-004 by retaining ConnectionRequest as a deferred alternative basis that still produces MutualAcceptance.

## 160. Summary

The canonical domain sequence is:

```text
Identity and Organisation
        ↓
Participant and Preference
        ↓
Relationship, Consent and Permission
        ↓
ResearchProject, ResearchQuestion and ProtocolVersion
        ↓
Eligibility, Consent and Enrolment
        ↓
InterventionVersion and InterventionConfiguration
        ↓
Assignment, Session, Exposure, Adaptation and Fidelity
        ↓
Private Life Story and Participant Confirmation
        ↓
Governed Community or Open Matching
        ↓
Independent MatchDecisions
        ↓
MutualAcceptance
        ↓
Connection
        ↓
ConversationThread and Message
        ↓
Assessment, Observation, Outcome, Moderation and Safety
        ↓
DatasetDefinition, DatasetVersion and DatasetLock
        ↓
AnalysisPlan, AnalysisRun and InterpretationRecord
        ↓
ResearchFinding
        ↓
InterventionDecision
        ↓
ExternalSubmission and Knowledge Improvement
```

The canonical Open Matching boundary is:

```text
MatchCandidate
    ≠ MatchDecision
    ≠ MutualAcceptance
    ≠ Connection
```

The canonical communication boundary is:

```text
Connection
or
Another Approved CommunicationBasis
        ↓
ConversationThread
        ↓
Message Draft
        ↓
SendConfirmation
        ↓
Queued
        ↓
Sent
        ↓
Provider Accepted
        ↓
Delivered or Failed
```

The canonical authority boundary is:

```text
AI Draft
    ≠ ParticipantTestimony
    ≠ MatchDecision
    ≠ MutualAcceptance
    ≠ Connection
    ≠ Sent Message
    ≠ ModerationDecision
    ≠ SafetyEvent
    ≠ DatasetLock
    ≠ ResearchFinding
```

Cross-cutting capabilities are Evidence and Knowledge Integration, AI Companion, Safety and Escalation, Governance and Audit, and Integration and Operations.

Participant-facing core intervention contexts include Identity and Life Story and Community and Social Connection.

> One concept must not change meaning as it moves from intervention design to Participant experience, AI assistance, API, event, database, provider, analysis, report or external submission.

Version 3.2 provides the canonical M18 foundation required to revalidate Documents 12, 13, 15, 16, 18, 19 and 20.
