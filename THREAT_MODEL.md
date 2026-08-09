# THREAT_MODEL

> 状态截至 2026-07-31。方法：按信任边界枚举威胁（STRIDE 分类），对照**已实现的缓解**（附代码/测试证据）与**残余风险**。诚实原则：没有缓解就写没有；模拟器不等于真实防护。

## 1. 系统信任边界

```
[浏览器 web] --HTTP--> [API (NestJS)] --SQL--> [PostgreSQL 单库多 schema]
                          |                        ^
                          v                        |
                    [权限引擎/模块命令]        [worker/scheduler (pg-boss)]
                          |
                    [供应商模拟器: AI/通信/存储扫描]  <-- 真实供应商 Pending
```

边界：B1 浏览器↔API；B2 API↔数据库；B3 worker/scheduler↔数据库；B4 平台↔外部供应商（当前为模拟器）；B5 员工↔治理数据。

## 2. B1 浏览器 ↔ API

| 威胁（STRIDE） | 缓解 | 证据 | 残余风险 |
|---|---|---|---|
| 冒充他人（S） | **认证有两种模式（ADR-104 已裁定并实施）**。`AUTH_MODE=google`：Google OIDC，身份匹配 `(issuer, sub)`（**不匹配邮箱**——邮箱可改名、可被 Workspace 管理员重新分配），自助注册开放（D-69）——但自注册账号无角色、无关系、无同意，权限引擎第 2 步即 `no-granting-role` 拒绝其触及任何非自有资源，Open Matching 需双方开启、社区需同意，故看不到任何他人；**邀请是唯一会授予东西的通路**，`user_accounts.origin` 记录每个账号的来路，会话为服务端可撤销（停用当场生效，不等令牌到期），cookie 为 HttpOnly + SameSite=Lax + 仅存 SHA-256，跨站伪造另加自定义头（跨站表单设不了头）。`AUTH_MODE=dev-header`：开发/合成试点桩，**无真实认证**，环境不得对外暴露。权限引擎按 actor↔participant 身份映射裁决所有权。云部署另有补偿边界（DEPLOYMENT.md）：`ACCESS_TOKEN` 共享密钥门（常数时间比较，/v1 全量拦截，401 标准封装），部署工作流 fail closed——**未被真实认证或令牌门守住时**才以 IAM-only ingress 部署（此前的判据只看令牌，于是按文档删掉令牌以开放注册会把站点下线，等于旧的补偿性控制替换掉它的东西挡在门口） | engine 单测 + e2e 403/404 + 令牌门 e2e + token 校验单测（错 aud/错 iss/过期/错 nonce/对称算法/`hd` 与邮箱后缀之别）+ 会话集成测试（无邀请拒绝、邮箱已认领不可被第二个 Google 账号继承、停用即刻失效、nonce 不可重放、他人账号不得提权） | **google 模式：中**——身份真实、可撤销；残余风险为运营者对 `GOOGLE_MFA_DOMAINS` 的断言（Google ID token 无 `amr`，第二因子无法从 token 证明）。**dev-header 模式：高（固有）**——令牌是边界不是认证，共享、不区分个人、不可单人撤销；部署环境仅限合成数据（ADR-062） |
| 越权访问他人资源（E） | ownerOnly + 受保护存在性 404；Block 实时 fail closed | e2e：档案/对象/会话/队列跨身份探测全部 404/403 | 低 |
| 存在性枚举（I） | DenyAndHideExistence 统一 404 | e2e 多处断言 | 低 |
| 篡改请求重放命令（T/R） | 幂等记录（scope 唯一约束）；版本绑定命令（expectedVersion/412） | database 集成测试；e2e 412 | 低 |
| 未确认的破坏性操作（T） | confirmationRequired 档一律 409 CONFIRMATION_REQUIRED；前端确认对话框先于任何 POST | 组件测试断言"确认前零请求" | 低 |
| 恶意上传（T/D） | 类型白名单、大小限额、隔离+扫描、恶意样本清除、DB CHECK 兜底 | m16 6 集成测试 | 中：扫描器为模拟器，真实恶意检测待供应商 |
| DoS（D） | **无速率限制** | — | **中：限流/配额待托管平台确定后实施** |

## 3. B2/B3 应用 ↔ 数据库

| 威胁 | 缓解 | 证据 | 残余风险 |
|---|---|---|---|
| SQL 注入（T） | 全库参数化查询（无字符串拼接 SQL） | 代码审查约定 | 低 |
| 绕过应用层改写治理数据（T/R） | 不变量下沉为 DB CHECK/触发器：审计/决定/演练记录 append-only、自批 CHECK、Available 门、单次消费 CHECK、批准版本不可变 | 各模块集成测试直接 SQL 攻击断言 | 低 |
| worker 越权（E） | sweep 注入 fail-closed 权限桩（调用即抛）；sweep 仅时间驱动转换 | `apps/worker/src/main.ts` | 低 |
| 事件丢失/重复（T/D） | outbox 事务原子对 + 可见性超时恢复 + inbox 消费幂等 | database 集成测试 | 低 |
| 备份不可恢复（D） | 每推送自动演练：恢复+行数+结构+行为探针 | `tools/backup-restore-drill.mjs` + CI | 中：生产备份策略/异地/加密待 ADR-121 |

## 4. B4 平台 ↔ 外部供应商

| 威胁 | 缓解 | 证据 | 残余风险 |
|---|---|---|---|
| 伪造回调（S/T） | HMAC 签名验证 | m16 负例测试 | 低（密钥管理待生产化） |
| 回调重放（T） | nonce 全局唯一，重复为幂等空操作 | m16 测试 | 低 |
| 供应商谎报送达（R） | 双状态机：Provider Accepted ≠ Delivered；超时对账转 Delivery Unknown，永不臆断成功 | messaging 测试 + sweep 测试 | 低 |
| AI 越权行动（E） | Tool Gateway 17 项 Level-5 按名拒绝；AI 仅能产生信号；模型别名白名单 | m11 集成测试 | 中：真实模型接入后需重评（提示注入面） |
| 供应链（真实 SDK 引入后） | **未缓解**——当前无真实供应商依赖 | — | 待供应商选定后做依赖审查 |

## 5. B5 员工 ↔ 治理数据

| 威胁 | 缓解 | 证据 | 残余风险 |
|---|---|---|---|
| 单人滥权（E/R） | 职责分离（提交≠批准，代码+CHECK）；MFA 档操作；全量审计 | e2e 自批 403 | 低 |
| 审核者报复举报人（I） | 举报人身份从不进入 moderation 队列载荷 | e2e 原始 JSON 断言 | 低 |
| 紧急访问滥用（E/R） | break-glass：MFA+理由/范围/到期+强制非本人追溯审查（角色分离） | m15 测试 + e2e | 低 |
| 决定事后改写（R/T） | 审核决定/审批历史/演练记录 append-only（触发器） | 直接 SQL 攻击测试 | 低 |
| 队列越权窥视（I） | 队列读取按角色隔离（批准人无 triage 队列，反之亦然） | e2e 跨角色 403 | 低 |

## 6. 顶级残余风险清单（按优先级）

1. **认证**：ADR-104 已裁定并实施为 Sign in with Google（D-68）。仍跑在 `AUTH_MODE=dev-header` 的环境**无真实认证，不得对外暴露**；切换步骤见 DEPLOYMENT.md「开启 Google 登录」。残余项：强认证层依赖运营者对 Workspace 域两步验证的断言，或依赖每次重新认证（step-up）。
2. **无限流/配额**——托管平台确定后实施；当前仅限合成环境。
3. **扫描/AI/通信均为模拟器**——真实供应商接入时逐个重做威胁评估（接口不变，ACL 适配器替换）。
4. **传输/静态加密与密钥管理未落地**——依赖托管批准（ADR-103/119/121）。
5. **提示注入面未评估**——真实 LLM 接入前必须完成（Tool Gateway 白名单是第一道防线，不是全部）。

## 7. 维护约定

新增信任边界或供应商接入时更新本文件并在 PR 中引用对应 traceability 条目；每个"残余风险"关闭时必须附代码+测试证据，与 PILOT_READINESS_REPORT 同步。
