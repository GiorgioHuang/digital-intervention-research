# CONTRADICTION_REGISTER

> WP-09 持续工件。规则（Doc 19 v1.3 §40）：矛盾是有价值的研究产出；如实记录受影响概念并提出备选，绝不通过含糊术语或任意实现选择掩盖。每条含：主题、权威（Appendix E §14 精神）、Trace/ADR、处置、状态。

## CON-001 README v2.9 引用的治理附录不在仓库 `[Contradiction]`

- **事实**：README v2.9 §3 要求 Appendix A v1.3、C v1.2、D v2.9、E v1.9、F v1.7 与 `Documents-0-20-Handbook-Consistency-Review-v1.0.md`；盘上实际为 A v1.1、C v1.0、D v2.7、E v1.7、F v1.5，Review 文件不存在。仅 Appendix B v1.1 一致。
- **影响概念**：规范版本判定（Master Prompt「Locate canonical versions using README/Appendix D/E」在 D、E 过期时自引用矛盾）。
- **处置**：以 README v2.9 + 文档自身 header（Supersedes 链）为现行判定依据；不臆造缺失附录内容。**备选**：请求上传缺失附录，或由维护者按 README 维护规则 2 重发布。
- **状态**：Open — 等待缺失附录上传。

## CON-002 模式转换缺少落盘 ADR（含被引用的 ADR-061…064） `[Contradiction]`

- **事实**：Master Prompt v1.2 以「Appendix C ADR-061 through ADR-064」为取代依据之一；全仓库 grep 零命中。Appendix C v1.0 定义 ADR-001…060 与 ADR-101…125，061–100 为空号段。概念研究模式转换（Docs 1/11/18/19/20 全部改版）没有任何 ADR 记录，违反 README 维护规则 4。
- **影响概念**：架构决定可追溯性本身（Doc 19 方法 10 依赖 Appendix C）。
- **处置**：转换事实依据取自新版文档正文（Doc 1 §3.1、Doc 18 §3.2、Doc 19 §2——一致且明示）；本登记条目充当占位，直至 Appendix C v1.2 到位。**备选**：若获维护者确认，可在 IMPLEMENTATION_DECISIONS.md 起草 Proposed ADR 文本供收编。
- **状态**：Open。

## CON-003 Appendix E v1.7（盘上版）与概念基线直接冲突 `[Contradiction]`

- **事实**：盘上 Appendix E v1.7 §15/§16 仍要求「Document 19 的伦理批准、Pilot 供应商选定、签署就绪门」为剩余依赖，并把 Doc 18/19/20 钉在 v1.2；这与 README v2.9 §13、Doc 1 v2.2 §3.1、Doc 19 v1.3 §2 的「非前提」声明不可同真。
- **权威裁定**：README v2.9 与 Docs 18/19/20 v1.3 更新、更明示且互相一致；E v1.7 早于模式转换（2026-07-29 vs 07-31）。按后法优于前法处理，采概念基线。
- **状态**：Open — 待 E v1.9 上传后复核。

## CON-004 Doc 18 v1.3 残留 v1.2 生产文本 `[Contradiction]`

- **事实**：§144/§157/§170/§171/§178/§205/§232/§234 仍述及伦理批准、招募、人员配备与就绪批准；§3.2+§237 为控制性解释条款（一律读作被建模未来系统的属性）。孤立引用残留段会得出与 §18「External approval is not an operating constraint」相反的答案。
- **处置**：本仓库一切引用 Doc 18 时优先经 §3.2 透镜；引用残留段必须同时注明该条款。
- **状态**：Recorded — 属上游文档编辑债，不由本仓库修改文档。

## CON-005 规范文件名与实际布局不符；被取代版本未归档 `[Contradiction]`

- **事实**：README §9 的 `Document-N-Title-vX.Y.md` 形式文件名在仓库中零存在（实际为卷目录+数字前缀）；Doc 18/19/20 的 v1.2 与 v1.3 并存且 v1.2 未标注归档。README §10 卷标题（"Delivery, Pilot and UX"）与 §9 卷标题（"Conceptual Research & Prototype Exploration"）亦不一致。
- **处置**：按内容 header 的版本与 Supersedes 链判定规范文件；v1.2 视作历史版本保留。
- **状态**：Recorded。

## CON-006 Doc 20 v1.3 内部张力：§331 vs §359 `[Contradiction]`

- **事实**：§331 称「Prototype and production-like testing are both required」且 §332–334 列出完整人类任务测试组；§359 称「No human-subject usability study is required for the current phase」，§364.7 把人类可用性测试定为未来可选扩展。
- **处置**：采 §359/§364（概念阶段专章、与 Doc 19 §32 一致）；§331 读作未来经验阶段要求。已在 ACCESSIBILITY_TEST_PLAN 的 R1–R3 结构中体现（R3 属未来阶段）。
- **状态**：Recorded。
