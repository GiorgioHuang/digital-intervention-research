# SYNTHETIC_PILOT_PLAN

> Doc 18 §210 强制场景与自动化测试的映射。执行方式：`pnpm migrate && pnpm test`（CI 每次推送全量执行，确定性种子 + FixedClock + 供应商/KP/模型模拟器）。

## 端到端主线（packages/synthetic-pilot）

一次完整治理研究周期：证据链→协议批准激活→干预版本/配置→同意→入组→私有 Life Story→Testimony 确认→选择性分享→社区→匹配→MutualAcceptance→Connection→Thread→确认发送→供应商投递（accepted→delivered 回调）→干预暴露→评估→数据集→人工 DatasetLock→分析→解释→人工批准 Finding→撤回传播。

## Doc 18 §210 场景覆盖矩阵

| # | 场景 | 覆盖位置 | 状态 |
|---|---|---|---|
| 2 | 匹配路径成功 | synthetic-pilot + matching 套件 | Verified |
| 3/4 | 匹配拒绝/无 MutualAcceptance | matching 套件（单方 Interested 不产生 MA） | Verified |
| 5 | MutualAcceptance 过期 | matching 套件（时钟推进 8 天） | Verified |
| 7 | MutualAcceptance 复用 | matching 套件 + DB CHECK | Verified |
| 8 | ConnectionRequest 禁用 | matching 套件（FEATURE_DISABLED） | Verified |
| 9/10 | 匹配前/连接后 Block | matching + m18 套件（fail-closed 双向） | Verified |
| 11 | 无 CommunicationBasis 建 Thread | messaging 套件 | Verified |
| 12 | Draft 不发送 | messaging 套件 + DB CHECK | Verified |
| 13 | 确认版本/收件人不匹配 | messaging 套件 | Verified |
| 15 | Provider Accepted ≠ Delivered | messaging + synthetic-pilot | Verified |
| 16 | 重复/乱序回调 | messaging 套件（重放幂等、状态回退拒绝） | Verified |
| 19 | Supporter 贡献拒绝 | m17 套件 | Verified |
| 20 | Life Story 撤回 | m17 套件（授权吊销+历史保留） | Verified |
| 21/22 | 社区举报/审核限制 | m18 套件（人工决定不可变） | Verified |
| 23 | AI 编造检测 | m17（AIDraft≠Testimony）+ m11 | Verified |
| 24/25 | AI MutualAcceptance/未授权发送 | m11 Level-5 全清单按名拒绝 | Verified |
| 26/27 | 信号关闭/人工转换 | m09-m11 套件 | Verified |
| 29 | DatasetLock 拒绝 | m12-m13 套件（自动化/无MFA/未评审均拒） | Verified |
| 30 | 端到端撤回传播 | synthetic-pilot（同意撤回→访问拒 + 退出研究事件） | Verified |
| 1 | 既有联系人路径（无 M18 Connection） | 部分：Relationship 基础在 m03/m17 验证；Thread 的 Relationship-basis 未实现 | Deferred |
| 6 | Consent/Block 变化触发 MA 失效 | 失效状态与拒绝路径已验证；自动失效传播作业未实现 | Deferred |
| 14/17/18 | 供应商失败/Unknown 对账/Block 后取消 | Failed/Unknown 状态转移已验证；对账升级作业与队列取消未实现 | Deferred |
| 28 | 数据集质量失败 | 质量评审门已验证；质量问题记录实体未实现 | Deferred |

Doc 19 补充场景：伪造回调、禁用属性（DB 层）、举报人保密（事件无举报人）、分析重跑（幂等命令）已覆盖；附件隔离扫描未实现（Deferred，对象存储管线 P4 遗留）。
