# SECURITY_AND_PRIVACY_PLAN

> 状态截至 2026-07-31。本计划描述**已实现并有测试证据**的安全/隐私控制，以及**尚未满足、不得声称已满足**的事项。依据：Handbook Doc 14（安全/隐私/同意架构）、Doc 15（API 约定）、Doc 4（同意模型）。词汇：`Implemented / Verified / Pending External Approval / Deferred`。

## 1. 身份与认证

| 控制 | 状态 | 证据 |
|---|---|---|
| 生产身份认证（OIDC/Keycloak） | **Pending External Approval（ADR-104）** | — |
| 开发期 dev-header 桩（显式 AUTH_MODE=dev-header 才启用，生产模式拒绝启动） | Implemented | `apps/api/src/http-context.ts`、`apps/api/src/config.ts` |
| 认证强度分级（password / step-up / mfa）随请求传递并由策略引擎裁决 | Implemented | `packages/policy/src/engine.ts`；e2e：无 MFA 批准 → 401 STEP_UP_AUTHENTICATION_REQUIRED |
| MFA 强制清单（协议/干预/发现批准、DatasetLock、SafetyEvent 转换、导出批准、审批决定、break-glass） | Implemented | `packages/policy/src/catalogue.ts` `minimumAuthStrength: 'mfa'` 各条 |

**缺口（不得声称已满足）**：真实 IdP 集成、会话管理、凭证策略、MFA 真实因子——全部待 ADR-104 批准后实施。

## 2. 授权：Effective Permission

- 七要素引擎（Role + Relationship + Consent + Purpose + Context + SpecificPermission + ResourceState）+ Visibility/Block/参与者身份映射，12 步确定性评估。Implemented：`packages/policy/src/engine.ts`（27 单测）。
- **受保护存在性**（ADR-050）：受保护资源的拒绝一律 `DenyAndHideExistence` → 404，不泄露资源是否存在。e2e 覆盖：他人档案/对象/会话/信号探测均 404。
- **Fail closed**：未知动作拒绝；未映射资源类型拒绝；同意缺失拒绝；Block 实时读取即时生效（`m18 createBlock` 后策略服务每次评估现查）。
- 每次评估落 `PolicyDecision` 记录（M03），含策略版本号。

## 3. 同意与目的限定

- 同意按范围逐项记录（决不全局布尔）；撤回原子发布 `ConsentWithdrawn` 并传播（合成试点场景 30 验证：撤回停止新增数据，已锁定数据集不改写）。
- 使用时评估：过期/撤回的同意在下一次权限评估即失效——不依赖清扫。关系过期由 sweep 补齐存量状态（双保险，`m03 sweeps.ts`）。
- 目的代码（X-Purpose-Code）随请求上下文传递，进入审计与事件。

## 4. 数据保护

| 控制 | 状态 | 证据 |
|---|---|---|
| 消息正文默认排除于日志/事件/索引 | Implemented | outbox payload 最小化（Doc 15 §61 注释 + `platform_kernel.outbox_messages` 注释）；举报人身份不进 moderation 队列（e2e 断言原始 JSON） |
| 日志脱敏 | Implemented | `packages/kernel/src/logging.ts` SENSITIVE_KEY_PATTERNS + worker/scheduler pino redact |
| 上传隔离/扫描管线（类型白名单、大小限额、sha256、恶意样本清除、扫描失败不放行、分级继承） | Implemented | `m16 storage-pipeline.ts` + 迁移 0018 CHECK；6 集成测试 |
| 研究导出永不可识别（类型层+DB CHECK 双禁） | Implemented | `m14` + 迁移 0017 |
| 数据分级（Public…Safety-Critical）随对象落库 | Implemented（对象存储域） | 迁移 0018 |
| 消息正文信封加密 | **Pending（ADR-117）** — 当前为默认排除策略先行 | — |
| 静态加密/传输加密/密钥管理 | **Pending External Approval**（依赖托管平台 ADR-103/119/121） | — |

## 5. 审计与治理

- append-only 审计（`governance_audit.audit_events`，触发器拒绝 UPDATE/DELETE，集成测试验证）；每条含 actor、action、target、策略版本。
- 职责分离双层禁止（代码 + DB CHECK）：协议/干预/报告/导出/M15 审批的自批全部不可能。
- break-glass：MFA+确认+理由/范围/到期，强制**非本人**追溯审查（角色天然分离：执行 SystemAdministrator，审查 PrivacyReviewer）。
- 备份恢复演练每推送自动执行，验证恢复库中 append-only 保证仍生效；演练记录 append-only（`tools/backup-restore-drill.mjs`）。

## 6. 集成与供应链

- 全部外部供应商（AI/通信/IdP/托管/对象存储/扫描器）未选定：**确定性模拟器 + ACL 接口，fail closed**。
- 供应商回调：HMAC 签名验证 + nonce 重放防护（`m16 provider-adapter.ts`，负例测试：伪造/重放/未知引用全拒）。
- AI 治理：Model Gateway 别名白名单；Tool Gateway 17 项 Level-5 禁止动作按名拒绝；AI 只能产生 SafetySignal 永不能产生 SafetyEvent。

## 7. 运营安全

- 幂等记录 + outbox at-least-once + 可见性超时恢复（事件不丢）；投递未知对账（永不臆断送达）。
- CI 每推送：build/lint/边界检查/迁移演练/全量测试/备份演练。
- 秘密管理、网络边界、WAF、渗透测试：**Pending External Approval**（托管平台未定）。

## 8. 行动计划（按批准解锁顺序）

1. ADR-104 批准 → OIDC 集成（替换 dev-header 桩，保持 M01 UserAccount 权威），真实 MFA 因子。
2. 托管平台批准（ADR-103）→ 静态/传输加密、密钥管理、网络边界、秘密管理落地。
3. ADR-117 批准 → 消息正文信封加密实施。
4. 供应商合同 → 模拟器逐个替换为真实 ACL 适配器（接口不变，见 THREAT_MODEL §6）。
5. 渗透测试与独立安全评审：在真实基础设施就绪后、真实招募前执行（就绪门条目）。

**本计划不改变就绪门判定：未获伦理批准与上述外部批准前，不得进入真实参与者招募。**
