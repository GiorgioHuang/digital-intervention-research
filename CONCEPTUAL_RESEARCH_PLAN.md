# CONCEPTUAL_RESEARCH_PLAN

> 依据 Doc 19 v1.3（CRP-HA-DIRP-001）与 Doc 18 v1.3。认识论词汇与发现类型均取 Doc 19 §10/§38。本计划立即生效，无外部批准门（Doc 19 §2/§47）。

## 1. 主研究问题（Doc 19 §7，内部编号为仓库便利）

- **RQ-P1** 框架是否内部融贯（internally coherent）？
- **RQ-P2** Healthy Aging 结局是否与平台活动分离？
- **RQ-P3** 干预机制是否在逻辑上把活动连接到未来结局？
- **RQ-P4** 参与者控制能否跨 Consent/Visibility/Life Story/匹配/消息/AI 一致表示？
- **RQ-P5** M01–M18 边界是否足以保全权威与研究血缘？

## 2. 次研究问题（Doc 19 §8）

- **RQ-S1** 哪些概念仍然含混或重叠？
- **RQ-S2** 哪些机制依赖未检验的经验假设？
- **RQ-S3** 哪些架构决定源自理论、哪些只是可选实现选择？
- **RQ-S4** 哪些合成失败情景暴露矛盾？
- **RQ-S5** 哪些未来观察最能降低不确定性？

## 3. 理论命题（初始集，详见 THEORETICAL_PROPOSITIONS.md，WP-03 产出）

取 Doc 19 §9 建议命题为起点（TP-01 参与者控制是机制而非合规属性；TP-02 Life Story 支持身份连续性当且仅当作者权与受众可控；TP-03 数字连接的价值在于支持有意义的人际互动而非互动量；TP-04 匹配要求独立选择、不可由系统活动推断；TP-05 AI 可在保全人类权威下降低互动负担，当其行动透明且有界；TP-06 研究可再现性要求数据/分析/解释/发现分立记录）。均为 `Speculative Proposition` 直至 WP-03 逐条形式化。

## 4. 方法（Doc 19 §12–21 的十法全部启用）

概念分析；证据与来源综合；因果与机制映射；本体与域建模；形式状态分析；合成人物画像；合成数据生成；模拟；原型实验；比较架构分析（以 Appendix C ADR 记录取舍）。每问题按 §37 九步分析计划执行。

## 5. 工作包（Master Prompt WP-01…WP-10）

| WP | 产出 | 状态 |
|---|---|---|
| WP-01 概念与术语审计 | CONCEPT_CATALOGUE.md | **In Analysis（本次启动）** |
| WP-02 机制与因果模型 | MECHANISM_MODEL.md + 机器可读图 + 因果图 | Not Started |
| WP-03 理论命题 | THEORETICAL_PROPOSITIONS.md | Not Started |
| WP-04 形式化域模型 | FORMAL_DOMAIN_MODEL.md + 机器可读模型 + 可执行不变量测试 | 部分先行（不变量测试已存在，文档化未做） |
| WP-05 合成人物画像框架 | SYNTHETIC_PERSONAS.md + 机器可读固定装置 | Not Started |
| WP-06 合成数据生成器 | SYNTHETIC_DATA_SPEC.md + 生成器代码 | 部分先行（synthetic-pilot 有确定性种子，缺独立生成器与出处标签） |
| WP-07 情景与模拟框架 | SCENARIO_CATALOGUE.md + 情景运行器 | 部分先行（场景散在测试中，缺目录与运行器） |
| WP-08 可执行参考原型 | 现有代码库（重新定性为研究工件） | **Implemented in Prototype**（见 RESEARCH_BASELINE §3） |
| WP-09 反例与矛盾分析 | CONTRADICTION_REGISTER.md | **In Analysis（首批 5 条已登记）** |
| WP-10 理论发现 | THEORETICAL_FINDINGS.md | Not Started |

顺序：WP-01 → WP-03 → WP-02 → WP-05/06 → WP-07 → WP-09 持续 → WP-10 汇总。WP-04 与 WP-01 并行推进（概念条目直接锚定既有可执行不变量）。

## 6. 情景族（Doc 19 §23 十三族 × Doc 18 §210 强制清单）

十三族：自主与同意；Life Story 作者权；可见性与受众；社区参与；匹配与相互选择；连接与 CommunicationBasis；消息生命周期；Block/Report/审核；SafetySignal 与 SafetyEvent；AI 协助与禁止行动；数据集与分析血缘；依赖降级行为；撤回/删除传播。每族在 SCENARIO_CATALOGUE 中至少含：正常路径、边界、失败、对抗、反例各一。

## 7. 预期产出（Doc 19 §44）

概念框架修订、定义与分类学、理论命题、因果/机制图、形式状态模型、架构决定（ADR）、合成数据集、模拟报告、参考原型、反例目录、理论发现。

## 8. 完成标准（Doc 19 §45 + Master Prompt「Definition of Done」16 条）

关键概念显式且融贯；主要矛盾解决或记录；关键不变量可执行；合成情景可再现（记录种子与配置）；主要假设已分类；未来经验问题与当前发现清晰分离；全程无人类/私人数据、无经验效应或生产就绪声明；Trace/ADR ID 贯通研究—代码—情景—发现。

## 9. 不确定性处理

- 每个陈述带 Doc 19 §10 十类认识论标签之一。
- 发现只允许 Doc 19 §38 八种类型；`supported` 类判定必须有来源或实验支撑（Master Prompt Traceability 规则）。
- 矛盾是有价值的产出（Doc 19 §40）：登记、提出备选、绝不用含糊措辞或任意实现掩盖。
- 无法用现有来源支撑的断言一律降级为 `Design Assumption` 或 `Future Empirical Question`。
