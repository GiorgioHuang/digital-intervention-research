# IMPLEMENTATION_PLAN — Healthy Aging Digital Intervention Research Platform

> Status: a Phase 0 planning output (written against the CodingAgentMasterImplementationPrompt and the whole of Architecture Handbook v2.7, Documents 0–20 and Appendices A–F).
> This document is the implementation plan; it does not modify the Handbook itself. Implementation-level decisions are marked "Adopted for Implementation / Proposed / Blocked / Pending External Approval", and formal approval still runs through the Appendix C ADR process.
>
> It is kept as the record of what was planned at Phase 0. Where a decision has since been settled differently, the row says so with a date rather than being quietly rewritten.

---

## 1. Assessment of the repository baseline

- The repository at this point held **only `docs/` (the full Handbook), with no code, CI, migrations or environment files**. This is a greenfield implementation starting from nothing.
- The authoritative document versions were checked against Appendix D v2.7: Documents 0–20 all Reviewed (Document 19 Reviewed–Draft, ethics approval Pending, no real recruitment permitted). The Appendix F conflict register held **no open conflicts**.
- Conclusion: there is no legacy code to conflict with; the substance of this section is what `IMPLEMENTATION_BASELINE.md` records (kept as a separate file from here on, and updated as the implementation advances).

## 2. The implementation profile

Under the ADRs the Handbook had already settled (ADR-009/011/012/015 and others), the shape of the system is fixed:

- **A modular monolith**: one back-end codebase, with M01–M18 as explicitly separate packages; each module alone writes its own aggregates (ADR-008), and anything cross-module goes through commands, queries, events or read models.
- **Three running processes**: API, Worker and Scheduler — one build artefact, different entry points (Doc 13 §34).
- **One physical PostgreSQL database with a logical schema per module** (ADR-012, Doc 16 §9), with database roles isolating cross-module write permissions.
- **A transactional outbox + idempotent inbox consumers** (ADR-015); derived projections (search, vector, caches) are never authoritative (ADR-014/016).
- **Private object storage + an upload isolation and scanning pipeline** (ADR-013, Doc 16 §46–50).
- **Every external dependency behind an Anti-Corruption Layer** (ADR-052): the Knowledge Platform (M10), model providers (the M11 Model Gateway), the communications provider (M16) and the identity provider (M01).
- The front end is a **responsive web PWA**, with no native app; no microservices, Kubernetes, multi-region or enterprise stream processing (Doc 18 §137 explicitly defers these).

## 3. The technology stack proposal (against the open ADR-101…125)

The Handbook deliberately does not specify a language or framework (ADR-101 Proposed). The choices below satisfy its hard requirements (strong typing, enforceable module boundaries, OpenAPI, background jobs, PostgreSQL) and are marked **Proposed / Adopted for Implementation**; until formally approved they are not treated as permanent architecture (rule 6 of the Master Prompt's "Handling Open ADRs").

| ADR | Subject | Proposal | Rationale / alternatives |
|---|---|---|---|
| ADR-101 | back-end language and framework | **TypeScript + Node.js (NestJS)** | the module system and DI map naturally onto M01–M18; `@nestjs/swagger` generates OpenAPI; sharing a language with the front end lowers the cost for a small team. Alternative: a .NET 8 modulith (a stronger type and transaction ecosystem, but a two-language stack) |
| ADR-102 | participant client | **React + Vite SPA/PWA**, with a typed client generated from OpenAPI | meets the componentisation that WCAG AA and the seven ability-adaptive modes require |
| ADR-105 | database | **PostgreSQL 16** (Docker locally; the production managed service to be decided) | Doc 16 names PostgreSQL as the reference engine |
| — | data access and migrations | **pure SQL migrations (node-pg-migrate) + Kysely typed queries** | this domain is dense with constraints (partial unique, check, deferred), where an ORM's abstraction gets in the way; a migration is itself an object of code review |
| ADR-107 | queue and scheduling | **pg-boss** (a PostgreSQL-backed durable queue with scheduling) | it shares transaction semantics with the outbox in the same database; avoids introducing a separate broker for the MVP; split into queues by workload (consent/block propagation, safety, message delivery, matching, AI, media, analytics) |
| ADR-104 | identity provider | **Keycloak (OIDC)** during development, the production IdP pending approval | M01 stays authoritative for UserAccount and the IdP only authenticates; the interface is abstracted as an OIDC ACL. **Superseded 2026-08-07**: ADR-104 was settled as Sign in with Google (Google OIDC, a server-side revocable HttpOnly session cookie, identity matched on `(issuer, sub)`), with `dev-header` retained as an explicit development stub. Keycloak was never connected. See IMPLEMENTATION_DECISIONS and DEPLOYMENT.md |
| ADR-106 | object storage | **Cloudflare R2** (the S3-compatible API; the owner's ruling of 2026-08-07) | the provider is settled; the `BlobStore` port has two adapters (R2 and a Postgres simulator), and a half-configuration refuses to start (D-58). **Connected 2026-08-08**: all four settings are present and the running revision reports `fileStorage: object-store` at `/ready`; the first real round-trip is still unverified |
| ADR-108 | search / vector | **PostgreSQL full-text search**; vectors via pgvector, **off by default** | Doc 13: relational full-text first, and a dedicated cluster needs an argument |
| ADR-109 | AI provider | **a deterministic local simulated Provider** (no real model connected before approval) | the Model Gateway interface and Provider Registry come first, and alias resolution allows a real provider to be swapped in |
| ADR-111 | communications provider | **a deterministic Provider Simulator** (scriptable accepted / delivered / failed / unknown / replayed / out-of-order callbacks) | ADR-124's delivery mapping is built as configuration first |
| ADR-115/116 | analysis environment / dataset format | an export-based analysis workflow; a DatasetVersion lands as **Parquet + manifest + checksums**, with CSV for interchange only | Doc 16 §60 |
| ADR-117 | message body encryption | **application-layer field encryption (envelope encryption)**, with keys managed separately | fail-closed until approved: bodies are excluded from logs, events and indexes by default |
| ADR-118 | RLS | not the sole control; optionally enabled on key `organisation_id` tables as defence in depth | Doc 16 warns about the connection-pool trap |
| ADR-120/121/123/124/125 | retention / backup / attachments / delivery mapping / MutualAcceptance validity | all **configuration-driven and fail-closed**, never hard-coded | Master Prompt rule 5 |
| ADR-122 | observability | OpenTelemetry + pino structured logging (with the sensitive-field filter as a first-class concern); audit goes to the M15 append-only table, kept separate from operational telemetry | Doc 14 §61 |

CI: GitHub Actions (lint + typecheck + architecture boundary tests + unit/integration/contract/E2E + a migration rehearsal). Architecture boundaries are enforced twice over, by **dependency-cruiser and a separate database role per module** (Doc 13: CI architecture tests enforce the cross-module write prohibition).

## 4. Repository organisation

```
/apps
  /api            # the HTTP process (a NestJS application assembling the modules)
  /worker         # the queue consumer process (outbox publisher, delivery, propagation, AI)
  /scheduler      # the scheduled process (reconciliation, expiry, retention)
  /web            # the participant / researcher / administration workspace SPA
                  # (routed into the twelve workspaces of Doc 20)
/packages
  /modules/m01-identity-org … /m18-community-social   # the 18 logical modules
      domain/         # aggregates, value objects, state machines, domain policy
                      # (no dependency on the framework, the database or any SDK)
      application/    # command and query handlers, process managers
      infrastructure/ # repositories (visible to this module only), projection builders
      contracts/      # outward command / query / event types
                      # (the only directory another module may import)
      migrations/     # the SQL migrations for this module's schema
  /kernel           # the technical kernel: RequestContext, IDs and clock, transactions +
                    # outbox, structured errors, audit, encryption, observability
                    # (no shared mutable domain objects)
  /policy           # the deterministic Effective Permission engine (see §6.1)
  /contracts        # OpenAPI artefacts, the event schema catalogue (versioned JSON Schema)
  /testing          # synthetic fixtures, the deterministic clock, provider simulators
/openapi  /events   # generated and hand-written contracts
/docs               # the Handbook (read-only, never modified)
/tools              # architecture tests, the traceability validation script
```

The command pipeline is uniform (Docs 13/15): authenticate → resolve org / role / purpose / context → evaluate Effective Permission → visibility, Block and domain preconditions → the owning module's command → **state and outbox committed in one transaction** → an exact result or a `202 Operation` → audit.

## 5. Database and persistence strategy

- One schema per module (`identity_org` … `community_social`), plus `storage_ops / search_projection / analytics_stage / migration_admin`; migrations are organised by module directory and executed in dependency order.
- The general conventions are taken straight from Doc 16: UUIDv7 opaque `id`, `record_version` for optimistic concurrency, **no general-purpose `status` column** (a Message must carry both `message_lifecycle_state` and `message_delivery_state`, and so on), and tables that are immutable after approval get triple protection — an append-only version table + a content hash + database permissions.
- The list that must land as database constraints (Doc 18 §118 + Doc 16 §42–44, all with a migration and an integration test):
  - MatchDecision: `unique (actor, candidate_version) where is_current_final` — one actor, one candidate version, one final decision; a decision can only belong to whoever submitted it.
  - `mutual_acceptance_sources`: exactly two compatible MatchDecisions **or** one accepted ConnectionRequest (a check + a deferred constraint).
  - MutualAcceptance is single-use: `unique (connection_id) where connection_id is not null` + a usage-state check; consumption and Connection activation share a transaction.
  - A Connection must hold a non-null reference to the MutualAcceptance it came from; partial-unique on the active pair + purpose.
  - An active Thread must have **one currently valid CommunicationBasis** (the `thread_communication_bases` constraint).
  - A Draft Message ⇒ delivery is `Not Submitted` and there is no DeliveryAttempt or provider reference (a check).
  - A SendConfirmation is bound to the exact message_version + the recipient-set hash + the actor + an idempotency key, and cannot be reused across versions or recipient sets (unique).
  - `message_delivery_attempts`: `unique (provider, provider_reference)`; a retry is a new DeliveryAttempt sequence number.
  - BlockRecord is directional, partial-unique on the active pair + scope; the Block write and its prohibiting effect share a transaction, and propagation is accounted per target store (`block_propagation_records`).
  - DatasetVersion: one active lock per version; after locking, no new rows or files; the manifest hash cannot be replaced.
  - `safety_events`: no automated role may insert (they exist only through a confirmed conversion).
- The atomic outbox pairs (Doc 16 §54) are the golden list for integration tests: Block + BlockCreated, MatchDecision + MatchDecisionRecorded, MutualAcceptance + MutualAcceptanceRecorded, Connection + consumption + ConnectionActivated, Thread + ConversationThreadCreated, SendConfirmation + MessageSendConfirmed + MessageQueued, DatasetLock + DatasetVersionLocked.

## 6. The cross-cutting mechanisms (built before the business modules)

### 6.1 The Effective Permission engine (`/packages/policy`)
The formula is fixed: `Role + Relationship + Consent + Purpose + Context + SpecificPermission + ResourceState`, with visibility, Block, DataClassification, action risk, aggregate version, CommunicationBasis and other inputs added (ADR-017). Implementation points:

- A purely deterministic function (no LLM may participate, Doc 13 §12.9) with every input explicit; the output is the decision enumeration of the 12-step evaluation sequence (Permit / Deny / Permit with Conditions / Confirmation Required / Step-Up / Human Review / **Deny and Hide Existence**, and the rest).
- Conflict order: an explicit deny wins → participant restrictions → the narrower scope → the shorter duration → the higher classification → resource state → and if it cannot be determined, deny or send to human review.
- Every evaluation writes a `policy_decisions` row (including the policy version), so it is explainable and auditable.
- The high-consistency authorities (consent withdrawal, Block, MutualAcceptance, SendConfirmation, DatasetLock and the rest) **query the database synchronously and never go through a cache** (ADR-016); the rest may use a short-lived cache keyed by version, with withdrawal-class events invalidating at high priority.
- Collection queries filter before returning, and protected existence uses a uniform `RESOURCE_NOT_FOUND` (a 404 in place of a 403).

### 6.2 Consent (M03)
Fine-grained, per version, per purpose (Doc 19 §41 lists 20+ independent scopes — research participation, Life Story, media, supporter contributions, community, Platform Public, open matching, per-attribute matching, messaging, attachments, provider processing, AI, AIMemoryItem, metadata research use and more). The decision enumeration is Granted / Declined / Restricted / Deferred / Withdrawn / Expired / Superseded / Re-Consent Required; it is evaluated both at collection and at use. Withdrawal propagation is a durable workflow (permissions → indexes → matching → notifications → AI context and memory → pending exports → providers).

### 6.3 The event system
The five event layers are kept strictly apart: Domain / Integration / UX Analytics / Operational / Audit. The event envelope follows Doc 15 §61 (eventId, category, type, schemaVersion, aggregate{type,id,version}, actor, context, classification, correlation/causation/trace). **Only canonical names are emitted**; the deprecated aliases (`MatchCompleted`, `MessageDeliveryConfirmed`, `ActorBlocked`, `UserReported`, `SafetyEventDetected`, `DatasetLockConfirmed`) are explicitly banned in a lint rule and in the schema registry, with only a versioned translation layer permitted. UX events (such as `DatasetLockConfirmationSubmitted`) enter the analytics pipeline only and never establish a domain fact.

### 6.4 The API contract
- URI style, prefixed opaque IDs (`pv_/pt_/msg_/…`), `Idempotency-Key`, `If-Match` / expectedVersion, cursor pagination and a typed filter allowlist, all per Doc 15.
- The error catalogue implements every stable error code of Doc 15 §31 directly (`COMMUNICATION_BASIS_REQUIRED`, `MUTUAL_ACCEPTANCE_ALREADY_CONSUMED`, `SEND_CONFIRMATION_MISMATCH`, `CONNECTION_REQUEST_FEATURE_DISABLED` and the rest) — the error codes are themselves the object of the contract tests.
- Every high-impact transition is an explicit command endpoint (`/protocol-versions/{id}/approve`, `/mutual-acceptances/{id}/activate-connection`, `/messages/{id}/confirm-send`, `/dataset-versions/{id}/lock`); **there is no `POST /connections`**, and a general-purpose PATCH is prohibited on a resource after approval.
- OpenAPI is generated from the code and committed; each endpoint is annotated with its owning module, aggregate, required permission and purpose, idempotency behaviour, state transitions, audit requirements and Trace/ADR IDs (as the OpenAPI extension `x-trace-ids`).

### 6.5 Feature flags as governance objects
`ConnectionRequest`, Internet Public, read receipts, broadcast messaging, AIMemoryItem, LegacyPreference and the rest exist in an **explicitly disabled state** (returning a stable error code) — they are not "routes nobody wrote". Each flag registers its owner, default, protocol compatibility and rollback method (Doc 18 §207). A flag never substitutes for versioned domain data (ProtocolVersion, CommunityRuleVersion, the matching policy version).

## 7. Key domain implementation strategies (the highest-risk invariants)

1. **The matching → connection pipeline** (M18): `MatchPreference → MatchCandidate (+MatchExplanation) → an independent MatchDecision from each side → the server evaluates and creates a MutualAcceptance → activate-connection consumes it once → Connection`. Block and the prohibited-attribute registry are queried synchronously before candidates are generated (the prohibited attribute list lands as a database constraint); the other side's decision is invisible until policy allows it; AI may only propose, never submit on the other party's behalf (a Level-5 negative test).
2. **CommunicationBasis and messaging** (M18/M16): the basis is re-evaluated when a thread is created and at every effective message action (the four kinds: an active Connection, an authorized Relationship, an approved InterventionSession, a moderated community context). The message lifecycle and delivery state machines are never merged; editing invalidates the previous confirmation; `MessageSendConfirmed` precedes `MessageQueued`; the Worker re-verifies send authority, Block and cancellation before delivering; callbacks terminate at M16 (signature + timestamp + replay key + idempotency + provider-reference mapping) and call M18 commands through a translation, with **M16 holding no write permission on M18 tables** (backed by database roles). Provider Accepted ≠ Delivered, and Unknown goes to reconciliation rather than being dressed up as success.
3. **Block fail-closed**: discovery, candidate delivery, MutualAcceptance creation, Connection activation, thread creation, SendConfirmation, new notifications and AI context all refuse synchronously; deliveries already queued are cancelled on a best-effort basis with the provider's limits recorded; lifting a Block restores no previous state.
4. **Life Story authorship** (M17): the three states AI Draft / Supporter Contribution / Participant Testimony stay separate, and only the participant's explicit confirmation of an exact version produces Testimony (`ParticipantTestimonyConfirmed`); the six visibility levels and reuse rights are separate dimensions; withdrawal propagation reuses the workflow of §6.2.
5. **AI governance** (M11): every model call goes through the Model Gateway (alias → registry resolution, with no silent substitution); context is permission-filtered before assembly (never "send it and ask the model to ignore it"); tools go through a typed Tool Contract with Action Levels 0–4, and each entry on the Level 5 list gets its own negative test; authority fields in tool arguments (role, consent, approval, MutualAcceptance, DatasetLock, SafetyEvent) are resolved server-side and any value the model supplies is discarded; success is determined only by the owning module's structured result. A degradation matrix (Grounded Read-Only / Draft-Only / No-Tool / Manual / Disabled) with a kill switch at each level.
6. **Human authority over safety** (M09): any automation (AI included) can only produce `SafetySignalRecorded` / `AISafetySignalRaised`; a row in `safety_events` can only be created by an authorized person's convert command; approvals, DatasetLock and ResearchFinding are likewise constrained by M15 approval records with separation of duties (no self-approval).
7. **Immutability of the research chain** (M12/M13): DatasetDefinition → DatasetVersion → quality review → a human DatasetLock → AnalysisPlan (approved) → AnalysisRun (bound to the exact locked version, capturing environment, seed and code reference) → AnalysisOutput → InterpretationRecord → ResearchFinding → InterventionDecision. A correction is a new version; a withdrawal never rewrites locked history (it produces a new version or an exclusion record).

## 8. The phased delivery plan

The order follows the twenty-step build sequence of Doc 18 §173 and the hard prerequisite constraints of §174 (for example: no community without Block + Report; no messaging without CommunicationBasis; no AnalysisRun without DatasetLock). Each phase's definition of done is implementation + tests + documentation + a traceability update; scaffolding alone may never be reported as complete.

| Phase | Milestone | Content (from the coding side) | Main output |
|---|---|---|---|
| **P0 decisions and skeleton** | MS-00 | the four governance documents (BASELINE / DECISIONS / PLAN / TRACEABILITY); monorepo initialisation, CI, lint/typecheck, the dependency-cruiser architecture test, a deterministic test clock | a buildable empty skeleton + the governance files |
| **P1 engineering foundations** | MS-03 | kernel (RequestContext / errors / audit / encryption / observability), PostgreSQL and the migration framework, outbox/inbox, pg-boss, health checks, the OpenAPI pipeline, the object storage isolation pipeline, synthetic fixtures, a local docker-compose | `make dev` starts all three processes |
| **P2 identity, consent, permission** | part of MS-05 | the M01/M02/M03/M15 spine: accounts / organisations / roles, participant profile + accessibility preferences, Relationship, the full consent model, the policy engine, PolicyDecision, audit, protected existence | negative test group ① (role escalation / existence enumeration / consent withdrawal) |
| **P3 research core** | MS-04 | M04/M05/M06/M10: ResearchProject and Question, ProtocolVersion (immutable after approval), recruitment / screening / a human EligibilityDecision / Enrolment, intervention versions and configuration, the evidence chain (Review / Decision / Snapshot, with the KP ACL on the simulator) | an end-to-end researcher governance slice |
| **P4 Life Story** | MS-06/07 | all of M17 + media upload isolation and scanning, the AI Draft interface (simulated provider), testimony confirmation, six visibility levels + an audience preview, export, withdrawal propagation | the AI-fabrication test, the authorship tests |
| **P5 governed community** | MS-08 | the community half of M18: CommunitySpace / RuleVersion / membership / SocialPost / a controlled feed, **Block + Report + ModerationCase + a human ModerationDecision + appeal** (all before the community opens) | an abuse simulation, the moderator workspace |
| **P6 matching and connection** | MS-09 | MatchPreference / the attribute registry / the prohibited-attribute constraint / candidate generation / MatchExplanation / independent MatchDecisions / MutualAcceptance (expiry / invalidation / single use) / atomic Connection activation; ConnectionRequest returns FEATURE_DISABLED | negative test group ② (deciding on someone's behalf / reuse / expiry) |
| **P7 conversations and messaging** | MS-10 | CommunicationBasis / Thread / the twin message state machines / attachment validation / SendConfirmation / the queue / the M16 provider adapter with callback authentication and replay protection / DeliveryAttempt / reconciliation / Block cancellation and suppression / the messaging UX | forged / replayed / out-of-order callbacks, and the Accepted ≠ Delivered test |
| **P8 AI and safety** | MS-11 | Model Gateway / configuration versions / Prompt Registry / Tool Registry + Gateway / the confirmation and human-review queues / AIMemoryItem controls / SafetySignal → human triage → SafetyEvent / the kill switch / the degradation matrix | a negative test for every entry on the Level-5 list |
| **P9 data and analysis** | MS-12 | M12/M13/M14: DatasetDefinition / variable dictionary / TransformationRun / DatasetVersion (Parquet + manifest) / quality / de-identification / DatasetLock / AnalysisPlan / AnalysisRun / Interpretation / Finding / ReportVersion / the export package | the lineage and immutability tests |
| **P10 synthetic pilot and readiness** | MS-13/14 | automate all 30 scenarios of Doc 18 §210 plus the Doc 19 additions (attachment isolation, forged callbacks, prohibited attributes, reporter confidentiality, dataset exclusion, re-runs, rejecting a Finding); the backup and restore rehearsal; deletion and withdrawal propagation end to end; the readiness report | `PILOT_READINESS_REPORT.md` (a missing external approval is recorded honestly as Pending) |

The front end runs in parallel with every phase: from P2 onward the app shell, design tokens and core components are built (the component list of Doc 20 §322), and each vertical slice delivers the workspace interface for that slice. WCAG AA + the seven adaptive modes are the acceptance standard for the component library, and the 20 release-blocking UX defects of Doc 20 §360 become E2E assertions.

## 9. Test strategy

- **Unit**: aggregate invariants, state machines (every illegal transition enumerated), the policy engine's decision tables, event construction, provider mappings.
- **Integration**: every database constraint verified one by one (the list in §5), the atomic outbox pairs, migrations up and down, idempotent consumption, the object storage pipeline, callback authentication and replay, deletion propagation.
- **Contract**: OpenAPI against the implementation, the event JSON Schemas, the lint rule banning deprecated aliases, and the Provider / KP / AI Tool simulator contracts.
- **E2E**: four complete journeys — participant, researcher, moderator and safety reviewer.
- **Mandatory negative tests** (all 26 items of the Master Prompt's list are included): role-only escalation, existence enumeration, expired or withdrawn consent, an AI Draft passing as testimony, prohibited matching attributes, a MatchDecision made on someone else's behalf, a sourceless / expired / reused MutualAcceptance, creating a thread with no basis, silently adding participants, sending without confirmation, editing without re-confirming, forged and replayed callbacks, Accepted displayed as Delivered, Unknown dressed up as success, bypassing a Block, delivering from the queue after a Block, exposing a reporter, auto-confirming a SafetyEvent, an autonomous high-impact AI action, an unapproved DatasetLock, an Output becoming a Finding automatically, and a withdrawal that fails to propagate to derived stores.
- **The synthetic pilot**: deterministic seed data + the provider simulator, repeatable in CI, as a hard gate for MS-13.

## 10. Blocking items that need external approval (recorded honestly, never faked)

These are handled under the Master Prompt's rule — "the interface and a simulator first, configuration-driven, fail closed, and carry on with unrelated work" — and do not block the main line of coding:

- **Pending External Approval**: ADR-048 (pilot design and ethics), ADR-109 (AI provider), ADR-111 (communications provider), ADR-112 (the matching algorithm and attribute registry), ADR-113 (feed ordering), ADR-115 (analysis environment), ADR-117 (the body encryption policy), ADR-119 (data residency), ADR-120 (retention), ADR-121 (backup RPO/RTO), ADR-123/124/125 (attachments / delivery mapping / MutualAcceptance validity).
- **Proposed (this document gives the implementation choice, pending formal adoption as an ADR)**: ADR-101–108, 110, 114, 116, 118, 122. *(ADR-104 and ADR-106 have since been settled — see §3.)*
- At no point may this claim production readiness, ethics approval, or that real recruitment is possible (ATR-025 Pending).

## 11. The repository's governance artefacts

Maintained alongside the implementation: `IMPLEMENTATION_BASELINE.md`, `IMPLEMENTATION_DECISIONS.md`, `TRACEABILITY_IMPLEMENTATION_MATRIX.md` (machine-readable YAML: implementation_id ↔ Trace ID ↔ ADR ↔ module ↔ code location ↔ contract ↔ tests ↔ status), `SECURITY_AND_PRIVACY_PLAN.md`, `THREAT_MODEL.md` (hung off ATR-021 and ADR-050–055), `ACCESSIBILITY_TEST_PLAN.md`, `SYNTHETIC_PILOT_PLAN.md`, `PILOT_READINESS_REPORT.md`, the OpenAPI and event catalogues, and the runbooks (operations, backup and restore, incident response). A Trace ID may only be marked implemented once code and test evidence exist.

## 12. The first batch of code changes (the P0 → P1 entry point)

1. Monorepo initialisation (pnpm workspaces + TypeScript strict + ESLint + dependency-cruiser architecture rules).
2. `docker-compose`: PostgreSQL 16 + MinIO + Keycloak (dev). (**Checked 2026-08-07**: nothing in the code connects to the MinIO container — `BlobStore` reads only R2's four settings, falls back to the Postgres simulator when they are unset, and the R2 adapter builds its endpoint from the account ID, so it cannot be pointed at MinIO. It is a local dependency with no consumer. The Keycloak container is likewise unused since ADR-104 settled on Google.)
3. The kernel package: RequestContext (correlation / causation / trace), structured errors (starting the Doc 15 error code catalogue), the sensitive-field log filter, a deterministic clock.
4. The migration framework + the `migration_admin` schema + the first migrations (outbox / inbox / audit_events / idempotency_records).
5. CI: build, typecheck, lint, architecture boundary tests, the migration rehearsal, the test skeleton.
6. The OpenAPI generation pipeline, with `/contracts` committed.

---

*Every canonical name this plan cites (aggregates, events, states, error codes, endpoints) follows Handbook Documents 8/15/16; terminology follows Appendix B. Where an ambiguity between documents is found during implementation, it is handled under the Appendix E authority order and recorded in IMPLEMENTATION_DECISIONS.md, never by editing the Handbook.*
