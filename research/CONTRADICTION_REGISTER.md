# CONTRADICTION_REGISTER

> A continuing WP-09 artefact. The rule (Doc 19 v1.3 §40): a contradiction is a valuable research output; record the concepts it affects honestly and propose alternatives, and never paper over it with vague terminology or an arbitrary implementation choice. Each entry carries: the subject, the authority (in the spirit of Appendix E §14), the Trace/ADR references, the disposition, and the status.

## CON-001 The governance appendices README v2.9 cites are not in the repository `[Contradiction]`

- **The facts**: README v2.9 §3 requires Appendix A v1.3, C v1.2, D v2.9, E v1.9, F v1.7 and `Documents-0-20-Handbook-Consistency-Review-v1.0.md`; what was actually on disk was A v1.1, C v1.0, D v2.7, E v1.7, F v1.5, and the Review file did not exist. Only Appendix B v1.1 matched.
- **Concepts affected**: determining which version of a specification is canonical (the Master Prompt's "Locate canonical versions using README/Appendix D/E" is self-contradictory when D and E are themselves out of date).
- **Disposition**: treat README v2.9 plus each document's own header (the Supersedes chain) as the current basis for determining canonicity; do not invent the content of a missing appendix. **Alternative**: request that the missing appendices be uploaded, or that the maintainer republish them under README maintenance rule 2.
- **Status**: **Partially Resolved (2026-08-01)** — Appendix A v1.3 / C v1.2 / D v2.9 / E v1.9 / F v1.7 have been uploaded (the old versions deleted); `Documents-0-20-Handbook-Consistency-Review-v1.0.md` is still absent from the repository.

## CON-002 The mode transition has no recorded ADR (including the cited ADR-061…064) `[Contradiction]`

- **The facts**: Master Prompt v1.2 gives "Appendix C ADR-061 through ADR-064" as one basis for supersession; a grep across the whole repository found nothing. Appendix C v1.0 defines ADR-001…060 and ADR-101…125, leaving 061–100 an empty range. The transition to conceptual research mode (which revised Docs 1/11/18/19/20 in their entirety) had no ADR record at all, in breach of README maintenance rule 4.
- **Concepts affected**: the traceability of architectural decisions itself (Doc 19's method 10 depends on Appendix C).
- **Disposition**: the facts of the transition are taken from the body of the new documents (Doc 1 §3.1, Doc 18 §3.2, Doc 19 §2 — consistent and explicit); this register entry serves as a placeholder until Appendix C v1.2 is in place. **Alternative**: with the maintainer's agreement, draft proposed ADR text in IMPLEMENTATION_DECISIONS.md for later adoption.
- **Status**: **Resolved (2026-08-01)** — Appendix C v1.2 has been uploaded, and ADR-061 (conceptual research is the current mode, Accepted), ADR-062 (synthetic data / simulated actors / simulated providers, Accepted), ADR-063 (no external approval gate for the current conceptual work, Accepted) and ADR-064 (empirical human-subjects research is a separate future project, **Deferred**) are all recorded, with content consistent with the body of the new documents. ADR-063's consequences column states explicitly that "a future empirical transition must not inherit this exemption automatically" — consistent with how every readiness document in this repository frames it.

## CON-003 Appendix E v1.7 (the version on disk) directly conflicts with the conceptual baseline `[Contradiction]`

- **The facts**: Appendix E v1.7 as it stood on disk still required "Document 19's ethics approval, pilot provider selection and a signed readiness gate" as remaining dependencies, and pinned Docs 18/19/20 at v1.2; that cannot be true at the same time as the "not a precondition" statements in README v2.9 §13, Doc 1 v2.2 §3.1 and Doc 19 v1.3 §2.
- **Authoritative determination**: README v2.9 and Docs 18/19/20 v1.3 are newer, more explicit and mutually consistent; E v1.7 predates the mode transition (2026-07-29 versus 07-31). Treating the later as governing, the conceptual baseline is adopted.
- **Status**: **Resolved (2026-08-01)** — E v1.9 has been uploaded: it states explicitly that "Documents 1 v2.2 / 11 v1.2 / 18-20 v1.3 establish the current conceptual research mode" and that "this mode supersedes the earlier framing that treated ethics, governance, provider, production and pilot approvals as preconditions for starting work". The determination made at the time agrees with the new authority.

## CON-004 Doc 18 v1.3 retains production text from v1.2 `[Contradiction]`

- **The facts**: §144/§157/§170/§171/§178/§205/§232/§234 still speak of ethics approval, recruitment, staffing and readiness approval; §3.2 + §237 are the controlling interpretive clauses (all of it to be read as properties of the future system being modelled). Citing a residual passage in isolation yields an answer opposite to §18's "External approval is not an operating constraint".
- **Disposition**: every citation of Doc 18 in this repository passes through the §3.2 lens first; citing a residual passage requires citing that clause alongside it.
- **Status**: Recorded — this is editorial debt upstream, and this repository does not modify those documents.

## CON-005 The canonical filenames do not match the actual layout; superseded versions are not archived `[Contradiction]`

- **The facts**: the `Document-N-Title-vX.Y.md` filename form in README §9 does not exist anywhere in the repository (the actual layout is volume directories with numeric prefixes); v1.2 and v1.3 of Docs 18/19/20 coexist with v1.2 unmarked as archived. The volume title in README §10 ("Delivery, Pilot and UX") also disagrees with the one in §9 ("Conceptual Research & Prototype Exploration").
- **Disposition**: determine the canonical file from the version in each document's header and the Supersedes chain; keep v1.2 as a historical version.
- **Status**: Recorded — rechecked 2026-08-01: the appendices have been updated to the versions README requires, but the `Document-N-…` canonical filenames still do not match the actual layout (Appendix D v2.9 uses that filename style too), and the v1.2 files for Docs 18/19/20 remain unarchived. Editorial debt upstream; it does not affect version determination.

## CON-006 An internal tension within Doc 20 v1.3: §331 versus §359 `[Contradiction]`

- **The facts**: §331 states that "Prototype and production-like testing are both required" and §332–334 list a full battery of human task testing; §359 states that "No human-subject usability study is required for the current phase", and §364.7 makes human usability testing an optional future extension.
- **Disposition**: adopt §359/§364 (the chapter specific to the conceptual phase, consistent with Doc 19 §32); read §331 as a requirement of the future empirical phase. This is already reflected in the R1–R3 structure of ACCESSIBILITY_TEST_PLAN (R3 belonging to the future phase).
- **Status**: Recorded.
