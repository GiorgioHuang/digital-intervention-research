# PILOT_READINESS_REPORT

> 状态截至 2026-07-30。**结论：合成试点验证通过（synthetic-Pilot validation passed）；正式 Pilot 就绪 = Pending External Approval。本系统未获伦理批准，不得用于真实参与者招募（ATR-025）。**

## 已具备（代码 + 测试证据，见 traceability.yaml 29 条目）

- M01–M13、M16–M18 全部十六个模块域 Implemented；M14 报告/受控导出/可携带性导出 Implemented（外部提交显式延后）；M15 审批/治理保留/break-glass Implemented。
- 约 200 个确定性测试（CI 每推送全量执行，全新数据库 + 迁移演练 up→down→up）。
- 关键不变量全部有代码+测试证据：Effective Permission 七要素、granular Consent 与撤回传播、协议/干预/证据快照/数据集锁定不可变性、AI Draft≠Testimony、Block fail-closed、独立 MatchDecision、MutualAcceptance 单次消费、CommunicationBasis、消息双状态机与精确 SendConfirmation、回调认证/重放防护、SafetySignal 人工权威、Level-5 AI 禁止全清单、Output≠Interpretation≠Finding、职责分离（自批双层禁止）。
- 合成试点端到端主线 + 场景矩阵（见 SYNTHETIC_PILOT_PLAN.md）。
- Knowledge Platform 真实对接：Healthy Aging Knowledge Graph MCP 客户端（ADR-052/110）经 REST 全链暴露（evidence.search → 评审 → 引用 provenance → 双人批准 → 快照），CI 每推送对已部署 Cloud Run+Neon 实例真实调用冒烟；模拟器保持默认（KNOWLEDGE_PLATFORM_MODE 显式切换）。审计与能力矩阵见 KNOWLEDGE_GRAPH_INTEGRATION.md。

## 未就绪 / 显式缺口（不伪造完成）

1. **Pending External Approval**：伦理（ADR-048/ATR-025）、供应商合同（AI/通信/IdP/托管/对象存储）、政策值（保留期/驻留/备份 RPO-RTO/附件/投递映射/MA 有效期）、匹配属性注册表与 feed 排序政策、分析环境。
2. **Deferred（代码层）**：其余模块命令的 REST 端点（已暴露：参与者侧全链 + 员工侧 M04 协议链/M05 入组链/M06 干预组合/M09 安全 triage/M12 数据集血缘/M13 分析链 + M17 Life Story + M03 relationship 管理 + M14 报告·受控导出 + M15 审批·治理保留·break-glass + M18 属主查询）；WCAG AA 真实用户测试（参与者工作区核心流程已实现：任务式首页、细粒度同意、消息发送确认；自动化测试不替代真实用户无障碍验收）。SECURITY_AND_PRIVACY_PLAN/THREAT_MODEL/ACCESSIBILITY_TEST_PLAN 已起草（详见各文件；其中真实用户无障碍验收 R1–R3 与残余风险关闭仍未满足）。
3. 合成场景 1/6/14/17/18/28 部分覆盖（见计划矩阵 Deferred 行）。

## 就绪门（Doc 18 §193）判定

代码/测试类条目：满足。人员配备、伦理、供应商、无障碍真实用户测试、正式签署：**全部未满足——不得进入真实招募**。
