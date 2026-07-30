# Document 14 — Security, Privacy & Consent Architecture

**Version:** 1.1  
**Status:** Revised Security, Privacy and Consent Architecture Baseline  
**Handbook Volume:** Volume II — Technical Architecture  
**Primary System:** Digital Intervention Research Platform  
**Primary Product Modules:** M01–M18  
**Document Owner:** Security, Privacy and Consent Governance  
**Approved By:** To be assigned  
**Last Updated:** 2026-07-29  
**Supersedes:** Document 14 — Security, Privacy & Consent Architecture v1.0  
**Review Trigger:** A material change to identity, authentication, session security, authorisation, Consent, delegated or substitute authority, Public Profile, Life Story sharing, Community or Internet visibility, Open Matching, Connection, messaging, block, report, moderation, Safety Signal or Safety Event workflows, AI context or providers, data classification, encryption, research datasets, exports, devices, external processing, incident response, Participant rights, or applicable legal and regulatory obligations

---

## 1. Purpose

This document defines the **Security, Privacy & Consent Architecture** of the **Healthy Aging Digital Intervention Research Platform**.

It translates the product, domain, research, evidence, AI, data and technical requirements established in Documents 0–13 into enforceable runtime controls.

The architecture is intended to ensure that:

- only authenticated and authorised actors, services and devices can access Platform capabilities;
- access is limited by role, relationship, Consent, purpose, context, Specific Permission and Resource State;
- visibility, classification, authorship, research use and publication authority remain separate;
- Participants can understand and control Life Story, Community, Open Matching, Connection, messaging, AI memory, research use, export and withdrawal;
- Supporter, Professional Caregiver, Moderator, researcher and administrator access remains purpose- and scope-bound;
- Block, Mutual Acceptance, Community Rules and communication basis are enforced deterministically;
- AI providers receive only minimum-necessary, permission-filtered context;
- AI cannot directly mutate domain state, approve governed artefacts, create a Connection, impose high-impact moderation or confirm a Safety Event;
- Safety Signal, Safety Event, Moderation Case, Privacy Incident, AI Incident and Technical Incident remain separate;
- research data, locked Dataset Versions, Analysis Runs and Research Findings remain reproducible and accountable;
- external providers, devices, exports and integrations remain governed;
- security and privacy incidents are detectable, containable, reviewable and recoverable;
- and technical administration cannot silently become research, evidence, Consent, publication, moderation or safety authority.

The central principle is:

> Security, privacy and Consent are not separate compliance features. They are runtime conditions that determine whether a Platform action is permitted, which data may be used, and which human authority is required.

---

## 2. Scope

This document covers:

- security and privacy objectives;
- protected assets and trust boundaries;
- threat modelling and risk treatment;
- identity, authentication, account recovery and session security;
- workforce, Service Account and device identity;
- authorisation, field-level access and protected existence;
- role-, Organisation-, Research Project-, Relationship- and Connection-aware access;
- Consent, assent, supported decision-making, Delegation and substitute authority;
- purpose limitation and Specific Permission;
- Resource State, visibility and publication enforcement;
- Participant Profile, Public Profile and AI memory boundaries;
- Life Story authorship, contribution, sharing, third-party rights and Legacy Preference;
- Community, Open Matching, Match Candidate, Mutual Acceptance, Connection and messaging controls;
- mute, disconnect, Block, User Report, Content Report, moderation, appeal and restoration;
- Safety Signal, Safety Event, Privacy Incident, AI Incident and Technical Incident boundaries;
- data classification, minimisation, encryption, key and secrets management;
- application, API, web, mobile, service and integration security;
- Knowledge Platform security;
- AI provider security, prompt-injection defence, context isolation, tool control and AI auditability;
- research datasets, Dataset Lock, analytical environments, exports and external submission;
- files, media, transcription, translation, devices and de-identification;
- audit, monitoring, vulnerability management and secure delivery;
- Participant rights, retention, deletion, legal or research holds and external-copy handling;
- incident response, breach handling, continuity and break-glass access;
- vendor, privileged-access and operational security;
- security acceptance criteria, metrics and degraded modes;
- MVP security scope;
- deferred capabilities and future evolution.

This document does not provide:

- jurisdiction-specific legal advice;
- final legal notices or Consent wording;
- final Privacy Impact Assessments;
- final data-processing agreements;
- final cloud-provider configuration;
- final cryptographic parameter selection;
- final penetration-test procedures;
- or final incident, breach and disaster-recovery runbooks.

Those artefacts must be derived from this architecture and reviewed by appropriate legal, privacy, security, research, ethics, safety, moderation and operational authorities.

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
- Document 8 — Core Domain Model & Ubiquitous Language v3.1
- Document 9 — Evidence & Knowledge Integration Architecture v1.1
- Document 10 — AI Companion Architecture v1.1
- Document 11 — Research & Evaluation Framework v1.1
- Document 12 — Data & Interoperability Architecture v1.1
- Document 13 — System Context & Technical Architecture v1.1

### Provides input to

- Document 15 — API, Event & Integration Specifications revision
- Document 16 — Database & Storage Design revision
- Document 17 — AI Orchestration & Model Operations revision
- Document 18 — MVP Scope & Delivery Roadmap revision
- Document 19 — Initial Pilot Research Protocol revision
- Document 20 — UX Flows & Design System Specification revision
- Threat Model
- Privacy Impact Assessment
- Data Protection and Retention Policy
- Access Control Standard
- Consent Implementation Standard
- Community Safety and Moderation Standard
- Incident Response and Breach Plan
- Vendor Security Review
- Security Test Plan
- Privileged Access Standard
- Data Export and External Sharing Standard

### Authority Hierarchy

| Subject | Authority |
|---|---|
| Actors, relationships and effective permission | Document 4 |
| Aggregate ownership and state | Document 8 |
| AI capability and action limits | Document 10 |
| Safety, Dataset and research approval lifecycle | Document 11 |
| Data authority, classification, visibility and lineage | Document 12 |
| Runtime and technical placement | Document 13 |
| Security, privacy and Consent controls | Document 14 v1.1 |

---

## 4. Security and Privacy Objectives

### 4.1 Confidentiality

Sensitive information is accessible only to actors, services and processes with a current permitted purpose and minimum-necessary scope.

### 4.2 Integrity

Identity, Consent, Relationship, visibility, Block, Protocol, intervention, matching, moderation, safety, dataset, analysis, finding, export and audit records cannot be altered without authorised domain transitions and traceability.

### 4.3 Availability

Critical Participant-control, safety and governance workflows remain available or fail safely.

### 4.4 Authenticity

The Platform can verify human, service, device and external-system identity and distinguish actor-authored, Participant-confirmed, AI-generated and imported data.

### 4.5 Accountability

Material actions are attributable to an individual actor or controlled Service Account with purpose, context and version.

### 4.6 Consent Fidelity

The Platform enforces the Participant's current Consent version, restrictions, expiry, withdrawal and approved purpose.

### 4.7 Purpose Limitation

Data collected, visible or available for one purpose are not silently reused for another purpose.

### 4.8 Data Minimisation

Only the minimum necessary data are collected, retained, displayed, indexed, embedded, analysed, exported or sent to external and AI providers.

### 4.9 Participant Autonomy

Participants retain understandable control over intervention participation, Life Story, sharing, visibility, matching, Connections, messages, AI memory, research use, export, withdrawal and deletion where applicable.

### 4.10 Research Integrity

Controls preserve Evidence Snapshots, Protocol Versions, Intervention Versions, Dataset Locks, Analysis Plans, Analysis Runs, Interpretation Records and Research Findings.

### 4.11 Safety Integrity

Automated detection creates a Safety Signal. Safety Event confirmation, serious action and closure require authorised human workflow.

### 4.12 Moderation Integrity

Provider or AI classifications remain provisional. High-impact Moderation Decisions and appeals remain human-accountable.

### 4.13 Public-Surface Integrity

Platform Public and Internet Public publication are explicit, reviewable, revocable where possible and protected against scraping, enumeration, impersonation and hidden audience expansion.

### 4.14 Human Authority

Automation and AI do not acquire Consent, scientific, clinical, evidence, publication, matching, moderation, Dataset Lock or safety authority.

---

## 5. Security Design Principles

1. Deny by default.
2. Least privilege.
3. Minimum necessary data.
4. Explicit purpose.
5. Current Consent.
6. Participant control.
7. Permission before data assembly.
8. Deterministic critical controls.
9. One accountable write owner.
10. Separation of duties.
11. Zero implicit trust.
12. Defence in depth.
13. Protected existence.
14. Secure and transparent failure.
15. Accessible security.
16. No dark patterns.
17. Immutable approved records.
18. Source and authorship integrity.
19. Audit without unnecessary content.
20. Measured complexity.

Security controls must remain proportionate to risk and usable by Participants with different cognitive, visual, motor, hearing, language, literacy and digital-access needs.

---

## 6. Protected Assets

### 6.1 Identity and Authority Assets

- UserAccount and authentication identity;
- Organisation and memberships;
- RoleAssignment;
- Relationship and Delegation;
- Consent and Consent evidence;
- supported-decision-making and substitute-authority records;
- PolicyDecision;
- Block and restriction state;
- and Service Account credentials.

### 6.2 Participant Assets

- ParticipantProfile and AccessibilityProfile;
- contact and communication preferences;
- assessments, observations and outcomes;
- intervention assignments and exposure;
- Safety Signals and Safety Events;
- AI conversations and AIMemoryItems;
- Life Story content, media, attribution and Legacy Preference;
- Public Profile;
- Community participation and social content;
- Match Preferences, Match Candidates and Match Decisions;
- Connections and messages;
- User Reports and Content Reports;
- device and sensor data;
- and Participant rights requests.

### 6.3 Research Assets

- Research Questions;
- EvidenceReview, EvidenceDecision and EvidenceSnapshot records;
- Protocol Versions;
- Intervention and AI configurations;
- eligibility and Enrolment;
- Dataset Definitions and locked Dataset Versions;
- Analysis Plans, code, environments and Analysis Runs;
- Interpretation Records and Research Findings;
- reports, Evidence Packages and external submissions;
- and reproducibility artefacts.

### 6.4 Governance Assets

- ApprovalRecords;
- ConflictOfInterest records;
- Safety and moderation decisions;
- appeal and restoration records;
- privacy reviews;
- audit records;
- security incidents;
- and policy and provider decisions.

### 6.5 Technical Assets

- credentials and cryptographic keys;
- source code and dependencies;
- CI/CD and deployment pipelines;
- infrastructure configuration;
- databases, objects, indexes and backups;
- logs, metrics and traces;
- provider accounts;
- and recovery material.

---

## 7. Trust Boundaries

```text
Participant or Workforce Device
        ↓
Client Application or PWA
        ↓
Managed Edge and Web Application Firewall
        ↓
API Edge and Permission-Aware Composition
        ↓
M01–M18 Application and Domain Modules
        ↓
Transactional, Object, Queue, Search and Analytical Stores
```

External boundaries include:

```text
Research Platform
    ↔ Identity and Directory Provider
    ↔ Healthy Aging Knowledge Platform
    ↔ AI Model Provider
    ↔ Media, Transcription and Translation Provider
    ↔ Communication Provider
    ↔ Moderation or Abuse-Detection Provider
    ↔ Device and Wearable Platform
    ↔ Research and Analytics Environment
    ↔ External Care or Service System
    ↔ Export Recipient or External Repository
```

Every trust boundary defines:

- authenticated identity and workload identity;
- authorisation and purpose;
- Consent and Resource State where applicable;
- encryption;
- Data Classification and allowed fields;
- visibility and public-surface behaviour;
- schema and version;
- input and output validation;
- rate and abuse limits;
- logging and audit;
- retention, deletion and provider data use;
- timeout, retry and circuit breaking;
- ownership and incident contact;
- and degraded behaviour.

---

## 8. Threat Model

Representative threats include:

- credential theft and account takeover;
- insecure recovery and Supporter-assisted takeover;
- session theft, fixation or replay;
- privilege escalation;
- cross-Organisation or cross-Research-Project access;
- Consent bypass or stale Consent cache;
- misuse of Relationship, Delegation or substitute authority;
- treating a Connection as Supporter authority;
- Block bypass or protected-account enumeration;
- hidden visibility expansion from Private or Community to Platform Public or Internet Public;
- scraping, media harvesting and social-graph extraction;
- impersonation, fake profiles and fake social proof;
- malicious matching, sensitive-trait inference and discriminatory candidate exposure;
- harassment, coercion, fraud, scams and unwanted contact;
- unauthorised message access or delivery;
- reporter identification or retaliation;
- moderation abuse, backlog manipulation or appeal suppression;
- Safety Signal suppression or improper conversion to Safety Event;
- insecure direct object reference and mass assignment;
- injection, cross-site scripting and malicious upload;
- data exfiltration and bulk export;
- insider misuse and administrative overreach;
- AI prompt injection and tool abuse;
- cross-Participant, cross-project or cross-purpose AI leakage;
- AI-generated false action confirmation;
- invented Life Story details or false Participant Testimony;
- hidden AI memory retention;
- fabricated citations and unsafe AI output;
- model-provider retention, training use or cross-border processing;
- compromised Knowledge, communication, moderation, media, device or care integration;
- search or vector-index permission drift;
- deletion, withdrawal or Block propagation failure;
- research-data tampering or Dataset Lock bypass;
- Analysis Run or Research Finding manipulation;
- audit-log alteration;
- re-identification from free text, multimedia, location or social graph;
- denial of service against consent, block, report, safety or moderation controls;
- supply-chain compromise;
- and inaccessible security controls that exclude or pressure Participants.

Representative threat actors include:

- anonymous attacker;
- automated scraper or malicious bot;
- scammer, harasser or impersonator;
- compromised Participant, Supporter, researcher or workforce account;
- abusive or unauthorised Supporter;
- abusive Connection or Community member;
- over-privileged Moderator or administrator;
- malicious insider;
- compromised provider or integration;
- compromised device;
- external recipient misusing an export;
- and supply-chain attacker.

---

## 9. Risk Assessment and Treatment

Security and privacy risk is assessed using:

- likelihood;
- impact;
- identifiability and sensitivity;
- number and vulnerability of affected people;
- autonomy and dignity impact;
- safety impact;
- public or social exposure;
- moderation and fraud impact;
- research integrity impact;
- provider and jurisdiction risk;
- detectability;
- containment;
- reversibility;
- and recovery.

Risk treatment may be:

- Avoid;
- Reduce;
- Transfer;
- Accept;
- or Defer.

Risk acceptance requires:

- accountable owner;
- documented rationale;
- affected systems and data;
- residual risk;
- compensating controls;
- Participant and research implications;
- review date;
- and approval.

High-risk processing may require a Privacy Impact Assessment, threat model, ethics or safety review, or independent security review.

---

## 10. Identity Architecture

The Platform recognises:

- human user identity;
- Organisation identity;
- Service Account identity;
- device identity;
- and external-system identity.

A managed identity provider may perform authentication.

M01 remains authoritative for:

- UserAccount;
- Organisation;
- OrganisationMembership;
- RoleAssignment;
- ServiceAccount;
- account lifecycle;
- external identity linkage;
- and Platform-specific identity state.

External identities map to stable, opaque Platform identifiers.

Identity attributes used for authorisation must come from controlled sources and remain versioned or auditable.

Potential duplicate identities must not be automatically merged where a mistake could expose content, bypass a Block, corrupt Life Story attribution, create an invalid Connection, or damage research lineage.

---

## 11. Account Lifecycle and Recovery

### 11.1 Account States

Representative account states include:

- Invited;
- Active;
- Recovery Pending;
- Restricted;
- Suspended;
- Closed;
- and Archived.

Account state is separate from Enrolment, Community membership, matching state and Resource State.

### 11.2 Recovery

Recovery must balance security, accessibility and Participant autonomy.

Recovery may use:

- passkey or recovery credential;
- verified email or phone;
- assisted recovery with independent checks;
- Supporter assistance without automatic authority transfer;
- or workforce review for high-risk cases.

### 11.3 Recovery Protections

Recovery must resist:

- SIM-swap and mailbox compromise;
- social engineering;
- unauthorised Supporter takeover;
- shared-device misuse;
- predictable knowledge questions;
- and administrator override without review.

### 11.4 Recovery Consequences

High-risk recovery may trigger:

- session revocation;
- notification through an independent channel;
- temporary restriction on export, Internet Public publication or role change;
- review of recent security-sensitive actions;
- and audit.

### 11.5 Account Closure

Account closure is distinct from:

- research withdrawal;
- intervention withdrawal;
- Community departure;
- matching pause;
- Connection disconnect;
- Life Story deletion;
- and Consent withdrawal.

The Platform must present and process each choice explicitly.

---

## 12. Authentication Architecture

Authentication may use:

- passkey;
- password;
- one-time code;
- authenticator application;
- hardware key;
- federated identity;
- or an accessible equivalent approved for the actor and risk.

MFA is required for privileged and high-impact roles, including:

- System Administrator;
- Security Administrator;
- Organisation Administrator with role-management authority;
- Research Approver;
- Safety Reviewer with Event decision authority;
- Moderator with high-impact restriction authority;
- Privacy Reviewer;
- identifiable-data exporter;
- Dataset Lock approver;
- and external-submission approver.

Participant authentication balances:

- account security;
- accessibility;
- cognitive and motor burden;
- device availability;
- shared-device risk;
- language;
- and recovery risk.

Sensitive actions may require step-up authentication, including:

- identifiable or high-risk export;
- Internet Public publication;
- privileged role change;
- identity merge;
- break-glass access;
- substitute-authority change;
- sensitive matching-policy change;
- provider configuration;
- and security-setting change.

Authentication strength is recorded in request and audit context.

---

## 13. Session Security

Sessions preserve:

- UserAccount ID;
- Organisation;
- active role and scope;
- authentication strength;
- issued and last-active time;
- expiry;
- device and client context;
- purpose context where applicable;
- and revocation state.

Session protections include:

- bounded lifetime;
- idle timeout appropriate to role and accessibility;
- secure token or cookie storage;
- cross-site request protection;
- token rotation where applicable;
- revocation after account, role, Relationship, Block or permission change;
- re-authentication for sensitive actions;
- and clear expiry and recovery behaviour.

Shared-device mode should:

- minimise local storage;
- hide sensitive previews;
- avoid persistent Participant switching;
- provide visible sign-out;
- and clear cached sensitive data.

Session continuation during identity-provider outage is bounded by authentication strength, session age, actor role, action risk and current revocation information.

---

## 14. Service, Device and Integration Identity

### 14.1 Service Accounts

Service Accounts use:

- unique workload identity;
- minimum scopes;
- short-lived credentials where possible;
- explicit owning module and purpose;
- rotation;
- non-interactive authentication;
- and audit.

A Service Account cannot inherit a human actor's full authority merely because it processes that actor's request.

### 14.2 Delegation Context

Background jobs and integrations preserve the initiating actor, purpose, resource and approval where relevant.

### 14.3 Device Identity

Device identity may include:

- device record;
- assignment;
- cryptographic or provider identity;
- model and firmware;
- status;
- and last verified time.

Device identity does not prove that a measurement belongs to a Participant without a current authorised assignment.

### 14.4 External Systems

Each external integration uses a unique identity, endpoint allowlist, credential, purpose, data scope and incident contact.

---

## 15. Canonical Authorisation Model

The canonical human permission decision is:

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

Additional deterministic domain inputs may include:

- Organisation and Research Project assignment;
- ownership or authorship;
- visibility;
- Community membership and Community Rule version;
- Open Matching state;
- Match Candidate eligibility;
- Mutual Acceptance;
- Connection and communication basis;
- Block, mute, disconnect or account restriction;
- Data Classification;
- approval;
- authentication strength;
- time;
- and action risk.

A policy decision returns one of:

- Permit;
- Deny;
- Permit with Conditions;
- Confirmation Required;
- Step-Up Authentication Required;
- Human Review Required;
- or Approval Required.

A decision record may include:

- policy and rule version;
- actor and active role;
- purpose and context;
- resource and version;
- evaluated inputs;
- result and conditions;
- reason code;
- freshness;
- and trace identifier.

---

## 16. Enforcement Architecture

Security enforcement occurs at:

- client discoverability;
- API edge and Backend-for-Frontend;
- application command and query;
- domain policy and invariant;
- repository query and projection;
- object and media delivery;
- search and vector retrieval;
- background job;
- event-detail retrieval;
- AI context assembly;
- AI tool execution;
- Dataset generation;
- analytical access;
- export;
- and external adapter.

The client improves usability but is never the security authority.

The MVP may use a central policy-evaluation component inside the modular backend, combined with owning-module domain policies.

The policy component must not become the owner of Consent, Relationship, Block, Match Decision, Safety Event, Moderation Decision or another domain aggregate.

---

## 17. Field-Level, Row-Level and Existence Protection

### 17.1 Purpose-Specific Projection

Different actors may receive different projections of the same aggregate.

### 17.2 Field Protection

Sensitive fields may be:

- omitted;
- masked;
- tokenised;
- encrypted separately;
- transformed;
- or exposed only after step-up authentication or review.

### 17.3 Row and Resource Protection

Queries apply Organisation, Research Project, Participant, relationship, ownership, visibility, Block and Resource State filters before returning records.

### 17.4 Protected Existence

The Platform may avoid confirming whether a protected person, Life Story Item, Match Candidate, report, Safety Event or research record exists.

### 17.5 Counts and Badges

Counts must not reveal protected existence, blocked actors, hidden content, reporter identity or restricted project activity.

### 17.6 Error Behaviour

Unauthorised, nonexistent and blocked resources may use consistent response behaviour where distinction would create disclosure.

### 17.7 Search and AI

Field and existence protection applies before search ranking, vector retrieval, recommendation and AI context assembly.

---

## 18. Role-, Organisation- and Research-Scoped Access

Representative roles include:

- Participant;
- Supporter;
- Informal Caregiver;
- Professional Caregiver;
- Researcher;
- Research Coordinator;
- Research Approver;
- Evidence Reviewer;
- Safety Reviewer;
- Moderator;
- Privacy Reviewer;
- Organisation Administrator;
- System Administrator;
- Security Administrator;
- and authorised Service Account.

Role assignments preserve:

- role;
- Organisation;
- Research Project;
- scope;
- assigner;
- approval;
- start and expiry;
- conditions;
- and audit.

A project role does not silently become Organisation- or system-wide access.

Technical administrator status does not grant:

- Participant-content access;
- research approval;
- Evidence Decision authority;
- Consent authority;
- Life Story ownership;
- moderation authority;
- publication authority;
- Dataset Lock authority;
- or Safety Event authority.

---

## 19. Relationship, Delegation and Authority

### 19.1 Relationship

Relationship state may include:

- Proposed;
- Pending;
- Active;
- Suspended;
- Revoked;
- Expired;
- or Ended.

Relationship alone does not grant access.

### 19.2 Supporter

Supporter access requires:

- active Relationship;
- compatible Consent;
- defined purpose;
- Specific Permission;
- applicable resource;
- and current Resource State.

### 19.3 Delegation

Delegation defines:

- delegator;
- delegate;
- scope;
- purpose;
- duration;
- restrictions;
- revocation;
- and audit.

### 19.4 Supported Decision-Making

Supported decision-making allows assistance without silently replacing Participant authority.

The Platform records:

- who assisted;
- how;
- which information was presented;
- whose decision was recorded;
- and whether assistance affected authorship or interpretation.

### 19.5 Substitute Authority

Substitute authority requires separately verified:

- legal or governance basis;
- actor;
- scope;
- effective time;
- review;
- limitations;
- and Participant assent where applicable.

Family, friendship, Supporter status, Connection or Professional Caregiver role does not create substitute authority.

### 19.6 Revocation

Relationship, Delegation and authority revocation:

- stops future access;
- invalidates sessions or permission caches where required;
- removes data from AI context;
- stops notifications and tasks where applicable;
- updates Resource State;
- and preserves historical audit.

---

## 20. Connection and Social Authority Boundary

A `Connection` is a mutually accepted social relationship within M18.

A Connection does not create:

- Supporter authority;
- access to Participant Profile;
- access to private Life Story;
- assessment or safety access;
- research participation;
- Consent;
- care authority;
- substitute authority;
- or external sharing authority.

Connection and communication access require:

- active Connection or another valid communication basis;
- no active Block;
- current account and Resource State;
- applicable Community or message rules;
- and permitted purpose.

Disconnect ends or pauses Connection state but does not replace Block or Report.

---

## 21. Block, Mute and Disconnect Enforcement

### 21.1 Block Record and Effects

A `BlockRecord` is the authoritative M18 enforcement record.

A Block may prevent:

- people discovery;
- Public Profile visibility;
- Match Candidate generation;
- connection requests;
- messages;
- mentions;
- notifications;
- content delivery;
- and AI-assisted suggestion involving the blocked actor.

### 21.2 Deterministic Enforcement

Block is enforced before:

- database and projection query;
- search and ranking;
- vector retrieval;
- candidate generation;
- notification;
- AI context;
- and tool execution.

### 21.3 Report Availability

Block or disconnect does not prevent an actor from submitting a report about prior conduct where policy permits.

### 21.4 Protected Existence

The blocked actor should not receive information that reveals whether the other actor exists, is active, has viewed content or has changed settings.

### 21.5 Propagation

Block propagation reaches:

- active sessions and permissions;
- search and vector indexes;
- matching queues;
- Connection and messaging;
- notification and feed projections;
- AI memory and context where necessary;
- and caches.

### 21.6 Failure

If Block enforcement cannot be verified, discovery, matching and communication should fail closed.

---

## 22. Consent Architecture

Consent is a versioned, time-bound, purpose-specific M03 aggregate.

Consent scope may separately cover:

- research participation;
- intervention delivery;
- assessment and observation;
- device and sensor collection;
- AI interaction;
- AIMemoryItem storage;
- voice, image or video recording;
- transcription and translation;
- Life Story capture;
- Supporter contribution;
- Life Story sharing;
- quotation, download and re-sharing;
- Public Profile;
- Community participation;
- Platform Public visibility;
- Internet Public visibility;
- Open Matching;
- matching attributes and coarse location;
- Match Introduction and messaging;
- Supporter or Professional Caregiver access;
- data collection and research analysis;
- secondary research;
- external sharing;
- Evidence Package or external submission;
- AI training or model improvement;
- future contact;
- retention;
- and Legacy Preference.

These scopes are independent unless an approved Consent model explicitly groups them in understandable language.

A Consent record preserves:

- Consent ID and version;
- Participant;
- Consent Form and information version;
- purpose;
- scope and data categories;
- granted and denied choices;
- restrictions and conditions;
- recipients;
- start, expiry and review time;
- withdrawal and effective time;
- accessible format and language;
- method;
- comprehension or knowledge-check support;
- Supporter assistance;
- substitute authority and verification where applicable;
- assent where applicable;
- witness where required;
- AI or translation assistance;
- and audit history.

The Platform retains evidence of what was presented, which version was used and how the decision was recorded.

---

## 23. Consent Enforcement

Consent is checked before:

- screening and Enrolment where required;
- intervention assignment and delivery;
- assessment and observation;
- device collection;
- AI processing and memory;
- Life Story capture, contribution, sharing and research use;
- Public Profile and Community participation;
- Platform Public and Internet Public publication;
- Open Matching and sensitive attribute use;
- Match Introduction, Connection and messaging where applicable;
- Supporter or Professional Caregiver access;
- data collection and Dataset inclusion;
- export and external sharing;
- secondary analysis;
- provider processing;
- and external submission.

Consent enforcement is server-side and occurs before sensitive data are assembled or disclosed.

Consent caching requires:

- short and explicit freshness;
- exact version;
- revocation invalidation;
- purpose and resource scope;
- and safe failure.

When Consent cannot be confirmed:

- sensitive reads pause or return restricted projections;
- writes block;
- public publication blocks;
- matching and messaging pause where Consent is required;
- device data quarantine;
- AI context excludes uncertain data;
- Dataset inclusion stops;
- and authorised review is requested.

Canonical events include:

- ConsentRecorded;
- ConsentUpdated;
- ConsentRestricted;
- ConsentExpired;
- and ConsentWithdrawn.

---

## 24. Withdrawal and Re-Consent

A Participant may withdraw or pause:

- a specific data use;
- an intervention;
- a Research Project;
- future contact;
- AI processing;
- AI memory;
- device collection;
- Life Story contribution or sharing;
- Community participation;
- Platform Public or Internet Public visibility;
- Open Matching;
- messaging;
- Supporter access;
- research analysis;
- external sharing;
- or the Platform account.

Withdrawal effects explicitly define whether existing data:

- may remain operationally;
- must stop future use;
- must be removed from search, matching, AI or public delivery;
- must be excluded from future Dataset Versions;
- may remain in an already locked Dataset Version;
- must be deleted;
- must be retained for legal, safety, audit or research integrity;
- requires notice to external recipients;
- or requires governance review.

Withdrawal propagates to:

- permission and Resource State;
- active workflows;
- search and vector indexes;
- matching and feed projections;
- notification and messaging;
- AI context and AIMemoryItem;
- pending export;
- future transformations;
- and external processors where applicable.

Re-Consent may be required after:

- material Protocol or Intervention Version change;
- new data category;
- new purpose;
- new recipient;
- new AI provider or material AI behaviour;
- new AI memory or tool capability;
- new device;
- Life Story or Legacy scope change;
- broader Community or public visibility;
- new matching attributes or ranking policy;
- new messaging or moderation use;
- Internet Public publication;
- longer retention;
- secondary use;
- or material risk change.

Existing Participants must not be silently migrated to broader Consent.

---

## 25. Assent, Supported Decision-Making and Substitute Authority

### 25.1 Accessible Consent

Consent information supports:

- plain language;
- read-aloud;
- larger text;
- language translation;
- visual explanation;
- slower pacing;
- repetition;
- questions;
- and human assistance.

### 25.2 No Hidden Capacity Inference

The Platform and AI must not infer decision-making capacity from:

- age;
- diagnosis alone;
- interface behaviour;
- response time;
- Life Story content;
- emotional expression;
- accessibility needs;
- or Supporter assistance.

### 25.3 Assent

Where required, assent is recorded separately from substitute-authority approval.

### 25.4 Time-Specific Authority

Fluctuating ability or authority is handled through time-specific review and least-restrictive support.

### 25.5 Attribution

The Platform records whose decision, statement or response is represented.

### 25.6 Conflict and Escalation

Disagreement among Participant, Supporter, substitute decision-maker and staff triggers a governed human review rather than automatic override.

---

## 26. Purpose Limitation

Representative purpose codes include:

- Account and Identity Operation;
- Intervention Delivery;
- Participant Support;
- Accessibility Adaptation;
- Life Story Creation;
- Life Story Sharing;
- Community Participation;
- Open Matching;
- Connection and Messaging;
- Moderation;
- Safety;
- Research;
- Data Quality;
- Analysis;
- Reporting;
- External Submission;
- Care Coordination where separately governed;
- Quality Improvement;
- System Operations;
- Security;
- Audit;
- Legal Compliance;
- and Approved Secondary Research.

Sensitive requests, jobs, events, AI interactions, transformations and exports carry or resolve a purpose code.

Policies define which:

- actors and roles;
- Relationships and Connections;
- data classes and resources;
- actions;
- recipients;
- transformations;
- retention rules;
- AI tools;
- and external processors

are permitted for each purpose.

Examples:

- Community visibility does not create research permission.
- Life Story sharing does not create model-training permission.
- Open Matching does not create general AI personalisation permission.
- Safety access does not create moderation access.
- Moderator access does not create researcher access.
- Dataset access does not create operational messaging authority.
- Supporter access does not create substitute authority.

A new purpose may require new Consent, privacy review, approval, Dataset Definition and retention rules.

---

## 27. Resource State and Approval Enforcement

Resource State affects permitted action.

Examples:

- Draft content may be edited but not represented as approved.
- Approved Protocol Versions cannot be edited in place.
- Suspended Intervention Assignments cannot receive ordinary delivery.
- Private Life Story items cannot be publicly delivered.
- Withdrawn content cannot remain searchable or matchable.
- Restricted accounts cannot create new Connections.
- Open Safety Events cannot be hidden by ordinary content deletion.
- Locked Dataset Versions are immutable.
- Rejected Research Findings cannot be externally submitted as approved.
- Archived records may remain readable for limited historical purposes but not active use.

Approval applies to exact versions.

No approval is inferred from:

- silence;
- timeout;
- AI confidence;
- prior approval of another version;
- public visibility;
- or technical capability.

---

## 28. Visibility and Publication Model

Visibility is separate from Data Classification, Consent, research use and publication authority.

Canonical visibility scopes include:

- Private;
- Selected People;
- Connections;
- Community;
- Platform Public;
- Internet Public.

### 28.1 Private

Visible only to the Participant and explicitly authorised actors or processes.

### 28.2 Selected People

Visible only to explicitly selected actors with current permission.

### 28.3 Connections

Visible to eligible active Connections, subject to Block and item-specific restrictions.

### 28.4 Community

Visible only within an eligible Community Space and Community Rules.

### 28.5 Platform Public

Visible to eligible authenticated Platform users.

### 28.6 Internet Public

Visible without Platform authentication and potentially indexable, copyable or redistributable.

### 28.7 Publication Controls

Publication requires:

- author or owner authority;
- applicable Consent;
- visibility selection;
- content and third-party review where required;
- Community or public rule compliance;
- current Resource State;
- confirmation;
- and audit.

Internet Public additionally requires:

- explicit separate Consent;
- step-up authentication where appropriate;
- public-identifier and delivery controls;
- indexing policy;
- revocation and takedown expectations;
- warning that external copies may persist;
- and approved publication workflow.

### 28.8 No Silent Audience Expansion

Changing from Private, Selected People, Connections or Community to Platform Public or Internet Public is a material action and cannot occur through default settings, inactivity or AI suggestion alone.

---

## 29. Data Classification

Representative classifications include:

- Public Information;
- Internal;
- Confidential;
- Sensitive Personal Data;
- Highly Sensitive Personal Data;
- Restricted Research Data;
- Safety-Restricted;
- Moderation-Restricted;
- Security-Restricted;
- and Secret or Credential Data.

| Data | Typical Classification |
|---|---|
| Approved public intervention description | Public Information |
| Internal architecture and operational configuration | Internal |
| De-identified project summary | Confidential |
| Participant assessment | Sensitive Personal Data |
| Consent, Relationship, Match Preference | Highly Sensitive Personal Data |
| Private Life Story or message | Highly Sensitive Personal Data |
| Reporter identity or moderation evidence | Moderation-Restricted |
| Safety Event detail | Safety-Restricted |
| Identifiable locked research dataset | Restricted Research Data |
| Audit security evidence | Security-Restricted |
| Credentials and cryptographic keys | Secret or Credential Data |

Classification influences:

- access and authentication strength;
- field masking;
- encryption;
- indexing and search;
- AI and provider use;
- event payload;
- logging;
- export;
- retention;
- backup;
- monitoring;
- and incident response.

Platform Public or Internet Public visibility does not automatically change a record to Public Information.

---

## 30. Data Minimisation

The architecture minimises:

- collection;
- optional profile fields;
- persistent storage;
- public-profile fields;
- matching attributes;
- message and notification previews;
- search and index content;
- vector embeddings;
- API response fields;
- client display;
- AI context;
- provider payloads;
- event payloads;
- logs and traces;
- Dataset variables;
- exports;
- and retention.

Minimum necessary applies at every processing stage.

The Platform must not collect broad behavioural, emotional, location, relationship or social-graph data merely because it may be useful later.

Private Life Story, messages, reporter identity, Safety records, precise location and sensitive Match Preferences are excluded from general indexes and analytics unless an approved purpose requires them.

---

## 31. Privacy-Preserving Defaults

Default settings should favour:

- Private Life Story;
- no Open Matching until opt-in;
- no Internet Public publication;
- limited Public Profile;
- no external AI provider use for highly sensitive content unless approved;
- no provider model training;
- no persistent AI memory without purpose and transparency;
- no unrestricted location sharing;
- restricted notification previews;
- and no research or secondary use beyond approved Consent and purpose.

Defaults must not prevent Participants from making informed broader choices where supported and safe.

Dark patterns, forced bundling, preselected broad sharing and pressure-based Consent are prohibited.

---

## 32. Decision and Policy Caching

Security-sensitive caches may improve performance but require explicit rules.

### 32.1 Cacheable Decisions

Short-lived caching may be used for stable role, Organisation membership or public configuration.

### 32.2 High-Freshness Decisions

The following require strong freshness or immediate invalidation:

- Consent withdrawal;
- Relationship or Delegation revocation;
- Block;
- account restriction;
- visibility reduction;
- Mutual Acceptance and Connection state;
- messaging basis;
- Safety restriction;
- moderation action;
- Dataset Lock;
- and approval.

### 32.3 Cache Key

A policy cache key includes actor, role, purpose, context, resource, resource version, policy version and relevant authority versions.

### 32.4 Failure

If a high-risk decision cannot be evaluated with sufficient freshness, the action fails closed or requires human review.

---

## 33. Encryption and Cryptographic Protection

Sensitive data is protected:

- in transit;
- at rest;
- in backups;
- in object and media storage;
- in search and vector stores where applicable;
- in analytical environments;
- and in export packages.

### 33.1 Transport Protection

External and internal sensitive communication uses current approved transport encryption with certificate validation.

### 33.2 At-Rest Protection

Managed storage encryption is enabled for databases, objects, queues, caches, backups and analytical storage.

### 33.3 Field-Level Protection

Application- or field-level encryption, tokenisation or separate storage may be required for:

- linkage keys;
- substitute-authority evidence;
- reporter identity;
- precise location;
- highly sensitive Life Story content;
- restricted safety information;
- credential material;
- and identifiable analytical linkage data.

### 33.4 Integrity Protection

Checksums, authenticated encryption, signatures or equivalent controls protect:

- exports;
- uploaded media;
- Dataset manifests;
- Evidence Snapshots;
- approved research artefacts;
- and webhook payloads.

### 33.5 Cryptographic Agility

Algorithms, key sizes, libraries and providers remain replaceable through governed change.

### 33.6 No Custom Cryptography

The Platform does not design custom cryptographic algorithms or protocols without specialist review.

---

## 34. Key Management

Key lifecycle supports:

- generation;
- activation;
- distribution;
- use;
- rotation;
- suspension;
- revocation;
- archival;
- recovery;
- and destruction.

Keys are separated from encrypted data and accessed through least-privilege workload identity.

Key-management actions are audited.

Key separation should consider:

- environment;
- purpose;
- data classification;
- production versus analytical use;
- signing versus encryption;
- and provider or Organisation boundaries where justified.

Loss of a key, unauthorised use or suspected compromise triggers incident response and controlled rotation.

Backup and recovery include necessary key-recovery procedures without creating broad standing access.

---

## 35. Secrets Management

Secrets include:

- database and queue credentials;
- provider API keys;
- signing and encryption keys;
- Service Account credentials;
- webhook secrets;
- client secrets;
- and certificate material.

Secrets use a managed secrets service or equivalent protected store.

Secrets must not appear in:

- source control;
- committed configuration;
- logs or traces;
- screenshots;
- issue trackers;
- prompts or AI context;
- test fixtures;
- research records;
- event payloads;
- or Dataset Versions.

Secrets support:

- scoped access;
- rotation;
- expiry;
- versioning;
- emergency revocation;
- and usage audit.

Local development uses non-production credentials and prevents accidental production access by default.

---

## 36. Application and API Security

The Platform enforces:

- strict schema and input validation;
- safe output encoding;
- parameterised database access;
- object- and field-level permission checks;
- protection against insecure direct object reference;
- mass-assignment protection;
- safe error handling;
- request-size and complexity controls;
- rate and abuse limiting;
- idempotency for sensitive operations;
- concurrency and expected-version checks;
- content-type validation;
- pagination limits;
- trace correlation;
- and secure default headers.

Errors must not expose:

- secrets;
- stack traces;
- internal schemas;
- sensitive identifiers;
- blocked-resource existence;
- reporter identity;
- or provider credentials.

Public endpoints are explicitly designated, separately reviewed and protected against enumeration, scraping and abuse.

Generic update endpoints must not bypass typed domain commands for:

- Consent;
- publication;
- Match Decision;
- Connection;
- Block;
- Moderation Decision;
- Safety Event;
- Dataset Lock;
- or approval.

---

## 37. Web, PWA and Client Security

Web and PWA clients protect against:

- cross-site scripting;
- cross-site request forgery;
- clickjacking;
- unsafe third-party scripts;
- insecure token storage;
- DOM injection;
- sensitive browser caching;
- sensitive data in history or URLs;
- and untrusted deep links.

Client-side storage is minimised.

Shared-device mode uses:

- restricted caching;
- hidden previews;
- visible sign-out;
- automatic local cleanup;
- no persistent actor switching;
- and bounded offline data.

Notifications avoid exposing:

- Life Story;
- message content;
- Match Candidate details;
- safety information;
- moderation allegations;
- or Consent decisions

on lock screens unless explicitly configured.

Lost or compromised devices support session and device revocation.

Security interactions remain accessible and do not rely only on colour, complex memory tasks, precise motor actions or inaccessible CAPTCHAs.

---

## 38. Service-to-Service Security

Services and workers use:

- managed workload identity or short-lived credentials;
- encrypted communication;
- least-privilege scopes;
- explicit audience;
- credential rotation;
- outbound endpoint restrictions;
- and traceable delegation.

Internal network location does not replace authentication or authorisation.

A background worker revalidates time-sensitive:

- Consent;
- purpose;
- Specific Permission;
- Block;
- Resource State;
- approval;
- and Data Classification

before performing a sensitive action.

Service identity is distinct from initiating human authority.

---

## 39. External Integration Security

Every integration has a registry entry containing:

- owner;
- business and research purpose;
- data scope and classification;
- direction;
- authentication and workload identity;
- endpoint and allowlist;
- schema and version;
- provider data use;
- location and subprocessors;
- retention and deletion;
- monitoring;
- availability;
- incident contact;
- exit strategy;
- and review trigger.

Inbound data are:

- authenticated;
- integrity-checked;
- schema-validated;
- authority- and source-labelled;
- mapped through an Anti-Corruption Layer;
- quality-flagged or quarantined;
- and audited.

Outbound data are:

- authorised;
- purpose-bound;
- minimised;
- encrypted;
- recipient-scoped;
- retention-limited;
- and logged.

Webhooks use:

- signature validation;
- timestamps;
- replay protection;
- idempotency;
- bounded retry;
- and source allowlisting where feasible.

Provider possession of a payload does not grant broader or future use.

---

## 40. Knowledge Platform Security

Knowledge Platform access passes through M10.

Controls include:

- service authentication;
- capability allowlisting;
- query minimisation;
- purpose propagation;
- identifier and version preservation;
- provenance and verification-state preservation;
- licensing enforcement;
- response validation;
- cache and freshness policy;
- timeout and circuit breaking;
- and audit.

Queries avoid identifiable Participant data unless explicitly necessary, authorised and supported.

The AI Companion and other modules cannot call Knowledge Platform internals directly.

External knowledge content is treated as untrusted for prompt and tool-control purposes.

Governed write-back requires:

- approved Research Finding or Knowledge Gap submission;
- explicit M14 workflow;
- human approval;
- minimum-necessary package;
- and external curation response handling.

---

## 41. AI Security Model

All model calls pass through M11 and the Model Gateway.

The effective AI permission is:

```text
Effective AI Permission
        =
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

The AI security model requires:

- explicit AI identity;
- permission before context;
- minimum-necessary context;
- approved model and configuration;
- source-grounded retrieval where required;
- typed tools;
- output classification;
- confirmation or human review;
- owning-domain command execution;
- and complete provenance.

AI cannot:

- override Consent or Block;
- infer substitute authority;
- approve a Protocol, Evidence Decision, Dataset Lock, Interpretation or Research Finding;
- publish Life Story or Social Post content without confirmation;
- accept a Match Candidate;
- create a Connection;
- start unauthorised messaging;
- impose high-impact moderation;
- confirm or close a Safety Event;
- change Legacy Preference;
- or represent generated text as an executed action.

---

## 42. AI Provider Security and Privacy

AI providers are reviewed for:

- security controls;
- data handling;
- retention;
- model-training and service-improvement use;
- geographic processing;
- subprocessors;
- encryption;
- access control;
- deletion;
- incident notification;
- availability;
- model and API change;
- and contractual commitments.

Provider configuration must explicitly define whether the provider may:

- retain prompts or outputs;
- train models;
- improve services;
- use metadata;
- perform abuse monitoring;
- subcontract processing;
- transfer jurisdictions;
- or create derived data.

Silence is not permission.

Highly sensitive data may require:

- an approved restricted provider;
- private endpoint;
- regional endpoint;
- local or dedicated deployment;
- redaction or structured abstraction;
- stronger approval;
- or prohibition.

Community or Internet Public visibility does not create provider-training permission.

A material provider, model, retention or jurisdiction change triggers security, privacy, Consent and research-impact review.

---

## 43. AI Context Security

### 43.1 Context Assembly Order

```text
Authenticate Actor
        ↓
Resolve Purpose and Resource
        ↓
Evaluate Human and AI Permission
        ↓
Apply Visibility, Block and Resource State
        ↓
Select Minimum-Necessary Sources
        ↓
Redact or Transform where Approved
        ↓
Assemble Source-Labelled Context
        ↓
Invoke Model
```

### 43.2 Excluded by Default

AI context excludes by default:

- unrelated Participant records;
- private Life Story items;
- private messages;
- Match Preferences and candidate history;
- reporter identity;
- moderation evidence;
- Safety Signals and Events;
- precise location;
- substitute-authority evidence;
- credentials;
- and records outside the current purpose.

### 43.3 Source Labels

Context distinguishes:

- Platform fact;
- Participant-provided information;
- Participant Testimony;
- Supporter contribution;
- Observation;
- Human decision;
- retrieved evidence;
- AI inference;
- and general model knowledge.

### 43.4 Block and Visibility

Blocked or invisible content is excluded before embedding retrieval, ranking and prompt assembly.

### 43.5 Context Logging

Full sensitive prompts are not retained unless a defined audit or evaluation purpose requires them.

Secure references, hashes, structured metadata or controlled samples are preferred.

### 43.6 Context Expiry

Temporary context expires after the interaction or bounded workflow unless separately stored as an authorised domain record or AIMemoryItem.

---

## 44. Prompt Injection and Untrusted Content

User messages, retrieved evidence, websites, files, Life Story contributions, Social Posts, messages, reports and provider output are untrusted content.

Untrusted content must not:

- override system or domain policy;
- grant permission;
- change tool allowlists;
- disable validation;
- reveal hidden instructions;
- retrieve unrelated secrets;
- request cross-Participant data;
- bypass Block or visibility;
- create a Connection;
- publish content;
- or approve a governed action.

Controls include:

- instruction and data separation;
- trusted system-policy layer;
- source and content labelling;
- retrieval-domain isolation;
- high-risk pattern detection;
- tool schema enforcement;
- allowlisted destinations;
- output validation;
- and human review.

Prompt-injection detection is an additional safeguard, not the sole control.

---

## 45. AI Tool Security

Every tool declares:

- identity and version;
- owning module;
- domain command or query;
- read or write behaviour;
- permitted AI modes;
- required human permission;
- required Consent and purpose;
- accepted Data Classifications;
- Resource State restrictions;
- action level;
- reversibility;
- confirmation;
- reviewer or approval requirement;
- idempotency;
- rate and abuse limits;
- input and output schema;
- audit fields;
- failure semantics;
- and degraded availability.

Read and write tools are separated.

Tool results are treated as data, not instructions.

A write tool must not accept model-generated authority fields such as:

- role;
- Consent;
- approval;
- reviewer identity;
- Mutual Acceptance;
- Dataset Lock readiness;
- or Safety Event confirmation.

The server resolves those values independently.

High-impact actions require explicit confirmation, step-up authentication, human review or approval as defined by policy.

Tool success is established only by the owning module's response.

---

## 46. AI Memory Security

AIMemoryItem is distinct from:

- ParticipantProfile;
- LifeStoryArchive;
- MatchPreference;
- Message;
- SafetySignal;
- ModerationCase;
- and research records.

AIMemoryItem preserves:

- purpose;
- source;
- Data Classification;
- Consent basis;
- creation method;
- confidence and uncertainty where inferred;
- visible wording;
- applicable AI modes;
- prohibited uses;
- expiry;
- retention;
- correction;
- deletion;
- and audit.

Persistent personal memory requires:

- explicit purpose;
- understandable disclosure;
- current Consent or authorised basis;
- Participant review where appropriate;
- and deletion workflow.

AI memory must not automatically retain:

- private Life Story details;
- message content;
- dismissed Match Candidates;
- sensitive inferred traits;
- Safety or moderation allegations;
- or withdrawn content.

Block, mute, disconnect and current relationship state are enforced through authoritative domain records rather than model memory.

---

## 47. AI Output Security and Auditability

Material AI activity preserves:

- requester;
- role and purpose;
- AI mode;
- effective permission result;
- AI configuration version;
- provider, model and model version;
- instruction version;
- context references;
- retrieval and Knowledge References;
- tools and results;
- output classifications;
- validation;
- confirmation or human review;
- final action;
- Safety Signal or incident;
- timestamps;
- and trace.

AI output uses separate:

- Epistemic Type;
- Artefact Type;
- Review Status;
- Approval Status;
- Safety Classification;
- Grounding Status;
- and Action Status.

AI-generated content remains distinguishable from:

- Participant Testimony;
- human observation;
- assessment result;
- Moderation Decision;
- Safety Event decision;
- Analysis Output;
- Interpretation Record;
- and Research Finding.

Security audit may use secure references instead of storing full sensitive inputs and outputs.

---

## 48. AI Incident and Safety Boundary

An `AIIncident` may record:

- unauthorised disclosure;
- provider-policy violation;
- prompt-injection success;
- unsafe tool attempt;
- model or instruction drift;
- fabricated action result;
- repeated harmful output;
- context isolation failure;
- or configuration failure.

An AI Incident is distinct from:

- SafetySignal;
- SafetyEvent;
- ModerationCase;
- Privacy Incident;
- and Technical Incident.

When AI detects potential Participant harm:

```text
AIInteraction
        ↓
AISafetySignalRaised
        ↓
SafetySignal
        ↓
Human Triage
        ↓
SafetyEvent only if confirmed
```

AI cannot determine that a Safety Event is confirmed or resolved.

---

## 49. Life Story Security and Privacy

### 49.1 Participant Control

LifeStoryArchive and LifeStoryItem remain Participant-controlled.

### 49.2 Authorship and Attribution

The Platform distinguishes:

- Participant-authored;
- Participant-confirmed;
- Participant Testimony;
- Supporter contribution;
- imported material;
- AI transcription;
- AI translation;
- and AI Draft.

### 49.3 No Invented Testimony

AI-generated wording, inferred people, dates, places or meanings remain proposed data until confirmed.

### 49.4 Item-Level Controls

Each item supports:

- lifecycle;
- visibility;
- sharing;
- download;
- quotation;
- re-sharing;
- research use;
- external publication;
- third-party rights;
- correction;
- dispute;
- withdrawal;
- deletion;
- export;
- and legacy behaviour.

### 49.5 Third-Party Rights

Items containing other people may require:

- restricted audience;
- redaction;
- notice or permission;
- dispute handling;
- takedown;
- or exclusion from research and public use.

### 49.6 Media Security

Voice, image and video may reveal biometric, location, health and third-party information.

Metadata stripping alone is insufficient protection.

### 49.7 Legacy Preference

LegacyPreference changes require Participant authority or separately verified legal authority, strong authentication, clear confirmation and audit.

AI and ordinary Supporter access cannot change it.

### 49.8 Research Use

Life Story enters a Dataset Version only through an approved Dataset Definition, compatible Consent, item-level eligibility, minimisation and third-party review.

---

## 50. Community and Public-Surface Security

### 50.1 Public Profile Boundary

PublicProfile is separate from ParticipantProfile.

It includes only explicitly selected fields.

### 50.2 Community Rules

Community access and content are governed by:

- eligibility;
- Community membership;
- Community Rule version;
- visibility;
- Block;
- account restriction;
- moderation state;
- and purpose.

### 50.3 Publication Security

Publishing a SocialPost or Comment requires:

- author authority;
- current account and Resource State;
- selected audience;
- content validation;
- Block and rule checks;
- confirmation;
- and audit.

### 50.4 Platform Public

Platform Public is limited to eligible authenticated Platform users.

### 50.5 Internet Public

Internet Public requires a separate approved flow and is disabled by default for the MVP.

### 50.6 Abuse Protections

Controls address:

- scraping;
- enumeration;
- fake profiles;
- impersonation;
- automated posting;
- spam;
- harassment;
- scams;
- misinformation;
- malicious links;
- media harvesting;
- and coordinated abuse.

### 50.7 Ranking

Ranking applies eligibility, visibility, Block and moderation before scoring.

Prohibited ranking objectives include sole optimisation for:

- time spent;
- reactions;
- controversy;
- emotional arousal;
- or dependency.

### 50.8 Social Proof

The Platform and AI must not generate fake users, reactions, comments, endorsements or popularity signals.

---

## 51. Open Matching Security

### 51.1 Opt-In

Open Matching is inactive until explicit Participant opt-in and applicable Consent.

### 51.2 Allowed Attributes

Matching uses declared or separately authorised attributes.

### 51.3 Prohibited Hidden Features

Matching must not silently use:

- diagnosis;
- decision-making capacity;
- vulnerability;
- financial status;
- private Life Story;
- private messages;
- Safety or moderation records;
- precise location;
- or protected traits without explicit approved governance.

### 51.4 Candidate Generation

Candidate generation applies:

- current matching state;
- eligibility;
- exclusions;
- Block;
- Community or Organisation scope;
- policy version;
- expiry;
- and rate limits.

### 51.5 Match Explanation

MatchExplanation identifies source attributes and does not present an opaque compatibility score as fact.

### 51.6 Match Decision

Each Participant records their own decision.

AI, Supporter or staff cannot accept on the Participant's behalf without a separately authorised decision process.

### 51.7 Mutual Acceptance

A Connection or applicable private communication basis requires Mutual Acceptance and current policy checks.

### 51.8 Abuse Prevention

Controls address:

- mass candidate browsing;
- automated acceptance;
- stalking;
- location inference;
- rejection retaliation;
- discriminatory filtering;
- candidate enumeration;
- and scam behaviour.

### 51.9 Fairness and Audit

Matching preserves:

- policy and algorithm version;
- allowed features;
- candidate set;
- filtering;
- explanation;
- Participant decision;
- and fairness evaluation data.

---

## 52. Connection and Messaging Security

### 52.1 Conversation Thread and Communication Basis

A `ConversationThread` groups authorised messages between permitted actors.

A Message requires:

- active Connection or another authorised basis;
- no active Block;
- valid sender and recipient state;
- permitted purpose;
- and applicable message and Community rules.

### 52.2 Draft versus Sent

AI-generated or saved Draft is not sent.

Delivery state comes from the owning service or provider confirmation.

### 52.3 Message Confidentiality

Message content is excluded from:

- general search;
- public feeds;
- matching;
- ordinary AI memory;
- and unrelated research datasets.

### 52.4 Attachments and Links

Attachments use file-security controls.

Links may be scanned, labelled or restricted.

### 52.5 Abuse and Rate Controls

Controls address:

- spam;
- repeated unwanted contact;
- scams;
- credential solicitation;
- financial solicitation;
- impersonation;
- malicious links;
- harassment;
- and coordinated abuse.

### 52.6 Message Withdrawal and Retention

Withdrawal, deletion and retention rules are explicit and may differ between sender view, recipient view, safety preservation and legal or research requirements.

### 52.7 Provider Metadata

Communication providers receive minimum necessary data and cannot use message data for unrelated purposes without explicit authorisation.

---

## 53. Reporting, Blocking and Moderation Security

### 53.1 Report Submission

UserReport and ContentReport support:

- accessible submission;
- evidence attachment;
- category and narrative;
- urgency;
- optional related Block;
- acknowledgement;
- and reporter protection.

### 53.2 Reporter Confidentiality

Reporter identity is Moderation-Restricted and disclosed only through an approved legal, safety or moderation process.

### 53.3 Moderation Case

ModerationCase access is limited by:

- assigned Moderator or reviewer;
- Community or Organisation scope;
- purpose;
- Specific Permission;
- case state;
- and conflict-of-interest controls.

### 53.4 Provider and AI Assistance

Provider or AI classifications are provisional, source-labelled and reviewable.

### 53.5 Moderation Decision

High-impact actions require an authorised human decision, reason, Community Rule version, evidence, proportionality, duration and appeal information.

### 53.6 Separation

```text
ModerationCase
≠ SafetySignal
≠ SafetyEvent
≠ Privacy Incident
≠ AIIncident
```

### 53.7 Appeal and Restoration

Appeal access, reviewer independence, evidence, outcome, restoration and recurrence are recorded and protected.

### 53.8 Moderator Protection

Moderator access and interfaces minimise unnecessary exposure to traumatic or highly sensitive content and support workload controls.

### 53.9 Retaliation Protection

Affected actors should not receive reporter identity, private evidence or unrelated moderation history.

---

## 54. Safety and Privacy Incident Boundary

### 54.1 Safety Signal

SafetySignal records a potential concern and remains subject to human triage.

### 54.2 Safety Event

SafetyEvent is created only after authorised human confirmation.

### 54.3 Privacy Incident

Privacy Incident records suspected or confirmed inappropriate collection, access, use, disclosure, retention or deletion failure.

### 54.4 Technical Incident

Technical Incident records service, infrastructure or operational failure.

### 54.5 Linked Records

Incidents may reference one another through explicit relationships without collapsing ownership or state.

### 54.6 Safety-Restricted Access

Safety records use field-level and existence protection, stronger audit and minimum necessary access.

### 54.7 No Profile Contamination

A SafetySignal, report, risk flag or allegation must not silently become:

- permanent Participant Profile truth;
- matching feature;
- AI memory;
- or research outcome.

---

## 55. Research Data Security

Research data security covers `DatasetDefinition`, `DatasetVersion`, `DatasetLock`, `AnalysisPlan`, `AnalysisRun`, `InterpretationRecord` and `ResearchFinding` records.

Research data access is scoped to:

- authorised Research Project;
- assigned role;
- approved purpose;
- compatible Consent or other authorised basis;
- Specific Permission;
- Resource State;
- Data Classification;
- and approved analytical environment.

Operational production data are not directly queried by researchers or notebooks.

Research-data security distinguishes:

- operational source records;
- Dataset Definition;
- generated Dataset Version;
- quality-review state;
- locked Dataset Version;
- Analysis Plan;
- Analysis Run;
- Analysis Output;
- Interpretation Record;
- Research Finding;
- and external reporting artefact.

A locked Dataset Version is immutable.

Correction creates a new Dataset Version.

Research dashboards and exports protect against re-identification through:

- small groups;
- rare combinations;
- dates;
- locations;
- free text;
- multimedia;
- social graphs;
- Match Candidate and Connection patterns;
- and external data availability.

Lower environments and demonstrations use synthetic or governed de-identified data.

---

## 56. Dataset Lock and Analytical Environment Security

### 56.1 Lock Preconditions

Dataset Lock requires:

- approved Dataset Definition;
- complete source lineage;
- current permitted purpose;
- Consent or authorised basis;
- visibility and third-party review;
- completed quality review;
- documented missingness and imputation;
- de-identification state;
- manifest and checksum;
- compatible Analysis Plan;
- and authorised approval.

### 56.2 Lock Authority

AI, analysts, engineers and System Administrators cannot self-approve a Dataset Lock unless they hold a separately assigned and permitted approval role.

### 56.3 Analytical Access

Analytical environments use:

- separate identity and access;
- approved locked datasets;
- no production credentials;
- restricted network and export paths;
- code and package controls;
- logging;
- and bounded persistence.

### 56.4 Analysis Run

AnalysisRun records:

- exact Dataset Version;
- Analysis Plan;
- code and environment;
- parameters and seed where applicable;
- actor or controlled process;
- output;
- and reproducibility status.

### 56.5 No Operational Write-Back

Analytical output cannot directly change operational, Consent, matching, moderation or safety records.

### 56.6 Researcher Workspace

Copy, download, clipboard, printing, external network and local storage controls are proportionate to Data Classification and research purpose.

---

## 57. De-Identification and Pseudonymisation

Identifiability states include:

- Identifiable;
- Pseudonymised;
- De-identified;
- Anonymised only where genuinely supportable;
- and Synthetic.

Pseudonymisation uses controlled linkage keys stored separately with restricted access.

De-identification considers:

- direct identifiers;
- quasi-identifiers;
- rare combinations;
- dates and location;
- Life Story and free text;
- audio, video, voice and images;
- device identifiers;
- Community content;
- social graph;
- Match Candidate and Connection patterns;
- reporter or moderator information;
- external public data;
- and modern AI-assisted linkage capability.

Publicly visible content is not automatically de-identified.

Removing account identifiers is insufficient when a distinctive story, image, voice, network or combination of interests remains recognisable.

Re-identification risk is evaluated for the intended recipient, purpose, environment and external data availability.

AI may assist detection but is not the sole protection for high-risk release.

---

## 58. Export and External Sharing Security

Exports require:

- authorised actor and role;
- Research Project and resource scope;
- declared purpose;
- current Consent or approved basis;
- Specific Permission;
- Resource State;
- approved dataset or source state;
- identified recipient;
- Data Classification;
- third-party, reporter and Block protection;
- de-identification where required;
- retention and usage restrictions;
- and approval.

High-risk exports may require:

- step-up authentication;
- dual or independent approval;
- Privacy Review;
- legal or contractual review;
- and secure recipient attestation.

An ExportPackage preserves:

- Export ID and version;
- creator and approver;
- recipient;
- purpose;
- source records and exact versions;
- Dataset Definition and locked Dataset Version where applicable;
- transformations and de-identification;
- format and schema;
- restrictions and expiry;
- licensing;
- checksum;
- delivery state;
- and trace.

Secure delivery may use:

- authenticated portal;
- time-limited link;
- encrypted package;
- managed transfer;
- or approved repository integration.

Generated, delivered and received are separate states.

Participant portability does not create research, model-training, publication or redistribution permission.

---

## 59. File, Media and Object Security

Uploads remain quarantined until:

- upload permission;
- size validation;
- file-type and content validation;
- malware scanning;
- checksum;
- metadata extraction and stripping where appropriate;
- Data Classification;
- Consent and purpose;
- owning-resource assignment;
- and access policy

are complete.

Sensitive objects use:

- opaque identifiers;
- short-lived or audience-scoped delivery;
- no permanent public URL unless explicitly published;
- object metadata protection;
- versioning where appropriate;
- retention and deletion;
- and access audit.

Transcripts, thumbnails, previews, translations, embeddings and transformed media inherit source sensitivity unless explicitly and validly reclassified.

Processing failure does not mark an item as:

- safe;
- transcribed;
- translated;
- published;
- exported;
- or delivered.

Life Story and moderation evidence may require stricter access, download and preview controls.

---

## 60. Device and Wearable Security

Devices are registered and linked to Participants through an authorised workflow.

Device records preserve:

- device identity;
- source platform;
- model and firmware;
- assignment;
- Consent;
- collection purpose;
- timestamps;
- data quality;
- collection and connection state;
- and revocation.

Controls address:

- incorrect reassignment;
- stale assignment;
- spoofed measurements;
- insecure provider tokens;
- replay;
- clock drift;
- unauthorised pairing;
- and excessive collection.

Suspicious or unverifiable data are quarantined or quality-flagged.

Participants can understand, pause or stop collection where permitted.

Device data do not silently become:

- clinical truth;
- eligibility criteria;
- Safety Event;
- matching feature;
- or Healthy Aging outcome.

---

## 61. Audit Architecture

Audit categories include:

- authentication and recovery;
- session;
- authorisation and access;
- Consent and withdrawal;
- Relationship, Delegation and substitute authority;
- Life Story authorship, visibility and legacy;
- Community publication;
- matching, Mutual Acceptance and Connection;
- message, mute, disconnect and Block;
- report, moderation, appeal and restoration;
- Safety Signal and Safety Event;
- privacy and security incident;
- AI context, memory, retrieval, tool and action;
- Evidence and Reference Change;
- Dataset Definition, generation and lock;
- Analysis Plan, Run, Interpretation and Finding;
- export and external submission;
- integration and provider;
- privileged administration;
- key and secret;
- deletion and retention;
- and break-glass.

An AuditEvent includes:

- Audit Event ID;
- actor or Service Account;
- active role and authentication strength;
- action;
- target and resource version;
- purpose;
- Organisation and Research Project;
- Participant where permitted;
- time;
- result;
- policy decision and reason;
- source;
- correlation, causation and trace identifiers;
- and Data Classification.

Material audit history is append-only or equivalently tamper-evident and protected from unauthorised alteration or deletion.

Audit records avoid unnecessary sensitive content.

Reporter identity, message text, private Life Story and full AI prompts are referenced rather than copied where possible.

---

## 62. Security Monitoring and Detection

Monitor:

- failed authentication and recovery;
- unusual account or session behaviour;
- privilege and role changes;
- cross-Organisation or cross-project access;
- denied Consent and policy checks;
- protected-resource enumeration;
- scraping and automated account creation;
- mass public-profile or social-content access;
- mass matching or candidate enumeration;
- Block propagation failures;
- Mutual Acceptance bypass attempts;
- unusual message, link or financial solicitation;
- report and moderation anomalies;
- reporter-identity access;
- Safety Signal suppression or delayed triage;
- mass export or download;
- suspicious AI context and tool use;
- prompt-injection attempts;
- provider-policy violations;
- invented action confirmation;
- malicious upload;
- search and vector permission drift;
- integration and device anomalies;
- Dataset Lock or lineage failure;
- audit gaps;
- secret and key misuse;
- deletion propagation failure;
- and security-control failure.

Alerts preserve:

- severity;
- source;
- affected capability and data;
- owner;
- response target;
- evidence;
- state;
- escalation;
- and closure rationale.

Operational logs and governance audit are related but not interchangeable.

---

## 63. Vulnerability and Supply-Chain Management

Maintain an inventory of:

- applications and modules;
- dependencies;
- containers and base images;
- infrastructure;
- endpoints;
- mobile or PWA assets;
- external integrations;
- AI models and providers;
- media and moderation providers;
- and critical research tools.

Use:

- static analysis;
- dependency and licence scanning;
- container and infrastructure scanning;
- secret scanning;
- software composition analysis;
- image signing or provenance where appropriate;
- provider monitoring;
- and periodic penetration testing.

Dependencies are reviewed for:

- maintenance;
- vulnerability history;
- licence;
- provenance;
- necessity;
- and replacement path.

Versions are locked or controlled.

CI/CD access uses least privilege and MFA.

Vulnerability exceptions require:

- owner;
- severity and exposure;
- rationale;
- compensating controls;
- expiry;
- and review.

Critical vulnerabilities affecting Participant control, public exposure, moderation, safety, Consent or export receive prioritised remediation.

---

## 64. Secure Software Development Lifecycle

Security and privacy requirements are included in:

- discovery;
- architecture;
- domain design;
- threat modelling;
- implementation;
- review;
- testing;
- deployment;
- monitoring;
- and retirement.

High-risk changes require security and privacy review, including:

- authentication and recovery;
- Consent and Delegation;
- public publication;
- matching and ranking;
- messaging;
- moderation;
- Safety;
- AI tools and providers;
- Dataset and export;
- identity resolution;
- and external integration.

CI should include:

- unit and integration tests;
- architecture-boundary tests;
- static analysis;
- dependency scanning;
- secret detection;
- migration validation;
- contract tests;
- and policy checks.

Production data and credentials remain isolated from lower environments.

Material releases preserve application, schema, configuration, policy, matching, moderation and AI versions.

---

## 65. Infrastructure and Environment Security

Public, application, worker, data, analytical and administrative boundaries are separated.

Databases, queues, object stores and internal services are not directly public.

Administrative access is:

- strongly authenticated;
- least-privileged;
- individually attributable;
- time-bound where practical;
- network-restricted;
- and audited.

Infrastructure changes use:

- version-controlled configuration;
- peer review;
- automated validation;
- controlled deployment;
- and drift detection.

Managed services use private access and workload identity where feasible.

Production data are not copied into lower environments without approved de-identification and minimisation.

Research sandboxes use synthetic or governed data and separate credentials.

---

## 66. Backup and Recovery Security

Backups are:

- encrypted;
- access-controlled;
- retention-managed;
- geographically and operationally appropriate;
- monitored;
- and tested through restoration.

Backup access is more restricted than ordinary operational access.

Backup scope includes:

- transactional state;
- Consent and authority evidence;
- Life Story and media according to retention;
- audit;
- approved research artefacts;
- Dataset Definitions and locked Dataset Versions;
- manifests and checksums;
- configuration;
- and cryptographic recovery material.

Deletion workflows document backup lifecycle and residual retention.

Restore tests verify:

- data and object consistency;
- audit availability;
- permission and Consent state;
- Block and restriction state;
- Dataset manifests;
- and index rebuild.

Recovery must not re-enable revoked access, withdrawn visibility or deleted AI memory without reconciliation.

---

## 67. Privacy by Design

Privacy review occurs during:

- intervention and Protocol design;
- data collection;
- Participant Profile and Public Profile design;
- Life Story and legacy;
- Community and public visibility;
- Open Matching and ranking;
- messaging;
- moderation;
- Safety;
- AI integration and memory;
- device integration;
- analytics and Dataset Definition;
- external sharing;
- export;
- and provider change.

High-risk processing receives a Privacy Impact Assessment or equivalent review.

Participants are told:

- what is collected;
- why;
- which choices are optional;
- who may access it;
- which visibility applies;
- whether AI and external providers are used;
- whether matching or ranking is used;
- how long data are retained;
- whether data may enter research;
- and how choices can be exercised.

Privacy interfaces must not use dark patterns, false scarcity, forced bundling, confusing double negatives or pressure toward broader sharing.

---

## 68. Participant Rights Workflows

The Platform supports governed requests for:

- access;
- correction;
- Consent review;
- withdrawal;
- restriction;
- export and portability;
- deletion where applicable;
- Relationship and Delegation review;
- Connection, Block and report review;
- Life Story authorship, sharing and legacy review;
- Public Profile and visibility review;
- AI memory review and correction;
- objection or complaint;
- and external-sharing information.

A request preserves:

- Request ID;
- requester and identity verification;
- type and scope;
- submitted time;
- status;
- assigned owner;
- dependencies and third-party rights;
- decision and rationale;
- response;
- completion;
- and audit.

Interfaces are accessible and distinguish:

- account closure;
- research withdrawal;
- intervention withdrawal;
- Community departure;
- matching pause;
- Connection disconnect;
- sharing withdrawal;
- and deletion.

Exports, corrections and deletion protect the rights of other people appearing in Life Story, messages, reports and shared content.

---

## 69. Retention, Deletion and Holds

Retention is based on:

- data category;
- purpose;
- Protocol;
- Consent;
- visibility;
- operational need;
- safety;
- moderation;
- research integrity;
- contractual requirement;
- and applicable obligation.

Separate rules apply to:

- identity and recovery;
- Consent and authority evidence;
- Life Story and legacy;
- Community content;
- Match Candidates and dismissed candidates;
- Connections and messages;
- Block and report;
- moderation evidence;
- Safety Signals and Safety Events;
- AI interactions and memory;
- operational research records;
- locked Dataset Versions;
- Analysis and Findings;
- audit;
- and provider data.

Deletion or withdrawal propagates to:

- source record;
- search and vector index;
- cache;
- feed and candidate generation;
- AI context and memory;
- pending jobs and exports;
- external processors;
- public endpoints where controllable;
- and derived data.

A locked Dataset Version is not silently edited.

Where correction or withdrawal requires change, the Platform creates:

- a new Dataset Version;
- an exclusion or sensitivity analysis;
- a withdrawal note;
- or a governed exception.

Legal, safety or research holds are explicit, authorised, scope-limited, time-limited where possible and reviewed.

Retention does not preserve current visibility or access.

---

## 70. Incident Response

Incident categories include:

- account compromise;
- unauthorised access;
- Consent bypass;
- data disclosure;
- public-visibility error;
- scraping or social-graph extraction;
- Block bypass;
- matching or message abuse;
- reporter disclosure;
- moderation compromise;
- Safety Signal or Safety Event mishandling;
- malicious file;
- AI leakage or tool abuse;
- provider data-use violation;
- corrupted research record;
- Dataset Lock or Analysis integrity failure;
- compromised integration or device;
- deletion failure;
- lost export;
- key or secret compromise;
- and service outage.

The response lifecycle is:

```text
Detect
    ↓
Triage
    ↓
Contain
    ↓
Preserve Evidence
    ↓
Investigate
    ↓
Eradicate
    ↓
Recover
    ↓
Notify
    ↓
Learn
```

Representative roles include:

- Incident Lead;
- Security Lead;
- Privacy Lead;
- Technical Lead;
- Research Lead;
- Safety Lead;
- Moderation Lead;
- Communications Lead;
- Legal Adviser;
- and Provider or Integration Owner.

Material incidents result in:

- root-cause analysis;
- affected-person and research assessment;
- corrective action;
- control updates;
- provider follow-up;
- and review of repeated or systemic risk.

---

## 71. Breach and Harm Assessment

Breach and harm assessment considers:

- data and systems involved;
- authority and purpose;
- identifiability;
- sensitivity;
- visibility before and after the incident;
- affected people;
- exposure duration;
- recipient;
- external copying or indexing;
- misuse likelihood;
- fraud, harassment or coercion risk;
- safety impact;
- autonomy and dignity impact;
- research impact;
- containment;
- and reversibility.

Notification requirements are determined by appropriate legal and privacy authority.

Participant communication should be:

- clear;
- timely;
- honest;
- accessible;
- action-oriented;
- and specific about available controls.

A material incident may require:

- account or provider suspension;
- public takedown;
- forced credential reset;
- study or intervention pause;
- matching or messaging pause;
- moderation review;
- Safety review;
- re-Consent;
- Protocol amendment;
- Dataset exclusion or new version;
- Analysis rerun;
- qualification or withdrawal of Research Finding;
- or external-recipient notice.

---

## 72. Break-Glass Access

Break-glass access is permitted only for exceptional safety or continuity circumstances with a defined legal and governance basis.

It requires:

- reason and incident reference;
- strong authentication;
- current authorised role;
- minimum data and duration;
- explicit activation;
- immediate audit;
- notification to designated reviewers;
- automated expiry;
- and retrospective review.

Break-glass access must not:

- bypass a Block for ordinary communication;
- create a Connection;
- alter Consent;
- approve research;
- publish content;
- change Legacy Preference;
- close a Safety Event;
- or be used for convenience.

Where disclosure to the Participant would create immediate additional risk or conflict with an authorised investigation, delayed notification requires documented approval and review.

---

## 73. Operational and Privileged Access

Support and engineering staff access only minimum necessary production data.

User impersonation, if supported, is:

- exceptional;
- visible;
- separately authorised;
- time-limited;
- purpose-bound;
- and audited.

Engineers do not have routine unrestricted access to Participant content, messages, reporter identity, Safety records or research datasets.

Temporary privileged access expires automatically.

Privileged access is reviewed periodically and after role change.

Administrative actions use individual accounts rather than shared identities.

Separation of duties applies to:

- role assignment;
- key management;
- export approval;
- Dataset Lock;
- Research Finding approval;
- high-impact moderation;
- Safety Event decision;
- and audit administration.

---

## 74. Vendor and Provider Security

Providers are reviewed for:

- security controls and certifications where relevant;
- privacy practices;
- data location;
- subprocessors;
- retention and deletion;
- model training and service improvement;
- access and administrative controls;
- incident handling and notification;
- availability and continuity;
- auditability;
- data export;
- contract termination;
- and regulatory or research compatibility.

Critical providers include:

- identity;
- cloud infrastructure;
- database and object storage;
- queue and monitoring;
- AI;
- media, transcription and translation;
- communication;
- moderation or abuse detection;
- analytical environment;
- and device platform.

Critical provider use includes an exit strategy covering:

- data and configuration export;
- credential revocation;
- migration;
- deletion verification;
- continuity;
- and historical research reproducibility.

A material provider change triggers security, privacy, Consent, AI and research-impact review.

---

## 75. Security Testing

Testing includes:

- unit security tests;
- authorisation matrix tests;
- Consent and withdrawal tests;
- field and existence-protection tests;
- API and object-access tests;
- session and recovery tests;
- file-upload tests;
- public-surface abuse tests;
- matching and messaging tests;
- Block propagation tests;
- moderation and reporter-confidentiality tests;
- Safety Signal and Event tests;
- configuration and secret tests;
- penetration tests;
- export and de-identification tests;
- recovery tests;
- provider-failure tests;
- and AI red-team tests.

Access-matrix tests cover combinations of:

- role;
- Organisation;
- Research Project;
- Relationship;
- Connection;
- Consent;
- purpose;
- context;
- Specific Permission;
- Resource State;
- visibility;
- Block;
- Data Classification;
- authentication strength;
- and action risk.

AI tests include:

- permission before context;
- prompt injection;
- cross-project and cross-Participant leakage;
- private Life Story leakage;
- reporter and moderation leakage;
- tool escalation;
- fabricated citations;
- false action confirmation;
- invented Life Story details;
- hidden sensitive matching;
- Block and Mutual Acceptance bypass;
- unsafe moderation action;
- Safety Signal routing;
- memory retention and deletion;
- provider fallback;
- and prohibited actions.

Prohibited actions are tested explicitly, not only through positive-path tests.

---

## 76. Security Acceptance Criteria

A feature is not complete until:

- identity assumptions are defined;
- actor roles and scopes are defined;
- permissions and protected existence are defined;
- Consent impact is defined;
- purpose is defined;
- Resource State and visibility are defined;
- Data Classification is defined;
- minimum necessary data are defined;
- provider and cross-border use are defined;
- audit events are defined;
- retention and deletion are defined;
- failure and degraded behaviour are defined;
- accessibility impact is defined;
- threat scenarios are reviewed;
- tests exist;
- monitoring exists;
- incident ownership is assigned;
- and operational support is documented.

Additional acceptance criteria apply to:

- Life Story authorship and third-party rights;
- public publication;
- Open Matching and fairness;
- Connection and messaging;
- Block and report;
- moderation and appeal;
- Safety;
- AI tools and memory;
- Dataset Lock;
- and export.

---

## 77. Security and Privacy Governance

Representative governance roles include:

- Security Owner;
- Privacy Owner;
- Consent Governance Owner;
- Research Governance Owner;
- Data Steward;
- AI Governance Owner;
- Community Safety and Moderation Owner;
- Safety Governance Owner;
- System Owner;
- Integration Owner;
- Provider Owner;
- and Incident Owner.

Material changes may require review by:

- architecture;
- security;
- privacy;
- Consent governance;
- research;
- ethics;
- safety;
- moderation;
- accessibility;
- data governance;
- legal;
- and operations.

Periodic review covers:

- privileged roles;
- active providers;
- public and Internet-facing capabilities;
- matching policy;
- moderation rules;
- AI configuration and tools;
- retention;
- unresolved risks;
- audit quality;
- and Participant complaints.

Material decisions are recorded in Architecture or Governance Decision Records.

---

## 78. Security and Privacy Metrics

Representative metrics include:

- MFA coverage;
- privileged-account count and age;
- access-review completion;
- failed authentication and recovery;
- session revocation time;
- Consent-check failures;
- withdrawal-propagation time;
- denied cross-project or cross-purpose access;
- protected-resource enumeration attempts;
- Block propagation time and failures;
- Mutual Acceptance violation attempts;
- spam, scam, harassment and unwanted-contact reports;
- reporter-identity access;
- moderation backlog, action and appeal age;
- Safety Signal triage age;
- public-visibility and takedown incidents;
- export volume and denied exports;
- search or vector permission drift;
- AI tool denials and sensitive-context leakage;
- AI memory correction and deletion;
- provider-policy violations;
- unresolved vulnerabilities;
- secret and key rotation age;
- backup and restore success;
- deletion-propagation failures;
- incident response time;
- and recurring incident rate.

Metrics support risk reduction and Participant protection rather than superficial compliance or engagement optimisation.

---

## 79. Failure and Degraded Modes

### 79.1 Identity Provider Unavailable

Existing sufficiently strong sessions may continue for a bounded period where safe.

New login, recovery and step-up authentication may be unavailable.

### 79.2 Policy Component Failure

Sensitive actions fail closed.

Public reading may continue only for genuinely public content through a separately safe path.

### 79.3 Consent Evaluation Failure

Intervention delivery, AI context, public publication, matching, messaging, data collection, Dataset generation, export and external sharing pause where Consent is required.

### 79.4 Block or Visibility Evaluation Failure

Discovery, matching, messaging, notification, content delivery and AI context fail closed.

### 79.5 Key or Secrets Service Failure

Operations requiring encryption, signing or external credentials pause safely.

### 79.6 Audit Failure

High-risk writes pause or use an approved protected durable audit queue.

### 79.7 AI Provider Failure

Non-AI and manual workflows continue.

Drafts remain Drafts.

No tool action is inferred from missing model output.

### 79.8 Knowledge Platform Failure

Approved Evidence Decisions and Evidence Snapshots remain available according to Document 9.

### 79.9 Communication Provider Failure

Messages and notifications remain queued or failed with accurate state.

Critical escalation uses approved alternatives.

### 79.10 Moderation Provider Failure

Human moderation continues.

Provider classification absence does not suppress a report.

### 79.11 Matching Worker Failure

Open Matching pauses without fabricated candidates or Connections.

### 79.12 Media Processor Failure

Private Draft and original media may remain available where safe.

The Platform does not claim successful scan, transcription, translation or publication.

### 79.13 Dataset or Analytical Failure

Unlocked or incomplete Dataset Versions are not used as governed analysis inputs.

Intervention operations continue where safe.

### 79.14 Monitoring Failure

High-risk operations may enter restricted mode according to control criticality.

### 79.15 Deletion Propagation Failure

A tracked remediation record is created, affected derived stores and providers are identified, and Participant-facing status is provided where appropriate.

---

## 80. MVP Security Scope

The MVP implements:

- managed authentication;
- accessible account recovery;
- MFA for privileged and high-impact roles;
- stable opaque Platform identifiers;
- secure session handling;
- role-, Organisation- and Research-Project-scoped access;
- Relationship-, Consent-, purpose-, context-, Specific Permission- and Resource-State-aware access;
- field-level and existence protection;
- central policy evaluation plus owning-module domain policies;
- current Consent and withdrawal propagation;
- supported-decision-making attribution;
- separate ParticipantProfile and PublicProfile;
- separate Connection and Supporter authority;
- Private-by-default Life Story;
- item-level Life Story visibility and research-use control;
- Platform Public versus Internet Public distinction;
- Internet Public disabled by default;
- opt-in Open Matching;
- allowed-attribute policy;
- MatchExplanation and MutualAcceptance enforcement;
- Connection and message communication-basis enforcement;
- deterministic Block;
- accessible report;
- reporter confidentiality;
- human-accountable ModerationDecision and appeal;
- SafetySignal versus SafetyEvent separation;
- encrypted transport and managed storage;
- managed keys and secrets;
- secure file and media upload;
- object-level and field-level API authorisation;
- controlled search and optional vector retrieval;
- AI Model Gateway;
- permission-before-context;
- typed and allowlisted AI tools;
- AIMemoryItem transparency and deletion;
- provider data-use review;
- Evidence Snapshot and Knowledge boundary controls;
- DatasetDefinition, DatasetVersion and DatasetLock security;
- approved analytical environment;
- controlled export;
- structured audit;
- logging and alerting;
- vulnerability and dependency scanning;
- backup and restore testing;
- incident-response process;
- provider registry;
- and automated tests for critical permission, Consent, Block, matching, moderation, safety, AI and Dataset rules.

### 80.1 MVP Non-Goals

The MVP does not require:

- custom identity infrastructure;
- enterprise-scale external policy engines;
- Organisation-specific dedicated key hierarchies;
- continuous automated red teaming;
- complex behavioural surveillance;
- unrestricted public APIs;
- Internet Public publication by default;
- hidden compatibility or vulnerability scoring;
- autonomous identity merge;
- autonomous Connection creation;
- autonomous high-impact moderation;
- autonomous SafetyEvent confirmation;
- autonomous Dataset Lock or research approval;
- external provider model training;
- multi-region security operations;
- or advanced privacy-preserving computation.

---

## 81. Deferred Capabilities

Deferred capabilities may include:

- external policy engine;
- advanced privileged-access management;
- customer-managed or Organisation-specific keys;
- continuous access evaluation;
- automated data-loss prevention;
- behavioural anomaly detection with privacy safeguards;
- confidential computing;
- device attestation;
- federated institutional identity;
- dynamic Consent;
- privacy-preserving record linkage;
- secure research enclave;
- federated learning;
- secure multi-party analytics;
- differential-privacy release;
- advanced social-graph privacy;
- automated fraud and abuse detection;
- advanced moderation tooling;
- Internet Public archival and takedown integration;
- and cross-Organisation Community federation.

---

## 82. Future Evolution

Future versions may support:

- institution-specific security domains;
- federated research;
- Participant-controlled data spaces;
- decentralised or verifiable credentials;
- continuous Consent and permission evaluation;
- privacy-preserving linkage;
- secure research enclaves;
- automated provider-risk monitoring;
- cross-jurisdiction policy adaptation;
- advanced content authenticity and provenance;
- privacy-preserving matching;
- multi-site safety and moderation governance;
- and posthumous digital-legacy controls.

Future security sophistication must preserve accessibility, understandable choices, Participant autonomy and minimum necessary processing.

---

## 83. Open Questions

1. Which identity provider best supports Participants, workforce users, Organisations and future federation?
2. Which Participant authentication and recovery methods best balance accessibility and takeover risk?
3. Which roles and actions require mandatory MFA or step-up authentication in the Pilot?
4. Which Consent scopes are required for the first Protocol and intervention package?
5. Is Internet Public disabled throughout the first Pilot?
6. Which Life Story media and sharing scopes are included in the Pilot?
7. Which Legacy Preference capabilities are legally and operationally supportable?
8. How will supported decision-making, assent and substitute authority be verified?
9. Which data classes may be sent to external AI, transcription, translation or moderation providers?
10. Which provider data-retention and training controls are mandatory?
11. Which data-residency and cross-border restrictions apply?
12. Which matching attributes are permitted, prohibited or require specialist approval?
13. Which matching-fairness and anti-discrimination controls are mandatory?
14. Which block effects must be strongly consistent in the first release?
15. Which messaging channels and provider metadata are in scope?
16. Which Community and moderation actions require step-up authentication or dual review?
17. Which reports may trigger Privacy Review or SafetySignal automatically?
18. Which Safety Events justify break-glass access?
19. Which research datasets require pseudonymisation or an isolated research environment?
20. Which exports require dual approval?
21. Which Participant rights requests require identity step-up or third-party review?
22. Which retention periods apply to MatchCandidates, messages, reports, AI interactions and media Drafts?
23. Which security events justify automatic Research Project, intervention, matching or public-publication pause?
24. Which security tests must pass before first Participant Enrolment?
25. Which external integrations are sufficiently necessary to justify their risk?
26. Which monitoring metrics and response targets are required during Pilot operating hours?
27. Who owns coordinated decisions across Security, Privacy, Safety and Moderation?
28. Which residual risks require explicit Participant-facing disclosure?

---

## 84. Design Decisions

This document establishes that:

1. Security, privacy and Consent are runtime Platform conditions.
2. Access is denied by default.
3. Effective Permission uses Role, Relationship, Consent, Purpose, Context, Specific Permission and Resource State.
4. Visibility, Block, Mutual Acceptance, Data Classification and action risk are additional deterministic domain inputs.
5. Permission filtering occurs before data assembly, search, vector retrieval, AI context, export and Dataset inclusion.
6. The client is not the security authority.
7. Field-level, row-level and protected-existence controls are required.
8. Relationship alone never grants access.
9. Supporter status does not create substitute authority.
10. Connection is distinct from Relationship and does not create Supporter authority.
11. Block is authoritative and enforced before discovery, matching, messaging, notification, search and AI context.
12. Report remains available after Block or disconnect where policy permits.
13. Consent is versioned, purpose-specific and enforced server-side.
14. Life Story, Community, public visibility, Open Matching, messaging, AI memory, research and external sharing use separate Consent scopes where applicable.
15. Existing Participants are not silently migrated to broader Consent.
16. Supported decision-making preserves whose decision and authorship are recorded.
17. The Platform and AI do not infer general decision-making capacity from interface behaviour or content.
18. Purpose limitation applies to users, services, jobs, AI, datasets, exports and providers.
19. Resource State and approval apply to exact versions.
20. Visibility is distinct from Data Classification, research use and publication authority.
21. Platform Public is distinct from Internet Public.
22. Internet Public is disabled by default in the MVP.
23. No audience expansion occurs through default, inactivity or AI suggestion alone.
24. Public visibility does not create model-training or redistribution permission.
25. Data collection, indexing, embeddings, logs and exports follow minimum necessary processing.
26. Private-by-default settings apply to sensitive Participant-controlled content.
27. Cryptographic protection covers transport, storage, backups, objects, analytical environments and exports.
28. Secrets and keys are separated from domain data, logs and AI context.
29. High-impact changes use explicit domain commands and independent server-side validation.
30. External systems and providers are untrusted boundaries.
31. Provider data retention, training, location and subprocessors are explicit.
32. All model calls pass through M11 and the Model Gateway.
33. AI permission is the intersection of human permission, approved configuration, task and tool authority.
34. Block and visibility filters execute before AI context assembly.
35. AI cannot directly mutate another aggregate.
36. AI tools are typed, versioned, allowlisted, permission-scoped and auditable.
37. Model-generated authority fields are never trusted.
38. Tool success is established only by the owning module.
39. AIMemoryItem is distinct from ParticipantProfile, LifeStoryArchive, matching, messages and research records.
40. AI-generated Life Story wording is not Participant Testimony until confirmed.
41. LifeStoryArchive remains Participant-controlled.
42. A Supporter contribution does not acquire ownership or automatically become Participant Testimony.
43. LegacyPreference cannot be changed by AI or ordinary Supporter access.
44. PublicProfile is distinct from ParticipantProfile.
45. Community access is governed by eligibility, visibility, rules, Block and moderation.
46. The Platform does not generate fake social proof.
47. Open Matching is opt-in.
48. Matching uses declared or separately authorised attributes.
49. Hidden vulnerability, capacity and compatibility scoring is prohibited.
50. A MatchCandidate is not a Connection.
51. MutualAcceptance is required before applicable Connection and private communication.
52. Message Draft is distinct from sent Message.
53. Reporter identity is Moderation-Restricted.
54. Provider and AI moderation classifications remain provisional.
55. High-impact ModerationDecision and appeal remain human-accountable.
56. ModerationCase, SafetySignal, SafetyEvent, PrivacyIncident, AIIncident and TechnicalIncident remain separate.
57. Automated or AI detection creates a SafetySignal, not a confirmed SafetyEvent.
58. Safety or moderation allegations do not silently become Participant Profile truth, matching features or AI memory.
59. Researcher and notebook access uses governed analytical data rather than production database access.
60. DatasetLock requires approved definition, lineage, quality, Consent, de-identification and human authority.
61. A locked DatasetVersion is immutable.
62. AI cannot lock a DatasetVersion.
63. AnalysisRun uses an exact approved AnalysisPlan and locked DatasetVersion.
64. Analytical output does not directly mutate operational records.
65. Public content, multimedia and social graphs are not automatically de-identified.
66. Exports require purpose, recipient, authority, restrictions, manifest and audit.
67. Participant portability does not create research or redistribution permission.
68. Search and vector stores inherit current source permission, visibility, Block, deletion and retention.
69. Audit is tamper-evident and avoids unnecessary sensitive content.
70. Operational telemetry and governance audit are distinct.
71. Security incidents may require intervention, matching, public-publication or Research Project pause.
72. Break-glass access is exceptional, minimum, time-limited and reviewed.
73. Technical administration does not create Participant-content, research, moderation or Safety authority.
74. Production data remain isolated from lower environments unless governed de-identification is approved.
75. High-risk functionality is tested through prohibited-action and degraded-mode tests.
76. Critical Participant controls fail safely when identity, policy, Consent, Block, encryption or audit cannot be verified.
77. The MVP uses managed security capabilities where they reduce operational risk.
78. The expanded MVP includes explicit security for Life Story, Community, Open Matching, Connections, messaging, Block, report and moderation.
79. Future controls are introduced in response to demonstrated risk, scale, regulatory and governance needs.
80. Accessibility and Participant autonomy remain security requirements.

---

## 85. Summary

The Security, Privacy & Consent Architecture determines whether a Platform action is authenticated, authorised, consented, purpose-limited, minimum-necessary, safe and accountable.

Its central human-access decision is:

```text
Authenticated Identity
        ↓
Role and Scope
        ↓
Relationship or Connection Context
        ↓
Consent and Purpose
        ↓
Specific Permission and Resource State
        ↓
Visibility, Block and Domain Preconditions
        ↓
Permit • Deny • Condition • Confirm • Review • Approve
```

Its central AI-access decision is:

```text
Human Actor Permission
        ↓
Approved AI Configuration and Task
        ↓
Tool Permission
        ↓
Minimum-Necessary Context
        ↓
Output Validation
        ↓
Participant Confirmation or Human Review
        ↓
Owning-Domain Command
```

Its central rule is:

> No Participant, Supporter, Connection, staff member, administrator, integration, device, analytical process or AI component may access or act on sensitive Platform data solely because it is technically capable of doing so.

The architecture protects:

- Participant identity, autonomy, dignity and choices;
- Life Story authorship and privacy;
- safe Community and human connection;
- matching fairness and Mutual Acceptance;
- confidential reporting and accountable moderation;
- Safety Signal and Safety Event integrity;
- evidence and research reproducibility;
- and ecosystem trust.

Security controls must remain understandable, accessible, reviewable and aligned with the actual purpose of the Healthy Aging Digital Intervention Research Platform.
