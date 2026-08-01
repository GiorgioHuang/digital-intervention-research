# RESEARCH_BASELINE

> 概念研究阶段初始审计（Master Prompt v1.2「Required Initial Audit」）。审计时点 2026-07-31。每个论断标注认识论状态（Doc 19 v1.3 §10 词汇）。

## 1. 仓库结构与当前技术栈 `[Prototype Observation]`

- pnpm workspaces monorepo：`apps/{api,web,worker,scheduler}` + `packages/{kernel,database,policy,synthetic-pilot}` + `packages/modules/m01…m18`（16 个模块包，M14/M15 已补齐）。
- TypeScript strict / Node 22 / NestJS / PostgreSQL 16 单库多 schema / node-pg-migrate 纯 SQL 迁移（20 个，全部可逆且每推送演练）/ pg-boss / React 18 + Vite。
- 全部外部依赖为**确定性模拟器**：通信供应商（HMAC 回调+重放防护）、Knowledge Platform、模型/工具网关、对象存储+扫描器、身份（dev-header 桩）。约 240 个确定性测试，CI 每推送全量执行。
- 治理工件：traceability.yaml（52 条，工具校验）、IMPLEMENTATION_BASELINE、PILOT_READINESS_REPORT、SECURITY_AND_PRIVACY_PLAN、THREAT_MODEL、ACCESSIBILITY_TEST_PLAN、SYNTHETIC_PILOT_PLAN。

## 2. 检出的权威版本 `[Source-Derived]`

依据 README v2.9（新基线声明文件）：Doc 0 v1.2；Doc 1 v2.2（Active Conceptual Research Foundation）；Doc 2 v2.1；Doc 3 v2.3；Doc 4 v3.0；Doc 5 v2.1；Doc 6 v3.1；Doc 7 v3.0；Doc 8 v3.2；Doc 9 v1.1；Doc 10 v1.1；Doc 11 v1.2（Active Conceptual Research and Theoretical Evaluation Baseline）；Doc 12 v1.2；Doc 13 v1.2；Doc 14 v1.1；Doc 15 v1.2；Doc 16 v1.2；Doc 17 v1.1(假定，README 为准)；**Doc 18 v1.3（Conceptual Research Scope & Prototype Roadmap）；Doc 19 v1.3（Conceptual Research Programme，CRP-HA-DIRP-001，无人类受试者批准要求）；Doc 20 v1.3（Conceptual Prototype UX）**。

**当前项目模式**（Doc 1 v2.2 §3.1 / Doc 18 v1.3 §3.2 / Doc 19 v1.3 §2）：概念与理论研究项目，可立即开始；伦理/机构治理/供应商/生产就绪批准**不是当前理论工作的前提**；Handbook 中的 Consent/Safety/批准等一律解释为**被建模的未来系统的属性**，不是当前研究的门槛。

## 3. 既有概念模型与代码 `[Prototype Observation]`

现有实现即为 Doc 18 v1.3 §4 定义的「可执行研究工件」的候选实体：M01–M18 全域、Effective Permission 七要素引擎、Life Story 作者权三态、匹配/互相接受/连接全链、消息双状态机、Block fail-closed、安全人工权威、AI 治理网关（Level-5 全禁）、数据集血缘、审批/治理保留/break-glass、合成试点端到端周期（≈Doc 18 §169 Milestone 13 的全链）。Doc 18 v1.3 对既有代码复用保持沉默（既不授权也不禁止）——本基线的处置见 §9。

## 4. 当前研究问题 `[Source-Derived]`

Doc 19 v1.3 §7 主问题（5）与 §8 次问题（5），无字母数字 ID（文档原样为编号清单）；本仓库以 `RQ-P1…P5 / RQ-S1…S5` 为内部引用编号（`Design Assumption`——编号是仓库便利，非文档权威）。详见 CONCEPTUAL_RESEARCH_PLAN.md。

## 5. M01–M18 概念实现状态 `[Prototype Observation]`

全部 18 个模块域有实现+测试证据（见 IMPLEMENTATION_BASELINE.md §3/§6 与 traceability.yaml）。以概念研究口径重述：**关键不变量已可执行**（Doc 19 v1.3 §24 的十项优先不变量全部有 DB 约束/触发器+测试）；缺口是**研究层工件**：概念目录、机制模型、理论命题、形式化域模型文档、人物画像框架、情景目录、矛盾登记、理论发现——即 WP-01…WP-10 的文档与分析产出。

## 6. 代码与 Handbook 的矛盾 `[Contradiction]`（详见 CONTRADICTION_REGISTER.md）

- CON-001：README v2.9 引用 Appendix A v1.3 / C v1.2 / D v2.9 / E v1.9 / F v1.7 与 `Documents-0-20-Handbook-Consistency-Review-v1.0.md`——**六者皆不在仓库**（盘上为 A1.1/C1.0/D2.7/E1.7/F1.5，Review 文件不存在）。
- CON-002：Master Prompt v1.2 引用 **ADR-061…064** 作为模式转换依据——全仓库零命中；Appendix C v1.0 至 ADR-060 截止（061–100 为空号段）。概念模式转换**没有对应的 ADR 落盘**。
- CON-003：Appendix E v1.7（盘上版）仍是 Pilot 时代权威图（要求伦理批准、Pilot 门），与 README v2.9/Doc 1 v2.2 的概念基线直接冲突；README 期望的 E v1.9 缺失。
- CON-004：Doc 18 v1.3 残留 v1.2 文本（§144/157/170/171/178/205/232/234 仍述及伦理批准与招募）——由 §3.2 解释性条款控制（读作未来系统属性），但孤立引用会得出矛盾答案。
- CON-005：README §9 的 21 个 `Document-N-…` 规范文件名与实际文件布局（卷目录+数字前缀）全部不符；被取代的 Doc 18/19/20 v1.2 未归档，与 v1.3 并存。

处置（Master Prompt 权威序第 5–8 步）：保留上游概念含义（README v2.9 + Doc 1 v2.2 + Doc 18/19/20 v1.3 为现行基线——这是 Appendix E §14 精神下的最新明示权威）；矛盾如实登记；不臆造缺失的附录内容；继续不受影响的研究。

## 7. 可用合成数据与固定装置 `[Prototype Observation]`

- `packages/synthetic-pilot`：端到端合成研究周期（FixedClock 确定性、显式种子后缀）。
- 各模块集成测试内嵌合成场景（Doc 18 §210 强制清单大部分有对应负例测试，映射见 SYNTHETIC_PILOT_PLAN.md）。
- 缺：独立的带种子/schema 版本/场景 ID/出处标签的**合成数据生成器**（WP-06）与**人物画像框架**（WP-05）。

## 8. 代码中的隐藏假设 `[Inference]`（研究对象，待 WP-09 深挖）

1. 身份映射假设 account↔participant 一对一（`findParticipantIdByAccount` 单值）。
2. 匹配 TTL/互相接受有效期取自 `DEFAULT_MATCHING_CONFIG`——数值是设计假设而非理论推导。
3. 投递未知阈值（120 分钟）为运维直觉，无机制模型支撑。
4. 数据分级由归属资源类型静态映射——隐含「敏感度可由类型完全决定」的可争议命题。
5. 政策目录中的角色→权限授予矩阵含若干未论证的裁量（如 Supporter 不持有 contribution 之外的读权）。

## 9. 建议的第一研究工作包 `[Design Assumption]`

**WP-01 概念与术语审计**（已随本基线启动，见 CONCEPT_CATALOGUE.md）。理由：Doc 19 §7 主问题 1「框架是否内部融贯」的前置是概念显式化；且现有代码把大量概念区分（Draft≠Testimony、Accepted≠Delivered、Signal≠Event、Output≠Finding）实现为可执行不变量——概念目录可以直接把每个定义锚定到可执行证据，这是本仓库相对纯文档研究的独特杠杆。

既有生产轨道工件的处置：**保留并重新定性**——IMPLEMENTATION_BASELINE/PILOT_READINESS_REPORT 等按其原语境继续如实描述代码；新研究层工件（本文件起）以 Doc 19 v1.3 认识论纪律撰写。二者通过 traceability 互链，不互相改写。
