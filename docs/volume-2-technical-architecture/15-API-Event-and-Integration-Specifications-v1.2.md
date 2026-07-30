# Document 15 — API, Event & Integration Specifications

**Version:** 1.2  
**Status:** Revised Interface Contract Baseline — M18 Formation, Messaging and Event Mapping Aligned  
**Handbook Volume:** Volume II — Technical Architecture  
**Primary System:** Digital Intervention Research Platform  
**Primary Product Modules:** M01–M18  
**Document Owner:** API, Event and Integration Governance  
**Approved By:** To be assigned  
**Last Updated:** 2026-07-29  
**Supersedes:** Document 15 — API, Event & Integration Specifications v1.1  
**Review Trigger:** A material change to API conventions, command or query contracts, domain resources, MatchDecision, MutualAcceptance, ConnectionRequest, Connection, CommunicationBasis, ConversationThread, Message lifecycle or delivery state, permission context, Consent or purpose propagation, visibility, Block enforcement, Domain, Integration or UX Analytics Event mapping, delivery guarantees, Webhooks, file exchange, MCP tools, AI tool authority, external adapters, Dataset or Analysis interfaces, compatibility, or MVP integration scope

---

## 1. Purpose

This document defines the **API, Event & Integration Specifications** of the **Healthy Aging Digital Intervention Research Platform**.

It translates Documents 0–14 into explicit communication contracts for:

- client applications;
- M01–M18 Platform modules;
- background workers and workflow processors;
- the Healthy Aging Knowledge Platform;
- AI model and tool orchestration;
- identity, communication, media, moderation and device providers;
- analytical environments;
- export recipients;
- and approved external systems.

The document defines how:

- commands and queries are represented;
- permission, Consent, purpose, visibility, Block and Resource State are enforced across interfaces;
- material state changes are published as events;
- long-running operations are represented;
- Life Story, Community, Open Matching, MatchDecisions, MutualAcceptance, deferred ConnectionRequests, Connections, ConversationThreads, Messages, reports and moderation are exposed safely;
- Safety Signals remain separate from confirmed Safety Events;
- AI tools remain typed, permission-scoped and subordinate to owning-domain commands;
- Dataset Definitions, Dataset Versions, Dataset Locks, Analysis Runs and Research Findings remain traceable;
- files, batches and Webhooks are exchanged;
- failures, retries, idempotency, ordering and compatibility are managed;
- and provenance, audit and research lineage are preserved.

The central rule is:

> Every interface must preserve canonical domain meaning, accountable ownership, current permission context, exact version, provenance, state and failure semantics.

This document is implementation-oriented but remains provider- and framework-neutral where possible.

---

## 2. Scope

This document covers:

- interface architecture and contract authority;
- API design principles;
- resource and command naming;
- URI structure and HTTP methods;
- authentication, role, Organisation and Research Project context;
- Relationship, Consent, purpose, Specific Permission and Resource State;
- visibility, Block, MatchDecision, MutualAcceptance, CommunicationBasis and protected existence;
- request and response envelopes;
- pagination, filtering, sorting, search, field selection and expansion;
- resource metadata and independent state dimensions;
- optimistic concurrency and idempotency;
- validation, structured errors and HTTP guidance;
- long-running operations;
- API, resource, schema, event, tool and file versioning;
- command, query, action, confirmation and review patterns;
- API resource catalogues and representative endpoints for M01–M18;
- event architecture, envelopes and catalogues;
- ordering, delivery, outbox, inbox, retry, dead-letter and replay;
- Webhook contracts;
- file, batch, import and export contracts;
- MCP integration;
- Knowledge Platform and Research Platform tools;
- AI tool request, result, confirmation and audit contracts;
- external adapters and Anti-Corruption Layers;
- integration registry and authentication patterns;
- timeout, circuit breaker, quota and reconciliation contracts;
- security, privacy, provenance and audit context;
- observability and logging;
- OpenAPI, AsyncAPI, JSON Schema and SDK documentation;
- contract and security testing;
- compatibility, deprecation, residency and multi-Organisation routing;
- degraded modes;
- expanded MVP interface scope;
- deferred capabilities;
- and future evolution.

This document does not define:

- final generated OpenAPI documents;
- final generated AsyncAPI documents;
- final JSON Schema files;
- final MCP manifests;
- final provider-specific SDKs;
- physical database schemas;
- final identity-provider configuration;
- final message-broker or cloud product;
- final encryption parameters;
- or complete integration runbooks.

Those artefacts are generated from this baseline during implementation and governed through version control and review.

---

## 3. Relationship to Other Documents

### Depends on

- Document 0 — Platform Ecosystem Architecture v1.2
- Document 1 — Project Definition & Vision v2.1
- Document 2 — Conceptual & Evidence Framework v2.1
- Document 3 — Intervention Map v2.3
- Document 4 — User Roles & Permission Model v3.0
- Document 5 — Ability-Adaptive UX Principles v2.1
- Document 6 — Core Product Modules v3.1
- Document 7 — Information Architecture v3.0
- Document 8 — Core Domain Model & Ubiquitous Language v3.2
- Document 9 — Evidence & Knowledge Integration Architecture v1.1
- Document 10 — AI Companion Architecture v1.1
- Document 11 — Research & Evaluation Framework v1.1
- Document 12 — Data & Interoperability Architecture v1.1
- Document 13 — System Context & Technical Architecture v1.1
- Document 14 — Security, Privacy & Consent Architecture v1.1

### Provides input to

- Document 16 — Database & Storage Design revision
- Document 17 — AI Orchestration & Model Operations revision
- Document 18 — MVP Scope & Delivery Roadmap revision
- Document 19 — Initial Pilot Research Protocol revision
- Document 20 — UX Flows & Design System Specification revision
- OpenAPI Specifications
- AsyncAPI Specifications
- JSON Schema Registry
- MCP Tool Manifests
- Event Catalogue
- Integration Registry
- File Exchange Specifications
- Error Catalogue
- Contract Test Suites
- SDK Generation
- Webhook Runbooks
- Provider Adapter Specifications

### Authority Hierarchy

| Subject | Authority |
|---|---|
| Ecosystem ownership | Document 0 |
| Effective human permission | Document 4 |
| Aggregate ownership, states and events | Document 8 |
| Evidence integration | Document 9 |
| AI actions and tools | Document 10 |
| Research, Dataset and Analysis lifecycle | Document 11 |
| Data authority and interoperability | Document 12 |
| Technical placement and runtime | Document 13 |
| Security, privacy and Consent controls | Document 14 |
| Interface contracts and delivery semantics | Document 15 v1.2 |

### 3.1 v1.2 Revalidation Result

Version 1.2 revalidates this interface baseline against Document 8 v3.2 and resolves the downstream contract implications of HC-002, HC-003, HC-004 and HC-008.

The canonical first-Pilot path is:

```text
MatchCandidate
        ↓
Independent MatchDecision by Each Actor
        ↓
MutualAcceptance
        ↓
Connection
        ↓
ConversationThread under Current CommunicationBasis
        ↓
Message Draft
        ↓
Actor-Specific Send Confirmation
        ↓
Queued / Sent / Provider Accepted / Delivered / Failed
```

`ConnectionRequest` remains a versioned API resource and command family only as a **Deferred Alternative Connection Basis**.

It is feature-disabled for the first Pilot.

If enabled later, acceptance creates `MutualAcceptance`; it does not directly activate a `Connection`.

Document 8 v3.2 §133 is authoritative for Domain Event, Integration Event and UX Analytics Event mapping.

---

## 4. Interface Architecture Overview

```text
Client Applications
        │
        ▼
Versioned HTTP APIs
        │
        ▼
Application Commands and Queries
        │
        ▼
M01–M18 Owning Modules
        │
        ├── Domain Events
        ├── Transactional Outbox
        ├── Durable Jobs
        └── Purpose-Specific Read Models
        │
        ├──────────────► Internal Consumers
        ├──────────────► Webhook Consumers
        ├──────────────► File and Batch Exchange
        ├──────────────► MCP Tool Interfaces
        └──────────────► External Adapters
```

External systems include:

- Healthy Aging Knowledge Platform;
- identity provider;
- AI model provider;
- communication provider;
- media, transcription or translation provider;
- moderation or abuse-detection provider;
- device and wearable platform;
- analytical environment;
- external care or service system;
- and approved export recipient.

Interfaces must not expose storage internals or allow a consumer to bypass the owning domain module.

---

## 5. Interface Types

The Platform uses the following interface types:

| Interface | Primary Use |
|---|---|
| HTTP Resource API | interactive reads and bounded resource creation |
| HTTP Command API | explicit domain state transitions |
| Query API | permission-scoped read models |
| Operation Resource | long-running work and human-review progress |
| Domain Event | internal completed fact |
| Integration Event | deliberately published cross-boundary fact |
| Durable Job | scheduled, retryable or asynchronous work |
| Webhook | outbound event notification to registered recipient |
| File Package | governed import, export or migration |
| Batch Contract | scheduled exchange and reconciliation |
| MCP Tool | typed tool use by AI or approved clients |
| External Adapter | provider-specific protocol isolation |
| Analytical Delivery | locked Dataset Version and research artefact access |

A single business action may involve several interface types, but each retains its own contract and version.

---

## 6. Contract Authority and Ownership

### 6.1 Canonical Domain Language

Resources, commands, events and fields use the terminology defined in Document 8.

### 6.2 One Write Owner

Only the owning module accepts commands that mutate its aggregate.

### 6.3 Contract Does Not Change Ownership

An API gateway, BFF, event consumer, AI tool, external adapter or analytical process does not acquire domain ownership.

### 6.4 Read Models

Read models may combine references from multiple modules after current permission filtering.

### 6.5 Contract Registry

Every public, partner, MCP, event, file and Webhook contract has:

- owner;
- version;
- lifecycle;
- classification;
- consumers;
- compatibility policy;
- security review;
- and retirement plan.

### 6.6 Exact Version

Approval, execution and audit apply to exact resource and contract versions.

---

## 7. API Design Principles

1. Use canonical domain language.
2. Deny by default.
3. Authenticate every non-public request.
4. Resolve current server-side permission.
5. Preserve purpose and trace.
6. Use explicit commands for material transitions.
7. Do not edit approved records through generic mutation.
8. Use minimum-necessary fields.
9. Protect resource existence.
10. Preserve independent state dimensions.
11. Use optimistic concurrency.
12. Use idempotency for retryable effects.
13. Return structured stable errors.
14. Represent long-running work explicitly.
15. Make pending, Draft and confirmed states visible.
16. Never infer external delivery or human approval.
17. Separate operational, research and analytical contracts.
18. Preserve provenance and source authority.
19. Keep AI tools subordinate to domain commands.
20. Design for accessible client behaviour and safe recovery.

---

## 8. API Style and Media Types

### 8.1 HTTP and JSON

Client-facing APIs use HTTPS with JSON representations unless files, media or streaming require another format.

### 8.2 Media Type

A versioned vendor media type may be used where it adds value.

Example:

```text
application/vnd.healthy-aging.v1+json
```

A URI major version may also be used consistently.

### 8.3 Character Encoding

JSON uses UTF-8.

### 8.4 Date and Time

Timestamps use ISO 8601 with explicit offset or UTC.

### 8.5 Identifiers

Identifiers are opaque strings and are not parsed by clients.

### 8.6 Null, Missing and Empty

Contracts define the difference among:

- field omitted;
- `null`;
- empty string;
- empty collection;
- unknown;
- not applicable;
- withheld;
- and not permitted.

### 8.7 Enum Evolution

Consumers must tolerate documented compatible enum additions or use an `Unknown` fallback where the contract allows.

---

## 9. URI and Resource Naming

### 9.1 Naming

Paths use plural, lower-case, kebab-case resource names.

Examples:

```text
/research-projects
/protocol-versions
/life-story-items
/match-candidates
/dataset-versions
```

### 9.2 Nested Paths

Nesting expresses a stable ownership or query scope, not arbitrary database joins.

Example:

```text
/research-projects/{projectId}/protocol-versions
```

### 9.3 Maximum Nesting

Deep nesting is avoided. Canonical resources remain directly addressable where safe.

### 9.4 Actions

Material transitions use action subresources or command endpoints.

Example:

```text
POST /protocol-versions/{id}/approve
```

### 9.5 Public Identifiers

Public URLs use identifiers distinct from internal canonical identifiers where appropriate.

### 9.6 No Sensitive Data in URI

Names, email addresses, Consent choices, message text and sensitive filters do not appear in paths.

---

## 10. HTTP Method Conventions

| Method | Use |
|---|---|
| GET | retrieve a resource or collection |
| POST | create a resource or execute a command |
| PUT | replace a client-owned or explicitly replaceable representation |
| PATCH | update permitted Draft or preference fields |
| DELETE | request deletion or remove an explicitly deletable resource |
| HEAD | retrieve metadata where supported |
| OPTIONS | capability or CORS negotiation where supported |

### 10.1 Generic PATCH Restrictions

Generic PATCH is prohibited for:

- approved Protocol Versions;
- active Consent decisions;
- confirmed Life Story Testimony;
- Match Decisions;
- Connections;
- Blocks;
- Moderation Decisions;
- Safety Event decisions;
- locked Dataset Versions;
- approved Interpretation Records;
- approved Research Findings;
- and completed external submissions.

### 10.2 DELETE Semantics

DELETE does not imply immediate physical erasure.

The response reflects the owning domain's deletion, withdrawal, retention or tombstone semantics.

---

## 11. Request Context

Every sensitive request carries or resolves:

- authenticated actor or ServiceAccount;
- Organisation;
- active Role and scope;
- ResearchProject where applicable;
- Participant context where applicable;
- Relationship, Connection or another CommunicationBasis reference where relevant;
- governed purpose;
- target resource and expected version;
- authentication strength;
- client and contract version;
- correlation and trace identifiers;
- and Idempotency-Key where applicable.

The server resolves and evaluates:

```text
Role
+ Relationship
+ Consent
+ Purpose
+ Context
+ Specific Permission
+ Resource State
```

Additional deterministic checks may include:

- Visibility;
- CommunityMembership;
- BlockRecord;
- Open Matching state;
- MatchCandidate eligibility and expiry;
- independent MatchDecision ownership;
- MutualAcceptance validity and usage;
- Connection state;
- CommunicationBasis;
- ConversationThread participant set and state;
- Message lifecycle and delivery state;
- Data Classification;
- approval;
- attachment readiness;
- provider policy;
- and action risk.

Client-supplied context narrows a request but never grants authority.

A `connectionId`, `mutualAcceptanceId`, `conversationThreadId`, `communicationBasis` or `consentId` supplied by a client is only a reference to re-evaluate, not proof of authority.

---

## 12. Standard Request Headers


Representative headers include:

| Header | Purpose |
|---|---|
| `Authorization` | authenticated identity token |
| `Accept` | response media type and API version |
| `Content-Type` | request media type |
| `Idempotency-Key` | retry-safe effect identity |
| `If-Match` | expected resource version or ETag |
| `X-Organisation-Id` | selected Organisation scope |
| `X-Research-Project-Id` | selected Research Project scope |
| `X-Purpose-Code` | declared governed purpose |
| `X-Client-Version` | client release |
| `X-Request-Id` | client request identifier |
| `traceparent` | distributed trace context |
| `tracestate` | optional trace vendor state |
| `Prefer` | response or asynchronous preference where supported |

The server verifies all scoped identifiers against the authenticated actor.

Headers must not carry:

- raw Consent documents;
- permission grants;
- message or Life Story content;
- credentials beyond the authentication mechanism;
- or model-generated approval.

---

## 13. Standard Response Envelope

A successful single-resource response may use:

```json
{
  "data": {
    "type": "protocol-version",
    "id": "pv_...",
    "attributes": {},
    "relationships": {},
    "meta": {
      "resourceVersion": 7,
      "lifecycleState": "Approved",
      "approvalState": "Approved",
      "resourceState": "Active"
    }
  },
  "meta": {
    "requestId": "req_...",
    "traceId": "trace_...",
    "contractVersion": "1.1",
    "generatedAt": "2026-07-29T11:00:00Z"
  },
  "links": {
    "self": "/protocol-versions/pv_..."
  }
}
```

The exact wire shape may be simplified during implementation, but it must preserve:

- resource identity and type;
- exact version;
- relevant independent state dimensions;
- request and trace;
- and links or next permitted actions where useful.

---

## 14. Collection Response

A collection response may use:

```json
{
  "data": [],
  "meta": {
    "requestId": "req_...",
    "traceId": "trace_...",
    "pageSize": 50,
    "nextCursor": "cursor_...",
    "resultCompleteness": "Complete"
  },
  "links": {
    "next": "/resource?cursor=cursor_..."
  }
}
```

A collection contract defines:

- ordering;
- cursor semantics;
- result completeness;
- filtering;
- field projection;
- visibility and permission scope;
- and whether counts are safe to reveal.

A partial external result is explicitly labelled and does not appear complete.

---

## 15. Pagination

### 15.1 Cursor Pagination

Cursor pagination is preferred for large or changing collections.

### 15.2 Offset Pagination

Offset pagination may be used for small, stable administrative lists.

### 15.3 Stable Ordering

A cursor contract defines deterministic ordering and tie-breakers.

### 15.4 Cursor Security

Cursors are opaque, integrity-protected and scoped to the actor, query or bounded lifetime where necessary.

### 15.5 Sensitive Counts

Total counts are omitted or coarsened when they could reveal protected Participants, blocked actors, reports, Safety records or restricted project activity.

### 15.6 Page Limits

Default and maximum page sizes are endpoint-specific.

---

## 16. Filtering

Filtering uses an allowlist of typed fields.

Examples:

```text
?lifecycleState=Active
?researchProjectId=rp_...
?updatedAfter=2026-07-01T00:00:00Z
?visibility=Community
```

Unsupported filters return a structured validation error.

Sensitive filters require purpose and permission.

Filtering cannot request hidden attributes or infer protected traits.

Open Matching filters are not exposed as unrestricted people-search parameters.

---

## 17. Sorting

Sorting uses an allowlist.

Example:

```text
?sort=-updatedAt,title
```

Contracts define:

- direction;
- null ordering;
- stable fallback;
- locale where relevant;
- and whether ranking is deterministic or policy-driven.

Clients cannot sort by hidden vulnerability, capacity, risk, protected trait or opaque compatibility score.

---

## 18. Search and Discovery

### 18.1 Structured Search

Uses typed canonical fields.

### 18.2 Full-Text Search

Uses an explicit `q` parameter or dedicated endpoint.

### 18.3 Semantic Search

Uses a dedicated capability and source re-authorisation.

### 18.4 Evidence Search

Preserves:

- query and purpose;
- filters;
- Knowledge Platform capability;
- source identifier and version;
- provenance;
- verification state;
- licensing;
- completeness;
- and retrieval time.

### 18.5 Life Story Search

Search is limited to the Participant's own archive or explicitly shared permitted items.

### 18.6 Community Discovery

Applies eligibility, visibility, Community Rules, Block and moderation before ranking.

### 18.7 Matching

Match Candidate generation is a governed command or operation, not general search.

### 18.8 Protected Search

Search must not reveal:

- blocked actor existence;
- private Life Story;
- message content;
- reporter identity;
- Safety records;
- moderation evidence;
- or restricted research records.

---

## 19. Field Selection and Expansion

### 19.1 Sparse Fields

Clients may request supported sparse fields.

### 19.2 Expansion

Expansion is explicit.

Example:

```text
?include=protocolVersion,interventionConfiguration
```

### 19.3 Expansion Limits

Contracts define maximum depth, count and cost.

### 19.4 Permission Re-Evaluation

Every expanded resource is independently authorised.

### 19.5 Sensitive Relationships

Expansion does not expose:

- private Relationship details;
- Connections;
- Blocks;
- reports;
- Safety records;
- moderator identity;
- or third-party Life Story content

unless independently permitted.

---

## 20. Resource Metadata and State Dimensions

Governed resources may include:

- ID;
- resource version;
- schema version;
- created and updated time;
- creator and updater;
- lifecycle state;
- review state;
- approval state;
- Visibility;
- Resource State;
- quality state;
- retention state;
- external resolution state;
- supersession;
- effective period;
- and available actions.

The API must not collapse these dimensions into one generic `status`.

Example:

```json
{
  "lifecycleState": "Active",
  "reviewState": "In Review",
  "approvalState": "Approved",
  "visibility": "Private",
  "resourceState": "Usable"
}
```

Only applicable dimensions appear.

### 20.1 M18 Independent State Dimensions

Representative M18 resources preserve separate dimensions:

| Resource | Independent State Dimensions |
|---|---|
| MatchCandidate | lifecycle, expiry, visibility and current decision availability |
| MutualAcceptance | lifecycle, validity, effective period, invalidation and Connection usage |
| Connection | lifecycle, mute preference, restriction and Block effect |
| ConversationThread | lifecycle, CommunicationBasis validity, participant eligibility and Block effect |
| Message | lifecycle, send-confirmation state, delivery state, moderation state and retention state |

A Message response must not compress Draft, Confirmed, Queued, Sent, Provider Accepted, Delivered, Read, Failed, Cancelled, Expired and Withdrawn into one ambiguous field.

---

## 21. Concurrency Control


### 21.1 Optimistic Concurrency

Versioned resources use optimistic concurrency.

### 21.2 ETag

Responses may include an ETag derived from the resource version.

### 21.3 If-Match

Sensitive updates and commands require `If-Match` or an expected resource version.

### 21.4 Conflict

A conflict returns:

- current version;
- expected version;
- safe conflict reason;
- and permitted recovery action.

### 21.5 No Silent Overwrite

Concurrent or approved changes are never silently overwritten.

### 21.6 Multi-Actor Decisions

Match Decisions, approvals and moderation actions record each actor's independent decision rather than resolving through last-write-wins.

---

## 22. Idempotency

Idempotency is required for retryable operations that could create duplicate effects, including:

- invitation;
- Consent decision;
- Enrolment;
- intervention assignment;
- assessment submission;
- Life Story media upload initiation;
- Social Post publication;
- MatchDecision;
- MutualAcceptance evaluation and recording;
- Connection activation;
- ConversationThread creation;
- Message SendConfirmation;
- Message queue or provider submission;
- provider delivery callback processing;
- Block;
- report submission;
- Safety Signal recording;
- Dataset generation;
- Dataset Lock;
- export;
- Webhook delivery;
- and external provider write.

An idempotency record is scoped to:

- authenticated actor or Service Account;
- Organisation;
- endpoint or command;
- target resource;
- key;
- bounded retention;
- and canonical request hash.

Reusing a key with a materially different request returns `IDEMPOTENCY_CONFLICT`.

A repeated request returns the original confirmed result where safe.

---

## 23. Validation

Validation layers include:

### 23.1 Structural Validation

- required fields;
- type and format;
- length and size;
- enum and schema;
- and media type.

### 23.2 Authentication and Context Validation

- identity;
- Organisation;
- role;
- Research Project;
- authentication strength;
- and trace.

### 23.3 Permission Validation

- Relationship;
- Consent;
- purpose;
- Specific Permission;
- Resource State;
- visibility;
- Block;
- MatchDecision ownership;
- MutualAcceptance validity and usage;
- CommunicationBasis;
- ConversationThread state;
- Data Classification;
- and approval.

### 23.4 Domain Validation

- valid lifecycle transition;
- eligibility;
- current Protocol and configuration;
- ownership or authorship;
- Community Rule;
- matching policy;
- MatchCandidate and MatchDecision version;
- MutualAcceptance source references, expiry, invalidation and single-use rule;
- ConnectionRequest feature state;
- Connection activation basis;
- ConversationThread participant set and CommunicationBasis;
- Message Draft, SendConfirmation, attachment and delivery transition;
- moderation authority;
- Safety authority;
- Dataset Lock readiness;
- and domain invariants.

### 23.5 External Validation

- provider identity;
- response schema;
- source authority;
- identifier resolution;
- authenticated provider callback;
- mapped provider Message reference;
- delivery-state transition;
- provenance;
- and freshness.

### 23.6 Validation Response

Validation errors identify safe fields and reasons without exposing protected existence or sensitive internals.

---

## 24. Standard Error Model

A standard error response may use:

```json
{
  "error": {
    "code": "CONSENT_REQUIRED",
    "message": "Current Consent does not permit this action.",
    "details": [
      {
        "field": "purpose",
        "reason": "Consent scope is incompatible."
      }
    ],
    "action": {
      "type": "ReviewConsent",
      "href": "/participants/pt_.../consent-review"
    },
    "requestId": "req_...",
    "traceId": "trace_...",
    "retryable": false
  }
}
```

Error messages must be:

- stable enough for clients;
- understandable to users where displayed;
- safe for protected resources;
- accessible;
- and distinct from internal diagnostic detail.

---

## 25. Error Catalogue

Representative error codes include:

### Authentication and Context

- `AUTHENTICATION_REQUIRED`
- `AUTHENTICATION_FAILED`
- `STEP_UP_AUTHENTICATION_REQUIRED`
- `SESSION_EXPIRED`
- `ORGANISATION_CONTEXT_REQUIRED`
- `RESEARCH_PROJECT_CONTEXT_REQUIRED`

### Authorisation and Consent

- `AUTHORISATION_DENIED`
- `RELATIONSHIP_REQUIRED`
- `CONSENT_REQUIRED`
- `CONSENT_EXPIRED`
- `PURPOSE_NOT_PERMITTED`
- `SPECIFIC_PERMISSION_REQUIRED`
- `RESOURCE_STATE_BLOCKED`
- `VISIBILITY_DENIED`
- `BLOCKED_INTERACTION`
- `COMMUNICATION_BASIS_REQUIRED`
- `COMMUNICATION_BASIS_EXPIRED`
- `MUTUAL_ACCEPTANCE_REQUIRED`

### Matching and Connection

- `MATCHING_NOT_ACTIVE`
- `MATCH_CANDIDATE_EXPIRED`
- `MATCH_DECISION_NOT_OWNED`
- `MATCH_DECISION_CONFLICT`
- `MUTUAL_ACCEPTANCE_NOT_FOUND`
- `MUTUAL_ACCEPTANCE_EXPIRED`
- `MUTUAL_ACCEPTANCE_INVALIDATED`
- `MUTUAL_ACCEPTANCE_ALREADY_CONSUMED`
- `CONNECTION_REQUEST_FEATURE_DISABLED`
- `CONNECTION_BASIS_INVALID`
- `CONNECTION_NOT_ACTIVE`

### Conversation and Message

- `CONVERSATION_THREAD_NOT_USABLE`
- `THREAD_PARTICIPANT_MISMATCH`
- `MESSAGE_NOT_DRAFT`
- `MESSAGE_VERSION_CONFLICT`
- `SEND_CONFIRMATION_REQUIRED`
- `SEND_CONFIRMATION_EXPIRED`
- `SEND_CONFIRMATION_MISMATCH`
- `ATTACHMENT_NOT_READY`
- `MESSAGE_ALREADY_QUEUED`
- `MESSAGE_DELIVERY_STATE_CONFLICT`
- `MESSAGE_DELIVERY_UNKNOWN`
- `MESSAGE_CANNOT_BE_WITHDRAWN`
- `PROVIDER_CALLBACK_INVALID`
- `PROVIDER_REFERENCE_UNKNOWN`

### Resource and State

- `RESOURCE_NOT_FOUND`
- `RESOURCE_CONFLICT`
- `VERSION_CONFLICT`
- `INVALID_STATE_TRANSITION`
- `IMMUTABLE_RESOURCE`
- `RESOURCE_WITHDRAWN`
- `RESOURCE_RESTRICTED`

### Workflow and Approval

- `CONFIRMATION_REQUIRED`
- `HUMAN_REVIEW_REQUIRED`
- `APPROVAL_REQUIRED`
- `MODERATION_REVIEW_REQUIRED`
- `SAFETY_REVIEW_REQUIRED`
- `DATASET_LOCK_NOT_READY`
- `EXPORT_REQUIRES_APPROVAL`

### Request and Capacity

- `VALIDATION_ERROR`
- `UNSUPPORTED_FILTER`
- `UNSUPPORTED_CAPABILITY`
- `IDEMPOTENCY_CONFLICT`
- `PAYLOAD_TOO_LARGE`
- `RATE_LIMITED`

### Dependency and Data

- `DEPENDENCY_UNAVAILABLE`
- `PROVIDER_TIMEOUT`
- `PROVIDER_REJECTED`
- `DELIVERY_UNCONFIRMED`
- `BLOCK_PROPAGATION_PENDING`
- `DATA_QUALITY_FAILURE`
- `LINEAGE_INCOMPLETE`
- `DEIDENTIFICATION_REQUIRED`
- `PARTIAL_RESULT`

### Internal

- `AUDIT_UNAVAILABLE`
- `INTERNAL_ERROR`

The final catalogue defines retryability, HTTP mapping, user-facing wording, protected-existence behaviour and operational severity.

A protected Message, MatchCandidate, MutualAcceptance, Connection or ConversationThread may return `RESOURCE_NOT_FOUND` rather than revealing its existence.

---

## 26. HTTP Status Guidance


| Status | Representative Use |
|---|---|
| 200 | successful query or completed command |
| 201 | resource created |
| 202 | accepted long-running operation |
| 204 | completed action with no body |
| 400 | malformed or structurally invalid request |
| 401 | authentication missing, expired or failed |
| 403 | authenticated but action not permitted |
| 404 | unavailable, nonexistent or protected resource |
| 409 | domain conflict or invalid current state |
| 412 | version precondition failed |
| 413 | payload too large |
| 422 | domain validation failed |
| 423 | resource locked or restricted where useful |
| 429 | rate or quota exceeded |
| 500 | unexpected Platform failure |
| 502 | invalid external dependency response |
| 503 | temporarily unavailable |
| 504 | dependency timeout |

The Platform may intentionally use `404` instead of `403` to protect resource existence.

Consent denial is usually `403`, while missing Consent information in a valid workflow may use `409` or `422` according to the command contract.

---

## 27. Long-Running Operations

Long-running work returns `202 Accepted` with an Operation resource.

Example:

```json
{
  "data": {
    "type": "operation",
    "id": "op_...",
    "attributes": {
      "operationType": "GenerateDatasetVersion",
      "state": "Queued",
      "submittedAt": "2026-07-29T11:00:00Z"
    },
    "links": {
      "self": "/operations/op_..."
    }
  }
}
```

Representative operation states:

- Queued;
- Running;
- Waiting for External Dependency;
- Waiting for Human Review;
- Retrying;
- Succeeded;
- Failed;
- Cancelled;
- Dead-Lettered;
- Expired.

The resource may expose:

- safe progress;
- current phase;
- next human task;
- result reference;
- failure code;
- retryability;
- cancellation capability;
- and expiry.

Progress must not imply scientific, delivery or approval certainty.

---

## 28. API Versioning

### 28.1 Major Version

Breaking semantic or structural changes require a new major API version.

### 28.2 Compatible Changes

Potentially compatible changes include:

- optional fields;
- new endpoints;
- new links;
- new error detail fields;
- and documented enum additions for tolerant clients.

### 28.3 Breaking Changes

Examples include:

- removed or renamed field;
- changed meaning;
- newly required field;
- incompatible identifier;
- changed default visibility;
- altered permission behaviour;
- altered state transition;
- or changed delivery guarantee.

### 28.4 Version Negotiation

Version is explicit through URI, media type or another consistent mechanism.

### 28.5 Deprecation

Deprecated versions include warning metadata and a migration path.

---

## 29. Resource, Schema and Contract Versioning

The following versions remain distinct:

- API major version;
- resource version;
- aggregate version;
- schema version;
- domain configuration version;
- event schema version;
- MCP tool version;
- file-package version;
- provider-adapter version;
- and client version.

A resource response may reference exact:

- ProtocolVersion;
- InterventionVersion;
- AIInterventionConfigurationVersion;
- MeasurementVersion;
- CommunityRuleVersion;
- matching-policy version;
- DatasetDefinition version;
- AnalysisPlan version;
- and EvidenceSnapshot.

A contract version does not replace the domain resource version.

---

## 30. Command API Pattern

A command endpoint should:

1. authenticate the actor or ServiceAccount;
2. resolve Organisation, Role, ResearchProject and Participant context;
3. resolve governed purpose;
4. evaluate Effective Permission;
5. apply Visibility, Block, MatchDecision, MutualAcceptance, CommunicationBasis, Data Classification and action-risk rules;
6. validate idempotency and expected resource version;
7. validate aggregate-specific domain preconditions;
8. execute the owning-domain command;
9. persist state and outbox atomically;
10. return the confirmed result, pending Operation or review requirement;
11. record audit and trace.

Commands use imperative domain names.

Examples:

```text
POST /protocol-versions/{id}/approve
POST /match-candidates/{id}/decisions
POST /mutual-acceptances/{id}/activate-connection
POST /conversation-threads
POST /messages/{id}/confirm-send
POST /block-records
POST /dataset-versions/{id}/lock
```

A command never trusts model- or client-supplied authority fields.

A client cannot create `MutualAcceptance` by posting arbitrary actor IDs or decision claims.

M18 creates it only from canonical source records and current policy checks.

---

## 31. Query API Pattern


A query endpoint should:

1. authenticate;
2. resolve role, Organisation, Research Project, purpose and context;
3. evaluate current permission and protected existence;
4. apply visibility, Block and Resource State;
5. select minimum-necessary data;
6. retrieve from the owning module or approved projection;
7. independently authorise expansions;
8. mask restricted fields;
9. label source, state, version, freshness and completeness;
10. record sensitive access where required;
11. return versioned data.

A projected or cached record does not grant permission.

---

## 32. Action, Confirmation and Review Pattern

A high-impact action may require:

- explicit user confirmation;
- step-up authentication;
- reviewer assignment;
- ApprovalRecord;
- dual control;
- or an Operation that waits for human action.

A confirmation token or challenge is:

- scoped to actor, action, resource and version;
- short-lived;
- single-use where appropriate;
- inaccessible to the AI model as authority;
- and audited.

Examples requiring confirmation or review may include:

- Internet Public publication;
- MatchDecision that may contribute to MutualAcceptance;
- Connection activation from MutualAcceptance where Participant acknowledgement is configured;
- Message SendConfirmation for one exact Draft version and recipient set;
- block;
- identifiable export;
- high-impact moderation;
- Safety Event confirmation;
- Dataset Lock;
- and Research Finding approval.

Silence, timeout or AI confidence never counts as confirmation.

---

## 33. Authentication and Permission Context

The authenticated request context includes:

- actor ID or Service Account ID;
- actor type;
- Organisation;
- active role;
- Research Project;
- authentication method and strength;
- session ID and age;
- delegated initiator where applicable;
- purpose;
- and trace.

The server evaluates:

```text
Role
+ Relationship
+ Consent
+ Purpose
+ Context
+ Specific Permission
+ Resource State
```

A permission decision may return:

- Permit;
- Deny;
- Permit with Conditions;
- Confirmation Required;
- Step-Up Authentication Required;
- Human Review Required;
- or Approval Required.

Sensitive responses may include a safe reason code but not the hidden policy or protected facts.

---

## 34. Consent, Purpose and Resource-State Context

Consent and purpose are evaluated at action and data-use time.

Contracts that use sensitive data identify:

- required Consent scope;
- purpose code;
- resource categories;
- compatible Resource States;
- retention implications;
- provider processing;
- and whether re-Consent or approval is required.

Representative purpose codes include:

- Intervention Delivery;
- Participant Support;
- Life Story Creation;
- Life Story Sharing;
- Community Participation;
- Open Matching;
- Mutual Acceptance Evaluation;
- Connection Management;
- Participant Messaging;
- Moderation;
- Safety;
- Research;
- Data Quality;
- Analysis;
- Reporting;
- External Submission;
- Security;
- Audit;
- and Approved Secondary Research.

When Consent or purpose cannot be verified, the interface fails closed or returns a restricted projection.

---

## 35. Field, Relationship and Existence Protection

Interfaces support:

- field omission;
- masking;
- tokenisation;
- purpose-specific projections;
- restricted expansion;
- protected `404`;
- safe count suppression;
- audience-scoped object delivery;
- and restricted audit views.

Particularly protected data include:

- substitute-authority evidence;
- private Life Story;
- precise location;
- MatchPreferences and MatchDecisions;
- MutualAcceptance source references;
- private Connections and CommunicationBasis details;
- ConversationThreads and Message bodies;
- provider delivery identifiers;
- reporter identity;
- moderation evidence;
- Safety details;
- AI prompt context;
- linkage keys;
- and identifiable analytical data.

A consumer cannot infer protected data through:

- count;
- sorting;
- error timing;
- cursor behaviour;
- relationship expansion;
- autocomplete;
- or event metadata.

---

## 36. Rate Limits, Quotas and Abuse Controls

Rate and quota policies may depend on:

- actor;
- Service Account;
- Organisation;
- endpoint or tool;
- action risk;
- Data Classification;
- Community or matching capability;
- provider quota;
- and operational priority.

Stricter limits apply to:

- authentication and recovery;
- account and Public Profile discovery;
- Community posting;
- Match Candidate generation;
- MatchDecisions;
- deferred ConnectionRequests where enabled;
- ConversationThread creation;
- Message Draft creation and send;
- provider callbacks;
- report submission;
- file upload;
- AI tools;
- bulk export;
- and Webhook registration.

Rate limiting must not prevent urgent Block, Report, Consent withdrawal or Safety Signal submission.

Abuse responses distinguish:

- rate limit;
- account restriction;
- security challenge;
- moderation route;
- and provider throttling.

---

## 37. Bulk and Composite APIs

Bulk operations are limited and explicit.

They must define:

- maximum item count;
- per-item permission and validation;
- atomic or partial semantics;
- idempotency;
- ordering;
- error representation;
- audit;
- and asynchronous threshold.

Bulk APIs must not enable:

- mass people discovery;
- Match Candidate enumeration;
- message spam;
- reporter identification;
- unrestricted Participant export;
- or cross-project data access.

High-volume research extraction uses M12 Dataset workflows rather than generic bulk GET.

Composite read APIs may aggregate already authorised projections but do not create cross-module write transactions.

---

## 38. Core API Resource Catalogue

Representative resources include:

### M01–M03

- user-accounts
- organisations
- organisation-memberships
- role-assignments
- service-accounts
- participant-profiles
- accessibility-profiles
- participant-preferences
- relationships
- delegations
- consents
- policy-decisions

### M04–M09

- research-projects
- research-questions
- protocols
- protocol-versions
- screening-records
- eligibility-decisions
- enrolments
- interventions
- intervention-versions
- intervention-configurations
- intervention-decisions
- intervention-assignments
- intervention-sessions
- exposure-records
- fidelity-records
- assessment-schedules
- assessment-records
- observations
- outcome-records
- safety-signals
- safety-events

### M10–M16

- knowledge-references
- evidence-reviews
- evidence-decisions
- evidence-snapshots
- research-knowledge-gaps
- reference-change-alerts
- ai-conversations
- ai-interactions
- ai-intervention-configurations
- ai-memory-items
- dataset-definitions
- dataset-versions
- data-quality-issues
- transformation-runs
- analysis-plans
- analysis-runs
- interpretation-records
- research-findings
- reports
- report-versions
- export-requests
- evidence-packages
- external-submissions
- approval-records
- governance-reviews
- audit-events
- integrations
- external-system-references
- operations

### M17–M18

- life-story-archives
- life-story-items
- life-story-contributions
- life-story-exports
- legacy-preferences
- public-profiles
- community-spaces
- community-memberships
- social-posts
- comments
- reactions
- match-preferences
- match-candidates
- match-decisions
- mutual-acceptances
- connections
- conversation-threads
- messages
- message-attachments
- message-delivery-attempts
- mute-records
- block-records
- user-reports
- content-reports
- moderation-cases
- moderation-decisions
- appeals

Deferred M18 resources:

- connection-requests

`ConnectionRequest` endpoints are not exposed to first-Pilot clients.


---

## 39. M01 Identity and Organisation APIs

Representative endpoints:

```text
GET    /session-context
GET    /user-accounts/{id}
POST   /user-accounts/{id}/restrict
POST   /user-accounts/{id}/suspend
POST   /user-accounts/{id}/close

POST   /organisations
GET    /organisations/{id}
GET    /organisations/{id}/memberships
POST   /organisations/{id}/memberships
POST   /organisation-memberships/{id}/suspend
POST   /organisation-memberships/{id}/end

GET    /role-assignments
POST   /role-assignments
POST   /role-assignments/{id}/revoke

GET    /service-accounts
POST   /service-accounts
POST   /service-accounts/{id}/rotate-credential
POST   /service-accounts/{id}/disable
```

### 39.1 Session Context

`GET /session-context` returns only server-resolved:

- actor identity;
- Organisation choices;
- active role and scope;
- authentication strength;
- accessible workspaces;
- current high-level restrictions;
- and expiry.

It does not return hidden roles, protected Participant relationships or unrestricted permission claims.

### 39.2 Role Assignment

Role assignment requires:

- assigner authority;
- Organisation and Research Project scope;
- start and expiry;
- approval where required;
- separation-of-duties check;
- and audit.

### 39.3 Account Restriction

Account restriction is an explicit command and may affect Community, matching, messaging, export or privileged actions without deleting historical records.

---

## 40. M02 Participant Profile and Preference APIs

Representative endpoints:

```text
GET    /participant-profiles/{id}
PATCH  /participant-profiles/{id}
GET    /participant-profiles/{id}/accessibility-profile
PATCH  /participant-profiles/{id}/accessibility-profile
GET    /participant-profiles/{id}/preferences
PATCH  /participant-profiles/{id}/preferences
GET    /participant-profiles/{id}/data-sources
POST   /participant-profiles/{id}/request-correction
```

### 40.1 Protected Profile

ParticipantProfile is a protected operational resource.

It is not exposed through public or Community endpoints.

### 40.2 Source Attribution

Profile fields may include:

- value;
- source;
- verification;
- effective time;
- confidence where inferred;
- correction state;
- and permitted purposes.

### 40.3 Accessibility

Accessibility updates record:

- Participant choice;
- assistance;
- source;
- effective time;
- and whether the change affects Measurement equivalence or intervention fidelity.

### 40.4 No General Score

No endpoint exposes a general hidden ability, capacity, frailty, vulnerability or susceptibility score.

### 40.5 Public Profile Separation

PublicProfile is accessed through M18 endpoints and contains only explicitly selected public fields.

---

## 41. M03 Relationship, Consent and Permission APIs

Representative endpoints:

```text
POST   /relationships
GET    /relationships/{id}
POST   /relationships/{id}/approve
POST   /relationships/{id}/suspend
POST   /relationships/{id}/revoke
POST   /relationships/{id}/end

POST   /delegations
GET    /delegations/{id}
POST   /delegations/{id}/revoke

POST   /consents
GET    /consents/{id}
POST   /consents/{id}/restrict
POST   /consents/{id}/withdraw
POST   /consents/{id}/supersede
GET    /participants/{participantId}/consent-summary
POST   /participants/{participantId}/consent-review

POST   /policy-decisions/evaluate
GET    /policy-decisions/{id}
```

### 41.1 Consent Creation

A Consent command includes:

- Consent Form version;
- purpose and scopes;
- decisions and restrictions;
- accessible presentation method;
- assistance and attribution;
- start, expiry and review;
- and authority evidence where applicable.

### 41.2 Effective Consent

A consent summary is:

- purpose-aware;
- resource-aware;
- permission-controlled;
- time-specific;
- and not a reusable bearer token.

### 41.3 Policy Evaluation

`POST /policy-decisions/evaluate` is limited to trusted Platform components.

It accepts contextual facts, not client assertions of authority.

### 41.4 Relationship Boundary

Relationship APIs do not directly create data access.

Permission is evaluated at each requested action.

### 41.5 Connection Boundary

A Connection is not created through Relationship APIs and does not appear as a Supporter relationship.

---

## 42. M04 Research Project and Protocol APIs

Representative endpoints:

```text
POST   /research-projects
GET    /research-projects
GET    /research-projects/{id}
PATCH  /research-projects/{id}
POST   /research-projects/{id}/submit-for-review
POST   /research-projects/{id}/approve
POST   /research-projects/{id}/activate
POST   /research-projects/{id}/suspend
POST   /research-projects/{id}/complete
POST   /research-projects/{id}/archive

POST   /research-questions
GET    /research-questions/{id}
POST   /research-questions/{id}/submit-for-review
POST   /research-questions/{id}/approve
POST   /research-questions/{id}/close

POST   /protocols
GET    /protocols/{id}
POST   /protocols/{id}/versions
GET    /protocol-versions/{id}
POST   /protocol-versions/{id}/submit-for-review
POST   /protocol-versions/{id}/approve
POST   /protocol-versions/{id}/activate
POST   /protocol-versions/{id}/suspend
POST   /protocol-versions/{id}/supersede
POST   /protocol-versions/{id}/archive
```

### 42.1 Lifecycle and Phase

Research Project lifecycle and operational phase use separate fields and commands.

### 42.2 Approved Versions

Approved and Active Protocol Versions are immutable.

Amendment creates a new version.

### 42.3 Required References

A Protocol Version may reference exact:

- Evidence Decisions and Evidence Snapshot;
- Intervention Version and configuration;
- AI configuration;
- Measurement Versions;
- Dataset Definition;
- Safety monitoring;
- Community, matching and moderation rules;
- and approval records.

### 42.4 Approval

Approval commands require exact version, current review state, reviewer authority, conflict-of-interest checks and audit.

---

## 43. M05 Recruitment, Screening and Enrolment APIs

Representative endpoints:

```text
POST   /research-projects/{id}/recruitment-invitations
GET    /recruitment-invitations/{id}
POST   /recruitment-invitations/{id}/send
POST   /recruitment-invitations/{id}/cancel

POST   /screening-records
GET    /screening-records/{id}
POST   /screening-records/{id}/start
POST   /screening-records/{id}/complete

POST   /eligibility-decisions
GET    /eligibility-decisions/{id}

POST   /enrolments
GET    /enrolments/{id}
POST   /enrolments/{id}/activate
POST   /enrolments/{id}/pause
POST   /enrolments/{id}/resume
POST   /enrolments/{id}/complete
POST   /enrolments/{id}/withdraw
POST   /enrolments/{id}/discontinue
```

### 43.1 Eligibility Decision

EligibilityDecision is human-accountable where required and records:

- Protocol Version;
- criteria;
- source facts;
- accessibility or support options;
- decision;
- reason;
- reviewer;
- and time.

### 43.2 No Capacity Inference

The API does not accept a model-generated general capacity score.

### 43.3 Enrolment and Consent

Enrolment creation validates current required Consent but does not replace the Consent aggregate.

### 43.4 Pause versus Withdrawal

Pause, withdrawal and discontinuation are distinct commands and effects.

---

## 44. M06 Intervention Portfolio and Configuration APIs

Representative endpoints:

```text
POST   /interventions
GET    /interventions
GET    /interventions/{id}
POST   /interventions/{id}/versions
GET    /intervention-versions/{id}
POST   /intervention-versions/{id}/submit-for-review
POST   /intervention-versions/{id}/approve
POST   /intervention-versions/{id}/activate
POST   /intervention-versions/{id}/supersede
POST   /intervention-versions/{id}/retire

POST   /intervention-configurations
GET    /intervention-configurations/{id}
POST   /intervention-configurations/{id}/approve

POST   /intervention-decisions
GET    /intervention-decisions/{id}
```

### 44.1 Configuration

An InterventionConfiguration may include exact:

- component;
- dose;
- schedule;
- adaptation range;
- Life Story behaviour;
- Community and visibility rules;
- matching and messaging rules;
- moderation requirements;
- AI configuration;
- and safety safeguards.

### 44.2 Decision Outcomes

InterventionDecision supports:

- Retain;
- Revise;
- Restrict;
- Replicate;
- Expand;
- Suspend;
- Retire;
- and Continue Exploratory Research.

### 44.3 Immutable Approved Versions

An approved InterventionVersion is not patched in place.

---

## 45. M07 Intervention Delivery APIs

Representative endpoints:

```text
POST   /intervention-assignments
GET    /intervention-assignments/{id}
POST   /intervention-assignments/{id}/activate
POST   /intervention-assignments/{id}/pause
POST   /intervention-assignments/{id}/resume
POST   /intervention-assignments/{id}/complete
POST   /intervention-assignments/{id}/discontinue
POST   /intervention-assignments/{id}/cancel

POST   /intervention-sessions
GET    /intervention-sessions/{id}
POST   /intervention-sessions/{id}/start
POST   /intervention-sessions/{id}/complete
POST   /intervention-sessions/{id}/interrupt

POST   /exposure-records
GET    /exposure-records/{id}
POST   /fidelity-records
POST   /intervention-adaptations
POST   /delivery-deviations
```

### 45.1 Assignment

Assignment references exact:

- Participant Enrolment;
- Protocol Version;
- Intervention Version;
- Intervention Configuration;
- AI configuration where applicable;
- arm;
- schedule;
- and assignment method.

### 45.2 Exposure

Exposure state uses:

- Offered;
- Viewed;
- Started;
- Partially Received;
- Completed;
- Skipped;
- Declined;
- Failed;
- or Interrupted.

### 45.3 Assignment Is Not Exposure

An assigned or available component is not automatically viewed, received, completed or beneficial.

### 45.4 Adaptation

Adaptation commands identify:

- source;
- reason;
- allowed rule;
- exact change;
- Participant confirmation where applicable;
- and fidelity impact.

---

## 46. M08 Assessment, Observation and Outcome APIs

Representative endpoints:

```text
POST   /assessment-schedules
GET    /assessment-schedules/{id}
POST   /assessment-schedules/{id}/activate
POST   /assessment-schedules/{id}/cancel

POST   /assessment-records
GET    /assessment-records/{id}
POST   /assessment-records/{id}/start
POST   /assessment-records/{id}/responses
POST   /assessment-records/{id}/complete
POST   /assessment-records/{id}/decline
POST   /assessment-records/{id}/invalidate

POST   /observations
GET    /observations/{id}
POST   /observations/{id}/correct

POST   /outcome-records
GET    /outcome-records/{id}
GET    /participants/{id}/outcome-records
```

### 46.1 Measurement Version

AssessmentRecord references exact:

- Measurement Version;
- scoring algorithm version;
- language;
- administration mode;
- adaptation;
- assistance;
- timepoint;
- and source.

### 46.2 Response Authorship

Assisted responses record who assisted, how, and whose response was captured.

### 46.3 Epistemic Type

Observation contracts distinguish:

- directly observed;
- Participant-reported;
- Supporter-reported;
- Professional Caregiver-reported;
- imported;
- system-recorded;
- device-generated;
- derived;
- AI-inferred;
- and human-interpreted.

### 46.4 Invalidation

Invalidation preserves the original record, reason, reviewer and replacement reference.

### 46.5 Social Activity Boundary

Posts, messages, Connections and AI conversations do not automatically create OutcomeRecords.

---

## 47. M09 Safety and Escalation APIs

Representative endpoints:

```text
POST   /safety-signals
GET    /safety-signals/{id}
POST   /safety-signals/{id}/begin-triage
POST   /safety-signals/{id}/escalate
POST   /safety-signals/{id}/close-as-not-event
POST   /safety-signals/{id}/convert-to-safety-event

GET    /safety-events/{id}
POST   /safety-events/{id}/begin-review
POST   /safety-events/{id}/record-action
POST   /safety-events/{id}/begin-monitoring
POST   /safety-events/{id}/resolve
POST   /safety-events/{id}/close
POST   /safety-events/{id}/reopen
```

### 47.1 Signal versus Event

A Safety Signal is a potential concern.

A Safety Event exists only after authorised human confirmation.

### 47.2 Automated Creation

Rules, devices, moderation and AI may request or create a Safety Signal according to policy.

They cannot call a command that silently confirms a Safety Event.

### 47.3 Restricted Access

Safety endpoints use:

- stronger role and purpose checks;
- field and existence protection;
- minimum-necessary projections;
- and enhanced audit.

### 47.4 Stopping Rule

Stopping-rule commands identify exact authority, scope, reason and affected assignment, intervention or Research Project.

### 47.5 Deprecated Event

`SafetyEventDetected` is prohibited.

The canonical detection result is `SafetySignalRecorded`.

---

## 48. M10 Evidence and Knowledge Integration APIs

Representative endpoints:

```text
POST   /evidence-searches
GET    /evidence-searches/{id}

POST   /knowledge-references
GET    /knowledge-references/{id}
POST   /knowledge-references/{id}/refresh

POST   /evidence-reviews
GET    /evidence-reviews/{id}
POST   /evidence-reviews/{id}/submit-for-review
POST   /evidence-reviews/{id}/complete

POST   /evidence-decisions
GET    /evidence-decisions/{id}
POST   /evidence-decisions/{id}/submit-for-review
POST   /evidence-decisions/{id}/approve
POST   /evidence-decisions/{id}/supersede

POST   /evidence-snapshots
GET    /evidence-snapshots/{id}

POST   /research-knowledge-gaps
GET    /research-knowledge-gaps/{id}
POST   /research-knowledge-gaps/{id}/submit-for-review
POST   /research-knowledge-gaps/{id}/approve
POST   /research-knowledge-gaps/{id}/close

GET    /reference-change-alerts
POST   /reference-change-alerts/{id}/acknowledge
POST   /reference-change-alerts/{id}/resolve
```

### 48.1 External Authority

Knowledge Platform resources are exposed through M10 references and normalised responses.

### 48.2 Snapshot

EvidenceSnapshot is immutable and preserves the exact external evidence state used at a milestone.

### 48.3 Reference Change

Reference refresh may create ReferenceChangeAlert but cannot silently mutate approved Protocol, intervention, AI, Dataset or Finding records.

### 48.4 Search Result Completeness

Evidence search identifies:

- Complete;
- Partial;
- Truncated;
- Capability Limited;
- Source Unavailable;
- or Retrieval Failed.

### 48.5 Licensing

Responses identify quotation, storage, embedding and export restrictions.

---

## 49. M11 AI Companion APIs

Representative endpoints:

```text
POST   /ai-conversations
GET    /ai-conversations/{id}
POST   /ai-conversations/{id}/close

POST   /ai-interactions
GET    /ai-interactions/{id}
GET    /ai-interactions/{id}/context-record
GET    /ai-interactions/{id}/retrieval-records
GET    /ai-interactions/{id}/tool-invocations
POST   /ai-interactions/{id}/confirm-action
POST   /ai-interactions/{id}/request-review
POST   /ai-interactions/{id}/report-problem

POST   /ai-intervention-configurations
GET    /ai-intervention-configurations/{id}
POST   /ai-intervention-configurations/{id}/versions
POST   /ai-intervention-configuration-versions/{id}/approve
POST   /ai-intervention-configuration-versions/{id}/activate
POST   /ai-intervention-configuration-versions/{id}/suspend

GET    /ai-memory-items
POST   /ai-memory-items
PATCH  /ai-memory-items/{id}
POST   /ai-memory-items/{id}/revoke
DELETE /ai-memory-items/{id}
```

### 49.1 Interaction Request

An AIInteraction request identifies:

- AI mode;
- approved task;
- purpose;
- target resource;
- optional user content;
- requested capability;
- and client trace.

The server resolves permission and context.

### 49.2 Context Record

Sensitive context is represented through protected references and classification metadata.

The endpoint may omit full prompt content.

### 49.3 Action Confirmation

AI action confirmation binds:

- actor;
- interaction;
- exact proposed action;
- target resource and version;
- expiry;
- and confirmation challenge.

### 49.4 Memory

AIMemoryItem creation requires an approved purpose and may require Participant confirmation.

### 49.5 Prohibited Authority

AI APIs cannot:

- approve research records;
- publish without confirmation;
- accept a Match Candidate;
- create a Connection;
- send an unauthorised message;
- impose high-impact moderation;
- confirm a Safety Event;
- or lock a Dataset Version.

---

## 50. M12 Dataset and Data Quality APIs

Representative endpoints:

```text
POST   /dataset-definitions
GET    /dataset-definitions/{id}
POST   /dataset-definitions/{id}/submit-for-review
POST   /dataset-definitions/{id}/approve
POST   /dataset-definitions/{id}/supersede

POST   /dataset-definitions/{id}/generate-version
GET    /dataset-versions/{id}
GET    /dataset-versions/{id}/manifest
GET    /dataset-versions/{id}/variable-dictionary
GET    /dataset-versions/{id}/lineage
POST   /dataset-versions/{id}/begin-quality-review
POST   /dataset-versions/{id}/complete-quality-review
POST   /dataset-versions/{id}/lock
POST   /dataset-versions/{id}/archive

POST   /data-quality-issues
GET    /data-quality-issues/{id}
POST   /data-quality-issues/{id}/assign
POST   /data-quality-issues/{id}/resolve
POST   /data-quality-issues/{id}/accept-with-limitation

POST   /transformation-runs
GET    /transformation-runs/{id}
```

### 50.1 Generation

Dataset generation returns an Operation.

### 50.2 Lock

Dataset Lock requires:

- approved Dataset Definition;
- complete lineage;
- quality review;
- current purpose and authority;
- Consent or approved basis;
- visibility and third-party review;
- de-identification;
- manifest;
- checksum;
- and compatible Analysis Plan.

### 50.3 Immutable Lock

A locked DatasetVersion is immutable.

Correction creates a new DatasetVersion.

### 50.4 AI Boundary

AI may assist quality review but cannot call the final lock command as an autonomous authority.

### 50.5 Sensitive Sources

Life Story, Community, matching, message, moderation and safety data require explicit source and permission rules in DatasetDefinition.

---

## 51. M13 Analysis, Interpretation and Finding APIs

Representative endpoints:

```text
POST   /analysis-plans
GET    /analysis-plans/{id}
POST   /analysis-plans/{id}/submit-for-review
POST   /analysis-plans/{id}/approve
POST   /analysis-plans/{id}/supersede
POST   /analysis-plans/{id}/archive

POST   /analysis-runs
GET    /analysis-runs/{id}
POST   /analysis-runs/{id}/start
POST   /analysis-runs/{id}/cancel
GET    /analysis-runs/{id}/outputs
GET    /analysis-runs/{id}/diagnostics

POST   /interpretation-records
GET    /interpretation-records/{id}
POST   /interpretation-records/{id}/submit-for-review
POST   /interpretation-records/{id}/approve
POST   /interpretation-records/{id}/supersede

POST   /research-findings
GET    /research-findings/{id}
POST   /research-findings/{id}/submit-for-review
POST   /research-findings/{id}/approve
POST   /research-findings/{id}/approve-with-limitations
POST   /research-findings/{id}/reject
POST   /research-findings/{id}/supersede
POST   /research-findings/{id}/withdraw
POST   /research-findings/{id}/archive
```

### 51.1 Analysis Run

An AnalysisRun references exact:

- approved AnalysisPlan;
- locked DatasetVersion;
- code;
- environment;
- parameters;
- seed where relevant;
- and executor.

### 51.2 Analysis Output

AnalysisOutput is an entity or protected artefact reference.

It is not an InterpretationRecord or ResearchFinding.

### 51.3 Interpretation Approval

AI may draft interpretation but cannot approve it.

### 51.4 Finding State

External submission and publication states do not appear as ResearchFinding state.

### 51.5 Reproducibility

Run and output endpoints expose checksum, software, code and lineage references according to permission.

---

## 52. M14 Reporting, Export and External Submission APIs

Representative endpoints:

```text
POST   /reports
GET    /reports/{id}
POST   /reports/{id}/versions
GET    /report-versions/{id}
POST   /report-versions/{id}/submit-for-review
POST   /report-versions/{id}/approve

POST   /export-requests
GET    /export-requests/{id}
POST   /export-requests/{id}/validate
POST   /export-requests/{id}/approve
POST   /export-requests/{id}/generate
POST   /export-requests/{id}/revoke
GET    /export-requests/{id}/manifest

POST   /evidence-packages
GET    /evidence-packages/{id}
POST   /evidence-packages/{id}/submit-for-review
POST   /evidence-packages/{id}/approve

POST   /external-submissions
GET    /external-submissions/{id}
POST   /external-submissions/{id}/submit
POST   /external-submissions/{id}/record-response
POST   /external-submissions/{id}/withdraw
```

### 52.1 Export

Export requires:

- actor and role;
- purpose;
- recipient;
- source and versions;
- permission and Consent;
- Data Classification;
- de-identification;
- third-party and reporter protection;
- restrictions;
- and approval.

### 52.2 Delivery

Generated, delivered and received are separate states.

### 52.3 Participant Export

Participant portability does not create research or redistribution permission.

### 52.4 External Submission

External acceptance, revision or rejection does not silently change ResearchFinding state.

---

## 53. M15 Governance and Audit APIs

Representative endpoints:

```text
POST   /approval-records
GET    /approval-records/{id}
POST   /approval-records/{id}/approve
POST   /approval-records/{id}/approve-with-conditions
POST   /approval-records/{id}/reject
POST   /approval-records/{id}/withdraw

POST   /governance-reviews
GET    /governance-reviews/{id}
POST   /governance-reviews/{id}/assign
POST   /governance-reviews/{id}/complete

POST   /conflict-of-interest-records
GET    /conflict-of-interest-records/{id}

GET    /audit-events
GET    /audit-events/{id}
GET    /resources/{resourceType}/{resourceId}/audit
```

### 53.1 Exact Artefact

ApprovalRecord references exact artefact type, ID and version.

### 53.2 Separation of Duties

Approval endpoints enforce:

- reviewer role;
- independence;
- conflict-of-interest;
- and required authentication strength.

### 53.3 Audit API

Audit queries are highly permission-scoped and use field redaction.

They do not return full sensitive payloads by default.

### 53.4 No Generic Approval

An approval record cannot approve multiple unrelated artefacts through one unbounded target.

---

## 54. M16 Integration and Operation APIs

Representative endpoints:

```text
GET    /integrations
POST   /integrations
GET    /integrations/{id}
POST   /integrations/{id}/activate
POST   /integrations/{id}/suspend
POST   /integrations/{id}/rotate-credential
POST   /integrations/{id}/test
POST   /integrations/{id}/reconcile

GET    /external-system-references/{id}
POST   /identifier-mappings
GET    /identifier-mappings/{id}
POST   /identifier-mappings/{id}/resolve
POST   /identifier-mappings/{id}/supersede

GET    /operations/{id}
POST   /operations/{id}/cancel
POST   /operations/{id}/retry
```

### 54.1 Integration Registry

An Integration resource identifies:

- owner;
- purpose;
- capability;
- data scope;
- authentication;
- provider terms;
- location;
- retention;
- schema;
- availability;
- incident contact;
- and exit plan.

### 54.2 Test Command

A test command uses non-production or minimum-necessary data and does not silently activate the integration.

### 54.3 Reconciliation

Reconciliation returns an Operation and produces mismatch records rather than silently repairing authoritative data.

---

## 55. M17 Life Story and Personal Archive APIs

Representative endpoints:

```text
GET    /life-story-archives/{id}
POST   /life-story-archives/{id}/items
GET    /life-story-items/{id}
PATCH  /life-story-items/{id}
POST   /life-story-items/{id}/confirm
POST   /life-story-items/{id}/change-visibility
POST   /life-story-items/{id}/share
POST   /life-story-items/{id}/withdraw-sharing
POST   /life-story-items/{id}/request-correction
POST   /life-story-items/{id}/archive
DELETE /life-story-items/{id}

POST   /life-story-items/{id}/contributions
GET    /life-story-contributions/{id}
POST   /life-story-contributions/{id}/accept
POST   /life-story-contributions/{id}/revise
POST   /life-story-contributions/{id}/reject
POST   /life-story-contributions/{id}/withdraw

POST   /life-story-exports
GET    /life-story-exports/{id}

GET    /legacy-preferences/{id}
POST   /legacy-preferences
POST   /legacy-preferences/{id}/supersede
POST   /legacy-preferences/{id}/revoke
```

### 55.1 Draft and Testimony

A LifeStoryItem distinguishes:

- Participant Draft;
- AI Draft;
- Supporter contribution;
- Participant-confirmed content;
- and Participant Testimony.

### 55.2 Confirmation

AI wording, inferred people, dates, places and themes remain proposed until confirmed.

### 55.3 Visibility

Visibility changes are explicit commands.

Private, Selected People, Connections, Community, Platform Public and Internet Public are separate values.

### 55.4 Internet Public

Internet Public requires a separately approved publication flow and is disabled by default in the MVP.

### 55.5 Contribution

Accepting a contribution records Participant review and attribution.

The contributor does not gain ownership.

### 55.6 Third-Party Rights

Share, public and export commands evaluate third-party restrictions and takedown state.

### 55.7 Legacy

LegacyPreference requires strong authority and cannot be changed through AI or ordinary Supporter access.

---

## 56. M18 PublicProfile, Community and Social APIs

Representative endpoints:

```text
GET    /public-profiles/{id}
PATCH  /public-profiles/{id}
POST   /public-profiles/{id}/publish
POST   /public-profiles/{id}/unpublish
POST   /public-profiles/{id}/change-visibility

GET    /community-spaces
POST   /community-spaces
GET    /community-spaces/{id}
POST   /community-spaces/{id}/join
POST   /community-spaces/{id}/leave
GET    /community-spaces/{id}/rules
GET    /community-spaces/{id}/feed

POST   /social-posts
GET    /social-posts/{id}
PATCH  /social-posts/{id}
POST   /social-posts/{id}/publish
POST   /social-posts/{id}/change-visibility
POST   /social-posts/{id}/withdraw
DELETE /social-posts/{id}

POST   /social-posts/{id}/comments
GET    /comments/{id}
PATCH  /comments/{id}
POST   /comments/{id}/withdraw

POST   /reactions
DELETE /reactions/{id}
```

### 56.1 PublicProfile

PublicProfile is separate from ParticipantProfile and contains only explicitly selected fields.

A PublicProfile response identifies:

- exact Visibility;
- permitted audience;
- current publication state;
- current resource version;
- Community or matching contexts where permitted;
- and available actions.

Protected ParticipantProfile fields are not available through expansion.

### 56.2 CommunityMembership

Join and leave commands apply:

- current eligibility;
- CommunityRuleVersion;
- Consent where required;
- account and ResourceState;
- Block restrictions;
- rate and abuse rules;
- and audit.

Joining a CommunitySpace does not activate Open Matching or create a CommunicationBasis for unrestricted private messaging.

### 56.3 SocialPost Publication

Social content publication requires:

- author authority;
- exact Draft version;
- audience and Visibility;
- current CommunityRuleVersion;
- current ResourceState;
- explicit confirmation where required;
- Block and restriction checks;
- and audit.

A Draft response never uses the `Published` lifecycle state.

### 56.4 Feed Query

Feed responses may include:

- ranking policy version;
- reason category;
- freshness;
- result completeness;
- moderation state;
- and current Visibility.

They must not disclose hidden sensitive features, blocked actors, protected existence or private matching data.

### 56.5 Social Proof

No API permits creation of fake users, reactions, comments, endorsements or system-generated social proof.

### 56.6 Platform Public

Platform Public content is accessible only through authenticated, eligible and policy-permitted Platform interfaces.

Internet Public uses a separate contract family and is disabled by default for the first Pilot.

---

## 57. M18 Open Matching, MutualAcceptance and Connection APIs

Representative first-Pilot endpoints:

```text
GET    /match-preferences/{id}
POST   /match-preferences
PATCH  /match-preferences/{id}
POST   /match-preferences/{id}/activate
POST   /match-preferences/{id}/pause
POST   /match-preferences/{id}/expire

POST   /match-candidate-generations
GET    /match-candidate-generations/{operationId}
GET    /match-candidates
GET    /match-candidates/{id}
GET    /match-candidates/{id}/explanation
POST   /match-candidates/{id}/decisions
GET    /match-decisions/{id}

GET    /mutual-acceptances/{id}
POST   /mutual-acceptances/{id}/activate-connection

GET    /connections
GET    /connections/{id}
POST   /connections/{id}/pause
POST   /connections/{id}/resume
POST   /connections/{id}/disconnect
```

Deferred alternative-basis endpoints:

```text
POST   /connection-requests
GET    /connection-requests/{id}
POST   /connection-requests/{id}/accept
POST   /connection-requests/{id}/decline
POST   /connection-requests/{id}/cancel
```

These deferred endpoints return `CONNECTION_REQUEST_FEATURE_DISABLED` in the first Pilot and are omitted from first-Pilot client SDKs.

### 57.1 Matching Is Opt-In

MatchPreference must be Active before candidate generation.

Activation requires:

- current matching Consent;
- approved purpose;
- exact preference version;
- allowed attributes;
- location granularity;
- expiry;
- and confirmation.

### 57.2 Candidate Generation

Candidate generation is represented as an Operation and applies:

- current MatchPreference version;
- current purpose;
- allowed attribute registry;
- eligibility;
- exclusions;
- BlockRecord;
- Community or Organisation scope;
- policy version;
- candidate limit;
- expiry;
- fairness and accessibility rules;
- and rate limits.

No candidate is fabricated when the worker or policy dependency is unavailable.

### 57.3 MatchCandidate Response

A MatchCandidate response exposes only a safe projection.

It may include:

- candidate ID;
- expiry;
- approved public identity projection;
- MatchExplanation reference;
- permitted declared reason categories;
- current decision availability;
- and available actions.

It does not expose:

- the other Participant's protected identifier;
- protected Profile data;
- private Life Story;
- Message content;
- Safety or moderation records;
- hidden sensitive traits;
- or an objective compatibility score.

### 57.4 MatchDecision Command

`POST /match-candidates/{id}/decisions` records one decision for the authenticated deciding actor and exact MatchCandidate version.

A representative request is:

```json
{
  "decision": "Interested",
  "expectedCandidateVersion": 3,
  "confirmation": {
    "challengeId": "cfm_..."
  }
}
```

The server:

1. verifies candidate ownership and expiry;
2. verifies current matching Consent and purpose;
3. verifies no Block;
4. records only the current actor's decision;
5. publishes `MatchDecisionRecorded`;
6. evaluates compatible canonical source records;
7. and may create `MutualAcceptance`.

The response must not disclose the other actor's private decision before policy permits.

### 57.5 MutualAcceptance Resource

Clients cannot create MutualAcceptance by submitting actor IDs or decision claims.

M18 creates it only from:

- two compatible current independent MatchDecisions; or
- one accepted ConnectionRequest under a separately approved future policy.

A MutualAcceptance response may include:

- ID;
- actor-safe pair projection;
- basis type;
- purpose;
- policy version;
- effective time;
- expiry;
- lifecycle and validity state;
- Connection usage;
- and available actions.

Source MatchDecision or ConnectionRequest details are disclosed only when authorised.

### 57.6 MutualAcceptance Invalidation

Unused MutualAcceptance may become Expired or Invalidated when:

- source decision expires or is superseded;
- Consent is withdrawn or restricted;
- eligibility changes;
- a Block is created;
- account or ResourceState changes;
- matching policy changes materially;
- or a required Safety restriction applies.

Invalidation is a domain command and event, not silent deletion.

### 57.7 Connection Activation

`POST /mutual-acceptances/{id}/activate-connection` is idempotent and requires:

- one current, valid and unused MutualAcceptance;
- exact expected version;
- same actor pair and purpose;
- current Consent and eligibility;
- no applicable Block;
- permitted Connection scope;
- and any configured Participant acknowledgement.

A successful command returns the Connection and identifies the consumed or linked MutualAcceptance.

A client cannot create an arbitrary Connection with `POST /connections`.

### 57.8 Connection Boundary

Connection does not create:

- Supporter Relationship;
- care authority;
- Consent;
- research permission;
- private Life Story access;
- or unrestricted messaging.

Messaging additionally requires a current CommunicationBasis.

### 57.9 Deferred ConnectionRequest

ConnectionRequest:

- is not Open Matching;
- is feature-disabled for the first Pilot;
- requires an approved discovery or invitation basis when enabled;
- requires explicit recipient acceptance;
- and produces MutualAcceptance rather than Connection directly.

---

## 58. M18 ConversationThread, Message, Block, Report and Moderation APIs

Representative ConversationThread and Message endpoints:

```text
POST   /conversation-threads
GET    /conversation-threads/{id}
POST   /conversation-threads/{id}/pause
POST   /conversation-threads/{id}/close
GET    /conversation-threads/{id}/messages

POST   /conversation-threads/{id}/messages
GET    /messages/{id}
PATCH  /messages/{id}
POST   /messages/{id}/attachments
DELETE /messages/{id}/attachments/{attachmentId}
POST   /messages/{id}/confirm-send
POST   /messages/{id}/cancel-delivery
POST   /messages/{id}/withdraw
GET    /messages/{id}/delivery-attempts
```

Representative safety and moderation endpoints:

```text
POST   /mute-records
DELETE /mute-records/{id}

POST   /block-records
GET    /block-records/{id}
POST   /block-records/{id}/revoke

POST   /connections/{id}/disconnect

POST   /user-reports
POST   /content-reports
GET    /reports-submitted-by-me/{id}

GET    /moderation-cases
GET    /moderation-cases/{id}
POST   /moderation-cases/{id}/assign
POST   /moderation-cases/{id}/record-decision
POST   /moderation-cases/{id}/record-action
POST   /moderation-cases/{id}/link-safety-signal
POST   /moderation-cases/{id}/close

POST   /moderation-cases/{id}/appeals
GET    /appeals/{id}
POST   /appeals/{id}/assign
POST   /appeals/{id}/decide
POST   /appeals/{id}/restore
```

Provider callback endpoints are internal M16 adapter contracts and are not Participant APIs.

### 58.1 ConversationThread Creation

`POST /conversation-threads` requires:

- exact participant set;
- one approved CommunicationBasis type and reference;
- purpose;
- current Consent and permission;
- current actor and recipient eligibility;
- no applicable Block;
- supported communication mode;
- retention policy;
- and Idempotency-Key.

Representative bases include:

- Active Connection;
- authorised Relationship;
- approved InterventionSession;
- approved moderated Community context;
- or another explicitly governed basis.

A MatchCandidate, unilateral MatchDecision, SocialPost interaction or expired MutualAcceptance is not a CommunicationBasis.

### 58.2 ConversationThread Boundary

ConversationThread:

- does not create Connection;
- does not expand Relationship, Consent or purpose;
- cannot silently add another participant;
- and becomes unusable when its CommunicationBasis is no longer effective.

A Thread response exposes only the authorised participant projection and minimum necessary basis summary.

### 58.3 Message Draft Creation

`POST /conversation-threads/{id}/messages` creates a Message in Draft state.

A representative request is:

```json
{
  "content": {
    "format": "text/plain",
    "text": "Hello..."
  },
  "recipientIds": ["actor_..."],
  "clientDraftId": "draft_..."
}
```

Draft creation requires current Thread access but does not perform delivery.

`PATCH /messages/{id}` is allowed only while the Message remains Draft and requires `If-Match`.

### 58.4 Attachment Contract

An attachment is not sendable until:

- upload is complete;
- type and size are valid;
- malware scan succeeds;
- ownership and purpose are valid;
- storage and retention policy are assigned;
- and current Block and recipient policy permit it.

A quarantined or pending attachment returns `ATTACHMENT_NOT_READY`.

### 58.5 SendConfirmation

`POST /messages/{id}/confirm-send` requires:

- authenticated sender;
- exact Draft resource version;
- exact recipient set;
- current ConversationThread;
- current CommunicationBasis;
- current Consent and purpose;
- no applicable Block;
- valid recipient state;
- approved attachments;
- rate and abuse checks;
- confirmation challenge where configured;
- and Idempotency-Key.

Representative request:

```json
{
  "expectedMessageVersion": 5,
  "recipientIds": ["actor_..."],
  "confirmation": {
    "challengeId": "cfm_..."
  }
}
```

The command records `MessageSendConfirmed` and queues delivery atomically or returns an accurate pending Operation.

AI, the provider, recipient or helper cannot supply sender authority.

### 58.6 Message Lifecycle and Delivery State

Message lifecycle and delivery are independent.

Representative lifecycle states:

- Draft;
- Confirmed for Send;
- Queued;
- Sending;
- Sent;
- Withdrawn;
- Cancelled;
- Expired;
- Archived.

Representative delivery states:

- Not Submitted;
- Queued;
- Sent to Provider or Transport;
- Provider Accepted;
- Delivered;
- Read where explicitly supported;
- Delivery Failed;
- Delivery Unknown;
- Cancelled;
- Expired.

`Sent`, `Provider Accepted`, `Delivered` and `Read` are not interchangeable.

### 58.7 Provider Callback Contract

A communication-provider callback:

- terminates at an authenticated M16 adapter;
- validates signature, timestamp and replay protection;
- maps provider reference to one canonical Message and DeliveryAttempt;
- validates allowed state transition;
- is idempotent;
- records raw provider status in restricted integration records;
- and invokes an M18 delivery-state command.

A callback cannot:

- create sender authority;
- change Message content;
- add recipients;
- create a ConversationThread;
- or bypass Block and current Platform policy.

### 58.8 Retry, Cancellation and Withdrawal

Retry preserves one logical Message and creates another DeliveryAttempt unless the sender explicitly creates a new Message.

Cancellation is attempted only before irreversible provider delivery where supported.

Withdrawal is a governed lifecycle action and does not falsely claim recall from an external recipient.

### 58.9 Message Privacy

Message body is excluded by default from:

- general Search;
- general Vector retrieval;
- MatchCandidate generation;
- Community ranking;
- AIMemoryItem;
- broad logs and events;
- and ordinary research analysis.

Message-content analysis requires explicit Consent, purpose, DatasetDefinition, minimisation and approval.

### 58.10 Block

`BlockRecord` is the authoritative M18 enforcement aggregate.

Block creation is idempotent and must synchronously prevent or fail closed for:

- discovery;
- MatchCandidate delivery;
- MutualAcceptance creation;
- Connection activation;
- ConversationThread creation;
- Message SendConfirmation;
- and new notification creation.

It also triggers immediate projection, Search, Vector, AI Context, pending-job and provider-delivery cancellation or suppression where technically possible.

External-delivery limitations remain visible and auditable.

### 58.11 Revoke Block

Block revocation:

- does not restore MatchPreference;
- does not reactivate MutualAcceptance;
- does not recreate Connection;
- does not reopen ConversationThread;
- and does not resend Message.

Each restoration requires its own valid domain path.

### 58.12 Report

Report remains available after Block or Disconnect where policy permits.

Reporter-facing responses may include:

- acknowledgement;
- safe case state;
- available next action;
- and high-level outcome where policy permits.

They do not expose reporter identity to another actor, confidential evidence or internal moderation reasoning.

### 58.13 ModerationDecision

High-impact ModerationDecision requires:

- authorised human reviewer;
- exact CommunityRuleVersion;
- permitted evidence;
- reason;
- proportionality;
- duration;
- appeal;
- and audit.

Provider or AI classification remains provisional.

### 58.14 Safety Link

A ModerationCase may create or link a SafetySignal through an M09 command.

It does not directly create or confirm a SafetyEvent.

---

## 59. Event Architecture Principles

1. Domain Events represent completed facts owned by one aggregate.
2. Integration Events are deliberate stable contracts derived from Domain Events or governed workflows.
3. UX Analytics Events record minimum-necessary interaction facts and do not prove domain success.
4. Operational Events describe runtime state and do not redefine domain state.
5. Audit Events preserve accountable access, action and decision evidence.
6. Events use canonical past-tense names.
7. Owning modules publish events for their aggregates.
8. Domain Events remain internal unless deliberately promoted or translated.
9. Integration Events use minimum-necessary stable contracts.
10. Events preserve aggregate ID, aggregate version and exact event schema version.
11. Sensitive payloads use references or safe projections rather than full content.
12. Delivery is at least once unless a specific contract states otherwise.
13. Consumers are idempotent.
14. Ordering is explicit where required.
15. Publication is atomic with state persistence where material.
16. Replay is governed and auditable.
17. Event possession does not grant current resource access.
18. Events never replace human approval, current permission evaluation or authoritative queries.
19. Deprecated events are translated explicitly and are not repurposed with new meaning.
20. A UX confirmation, provider callback or model response is not automatically the canonical Domain Event.

---

## 60. Event Envelope

A representative Domain Event envelope is:

```json
{
  "eventId": "evt_...",
  "eventCategory": "DomainEvent",
  "eventType": "MessageSendConfirmed",
  "eventSchemaVersion": "1.0",
  "occurredAt": "2026-07-29T11:00:00Z",
  "recordedAt": "2026-07-29T11:00:01Z",
  "source": {
    "system": "research-platform",
    "module": "M18"
  },
  "aggregate": {
    "type": "Message",
    "id": "msg_...",
    "version": 5
  },
  "actor": {
    "type": "Participant",
    "id": "pt_..."
  },
  "context": {
    "organisationId": "org_...",
    "researchProjectId": "rp_...",
    "purposeCode": "ParticipantMessaging"
  },
  "classification": "SensitivePersonalData",
  "correlationId": "corr_...",
  "causationId": "cmd_...",
  "traceId": "trace_...",
  "payload": {
    "conversationThreadId": "ct_...",
    "recipientCount": 1,
    "contentIncluded": false
  }
}
```

### 60.1 Required Fields

Required fields include:

- event ID;
- event category;
- event type;
- schema version;
- occurred and recorded time;
- source module;
- aggregate type, ID and version where applicable;
- purpose;
- correlation, causation and trace;
- Data Classification;
- and minimum payload.

### 60.2 Actor

Actor may be omitted or pseudonymised from broad Integration Events where privacy requires it, while remaining available in protected audit.

### 60.3 Payload

Payload includes only fields required by known consumers.

Life Story text, Message body, reporter identity, moderation evidence, precise location and detailed Safety information are excluded from general event payloads.

### 60.4 References

Consumers retrieve additional detail through current authorised APIs.

An event reference is not a bearer permission.

### 60.5 Integrity

Externally delivered events may include:

- signature;
- key ID;
- timestamp;
- delivery ID;
- replay-protection metadata;
- and content hash.

### 60.6 Integration Event Envelope

An Integration Event additionally identifies:

- integration contract name;
- contract version;
- intended audience or consumer class;
- retention class;
- and source Domain Event references where permitted.

### 60.7 UX Analytics Envelope

A UX Analytics Event identifies:

- interaction name;
- screen or component;
- actor-safe context;
- client version;
- correlation to a command where applicable;
- and whether the owning-domain action later succeeded, failed or remained unknown.

It must not use the name of a completed Domain Event when only an interaction occurred.

---

## 61. Event Categories

### 61.1 Domain Events

Internal events expressing a completed canonical domain fact owned by one aggregate.

Examples:

- `MatchDecisionRecorded`;
- `MutualAcceptanceRecorded`;
- `MessageSendConfirmed`;
- `MessageDelivered`;
- and `DatasetVersionLocked`.

### 61.2 Integration Events

Stable contracts intentionally exposed to another module, process or external system.

An Integration Event may use a different name or projection from its source Domain Event.

### 61.3 UX Analytics Events

Minimum-necessary interaction events such as:

- `MatchExplanationViewed`;
- `MessageSendConfirmationViewed`;
- `DatasetLockConfirmationSubmitted`;
- and `WithdrawalFlowStarted`.

A UX Analytics Event does not establish that the domain command succeeded.

### 61.4 Operational Events

Technical runtime events such as:

- job failure;
- provider outage;
- queue delay;
- index lag;
- callback-authentication failure;
- or Block-propagation delay.

### 61.5 Audit Events

Governance records of:

- access;
- action;
- decision;
- exceptional authority;
- security event;
- or protected data disclosure.

### 61.6 Notification Triggers

Purpose-specific signals used to create Notifications.

A Notification trigger is not automatically an Integration Event or a Message.

### 61.7 Analytical Events

Purpose-specific process or exposure events collected through governed M12 rules.

They are not automatically Healthy Aging outcomes and must not include private Message or Life Story content by default.

---

## 62. Domain Event Catalogue — M01 to M06


### M01 Identity and Organisation

- UserAccountCreated
- UserAccountActivated
- UserAccountRestricted
- UserAccountSuspended
- UserAccountClosed
- OrganisationCreated
- OrganisationMembershipAdded
- OrganisationMembershipSuspended
- OrganisationMembershipEnded
- RoleAssigned
- RoleRevoked
- ServiceAccountCreated
- ServiceAccountDisabled

### M02 Participant Profile and Preferences

- ParticipantProfileCreated
- ParticipantProfileUpdated
- AccessibilityProfileUpdated
- ParticipantPreferenceUpdated
- ParticipantProfileCorrectionRequested
- ParticipantProfileCorrectionRecorded

### M03 Relationship, Consent and Permission

- RelationshipProposed
- RelationshipApproved
- RelationshipSuspended
- RelationshipRevoked
- RelationshipEnded
- DelegationCreated
- DelegationRevoked
- ConsentRecorded
- ConsentRestricted
- ConsentExpired
- ConsentWithdrawn
- ConsentSuperseded
- PolicyDecisionRecorded

### M04 Research Project and Protocol

- ResearchProjectCreated
- ResearchProjectSubmittedForReview
- ResearchProjectApproved
- ResearchProjectActivated
- ResearchProjectSuspended
- ResearchProjectCompleted
- ResearchProjectArchived
- ResearchQuestionCreated
- ResearchQuestionSubmittedForReview
- ResearchQuestionApproved
- ResearchQuestionClosed
- ProtocolCreated
- ProtocolVersionDrafted
- ProtocolVersionSubmittedForReview
- ProtocolVersionApproved
- ProtocolVersionActivated
- ProtocolVersionSuspended
- ProtocolVersionSuperseded
- ProtocolVersionArchived

### M05 Recruitment, Screening and Enrolment

- RecruitmentInvitationCreated
- RecruitmentInvitationSent
- RecruitmentInvitationCancelled
- ScreeningStarted
- ScreeningCompleted
- EligibilityDecisionRecorded
- ParticipantEnrolled
- EnrolmentActivated
- EnrolmentPaused
- EnrolmentResumed
- EnrolmentCompleted
- ParticipantWithdrawn
- EnrolmentDiscontinued

### M06 Intervention Portfolio and Configuration

- InterventionCreated
- InterventionVersionDrafted
- InterventionVersionSubmittedForReview
- InterventionVersionApproved
- InterventionVersionActivated
- InterventionVersionSuperseded
- InterventionVersionRetired
- InterventionConfigurationCreated
- InterventionConfigurationApproved
- InterventionDecisionRecorded

---

## 63. Domain Event Catalogue — M07 to M12

### M07 Intervention Delivery

- InterventionAssigned
- InterventionAssignmentActivated
- InterventionAssignmentPaused
- InterventionAssignmentResumed
- InterventionAssignmentCompleted
- InterventionAssignmentDiscontinued
- InterventionAssignmentCancelled
- InterventionSessionCreated
- InterventionSessionStarted
- InterventionSessionCompleted
- InterventionSessionInterrupted
- InterventionComponentOffered
- InterventionComponentViewed
- InterventionComponentStarted
- InterventionComponentPartiallyReceived
- InterventionComponentCompleted
- InterventionComponentSkipped
- InterventionComponentDeclined
- InterventionComponentFailed
- InterventionComponentInterrupted
- InterventionExposureRecorded
- FidelityRecorded
- InterventionAdaptationRecorded
- DeliveryDeviationRecorded

### M08 Assessment, Observation and Outcome

- AssessmentScheduled
- AssessmentScheduleActivated
- AssessmentStarted
- AssessmentResponseRecorded
- AssessmentCompleted
- AssessmentPartiallyCompleted
- AssessmentDeclined
- AssessmentExpired
- AssessmentInvalidated
- ObservationRecorded
- ObservationCorrected
- OutcomeRecorded

### M09 Safety and Escalation

- SafetySignalRecorded
- SafetySignalTriageStarted
- SafetySignalTriaged
- SafetySignalEscalated
- SafetySignalClosedAsNotEvent
- SafetySignalConvertedToSafetyEvent
- SafetyEventCreated
- SafetyEventReviewStarted
- SafetyActionRecorded
- SafetyEventMonitoringStarted
- SafetyEventResolved
- SafetyEventClosed
- SafetyEventReopened

### M10 Evidence and Knowledge Integration

- EvidenceSearchRequested
- EvidenceSearchCompleted
- KnowledgeReferenceCreated
- KnowledgeReferenceRefreshed
- EvidenceReviewCreated
- EvidenceReviewSubmittedForReview
- EvidenceReviewCompleted
- EvidenceDecisionCreated
- EvidenceDecisionSubmittedForReview
- EvidenceDecisionApproved
- EvidenceDecisionSuperseded
- EvidenceSnapshotCreated
- ResearchKnowledgeGapCreated
- ResearchKnowledgeGapSubmittedForReview
- ResearchKnowledgeGapApproved
- ResearchKnowledgeGapClosed
- ReferenceChangeAlertCreated
- ReferenceChangeAlertAcknowledged
- ReferenceChangeAlertResolved

### M11 AI Companion

- AIConversationStarted
- AIConversationClosed
- AIInteractionRequested
- AIPermissionAllowed
- AIPermissionDenied
- AIContextAssembled
- AIRetrievalCompleted
- AIOutputGenerated
- AIActionProposed
- AIActionConfirmed
- AIActionExecuted
- AIActionFailed
- AIHumanReviewRequested
- AIReviewCompleted
- AIMemoryItemStored
- AIMemoryItemUpdated
- AIMemoryItemRevoked
- AIMemoryItemDeleted
- AIAdaptationApplied
- AIEvaluationRecorded
- AISafetySignalRaised
- AIIncidentRecorded
- AIConfigurationVersionApproved
- AIConfigurationVersionActivated
- AIConfigurationVersionSuspended

### M12 Dataset and Data Quality

- DatasetDefinitionCreated
- DatasetDefinitionSubmittedForReview
- DatasetDefinitionApproved
- DatasetDefinitionSuperseded
- DatasetVersionGenerationRequested
- DatasetVersionGenerated
- DatasetQualityReviewStarted
- DatasetQualityReviewCompleted
- DatasetVersionLocked
- DatasetVersionAnalysed
- DatasetVersionSuperseded
- DatasetVersionArchived
- DataQualityIssueRecorded
- DataQualityIssueAssigned
- DataQualityIssueResolved
- DataQualityIssueAcceptedWithLimitation
- TransformationRunStarted
- TransformationRunCompleted
- TransformationRunFailed

---

## 64. Domain Event Catalogue — M13 to M18

### M13 Analysis, Interpretation and Findings

- AnalysisPlanCreated
- AnalysisPlanSubmittedForReview
- AnalysisPlanApproved
- AnalysisPlanSuperseded
- AnalysisPlanArchived
- AnalysisRunCreated
- AnalysisRunStarted
- AnalysisRunCompleted
- AnalysisRunFailed
- AnalysisRunCancelled
- AnalysisOutputRecorded
- InterpretationDrafted
- InterpretationSubmittedForReview
- InterpretationApproved
- InterpretationSuperseded
- ResearchFindingDrafted
- ResearchFindingSubmittedForReview
- ResearchFindingApproved
- ResearchFindingApprovedWithLimitations
- ResearchFindingRejected
- ResearchFindingSuperseded
- ResearchFindingWithdrawn
- ResearchFindingArchived

### M14 Reporting and External Submission

- ReportCreated
- ReportVersionCreated
- ReportVersionSubmittedForReview
- ReportVersionApproved
- ExportRequested
- ExportValidated
- ExportApproved
- ExportGenerationStarted
- ExportGenerated
- ExportDelivered
- ExportDeliveryFailed
- ExportRevoked
- EvidencePackageCreated
- EvidencePackageSubmittedForReview
- EvidencePackageApproved
- ExternalSubmissionCreated
- ExternalSubmissionSubmitted
- ExternalSubmissionResponseRecorded
- ExternalSubmissionWithdrawn

### M15 Governance and Audit

- ApprovalRequested
- ApprovalGranted
- ApprovalGrantedWithConditions
- ApprovalRejected
- ApprovalWithdrawn
- GovernanceReviewCreated
- GovernanceReviewAssigned
- GovernanceReviewCompleted
- ConflictOfInterestRecorded
- AuditEventRecorded

### M16 Integration and Operations

- IntegrationRegistered
- IntegrationActivated
- IntegrationSuspended
- IntegrationCredentialRotated
- IntegrationTestCompleted
- IntegrationReconciliationStarted
- IntegrationReconciliationCompleted
- IntegrationMismatchRecorded
- IdentifierMappingCreated
- IdentifierMappingResolved
- IdentifierMappingSuperseded
- OperationQueued
- OperationStarted
- OperationWaitingForExternalDependency
- OperationWaitingForHumanReview
- OperationSucceeded
- OperationFailed
- OperationRetrying
- OperationCancelled
- OperationDeadLettered

### M17 Life Story and Personal Archive

- LifeStoryArchiveCreated
- LifeStoryItemDrafted
- LifeStoryItemUpdated
- LifeStoryItemConfirmed
- LifeStoryItemVisibilityChanged
- LifeStoryItemShared
- LifeStorySharingWithdrawn
- LifeStoryItemCorrectionRequested
- LifeStoryItemArchived
- LifeStoryItemDeleted
- LifeStoryContributionCreated
- LifeStoryContributionAccepted
- LifeStoryContributionRevised
- LifeStoryContributionRejected
- LifeStoryContributionWithdrawn
- LifeStoryExportRequested
- LifeStoryExportGenerated
- LegacyPreferenceRecorded
- LegacyPreferenceSuperseded
- LegacyPreferenceRevoked

### M18 Community and Social Connection

#### PublicProfile and Community

- PublicProfileCreated
- PublicProfileUpdated
- PublicProfilePublished
- PublicProfileUnpublished
- PublicProfileVisibilityChanged
- CommunitySpaceCreated
- CommunityRuleVersionPublished
- CommunityMembershipActivated
- CommunityMembershipEnded
- CommunityMembershipSuspended
- SocialPostDrafted
- SocialPostRevised
- SocialPostPublished
- SocialPostVisibilityChanged
- SocialPostWithdrawn
- SocialPostDeleted
- CommentCreated
- CommentUpdated
- CommentWithdrawn
- ReactionRecorded
- ReactionRemoved
- ActorFollowed
- ActorUnfollowed

#### Deferred ConnectionRequest

- ConnectionRequestCreated
- ConnectionRequestAccepted
- ConnectionRequestDeclined
- ConnectionRequestCancelled
- ConnectionRequestExpired

These events remain outside the first-Pilot active event set.

#### Open Matching and MutualAcceptance

- MatchPreferenceCreated
- MatchPreferenceActivated
- MatchPreferencePaused
- MatchPreferenceExpired
- MatchCandidateGenerationRequested
- MatchCandidateGenerated
- MatchCandidateExpired
- MatchDecisionRecorded
- MutualAcceptanceRecorded
- MutualAcceptanceExpired
- MutualAcceptanceInvalidated
- MatchIntroductionCreated

#### Connection

- ConnectionActivated
- ConnectionPaused
- ConnectionResumed
- ConnectionDisconnected

#### ConversationThread and Message

- ConversationThreadCreated
- ConversationThreadPaused
- ConversationThreadClosed
- MessageDraftCreated
- MessageDraftRevised
- MessageAttachmentAdded
- MessageAttachmentRemoved
- MessageSendConfirmed
- MessageQueued
- MessageSent
- MessageProviderAccepted
- MessageDelivered
- MessageRead
- MessageDeliveryFailed
- MessageDeliveryCancelled
- MessageWithdrawn

#### Blocking, Reporting and Moderation

- MuteCreated
- MuteRemoved
- BlockCreated
- BlockRevoked
- UserReportSubmitted
- ContentReportSubmitted
- ModerationCaseCreated
- ModerationCaseAssigned
- ModerationCaseTriaged
- ModerationDecisionRecorded
- ModerationActionRecorded
- ModerationCaseLinkedToSafetySignal
- ModerationCaseClosed
- AppealSubmitted
- AppealDecisionRecorded
- SocialContentRestored

The following names are deprecated as canonical Domain Events:

- `ActorBlocked`;
- `ActorUnblocked`;
- `UserReported`;
- `ContentReported`;
- `MessageDeliveryConfirmed`;
- `MatchCompleted`;
- `DatasetLocked`;
- `DatasetLockConfirmed`;
- and `SafetyEventDetected`.

---

## 65. Integration Event Catalogue and Cross-Layer Mapping

Only a focused subset of domain facts should cross a module or Platform boundary.

### 65.1 Representative Integration Events

Representative candidates include:

- ConsentWithdrawn
- ParticipantEnrolled
- ProtocolVersionActivated
- InterventionAssignmentActivated
- AssessmentCompleted
- SafetySignalRecorded
- SafetyEventCreated
- EvidenceDecisionApproved
- EvidenceSnapshotCreated
- ReferenceChangeAlertCreated
- ExportGenerated
- ExportDelivered
- ExternalSubmissionSubmitted
- ExternalSubmissionResponseRecorded
- IntegrationSuspended

Communication-provider contracts may use purpose-specific Integration Events such as:

- MessageDeliveryRequested
- MessageDeliveryCancellationRequested
- MessageDeliveryStateChanged

These Integration Events are derived from canonical Message Domain Events and do not expose Message body in general broker payloads.

Events concerning Life Story, matching, MutualAcceptance, Connections, Messages, reports and moderation are not externally published by default.

### 65.2 Integration Event Approval

An external Integration Event requires:

- documented producer and consumer;
- source Domain Event or workflow;
- purpose;
- minimum payload;
- Data Classification;
- Consent or another authorised basis;
- retention;
- residency;
- security review;
- compatibility policy;
- and removal or revocation handling.

### 65.3 Canonical Cross-Layer Mapping

This mapping distinguishes UX Analytics Events, legacy aliases and provider terms from canonical Domain Events.

| UX, Legacy or Provider Term | Canonical Domain Event | Contract Rule |
|---|---|---|
| `PublicProfileActivated` | `PublicProfilePublished` | UX activation is successful only after the M18 aggregate publishes. |
| `LifeStoryVisibilityChanged` | `LifeStoryItemVisibilityChanged` | Mapping includes exact LifeStoryItem and version. |
| `MatchCompleted` | `MutualAcceptanceRecorded` or `ConnectionActivated` | The intended state must be named explicitly. |
| `MessageSendConfirmationSubmitted` | `MessageSendConfirmed` | UX submission is not success until M18 confirms it. |
| `MessageDeliveryConfirmed` | `MessageDelivered` | Deprecated alias; provider evidence is translated before M18 records delivery. |
| `ActorBlocked` | `BlockCreated` | Deprecated alias. |
| `ActorUnblocked` or `BlockRemoved` | `BlockRevoked` | Revocation does not restore Connection or Thread. |
| `UserReported` | `UserReportSubmitted` | Deprecated alias. |
| `ContentReported` | `ContentReportSubmitted` | Deprecated alias. |
| `DatasetLockConfirmed` | `DatasetVersionLocked` | UX confirmation may precede the canonical M12 fact. |
| `SafetyEventDetected` | `SafetySignalRecorded` or `AISafetySignalRaised` | Automated detection cannot confirm SafetyEvent. |

### 65.4 Provider Status Mapping

Provider statuses are translated through the communication Anti-Corruption Layer.

Representative mapping:

| Provider Status | Canonical Command or Result |
|---|---|
| accepted | RecordMessageProviderAccepted |
| delivered | RecordMessageDelivered |
| failed or rejected | RecordMessageDeliveryFailure |
| read | RecordMessageRead only where enabled and contractually reliable |
| unknown | retain Delivery Unknown and reconcile |

A provider status cannot move a Message backwards or skip a required canonical transition unless a documented reconciliation rule permits it.

### 65.5 External Detail Retrieval

Consumers use current authorised APIs to retrieve additional detail.

Event possession, provider possession or Webhook subscription does not grant current access.

---

## 66. Event Delivery Semantics


### 66.1 Default Guarantee

The MVP assumes at-least-once delivery.

### 66.2 No Exactly-Once Claim

Business exactly-once effects are achieved through idempotent consumers and domain constraints rather than transport claims.

### 66.3 Acknowledgement

A consumer acknowledges only after durable successful processing.

### 66.4 Duplicate Delivery

Duplicate events are expected and must not create duplicate effects.

### 66.5 Out-of-Order Delivery

Consumers use aggregate version, occurred time and business rules to handle out-of-order events.

### 66.6 Delivery State

Publication, broker acceptance and consumer processing are separate states.

### 66.7 Sensitive Event Expiry

Some sensitive notification events may have bounded delivery or retrieval windows.

---

## 67. Event Ordering and Partitioning

Strict ordering is applied only where required.

Potential ordering keys include:

- aggregate ID;
- Participant and Research Project;
- Consent ID;
- MutualAcceptance ID;
- Connection ID;
- ConversationThread ID;
- Message ID;
- SafetySignal ID;
- DatasetVersion ID;
- or ExternalSubmission ID.

Examples requiring aggregate ordering include:

- ConsentRecorded before ConsentWithdrawn;
- BlockCreated before later communication attempts;
- MatchDecisionRecorded before MutualAcceptanceRecorded;
- MutualAcceptanceRecorded before ConnectionActivated;
- ConversationThreadCreated before MessageDraftCreated;
- MessageDraftCreated before MessageSendConfirmed;
- MessageSendConfirmed before MessageQueued;
- MessageQueued before MessageSent or MessageDeliveryFailed;
- MessageSent before MessageProviderAccepted or MessageDelivered;
- DatasetVersionGenerated before DatasetVersionLocked;
- SafetySignalRecorded before SafetySignalConvertedToSafetyEvent.

Global ordering is not assumed.

Consumers reject impossible version regression or route it for reconciliation.

---

## 68. Transactional Outbox and Consumer Inbox

### 68.1 Outbox

Material state and event intent are persisted atomically.

### 68.2 Dispatcher

A dispatcher publishes unpublished outbox records and records delivery attempts.

### 68.3 Inbox

A consumer inbox may record processed event ID, schema version, aggregate version and result.

### 68.4 Retention

Outbox and inbox retention support retry, audit and reconciliation without retaining unnecessary sensitive payloads.

### 68.5 Failure

A failed dispatcher does not roll back the already committed domain transition.

The pending event remains visible and retryable.

### 68.6 Security

Outbox payloads follow Data Classification and access controls.

---

## 69. Consumer Idempotency

Consumers identify events by Event ID and business effect.

A consumer must:

- detect duplicates;
- validate schema and source;
- check aggregate version;
- apply purpose and permission where retrieving detail;
- persist its result durably;
- acknowledge only after success;
- and avoid duplicate notifications, MutualAcceptances, Connections, ConversationThreads, Messages, DeliveryAttempts, exports or SafetyActions.

Idempotency keys for event-triggered external writes are derived from stable event and target identifiers.

---

## 70. Retry and Dead-Letter Handling

### 70.1 Retryable Failures

Examples:

- temporary network error;
- timeout;
- rate limit;
- provider unavailability;
- transient lock;
- and temporary dependency state.

### 70.2 Non-Retryable Failures

Examples:

- invalid schema;
- denied permission;
- incompatible Consent;
- prohibited action;
- deleted or withdrawn target;
- permanent provider rejection;
- and unsupported version.

### 70.3 Backoff

Retries use bounded exponential backoff with jitter.

### 70.4 Dead-Letter Record

A dead-letter record includes:

- message or job reference;
- source;
- consumer;
- attempt history;
- final error;
- Data Classification;
- owner;
- next action;
- and trace.

### 70.5 Human Alert

Immediate or high-priority alert may be required for:

- Safety Signal routing;
- Block propagation;
- Message send or delivery state divergence;
- provider callback authentication failure;
- Consent withdrawal propagation;
- moderation report processing;
- public takedown;
- Dataset Lock publication;
- and external-submission failure.

### 70.6 Replay

Replay requires owner, purpose, scope, safety review where applicable and audit.

---

## 71. Event Schema Evolution and Replay

### 71.1 Schema Version

Every event carries an event schema version.

### 71.2 Compatible Evolution

Compatible changes may add optional fields or metadata.

### 71.3 Breaking Evolution

Breaking changes use a new event schema version or event type.

### 71.4 No Meaning Reuse

An existing event name is not reused for a different domain fact.

### 71.5 Deprecated Alias Translation

Historical aliases are translated through explicit versioned adapters.

Examples:

- `MessageDeliveryConfirmed` → `MessageDelivered`;
- `ActorBlocked` → `BlockCreated`;
- `UserReported` → `UserReportSubmitted`;
- and `DatasetLockConfirmed` → `DatasetVersionLocked`.

The original event ID, source type and translation version remain traceable.

### 71.6 Replay Preconditions

Replay of M18 events re-evaluates or preserves:

- Block;
- Consent;
- ResourceState;
- current communication policy;
- idempotency;
- and protected-existence rules.

Replay cannot recreate an expired MutualAcceptance, Connection, ConversationThread or Message send authority.

### 71.5 Consumer Inventory

Known consumers and supported versions are registered.

### 71.6 Replay Boundary

Replay does not:

- re-authorise expired access;
- recreate deleted visibility;
- bypass Block;
- resend a Message without an idempotent business rule;
- re-run a high-impact moderation or safety decision;
- or alter a locked DatasetVersion.

### 71.7 Historical Projection

A replay consumer may construct historical projections using the permission and retention rules approved for that purpose.

---

## 72. Webhook Architecture

### 72.1 Purpose

Webhooks notify registered external recipients of approved integration events.

### 72.2 MVP Registration

MVP Webhook endpoints are configured through a governed Integration record.

Dynamic self-service subscriptions are deferred.

### 72.3 Delivery

A Webhook delivery includes:

- delivery ID;
- event ID and type;
- schema version;
- occurred time;
- minimum payload;
- signature;
- timestamp;
- and retry metadata.

### 72.4 Authentication and Integrity

Webhook delivery uses:

- TLS;
- secret- or key-based signature;
- timestamp validation;
- replay protection;
- endpoint allowlist where appropriate;
- and credential rotation.

### 72.5 Minimal Payload

Sensitive Webhooks use opaque references and do not include private Life Story, message bodies, reporter identity, Safety details or identifiable research data by default.

### 72.6 Receiver Verification

New endpoints may require ownership verification or challenge-response.

### 72.7 Retry

Retries follow the registered policy and respect receiver rate limits.

### 72.8 Suspension

Repeated permanent or unsafe failure may suspend the Webhook subscription and create an operational alert.

### 72.9 Response

A `2xx` response acknowledges receipt, not downstream business completion.

---

## 73. Webhook Subscription and Delivery Records

A WebhookSubscription or Integration configuration records:

- owner;
- endpoint;
- event types and schema versions;
- purpose;
- recipient;
- authentication;
- signing key reference;
- Data Classification;
- permitted Organisations or Research Projects;
- payload profile;
- retry policy;
- suspension policy;
- retention;
- and review date.

A WebhookDelivery record includes:

- delivery ID;
- event ID;
- subscription;
- attempt;
- response status;
- response time;
- next attempt;
- final state;
- and trace.

Subscription changes require approval where they expand data or purpose.

---

## 74. File Exchange Architecture

File exchange supports:

- governed import;
- historical migration;
- Participant or Life Story export;
- locked Dataset export;
- reproducibility package;
- device batch upload;
- external submission;
- and approved partner exchange.

A file package includes:

- manifest;
- package and schema version;
- purpose;
- sender and recipient;
- source and exact versions;
- data or media files;
- code lists;
- variable dictionary where applicable;
- restrictions;
- Consent or authority reference where applicable;
- Data Classification;
- de-identification state;
- creation time;
- expiry;
- checksums;
- and signature or integrity metadata where required.

Invalid packages are quarantined.

A package is not imported until authority, schema, integrity, malware, identifiers, terminology, purpose and retention are validated.

---

## 75. Batch Integration

A batch contract defines:

- schedule and timezone;
- cutoff and source snapshot;
- full or incremental mode;
- cursor or watermark;
- file naming and package version;
- encryption and transfer;
- deduplication;
- late-arriving data;
- deletion or withdrawal records;
- reconciliation;
- retry;
- rejection handling;
- and owner.

Batch acceptance produces:

- accepted records;
- rejected records;
- warnings;
- unresolved mappings;
- quality issues;
- and reconciliation totals.

Counts must not expose protected data to an unauthorised recipient.

---

## 76. Import Contract

An import workflow is:

```text
Receive Package
        ↓
Authenticate Sender
        ↓
Validate Integrity and Malware
        ↓
Validate Schema and Version
        ↓
Resolve Purpose, Consent and Authority
        ↓
Map through Anti-Corruption Layer
        ↓
Validate Identifiers and Semantics
        ↓
Quarantine or Import through Owning Module
        ↓
Produce Import Report and Lineage
```

An import record preserves:

- source system;
- source identifier and version;
- retrieval or receipt time;
- original package reference;
- mapping version;
- transformation;
- validation;
- quality flags;
- quarantine state;
- local purpose;
- and owning-domain result.

Imported records do not become Platform-originated facts.

---

## 77. Export Package Contract

An ExportPackage includes:

- Export ID and version;
- request and approval;
- creator and recipient;
- purpose;
- source resource versions;
- DatasetDefinition and locked DatasetVersion where applicable;
- variable dictionary;
- TransformationRuns;
- de-identification;
- third-party, reporter, Block and visibility restrictions;
- file list;
- schema and code lists;
- licensing;
- retention and expiry;
- checksums;
- and delivery state.

Participant Life Story export additionally preserves:

- item versions;
- media and transcripts;
- attribution;
- Participant Testimony state;
- AI assistance;
- visibility and sharing choices;
- and third-party restrictions.

Generated, delivered, received and revoked are separate states.

---

## 78. MCP Integration Architecture

MCP may expose:

- Healthy Aging Knowledge Platform tools;
- governed Research Platform read and draft tools;
- approved analytical tools;
- and approved external capability tools.

MCP does not redefine domain ownership.

### 78.1 Capability Discovery

Clients discover:

- server identity;
- tool name and version;
- description;
- input and output schema;
- permission and purpose requirements;
- Action Level;
- side effects;
- confirmation;
- limitations;
- rate limits;
- and degraded state.

### 78.2 Authentication

MCP uses authenticated Service Account or delegated user context.

### 78.3 Permission Context

A tool request carries or resolves:

- actor;
- role;
- Organisation;
- Research Project;
- Participant and resource;
- Relationship or Connection where relevant;
- Consent;
- purpose;
- Specific Permission;
- Resource State;
- Data Classification;
- action risk;
- and trace.

### 78.4 Server Enforcement

The MCP server independently validates context and does not trust the model's statement of permission.

### 78.5 Transport

MCP transport is an implementation choice and does not change tool semantics.

---

## 79. Knowledge Platform MCP Tools

Representative read tools include:

- `search_evidence`
- `get_knowledge_reference`
- `get_theory`
- `get_mechanism`
- `get_outcome_definition`
- `get_measurement_definition`
- `resolve_knowledge_identifier`
- `get_provenance`
- `compare_knowledge_versions`
- `get_knowledge_gap_reference`
- `get_licensing_constraints`

Representative governed submission tools may include:

- `validate_evidence_package`
- `submit_approved_evidence_package`
- `get_submission_status`

Submission tools require M14 authority and approved artefacts.

Knowledge tools return:

- source identifier and version;
- verification state;
- provenance;
- completeness;
- licensing;
- warnings;
- and retrieval time.

They do not return unsupported certainty when a source or capability is unavailable.

---

## 80. Research Platform MCP Tools

Representative read tools include:

- `get_research_project`
- `get_research_question`
- `get_protocol_version`
- `get_intervention_configuration`
- `get_intervention_assignment`
- `get_assessment_summary`
- `get_evidence_decision`
- `get_evidence_snapshot`
- `get_life_story_item`
- `list_community_spaces`
- `get_match_candidate`
- `get_match_explanation`
- `get_match_decision`
- `get_mutual_acceptance`
- `get_connection`
- `get_conversation_thread`
- `get_message`
- `get_message_delivery_state`
- `get_safety_signal_summary`
- `get_dataset_version`
- `get_analysis_run`
- `get_research_finding`

Representative Draft or proposal tools include:

- `create_research_question_draft`
- `create_protocol_section_draft`
- `create_observation_draft`
- `create_life_story_draft`
- `propose_life_story_visibility`
- `create_social_post_draft`
- `create_match_preference_draft`
- `propose_match_decision`
- `create_message_draft`
- `revise_message_draft`
- `create_moderation_triage_draft`
- `request_human_review`
- `request_export`

Representative controlled action tools may include:

- `store_ai_memory_item`
- `submit_confirmed_social_post`
- `submit_confirmed_match_decision`
- `confirm_message_send`
- `create_confirmed_block`
- `submit_user_report`
- `raise_safety_signal`

Controlled action tools remain subject to:

- explicit actor confirmation;
- exact target and resource version;
- server-resolved permission;
- owning-domain command;
- current Block and ResourceState;
- idempotency;
- and structured result.

`confirm_message_send` confirms one existing Draft Message version and recipient set.

It does not accept arbitrary Message content as an already authorised send request.

No MCP tool autonomously:

- approves a Protocol;
- publishes Internet Public content;
- creates MutualAcceptance;
- accepts both sides of a match;
- creates or reactivates a Connection;
- creates a ConversationThread without an approved CommunicationBasis;
- sends a Message without exact actor confirmation;
- confirms a SafetyEvent;
- imposes high-impact moderation;
- locks a DatasetVersion;
- approves InterpretationRecord;
- or approves ResearchFinding.

---

## 81. AI Tool Contract

Each AI Tool defines:

- name and immutable Tool ID;
- version;
- owning module;
- description;
- approved task;
- input and output schema;
- read or write behaviour;
- permitted AI modes;
- required human permission;
- required Consent;
- purpose;
- Context;
- Specific Permission;
- accepted Data Classifications;
- ResourceState restrictions;
- ActionLevel;
- side effects;
- reversibility;
- confirmation;
- reviewer or approval requirement;
- idempotency;
- timeout;
- rate and abuse limits;
- audit fields;
- failure codes;
- degraded behaviour;
- and data-retention behaviour.

A Tool contract must not accept authority as model-generated input.

Examples of server-resolved fields include:

- Role;
- Relationship;
- Consent;
- Block;
- MatchDecision ownership;
- MutualAcceptance;
- Connection;
- CommunicationBasis;
- ConversationThread state;
- Message version and recipient set;
- attachment readiness;
- Approval;
- DatasetLock readiness;
- and SafetyEvent authority.

### 81.1 Message Tool Requirements

A Message Draft or send-confirmation Tool additionally declares:

- ConversationThread ID;
- permitted CommunicationBasis types;
- Message ID;
- expected Message version;
- exact recipient set;
- allowed content and attachment classes;
- confirmation challenge requirements;
- idempotency scope;
- and whether the result means Draft Created, Send Confirmed, Queued, Sent, Delivered or Failed.

The AI model cannot supply or alter the server-issued confirmation authority.

### 81.2 Matching Tool Requirements

A MatchDecision Tool declares:

- exact MatchCandidate ID and version;
- current deciding actor;
- allowed decision values;
- reversibility;
- expiry;
- confirmation;
- and result disclosure rules.

It cannot submit the other actor's decision or create MutualAcceptance directly.

---

## 82. AI Tool Action Levels and Confirmation

### Level 0 — Explain or Retrieve

Read-only explanation or retrieval with no domain mutation.

### Level 1 — Suggest

Returns recommendations, explanations or options.

### Level 2 — Draft

Creates a Draft artefact or wording without publication, send, Connection or external effect.

Examples include:

- LifeStoryItem Draft;
- SocialPost Draft;
- MatchPreference Draft;
- MatchDecision proposal;
- and Message Draft.

### Level 3 — Confirmed Reversible Action

Executes only after explicit actor confirmation and server-side policy checks.

Examples may include:

- store permitted AIMemoryItem;
- publish a confirmed Platform-only SocialPost;
- record the current actor's reversible MatchDecision;
- confirm sending one exact Message Draft;
- create a Block;
- or submit a Report.

A Level 3 Message Tool result may be `Send Confirmed` or `Queued`.

It must not claim `Delivered` until M18 records `MessageDelivered`.

### Level 4 — Controlled Workflow Action

Creates or advances a governed workflow requiring authorised review, approval or accountable processing.

Examples may include:

- request export;
- request moderation review;
- raise SafetySignal;
- or submit an approved EvidencePackage.

### Level 5 — Prohibited Autonomous Action

AI must not autonomously:

- alter Consent;
- infer substitute authority;
- publish Internet Public content;
- submit both actors' MatchDecisions;
- create MutualAcceptance;
- activate or restore a Connection;
- create a ConversationThread without current CommunicationBasis;
- send an unconfirmed Message;
- invent provider delivery;
- impose high-impact moderation;
- confirm or close SafetyEvent;
- change LegacyPreference;
- lock DatasetVersion;
- approve AnalysisPlan;
- approve InterpretationRecord;
- approve ResearchFinding;
- or publish knowledge.

---

## 83. AI Tool Result, Error and Audit Contract

A Tool result includes:

- Tool invocation ID;
- Tool and version;
- owning module;
- target resource;
- result state;
- created or changed resource reference;
- resource version;
- side effects;
- confirmation or review state;
- warnings;
- error code;
- retryability;
- and trace.

Representative result states:

- Succeeded;
- Proposed;
- Draft Created;
- Confirmation Required;
- Send Confirmed;
- Queued;
- Human Review Required;
- Approval Required;
- Denied;
- Conflict;
- Failed;
- Reversed;
- or Partial.

Delivery-specific state is returned separately:

- Not Submitted;
- Queued;
- Sent;
- Provider Accepted;
- Delivered;
- Delivery Failed;
- or Delivery Unknown.

The AI may describe a domain action as completed only when the structured owning-module result supports that exact claim.

`Succeeded` for `confirm_message_send` means the send-confirmation command succeeded.

It does not mean the Message was delivered.

Audit preserves:

- AIInteraction;
- Tool selection;
- permission result;
- safe request references;
- confirmation;
- exact target version;
- owning-module response;
- emitted event IDs;
- and final user-visible output.

Tool errors are data for the orchestrator and cannot be treated as new instructions.

---

## 84. External Adapter Pattern


Every external system is accessed through a controlled adapter owned by M16 or the relevant integration boundary.

An adapter is responsible for:

- authentication and workload identity;
- request construction;
- schema and protocol translation;
- timeout and retry;
- rate and quota handling;
- source attribution;
- provider response validation;
- error normalisation;
- idempotency;
- provider-reference mapping;
- callback authentication and replay protection;
- canonical delivery-state translation;
- delivery reconciliation;
- telemetry;
- and degraded behaviour.

An adapter does not:

- expose provider SDK types to domain modules;
- turn provider output into a domain decision;
- create Message send authority;
- change Message content or recipients;
- create a ConversationThread or Connection;
- grant permission;
- or silently persist external data as authoritative Platform data.

Provider-specific identifiers and payloads remain inside the adapter and Integration records.

---

## 85. Anti-Corruption Layer and Mapping Contracts

An Anti-Corruption Layer protects canonical domain meaning from external schemas.

A mapping contract defines:

- external system and capability;
- source resource and version;
- canonical target;
- field mapping;
- terminology mapping;
- required and optional fields;
- unit and time conversion;
- missing and unknown semantics;
- source authority;
- transformation;
- quality flags;
- unsupported values;
- and round-trip limitations.

Mapping must preserve distinctions such as:

- Participant versus Resident;
- Relationship versus Connection;
- Consent versus permission;
- SafetySignal versus SafetyEvent;
- ModerationCase versus SafetyEvent;
- Participant Testimony versus verified historical fact;
- MatchCandidate versus MatchDecision versus MutualAcceptance versus Connection;
- Connection versus CommunicationBasis versus ConversationThread;
- Message Draft versus SendConfirmation versus Sent versus Provider Accepted versus Delivered;
- DatasetDefinition versus DatasetVersion;
- AnalysisOutput versus ResearchFinding.

Unresolved or unsafe mappings are quarantined or require human review.

---

## 86. Integration Registry Contract

Every Integration record includes:

- Integration ID;
- name and owner;
- external system;
- capability;
- direction;
- purpose;
- Organisations and Research Projects;
- data categories and Data Classification;
- Consent requirements;
- authentication;
- endpoint and allowlist;
- schema and adapter versions;
- provider retention and training behaviour;
- data location and subprocessors;
- timeout, retry and circuit breaker;
- quotas;
- reconciliation;
- deletion and exit behaviour;
- incident contact;
- lifecycle state;
- review date;
- and audit.

Representative lifecycle states:

- Draft;
- In Review;
- Approved;
- Active;
- Degraded;
- Suspended;
- Retired;
- and Archived.

Activation requires exact approved configuration and successful validation.

---

## 87. External Authentication Patterns

Approved patterns may include:

- OAuth 2.0 or OpenID Connect;
- mutual TLS;
- signed request;
- API key with additional controls;
- short-lived Service Account token;
- managed workload identity;
- or secure file-transfer credentials.

Selection depends on:

- provider capability;
- action risk;
- Data Classification;
- direction;
- revocation;
- rotation;
- and auditability.

Long-lived shared secrets are avoided where a stronger alternative exists.

Credentials are stored in managed secrets infrastructure and never in domain records, events, prompts or files.

Delegated user tokens are scoped and not reused outside the approved purpose.

---

## 88. Timeouts, Retries and Circuit Breakers

Every synchronous external call defines:

- connect timeout;
- response timeout;
- total budget;
- cancellation;
- retryable errors;
- maximum attempts;
- backoff and jitter;
- circuit-breaker threshold;
- open duration;
- fallback;
- and user-visible state.

Retries are limited to idempotent or idempotency-protected requests.

A circuit breaker protects the Platform from repeated dependency failure.

Failure does not fabricate:

- publication;
- Message send, provider acceptance or delivery;
- MatchCandidate;
- MutualAcceptance;
- Connection;
- ConversationThread;
- report acceptance;
- Safety action;
- Dataset Lock;
- export delivery;
- or external submission.

---

## 89. Rate Limits and Provider Quotas

Integration contracts define:

- request quota;
- concurrency;
- data-volume limit;
- burst limit;
- retry-after behaviour;
- priority;
- and quota owner.

The Platform monitors provider quota separately from user abuse limits.

Critical safety, Block, Consent and report workflows should not compete with low-priority bulk, AI, media or analytics calls.

Provider throttling returns a normalised retryable error and does not appear as domain rejection.

---

## 90. Integration Reconciliation

Reconciliation verifies Platform and external state for:

- Message DeliveryAttempts and notification delivery;
- Webhook delivery;
- file transfer;
- object processing;
- external identifier mapping;
- device import;
- search and vector indexing;
- deletion propagation;
- export receipt;
- and external submission.

A reconciliation record includes:

- scope;
- source snapshot;
- expected and observed state;
- mismatches;
- owner;
- action;
- and resolution.

Automatic repair is limited to reversible, deterministic and authorised cases.

Other mismatches create a task or incident.

Reconciliation never overwrites authoritative domain data based solely on provider state.

For Messages, reconciliation:

- maps one provider reference to one canonical Message and DeliveryAttempt;
- validates authenticated evidence;
- preserves previous Platform and provider states;
- records uncertainty;
- and invokes an allowed M18 command rather than updating storage directly.

---

## 91. Security and Privacy Context Across Interfaces

Sensitive interfaces preserve or resolve:

- authenticated identity;
- role and Organisation;
- Research Project;
- Relationship, MutualAcceptance, Connection or CommunicationBasis;
- ConversationThread participant set where applicable;
- Consent;
- purpose;
- Specific Permission;
- Resource State;
- visibility;
- Block;
- Data Classification;
- action risk;
- provider processing;
- and trace.

The following must not appear in broad event, log or Webhook payloads:

- credentials;
- private Life Story text;
- Message bodies;
- reporter identity;
- moderation evidence;
- detailed Safety records;
- substitute-authority documents;
- precise location;
- identifiable analytical rows;
- or full AI prompts.

Public interfaces remain subject to anti-enumeration, scraping, rate, abuse and takedown controls.

---

## 92. Provenance, Audit and Lineage Across Interfaces

### 92.1 Provenance

A response or imported record may identify:

- source system;
- source resource;
- source version;
- retrieval time;
- transformation;
- verification;
- licensing;
- and completeness.

### 92.2 Command Audit

Material commands preserve:

- actor;
- role;
- purpose;
- target and expected version;
- permission result;
- confirmation or approval;
- command result;
- event IDs;
- and trace.

### 92.3 Research Lineage

Dataset and Analysis interfaces preserve:

```text
Source Aggregate Version
        ↓
DatasetDefinition
        ↓
TransformationRun
        ↓
DatasetVersion
        ↓
DatasetLock
        ↓
AnalysisPlan
        ↓
AnalysisRun
        ↓
InterpretationRecord
        ↓
ResearchFinding
```

### 92.4 AI Lineage

AI tool interfaces preserve:

- AIInteraction;
- configuration;
- model;
- instruction;
- context references;
- retrieval;
- tool;
- confirmation;
- domain result;
- and review.

### 92.5 Social and Messaging Lineage

Interfaces preserve:

```text
MatchPreference
        ↓
MatchCandidate
        ↓
MatchDecision
        ↓
MutualAcceptance
        ↓
Connection
        ↓
CommunicationBasis
        ↓
ConversationThread
        ↓
Message Draft
        ↓
SendConfirmation
        ↓
DeliveryAttempts and Delivery State
```

Lineage also preserves:

- policy version;
- Consent and purpose at action time;
- Block state;
- provider adapter and reference;
- moderation or Safety links;
- and content-minimisation decision.

### 92.6 Audit Reference

Interfaces may return an audit reference without exposing the full AuditEvent.

---

## 93. Observability and Logging

### 93.1 API Metrics

- request rate;
- latency;
- error rate;
- status and error-code distribution;
- permission and Consent denial;
- concurrency conflict;
- idempotency replay;
- rate limit;
- and payload size.

### 93.2 Event Metrics

- outbox age;
- publish rate;
- consumer lag;
- duplicate count;
- out-of-order count;
- retry;
- dead letter;
- and replay.

### 93.3 Integration Metrics

- availability;
- timeout;
- circuit state;
- schema failure;
- quota;
- reconciliation mismatch;
- and delivery state.

### 93.4 Domain-Critical Metrics

- Block propagation;
- MutualAcceptance creation, expiry, invalidation and reuse attempt;
- Connection activation denial;
- ConversationThread basis denial;
- Message Draft-to-confirmation conversion;
- Message queue age;
- provider acceptance and delivery latency;
- Message failure and Delivery Unknown;
- provider callback authentication failure;
- report routing;
- moderation backlog;
- Safety Signal routing;
- public-publication failure;
- Dataset Lock failure;
- and export delivery.

### 93.5 AI Tool Metrics

- permission denial;
- Context rejection;
- tool selection;
- confirmation;
- schema failure;
- unsafe attempt;
- owning-domain denial;
- and false completion prevention.

### 93.6 Logging

Logs record technical metadata without unnecessary sensitive content.

Representative fields:

- request, event, operation and trace IDs;
- contract and module;
- endpoint, command or tool;
- actor type;
- Organisation and project;
- result and error code;
- duration;
- dependency;
- retry count;
- and Data Classification.

---

## 94. Contract Documentation

The repository maintains:

- OpenAPI specifications;
- AsyncAPI specifications where appropriate;
- JSON Schemas;
- MCP tool manifests;
- file and batch schemas;
- event catalogue;
- error catalogue;
- integration registry;
- example payloads;
- sequence diagrams;
- compatibility policy;
- migration guides;
- and contract-test fixtures.

Documentation identifies:

- contract owner;
- lifecycle;
- security and Consent requirements;
- action risk;
- version;
- consumers;
- and implementation status.

Examples use synthetic identifiers and data.

Documentation does not contain credentials or identifiable production content.

---

## 95. SDKs and Client Generation

Generated SDKs may support:

- web and PWA clients;
- internal trusted services;
- approved partner systems;
- and research tools.

SDKs should:

- preserve typed errors;
- expose idempotency and concurrency;
- support cancellation and timeout;
- avoid hiding pending Operation state;
- avoid automatic broad field expansion;
- and surface Consent, permission, confirmation and review requirements.

An SDK must not:

- retry non-idempotent commands blindly;
- convert `404` to a protected-resource disclosure;
- infer success from HTTP acceptance;
- or hide contract-version incompatibility.

Privileged SDKs are distributed only to approved clients.

---

## 96. Contract Testing

Contract testing includes:

- provider contract tests;
- consumer contract tests;
- schema validation;
- example validation;
- compatibility tests;
- adapter tests;
- Webhook receiver tests;
- file-package tests;
- MCP Tool tests;
- and cross-layer event-mapping tests.

CI verifies:

- OpenAPI validity;
- JSON Schema validity;
- AsyncAPI or selected event-schema validity;
- event catalogue consistency;
- Domain Event, Integration Event and UX Analytics Event classification;
- command and event naming;
- aggregate, resource and event ownership;
- error-code registration;
- deprecated-alias translation;
- and removal of unsupported fields.

A contract cannot be released without:

- identified owner;
- source authority;
- supported version;
- security and Consent classification;
- example payload;
- compatibility assessment;
- and automated test coverage.

---

## 97. API Security and Domain Tests

Tests cover:

- unauthenticated access;
- expired session;
- wrong Organisation;
- wrong ResearchProject;
- wrong Participant;
- revoked Relationship;
- withdrawn or incompatible Consent;
- wrong purpose;
- missing Specific Permission;
- restricted ResourceState;
- private Visibility;
- Block;
- protected existence;
- field expansion;
- direct-object reference;
- mass assignment;
- version conflict;
- idempotency conflict;
- rate limit;
- public scraping;
- and export restriction.

### 97.1 Matching and MutualAcceptance Tests

Tests verify:

- Open Matching inactive by default;
- MatchPreference ownership and version;
- candidate expiry;
- prohibited matching attributes;
- safe MatchCandidate projection;
- MatchExplanation availability;
- one actor cannot submit another actor's MatchDecision;
- a profile view cannot create MatchDecision;
- compatible decisions may create one MutualAcceptance;
- MutualAcceptance preserves exact source references and policy version;
- MutualAcceptance expiry;
- MutualAcceptance invalidation after Consent, Block, eligibility or policy change;
- one MutualAcceptance cannot activate two Connections;
- arbitrary actor IDs cannot create MutualAcceptance;
- and ConnectionRequest endpoints return `CONNECTION_REQUEST_FEATURE_DISABLED` in the first Pilot.

### 97.2 Connection and ConversationThread Tests

Tests verify:

- Connection requires valid unused MutualAcceptance;
- Connection does not create Supporter or research authority;
- existing-contact intervention may occur without M18 Connection;
- ConversationThread requires current CommunicationBasis;
- unilateral MatchDecision is not CommunicationBasis;
- Thread participants cannot be silently added;
- expired or revoked basis makes the Thread unusable;
- and protected Thread existence remains protected.

### 97.3 Message Tests

Tests verify:

- Message creation produces Draft;
- Draft revision requires current version;
- Draft does not send;
- attachment pending or quarantined prevents send;
- SendConfirmation is actor-, version- and recipient-specific;
- expired or mismatched confirmation fails;
- duplicate confirmation is idempotent;
- Block prevents SendConfirmation;
- MessageQueued follows MessageSendConfirmed;
- provider acceptance is not delivery;
- failed or unknown delivery is not Delivered;
- provider callbacks are authenticated, replay-protected and idempotent;
- invalid provider state regression is rejected or reconciled;
- retry creates another DeliveryAttempt rather than duplicate Message;
- cancellation and withdrawal do not falsely claim external recall;
- Message body is absent from general Search, matching, AIMemoryItem, events and ordinary research;
- and Report remains available after Block or Disconnect.

### 97.4 Research and Safety Boundary Tests

Domain tests additionally cover:

- approved Protocol immutability;
- Life Story Draft versus ParticipantTestimony;
- Internet Public confirmation;
- ModerationCase versus SafetyEvent;
- SafetySignal conversion;
- DatasetLock readiness;
- DatasetVersionLocked event;
- AnalysisOutput versus ResearchFinding;
- and external-submission separation.

---

## 98. Event, Webhook and File Tests

### 98.1 Event Tests

Event tests cover:

- duplicate delivery;
- out-of-order delivery;
- aggregate version;
- transactional outbox;
- consumer crash;
- poison event;
- retry;
- dead letter;
- replay;
- schema evolution;
- sensitive payload minimisation;
- protected detail retrieval;
- event-category classification;
- and source Domain Event traceability.

M18 event tests verify:

- MatchDecisionRecorded before MutualAcceptanceRecorded;
- MutualAcceptanceRecorded before ConnectionActivated;
- ConversationThreadCreated before MessageDraftCreated;
- MessageSendConfirmed before MessageQueued;
- MessageQueued before MessageSent or MessageDeliveryFailed;
- MessageSent before MessageProviderAccepted or MessageDelivered;
- MessageDeliveryConfirmed translates to MessageDelivered only as a deprecated alias;
- ActorBlocked translates to BlockCreated;
- UserReported translates to UserReportSubmitted;
- and DatasetLockConfirmed maps to DatasetVersionLocked without claiming a Domain Event from UX interaction alone.

### 98.2 Webhook Tests

Webhook tests cover:

- signature;
- timestamp;
- replay;
- endpoint verification;
- retry;
- receiver timeout;
- suspension;
- payload minimisation;
- current subscription authority;
- and protected-reference retrieval.

### 98.3 Communication Provider Callback Tests

Tests cover:

- callback signature;
- provider-reference mapping;
- unknown provider reference;
- duplicate callback;
- reordered callback;
- unsupported state;
- provider status regression;
- delivery failure;
- Delivery Unknown;
- cancellation;
- reconciliation;
- and audit.

### 98.4 File Tests

File tests cover:

- malware;
- checksum;
- signature;
- encryption;
- missing file;
- incompatible schema;
- duplicate import;
- Consent conflict;
- mapping uncertainty;
- quarantine;
- and partial rejection.

---

## 99. MCP and AI Tool Tests

Tests cover:

- unauthenticated Tool use;
- missing Role or purpose;
- wrong Organisation or project;
- wrong Participant;
- missing Consent;
- blocked actor or content;
- private Visibility;
- ResourceState restriction;
- Prompt injection;
- Tool injection;
- unsafe Tool choice;
- fabricated identifier;
- schema mismatch;
- confirmation bypass;
- model-generated authority fields;
- Tool result treated as instruction;
- false completion;
- cross-Participant leakage;
- private Life Story leakage;
- hidden sensitive matching;
- another actor's MatchDecision submission;
- MutualAcceptance creation attempt;
- MutualAcceptance bypass;
- arbitrary Connection creation;
- ConversationThread creation without CommunicationBasis;
- Message Draft treated as sent;
- unauthorised Message send;
- Message delivery invented from a queued or sent result;
- high-impact moderation;
- SafetyEvent confirmation attempt;
- DatasetLock attempt;
- ResearchFinding approval attempt;
- memory retention and deletion;
- audit completeness;
- and provider failure.

Every prohibited Level 5 action has an explicit negative test.

---

## 100. Compatibility and Deprecation Policy

### 100.1 Supported Window

The Platform defines supported:

- API major versions;
- resource schema versions;
- Domain Event schema versions;
- Integration Event contract versions;
- UX Analytics schema versions;
- MCP Tool versions;
- file-package versions;
- SDK versions;
- and provider-adapter versions.

### 100.2 Deprecation Notice

A notice includes:

- contract;
- owner;
- source authority;
- reason;
- replacement;
- semantic impact;
- migration steps;
- warning date;
- retirement date;
- and support contact.

### 100.3 Breaking Security Change

A security, privacy or social-safety correction may require accelerated retirement with documented risk and migration support.

### 100.4 Consumer Inventory

Known consumers are identified before retirement.

### 100.5 No Silent Semantic Change

A contract is not kept at the same version when permission, Visibility, state-transition, matching, CommunicationBasis or delivery meaning changes incompatibly.

### 100.6 Canonical Deprecated Aliases

The following aliases require explicit translation and must not be emitted by new canonical producers:

- `ActorBlocked`;
- `ActorUnblocked`;
- `UserReported`;
- `ContentReported`;
- `MessageDeliveryConfirmed`;
- `MatchCompleted`;
- `DatasetLocked`;
- `DatasetLockConfirmed`;
- and `SafetyEventDetected`.

---

## 101. Data Residency and Multi-Organisation Routing

Routing may depend on:

- Organisation;
- ResearchProject;
- Participant residency or study location;
- external provider;
- Data Classification;
- purpose;
- Consent;
- CommunicationBasis;
- and contract.

Multi-Organisation contracts preserve tenant scope in:

- authentication context;
- identifiers;
- queries;
- commands;
- events;
- Webhooks;
- files;
- exports;
- provider routing;
- callbacks;
- and audit.

Cross-Organisation matching, Connection, ConversationThread or Message access is explicit, policy-approved and purpose-bound.

A Platform Public or Community capability does not remove Organisation or jurisdiction restrictions.

Provider fallback must not move data to an unauthorised location.

---

## 102. Failure and Degraded Modes

### 102.1 API Edge Unavailable

Clients show a clear temporary failure and do not claim command completion.

### 102.2 Policy or Consent Context Unavailable

Sensitive actions fail closed.

### 102.3 Block or Visibility State Unavailable

Discovery, matching, MutualAcceptance, Connection activation, ConversationThread creation, Message send, notification, content delivery and AI Context fail closed.

### 102.4 Event Bus Unavailable

Transactional outbox retains unpublished events.

A committed Domain Event is not silently lost or replaced by a UX success message.

### 102.5 Queue Unavailable

Message SendConfirmation may succeed only if the owning command can durably preserve a safe queued or pending state.

The interface never claims Sent or Delivered when queueing failed.

### 102.6 Knowledge Platform Unavailable

Approved EvidenceDecisions and EvidenceSnapshots remain available.

Live searches report unavailable or partial state.

### 102.7 AI Provider Unavailable

Non-AI and manual workflows continue.

Draft and pending states remain accurate.

### 102.8 Matching Worker Unavailable

No MatchCandidate is fabricated.

Matching remains pending or paused.

### 102.9 MutualAcceptance Evaluation Unavailable

MatchDecisions remain durably recorded.

The response reports evaluation pending or failed and does not create Connection.

### 102.10 CommunicationBasis Unavailable

ConversationThread creation and Message send fail closed.

Existing Thread content may be shown only through current authorised read policy.

### 102.11 Communication Provider Unavailable

Messages remain:

- Confirmed for Send;
- Queued;
- Retrying;
- Delivery Failed;
- or Delivery Unknown

according to the canonical M18 state.

They are not marked Delivered.

### 102.12 Provider Callback Unavailable or Invalid

The Platform retains its current canonical delivery state and starts reconciliation.

An unauthenticated or replayed callback is rejected and audited.

### 102.13 Moderation Provider Unavailable

Human moderation remains available.

Provider-classification absence does not suppress a Report.

### 102.14 Media Provider Unavailable

Original Private Draft may remain, but scan, transcription, translation, attachment readiness or publication is not marked complete.

### 102.15 Webhook Recipient Unavailable

Delivery retries and may suspend the subscription.

### 102.16 Dataset or Lineage Failure

DatasetVersion generation or lock pauses.

Unlocked data are not used as governed Analysis input.

### 102.17 Export Recipient Unavailable

Export remains generated or pending delivery, not received.

### 102.18 Audit Unavailable

High-risk commands pause or use an approved protected durable audit queue.

### 102.19 Deletion Propagation Failure

A remediation record identifies affected indexes, providers, caches, exports, public endpoints, ConversationThreads, pending Messages and AI Context.

---

## 103. MVP API Scope

The MVP implements focused APIs for:

### Identity, Participant and Consent

- session context;
- UserAccount and Organisation;
- RoleAssignments;
- ParticipantProfile and AccessibilityProfile;
- Relationship and Consent;
- current Consent summary;
- and permission-scoped views.

### Research and Intervention

- ResearchProject and ResearchQuestion;
- Protocol and ProtocolVersion;
- screening, eligibility and Enrolment;
- InterventionVersion and InterventionConfiguration;
- InterventionAssignment, Session, Exposure and Fidelity;
- AssessmentRecord, Observation and OutcomeRecord;
- SafetySignal and SafetyEvent;
- EvidenceReview, EvidenceDecision, EvidenceSnapshot and KnowledgeReference.

### AI, Data and Research Output

- AIConversation, AIInteraction and AIMemoryItem;
- DatasetDefinition, DatasetVersion, quality review and DatasetLock;
- AnalysisPlan, AnalysisRun and InterpretationRecord;
- ResearchFinding;
- ReportVersion, ExportRequest and EvidencePackage;
- ApprovalRecord and audit views;
- Integration and Operation resources.

### Life Story, Community, Matching and Messaging

The MVP includes:

- LifeStoryArchive, LifeStoryItem, contribution, Visibility and export;
- LegacyPreference only where separately approved;
- PublicProfile;
- CommunitySpace and membership;
- SocialPost and Comment;
- MatchPreference, MatchCandidate and MatchExplanation;
- independent MatchDecision;
- MutualAcceptance;
- Connection;
- ConversationThread under CommunicationBasis;
- Message Draft, attachment, SendConfirmation and delivery state;
- Mute, Disconnect and Block;
- UserReport and ContentReport;
- ModerationCase, decision and appeal.

Internet Public is disabled by default.

ConnectionRequest is feature-disabled and omitted from first-Pilot SDKs and navigation.

---

## 104. MVP Event Scope

The MVP publishes a focused internal Domain Event set, including:

### Consent, Research and Intervention

- ConsentRecorded
- ConsentWithdrawn
- RelationshipRevoked
- ProtocolVersionApproved
- ProtocolVersionActivated
- ParticipantEnrolled
- EnrolmentPaused
- ParticipantWithdrawn
- InterventionAssigned
- InterventionAssignmentActivated
- InterventionExposureRecorded
- AssessmentCompleted
- ObservationRecorded
- OutcomeRecorded

### Safety, Evidence and AI

- SafetySignalRecorded
- SafetySignalTriaged
- SafetyEventCreated
- EvidenceDecisionApproved
- EvidenceSnapshotCreated
- AIOutputGenerated
- AISafetySignalRaised
- AIMemoryItemStored

### Dataset and Research Finding

- DatasetDefinitionApproved
- DatasetVersionGenerated
- DatasetVersionLocked
- AnalysisRunCompleted
- InterpretationApproved
- ResearchFindingApproved
- ExportGenerated

### Life Story and Community

- LifeStoryItemConfirmed
- LifeStoryItemVisibilityChanged
- SocialPostPublished

### Matching, Connection and Messaging

- MatchCandidateGenerated
- MatchDecisionRecorded
- MutualAcceptanceRecorded
- MutualAcceptanceExpired
- MutualAcceptanceInvalidated
- ConnectionActivated
- ConnectionDisconnected
- ConversationThreadCreated
- ConversationThreadClosed
- MessageDraftCreated
- MessageDraftRevised
- MessageSendConfirmed
- MessageQueued
- MessageSent
- MessageProviderAccepted
- MessageDelivered
- MessageDeliveryFailed
- MessageDeliveryCancelled
- MessageWithdrawn

### Block, Report and Moderation

- BlockCreated
- BlockRevoked
- UserReportSubmitted
- ContentReportSubmitted
- ModerationCaseCreated
- ModerationDecisionRecorded
- ModerationCaseLinkedToSafetySignal

ConnectionRequest events are deferred.

Only a smaller approved subset becomes Integration Events.

---

## 105. MVP Integration Scope

The MVP supports:

- one identity provider;
- Healthy Aging Knowledge Platform access through MCP or compatible governed interface;
- one or more AI model providers through the Model Gateway;
- one communication provider through an M16 Anti-Corruption Layer;
- authenticated and idempotent communication-provider callbacks;
- provider-reference mapping and delivery reconciliation;
- object and media storage;
- malware scanning;
- transcription or translation where required;
- structured file import and export;
- transactional outbox;
- consumer inbox or equivalent idempotency;
- durable queue and workers;
- static governed Webhook integration where required;
- and optionally one Pilot-specific external system.

A third-party moderation provider is optional.

It does not own final ModerationDecision.

The communication provider does not own:

- Message content;
- sender authority;
- ConversationThread;
- CommunicationBasis;
- or canonical delivery state.

A dedicated public developer API, dynamic Webhook portal and large event-streaming Platform are not required.

---

## 106. MVP Contract Documentation and Test Scope

The MVP produces:

- versioned OpenAPI;
- Domain Event catalogue;
- Integration Event catalogue;
- UX Analytics mapping;
- selected AsyncAPI or event schemas;
- MCP Tool definitions;
- error catalogue;
- Integration Registry;
- file-package schemas;
- representative payloads;
- command and state-transition catalogue;
- permission and Consent matrix;
- provider-adapter contract;
- migration notes;
- and automated contract tests.

Required test coverage includes:

- current permission and Consent;
- protected existence;
- Block;
- Visibility;
- MatchDecision ownership;
- MutualAcceptance creation, expiry, invalidation and single-use;
- ConnectionRequest disabled state;
- Connection activation;
- CommunicationBasis;
- ConversationThread participants and lifecycle;
- Message Draft, SendConfirmation and delivery state;
- provider callback authentication and idempotency;
- reporter confidentiality;
- SafetySignal versus SafetyEvent;
- AI Tool confirmation;
- DatasetLock;
- event duplication and ordering;
- deprecated-event translation;
- Webhook replay;
- import quarantine;
- and degraded modes.

---

## 107. Deferred Capabilities

Deferred capabilities include:

- direct ConnectionRequest experience and client endpoints;
- public developer API;
- partner self-service portal;
- dynamic Webhook subscriptions;
- public API keys;
- GraphQL;
- unrestricted bulk APIs;
- cross-Organisation federation;
- enterprise schema-registry infrastructure;
- large-scale streaming backbone;
- real-time wearable streaming;
- broad FHIR integration;
- external Community federation;
- Internet Public API delivery;
- group or unrestricted messaging;
- unrestricted Message search or content analysis;
- advanced fraud and moderation provider integration;
- partner-managed MCP servers;
- automated SDK publication;
- API monetisation;
- and external marketplace integrations.

Deferral does not remove the need for stable canonical contracts where a future capability already has a domain definition.

---

## 108. Future Evolution


Future versions may support:

- federated research APIs;
- Participant-controlled data exchange;
- richer clinical and care interoperability;
- secure research enclaves;
- privacy-preserving linkage;
- dynamic Consent APIs;
- policy-aware data spaces;
- cross-jurisdiction routing;
- capability negotiation;
- signed provenance chains;
- institution-specific MCP servers;
- Community federation;
- portable Life Story archives;
- privacy-preserving matching;
- multi-site moderation and Safety integration;
- and posthumous digital-legacy exchange.

Future interfaces must preserve current ownership, Participant rights, Consent, accessibility, audit and research reproducibility.

---

## 109. Open Questions

1. Which API versioning mechanism is authoritative: URI, media type or both?
2. Which OpenAPI structure best reflects M01–M18 ownership?
3. Which action endpoints require step-up authentication in the Pilot?
4. Which commands require mandatory Idempotency-Key?
5. Which resources require ETag and If-Match from the first release?
6. Which read models require cursor pagination?
7. Which counts must be hidden, suppressed or coarsened?
8. Which fields may appear in PublicProfile?
9. Is Internet Public disabled throughout the first Pilot?
10. Which Life Story media and contribution commands are included?
11. Which LegacyPreference commands are legally and operationally supportable?
12. Which Community ranking metadata may be returned to Participants?
13. Which matching attributes are permitted?
14. Which matching attributes remain prohibited even when declared?
15. Which MatchDecision values are reversible?
16. Does Interested require step-up authentication or explicit confirmation only?
17. What effective period applies to MutualAcceptance?
18. Which changes invalidate unused MutualAcceptance?
19. Does Connection activation require an additional Participant acknowledgement after MutualAcceptance?
20. Which safe MutualAcceptance fields may be returned to each actor?
21. When may ConnectionRequest be enabled after the first Pilot?
22. Which discovery or invitation basis may support ConnectionRequest?
23. Which CommunicationBasis types are enabled for Participant messaging?
24. May an authorised Relationship create ConversationThread without an M18 Connection?
25. Are group ConversationThreads deferred?
26. Which Message content formats are enabled?
27. Which Message attachment types and limits are enabled?
28. Are read receipts disabled by default?
29. What Message retention and withdrawal rules apply?
30. Which Message lifecycle transitions require Idempotency-Key?
31. Which Provider statuses are sufficiently reliable to map to Delivered?
32. What timeout moves an unresolved provider delivery to Delivery Unknown?
33. Which queued Message effects can be cancelled after Block?
34. Which provider callback authentication and key-rotation pattern is used?
35. Which provider reconciliation interval and escalation threshold apply?
36. Which Message metadata may enter DatasetDefinitions?
37. Is Message body excluded from every first-Pilot DatasetDefinition?
38. Which Block effects require synchronous enforcement versus projection invalidation?
39. What reporter-facing case state may be safely returned?
40. Which ModerationDecision actions require independent review?
41. Which SafetySignal APIs may external providers call?
42. Which Domain Events are required by the first vertical slice?
43. Which Domain Events are promoted to Integration Events?
44. Which UX Analytics aliases remain necessary after Document 8 v3.2?
45. How long are deprecated event aliases supported?
46. Which event streams require aggregate ordering?
47. Which dead-letter failures require immediate human alert?
48. Are any Webhooks required in the first Pilot?
49. Which Webhook payloads require encrypted references?
50. Which file-exchange use cases require signatures?
51. Which Knowledge Platform MCP capabilities are available?
52. Which Research Platform MCP Tools are approved for AI use?
53. Which Level 3 AI actions are enabled in the Pilot?
54. Which AI providers may process Life Story, matching or Message Draft content?
55. Which provider outputs require Human Review?
56. Which Dataset and Analysis operations execute inside versus outside the Platform?
57. Which external standards are required for the first Pilot?
58. Which clients require generated SDKs?
59. What supported client-version and deprecation windows apply?
60. Who approves contract changes affecting Consent, Visibility, matching, messaging, moderation or Safety?

---

## 110. Design Decisions

This document establishes that:

1. Document 15 v1.2 is the authoritative Handbook source for API, event and integration contracts.
2. Interfaces use canonical language and ownership from Document 8 v3.2.
3. Every mutable aggregate has one owning module.
4. An interface does not change aggregate ownership.
5. Client and external access uses explicit governed contracts.
6. Material state changes use commands or action endpoints.
7. Approved and locked records are not changed through generic PATCH.
8. Requests preserve authenticated actor, Organisation, Role, purpose and trace.
9. Effective Permission uses Role, Relationship, Consent, Purpose, Context, SpecificPermission and ResourceState.
10. Visibility, Block, MatchDecision, MutualAcceptance, CommunicationBasis, DataClassification and action risk are additional deterministic inputs.
11. Client-supplied IDs and context never grant authority.
12. Permission and purpose filtering occur before data assembly.
13. Field, relationship and protected-existence controls are contract requirements.
14. Public Visibility does not remove Consent, classification or research-use controls.
15. Platform Public and Internet Public are distinct.
16. Internet Public is disabled by default in the first Pilot.
17. Relationship, MutualAcceptance, Connection and CommunicationBasis are distinct.
18. Connection does not create Supporter authority, Consent, care authority or research permission.
19. Open Matching is opt-in and MatchPreference-controlled.
20. MatchCandidate generation is a governed Operation rather than unrestricted search.
21. MatchCandidate responses use safe projections.
22. MatchExplanation does not expose hidden sensitive features or an objective compatibility score.
23. Each actor records only their own MatchDecision.
24. Clients cannot create MutualAcceptance from actor IDs or decision claims.
25. MutualAcceptance is created by M18 from canonical source records and current policy checks.
26. MutualAcceptance preserves source references, policy version, effective period, validity and usage.
27. Unused MutualAcceptance may expire or be invalidated.
28. One MutualAcceptance activates at most one Connection unless an approved policy states otherwise.
29. ConnectionRequest is a Deferred Alternative Connection Basis.
30. ConnectionRequest is feature-disabled for the first Pilot.
31. ConnectionRequest acceptance creates MutualAcceptance and does not directly create Connection.
32. Connection activation requires valid unused MutualAcceptance.
33. A client cannot create an arbitrary Connection through a generic collection POST.
34. Existing authorised contacts may complete an intervention without an M18 Connection.
35. ConversationThread is a canonical M18 resource.
36. ConversationThread requires one current approved CommunicationBasis.
37. A MatchCandidate, unilateral MatchDecision or SocialPost interaction is not CommunicationBasis.
38. ConversationThread records exact participants and cannot silently add another actor.
39. ConversationThread does not broaden Connection, Relationship, Consent or purpose.
40. Message is a canonical M18 resource.
41. Creating a Message produces Draft state.
42. Message Draft is distinct from SendConfirmation, queue, send, provider acceptance, delivery and read.
43. Draft revision requires optimistic concurrency.
44. SendConfirmation is actor-, Message-version- and recipient-specific.
45. AI, provider, recipient or helper cannot confirm sender authority.
46. Message enters delivery only after current Thread, CommunicationBasis, Consent, Block, recipient, attachment and abuse checks.
47. Message SendConfirmation and provider submission are idempotency-protected.
48. Message retries create DeliveryAttempts rather than duplicate logical Messages.
49. Sent, Provider Accepted, Delivered, Read, Failed and Delivery Unknown remain separate.
50. A provider callback is evidence translated by M16, not direct authority over M18.
51. Provider callbacks require authentication, replay protection, reference mapping and idempotency.
52. Provider state cannot change Message content, recipients or sender authority.
53. Delivery failure or uncertainty is never represented as Delivered.
54. Cancellation and withdrawal do not falsely claim external recall.
55. Message attachments require approved type, size, malware scan, storage and retention.
56. Message body is excluded by default from broad events, logs, Search, Vector retrieval, matching, Community ranking, AIMemoryItem and ordinary research.
57. Message-content analysis requires explicit Consent, purpose, DatasetDefinition, minimisation and governance.
58. BlockRecord is the authoritative M18 enforcement aggregate.
59. Block fails closed for discovery, matching, MutualAcceptance, Connection activation, Thread creation and Message send.
60. Block triggers projection, Search, Vector, AI Context, pending-job and provider-delivery suppression where possible.
61. Removing Block does not restore matching, MutualAcceptance, Connection, ConversationThread or Message delivery.
62. Mute, Disconnect and Block are separate.
63. Report remains available after Block or Disconnect where policy permits.
64. Reporter identity and moderation evidence are restricted.
65. Provider or AI moderation labels remain provisional.
66. High-impact ModerationDecision remains human-accountable.
67. ModerationCase, SafetySignal and SafetyEvent remain separate.
68. Automated detection creates SafetySignal, not confirmed SafetyEvent.
69. Resource state dimensions are not collapsed into one generic status.
70. Cursor pagination is preferred for changing collections.
71. Sensitive counts may be omitted.
72. Optimistic concurrency protects versioned resources.
73. Retriable effectful commands use idempotency.
74. Duplicate requests return the original safe outcome.
75. Structured errors are stable and protect resource existence.
76. Long-running work returns an Operation resource.
77. Accepted, generated, confirmed, queued, sent, delivered, received and approved are separate results.
78. API, resource, schema, Domain Event, Integration Event, UX Analytics Event, MCP Tool and file versions are distinct.
79. Domain Events represent completed aggregate facts.
80. Integration Events are deliberate stable projections.
81. UX Analytics Events do not prove domain success.
82. Operational and Audit Events do not redefine domain state.
83. Event names use canonical past tense.
84. Event payloads contain minimum necessary data.
85. Event possession does not grant current access.
86. The MVP assumes at-least-once event delivery.
87. Consumers are idempotent.
88. Ordering is explicit by aggregate where required.
89. Material publication uses a transactional outbox.
90. Consumer inbox or equivalent supports idempotency where required.
91. Retry and dead-letter behaviour is governed and auditable.
92. Replay cannot recreate expired permission, MutualAcceptance, Connection, CommunicationBasis or Message send authority.
93. MessageDeliveryConfirmed is a deprecated alias for MessageDelivered.
94. ActorBlocked is a deprecated alias for BlockCreated.
95. UserReported and ContentReported are deprecated aliases for UserReportSubmitted and ContentReportSubmitted.
96. DatasetLockConfirmed is a UX alias; DatasetVersionLocked is the canonical M12 Domain Event.
97. SafetyEventDetected is deprecated and must map to SafetySignal rather than SafetyEvent.
98. Webhooks use authenticated integrity, timestamp and replay protection.
99. Dynamic Webhook self-service is deferred.
100. Files include manifests, schemas, checksums, purpose and restrictions.
101. Invalid imports are quarantined.
102. Imported data preserve external authority and provenance.
103. Research extraction uses Dataset workflows rather than generic bulk APIs.
104. DatasetDefinition is approved before DatasetVersion generation.
105. DatasetVersionLocked is the canonical lock event.
106. A locked DatasetVersion is immutable.
107. AnalysisRun uses an approved AnalysisPlan and locked DatasetVersion.
108. AnalysisOutput is not InterpretationRecord or ResearchFinding.
109. All model access passes through M11.
110. MCP and AI Tools do not redefine domain ownership.
111. AI Tools declare permission, Consent, purpose, DataClassification, ResourceState and ActionLevel.
112. AI Tools do not trust model-generated authority fields.
113. AI cannot directly mutate another aggregate.
114. Tool success is established only by the owning module.
115. AI Draft is not ParticipantTestimony, MatchDecision, sent Message or ResearchFinding.
116. AI cannot create MutualAcceptance, Connection or ungoverned ConversationThread.
117. AI cannot send an unconfirmed Message or claim delivery from a queued result.
118. AI cannot autonomously publish Internet Public content, impose high-impact moderation, confirm SafetyEvent, lock DatasetVersion or approve research.
119. AIMemoryItem remains separate from ParticipantProfile, LifeStoryArchive, matching, Messages and research records.
120. All authoritative Knowledge Platform access passes through M10.
121. External systems are isolated through adapters and Anti-Corruption Layers.
122. Provider output does not become a domain decision without validation.
123. IntegrationRegistry records provider data use, location, retention and exit.
124. Timeouts, retries, circuit breakers and quotas are explicit.
125. Reconciliation identifies mismatches without silent authority changes.
126. Security and privacy context is preserved across every interface.
127. Provenance, audit and research lineage remain traceable.
128. Logs avoid unnecessary sensitive payloads.
129. OpenAPI, event schemas, MCP manifests, file schemas and error catalogue are version-controlled.
130. SDKs do not hide Consent, permission, confirmation, pending state or errors.
131. First-Pilot SDKs omit ConnectionRequest endpoints.
132. Contract tests include prohibited actions, provider callbacks and degraded modes.
133. Compatibility policy forbids silent semantic change.
134. Cross-Organisation access and data routing are explicit.
135. Critical controls fail closed when permission, Consent, Block, MutualAcceptance, CommunicationBasis or Visibility cannot be verified.
136. Supporting dependency failure never fabricates completion.
137. The MVP includes Life Story, Community, Open Matching, MutualAcceptance, Connection, ConversationThread, Message, Block, Report and moderation interfaces.
138. The MVP includes SafetySignal and SafetyEvent APIs.
139. The MVP includes DatasetDefinition, DatasetVersion, DatasetLock, AnalysisRun and ResearchFinding interfaces.
140. A focused event and integration surface is preferred over publishing every Domain Event externally.
141. Large-scale event streaming, public developer APIs, direct ConnectionRequest experience and unrestricted bulk or messaging APIs are deferred.
142. Version 1.2 revalidates Document 15 against Document 8 v3.2.
143. Version 1.2 resolves downstream API and event consequences of HC-002, HC-003, HC-004 and HC-008.
144. Interface evolution preserves Participant autonomy, accessibility, domain meaning, social safety, moderation confidentiality and research reproducibility.

---

## 111. Summary

The API, Event & Integration Specifications define how every Platform boundary preserves domain authority, Participant control, social safety and research traceability.

The central command path is:

```text
Authenticate
        ↓
Resolve Organisation, Role, Purpose and Context
        ↓
Evaluate Relationship, Consent,
SpecificPermission and ResourceState
        ↓
Apply Visibility, Block and Domain Preconditions
        ↓
Execute Owning-Module Command
        ↓
Persist Aggregate State and Outbox Atomically
        ↓
Return Exact Confirmed Result or Operation
        ↓
Audit and Trace
```

The canonical Open Matching and Connection path is:

```text
MatchCandidate
        ↓
Independent MatchDecision by Each Actor
        ↓
MutualAcceptance
        ↓
Connection
```

The canonical messaging interface path is:

```text
Current CommunicationBasis
        ↓
ConversationThread
        ↓
Message Draft
        ↓
Actor-Specific SendConfirmation
        ↓
MessageQueued
        ↓
MessageSent
        ↓
MessageProviderAccepted
        ↓
MessageDelivered or MessageDeliveryFailed
```

The provider path is:

```text
M18 MessageQueued
        ↓
M16 Communication Adapter
        ↓
Provider Submission
        ↓
Authenticated Idempotent Callback
        ↓
Canonical M18 Delivery Command
        ↓
Message Delivery State
```

The central event path is:

```text
Completed Domain Fact
        ↓
Transactional Outbox
        ↓
Domain Event
        ↓
Optional Stable Integration Event
        ↓
Idempotent Consumer
        ↓
Current Authorised Detail Retrieval
```

UX Analytics Events remain a separate layer and do not prove domain completion.

The central AI Tool path is:

```text
AIInteraction
        ↓
Effective AI Permission
        ↓
Typed Tool Contract
        ↓
Exact Confirmation or Human Review
        ↓
Owning-Domain Command
        ↓
Structured Exact-State Result
```

The central research interface path is:

```text
DatasetDefinition
        ↓
DatasetVersion
        ↓
DatasetLock
        ↓
AnalysisPlan
        ↓
AnalysisRun
        ↓
InterpretationRecord
        ↓
ResearchFinding
```

The central rule is:

> No client, event consumer, UX analytics event, integration, provider, analytical process or AI Tool gains authority merely because an interface makes an action technically reachable.

Interfaces must remain explicit, versioned, minimum-necessary, permission-aware, provenance-preserving and exact about Draft, confirmation, queue, send, provider acceptance, delivery, failure and approval.
