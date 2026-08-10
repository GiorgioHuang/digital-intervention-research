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

**已获授权的 JavaScript 来源**（每个对外主机名一条）：

```
https://participants.internal.example
https://staff.internal.example
```

**已获授权的重定向 URI —— 这一栏必须填，而且是根路径带结尾斜杠**：

```
https://participants.internal.example/
https://staff.internal.example/
```

**只填了 JavaScript 来源、重定向 URI 留空，登录一定失败**，报 `redirect_uri_mismatch`。而且这个错只出现在 Google 那一页上——本平台的日志里干干净净，什么都看不到，因为浏览器根本没回来过。参与者入口和工作人员入口是同一个服务的两个域名（D-66），**两个都要登记**，漏一个就是那一侧整个进不去。

本实现用的是 OIDC 重定向流（`response_type=id_token`），回跳地址即 `window.location.origin + '/'`，所以登记的必须是根路径。

**客户端密钥（client secret）本平台完全不用**，`response_type=id_token` 不需要它。不要把它放进 Secret Manager，不要放进仓库——建完直接把它删掉/轮换掉最省事，少一样需要保管的东西。

### 2. 发布同意屏幕（否则只有你列的测试用户能登录）

**Google Auth Platform → 目标对象（Audience）**：发布状态若是 **Testing**，则**只有显式列出的测试用户能登录**，其他人一律被 Google 拒在门外——自助注册在这个状态下等于不存在。

本平台只申请 `openid email profile` 三个**非敏感**范围，所以：

- 建客户端时那句「OAuth is limited to 100 **sensitive scope** logins until verified」**与本平台无关**——我们没有申请任何敏感范围。
- 因此发布到 **In production** **不需要**走 Google 的验证审核。

要开放自助注册，就把它发布出去；要先做封闭测试，就留在 Testing 并把参与者逐个加进测试用户列表。

### 3. 配置服务

部署工作流按「配置齐了就切换」的方式识别，和访问令牌门、R2 是同一套做法——**不设旗标日**：`GOOGLE_CLIENT_ID` 仓库变量与 `HADI_SESSION_SECRET` 密钥**两样都在**时，下一次部署自动切到 `AUTH_MODE=google`；缺任一样则留在 dev-header 桩，并在部署摘要里说明缺的是哪一样。

```
# 仓库变量（Settings → Secrets and variables → Actions → Variables）
GOOGLE_CLIENT_ID    = 000000000000-….apps.googleusercontent.com
# 可选：GOOGLE_ALLOWED_DOMAINS / GOOGLE_MFA_DOMAINS / ALLOW_SELF_SIGNUP

# Secret Manager
HADI_SESSION_SECRET = <≥32 字符随机串>
```

| 变量 | 必填 | 说明 |
|---|---|---|
| `AUTH_MODE` | 是 | 设为 `google`。设成已废弃的 `oidc` 会被拒绝启动并提示新名字 |
| `GOOGLE_CLIENT_ID` | 是 | 上一步的客户端 ID；ID token 的 `aud` 按它校验 |
| `SESSION_SECRET` | 是 | ≥32 字符随机串，放 Secret Manager。用于签名登录 nonce |
| `GOOGLE_ALLOWED_DOMAINS` | 否 | 逗号分隔，限制只有这些 Workspace 域可登录。**按 `hd` 断言判定，不看邮箱 `@` 后面的字符** |
| `GOOGLE_MFA_DOMAINS` | 否 | 逗号分隔。**这是运营者的一句断言**：该 Workspace 域已强制开启两步验证。见下方「关于强认证」 |
| `ALLOW_SELF_SIGNUP` | 否 | 默认 `true`（所有者裁定）。设 `false` 则未受邀的 Google 账号被拒 |
| `BOOTSTRAP_ADMIN_EMAIL` | 否 | 第一个管理员的 Google 邮箱。**仅在平台尚无任何管理员时生效**，用完自动失效 |
| `SESSION_TTL_MINUTES` | 否 | 默认 720（12 小时） |
| `STEP_UP_TTL_MINUTES` | 否 | 默认 10。一次重新认证算数多久 |
| `STEP_UP_MAX_AGE_SECONDS` | 否 | 默认 120。Google 必须在多久之内刚认证过 |
| `COOKIE_SECURE` | 否 | 默认 `true`。**只有 http://localhost 才该设 false**——Secure cookie 在明文 HTTP 上根本不会被浏览器保存，表现就是「点了登录什么也没发生」 |

缺 `GOOGLE_CLIENT_ID` 或 `SESSION_SECRET` 时进程**拒绝启动**：一个起来了却谁也认证不了的平台，和一个坏掉的平台长得一模一样。

### 4. 第一个管理员

设一个仓库变量：

```
BOOTSTRAP_ADMIN_EMAIL = you@example.org
```

用那个 Google 账号登录一次，即获得 `SystemAdministrator`。**只在平台还没有任何管理员时生效**——一旦有人持有该角色，这个变量就什么也不做了，包括对变量里写的那个人。这就是它是「引导」而不是「后门」的原因。邮箱必须是 Google 已验证的，否则任何知道这个地址的人都能注册一个声称该地址的 Google 账号、然后成为平台管理员。

之后的一切都在界面里：进工作人员工作区 → 选组织（没有组织时可以直接建一个）→「账户与角色」。

### 5. 自助注册与邀请（都在界面里）

**任何 Google 账号都可以自助注册**（`ALLOW_SELF_SIGNUP`，默认 `true`；固定队列的部署可设 `false` 改为纯邀请制）。

自注册的人拿到的是：一个账号、一份属于自己的参与者记录，**以及一个谁也看不见的视野**。这不是靠登录代码客气，是结构性的——权限引擎第 2 步对没有角色的 actor 一律 `no-granting-role` 拒绝，只剩「自己是资源所有者」这一条路；Open Matching 要求**双方**都已开启，社区要 `community-participation` 同意，而新账号两样都没有。

**邀请是唯一会授予东西的通路**，三种都在界面上：

| 要做的事 | 在哪里 |
|---|---|
| 邀请一位同事加入 | 工作人员 →「账户与角色」→ 邀请某人 |
| 让一个**已存在但没人能登录**的账号（迁移前建的、种子建的）重新有人 | 同一屏，该账号卡片上的「邀请其持有者」 |
| 给某人角色 | 同一屏，账号卡片上的角色下拉 |
| 参与者邀请自己的支持者（女儿看生命故事） | 参与者 →「谁能看到我」→「邀请某人看我的东西」 |
| 新建组织 | 选组织那一屏（需平台管理员） |

**平台不会发邮件。** 它没有邮件发送能力，三处界面都在第一行这么写——邀请只是被记录，地址和有效期回显给你，由你自己转告对方。一个叫「邀请」却什么也不发的按钮，比一个明说自己只是登记的按钮更坏。

**邀请对「已经注册过的人」同样生效**：每次登录都会检查待认领邀请。

`user_accounts.origin` 记录每个账号是怎么来的（`self-registered` / `invitation` / `created-by-administrator`）。

### 6. 关于强认证（10 个动作依赖它）

审批干预版本、裁决导出、锁定数据集、创建安全事件等 10 个动作要求 `mfa` 层。**Google 的 ID token 里没有 `amr`**，所以「这个人用了第二因子」这件事，从 token 里读不出来。

平台因此这样做：

- 普通 Google 登录一律记为 `password`。
- 需要强认证时，界面上出现「确认是你本人」，走一次 `prompt=login` 的重新认证，换来 `step-up`。权限引擎里 step-up(3) **高于** mfa(2)，所以这 10 个动作全部可达。它回答的是更难的问题：不是「今天某个时刻用过第二因子吗」，而是「这个人现在还在键盘前吗」。
- `GOOGLE_MFA_DOMAINS` 是唯一会记 `mfa` 的路径，而它信的是**你的断言**，不是 Google 的证明。填之前请确认该域确实强制开启了两步验证；不填也完全能用，只是这些动作每次都要点一下「确认是你本人」。

### 7. 要开放自助注册，访问令牌门得先撤掉

`ACCESS_TOKEN` 拦的是**全部** `/v1`，包括 `/v1/auth/nonce` 和 `/v1/auth/session`。也就是说**只要它还在，没有口令的人连登录都发起不了**——自助注册在事实上不存在，「注册」变成了「先拿到共享口令的人才能注册」。

这不是缺陷：那道门当初的存在理由，代码注释里写得很清楚——它是**身份还是桩**时的补偿性边界。真身份一上，它的差事就办完了。

- **要开放注册**：删掉 `HADI_ACCESS_TOKEN` 密钥，**然后重新部署一次**（Actions → Deploy to Cloud Run → Run workflow）。删除密钥本身不触发部署，而且服务上一版仍绑定着那个密钥——不重新部署，下一次冷启动会因为引用了不存在的密钥而起不来。
- **想先做封闭测试**：留着它，此时「自助注册」实际等价于「持口令者注册」，这也是一种合理的过渡状态——只要知道自己处在哪一种。

### 8. 回滚

把 `AUTH_MODE` 改回 `dev-header` 即可，数据不受影响：已建立的 Google 绑定、邀请、会话都留在库里，改回 `google` 就继续有效。桩模式下不要对外开放。


## 演示账号（合成数据）

部署环境的数据库初始为空——dev-header 登录桩要求 actor/participant 在库中真实存在。运行一次种子即可：

**GitHub → Actions → “Seed demo data” → Run workflow**（幂等：重复运行只打印已有账号，不重复创建）。账号标识会打印在运行摘要里。

种子内容（全部合成，ADR-062）：一个组织；九个角色账号（组织管理员/研究员/审批人/证据评审/安全评审/隐私评审/社区审核/协调员/支持者）；两位参与者（安 Ann、本 Ben，已授予 study-participation、open-matching、participant-messaging、community-participation、supporter-involvement、supporter-contribution 同意）；社区「园艺角」含版本化规则与两人各一条已发布帖子；匹配 → 互相接受 → 连接 → 一条已确认发送的消息；一条 AI 起草并经本人确认为 Testimony 的生命故事条目（可见性 Selected People）；一条经参与者批准的支持者关系。

登录方式（**仅 `AUTH_MODE=dev-header` 下**；开启 Google 登录后这些输入框不再出现，界面改为「使用 Google 登录」，参与者标识由服务端查出、不再需要任何人手输）：首页「参与者」填 actor id + participant id；「员工入口」只填 actor id（审批类 MFA 动作在员工页勾选强认证）；「支持者入口」填支持者 actor id。

访问口令：首次用 `<url>/?token=<令牌>` 打开会存入本机浏览器并从地址栏剥离（因此历史记录里的地址不含令牌）。若清过站点数据或换了设备，任一请求会返回 401，界面顶部会出现「需要此环境的访问口令」横幅，直接在那里重新输入即可——不必再去翻带 token 的链接。

本地同样可用：`DATABASE_URL=… pnpm seed:demo`。
