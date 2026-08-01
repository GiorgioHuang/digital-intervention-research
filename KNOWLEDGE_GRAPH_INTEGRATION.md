# KNOWLEDGE_GRAPH_INTEGRATION

> Healthy Aging Knowledge Graph + MCP 审计与对接报告（响应《Prompt for the Healthy Aging Knowledge Graph Coding Agent》全部交付项）。审计时点 2026-08-01。所有「真实调用」均为对运行中的 aging-knowledge-graph 服务器的实际 JSON-RPC 往返（本地实例 + CI 中的 Cloud Run 实例），标注 `[Prototype Observation]`；图谱内容本身是**人工策展的种子语料**（60 节点/54 声明/25 证据条目），其规模结论标注 `[Source-Derived]`。按 Doc 19 v1.3 §10 纪律：本报告不将图谱返回的任何内容当作本平台的经验研究结论。

## 0. 部署事实：无需新建 GCP/Neon 基础设施 `[Prototype Observation]`

用户提出「如果需要服务器可以用 GCP，数据库可以用 Neon」。审计发现 **KG 已经部署完毕**：仓库 `GiorgioHuang/aging-knowledge-graph` 自带 `scripts/deploy-cloudrun.sh` 与 `scripts/neon-setup.ts`，服务已运行在 **Cloud Run（https://knowledge-graph.internal.example）+ Neon（pgvector）**。因此本次对接**零新增基础设施**——平台直接调用现有端点。

- 本开发沙箱的出站代理拒绝对 knowledge-graph.internal.example 的 CONNECT（403，代理策略），localhost 不受限。因此：本地开发/测试跑真实的本地 KG 服务器（同一代码、同一种子语料，`PORT=8790 npm run serve`）；**CI（GitHub Actions，公网出口开放）以 `KNOWLEDGE_MCP_URL=https://knowledge-graph.internal.example` 对生产实例做每推送真实调用冒烟**。两条路径跑的是同一测试套件、同一断言。

## 1. Readiness Assessment（就绪判定）

**Partially Ready（部分就绪）——接口与语义能力就绪，语料规模是当前的主要限制。**

- **就绪**：MCP 面（16 个 `graceage_*` 工具，HTTP POST /mcp 与 stdio 双传输）、结构化可追溯返回（claim→certainty→sources(DOI/PMID)→quality 分层）、知识缺口一等公民建模、路径查询、语义搜索。对本平台**概念研究阶段**（合成输入、理论建模、原型验证）的需求，这些能力已足够真实对接并驱动 M10 证据链。
- **部署语料注记** `[Prototype Observation]`：CI 对 knowledge-graph.internal.example 的真实调用显示，部署实例（Neon）语料是种子集的**超集**——包含摄入的文献源节点（`doi:` 前缀标识），且服务端语义搜索（embedding + Neon）冷路径延迟可超 15 秒。适配器与测试已按此现实校准（标识契约=图内可解析，非 `ga:` 命名约定；45 秒客户端超时）。
- **限制**：种子基线语料为 60 节点/54 声明/25 证据的策展集——覆盖了优先主题域的骨架（孤独感、社会连接、怀旧/生命故事、数字干预、知识缺口），但**远不足以支撑真实证据综述**；部分节点类型缺失（无 `problem`/`model`/`risk` 独立类型）；图谱级版本号未经 API 暴露（`seed/graph.json` 内 `"version": 6` 字段存在但 /health 与 MCP 不返回）。
- **结论**：作为概念研究阶段的证据与理论基础设施：**Ready**。作为未来经验研究阶段的证据基础设施：**Not Ready（需要语料扩充与版本暴露，见 §5 建议）**。

## 2. Capability Matrix（能力矩阵）

状态依据：R=真实调用验证（本报告 §4 有原始输出）；D=仓库文档/代码检视（docs/13-api.md、src/registry.ts、seed/graph.json）。

| Capability | Status | Evidence / Notes | Priority |
|---|---|---|---|
| Theory retrieval | ✅ 可用 | R：`list_nodes {type:'theory'}` → 3 个理论节点（认知差异孤独理论、自我决定论、社会情绪选择理论）；`search` 语义检索可命中 | 语料扩充 P1 |
| Intervention retrieval | ✅ 可用 | R：7 个 intervention 节点（含 digital-reminiscence、life-story-work、social-intervention）+ intervention_component 类型 | 语料扩充 P1 |
| Mechanism modelling | ✅ 可用（语料薄） | R：mechanism 类型存在，3 个节点（肌肉蛋白合成、适应不良社会认知、自我连续性）；`operates_through` 语义经 claim 关系表达 | P1 |
| Outcome modelling | ✅ 可用 | R：outcome 类型 + `what_affects {object:'ga:loneliness'}` 返回带确定性与出处的影响因素 | — |
| Measurement retrieval | ✅ 可用 | R：15 个 scale 节点（UCLA、DJG、LSNS、WHO-5、WEMWBS、Ryff PWB、PIL、SPPB、PHQ-9、interRAI 家族、MSPSS），`assesses` 关系连接 outcome | — |
| Evidence provenance | ✅ 可用 | R：每条 claim 携带 evidence[]（source_id 为 DOI/PMID、study_design、quote）+ quality{score,tier,bestDesign,conflicted,reasons}；`certainty` 与 quality 分离，未支持断言显式 `status:'unverified'` | — |
| Knowledge gap modelling | ✅ 可用（一等公民） | R：knowledge_gap + research_question 节点类型；`knowledge_gaps {topic:'digital'}` 返回 ga:gap-digital-loneliness 及其生成的研究问题——正是本平台的核心研究领域 | — |
| Path queries | ✅ 可用 | R：`path {from:'ga:digital-reminiscence',to:'ga:loneliness'}` → 2 跳链（经知识缺口节点）；`path {from:'ga:loneliness',to:'ga:ucla'}` → 1 跳 `assesses`。注意：path 按无向 claim 边搜索，需用真实节点 id | — |
| MCP access | ✅ 可用 | R：initialize/tools/list/tools/call 全部验证；HTTP POST /mcp（在线代理）与 stdio（本地代理）双传输；本平台适配器走 HTTP JSON-RPC | — |
| Graph-level version exposure | ❌ 缺失 | D：seed/graph.json 有 `"version": 6`，但任何 API/工具都不返回它；本平台以内容哈希（retrieval identity）补偿 | P1（对 KG 仓库的建议） |
| Problem/Risk/Model 独立节点类型 | ⚠️ 部分 | D：现有类型集用 outcome/symptom/disease 近似表达 problem；risk 经 `has_risk`/`increases_risk_of` 类 claim 表达而非节点 | P2 |
| 写回（评估结果 → 新证据入图） | ❌ 缺失 | D：docs/13-api.md 明示 read-only，「writes arrive with the V1 curation UI」——闭环最后一步（New Evidence → Knowledge Graph Update）待 KG 侧 V1 | P1 |

## 3. 平台侧已实施的对接（Implemented Changes）`[Prototype Observation]`

全部变更在本仓库（digital-intervention-research）；KG 仓库未做任何修改。

1. **真实 MCP 客户端**（`packages/modules/m10-evidence/src/infrastructure/kp-mcp-client.ts`）：`createKnowledgePlatformMcpClient({baseUrl})` 实现既有 `KnowledgePlatformPort`（ADR-052「MCP preferred」的 ACL 门面）。JSON-RPC `tools/call` → `graceage_search`（去重取前 5 个 nodeId）→ 逐个 `graceage_node_detail`。**失败关闭**：传输/协议/HTTP 错误一律抛 `DEPENDENCY_UNAVAILABLE`（HTTP 503），绝不折叠成「未找到证据」。
2. **Retrieval identity 版本语义**（Doc 9 / Appendix B「exact version or retrieval identity」）：图谱 API 不暴露版本号，适配器以 node_detail 完整载荷的 sha256 前 16 hex 作 `externalVersion`（`sha256:…`）——同内容同版本，上游声明/证据一旦变动版本即变。该值随 `attachKnowledgeReference` 的 provenance 持久化到 `evidence.knowledge_references`。
3. **权限门控查询**：`searchKnowledgeEvidence`（`evidence.search`，Researcher 角色）新增于 M10 application 层；搜索结果是临时建议，**只有人工附加 KnowledgeReference 才成为平台状态**。
4. **REST 暴露 M10 全链**（StaffCommandController）：`GET /v1/evidence/search?q=`、`POST /v1/evidence-reviews`、`…/references`（真实解析外部引用并落 provenance）、`…/submit`、`…/approve`（EvidenceReviewer、confirmed、职责分离）、`POST /v1/evidence-decisions`、`…/approve`（批准即产 EvidenceSnapshot，ADR-044）。
5. **配置（失败关闭默认）**：`KNOWLEDGE_PLATFORM_MODE=simulator|mcp`（默认 simulator——确定性模拟器仍是 CI/合成试点的基线），`mcp` 模式要求 `KNOWLEDGE_MCP_URL` 否则进程拒绝启动。
6. **测试**：`kp-mcp.real-call.test.ts` 六项，其中四项为**对活体服务器的真实调用**（搜索返回 `ga:` 节点+retrieval identity 格式、去重、已知节点解析且哈希稳定、未知节点 → undefined），两项失败关闭（不可达端口/非 MCP 响应 → DEPENDENCY_UNAVAILABLE）；e2e 新增 M10 全链（搜索→评审→引用→双人批准→快照）与参与者 403 拒绝。探活失败时诚实 skip，不伪造通过。
7. **CI 实弹冒烟**：测试步注入 `KNOWLEDGE_MCP_URL=https://knowledge-graph.internal.example`——每次推送对生产 Cloud Run+Neon 实例做真实 JSON-RPC 调用。

## 4. Example MCP Queries（真实调用样例）`[Prototype Observation]`

以下均为实际执行过的调用及真实返回（截断展示）。

```bash
# 理论/主题发现（语义搜索）
POST /mcp {"method":"tools/call","params":{"name":"graceage_search",
  "arguments":{"q":"loneliness in older adults","k":3}}}
# → [{id:"ga:gap-digital-loneliness",…},{id:"ga:loneliness",…},…]

# 干预与证据出处（what_affects：带确定性+DOI 出处+质量分层）
graceage_what_affects {"object":"ga:loneliness"}
# → [{claim:"sc-1", subject:"Social participation", relationship:"reduces_risk_of",
#     population:"Older adults (65+)", certainty:"low",
#     sources:["DOI:10.1177/1088868310377394"],
#     quality:{score:80, tier:"high", bestDesign:"systematic_review_or_meta_analysis"}}, …]

# 证据全景（直接/间接/冲突/薄弱四分）
graceage_evidence_landscape {"topic":"ga:loneliness"}

# 知识缺口 → 研究问题（本平台核心领域恰是图谱登记的缺口）
graceage_knowledge_gaps {"topic":"digital"}
# → {gaps:[{id:"ga:gap-digital-loneliness",
#     name:"Digital social & reminiscence interventions … under-studied",
#     research_questions:[{id:"ga:rq-digital-loneliness", …}]}]}

# 路径遍历（Intervention → … → Outcome；Outcome → Measurement）
graceage_path {"from":"ga:digital-reminiscence","to":"ga:loneliness","max_hops":6}
# → found:true, length:2（经 ga:gap-digital-loneliness 知识缺口节点）
graceage_path {"from":"ga:loneliness","to":"ga:ucla"}
# → found:true, length:1, relationship:"assesses"（UCLA Loneliness Scale）

# 测量工具查询
graceage_list_nodes {"type":"scale"}
# → 15 个量表节点：ga:ucla, ga:djg-loneliness, ga:lsns, ga:who5, ga:wemwbs,
#   ga:ryff-pwb, ga:pil, ga:mspss, ga:sppb, ga:phq9, interRAI 家族…

# 权威推荐（guideline → intervention，含推荐强度）
graceage_recommendations {}
# → [{issuer:"USPSTF 2018 Falls Prevention…", intervention:"Exercise",
#     rec_strength:"USPSTF B", sources:["PMID:29710…"]}, …]
```

平台侧等价入口（经权限引擎）：`GET /v1/evidence/search?q=loneliness`（Researcher）→ `KnowledgeResource[]`，其中 `externalVersion` 即 retrieval identity。

## 5. Remaining Gaps 与建议（P0–P2）

**P0（当前研究平台必需）——无。** 概念阶段所需能力已全部真实打通。

**P1（下一阶段重要，均为对 KG 仓库的建议，本仓库不越权修改）：**
1. 经 API/MCP 暴露图谱级版本（/health 或 initialize 返回 `graph_version`），使平台可用真版本号替代内容哈希补偿。
2. 语料扩充：优先主题域按审计矩阵补 theory/mechanism 节点（当前各仅 3 个）与生命故事↔认知训练的**区分性**声明（图谱已有 life-story-work 与 cognitive-training 分立节点，符合「生命故事≠认知训练」原则，但缺显式对比声明）。
3. 写回通道（V1 curation UI / 受治理的 write API）：完成 Evaluation → New Evidence → Graph Update 闭环；平台侧的 EvidenceSnapshot/ResearchFinding 是天然的候选输入。

**P2（未来增强）：** problem/risk/model 独立节点类型（或文档化现有近似表达的映射约定）；`for_population` 细分（当前 population 粒度粗）；path 查询支持按关系类型过滤。

## 6. Research Platform Integration Notes（平台应如何使用）

- **唯一门面**：一切图谱访问经 `KnowledgePlatformPort` ACL（ADR-052）。模块代码/前端永不直接调用 KG——传输、重试、版本语义都是适配器职责。
- **证据流**：Researcher 经 `GET /v1/evidence/search` 探索（临时、不落库）→ 人工挑选后 `POST /v1/evidence-reviews/:id/references` 附加（此刻记录 externalIdentifier + retrieval identity + 检索时刻 + 完整 provenance）→ 评审/决定/快照全链人工权威 + 职责分离。图谱内容**永不自动**成为平台研究结论。
- **认识论纪律**（Doc 19 §10）：图谱返回的 certainty/quality 是**上游策展元数据**，引用时标注 `[Source-Derived]`；种子语料驱动的任何分析结果不得表述为经验证据。
- **可用性语义**：`simulator` 模式是默认与 CI 基线（确定性）；`mcp` 模式显式启用真实依赖。真实依赖不可达 = 503 DEPENDENCY_UNAVAILABLE，绝不静默降级为空结果。
- **运行手册**:本地 `git clone GiorgioHuang/aging-knowledge-graph && PORT=8790 npm run serve`，然后 `KNOWLEDGE_PLATFORM_MODE=mcp KNOWLEDGE_MCP_URL=http://localhost:8790` 启动 API；线上直接指向 `https://knowledge-graph.internal.example`。
