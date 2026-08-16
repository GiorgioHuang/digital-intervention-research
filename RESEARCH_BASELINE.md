# RESEARCH_BASELINE

> The initial audit for the conceptual research phase (the Master Prompt v1.2 "Required Initial Audit"). Audited as at 2026-07-31; the counts in §1 were re-verified on 2026-08-16. Every claim carries its epistemic status (the vocabulary of Doc 19 v1.3 §10).

## 1. Repository structure and the current technology stack `[Prototype Observation]`

- A pnpm workspaces monorepo: `apps/{api,web,worker,scheduler}` + `packages/{kernel,database,policy,synthetic-pilot}` + `packages/modules/m01…m18` (**18 module packages** — one per module domain, M14 and M15 included).
- TypeScript strict / Node 22 / NestJS / PostgreSQL 16, one database with several schemas / node-pg-migrate pure-SQL migrations (**29** of them, all reversible and rehearsed on every push) / pg-boss / React 18 + Vite.
- External dependencies (checked 2026-08-07, object storage rechecked 2026-08-16): the **Knowledge Platform is a real integration** (ADR-110 — a live MCP endpoint, not a simulator); **object storage is Cloudflare R2 (ADR-106) and is connected** — all four settings are present and the running revision has reported `fileStorage: object-store` at `/ready` since 2026-08-08, though **the first real round-trip is still unverified** (no byte has entered the bucket from a browser session); a deployment with none of the four settings falls back to a Postgres simulator, and a half-configuration refuses to start. **Still deterministic simulators** are the communications provider (HMAC callbacks + replay protection), the model/tool gateway, the malware scanner (ADR-126) and identity (the dev-header stub, ADR-104). CI runs the whole deterministic suite on every push.
- Governance artefacts: traceability.yaml (**154 entries**, validated by a tool), IMPLEMENTATION_BASELINE, PILOT_READINESS_REPORT, SECURITY_AND_PRIVACY_PLAN, THREAT_MODEL, ACCESSIBILITY_TEST_PLAN, SYNTHETIC_PILOT_PLAN.

> **Counts corrected on 2026-08-16.** This section previously recorded 16 module packages, 26 migrations, 124 traceability entries and "576 deterministic tests". The first three are now counted from the tree as above. The test total was removed rather than replaced: only the suites that need no database can be run here (kernel 50, policy 30, web 375 — all green on 2026-08-16), and a static count of test declarations across the whole repository gives 756, so the old figure is certainly stale but a single verified total is not available outside CI. A stale exact number reads as evidence; that is why it is not left standing.

## 2. The authoritative versions checked out `[Source-Derived]`

Per README v2.9 (the file that declares the new baseline): Doc 0 v1.2; Doc 1 v2.2 (Active Conceptual Research Foundation); Doc 2 v2.1; Doc 3 v2.3; Doc 4 v3.0; Doc 5 v2.1; Doc 6 v3.1; Doc 7 v3.0; Doc 8 v3.2; Doc 9 v1.1; Doc 10 v1.1; Doc 11 v1.2 (Active Conceptual Research and Theoretical Evaluation Baseline); Doc 12 v1.2; Doc 13 v1.2; Doc 14 v1.1; Doc 15 v1.2; Doc 16 v1.2; Doc 17 v1.1 (assumed — README governs); **Doc 18 v1.3 (Conceptual Research Scope & Prototype Roadmap); Doc 19 v1.3 (Conceptual Research Programme, CRP-HA-DIRP-001, no human-subjects approval required); Doc 20 v1.3 (Conceptual Prototype UX)**.

**The current project mode** (Doc 1 v2.2 §3.1 / Doc 18 v1.3 §3.2 / Doc 19 v1.3 §2): a conceptual and theoretical research project that may begin immediately; ethics, institutional governance, provider and production-readiness approvals are **not preconditions for the current theoretical work**; consent, safety and approval as they appear in the Handbook are all to be read as **properties of the future system being modelled**, not as gates on the current research.

## 3. The existing conceptual model and code `[Prototype Observation]`

The implementation as it stands is the candidate entity for what Doc 18 v1.3 §4 calls an "executable research artefact": the whole M01–M18 domain, the seven-element Effective Permission engine, the three Life Story authorship states, the full matching → mutual acceptance → connection chain, the twin message state machines, fail-closed Block, human authority over safety, the AI governance gateway (Level-5 wholly prohibited), dataset lineage, approvals / governance holds / break-glass, and the end-to-end synthetic pilot cycle (roughly the full chain of Doc 18 §169 Milestone 13). Doc 18 v1.3 is silent on reusing the existing code — neither authorising nor forbidding it; how this baseline disposes of that is in §9.

## 4. The current research questions `[Source-Derived]`

Doc 19 v1.3 §7 gives five primary questions and §8 five secondary ones, with no alphanumeric IDs (the document presents them as a numbered list); this repository refers to them internally as `RQ-P1…P5 / RQ-S1…S5` (a `Design Assumption` — the numbering is a repository convenience, not document authority). Details in CONCEPTUAL_RESEARCH_PLAN.md.

## 5. The conceptual implementation status of M01–M18 `[Prototype Observation]`

All 18 module domains have implementation and test evidence (see IMPLEMENTATION_BASELINE.md §3/§6 and traceability.yaml). Restated in conceptual-research terms: **the key invariants are already executable** (all ten of the priority invariants in Doc 19 v1.3 §24 have database constraints or triggers plus tests); the gap is in the **research-layer artefacts**: the concept catalogue, the mechanism model, the theoretical propositions, the formal domain model document, the persona framework, the scenario catalogue, the contradiction register and the theoretical findings — that is, the documents and analytical outputs of WP-01…WP-10.

## 6. Contradictions between the code and the Handbook `[Contradiction]` (details in CONTRADICTION_REGISTER.md)

> Updated 2026-08-01: Appendices A v1.3 / C v1.2 / D v2.9 / E v1.9 / F v1.7 have been uploaded, CON-002 and CON-003 are Resolved, and CON-001 has only the Consistency Review file still missing. ADR-061…064 are now on disk (061/062/063 Accepted, 064 Deferred). Appendix A v1.3 **redefines ATR-025** as "the scope boundary of the conceptual research: the current research uses synthetic inputs and begins without external approval; human-subjects research is a separate future project" — and every place this repository cites ATR-025 (in the ethics-pending sense) remains compatible with the new definition, because the conclusion "no real recruitment" holds under both.

- CON-001: of the six governance artefacts README v2.9 cites, five appendices are now in place; `Documents-0-20-Handbook-Consistency-Review-v1.0.md` is still missing (Partially Resolved).
- CON-002: **Resolved** — ADR-061…064 are recorded in Appendix C v1.2.
- CON-003: **Resolved** — E v1.9 has been uploaded and states explicitly that the conceptual mode supersedes the old gates.
- CON-004: Doc 18 v1.3 retains text from v1.2 (§144/157/170/171/178/205/232/234 still speak of ethics approval and recruitment) — governed by the interpretive clause at §3.2 (read as properties of the future system), but citing a passage in isolation yields a contradictory answer.
- CON-005: none of the 21 `Document-N-…` canonical filenames in README §9 matches the actual file layout (volume directories with numeric prefixes); the superseded Doc 18/19/20 v1.2 files are not archived and coexist with v1.3.

Disposition (steps 5–8 of the Master Prompt's authority order): keep the upstream conceptual meaning (README v2.9 + Doc 1 v2.2 + Doc 18/19/20 v1.3 are the current baseline — the latest explicit authority in the spirit of Appendix E §14); register contradictions honestly; do not invent the content of a missing appendix; carry on with the research that is unaffected.

## 7. The synthetic data and fixtures available `[Prototype Observation]`

- `packages/synthetic-pilot`: an end-to-end synthetic research cycle (a FixedClock for determinism, explicit seed suffixes).
- Each module's integration tests embed synthetic scenarios (most of the mandatory list in Doc 18 §210 has a corresponding negative test; the mapping is in SYNTHETIC_PILOT_PLAN.md).
- Missing: a standalone **synthetic data generator** carrying seeds, schema versions, scenario IDs and provenance labels (WP-06), and the **persona framework** (WP-05).

## 8. Hidden assumptions in the code `[Inference]` (research objects, to be dug into in WP-09)

1. The identity mapping assumes account↔participant is one-to-one (`findParticipantIdByAccount` returns a single value).
2. The matching TTL and the mutual-acceptance validity window come from `DEFAULT_MATCHING_CONFIG` — the numbers are a design assumption, not a theoretical derivation.
3. The delivery-unknown threshold (120 minutes) is operational intuition, with no mechanism model behind it.
4. Data classification is a static mapping from the type of the owning resource — which carries the contestable proposition that sensitivity is fully determined by type.
5. The role→permission grant matrix in the policy catalogue contains several unargued judgement calls (for example, a Supporter holding no read permission beyond contributions).

## 9. The first research work package proposed `[Design Assumption]`

**WP-01, the concept and terminology audit** (started alongside this baseline — see CONCEPT_CATALOGUE.md). The reasoning: making the concepts explicit is the precondition for Doc 19 §7's primary question 1, "is the framework internally coherent?"; and the existing code already implements a large number of conceptual distinctions as executable invariants (Draft ≠ Testimony, Accepted ≠ Delivered, Signal ≠ Event, Output ≠ Finding) — so the concept catalogue can anchor each definition directly to executable evidence, which is this repository's distinctive leverage over purely documentary research.

How the artefacts from the earlier production track are disposed of: **keep them and requalify them** — IMPLEMENTATION_BASELINE, PILOT_READINESS_REPORT and the rest continue to describe the code faithfully in their original context; the new research-layer artefacts (from this file onward) are written under the epistemic discipline of Doc 19 v1.3. The two are cross-linked through traceability and do not rewrite one another.
