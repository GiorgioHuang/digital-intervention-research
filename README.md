# Healthy Aging Digital Intervention Research Platform

Modular-monolith MVP implementation of the Architecture Handbook in `docs/`
(canonical versions per `docs/appendices/Appendix-D-*`). Implementation
governance: `IMPLEMENTATION_PLAN.md`, `IMPLEMENTATION_BASELINE.md`,
`IMPLEMENTATION_DECISIONS.md`, `TRACEABILITY_IMPLEMENTATION_MATRIX.md` +
`traceability.yaml`.

> Status: engineering foundation (Phase P0–P1). Not production-ready, not
> ethics-approved, not suitable for real Participant recruitment (ATR-025
> pending).

## Layout

| Path | Purpose |
|---|---|
| `apps/api` | HTTP API process (NestJS) — health/readiness only so far |
| `apps/worker` | Outbox publisher + durable job queues (pg-boss) |
| `apps/scheduler` | Recurring schedules (owns cron; worker executes) |
| `packages/kernel` | Technical kernel: request context, structured errors (Doc 15 §31 codes), prefixed UUIDv7 IDs, deterministic clock, log redaction (Doc 14 §61) |
| `packages/database` | PG pool, transactions, transactional outbox/inbox, append-only audit, SQL migrations |
| `packages/modules/mNN-*` | M01–M18 logical modules (arrive from Phase P2; only `contracts/` is importable across modules — enforced by dependency-cruiser) |
| `docs/` | Canonical Handbook — read-only, never edited by implementation |

## Local development

Requirements: Node 22+, pnpm 10+, PostgreSQL 16 (via `docker compose up -d postgres` or a local cluster).

```bash
cp .env.example .env
pnpm install
pnpm dev:deps          # postgres + minio (or start your own PG 16)
pnpm migrate           # apply SQL migrations
pnpm build
pnpm test              # unit + integration (DB tests auto-skip if PG unreachable)
pnpm lint && pnpm depcruise && pnpm traceability:check

# run processes (each reads .env-style variables from the environment)
node apps/api/dist/main.js        # GET /health, GET /ready
node apps/worker/dist/main.js
node apps/scheduler/dist/main.js
```

Migration drill: `pnpm migrate` / `pnpm migrate:down` (one step) /
`pnpm migrate:reset` (all). CI runs up → reset → up on every push.

## Rules that CI enforces

- Cross-module imports of `domain/`, `application/`, `infrastructure/` are
  forbidden (ADR-008); only `contracts/` is public.
- Deprecated event aliases (`MatchCompleted`, `MessageDeliveryConfirmed`,
  `ActorBlocked`, `UserReported`, `SafetyEventDetected`,
  `DatasetLockConfirmed`, …) fail lint (Appendix B).
- `traceability.yaml` entries marked `implemented`/`verified` must point at
  existing code and test files.
