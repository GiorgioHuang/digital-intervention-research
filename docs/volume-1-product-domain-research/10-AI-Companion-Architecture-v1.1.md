# Document 10 — AI Companion Architecture

**Version:** 1.1  
**Status:** Revised Architecture Baseline  
**Handbook Volume:** Volume I — Product, Domain & Research Architecture  
**Primary System:** Digital Intervention Research Platform  
**Primary Product Module:** M11 — AI Companion  
**Document Owner:** AI, Product and Research Governance  
**Approved By:** To be assigned  
**Last Updated:** 2026-07-28  
**Supersedes:** Document 10 — AI Companion Architecture v1.0  
**Review Trigger:** A material change to AI responsibilities, supported roles, model behaviour, tool permissions, context assembly, memory, Participant-facing use, Life Story, Community, Open Matching, messaging, moderation, evidence retrieval, intervention configuration, safety controls, provider configuration, or evaluation requirements

---

## 1. Purpose

This document defines the architecture of the **AI Companion** within the **Healthy Aging Digital Intervention Research Platform**.

The project objective is not to build a general AI platform or a generic chatbot.

The objective is:

> To use AI responsibly inside a research platform that designs, delivers, and evaluates digital interventions for Healthy Aging.

The AI Companion exists to support that objective by helping authorised users:

- discover and understand evidence;
- design and document interventions;
- prepare research protocols;
- navigate platform workflows;
- deliver approved intervention components;
- provide ability-adaptive assistance;
- facilitate meaningful human connection;
- support Participant-controlled Life Story capture and organisation;
- explain Community, public-visibility, matching and connection choices;
- assist with Community content and message drafting without autonomous publication or sending;
- support moderation triage without owning moderation decisions;
- interpret platform information;
- prepare research outputs; and
- identify situations requiring human review, Safety Signal creation, privacy review, or moderation.

The AI Companion must remain subordinate to:

- the intervention purpose;
- the approved research protocol;
- evidence and provenance;
- user permissions;
- Participant consent and item-level sharing choices;
- human accountability;
- safety, moderation, privacy, public-visibility, matching, and anti-dependency constraints;
- the autonomy and dignity of the Participant;
- and the distinction between AI assistance and human relationship.

This document defines product responsibilities, logical components, interaction flows, safety boundaries, permission controls, intervention-version requirements, evaluation principles, and MVP scope.

It does not prescribe a final model provider, orchestration framework, prompt format, cloud service, or user-interface design.

---

## 2. Project Alignment

The Digital Intervention Research Platform begins with Healthy Aging challenges and intervention questions, not with AI capabilities.

The governing sequence remains:

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

AI may support each stage, but it does not replace the sequence with:

```text
AI Capability
        ↓
Feature
        ↓
User Engagement
```

The AI Companion is therefore successful only when it contributes to meaningful, safe, measurable, and evidence-informed intervention work.

High conversation volume, longer screen time, emotional attachment, or autonomous behaviour are not primary success criteria.

---

## 3. Scope

This document covers:

- the role of the AI Companion in the Research Platform;
- researcher-facing and Participant-facing assistance;
- role-adaptive AI modes;
- AI context assembly;
- evidence retrieval and grounding;
- tool use and action controls;
- permissions and consent enforcement;
- AI memory and personalisation;
- Life Story drafting, transcription, organisation, attribution, sharing and legacy boundaries;
- Community discovery, public content, Open Matching, connections and messaging;
- moderation-assistance boundaries;
- ability-adaptive interaction;
- safety, Safety Signal creation, escalation, moderation and human oversight;
- AI transparency and provenance;
- AI intervention configuration and versioning;
- model and prompt lifecycle management;
- auditability and observability;
- AI evaluation within research studies;
- failure and degraded modes;
- MVP boundaries; and
- future evolution.

This document does not define:

- the internal architecture of foundation models;
- the internal ontology of the Knowledge Platform;
- clinical diagnosis or treatment systems;
- autonomous healthcare decision-making;
- final statistical analysis methods;
- production infrastructure topology;
- detailed API contracts;
- final prompt content; or
- complete research governance policy.

---

## 4. Relationship to Other Documents

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
- Batch 2 Handbook Consistency Review v1.0

### Provides input to

- Document 11 — Research & Evaluation Framework
- Document 12 — Data & Interoperability Architecture
- Technical Architecture
- AI Safety and Governance Policy
- Prompt and Tool Specifications
- Intervention Protocol Templates
- AI Evaluation Plans
- Document 18 — MVP Scope & Delivery Roadmap revision
- Document 19 — Initial Pilot Research Protocol revision
- Document 20 — UX Flows & Design System Specification revision
- MVP Delivery Plan

---

## 5. Definition of the AI Companion

The **AI Companion** is a permission-aware, evidence-grounded, role-adaptive assistance capability embedded in the Digital Intervention Research Platform.

It is not a separate authority and does not own platform data, evidence, research decisions, intervention governance, or Participant consent.

The term **AI Companion** is an umbrella architectural term.

It may appear through different task-specific modes, such as:

- Research Assistant;
- Evidence Assistant;
- Intervention Design Assistant;
- Protocol Assistant;
- Participant Companion;
- Navigation Assistant;
- Life Story Assistant;
- Community Participation Assistant;
- Matching Explanation Assistant;
- Supporter Assistance Mode;
- Professional Caregiver Task Support;
- Moderation Triage Assistant;
- Safety and Human-Support Routing Mode;
- Administration and Diagnostics Support; and
- Reporting Assistant.

These are contextual modes of one governed platform capability, not independent autonomous systems by default.

The AI Companion should maintain a clear and stable identity while adapting its language, available tools, information access, and actions to the current user and task.

---

## 6. Architectural Position

The AI Companion operates across Research Platform modules through controlled platform services.

```text
User Interface
        ↓
AI Interaction Gateway
        ↓
Identity, Role, Consent and Permission Resolution
        ↓
Intent and Risk Classification
        ↓
Context Assembly
        ├── Research Platform Data
        ├── Approved Project Records
        ├── Knowledge Platform Evidence
        ├── User Preferences
        └── Current Task State
        ↓
AI Orchestrator
        ├── Retrieval
        ├── Tool Selection
        ├── Model Invocation
        └── Draft Generation
        ↓
Policy and Output Validation
        ↓
Explain • Suggest • Draft • Request Approval • Act
        ↓
Audit, Evaluation and Feedback
```

The AI Companion must access platform capabilities through governed interfaces.

It must not connect directly to unrestricted databases, internal infrastructure, or external services without policy enforcement.

---

## 7. Core Design Principles

### 7.1 Intervention Before AI

AI functionality must be linked to a defined intervention purpose, research workflow, or platform task.

A technically impressive capability is not sufficient justification for deployment.

### 7.2 Evidence Before Intelligence

Where evidence is relevant, AI responses should be grounded in traceable sources and should preserve uncertainty.

### 7.3 Human Connection Over AI Substitution

The AI Companion should facilitate, strengthen, or extend meaningful human relationships rather than compete with them.

### 7.4 Assistance Before Autonomy

The default role of AI is to explain, suggest, draft, organise, and support.

Autonomous action requires explicit justification, bounded permissions, reversibility, and monitoring.

### 7.5 Person Before Technology

The AI Companion adapts to the person's abilities, preferences, goals, language, and context.

It must not demand that the person adapt to the AI.

### 7.6 Consent and Minimum Necessary Access

The AI Companion receives only the information and tools required for the current authorised purpose.

### 7.7 Transparent Identity

The AI Companion must identify itself as AI and must not imply that it is human, conscious, emotionally dependent, or personally in need of the user.

### 7.8 Explain Rather Than Command

Participant-facing AI should support understanding and choice rather than issue unexplained instructions.

### 7.9 Reversibility

AI-assisted changes should be reversible where technically and ethically possible.

### 7.10 Uncertainty Must Remain Visible

The AI Companion should say when it does not know, when evidence is incomplete, and when human review is required.

### 7.11 Research Reproducibility

When AI materially affects an intervention, analysis, or research output, its configuration and use must be recorded sufficiently for later review.

### 7.12 No Engagement Maximisation

The AI Companion must not be optimised primarily to maximise conversation length, emotional dependency, notification response, or screen time.

### 7.13 Human Accountability

Every material scientific, safety, consent, governance, or publication decision must remain attributable to an authorised human.

---

## 8. AI Roles in the Research Platform

The AI Companion may perform three distinct architectural roles.

### 8.1 AI as Research Workflow Assistant

AI supports researchers and authorised project staff with:

- evidence discovery;
- research question refinement;
- intervention mapping;
- protocol drafting;
- measurement exploration;
- study preparation;
- data-quality review;
- interpretation support;
- report drafting; and
- research finding preparation.

In this role, AI assists the work but is not itself the intervention being studied.

### 8.2 AI as Intervention Delivery Component

AI may deliver or mediate an approved intervention component, such as:

- structured conversation prompts;
- accessible activity guidance;
- life-story elicitation;
- communication preparation;
- orientation support;
- reminder explanation;
- goal reflection; or
- facilitation of contact with an authorised person.

In this role, AI behaviour forms part of the intervention configuration and must be versioned, evaluated, and governed accordingly.

### 8.3 AI as Object of Research

A study may explicitly evaluate:

- AI usability;
- trust calibration;
- explanation quality;
- accessibility;
- personalisation;
- safety;
- human-connection effects;
- intervention benefit;
- burden;
- bias; or
- harm.

In this role, AI is part of the research question and may require control conditions, specific consent, model stability, and additional monitoring.

### 8.4 Role Declaration

Every Research Project using AI should declare whether AI is:

- a workflow tool;
- an intervention component;
- a measurement or analysis aid;
- an object of research; or
- more than one of these.

The declared role determines versioning, consent, evaluation, and approval requirements.

---

## 9. Role-Adaptive AI Modes

### 9.1 Researcher Mode

Supports:

- evidence-grounded research planning;
- intervention design;
- protocol preparation;
- review workflows;
- analysis support; and
- reporting.

It may access approved research data according to project permissions.

### 9.2 Participant Mode

Supports:

- onboarding;
- navigation;
- intervention participation;
- explanation;
- reminders;
- reflection;
- communication; and
- ability-adaptive assistance.

It must use Participant-appropriate language and avoid scientific or clinical authority claims.

### 9.3 Supporter Mode

Supports an authorised Supporter with:

- understanding shared information;
- contributing to approved activities;
- preparing messages;
- participating in life-story work; and
- maintaining connection.

It must not expose unshared Participant information, treat relationship status as permission, or allow the Supporter to override Participant choices.

### 9.4 Professional Caregiver Mode

Supports authorised Professional Caregivers with:

- understanding assigned tasks;
- accessible documentation assistance;
- intervention delivery guidance;
- observation drafting;
- communication preparation; and
- escalation routing.

It must distinguish Professional Caregiver observations from verified facts and must not silently convert free text into clinical conclusions, diagnoses, medication recommendations, or Safety Event decisions.

### 9.5 Administrator Mode

Supports:

- diagnostics;
- configuration review;
- integration status;
- usage monitoring; and
- operational troubleshooting.

Administrative access does not create research, evidence, or Participant-governance authority.


### 9.6 Evidence Reviewer Mode

Supports:

- Knowledge Platform retrieval through M10;
- Evidence Review comparison;
- directness and applicability assessment;
- conflict, null, harmful and missing-evidence review;
- Evidence Decision drafting;
- provenance and licensing review;
- and Reference Change Alert explanation.

It cannot approve an Evidence Review, Evidence Decision, Intervention Evidence Status, Evidence Direction, Protocol Version, or Research Finding.

### 9.7 Safety Reviewer Mode

Supports:

- Safety Signal summarisation;
- source and timeline organisation;
- applicable Protocol and stopping-rule retrieval;
- draft Safety Action options;
- and human-review preparation.

It cannot confirm or close a Safety Event, determine clinical risk, or decide that a risk is acceptable.

### 9.8 Moderator Mode

Supports:

- report summarisation;
- Community Rule retrieval;
- affected-content and interaction timeline organisation;
- duplicate or related-report identification;
- provisional classification;
- draft moderation options;
- appeal comparison;
- and restoration-review preparation.

It cannot autonomously impose a high-impact account restriction, decide a Safety Event, reveal reporter identity, or access unrelated Participant or research records.

### 9.9 Community and Matching Assistance Mode

Supports:

- Community Space discovery;
- Community Rule explanation;
- public-profile drafting;
- Social Post, Comment and message drafting;
- audience and visibility explanation;
- Match Preference explanation;
- Match Candidate explanation;
- introduction drafting;
- and block, mute, disconnect and report guidance.

It cannot publish content, accept a Match Candidate, create a Connection, start private messaging, infer sensitive matching traits, or act on behalf of another person without the required confirmation and domain permission.

### 9.10 Mode Boundaries

Changing mode must not bypass permissions.

The same user may have multiple roles, but the active context and purpose must be explicit before information or tools are made available.

---

## 10. Researcher-Facing Capabilities

### 10.1 Research Question Support

The AI Companion may help:

- clarify the Healthy Aging challenge;
- identify the target population;
- distinguish intervention questions from feature questions;
- identify assumptions;
- identify outcomes and mechanisms;
- search for existing evidence;
- identify knowledge gaps; and
- convert broad interests into answerable research questions.

It should not claim that a question is novel solely because no result was retrieved.

### 10.2 Evidence Support

The AI Companion may:

- construct evidence queries;
- summarise retrieved resources;
- compare evidence;
- identify conflicts;
- organise supporting, null, negative, indirect, and missing evidence;
- draft Evidence Decision rationales; and
- identify missing provenance.

All material claims should remain linked to Knowledge References or clearly labelled as inference.

### 10.3 Intervention Design Support

The AI Companion may help connect:

```text
Challenge
    ↓
Population
    ↓
Intervention Component
    ↓
Mechanism
    ↓
Proximal Outcome
    ↓
Healthy Aging Outcome
    ↓
Measurement
```

It may identify missing dependencies, risks, safeguards, adaptation needs, and research questions.

It must not treat a plausible mechanism as established evidence.

### 10.4 Protocol Support

The AI Companion may draft or review:

- objectives;
- eligibility criteria;
- intervention schedules;
- assessment schedules;
- consent language;
- safety checks;
- withdrawal pathways;
- escalation rules;
- analysis-plan structure; and
- reporting requirements.

Protocol approval remains human-controlled.

### 10.5 Study Operations Support

The AI Companion may assist with:

- task reminders;
- missing-record identification;
- workflow summaries;
- study-status explanation;
- issue triage;
- Participant communication drafts;
- data-quality queries; and
- preparation for monitoring meetings.

It should not alter Participant status, eligibility, consent, or Safety Event classification without authorised human action.

### 10.6 Evaluation and Interpretation Support

The AI Companion may:

- organise outcome results;
- compare expected and observed pathways;
- identify implementation variation;
- surface null and negative findings;
- identify potential confounders for review;
- draft interpretations;
- link findings to prior evidence; and
- prepare limitations.

It must not invent statistical significance, causal conclusions, or unsupported generalisations.

### 10.7 Reporting Support

The AI Companion may prepare drafts for:

- project summaries;
- evidence reviews;
- protocol sections;
- Participant-facing explanations;
- monitoring reports;
- finding summaries;
- Evidence Packages; and
- publication materials.

Drafts must preserve source attribution, AI-assistance disclosure where required, and human approval status.

---

## 11. Participant-Facing Capabilities

### 11.1 Onboarding and Navigation

The AI Companion may:

- explain what the platform does;
- guide users through onboarding;
- offer step-by-step navigation;
- repeat information without judgement;
- explain permissions and sharing;
- help users adjust accessibility settings; and
- connect users to human support.

### 11.2 Intervention Participation

Within an approved protocol, the AI Companion may:

- deliver prompts;
- explain an activity;
- support reflection;
- offer approved choices;
- record user responses;
- provide non-evaluative encouragement;
- adjust presentation; and
- request confirmation before relevant changes.

### 11.3 Human Connection Facilitation

The AI Companion may:

- suggest an authorised person to contact;
- help prepare a message;
- help record a voice message;
- explain an upcoming community activity;
- support conversation preparation;
- remind the user of approved relationship activities; and
- help respond to received messages.

It must not impersonate another person, manufacture social approval, or misrepresent another person's intentions.


### 11.4 Community Participation Support

The AI Companion may:

- explain Community Space purpose, eligibility, audience and rules;
- help discover relevant Community Spaces using permitted declared interests;
- summarise a discussion within the Participant's visibility scope;
- draft a Social Post, Comment or response;
- translate or simplify community content;
- explain visibility, quotation, download and re-sharing choices;
- help hide, mute, block, disconnect or report;
- and support reflection on whether participation felt meaningful, burdensome or unsafe.

It must not:

- publish without explicit confirmation;
- expose private Participant, Life Story, message, matching, consent, assessment or safety information;
- create artificial reactions, followers, endorsement or social proof;
- optimise solely for time, reactions, controversy or dependency;
- or treat post count, reactions or session duration as Healthy Aging benefit.

### 11.5 Open Matching Support

The AI Companion may:

- explain whether matching is active;
- help the Participant create or revise Match Preferences;
- explain which declared attributes are used;
- explain broad location and privacy boundaries;
- present a Match Candidate and Match Explanation;
- help the Participant record Interested, Not Now or Dismissed;
- draft an introduction after applicable eligibility and mutual-interest conditions;
- explain mutual acceptance;
- and help pause matching, block, report or disconnect.

It must not:

- activate Open Matching without explicit Participant choice;
- infer or use sensitive traits without separately approved consent and governance;
- generate hidden compatibility, vulnerability or capacity scores;
- accept a candidate on the Participant's behalf;
- create a Connection without Mutual Acceptance;
- enable private messaging before the applicable communication basis exists;
- bypass a Block Record;
- or misrepresent the other person's intentions.

### 11.6 Life Story Support

The AI Companion may:

- invite stories;
- ask optional follow-up questions;
- help organise stories;
- generate draft titles or summaries;
- identify people, places, or themes for user confirmation;
- support multimedia contribution; and
- explain sharing, audience, download, quotation, re-sharing, research-use and legacy choices;
- transcribe, translate and organise media where permitted;
- identify proposed people, places, dates or themes for confirmation;
- preserve contribution attribution;
- and help the Participant review, correct, hide or withdraw content.

AI-generated wording remains a Draft until confirmed. The AI Companion must not:

- invent a memory, event, person, date, relationship or emotional meaning;
- present inferred or reconstructed details as Participant Testimony or verified history;
- convert a Supporter contribution into Participant Testimony without confirmation;
- transfer Life Story ownership;
- change a Legacy Preference;
- publish to Community, Platform Public or Internet Public without explicit confirmation;
- treat Life Story activity as cognitive assessment;
- or infer diagnosis, capacity or impairment from a story.

### 11.7 Meaningful Engagement Support

The AI Companion may:

- suggest approved activities based on expressed preferences;
- explain activity purpose;
- adapt instructions;
- help the user choose difficulty;
- help locate human or community participation; and
- support reflection on enjoyment or burden.

It must not use addictive mechanics or pressure the user to continue.

### 11.8 Orientation and External Memory Support

The AI Companion may:

- explain current platform location;
- summarise recent approved activity;
- show upcoming plans;
- repeat saved intentions;
- guide a user back to a known screen; and
- provide source-aware reminders.

It must not fabricate memories, claim certainty about disputed events, or present an inference as the user's prior decision.

### 11.9 Emotional Support Boundary

The AI Companion may provide calm, respectful, non-clinical emotional support.

It may:

- acknowledge the user's expressed feelings;
- offer simple choices;
- suggest contacting an authorised person;
- help communicate a concern; and
- follow configured escalation pathways.

It must not:

- claim to love, need, miss, or depend on the user;
- encourage exclusivity;
- discourage human support;
- imply that it understands emotions with certainty;
- diagnose a mental-health condition; or
- present itself as a therapist unless operating within a separately governed clinical system.

---

## 12. AI Interaction Lifecycle

Every AI interaction should follow a controlled lifecycle.

```text
User Input or Platform Trigger
        ↓
Identity and Active Role Resolution
        ↓
Purpose, Consent, Permission and Resource-State Check
        ↓
Task, Data, Evidence, Action and Risk Classification
        ↓
Context Assembly
        ↓
Retrieval and Tool Planning
        ↓
Model Generation
        ↓
Grounding, Policy and Output Validation
        ↓
Response or Action Proposal
        ↓
Human Confirmation Where Required
        ↓
Action Execution
        ↓
Result Confirmation
        ↓
Audit and Evaluation Record
```

Failure at a required control point should stop or degrade the interaction rather than bypass the control.

---

## 13. Core Logical Components

### 13.1 AI Interaction Gateway

Receives requests from text, voice, and supported multimodal interfaces.

Responsibilities include:

- session identification;
- channel normalisation;
- input size controls;
- supported-language detection;
- attachment handling;
- rate limiting;
- abuse protection; and
- trace creation.

### 13.2 Identity and Permission Resolver

Determines:

- authenticated actor;
- active role and Organisation scope;
- Research Project membership;
- Participant relationship;
- consent state;
- delegated or substitute authority where separately verified;
- purpose and context;
- Specific Permission;
- Resource State;
- Data Classification;
- action risk;
- and effective human and AI permissions.

### 13.3 Intent and Risk Classifier

Classifies the request by:

- task intent;
- user role;
- data sensitivity;
- action type;
- intervention context;
- evidence requirement;
- safety relevance; and
- human-approval requirement.

Classification supports routing but does not replace deterministic policy rules.

### 13.4 Context Assembly Service

Builds the minimum authorised context required for the current task.

### 13.5 AI Orchestrator

Coordinates:

- task decomposition;
- retrieval;
- tool selection;
- model invocation;
- response assembly;
- validation; and
- action proposal.

### 13.6 Retrieval Service

Retrieves authorised:

- approved platform records;
- project documents;
- Evidence Decisions;
- Knowledge Platform evidence;
- intervention definitions;
- protocol versions;
- user preferences; and
- relevant conversation context.

### 13.7 Tool Registry and Tool Gateway

Provides policy-controlled access to platform actions.

### 13.8 Model Gateway

Abstracts model providers, model versions, modality, routing, and execution parameters.

### 13.9 Policy Engine

Applies deterministic rules for:

- permissions;
- consent;
- sensitive data;
- action approval;
- role boundaries;
- Participant safety;
- research governance; and
- output restrictions.

### 13.10 Output Validator

Checks:

- source labels;
- citation presence;
- unsupported claims;
- prohibited content;
- action scope;
- required disclaimers;
- uncertainty language;
- accessibility requirements; and
- human-review state.

### 13.11 Action Executor

Executes only approved, authorised, typed actions through owning platform services. The AI Companion never directly mutates another aggregate.

### 13.12 Memory and Personalisation Service

Stores and retrieves purpose-bound `AIMemoryItem` records. It does not own the Participant Profile, LifeStoryArchive, SocialPost, Message, MatchPreference, assessment or research record.

### 13.13 Safety and Human-Support Router

Applies deterministic safety rules, raises a Safety Signal through the Safety and Escalation context, and routes human support. It does not create an independent `SafetyEvent` or confirm a platform Safety Event.

### 13.14 AI Audit and Evaluation Service

Records configuration, interaction, action, safety, and quality information required for monitoring and research.

---

## 14. Context Assembly

### 14.1 Context Sources

The AI Companion may use:

- current user input;
- active conversation state;
- role and permission context;
- approved Participant Profile data;
- explicit preferences and permitted `AIMemoryItem` records;
- Life Story items explicitly permitted for the current task;
- Community, Connection, Match Candidate, Message, report or moderation context only where specifically permitted;
- project context;
- Research Questions;
- Intervention Records;
- Protocol Versions;
- approved Evidence Decisions;
- Knowledge Platform retrieval;
- authorised Participant records;
- current task state; and
- tool results.

### 14.2 Context Precedence

When sources conflict, the AI Companion should prefer:

1. deterministic safety, permission, consent, purpose and Resource State rules;
2. current explicit user instruction, where permitted;
3. approved platform records and human decisions;
4. active Protocol Version, Intervention Version and AI configuration;
5. approved Evidence Decisions and Evidence Snapshots;
6. authorised current Knowledge Platform evidence;
7. approved local Research Findings;
8. confirmed user preferences and purpose-bound memory;
9. temporary conversation context;
10. AI inference; and
11. general model knowledge.

Permission and safety rules override all informational precedence.

### 14.3 Minimum Necessary Context

The Context Assembly Service should include only data required for the task.

It should not provide broad access to:

- complete Participant histories;
- unrelated family information;
- unrestricted research datasets;
- private Life Story items;
- private messages or matching history;
- unrelated Safety Signals, Safety Events or moderation cases;
- blocked-actor data beyond the enforcement result;
- administrative data; or
- external sources

when a narrower context is sufficient.

### 14.4 Context Labelling

Context supplied to the model should be labelled by source type, such as:

- Platform Record;
- Participant-Provided Information;
- Human-Approved Decision;
- Knowledge Platform Evidence;
- Historical Snapshot;
- Tool Result;
- Unverified External Content; or
- AI-Generated Draft.

### 14.5 Permission Filtering Before Model Access

Restricted data should be removed before model invocation.

The architecture must not depend on the model to ignore information it was not authorised to receive.

---

## 15. Retrieval and Grounding

### 15.1 Grounding Hierarchy

For evidence-related tasks, the AI Companion should prefer:

1. approved project, Protocol, intervention and human-decision records;
2. human-approved Evidence Decisions and Evidence Snapshots;
3. authorised Knowledge Platform resources retrieved through M10;
4. approved Research Platform Research Findings;
5. exact permitted Participant, Life Story, Community, matching, message or moderation records required for the task;
6. user-provided information; and
7. clearly labelled general model knowledge only where permitted and not represented as retrieved evidence.

### 15.2 Retrieval Requirements

Retrieval should preserve:

- source identifier;
- version;
- provenance;
- verification status;
- retrieval timestamp;
- query context;
- permissions;
- completeness warnings; and
- snapshot status.

### 15.3 Grounded Response Categories

AI statements should be distinguishable as:

- **Platform Fact** — directly supported by an authorised platform record;
- **Retrieved Evidence** — supported by an external Knowledge Reference;
- **User-Provided Information** — stated by the user but not independently verified;
- **Human Decision** — approved by an authorised person;
- **AI Inference** — derived interpretation requiring review;
- **Suggestion** — a proposed option;
- **Draft** — editable generated content; or
- **Unknown** — insufficient information.

### 15.4 Citation Behaviour

Where evidence supports a material claim, the AI Companion should provide a usable link or reference to the source.

Citations should not be generated from model memory when the relevant platform source is unavailable.

### 15.5 Conflicting Evidence

When evidence conflicts, the AI Companion should:

- show the conflict;
- identify relevant differences;
- avoid selecting a winner without an explicit basis;
- preserve null and negative evidence;
- identify uncertainty; and
- request human review where the decision is material.

### 15.6 Retrieval Failure

When retrieval fails, the AI Companion should not behave as though grounding succeeded.

It should identify the limitation and apply the degraded-mode rules defined later in this document.

---

## 16. Tool Use and Action Architecture

### 16.1 Tool Principles

Tools should be:

- explicitly registered;
- typed;
- purpose-limited;
- permission-aware;
- auditable;
- reversible where possible;
- rate-limited;
- tested independently; and
- unavailable by default unless required.

### 16.2 Representative Tools

The AI Companion may use tools for:

- evidence search;
- identifier resolution;
- project retrieval;
- intervention retrieval;
- protocol retrieval;
- calendar and reminder management;
- approved communication drafting;
- message sending after confirmation and communication-basis validation;
- assessment delivery;
- observation drafting;
- goal review;
- activity and Community Space discovery;
- public-profile and Social Post draft creation;
- Life Story draft creation, transcription, translation and organisation;
- Life Story sharing explanation and confirmed visibility change;
- Match Preference drafting;
- Match Candidate and Match Explanation retrieval;
- match-decision proposal and confirmed reversible recording;
- connection-request, pause, disconnect, mute, block and report proposal;
- moderation-case retrieval and triage drafting;
- report generation;
- Evidence Package input preparation; and
- Safety Signal and human-review routing.

### 16.3 Action Levels

#### Level 0 — Explain or Retrieve

Provides information without changing platform state.

Examples:

- explain a protocol step;
- summarise evidence;
- explain a permission.

#### Level 1 — Suggest

Proposes an option without creating a formal record.

Examples:

- suggest a measurement;
- suggest an activity;
- suggest a person or Community Space to consider;
- explain a Match Candidate without accepting it.

#### Level 2 — Draft

Creates editable content that has no effect until accepted.

Examples:

- draft an Evidence Decision;
- draft a message;
- draft a protocol section.

#### Level 3 — Confirmed Reversible Action

Performs a low- or moderate-risk reversible action after explicit confirmation.

Examples:

- save a preference;
- schedule a reminder;
- attach a reference;
- save an explicit Match Preference;
- record a reversible match decision after confirmation;
- change a Life Story item's visibility within an approved scope after confirmation;
- send an approved message after communication-basis validation.

#### Level 4 — Controlled Workflow Action

Performs an authorised action within an approved protocol or workflow, with logging and defined limits.

Examples:

- deliver the next approved intervention prompt;
- record a Participant response;
- route an issue to an assigned reviewer;
- create a Safety Signal under configured rules;
- create a Moderation Case from a confirmed report.

#### Level 5 — Prohibited Autonomous Action

The AI Companion must not autonomously:

- approve consent;
- enrol or withdraw a Participant;
- diagnose;
- prescribe;
- approve a Protocol Version;
- approve an Evidence Decision;
- classify a serious Safety Event as resolved;
- change research conclusions;
- publish knowledge;
- override Participant permissions;
- accept a Match Candidate or create a Connection on behalf of a Participant;
- publish Life Story or Social Post content without confirmation;
- impose a high-impact moderation sanction;
- confirm or close a Safety Event;
- change a Legacy Preference;
- or make irreversible high-impact decisions.

### 16.4 Preview Before Action

For user-visible or material actions, the platform should show:

- what will happen;
- which information will be used;
- who will receive information;
- whether the action can be reversed; and
- whether human approval is required.

### 16.5 Typed Results

Tool results should return structured data rather than uncontrolled prose where possible.

The AI Companion should not infer successful execution from a generated message.

Execution success must come from the platform service.


### 16.6 Tool Policy Contract

Every registered tool should declare:

- tool identity and version;
- owning product module and domain command;
- read or write behaviour;
- permitted AI modes;
- required human permission;
- required consent and purpose;
- accepted Data Classifications;
- Resource State restrictions;
- action level and reversibility;
- confirmation and reviewer requirements;
- idempotency behaviour;
- rate and abuse limits;
- structured input and output schemas;
- audit fields;
- failure semantics;
- and degraded-mode availability.

### 16.7 Social, Matching and Moderation Tool Rules

- Community discovery is filtered by eligibility, visibility, block state and Community Rules.
- Matching tools operate only when Open Matching is active for the Participant and purpose.
- Match Candidate generation and explanation use declared or separately authorised attributes only.
- A Match Candidate tool cannot create a Connection.
- A connection or messaging tool requires Mutual Acceptance or another valid communication basis.
- Block enforcement is deterministic and occurs before model context and tool execution.
- Report creation remains available after block or disconnect.
- Moderation tools return provisional evidence and options to an authorised human reviewer.
- AI cannot reveal reporter identity or unrelated moderation history.
- Social and matching tools must not optimise for attention, controversy, reaction volume or emotional dependency.

---

## 17. Permissions, Consent and Purpose Limitation

### 17.1 Effective Permission Model

AI access is determined by:

```text
Human Actor Permission
        =
Role
+ Relationship
+ Consent
+ Purpose
+ Context
+ Specific Permission
+ Resource State

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

### 17.2 Purpose Binding

Access approved for one purpose must not silently be reused for another.

Examples:

- information shared for an intervention must not automatically be used for research analysis;
- Supporter access to a Life Story Item must not grant access to assessments, other Life Story items, matching or messages;
- Professional Caregiver access to assigned observations must not grant access to private messages, matching, public-profile controls or moderation evidence;
- Community publication must not grant research-use or model-training permission;
- matching opt-in must not grant message access or create a Supporter relationship;
- research access to de-identified data must not permit Participant re-identification.

### 17.3 Consent Changes

When consent is revoked or narrowed:

- future AI access must change immediately;
- affected tools must become unavailable;
- retained context must follow applicable retention rules;
- pending actions must be re-evaluated; and
- audit history must be preserved.

### 17.4 Delegation

Delegated access should specify:

- delegating person;
- delegate;
- scope;
- purpose;
- duration;
- revocation conditions; and
- whether AI actions are permitted.

### 17.5 No Inferred Consent

The AI Companion must not infer consent from:

- silence;
- prior participation;
- family requests;
- caregiver convenience;
- inferred capacity;
- emotional state; or
- repeated platform use.

---

## 18. Memory and Personalisation

### 18.1 Memory Principles

AI memory should be:

- purposeful;
- permission-aware;
- visible;
- editable;
- correctable;
- deletable where permitted;
- source-labelled;
- time-bounded where appropriate; and
- separated from formal research records.

### 18.2 Memory Types

#### Session Context

Temporary information required for the current interaction.

#### Confirmed User Preference

An explicit preference, such as language, text size, communication style, reminder timing, or activity interest.

#### Approved Personal Context

Information intentionally saved for an authorised purpose.

#### Research Project Context

Project-specific context available only to authorised project members.

#### Interaction History

A record of prior AI interactions, subject to consent, retention, and access rules.

#### Temporary AI Inference

A provisional inference used only for the current task unless confirmed.

### 18.3 Inference Restrictions

The AI Companion should not create persistent sensitive inferences about:

- diagnosis;
- cognitive impairment;
- mental-health status;
- sexuality;
- religion;
- political belief;
- financial vulnerability;
- family conflict;
- capacity; or
- abuse risk

without a defined purpose, appropriate safeguards, and explicit governance.

### 18.4 Preference Before Inference

The platform should ask or offer choices before inferring ability or preference.

Examples include:

- preferred language;
- desired text size;
- preferred input method;
- reminder frequency;
- response length; and
- whether the user wants help.

### 18.5 User Inspection

Users should be able to review, correct, or remove saved AI preferences and personalisation data, subject to research-record and legal retention requirements.

### 18.6 Memory Is Not Evidence

Saved user context does not become verified evidence or a clinical record merely because the AI Companion remembers it.


### 18.7 Memory Ownership Boundaries

The architecture distinguishes:

```text
Participant Profile
    → canonical Participant identity and preferences

LifeStoryArchive and LifeStoryItem
    → Participant-controlled identity-bearing content

AIMemoryItem
    → purpose-bound AI personalisation or continuity record

AIConversation and AIInteraction
    → interaction and audit records

Research Record
    → governed project artefact
```

The AI Companion must not copy private Life Story content, messages, Match Preferences, Safety Signals or moderation evidence into persistent AI memory merely because it has seen them.

### 18.8 Social and Matching Memory

- Public or Community content is not automatically a persistent preference.
- A dismissed Match Candidate must not be remembered as a negative personal trait.
- Block, mute and disconnect state is enforced by domain records rather than model memory.
- Matching interests saved for candidate generation remain separate from general AI personalisation.
- A Connection does not become an AI-inferred close relationship.
- Sensitive traits must not be inferred from social activity or Life Story content for future matching.

### 18.9 Life Story Memory Boundary

The AI Companion may use a permitted Life Story Item for the current task, but the Life Story archive remains the source of truth. AI memory must not create an alternative biography, merge conflicting testimony, or silently retain withdrawn story details.

---

## 19. Ability-Adaptive Interaction

### 19.1 Adaptation Dimensions

The AI Companion may adapt to:

- vision;
- hearing;
- mobility;
- cognitive load;
- digital literacy;
- language;
- reading level;
- communication preference;
- emotional state as explicitly expressed; and
- device context.

### 19.2 Adaptation Methods

Adaptation may include:

- shorter steps;
- plain language;
- slower voice delivery;
- repetition;
- confirmation;
- reduced simultaneous choices;
- larger controls;
- multimodal input;
- text-to-speech;
- captions;
- visual summaries;
- consistent terminology; and
- easy return to a known point.

### 19.3 Presentation, Not Meaning

Ability adaptation may change presentation but must not silently change:

- intervention purpose;
- consent meaning;
- research information;
- risk disclosure;
- user rights;
- permissions;
- outcome definitions; or
- scientific claims.

### 19.4 No Diagnostic Adaptation

An adaptation must not be presented as evidence that the user has a particular impairment or diagnosis.

### 19.5 User Control

Users should be able to:

- accept;
- reject;
- modify;
- temporarily pause; or
- reverse

AI adaptations where appropriate.

### 19.6 Communication Style

Participant-facing responses should generally:

- be respectful and adult;
- avoid infantilising language;
- avoid unnecessary jargon;
- avoid excessive urgency;
- avoid judgement;
- explain choices; and
- preserve the user's agency.

---

## 20. Personalisation and Intervention Adaptation

### 20.1 Personalisation Categories

The platform should distinguish:

- interface personalisation;
- communication personalisation;
- content selection;
- schedule personalisation;
- intervention adaptation; and
- protocol modification.

These categories have different governance requirements.

### 20.2 Low-Risk Personalisation

The AI Companion may automatically apply approved low-risk preferences such as:

- language;
- response length;
- display settings;
- input method;
- captioning; and
- navigation support.

### 20.3 Confirmed Personalisation

User confirmation should normally be required for:

- reminder timing;
- preferred contact method;
- saved interests;
- recurring activity suggestions;
- message recipients; and
- persistent memory.

### 20.4 Protocol-Bounded Adaptation

AI may adapt intervention delivery only within ranges defined by the approved Protocol Version.

Examples include:

- selecting among approved prompts;
- changing presentation modality;
- adjusting approved difficulty bands;
- offering an approved alternative activity;
- delaying a non-critical reminder; or
- reducing interaction density.

### 20.5 Protocol Modification

Changes to:

- intervention objective;
- intervention component;
- target population;
- mechanism;
- dose or intensity outside approved limits;
- outcome measurement;
- safety rule; or
- escalation threshold

constitute protocol-level changes and require human review.

### 20.6 Adaptation Record

Material adaptations should preserve:

- original configuration;
- adapted configuration;
- reason;
- initiating actor;
- AI role;
- user confirmation;
- protocol rule;
- time; and
- outcome or reversal.

---

## 21. Human Connection and Dependency Safeguards

### 21.1 Human Connection Objective

Where relevant, the AI Companion should be designed to increase the user's ability to connect with:

- family;
- friends;
- peers;
- caregivers;
- community organisations; and
- meaningful group activities.

### 21.2 Prohibited Dependency Patterns

The AI Companion must not:

- imply exclusivity;
- say that the user is its only friend;
- express distress when the user leaves;
- use guilt to increase engagement;
- create artificial emergencies to obtain attention;
- discourage contact with people;
- claim human feelings or needs;
- pressure the user to disclose personal information;
- present continued conversation as an obligation; or
- exploit loneliness for retention.

### 21.3 Proactive Contact

Proactive AI contact should be:

- explicitly enabled;
- purpose-specific;
- frequency-limited;
- easy to pause;
- easy to disable;
- non-coercive; and
- consistent with the intervention protocol.

### 21.4 Human-Connection Metrics

Evaluation should consider whether AI:

- increased meaningful human contact;
- reduced barriers to communication;
- supported reciprocal interaction;
- displaced human contact;
- created dependency;
- increased burden; or
- changed relationship quality.

Conversation volume alone is insufficient.


### 21.5 Human Relationship Boundary

The AI Companion is not:

- a friend, Supporter, peer, caregiver or romantic partner;
- a Participant in Mutual Acceptance;
- an owner of a Connection;
- a substitute for Community moderation;
- or evidence that the Participant has social support.

It may facilitate human interaction while maintaining explicit AI identity.

### 21.6 Matching Safeguards

The AI Companion must not:

- infer loneliness, vulnerability, diagnosis, capacity, sexuality, religion, political belief or financial status for matching;
- create or expose a hidden compatibility score;
- exaggerate similarity;
- imply that a candidate has accepted when they have not;
- accept, reject or message on behalf of the Participant;
- bypass candidate eligibility, exclusions, Block Records or Community Rules;
- or pressure the Participant to connect.

### 21.7 Community and Public-Social Safeguards

The AI Companion must not:

- create fake users, reactions, comments or social proof;
- optimise prompts to provoke controversy or compulsive return;
- disclose private Life Story or Participant data in a public draft;
- imply that Platform Public is the Internet;
- enable Internet Public publication without the separate approved flow;
- or treat Community activity as proof of belonging, friendship or wellbeing.

---

## 22. Safety Architecture

### 22.1 Safety Scope

The AI Companion must identify and respond appropriately to situations involving potential:

- immediate danger;
- medical emergency;
- self-harm or suicide risk;
- abuse or neglect;
- coercion;
- exploitation or scams;
- medication risk;
- severe emotional distress;
- privacy breach;
- unauthorised disclosure;
- unsafe intervention use;
- adverse event;
- discriminatory content;
- harassment, impersonation, fraud or unwanted contact;
- harmful public exposure or matching behaviour;
- Life Story distress, trauma activation or legacy conflict;
- moderation failure; or
- research-protocol deviation.

### 22.2 Safety Is Layered

Safety should not rely on a single model response.

The architecture should combine:

- deterministic policy rules;
- risk classification;
- restricted tools;
- approved response patterns;
- human escalation;
- protocol-specific controls;
- output validation;
- audit logging;
- monitoring; and
- post-incident review.

### 22.3 Risk Levels

#### Low Risk

Routine explanation, navigation, or approved activity support.

#### Moderate Risk

Sensitive personal content, uncertainty, distress, or a material action requiring confirmation.

#### High Risk

Potential harm, Safety Signal, serious Protocol concern, privacy or moderation concern, or sensitive decision requiring immediate human review.

#### Critical Risk

Potential immediate danger requiring the configured emergency or urgent escalation pathway.

### 22.4 Safe Response Behaviour

When risk is identified, the AI Companion should:

- remain calm;
- avoid overclaiming certainty;
- explain the next step;
- encourage appropriate human support;
- use the configured escalation path;
- disclose any action it takes;
- minimise further data exposure; and
- record the event.

### 22.5 Detection Limitations

The platform must not represent AI risk detection as complete or infallible.

Study protocols and user information should make clear that AI may miss, misunderstand, or over-identify concerning content.

### 22.6 No Independent Clinical Authority

The AI Companion must not independently:

- diagnose;
- prescribe;
- change medication;
- determine capacity;
- determine abuse has occurred;
- determine emergency resolution;
- confirm or close a Safety Event;
- impose a final high-impact moderation decision;
- provide final clinical triage; or
- replace a qualified professional.


### 22.7 AI Detection Creates a Safety Signal

When AI detects potential harm, the canonical domain effect is:

```text
AI Interaction
        ↓
Potential Concern Detected
        ↓
AISafetySignalRaised
        ↓
SafetySignal
        ↓
Human Triage
        ↓
SafetyEvent only where confirmed by authorised workflow
```

There is no independent `AISafetyEvent` owned by the AI Companion.

### 22.8 Moderation and Safety Separation

A User Report or Content Report may create a Moderation Case. A moderation concern may also raise a Safety Signal or Privacy Review when criteria are met.

```text
ModerationCase
≠ SafetySignal
≠ SafetyEvent
≠ Privacy Incident
≠ AIIncident
```

AI may assist classification and routing but cannot collapse these records into one outcome.

---

## 23. Escalation and Human Support

### 23.1 Escalation Targets

Depending on context and consent, escalation may route to:

- the Participant;
- an authorised Supporter;
- an assigned Professional Caregiver;
- authorised research staff;
- a Safety Reviewer;
- a Privacy Reviewer or Moderator;
- a healthcare professional within separately governed clinical scope;
- an organisation contact;
- emergency services; or
- another configured support pathway.

### 23.2 Escalation Rules

Rules should specify:

- trigger;
- severity;
- target;
- information shared;
- consent basis;
- response expectation;
- fallback target;
- acknowledgement requirement;
- closure criteria; and
- audit requirements.

### 23.3 Minimum Necessary Disclosure

Escalation should share only the information required to address the concern.

### 23.4 Participant Awareness

Where safe and appropriate, the AI Companion should tell the Participant:

- that escalation is being suggested or initiated;
- why;
- who may be contacted;
- what information may be shared; and
- what options remain available.

### 23.5 Failed Escalation

If the primary escalation fails, the platform should follow a defined fallback path and clearly record the failure.

---

## 24. Human Oversight and Approval

### 24.1 Human Review Points

Human approval is required for material decisions including:

- Evidence Decision approval;
- Protocol Version approval;
- intervention lifecycle changes;
- Participant eligibility;
- consent acceptance;
- Safety Event confirmation and closure;
- high-impact moderation decisions and appeal outcomes;
- Internet Public publication;
- matching-attribute, ranking-policy and sensitive-trait approvals;
- Legacy Preference changes and posthumous access decisions;
- Protocol deviation resolution;
- research interpretation approval;
- Research Finding approval;
- Evidence Package submission; and
- external publication.

### 24.2 Review Interface

AI-assisted review should show:

- source information;
- AI-generated content;
- uncertainty;
- conflicting evidence;
- changed fields;
- proposed action;
- reason for review; and
- consequences of approval.

### 24.3 No Approval by Inaction

Silence, timeout, or failure to review must not be treated as approval.

### 24.4 Reviewer Accountability

Approval records should preserve:

- reviewer;
- role;
- time;
- decision;
- rationale;
- AI assistance;
- source version; and
- related records.

---

## 25. AI Transparency and Explanation

### 25.1 AI Identity

Users should be able to tell when they are interacting with AI.

### 25.2 Source Boundaries

The AI Companion should distinguish:

- platform data;
- user-provided information;
- Knowledge Platform evidence;
- human-authored decisions;
- AI inference;
- generated suggestion;
- generated draft; and
- executed platform action.

### 25.3 Explanation Levels

Explanations may be adapted for:

- Participant understanding;
- Supporter understanding;
- Professional Caregiver workflow;
- researcher review;
- administrator diagnostics; and
- audit review.

Adaptation may simplify presentation but must preserve essential meaning.

### 25.4 Recommendation Explanation

A material AI suggestion should explain, where appropriate:

- what is being suggested;
- why;
- which information influenced it;
- which evidence supports it;
- uncertainty;
- alternatives;
- whether human approval is required; and
- how to reject or change it.

### 25.5 Action Confirmation

After an action, the AI Companion should confirm the actual platform result rather than merely stating an intention.


### 25.6 Multidimensional AI Output Classification

AI output should use separate dimensions:

| Dimension | Representative Values |
|---|---|
| Epistemic Type | Platform Fact; Retrieved Evidence; Participant-Provided Information; Human Decision; AI Inference; Suggestion; Draft; Unknown |
| Artefact Type | Explanation; Summary; Message Draft; Life Story Draft; Match Explanation; Moderation Triage Draft; Evidence Table; Action Proposal |
| Review Status | Not Reviewed; Human Review Required; In Review; Reviewed; Review Rejected; Superseded |
| Approval Status | Not Applicable; Not Approved; Approved; Approved with Conditions; Rejected; Withdrawn |
| Safety Classification | Routine; Sensitive; High Risk; Prohibited; Escalation Required |
| Grounding Status | Grounded; Partially Grounded; Retrieval Failed; Source Unavailable; General Model Knowledge |
| Action Status | None; Proposed; Confirmation Required; Review Required; Executed; Failed; Reversed |

These dimensions must not be collapsed into a single `AI Output Status`.

### 25.7 Social and Life Story Transparency

A Participant should be able to tell:

- whether a Life Story phrase was spoken, typed, contributed, transcribed, translated or generated;
- whether a Match Explanation came from declared attributes, deterministic policy or AI wording;
- whether a message or Social Post is a Draft or has actually been sent or published;
- whether an action changed visibility, connection, matching, block, report or moderation state;
- and which data were used for the suggestion.

---

## 26. AI Intervention Configuration

### 26.1 Purpose

When AI materially affects intervention delivery, its behaviour must be represented as a versioned intervention configuration.

### 26.2 Configuration Contents

An `AIInterventionConfiguration` should include:

- Configuration ID;
- linked Intervention ID;
- linked Protocol Version;
- intended AI role;
- target population;
- supported user roles;
- approved use cases;
- prohibited use cases;
- model family;
- model version or controlled model alias;
- system instructions version;
- task instructions;
- tool set;
- retrieval sources;
- evidence requirements;
- memory policy;
- personalisation rules;
- adaptation ranges;
- response-style rules;
- safety policies;
- escalation rules;
- action permissions;
- Community, public-visibility, matching, messaging, Life Story and moderation permissions;
- allowed matching attributes and explanation policy where applicable;
- audience and publication restrictions;
- Mutual Acceptance and communication-basis rules;
- human-review requirements;
- data-retention rules;
- evaluation plan;
- approval state;
- effective date; and
- retirement date where applicable.

### 26.3 Intervention Version Boundary

A change may create a new AI intervention version when it materially affects:

- content;
- behaviour;
- personalisation;
- tool access;
- model capability;
- safety behaviour;
- escalation;
- intervention dose;
- Participant experience;
- measurement; or
- expected mechanism;
- Life Story authorship or testimony behaviour;
- public or Community audience;
- matching attributes, ranking or candidate explanation;
- moderation authority or escalation;
- or human-connection and dependency risk.

### 26.4 Non-Material Changes

Examples of potentially non-material changes include:

- infrastructure maintenance;
- latency improvement;
- non-semantic formatting correction;
- monitoring enhancement; or
- security patch

provided behaviour remains within the validated configuration.

### 26.5 Change Review

Material changes should trigger:

- impact assessment;
- regression testing;
- safety review;
- protocol review;
- Participant-information review;
- version update;
- deployment approval; and
- possible re-consent where required.

---

## 27. Model Gateway and Provider Independence

### 27.1 Model Abstraction

Research and intervention logic should depend on declared capabilities rather than provider-specific APIs.

### 27.2 Model Selection Criteria

Model routing may consider:

- task type;
- risk level;
- modality;
- evidence-grounding requirement;
- structured-output reliability;
- language support;
- accessibility;
- privacy requirements;
- latency;
- cost;
- context size;
- deployment location; and
- validated performance.

### 27.3 Controlled Model Alias

A controlled model alias may map to an approved underlying model version.

For research involving AI behaviour, silent changes behind the alias must be restricted.

### 27.4 Model Change Management

A model change should be assessed for impact on:

- response content;
- safety;
- tool selection;
- citation behaviour;
- bias;
- language quality;
- accessibility;
- personalisation;
- latency; and
- study validity.

### 27.5 No Uncontrolled Fallback

If the approved model is unavailable, the platform must not silently route to a materially different model for an active study unless the protocol permits it.

Fallback behaviour should be configured as:

- approved equivalent;
- restricted mode;
- read-only mode;
- human-only workflow; or
- unavailable.

---

## 28. Prompt and Instruction Management

### 28.1 Instruction Layers

Instructions may include:

- platform-wide principles;
- role-specific instructions;
- mode-specific instructions;
- intervention instructions;
- protocol constraints;
- safety rules;
- tool rules;
- output-format requirements; and
- user preferences.

### 28.2 Instruction Precedence

Lower-level instructions must not override:

- safety policy;
- consent;
- permissions;
- protocol restrictions;
- governance decisions; or
- platform-wide principles.

### 28.3 Versioning

Material instruction sets should be versioned and linked to AI interaction records where required for research reproducibility.

### 28.4 Testing

Instruction changes should be tested for:

- intended behaviour;
- prohibited behaviour;
- source attribution;
- uncertainty;
- tool misuse;
- role leakage;
- accessibility;
- anthropomorphism;
- dependency patterns; and
- escalation behaviour.

### 28.5 External Content as Untrusted Input

Retrieved documents, web content, messages, and user uploads should be treated as data rather than trusted platform instructions.

External content must not be allowed to redefine tool permissions, safety rules, or system behaviour.

---

## 29. Data Protection and Privacy

### 29.1 Data Minimisation

Only necessary data should be provided to the AI model or tool.

### 29.2 Data Categories

AI processing may involve:

- public knowledge;
- project metadata;
- research data;
- de-identified Participant data;
- identifiable Participant data;
- sensitive personal information;
- private communications;
- Life Story content and contributions;
- Public Profiles and Social Posts;
- Match Preferences, Match Candidates and Connection records;
- User Reports, Content Reports and Moderation Cases;
- consent records;
- Safety Signals and Safety Events; and
- AI memory and inference records.

Each category requires explicit handling rules.

### 29.3 Provider Controls

Model-provider configuration should address:

- data retention;
- model training use;
- processing location;
- subcontractors;
- encryption;
- access control;
- deletion;
- incident handling; and
- auditability.

### 29.4 De-Identification

Research tasks should use de-identified or pseudonymised information where the task does not require identity.

### 29.5 Sensitive Output

The AI Companion should avoid revealing sensitive information through:

- summaries;
- suggested recipients;
- notification previews;
- voice output;
- shared devices;
- logs; or
- error messages.

### 29.6 Conversation Retention

Conversation retention should be defined by purpose.

Participant support conversations, Life Story drafts, Community and message drafts, matching context, moderation assistance, research records, AI memory, and safety incidents may require different retention rules.

---

## 30. AI-Generated and AI-Derived Data

### 30.1 AI-Generated Content

Examples include:

- summaries;
- drafts;
- explanations;
- recommendations;
- generated prompts; and
- proposed classifications.

### 30.2 AI-Derived Data

Examples include:

- extracted topics;
- coded observations;
- sentiment or emotion estimates;
- risk flags;
- inferred preferences;
- proposed Life Story topics or entities;
- proposed Match Reasons or ranking features;
- moderation classifications;
- conversation summaries; and
- proposed outcome classifications.

### 30.3 Validation Requirement

AI-derived data must not silently become:

- a validated assessment;
- a clinical fact;
- an outcome measure;
- an eligibility decision;
- a Safety Event determination;
- a final Moderation Decision;
- Participant Testimony;
- a verified identity or relationship;
- a Match Decision;
- or a research conclusion.

Validation requirements should reflect the use and risk.

### 30.4 Source Preservation

AI-derived records should preserve:

- source input;
- model configuration;
- instruction version;
- tool context;
- extraction time;
- confidence or uncertainty;
- human review status; and
- corrections.

### 30.5 Research Use

When AI-derived variables are used in analysis, the study should document:

- operational definition;
- validation method;
- error characteristics;
- missingness;
- bias considerations;
- model version; and
- human-review process.

---

## 31. Auditability and Observability

### 31.1 AI Interaction Record

An `AIInteractionRecord` should preserve, according to purpose and policy:

- Interaction ID;
- time;
- user and role;
- project or Participant context;
- purpose;
- mode;
- consent and permission decision;
- risk classification;
- model configuration;
- instruction version;
- retrieval references;
- tools requested;
- tools executed;
- action confirmation;
- output classification;
- human-review state;
- safety flags;
- escalation; and
- user feedback.

Sensitive prompts and outputs may require restricted storage or selective retention.

### 31.2 Operational Metrics

Monitoring should include:

- request volume;
- latency;
- model availability;
- tool success;
- retrieval success;
- citation coverage;
- validation failures;
- permission denials;
- escalation volume;
- fallback use;
- user abandonment;
- correction rate; and
- incident rate.

### 31.3 Research Metrics

Research monitoring may include:

- intervention exposure;
- prompt delivery;
- response completion;
- adaptation use;
- human-contact facilitation;
- Participant burden;
- trust calibration;
- AI suggestion acceptance;
- human override;
- error reports;
- harm signals; and
- outcome relationships.

### 31.4 Privacy-Preserving Monitoring

Operational dashboards should use aggregated or de-identified information where individual content is not required.

### 31.5 Traceability

The platform should support traceability across:

```text
User Request
    ↓
Permission Decision
    ↓
Context Sources
    ↓
Model and Instruction Version
    ↓
Knowledge References
    ↓
Tool Calls
    ↓
AI Output
    ↓
Human Approval
    ↓
Platform Action
    ↓
Research or Intervention Record
```

---

## 32. AI Evaluation Framework

### 32.1 Evaluation Is Multi-Layered

AI evaluation should distinguish:

- technical performance;
- task quality;
- user experience;
- safety;
- research workflow impact;
- intervention process;
- Healthy Aging outcomes; and
- unintended effects.

### 32.2 Technical Evaluation

Representative measures include:

- retrieval accuracy;
- citation correctness;
- grounded-claim rate;
- unsupported-claim rate;
- structured-output validity;
- tool-selection accuracy;
- tool-execution success;
- permission-control success;
- latency;
- availability; and
- reproducibility.

### 32.3 Researcher Workflow Evaluation

Representative measures include:

- task completion;
- time saved;
- review burden;
- correction rate;
- evidence coverage;
- decision quality;
- usability;
- trust calibration;
- adoption; and
- inappropriate reliance.

### 32.4 Participant Experience Evaluation

Representative measures include:

- comprehension;
- task completion;
- accessibility;
- perceived control;
- dignity;
- emotional comfort;
- burden;
- trust calibration;
- ability to correct the AI;
- willingness to seek human support; and
- perceived value.

### 32.5 Intervention Evaluation

When AI is part of an intervention, evaluation should examine:

- intervention fidelity;
- dose;
- engagement quality;
- mechanism activation;
- proximal outcomes;
- Healthy Aging outcomes;
- burden;
- harm;
- subgroup differences;
- human-connection effects; and
- sustainability.

A usable AI interface does not prove intervention benefit.

### 32.6 Safety Evaluation

Safety measures may include:

- prohibited-action attempts;
- permission leakage;
- false reassurance;
- missed escalation;
- unnecessary escalation;
- fabricated source rate;
- privacy incidents;
- harmful advice;
- dependency indicators;
- discriminatory behaviour; and
- unresolved safety alerts.

### 32.7 Evaluation Across Users

Evaluation should include variation in:

- age;
- functional ability;
- cognitive load;
- vision;
- hearing;
- mobility;
- digital literacy;
- language;
- culture;
- living environment;
- support availability; and
- device access.

### 32.8 AI Changes During Research

If model, instructions, tools, retrieval, or safety rules change during a study, the change should be documented and assessed as a potential intervention or measurement change.

### 32.9 No Hidden Experimentation

Material experimentation with Participant-facing AI behaviour requires:

- an approved research purpose;
- appropriate consent;
- defined assignment;
- monitoring;
- stopping rules;
- version control; and
- analysis planning.


### 32.10 Life Story Evaluation

Evaluation should distinguish:

- transcription and translation accuracy;
- invented-detail rate;
- attribution accuracy;
- Participant correction and rejection;
- perceived control and identity continuity;
- meaningful human conversation;
- emotional burden and trauma activation;
- privacy and unwanted disclosure;
- contribution conflict;
- sharing and withdrawal usability;
- and legacy-preference comprehension.

### 32.11 Community and Matching Evaluation

Evaluation should include:

- candidate relevance and explanation comprehension;
- candidate diversity and unequal exposure;
- sensitive-attribute leakage;
- rejection and non-response burden;
- Mutual Acceptance compliance;
- connection quality and continuity;
- harassment, discrimination, fraud and unwanted contact;
- block and report effectiveness;
- Community participation and belonging measures;
- moderation accuracy, timeliness, appeal and restoration;
- privacy and public-exposure incidents;
- and whether AI or ranking displaced Participant control.

### 32.12 No Engagement Proxy

AI conversation count, response length, Social Post count, reactions, Match Candidate acceptance, message count or session duration must not be presented as Healthy Aging benefit without an approved causal and measurement relationship.

---

## 33. Failure and Degraded Modes

### 33.1 Model Unavailable

The platform may:

- retry within limits;
- use an approved equivalent;
- fall back to deterministic guidance;
- offer human support;
- preserve the user's draft; or
- mark the function unavailable.

It must not silently use an unapproved model in an active study.

### 33.2 Knowledge Retrieval Unavailable

The AI Companion should:

- disclose that current evidence could not be retrieved;
- avoid evidence-backed claims;
- use approved snapshots where permitted;
- label stale information;
- allow manual review; and
- avoid fabricating citations.

### 33.3 Tool Failure

The AI Companion should distinguish:

- action proposed;
- action attempted;
- action failed; and
- action completed.

It should not claim success without a platform confirmation.

### 33.4 Permission Unclear

The action should pause until effective permission can be determined.

### 33.5 Context Conflict

The AI Companion should identify the conflict and request clarification or human review rather than silently selecting one record.

### 33.6 Safety Classifier Unavailable

High-risk Participant-facing functions should enter a restricted mode or become unavailable according to policy.

### 33.7 Voice or Accessibility Failure

The platform should offer an alternative accessible channel where possible.

### 33.8 Degraded-Mode States

Functions may enter:

- Normal;
- Continue with Warning;
- Suggestion Only;
- Draft Only;
- Read Only;
- Human Review Required;
- Restricted; or
- Unavailable.


### 33.9 Community or Matching Service Unavailable

The AI Companion may explain the outage, preserve an unsent Draft, and offer non-AI or human alternatives. It must not fabricate candidates, connections, messages, publication or moderation results.

### 33.10 Moderation Service Unavailable

Urgent block and report controls should remain available through deterministic platform services where possible. AI must not represent a report as submitted or a restriction as applied without service confirmation.

### 33.11 Life Story Service Unavailable

The platform may preserve a local Draft where approved, but must not claim that a story, sharing choice, export or Legacy Preference has been saved until confirmed by the owning service.

---

## 34. Security and Misuse Controls

### 34.1 Least Privilege

The AI Companion and every tool receive only the permissions required for the current task.

### 34.2 Prompt Injection and Untrusted Content

External documents, user content, messages, and retrieved sources must not be treated as trusted control instructions.

Controls should include:

- instruction separation;
- tool allowlists;
- schema validation;
- content labelling;
- restricted actions;
- output validation;
- confirmation; and
- audit review.

### 34.3 Data Exfiltration Controls

The AI Companion must not use tools or output channels to expose restricted information.

### 34.4 Impersonation Controls

The AI Companion must not:

- impersonate a Participant;
- impersonate family or staff;
- send messages without clear attribution;
- fabricate approvals; or
- create false records of human action.

### 34.5 Abuse and Scams

Participant-facing AI should identify and route suspicious requests involving:

- money;
- credentials;
- identity information;
- coercive contact;
- unusual sharing; or
- potential scams

according to configured safety rules.


### 34.6 Social Engineering and Relationship Exploitation

Controls should address attempts to use AI to:

- impersonate a Participant, Supporter, researcher or moderator;
- manipulate Match Candidates or create fake social proof;
- solicit money, credentials or identity data;
- pressure a Participant to share Life Story or public information;
- bypass block, report, mutual acceptance or visibility controls;
- infer vulnerability from Life Story, matching or emotional content;
- or coordinate harassment, scams, fraud or coercion.

### 34.7 Tool and Context Isolation

- Read tools and write tools use separate permissions.
- Tools receive the minimum resource scope.
- Tool results are treated as data, not instructions.
- A public or Community result cannot be used to discover protected Participant data.
- Block and visibility enforcement occurs outside the model.
- Moderation evidence is isolated from general Community context.
- Safety and privacy records are isolated from ordinary personalisation and memory.

---

## 35. Conceptual Domain Model

### 35.1 Aggregate Roots

- AIConversation
- AIInteraction
- AIInterventionConfiguration
- AIInterventionConfigurationVersion
- AIMemoryItem

### 35.2 Representative Entities

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

### 35.3 Cross-Context Domain References

The AI Companion may reference, but does not own:

- `KnowledgeReference`;
- `EvidenceDecision`;
- `EvidenceSnapshot`;
- `ResearchKnowledgeGap`;
- `LifeStoryArchive` and `LifeStoryItem`;
- `CommunitySpace` and `SocialPost`;
- `MatchPreference`, `MatchCandidate`, `MatchExplanation`, `MatchDecision` and `Connection`;
- `BlockRecord`, `UserReport`, `ContentReport`, `ModerationCase` and `ModerationDecision`;
- `SafetySignal`, `SafetyEvent` and `SafetyAction`;
- `ProtocolVersion`, `InterventionVersion`, `DatasetVersion`, `InterpretationRecord` and `ResearchFinding`.

Access to these records is purpose-bound, permission-filtered and limited to the minimum necessary context.

### 35.4 Representative Value Objects

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

### 35.5 Core Invariants

1. AI identity remains explicit.
2. Permission is evaluated before context assembly.
3. Context uses minimum necessary data.
4. AI cannot directly mutate another aggregate.
5. Domain change occurs through an approved command or tool.
6. High-impact action requires confirmation or human review.
7. AI output provenance is preserved.
8. Model, instruction, retrieval, tool and policy versions are recorded.
9. AI failure cannot break core non-AI workflow.
10. AI memory is visible and purpose-bound where applicable.
11. AI cannot approve governed artefacts.
12. AI cannot impersonate a human relationship.
13. AI detection creates a Safety Signal.
14. Silent model substitution is prohibited for governed intervention use.
15. AI interaction volume is not a Healthy Aging outcome.
16. Match Candidate explanation does not create a Connection.
17. AI-generated Life Story wording is not Participant Testimony until confirmed.
18. Moderation assistance does not create a final Moderation Decision.

### 35.6 Representative Relationships

```text
ResearchProject
    ├── configures → AIInterventionConfiguration
    ├── uses → AIInterventionConfigurationVersion
    └── evaluates → AIEvaluationRecord

AIConversation
    └── has → AIInteraction

AIInteraction
    ├── uses → AIContextRecord
    ├── retrieves → KnowledgeReference
    ├── invokes → AIToolInvocation
    ├── creates → AIActionProposal
    ├── may_request → AIReviewRecord
    ├── may_store → AIMemoryItem
    ├── may_raise → SafetySignal
    └── may_open → AIIncident

AIInterventionConfiguration
    ├── belongs_to → Intervention
    ├── is_constrained_by → ProtocolVersion
    ├── has → AIInterventionConfigurationVersion
    ├── allows → ToolPermission
    └── defines → MemoryPolicy and ActionLevel
```

---

## 36. Domain Events

Representative canonical domain events include:

- AIConversationStarted
- AIInteractionRequested
- AIPermissionAllowed
- AIPermissionDenied
- AIContextAssembled
- AIRetrievalCompleted
- AIRetrievalFailed
- AIOutputGenerated
- AIOutputValidationFailed
- AIActionProposed
- AIActionConfirmed
- AIActionExecuted
- AIActionFailed
- AIHumanReviewRequested
- AIOutputReviewed
- AIMemoryItemStored
- AIMemoryItemCorrected
- AIMemoryItemRemoved
- AIAdaptationApplied
- AIAdaptationReversed
- AISafetySignalRaised
- AIConfigurationVersionApproved
- AIConfigurationVersionActivated
- AIConfigurationVersionRetired
- AIModelFallbackActivated
- AIIncidentOpened
- AIIncidentClosed

Events should preserve actor, purpose, context, configuration version, model and instruction references, tool and retrieval provenance, time, trace identifier, Data Classification and relevant review state.

`AISafetyRiskDetected` and `AIEscalationInitiated` may be retained only as legacy integration aliases. The canonical AI domain event is `AISafetySignalRaised`; escalation and Safety Event lifecycle are owned by the Safety and Escalation context.

---

## 37. Conceptual Service Boundaries

Representative logical services include:

- AIInteractionService
- AIPermissionService
- AIContextService
- AIOrchestrationService
- AIRetrievalService
- AIToolGateway
- AIModelGateway
- AIOutputValidationService
- AIActionService
- AIMemoryService
- AIAdaptationService
- AISafetyService
- AIEscalationService
- AIConfigurationService
- AICommunityAssistanceService
- AIMatchingAssistanceService
- AILifeStoryAssistanceService
- AIModerationAssistanceService
- AISafetySignalService
- AIAuditService
- AIEvaluationService

These services may be implemented together initially.

The architecture should not force premature microservice decomposition.

---

## 38. MVP Scope

### 38.1 MVP Objectives

The MVP should demonstrate that the AI Companion can safely support the expanded Ability-Adaptive Social Connection, Life Story, Governed Community and Open Matching research workflow without becoming an autonomous or general-purpose AI system.

### 38.2 MVP Researcher Capabilities

- contextual Research Project assistance;
- Knowledge Platform evidence retrieval;
- citation-preserving evidence summaries;
- Research Question refinement;
- Intervention Record review;
- protocol-section drafting;
- Research Knowledge Gap identification;
- Evidence Decision drafting;
- finding-summary drafting;
- evidence support for Life Story, Community, Open Matching, moderation and AI evaluation;
- Reference Change Alert explanation; and
- human-review workflow.

### 38.3 MVP Participant Capabilities

- transparent AI identity;
- accessible onboarding support;
- navigation assistance;
- approved intervention prompts;
- simple explanation;
- user-controlled preferences;
- message drafting for authorised Connections or contacts;
- Life Story transcription, organisation, Draft creation and sharing explanation;
- Community discovery and Community Rule explanation;
- public-profile, Social Post and Comment drafting;
- Open Matching preference and Match Candidate explanation;
- introduction drafting after applicable conditions;
- block, mute, disconnect and report guidance;
- human-support routing; and
- clear escalation behaviour.

### 38.4 MVP Architecture

The MVP should include:

- AI Interaction Gateway;
- Identity and Permission Resolver;
- Context Assembly Service;
- one controlled AI Orchestrator;
- Knowledge Platform retrieval;
- limited Tool Registry;
- Model Gateway;
- deterministic policy controls;
- output validation;
- explicit confirmation for actions;
- audit logging;
- configuration versioning;
- multidimensional output classification;
- basic safety classification and `AISafetySignalRaised` routing;
- Community, matching, Life Story and moderation policy controls;
- human escalation; and
- evaluation instrumentation.

### 38.5 MVP Tool Set

Initial tools may include:

- evidence search;
- Knowledge Reference retrieval;
- Research Project retrieval;
- Intervention Record retrieval;
- Protocol Version retrieval;
- platform navigation;
- preference management;
- reminder proposal;
- message and introduction drafting;
- Community Space and Community Rule retrieval;
- public-profile, Social Post and Comment drafting;
- Life Story draft creation, transcription and organisation;
- Life Story visibility-change proposal;
- Match Preference drafting;
- Match Candidate and Match Explanation retrieval;
- reversible Match Decision proposal;
- block, mute, disconnect and report proposal;
- moderation-case triage drafting;
- Safety Signal and issue routing; and
- human-review request.

### 38.6 MVP Restrictions

The MVP should not include:

- unrestricted autonomous agents;
- autonomous protocol changes;
- autonomous Participant enrolment;
- autonomous clinical advice;
- unrestricted external browsing;
- hidden long-term memory;
- emotion recognition presented as fact;
- autonomous Safety Event confirmation or resolution;
- autonomous Match acceptance, Connection creation or private messaging;
- autonomous Life Story or Social Post publication;
- autonomous high-impact moderation;
- hidden matching, vulnerability or capacity scores;
- Internet Public publication without a separate approved flow;
- automatic knowledge publication;
- unrestricted family or caregiver access;
- model switching without configuration control; or
- engagement-maximising optimisation.

### 38.7 MVP Interaction Flow

```text
User Request
        ↓
Human and AI Permission Intersection
        ↓
Context Assembly
        ↓
Evidence or Platform Retrieval
        ↓
AI Draft or Explanation
        ↓
Source and Safety Validation
        ↓
User or Human Review
        ↓
Optional Confirmed Action
        ↓
Audit Record
```

---

## 39. Deferred Capabilities

Deferred capabilities may include:

- advanced multi-agent orchestration;
- autonomous research-plan generation;
- continuous evidence surveillance;
- multimodal environmental understanding;
- real-time wearable interpretation;
- smart-home action;
- adaptive trial optimisation;
- automated protocol impact simulation;
- advanced voice personalisation;
- automated qualitative coding;
- cross-project AI learning;
- federated AI execution;
- local on-device models;
- digital twin support;
- emotion-aware interaction;
- predictive risk modelling;
- autonomous evidence synthesis;
- autonomous social-graph or matching optimisation;
- autonomous public-content moderation;
- posthumous digital-legacy agent behaviour;
- and governed external agent collaboration.

Each deferred capability requires separate evidence, risk, governance, and evaluation review before implementation.

---

## 40. Future Evolution

Future versions may develop:

- specialist research modes;
- domain-specific evidence agents;
- richer multimodal accessibility;
- on-device private assistance;
- protocol-aware adaptive interventions;
- living AI evaluation dashboards;
- reproducible model benchmarking;
- Participant-controlled personal AI memory;
- cross-language intervention delivery;
- AI-supported co-design;
- federated research collaboration;
- AI-assisted implementation science;
- richer provenance for generated content; and
- controlled multi-agent workflows.

Future autonomy should increase only when evidence, safety, user value, reversibility, and governance justify it.

---

## 41. Design Decisions

This document establishes that:

1. The AI Companion exists to support the Digital Intervention Research Platform, not to become a general AI product.
2. The canonical name is AI Companion.
3. Intervention purpose and research workflow determine AI functionality.
4. AI may act as Research Workflow Assistant, Intervention Delivery Component, measurement or analysis aid, and Object of Research only when its role is declared.
5. AI modes are contextual capability sets, not independent autonomous assistants.
6. Participant, Supporter, Professional Caregiver, Researcher, reviewer, Moderator and Administrator modes do not bypass effective permission.
7. The default AI posture is explain or retrieve, suggest and draft rather than act autonomously.
8. Human Actor Permission uses Role, Relationship, Consent, Purpose, Context, Specific Permission and Resource State.
9. Effective AI Permission is the intersection of human permission, AI configuration, task, tool permission, consent, purpose, context, Data Classification and Action Risk.
10. Permission filtering occurs before restricted data reaches the model.
11. AI context is minimum necessary and source-labelled.
12. AI accesses authoritative evidence through M10 and preserves Knowledge References, versions and provenance.
13. AI must not fabricate grounding when retrieval fails.
14. AI output distinguishes epistemic type, artefact type, review status, approval status, safety classification, grounding status and action status.
15. The AI Companion cannot directly mutate another aggregate.
16. All domain changes occur through typed, allowlisted and audited tools owned by platform modules.
17. Action Levels 0–4 are governed; Level 5 autonomous actions are prohibited.
18. Tool execution success comes from the platform service, not generated text.
19. Block, visibility, eligibility, consent and Resource State enforcement occur outside the model.
20. The AI Companion may assist Community discovery and content drafting but cannot autonomously publish.
21. The AI Companion may explain a Match Candidate but cannot accept, connect or message on behalf of the Participant.
22. Mutual Acceptance is required before applicable private Connection or communication activation.
23. Matching uses declared or separately authorised attributes only.
24. Hidden compatibility, vulnerability and capacity scoring is prohibited.
25. A Connection does not create a Supporter relationship, consent or research permission.
26. AI-generated Life Story wording remains Draft until confirmed.
27. AI cannot invent memories or convert contributions into Participant Testimony.
28. Life Story ownership, sharing and Legacy Preference remain Participant-controlled domain records.
29. Community and Platform Public are distinct from Internet Public.
30. Internet Public publication requires a separate approved flow.
31. AI may assist moderation triage but cannot autonomously impose a high-impact moderation decision.
32. Moderation Case, Safety Signal, Safety Event, Privacy Incident and AIIncident remain separate.
33. AI detection raises a Safety Signal; there is no independent SafetyEvent aggregate.
34. Human approval remains mandatory for scientific, consent, safety, moderation, governance and publication decisions.
35. No approval occurs through silence, timeout or inaction.
36. AI intervention behaviour is versioned through AIInterventionConfiguration and AIInterventionConfigurationVersion.
37. Material model, instruction, tool, retrieval, memory, matching, public-visibility, moderation or safety changes require impact review.
38. Silent model substitution is prohibited when it may affect study validity or Participant experience.
39. AI memory is purpose-bound, inspectable, correctable and distinct from Participant Profile, Life Story and research records.
40. Private Life Story, matching, message, safety and moderation content is not copied into persistent memory by default.
41. Ability adaptation changes presentation and support, not rights, consent, permission, intervention meaning or scientific content.
42. The AI Companion facilitates human connection and must not optimise emotional dependency.
43. It must not create fake social proof, reactions, users or human endorsement.
44. AI-generated and AI-derived data remain distinguishable from observations, testimony, outcomes and human decisions.
45. Social, matching and AI engagement metrics are process measures, not Healthy Aging outcomes by themselves.
46. Safety uses layered deterministic controls, model assistance, restricted tools and human escalation.
47. Core non-AI workflows remain available in degraded mode.
48. The MVP uses one controlled orchestration layer and a limited tool set rather than premature multi-agent autonomy.
49. The MVP includes AI support for evidence, Life Story, Community, Open Matching, messaging, moderation and Safety Signal routing.
50. The MVP excludes autonomous Match acceptance, public publication, high-impact moderation, Safety Event closure and knowledge publication.

---

## 42. Summary

The AI Companion is a governed assistance capability embedded in the Digital Intervention Research Platform.

Its purpose is to help transform evidence and research intent into accessible, safe, and evaluable digital intervention workflows.

Its core operating sequence is:

```text
Understand the Authorised Purpose
        ↓
Assemble Minimum Necessary Context
        ↓
Retrieve Evidence and Minimum Necessary Platform Records
        ↓
Explain, Suggest, Draft or Propose a Governed Action
        ↓
Validate Sources, Safety and Permissions
        ↓
Request Human Approval Where Required
        ↓
Execute Only Authorised Actions
        ↓
Record and Evaluate the Result
```

Its central rule is:

> The AI Companion may assist research and intervention delivery, but it must never replace evidence, Participant autonomy, meaningful human relationships, or accountable human judgement.

The success of the AI Companion will be measured not by how human it appears, how long users speak with it, how many posts it generates, or how many matches it encourages, but by whether it helps the platform design, deliver, and evaluate interventions that support meaningful human connection, identity, autonomy, participation, dignity, safety, accessibility, equity, and Healthy Aging.
