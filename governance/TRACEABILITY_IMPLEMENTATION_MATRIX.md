# TRACEABILITY_IMPLEMENTATION_MATRIX

> The machine-readable matrix is in `traceability.yaml`; this file is the reading guide. The rule (Master Prompt, "Traceability Requirements"): every substantive unit of implementation links to ≥1 Appendix A Trace ID, ≥1 Appendix C ADR ID, an owning module, and the source document section; **`implemented` may only be marked where both the code and the test evidence exist, and `verified` once verification has passed**. Status vocabulary: `not_started / scaffolded / implemented / verified / blocked / deferred / pending_external_approval`.

- Entry ID convention: `IMP-<module|KERNEL|OPS>-<topic>-NNN`.
- Checked in CI by `tools/check-traceability.mjs`: that the yaml parses, that the code paths it cites exist, and that the status vocabulary is valid.
- At the end of each phase (P0–P10), update the status of the corresponding entries and cite the entry IDs in the commit message.
