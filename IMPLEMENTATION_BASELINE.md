# IMPLEMENTATION_BASELINE

> 初始仓库审计（Master Prompt「Required Initial Repository Audit」要求）。随实现推进持续更新；状态词汇表：`Not Started / Scaffolded / Implemented / Verified / Blocked / Deferred / Pending External Approval`。

## 1. 仓库现状

- 审计时点仓库内容：`docs/`（Architecture Handbook v2.7 全文：文档 0–20 + 附录 A–F）与根级实现治理文件。**无遗留代码、无 CI、无迁移、无环境文件。**绿地实现，无需迁移/淘汰遗留代码。
- 权威版本：以 `docs/appendices/Appendix-D-Handbook-Version-and-Status-Matrix-v2.7.md` 为准，文档 0–20 全部 Reviewed（文档 19 为 Reviewed–Draft，伦理批准 Pending）。Appendix F v1.5 冲突登记簿无未决冲突。

## 2. 选定语言/框架/包管理（详见 IMPLEMENTATION_DECISIONS.md）

- TypeScript（strict）/ Node.js 22 / pnpm workspaces monorepo。
- 后端 NestJS（API 进程），Worker/Scheduler 为同代码库独立入口；前端 React + Vite PWA（后续阶段引入）。
- PostgreSQL 16 单库多 schema；纯 SQL 迁移（node-pg-migrate）+ Kysely 类型化查询；pg-boss 持久队列。
- 本地依赖：docker-compose（PostgreSQL、MinIO、Keycloak-dev）。

## 3. 应用/服务/库现状

| 组件 | 状态 |
|---|---|
| `packages/kernel`（RequestContext、结构化错误、时钟、ID、日志脱敏） | Implemented（50 单测通过） |
| `packages/database`（连接、迁移、outbox/inbox/audit/idempotency 基表） | Implemented（集成测试含迁移 up→down→up 演练） |
| `apps/api`（Doc 15 错误信封/上下文头/dev-header 认证桩 + 参与者侧命令端点（含 M03 relationship 管理与 M17 Life Story 全链）+ 员工侧命令端点（M04 协议链/M05 入组链/M06 干预组合/M09 安全 triage/M12 数据集血缘/M13 分析链/M14 报告·受控导出/M15 审批·治理保留·break-glass）+ M18 属主只读查询 + OpenAPI） | Implemented（22 e2e） |
| `apps/worker` / `apps/scheduler` | Scaffolded（outbox 循环/cron 骨架） |
| `packages/policy` 权限引擎 + `m01-identity-org` + `m03-consent-permission` | Implemented（27 引擎单测 + 13 集成测试） |
| `m02-participant` + `m04-research-design` + `m05-enrolment` | Implemented（P3 链路 12 集成测试） |
| `m06-intervention-portfolio` + `m10-evidence`（含 KP 模拟器） | Implemented（9 集成测试） |
| `m17-life-story` | Implemented（11 集成测试：作者权三态/版本不可变/可见性/贡献流/撤回） |
| `m18-community-social`（社区/匹配/连接/消息全链） + `m16-integration`（供应商模拟器+回调认证） | Implemented（24 集成测试） |
| `m09-safety` + `m11-ai`（信号/人工事件；Model+Tool Gateway，Level-5 全禁） | Implemented（8 集成测试） |
| `m12-dataset` + `m13-analysis`（DatasetLock/分析链/Finding 血缘） | Implemented（5 集成测试） |
| `m07-delivery` + `m08-assessment`（暴露状态/类型化缺失） | Implemented（合成试点覆盖） |
| `m15-governance`（ApprovalRecord 精确工件版本+职责分离 CHECK、append-only 状态历史、GovernanceHold、break-glass 强制追溯审查） | Implemented（5 集成测试） |
| `packages/synthetic-pilot`（端到端合成试点） | Implemented（5 场景组） |
| `m14-reporting`（报告不可变批准版本/受控导出全链/参与者可携带性导出；外部提交显式延后） | Implemented（4 集成测试） |
| `apps/web`（参与者工作区：任务式首页/细粒度同意/消息确认/屏蔽与报告/安全担忧/可选匹配，会话/联系/推荐均来自 API 查询；员工工作区：入组协调/研究者/批准/安全 triage，MFA 分级如实标注、决定署名确认；HTTP-only 边界） | Implemented（21 组件测试） |
| OpenAPI / 事件 schema 目录 | Scaffolded（openapi/openapi.yaml 覆盖现有端点） |

## 4. 数据库与迁移

- 单一 PostgreSQL，逻辑 schema 按 Doc 16 §9 规划（`identity_org` … `community_social` + `storage_ops/search_projection/analytics_stage/migration_admin`）。
- 首批迁移只建横切基表：`platform_kernel` schema 下 outbox_messages、inbox_messages、idempotency_records；`governance_audit.audit_events`（append-only）。模块 schema 随各模块阶段建立。

## 5. API / 事件 / 认证授权 / 测试 / CI / 基础设施现状

- API：`/health`、`/ready` + v1 命令端点（consent 记录/撤回、thread/message/confirm-send），Doc 15 错误信封与稳定错误码，OpenAPI 于 `openapi/openapi.yaml`；认证为显式 dev-header 桩（生产 OIDC Pending ADR-104）。其余模块命令按同一模式增量暴露。
- 认证：无；开发期 Keycloak OIDC，M01 保持 UserAccount 权威（Pending ADR-104）。授权：Effective Permission 引擎 Implemented（packages/policy，M03 PermissionService 落 PolicyDecision）。
- 测试：vitest 单元 + 集成（testcontainers 式，用本地 docker PG）；CI：GitHub Actions（build/typecheck/lint/depcruise/迁移演练/测试）。
- 部署假设：容器化、单区域、托管平台待批（ADR-103/119/121 Pending External Approval）。

## 6. M01–M18 能力状态

M01/M02/M03/M04/M05 Implemented（身份、参与者档案、同意/权限、协议版本、入组全链）；M15 Implemented（审批记录+职责分离 CHECK/治理保留/break-glass 追溯审查 + append-only 审计）。M06/M10/M17 Implemented（干预版本 + 证据链 + Life Story）。M18 社区+匹配 Implemented（Block/Report/ModerationCase/社区/MatchDecision/MutualAcceptance/Connection；ConnectionRequest 功能禁用）。M18/M16 消息管线 Implemented（CommunicationBasis/双状态机/SendConfirmation/回调认证/重放防护）。M09/M11 Implemented（安全人工权威 + AI 治理网关）。M12/M13 Implemented（人工 DatasetLock + Output≠Interpretation≠Finding 全链血缘）。M07/M08 + 合成试点 Implemented。剩余缺口见 PILOT_READINESS_REPORT.md（后台作业/员工侧 Web/正式批准）。

## 7. 与 Handbook 的冲突

- 无已知冲突。注意项：Doc 5 §102 的 MVP 干预组合与 Doc 3 v2.3 不一致，按 Appendix E 权威序采用 Doc 3（INT-009+004+001+002 核心，INT-003 受控 AI 层）；已记录，不改文档。

## 8. 安全/隐私/无障碍/研究风险（初始清单）

1. 供应商未选定（AI/通信/IdP/托管）→ 全部走确定性模拟器 + ACL 接口，fail closed（Pending External Approval）。
2. 保留期/驻留/备份策略未批（ADR-119/120/121）→ 配置驱动，不硬编码。
3. 伦理批准 Pending（ATR-025）→ 任何阶段不得声称可真实招募。
4. 无障碍验收（WCAG AA + 七模式）需真实用户测试，自动化不充分——排入 P4+ 每个参与者纵切。
5. Message 正文加密策略未批（ADR-117）→ 默认排除于日志/事件/索引，应用层信封加密先行。

## 9. 建议实现顺序

见 `IMPLEMENTATION_PLAN.md` §8（P0–P10，映射 MS-00…MS-14，遵守 Doc 18 §174 硬性前置约束）。
