# Healthy Aging Digital Intervention Research Platform

A reference implementation of a research platform for **digital interventions in healthy aging** — the study of how digital tools might support a meaningful, connected, self-directed later life, and of how a platform for that research would have to be built to be worth trusting.

It is a working modular monolith (TypeScript, NestJS, PostgreSQL, React) covering eighteen domain modules, from consent and permission through matching, messaging, safety and research lineage. It runs end to end on synthetic data.

> ### What this is not
>
> **This is a conceptual research prototype (ADR-061/062), not a product.**
>
> - Every participant, message, assessment and outcome in it is **synthetic**. Nothing here describes anything that happened to a real person.
> - It has **no ethics approval** (ATR-025) and must not be used to recruit or study real participants.
> - Providers are deterministic simulators: AI, communications and malware scanning are stubs, and identity is a development stub unless Google sign-in is configured.
> - Nothing it produces is empirical evidence. What a prototype like this *can* show is whether the model is coherent — whether an invariant survives a case designed to break it, whether a definition stays stable under use.

## What it is for

The platform models a research programme, so the domain is the research as much as the intervention:

- **Participants** hold their own record: granular consent per purpose, a Life Story they author, control over who may see what, and the ability to pause or leave at any time.
- **Supporters** — a family member, a friend — can contribute to someone's life story and be written to, but only within what that person authorised, and their contribution never becomes the participant's own testimony.
- **Staff** work in queues rather than by typing identifiers: coordinators enrol, researchers draft, approvers decide, moderators judge content, and safety reviewers triage signals.
- **The research chain** is kept separable end to end: dataset → locked version → analysis run → output → interpretation → finding, each step a distinct artefact with its own approval.

## The ideas the code is built around

These are not aspirations in a document; each is enforced somewhere and has a test that fails when it stops being true.

**Effective Permission is a function, not a role check.** Seven elements — role, relationship, consent, purpose, context, specific permission and resource state — are evaluated for every decision, with the result written to an audit row. The engine is a pure function with every input explicit and no I/O of its own, which is what makes a decision reproducible and explainable after the fact.

**Protected existence.** "This does not exist" and "you are not permitted" are indistinguishable by design. A refusal that names the gate that stopped you confirms the record exists, so refusals do not name it.

**Human authority over consequential actions.** Automation can raise a safety signal and can never confirm one. Seventeen AI actions are refused by name. Approvals enforce separation of duties in both the command layer and a database constraint.

**Draft is not sent; accepted is not delivered; a contribution is not testimony.** State vocabularies are kept deliberately un-merged, and the wording never overstates: "the sending service accepted it" is not "they received it", and unknown stays unknown rather than quietly becoming delivered.

**A control that records a decision nothing reads is not a control.** Repeatedly, a screen was *not* built because the platform could not honour what it would appear to promise — and the interface says so, with the condition that would unlock it. An invented label is worse than an absent one: absence is legible, a label reads as though somebody checked.

**Synthetic is marked as synthetic.** The staff workspace states up front that nothing on it is empirical evidence, and equally that per-item epistemic tags are *not* implemented, because no field records one.

## Architecture

| | |
|---|---|
| **Shape** | Modular monolith — one codebase, eighteen logical modules, three processes (API, worker, scheduler) |
| **Back end** | TypeScript (strict), Node 22, NestJS |
| **Data** | PostgreSQL 16, one database with a schema per module; 29 reversible SQL migrations, rehearsed up → down → up on every push |
| **Async** | Transactional outbox + idempotent inbox, pg-boss for durable queues |
| **Front end** | React 18 + Vite; one stylesheet of semantic design tokens, no UI framework |
| **Boundaries** | Only a module's `contracts/` is importable by another, enforced by dependency-cruiser in CI. (A database role per module is in the plan and is *not* implemented — the boundary is currently enforced statically, not by the database.) |
| **External** | Every dependency behind an anti-corruption layer. The Healthy Aging Knowledge Graph is a **real** MCP integration; the rest are simulators |

Modules M01–M18: identity and organisation, participant, consent and permission, research design, enrolment, intervention portfolio, delivery, assessment, safety, evidence, AI governance, dataset, analysis, reporting, governance, integration, life story, community and social.

## Layout

| Path | Purpose |
|---|---|
| `apps/api` | HTTP API (NestJS) — commands, queries, OpenAPI |
| `apps/worker` | Outbox publisher, sweeps, reconciliation, object scanning |
| `apps/scheduler` | Recurring schedules (owns cron; the worker executes) |
| `apps/web` | Participant, staff and supporter workspaces |
| `packages/kernel` | Request context, structured errors, prefixed UUIDv7 ids, deterministic clock, log redaction |
| `packages/database` | Pool, transactions, outbox/inbox, append-only audit, migrations |
| `packages/policy` | The deterministic Effective Permission engine and the action catalogue |
| `packages/modules/mNN-*` | The eighteen domain modules |
| `docs/` | The upstream Architecture Handbook — **read-only, never edited here** |
| `governance/` | Implementation baseline, decisions and plan; threat model, security and privacy, accessibility, pilot readiness |
| `research/` | The conceptual research programme: baseline, plan, concept catalogue, contradiction register, synthetic pilot |
| `design/` | Design brief, UI inventory, design system, decision log, and the three workspace specifications |
| `operations/` | Deployment and the Knowledge Graph integration |
| `tools/`, `scripts/` | Traceability checkers and operational scripts |

`docs/` holds the upstream Handbook, and everything this repository writes lives outside it. That boundary is why there are four directories rather than one `docs/` for all of it: the Handbook is the authority, and this repository must never be able to edit its own authority.

### Where to start

| If you want to | Read |
|---|---|
| deploy it, or understand the environment | `operations/DEPLOYMENT.md` |
| know what is built, and what is honestly not | `governance/IMPLEMENTATION_BASELINE.md`, then `governance/PILOT_READINESS_REPORT.md` |
| know why something was built that way | `design/DESIGN_DECISIONS.md` (D-1…D-90) and `governance/IMPLEMENTATION_DECISIONS.md` (the ADR dispositions) |
| change an interface | `design/DESIGN_BRIEF.md`, then the workspace specification in `design/` |
| understand the research framing | `research/CONCEPTUAL_RESEARCH_PLAN.md` |
| see where the model contradicts itself | `research/CONTRADICTION_REGISTER.md` |
| trace a requirement to its code and tests | `traceability.yaml` (+ `research-traceability.yaml`), whose rules are in `governance/TRACEABILITY_IMPLEMENTATION_MATRIX.md` |

`design/DESIGN_DECISIONS.md` is the most useful file for understanding the project's character: ninety rulings, most of them recording something that looked finished and was not.

Both traceability files stay at the repository root deliberately — the checkers read them from there, and one of them fails on finding a `traceability.yaml` anywhere else, because a misplaced copy once meant an entry was silently never checked.

## Local development

Requirements: Node 22+, pnpm 10+, PostgreSQL 16 (`docker compose up -d postgres`, or your own cluster).

```bash
cp .env.example .env
pnpm install
pnpm dev:deps          # postgres (+ minio; see the note in the baseline)
pnpm migrate           # apply the SQL migrations
pnpm build
pnpm test              # unit + integration (database tests skip if PG is unreachable)
pnpm lint && pnpm depcruise && pnpm traceability:check

node apps/api/dist/main.js        # GET /health, GET /ready
node apps/worker/dist/main.js
node apps/scheduler/dist/main.js
```

Migration drill: `pnpm migrate` / `pnpm migrate:down` (one step) / `pnpm migrate:reset` (all). CI runs up → down → up on every push.

The deployed prototype environment is Cloud Run + Neon + Cloudflare R2, deployed automatically once CI is green. `operations/DEPLOYMENT.md` covers the configuration, including how each capability switches on when — and only when — it is fully configured, rather than on a flag day.

## What CI enforces

Beyond build, typecheck, lint and the test suites:

- **Module boundaries.** Cross-module imports of `domain/`, `application/` or `infrastructure/` fail; only `contracts/` is public.
- **Deprecated event names** (`MatchCompleted`, `MessageDeliveryConfirmed`, `ActorBlocked`, `UserReported`, `SafetyEventDetected`, `DatasetLockConfirmed`, …) fail lint — only canonical names are emitted.
- **Traceability.** An entry marked `implemented` or `verified` must point at code and test files that exist, and a `traceability.yaml` outside the root is an error.
- **Migration drill.** Up → down → up against a fresh database.
- **Design-system rules.** Measured contrast ratios, no two semantic colour families sharing a value, every `data-*` mode having a writer, tables inside a scroll container, and confirmation-tier actions having a real confirmation.
- **Deployment guards.** The `workflow_run` trigger's fork conditions and the one-deploy-at-a-time concurrency group are each asserted separately, because an `if:` is the easiest thing to lose in a refactor and losing it turns nothing red.

## Status

Synthetic-pilot validation passes. Readiness for any formal pilot is **Pending External Approval**, and the gaps are listed rather than glossed in `governance/PILOT_READINESS_REPORT.md`: ethics approval, provider contracts, policy values (retention, residency, backup targets), the matching attribute registry, the feed ordering policy, the analysis environment, and accessibility acceptance with real users — for which automated checks are not a substitute.

## Licence and use

Research code, published for reference. It is not a medical device, provides no clinical advice, and must not be used with real participant data.
