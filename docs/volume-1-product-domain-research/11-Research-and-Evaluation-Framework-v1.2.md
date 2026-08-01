# Document 11 — Research & Evaluation Framework

**Version:** 1.2  
**Status:** Conceptual Research and Theoretical Evaluation Baseline  
**Handbook Volume:** Volume I — Product, Domain & Research Architecture  
**Primary System:** Digital Intervention Research Platform  
**Primary Product Modules:** M04–M09 and M12–M15  
**Document Owner:** Research and Evaluation Governance  
**Approved By:** To be assigned  
**Last Updated:** 2026-07-28  
**Supersedes:** Document 11 — Research & Evaluation Framework v1.1  
**Review Trigger:** A material change to Research Project or Protocol governance, enrolment, intervention assignment, exposure, measurement, Safety Signal or Safety Event handling, Dataset Definition or Lock, Analysis Plans or Runs, Research Findings, Life Story evaluation, Community or Open Matching evaluation, moderation, AI evaluation, reporting, reproducibility, or MVP research scope

---

## 1. Purpose

This document defines the **Research & Evaluation Framework** of the **Healthy Aging Digital Intervention Research Platform**.

Its purpose is to establish how the platform supports the full lifecycle of digital intervention research:

- identifying meaningful Healthy Aging challenges;
- translating those challenges into answerable Research Questions;
- selecting or designing interventions;
- defining mechanisms and expected outcomes;
- developing and approving Protocols;
- recruiting and enrolling Participants;
- delivering and monitoring interventions;
- collecting quantitative and qualitative data;
- evaluating benefit, experience, burden, harm, accessibility, equity, implementation, moderation, and sustainability;
- evaluating Life Story, public and community social networking, Open Matching, Connections, messaging, and AI-supported intervention components;
- defining Dataset Definitions, generating and locking Dataset Versions, and preserving data lineage;
- executing approved Analysis Plans through traceable Analysis Runs;
- interpreting results;
- preserving uncertainty, null, mixed, negative, harmful, and failed findings;
- approving Research Findings; and
- supporting reproducible reporting, Evidence Packages, and governed external knowledge contribution.

The framework does not turn the platform into a generic clinical trial management system, a general-purpose analytics product, or an autonomous AI research system.

The platform remains focused on **Healthy Aging digital interventions** and the evidence required to determine:

- whether an intervention is useful;
- for whom it is useful;
- under what conditions it is useful;
- through which mechanisms it may work;
- what burden or harm it may create;
- how it should be adapted; and
- whether it should be retained, revised, restricted, replicated, expanded, suspended, retired, or continued as exploratory research.

---

## 2. Scope

This document covers:

- research lifecycle architecture;
- Research Questions;
- study types and evaluation designs;
- Protocol design and versioning;
- eligibility, enrolment, and consent;
- intervention assignment and exposure;
- causal pathways and mechanism evaluation;
- outcome architecture;
- measurement selection;
- quantitative, qualitative, and mixed-method data;
- process and implementation evaluation;
- exposure, engagement, adherence, retention, and withdrawal experience;
- Safety Signal, Safety Event, harm, privacy, fraud, harassment, and burden evaluation;
- accessibility, equity, subgroup, matching-fairness, and public-exposure evaluation;
- Life Story and Participant Testimony evaluation;
- public and Community social-network evaluation;
- Open Matching, Match Candidate, Mutual Acceptance, Connection, and messaging evaluation;
- moderation, reporting, appeal, and restoration evaluation;
- AI-specific evaluation;
- data quality, missing data, Dataset Definitions, Dataset Versions, and Dataset Locks;
- Analysis Plan, Analysis Run, interpretation, and finding approval;
- reproducibility;
- Research Findings;
- review, approval, reporting, and audit;
- MVP boundaries and future evolution.

This document does not define:

- final statistical software implementation;
- complete statistical methods for every study;
- final database schemas;
- jurisdiction-specific ethics requirements;
- full clinical trial regulatory compliance;
- final user interface layouts;
- full data interoperability specifications;
- external knowledge governance; or
- the internal architecture of the AI Companion.

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
- Batch 2 Handbook Consistency Review v1.0

### Provides input to

- Document 12 — Data & Interoperability Architecture
- Technical Architecture
- Research Workspace Design
- Protocol Builder
- Outcome and Measurement Services
- Analytics Architecture
- AI Evaluation Infrastructure
- Audit and Governance Design
- Document 18 — MVP Scope & Delivery Roadmap revision
- Document 19 — Initial Pilot Research Protocol revision
- Document 20 — UX Flows & Design System Specification revision
- MVP Delivery Plan

---

## 4. Research Platform Position

The Research Platform connects intervention design, delivery, measurement, and evaluation.

```text
Healthy Aging Challenge
        ↓
Research Question
        ↓
Evidence Review and Evidence Decision
        ↓
Evidence Snapshot
        ↓
Intervention Design and Exact Intervention Version
        ↓
Protocol Version and Governance Approval
        ↓
Eligibility, Consent and Enrolment
        ↓
Intervention Assignment
        ↓
Delivery, Exposure, Life Story, Community and Matching
        ↓
Assessment, Observation, Safety and Moderation
        ↓
Dataset Definition and Dataset Version
        ↓
Quality Review and Dataset Lock
        ↓
Analysis Plan and Analysis Run
        ↓
Interpretation Record
        ↓
Research Finding
        ↓
Intervention Decision
        ↓
Report, Evidence Package and External Submission
```

This lifecycle must remain traceable.

A user should be able to determine:

- which challenge motivated the research;
- which evidence informed the design;
- which intervention version was delivered;
- which population received it;
- which outcomes were measured;
- which Life Story, Community, matching, AI, moderation, safety, assessment, observation, and delivery records were eligible for research use;
- which Dataset Definition and locked Dataset Version were used;
- which Analysis Plan and Analysis Run were performed;
- which limitations and missingness applied;
- how human review affected interpretation; and
- how the final Research Finding and Intervention Decision were reached.

---

## 4.1 Current Conceptual Research Mode

The current programme does not conduct research with human participants.

The active methods are:

- conceptual analysis;
- source-grounded synthesis;
- formal definition and ontology construction;
- causal and mechanism mapping;
- architecture and invariant analysis;
- synthetic persona and scenario modelling;
- synthetic-data generation;
- deterministic simulation;
- prototype experiments;
- adversarial and boundary-case analysis;
- and structured theoretical interpretation.

No recruitment, informed-consent process, intervention exposure or human-subject data collection is currently performed.

Terms such as Participant, Consent, ProtocolVersion, ApprovalRecord and SafetyEvent remain part of the **conceptual platform model**. They describe how a future empirical platform could operate; they are not current external gates on theoretical work.

---

## 5. Design Principles

### 5.1 Research Question Before Feature

A technical feature should not become a research activity until it is connected to a defined intervention purpose, mechanism, outcome, and Research Question.

### 5.2 Intervention Before Engagement Metric

The platform must evaluate whether an intervention contributes to meaningful Healthy Aging outcomes, not merely whether users click, return, or remain active.

### 5.3 Evidence Before Claims

Claims about benefit, safety, mechanism, or effectiveness must be grounded in evidence and evaluation.

### 5.4 Protocol Before Delivery

Research delivery must follow an approved and versioned Protocol. Exploratory prototypes may use lighter governance, but their purpose and limits must remain explicit.

### 5.5 Participant Before Dataset

Participants are people with rights, preferences, abilities, relationships, and contexts. They must not be reduced to records or behavioural signals.

### 5.6 Benefit and Harm Together

Every intervention evaluation should examine intended benefit, burden, unintended effects, potential harm, accessibility, autonomy, dignity, equity, and withdrawal experience.

### 5.7 Mechanism Matters

An intervention should not be judged only by whether an outcome changed. The platform should also investigate how change may have occurred, whether intended components were delivered, and whether context influenced the result.

### 5.8 Reproducibility by Design

Protocol versions, intervention configurations, measurement definitions, datasets, analyses, and decisions must remain traceable.

### 5.9 Scientific Uncertainty Must Be Preserved

The platform must retain positive, negative, null, conflicting, incomplete, and failed findings.

### 5.10 Human Accountability

AI may assist with design, monitoring, analysis, and reporting, but accountable humans approve Protocols, analyses, interpretations, and Research Findings.


### 5.11 State Dimensions Remain Separate

Research Project lifecycle, Research Project phase, Protocol Version state, Review Request state, Enrolment state, Assessment state, Dataset Version state, Analysis Plan state, Research Finding state, Safety Signal state, Safety Event state, visibility, moderation, and external submission state must not be collapsed into one generic status.

### 5.12 Public, Community and Matching Activity Is Not Benefit

Posts, reactions, followers, Match Candidates, Connections, messages, session duration, feed visits, or AI conversations are process or exposure measures. They are not Healthy Aging outcomes without an approved causal and measurement relationship.

### 5.13 Participant-Controlled Content Requires Separate Research Authority

Creating or sharing a Life Story Item, Public Profile, Social Post, message, Match Preference, or Connection does not automatically authorise research analysis, AI training, quotation, external publication, or secondary use.

### 5.14 Safety and Moderation Are Related but Distinct

User Reports, Content Reports, Moderation Cases, Privacy Reviews, Safety Signals, Safety Events, AI Incidents, and technical incidents may be linked but have separate authorities, states, measures, and outcomes.

### 5.15 Analysis Output Is Not a Research Finding

An Analysis Output becomes evidence for an Interpretation Record. A Research Finding requires a defined Research Question, exact lineage, human review, uncertainty, limitations, and approval.

---

## 6. Research Lifecycle

The current conceptual research lifecycle is:

```text
Healthy Aging Challenge
        ↓
Source and Evidence Synthesis
        ↓
Concept Definition and Boundary Analysis
        ↓
ResearchQuestion and Theoretical Proposition
        ↓
Mechanism and Causal Model
        ↓
Intervention Concept
        ↓
Domain and Architecture Model
        ↓
Formal Invariants and State Machines
        ↓
Synthetic Persona and Scenario Set
        ↓
Synthetic Data and Simulation
        ↓
Prototype Experiment
        ↓
Contradiction, Sensitivity and Failure Analysis
        ↓
Interpretation and Theoretical Finding
        ↓
Model Revision or Future Empirical Hypothesis
```

A future empirical research lifecycle may additionally use ProtocolVersion, Consent, Enrolment, InterventionAssignment, AssessmentRecord and DatasetLock. Those are retained as modelled capabilities but are not prerequisites for current theoretical research.

## 7. Research Project

### 7.1 Purpose

A `ResearchProject` is the primary organisational aggregate for research activity.

It connects Research Questions, Evidence Reviews, Protocols, Participants, Intervention Assignments, Assessments, Observations, Outcome Records, Analyses, Research Findings, and governance records.

### 7.2 Required Project Information

A Research Project should include:

- Research Project ID;
- title and short name;
- purpose and background;
- Healthy Aging challenge;
- principal and secondary Research Questions;
- project type;
- target population and setting;
- intervention scope;
- expected mechanisms and outcomes;
- study design;
- responsible lead and project team;
- organisation;
- governance and ethics status;
- planned and actual dates;
- funding or sponsorship where relevant;
- conflicts of interest;
- data access rules;
- publication and external-submission plan;
- current lifecycle state;
- current operational phase;
- applicable Protocol Version and Intervention Configuration;
- Dataset and Analysis readiness;
- Community, matching, Life Story, moderation, AI, and safety scope where applicable;
- and audit history.

### 7.3 Research Project Lifecycle

The canonical lifecycle is:

```text
Draft
    ↓
In Review
    ↓
Approved
    ↓
Active
    ↓
Completed
    ↓
Archived
```

An Active project may become Suspended. A Draft or In Review project may become Cancelled.

### 7.4 Research Project Phase

Operational phase is separate from lifecycle state:

- Design;
- Setup;
- Recruitment;
- Intervention Delivery;
- Follow-Up;
- Data Preparation;
- Analysis;
- Reporting;
- Closure.


### 7.5 Project Types

Representative project types include:

- exploratory research;
- co-design study;
- usability study;
- accessibility study;
- feasibility study;
- pilot study;
- observational study;
- process evaluation;
- implementation evaluation;
- mechanism study;
- outcome evaluation;
- comparative study;
- adaptive study;
- longitudinal study;
- mixed-method study;
- Life Story and narrative study;
- Community and social-network study;
- Open Matching and Connection study;
- moderation and online-safety study;
- AI evaluation study;
- secondary analysis; or
- evidence synthesis.

---

## 8. Research Questions

### 8.1 Purpose

A `ResearchQuestion` defines what the project is trying to learn. It should be answerable, bounded, and connected to the intervention and evaluation model.

### 8.2 Categories

Representative categories include:

- problem definition;
- needs assessment;
- feasibility;
- acceptability;
- accessibility;
- engagement pathway;
- mechanism;
- safety;
- burden;
- efficacy;
- effectiveness;
- implementation;
- equity;
- personalisation;
- measurement validity;
- AI behaviour; and
- long-term sustainability.

### 8.3 Structure

A Research Question should identify, where applicable:

- population;
- setting;
- intervention;
- comparator;
- mechanism;
- outcome;
- measurement;
- timeframe;
- context; and
- uncertainty.

```text
For [population]
in [setting],
does [intervention configuration]
compared with [comparison condition]
influence [outcome]
through [proposed mechanism]
over [timeframe]?
```

Not all studies require a comparator or causal claim. Qualitative and exploratory questions may ask how Participants experience an intervention, why it is acceptable or unacceptable, or how context affects delivery.

### 8.4 Canonical State

A Research Question may be:

- Draft;
- In Review;
- Approved;
- Closed;
- Superseded;
- Archived.

Whether a question is fully, partially, negatively, or not yet answered is expressed through linked Research Findings and Research Knowledge Gaps, not by overloading the Research Question lifecycle.


### 8.5 Traceability

Every final Research Finding should identify which Research Question it addresses.

---

## 9. Study Design Framework

The active study design is a **conceptual, model-based and synthetic evaluation programme**.

Permitted designs include:

- structured conceptual analysis;
- comparative theory analysis;
- mechanism mapping;
- ontology and taxonomy development;
- formal state-machine verification;
- architecture trade-off analysis;
- synthetic case studies;
- simulation experiments;
- parameter sensitivity analysis;
- failure-mode and adversarial scenario analysis;
- and executable prototype evaluation.

The programme may formulate future empirical designs, including feasibility studies, mixed-method studies or comparative trials, but does not conduct them in the current phase.

The research record must clearly label whether a result is:

- definitional;
- deductive;
- source-supported;
- simulated;
- prototype-observed;
- inferred;
- speculative;
- or reserved for future empirical testing.

## 10. Protocol Architecture

### 10.1 Purpose

A `Protocol` defines how a Research Project will be conducted. It is a governed, versioned research object.

### 10.2 Protocol Contents

A Protocol should include:

- Protocol ID and version;
- title;
- Research Questions;
- objectives and hypotheses where applicable;
- study design and setting;
- target population;
- eligibility and exclusion criteria;
- recruitment and consent process;
- sample strategy;
- exact Intervention Version and Intervention Configuration references;
- AIInterventionConfigurationVersion where AI materially affects delivery;
- Life Story, Community, visibility, Open Matching, messaging, block, report and moderation rules where applicable;
- assignment method and comparator;
- baseline and follow-up assessments;
- delivery schedule;
- outcomes and measurements;
- process and qualitative measures;
- Safety Signal detection, Safety Event review, stopping rules and escalation;
- moderation, privacy and public-exposure monitoring where applicable;
- withdrawal rules;
- data collection, Dataset Definition and quality plan;
- Analysis Plan and analysis-readiness requirements;
- missing-data approach;
- subgroup plan;
- privacy and data access controls;
- retention policy;
- publication plan; and
- approval records.

### 10.3 Protocol Versions

Every material Protocol change must create a new version.

Material changes include changes to:

- target population;
- eligibility criteria;
- intervention component;
- delivery intensity;
- outcome definition;
- measurement instrument;
- assignment method;
- safety control;
- follow-up period;
- Analysis Plan; or
- consent requirement;
- Life Story ownership, contribution, sharing or Legacy Preference rules;
- Community or Internet Public visibility;
- matching attributes, candidate generation, explanation or Mutual Acceptance;
- moderation or block policy;
- or AI configuration and tool authority.

### 10.4 Protocol Version State

The canonical state model is:

```text
Draft
    ↓
In Review
    ↓
Approved
    ↓
Active
```

An Active Protocol Version may become Suspended, Superseded, or Archived. A Draft or In Review version may become Rejected.

External ethics, privacy, safety, organisational, or regulatory reviews remain separate Approval Records and do not become Protocol Version states.


### 10.5 Amendment Record

An amendment should record:

- reason;
- affected sections;
- old and new values;
- date;
- responsible person;
- approval requirement;
- impact on current Participants;
- impact on existing data; and
- whether re-consent is required.

### 10.6 No Silent Mutation

An active Protocol must not be edited in place.

---

## 11. Human-Subject Research Model

Eligibility, recruitment, informed Consent, Enrolment and withdrawal remain defined as **future empirical platform capabilities**.

They are not active procedures in the current conceptual research programme.

Current scenario work uses synthetic personas and synthetic records that:

- do not identify real people;
- do not derive from private human-subject data;
- are explicitly labelled synthetic;
- avoid presenting generated traits as real population facts;
- and exist only to test concepts, invariants, UX logic and architecture behaviour.

If a later project introduces real human participants, a separate empirical protocol and the applicable institutional and legal processes must be created at that time. That future possibility does not delay current theoretical work.

## 12. Intervention Assignment and Exposure

### 12.1 Intervention Assignment

An `InterventionAssignment` links a Participant to:

- Research Project;
- Protocol Version;
- Intervention, Intervention Version and Intervention Configuration;
- AIInterventionConfigurationVersion where applicable;
- intervention arm;
- start date;
- intended schedule;
- delivery mode;
- adaptation rules; and
- assignment status.

### 12.2 Assignment Methods

Representative methods include:

- manual assignment;
- random assignment;
- stratified randomisation;
- block randomisation;
- cluster assignment;
- adaptive assignment;
- preference-based assignment;
- eligibility-based assignment; or
- observational exposure.

### 12.3 Assignment and Exposure States

Intervention Assignment state is:

- Planned;
- Ready;
- Active;
- Paused;
- Completed;
- Discontinued;
- Cancelled.

Exposure is a separate record. Canonical exposure states are:

- Offered;
- Viewed;
- Started;
- Partially Received;
- Completed;
- Skipped;
- Declined;
- Failed;
- Interrupted.

The platform records actual exposure rather than inferring exposure from assignment or page availability.


### 12.4 Fidelity

Fidelity evaluation should consider whether required components were offered and received, whether delivery followed the exact Protocol Version and Intervention Configuration, whether duration and intensity were achieved, whether adaptations were within the approved range, whether Life Story sharing and Community or matching safeguards were applied, and whether AI behaviour remained within the approved AI configuration.

### 12.5 Dose

Dose may include sessions, duration, frequency, completed components, exposure time, human-support time, Community opportunities shown, Match Candidates generated, introductions offered, Life Story prompts completed, or other intervention-specific units.

Messages, posts, reactions, candidates, Connections, AI conversations, or time on platform are not automatically dose and are never automatically benefit. Dose definitions must be Protocol-specific.


### 12.6 Life Story, Community and Matching Exposure

Where these capabilities are intervention components, exposure records should distinguish:

- Life Story prompt offered, viewed, started, completed, skipped or declined;
- Participant Draft versus confirmed Participant Testimony;
- Supporter contribution proposed, accepted, rejected or withdrawn;
- visibility selected and audience reached;
- Community Space, Social Post or activity shown;
- whether content was merely displayed, opened, responded to or used in a meaningful interaction;
- Match Candidate generated, shown, explained, dismissed, marked Interested, expired, blocked or reported;
- Mutual Acceptance and Match Introduction;
- Connection activation, pause, disconnect, block and report;
- human interaction actually occurring;
- and moderation or safety interruption.

A generated Match Candidate, visible Social Post, sent message, or created Life Story Item does not demonstrate meaningful human connection or Healthy Aging benefit.

---

## 13. Causal Pathway and Mechanism Model

```text
Intervention Component
        ↓
Offered and Actual Exposure
        ↓
Engagement and Experience
        ↓
Mechanism and Mediator
        ↓
Behavioural, Social or Environmental Change
        ↓
Proximal Outcome
        ↓
Healthy Aging Outcome
        ↓
Burden, Harm, Accessibility, Equity and Sustainability
```

### 13.1 Mechanism Evaluation

The platform should support questions such as:

- Was the intervention delivered?
- Was the intended component received?
- How did the Participant experience it?
- Did a human interaction, Life Story, Community or matching pathway actually occur where intended?
- Did the proposed mediator or mechanism change?
- Did the proximal outcome change?
- Did the broader outcome change?
- Did contextual factors modify the pathway?
- Did harm occur through an unintended pathway?

### 13.2 Mediators and Moderators

The platform should distinguish:

- mediators;
- moderators;
- confounders;
- contextual factors; and
- implementation factors.

### 13.3 Mechanism Status

Mechanism claims should be recorded as:

- Hypothesised;
- Supported;
- Partially Supported;
- Unsupported;
- Contradicted; or
- Unresolved.

---

## 14. Outcome Architecture

### 14.1 Outcome Categories

The platform should distinguish:

- implementation outcomes;
- process outcomes;
- engagement and experience outcomes;
- proximal outcomes;
- Healthy Aging outcomes;
- burden outcomes;
- harm outcomes;
- accessibility outcomes;
- equity outcomes;
- sustainability outcomes;
- and clearly labelled exploratory outcomes.

Safety Signals and Safety Events are governed safety records. They may support harm outcomes but are not themselves a generic outcome taxonomy.


### 14.2 Proximal Outcomes

Examples include increased reciprocal interaction, improved task confidence, increased activity participation, reduced initiation burden, improved orientation, increased perceived control, and increased self-expression.

### 14.3 Healthy Aging Outcomes

Examples include:

- social connectedness;
- autonomy;
- participation;
- purpose;
- identity continuity;
- dignity;
- functional support;
- well-being;
- quality of life;
- relationship quality;
- digital inclusion; and
- perceived support.

### 14.4 Process Outcomes

Examples include recruitment, enrolment, retention, reach, fidelity, adherence, exposure, response rate, matching explanation shown, Mutual Acceptance compliance, report handling, and implementation consistency.

### 14.5 Implementation Outcomes

Examples include acceptability, adoption, appropriateness, feasibility, fidelity, penetration, sustainability, cost, and operational burden.

### 14.6 Safety and Burden Outcomes

Examples include emotional distress, confusion, coercion, privacy breach, unwanted contact, harassment, fraud, discrimination, rejection burden, trauma activation, family conflict, fatigue, frustration, dependency, social harm, Supporter burden, moderator burden, and staff burden.

### 14.7 Outcome Hierarchy

Each project should identify:

- primary outcome;
- secondary outcomes;
- exploratory outcomes;
- safety outcomes;
- process outcomes; and
- qualitative outcomes.

### 14.8 Outcome Definition

Every outcome should preserve:

- canonical name;
- definition;
- domain;
- level;
- timeframe;
- expected direction;
- measurement method;
- interpretation guidance; and
- source reference.


### 14.9 Engagement and Experience Outcomes

Representative outcomes include:

- comprehension;
- perceived control;
- reciprocity;
- belonging;
- meaningfulness;
- trust calibration;
- rejection or non-response experience;
- privacy concern;
- moderation trust;
- perceived safety;
- contribution recognition;
- identity continuity;
- and burden of participation.

These outcomes require approved measurement or qualitative methods. Platform activity counts are not substitutes.

### 14.10 Domain-Specific Outcome Boundaries

- Life Story item count is not identity continuity.
- Public posting is not belonging.
- A Match Candidate is not a relationship.
- A Connection is not relationship quality.
- Message count is not meaningful human contact.
- AI conversation length is not emotional support.
- Report volume is not moderation effectiveness without denominator, context and outcome.
- Fewer reports do not necessarily mean greater safety.
- Increased retention is not benefit when retention is driven by pressure or dependency.

---

## 15. Measurement Framework


### 15.1 Canonical Measurement Chain

```text
Research Question
        ↓
Construct
        ↓
Operational Definition
        ↓
Measurement
        ↓
Measurement Version
        ↓
Timepoint
        ↓
Source
        ↓
Interpretation Rule
```

A measurement must remain traceable to the construct and outcome it represents.

### 15.2 Measurement Types

The platform should support:

- validated instruments;
- researcher-developed instruments;
- Participant-reported outcomes;
- observer-reported outcomes;
- Supporter-reported outcomes;
- Informal Caregiver-reported outcomes;
- Professional Caregiver- or staff-reported outcomes;
- behavioural measures;
- platform process measures;
- sensor-derived measures;
- qualitative data; and
- administrative data.

### 15.3 Measurement Selection

Selection should consider:

- construct validity;
- reliability;
- responsiveness;
- target population;
- language and culture;
- ability requirements;
- burden;
- licensing;
- scoring and interpretation;
- sensitivity to change;
- feasibility; and
- timing.

### 15.4 Instrument and Measurement Version Record

A Measurement Instrument reference should preserve:

- name, identifier and exact version;
- construct and Operational Definition;
- intended population and context;
- language and translation version;
- administration method and mode;
- scoring and interpretation;
- validation context;
- language;
- accessibility requirements and permitted adaptations;
- scoring algorithm and version;
- interpretation rule and thresholds;
- licensing restrictions;
- burden estimate;
- source and provenance;
- directness and evidence basis;
- and limitations.

### 15.5 Measurement Schedule

A schedule may include:

- screening;
- baseline;
- pre-intervention;
- during intervention;
- post-session;
- post-intervention;
- short-term follow-up;
- long-term follow-up;
- event-triggered measurement; and
- unscheduled safety assessment.

### 15.6 Measurement Equivalence

When paper, mobile, voice, Supporter-assisted, Professional Caregiver-assisted, read-aloud, simplified-language, or large-text formats are used, the platform should record the exact adaptation and avoid assuming measurement equivalence unless supported. A material adaptation may require a new Measurement Version, sensitivity analysis, separate reporting, or exclusion from a pooled construct.

### 15.7 Process Measures Are Not Outcomes

Login count, time in application, AI conversation count, Social Post count, reactions, follower count, Match Candidate count, Connection count, message count, activity completion, or prompt response may indicate exposure, process or engagement but not benefit.

---

## 16. Assessment Records


### 16.1 Canonical Assessment State

- Scheduled;
- Available;
- In Progress;
- Completed;
- Partially Completed;
- Declined;
- Expired;
- Invalidated;
- Cancelled.

Invalidation preserves the original record, reason, reviewer, time and replacement reference where applicable.

An `AssessmentRecord` should include:

- Assessment Record ID;
- Participant;
- Research Project;
- Protocol Version;
- instrument or measure;
- assessment type;
- scheduled and actual time;
- administrator or self-administration;
- administration mode;
- exact Measurement Version and scoring algorithm version;
- responses and score;
- interpretation where permitted;
- completeness;
- assistance provided;
- accessibility adaptation;
- data quality flags; and
- provenance.

If a Supporter, Informal Caregiver, Professional Caregiver, staff member, or AI Companion assists, the platform should record who assisted, how, why, whether responses remained Participant-authored, whether an answer was suggested or translated, and whether measurement interpretation may be affected.


---

## 17. Observations and Qualitative Data

### 17.1 Observation

An `Observation` represents information recorded outside a formal measurement instrument.

Examples include:

- Participant comments;
- Supporter or Informal Caregiver observations;
- Professional Caregiver or staff observations;
- researcher field notes;
- system events;
- implementation notes;
- contextual events; and
- safety concerns.

### 17.2 Observation Source

The platform should distinguish:

- Participant;
- Supporter;
- Informal Caregiver;
- Professional Caregiver;
- Researcher;
- Staff;
- System;
- Device; or
- AI-derived observation.

Observed, reported, inferred, and AI-derived information must remain distinguishable.

### 17.3 Qualitative Methods

The platform should support:

- interviews;
- focus groups;
- open-ended surveys;
- diary entries;
- experience sampling;
- Participant narratives;
- usability sessions;
- think-aloud sessions;
- field notes; and
- document analysis.

### 17.4 Qualitative Record

A qualitative record should preserve:

- method;
- Participant or group;
- interviewer or facilitator;
- date and setting;
- consent;
- recording status;
- transcript status;
- language and translation;
- coding status;
- interpretation status; and
- access controls.

### 17.5 Meaning and Context

Qualitative data are particularly important for evaluating dignity, identity, meaning, autonomy, emotional safety, relationship quality, acceptability, burden, and unintended effects.


### 17.6 Life Story and Research Data Boundary

A `LifeStoryItem` is a Participant-controlled identity-bearing record. It is not automatically a qualitative research record.

Research use requires:

- an approved research purpose;
- compatible consent;
- an explicit source and authorship label;
- item-level visibility and reuse checks;
- a defined sampling and analysis approach;
- protection of third-party information;
- and preservation of withdrawal and retention rules.

Participant Testimony remains distinct from externally verified historical fact. AI transcription or drafting remains distinct from Participant-authored or Participant-confirmed content.

### 17.7 Social and Communication Data Boundary

A Social Post, Comment, message, Match Decision, Connection, Block Record, or User Report is not automatically research data. Inclusion requires a Dataset Definition, purpose, consent or other approved basis, minimisation, provenance, and protection from re-identification.

---

## 18. Engagement, Adherence and Retention

### 18.1 Distinct Concepts

The platform should distinguish:

- exposure;
- participation;
- engagement;
- adherence;
- completion;
- retention;
- satisfaction; and
- benefit.

### 18.2 Engagement

Engagement may include behavioural, experiential, cognitive, social, relational, or intervention-specific participation. It must be operationally defined and separated from exposure, adherence, satisfaction, relationship quality, and benefit.

### 18.3 Adherence

Adherence should be defined relative to the Protocol or intervention plan.

A Participant may be highly engaged but not adherent. A Participant may adhere without experiencing benefit.

### 18.4 Retention

Retention measures whether Participants remain in the research process. Withdrawal should not automatically be treated as failure.

### 18.5 Withdrawal Experience

The platform should evaluate:

- why Participants withdraw;
- whether withdrawal was easy;
- whether pressure was applied;
- whether data-use preferences were respected; and
- whether withdrawal revealed burden or harm.

### 18.6 Avoiding Addictive Metrics

The platform must not optimise engagement through:

- coercive streaks;
- punitive loss;
- manipulative notifications;
- emotional dependency;
- infinite-scroll mechanics;
- social-pressure metrics;
- exaggerated Match Candidate scarcity;
- fake reactions or artificial social proof;
- or dark patterns.

---

## 19. Process Evaluation

### 19.1 Purpose

Process evaluation examines how an intervention was implemented and experienced.

### 19.2 Core Questions

Process evaluation should ask:

- Was the intervention delivered as intended?
- Who received it?
- How much was delivered?
- How much was received?
- Which components were used?
- Which adaptations occurred?
- What barriers and facilitators affected delivery?
- What contextual factors mattered?
- Why did outcomes differ?
- What burden did implementation create?

### 19.3 Process Measures

Representative measures include:

- recruitment rate;
- enrolment rate;
- retention rate;
- intervention reach;
- delivery fidelity;
- dose delivered;
- dose received;
- completion rate;
- support required;
- technical failure rate;
- Match Candidates generated and viewed;
- Mutual Acceptance compliance;
- Connection activation and discontinuation;
- moderation workload, response time and appeal;
- block and report availability;
- Safety Signal and escalation frequency; and
- adaptation frequency.

### 19.4 Context Record

Context may include:

- living environment;
- staffing;
- technology access;
- Supporter availability;
- Community size and candidate-pool availability;
- moderation capacity;
- language;
- culture;
- organisational readiness;
- connectivity;
- local policy; and
- concurrent interventions.

---

## 20. Implementation Evaluation

### 20.1 Purpose

Implementation evaluation examines whether an intervention can operate responsibly in real settings.

### 20.2 Dimensions

The platform should support evaluation of:

- acceptability;
- adoption;
- appropriateness;
- feasibility;
- fidelity;
- reach;
- penetration;
- sustainability;
- cost;
- scalability;
- workforce impact; and
- organisational fit.

### 20.3 Implementation Actors

Implementation may involve:

- Participants;
- Supporters;
- Informal Caregivers;
- Professional Caregivers;
- Researchers;
- Community Organisations;
- Long-Term Care Staff;
- Administrators;
- Moderators; and
- Technical Support.

### 20.4 Readiness

Before controlled deployment, the platform should assess:

- governance readiness;
- staffing;
- training;
- support;
- accessibility;
- Community governance;
- matching fairness and explainability;
- moderation and appeal capacity;
- block, report and escalation;
- data quality;
- technology reliability; and
- local ownership.

---

## 21. Safety and Harm Evaluation

### 21.1 Safety Architecture

Every intervention should have a safety evaluation plan proportionate to its risk and context.

The canonical flow is:

```text
Participant, Supporter, Staff, System, AI or Moderation Concern
        ↓
SafetySignal
        ↓
Human Triage
        ↓
Closed as Not a Safety Event
or
Converted to SafetyEvent
        ↓
Safety Action, Monitoring and Resolution
```

AI or automation creates a Safety Signal, not a confirmed Safety Event.

### 21.2 Safety Signal

A `SafetySignal` preserves:

- source;
- Participant, Research Project, intervention and context;
- time;
- uncertainty;
- preliminary severity or urgency;
- relevant content or event reference;
- triage state;
- escalation;
- and disposition.

Canonical state:

```text
Recorded
→ Awaiting Triage
→ In Review
→ Escalated
→ Converted to Safety Event
or Closed as Not a Safety Event
```

### 21.3 Safety Event

A `SafetyEvent` is created only after authorised human confirmation.

It should preserve:

- Safety Event ID;
- linked Safety Signal;
- Participant and Research Project;
- exact Protocol and Intervention versions;
- date and time;
- source;
- severity and seriousness;
- expectedness;
- relatedness;
- immediate and follow-up actions;
- escalation;
- monitoring;
- resolution;
- reviewer;
- reporting status;
- and closure rationale.

Canonical state:

- Open;
- In Review;
- Action Required;
- Monitoring;
- Resolved;
- Closed;
- Reopened.

### 21.4 Harm Categories

Representative categories include:

- physical harm;
- psychological or emotional harm;
- social harm;
- privacy or public-exposure harm;
- autonomy loss;
- coercion;
- harassment;
- discrimination;
- fraud, scams, impersonation or financial exploitation;
- misinformation;
- unwanted contact;
- rejection or exclusion burden;
- Life Story trauma activation or family conflict;
- inappropriate clinical reliance;
- Supporter, moderator or staff burden;
- AI dependency;
- and intervention or measurement burden.

### 21.5 Monitoring Sources

Safety monitoring may include:

- Participant reporting;
- Supporter or Informal Caregiver reporting;
- Professional Caregiver or staff reporting;
- researcher review;
- deterministic rule detection;
- AI-assisted Safety Signal creation;
- moderation review;
- privacy review;
- and scheduled safety assessment.

### 21.6 Stopping Rules

A Protocol should define when to:

- pause a Participant's Intervention Assignment;
- pause recruitment;
- suspend an Intervention Version or arm;
- restrict Community, matching, messaging or public visibility;
- require urgent moderation, privacy or safety review;
- recommend Research Project pause;
- or terminate a study.

### 21.7 Safety and Moderation Boundary

```text
UserReport or ContentReport
        ↓
ModerationCase
        ├── may raise → SafetySignal
        └── may raise → Privacy Review
```

A Moderation Decision is not a Safety Event decision. A technical or AI incident is not automatically Participant harm.

### 21.8 Safety Evaluation Measures

Evaluation should include:

- signal frequency and source;
- triage time;
- conversion rate to Safety Event;
- false positive and missed-signal review;
- severity and relatedness;
- time to action and resolution;
- repeated or clustered concerns;
- Participant understanding and burden;
- stopping-rule performance;
- access inequity;
- and whether safeguards affected intervention fidelity or benefit.

---

## 22. Accessibility and Ability-Adaptive Evaluation

### 22.1 Purpose

Accessibility should be evaluated as part of intervention validity, not only interface compliance.

### 22.2 Ability Dimensions

Evaluation should include differences in:

- declared or observed cognitive-load and comprehension barriers without diagnostic inference;
- vision;
- hearing;
- mobility;
- dexterity;
- speech;
- language;
- digital literacy;
- fatigue;
- emotional state; and
- environmental support.

### 22.3 Accessibility Outcomes

Representative outcomes include:

- task completion;
- error rate;
- support required;
- time to completion;
- frustration;
- confidence;
- abandonment;
- successful correction; and
- sustained access.

### 22.4 Adaptation Evaluation

The platform should record:

- which adaptations were offered;
- which were selected;
- which were proposed from observed interaction signals;
- which were confirmed, overridden, paused, revoked or expired;
- whether they helped;
- whether source, uncertainty and reason were visible;
- whether they caused stigma or hidden exclusion;
- whether the Participant could correct them;
- whether they changed measurement equivalence;
- and whether they changed the meaning or fidelity of the intervention.

### 22.5 No Hidden Exclusion

An intervention should not be considered broadly effective if it only works for Participants with high digital ability unless that limitation is explicit.

---

## 23. Equity Evaluation

### 23.1 Purpose

The platform should examine whether benefits, burdens, harms, and access differ across groups.

### 23.2 Equity Dimensions

Evaluation may include:

- age;
- gender;
- language;
- culture;
- ethnicity;
- disability;
- socioeconomic context;
- living environment;
- rural or urban location;
- digital access;
- Supporter availability;
- caregiving context;
- Community size and candidate availability;
- public-visibility preference;
- moderation access;
- and health status where relevant and appropriately governed.

### 23.3 Equity Questions

The platform should ask:

- Who was excluded?
- Who could not access the intervention?
- Who required more support?
- Who benefited least?
- Who experienced greater burden?
- Did personalisation reproduce bias?
- Did AI suggestions, Match Candidate exposure, ranking, moderation actions, block effectiveness or report outcomes differ across groups?
- Were sensitive attributes inferred or used inappropriately?
- Were Platform Public or Community visibility risks distributed unequally?
- Were measurement instruments and adaptations appropriate?
- Did recruitment underrepresent important populations?

### 23.4 Small Subgroups

Subgroup analysis should avoid overclaiming when sample sizes are small. Exploratory subgroup findings must be clearly labelled.

---

## 24. AI Companion Evaluation

### 24.1 Purpose

When the AI Companion materially influences intervention delivery or research workflow, it must be evaluated as part of the intervention system.

### 24.2 Evaluation Levels

AI evaluation should include:

- model performance;
- retrieval quality;
- citation accuracy;
- instruction adherence;
- tool-use reliability;
- safety behaviour;
- permission compliance;
- personalisation and AIMemoryItem behaviour;
- Life Story drafting, transcription and invented-detail behaviour;
- Community, matching, messaging and moderation assistance;
- accessibility;
- human oversight;
- Safety Signal behaviour;
- intervention contribution; and
- Participant outcomes.

### 24.3 Researcher-Facing AI

The platform should evaluate:

- time saved;
- retrieval completeness;
- citation correctness;
- error rate;
- unsupported claims;
- reviewer correction rate;
- decision quality;
- transparency; and
- trust calibration.

### 24.4 Participant-Facing AI

The platform should evaluate:

- comprehension;
- helpfulness;
- emotional tone;
- accessibility;
- autonomy support;
- escalation behaviour;
- human-connection support;
- dependency risk;
- misinformation; and
- effect on intended outcomes.

### 24.5 AI Intervention Configuration

Evaluation must identify the exact configuration used:

- model;
- model version;
- system instructions;
- prompts;
- retrieval sources;
- tools;
- memory rules;
- personalisation and adaptation rules;
- Life Story, Community, matching, messaging and moderation tool permissions;
- allowed matching attributes and Match Explanation policy;
- audience and publication restrictions;
- safety policies;
- escalation logic; and
- user-interface mode.

### 24.6 Material AI Change

A material AI configuration change may require:

- Protocol amendment;
- re-validation;
- safety review;
- re-consent;
- new intervention version; or
- separate analysis.

### 24.7 Unsupported Output

The platform should record:

- unsupported claims;
- fabricated citations;
- incorrect or falsely claimed tool results;
- retrieval mismatch;
- invented Life Story details;
- inappropriate public disclosure;
- hidden or misleading Match Reasons;
- block, visibility or Mutual Acceptance bypass attempts;
- moderation-assistance error;
- unsafe advice;
- and failure to raise or route a Safety Signal.

### 24.8 Human-AI Collaboration

Evaluation should distinguish:

- AI suggestion;
- human acceptance;
- human correction;
- human rejection;
- final action; and
- final responsibility.

---


## 25. Life Story Evaluation

### 25.1 Purpose

Life Story evaluation should determine whether INT-004 and related components support identity, self-expression, meaning, recognition, human conversation, and Participant control without creating unacceptable burden, privacy risk, conflict, or false claims.

### 25.2 Core Measures

- prompt offered, started, completed, skipped or declined;
- media and modality used;
- AI transcription and translation accuracy;
- invented-detail and attribution error;
- Participant correction, confirmation and rejection;
- Supporter contribution acceptance, rejection and conflict;
- perceived ownership and control;
- identity continuity and self-expression;
- meaningful conversation or intergenerational exchange;
- emotional burden, grief, distress or trauma activation;
- privacy concern and unwanted disclosure;
- visibility, download, quotation and re-sharing comprehension;
- withdrawal and deletion experience;
- export usability;
- and Legacy Preference comprehension.

### 25.3 Boundaries

- Life Story item count is not identity continuity.
- Reminiscence activity is not automatically cognitive benefit.
- Participant Testimony is not verified historical fact.
- AI Draft is not Participant Testimony until confirmed.
- Public sharing is evaluated separately from archive creation.
- Posthumous use requires separate consent, legal and governance analysis.

---

## 26. Community and Public Social-Network Evaluation

### 26.1 Evaluation Questions

- Does Community participation support belonging, reciprocal interaction or meaningful participation?
- Which Community Space structures and rules are acceptable?
- How do chronological, interest-based and intervention-purpose ranking affect exposure?
- Does Platform Public add benefit beyond Connections or Community visibility?
- What privacy, harassment, misinformation, fraud, discrimination or unwanted-contact harms occur?
- Are block, mute, report, appeal and restoration accessible and effective?
- Does Community participation displace offline or direct human contact?
- Does design create pressure, comparison, dependency or compulsive return?

### 26.2 Measures

- Community eligibility, reach and participation;
- content exposure and response;
- reciprocal interaction;
- perceived belonging and safety;
- meaningfulness and burden;
- block, mute and report use;
- harassment, fraud, discrimination and privacy incidents;
- moderation response and restoration;
- accessibility and language equity;
- public-visibility comprehension;
- ranking exposure and diversity;
- and human-connection outcomes.

Post, reaction, follower, feed-visit and session counts remain process measures.

---

## 27. Open Matching and Connection Evaluation

### 27.1 Evaluation Questions

- Do declared interests, goals, language, communication mode, availability and coarse location produce useful Match Candidates?
- Is the Match Explanation understandable and accurate?
- Are candidate generation and exposure fair?
- Are exclusions and Block Records enforced?
- Does Mutual Acceptance occur before Connection and private communication?
- What rejection, non-response, sparse-pool or comparison burden occurs?
- Do Connections lead to meaningful human interaction?
- What fraud, impersonation, harassment, discrimination or unwanted-contact risks occur?

### 27.2 Measures

- opt-in and pause rates;
- Match Preference completeness and correction;
- candidate generation and eligibility;
- explanation comprehension;
- candidate diversity and exposure inequality;
- Interested, Not Now, Dismissed, Expired, Reported and Blocked decisions;
- Mutual Acceptance compliance;
- introduction and Connection activation;
- time to meaningful interaction;
- pause, disconnect, block and report;
- rejection and non-response burden;
- relationship quality where appropriately measured;
- privacy and location concern;
- and safety or moderation outcomes.

A Match Candidate is not a Connection. A Connection is not automatically a Supporter relationship or proof of relationship quality.

---

## 28. Moderation Evaluation

### 28.1 Evaluation Dimensions

- report discoverability and accessibility;
- report-category accuracy;
- triage time and reviewer assignment;
- human versus AI or provider contribution;
- false positive and false negative review;
- action proportionality;
- urgent restriction effectiveness;
- reporter protection;
- affected-actor understanding;
- appeal access, timeliness and fairness;
- restoration and recurrence;
- language, culture, disability and communication-style equity;
- moderator workload and wellbeing;
- linkage to Safety Signal or privacy review;
- and effect on Community participation and trust.

Fewer reports do not necessarily demonstrate greater safety, and more restrictions do not necessarily demonstrate better moderation.

---
## 29. Data Collection Architecture

### 29.1 Sources

Research data may come from:

- Participant input;
- Supporter or Informal Caregiver input;
- Professional Caregiver or staff input;
- Researcher input;
- staff input;
- formal assessments;
- qualitative sessions;
- platform events;
- devices;
- wearables;
- smart-home systems;
- AI interactions and AIMemoryItem records where approved;
- Life Story Items and contributions where explicitly authorised;
- Public Profiles, Social Posts, Comments and Community Membership records where authorised;
- Match Preferences, Match Candidates, Match Decisions, introductions and Connections where authorised;
- messages where separately authorised;
- User Reports, Content Reports, Moderation Cases, decisions and appeals;
- Safety Signals and Safety Events;
- and external datasets.

### 29.2 Data Collection Plan

A plan should define:

- data element;
- source;
- collection method;
- timing;
- purpose;
- required or optional status;
- responsible actor;
- expected quality;
- privacy level;
- retention;
- consent or other approved basis;
- visibility and reuse restrictions;
- Data Classification;
- inclusion in Dataset Definitions;
- and analysis use.

### 29.3 Data Minimisation

The platform should collect only data necessary for intervention delivery, research, safety, governance, or approved secondary use.

### 29.4 Participant Burden

The platform should avoid excessive questionnaires, repeated requests, unnecessary passive monitoring, intrusive notifications, and data collection unrelated to the Research Question.

---

## 30. Data Quality

### 30.1 Dimensions

The platform should monitor:

- completeness;
- validity;
- accuracy;
- consistency;
- timeliness;
- uniqueness;
- provenance; and
- interpretability.

### 30.2 Quality Flags

Representative flags include:

- Missing;
- Out of Range;
- Inconsistent;
- Duplicate;
- Late;
- Assisted;
- Device Failure;
- Manual Correction;
- Derived;
- Imputed; or
- Unverified.

### 30.3 Correction

Corrections should preserve original value, corrected value, reason, actor, date, and approval where required.

### 30.4 Derived Data

Derived data should record source data, transformation, algorithm, version, date, and responsible process.

### 30.5 AI-Derived Data

AI-generated classifications, summaries, suggested codes, Match Reasons, moderation labels, inferred preferences, emotion estimates, Life Story entities, or risk flags must remain distinguishable from observed, reported, Participant-confirmed, moderator-decided, and human-approved data.

---

## 31. Missing Data

### 31.1 Missingness Reasons

The platform should distinguish:

- not collected;
- Participant declined;
- Participant unable;
- technical failure;
- missed visit;
- not applicable;
- lost to follow-up;
- withdrawn; or
- unknown.

### 31.2 Missing-Data Plan

A Protocol or Analysis Plan should specify expected missingness, prevention, monitoring, thresholds, handling, sensitivity analysis, and reporting.

### 31.3 No Silent Imputation

Imputed values must never overwrite original missingness. The imputation method and version must be recorded.

---


## 32. Dataset Definition, Version and Lock

### 32.1 Dataset Definition

A `DatasetDefinition` specifies the governed data product required for one research purpose.

It should define:

- Research Project and Research Questions;
- purpose and approved use;
- source aggregates and exact fields;
- inclusion and exclusion rules;
- time windows;
- consent and permission requirements;
- visibility and reuse rules;
- variable definitions;
- transformations;
- missingness handling;
- de-identification;
- Life Story, Community, matching, message, moderation, safety and AI-data inclusion rules;
- quality thresholds;
- retention;
- and required approvals.

### 32.2 Dataset Version

A `DatasetVersion` is generated from an approved Dataset Definition and exact source versions.

It preserves:

- Dataset Version ID;
- Dataset Definition version;
- source lineage and extraction time;
- included Participants and records;
- exclusions and reasons;
- transformations and Transformation Runs;
- corrections;
- de-identification state;
- missingness and imputation;
- quality issues;
- manifest;
- checksum;
- state;
- and supersession history.

### 32.3 Canonical Dataset Version State

```text
Draft
    ↓
Generated
    ↓
Quality Review
    ↓
Quality Reviewed
    ↓
Locked
    ↓
Analysed
```

A Dataset Version may later become Superseded or Archived.

### 32.4 Dataset Lock

`DatasetLock` is an entity and governed milestone within a Dataset Version.

A lock records:

- scope;
- version;
- date;
- included records;
- exclusions;
- transformations;
- missingness;
- quality status;
- unresolved accepted issues;
- checksum;
- approver;
- and purpose.

A locked Dataset Version is immutable. Corrections create a new Dataset Version.

### 32.5 Lock Readiness

A Dataset Version cannot be locked until:

- the Dataset Definition is approved;
- required consent and purpose checks have passed;
- source lineage is complete;
- required quality review is complete;
- missingness and imputation are explicit;
- de-identification is documented;
- unresolved material issues are accepted by an authorised reviewer;
- and the intended Analysis Plan is compatible.

AI may assist quality review but cannot lock a Dataset Version.

---
## 33. Analysis Planning

### 33.1 Analysis Plan

An `AnalysisPlan` should include:

- Research Question;
- outcome;
- population;
- analysis population;
- variables;
- data transformations;
- statistical or qualitative method;
- covariates;
- subgroup analysis;
- missing-data approach;
- multiplicity considerations;
- sensitivity analysis;
- exclusion rules;
- software, code or tool;
- software environment and version;
- required locked Dataset Version;
- planned Analysis Runs and outputs;
- decision rules and interpretation constraints;
- version;
- and approval.


### 33.2 Analysis Plan State

The canonical state is:

- Draft;
- In Review;
- Approved;
- Active;
- Superseded;
- Archived;
- Rejected.

A material change creates a new Analysis Plan version.

### 33.3 Analysis Run

An `AnalysisRun` executes an exact approved Analysis Plan against an exact locked Dataset Version.

It should preserve:

- Analysis Run ID;
- Analysis Plan version;
- locked Dataset Version;
- code, notebook or workflow reference;
- software environment;
- parameters and seeds where relevant;
- start and completion time;
- actor or authorised process;
- warnings and errors;
- outputs and diagnostics;
- reproducibility status;
- and supersession or rerun relationship.

An Analysis Output is not an Interpretation Record or Research Finding.

### 33.4 Analysis Populations

Representative populations include:

- intention-to-treat;
- per-Protocol;
- as-treated;
- safety population;
- enrolled population;
- completed population; and
- qualitative sample.

### 33.5 Exploratory Analysis

Exploratory analysis should be labelled and separated from pre-specified analysis.

### 33.6 Versioning

Material changes to an Analysis Plan should create a new version and preserve rationale.

### 33.7 AI-Assisted Analysis

AI may assist with code drafting, data checks, documentation, qualitative coding suggestions, visualisation suggestions, and narrative summaries.

Human reviewers remain responsible for method selection, code validation, execution approval, interpretation, and final findings. AI-generated code and outputs preserve model, instruction, tool, source, reviewer, and correction provenance.

---

## 34. Quantitative Evaluation

### 34.1 Descriptive Analysis

The platform should support sample characteristics, intervention exposure, data completeness, recruitment, retention, adherence, process measures, outcome distributions, and Safety Events.

### 34.2 Effect Evaluation

Where appropriate, evaluation may include:

- change from baseline;
- between-group difference;
- effect size;
- confidence interval;
- risk difference;
- rate ratio;
- time-to-event;
- repeated-measures analysis; and
- longitudinal trajectory.

### 34.3 Practical Importance

Statistical significance should not be treated as equivalent to meaningful benefit. The platform should preserve magnitude, uncertainty, practical importance, Participant experience, and burden.

### 34.4 Multiple Outcomes

Primary, secondary, and exploratory outcomes must remain distinct.

### 34.5 Small Samples

Feasibility and pilot studies should not be overinterpreted as definitive outcome evaluations.

---

## 35. Qualitative Evaluation

### 35.1 Purpose

Qualitative evaluation helps explain experience, meaning, context, acceptability, mechanism, implementation, burden, and unintended effects.

### 35.2 Analysis Approaches

The platform may support:

- thematic analysis;
- framework analysis;
- content analysis;
- narrative analysis;
- grounded theory;
- realist analysis; and
- rapid qualitative analysis.

### 35.3 Coding

Qualitative coding should preserve codebook version, coder, coding date, source segment, disagreements, resolution, and interpretation.

### 35.4 AI-Assisted Coding

AI may suggest codes or summaries. AI output must not replace human interpretation without explicit review.

### 35.5 Participant Voice

Reporting should preserve authentic Participant perspective while respecting privacy and consent.

---

## 36. Mixed-Methods Evaluation

### 36.1 Purpose

Mixed-method evaluation integrates quantitative and qualitative evidence.

### 36.2 Integration Points

Integration may occur during design, sampling, data collection, analysis, interpretation, or reporting.

### 36.3 Questions

The platform should support questions such as:

- Why did quantitative outcomes vary?
- How did Participants experience the intervention?
- Which barriers explain low fidelity?
- Why did engagement not produce benefit?
- Which subgroups experienced harm or burden?
- How did context influence results?

### 36.4 Joint Interpretation

The platform should preserve where findings converge, complement, contradict, or remain unresolved.

---

## 37. Interpretation Framework

### 37.1 Interpretation Record

An `InterpretationRecord` should include:

- Research Question;
- analysis results;
- relevant Evidence Decisions;
- mechanism findings;
- process findings;
- safety findings;
- qualitative findings;
- implementation findings;
- alternative explanations;
- limitations;
- uncertainty;
- generalisability; and
- reviewer conclusions.

### 37.2 Interpretation Questions

Researchers should consider:

- Did the intervention produce the intended outcome?
- Was the change meaningful?
- Was the mechanism supported?
- Was the intervention delivered as intended?
- Who benefited?
- Who did not benefit?
- Who experienced burden or harm?
- What contextual factors mattered?
- What alternative explanations exist?
- What remains unknown?

### 37.3 Avoiding Overclaiming

The platform should flag when conclusions exceed design strength, sample size, measurement quality, data completeness, Analysis Plan, or evidence directness.

### 37.4 Causal Language

Causal language should be restricted to designs and analyses that support causal interpretation.

### 37.5 Null and Negative Findings

Null and negative findings should be retained and reported.


### 37.6 Interpretation Approval

Interpretation is human-accountable.

The workflow is:

```text
Analysis Outputs and Diagnostics
        ↓
Draft Interpretation
        ↓
Evidence, Process, Safety, Moderation and Qualitative Context
        ↓
Human Review
        ↓
Approved Interpretation Record
```

AI may draft or organise interpretation but cannot approve it.

---

## 38. Research Findings

### 38.1 Purpose

A `ResearchFinding` is an approved statement derived from a defined research process.

### 38.2 Finding Types

Representative types include:

- feasibility finding;
- usability finding;
- accessibility finding;
- mechanism finding;
- outcome finding;
- safety finding;
- implementation finding;
- equity finding;
- AI performance finding;
- Life Story finding;
- Community and social-network finding;
- Open Matching and Connection finding;
- moderation finding;
- privacy or public-exposure finding;
- measurement finding;
- null finding;
- mixed finding;
- harmful finding; or
- failed-implementation finding.

### 38.3 Finding Record

A Research Finding should include:

- Finding ID;
- Research Project;
- Research Question;
- Protocol Version;
- Intervention Version;
- analysis reference;
- interpretation reference;
- finding statement;
- population;
- setting;
- outcome;
- direction;
- magnitude where applicable;
- uncertainty;
- limitations;
- safety implications;
- generalisability;
- reviewer;
- approval;
- provenance; and
- status.

### 38.4 Canonical Research Finding State

- Draft;
- In Review;
- Approved;
- Approved with Limitations;
- Rejected;
- Superseded;
- Withdrawn;
- Archived.

External submission and external publication are separate M14 records and states. They do not become Research Finding states.


### 38.5 Finding Granularity

A finding should preserve population, intervention configuration, setting, outcome, timeframe, and uncertainty.

### 38.6 No Automatic Knowledge Publication

Research Findings remain Research Platform records. An approved Finding may support an Evidence Package and External Submission, but external acceptance, revision, rejection or publication does not silently rewrite the historical Finding.


---

## 39. Intervention Decision Framework

### 39.1 Purpose

Evaluation should support intervention lifecycle decisions.

### 39.2 Decision Outcomes

Representative decisions include:

- Retain;
- Revise;
- Restrict;
- Expand;
- Replicate;
- Suspend;
- Retire; or
- Continue Exploratory Research.

### 39.3 Decision Criteria

Intervention decisions should consider:

- benefit;
- harm;
- burden;
- evidence strength;
- mechanism support;
- accessibility;
- equity;
- implementation feasibility;
- Participant preference and withdrawal experience;
- Life Story ownership and identity impact;
- human-connection impact;
- Community, matching and moderation performance;
- privacy and public-exposure risk;
- AI contribution and dependency risk;
- cost; and
- uncertainty.

### 39.4 Decision Record

An `InterventionDecision` should preserve:

- intervention and version;
- evidence reviewed;
- Research Findings;
- safety findings;
- implementation findings;
- decision;
- rationale;
- conditions;
- responsible reviewer;
- approval; and
- review date.

---

## 40. Reproducibility and Research Lineage

### 40.1 Lineage

```text
Research Question
        ↓
Evidence Review, Evidence Decision and Evidence Snapshot
        ↓
Protocol Version
        ↓
Intervention Version and Intervention Configuration
        ↓
AIInterventionConfigurationVersion where applicable
        ↓
Enrolment and Intervention Assignment
        ↓
Exposure, Adaptation and Fidelity
        ↓
Life Story, Community, Matching, Messaging and Moderation Records
        ↓
Assessment, Observation, Safety Signal and Safety Event
        ↓
Dataset Definition and Locked Dataset Version
        ↓
Analysis Plan Version and Analysis Run
        ↓
Analysis Output and Diagnostics
        ↓
Approved Interpretation Record
        ↓
Research Finding
        ↓
Intervention Decision
```

### 40.2 Reproducibility Package

A reproducibility package may include:

- Protocol;
- intervention and AI configuration;
- Evidence Decision and Evidence Snapshot;
- data dictionary and Dataset Definition;
- locked Dataset Version reference;
- transformation log;
- Analysis Plan;
- code or notebook reference;
- software environment;
- output tables;
- figures;
- qualitative codebook and synthesis references;
- moderation, safety and data-quality summaries where applicable;
- decisions;
- and audit history.

### 40.3 Immutable Research Milestones

Approved Protocol Versions, Evidence Snapshots, locked Dataset Versions, approved Analysis Plans, approved Interpretation Records, and approved Research Findings should be immutable. Corrections create new versions, superseding records, or explicit amendments.


---

## 41. Internal Review and Quality Control

The current conceptual programme uses internal quality-control states rather than external approval gates.

A research artefact may be:

- Draft;
- In Review;
- Revised;
- Accepted as Conceptual Baseline;
- Superseded;
- Rejected;
- or Reserved for Future Empirical Testing.

Internal review asks whether:

- definitions are coherent;
- sources support the attributed statements;
- assumptions are explicit;
- causal claims are proportionate;
- synthetic experiments are reproducible;
- counterexamples have been considered;
- limitations are visible;
- and theoretical findings are not misrepresented as empirical evidence.

Review improves research quality but is not an external permission to begin research.

## 42. Reporting Framework

### 42.1 Report Types

The platform should support:

- Protocol report;
- recruitment report;
- progress report;
- safety report;
- feasibility report;
- process evaluation report;
- outcome report;
- implementation report;
- final research report;
- Participant-facing summary; and
- Evidence Package;
- moderation and online-safety report;
- Community and matching evaluation report;
- Life Story evaluation report;
- reproducibility package;
- and external-submission package.

### 42.2 Reporting Principles

Reports should:

- distinguish planned and exploratory analyses;
- distinguish evidence and interpretation;
- report null and negative findings;
- disclose AI assistance;
- preserve uncertainty;
- report harms and burden;
- explain missing data;
- identify Protocol amendments; and
- avoid misleading precision.

### 42.3 Participant-Facing Reporting

Participant summaries should use plain language, accessible formats, appropriate uncertainty, clear explanation of what was learned, and explicit acknowledgement of limitations.


### 42.4 External Submission Boundary

M14 owns EvidencePackage, ExternalSubmission and ExternalPublicationReference.

```text
Approved Research Finding
        ↓
Evidence Package
        ↓
Human Review
        ↓
External Submission
        ↓
Accepted • Revised • Rejected • Deferred
        ↓
External Publication Reference where applicable
```

External state does not become Research Finding state.

---

## 43. Auditability and Governance

### 43.1 Audit Events

The platform should record:

- project creation;
- Research Question changes;
- Protocol versions;
- approvals;
- Consent versions;
- enrolment;
- assignment;
- assessment completion;
- intervention delivery;
- Safety Signals and Safety Events;
- Life Story research-use and sharing changes;
- Community, matching, Connection, block, report and moderation records used in evaluation;
- data correction;
- Dataset Definition approval, Dataset Version generation and lock;
- analysis execution;
- interpretation changes;
- Finding approval; and
- external submission.

### 43.2 AI Audit

AI-related audit should include:

- AIInteraction and AIInterventionConfigurationVersion;
- model version;
- prompt or instruction version;
- retrieved context and Evidence Snapshot;
- tool calls;
- output;
- human review;
- acceptance or rejection; and
- final action.

### 43.3 Governance Boundaries

System administration does not automatically grant Protocol approval, Evidence Decision approval, Finding approval, or safety authority.

---

## 44. Research Dashboards

### 44.1 Project Dashboard

A project dashboard may show:

- project status;
- recruitment;
- enrolment;
- retention;
- intervention delivery;
- data completeness;
- upcoming assessments;
- Safety Events;
- unresolved Safety Signals, moderation cases and data-quality issues;
- Dataset and Analysis readiness;
- and current Research Project lifecycle and phase.

### 44.2 Intervention Dashboard

An intervention dashboard may show:

- assigned Participants;
- exposure;
- fidelity;
- adherence;
- adaptations;
- process and experience outcomes;
- Life Story, Community and matching exposure where applicable;
- safety and moderation;
- and version distribution.

### 44.3 Outcome Dashboard

An outcome dashboard may show:

- measurement completion;
- baseline distribution;
- follow-up completion;
- missingness;
- preliminary summaries;
- data quality;
- Measurement Version and adaptation distribution;
- and explicit preliminary-result warnings.

### 44.4 Governance Dashboard

A governance dashboard may show:

- pending approvals;
- expired Consent;
- Protocol deviations;
- safety and moderation reviews;
- overdue re-consent;
- Internet Public, matching and AI configuration reviews;
- Dataset locks and Analysis Plan approvals;
- and unresolved audit issues.

Dashboards must not present preliminary results as final findings.

---

## 45. Failure and Degraded Modes

### 45.1 Missing Protocol Approval

Intervention delivery should be blocked or clearly restricted when required approval is missing.

### 45.2 Measurement Failure

The platform should record failed, partial, or invalid assessments without replacing them with inferred values.

### 45.3 Device Failure

Device or sensor failure should preserve the failure event, avoid false data, identify affected periods, and support an approved alternative collection method where available.

### 45.4 AI Failure

If the AI Companion fails:

- research records remain accessible;
- manual workflows continue where possible;
- AI-generated actions are not assumed complete; and
- affected intervention delivery is flagged.

### 45.5 Safety System Failure

Safety-critical monitoring failure may require intervention pause, human review, Participant notification, and documented recovery.

### 45.6 Analysis Failure

Failed analyses should preserve code, input version, error, environment, and attempted resolution.


### 45.7 Dataset Lock Failure

A failed or incomplete lock must preserve quality state, unresolved issues, attempted approval, checksum status, and reason. Analysis must not proceed as governed analysis against an unlocked Dataset Version.

### 45.8 Community, Matching or Moderation Failure

The platform should preserve the affected exposure period, unavailable controls, delayed reports, failed block or messaging actions, moderation backlog, and Participant impact. Safety-critical block and report functions should use deterministic fallback where possible.

### 45.9 Evidence or Knowledge Failure

Historical Evidence Decisions and Evidence Snapshots remain available where permitted. Approvals requiring current evidence may pause according to Document 9 degraded-mode rules.

---

## 46. Conceptual Domain Model

### 46.1 Canonical Aggregate Roots by Owning Context

| Context | Aggregate Roots |
|---|---|
| Research Design and Governance | ResearchProject; ResearchQuestion; Protocol; ProtocolVersion |
| Enrolment and Participation | ScreeningRecord; EligibilityDecision; Enrolment |
| Intervention Portfolio | InterventionDecision |
| Intervention Delivery | InterventionAssignment; InterventionSession |
| Assessment, Observation and Outcome | AssessmentSchedule; AssessmentRecord; Observation; OutcomeRecord |
| Safety and Escalation | SafetySignal; SafetyEvent |
| Dataset and Data Quality | DatasetDefinition; DatasetVersion; DataQualityIssue; TransformationRun |
| Analysis, Interpretation and Findings | AnalysisPlan; AnalysisRun; InterpretationRecord; ResearchFinding |
| Reporting and External Submission | Report; ReportVersion; ExportRequest; ExternalSubmission |

### 46.2 Representative Entities

- ResearchObjective
- Hypothesis
- PopulationDefinition
- EligibilityCriterion
- RecruitmentInvitation
- WithdrawalRecord
- ExposureRecord
- FidelityRecord
- InterventionAdaptationRecord
- AssessmentResponse
- AssessmentScore
- SafetyAction
- SafetyReview
- DatasetLock
- DatasetManifest
- VariableDefinition
- TransformationReference
- AnalysisOutput
- AnalysisDiagnostic
- QualitativeSynthesis
- FindingLimitation
- EvidencePackage
- ExternalPublicationReference

### 46.3 Representative Value Objects

- ResearchProjectPhase
- StudyDesign
- AssignmentMethod
- MeasurementScheduleDefinition
- InstrumentVersionReference
- MeasurementValue
- Timepoint
- MissingDataReason
- QualityFlag
- SafetySeverity
- Seriousness
- Expectedness
- Relatedness
- AnalysisPopulation
- FindingType
- ScientificDirection
- UncertaintyStatement
- GeneralisabilityStatement
- VersionReference

### 46.4 Cross-Context Research References

The framework may reference but does not own:

- EvidenceReview, EvidenceDecision, EvidenceSnapshot and ResearchKnowledgeGap;
- Intervention, InterventionVersion and InterventionConfiguration;
- AIInteraction and AIInterventionConfigurationVersion;
- LifeStoryArchive, LifeStoryItem and LifeStoryContribution;
- CommunitySpace, SocialPost, MatchPreference, MatchCandidate, MatchExplanation, MatchDecision and Connection;
- UserReport, ContentReport, ModerationCase and ModerationDecision;
- Consent, Relationship and PolicyDecision.

### 46.5 Representative Relationships

```text
ResearchProject
    ├── has → ResearchQuestion
    ├── governs through → ProtocolVersion
    ├── enrols through → Enrolment
    ├── assigns through → InterventionAssignment
    ├── generates → DatasetVersion
    ├── analyses through → AnalysisRun
    └── produces → ResearchFinding

ProtocolVersion
    ├── references → EvidenceDecision and EvidenceSnapshot
    ├── configures → InterventionConfiguration
    ├── configures → AIInterventionConfigurationVersion
    ├── defines → EligibilityCriterion
    ├── schedules → AssessmentSchedule
    ├── defines → DatasetDefinition
    └── defines → SafetyMonitoring and Moderation Requirements

ResearchFinding
    ├── addresses → ResearchQuestion
    ├── uses → Approved InterpretationRecord
    ├── traces to → Locked DatasetVersion and AnalysisRun
    └── may inform → InterventionDecision
```

---

## 47. Domain Events

Representative canonical domain events include:

- ResearchProjectCreated
- ResearchProjectSubmittedForReview
- ResearchProjectApproved
- ResearchProjectActivated
- ResearchProjectSuspended
- ResearchProjectCompleted
- ResearchQuestionCreated
- ResearchQuestionApproved
- ProtocolVersionDrafted
- ProtocolVersionSubmittedForReview
- ProtocolVersionApproved
- ProtocolVersionActivated
- ProtocolVersionSuperseded
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
- InterventionAssigned
- InterventionAssignmentActivated
- InterventionAssignmentPaused
- InterventionSessionStarted
- InterventionComponentOffered
- InterventionComponentReceived
- InterventionExposureRecorded
- FidelityRecorded
- DeliveryDeviationRecorded
- AssessmentScheduled
- AssessmentStarted
- AssessmentCompleted
- AssessmentInvalidated
- ObservationRecorded
- OutcomeRecorded
- SafetySignalRecorded
- SafetySignalTriaged
- SafetySignalEscalated
- SafetySignalClosedAsNotEvent
- SafetyEventCreated
- SafetyActionRecorded
- SafetyEventResolved
- DatasetDefinitionCreated
- DatasetDefinitionApproved
- DatasetVersionGenerated
- DatasetQualityReviewCompleted
- DatasetVersionLocked
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
- InterventionDecisionRecorded

`SafetyEventDetected` is deprecated. Automated or AI detection creates a Safety Signal.

---

## 48. Conceptual Service Boundaries

Representative services include:

- ResearchProjectService
- ResearchQuestionService
- ProtocolService
- EligibilityService
- EnrolmentService
- ConsentService
- InterventionAssignmentService
- AssessmentService
- OutcomeService
- SafetySignalService
- SafetyEventReviewService
- LifeStoryEvaluationService
- CommunityEvaluationService
- MatchingEvaluationService
- ModerationEvaluationService
- DataQualityService
- DatasetVersioningService
- AnalysisPlanService
- AnalysisExecutionService
- InterpretationService
- ResearchFindingService
- InterventionDecisionService
- ResearchAuditService

These are logical boundaries and should not be interpreted as mandatory microservices.

---

## 49. Current Conceptual Research Scope

The current scope includes:

- ResearchQuestion and proposition management;
- evidence and source traceability;
- conceptual model and taxonomy development;
- mechanism and causal-chain representation;
- intervention concept modelling;
- domain aggregates, invariants and events;
- synthetic personas and scenarios;
- synthetic datasets;
- simulations and sensitivity analysis;
- non-production reference prototypes;
- AI-assisted Drafting under explicit provenance;
- theoretical accessibility, privacy, social-safety and failure analysis;
- and research finding and model-revision records.

The current scope excludes:

- real Participant recruitment;
- identifiable or private human-subject data;
- clinical intervention delivery;
- production deployment;
- institutional claims;
- and empirical effectiveness claims.

## 50. Deferred Capabilities

Deferred capabilities may include:

- advanced randomisation;
- adaptive trials;
- micro-randomised trials;
- automated sample-size planning;
- advanced statistical modelling;
- federated analytics;
- external ethics-system integration;
- multi-site study coordination;
- remote source-data verification;
- advanced qualitative coding;
- automated mixed-method integration;
- causal inference tooling;
- digital biomarker validation;
- real-time safety signal detection;
- advanced cost-effectiveness analysis;
- regulatory submission workflows; and
- public trial registry integration.

---

## 51. Future Evolution

Future versions may support:

- living Protocols with governed adaptation;
- decentralised studies;
- federated research networks;
- digital twin research models;
- adaptive intervention optimisation;
- just-in-time adaptive interventions;
- multi-modal outcome modelling;
- longitudinal Healthy Aging trajectories;
- cross-study meta-analysis;
- automated reproducibility packages;
- Participant-owned research data spaces;
- consent-aware secondary research;
- AI-assisted Protocol simulation; and
- research observatories across populations and jurisdictions.

Future automation must preserve accountable human review.

---

## 52. Design Decisions

This document establishes that:

1. Document 11 is the authoritative Handbook source for Research Platform research and evaluation workflow.
2. The Research Platform is organised around Research Questions, Evidence Decisions, Protocol Versions, Participants, interventions, measurements, datasets, analyses, interpretations and Research Findings.
3. Research Project lifecycle and operational phase are separate.
4. The canonical Research Project lifecycle is Draft, In Review, Approved, Active, Completed and Archived, with Suspended and Cancelled branches.
5. Research Question state uses Draft, In Review, Approved, Closed, Superseded and Archived.
6. Protocol Version state uses Draft, In Review, Approved, Active, Suspended, Superseded, Archived and Rejected.
7. External ethics and governance reviews remain separate Approval Records.
8. Protocols and intervention configurations are versioned and cannot be silently changed.
9. Enrolment state is distinct from consent, assignment and intervention exposure.
10. Supporter assistance does not change whose decision or response is recorded.
11. Eligibility does not rely on hidden AI or interface-based capacity inference.
12. Intervention Assignment references exact Protocol, Intervention and AI configuration versions.
13. Assignment, exposure, delivery, fidelity, adaptation and outcome are separate.
14. Canonical exposure states are Offered, Viewed, Started, Partially Received, Completed, Skipped, Declined, Failed and Interrupted.
15. Dose is Protocol-specific and not automatically benefit.
16. Features are not evaluated as interventions unless purpose, component, mechanism, outcome and Research Question are explicit.
17. Process, engagement, experience, implementation, proximal, Healthy Aging, burden, harm, accessibility, equity and sustainability outcomes remain distinct.
18. Platform, Community, matching and AI activity counts are process or exposure measures, not Healthy Aging outcomes by themselves.
19. Life Story item count is not identity continuity or cognitive benefit.
20. Participant Testimony is distinct from verified historical fact.
21. A Life Story Item is not automatically qualitative research data.
22. Public or Community sharing does not automatically authorise research use, AI training, quotation or external publication.
23. A Match Candidate is not a Connection.
24. A Connection is not automatically a Supporter relationship or relationship-quality outcome.
25. Mutual Acceptance compliance is a required matching-fidelity measure.
26. Open Matching evaluation includes explanation, fairness, rejection burden, privacy, fraud, block and safety.
27. Community evaluation includes meaningful participation, public exposure, moderation, harassment, scams, misinformation, accessibility and dependency risk.
28. Moderation evaluation includes report access, triage, action, false decisions, appeal, restoration, equity and moderator burden.
29. User Reports, Moderation Cases, Privacy Reviews, Safety Signals, Safety Events, AI Incidents and technical incidents remain distinct.
30. AI or automation creates a Safety Signal, not a confirmed Safety Event.
31. Safety Event confirmation and closure require authorised human review.
32. Accessibility is part of intervention validity, not only interface compliance.
33. Ability adaptation is recorded and evaluated for measurement equivalence and intervention fidelity.
34. Sensitive inference cannot silently change eligibility, rights, consent, matching, measurement or subgroup classification.
35. Measurement follows Research Question, Construct, Operational Definition, Measurement, Measurement Version, Timepoint, Source and Interpretation Rule.
36. Measurement Version, scoring algorithm, language, mode, assistance and adaptation are traceable.
37. Assessment state uses the canonical state registry.
38. Observed, reported, inferred, AI-derived and human-approved information remain distinguishable.
39. DatasetDefinition is approved before governed DatasetVersion generation.
40. DatasetVersion preserves exact source lineage.
41. DatasetLock is an entity and governed milestone, not a separate research aggregate.
42. A locked Dataset Version is immutable; correction creates a new Dataset Version.
43. AI may assist data quality but cannot lock a Dataset Version.
44. AnalysisPlan is approved before governed analysis.
45. AnalysisRun references an exact approved Analysis Plan and locked Dataset Version.
46. AnalysisOutput is not an Interpretation Record or Research Finding.
47. Interpretation is human-accountable and separately approved.
48. Research Finding state excludes external submission and publication states.
49. Null, negative, mixed, harmful and failed findings are retained.
50. Research Findings remain specific to population, context, exact versions, outcome, timeframe, uncertainty and limitations.
51. External submission does not silently rewrite a Research Finding.
52. Intervention Decisions use Retain, Revise, Restrict, Replicate, Expand, Suspend, Retire and Continue Exploratory Research.
53. Participant burden and withdrawal experience are research outcomes.
54. AI configuration is part of the intervention when it materially affects delivery or measurement.
55. AI evaluation covers grounding, tools, memory, Life Story, Community, matching, moderation, safety, accessibility and human oversight.
56. AI output remains distinguishable from observations, testimony, moderator decisions and research outcomes.
57. Controlled deployment requires evidence, safety, accessibility, moderation, matching, privacy, data-quality and implementation readiness.
58. The expanded MVP includes Life Story, Community, Open Matching, Connections and moderation evaluation.
59. No automated process may approve a Protocol, Dataset Lock, Analysis Plan, Interpretation Record, Research Finding, Safety Event or high-impact Moderation Decision.

---

## 53. Summary

The Research & Evaluation Framework now supports two clearly separated layers:

```text
Current Layer
Conceptual Analysis + Formal Modelling + Synthetic Simulation + Prototype Experiments

Future Optional Layer
Human-Subject Empirical Study + Operational Deployment
```

The current project begins immediately in the first layer.

Its central research rule is:

> A theoretical result must be explicit about its source, assumptions, inferential status, synthetic evidence and unresolved empirical questions.

No external approval is required to perform the current conceptual work. External processes become relevant only if a separate future project introduces real people, private data or operational intervention delivery.
