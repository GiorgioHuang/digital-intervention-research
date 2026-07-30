# Appendix B — Cross-Document Ubiquitous Language & Glossary

**Version:** 1.1  
**Status:** Active Cross-Document Language Baseline — M18 Formation and Messaging Aligned  
**Handbook Position:** Appendix B  
**Document Owner:** Domain Model and Handbook Governance  
**Last Updated:** 2026-07-29  
**Primary Authority:** Document 8 — Core Domain Model & Ubiquitous Language v3.2  
**Supersedes:** Appendix B — Cross-Document Ubiquitous Language & Glossary v1.0  
**Review Trigger:** A new aggregate, role, state, event family, visibility level, intervention term, AI concept, research artefact or deprecated term

---

## 1. Purpose

This glossary provides a stable cross-document vocabulary for Documents 0–20.

It does not replace the detailed definitions and invariants in the primary authority document.

Where terms conflict:

1. the authority column identifies the governing document;
2. the more specific approved version governs the scoped implementation;
3. Participant-facing labels may be simpler, but must map to the canonical term;
4. UX analytics events must not be confused with domain or integration events.

---

## 2. Naming Conventions

- **Canonical aggregate and entity names** use `PascalCase`, for example `ResearchProject`.
- **Participant-facing labels** may use spaces, for example **Research project**, but preserve the same meaning.
- **Domain events** are past-tense facts, for example `ConnectionActivated`.
- **Commands** are imperative, for example `ActivateOpenMatching`.
- **Draft**, **In Review**, **Approved**, **Locked** and similar states retain exact meanings.
- **Platform Public** and **Internet Public** are never interchangeable.
- **Participant** is the canonical actor. “Older adult” describes a population, not a permission role.

---

## 3. Ecosystem and Platform Terms

| Term | Canonical Definition | Primary Authority |
|---|---|---|
| Healthy Aging Knowledge Platform | External or adjacent authoritative platform for evidence, ontology, mechanisms, outcomes, measurements and provenance. | Documents 0 and 9 |
| Digital Intervention Research Platform | Primary platform for designing, delivering, governing and evaluating digital interventions with Participants. | Documents 0 and 1 |
| AI Companion | Governed AI capability that explains, retrieves, Drafts, adapts and proposes actions without acquiring human or domain authority. | Documents 0, 10 and 17 |
| Healthy Aging Knowledge Graph | Knowledge representation capability inside the Knowledge Platform; not the name of the whole ecosystem. | Documents 0 and 9 |
| Product Module | Logical product responsibility M01–M18 with one accountable capability boundary. It is not necessarily a microservice. | Document 6 |
| Bounded Context | Domain boundary with its own model, language, invariants and ownership. | Document 8 |
| Modular Monolith | Initial runtime architecture containing module boundaries inside one deployable backend. | Document 13 |
| Owning Module | The one module authorised to mutate an aggregate and confirm the resulting domain state. | Documents 6, 8 and 13 |
| Workspace | Role- and task-oriented user surface that may combine read models from several modules without sharing write ownership. | Documents 7 and 20 |
| Platform Public | Visible to an eligible authenticated Platform audience under current policy. | Documents 8, 14, 18 and 20 |
| Internet Public | Potentially visible outside authenticated Platform boundaries; requires a separate explicit publication flow. | Documents 8, 14, 18 and 20 |

---

## 4. Actors, Roles and Authority

| Term | Canonical Definition | Primary Authority |
|---|---|---|
| Participant | Person whose intervention participation, choices, data and outcomes are central to the ResearchProject. | Documents 1, 4 and 8 |
| Supporter | Person with an explicit Relationship and scoped permission to assist a Participant. | Documents 4 and 8 |
| Researcher | Actor performing permitted research-design, delivery, data or analysis tasks. | Document 4 |
| Research Coordinator | Operational research role supporting recruitment, scheduling and delivery under scoped authority. | Document 4 |
| Research Approver | Authorised human who approves exact governed research artefact versions. | Documents 4, 11 and 15 |
| Moderator | Actor who reviews Community or user reports and records accountable ModerationDecisions. | Documents 4, 8 and 20 |
| Safety Reviewer | Actor authorised to triage SafetySignals and confirm SafetyEvents. | Documents 4, 8 and 20 |
| Data Steward | Actor responsible for DatasetDefinition, quality, access, lineage and lock readiness. | Documents 11, 12 and 16 |
| Analyst | Actor who performs approved analysis against a locked DatasetVersion. | Documents 4, 11 and 19 |
| Organisation Administrator | Actor administering Organisation-scoped users and configuration without inheriting research, moderation or Safety authority. | Documents 4 and 20 |
| System Administrator | Technical operator without automatic Participant, research, moderation or Safety authority. | Documents 4, 14 and 20 |
| Service Account | Non-human identity with explicit purpose, scope, credentials and audit. | Documents 4, 14 and 15 |
| Role | Named responsibility class contributing to permission. Role alone is insufficient. | Document 4 |
| Relationship | Explicit association between actors that may support a scoped permission. | Documents 4 and 8 |
| Delegation | Explicit, bounded authorisation by a permitted actor; not inferred from family or care status. | Documents 4 and 8 |
| Specific Permission | Explicit action and resource permission granted within role, relationship, purpose and context. | Document 4 |
| Purpose | Approved reason for access or action. | Documents 4 and 14 |
| Resource State | Current state that may permit, restrict or prohibit access or action. | Documents 4, 8 and 14 |
| Effective Permission | Intersection of Role, Relationship, Consent, Purpose, Context, Specific Permission and Resource State. | Document 4 |
| Effective AI Permission | Human permission intersected with approved AI configuration, task, Tool, data class and action risk. | Documents 10 and 17 |

---

## 5. Consent, Privacy and Visibility

| Term | Canonical Definition | Primary Authority |
|---|---|---|
| Consent | Versioned Participant decision authorising a defined purpose, data use or activity under stated conditions. | Documents 4 and 14 |
| ConsentRecord | Durable record of Consent form version, choices, restrictions, actor, assistance and effective period. | Documents 8, 14 and 16 |
| Re-Consent | New Consent decision required after a material change affecting the Participant's authorised scope. | Documents 14 and 19 |
| Withdrawal | Participant action ending or restricting future participation, access, use or contact according to selected scope. | Documents 4, 14, 19 and 20 |
| Supported Decision-Making | Assistance that helps a Participant understand or communicate a decision without transferring authorship or authority. | Documents 4, 5, 19 and 20 |
| Protected Existence | Security and UX rule preventing disclosure that a protected person or resource exists. | Documents 4, 14 and 20 |
| Private | Visible only to the owning Participant and explicitly authorised operations. | Documents 8, 14 and 20 |
| Selected People | Visible only to specifically selected eligible actors. | Documents 8, 14 and 20 |
| Connections | Visible to current eligible Connections under sharing policy. | Documents 8, 14 and 20 |
| Community | Visible within a specified eligible CommunitySpace. | Documents 8, 14 and 20 |
| Visibility | Who may discover or view a resource. It does not automatically grant download, quotation, reuse or research rights. | Documents 8, 14 and 20 |
| AudienceDefinition | Exact audience, authentication boundary, eligibility and exclusions for a shared resource. | Document 8 |
| Data Classification | Sensitivity classification used for storage, access, provider and transmission policy. | Documents 12 and 14 |
| Minimum Necessary | Only the least information required for the approved action, purpose and context. | Documents 12, 14 and 17 |
| Data Subject Request | Governed request for access, correction, deletion, restriction, portability or other applicable right. | Document 14 |
| Deletion Propagation | Tracked removal or restriction across source, object, Search, Vector, cache, AI memory, provider and derived stores. | Documents 12, 14 and 16 |

---

## 6. Research and Evidence

| Term | Canonical Definition | Primary Authority |
|---|---|---|
| Healthy Aging Challenge | Defined problem or opportunity that motivates evidence review, intervention design and research. | Documents 1 and 2 |
| ResearchProject | Aggregate governing one research initiative, its purpose, actors, artefacts and lifecycle. | Documents 8 and 11 |
| ResearchQuestion | Versioned question connecting population, intervention, context, outcome and uncertainty. | Documents 2, 8 and 11 |
| Protocol | Stable study identity containing one or more immutable ProtocolVersions. | Documents 8 and 11 |
| ProtocolVersion | Immutable approved version of study design, procedures, Consent, intervention, measurement and safeguards. | Documents 8, 11 and 19 |
| EvidenceReview | Governed assessment of relevant KnowledgeReferences for a ResearchQuestion or decision. | Documents 8 and 9 |
| KnowledgeReference | Governed reference to an external knowledge item and exact version or retrieval identity. | Documents 8 and 9 |
| EvidenceDecision | Human-accountable conclusion: Support, Support with Conditions, Insufficient Evidence, Conflicting Evidence, Restrict, Do Not Proceed or Research Required. | Documents 8 and 9 |
| EvidenceSnapshot | Immutable set of exact evidence references supporting a governed decision at a point in time. | Documents 8 and 9 |
| ResearchKnowledgeGap | Identified uncertainty requiring evidence, research or retained acknowledgement. | Documents 8 and 9 |
| ReferenceChangeAlert | Alert that a referenced external knowledge item or version changed after review or snapshot. | Document 9 |
| AnalysisPlan | Approved specification of populations, variables, methods, missingness and outputs. | Documents 8, 11 and 19 |
| AnalysisRun | Governed execution of an approved AnalysisPlan against a locked DatasetVersion. | Documents 8, 11 and 19 |
| AnalysisOutput | Table, figure, estimate, diagnostic or coded summary produced by an AnalysisRun; not an interpretation or finding. | Documents 8 and 11 |
| InterpretationRecord | Human-accountable interpretation of AnalysisOutputs, uncertainty, alternatives and limitations. | Documents 8 and 11 |
| ResearchFinding | Reviewed conclusion linked to exact ResearchQuestion, Protocol, intervention, Dataset, Analysis and Interpretation versions. | Documents 8 and 11 |
| InterventionDecision | Governed decision to Retain, Revise, Restrict, Replicate, Expand, Suspend, Retire or Continue Exploratory Research. | Documents 3, 11 and 19 |
| EvidencePackage | Governed M14 package prepared for reporting, external review or Knowledge Platform submission. | Documents 8, 9 and 14 |
| Research Outcome | Measured Participant or system result defined in the Protocol and MeasurementVersion. | Documents 2, 8 and 11 |
| Process Measure | Measure of delivery, exposure or system activity; not automatically a Healthy Aging outcome. | Documents 2, 11, 18 and 19 |

---

## 7. Intervention and Delivery

| Term | Canonical Definition | Primary Authority |
|---|---|---|
| Intervention | Stable identity for an intervention concept and its versions. | Documents 3 and 8 |
| InterventionVersion | Immutable version of intervention rationale, components, mechanism, safeguards and evaluation mapping. | Documents 3 and 8 |
| InterventionConfiguration | ResearchProject-specific configuration of approved intervention components, pathways and adaptation range. | Documents 6, 8 and 18 |
| InterventionAssignment | Assignment of a Participant to an approved intervention version and configuration. | Documents 8 and 11 |
| Session | Planned or actual intervention-delivery episode. | Documents 8, 18 and 19 |
| Exposure | What was actually offered, viewed, started, received, completed, skipped, declined, failed or interrupted. | Documents 8, 11 and 19 |
| Fidelity | Degree to which delivery follows the approved Protocol, intervention configuration, safeguards and adaptation range. | Documents 3, 8 and 11 |
| Adaptation | Approved presentation or delivery adjustment responding to current ability or context. | Documents 5, 8 and 11 |
| Protocol Deviation | Recorded departure from approved Protocol behaviour; it does not silently amend the Protocol. | Documents 8, 11 and 19 |
| MeasurementVersion | Exact version of a measure, instrument, scoring and interpretation rule. | Documents 8 and 11 |
| AssessmentRecord | Participant assessment administration and response record. | Document 8 |
| ObservationRecord | Source-labelled observation from Participant, Supporter, Researcher, system or AI. | Documents 8 and 11 |
| OutcomeRecord | Governed recorded or derived outcome linked to a definition and source. | Documents 8 and 11 |

---

## 8. Life Story and Social Connection

| Term | Canonical Definition | Primary Authority |
|---|---|---|
| LifeStoryArchive | Participant-controlled M17 archive containing LifeStoryItems and governed contributions. | Documents 8 and 18 |
| LifeStoryItem | Versioned story, memory, reflection or media item under Participant control. | Documents 8 and 18 |
| LifeStoryContribution | Attributed contribution proposed by an authorised Supporter or other contributor. | Document 8 |
| Participant Testimony | Participant-attributed and confirmed account; not necessarily externally verified. | Documents 8, 10 and 19 |
| LegacyPreference | Revocable Participant preference governing approved future or posthumous Life Story handling. | Documents 8 and 18 |
| PublicProfile | Participant-selected M18 profile for approved Platform audiences; separate from ParticipantProfile. | Documents 8 and 18 |
| Governed Community | Participant-facing capability composed of eligible CommunitySpaces, current rules, moderation, Participant-controlled Visibility and non-engagement-optimised design. | Documents 6, 8, 18 and 20 |
| CommunitySpace | Governed M18 social space with purpose, eligibility, rules, moderation and Visibility. | Documents 8 and 18 |
| CommunityRuleVersion | Exact version of Community rules applicable to content and moderation decisions. | Documents 8 and 20 |
| CommunityMembership | Participant membership state in a CommunitySpace. | Document 8 |
| SocialPost | Versioned M18 social content with author, audience, visibility and moderation state. | Documents 8 and 18 |
| Open Matching | Opt-in process that generates candidates from approved declared attributes for an approved purpose. | Documents 8 and 18 |
| MatchPreference | Participant-controlled matching purpose, allowed attributes, exclusions, availability and status. | Documents 8 and 18 |
| MatchCandidate | Time-limited candidate record generated under an approved matching policy. It is not a Connection. | Documents 8 and 18 |
| MatchExplanation | Human-readable explanation of permitted declared attributes that contributed to a MatchCandidate. | Documents 8, 18 and 20 |
| MatchDecision | One actor's independently recorded decision about one exact MatchCandidate. It cannot be inferred from profile views or another actor's decision. | Documents 8, 18 and 19 |
| MutualAcceptance | Canonical M18 aggregate recording compatible independent MatchDecisions or one accepted approved ConnectionRequest together with actors, purpose, policy version, effective period and validity checks. | Document 8 v3.2 |
| ConnectionRequest | Deferred Alternative Connection Basis. It is feature-disabled for the first Pilot; acceptance creates MutualAcceptance and does not directly activate Connection. | Document 8 v3.2 |
| Connection | Mutually authorised M18 social connection activated from one valid MutualAcceptance record. It is not a Supporter Relationship, care authority or research permission. | Documents 8 and 18 |
| CommunicationBasis | Approved basis permitting ConversationThread creation or Message send, such as an active Connection, authorised Relationship, approved InterventionSession or governed moderated context. | Document 8 v3.2 |
| ConversationThread | Canonical M18 aggregate containing exact participants, current CommunicationBasis, purpose, lifecycle and related Message references. | Document 8 v3.2 |
| Message | Canonical M18 aggregate within one ConversationThread with separate Draft, SendConfirmation, queue, send, provider, delivery, failure and withdrawal facts. | Document 8 v3.2 |
| SendConfirmation | Actor-specific, Message-version-specific and recipient-specific confirmation required before a Message enters delivery. | Document 8 v3.2 |
| Mute | Reversible reduction of notifications or visibility without ending Connection. | Documents 8 and 20 |
| Disconnect | End of a Connection; distinct from Block. | Documents 8 and 20 |
| BlockRecord | Authoritative M18 record overriding discovery, matching, interaction, notification and AI Context according to policy. | Documents 8, 14 and 16 |
| UserReport | Report concerning actor behaviour, profile, Message, matching or another user-related concern. | Documents 8 and 18 |
| ContentReport | Report concerning SocialPost, comment, media or another content resource. | Documents 8 and 18 |

---

## 9. Moderation, Safety and Incidents

| Term | Canonical Definition | Primary Authority |
|---|---|---|
| ModerationCase | M18 case connecting reports, permitted evidence, rule version, human decision, action, appeal and restoration. | Documents 8 and 18 |
| ModerationDecision | Human-accountable decision applying Community rules to content or actor access. | Documents 8 and 20 |
| ModerationAction | Effect of a ModerationDecision, such as guidance, restriction, removal or restoration. | Documents 8 and 20 |
| ModerationAppeal | Request for review of a material ModerationDecision. | Documents 8 and 20 |
| SafetySignal | Possible safety concern requiring authorised human triage. It is not a confirmed SafetyEvent. | Documents 8, 11 and 19 |
| SafetyEvent | Human-confirmed safety occurrence with category, severity, relatedness, actions and monitoring. | Documents 8, 11 and 19 |
| SafetyAction | Governed action responding to a SafetySignal or SafetyEvent. | Documents 8 and 11 |
| AIIncident | AI operational, security, privacy or behaviour incident; separate from SafetySignal and ModerationCase. | Documents 10 and 17 |
| Privacy Incident | Incident involving unauthorised disclosure, use, loss or failure of privacy control. | Document 14 |
| Security Incident | Confirmed or suspected compromise of confidentiality, integrity, availability or security control. | Document 14 |
| Report | Participant or actor submission that may create a ModerationCase, support request, Privacy Incident or SafetySignal depending on classification. | Documents 8, 14 and 18 |
| Reporter Identity | Protected identity of the reporting actor; not ordinarily exposed to reported actors or research views. | Documents 14, 18 and 20 |
| Break-Glass Access | Exceptional time-limited access requiring justification, enhanced audit and review. | Documents 4 and 14 |

---

## 10. AI Terms

| Term | Canonical Definition | Primary Authority |
|---|---|---|
| AIConversation | Governed container for AI interactions under one role, purpose and context. | Documents 8 and 10 |
| AIInteraction | Primary traceability unit for one AI request, context, retrieval, model response, Tool activity and review. | Documents 8, 10 and 17 |
| AIInterventionConfiguration | Stable identity for a ResearchProject-specific governed AI intervention configuration. | Documents 8 and 10 |
| AIInterventionConfigurationVersion | Immutable approved version of AI roles, models, Prompts, Tools, retrieval, memory, safety and evaluation. | Documents 8, 10 and 17 |
| AIMemoryItem | Purpose-bound, reviewable, correctable and deletable persistent AI memory record; separate from Profile, Life Story, Message and research records. | Documents 8, 10 and 17 |
| Model Gateway | M11 boundary through which approved model providers are called. | Documents 13 and 17 |
| Model Alias | Stable governed name resolving to an approved provider model and configuration. | Document 17 |
| Prompt | Versioned instruction artefact for one governed AI task. | Documents 10 and 17 |
| Tool | Typed governed M11 interface to an owning-domain query or command. | Documents 10, 15 and 17 |
| Action Level | AI action-risk level from explanation or Draft through prohibited autonomous action. | Documents 10 and 17 |
| Context Assembly | Permission-first selection of minimum necessary source-labelled information for an AIInteraction. | Documents 10 and 17 |
| RetrievalRecord | Trace of retrieved authorised sources, versions and citations used by an AIInteraction. | Documents 8, 10 and 17 |
| Human Review | Required authorised human assessment before or after a governed AI output or action. | Documents 10 and 17 |
| AI Draft | AI-generated editable content that is not testimony, publication, Message send, approval or finding. | Documents 10 and 20 |
| AI Inference | Model-derived interpretation with explicit uncertainty and no automatic domain authority. | Documents 10 and 11 |
| AISafetySignalRaised | AI event requesting creation of an M09 SafetySignal; it does not create a SafetyEvent. | Documents 10, 15 and 17 |
| Grounding | Linkage of an AI output to authorised Platform records, EvidenceSnapshots or KnowledgeReferences. | Documents 10 and 17 |
| Provider Data Policy | Approved rules governing provider retention, training use, inspection, region, subprocessors and deletion. | Documents 14 and 17 |

---

## 11. Data, Interfaces and Storage

| Term | Canonical Definition | Primary Authority |
|---|---|---|
| Canonical Identifier | Platform-owned stable identifier for a governed domain record. | Document 12 |
| IdentifierMapping | Governed mapping between canonical and external identifiers. | Documents 12 and 16 |
| Data Lineage | Trace from source records and versions through transformation, dataset, analysis and finding. | Documents 11, 12 and 16 |
| DatasetDefinition | Approved specification of dataset population, sources, variables, transformations, Consent, quality and de-identification. | Documents 8, 11 and 12 |
| DatasetVersion | Immutable generated dataset candidate with exact lineage, manifest, variables and checksums. | Documents 8, 11 and 12 |
| DatasetLock | Human-authorised record locking one DatasetVersion for an approved AnalysisPlan. | Documents 8, 11 and 12 |
| DataQualityIssue | Governed quality issue with rule, severity, affected data and disposition. | Documents 8 and 12 |
| TransformationRun | Versioned execution producing derived data or DatasetVersion content. | Documents 12 and 16 |
| Manifest | Machine- and human-readable inventory of dataset files, versions, counts, restrictions and checksums. | Documents 12 and 16 |
| Transactional Outbox | Storage pattern ensuring committed domain changes can publish integration events reliably. | Documents 13, 15 and 16 |
| Consumer Inbox | Idempotency record preventing duplicate processing of received integration events. | Documents 15 and 16 |
| Operation | Durable representation of asynchronous or external work and its state. | Documents 8, 15 and 16 |
| Integration Event | Stable external contract derived from domain facts; not identical to internal Domain Events. | Documents 8 and 15 |
| UX Analytics Event | Minimum-necessary interaction measurement event. It must map to, but not impersonate, a Domain Event. | Document 20 |
| Resource Version | Optimistic concurrency version used to prevent stale writes. | Documents 15 and 16 |
| Object Storage | Private storage for files, media, evidence, datasets, analysis outputs and exports. | Documents 13 and 16 |
| Search Index | Derived discovery structure subject to source permission, deletion and invalidation. | Documents 12, 13 and 16 |
| Vector Index | Derived semantic-retrieval structure that does not become an authority source. | Documents 12, 13 and 16 |
| Analytical Environment | Controlled environment that receives approved DatasetVersions rather than direct production access. | Documents 13, 16 and 19 |

---

## 12. Canonical States

| State | Meaning |
|---|---|
| Draft | Editable and not yet submitted, confirmed, sent, published, approved or locked. |
| In Review | Submitted for authorised human review. Canonical replacement for generic `Under Review`. |
| Returned for Revision | Reviewer requires changes before another review. |
| Approved | Exact version has received required human approval. |
| Approved with Conditions | Approved subject to explicit conditions. |
| Rejected | Reviewed and not approved. |
| Active | Currently effective for permitted use. |
| Paused | Temporarily unavailable or suspended with possible resume. |
| Completed | Required workflow activity completed; does not imply benefit or approval. |
| Withdrawn | Participant or authority has ended or restricted future use. |
| Superseded | Replaced by a newer authoritative version. |
| Archived | Retained as historical and not active. |
| Locked | Immutable for the governed purpose, such as a DatasetVersion under DatasetLock. |
| Restricted | Available only under additional conditions. |
| Expired | No longer valid because its effective period ended. |
| Deleted | Removed according to policy while minimum audit evidence may remain. |
| Unavailable | Cannot be used or disclosed in the current context. |

---

## 13. Deprecated or Ambiguous Terms

| Avoid | Use Instead | Reason |
|---|---|---|
| Friendly Companion | AI Companion | Friendly Companion is not a canonical product or system name. |
| Intelligence Layer / AI Layer | AI Companion or AI Orchestration | Avoids an undefined system boundary. |
| Chatbot Layer | AI Companion | AI capability is broader and more governed than a chatbot. |
| Patient / Subject / Client | Participant | Canonical research and intervention actor. |
| Older Adult as a Role | Participant; older adult as population description | Population description does not grant permission. |
| Family Member as Permission | Supporter + Relationship + Specific Permission | Family status does not create authority. |
| Caregiver as Automatic Access | Professional Caregiver Role + Relationship + Consent + Specific Permission | Care context alone is insufficient. |
| Full Access / Shared Access | Explicit resource and action permissions | Broad labels hide scope and purpose. |
| Study as Aggregate | ResearchProject | “Study” may remain plain language, but not the canonical aggregate name. |
| ProtocolAmended | New ProtocolVersion created and approved | Approved ProtocolVersions are immutable. |
| SafetyEventDetected | SafetySignalRecorded or AISafetySignalRaised | Automated detection cannot confirm a SafetyEvent. |
| AISafetyEvent | SafetySignal or AIIncident as applicable | No independent AI-owned SafetyEvent aggregate. |
| DatasetLocked or DatasetLockConfirmed | DatasetVersionLocked | `DatasetLockConfirmed` may remain a UX interaction alias, but the canonical M12 Domain Event is DatasetVersionLocked. |
| AIChangedData | AIActionConfirmed plus owning-domain event | AI does not directly own another aggregate's mutation. |
| Under Review | In Review | Canonical review-state wording. |
| Public Social Networking / Public Community / Community Social Networking | Governed Community and Platform Public participation | Avoids confusion with unrestricted Internet Public or engagement-optimised networking. |
| Open Peer Matching | Open Matching | Canonical Participant-controlled matching term. |
| Compatibility Score as Truth | MatchExplanation with uncertainty | Matching output is not objective relationship truth. |
| Story Shared | LifeStoryItemVisibilityChanged or exact publication event | Audience and state must remain explicit. |
| Match Completed | MutualAcceptanceRecorded or ConnectionActivated | Candidate, decision, MutualAcceptance and Connection are separate. |

---

## 14. Domain Event versus UX Analytics Mapping Rule

A UX event may describe user interaction before a domain action succeeds.

Examples:

| UX Analytics Event | Canonical Domain or Integration Fact |
|---|---|
| `MessageSendConfirmed` | User confirmation; later followed by `MessageSent` or a failure event. |
| `DatasetLockConfirmed` | Confirmation interaction; canonical domain fact should be `DatasetVersionLocked` or equivalent approved event. |
| `BlockCreated` | Must map to the canonical M18 block aggregate event, currently `ActorBlocked` or a revised `BlockCreated` contract. |
| `UserReportSubmitted` | Must map to `UserReported`, `ContentReported` or a revised typed report event. |
| `PublicProfileActivated` | Must map to the canonical PublicProfile publication/activation lifecycle event. |
| `LifeStoryVisibilityChanged` | Must map to `LifeStoryItemVisibilityChanged` for the exact item and version. |

Document 8 v3.2 §133 is the canonical cross-layer event mapping.

HC-008 is resolved. Downstream event catalogues should be revalidated against that mapping.

---

## 15. Glossary Governance

A term may be added only with:

- definition;
- owner;
- source document;
- type: system, actor, aggregate, entity, value object, state, event, UX label or deprecated term;
- and migration guidance where an old term exists.

Document 8 remains authoritative for domain language. This appendix provides cross-document navigation and explicit mappings.
