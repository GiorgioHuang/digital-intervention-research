# Document 19 — Initial Pilot Research Protocol

**Version:** 1.2  
**Status:** Revised Protocol Baseline — M18 Revalidated — Draft for Governance and Ethics Review  
**Handbook Volume:** Volume III — Delivery & Research Implementation  
**Primary System:** Digital Intervention Research Platform  
**Primary Product Modules:** M01–M18  
**Study Type:** Prospective Single-Arm Mixed-Method Feasibility Pilot  
**Intervention:** Participant-Controlled Life Story and Meaningful Human Connection  
**Protocol Owner:** Principal Investigator and Research Governance  
**Approved By:** To be assigned  
**Last Updated:** 2026-07-29  
**Supersedes:** Document 19 — Initial Pilot Research Protocol v1.1  
**Protocol Identifier:** To be assigned  
**Protocol Version Effective Date:** To be assigned after approval  
**Registration Requirement:** To be determined by the approving institution and study purpose  
**Review Trigger:** A material change to ResearchQuestions, target population, sample, setting, recruitment, Consent, intervention components, Life Story, Community, Open Matching, MatchDecision, MutualAcceptance, ConnectionRequest, Connection, CommunicationBasis, ConversationThread, Message lifecycle or delivery, provider contracts, moderation, Safety, AI configuration, measurements, DatasetDefinition, AnalysisPlan, retention, Participant burden, pause criteria or dissemination

---

## 1. Protocol Title

**A Feasibility, Acceptability, Accessibility and Operational Safety Pilot of a Participant-Controlled Digital Intervention Combining Life Story, Governed Community and Meaningful Human Connection in Older Adults**

Short title:

> **Participant-Controlled Life Story and Meaningful Connection Pilot**

---

## 2. Protocol Purpose

This Protocol defines the first controlled real-world study of the integrated MVP described in Document 18.

It specifies:

- why the study is being conducted;
- who may participate;
- what Participants will experience;
- how Life Story, Community and Open Matching are used;
- how human interaction remains the behavioural target;
- how AI is governed;
- how moderation and Safety operate;
- what data are collected;
- how the DatasetVersion is generated and locked;
- how analysis and interpretation are governed;
- and what evidence is required before the intervention may be retained, revised, restricted, replicated, expanded, suspended or retired.

This Protocol remains a draft until formally approved.

---

## 3. Protocol Position in the Platform

```text
ResearchQuestion
        ↓
EvidenceReview and EvidenceDecision
        ↓
EvidenceSnapshot
        ↓
ProtocolVersion
        ↓
InterventionVersion and InterventionConfiguration
        ↓
AIInterventionConfigurationVersion
        ↓
Consent, Screening and Enrolment
        ↓
Private Life Story and Participant Confirmation
        ↓
Governed Community or Existing Authorised Contact
        ↓
Opt-In Open Matching where Chosen
        ↓
Independent MatchDecision by Each Actor
        ↓
MutualAcceptance
        ↓
Connection
        ↓
CommunicationBasis
        ↓
ConversationThread and Message Process
        ↓
Meaningful Human Interaction
        ↓
Assessment, Observation, Moderation and Safety
        ↓
DatasetDefinition and DatasetVersion
        ↓
DatasetLock
        ↓
AnalysisPlan and AnalysisRun
        ↓
InterpretationRecord
        ↓
ResearchFinding
        ↓
InterventionDecision
```

The approved ProtocolVersion is immutable.

Any material amendment creates a new ProtocolVersion.

### 3.1 v1.2 Revalidation Result

Version 1.2 revalidates this Protocol against:

- Document 8 v3.2 — canonical M18 domain model;
- Document 12 v1.2 — data meaning and research boundaries;
- Document 13 v1.2 — runtime and provider boundaries;
- Document 15 v1.2 — API, event and AI Tool contracts;
- Document 16 v1.2 — persistence constraints; and
- Document 18 v1.2 — revised MVP scope and delivery gates.

`ConnectionRequest` is feature-disabled for this Pilot.

Existing authorised contacts may support a human-interaction pathway without an M18 Connection. Platform messaging for that pathway still requires an approved CommunicationBasis.

Message Draft, SendConfirmation, queue, send, provider acceptance, delivery, failure and read are separate research-process states.

## 4. Background

Meaningful human connection is a core part of Healthy Aging.

Older adults may experience barriers to initiating or maintaining contact, including:

- reduced confidence;
- sensory or motor barriers;
- cognitive burden;
- fatigue;
- communication difficulty;
- changing routines;
- reduced social network;
- mobility limitations;
- concern about burdening others;
- lack of appropriate contacts;
- difficulty identifying shared interests;
- uncertainty about digital communication;
- and concern about privacy or scams.

Digital systems may support human connection, but they may also create:

- inaccessible interaction;
- pressure to share;
- unwanted contact;
- misleading compatibility claims;
- privacy exposure;
- social comparison;
- harassment or fraud;
- excessive platform engagement;
- AI substitution;
- and dependency.

This Pilot therefore tests a controlled intervention in which:

- Life Story supports identity, meaning and conversation;
- Community is governed and optional;
- Open Matching is opt-in and explainable;
- Connection requires independent decisions and MutualAcceptance;
- messaging is limited and confirmed;
- Block and Report are always available;
- moderation and Safety are human-accountable;
- AI assists without becoming the relationship;
- and research use remains purpose-bound and reproducible.

---

## 5. Healthy Aging Challenge

The selected challenge is:

> Older adults may want meaningful social contact but face practical, cognitive, accessibility, confidence or network barriers to initiating and sustaining it.

The intervention does not define social connection as maximum contact frequency.

Meaningful connection may involve:

- being heard;
- sharing a story;
- participating in a shared interest;
- maintaining an existing relationship;
- establishing a new voluntary connection;
- or completing a manageable interaction chosen by the Participant.

---

## 6. Conceptual Model

```text
Ability-Adaptive Onboarding
        +
Participant-Controlled Life Story
        +
Governed Community Opportunity
        +
Opt-In Explainable Matching
        +
Structured Preparation
        +
Optional AI Assistance
        +
Block, Report, Moderation and Safety
        ↓
Reduced Digital, Cognitive and Social Initiation Burden
        ↓
Greater Readiness, Confidence and Participant Control
        ↓
Voluntary Human Interaction
        ↓
Perceived Meaning, Participation, Connection and Autonomy
```

The intervention is expected to work only when the Participant finds the activity relevant, understandable and safe.

---

## 7. Mechanisms of Action

Potential mechanisms include:

- accessible navigation reduces digital burden;
- granular choices increase autonomy and trust;
- Life Story prompts support self-expression and conversation material;
- Participant confirmation protects authorship;
- selected sharing creates a controlled social bridge;
- Community exposure increases opportunities without requiring private contact;
- declared-interest matching reduces search burden;
- MatchExplanation improves comprehension and informed choice;
- MutualAcceptance reduces unwanted contact;
- structured preparation increases interaction readiness;
- AI Drafting reduces communication burden;
- reflection supports meaning-making;
- and moderation and Safety controls increase confidence to participate.

These mechanisms are hypotheses for feasibility learning, not established causal conclusions.

---

## 8. Potential Moderators

Potential moderators include:

- digital confidence;
- AccessibilityProfile;
- language;
- sensory or motor needs;
- cognitive load;
- communication confidence;
- prior social activity;
- availability of an existing contact;
- willingness to share Life Story;
- willingness to join Community;
- matching opt-in;
- support availability;
- setting;
- and Participant trust in AI or digital platforms.

---

## 9. Potential Barriers

Potential barriers include:

- inaccessible interface;
- burdensome Consent;
- unclear visibility;
- reluctance to share;
- inability to identify an existing contact;
- insufficient MatchCandidates;
- poor MatchExplanation;
- no MutualAcceptance;
- unwanted contact;
- technical or delivery failure;
- low Moderator capacity;
- Safety concern;
- AI invention or overreach;
- Participant fatigue;
- excessive measurement;
- and provider failure.

---

## 10. Primary Study Objective

The primary objective is:

> To assess the feasibility, acceptability, accessibility and operational safety of delivering a Participant-controlled, ability-adaptive digital intervention that combines Life Story, governed Community participation and structured human connection support for older adults.

---

## 11. Secondary Objectives

Secondary objectives are to assess:

- feasibility of private Life Story creation and confirmation;
- comprehension of visibility and sharing controls;
- acceptability of governed Community participation;
- acceptability and feasibility of opt-in Open Matching;
- comprehension and fidelity of MatchExplanation;
- feasibility of independent MatchDecision and MutualAcceptance;
- usability of Connection and limited messaging;
- completion of meaningful human interaction;
- accessibility adaptations and support burden;
- moderation and reporting operations;
- SafetySignal triage and SafetyEvent separation;
- AI usefulness and boundary adherence;
- Participant trust and dependency concerns;
- data completeness and quality;
- DatasetLock readiness;
- and reproducibility of AnalysisRun and ResearchFinding.

---

## 12. Exploratory Objectives

Exploratory objectives include:

- perceived social connectedness;
- confidence initiating contact;
- meaningful participation;
- autonomy;
- sense of meaning;
- feeling known or heard;
- relationship quality;
- willingness to continue human interaction;
- differences between existing-contact and matching pathways;
- Community experience;
- and equity of access across ability needs.

The Pilot is not powered to establish definitive effectiveness.

---

## 13. Primary Research Questions

1. Can eligible Participants complete accessible onboarding, granular Consent, baseline assessment, intervention activity and follow-up with acceptable levels of support?
2. Can Participants create or review a LifeStoryItem while retaining authorship, correction and visibility control?
3. Can the intervention support at least one voluntary meaningful human interaction without an unresolved serious Consent, privacy, moderation or Safety failure?
4. Can the Platform generate a complete, permission-consistent, traceable and reproducible locked DatasetVersion?
5. Can the study complete a governed AnalysisRun, InterpretationRecord and ResearchFinding linked to exact Protocol, intervention, AI and source versions?

---

## 14. Secondary Research Questions

1. Which ability adaptations are used and which reduce burden?
2. Which onboarding, Life Story, Community, matching or messaging steps create the greatest difficulty?
3. Do Participants understand the distinction between Private, Selected People, Connections, Community, Platform Public and Internet Public?
4. Is Life Story creation meaningful and acceptable?
5. Is Community participation acceptable and manageable?
6. What proportion of Participants opt into Open Matching?
7. Do MatchExplanations accurately represent permitted declared attributes?
8. Can Participants make independent Match Decisions without pressure?
9. How often does MutualAcceptance lead to an active Connection?
10. Can Participants complete the intervention through an existing-contact path when they decline matching?
11. Are Block, Report and Disconnect understandable and usable?
12. What moderation and Safety concerns occur?
13. Does AI assist without inventing Life Story details, using hidden matching data, sending unauthorised Messages or encouraging dependency?
14. What data-quality or lineage problems occur?
15. Which intervention components should be retained, revised, restricted, replicated, expanded, suspended or retired?

---

## 15. Exploratory Research Questions

1. Are there descriptive changes in confidence initiating contact?
2. Are there descriptive changes in perceived connection or meaningful participation?
3. Which pathway appears more acceptable: existing contact, Community or matching?
4. Does Life Story use support conversation readiness?
5. What Participant characteristics appear related to assistance needs?
6. What forms of human support are most useful?
7. How do Participants describe trust, privacy and social safety?
8. What unintended consequences arise?
9. What operational resources are required per Participant?
10. Which findings justify a larger or comparative study?

---

## 16. Feasibility Hypothesis

Most enrolled Participants will complete at least one approved core intervention pathway and end-of-Pilot assessment without an unresolved serious Consent, privacy, moderation or Safety issue.

---

## 17. Acceptability Hypothesis

Most Participants will report that:

- the intervention is understandable;
- the activity is relevant;
- Life Story control is acceptable;
- available social pathways are voluntary;
- and overall burden is manageable.

---

## 18. Accessibility Hypothesis

Participants with different support needs will complete key tasks independently or with anticipated support using approved ability-adaptive presentation.

No core right or safety control should remain inaccessible.

---

## 19. Life Story Hypothesis

Most Participants who begin a Life Story activity will be able to create, review or confirm at least one item and understand whether it remains Private or is shared.

---

## 20. Social Pathway Hypothesis

Participants will be able to complete a meaningful human interaction through at least one approved pathway:

- existing authorised contact;
- mutual Open Matching Connection;
- or approved structured Community interaction.

---

## 21. AI Support Hypothesis

Enabled AI assistance will be perceived as useful for explanation, Drafting, transcription, translation, preparation or reflection without being experienced as a substitute for the human relationship.

---

## 22. Research Systems Hypothesis

The Platform will preserve sufficient source, version, permission, exposure, moderation, Safety, AI and analytical lineage to support a locked DatasetVersion and reproducible AnalysisRun.

---

## 23. Study Design

The recommended design is:

> **Prospective single-arm mixed-method feasibility, acceptability, accessibility and operational-safety Pilot with repeated measures and staged feature activation.**

The design includes:

- baseline assessment;
- accessible onboarding;
- private Life Story activity;
- optional controlled sharing;
- governed Community exposure;
- optional Open Matching;
- existing-contact alternative;
- structured human-interaction preparation;
- intervention delivery;
- repeated process measures;
- post-activity reflection;
- end-of-Pilot assessment;
- qualitative feedback;
- optional Supporter feedback;
- moderation and Safety monitoring;
- AI evaluation;
- and Platform-generated operational data.

---

## 24. Staged Feature Activation

The recommended sequence is:

### Stage A — Existing-Contact and Private Life Story

The first real Participants receive:

- onboarding;
- Consent;
- private Life Story;
- existing-contact pathway;
- assessment;
- AI Draft-only support where approved;
- and Safety and support monitoring.

### Stage B — Governed Community

Community becomes available only after:

- Stage A review;
- Block and Report verification;
- Moderator staffing;
- Community Rule approval;
- and no unresolved release-blocking issue.

### Stage C — Open Matching and Messaging

Open Matching becomes available only after:

- Community operations are stable;
- matching attribute policy is approved;
- prohibited-feature and Block tests pass;
- MatchExplanation evaluation passes;
- MutualAcceptance and Connection tests pass;
- and Moderator and Safety capacity remain adequate.

Stages may overlap after approval.

---

## 25. Cohort Structure

The Protocol may use:

- one rolling cohort with staged feature activation;
- or sequential small cohorts.

The recommended planning model is:

- an initial Stage A cohort;
- an expanded Stage B cohort;
- and a Stage C matching-enabled cohort.

Cohort assignment is operational and research-traceable.

It is not presented as randomisation unless a formal allocation method is approved.

---

## 26. Comparator

The initial Pilot has no formal control group.

Descriptive comparisons may include:

- baseline versus follow-up;
- planned versus completed interaction;
- existing-contact versus matching pathway;
- Community participants versus non-participants;
- AI-assisted versus non-AI-assisted activities;
- and lower-support versus higher-support completion.

These comparisons are exploratory and vulnerable to selection and exposure differences.

---

## 27. Study Duration

A representative Participant duration is four weeks:

- onboarding and baseline;
- Life Story activity during the first week;
- one or more social-connection activities during weeks one to three;
- reflection after each core activity;
- end-of-Pilot assessment in week four;
- and optional short follow-up.

The final duration must be approved before recruitment.

---

## 28. Intervention Dose

A representative minimum dose is:

- one onboarding session;
- one Life Story activity offered;
- one human-connection pathway selected;
- one structured preparation activity;
- one human interaction attempted or completed;
- one post-activity reflection;
- and one end-of-Pilot assessment.

Additional Community, matching, Message or connection activities are recorded as exposure rather than required dose unless specified.

---

## 29. Study Setting

The Pilot should operate in one controlled setting with:

- recruitment capability;
- accessible onboarding support;
- technical support;
- Moderator coverage;
- Safety Reviewer coverage;
- privacy and incident contacts;
- and appropriate research governance.

The final setting is specified in the approved ProtocolVersion.

---

## 30. Target Population

The target population is older adults who:

- are interested in meaningful human connection or participation;
- can make the required study decisions independently or through an approved supported decision process;
- can use the intervention independently or with permitted support;
- and can participate safely under the approved screening process.

Age is not used as a proxy for ability.

---

## 31. Planned Sample Size

The Pilot sample is selected for feasibility learning rather than statistical power.

The recommended planning range is:

- **18 to 30 enrolled Participants**;
- with a working target of approximately **24**;
- and optional Supporter participation for a subset.

The final target depends on:

- recruitment access;
- staged cohort design;
- diversity of accessibility needs;
- matching feasibility;
- Moderator and Safety capacity;
- qualitative information sufficiency;
- and delivery period.

---

## 32. Sample Size Rationale

The sample is intended to:

- test the complete Participant journey;
- include variation in ability and support needs;
- exercise both existing-contact and matching pathways where feasible;
- identify common operational failures;
- estimate completion and burden descriptively;
- and generate qualitative implementation learning.

No formal effectiveness power calculation is claimed.

---

## 33. Inclusion Criteria

A Participant may be eligible when all applicable criteria are satisfied:

1. Meets the approved age or Healthy Aging population definition.
2. Can provide informed Consent or participate through an approved supported decision process.
3. Expresses interest in at least one meaningful human connection activity.
4. Has access to an approved device or assisted-access arrangement.
5. Can communicate in the Pilot language with available adaptation.
6. Can use an existing approved contact or is willing to consider a Community or matching pathway.
7. Can participate safely according to screening.
8. Accepts the minimum required research data collection.
9. Can be reached through an approved support or follow-up method.
10. Meets setting-specific requirements.

---

## 34. Exclusion or Further-Review Criteria

A Participant may be excluded or require additional review when:

1. Consent cannot be established.
2. Participation would create an unmanageable immediate risk.
3. Acute distress requires another service before research participation.
4. A known coercive, abusive or unsafe relationship context affects the proposed pathway.
5. The intervention remains inaccessible after available adaptation and support.
6. No safe intervention pathway is available.
7. The intervention conflicts with current care, legal, safety or research restrictions.
8. Minimum study procedures cannot be completed and no supported arrangement is available.
9. Required moderation or Safety capacity is unavailable.
10. A current account or Community restriction is incompatible with participation.

---

## 35. Non-Exclusion Principles

Exclusion must not be based solely on:

- chronological age;
- disability;
- sensory impairment;
- digital inexperience;
- need for assistance;
- living arrangement;
- absence of an existing contact;
- declining Community;
- declining Open Matching;
- or declining optional AI.

An alternative pathway should be offered where safe and consistent with the Protocol.

---

## 36. Screening

Screening should assess:

- study eligibility;
- Consent pathway;
- preferred language;
- accessibility and support;
- device access;
- existing-contact availability;
- willingness to create or review Life Story;
- Community interest;
- matching interest;
- communication preferences;
- current acute distress;
- relevant contact-safety concerns;
- and operational feasibility.

Screening collects minimum necessary information.

---

## 37. Eligibility Decision

EligibilityDecision records:

- ProtocolVersion;
- each criterion;
- source;
- result;
- support or adaptation considered;
- decision;
- reason;
- reviewer;
- and time.

AI may support form completion but cannot make the final decision.

---

## 38. Recruitment

Recruitment may use:

- partner organisation invitation;
- community programme;
- approved direct contact;
- Participant information session;
- or other approved method.

Recruitment materials must state that:

- Community and matching are voluntary;
- Internet Public publication is not part of the default Pilot;
- AI is optional or task-specific;
- the Platform is not an emergency service;
- and withdrawal is available.

---

## 39. Recruitment Equity

Recruitment should seek diversity in:

- accessibility needs;
- digital experience;
- social-network availability;
- gender where appropriate;
- cultural and language background where feasible;
- living arrangement;
- and support needs.

Recruitment targets must not create token participation or disclose protected information unnecessarily.

---

## 40. Informed Consent

Consent must be obtained before study-specific intervention or data collection.

The process explains:

- study purpose;
- staged intervention;
- Life Story;
- Community;
- Open Matching;
- MatchExplanation;
- Connection and messaging;
- AI;
- moderation;
- Safety;
- data collection;
- providers;
- research analysis;
- retention;
- withdrawal;
- and support.

---

## 41. Granular Consent Domains

Consent choices are separated for:

- study participation;
- ParticipantProfile and accessibility preferences;
- private Life Story creation;
- Life Story media;
- Supporter contribution;
- selected-person sharing;
- Community participation;
- Platform Public publication where enabled;
- Open Matching;
- approved matching attributes;
- MatchCandidate presentation;
- independent MatchDecision;
- Connection activation;
- Participant messaging;
- Message attachments;
- communication-provider processing;
- read receipts where enabled;
- AI assistance;
- AIMemoryItem;
- Message metadata research use;
- restricted Message-content analysis where separately proposed;
- device data where applicable;
- future re-contact;
- and external dissemination.

The Pilot does not treat one broad “social features” choice as sufficient authority for matching, Connection, messaging, AI use and research analysis.

Declining Community, Open Matching, messaging or AI assistance does not imply study withdrawal.

Message-content analysis is not included in the ordinary Pilot Consent.

## 42. Accessible Consent

Consent supports:

- plain language;
- larger text;
- high contrast;
- reduced-content mode;
- step-by-step mode;
- read-aloud where available;
- replay;
- additional time;
- human explanation;
- supported navigation;
- and comprehension checks appropriate to governance requirements.

Adaptation does not change Consent meaning.

---

## 43. Supported Decision-Making

A Supporter may help the Participant:

- understand information;
- navigate;
- communicate preferences;
- review choices;
- or complete an interface.

The record preserves:

- helper identity;
- Relationship;
- support provided;
- whose decision was recorded;
- and any verified substitute authority.

Support does not transfer authorship or control.

---

## 44. Re-Consent

Re-Consent may be required after:

- material Protocol amendment;
- new intervention component;
- Community or matching expansion;
- new visibility level;
- new AI provider or data use;
- persistent memory activation;
- new media modality;
- new external recipient;
- broader research use;
- or extended follow-up.

The amendment assessment determines which Participants require re-Consent.

---

## 45. Withdrawal Choices

A Participant may withdraw or pause:

- a specific activity;
- Life Story sharing;
- Community membership;
- matching;
- a Connection;
- messaging;
- Supporter involvement;
- AI interaction;
- AIMemoryItem;
- optional media;
- qualitative interview;
- future contact;
- follow-up;
- or the entire study.

Withdrawal must be accessible and must not require justification.


---

## 46. Withdrawal Effects

Withdrawal handling distinguishes:

- future intervention;
- future contact;
- current Community visibility;
- matching eligibility;
- Connection and Message access;
- AI Context and memory;
- future Dataset generation;
- locked DatasetVersion;
- retained governance records;
- and provider copies.

A locked DatasetVersion is not silently edited.

Any retention exception must be explained and approved.

---

## 47. Participant Support

Support may include:

- onboarding;
- Consent explanation;
- navigation;
- device help;
- accessibility adjustment;
- Life Story assistance;
- Community orientation;
- matching explanation;
- Message assistance;
- reporting;
- withdrawal;
- and human escalation.

Support activity is recorded when it may affect feasibility, accessibility or fidelity interpretation.

---

## 48. Support Boundaries

Support staff and Supporters must not:

- pressure participation;
- select sharing on behalf of the Participant without authority;
- accept a MatchCandidate;
- create a Connection;
- send a Message as the Participant;
- suppress a Report;
- or change research responses.

Assistance and authorship remain distinguishable.

---

## 49. Intervention Overview

The intervention is an integrated digital pathway that supports a voluntary human interaction.

It includes:

1. accessible onboarding;
2. granular choices;
3. private Life Story activity;
4. optional sharing or Community participation;
5. selection of an existing-contact or Open Matching pathway;
6. structured preparation;
7. optional AI assistance;
8. independent MatchDecision where applicable;
9. MutualAcceptance before Connection;
10. limited confirmed communication;
11. human interaction;
12. reflection;
13. assessment;
14. moderation and Safety controls;
15. and follow-up.

---

## 50. Intervention Components

Required components:

- INT-009 — Ability-Adaptive Onboarding and Navigation;
- INT-004 — Life Story and Participant-Controlled Personal Archive;
- INT-001 — Structured Social Connection;
- INT-002 — Interest-Based Connection and Open Matching capability.

Controlled AI component:

- INT-003 — AI Companion-Facilitated Human Connection.

Controlled Optional components:

- INT-005 — Intergenerational Story Sharing;
- INT-008 — Participant-Controlled Family and Care Network;
- INT-010 — Orientation or Context Support.

---

## 51. Intervention Pathways

Permitted pathways are:

### Existing-Contact Pathway

The Participant uses an existing authorised human contact.

### Community Pathway

The Participant completes a structured interaction in a governed Community context.

### Open Matching Pathway

The Participant opts into matching, reviews candidates, independently records a decision and forms a Connection only after MutualAcceptance.

The selected pathway is recorded.

---

## 52. Core Completion

Core intervention completion requires:

- required onboarding;
- Life Story activity offered;
- one approved social pathway selected or attempted;
- structured preparation offered;
- human interaction attempted or completed;
- reflection offered;
- and follow-up assessment completed or explicitly declined.

Completion is not inferred from account activity or matching availability.

---

## 53. Exposure States

Each intervention component uses:

- Offered;
- Viewed;
- Started;
- Partially Received;
- Completed;
- Skipped;
- Declined;
- Failed;
- or Interrupted.

The study distinguishes:

- assignment;
- availability;
- exposure;
- completion;
- and perceived benefit.

---

## 54. Intervention Session

A Session records:

- Participant;
- pathway;
- component;
- planned time;
- actual time;
- mode;
- support;
- adaptation;
- AI use;
- exposure state;
- concern;
- and completion.

Sessions may be synchronous or asynchronous.

---

## 55. Life Story Intervention Purpose

Life Story is used to:

- support self-expression;
- preserve Participant voice;
- provide conversation material;
- identify interests;
- support meaningful reflection;
- and create optional controlled social bridges.

Life Story is not required to establish factual historical accuracy.

---

## 56. LifeStoryArchive

Each Participant receives a Private archive when the component is activated.

The archive supports:

- Drafts;
- confirmed items;
- selected sharing;
- contribution;
- withdrawal;
- export;
- and help.

Archive creation does not make content visible to other Participants.

---

## 57. LifeStoryItem Activity

A representative activity may ask the Participant to:

- describe a meaningful place;
- describe a favourite activity;
- share an important routine;
- recall a person or event;
- describe something they would enjoy discussing;
- or choose their own topic.

The Participant may skip sensitive prompts.

---

## 58. Life Story Modalities

Core modality:

- text.

Controlled Optional modalities:

- voice recording;
- photo;
- document;
- and limited video.

Each enabled modality requires:

- accessible capture;
- provider review;
- media Consent;
- secure storage;
- review;
- and deletion handling.

---

## 59. Life Story AI Assistance

AI may:

- propose a prompt;
- transcribe;
- translate;
- organise;
- simplify;
- suggest a title;
- identify proposed people, places, dates or themes;
- and Draft a summary.

AI may not:

- invent a memory;
- present an inference as testimony;
- resolve disputed facts;
- publish;
- or change visibility.

---

## 60. Participant Confirmation of Life Story

The Participant can:

- accept;
- edit;
- correct;
- reject;
- save as Draft;
- confirm selected wording;
- or withdraw.

Confirmation is version-specific.

A later material edit may require new confirmation.

---

## 61. Participant Testimony

`Participant Testimony` means:

- content attributed to the Participant;
- reviewed or confirmed according to the approved process;
- preserved with source and version;
- and not necessarily externally verified.

AI Draft, Supporter Contribution and imported material do not automatically become Participant Testimony.

---

## 62. Life Story Visibility

Permitted Pilot visibility includes:

- Private;
- Selected People;
- Connections;
- Community;
- and Platform Public where approved.

Internet Public is disabled by default.

No non-private visibility is preselected.

---

## 63. Life Story Sharing Rights

The Participant separately chooses where applicable:

- view;
- comment;
- quotation;
- download;
- re-share;
- Community use;
- research use;
- and export.

Visibility does not grant every reuse right.

---

## 64. Life Story Withdrawal

The Participant may:

- make an item Private;
- withdraw a share;
- remove a Community reference;
- request deletion;
- restrict research use;
- or withdraw from the Life Story component.

Propagation to Search, Vector, cache, AI Context and providers is tracked.

---

## 65. Supporter Contribution

Supporter contribution is enabled only when:

- a valid Relationship exists;
- the Participant permits contribution;
- the item accepts contribution;
- the Supporter is identified;
- and the Participant can review the result.

The Participant may accept, revise, reject or request withdrawal.

---

## 66. Life Story Sensitive-Topic Safeguards

Safeguards include:

- skip;
- pause;
- Private save;
- warning;
- reduced AI Context;
- human support;
- Report;
- SafetySignal;
- and withdrawal.

Sensitive content does not automatically imply diagnosis or SafetyEvent.

---

## 67. LegacyPreference

LegacyPreference remains feature-disabled unless:

- legal review is complete;
- authority is defined;
- posthumous handling is operational;
- revocation is supported;
- and Participant information is approved.

If disabled, no Participant is asked to make a LegacyPreference.

---

## 68. PublicProfile

A Participant may create a separate PublicProfile for approved Platform audiences.

Potential fields include:

- chosen display name;
- short biography;
- broad interests;
- language;
- general location;
- communication preferences;
- and selected Life Story references.

Protected ParticipantProfile data are not copied automatically.

---

## 69. PublicProfile Review

Before activation, the Participant reviews:

- each field;
- audience;
- general-location precision;
- visibility;
- Block implications;
- and removal.

AI may Draft wording but cannot activate the profile.

---

## 70. Community Intervention Purpose

Community may support:

- shared interest;
- low-pressure participation;
- story sharing;
- conversation practice;
- social discovery;
- and an alternative to one-to-one matching.

Community is optional unless the approved study cohort specifically evaluates it.

---

## 71. CommunitySpace

The Pilot uses one or a small number of governed CommunitySpaces with:

- defined purpose;
- eligibility;
- approved CommunityRuleVersion;
- Moderator ownership;
- limited content types;
- reporting;
- and archive.

Anonymous and unmoderated spaces are excluded.

---

## 72. Community Membership

The Participant can:

- review purpose and rules;
- join;
- decline;
- leave;
- pause notifications;
- Block;
- and Report.

Joining Community does not activate Open Matching.

Leaving Community does not automatically withdraw from the study.

---

## 73. Community Content

The Pilot may support:

- SocialPost;
- comment;
- reaction;
- selected Life Story reference;
- question;
- and activity invitation.

All content retains author, version, audience, visibility and moderation state.

---

## 74. Community Publication

Publication requires:

- current eligibility;
- current Consent;
- Participant confirmation;
- audience;
- Community Rule acceptance;
- no applicable restriction;
- and moderation controls.

AI Draft is not published content.

---

## 75. Community Feed

The feed applies:

- membership;
- Visibility;
- Block;
- Resource State;
- moderation;
- relevance;
- and approved ranking policy.

It must not optimise only for:

- engagement time;
- reactions;
- controversy;
- emotional arousal;
- or compulsive return.

---

## 76. Community Process Exposure

Process measures may include:

- Community joined;
- feed viewed;
- SocialPost Drafted;
- SocialPost published;
- comment;
- reaction;
- Block;
- Report;
- and moderation action.

These are not direct measures of social connectedness.

---

## 77. Open Matching Purpose

Open Matching reduces the burden of identifying a suitable voluntary contact using approved declared attributes.

Matching does not claim to identify an objectively ideal relationship.

---

## 78. MatchPreference

Matching is inactive by default.

The Participant selects:

- purpose;
- interests;
- preferred activity;
- language;
- communication mode;
- availability;
- broad location;
- and exclusions.

The Participant may activate, pause, update or withdraw.

---

## 79. Allowed Matching Attributes

Potential allowed attributes include:

- declared interests;
- preferred activities;
- language;
- communication mode;
- availability;
- broad location;
- and Community context.

Each attribute requires approved source, policy and explanation behaviour.

---

## 80. Prohibited Matching Attributes

Prohibited by default:

- diagnosis;
- inferred capacity;
- vulnerability;
- financial information;
- private Life Story;
- Messages;
- Safety records;
- moderation allegations;
- precise location;
- hidden protected traits;
- and AI-inferred emotional dependency.

---

## 81. MatchCandidate Generation

Generation requires:

- active MatchPreference;
- current Consent;
- current eligibility;
- approved policy version;
- permitted features;
- no Block;
- rate limits;
- and candidate expiry.

The process is recorded as an Operation.

---

## 82. MatchCandidate

The Participant sees:

- safe profile projection;
- declared shared basis;
- MatchExplanation;
- uncertainty;
- choices;
- expiry;
- Block;
- and Report.

The other Participant's protected internal ID and source records are not displayed.

---

## 83. MatchExplanation

The explanation must:

- use permitted declared attributes;
- identify why the candidate appeared;
- avoid hidden sensitive data;
- avoid diagnostic inference;
- avoid guaranteed-success language;
- and preserve policy and feature versions.

An internal rank is not presented as objective compatibility.

---

## 84. MatchDecision

Each Participant records only their own decision about one exact MatchCandidate version.

Representative values are:

- Interested;
- Not Now;
- Dismissed;
- Blocked;
- Reported;
- and Expired.

The study records:

- deciding actor;
- candidate and version;
- decision;
- time;
- confirmation where required;
- supersession or reversal;
- expiry;
- and outcome of MutualAcceptance evaluation.

A MatchDecision is not inferred from:

- Profile view;
- MatchExplanation view;
- Community interaction;
- Message activity;
- AI confidence;
- or another Participant's action.

The other Participant's private decision is not disclosed before policy permits it.

## 85. MutualAcceptance

MutualAcceptance is a canonical M18 aggregate and distinct process event.

It is recorded only when:

- two compatible independent MatchDecisions remain current;
- both decisions reference the correct current MatchCandidate versions;
- matching Consent remains current;
- both actors remain eligible;
- no applicable Block exists;
- account and ResourceState remain usable;
- candidate and decisions are unexpired;
- and the current matching policy conditions hold.

The record preserves:

- exact source MatchDecisions;
- actor pair;
- purpose;
- policy version;
- effective period;
- validity;
- invalidation or expiry;
- and Connection usage.

It is not inferred from Profile views, Community interaction, Message activity or AI confidence.

One MutualAcceptance activates at most one Connection.

ConnectionRequest is not used in this Pilot.

## 86. Connection

Connection is activated only from one current, valid and unused MutualAcceptance record.

Connection activation is recorded separately from MutualAcceptance.

Connection permits only the social scope defined by the intervention, Consent and policy.

It does not create:

- Supporter authority;
- care authority;
- Consent;
- research permission;
- private Life Story access;
- or unrestricted communication.

Existing authorised contacts may participate without an M18 Connection.

Connection activation, pause, resume, mute and disconnect are separate process states.

## 87. Connection and Communication Controls

The Participant can:

- pause;
- resume;
- mute;
- disconnect;
- Block;
- Report;
- and request Help.

A ConversationThread requires a current approved CommunicationBasis.

Representative bases include:

- active Connection;
- active authorised Relationship;
- approved InterventionSession;
- or approved moderated Community context.

A MatchCandidate, unilateral MatchDecision or expired MutualAcceptance is not a CommunicationBasis.

Disconnect does not remove the ability to Report.

Block revocation does not automatically restore Matching, MutualAcceptance, Connection, ConversationThread or Message authority.

## 88. ConversationThread and Messaging

Limited one-to-one messaging may be available only after a current approved CommunicationBasis is resolved.

The process includes:

- ConversationThread creation;
- exact participant set;
- Message Draft;
- Message revision;
- attachment validation where enabled;
- actor-, Message-version- and recipient-specific SendConfirmation;
- MessageQueued;
- MessageSent;
- MessageProviderAccepted;
- MessageDelivered;
- MessageDeliveryFailed or Delivery Unknown;
- retry through another DeliveryAttempt;
- cancellation or withdrawal where supported;
- Block;
- Report;
- and provider reconciliation.

Read receipts are disabled by default.

Group messaging is not part of this Pilot.

## 89. Message Boundaries

```text
Draft
    ≠ Send Confirmed
    ≠ Queued
    ≠ Sent
    ≠ Provider Accepted
    ≠ Delivered
    ≠ Read
```

The Pilot prohibits:

- automatic AI send;
- anonymous messaging;
- group or mass messaging;
- arbitrary Participant search;
- unsolicited contact outside an approved CommunicationBasis;
- provider-created sender authority;
- hidden financial solicitation;
- unrestricted external links;
- and false claims of delivery or recall.

The study does not interpret MessageSent as completed human interaction.

Provider Accepted does not count as Delivered.

## 90. Message Privacy

Private Message body is excluded by default from:

- broad Domain or Integration Event payloads;
- general logs;
- general Search;
- general Vector retrieval;
- MatchCandidate generation;
- Community ranking;
- AIMemoryItem;
- and ordinary research analysis.

The ordinary Pilot DatasetDefinition may include only approved minimum-necessary Message process metadata.

Any Message-content analysis requires:

- a separate ResearchQuestion;
- explicit Consent or lawful authority;
- separate restricted DatasetDefinition;
- minimisation;
- independent privacy review;
- restricted analytical environment;
- and governance and ethics approval.

Sender-side deletion does not imply recipient deletion or provider recall.

## 91. Human Interaction Definition

A meaningful human interaction is a Participant-chosen interaction that:

- involves another human;
- has an approved communication basis;
- is voluntary;
- is relevant to the Participant;
- and meets the minimum completion definition.

It may be:

- in person;
- telephone;
- video;
- Message exchange;
- shared activity;
- or structured Community interaction.

---

## 92. Interaction Completion

Completion may require:

- interaction occurred;
- minimum duration or exchange where appropriate;
- Participant confirmation;
- and post-activity reflection offered.

The Protocol must define pathway-specific completion rules before activation.

---

## 93. Interaction Attempt

An attempt is recorded when:

- preparation occurred;
- the Participant initiated or accepted the approved pathway;
- but completion did not occur.

Attempt and completion remain separate.

---

## 94. Interaction Preparation

Preparation may include:

- define a goal;
- choose a topic;
- select Life Story material;
- choose communication mode;
- Draft a Message;
- plan accessibility;
- consider boundaries;
- and review safety controls.

---

## 95. Post-Interaction Reflection

Reflection may ask:

- did the interaction occur;
- how it felt;
- whether it was meaningful;
- whether the Participant felt heard;
- burden;
- concern;
- whether they want another interaction;
- and whether help is needed.

The Participant may decline qualitative detail.

---

## 96. AI Companion Role

AI may support:

- explanation;
- navigation;
- Life Story prompts;
- transcription and translation;
- PublicProfile wording;
- SocialPost Draft;
- MatchExplanation;
- Message Draft;
- interaction preparation;
- reflection;
- and help routing.

AI remains optional or task-specific.

---

## 97. AI Prohibitions

AI must not:

- change Consent;
- determine capacity;
- create testimony;
- publish Internet Public content;
- activate matching;
- accept a candidate;
- create MutualAcceptance;
- create Connection;
- send without confirmation;
- impersonate a Participant;
- create fake social proof;
- impose high-impact moderation;
- confirm SafetyEvent;
- diagnose;
- prescribe;
- lock Dataset;
- or approve research findings.

---

## 98. AIInterventionConfigurationVersion

The Pilot uses one approved version containing:

- enabled AI roles;
- model aliases;
- provider restrictions;
- Prompt versions;
- output schemas;
- retrieval sources;
- Tool Set;
- Action Levels;
- memory;
- Life Story rules;
- Community and matching rules;
- messaging rules;
- moderation and Safety rules;
- retention;
- evaluation;
- and kill switches.

---

## 99. AI Tool Set

Potential approved Tools include:

### Read

- retrieve approved evidence;
- retrieve current assignment;
- retrieve accessibility preference;
- retrieve permitted Life Story item;
- retrieve MatchCandidate and MatchExplanation;
- retrieve the current actor's MatchDecision;
- retrieve permitted MutualAcceptance summary;
- retrieve Connection;
- retrieve CommunicationBasis summary;
- retrieve ConversationThread;
- and retrieve Message delivery state.

### Draft

- create Life Story Draft;
- create PublicProfile Draft;
- create SocialPost Draft;
- create MatchPreference Draft;
- propose the current actor's MatchDecision;
- create or revise Message Draft;
- and create reflection Draft.

### Confirmed or Controlled

- submit the current actor's confirmed MatchDecision;
- confirm sending one exact Message Draft;
- create a Block;
- submit a UserReport;
- raise a SafetySignal;
- and request Human Review.

The AI cannot:

- submit another actor's MatchDecision;
- create MutualAcceptance;
- activate or restore Connection;
- create ConversationThread without CommunicationBasis;
- send without exact Participant confirmation;
- or claim Delivered from Queued, Sent or Provider Accepted state.

## 100. AIMemoryItem

The Pilot may enable limited purpose-bound AIMemoryItem.

Permitted examples may include:

- language preference;
- response-format preference;
- accessibility preference;
- selected reminder preference;
- and Participant-approved conversation preference.

The Pilot does not automatically retain:

- private Life Story;
- Messages;
- matching history;
- Safety;
- moderation;
- precise location;
- or hidden inferred traits.


---

## 101. AI Memory Control

Participants can review, correct, restrict, revoke or delete eligible AIMemoryItems.

AIMemoryItem use is displayed distinctly from:

- ParticipantProfile;
- LifeStoryArchive;
- MatchPreference;
- Message;
- and research record.

---

## 102. Ability-Adaptive Features

The intervention should support:

- adjustable text;
- high contrast;
- plain-language mode;
- reduced-content mode;
- step-by-step mode;
- repeat;
- replay;
- extended response time;
- explicit confirmation;
- keyboard access;
- screen-reader semantics;
- and Supporter-assisted mode.

Controlled Optional features include:

- read-aloud;
- voice input;
- alternative input;
- and multimodal instruction.

---

## 103. Adaptation Selection

Adaptations may be selected by:

- Participant choice;
- AccessibilityProfile;
- onboarding preference;
- observed difficulty;
- Supporter recommendation;
- Researcher recommendation;
- or AI suggestion.

The Participant may override or change an adaptation.

---

## 104. Adaptation Boundaries

Adaptation may change:

- language;
- presentation;
- pacing;
- modality;
- number of choices;
- and support.

It must not silently change:

- Consent meaning;
- rights;
- eligibility;
- intervention purpose;
- required dose;
- matching policy;
- Safety threshold;
- or Outcome Definition.

---

## 105. Adaptation Record

A material adaptation records:

- source;
- rule;
- original presentation;
- adapted presentation;
- Participant choice;
- support;
- fidelity effect;
- Measurement effect;
- and time.

No general ability score is created.

---

## 106. Intervention Fidelity

Fidelity assesses whether:

- the approved ProtocolVersion was active;
- the approved InterventionVersion and configuration were assigned;
- required components were offered;
- Life Story remained Participant-controlled;
- matching used approved features;
- MatchDecision remained independent;
- MutualAcceptance preceded Connection;
- Message send required confirmation;
- AI configuration matched approval;
- adaptation remained within range;
- moderation and Safety controls were available;
- and human interaction remained the target.

---

## 107. Fidelity Dimensions

Fidelity dimensions include:

- adherence;
- exposure;
- quality of delivery;
- Participant responsiveness;
- adaptation;
- pathway;
- support;
- AI configuration;
- social-safety control;
- and context.

---

## 108. Protocol Deviation

A deviation records:

- type;
- Participant;
- session or resource;
- source;
- reason;
- actual behaviour;
- expected behaviour;
- impact;
- corrective action;
- reviewer;
- and reportability.

A deviation does not silently change the Protocol.

---

## 109. Intervention Adaptation

Allowed intervention adaptations are pre-specified.

A material change outside the approved range requires:

- deviation review;
- risk assessment;
- possible amendment;
- and possible re-Consent.

---

## 110. Assessment Schedule Overview

Assessment timepoints are:

- Screening;
- Baseline;
- Early Intervention Check;
- Post-Core-Activity Reflection;
- End of Pilot;
- Optional Follow-Up;
- and event-triggered Safety or Moderation assessment where required.

---

## 111. Screening Measures

Screening may include:

- eligibility;
- Consent pathway;
- language;
- accessibility;
- device access;
- support availability;
- current social pathway options;
- contact-safety concern;
- acute distress;
- and operational readiness.

Screening avoids unnecessary diagnostic data.

---

## 112. Baseline Measures

Baseline may include:

- approved demographic and context data;
- digital confidence;
- accessibility needs;
- assistance needs;
- existing social-contact context;
- confidence initiating contact;
- perceived connection or participation;
- autonomy or meaningful-activity measure;
- preferred interests;
- and baseline burden.

---

## 113. Early Intervention Check

An early check may assess:

- onboarding comprehension;
- Consent understanding;
- Life Story burden;
- Visibility understanding;
- AI understanding;
- technical difficulty;
- accessibility;
- distress;
- and support need.

This check supports staged activation.

---

## 114. During-Intervention Measures

During the intervention, record:

- component offered;
- component viewed;
- started;
- completed;
- skipped;
- declined;
- interrupted;
- support;
- adaptation;
- AI use;
- Life Story state;
- Community activity;
- matching state;
- Connection;
- Message state;
- human-interaction attempt;
- concern;
- and deviation.

---

## 115. Post-Activity Measures

After a core human interaction, measures may include:

- interaction completion;
- mode;
- duration category;
- perceived quality;
- feeling heard;
- meaningfulness;
- confidence;
- satisfaction;
- burden;
- privacy concern;
- unwanted contact;
- and desire for another interaction.

---

## 116. End-of-Pilot Measures

End-of-Pilot assessment may include:

- overall acceptability;
- usability;
- accessibility;
- relevance;
- perceived benefit;
- willingness to continue;
- Life Story experience;
- Community experience;
- matching experience;
- Connection and Message experience;
- AI usefulness;
- AI trust and dependency concern;
- privacy and Safety;
- support burden;
- and qualitative feedback.

---

## 117. Optional Follow-Up

Optional follow-up may assess:

- continued human contact;
- continued Community participation;
- sustained confidence;
- ongoing Life Story use;
- continued concerns;
- and delayed adverse effects.

Follow-up timing is specified before approval.

---

## 118. Measurement Selection Principles

Measures must be:

- relevant;
- brief;
- feasible;
- validated where appropriate;
- licensed;
- accessible;
- sensitive to burden;
- interpretable for a small feasibility study;
- and available in the Pilot language.

---

## 119. Measurement Burden

The team should monitor:

- number of items;
- completion time;
- fatigue;
- assistance;
- repeated questions;
- modality;
- and abandonment.

A measure may be removed or adapted only within approved rules.

---

## 120. Primary Feasibility Measures

Primary feasibility measures should include:

- proportion completing accessible Consent;
- proportion completing baseline;
- proportion beginning the core intervention;
- proportion completing or attempting one human interaction;
- proportion completing end-of-Pilot assessment;
- support time;
- withdrawal;
- and completeness of required research records.

One primary feasibility endpoint should be designated before approval.

---

## 121. Life Story Feasibility Measures

Potential measures include:

- activity offered;
- Draft created;
- item confirmed;
- item kept Private;
- item shared;
- correction;
- Supporter contribution;
- withdrawal;
- media use;
- AI assistance;
- time;
- and assistance.

---

## 122. Community Feasibility Measures

Potential measures include:

- eligible Participants offered Community;
- joined;
- declined;
- left;
- PublicProfile created;
- feed viewed;
- SocialPost Drafted;
- published;
- comment or reaction;
- Block;
- Report;
- moderation case;
- and support time.

---

## 123. Matching, MutualAcceptance and Connection Feasibility Measures

Potential measures include:

- matching offered;
- matching Consent;
- opt-in;
- MatchPreference activated, paused or withdrawn;
- MatchCandidates generated and expired;
- MatchExplanation viewed and understood;
- actor-owned MatchDecision;
- decision reversal or supersession;
- MutualAcceptance recorded;
- MutualAcceptance expired or invalidated;
- time from compatible decisions to MutualAcceptance;
- Connection activation;
- attempted invalid or reused MutualAcceptance;
- Block;
- Report;
- no-candidate state;
- no-MutualAcceptance state;
- and pathway completion.

Acceptance rate alone is not a success or fairness outcome.

## 124. Conversation and Messaging Feasibility Measures

Potential measures include:

- ConversationThread created;
- CommunicationBasis type;
- Message Draft created or revised;
- attachment validation;
- SendConfirmation completed or abandoned;
- `MessageSendConfirmed` recorded;
- MessageQueued;
- MessageSent;
- MessageProviderAccepted;
- MessageDelivered;
- MessageDeliveryFailed;
- Delivery Unknown;
- DeliveryAttempt count;
- cancellation or withdrawal;
- broad response timing where approved;
- Block;
- Report;
- scam or harassment signal;
- support use;
- and Participant understanding of delivery state.

Message content is not required for these process measures.

MessageSent is not treated as human interaction completed.

Provider Accepted is not treated as Delivered.

## 125. Acceptability Measures

Acceptability domains include:

- relevance;
- clarity;
- comfort;
- perceived appropriateness;
- voluntary choice;
- satisfaction;
- willingness to continue;
- willingness to recommend;
- and perceived burden.

Acceptability is assessed by pathway and component.

---

## 126. Accessibility Measures

Accessibility measures include:

- task completion;
- assistance;
- adaptation;
- time;
- errors;
- error recovery;
- abandonment;
- repeated instruction;
- modality preference;
- comprehension;
- and Participant-reported difficulty.

---

## 127. Human-Connection Measures

Potential early signals include:

- interaction completion;
- confidence initiating contact;
- perceived connection;
- feeling heard;
- meaningful participation;
- autonomy;
- relationship quality;
- and willingness for future contact.

The selected measures and instruments must be specified before approval.

---

## 128. Burden Measures

Burden may include:

- time;
- effort;
- fatigue;
- frustration;
- cognitive load;
- digital burden;
- emotional discomfort;
- disclosure burden;
- social burden;
- Supporter burden;
- and staff burden.

---

## 129. Moderation Measures

Moderation measures may include:

- Report type;
- case creation;
- triage time;
- severity;
- decision;
- action;
- case duration;
- appeal;
- restoration;
- unresolved backlog;
- and Participant experience.

Reporter identity is excluded from ordinary analysis.

---

## 130. Safety Measures

Safety measures may include:

- SafetySignal category;
- source;
- urgency;
- triage time;
- disposition;
- conversion to SafetyEvent;
- SafetyAction;
- pause;
- resolution;
- and relatedness.

SafetySignal and SafetyEvent counts remain separate.

---

## 131. AI Measures

AI evaluation may include:

- task;
- model alias;
- Prompt version;
- grounding;
- citation;
- structured-output success;
- Tool selection;
- confirmation;
- user correction;
- Human Review;
- invention;
- hidden-feature attempt;
- unauthorised-action attempt;
- SafetySignal;
- latency;
- tokens;
- cost;
- and user-reported usefulness.

---

## 132. AI Dependency Measures

Potential indicators include:

- exclusivity language;
- distress when AI is unavailable;
- preference to replace human contact;
- repeated disclosure pressure;
- excessive repeated use;
- and difficulty disengaging.

These indicators are interpreted cautiously and do not become a hidden Participant label.

---

## 133. Qualitative Data

Qualitative data may be collected through:

- open-ended assessment;
- brief Participant interview;
- optional Supporter interview;
- Researcher observation;
- usability observation;
- and debrief.

The qualitative method and coding process are defined in the AnalysisPlan.

---

## 134. Observation

Observation may record:

- directly observed behaviour;
- Participant report;
- Supporter report;
- Researcher interpretation;
- system-recorded event;
- and AI inference.

Epistemic Type and source remain explicit.

---

## 135. Data Source Categories

Data may come from:

- Participant self-report;
- Supporter report;
- Researcher or Coordinator observation;
- Moderator record;
- Safety Reviewer record;
- Platform process event;
- AIInteraction metadata;
- intervention record;
- support record;
- provider delivery state;
- and approved qualitative material.

---

## 136. Data Minimisation

Only data necessary for approved Research Questions and operations are collected.

Availability of Life Story, Message, Community or AI content does not justify research use.

---

## 137. Identifiable Data

Identifiable data may include:

- name;
- contact information;
- account linkage;
- Supporter contact;
- precise communication routing;
- and identity evidence.

Identifiable data remain separated from ordinary analytical data.

---

## 138. Pseudonymous Research Data

The analysis dataset uses a study-specific pseudonymous Participant ID.

The linkage key is:

- stored separately;
- access-restricted;
- purpose-limited;
- and audited.

A universal cross-study pseudonym is not used by default.

---

## 139. Life Story Data Boundary

DatasetDefinition must state whether it includes:

- activity and exposure state;
- item count;
- modality;
- confirmation;
- visibility category;
- sharing state;
- AI assistance;
- theme metadata;
- qualitative text;
- transcript;
- media;
- or Participant Testimony.

Full narrative and media are excluded by default.

---

## 140. Community Data Boundary

Potential permitted data include:

- membership;
- PublicProfile creation;
- content process counts;
- Report;
- moderation state;
- and participation duration.

SocialPost content is excluded unless explicitly approved.

---

## 141. Matching and Connection Data Boundary

Potential permitted data include:

- matching opt-in;
- permitted attribute categories;
- candidate count and expiry;
- explanation view;
- actor-owned MatchDecision;
- MutualAcceptance creation, expiry or invalidation;
- Connection activation and disconnect;
- Block;
- Report;
- and pathway outcome.

The dataset minimises or excludes:

- the other Participant's private decision;
- protected attribute values;
- hidden rank;
- precise location;
- private Life Story;
- Safety records;
- moderation evidence;
- and Message content.

Internal rank is not interpreted as objective compatibility.

## 142. Conversation and Message Data Boundary

Potential permitted process data include:

- ConversationThread ID in pseudonymised form;
- CommunicationBasis category;
- Draft created or revised;
- SendConfirmation;
- queued, sent, provider-accepted, delivered, failed or unknown state;
- DeliveryAttempt count;
- broad timing category;
- attachment-present indicator where approved;
- Block;
- Report;
- abuse signal;
- and support use.

Private Message body is excluded by default.

Provider identifiers are excluded or separately pseudonymised.

The DatasetDefinition must specify every included Message variable and its purpose.

## 143. Moderation Data Boundary

Potential permitted data include:

- report category;
- case state;
- triage time;
- decision category;
- action;
- appeal;
- restoration;
- and SafetySignal link.

Reporter identity and detailed evidence are excluded from ordinary research data.

---

## 144. Safety Data Boundary

The ordinary analysis dataset should use minimum necessary Safety data.

Detailed Safety narratives and third-party information require restricted review and separate justification.

---

## 145. AI Data Boundary

Potential permitted AI data include:

- task;
- role;
- configuration version;
- model alias;
- Prompt and Tool versions;
- Context source classes;
- output classification;
- confirmation;
- user correction;
- Human Review;
- SafetySignal;
- latency;
- tokens;
- and cost.

Full prompts and outputs are excluded unless explicitly required.

---

## 146. External Provider Data

External-provider records may include:

- provider request ID;
- model or service version;
- delivery state;
- retention category;
- region;
- deletion state;
- and error.

Provider copies do not become an independent research source without approval.

---

## 147. Data Quality

Quality rules address:

- completeness;
- validity;
- uniqueness;
- timestamp order;
- source;
- ProtocolVersion;
- InterventionVersion;
- AI configuration;
- Visibility;
- matching policy;
- Message delivery;
- Safety state;
- and lineage.

---

## 148. Missing Data

Missingness uses controlled reasons such as:

- Not Collected;
- Participant Declined;
- Not Applicable;
- Unknown;
- Technical Failure;
- Not Yet Due;
- Lost to Follow-Up;
- Withheld by Permission;
- Withdrawn;
- and Invalidated.

Null alone is insufficient where meaning matters.

---

## 149. Correction

Corrections preserve:

- original value;
- requested correction;
- reason;
- evidence;
- corrected value;
- actor;
- review;
- effective time;
- and downstream impact.

Approved or locked artefacts are not edited in place.

---

## 150. DatasetDefinition

Before Participant data extraction, DatasetDefinition specifies:

- ResearchQuestions;
- population;
- source aggregates and exact versions;
- variables;
- inclusion and exclusion;
- Consent and purpose;
- Life Story rules;
- Community rules;
- MatchPreference, MatchCandidate and MatchDecision rules;
- MutualAcceptance and Connection rules;
- CommunicationBasis and ConversationThread rules;
- Message process-state variables;
- explicit Message-body exclusion;
- moderation and Safety rules;
- AI rules;
- provider and delivery-state transformations;
- missingness;
- de-identification;
- quality;
- retention;
- and output format.

A variable named `message_sent` must define whether it means SendConfirmed, Queued, Sent to Provider, Provider Accepted or Delivered.

Ambiguous delivery variables are prohibited.

## 151. DatasetVersion

DatasetVersion records:

- definition version;
- source lineage;
- extraction time;
- TransformationRuns;
- variable dictionary;
- manifest;
- quality issues;
- restrictions;
- files;
- counts where safe;
- and checksums.

A generated DatasetVersion is not yet locked.

---

## 152. DatasetLock

AI cannot lock the dataset.

DatasetLock requires:

- approved DatasetDefinition;
- complete lineage;
- Consent and withdrawal review;
- quality review;
- de-identification;
- manifest;
- checksum;
- compatible AnalysisPlan;
- and human authority.

A locked DatasetVersion is immutable.

---

## 153. AnalysisPlan

The AnalysisPlan is pre-specified and approved before final DatasetLock.

It defines:

- populations;
- variables;
- denominators;
- missingness;
- pathway analysis;
- descriptive methods;
- qualitative method;
- mixed-method integration;
- subgroup or equity review;
- sensitivity analysis;
- and output.

---

## 154. Quantitative Analysis

Quantitative analysis may include:

- counts;
- proportions;
- confidence intervals where appropriate;
- means or medians;
- ranges;
- completion;
- exposure;
- support;
- adaptation;
- Life Story process;
- Community process;
- matching funnel;
- Connection;
- Message delivery;
- moderation;
- SafetySignal and SafetyEvent;
- AI performance;
- and descriptive pre-post change.

No formal causal claim is planned.

---

## 155. Qualitative Analysis

Qualitative analysis may use:

- rapid qualitative analysis;
- framework analysis;
- structured thematic analysis;
- or another approved method.

The method records:

- codebook;
- coders;
- source;
- AI assistance;
- human decision;
- disagreement;
- and audit trail.


---

## 156. Mixed-Method Integration

Mixed-method interpretation should explain:

- why Participants completed or did not complete;
- how Life Story affected preparation;
- how Community and matching choices affected exposure;
- why no candidate or no MutualAcceptance occurred;
- which adaptations helped;
- why AI was useful or problematic;
- what moderation and Safety issues affected participation;
- and which operational barriers mattered.

---

## 157. Pathway Analysis

Results are reported by actual pathway:

- Existing Contact;
- Community;
- Open Matching;
- Multiple Pathways;
- and No Completed Social Pathway.

Pathway differences are descriptive and not interpreted as randomised effects.

---

## 158. Exposure Analysis

Analysis distinguishes:

- offered;
- viewed;
- started;
- partially received;
- completed;
- skipped;
- declined;
- failed;
- interrupted;
- and not eligible.

Denominators are defined explicitly.

---

## 159. AI-Assisted Analysis

AI may assist with:

- code Drafting;
- table Drafting;
- documentation;
- qualitative coding suggestions;
- and narrative Drafting.

Human researchers remain responsible for:

- method;
- code approval;
- coding;
- interpretation;
- limitation;
- and ResearchFinding.

---

## 160. Controlled Code Execution

AI-generated code executes only in a controlled analytical environment with:

- locked DatasetVersion;
- restricted identity;
- restricted network;
- package control;
- resource limits;
- code capture;
- environment version;
- timeout;
- output capture;
- and Human Review.

No production database credential is available.

---

## 161. AnalysisRun

AnalysisRun preserves:

- approved AnalysisPlan;
- DatasetLock;
- code version;
- environment;
- packages;
- parameters;
- seed where relevant;
- executor;
- start and end time;
- outputs;
- diagnostics;
- and checksums.

---

## 162. AnalysisOutput

AnalysisOutput includes:

- tables;
- figures;
- estimates;
- diagnostics;
- qualitative matrices;
- and coded summaries.

AnalysisOutput is not an InterpretationRecord or ResearchFinding.

---

## 163. InterpretationRecord

InterpretationRecord includes:

- Research Question;
- relevant outputs;
- interpretation;
- alternative explanations;
- missingness;
- pathway differences;
- limitations;
- uncertainty;
- accessibility;
- equity;
- moderation;
- Safety;
- AI;
- and reviewer.

---

## 164. ResearchFinding

ResearchFinding includes:

- ResearchQuestion;
- ProtocolVersion;
- InterventionVersion and configuration;
- AIInterventionConfigurationVersion;
- DatasetVersion and DatasetLock;
- AnalysisPlan and AnalysisRun;
- InterpretationRecord;
- conclusion;
- uncertainty;
- limitation;
- and approval.

---

## 165. Provisional Feasibility Thresholds

The following are draft progression thresholds:

- at least 70% of enrolled Participants complete baseline;
- at least 70% begin one core intervention pathway;
- at least 60% attempt or complete one human interaction;
- at least 70% of those due complete end-of-Pilot assessment;
- at least 80% of required fields are complete among completers;
- no unresolved serious Consent failure;
- no unresolved cross-Participant privacy breach;
- no non-mutual Connection;
- no unauthorised Message send;
- no unresolved serious intervention-related harm;
- and staff workload remains operationally manageable.

Final thresholds require approval.

---

## 166. Life Story Progression Thresholds

Draft thresholds include:

- most Participants offered Life Story can understand Private default;
- at least 70% of those who start can save or confirm an item;
- no unresolved authorship loss;
- no unresolved unintended sharing;
- AI invented-detail rate remains below the approved release threshold;
- and withdrawal propagation functions.

---

## 167. Community Progression Thresholds

Community may continue when:

- Block and Report remain available;
- Moderator response targets are met;
- no repeated serious privacy exposure occurs;
- no unmanageable harassment or scam pattern occurs;
- Participant burden remains acceptable;
- and membership remains voluntary.

---

## 168. Matching and Connection Progression Thresholds

Matching and Connection may continue when:

- prohibited-feature tests remain clear;
- no Block bypass occurs;
- MatchExplanation fidelity meets the approved threshold;
- one actor cannot submit another actor's decision;
- no non-mutual Connection occurs;
- MutualAcceptance preserves correct source records;
- expiry and invalidation work;
- one MutualAcceptance cannot activate two Connections;
- location privacy remains acceptable;
- fairness review identifies no unresolved material concern;
- and Participant comprehension is acceptable.

ConnectionRequest remains disabled.

## 169. Conversation and Messaging Progression Thresholds

Messaging may continue when:

- CommunicationBasis is always verified;
- ConversationThread participants remain exact;
- Draft remains distinct from send;
- SendConfirmation binds actor, version and recipients;
- MessageQueued is durable and idempotent;
- provider callbacks are authenticated and replay-protected;
- Sent, Provider Accepted, Delivered, Failed and Unknown remain accurate;
- no active Block is bypassed;
- pending delivery cancellation or limitation is handled transparently;
- scam and harassment controls are operational;
- Message privacy remains intact;
- and Participants understand delivery state.

A material false-delivery or confirmation defect requires feature pause.

## 170. AI Progression Thresholds

AI may continue when:

- no cross-Participant or cross-project leakage occurs;
- no prohibited autonomous action occurs;
- Life Story invention remains below the approved threshold;
- matching uses only allowed features;
- Message send remains confirmed;
- moderation remains provisional;
- SafetySignal routing meets requirements;
- dependency safeguards pass;
- and kill switches remain operational.

---

## 171. Accessibility Progression Thresholds

Accessibility is acceptable when:

- most Participants complete core tasks independently or with anticipated support;
- no core right remains inaccessible;
- key adaptations work reliably;
- error recovery is available;
- and no persistent unresolvable barrier affects an important subgroup.

---

## 172. Burden Thresholds

Burden review considers:

- Participant completion time;
- fatigue;
- support time;
- repeated assistance;
- emotional discomfort;
- disclosure burden;
- Moderator workload;
- Safety workload;
- and Researcher workload.

A single numeric burden threshold is insufficient without qualitative interpretation.

---

## 173. Moderation Oversight

Moderation oversight includes:

- named Community Safety or Moderation Owner;
- approved CommunityRuleVersion;
- Moderator training;
- queue monitoring;
- response targets;
- reporter confidentiality;
- escalation;
- appeal;
- restoration;
- and governance review.

---

## 174. Report Types

Reports may concern:

- user behaviour;
- PublicProfile;
- SocialPost;
- comment;
- Message;
- MatchCandidate;
- scam;
- harassment;
- impersonation;
- privacy;
- coercion;
- or safety.

Report remains available after Block or Disconnect.

---

## 175. Moderation Signal

Provider or AI classification is a provisional signal.

It may support:

- triage;
- category suggestion;
- evidence span;
- rule suggestion;
- or priority.

It is not a final ModerationDecision.

---

## 176. ModerationCase

ModerationCase records:

- linked reports;
- content and actor references;
- assignment;
- permitted evidence;
- rule version;
- provisional signals;
- human review;
- decision;
- action;
- duration;
- appeal;
- restoration;
- and closure.

---

## 177. ModerationDecision

A high-impact ModerationDecision requires:

- authorised human reviewer;
- evidence;
- rule version;
- reason;
- proportionality;
- duration;
- appeal information;
- and audit.

AI cannot become the decision-maker.

---

## 178. Moderation and Research Independence

Researcher access to moderation records is minimum-necessary.

Moderator identity and decision are not altered to improve study outcomes.

Research staff must not suppress reports to preserve feasibility metrics.

---

## 179. Safety Oversight

Safety oversight includes:

- named Safety Reviewer;
- severity and urgency;
- triage route;
- response target;
- intervention pause authority;
- study pause authority;
- escalation;
- monitoring;
- and audit.

Moderator and Safety Reviewer roles remain distinct.

---

## 180. SafetySignal Sources

SafetySignal may arise from:

- Participant report;
- Supporter report;
- Researcher observation;
- Moderator;
- system rule;
- provider signal;
- AI classification;
- or operational incident.

An automated source does not confirm the event.

---

## 181. SafetySignal Categories

Potential categories include:

- acute distress;
- self-harm concern;
- abuse or exploitation;
- coercion;
- unwanted contact;
- medical emergency concern;
- privacy disclosure;
- scam or fraud;
- severe confusion;
- AI dependency concern;
- harmful misinformation;
- and intervention-related burden.

Final categories are approved before enrolment.

---

## 182. SafetySignal Triage

Triage records:

- source;
- urgency;
- minimum necessary context;
- reviewer;
- assessment;
- relatedness;
- disposition;
- action;
- and time.

Disposition may be:

- close as not a SafetyEvent;
- monitor;
- escalate;
- pause;
- or convert to SafetyEvent.

---

## 183. SafetyEvent

SafetyEvent exists only after authorised human confirmation.

It records:

- category;
- severity;
- relatedness;
- affected intervention or feature;
- action;
- monitoring;
- resolution;
- closure;
- and reporting requirement.

---

## 184. Safety Severity

Representative severity may include:

- Low;
- Moderate;
- High;
- Serious;
- and Critical.

Severity definitions and response targets must be approved before enrolment.

---

## 185. Participant-Level Pause

A Participant-level pause may occur when:

- requested;
- Consent is uncertain;
- acute distress occurs;
- contact safety is uncertain;
- unwanted contact occurs;
- matching or Message concern occurs;
- a SafetySignal requires review;
- AI repeatedly causes distress;
- or technical failure prevents safe delivery.

---

## 186. Feature-Level Pause

A feature may be paused when:

- Life Story sharing fails;
- Community moderation capacity is inadequate;
- matching uses prohibited data;
- MatchExplanation is unreliable;
- MutualAcceptance is bypassed;
- Message send is unauthorised;
- Block propagation fails;
- AI boundary failure occurs;
- or provider behaviour changes materially.

---

## 187. Cohort-Level or Study-Level Pause

A broader pause may occur when:

- Consent enforcement fails systemically;
- cross-Participant leakage occurs;
- repeated serious harm occurs;
- moderation backlog becomes unsafe;
- multiple non-mutual Connections occur;
- reporter confidentiality fails;
- Protocol delivery differs materially from approval;
- audit becomes unreliable;
- Dataset integrity is compromised;
- or governance requires review.

---

## 188. Stopping Rules

The study may stop early when:

- serious or Critical intervention-related harm cannot be controlled;
- Consent or privacy cannot be assured;
- social-safety operations are not viable;
- AI repeatedly violates prohibited boundaries;
- recruitment or retention makes objectives infeasible;
- Platform failure prevents valid data collection;
- or the approving authority requires termination.

---

## 189. Emergency Limitation

The Platform and AI are not emergency services.

Participant materials state:

- how to seek local emergency or crisis support;
- which support is available from the study team;
- expected support hours;
- and limitations.

Emergency procedures are setting-specific and approved operationally.

---

## 190. Privacy and Confidentiality

Protections include:

- minimum collection;
- granular Consent;
- role and Relationship access;
- purpose;
- Specific Permission;
- Visibility;
- Block;
- protected existence;
- pseudonymous analysis;
- private object storage;
- AI Context minimisation;
- reporter confidentiality;
- secure export;
- audit;
- and deletion propagation.

---

## 191. Security Controls

Before enrolment, testing includes:

- authentication;
- wrong-role;
- wrong-Organisation;
- wrong-project;
- cross-Participant isolation;
- Consent withdrawal;
- Relationship revocation;
- Block;
- Visibility;
- MutualAcceptance;
- Message send;
- reporter protection;
- secure upload;
- prompt injection;
- Tool injection;
- backup restore;
- and incident simulation.

---

## 192. External Providers

Potential providers include:

- identity;
- AI;
- communication;
- hosting;
- object storage;
- transcription or translation;
- and analytics.

Each provider is reviewed for:

- purpose;
- data categories;
- region;
- retention;
- training use;
- subprocessors;
- security;
- deletion;
- incident response;
- and exit.

---

## 193. Data Residency

The approved Protocol and Data Management Plan specify permitted regions for:

- operational database;
- objects;
- backup;
- AI;
- communication;
- Search and Vector;
- and analytical environment.

Fallback cannot move data to an unauthorised region.

---

## 194. Retention

Retention is defined separately for:

- identifiable data;
- Consent evidence;
- Life Story;
- Community content;
- MatchCandidates;
- Connection;
- Messages;
- Block and reports;
- moderation;
- Safety;
- AIInteraction and AIMemoryItem;
- research datasets;
- Analysis artefacts;
- audit;
- and provider copies.

---

## 195. Deletion and Withdrawal Propagation

Propagation considers:

- source record;
- object storage;
- Search;
- Vector;
- cache;
- Community feed;
- matching;
- AI Context;
- AIMemoryItem;
- pending jobs;
- exports;
- providers;
- and public delivery.

Completion requires confirmation or documented exception.

---

## 196. Research Governance

Governance includes:

- Principal Investigator;
- Research Approver;
- Data Steward;
- Analysis Approver;
- AI Governance Owner;
- Moderator Owner;
- Safety Reviewer;
- Privacy and Security review;
- and Pilot Readiness authority.

Roles and separation of duties are documented.

---

## 197. Conflict of Interest

Potential conflicts include:

- researcher as Moderator;
- Tool developer as sole AI approver;
- analyst as DatasetLock authority;
- Moderator reviewing their own appeal;
- and provider owner approving their own privacy review.

Conflicts are recorded and mitigated.

---

## 198. Protocol Amendment

A Protocol amendment records:

- reason;
- affected Research Questions;
- intervention;
- Participant pathway;
- Consent;
- Community or matching;
- moderation and Safety;
- AI;
- measurement;
- DatasetDefinition;
- analysis;
- risk;
- and re-Consent decision.

---

## 199. Monitoring

Monitoring includes:

- recruitment;
- Consent;
- onboarding;
- intervention exposure;
- Life Story;
- Community;
- matching;
- Connection;
- Message;
- reports;
- moderation backlog;
- SafetySignal age;
- AI failures;
- accessibility;
- missingness;
- deviations;
- support burden;
- and technical reliability.

---

## 200. Interim Review

An interim review occurs:

- after the initial Stage A cohort;
- before Community activation where not already approved;
- before Open Matching activation;
- and at another approved point during recruitment.

It may recommend:

- continue;
- activate next stage;
- restrict;
- revise within approved range;
- pause;
- amend;
- or stop.

---

## 201. Interim Review Inputs

Inputs include:

- completion;
- support burden;
- Life Story privacy;
- accessibility;
- Community readiness;
- Moderator capacity;
- SafetySignals;
- AI evaluation;
- data quality;
- technical incidents;
- and Participant feedback.

---

## 202. Audit

Audit covers:

- Consent;
- Relationship;
- Life Story confirmation and sharing;
- PublicProfile;
- Community membership and publication;
- MatchPreference and MatchDecision;
- MutualAcceptance and Connection;
- Message send;
- Block and Report;
- moderation;
- Safety;
- AI Tool;
- DatasetLock;
- Analysis and Finding approval;
- export;
- and privileged access.

---

## 203. Synthetic Pilot

Before real enrolment, the team executes the complete synthetic pathway:

```text
Create and Approve ResearchProject
        ↓
Create Synthetic Participants
        ↓
Consent and Enrol
        ↓
Create and Confirm Life Story
        ↓
Join Community
        ↓
Run Matching and Record Independent Decisions
        ↓
Create MutualAcceptance
        ↓
Activate Connection
        ↓
Resolve CommunicationBasis
        ↓
Create ConversationThread
        ↓
Draft and Confirm Exact Message
        ↓
Queue and Submit through M16 Provider Adapter
        ↓
Process Authenticated Callback or Reconciliation
        ↓
Record Accurate Delivery State
        ↓
Simulate Human Interaction
        ↓
Trigger Block, Report, Moderation and Safety
        ↓
Complete Follow-Up
        ↓
Generate DatasetVersion
        ↓
Quality Review and DatasetLock
        ↓
AnalysisRun, Interpretation and ResearchFinding
```

Mandatory negative scenarios include:

- no MutualAcceptance;
- MutualAcceptance expiry and invalidation;
- attempted MutualAcceptance reuse;
- ConnectionRequest disabled;
- Thread without CommunicationBasis;
- mismatched SendConfirmation;
- attachment quarantine;
- duplicate or forged callback;
- Provider Accepted without Delivered;
- Delivery Unknown;
- Block after queue;
- and AI unauthorised send.

## 204. Synthetic Failure Scenarios

Mandatory failure scenarios include:

- Consent withdrawal;
- Life Story unintended-sharing attempt;
- AI invented-detail attempt;
- Supporter contribution rejection;
- Community report;
- prohibited matching attribute;
- no candidate;
- no MutualAcceptance;
- Block before matching;
- Block after Connection;
- Message delivery failure;
- unauthorised AI send;
- reporter confidentiality attempt;
- SafetySignal closed as not event;
- SafetyEvent conversion;
- Dataset exclusion;
- DatasetLock failure;
- Analysis rerun;
- and rejected ResearchFinding.

---

## 205. Pilot Readiness

Participant enrolment begins only when:

- approved ProtocolVersion exists;
- governance and ethics requirements are complete;
- intervention and AI configurations are approved;
- Consent materials are approved;
- moderation and Safety plans are operational;
- Moderator staffing and Safety Reviewer coverage are assigned;
- matching and MutualAcceptance tests pass;
- CommunicationBasis and ConversationThread tests pass;
- Message confirmation and delivery-state tests pass;
- provider callbacks and reconciliation pass;
- Block cancellation and propagation pass;
- measurements are configured;
- DatasetDefinition and AnalysisPlan are approved;
- staff are trained;
- accessibility testing passes;
- security and privacy testing passes;
- synthetic Pilot passes;
- backup restore passes;
- withdrawal and deletion propagation pass;
- and readiness is formally approved.

## 206. Social Safety and Communication Readiness

Community, matching or messaging activation additionally requires:

- Block and Report;
- CommunityRules;
- Moderator staffing;
- response targets;
- prohibited-feature tests;
- MatchExplanation evaluation;
- MatchDecision ownership tests;
- MutualAcceptance source, expiry, invalidation and single-use tests;
- Connection activation tests;
- CommunicationBasis tests;
- ConversationThread participant tests;
- SendConfirmation tests;
- provider callback authentication, idempotency and reconciliation;
- Message safety and privacy;
- pending-delivery cancellation after Block;
- scam and harassment tests;
- and feature-level pause capability.

## 207. AI Readiness

Participant-facing AI activation requires:

- approved provider;
- approved model alias;
- approved AI configuration;
- Prompt and Tool approval;
- permission and Context tests;
- Life Story invention tests;
- matching and Message tests;
- moderation and Safety boundary tests;
- accessibility;
- kill switches;
- fallback;
- retention;
- and deletion.

---

## 208. Data and Analysis Readiness

Required:

- MeasurementVersions;
- data dictionary;
- DatasetDefinition;
- variable dictionary;
- quality rules;
- de-identification plan;
- analytical environment;
- AnalysisPlan;
- DatasetLock authority;
- code and environment capture;
- and reproducibility test.

---

## 209. Staff Training

Training covers:

- Protocol;
- Consent;
- supported decision-making;
- accessibility;
- Life Story;
- Community and matching;
- Message safety;
- Block and Report;
- moderation;
- SafetySignal and SafetyEvent;
- AI boundaries;
- data entry;
- deviation;
- withdrawal;
- and incident response.

---

## 210. Participant Materials

Participant materials include:

- study information;
- Consent;
- accessibility guide;
- Life Story guide;
- visibility and sharing guide;
- Community Rules;
- matching explanation;
- Connection and Message safety;
- Block and Report;
- AI role and limitations;
- privacy and retention;
- support;
- withdrawal;
- and results summary plan.


---

## 211. Supporter Materials

Where Supporters participate, materials explain:

- Relationship purpose;
- permission scope;
- Participant authorship;
- supported decision-making;
- Life Story contribution;
- prohibited access;
- reporting;
- withdrawal;
- and loss of access after revocation.

---

## 212. Moderator Materials

Moderator materials include:

- Community Rules;
- case categories;
- evidence access;
- reporter confidentiality;
- provisional AI and provider signals;
- proportionality;
- action;
- appeal;
- restoration;
- SafetySignal link;
- escalation;
- and audit.

---

## 213. Safety Materials

Safety materials include:

- SafetySignal categories;
- urgency;
- severity;
- triage;
- relatedness;
- SafetyEvent confirmation;
- action;
- pause;
- emergency limitations;
- setting-specific contacts;
- and reporting.

---

## 214. Compensation

Compensation, if used, should be:

- proportionate;
- clearly explained;
- not contingent on positive feedback;
- not contingent on Community or matching participation;
- and not coercive.

Participants retain compensation already earned according to the approved schedule after withdrawal.

---

## 215. Compensation Schedule

The approved schedule should define compensation for:

- onboarding and baseline;
- intervention-period participation;
- end-of-Pilot assessment;
- optional interview;
- and optional follow-up.

No additional payment should pressure sharing, matching or Message activity.

---

## 216. Participant Experience Evaluation

Experience evaluation covers:

- understanding;
- perceived control;
- relevance;
- burden;
- accessibility;
- privacy;
- trust;
- Life Story;
- Community;
- matching;
- Connection;
- Message;
- AI;
- moderation;
- Safety;
- and support.

---

## 217. Platform Evaluation

Platform evaluation covers:

- reliability;
- permission correctness;
- Consent propagation;
- Block propagation;
- matching-policy enforcement;
- Message delivery;
- moderation queue;
- SafetySignal routing;
- AI Tool correctness;
- data quality;
- DatasetLock;
- reproducibility;
- support burden;
- and cost.

---

## 218. Equity and Inclusion

Equity review considers:

- who is recruited;
- who is excluded;
- who requires assistance;
- who completes;
- who opts into Community or matching;
- who receives candidates;
- who experiences errors or harms;
- who benefits;
- and which adaptations are available.

Observed group differences are interpreted cautiously.

---

## 219. Matching Fairness

Matching fairness review considers:

- candidate availability;
- repeated non-selection;
- exposure frequency;
- prohibited-feature use;
- location effects;
- language;
- accessibility;
- and explanation fidelity.

Acceptance rate alone is not a fairness measure.

---

## 220. Moderation Fairness

Moderation fairness review considers:

- signal and decision rates;
- false positives and negatives;
- contextual language;
- accessibility;
- cultural interpretation;
- appeal;
- restoration;
- and reviewer consistency.

---

## 221. AI Fairness

AI fairness review considers:

- task quality;
- language;
- accessibility;
- Life Story invention;
- matching explanation;
- moderation;
- SafetySignal routing;
- Tool denial;
- and human edit rate.

Protected-trait evaluation requires approved governance.

---

## 222. Potential Benefits

Potential Participant benefits include:

- easier preparation for human contact;
- increased confidence;
- meaningful self-expression;
- feeling heard;
- accessible participation;
- greater control over sharing;
- new voluntary connection opportunities;
- and improved understanding of digital social-safety controls.

Benefits are uncertain.

---

## 223. Potential Risks

Potential risks include:

- emotional discomfort;
- fatigue;
- unwanted disclosure;
- third-party privacy impact;
- unwanted contact;
- harassment;
- scam;
- mismatch;
- relationship conflict;
- AI error;
- invented Life Story detail;
- dependency;
- misunderstanding of visibility;
- technical failure;
- and data breach.

---

## 224. Risk Mitigation

Mitigation includes:

- Private default;
- granular Consent;
- ability adaptation;
- skip and pause;
- Participant confirmation;
- allowed matching attributes;
- MutualAcceptance;
- limited messaging;
- Block and Report;
- human moderation;
- Safety review;
- AI restrictions;
- data minimisation;
- staged activation;
- and stop rules.

---

## 225. Researcher Burden

The study records:

- onboarding support;
- accessibility support;
- Life Story review;
- Community support;
- Moderator time;
- Safety review time;
- AI review;
- data-quality work;
- and analytical preparation.

Operational burden is a feasibility result.

---

## 226. Dissemination

Results may be shared through:

- Participant summary;
- partner report;
- internal research report;
- academic manuscript;
- conference presentation;
- public summary;
- and approved Knowledge Platform EvidencePackage.

Dissemination distinguishes:

- feasibility;
- acceptability;
- accessibility;
- process;
- exploratory outcome;
- moderation and Safety;
- AI;
- null findings;
- negative findings;
- and uncertainty.

---

## 227. Public Dissemination Boundary

No identifiable:

- Life Story;
- PublicProfile detail;
- Message;
- MatchCandidate;
- reporter;
- moderation evidence;
- Safety detail;
- or AIInteraction

is included without specific authority and review.

A Platform Public item is not automatically available for research publication.

---

## 228. Participant Results

Participants should receive an accessible summary explaining:

- what was studied;
- who participated in broad terms;
- what was feasible;
- what Participants reported;
- what risks or problems occurred;
- important limitations;
- and what may happen next.

Individual-level interpretation is not clinical advice.

---

## 229. Partner Results

The partner may receive an approved report on:

- recruitment;
- delivery;
- accessibility;
- support;
- social-safety operations;
- moderation;
- Safety;
- technical reliability;
- and recommendations.

The report uses minimum necessary Participant data.

---

## 230. ResearchFinding Review

A ResearchFinding may be:

- Approved;
- Approved with Limitations;
- Rejected;
- Superseded;
- Withdrawn;
- or Archived.

Approval requires an authorised human reviewer.

---

## 231. InterventionDecision

The intervention receives one or more decisions:

- Retain;
- Revise;
- Restrict;
- Replicate;
- Expand;
- Suspend;
- Retire;
- or Continue Exploratory Research.

The decision references exact evidence, Protocol, intervention, AI, Dataset and Analysis versions.

---

## 232. Decision Dimensions

InterventionDecision considers:

- feasibility;
- acceptability;
- accessibility;
- early benefit;
- burden;
- equity;
- Life Story experience;
- Community safety;
- matching fairness;
- Connection quality;
- Message safety;
- moderation;
- Safety;
- AI;
- data quality;
- technical reliability;
- operational capacity;
- cost;
- and uncertainty.

---

## 233. Progression to a Larger Study

Progression may be considered when:

- primary feasibility threshold is met or reasonably close with remediable causes;
- no unresolved serious Consent, privacy or social-safety failure remains;
- accessibility is acceptable;
- intervention exposure is measurable;
- Dataset and Analysis are reproducible;
- Participant experience supports continuation;
- and operational capacity can support the next design.

---

## 234. Conditions for Revision Before Progression

Revision is required when:

- Life Story control is unclear;
- Community burden is excessive;
- matching produces insufficient or inequitable candidates;
- MatchExplanation is poorly understood;
- Message safety is weak;
- moderation capacity is inadequate;
- SafetySignal triage is delayed;
- AI invention or overreach persists;
- measurement burden is excessive;
- or data lineage is incomplete.

---

## 235. Conditions for Restriction

Restriction may apply to:

- a Participant subgroup;
- a Life Story modality;
- Community feature;
- matching attribute;
- Message attachment;
- AI role;
- provider;
- or data use.

Restriction must be evidence-based and not discriminatory.

---

## 236. Conditions for Suspension or Retirement

Suspension or retirement may be warranted when:

- serious harm cannot be controlled;
- Consent or privacy remains unreliable;
- social-safety operations are not viable;
- hidden or harmful matching persists;
- AI boundaries cannot be enforced;
- intervention burden outweighs likely value;
- or research data cannot support credible evaluation.

---

## 237. Reproducibility Package

The package should include:

- approved ProtocolVersion;
- EvidenceDecision and EvidenceSnapshot;
- InterventionVersion and configuration;
- AIInterventionConfigurationVersion;
- Prompt, Tool and model references;
- DatasetDefinition;
- DatasetVersion;
- manifest;
- variable dictionary;
- DatasetLock;
- AnalysisPlan;
- code;
- environment;
- AnalysisRun;
- AnalysisOutput;
- InterpretationRecord;
- ResearchFinding;
- and limitations.

---

## 238. Quality Assurance

Quality assurance includes:

- Protocol training;
- version control;
- form validation;
- source review;
- data-quality checks;
- deviation review;
- moderation review;
- Safety review;
- AI evaluation;
- Dataset review;
- code review;
- analysis review;
- and reproducibility test.

---

## 239. Source Data Review

Source review verifies:

- Participant identity linkage;
- Consent;
- eligibility;
- assignment;
- exposure;
- assessment;
- Life Story state;
- matching state;
- Connection;
- Message state;
- moderation;
- Safety;
- AI;
- correction;
- and withdrawal.

Review access is purpose-limited.

---

## 240. Data Freeze

Before final DatasetVersion generation:

- follow-up window closes;
- corrections are reconciled;
- withdrawal rules are applied;
- missingness is coded;
- source versions are stable;
- moderation and Safety records are reviewed;
- and data-quality issues have a disposition.

Data freeze does not itself create DatasetLock.

---

## 241. Early Termination Procedures

If terminated early:

- recruitment stops;
- affected intervention features pause;
- Participants are informed appropriately;
- Safety and support continue as required;
- provider activity is contained;
- data and Consent states are preserved;
- follow-up is offered where appropriate;
- and governance decides analysis and dissemination.

---

## 242. Limitations

Expected limitations include:

- small sample;
- single setting;
- no randomised comparator;
- short duration;
- staged feature activation;
- self-selection;
- optional Community and matching;
- unequal pathway exposure;
- candidate availability;
- support effects;
- novelty effects;
- provider dependence;
- exploratory outcome analysis;
- and limited generalisability.

---

## 243. Interpretation Limits

The study cannot establish:

- definitive clinical effectiveness;
- long-term reduction in loneliness;
- causal superiority of one pathway;
- general matching accuracy;
- safety in an unrestricted public network;
- or broad AI effectiveness.

Any such claim exceeds the design.

---

## 244. Future Study Options

If progression criteria are met, a later study may use:

- larger sample;
- comparator group;
- randomised or quasi-experimental design;
- longer follow-up;
- multiple settings;
- multilingual support;
- refined Life Story dose;
- refined matching;
- additional CommunitySpaces;
- and formal effectiveness outcomes.

---

## 245. Required Protocol Artefacts

Before approval:

- final ProtocolVersion;
- ResearchQuestions;
- EvidenceDecision;
- EvidenceSnapshot;
- intervention specification;
- InterventionConfiguration;
- AIInterventionConfigurationVersion;
- Consent materials;
- recruitment materials;
- screening form;
- eligibility checklist;
- CommunityRuleVersion;
- matching policy;
- MutualAcceptance policy;
- Connection activation rule;
- CommunicationBasis policy;
- ConversationThread and Message specification;
- communication-provider and callback contract;
- Block propagation and pending-delivery plan;
- moderation plan;
- Safety plan;
- assessment schedule;
- selected measures and licences;
- data dictionary;
- DatasetDefinition;
- explicit Message-body exclusion or separately approved restricted plan;
- de-identification plan;
- AnalysisPlan;
- Participant materials;
- Supporter materials;
- Moderator materials;
- Safety materials;
- staff training;
- synthetic Pilot script;
- adverse-event and incident forms;
- pause and stop plan;
- and dissemination plan.

## 246. Required Operational Artefacts

Required operational artefacts include:

- support model;
- Moderator roster;
- Safety Reviewer roster;
- escalation contacts;
- incident plan;
- provider register;
- feature-flag register;
- deployment and rollback plan;
- backup and restore report;
- deletion workflow;
- job and dead-letter procedure;
- and Pilot-day checklist.

---

## 247. Open Questions

1. Which Pilot setting and partner will be selected?
2. What age or Healthy Aging population definition will apply?
3. Is the target sample 24, or another number within the planning range?
4. How many Participants enter each staged cohort?
5. What exact Participant duration applies?
6. Which primary feasibility endpoint is designated?
7. Which acceptability measure is selected?
8. Which accessibility measures are selected?
9. Which connection or participation instrument is feasible and licensed?
10. Which autonomy or meaning measure is included?
11. Which qualitative method is used?
12. Is one Life Story item required or only offered?
13. Which Life Story prompts are approved?
14. Which media modalities are enabled?
15. Are Supporter contributions enabled?
16. Is LegacyPreference disabled for the whole Pilot?
17. Is Platform Public enabled, or only Community visibility?
18. Is Internet Public disabled for the entire Pilot?
19. Which CommunitySpaces are used?
20. Are comments and reactions enabled?
21. Which matching attributes are approved?
22. What broad location granularity is permitted?
23. How many MatchCandidates may be shown?
24. What candidate expiry applies?
25. Which MatchDecisions are reversible?
26. What effective period applies to MutualAcceptance?
27. Which conditions invalidate unused MutualAcceptance?
28. Does Connection activation require another acknowledgement?
29. Which pathway-specific interaction-completion rules apply?
30. Which CommunicationBasis types are enabled?
31. May an authorised Relationship create a Thread without Connection?
32. Are Message attachments enabled?
33. Which attachment types and limits apply?
34. Are read receipts disabled throughout the Pilot?
35. Which provider state qualifies as Delivered?
36. What timeout produces Delivery Unknown?
37. Which callback authentication and key rotation are used?
38. How often is delivery reconciliation performed?
39. Which queued delivery can be cancelled after Block?
40. Which Message metadata are included in DatasetDefinition?
41. Is Message body excluded from every ordinary Pilot dataset?
42. Which moderation response targets apply?
43. Which SafetySignal categories trigger immediate review?
44. Which AI Tools are enabled?
45. Is AIMemoryItem enabled?
46. Which provider jurisdictions are permitted?
47. Which retention periods apply to Messages and callback evidence?
48. Which pause threshold applies to false delivery presentation?
49. Which fairness thresholds apply to matching?
50. Which post-Pilot progression thresholds apply?

## 248. Protocol Design Decisions

This Protocol establishes that:

1. Document 19 v1.2 is the revised baseline for the initial Pilot Protocol.
2. The Protocol remains a draft until formal governance and ethics approval.
3. The intervention is Participant-Controlled Life Story and Meaningful Human Connection.
4. The study is a prospective single-arm mixed-method feasibility Pilot.
5. The study evaluates feasibility, acceptability, accessibility and operational safety before effectiveness.
6. The recommended Participant duration is approximately four weeks.
7. The recommended sample planning range is 18 to 30, with a working target near 24.
8. The sample is not powered for definitive effectiveness.
9. Staged feature activation is used.
10. Stage A begins with private Life Story and existing-contact capability.
11. Community activation requires Block, Report and Moderator readiness.
12. Open Matching activation requires matching, fairness, Block and MutualAcceptance readiness.
13. Messaging activation requires CommunicationBasis, confirmation, provider and delivery-state readiness.
14. One Participant may use more than one pathway.
15. Existing-contact, Community and matching pathways are analysed descriptively.
16. Declining Community does not imply study withdrawal.
17. Declining matching does not imply study withdrawal.
18. Declining messaging or AI does not imply study withdrawal.
19. No formal comparator is required.
20. Baseline and follow-up comparisons are exploratory.
21. Consent is accessible, granular, versioned and withdrawable.
22. Internet Public requires separate approval and is disabled by default.
23. Supported decision-making preserves Participant choice.
24. Supporter status does not create unrestricted access.
25. Withdrawal can apply to one component or the entire study.
26. Private Life Story is a required Platform capability.
27. Life Story activity may be offered rather than forced.
28. LifeStoryItem retains source, version and authorship.
29. AI Draft is not ParticipantTestimony.
30. Open Matching is opt-in.
31. MatchCandidate is not MatchDecision or MutualAcceptance.
32. Each MatchDecision is actor-owned and independent.
33. MutualAcceptance is a canonical aggregate and process event.
34. MutualAcceptance preserves exact source records and policy version.
35. Unused MutualAcceptance may expire or be invalidated.
36. One MutualAcceptance activates at most one Connection.
37. ConnectionRequest is not used in this Pilot.
38. Connection activates only from valid unused MutualAcceptance.
39. Existing authorised contacts may participate without M18 Connection.
40. Connection does not create Supporter, care or research authority.
41. CommunicationBasis is required for Platform ConversationThread and Message.
42. ConversationThread participants are exact and cannot be silently expanded.
43. Message Draft is not sent.
44. SendConfirmation is actor-, Message-version- and recipient-specific.
45. Queued, Sent, Provider Accepted, Delivered, Failed and Unknown are separate.
46. Provider Accepted is not Delivered.
47. Read receipts are disabled by default.
48. MessageSent is not interpreted as meaningful human interaction.
49. Provider callbacks require authentication, replay protection and idempotency.
50. Message body is excluded from ordinary research.
51. Any Message-content analysis requires a separate restricted protocol amendment or study.
52. Block prevents matching, MutualAcceptance, Connection, Thread creation and Message send.
53. Block revocation does not restore prior state.
54. Report remains available after Block or Disconnect.
55. ModerationCase and SafetyEvent remain separate.
56. Automated systems raise SafetySignal, not confirmed SafetyEvent.
57. AI may Draft and explain but cannot create MutualAcceptance, Connection, Thread or unconfirmed send.
58. AI cannot claim delivery from Queued, Sent or Provider Accepted.
59. DatasetDefinition names every included social and Message variable.
60. DatasetVersion is immutable after DatasetLock.
61. Analysis uses approved AnalysisPlan and locked DatasetVersion.
62. Null, negative, harmful and implementation-failure findings remain reportable.
63. Activity volume alone is not evidence of benefit.
64. Synthetic Pilot precedes real enrolment.
65. A material false-delivery, Block-bypass or unauthorised-send defect pauses the feature.
66. Version 1.2 completes Protocol revalidation against Documents 8, 12, 13, 15, 16 and 18.

## 249. Summary

This Protocol defines the first controlled study of an integrated Healthy Aging digital intervention.

The Participant pathway is:

```text
Recruit and Screen
        ↓
Accessible Granular Consent
        ↓
Baseline and Ability Preferences
        ↓
Private Life Story
        ↓
Optional Sharing and Governed Community
        ↓
Existing Contact or Opt-In Open Matching
        ↓
Independent MatchDecision
        ↓
MutualAcceptance
        ↓
Connection where Matching Is Used
        ↓
CommunicationBasis
        ↓
ConversationThread and Message Draft
        ↓
Exact SendConfirmation
        ↓
Accurate Delivery State
        ↓
Meaningful Human Interaction
        ↓
Reflection and Follow-Up
```

The research boundary is:

```text
MessageSent
    ≠ Delivered
    ≠ Human Interaction Completed
    ≠ Healthy Aging Benefit
```

The central Protocol rule is:

> Every process event must retain its exact domain meaning so that Participant experience, Safety, burden, feasibility and research interpretation are not distorted by compressed or ambiguous technical states.

This Protocol remains a draft until governance and ethics approval.
