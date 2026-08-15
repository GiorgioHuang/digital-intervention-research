# SYNTHETIC_PILOT_PLAN

> The mapping between Doc 18 §210's mandatory scenarios and the automated tests. How to run it: `pnpm migrate && pnpm test` (CI runs the full suite on every push, with a deterministic seed + FixedClock + the provider/KP/model simulators).

## The end-to-end main line (packages/synthetic-pilot)

One complete governed research cycle: the evidence chain → protocol approval and activation → intervention version/configuration → consent → enrolment → a private Life Story → Testimony confirmation → selective sharing → community → matching → MutualAcceptance → Connection → Thread → confirmed send → provider delivery (accepted → delivered callbacks) → intervention exposure → assessment → dataset → a human DatasetLock → analysis → interpretation → a human-approved Finding → propagation of withdrawal.

## The Doc 18 §210 scenario coverage matrix

| # | Scenario | Where it is covered | Status |
|---|---|---|---|
| 2 | The matching path succeeds | synthetic-pilot + the matching suite | Verified |
| 3/4 | Match declined / no MutualAcceptance | The matching suite (one-sided Interested produces no MA) | Verified |
| 5 | MutualAcceptance expires | The matching suite (the clock advanced 8 days) | Verified |
| 7 | MutualAcceptance reused | The matching suite + a DB CHECK | Verified |
| 8 | ConnectionRequest disabled | The matching suite (FEATURE_DISABLED) | Verified |
| 9/10 | Block before matching / after connection | The matching + m18 suites (fail-closed in both directions) | Verified |
| 11 | Creating a Thread with no CommunicationBasis | The messaging suite | Verified |
| 12 | A Draft is not sent | The messaging suite + a DB CHECK | Verified |
| 13 | The confirmed version/recipient does not match | The messaging suite | Verified |
| 15 | Provider Accepted ≠ Delivered | messaging + synthetic-pilot | Verified |
| 16 | Duplicate / out-of-order callbacks | The messaging suite (replay is idempotent, a state regression is refused) | Verified |
| 19 | A supporter contribution is declined | The m17 suite | Verified |
| 20 | A Life Story is withdrawn | The m17 suite (authorisation revoked + history retained) | Verified |
| 21/22 | Community reports / moderation limits | The m18 suite (a human decision is immutable) | Verified |
| 23 | Detecting AI fabrication | m17 (AIDraft ≠ Testimony) + m11 | Verified |
| 24/25 | AI MutualAcceptance / unauthorised sending | The full m11 Level-5 list, refused by name | Verified |
| 26/27 | Closing a signal / a human transition | The m09–m11 suites | Verified |
| 29 | DatasetLock refused | The m12–m13 suites (automated, no-MFA and un-reviewed are all refused) | Verified |
| 30 | End-to-end propagation of withdrawal | synthetic-pilot (consent withdrawn → access refused + a study-exit event) | Verified |
| 1 | The existing-contact path (no M18 Connection) | Partial: the Relationship basis is verified in m03/m17; a Relationship-basis Thread is not implemented | Deferred |
| 6 | A change to Consent/Block invalidates an MA | The invalid state and the refusal path are verified; the automatic invalidation-propagation job is not implemented | Deferred |
| 14/17/18 | Provider failure / Unknown reconciliation / cancelling after a Block | The Failed/Unknown state transitions are verified; the reconciliation escalation job and queue cancellation are not implemented | Deferred |
| 28 | Dataset quality failure | The quality review gate is verified; the quality-issue record entity is not implemented | Deferred |

Additional scenarios from Doc 19: forged callbacks, disabled attributes (at the DB layer), reporter confidentiality (the event carries no reporter) and analysis re-runs (idempotent commands) are all covered; attachment quarantine scanning is not implemented (Deferred, left over from the P4 object-storage pipeline).
