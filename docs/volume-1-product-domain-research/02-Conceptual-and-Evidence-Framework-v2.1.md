# Document 2 — Conceptual & Evidence Framework

**Version:** 2.1  
**Status:** Revised Conceptual Baseline  
**Handbook Volume:** Volume I — Product, Domain & Research Architecture  
**Primary System:** Digital Intervention Research Platform  
**Document Owner:** Research and Evidence Governance  
**Approved By:** To be assigned  
**Last Updated:** 2026-07-29  
**Supersedes:** Document 2 — Conceptual and Evidence Framework v2.0  
**Review Trigger:** A material change to the Healthy Aging conceptual model, theory model, causal model, evidence appraisal, intervention-domain taxonomy, outcome framework, measurement logic, Knowledge Platform boundary, or AI-assisted evidence rules

---

## 1. Purpose

This document defines the conceptual, theoretical, evidence, causal, outcome, and measurement framework underlying the **Healthy Aging Digital Intervention Research Platform**.

It establishes how the platform connects:

```text
Healthy Aging Challenge
        ↓
Population and Context
        ↓
Evidence and Theory
        ↓
Evidence Decision
        ↓
Intervention
        ↓
Mechanism
        ↓
Engagement and Behavioural or Social Change
        ↓
Outcomes, Burden, Harm, and Implementation
        ↓
Measurement and Evaluation
        ↓
Research Finding
        ↓
Knowledge Improvement
```

The framework guides:

- Research Question development;
- evidence retrieval;
- Evidence Decisions;
- intervention design;
- mechanism specification;
- product development;
- Protocol design;
- outcome selection;
- measurement selection;
- accessibility and equity analysis;
- safety analysis;
- evaluation;
- interpretation;
- Knowledge Gap identification;
- AI-assisted research;
- and external knowledge submission.

The central rule is:

> Every material intervention claim must be traceable to a defined challenge, population, context, evidence or theory basis, mechanism, intended outcome, measurement strategy, risk, safeguard, and evaluation pathway.

Where a link is uncertain, indirect, contested, or unsupported, the uncertainty must be represented explicitly.

---

## 2. Scope

This document covers:

- Healthy Aging conceptual foundations;
- challenge and problem definition;
- population and context;
- theory;
- evidence;
- evidence appraisal;
- Evidence Decisions;
- Knowledge References;
- causal pathways;
- intervention domains;
- mechanisms;
- engagement;
- mediators and moderators;
- proximal and distal outcomes;
- process and implementation outcomes;
- burden and harm;
- accessibility;
- equity;
- measurement;
- Knowledge Gaps;
- research feedback;
- AI-assisted evidence use;
- and conceptual traceability.

This document does not define:

- the complete intervention portfolio;
- final Evidence Decision workflow;
- final Protocol;
- final measurement instruments;
- final statistical analysis methods;
- final AI prompts;
- final Knowledge Platform ontology;
- or final technical implementation.

Those are defined in later documents and project-specific artefacts.

---

## 3. Relationship to Other Documents

### Depends on

- Document 0 — Platform Ecosystem Architecture
- Document 1 — Project Definition & Vision

### Provides input to

- Document 3 — Intervention Map
- Document 4 — User Roles & Permission Model
- Document 5 — Ability-Adaptive UX Principles
- Document 6 — Core Product Modules
- Document 7 — Information Architecture
- Document 8 — Core Domain Model & Ubiquitous Language
- Document 9 — Evidence & Knowledge Integration Architecture
- Document 10 — AI Companion Architecture
- Document 11 — Research & Evaluation Framework
- Document 12 — Data & Interoperability Architecture
- Documents 13–17 — Technical Architecture
- Documents 18–20 — MVP, Pilot Protocol, and UX Implementation

Document 0 remains authoritative for ecosystem boundaries.

Document 1 remains authoritative for project purpose and scope.

Document 3 remains authoritative for intervention records, intervention lifecycle, and Intervention Evidence Status.

Document 9 remains authoritative for Research Platform evidence-integration workflows.

---

## 4. Core Conceptual Model

The platform uses the following conceptual sequence:

```text
Healthy Aging Challenge
        ↓
Problem Definition
        ↓
Target Population and Context
        ↓
Theory and Evidence
        ↓
Evidence Decision
        ↓
Intervention Design
        ↓
Mechanism of Action
        ↓
Intervention Exposure
        ↓
Engagement and Experience
        ↓
Behavioural, Social, or Environmental Change
        ↓
Proximal Outcome
        ↓
Healthy Aging Outcome
        ↓
Burden, Harm, Accessibility, Equity, and Implementation
        ↓
Evaluation
        ↓
Research Finding
        ↓
Intervention Decision and Knowledge Improvement
```

A digital feature is not automatically an intervention.

A feature becomes an intervention component only when its:

- purpose;
- target population;
- context;
- mechanism;
- expected outcome;
- risk;
- and evaluation role

are explicitly defined.

---

## 5. Conceptual Traceability Contract

Every material claim or product decision should support the following traceability:

```text
Claim or Product Decision
        ↓
Healthy Aging Challenge
        ↓
Population and Context
        ↓
Theory and Evidence
        ↓
Evidence Decision
        ↓
Intervention and Mechanism
        ↓
Outcome and Measurement
        ↓
Risk, Burden, Safeguard, and Equity
        ↓
Evaluation and Research Finding
```

The platform should not silently infer a missing link.

A missing link should become one of:

- an explicit assumption;
- a Knowledge Gap;
- a Research Question;
- a design constraint;
- a safety restriction;
- or a reason not to proceed.

---

## 6. Canonical Concept Definitions

## 6.1 Healthy Aging Challenge

A condition, barrier, transition, or unmet need that may affect a person's ability to live a meaningful, connected, participatory, and self-directed later life.

## 6.2 Problem Definition

A bounded and researchable statement of the challenge for a defined population and context.

## 6.3 Population

The people to whom an intervention, evidence claim, or Research Finding applies.

Population should not be defined by chronological age alone.

## 6.4 Context

The social, physical, cultural, organisational, technological, temporal, and policy conditions in which an intervention operates.

## 6.5 Feature

A product capability or interface element.

A feature has no inherent intervention status.

## 6.6 Intervention

A deliberately designed activity, service, interaction, environmental modification, or coordinated set of components intended to influence one or more mechanisms and contribute to meaningful outcomes for a specified population and context.

## 6.7 Intervention Component

A discrete activity or system behaviour that contributes to an intervention.

## 6.8 Mechanism

A process through which an intervention may produce change.

## 6.9 Mediator

A variable or process through which an intervention may influence an outcome.

## 6.10 Moderator

A factor that may change the direction, magnitude, feasibility, or meaning of an intervention effect.

## 6.11 Intervention Exposure

The extent to which a Participant is offered, starts, receives, completes, or experiences an intervention component.

## 6.12 Engagement

The Participant's behavioural, cognitive, emotional, or social involvement with an intervention.

Engagement is not automatically benefit.

## 6.13 Process Outcome

A measure of whether and how the intervention was delivered or used.

## 6.14 Proximal Outcome

A near-term change expected to occur close to the intervention mechanism.

## 6.15 Healthy Aging Outcome

A broader outcome related to functional ability, participation, relationships, identity, autonomy, meaning, well-being, or another approved Healthy Aging objective.

## 6.16 Implementation Outcome

A measure of whether the intervention can be adopted, delivered, sustained, and integrated in a real setting.

## 6.17 Burden

The time, effort, fatigue, frustration, cognitive load, emotional discomfort, digital difficulty, or support requirement created by participation.

## 6.18 Harm

A negative effect plausibly associated with the intervention, platform, research process, AI behaviour, relationship, or data use.

## 6.19 Measurement

A defined method for observing or estimating a construct, process, outcome, burden, or harm.

## 6.20 Theory

A structured explanation of relationships among concepts.

Theory supports plausibility but does not prove that a specific intervention works.

## 6.21 Evidence

Information derived from research, observation, guidance, experience, or analysis that may support or challenge a claim.

## 6.22 Knowledge Reference

A versioned Research Platform reference to an authoritative external Knowledge Platform record.

## 6.23 Evidence Decision

A human-accountable Research Platform decision about how a body of evidence applies to a specific:

- population;
- context;
- intervention;
- mechanism;
- outcome;
- measurement;
- Protocol;
- or Research Question.

## 6.24 Knowledge Gap

A material uncertainty or missing evidence relationship that affects design, interpretation, safety, or research priorities.

## 6.25 Research Finding

A human-approved conclusion derived from a defined Research Question, Protocol Version, Intervention Version, Dataset Version, Analysis Plan, and interpretation.

## 6.26 Knowledge Publication

The external Knowledge Platform process through which accepted knowledge is curated and governed.

A Research Finding does not automatically become published knowledge.

---

## 7. Healthy Aging Context

The platform focuses on challenges that may affect a person's ability to be and do what they value.

These challenges may interact and should not be assumed to occur independently.

---

## 8. Social and Relationship Challenges

Representative challenges include:

- unwanted loneliness;
- social isolation;
- loss of relationships;
- reduced relationship quality;
- reduced reciprocal interaction;
- reduced community participation;
- loss of valued social roles;
- difficulty initiating contact;
- difficulty maintaining contact;
- geographic separation;
- and reduced opportunity for meaningful human interaction.

The platform should distinguish:

- objective social isolation;
- perceived loneliness;
- relationship dissatisfaction;
- limited participation;
- and preferred solitude.

These concepts should not be treated as equivalent.

---

## 9. Identity, Meaning, and Emotional Challenges

Representative challenges include:

- loss of purpose;
- reduced sense of belonging;
- identity disruption;
- reduced opportunity for self-expression;
- reduced opportunity for contribution;
- boredom;
- grief;
- life transition;
- reduced recognition by others;
- and emotional distress.

The platform should not diagnose a mental-health condition merely because a Participant reports:

- loneliness;
- sadness;
- boredom;
- loss;
- or reduced motivation.

---

## 10. Functional and Participation Challenges

Representative challenges include:

- reduced mobility;
- sensory change;
- cognitive load;
- communication difficulty;
- fatigue;
- reduced access to valued activities;
- reduced confidence;
- inaccessible physical or digital environments;
- and dependence on others for access.

The platform should not assume that a change in ability means loss of autonomy.

---

## 11. Life Transition Challenges

Representative transitions include:

- retirement;
- bereavement;
- relocation;
- migration;
- change in living environment;
- transition to assisted living;
- transition to residential or long-term care;
- change in family role;
- change in caregiving arrangement;
- and loss of familiar routine.

A transition may create both:

- risk;
- and opportunity.

---

## 12. Intergenerational Challenges

Representative challenges include:

- physical separation from family;
- reduced shared activity;
- loss of shared family stories;
- difficulty communicating across generations;
- technological barriers;
- and risk of personal history being lost or controlled by others.

Intergenerational intervention should remain reciprocal rather than treating the older adult only as a source of memories or data.

---

## 13. Digital and Environmental Challenges

Technology may support functional ability, but it may also create barriers.

Representative barriers include:

- inaccessible authentication;
- small text;
- low contrast;
- complex navigation;
- excessive choice;
- rapid timing;
- unclear error recovery;
- lack of device access;
- poor connectivity;
- unfamiliar terminology;
- inaccessible media;
- privacy concerns;
- and lack of human support.

A digital intervention should be evaluated as part of the environment.

---

## 14. Healthy Aging and Functional Ability

The platform aligns conceptually with a Healthy Aging model in which functional ability emerges from the interaction between a person and their environment.

```text
Intrinsic Capacities
        +
Social, Physical, Service, and Digital Environment
        ↓
Person–Environment Interaction
        ↓
Functional Ability
        ↓
Ability to Be and Do What the Person Values
```

The platform primarily treats digital intervention as an environmental and interactional influence.

It must not claim that an interface improves functional ability merely because:

- task speed improves;
- clicks decrease;
- completion increases;
- or the interface becomes easier to use.

The relevant causal pathway and outcome must be defined and evaluated.

---

## 15. Intrinsic Capacity and Ability Dimensions

Relevant dimensions may include:

- cognitive capacity;
- psychological capacity;
- sensory capacity;
- locomotor capacity;
- vitality;
- communication ability;
- language;
- and other functional characteristics.

The platform should not diagnose or rank these capacities without an approved purpose, method, consent basis, and governance model.

---

## 16. Environment Dimensions

The environment may include:

- family;
- friends;
- community;
- care setting;
- housing;
- transport;
- social expectations;
- services;
- technology;
- policy;
- culture;
- language;
- and economic conditions.

A digital intervention may fail because the environment does not support the intended mechanism.

---

## 17. Theory as a Foundation

Theory is used to explain why an intervention may affect a mechanism or outcome.

A theory should not be treated as proof that a particular digital implementation is effective.

The Knowledge Platform may represent theories and models such as:

- Self-Determination Theory;
- Socioemotional Selectivity Theory;
- Continuity Theory;
- Activity Theory;
- Selective Optimisation with Compensation;
- reminiscence and narrative-identity theories;
- social-support and social-capital models;
- behaviour-change frameworks;
- technology-acceptance models;
- digital-inclusion models;
- and person–environment fit models.

A theory should be used only when its:

- source;
- concepts;
- scope;
- population;
- context;
- relevance;
- and limitations

are recorded.

---

## 18. Theory, Mechanism, and Evidence Are Distinct

The platform should distinguish:

1. a theory explaining a general phenomenon;
2. a theory-informed intervention hypothesis;
3. empirical evidence for a mechanism;
4. empirical evidence for an intervention;
5. evidence for a specific digital delivery method;
6. evidence for a specific population and setting;
7. and local evidence from the Research Platform.

A proposed causal pathway may contain different confidence levels at different links.

```text
Theory
    └── proposes → Mechanism
                       └── may explain → Intervention Effect
                                             └── requires → Empirical Evaluation
```

---

## 19. Evidence-Informed Rather Than Evidence-Branded

The guiding principle is:

> Evidence should inform intervention design, but weak, mixed, indirect, absent, or conflicting evidence must remain visible.

The platform should distinguish:

- established evidence;
- emerging evidence;
- indirect evidence;
- theoretical rationale;
- plausible but untested mechanism;
- local exploratory evidence;
- Knowledge Gap;
- unsupported assumption;
- and evidence of burden or harm.

No intervention should be described as evidence-based merely because it:

- uses AI;
- uses a validated measurement;
- resembles another intervention;
- uses clinical language;
- or references a theory.

---

## 20. Evidence Types

Potential evidence types include:

- systematic reviews;
- meta-analyses;
- randomised trials;
- controlled trials;
- quasi-experimental studies;
- longitudinal studies;
- observational studies;
- mechanism studies;
- qualitative studies;
- mixed-method studies;
- feasibility studies;
- usability studies;
- accessibility studies;
- implementation studies;
- safety studies;
- guidelines;
- expert consensus;
- co-design findings;
- lived-experience evidence;
- local exploratory findings;
- and theoretical literature.

Evidence type does not alone determine relevance or certainty.

---

## 21. Fit-for-Purpose Evidence Appraisal

Different evidence types answer different questions.

| Question | Particularly Relevant Evidence |
|---|---|
| Does the intervention affect an outcome? | Controlled, quasi-experimental, longitudinal, and synthesis evidence |
| How might it work? | Theory, mechanism, qualitative, realist, and mixed-method evidence |
| Is it meaningful or acceptable? | Qualitative, co-design, lived-experience, and acceptability evidence |
| Can it be delivered? | Feasibility, implementation, workflow, and operational evidence |
| Is it accessible? | Accessibility, HCI, assistive-technology, and usability evidence |
| Is it safe? | Safety studies, adverse-event reports, qualitative evidence, and governance analysis |
| For whom and under which conditions? | Subgroup, contextual, equity-focused, and realist evidence |
| Which measure is appropriate? | Measurement-property, validation, licensing, burden, and population-fit evidence |
| Can it be sustained? | Implementation, cost, organisational, and long-term follow-up evidence |

The platform should not convert a generic evidence hierarchy into an automated claim of effectiveness.

---

## 22. Evidence Appraisal Dimensions

Evidence appraisal should consider:

- methodological quality;
- risk of bias;
- directness;
- consistency;
- magnitude;
- precision;
- population fit;
- context fit;
- mechanism fit;
- intervention-component fit;
- digital-modality fit;
- comparator fit;
- outcome fit;
- measurement fit;
- implementation setting;
- follow-up duration;
- reported burden;
- reported harm;
- accessibility;
- equity;
- exclusion;
- recency;
- transferability;
- conflicts of interest;
- and publication bias where known.

---

## 23. Direct and Indirect Evidence

### Direct Evidence

Evidence closely matches the proposed:

- population;
- intervention;
- mechanism;
- delivery;
- setting;
- and outcome.

### Indirect Evidence

Evidence differs materially in one or more of those dimensions.

Indirect evidence may still be useful, but the difference should be explicit.

---

## 24. Positive, Null, Negative, Mixed, and Harmful Evidence

The platform must preserve:

- beneficial findings;
- null findings;
- negative findings;
- mixed findings;
- harmful findings;
- implementation failure;
- and inconclusive findings.

Evidence should not be selected only because it supports a proposed feature.

---

## 25. Absence of Evidence

The platform must distinguish:

```text
No Evidence Found
```

from:

```text
Evidence of No Effect
```

and from:

```text
Evidence of Harm
```

These are different states.

---

## 26. Evidence Decision

An Evidence Decision interprets a body of evidence for a defined Research Platform purpose.

It should identify:

- Research Question;
- population;
- context;
- intervention;
- mechanism;
- outcome;
- measurement;
- Knowledge References;
- directness;
- limitations;
- uncertainty;
- burden;
- harm;
- equity;
- applicability;
- decision;
- reviewer;
- approver;
- and effective version.

An Evidence Decision may conclude:

- Support;
- Support with Conditions;
- Insufficient Evidence;
- Conflicting Evidence;
- Restrict;
- Do Not Proceed;
- or Research Required.

The AI Companion may assist drafting.

An authorised human must own the decision.

---

## 27. Evidence Decision Is Not External Knowledge

An Evidence Decision is owned by the Research Platform.

It does not:

- modify the external evidence source;
- become an authoritative Knowledge Platform record;
- change ontology;
- or publish a scientific conclusion externally.

---

## 28. Knowledge Platform Boundary

The **Healthy Aging Knowledge Platform** is an independent authoritative system.

It owns:

- evidence records;
- theories;
- mechanisms;
- outcome definitions;
- measurement definitions;
- provenance;
- ontology;
- terminology;
- Knowledge Gaps;
- and external knowledge governance.

The **Digital Intervention Research Platform** owns:

- Knowledge References;
- Evidence Decisions;
- Evidence Snapshots;
- Research Questions;
- Protocols;
- Interventions;
- Participants;
- evaluation;
- and Research Findings.

The Research Platform contains an internal **Evidence and Knowledge Integration capability**.

It does not contain or own the external Knowledge Platform itself.

---

## 29. Healthy Aging Knowledge Graph Position

The Healthy Aging Knowledge Graph is a capability inside the Knowledge Platform.

It may represent structured relationships among:

- concepts;
- theories;
- mechanisms;
- populations;
- contexts;
- interventions;
- outcomes;
- measurements;
- risks;
- guidelines;
- evidence;
- and Knowledge Gaps.

The Knowledge Graph is not the complete Knowledge Platform.

---

## 30. Conceptual Knowledge Relationships

A representative relationship model is:

```text
Theory
    ├── proposes → Mechanism
    ├── applies to → Context
    └── is supported or challenged by → Evidence

Intervention
    ├── targets → Healthy Aging Challenge
    ├── applies to → Population
    ├── operates through → Mechanism
    ├── contains → Intervention Component
    ├── may affect → Outcome
    ├── creates → Burden or Harm
    └── is evaluated by → Measurement

Measurement
    ├── estimates → Construct
    ├── applies to → Population and Context
    └── has → Measurement Properties
```

---

## 31. Knowledge Access

The Knowledge Platform should expose governed capabilities through stable interfaces such as:

- MCP;
- REST;
- semantic search;
- and versioned retrieval services.

The intended direction is:

```text
Researcher or AI Companion
        ↓
Research Platform Evidence Integration
        ↓
Governed MCP or REST Request
        ↓
Healthy Aging Knowledge Platform
        ↓
Evidence, Theory, Mechanisms, Outcomes, and Measurements
```

The Research Platform should not bypass the integration boundary and query uncontrolled Knowledge Platform storage directly.

---

## 32. Knowledge Query Examples

The ecosystem should support questions such as:

- Which theories are relevant to this challenge?
- Which mechanisms may explain the intervention?
- Which interventions have been studied?
- Which populations and settings were included?
- Which outcomes were measured?
- Which measurements are appropriate?
- Which burdens or harms were reported?
- Which findings are direct or indirect?
- Which evidence conflicts?
- Which Knowledge Gaps remain?
- What changed since the Evidence Snapshot was approved?

---

## 33. AI-Assisted Evidence Principles

The AI Companion may support:

- query formulation;
- evidence retrieval;
- source comparison;
- structured extraction;
- evidence-table drafting;
- Evidence Decision drafting;
- mechanism-map drafting;
- and plain-language explanation.

AI-assisted evidence workflows should follow:

```text
Research Question or Design Decision
        ↓
Permission and Purpose Check
        ↓
Structured Knowledge Query
        ↓
Knowledge Platform and Approved Sources
        ↓
Evidence, Theory, Population, Context, and Provenance
        ↓
Bounded Synthesis with Uncertainty
        ↓
Human Review and Evidence Decision
```

---

## 34. AI Evidence Rules

The AI Companion must:

- retrieve before asserting where grounding is required;
- preserve source and version;
- distinguish source content from AI inference;
- distinguish direct from indirect evidence;
- represent conflicting, mixed, null, and insufficient evidence;
- avoid fabricated citations;
- avoid fabricated theories or measurements;
- avoid unsupported effect claims;
- report retrieval failure;
- identify uncertainty;
- respect licensing;
- respect privacy;
- respect Research Project scope;
- respect Participant consent where Participant data are used;
- and preserve an auditable rationale.

The AI Companion must not:

- independently approve an Evidence Decision;
- upgrade Intervention Evidence Status;
- approve a health claim;
- determine decision-making capacity;
- approve a Protocol;
- approve a Research Finding;
- or publish knowledge.

---

## 35. Permission Foundation for Evidence Work

Sensitive evidence or Participant-context access should use:

```text
Role
+ Relationship
+ Consent
+ Purpose
+ Context
+ Specific Permission
+ Resource State
```

Examples:

- public evidence retrieval may not require Participant consent;
- Participant-specific applicability analysis may require consent and project scope;
- restricted Evidence Decisions may require an assigned Research Project role;
- approved Evidence Decisions may be immutable;
- and external submission may require separate approval.

Document 4 remains authoritative for permission details.

---

## 36. Canonical Intervention Domains

Document 3 is authoritative for intervention definitions.

The conceptual framework uses seven domains:

1. **Social Connection**
2. **AI Companion**
3. **Identity and Life Story**
4. **Meaningful Engagement**
5. **Agency and Autonomy**
6. **Family and Care Network**
7. **Ability-Adaptive Access**

These domains may overlap.

An intervention may have:

- one primary domain;
- and multiple secondary domains.

---

## 37. Social Connection Domain

Potential intervention components include:

- structured human interaction;
- interest-based connection;
- reciprocal exchange;
- relationship maintenance;
- community participation;
- facilitated introduction;
- and shared activity.

Potential mechanisms include:

- increased opportunity;
- reciprocity;
- recognition;
- belonging;
- shared identity;
- social participation;
- and reduced initiation burden.

Potential outcomes include:

- perceived social connectedness;
- reduced unwanted loneliness;
- relationship quality;
- social participation;
- and confidence initiating contact.

---

## 38. AI Companion Domain

The AI Companion may support:

- explanation;
- navigation;
- preparation;
- activity discovery;
- message drafting;
- reflection;
- encouragement;
- accessibility;
- and facilitation of human connection.

Potential mechanisms include:

- reduced cognitive burden;
- reduced initiation burden;
- increased clarity;
- increased confidence;
- improved access;
- and improved preparation.

The AI Companion should not be treated as:

- a human relationship;
- a mental-health treatment;
- a clinical authority;
- or evidence of benefit merely because users converse with it.

---

## 39. Identity and Life Story Domain

Potential components include:

- story creation;
- photo annotation;
- life-event recording;
- personal archive;
- selective sharing;
- intergenerational exchange;
- and identity expression.

Potential mechanisms include:

- identity continuity;
- recognition;
- self-expression;
- meaning;
- reminiscence;
- continuity across transition;
- and contribution.

Life Story interventions are not automatically cognitive testing or cognitive training.

---

## 40. Meaningful Engagement Domain

Potential components include:

- music;
- games;
- learning;
- creative activities;
- movement;
- personal projects;
- interest-based activity;
- contribution;
- and community activity.

Potential mechanisms include:

- curiosity;
- mastery;
- enjoyment;
- purpose;
- creativity;
- social interaction;
- and participation in valued activity.

High engagement does not prove meaningful benefit.

---

## 41. Agency and Autonomy Domain

Potential components include:

- choice;
- permission management;
- preference control;
- data correction;
- activity refusal;
- pause;
- withdrawal;
- and Participant-controlled sharing.

Potential mechanisms include:

- self-determination;
- perceived control;
- confidence;
- reduced coercion;
- and trust.

Autonomy may itself be an outcome and a safeguard.

---

## 42. Family and Care Network Domain

Potential relationships include:

- family;
- friends;
- informal caregivers;
- Professional Caregivers;
- community volunteers;
- and trusted Supporters.

Potential mechanisms include:

- communication;
- continuity;
- mutual understanding;
- practical support;
- recognition;
- and coordinated participation.

Relationship status does not create permission.

Access remains governed by:

```text
Role
+ Relationship
+ Consent
+ Purpose
+ Context
+ Specific Permission
+ Resource State
```

---

## 43. Ability-Adaptive Access Domain

Potential components include:

- text scaling;
- contrast;
- audio;
- speech input;
- pacing;
- step-by-step mode;
- reduced-content mode;
- simplified language;
- large controls;
- alternative input;
- supporter-assisted mode;
- and low-stimulation presentation.

Potential mechanisms include:

- reduced accessibility barrier;
- reduced cognitive load;
- improved comprehension;
- increased confidence;
- increased independent completion;
- and reduced abandonment.

Adaptation changes presentation and support.

It does not change:

- consent meaning;
- rights;
- permissions;
- Protocol;
- intervention purpose;
- outcome definition;
- or scientific claim.

---

## 44. Mechanism of Action Framework

The platform should explicitly model the process through which an intervention may contribute to change.

A representative mechanism chain is:

```text
Intervention Component
        ↓
Immediate Participant Experience
        ↓
Mechanism Activation
        ↓
Behavioural, Social, or Environmental Change
        ↓
Proximal Outcome
        ↓
Healthy Aging Outcome
```

The mechanism should not be inferred from the feature name.

---

## 45. Opportunity and Access Mechanisms

An intervention may increase:

- opportunity for contact;
- access to activity;
- access to information;
- access to assistance;
- or access to a preferred relationship.

Opportunity does not guarantee participation.

---

## 46. Burden-Reduction Mechanisms

An intervention may reduce:

- cognitive burden;
- initiation burden;
- navigation burden;
- communication burden;
- memory demand;
- physical effort;
- or uncertainty.

Burden reduction should be measured rather than assumed.

---

## 47. Social Connectedness Mechanisms

Potential mechanisms include:

- reciprocity;
- recognition;
- repeated contact;
- responsiveness;
- belonging;
- trust;
- shared interest;
- and mutual contribution.

A message sent is not equivalent to social connectedness.

---

## 48. Meaning and Purpose Mechanisms

Potential pathways include:

- contribution;
- helping others;
- sharing knowledge;
- creating something;
- telling one's story;
- participating in community;
- and pursuing a valued goal.

Meaning should not be inferred from completion alone.

---

## 49. Identity Continuity Mechanisms

Potential mechanisms include:

- self-expression;
- personal narrative;
- continuity across transition;
- recognition by others;
- control over representation;
- and preservation of valued memories.

Identity data require Participant control and selective sharing.

---

## 50. Autonomy and Agency Mechanisms

Potential mechanisms include:

- real choice;
- understandable options;
- control over information;
- control over relationships;
- ability to refuse;
- ability to correct;
- and ability to withdraw.

More options do not automatically create more autonomy.

Excessive or confusing options may reduce autonomy.

---

## 51. Emotional Support Mechanisms

The AI Companion or another intervention component may provide:

- acknowledgement;
- encouragement;
- supportive explanation;
- reflection;
- and guidance toward human support.

This should not be described as clinical mental-health treatment unless the intervention has appropriate evidence, professional authority, consent, safety governance, and evaluation.

---

## 52. Mediators

Potential mediators include:

- engagement;
- confidence;
- self-efficacy;
- perceived control;
- relationship responsiveness;
- intervention exposure;
- reduced burden;
- increased opportunity;
- and perceived relevance.

A mediator should be measured when it is central to the causal claim.

---

## 53. Moderators

Potential moderators include:

- digital literacy;
- sensory ability;
- motor ability;
- communication ability;
- cognitive load;
- language;
- culture;
- living setting;
- relationship availability;
- baseline loneliness;
- baseline confidence;
- support availability;
- device access;
- and intervention fidelity.

Moderators should not become hidden exclusion rules.

---

## 54. Digital Engagement as a Mediator

Digital engagement is important, but it is not the final outcome.

```text
Digital Intervention Exposure
        ↓
Meaningful Engagement
        ↓
Behavioural, Social, or Environmental Change
        ↓
Proximal Outcome
        ↓
Healthy Aging Outcome
```

For example:

```text
Structured Connection Activity
        ↓
Participant Prepares and Participates
        ↓
Meaningful Human Interaction
        ↓
Greater Confidence and Perceived Connection
        ↓
Potential Broader Participation or Well-being
```

The platform should not optimise exclusively for:

- session duration;
- app-opening frequency;
- clicks;
- message count;
- streaks;
- or AI conversation length.

---

## 55. Intervention Exposure Model

Exposure states may include:

- Offered;
- Viewed;
- Started;
- Partially Received;
- Completed;
- Skipped;
- Declined;
- Failed;
- or Interrupted.

The platform should distinguish:

- intervention offered;
- intervention received;
- and intervention completed.

---

## 56. Fidelity

Fidelity concerns whether the intervention was delivered as intended.

It may include:

- correct Intervention Version;
- correct Protocol Version;
- required component offered;
- approved adaptation range;
- approved AI configuration;
- correct dose;
- confirmation performed;
- and safeguard applied.

Low fidelity may explain an absent outcome.

---

## 57. Outcome Framework

The platform should distinguish multiple levels of outcome.

```text
Implementation and Process
        ↓
Engagement and Experience
        ↓
Proximal Outcomes
        ↓
Healthy Aging Outcomes
```

Burden, harm, accessibility, equity, and sustainability should be evaluated across all levels.

---

## 58. Implementation Outcomes

Examples include:

- feasibility;
- acceptability;
- adoption;
- appropriateness;
- fidelity;
- reach;
- cost;
- support requirement;
- sustainability;
- and operational reliability.

Implementation success is not the same as Participant benefit.

---

## 59. Process Outcomes

Examples include:

- invitation accepted;
- consent completed;
- assessment completed;
- intervention offered;
- intervention started;
- human interaction completed;
- adaptation used;
- supporter involved;
- reminder used;
- and follow-up completed.

---

## 60. Engagement and Experience Outcomes

Examples include:

- perceived relevance;
- interest;
- confidence;
- comprehension;
- emotional response;
- sense of control;
- satisfaction;
- and willingness to continue.

These may be outcomes in a feasibility study but should not be confused with long-term Healthy Aging effects.

---

## 61. Proximal Outcomes

Examples include:

- completed meaningful interaction;
- increased confidence initiating contact;
- increased participation;
- stronger perceived relationship;
- greater self-expression;
- greater perceived control;
- reduced interaction burden;
- and increased readiness for valued activity.

---

## 62. Healthy Aging Outcomes

### Social

- social connectedness;
- unwanted loneliness;
- social participation;
- relationship quality;
- reciprocity;
- and belonging.

### Psychological and Meaning

- well-being;
- purpose;
- positive affect;
- identity continuity;
- recognition;
- and meaning.

### Participation

- participation in valued activity;
- community participation;
- contribution;
- learning;
- creative activity;
- and shared activity.

### Functional

- ability to participate;
- confidence using technology;
- autonomy;
- communication access;
- and functional ability where appropriately defined.

### Intergenerational

- family connection;
- shared understanding;
- reciprocal exchange;
- and preservation of personal or family history.

---

## 63. Burden Outcomes

Burden should be evaluated directly.

Potential measures include:

- time;
- effort;
- fatigue;
- frustration;
- cognitive burden;
- emotional burden;
- digital burden;
- supporter burden;
- staff burden;
- and repeated support requests.

---

## 64. Harm Outcomes

Potential harms include:

- distress;
- embarrassment;
- exclusion;
- coercion;
- relationship conflict;
- unwanted disclosure;
- privacy loss;
- reduced confidence;
- increased dependence;
- misinformation;
- inaccessible design;
- and unsafe AI behaviour.

The absence of a reported serious event does not prove absence of burden or harm.

---

## 65. Accessibility Outcomes

Potential outcomes include:

- task completion;
- independent completion;
- support required;
- error recovery;
- time to completion;
- comprehension;
- successful use of adaptation;
- abandonment;
- and confidence.

Accessibility should be treated as both:

- an intervention requirement;
- and an evaluation domain.

---

## 66. Equity Outcomes

The platform should examine whether access, burden, benefit, or harm differs by relevant characteristics such as:

- digital experience;
- sensory ability;
- motor ability;
- communication ability;
- language;
- culture;
- socioeconomic context;
- living setting;
- device access;
- relationship availability;
- and support availability.

Small subgroup findings should not be overinterpreted.

---

## 67. Sustainability Outcomes

Potential outcomes include:

- continued use;
- staff capacity;
- support burden;
- cost;
- organisational fit;
- technical maintainability;
- and continued Participant value.

Sustainability should not justify retaining an intervention that is harmful or ineffective.

---

## 68. Measurement Framework

Outcome selection should follow:

```text
Research Question
        ↓
Construct
        ↓
Operational Definition
        ↓
Measurement
        ↓
Timepoint
        ↓
Source
        ↓
Interpretation Rule
```

A measurement should not be selected only because it is easy to digitise.

---

## 69. Measurement Selection Criteria

Measurement selection should consider:

- construct validity;
- reliability;
- responsiveness;
- population fit;
- context fit;
- language;
- accessibility;
- burden;
- licensing;
- administration method;
- scoring;
- interpretability;
- missing-data handling;
- and comparison value.

---

## 70. Measurement Types

Potential measurement types include:

- validated instrument;
- researcher-developed item;
- Participant-reported outcome;
- Participant-reported experience;
- observer-reported measure;
- qualitative interview;
- usability measure;
- accessibility measure;
- digital process measure;
- device measure;
- and administrative measure.

The type and limitations should be explicit.

---

## 71. Measurement Versioning

A measurement record should preserve:

- instrument;
- version;
- language;
- scoring version;
- administration mode;
- adaptation;
- licensing;
- and provenance.

A response should reference the exact Measurement Version used.

---

## 72. Digital Measures

Digital measures may include:

- activity offered;
- activity started;
- time;
- completion;
- assistance;
- adaptation;
- error;
- retry;
- tool use;
- AI draft accepted;
- AI draft rejected;
- confirmation;
- and withdrawal.

Digital measures are usually process measures.

They should not be presented as health outcomes without an explicit validated relationship.

---

## 73. Multi-Source Measurement

Data may come from:

- Participant self-report;
- Supporter report;
- Professional Caregiver observation;
- researcher observation;
- platform event;
- AI interaction metadata;
- device;
- or external source.

Source should remain explicit.

Sources may disagree.

Disagreement should not be silently resolved.

---

## 74. Missingness

Missingness may reflect:

- Declined;
- Unable;
- NotApplicable;
- MissedActivity;
- TechnicalFailure;
- Withdrawn;
- or Unknown.

Missingness may itself reveal burden or accessibility problems.

---

## 75. Measurement Adaptation

A measurement may require accessible presentation.

Adaptation must preserve measurement meaning where possible.

Material adaptation should be documented and evaluated for:

- comparability;
- validity;
- burden;
- and interpretation.

---

## 76. Ability-Adaptive Intervention Model

The platform should not treat age as a sufficient proxy for ability.

```text
Participant Preference
        +
Sensory Ability
        +
Motor Ability
        +
Communication Ability
        +
Cognitive Load
        +
Digital Experience
        +
Task Complexity
        +
Device and Environment
        ↓
Adapted Presentation and Support
```

Ability adaptation is both:

- a design principle;
- and a research question.

---

## 77. Adaptation Outcomes

The platform may evaluate whether adaptation improves:

- accessibility;
- comprehension;
- confidence;
- task completion;
- independent participation;
- error recovery;
- intervention exposure;
- acceptability;
- and burden.

Adaptation should not be judged only by faster completion.

---

## 78. Adaptive Inference Safeguards

When adaptation uses inferred information, the platform should require:

- a defined purpose;
- minimum necessary data;
- appropriate consent;
- source labelling;
- uncertainty;
- user visibility where appropriate;
- correction;
- override;
- expiry;
- and audit.

Adaptive inference must not:

- diagnose;
- secretly score capacity;
- change rights;
- broaden permission;
- alter consent meaning;
- or silently change the intervention mechanism.

---

## 79. Person-Centred Adaptation

The Participant should be able to:

- choose;
- preview;
- change;
- reject;
- and reset

adaptation settings where possible.

Observed difficulty may prompt an adaptation suggestion.

It should not automatically define the person's identity or ability.

---

## 80. Knowledge Gaps

A lack of evidence should be explicitly represented.

```text
Proposed Intervention
        ↓
Evidence Retrieval
        ↓
Insufficient, Indirect, or Conflicting Evidence
        ↓
Knowledge Gap
        ↓
Research Question
        ↓
Pilot or Other Study
        ↓
Evaluation
        ↓
Research Finding
        ↓
External Knowledge Submission
```

Knowledge Gaps may concern:

- mechanism;
- population;
- setting;
- intervention component;
- delivery modality;
- outcome;
- measurement;
- burden;
- harm;
- accessibility;
- equity;
- implementation;
- or sustainability.

---

## 81. Knowledge Gap Lifecycle

Representative states include:

- Identified;
- In Review;
- Prioritised;
- Linked to Research Question;
- Under Investigation;
- Partially Addressed;
- Addressed;
- or Retained as Unresolved.

A Knowledge Gap should not be closed merely because a study was completed.

---

## 82. Research Question Formation

A Research Question should arise from:

- a Healthy Aging challenge;
- an Evidence Decision;
- a Knowledge Gap;
- an intervention uncertainty;
- an implementation problem;
- a safety concern;
- an accessibility concern;
- or a previous Research Finding.

---

## 83. Research-to-Product Feedback Loop

The platform should support:

```text
Knowledge Platform Evidence
        ↓
Evidence Decision
        ↓
Intervention Design
        ↓
Protocol Version
        ↓
Digital Delivery
        ↓
Evaluation
        ↓
Dataset Version
        ↓
Analysis and Interpretation
        ↓
Research Finding
        ↓
Intervention Decision
        ↓
Knowledge Platform Submission
```

The intervention decision may be:

- Retain;
- Revise;
- Restrict;
- Replicate;
- Expand;
- Suspend;
- Retire;
- or Continue Exploratory Research.

---

## 84. Research Finding and Knowledge Curation

A Research Finding remains a Research Platform record.

It may be submitted externally as part of an Evidence Package.

The Knowledge Platform may:

- accept;
- revise;
- reject;
- defer;
- or request more evidence.

External curation must not silently rewrite the historical Research Finding.

---

## 85. Scientific Uncertainty

Uncertainty should be preserved in:

- Evidence Decisions;
- Protocols;
- Analysis Plans;
- Research Findings;
- Participant-facing summaries;
- and external submissions.

Uncertainty may concern:

- causality;
- measurement;
- generalisability;
- mechanism;
- implementation;
- safety;
- burden;
- equity;
- or missing data.

---

## 86. Claim Classification

The platform should distinguish:

- external evidence statement;
- Knowledge Platform definition;
- Research Platform Evidence Decision;
- human decision;
- Participant-reported information;
- observed data;
- AI inference;
- Research Finding;
- and unknown or unresolved claim.

These should not be presented as equivalent.

---

## 87. Claim Strength

A claim should be proportionate to:

- evidence directness;
- evidence quality;
- consistency;
- effect size where relevant;
- uncertainty;
- population fit;
- context fit;
- burden;
- harm;
- and replication.

Fluent wording should not make a claim stronger.

---

## 88. Negative and Unexpected Findings

The platform should preserve:

- failure to engage;
- failure to implement;
- unexpected burden;
- accessibility failure;
- relationship conflict;
- AI failure;
- null outcome;
- negative outcome;
- and serious harm.

These findings may be more important than positive engagement data.

---

## 89. Core Logic Model

```text
┌───────────────────────────────────────────────┐
│             HEALTHY AGING CONTEXT             │
│                                               │
│ Connection • Identity • Meaning • Autonomy   │
│ Participation • Ability • Life Transition    │
└───────────────────────┬───────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────┐
│        KNOWLEDGE PLATFORM FOUNDATION          │
│                                               │
│ Evidence • Theory • Mechanisms • Outcomes    │
│ Measurements • Risks • Provenance            │
└───────────────────────┬───────────────────────┘
                        │ MCP / REST
                        ▼
┌───────────────────────────────────────────────┐
│     RESEARCH PLATFORM EVIDENCE DECISION       │
│                                               │
│ Population • Context • Applicability         │
│ Uncertainty • Burden • Harm • Equity         │
└───────────────────────┬───────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────┐
│              DIGITAL INTERVENTION             │
│                                               │
│ Social Connection • AI Companion             │
│ Identity • Engagement • Agency               │
│ Family/Care Network • Adaptive Access        │
└───────────────────────┬───────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────┐
│             MECHANISMS OF ACTION              │
│                                               │
│ Opportunity • Reduced Burden • Confidence    │
│ Reciprocity • Belonging • Meaning            │
│ Identity Continuity • Perceived Control      │
└───────────────────────┬───────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────┐
│        EXPOSURE, ENGAGEMENT, AND CHANGE        │
│                                               │
│ Participation • Interaction • Adaptation     │
│ Behavioural • Social • Environmental Change  │
└───────────────────────┬───────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────┐
│            OUTCOMES AND CONSEQUENCES           │
│                                               │
│ Proximal • Healthy Aging • Implementation    │
│ Burden • Harm • Accessibility • Equity       │
└───────────────────────┬───────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────┐
│                EVALUATION                     │
│                                               │
│ Dataset • Analysis • Interpretation          │
│ Research Finding • Intervention Decision     │
└───────────────────────┬───────────────────────┘
                        │
                        ▼
             KNOWLEDGE IMPROVEMENT
```

---

## 90. Core Principles

### 90.1 Evidence-Informed, Not Technology-Driven

Begin with challenge, evidence, and intervention rather than technology.

### 90.2 Person-Centred, Not Age-Centred

People differ in goals, histories, relationships, abilities, and preferences.

### 90.3 Ability-Adaptive, Not One-Size-Fits-All

Presentation and support should adapt where appropriate.

### 90.4 Human Connection Over AI Substitution

The AI Companion should help people connect with people.

### 90.5 Meaningful Engagement Over Addictive Engagement

The objective is meaningful participation rather than maximum product use.

### 90.6 Autonomy and Dignity by Design

Consent, Participant control, privacy, refusal, correction, pause, and withdrawal are foundational.

### 90.7 Traceability

Major intervention decisions should remain traceable through:

```text
Challenge
→ Population and Context
→ Theory and Evidence
→ Evidence Decision
→ Intervention
→ Mechanism
→ Outcome
→ Measurement
→ Evaluation
```

### 90.8 Knowledge Gaps Are Valuable

Uncertainty should become explicit research input rather than hidden product logic.

### 90.9 Evidence Before Intelligence

AI should retrieve and reason over evidence when grounding is required.

AI does not become the evidence source.

### 90.10 Separation of Responsibilities

Knowledge curation belongs to the Knowledge Platform.

Intervention design, delivery, evaluation, Evidence Decisions, and Research Findings belong to the Research Platform.

### 90.11 Null and Harmful Evidence Must Be Retained

The platform should not create publication bias inside its own intervention portfolio.

### 90.12 Outcome Before Engagement Metric

Usage should be interpreted only in relation to mechanism, outcome, burden, and context.

### 90.13 Provenance by Default

Evidence, theory, measures, decisions, data, and findings should preserve source and version.

### 90.14 Human Governance

AI may assist evidence and research workflows, but authorised humans remain accountable.

---

## 91. Conceptual Acceptance Criteria

A proposed intervention is conceptually ready for further design only when:

1. the challenge is defined;
2. the population is defined;
3. the context is defined;
4. the intervention is distinguishable from a feature;
5. a mechanism is proposed;
6. evidence or theory is linked;
7. directness and uncertainty are recorded;
8. intended outcomes are defined;
9. burden and harm are considered;
10. accessibility and equity are considered;
11. measurements are proposed;
12. Knowledge Gaps are explicit;
13. the AI role is defined where applicable;
14. permission and consent implications are identified;
15. and an evaluation pathway exists.

---

## 92. Open Questions

1. Which Healthy Aging conceptual frameworks should be represented first in the Knowledge Platform?
2. Which evidence-appraisal method should be used for the first pilot?
3. Which dimensions of directness should be mandatory in every Evidence Decision?
4. Which Evidence Decision outcomes should be canonical?
5. Which mechanism vocabulary should become controlled terminology?
6. Which outcome constructs should be prioritised for the first intervention portfolio?
7. Which measurement instruments are feasible, accessible, and licensed?
8. Which digital measures have sufficient conceptual validity?
9. Which burden dimensions should be mandatory in every Pilot Protocol?
10. Which harm categories should be common across interventions?
11. Which equity dimensions are appropriate for the first pilot?
12. Which Knowledge Gaps should become first-class Knowledge Platform records?
13. Which AI evidence tasks require mandatory human review?
14. Which claim types require citations visible to Participants?
15. Which evidence changes trigger Evidence Decision review?
16. Which Evidence Decisions trigger Protocol amendment?
17. Which adaptation changes may affect measurement comparability?
18. Which moderator variables are justified for the first pilot?
19. Which implementation outcomes are necessary before a larger study?
20. Which Research Findings are eligible for external Knowledge Platform submission?
21. Which negative findings should trigger immediate intervention restriction?
22. Which causal pathways require direct mechanism measurement?
23. Which outcome changes would justify intervention expansion?
24. How should lived-experience evidence be governed and weighted?
25. Which conceptual changes require a major version of this document?

---

## 93. Design Decisions

This document establishes that:

1. A digital feature is not automatically an intervention.
2. Every intervention should trace to a challenge, population, context, evidence or theory, mechanism, outcome, measurement, risk, safeguard, and evaluation.
3. Theory establishes plausibility but does not replace empirical evaluation.
4. Evidence types answer different questions.
5. Evidence strength cannot be inferred from study design alone.
6. Evidence appraisal includes quality, directness, population, context, mechanism, modality, burden, harm, accessibility, equity, and applicability.
7. Direct and indirect evidence remain distinguishable.
8. Positive, null, negative, mixed, and harmful findings are retained.
9. Absence of evidence is not evidence of no effect.
10. The Knowledge Platform is an independent authoritative system.
11. The Knowledge Graph is a capability inside the Knowledge Platform.
12. Evidence and Knowledge Integration is an internal Research Platform capability.
13. Knowledge References point to external authoritative records.
14. Evidence Decisions are human-accountable Research Platform records.
15. Research Findings are distinct from Evidence Decisions and external Knowledge Publication.
16. The canonical intervention taxonomy contains seven domains.
17. `AI Companion` is the canonical AI domain name.
18. Participant is the canonical domain actor.
19. Family and care relationships do not create permission.
20. Effective permission includes role, relationship, consent, purpose, context, specific permission, and resource state.
21. Mechanisms should be explicit and measurable where central to the causal claim.
22. Digital engagement is a mediator or process indicator, not the final definition of benefit.
23. Intervention exposure and fidelity must be distinguished.
24. Implementation, process, experience, proximal, and Healthy Aging outcomes are distinct.
25. Burden, harm, accessibility, equity, and sustainability are part of intervention evaluation.
26. Measurement selection follows the Research Question and construct.
27. Digital measures are not automatically health outcomes.
28. Measurement Version and adaptation should be preserved.
29. Ability adaptation changes presentation and support, not meaning, rights, permission, Protocol, or scientific claim.
30. Sensitive adaptive inference requires purpose, consent, transparency, uncertainty, correction, override, and audit.
31. Knowledge Gaps are first-class research objects.
32. AI-assisted evidence synthesis must be grounded, provenance-preserving, uncertainty-aware, and human-reviewed.
33. AI cannot approve Evidence Decisions, Protocols, evidence status, Research Findings, or Knowledge Publication.
34. Research Findings feed an intervention decision and may be submitted for external curation.
35. External curation does not silently rewrite the historical Research Finding.
36. Conceptual uncertainty must remain visible throughout design, evaluation, and communication.

---

## 94. Summary

The Healthy Aging Digital Intervention Research Platform uses a theory-informed and evidence-governed model.

Its central logic is:

```text
Healthy Aging Challenge
        ↓
Population and Context
        ↓
Knowledge Platform Evidence and Theory
        ↓
Human Evidence Decision
        ↓
Digital Intervention
        ↓
Mechanism
        ↓
Exposure, Engagement, and Change
        ↓
Outcomes, Burden, Harm, Accessibility, and Equity
        ↓
Evaluation
        ↓
Research Finding
        ↓
Intervention Decision and Knowledge Improvement
```

The Knowledge Platform provides authoritative knowledge infrastructure.

The Research Platform applies that knowledge through governed Evidence Decisions, interventions, Protocols, evaluation, and Research Findings.

The AI Companion assists retrieval, synthesis, drafting, explanation, and intervention delivery without becoming the source of evidence or the owner of scientific decisions.

The central principle is:

> Digital interventions should not merely be built and used. They should be conceptually justified, evidence-informed, permission-aware, measurable, evaluated for meaningful benefit and harm, and improved through accountable research.
