# Healthy Aging Digital Intervention Research Platform

Modular-monolith MVP implementation of the Architecture Handbook in `docs/`
(canonical versions per `docs/appendices/Appendix-D-*`).

> Status: engineering foundation (Phase P0–P1). Not production-ready, not
> ethics-approved, not suitable for real Participant recruitment (ATR-025
> pending).

## Layout

| Path | Purpose |
|---|---|
| `apps/api` | HTTP API process (NestJS) |
| `apps/worker` | Outbox publisher + durable job queues (pg-boss) |
| `apps/scheduler` | Recurring schedules (owns cron; worker executes) |
| `packages/kernel` | Technical kernel: request context, structured errors (Doc 15 §31 codes), prefixed UUIDv7 IDs, deterministic clock, log redaction (Doc 14 §61) |
| `packages/database` | PG pool, transactions, transactional outbox/inbox, append-only audit, SQL migrations |
| `packages/modules/mNN-*` | M01–M18 logical modules (only `contracts/` is importable across modules — enforced by dependency-cruiser) |
| `docs/` | Canonical Handbook — **read-only, never edited by implementation** |
| `governance/` | Implementation baseline, decisions and plan; the assurance artefacts (threat model, security and privacy, accessibility, pilot readiness) |
| `research/` | The conceptual research programme (Doc 19): baseline, plan, concept catalogue, contradiction register, synthetic pilot |
| `design/` | The design brief, the UI inventory, the design system and its decision log, and the three workspace specifications |
| `operations/` | Deployment and the Knowledge Graph integration |
| `tools/`, `scripts/` | The traceability checkers and one-off operational scripts |

`docs/` holds the upstream Handbook and everything this repository writes
lives outside it — that boundary is the reason the four directories above
exist rather than one `docs/` for all of it.

### Where to start

| If you want to | Read |
|---|---|
| deploy it, or understand the environment | `operations/DEPLOYMENT.md` |
| know what is built and what is not | `governance/IMPLEMENTATION_BASELINE.md` |
| know why something was built that way | `design/DESIGN_DECISIONS.md` (D-1…D-89) and `governance/IMPLEMENTATION_DECISIONS.md` (the ADR dispositions) |
| change an interface | `design/DESIGN_BRIEF.md`, then the workspace spec in `design/` |
| understand the research framing | `research/CONCEPTUAL_RESEARCH_PLAN.md` |
| trace a requirement to its code and tests | `traceability.yaml` (+ `research-traceability.yaml`), whose rules are in `governance/TRACEABILITY_IMPLEMENTATION_MATRIX.md` |

Both traceability files stay at the repository root deliberately: the
checkers read them from there, and one of them fails on finding a
`traceability.yaml` anywhere else — a misplaced copy once meant an entry
was silently never checked.

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
