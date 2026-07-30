# IMPLEMENTATION_PLAN — Healthy Aging Digital Intervention Research Platform

> 状态：Phase 0 规划产物（依据 CodingAgentMasterImplementationPrompt 与 Architecture Handbook v2.7 全部文档 0–20 及附录 A–F 编写）。
> 本文档是实现计划，不修改 Handbook 本身；实现层决策以「Adopted for Implementation / Proposed / Blocked / Pending External Approval」标注，正式批准仍以 Appendix C ADR 流程为准。

---

## 1. 仓库基线评估

- 仓库当前**只有 `docs/`（Handbook 全文），没有任何代码、CI、迁移或环境文件**。这是一个从零开始的绿地实现。
- 权威文档版本已按 Appendix D v2.7 核对：文档 0–20 全部为 Reviewed 状态（文档 19 为 Reviewed–Draft，伦理批准 Pending，禁止真实招募）。Appendix F 冲突登记簿当前**无未决冲突**。
- 结论：不存在遗留代码冲突；`IMPLEMENTATION_BASELINE.md` 的核心内容即本节（后续单独成文并随实现更新）。

## 2. 实现画像（Implementation Profile）

按 Handbook 已定 ADR（ADR-009/011/012/015 等），系统形态是固定的：

- **模块化单体（modular monolith）**：一个后端代码库，M01–M18 逻辑模块显式分包，各模块独占写自己的聚合（ADR-008），跨模块只走命令/查询/事件/读模型。
- **三个运行进程**：API、Worker、Scheduler，同一构建产物、不同入口（Doc 13 §34）。
- **单一 PostgreSQL 物理库 + 按模块逻辑 schema**（ADR-012、Doc 16 §9），DB 角色隔离跨模块写权限。
- **事务性 Outbox + 幂等 Inbox 消费者**（ADR-015），派生投影（Search/Vector/缓存）永远不是权威（ADR-014/016）。
- **私有对象存储 + 上传隔离扫描管线**（ADR-013，Doc 16 §46–50）。
- **所有外部依赖走 Anti-Corruption Layer**（ADR-052）：Knowledge Platform（M10）、模型供应商（M11 Model Gateway）、通信供应商（M16）、身份供应商（M01）。
- 前端为**响应式 Web/PWA**，无原生应用；不做微服务、K8s、多区域、企业级流处理（Doc 18 §137 明确 Deferred）。

## 3. 技术栈提案（对应待决 ADR-101…125）

Handbook 刻意不指定语言/框架（ADR-101 Proposed）。以下选择满足其硬性要求（强类型、模块边界可执行、OpenAPI、后台作业、PostgreSQL），标注为 **Proposed / Adopted for Implementation**，正式批准前不视为永久架构（Master Prompt「Handling Open ADRs」规则 6）：

| ADR | 主题 | 提案 | 理由/备选 |
|---|---|---|---|
| ADR-101 | 后端语言框架 | **TypeScript + Node.js（NestJS）** | 模块系统+DI 天然映射 M01–M18；`@nestjs/swagger` 生成 OpenAPI；与前端同语言降低小团队成本。备选：.NET 8 modulith（类型与事务生态更强，但双语言栈） |
| ADR-102 | 参与者客户端 | **React + Vite SPA/PWA**，OpenAPI 生成类型化客户端 | 满足 WCAG AA 与七种能力自适应模式的组件化诉求 |
| ADR-105 | 数据库 | **PostgreSQL 16**（本地 Docker，生产托管服务待定） | Doc 16 明确以 PostgreSQL 为参考引擎 |
| — | 数据访问/迁移 | **纯 SQL 迁移（node-pg-migrate）+ Kysely 类型化查询** | 本域约束密集（partial unique、check、deferred constraint），ORM 抽象反而碍事；迁移即代码评审对象 |
| ADR-107 | 队列/调度 | **pg-boss**（PostgreSQL 支撑的持久队列+定时） | 与 Outbox 同库同事务语义契合；避免 MVP 引入独立 broker；按工作负载分队列（consent/block 传播、safety、message delivery、matching、AI、media、analytics） |
| ADR-104 | 身份供应商 | 开发期 **Keycloak（OIDC）**，生产 IdP 待批 | M01 保持 UserAccount 权威，IdP 仅认证；接口抽象为 OIDC ACL |
| ADR-106 | 对象存储 | **S3 兼容接口，本地 MinIO** | 供应商待批，接口先行 |
| ADR-108 | Search/Vector | **Postgres 全文检索**；Vector 用 pgvector、**默认关闭** | Doc 13：先关系型全文，专用集群需论证 |
| ADR-109 | AI 供应商 | **确定性本地模拟 Provider**（Pending Approval 前不接真实模型） | Model Gateway 接口 + Provider Registry 先行，别名解析可换真供应商 |
| ADR-111 | 通信供应商 | **确定性 Provider Simulator**（可脚本化 accepted/delivered/failed/unknown/重放/乱序回调） | ADR-124 的投递映射先做成配置 |
| ADR-115/116 | 分析环境/数据集格式 | 导出式分析工作流；DatasetVersion 落 **Parquet + manifest + 校验和**，CSV 仅交换 | Doc 16 §60 |
| ADR-117 | Message 正文加密 | **应用层字段加密（envelope encryption）**，密钥独立管理 | 待批前 fail-closed：正文默认排除于日志/事件/索引 |
| ADR-118 | RLS | 不作为唯一控制；对 `organisation_id` 关键表可选启用（防御纵深） | Doc 16 警告连接池陷阱 |
| ADR-120/121/123/124/125 | 保留期/备份/附件/投递映射/MutualAcceptance 有效期 | 全部**配置驱动 + fail closed**，不硬编码 | Master Prompt 规则 5 |
| ADR-122 | 可观测性 | OpenTelemetry + pino 结构化日志（敏感字段过滤器为一等公民）；审计走 M15 append-only 表，与运维遥测分离 | Doc 14 §61 |

CI：GitHub Actions（lint + typecheck + 架构边界测试 + 单元/集成/契约/E2E + 迁移演练）。架构边界用 **dependency-cruiser + 每模块独立 DB 角色** 双重执行（Doc 13：CI architecture tests 强制跨模块写禁令）。

## 4. 仓库组织

```
/apps
  /api            # HTTP 进程（NestJS 应用，装配 modules）
  /worker         # 队列消费者进程（outbox publisher、delivery、propagation、AI）
  /scheduler      # 定时进程（reconciliation、expiry、retention）
  /web            # 参与者/研究者/管理等工作区 SPA（按 Doc 20 十二个 workspace 路由分区）
/packages
  /modules/m01-identity-org … /m18-community-social   # 18 个逻辑模块
      domain/         # 聚合、值对象、状态机、领域策略（不依赖框架/DB/SDK）
      application/    # 命令/查询处理器、进程管理器
      infrastructure/ # 仓储（仅本模块可见）、投影构建器
      contracts/      # 对外命令/查询/事件类型（唯一允许被其它模块 import 的目录）
      migrations/     # 本模块 schema 的 SQL 迁移
  /kernel           # 技术内核：RequestContext、ID/时钟、事务+outbox、结构化错误、审计、加密、observability（无共享可变领域对象）
  /policy           # 确定性 Effective Permission 引擎（见 §6.1）
  /contracts        # OpenAPI 产物、事件 schema 目录（JSON Schema，版本化）
  /testing          # 合成 fixture、确定性时钟、provider simulators
/openapi  /events   # 生成与手写契约
/docs               # Handbook（只读，不修改）
/tools              # 架构测试、traceability 校验脚本
```

命令管线统一为（Doc 13/15）：认证 → 解析 org/role/purpose/context → Effective Permission 评估 → visibility/Block/领域前置条件 → 属主模块命令 → **状态+outbox 同事务提交** → 精确结果或 `202 Operation` → 审计。

## 5. 数据库与持久化策略

- 每模块一个 schema（`identity_org` … `community_social`），另加 `storage_ops / search_projection / analytics_stage / migration_admin`；迁移按模块目录管理、按依赖顺序执行。
- 通用约定照搬 Doc 16：UUIDv7 opaque `id`、`record_version` 乐观并发、**禁止通用 `status` 列**（Message 必须有 `message_lifecycle_state` 与 `message_delivery_state` 两列等）、审批后不可变表用 append-only 版本表 + content hash + DB 权限三重防护。
- 必须落 DB 约束的清单（Doc 18 §118 + Doc 16 §42–44，全部有迁移+集成测试）：
  - MatchDecision：`unique (actor, candidate_version) where is_current_final` — 一актор一候选版本一个最终决定；决定归属只能是提交者本人。
  - `mutual_acceptance_sources`：恰好两条兼容 MatchDecision **或** 一条 accepted ConnectionRequest（check + deferred constraint）。
  - MutualAcceptance 单次使用：`unique (connection_id) where connection_id is not null` + usage-state check；消费与 Connection 激活同事务。
  - Connection 必须非空引用来源 MutualAcceptance；active pair+purpose 部分唯一。
  - 活跃 Thread 必须存在**一条当前有效 CommunicationBasis**（`thread_communication_bases` 约束）。
  - Draft Message ⇒ delivery=`Not Submitted` 且无 DeliveryAttempt/provider ref（check）。
  - SendConfirmation 绑定 exact message_version + recipient-set hash + actor + idempotency key，跨版本/收件人集不可复用（unique）。
  - `message_delivery_attempts`：`unique (provider, provider_reference)`；重试=新 DeliveryAttempt 序号。
  - BlockRecord 方向化、active pair+scope 部分唯一；Block 写入与禁止效果同事务，传播按目标存储记账（`block_propagation_records`）。
  - DatasetVersion：一个版本仅一个 active lock；锁定后禁止新行/新文件；manifest hash 不可替换。
  - `safety_events`：无自动化角色可插入（confirmed conversion 才存在）。
- Outbox 原子对（Doc 16 §54）作为集成测试的黄金清单：Block+BlockCreated、MatchDecision+MatchDecisionRecorded、MutualAcceptance+MutualAcceptanceRecorded、Connection+consumption+ConnectionActivated、Thread+ConversationThreadCreated、SendConfirmation+MessageSendConfirmed+MessageQueued、DatasetLock+DatasetVersionLocked。

## 6. 横切机制（先于业务模块建成）

### 6.1 Effective Permission 引擎（/packages/policy）
公式固定：`Role + Relationship + Consent + Purpose + Context + SpecificPermission + ResourceState`，附加 Visibility、Block、DataClassification、action risk、aggregate version、CommunicationBasis 等输入（ADR-017）。实现要点：
- 纯确定性函数（禁止 LLM 参与，Doc 13 §12.9），输入全部显式；输出 12 步评估序列的决策枚举（Permit / Deny / Permit with Conditions / Confirmation Required / Step-Up / Human Review / **Deny and Hide Existence** 等）。
- 冲突顺序：显式 deny 最优先 → 参与者限制 → 更窄范围 → 更短期限 → 更高分级 → 资源状态 → 无法判定则 deny/人审。
- 每次评估落 `policy_decisions`（含 policy version），可解释、可审计。
- 高一致性权威（Consent 撤回、Block、MutualAcceptance、SendConfirmation、DatasetLock 等）**同步查库，永不走缓存**（ADR-016）；其余可用带版本键的短期缓存 + 撤回类事件高优先级失效。
- 集合查询「先过滤后返回」，protected existence 用统一 `RESOURCE_NOT_FOUND`（404 代替 403）。

### 6.2 Consent（M03）
细粒度、按版本、按目的（Doc 19 §41 列出 20+ 独立 scope——研究参与、Life Story、媒体、Supporter 贡献、Community、Platform Public、Open Matching、逐属性匹配、messaging、附件、供应商处理、AI、AIMemoryItem、元数据研究使用等）。决策枚举 Granted/Declined/Restricted/Deferred/Withdrawn/Expired/Superseded/Re-Consent Required；采集时与使用时双重评估；撤回传播是一条持久工作流（权限→索引→匹配→通知→AI 上下文/记忆→待导出→供应商）。

### 6.3 事件体系
五层事件严格分开：Domain / Integration / UX Analytics / Operational / Audit。事件信封照 Doc 15 §61（eventId、category、type、schemaVersion、aggregate{type,id,version}、actor、context、classification、correlation/causation/trace）。**只发 canonical 名称**；废弃别名（`MatchCompleted`、`MessageDeliveryConfirmed`、`ActorBlocked`、`UserReported`、`SafetyEventDetected`、`DatasetLockConfirmed`）在 lint 规则与 schema 注册表中显式封禁，仅允许版本化翻译层。UX 事件（如 `DatasetLockConfirmationSubmitted`）只进分析管道，永不建立领域事实。

### 6.4 API 契约
- URI 风格、前缀化 opaque ID（`pv_/pt_/msg_/…`）、`Idempotency-Key`、`If-Match`/expectedVersion、cursor 分页、typed filter allowlist，全按 Doc 15。
- 错误目录直接实现 Doc 15 §31 的全部稳定错误码（`COMMUNICATION_BASIS_REQUIRED`、`MUTUAL_ACCEPTANCE_ALREADY_CONSUMED`、`SEND_CONFIRMATION_MISMATCH`、`CONNECTION_REQUEST_FEATURE_DISABLED` 等）——错误码即契约测试对象。
- 高影响转移一律显式命令端点（`/protocol-versions/{id}/approve`、`/mutual-acceptances/{id}/activate-connection`、`/messages/{id}/confirm-send`、`/dataset-versions/{id}/lock`），**没有 `POST /connections`**，审批后资源禁止通用 PATCH。
- OpenAPI 从代码生成并入库；每个端点注记属主模块、聚合、所需权限/目的、幂等行为、状态转移、审计要求、Trace/ADR ID（作为 OpenAPI extension `x-trace-ids`）。

### 6.5 功能旗标即治理对象
`ConnectionRequest`、Internet Public、read receipts、群发、AIMemoryItem、LegacyPreference 等以**显式禁用状态**存在（返回稳定错误码），不是"没写的路由"；旗标登记 owner、默认值、Protocol 兼容性、回滚方式（Doc 18 §207）。旗标不替代版本化领域数据（ProtocolVersion/CommunityRuleVersion/matching policy version）。

## 7. 关键领域实现策略（最高风险不变量）

1. **匹配→连接管线**（M18）：`MatchPreference → MatchCandidate(+MatchExplanation) → 各自独立 MatchDecision → 服务端评估创建 MutualAcceptance → activate-connection 单次消费 → Connection`。候选生成前同步查 Block 与禁用属性注册表（禁止属性列表进 DB 约束）；对方决定在政策允许前不可见；AI 只能 propose，不能替另一方提交（Level-5 负面测试）。
2. **CommunicationBasis 与消息**（M18/M16）：Thread 创建与每次生效性消息动作都重评 basis（四类：active Connection / authorised Relationship / approved InterventionSession / moderated Community context）。Message 生命周期与投递状态双状态机永不合并；编辑使旧确认失效；`MessageSendConfirmed` 先于 `MessageQueued`；Worker 投递前重验 send authority + Block + 取消；回调在 M16 终止（签名+时间戳+重放键+幂等+provider reference 映射），经翻译调 M18 命令，**M16 无 M18 表写权限**（DB 角色兜底）。Provider Accepted ≠ Delivered，Unknown 走 reconciliation 而非装成功。
3. **Block fail-closed**：发现、候选投递、MutualAcceptance 创建、Connection 激活、Thread 创建、SendConfirmation、新通知、AI Context 全部同步拒绝；队列中投递尽力取消并记录供应商限制；解除 Block 不恢复任何先前状态。
4. **Life Story 作者权**（M17）：AI Draft / Supporter Contribution / Participant Testimony 三态分离，只有参与者对 exact version 的显式确认产生 Testimony（`ParticipantTestimonyConfirmed`）；可见性六级与复用权利分维；撤回传播复用 §6.2 工作流。
5. **AI 治理**（M11）：全部模型调用过 Model Gateway（别名→注册表解析，无静默替换）；上下文装配前先做权限过滤（不允许"发过去再让模型忽略"）；工具走类型化 Tool Contract + Action Level 0–4，Level 5 清单每条一个负面测试；工具参数中的权威字段（角色/同意/审批/MutualAcceptance/DatasetLock/SafetyEvent）由服务端解析，模型给值一律丢弃；成功只以属主模块结构化结果为准。降级模式矩阵（Grounded Read-Only / Draft-Only / No-Tool / Manual / Disabled）+ 各级 kill switch。
6. **Safety 人类权威**（M09）：任何自动化（含 AI）只能产生 `SafetySignalRecorded`/`AISafetySignalRaised`；`safety_events` 只能由授权人的 convert 命令创建；审批、DatasetLock、ResearchFinding 同理由 M15 审批记录+职责分离（禁自批）约束。
7. **研究链条不可变性**（M12/M13）：DatasetDefinition→DatasetVersion→质量评审→人工 DatasetLock→AnalysisPlan（批准）→AnalysisRun（绑定 exact locked version，捕获环境/种子/代码引用）→AnalysisOutput→InterpretationRecord→ResearchFinding→InterventionDecision；修正=新版本；withdrawal 不改写 locked 历史（新版本或 exclusion 记录）。

## 8. 实施阶段计划

顺序遵循 Doc 18 §173 二十步构建序与 §174 硬性前置约束（如：无 Block+Report 不得开 Community；无 CommunicationBasis 不得 messaging；无 DatasetLock 不得 AnalysisRun）。每阶段的完成定义=实现+测试+文档+traceability 更新，仅脚手架不得报告为完成。

| 阶段 | 对应里程碑 | 内容（写代码视角） | 主要产出 |
|---|---|---|---|
| **P0 决策与骨架** | MS-00 | 本文档四件套（BASELINE/DECISIONS/PLAN/TRACEABILITY）；monorepo 初始化、CI、lint/typecheck、依赖巡航架构测试、确定性测试时钟 | 可构建空骨架 + 治理文件 |
| **P1 工程地基** | MS-03 | kernel（RequestContext/错误/审计/加密/observability）、PG+迁移框架、outbox/inbox、pg-boss、健康检查、OpenAPI 管线、对象存储隔离管线、合成 fixture、本地 docker-compose | `make dev` 一键起三进程 |
| **P2 身份·同意·权限** | MS-05 部分 | M01/M02/M03/M15 骨干：账号/组织/角色、参与者档案+无障碍偏好、Relationship、Consent 全模型、policy 引擎、PolicyDecision、审计、protected existence | 负面测试组①（角色越权/存在性枚举/撤回同意） |
| **P3 研究核心** | MS-04 | M04/M05/M06/M10：ResearchProject/Question、ProtocolVersion（审批后不可变）、招募/筛查/人工 EligibilityDecision/Enrolment、Intervention 版本与配置、Evidence 链（Review/Decision/Snapshot，KP ACL 用模拟器） | 研究者治理纵切 E2E |
| **P4 Life Story** | MS-06/07 | M17 全量 + 媒体上传隔离/扫描、AI Draft 接口（模拟 provider）、Testimony 确认、六级可见性+受众预览、导出、撤回传播 | AI 无中生有测试、作者权测试 |
| **P5 治理型社区** | MS-08 | M18 社区半区：CommunitySpace/RuleVersion/membership/SocialPost/受控 feed、**Block+Report+ModerationCase+人工 ModerationDecision+申诉**（先于社区开放） | 滥用模拟、版主工作区 |
| **P6 匹配与连接** | MS-09 | MatchPreference/属性注册表/禁用属性约束/候选生成/MatchExplanation/独立 MatchDecision/MutualAcceptance（过期/失效/单次）/原子 Connection 激活；ConnectionRequest 返回 FEATURE_DISABLED | 负面测试组②（越权代决/复用/过期） |
| **P7 会话与消息** | MS-10 | CommunicationBasis/Thread/Message 双状态机/附件校验/SendConfirmation/队列/M16 Provider 适配器+回调认证+重放防护/DeliveryAttempt/reconciliation/Block 取消抑制/messaging UX | 回调伪造/重放/乱序、Accepted≠Delivered 测试 |
| **P8 AI·安全** | MS-11 | Model Gateway/配置版本/Prompt Registry/Tool Registry+Gateway/确认与人审队列/AIMemoryItem 控制/SafetySignal→人工 triage→SafetyEvent/kill switch/降级矩阵 | Level-5 全清单负面测试 |
| **P9 数据与分析** | MS-12 | M12/M13/M14：DatasetDefinition/变量字典/TransformationRun/DatasetVersion(Parquet+manifest)/质量/去标识/DatasetLock/AnalysisPlan/AnalysisRun/Interpretation/Finding/ReportVersion/导出包 | 血缘与不可变性测试 |
| **P10 合成试点与就绪** | MS-13/14 | 自动化 Doc 18 §210 全部 30 个场景 + Doc 19 补充场景（附件隔离、伪造回调、禁用属性、举报人保密、数据集排除、重跑、拒绝 Finding）；备份/恢复演练；删除/撤回传播端到端；readiness 报告 | `PILOT_READINESS_REPORT.md`（外部批准缺失即如实标注 Pending） |

前端与各阶段并行：P2 起搭 App Shell/设计令牌/核心组件（Doc 20 §322 组件清单），每个纵切交付该切片的工作区界面；WCAG AA + 七种自适应模式是组件库验收标准，Doc 20 §360 的 20 条 release-blocking UX 缺陷清单进 E2E 断言。

## 9. 测试策略

- **单元**：聚合不变量、状态机（非法转移全枚举）、policy 引擎判定表、事件构造、供应商映射。
- **集成**：DB 约束逐条验证（§5 清单）、outbox 原子对、迁移 up/down、幂等消费、对象存储管线、回调认证/重放、删除传播。
- **契约**：OpenAPI 与实现一致性、事件 JSON Schema、废弃别名封禁 lint、Provider/KP/AI Tool 模拟器契约。
- **E2E**：参与者/研究者/版主/安全审查员四条完整旅程。
- **强制负面测试**（Master Prompt 清单 26 条全收录）：仅角色绕权、存在性枚举、过期/撤回同意、AI Draft 冒充 Testimony、禁用匹配属性、代他人 MatchDecision、无源/过期/复用 MutualAcceptance、无 basis 建 Thread、静默扩员、未确认发送、改后未重确认、回调伪造/重放、Accepted 显示为 Delivered、Unknown 装成功、Block 绕过、Block 后队列投递、举报人暴露、自动确认 SafetyEvent、AI 高影响自主动作、未批准 DatasetLock、Output 自动变 Finding、撤回未传播派生存储等。
- **合成试点**：确定性种子数据 + provider simulator，在 CI 可重复执行，作为 MS-13 硬性门槛。

## 10. 需要外部批准的阻塞项（如实标注，不伪造）

以下按 Master Prompt 规则「接口+模拟器先行、配置驱动、fail closed、继续无关工作」处理，不阻塞编码主线：

- **Pending External Approval**：ADR-048（试点设计/伦理）、ADR-109（AI 供应商）、ADR-111（通信供应商）、ADR-112（匹配算法与属性注册表）、ADR-113（feed 排序）、ADR-115（分析环境）、ADR-117（正文加密策略）、ADR-119（数据驻留）、ADR-120（保留期）、ADR-121（备份 RPO/RTO）、ADR-123/124/125（附件/投递映射/MutualAcceptance 有效期）。
- **Proposed（本文档给出实现选型，待正式 ADR 化）**：ADR-101–108、110、114、116、118、122。
- 任何时候不得声称生产就绪/伦理已批/可真实招募（ATR-025 Pending）。

## 11. 仓库治理产物清单

随实现维护：`IMPLEMENTATION_BASELINE.md`、`IMPLEMENTATION_DECISIONS.md`、`TRACEABILITY_IMPLEMENTATION_MATRIX.md`（机器可读 YAML：implementation_id ↔ Trace ID ↔ ADR ↔ 模块 ↔ 代码位置 ↔ 契约 ↔ 测试 ↔ 状态）、`SECURITY_AND_PRIVACY_PLAN.md`、`THREAT_MODEL.md`（挂 ATR-021、ADR-050–055）、`ACCESSIBILITY_TEST_PLAN.md`、`SYNTHETIC_PILOT_PLAN.md`、`PILOT_READINESS_REPORT.md`、OpenAPI/事件目录、运行手册（运维/备份恢复/事故响应）。Trace ID 只有在代码+测试证据存在时才可标 implemented。

## 12. 第一批代码变更（P0→P1 入口）

1. Monorepo 初始化（pnpm workspaces + TypeScript strict + ESLint + dependency-cruiser 架构规则）。
2. `docker-compose`：PostgreSQL 16 + MinIO + Keycloak（dev）。
3. kernel 包：RequestContext（correlation/causation/trace）、结构化错误（Doc 15 错误码目录起步）、敏感字段日志过滤器、确定性时钟。
4. 迁移框架 + `migration_admin` schema + 首批迁移（outbox/inbox/audit_events/idempotency_records）。
5. CI：build、typecheck、lint、架构边界测试、迁移演练、测试骨架。
6. OpenAPI 生成管线与 `/contracts` 落库。

---

*本计划引用的一切 canonical 名称（聚合、事件、状态、错误码、端点）以 Handbook 文档 8/15/16 为准；术语以 Appendix B 为准；如实现中发现文档间歧义，按 Appendix E 权威序处理并记入 IMPLEMENTATION_DECISIONS.md，不擅改 Handbook。*
