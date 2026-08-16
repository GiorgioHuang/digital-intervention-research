# RESEARCH_TRACEABILITY_MATRIX

> The machine-readable layer is in `research-traceability.yaml` (checked in CI by `tools/check-research-traceability.mjs`: that it parses, that the code paths it cites exist, that the finding_status vocabulary is valid, and that nothing is marked supported out of thin air). This file is the reading guide.

- Mapping format (Master Prompt v1.2): ResearchQuestion + Proposition + Appendix A Trace ID + Appendix C ADR ID + module + concept/invariant + scenario + code/model + output + finding_status.
- finding_status vocabulary = the eight types in Doc 19 v1.3 §38 + `not_started` / `in_analysis`. **`supported` may only be used where there is an explicit source or experimental support for it** — at present no entry is supported.
- Complementary to the production track in `traceability.yaml` (52 pieces of implementation evidence): that one answers "does the code implement the Handbook's constraints", this one answers "how far has this research question got, and what epistemic grade is the evidence".
- Current entries: RQ-P1…P5 (the primary questions), WP-01 (the conceptual audit), CON-REGISTER (the contradiction register). RQ-S1…S5 and TP-01…06 get entries as WP-03 proceeds.
