# DEPLOYMENT

> Cloud Run + Neon 部署与 CI/CD 说明。沿用 aging-knowledge-graph 在同一 GCP 项目验证过的模式（WIF 无密钥认证、Secret Manager、`gcloud run deploy --source .`）。**该部署环境仅承载合成数据的概念研究原型**（ADR-061/062）。认证有两种模式（ADR-104）：`AUTH_MODE=google` 是真实认证（见下节「开启 Google 登录」），`AUTH_MODE=dev-header` 是开发/合成试点桩，身份即 `x-actor-id` 所声称者。**当前部署跑在桩上**，访问令牌门是补偿性边界而非身份认证。

## 架构

- **单 Cloud Run 服务**（默认名 `hadi-platform`）：一个容器内由 `tools/start-cloud.mjs` 启动三个进程——API（同源静态托管 `apps/web/dist` 的 Web 应用）+ pg-boss worker + scheduler（`RUN_JOBS=true`，scheduler 错峰 5 秒启动以避免 pg-boss 初始化死锁）。任一进程退出即整容器退出（fail closed：宁可重启，不带病运行掉了安全清扫的服务）。
- **Neon PostgreSQL**：`DATABASE_URL` 由 Secret Manager 的 `HADI_DATABASE_URL` 注入；迁移在部署工作流内、新版本上线**之前**由 GitHub runner 直接对 Neon 执行（全部迁移可逆且 CI 每推送演练）。
- **Knowledge Graph 真实对接**：部署环境默认 `KNOWLEDGE_PLATFORM_MODE=mcp`，指向 https://knowledge-graph.internal.example。
- **访问边界（fail closed）**：`HADI_ACCESS_TOKEN` 密钥存在 → 公网开放但所有 `/v1` 请求必须携带 `X-Access-Token`（常数时间比较；静态资源与 /health 开放，不含数据）；密钥不存在 → 服务以 IAM-only ingress 部署，不对公网开放。Web 端首次用 `<url>/?token=<令牌>` 打开即存储并从地址栏剥离。

## CI/CD 链

每次推送 main：`CI`（构建/lint/边界/追溯/迁移演练/全量测试/备份演练）→ 成功后自动触发 `Deploy to Cloud Run`（部署 CI 验证过的那个 commit，`workflow_run.head_sha`）。仓库变量未配置时部署工作流打印提示并跳过，不置红。手动部署：Actions → Deploy to Cloud Run → Run workflow。

## 一次性设置（三步）

1. **Neon**：在 Neon 控制台创建数据库（或新分支/新项目），拿到 `postgresql://…?sslmode=require` 连接串。无需手工建表——迁移由部署工作流执行。
2. **GCP**（Cloud Shell，项目 Owner 身份）：
   ```bash
   PROJECT_ID=<GCP项目> \
   DATABASE_URL='postgresql://…?sslmode=require' \
   ACCESS_TOKEN="$(openssl rand -hex 24)" \
     bash scripts/setup-gcp.sh
   ```
   脚本可重复运行：启用 API、复用/创建 `github-pool` WIF 池并为**本仓库**新建 provider `github-hadi`（WIF 条件按仓库钉死，KG 仓库的 provider 无法共用）、复用 `deployer` SA 并授予本仓库模拟权、写入 `HADI_DATABASE_URL` / `HADI_ACCESS_TOKEN` 密钥。
3. **GitHub 仓库变量**（Settings → Secrets and variables → Actions → Variables，脚本结尾原样打印）：`GCP_PROJECT_ID`、`GCP_WIF_PROVIDER`、`GCP_SERVICE_ACCOUNT`、`GCP_REGION`。

之后任意一次推送即完成部署；访问 `https://<service-url>/?token=<ACCESS_TOKEN>`。

可选变量：`CLOUD_RUN_SERVICE`（默认 hadi-platform）、`MIN_INSTANCES`（默认 0，见下）、`RUN_JOBS`（默认 true）、`KNOWLEDGE_MCP_URL`。

## 诚实的限制

1. **后台作业与缩容为零**：`MIN_INSTANCES=0` 时无请求即无实例，pg-boss 清扫（匹配过期/投递核实/对象扫描等）只在有实例时运行。研究原型可接受；要连续调度设 `MIN_INSTANCES=1`（有持续费用）。
2. **身份仍是开发桩**：访问令牌是共享密钥边界，不区分个人、不可撤销单人。真实用户接入前提是 OIDC（ADR-104）+ 生产就绪批准（见 PILOT_READINESS_REPORT）。
3. **数据必须保持合成**：该环境不得录入任何真实个人数据（Doc 19 §2 概念模式；ADR-063 的豁免不延伸到经验数据）。
4. **对象存储已接上 Cloudflare R2（ADR-106）**——四项配置齐备，2026-08-08 起运行中的版本在 `/ready` 自报 `fileStorage: object-store`，字节不再写进 Postgres 的 `simulated_blobs` 列。**半配置不会回退，会拒绝启动**。**但「配置接通」不等于「跑通过」**：至今没有任何一个字节从真实浏览器会话进过这个桶——上传、扫描、挂载这条链在部署环境里还没有被走过一遍。**上传扫描仍是模拟器**（只认得 EICAR 测试串，ADR-126），界面不得出现「已查毒」。通信供应商为确定性模拟器。

## 把参与者入口与工作人员入口分成两个网址

设置仓库变量 **`STAFF_HOSTS`**（逗号分隔的主机名，例如 `admin.example.org`），把两个域名都指向同一个 Cloud Run 服务。部署会把它写进 `apps/web/.env.production`，由前端构建读入。不设置就是一个网址、登录页上带着所有入口（本地开发与测试即此模式）。

**这不是访问控制，任何地方都不得这样描述。** 两个域名由**同一个部署**提供、共用**同一个访问令牌**，而身份仍是开发桩——`x-actor-id` 说是谁就是谁（ADR-104）。**能到其中一个网址的人就能到另一个，并且在任何一边都可以声称任意身份。** 这个拆分给出的是：参与者入口上只剩属于他自己的那一道门，以及浏览器按域名分开存放令牌。真正保护工作人员工作的，仍然只有权限引擎。

要让网址之间成为真实边界，需要两个各自持有独立令牌的 Cloud Run 服务（或直接把工作人员那一侧设为 IAM-only）；那是另一件事，本次没有做。

## 本地验证过的冒烟（每次改动部署链后建议重跑）

```bash
pnpm build
DATABASE_URL=postgres://platform:platform_dev_only@localhost:5432/research_platform \
PORT=8099 WEB_DIST_DIR=$PWD/apps/web/dist ACCESS_TOKEN=local-smoke-token-0123456789 \
  node tools/start-cloud.mjs
# 期望：/health 200；/ 返回 SPA；/v1 无令牌 401 标准错误封装；带令牌走正常权限引擎
```

## 开启 Google 登录（ADR-104）

真实用户接入的前提。做完这一节，`x-actor-id` 就再也不被读，身份来自服务端签发、可撤销的会话 cookie。

### 1. 在 Google Cloud 控制台建一个 OAuth 客户端

**API 和服务 → 凭据 → 创建凭据 → OAuth 客户端 ID → Web 应用**。

- **已获授权的 JavaScript 来源**：每一个对外主机名各一条，例如 `https://workspace.test`、`https://staff.internal.example`。
- **已获授权的重定向 URI**：同样每个主机名一条，**指向站点根路径**：`https://workspace.test/`、`https://staff.internal.example/`。参与者入口和工作人员入口是同一个服务的两个域名（D-66），**两个都要登记**——漏一个，那一侧的登录会停在 Google 的错误页上，而且报错只出现在 Google 那边，本平台的日志里什么都看不到。

记下客户端 ID（形如 `…apps.googleusercontent.com`）。它不是机密——它会随页面发给浏览器。

### 2. 配置服务

| 变量 | 必填 | 说明 |
|---|---|---|
| `AUTH_MODE` | 是 | 设为 `google`。设成已废弃的 `oidc` 会被拒绝启动并提示新名字 |
| `GOOGLE_CLIENT_ID` | 是 | 上一步的客户端 ID；ID token 的 `aud` 按它校验 |
| `SESSION_SECRET` | 是 | ≥32 字符随机串，放 Secret Manager。用于签名登录 nonce |
| `GOOGLE_ALLOWED_DOMAINS` | 否 | 逗号分隔，限制只有这些 Workspace 域可登录。**按 `hd` 断言判定，不看邮箱 `@` 后面的字符** |
| `GOOGLE_MFA_DOMAINS` | 否 | 逗号分隔。**这是运营者的一句断言**：该 Workspace 域已强制开启两步验证。见下方「关于强认证」 |
| `ALLOW_SELF_SIGNUP` | 否 | 默认 `true`（所有者裁定）。设 `false` 则未受邀的 Google 账号被拒 |
| `SESSION_TTL_MINUTES` | 否 | 默认 720（12 小时） |
| `STEP_UP_TTL_MINUTES` | 否 | 默认 10。一次重新认证算数多久 |
| `STEP_UP_MAX_AGE_SECONDS` | 否 | 默认 120。Google 必须在多久之内刚认证过 |
| `COOKIE_SECURE` | 否 | 默认 `true`。**只有 http://localhost 才该设 false**——Secure cookie 在明文 HTTP 上根本不会被浏览器保存，表现就是「点了登录什么也没发生」 |

缺 `GOOGLE_CLIENT_ID` 或 `SESSION_SECRET` 时进程**拒绝启动**：一个起来了却谁也认证不了的平台，和一个坏掉的平台长得一模一样。

### 3. 自助注册与邀请

**任何 Google 账号都可以自助注册**（`ALLOW_SELF_SIGNUP`，默认 `true`；固定队列的部署可设 `false` 改为纯邀请制）。

自注册的人拿到的是：一个账号、一份属于自己的参与者记录，**以及一个谁也看不见的视野**。这不是靠登录代码客气，是结构性的——权限引擎第 2 步对没有角色的 actor 一律 `no-granting-role` 拒绝，只剩「自己是资源所有者」这一条路；Open Matching 要求**双方**都已开启，社区要 `community-participation` 同意，而新账号两样都没有。**所以自注册的人是一个人待在平台上的**，直到有人邀请他，或他自己同意了什么。

**邀请是唯一会授予东西的通路。** 它有两种形状：

**（甲）指向一个预先建好的账号**——工作人员入职：管理员先建账号、挂好角色，邀请是账号持有者认领它的方式。

```sql
INSERT INTO identity_org.account_invitations
  (id, user_account_id, issuer, invited_email, expires_at)
VALUES (
  'invite_' || replace(gen_random_uuid()::text, '-', ''),
  '<user_account_id>', 'https://accounts.google.com',
  'staff@example.org', now() + interval '14 days'
);
```

**（乙）不指向账号，只携带一段关系**——参与者邀请女儿来看自己的生命故事。认领的人若还没有账号就自动获得一个；关系带作用域动作，认领即 `Active`（发邀请的参与者本人就是那份批准），此后随时可在「谁能看到我」撤销。

```sql
INSERT INTO identity_org.account_invitations
  (id, issuer, invited_email, expires_at, invited_by,
   relationship_participant_id, relationship_type, relationship_permitted_actions)
VALUES (
  'invite_' || replace(gen_random_uuid()::text, '-', ''),
  'https://accounts.google.com', 'daughter@example.org',
  now() + interval '14 days', '<inviter_user_account_id>',
  '<inviter_participant_id>', 'FamilyMember', ARRAY['life-story.contribute']
);
```

**被邀请的支持者不会被登记成参与者**——被邀请来帮某人，不等于被纳入一项研究；要让认领者同时成为参与者，显式设 `creates_participant = true`。

**邀请对「已经注册过的人」同样生效**：每次登录都会检查待认领邀请。（这一点是自助注册开出来的坑：此前只有陌生账号才会去找邀请，于是一位上周已注册的女儿，她母亲发的邀请会永远躺着不生效，两边都不报错。）

`user_accounts.origin` 记录每个账号是怎么来的（`self-registered` / `invitation` / `created-by-administrator`）——一旦允许自助注册，「谁放这个人进来的」就不再对所有账号都是同一个答案，而事后要分清，就得在当时写下来。

历史写法（账号先建为 `Invited` 态再发邀请）仍然有效：

```sql
INSERT INTO identity_org.account_invitations
  (id, user_account_id, issuer, invited_email, expires_at)
VALUES (
  'invite_' || replace(gen_random_uuid()::text, '-', ''),
  '<user_account_id>',
  'https://accounts.google.com',
  'someone@example.org',
  now() + interval '14 days'
);
```

该邮箱**只决定一件事、且只决定一次**：哪一封待认领的邀请可以被首次登录认领。认领之后，这个人就是他的 Google `sub`，邮箱再改、再被管理员分配给别人，都与账号归属无关。**邮箱不是身份**——按邮箱查账号，等于把离职协调员对参与者的全部访问交给继任者。

引导账号（第一个管理员）没有邀请可发给自己，需要直接为它插一行 `account_invitations`，或沿用 `seed:demo` 的引导路径。

### 关于强认证（10 个动作依赖它）

审批干预版本、裁决导出、锁定数据集、创建安全事件等 10 个动作要求 `mfa` 层。**Google 的 ID token 里没有 `amr`**，所以「这个人用了第二因子」这件事，从 token 里读不出来。

平台因此这样做：

- 普通 Google 登录一律记为 `password`。
- 需要强认证时，界面上出现「确认是你本人」，走一次 `prompt=login` 的重新认证，换来 `step-up`。权限引擎里 step-up(3) **高于** mfa(2)，所以这 10 个动作全部可达。它回答的是更难的问题：不是「今天某个时刻用过第二因子吗」，而是「这个人现在还在键盘前吗」。
- `GOOGLE_MFA_DOMAINS` 是唯一会记 `mfa` 的路径，而它信的是**你的断言**，不是 Google 的证明。填之前请确认该域确实强制开启了两步验证；不填也完全能用，只是这些动作每次都要点一下「确认是你本人」。

### 回滚

把 `AUTH_MODE` 改回 `dev-header` 即可，数据不受影响：已建立的 Google 绑定、邀请、会话都留在库里，改回 `google` 就继续有效。桩模式下不要对外开放。


## 演示账号（合成数据）

部署环境的数据库初始为空——dev-header 登录桩要求 actor/participant 在库中真实存在。运行一次种子即可：

**GitHub → Actions → “Seed demo data” → Run workflow**（幂等：重复运行只打印已有账号，不重复创建）。账号标识会打印在运行摘要里。

种子内容（全部合成，ADR-062）：一个组织；九个角色账号（组织管理员/研究员/审批人/证据评审/安全评审/隐私评审/社区审核/协调员/支持者）；两位参与者（安 Ann、本 Ben，已授予 study-participation、open-matching、participant-messaging、community-participation、supporter-involvement、supporter-contribution 同意）；社区「园艺角」含版本化规则与两人各一条已发布帖子；匹配 → 互相接受 → 连接 → 一条已确认发送的消息；一条 AI 起草并经本人确认为 Testimony 的生命故事条目（可见性 Selected People）；一条经参与者批准的支持者关系。

登录方式（**仅 `AUTH_MODE=dev-header` 下**；开启 Google 登录后这些输入框不再出现，界面改为「使用 Google 登录」，参与者标识由服务端查出、不再需要任何人手输）：首页「参与者」填 actor id + participant id；「员工入口」只填 actor id（审批类 MFA 动作在员工页勾选强认证）；「支持者入口」填支持者 actor id。

访问口令：首次用 `<url>/?token=<令牌>` 打开会存入本机浏览器并从地址栏剥离（因此历史记录里的地址不含令牌）。若清过站点数据或换了设备，任一请求会返回 401，界面顶部会出现「需要此环境的访问口令」横幅，直接在那里重新输入即可——不必再去翻带 token 的链接。

本地同样可用：`DATABASE_URL=… pnpm seed:demo`。
