# Document 17 — AI Orchestration & Model Operations

**Version:** 1.1  
**Status:** Revised AI Orchestration and Model Operations Baseline  
**Handbook Volume:** Volume II — Technical Architecture  
**Primary System:** Digital Intervention Research Platform  
**Primary Product Module:** M11 — AI Companion  
**Related Product Modules:** M01–M18  
**Document Owner:** AI Architecture and Model Governance  
**Approved By:** To be assigned  
**Last Updated:** 2026-07-29  
**Supersedes:** Document 17 — AI Orchestration & Model Operations v1.0  
**Review Trigger:** A material change to AI roles, model providers, model aliases, AI configuration, system or task instructions, retrieval, context assembly, memory, tools, Action Levels, Life Story assistance, Community or matching assistance, messaging, moderation, Safety Signal routing, analytical code execution, evaluation, rollout, drift, provider terms, retention, monitoring, incidents, kill switches, or applicable legal, research, ethics, safety, privacy or security obligations

---

## 1. Purpose

This document defines the **AI Orchestration & Model Operations Architecture** of the **Healthy Aging Digital Intervention Research Platform**.

It translates Documents 0–16 into implementable controls for:

- AI request orchestration;
- model and provider selection;
- AI Intervention Configuration;
- instruction and prompt management;
- permission-aware Context Assembly;
- Knowledge and Platform retrieval;
- Tool Registry and Action Levels;
- Participant confirmation and Human Review;
- Life Story transcription, drafting and organisation;
- Community and social-content assistance;
- Open Matching explanation and preference assistance;
- Message drafting;
- moderation triage;
- Safety Signal detection and escalation;
- AIMemoryItem lifecycle;
- personalisation and ability-adaptive presentation;
- AI-assisted research and analysis;
- model evaluation, release, monitoring and rollback;
- provider data policy;
- cost, latency, availability and quotas;
- security, privacy, retention and deletion;
- incident response;
- and research reproducibility.

The central rule is:

> AI may assist, draft, retrieve, explain, recommend and propose, but domain authority remains with deterministic Platform policies, owning modules and accountable human decisions.

---

## 2. Scope

This document covers:

- AI subsystem position;
- AI roles and allowed task categories;
- AI risk and Action Levels;
- prohibited autonomous actions;
- AI Orchestrator responsibilities;
- AIInteraction lifecycle and records;
- AI configuration resolution;
- AIInterventionConfigurationVersion;
- Model Gateway and provider adapters;
- model registry, aliases, selection and routing;
- provider-data policy and jurisdiction;
- instruction hierarchy and prompt registry;
- Context Assembly and source classification;
- permission, Consent, purpose, Visibility, Block and Resource State filtering;
- retrieval planning, grounding and citations;
- Knowledge Platform and Research Platform retrieval;
- Search and Vector retrieval;
- Tool Registry and Tool Contract;
- confirmation, Human Review and owning-domain execution;
- output validation and classification;
- Life Story assistance;
- Public Profile, Community and social-content assistance;
- Open Matching and Connection safeguards;
- messaging assistance;
- moderation assistance;
- SafetySignal routing;
- AI memory and personalisation;
- ability adaptation;
- provider operations;
- evaluation datasets and methods;
- fairness, accessibility, dependency and human-connection evaluation;
- release, shadow, canary, rollback and kill switch;
- observability, logging and audit;
- research reproducibility;
- AI-assisted analysis and controlled code execution;
- retention, deletion and provider deletion;
- security, prompt injection and isolation;
- governance, approvals and separation of duties;
- MVP architecture and non-goals;
- deferred capabilities;
- and future evolution.

This document does not define:

- final provider contracts;
- final prompt text;
- final model choices;
- final clinical or emergency protocols;
- final statistical analysis plans;
- final security runbooks;
- final user-interface wording;
- or final legal Consent language.

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
- Document 14 — Security, Privacy & Consent Architecture v1.1
- Document 15 — API, Event & Integration Specifications v1.1
- Document 16 — Database & Storage Design v1.1

### Provides input to

- Document 18 — MVP Scope & Delivery Roadmap revision
- Document 19 — Initial Pilot Research Protocol revision
- Document 20 — UX Flows & Design System Specification revision
- AI Model Registry
- Model Cards
- Prompt Cards
- Tool Cards
- AI Configuration Cards
- Provider Review Records
- Evaluation Plans and Reports
- AI Incident Runbook
- AI Release and Rollback Runbooks
- AI Monitoring Dashboards
- Red-Team Test Suites

### Authority Hierarchy

| Subject | Authority |
|---|---|
| Aggregate ownership and canonical state | Document 8 |
| AI product purpose and boundaries | Document 10 |
| Research and evaluation lifecycle | Document 11 |
| Data classification and lineage | Document 12 |
| Runtime placement | Document 13 |
| Security, privacy and Consent | Document 14 |
| API, event and tool contracts | Document 15 |
| AI storage | Document 16 |
| AI orchestration and model operations | Document 17 v1.1 |

---

## 4. AI Architecture Objectives

### 4.1 Domain Safety

AI cannot bypass aggregate ownership or deterministic domain invariants.

### 4.2 Permission Safety

Restricted data are filtered before they reach retrieval, prompt construction, provider invocation or tools.

### 4.3 Participant Autonomy

The Participant retains control of Life Story, matching, Connections, messages, AI memory, visibility and withdrawal.

### 4.4 Research Reproducibility

Material AI behaviour remains traceable to exact configuration, model, instruction, retrieval, tools, memory and evaluation.

### 4.5 Provider Independence

Provider-specific APIs and behaviour remain behind a controlled Model Gateway.

### 4.6 Human Accountability

High-impact outputs and actions require explicit confirmation, authorised review or approval.

### 4.7 Ability Adaptation

AI may adapt presentation and interaction without changing rights, Consent meaning, Protocol, evidence claims or Outcome Definition.

### 4.8 Safe Failure

AI unavailability or uncertainty does not block core non-AI Participant, safety or research workflows.

### 4.9 Measurable Behaviour

Quality, safety, accessibility, fairness, dependency, latency, cost and research impact are observable.

### 4.10 Minimum Exposure

Only minimum-necessary authorised context is sent to a model provider.

---

## 5. AI System Position

```text
Participant, Researcher or Platform Workflow
        ↓
AI Request Interface
        ↓
M11 AI Orchestrator
        ├── Identity and Permission Resolution
        ├── Task and Risk Classification
        ├── AI Configuration Resolution
        ├── Context Assembly
        ├── Knowledge and Platform Retrieval
        ├── Prompt Resolution
        ├── Model Routing
        ├── Tool Proposal and Execution
        ├── Output Validation
        ├── Safety and Moderation Routing
        └── Confirmation or Human Review
        ↓
Owning-Domain Result, Draft or Safe Response
```

The AI Orchestrator is the only Platform component permitted to call model providers.

Domain modules do not call provider SDKs directly.

---

## 6. AI Roles

### 6.1 Research Workflow Assistant

Supports:

- Research Question refinement;
- evidence search and summarisation;
- Protocol and report drafting;
- data documentation;
- qualitative coding suggestions;
- analysis documentation;
- and research administration.

### 6.2 Intervention Delivery Component

Supports:

- guided activities;
- reflection;
- ability-adaptive assistance;
- Life Story prompts;
- social-connection facilitation;
- reminders;
- and structured support.

### 6.3 Participant Companion

Provides optional conversational support without impersonating a human, claiming emotional need or replacing human relationships.

### 6.4 Life Story Assistant

Supports transcription, translation, organisation and Draft wording without inventing or confirming memories.

### 6.5 Community and Connection Assistant

Supports Community discovery, content drafting, MatchExplanation and introduction drafting without accepting matches or creating Connections.

### 6.6 Moderation and Safety Assistant

Provides provisional triage and SafetySignal routing without final ModerationDecision or SafetyEvent authority.

### 6.7 Object of Research

The Platform may study AI usefulness, safety, accessibility, personalisation, trust, fairness, dependency and Healthy Aging impact.

Each Research Project declares which roles apply.

---

## 7. AI Task Categories

Representative categories include:

- Explain;
- Search;
- Summarise;
- Draft;
- Compare;
- Extract;
- Classify;
- Translate;
- Transcribe;
- Recommend;
- Personalise;
- Guide;
- Generate Structured Data;
- Propose Tool;
- Execute Confirmed Tool;
- Monitor;
- Triage;
- and Escalate.

Each category maps to:

- allowed models;
- permitted data classes;
- grounding;
- retrieval sources;
- tools;
- Action Level;
- validation;
- confirmation;
- review;
- retention;
- and evaluation.

---

## 8. AI Risk and Action Levels

### Level 0 — Explain or Retrieve

Read-only public or low-risk permitted information.

### Level 1 — Suggest

Recommendations or options with no state change.

### Level 2 — Draft

Creates Draft content or proposed structured data without publication or external effect.

### Level 3 — Confirmed Reversible Action

Executes a reversible action after explicit actor confirmation and current policy checks.

### Level 4 — Controlled Workflow Action

Creates or advances a governed workflow requiring authorised review or approval.

### Level 5 — Prohibited Autonomous Action

AI cannot autonomously perform the action.

Risk Level is task-, context- and data-specific rather than a fixed property of a model.

---

## 9. Prohibited Autonomous Actions

AI must not autonomously:

- grant, alter or withdraw Consent;
- infer or create substitute authority;
- enrol, withdraw or discontinue a Participant;
- diagnose, prescribe or make emergency clinical decisions;
- determine decision-making capacity;
- approve a ProtocolVersion;
- approve an InterventionVersion;
- approve an EvidenceDecision;
- publish Life Story or SocialPost content without required confirmation;
- publish Internet Public content;
- accept a MatchCandidate on behalf of a Participant;
- create a Connection;
- send an unauthorised Message;
- create fake users, reactions or social proof;
- impose high-impact ModerationDecision;
- identify a reporter to an unauthorised actor;
- confirm, resolve or close a SafetyEvent;
- lock a DatasetVersion;
- approve an AnalysisPlan;
- approve an InterpretationRecord;
- approve a ResearchFinding;
- publish knowledge;
- override permission, Visibility or Block;
- change LegacyPreference;
- delete protected records without an authorised workflow;
- or make irreversible high-impact decisions.

---

## 10. AI Orchestrator Responsibilities

The AI Orchestrator:

- receives AIInteraction requests;
- resolves actor, role, Organisation, Research Project and purpose;
- evaluates human and AI permission;
- classifies task and risk;
- resolves AI configuration;
- assembles minimum context;
- retrieves authorised evidence and records;
- resolves instructions and output schema;
- selects model and provider;
- proposes and executes permitted tools;
- validates output;
- applies safety and moderation controls;
- routes confirmation or review;
- records provenance;
- and returns a structured result.

The Orchestrator does not own:

- Consent;
- ParticipantProfile;
- LifeStoryArchive;
- MatchPreference;
- Connection;
- Message;
- ModerationCase;
- SafetyEvent;
- DatasetVersion;
- AnalysisPlan;
- or ResearchFinding.

---

## 11. Canonical AI Interaction Lifecycle

```text
AIInteraction Requested
        ↓
Identity, Session and Purpose Resolved
        ↓
Human Permission Evaluated
        ↓
AI Task, Risk and Action Level Classified
        ↓
AI Configuration Resolved
        ↓
Visibility, Block and Resource State Applied
        ↓
Context and Retrieval Plan Built
        ↓
Prompt and Output Schema Resolved
        ↓
Model Invoked through Gateway
        ↓
Output Classified and Validated
        ↓
Tool Proposed if Needed
        ↓
Confirmation or Human Review
        ↓
Owning-Domain Command
        ↓
Confirmed Result, Draft, Denial or SafetySignal
        ↓
Audit, Evaluation and Cost Recorded
```

No skipped stage may be assumed from model confidence.

---

## 12. AIInteraction Record

An `AIInteraction` preserves:

- Interaction ID;
- actor and role;
- Organisation and Research Project;
- Participant and resource scope where permitted;
- purpose;
- task category;
- risk and Action Level;
- AI configuration version;
- model alias and resolved provider model;
- instruction and output-schema versions;
- Context references;
- retrieval records;
- provider request metadata;
- output classifications;
- tool invocations;
- confirmations and Human Reviews;
- final owning-domain result;
- SafetySignal or incident links;
- latency, tokens and cost;
- retention class;
- and trace.

Full sensitive prompts or outputs are retained only when a governed purpose requires them.

---

## 13. Effective AI Permission

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
∩ Resource State
∩ Action Risk
```

Human Actor Permission includes:

```text
Role
+ Relationship
+ Consent
+ Purpose
+ Context
+ Specific Permission
+ Resource State
```

Additional checks include:

- Visibility;
- Block;
- Community membership;
- Open Matching state;
- MatchCandidate eligibility;
- MutualAcceptance;
- Connection and communication basis;
- approval;
- and authentication strength.

---

## 14. AI Configuration Resolution

Configuration resolves from:

```text
Mandatory Platform Policy
        +
Organisation Policy
        +
Research Project Policy
        +
ProtocolVersion
        +
InterventionVersion
        +
AIInterventionConfigurationVersion
        +
Actor Role
        +
Current Task
```

A more specific configuration may narrow broader policy.

It cannot weaken mandatory permission, safety, privacy, provider or research controls.

Conflicting configuration fails closed or requires governance review.

---

## 15. AIInterventionConfigurationVersion

A governed configuration includes:

- stable configuration root and version;
- Research Project;
- ProtocolVersion;
- InterventionVersion;
- AI roles;
- allowed task categories;
- model aliases and provider restrictions;
- instruction versions;
- output schemas;
- retrieval sources;
- grounding requirements;
- Tool Set and Action Levels;
- memory policy;
- personalisation rules;
- ability-adaptation range;
- Life Story rules;
- Community, matching and Message rules;
- moderation and SafetySignal rules;
- confirmation and Human Review requirements;
- data classes and residency;
- retention and deletion;
- evaluation plan;
- rollout;
- effective period;
- and approval.

Approved versions are immutable.

---

## 16. Configuration Lifecycle

Representative states:

- Draft;
- In Review;
- Approved;
- Active;
- Suspended;
- Superseded;
- Retired;
- and Archived.

Activation requires:

- exact approved version;
- model and provider eligibility;
- Prompt and Tool readiness;
- evaluation threshold;
- Protocol compatibility;
- monitoring;
- rollback;
- and owner.

Suspension affects future interactions and does not alter historical records.

---

## 17. Configuration Snapshot

Each material AIInteraction records a resolved configuration snapshot or immutable reference containing:

- policy versions;
- configuration version;
- model alias resolution;
- Prompt and Tool versions;
- retrieval policy;
- memory policy;
- safety and moderation policy;
- output schema;
- and fallback hierarchy.

This supports research reproducibility and incident investigation.

---

## 18. Model Gateway

The Model Gateway:

- isolates provider APIs;
- authenticates provider calls;
- normalises requests and responses;
- applies region routing;
- enforces provider-data policy;
- handles streaming;
- applies timeouts and retries;
- maps errors;
- records usage;
- verifies resolved provider identity;
- and applies approved fallback.

It does not own domain policy, Consent, research approval or Tool authority.

---

## 19. Provider Adapter

Each adapter declares:

- provider identity;
- supported models and modalities;
- tool and structured-output support;
- authentication;
- regions;
- data retention and training behaviour;
- logging and abuse-monitoring behaviour;
- subprocessors;
- timeout and rate limits;
- error mapping;
- model-version reporting;
- deletion capability;
- and incident contact.

Provider SDK types remain outside domain modules.

---

## 20. Provider Registry

A Provider Registry record includes:

- Provider ID;
- legal entity;
- services and endpoints;
- approved regions;
- permitted data classes;
- retention;
- training and service-improvement use;
- abuse monitoring;
- subprocessors;
- security review;
- privacy review;
- contract;
- availability;
- deletion;
- incident obligations;
- exit plan;
- and lifecycle.

Silence or missing provider information is not interpreted as permission.

---

## 21. Model Registry

A model record includes:

- stable model alias;
- provider and provider model ID;
- provider-reported version;
- release or observation date;
- modalities;
- context and output limits;
- Tool and structured-output support;
- supported tasks;
- approved data classes and regions;
- safety status;
- evaluation status;
- known limitations;
- cost and latency;
- fallback;
- and lifecycle.

The Platform never assumes a provider model ID is behaviourally stable forever.

---

## 22. Model Lifecycle States

Representative states:

- Discovered;
- In Review;
- Approved for Testing;
- Approved for Limited Use;
- Approved for Production;
- Restricted;
- Suspended;
- Deprecated;
- Retired;
- and Archived.

A model may have different states for different tasks, data classes, regions or Research Projects.

---

## 23. Model Alias

Applications reference stable aliases such as:

```text
research-drafting-standard
participant-support-low-risk
life-story-transcription-approved
evidence-grounded-analysis
structured-extraction-fast
moderation-triage-limited
```

An alias resolves to an approved provider model and routing configuration.

Alias changes are versioned and auditable.

---

## 24. Model Selection

Selection considers:

- task;
- risk and Action Level;
- data class;
- modality;
- grounding;
- Tool support;
- structured output;
- language;
- accessibility;
- evaluation status;
- latency;
- cost;
- availability;
- region;
- provider terms;
- Protocol restrictions;
- and fallback compatibility.

No model is selected solely because it is cheapest or newest.

---

## 25. Model Routing Policy

Routing policy defines:

- preferred alias;
- approved fallback aliases;
- prohibited providers;
- permitted regions and data classes;
- required evaluation status;
- maximum latency and cost;
- Tool and modality requirements;
- fallback conditions;
- and whether substitution changes the intervention configuration.

Routing is deterministic from the resolved policy and current capability state.

---

## 26. No Silent Model Substitution

A substitution that may materially affect:

- Participant experience;
- intervention delivery;
- safety;
- accessibility;
- Life Story wording;
- matching explanation;
- moderation;
- research validity;
- or reproducibility

must be recorded, impact-assessed and approved where required.

Historical records retain the model actually used.

---

## 27. Model Request Contract

A canonical model request contains:

- Interaction ID;
- model alias and resolved target;
- task;
- approved instructions;
- permitted Context;
- output schema;
- tool definitions where applicable;
- parameters;
- timeout;
- data-policy flags;
- and trace.

It excludes domain authority fields that the model could misuse.

---

## 28. Model Response Contract

A normalised response includes:

- provider request ID;
- resolved model identifier;
- finish reason;
- content or structured output;
- Tool proposals;
- usage;
- provider safety metadata;
- latency;
- warnings;
- and raw-response reference where retained.

Provider safety labels are provisional input to Platform validation.

---

## 29. Model Parameters

Material parameters include:

- temperature;
- top-p;
- maximum output;
- seed where supported;
- response format;
- Tool choice;
- stop conditions;
- modality settings;
- and reasoning or quality tier where applicable.

Parameters are configuration, not hidden runtime defaults.

---

## 30. Instruction Architecture

Instruction layers include:

1. mandatory Platform policy;
2. safety, privacy and security policy;
3. AI role and task policy;
4. Research Project and Protocol constraints;
5. intervention configuration;
6. tool instructions;
7. output schema;
8. user request;
9. retrieved untrusted content.

Lower-priority content cannot override higher-priority policy.

---

## 31. Prompt Registry

The registry stores:

- Prompt ID;
- stable name;
- owner;
- version;
- task;
- AI role;
- instructions;
- variables;
- input and output schema;
- allowed models;
- grounding;
- tools;
- data classes;
- risks;
- evaluation;
- lifecycle;
- and release.

Prompt content is version-controlled.

---

## 32. Prompt Lifecycle

Representative states:

- Draft;
- In Review;
- Approved for Testing;
- Approved for Limited Use;
- Approved for Production;
- Restricted;
- Suspended;
- Superseded;
- Retired;
- and Archived.

A Prompt may be approved for one task and prohibited for another.

---

## 33. Prompt Variables

Variables are:

- typed;
- schema-validated;
- length-limited;
- source-labelled;
- permission-filtered;
- escaped or delimited;
- and mapped to a specific purpose.

Raw database rows, unrestricted files and arbitrary executable instructions are not inserted as variables.

---

## 34. Structured Output

Structured output is preferred for:

- extraction;
- classification;
- Tool arguments;
- Life Story Draft metadata;
- MatchExplanation Drafts;
- moderation triage;
- SafetySignal proposals;
- Dataset documentation;
- and research artefact Drafts.

Schema validation failure produces correction, retry or Human Review rather than silent coercion.

---

## 35. Prompt and Output Schema Versioning

Prompt Version and Output Schema Version are distinct.

A schema change may be breaking even when Prompt wording is unchanged.

Historical AIInteractions retain exact versions.

---

## 36. Context Assembly

Context Assembly determines which authorised information the model may receive.

It is a security, privacy, research and product control point.

Potential sources include:

- user request;
- role and workspace;
- Participant preferences;
- ProtocolVersion;
- InterventionVersion;
- EvidenceDecision and EvidenceSnapshot;
- KnowledgeReference;
- approved recent conversation;
- AIMemoryItem;
- LifeStoryItem;
- Community or MatchCandidate context;
- Message Draft context;
- and Tool result.

---

## 37. Context Assembly Pipeline

```text
Candidate Sources
        ↓
Source and Version Resolution
        ↓
Human and AI Permission
        ↓
Consent and Purpose
        ↓
Visibility, Block and Resource State
        ↓
Data Classification and Provider Policy
        ↓
Freshness and Source Authority
        ↓
Minimum-Necessary Selection
        ↓
Token Budget and Ordering
        ↓
Source-Labelled Context
```

Permission filtering occurs before model invocation.

---

## 38. Context Source Types

Context labels include:

- Platform Fact;
- Participant-Provided Information;
- Participant Testimony;
- Supporter Contribution;
- Human Observation;
- Human Decision;
- Retrieved Evidence;
- AI Inference;
- AIMemoryItem;
- Tool Result;
- and External Unverified Content.

The output must preserve these distinctions.

---

## 39. Context Freshness

Context records:

- source ID and version;
- effective time;
- retrieval time;
- freshness class;
- Resource State;
- and revocation generation.

Stale Consent, Block, Protocol, Visibility, Connection, Message basis, Safety or Dataset Lock state is not used for a sensitive action.

---

## 40. Context Minimisation

Only information necessary for the current task is included.

Private Life Story, messages, MatchPreferences, reporter identity, moderation evidence, Safety details, precise location and authority documents are excluded by default.

Token-budget pressure must not be solved by dropping mandatory policy or provenance.

---

## 41. Context Isolation

Context is isolated by:

- Organisation;
- Research Project;
- Participant;
- purpose;
- AI role;
- conversation;
- resource;
- Visibility;
- Block;
- and data class.

Cross-project or cross-Participant pooling is prohibited unless an approved analytical task explicitly permits de-identified aggregation.

---

## 42. Context Retention

Temporary Context expires after the interaction or workflow.

Persistent data require a separate authorised domain record or AIMemoryItem.

Provider retention is controlled independently and cannot be inferred from Platform deletion.

---

## 43. Retrieval Architecture

Retrieval types include:

- Knowledge Platform retrieval;
- structured Research Platform retrieval;
- full-text retrieval;
- semantic retrieval;
- conversation retrieval;
- Participant's own Life Story retrieval;
- permitted Community retrieval;
- and analytical artefact retrieval.

A Retrieval Plan defines:

- query;
- sources;
- filters;
- top-k;
- reranking;
- grounding;
- stopping;
- and failure behaviour.

---

## 44. Knowledge Platform Retrieval

All authoritative external knowledge access passes through M10.

Retrieval preserves:

- KnowledgeReference;
- external identifier and version;
- provenance;
- verification state;
- licensing;
- completeness;
- retrieval time;
- and citation.

The AI does not call Knowledge Platform internals directly.

---

## 45. Research Platform Retrieval

Research Platform retrieval uses:

- owning-module APIs;
- purpose-specific read models;
- approved Search;
- governed MCP tools;
- and exact resource references.

AI does not query unrestricted database tables or operational production schemas directly.


---

## 46. Semantic Retrieval

Semantic retrieval may support:

- Evidence and project documents;
- Participant's own permitted Life Story;
- permitted Community content;
- qualitative research data;
- and AI evaluation artefacts.

Each result preserves:

- source type and ID;
- source version;
- chunk;
- embedding model and version;
- purpose;
- Visibility;
- Data Classification;
- and deletion generation.

A retrieved candidate is re-authorised against the current source record before use.

---

## 47. Retrieval Permissions

Retrieval applies:

- role;
- Relationship;
- Consent;
- purpose;
- Context;
- Specific Permission;
- Resource State;
- Visibility;
- Block;
- Community membership;
- Connection;
- Data Classification;
- and provider policy.

Permission is applied before ranking, not only after retrieval.

---

## 48. Retrieval Reranking

Reranking may consider:

- relevance;
- authority;
- source directness;
- recency;
- Protocol fit;
- population fit;
- evidence quality;
- source verification;
- and language fit.

Reranking cannot reintroduce a source removed by permission, Visibility or Block.

---

## 49. Grounding Requirements

Each task declares one of:

- No External Grounding Required;
- Platform Grounding Required;
- Evidence Grounding Required;
- Dual Grounding Required;
- Participant Confirmation Required;
- or Human Review Required.

A Life Story wording task may require Participant confirmation rather than external factual verification.

A research claim normally requires evidence and Platform lineage.

---

## 50. Citation Generation

Citations are generated from retrieved source metadata.

The model cannot invent:

- source;
- identifier;
- title;
- author;
- date;
- version;
- or URL.

Citation validation compares output references with Retrieval Records.

---

## 51. Unsupported Claims

Validation should detect or flag:

- unsupported factual claims;
- overstatement of evidence;
- causal claims from association;
- invented Participant details;
- invented Life Story details;
- hidden matching explanations;
- fabricated moderation rationale;
- false safety certainty;
- and research conclusions not supported by Analysis or Interpretation.

High-impact unsupported claims require rejection or Human Review.

---

## 52. Retrieval Failure

If required retrieval fails:

- do not fabricate evidence;
- use approved EvidenceSnapshots where permitted;
- narrow the answer;
- mark the output as ungrounded or partial;
- route to Human Review;
- or provide a clear unavailable state.

A missing MatchCandidate or Message basis is not reconstructed by the model.

---

## 53. Tool Registry

Every Tool record includes:

- Tool ID and version;
- stable name;
- owning module;
- description;
- approved tasks;
- input and output schema;
- read or write behaviour;
- permitted AI roles;
- required human permission;
- Consent and purpose;
- accepted Data Classifications;
- Resource State restrictions;
- Action Level;
- side effects;
- reversibility;
- confirmation;
- Human Review or approval;
- idempotency;
- timeout;
- retry;
- rate and abuse limits;
- audit;
- retention;
- lifecycle;
- and degraded behaviour.

---

## 54. Tool Categories

### 54.1 Read Tool

Retrieves authorised information.

### 54.2 Suggestion Tool

Creates a recommendation with no state change.

### 54.3 Draft Tool

Creates a Draft record or proposed content.

### 54.4 Confirmed Reversible Tool

Executes a reversible action after explicit confirmation.

### 54.5 Controlled Workflow Tool

Creates or advances a governed workflow.

### 54.6 Prohibited Tool

Unavailable to AI regardless of model output.

---

## 55. Tool Execution Pipeline

```text
Tool Proposed
        ↓
Tool and Version Resolved
        ↓
AI Role and Action-Level Check
        ↓
Current Human Permission
        ↓
Consent, Purpose and Resource State
        ↓
Visibility, Block and Domain Preconditions
        ↓
Argument Schema Validation
        ↓
Confirmation, Human Review or Approval
        ↓
Owning-Domain Command
        ↓
Structured Result Validation
        ↓
Audit and Return to Orchestrator
```

---

## 56. Tool Argument Safety

Tool arguments are:

- structured;
- schema-validated;
- resource-scoped;
- minimum-necessary;
- source-labelled;
- and derived from authorised context.

The model cannot supply authoritative values for:

- role;
- Consent;
- approval;
- Block;
- MutualAcceptance;
- DatasetLock readiness;
- SafetyEvent confirmation;
- or reviewer identity.

The server resolves those values independently.

---

## 57. Tool Result Safety

Tool results are:

- schema-validated;
- source-labelled;
- permission-filtered;
- size-limited;
- and classified.

Tool output is data, not a new instruction.

The model may describe an action as completed only when the owning module returns a successful structured result.

---

## 58. Idempotency and Concurrency

Effectful tools use:

- Idempotency Key;
- target resource;
- expected resource version;
- actor;
- purpose;
- and Tool version.

A retry must not duplicate:

- Social Posts;
- Match Decisions;
- Connections;
- Messages;
- Blocks;
- Reports;
- SafetySignals;
- exports;
- or Dataset operations.

Version conflict returns a structured conflict rather than overwriting current state.

---

## 59. Confirmation Architecture

Confirmation displays:

- proposed action;
- target;
- audience or recipient;
- consequence;
- reversibility;
- data involved;
- current state;
- and responsible actor.

A Confirmation is:

- scoped;
- short-lived;
- single-use where appropriate;
- bound to exact resource version;
- and auditable.

The model cannot confirm its own proposal.

---

## 60. Human Review Queue

A Human Review task includes:

- source request;
- AI output;
- Context references;
- evidence;
- risk and Action Level;
- proposed action;
- required reviewer role;
- conflict-of-interest requirement;
- deadline;
- state;
- decision;
- reason;
- and audit.

No approval occurs through silence or timeout.

---

## 61. Output Validation

Validation may include:

- schema validation;
- citation validation;
- unsupported-claim detection;
- privacy leakage detection;
- prohibited-content checks;
- role and authority checks;
- Tool and Action-Level checks;
- Life Story invention checks;
- matching-feature policy checks;
- moderation-boundary checks;
- SafetySignal routing;
- accessibility and style requirements;
- and research-language constraints.

Validation may be deterministic, model-assisted or human.

High-impact validation cannot rely solely on another ungoverned model call.

---

## 62. Output Classification

AI output uses separate dimensions:

- Epistemic Type;
- Artefact Type;
- Review Status;
- Approval Status;
- Safety Classification;
- Grounding Status;
- Action Status;
- and Visibility eligibility.

Representative Epistemic Types:

- Platform Fact;
- Retrieved Evidence;
- Participant-Provided Information;
- Participant Testimony;
- Human Observation;
- Human Decision;
- AI Inference;
- Suggestion;
- Draft;
- and Unknown.

---

## 63. Draft and Final State

An AI Draft is not:

- Participant Testimony;
- approved Protocol;
- EvidenceDecision;
- sent Message;
- published SocialPost;
- ModerationDecision;
- SafetyEvent;
- InterpretationRecord;
- ResearchFinding;
- or completed Tool action.

The user interface and API must preserve this distinction.

---

## 64. Life Story Assistance

AI may assist with:

- prompts;
- transcription;
- translation;
- summarisation;
- chronology;
- theme suggestions;
- caption Drafts;
- accessibility;
- and organisation.

AI may not:

- invent memories;
- add unconfirmed people, places or dates as facts;
- resolve disputes;
- publish without confirmation;
- change Visibility;
- change LegacyPreference;
- or convert a Supporter contribution into Participant Testimony.

---

## 65. Life Story Confirmation

Life Story confirmation records:

- exact Draft version;
- source;
- AI involvement;
- Participant review;
- accepted wording;
- corrections;
- attributed speaker;
- and confirmation time.

Confirmation is item- and version-specific.

A later edit creates a new version and may require new confirmation.

---

## 66. Life Story Retrieval and Memory Boundary

Private Life Story is retrieved only for:

- the Participant;
- explicitly authorised actors;
- an approved research purpose;
- or an approved AI task.

A LifeStoryItem is not automatically stored as AIMemoryItem.

AIMemoryItem does not become Life Story evidence.

---

## 67. Life Story Media Operations

Media operations may include:

- speech-to-text;
- translation;
- image description;
- metadata extraction;
- redaction suggestion;
- and quality assessment.

Media processing preserves:

- Consent;
- purpose;
- provider;
- model or software version;
- source object;
- retention;
- transcript quality;
- and human correction.

Voice or image processing may require stricter provider eligibility than text.

---

## 68. Public Profile Assistance

`PublicProfile` remains separate from `ParticipantProfile`.

Public-profile visibility may be `Community`, `Platform Public`, or another explicitly permitted scope. `Internet Public` requires a separate approved publication flow.

AI may help the Participant Draft:

- display name;
- biography;
- interests;
- accessibility-friendly wording;
- and selected profile fields.

AI cannot copy protected ParticipantProfile fields into PublicProfile without explicit selection and confirmation.

It cannot expose research participation, Safety, precise location or private Life Story by default.

---

## 69. Community Content Assistance

AI may:

- explain Community Rules;
- Draft Social Posts and comments;
- translate;
- suggest accessible wording;
- identify possible policy concerns;
- and propose content warnings.

AI cannot:

- publish without confirmation;
- generate fake social proof;
- impersonate a Participant;
- create coordinated engagement;
- or optimise for controversy, dependency or emotional arousal.

---

## 70. Community Recommendation Boundary

AI-supported Community discovery may use:

- declared interests;
- language;
- accessibility;
- approved location granularity;
- current eligibility;
- and Community purpose.

It cannot use private Life Story, messages, Safety, moderation allegations, hidden vulnerability or protected traits without explicit approved governance.

Recommendation reasons remain understandable and source-labelled.

---

## 71. Open Matching Assistance

AI may:

- help configure MatchPreference;
- explain allowed attributes;
- Draft introduction text;
- summarise MatchExplanation;
- and help the Participant understand available choices.

AI cannot:

- activate matching without opt-in;
- use prohibited hidden features;
- accept a candidate;
- create MutualAcceptance;
- create a Connection;
- or reveal the other Participant's protected data.

---

## 72. Match Explanation

A MatchExplanation may include declared shared attributes and uncertainty.

It must not:

- present a compatibility score as objective truth;
- disclose private source records;
- infer diagnosis or vulnerability;
- reveal a blocked actor;
- or claim guaranteed relationship success.

The exact matching policy and feature versions are retained.

---

## 73. Match Decision and Connection Boundary

AI may propose:

- Interested;
- Not Now;
- Dismissed;
- Blocked;
- or Reported.

The Participant records their own decision.

MutualAcceptance and Connection activation are deterministic M18 domain consequences after current policy and Block checks.

---

## 74. Messaging Assistance

AI may:

- Draft a Message;
- translate;
- simplify wording;
- suggest respectful phrasing;
- and identify possible scam or abuse signals.

AI cannot send without:

- valid communication basis;
- current Connection or other authority;
- no active Block;
- recipient eligibility;
- current purpose;
- and explicit confirmation.

A Draft is not sent.

---

## 75. Message Privacy

Message content is excluded from:

- general Search;
- general Vector retrieval;
- ordinary AIMemoryItem creation;
- matching;
- Community ranking;
- and unrelated research.

Message assistance uses minimum context and excludes unrelated conversation history.

---

## 76. Scam and Abuse Assistance

AI may flag possible:

- spam;
- impersonation;
- credential solicitation;
- financial solicitation;
- malicious links;
- coercion;
- harassment;
- and repeated unwanted contact.

A flag is provisional and does not create a final ModerationDecision.

Urgent safety concerns may create a SafetySignal according to policy.

---

## 77. Moderation Assistance

AI may:

- classify content provisionally;
- group reports;
- summarise evidence;
- identify applicable Community Rules;
- propose severity;
- detect duplicate abuse patterns;
- and prepare a Moderator Draft.

AI cannot impose a high-impact restriction, identify a reporter to an unauthorised actor, decide an appeal or restore content autonomously.

---

## 78. Moderation Signal Record

An AI moderation signal preserves:

- source content or report reference;
- model and Prompt version;
- categories;
- confidence and uncertainty;
- evidence spans;
- possible rules;
- limitations;
- and time.

It is distinct from ModerationDecision.

---

## 79. Moderation Decision Boundary

A human Moderator or authorised reviewer records:

- rule version;
- evidence;
- reason;
- proportionality;
- duration;
- action;
- and appeal.

The AI may assist wording but cannot become the decision-maker.

---

## 80. Safety Policy Architecture

The Safety Policy layer combines:

1. deterministic rules;
2. permission and Tool controls;
3. input classification;
4. model safety configuration;
5. output validation;
6. escalation rules;
7. Human Review;
8. incident monitoring;
9. post-incident evaluation.

Safety controls are task- and context-specific.

---

## 81. Safety Signal Categories

Representative categories include:

- acute distress;
- self-harm concern;
- abuse or exploitation;
- medical emergency concern;
- medication risk;
- privacy disclosure;
- coercion;
- severe confusion;
- dependency;
- discrimination;
- misinformation;
- fraud;
- and prohibited clinical reliance.

Categories are provisional until human review.

---

## 82. AI Safety Signal Flow

```text
AIInteraction
        ↓
Potential Concern Detected
        ↓
AISafetySignalRaised
        ↓
M09 SafetySignal
        ↓
Human Triage
        ↓
SafetyEvent only if Confirmed
```

AI cannot create, confirm, resolve or close SafetyEvent directly.

---

## 83. Safety Escalation

Escalation defines:

- trigger;
- severity;
- target role;
- response target;
- minimum information;
- communication channel;
- confirmation;
- failure path;
- and audit.

Safety escalation does not disclose broader AI conversation content than necessary.

---

## 84. No Independent Clinical Authority

AI must not:

- diagnose;
- prescribe;
- change medication;
- independently assess capacity;
- determine emergency response;
- replace professional judgement;
- or present itself as a regulated clinician.

Emergency and crisis guidance uses approved patterns and local human escalation.

---

## 85. Human Connection Safeguards

AI must not:

- claim love or emotional need;
- imply exclusivity;
- guilt the Participant;
- discourage human contact;
- exploit loneliness;
- pressure disclosure;
- impersonate a human Connection;
- or optimise primarily for conversation length.

The AI should support appropriate human connection and boundaries.

---

## 86. Dependency Monitoring

Potential dependency signals include:

- repeated exclusivity language;
- distress when AI is unavailable;
- replacing human contact;
- escalating disclosure pressure;
- excessive repeated use;
- or inability to disengage.

These signals require cautious interpretation.

They do not become ParticipantProfile truth or Match features.

---

## 87. AIMemoryItem Architecture

Memory types include:

- session context;
- conversation summary;
- project memory;
- Participant preference memory;
- purpose-bound longitudinal memory;
- and prohibited memory.

AIMemoryItem preserves:

- subject;
- scope;
- content;
- source;
- Epistemic Type;
- confidence and uncertainty;
- purpose;
- Consent;
- permitted AI roles;
- prohibited uses;
- created time;
- expiry;
- correction;
- revocation;
- deletion;
- and audit.

---

## 88. Memory Creation

Persistent memory is created only when:

- useful for an approved purpose;
- permitted by current Consent or authority;
- minimum-necessary;
- understandable to the Participant;
- source-labelled;
- and allowed by configuration.

Participant confirmation is required where policy specifies it.

---

## 89. Memory Review and Control

Participants should be able to:

- view;
- understand;
- correct;
- restrict;
- revoke;
- and delete

eligible AIMemoryItems.

The interface distinguishes AI memory from Profile, Life Story and research records.

---

## 90. Memory Retrieval

Memory retrieval applies:

- purpose;
- AI role;
- current Consent;
- relevance;
- recency;
- source;
- confidence;
- expiry;
- Resource State;
- and permission.

Retrieval does not use revoked, expired, deleted or incompatible-purpose memory.

---

## 91. Memory Prohibitions

AI should not automatically retain:

- private Life Story details;
- Message content;
- dismissed MatchCandidates;
- reporter identity;
- Safety or moderation allegations;
- exact financial information;
- precise location;
- credentials;
- general capacity or vulnerability labels;
- or withdrawn content.

---

## 92. Personalisation Architecture

Personalisation may adapt:

- language;
- reading level;
- response length;
- structure;
- modality;
- pacing;
- reminder style;
- and interaction sequence.

It must not silently change:

- rights;
- Consent;
- Protocol;
- intervention dose;
- evidence claims;
- matching policy;
- safety thresholds;
- or research outcomes.

---

## 93. Personalisation Sources

Permitted sources may include:

- explicit Participant preferences;
- AccessibilityProfile;
- current task;
- approved AIMemoryItem;
- intervention configuration;
- language choice;
- and current device capability.

Inferred preferences require uncertainty and correction controls.

---

## 94. Ability-Adaptive Response

Ability adaptation may include:

- shorter steps;
- plain language;
- repetition;
- read-aloud;
- larger chunks or fewer choices;
- multimodal response;
- confirmation;
- and slower pacing.

Adaptation records preserve what changed and why when it may affect intervention fidelity or Measurement comparability.

---

## 95. Personalisation Boundaries

AI cannot personalise based on:

- hidden diagnosis;
- inferred decision-making capacity;
- hidden vulnerability;
- Safety allegation;
- moderation history;
- protected traits;
- or private social graph

unless an explicit, approved purpose and governance rule permits the data use.



---

## 96. Adaptation Record

A material AI adaptation record includes:

- Interaction;
- source preference or AccessibilityProfile;
- adaptation rule;
- original presentation;
- adapted presentation;
- Participant confirmation where required;
- fidelity impact;
- Measurement impact;
- and time.

Adaptation is not stored as a general ability score.

---

## 97. AI Data Minimisation

Minimisation applies to:

- Context;
- retrieval;
- prompt variables;
- provider payload;
- Tool arguments;
- output;
- logs;
- evaluation data;
- memory;
- embeddings;
- and retention.

The Orchestrator should prefer:

- structured references;
- summaries approved for the purpose;
- redaction;
- pseudonymous identifiers;
- and bounded Context windows.

---

## 98. Data Classification Routing

AI routing considers:

- Public Information;
- Internal;
- Confidential;
- Sensitive Personal Data;
- Highly Sensitive Personal Data;
- Restricted Research Data;
- Safety-Restricted;
- Moderation-Restricted;
- and Security-Restricted.

A model or provider must be approved for the exact data class, purpose and region.

---

## 99. Provider Data Policy

Provider policy records whether the provider may:

- retain prompts or outputs;
- train models;
- improve services;
- inspect content;
- perform abuse monitoring;
- store metadata;
- use subprocessors;
- transfer regions;
- and support deletion.

Provider policy is evaluated before request dispatch.

---

## 100. Provider Eligibility

A provider is eligible only when:

- security and privacy review are current;
- contract and data-processing terms are approved;
- required region is available;
- data classes are permitted;
- retention and training behaviour are acceptable;
- model identity is observable;
- incident notification is defined;
- and deletion or exit requirements are supported.

---

## 101. Local or Private Models

A local, dedicated or private model may be preferred for:

- Highly Sensitive Personal Data;
- private Life Story media;
- Message assistance;
- Moderation-Restricted data;
- Safety-Restricted data;
- identifiable research data;
- and code execution support.

Local deployment still requires evaluation, logging, access control, update governance and kill switches.

---

## 102. Provider Fallback

Fallback is allowed only when the fallback:

- is approved for the task;
- supports the required modality and Tool contract;
- is approved for the data class and region;
- meets evaluation thresholds;
- preserves output schema;
- and does not materially alter the intervention without approval.

Otherwise the task degrades to Draft, template, manual workflow or unavailable state.

---

## 103. Model Operations

Model Operations manages:

- discovery;
- review;
- evaluation;
- approval;
- alias resolution;
- deployment;
- monitoring;
- drift;
- incident response;
- restriction;
- suspension;
- deprecation;
- and retirement.

Operational convenience cannot bypass research or governance requirements.

---

## 104. Prompt Operations

Prompt Operations manages:

- authorship;
- versioning;
- review;
- evaluation;
- release;
- monitoring;
- incident response;
- rollback;
- supersession;
- and retirement.

Prompt changes are treated as material when they affect behaviour, risk, intervention fidelity or research validity.

---

## 105. Tool Operations

Tool Operations manages:

- registration;
- schema;
- Action Level;
- permission;
- confirmation;
- provider compatibility;
- testing;
- rollout;
- monitoring;
- suspension;
- versioning;
- and retirement.

Tool expansion requires fresh threat, privacy and domain review.

---

## 106. AI Configuration Release

A release unit includes:

- AIInterventionConfigurationVersion;
- model aliases;
- provider routing;
- Prompt versions;
- output schemas;
- retrieval policy;
- Tool versions;
- memory policy;
- safety and moderation policy;
- evaluation report;
- rollout plan;
- rollback plan;
- and approval.

The release unit receives a stable release identifier.

---

## 107. Release Environments

Recommended environments:

- local development;
- shared development;
- automated evaluation;
- integration test;
- research sandbox;
- staging;
- shadow production;
- limited production;
- and production.

Production Participant data are not copied to lower environments without approved de-identification.

---

## 108. Offline Evaluation

Offline evaluation occurs before production use and after material change.

It should test:

- task quality;
- grounding;
- citation;
- structured output;
- permission adherence;
- Tool safety;
- Life Story invention;
- matching policy;
- Message confirmation;
- moderation boundary;
- SafetySignal routing;
- accessibility;
- fairness;
- dependency language;
- latency;
- cost;
- and reproducibility.

---

## 109. Evaluation Dataset

An Evaluation Dataset may include:

- synthetic cases;
- expert-authored cases;
- governed de-identified historical cases;
- adversarial cases;
- accessibility cases;
- multilingual cases;
- Life Story ambiguity;
- Community abuse;
- matching edge cases;
- Message scams;
- moderation cases;
- Safety concerns;
- research drafting;
- and provider-failure scenarios.

---

## 110. Evaluation Dataset Governance

Evaluation data require:

- owner;
- purpose;
- source;
- Consent or approved basis;
- Data Classification;
- de-identification;
- permitted models and providers;
- retention;
- contamination control;
- version;
- and access.

Evaluation results remain linked to the exact dataset version.

---

## 111. Evaluation Dimensions

Representative dimensions include:

- correctness;
- completeness;
- relevance;
- grounding;
- citation accuracy;
- uncertainty;
- privacy;
- security;
- permission adherence;
- Safety;
- moderation accuracy;
- fairness;
- accessibility;
- cultural and language appropriateness;
- human-connection quality;
- dependency risk;
- action correctness;
- latency;
- cost;
- and stability.

---

## 112. Task-Specific Thresholds

Thresholds are defined by task and risk.

A low-risk drafting task may tolerate more stylistic variation than:

- SafetySignal classification;
- moderation triage;
- matching explanation;
- Dataset documentation;
- or research claim generation.

A single aggregate score is insufficient.

---

## 113. Research Workflow Evaluation

Evaluate:

- evidence citation;
- claim support;
- distinction between evidence and inference;
- Protocol consistency;
- version references;
- Dataset and Analysis terminology;
- limitation disclosure;
- and human edit rate.

AI output remains Draft until governed approval.

---

## 114. Participant-Facing Evaluation

Evaluate:

- understandability;
- tone;
- accessibility;
- respect for autonomy;
- Consent comprehension;
- ability adaptation;
- emotional boundaries;
- disclosure pressure;
- human-connection support;
- and recovery from misunderstanding.

---

## 115. Life Story Evaluation

Evaluate:

- transcription accuracy;
- speaker attribution;
- language and translation;
- chronology uncertainty;
- invented detail rate;
- Participant correction rate;
- sensitive-topic handling;
- third-party-rights prompts;
- and confirmation clarity.

An invented-memory rate above the approved threshold blocks release.

---

## 116. Community Evaluation

Evaluate:

- Rule explanation;
- content Draft quality;
- harassment and scam detection;
- false-positive moderation signals;
- protected speech and context handling;
- accessibility;
- social-proof integrity;
- and ranking-safety effects.

---

## 117. Matching Evaluation

Evaluate:

- allowed-feature adherence;
- prohibited sensitive-feature leakage;
- candidate eligibility;
- Block enforcement;
- explanation fidelity;
- fairness across approved groups;
- repeated exposure;
- location privacy;
- and MutualAcceptance boundary.

The model is not evaluated by maximising acceptance rate alone.

---

## 118. Messaging Evaluation

Evaluate:

- valid communication basis;
- explicit send confirmation;
- scam and malicious-link detection;
- harassment recognition;
- translation fidelity;
- tone preservation;
- privacy;
- and false send-completion claims.

---

## 119. Moderation Evaluation

Evaluate:

- category precision and recall;
- severity calibration;
- evidence-span accuracy;
- Community Rule mapping;
- uncertainty;
- bias;
- appeal outcomes;
- reporter confidentiality;
- and separation from Safety.

Human decisions provide evaluation labels but are also subject to quality review.

---

## 120. Safety Evaluation

Evaluate:

- SafetySignal recall and precision;
- severity;
- escalation routing;
- minimum disclosure;
- false reassurance;
- prohibited clinical authority;
- emergency-pattern correctness;
- latency;
- and Human Review outcome.

AI does not receive a release threshold that permits SafetyEvent confirmation.

---

## 121. Retrieval Evaluation

Evaluate:

- source coverage;
- permission filtering;
- Block filtering;
- freshness;
- authority;
- relevance;
- citation support;
- completeness labelling;
- and failure behaviour.

A relevant but unauthorised result is a retrieval failure.

---

## 122. Tool Evaluation

Evaluate:

- Tool selection;
- argument validity;
- authority resolution;
- confirmation;
- idempotency;
- concurrency;
- side-effect correctness;
- result interpretation;
- failure handling;
- and false-completion prevention.

Every Level 5 action has a negative test.

---

## 123. Memory Evaluation

Evaluate:

- justified creation;
- source accuracy;
- purpose compatibility;
- retrieval relevance;
- expiry;
- correction;
- revocation;
- deletion;
- sensitive-memory prohibition;
- and Participant understanding.

---

## 124. Accessibility Evaluation

Evaluation includes:

- plain language;
- screen-reader compatibility;
- voice interaction;
- response structure;
- cognitive load;
- error recovery;
- language;
- motor constraints;
- and alternative modality.

Accessibility quality is part of release readiness.

---

## 125. Fairness Evaluation

Fairness evaluation identifies:

- affected groups;
- task;
- outcome;
- error type;
- exposure;
- benefit and harm;
- data limitations;
- uncertainty;
- and mitigation.

Matching, moderation, safety and accessibility receive task-specific fairness review.

Protected-trait evaluation data are used only under approved governance.

---

## 126. Human Connection Evaluation

Evaluate whether AI:

- supports human contact;
- avoids exclusivity;
- avoids guilt;
- does not impersonate people;
- respects disengagement;
- avoids excessive disclosure pressure;
- and does not optimise for dependency.

Engagement time is not a sufficient success metric.

---

## 127. Prompt Injection Evaluation

Test:

- user-instruction override;
- retrieved-document injection;
- Life Story contribution injection;
- SocialPost and Message injection;
- malicious Tool result;
- hidden exfiltration request;
- cross-Participant request;
- and approval forgery.

Detection supplements, but does not replace, permission and Tool enforcement.

---

## 128. Red Teaming

Red-team scenarios include:

- privacy leakage;
- identity and role confusion;
- Consent bypass;
- Block bypass;
- unsafe clinical reliance;
- emotional manipulation;
- invented Life Story;
- hidden sensitive matching;
- scam facilitation;
- reporter exposure;
- high-impact moderation;
- SafetyEvent confirmation;
- DatasetLock attempt;
- research-approval attempt;
- prompt injection;
- Tool injection;
- and provider-policy violation.

---

## 129. Human Evaluation

Human evaluators receive:

- task;
- source and Context;
- output;
- applicable policy;
- expected uncertainty;
- and rubric.

Evaluator role, conflict, training, decision and disagreement are recorded.

Highly sensitive cases use minimum-necessary exposure and reviewer support.

---

## 130. Golden Test Cases

Golden cases represent:

- expected structured outcomes;
- mandatory boundaries;
- prohibited actions;
- and acceptable variability.

They do not require identical wording unless wording is itself a safety or Consent requirement.

---

## 131. Non-Determinism

Evaluation accounts for model variability using:

- multiple runs;
- bounded sampling;
- fixed Prompt and Context;
- structured output;
- statistical summaries;
- and worst-case review for high-risk tasks.

---

## 132. Deterministic Settings

Low-variance settings may be preferred for:

- extraction;
- classification;
- Tool arguments;
- moderation triage;
- SafetySignal routing;
- and research-data documentation.

Deterministic settings do not make a model output authoritative.

---

## 133. Evaluation Report

An Evaluation Report includes:

- configuration and model;
- Evaluation Dataset version;
- methods;
- dimensions;
- thresholds;
- results;
- failures;
- subgroup analysis;
- residual risk;
- limitations;
- reviewer;
- and release recommendation.

---

## 134. Release Thresholds

Thresholds define:

- must-pass prohibitions;
- minimum task quality;
- maximum privacy and safety error;
- maximum unsupported-claim rate;
- maximum invented-detail rate;
- fairness limits;
- accessibility requirements;
- and operational performance.

A failed must-pass boundary blocks release regardless of average score.

---

## 135. Online Monitoring

Production monitoring uses:

- structured telemetry;
- user feedback;
- Human Review outcomes;
- Tool results;
- safety and moderation signals;
- provider metadata;
- drift tests;
- and research measures.

Monitoring follows data minimisation and does not become unrestricted behavioural surveillance.

---

## 136. Quality Signals

Representative quality signals include:

- user correction;
- retry;
- abandonment;
- Human Review edit;
- rejected Draft;
- citation failure;
- unsupported claim;
- Tool denial;
- false completion;
- SafetySignal;
- moderation reversal;
- and complaint.

Signals require contextual interpretation.

---

## 137. Drift Detection

Potential drift includes:

- changed model behaviour;
- provider model change;
- Prompt or Tool drift;
- retrieval degradation;
- citation decline;
- increased invention;
- increased sensitive leakage;
- matching explanation divergence;
- moderation bias;
- Safety regression;
- latency or cost change;
- and user-impact change.

---

## 138. Provider Change Detection

Monitor:

- provider model identifier;
- response metadata;
- endpoint behaviour;
- release notices;
- data-policy terms;
- evaluation results;
- and unexplained behaviour change.

An unannounced material change may suspend the alias.

---

## 139. Re-Evaluation Triggers

Re-evaluation occurs after:

- model change;
- provider change;
- Prompt change;
- Tool change;
- Context or retrieval change;
- output-schema change;
- safety or moderation policy change;
- memory-policy change;
- data-domain expansion;
- new language or modality;
- Protocol amendment;
- or material incident.

---

## 140. Shadow Mode

Shadow Mode runs a new configuration without showing its output or executing its Tools.

It supports comparison against current production behaviour.

Shadow Mode still requires data-authority and provider approval.

---

## 141. Canary Release

Canary release uses:

- limited eligible users;
- explicit Research Project and Protocol rules;
- current Consent;
- monitoring;
- stop thresholds;
- rollback;
- and evaluation.

Canary assignment is recorded for research integrity.

---

## 142. Staged Rollout

Representative stages:

1. internal synthetic testing;
2. governed historical evaluation;
3. research sandbox;
4. shadow mode;
5. staff or evaluator cohort;
6. limited Participant cohort;
7. project-specific production;
8. broader production.

Each stage has entry and exit criteria.

---

## 143. Rollback

Rollback restores approved:

- model alias resolution;
- Prompt version;
- Tool version;
- retrieval policy;
- memory policy;
- safety and moderation policy;
- and configuration.

Historical AIInteractions remain linked to the configuration actually used.

Rollback does not erase already executed domain actions.

---

## 144. Kill Switches

The Platform supports disabling:

- provider;
- model;
- model alias;
- Prompt;
- Tool;
- memory creation;
- retrieval source;
- Life Story AI;
- Community AI;
- matching AI;
- messaging AI;
- moderation AI;
- participant-facing AI;
- Research Project AI configuration;
- or all AI.

Critical Block, Report, Consent and Safety workflows remain available without AI.

---

## 145. AI Incident Categories

Representative incidents include:

- privacy leakage;
- cross-Participant or cross-project access;
- provider-policy violation;
- prompt-injection success;
- unsafe Tool execution;
- false action confirmation;
- invented Life Story;
- sensitive matching;
- reporter disclosure;
- harmful moderation;
- Safety escalation failure;
- unsupported research claim;
- model or Prompt drift;
- and deletion failure.



---

## 146. AI Incident Lifecycle

```text
Detect
        ↓
Contain
        ↓
Disable or Restrict
        ↓
Preserve Evidence
        ↓
Investigate
        ↓
Assess Participant and Research Impact
        ↓
Correct
        ↓
Re-Evaluate
        ↓
Re-Release or Retire
```

Incident response preserves exact model, Prompt, Context, Tool, provider and configuration versions.

---

## 147. Incident Containment

Containment may:

- disable a provider or alias;
- suspend a Prompt or Tool;
- disable memory creation;
- block a retrieval source;
- restrict a task or data class;
- pause a Research Project AI configuration;
- stop matching or moderation assistance;
- or disable all Participant-facing AI.

Containment must not remove access to critical non-AI controls.

---

## 148. Participant and Research Impact Assessment

An incident assessment considers:

- affected Participants and actors;
- exposed data;
- incorrect domain actions;
- Life Story or public content impact;
- matching, Connection and Message impact;
- moderation or Safety impact;
- Dataset or Analysis contamination;
- Research Findings;
- provider retention;
- and required notification.

Corrective research action may require Dataset exclusion, Analysis rerun or Finding qualification.

---

## 149. Cost Architecture

Track:

- input and output tokens;
- model and provider charges;
- retrieval;
- embeddings;
- Tool calls;
- transcription and media processing;
- evaluation;
- storage;
- and Human Review.

Costs are attributable to:

- Organisation;
- Research Project;
- Participant where appropriate;
- task;
- model alias;
- configuration;
- and provider.

---

## 150. Cost Controls

Controls may include:

- model routing;
- context minimisation;
- approved caching;
- shorter outputs;
- batch processing;
- small task-specific models;
- local models;
- quotas;
- and Human Review thresholds.

Cost reduction cannot weaken required grounding, privacy, accessibility, safety or research validity.

---

## 151. Budget Policy

A Research Project may define:

- monthly budget;
- per-interaction limit;
- per-Participant limit;
- per-task limit;
- provider limit;
- alert threshold;
- and hard stop.

Budget exhaustion degrades safely and does not silently substitute an unapproved model.

---

## 152. Latency Architecture

Latency is measured across:

- permission;
- configuration;
- Context Assembly;
- retrieval;
- model queue;
- inference;
- Tool execution;
- validation;
- confirmation;
- and response delivery.

The user interface distinguishes thinking, retrieval, waiting for confirmation and completed action.

---

## 153. Latency Classes

Representative classes:

- Interactive;
- Near-Interactive;
- Background;
- Batch;
- Human Review;
- and Safety Escalation.

Each task declares a latency class and timeout behaviour.

---

## 154. Streaming

Streaming may improve perceived latency.

Before streaming:

- identity and permission are resolved;
- mandatory policy is loaded;
- unsafe data are excluded;
- and the task is approved for streaming.

Partial output is not used to claim Tool success or final approval.

---

## 155. Response Caching

Caching may be used for:

- public model metadata;
- stable generic explanations;
- approved evidence summaries;
- Prompt and configuration metadata;
- and non-sensitive templates.

Sensitive Participant responses, Life Story, messages, matching explanations and moderation content require task-specific restrictions.

---

## 156. Response Reuse

Generated content may be reused across Participants only when:

- it is generic;
- no personal or project-sensitive Context is present;
- source and citation remain valid;
- configuration permits reuse;
- and no hidden user signal is retained.

---

## 157. Rate Limiting

Rate limits consider:

- actor;
- Organisation;
- Research Project;
- task;
- model;
- provider;
- cost;
- Action Level;
- and abuse risk.

Rate limits must not prevent urgent Block, Report, Consent withdrawal or SafetySignal submission.

---

## 158. Quotas

Quotas may apply to:

- AI messages;
- high-cost research tasks;
- Life Story transcription;
- image or audio processing;
- embeddings;
- matching explanations;
- moderation assistance;
- and bulk analysis.

Quota state is visible and auditable.

---

## 159. Availability

The AI subsystem may have lower availability than:

- identity;
- Consent;
- Block;
- Report;
- Safety;
- intervention records;
- and research source records.

The Platform never makes critical Participant control depend on model availability.

---

## 160. Fallback Hierarchy

```text
Preferred Approved Model
        ↓
Approved Compatible Fallback
        ↓
Grounded Read-Only or Draft-Only Mode
        ↓
Rule-Based or Template Assistance
        ↓
Manual Workflow
        ↓
Unavailable with Clear Explanation
```

Fallback cannot bypass required review or change intervention behaviour silently.

---

## 161. Provider Failure

Provider failure should:

- record the exact failure;
- avoid unsafe repeated retries;
- apply approved fallback;
- preserve current workflow state;
- avoid false completion;
- and provide a clear user-facing result.

Sensitive request payloads are not copied into broad failure logs.

---

## 162. Retrieval Failure Mode

When retrieval is unavailable:

- approved EvidenceSnapshots may remain available;
- direct authorised structured records may be used;
- the output may be restricted to a Draft;
- unsupported claims are blocked;
- and Human Review may be required.

---

## 163. Tool Failure Mode

When a Tool fails:

- do not claim success;
- preserve idempotency state;
- retain the current domain state;
- report retryability;
- allow safe retry;
- and route Human Review where required.

---

## 164. Policy Failure Mode

If current permission, Consent, Visibility, Block, Resource State or Action Level cannot be evaluated:

- personalised Context is not assembled;
- sensitive retrieval is blocked;
- Tools are blocked;
- and only explicitly approved generic assistance may remain.

---

## 165. Audit Failure Mode

High-impact AI actions pause or use an approved durable audit queue.

A missing audit record cannot be treated as permission to proceed.

---

## 166. Degraded Modes

Representative modes:

- Full Governed AI;
- Grounded Read-Only AI;
- Draft-Only AI;
- No-Tool AI;
- No-Persistent-Memory AI;
- Template Assistance;
- Manual Workflow;
- and AI Disabled.

The active degraded mode is visible to clients and operators.

---

## 167. AI Observability

Observability includes:

- Interaction trace;
- task and risk;
- permission result;
- configuration;
- model and provider;
- Context size and source classes;
- retrieval;
- Prompt;
- Tool;
- validation;
- safety and moderation;
- Human Review;
- latency;
- usage;
- cost;
- fallback;
- and final domain result.

---

## 168. AI Logging

Operational logs avoid unnecessary:

- prompts;
- outputs;
- Life Story;
- Message content;
- MatchPreferences;
- reporter identity;
- Safety details;
- moderation evidence;
- and Tool arguments.

Sensitive detail belongs in governed AI records with restricted access.

---

## 169. AI Audit Record

Audit preserves:

- actor;
- role;
- purpose;
- Organisation and Research Project;
- Participant where permitted;
- AI configuration;
- model and provider;
- Prompt and Tool versions;
- Context and Retrieval references;
- output classification;
- confirmation or Human Review;
- SafetySignal or incident;
- final owning-domain action;
- and trace.

---

## 170. Model Usage Metrics

Representative metrics:

- requests by model and task;
- latency;
- error;
- fallback;
- token use;
- cost;
- Context size;
- structured-output failure;
- and provider identity change.

---

## 171. Quality Metrics

Representative metrics:

- correction rate;
- Human Review edit rate;
- rejection rate;
- citation coverage;
- unsupported-claim rate;
- Tool success;
- false-completion rate;
- and user-reported problem rate.

---

## 172. Safety and Moderation Metrics

Representative metrics:

- SafetySignals;
- escalation time;
- false positives and negatives;
- blocked outputs;
- prohibited clinical claims;
- dependency signals;
- moderation precision and recall;
- appeal reversal;
- reporter leakage;
- and incident rate.

---

## 173. Social and Matching Metrics

Representative metrics:

- prohibited-feature attempt;
- Block bypass attempt;
- MatchExplanation fidelity;
- MutualAcceptance boundary violation;
- Message send-confirmation failure;
- scam and harassment signal quality;
- fake-social-proof incident;
- and fairness measures.

Success is not defined solely by engagement, match acceptance or message volume.

---

## 174. Human Oversight Metrics

Representative metrics:

- review rate;
- edit rate;
- rejection rate;
- confirmation rate;
- time to review;
- reviewer disagreement;
- appeal;
- and unresolved queue age.

---

## 175. AI Service-Level Objectives

Potential objectives include:

- availability;
- latency;
- Tool success;
- grounding and citation;
- SafetySignal routing time;
- moderation queue enrichment time;
- deletion propagation;
- fallback rate;
- and cost.

Formal SLOs are task- and risk-specific.

---

## 176. Research Reproducibility

When AI affects research, preserve:

- AIInterventionConfigurationVersion;
- model alias and resolved provider model;
- Prompt and output schema versions;
- Context source versions;
- Retrieval Plan and results;
- Tool versions and results;
- memory policy;
- parameters;
- provider metadata;
- evaluation status;
- and software release.

---

## 177. AI-Generated Research Artefacts

AI-generated:

- Drafts;
- summaries;
- classifications;
- code;
- tables;
- visualisation suggestions;
- and interpretation Drafts

remain distinguishable from approved human artefacts.

AI cannot become the authorising reviewer.

---

## 178. AI-Assisted Analysis

AI may assist with:

- code Drafting;
- data documentation;
- variable explanation;
- qualitative coding suggestions;
- diagnostic explanation;
- visualisation suggestions;
- and narrative Drafting.

It cannot:

- select an unapproved DatasetVersion;
- modify a DatasetLock;
- approve a method;
- approve an InterpretationRecord;
- or approve a ResearchFinding.

---

## 179. Controlled AI Code Execution

AI-generated code executes only in a controlled environment with:

- approved locked DatasetVersion;
- restricted identity;
- restricted network;
- resource limits;
- package allowlist or lock;
- code capture;
- environment version;
- timeout;
- output capture;
- and Human Review.

No production database credential is available.

---

## 180. Code Execution Result

A code execution result records:

- code version;
- environment;
- DatasetLock;
- parameters;
- stdout and stderr references;
- outputs;
- checksums;
- resource use;
- exit state;
- warnings;
- and reviewer.

Execution does not create an approved AnalysisRun unless M13 records the governed run.

---

## 181. Qualitative Data Operations

AI-assisted qualitative analysis preserves:

- transcript source and version;
- Consent and purpose;
- codebook version;
- Prompt;
- model;
- suggested codes;
- evidence spans;
- human decisions;
- disagreement;
- and final approved coding.

Private Life Story or Message data require explicit DatasetDefinition and de-identification review.

---

## 182. Participant Media Operations

Media operations preserve:

- source object;
- Consent;
- purpose;
- provider;
- model or software;
- region;
- retention;
- quality;
- transcript or translation;
- correction;
- and deletion.

Biometric or third-party implications require additional review.

---

## 183. AI Data Retention

Retention is defined by:

- task;
- purpose;
- Consent;
- Research Project;
- Data Classification;
- provider;
- incident needs;
- research reproducibility;
- and Participant rights.

Interaction metadata, full content, Tool records, evaluation labels and provider logs may have different retention periods.

---

## 184. AI Deletion

Deletion considers:

- conversation content;
- prompts and outputs;
- AIMemoryItem;
- embeddings;
- retrieval cache;
- evaluation labels;
- Tool records;
- provider copies;
- derived summaries;
- and analytical artefacts.

Deletion is propagated and reconciled.

Historical audit may retain minimum evidence without retaining full content.

---

## 185. Provider Deletion

The Platform records whether a provider can:

- delete prompts;
- delete outputs;
- delete logs;
- delete embeddings;
- remove training or improvement use;
- and confirm deletion.

Provider inability or delay is disclosed in governance and Participant-facing information where material.

---

## 186. AI Security Architecture

The subsystem protects against:

- unauthorised Context;
- cross-project leakage;
- cross-Participant leakage;
- prompt injection;
- Tool injection;
- data exfiltration;
- approval forgery;
- model endpoint abuse;
- provider compromise;
- output poisoning;
- malicious files;
- and supply-chain compromise.

---

## 187. Prompt Injection Defence

Controls include:

- instruction and data separation;
- trusted policy layer;
- source labelling;
- retrieval isolation;
- permission before Context;
- Tool allowlists;
- schema enforcement;
- destination allowlists;
- output validation;
- and Human Review.

Prompt-injection detection is not the sole control.

---

## 188. Tool Injection Defence

Untrusted content cannot:

- register a Tool;
- change a Tool version;
- expand Action Level;
- grant permission;
- change confirmation;
- select arbitrary endpoints;
- or supply credentials.

Tool results are treated as data.

---

## 189. Cross-Project Isolation

AIInteraction, Context, Retrieval, memory, cache, evaluation and Tool access remain scoped to the current Research Project.

Cross-project research use requires approved Dataset and analytical workflow.

---

## 190. Cross-Participant Isolation

Participant Context, memory, Life Story, messages, matching and Safety records remain isolated.

Generic response reuse requires removal of Participant-specific information.

Testing includes deliberate cross-Participant attack attempts.



---

## 191. Secrets and Credentials

Provider keys, signing keys and credentials:

- remain in managed secrets infrastructure;
- use least-privilege workload identity;
- support rotation;
- are excluded from prompts, Tool arguments, logs and research artefacts;
- and are never exposed to the model.

A model cannot request secret retrieval.

---

## 192. Model Endpoint Protection

Model endpoints use:

- authenticated workload identity;
- outbound allowlists;
- approved regions;
- encrypted transport;
- rate and quota controls;
- timeout;
- request-size limits;
- provider identity verification;
- and audit.

Direct client access to provider endpoints is prohibited.

---

## 193. Provider Contract Requirements

Provider contracts should address:

- data ownership;
- permitted use;
- retention;
- training and service improvement;
- abuse monitoring;
- subprocessors;
- region;
- security;
- deletion;
- incident notification;
- audit evidence;
- service change;
- continuity;
- and exit.

A material contract change triggers re-review.

---

## 194. Supply-Chain Security

AI supply-chain review covers:

- provider SDKs;
- model-serving software;
- tokenisers;
- inference libraries;
- prompt libraries;
- evaluation tools;
- transcription and media processors;
- Vector libraries;
- and code-execution images.

Versions, provenance and vulnerability status are recorded.

---

## 195. AI Governance Roles

Representative roles include:

- AI Product Owner;
- AI Architecture Owner;
- Model Governance Owner;
- Prompt Owner;
- Tool Owner;
- AI Safety Owner;
- AI Privacy Owner;
- AI Security Owner;
- Research Governance Owner;
- Community Safety and Moderation Owner;
- Data Steward;
- Accessibility Owner;
- Provider Owner;
- and Incident Owner.

---

## 196. Approval Responsibilities

Approval may be required for:

- provider;
- model alias;
- Prompt;
- Tool;
- AIInterventionConfigurationVersion;
- Evaluation Dataset;
- release;
- participant-facing AI;
- high-risk data class;
- code-execution environment;
- and material rollback or retirement.

Approval references the exact version.

---

## 197. Separation of Duties

Where risk justifies it:

- Prompt author does not solely approve release;
- Tool developer does not solely approve Action Level;
- provider owner does not solely approve privacy terms;
- analyst does not lock Dataset;
- AI does not approve its evaluation;
- Moderator does not review their own high-impact decision appeal;
- and System Administrator does not acquire research or Safety authority.

---

## 198. AI Change Record

A material change record includes:

- changed component;
- prior and new version;
- reason;
- affected tasks and projects;
- data classes;
- evaluation;
- risk;
- Participant and research impact;
- approval;
- rollout;
- monitoring;
- rollback;
- and effective time.

---

## 199. Model Card

Each approved alias has a Model Card containing:

- intended use;
- prohibited use;
- provider;
- resolved model;
- tasks;
- data classes;
- regions;
- evaluation;
- limitations;
- known risks;
- accessibility;
- fairness;
- fallback;
- and lifecycle.

---

## 200. Prompt Card

Each production Prompt has:

- purpose;
- AI role;
- task;
- owner;
- version;
- input sources;
- output schema;
- grounding;
- Tools;
- risks;
- evaluation;
- languages;
- accessibility requirements;
- and lifecycle.

---

## 201. Tool Card

Each Tool has:

- purpose;
- owner;
- owning module;
- domain command or query;
- Action Level;
- side effects;
- permissions;
- Consent;
- Resource State;
- confirmation;
- Human Review;
- failure modes;
- idempotency;
- audit;
- and lifecycle.

---

## 202. AI Configuration Card

Each AI configuration summarises:

- Research Project and Protocol;
- AI roles;
- Participant experience;
- models;
- Prompts;
- Tools;
- retrieval;
- memory;
- Life Story;
- Community and matching;
- moderation and Safety;
- data policy;
- evaluation;
- rollout;
- and owner.

---

## 203. Provider Card

Each provider has a Provider Card including:

- legal entity;
- services;
- models;
- regions;
- data classes;
- retention;
- training use;
- subprocessors;
- security;
- deletion;
- incidents;
- contract date;
- and exit.

---

## 204. Evaluation Card

Each approved release has an Evaluation Card containing:

- evaluated configuration;
- datasets;
- tasks;
- thresholds;
- results;
- subgroup and accessibility analysis;
- must-pass failures;
- residual risks;
- limitations;
- reviewers;
- and release decision.

---

## 205. Testing Architecture

Testing includes:

- unit tests;
- policy tests;
- provider-adapter contract tests;
- Prompt tests;
- Tool schema and authority tests;
- retrieval tests;
- Context-isolation tests;
- end-to-end tests;
- security tests;
- accessibility tests;
- Safety and moderation tests;
- fairness tests;
- load and failure tests;
- research reproducibility tests;
- and restore and deletion tests.

---

## 206. Unit Tests

Unit tests cover:

- task classification;
- risk and Action Level;
- configuration resolution;
- routing;
- schema validation;
- permission intersection;
- Context filtering;
- Tool gating;
- output classification;
- and fallback.

---

## 207. Integration Tests

Integration tests cover:

- provider identity;
- Model Gateway;
- retrieval;
- Knowledge Platform;
- Search and Vector;
- Tool execution;
- confirmations;
- audit;
- deletion;
- and provider failure.

---

## 208. End-to-End Tests

End-to-end tests cover complete:

- research drafting;
- Life Story Draft and confirmation;
- Community Draft and publication;
- matching preference and explanation;
- MatchDecision and MutualAcceptance boundary;
- Message Draft and send;
- report and moderation triage;
- SafetySignal routing;
- AIMemoryItem review;
- Dataset documentation;
- and AI-assisted Analysis.

---

## 209. Negative Authority Tests

Test attempts to:

- grant Consent;
- infer substitute authority;
- bypass Block;
- access another Participant;
- publish Internet Public content;
- accept both match sides;
- create Connection;
- send without communication basis;
- reveal reporter;
- impose moderation;
- confirm SafetyEvent;
- lock Dataset;
- approve Interpretation;
- and approve ResearchFinding.

Every attempt must fail with an auditable structured result.

---

## 210. Failure and Degraded-Mode Tests

Test failure of:

- identity;
- permission;
- Consent;
- Block;
- Knowledge Platform;
- Search;
- Vector;
- provider;
- Tool;
- audit;
- notification;
- moderation provider;
- object storage;
- and analytical environment.

Critical non-AI controls must remain available.

---

## 211. Research Reproducibility Tests

Tests verify that a historical AIInteraction can resolve:

- exact configuration;
- model alias and provider model;
- Prompt;
- Tool;
- Context references;
- retrieval;
- parameters;
- output;
- Human Review;
- and final domain result.

Exact wording reproduction is not guaranteed when the provider is nondeterministic or retired, but provenance must remain complete.

---

## 212. AI Release Readiness

A release is ready only when:

- owners are assigned;
- configuration is approved;
- providers and models are eligible;
- Prompts and Tools are approved;
- evaluation thresholds pass;
- negative authority tests pass;
- accessibility review passes;
- monitoring and alerting exist;
- rollback and kill switches are tested;
- incident ownership is assigned;
- retention and deletion are defined;
- and documentation is complete.

---

## 213. AI Service Deployment

The MVP may deploy M11 within the modular backend plus separate worker processes.

Components may include:

- AI Orchestrator;
- Model Gateway;
- Retrieval Adapter;
- Tool Executor;
- Evaluation Worker;
- provider adapters;
- and monitoring.

A separate microservice is not required initially.

---

## 214. Workload Isolation

Separate queues or worker pools should isolate:

- Participant interactive AI;
- Safety and moderation assistance;
- transcription and media;
- embeddings;
- research drafting;
- evaluation;
- bulk analysis;
- and low-priority maintenance.

AI workload cannot exhaust resources required for Block, Report, Consent or Safety.

---

## 215. AI Storage Alignment

M11 storage includes:

- AIConversation;
- AIInteraction;
- ContextReference;
- RetrievalRecord;
- OutputRecord;
- ToolInvocation;
- Confirmation;
- HumanReview;
- configuration;
- AIMemoryItem;
- Evaluation;
- and AIIncident.

Source content remains owned by M01–M18 domain modules.

---

## 216. Event Architecture

Representative AI events include:

- AIInteractionRequested;
- AIPermissionAllowed;
- AIPermissionDenied;
- AIContextAssembled;
- AIRetrievalCompleted;
- AIOutputGenerated;
- AIInteractionCompleted;
- AIActionProposed;
- AIActionConfirmed;
- AIActionExecuted;
- AIActionFailed;
- AIHumanReviewRequested;
- AIMemoryItemStored;
- AIMemoryItemRevoked;
- AISafetySignalRaised;
- AIIncidentRecorded;
- AIConfigurationVersionActivated;
- and AIConfigurationVersionSuspended.

Events use minimum-necessary payloads.

---

## 217. API and MCP Alignment

AI interfaces follow Document 15.

MCP and API Tools do not redefine:

- ownership;
- permission;
- Consent;
- confirmation;
- or Action Level.

A Tool Card and versioned schema are required before production use.

---

## 218. MVP AI Roles

The MVP supports:

- Research Workflow Assistant;
- optional Participant Companion;
- Life Story Assistant;
- Community Draft Assistant;
- Open Matching Explanation Assistant;
- Message Draft Assistant;
- limited Moderation Triage Assistant;
- SafetySignal Detection Assistant;
- and AI as an Object of Research.

Each role may be disabled independently.

---

## 219. MVP Model Strategy

The MVP uses a small approved model set:

- one primary text model;
- one compatible fallback;
- one embedding capability if needed;
- one approved transcription model or provider if required;
- and optional restricted moderation classification.

Stable aliases are used instead of provider names in domain configuration.

---

## 220. MVP Prompt Strategy

The MVP uses:

- versioned Prompt Registry;
- separate Prompts by task and role;
- structured output for extraction and Tools;
- explicit grounding;
- Life Story confirmation wording;
- matching and Message safeguards;
- moderation and Safety boundaries;
- and Prompt Cards.

A single universal Prompt is prohibited.

---

## 221. MVP Tool Strategy

The MVP enables a small allowlisted Tool set.

Potential Tools include:

- retrieve approved evidence;
- retrieve permitted Platform records;
- create Research Draft;
- create Life Story Draft;
- propose Life Story Visibility;
- create SocialPost Draft;
- create MatchPreference Draft;
- explain MatchCandidate;
- propose MatchDecision;
- create Message Draft;
- create confirmed Block;
- submit UserReport;
- raise SafetySignal;
- and request Human Review.

High-impact autonomous Tools remain prohibited.

---

## 222. MVP Memory Strategy

The MVP supports:

- session context;
- optional short conversation summary;
- limited purpose-bound AIMemoryItem;
- Participant review and deletion;
- and explicit expiry.

It does not automatically retain:

- Life Story;
- Messages;
- Match history;
- Safety;
- moderation;
- precise location;
- or hidden inferred traits.

---

## 223. MVP Safety and Moderation Strategy

The MVP implements:

- deterministic policy;
- Tool allowlists;
- input and output classification;
- Human Review queues;
- AISafetySignalRaised;
- M09 SafetySignal routing;
- provisional moderation signals;
- human ModerationDecision;
- dependency safeguards;
- incident monitoring;
- and kill switches.

AI cannot confirm SafetyEvent or impose high-impact moderation.

---

## 224. MVP Evaluation Strategy

Before Participant use, the MVP requires:

- synthetic and expert-authored cases;
- permission and isolation tests;
- Life Story invention tests;
- matching and Block tests;
- Message send-confirmation tests;
- moderation tests;
- SafetySignal tests;
- accessibility tests;
- prompt-injection tests;
- provider-failure tests;
- and research traceability tests.

Online monitoring supplements, not replaces, pre-release evaluation.

---

## 225. MVP Observability Strategy

The MVP records:

- Interaction trace;
- configuration;
- model and provider;
- Prompt;
- Context source classes;
- retrieval;
- Tool;
- confirmation;
- Human Review;
- output classification;
- Safety and moderation signals;
- latency;
- usage;
- cost;
- and final domain result.

Logs remain content-minimised.

---

## 226. MVP Non-Goals

The MVP does not require:

- autonomous general agents;
- unrestricted web browsing;
- autonomous Consent;
- autonomous Participant enrolment;
- autonomous Life Story publication;
- autonomous Internet Public publication;
- autonomous matching acceptance;
- autonomous Connection creation;
- autonomous Message sending;
- fake social agents;
- autonomous high-impact moderation;
- autonomous SafetyEvent confirmation;
- autonomous DatasetLock;
- autonomous research approval;
- continuous unrestricted memory;
- cross-project global personalisation;
- model training on Participant data;
- open-ended production code execution;
- multi-provider optimisation marketplace;
- or a separate AI microservice platform.

---

## 227. Deferred Capabilities

Deferred capabilities may include:

- local multimodal models;
- advanced voice interaction;
- on-device inference;
- privacy-preserving personalisation;
- secure federated AI;
- advanced agent workflows;
- multi-agent research simulation;
- continuous automated red teaming;
- advanced social and fraud models;
- privacy-preserving matching;
- model fine-tuning;
- retrieval over larger approved repositories;
- and institution-specific AI gateways.

---

## 228. Future Evolution

Future versions may support:

- Participant-controlled local AI;
- portable AI preferences;
- secure research enclaves;
- verified content provenance;
- privacy-preserving memory;
- federated evaluation;
- institution-specific models;
- multimodal Life Story;
- advanced Community safety;
- privacy-preserving matching;
- and posthumous digital-legacy assistance.

Future sophistication must preserve current domain and human authority boundaries.

---

## 229. Open Questions

1. Which provider and models satisfy the first Pilot's data-residency and retention requirements?
2. Which tasks require a local or private model?
3. Which AI roles are enabled at Pilot launch?
4. Which AIInterventionConfigurationVersions are required?
5. Which tasks require Evidence Grounding, Platform Grounding or both?
6. Which model aliases and fallback rules are approved?
7. Which Prompt and output schemas are required first?
8. Which Tool Action Levels are enabled?
9. Which Level 3 actions require step-up authentication?
10. Which Human Review roles and response targets apply?
11. Which Life Story media types may use external processing?
12. Which Life Story fields may AI suggest?
13. Which PublicProfile fields may AI help Draft?
14. Which Community tasks use AI?
15. Which matching attributes may enter AI Context?
16. Which MatchExplanation content may be displayed?
17. Which Message assistance and scam controls are enabled?
18. Which moderation categories may use provider classification?
19. Which SafetySignal categories require immediate escalation?
20. Which AIMemoryItems are permitted?
21. What are their expiry and deletion rules?
22. Which data classes may be sent to each provider?
23. Does the provider permit retention, training or abuse monitoring?
24. Which Evaluation Datasets and thresholds are required?
25. Which fairness groups may be evaluated lawfully and ethically?
26. What invented-Life-Story threshold blocks release?
27. Which matching and moderation fairness thresholds apply?
28. Which tasks permit streaming?
29. Which tasks permit fallback substitution?
30. Which cost and latency budgets apply?
31. Which SLOs are required during Pilot hours?
32. Which kill switches are exposed to operations?
33. Which incidents trigger study or intervention pause?
34. Which AI records enter DatasetDefinition?
35. Which AI-assisted code execution is permitted?
36. Which provider-deletion guarantees are sufficient?
37. Which model and Prompt changes require re-Consent or Protocol amendment?
38. Which configuration components must be frozen for research reproducibility?
39. Which operational metrics become research process measures?
40. Who approves cross-domain AI changes affecting Life Story, matching, moderation or Safety?

---

## 230. Design Decisions

This document establishes that:

1. Document 17 is the authoritative Handbook source for AI orchestration and model operations.
2. M11 is the only Platform module permitted to call model providers.
3. Domain modules access AI through governed M11 interfaces.
4. AI does not own another module's aggregate.
5. AI may assist, Draft, retrieve, explain and propose.
6. Domain authority remains deterministic and human-accountable.
7. Effective AI Permission is an intersection of human permission, configuration, task, Tool, Consent, purpose, Context, Data Classification, Resource State and Action Risk.
8. Human permission uses Role, Relationship, Consent, Purpose, Context, Specific Permission and Resource State.
9. Visibility, Block, MutualAcceptance and communication basis are enforced before AI Context or Tool use.
10. Client or model-supplied authority is never trusted.
11. AI roles are explicit per Research Project.
12. Risk and Action Level are task- and context-specific.
13. Level 5 autonomous actions are prohibited.
14. AI cannot grant or alter Consent.
15. AI cannot infer substitute authority.
16. AI cannot approve Protocol, Intervention, Evidence, Dataset, Analysis, Interpretation or Finding.
17. AI cannot publish Internet Public content.
18. AI cannot accept a MatchCandidate or create a Connection.
19. AI cannot send an unauthorised Message.
20. AI cannot impose high-impact ModerationDecision.
21. AI cannot confirm, resolve or close SafetyEvent.
22. AI cannot change LegacyPreference.
23. AIInteraction is the primary traceability unit.
24. AIInterventionConfigurationVersion is governed and immutable after approval.
25. Resolved configuration snapshots support reproducibility.
26. Provider-specific APIs remain behind Model Gateway.
27. Provider adapters do not own Consent or domain policy.
28. Providers, models and aliases have separate registries and lifecycles.
29. Provider-data policy is evaluated before dispatch.
30. Silence is not provider permission.
31. Model routing considers task, risk, data class, region, evaluation and Protocol.
32. Model substitution is not silent when it may affect Participant experience or research.
33. Prompts and output schemas are versioned separately.
34. Instruction hierarchy separates trusted policy from untrusted content.
35. Context Assembly is a security and research control point.
36. Permission filtering occurs before retrieval and model invocation.
37. Context is minimum-necessary and source-labelled.
38. Cross-project and cross-Participant Context isolation is mandatory.
39. Temporary Context is not persistent memory.
40. Authoritative Knowledge retrieval passes through M10.
41. Research Platform retrieval uses governed APIs or Tools.
42. Search and Vector candidates are re-authorised at source.
43. Retrieval failure does not permit fabricated evidence.
44. Citations derive from Retrieval Records.
45. Every Tool has a typed versioned contract.
46. Tool Action Level, permission, Consent, Resource State and confirmation are explicit.
47. Model-generated authority fields are rejected.
48. Tool execution occurs through the owning-domain command.
49. Tool success is established only by structured domain result.
50. Idempotency and optimistic concurrency apply to effectful Tools.
51. The model cannot confirm its own proposal.
52. Silence and timeout do not create approval.
53. AI outputs use independent epistemic, review, safety, grounding and action states.
54. AI Draft is not Participant Testimony.
55. AI Draft is not a sent Message or published SocialPost.
56. Life Story assistance requires Participant confirmation.
57. AI cannot invent Life Story details as facts.
58. Life Story is not automatically AI memory.
59. PublicProfile is not populated automatically from ParticipantProfile.
60. Community AI cannot create fake social proof.
61. Community ranking cannot optimise primarily for dependency or controversy.
62. Open Matching remains opt-in.
63. Matching AI uses only allowed attributes.
64. MatchExplanation does not present compatibility as objective truth.
65. Each Participant records their own MatchDecision.
66. MutualAcceptance and Connection are M18 domain consequences.
67. Messaging requires communication basis, no Block and confirmation.
68. Message Draft is not sent.
69. Message content is excluded from ordinary memory and unrelated retrieval.
70. AI moderation output is provisional.
71. High-impact moderation and appeals remain human decisions.
72. Reporter identity remains protected.
73. AISafetySignalRaised creates a SafetySignal, not SafetyEvent.
74. AI has no independent clinical authority.
75. AI must not exploit loneliness or encourage dependency.
76. Dependency signals require cautious human review.
77. AIMemoryItem remains separate from Profile, Life Story, matching, messages, Safety and research.
78. Persistent memory is purpose-bound, reviewable and deletable.
79. Sensitive content is not retained automatically.
80. Personalisation may change presentation but not rights, Protocol or evidence.
81. Accessibility is part of release readiness.
82. Provider and model eligibility are data-class and region-specific.
83. Fallback is allowed only to an approved compatible configuration.
84. AI release units include configuration, model, Prompt, Tool, retrieval, memory, safety and evaluation.
85. Offline evaluation precedes production use.
86. Evaluation datasets are governed and versioned.
87. Evaluation is task-specific and multidimensional.
88. Must-pass boundaries override average scores.
89. Life Story invention has a release-blocking threshold.
90. Matching evaluation includes prohibited-feature and Block checks.
91. Moderation evaluation includes bias and appeal outcomes.
92. Safety evaluation cannot authorise SafetyEvent confirmation.
93. Human-connection evaluation does not use engagement time as the main success measure.
94. Prompt-injection testing includes retrieved and social content.
95. Every prohibited action has a negative test.
96. Production monitoring uses minimum-necessary telemetry.
97. Drift includes behaviour, retrieval, privacy, fairness, moderation and Safety changes.
98. Material change triggers re-evaluation.
99. Shadow and canary modes require current data authority.
100. Rollback preserves historical configuration traceability.
101. Kill switches exist at provider, model, Prompt, Tool, role, project and system levels.
102. Critical Participant controls remain available without AI.
103. Incidents assess Participant and research impact.
104. Cost control cannot weaken safety, evidence or accessibility.
105. Streaming does not bypass policy or final action confirmation.
106. Sensitive response reuse is prohibited.
107. AI availability may be lower than core Platform controls.
108. Degraded modes are explicit.
109. Operational logs minimise sensitive content.
110. AI audit preserves configuration, Context, Tool, review and final action.
111. Research reproducibility preserves exact AI versions and provenance.
112. AI-generated research artefacts remain distinguishable from approved human artefacts.
113. AI-assisted code executes only in a controlled analytical environment.
114. AI cannot access production database credentials.
115. Retention differs across metadata, content, memory, Tool and provider records.
116. Deletion propagates to memory, embeddings, caches and providers.
117. Provider deletion capability is recorded and reviewed.
118. Prompt and Tool injection are controlled through deterministic boundaries.
119. Governance roles and separation of duties are explicit.
120. Model, Prompt, Tool, Provider, Configuration and Evaluation Cards are required.
121. The MVP uses a small approved model and Tool set.
122. The MVP includes Life Story, Community, matching, Message, moderation and Safety assistance.
123. Internet Public publication remains prohibited for autonomous AI.
124. Autonomous general agents are not required for the MVP.
125. Future AI evolution preserves Participant autonomy, domain ownership, human accountability and research reproducibility.

---

## 231. Summary

The AI Orchestration & Model Operations Architecture implements AI through:

```text
Actor or Platform Workflow
        ↓
M11 AI Orchestrator
        ↓
Effective AI Permission
        ↓
Approved AI Configuration
        ↓
Minimum-Necessary Context and Retrieval
        ↓
Model Gateway
        ↓
Output Validation
        ↓
Typed Tool Proposal
        ↓
Confirmation or Human Review
        ↓
Owning-Domain Command
        ↓
Structured Result, Audit and Evaluation
```

The central Participant boundary is:

```text
AI Draft
    ≠ Participant Testimony
    ≠ Published Social Content
    ≠ Sent Message
    ≠ Match Acceptance
    ≠ Connection
```

The central safety and moderation boundary is:

```text
AI or Provider Signal
        ↓
Provisional Classification
        ↓
Human Review
        ↓
ModerationDecision or SafetySignal
        ↓
SafetyEvent only if Human-Confirmed
```

The central research boundary is:

```text
AI Assistance
        ↓
Draft or AnalysisOutput
        ↓
Human Interpretation and Review
        ↓
Approved ResearchFinding
```

The central rule is:

> AI may increase capability, accessibility and research efficiency, but it must not acquire authority from fluency, confidence, provider metadata, technical access or user dependency.

The MVP should prove that AI can support a complete Healthy Aging intervention research cycle—including Life Story, Community and Open Matching—while preserving Participant control, human connection, Safety, moderation accountability and research reproducibility.
