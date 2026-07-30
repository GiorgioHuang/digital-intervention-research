# Document 4 — User Roles & Permission Model

**Version:** 3.0  
**Status:** Revised Architecture Baseline  
**Handbook Volume:** Volume I — Product, Domain & Research Architecture  
**Primary System:** Digital Intervention Research Platform  
**Document Owner:** Product and Research Governance  
**Approved By:** To be assigned  
**Last Updated:** 2026-07-28  
**Supersedes:** Document 4 — User Roles & Permission Model v2.0  
**Review Trigger:** A material change to user roles, relationship types, consent, delegation, supported decision-making, substitute authority, purpose-of-use, approval authority, AI permissions, organisation boundaries, or resource access rules

---

## 1. Purpose

This document defines the authoritative **User Roles & Permission Model** for the **Healthy Aging Digital Intervention Research Platform**.

It establishes:

- who may use the platform;
- which roles and relationships exist;
- how authority is granted, limited, delegated, reviewed, and revoked;
- how consent affects access and action;
- how purpose-of-use affects permission;
- how resource state affects permission;
- how supported decision-making and substitute authority are represented;
- how research, safety, evidence, technical, and organisational authority remain separated;
- how the AI Companion operates within effective human permissions;
- and how every material access decision remains explainable and auditable.

The central rule is:

> A role or relationship never grants unrestricted access by itself. Effective permission depends on the complete decision context.

The canonical permission formula is:

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

A permission is valid only when all required elements are present and no explicit restriction, withdrawal, suspension, or deny rule applies.

---

## 2. Scope

This document covers:

- human platform roles;
- relationship-based roles;
- research and governance roles;
- technical administration roles;
- organisation actors;
- external Knowledge Platform roles;
- system actors;
- role scope;
- relationship scope;
- consent;
- delegation;
- supported decision-making;
- substitute authority;
- purpose-of-use;
- context;
- specific permission;
- resource state;
- permission evaluation;
- object-level access;
- field-level restriction;
- approval authority;
- separation of duties;
- revocation;
- expiry;
- audit;
- AI permission enforcement;
- MVP role scope;
- deferred capabilities;
- and future evolution.

This document does not define:

- authentication protocols;
- password or MFA configuration;
- encryption implementation;
- database row-level security syntax;
- final API claims;
- final identity-provider mappings;
- final legal authority rules for every jurisdiction;
- or final organisation-specific role assignments.

Those implementation details are defined in Volume II and project-specific governance artefacts.

---

## 3. Relationship to Other Documents

### Depends on

- Document 0 — Platform Ecosystem Architecture
- Document 1 — Project Definition & Vision
- Document 2 — Conceptual & Evidence Framework
- Document 3 — Intervention Map

### Provides input to

- Document 5 — Ability-Adaptive UX Principles
- Document 6 — Core Product Modules
- Document 7 — Information Architecture
- Document 8 — Core Domain Model & Ubiquitous Language
- Document 9 — Evidence & Knowledge Integration Architecture
- Document 10 — AI Companion Architecture
- Document 11 — Research & Evaluation Framework
- Document 12 — Data & Interoperability Architecture
- Document 13 — System Context & Technical Architecture
- Document 14 — Security, Privacy & Consent Architecture
- Document 15 — API, Event & Integration Specifications
- Document 16 — Database & Storage Design
- Document 17 — AI Orchestration & Model Operations
- Document 18 — MVP Scope & Delivery Roadmap
- Document 19 — Initial Pilot Research Protocol
- Document 20 — UX Flows & Design System Specification

---

## 4. Canonical Terminology

### 4.1 Participant

A person enrolled in, invited to, screened for, or otherwise interacting through a Research Project.

`Participant` is the canonical domain actor.

### 4.2 Older Adult

A population description.

It does not automatically imply a specific platform role, level of ability, or permission.

### 4.3 Resident

A contextual term used only when the Participant is in a residential, assisted-living, or long-term care setting.

`Resident` is not the general platform role.

### 4.4 User

A generic technical term for an authenticated human using the platform.

### 4.5 Supporter

A person authorised to assist a Participant within an explicit relationship and permission scope.

A Supporter may be:

- a family member;
- a friend;
- an informal caregiver;
- a community volunteer;
- or another trusted person.

### 4.6 Professional Caregiver

A professional assigned by an organisation or care setting who may support permitted intervention, assessment, or observation workflows.

### 4.7 Relationship

A time-bounded and scoped association between two actors.

A relationship is not itself sufficient permission.

### 4.8 Consent

A Participant's recorded authorisation or refusal for a specific purpose, activity, data use, recipient, and period.

### 4.9 Delegation

A permission granted by an authorised actor to another actor for a defined task and scope.

### 4.10 Supported Decision-Making

Assistance that helps a Participant understand, communicate, or exercise their own decision.

### 4.11 Substitute Authority

Authority exercised by a legally or ethically recognised substitute decision-maker when the Participant cannot make a specific decision and applicable governance permits substitution.

### 4.12 Purpose-of-Use

The declared and permitted reason for accessing data or performing an action.

### 4.13 Specific Permission

An explicit action-level capability such as:

- view;
- create;
- update;
- approve;
- export;
- invite;
- assign;
- withdraw;
- or administer.

### 4.14 Resource State

The lifecycle state of the object being accessed.

Examples:

- Draft;
- In Review;
- Approved;
- Active;
- Paused;
- Locked;
- Superseded;
- Withdrawn;
- Archived.

---

## 5. Design Principles

### 5.1 Least Privilege

Every actor receives only the minimum access required for an approved purpose.

### 5.2 Deny by Default

Access is denied unless an explicit valid rule permits it.

### 5.3 Participant-Centred Control

The Participant should retain meaningful control over:

- participation;
- personal information;
- relationship access;
- supporter involvement;
- AI use;
- sharing;
- reminders;
- and withdrawal

where legally and ethically possible.

### 5.4 Relationship Does Not Equal Authority

Family, friendship, caregiving, or organisational affiliation does not automatically grant access.

### 5.5 Consent Does Not Replace Permission

Consent may be necessary but is not sufficient.

The actor must also hold the required role and specific permission.

### 5.6 Permission Does Not Replace Consent

A researcher or administrator role does not override Participant consent.

### 5.7 Purpose Limitation

The same data may be permitted for one purpose and prohibited for another.

### 5.8 Resource-State Awareness

An actor may edit a Draft but not an Approved or Locked record.

### 5.9 Separation of Duties

Creation, review, approval, publication, export, and technical administration should remain separable.

### 5.10 Human Accountability

AI, automation, and technical infrastructure may support permission decisions but do not become governance authorities.

### 5.11 Transparency

Users should be able to understand:

- who has access;
- why;
- for what purpose;
- for how long;
- and how access can be changed or revoked.

### 5.12 Revocability

Relationship, delegation, consent, and temporary access should be revocable where permitted.

### 5.13 Auditability

Every material access, denial, approval, delegation, revocation, and export should be traceable.

### 5.14 Minimum Necessary Access

Access should be limited to the smallest data scope and shortest duration required.

### 5.15 No Silent Privilege Expansion

A role change, relationship change, Protocol amendment, AI change, or organisation change must not silently broaden access.

---

## 6. Actor Classification

The platform distinguishes the following actor categories.

```text
Human Platform Actors
        ├── Participant
        ├── Supporter
        ├── Professional Caregiver
        ├── Research Roles
        ├── Governance Roles
        └── Administration Roles

Organisation Actors
        ├── Research Organisation
        ├── Care Organisation
        ├── Community Organisation
        └── Platform Operator

External Knowledge Platform Actors
        ├── Knowledge Curator
        ├── Evidence Reviewer
        └── Ontology Steward

System Actors
        ├── AI Companion
        ├── Background Worker
        ├── Integration Service
        └── Service Account
```

These categories must not be collapsed into one generic role list.

---

## 7. Human Platform Roles

## 7.1 Participant

A Participant may, subject to project, consent, and resource state:

- view accessible Research Project information;
- review and record consent decisions;
- review current consent;
- change optional preferences;
- request help;
- complete assessments;
- participate in assigned interventions;
- use the AI Companion within approved scope;
- choose or decline supporter involvement;
- review relationship permissions;
- report concerns;
- pause activities;
- withdraw from optional components;
- withdraw from the Research Project;
- request access, correction, deletion, or portability where supported;
- and receive an accessible results summary.

A Participant may not:

- approve a Protocol;
- approve an Evidence Decision;
- approve a Dataset Version;
- approve a Research Finding;
- view another Participant's data;
- or assign themselves governance authority.

---

## 7.2 Supporter

A Supporter may assist only when:

- a valid relationship exists;
- the Participant or authorised substitute has granted the relevant scope;
- the Research Project permits supporter involvement;
- and the access has not expired or been revoked.

A Supporter may be permitted to:

- assist with navigation;
- help explain information;
- assist with accessibility settings;
- participate in an authorised intervention activity;
- receive an authorised reminder;
- view specifically shared content;
- provide optional feedback;
- or report a concern.

A Supporter may not automatically:

- view health, assessment, research, or AI records;
- consent on behalf of the Participant;
- change the Participant's preferences;
- withdraw the Participant;
- view other relationships;
- access unrelated projects;
- or approve research decisions.

---

## 7.3 Informal Caregiver

An Informal Caregiver is a Supporter whose relationship includes unpaid or non-professional care support.

They may be granted additional scoped permissions such as:

- record an observation;
- assist with intervention completion;
- confirm assistance provided;
- or communicate an accessibility concern.

Their authority remains:

- relationship-based;
- consent-based;
- task-specific;
- time-bounded;
- and revocable.

---

## 7.4 Professional Caregiver

A Professional Caregiver may be assigned through an organisation and Research Project.

Possible permissions include:

- assist with onboarding;
- assist with accessibility;
- deliver a defined intervention component;
- record an observation;
- complete an assigned assessment;
- document assistance;
- report a Safety Signal;
- or participate in an authorised care-setting workflow.

A Professional Caregiver does not receive default authority to:

- diagnose;
- prescribe;
- provide medication-management recommendations;
- alter the Protocol;
- approve research decisions;
- approve safety closure;
- or access all Participant records.

Any future clinical capability requires separately approved scope, intervention design, clinical governance, safety architecture, and Protocol authority.

---

## 7.5 Research Coordinator

A Research Coordinator may:

- manage invitations;
- support screening;
- schedule activities;
- support onboarding;
- record operational notes;
- monitor completion;
- and coordinate follow-up.

They may not approve:

- Protocol Versions;
- Analysis Plans;
- Research Findings;
- or their own major deviations

unless separately assigned an authorised approval role.

---

## 7.6 Researcher

A Researcher may, within assigned projects:

- create and edit Research Questions;
- create Protocol drafts;
- define Intervention drafts;
- configure assessments;
- review authorised Participant data;
- monitor intervention delivery;
- review data quality;
- generate Dataset drafts;
- create Analysis Plan drafts;
- perform analysis;
- draft interpretation;
- and draft Research Findings.

A Researcher may not automatically:

- approve their own Protocol;
- approve their own Evidence Decision;
- lock a Dataset Version;
- approve a final Research Finding;
- override consent;
- or view data outside assigned scope.

---

## 7.7 Data Analyst

A Data Analyst may:

- access approved pseudonymous Dataset Versions;
- run approved analyses;
- document transformations;
- create analysis outputs;
- and contribute to interpretation.

They should not receive direct Participant identity access unless separately required and approved.

---

## 7.8 Research Approver

A Research Approver may:

- approve or reject Protocol Versions;
- approve or reject major Protocol amendments;
- approve Analysis Plans;
- approve interpretation;
- approve Research Findings;
- or authorise progression to the next research phase.

The role should be separate from routine technical administration.

Self-approval should be restricted for high-impact artefacts.

---

## 7.9 Evidence Reviewer

Within the Research Platform, an Evidence Reviewer may:

- review Knowledge References;
- review Evidence Decision drafts;
- assess relevance and limitations;
- identify unresolved uncertainty;
- approve or reject an Evidence Decision;
- and request re-review.

This role does not curate or publish authoritative Knowledge Platform content.

---

## 7.10 Safety Reviewer

A Safety Reviewer may:

- review Safety Signals;
- create or confirm Safety Events;
- classify severity;
- request further information;
- pause an intervention;
- recommend study pause;
- document a safety decision;
- and close or escalate an event.

The AI Companion may assist detection or summarisation but cannot replace the Safety Reviewer.

---

## 7.11 Privacy Reviewer

A Privacy Reviewer may:

- review data-use requests;
- review consent compatibility;
- review exports;
- review provider use;
- review re-identification risk;
- and approve or reject selected privacy-sensitive workflows.

They should not gain unrestricted access to all content merely by holding the role.

---

## 7.12 Organisation Administrator

An Organisation Administrator may:

- manage organisation membership;
- assign organisation-scoped roles;
- manage invitations;
- manage local configuration;
- view organisation-level operational status;
- and review organisation-scoped audit information.

They do not automatically receive access to Participant research content.

---

## 7.13 System Administrator

A System Administrator may:

- operate platform infrastructure;
- manage deployment;
- manage configuration;
- manage integration status;
- manage technical incidents;
- and support recovery.

A System Administrator does not automatically have authority to:

- read Participant content;
- approve Protocols;
- approve Evidence Decisions;
- approve Safety Events;
- lock datasets;
- approve Research Findings;
- or change consent.

Privileged technical access must be:

- exceptional;
- purpose-bound;
- time-bounded where possible;
- approved;
- and audited.

---

## 8. Organisation Actors

## 8.1 Research Organisation

Owns or sponsors one or more Research Projects.

It may define:

- project membership;
- governance roles;
- approved settings;
- and operational policies.

It does not own Participant consent decisions.

---

## 8.2 Care Organisation

May provide:

- setting;
- staff;
- recruitment support;
- intervention support;
- or safety escalation.

Care-organisation membership does not automatically grant Research Project access.

---

## 8.3 Community Organisation

May:

- recruit;
- host activities;
- provide programme contacts;
- or support implementation.

It does not receive Participant data unless explicitly permitted.

---

## 8.4 Platform Operator

Operates the technical platform.

It does not become the owner of:

- Participant decisions;
- Research Project governance;
- Knowledge Platform governance;
- or scientific findings.

---

## 9. External Knowledge Platform Roles

The following roles belong to the **Healthy Aging Knowledge Platform**, not the Research Platform's ordinary role catalogue.

### 9.1 Knowledge Curator

May curate authoritative knowledge records.

### 9.2 External Evidence Reviewer

May review evidence quality and evidence strength for Knowledge Platform publication.

### 9.3 Ontology Steward

May govern ontology, terminology, and semantic consistency.

### 9.4 Boundary Rule

Research Platform users may prepare:

- Knowledge References;
- Evidence Decisions;
- Research Findings;
- and submission packages.

They do not gain Knowledge Platform publication authority unless separately authenticated and authorised by the Knowledge Platform.

---

## 10. System Actors

## 10.1 AI Companion

The AI Companion is a system capability, not a human role.

It may operate only through:

- an authenticated human or service context;
- an approved AI configuration;
- an approved task;
- filtered context;
- allowlisted tools;
- and recorded audit.

The AI Companion cannot create its own authority.

---

## 10.2 Background Worker

A Background Worker performs approved queued tasks under a service identity.

Examples:

- dataset generation;
- notification delivery;
- import validation;
- or export preparation.

Its permission scope should be limited to the task.

---

## 10.3 Integration Service

An Integration Service communicates with an approved external system.

Its access is limited by:

- purpose;
- interface;
- data scope;
- provider contract;
- and service permission.

---

## 10.4 Service Account

A Service Account is a non-human technical identity.

It must have:

- an owner;
- explicit scope;
- credential lifecycle;
- expiry or review;
- and audit.

A Service Account must not use a broad human administrator role.

---

## 11. Role Scope

Every role assignment should define its scope.

Possible scope levels:

- Platform;
- Organisation;
- Research Project;
- Protocol;
- Participant cohort;
- Participant;
- Resource;
- Task;
- or Temporary session.

A role without scope should be treated as invalid unless explicitly defined as platform-wide.

---

## 12. Relationship Model

A relationship should be represented as a governed record.

A relationship should include:

- Relationship ID;
- source actor;
- target actor;
- relationship type;
- direction;
- status;
- verification;
- permission scope;
- consent reference;
- purpose;
- start time;
- expiry;
- revocation status;
- and audit history.

---

## 13. Relationship Types

Representative relationship types include:

- Family Member;
- Friend;
- Informal Caregiver;
- Professional Caregiver;
- Community Volunteer;
- Research Staff;
- Substitute Decision-Maker;
- Supported Decision-Making Assistant;
- Organisation Member;
- or Other Approved Relationship.

Relationship type alone does not grant access.

---

## 14. Relationship Direction

Relationships may be directional.

Example:

```text
Participant authorises Supporter
```

does not imply:

```text
Supporter authorises Participant
```

Permissions must be evaluated in the direction of the requested action.

---

## 15. Relationship States

Representative states:

- Proposed;
- Pending Verification;
- Active;
- Restricted;
- Suspended;
- Expired;
- Revoked;
- or Rejected.

Only an active and applicable relationship may contribute to effective permission.

---

## 16. Relationship Verification

Verification may include:

- Participant confirmation;
- organisation assignment;
- identity verification;
- documentary evidence;
- research-team confirmation;
- or governance approval.

The required level depends on the risk of the permission.

---

## 17. Relationship Permission Scope

A relationship permission should specify:

- allowed resource type;
- allowed action;
- project;
- Participant;
- purpose;
- field visibility;
- duration;
- and whether re-sharing is prohibited.

Example:

```text
Supporter may view the current connection activity
for Participant P
within Research Project R
for the purpose of helping schedule one interaction
until Date D.
```

---

## 18. Relationship Revocation

The Participant or authorised governance role should be able to revoke or restrict relationship access where permitted.

Revocation should:

- take effect promptly;
- stop future access;
- stop future notifications;
- stop future AI context sharing;
- preserve audit;
- and trigger review of active tasks.

---

## 19. Delegation Model

Delegation allows one authorised actor to grant another actor permission to perform a defined task.

Delegation must include:

- delegator;
- delegate;
- authority basis;
- specific task;
- scope;
- start;
- expiry;
- revocation;
- and whether further delegation is prohibited.

---

## 20. Delegation Restrictions

Delegation cannot grant authority that the delegator does not hold.

Delegation should not permit:

- approval of the delegator's own work;
- silent expansion of consent;
- cross-project access;
- or transfer of non-delegable governance authority.

---

## 21. Supported Decision-Making

Supported decision-making assists the Participant to make their own decision.

A supporter may:

- explain;
- read information;
- help navigate;
- help communicate;
- or help compare options.

The supporter should not:

- answer in place of the Participant without disclosure;
- pressure the Participant;
- hide alternatives;
- or change the recorded decision.

The system should record:

- assistance provided;
- supporter identity;
- decision made by;
- and any observed concern.

---

## 22. Substitute Authority

Substitute authority is distinct from supported decision-making.

It should require:

- recognised authority basis;
- decision scope;
- effective period;
- applicable jurisdiction or governance;
- evidence of authority;
- and review.

A substitute decision-maker should not receive unrestricted access beyond the decision scope.

---

## 23. Consent Model

Consent should be:

- specific;
- informed;
- accessible;
- granular;
- versioned;
- purpose-bound;
- time-aware;
- reviewable;
- and withdrawable where permitted.

Consent should not be represented as one permanent global boolean.

---

## 24. Consent Structure

A consent record should identify:

- Participant;
- Research Project;
- Consent Template Version;
- consent item;
- decision;
- purpose;
- activity;
- data category;
- recipient;
- duration;
- restrictions;
- decision-maker;
- supporter involvement;
- evidence;
- effective time;
- expiry;
- withdrawal;
- and supersession.

---

## 25. Consent Decisions

Representative decisions:

- Granted;
- Declined;
- Restricted;
- Deferred;
- Withdrawn;
- Expired;
- Superseded;
- or Re-Consent Required.

---

## 26. Consent Scope

Consent may separately address:

- research participation;
- screening;
- intervention delivery;
- assessment;
- AI-assisted interaction;
- AI message retention;
- AI memory;
- supporter involvement;
- reminders;
- audio;
- video;
- image;
- wearable data;
- qualitative interview;
- data analysis;
- external data sharing;
- future contact;
- future research use;
- and retention.

Optional consent should not be bundled into mandatory participation unless scientifically necessary and approved.

---

## 27. Consent and Data Use

Consent should be evaluated at both:

- collection time;
- and use time.

Previously collected data should not automatically be reused for a new purpose.

---

## 28. Consent Withdrawal

Withdrawal should identify:

- scope withdrawn;
- effective time;
- future data collection;
- intervention impact;
- AI impact;
- supporter impact;
- notification impact;
- use of existing data;
- and required follow-up.

Withdrawal from one component does not automatically imply withdrawal from every component unless specified.

---

## 29. Re-Consent

Re-consent may be required after:

- material Protocol amendment;
- material Intervention Version change;
- new AI provider;
- broader AI context use;
- new external recipient;
- new supporter access;
- new media collection;
- new wearable source;
- extended retention;
- or extended follow-up.

---

## 30. Consent Conflict

When consent is:

- missing;
- expired;
- contradictory;
- uncertain;
- or being reviewed,

the platform should deny or pause sensitive access.

---

## 31. Purpose-of-Use

Purpose-of-use identifies why access is requested.

Representative purposes include:

- Research Administration;
- Screening;
- Consent Support;
- Intervention Delivery;
- Assessment;
- Safety Review;
- Research Analysis;
- Data Quality;
- Participant Support;
- Technical Support;
- Privacy Review;
- Security Investigation;
- Export;
- External Submission;
- or Knowledge Publication Preparation.

---

## 32. Purpose Rules

Purpose must be:

- declared;
- permitted;
- specific enough to evaluate;
- recorded for sensitive access;
- and compatible with consent and role.

A valid role may still be denied when the purpose is not permitted.

---

## 33. Context

Context includes the circumstances of the request.

Representative context includes:

- active Research Project;
- current Participant;
- current assignment;
- active relationship;
- current session;
- location or setting;
- emergency or safety state;
- device trust;
- authentication strength;
- and current workflow.

Context should be resolved server-side where possible.

---

## 34. Specific Permissions

Representative permissions include:

### Identity and Membership

- user.view
- user.invite
- membership.assign
- role.assign
- relationship.propose
- relationship.approve
- relationship.revoke

### Specific Permissions — Consent

- consent.view
- consent.present
- consent.record
- consent.restrict
- consent.withdraw
- consent.review
- consent.supersede

### Participant

- participant.view
- participant.update-own
- participant.update-assigned
- participant.export
- participant.withdraw

### Research

- project.create
- project.view
- project.update
- protocol.draft
- protocol.review
- protocol.approve
- protocol.suspend

### Intervention

- intervention.draft
- intervention.review
- intervention.approve
- assignment.create
- session.deliver
- session.record
- assignment.pause

### Assessment

- assessment.configure
- assessment.complete-own
- assessment.complete-assigned
- observation.record
- outcome.record
- assessment.invalidate

### Evidence

- evidence.search
- evidence.reference
- evidence-decision.draft
- evidence-decision.review
- evidence-decision.approve

### Safety

- safety-signal.record
- safety-event.create
- safety-event.review
- intervention.pause-for-safety
- study.pause-for-safety

### Data and Analysis

- dataset.generate
- dataset.review
- dataset.lock
- analysis.run
- interpretation.draft
- interpretation.approve
- finding.draft
- finding.approve
- export.request
- export.approve

### AI

- ai.use
- ai.use-participant-context
- ai.create-draft
- ai.request-tool
- ai.confirm-reversible-action
- ai.review
- ai.configure
- ai.disable

### Administration

- integration.configure
- service-account.manage
- audit.view
- system.configure
- incident.manage

---

## 35. Resource State

Permission should depend on resource state.

Examples:

### Protocol Version

| State | Allowed behaviour |
|---|---|
| Draft | Authorised researchers may edit |
| In Review | Editing restricted; reviewers comment |
| Approved | Immutable |
| Active | Used for current Research Project operations |
| Suspended | New affected actions blocked |
| Superseded | Read-only historical reference |
| Archived | Retained and restricted |

### Dataset Version

| State | Allowed behaviour |
|---|---|
| Draft | Definition may change |
| Generated | Quality review allowed |
| Quality Reviewed | Eligible for lock |
| Locked | Immutable |
| Analysed | Linked to analysis outputs |
| Archived | Historical retention |

### Resource State — Consent

| State | Allowed behaviour |
|---|---|
| Draft | Not effective |
| Granted | Effective within scope |
| Restricted | Effective only within restrictions |
| Expired | No longer effective |
| Withdrawn | Future covered actions blocked |
| Superseded | Historical only |

---

## 36. Permission Evaluation

The canonical evaluation sequence is:

```text
1. Authenticate Actor
        ↓
2. Resolve Actor Type and Active Role
        ↓
3. Resolve Role Scope
        ↓
4. Resolve Relationship
        ↓
5. Resolve Consent
        ↓
6. Resolve Purpose
        ↓
7. Resolve Context
        ↓
8. Check Specific Permission
        ↓
9. Check Resource State
        ↓
10. Apply Explicit Deny and Restrictions
        ↓
11. Apply Field and Data Minimisation Rules
        ↓
12. Record Decision
```

---

## 37. Permission Decision Outcomes

Representative outcomes:

- Allow;
- Allow with Field Restrictions;
- Allow with Confirmation;
- Allow with Human Review;
- Allow Temporarily;
- Deny;
- Deny and Hide Existence;
- Re-Consent Required;
- Relationship Verification Required;
- Step-Up Authentication Required;
- or Safety Review Required.

---

## 38. Explicit Deny Rules

An explicit deny should override an allow.

Examples:

- consent withdrawn;
- relationship revoked;
- project membership suspended;
- resource locked;
- purpose prohibited;
- data classification not approved;
- AI tool prohibited;
- study paused;
- or user suspended.

---

## 39. Object-Level Authorisation

Permission must be evaluated for the specific object.

Example:

A Researcher assigned to Research Project A must not access a Participant in Research Project B merely because both objects are of type `Participant`.

---

## 40. Field-Level Authorisation

A permitted object may still contain restricted fields.

Examples:

- direct identity;
- supporter contact information;
- Safety Event narrative;
- re-identification key;
- legal authority evidence;
- or sensitive AI content.

---

## 41. Collection-Level Authorisation

Lists, searches, counts, and dashboards must return only authorised objects.

The platform must not retrieve all records and filter them only in the user interface.

---

## 42. Existence Protection

Where revealing that a resource exists would be unsafe, the platform may return a not-found result instead of an explicit permission-denied result.

---

## 43. Temporary Permission

Temporary access should include:

- reason;
- approver;
- scope;
- start;
- expiry;
- and audit.

Temporary access should not become permanent silently.

---

## 44. Approval Authority

Approval authority should be explicit and artefact-specific.

Representative approval responsibilities:

| Artefact or Action | Primary Approval Role |
|---|---|
| Protocol Version | Research Approver |
| Major Protocol Amendment | Research Approver |
| Evidence Decision | Evidence Reviewer or designated Research Approver |
| Intervention Version | Research Approver or designated Intervention Approver |
| AI Intervention Configuration | AI Governance plus Research Approval |
| Safety Event Closure | Safety Reviewer |
| Dataset Lock | Authorised Data or Research Approver |
| Analysis Plan | Research Approver |
| Interpretation | Research Approver |
| Research Finding | Research Approver |
| External Export | Data/Privacy Approval as required |
| Knowledge Publication | External Knowledge Platform authority |

---

## 45. Separation of Duties

The platform should support separation among:

- creator;
- reviewer;
- approver;
- executor;
- and auditor.

High-impact artefacts should not rely on one person performing every function.

---

## 46. Self-Approval

Self-approval should be prohibited or explicitly justified for:

- Protocol Versions;
- major amendments;
- high-risk AI configurations;
- Dataset Locks;
- Research Findings;
- and external releases.

---

## 47. Conflict of Interest

Approval workflows should support recording:

- conflict declared;
- recusal;
- alternative approver;
- and decision history.

---

## 48. AI Permission Model

The AI Companion's effective permission is:

```text
Effective AI Permission
        =
Human Actor Permission
+ Approved AI Configuration
+ Approved Task
+ Tool Permission
+ Consent
+ Purpose
+ Context
+ Data Classification
+ Action Risk
```

The AI Companion receives the intersection of these permissions, never the union.

---

## 49. AI Context Access

Before data reaches the model, the platform must:

- authenticate the requesting actor;
- resolve the role;
- resolve relationship;
- resolve consent;
- resolve purpose;
- filter fields;
- remove unnecessary identifiers;
- apply project scope;
- apply Participant scope;
- and apply retention rules.

The model must not receive unauthorised data and then be instructed not to use it.

---

## 50. AI Action Levels

### Level 0 — Explain

The AI explains approved information.

### Level 1 — Suggest

The AI suggests an option.

### Level 2 — Draft

The AI creates a draft that has no final effect.

### Level 3 — Confirmed Reversible Action

The AI proposes a reversible action that requires explicit human confirmation.

### Level 4 — Controlled Workflow Action

The AI participates in a governed action requiring explicit permission and possibly approval.

### Level 5 — Prohibited Autonomous Action

The AI must not perform the action autonomously.

---

## 51. AI Prohibited Autonomous Actions

The AI Companion must not autonomously:

- grant consent;
- withdraw consent;
- enrol a Participant;
- withdraw a Participant;
- create or revoke a relationship;
- approve a Protocol;
- approve an Intervention Version;
- approve an Evidence Decision;
- close a serious Safety Event;
- lock a Dataset Version;
- approve an Analysis Plan;
- approve a Research Finding;
- publish knowledge;
- diagnose;
- prescribe;
- provide medication-management authority;
- override permissions;
- delete sensitive records;
- or make irreversible high-impact decisions.

---

## 52. AI Tool Permissions

Every AI tool should define:

- allowed roles;
- allowed purposes;
- allowed resource types;
- required consent;
- required relationship;
- data classification;
- side effects;
- confirmation level;
- human review;
- timeout;
- and audit.

---

## 53. AI Draft Ownership

AI-generated content should be marked as:

- AI Suggestion;
- AI Draft;
- or AI Inference.

It becomes a human decision only after an authorised human reviews and records that decision.

---

## 54. AI Memory Permission

AI memory should be:

- purpose-bound;
- consent-aware;
- source-labelled;
- visible where appropriate;
- correctable;
- deletable where permitted;
- and time-bounded.

AI memory does not create new permission.

---

## 55. AI Safety Escalation

The AI may:

- detect a possible Safety Signal;
- explain limitations;
- suggest human support;
- or create a review request.

The AI may not make the final safety determination.

---

## 56. Privacy Levels

The platform may classify data as:

### Public

Approved for public access.

### Organisation

Available only within an authorised organisation scope.

### Research Project

Available only within a Research Project.

### Participant-Controlled

Available according to Participant consent and relationship scope.

### Restricted

Requires specific role, purpose, and enhanced controls.

### Highly Restricted

Requires explicit approval, strong authentication, and detailed audit.

Privacy level does not replace object-level permission.

---

## 57. Data Category Restrictions

Representative restricted categories include:

- direct identity;
- contact details;
- legal authority evidence;
- Safety Event narratives;
- sensitive free text;
- re-identification keys;
- identifiable media;
- AI conversation content;
- and external provider metadata.

---

## 58. Research Data Access

Research data access should distinguish:

- identifiable operational data;
- coded or pseudonymous data;
- de-identified data;
- aggregated data;
- and public results.

Researchers should receive the least identifiable form sufficient for the approved purpose.

---

## 59. Export Permission

Export requires separate evaluation because export changes:

- storage location;
- recipient;
- retention;
- control;
- and re-identification risk.

An actor who can view data does not automatically have export permission.

---

## 60. External Sharing

External sharing should require:

- approved recipient;
- approved purpose;
- compatible consent;
- minimum data;
- transfer protection;
- retention terms;
- and audit.

---

## 61. Administration Boundaries

Technical administrators should not receive content access by default.

Research administrators should not receive infrastructure privileges by default.

Organisation administrators should not receive cross-organisation access.

---

## 62. Emergency and Break-Glass Access

Break-glass access is deferred unless a real operational requirement is approved.

If introduced, it must include:

- defined emergency;
- limited role;
- reason;
- strong authentication;
- minimum data;
- time limit;
- immediate audit;
- post-event review;
- and Participant notification where appropriate.

Break-glass must not be used for convenience.

---

## 63. Account and Role Lifecycle

Role assignment states may include:

- Proposed;
- Pending Approval;
- Active;
- Suspended;
- Expired;
- Revoked;
- or Rejected.

A suspended or revoked role must not contribute to effective permission.

---

## 64. Role Assignment Review

High-impact roles should be reviewed periodically.

Examples:

- Research Approver;
- Safety Reviewer;
- Privacy Reviewer;
- Organisation Administrator;
- System Administrator;
- AI Configuration Administrator.

---

## 65. Role Expiry

Temporary or project-specific roles should expire automatically unless renewed.

---

## 66. Role Revocation

Revocation should:

- stop future access;
- stop active sessions where required;
- stop queued actions;
- stop AI access;
- stop notifications;
- and create an audit record.

---

## 67. Organisation Exit

When a user leaves an organisation:

- organisation-scoped roles end;
- service ownership is reassigned;
- active approvals are reviewed;
- access tokens are revoked;
- and records remain historically attributable.

---

## 68. Participant Withdrawal Effects

Participant withdrawal may affect:

- intervention access;
- assessment access;
- supporter access;
- reminders;
- AI use;
- future contact;
- data collection;
- and project visibility.

The effect depends on the withdrawal scope and Protocol.

---

## 69. Study Pause Effects

A study pause may:

- block new enrolment;
- block new intervention sessions;
- block selected AI tools;
- preserve read-only review;
- allow safety follow-up;
- and preserve audit.

---

## 70. Audit Requirements

Material audit events include:

- role assigned;
- role changed;
- role revoked;
- relationship proposed;
- relationship approved;
- relationship restricted;
- relationship revoked;
- consent granted;
- consent restricted;
- consent withdrawn;
- access denied;
- sensitive record viewed;
- export requested;
- export approved;
- AI tool requested;
- AI action confirmed;
- Protocol approved;
- Safety Event reviewed;
- Dataset locked;
- Research Finding approved;
- and privileged access used.

---

## 71. Audit Content

Audit should record:

- actor;
- actor type;
- active role;
- organisation;
- Research Project;
- Participant where permitted;
- resource;
- action;
- purpose;
- decision;
- reason;
- policy version;
- time;
- session;
- and trace identifier.

---

## 72. Explainable Permission Decisions

A permission decision should be explainable to authorised reviewers.

Example:

```text
Denied because:
- Supporter relationship is revoked;
- consent for supporter access is withdrawn;
- and the requested assessment is outside the permitted activity scope.
```

The user-facing explanation may be simplified to protect sensitive information.

---

## 73. Permission Conflict Resolution

When rules conflict:

1. explicit deny wins;
2. Participant restriction wins where legally applicable;
3. narrower scope wins;
4. shorter duration wins;
5. higher data classification requires stronger control;
6. resource-state restriction wins;
7. unresolved conflict results in deny or human review.

---

## 74. Policy Ownership

### Product and Research Governance

Owns:

- canonical roles;
- approval authority;
- research access rules;
- and Participant control principles.

### Privacy Governance

Owns:

- consent compatibility;
- purpose limitation;
- data-sharing rules;
- and privacy-sensitive access.

### Security Governance

Owns:

- authentication strength;
- privileged access;
- technical risk;
- and incident access.

### AI Governance

Owns:

- model and tool permissions;
- AI action levels;
- AI context rules;
- and AI kill switches.

### Organisation Governance

Owns:

- local membership;
- local assignments;
- and approved local operations.

---

## 75. Permission Change Governance

A permission-model change should identify:

- affected roles;
- affected relationships;
- affected consent;
- affected resources;
- affected AI tools;
- affected APIs;
- affected datasets;
- migration impact;
- re-consent impact;
- and approval authority.

---

## 76. Permission Policy Versioning

Permission policies should be versioned.

An audit record should identify which policy version produced the decision.

---

## 77. Testing Requirements

The permission model should be tested for:

- wrong role;
- wrong organisation;
- wrong Research Project;
- wrong Participant;
- revoked relationship;
- expired relationship;
- withdrawn consent;
- restricted consent;
- wrong purpose;
- wrong resource state;
- missing specific permission;
- stale role;
- direct object reference;
- cross-Participant access;
- cross-project access;
- export without approval;
- AI context leakage;
- AI write without confirmation;
- and technical administrator overreach.

---

## 78. Negative Testing

For every permitted workflow, tests should include:

- a user who should not see it;
- a user who should see only part of it;
- a user whose consent has changed;
- and a resource whose state blocks the action.

---

## 79. MVP Role Scope

The MVP should implement these primary roles:

- Participant;
- Supporter;
- Research Coordinator;
- Researcher;
- Research Approver;
- Safety Reviewer;
- Organisation Administrator;
- System Administrator.

Optional MVP roles:

- Data Analyst;
- Evidence Reviewer;
- Privacy Reviewer;
- Professional Caregiver.

---

## 80. MVP Relationship Scope

The MVP should support:

- family member;
- friend;
- informal caregiver;
- professional caregiver;
- and research staff relationship types.

It should support:

- invitation;
- verification;
- Participant approval;
- limited permission;
- expiry;
- restriction;
- and revocation.

---

## 81. MVP Consent Scope

The MVP should support granular consent for:

- research participation;
- intervention delivery;
- assessment;
- AI interaction;
- supporter involvement;
- reminders;
- optional media;
- data analysis;
- future contact;
- and retention.

---

## 82. MVP Permission Capabilities

The MVP should support:

- role-based permission;
- organisation scope;
- Research Project scope;
- Participant scope;
- relationship scope;
- consent scope;
- purpose-of-use;
- specific action permission;
- resource-state permission;
- object-level filtering;
- field restriction;
- audit;
- revocation;
- and expiry.

---

## 83. MVP Non-Goals

The MVP does not require:

- unrestricted dynamic ABAC authoring;
- broad healthcare clinical roles;
- medication-management authority;
- emergency break-glass;
- cross-organisation federation;
- public role marketplace;
- autonomous AI authority;
- or automatic legal-authority determination.

---

## 84. Deferred Capabilities

Deferred capabilities may include:

- advanced policy authoring;
- federated identity;
- cross-site governance;
- jurisdiction-specific substitute authority engines;
- break-glass access;
- dynamic consent negotiation;
- participant-controlled data spaces;
- fine-grained external partner federation;
- and formal policy-as-code tooling.

---

## 85. Future Evolution

Future versions may support:

- policy simulation;
- participant-facing access dashboards;
- automated role-review workflows;
- cross-organisation research agreements;
- privacy-preserving federated analysis;
- dynamic consent;
- and machine-verifiable delegation.

Future capability must not weaken:

- Participant autonomy;
- purpose limitation;
- minimum necessary access;
- resource-state control;
- or human accountability.

---

## 86. Open Questions

1. Which authority approves high-impact role assignments?
2. Which roles require dual approval?
3. Which roles require periodic recertification?
4. Which Participant actions may be supporter-assisted?
5. Which decisions permit substitute authority?
6. Which legal authority evidence is required in the first pilot?
7. Which permission decisions require Participant notification?
8. Which access types require step-up authentication?
9. Which restricted fields require field-level encryption?
10. Which Research Project roles may view identifiable Participant data?
11. Which exports require Privacy Reviewer approval?
12. Which Safety Event categories restrict Participant visibility?
13. Which AI tools require Research Approver confirmation?
14. Which AI tools require Participant confirmation?
15. Which relationship types may receive reminders?
16. Which relationship permissions expire automatically?
17. Which role changes require re-consent?
18. Which organisation administrators may assign research roles?
19. Which permission rules should be implemented in application policy versus database policy?
20. Which audit events should be visible to Participants?
21. Which data-use purposes are required for the first pilot?
22. Which temporary support workflows require delegated access?
23. Which roles may correct Participant data?
24. Which roles may invalidate an assessment?
25. Which policy changes require a new major version of this document?

---

## 87. Design Decisions

This document establishes that:

1. `Participant` is the canonical domain actor.
2. `Older adult` is a population term.
3. `Resident` is a setting-specific contextual term.
4. A role alone never grants unrestricted access.
5. A relationship alone never grants access.
6. Consent is necessary for many actions but does not replace role and permission.
7. Permission does not replace consent.
8. Purpose-of-use is a mandatory part of sensitive permission decisions.
9. Context is a mandatory part of sensitive permission decisions.
10. Specific action permission is required.
11. Resource state may permit or prohibit an action.
12. Explicit deny overrides allow.
13. Object-level authorisation is mandatory.
14. Field-level restriction may apply after object access is allowed.
15. Collection queries must be permission-filtered before return.
16. Family members and supporters receive only explicit scoped access.
17. Supported decision-making is distinct from substitute authority.
18. Delegation cannot exceed the delegator's authority.
19. Professional caregiving does not create medication-management authority.
20. Research creation, review, approval, execution, and audit remain separable.
21. Technical administration does not create research authority.
22. Knowledge Platform governance roles remain external to the Research Platform.
23. The AI Companion is a system actor, not a human governance role.
24. AI receives the intersection of human permission, AI configuration, task, consent, purpose, context, data class, and risk.
25. AI cannot grant itself authority.
26. AI cannot autonomously approve consent, Protocols, Evidence Decisions, datasets, findings, safety closure, or knowledge publication.
27. AI context is filtered before reaching the model.
28. AI drafts remain distinguishable from human decisions.
29. Exports require separate permission.
30. Temporary and privileged access must be purpose-bound, time-bounded, and audited.
31. Role, relationship, consent, and policy changes must not silently expand access.
32. Permission policies are versioned and auditable.
33. Revocation should stop future access promptly.
34. The MVP implements a focused role and relationship model rather than unrestricted dynamic policy authoring.
35. Future evolution must preserve Participant control, least privilege, purpose limitation, and human accountability.

---

## 88. Summary

The User Roles & Permission Model defines how the Digital Intervention Research Platform decides who may do what, for which Participant, within which Research Project, for which purpose, under which consent, and in which resource state.

Its canonical decision model is:

```text
Actor
    ↓
Role and Scope
    ↓
Relationship
    ↓
Consent
    ↓
Purpose
    ↓
Context
    ↓
Specific Permission
    ↓
Resource State
    ↓
Restrictions and Explicit Deny
    ↓
Allow, Restrict, Review, or Deny
```

Its central rule is:

> Access is not inherited from title, family status, professional status, technical privilege, or AI capability. Access must be explicitly justified by role, relationship, consent, purpose, context, permission, and resource state.

This model protects Participant autonomy while enabling research, intervention delivery, support, safety review, and accountable technical operation.
