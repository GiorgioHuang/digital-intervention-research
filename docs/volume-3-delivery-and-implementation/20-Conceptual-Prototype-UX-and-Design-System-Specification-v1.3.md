# Document 20 — Conceptual Prototype UX Flows & Design System Specification

**Version:** 1.3  
**Status:** Active Conceptual Prototype UX and Design System Baseline  
**Handbook Volume:** Volume III — Delivery & Research Implementation  
**Primary System:** Digital Intervention Research Platform  
**Primary Product Modules:** M01–M18  
**Primary Conceptual Prototype:** Participant-Controlled Life Story and Meaningful Human Connection  
**Document Owner:** Product Design, Accessibility and UX Governance  
**Approved By:** To be assigned  
**Last Updated:** 2026-07-29  
**Supersedes:** Document 20 — UX Flows & Design System Specification v1.2  
**Review Trigger:** A material change to roles, workspaces, navigation, Consent, permission, protected existence, visibility, Life Story, PublicProfile, Community, Open Matching, MatchDecision, MutualAcceptance, ConnectionRequest, Connection, CommunicationBasis, ConversationThread, Message lifecycle or delivery, provider state, Block, Report, moderation, SafetySignal, SafetyEvent, AI behaviour, DatasetLock, AnalysisRun, ResearchFinding, accessibility, supported devices, design tokens, core components, content standards or Conceptual Prototype Protocol

---

## 1. Purpose

This document defines UX flows and design-system behaviour for a non-production conceptual prototype.

The prototype makes domain concepts visible and testable through synthetic actors and scenarios.

Its current purpose is to examine clarity, semantic consistency, state presentation, accessibility assumptions, failure recovery and human-authority boundaries—not to operate a real participant service.

## 2. Scope

The current scope includes:

- role and workspace models;
- synthetic Participant journeys;
- conceptual Consent and permission presentation;
- Life Story authorship and audience flows;
- governed Community, matching, Connection and messaging states;
- AI provenance and confirmation;
- Safety and moderation models;
- Dataset and research-state presentation;
- accessibility specifications;
- prototype components;
- and synthetic usability and contradiction testing.

The scope excludes real recruitment, real personal data, operational support commitments and production launch.

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
- Document 18 — Conceptual Research Scope & Prototype Roadmap v1.3
- Document 19 — Conceptual Research Programme & Theoretical Evaluation Protocol v1.3

### Provides input to

- Wireframes
- Interactive Prototypes
- Participant Materials
- Researcher, Supporter, Moderator and Safety Training
- Design Tokens
- Component Library
- Frontend Architecture
- Accessibility Test Plan
- Usability Test Plan
- Social-Safety Test Plan
- AI UX Evaluation Plan
- Product Acceptance Criteria
- QA Test Cases
- Analytics Event Catalogue
- Content Governance
- and Conceptual Prototype Readiness Evidence

---

### 3.1 v1.2 Revalidation Result

Version 1.2 revalidates UX flows against the revised domain, data, runtime, interface, storage, delivery and Protocol baselines.

The canonical Participant-facing formation and messaging sequence is:

```text
MatchCandidate
        ↓
Participant's Independent MatchDecision
        ↓
MutualAcceptance Confirmed by M18
        ↓
Connection Activated
        ↓
Current CommunicationBasis Shown or Explained
        ↓
ConversationThread
        ↓
Message Draft
        ↓
Exact SendConfirmation
        ↓
Queued
        ↓
Sent
        ↓
Provider Accepted
        ↓
Delivered or Failed
```

The UX must not:

- show MutualAcceptance before the owning aggregate confirms it;
- show Connection before activation succeeds;
- show a Thread when CommunicationBasis is invalid;
- treat Save Draft as send;
- treat Provider Accepted as Delivered;
- treat a UX Analytics event as a Domain Event;
- or imply that removing Block restores prior Connection or messaging authority.

`ConnectionRequest` is hidden and feature-disabled for the first Conceptual Prototype.

---

### 3.2 Current Prototype Interpretation

All Participant, Researcher, Supporter, Moderator and Safety flows in this document are currently evaluated through synthetic personas, scripted walkthroughs, state-machine tests and local prototypes.

They do not represent an active service, human-subject study or production deployment.

Approval screens and Consent ceremonies remain useful UX models for a possible future platform, but they are simulated interface states and do not gate current conceptual research.

Current validation may begin immediately using synthetic content and mock services.

---

## 4. UX Objectives

The UX must support:

- clarity;
- low cognitive burden;
- ability adaptation;
- Participant autonomy;
- social safety;
- human connection;
- research integrity;
- visible system state;
- safe recovery;
- minimum-necessary disclosure;
- and accountable human oversight.

---

## 5. Clarity Objective

Users should understand:

- where they are;
- which workspace is active;
- which Participant, ResearchProject or resource is in scope;
- what they are being asked to do;
- why the action matters;
- who can see the result;
- whether AI is involved;
- whether the action is reversible;
- and what will happen next.

---

## 6. Low Cognitive Burden Objective

The experience should minimise:

- unnecessary choices;
- dense pages;
- hidden dependencies;
- unexplained terminology;
- long uninterrupted workflows;
- repeated data entry;
- ambiguous audience choices;
- and simultaneous high-impact decisions.

---

## 7. Ability Adaptation Objective

The interface adapts to current needs rather than chronological age.

Adaptation may change:

- language;
- density;
- step size;
- modality;
- pacing;
- confirmation;
- and support.

It does not change:

- rights;
- Consent meaning;
- permission;
- Protocol;
- safety threshold;
- or research definition.

---

## 8. Trust Objective

Trustworthy UX makes visible:

- source;
- version;
- actor;
- relationship;
- purpose;
- Consent;
- permission;
- audience;
- AI involvement;
- review;
- approval;
- uncertainty;
- delivery;
- and accountable owner.

---

## 9. Autonomy Objective

Participants can:

- choose;
- decline;
- save as Draft;
- pause;
- ask for help;
- change preferences;
- control visibility;
- Block;
- Report;
- disconnect;
- review Consent;
- review AI memory;
- and withdraw.

Declining an optional social or AI capability must not be visually punished.

---

## 10. Human Connection Objective

The Participant experience supports real human relationships.

The UX must not optimise primarily for:

- AI conversation length;
- SocialPost count;
- reactions;
- match acceptance;
- Message volume;
- time spent;
- or repeated return.

---

## 11. Research Integrity Objective

Researcher UX must preserve distinctions between:

- Draft;
- In Review;
- Approved;
- Active;
- Paused;
- Completed;
- Locked;
- Superseded;
- Withdrawn;
- Rejected;
- and Archived.

AI Drafts, AnalysisOutputs and preliminary interpretations remain visibly non-final.

---

## 12. Safe Recovery Objective

Users should recover from:

- error;
- interruption;
- timeout;
- stale state;
- version conflict;
- failed upload;
- failed provider request;
- lost connectivity;
- incomplete assessment;
- unsuccessful matching;
- failed Message delivery;
- and paused activity.

Recovery must not fabricate completion.

---

## 13. Core UX Principles

1. Person before technology.
2. One meaningful decision at a time.
3. Explain before asking.
4. Confirm consequence.
5. Preserve choice.
6. Show system state.
7. No dark patterns.
8. Plain language first.
9. Support without taking over.
10. Reversible by default where safe.
11. Private by default.
12. Audience before publication.
13. Block before social delivery.
14. Mutual acceptance before Connection.
15. Draft before send or publish.
16. Signal before confirmed SafetyEvent.
17. Source before assertion.
18. Exact version before approval.
19. Human authority before high-impact action.
20. Recovery before abandonment.

---

## 14. Experience Architecture

```text
Authenticated Actor
        ↓
Role and Workspace Resolution
        ↓
Organisation, ResearchProject or Participant Context
        ↓
Permission, Consent and Purpose
        ↓
Task-Oriented Surface
        ↓
Guided Decision or Action
        ↓
Confirmation or Human Review
        ↓
Status, Audit and Next Step
```

---

## 15. Primary Experience Surfaces

The Platform includes:

- Participant Workspace;
- Researcher Workspace;
- Supporter Workspace;
- Moderator Workspace;
- Safety Workspace;
- Administration Workspace;
- and limited public or invitation surfaces.

A user may hold more than one role, but workspaces remain distinct.

---

## 16. Participant Workspace

Optimised for:

- simplicity;
- confidence;
- pacing;
- visible choices;
- private-by-default interaction;
- social-safety controls;
- and recovery.

Primary destinations:

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
- and Pause or Withdraw.

---

## 17. Researcher Workspace

Optimised for:

- information density;
- version comparison;
- governance;
- monitoring;
- data quality;
- and research traceability.

Primary destinations:

- Dashboard;
- Research Projects;
- Research Questions;
- Evidence;
- Protocols;
- Interventions;
- Participants;
- Enrolment;
- Delivery;
- Assessments;
- Safety;
- AI Configuration and Evaluation;
- Datasets;
- Analysis;
- Findings;
- Reports;
- and Governance Tasks.

---

## 18. Supporter Workspace

Optimised for:

- role clarity;
- visible permission;
- limited task access;
- Participant authorship;
- and safe assistance.

Primary destinations:

- Home;
- Invitations;
- Permission;
- Shared Life Story Contributions;
- Shared Activities;
- Support Guidance;
- Report a Concern;
- and Help.

---

## 19. Moderator Workspace

Optimised for:

- report triage;
- evidence minimisation;
- rule application;
- proportionality;
- reporter protection;
- appeal;
- and restoration.

Primary destinations:

- Queue;
- Assigned Cases;
- Community Rules;
- Appeals;
- Restorations;
- Safety Links;
- Metrics;
- and Help.

---

## 20. Safety Workspace

Optimised for:

- urgency;
- minimum necessary context;
- accountable human triage;
- action;
- monitoring;
- pause;
- and audit.

Primary destinations:

- SafetySignal Queue;
- Active SafetyEvents;
- Actions;
- Paused Participants or Features;
- Monitoring;
- Escalation Contacts;
- and Review History.

---

## 21. Administration Workspace

Optimised for:

- operational control;
- technical configuration;
- service health;
- access administration;
- and audit.

Primary destinations:

- Users;
- Organisations;
- Roles;
- Service Accounts;
- Integrations;
- AI Provider Configuration;
- Jobs and Dead Letters;
- Feature Flags;
- Audit Access;
- System Status;
- and Support Operations.

Administration does not confer research, moderation or Safety authority.

---

## 22. Public and Invitation Surfaces

Unauthenticated or limited surfaces may include:

- secure invitation landing;
- account activation;
- password or passcode recovery;
- public study information;
- support contact;
- accessibility statement;
- and approved Internet Public content if ever enabled.

These surfaces expose minimum information.

---

## 23. Workspace Switching

When a user holds multiple roles:

- the active workspace is named;
- the active Organisation and ResearchProject are visible;
- switching is deliberate;
- unsaved work is protected;
- permission differences are explained;
- and audit context changes.

The interface must not merge permissions across workspaces.

---

## 24. Context Banner

A persistent Context Banner may show:

- current workspace;
- Organisation;
- ResearchProject;
- Participant where permitted;
- active ProtocolVersion;
- environment where relevant;
- and restricted or degraded state.

Sensitive Participant identity should be minimised on shared screens.

---

## 25. Global Utilities

Global utilities include:

- Search where permitted;
- Notifications;
- Tasks;
- Help;
- Accessibility;
- Account;
- Workspace Switcher;
- and Support.

Participant surfaces also provide persistent access to:

- Consent;
- Block and Report;
- Pause or Withdraw;
- and Contact Support.

---

## 26. Global Navigation Rules

Navigation must:

- show only permitted destinations;
- preserve current context;
- use predictable ordering;
- remain keyboard accessible;
- support scalable text;
- provide current-location indication;
- and avoid hidden high-impact actions.

Removing a destination does not explain whether the resource does not exist or is protected.

---

## 27. Protected Existence

For protected resources, the UX may show:

- generic unavailable state;
- no search result;
- no candidate;
- or access unavailable

without revealing whether another Participant, Report, Block, Safety record or restricted resource exists.

The interface must not explain that one person has blocked another unless policy permits disclosure.

---

## 28. Role-Aware Navigation

Role-aware navigation is based on server-resolved authority.

Client-side hiding is presentational only.

A copied URL must still receive the correct protected response.

---

## 29. Context-Aware Navigation

When inside a ResearchProject, Participant, ModerationCase, DatasetVersion or AnalysisRun:

- the current entity remains visible;
- actions reflect current state;
- cross-context navigation warns before switching;
- and deep links preserve only permitted context.

---

## 30. Breadcrumbs

Researcher, Moderator, Safety and Administration workspaces use breadcrumbs for deep hierarchies.

Participant flows prefer simpler Back and Home controls.

Breadcrumbs never expose protected parent names.

---

## 31. Back Behaviour

Back must:

- preserve saved work;
- warn about unsaved work;
- avoid repeating submitted actions;
- preserve the current step where safe;
- and not reopen a completed confirmation as editable.

---

## 32. Unsaved Changes

Unsaved changes use:

- visible saved-state indicator;
- autosave where appropriate;
- explicit Save and Exit;
- leave warning;
- and recovery.

Autosave must not silently publish, send, approve, lock or consent.

---

## 33. Mobile Navigation

Participant mobile navigation should use a small number of primary destinations.

Lower-frequency destinations may appear under More.

Persistent access remains available for:

- Help;
- Block and Report;
- Consent;
- and Pause or Withdraw.

---

## 34. Search Rules

Search results are permission-scoped.

Search must not expose:

- private Life Story;
- Message bodies;
- blocked users;
- reporter identity;
- Safety details;
- moderation evidence;
- hidden MatchCandidates;
- or restricted research artefacts.

---

## 35. Dashboard Strategy

Dashboards prioritise decisions and exceptions rather than raw volume.

Each card should explain:

- what changed;
- whether action is required;
- who owns the action;
- due time;
- and the source state.

---

## 36. Participant Home

Participant Home prioritises:

- next study activity;
- current intervention path;
- recent saved work;
- due assessment;
- active Connection or Community task;
- Help;
- Block and Report;
- and Pause or Withdraw.

It must not prioritise endless feed consumption.

---

## 37. Researcher Dashboard

Researcher Dashboard prioritises:

- active ResearchProjects;
- pending approvals;
- enrolment;
- due assessments;
- delivery exceptions;
- open SafetySignals;
- data-quality issues;
- AI Human Review;
- Dataset readiness;
- and upcoming milestones.

---

## 38. Supporter Home

Supporter Home prioritises:

- pending invitation;
- current Relationship;
- current permission;
- Participant-requested task;
- contribution awaiting review;
- and Report a Concern.

---

## 39. Moderator Dashboard

Moderator Dashboard prioritises:

- urgent reports;
- assigned cases;
- ageing cases;
- appeal deadlines;
- restoration reviews;
- and SafetySignal links.

Reporter identity remains hidden unless specifically required.

---

## 40. Safety Dashboard

Safety Dashboard prioritises:

- urgent SafetySignals;
- untriaged signals;
- active SafetyEvents;
- overdue actions;
- paused Participants or features;
- and escalation failures.

SafetySignal and SafetyEvent counts are shown separately.

---

## 41. Administration Dashboard

Administration Dashboard prioritises:

- service health;
- failed jobs;
- integration failures;
- security alerts;
- backup status;
- deletion propagation;
- feature-flag state;
- and support issues.

Research findings and moderation decisions are not administrative KPIs.

---

## 42. State Architecture

The UX represents independent dimensions rather than one generic status.

Applicable dimensions include:

- lifecycle;
- review;
- approval;
- visibility;
- publication;
- delivery;
- moderation;
- safety;
- quality;
- retention;
- and Resource State.

---

## 43. Lifecycle State Presentation

Representative lifecycle states:

- Draft;
- Active;
- Paused;
- Completed;
- Withdrawn;
- Superseded;
- Retired;
- and Archived.

Each state has:

- text;
- explanation;
- effective time;
- actor or owner;
- and permitted next actions.

---

## 44. Review and Approval State Presentation

Representative states:

- Not Submitted;
- In Review;
- Returned for Revision;
- Approved;
- Approved with Conditions;
- Rejected;
- Superseded;
- and Archived.

Approval state is never inferred from completion or model confidence.

---

## 45. Resource State Presentation

Representative Resource States include:

- Usable;
- Restricted;
- Suspended;
- Expired;
- Deleted;
- Withdrawn;
- Locked;
- and Unavailable.

Resource State affects both content and available actions.


---

## 46. Visibility Model

Visibility values are:

- Private;
- Selected People;
- Connections;
- Community;
- Platform Public;
- and Internet Public.

Visibility is shown with:

- label;
- icon;
- audience summary;
- explanation;
- and change control.

Colour is not the only indicator.

---

## 47. Audience Preview

Before sharing or publication, the interface shows:

- exact audience;
- whether authentication is required;
- whether blocked users are excluded;
- whether search indexing applies;
- whether download, quotation or re-sharing is allowed;
- and whether the action can be reversed.

---

## 48. Platform Public and Internet Public

The interface must explain:

```text
Platform Public
    = Visible only within the eligible authenticated Platform

Internet Public
    = Potentially visible outside the Platform
```

Internet Public requires a separate publication flow and is disabled by default for the Conceptual Prototype.

---

## 49. Action-State Model

Material content actions use distinct states:

```text
Draft
    ↓
Submitted or Confirmed
    ↓
Queued
    ↓
Executed
    ↓
Delivered or Published
```

A Draft is not a sent Message, published SocialPost, confirmed Life Story item or approved research record.

---

## 50. Delivery-State Presentation

Message, Notification, export and submission states must preserve their domain-specific meaning.

For Message, the interface may display:

- Draft;
- Send confirmation required;
- Confirmed for send;
- Queued;
- Sending;
- Sent;
- Provider accepted;
- Delivered;
- Read where explicitly enabled;
- Delivery failed;
- Delivery unknown;
- Cancelled;
- Withdrawn;
- and Expired.

The interface must not:

- display Sent when only confirmation succeeded;
- display Delivered when only queued, sent or provider accepted;
- display Read without supported evidence and disclosure;
- or display Withdrawn as recalled from an external recipient.

State labels include plain-language explanation and timestamp where useful.

A compact status may be shown, but detail remains available.

## 51. Provenance Presentation

Material records may display:

- Participant;
- Supporter;
- Researcher;
- Moderator;
- Safety Reviewer;
- system rule;
- provider;
- AI;
- or imported source.

Source and authorship are separate.

---

## 52. Epistemic-Type Presentation

Where meaning depends on source, the UI distinguishes:

- Platform Fact;
- Participant-Provided Information;
- Participant Testimony;
- Supporter Contribution;
- Human Observation;
- Human Decision;
- Retrieved Evidence;
- AI Inference;
- Suggestion;
- Draft;
- and Unknown.

---

## 53. AI Involvement Label

AI-assisted content must show whether AI:

- Drafted;
- Transcribed;
- Translated;
- Summarised;
- Suggested;
- Classified;
- or executed a confirmed Tool.

The label remains visible after saving where material.

---

## 54. Version Presentation

Versioned records show:

- version number;
- state;
- effective date;
- previous version;
- changes;
- approval;
- and current status.

The interface avoids editing an approved version directly.

---

## 55. Current versus Historical

Current records are visually distinct from historical records.

Historical views must not present obsolete Consent, visibility, Block, Protocol or configuration as current.

---

## 56. Status Badge Rules

Status badges:

- contain text;
- use semantic icon where helpful;
- have accessible names;
- support high contrast;
- and include explanation on focus or selection.

Badges are not the only place where a critical state appears.

---

## 57. Researcher Flow — Create ResearchProject

```text
Research Projects
        ↓
Create Project
        ↓
Enter Purpose and Scope
        ↓
Assign Organisation and Owners
        ↓
Create ResearchQuestion
        ↓
Save Draft
        ↓
Review Summary
```

The creation flow does not require every future detail.

---

## 58. Researcher Flow — Define ResearchQuestion

The flow supports:

- primary question;
- secondary questions;
- population;
- intervention;
- outcome;
- context;
- uncertainty;
- feasibility objective;
- and evidence need.

AI may Draft wording.

The Researcher approves the final question.

---

## 59. Researcher Flow — EvidenceReview

```text
Open Evidence Workspace
        ↓
Define Search Question
        ↓
Retrieve Knowledge Platform Results
        ↓
Inspect Provenance and Version
        ↓
Include, Exclude or Hold
        ↓
Assess Applicability and Limitations
        ↓
Draft EvidenceDecision
        ↓
Human Review
```

---

## 60. Evidence Result Card

The card shows:

- title;
- source;
- evidence type;
- population relevance;
- context;
- date or version;
- verification;
- evidence direction;
- licensing;
- summary;
- and provenance.

The card does not reduce evidence to a single confidence colour.

---

## 61. Conflicting Evidence Presentation

Conflicting, null, harmful and missing evidence remain visible.

The interface supports side-by-side comparison and explicit uncertainty.

---

## 62. EvidenceDecision Flow

The decision form supports exactly:

- Support;
- Support with Conditions;
- Insufficient Evidence;
- Conflicting Evidence;
- Restrict;
- Do Not Proceed;
- and Research Required.

Review and approval remain separate from scientific outcome.

---

## 63. EvidenceSnapshot Flow

Before Protocol approval, the Researcher reviews:

- included KnowledgeReferences;
- exact versions;
- retrieval context;
- exclusions;
- completeness;
- licensing;
- content hash;
- and approval.

Snapshot creation is clearly labelled as immutable.

---

## 64. Researcher Flow — ProtocolVersion

```text
Create Protocol
        ↓
Create Version
        ↓
Complete Sections
        ↓
Link Evidence and Intervention Versions
        ↓
Define Consent, Community, Matching, Safety and Dataset Rules
        ↓
Validate
        ↓
Review Changes
        ↓
Submit
        ↓
Approve or Return
```

---

## 65. Protocol Editor

The Protocol Editor supports:

- section navigation;
- completeness;
- autosave;
- comments;
- change comparison;
- AI Drafting;
- exact reference selection;
- and validation.

Autosave does not submit or approve.

---

## 66. Protocol Approval View

The approval view shows:

- exact version;
- changes;
- unresolved comments;
- EvidenceSnapshot;
- intervention configuration;
- AI configuration;
- Consent impact;
- Community and matching impact;
- moderation and Safety impact;
- DatasetDefinition;
- and approver identity.

---

## 67. Researcher Flow — InterventionConfiguration

The interface supports:

- intervention purpose;
- component versions;
- pathway;
- schedule;
- dose;
- completion criteria;
- adaptation range;
- Supporter role;
- Life Story rules;
- Community rules;
- matching rules;
- AI role;
- safeguards;
- and outcome mapping.

---

## 68. Researcher Flow — AIInterventionConfiguration

The view shows:

- enabled AI roles;
- model aliases;
- provider restrictions;
- Prompt versions;
- output schemas;
- Retrieval sources;
- Tool Set;
- Action Levels;
- memory policy;
- Life Story rules;
- Community and matching rules;
- messaging rules;
- moderation and Safety policy;
- evaluation;
- and effective version.

---

## 69. AI Configuration Change Warning

A material change warning identifies:

- affected Participants;
- active Protocol;
- data-class impact;
- intervention-fidelity impact;
- re-evaluation;
- re-Consent;
- rollout;
- and rollback.

---

## 70. Researcher Flow — Community Configuration

The Researcher configures:

- CommunitySpace purpose;
- eligibility;
- CommunityRuleVersion;
- Moderator owner;
- content types;
- visibility;
- reporting;
- moderation;
- archive;
- and Conceptual Prototype stage.

Community cannot be activated without Moderator readiness.

---

## 71. Researcher Flow — Matching, MutualAcceptance and Connection Policy

The Researcher configures or reviews:

- purpose;
- allowed attributes;
- prohibited attributes;
- source;
- MatchExplanation rules;
- candidate limit;
- expiry;
- MatchDecision values and reversibility;
- fairness review;
- Block handling;
- MutualAcceptance source rule;
- MutualAcceptance effective period and invalidation;
- single-use Connection activation;
- CommunicationBasis options;
- ConnectionRequest disabled state;
- and staged activation.

Hidden sensitive features must be visibly prohibited.

The policy builder must not provide an option to create automatic MutualAcceptance, automatic Connection or automatic messaging.

## 72. Researcher Flow — Synthetic Persona and Scenario Setup

```text
Create Invitation
        ↓
Screen
        ↓
Record EligibilityDecision
        ↓
Verify Consent
        ↓
Enrol
        ↓
Assign Pathway and Intervention
        ↓
Activate
```

AI may support documentation but cannot make the final EligibilityDecision.

---

## 73. Researcher Participant List

The list may show:

- pseudonymous study code;
- enrolment state;
- Consent state;
- pathway;
- intervention exposure;
- due assessment;
- support need;
- open SafetySignal indicator;
- unresolved data-quality issue;
- and last activity.

It excludes private social content and reporter identity.

---

## 74. Researcher Participant Detail

The detail view uses permission-scoped tabs:

- Overview;
- Consent;
- Enrolment;
- Intervention;
- Assessments;
- Observations;
- Safety;
- Data Quality;
- and Audit.

Life Story, Messages, matching detail and moderation evidence appear only when explicitly authorised.

---

## 75. Researcher Flow — Intervention Monitoring

The monitoring view distinguishes:

- Assigned;
- Offered;
- Viewed;
- Started;
- Partially Received;
- Completed;
- Skipped;
- Declined;
- Failed;
- and Interrupted.

Completion is never inferred from assignment.

---

## 76. Researcher Flow — Assessment Monitoring

The view shows:

- scheduled;
- due;
- started;
- paused;
- completed;
- declined;
- invalidated;
- and overdue.

Missingness reason is visible where permitted.

---

## 77. Researcher Flow — Safety Overview

Researchers see minimum-necessary indicators:

- open SafetySignal;
- current pause;
- required follow-up;
- and ResearchProject impact.

Detailed Safety review occurs in the Safety Workspace.

---

## 78. Researcher Flow — DatasetDefinition

```text
Create DatasetDefinition
        ↓
Select ResearchQuestions
        ↓
Select Source Aggregates and Versions
        ↓
Define Variables and Rules
        ↓
Define Consent and Purpose
        ↓
Define Life Story, Social, Message, Moderation and AI Boundaries
        ↓
Define Missingness and De-Identification
        ↓
Submit for Approval
```

---

## 79. Dataset Variable Builder

The builder shows:

- variable name;
- source;
- source version;
- type;
- derivation;
- missingness;
- sensitivity;
- Consent;
- de-identification;
- and inclusion rationale.

Private content is excluded by default.

---

## 80. Researcher Flow — DatasetVersion Generation

```text
Select Approved DatasetDefinition
        ↓
Review Source Readiness
        ↓
Run Transformation
        ↓
Review DataQualityIssues
        ↓
Generate DatasetVersion
        ↓
Review Manifest and Variable Dictionary
```

The interface shows that the generated version is not yet locked.

---

## 81. Dataset Quality Review

The quality view supports:

- rule results;
- severity;
- affected variables;
- affected records;
- source version;
- missingness;
- correction;
- exclusion;
- resolution;
- and reviewer.

Original data are not silently overwritten.

---

## 82. DatasetVersion Lock Flow

```text
Review DatasetVersion
        ↓
Confirm Complete Lineage
        ↓
Confirm Withdrawal and Consent Handling
        ↓
Confirm Quality and De-Identification
        ↓
Review Message and Social Variable Boundaries
        ↓
Review Manifest and Checksums
        ↓
Confirm Compatible AnalysisPlan
        ↓
Human Authorisation
        ↓
Submit Lock Command
        ↓
DatasetVersionLocked
```

The UX distinguishes:

- lock confirmation viewed;
- lock confirmation submitted;
- lock command pending;
- lock command failed;
- and DatasetVersionLocked.

Only the final owning-domain result establishes the locked state.

## 83. DatasetVersion Lock Confirmation

The confirmation shows:

- DatasetVersion;
- source cut-off;
- row and entity counts where safe;
- unresolved issues;
- restrictions;
- Message-content inclusion or exclusion;
- manifest hash;
- AnalysisPlan;
- approver;
- and irreversibility.

The primary button uses an explicit label such as **Lock this dataset version**.

The UX Analytics event may be `DatasetLockConfirmationSubmitted`.

The canonical Domain Event is `DatasetVersionLocked`.

The interface never displays Locked until M12 confirms the transition.

## 84. Researcher Flow — AnalysisPlan

The AnalysisPlan interface supports:

- ResearchQuestions;
- populations;
- variables;
- denominators;
- methods;
- pathway analysis;
- missingness;
- qualitative method;
- subgroup or equity review;
- sensitivity analysis;
- outputs;
- and approval.

---

## 85. Researcher Flow — AnalysisRun

```text
Select Approved AnalysisPlan
        ↓
Select Locked DatasetVersion
        ↓
Review Code and Environment
        ↓
Set Parameters
        ↓
Run
        ↓
Monitor
        ↓
Review Outputs and Diagnostics
```

---

## 86. AnalysisRun Status

States include:

- Queued;
- Running;
- Completed;
- Completed with Warnings;
- Failed;
- Cancelled;
- and Superseded.

The view shows exact DatasetLock, code, environment, parameters and time.

---

## 87. Researcher Flow — InterpretationRecord

The interpretation workspace supports:

- ResearchQuestion;
- selected AnalysisOutputs;
- Draft interpretation;
- alternative explanations;
- missingness;
- pathway differences;
- accessibility;
- equity;
- moderation;
- Safety;
- AI;
- limitations;
- uncertainty;
- and Human Review.

---

## 88. Researcher Flow — ResearchFinding

The finding workflow shows:

- exact ResearchQuestion;
- ProtocolVersion;
- InterventionVersion;
- AI configuration;
- DatasetLock;
- AnalysisRun;
- InterpretationRecord;
- claim;
- uncertainty;
- limitations;
- review;
- and approval.

An AI Draft remains labelled as Draft.

---

## 89. ResearchFinding Approval

Approval states include:

- In Review;
- Approved;
- Approved with Limitations;
- Rejected;
- Superseded;
- Withdrawn;
- and Archived.

Approval requires a named authorised human.

---

## 90. Researcher Flow — InterventionDecision

The decision interface supports:

- Retain;
- Revise;
- Restrict;
- Replicate;
- Expand;
- Suspend;
- Retire;
- and Continue Exploratory Research.

Each decision links to exact evidence, Protocol, intervention, Dataset, Analysis and Finding versions.

---

## 91. Researcher Flow — Report and Export

The flow supports:

- report type;
- audience;
- source versions;
- de-identification;
- restrictions;
- approval;
- generated state;
- delivery;
- receipt;
- and expiry.

Generated is not Delivered.

---

## 92. Synthetic Participant Flow — Invitation Simulation

```text
Receive Invitation
        ↓
Open Secure Link
        ↓
Verify Sender and Study
        ↓
Review Why Invited
        ↓
Continue or Decline
```

The invitation avoids urgency pressure.

---

## 93. Synthetic Participant Flow — Account Activation Simulation

The activation flow:

- minimises steps;
- explains identity verification;
- supports accessible authentication;
- permits authorised assistance;
- provides recovery;
- and protects against shared-device disclosure.

---

## 94. Synthetic Participant Flow — Research Scenario Introduction

The introduction answers:

- What is this study?
- Why was I invited?
- What will I do?
- How long will it take?
- What is Life Story?
- What are Community and matching?
- Will AI be used?
- Who can see my information?
- Can I stop?
- Who can help me?

---

## 95. Participant Flow — Consent Overview

```text
Study Purpose
        ↓
What Participation Includes
        ↓
Life Story
        ↓
Community, Matching and Messaging
        ↓
AI
        ↓
Risks and Burdens
        ↓
Data and Research Use
        ↓
Supporter Access
        ↓
Choices
        ↓
Knowledge Check
        ↓
Decision and Summary
```


---

## 96. Consent UX Rules

Consent uses:

- one concept per section;
- plain language;
- optional detail;
- replay and read-aloud where enabled;
- neutral choice design;
- no preselected optional choices;
- visible save and return;
- and an accessible summary.

Decline and restriction options must be as reachable as acceptance.

---

## 97. Granular Consent Choice

The Participant makes separate choices for:

- research participation;
- intervention delivery;
- assessments;
- Life Story;
- media;
- AI transcription or translation;
- Life Story sharing;
- Supporter contribution;
- PublicProfile;
- Community;
- Platform Public;
- Open Matching;
- matching attributes;
- Connection;
- messaging;
- AI interaction;
- AIMemoryItem;
- qualitative research;
- export;
- future contact;
- retention;
- and optional secondary use.

---

## 98. Consent Choice Component

Each choice shows:

- title;
- plain-language purpose;
- what data are involved;
- who may access;
- consequence of Yes, No or Restricted;
- whether the choice is required;
- how to change it;
- and current state.

Binary toggles are not used where conditions or restrictions matter.

---

## 99. Consent Knowledge Check

Knowledge checks focus on material understanding, such as:

- participation is voluntary;
- private Life Story is not automatically public;
- Community and matching are optional;
- Connection requires mutual choice;
- AI is not a human;
- the Platform is not an emergency service;
- and withdrawal is available.

Failure triggers explanation and support, not shame.

---

## 100. Consent Confirmation

Before submission, the Participant sees:

- choices accepted;
- choices declined;
- restrictions;
- Supporter involvement;
- AI choices;
- social choices;
- data-use choices;
- and how to change them.

The confirmation button describes the action explicitly.

---

## 101. Consent Receipt

After Consent, the Participant receives:

- date;
- form version;
- choices;
- restrictions;
- assistance record;
- who recorded the decision;
- and review or withdrawal controls.

The receipt avoids legalistic density in the primary view.

---

## 102. Re-Consent Flow

```text
Material Change Notice
        ↓
What Changed
        ↓
What Remains the Same
        ↓
Affected Choices
        ↓
Questions and Support
        ↓
New Decision
        ↓
Updated Receipt
```

The Participant is not forced to repeat unchanged sections unnecessarily.

---

## 103. Participant Flow — Accessibility Preferences

The Participant may select:

- text size;
- contrast;
- simple-language mode;
- reduced-content mode;
- step-by-step mode;
- read-aloud;
- reduced motion;
- extended time;
- preferred input;
- preferred communication;
- and Supporter-assisted mode.

Preferences remain easy to revise.

---

## 104. Accessibility Setup Preview

The setup provides a live preview.

The Participant can test:

- text;
- buttons;
- form fields;
- audio;
- focus;
- and navigation.

No selection is labelled as a deficit.

---

## 105. Participant Flow — Screening

Screening:

- explains why each question is asked;
- uses minimum necessary information;
- supports pause;
- allows assistance;
- distinguishes eligibility from diagnosis;
- and provides a respectful outcome.

The screen does not expose sensitive exclusion reasons in shared environments.

---

## 106. Participant Flow — Baseline Assessment

Assessment flow supports:

- one question or a small group;
- clear scale direction;
- Prefer not to answer where permitted;
- pause and resume;
- progress;
- missingness reason;
- help;
- and completion receipt.

---

## 107. Participant Flow — Home

Home shows:

- current study step;
- next recommended activity;
- Life Story Draft;
- Community or matching availability;
- Connection or Message action;
- due assessment;
- support;
- and pause or withdrawal.

A social feed is not the default home.

---

## 108. Participant Flow — My Study

My Study shows:

- study purpose;
- Participant duration;
- current stage;
- Protocol information in plain language;
- completed activities;
- upcoming activities;
- Consent;
- support;
- and results plan.

---

## 109. Participant Flow — LifeStoryArchive

```text
My Life Story
        ↓
Private Archive
        ↓
Create New or Continue Draft
        ↓
Review Confirmed Items
        ↓
Review Shared Items
        ↓
Export or Manage
```

Private is the default state.

---

## 110. Life Story Archive Home

The archive home prioritises:

- Continue Draft;
- Create New;
- recently confirmed items;
- items shared with others;
- audience and visibility;
- help;
- and export.

It avoids public engagement metrics.

---

## 111. Participant Flow — Create LifeStoryItem

```text
Choose Prompt or Own Topic
        ↓
Choose Text or Approved Media
        ↓
Create Draft
        ↓
Review Proposed Details
        ↓
Confirm, Correct or Save
        ↓
Choose Visibility
```

The Participant may skip any prompt.

---

## 112. Life Story Prompt Selection

Prompt cards show:

- topic;
- estimated effort;
- optional sensitive-topic indicator;
- modality;
- and Skip or Choose My Own Topic.

Prompts must not pressure disclosure.

---

## 113. Life Story Draft Editor

The editor supports:

- text;
- voice where enabled;
- approved media;
- autosave;
- undo;
- plain-language controls;
- AI assistance;
- source and authorship;
- and sensitive-topic help.

Autosave does not confirm testimony or share.

---

## 114. AI Life Story Assistance

AI controls may offer:

- Help me start;
- Transcribe;
- Translate;
- Organise;
- Suggest a title;
- Simplify;
- and Check proposed details.

The interface explains that AI may make mistakes.

---

## 115. Proposed Detail Review

People, dates, places and themes are shown as separate proposed details.

The Participant can:

- Confirm;
- Correct;
- Remove;
- Mark Unsure;
- or Leave Unconfirmed.

Proposed does not appear as verified fact.

---

## 116. Life Story Confirmation

Before confirmation, the Participant sees:

- exact version;
- content;
- source;
- AI involvement;
- attributed speaker;
- proposed details;
- and current visibility.

Confirmation uses explicit wording such as **Confirm this as my story**.

---

## 117. Participant Testimony Label

Confirmed Participant Testimony displays:

- Participant attribution;
- confirmation date;
- version;
- and explanation that it is the Participant's account.

It does not claim independent historical verification.

---

## 118. Life Story Edit after Confirmation

A material edit:

- creates a new Draft version;
- preserves the previous version;
- shows what changed;
- and may require re-confirmation.

The interface does not silently replace testimony.

---

## 119. Participant Flow — Life Story Visibility

The visibility flow presents:

- Private;
- Selected People;
- Connections;
- Community;
- and Platform Public where enabled.

Internet Public is not shown unless separately approved.

---

## 120. Life Story Sharing Summary

Before sharing, the Participant reviews:

- item;
- audience;
- view permission;
- comment permission;
- quotation;
- download;
- re-share;
- research use;
- and removal.

---

## 121. Selected People Picker

The picker:

- shows only authorised eligible people;
- explains Relationship;
- excludes blocked users;
- supports deselection;
- and avoids broad address-book exposure.

---

## 122. Connections Audience

Selecting Connections explains:

- which current Connections are included;
- that future Connections are not automatically included unless chosen by policy;
- Block effects;
- and how to stop sharing.

---

## 123. Community Audience

Selecting Community explains:

- CommunitySpace;
- membership;
- Community Rules;
- Moderator visibility;
- report and moderation;
- and whether content appears in the feed.

---

## 124. Platform Public Audience

Platform Public confirmation explains:

- authenticated eligible Platform audience;
- possible Search discovery;
- re-sharing restrictions;
- takedown;
- and difference from Internet Public.

---

## 125. Life Story Withdrawal

The Participant can:

- make Private;
- stop Selected People sharing;
- remove Community publication;
- request deletion;
- restrict research use;
- or withdraw from the component.

The interface shows immediate effects and pending propagation.

---

## 126. Life Story Export

Export flow shows:

- included items;
- versions;
- media;
- attribution;
- AI involvement;
- sharing restrictions;
- third-party content;
- file format;
- and estimated readiness.

Generated, ready and downloaded are separate states.

---

## 127. Supporter Contribution Invitation

The Participant chooses:

- Supporter;
- item or archive scope;
- contribution purpose;
- expiry;
- and whether the Supporter may see existing content.

The invitation does not grant ownership.

---

## 128. Supporter Contribution Review

The Participant sees:

- contributor;
- contribution;
- source;
- proposed details;
- and choices to Accept, Revise, Reject or Request Withdrawal.

Accepted contribution does not automatically become Participant Testimony.

---

## 129. Sensitive Life Story State

A sensitive-topic state provides:

- Pause;
- Save Private;
- Skip;
- Remove AI Context;
- Contact Support;
- Report;
- and Safety Help.

It avoids alarming language unless urgency is confirmed.

---

## 130. LegacyPreference UX

LegacyPreference remains hidden when feature-disabled.

If enabled, it requires:

- separate explanation;
- current authority;
- explicit choices;
- revocation;
- review;
- and high-friction confirmation appropriate to consequence.

It is never placed inside an ordinary profile form.

---

## 131. Participant Flow — PublicProfile

```text
People and Matching
        ↓
Create PublicProfile
        ↓
Select Fields
        ↓
Preview Audience
        ↓
Confirm
        ↓
Activate
```

PublicProfile remains separate from ParticipantProfile.

---

## 132. PublicProfile Field Selection

Each field is opt-in.

Potential fields:

- display name;
- biography;
- broad interests;
- language;
- broad location;
- communication preference;
- and selected Life Story references.

Protected fields are unavailable for selection.

---

## 133. PublicProfile Preview

Preview shows:

- exact audience;
- mobile and desktop presentation;
- Block effect;
- Community context;
- matching context;
- and removal control.

---

## 134. Participant Flow — Join Community

```text
Open Community
        ↓
Review Purpose
        ↓
Review Rules and Moderator Role
        ↓
Choose Join or Decline
        ↓
Confirm Notification Preference
        ↓
Enter Community
```

Joining does not activate matching.

---

## 135. Community Rule Presentation

Rules use:

- plain-language summary;
- examples;
- prohibited conduct;
- report process;
- moderation process;
- appeal;
- and change notification.

The current rule version is available.

---

## 136. Community Feed

Feed cards show:

- author or safe public identity;
- content;
- source or Life Story attribution where relevant;
- audience;
- time;
- moderation state;
- and actions.

Block and Report remain reachable.

---

## 137. SocialPost Draft

The composer supports:

- text;
- approved media;
- audience;
- content warning;
- AI Draft;
- save Draft;
- preview;
- and confirmation.

No posting occurs through autosave.

---

## 138. SocialPost Confirmation

Before publication, the Participant reviews:

- exact content;
- audience;
- Community Rules;
- AI involvement;
- visibility;
- re-sharing;
- and removal.

The primary button says **Publish to [Community name]**.

---

## 139. SocialPost State

States include:

- Draft;
- Published;
- Edited;
- Restricted;
- Hidden;
- Removed;
- Withdrawn;
- and Restored.

A restricted post is not represented as deleted.

---

## 140. Comment and Reaction

Comment and reaction controls:

- remain optional;
- use clear labels;
- avoid competitive counts where unnecessary;
- support undo;
- apply Block;
- and support Report.

No fake reaction or system-generated social proof is displayed.

---

## 141. Leave Community

Leaving Community explains:

- membership ends;
- future feed and posting stop;
- existing content treatment;
- matching remains a separate choice;
- and study participation continues unless separately withdrawn.

---

## 142. Participant Flow — Report Community Content

```text
Report
        ↓
Choose Concern
        ↓
Add Optional Detail
        ↓
Choose Immediate Block if Desired
        ↓
Submit
        ↓
Receive Safe Confirmation
```

The confirmation does not reveal moderator action prematurely.

---

## 143. Participant Flow — Open Matching Introduction

The introduction explains:

- matching purpose;
- voluntary opt-in;
- allowed information;
- prohibited information;
- candidate expiry;
- independent decisions;
- the fact that the other actor's decision remains private;
- MutualAcceptance;
- MutualAcceptance expiry or invalidation before Connection;
- Connection;
- CommunicationBasis and messaging limits;
- Block;
- Report;
- and no guarantee of compatibility or response.

The introduction explicitly states:

```text
MatchCandidate
    ≠ Mutual Interest
    ≠ Connection
```

ConnectionRequest is not shown in the first Conceptual Prototype.

## 144. Participant Flow — MatchPreference

The Participant selects:

- interests;
- preferred activity;
- language;
- communication mode;
- availability;
- broad location;
- and exclusions.

The interface identifies which fields may appear in MatchExplanation.

---

## 145. MatchPreference Activation

Before activation, the Participant reviews:

- selected attributes;
- source;
- visibility;
- broad location precision;
- duration;
- pause and withdrawal;
- and candidate limits.

The primary button says **Turn on matching** rather than implying a match already exists.


---

## 146. MatchPreference Pause and Withdrawal

The Participant can:

- pause new candidates;
- keep current candidate decisions;
- expire current candidates;
- withdraw matching Consent;
- and review effect on existing Connections.

Pausing matching does not automatically disconnect an active Connection.

---

## 147. MatchCandidate List

The list shows:

- safe profile projection;
- declared shared basis;
- candidate expiry;
- MatchExplanation availability;
- and choices.

It does not show protected internal identifiers or hidden score.

---

## 148. MatchCandidate Card

The card includes:

- chosen display name;
- broad interests;
- approved language and communication preferences;
- broad location where permitted;
- MatchExplanation summary;
- expiry;
- View Details;
- Not Now;
- Dismiss;
- Block;
- and Report.

Interested is not preselected.

---

## 149. MatchExplanation View

The explanation shows:

- which declared attributes contributed;
- source and currentness;
- uncertainty;
- policy version;
- and prohibited-use statement.

It does not present an objective compatibility percentage.

---

## 150. Participant Flow — MatchDecision

```text
Review Candidate
        ↓
Review Explanation
        ↓
Choose Interested, Not Now, Dismiss, Block or Report
        ↓
Review Consequence
        ↓
Confirm Decision
```

Each Participant records their own decision.

---

## 151. Interested Decision Confirmation

The confirmation explains:

- the other person is not yet connected;
- the other person's decision remains private;
- MutualAcceptance is required;
- no Message can be sent yet;
- and the decision may expire.

---

## 152. Not Now and Dismiss

The interface explains:

- Not Now may allow later reconsideration;
- Dismiss removes the candidate from the current set;
- neither creates a negative Participant label;
- and both remain separate from Block.

---

## 153. Block from Matching

Block flow provides:

- immediate action;
- optional Report;
- scope summary;
- protected confirmation;
- and help.

The interface does not disclose whether the other person was notified.

---

## 154. No MatchCandidate State

An empty state explains:

- no suitable current candidate;
- preferences may be adjusted;
- the Participant can pause;
- existing-contact and Community pathways remain available;
- and no failure or personal deficit is implied.

---

## 155. MutualAcceptance State

When M18 records MutualAcceptance, the Participant sees:

- mutual interest confirmed;
- basis type;
- effective or expiry information where useful;
- the next Connection action;
- current safety controls;
- privacy boundaries;
- and Continue, Activate Connection or Not Now where policy permits.

The UI distinguishes:

- evaluation pending;
- MutualAcceptance active;
- MutualAcceptance expired;
- MutualAcceptance invalidated;
- and already used for Connection.

MutualAcceptance is not displayed before the server confirms it.

The other Participant's private MatchDecision is not exposed beyond the permitted mutual result.

## 156. Connection Activation

Connection activation displays:

- both permitted public identities;
- source MutualAcceptance;
- Connection purpose and scope;
- permitted communication modes;
- Life Story visibility boundaries;
- Mute;
- Disconnect;
- Block;
- Report;
- and Help.

Activation is a separate owning-domain action after MutualAcceptance.

A failed, expired, invalidated or already-used MutualAcceptance produces a clear non-blaming error.

Connection does not imply:

- Supporter access;
- care authority;
- research permission;
- private Life Story access;
- or automatic ConversationThread creation where policy requires another step.

## 157. Connection Detail and CommunicationBasis

Connection Detail includes:

- current Connection state;
- activation date;
- source MutualAcceptance summary;
- permitted communication;
- current CommunicationBasis state;
- shared items;
- Community context;
- ConversationThread entry where allowed;
- Mute;
- Disconnect;
- Block;
- Report;
- Help;
- and relevant history.

The interface explains why communication is currently permitted.

Representative basis labels include:

- Connected through mutual matching;
- Authorised existing contact;
- Current study activity;
- Moderated Community interaction.

Protected research and Profile data remain absent.

If CommunicationBasis is no longer effective, Message entry is disabled with a clear explanation and safe next action.

## 158. Participant Flow — Message Composer

A Message begins as Draft.

The composer supports:

- exact recipient;
- current CommunicationBasis summary;
- text;
- approved attachment;
- translation;
- AI Draft;
- character or size guidance;
- link warning;
- Save Draft;
- Review and send;
- Block;
- Report;
- and Help.

Draft state is visually persistent.

Save Draft and Review and send are separate actions.

The composer does not open when:

- CommunicationBasis is invalid;
- ConversationThread is unusable;
- recipient is blocked;
- Participant lacks permission;
- or the Message feature is paused.

## 159. AI Message Draft

AI may help with:

- tone;
- plain language;
- translation;
- introduction;
- and respectful phrasing.

The interface labels:

- AI involvement;
- Draft status;
- source or transformation where relevant;
- and the Participant's responsibility to review.

The Participant reviews and edits the complete Draft.

AI cannot:

- choose the recipient;
- change CommunicationBasis;
- confirm send;
- create MutualAcceptance or Connection;
- or claim the Message was delivered.

## 160. Message Send Confirmation

Before send, the Participant sees:

- recipient;
- exact Message version;
- exact content;
- attachments and scan state;
- current CommunicationBasis;
- audience;
- delivery limitations;
- whether cancellation or withdrawal may be possible;
- and Block and Report access.

The primary action says **Send message**.

Confirmation is bound to:

- current actor;
- exact Message version;
- exact recipient set;
- and a short-lived confirmation challenge where configured.

Editing content, attachments or recipients invalidates the prior confirmation.

A successful confirmation may produce **Queued**, not Delivered.

## 161. Message Lifecycle and Delivery State

The Thread distinguishes:

### Draft and Authorisation

- Draft;
- Send confirmation required;
- Confirmed for send.

### Transport

- Queued;
- Sending;
- Sent;
- Provider accepted.

### Outcome

- Delivered;
- Read where supported and enabled;
- Delivery failed;
- Delivery unknown;
- Cancelled;
- Withdrawn;
- Expired.

Each state uses an appropriate label, icon and explanation.

`Provider accepted` is described as accepted by the delivery service, not received by the person.

No read receipt appears unless enabled, reliable and explained.

A Timeline or Details view may show delivery attempts without exposing unnecessary provider identifiers.

## 162. Message Failure, Unknown Delivery and Retry

Failure or unknown state explains:

- the exact known state;
- whether the Message reached the provider;
- whether delivery is known;
- whether the Draft or sent content remains available;
- whether retry is safe;
- whether a duplicate could occur;
- and how to contact support.

Retry uses idempotency protection and creates another DeliveryAttempt for the same logical Message.

The interface never changes Failed or Unknown to Delivered without an owning-domain result.

After Block, the UI explains whether queued delivery was cancelled, suppressed or may already have left the Platform.

## 163. Scam and Link Warning

A warning may identify:

- request for credentials;
- financial solicitation;
- suspicious link;
- impersonation;
- coercive language;
- or repeated unwanted contact.

The warning offers:

- Do not send;
- Edit;
- Block;
- Report;
- and Get Help.

A warning is not a final ModerationDecision.

---

## 164. Participant Flow — Mute

Mute explains:

- notifications are reduced;
- the Connection remains;
- Message access may remain;
- the other person is not informed unless policy states;
- and Block remains available.

---

## 165. Participant Flow — Disconnect

Disconnect confirmation shows:

- Connection ends;
- future messaging stops;
- existing content treatment;
- Block and Report options;
- and whether reconnection requires a new basis.

Disconnect is not Block.

---

## 166. Participant Flow — Block

The Block flow is:

```text
Choose Block
        ↓
Review Immediate Effects
        ↓
Choose Optional Report
        ↓
Confirm
        ↓
Return to Safe Surface
```

The effects explanation includes:

- discovery suppression;
- MatchCandidate suppression;
- MutualAcceptance prevention or invalidation where applicable;
- Connection activation prevention;
- ConversationThread and Message-send prevention;
- Notification suppression;
- feed and Profile suppression;
- AI Context exclusion;
- and attempted cancellation of queued delivery where technically possible.

The interface avoids promising external recall after provider submission.

## 167. Block Confirmation

The confirmation:

- avoids revealing protected implementation details;
- confirms new interaction should be prevented;
- states whether pending delivery cancellation was requested;
- discloses that an already delivered external Message may not be recalled;
- provides Report and Help;
- and explains how to review or remove the Block where permitted.

Removing Block does not automatically restore:

- MatchPreference;
- MutualAcceptance;
- Connection;
- ConversationThread;
- or Message authority.

## 168. Reports and Blocks Centre

The Participant can review:

- active Blocks;
- muted Connections;
- submitted Reports;
- report receipt;
- available follow-up;
- and help.

Moderator evidence and confidential decisions remain protected.

---

## 169. Participant Flow — Human Interaction Preparation

Preparation may include:

- choose goal;
- choose topic;
- select a Life Story item;
- select communication mode;
- plan accessibility;
- Draft Message;
- review boundaries;
- and confirm support.

---

## 170. Participant Flow — Interaction Completion

After the planned interaction, the Participant can record:

- Completed;
- Attempted;
- Did Not Happen;
- Declined;
- Interrupted;
- or Need Help.

The interface does not infer completion from a sent Message.

---

## 171. Participant Flow — Reflection

Reflection may ask:

- did the interaction occur;
- was it meaningful;
- did you feel heard;
- how difficult was it;
- was anything uncomfortable;
- do you want another interaction;
- and do you need help.

Qualitative detail is optional where permitted.

---

## 172. Participant Flow — Follow-Up Assessment

The follow-up:

- explains purpose;
- shows estimated time;
- supports adaptations;
- allows pause;
- preserves missingness;
- and confirms completion.

It avoids claiming benefit before analysis.

---

## 173. Participant Flow — Pause

Pause options may include:

- current activity;
- AI;
- Community notifications;
- matching;
- a Connection;
- intervention component;
- or entire study activity.

The interface explains what continues and what stops.

---

## 174. Participant Flow — Withdrawal

```text
Pause or Withdraw
        ↓
Choose Scope
        ↓
Review Immediate and Future Effects
        ↓
Choose Data and Contact Options
        ↓
Confirm
        ↓
Receive Receipt and Support
```

Withdrawal language remains neutral.

---

## 175. Withdrawal Scope Selector

Options may include:

- Life Story sharing;
- Community;
- matching;
- Connection;
- messaging;
- Supporter involvement;
- AI;
- AIMemoryItem;
- optional media;
- qualitative interview;
- future contact;
- follow-up;
- and entire study.

---

## 176. Withdrawal Consequence Summary

The summary distinguishes:

- future intervention;
- future contact;
- current visibility;
- Community content;
- matching candidates;
- Connection and Messages;
- AI Context and memory;
- future Dataset generation;
- locked DatasetVersion;
- and retained governance records.

---

## 177. Withdrawal Receipt

The receipt includes:

- scope;
- effective time;
- immediate actions;
- pending propagation;
- retained exceptions;
- support contact;
- and how to ask questions.

---

## 178. Participant Data Rights

The Participant can access appropriate controls for:

- view;
- correction;
- export;
- deletion request;
- Consent;
- sharing;
- AIMemoryItem;
- Block;
- and withdrawal.

Rights are not buried only in Account settings.

---

## 179. Participant Flow — AI Memory

The Participant sees:

- remembered item;
- source;
- purpose;
- AI roles allowed to use it;
- expiry;
- restrictions;
- and correction or deletion.

AIMemoryItem is visually distinct from Life Story and Profile.

---

## 180. Supporter Flow — Invitation

```text
Receive Invitation
        ↓
Verify Identity
        ↓
Review Participant and Purpose
        ↓
Review Permission
        ↓
Accept or Decline
```

The flow explains that the Participant remains the primary decision-maker.

---

## 181. Supporter Flow — Permission Review

The Supporter sees:

- Relationship type;
- purpose;
- permitted resources;
- permitted actions;
- expiry;
- restrictions;
- current Consent;
- and revocation.

No broad **Access everything** option is shown.

---

## 182. Supporter Flow — Life Story Contribution

The Supporter can:

- select the invited item or scope;
- Draft contribution;
- identify source and authorship;
- submit for Participant review;
- edit before review;
- and withdraw where permitted.

Submission does not publish or create testimony.

---

## 183. Supporter Flow — Activity Support

The Supporter may help with:

- navigation;
- preparation;
- communication setup;
- accessibility;
- and Participant-requested activity.

The UX records assistance when relevant to fidelity.

---

## 184. Supporter Flow — Report a Concern

The Supporter can submit:

- technical concern;
- privacy concern;
- unwanted contact concern;
- safety concern;
- or other issue.

The flow distinguishes support request, Report and urgent Safety escalation.

---

## 185. Supporter Access Revoked

When access ends, the Supporter sees:

- access no longer available;
- effective time;
- generic reason where appropriate;
- return to Home;
- and Help.

Protected Participant choices are not disclosed.

---

## 186. Moderator Flow — Report Queue

The queue shows:

- priority;
- report category;
- target type;
- Community;
- age;
- assignment;
- provisional signal;
- Safety link;
- and deadline.

Reporter identity is hidden by default.

---

## 187. Moderator Flow — Open ModerationCase

The case view shows:

- report summary;
- relevant content;
- safe actor information;
- applicable CommunityRuleVersion;
- evidence;
- prior related actions where permitted;
- provisional provider or AI signals;
- and required next action.

---

## 188. Moderator Evidence Presentation

Evidence is:

- minimum necessary;
- source-labelled;
- timestamped;
- versioned;
- and access-audited.

The interface avoids unrelated Participant research or Safety data.

---

## 189. Moderator Flow — ModerationDecision

The decision form requires:

- outcome;
- rule;
- evidence;
- reason;
- proportionality;
- duration;
- action;
- appeal;
- and reviewer confirmation.

High-impact decisions require the authorised human workflow.

---

## 190. Moderation Action Confirmation

The confirmation shows:

- target;
- content or account effect;
- duration;
- Participant-facing explanation;
- appeal;
- reversibility;
- and audit.

AI cannot confirm the action.

---

## 191. Moderator Flow — Appeal

The appeal view shows:

- original decision;
- Participant statement;
- permitted evidence;
- conflict-of-interest check;
- reviewer;
- outcome;
- and restoration.

An independent reviewer is used where required.

---

## 192. Moderator Flow — Restoration

Restoration confirms:

- content or access restored;
- effective time;
- remaining restrictions;
- notifications;
- and audit.

Restoration does not erase the original decision history.

---

## 193. Reporter Protection

Reporter-facing status uses safe language such as:

- Received;
- In Review;
- Action Taken where disclosure is permitted;
- Closed;
- or More Information Needed.

It does not reveal confidential evidence, sanctions or reporter identity to another actor.

---

## 194. Moderation-to-Safety Link

A Moderator may create or link a SafetySignal.

The interface states:

- this is a possible safety concern;
- a Safety Reviewer will assess it;
- and no SafetyEvent has yet been confirmed.

---

## 195. Safety Flow — SafetySignal Queue

The queue shows:

- urgency;
- source;
- Participant or project scope;
- time;
- current owner;
- minimum summary;
- and response target.

Signals remain visually distinct from confirmed SafetyEvents.


---

## 196. Safety Flow — Triage

```text
Open SafetySignal
        ↓
Review Minimum Necessary Context
        ↓
Assess Urgency and Relatedness
        ↓
Close as Not Event
or
Monitor
or
Escalate
or
Convert to SafetyEvent
```

The decision requires an authorised human.

---

## 197. Safety Triage View

The view includes:

- source;
- urgency;
- Participant context;
- intervention or feature;
- related content references;
- current Consent and pause state;
- prior relevant Safety history;
- action options;
- and audit.

AI confidence is not presented as certainty.

---

## 198. Close as Not SafetyEvent

The reviewer records:

- assessment;
- reason;
- support or monitoring;
- communication;
- and closure.

The original SafetySignal remains preserved.

---

## 199. Convert to SafetyEvent

Before conversion, the reviewer confirms:

- category;
- severity;
- relatedness;
- affected intervention or feature;
- immediate action;
- monitoring;
- reporting requirement;
- and accountable reviewer.

---

## 200. SafetyEvent View

The SafetyEvent view shows:

- confirmed status;
- category;
- severity;
- relatedness;
- actions;
- current monitoring;
- Participant or feature pause;
- owner;
- and timeline.

It does not use alarm colour alone.

---

## 201. Safety Action Flow

Potential actions include:

- contact Participant;
- provide support;
- stop an interaction;
- pause matching;
- pause messaging;
- pause AI;
- pause intervention component;
- escalate;
- notify approved contact;
- and monitor.

Each action shows authority and completion state.

---

## 202. Participant or Feature Pause

The pause confirmation identifies:

- scope;
- reason category;
- immediate effects;
- what remains available;
- review time;
- owner;
- and resume process.

The smallest safe scope is preferred.

---

## 203. Resume after Safety Pause

Resume requires:

- review;
- corrective action;
- current Consent;
- current eligibility;
- feature readiness;
- Participant communication;
- and approval.

The interface preserves the original pause history.

---

## 204. Emergency Limitation

Participant-facing safety help explains:

- the Platform is not an emergency service;
- local emergency or crisis options;
- study-team support hours;
- and what the Platform can do.

Emergency wording must be approved for the Conceptual Prototype setting.

---

## 205. AI Companion Entry Points

AI appears at defined contextual points, including:

- study explanation;
- Life Story;
- PublicProfile Draft;
- SocialPost Draft;
- MatchExplanation;
- Message Draft;
- interaction preparation;
- reflection;
- research Drafting;
- evidence retrieval;
- Dataset documentation;
- and analysis support.

A universal global chat is not the primary interface.

---

## 206. AI Companion Identity

The AI interface clearly states:

- it is AI;
- its current role;
- what it can do;
- what it cannot do;
- whether information may be remembered;
- and how to reach a human.

It does not use a human identity or imply emotional need.

---

## 207. AI Role Header

Each AI surface shows a role label such as:

- Life Story Assistant;
- Research Drafting Assistant;
- Match Explanation Assistant;
- Message Draft Assistant;
- or Navigation Help.

The role constrains tools and Context.

---

## 208. AI Response Structure

A Participant-facing response may use:

1. direct answer;
2. source or basis;
3. uncertainty or limitation;
4. suggested next step;
5. action controls;
6. human-help option.

Long reasoning is hidden behind optional detail.

---

## 209. AI Source Presentation

AI response sources may include:

- Approved Study Information;
- Participant Preference;
- Participant Testimony;
- LifeStoryItem;
- MatchCandidate;
- Community Rule;
- Retrieved Evidence;
- Tool Result;
- or AI Suggestion.

Source labels remain understandable.

---

## 210. AI Uncertainty

Uncertainty language should be:

- specific;
- proportionate;
- non-alarming;
- and actionable.

Examples of state labels:

- Grounded;
- Partially Grounded;
- Needs Confirmation;
- Draft;
- Human Review Required;
- and Unable to Verify.

---

## 211. AI Draft Presentation

AI Drafts use:

- clear Draft label;
- editable content;
- source and AI involvement;
- Accept, Edit and Reject;
- and no automatic publication or send.

The Draft label persists until an owning-domain action succeeds.

---

## 212. AI Tool Proposal

Before an effectful action, the AI surface shows:

- proposed action;
- target;
- audience or recipient;
- reason;
- consequence;
- reversibility;
- data involved;
- and required confirmation.

---

## 213. AI Action Confirmation

Confirmation is:

- actor-specific;
- resource-specific;
- short-lived;
- version-bound;
- and single-use where appropriate.

The model cannot confirm its own proposal.

---

## 214. AI Tool Result

After execution, the interface displays:

- successful owning module;
- exact action;
- time;
- result state;
- next step;
- and audit or receipt where appropriate.

The interface does not claim success from model text alone.

---

## 215. AI Refusal

A refusal explains:

- what cannot be done;
- why in plain language;
- what safe alternative is available;
- and whether a human can help.

It avoids exposing internal security details.

---

## 216. AI Human Review

When Human Review is required, the user sees:

- what is being reviewed;
- expected response route;
- current state;
- ability to cancel where allowed;
- and urgent alternatives.

No silent approval occurs.

---

## 217. AI Safety Escalation

If AI identifies a possible concern:

- it provides appropriate immediate guidance;
- creates or offers to create a SafetySignal according to policy;
- limits disclosure;
- and hands off to human review.

It does not say that a SafetyEvent has been confirmed.

---

## 218. AI Dependency Safeguards

The AI interface must not:

- claim love;
- imply exclusivity;
- express distress when the user leaves;
- discourage human contact;
- pressure disclosure;
- or use guilt.

Prompts should support appropriate human connection and disengagement.

---

## 219. AI Conversation History

History is scoped by:

- role;
- ResearchProject;
- Participant;
- purpose;
- and current permission.

Users can identify:

- saved conversation;
- temporary conversation;
- deleted conversation;
- and retained governance metadata.

---

## 220. AI Memory Controls

The Participant can review:

- memory content;
- source;
- purpose;
- allowed AI roles;
- expiry;
- restrictions;
- correction;
- revocation;
- and deletion.

Memory does not appear as a hidden personalisation score.

---

## 221. AI Degraded State

When AI is unavailable, the interface offers:

- rule-based guidance;
- templates;
- saved Drafts;
- manual workflow;
- human support;
- and retry when safe.

Core Consent, Block, Report, Safety and withdrawal remain available.

---

## 222. Knowledge Degraded State

When live Knowledge retrieval is unavailable:

- approved EvidenceSnapshots may remain visible;
- freshness is shown;
- new evidence-sensitive approvals may pause;
- and the interface avoids fabricated sources.

---

## 223. Provider Degraded State

The interface distinguishes:

- provider unavailable;
- provider response delayed;
- provider result unknown;
- and approved fallback active.

A fallback model or provider is identified in audit and research views.

---

## 224. Loading States

Loading states should:

- identify the task;
- preserve layout;
- avoid false progress;
- allow cancellation where safe;
- and provide timeout recovery.

High-impact actions display server confirmation before completion.

---

## 225. Skeleton States

Skeletons are appropriate for predictable low-risk content.

They should not imitate:

- approval;
- Message delivery;
- Safety decision;
- matching result;
- or DatasetLock.

---

## 226. Empty States

Empty states explain:

- why nothing is shown;
- whether the state is normal;
- what the user can do;
- and where to get help.

Examples include:

- no Life Story items;
- no Community posts;
- no MatchCandidates;
- no Connections;
- no Messages;
- and no current tasks.

---

## 227. Offline State

Offline state shows:

- current connectivity;
- which content remains available;
- which actions are disabled;
- whether Drafts are saved locally;
- and when synchronisation will occur.

Offline completion of high-impact actions is disabled unless specifically designed and governed.

---

## 228. Synchronisation State

Synchronisation states include:

- Saved Locally;
- Syncing;
- Synced;
- Conflict;
- Failed;
- and Requires Review.

The interface does not present local save as server-confirmed publication or send.

---

## 229. Stale State

If the underlying resource changed:

- the user is informed;
- current version is loaded;
- differences are shown;
- and the action is retried or revised.

Stale Consent, Block, MutualAcceptance or DatasetLock cannot be ignored.

---

## 230. Version Conflict

Version conflict UX should:

- preserve the user's Draft;
- show the changed resource;
- compare versions;
- prevent silent overwrite;
- and offer Merge, Refresh, Save Copy or Cancel where appropriate.


---

## 231. Error States

Every error states:

- what happened;
- whether work was saved;
- what did not happen;
- how to recover;
- whether retry is safe;
- and how to get help.

Technical codes appear only as optional detail.

---

## 232. Error Severity

Severity levels are:

- Informational;
- Recoverable;
- Blocking;
- Safety-Critical;
- and Security-Critical.

Severity controls placement, persistence, interruption and escalation.

---

## 233. Informational State

Informational states explain a change without requiring immediate action.

They should not use warning styling.

---

## 234. Recoverable Error

A recoverable error provides:

- preserved input;
- correction;
- safe retry;
- alternate route;
- and support.

---

## 235. Blocking Error

A blocking error:

- explains the blocked action;
- avoids blaming the user;
- preserves prior work;
- and provides a clear resolution or support path.

---

## 236. Safety-Critical Error

A Safety-Critical error:

- stops the unsafe action;
- keeps emergency and support options visible;
- routes accountable review;
- and avoids false reassurance.

---

## 237. Security-Critical Error

A Security-Critical error may:

- end or restrict the session;
- hide protected details;
- require step-up authentication;
- and provide a safe support route.

---

## 238. Session Timeout

Before timeout, the user receives:

- clear warning;
- time remaining;
- Extend Session where safe;
- Save Draft;
- and Sign Out.

After timeout, sensitive content is hidden.

---

## 239. Shared-Device Timeout

Shared-device mode uses:

- shorter idle timeout;
- discreet notifications;
- minimal recent-content preview;
- explicit sign out;
- and optional no-history mode.

---

## 240. Destructive Actions

Destructive actions include:

- withdraw;
- delete;
- remove share;
- disconnect;
- Block;
- reject contribution;
- remove content;
- revoke permission;
- and cancel a pending export.

The interface explains scope and reversibility.

---

## 241. Confirmation Patterns

Confirmation levels are:

- Simple Confirmation;
- Detailed Confirmation;
- Step-Up Authentication;
- Dual Approval;
- and Human Review.

The level reflects consequence rather than visual preference.

---

## 242. Simple Confirmation

Used for low-risk reversible actions.

It includes:

- action;
- target;
- and undo where available.

---

## 243. Detailed Confirmation

Used for:

- publication;
- Message send;
- visibility change;
- matching activation;
- MatchDecision;
- disconnect;
- Block;
- withdrawal;
- and data export.

It shows consequence and audience.

---

## 244. Step-Up Authentication

Used where current authentication is insufficient for:

- sensitive export;
- LegacyPreference;
- privileged role change;
- break-glass access;
- or another high-impact action.

---

## 245. Dual Approval

Used for selected governance actions such as:

- exceptional data release;
- high-impact configuration;
- or another action defined by policy.

Dual approval is not used as a substitute for Participant Consent.

---

## 246. Undo

Undo is available for appropriate actions such as:

- reaction;
- Mute;
- simple preference change;
- Draft deletion;
- and selected reversible social actions.

Undo does not apply to sent, delivered, approved, locked or externally published actions without a governed reversal process.

---

## 247. Forms

Forms use:

- visible labels;
- labels above fields;
- required and optional indicators;
- examples;
- inline validation;
- preserved input;
- error summary;
- and accessible help.

---

## 248. Sensitive Form Field

A sensitive field explains:

- why information is requested;
- who may see it;
- whether it is optional;
- how long it is retained;
- and what happens if declined.

---

## 249. Multi-Step Form

Multi-step flows provide:

- purpose;
- estimated length;
- progress;
- Back;
- Save and Exit;
- step titles;
- review;
- and final confirmation.

Progress does not imply mandatory completion of optional steps.

---

## 250. Assessment Component

Assessment components support:

- one item or small group;
- consistent scale;
- clear direction;
- selected-state label;
- Prefer not to answer where allowed;
- assistance;
- pause;
- and missingness reason.

---

## 251. Data Table

Researcher tables support:

- sorting;
- filtering;
- pagination;
- column selection;
- saved views;
- accessible row actions;
- and approved export.

Mobile uses a card or detail alternative rather than horizontal overflow alone.

---

## 252. Timeline

Timelines are used for:

- Consent;
- Protocol;
- intervention exposure;
- Life Story versions;
- Connection;
- moderation;
- Safety;
- approval;
- and Dataset or Analysis history.

Each item shows actor, event, time, state and version.

---

## 253. Chart

Charts must include:

- title;
- purpose;
- unit;
- denominator;
- time range;
- source;
- accessible data alternative;
- and uncertainty where applicable.

Operational charts are not labelled as scientific findings.

---

## 254. Card

Cards represent coherent:

- resource;
- task;
- decision;
- or exception.

Cards should not be used for every text block.

---

## 255. Life Story Card

A Life Story Card shows:

- title;
- media indicator;
- Draft or confirmation state;
- author or contributor;
- visibility;
- AI involvement;
- last change;
- and actions.

It avoids public popularity metrics.

---

## 256. PublicProfile Card

A PublicProfile Card shows only approved public fields.

It includes:

- current audience;
- Block effect;
- View Profile;
- and context-specific Match or Community action.

---

## 257. SocialPost Card

A SocialPost Card includes:

- author;
- content;
- audience;
- time;
- edited state;
- AI assistance where material;
- content warning;
- comment or reaction;
- Block;
- and Report.

---

## 258. MatchCandidate Card Component

The component includes:

- safe public identity;
- permitted declared interests;
- MatchExplanation summary;
- expiry;
- Interested;
- Not Now;
- Dismiss;
- Block;
- and Report.

It excludes hidden compatibility scores.

---

## 259. Connection and Communication Card

The card shows:

- current Connection state;
- source or basis summary;
- current CommunicationBasis;
- last permitted interaction summary;
- Open messages where allowed;
- Mute;
- Disconnect;
- Block;
- Report;
- and Help.

It does not imply Supporter, care or research authority.

When communication is unavailable, the card explains whether the reason is:

- paused or disconnected Connection;
- expired or invalid basis;
- Block;
- feature pause;
- or another protected state without disclosing sensitive detail.

## 260. Message Composer Component

The component supports:

- recipient;
- CommunicationBasis summary;
- text;
- approved attachment;
- AI Draft;
- link warning;
- Save Draft;
- Review and send;
- and current Draft version.

The component has distinct sub-states:

- Draft;
- validation;
- confirmation;
- queue submission;
- and delivery outcome.

The Send action is visually and semantically distinct from Save Draft.

Any change after confirmation returns the Message to confirmation-required state.

## 261. Visibility Selector Component

The selector includes:

- visibility option;
- audience count or description where safe;
- authentication boundary;
- searchability;
- sharing rights;
- Block behaviour;
- and Preview.

No non-private choice is preselected for new sensitive content.

---

## 262. Audience Summary Component

The summary uses plain language such as:

> Only you can see this.

> These three selected people can see this.

> Members of the Garden Stories community can see this.

It avoids vague labels such as **Shared** without audience.

---

## 263. Permission Summary Component

The component shows:

- actor;
- Relationship;
- purpose;
- permitted resources;
- permitted actions;
- restrictions;
- expiry;
- and revocation.

It is used in Supporter and administrative flows.

---

## 264. Source and Provenance Component

The component displays:

- source type;
- source name;
- version;
- date;
- verification;
- AI involvement;
- and link to detail.

Participant-facing language remains simple.

---

## 265. Block and Report Component

The component provides:

- Block;
- Report;
- Get Help;
- concern categories;
- safe confirmation;
- and privacy explanation.

It is reusable across PublicProfile, SocialPost, MatchCandidate, Connection and Message surfaces.


---

## 266. ModerationCase Component

The case component includes:

- priority;
- report category;
- target;
- assigned Moderator;
- applicable rule version;
- provisional signal;
- evidence;
- Human Review;
- decision;
- appeal;
- and Safety link.

---

## 267. Safety Escalation Panel

The panel includes:

- current urgency;
- source;
- immediate guidance;
- SafetySignal action;
- human contact;
- emergency limitation;
- and audit state.

It does not display AI classification as confirmed SafetyEvent.

---

## 268. DatasetLock Panel

The panel shows:

- DatasetVersion;
- source cut-off;
- quality;
- de-identification;
- manifest;
- checksums;
- compatible AnalysisPlan;
- unresolved issue;
- approver;
- and lock consequence.

---

## 269. AnalysisRun Card

The card shows:

- AnalysisPlan;
- DatasetLock;
- code;
- environment;
- parameters;
- state;
- warnings;
- outputs;
- and rerun action.

---

## 270. ResearchFinding Card

The card shows:

- ResearchQuestion;
- finding state;
- claim;
- uncertainty;
- limitations;
- exact supporting versions;
- reviewer;
- and approval.

Preliminary AI-generated narrative is not shown as the finding.

---

## 271. Notification Strategy

Notifications should be:

- relevant;
- permission-scoped;
- privacy-aware;
- accessible;
- rate-limited;
- and actionable.

Notification volume is not a success metric.

---

## 272. Notification Types

Types include:

- Task;
- Reminder;
- Social;
- Moderation;
- Safety;
- Consent;
- Research;
- Operational;
- and Security.

Each type has distinct urgency and privacy treatment.

---

## 273. Notification Privacy

Lock-screen and email previews should not reveal:

- Life Story text;
- Message body;
- matching identity;
- reporter identity;
- Safety detail;
- assessment answer;
- or private research information.

---

## 274. Reminder Design

Reminders:

- identify the activity;
- explain why it is due;
- allow pause or quiet hours;
- avoid guilt;
- avoid age-stereotyped language;
- and provide Help.

---

## 275. Social Notification Boundary

Social notifications may indicate:

- new permitted Message;
- Connection state;
- Community reply;
- or matching update

without exposing private content on an insecure surface.

---

## 276. Safety Notification Boundary

Safety notifications:

- use approved channels;
- reach accountable humans;
- include minimum necessary context;
- distinguish Signal from Event;
- and track receipt and escalation.

---

## 277. Content Design Principles

Content should be:

- plain;
- respectful;
- specific;
- action-oriented;
- non-coercive;
- culturally aware;
- and consistent with domain terms.

---

## 278. Participant Language

Participant language prefers:

- short sentences;
- familiar words;
- direct action;
- optional detail;
- neutral choices;
- and explanation before consequence.

Technical terms are translated into plain language while preserving meaning.

---

## 279. Researcher Language

Researcher language may use domain terminology but must preserve:

- exact state;
- version;
- source;
- uncertainty;
- limitation;
- and accountability.

---

## 280. Supporter Language

Supporter content emphasises:

- Participant choice;
- permission scope;
- authorship;
- assistance boundary;
- and revocation.

---

## 281. Moderator Language

Moderator language should be:

- evidence-based;
- non-inflammatory;
- proportionate;
- rule-specific;
- and suitable for appeal review.

---

## 282. Safety Language

Safety language is:

- calm;
- direct;
- non-diagnostic;
- minimum necessary;
- and action-oriented.

Urgency is explicit without using alarming ambiguity.

---

## 283. AI Language

AI language must not:

- claim human identity;
- imply emotional need;
- overstate certainty;
- present Draft as fact;
- or use manipulative engagement language.

---

## 284. Inclusive Language

The Platform avoids:

- infantilising older adults;
- assuming family structure;
- assuming heterosexual or binary relationships;
- deficit-first language;
- and age-based stereotypes.

---

## 285. Accessibility Standard

The product should target current WCAG Level AA requirements and applicable organisational standards.

Accessibility applies to:

- content;
- interaction;
- visual design;
- media;
- authentication;
- charts;
- tables;
- AI;
- and social-safety controls.

---

## 286. Ability-Adaptive Modes

Supported modes may include:

- Standard;
- Simple;
- Step-by-Step;
- High Visibility;
- Read-Aloud;
- Supporter-Assisted;
- Low Stimulation;
- and Extended Time.

Modes may be combined where compatible.

---

## 287. Adaptation Controls

Adaptation controls are:

- easy to find;
- previewable;
- reversible;
- persistent where chosen;
- and available during a task.

The user does not need to restart a workflow.

---

## 288. Cognitive Accessibility

The experience supports:

- short steps;
- clear headings;
- reduced choices;
- repeated instructions;
- consistent placement;
- visible progress;
- examples;
- review;
- and recovery.

---

## 289. Visual Accessibility

The design supports:

- text scaling;
- high contrast;
- non-colour status;
- visible focus;
- readable line length;
- sufficient spacing;
- and alternatives to dense charts.

---

## 290. Motor Accessibility

The design supports:

- large targets;
- keyboard;
- switch-compatible semantics;
- no precise drag requirement;
- no time-critical gesture;
- and forgiving spacing.

---

## 291. Hearing Accessibility

Audio and video support:

- captions;
- transcripts;
- volume-independent alternatives;
- visual alerts;
- and no audio-only instruction.

---

## 292. Speech and Language Accessibility

The experience supports:

- text alternative;
- extra response time;
- correction;
- replay;
- supported communication;
- and approved translation.

Speech difficulty is not interpreted as lack of understanding.

---

## 293. Screen Reader Experience

Critical elements require:

- semantic headings;
- landmarks;
- labels;
- descriptions;
- live-region restraint;
- accessible dialogs;
- table headers;
- and announced state changes.

---

## 294. Focus Management

Focus is moved deliberately after:

- navigation;
- dialog open;
- validation;
- successful action;
- failed action;
- and dynamic content update.

Focus must not jump unexpectedly during AI streaming.

---

## 295. Touch Targets

Primary Participant controls should use generous touch targets and spacing.

Block, Report, Cancel and Back must remain reachable without accidental activation.

---

## 296. Time Limits

Time limits:

- are avoided where possible;
- provide warning;
- support extension;
- preserve Drafts;
- and do not invalidate Consent or assessment silently.

---

## 297. Motion

Motion is:

- purposeful;
- optional;
- reduced according to preference;
- and never required to understand state.

No confetti or reward animation is used for Consent, matching, Message volume or study completion.

---

## 298. Voice Interaction

Voice may support:

- navigation;
- read-aloud;
- dictation;
- Life Story capture;
- and Message Drafting.

Voice does not bypass review, confirmation or permission.

---

## 299. Voice Confirmation

High-impact voice actions require:

- repeat-back;
- explicit confirmation;
- visual or audio summary;
- and safe cancellation.

Voice alone does not approve DatasetLock, research findings or high-impact moderation.

---

## 300. Multimodal Interaction

Multimodal input may combine:

- text;
- voice;
- image;
- document;
- and video.

Each modality has:

- Consent;
- provider;
- processing-state;
- quality;
- review;
- privacy;
- and deletion UX.


---

## 301. Responsive Design

The Platform uses responsive web design.

Participant flows are mobile-first in interaction simplicity.

Researcher, Moderator, Safety and Administration workspaces may use wider layouts while preserving keyboard and zoom support.

---

## 302. Desktop Layout

Desktop may use:

- persistent sidebar;
- contextual secondary navigation;
- multi-column comparison;
- fixed action summary;
- and dense tables.

Critical actions remain visible at high zoom.

---

## 303. Tablet Layout

Tablet design supports:

- touch;
- landscape and portrait;
- collapsible navigation;
- readable forms;
- and shared-device privacy.

---

## 304. Mobile Layout

Mobile design uses:

- single-column flow;
- bottom or compact primary navigation;
- sticky but non-obscuring critical actions;
- card alternatives to tables;
- and visible Back, Help and Exit.

---

## 305. Breakpoint Philosophy

Breakpoints follow content and interaction needs rather than named devices alone.

The design must work with:

- browser zoom;
- large text;
- split screen;
- and orientation change.

---

## 306. Shared Environment Privacy

In shared environments, the UX supports:

- discreet page titles;
- hidden notification content;
- optional privacy screen;
- easy sign out;
- reduced recent-content preview;
- and safe return to Home.

---

## 307. Shared Device Use

Shared-device mode supports:

- explicit user switching;
- no cross-user history;
- local Draft protection;
- short timeout;
- and visible current identity.

---

## 308. Localization

The design system supports:

- text expansion;
- right-to-left readiness where relevant;
- pluralisation;
- locale-specific date and time;
- translated accessibility labels;
- and language-specific reading level.

---

## 309. Date and Time

Date and time presentation:

- uses locale-appropriate format;
- includes timezone where material;
- distinguishes planned and actual;
- avoids ambiguous numeric dates;
- and supports relative time only with exact detail available.

---

## 310. Design Token Architecture

Tokens are semantic and layered:

```text
Foundation Tokens
        ↓
Semantic Tokens
        ↓
Component Tokens
        ↓
Mode and Theme Overrides
```

Components should not depend on hard-coded visual values.

---

## 311. Colour Tokens

Semantic colour categories include:

- surface;
- text;
- border;
- action;
- focus;
- information;
- success;
- warning;
- danger;
- Safety;
- moderation;
- AI;
- and disabled.

Colour is never the sole state indicator.

---

## 312. Visibility Colour Use

Visibility levels may use icons and labels.

Colour differences must remain secondary and accessible.

Private and Internet Public should never rely on subtle colour alone.

---

## 313. Typography Tokens

Typography tokens define:

- family;
- size;
- line height;
- weight;
- letter spacing;
- and measure.

Participant typography uses generous line height and scalable sizing.

---

## 314. Typography Rules

The design avoids:

- all-caps paragraphs;
- very light text;
- narrow line height;
- long line length;
- and tiny secondary labels.

Text must remain usable at 200% zoom and high text scale.

---

## 315. Spacing Tokens

Spacing tokens support:

- dense Researcher views;
- standard views;
- and spacious Participant views

without creating separate incompatible systems.

---

## 316. Shape and Border Tokens

Shape and border communicate grouping and interaction without infantilising the experience.

Critical status uses structure, text and icon in addition to border.

---

## 317. Focus Tokens

Focus tokens provide:

- high contrast;
- sufficient thickness;
- offset;
- and consistency.

Focus must remain visible on every surface and state.

---

## 318. Motion Tokens

Motion tokens define:

- duration;
- easing;
- entrance;
- exit;
- progress;
- and reduced-motion alternatives.

---

## 319. Elevation Tokens

Elevation is used sparingly for:

- menus;
- dialogs;
- sticky actions;
- and temporary overlays.

Elevation does not represent scientific confidence or authority.

---

## 320. Iconography

Icons should be:

- familiar;
- labelled where meaning is not obvious;
- consistent;
- culturally reviewed;
- and available in high contrast.

Icons for AI, Block, Report, Visibility, Safety and Draft require text labels.

---

## 321. Imagery

Imagery should:

- represent varied older adults;
- avoid fragility stereotypes;
- avoid staged false social proof;
- include varied abilities and identities;
- and support the intervention rather than decorate sensitive decisions.

---

## 322. Core Component Inventory

The MVP component library includes:

- App Shell;
- Workspace Switcher;
- Context Banner;
- Navigation;
- Breadcrumb;
- Button;
- Link;
- Form controls;
- Stepper;
- Assessment Item;
- Card;
- Table;
- Timeline;
- Chart;
- Alert;
- Banner;
- Toast;
- Dialog;
- Drawer;
- Status Badge;
- Visibility Selector;
- Consent Choice;
- Permission Summary;
- Source and Provenance;
- AI Response;
- Block and Report;
- Safety Panel;
- File Upload;
- and Progress Indicator.

---

## 323. Button Hierarchy

Button hierarchy includes:

- Primary;
- Secondary;
- Tertiary;
- Destructive;
- and Link.

Only one primary action should dominate a decision area.

---

## 324. Button Labels

Button labels state the action:

- Save Draft;
- Confirm My Story;
- Publish to Community;
- Turn On Matching;
- Record Interest;
- Send Message;
- Block This Person;
- Submit Report;
- Lock This Dataset Version;
- and Withdraw from Study.

Avoid vague labels such as **Yes**, **OK** or **Continue** when consequence is material.

---

## 325. Dialog

Dialogs are used for focused decisions, not long forms.

They include:

- clear title;
- consequence;
- primary and cancel actions;
- accessible focus;
- and close behaviour.

---

## 326. Alert and Banner

A Banner is used for persistent context or system-wide state.

An Inline Alert is used near the affected content.

A Toast is used only for low-risk temporary confirmation.

Safety, Consent withdrawal, Message failure and DatasetLock are not communicated only through Toast.

---

## 327. File Upload

Upload UX includes:

- accepted types;
- size;
- privacy;
- progress;
- quarantine;
- scan;
- validation;
- failure;
- removal;
- and final confirmation.

Uploaded does not mean published or attached successfully.

---

## 328. Progress Indicator

Progress indicates:

- workflow steps;
- not social achievement;
- not research benefit;
- and not pressure to complete optional choices.

---

## 329. Help System

Help includes:

- contextual explanation;
- search;
- accessibility;
- human support;
- technical support;
- social-safety guidance;
- and Safety help.

Help remains available during error and degraded states.

---

## 330. Human Support Handoff

The handoff shows:

- what will be shared;
- who receives it;
- urgency;
- expected channel;
- and cancellation where permitted.

The Participant can remove optional AI conversation detail before handoff where safe.

---

## 331. Usability Testing Strategy

Testing uses:

- representative Participants;
- varied digital experience;
- varied accessibility needs;
- Researchers;
- Supporters;
- Moderators;
- Safety Reviewers;
- and Administrators.

Prototype and production-like testing are both required.

---

## 332. Core Participant Usability Tasks

Tasks include:

- activate account;
- understand study;
- make granular Consent choices;
- set accessibility;
- complete baseline;
- create and confirm Life Story;
- choose visibility;
- join or decline Community;
- activate or decline matching;
- understand MatchExplanation;
- record MatchDecision;
- recognise MutualAcceptance;
- send a confirmed Message;
- Block and Report;
- complete reflection;
- review AI memory;
- and withdraw.

---

## 333. Core Researcher Usability Tasks

Tasks include:

- create ResearchProject;
- complete EvidenceReview;
- approve EvidenceDecision;
- create ProtocolVersion;
- configure intervention, Community, matching and AI;
- monitor delivery;
- review data quality;
- generate DatasetVersion;
- authorise DatasetLock;
- run analysis;
- review interpretation;
- and approve or reject ResearchFinding.

---

## 334. Core Moderator and Safety Tasks

Moderator tasks include:

- triage Report;
- protect reporter;
- review evidence;
- record decision;
- handle appeal;
- and restore.

Safety tasks include:

- triage SafetySignal;
- close as not event;
- convert to SafetyEvent;
- record action;
- pause;
- and resume.

---

## 335. Usability Measures

Measures may include:

- completion;
- time;
- errors;
- assistance;
- adaptation;
- comprehension;
- confidence;
- abandonment;
- recovery;
- and perceived burden.

Performance metrics are interpreted with qualitative feedback.

---

## 336. Accessibility Testing

Testing includes:

- keyboard;
- screen reader;
- zoom;
- text scaling;
- contrast;
- reduced motion;
- voice;
- captions;
- touch;
- cognitive load;
- extended time;
- and assisted completion.

Critical rights must be reachable in every supported mode.

---

## 337. Consent UX Testing

Test whether Participants understand:

- voluntary participation;
- Life Story privacy;
- Community and matching choice;
- audience;
- AI;
- Supporter role;
- data use;
- withdrawal;
- and retained exceptions.

A checked box is not evidence of comprehension.

---

## 338. Social-Safety UX Testing

Testing includes:

- fake profile;
- harassment;
- scam;
- unwanted contact;
- Block;
- Report;
- no candidate;
- no MutualAcceptance;
- Message failure;
- reporter protection;
- moderation delay;
- and appeal.

---

## 339. AI UX Testing

Testing includes:

- AI identity;
- Draft recognition;
- source comprehension;
- uncertainty;
- invention;
- hidden matching inference;
- Message confirmation;
- refusal;
- Human Review;
- memory control;
- degraded state;
- and dependency language.

---

## 340. Error Recovery Testing

Testing includes:

- connectivity loss;
- timeout;
- stale state;
- version conflict;
- upload failure;
- provider failure;
- Message failure;
- failed matching operation;
- failed moderation action;
- failed Safety escalation;
- and failed DatasetLock.


---

## 341. UX Analytics

UX analytics collect only data needed for:

- usability;
- accessibility;
- intervention fidelity;
- social-safety operations;
- AI evaluation;
- support;
- and research.

Analytics do not become unrestricted behavioural surveillance.

---

## 342. UX Event Naming and Domain Mapping

The Platform distinguishes:

- UX Analytics Events;
- Domain Events;
- Integration Events;
- Operational Events;
- and Audit Events.

A user interaction event must not use a completed Domain Event name unless the owning domain actually confirmed that fact.

Representative mapping:

| UX Analytics Event | Canonical Domain Event or Result |
|---|---|
| `ConsentConfirmationSubmitted` | `ConsentRecorded` after M03 success |
| `LifeStoryVisibilityChangeSubmitted` | `LifeStoryItemVisibilityChanged` after M17 success |
| `PublicProfileActivationSubmitted` | `PublicProfilePublished` after M18 success |
| `MatchDecisionSubmitted` | `MatchDecisionRecorded` after M18 success |
| `ConnectionActivationSubmitted` | `ConnectionActivated` after M18 success |
| `MessageSendConfirmationSubmitted` | `MessageSendConfirmed` after M18 success |
| `MessageDeliveryStatusViewed` | no new delivery Domain Event |
| `BlockConfirmationSubmitted` | `BlockCreated` after M18 success |
| `UserReportFormSubmitted` | `UserReportSubmitted` after M18 success |
| `DatasetLockConfirmationSubmitted` | `DatasetVersionLocked` after M12 success |

Canonical M18 events include:

- MatchPreferenceActivated;
- MatchCandidateViewed as UX Analytics only unless a Domain Event is deliberately defined;
- MatchDecisionRecorded;
- MutualAcceptanceRecorded;
- MutualAcceptanceExpired;
- MutualAcceptanceInvalidated;
- ConnectionActivated;
- ConversationThreadCreated;
- MessageDraftCreated;
- MessageDraftRevised;
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
- and ModerationDecisionRecorded.

Deprecated or ambiguous canonical names include:

- ActorBlocked;
- UserReported;
- MessageDeliveryConfirmed;
- MatchCompleted;
- DatasetLockConfirmed;
- and SafetyEventDetected.

`DatasetLockConfirmed` may describe a legacy UX interaction only; `DatasetVersionLocked` is the Domain Event.

## 343. Analytics Privacy

Analytics must not capture by default:

- Life Story text;
- Message body;
- Reporter identity;
- MatchCandidate private data;
- Safety narrative;
- assessment answer;
- full AI prompt;
- or moderation evidence.

---

## 344. Design QA

Design QA verifies:

- layout;
- tokens;
- responsive behaviour;
- keyboard;
- screen reader;
- text scaling;
- content;
- loading;
- empty;
- error;
- protected existence;
- role visibility;
- Visibility;
- Block;
- Draft state;
- delivery state;
- and degraded state.

---

## 345. Cross-Role QA

Cross-role tests verify that:

- Participant and Supporter see different resources;
- Researcher and Moderator access remain separate;
- Moderator and Safety access remain separate;
- Administrator does not receive research authority;
- and workspace switching does not merge permission.

---

## 346. Social-State QA

Social QA verifies:

- PublicProfile separation;
- Community eligibility;
- Block;
- Report;
- matching opt-in;
- allowed attributes;
- independent MatchDecision;
- MutualAcceptance;
- Connection;
- Message confirmation;
- Mute;
- Disconnect;
- and reporter protection.

---

## 347. AI State QA

AI QA verifies:

- role label;
- Draft label;
- source;
- uncertainty;
- Tool proposal;
- confirmation;
- Human Review;
- owning-domain result;
- memory;
- refusal;
- degraded state;
- and kill switch.

---

## 348. Research-State QA

Research QA verifies:

- exact versions;
- In Review;
- approval;
- returned revision;
- immutable approved state;
- Dataset candidate versus Locked;
- AnalysisRun state;
- InterpretationRecord;
- and ResearchFinding approval.

---

## 349. Content Governance

Material content has:

- owner;
- audience;
- version;
- approval;
- effective date;
- review trigger;
- and retirement state.

Governed content includes:

- Consent;
- Community Rules;
- matching explanation;
- Message safety;
- moderation explanation;
- Safety guidance;
- AI identity and limitations;
- withdrawal;
- and Participant materials.

---

## 350. Design System Governance

The design system has:

- owner;
- contribution process;
- design review;
- accessibility review;
- security and privacy review where relevant;
- versioning;
- release notes;
- deprecation;
- and migration guidance.

---

## 351. Component States

Every interactive component defines:

- default;
- hover where relevant;
- focus;
- active;
- selected;
- disabled;
- read-only;
- loading;
- empty;
- error;
- success;
- complete;
- expired;
- restricted;
- and offline where relevant.

---

## 352. Component Documentation

Each component page includes:

- purpose;
- anatomy;
- variants;
- content guidance;
- behaviour;
- states;
- accessibility;
- permission implications;
- analytics;
- examples;
- anti-patterns;
- and implementation notes.

---

## 353. Design-System Release

A design-system release includes:

- token changes;
- component changes;
- breaking changes;
- accessibility evidence;
- affected workflows;
- migration steps;
- screenshots or prototypes;
- and approval.

---

## 354. Anti-Patterns

The Platform must avoid:

- hiding withdrawal;
- preselecting optional Consent;
- vague audience labels;
- combining ParticipantProfile and PublicProfile;
- showing hidden compatibility scores;
- creating Connection without MutualAcceptance;
- auto-sending AI Messages;
- using Toast as the only high-impact confirmation;
- using colour alone;
- hiding Block or Report;
- exposing reporter identity;
- treating SafetySignal as SafetyEvent;
- presenting AI Draft as testimony;
- presenting AnalysisOutput as Finding;
- endless feed as Participant Home;
- manipulative streaks;
- guilt-based reminders;
- fake social proof;
- age-stereotyped imagery;
- inaccessible tables;
- and generic AI chat on every page.

---

## 355. MVP UX Scope

The MVP fully designs:

- Participant invitation and activation;
- study introduction;
- granular Consent;
- accessibility setup;
- screening and baseline;
- Participant Home and My Study;
- private LifeStoryArchive;
- LifeStoryItem Draft, AI assistance and confirmation;
- Life Story visibility, sharing, withdrawal and export;
- optional Supporter contribution;
- PublicProfile;
- Community membership, feed and SocialPost;
- Open Matching introduction and MatchPreference;
- MatchCandidate, MatchExplanation and actor-owned MatchDecision;
- MutualAcceptance active, expired and invalidated states;
- Connection activation;
- Connection Detail and CommunicationBasis;
- ConversationThread;
- Message Draft and revision;
- attachment validation;
- exact SendConfirmation;
- Queued, Sent, Provider Accepted, Delivered, Failed and Unknown states;
- Mute, Disconnect, Block and Report;
- Block pending-delivery explanation;
- Moderator and Safety workflows;
- AI explanation, Draft, Tool proposal and Human Review;
- DatasetDefinition, DatasetVersion, DatasetLock and Analysis workflows;
- withdrawal and deletion;
- error and degraded states;
- and role-specific Administration.

ConnectionRequest and group messaging are not designed as active first-Conceptual Prototype flows.

## 356. MVP Design System Scope

The MVP design system includes:

- foundation and semantic tokens;
- responsive App Shell;
- role navigation;
- Context Banner;
- buttons;
- links;
- forms;
- stepper;
- assessments;
- cards;
- tables;
- timelines;
- charts;
- dialogs;
- alerts;
- status;
- Consent Choice;
- Permission Summary;
- Visibility Selector;
- Audience Summary;
- Life Story Card;
- SocialPost Card;
- MatchCandidate Card;
- Connection Card;
- Message Composer;
- Block and Report;
- AI Response;
- Source and Provenance;
- ModerationCase;
- Safety Panel;
- DatasetLock Panel;
- AnalysisRun Card;
- ResearchFinding Card;
- upload;
- and progress.

---

## 357. MVP UX Non-Goals

The MVP does not require:

- native mobile application patterns;
- anonymous public Community;
- unmoderated social space;
- unrestricted Internet Public publishing;
- influencer or follower design;
- viral-feed optimisation;
- unrestricted people search;
- unrestricted direct messaging;
- gamified matching;
- AI social agents;
- immersive reality;
- advanced wearable setup;
- full white-label theming;
- broad multilingual production content;
- or universal offline completion.

---

## 358. Deferred UX Capabilities

Deferred capabilities may include:

- richer voice interaction;
- on-device AI;
- offline intervention completion;
- group video;
- advanced Life Story media editing;
- intergenerational collaboration;
- privacy-preserving matching controls;
- Participant-controlled data spaces;
- multiple Community types;
- advanced analytical visualisation;
- institution-specific theming;
- and posthumous digital-legacy UX.

---

## 359. Conceptual Prototype UX Validation

Current validation uses:

- expert walkthroughs;
- synthetic personas;
- scripted scenarios;
- automated accessibility checks;
- keyboard and screen-reader inspection;
- state-transition tests;
- content and terminology review;
- adversarial and degraded-mode walkthroughs;
- and internal consistency analysis.

No human-subject usability study is required for the current phase.

The result is a list of supported design propositions, contradictions, limitations and future empirical questions.

## 360. Research-Critical UX Defects

A defect blocks the current conceptual prototype milestone when it prevents reliable reasoning about the model, including:

- a screen implying authority the domain does not grant;
- a state shown before owning-domain confirmation;
- Provider Accepted shown as Delivered;
- AI Draft shown as testimony;
- inaccessible representation of a critical decision;
- inconsistent audience labels;
- hidden uncertainty;
- or inability to reproduce a synthetic flow.

These are internal research-quality blockers, not release or regulatory gates.

## 361. UX Risks

Key risks include:

- cognitive overload;
- hidden Consent complexity;
- Life Story oversharing;
- PublicProfile leakage;
- Community harassment;
- hidden matching inference;
- no-candidate shame;
- non-mutual Connection confusion;
- Message send ambiguity;
- Block discoverability;
- reporter exposure;
- moderation opacity;
- Safety alarm fatigue;
- AI over-presence;
- AI dependency;
- Supporter overreach;
- inaccessible Researcher complexity;
- withdrawal friction;
- error anxiety;
- status confusion;
- over-notification;
- and age stereotyping.

Each risk requires an owner, mitigation and test.

---

## 362. Assumptions

This specification assumes:

- responsive web is the primary delivery surface;
- one primary Conceptual Prototype language;
- controlled authenticated Community;
- Internet Public disabled by default;
- limited matching and messaging;
- human moderation;
- human Safety review;
- optional or task-specific AI;
- managed identity;
- and one controlled Conceptual Prototype context.

Material assumption changes trigger review.

---

## 363. Open Conceptual UX Questions

1. Which interface concepts best expose domain state without excessive cognitive burden?
2. Which audience labels are least ambiguous?
3. How should synthetic personas represent varied ability without stereotyping?
4. Which states require persistent explanation rather than a status badge?
5. How can MutualAcceptance expiry and invalidation be explained without blame?
6. How should Provider Accepted and Delivery Unknown be represented?
7. Which AI provenance cues are necessary for correct authorship interpretation?
8. Which conceptual flows reveal conflicts between autonomy and assistance?
9. Which accessibility adaptations preserve semantic equivalence?
10. Which UX claims remain empirical questions rather than design conclusions?

## 364. Design Decisions

This document establishes that:

1. all current UX actors and data are synthetic;
2. UX work begins without external approval;
3. the prototype must preserve exact domain meaning;
4. internal review replaces release approval in the current phase;
5. accessibility remains a theoretical and executable requirement;
6. no interface may imply empirical effectiveness;
7. human-subject usability testing is a future optional extension;
8. mock providers and local environments are sufficient;
9. research-critical contradictions must be recorded;
10. the prototype is judged by clarity and model fidelity, not adoption metrics.

## 365. Summary

The conceptual UX architecture is:

```text
Synthetic Actor and Scenario
        ↓
Current Context and Modelled Permission
        ↓
Prototype Task Flow
        ↓
Visible State, Source, Audience and Uncertainty
        ↓
Deterministic Domain Result
        ↓
Synthetic Observation and Research Finding
```

The central rule is:

> Use the prototype to test whether the architecture can be understood and executed consistently; do not treat synthetic walkthroughs as evidence about real users.
