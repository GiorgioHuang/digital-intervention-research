# SECURITY_AND_PRIVACY_PLAN

> Status as of 2026-07-31. This plan describes the security/privacy controls that are **implemented with test evidence**, and the items that are **not yet met and must not be claimed as met**. Basis: Handbook Doc 14 (security/privacy/consent architecture), Doc 15 (API conventions), Doc 4 (the consent model). Vocabulary: `Implemented / Verified / Pending External Approval / Deferred`.

## 1. Identity and authentication

| Control | Status | Evidence |
|---|---|---|
| Production identity authentication (OIDC/Keycloak) | **Pending External Approval (ADR-104)** | — |
| The development-period dev-header stub (enabled only by an explicit AUTH_MODE=dev-header; production mode refuses to start) | Implemented | `apps/api/src/http-context.ts`, `apps/api/src/config.ts` |
| Authentication-strength tiers (password / step-up / mfa) carried with the request and adjudicated by the policy engine | Implemented | `packages/policy/src/engine.ts`; e2e: approving without MFA → 401 STEP_UP_AUTHENTICATION_REQUIRED |
| The MFA-required list (protocol/intervention/finding approval, DatasetLock, SafetyEvent transitions, export approval, approval decisions, break-glass) | Implemented | Each `minimumAuthStrength: 'mfa'` entry in `packages/policy/src/catalogue.ts` |

**The gap (which must not be claimed as met)**: real IdP integration, session management, credential policy and real MFA factors — all to be implemented once ADR-104 is approved.

## 2. Authorisation: Effective Permission

- A seven-element engine (Role + Relationship + Consent + Purpose + Context + SpecificPermission + ResourceState) + Visibility/Block/participant identity mapping, evaluated deterministically in 12 steps. Implemented: `packages/policy/src/engine.ts` (27 unit tests).
- **Protected existence** (ADR-050): a refusal on a protected resource is always `DenyAndHideExistence` → 404, which does not leak whether the resource exists. e2e coverage: probes of another person's profile/object/conversation/signal all give 404.
- **Fail closed**: an unknown action is refused; an unmapped resource type is refused; a missing consent is refused; and Block takes effect immediately on read (after `m18 createBlock`, the policy service looks it up on every evaluation).
- Every evaluation writes a `PolicyDecision` record (M03), including the policy version number.

## 3. Consent and purpose limitation

- Consent is recorded scope by scope (never as one global boolean); withdrawal atomically publishes `ConsentWithdrawn` and propagates it (verified by synthetic pilot scenario 30: withdrawal stops new data, and a locked dataset is not rewritten).
- Evaluated at the point of use: an expired or withdrawn consent is void at the very next permission evaluation — this does not depend on a sweep. Expiry of a relationship is reconciled for existing state by a sweep (belt and braces, `m03 sweeps.ts`).
- The purpose code (X-Purpose-Code) is carried through the request context and into the audit and the events.

## 4. Data protection

| Control | Status | Evidence |
|---|---|---|
| Message bodies are excluded from logs/events/indexes by default | Implemented | Outbox payload minimisation (the Doc 15 §61 comment + the comment on `platform_kernel.outbox_messages`); the reporter's identity does not enter the moderation queue (e2e asserts on the raw JSON) |
| Log redaction | Implemented | `packages/kernel/src/logging.ts` SENSITIVE_KEY_PATTERNS + pino redact in the worker/scheduler |
| The upload quarantine/scan pipeline (type allow-list, size limit, sha256, removal of malicious samples, no release on a failed scan, inherited classification) | Implemented | `m16 storage-pipeline.ts` + the CHECK in migration 0018; 6 integration tests |
| Research exports are never identifiable (forbidden at both the type layer and by a DB CHECK) | Implemented | `m14` + migration 0017 |
| Data classification (Public…Safety-Critical) stored with the object | Implemented (in the object-storage domain) | Migration 0018 |
| Envelope encryption of message bodies | **Pending (ADR-117)** — the exclude-by-default policy goes first for now | — |
| Encryption at rest / in transit and key management | **Pending External Approval** (dependent on the hosting platform, ADR-103/119/121) | — |

## 5. Audit and governance

- Append-only audit (`governance_audit.audit_events`, with triggers refusing UPDATE/DELETE, verified by integration tests); each record carries actor, action, target and policy version.
- Separation of duties forbidden at two layers (code + DB CHECK): self-approval of a protocol, intervention, report, export or M15 approval is impossible.
- Break-glass: MFA + confirmation + reason/scope/expiry, with a mandatory retrospective review **by someone else** (the roles separate naturally: a SystemAdministrator executes, a PrivacyReviewer reviews).
- The backup-restore drill runs automatically on every push and verifies that the append-only guarantees still hold in the restored database; the drill records are append-only (`tools/backup-restore-drill.mjs`).

## 6. Integration and supply chain

- External providers: **object storage has been chosen — Cloudflare R2 (ADR-106, ruled 2026-08-07) — but is not yet connected**; the credentials are not configured and it still goes through the Postgres simulator. **AI / communication / IdP / hosting / malware scanner (ADR-109/111/104/103/126) are still unchosen**: deterministic simulators + an ACL interface, failing closed. The scanner had no number in the ADR register until 2026-08-07, when it was added as ADR-126.
- Provider callbacks: HMAC signature verification + nonce replay protection (`m16 provider-adapter.ts`, with negative tests: forged, replayed and unknown references all refused).
- AI governance: the Model Gateway allow-lists aliases; the Tool Gateway refuses 17 Level-5 forbidden actions by name; AI can only produce a SafetySignal and can never produce a SafetyEvent.

## 7. Operational security

- Idempotency records + an at-least-once outbox + visibility-timeout recovery (no event is lost); delivery-unknown reconciliation (delivery is never assumed).
- CI on every push: build/lint/boundary checks/migration drill/full test suite/backup drill.
- Secret management, network boundaries, WAF and penetration testing: **Pending External Approval** (the hosting platform is undecided).

## 8. Action plan (in the order approvals unlock it)

1. ADR-104 approved → OIDC integration (replacing the dev-header stub, keeping the M01 UserAccount authoritative), and real MFA factors.
2. Hosting platform approved (ADR-103) → encryption at rest and in transit, key management, network boundaries and secret management land.
3. ADR-117 approved → envelope encryption of message bodies implemented.
4. Provider contracts → the simulators are replaced one at a time by real ACL adapters (the interfaces do not change, see THREAT_MODEL §6).
5. Penetration testing and an independent security review: carried out once the real infrastructure is ready and before any real recruitment (a readiness-gate item).

**This plan does not change the readiness-gate judgement: recruitment of real participants must not begin before ethics approval and the external approvals above have been obtained.**
