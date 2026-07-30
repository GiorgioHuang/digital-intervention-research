# Document 7 — Information Architecture

**Version:** 3.0  
**Status:** Revised Information Architecture Baseline  
**Handbook Volume:** Volume I — Product, Domain & Research Architecture  
**Primary System:** Digital Intervention Research Platform  
**Document Owner:** Product, UX and Information Architecture Governance  
**Approved By:** To be assigned  
**Last Updated:** 2026-07-29  
**Supersedes:** Document 7 — Information Architecture v2.0  
**Review Trigger:** A material change to product modules, bounded contexts, actor roles, permission evaluation, workspace structure, navigation, Life Story, Community, Platform Public and Internet Public visibility, Open Matching, messaging, moderation, safety, search, AI entry points, MVP scope, or adaptive UX requirements

---

## 1. Purpose

This document defines how information, navigation, workspaces, discovery, workflows, states, content relationships, and contextual actions are organised within the **Healthy Aging Digital Intervention Research Platform**.

It translates:

- the product-module architecture in Document 6 v3.1;
- the canonical domain model in Document 8 v3.2;
- the actor, relationship, consent, and permission model in Document 4 v3.0;
- the ability-adaptive UX principles in Document 5 v2.1;
- and the intervention, evidence, AI, research, data, and governance architecture in the wider Handbook

into a coherent information structure for Participants, Supporters, researchers, reviewers, moderators, administrators, and system operators.

> Information architecture determines what a person can discover, understand, navigate to, compare, act on, share, and recover from. It must therefore enforce the same authority, consent, safety, provenance, and Participant-control boundaries as the domain model.

## 2. Scope

This document covers:

- global information architecture and application shell;
- workspace architecture;
- permission-scoped navigation;
- Participant, Supporter, Researcher, reviewer, moderator, administrator, and operator experiences;
- Research Project and intervention information hierarchy;
- Life Story and Personal Archive information architecture;
- Governed Community and Platform Public information architecture;
- open matching and connection information architecture;
- search, discovery, filtering, and existence protection;
- messaging, notifications, tasks, and activity history;
- evidence and Knowledge Platform reference presentation;
- AI Companion entry points and output presentation;
- Safety Signal, Safety Event, report, moderation, and appeal flows;
- state, status, version, source, and provenance presentation;
- ability-adaptive navigation and content density;
- device and responsive priorities;
- MVP information architecture;
- and information-architecture governance and validation.

This document does not define:

- final visual styling or design tokens;
- pixel-level wireframes;
- physical database schemas;
- API payloads or routing frameworks;
- deployment topology;
- Knowledge Platform ontology;
- model-provider implementation;
- moderation staffing policy or service-level agreement;
- or the final Pilot Protocol.

## 3. Relationship to Other Documents

### Depends on

- Document 0 — Platform Ecosystem Architecture v1.2
- Document 1 — Project Definition & Vision v2.1
- Document 2 — Conceptual & Evidence Framework v2.1
- Document 3 — Intervention Map v2.3
- Document 4 — User Roles & Permission Model v3.0
- Document 5 — Ability-Adaptive UX Principles v2.1
- Document 6 — Core Product Modules v3.1
- Document 8 — Core Domain Model & Ubiquitous Language v3.2
- Batch 2 Handbook Consistency Review v1.0

### Provides input to

- Document 9 — Evidence & Knowledge Integration Architecture
- Document 10 — AI Companion Architecture
- Document 11 — Research & Evaluation Framework
- Document 12 — Data & Interoperability Architecture
- Documents 13–17 — Technical Architecture
- Document 18 — MVP Scope & Delivery Roadmap v1.2
- Document 19 — Initial Pilot Research Protocol v1.2
- Document 20 — UX Flows & Design System Specification v1.2
- Appendix A — Architecture Traceability Matrix
- Appendix D — Document Status Register

### MVP Scope Authority Note

Document 6 v3.1 and Document 8 v3.2 define the approved expanded MVP scope for **Life Story and Personal Archive**, governed Community capabilities, and **opt-in Open Matching**. Documents 18 v1.2, 19 v1.2 and 20 v1.2 are aligned with this scope. Any future change to these capabilities requires Information Architecture revalidation rather than an implicit change of authority.

---

# Part I — Information Architecture Principles

## 4. Task and Decision Centred

Information is organised around meaningful tasks, decisions, intervention activities, and research workflows rather than technical services or database structure.

## 5. Permission-Scoped, Not Role-Hard-Coded

Role creates a candidate experience, but navigation, discovery, actions, fields, and counts are filtered by relationship, consent, purpose, context, specific permission, and Resource State.

## 6. Participant Control

Participant-facing information spaces make consent, visibility, sharing, matching, contribution, withdrawal, block, report, export, correction, and help controls understandable and reachable.

## 7. Stable Mental Models

The same domain object uses the same canonical name, state, source, and placement across workspaces. UX aliases may be simpler but must map explicitly to the domain model.

## 8. Workspace Before Menu

A workspace is a purpose-specific information environment with owned tasks, read models, history, and actions. It is not merely a navigation tab.

## 9. Read Composition, Not Ownership Leakage

A workspace may compose permitted information from multiple modules, but actions route to the owning module and do not grant cross-domain write authority.

## 10. Progressive Disclosure

The interface presents the minimum information needed for the current decision, with detail, provenance, methodology, history, and governance available on demand.

## 11. Evidence in Context

Evidence, uncertainty, source, applicability, conflicts, and Evidence Decisions appear beside the Protocol, intervention, outcome, measurement, AI output, or finding they inform.

## 12. Clear Source and Authorship Boundaries

Participant testimony, Supporter contribution, researcher-authored content, imported data, Knowledge Platform evidence, calculated values, AI inference, AI draft, and human-approved decisions remain visually distinguishable.

## 13. Public Does Not Mean Unrestricted

Private, Selected People, Connections, Community, Platform Public, and Internet Public are separate audience scopes with separate disclosure and reuse implications.

## 14. Open Matching Does Not Mean Automatic Connection

Matching is opt-in, explainable, dismissible, block-aware, and requires mutual acceptance before a private Connection or direct communication is activated.

## 15. Safety and Moderation Are Distinct

Reporting, moderation, Safety Signals, Safety Events, privacy incidents, and technical incidents use related but separate information flows and authority.

## 16. AI Is Contextual and Subordinate

The AI Companion appears at defined tasks and resources. It does not become a universal navigation authority or a substitute for human approval.

## 17. Ability-Adaptive and Semantically Equivalent

Navigation density, wording, modality, sequencing, and assistance may adapt, but permissions, choices, intervention meaning, measurement meaning, and state transitions remain unchanged.

## 18. State and Version Explicitness

Lifecycle state, operational phase, version state, review task, approval decision, scientific direction, visibility, moderation state, and publication state are presented separately.

## 19. Reversibility and Recovery

People can pause, go back, save progress, undo low-risk actions, revise sharing, disconnect, block, report, withdraw, and recover from errors without losing context.

## 20. Meaningful Connection Over Engagement Maximisation

Social and matching surfaces prioritise human connection, safety, accessibility, fairness, and intervention purpose rather than time-on-platform, reaction volume, or compulsive return.

## 21. Canonical Permission Rule

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

Permission applies to discovery as well as action. The platform must not reveal protected existence through navigation labels, counts, URLs, recent items, search suggestions, AI summaries, or notification previews.

## 22. Canonical Information Sequence

```text
Healthy Aging Challenge
        ↓
Evidence and Theory
        ↓
Research Question and Protocol
        ↓
Intervention Configuration
        ↓
Participant Consent and Enrolment
        ↓
Delivery, Life Story, Community and Matching
        ↓
Assessment, Safety and Moderation
        ↓
Dataset and Analysis
        ↓
Research Finding
        ↓
Intervention Decision
        ↓
Reporting and External Submission
```

---

# Part II — Global Information Architecture

## 23. Application Shell

The platform shell may include:

- workspace switcher;
- context title and breadcrumb;
- primary navigation;
- contextual secondary navigation;
- global or scoped search entry;
- tasks and review queue;
- notifications and messages;
- AI Companion contextual entry;
- help, safety, and report entry;
- adaptation and accessibility controls;
- account and active-role context;
- organisation and Research Project context where applicable;
- and system or degraded-state indicators.

## 24. Workspace Switcher

A person may have access to several workspaces. The switcher shows only currently available workspaces and identifies the active context.

| Workspace | Primary Purpose | Typical Actors |
|---|---|---|
| Participant | Participation, activities, assessments, consent, data, help | Participant |
| Life Story | Create, organise, review, share, export, and manage legacy preferences | Participant; invited contributor |
| Community | Community spaces, public content, discovery, connections, reports | Participant; eligible community actor |
| Matching | Opt-in preferences, candidates, explanations, decisions, introductions | Participant |
| Supporter | Invitations, permissions, assigned activities, contributions, observations | Supporter |
| Research Project | Question, evidence, Protocol, enrolment, delivery, findings | Researcher; Research Coordinator; approver |
| Intervention Portfolio | Intervention definitions, versions, configuration, decisions | Researcher; intervention owner; reviewers |
| Evidence | Knowledge search, Evidence Review, Evidence Decision, snapshots | Researcher; Evidence Reviewer |
| Safety | Safety Signal triage, Safety Events, actions, stopping rules | Safety Reviewer; authorised research roles |
| Moderation | Reports, content, actors, cases, actions, appeals, rules | Moderator; Privacy or Safety Reviewer where assigned |
| Data and Analysis | Dataset, quality, lock, Analysis Plan, runs, interpretation, findings | Researcher; analyst; approver |
| Administration | Organisation, users, roles, integrations, AI configuration, audit | Organisation Administrator; System Administrator |

## 25. Navigation Generation

```text
Authenticated Actor
        ↓
Active Role and Scope
        ↓
Active Organisation / Research Project / Participant Context
        ↓
Relationship and Consent
        ↓
Purpose and Specific Permission
        ↓
Resource State and Safety Restrictions
        ↓
Available Workspaces
        ↓
Available Navigation Items
        ↓
Available Actions and Fields
```

Navigation should be generated from a permission-aware capability model rather than a hard-coded role menu.

## 26. Navigation Item States

| State | Meaning | Presentation |
|---|---|---|
| Available | The actor may enter and perform at least one permitted task | Normal navigation item |
| Read Only | The actor may view but not change | Visible with read-only indicator where useful |
| Action Required | A permitted task requires attention | Count or badge without protected detail |
| Restricted | The actor knows the area exists but lacks current permission | Shown only when explanation is appropriate |
| Hidden | Disclosure of the area's existence is not permitted | Not rendered |
| Unavailable | Capability is not configured or is degraded | Shown only when useful with reason and alternative |
| Suspended | Resource state blocks action | Visible with state explanation and next step |

## 27. Primary Navigation Groups

The application may use the following top-level groups, displayed dynamically:

| Group | Representative Areas |
|---|---|
| Home | Today, tasks, invitations, due items, recent safe context |
| My Participation | Project information, consent, enrolment, activities, assessments, progress, withdrawal |
| Life Story | Archive, timeline, collections, drafts, contributions, sharing, export, legacy |
| Community | Spaces, posts, people, public profile, community activity |
| Matches and Connections | Preferences, candidates, explanations, requests, connections, blocked actors |
| Messages | Permitted direct and group communication |
| Research | Projects, Protocols, Participants, delivery, findings |
| Interventions | Portfolio, versions, configuration, assignments |
| Evidence | Knowledge search, reviews, decisions, snapshots, gaps |
| Safety and Moderation | Signals, events, reports, cases, appeals, rules |
| Data and Analysis | Datasets, quality, analysis, interpretation, findings |
| Administration | Organisations, users, roles, integrations, AI configuration, audit, health |

## 28. Product Module to Information Space Map

| Module | Product Module | Primary Information Space |
|---|---|---|
| M01 | Identity and Organisation Administration | Administration |
| M02 | Participant Profile and Preferences | Participant; My Information |
| M03 | Relationship, Consent and Permission | My Choices and Sharing; Supporter Permissions; Governance |
| M04 | Research Project and Protocol | Research Project |
| M05 | Recruitment, Screening and Enrolment | Research Project Operations; My Participation |
| M06 | Intervention Portfolio and Configuration | Intervention Portfolio |
| M07 | Intervention Delivery | My Activities; Delivery |
| M08 | Assessment, Observation and Outcome | Assessments and Outcomes |
| M09 | Safety and Escalation | Help and Safety; Safety Workspace |
| M10 | Evidence Workspace and Knowledge Integration | Evidence |
| M11 | AI Companion | Contextual AI entry points across permitted workspaces |
| M12 | Dataset and Data Quality | Data and Analysis |
| M13 | Analysis, Interpretation and Findings | Data and Analysis; Findings |
| M14 | Reporting and External Submission | Reports and Submissions |
| M15 | Governance and Audit | Review Queues; Governance; Audit |
| M16 | Integration and Operations | Administration; System Health |
| M17 | Life Story and Personal Archive | Life Story |
| M18 | Community, Social Connection and Open Matching | Community; Matching; Connections; Moderation |

The map identifies the primary information space, not exclusive appearance. Cross-module summaries are permission-scoped read models, and all mutations route to the owning module.

## 29. Contextual Action Area

- Shows actions permitted for the current resource and state.
- Uses specific labels such as `Submit for Review`, `Pause Matching`, or `Withdraw Sharing` rather than generic `Continue` where meaning matters.
- Separates draft creation, publication, sending, approval, and execution.
- Explains why an action is unavailable when disclosure is appropriate.
- Requires confirmation or step-up authentication according to action risk.
- Never allows AI-generated availability to override domain policy.

## 30. Breadcrumbs and Context

- Breadcrumbs reflect conceptual hierarchy, not raw URL structure.
- Protected ancestor names are omitted when the actor lacks discovery permission.
- Current Research Project, Participant, Protocol Version, Intervention Version, Community Space, or moderation context is visible where relevant.
- Version and state should appear near the resource title rather than being hidden in history.
- A person should be able to distinguish `My Participant workspace` from `Participant record viewed as a Researcher`.

## 31. Home and Today

Home is a role- and context-adaptive summary, not an unrestricted cross-platform dashboard.

- shows permitted tasks, invitations, due activities, reviews, reports, or follow-ups;
- uses minimum necessary detail;
- does not display sensitive content in shared-device previews;
- provides direct access to pause, help, safety, block, or withdrawal where applicable;
- avoids vanity engagement metrics;
- and remains usable when AI or Knowledge Platform services are unavailable.

---

# Part III — Actor and Workspace Architecture

## 32. Participant Workspace

The Participant Workspace is organised around current participation, personal control, meaningful activities, and safety rather than research administration.

| Primary Area | Contents |
|---|---|
| Today | Current activity, assessment, invitation, message, connection, or required decision |
| My Participation | Project introduction, Protocol summary, Enrolment state, current intervention |
| My Choices and Consent | Consent decisions, restrictions, history, re-consent, withdrawal |
| My Activities | Assignments, sessions, preparation, completion, adaptation |
| Life Story | Archive and selected recent Life Story items |
| Community | Community spaces, posts, public profile, discovery |
| Matches | Matching opt-in, preferences, candidates, explanations, decisions |
| Connections | Connection requests, accepted connections, muted and blocked actors |
| Messages | Permitted direct and group communication |
| Assessments | Due, in-progress, completed, declined, and follow-up assessments |
| My Data and Sharing | Data use, exports, visibility, sharing, corrections, retention information |
| Help and Safety | Help, pause, report, block, concern, urgent guidance, withdrawal |

Research complexity is progressively disclosed. Participants may view plain-language evidence, Protocol, data use, and findings without being forced through researcher-oriented terminology.

## 33. Participant Simplified Navigation

```text
Today
My Activities
Life Story
Community
Connections
Messages
My Choices
Help
```

Simplified mode changes density and language, not access, meaning, consent options, visibility controls, or safety routes.

## 34. Supporter Workspace

| Area | Contents |
|---|---|
| Home | Invitations, permitted tasks, expiring access, required acknowledgement |
| Relationship and Permissions | Relationship state, purpose, specific permissions, restrictions, expiry |
| Shared Activities | Only assigned or explicitly shared intervention activities |
| Life Story Contributions | Invitations, proposed contributions, attribution, Participant decisions |
| Observations | Protocol-permitted observations with source labels |
| Messages | Permitted communication |
| Reports and Safety | Report concern, harassment, privacy issue, or Safety Signal |
| Access History | Current and historical access decisions visible where appropriate |

- The workspace does not contain default `Shared Progress` or unrestricted Participant history.
- A Supporter cannot see private Life Story items, matches, messages, assessments, or outcomes unless specifically authorised.
- Supporter-assisted mode must show whose decision is being recorded.
- Revoked, expired, or restricted access changes navigation promptly.

## 35. Professional Caregiver Workspace

| Area | Contents |
|---|---|
| Assigned Participants | Only current organisation- and purpose-scoped assignments |
| Tasks | Approved delivery, assistance, observation, or follow-up tasks |
| Intervention Delivery | Assigned sessions, components, adaptation, fidelity |
| Observations | Source-labelled observations permitted by Protocol and consent |
| Safety | Report Safety Signal and view assigned safety instructions |
| Messages | Approved communication |
| Evidence | Task-relevant evidence summaries where permitted |

There is no baseline `Clinical Notes` area. Clinical capability requires separately approved clinical scope and governance.

## 36. Researcher Workspace

The Researcher experience is organised primarily by Research Project and governed artefact lineage.

```text
Projects
    └── Research Project
            ├── Overview
            ├── Research Questions
            ├── Evidence
            ├── Protocol
            ├── Intervention Configuration
            ├── Recruitment and Enrolment
            ├── Participants
            ├── Delivery
            ├── Life Story and Community Exposure
            ├── Assessments and Outcomes
            ├── Safety and Moderation Summary
            ├── Datasets
            ├── Analysis
            ├── Interpretation
            ├── Research Findings
            ├── Reports and Submissions
            └── Governance
```

Researcher access remains project-, purpose-, role-, and resource-state scoped. Participant discovery and field visibility are permission-filtered.

## 37. Research Coordinator Workspace

| Area | Contents |
|---|---|
| Project Operations | Current phase, recruitment, enrolment, assignments, due tasks |
| Invitations and Screening | Invitation status, screening workflow, Eligibility Decision tasks |
| Consent and Re-Consent | Presentation status, decisions, restrictions, follow-up |
| Participants | Permitted operational summary |
| Scheduling | Intervention, assessment, community, and follow-up schedules |
| Supporters | Relationship invitations, permission state, expiry |
| Safety and Reports | New reports, Safety Signals, escalation tasks |
| Data Quality Tasks | Missing operational records and correction requests |

## 38. Reviewer Workspaces

| Reviewer | Primary Queue |
|---|---|
| Research Approver | Research Project, Protocol Version, Analysis Plan, Interpretation, Research Finding |
| Evidence Reviewer | Evidence Review, Evidence Decision, Evidence Snapshot |
| Safety Reviewer | Safety Signals, Safety Events, stopping rules, actions |
| Privacy Reviewer | Sensitive data use, public visibility, Internet Public, export, retention, external sharing |
| Moderator | User reports, content reports, Moderation Cases, actions, appeals |

Review queues show Review Request state separately from the governed artefact's state.

## 39. Organisation Administrator Workspace

- Organisation profile and settings;
- Organisation Memberships;
- scoped Role Assignments;
- community configuration within organisation scope;
- approved integration configuration;
- notification and content-policy configuration;
- operational audit and access review;
- without default Participant, research, safety, moderation-evidence, or Life Story content access.

## 40. System Administrator Workspace

- system health and degraded states;
- integration health and queues;
- background jobs and failures;
- model gateway and AI operational status;
- storage and delivery status;
- service accounts;
- technical audit references;
- without default access to Participant content or research authority.

---

# Part IV — Research and Intervention Information Architecture

## 41. Research Project Workspace

| Section | Primary Objects and Decisions |
|---|---|
| Overview | Project identity, purpose, state, phase, owners, next actions |
| Research Questions | Question statement, population, context, outcomes, state |
| Evidence | Evidence Review, Knowledge References, decisions, snapshots, gaps |
| Protocol | Protocol identity, versions, review, approval, amendment lineage |
| Intervention Configuration | Exact Intervention Versions, dose, sequence, AI, safeguards |
| Recruitment and Enrolment | Invitations, screening, Eligibility Decisions, consent readiness, Enrolments |
| Participants | Permission-scoped Participant list and operational state |
| Delivery | Assignments, sessions, exposure, adaptations, fidelity, deviations |
| Life Story and Community | Intervention exposure, sharing scope, matching and moderation summaries—not private content by default |
| Assessments and Outcomes | Schedules, completion, missingness, scores, Outcome Records |
| Safety | Safety Signal and Event summaries within authority |
| Datasets | Definitions, versions, quality, lock, lineage |
| Analysis | Plans, runs, outputs, diagnostics |
| Interpretation and Findings | Interpretation Records, Findings, approval, limitations |
| Reports and Submission | Reports, exports, Evidence Packages, External Submissions |
| Governance | Review Requests, approvals, conditions, conflicts, audit |

## 42. Research Project Overview

- shows lifecycle state and operational phase separately;
- identifies the current Approved or Active Protocol Version;
- identifies the active Intervention Configuration;
- shows recruitment, delivery, safety, dataset, and finding readiness summaries;
- shows blockers without disclosing unauthorised content;
- provides lineage links from question through finding;
- and avoids presenting activity counts as scientific conclusions.

## 43. Protocol Information Architecture

```text
Protocol
    ├── Version History
    ├── Draft Version
    ├── Review Requests
    ├── Approved Versions
    ├── Active Version
    ├── Amendments
    ├── Re-Consent Impact
    └── Operational Transition
```

- The current version and state are visible.
- Approved content is read-only.
- Material amendment creates a new Protocol Version.
- Internal review, external ethics reference, version state, and Research Project phase are displayed separately.
- Participant-facing Protocol summary is a governed projection, not a separate untracked document.

## 44. Intervention Portfolio Workspace

| Section | Contents |
|---|---|
| Summary | Stable identity, canonical name, domains, owner, lifecycle maturity |
| Versions | Draft, In Review, Approved, Active, Suspended, Superseded, Retired |
| Evidence | Evidence Status, Evidence Direction, Knowledge References, decisions |
| Mechanisms and Outcomes | Mechanism and Outcome Definition references |
| Components and Dose | Sequence, delivery, human role, AI role |
| Adaptation and Accessibility | Approved adaptation range and fidelity implications |
| Risk and Safeguards | Burden, risks, stopping and pause rules |
| Configurations | Research Project-specific compositions |
| Evaluation History | Research Findings and limitations |
| Intervention Decisions | Retain, Revise, Restrict, Replicate, Expand, Suspend, Retire, Continue Research |

## 45. Intervention Delivery Workspace

- organised by assignment and session, not by generic plan;
- shows exact Protocol, Intervention, configuration, and AI versions;
- separates planned, offered, received, completed, skipped, failed, and declined states;
- shows exposure, adaptation, fidelity, and deviation separately;
- includes pause, safety, consent, and withdrawal effects;
- and does not label delivery completion as effectiveness.

## 46. Assessment and Outcome Workspace

| Area | Contents |
|---|---|
| Schedule | Instrument, version, timepoint, due window, adaptation |
| Administration | Available, In Progress, Completed, Partially Completed, Declined, Expired |
| Responses | Source, capture mechanism, assistance, confirmation |
| Scores | Algorithm version, calculation, quality |
| Observations | Source-labelled facts and narrative |
| Outcome Records | Definition, value, timepoint, source, quality |
| Missingness | Explicit missing-data reason |
| Invalidation | Reason, history, replacement where applicable |

## 47. Data, Analysis and Finding Workspace

```text
Dataset Definition
        ↓
Dataset Version
        ↓
Quality Review
        ↓
Dataset Lock
        ↓
Analysis Plan
        ↓
Analysis Run
        ↓
Analysis Output
        ↓
Interpretation Record
        ↓
Research Finding
        ↓
Intervention Decision
```

Each step has its own state, owner, version, review, and approval presentation. External submission appears after local Finding approval and does not become a Finding state.

---

# Part V — Life Story and Personal Archive Information Architecture

## 48. Life Story Workspace

```text
Life Story
    ├── Home
    ├── Archive
    ├── Timeline
    ├── Collections
    ├── Drafts
    ├── Contributions
    ├── Shared
    ├── Public
    ├── Exports
    ├── Legacy Preferences
    ├── Hidden and Withdrawn
    └── Help and Safety
```

## 49. Life Story Home

- recent Participant-approved items;
- drafts needing review;
- contributions awaiting Participant decision;
- sharing or visibility changes requiring confirmation;
- sensitive-topic or moderation notices;
- export status;
- legacy-preference status;
- and intervention prompts that are optional and skippable.

## 50. Archive Organisation

| View | Purpose |
|---|---|
| All Items | Permission-scoped archive list |
| Timeline | Life periods and dated entries without requiring exact dates |
| Collections | Participant-created themes such as work, family, music, places, recipes |
| People | Participant-defined people references with privacy controls |
| Places | Participant-defined place references without exposing precise location by default |
| Media | Photos, audio, video, documents, captions |
| Values and Traditions | Identity, values, customs, beliefs, practices |
| Drafts | Unconfirmed or AI-assisted wording |
| Contributions | Attributed external proposals awaiting decision |

## 51. Life Story Item Page

| Tab or Section | Contents |
|---|---|
| Story | Confirmed content, media, transcript, captions |
| About | Theme, life period, people, place, source, testimony status |
| Attribution | Participant, contributor, transcriber, translator, AI assistance |
| Sharing | Audience, visibility, download, quotation, re-sharing, expiry |
| Community Use | Posts or community references using the item |
| Research Use | Consent scope, Dataset references, withdrawal limitations |
| History | Revisions, visibility changes, contributions, moderation |
| Export and Legacy | Export inclusion and Legacy Preference |

## 52. Life Story Creation Flow

```text
Choose Prompt or Start Freely
        ↓
Text / Voice / Photo / Video / Document
        ↓
Optional AI Transcription or Organisation
        ↓
Draft Clearly Labelled
        ↓
Participant Review and Correction
        ↓
Confirm as Participant Testimony or Other Attributed Content
        ↓
Choose Visibility and Reuse
        ↓
Save Private or Publish to Selected Audience
```

## 53. Contribution Flow

```text
Contributor Invitation
        ↓
Contribution Draft with Attribution
        ↓
Participant Review
        ├── Accept
        ├── Accept with Edits
        ├── Reject
        ├── Request Change
        └── Save Separately
        ↓
Participant Controls Final Item and Visibility
```

## 54. Life Story Visibility

| Visibility | Audience | Default Reuse |
|---|---|---|
| Private | Participant and explicitly authorised operational actors | No external reuse |
| Selected People | Named actors with active grants | No re-sharing unless enabled |
| Connections | Eligible current Connections | No download or re-sharing by default |
| Community | Members of selected Community Spaces | Community display only by default |
| Platform Public | Eligible platform users | No Internet indexing by default |
| Internet Public | External Internet | Separate consent and disclosure required |

Visibility, download, quotation, re-sharing, AI context use, model training, research use, and external publication are separate choices.

## 55. Life Story Sensitive Topics

- show clear topic warning when appropriate;
- allow skip, pause, hide, restrict, or seek support;
- avoid assuming trauma, diagnosis, or capacity;
- allow the Participant to remove AI suggestions;
- route concern to Safety Signal or privacy review only when criteria are met;
- and do not require completion for ordinary platform access unless the Protocol explicitly and ethically requires a defined component.

## 56. Life Story Export and Legacy

- Export identifies selected items, format, recipient, purpose, reuse, and expiry.
- Internet Public publication is not treated as a normal export.
- Legacy Preference is visible, versioned, revisable, and separate from family relationship.
- Posthumous access, memorialisation, transfer, retention, deletion, and restriction are separate instructions.
- Conflicts with research retention, legal obligations, or prior external publication require explanation.

---

# Part VI — Community, Social Connection and Open Matching Information Architecture

## 57. Community Workspace

```text
Community
    ├── Home
    ├── Spaces
    ├── Discover
    ├── People
    ├── Posts
    ├── My Public Profile
    ├── My Contributions
    ├── Connections
    ├── Matching
    ├── Blocked and Muted
    ├── Reports
    └── Community Rules
```

## 58. Community Home

- shows selected Community Spaces and meaningful current opportunities;
- prioritises intervention or Participant goals rather than infinite engagement;
- avoids endless autoplay and deceptive urgency;
- shows why a space, post, or person is displayed when useful;
- includes accessible filters and a chronological or goal-based option;
- and keeps block, report, visibility, and safety actions reachable.

## 59. Public Profile

| Section | Participant-Controlled Content |
|---|---|
| Identity | Preferred name, optional photo or avatar |
| About | Participant-written introduction |
| Interests | Declared interests chosen for discovery or matching |
| Languages and Communication | Participant-selected preferences |
| Community Memberships | Only memberships chosen for display |
| Life Story Highlights | Explicitly shared Life Story references |
| Availability | Broad availability, not precise routine by default |
| Connection Preference | What kinds of human interaction are welcome |
| Safety Controls | Who may request connection or send messages |

Protected Participant Profile, consent, assessments, Safety Events, research status, precise address, and private Life Story data are not Public Profile fields by default.

## 60. Community Space

| Area | Contents |
|---|---|
| About | Purpose, eligibility, audience, organisation, intervention link |
| Rules | Current Community Rule Version and change history |
| Posts | Content filtered by visibility and moderation state |
| People | Members visible according to membership and profile settings |
| Activities | Approved conversations, events, prompts, or intervention activities |
| Moderation | How to report, expected handling, appeal |
| Safety and Privacy | Boundaries, emergency limitations, visibility explanation |

## 61. Social Post Information Architecture

| Element | Requirement |
|---|---|
| Author | Identity or approved pseudonym with accountability |
| Audience | Selected People, Connections, Community, Platform Public, or Internet Public |
| Source | Original, Life Story reference, imported, AI-assisted draft |
| Content | Text, media, link, question, invitation, or activity update |
| Reuse | Quotation, download, re-sharing, translation, external publication |
| State | Draft, Published, Hidden, Restricted, Removed, Deleted, Archived, Restored |
| Moderation | Report status and action where disclosure is appropriate |
| Research Use | Separate consent and purpose, not inferred from publication |

## 62. Feed and Ranking

- supports chronological, community, interest, connection, or intervention-purpose views;
- does not use hidden sensitive traits without separately approved consent and governance;
- does not rank solely for reactions, controversy, time, or emotional dependency;
- provides an explanation or control over major ranking inputs where feasible;
- allows hide, mute, unfollow, block, and report;
- preserves accessible alternatives to dense feed interaction;
- and records exposure where the feed is an intervention component.

## 63. Open Matching Workspace

```text
Matching
    ├── Matching Status
    ├── My Goals
    ├── Interests
    ├── Languages
    ├── Communication Preferences
    ├── Availability
    ├── Location Boundary
    ├── Exclusions
    ├── Match Candidates
    ├── Match Explanations
    ├── Decisions
    ├── Introductions
    └── Matching History
```

## 64. Matching Opt-In

Matching is inactive by default. Activation requires a clear explanation of:

- the matching purpose;
- who may appear as a candidate;
- which declared attributes may be used;
- which attributes are prohibited or excluded;
- how location is generalised;
- how Match Explanations work;
- how long candidates remain active;
- when direct messaging becomes available;
- how to dismiss, pause, block, report, or leave matching;
- and what data may enter research evaluation.

## 65. Match Candidate Card

| Element | Requirement |
|---|---|
| Identity | Only fields permitted for candidate discovery |
| Shared Basis | Main declared interests, goals, language, mode, or availability |
| Match Explanation | Understandable reason for the candidate |
| Uncertainty or Limits | Missing or approximate information |
| Safety State | Block and eligibility checks applied without revealing protected detail |
| Decision | Interested, Not Now, Dismiss, Block, Report |
| No Implied Connection | Candidate status clearly distinguished from Connection |

## 66. Connection Flow

```text
Match Candidate or Connection Request
        ↓
First Actor Indicates Interest
        ↓
Second Actor Reviews
        ↓
Mutual Acceptance
        ↓
Controlled Introduction
        ↓
Connection Active
        ↓
Message / Activity / Community Interaction
        ↓
Mute / Pause / Disconnect / Block / Report
```

## 67. Connections Workspace

- active Connections;
- pending requests;
- introductions awaiting response;
- paused Connections;
- muted actors;
- disconnected history where appropriate;
- blocked actors in a protected control area;
- and relationship conversion only through a separate Supporter or other governed relationship workflow.

## 68. Direct Messaging

- available only after applicable mutual acceptance, community rule, or explicit permission;
- drafting and sending are separate actions;
- AI may draft or translate but does not impersonate the Participant;
- visibility, block, mute, and reporting controls apply;
- sensitive previews are minimised;
- message deletion does not necessarily erase recipient copies or governed audit;
- and messaging is not an emergency service.

## 69. Community Metrics

The interface distinguishes:

| Metric Type | Examples | Interpretation |
|---|---|---|
| Process | posts shown, matches generated, messages sent | Operational only |
| Engagement | community visits, reactions, replies | Not a Healthy Aging outcome by itself |
| Connection | mutual connections, meaningful conversations, continuity | Requires approved definition |
| Experience | belonging, satisfaction, burden, rejection, privacy concern | Measured through approved instruments or questions |
| Safety and Equity | reports, blocks, harassment, discrimination, unequal match exposure | Governed outcome or monitoring data |
| Intervention Fidelity | matching explanation shown, mutual acceptance, safeguards applied | Protocol-linked |

---

# Part VII — Search, Discovery, Evidence and AI Information Architecture

## 70. Search Domains

| Search Domain | Contents | Boundary |
|---|---|---|
| My Information Search | Participant's own activities, Life Story, messages, consent | Participant self-access and item visibility |
| Platform Record Search | Projects, Participants, Protocols, interventions, datasets, findings | Permission and existence protection |
| Community Discovery | Public Profiles, Community Spaces, Social Posts | Visibility, block, moderation, eligibility |
| Matching Discovery | Match Candidates generated by policy | Not a general people-search endpoint |
| Knowledge Search | Knowledge Platform resources and claims | External authority and provenance |
| Moderation Search | Reports, cases, affected content | Moderator assignment and minimum necessary evidence |
| Administration Search | Users, organisations, roles, integrations | Administrative scope without Participant content |

## 71. Search Result Separation

```text
Search Results
    ├── Research Platform Records
    ├── My Participant-Controlled Content
    ├── Community and Platform-Public Content
    ├── Knowledge Platform Resources
    ├── External Documents
    └── AI Suggestions
```

Result groups use distinct source labels and must not imply that AI suggestions or community content are authoritative evidence.

## 72. Search Permission Sequence

```text
Query Submitted
        ↓
Search Purpose and Context Established
        ↓
Candidate Sources Selected
        ↓
Permission, Visibility, Block, Consent and Resource-State Filters
        ↓
Existence Protection
        ↓
Ranking within Permitted Set
        ↓
Result Presentation with Source and State
```

## 73. Search Suggestions and Recent Items

- must be permission-filtered before display;
- must not reveal protected names or counts;
- must remove or invalidate items after revocation, withdrawal, block, role change, or project exit;
- should identify Community or Platform Public content distinctly;
- and should not expose moderation or safety status to unauthorised actors.

## 74. Evidence Workspace

```text
Research Question or Decision Context
        ↓
Knowledge Search
        ↓
Knowledge Platform Results
        ↓
Knowledge Reference Selection
        ↓
Evidence Review
        ↓
Evidence Decision
        ↓
Evidence Snapshot
        ↓
Protocol / Intervention / Measurement Decision
```

## 75. Evidence Result Card

| Element | Requirement |
|---|---|
| Resource | Claim, theory, mechanism, outcome, measurement, source |
| Authority | Healthy Aging Knowledge Platform |
| Identifier and Version | External identifier and resolved version |
| Source | Citation and provenance |
| Evidence Quality | Quality or verification state where available |
| Direction | Beneficial, null, harmful, mixed, uncertain where applicable |
| Population and Context | Directness and applicability |
| Uncertainty and Conflict | Visible rather than hidden |
| Retrieved At | Timestamp and capability state |
| Local Use | Attached Evidence Review, Decision, Snapshot, or gap |

## 76. Knowledge Platform Capability States

| State | Presentation |
|---|---|
| Available | Normal capability |
| Partial | Available with stated limitations |
| Unavailable | Unavailable with manual alternative |
| Degraded | Cached or snapshot-based access with freshness warning |
| Planned | Not presented as a current function |

## 77. AI Companion Entry Points

| Context | Representative AI Assistance |
|---|---|
| Research Question | Clarify or draft question |
| Evidence | Retrieve, summarise, compare, draft evidence table |
| Protocol | Draft or explain sections |
| Intervention | Draft components or adaptation explanation |
| Participant Home | Explain current task or navigate |
| Life Story | Prompt, transcribe, organise, translate, draft |
| Community | Draft, translate, explain audience or rules |
| Matching | Explain candidate and draft introduction |
| Assessment | Explain item or support permitted capture |
| Safety | Raise Safety Signal or request human help |
| Moderation | Summarise report or suggest triage under human authority |
| Data and Analysis | Draft code, documentation, or interpretation for review |

## 78. AI Response Structure

| Section | Purpose |
|---|---|
| Answer or Draft | The primary helpful output |
| Source Type | Platform fact, Knowledge Platform evidence, user information, AI inference, suggestion, draft |
| Sources | References and retrieval state |
| Uncertainty | Limitations, missing information, provisional status |
| Action | Optional proposed action with confirmation requirements |
| Review | Human review requirement and accountable role |
| Memory | Whether information may be remembered and how to control it |

## 79. AI Information Boundaries

- Permission is evaluated before context assembly.
- AI context excludes private Life Story, matching, message, safety, or moderation data unless required and permitted.
- AI-generated wording remains Draft until confirmed.
- AI may not invent Participant Testimony.
- AI may not autonomously connect people, send messages, publish content, ban users, confirm Safety Events, or approve findings.
- AI output, source, action, review, and safety classifications remain separate.
- Core workflows remain available when AI is unavailable.

---

# Part VIII — Safety, Reporting and Moderation Information Architecture

## 80. Universal Report and Help Entry

Participant-facing community, matching, messaging, Life Story, intervention, and assessment surfaces provide a reachable `Report`, `Get Help`, or `Safety` action appropriate to context.

- Report actor or behaviour;
- Report content;
- Report privacy concern;
- Report unwanted contact;
- Report discrimination or harassment;
- Report suspected fraud or impersonation;
- Report distress or intervention concern;
- request human help;
- block or disconnect immediately where available;
- and show emergency-service limitations clearly.

## 81. Report Classification

| Report Type | Primary Destination |
|---|---|
| Content or community-rule violation | Moderation Case |
| Unwanted contact, harassment, impersonation | Moderation Case; possible Safety Signal |
| Intervention-related distress or harm | Safety Signal |
| Privacy or data-sharing concern | Privacy review; possible Moderation Case |
| Technical failure | Operational incident |
| Immediate emergency | External emergency guidance; platform escalation if configured |

Classification may create more than one linked record, but the records and authorities remain distinct.

## 82. Safety Workspace

```text
Safety
    ├── New Signals
    ├── Awaiting Triage
    ├── In Review
    ├── Escalated
    ├── Safety Events
    ├── Safety Actions
    ├── Stopping Rules
    ├── Monitoring
    ├── Resolved
    └── Closed
```

## 83. Moderation Workspace

```text
Moderation
    ├── New Reports
    ├── Awaiting Triage
    ├── In Review
    ├── Content
    ├── Actors
    ├── Urgent Restrictions
    ├── Decisions and Actions
    ├── Appeals
    ├── Restorations
    ├── Community Rules
    └── Audit
```

## 84. Moderation Case Page

| Section | Contents |
|---|---|
| Summary | Report category, priority, state, assigned reviewer |
| Reported Object | Content, actor, Match Candidate, message, profile, or Life Story reference |
| Evidence | Minimum necessary permitted context |
| History | Prior reports and actions where permitted |
| Related Risks | Safety, privacy, fraud, discrimination, coercion |
| Decision | Dismiss, warn, restrict, hide, remove, suspend, disconnect, ban, restore, escalate |
| Action | Effective scope, duration, reason, notification |
| Appeal | Submission, reviewer, outcome, restoration |
| Audit | Human and AI assistance, policy version, timestamps |

## 85. Block, Mute and Disconnect

| Control | Effect |
|---|---|
| Mute | Suppress selected content or notifications without necessarily ending Connection |
| Pause Connection | Temporarily restrict interaction according to policy |
| Disconnect | End the active Connection and private interaction basis |
| Block (`BlockRecord`) | Override discovery, matching, requests, interaction, follow, notification, and communication according to policy |
| Report | Create a governed report independent of block or disconnect |

## 86. Moderation Decision Presentation

- uses plain-language reason and rule reference;
- distinguishes temporary from permanent action;
- identifies affected content, community, feature, or account scope;
- provides appeal route where applicable;
- does not reveal reporter identity without authority;
- records AI or provider assistance as provisional;
- and links Safety Signal or privacy escalation without conflating them.

---

# Part IX — State, Version, Source and Activity Presentation

## 87. State Dimensions

| Dimension | Example |
|---|---|
| Lifecycle | Research Project Active |
| Operational Phase | Recruitment |
| Version State | Protocol Version Approved |
| Review Task | Review Request In Review |
| Review Decision | Approve with Conditions |
| Scientific Conclusion | Evidence Decision Support with Conditions |
| Scientific Direction | Research Finding Mixed |
| Visibility | Community |
| Connection | Active |
| Matching | Interested |
| Moderation | Actioned |
| External Submission | Submitted |
| External Publication | Publication reference confirmed |

## 88. Canonical State Labels

- Use `In Review` as the canonical active-review label.
- Do not use one generic status list for all resources.
- Map UI labels to exact aggregate states.
- Do not use `Final` to imply approval or lock.
- Do not use `Completed` to imply scientific success.
- Do not use `Published` without distinguishing Community, Platform Public, Internet Public, report publication, and Knowledge Platform publication.

## 89. Version Presentation

- show current version and state near the resource title;
- show effective date and supersession where relevant;
- make approved versions read-only;
- provide version comparison for Protocol, Intervention, AI configuration, Community Rules, and report versions;
- link assignments, assessments, datasets, analyses, and findings to exact versions;
- and avoid silently replacing historical content in read models.

## 90. Source and Authorship Labels

| Label | Meaning |
|---|---|
| Participant Testimony | Participant's own memory, experience, or interpretation |
| Participant Response | Explicit response supplied by Participant |
| Supporter Contribution | Attributed information supplied by Supporter |
| Staff Observation | Source-labelled observation |
| Researcher Authored | Researcher-created content |
| Knowledge Platform Evidence | Externally authoritative reference |
| Imported | External source retained |
| Calculated | Derived through identified algorithm |
| AI Draft | Generated content requiring confirmation or review |
| AI Inference | Model-derived interpretation, not fact |
| Human Approved | Approved by accountable human role |

## 91. Activity History

- shows meaningful domain actions, not every technical log;
- identifies actor, action, time, state change, and version;
- respects field-level and existence permissions;
- shows AI assistance and confirmation where relevant;
- provides audit reference without exposing unnecessary sensitive payload;
- and distinguishes item history from organisation or system audit.

## 92. Notifications

| Notification Type | Examples | Privacy Rule |
|---|---|---|
| Task | Assessment due, review assigned, contribution awaiting decision | Minimum necessary task detail |
| Consent and Permission | Re-consent, access expiry, relationship revoked | No hidden sensitive detail |
| Social | Connection request, comment, invitation | Respect block, mute, audience, shared-device settings |
| Matching | New candidate or mutual interest | No sensitive match basis in preview |
| Safety | Human response requested | Restricted delivery and escalation |
| Moderation | Content restricted, appeal update | No reporter identity by default |
| System | Service degraded, export ready | Purpose-limited |

## 93. Notification Centre

- groups notifications by task and context;
- supports read, dismiss, mute, snooze, and preference control;
- removes invalid actions after state change;
- does not use repeated urgency to pressure consent, sharing, posting, or matching;
- and provides a safe shared-device preview mode.

---

# Part X — Ability-Adaptive, Responsive and Degraded Information Architecture

## 94. Adaptation Modes

| Mode | Information Architecture Effect |
|---|---|
| Standard | Full normal hierarchy |
| Simple | Fewer top-level choices and reduced metadata |
| Step-by-Step | One meaningful decision per screen |
| High Visibility | Larger controls and simplified visual hierarchy |
| Read-Aloud | Structured headings and audio-compatible content order |
| Supporter-Assisted | Decision attribution and assistance context visible |
| Low Stimulation | Reduced motion, alerts, feed density, and visual competition |

## 95. Adaptation Invariants

- No mode hides consent choices, visibility state, block, report, help, pause, or withdrawal.
- No mode changes effective permission.
- No mode converts optional sharing or matching into a default.
- No mode changes intervention or assessment meaning without approved material-change handling.
- No inferred ability or emotional state changes rights.
- Participants can preview, override, reset, and correct adaptations.

## 96. Mobile Priorities

- Today and current activity;
- Life Story capture by voice, photo, or text;
- Community and matching decisions;
- messages and connection requests;
- assessment and reflection;
- consent and sharing controls;
- block, report, help, pause, and withdrawal;
- with researcher authoring and dense analytics reduced or redirected to larger screens where appropriate.

## 97. Tablet Priorities

- guided intervention delivery;
- Life Story media review and collaborative contribution;
- accessible community participation;
- assessment administration;
- Supporter-assisted mode;
- moderation or research review where appropriate.

## 98. Desktop Priorities

- Research Project and Protocol authoring;
- evidence review;
- Intervention Configuration;
- Participant operations;
- moderation queues;
- dataset and analysis;
- governance and administration;
- without making Participant-facing functions desktop-only.

## 99. Shared Device Mode

- minimises notification previews;
- requires explicit account or role context;
- provides rapid lock and exit;
- does not cache private Life Story, message, match, safety, or consent content unnecessarily;
- shows supporter assistance without merging identities;
- and clears temporary adaptation or task context when required.

## 100. Degraded AI State

- core navigation and workflows remain available;
- AI entry shows unavailable or limited state;
- draft, transcription, translation, or matching explanation alternatives are offered where possible;
- pending AI actions do not execute silently after recovery;
- and human help or manual workflow remains visible.

## 101. Degraded Knowledge State

- cached Knowledge References and Evidence Snapshots remain labelled with version and freshness;
- new evidence search may be unavailable;
- Protocol, consent, delivery, safety, community, matching, and withdrawal continue where safe;
- and no stale reference is presented as newly verified.

## 102. Offline and Connectivity

- clearly distinguishes saved locally, submitted, pending, failed, and synchronised states;
- protects sensitive local data;
- prevents duplicate social posts, messages, reports, and intervention records;
- supports draft Life Story capture where approved;
- does not imply that a block, report, consent withdrawal, or safety request has been received until confirmed;
- and prioritises safety and withdrawal synchronisation.

---

# Part XI — Cross-Module Information Flows

## 103. Evidence-Informed Research Design

```text
Research Question
→ Knowledge Search
→ Evidence Review
→ Evidence Decision
→ Evidence Snapshot
→ Protocol Version
→ Intervention Configuration
```

## 104. Participant Enrolment

```text
Invitation
→ Accessible Project Information
→ Screening
→ Eligibility Decision
→ Consent
→ Enrolment
→ Preferences and Supporter Choice
```

## 105. Life Story Intervention

```text
Intervention Assignment
→ Life Story Prompt or Free Capture
→ Participant Draft
→ Optional Contribution
→ Participant Review
→ Sharing Decision
→ Human Conversation or Community Use
→ Reflection and Outcome
```

## 106. Open Matching

```text
Matching Opt-In
→ Match Preferences
→ Candidate Generation
→ Match Explanation
→ Match Decision
→ Mutual Acceptance
→ Introduction
→ Connection
→ Conversation or Activity
→ Reflection, Pause, Disconnect, Block or Report
```

## 107. Social Content and Moderation

```text
Social Post or Profile
→ Audience and Visibility
→ Publication
→ Interaction
→ Optional Report
→ Moderation Case
→ Decision and Action
→ Appeal or Restoration
```

## 108. Safety

```text
Report / Assessment / Observation / AI / Rule
→ Safety Signal
→ Human Triage
→ Safety Event where confirmed
→ Safety Action
→ Participant or Project Effect
→ Monitoring and Closure
```

## 109. Research Evaluation

```text
Operational Records
→ Dataset Definition
→ Dataset Version
→ Quality Review
→ Dataset Lock
→ Analysis Plan
→ Analysis Run
→ Interpretation
→ Research Finding
→ Intervention Decision
```

## 110. External Knowledge Feedback

```text
Approved Research Finding
→ Evidence Package
→ External Submission
→ Knowledge Platform Curation
→ Accepted / Revised / Rejected / Deferred
→ External Publication Reference
```

---

# Part XII — MVP Information Architecture

## 111. MVP Objective

The MVP information architecture must support one integrated **Ability-Adaptive Social Connection, Life Story, Governed Community, and Open Matching** research cycle from Research Question to Research Finding.

## 112. MVP Primary Workspaces

| Workspace | Required MVP Areas |
|---|---|
| Participant | Today, participation, consent, activities, assessments, data and sharing, help |
| Life Story | Archive, item creation, contribution review, sharing, export, legacy preference |
| Community | PublicProfile with Platform Public Visibility, CommunitySpaces, posts, comments, Connections and reporting |
| Matching | Opt-in, preferences, candidates, explanations, decisions, introduction, block |
| Supporter | Invitation, permission review, shared activity, Life Story contribution, observation |
| Research Project | Question, evidence, Protocol, Enrolment, delivery, outcomes, findings |
| Intervention Portfolio | Versions, configuration, evidence, safeguards, decisions |
| Safety | Signals, triage, Events, actions |
| Moderation | Reports, cases, decisions, appeals |
| Data and Analysis | Dataset, quality, lock, analysis, interpretation, finding |
| Administration | Users, roles, integrations, AI configuration, audit, health |

## 113. MVP Participant Navigation

```text
Today
My Participation
My Activities
Life Story
Community
Matches
Connections
Messages
Assessments
My Choices and Sharing
Help and Safety
```

## 114. MVP Researcher Navigation

```text
Home
Projects
Evidence
Interventions
Participants
Delivery
Life Story and Community Exposure
Assessments and Outcomes
Safety and Moderation Summary
Datasets
Analysis and Findings
Reports
Governance
AI Companion
```

## 115. MVP Supporter Navigation

```text
Home
Invitations
Permissions
Shared Activities
Life Story Contributions
Observations
Messages
Report a Concern
```

## 116. MVP Moderator Navigation

```text
New Reports
Awaiting Triage
In Review
Content
Actors
Actions
Appeals
Community Rules
Audit
```

## 117. MVP Administration Navigation

```text
Organisation
Users and Memberships
Roles
Integrations
AI Configuration
Community Configuration
Audit
System Health
Settings
```

## 118. MVP Visibility Scope

- Private;
- Selected People;
- Connections;
- Community;
- Platform Public;
- with Internet Public disabled by default and activated only through a separate approved capability and consent flow.

## 119. MVP Matching Scope

- opt-in only;
- declared interests, goals, language, communication mode, broad availability, and coarse location boundary;
- explicit exclusions;
- explainable Match Candidate;
- mutual acceptance;
- controlled introduction;
- block, report, pause, and disconnect;
- no hidden sensitive-trait matching;
- no automatic private messaging;
- and no engagement-maximising ranking objective.

## 120. MVP Life Story Scope

- Participant-controlled archive;
- text, voice, photo, and caption support;
- timeline and collection organisation;
- optional AI transcription, organisation, and translation;
- attributed Supporter contribution;
- Participant review and confirmation;
- Private through Platform Public visibility;
- download and re-sharing controls;
- export;
- basic Legacy Preference;
- sensitive-topic pause and Safety Signal route.

## 121. MVP Explicit Non-Goals

- default Internet-public publishing;
- unmoderated public posting;
- anonymous public participation without accountability controls;
- automatic connection or direct messaging;
- hidden or unexplainable matching scores;
- matching based on inferred sensitive traits without approved governance;
- advertising, influencer, creator-economy, or attention-maximising features;
- family or Supporter ownership of Life Story content;
- advanced posthumous digital-estate services;
- automatic emotion recognition;
- clinical diagnosis or medication management;
- real-time wearable feed;
- autonomous agents;
- full EHR integration;
- enterprise-scale multi-organisation social federation.

## 122. MVP Information Architecture Acceptance Criteria

1. A Participant can understand where they are, what the current task is, and what happens next.
2. Every visible action is compatible with effective permission.
3. Participant, Supporter, Researcher, Moderator, and Administrator workspaces remain distinct.
4. Private Participant information is not exposed through community or public-profile navigation.
5. Life Story Item lifecycle, attribution, sharing, reuse, and history are visible.
6. Open Matching is visibly opt-in and explains candidate basis.
7. A Match Candidate cannot be mistaken for a Connection.
8. Mutual acceptance precedes private connection or messaging.
9. Block and report are reachable from profile, candidate, post, comment, connection, and message contexts.
10. Moderation and Safety workflows remain distinct but linked.
11. Research Project navigation supports the complete question-to-finding lineage.
12. Dataset Lock, Analysis Plan approval, Interpretation approval, and Finding approval are separate.
13. AI output is source-labelled and action confirmation is explicit.
14. The platform remains usable in degraded AI or Knowledge states.
15. Simplified and Supporter-assisted modes preserve all consent, sharing, matching, block, report, pause, and withdrawal choices.

---

# Part XIII — Information Architecture Governance and Validation

## 123. Information Object Template

Every important information object should define:

- canonical domain name;
- plain-language UX label where different;
- owning module and aggregate;
- primary workspace;
- permitted secondary appearances;
- discovery and existence rules;
- audience and visibility;
- state and version presentation;
- source and authorship;
- primary and secondary actions;
- history and audit needs;
- empty, loading, error, restricted, withdrawn, and degraded states;
- and mobile, adaptive, and shared-device behaviour.

## 124. Navigation Governance

- Every navigation item maps to one or more permitted tasks.
- New role labels do not automatically create new workspaces.
- A workspace is added only when it has a distinct purpose, information hierarchy, and authority model.
- Navigation changes are tested for existence leakage.
- Counts and badges are treated as disclosures.
- Deprecated terms are removed or mapped explicitly.
- Document 8 state and terminology changes trigger revalidation.

## 125. Search Governance

- Each search domain has a defined purpose and source set.
- Permission filtering occurs before ranking and result presentation.
- Public/community discovery is separated from protected platform-record search.
- Matching is not implemented as unrestricted people search.
- Knowledge search preserves external provenance.
- Search analytics do not become unapproved behavioural surveillance.

## 126. Community and Matching Governance

- Visibility scopes are versioned and consistently named.
- Community Rules are visible and versioned.
- Ranking objectives are documented.
- Matching attributes, exclusions, and explanations are governed.
- Block propagation is tested across search, matching, messaging, notifications, and community.
- Moderation action and appeal patterns are consistent.
- Social metrics are not presented as outcomes without approved interpretation.

## 127. Life Story Governance

- Participant ownership and control remain visible.
- Contribution and authorship are never hidden.
- Draft, testimony, verified fact, and AI assistance are distinct.
- Visibility and reuse are separate.
- Internet Public is a separate flow.
- Legacy Preference is not inferred.
- Deletion, withdrawal, research retention, and public-copy limitations are explained.

## 128. IA Testing

| Test Type | Required Questions |
|---|---|
| Tree Testing | Can each actor find the required task without seeing restricted areas? |
| Card Sorting | Do labels and groups match actor mental models? |
| Permission Testing | Do revoked, blocked, expired, and restricted states remove discovery and action correctly? |
| Participant Usability | Can Participants manage consent, Life Story, visibility, matching, block, report, and withdrawal? |
| Supporter Overreach | Can Supporters see or act beyond explicit permission? |
| Research Workflow | Can researchers trace question to finding without confusing state dimensions? |
| Moderation | Can reports be triaged, actioned, appealed, and restored correctly? |
| Accessibility | Do simplified, read-aloud, keyboard, screen-reader, and low-stimulation modes preserve meaning? |
| Shared Device | Are previews, role context, and sensitive history protected? |
| Degraded State | Can core workflows continue without AI or live Knowledge search? |

## 129. Analytics for Information Architecture

- Use analytics to identify failure, abandonment, confusion, inaccessible paths, and safety or withdrawal friction.
- Do not optimise consent acceptance, public sharing, posting frequency, or matching acceptance as conversion goals.
- Measure whether people can find and use control, help, block, report, pause, and withdrawal paths.
- Separate process analytics from intervention outcomes.
- Apply consent, purpose, retention, and minimum-necessary rules.

## 130. Anti-Patterns

- fixed menus based only on role name;
- Family Member navigation with default Shared Progress;
- Healthcare Professional workspace with default Clinical Notes;
- one global AI chat with unrestricted context;
- one search mixing private records, community content, evidence, and AI suggestions without source boundaries;
- generic status lists applied to every object;
- Community or Platform Public treated as Internet Public;
- matching implemented as unrestricted people search;
- candidate acceptance automatically creating a Supporter relationship;
- automatic direct messaging before mutual acceptance;
- public-profile fields copied from protected Participant Profile;
- Life Story contribution treated as shared ownership;
- AI-generated Life Story presented as memory or testimony;
- moderation action treated as Safety Event confirmation;
- reaction or session counts presented as wellbeing outcomes;
- infinite-scroll or urgency patterns designed to maximise dependency;
- dashboard completion treated as approval;
- restricted counts leaking protected existence.

---

# Part XIV — Open Questions

1. Which Participant navigation labels perform best in the first Pilot?
2. Should Life Story and Community be top-level areas or intervention-scoped entry points for all Participants?
3. Which Platform Public content is visible before Enrolment or outside a Research Project?
4. Is Internet Public publishing enabled in the first Pilot?
5. Which Life Story media types are supported?
6. Which contribution types require Participant confirmation?
7. Which Life Story reuse choices are required at MVP?
8. Which Legacy Preference choices are operationally supportable?
9. Which Community Space types are enabled?
10. Are public profiles available to all users or only eligible Participants?
11. Which actors may publish Platform Public content?
12. Which matching attributes are permitted?
13. Which matching attributes are prohibited even when self-declared?
14. How coarse must location be?
15. How are age or life-stage preferences represented without stereotyping or discrimination?
16. What Match Explanation is understandable and sufficient?
17. When may direct messaging begin?
18. Which block effects must propagate synchronously?
19. Which report categories require immediate moderation, safety, or privacy escalation?
20. Which moderation actions require dual approval?
21. Which appeals are available for each action?
22. What service levels are required for urgent reports?
23. Which community and matching exposure records enter research datasets?
24. How are deleted or withdrawn public records represented in historical datasets?
25. Which social metrics may appear in Participant or Researcher dashboards?
26. Which community or matching metrics are prohibited from being framed as outcomes?
27. Which AI assistance is enabled in Life Story, matching, messaging, and moderation?
28. Which navigation and content are available offline?
29. Which workspaces support shared-device mode?
30. Which future Document 20 flow changes require Information Architecture revalidation?

# Part XV — Design Decisions

1. Document 7 is the authoritative Handbook source for information hierarchy, navigation, workspaces, discovery, and cross-workspace presentation.
2. Information architecture is permission-scoped rather than role-hard-coded.
3. Role title alone does not determine navigation or access.
4. Discovery permission is evaluated before menus, counts, search results, recent items, and AI context are rendered.
5. Workspaces compose read models but do not own other modules' write models.
6. Participant is the canonical actor term.
7. Supporter replaces default Family Member access patterns.
8. There is no baseline Healthcare Professional Clinical Notes workspace.
9. Research Project is the primary organising object for research work.
10. Intervention Assignment and current participation organise Participant intervention work.
11. Life Story is a first-class Participant workspace.
12. Community is a first-class Participant workspace.
13. Open Matching is a first-class, opt-in workspace.
14. Safety and Moderation are separate workspaces and authority models.
15. Platform Public is distinct from Internet Public.
16. Internet Public is a separate explicit publication and consent flow.
17. Private is the default Life Story visibility.
18. Life Story lifecycle state and visibility are separate.
19. Life Story contribution does not create ownership.
20. Participant Testimony, verified fact, and AI Draft are distinct.
21. Legacy Preference is explicit and not inferred from family relationship.
22. Public Profile is separate from protected Participant Profile.
23. Social Post audience and visibility are explicit at creation.
24. Public visibility does not imply download, quotation, re-sharing, AI training, or research permission.
25. Open Matching is inactive by default.
26. Match Candidates use only declared or separately authorised attributes.
27. Every Match Candidate provides an understandable explanation.
28. A Match Candidate is not a Connection.
29. Mutual acceptance is required before private Connection activation.
30. A Connection does not create a Supporter relationship, consent, or research permission.
31. Block overrides discovery, matching, messaging, follow, notification, and interaction according to policy.
32. Report remains available after block or disconnect.
33. Direct messaging is separate from matching and requires an applicable communication basis.
34. Community ranking must not optimise only for attention, controversy, reaction volume, or dependency.
35. Social activity metrics are process measures, not Healthy Aging outcomes by themselves.
36. Search domains remain separate and visibly source-labelled.
37. Matching is not implemented as unrestricted people search.
38. Knowledge search routes through the Evidence and Knowledge Integration boundary.
39. AI Companion entry points are contextual.
40. AI permission is evaluated before context assembly.
41. AI may draft, translate, transcribe, explain, and propose but not autonomously publish, connect, message, ban, approve, lock, or confirm a Safety Event.
42. AI-assisted Life Story wording remains Draft until confirmed.
43. Moderation Case, Moderation Decision, Safety Signal, Safety Event, privacy review, and technical incident remain separate.
44. High-impact moderation is human-accountable.
45. Review task state and governed artefact state are separate.
46. Lifecycle state, operational phase, visibility, version, approval, direction, and publication are separate dimensions.
47. Use `In Review` as the canonical active-review label.
48. Approved versions are visibly immutable.
49. External submission and publication are not Research Finding states.
50. Simplified navigation preserves consent, sharing, matching, block, report, help, pause, and withdrawal.
51. Ability adaptation changes presentation rather than authority or semantic meaning.
52. Core workflows remain available during AI or Knowledge Platform degradation.
53. The MVP includes Life Story, Governed Community, controlled Platform Public participation and opt-in Open Matching.
54. Internet Public remains disabled by default unless separately approved.
55. The MVP includes Participant, Life Story, Community, Matching, Supporter, Research, Safety, Moderation, Data, and Administration workspaces.
56. Documents 18 v1.2, 19 v1.2 and 20 v1.2 are aligned with the expanded MVP and must be revalidated after any material Information Architecture change.

## 131. Summary

```text
Permission-Scoped Actor
        ↓
Purpose-Specific Workspace
        ↓
Canonical Information Object and State
        ↓
Evidence, Source, Version and Visibility
        ↓
Contextual Action
        ↓
Confirmation, Review or Domain Command
        ↓
Traceable Result and Recovery Path
```

The information architecture is successful when Participants can safely control participation, Life Story, public visibility, matching, connection, sharing, block, report, and withdrawal; researchers can trace evidence and intervention delivery through Dataset and Research Finding; reviewers can act within clear authority; and no workspace, search result, AI response, notification, or navigation item silently expands access.

