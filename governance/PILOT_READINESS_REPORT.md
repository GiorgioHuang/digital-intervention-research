# PILOT_READINESS_REPORT

> Status as of 2026-07-30. **Conclusion: synthetic-pilot validation passed; readiness for a formal pilot = Pending External Approval. This system has no ethics approval and must not be used to recruit real participants (ATR-025).**

## What is in place (code + test evidence; see the 29 entries in traceability.yaml)

- All sixteen module domains M01–M13 and M16–M18 are Implemented; M14 reporting / controlled export / portability export is Implemented (external submission explicitly deferred); M15 approval / governance retention / break-glass is Implemented.
- Around 200 deterministic tests (CI runs the full suite on every push, against a fresh database plus a migration drill up→down→up).
- Every critical invariant has code and test evidence: the seven elements of Effective Permission, granular consent and the propagation of withdrawal, immutability of protocols / interventions / evidence snapshots / dataset locks, AI Draft ≠ Testimony, Block failing closed, independent MatchDecision, single consumption of MutualAcceptance, CommunicationBasis, the two message state machines and exact SendConfirmation, callback authentication and replay protection, human authority over SafetySignal, the complete list of Level-5 AI prohibitions, Output ≠ Interpretation ≠ Finding, and separation of duties (self-approval forbidden at two layers).
- The synthetic pilot's end-to-end main line plus the scenario matrix (see SYNTHETIC_PILOT_PLAN.md).
- Real Knowledge Platform integration: the Healthy Aging Knowledge Graph MCP client (ADR-052/110) is exposed through the full REST chain (evidence.search → review → citation provenance → two-person approval → snapshot), with CI making a real smoke call against the deployed Cloud Run + Neon instance on every push; the simulator remains the default (KNOWLEDGE_PLATFORM_MODE switches explicitly). The audit and capability matrix are in KNOWLEDGE_GRAPH_INTEGRATION.md.

## Not ready / explicit gaps (nothing is faked as complete)

1. **Pending External Approval**: ethics (ADR-048/ATR-025); provider contracts (AI / communication / IdP / hosting / malware scanner — **object storage is settled as Cloudflare R2 but is not yet connected**); policy values (retention periods / residency / backup RPO-RTO / attachments / delivery mapping / MA validity); the matching attribute registry and the feed ordering policy; and the analysis environment.
2. **Deferred (at the code layer)**: REST endpoints for the remaining module commands (already exposed: the full participant-side chain + the staff-side M04 protocol chain / M05 enrolment chain / M06 intervention portfolio / M09 safety triage / M12 dataset lineage / M13 analysis chain + M17 Life Story + M03 relationship management + M14 reporting and controlled export + M15 approval, governance retention and break-glass + M18 owner queries + M18 community (spaces / joining versioned rules / chronological feed / draft-then-publish, with the participant community screen implemented)); and WCAG AA testing with real users (the participant workspace's core flows are implemented: a task-based home screen, granular consent, message send confirmation — but automated tests are not a substitute for accessibility acceptance by real users). SECURITY_AND_PRIVACY_PLAN / THREAT_MODEL / ACCESSIBILITY_TEST_PLAN have been drafted (see each file; within them, real-user accessibility acceptance R1–R3 and the closure of residual risks remain unmet).
3. Synthetic scenarios 1/6/14/17/18/28 are partially covered (see the Deferred rows of the plan matrix).

## The readiness gate (Doc 18 §193): the judgement

Code and test items: met. Staffing, ethics, providers, accessibility testing with real users, and formal sign-off: **none of them met — recruitment of real participants must not begin.**
