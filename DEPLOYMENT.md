# DEPLOYMENT

> Cloud Run + Neon 部署与 CI/CD 说明。沿用 aging-knowledge-graph 在同一 GCP 项目验证过的模式（WIF 无密钥认证、Secret Manager、`gcloud run deploy --source .`）。**该部署环境仅承载合成数据的概念研究原型**（ADR-061/062）：dev-header 身份仍是开发桩，访问令牌门是补偿性边界而非身份认证；接入任何真实用户前必须先完成 OIDC（ADR-104）。

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
4. 对象存储仍为本地模拟器语义（ADR-106 待批），容器重启即失；通信供应商为确定性模拟器。

## 本地验证过的冒烟（每次改动部署链后建议重跑）

```bash
pnpm build
DATABASE_URL=postgres://platform:platform_dev_only@localhost:5432/research_platform \
PORT=8099 WEB_DIST_DIR=$PWD/apps/web/dist ACCESS_TOKEN=local-smoke-token-0123456789 \
  node tools/start-cloud.mjs
# 期望：/health 200；/ 返回 SPA；/v1 无令牌 401 标准错误封装；带令牌走正常权限引擎
```

## 演示账号（合成数据）

部署环境的数据库初始为空——dev-header 登录桩要求 actor/participant 在库中真实存在。运行一次种子即可：

**GitHub → Actions → “Seed demo data” → Run workflow**（幂等：重复运行只打印已有账号，不重复创建）。账号标识会打印在运行摘要里。

种子内容（全部合成，ADR-062）：一个组织；九个角色账号（组织管理员/研究员/审批人/证据评审/安全评审/隐私评审/社区审核/协调员/支持者）；两位参与者（安 Ann、本 Ben，已授予 study-participation、open-matching、participant-messaging、community-participation、supporter-involvement、supporter-contribution 同意）；社区「园艺角」含版本化规则与两人各一条已发布帖子；匹配 → 互相接受 → 连接 → 一条已确认发送的消息；一条 AI 起草并经本人确认为 Testimony 的生命故事条目（可见性 Selected People）；一条经参与者批准的支持者关系。

登录方式：首页「参与者」填 actor id + participant id；「员工入口」只填 actor id（审批类 MFA 动作在员工页勾选强认证）；「支持者入口」填支持者 actor id。

访问口令：首次用 `<url>/?token=<令牌>` 打开会存入本机浏览器并从地址栏剥离（因此历史记录里的地址不含令牌）。若清过站点数据或换了设备，任一请求会返回 401，界面顶部会出现「需要此环境的访问口令」横幅，直接在那里重新输入即可——不必再去翻带 token 的链接。

本地同样可用：`DATABASE_URL=… pnpm seed:demo`。
