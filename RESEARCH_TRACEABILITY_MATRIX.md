# RESEARCH_TRACEABILITY_MATRIX

> 机器可读层在 `research-traceability.yaml`（由 `tools/check-research-traceability.mjs` 在 CI 校验：可解析、引用的代码路径存在、finding_status 词汇合法、无凭空 supported）。本文件为阅读指引。

- 映射格式（Master Prompt v1.2）：ResearchQuestion + Proposition + Appendix A Trace ID + Appendix C ADR ID + 模块 + 概念/不变量 + 情景 + 代码/模型 + 产出 + finding_status。
- finding_status 词汇 = Doc 19 v1.3 §38 八型 + `not_started` / `in_analysis`。**`supported` 只允许在有明示来源或实验支撑时使用**——当前没有任何条目为 supported。
- 与生产轨道 `traceability.yaml`（52 条实现证据）互补：那边回答「代码是否实现了 Handbook 约束」，这边回答「研究问题走到了哪一步、证据是什么认识论等级」。
- 当前条目：RQ-P1…P5（主问题）、WP-01（概念审计）、CON-REGISTER（矛盾登记）。RQ-S1…S5 与 TP-01…06 随 WP-03 建条。
