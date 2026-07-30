# TRACEABILITY_IMPLEMENTATION_MATRIX

> 机器可读矩阵在 `traceability.yaml`；本文件为阅读指引。规则（Master Prompt「Traceability Requirements」）：每个实质实现单元链接 ≥1 个 Appendix A Trace ID、≥1 个 Appendix C ADR ID、属主模块、源文档章节；**只有代码+测试证据都存在才可标 `implemented`，验证通过标 `verified`**。状态词汇：`not_started / scaffolded / implemented / verified / blocked / deferred / pending_external_approval`。

- 条目 ID 约定：`IMP-<模块|KERNEL|OPS>-<主题>-NNN`。
- CI 中由 `tools/check-traceability.mjs` 校验：yaml 可解析、引用的代码路径存在、状态词汇合法。
- 每个阶段（P0–P10）收尾时更新对应条目状态并在提交信息中引用条目 ID。
