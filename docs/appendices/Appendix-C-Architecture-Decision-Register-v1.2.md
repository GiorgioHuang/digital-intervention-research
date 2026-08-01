# Appendix C — Architecture Decision Register

**Version:** 1.2  
**Status:** Active Architecture Decision Baseline — Conceptual Research Mode  
**Handbook Position:** Appendix C  
**Scope:** Canonical architecture decisions and implementation-decision backlog for Documents 0–20  
**Document Owner:** Architecture, Product and Research Governance  
**Last Updated:** 2026-07-31  
**Supersedes:** Appendix C — Architecture Decision Register v1.1  
**Review Trigger:** A material change to architecture authority, module or aggregate ownership, security/privacy boundaries, data or event semantics, provider placement, MVP/Pilot scope, technical stack, operational target or a decision status

---

## 1. Purpose

This appendix is the authoritative register of material architecture decisions for the Healthy Aging Digital Intervention Research Platform.

It records:

- decisions already established by Documents 0–20;
- conceptual-research decisions and future empirical decisions;
- intentionally deferred or prohibited capabilities;
- implementation decisions that may be resolved when needed and do not block current theoretical research;
- superseded decisions and canonical replacements;
- rationale, consequences and verification;
- and review triggers.

The register complements:

- **Appendix A** — requirement and verification traceability;
- **Appendix B** — canonical language;
- **Appendix D** — versions and review status;
- **Appendix E** — authority and revalidation;
- **Appendix F** — unresolved consistency conflicts.

Appendix C does not replace the detailed source documents. When an ADR summary conflicts with its primary source, the source authority and Appendix E govern.

---

## 2. ADR Lifecycle

```text
Proposed
    ↓
Under Review
    ↓
Accepted
or
Accepted for Conceptual Prototype
or
Future Operational Decision
or
Deferred
or
Rejected
or
Prohibited
        ↓
Superseded
or
Retired
```

### 2.1 Status Definitions

| Status | Meaning |
|---|---|
| Proposed | A decision is required, but no authoritative choice has been approved. |
| Under Review | Alternatives and implications are being evaluated. |
| Accepted | The decision is part of the current architecture baseline. |
| Accepted for Conceptual Prototype | The decision governs the first Pilot/MVP and may be revisited after evidence. |
| Future Operational Decision | The choice is unnecessary for current conceptual work and may be revisited only for a future empirical or operational programme. |
| Deferred | The capability or choice is intentionally postponed and must remain inactive. |
| Rejected | The alternative was considered and not selected. |
| Prohibited | The action or architecture is not permitted under the current authority model. |
| Superseded | A later ADR replaces the decision; historical context is preserved. |
| Retired | The decision no longer applies because the associated capability has been removed. |

### 2.2 Decision Authority

A material ADR must identify its approving authority:

- Architecture Governance;
- Product and Domain Governance;
- Research Governance;
- Privacy Governance;
- Security Governance;
- Safety and Social Safety Governance;
- AI Governance;
- Data Governance;
- Operations;
- or a combined authority.

An Architecture ADR does not itself grant:

- research ethics approval;
- Participant Consent;
- legal authority;
- provider contractual approval;
- production security approval;
- or Pilot launch approval.

---

## 3. ADR Record Requirements

Each ADR records:

- stable ADR ID;
- title and category;
- status;
- owner and approving authority;
- primary source authority;
- Appendix A Trace IDs;
- context;
- decision;
- alternatives considered;
- rationale;
- positive and negative consequences;
- verification evidence;
- review trigger;
- and supersession where applicable.

ADR IDs are never silently reused.

---

## 4. Decision Summary

| ADR | Decision | Category | Status | Owner | Primary Authority | Appendix A Trace |
|---|---|---|---|---|---|---|
| ADR-001 | Handbook Authority and Precedence | Governance | Accepted | Architecture Governance | D0; Appendix E | OBJ-012; CTL-017; ATR-001; CHG-01 |
| ADR-002 | Three-System Ecosystem Separation | Ecosystem | Accepted | Platform Architecture | D0; D1 | OBJ-003; OBJ-008; CTL-013; ATR-001; CHG-12 |
| ADR-003 | Research Platform Is Not a General-Purpose EHR | Scope | Accepted | Product and Research Governance | D1; D12 | OBJ-004; OBJ-007; ATR-002; ATR-014; CHG-01 |
| ADR-004 | Distinct Architecture Layers | Governance | Accepted | Architecture Governance | D6–D8; D13 | ATR-001; CHG-05; CHG-12 |
| ADR-005 | Canonical Language and Stable Identifiers | Governance | Accepted | Domain Governance | D8; Appendix B | ATR-001; CHG-07; CHG-11 |
| ADR-006 | Stable Architecture Trace and Decision IDs | Governance | Accepted | Architecture Governance | Appendix A; Appendix C | ATR-001; ATR-022; CHG-01–CHG-18 |
| ADR-007 | M01–M18 Logical Module Baseline | Product Architecture | Accepted | Product and Domain Architecture | D6; D8 | ATR-001; CHG-05 |
| ADR-008 | One Aggregate, One Write Owner | Domain Architecture | Accepted | Domain Architecture | D8; D13; D15; D16 | ATR-001; ATR-022; CHG-05; CHG-07 |
| ADR-009 | Modular Monolith for the MVP | Technical Architecture | Accepted for Conceptual Prototype | Platform Architecture | D13; D18 | ATR-001; ATR-023; CHG-12; CHG-16 |
| ADR-010 | Evidence-Driven Service Extraction | Technical Architecture | Deferred | Platform Architecture | D13; D18 | CHG-05; CHG-12 |
| ADR-011 | Relational Transactional System of Record | Data Architecture | Accepted | Data and Platform Architecture | D12; D13; D16 | ATR-009–ATR-020; CHG-11; CHG-15 |
| ADR-012 | Single Physical Database with Logical Module Schemas | Data Architecture | Accepted for Conceptual Prototype | Data and Platform Architecture | D13; D16 | ATR-001; ATR-022; CHG-12; CHG-15 |
| ADR-013 | Private Object and Media Storage | Storage | Accepted | Data and Security Architecture | D12; D14; D16 | CTL-004; CTL-014; ATR-007; ATR-021; CHG-15 |
| ADR-014 | Search, Vector and Cache Are Derived | Data Architecture | Accepted | Data and Security Architecture | D12; D13; D16 | CTL-014; ATR-015; ATR-016; CHG-15 |
| ADR-015 | Transactional Outbox and Idempotent Consumers | Event Architecture | Accepted | Platform Architecture | D13; D15; D16 | ATR-011; ATR-014; ATR-022; ATR-023; CHG-14; CHG-15 |
| ADR-016 | Strong Consistency for Critical Authority | Runtime Architecture | Accepted | Domain and Security Architecture | D13; D14; D15 | CTL-001; CTL-002; CTL-007–CTL-011; ATR-003; ATR-011–ATR-017 |
| ADR-017 | Deterministic Effective Permission Formula | Security and Permission | Accepted | Security and Domain Governance | D4; D8; D14 | CTL-001; ATR-003; ATR-021; CHG-03; CHG-13 |
| ADR-018 | Granular, Versioned and Withdrawable Consent | Consent and Rights | Accepted | Privacy and Research Governance | D4; D14; D19 | OBJ-001; CTL-002; ATR-002; ATR-024; CHG-03; CHG-17 |
| ADR-019 | Visibility Is Separate from Permission and Data Use | Privacy and Publication | Accepted | Privacy and Domain Governance | D8; D12; D14 | CTL-004; ATR-002; ATR-015; CHG-03; CHG-11 |
| ADR-020 | Internet Public Disabled for the First Pilot | Pilot Scope | Accepted for Conceptual Prototype | Product, Privacy and Research Governance | D18–D20 | CTL-004; ATR-002; ATR-021; CHG-16; CHG-17 |
| ADR-021 | Ability Adaptation Must Preserve Semantic Equivalence | Accessibility | Accepted | Accessibility and Product Governance | D5; D20 | OBJ-005; CTL-003; ATR-006; CHG-04; CHG-18 |
| ADR-022 | Separate ParticipantProfile, PublicProfile and AIMemoryItem | Domain and Privacy | Accepted | Domain and Privacy Governance | D8; D10; D12 | CTL-012; ATR-002; ATR-015; CHG-07; CHG-09 |
| ADR-023 | Participant-Controlled Life Story Archive | Life Story | Accepted | Product, Domain and Privacy Governance | D3; D8; D18–D20 | OBJ-001; CTL-005; ATR-007; CHG-02; CHG-16 |
| ADR-024 | AI Draft Is Not Participant Testimony | Life Story and AI | Accepted | Domain, AI and Research Governance | D8; D10; D17 | CTL-005; CTL-012; ATR-007; ATR-018; CHG-09 |
| ADR-025 | Governed Community with Human-Accountable Moderation | Community | Accepted | Product, Social Safety and Governance | D8; D14; D18–D20 | CTL-006; ATR-008; ATR-017; CHG-16 |
| ADR-026 | Open Matching Is Explicitly Opt-In | Matching | Accepted | Product, Privacy and Social Safety | D3; D8; D14 | CTL-007; ATR-009; CHG-02; CHG-16 |
| ADR-027 | MatchDecision Is Actor-Owned and Independent | Matching | Accepted | Domain and Social Safety | D8; D15; D16 | CTL-007; ATR-010; CHG-07 |
| ADR-028 | MutualAcceptance Is a Canonical Aggregate | Matching and Connection | Accepted | Domain Architecture | D8 v3.2; D12; D15; D16 | CTL-008; ATR-011; CHG-07 |
| ADR-029 | ConnectionRequest Is Deferred | Connection | Deferred | Product and Domain Governance | D8; D15; D18–D20 | CTL-008; CHG-16 |
| ADR-030 | Connection Activates Only from Valid MutualAcceptance | Connection | Accepted | Domain Architecture | D8; D15; D16 | CTL-008; ATR-012; CHG-07 |
| ADR-031 | CommunicationBasis Is Required for Participant Messaging | Messaging | Accepted | Domain, Privacy and Social Safety | D8; D12; D15 | CTL-009; ATR-013; CHG-07 |
| ADR-032 | Exact Message Lifecycle and Delivery States | Messaging | Accepted | Domain and Integration Architecture | D8; D15; D20 | CTL-009; ATR-014; ATR-023; CHG-07; CHG-18 |
| ADR-033 | M18 Owns Message; M16 Owns Provider Operations | Messaging and Integration | Accepted | Domain and Integration Architecture | D13; D15; D16 | CTL-009; CTL-018; ATR-014; CHG-12; CHG-14 |
| ADR-034 | Message Body Excluded from Broad Secondary Use | Messaging and Privacy | Accepted | Privacy and Research Governance | D12; D14; D19 | CTL-009; CTL-014; ATR-015; CHG-10; CHG-11 |
| ADR-035 | One-to-One Messaging Only in the First Pilot | Pilot Scope | Accepted for Conceptual Prototype | Product and Social Safety | D18–D20 | ATR-013–ATR-016; CHG-16 |
| ADR-036 | Read Receipts Disabled by Default | Messaging and Privacy | Accepted for Conceptual Prototype | Product and Privacy Governance | D18–D20 | ATR-014; ATR-015; CHG-16; CHG-18 |
| ADR-037 | Block Fails Closed and Does Not Auto-Restore State | Social Safety | Accepted | Social Safety and Security | D8; D14; D16 | CTL-010; ATR-016; CHG-03; CHG-15 |
| ADR-038 | Report Remains Available after Block or Disconnect | Social Safety | Accepted | Social Safety Governance | D8; D14; D18–D20 | CTL-010; ATR-008; ATR-016 |
| ADR-039 | SafetySignal Is Separate from SafetyEvent | Safety | Accepted | Safety Governance | D8; D9; D14 | CTL-011; ATR-017; CHG-07 |
| ADR-040 | AI Is a Controlled Assistant, Not an Autonomous Authority | AI | Accepted | AI, Product and Governance | D4; D10; D15; D17 | CTL-012; ATR-018; CHG-09 |
| ADR-041 | All Model Access through the Model Gateway | AI Operations | Accepted | AI and Platform Architecture | D10; D17 | CTL-012; CTL-018; ATR-018; ATR-021; CHG-09 |
| ADR-042 | AIMemoryItem Requires Explicit Governed Creation | AI and Privacy | Accepted | AI and Privacy Governance | D8; D10; D12 | CTL-012; ATR-015; ATR-018; CHG-09 |
| ADR-043 | Knowledge Platform Owns Curated Knowledge | Evidence Architecture | Accepted | Knowledge and Research Architecture | D0; D9 | CTL-013; ATR-005; CHG-08 |
| ADR-044 | EvidenceDecision and EvidenceSnapshot Precede Protocol Use | Evidence and Research | Accepted | Evidence and Research Governance | D2; D9; D11 | OBJ-003; CTL-013; ATR-005; CHG-08; CHG-10 |
| ADR-045 | Governed Dataset Lifecycle and Immutable DatasetLock | Research Data | Accepted | Research Data Governance | D8; D11; D12; D16 | CTL-015; ATR-019; CHG-10; CHG-15 |
| ADR-046 | Separate AnalysisOutput, InterpretationRecord and ResearchFinding | Research | Accepted | Research Governance | D2; D8; D11 | OBJ-004; CTL-015; ATR-020; CHG-10 |
| ADR-047 | Platform Activity Is Not a Healthy Aging Outcome | Research | Accepted | Research and Product Governance | D1; D2; D11; D19 | OBJ-004; ATR-020; CHG-10 |
| ADR-048 | Prospective Single-Arm Mixed-Method Initial Pilot | Pilot Research Design | Superseded | Conceptual Research and Future Empirical Design | D19 | OBJ-004; ATR-025; CHG-17 |
| ADR-049 | Staged Activation of Life Story, Community and Matching | Pilot Scope | Superseded | Conceptual Research and Future Empirical Design | D18; D19 | ATR-008; ATR-009; ATR-025; CHG-16; CHG-17 |
| ADR-050 | Deny by Default and Protect Resource Existence | Security | Accepted | Security and Privacy Architecture | D14; D15 | CTL-001; CTL-016; ATR-003; ATR-021; CHG-13 |
| ADR-051 | Human Accountability and Separation of Duties | Governance and Audit | Accepted | Governance Architecture | D4; D8; D14 | OBJ-012; CTL-017; ATR-022; CHG-03; CHG-13 |
| ADR-052 | External Providers Use Anti-Corruption Layers | Integration | Accepted | Integration and Security Architecture | D12–D16 | CTL-018; ATR-021; ATR-023; CHG-08; CHG-12; CHG-14 |
| ADR-053 | Data Residency and Jurisdiction Are Routing Constraints | Privacy and Operations | Accepted | Privacy, Security and Platform Governance | D12; D14; D15 | CTL-016; CTL-018; ATR-021; CHG-12; CHG-13; CHG-15 |
| ADR-054 | Withdrawal and Deletion Propagate without Rewriting Locked Research History | Data Rights | Accepted | Privacy and Research Data Governance | D4; D12; D14; D16 | CTL-019; ATR-024; CHG-03; CHG-15; CHG-17 |
| ADR-055 | Truthful Failure and Degraded States | Reliability and UX | Accepted | Platform, Product and Research Governance | D13; D15; D17; D20 | OBJ-011; CTL-020; ATR-023; CHG-12; CHG-18 |
| ADR-056 | Public Developer API and Dynamic Webhook Portal Deferred | Scope | Deferred | Product and Platform Architecture | D15; D18 | CHG-14; CHG-16 |
| ADR-057 | Group and Mass Messaging Deferred | Scope | Deferred | Product and Social Safety | D15; D18–D20 | ATR-013–ATR-016; CHG-16 |
| ADR-058 | Real-Time Wearable Streaming Deferred | Scope | Deferred | Product, Data and Research Architecture | D12; D13; D18 | CHG-02; CHG-10; CHG-11; CHG-12 |
| ADR-059 | No Unrestricted Graph or Compatibility Truth | Matching and Data | Prohibited | Product, Research and Privacy Governance | D3; D8; D12 | CTL-007; ATR-009; ATR-015; CHG-02; CHG-11 |
| ADR-060 | No Autonomous High-Impact AI Actions | AI and Governance | Prohibited | AI, Safety, Privacy and Research Governance | D4; D10; D15; D17 | CTL-011; CTL-012; ATR-017; ATR-018; CHG-09 |
| ADR-061 | Conceptual Research Is the Current Project Mode | Research Mode | Accepted | Conceptual Research and Architecture | D1 v2.2; D11 v1.2; D18 v1.3; D19 v1.3 | OBJ-003; OBJ-004; ATR-001; CHG-01 |
| ADR-062 | Synthetic Data, Simulated Actors and Mock Providers | Research Method | Accepted | Conceptual Research and Prototype Engineering | D11 v1.2; D18 v1.3; D19 v1.3 | CTL-014; ATR-019; CHG-10; CHG-12 |
| ADR-063 | No External Approval Gate for Current Conceptual Work | Governance | Accepted | Conceptual Research and Architecture | D1 v2.2; D19 v1.3 | ATR-025; CHG-01; CHG-17 |
| ADR-064 | Human-Subject Empirical Study Is a Separate Future Programme | Research Scope | Deferred | Conceptual Research and Future Empirical Governance | D19 v1.3 | OBJ-004; ATR-025; CHG-17 |

---

## 5. Status Summary

| Status | Count |
|---|---|
| Accepted | 49 |
| Accepted for Conceptual Prototype | 5 |
| Count | 1 |
| Deferred | 6 |
| Meaning | 1 |
| Prohibited | 2 |
| Superseded | 2 |
| Open technical decisions | 25 |
| Superseded legacy entries | 6 |

The status count describes this register, not implementation completion.

An `Accepted` ADR has an authoritative architecture decision and verification path. It may still require software delivery, testing, provider selection or formal operational approval.

---

## 6. Established Decision Records


### 6.1 Governance

#### ADR-001 — Handbook Authority and Precedence

| Field | Record |
|---|---|
| Status | Accepted |
| Owner | Architecture Governance |
| Primary Authority | D0; Appendix E |
| Related Trace IDs | OBJ-012; CTL-017; ATR-001; CHG-01 |
| Context | Documents 0–20 address different layers and may appear to overlap. |
| Decision | Use the Handbook authority hierarchy. Upstream mission, conceptual, intervention, permission, product and domain authorities are amended before downstream technical, delivery, Protocol or UX refinements. |
| Alternatives Considered | Treat every document as equally authoritative; allow downstream implementation documents to redefine upstream concepts. |
| Rationale | A stable precedence model prevents circular authority and silent semantic drift. |
| Consequences | + Conflicts have a deterministic resolution path.<br>− Upstream changes require deliberate downstream revalidation. |
| Verification | Appendices D–F; Appendix A change-impact trace; cross-document consistency review. |
| Review Trigger | A new Handbook layer, changed authority owner or unresolved precedence conflict. |


#### ADR-004 — Distinct Architecture Layers

| Field | Record |
|---|---|
| Status | Accepted |
| Owner | Architecture Governance |
| Primary Authority | D6–D8; D13 |
| Related Trace IDs | ATR-001; CHG-05; CHG-12 |
| Context | Capability, domain ownership, deployment and storage are related but not identical. |
| Decision | Keep Product Module, Bounded Context, aggregate ownership, workspace, deployment unit, code package and database schema as distinct concepts. |
| Alternatives Considered | Use module, service, context, schema and screen as interchangeable terms. |
| Rationale | Distinct layers allow a modular monolith without erasing domain ownership or future extraction options. |
| Consequences | + Clear ownership and flexible packaging.<br>− Architecture documentation must preserve mappings between layers. |
| Verification | D6 module map; D8 context map; D13 technical module map; D16 schema map. |
| Review Trigger | Module extraction, context merger or ownership reassignment. |


#### ADR-005 — Canonical Language and Stable Identifiers

| Field | Record |
|---|---|
| Status | Accepted |
| Owner | Domain Governance |
| Primary Authority | D8; Appendix B |
| Related Trace IDs | ATR-001; CHG-07; CHG-11 |
| Context | Ambiguous or reused terms create incompatible APIs, data and UX. |
| Decision | Use canonical Ubiquitous Language, stable opaque identifiers and explicit deprecated-alias translation. |
| Alternatives Considered | Allow local synonyms and semantic identifiers to propagate between layers. |
| Rationale | Canonical language is required for traceable domain state and safe compatibility. |
| Consequences | + Better cross-document and implementation consistency.<br>− Terminology changes require migration and glossary maintenance. |
| Verification | Appendix B; contract tests; duplicate/ambiguous term scanning. |
| Review Trigger | New aggregate, state, event or cross-document term. |


#### ADR-006 — Stable Architecture Trace and Decision IDs

| Field | Record |
|---|---|
| Status | Accepted |
| Owner | Architecture Governance |
| Primary Authority | Appendix A; Appendix C |
| Related Trace IDs | ATR-001; ATR-022; CHG-01–CHG-18 |
| Context | Requirements and decisions need durable references across tickets, tests, reviews and approvals. |
| Decision | Use stable `ATR/CTL/CHG` Trace IDs and `ADR-xxx` decision IDs. Do not silently reuse IDs for materially different requirements or decisions. |
| Alternatives Considered | Refer only to document prose or mutable heading anchors. |
| Rationale | Stable IDs support audit, change impact and implementation evidence. |
| Consequences | + Durable cross-tool references.<br>− Superseded entries must remain in historical registers. |
| Verification | Appendix A and C uniqueness checks; version-control history. |
| Review Trigger | Traceability-model or identifier-policy change. |



### 6.2 Ecosystem

#### ADR-002 — Three-System Ecosystem Separation

| Field | Record |
|---|---|
| Status | Accepted |
| Owner | Platform Architecture |
| Primary Authority | D0; D1 |
| Related Trace IDs | OBJ-003; OBJ-008; CTL-013; ATR-001; CHG-12 |
| Context | Curated knowledge, intervention research and Participant-facing AI have different authorities and risk profiles. |
| Decision | Maintain separate conceptual systems for the Healthy Aging Knowledge Platform, Digital Intervention Research Platform and AI Companion. |
| Alternatives Considered | One undifferentiated application and datastore; AI provider as the primary system of record. |
| Rationale | Separation protects knowledge curation, research governance and Participant-facing interaction from acquiring each other's authority. |
| Consequences | + Clear source authority and provider boundaries.<br>− Requires explicit identifiers, contracts and provenance across systems. |
| Verification | System-context review; integration contracts; KnowledgeReference and AIInteraction provenance. |
| Review Trigger | Merger, replacement or federation of any ecosystem system. |



### 6.3 Scope

#### ADR-003 — Research Platform Is Not a General-Purpose EHR

| Field | Record |
|---|---|
| Status | Accepted |
| Owner | Product and Research Governance |
| Primary Authority | D1; D12 |
| Related Trace IDs | OBJ-004; OBJ-007; ATR-002; ATR-014; CHG-01 |
| Context | The Platform may process health-related and care-context data but is designed for governed intervention research. |
| Decision | Do not position or design the Platform as a general-purpose electronic health record, clinical decision system or unrestricted care-documentation repository. |
| Alternatives Considered | Model the Platform as an EHR or broad care record. |
| Rationale | The research mission, data minimisation and approval lifecycle differ from clinical-record obligations and workflows. |
| Consequences | + Limits unnecessary clinical data and claims.<br>− Clinical integrations require explicit scoped adapters and governance. |
| Verification | Product scope, DatasetDefinition review, API/resource catalogue and non-goals. |
| Review Trigger | A proposed regulated clinical function or clinical system-of-record responsibility. |


#### ADR-056 — Public Developer API and Dynamic Webhook Portal Deferred

| Field | Record |
|---|---|
| Status | Deferred |
| Owner | Product and Platform Architecture |
| Primary Authority | D15; D18 |
| Related Trace IDs | CHG-14; CHG-16 |
| Context | The first Pilot has known clients and integrations and does not require an open developer ecosystem. |
| Decision | Defer public developer APIs, public API keys, self-service Webhooks and partner developer portal. |
| Alternatives Considered | Launch a public integration platform with the MVP. |
| Rationale | This avoids expanding attack surface, support and compatibility burden before core validation. |
| Consequences | + Smaller security and contract surface.<br>− External integrations require curated configuration. |
| Verification | No public credentials/routes; approved integration inventory. |
| Review Trigger | Approved partner ecosystem or product strategy. |


#### ADR-057 — Group and Mass Messaging Deferred

| Field | Record |
|---|---|
| Status | Deferred |
| Owner | Product and Social Safety |
| Primary Authority | D15; D18–D20 |
| Related Trace IDs | ATR-013–ATR-016; CHG-16 |
| Context | Group membership, moderation, delivery and privacy require additional domain and UX design. |
| Decision | Defer group, broadcast and mass Participant messaging. |
| Alternatives Considered | Reuse one-to-one Message model for groups without additional rules. |
| Rationale | The initial intervention does not require group messaging. |
| Consequences | + Smaller first-Pilot surface.<br>− Future group work needs new aggregates, permissions and moderation rules. |
| Verification | Feature absence and participant-count constraints. |
| Review Trigger | Approved group intervention and Protocol. |


#### ADR-058 — Real-Time Wearable Streaming Deferred

| Field | Record |
|---|---|
| Status | Deferred |
| Owner | Product, Data and Research Architecture |
| Primary Authority | D12; D13; D18 |
| Related Trace IDs | CHG-02; CHG-10; CHG-11; CHG-12 |
| Context | Wearable streaming creates high-volume data, device and interpretation complexity. |
| Decision | Limit initial device integration to manual upload, simulated data or one controlled source; defer real-time streaming. |
| Alternatives Considered | Build a multi-device streaming platform for the MVP. |
| Rationale | Wearables are not required for the selected Life Story and human-connection Pilot. |
| Consequences | + Lower data and operational burden.<br>− Real-time sensor interventions remain out of scope. |
| Verification | Integration allowlist and no streaming ingestion routes. |
| Review Trigger | Approved sensor-based intervention and data-governance plan. |



### 6.4 Product Architecture

#### ADR-007 — M01–M18 Logical Module Baseline

| Field | Record |
|---|---|
| Status | Accepted |
| Owner | Product and Domain Architecture |
| Primary Authority | D6; D8 |
| Related Trace IDs | ATR-001; CHG-05 |
| Context | The Platform requires explicit capability and write-ownership boundaries. |
| Decision | Use M01–M18 as the canonical logical module baseline for the current Handbook. |
| Alternatives Considered | Organise the Platform only by screens, teams or technical services. |
| Rationale | Modules connect product capabilities to domain ownership and delivery scope. |
| Consequences | + Accountable ownership and traceability.<br>− Module changes require coordinated Handbook revalidation. |
| Verification | D6 module catalogue; D8 bounded contexts; Appendix A module matrix. |
| Review Trigger | New capability that cannot be owned coherently by the existing modules. |



### 6.5 Domain Architecture

#### ADR-008 — One Aggregate, One Write Owner

| Field | Record |
|---|---|
| Status | Accepted |
| Owner | Domain Architecture |
| Primary Authority | D8; D13; D15; D16 |
| Related Trace IDs | ATR-001; ATR-022; CHG-05; CHG-07 |
| Context | Multiple writers to canonical state create inconsistent authority and audit. |
| Decision | Every aggregate has one accountable write-owning module. Other modules, providers, AI Tools and analytical processes use the owner's commands or contracts. |
| Alternatives Considered | Shared table ownership; provider or worker direct writes; cross-module repository access. |
| Rationale | Single ownership protects invariants, versions, events and accountability. |
| Consequences | + Deterministic state transitions.<br>− Cross-module workflows require commands, events or process managers. |
| Verification | Repository boundaries; database roles; API and event ownership tests. |
| Review Trigger | Aggregate transfer, context split or service extraction. |



### 6.6 Technical Architecture

#### ADR-009 — Modular Monolith for the MVP

| Field | Record |
|---|---|
| Status | Accepted for Conceptual Prototype |
| Owner | Platform Architecture |
| Primary Authority | D13; D18 |
| Related Trace IDs | ATR-001; ATR-023; CHG-12; CHG-16 |
| Context | The MVP needs all M01–M18 capabilities without premature distributed complexity. |
| Decision | Implement the first release as a modular monolith with explicit internal module boundaries and separate API, Worker and Scheduler processes. |
| Alternatives Considered | Microservices from the first release; one unstructured monolith. |
| Rationale | The modular monolith reduces delivery and operational risk while preserving extraction boundaries. |
| Consequences | + Simpler transactions, deployment and testing.<br>− Discipline is required to prevent cross-module coupling. |
| Verification | Code dependency rules; module-owned repositories/migrations; architecture tests. |
| Review Trigger | Measured scale, team ownership, reliability or deployment needs justify extraction. |


#### ADR-010 — Evidence-Driven Service Extraction

| Field | Record |
|---|---|
| Status | Deferred |
| Owner | Platform Architecture |
| Primary Authority | D13; D18 |
| Related Trace IDs | CHG-05; CHG-12 |
| Context | Some modules may later require independent scaling, security or ownership. |
| Decision | Defer microservice extraction until a documented operational, organisational, security or scale requirement exists. |
| Alternatives Considered | Pre-emptively extract every module; prohibit future extraction. |
| Rationale | Distribution adds network, consistency, observability and operational costs. |
| Consequences | + Avoids premature complexity.<br>− Future extraction requires ADR, migration and compatibility work. |
| Verification | Architecture review and measured workload/ownership evidence. |
| Review Trigger | First credible extraction proposal or material modular-boundary failure. |



### 6.7 Data Architecture

#### ADR-011 — Relational Transactional System of Record

| Field | Record |
|---|---|
| Status | Accepted |
| Owner | Data and Platform Architecture |
| Primary Authority | D12; D13; D16 |
| Related Trace IDs | ATR-009–ATR-020; CHG-11; CHG-15 |
| Context | Consent, versions, social formation, messaging and research locks require strong relational invariants. |
| Decision | Use a relational transactional database as the primary operational system of record. |
| Alternatives Considered | Document database as the canonical store; event store only; graph database as system of record. |
| Rationale | Relational constraints and transactions fit current aggregate and research-lineage requirements. |
| Consequences | + Strong invariants and familiar analytical extraction.<br>− Flexible content uses version tables, JSON selectively or object storage. |
| Verification | Schema constraints, transaction tests, backup/restore and migration tests. |
| Review Trigger | A domain demonstrates requirements that the relational model cannot meet safely. |


#### ADR-012 — Single Physical Database with Logical Module Schemas

| Field | Record |
|---|---|
| Status | Accepted for Conceptual Prototype |
| Owner | Data and Platform Architecture |
| Primary Authority | D13; D16 |
| Related Trace IDs | ATR-001; ATR-022; CHG-12; CHG-15 |
| Context | The modular monolith benefits from local transactions but still requires module ownership. |
| Decision | Use one physical relational database with M01–M18 logical schema ownership for the MVP. |
| Alternatives Considered | One database per module; one unrestricted shared schema. |
| Rationale | This balances transactional simplicity with ownership and migration discipline. |
| Consequences | + Easier Pilot operations and atomic workflows.<br>− Database roles and code boundaries must prevent accidental cross-module writes. |
| Verification | Schema ownership, migration ownership and database-role tests. |
| Review Trigger | Service extraction, residency separation or workload isolation requirement. |


#### ADR-014 — Search, Vector and Cache Are Derived

| Field | Record |
|---|---|
| Status | Accepted |
| Owner | Data and Security Architecture |
| Primary Authority | D12; D13; D16 |
| Related Trace IDs | CTL-014; ATR-015; ATR-016; CHG-15 |
| Context | Search, embeddings and caches improve access but can expose stale or unauthorised data. |
| Decision | Treat Search, Vector and cache records as derived projections. Re-authorise results against current source state and propagate withdrawal, Visibility and Block changes. |
| Alternatives Considered | Treat indexes or embeddings as independent authoritative stores. |
| Rationale | Derived-store authority would bypass current Consent, purpose and ResourceState. |
| Consequences | + Safer retrieval and deletion.<br>− Requires source references, invalidation and reconciliation. |
| Verification | Source re-authorisation, stale projection and deletion-propagation tests. |
| Review Trigger | New Search/Vector use case or change to source-authorisation capability. |



### 6.8 Storage

#### ADR-013 — Private Object and Media Storage

| Field | Record |
|---|---|
| Status | Accepted |
| Owner | Data and Security Architecture |
| Primary Authority | D12; D14; D16 |
| Related Trace IDs | CTL-004; CTL-014; ATR-007; ATR-021; CHG-15 |
| Context | Life Story media, Message attachments, evidence files and research packages are large and sensitive. |
| Decision | Store object/media bytes in private object storage; keep ownership, purpose, Visibility, scan and retention metadata in the owning domain. |
| Alternatives Considered | Public object URLs; store all media as database blobs. |
| Rationale | Private object storage supports scalable media handling without weakening domain authority. |
| Consequences | + Controlled signed delivery and lifecycle management.<br>− Requires malware scanning, key management and deletion reconciliation. |
| Verification | Private-bucket tests, signed-link expiry, scan and deletion tests. |
| Review Trigger | Internet Public publication, new media class or storage-provider change. |



### 6.9 Event Architecture

#### ADR-015 — Transactional Outbox and Idempotent Consumers

| Field | Record |
|---|---|
| Status | Accepted |
| Owner | Platform Architecture |
| Primary Authority | D13; D15; D16 |
| Related Trace IDs | ATR-011; ATR-014; ATR-022; ATR-023; CHG-14; CHG-15 |
| Context | State changes and asynchronous effects must not diverge. |
| Decision | Commit material aggregate state and canonical Domain Events atomically through a transactional outbox; use at-least-once delivery with idempotent consumers/inboxes. |
| Alternatives Considered | Publish events before/after commit without atomicity; assume exactly-once delivery. |
| Rationale | Outbox and idempotency provide practical reliability without false exactly-once guarantees. |
| Consequences | + Durable event publication and retry.<br>− Consumers must handle duplicates, ordering and dead letters. |
| Verification | Crash, duplicate, out-of-order, replay and dead-letter tests. |
| Review Trigger | Event platform replacement or distributed transaction proposal. |



### 6.10 Runtime Architecture

#### ADR-016 — Strong Consistency for Critical Authority

| Field | Record |
|---|---|
| Status | Accepted |
| Owner | Domain and Security Architecture |
| Primary Authority | D13; D14; D15 |
| Related Trace IDs | CTL-001; CTL-002; CTL-007–CTL-011; ATR-003; ATR-011–ATR-017 |
| Context | Eventually consistent projections cannot safely establish current authority for high-impact actions. |
| Decision | Use authoritative synchronous checks for Consent withdrawal, Block, MatchDecision ownership, MutualAcceptance validity/usage, Connection activation, CommunicationBasis, Message SendConfirmation, Safety disposition, DatasetLock and approvals. |
| Alternatives Considered | Use cached/projected state as the sole authority for these actions. |
| Rationale | Stale authority can produce privacy, social-safety and research-integrity failures. |
| Consequences | + Fail-closed critical actions.<br>− Higher dependency and latency requirements for authoritative stores. |
| Verification | Stale projection and dependency-unavailable negative tests. |
| Review Trigger | Any proposal to cache or decentralise a critical authority check. |



### 6.11 Security and Permission

#### ADR-017 — Deterministic Effective Permission Formula

| Field | Record |
|---|---|
| Status | Accepted |
| Owner | Security and Domain Governance |
| Primary Authority | D4; D8; D14 |
| Related Trace IDs | CTL-001; ATR-003; ATR-021; CHG-03; CHG-13 |
| Context | Role alone is insufficient for Participant, research and social actions. |
| Decision | Evaluate effective permission using Role, Relationship, Consent, Purpose, Context, SpecificPermission and ResourceState, plus applicable Visibility, Block and domain preconditions. |
| Alternatives Considered | Role-only RBAC; client-supplied context; provider-authorised action. |
| Rationale | The Platform needs purpose- and relationship-aware decisions with explainable denial. |
| Consequences | + Precise least privilege.<br>− Policy implementation and testing are more complex. |
| Verification | Positive/negative, field, object, collection and protected-existence tests. |
| Review Trigger | New actor, purpose, Relationship type or high-impact action. |



### 6.12 Consent and Rights

#### ADR-018 — Granular, Versioned and Withdrawable Consent

| Field | Record |
|---|---|
| Status | Accepted |
| Owner | Privacy and Research Governance |
| Primary Authority | D4; D14; D19 |
| Related Trace IDs | OBJ-001; CTL-002; ATR-002; ATR-024; CHG-03; CHG-17 |
| Context | Study participation, Life Story, Community, matching, messaging, AI and research use have different risks. |
| Decision | Use granular Consent domains with version, purpose, restrictions, effective period, withdrawal, re-consent and component-level refusal. |
| Alternatives Considered | One broad acceptance for all features; irreversible consent. |
| Rationale | Granularity preserves meaningful choice and supports Protocol-specific data use. |
| Consequences | + Participant autonomy and traceable authority.<br>− More UX, policy and migration complexity. |
| Verification | Consent comprehension, version, expiry, withdrawal and propagation tests. |
| Review Trigger | New data use, feature, provider, audience or Protocol amendment. |



### 6.13 Privacy and Publication

#### ADR-019 — Visibility Is Separate from Permission and Data Use

| Field | Record |
|---|---|
| Status | Accepted |
| Owner | Privacy and Domain Governance |
| Primary Authority | D8; D12; D14 |
| Related Trace IDs | CTL-004; ATR-002; ATR-015; CHG-03; CHG-11 |
| Context | A visible item is not automatically reusable for research, AI, matching or external publication. |
| Decision | Represent Visibility separately from Consent, permission, DataClassification, research inclusion, model use and redistribution rights. |
| Alternatives Considered | Treat public or Community-visible content as unrestricted data. |
| Rationale | Audience access and secondary use are different decisions. |
| Consequences | + Prevents purpose creep.<br>− Interfaces and storage must preserve multiple independent state dimensions. |
| Verification | Audience, research extraction, AI Context and export tests. |
| Review Trigger | New Visibility level or secondary-use proposal. |



### 6.14 Pilot Scope

#### ADR-020 — Internet Public Disabled for the First Pilot

| Field | Record |
|---|---|
| Status | Accepted for Conceptual Prototype |
| Owner | Product, Privacy and Research Governance |
| Primary Authority | D18–D20 |
| Related Trace IDs | CTL-004; ATR-002; ATR-021; CHG-16; CHG-17 |
| Context | Internet publication introduces permanent exposure, indexing and withdrawal limitations. |
| Decision | Disable Internet Public publication in the first Pilot. Use Private, Selected People, Connection, Community and controlled Platform Public audiences only where approved. |
| Alternatives Considered | Enable public-web publication as an MVP feature. |
| Rationale | The initial Pilot can study authorship and governed sharing without irreversible public exposure. |
| Consequences | + Lower privacy and moderation risk.<br>− Public dissemination value is not evaluated in the first Pilot. |
| Verification | Feature flags, route tests, storage policy and UX absence. |
| Review Trigger | Separate governance, privacy, moderation and ethics approval for Internet Public. |


#### ADR-035 — One-to-One Messaging Only in the First Pilot

| Field | Record |
|---|---|
| Status | Accepted for Conceptual Prototype |
| Owner | Product and Social Safety |
| Primary Authority | D18–D20 |
| Related Trace IDs | ATR-013–ATR-016; CHG-16 |
| Context | Group messaging adds membership, moderation, privacy and delivery complexity. |
| Decision | Limit first-Pilot messaging to governed one-to-one ConversationThreads. |
| Alternatives Considered | Group, broadcast or mass messaging in the MVP. |
| Rationale | One-to-one messaging is sufficient to test the selected human-connection intervention. |
| Consequences | + Smaller social-safety and state surface.<br>− Group-support interventions remain out of scope. |
| Verification | API/UX absence and participant-set constraints. |
| Review Trigger | Approved group-intervention use case and Protocol amendment. |


#### ADR-049 — Staged Activation of Life Story, Community and Matching — Superseded

| Field | Record |
|---|---|
| Status | Superseded |
| Owner | Research, Product and Safety Governance |
| Primary Authority | D18; D19 |
| Related Trace IDs | ATR-008; ATR-009; ATR-025; CHG-16; CHG-17 |
| Context | Community and matching introduce greater operational and social-safety risk than private Life Story. |
| Decision | Staged activation is not a current operational requirement. Synthetic scenarios may exercise all stages immediately. A future empirical deployment may adopt staged activation under a separate plan. |
| Alternatives Considered | Enable every social feature for every Participant on day one. |
| Rationale | The current phase has no real users or operational exposure and therefore does not require launch gating. |
| Consequences | + Safer Pilot progression.<br>− Cohorts and exposure differ and require careful interpretation. |
| Verification | Synthetic scenario coverage and explicit non-production labelling. |
| Review Trigger | Only for a future human-subject or operational programme. |



### 6.15 Accessibility

#### ADR-021 — Ability Adaptation Must Preserve Semantic Equivalence

| Field | Record |
|---|---|
| Status | Accepted |
| Owner | Accessibility and Product Governance |
| Primary Authority | D5; D20 |
| Related Trace IDs | OBJ-005; CTL-003; ATR-006; CHG-04; CHG-18 |
| Context | Participants may need different interaction forms, support and pacing. |
| Decision | Adapt presentation, input, assistance and pacing without changing rights, intervention meaning, required confirmation or measurement interpretation. |
| Alternatives Considered | One fixed interface; simplified flows that remove decisions or scientific content. |
| Rationale | Inclusive access must not create a lower-rights or scientifically different pathway. |
| Consequences | + Equitable participation and clearer adaptation provenance.<br>− Every adaptation needs semantic-equivalence and fidelity review. |
| Verification | Accessibility, assisted-use, semantic-equivalence and exposure/fidelity tests. |
| Review Trigger | New adaptation, assistive mode or supported decision-making flow. |



### 6.16 Domain and Privacy

#### ADR-022 — Separate ParticipantProfile, PublicProfile and AIMemoryItem

| Field | Record |
|---|---|
| Status | Accepted |
| Owner | Domain and Privacy Governance |
| Primary Authority | D8; D10; D12 |
| Related Trace IDs | CTL-012; ATR-002; ATR-015; CHG-07; CHG-09 |
| Context | Operational identity, public self-presentation and AI memory have different purposes and deletion rules. |
| Decision | Keep ParticipantProfile, PublicProfile and AIMemoryItem as separate aggregates/data records with explicit transfer or creation rules. |
| Alternatives Considered | Use one universal profile or automatically convert content into AI memory. |
| Rationale | Separation prevents hidden publication and personalisation scope expansion. |
| Consequences | + Clear consent and lifecycle boundaries.<br>− Requires deliberate synchronisation and user-visible controls. |
| Verification | Schema/API separation; AI memory creation and deletion tests. |
| Review Trigger | Profile synchronisation or automatic-memory proposal. |



### 6.17 Life Story

#### ADR-023 — Participant-Controlled Life Story Archive

| Field | Record |
|---|---|
| Status | Accepted |
| Owner | Product, Domain and Privacy Governance |
| Primary Authority | D3; D8; D18–D20 |
| Related Trace IDs | OBJ-001; CTL-005; ATR-007; CHG-02; CHG-16 |
| Context | Life Story content can support identity and connection but is highly personal. |
| Decision | Life Story is Private by default, item-versioned, Participant-controlled, selectively shareable, correctable, withdrawable and exportable. |
| Alternatives Considered | Organisation-owned biography; public-by-default story feed. |
| Rationale | The intervention depends on authorship and control rather than content extraction. |
| Consequences | + Strong autonomy and meaningful provenance.<br>− Sharing, contribution and withdrawal require fine-grained controls. |
| Verification | Authorship, version, visibility, export and withdrawal tests. |
| Review Trigger | New Life Story audience, media, contributor or legacy capability. |



### 6.18 Life Story and AI

#### ADR-024 — AI Draft Is Not Participant Testimony

| Field | Record |
|---|---|
| Status | Accepted |
| Owner | Domain, AI and Research Governance |
| Primary Authority | D8; D10; D17 |
| Related Trace IDs | CTL-005; CTL-012; ATR-007; ATR-018; CHG-09 |
| Context | AI can assist writing, transcription and translation but cannot author a Participant's testimony. |
| Decision | Keep AI output as labelled Draft or transformation until the Participant explicitly confirms the content as their testimony. |
| Alternatives Considered | Automatically convert AI-generated or transcribed content into final testimony. |
| Rationale | Testimony authority is human and cannot be inferred from model output. |
| Consequences | + Honest authorship and correction rights.<br>− Requires confirmation and provenance UI. |
| Verification | Draft/final state tests, provenance display and negative autonomous-confirmation tests. |
| Review Trigger | New AI generation mode or substitute-authority workflow. |



### 6.19 Community

#### ADR-025 — Governed Community with Human-Accountable Moderation

| Field | Record |
|---|---|
| Status | Accepted |
| Owner | Product, Social Safety and Governance |
| Primary Authority | D8; D14; D18–D20 |
| Related Trace IDs | CTL-006; ATR-008; ATR-017; CHG-16 |
| Context | Community interaction can create support and harm. |
| Decision | Community participation requires eligibility, CommunityRuleVersion, Visibility, Block, Report, human moderation, appeal/restoration and Safety routing. |
| Alternatives Considered | Unmoderated or anonymous social feed; AI-only final moderation. |
| Rationale | A research intervention must provide accountable social-safety controls. |
| Consequences | + Safer governed participation.<br>− Requires staffing, response targets and operational readiness. |
| Verification | Abuse, report, reporter-protection, moderation and appeal scenarios. |
| Review Trigger | New Community type, anonymous mode or high-impact moderation automation. |



### 6.20 Matching

#### ADR-026 — Open Matching Is Explicitly Opt-In

| Field | Record |
|---|---|
| Status | Accepted |
| Owner | Product, Privacy and Social Safety |
| Primary Authority | D3; D8; D14 |
| Related Trace IDs | CTL-007; ATR-009; CHG-02; CHG-16 |
| Context | People discovery and matching can expose sensitive attributes and create unwanted contact. |
| Decision | Open Matching is inactive by default and requires MatchPreference activation, approved declared attributes, explanation, expiry, Block checks and policy version. |
| Alternatives Considered | Automatic matching for every Participant; unrestricted people search. |
| Rationale | Opt-in and explainability preserve agency and reduce profiling risk. |
| Consequences | + Participant control and auditable matching.<br>− Lower candidate volume and more policy configuration. |
| Verification | Opt-in, prohibited-attribute, expiry, explanation and Block tests. |
| Review Trigger | New matching purpose, attribute, algorithm or cross-Organisation scope. |


#### ADR-027 — MatchDecision Is Actor-Owned and Independent

| Field | Record |
|---|---|
| Status | Accepted |
| Owner | Domain and Social Safety |
| Primary Authority | D8; D15; D16 |
| Related Trace IDs | CTL-007; ATR-010; CHG-07 |
| Context | Mutual choice is invalid if one actor, AI or operator can decide for both parties. |
| Decision | Each MatchDecision belongs to one authenticated actor and exact MatchCandidate version. The other actor's private decision is not disclosed before policy permits. |
| Alternatives Considered | One combined match record; AI or staff acceptance on behalf of both actors. |
| Rationale | Independent decisions are the canonical source of mutual choice. |
| Consequences | + Strong consent and privacy boundary.<br>− Mutual result requires evaluation of separate records. |
| Verification | Ownership, expiry, disclosure and cross-actor negative tests. |
| Review Trigger | Delegated matching or substitute-authority proposal. |



### 6.21 Matching and Connection

#### ADR-028 — MutualAcceptance Is a Canonical Aggregate

| Field | Record |
|---|---|
| Status | Accepted |
| Owner | Domain Architecture |
| Primary Authority | D8 v3.2; D12; D15; D16 |
| Related Trace IDs | CTL-008; ATR-011; CHG-07 |
| Context | Compatible decisions need a traceable formation record before Connection. |
| Decision | Create MutualAcceptance from exact compatible current source records; preserve actor pair, purpose, policy version, effective period, validity, invalidation and usage. |
| Alternatives Considered | Infer mutuality from UI state; create Connection directly from two actor IDs. |
| Rationale | A canonical aggregate makes mutual formation auditable and safely invalidatable. |
| Consequences | + Traceable source and single-use enforcement.<br>− Adds a distinct lifecycle and API/storage model. |
| Verification | Source-shape, expiry, invalidation, Block and replay tests. |
| Review Trigger | New formation basis or policy that changes mutuality semantics. |



### 6.22 Connection

#### ADR-029 — ConnectionRequest Is Deferred

| Field | Record |
|---|---|
| Status | Deferred |
| Owner | Product and Domain Governance |
| Primary Authority | D8; D15; D18–D20 |
| Related Trace IDs | CTL-008; CHG-16 |
| Context | Direct requests require a separately governed discovery or invitation basis. |
| Decision | Keep ConnectionRequest as a future alternative formation basis, feature-disabled and absent from first-Pilot SDKs and UX. |
| Alternatives Considered | Enable direct requests in the first Pilot; remove the concept entirely. |
| Rationale | The first Pilot can validate independent matching and existing-contact pathways without unsolicited request risk. |
| Consequences | + Reduced first-Pilot social risk.<br>− Future activation requires policy, UX, safety and Protocol work. |
| Verification | Feature-disabled API and navigation tests. |
| Review Trigger | Approved use case with discovery basis, Consent and abuse controls. |


#### ADR-030 — Connection Activates Only from Valid MutualAcceptance

| Field | Record |
|---|---|
| Status | Accepted |
| Owner | Domain Architecture |
| Primary Authority | D8; D15; D16 |
| Related Trace IDs | CTL-008; ATR-012; CHG-07 |
| Context | Connection is a durable social state and must not be created from unverified interest. |
| Decision | Activate one Connection only from one current, valid and unused MutualAcceptance, consumed in the same governed transaction. |
| Alternatives Considered | Generic `POST /connections`; direct creation after candidate view or unilateral decision. |
| Rationale | This preserves mutual formation and prevents duplicate or non-mutual Connections. |
| Consequences | + Strong source and single-use invariant.<br>− Expired or invalidated acceptance requires a new formation path. |
| Verification | Invalid, expired, blocked and reused MutualAcceptance tests. |
| Review Trigger | Alternative Connection basis approved by upstream domain authority. |



### 6.23 Messaging

#### ADR-031 — CommunicationBasis Is Required for Participant Messaging

| Field | Record |
|---|---|
| Status | Accepted |
| Owner | Domain, Privacy and Social Safety |
| Primary Authority | D8; D12; D15 |
| Related Trace IDs | CTL-009; ATR-013; CHG-07 |
| Context | Connection alone does not cover every authorised communication path, and matching interaction does not create send authority. |
| Decision | Require a current approved CommunicationBasis—such as active Connection, authorised Relationship, InterventionSession or moderated context—before Thread creation and Message send. |
| Alternatives Considered | Connection-only messaging; unrestricted messaging after any interaction. |
| Rationale | The basis records why these exact actors may communicate for this purpose. |
| Consequences | + Explicit, revocable communication authority.<br>− Polymorphic source validation and UX explanation are required. |
| Verification | Invalid, expired and mismatched-basis tests. |
| Review Trigger | New communication pathway or basis type. |


#### ADR-032 — Exact Message Lifecycle and Delivery States

| Field | Record |
|---|---|
| Status | Accepted |
| Owner | Domain and Integration Architecture |
| Primary Authority | D8; D15; D20 |
| Related Trace IDs | CTL-009; ATR-014; ATR-023; CHG-07; CHG-18 |
| Context | Draft, authorisation, queue, transport and recipient delivery are different facts. |
| Decision | Keep Draft, SendConfirmed, Queued, Sent, ProviderAccepted, Delivered, Read, Failed, Unknown, Cancelled and Withdrawn as distinct states/events. |
| Alternatives Considered | One generic sent/delivered status; infer delivery from provider acceptance. |
| Rationale | Exact states protect Participant understanding, research interpretation and provider reconciliation. |
| Consequences | + Truthful UX and metrics.<br>− More state transitions, mappings and test cases. |
| Verification | Ordering, callback, failure, unknown-state and UX-comprehension tests. |
| Review Trigger | New provider semantics, channel or read-receipt capability. |



### 6.24 Messaging and Integration

#### ADR-033 — M18 Owns Message; M16 Owns Provider Operations

| Field | Record |
|---|---|
| Status | Accepted |
| Owner | Domain and Integration Architecture |
| Primary Authority | D13; D15; D16 |
| Related Trace IDs | CTL-009; CTL-018; ATR-014; CHG-12; CHG-14 |
| Context | The provider transports a Message but must not own sender authority or canonical state. |
| Decision | M18 owns Thread, Message content, SendConfirmation and canonical lifecycle/delivery state. M16 owns adapters, provider references, callback evidence, retry and reconciliation and invokes M18 commands. |
| Alternatives Considered | Provider or M16 writes M18 tables directly; provider status is canonical. |
| Rationale | This preserves domain authority while isolating external variability. |
| Consequences | + Replaceable providers and auditable translation.<br>− Requires mapping, reconciliation and cross-module orchestration. |
| Verification | Database-role separation, callback authentication and no-direct-write tests. |
| Review Trigger | New communication provider or provider-owned conversation proposal. |



### 6.25 Messaging and Privacy

#### ADR-034 — Message Body Excluded from Broad Secondary Use

| Field | Record |
|---|---|
| Status | Accepted |
| Owner | Privacy and Research Governance |
| Primary Authority | D12; D14; D19 |
| Related Trace IDs | CTL-009; CTL-014; ATR-015; CHG-10; CHG-11 |
| Context | Private Message content is highly sensitive and unnecessary for ordinary Pilot process evaluation. |
| Decision | Exclude Message body by default from broad events/logs, general Search/Vector, matching, Community ranking, AIMemoryItem and ordinary research datasets. |
| Alternatives Considered | Index and analyse all Message content by default. |
| Rationale | Process metadata can evaluate feasibility without collecting unnecessary intimate content. |
| Consequences | + Lower privacy and surveillance risk.<br>− Content-based moderation/research requires a separate restricted design. |
| Verification | Index, AI Context, event-payload and DatasetDefinition inspection. |
| Review Trigger | Separate approved Message-content research or safety capability. |


#### ADR-036 — Read Receipts Disabled by Default

| Field | Record |
|---|---|
| Status | Accepted for Conceptual Prototype |
| Owner | Product and Privacy Governance |
| Primary Authority | D18–D20 |
| Related Trace IDs | ATR-014; ATR-015; CHG-16; CHG-18 |
| Context | Read receipts can create pressure, false certainty and provider dependency. |
| Decision | Disable read receipts by default in the first Pilot. |
| Alternatives Considered | Always-on read receipts; infer read from client activity. |
| Rationale | The intervention does not require read surveillance, and provider support may be unreliable. |
| Consequences | + Reduced pressure and data collection.<br>− Participants have less delivery detail. |
| Verification | Feature flag, provider mapping and UX tests. |
| Review Trigger | Explicit Protocol need, reliable evidence and clear Consent. |



### 6.26 Social Safety

#### ADR-037 — Block Fails Closed and Does Not Auto-Restore State

| Field | Record |
|---|---|
| Status | Accepted |
| Owner | Social Safety and Security |
| Primary Authority | D8; D14; D16 |
| Related Trace IDs | CTL-010; ATR-016; CHG-03; CHG-15 |
| Context | Block must prevent new interaction across projections and providers. |
| Decision | Block synchronously prevents discovery, matching, MutualAcceptance, Connection activation, Thread creation, send and notifications; propagate suppression/cancellation. Revocation does not automatically restore prior states. |
| Alternatives Considered | UI-only block; delayed best-effort block; automatic restoration. |
| Rationale | Block is a high-priority Participant safety control. |
| Consequences | + Strong immediate protection.<br>− Requires cross-system propagation and honest provider limitations. |
| Verification | Block-bypass, queued-delivery, projection and revocation tests. |
| Review Trigger | New channel, provider or social projection. |


#### ADR-038 — Report Remains Available after Block or Disconnect

| Field | Record |
|---|---|
| Status | Accepted |
| Owner | Social Safety Governance |
| Primary Authority | D8; D14; D18–D20 |
| Related Trace IDs | CTL-010; ATR-008; ATR-016 |
| Context | A Participant may need to stop contact and still report prior harm. |
| Decision | Keep UserReport/ContentReport available after Block or Disconnect where policy permits. |
| Alternatives Considered | Remove reporting access when the relationship ends. |
| Rationale | Safety and governance evidence must remain accessible independently of ongoing interaction. |
| Consequences | + Better harm reporting and accountability.<br>− Protected existence and reporter-confidentiality rules remain necessary. |
| Verification | Post-block/report and reporter-exposure tests. |
| Review Trigger | Legal or policy change to reporting rights. |



### 6.27 Safety

#### ADR-039 — SafetySignal Is Separate from SafetyEvent

| Field | Record |
|---|---|
| Status | Accepted |
| Owner | Safety Governance |
| Primary Authority | D8; D9; D14 |
| Related Trace IDs | CTL-011; ATR-017; CHG-07 |
| Context | Automated, AI and human concerns are provisional until accountable triage. |
| Decision | Record potential concerns as SafetySignals. Only an authorised human may create/confirm and close a SafetyEvent. |
| Alternatives Considered | Automatic SafetyEvent creation or closure from model/provider classification. |
| Rationale | High-impact safety facts require human evidence, rationale and responsibility. |
| Consequences | + Lower false-event and automation risk.<br>− Requires staffed triage and response targets. |
| Verification | Close-as-not-event, human conversion and AI negative tests. |
| Review Trigger | Regulatory or clinical workflow changes to safety authority. |



### 6.28 AI

#### ADR-040 — AI Is a Controlled Assistant, Not an Autonomous Authority

| Field | Record |
|---|---|
| Status | Accepted |
| Owner | AI, Product and Governance |
| Primary Authority | D4; D10; D15; D17 |
| Related Trace IDs | CTL-012; ATR-018; CHG-09 |
| Context | AI can reduce burden but may invent facts or exceed human authority. |
| Decision | AI may explain, retrieve, suggest, translate and Draft through approved Tools. It may not autonomously alter Consent, create testimony, decide for both match actors, create Connection, send unconfirmed Message, impose high-impact moderation, confirm SafetyEvent, lock Dataset or approve Finding. |
| Alternatives Considered | General autonomous agent with broad write access. |
| Rationale | Human authority and domain invariants must remain deterministic. |
| Consequences | + Safer and auditable AI assistance.<br>− More confirmations, Tool constraints and fallback workflows. |
| Verification | Action-level negative tests, Tool schemas, HumanReview and false-completion tests. |
| Review Trigger | New AI Tool, autonomy level or high-impact use case. |



### 6.29 AI Operations

#### ADR-041 — All Model Access through the Model Gateway

| Field | Record |
|---|---|
| Status | Accepted |
| Owner | AI and Platform Architecture |
| Primary Authority | D10; D17 |
| Related Trace IDs | CTL-012; CTL-018; ATR-018; ATR-021; CHG-09 |
| Context | Multiple models/providers require consistent policy, provenance and failover. |
| Decision | Route model calls through M11's governed Model Gateway with approved provider/model, purpose, data class, Prompt/configuration version and Tool policy. |
| Alternatives Considered | Direct provider SDK calls throughout modules and clients. |
| Rationale | Central governance enables provider substitution, observability and data-use enforcement. |
| Consequences | + Consistent AI controls and provenance.<br>− Gateway is a critical dependency requiring resilience. |
| Verification | Network/dependency controls, invocation audit and provider allowlist tests. |
| Review Trigger | New provider, local model or direct-edge inference proposal. |



### 6.30 AI and Privacy

#### ADR-042 — AIMemoryItem Requires Explicit Governed Creation

| Field | Record |
|---|---|
| Status | Accepted |
| Owner | AI and Privacy Governance |
| Primary Authority | D8; D10; D12 |
| Related Trace IDs | CTL-012; ATR-015; ATR-018; CHG-09 |
| Context | Conversation, Life Story and Message data must not silently become persistent AI memory. |
| Decision | Create AIMemoryItem only through an explicit permitted action with purpose, source, retention, visibility and deletion linkage. |
| Alternatives Considered | Automatic memory extraction from all Participant content. |
| Rationale | Persistent memory is a distinct data use requiring control and provenance. |
| Consequences | + Participant control and deletion trace.<br>− AI personalisation may be less automatic. |
| Verification | Memory creation, listing, deletion and source-exclusion tests. |
| Review Trigger | New memory category or automatic-memory proposal. |



### 6.31 Evidence Architecture

#### ADR-043 — Knowledge Platform Owns Curated Knowledge

| Field | Record |
|---|---|
| Status | Accepted |
| Owner | Knowledge and Research Architecture |
| Primary Authority | D0; D9 |
| Related Trace IDs | CTL-013; ATR-005; CHG-08 |
| Context | The Research Platform needs evidence without becoming the authoritative knowledge-curation system. |
| Decision | Treat the Healthy Aging Knowledge Platform as authoritative for curated knowledge; store governed references, reviews, decisions and snapshots in M10. |
| Alternatives Considered | Copy unversioned knowledge into the Research Platform as local truth. |
| Rationale | Source authority and exact versions are required for evidence traceability. |
| Consequences | + Clear provenance and change detection.<br>− Availability and contract compatibility must be managed. |
| Verification | KnowledgeReference resolution, snapshot and change-alert tests. |
| Review Trigger | Knowledge Platform replacement or curation-ownership transfer. |



### 6.32 Evidence and Research

#### ADR-044 — EvidenceDecision and EvidenceSnapshot Precede Protocol Use

| Field | Record |
|---|---|
| Status | Accepted |
| Owner | Evidence and Research Governance |
| Primary Authority | D2; D9; D11 |
| Related Trace IDs | OBJ-003; CTL-013; ATR-005; CHG-08; CHG-10 |
| Context | A source citation alone does not establish applicability to a specific intervention or population. |
| Decision | Require human-accountable EvidenceReview/EvidenceDecision and an immutable EvidenceSnapshot for research-critical Protocol and Intervention decisions. |
| Alternatives Considered | Use live search results or AI summaries directly as Protocol authority. |
| Rationale | Applicability, quality, direction and uncertainty must be explicit and reproducible. |
| Consequences | + Defensible intervention rationale.<br>− Evidence review adds governance work and may need refresh. |
| Verification | Decision approval, Snapshot immutability and source-version tests. |
| Review Trigger | Material source change or new intervention claim. |



### 6.33 Research Data

#### ADR-045 — Governed Dataset Lifecycle and Immutable DatasetLock

| Field | Record |
|---|---|
| Status | Accepted |
| Owner | Research Data Governance |
| Primary Authority | D8; D11; D12; D16 |
| Related Trace IDs | CTL-015; ATR-019; CHG-10; CHG-15 |
| Context | Analysis must use reproducible inputs rather than changing operational data. |
| Decision | Use DatasetDefinition → DatasetVersion → quality/de-identification → human-authorised DatasetLock. Locked versions are immutable; corrections create a new version. |
| Alternatives Considered | Analyse live production tables; edit locked data in place. |
| Rationale | Exact inputs and transformations are necessary for reproducibility and audit. |
| Consequences | + Defensible analysis lineage.<br>− Requires storage, manifests and controlled correction workflows. |
| Verification | Regeneration, checksum, lock, immutability and correction tests. |
| Review Trigger | New analytical environment, dataset format or correction policy. |



### 6.34 Research

#### ADR-046 — Separate AnalysisOutput, InterpretationRecord and ResearchFinding

| Field | Record |
|---|---|
| Status | Accepted |
| Owner | Research Governance |
| Primary Authority | D2; D8; D11 |
| Related Trace IDs | OBJ-004; CTL-015; ATR-020; CHG-10 |
| Context | A statistical or computational output is not an approved interpretation or claim. |
| Decision | Keep AnalysisOutput, human InterpretationRecord, approved ResearchFinding, InterventionDecision and external publication as separate records and approvals. |
| Alternatives Considered | Automatically convert completed analysis into a Finding or product claim. |
| Rationale | Uncertainty, harms, burden, alternatives and claim strength require human judgement. |
| Consequences | + Responsible research claims.<br>− More workflow states and approval records. |
| Verification | State-transition, approval and lineage tests. |
| Review Trigger | New automated-analysis or publication workflow. |


#### ADR-047 — Platform Activity Is Not a Healthy Aging Outcome

| Field | Record |
|---|---|
| Status | Accepted |
| Owner | Research and Product Governance |
| Primary Authority | D1; D2; D11; D19 |
| Related Trace IDs | OBJ-004; ATR-020; CHG-10 |
| Context | Logins, posts, candidates, Connections or Messages may indicate process exposure but not benefit. |
| Decision | Classify technical activity and process measures separately from intervention exposure, proximal outcomes and Healthy Aging outcomes. |
| Alternatives Considered | Use engagement volume as the primary success or effectiveness claim. |
| Rationale | Activity can increase without improving autonomy, meaning, participation or wellbeing. |
| Consequences | + More valid interpretation.<br>− Product metrics cannot substitute for outcome measurement. |
| Verification | Dataset variable dictionary, AnalysisPlan and Finding review. |
| Review Trigger | New KPI or success criterion. |



### 6.35 Pilot Research Design

#### ADR-048 — Prospective Single-Arm Mixed-Method Initial Pilot — Superseded

| Field | Record |
|---|---|
| Status | Superseded |
| Owner | Research Governance |
| Primary Authority | D19 |
| Related Trace IDs | OBJ-004; ATR-025; CHG-17 |
| Context | The first study is intended to establish feasibility and operational learning, not definitive effectiveness. |
| Decision | The current project does not conduct this Pilot. The design is retained only as a possible future empirical option and is superseded for current work by ADR-061 and ADR-064. |
| Alternatives Considered | Randomised effectiveness trial; uncontrolled product analytics only. |
| Rationale | The project has been reclassified as conceptual research using synthetic data and prototypes. |
| Consequences | + Rich implementation learning with limited sample.<br>− Causal and generalisable effectiveness claims are not supported. |
| Verification | No human-subject procedures are active; Document 19 v1.3 defines the current conceptual protocol. |
| Review Trigger | Only if a separate future empirical project is proposed. |



### 6.36 Security

#### ADR-050 — Deny by Default and Protect Resource Existence

| Field | Record |
|---|---|
| Status | Accepted |
| Owner | Security and Privacy Architecture |
| Primary Authority | D14; D15 |
| Related Trace IDs | CTL-001; CTL-016; ATR-003; ATR-021; CHG-13 |
| Context | A denial response can still leak that a protected Participant, Thread, Report or Safety record exists. |
| Decision | Deny by default, minimise fields and protect existence for unauthorised resources and collections. |
| Alternatives Considered | Return detailed not-found/forbidden differences and broad resource metadata. |
| Rationale | Existence can itself be sensitive in research, social and Safety contexts. |
| Consequences | + Lower information-disclosure risk.<br>− Error handling and support diagnostics require protected audit references. |
| Verification | Direct-object reference, enumeration and protected-existence tests. |
| Review Trigger | New public endpoint or debugging/support capability. |



### 6.37 Governance and Audit

#### ADR-051 — Human Accountability and Separation of Duties

| Field | Record |
|---|---|
| Status | Accepted |
| Owner | Governance Architecture |
| Primary Authority | D4; D8; D14 |
| Related Trace IDs | OBJ-012; CTL-017; ATR-022; CHG-03; CHG-13 |
| Context | High-impact research, privacy and Safety actions must not be self-authorised or hidden. |
| Decision | Use named approval roles, conflict-of-interest records, self-approval restrictions, immutable audit and exceptional-access controls. |
| Alternatives Considered | Administrative superuser approval for all actions; no separation between drafting and approval. |
| Rationale | Accountability is part of the research and Participant-protection architecture. |
| Consequences | + Defensible decisions and audit.<br>− Approval capacity and role administration are operational dependencies. |
| Verification | Approval workflow, self-approval denial and audit completeness tests. |
| Review Trigger | New approval type or organisational governance model. |



### 6.38 Integration

#### ADR-052 — External Providers Use Anti-Corruption Layers

| Field | Record |
|---|---|
| Status | Accepted |
| Owner | Integration and Security Architecture |
| Primary Authority | D12–D16 |
| Related Trace IDs | CTL-018; ATR-021; ATR-023; CHG-08; CHG-12; CHG-14 |
| Context | Identity, knowledge, AI, communication, media and analytical providers use different semantics and reliability. |
| Decision | Integrate external systems through authenticated, versioned adapters/Anti-Corruption Layers that translate evidence into owning-domain commands. |
| Alternatives Considered | Expose provider objects and status directly as domain state. |
| Rationale | Adapters preserve canonical meaning, security and provider replaceability. |
| Consequences | + Controlled boundaries and reconciliation.<br>− Additional mapping, testing and operational code. |
| Verification | Contract, signature, replay, mapping and provider-failure tests. |
| Review Trigger | New provider or direct provider-owned domain proposal. |



### 6.39 Privacy and Operations

#### ADR-053 — Data Residency and Jurisdiction Are Routing Constraints

| Field | Record |
|---|---|
| Status | Accepted |
| Owner | Privacy, Security and Platform Governance |
| Primary Authority | D12; D14; D15 |
| Related Trace IDs | CTL-016; CTL-018; ATR-021; CHG-12; CHG-13; CHG-15 |
| Context | Database, object, AI, backup and analytical providers may process data in different jurisdictions. |
| Decision | Treat approved residency, jurisdiction, provider location and data class as explicit routing and configuration constraints. |
| Alternatives Considered | Choose providers without location-aware policy; rely only on contractual statements. |
| Rationale | Research and personal data use must match approved legal and governance conditions. |
| Consequences | + Controlled provider selection and fallback.<br>− Limits provider options and requires location-aware configuration. |
| Verification | Provider registry, deployment configuration and fallback-routing tests. |
| Review Trigger | New jurisdiction, partner site or provider region. |



### 6.40 Data Rights

#### ADR-054 — Withdrawal and Deletion Propagate without Rewriting Locked Research History

| Field | Record |
|---|---|
| Status | Accepted |
| Owner | Privacy and Research Data Governance |
| Primary Authority | D4; D12; D14; D16 |
| Related Trace IDs | CTL-019; ATR-024; CHG-03; CHG-15; CHG-17 |
| Context | Participants need effective withdrawal while research reproducibility and legal holds may preserve governed historical artefacts. |
| Decision | Stop future actions and propagate withdrawal/deletion to derived stores, providers and AI memory; handle locked DatasetVersions through explicit Protocol, Consent, de-identification and correction rules rather than silent edits. |
| Alternatives Considered | Ignore withdrawal after collection; silently mutate locked analytical inputs. |
| Rationale | Rights and research integrity must both remain visible and governed. |
| Consequences | + Honest lifecycle and reproducibility.<br>− Requires impact records, tombstones and nuanced Participant explanation. |
| Verification | End-to-end withdrawal, deletion, provider and restore-reconciliation tests. |
| Review Trigger | Retention law, Protocol or secondary-use policy change. |



### 6.41 Reliability and UX

#### ADR-055 — Truthful Failure and Degraded States

| Field | Record |
|---|---|
| Status | Accepted |
| Owner | Platform, Product and Research Governance |
| Primary Authority | D13; D15; D17; D20 |
| Related Trace IDs | OBJ-011; CTL-020; ATR-023; CHG-12; CHG-18 |
| Context | Dependency failure can otherwise appear as successful consent, delivery, analysis or safety action. |
| Decision | Represent unavailable, pending, partial, failed and unknown states accurately. Do not fabricate candidates, delivery, approval, SafetyEvents, dataset locks or Findings. |
| Alternatives Considered | Optimistic success UI with later reconciliation; silent fallback to invented data. |
| Rationale | Truthful state is required for Participant trust and research validity. |
| Consequences | + Safer recovery and interpretation.<br>− More UX states and operational monitoring. |
| Verification | Degraded-mode, timeout, queue, provider and false-completion tests. |
| Review Trigger | New fallback or high-availability strategy. |



### 6.42 Matching and Data

#### ADR-059 — No Unrestricted Graph or Compatibility Truth

| Field | Record |
|---|---|
| Status | Prohibited |
| Owner | Product, Research and Privacy Governance |
| Primary Authority | D3; D8; D12 |
| Related Trace IDs | CTL-007; ATR-009; ATR-015; CHG-02; CHG-11 |
| Context | A hidden social graph or compatibility score could become surveillance and overclaim. |
| Decision | Do not store or present hidden vulnerability profiles, unrestricted social graphs or objective compatibility truth. Internal ranking remains purpose-specific operational data. |
| Alternatives Considered | Permanent compatibility score and broad inferred social graph. |
| Rationale | Matching evidence is limited, contextual and sensitive. |
| Consequences | + Lower profiling and scientific overclaim risk.<br>− Matching optimisation is intentionally constrained. |
| Verification | Feature/prohibited-attribute registry, data-model and UX review. |
| Review Trigger | A separately justified, evidenced and approved research design. |



### 6.43 AI and Governance

#### ADR-060 — No Autonomous High-Impact AI Actions

| Field | Record |
|---|---|
| Status | Prohibited |
| Owner | AI, Safety, Privacy and Research Governance |
| Primary Authority | D4; D10; D15; D17 |
| Related Trace IDs | CTL-011; CTL-012; ATR-017; ATR-018; CHG-09 |
| Context | Certain actions materially affect rights, relationships, Safety and research claims. |
| Decision | Prohibit autonomous AI Consent changes, capacity determinations, testimony confirmation, MutualAcceptance/Connection creation, unconfirmed send, high-impact moderation, SafetyEvent confirmation, DatasetLock and research approval. |
| Alternatives Considered | Allow model confidence thresholds to trigger final high-impact actions. |
| Rationale | These actions require deterministic rules and accountable human authority. |
| Consequences | + Strong safety and governance boundary.<br>− Human review capacity is required. |
| Verification | Explicit Level 5 negative tests and audit. |
| Review Trigger | Only an upstream governance change with legal, ethical and evidence review. |



### 6.44 Conceptual Research Mode

#### ADR-061 — Conceptual Research Is the Current Project Mode

| Field | Record |
|---|---|
| Status | Accepted |
| Owner | Conceptual Research and Architecture |
| Primary Authority | D1 v2.2; D11 v1.2; D18 v1.3; D19 v1.3 |
| Related Trace IDs | OBJ-003; OBJ-004; ATR-001; CHG-01 |
| Context | The project is intended to develop theory, conceptual models and executable prototypes rather than run a real Participant study. |
| Decision | Treat conceptual analysis, formal modelling, synthetic simulation and non-production prototypes as the active project. Begin this work immediately. |
| Alternatives Considered | Continue treating real-Participant Pilot approval and operational readiness as current prerequisites. |
| Rationale | External approval gates do not add value when there are no human participants, private data or operational intervention delivery. |
| Consequences | + Research can proceed quickly and focus on theory.<br>− Findings must not be presented as empirical effects. |
| Verification | Current canonical Documents 1, 11, 18, 19 and 20 state the conceptual mode. |
| Review Trigger | A proposal to introduce real people, private data or operational deployment. |

#### ADR-062 — Synthetic Data, Simulated Actors and Mock Providers

| Field | Record |
|---|---|
| Status | Accepted |
| Owner | Conceptual Research and Prototype Engineering |
| Primary Authority | D11 v1.2; D18 v1.3; D19 v1.3 |
| Related Trace IDs | CTL-014; ATR-019; CHG-10; CHG-12 |
| Context | The architecture and intervention concepts require executable exploration without using real personal data or provider contracts. |
| Decision | Use labelled synthetic personas, deterministic synthetic data, scenario simulators and mock identity, communication, knowledge and AI providers. |
| Alternatives Considered | Wait for real providers and empirical datasets; use unlabelled generated examples. |
| Rationale | Synthetic inputs support reproducibility and boundary testing without operational dependencies. |
| Consequences | + Fast, safe and repeatable research.<br>− Synthetic results cannot establish real-world feasibility or effect. |
| Verification | Generator seeds, scenario manifests, mock-provider contracts and synthetic-data labels. |
| Review Trigger | Introduction of external or human-derived data. |

#### ADR-063 — No External Approval Gate for Current Conceptual Work

| Field | Record |
|---|---|
| Status | Accepted |
| Owner | Conceptual Research and Architecture |
| Primary Authority | D1 v2.2; D19 v1.3 |
| Related Trace IDs | ATR-025; CHG-01; CHG-17 |
| Context | Earlier documents treated governance, ethics, provider and production approvals as prerequisites for a real Pilot. |
| Decision | These approvals are not required for the current theoretical and synthetic project. Internal review is a quality practice, not permission to start. |
| Alternatives Considered | Maintain approval gates despite having no human participants or live deployment. |
| Rationale | The current work does not create the risks those external processes govern. |
| Consequences | + Immediate research start.<br>− A future empirical transition must not inherit this exemption automatically. |
| Verification | No recruitment, identifiable data, production deployment or empirical-effect claim. |
| Review Trigger | Scope expands beyond conceptual and synthetic research. |

#### ADR-064 — Human-Subject Empirical Study Is a Separate Future Programme

| Field | Record |
|---|---|
| Status | Deferred |
| Owner | Conceptual Research and Future Empirical Governance |
| Primary Authority | D19 v1.3 |
| Related Trace IDs | OBJ-004; ATR-025; CHG-17 |
| Context | Some theoretical questions may eventually require observation involving real people. |
| Decision | Defer all human-subject research. If later proposed, create a separate project, protocol, decision register and applicable processes. |
| Alternatives Considered | Treat current conceptual work as the first phase of an already-authorised Pilot. |
| Rationale | Separating the programmes prevents conceptual outputs from being mistaken for empirical readiness. |
| Consequences | + Clear epistemic and operational boundary.<br>− No real-world effectiveness claim can be made in the current phase. |
| Verification | Current repositories and datasets remain synthetic. |
| Review Trigger | A specific research question is approved for empirical investigation by the future project owner. |

---

## 7. Open Implementation and Technical Decision Backlog

The following ADRs are implementation choices, not prerequisites for current conceptual research.

Use the simplest local, open or mocked option that preserves the model. Resolve a production-grade choice only when it materially affects a theoretical question or a future operational programme.

A prototype choice must be recorded, but it does not require external approval.

| ADR | Decision Needed | Status | Owner | Decision Scope | Required By | Source | Change Trace |
|---|---|---|---|---|---|---|---|
| ADR-101 | Backend Language and Framework | Proposed | Platform Architecture | Choose a strongly typed, maintainable backend stack that supports modular boundaries, OpenAPI, background jobs, testing and long-term operations. | Before MS-03 | D13 §51; D18 §223 | CHG-12 |
| ADR-102 | Participant Client: Responsive Web or PWA | Proposed | Product and UX Architecture | Select the initial client strategy based on device profile, offline needs, installability, accessibility and support burden. | Before MS-02/MS-03 | D13 §51; D20 open questions | CHG-18 |
| ADR-103 | Managed Deployment Platform | Proposed | Platform and Security Architecture | Select hosting/runtime platform, environments, secrets, networking, deployment and rollback model. | Before identifiable data | D13 §51; D18 §223 | CHG-12; CHG-13 |
| ADR-104 | Identity Provider | Proposed | Security and Platform Architecture | Select identity provider and authentication ceremonies for Participants, staff, organisations, step-up and future federation. | Before MS-03 | D13 §51; D18 §223 | CHG-03; CHG-13 |
| ADR-105 | Managed PostgreSQL Service | Proposed | Data and Platform Architecture | Select database service, region, backup, encryption, extensions and operational support. | Before MS-03 | D16 open questions; D18 §223 | CHG-15 |
| ADR-106 | Object and Media Storage Provider | Proposed | Data and Security Architecture | Select private object storage, signed delivery, malware scan, lifecycle and deletion integration. | Before MS-06 | D13 §51; D18 §223 | CHG-15 |
| ADR-107 | Queue and Scheduler | Proposed | Platform Architecture | Select durable queue, delayed jobs, priorities, retries, dead-letter handling and scheduler. | Before MS-03/MS-10 | D13 §51; D18 §223 | CHG-12 |
| ADR-108 | Search and Vector Implementation | Proposed | Data, AI and Security Architecture | Decide whether database full-text search is sufficient, whether a dedicated index is needed and whether Vector retrieval is required for the Pilot. | Before MS-06/MS-11 | D13 §51; D18 §223 | CHG-09; CHG-15 |
| ADR-109 | AI Provider and Model Gateway Stack | Proposed — Future Operational Choice | AI, Privacy and Security Governance | Select providers/models, gateway implementation, data-use terms, residency, fallback and evaluation policy. | Before AI activation | D17; D18 §223 | CHG-09; CHG-13 |
| ADR-110 | Knowledge Platform Transport | Proposed | Knowledge and Platform Architecture | Choose governed MCP, REST or compatible transport, authentication, caching and degraded behaviour. | Before MS-04/MS-11 | D9; D13 §51 | CHG-08; CHG-14 |
| ADR-111 | Communication Provider | Proposed — Future Operational Choice | Platform, Privacy and Social Safety | Select provider/channel, callback security, delivery evidence, cancellation support, residency and retention. | Before MS-10 | D15; D18 §223 | CHG-12; CHG-13; CHG-14 |
| ADR-112 | Matching Algorithm and Attribute Registry | Proposed — Future Operational Choice | Product, Research, Privacy and Social Safety | Approve permitted attributes, exclusions, candidate generation, explanation, expiry, fairness and audit. | Before Open Matching | D14 §51; D18 §223; D19 | CHG-02; CHG-10; CHG-16 |
| ADR-113 | Community Feed Ranking | Proposed — Future Operational Choice | Product, Research and Social Safety | Choose chronological or governed ranking, allowed features, explanation, diversity and anti-amplification controls. | Before Community activation | D18 §223; D20 | CHG-16; CHG-18 |
| ADR-114 | Third-Party Moderation Provider Use | Proposed | Social Safety, Privacy and Platform Governance | Decide whether external classification is needed; define data minimisation, residency, provisional status and human review. | Before Community activation | D13 §51; D18 §223 | CHG-12; CHG-13 |
| ADR-115 | Secure Analytical Environment | Proposed — Future Operational Choice | Research Data, Security and Privacy Governance | Select environment, access, code/version capture, egress, audit and locked-Dataset ingestion. | Before MS-12 | D13 §51; D18 §223 | CHG-10; CHG-15 |
| ADR-116 | Canonical Dataset File Format | Proposed | Research Data Architecture | Choose Parquet, governed analytical tables or both; define manifest, schema and checksums. | Before MS-12 | D16 open questions; D18 §223 | CHG-10; CHG-15 |
| ADR-117 | Message Body Encryption and Storage Strategy | Proposed — Future Operational Choice | Security, Privacy and Data Architecture | Choose database field encryption, encrypted object storage or a hybrid with key, search and deletion implications. | Before MS-10 | D16 open questions | CHG-13; CHG-15 |
| ADR-118 | Row-Level Security Use | Proposed | Security and Data Architecture | Decide where RLS adds defence in depth for Organisation, ResearchProject and Participant scope without obscuring application policy. | Before identifiable data | D16 open questions | CHG-13; CHG-15 |
| ADR-119 | Approved Data Residency Regions | Proposed — Future Operational Choice | Privacy, Legal and Security Governance | Approve database, object, backup, AI, communication and analytics locations and fallback restrictions. | Before provider contracts | D12–D16; D18 §223 | CHG-12; CHG-13; CHG-15 |
| ADR-120 | Retention Schedule | Proposed — Future Operational Choice | Privacy, Research and Records Governance | Set retention for Consent, Life Story, Community, Messages, callback evidence, Safety, audit, datasets and research outputs. | Before recruitment | D14; D16; D18 §223 | CHG-13; CHG-15; CHG-17 |
| ADR-121 | Backup, RPO and RTO | Proposed — Future Operational Choice | Platform, Security and Research Operations | Define backup coverage, point-in-time recovery, restore testing and service recovery targets. | Before future operational transition | D13 §51; D16; D18 §223 | CHG-12; CHG-15 |
| ADR-122 | Observability and Audit Technology | Proposed | Platform and Security Architecture | Select logs, metrics, traces, alerting, sensitive-data filtering, audit storage and operational dashboards. | Before MS-03 | D13 §51; D18 | CHG-12; CHG-13 |
| ADR-123 | Message Attachment Formats and Limits | Proposed — Future Operational Choice | Product, Privacy, Security and Social Safety | Approve media types, size, scanning, preview, retention, reporting and accessibility. | Before MS-10 | D18–D20 open questions | CHG-16; CHG-18 |
| ADR-124 | Delivery Mapping and DeliveryUnknown Timeout | Proposed — Future Operational Choice | Integration, Product and Research Governance | Define which provider evidence maps to Sent, ProviderAccepted, Delivered, Failed or Unknown and when reconciliation escalates. | Before MS-10 | D15; D18–D20 | CHG-14; CHG-16 |
| ADR-125 | MutualAcceptance Effective Period and Connection Acknowledgement | Proposed — Future Operational Choice | Product, Research and Social Safety | Approve expiry duration, invalidation triggers and whether Connection activation requires an additional Participant acknowledgement. | Before Open Matching | D15–D20 open questions | CHG-16; CHG-17; CHG-18 |

### 7.1 Prototype Decision Package

A technical choice should record:

- the research question it supports;
- the simplest viable option;
- alternatives considered;
- assumptions and limitations;
- reproducibility requirements;
- mock or local fallback;
- affected Trace and ADR IDs;
- and what would need reconsideration for a future production system.

Security, privacy, residency, provider and cost analysis may be performed conceptually, but formal external approval is not required in the current phase.

---

## 8. Superseded and Legacy Decisions

| Legacy ID | Superseded Decision or Term | Replacement | Reason |
|---|---|---|---|
| ADR-S001 | Connection may be created from MutualAcceptance or another unspecified basis | Superseded by ADR-030 and ADR-031 | Document 8 v3.2 introduced canonical MutualAcceptance and CommunicationBasis boundaries. |
| ADR-S002 | MessageDeliveryConfirmed as a canonical Domain Event | Superseded by ADR-032 | Canonical event is MessageDelivered; provider evidence is translated before domain confirmation. |
| ADR-S003 | ActorBlocked / UserReported as canonical events | Superseded by ADR-037/ADR-038 | Canonical events are BlockCreated, UserReportSubmitted and ContentReportSubmitted. |
| ADR-S004 | SafetyEventDetected by automated systems | Superseded by ADR-039 | Automated systems raise SafetySignal; authorised humans confirm SafetyEvent. |
| ADR-S005 | Public Social Networking as the M18 capability name | Superseded by ADR-025/ADR-026 | Canonical terminology is Governed Community, Platform Public and Open Matching. |
| ADR-S006 | DatasetLockConfirmed as a Domain Event | Superseded by ADR-045/ADR-046 | DatasetLockConfirmationSubmitted is UX analytics; DatasetVersionLocked is canonical. |

Superseded decisions remain visible for migration, historical event translation and review of older documents or artefacts.

---

## 9. Decision Dependency Matrix

| Decision Area | Hard Dependencies | Principal Downstream ADRs |
|---|---|---|
| Authority and traceability | ADR-001, ADR-005, ADR-006 | All ADRs |
| Module and domain ownership | ADR-004, ADR-007, ADR-008 | ADR-009–ADR-016, ADR-023–ADR-045 |
| Permission and rights | ADR-017–ADR-021 | ADR-023–ADR-040, ADR-050–ADR-055 |
| Social formation and messaging | ADR-025–ADR-038 | ADR-111–ADR-125 |
| Safety and AI | ADR-039–ADR-042, ADR-060 | ADR-109, ADR-114 |
| Evidence and research | ADR-043–ADR-049 | ADR-115, ADR-116, ADR-120 |
| Security, providers and operations | ADR-050–ADR-055 | ADR-101–ADR-124 |
| Deferred scope | ADR-010, ADR-029, ADR-056–ADR-059 | Future Protocol and product ADRs |

A downstream ADR cannot weaken a hard dependency without first superseding the upstream ADR through its proper authority.

---

## 10. Current Conceptual Research Gate

Current research may proceed immediately when:

- all inputs are public, supplied or synthetic;
- no real Participant is recruited;
- no private or identifiable human data is used;
- prototypes remain non-production;
- synthetic results are labelled;
- sources, assumptions and epistemic status are traceable;
- and contradictions are recorded.

External approvals, provider contracts and production readiness are not current gates.

The governing decisions are ADR-061 through ADR-064.

---

## 11. Verification and Evidence Linkage

Implementation evidence should reference both:

- the relevant **ADR ID** from Appendix C; and
- the relevant **ATR/CTL/MS/M18/EVT Trace ID** from Appendix A.

Representative linkage:

```text
ADR-032 — Exact Message Lifecycle and Delivery States
        ↓
ATR-014 — Exact Message State
CTL-009 — CommunicationBasis and Message
M18-08 through M18-13
EVT-010 through EVT-013
MS-10 — Connection, ConversationThread and Messaging Slice
        ↓
API Contract Tests
Database State Constraints
Provider Callback Tests
UX Comprehension Tests
Synthetic Pilot Evidence
```

Evidence references may include:

- test-suite identifier;
- security review;
- accessibility report;
- provider approval;
- threat model;
- migration;
- benchmark;
- synthetic Pilot result;
- Protocol or ethics approval;
- deployment record;
- and production-readiness sign-off.

---

## 12. ADR Change Procedure

For a new or changed material decision:

1. identify the primary source authority using Appendix E;
2. identify affected Appendix A Trace IDs;
3. create a Proposed ADR with a new ID;
4. record context, alternatives, implications and verification;
5. obtain the required authority reviews;
6. update the primary source document first;
7. mark the ADR Accepted, Accepted for Conceptual Prototype, Future Operational Decision, Deferred, Rejected or Prohibited;
8. update downstream documents and contracts;
9. update Appendix A, Appendix B where terminology changes, Appendix D and Appendix E;
10. record unresolved inconsistencies in Appendix F;
11. preserve the superseded ADR and link its replacement;
12. attach implementation evidence when delivered.

---

## 13. Review Cadence

Appendix C is reviewed:

- after any canonical Document 0–20 version change;
- before a future empirical or operational transition;
- before approving a new provider;
- before activating a Deferred capability;
- before changing a Prohibited boundary;
- before a module extraction or major data migration;
- after a serious security, privacy, Safety, AI or social-safety incident;
- and at each major post-Pilot InterventionDecision.

Open ADRs are reviewed at least at the milestone gate listed in Section 7.

---

## 14. Current Decision Posture

| Area | Current Posture |
|---|---|
| Handbook authority and traceability | Accepted and active |
| M01–M18 domain ownership | Accepted and active |
| MVP topology | Modular monolith accepted for Pilot |
| Operational database | Relational model accepted; managed service pending |
| Participant rights and Consent | Accepted; implementation and formal review required |
| Life Story | Participant-controlled and Private by default |
| Community | Governed, human-moderated and readiness-gated |
| Open Matching | Opt-in and policy-controlled |
| MutualAcceptance and Connection | Canonical and single-use formation path |
| Messaging | CommunicationBasis, exact confirmation and exact delivery state |
| AI | Controlled assistant with prohibited autonomous high-impact actions |
| Evidence and research | EvidenceDecision/Snapshot and locked reproducible datasets |
| Current research programme | Conceptual and theoretical research active; no external approval required |
| Providers and technical stack | Local and mock choices may be used immediately; production-grade choices are optional future decisions |
| Deferred capabilities | Must remain inactive until separately approved |

---

## 15. Summary

The decision architecture is:

```text
Context and Constraint
        ↓
Alternatives
        ↓
Architecture Decision
        ↓
Source Document and Trace IDs
        ↓
Consequences and Controls
        ↓
Verification Evidence
        ↓
Review or Supersession
```

The central rule is:

> An architectural choice is authoritative only when its decision, owner, source authority, consequences, verification and review trigger are all explicit.

Appendix C v1.2 establishes the conceptual-research decision baseline and separates current theoretical work from any future empirical or operational programme.
