# THREAT_MODEL

> Status as of 2026-07-31. Method: enumerate threats by trust boundary (STRIDE categories), set against the **mitigations actually implemented** (with code/test evidence) and the **residual risk**. The honesty principle: where there is no mitigation, say so; a simulator is not real protection.

## 1. System trust boundaries

```
[browser web] --HTTP--> [API (NestJS)] --SQL--> [PostgreSQL, one database, many schemas]
                          |                        ^
                          v                        |
              [permission engine / module commands]  [worker/scheduler (pg-boss)]
                          |
              [provider simulators: AI / communication / storage scanning]  <-- real providers pending
```

The boundaries: B1 browser ↔ API; B2 API ↔ database; B3 worker/scheduler ↔ database; B4 platform ↔ external providers (currently simulators); B5 staff ↔ governance data.

## 2. B1 browser ↔ API

| Threat (STRIDE) | Mitigation | Evidence | Residual risk |
|---|---|---|---|
| Impersonating someone (S) | **There are two authentication modes (ADR-104, ruled and implemented).** `AUTH_MODE=google`: Google OIDC, with identity matched on `(issuer, sub)` (**not on the email address** — an email address can be renamed and can be reassigned by a Workspace administrator); self-registration is open (D-69) — but a self-registered account has no role, no relationships and no consents, so step 2 of the permission engine refuses it with `no-granting-role` before it can touch any resource that is not its own, Open Matching requires both parties to have switched it on, and the community requires a consent, so it can see nobody at all. **Invitations are the only path that grants anything**; `user_accounts.origin` records how each account came about; sessions are revocable server-side (deactivation takes effect immediately, without waiting for a token to expire); and the cookie is HttpOnly + SameSite=Lax and stores only a SHA-256, with cross-site forgery additionally requiring a custom header (which a cross-site form cannot set). `AUTH_MODE=dev-header`: the development / synthetic-pilot stub, with **no real authentication**; such an environment must not be exposed publicly. The permission engine adjudicates ownership by the actor↔participant identity mapping. The cloud deployment has a further compensating boundary (DEPLOYMENT.md): the `ACCESS_TOKEN` shared-secret gate (constant-time comparison, intercepting all of /v1, with a 401 in the standard envelope), and the deploy workflow fails closed — it deploys with IAM-only ingress **only when neither real authentication nor the token gate is holding the door** (the earlier criterion looked only at the token, so following the documentation and deleting the token to open registration would have taken the site offline, i.e. the old compensating control standing in the way of the very thing meant to replace it) | Engine unit tests + e2e 403/404 + token-gate e2e + token validation unit tests (wrong aud / wrong iss / expired / wrong nonce / symmetric algorithm / the difference between `hd` and an email suffix) + session integration tests (refused without an invitation, a claimed email cannot be inherited by a second Google account, deactivation takes effect immediately, a nonce cannot be replayed, another person's account cannot be used to escalate) | **google mode: medium** — identity is real and revocable; the residual risk is the operator's assertion about `GOOGLE_MFA_DOMAINS` (a Google ID token has no `amr`, so a second factor cannot be proven from the token). **dev-header mode: high (inherent)** — the token is a boundary, not authentication: it is shared, does not distinguish between people, and cannot be revoked for one person; the deployment environment is limited to synthetic data (ADR-062) |
| Accessing another person's resources beyond one's rights (E) | ownerOnly + protected-existence 404; Block fails closed in real time | e2e: profile/object/conversation/queue probes across identities all give 404/403 | Low |
| Existence enumeration (I) | DenyAndHideExistence, a uniform 404 | Asserted in several e2e places | Low |
| Tampering with or replaying a command (T/R) | Idempotency records (a uniqueness constraint on scope); version-bound commands (expectedVersion/412) | Database integration tests; e2e 412 | Low |
| An unconfirmed destructive operation (T) | Everything in the confirmationRequired tier gives 409 CONFIRMATION_REQUIRED; the frontend confirmation dialog comes before any POST | Component tests assert "zero requests before confirmation" | Low |
| Malicious upload (T/D) | Type allow-list, size limit, quarantine + scan, removal of malicious samples, a DB CHECK as backstop | 6 m16 integration tests | Medium: the scanner is a simulator, and real malware detection awaits a provider |
| DoS (D) | **No rate limiting** | — | **Medium: rate limits/quotas to be implemented once the hosting platform is settled** |

## 3. B2/B3 application ↔ database

| Threat | Mitigation | Evidence | Residual risk |
|---|---|---|---|
| SQL injection (T) | Parameterised queries throughout (no SQL built by string concatenation) | A code-review convention | Low |
| Rewriting governance data by bypassing the application layer (T/R) | Invariants pushed down into DB CHECKs/triggers: audit/decision/drill records are append-only, a self-approval CHECK, the Available gate, a single-consumption CHECK, and approved versions are immutable | Each module's integration tests assert direct SQL attacks | Low |
| Worker acting beyond its rights (E) | Sweeps are injected with a fail-closed permission stub (calling it throws); sweeps make time-driven transitions only | `apps/worker/src/main.ts` | Low |
| Lost or duplicated events (T/D) | An atomic outbox transaction pair + visibility-timeout recovery + idempotent inbox consumption | Database integration tests | Low |
| A backup that cannot be restored (D) | An automatic drill on every push: restore + row counts + structure + behavioural probes | `tools/backup-restore-drill.mjs` + CI | Medium: the production backup strategy, off-site copies and encryption await ADR-121 |

## 4. B4 platform ↔ external providers

| Threat | Mitigation | Evidence | Residual risk |
|---|---|---|---|
| Forged callback (S/T) | HMAC signature verification | m16 negative tests | Low (key management awaits productionisation) |
| Callback replay (T) | The nonce is globally unique, and a repeat is an idempotent no-op | m16 tests | Low |
| A provider lying about delivery (R) | Two state machines: Provider Accepted ≠ Delivered; reconciliation on timeout moves to Delivery Unknown, and success is never assumed | Messaging tests + sweep tests | Low |
| An AI acting beyond its rights (E) | The Tool Gateway refuses 17 Level-5 items by name; AI can only produce a signal; model aliases are allow-listed | m11 integration tests | Medium: needs re-assessment once a real model is connected (the prompt-injection surface) |
| Supply chain (once a real SDK is introduced) | **Not mitigated** — there is currently no real provider dependency | — | A dependency review is due once a provider is chosen |

## 5. B5 staff ↔ governance data

| Threat | Mitigation | Evidence | Residual risk |
|---|---|---|---|
| One person abusing their authority (E/R) | Separation of duties (submitting ≠ approving, in code and in a CHECK); MFA-tier operations; full audit | e2e self-approval 403 | Low |
| A moderator retaliating against a reporter (I) | The reporter's identity never enters the moderation queue payload | e2e assertions on the raw JSON | Low |
| Abuse of emergency access (E/R) | Break-glass: MFA + reason/scope/expiry + a mandatory retrospective review by someone else (role separation) | m15 tests + e2e | Low |
| Rewriting a decision after the fact (R/T) | Moderation decisions, approval history and drill records are append-only (triggers) | Direct SQL attack tests | Low |
| Peeking into a queue beyond one's rights (I) | Queue reads are isolated by role (an approver has no triage queue, and vice versa) | e2e cross-role 403 | Low |

## 6. The top residual risks (in priority order)

1. **Authentication**: ADR-104 has been ruled and implemented as Sign in with Google (D-68). An environment still running on `AUTH_MODE=dev-header` has **no real authentication and must not be exposed publicly**; the steps to switch are in DEPLOYMENT.md, "Switching on Sign in with Google". What remains: the strong-authentication tier depends either on the operator's assertion that a Workspace domain enforces two-step verification, or on a re-authentication (step-up) each time.
2. **No rate limits or quotas** — to be implemented once the hosting platform is settled; currently limited to a synthetic environment.
3. **Scanning, AI and communication are all simulators** — each needs its threat assessment redone when a real provider is connected (the interfaces do not change; an ACL adapter is swapped in).
4. **Encryption in transit and at rest, and key management, are not in place** — dependent on hosting approval (ADR-103/119/121).
5. **The prompt-injection surface has not been assessed** — this must be done before a real LLM is connected (the Tool Gateway allow-list is the first line of defence, not the whole of it).

## 7. Maintenance convention

When a trust boundary is added or a provider is connected, update this file and cite the corresponding traceability entry in the PR; when any "residual risk" is closed, code and test evidence must accompany it, kept in step with PILOT_READINESS_REPORT.
