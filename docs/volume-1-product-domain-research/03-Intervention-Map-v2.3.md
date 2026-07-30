# Document 3 — Intervention Map

**Version:** 2.3  
**Status:** Revised Intervention Architecture Baseline  
**Handbook Volume:** Volume I — Product, Domain & Research Architecture  
**Primary System:** Digital Intervention Research Platform  
**Document Owner:** Intervention and Research Governance  
**Approved By:** To be assigned  
**Last Updated:** 2026-07-29  
**Supersedes:** Document 3 — Intervention Map v2.2  
**Review Trigger:** A material change to intervention definitions, domains, portfolio records, Intervention Versions, evidence-status rules, lifecycle, dependencies, Community or Platform Public scope, Open Matching, MutualAcceptance, Connection or messaging boundaries, prioritisation, the MVP InterventionConfiguration, or InterventionDecisions

---

## 1. Purpose

The Intervention Map defines how the **Healthy Aging Digital Intervention Research Platform** translates Healthy Aging challenges into structured, evidence-informed, governable, measurable, and versioned digital interventions.

It connects:

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
Intervention Components
        ↓
Mechanism of Action
        ↓
Exposure and Engagement Pathway
        ↓
Proximal Outcome
        ↓
Healthy Aging Outcome
        ↓
Burden, Harm, Accessibility, and Equity
        ↓
Measurement and Evaluation
        ↓
Research Finding
        ↓
Intervention Decision
```

The Intervention Map is the authoritative Handbook source for:

- intervention definitions;
- the intervention-domain taxonomy;
- intervention-record requirements;
- intervention identifiers and Intervention Versions;
- intervention lifecycle;
- Intervention Evidence Status and Evidence Direction;
- intervention dependencies;
- the initial intervention portfolio;
- intervention composition;
- prioritisation;
- and intervention decisions.

The central rule is:

> A product feature becomes part of an intervention only when its challenge, population, context, purpose, mechanism, intended outcome, risk, safeguard, permission implications, and evaluation role are explicitly defined.

### 1.1 Scope

This document covers:

- intervention definitions;
- the distinction among capabilities, features, components, mechanisms, and outcomes;
- intervention records;
- identifiers;
- versioning;
- lifecycle;
- evidence status;
- evidence direction;
- dependencies;
- domains;
- the initial portfolio;
- the current MVP InterventionConfiguration;
- governed Community, Platform Public and Open Matching intervention boundaries;
- measurement expectations;
- evaluation principles;
- Knowledge Platform integration;
- prioritisation;
- and intervention governance.

It does not define final Protocols, UX flows, measurement instruments, statistical analyses, technical implementation, AI prompts, database schemas, or pilot operating procedures.

### 1.2 Relationship to Other Documents

This document depends on:

- Document 0 — Platform Ecosystem Architecture;
- Document 1 — Project Definition & Vision;
- Document 2 — Conceptual & Evidence Framework.

It provides intervention requirements to Documents 4–20.

Document 2 remains authoritative for conceptual, causal, evidence, outcome, and measurement logic.

Document 4 remains authoritative for roles, relationships, consent, delegation, purpose, context, permissions, and resource state.

Document 18 remains authoritative for current MVP scope and delivery sequencing.

Document 19 remains authoritative for the draft Pilot-specific Protocol, subject to governance and ethics approval.

Document 20 remains authoritative for UX flows and design-system presentation.

### 1.4 v2.3 Consistency Resolution

Version 2.3 resolves Handbook conflict **HC-001** by replacing the outdated exclusion of social and matching capability with a controlled distinction:

```text
In Scope
    Governed Community
    Platform Public where explicitly approved
    Opt-In Open Matching
    Independent MatchDecision
    MutualAcceptance
    Connection
    Limited Messaging

Out of Scope
    Anonymous or Unmoderated Community
    Unrestricted Internet Public Publication
    Viral or Engagement-Maximising Social Growth
    Unrestricted People Search
    Unrestricted Direct Messaging
    Autonomous AI Matching, Connection or Message Sending
```

It also applies the terminology direction in **HC-009** by preferring `Governed Community`, `Platform Public`, `Internet Public` and `Open Matching` over ambiguous umbrella terms.

### 1.3 Canonical Terminology

- **Participant** is the canonical domain actor.
- **Older adult** is a population description.
- **Resident** is used only for a Participant in a residential, assisted-living, or long-term care context.
- **Supporter** is a person authorised to assist a Participant within a defined relationship and permission scope.
- **AI Companion** is the canonical AI product and system name.
- **Knowledge Platform** refers to the independent Healthy Aging Knowledge Platform.
- **Knowledge Reference** is a versioned reference to a Knowledge Platform record.
- **Evidence Decision** is a human-accountable Research Platform decision about how evidence applies.
- **Intervention Version** is an immutable version of an intervention definition.
- **InterventionConfiguration** is a ResearchProject-specific composition of exact InterventionVersions, pathways, dose, sequence, adaptations, AI behaviour, safeguards and evaluation rules.
- **Governed Community** is authenticated, purpose-defined Community participation with current rules, Block, Report, human moderation and controlled visibility.
- **Platform Public** means visible to an eligible authenticated Platform audience.
- **Internet Public** means potentially visible outside authenticated Platform boundaries and requires a separate approved publication flow.
- **Open Matching** is a Participant-controlled opt-in process using approved declared attributes.
- **MatchCandidate** is a time-limited candidate record and is not a Connection.
- **MatchDecision** is one Participant's independent decision about one MatchCandidate.
- **MutualAcceptance** is the confirmed condition that compatible independent MatchDecisions remain current and all policy checks pass.
- **Connection** is a mutually authorised social connection and does not create Supporter, care or research authority.
- **Message Draft**, **Sent Message** and **Delivered Message** are separate states.

# 2. What Is an Intervention?

An intervention is:

> A deliberately designed activity, service, interaction, environmental modification, or coordinated set of components intended to influence one or more defined mechanisms and contribute to meaningful outcomes for a specified population and context.

An intervention should define:

- why it exists;
- for whom it is intended;
- where and under which conditions it applies;
- what Participants and other actors are asked to do;
- how it may produce change;
- what benefit is intended;
- what burden or harm may occur;
- which safeguards apply;
- and how it will be evaluated.

A feature is not automatically an intervention.

The platform should distinguish:

```text
Platform Capability
        ↓
Product Feature
        ↓
Intervention Component
        ↓
Mechanism
        ↓
Proximal Outcome
        ↓
Healthy Aging Outcome
```

| Product Element | Classification |
|---|---|
| Voice-message button | Product feature |
| Weekly Participant-controlled voice exchange with an authorised Supporter | Intervention component |
| Reduced effort required to initiate contact | Mechanism |
| Increased reciprocal communication | Proximal outcome |
| Improved perceived relationship quality | Healthy Aging-related outcome |

A feature may support several interventions.

It has no inherent evidence status outside a defined intervention context.

# 3. Intervention Map Record Structure

Each intervention should be stored as a structured record that separates:

- stable identity;
- versioned definition;
- project-specific configuration;
- lifecycle;
- evidence;
- approval;
- and evaluation history.

## 3.1 Required Core Fields

| Field | Description |
|---|---|
| **Intervention ID** | Stable canonical identifier |
| **Intervention Name** | Canonical human-readable name |
| **Primary Domain** | Main intervention domain |
| **Secondary Domains** | Additional relevant domains |
| **Healthy Aging Challenge** | Challenge being addressed |
| **Problem Definition** | Bounded problem statement |
| **Target Population** | Intended population |
| **Context** | Social, physical, cultural, organisational, and technological context |
| **Objective** | Intended purpose |
| **Intervention Components** | Required and optional activities or system behaviours |
| **Sequence and Dose** | Order, frequency, duration, intensity, and exposure |
| **Delivery Mode** | In-person, web, phone, message, voice, video, mixed, or other |
| **Mechanisms of Action** | Proposed processes of change |
| **Mediators and Moderators** | Factors through which or under which change may occur |
| **Process Outcomes** | Delivery and use outcomes |
| **Proximal Outcomes** | Near-term intended changes |
| **Healthy Aging Outcomes** | Broader intended outcomes |
| **Implementation Outcomes** | Feasibility, acceptability, fidelity, adoption, cost, and sustainability |
| **Measurement Instruments** | Validated or exploratory measures |
| **Digital Measures** | Platform-generated process measures |
| **Qualitative Measures** | Interview, observation, or open-text methods |
| **Knowledge References** | Versioned Knowledge Platform references |
| **Evidence Decision** | Approved applicability decision |
| **Evidence Status** | Maturity and directness of evidence |
| **Evidence Direction** | Beneficial, null, mixed, harmful, conflicting, uncertain, or not evaluated |
| **Knowledge Gaps** | Unresolved evidence needs |
| **Risks and Harms** | Potential negative effects |
| **Participant Burden** | Time, effort, fatigue, emotional, cognitive, or digital burden |
| **Supporter and Operational Burden** | Burden for Supporters, staff, or organisations |
| **Safeguards** | Controls intended to reduce risk |
| **Consent Requirements** | Required consent scope |
| **Relationship Requirements** | Required relationship, Connection or communication basis and verification |
| **Purpose and Permissions** | Required purpose-of-use and action permissions |
| **Visibility and Publication** | Private, Selected People, Connections, Community, Platform Public or separately approved Internet Public rules |
| **Community and Moderation** | Community purpose, eligibility, rules, Block, Report, moderation, appeal and restoration |
| **Matching and Connection** | Opt-in, allowed attributes, candidate rules, MatchExplanation, MatchDecision, MutualAcceptance and Connection rules |
| **Messaging** | Communication basis, Draft, send confirmation, delivery, retention, Block and Report rules |
| **Adaptation Requirements** | Ability, preference, language, cultural, or contextual adaptations |
| **AI Role** | Approved AI Companion role, if any |
| **Safety and Escalation** | SafetySignals, human triage, SafetyEvents, pause, stop and review rules |
| **Research Questions** | Questions requiring evaluation |
| **Protocol References** | Protocol Versions using the intervention |
| **Dependencies** | Governance, capability, data, AI, safety, and evaluation dependencies |
| **Lifecycle State** | Current intervention maturity state |
| **Current Version** | Current approved or active Intervention Version |
| **Evaluation History** | Linked evaluations and Research Findings |
| **Intervention Decisions** | Retain, revise, restrict, replicate, expand, suspend, retire, or continue research |

## 3.2 Intervention Identifier Standard

Every intervention requires a stable identifier that does not change when its title, wording, lifecycle, evidence status, or version changes.

The canonical format remains:

```text
INT-NNN
```

Examples: `INT-001`, `INT-009`, `INT-010`.

Domain codes are metadata and do not replace the Intervention ID.

| Domain | Code |
|---|---|
| Social Connection | `SOC` |
| AI Companion | `CMP` |
| Identity and Life Story | `LST` |
| Meaningful Engagement | `ENG` |
| Agency and Autonomy | `AUT` |
| Family and Care Network | `FAM` |
| Ability-Adaptive Access | `ACC` |

Identifiers must not encode:

- evidence status;
- Evidence Direction;
- lifecycle state;
- Protocol;
- organisation;
- deployment environment;
- or version.

## 3.3 Intervention Versioning

Interventions should use immutable `InterventionVersion` records.

A new Intervention Version is required when a material change affects:

- objective;
- target population;
- context;
- mechanism;
- required component;
- dose;
- sequence;
- delivery mode;
- AI role;
- Supporter role;
- safeguard;
- outcome;
- or interpretation.

Representative Intervention Version states are:

- Draft;
- In Review;
- Approved;
- Active;
- Suspended;
- Superseded;
- Retired;
- or Archived.

An Approved or historical Intervention Version must not be silently overwritten.

## 3.4 Intervention Lifecycle

The intervention lifecycle describes maturity and activity across time.

```text
Idea
  ↓
Concept
  ↓
Evidence Review
  ↓
Co-Design
  ↓
Prototype
  ↓
Feasibility
  ↓
Pilot
  ↓
Evaluated
  ↓
Controlled Deployment
  ↓
Ongoing Monitoring and Re-Evaluation
  ↓
Retain • Revise • Restrict • Replicate • Expand • Suspend • Retire
```

| State | Meaning |
|---|---|
| **Idea** | Unstructured opportunity or challenge hypothesis |
| **Concept** | Initial intervention record exists |
| **Evidence Review** | Evidence, theory, mechanisms, outcomes, measures, risks, and gaps are assessed |
| **Co-Design** | Intended users and stakeholders shape the intervention |
| **Prototype** | Limited implementation supports design learning |
| **Feasibility** | Usability, accessibility, acceptability, burden, safety, and operational feasibility are evaluated |
| **Pilot** | Intervention and evaluation process are tested in a bounded Research Project |
| **Evaluated** | Outcome, implementation, mechanism, burden, or harm findings exist |
| **Controlled Deployment** | Use is permitted within defined populations, settings, safeguards, and monitoring |
| **Suspended** | Use is paused because of evidence, safety, consent, governance, data-quality, or operational concerns |
| **Retired** | The intervention is no longer offered while history is retained |

Lifecycle state is separate from:

- Intervention Version state;
- Evidence Status;
- Evidence Direction;
- Protocol state;
- and deployment state.

## 3.5 Intervention Dependencies

Every intervention should declare the conditions required for responsible delivery.

Dependency categories include:

- **governance dependencies** — Protocol, approval, consent, safety, moderation, supported decision-making;
- **identity and relationship dependencies** — identity, relationship verification, delegation, and revocation;
- **permission dependencies** — purpose, specific permission, resource state, and audit;
- **capability dependencies** — communication, accessibility, notification, media, or content management;
- **social-safety dependencies** — Community rules, allowed matching attributes, MatchExplanation, independent MatchDecisions, MutualAcceptance, Block, Report, moderation, appeal, scam controls, and communication basis;
- **data dependencies** — authorised preferences, PublicProfile, LifeStoryItem, relationship, Connection, evidence, or assessment data;
- **AI dependencies** — approved AI Intervention Configuration, model alias, prompts, tools, safety, evaluation, and kill switch;
- **intervention dependencies** — another intervention or enabling capability;
- **operational dependencies** — staffing, support, escalation, and setting readiness;
- **evaluation dependencies** — measurement, data quality, Protocol, dataset definition, and Analysis Plan.

Example:

```text
INT-004 Life Story and Participant-Controlled Personal Archive
  ├── depends_on → Identity and Profile
  ├── depends_on → Participant-Controlled Permission
  ├── depends_on → Media and Content Management
  ├── depends_on → Sensitive-Content Safeguards
  ├── depends_on → Consent for Sharing
  └── may_be_supported_by → INT-003 AI Companion-Facilitated Human Connection
```

Dependencies describe required conditions.

They do not grant authority or access.

# 4. Intervention Domains

The Intervention Map uses seven canonical domains.

1. **Social Connection**
2. **AI Companion**
3. **Identity and Life Story**
4. **Meaningful Engagement**
5. **Agency and Autonomy**
6. **Family and Care Network**
7. **Ability-Adaptive Access**

These domains may overlap.

An intervention may have one primary domain and multiple secondary domains.

## 4.1 Social Connection

Supports reciprocal interaction, friendship, belonging, relationship continuity, and community participation.

## 4.2 AI Companion

Uses the AI Companion for explanation, navigation, preparation, drafting, reflection, accessibility, or facilitation of human contact.

AI interaction volume is not the intended Healthy Aging outcome.

## 4.3 Identity and Life Story

Supports identity expression, identity continuity, personal archives, selective sharing, legacy, and intergenerational exchange.

## 4.4 Meaningful Engagement

Supports valued activity, learning, creativity, movement, interests, contribution, and participation without addictive engagement design.

## 4.5 Agency and Autonomy

Supports meaningful choice, consent, permission management, correction, refusal, pause, withdrawal, and Participant-controlled sharing.

## 4.6 Family and Care Network

Supports authorised relationships among Participants, family, friends, informal caregivers, Professional Caregivers, and other trusted Supporters.

Relationship status does not create permission.

## 4.7 Ability-Adaptive Access

Adapts presentation, navigation, pacing, language, input, output, assistance, and modality.

Adaptation must not change rights, consent meaning, permission, Protocol, intervention purpose, outcome definition, or scientific claim.

# 5. Intervention Evidence Status Model

Intervention Evidence Status describes the maturity and directness of the evidence base for a sufficiently specific intervention claim.

It does not state whether the evidence is positive.

## E0 — Conceptual

The intervention is based primarily on a challenge hypothesis, co-design insight, product idea, or plausible rationale.

No sufficient supporting evidence has been linked.

## E1 — Theory-Informed

A relevant theory and plausible mechanism exist, but direct intervention evidence is limited.

## E2 — Evidence-Informed

Related interventions, components, mechanisms, or delivery approaches have empirical support.

Evidence may be indirect, mixed, from another population or setting, or not specific to the proposed digital implementation.

## E3 — Evidence-Supported

Reasonably consistent and sufficiently direct evidence supports the intervention or a closely comparable intervention in a relevant population and context.

E3 does not imply universal effectiveness, absence of harm, or suitability for uncontrolled deployment.

## E4 — Locally Evaluated

The intervention has been evaluated through this Research Platform or a directly comparable implementation.

The direction of the findings must be recorded separately.

## E5 — Replicated

The intervention has been evaluated across multiple Research Projects, populations, settings, or independent implementations.

Replication may confirm benefit, no effect, mixed effects, burden, or harm.

## 5.1 Evidence Direction

Evidence Direction is separate from Evidence Status.

Representative values are:

- Not Evaluated;
- Beneficial;
- Beneficial with Conditions;
- Null;
- Mixed;
- Harmful;
- Conflicting;
- or Uncertain.

Example:

```text
Evidence Status: E4 — Locally Evaluated
Evidence Direction: Mixed
```

## 5.2 Evidence Status Assignment Workflow

Evidence Status should be assigned through an approved Evidence Decision.

```text
Intervention Definition
        ↓
Define Population, Context, Components, Mechanism, and Outcomes
        ↓
Retrieve Knowledge Platform Evidence
        ↓
Assess Directness, Quality, Consistency, Burden, Harm, and Applicability
        ↓
Record Supporting, Null, Conflicting, Harmful, and Missing Evidence
        ↓
Draft Evidence Decision
        ↓
Human Review and Approval
        ↓
Assign Evidence Status and Direction
        ↓
Set Review Trigger
```

The AI Companion may support retrieval and drafting.

It cannot approve Evidence Status, Evidence Direction, or an Evidence Decision.

## 5.3 Evidence Status Scope

Evidence Status applies only to the intervention definition and claim scope used in the Evidence Decision.

It must not automatically transfer across materially different:

- populations;
- cultures;
- languages;
- settings;
- components;
- doses;
- delivery modes;
- AI configurations;
- mechanisms;
- or outcome claims.

## 5.4 Evidence Review Triggers

Review may be triggered by:

- new Knowledge Platform evidence;
- a new Research Finding;
- a new SafetyEvent;
- a new population or setting;
- a new delivery mode;
- a material AI change;
- a new measurement;
- a Protocol amendment;
- or an elapsed review period.

New evidence must not silently change an approved Intervention Version.

# 6. Initial Intervention Portfolio

## INT-001 — Structured Social Connection

### INT-001 — Primary Domain

**Social Connection**

### INT-001 — Secondary Domains

- Meaningful Engagement
- Agency and Autonomy
- Identity and Life Story

### INT-001 — Problem Addressed

- Loneliness
- Social isolation
- Reduced meaningful interaction
- Reduced Community participation
- Difficulty initiating or sustaining contact
- Social experiences that are unstructured, inaccessible or engagement-driven

### INT-001 — Target Population

- Community-dwelling older adults
- Participants in long-term care or assisted-living settings
- Older adults with limited social contact
- Older adults who want a low-pressure existing-contact or Community pathway
- Participants who find unstructured consumer social media difficult, unsafe or irrelevant

### INT-001 — Objective

To create low-pressure, accessible and Participant-controlled opportunities for meaningful reciprocal human interaction.

### INT-001 — Required Intervention Components

- Accessible orientation and choice of social pathway
- Structured prompt, invitation or activity with a defined purpose
- Existing authorised contact, governed Community interaction or approved Connection
- Participant-controlled preparation
- Clear beginning, expected effort and completion definition
- Reflection and follow-up
- Persistent Block, Report and Help controls
- Human moderation where Community content or interaction is used
- SafetySignal routing and accountable human review

### INT-001 — Optional Intervention Components

- LifeStoryItem used as conversation material
- Small interest-based Community activity
- One-to-one interaction
- Voice, text, photo or another approved modality
- Supporter-assisted preparation
- AI-assisted Drafting, translation, preparation or reflection
- Repeated interaction after Participant choice

### INT-001 — Mechanisms of Action

- Reduced initiation burden
- Increased opportunity for reciprocal contact
- Greater conversational readiness
- Recognition by another person
- Shared interest or identity
- Participant control and psychological safety
- Increased confidence
- Belonging and social participation

### INT-001 — Engagement Pathway

```text
Accessible Invitation or Participant Choice
        ↓
Existing Contact, Governed Community or Mutual Connection
        ↓
Preparation and Boundary Review
        ↓
Voluntary Human Interaction
        ↓
Reflection
        ↓
Optional Continued Contact
```

### INT-001 — Process Outcomes

- Activity offered, viewed, started, completed, skipped, declined or interrupted
- Pathway selected
- Preparation completed
- Human interaction attempted
- Human interaction completed
- Support or adaptation used
- Block or Report used
- Moderation or SafetySignal generated

### INT-001 — Proximal Outcomes

- Increased confidence initiating contact
- Increased reciprocal communication
- Increased perceived meaningful participation
- Increased feeling of being heard or recognised
- Increased willingness for another human interaction

### INT-001 — Healthy Aging Outcomes

- Social connectedness
- Reduced loneliness where appropriately measured
- Sense of belonging
- Relationship quality
- Meaningful participation
- Autonomy
- Well-being

### Potential Measurements

- Approved social connectedness or loneliness measure
- Confidence initiating contact
- Meaningful interaction completion
- Feeling heard
- Relationship quality
- Social participation
- Acceptability and burden
- Accessibility and support
- Moderation and Safety
- Qualitative Participant meaning

Human interaction counts, SocialPosts, reactions and time spent are process measures unless an approved MeasurementVersion establishes another interpretation.

### INT-001 — Risks

- Rejection or lack of response
- Social comparison
- Harassment
- Scam or fraud
- Unwanted contact
- Coercion
- Privacy exposure
- Excessive disclosure
- Relationship conflict
- Superficial interaction being mistaken for meaningful connection
- Excessive Platform or AI dependency
- Moderator or operational overload

### INT-001 — Safeguards

- Voluntary pathway selection
- Private-by-default content
- Governed Community only
- Explicit audience and visibility
- Limited exposure and communication
- MutualAcceptance before Connection
- Block and Report
- Human moderation
- Scam and malicious-link controls
- No precise public location
- Accessible privacy and withdrawal controls
- SafetySignal and human triage
- No engagement-maximising success criterion

### INT-001 — Important Boundaries

```text
Community Activity
    ≠ Healthy Aging Outcome

Message Sent
    ≠ Human Interaction Completed

Human Interaction Completed
    ≠ Benefit

Connection
    ≠ Supporter Relationship
```

### INT-001 — Initial Evidence Status

**To be assigned through an approved EvidenceDecision after Knowledge Platform retrieval**

---

## INT-002 — Interest-Based Connection and Open Matching

### INT-002 — Primary Domain

**Social Connection**

### INT-002 — Secondary Domains

- Agency and Autonomy
- Meaningful Engagement
- Ability-Adaptive Access

### INT-002 — Problem Addressed

- Difficulty finding socially relevant people
- Reduced opportunities to form new voluntary relationships
- Social environments organised only around age, diagnosis or care status
- Search burden and uncertainty
- Unwanted contact caused by broad people discovery
- Opaque or discriminatory matching

### INT-002 — Target Population

Participants who want an optional route to discover another eligible Participant through shared declared interests, activities, language, communication mode, availability or approved broad location.

### INT-002 — Objective

To reduce the burden of discovering a potentially relevant human contact through opt-in, explainable and safely governed matching without claiming objective compatibility.

### INT-002 — Required Intervention Components

- Plain-language Open Matching introduction
- Explicit matching Consent
- Inactive-by-default MatchPreference
- Participant-selected allowed attributes
- Approved matching policy and version
- Time-limited MatchCandidate
- Safe PublicProfile projection
- Human-readable MatchExplanation
- Independent MatchDecision by each Participant
- MutualAcceptance before Connection
- Block, Report, pause, expiry and withdrawal
- Human moderation and Safety escalation
- Fidelity and fairness review

### Potential Allowed Attributes

- Declared interests
- Preferred activity
- Language
- Communication mode
- Availability
- Approved broad location
- Community context

### Prohibited Attributes by Default

- Diagnosis
- Inferred capacity
- Vulnerability
- Financial status
- Private Life Story
- Message content
- Safety records
- Moderation allegations
- Precise location
- Hidden protected traits
- AI-inferred emotional dependency

### INT-002 — Mechanisms of Action

- Reduced search burden
- Shared declared identity or interest
- Reduced uncertainty
- Explainable introduction
- Greater Participant control
- Mutual choice
- Reduced unwanted contact
- Increased opportunity for repeated human interaction

### INT-002 — Engagement Pathway

```text
Participant Reviews Matching Purpose
        ↓
Participant Activates MatchPreference
        ↓
Approved Policy Generates MatchCandidate
        ↓
Participant Reviews Safe Profile and MatchExplanation
        ↓
Interested • Not Now • Dismiss • Block • Report
        ↓
Other Participant Makes Independent Decision
        ↓
MutualAcceptance only if Both Decisions Remain Compatible
        ↓
Connection
```

### INT-002 — Process Outcomes

- Matching offered
- Matching accepted or declined
- MatchPreference activated, paused or withdrawn
- MatchCandidate generated, viewed or expired
- MatchExplanation viewed
- MatchDecision recorded
- MutualAcceptance recorded
- Connection activated
- Block or Report
- No-candidate state
- Support and moderation use

### INT-002 — Proximal Outcomes

- Greater confidence evaluating a potential contact
- More relevant voluntary introductions
- Reduced initiation burden
- Increased opportunity for sustained conversation
- Increased participation in shared activities

### INT-002 — Healthy Aging Outcomes

- Social connectedness
- Belonging
- Friendship formation
- Community participation
- Autonomy in social choice

### INT-002 — Risks

- Incorrect or insensitive matching
- Hidden sensitive inference
- Excessive profiling
- Discrimination or unequal exposure
- Repeated non-selection
- Location disclosure
- Misleading compatibility claims
- Unwanted contact
- Impersonation
- Scam or fraud
- Rejection burden
- Over-optimisation for acceptance or engagement

### INT-002 — Safeguards

- Open Matching inactive by default
- Participant-controlled MatchPreference
- Allowed-attribute registry
- Source and policy provenance
- Explainable matching
- No hidden compatibility truth claim
- Candidate expiry and rate limits
- Independent MatchDecisions
- MutualAcceptance before Connection
- Block checked before discovery, candidate delivery, MutualAcceptance and Connection
- Safe PublicProfile projection
- Broad rather than precise location
- Human moderation
- Fairness and accessibility review
- Alternative existing-contact and Community pathways

### INT-002 — Important Boundaries

```text
MatchCandidate
    ≠ MatchDecision
    ≠ MutualAcceptance
    ≠ Connection

No MatchCandidate
    ≠ Participant Failure

Internal Rank
    ≠ Objective Compatibility
```

### INT-002 — Initial Evidence Status

**To be assigned through an approved EvidenceDecision after Knowledge Platform retrieval**

---

## INT-003 — AI Companion-Facilitated Human Connection

### INT-003 — Primary Domain

**AI Companion**

### INT-003 — Secondary Domains

- Social Connection
- Identity and Life Story
- Ability-Adaptive Access

### INT-003 — Problem Addressed

- Difficulty understanding or initiating a social activity
- Communication burden
- Difficulty organising Life Story material
- Uncertainty about Community, matching or messaging
- Accessibility barriers
- Risk of AI becoming a substitute for human contact

### INT-003 — Objective

To use the AI Companion to reduce practical, cognitive and communication barriers to human interaction while preserving Participant choice, human authority and the distinction between AI assistance and human relationship.

### AI Role and Boundaries

The AI Companion may:

- explain the intervention, Community Rules and matching purpose;
- help define a manageable human-interaction goal;
- suggest Life Story prompts;
- transcribe, translate or organise a Draft;
- create a PublicProfile or SocialPost Draft;
- create a MatchPreference Draft;
- explain a MatchCandidate using approved declared attributes;
- create a MatchDecision Draft or proposal;
- create or improve a Message Draft;
- support call or activity preparation;
- support reflection;
- retrieve approved evidence or Platform facts;
- request Human Review;
- create a Block or submit a Report only through an explicitly enabled confirmed Tool;
- and raise a SafetySignal.

It must not:

- change Consent;
- determine capacity or substitute authority;
- convert an AI Draft into Participant Testimony;
- activate Community or matching without authorised confirmation;
- select a MatchDecision autonomously;
- record both Participants' decisions;
- create MutualAcceptance;
- create a Connection;
- send a Message without explicit confirmation;
- impersonate a Participant or another person;
- create fake users, reactions or social proof;
- claim emotional need or exclusivity;
- use hidden sensitive matching data;
- impose a high-impact ModerationDecision;
- confirm a SafetyEvent;
- diagnose, prescribe or provide emergency-service authority;
- lock a DatasetVersion;
- or approve a ResearchFinding.

### INT-003 — Intervention Components

- Contextual explanation
- Accessible presentation
- Life Story Drafting, transcription or translation
- Community and PublicProfile Draft assistance
- MatchExplanation
- Message Drafting
- Interaction preparation
- Reflection support
- Human-support routing
- Permission-aware Tool proposal
- Confirmation and receipt
- Human Review
- Memory review and deletion where enabled
- Kill switch and degraded fallback

### INT-003 — Mechanisms of Action

- Reduced initiation effort
- Reduced cognitive and communication burden
- Increased comprehension
- Increased preparation confidence
- Improved accessibility
- Greater awareness of permitted human opportunities
- More efficient human support

### INT-003 — Process Outcomes

- AI task offered and used
- Draft accepted, edited or rejected
- Source viewed
- Confirmation completed
- Tool succeeded or failed
- Human Review requested
- AI memory stored, corrected, revoked or deleted
- SafetySignal raised
- Kill switch or fallback used

### INT-003 — Proximal Outcomes

- Increased confidence preparing for contact
- Increased successful completion of human-contact attempts
- Reduced communication burden
- Improved comprehension of social choices and boundaries
- Increased accessible participation

### INT-003 — Healthy Aging Outcomes

- Social connectedness through human interaction
- Relationship continuity
- Perceived social support
- Autonomy in communication
- Digital inclusion

AI interaction volume is not a Healthy Aging outcome.

### INT-003 — Risks

- Emotional dependency
- Manipulative or anthropomorphic interaction
- AI substituting for human contact
- Invented Life Story detail
- Misrepresentation of another person's intentions
- Hidden matching inference
- Unauthorised social action
- Privacy leakage
- Prompt or Tool injection
- Provider failure
- Bias or accessibility failure
- False reassurance

### INT-003 — Safeguards

- Clear AI identity and role
- No feelings, exclusivity, guilt or pressure
- Human connection prioritised
- Permission-first Context Assembly
- Minimum-necessary data
- Approved AIInterventionConfigurationVersion
- Versioned Prompt and Tool Registry
- Source and uncertainty display
- Draft state preserved
- Participant confirmation
- Owning-domain command and structured result
- Human Review
- No cross-Participant or cross-project Context
- SafetySignal routing
- Monitoring, evaluation, rollback and kill switch
- Core controls available without AI

### INT-003 — Important Boundaries

```text
AI Draft
    ≠ Participant Testimony
    ≠ Published SocialPost
    ≠ Sent Message
    ≠ MatchDecision
    ≠ MutualAcceptance
    ≠ Connection

AISafetySignalRaised
    ≠ SafetyEvent
```

### INT-003 — Initial Evidence Status

**E1–E2 candidate, pending Knowledge Platform review and task-specific AI evaluation**

---

## INT-004 — Life Story and Participant-Controlled Personal Archive

### INT-004 — Primary Domain

**Identity and Life Story**

### INT-004 — Secondary Domains

- Social Connection
- Family and Care Network
- Meaningful Engagement
- Agency and Autonomy

### INT-004 — Problem Addressed

- Loss of identity continuity
- Personal history being forgotten
- Reduced opportunities for self-expression
- Family or Community disconnection
- Difficulty finding meaningful conversation material
- Life transitions that reduce a person's identity to care needs

### INT-004 — Objective

To support Participants in expressing, organising, preserving and selectively using their life experiences and identity under continuing Participant control.

### INT-004 — Required Intervention Components

- Private-by-default LifeStoryArchive
- LifeStoryItem Draft
- Participant review and correction
- Source and authorship
- Proposed-detail review
- Participant confirmation
- Version history
- Granular Visibility and sharing rights
- Withdrawal and export
- Sensitive-topic safeguards
- AI involvement label where applicable

### INT-004 — Optional Intervention Components

- Voice-recorded story
- Written story
- Photograph and caption
- Life timeline
- People, places, work, interests, values, music, recipes and traditions
- Supporter Contribution
- Translation or transcription
- Selected People sharing
- Connections sharing
- Community publication
- Platform Public publication where explicitly approved
- Intergenerational Story Sharing
- LegacyPreference where legally and operationally approved

### INT-004 — Mechanisms of Action

- Self-expression
- Identity continuity
- Narrative meaning-making
- Recognition by others
- Conversation readiness
- Intergenerational communication
- Personal control
- Meaning and contribution

### INT-004 — Engagement Pathway

```text
Story Invitation or Participant Choice
        ↓
Text, Voice, Photo or Other Approved Contribution
        ↓
AI Draft or Supporter Contribution where Enabled
        ↓
Participant Review and Correction
        ↓
Participant Confirmation
        ↓
Private Archive
        ↓
Optional Selected Sharing
        ↓
Human Response and Conversation
```

### INT-004 — Process Outcomes

- Life Story activity offered, started, skipped, declined or completed
- Draft created
- Proposed details reviewed
- Item confirmed
- Item kept Private
- Visibility selected
- Item shared or published
- Supporter Contribution accepted, revised or rejected
- AI Draft accepted, edited or rejected
- Withdrawal, deletion or export requested
- Sensitive-topic support or SafetySignal used

### INT-004 — Proximal Outcomes

- Increased self-expression
- Increased conversation readiness
- Increased understanding of the Participant as a person
- Increased recognition
- Increased preservation of personal history
- Increased Participant control over identity sharing

### INT-004 — Healthy Aging Outcomes

- Identity continuity
- Sense of meaning
- Intergenerational connectedness
- Relationship quality
- Meaningful participation
- Well-being
- Sense of legacy where applicable

### INT-004 — Important Boundaries

Life Story work must not automatically be classified as:

- Memory testing;
- cognitive training;
- cognitive rehabilitation;
- a diagnostic assessment;
- or verified historical research.

```text
AI Draft
    ≠ Participant Testimony

Supporter Contribution
    ≠ Participant Testimony

Participant Testimony
    ≠ Verified Historical Fact

LifeStoryItem Count
    ≠ Identity Continuity
```

### INT-004 — Risks

- Emotional distress
- Trauma activation
- Family or Community disagreement
- Inaccurate reconstruction
- AI invention
- Misattribution
- Loss of privacy
- Unwanted quotation or re-sharing
- Third-party privacy impact
- Research overcollection
- Posthumous use contrary to Participant preference
- Supporter or family takeover of the Participant's story

### INT-004 — Safeguards

- Optional participation and topic skipping
- Private default
- Participant authorship and confirmation
- Proposed details remain unconfirmed until reviewed
- Explicit contributor attribution
- Granular Visibility and reuse rights
- Platform Public and Internet Public separation
- No Internet Public publication by default
- Revision, restriction, withdrawal, deletion and export
- Sensitive-content warning and support
- AI Draft label and invention evaluation
- Third-party privacy review where required
- Research use excluded by default unless separately authorised
- LegacyPreference revocable and feature-disabled unless approved

### INT-004 — Initial Evidence Status

**E1–E2 candidate, pending separation of Life Story, reminiscence, identity, social-connection and cognitive evidence**

---

## INT-005 — Intergenerational Story Sharing

### INT-005 — Primary Domain

**Family and Care Network**

### INT-005 — Secondary Domain

**Identity and Life Story**

### INT-005 — Problem Addressed

- Reduced intergenerational understanding
- Limited family communication
- Loss of family history
- Difficulty finding meaningful conversation topics

### INT-005 — Objective

To support reciprocal exchange of stories, questions, media, and family knowledge across generations.

### INT-005 — Intervention Components

- Family questions and story invitations
- Shared family timeline
- Grandchild or family responses
- Photo and voice exchange
- Collaborative story creation
- Family traditions, recipes, music, and places
- Participant-controlled sharing

### INT-005 — Mechanisms of Action

- Curiosity
- Recognition
- Reciprocity
- Shared family identity
- Narrative connection
- Increased understanding

### INT-005 — Proximal Outcomes

- Increased family interaction
- More meaningful conversation
- Increased knowledge of family history
- Increased reciprocal sharing

### INT-005 — Healthy Aging Outcomes

- Intergenerational connectedness
- Relationship quality
- Identity continuity
- Sense of meaning and contribution

### INT-005 — Risks

- One-sided extraction of stories
- Family conflict
- Pressure to disclose
- Exclusion of non-traditional families
- Ownership disputes

### INT-005 — Safeguards

- Participant-led permissions
- Inclusive definition of family
- Ability to decline individual questions
- Contribution attribution
- Conflict and correction mechanisms

### INT-005 — Initial Evidence Status

**To be assigned after Knowledge Platform retrieval**

---

## INT-006 — Meaningful Daily Engagement

### INT-006 — Primary Domain

**Meaningful Engagement**

### INT-006 — Problem Addressed

- Boredom
- Passive time
- Reduced activity participation
- Lack of structure or anticipation in daily life

### INT-006 — Objective

To provide accessible, personally meaningful activities that support participation without relying on addictive engagement.

### INT-006 — Intervention Components

- Music
- Creative activities
- Learning
- Games
- Puzzles
- Community activities
- Guided movement
- Personal projects
- Cultural and local content
- Participant-created activities

### INT-006 — Mechanisms of Action

- Enjoyment
- Curiosity
- Mastery
- Choice
- Flow
- Social participation
- Personal relevance

### INT-006 — Proximal Outcomes

- Increased participation in valued activities
- Increased positive engagement
- Increased activity variety
- Reduced passive screen time or unstructured inactivity

### INT-006 — Healthy Aging Outcomes

- Well-being
- Purpose
- Participation
- Autonomy
- Social connection where activities are shared

### Important Boundary

Entertainment and clinical intervention must remain distinct.

A game should not claim to improve cognition unless:

- A specific intervention model exists
- The target population is defined
- The mechanism is justified
- Evidence supports the claim
- Outcomes are appropriately evaluated

### INT-006 — Risks

- Addictive mechanics
- Frustration
- Shame after failure
- Excessive screen time
- Inappropriate difficulty
- Casino-like reinforcement patterns
- Misleading health claims

### INT-006 — Safeguards

- No real-money gambling
- No loot boxes
- No coercive streaks
- No punitive loss of progress
- Adjustable difficulty
- No-shame feedback
- Clear purpose labels
- Ability-adaptive interaction

### INT-006 — Initial Evidence Status

**Activity-specific; evidence must be assigned separately for each activity type**

---

## INT-007 — Contribution and Purpose

### INT-007 — Primary Domain

**Meaningful Engagement**

### INT-007 — Secondary Domains

- Social Connection
- Identity and Life Story

### INT-007 — Problem Addressed

- Loss of social role
- Reduced sense of contribution
- Reduced purpose after retirement or institutional transition
- Feeling that one's knowledge is no longer valued

### INT-007 — Objective

To enable older adults to contribute knowledge, skills, stories, encouragement, and community value.

### INT-007 — Intervention Components

- Advice or knowledge sharing
- Mentoring
- Community welcome roles
- Story contributions
- Recipe and craft sharing
- Peer encouragement
- Participant-led interest groups
- Contribution to family archives

### INT-007 — Mechanisms of Action

- Generativity
- Recognition
- Reciprocity
- Social role restoration
- Contribution
- Competence

### INT-007 — Proximal Outcomes

- Increased contribution
- Increased recognition by others
- Increased participation in community roles
- Increased perceived usefulness

### INT-007 — Healthy Aging Outcomes

- Purpose
- Meaning
- Belonging
- Self-efficacy
- Social participation

### INT-007 — Risks

- Tokenistic participation
- Exploitation of unpaid contributions
- Pressure to perform
- Public failure or embarrassment
- Unequal recognition

### INT-007 — Safeguards

- Voluntary participation
- Meaningful attribution
- No productivity targets
- Multiple contribution formats
- Recognition without competition

### INT-007 — Initial Evidence Status

**To be assigned after Knowledge Platform retrieval**

---

## INT-008 — Participant-Controlled Family and Care Network

### INT-008 — Primary Domain

**Family and Care Network**

### INT-008 — Secondary Domain

**Agency and Autonomy**

### INT-008 — Problem Addressed

- Family disconnection
- Fragmented communication
- Participants losing control of information
- Care relationships focusing only on clinical or task-based needs

### INT-008 — Objective

To create a permission-based network in which Participants can connect with family, friends, and caregivers while retaining control over access.

### Actor Types

- Participant
- Supporter
- Informal Caregiver
- Professional Caregiver

### Core Access Principle

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

### INT-008 — Intervention Components

- Relationship invitation
- Identity selection
- Participant approval
- Granular content permissions
- Temporary or permanent access
- Permission withdrawal
- Audit history
- Different views for different roles

### INT-008 — Mechanisms of Action

- Perceived control
- Trust
- Relationship continuity
- Safer information sharing
- Recognition of the Participant as a person

### INT-008 — Proximal Outcomes

- Increased authorised family interaction
- Increased trust in the platform
- Increased appropriate sharing
- Reduced unwanted access

### INT-008 — Healthy Aging Outcomes

- Autonomy
- Dignity
- Relationship quality
- Family connectedness
- Perceived control

### INT-008 — Risks

- Coercion
- Supporters overriding Participant choices
- Capacity and consent complexity
- Inappropriate caregiver access
- Accidental disclosure
- Role confusion
- Confusion between social data and health data

### INT-008 — Safeguards

- Deny by default with explicit consent and permission
- Minimum necessary access
- Clear permission summaries
- Audit logs
- Easy revocation
- Separation of social and clinical information
- Supported decision-making where appropriate
- Explicit handling of substitute decision-making
- Regular permission review

### INT-008 — Initial Evidence Status

**Ethically required platform foundation; empirical evaluation still needed**

---

## INT-009 — Ability-Adaptive Onboarding and Navigation

### INT-009 — Primary Domain

**Ability-Adaptive Access**

### INT-009 — Problem Addressed

- Digital exclusion
- Interfaces based on age stereotypes
- Visual, hearing, motor, cognitive, or digital-literacy barriers
- Abandonment caused by complex onboarding

### INT-009 — Objective

To adapt the interface to the user's abilities, preferences, and context rather than applying a single Senior Mode.

### INT-009 — Intervention Components

- Progressive onboarding
- Simple initial navigation
- Optional voice guidance
- Text-size adjustment
- Contrast adjustment
- Reduced motion
- Speech input
- Text-to-speech
- Adjustable timing
- Fewer simultaneous choices
- Interaction target resizing
- Repeated orientation cues
- User or supporter-configured preferences

### INT-009 — Mechanisms of Action

- Reduced cognitive load
- Reduced physical interaction burden
- Increased confidence
- Increased perceived competence
- Reduced anxiety
- Improved accessibility

### INT-009 — Proximal Outcomes

- Higher task completion
- Fewer navigation errors
- Reduced assistance required
- Increased confidence
- Increased sustained participation

### INT-009 — Healthy Aging Outcomes

- Digital inclusion
- Autonomy
- Participation
- Self-efficacy
- Ability to access other interventions

### INT-009 — Risks

- Incorrect adaptation
- Over-simplification
- Loss of user control
- Stigmatising interface changes
- Hidden functionality
- Inference of impairment without consent

### INT-009 — Safeguards

- Participant-controlled settings
- Preference before inference
- Explainable adaptations
- Reversible changes
- Correction and override
- No diagnostic labels
- No hidden capacity score
- No permission or consent change
- Regular confirmation of settings

### INT-009 — Initial Evidence Status

**E1–E2 candidate, pending accessibility and HCI evidence review**

---

## INT-010 — External Memory and Orientation Support

### INT-010 — Primary Domain

**Ability-Adaptive Access**

### INT-010 — Secondary Domain

**Agency and Autonomy**

### INT-010 — Problem Addressed

- Difficulty remembering plans, contacts, or previous intentions
- Disorientation within the digital environment
- Frustration caused by repeated memory testing

### INT-010 — Objective

To support users by reducing unnecessary reliance on recall.

### INT-010 — Intervention Components

- Clear reminders
- Visible current location within the interface
- Recent activity summaries
- Upcoming event prompts
- Saved intentions
- Recognisable people and context
- Step-by-step guidance
- Optional repetition
- Easy return to the home screen

### Core Principle

> Technology should compensate for memory limitations rather than repeatedly test them.

### INT-010 — Mechanisms of Action

- Recognition over recall
- Reduced cognitive load
- External memory support
- Improved orientation
- Increased task confidence

### INT-010 — Proximal Outcomes

- Fewer abandoned tasks
- Reduced confusion
- Increased successful participation
- Increased independence in platform use

### INT-010 — Healthy Aging Outcomes

- Autonomy
- Digital participation
- Confidence
- Functional support

### INT-010 — Risks

- Incorrect reminders
- Overreliance on the system
- Disclosure of private information
- Patronising language
- Confusion between supportive information and verified fact

### INT-010 — Safeguards

- User confirmation
- Source visibility
- Easy correction
- Neutral language
- No quizzes unless explicitly part of an evidence-supported intervention
- Privacy-aware notifications

### INT-010 — Initial Evidence Status

**To be assigned after Knowledge Platform retrieval**

---

# 6.1 Current MVP InterventionConfiguration

Document 18 selects **Participant-Controlled Life Story and Meaningful Human Connection** as the current MVP vertical slice.

This is a governed composition of exact InterventionVersions rather than an untracked feature bundle.

## Required Core Interventions

- **INT-009 — Ability-Adaptive Onboarding and Navigation**
- **INT-004 — Life Story and Participant-Controlled Personal Archive**
- **INT-001 — Structured Social Connection**
- **INT-002 — Interest-Based Connection and Open Matching**

## Controlled AI Layer

- **INT-003 — AI Companion-Facilitated Human Connection**

INT-003 is enabled only for approved roles, tasks, Prompts, Tools, data classes and Participant choices.

## Controlled Optional Interventions

- **INT-005 — Intergenerational Story Sharing**
- **INT-008 — Participant-Controlled Family and Care Network**
- **INT-010 — External Memory and Orientation Support**

The M03 Relationship, Consent and Permission capability remains required even when the INT-008 intervention is not enabled.

## Alternative Completion Pathways

A Participant may complete the social-connection component through:

- an existing authorised contact;
- a governed Community activity;
- or an opt-in Open Matching Connection.

Declining Community or Open Matching does not remove unrelated intervention access.

## MVP Intervention Pathway

```text
INT-009 Ability-Adaptive Onboarding
        ↓
Granular Consent and Participant Choice
        ↓
INT-004 Private Life Story and Participant Confirmation
        ↓
Optional Selected Sharing or Governed Community
        ↓
INT-001 Structured Social Connection
        ↓
Existing Contact
or
INT-002 Opt-In Open Matching
        ↓
Independent MatchDecision
        ↓
MutualAcceptance
        ↓
Connection and Limited Messaging
        ↓
INT-003 Optional AI Assistance Across Approved Steps
        ↓
Meaningful Human Interaction
        ↓
Reflection and Follow-Up
```

The intended intervention target is a meaningful human interaction.

Life Story may support identity, meaning and conversation readiness.

Community and Open Matching create optional human opportunities.

The AI Companion is not the relationship target.

## MVP Scope Classification

### Core

Core scope includes:

- accessible onboarding;
- granular Consent;
- private Life Story;
- Participant confirmation;
- one governed CommunitySpace;
- PublicProfile where required;
- opt-in Open Matching;
- MatchExplanation;
- independent MatchDecision;
- MutualAcceptance;
- Connection;
- limited messaging;
- Block;
- Report;
- human moderation;
- SafetySignal and SafetyEvent separation;
- approved AI explanation or Draft assistance;
- assessment;
- DatasetDefinition;
- DatasetLock;
- AnalysisRun;
- ResearchFinding;
- and InterventionDecision.

### Controlled Optional

Controlled Optional scope may include:

- Supporter Life Story contribution;
- intergenerational sharing;
- Life Story audio or image;
- transcription or translation;
- AIMemoryItem;
- confirmed AI SocialPost action;
- confirmed AI MatchDecision action;
- confirmed AI Message send;
- read receipts;
- video;
- and INT-010 orientation support.

Every enabled optional component requires Protocol, Consent, safety, evaluation, fallback and feature-flag readiness.

### Deferred or Prohibited for the First Pilot

The first Pilot excludes:

- anonymous Community participation;
- unmoderated social spaces;
- unrestricted Internet Public publication;
- unrestricted people search;
- unrestricted direct messaging;
- viral or controversy-optimised feed design;
- advertising or influencer mechanics;
- broad peer marketplace;
- autonomous AI matching;
- autonomous Connection creation;
- autonomous Message sending;
- fake social agents or social proof;
- unrestricted AI companionship;
- clinical diagnosis;
- medication management;
- and emergency-response service.

Governed Community, controlled Platform Public participation and opt-in Open Matching are **not** Non-Goals.

## MVP Configuration Requirements

The configuration must define:

- target population and setting;
- approved ProtocolVersion;
- exact InterventionVersions;
- required and optional components;
- sequence, dose and pathway-specific completion;
- accessibility and adaptation range;
- Life Story prompts, modalities, confirmation and visibility;
- CommunitySpace, CommunityRuleVersion and moderation plan;
- Platform Public and Internet Public policy;
- MatchPreference purpose, allowed attributes, availability, pause and withdrawal;
- MatchCandidate limit and expiry;
- MatchExplanation rules;
- MatchDecision and MutualAcceptance rules;
- Connection and communication basis;
- Message Draft, send, delivery, retention, Block and Report;
- Supporter involvement;
- AIInterventionConfigurationVersion;
- SafetySignal, SafetyEvent, pause and stop rules;
- measurements;
- DatasetDefinition;
- burden, accessibility, equity and implementation;
- fidelity;
- withdrawal and deletion propagation;
- and evaluation.

## MVP Fidelity Requirements

Fidelity must verify:

- the approved INT-009 adaptation range;
- the approved INT-004 version and Private default;
- Participant confirmation before testimony or sharing;
- the approved INT-001 social pathway;
- the approved INT-002 allowed attributes and matching policy;
- matching inactive by default;
- independent MatchDecisions;
- MutualAcceptance before Connection;
- no active Block at discovery, candidate, MutualAcceptance, Connection or Message action;
- valid communication basis;
- Message Draft separate from send and delivery;
- the approved INT-003 AI configuration;
- no autonomous AI Connection or Message;
- human moderation and Safety review;
- the Participant's ability to decline, pause, Block, Report, disconnect or withdraw;
- exposure states rather than assignment alone;
- and linkage to exact Protocol, Intervention and AI versions.

---

# 7. Cross-Intervention Architecture


Interventions are not isolated.

They may:

- enable;
- depend on;
- support;
- constrain;
- or modify

one another.

A representative pathway is:

```text
Ability-Adaptive Access
        ↓
Participant-Controlled Consent and Permission
        ↓
Private Life Story and Identity Expression
        ↓
Governed Community or Existing Contact
        ↓
Opt-In Open Matching where Chosen
        ↓
Independent MatchDecision and MutualAcceptance
        ↓
Connection, Limited Messaging and Human Interaction
        ↓
Reflection, Identity, Contribution and Relationship Development
        ↓
Healthy Aging Outcomes
```

The AI Companion may support multiple approved interventions:

```text
AI Companion
    ├── supports → Accessible Navigation
    ├── supports → Life Story Drafting and Review
    ├── supports → Community and PublicProfile Drafting
    ├── supports → MatchPreference Drafting
    ├── explains → MatchCandidate
    ├── supports → Message Drafting and Human-Contact Preparation
    ├── supports → Reflection
    ├── supports → Permission and Safety Explanation
    ├── proposes → Confirmed Owning-Domain Tool Action
    ├── raises → SafetySignal
    └── requests → Human Review
```

The AI Companion should not become:

- the primary Healthy Aging outcome;
- the sole relationship;
- the evidence source;
- or the approval authority.

## 7.1 Intervention Composition Rules

A composed InterventionConfiguration should identify:

- exact primary and enabling InterventionVersions;
- required, optional and deferred components;
- Participant pathways and alternatives;
- dependencies;
- sequence and dose;
- exposure and completion rules;
- Life Story, Community, matching, Connection and messaging boundaries;
- visibility and publication;
- Block, Report, moderation and Safety;
- AI role and Action Levels;
- shared and unique outcomes;
- overlapping risks;
- combined Participant, Supporter, Moderator and operational burden;
- permission and Consent requirements;
- DatasetDefinition and evaluation;
- feature flags and rollback;
- and possible interaction effects.

The Evidence Status of one component does not automatically transfer to the full composition.

# 8. Intervention-to-Outcome Summary

| Intervention | Primary Mechanism | Proximal Outcome | Intended Healthy Aging Outcome |
|---|---|---|---|
| **INT-001 Structured Social Connection** | Reduced initiation burden and reciprocity | Meaningful human interaction | Social connectedness |
| **INT-002 Interest-Based Connection and Open Matching** | Shared identity | Sustained conversation | Friendship and belonging |
| **INT-003 AI Companion-Facilitated Human Connection** | Reduced communication burden | More completed contact attempts | Relationship continuity |
| **INT-004 Life Story and Participant-Controlled Personal Archive** | Identity expression and recognition | Greater self-expression | Identity continuity |
| **INT-005 Intergenerational Story Sharing** | Reciprocity and shared identity | Meaningful intergenerational conversation | Intergenerational connectedness |
| **INT-006 Meaningful Daily Engagement** | Enjoyment, mastery, and relevance | Participation in valued activity | Well-being and purpose |
| **INT-007 Contribution and Purpose** | Generativity and recognition | Increased contribution | Meaning and self-efficacy |
| **INT-008 Participant-Controlled Family and Care Network** | Trust and perceived control | Appropriate sharing | Autonomy and relationship quality |
| **INT-009 Ability-Adaptive Onboarding and Navigation** | Reduced interaction burden | Successful platform use | Digital inclusion and autonomy |
| **INT-010 External Memory and Orientation Support** | Recognition over recall | Reduced confusion | Functional support and participation |

# 9. Measurement Architecture

The Intervention Map should reference distinct measurement domains rather than one generic engagement score.

Required domains are:

1. implementation and fidelity;
2. process and exposure;
3. engagement and experience;
4. proximal and Healthy Aging outcomes;
5. burden, harm, moderation and Safety;
6. accessibility and equity;
7. qualitative meaning and context;
8. AI quality and boundary adherence where applicable;
9. sustainability and operational feasibility.

Specific constructs, MeasurementVersions and instruments are governed through EvidenceDecisions and ProtocolVersions.

## 9.1 Implementation and Fidelity Measures

Examples include:

- intervention component offered;
- exact InterventionVersion and configuration;
- pathway;
- required dose;
- delivery mode;
- adaptation;
- Supporter assistance;
- Moderator or operational support;
- ProtocolDeviation;
- AIInterventionConfigurationVersion;
- and completion against the pathway-specific definition.

## 9.2 Process and Exposure Measures

Examples include:

- invitation accepted;
- Consent completed;
- onboarding completed;
- Life Story activity offered;
- LifeStoryItem Draft created;
- Participant confirmation;
- visibility selected;
- Community joined or declined;
- SocialPost Drafted or published;
- Open Matching offered or declined;
- MatchPreference activated;
- MatchCandidate generated or viewed;
- MatchExplanation viewed;
- MatchDecision recorded;
- MutualAcceptance recorded;
- Connection activated;
- Message Drafted;
- send confirmed;
- Message sent or failed;
- human interaction attempted or completed;
- Block;
- Report;
- ModerationCase;
- SafetySignal;
- support requested;
- and withdrawal.

```text
Assigned
    ≠ Offered
    ≠ Viewed
    ≠ Started
    ≠ Completed
    ≠ Benefited
```

## 9.3 Engagement and Experience Measures

Potential measures include:

- relevance;
- clarity;
- trust;
- satisfaction;
- willingness to continue;
- perceived control;
- feeling heard;
- Community experience;
- MatchExplanation comprehension;
- Connection experience;
- AI usefulness;
- privacy confidence;
- and withdrawal experience.

Time spent, reactions, candidate acceptance and Message volume are not primary success measures.

## 9.4 Proximal and Healthy Aging Outcome Measures

Potential constructs include:

- confidence initiating contact;
- meaningful participation;
- social connectedness;
- loneliness where appropriate;
- relationship quality;
- belonging;
- autonomy;
- identity continuity;
- meaning;
- contribution;
- well-being;
- and digital inclusion.

A construct name does not identify an approved instrument.

A process event does not establish outcome change.

## 9.5 Qualitative Measures

Examples include:

- Participant interview;
- Supporter interview;
- researcher observation;
- Moderator or Safety operational reflection;
- usability session;
- open-ended activity reflection;
- Life Story experience;
- Community experience;
- matching experience;
- and experience sampling.

Qualitative evidence is particularly important for:

- meaning;
- identity;
- dignity;
- autonomy;
- relationship quality;
- rejection or non-response;
- social safety;
- burden;
- emotional experience;
- trust;
- and acceptability.

## 9.6 Burden, Harm, Moderation and Safety Measures

Every relevant intervention should identify measures for:

- distress;
- confusion;
- coercion;
- privacy concern;
- unwanted disclosure;
- unwanted contact;
- harassment;
- scam or fraud;
- repeated non-selection;
- dependency signal;
- digital fatigue;
- disclosure burden;
- social burden;
- Supporter burden;
- Moderator burden;
- Safety Reviewer burden;
- operational burden;
- relationship conflict;
- technical failure;
- Report;
- moderation decision and appeal;
- SafetySignal;
- SafetyEvent;
- and withdrawal.

```text
Fewer Reports
    ≠ Greater Safety

SafetySignal
    ≠ SafetyEvent
```

## 9.7 Accessibility and Equity Measures

Potential accessibility measures include:

- task completion;
- independent completion;
- support required;
- time;
- errors;
- adaptation use;
- comprehension;
- error recovery;
- and abandonment.

Equity evaluation should examine:

- recruitment;
- eligibility;
- support;
- Life Story participation;
- Community participation;
- MatchCandidate exposure;
- repeated non-selection;
- Connection;
- moderation;
- Safety;
- AI quality;
- burden;
- and outcome differences

across relevant populations and contexts.

## 9.8 AI Measures

Where INT-003 is enabled, measures may include:

- task;
- model alias;
- Prompt and Tool version;
- grounding;
- citation;
- Draft accepted, edited or rejected;
- invented Life Story detail;
- hidden matching feature attempt;
- unauthorised action attempt;
- confirmation;
- Human Review;
- SafetySignal;
- accessibility;
- latency;
- cost;
- and dependency indicators.

AI interaction volume is not evidence of human connection.

## 9.9 Sustainability and Operational Measures

Potential measures include:

- support time;
- Moderator response;
- Safety triage;
- provider reliability;
- technical reliability;
- training;
- cost;
- workload;
- maintenance;
- and readiness for replication.

# 10. Intervention Evaluation Principles


## 10.1 Evaluate the Intervention, Not Only the Interface

A usable interface does not prove that an intervention improves a meaningful outcome.

## 10.2 Distinguish Engagement From Benefit

More use does not necessarily mean more benefit.

## 10.3 Evaluate Intended and Unintended Effects

Every intervention should evaluate:

- intended benefit;
- burden;
- harm;
- accessibility;
- equity;
- autonomy;
- dignity;
- relationship impact;
- and withdrawal.

## 10.4 Evaluate Exposure and Fidelity

An absent outcome may reflect:

- low exposure;
- delivery failure;
- the wrong version;
- inaccessible design;
- poor fidelity;
- or failure of the proposed mechanism.

## 10.5 Evaluate Across Different Participants and Contexts

Evaluation should consider:

- ability;
- digital experience;
- living setting;
- social context;
- language;
- culture;
- device access;
- relationship availability;
- and support availability.

## 10.6 Preserve Scientific Uncertainty

The platform should report:

- beneficial findings;
- null findings;
- negative findings;
- mixed findings;
- harmful findings;
- implementation failure;
- unintended outcomes;
- and inconclusive findings.

## 10.7 Preserve Participant Meaning

A statistically measurable outcome may still fail to reflect what Participants value.

## 10.8 Human Approval

The AI Companion may assist analysis and drafting.

Authorised human researchers remain accountable for Research Findings and Intervention Decisions.

# 11. Knowledge Platform Integration

Each intervention should connect to the **Healthy Aging Knowledge Platform** through versioned Knowledge References.

```text
Intervention
    ├── addresses → Healthy Aging Challenge
    ├── applies_to → Population and Context
    ├── informed_by → Theory
    ├── supported_or_challenged_by → Evidence
    ├── operates_through → Mechanism
    ├── contains → Intervention Component
    ├── intends_to_affect → Outcome
    ├── measured_by → Measurement
    ├── has_burden → Burden
    ├── has_risk → Risk
    └── has_gap → Knowledge Gap
```

The Knowledge Platform should support questions such as:

- What evidence supports or challenges this intervention?
- Is the evidence direct or indirect?
- For which populations and settings has it been studied?
- Which mechanisms are supported?
- Which outcomes were measured?
- Which instruments were used?
- What burdens or harms were reported?
- What accessibility or equity limitations exist?
- Which evidence conflicts?
- What remains unknown?
- What changed since the approved Evidence Decision?

The Research Platform may:

- search the Knowledge Platform;
- retrieve Knowledge References;
- create Evidence Decisions;
- create Evidence Snapshots;
- monitor evidence changes;
- and prepare external submission packages.

It may not edit external authoritative evidence, change ontology, or publish authoritative knowledge without Knowledge Platform governance.

# 12. Intervention Prioritisation Framework

Proposed interventions should be prioritised according to:

| Criterion | Key Question |
|---|---|
| **Participant Importance** | Does this address a meaningful Participant-defined challenge? |
| **Evidence Strength and Direction** | What evidence supports, challenges, or restricts it? |
| **Mechanism Clarity** | Is the causal pathway explicit and plausible? |
| **Safety** | Can foreseeable risks be adequately controlled? |
| **Burden** | Is Participant, Supporter, and operational burden acceptable? |
| **Accessibility** | Can people with different abilities participate? |
| **Equity** | Who may be excluded or disproportionately burdened? |
| **Autonomy** | Does it preserve choice and control? |
| **Human Connection** | Does it support rather than replace relationships? |
| **Measurability** | Can exposure, fidelity, outcomes, burden, and harm be evaluated? |
| **Dependency Readiness** | Are required capabilities and governance available? |
| **Technical Feasibility** | Can it be responsibly implemented? |
| **Operational Feasibility** | Can it be supported in the intended setting? |
| **Research Value** | Does it address an important Knowledge Gap? |

A proposed intervention should not be prioritised solely because it is technically impressive.

## 12.1 Impact–Evidence Priority Matrix

| | **Stronger and More Direct Evidence** | **Weaker, Indirect, or Conflicting Evidence** |
|---|---|---|
| **Higher Participant Importance** | **Implementation Candidate** — subject to safety, co-design, feasibility, and governance | **Research Priority** — investigate through bounded study before strong claims or broad deployment |
| **Lower Participant Importance** | **Selective or Enabling Capability** — retain where it supports a higher-priority intervention | **Defer or Reject** — do not prioritise without a stronger problem case |

The matrix is a decision aid.

It does not override:

- consent;
- safety;
- autonomy;
- accessibility;
- equity;
- governance;
- or dependency readiness.

## 12.2 Prioritisation Record

A prioritisation record should include:

- Participant importance;
- expected benefit;
- Evidence Status;
- Evidence Direction;
- directness;
- mechanism clarity;
- safety;
- burden;
- autonomy;
- accessibility;
- equity;
- human-connection impact;
- measurability;
- dependency readiness;
- technical feasibility;
- operational feasibility;
- research value;
- final decision;
- decision owner;
- and narrative rationale.

A total score must not hide a critical weakness.

# 13. Current Priority Architecture

## Required MVP Intervention Portfolio

1. **INT-009 — Ability-Adaptive Onboarding and Navigation**
2. **INT-004 — Life Story and Participant-Controlled Personal Archive**
3. **INT-001 — Structured Social Connection**
4. **INT-002 — Interest-Based Connection and Open Matching**

## Controlled MVP AI Layer

5. **INT-003 — AI Companion-Facilitated Human Connection**

## Controlled Optional MVP Interventions

6. **INT-005 — Intergenerational Story Sharing**
7. **INT-008 — Participant-Controlled Family and Care Network**
8. **INT-010 — External Memory and Orientation Support**

## Portfolio Expansion and Research Interventions

9. **INT-006 — Meaningful Daily Engagement**
10. **INT-007 — Contribution and Purpose**

This ordering describes the current InterventionConfiguration and evidence-learning strategy.

It does not mean that M03 Relationship, Consent and Permission controls are optional.

It is not a permanent product roadmap and does not establish evidence superiority.

# 14. Initial Dependency View

The current conceptual dependency sequence is:

```text
Governance, Identity, Consent and Permission
        ↓
Ability-Adaptive Onboarding
        ↓
Private Life Story and Participant Confirmation
        ↓
Block, Report, Moderation and Safety Readiness
        ↓
Structured Social Connection and Governed Community
        ↓
Opt-In Open Matching
        ↓
Independent MatchDecision and MutualAcceptance
        ↓
Connection and Communication Basis
        ↓
Limited Messaging and Human Interaction
        ↓
Reflection, Assessment and Evaluation
```

Initial dependencies include:

| Intervention | Important Dependencies |
|---|---|
| **INT-001 Structured Social Connection** | identity, granular Consent, accessible interaction, governed Community, Block, Report, moderation, SafetySignal, pathway completion and measurement |
| **INT-002 Interest-Based Connection and Open Matching** | PublicProfile separation, Participant-controlled MatchPreference, allowed attributes, policy version, MatchExplanation, candidate expiry, independent MatchDecisions, MutualAcceptance, Block, moderation, fairness and alternative pathways |
| **INT-003 AI Companion-Facilitated Human Connection** | AI identity, Effective AI Permission, Context Assembly, approved Prompt and Tool versions, Draft state, confirmation, owning-domain result, Human Review, safety evaluation, provider governance and kill switch |
| **INT-004 Life Story and Participant-Controlled Personal Archive** | Participant ownership, Private default, authorship, proposed-detail review, confirmation, granular visibility, reuse rights, media management, sensitive-topic safeguards, withdrawal, export and AI invention controls |
| **INT-005 Intergenerational Story Sharing** | INT-004 capabilities, authorised Relationship, contribution attribution, Participant review, correction, conflict controls and voluntary reciprocity |
| **INT-006 Meaningful Daily Engagement** | accessible activity delivery, purpose labels, difficulty adaptation, non-addictive design and activity-specific evidence |
| **INT-007 Contribution and Purpose** | governed Community roles, attribution, moderation, voluntary participation, safeguarding and non-exploitative governance |
| **INT-008 Participant-Controlled Family and Care Network** | identity, Relationship verification, Consent, delegation, purpose, Specific Permission, Resource State, audit and supported decision-making |
| **INT-009 Ability-Adaptive Onboarding and Navigation** | preference model, reversible settings, accessible components, content adaptation, Supporter-assisted rules and measurement comparability |
| **INT-010 External Memory and Orientation Support** | source-aware information, freshness, correction, privacy-aware notification, confirmation and no diagnostic inference |

## 14.1 Social-Safety Release Dependency

Community and Open Matching are enabled only when:

- Block and Report are available;
- CommunityRuleVersion and matching policy are approved;
- human moderation is staffed;
- SafetySignal triage is operational;
- prohibited matching feature tests pass;
- MatchExplanation is understandable;
- MutualAcceptance and Connection constraints pass;
- messaging has a valid communication basis;
- scam and harassment controls are operational;
- and pause or rollback is available.

## 14.2 Research Dependency

A Pilot configuration also depends on:

- approved ResearchQuestions;
- EvidenceDecision and EvidenceSnapshot;
- approved ProtocolVersion;
- exact InterventionVersions;
- approved AIInterventionConfigurationVersion where applicable;
- MeasurementVersions;
- DatasetDefinition;
- AnalysisPlan;
- and Pilot readiness.

This dependency view is an intervention architecture baseline.

Documents 8, 12, 15 and 16 remain authoritative for the exact domain, data, interface and storage implementation.

# 15. Open Questions

1. Which EvidenceStatus and EvidenceDirection should be assigned to each initial InterventionVersion?
2. Which ResearchQuestions are primary for the first Pilot?
3. Which exact population, setting and cohort structure apply?
4. What is the approved dose and pathway-specific completion definition?
5. Is one Life Story activity required, offered or replaceable with an alternative?
6. Which Life Story prompts, modalities and sharing rights are enabled?
7. Is Platform Public enabled, or is Community visibility sufficient?
8. Is Internet Public disabled for the entire Pilot?
9. Which CommunitySpaces and CommunityRuleVersions are approved?
10. Are comments, reactions and Life Story references enabled in Community?
11. Which Moderator response targets and appeals are required?
12. Which matching purpose and allowed attributes are approved?
13. Which broad location granularity is permitted?
14. How many MatchCandidates may be delivered and when do they expire?
15. Which MatchDecision states are reversible?
16. What exact domain representation and event establish MutualAcceptance?
17. Is direct ConnectionRequest deferred or permitted as another Connection basis?
18. Which pathway-specific rules define a completed human interaction?
19. Which Message modalities, attachments and delivery providers are enabled?
20. Are read receipts disabled?
21. Which scam, link and unwanted-contact controls are required?
22. Which Block effects must propagate synchronously?
23. Which INT-003 roles and ActionLevels are enabled?
24. Which Participant data classes may enter AI Context?
25. Is AIMemoryItem enabled?
26. Which AI invention, matching, moderation and safety thresholds block release?
27. Which ability adaptations are required for INT-009?
28. Which adaptations may affect fidelity or Measurement comparability?
29. Is INT-008 enabled as an intervention or only represented through core M03 controls?
30. Are Supporter Life Story contributions enabled?
31. Is INT-005 included in the first cohort or deferred?
32. Is INT-010 enabled for all Participants or only by need?
33. Which measures assess meaningful interaction, identity continuity, autonomy and burden?
34. Which social process measures enter DatasetDefinition?
35. Are full Life Story narrative, SocialPost content and Message content excluded from analysis?
36. Which moderation and Safety data require restricted datasets?
37. Which changes require a new InterventionVersion?
38. Which changes require Protocol amendment or Re-Consent?
39. Which conditions require Participant-, feature-, cohort- or study-level pause?
40. Which ResearchFindings justify Retain, Revise, Restrict, Replicate, Expand, Suspend, Retire or Continue Exploratory Research?

# 16. Design Decisions Established by This Map

This document establishes that:

1. Platform capabilities, product features, intervention components, mechanisms, outcomes and ResearchFindings are distinct concepts.
2. An intervention requires a defined challenge, population, context, purpose, mechanism, outcome, risk, safeguard and evaluation pathway.
3. Every intervention has a stable canonical identifier.
4. Intervention identifiers do not encode version, lifecycle, EvidenceStatus, deployment, Protocol or Organisation.
5. Interventions use immutable InterventionVersions.
6. Material intervention changes require a new InterventionVersion.
7. InterventionVersion state, intervention lifecycle, EvidenceStatus, EvidenceDirection, Protocol state and deployment state are separate.
8. EvidenceStatus describes evidence maturity and directness, not whether findings are positive.
9. EvidenceDirection is recorded separately.
10. EvidenceStatus is assigned through an approved EvidenceDecision.
11. Evidence does not automatically transfer across populations, settings, components, modalities, AI configurations, mechanisms or claims.
12. Positive, null, negative, mixed, harmful, failed and inconclusive findings are retained.
13. The Healthy Aging Knowledge Platform is the authoritative external knowledge system.
14. The Healthy Aging Knowledge Graph is a capability inside the Knowledge Platform.
15. The Research Platform stores KnowledgeReferences, EvidenceDecisions, InterventionVersions and ResearchFindings.
16. Participant is the canonical domain actor.
17. Older adult is a population description.
18. Resident is a setting-specific term.
19. Supporter is the canonical authorised assistance role.
20. AI Companion is the canonical AI product and system name.
21. AI Companion-Facilitated Human Connection is the canonical INT-003 name.
22. Interest-Based Connection and Open Matching is the canonical INT-002 name.
23. The canonical Intervention Map contains seven intervention domains.
24. Family, friendship, caregiving status or Connection does not create authority.
25. INT-008 uses the complete permission formula defined by Document 4.
26. M03 Relationship, Consent and Permission controls remain required even when INT-008 is not enabled as an intervention.
27. Ability adaptation may change presentation and support but not rights, Consent meaning, permission, Protocol, intervention purpose, outcome definition or scientific claim.
28. AI may support interventions only through an approved AIInterventionConfigurationVersion.
29. AI interaction volume is not a Healthy Aging outcome.
30. Message Draft, send, provider acceptance and delivery are separate.
31. Engagement and social activity measures are process indicators unless an approved MeasurementVersion supports another interpretation.
32. Burden, harm, accessibility, equity, fidelity, moderation, Safety and implementation are required evaluation dimensions.
33. Intervention composition does not automatically inherit the EvidenceStatus of its components.
34. The current MVP is Participant-Controlled Life Story and Meaningful Human Connection.
35. The required MVP intervention portfolio is INT-009, INT-004, INT-001 and INT-002.
36. INT-003 is a controlled AI layer rather than the relationship target.
37. INT-005, INT-008 and INT-010 are Controlled Optional interventions.
38. INT-006 and INT-007 remain portfolio expansion and research interventions.
39. Private Life Story is part of the current MVP.
40. LifeStoryItem confirmation remains Participant-controlled.
41. AI Draft is not Participant Testimony.
42. Supporter Contribution is not Participant Testimony.
43. Life Story is Private by default.
44. Visibility and reuse rights are separate.
45. Platform Public and Internet Public are separate.
46. Internet Public is disabled by default for the first Pilot.
47. Governed Community is in current MVP scope.
48. Anonymous and unmoderated Community is excluded.
49. Community activity volume is not a Healthy Aging outcome.
50. Open Matching is in current MVP scope and inactive by default.
51. Open Matching uses approved declared attributes.
52. Diagnosis, vulnerability, private Life Story, Messages, Safety records and precise location are prohibited matching inputs by default.
53. MatchCandidate is not MatchDecision, MutualAcceptance or Connection.
54. Each Participant records their own MatchDecision.
55. MutualAcceptance requires compatible independent decisions and current policy checks.
56. MutualAcceptance precedes Connection.
57. Connection does not create Supporter, care or research authority.
58. No MatchCandidate state does not imply Participant failure.
59. Internal matching rank is not objective compatibility.
60. Messaging requires a valid communication basis.
61. AI cannot create MutualAcceptance or Connection.
62. AI cannot send a Message without authorised confirmation.
63. Block is checked before discovery, candidate delivery, MutualAcceptance, Connection and messaging.
64. Report remains available after Block or Disconnect.
65. High-impact moderation is human-accountable.
66. SafetySignal and SafetyEvent remain separate.
67. Automated systems and AI may raise SafetySignals but cannot confirm SafetyEvents.
68. The MVP supports existing-contact, governed Community and Open Matching pathways.
69. Declining Community or Open Matching does not remove unrelated intervention access.
70. A meaningful human interaction remains the central behavioural target.
71. Assignment, availability, exposure, completion and benefit remain separate.
72. DatasetDefinition and AnalysisPlan are intervention-research dependencies.
73. Intervention prioritisation is not driven by technical novelty or engagement volume.
74. Safety, Consent, autonomy, accessibility, equity and governance may override priority scores.
75. Research and intervention history preserves suspension, failure, null findings, harmful findings, supersession and retirement.
76. The AI Companion may assist retrieval and Drafting but cannot approve InterventionVersions, EvidenceStatus, Protocols, ModerationDecisions, SafetyEvents, DatasetLocks, ResearchFindings or Knowledge publication.
77. Version 2.3 resolves HC-001 by including governed Community and opt-in Open Matching while excluding uncontrolled social-network forms.
78. Version 2.3 applies HC-009 terminology by preferring Governed Community, Platform Public, Internet Public and Open Matching.

# 17. Relationship to Other Documents

This Intervention Map translates the project vision and conceptual framework into implementation-neutral intervention records and ResearchProject-specific InterventionConfigurations.

It provides intervention requirements for:

- Document 4 roles, Relationships, Consent, delegation, purpose and permission;
- Document 5 ability-adaptive design;
- Documents 6 and 7 product modules and information architecture;
- Document 8 domain entities, invariants and ownership;
- Document 9 Knowledge Platform integration and evidence retrieval;
- Documents 10 and 17 AI Companion behaviour and operations;
- Document 11 research and evaluation;
- Documents 12–16 data, technical, security, API and storage implementation;
- Document 18 MVP scope and sequencing;
- Document 19 the draft Pilot Protocol;
- and Document 20 UX flows and design system.

Later documents may refine implementation for their authorised scope.

They must not remove or silently redefine an intervention's:

- challenge;
- population;
- context;
- purpose;
- mechanism;
- exact required component;
- evidence uncertainty;
- risk;
- safeguard;
- Consent or permission implication;
- visibility or social-safety boundary;
- exposure definition;
- outcome;
- or evaluation requirement

without revising the relevant InterventionVersion and governance artefacts.

Document 3 defines intervention requirements.

It does not independently define the exact aggregate, event, database or interface representation of `MutualAcceptance`, `Connection` or `Message`; those contracts remain governed by Documents 8, 15 and 16.

# 18. Summary

The Intervention Map translates the Platform's conceptual and evidence framework into a governed portfolio of versioned digital interventions.

Its central structure is:

```text
Healthy Aging Challenge
        ↓
Population and Context
        ↓
EvidenceDecision
        ↓
InterventionVersion
        ↓
InterventionConfiguration
        ↓
Components, Mechanisms and Pathways
        ↓
Exposure and Fidelity
        ↓
Process, Experience and Healthy Aging Outcomes
        ↓
Burden, Harm, Accessibility, Equity, Moderation and Safety
        ↓
Dataset and Evaluation
        ↓
ResearchFinding
        ↓
InterventionDecision
```

The initial intervention portfolio contains:

- INT-001 — Structured Social Connection;
- INT-002 — Interest-Based Connection and Open Matching;
- INT-003 — AI Companion-Facilitated Human Connection;
- INT-004 — Life Story and Participant-Controlled Personal Archive;
- INT-005 — Intergenerational Story Sharing;
- INT-006 — Meaningful Daily Engagement;
- INT-007 — Contribution and Purpose;
- INT-008 — Participant-Controlled Family and Care Network;
- INT-009 — Ability-Adaptive Onboarding and Navigation;
- and INT-010 — External Memory and Orientation Support.

The current MVP InterventionConfiguration is:

```text
INT-009 Ability-Adaptive Onboarding
        ↓
Granular Consent
        ↓
INT-004 Private Life Story
        ↓
Participant Confirmation
        ↓
INT-001 Structured Social Connection
        ↓
Existing Contact, Governed Community
or
INT-002 Opt-In Open Matching
        ↓
Independent MatchDecision
        ↓
MutualAcceptance
        ↓
Connection and Limited Messaging
        ↓
INT-003 Optional Governed AI Assistance
        ↓
Meaningful Human Interaction
        ↓
Reflection, Assessment and Follow-Up
```

The central social boundary is:

```text
Governed Community
    ≠ Unrestricted Internet-Public Social Network

MatchCandidate
    ≠ MatchDecision
    ≠ MutualAcceptance
    ≠ Connection
```

The central AI boundary is:

```text
AI Draft
    ≠ Participant Testimony
    ≠ Published Social Content
    ≠ Sent Message
    ≠ Human Decision
```

The central evaluation boundary is:

```text
Platform Activity
    ≠ Intervention Exposure
    ≠ Healthy Aging Outcome
```

The central rule is:

> Every intervention must remain traceable from a meaningful Healthy Aging challenge to an approved definition, evidence basis, mechanism, delivery configuration, Participant experience, social-safety boundary, measurable outcome, evaluation and accountable human decision.
