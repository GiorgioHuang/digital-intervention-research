# IMPLEMENTATION_BASELINE

> The initial repository audit (required by the Master Prompt's "Required Initial Repository Audit"). Kept up to date as the implementation advances; the status vocabulary is `Not Started / Scaffolded / Implemented / Verified / Blocked / Deferred / Pending External Approval`.
>
> §1 and §2 record the greenfield audit as it stood at the time; every later re-check carries its own date inline. The test counts in §3 were recounted on 2026-08-16 — see the note under that table.

## 1. The state of the repository

- Repository contents at the time of the audit: `docs/` (the full Architecture Handbook v2.7: Documents 0–20 plus Appendices A–F) and the root-level implementation governance files. **No legacy code, no CI, no migrations, no environment files.** A greenfield implementation, with no legacy to migrate or retire.
- Authoritative versions: per `docs/appendices/Appendix-D-Handbook-Version-and-Status-Matrix-v2.7.md`, Documents 0–20 were all Reviewed (Document 19 Reviewed–Draft, ethics approval Pending). The Appendix F v1.5 conflict register held no open conflicts.

## 2. The language, framework and package manager chosen (details in IMPLEMENTATION_DECISIONS.md)

- TypeScript (strict) / Node.js 22 / a pnpm workspaces monorepo.
- NestJS on the back end (the API process), with Worker and Scheduler as separate entry points in the same codebase; React + Vite PWA on the front end (introduced in a later phase).
- PostgreSQL 16, one database with several schemas; pure-SQL migrations (node-pg-migrate) + Kysely typed queries; pg-boss for the durable queue.
- Local dependencies: docker-compose (PostgreSQL, MinIO, Keycloak-dev). (**Checked 2026-08-07**: nothing in the code connects to the MinIO container — `BlobStore` reads only R2's four settings, falls back to the Postgres simulator when they are unset, and the R2 adapter builds its endpoint from the account ID, so it cannot be pointed at MinIO. It is a local dependency with no consumer.)

## 3. The state of the applications, services and libraries

| Component | Status |
|---|---|
| `packages/kernel` (RequestContext, structured errors, clock, IDs, log redaction) | Implemented (50 unit tests passing) |
| `packages/database` (connection, migrations, the outbox/inbox/audit/idempotency base tables) | Implemented (the integration tests include an up→down→up migration rehearsal) |
| `apps/api` (the Doc 15 error envelope / context headers / dev-header auth stub + the participant-side command endpoints (including M03 relationship management and the full M17 Life Story chain) + the staff-side command endpoints (M04 protocol chain / M05 enrolment chain / M06 intervention portfolio / M09 safety triage / M12 dataset lineage / M13 analysis chain / M14 reporting and controlled export / M15 approvals, governance holds and break-glass) + the M18 owner read-only queries + OpenAPI) | Implemented (127 tests across 7 files, of which 32 are the e2e suite) |
| `apps/worker` / `apps/scheduler` (the outbox publishing loop + expiry sweeps (candidates / mutual acceptance / relationships) + delivery-unknown reconciliation + stuck-outbox recovery + object scanning + idempotency cleanup; driven by cron and threshold configuration) | Implemented (the sweep integration tests) |
| `packages/policy` permission engine + `m01-identity-org` + `m03-consent-permission` | Implemented (30 engine unit tests + 27 integration tests) |
| `m02-participant` + `m04-research-design` + `m05-enrolment` | Implemented (17 integration tests over the P3 chain) |
| `m06-intervention-portfolio` + `m10-evidence` (the KP simulator by default + a real Healthy Aging Knowledge Graph MCP client; the live-call tests are described in KNOWLEDGE_GRAPH_INTEGRATION.md) | Implemented (22 integration tests, including the real-call and fail-closed tests) |
| `m17-life-story` | Implemented (18 integration tests: the three authorship states / version immutability / visibility / the contribution flow / withdrawal) |
| `m18-community-social` (the full community / matching / connection / messaging chain) + `m16-integration` (provider simulators + callback authentication + object storage isolation and the scanning pipeline) | Implemented (45 + 23 integration tests) |
| `m09-safety` + `m11-ai` (signals and human events; the Model and Tool Gateway, Level-5 wholly prohibited) | Implemented (14 integration tests) |
| `m12-dataset` + `m13-analysis` (DatasetLock / the analysis chain / Finding lineage) | Implemented (11 integration tests) |
| `m07-delivery` + `m08-assessment` (exposure states, typed absence) | Implemented (covered by the synthetic pilot) |
| `m15-governance` (ApprovalRecord with the exact artefact version + a separation-of-duties CHECK, append-only status history, GovernanceHold, mandatory retrospective review of break-glass) | Implemented (7 integration tests) |
| `packages/synthetic-pilot` (the end-to-end synthetic pilot) | Implemented (6 scenario groups) |
| `m14-reporting` (immutable approved report versions / the full controlled-export chain / participant portability export; external submission explicitly deferred) | Implemented (9 integration tests) |
| `apps/web` (participant workspace: task-based home page / fine-grained consent / message confirmation / block and report / safety concerns / optional matching, with sessions, contacts and recommendations all coming from API queries; staff workspace: enrolment coordination / researcher / approver / safety triage / content moderation (a reporter-anonymous queue); supporter workspace: contribution proposals and honest status tracking, driven by a to-do queue, with the MFA tier stated faithfully and decisions confirmed under the decider's name; an HTTP-only boundary) | Implemented (**375 tests across 47 files**) |
| OpenAPI / the event schema catalogue | Scaffolded (openapi/openapi.yaml covers the endpoints that exist) |

> **Test counts recounted 2026-08-16.** This table previously reported 27 component tests for `apps/web`, 27 e2e for `apps/api` and 27 unit tests for the policy engine — figures that stopped being true a long time ago and, read together, gave a misleading picture of how much of the suite each area carries. The `apps/web`, `packages/kernel` and `packages/policy` figures above were produced by running those suites here (375 / 50 / 30, all green). The remaining per-module figures need a live PostgreSQL and could not be run in this environment; they are static counts of `it(`/`test(` declarations in each package's `test/` directory, so they are lower bounds — a `it.each` table expands to more at run time.

## 4. Database and migrations

- A single PostgreSQL instance, with logical schemas laid out per Doc 16 §9 (`identity_org` … `community_social` + `storage_ops` / `search_projection` / `analytics_stage` / `migration_admin`).
- The first migrations created only the cross-cutting base tables: outbox_messages, inbox_messages and idempotency_records under the `platform_kernel` schema, and `governance_audit.audit_events` (append-only). Module schemas were created as each module's phase arrived. There are now 29 migrations, all reversible and rehearsed on every push.

## 5. The state of the API, events, authn/authz, tests, CI and infrastructure

- API: `/health` and `/ready` plus the v1 command endpoints (recording and withdrawing consent, threads, messages, confirm-send), the Doc 15 error envelope with stable error codes, and OpenAPI at `openapi/openapi.yaml`. There are two authentication modes (ADR-104): `google` is the production authentication (Google OIDC, with the session as a server-side revocable HttpOnly cookie), and `dev-header` is an explicit development and synthetic-pilot stub. The remaining module commands are exposed incrementally on the same pattern.
- Authentication: Implemented (ADR-104 settled on Sign in with Google, replacing the Keycloak that had been envisaged). Identity is matched on `(issuer, sub)`, and the email address is used only to claim an invitation once. **Self-registration exists and is on by default** (`ALLOW_SELF_SIGNUP`, owner's ruling 2026-08-08): a self-registered account holds no roles and no relationships, so it reaches nothing but its own resources — the permission engine, not the flag, is what makes that true; a deployment with a fixed cohort turns it off. The `mfa` tier is satisfied by re-authentication (step-up). M01 remains authoritative for UserAccount. Authorization: the Effective Permission engine is Implemented (packages/policy, with M03's PermissionService writing the PolicyDecision).
  - *(Corrected 2026-08-16: this section previously said there was no self-registration, which was true when it was written and stopped being true with migration `1753800000028_self-signup-and-invitation-grants.sql`. See DEPLOYMENT.md, "Self-registration and invitations".)*
- Tests: vitest for unit and integration (testcontainers-style, against a local docker PostgreSQL); CI: GitHub Actions (build / typecheck / lint / depcruise / migration rehearsal / tests / backup-restore rehearsal).
- Deployment assumptions: containerised, single region, hosting platform pending approval (ADR-103/119/121 Pending External Approval).

## 6. M01–M18 capability status

M01/M02/M03/M04/M05 Implemented (identity, participant profile, consent and permission, protocol versions, the full enrolment chain); M15 Implemented (approval records with a separation-of-duties CHECK, governance holds, retrospective review of break-glass, and append-only audit). M06/M10/M17 Implemented (intervention versions, the evidence chain, Life Story). M18 community and matching Implemented (Block / Report / ModerationCase / community / MatchDecision / MutualAcceptance / Connection; ConnectionRequest is feature-disabled). The M18/M16 messaging pipeline is Implemented (CommunicationBasis / the twin state machines / SendConfirmation / callback authentication / replay protection). M09/M11 Implemented (human authority over safety + the AI governance gateway). M12/M13 Implemented (a human DatasetLock + full Output ≠ Interpretation ≠ Finding lineage). M07/M08 and the synthetic pilot Implemented. The remaining gaps are in PILOT_READINESS_REPORT.md (background jobs, the staff-side web workspace, formal approvals).

## 7. Conflicts with the Handbook

- No known conflicts. One thing to watch: the MVP intervention portfolio of Doc 5 §102 disagrees with Doc 3 v2.3; under the Appendix E authority order Doc 3 is adopted (INT-009 + 004 + 001 + 002 as the core, INT-003 as the controlled AI layer). Recorded, with no change to the documents.

## 8. Security / privacy / accessibility / research risks (the initial list)

1. Providers not selected (AI, communications, IdP, hosting, and the malware scanner of ADR-126) → all of them run through deterministic simulators behind ACL interfaces, failing closed (Pending External Approval). **Object storage has been selected and connected — Cloudflare R2 (ADR-106, chosen 2026-08-07, connected 2026-08-08)**; the running revision reports `fileStorage: object-store` at `/ready`, but the first real round-trip has never been walked end to end, so it is configured rather than exercised.
2. Retention, residency and backup policies unapproved (ADR-119/120/121) → configuration-driven, never hard-coded.
3. Ethics approval Pending (ATR-025) → at no stage may this claim that real recruitment is possible.
4. Accessibility acceptance (WCAG AA + the seven modes) needs testing with real users; automation is not sufficient — scheduled into every participant-facing slice from P4 onward.
5. The encryption policy for message bodies is unapproved (ADR-117) → excluded from logs, events and indexes by default, with application-layer envelope encryption first.

## 9. The implementation order proposed

See `IMPLEMENTATION_PLAN.md` §8 (P0–P10, mapped onto MS-00…MS-14, honouring the hard prerequisite constraints of Doc 18 §174).
