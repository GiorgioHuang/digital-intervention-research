# Document 9 — Evidence & Knowledge Integration Architecture

**Version:** 1.1  
**Status:** Revised Architecture Baseline  
**Handbook Volume:** Volume I — Product, Domain & Research Architecture  
**Primary System:** Digital Intervention Research Platform  
**Primary Product Module:** M10 — Evidence Workspace and Knowledge Integration  
**Document Owner:** Research and Evidence Governance  
**Approved By:** To be assigned  
**Last Updated:** 2026-07-28  
**Supersedes:** Document 9 — Evidence & Knowledge Integration Architecture v1.0  
**Review Trigger:** A material change to Knowledge Platform boundaries, evidence appraisal, Evidence Review or Evidence Decision semantics, Knowledge References, Evidence Snapshots, Research Knowledge Gaps, reference-change handling, intervention evidence status, AI-assisted evidence work, Life Story evidence, community or matching evidence, external submission, licensing, provenance, or integration capabilities

---

## 1. Purpose

This document defines the **Evidence & Knowledge Integration Architecture** of the **Digital Intervention Research Platform**.

It specifies how the Research Platform:

- discovers authoritative external knowledge;
- preserves external identifiers, versions, verification, provenance, and uncertainty;
- conducts purpose-bound Evidence Reviews;
- records human-accountable Evidence Decisions;
- creates immutable Evidence Snapshots;
- identifies and manages local Research Knowledge Gaps;
- detects external evidence changes without silently rewriting approved research records;
- supports evidence-informed Protocol, intervention, measurement, safety, public-social, matching, and Life Story decisions;
- supports reproducible AI-assisted evidence work;
- connects approved Research Findings to governed external-submission workflows;
- and continues safely when external knowledge or AI capabilities are unavailable.

The **Healthy Aging Knowledge Platform** is an authoritative external knowledge system. This document defines the Research Platform boundary and integration behaviour; it does not define the Knowledge Platform's internal ontology, storage, curation process, or publication governance.

> External knowledge may inform a Research Platform decision, but the decision remains a local, versioned, purpose-specific, human-accountable record with explicit context, applicability, uncertainty, and provenance.

---

## 2. Scope

This document covers:

- M10 — Evidence Workspace and Knowledge Integration;
- Knowledge Platform Anti-Corruption Layer and integration service;
- evidence discovery, search, filtering, comparison, and selection;
- Knowledge References;
- Evidence Reviews;
- Evidence Decisions;
- Evidence Snapshots;
- Research Knowledge Gaps and external Knowledge Gap references;
- Reference Change Alerts and evidence re-review;
- evidence use in Research Questions, Protocols, interventions, measurements, safety, data interpretation, and reporting;
- evidence requirements for Life Story, Governed Community, Platform Public participation, Open Matching, moderation, AI and ability adaptation;
- Intervention Evidence Status and Evidence Direction support;
- Research Finding and Evidence Package integration boundaries;
- AI Companion evidence assistance and controls;
- caching, local storage, licensing, and degraded modes;
- permission, audit, observability, events, and service boundaries;
- MVP capabilities and constraints;
- and future evolution.

This document does not define:

- the internal Knowledge Platform ontology or curation workflow;
- the final Protocol or intervention portfolio;
- final measurement instruments;
- statistical analysis methods;
- Research Finding approval in full;
- external publication rules in full;
- final API or event schemas;
- physical database schemas;
- infrastructure deployment;
- model-provider configuration;
- or final user-interface layouts.

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
- Batch 2 Handbook Consistency Review v1.0

### Provides input to

- Document 10 — AI Companion Architecture revision
- Document 11 — Research & Evaluation Framework revision
- Document 12 — Data & Interoperability Architecture revision
- Documents 13–17 — Technical Architecture
- Document 18 — MVP Scope & Delivery Roadmap revision
- Document 19 — Initial Pilot Research Protocol revision
- Document 20 — UX Flows & Design System Specification revision
- Appendix A — Architecture Traceability Matrix
- Appendix B — Ubiquitous Language & Glossary
- Appendix D — Document Status Register

### Authority Hierarchy

| Subject | Authority |
|---|---|
| Ecosystem ownership | Document 0 |
| Conceptual and evidence semantics | Document 2 |
| Intervention Evidence Status, Direction, and intervention definitions | Document 3 |
| Actors and permissions | Document 4 |
| Product-module ownership and MVP capability scope | Document 6 v3.1 |
| Information presentation and workspaces | Document 7 v3.0 |
| Canonical evidence aggregates, states, events, and language | Document 8 v3.1 |
| Evidence integration workflow and implementation-independent architecture | Document 9 v1.1 |

---

# Part I — Architectural Position and Principles

## 4. Ecosystem Position

```text
Healthy Aging Knowledge Platform
        │
        │ authoritative evidence, theories, mechanisms,
        │ outcomes, measurements, ontology and provenance
        ▼
Knowledge Platform Anti-Corruption Layer
        │
        ▼
M10 Evidence Workspace and Knowledge Integration
        │
        ├── Knowledge References
        ├── Evidence Reviews
        ├── Evidence Decisions
        ├── Evidence Snapshots
        ├── Research Knowledge Gaps
        └── Reference Change Alerts
        │
        ▼
Research Questions, Protocol Versions,
Intervention Versions and Configurations,
Measurements, Safety, Analysis and Reporting
```

## 5. Knowledge Platform Ownership

The Knowledge Platform owns authoritative:

- evidence resources and Evidence Claims;
- theories and mechanisms;
- Outcome Definitions and Measurement Definitions;
- ontology and terminology mappings;
- source provenance and citation relationships;
- verification and knowledge-curation state;
- curated Knowledge Gaps;
- knowledge-resource versions;
- and Knowledge Publication.

## 6. Research Platform Ownership

The Research Platform owns:

- KnowledgeReference;
- EvidenceReview;
- EvidenceDecision;
- EvidenceSnapshot;
- ResearchKnowledgeGap;
- KnowledgeGapReference;
- ReferenceChangeAlert;
- local review comments, assignments, and Approval Records;
- local evidence-package preparation inputs;
- and links between evidence records and Research Platform artefacts.

ResearchFinding is owned by M13 — Analysis, Interpretation and Findings. EvidencePackage, ExternalSubmission, and ExternalPublicationReference are owned by M14 — Reporting and External Submission. M10 supplies evidence references, provenance, decisions, snapshots, and change context to those workflows but does not become their owner.

## 7. Core Design Principles

1. Evidence before intelligence.
2. Research purpose before search convenience.
3. References before uncontrolled duplication.
4. Provenance and version by default.
5. Human decisions remain explicit.
6. Applicability is assessed, not assumed.
7. Weak, indirect, mixed, null, negative, and harmful evidence remains visible.
8. Evidence Review state is separate from Evidence Decision outcome.
9. Evidence status is separate from evidence direction.
10. Live external knowledge is separate from historical Evidence Snapshots.
11. External change triggers review, not silent mutation.
12. Research Knowledge Gap is separate from external curated Knowledge Gap.
13. AI assistance is source-grounded, permission-scoped, and reviewable.
14. Knowledge integration remains loosely coupled and capability-aware.
15. Licensing and source restrictions are preserved.
16. Core research and Participant workflows degrade transparently.

## 8. Evidence Is Not a Single Hierarchy

Different evidence types answer different questions. The architecture must support fit-for-purpose appraisal rather than assigning one automated hierarchy to every research decision.

| Question | Especially Relevant Evidence |
|---|---|
| Does an intervention affect an outcome? | Controlled, quasi-experimental, longitudinal, synthesis |
| How might it work? | Theory, mechanism, qualitative, realist, mixed-method |
| Is it meaningful or acceptable? | Qualitative, co-design, lived-experience, acceptability |
| Can it be delivered? | Feasibility, implementation, workflow, operational |
| Is it accessible? | Accessibility, HCI, assistive-technology, usability |
| Is it safe? | Safety studies, adverse-event evidence, qualitative and governance analysis |
| For whom and under which conditions? | Subgroup, contextual, equity-focused, realist |
| Which measurement is appropriate? | Measurement-property, validation, licensing, burden, population-fit |
| Can Governed Community, Platform Public participation or Open Matching be operated safely? | Moderation, online safety, fraud, privacy, fairness, discrimination, implementation |
| Can Life Story work support identity or meaning? | Narrative identity, reminiscence, self-expression, qualitative, intergenerational, implementation |

## 9. Canonical Evidence Workflow

```text
Research Question or Governed Design Decision
        ↓
Permission and Purpose Check
        ↓
Evidence Review Created
        ↓
Knowledge Platform Search and Retrieval
        ↓
Knowledge References Selected
        ↓
Quality, Directness and Applicability Appraisal
        ↓
Conflicting, Null, Harmful and Missing Evidence Recorded
        ↓
Evidence Decision Drafted
        ↓
Human Review and Approval
        ↓
Evidence Snapshot Created
        ↓
Protocol / Intervention / Measurement / Safety Decision
        ↓
Review Trigger and Change Monitoring
```

---

# Part II — Canonical Evidence Domain Model

## 10. Knowledge Reference

A `KnowledgeReference` is a versioned Research Platform reference to an authoritative external Knowledge Platform resource.

It is not the external resource, a local evidence claim, or an uncontrolled copy.

### Knowledge Reference — Required Information

- local Knowledge Reference ID;
- external system and capability;
- external identifier and resource type;
- external version or version token;
- human-readable label;
- retrieval purpose and context;
- retrieval query and filters where retained;
- retrieval time;
- verification or curation state at retrieval;
- source and provenance links;
- citation data;
- licensing or usage restrictions;
- resolution state;
- last resolved time;
- warnings and capability limitations;
- and linked Evidence Snapshot where applicable.

## 11. Knowledge Reference State Dimensions

| Dimension | Representative Values |
|---|---|
| Local Lifecycle | Active; Superseded; Archived |
| Resolution | Unresolved; Resolved; Resolution Failed; Source Unavailable |
| External Version Relationship | Current; External Version Changed; External Resource Superseded; External Resource Deprecated |
| Verification Relationship | Unchanged; Upgraded; Downgraded; Withdrawn; Unknown |
| Snapshot Availability | None; Partial Snapshot; Complete Permitted Snapshot |

These dimensions must not be collapsed into one generic reference status. Historical links remain traceable even when an external resource becomes unresolvable or deprecated.

## 12. Evidence Review

An `EvidenceReview` is the Research Platform aggregate that organises evidence discovery, selection, appraisal, comparison, comments, reviewer assignment, and approval for one defined purpose.

### Review Context

- Research Project;
- Research Question;
- population and context;
- intervention or Intervention Version;
- mechanism;
- Outcome Definition;
- Measurement Definition or instrument selection;
- Protocol Version;
- Safety question;
- Life Story claim;
- community, public-social, matching, moderation, or AI design decision;
- Research Finding interpretation question;
- or another governed decision scope.

### Canonical Evidence Review State

```text
Draft
    ↓
In Review
    ├── Returned for Revision
    │       ↓
    │     Draft
    ├── Approved
    │       ↓
    │   Superseded
    └── Archived
```

`Search in Progress`, `Evidence Collected`, `Decision Drafted`, and `Human Review Required` are workflow tasks or completeness indicators, not canonical aggregate lifecycle states.

## 13. Evidence Decision

An `EvidenceDecision` is a human-accountable Research Platform decision about how a body of evidence applies to a specific purpose, population, context, intervention, mechanism, outcome, measurement, Protocol, risk, or Research Question.

It is distinct from external evidence, external verification, an Evidence Review, an AI synthesis, Intervention Evidence Status, and a Research Finding.

### Required Decision Content

- Evidence Decision ID and exact version;
- Research Project and purpose;
- Research Question where applicable;
- population and context;
- intervention, component, version, configuration, mechanism, outcome, or measurement where applicable;
- Evidence Review and Knowledge References;
- included and excluded evidence with rationale;
- directness and applicability;
- methodological limitations and uncertainty;
- beneficial, null, negative, mixed, conflicting, and harmful evidence;
- burden, accessibility, equity, privacy, safety, and implementation considerations;
- decision outcome;
- conditions or restrictions;
- review trigger;
- reviewer and approver;
- Conflict of Interest handling;
- AI assistance disclosure;
- Approval Record;
- and linked Evidence Snapshot.

## 14. Canonical Evidence Decision Outcomes

- Support
- Support with Conditions
- Insufficient Evidence
- Conflicting Evidence
- Restrict
- Do Not Proceed
- Research Required

`Provisional` and `Deferred` are workflow or planning states. `Not Applicable` is an applicability conclusion. `Requires Specialist Review` is a review requirement. `Accepted`, `Rejected`, and `Approved` are review or approval decisions. They are not canonical scientific Evidence Decision outcomes.

## 15. Evidence Decision Approval State

- Draft
- In Review
- Approved
- Approved with Conditions
- Rejected
- Superseded
- Withdrawn
- Archived

Decision outcome and approval state are independent.

```text
Decision Outcome: Support with Conditions
Approval State: Approved
```

## 16. Applicability Assessment

Applicability should consider:

- population fit;
- setting and organisational fit;
- cultural and language fit;
- intervention-component and configuration fit;
- delivery-mode and digital-modality fit;
- dose and duration fit;
- mechanism fit;
- comparator fit;
- outcome and measurement fit;
- follow-up fit;
- ability and accessibility fit;
- implementation environment;
- support availability;
- risk and burden profile;
- privacy and public-visibility implications;
- equity and exclusion;
- AI configuration where relevant;
- and transferability.

Evidence does not automatically transfer across materially different populations, settings, cultures, languages, doses, delivery modes, AI configurations, public-visibility scopes, matching policies, or measurement adaptations.

## 17. Evidence Snapshot

An `EvidenceSnapshot` is an immutable entity preserving the evidence state used at a defined research or governance milestone.

It is not a value object and is not merely a cache entry.

### Snapshot Contents

- snapshot identity and type;
- purpose and milestone;
- Research Project and Evidence Review;
- Knowledge Reference identifiers and exact external versions;
- permitted selected content or structured summary;
- verification state at capture;
- retrieval queries and filters where relevant;
- inclusion and exclusion decisions;
- reviewer annotations;
- Evidence Decision identity and version;
- provenance and citation records;
- licensing and completeness state;
- integrity information or checksum;
- creator and creation time;
- and supersession or correction references.

### Snapshot Types

- Evidence Review Snapshot;
- Evidence Decision Snapshot;
- Protocol Approval Snapshot;
- Intervention Version Snapshot;
- Measurement Selection Snapshot;
- Safety Review Snapshot;
- AI Configuration Evidence Snapshot;
- Research Finding Context Snapshot;
- External Submission Evidence Snapshot.

## 18. Research Knowledge Gap

A `ResearchKnowledgeGap` is a locally identified unresolved question, missing evidence relationship, or uncertainty that affects research design, intervention design, safety, interpretation, or future priorities.

It is distinct from a curated Knowledge Platform Knowledge Gap.

### Representative Gap Types

- No Evidence Found;
- Insufficient Evidence Quality;
- Indirect Evidence Only;
- Conflicting Evidence;
- Population Mismatch;
- Setting or Cultural Mismatch;
- Intervention or Configuration Mismatch;
- Mechanism Unclear;
- Outcome Not Studied;
- Measurement Unavailable or Invalid;
- Harm or Burden Insufficiently Studied;
- Accessibility Uncertainty;
- Equity or Exclusion Concern;
- Privacy or Public-Visibility Uncertainty;
- Matching Fairness or Explainability Uncertainty;
- Moderation Effectiveness Uncertainty;
- Digital-Legacy Uncertainty;
- AI Safety or Transferability Uncertainty;
- Implementation Uncertainty;
- Evidence Out of Date;
- Knowledge Platform Capability Missing.

### Canonical Lifecycle

```text
Identified
    ↓
In Review
    ↓
Prioritised
    ↓
Linked to Research Question
    ↓
Under Investigation
    ↓
Partially Addressed
    ├── Addressed
    └── Retained as Unresolved
```

External submission and external curation state are separate from the local Research Knowledge Gap lifecycle.

## 19. Knowledge Gap Reference

A `KnowledgeGapReference` points to an externally authoritative Knowledge Platform Knowledge Gap. A local Research Knowledge Gap may link to an external gap after curation, but the local record remains historically traceable.

## 20. Reference Change Alert

A `ReferenceChangeAlert` is a first-class Research Platform record identifying a relevant external change and the local decisions or artefacts that may require review.

### Reference Change Alert — Required Information

- Knowledge Reference;
- previous and current external versions;
- change type;
- verification change;
- impact hypothesis;
- affected Evidence Reviews and Decisions;
- affected Protocol, Intervention, AI configuration, measurement, safety, or finding records;
- priority and safety relevance;
- review owner;
- review state;
- disposition;
- and audit trail.

---

# Part III — Evidence Workspace and Review Workflow

## 21. Evidence Workspace Purpose

The Evidence Workspace is the primary Research Platform interface for evidence discovery, appraisal, comparison, review, decision-making, snapshot creation, gap identification, and change review.

It is not an independent evidence authority and does not replace the Knowledge Platform.

## 22. Evidence Workspace Information Architecture

```text
Evidence Workspace
    ├── Review Context
    ├── Search
    ├── Selected References
    ├── Comparison
    ├── Appraisal
    ├── Conflicts, Nulls and Harms
    ├── Applicability
    ├── Evidence Decision
    ├── Evidence Snapshot
    ├── Research Knowledge Gaps
    ├── Reference Changes
    ├── Review Requests
    └── History and Audit
```

## 23. Evidence Search Capabilities

- natural-language and structured queries;
- concept, theory, mechanism, intervention, population, context, outcome, measurement, risk, guideline, and gap lookup;
- identifier and citation resolution;
- relationship traversal;
- version comparison;
- filtering by evidence type, verification state, directness, population, setting, language, date, harm, burden, accessibility, equity, and implementation;
- search within a Research Question or governed design context;
- saved search strategy where required;
- manual reference entry under governance;
- and capability-aware alternatives when a requested function is unavailable.

## 24. Search Context Requirement

Evidence may be explored without a Research Project context, but it cannot become part of an approved Evidence Decision until it is linked to a defined purpose and governed artefact.

| Context | Representative Purpose |
|---|---|
| Research Question | Determine what is known and what remains uncertain |
| Intervention Version | Assess components, mechanisms, outcomes, risks, safeguards |
| Protocol Version | Support eligibility, dose, delivery, measurement, safety, analysis assumptions |
| Life Story Intervention | Assess identity, meaning, narrative, sharing, trauma, privacy, legacy |
| Governed Community or Platform Public Participation | Assess connection, participation, moderation, privacy, fraud and burden |
| Open Matching | Assess compatibility, explainability, fairness, discrimination, rejection, safety |
| AI Configuration | Assess model-supported task, risks, human review, transferability |
| Measurement Selection | Assess validity, reliability, burden, accessibility, licensing |
| Safety Review | Assess known harms, contraindications, misuse, escalation |
| Research Finding | Interpret local results against prior evidence |

## 25. Evidence Comparison Dimensions

- methodological quality and risk of bias;
- evidence type and research question fit;
- population, setting, language, and cultural relevance;
- intervention, component, configuration, dose, and delivery similarity;
- mechanism alignment;
- outcome and measurement alignment;
- digital-modality and AI-configuration fit;
- directness, consistency, magnitude, precision, and recency;
- follow-up duration;
- implementation feasibility and organisational fit;
- reported burden and harm;
- accessibility and support requirements;
- equity, exclusion, and discrimination;
- privacy, public exposure, fraud, moderation, and misuse;
- transferability;
- conflicts of interest;
- and publication bias where known.

## 26. Evidence Relationship Categories

- Supporting
- Supporting with Conditions
- Conflicting
- Null
- Negative
- Harmful
- Indirect
- Contextual
- Unverified
- Superseded
- Withdrawn
- Missing

These categories support review. They do not independently determine the Evidence Decision outcome, Intervention Evidence Status, Evidence Direction, Protocol approval, or Research Finding.

## 27. Review Tasks and Aggregate State

| Workflow Task or Indicator | Canonical Aggregate State |
|---|---|
| Search strategy incomplete | Evidence Review remains Draft |
| Evidence collection underway | Evidence Review remains Draft |
| Reviewer assigned and assessment active | Evidence Review In Review |
| Additional evidence required | Returned for Revision |
| Human review complete | Evidence Review Approved |
| New approved review replaces old review | Previous review Superseded |
| Review retained only for history | Archived |

## 28. Evidence Decision Workflow

```text
Approved or Reviewable Evidence Review
        ↓
Draft Evidence Decision
        ↓
Record Applicability, Uncertainty, Harms and Conditions
        ↓
Submit Review Request
        ↓
Authorised Human Review
        ├── Approve
        ├── Approve with Conditions
        ├── Reject
        └── Return for Revision
        ↓
Create Evidence Snapshot
        ↓
Apply Decision to Exact Governed Artefact
```

## 29. No Automatic Approval

The Evidence Workspace may calculate:

- coverage indicators;
- reference counts;
- directness summaries;
- conflict flags;
- missing-domain indicators;
- version-difference summaries;
- and draft appraisal tables.

It must not automatically:

- approve an Evidence Review or Evidence Decision;
- assign scientific validity;
- upgrade Intervention Evidence Status;
- assign Evidence Direction;
- select or approve a Protocol;
- approve public or Internet-public deployment;
- approve a matching attribute or ranking policy;
- resolve scientific disagreement;
- suppress contradictory, null, or harmful findings;
- decide that risk is acceptable;
- or convert AI output into an approved record.

---

# Part IV — Knowledge Platform Integration Architecture

## 30. Integration Boundary

The Knowledge Platform Integration capability is the Research Platform's controlled Anti-Corruption Layer for authoritative external knowledge access.

No Research Platform module, AI model, background worker, or user interface should depend directly on Knowledge Platform internal databases or schemas.

## 31. Logical Integration Flow

```text
Research Platform Module or AI Companion
        ↓
Purpose-Bound Evidence Request
        ↓
Permission and Capability Check
        ↓
Knowledge Platform Integration Service
        ↓
MCP / REST / Other Governed Interface
        ↓
Healthy Aging Knowledge Platform
        ↓
Normalised Response with Provenance and Limitations
        ↓
Knowledge Reference
        ↓
Evidence Workspace or Approved AI Context
```

## 32. Integration Responsibilities

- authentication and authorised service identity;
- purpose and requesting-context propagation;
- capability discovery and negotiation;
- MCP tool discovery and invocation where supported;
- REST or other governed request routing;
- query translation;
- response normalisation;
- external identifier and version mapping;
- provenance, citation, verification, and licensing preservation;
- pagination and partial-result handling;
- timeout, retry, rate-limit, and circuit-breaker behaviour;
- schema and capability compatibility checks;
- cache and freshness handling;
- trace, audit, metrics, and alerts;
- and safe degradation.

## 33. Representative Knowledge Capabilities

- evidence search;
- Evidence Claim retrieval;
- concept and terminology lookup;
- theory and mechanism retrieval;
- intervention lookup;
- population and context lookup;
- Outcome Definition retrieval;
- Measurement Definition retrieval;
- citation and source retrieval;
- provenance traversal;
- identifier resolution;
- knowledge relationship traversal;
- curated Knowledge Gap lookup;
- version comparison;
- verification-state lookup;
- and external-submission capability discovery.

## 34. Request Context

- requesting actor or Service Account;
- active role and scope;
- Organisation and Research Project;
- purpose;
- Research Question or governed artefact;
- permission context;
- requested capability;
- query and filters;
- preferred version;
- freshness requirement;
- citation requirement;
- licensing or content-use requirement;
- data classification;
- trace and correlation identifiers.

## 35. Normalised Response

- external system and capability;
- external identifier and resource type;
- label and summary;
- external version;
- source and citation;
- provenance;
- verification or curation state;
- certainty or evidence classification where available;
- population, context, intervention, mechanism, outcome, or measurement relationships;
- publication or update date;
- retrieval timestamp;
- completeness and pagination;
- licensing and content restrictions;
- warnings and capability limitations;
- cache state;
- and trace identifier.

Normalisation must preserve material source distinctions. It must not convert missing source fields into invented certainty or silently map external states to different Research Platform meanings.

## 36. Protocol Preference

MCP is preferred for capability-aware, tool-oriented access where available. REST, GraphQL, file exchange, standards-based APIs, or other governed interfaces may also be used.

The transport protocol does not define the domain boundary.

## 37. AI Access Boundary

The AI Companion retrieves authoritative knowledge through M10. It must not call uncontrolled Knowledge Platform storage, bypass permission and purpose checks, or treat general model knowledge as a substitute for required retrieval.

## 38. External Submission Boundary

```text
Approved Research Finding
        ↓
M14 Evidence Package Preparation
        ↓
M10 Supplies References, Decisions, Snapshots and Provenance
        ↓
Human Review and Submission Approval
        ↓
Knowledge Platform Submission Interface
        ↓
External Curation
        ↓
Accepted • Revised • Rejected • Deferred
        ↓
External Publication Reference
```

The local Research Finding remains a Research Platform record. External acceptance, revision, rejection, or publication does not silently modify its historical content.

---

# Part V — Evidence Use Across Research and Intervention Workflows

## 39. Research Question Development

Evidence services should help researchers:

- determine what is already known;
- identify uncertainty and conflicting evidence;
- distinguish a search failure from a material Research Knowledge Gap;
- refine population, context, mechanism, outcome, and measurement;
- avoid unjustified duplication;
- identify burden, harm, accessibility, equity, privacy, and implementation concerns;
- and create an answerable Research Question.

## 40. Protocol Development

Evidence should support decisions about:

- eligibility and exclusion criteria;
- consent and information requirements;
- intervention version and dose;
- delivery mode and duration;
- public, community, matching, or Life Story visibility controls;
- Supporter involvement;
- AI configuration and human review;
- assessment timing and instrument choice;
- safety monitoring and stopping rules;
- withdrawal criteria;
- data retention and external sharing;
- and analysis assumptions.

Every material evidence-backed Protocol rule should be traceable to an approved Evidence Decision or an explicitly labelled governance requirement, legal requirement, design constraint, or unresolved assumption.

## 41. Intervention Design

Evidence should support:

- target challenge, population, and context;
- components and dose;
- mechanism of action;
- engagement pathway;
- proximal and Healthy Aging outcomes;
- process and implementation outcomes;
- burden and harm;
- accessibility and equity;
- privacy and public-exposure controls;
- safeguards and stopping rules;
- measurement and evaluation;
- and evidence review triggers.

## 42. Intervention Evidence Status and Direction

Document 3 owns Intervention Evidence Status and Evidence Direction. M10 supplies the approved Evidence Decision, Evidence Review, Knowledge References, and Evidence Snapshot that support an assignment.

| Dimension | Canonical Values |
|---|---|
| Evidence Status | E0 Conceptual; E1 Theory-Informed; E2 Evidence-Informed; E3 Evidence-Supported; E4 Locally Evaluated; E5 Replicated |
| Evidence Direction | Not Evaluated; Beneficial; Beneficial with Conditions; Null; Mixed; Harmful; Conflicting; Uncertain |

Evidence Status does not state whether evidence is positive. Evidence Direction does not state evidence maturity. Both are scoped to the exact intervention claim, population, context, version, delivery mode, AI configuration, and outcome basis.

## 43. Evidence Status Assignment Flow

```text
Intervention Version and Claim Scope
        ↓
Evidence Review
        ↓
Quality, Directness, Applicability, Harm and Burden
        ↓
Evidence Decision
        ↓
Human Approval
        ↓
M06 Assigns Evidence Status and Direction
        ↓
Review Trigger Recorded
```

## 44. Measurement Selection

```text
Research Question
        ↓
Construct and Outcome Definition
        ↓
Knowledge Platform Measurement Definition
        ↓
Instrument Evidence Review
        ↓
Population, Language, Accessibility and Burden Assessment
        ↓
Licensing and Scoring Review
        ↓
Evidence Decision
        ↓
Measurement Instrument Reference and Exact Version
```

A validated instrument is not automatically appropriate for every language, setting, ability profile, administration mode, adaptation, or public-social intervention.

## 45. Safety Evidence

Safety evidence review should explicitly include:

- known harms and adverse events;
- contraindications and stopping conditions;
- misuse and coercion;
- privacy and unwanted disclosure;
- harassment, scams, fraud, impersonation, and unwanted contact;
- discrimination and exclusion;
- rejection burden and social comparison;
- emotional distress and trauma activation;
- family or relationship conflict;
- AI misinformation, manipulation, dependency, and impersonation;
- accessibility barriers and support burden;
- moderation failure and delayed response;
- public or Internet-public exposure;
- digital-legacy conflict;
- and uncertainty or absence of safety evidence.

Evidence of possible harm may create a Safety Signal or governance restriction. The evidence module does not confirm a Safety Event or decide clinical risk.

## 46. Interpretation and Research Findings

During interpretation, evidence services should help researchers:

- compare expected and observed mechanisms and outcomes;
- preserve supporting, conflicting, null, negative, harmful, and implementation-failure evidence;
- distinguish intervention failure from delivery or implementation failure;
- consider Participant context, missingness, exposure, fidelity, moderation, and Safety Events;
- avoid overgeneralising from small or selective populations;
- record limitations and alternative explanations;
- and link the Interpretation Record and Research Finding to the historical Evidence Snapshot.

---

# Part VI — Evidence Architecture for the Expanded MVP

## 47. Expanded MVP Evidence Scope

The first MVP includes Ability-Adaptive Social Connection, Life Story and Personal Archive, Governed Community, controlled Platform Public participation, Open Matching and optional AI support.

Evidence integration must therefore cover efficacy, meaning, feasibility, accessibility, safety, privacy, equity, moderation, and implementation—not only social-engagement activity.

## 48. INT-001 — Structured Social Connection

### INT-001 — Evidence Questions

- Does structured, low-pressure interaction increase meaningful reciprocal human contact?
- Which group size, frequency, facilitation, and communication modes are acceptable?
- Which populations and settings benefit or experience burden?
- What distinguishes meaningful interaction from superficial exchange?
- How do moderation, accessibility, and Supporter involvement affect outcomes?

### INT-001 — Evidence Families

- social isolation and loneliness interventions;
- group and one-to-one social-connection interventions;
- community participation;
- peer support;
- digital communication and facilitated interaction;
- qualitative evidence on meaningful connection;
- implementation and accessibility studies;
- online safety and moderation.

### Required Negative and Harm Evidence

- rejection or non-response;
- social comparison;
- unwanted contact;
- harassment and discrimination;
- scams and fraud;
- privacy overexposure;
- support burden;
- superficial interaction being mistaken for connection.

## 49. INT-002 — Interest-Based Connection and Open Matching

### INT-002 — Evidence Questions

- Do shared declared interests improve introduction relevance or sustained interaction?
- Which matching attributes are useful, fair, understandable, and non-stigmatising?
- What explanation is sufficient for informed choice?
- How does mutual acceptance affect safety and autonomy?
- How do rejection, sparse candidate pools, location, language, culture, and accessibility affect experience?
- What monitoring detects discrimination, exclusion, or unequal candidate exposure?

### INT-002 — Evidence Families

- friendship formation and perceived similarity;
- homophily and diversity in social networks;
- recommender-system explainability;
- matching fairness and bias;
- online dating and social-discovery safety where transferable;
- human-computer interaction for older adults;
- fraud, scams, impersonation, and unwanted contact;
- privacy-preserving location and attribute disclosure;
- moderation, blocking, and reporting.

### Important Boundary

Evidence supporting personalised recommendations does not automatically support hidden profiling, sensitive-trait inference, automatic connection, or direct messaging.

Open Matching requires separate evidence and governance for candidate generation, explanation, **Mutual Acceptance**, rejection burden, block propagation, fairness, and safety.

## 50. INT-003 — AI Companion-Facilitated Human Connection

### INT-003 — Evidence Questions

- Does AI reduce initiation or communication burden without replacing human connection?
- Does AI drafting improve autonomy or create misrepresentation?
- Which tasks require confirmation or human review?
- How are dependency, anthropomorphism, misinformation, and privacy risks controlled?
- Does AI-supported matching explanation improve understanding?

### INT-003 — Evidence Boundary

AI interaction volume, satisfaction with AI, or time spent with AI does not demonstrate social connection, relationship quality, autonomy, or Healthy Aging benefit.

## 51. INT-004 — Life Story and Participant-Controlled Personal Archive

### INT-004 — Evidence Questions

- Does Life Story work support self-expression, identity continuity, meaning, recognition, or human conversation?
- Which prompts, media, contribution models, and sharing choices are acceptable?
- What burden, distress, trauma activation, family conflict, or privacy risk occurs?
- How do Participant review and granular sharing affect autonomy?
- What evidence supports digital archive, intergenerational sharing, or legacy use?

### INT-004 — Evidence Families

- narrative identity and continuity theory;
- reminiscence and life-review interventions;
- storytelling and self-expression;
- digital storytelling and personal archives;
- intergenerational communication;
- qualitative evidence on recognition and meaning;
- trauma-informed and grief-sensitive practice;
- privacy, ownership, authorship, and digital legacy;
- accessibility and voice-based capture.

### Required Distinctions

- Life Story is not automatically memory testing.
- Life Story is not automatically cognitive training or rehabilitation.
- Reminiscence evidence does not automatically support cognitive benefit.
- Participant Testimony is not the same as verified historical fact.
- Family contribution is not ownership.
- Public sharing evidence is separate from archive-creation evidence.
- Posthumous access requires separate evidence, consent, legal, and governance analysis.

## 52. INT-005 — Intergenerational Story Sharing

Evidence review should:

- assess reciprocity rather than treating the Participant only as a data source;
- assess family and non-family intergenerational formats separately;
- evaluate contribution, recognition, communication quality, burden, and conflict;
- preserve Participant control over story, audience, reuse, and withdrawal;
- and avoid claiming relationship improvement from content exchange alone.

## 53. Governed Community and Platform Public Participation

### Governed Community and Platform Public Participation — Evidence Questions

- Does community participation increase belonging, reciprocal interaction, or meaningful participation?
- Which visibility and community structures are acceptable and safe?
- How do chronological, interest-based, intervention-purpose, and algorithmic ranking affect exposure and outcomes?
- What moderation, block, report, and appeal model is effective?
- How do harassment, scams, misinformation, discrimination, privacy concern, and unwanted contact affect Participants?
- Does Platform Public provide benefit beyond Connections or Community visibility?

### Required Evidence Families

- online communities and social participation;
- older-adult social-media use;
- community moderation and governance;
- online harassment and discrimination;
- fraud, scams, impersonation, and misinformation;
- privacy and public disclosure;
- algorithmic ranking and recommender systems;
- digital wellbeing and addictive design;
- accessibility and digital inclusion;
- community implementation and support burden.

### Governed Community and Platform Public Participation — Evidence Boundary

Post count, reaction count, follower count, session duration, feed visits, or message count are process or engagement measures. They are not Healthy Aging outcomes without an approved causal and measurement relationship.

## 54. Moderation Evidence

Evidence review should consider:

- report discoverability and accessibility;
- triage accuracy and timeliness;
- human-review quality;
- false positive and false negative effects;
- temporary restriction and restoration;
- appeal fairness and comprehensibility;
- reporter protection;
- moderator burden and wellbeing;
- equity across language, culture, disability, and communication style;
- AI or provider-assistance error;
- links to safety and privacy escalation;
- and impact on community participation and trust.

## 55. Ability-Adaptive Evidence

Evidence review should consider:

- preference-led versus inferred adaptation;
- comprehension and independent completion;
- task burden and error recovery;
- screen reader, read-aloud, voice, simplified, and low-stimulation modes;
- supporter-assisted mode and decision attribution;
- measurement equivalence after adaptation;
- effect on intervention fidelity;
- and risk of hidden capacity or vulnerability inference.

---

# Part VII — Evidence Change and Re-Review

## 56. Change Types

Relevant change types include:

- external resource updated or superseded;
- citation corrected;
- verification state upgraded, downgraded, or withdrawn;
- certainty changed;
- new conflicting, null, negative, or harmful evidence;
- guideline or recommendation changed;
- measurement definition or instrument evidence changed;
- identifier deprecated;
- source unavailable;
- new Research Finding produced locally;
- new Safety Event or Moderation pattern;
- new population, setting, language, or cultural context;
- new public-visibility scope;
- new matching attribute, ranking policy, or AI configuration;
- licensing or usage restriction changed.

## 57. Reference Change Workflow

```text
External Change Detected
        ↓
ReferenceChangeAlert Created
        ↓
Affected Local Records Identified
        ↓
Impact and Urgency Classified
        ↓
Human Review Requested
        ↓
Retain • New Evidence Decision • Restrict • Suspend • Escalate
        ↓
Potential New Protocol / Intervention / AI Configuration Version
        ↓
Re-Consent and Operational Transition Evaluated
```

## 58. Change Impact Dimensions

| Dimension | Examples |
|---|---|
| Informational | Metadata correction without decision impact |
| Scientific | Quality, directness, certainty, conflict, new result |
| Safety | New harm, contraindication, misuse, public or matching risk |
| Protocol | Eligibility, dose, delivery, measurement, stopping rule |
| Intervention | Component, safeguard, evidence status, direction |
| Measurement | Validity, scoring, language, licensing, adaptation |
| AI | Model-supported task, retrieval, review, safety, transferability |
| Privacy and Public Exposure | Visibility, reuse, external publication, location disclosure |
| Community and Matching | Fairness, candidate generation, moderation, block, fraud |
| Legal or Licensing | Use, copying, storage, export, quotation restrictions |

## 59. No Silent Mutation

External evidence change must not automatically:

- alter an Approved Protocol Version;
- rewrite an Approved Evidence Decision;
- change an Intervention Version;
- assign new Intervention Evidence Status or Direction;
- change an AI configuration;
- change a measurement instrument reference;
- change public or matching policy;
- invalidate or alter a locked Dataset Version;
- revise an Interpretation Record or Research Finding;
- remove historical citations or snapshots;
- or publish, restrict, or retire an intervention.

Material change is applied through a new version, new decision, superseding record, Safety Action, or governance decision under accountable human authority.

## 60. Re-Review Triggers

- scheduled review date;
- material Knowledge Platform update;
- verification downgrade or withdrawal;
- new high-quality conflicting evidence;
- new evidence of harm;
- new local Research Finding;
- new Safety Event or repeated moderation concern;
- new target population, language, culture, or setting;
- new delivery mode or visibility scope;
- material intervention or AI change;
- new matching attribute or ranking objective;
- new measurement or material adaptation;
- Protocol amendment;
- licensing change;
- or manual reviewer request.

---

# Part VIII — AI Companion Evidence Assistance

## 61. Permitted AI Assistance

The AI Companion may:

- translate a Research Question into search concepts;
- construct or refine structured queries;
- expand synonyms and terminology mappings;
- retrieve through the governed integration boundary;
- extract structured source information;
- summarise and compare sources;
- draft evidence tables;
- highlight direct and indirect evidence;
- identify possible conflicts, nulls, harms, and missing evidence;
- suggest appraisal questions;
- draft applicability assessments;
- draft Evidence Decision rationale;
- identify potential Research Knowledge Gaps;
- draft reference-change summaries;
- explain evidence in role-appropriate language;
- draft evidence sections for Protocol, intervention, safety, Life Story, community, matching, or moderation review;
- and prepare draft evidence-package content.

## 62. Effective AI Permission

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

## 63. AI Evidence Rules

1. Retrieve before asserting where grounding is required.
2. Preserve external identifier, version, source, and retrieval time.
3. Distinguish source content from AI inference.
4. Distinguish direct from indirect evidence.
5. Represent supporting, conflicting, null, negative, harmful, and insufficient evidence.
6. Do not fabricate citations, theories, mechanisms, measurements, effect estimates, or verification states.
7. Report retrieval failure and incomplete coverage.
8. Preserve licensing and quotation restrictions.
9. Use minimum necessary Participant or project context.
10. Do not expose private Life Story, matching, message, safety, or moderation information without a permitted purpose.
11. Record material model, instruction, retrieval, tool, and policy provenance.
12. Route high-risk or specialist questions to human review.

## 64. Prohibited AI Actions

The AI Companion must not:

- approve an Evidence Review or Evidence Decision;
- assign or upgrade Intervention Evidence Status;
- assign Evidence Direction;
- approve a health, cognitive, clinical, public-safety, matching, or Life Story claim;
- determine consent or decision-making capacity;
- approve a Protocol Version or Intervention Version;
- decide that a risk is acceptable;
- approve public or Internet-public deployment;
- approve a matching attribute or moderation policy;
- confirm or close a Safety Event;
- approve an Interpretation Record or Research Finding;
- publish knowledge;
- alter external verification state;
- hide contradictory evidence;
- or present its synthesis as an original source.

## 65. AI Output Classification

| Dimension | Representative Values |
|---|---|
| Epistemic Type | Retrieved Evidence; Platform Fact; Human Decision; AI Inference; Suggestion; Draft; Unknown |
| Artefact Type | Search Strategy; Summary; Comparison; Evidence Table; Applicability Draft; Decision Draft; Gap Draft; Change Summary |
| Review Status | Not Reviewed; Human Review Required; In Review; Reviewed; Review Rejected; Superseded |
| Approval Status | Not Applicable; Not Approved; Approved; Approved with Conditions; Rejected; Withdrawn |
| Safety Classification | Routine; Sensitive; High Risk; Prohibited; Escalation Required |
| Grounding Status | Grounded; Partially Grounded; Retrieval Failed; Source Unavailable; General Model Knowledge |

These dimensions must not be collapsed into a single `AI Output Status`.

## 66. AI Retrieval Priority

1. approved project records;
2. authorised Knowledge Platform retrieval;
3. approved Evidence Decisions and Evidence Snapshots;
4. approved Research Findings within permitted scope;
5. explicit human decisions;
6. clearly labelled general model knowledge only when permitted and not represented as retrieved evidence.

## 67. AI Failure Behaviour

The AI Companion should:

- state that retrieval failed or coverage is incomplete;
- avoid answering as though authoritative evidence was retrieved;
- preserve the failed query and trace;
- offer manual search or human review;
- not reuse stale content without freshness disclosure;
- and not execute a pending evidence-backed action after recovery without renewed validation where required.

---

# Part IX — Caching, Storage, Licensing and Degraded Modes

## 68. Local Storage Categories

| Category | Purpose | Authority |
|---|---|---|
| Knowledge Reference | Stable external reference and metadata | External resource remains authoritative |
| Evidence Snapshot | Immutable research reproducibility record | Historical local record |
| Cache Entry | Performance and resilience | Not evidence authority |
| Citation Record | Reporting and source presentation | Derived reference record |
| AI Retrieval Record | Traceability of AI grounding | Not an Evidence Decision |
| Manual Source Record | Governed use when integration is unavailable | Requires explicit source and review |

## 69. Cache Requirements

Cached content must preserve:

- source identifier and version;
- retrieval time;
- verification state;
- provenance;
- completeness;
- licensing and access restrictions;
- expiry and revalidation policy;
- integrity information;
- data classification;
- cache state;
- and links to local references or snapshots.

## 70. Cache States

- Fresh
- Stale but Usable
- Stale and Review Required
- Expired
- Invalidated
- Source Unavailable
- Verification Changed

Cache state is operational metadata. It is separate from Evidence Review state, Evidence Decision approval, external verification, and Evidence Snapshot status.

## 71. Licensing and Restricted Content

- Do not cache, quote, export, or include content beyond licence or contractual permission.
- Prefer identifiers, metadata, and permitted structured summaries where full content cannot be retained.
- Preserve attribution and required citation forms.
- Record whether a snapshot is complete, partial, metadata-only, or reference-only.
- Do not place restricted content into general AI context or logs.
- Apply deletion or access restriction without erasing required historical reference and audit.

## 72. Knowledge Platform Unavailable

The Research Platform may continue to provide:

- existing Research Platform records;
- approved Evidence Decisions;
- Evidence Snapshots;
- cached Knowledge References where permitted;
- Protocol, intervention, Life Story, community, matching, safety, dataset, analysis, and reporting workflows where safe;
- and read-only historical evidence context.

The platform should disable or clearly label:

- live evidence search;
- fresh verification and version checks;
- current identifier resolution;
- live provenance traversal;
- automated reference-change monitoring;
- and approvals requiring current safety- or Protocol-critical verification.

## 73. Degraded-Mode Action Classes

| Action Class | Meaning |
|---|---|
| Continue | Current evidence freshness is not required for this action |
| Continue with Warning | Stale or partial evidence is visible and accepted for the task |
| Read Only | Historical information may be reviewed but not changed or applied |
| Human Review Required | Manual assessment may proceed |
| Pause Approval | Approval waits for current authoritative verification |
| Block | Action is unsafe, impermissible, or scientifically unsupported in degraded mode |

## 74. Other Failure Modes

| Failure | Required Behaviour |
|---|---|
| Incomplete Provenance | Display for review; do not imply approval |
| Unsupported Capability | Disclose limitation; offer supported or manual alternative |
| Stale Cache | Show freshness and restrict critical use |
| Unresolvable Identifier | Preserve historical reference and route review |
| Conflicting Evidence | Compare and request human review |
| Permission Denied | Do not disclose restricted source or protected existence |
| Licensing Restriction | Use permitted metadata/reference-only mode |
| AI Retrieval Failure | Disclose failure and avoid fabricated grounding |
| Partial Results | Show incompleteness and pagination state |

---

# Part X — Permission, Governance, Audit and Observability

## 75. Permission Foundation

```text
Role
+ Relationship
+ Consent
+ Purpose
+ Context
+ Specific Permission
+ Resource State
```

Public evidence retrieval may not require Participant consent. Participant-specific applicability analysis, private Life Story evidence use, safety review, matching evaluation, restricted sources, datasets, or external submission may require additional consent, project assignment, purpose, and approval.

## 76. Representative Permissions

- search external knowledge;
- view provenance and restricted source metadata;
- create and resolve Knowledge References;
- create or edit an Evidence Review;
- submit an Evidence Review for review;
- create an Evidence Decision Draft;
- approve an Evidence Decision;
- create an Evidence Snapshot;
- identify or prioritise a Research Knowledge Gap;
- link an external Knowledge Gap Reference;
- review a Reference Change Alert;
- view Participant-specific applicability context;
- prepare evidence-package inputs;
- approve or submit an External Submission;
- manage integration configuration;
- and access audit records.

## 77. Separation of Duties

- The drafter of a high-impact Evidence Decision should not be its sole approver.
- AI is never an approver.
- External submission requires separate approval from local Finding approval where applicable.
- Safety-relevant evidence changes require an authorised Safety Reviewer.
- Privacy- or Internet-public evidence decisions may require Privacy Reviewer approval.
- Matching fairness or discrimination decisions may require independent review.
- System Administrator access does not create evidence-governance authority.
- Knowledge Platform external curation authority remains separate from Research Platform approval.

## 78. Participant Data Boundary

- External evidence queries should normally use de-identified or abstracted research context.
- Identifiable Participant data is not sent unless necessary, authorised, supported, and protected.
- Private Life Story text, messages, matching history, Safety Events, or moderation evidence should not enter external queries by default.
- AI context and audit use minimum necessary data.
- Search terms derived from sensitive Participant data are treated as sensitive records.

## 79. Review and Approval Records

- Review Request state remains separate from Evidence Review or Evidence Decision state.
- Approval applies to an exact version.
- Approval conditions remain visible and enforceable.
- Conflict of Interest and recusal are recorded.
- Superseded decisions remain traceable.
- A new external source or local Finding does not silently revoke an old approval; it creates a review trigger.

## 80. Audit Records

The platform should record:

- actor, role, scope, purpose, and project context;
- search query and filters where retention is permitted;
- capability and external system used;
- retrieved identifiers and versions;
- retrieval time, cache state, and warnings;
- Knowledge References created, attached, resolved, or changed;
- Evidence Review actions and comments;
- Evidence Decision drafts, reviews, approvals, conditions, supersession, and withdrawal;
- Evidence Snapshot creation;
- Research Knowledge Gap actions;
- Reference Change Alerts and dispositions;
- AI model, instruction, retrieval, tool, output, and human review;
- evidence-package preparation and external submission;
- and permission or policy decision references.

## 81. Observability

Operational monitoring should include:

- request volume and latency;
- external error, timeout, retry, and rate-limit rates;
- capability availability;
- cache hit and stale-cache rates;
- identifier-resolution failures;
- provenance and citation completeness;
- licensing restriction encounters;
- Reference Change Alert volume and age;
- unreviewed critical or safety-relevant alerts;
- Evidence Review and Decision cycle time;
- AI retrieval failure and partial-grounding rates;
- manual-source entry and unresolved provenance;
- and external-submission failures.

## 82. Traceability Chain

```text
Human or AI-Assisted Search
        ↓
Permission and Purpose Decision
        ↓
Integration Request and External Response
        ↓
Knowledge Reference
        ↓
Evidence Review
        ↓
Evidence Decision
        ↓
Evidence Snapshot
        ↓
Protocol / Intervention / Measurement / Safety Decision
        ↓
Dataset, Interpretation and Research Finding
        ↓
Evidence Package and External Submission
```

---

# Part XI — Conceptual Services, Events and Data Contracts

## 83. Canonical Aggregate Roots

| Aggregate Root | Owning Context |
|---|---|
| KnowledgeReference | Evidence and Knowledge Integration |
| EvidenceReview | Evidence and Knowledge Integration |
| EvidenceDecision | Evidence and Knowledge Integration |
| EvidenceSnapshot | Evidence and Knowledge Integration |
| ResearchKnowledgeGap | Evidence and Knowledge Integration |
| ReferenceChangeAlert | Evidence and Knowledge Integration |

ResearchFinding is owned by Analysis, Interpretation and Findings. EvidencePackage and ExternalSubmission are owned by Reporting and External Submission.

## 84. Representative Entities and Value Objects

| Type | Representative Concepts |
|---|---|
| Entities | EvidenceSearch; EvidenceAppraisal; CitationRecord; KnowledgeGapExternalSubmission; Review Comment |
| Value Objects | ExternalIdentifier; VersionReference; RetrievalContext; ProvenanceRecord; ApplicabilityAssessment; DirectnessAssessment; EvidenceClassification; VerificationState; ReviewTrigger; ChangeImpact; CacheState |

## 85. Representative Domain Services

- KnowledgeReferenceService
- IdentifierResolutionService
- EvidenceSearchService
- EvidenceReviewService
- EvidenceApplicabilityService
- EvidenceDecisionService
- EvidenceSnapshotService
- ReferenceChangeService
- ResearchKnowledgeGapService
- ProvenanceService
- CitationService
- LicensingPolicyService
- InterventionEvidenceAssignmentSupportService
- EvidencePackageInputService
- EvidenceAuditService

## 86. Representative Domain Events

- EvidenceReviewCreated
- KnowledgeReferenceAttached
- KnowledgeReferenceResolved
- KnowledgeReferenceResolutionFailed
- EvidenceReviewSubmitted
- EvidenceReviewApproved
- EvidenceReviewReturnedForRevision
- EvidenceDecisionDrafted
- EvidenceDecisionRecorded
- EvidenceDecisionApproved
- EvidenceDecisionApprovedWithConditions
- EvidenceDecisionRejected
- EvidenceDecisionSuperseded
- EvidenceSnapshotCreated
- ExternalEvidenceChangeDetected
- ReferenceChangeAlertCreated
- EvidenceReReviewRequired
- ResearchKnowledgeGapIdentified
- ResearchKnowledgeGapPrioritised
- ResearchKnowledgeGapLinkedToQuestion
- KnowledgeGapExternalSubmissionCreated
- EvidencePackageInputPrepared

`ExternalEvidenceChanged`, `KnowledgeGapIdentified`, and `KnowledgeGapSubmitted` may be retained as legacy integration aliases only if explicitly mapped. Canonical domain events use the names above.

## 87. Event Metadata

Representative event metadata includes:

- event ID and version;
- aggregate type, ID, and version;
- actor or Service Account;
- Organisation and Research Project;
- purpose;
- occurred time;
- correlation, causation, and trace IDs;
- external system and identifier where relevant;
- data classification;
- and schema version.

## 88. API Resource Guidance

```text
/evidence-reviews
/evidence-reviews/{id}/references
/evidence-reviews/{id}/submit
/evidence-decisions
/evidence-decisions/{id}/approve
/evidence-snapshots
/knowledge-references/{id}/resolve
/research-knowledge-gaps
/reference-change-alerts/{id}/review
/knowledge-platform/capabilities
/knowledge-platform/search
```

APIs should expose domain resources and explicit state transitions, not generic database CRUD.

---

# Part XII — MVP Evidence and Knowledge Integration Scope

## 89. MVP Objective

The MVP must provide sufficient evidence integration to support one governed Research Question-to-Research Finding cycle for the expanded intervention set:

- INT-001 — Structured Social Connection;
- INT-002 — Interest-Based Connection and Open Matching;
- INT-003 — optional AI Companion-Facilitated Human Connection;
- INT-004 — Life Story and Participant-Controlled Personal Archive;
- INT-005 — optional Intergenerational Story Sharing;
- INT-008 — Participant-Controlled Family and Care Network;
- INT-009 — Ability-Adaptive Onboarding and Navigation;
- and Governed Community and Platform Public participation capability.

## 90. MVP Required Capabilities

- Knowledge Platform Integration Service;
- MCP client and REST fallback where available;
- capability discovery;
- purpose-bound evidence search;
- Evidence Workspace;
- Knowledge Reference creation and resolution;
- provenance, citation, version, and verification display;
- Evidence Review with canonical lifecycle;
- Evidence Decision with canonical outcomes;
- basic applicability appraisal;
- immutable Evidence Snapshot;
- manual Research Knowledge Gap records;
- manual Reference Change Alert creation and review;
- evidence support for Intervention Evidence Status and Direction assignment;
- Life Story, community, matching, moderation, accessibility, privacy, and AI evidence categories;
- citation-preserving AI summaries and drafts;
- permission enforcement;
- audit logging;
- basic cache and degraded-mode behaviour;
- and one governed evidence-package input format.

## 91. MVP Evidence Workflow

```text
Research Question
        ↓
Create Evidence Review
        ↓
Search Knowledge Platform
        ↓
Review Provenance and Select Knowledge References
        ↓
Assess Directness, Applicability, Burden, Harm, Equity and Safety
        ↓
Record Conflicting, Null, Harmful and Missing Evidence
        ↓
Draft and Approve Evidence Decision
        ↓
Create Evidence Snapshot
        ↓
Link to Protocol Version and Intervention Version
        ↓
Assign Evidence Status and Direction through M06
        ↓
Set Re-Review Trigger
```

## 92. MVP Evidence Review Packages

| Package | Minimum Topics |
|---|---|
| Social Connection | meaningful interaction, loneliness, reciprocity, community participation, burden, safety |
| Open Matching | shared interests, explainability, fairness, discrimination, rejection, fraud, mutual acceptance |
| Life Story | identity, narrative, self-expression, reminiscence boundaries, trauma, privacy, legacy |
| Governed Community and Platform Public Participation | community benefit, moderation, harassment, scams, privacy, ranking and addictive-design risk |
| AI Companion | initiation burden, drafting, facilitation, dependency, impersonation, privacy, human review |
| Ability Adaptation | accessibility, comprehension, independence, burden, measurement equivalence |
| Measurement | construct, validity, language, adaptation, burden, licensing |
| Safety and Moderation | signal detection, response, escalation, false decisions, appeal, equity |

## 93. MVP Constraints

- limited Knowledge Platform capabilities may be available;
- reference-change detection may be manual or scheduled rather than continuous;
- version comparison may be metadata- or text-summary based;
- evidence synthesis remains human-led with AI drafting support;
- Research Knowledge Gaps may be researcher-authored;
- external submission may use one governed package format;
- Internet Public evidence approval may remain outside the Pilot if Internet Public is disabled;
- formal systematic-review automation is deferred;
- and no evidence automation may create an approved decision.

## 94. MVP Non-Goals

- automated systematic reviews;
- continuous global evidence surveillance;
- autonomous evidence grading;
- autonomous Intervention Evidence Status assignment;
- autonomous safety or matching-policy approval;
- automatic external Knowledge Publication;
- unrestricted two-way Knowledge Platform write-back;
- federated multi-organisation evidence governance;
- real-time guideline execution;
- or unrestricted evidence agents.

---

# Part XIII — Deferred Capabilities and Future Evolution

## 95. Deferred Capabilities

- continuous reference monitoring;
- semantic evidence comparison;
- advanced conflict and contradiction detection;
- systematic-review workflow support;
- evidence graph visualisation;
- cross-project evidence reuse;
- federated evidence sources;
- machine-readable guideline evaluation;
- advanced evidence synthesis;
- automated measurement recommendation for human review;
- advanced Evidence Package validation;
- external reviewer collaboration portals;
- fairness and moderation evidence dashboards;
- matching-policy simulation;
- public-visibility risk simulation;
- and multi-organisation evidence governance.

## 96. Future Evolution

Future versions may support:

- living Evidence Reviews;
- continuous safety and moderation evidence surveillance;
- Protocol and intervention impact simulation;
- automated dependency mapping;
- reproducible AI-assisted synthesis;
- formal evidence grading frameworks;
- evidence-quality calibration;
- richer provenance graphs;
- Research Finding-to-knowledge lineage;
- policy evidence integration;
- cross-study research observatories;
- and governed Knowledge Platform submission and response automation.

Future automation must preserve human accountability, external Knowledge Platform authority, local decision versioning, licensing, and the visibility of uncertainty and contradictory evidence.

---

# Part XIV — Open Questions

1. Which Knowledge Platform capabilities are available through MCP and REST for the MVP?
2. What external identifier and version semantics are authoritative?
3. Which verification and evidence-classification states are available?
4. Which evidence content may be stored in full, partially, or as reference-only?
5. Which licensing and quotation rules apply?
6. Which Evidence Decisions require independent or dual approval?
7. Which safety, privacy, public-social, matching, and AI decisions require specialist review?
8. Which Evidence Review templates are required for the initial intervention package?
9. Which appraisal dimensions are mandatory versus optional in the MVP?
10. Which directness and applicability scales should be used?
11. Which Evidence Snapshot types are required for Protocol and intervention approval?
12. Which reference changes block approval or active delivery?
13. Which evidence changes automatically create a Safety Signal or urgent review?
14. Which Research Knowledge Gap priorities are used?
15. Which local gaps should be submitted to the Knowledge Platform?
16. Which Evidence Status and Direction assignments require separate approvals?
17. Which evidence is sufficient to support Platform Public participation?
18. Is Internet Public enabled in the Pilot, and what additional evidence is required?
19. Which matching attributes require separate Evidence Decisions?
20. Which fairness and discrimination measures apply to Match Candidate generation?
21. Which moderation outcomes and service levels require evidence support?
22. Which Life Story claims are permitted in Participant and public-facing language?
23. Which reminiscence, narrative-identity, digital-storytelling, and cognitive evidence must remain separated?
24. Which digital-legacy choices are supportable?
25. Which AI evidence tasks and tools are approved?
26. Which AI outputs require mandatory reviewer acceptance?
27. Which stale-cache states permit Protocol, safety, public-social, or matching decisions?
28. Which evidence records enter Dataset Versions?
29. Which evidence and source metadata may be included in external Evidence Packages?
30. Which domain events become public Integration Events?

---

# Part XV — Design Decisions

1. Document 9 is the authoritative Handbook source for Research Platform evidence-integration workflows.
2. The Healthy Aging Knowledge Platform remains an external authoritative system.
3. M10 is the canonical Research Platform boundary for external knowledge retrieval and local evidence workflow.
4. The Healthy Aging Knowledge Graph is a Knowledge Platform capability, not the whole platform.
5. External knowledge is referenced rather than uncontrolledly duplicated.
6. KnowledgeReference is distinct from the external resource.
7. Knowledge Reference lifecycle, resolution, version relationship, verification relationship, and snapshot availability are separate dimensions.
8. EvidenceReview is a first-class aggregate.
9. The canonical Evidence Review lifecycle is Draft, In Review, Approved, Returned for Revision, Superseded, and Archived.
10. Search progress and evidence completeness are workflow indicators, not Evidence Review states.
11. EvidenceDecision is a first-class, human-accountable local aggregate.
12. Evidence Decision outcome is separate from approval state.
13. Canonical Evidence Decision outcomes are Support, Support with Conditions, Insufficient Evidence, Conflicting Evidence, Restrict, Do Not Proceed, and Research Required.
14. Provisional, Deferred, Not Applicable, and Requires Specialist Review are not canonical Evidence Decision outcomes.
15. EvidenceDecision is distinct from Intervention Evidence Status and Evidence Direction.
16. Document 3 owns Intervention Evidence Status and Evidence Direction.
17. M10 supplies approved evidence records supporting status and direction assignment.
18. Evidence Status and Evidence Direction are separately displayed and scoped.
19. EvidenceSnapshot is an immutable entity, not a value object or cache entry.
20. Live external knowledge and historical Evidence Snapshots remain distinct.
21. ResearchKnowledgeGap is distinct from a curated external Knowledge Gap.
22. KnowledgeGapReference links to an external authoritative gap without replacing the local record.
23. ReferenceChangeAlert is a first-class aggregate.
24. External evidence change triggers review rather than silent mutation.
25. Approved Protocol, Intervention, AI, measurement, Dataset, Interpretation, and Finding records are not silently changed by external updates.
26. ResearchFinding is owned by M13, not M10.
27. EvidencePackage and ExternalSubmission are owned by M14, not M10.
28. M10 provides evidence references, decisions, snapshots, and provenance to external-submission preparation.
29. External curation does not silently rewrite the local Research Finding.
30. Evidence appraisal is fit-for-purpose and does not rely on one automated hierarchy.
31. Direct, indirect, supporting, conflicting, null, negative, harmful, and missing evidence remain visible.
32. No Evidence Found is distinct from Evidence of No Effect and Evidence of Harm.
33. Applicability is assessed for exact population, context, version, delivery, modality, ability, risk, and public-use scope.
34. Evidence does not automatically transfer between private, community, Platform Public, and Internet Public use.
35. Life Story evidence is separated from cognitive testing, training, and rehabilitation evidence.
36. Participant Testimony is distinct from verified historical fact.
37. Life Story creation evidence is distinct from public sharing and digital-legacy evidence.
38. Open Matching requires evidence for explainability, fairness, mutual acceptance, rejection burden, privacy, fraud, and safety.
39. Governed Community and Platform Public participation require evidence for meaningful connection, moderation, harassment, scams, privacy, ranking, accessibility and dependency risk.
40. Moderation activity is evaluated through process, safety, equity, and experience outcomes.
41. Social and AI engagement metrics are not Healthy Aging outcomes by themselves.
42. AI accesses authoritative knowledge through M10.
43. AI permission is evaluated before context assembly and retrieval.
44. AI may retrieve, compare, summarise, extract, and draft but may not approve or publish.
45. AI output classifications remain multidimensional.
46. AI synthesis is never represented as an original evidence source.
47. AI retrieval failure is disclosed and does not produce fabricated grounding.
48. Caching does not create a local evidence authority.
49. Licensing and content restrictions are preserved in references, snapshots, caches, AI context, and exports.
50. Participant-identifiable context is not sent externally by default.
51. Permission applies to evidence discovery, restricted source access, Participant-specific applicability, and external submission.
52. Review and approval apply to exact versions.
53. Audit connects search, retrieval, references, review, decisions, snapshots, governed artefacts, findings, and submissions.
54. MCP is preferred where available but does not define the domain boundary.
55. Failure and degraded modes remain explicit.
56. The expanded MVP includes evidence work for Life Story, Governed Community, Platform Public participation, Open Matching, moderation, AI and ability adaptation.
57. No automated process may create an approved Evidence Decision in the MVP.

## 97. Summary

```text
Authoritative External Knowledge
        ↓
Knowledge Platform Anti-Corruption Layer
        ↓
Knowledge Reference
        ↓
Evidence Review
        ↓
Evidence Decision
        ↓
Evidence Snapshot
        ↓
Protocol / Intervention / Measurement / Safety Decision
        ↓
Delivery and Evaluation
        ↓
Research Finding
        ↓
Evidence Package and External Submission
        ↓
Governed Knowledge Curation
```

The Evidence & Knowledge Integration Architecture is successful when every material claim and design decision can be traced to authoritative references, a defined review purpose, explicit applicability and uncertainty, accountable human approval, an immutable historical snapshot, and a governed response to future evidence change.
