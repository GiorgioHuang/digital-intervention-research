# IMPLEMENTATION_DECISIONS

> 针对 Appendix C 全部开放 ADR（ADR-101…125）及两条 Pending 的既定 ADR 的实现层处置。状态：`Adopted for Implementation`（实现采用，待正式 ADR 批准）/ `Proposed` / `Blocked` / `Pending External Approval` / `Not Applicable`。仓库中不存在预先解决这些 ADR 的既有代码（绿地）。本文件不构成正式批准；决策包（≥2 备选、安全/隐私/驻留评审等）由治理流程另行完成。

## 既定 ADR 的遵从声明

ADR-001…060 全部按 Accepted/Deferred/Prohibited 原样遵从；实现不启用任何 Deferred/Prohibited 能力（ConnectionRequest、Internet Public、群发、自主高影响 AI 等以显式禁用态存在，返回稳定错误码）。ADR-048/049（试点设计、分阶段激活）为 Pending Approval：软件按其形态实现，但激活以批准为前提。

## 开放 ADR 处置表

| ADR | 主题 | 处置 | 状态 | 关联 Trace |
|---|---|---|---|---|
| ADR-101 | 后端语言框架 | TypeScript 5(strict)/Node 22/NestJS；模块=Nest module+包边界；依赖巡航强制 M01–M18 隔离 | Adopted for Implementation | ATR-003/004/022, CHG-* |
| ADR-102 | 参与者客户端 | React+Vite 响应式 PWA；OpenAPI 生成客户端 | Adopted for Implementation | ATR-006 |
| ADR-103 | 托管平台 | 未定；容器化+12-factor 保持可移植；识别数据入库前必须批准 | Pending External Approval | ATR-021 |
| ADR-104 | 身份供应商 | 开发期 Keycloak(OIDC)；M01 为 UserAccount 权威；OIDC ACL 隔离 | Proposed（生产 IdP 待批） | ATR-003 |
| ADR-105 | 托管 PostgreSQL | 本地/CI 用 PG16 容器；生产托管服务待批 | Proposed | ATR-019 |
| ADR-106 | 对象存储 | S3 兼容接口；本地 MinIO；上传隔离/扫描管线按 Doc 16 §46–50 | Proposed | ATR-021 |
| ADR-107 | 队列/调度 | pg-boss（PG 持久队列+cron），按工作负载分队列；与 outbox 同库事务语义 | Adopted for Implementation | ATR-023 |
| ADR-108 | Search/Vector | PG 全文检索；pgvector 可选且默认关闭；派生投影再授权 | Adopted for Implementation | ATR-015/016 |
| ADR-109 | AI 供应商/网关栈 | Model Gateway+Provider Registry+别名先行；确定性本地模拟 Provider；真实供应商接入以批准为前提 | Pending External Approval | ATR-018 |
| ADR-110 | Knowledge Platform 传输 | MCP 优先、REST 回退的 M10 ACL 接口；真实 MCP 客户端已实现并对接 Healthy Aging Knowledge Graph（JSON-RPC POST /mcp，Cloud Run+Neon 实例，retrieval-identity 版本化，失败关闭）；确定性 KP 模拟器保持默认（KNOWLEDGE_PLATFORM_MODE 显式切换），见 KNOWLEDGE_GRAPH_INTEGRATION.md | Adopted for Implementation | ATR-005 |
| ADR-111 | 通信供应商 | M16 适配器契约+回调认证/重放防护先行；确定性 Provider Simulator（可脚本化 accepted/delivered/failed/unknown/重放/乱序） | Pending External Approval | ATR-014/023 |
| ADR-112 | 匹配算法/属性注册表 | 属性注册表+禁用属性 DB 约束+规则式候选生成骨架；算法与注册表内容待批 | Pending External Approval | ATR-009/010 |
| ADR-113 | 社区 feed 排序 | 默认时间序（治理排序待批）；不实现注意力优化 | Pending External Approval | ATR-008 |
| ADR-114 | 第三方审核供应商 | 不接入；人工审核工作流为准；接口预留 | Proposed | ATR-008 |
| ADR-115 | 分析环境 | 导出式工作流（受控导出包），无生产库凭据 | Pending External Approval | ATR-019/020 |
| ADR-116 | 数据集文件格式 | Parquet+manifest+变量字典+校验和；CSV 仅交换 | Adopted for Implementation | ATR-019 |
| ADR-117 | Message 正文加密 | 应用层信封加密（列内密文或对象引用）；密钥独立；正文默认排除日志/事件/索引 | Proposed（策略待批） | ATR-015 |
| ADR-118 | RLS | 非唯一控制；对含 organisation_id 的高敏表可选启用为纵深 | Proposed | ATR-021 |
| ADR-119 | 数据驻留区域 | 配置驱动的 region 路由约束；不签供应商前不定值 | Pending External Approval | ATR-021 |
| ADR-120 | 保留期计划 | retention_policies 配置表驱动；未定值 fail closed（不自动删除、不无限保留敏感回调证据——按域最短安全默认+人工复核） | Pending External Approval | ATR-024 |
| ADR-121 | 备份/RPO/RTO | PITR+恢复演练脚本；目标值待批 | Pending External Approval | ATR-021 |
| ADR-122 | 可观测性/审计技术 | OpenTelemetry+pino（脱敏过滤一等公民）；治理审计=M15 append-only 表，与遥测分离 | Adopted for Implementation | ATR-022 |
| ADR-123 | 附件格式/限制 | 配置驱动 allowlist+大小限额；默认最小集（图片/音频），待批 | Pending External Approval | ATR-014 |
| ADR-124 | 投递映射/Unknown 超时 | 供应商证据→canonical 状态映射表+Unknown 超时全部配置化；reconciliation 升级路径实现 | Pending External Approval | ATR-014/023 |
| ADR-125 | MutualAcceptance 有效期/确认步骤 | 有效期/失效触发器配置化；额外确认步骤以功能旗标预留（默认关） | Pending External Approval | ATR-011 |

## 未决批准依赖汇总

伦理与试点（ADR-048/049、ATR-025）、四类供应商合同（ADR-103/104/105/106/109/111/114）、政策值（ADR-119/120/121/123/124/125）、匹配与排序政策（ADR-112/113）、分析环境（ADR-115）、加密策略（ADR-117）。全部按「接口+模拟器先行、配置驱动、fail closed、不伪造批准」处理，不阻塞无关工作流。

---

## 概念研究模式补章（2026-07-31，Master Prompt v1.2 / README v2.9 基线）

- 项目模式转换：生产轨道 MVP → 概念研究与可执行原型（Doc 1 v2.2 §3.1、Doc 18/19/20 v1.3）。既有 ADR-101…125 的处置**不变**——它们描述的是被建模系统的架构选择，其「Pending External Approval」标记现在解释为「转入经验阶段时才需要的批准」，不是当前研究的门（Doc 18 §3.2）。
- 被 Master Prompt 引用的 ADR-061…064：**仓库内不存在**（Appendix C v1.0 至 ADR-060 截止）。登记为 CON-002，不臆造内容。模式转换的落盘依据取新版文档正文。
- 原型工程选择（Doc 18 §137/§115 对照）：现有栈完全落在允许范围内（本地 PG、pg-boss、模拟器、非生产 UI）；无微服务/K8s/多区域/生产身份——与「Do not over-engineer」一致。`Adopted for Prototype`。
- 生产就绪类工件（PILOT_READINESS_REPORT 等）保留原语境如实描述；其「不得真实招募」结论在概念模式下依然成立且更强（Doc 19 §32 无人类受试者）。
