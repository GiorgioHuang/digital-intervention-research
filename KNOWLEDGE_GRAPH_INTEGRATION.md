# KNOWLEDGE_GRAPH_INTEGRATION

> The audit and integration report for the Healthy Aging Knowledge Graph + MCP (answering every deliverable of the "Prompt for the Healthy Aging Knowledge Graph Coding Agent"). Audited as at 2026-08-01. Every "real call" below is an actual JSON-RPC round trip against a running aging-knowledge-graph server (a local instance, and the Cloud Run instance in CI), marked `[Prototype Observation]`; the graph's content is itself a **hand-curated seed corpus** (60 nodes / 54 claims / 25 evidence entries), and conclusions about its size are marked `[Source-Derived]`. Under the discipline of Doc 19 v1.3 §10: this report treats nothing the graph returns as an empirical research conclusion of this platform.

## 0. A deployment fact: no new GCP or Neon infrastructure is needed `[Prototype Observation]`

The user's suggestion was "GCP if a server is needed, Neon for the database". The audit found that **the KG is already deployed**: the repository `GiorgioHuang/aging-knowledge-graph` ships `scripts/deploy-cloudrun.sh` and `scripts/neon-setup.ts`, and the service already runs on **Cloud Run (an existing instance; the endpoint is in the repository variable `KNOWLEDGE_MCP_URL`) + Neon (pgvector)**. This integration therefore adds **no infrastructure at all** — the platform calls the endpoint that exists.

- The outbound proxy in this development sandbox refuses CONNECT to that endpoint (403, proxy policy); localhost is unrestricted. So: local development and testing run against a real local KG server (the same code and the same seed corpus, `PORT=8790 npm run serve`); **CI (GitHub Actions, with open egress) points the repository variable `KNOWLEDGE_MCP_URL` at the production instance and makes a real call as a smoke test on every push**. Both paths run the same test suite with the same assertions.

## 1. Readiness assessment

**Partially Ready — the interface and semantic capabilities are ready; corpus size is the current limiting factor.**

- **Ready**: the MCP surface (16 `graceage_*` tools, over both HTTP `POST /mcp` and stdio), structured traceable returns (claim → certainty → sources (DOI/PMID) → quality tiering), knowledge gaps modelled as first-class objects, path queries, and semantic search. For what this platform needs in its **conceptual research phase** (synthetic inputs, theoretical modelling, prototype verification), these capabilities are already sufficient to integrate for real and to drive the M10 evidence chain.
- **A note on the deployed corpus** `[Prototype Observation]`: the real calls CI makes against the production instance show that the deployed corpus (on Neon) is a **superset** of the seed set — it includes ingested literature-source nodes (identified by a `doi:` prefix) — and that server-side semantic search (embeddings + Neon) can exceed 15 seconds on a cold path. The adapter and the tests are calibrated to that reality (the identifier contract is "resolvable within the graph", not the `ga:` naming convention; the client timeout is 45 seconds).
- **Limitations**: the seed baseline corpus is a curated set of 60 nodes / 54 claims / 25 evidence entries — it covers the skeleton of the priority topic domains (loneliness, social connection, reminiscence and life story, digital interventions, knowledge gaps), but is **nowhere near enough to support a real evidence review**; some node types are missing (there is no separate `problem` / `model` / `risk` type); and the graph-level version number is not exposed through the API (the `"version": 6` field exists inside `seed/graph.json`, but neither `/health` nor MCP returns it).
- **Conclusion**: as evidence and theory infrastructure for the conceptual research phase, **Ready**. As evidence infrastructure for a future empirical phase, **Not Ready** (it needs corpus expansion and version exposure — see the recommendations in §5).

## 2. Capability matrix

Basis for each status: R = verified by a real call (the raw output is in §4 of this report); D = review of the repository's documentation or code (`docs/13-api.md`, `src/registry.ts`, `seed/graph.json`).

| Capability | Status | Evidence / notes | Priority |
|---|---|---|---|
| Theory retrieval | ✅ available | R: `list_nodes {type:'theory'}` → 3 theory nodes (cognitive discrepancy theory of loneliness, self-determination theory, socioemotional selectivity theory); `search` finds them semantically | corpus expansion P1 |
| Intervention retrieval | ✅ available | R: 7 intervention nodes (including digital-reminiscence, life-story-work, social-intervention) plus the intervention_component type | corpus expansion P1 |
| Mechanism modelling | ✅ available (thin corpus) | R: the mechanism type exists with 3 nodes (muscle protein synthesis, maladaptive social cognition, self-continuity); the `operates_through` semantics are expressed through claim relationships | P1 |
| Outcome modelling | ✅ available | R: the outcome type + `what_affects {object:'ga:loneliness'}` returns influencing factors with certainty and provenance | — |
| Measurement retrieval | ✅ available | R: 15 scale nodes (UCLA, DJG, LSNS, WHO-5, WEMWBS, Ryff PWB, PIL, SPPB, PHQ-9, the interRAI family, MSPSS), connected to outcomes by the `assesses` relationship | — |
| Evidence provenance | ✅ available | R: each claim carries `evidence[]` (a DOI/PMID source_id, study_design, quote) plus `quality{score,tier,bestDesign,conflicted,reasons}`; `certainty` is separate from quality, and an explicit `status:'unverified'` on a claim is not supported | — |
| Knowledge gap modelling | ✅ available (first-class) | R: the knowledge_gap and research_question node types; `knowledge_gaps {topic:'digital'}` returns `ga:gap-digital-loneliness` and the research questions generated from it — which is precisely this platform's core research area | — |
| Path queries | ✅ available | R: `path {from:'ga:digital-reminiscence',to:'ga:loneliness'}` → a 2-hop chain (through the knowledge-gap node); `path {from:'ga:loneliness',to:'ga:ucla'}` → 1 hop, `assesses`. Note: path searches undirected claim edges, and needs real node ids | — |
| MCP access | ✅ available | R: initialize / tools/list / tools/call all verified; both transports (HTTP `POST /mcp` for the online proxy, stdio for the local one); this platform's adapter uses HTTP JSON-RPC | — |
| Graph-level version exposure | ❌ missing | D: `seed/graph.json` has `"version": 6`, but no API or tool returns it; this platform compensates with a content hash (retrieval identity) | P1 (a recommendation to the KG repository) |
| Separate problem / risk / model node types | ⚠️ partial | D: the existing type set approximates `problem` with outcome / symptom / disease; risk is expressed through `has_risk` / `increases_risk_of` claims rather than as a node | P2 |
| Write-back (evaluation results → new evidence in the graph) | ❌ missing | D: `docs/13-api.md` states it is read-only — "writes arrive with the V1 curation UI" — so the last step of the loop (New Evidence → Knowledge Graph Update) waits on the KG side's V1 | P1 |

## 3. What has been implemented on the platform side `[Prototype Observation]`

Every change is in this repository (digital-intervention-research); the KG repository was not modified at all.

1. **A real MCP client** (`packages/modules/m10-evidence/src/infrastructure/kp-mcp-client.ts`): `createKnowledgePlatformMcpClient({baseUrl})` implements the existing `KnowledgePlatformPort` (the ACL façade of ADR-052, "MCP preferred"). JSON-RPC `tools/call` → `graceage_search` (deduplicated, first 5 nodeIds) → `graceage_node_detail` for each. **Fail-closed**: any transport, protocol or HTTP error raises `DEPENDENCY_UNAVAILABLE` (HTTP 503), and is never collapsed into "no evidence found".
2. **Retrieval-identity version semantics** (Doc 9 / Appendix B, "exact version or retrieval identity"): the graph API exposes no version number, so the adapter uses the first 16 hex characters of the sha256 of the complete node_detail payload as the `externalVersion` (`sha256:…`) — same content, same version; the moment an upstream claim or piece of evidence changes, the version changes. That value is persisted alongside the provenance written by `attachKnowledgeReference` into `evidence.knowledge_references`.
3. **A permission-gated query**: `searchKnowledgeEvidence` (`evidence.search`, the Researcher role) was added to the M10 application layer; search results are transient suggestions, and **only a human attaching a KnowledgeReference makes anything platform state**.
4. **REST exposure of the full M10 chain** (StaffCommandController): `GET /v1/evidence/search?q=`, `POST /v1/evidence-reviews`, `…/references` (which really resolves the external reference and records its provenance), `…/submit`, `…/approve` (EvidenceReviewer, confirmed, separation of duties), `POST /v1/evidence-decisions`, `…/approve` (approval produces an EvidenceSnapshot, ADR-044).
5. **Configuration (fail-closed by default)**: `KNOWLEDGE_PLATFORM_MODE=simulator|mcp` (defaulting to `simulator` — the deterministic simulator remains the baseline for CI and the synthetic pilot); `mcp` mode requires `KNOWLEDGE_MCP_URL` or the process refuses to start.
6. **Tests**: `kp-mcp.real-call.test.ts` holds seven — four are **real calls against a live server** (a search returning graph-backed nodes in retrieval-identity format, deduplication, a known node resolving with a stable hash, an unknown node returning undefined), two are fail-closed (an unreachable port and a non-MCP response both raising DEPENDENCY_UNAVAILABLE), and one asserts that claim/evidence rows without a nodeId never fall back to their own id. The e2e suite gained the full M10 chain (search → review → reference → two-person approval → snapshot) plus a participant 403 refusal. When the liveness probe fails the suite skips honestly rather than faking a pass.
7. **A live smoke test in CI**: the test step injects the repository variable `KNOWLEDGE_MCP_URL`, so every push makes a real JSON-RPC call against the production Cloud Run + Neon instance.

## 4. Example MCP queries (real calls) `[Prototype Observation]`

All of these were actually executed, with their real returns shown truncated.

```bash
# Theory and topic discovery (semantic search)
POST /mcp {"method":"tools/call","params":{"name":"graceage_search",
  "arguments":{"q":"loneliness in older adults","k":3}}}
# → [{id:"ga:gap-digital-loneliness",…},{id:"ga:loneliness",…},…]

# Interventions and evidence provenance (what_affects: certainty + DOI provenance + quality tiering)
graceage_what_affects {"object":"ga:loneliness"}
# → [{claim:"sc-1", subject:"Social participation", relationship:"reduces_risk_of",
#     population:"Older adults (65+)", certainty:"low",
#     sources:["DOI:10.1177/1088868310377394"],
#     quality:{score:80, tier:"high", bestDesign:"systematic_review_or_meta_analysis"}}, …]

# The evidence landscape (direct / indirect / conflicting / thin)
graceage_evidence_landscape {"topic":"ga:loneliness"}

# Knowledge gaps → research questions (this platform's core area is a gap the graph registers)
graceage_knowledge_gaps {"topic":"digital"}
# → {gaps:[{id:"ga:gap-digital-loneliness",
#     name:"Digital social & reminiscence interventions … under-studied",
#     research_questions:[{id:"ga:rq-digital-loneliness", …}]}]}

# Path traversal (Intervention → … → Outcome; Outcome → Measurement)
graceage_path {"from":"ga:digital-reminiscence","to":"ga:loneliness","max_hops":6}
# → found:true, length:2 (through the ga:gap-digital-loneliness knowledge-gap node)
graceage_path {"from":"ga:loneliness","to":"ga:ucla"}
# → found:true, length:1, relationship:"assesses" (the UCLA Loneliness Scale)

# Measurement instruments
graceage_list_nodes {"type":"scale"}
# → 15 scale nodes: ga:ucla, ga:djg-loneliness, ga:lsns, ga:who5, ga:wemwbs,
#   ga:ryff-pwb, ga:pil, ga:mspss, ga:sppb, ga:phq9, the interRAI family…

# Authoritative recommendations (guideline → intervention, with recommendation strength)
graceage_recommendations {}
# → [{issuer:"USPSTF 2018 Falls Prevention…", intervention:"Exercise",
#     rec_strength:"USPSTF B", sources:["PMID:29710…"]}, …]
```

The equivalent entry point on the platform side (through the permission engine): `GET /v1/evidence/search?q=loneliness` (Researcher) → `KnowledgeResource[]`, in which `externalVersion` is the retrieval identity.

## 5. Remaining gaps and recommendations (P0–P2)

**P0 (required by the current research platform) — none.** Every capability the conceptual phase needs is genuinely connected.

**P1 (important for the next phase; all of these are recommendations to the KG repository, which this repository does not modify on its own authority):**
1. Expose the graph-level version through the API or MCP (`graph_version` from `/health` or `initialize`), so the platform can use a real version number instead of compensating with a content hash.
2. Corpus expansion: for the priority topic domains, add theory and mechanism nodes per the audit matrix (there are only 3 of each today) and add **discriminating** claims between life story and cognitive training (the graph already has separate life-story-work and cognitive-training nodes, consistent with the principle that life story is not cognitive training, but has no explicit contrasting claim).
3. A write-back channel (the V1 curation UI, or a governed write API) to close the Evaluation → New Evidence → Graph Update loop; the platform's EvidenceSnapshot and ResearchFinding are the natural candidate inputs.

**P2 (future enhancements):** separate problem / risk / model node types (or documented mapping conventions for the current approximations); finer `for_population` granularity (population is coarse today); and path queries filterable by relationship type.

## 6. Research platform integration notes (how the platform should use this)

- **A single façade**: all graph access goes through the `KnowledgePlatformPort` ACL (ADR-052). Module code and the front end never call the KG directly — transport, retries and version semantics are the adapter's responsibility.
- **The evidence flow**: a Researcher explores through `GET /v1/evidence/search` (transient, nothing persisted) → after a human selection, `POST /v1/evidence-reviews/:id/references` attaches it (recording, at that moment, the externalIdentifier, the retrieval identity, the time of retrieval and the full provenance) → review, decision and snapshot are a chain of human authority with separation of duties. Graph content **never automatically** becomes a research conclusion of this platform.
- **Epistemic discipline** (Doc 19 §10): the certainty and quality the graph returns are **upstream curation metadata**, cited as `[Source-Derived]`; no analysis driven by the seed corpus may be stated as empirical evidence.
- **Availability semantics**: `simulator` mode is the default and the CI baseline (deterministic); `mcp` mode enables the real dependency explicitly. A real dependency being unreachable is a 503 `DEPENDENCY_UNAVAILABLE`, never a silent degradation to an empty result.
- **Runbook**: locally, `git clone GiorgioHuang/aging-knowledge-graph && PORT=8790 npm run serve`, then start the API with `KNOWLEDGE_PLATFORM_MODE=mcp KNOWLEDGE_MCP_URL=http://localhost:8790`; in the deployed environment, point at the endpoint given by the `KNOWLEDGE_MCP_URL` repository variable.
