# CONCEPT_CATALOGUE（WP-01）

> 规范概念目录。每条：定义（含权威出处与认识论标签）、必要/充分条件（可给则给）、相关概念、排除、含混点、未决问题、**可执行证据**（本仓库独有杠杆：定义若已落为代码不变量，注明其测试）。术语以 Appendix B v1.1 为准；概念性定义以 Doc 1 v2.2 / Doc 2 v2.1 为准。状态：`In Analysis`。

---

## C-01 Healthy Aging（健康老龄化）

- **定义** `[Source-Derived: Doc 2 §6.1/§6.15]`：由 Healthy Aging Challenge 反向界定——影响个人过一种有意义、有连接、有参与、自主导向的晚年生活能力的条件/障碍/转变/未满足需求；Healthy Aging Outcome 是与功能能力、参与、关系、身份、自主、意义、福祉相关的更广结局。
- **必要条件（分析性）**：涉及晚年生活能力维度之一；不可仅以年龄定义人群（Doc 2 §6.3）。
- **相关**：Proximal Outcome、Process Outcome、Engagement。
- **排除** `[Definition]`：平台活动量不是 Healthy Aging（Doc 2 §6.12「Engagement is not automatically benefit」；Doc 18 §227）。
- **含混点** `[Contradiction 候选]`：Handbook 未给出 Healthy Aging 的正面充分条件——只有维度列举；「meaningful」的判据始终由参与者主观立场锚定还是允许外部评定，未明说。→ **RQ-S1**。
- **可执行证据**：无（结局层概念，原型只承诺不混淆——见 C-05 的测试）。

## C-02 Autonomy（自主）

- **定义** `[Source-Derived: Doc 2 §41]`：机制含自我决定、感知控制、信心、减少强制、信任；「自主既可以是结局也可以是安全机制」。
- **必要条件（本平台操作化）** `[Deductive]`：选择可行使（含拒绝/暂停/撤回）+ 选择不被预设 + 后果可理解。
- **相关**：Participant Control（C-07）、Supported Decision-Making（Appendix B §5：协助不转移作者权与权威）。
- **排除**：能力变化不等于自主丧失（Doc 2 L440）。
- **可执行证据**：同意无预选+等权按钮（`apps/web/test/consent-panel.test.tsx`）；撤回需显式确认且后果先示（同上）。

## C-03 Meaningful Engagement（有意义的投入）

- **定义** `[Source-Derived: Doc 2 §40, Doc 1 §10.9]`：经由好奇、掌握、乐趣、目的、创造、社会互动、参与所珍视活动等机制的投入；显式反对 engagement 最大化（"Meaningful Engagement Over Addictive Engagement"）。
- **必要条件** `[Inference]`：活动被参与者珍视（主观锚定）+ 机制经过上述通道之一。**高投入量不是充分条件**（Doc 2 §40「High engagement does not prove meaningful benefit」）。
- **含混点**：「valued activity」的判定操作化缺失 → **RQ-S1/RQ-S2**。
- **可执行证据**：首页为任务清单而非信息流（Doc 20 §107；`apps/web` App.tsx + 测试）。

## C-04 Meaningful Human Connection（有意义的人际连接）

- **定义** `[Deductive: Doc 19 §9 TP-03 + Doc 2 §42]`：数字连接的价值在于其支持有意义的人际互动，而非互动量。平台内操作化为：Connection（C-13）之上发生的、双方自主发起且可随时终止的互动。
- **区分链** `[Definition, Doc 18 §322 / Master Prompt WP-02]`：`Platform Activity ≠ Intervention Exposure ≠ Human Interaction ≠ Healthy Aging Outcome`。
- **未决问题** `[Future Empirical Question]`：何种互动特征（频率/深度/互惠性）预测主观连接感——当前不可回答，仅可建模。

## C-05 Identity Continuity（身份连续性）

- **定义** `[Deductive: Doc 19 §9 TP-02]`：个人叙事的作者权与受众控制得以保全时，Life Story 可支持的那种自我一致感。
- **必要条件（命题 TP-02 的形式）**：作者权可控 ∧ 受众可控。充分性未主张（`Speculative Proposition`）。
- **可执行证据**（作者权三态的不可混淆）：AI Draft ≠ Supporter Contribution ≠ Participant Testimony 落为 `source_type`/`testimony_state` 分立字段+精确版本确认命令；接受贡献后 `testimony_state='NotTestimony'` 有 e2e 断言（`apps/api/test/api.e2e.test.ts` supporter 链）。

## C-06 Life Story（生命故事）

- **定义** `[Source-Derived: Appendix B §8]`：LifeStoryArchive——参与者控制的 M17 档案，含版本化 LifeStoryItem 与受治理贡献。默认 Private。
- **必要条件** `[Definition]`：参与者控制（作者权、受众、更正、撤回、导出各自分立——Master Prompt 核心不变量）；版本不可变。
- **排除**：Internet Public 在原型中双重禁用（命令 400 + DB CHECK）。
- **可执行证据**：m17 集成测试 11 项 + e2e（版本冲突 412、可见性、撤回）。

## C-07 Participant Control（参与者控制）

- **定义** `[Deductive: Doc 4 + Doc 19 §7-Q4]`：参与者对涉己资源在 Consent、Visibility、作者权、匹配、消息、AI 六个维度上持有的第一权威；跨维度一致性本身是 RQ-P4 的研究对象。
- **操作化清单** `[Prototype Observation]`：granular consent（22 选择模型的子集已实现）；owner-only 动作；确认对话框绑定精确版本/接收者；撤回即时生效（使用时评估）。
- **含混点**：控制与保护冲突时的优先序（如安全信号可由他人就参与者提交）→ 记 **RQ-S1**。

## C-08 Ability Adaptation（能力适配）

- **定义** `[Source-Derived: Doc 5 / Doc 20 §286]`：八种可组合模式（Standard/Simple/Step-by-Step/High Visibility/Read-Aloud/Supporter-Assisted/Low Stimulation/Extended Time）；任何选择不得标注为缺陷。
- **必要条件**：关键权利在每种模式可达（Doc 20 §336）。
- **可执行证据**：代码基线部分（rem/焦点/触控/aria-live——ACCESSIBILITY_TEST_PLAN §1）；模式系统本身 `Not Started`（研究缺口）。

## C-09 Governed Community（受治理社区）

- **定义** `[Source-Derived: Appendix B §8]`：由合格 CommunitySpace、现行规则版本、人工审核、参与者控制的可见性与非投入最大化设计构成的能力。
- **必要条件** `[Definition]`：规则版本存在 ∧ 人工审核可用 ∧ 加入需同意范围。
- **可执行证据**：CommunityRuleVersion 绑定加入命令；ModerationDecision 人工+确认+不可变（触发器+e2e）。

## C-10 Open Matching（开放匹配）

- **定义** `[Source-Derived: Appendix B §8]`：opt-in 过程，从批准的声明属性为批准目的生成候选。
- **必要条件** `[Definition]`：opt-in（open-matching 同意范围 + 确认）∧ 仅声明属性 ∧ MatchExplanation 可读。
- **排除**：MatchCandidate ≠ 互相兴趣 ≠ Connection（Doc 20 §143 要求 UI 原文陈述）；无隐藏分数。
- **可执行证据**：无同意开启匹配 → 404（受保护存在性）e2e；候选列表不含对方身份（e2e 断言原始 JSON）。

## C-11 Mutual Choice（相互选择）

- **定义** `[Deductive: Doc 19 §9 TP-04]`：连接形成的规范性条件——双方各自独立作出的选择；不可由系统活动（浏览、被动信号）推断。
- **形式** `[Definition]`：MatchDecision(A,c) = Interested ∧ MatchDecision(B,c′) = Interested，其中 c、c′ 为同一候选对的两侧记录，且两决定互不可见直至皆为 Interested。
- **可执行证据**：MatchDecision 每行动者唯一（DB 约束）；单方 Interested 不产生任何通知（组件测试断言措辞）；决定版本绑定（e2e 412）。

## C-12 MutualAcceptance（互相接受）

- **定义** `[Source-Derived: Appendix B §8 / Doc 8 v3.2]`：规范 M18 聚合，记录兼容的独立 MatchDecision（或一个被接受的已批准 ConnectionRequest）+ 行动者、目的、政策版本、有效期、有效性检查。
- **必要条件** `[Definition]`：canonical 来源记录存在 ∧ 在有效期内 ∧ 单次消费（Consumed ⟺ 恰一 connection_id）。
- **可执行证据**：CHECK (Consumed⟺connection_id) + 唯一部分索引；过期清扫不触碰 Consumed（sweep 测试）；服务器确认前 UI 不显示（组件测试）。

## C-13 Connection（连接）

- **定义** `[Source-Derived: Appendix B §8]`：由一条有效 MutualAcceptance 激活的相互授权社交连接。**不是** Supporter Relationship、照护权威或研究许可。
- **必要条件**：有效 MutualAcceptance ∧ 双方之一确认激活。
- **相关/排除**：Disconnect ≠ Block；Mute 可逆不终止连接。

## C-14 CommunicationBasis（通信依据）

- **定义** `[Source-Derived: Appendix B §8 / Doc 8 v3.2]`：允许创建 ConversationThread 或发送 Message 的被批准依据（活跃 Connection、授权 Relationship、批准的 InterventionSession、受治理的审核语境之一）。
- **必要条件** `[Definition]`：Thread 创建前存在且现行有效；发送时重评估。
- **可执行证据**：无依据创建 thread → 403 COMMUNICATION_BASIS_REQUIRED（e2e）；Block 后依据失效（m18 测试）。

## C-15 Human Interaction（人际互动）

- **定义** `[Deductive]`：双方皆为人类行动者且经由有效 CommunicationBasis 的消息/共同活动交换；区别于平台活动（登录、浏览）与 AI 互动（AIConversation 单独建模）。
- **区分的重要性** `[Source-Derived: Doc 19 §14]`：机制映射必须把活动、机制、结局分开；把 AI 陪伴计入人际互动量将污染 TP-03 的检验。→ **RQ-S2**。

## C-16 AI Assistance（AI 协助）

- **定义** `[Source-Derived: Doc 18 §核心不变量 / Doc 10]`：AI 可解释、检索、翻译、建议、起草（Draft）；不可自主改变 Consent、确立证言、代提 MatchDecision、创建 MutualAcceptance/Connection、未经精确确认发送、施加最终高影响审核、创建 SafetyEvent、锁定数据集、批准发现。
- **可执行证据**：PROHIBITED_AI_ACTIONS 17 项按名拒绝（m11 测试）；AI 来源信号发 AISafetySignalRaised 而永不能转事件（人工+MFA 门，e2e）。
- **含混点**：「确认后 AI 代执行」（Doc 18 §134 Controlled Optional）与「不可代提」的边界依赖「确认」的精确定义 → **RQ-S3**。

## C-17 Research Evidence（研究证据）

- **定义** `[Source-Derived: Doc 2 §6.21 / Doc 11 §评价框架]`：可能支持或挑战某断言的信息；当前概念阶段的证据类型限于 Doc 11 v1.2 L510 八类标签（definitional/deductive/source-supported/simulated/prototype-observed/inferred/speculative/reserved-for-empirical）。
- **排除** `[Definition]`：合成数据不是真实数据；模拟不是经验证据；原型行为不是用户接受度（Master Prompt「Never present」清单）。

## C-18 Research Finding（研究发现）

- **定义** `[Source-Derived: Appendix B §6]`：链接到精确 ResearchQuestion/Protocol/干预/数据集/分析/解释版本的经审查结论。概念阶段的理论发现另用 Doc 19 §38 八型（coherent…reserved for empirical testing）。
- **必要条件** `[Definition]`：AnalysisOutput ≠ Interpretation ≠ Finding 三分保全；人工批准。
- **可执行证据**：runAnalysis 仅接受 Locked 数据集版本；Finding 批准 MFA 档（m12-m13 测试 + e2e）。

---

## 未决问题汇总（导入 WP-03/WP-09）

1. Healthy Aging 正面充分条件缺失（C-01）。
2. 「valued activity」「meaningful」的操作化（C-03/C-04）。
3. 控制与保护冲突的优先序（C-07）。
4. 「确认后 AI 代执行」与 AI 禁止清单的边界语义（C-16）。
5. 身份映射一对一假设（RESEARCH_BASELINE §8.1）是否属概念承诺或实现便利（RQ-S3）。
