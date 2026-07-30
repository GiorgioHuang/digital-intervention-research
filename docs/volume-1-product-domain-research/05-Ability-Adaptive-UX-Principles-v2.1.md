# Document 5 — Ability-Adaptive UX Principles

**Version:** 2.1  
**Status:** Revised UX Principle Baseline  
**Handbook Volume:** Volume I — Product, Domain & Research Architecture  
**Primary System:** Digital Intervention Research Platform  
**Document Owner:** UX, Accessibility, and Participant Experience Governance  
**Approved By:** To be assigned  
**Last Updated:** 2026-07-28  
**Supersedes:** Document 5 — Ability-Adaptive UX Principles v2.0  
**Review Trigger:** A material change to accessibility principles, adaptation modes, sensitive inference, AI personalisation, supported interaction, consent presentation, measurement adaptation, Participant control, or the relationship between ability adaptation and intervention delivery

---

## 1. Purpose

This document defines the authoritative **Ability-Adaptive UX Principles** for the **Healthy Aging Digital Intervention Research Platform**.

It establishes how the platform should adapt presentation, interaction, assistance, pacing, modality, and communication to a Participant's abilities, preferences, task demands, and context.

It also defines the limits of adaptation.

The central rule is:

> The platform may adapt how a person accesses and completes a task, but it must not silently change what the task means, what the person is consenting to, which rights they hold, which permissions apply, which intervention they receive, or how research claims are interpreted.

Ability-adaptive UX exists to:

- reduce unnecessary barriers;
- preserve autonomy;
- improve comprehension;
- support participation;
- reduce burden;
- strengthen error recovery;
- support different abilities and preferences;
- and make digital intervention research more inclusive.

It does not exist to:

- classify people by age stereotype;
- diagnose impairment;
- hide complexity through deception;
- manipulate engagement;
- infer decision-making capacity;
- or silently remove choices.

---

## 2. Scope

This document covers:

- ability-adaptive design principles;
- accessibility by default;
- Participant preferences;
- adaptation inputs;
- adaptation outputs;
- adaptation modes;
- adaptation priority;
- sensitive inference;
- AI-assisted adaptation;
- personalisation;
- consent and permission boundaries;
- supported decision-making;
- substitute-authority boundaries;
- cognitive accessibility;
- visual accessibility;
- hearing accessibility;
- motor accessibility;
- communication and language accessibility;
- digital-literacy support;
- fatigue and pacing;
- environment and device context;
- assessment and measurement adaptation;
- intervention adaptation;
- notification adaptation;
- error recovery;
- multi-device consistency;
- accessibility testing;
- UX evaluation;
- research traceability;
- governance;
- MVP requirements;
- deferred capabilities;
- and open questions.

This document does not define:

- final page layouts;
- final navigation labels;
- final visual identity;
- final design tokens;
- final component implementation;
- final device-specific UI;
- final accessibility-test results;
- or final Participant-facing copy.

Document 20 remains authoritative for:

- detailed UX flows;
- component behaviour;
- responsive layouts;
- design tokens;
- interaction states;
- and design-system implementation.

---

## 3. Relationship to Other Documents

### Depends on

- Document 0 — Platform Ecosystem Architecture
- Document 1 — Project Definition & Vision
- Document 2 — Conceptual & Evidence Framework
- Document 3 — Intervention Map
- Document 4 — User Roles & Permission Model

### Provides input to

- Document 6 — Core Product Modules
- Document 7 — Information Architecture
- Document 8 — Core Domain Model & Ubiquitous Language
- Document 9 — Evidence & Knowledge Integration Architecture
- Document 10 — AI Companion Architecture
- Document 11 — Research & Evaluation Framework
- Document 12 — Data & Interoperability Architecture
- Document 13 — System Context & Technical Architecture
- Document 14 — Security, Privacy & Consent Architecture
- Document 15 — API, Event & Integration Specifications
- Document 16 — Database & Storage Design
- Document 17 — AI Orchestration & Model Operations
- Document 18 — MVP Scope & Delivery Roadmap
- Document 19 — Initial Pilot Research Protocol
- Document 20 — UX Flows & Design System Specification

Document 4 remains authoritative for:

- roles;
- relationships;
- consent;
- delegation;
- supported decision-making;
- substitute authority;
- purpose;
- context;
- permissions;
- and resource state.

Document 20 remains authoritative for detailed interface implementation.

---

## 4. Canonical Terminology

### 4.1 Participant

The canonical domain actor for a person invited to, screened for, enrolled in, or interacting through a Research Project.

### 4.2 Older Adult

A population description.

It does not define ability, role, support need, or interface mode.

### 4.3 Resident

A setting-specific term used only in residential, assisted-living, or long-term care contexts.

### 4.4 Supporter

A person authorised to assist a Participant within an explicit relationship, consent, purpose, and permission scope.

### 4.5 Ability Adaptation

A governed change to presentation, interaction, assistance, pacing, modality, or communication intended to reduce a barrier.

### 4.6 Accessibility Preference

A Participant-selected or Participant-approved setting describing how they prefer to interact.

### 4.7 Adaptation Suggestion

A reversible suggestion that the Participant may accept, reject, or modify.

### 4.8 Adaptive Inference

A system or AI inference that an adaptation may help.

An Adaptive Inference is not a diagnosis, assessment result, or permission decision.

### 4.9 Supporter-Assisted Mode

A mode in which an authorised Supporter assists the Participant without taking over the Participant's decision.

### 4.10 Semantic Equivalence

The requirement that accessible presentation preserves the essential meaning, rights, options, and consequences of the original content.

---

## 5. Core UX Position

The platform should be:

```text
Accessible by Default
        +
Preference-Aware
        +
Ability-Adaptive
        +
Task-Aware
        +
Context-Aware
        +
Participant-Controlled
        +
Research-Traceable
```

Ability adaptation should not be treated as a cosmetic accessibility add-on.

It is part of:

- intervention access;
- consent quality;
- research inclusion;
- Participant autonomy;
- measurement validity;
- safety;
- and product quality.

---

## 6. Why Ability-Adaptive UX Is Necessary

Older adults and other Participants may differ in:

- vision;
- hearing;
- motor control;
- mobility;
- communication;
- language;
- literacy;
- cognitive load;
- memory demands;
- attention;
- fatigue;
- digital experience;
- device access;
- confidence;
- emotional state;
- support availability;
- and environmental conditions.

Chronological age does not reliably predict these characteristics.

A single universal `Senior Mode` would:

- stereotype Participants;
- hide meaningful variation;
- exclude people whose needs do not match the stereotype;
- and reduce Participant control.

---

## 7. Foundational Principles

## 7.1 Ability Over Age

Adapt to actual needs, preferences, and task conditions rather than age categories.

## 7.2 Accessibility by Default

Core tasks should be accessible without requiring the Participant to discover a hidden accessibility menu.

## 7.3 Preference Before Inference

Use explicit Participant preference before system inference whenever possible.

## 7.4 Participant Control

The Participant should be able to:

- choose;
- preview;
- accept;
- reject;
- change;
- pause;
- or reset

adaptations where possible.

## 7.5 One Meaningful Decision at a Time

High-burden workflows should avoid presenting too many simultaneous decisions.

## 7.6 Progressive Disclosure

Present the information needed for the current decision.

Provide additional detail without hiding material meaning.

## 7.7 Semantic Equivalence

Adaptation must preserve:

- meaning;
- rights;
- choices;
- risks;
- obligations;
- and consequences.

## 7.8 Reversibility

Adaptations should be reversible unless a safety or technical requirement prevents reversal.

## 7.9 Transparency

The Participant should understand:

- what changed;
- why;
- whether it will be remembered;
- and how to undo it.

## 7.10 Predictability

Core navigation, controls, language, and task sequence should remain consistent.

## 7.11 Error Tolerance

The interface should support:

- correction;
- retry;
- undo;
- pause;
- and return.

## 7.12 Human Support

The Participant should be able to request appropriate human assistance.

## 7.13 AI Companion as Assistant

The AI Companion may support adaptation.

It does not define the person's ability or make final high-impact decisions.

## 7.14 Privacy and Minimum Necessary Data

Adaptation should use the minimum information required for an approved purpose.

## 7.15 Evidence and Evaluation

Adaptation effectiveness should be evaluated rather than assumed.

---

## 8. Adaptation Invariants

Ability adaptation may change:

- visual presentation;
- wording complexity;
- information density;
- navigation sequence;
- pacing;
- timing;
- input method;
- output modality;
- confirmation frequency;
- help visibility;
- and Supporter assistance.

Ability adaptation must not change:

- Participant rights;
- consent meaning;
- consent scope;
- relationship authority;
- purpose-of-use;
- specific permission;
- Protocol meaning;
- intervention objective;
- required safety information;
- outcome definition;
- scientific claim;
- data-retention rule;
- or withdrawal rights.

---

## 9. Permission Foundation

Any adaptation using sensitive Participant context should be governed by:

```text
Role
+ Relationship
+ Consent
+ Purpose
+ Context
+ Specific Permission
+ Resource State
```

An interface may not reveal sensitive information merely because doing so would make a task easier.

A Supporter may not gain access merely because the Participant needs assistance.

An AI system may not receive more data merely because it could personalise the interface.

---

## 10. Ability Dimensions

The platform should consider ability as multidimensional and contextual.

Relevant dimensions include:

1. visual;
2. hearing;
3. motor;
4. mobility and reach;
5. communication;
6. language;
7. literacy;
8. cognitive load;
9. memory demand;
10. attention;
11. fatigue and endurance;
12. digital experience;
13. confidence;
14. emotional state;
15. device and connectivity;
16. environmental context;
17. support availability;
18. and task complexity.

These dimensions should not be collapsed into one general ability score.

---

## 11. Visual Ability

Potential barriers include:

- small text;
- low contrast;
- dense layouts;
- unclear hierarchy;
- reliance on colour;
- poor focus visibility;
- complex charts;
- and information outside the visible viewport.

Potential adaptations include:

- scalable text;
- stronger contrast;
- larger controls;
- reduced visual density;
- clearer hierarchy;
- text alternatives;
- visible focus;
- and simplified charts with text summaries.

---

## 12. Hearing Ability

Potential barriers include:

- audio-only instructions;
- unclear speech;
- missing captions;
- alert sounds without visual equivalent;
- and inability to replay.

Potential adaptations include:

- captions;
- transcripts;
- visual alerts;
- adjustable volume;
- slower playback;
- replay;
- and text alternatives.

---

## 13. Motor Ability

Potential barriers include:

- small targets;
- precision dragging;
- rapid gestures;
- long reach;
- repeated tapping;
- complex keyboard shortcuts;
- and short time limits.

Potential adaptations include:

- larger targets;
- increased spacing;
- keyboard access;
- switch-compatible patterns where feasible;
- voice input;
- reduced gesture dependency;
- extended timing;
- and alternatives to dragging.

---

## 14. Communication Ability

Potential barriers include:

- long free-text requirements;
- unclear questions;
- rapid conversational turn-taking;
- speech-only input;
- and lack of alternative expression.

Potential adaptations include:

- structured choices;
- optional free text;
- voice or text alternatives;
- replay;
- confirmation;
- slower pacing;
- communication prompts;
- and Supporter assistance where authorised.

---

## 15. Language and Literacy

Potential barriers include:

- specialist terminology;
- long sentences;
- idioms;
- unexplained abbreviations;
- culturally narrow examples;
- and unreviewed machine translation.

Potential adaptations include:

- plain language;
- definitions;
- shorter sections;
- examples;
- approved translation;
- bilingual display where supported;
- and read-aloud.

Simplification must not remove material meaning.

---

## 16. Cognitive Load

Potential barriers include:

- too many choices;
- hidden dependencies;
- inconsistent navigation;
- working-memory demands;
- long forms;
- delayed feedback;
- and abrupt context changes.

Potential adaptations include:

- step-by-step mode;
- progressive disclosure;
- repeated orientation;
- short sections;
- visible progress;
- recognition over recall;
- summary before submission;
- and pause and return.

---

## 17. Memory Demand

The platform should avoid requiring Participants to remember information that the system can safely and transparently show again.

Useful patterns include:

- visible current step;
- recent activity summary;
- saved draft;
- current choice summary;
- upcoming activity;
- source and timestamp;
- and easy return to home.

Supportive memory design should not become covert cognitive testing.

---

## 18. Attention

Potential barriers include:

- competing alerts;
- animation;
- auto-advancing content;
- excessive decoration;
- and unnecessary secondary actions.

Potential adaptations include:

- reduced motion;
- low-stimulation mode;
- one primary action;
- quiet visual hierarchy;
- pause controls;
- and reduced notification frequency.

---

## 19. Fatigue and Endurance

Participant ability may vary:

- across the day;
- during illness;
- after an intervention;
- or over the course of a long task.

The platform should support:

- short task segments;
- pause;
- save and return;
- extended time;
- estimated effort;
- reduced repetition;
- and acknowledgement of incomplete participation without shame.

---

## 20. Digital Experience

Digital experience should not be inferred from age.

Potential adaptations include:

- guided onboarding;
- examples;
- visible help;
- clear back behaviour;
- confirmation;
- terminology explanation;
- practice tasks;
- and gradual introduction of advanced capabilities.

---

## 21. Emotional State

A Participant may temporarily experience:

- anxiety;
- grief;
- frustration;
- distress;
- uncertainty;
- or low confidence.

The platform may respond with:

- slower pacing;
- reduced task burden;
- clear options;
- acknowledgement;
- pause;
- support request;
- or Safety Signal escalation.

The platform must not:

- diagnose emotional state from interaction alone;
- secretly profile vulnerability;
- manipulate the Participant;
- or use distress to increase engagement.

---

## 22. Device and Environment

Relevant context includes:

- mobile, tablet, desktop, television, or shared device;
- screen size;
- input method;
- lighting;
- noise;
- connectivity;
- privacy;
- physical position;
- and availability of Supporter assistance.

Adaptation should consider the device without making assumptions about the Participant.

---

## 23. Task Complexity

The same Participant may need different support for:

- reading a reminder;
- granting consent;
- selecting a contact;
- completing an assessment;
- responding to a Safety Event;
- or approving an AI-generated action.

High-impact tasks require greater clarity and confirmation.

---

## 24. Adaptation Input Model

```text
Participant Preference
        +
Approved Accessibility Profile
        +
Task Requirements
        +
Device and Environment
        +
Observed Interaction Difficulty
        +
Support Availability
        +
Approved Adaptive Inference
        ↓
Adaptation Suggestion or Applied Presentation
```

Not every input should have equal authority.

---

## 25. Adaptation Priority

The preferred priority order is:

```text
1. Explicit Participant Choice
2. Participant-Approved Saved Preference
3. Accessibility Requirement of the Current Task
4. Approved Supporter Assistance
5. Observed Difficulty
6. AI or System Suggestion
```

A lower-priority source should not silently override a higher-priority Participant choice.

---

## 26. Adaptation Sources

### 26.1 Participant Selection

The strongest default source.

### 26.2 Approved Profile

A saved preference explicitly approved by the Participant.

### 26.3 Task Requirement

Some tasks require accessible presentation by default.

### 26.4 Supporter Assistance

May help configure presentation within granted permission.

### 26.5 Researcher or Staff Suggestion

May be offered where appropriate.

### 26.6 Observed Difficulty

May trigger a suggestion, not a diagnosis.

### 26.7 AI Companion Suggestion

May propose an adaptation within an approved configuration.

---

## 27. Adaptation Output Types

### 27.1 Presentation Adaptation

Changes:

- text size;
- contrast;
- spacing;
- hierarchy;
- visual density;
- or focus treatment.

### 27.2 Content Adaptation

Changes:

- sentence complexity;
- detail level;
- examples;
- glossary support;
- or section length.

### 27.3 Interaction Adaptation

Changes:

- number of simultaneous choices;
- confirmation;
- navigation steps;
- target size;
- input method;
- or error support.

### 27.4 Timing Adaptation

Changes:

- response time;
- timeout;
- reminder timing;
- pacing;
- or media speed.

### 27.5 Modality Adaptation

Changes:

- text;
- speech;
- audio;
- caption;
- image;
- video;
- or multimodal presentation.

### 27.6 Assistance Adaptation

Changes:

- help visibility;
- examples;
- Supporter-assisted mode;
- human handoff;
- or AI Companion assistance.

### 27.7 Notification Adaptation

Changes:

- channel;
- frequency;
- privacy level;
- quiet hours;
- and reminder wording.

---

## 28. Canonical Adaptation Modes

The platform should support a small number of understandable modes.

### Standard

Default accessible interface.

### Simple

Reduced wording and fewer secondary actions.

### Step-by-Step

One meaningful decision at a time.

### High Visibility

Larger text, stronger contrast, larger controls, and reduced density.

### Read-Aloud

Visible text with speech output and replay.

### Supporter-Assisted

An authorised Supporter may assist within explicit scope.

### Low Stimulation

Reduced motion, decoration, alerts, and simultaneous content.

Modes may be combined where implementation supports it.

---

## 29. Adaptation Mode Rules

Adaptation modes should be:

- clearly named;
- previewable;
- reversible;
- available during the task;
- persistent only when approved;
- and understandable without technical language.

A mode should not be named after a diagnosis or age stereotype.

Avoid labels such as:

- Dementia Mode;
- Frail Mode;
- Low Intelligence Mode;
- or Senior Mode.

---

## 30. Persistent Preferences

A saved accessibility preference should include:

- Participant;
- preference type;
- selected value;
- source;
- consent or permission basis where relevant;
- effective time;
- last confirmation;
- expiry or review;
- and correction history.

A preference should not become permanent merely because it was once useful.

---

## 31. Temporary Adaptation

Some adaptations should apply only to:

- the current screen;
- current task;
- current session;
- current device;
- or current intervention activity.

Temporary adaptation should not silently change the Participant's long-term profile.

---

## 32. Preview

Where possible, the Participant should be able to preview an adaptation before applying it.

Examples:

- text size;
- contrast;
- simple language;
- read-aloud speed;
- notification wording;
- and low-stimulation mode.

---

## 33. Override

The Participant should be able to override a system or AI suggestion unless:

- the choice would make the task technically impossible;
- the choice would remove mandatory safety information;
- or the choice would violate an approved Protocol.

The reason should be explained.

---

## 34. Reset

The Participant should be able to:

- reset one preference;
- reset the current task;
- or restore the standard accessible interface.

Reset should not remove unrelated consent or relationship settings.

---

# Sensitive Adaptive Inference

---

## 35. Definition

Sensitive Adaptive Inference occurs when the platform infers that a Participant may need an adaptation based on:

- interaction behaviour;
- error patterns;
- response time;
- voice;
- text;
- emotional language;
- sensor data;
- Supporter observation;
- or another potentially sensitive signal.

Sensitive inference requires stronger governance than explicit preference.

---

## 36. Sensitive Inference Principles

Every sensitive Adaptive Inference should be:

- purpose-limited;
- minimum necessary;
- consent-aware;
- source-labelled;
- uncertainty-aware;
- visible where appropriate;
- correctable;
- reversible;
- time-bounded;
- and auditable.

---

## 37. No Diagnostic Interpretation

An Adaptive Inference must not be presented as:

- diagnosis;
- impairment classification;
- cognitive score;
- emotional-health assessment;
- decision-making-capacity determination;
- or clinical fact.

Examples:

Prefer:

> “Would a step-by-step view help with this task?”

Avoid:

> “You appear cognitively impaired.”

---

## 38. No Hidden Capacity Score

The platform must not silently create a general score representing:

- intelligence;
- competence;
- cognitive decline;
- vulnerability;
- independence;
- or decision-making capacity

from interaction data.

Any formal assessment requires:

- an approved purpose;
- an approved measurement;
- consent;
- appropriate professional or research governance;
- and explicit interpretation rules.

---

## 39. No Rights or Permission Change

Adaptive Inference must not automatically:

- remove an option;
- reduce Participant control;
- give a Supporter more access;
- alter consent;
- change eligibility;
- change enrolment;
- limit withdrawal;
- broaden AI context;
- or change data-sharing permissions.

---

## 40. No Silent Intervention Change

An adaptation must not silently change:

- the intervention objective;
- required component;
- dose;
- mechanism;
- measurement;
- or Protocol.

A material change requires:

- an approved adaptation range;
- an Intervention Version change;
- a Protocol amendment;
- or re-consent

as applicable.

---

## 41. Inference Source Visibility

Where appropriate, the Participant or authorised reviewer should be able to understand whether an adaptation came from:

- Participant preference;
- Supporter assistance;
- staff selection;
- system rule;
- observed interaction;
- or AI suggestion.

The platform should not falsely present an inferred preference as a Participant choice.

---

## 42. Inference Uncertainty

The system should use language such as:

- “This may help.”
- “Would you like to try a simpler view?”
- “You can change this at any time.”
- “This suggestion is based on difficulty detected in the current task.”

It should not present uncertain inference as fact.

---

## 43. Correction and Feedback

The Participant should be able to indicate:

- this adaptation helped;
- this adaptation did not help;
- do not suggest this again;
- use this only for this task;
- or save this preference.

Feedback should improve the experience without creating hidden classification.

---

## 44. Emotional-State Inference

Emotion-aware interaction is a high-risk future capability.

Before implementation, it requires:

- a defined intervention or support purpose;
- evidence;
- consent;
- source and model disclosure;
- uncertainty;
- bias evaluation;
- false-positive and false-negative analysis;
- human escalation rules;
- retention limits;
- and Participant control.

Emotion inference must not be used for:

- engagement manipulation;
- advertising;
- coercive reminders;
- relationship simulation;
- or hidden risk scoring.

---

## 45. Predictive Accessibility

Predictive accessibility may suggest future support based on prior preferences or repeated barriers.

It should not:

- predict diagnosis;
- remove capability;
- pre-emptively restrict participation;
- or create permanent labels.

Predictions should be:

- optional;
- explainable;
- reversible;
- and evaluated.

---

## 46. Context-Aware Adaptation

Context-aware adaptation may consider:

- device;
- screen size;
- connectivity;
- noise;
- time available;
- current task;
- and current support setting.

It should avoid using:

- precise location;
- private communications;
- unrelated health information;
- or broad behavioural history

unless specifically justified and authorised.

---

# Participant Control, Consent, and Support

---

## 47. Participant Control

The Participant should be able to access:

- current accessibility preferences;
- current adaptation mode;
- remembered preferences;
- current Supporter assistance;
- current AI use;
- and current notification settings.

---

## 48. Consent

Consent presentation may be adapted for accessibility.

Adaptation must preserve:

- study purpose;
- activities;
- risks;
- burden;
- AI use;
- data use;
- sharing;
- optional choices;
- withdrawal;
- and contact information.

Accessible consent must not become shortened consent that omits material information.

---

## 49. Consent Knowledge Check

A knowledge check may use:

- plain language;
- replay;
- explanation;
- examples;
- and additional time.

It should not be designed to:

- shame;
- pressure;
- exclude based on digital skill;
- or infer legal capacity from one incorrect response.

---

## 50. Consent Choice Presentation

Consent choices should:

- show clear yes and no options;
- avoid preselected optional choices;
- distinguish required from optional participation;
- allow review;
- and provide a final summary.

A simpler interface must not make declining harder than accepting.

---

## 51. Re-Consent

When a material change requires re-consent, the adapted presentation should:

- identify what changed;
- preserve the prior choice history;
- explain new consequences;
- and avoid assuming continued agreement.

---

## 52. Supported Decision-Making

An authorised Supporter may help the Participant:

- read;
- understand;
- navigate;
- compare options;
- communicate a preference;
- or complete a physical interaction.

The platform should record:

- Supporter identity;
- assistance provided;
- decision made by;
- and any concern.

---

## 53. Supporter-Assisted Mode

Supporter-Assisted Mode should clearly display:

- current Participant;
- current Supporter;
- permitted task;
- permitted data;
- whether the Supporter may enter information;
- and how the Participant can stop the assistance.

The Supporter must not gain access to unrelated content.

---

## 54. Substitute Authority Boundary

Substitute authority is not an accessibility preference.

It requires:

- an applicable authority basis;
- a defined decision scope;
- verification;
- governance;
- and audit.

The platform must not infer substitute authority from:

- family relationship;
- disability;
- age;
- interface difficulty;
- or Supporter presence.

---

# AI Companion and Ability Adaptation

---

## 55. AI Companion Role

The AI Companion may:

- explain a task;
- simplify language;
- break a task into steps;
- repeat information;
- provide examples;
- support alternative input;
- offer a draft;
- suggest an adaptation;
- and request human support.

It does not own the Participant's accessibility profile.

---

## 56. Effective AI Permission

AI-assisted adaptation operates within:

```text
Human Actor Permission
+ Approved AI Configuration
+ Approved Task
+ Consent
+ Purpose
+ Context
+ Data Classification
+ Action Risk
```

The AI Companion receives only the intersection of these conditions.

---

## 57. AI Adaptation Rules

The AI Companion should:

- ask before applying a persistent change;
- distinguish suggestion from action;
- state uncertainty;
- use minimum necessary context;
- avoid diagnostic language;
- preserve Participant choice;
- and allow correction.

---

## 58. AI Communication Style

The Participant may select an approved communication style such as:

- concise;
- step-by-step;
- simple language;
- more explanation;
- slower pacing;
- or neutral professional language.

Style adaptation must not change factual or consent meaning.

---

## 59. AI Identity

Adapted AI presentation must continue to identify the AI Companion clearly.

A simpler interface must not make the AI appear human.

The AI must not claim:

- feelings;
- need;
- consciousness;
- exclusivity;
- or authority it does not hold.

---

## 60. AI Memory

If accessibility preferences are remembered through AI-related memory, the Participant should be able to understand:

- what is remembered;
- why;
- source;
- duration;
- and how to correct or delete it where permitted.

Memory should not contain an unsupported diagnostic label.

---

## 61. AI Failure

When AI adaptation is unavailable:

- standard accessible controls should remain available;
- core tasks should remain possible where feasible;
- no indefinite “thinking” state should appear;
- and the Participant should be offered a manual or human-support path.

---

## 62. AI Safety Escalation

The AI Companion may identify a possible Safety Signal.

It may:

- acknowledge;
- suggest pause;
- offer human support;
- or create a review request.

It may not make the final safety or clinical decision.

---

# Core Interaction Principles

---

## 63. Progressive Disclosure

Progressive disclosure should:

- show essential information first;
- allow more detail;
- preserve access to full material content;
- and not hide risk, consent, or consequences.

---

## 64. Step-by-Step Interaction

Step-by-step interaction is appropriate for:

- consent;
- onboarding;
- assessment;
- intervention preparation;
- relationship permission;
- withdrawal;
- and high-impact confirmation.

The Participant should be able to see progress and return to earlier steps.

---

## 65. Recognition Over Recall

The interface should prefer:

- visible choices;
- recent context;
- summaries;
- familiar labels;
- and current status

over requiring the Participant to remember hidden information.

---

## 66. Clear Primary Action

Each task region should have one clearly prioritised primary action.

Secondary actions should remain visible without competing for attention.

---

## 67. Specific Action Labels

Use labels such as:

- Save Draft
- Continue to Consent Choices
- Confirm and Send
- Pause Activity
- Request Help
- Withdraw from Study

Avoid vague labels when consequences are material.

---

## 68. Confirmation

Confirmation is appropriate when an action affects:

- consent;
- relationship access;
- message delivery;
- data sharing;
- withdrawal;
- deletion;
- Dataset Lock;
- or another high-impact outcome.

Confirmation should explain what will happen.

---

## 69. Error Recovery

Errors should state:

- what happened;
- whether work was saved;
- what can be done;
- whether the action was submitted;
- and how to obtain help.

---

## 70. Pause and Return

Long or demanding tasks should support:

- pause;
- save;
- exit;
- return;
- and visible completion status.

Pausing should not be treated as failure.

---

## 71. Session Timeout

Timeout should:

- provide warning;
- allow extension;
- preserve work where safe;
- and avoid exposing sensitive information on shared devices.

---

## 72. Offline and Connectivity

Where connectivity is unreliable, the interface should:

- preserve safe draft work;
- identify what is unavailable;
- avoid duplicate submission;
- and provide a retry path.

---

## 73. Degraded State

When an external service is unavailable:

- approved stored information may remain visible;
- unsupported new claims should not be generated;
- manual alternatives should be offered;
- and the task state should remain clear.

---

# Content and Communication

---

## 74. Plain Language

Participant-facing content should:

- use familiar words;
- use short sentences where possible;
- explain specialist terms;
- avoid unnecessary abbreviations;
- and use active voice.

Plain language should not remove scientific or consent meaning.

---

## 75. Respectful Language

The platform should avoid:

- infantilising language;
- patronising praise;
- age stereotypes;
- assumptions of incapacity;
- and language that frames assistance as failure.

---

## 76. Non-Coercive Language

Avoid:

- “You must continue.”
- “You should let your family manage this.”
- “The AI knows what is best.”
- “You failed to complete the task.”
- “Do not lose your streak.”

Prefer:

- “This is optional.”
- “You can pause and return.”
- “Would you like help?”
- “You are in control of whether this is sent.”
- “You can change this setting.”

---

## 77. Content Layers

Content may use:

1. concise primary explanation;
2. optional more detail;
3. source or policy detail;
4. human-support route.

Material information must remain available.

---

## 78. Examples

Examples can reduce abstraction.

They should:

- be relevant;
- avoid stereotypes;
- not imply one correct personal choice;
- and not expose another person's data.

---

## 79. Translation

Translated content should indicate:

- language;
- translation status;
- version;
- and whether human review occurred where material.

AI translation of consent or safety content requires governed review.

---

# Accessibility by Domain

---

## 80. Visual Presentation

The design system should support:

- scalable text;
- readable line length;
- clear hierarchy;
- sufficient contrast;
- strong focus indicators;
- non-colour status;
- and reflow without loss of meaning.

---

## 81. Touch and Pointer

Participant-facing controls should:

- be large enough for reliable activation;
- have adequate spacing;
- avoid accidental destructive action;
- and not require precision gestures.

---

## 82. Keyboard

Core workflows should be operable by keyboard.

Keyboard interaction should preserve:

- logical order;
- visible focus;
- no trap;
- and access to all material actions.

---

## 83. Screen Readers

Core content should provide:

- semantic headings;
- labels;
- descriptions;
- status announcements;
- error summaries;
- table headers;
- and meaningful alternative text.

---

## 84. Audio and Video

Audio and video should provide:

- captions;
- transcripts;
- controls;
- replay;
- and non-audio alternatives.

Autoplay should be avoided for material Participant content.

---

## 85. Motion

Motion should:

- be purposeful;
- remain limited;
- respect reduced-motion preference;
- and never be required to understand essential information.

---

## 86. Time Limits

Time limits should be avoided where possible.

Where required, the Participant should receive:

- notice;
- explanation;
- extension;
- and saved-state protection.

---

## 87. Forms

Forms should:

- place labels clearly;
- distinguish required and optional fields;
- explain sensitive questions;
- validate near the field;
- preserve entered data;
- and provide an error summary.

---

## 88. Assessments

Assessments should:

- explain purpose;
- estimate effort;
- show progress;
- allow pause;
- use consistent scales;
- support accessible input;
- and record missingness explicitly.

---

## 89. Tables and Charts

Researcher-facing tables and charts should support:

- keyboard access;
- screen-reader interpretation;
- text summaries;
- non-colour distinctions;
- and responsive alternatives.

Participant-facing data should avoid unnecessary complexity.

---

## 90. Notifications

Notifications should consider:

- channel;
- urgency;
- privacy;
- quiet hours;
- reading level;
- and Participant preference.

Sensitive detail should not appear unnecessarily on lock screens.

---

## 91. Shared Devices

On shared devices, the platform should support:

- clear current-user identity;
- easy sign-out;
- privacy-aware display;
- session locking;
- and minimal local retention.

---

# Intervention and Research Adaptation

---

## 92. Intervention Adaptation

Every Intervention Version should define its permitted adaptation range.

Examples:

- presentation adaptation;
- pacing adaptation;
- communication method;
- Supporter assistance;
- reminder variation;
- and AI communication style.

---

## 93. Material Intervention Change

An adaptation becomes a material intervention change when it changes:

- objective;
- required component;
- mechanism;
- dose;
- delivery mode;
- target population;
- AI role;
- safeguard;
- or intended outcome.

Material changes require a new Intervention Version and may require Protocol amendment or re-consent.

---

## 94. Adaptation Exposure

Research records should distinguish:

- adaptation available;
- adaptation offered;
- adaptation suggested;
- adaptation accepted;
- adaptation used;
- adaptation changed;
- and adaptation rejected.

---

## 95. Adaptation Fidelity

Fidelity should assess whether:

- the approved adaptation range was used;
- required meaning was preserved;
- the Participant retained control;
- the correct Intervention Version was delivered;
- and measurement comparability was maintained.

---

## 96. Assessment Adaptation

Assessment presentation may be adapted for:

- text size;
- read-aloud;
- pacing;
- input method;
- response time;
- and task segmentation.

Material changes to wording, scale, response options, or administration may affect validity.

---

## 97. Measurement Equivalence

An adapted measurement should preserve:

- construct;
- item meaning;
- response meaning;
- scoring;
- and interpretation

where possible.

If equivalence is uncertain, the adaptation should be documented and considered in analysis.

---

## 98. Missingness and Accessibility

Missing data may indicate:

- refusal;
- inability;
- inaccessible presentation;
- fatigue;
- technical failure;
- or support unavailability.

The reason should be recorded explicitly.

---

## 99. Research Inclusion

Ability-adaptive design should reduce exclusion caused by:

- device requirements;
- reading level;
- authentication;
- interface complexity;
- response timing;
- and need for assistance.

Adaptation should not be used to conceal that a Research Project remains inaccessible.

---

## 100. Research Traceability

A Research Project using adaptation should preserve:

- adaptation definition;
- adaptation version;
- source;
- Participant preference;
- exposure;
- fidelity;
- support used;
- change history;
- and relationship to outcomes.

---

## 101. Adaptation as Intervention Component

In some Research Projects, adaptation may be:

- an enabling capability;
- an intervention component;
- a moderator;
- a mediator;
- or an object of research.

The Protocol should declare its role.

---

## 102. Ability-Adaptive Structured Social Connection

The first MVP configuration combines:

- INT-009 — Ability-Adaptive Onboarding and Navigation;
- INT-008 — Participant-Controlled Family and Care Network;
- INT-001 — Structured Social Connection;
- and INT-003 — optional AI Companion-Facilitated Human Connection.

Ability adaptation should support:

- consent;
- contact selection;
- interaction preparation;
- communication;
- reflection;
- and follow-up.

It must not change the human-connection objective.

---

# Evaluation

---

## 103. UX Evaluation Objectives

The platform should evaluate whether adaptation improves:

- access;
- comprehension;
- autonomy;
- confidence;
- task completion;
- error recovery;
- intervention exposure;
- acceptability;
- and Participant experience.

It should also evaluate:

- burden;
- harm;
- exclusion;
- incorrect adaptation;
- and over-assistance.

---

## 104. Core UX Measures

Potential measures include:

- task completion;
- independent completion;
- time;
- error;
- retry;
- abandonment;
- help requested;
- support provided;
- comprehension;
- confidence;
- satisfaction;
- and perceived control.

---

## 105. Adaptation Measures

Potential measures include:

- mode selected;
- preference source;
- adaptation offered;
- adaptation accepted;
- adaptation rejected;
- adaptation changed;
- duration;
- task outcome;
- and Participant feedback.

---

## 106. Consent UX Measures

Potential measures include:

- consent completion;
- knowledge-check comprehension;
- support required;
- time;
- section replay;
- optional-choice understanding;
- withdrawal understanding;
- and correction.

Completion alone does not prove informed consent.

---

## 107. AI UX Measures

Potential measures include:

- AI identity understanding;
- usefulness;
- clarity;
- adaptation acceptance;
- inappropriate suggestion;
- confirmation behaviour;
- source visibility;
- human-handoff success;
- and dependency-related concern.

---

## 108. Equity Measures

Evaluation should examine whether:

- completion;
- support need;
- burden;
- error;
- benefit;
- and withdrawal

differ by relevant ability, language, device, setting, or support context.

Small subgroup findings should not be overinterpreted.

---

## 109. Anti-Metrics

The following should not be treated as sufficient UX success:

- longer sessions;
- more AI messages;
- more notifications opened;
- fewer pauses;
- fewer withdrawal attempts;
- higher completion achieved through pressure;
- or reduced support need achieved by excluding Participants.

---

## 110. Qualitative Evaluation

Qualitative methods are important for understanding:

- dignity;
- confidence;
- frustration;
- autonomy;
- support experience;
- perceived control;
- adaptation usefulness;
- and hidden burden.

---

## 111. Usability Testing

Usability testing should include Participants with varied:

- digital experience;
- vision;
- hearing;
- motor ability;
- communication needs;
- language;
- cognitive load;
- fatigue;
- and support availability.

---

## 112. Accessibility Testing

Testing should include:

- automated checks;
- keyboard review;
- screen-reader review;
- zoom and reflow;
- contrast;
- reduced motion;
- captions and transcripts;
- form errors;
- timeouts;
- and real-user testing.

Automated testing alone is insufficient.

---

## 113. Sensitive Inference Testing

Sensitive inference should be tested for:

- false positives;
- false negatives;
- bias;
- overreach;
- unexpected persistence;
- permission impact;
- consent impact;
- user comprehension;
- correction;
- and safe fallback.

---

## 114. Supported-Interaction Testing

Supporter-Assisted Mode should be tested for:

- Participant control;
- role clarity;
- data visibility;
- revocation;
- decision attribution;
- and accidental overreach.

---

# Multi-Device and Context

---

## 115. Consistency Across Devices

The platform should preserve consistent:

- terminology;
- consent meaning;
- status;
- navigation logic;
- permissions;
- and task state

across devices.

Visual layout may change.

Meaning must not.

---

## 116. Mobile

Mobile Participant workflows should:

- use one primary column;
- avoid horizontal scrolling;
- provide large controls;
- minimise simultaneous content;
- and preserve easy help and withdrawal access.

---

## 117. Tablet

Tablet should support:

- Participant use;
- Supporter-assisted use;
- and selected researcher workflows.

---

## 118. Desktop

Desktop may support denser researcher workflows, but it must remain accessible.

---

## 119. Television and Voice Interfaces

Television and voice interfaces are deferred unless required by a specific intervention.

If introduced, they require:

- identity;
- privacy;
- confirmation;
- transcript or visual equivalent;
- and shared-environment safeguards.

---

## 120. Wearables and Sensors

Wearable or sensor-driven adaptation is deferred unless justified by:

- intervention purpose;
- evidence;
- consent;
- privacy review;
- data minimisation;
- and evaluation.

Sensor availability does not justify continuous monitoring.

---

# Governance

---

## 121. Adaptation Ownership

The platform should define accountable ownership for:

- accessibility policy;
- adaptation modes;
- Participant preferences;
- AI adaptation;
- measurement adaptation;
- and design-system accessibility.

---

## 122. Content Governance

Material Participant-facing content should have:

- owner;
- version;
- audience;
- approval;
- effective date;
- and review trigger.

Consent, safety, AI explanation, and withdrawal content require governed review.

---

## 123. Adaptation Policy Versioning

Adaptation rules should be versioned when they affect:

- intervention delivery;
- AI behaviour;
- consent presentation;
- measurement;
- or research interpretation.

---

## 124. Change Review

A proposed adaptation change should identify:

- affected Participants;
- affected tasks;
- accessibility impact;
- consent impact;
- permission impact;
- intervention impact;
- measurement impact;
- AI impact;
- safety impact;
- and re-consent requirement.

---

## 125. Design-System Governance

Document 20 and the component library should define:

- component ownership;
- contribution process;
- accessibility review;
- versioning;
- deprecation;
- release notes;
- and implementation testing.

---

## 126. Human Accountability

AI and automated rules may suggest adaptation.

Authorised humans remain accountable for:

- accessibility policy;
- consent design;
- intervention adaptation range;
- research interpretation;
- and safety decisions.

---

# MVP Requirements

---

## 127. MVP Ability-Adaptive Scope

The MVP should provide:

- scalable text;
- sufficient contrast;
- keyboard access;
- screen-reader compatibility;
- visible focus;
- large touch targets;
- reduced motion;
- step-by-step mode;
- simple-language support;
- reduced-content mode;
- replay;
- pause and return;
- accessible errors;
- Participant-controlled preferences;
- Supporter-Assisted Mode;
- privacy-aware notifications;
- and AI Companion identity and confirmation.

---

## 128. MVP Consent Requirements

The MVP consent experience should support:

- plain language;
- progressive sections;
- text scaling;
- read-aloud where implemented;
- replay;
- additional time;
- human support;
- Supporter assistance within permission;
- clear optional choices;
- knowledge checks;
- pause and return;
- final summary;
- and accessible withdrawal.

---

## 129. MVP Intervention Requirements

The first intervention should support:

- accessible onboarding;
- accessible contact selection;
- multiple communication methods;
- optional AI preparation;
- message review;
- explicit send confirmation;
- reflection;
- concern reporting;
- pause;
- and withdrawal.

---

## 130. MVP Adaptation Data

The MVP should record:

- selected preference;
- source;
- mode;
- change;
- use;
- support provided;
- and adaptation-related task outcome

where required by the Protocol.

---

## 131. MVP Sensitive Inference

The MVP should avoid broad emotion recognition, predictive impairment classification, and hidden ability scoring.

Observed difficulty may trigger a simple, reversible adaptation suggestion.

---

## 132. MVP Accessibility Gate

Pilot enrolment should not begin until:

- core Participant tasks pass accessibility review;
- consent is tested;
- withdrawal is tested;
- AI identity is clear;
- Supporter-Assisted Mode is tested;
- error recovery is tested;
- and no unresolved serious accessibility blocker remains.

---

## 133. MVP Non-Goals

The MVP does not require:

- automatic emotion recognition;
- diagnostic adaptation;
- predictive capacity scoring;
- unrestricted sensor monitoring;
- advanced voice assistant;
- augmented or virtual reality;
- native applications for every device;
- or autonomous long-term personalisation.

---

# Deferred Capabilities

---

## 134. Future Capabilities

Potential future capabilities include:

- richer voice interaction;
- multimodal assistance;
- predictive accessibility;
- context-aware adaptation;
- advanced wearable support;
- offline intervention completion;
- institution-specific adaptations;
- and multilingual adaptive content.

Each future capability requires separate evidence, consent, privacy, safety, accessibility, and evaluation review.

---

## 135. AR and VR

AR or VR may be considered only when:

- the intervention purpose is clear;
- physical and cognitive burden are evaluated;
- accessibility alternatives exist;
- safety is governed;
- and meaningful benefit is plausible.

Novelty is not sufficient justification.

---

## 136. Adaptive Agent Behaviour

More autonomous adaptive AI is deferred.

It must not be introduced without:

- explicit action boundaries;
- permission;
- consent;
- evaluation;
- human review;
- rollback;
- and kill switch.

---

# Risks and Anti-Patterns

---

## 137. Age Stereotyping

Do not assume:

- older age means low ability;
- larger text is always preferred;
- simple language means childish language;
- family should take control;
- or technology use is unwanted.

---

## 138. Hidden Simplification

Do not hide:

- consent consequences;
- risk;
- optional choices;
- withdrawal;
- or AI involvement

under the label of simplicity.

---

## 139. Over-Adaptation

Too much adaptation may:

- remove useful information;
- reduce autonomy;
- create confusion;
- or stigmatise the Participant.

Adapt only as necessary.

---

## 140. Adaptation Lock-In

Do not make a temporary difficulty into a permanent profile.

---

## 141. Supporter Takeover

Supporter assistance must not become silent substitution for the Participant.

---

## 142. AI Overreach

Do not allow AI to infer diagnosis, capacity, vulnerability, or permission from interaction style.

---

## 143. Engagement Manipulation

Do not use adaptation to make it harder to:

- pause;
- decline;
- withdraw;
- reject AI;
- or reduce notifications.

---

## 144. Measurement Distortion

Do not change assessment wording or scale to improve completion without documenting the effect on validity.

---

## 145. Inaccessible Recovery

An interface is not accessible if the happy path works but error, timeout, withdrawal, and help do not.

---

## 146. Inconsistent Cross-Device Meaning

Responsive design must not cause a mobile user to receive fewer rights or less material information than a desktop user.

---

## 147. Uncontrolled Personalisation

Personalisation should not accumulate hidden behavioural profiles unrelated to approved purpose.

---

# Open Questions

---

## 148. Open Questions

1. Which adaptation modes are mandatory for the first pilot?
2. Is read-aloud required at MVP launch?
3. Which languages are required?
4. Which content requires human-reviewed translation?
5. Which authentication method creates the lowest accessible burden?
6. Which tasks may use Supporter-Assisted Mode?
7. Which tasks must remain Participant-directed?
8. Which preferences may persist across Research Projects?
9. Which preferences should be project-specific?
10. Which adaptation data are required for research?
11. Which adaptation data should remain operational only?
12. Which Adaptive Inferences require explicit consent?
13. Which inferences require human review?
14. Which inferences should be prohibited?
15. How should the system distinguish fatigue from general difficulty?
16. Which measurement adaptations preserve comparability?
17. Which adaptations require a Protocol amendment?
18. Which adaptations require re-consent?
19. Which AI communication styles are approved?
20. Which accessibility preferences may enter AI context?
21. Which preference-memory duration is appropriate?
22. Which device is primary for the first pilot?
23. Which offline behaviours are required?
24. Which accessibility blockers prevent pilot enrolment?
25. Which UX outcomes define acceptable feasibility?

---

# Design Decisions

---

## 149. Design Decisions

This document establishes that:

1. Ability adaptation is based on actual needs, preferences, tasks, and context rather than chronological age.
2. Participant is the canonical domain actor.
3. Accessibility is a default platform requirement, not an optional add-on.
4. Explicit Participant preference has priority over inference.
5. Adaptation may change presentation and support.
6. Adaptation may not change rights, consent meaning, permission, Protocol, intervention purpose, outcome definition, or scientific claims.
7. The complete permission model applies to sensitive adaptive context.
8. Family or Supporter status does not create access.
9. Supporter assistance is distinct from substitute authority.
10. The Participant should be able to preview, reject, change, and reset adaptations.
11. Temporary adaptation should not silently become a permanent profile.
12. The platform should support Standard, Simple, Step-by-Step, High Visibility, Read-Aloud, Supporter-Assisted, and Low-Stimulation modes.
13. Adaptation modes should not use diagnostic or age-stereotyped labels.
14. Sensitive Adaptive Inference requires purpose, minimum data, consent, source, uncertainty, correction, reversibility, expiry, and audit.
15. Adaptive Inference is not diagnosis or capacity assessment.
16. The platform must not create hidden general ability, vulnerability, or capacity scores.
17. Adaptive Inference cannot change consent, relationship access, eligibility, enrolment, or Participant rights.
18. Emotion-aware interaction is a high-risk deferred capability.
19. Predictive accessibility may suggest support but cannot restrict participation.
20. Context-aware adaptation should avoid unnecessary sensitive context.
21. AI Companion may explain, simplify, repeat, draft, guide, and suggest adaptation.
22. AI Companion does not own the accessibility profile or make high-impact decisions.
23. AI identity must remain clear in every adaptation mode.
24. AI memory must not contain unsupported diagnostic labels.
25. Accessible consent must preserve all material meaning.
26. Consent knowledge checks are not capacity tests.
27. A simpler interface must not make refusal or withdrawal harder.
28. Error recovery, pause, timeout, offline, and degraded states are part of accessibility.
29. Recognition should be preferred over unnecessary recall.
30. Participant-facing language must remain respectful and non-infantilising.
31. Measurement adaptation must preserve meaning and be documented.
32. Missingness may reveal accessibility burden and should be recorded explicitly.
33. Adaptation availability, suggestion, acceptance, use, rejection, and change are distinct events.
34. Every Intervention Version should define its permitted adaptation range.
35. A material adaptation requires a new Intervention Version and may require Protocol amendment or re-consent.
36. The first MVP should avoid broad emotion recognition, predictive impairment classification, and hidden scoring.
37. The MVP must provide core visual, motor, cognitive, communication, error-recovery, and Supporter-assisted accessibility.
38. Usability and accessibility testing must include people with varied abilities and digital experience.
39. Automated accessibility testing alone is insufficient.
40. UX success is defined by access, comprehension, autonomy, meaningful participation, manageable burden, and safe recovery—not by maximum engagement.
41. Document 20 is authoritative for detailed flows, components, tokens, and interface implementation.
42. Future adaptive capabilities must preserve Participant control, privacy, scientific validity, and human accountability.

---

## 150. Summary

The platform's ability-adaptive model is:

```text
Participant Preference
        +
Ability and Support Needs
        +
Task Complexity
        +
Device and Environment
        +
Approved Context
        ↓
Transparent Adaptation Suggestion
        ↓
Participant Choice or Approved Application
        ↓
Accessible Interaction
        ↓
Evaluation of Access, Burden, and Outcome
```

Its central principle is:

> Adapt the interface to the person without turning adaptation into diagnosis, surveillance, hidden control, or loss of rights.

A successful ability-adaptive experience should help the Participant:

- understand;
- choose;
- consent;
- participate;
- communicate;
- recover from error;
- request support;
- pause;
- and withdraw

with dignity and meaningful control.
