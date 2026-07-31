# PILOT_READINESS_REPORT

> 状态截至 2026-07-30。**结论：合成试点验证通过（synthetic-Pilot validation passed）；正式 Pilot 就绪 = Pending External Approval。本系统未获伦理批准，不得用于真实参与者招募（ATR-025）。**

## 已具备（代码 + 测试证据，见 traceability.yaml 29 条目）

- M01–M13、M16–M18 全部十六个模块域 Implemented；M14（报告/导出）与 M15 完整审批工作流为最小实现。
- 约 200 个确定性测试（CI 每推送全量执行，全新数据库 + 迁移演练 up→down→up）。
- 关键不变量全部有代码+测试证据：Effective Permission 七要素、granular Consent 与撤回传播、协议/干预/证据快照/数据集锁定不可变性、AI Draft≠Testimony、Block fail-closed、独立 MatchDecision、MutualAcceptance 单次消费、CommunicationBasis、消息双状态机与精确 SendConfirmation、回调认证/重放防护、SafetySignal 人工权威、Level-5 AI 禁止全清单、Output≠Interpretation≠Finding、职责分离（自批双层禁止）。
- 合成试点端到端主线 + 场景矩阵（见 SYNTHETIC_PILOT_PLAN.md）。

## 未就绪 / 显式缺口（不伪造完成）

1. **Pending External Approval**：伦理（ADR-048/ATR-025）、供应商合同（AI/通信/IdP/托管/对象存储）、政策值（保留期/驻留/备份 RPO-RTO/附件/投递映射/MA 有效期）、匹配属性注册表与 feed 排序政策、分析环境。
2. **Deferred（代码层）**：其余模块命令的 REST 端点（已暴露：参与者侧全链 + 员工侧 M04 协议链/M05 入组链/M06 干预组合/M12 数据集血缘/M13 分析链 + M18 属主查询；未暴露：M09 triage、M17 Life Story、M15 审批工作流等）；员工侧 Web 工作区（当前仅 API）；消息历史查询端点；apps/web 其余工作区（Supporter/Moderator/Researcher 等）与 WCAG AA 真实用户测试（参与者工作区核心流程已实现：任务式首页、细粒度同意、消息发送确认；自动化测试不替代真实用户无障碍验收）；对象存储上传隔离/扫描管线；对账/过期/失效后台作业接入 scheduler；M14 导出包与 M15 完整审批工作流；备份恢复演练自动化；SECURITY_AND_PRIVACY_PLAN/THREAT_MODEL/ACCESSIBILITY_TEST_PLAN 详细文档。
3. 合成场景 1/6/14/17/18/28 部分覆盖（见计划矩阵 Deferred 行）。

## 就绪门（Doc 18 §193）判定

代码/测试类条目：满足。人员配备、伦理、供应商、无障碍真实用户测试、备份恢复演练、正式签署：**全部未满足——不得进入真实招募**。
