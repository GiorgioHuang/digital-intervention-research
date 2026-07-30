# Document 0 — Platform Ecosystem Architecture

**Version:** 1.2  
**Status:** Revised Foundation Baseline  
**Handbook Position:** Foundation — read after the Handbook README and before Volume I  
**Primary System:** Digital Intervention Research Platform  
**Document Owner:** Architecture and Product Governance  
**Approved By:** To be assigned  
**Last Updated:** 2026-07-28  
**Supersedes:** Document 0 — Platform Ecosystem Architecture v1.1  
**Review Trigger:** A material change to the project mission, ecosystem systems, system ownership, governance authority, cross-system interfaces, canonical actor terminology, or Handbook structure

---

## 1. Purpose

This document defines the overall architecture of the **Healthy Aging Digital Intervention Research Ecosystem** and establishes the system boundaries for all subsequent Handbook documents.

It answers six foundational questions:

1. What is the primary project?
2. Which systems form the ecosystem?
3. Why are their responsibilities separated?
4. How do those systems collaborate?
5. Which decisions remain under accountable human authority?
6. How is the Architecture & Delivery Handbook organised?

This document is the architectural foundation of the Handbook.

The Handbook-level `README.md` provides:

- navigation;
- volume structure;
- document status;
- reading paths;
- and maintenance guidance.

This document remains the authoritative source for:

- ecosystem purpose;
- system boundaries;
- ownership;
- governance separation;
- and the relationship among the Knowledge Platform, Research Platform, and AI Companion.

---

## 2. Primary Objective

The primary objective is **not** to build:

- a general AI platform;
- a generic chatbot;
- a knowledge graph as an end in itself;
- a social network;
- a telehealth platform;
- a care-management system;
- an electronic health record;
- a senior engagement application without research purpose;
- or an uncontrolled health-data repository.

The primary objective is:

> **To design and operate a world-class Digital Intervention Research Platform for Healthy Aging.**

Everything else exists to support that mission.

---

## 3. Governing Research Sequence

The ecosystem is organised around the following sequence:

```text
Healthy Aging Challenge
        ↓
Evidence and Theory
        ↓
Intervention
        ↓
Research Design
        ↓
Digital Delivery
        ↓
Evaluation
        ↓
Knowledge Generation
```

Technology, AI, data collection, and product features are subordinate to this sequence.

The project must remain:

- challenge-first;
- evidence-informed;
- intervention-centred;
- research-governed;
- Participant-controlled;
- and evaluation-driven.

---

## 4. Ecosystem Overview

The ecosystem consists of three distinct but collaborating architectural systems:

```text
┌──────────────────────────────────────────────────┐
│ Healthy Aging Knowledge Platform                 │
│                                                  │
│ Evidence • Ontology • Theory • Mechanisms        │
│ Outcomes • Measurements • Provenance             │
└────────────────────────┬─────────────────────────┘
                         │
                 MCP / REST Services
                         │
┌────────────────────────▼─────────────────────────┐
│ Digital Intervention Research Platform           │
│                                                  │
│ Projects • Consent • Protocols • Interventions   │
│ Delivery • Assessment • Evaluation • Findings    │
└────────────────────────┬─────────────────────────┘
                         │
              Governed Platform Services
                         │
┌────────────────────────▼─────────────────────────┐
│ AI Companion                                     │
│                                                  │
│ Explanation • Retrieval • Drafting • Guidance    │
│ Ability Adaptation • Controlled Tool Use         │
└──────────────────────────────────────────────────┘
```

The **Digital Intervention Research Platform** is the primary project and the operational centre of the ecosystem.

The three systems are distinct in responsibility.

They may use separate technologies, teams, release cycles, and governance mechanisms.

However:

- the Knowledge Platform remains the authoritative evidence system;
- the Research Platform remains the authoritative intervention and research system;
- and the AI Companion remains a governed assistance capability operating through the Research Platform.

---

## 5. Architectural Relationship

The ecosystem should be understood as:

```text
Healthy Aging Knowledge Platform
            │
            │ provides governed evidence,
            │ concepts and provenance
            ▼
Digital Intervention Research Platform
            │
            │ provides authorised research,
            │ intervention and Participant context
            ▼
AI Companion
```

The direction of assistance does not transfer authority.

For example:

- evidence supplied to the Research Platform remains governed by the Knowledge Platform;
- a Knowledge Reference used in a Protocol does not become an independently curated Research Platform evidence record;
- an AI-generated draft does not become a Protocol, Evidence Decision, Safety Decision, or Research Finding until reviewed and approved by an authorised human;
- and a Research Finding does not become authoritative external knowledge until accepted through Knowledge Platform governance.

---

## 6. Healthy Aging Knowledge Platform

### 6.1 Purpose

The Healthy Aging Knowledge Platform is the authoritative knowledge system for Healthy Aging evidence and concepts.

It may also be described as the ecosystem's **Knowledge OS**.

### 6.2 Owns

The Knowledge Platform owns:

- Healthy Aging ontology;
- terminology;
- evidence records;
- theories;
- mechanisms;
- intervention concepts;
- outcome definitions;
- measurement definitions;
- evidence strength;
- provenance;
- knowledge gaps;
- knowledge versioning;
- knowledge governance;
- semantic search;
- evidence retrieval services;
- and governed publication of accepted findings.

### 6.3 Provides

The Knowledge Platform may provide:

- MCP services;
- REST APIs;
- evidence search;
- concept resolution;
- provenance retrieval;
- version comparison;
- mechanism retrieval;
- outcome and measurement definitions;
- and research-finding submission interfaces.

### 6.4 Does Not Own

The Knowledge Platform does not own:

- Participants;
- Participant identity;
- Participant consent;
- Participant relationships;
- Research Projects;
- Protocol Versions;
- Intervention Assignments;
- intervention delivery;
- assessments;
- observations;
- Safety Events;
- operational research datasets;
- Analysis Plans;
- or internal Research Platform approvals.

### 6.5 Knowledge Graph Position

The **Healthy Aging Knowledge Graph** is a capability inside the Knowledge Platform.

It is not the entire Knowledge Platform and is not the primary project.

### 6.6 Governance Boundary

Knowledge publication, ontology changes, and authoritative evidence curation remain under Knowledge Platform governance.

The Research Platform may prepare:

- Knowledge References;
- Evidence Decisions;
- Knowledge Gaps;
- Research Findings;
- and submission packages.

It may not bypass Knowledge Platform governance and directly publish authoritative knowledge.

---

## 7. Digital Intervention Research Platform

### 7.1 Purpose

The Digital Intervention Research Platform is the primary system.

It supports the complete lifecycle of designing, delivering, evaluating, and improving evidence-informed digital interventions for Healthy Aging.

It may also be described as the ecosystem's **Research OS**.

### 7.2 Owns

The Research Platform owns:

- Research Projects;
- Research Questions;
- research objectives;
- Protocols and Protocol Versions;
- Protocol amendments;
- Participants;
- enrolment;
- eligibility;
- consent;
- relationships;
- delegation;
- supported decision-making records;
- Intervention definitions and Intervention Versions;
- Intervention Assignments;
- digital intervention delivery;
- intervention exposure;
- intervention fidelity;
- ability adaptations;
- assessments;
- observations;
- outcome records;
- Safety Signals and Safety Events;
- data-quality records;
- Dataset Versions;
- Dataset Locks;
- Analysis Plans;
- analysis lineage;
- interpretations;
- Research Findings;
- research reports;
- exports;
- approvals;
- workflow;
- audit;
- and findings awaiting external knowledge curation.

### 7.3 Evidence and Knowledge Integration

The Research Platform contains an **Evidence and Knowledge Integration capability**.

This capability may:

- search the Knowledge Platform;
- retrieve evidence;
- preserve Knowledge References;
- create Research Platform Evidence Decisions;
- create Evidence Snapshots;
- identify Knowledge Gaps;
- monitor external evidence changes;
- and prepare external submission packages.

This capability does not make the Research Platform the owner of the Knowledge Platform.

### 7.4 Does Not Own

The Research Platform does not own:

- authoritative external evidence curation;
- ontology governance;
- definitive external knowledge publication;
- general healthcare records;
- unrestricted clinical decision-making;
- or external model-provider governance.

### 7.5 Research Integrity

The Research Platform must preserve:

- version history;
- provenance;
- approval;
- Protocol linkage;
- Intervention Version linkage;
- consent state;
- Participant assignment;
- Dataset Version;
- analysis lineage;
- uncertainty;
- and accountable human interpretation.

---

## 8. AI Companion

### 8.1 Purpose

The AI Companion is a permission-aware, evidence-grounded, role-adaptive assistance capability embedded in the Digital Intervention Research Platform experience.

It is not:

- an independent governance authority;
- a general-purpose chatbot;
- a clinical decision-maker;
- a scientific approver;
- a human relationship;
- or the owner of Participant data.

### 8.2 Provides

The AI Companion may provide:

- explanation;
- evidence retrieval assistance;
- navigation;
- summarisation;
- comparison;
- drafting;
- structured extraction;
- ability-adaptive support;
- personalisation within approved boundaries;
- intervention-delivery support;
- reflection support;
- controlled tool use;
- and escalation to human review.

### 8.3 Three AI Roles

Within a Research Project, the AI Companion may operate as:

1. **Research Workflow Assistant**
2. **Intervention Delivery Component**
3. **Object of Research**

Every Research Project using AI should declare which roles apply.

### 8.4 Does Not Own

The AI Companion does not own:

- evidence governance;
- Research Questions;
- Protocol approval;
- Intervention approval;
- consent;
- relationship authority;
- eligibility decisions;
- safety decisions;
- Dataset Locks;
- Analysis Plan approval;
- Research Finding approval;
- external publication;
- or irreversible high-impact decisions.

### 8.5 AI Naming

The canonical ecosystem name is:

> **AI Companion**

The following terms should not be used as product or system names:

- Friendly Companion;
- Intelligence Layer;
- AI Layer;
- generic AI Agent Layer;
- or Chatbot Layer.

`AI Orchestration` may be used only for the technical runtime that manages:

- models;
- prompts;
- retrieval;
- tools;
- memory;
- safety;
- evaluation;
- and provider access.

### 8.6 Human Relationship Boundary

The AI Companion should support human connection.

It must not:

- imply exclusivity;
- claim emotional need;
- pressure disclosure;
- discourage human relationships;
- guilt a Participant;
- exploit loneliness;
- or optimise conversation duration as the primary outcome.

---

## 9. Canonical Actor Terminology

### 9.1 Participant

`Participant` is the canonical domain term for a person enrolled in, invited to, screened for, or interacting through a Research Project.

### 9.2 Older Adult

`Older adult` is a population description.

It does not determine:

- ability;
- platform role;
- support need;
- consent capacity;
- or permission.

### 9.3 Resident

`Resident` is used only in a residential, assisted-living, or long-term care context.

It is not the general cross-platform actor name.

### 9.4 Supporter

A `Supporter` is a person authorised to assist a Participant within a defined relationship and permission scope.

A Supporter may be:

- a family member;
- a friend;
- an informal caregiver;
- a community volunteer;
- or another trusted person.

Family status alone does not grant access.

---

## 10. Permission and Consent Foundation

The ecosystem uses the following canonical permission model:

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

### 10.1 Role

Defines a category of responsibility.

### 10.2 Relationship

Defines how an actor is connected to:

- a Participant;
- Research Project;
- organisation;
- or resource.

### 10.3 Consent

Defines what the Participant has authorised, declined, restricted, or withdrawn.

### 10.4 Purpose

Defines why access or action is requested.

### 10.5 Context

Defines the operational circumstances.

### 10.6 Specific Permission

Defines the exact action.

### 10.7 Resource State

Defines whether the target is:

- Draft;
- In Review;
- Approved;
- Active;
- Paused;
- Locked;
- Superseded;
- Withdrawn;
- or Archived.

### 10.8 Boundary Rules

- A role alone does not grant unrestricted access.
- A relationship alone does not grant access.
- Consent does not replace specific permission.
- Permission does not replace consent.
- Technical administrator status does not create research authority.
- AI capability does not create authority.
- Explicit deny overrides allow.
- Sensitive access should be minimum necessary and auditable.

Document 4 is the authoritative specification for roles, relationships, consent, delegation, purpose, and permissions.

---

## 11. Core Research Workflow

The Research Platform should support the following operational flow:

```text
Healthy Aging Challenge
        ↓
Research Question
        ↓
Evidence Review
        ↓
Evidence Decision
        ↓
Intervention Design
        ↓
Protocol Version
        ↓
Participant Consent and Enrolment
        ↓
Intervention Assignment
        ↓
Digital Delivery
        ↓
Assessment and Observation
        ↓
Dataset Version
        ↓
Analysis and Interpretation
        ↓
Research Finding
        ↓
Intervention Decision
```

The Intervention Decision may be:

- Retain;
- Revise;
- Restrict;
- Replicate;
- Expand;
- Suspend;
- Retire;
- or Continue Exploratory Research.

---

## 12. Knowledge Feedback Workflow

Knowledge generated through a Research Project should follow:

```text
Research Finding
        ↓
Human Review and Approval
        ↓
Evidence Package
        ↓
External Knowledge Platform Submission
        ↓
Knowledge Platform Curation
        ↓
Accepted • Revised • Rejected • Deferred
```

The Research Platform preserves the Research Finding whether or not it is accepted into the Knowledge Platform.

External curation must not silently rewrite the historical Research Finding.

---

## 13. Evidence Authority

The ecosystem distinguishes:

### External Evidence

Owned and governed by the Knowledge Platform.

### Knowledge Reference

A versioned reference from the Research Platform to an external knowledge record.

### Evidence Decision

A human-accountable Research Platform decision about how evidence applies to a specific:

- population;
- intervention;
- mechanism;
- outcome;
- setting;
- Protocol;
- or Research Question.

### Research Finding

A Research Platform conclusion supported by a defined Protocol, Dataset Version, Analysis Plan, interpretation, and approval.

These concepts must not be treated as interchangeable.

---

## 14. Governance Authority

### 14.1 Participant Authority

Participants retain meaningful control over:

- participation;
- consent;
- optional data use;
- supporter access;
- AI use;
- sharing;
- preferences;
- pause;
- and withdrawal

where legally and ethically possible.

### 14.2 Research Authority

Authorised humans remain accountable for:

- Research Questions;
- Protocols;
- Intervention Versions;
- analysis;
- interpretation;
- and Research Findings.

### 14.3 Safety Authority

Authorised Safety Reviewers remain accountable for Safety Event classification, escalation, closure, and pause decisions.

### 14.4 Evidence Authority

Research Platform Evidence Reviewers own Evidence Decisions within Research Projects.

Knowledge Platform governance owns external authoritative curation and publication.

### 14.5 Technical Authority

Technical administrators own infrastructure operation.

They do not automatically receive:

- Participant content access;
- research approval authority;
- safety authority;
- consent authority;
- or knowledge-publication authority.

### 14.6 AI Authority

The AI Companion has no independent governance authority.

---

## 15. System Responsibility Matrix

| Capability | Knowledge Platform | Research Platform | AI Companion |
|---|---|---|---|
| Ontology | Own | Reference | Retrieve or explain |
| Evidence records | Own | Reference | Retrieve or summarise |
| Theory and mechanisms | Own | Apply through Evidence Decisions | Explain or compare |
| Outcome definitions | Own | Reference in Protocols | Explain |
| Measurement definitions | Own | Configure approved use | Explain or assist |
| Participants | None | Own | Assist within permission |
| Consent | None | Own and enforce | Respect only |
| Relationships | None | Own and enforce | Respect only |
| Research Projects | None | Own | Assist |
| Research Questions | None | Own | Suggest or draft |
| Protocol Versions | None | Own | Draft or explain |
| Intervention Versions | Concept reference | Own | Support approved delivery |
| Intervention delivery | None | Own | Assist within configuration |
| Assessments | Definition reference | Own | Assist where approved |
| Safety Signals | None | Own | Detect or escalate possible signal |
| Safety decisions | None | Human authority | No final authority |
| Dataset Versions | None | Own | Assist documentation |
| Dataset Lock | None | Human authority | Prohibited autonomous action |
| Analysis | None | Own | Assist |
| Research Findings | Receive submission | Own | Draft only |
| Knowledge publication | Own | Prepare submission | No authority |
| AI models and prompts | None | Govern configuration | Execute approved configuration |

---

## 16. Cross-System Integration Principles

### 16.1 Loose Coupling

The systems should evolve independently through stable, versioned interfaces.

### 16.2 No Direct Ownership Leakage

An integration must not cause one system to silently assume another system's responsibility.

### 16.3 Provenance by Default

Cross-system data should preserve:

- source;
- identifier;
- version;
- retrieval time;
- transformation;
- and validation status.

### 16.4 Minimum Necessary Exchange

Only data required for the approved purpose should cross a boundary.

### 16.5 No Direct Database Coupling

Systems should communicate through governed:

- APIs;
- MCP tools;
- events;
- or controlled file exchange.

### 16.6 Degraded Operation

The Research Platform should continue core manual workflows when:

- AI is unavailable;
- new Knowledge Platform retrieval is unavailable;
- or an external provider fails.

Approved Evidence Decisions and Evidence Snapshots may support degraded evidence access.

---

## 17. Design Principles

### 17.1 Person Before Technology

Technology should adapt to people.

### 17.2 Evidence Before Claims

Claims should be linked to evidence, theory, observed data, or clearly identified uncertainty.

### 17.3 Evidence Before Intelligence

AI should reason over evidence rather than replace evidence.

### 17.4 Intervention Before Feature

A feature becomes an intervention only when its:

- challenge;
- population;
- mechanism;
- outcome;
- risk;
- safeguard;
- and evaluation pathway

are defined.

### 17.5 Human Connection Over AI Substitution

AI should facilitate human relationships rather than compete with them.

### 17.6 Ability Over Age

Chronological age is not a sufficient proxy for:

- sensory ability;
- motor ability;
- cognitive ability;
- communication ability;
- or digital literacy.

### 17.7 Consent and Minimum Necessary Access

Sensitive access requires valid consent, purpose, permission, and minimum necessary scope.

### 17.8 Participant Ownership and Control

Participants should retain meaningful control over participation, personal information, relationships, sharing, and withdrawal.

### 17.9 Meaningful Engagement Over Engagement Maximisation

The platform should optimise for meaningful intervention outcomes rather than screen time or conversation volume.

### 17.10 Safety, Dignity, and Reversibility

High-impact actions should be safe, respectful, understandable, and reversible where possible.

### 17.11 Research-Driven Iteration

Development should follow:

```text
Evidence
    ↓
Intervention
    ↓
Implementation
    ↓
Evaluation
    ↓
Decision
    ↓
Knowledge Update
```

### 17.12 Loose Coupling

The Knowledge Platform, Research Platform, and AI Companion should evolve independently through stable interfaces without responsibility leakage.

### 17.13 Provenance by Default

Material evidence, data, AI output, decisions, and findings should preserve source and version.

### 17.14 Human Governance

Scientific, consent, safety, privacy, and publication decisions remain under accountable human authority.

---

## 18. Explicit Ecosystem Non-Goals

Unless separately justified, governed, and approved, the ecosystem is not intended to provide:

- clinical diagnosis;
- medical treatment;
- medication prescribing;
- medication administration;
- medication-management recommendations;
- emergency response services;
- electronic health record replacement;
- unrestricted family or caregiver access;
- automatic decision-making-capacity determination;
- continuous surveillance;
- autonomous research approval;
- autonomous clinical decision-making;
- autonomous knowledge publication;
- unrestricted AI agents;
- or emotional dependency optimisation.

A future controlled expansion must define:

- purpose;
- evidence;
- intervention;
- Protocol;
- authority;
- consent;
- safety;
- data;
- implementation;
- and evaluation.

---

## 19. Handbook Scope

The Architecture & Delivery Handbook focuses on the **Digital Intervention Research Platform**.

The Knowledge Platform and AI Companion are documented to the level required to define:

- ecosystem boundaries;
- integration;
- authority;
- data exchange;
- safety;
- reproducibility;
- and operational responsibility.

The Handbook does not attempt to fully specify every internal component of the external Knowledge Platform.

---

## 20. Handbook Structure and Relationship to Other Documents

The Handbook is organised into:

- an unnumbered navigation README;
- one foundation document;
- three volumes;
- and supporting appendices.

```text
README — Architecture Handbook Overview & Navigation
        ↓
Document 0 — Platform Ecosystem Architecture
        ↓
Volume I — Product, Domain & Research Architecture
        ↓
Volume II — Technical Architecture
        ↓
Volume III — Delivery & Research Implementation
        ↓
Appendices — Traceability, Glossary, Decisions and Status
```

---

## 21. Handbook README

The unnumbered `README.md` provides:

- Handbook purpose and audience;
- volume structure;
- recommended reading paths;
- document status and version index;
- navigation links;
- maintenance conventions;
- and links to traceability and glossary resources.

The README does not redefine ecosystem architecture or system responsibilities.

---

## 22. Volume I — Product, Domain & Research Architecture

**Documents 1–12** define what the Digital Intervention Research Platform must support.

They cover:

- project vision and conceptual foundations;
- intervention architecture;
- roles, relationships, consent and permissions;
- ability-adaptive UX;
- product modules and information architecture;
- domain language and bounded contexts;
- evidence and knowledge integration;
- AI Companion responsibilities;
- research and evaluation;
- and data meaning and interoperability.

---

## 23. Volume II — Technical Architecture

**Documents 13–17** define how the platform should be implemented.

They cover:

- system context and application architecture;
- security, privacy and consent enforcement;
- APIs, events and integration specifications;
- database and storage design;
- and AI orchestration and model operations.

---

## 24. Volume III — Delivery & Research Implementation

**Documents 18–20** translate the architecture into delivery and operational practice.

They cover:

- MVP scope and delivery roadmap;
- the Initial Pilot Research Protocol;
- and detailed UX flows and design-system specifications.

---

## 25. Appendices

Supporting appendices should contain cross-document artefacts that evolve independently.

Recommended appendices:

- Appendix A — Architecture Traceability Matrix
- Appendix B — Ubiquitous Language & Glossary
- Appendix C — Architecture Decision Register
- Appendix D — Document Status Register

---

## 26. Reading Order

The recommended default reading order is:

1. Handbook `README.md`
2. Document 0 — Platform Ecosystem Architecture
3. Relevant Volume documents
4. Supporting appendices

Document 0 should be read before Documents 1–20 because it defines the shared mission, ecosystem boundaries, canonical system names, authority model, and responsibilities used throughout the Handbook.

---

## 27. Sources of Authority

When Handbook documents conflict, use the following authority map.

| Subject | Primary Authority |
|---|---|
| Handbook navigation and status | README |
| Ecosystem mission and system boundaries | Document 0 |
| Project definition and scope | Document 1 |
| Conceptual and evidence model | Document 2 |
| Intervention definitions and lifecycle | Document 3 |
| Roles, relationships, consent and permissions | Document 4 |
| Ability-adaptive UX principles | Document 5 |
| Product modules | Document 6 |
| Information architecture | Document 7 |
| Domain model and canonical language | Document 8 |
| Evidence integration | Document 9 |
| AI Companion product architecture | Document 10 |
| Research and evaluation | Document 11 |
| Data meaning and interoperability | Document 12 |
| Technical architecture | Documents 13–17 |
| MVP and Pilot implementation | Documents 18–20 |

A downstream document may refine an upstream rule.

It must not silently redefine it.

---

## 28. Design Decisions

This document establishes that:

1. The Digital Intervention Research Platform is the primary project.
2. The ecosystem contains a Knowledge Platform, Research Platform, and AI Companion.
3. The Knowledge Platform remains the authoritative knowledge system.
4. The Healthy Aging Knowledge Graph is a capability inside the Knowledge Platform.
5. The Research Platform remains the authoritative operational research and intervention system.
6. Evidence and Knowledge Integration is an internal Research Platform capability.
7. The internal integration capability does not own external knowledge governance.
8. The AI Companion is a governed assistance capability operating through the Research Platform.
9. `AI Companion` is the canonical product and system name.
10. `AI Layer`, `Intelligence Layer`, and `Friendly Companion` are not canonical names.
11. Participant is the canonical Research Platform actor.
12. Older adult is a population term.
13. Resident is a setting-specific contextual term.
14. Family or caregiver status does not automatically grant access.
15. Effective permission depends on role, relationship, consent, purpose, context, specific permission, and resource state.
16. Technical authority does not create research, consent, safety, or knowledge-publication authority.
17. AI does not own scientific, consent, safety, approval, or publication decisions.
18. Research Findings remain Research Platform records.
19. External authoritative knowledge publication remains under Knowledge Platform governance.
20. Cross-system interfaces should be versioned, provenance-preserving, and minimum necessary.
21. AI failure must not prevent core manual research workflows.
22. New evidence must not silently modify approved Protocols or Research Findings.
23. The platform is intervention-first rather than feature-first.
24. Meaningful human outcomes take priority over product engagement.
25. Architecture changes that alter system responsibility require revision of this foundation document.

---

## 29. Summary

The Healthy Aging Digital Intervention Research Ecosystem exists to support a disciplined cycle:

```text
Challenge
    ↓
Evidence
    ↓
Intervention
    ↓
Research
    ↓
Delivery
    ↓
Evaluation
    ↓
Knowledge
```

The systems cooperate without merging their authority:

```text
Knowledge Platform
    → provides governed knowledge

Research Platform
    → owns research and intervention operations

AI Companion
    → assists within permission and human governance
```

The central architectural rule is:

> The Research Platform may consume knowledge and use AI, but it must not surrender intervention ownership, Participant control, scientific accountability, research reproducibility, or human governance.

All subsequent Handbook documents should preserve this ecosystem boundary.
