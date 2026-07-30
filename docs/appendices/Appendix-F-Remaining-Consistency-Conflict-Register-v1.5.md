# Appendix F — Remaining Consistency Conflict Register

**Version:** 1.5  
**Status:** Closed Consistency Register — No Open Conflicts  
**Handbook Position:** Appendix F  
**Document Owner:** Architecture and Product Governance  
**Last Updated:** 2026-07-29  
**Supersedes:** Appendix F — Remaining Consistency Conflict Register v1.4  
**Review Trigger:** Resolution, reclassification, ownership change, new cross-document conflict or canonical-version change

---

## 1. Purpose

This register records unresolved Documents 0–20 inconsistencies after the full Handbook review.

It excludes differences that are intentionally layered, such as:

- product architecture versus runtime implementation;
- domain events versus UX analytics events;
- framework-level research rules versus Pilot-specific Protocol choices;
- and Participant-facing plain language versus canonical aggregate names.

---

## 2. Severity

| Severity | Meaning |
|---|---|
| Blocking | Prevents a reliable canonical interpretation or implementation contract. |
| High | Can create incompatible domain, data, API or Pilot behaviour. |
| Medium | Creates ambiguity, stale authority or traceability debt. |
| Low | Editorial or tooling inconsistency with limited semantic impact. |

---

## 3. Open Conflicts

| ID | Severity | Documents | Conflict | Required Resolution | Primary Owner | Downstream Impact |
|---|---|---|---|---|---|---|
| — | — | — | No open cross-document consistency conflicts. | — | — | — |

---

## 4. Resolved by This Review

| ID | Resolution |
|---|---|
| HR-001 | README now points to all current Documents 0–20 versions. |
| HR-002 | Batch-based “pending” review state has been replaced by a full-review status model. |
| HR-003 | Appendix D has been replaced by a current version and status matrix. |
| HR-004 | Cross-document authority and dependency boundaries are now explicit. |
| HR-005 | Canonical glossary now distinguishes aggregates, UI labels, domain events and analytics events. |
| HR-006 | Document 19 remains explicitly Draft rather than being presented as approved Protocol authority. |
| HR-007 | Internet Public is explicitly separated from Platform Public across Handbook governance artefacts. |
| HR-008 | ModerationCase, SafetySignal, SafetyEvent and AIIncident are explicitly separated. |
| HR-009 | HC-001 resolved by Document 3 v2.3: governed Community, Platform Public and Open Matching are in scope; uncontrolled social-network forms remain excluded. |
| HR-010 | HC-002 resolved by Document 8 v3.2: ConversationThread and Message are canonical M18 aggregate roots with repositories, policies, commands, events and MVP inclusion. |
| HR-011 | HC-003 resolved by Document 8 v3.2: MutualAcceptance is a canonical M18 aggregate root with source records, policy version, validity, expiry, invalidation and single-use Connection activation. |
| HR-012 | HC-004 resolved by Document 8 v3.2: ConnectionRequest is a Deferred Alternative Connection Basis and acceptance creates MutualAcceptance. |
| HR-013 | HC-008 resolved by Document 8 v3.2 §133: Domain Event, Integration Event and UX Analytics Event mappings are explicit. |
| HR-014 | Document 15 v1.2 revalidated API resources, commands, errors, Domain Events, Integration Events, UX mappings, communication-provider callbacks and AI Tools against Document 8 v3.2. |
| HR-015 | Documents 12 v1.2, 13 v1.2 and 16 v1.2 revalidated M18 data lineage, runtime ownership, provider boundaries, persistence constraints and Message privacy against Documents 8 v3.2 and 15 v1.2. |
| HR-016 | Documents 18 v1.2, 19 v1.2 and 20 v1.2 revalidated delivery gates, Pilot measures, Consent, UX states, event mappings and release criteria against the revised M18 data, runtime, API and storage baselines. |
| HR-017 | HC-005 resolved in place in Document 6 v3.1: Document 3 and Document 8 references now point to v2.3 and v3.2, and all eighteen modules are recorded as aligned. |
| HR-018 | HC-006 resolved in place in Document 7 v3.0: the obsolete Documents 18/20 v1.0 authority warning was replaced with current alignment and revalidation language. |
| HR-019 | HC-007 resolved in place in Document 2 v2.1: Knowledge Gap lifecycle now uses canonical `In Review`. |
| HR-020 | HC-009 resolved in place: ambiguous Public or Community social-network wording was normalised to `Governed Community`, `Platform Public`, `Internet Public` and `Open Matching`; legitimate research uses of social-network concepts were retained. |
| HR-021 | HC-010 resolved in place: repeated H3 template headings in Documents 3, 4, 6, 8 and 9 now include stable parent or module prefixes, producing globally unique Markdown anchors. |

---

## 5. Resolution Order

No unresolved consistency conflicts remain.

The Documents 0–20 review, M18 revalidation and final terminology and anchor maintenance cycle are complete.

## 6. Release Consequence

The current Handbook is suitable for:

- architecture planning;
- backlog refinement;
- prototype design;
- security and AI evaluation;
- and synthetic Pilot preparation.

There are no remaining Blocking or High Handbook conflicts.

Before real Participant recruitment begins, Document 19 must receive governance and ethics approval and the operational readiness gates must be signed off. The absence of consistency conflicts does not constitute Pilot approval.
