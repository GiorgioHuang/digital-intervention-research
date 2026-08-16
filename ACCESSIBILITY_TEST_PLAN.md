# ACCESSIBILITY_TEST_PLAN

> Status as at 2026-07-31. The goal: an acceptance plan for WCAG 2.2 AA + the Handbook's seven modes of use. **The central honesty statement: automated checks and code review are not a substitute for testing with real users. "Implemented" in this plan means only that a code-level baseline is in place; "acceptance" requires real users (including older participants), and that acceptance is an unmet readiness-gate item.**

## 1. The code-level baseline that is implemented (with evidence)

| Baseline | Implementation | Location |
|---|---|---|
| Reflow at 200% zoom | rem dimensions, max-width layout, no dependence on horizontal scrolling | `apps/web/src/styles.css` |
| Visible focus | a high-contrast `:focus-visible` outline | styles.css |
| Touch targets ≥44px | buttons/inputs at min-height 2.75rem | styles.css |
| Skip link | a skip-link to the main content | App.tsx / StaffApp.tsx |
| Motion respected | `prefers-reduced-motion` disables animation globally | styles.css |
| State announcements | `aria-live="polite"` + `role="status"` on every panel | the components |
| Confirmation dialog semantics | `role="alertdialog"` + `aria-labelledby` | the components |
| Language declaration | ❌ **NOT MET — `<html lang="zh-CN">`** while every interface string is English | index.html |
| Nothing pre-selected, choices of equal weight | no pre-selected checkbox in the consent panel; agree/decline buttons of equal weight | ConsentPanel + component tests |
| Task-based home page (not a feed) | a short list of actions | App.tsx |
| Honest status wording | delivery, contribution and suspension states all in plain words, none overstated | DELIVERY_STATE_LABELS and others + tests |

> **The language-declaration row was corrected on 2026-08-16 and moved from met to not met.** It previously recorded `<html lang="zh-CN">` as a satisfied baseline, which was true while the interface was Chinese. Every string has been English since D-9, and `apps/web/index.html` still declares `lang="zh-CN"`, so a screen reader applies Chinese pronunciation rules to English text. This is a **WCAG 3.1.1 (Level A)** failure, tracked as C-10 in MODERATION_SAFETY_SUPPORTER §8. It is listed here as unmet rather than quietly dropped, because this table is the evidence anyone would cite for the claim that the baseline is in place.

## 2. The seven modes of use × how each is accepted

| Mode | What automation can cover | What must be verified with real users |
|---|---|---|
| 1 Vision impairment (screen reader) | linting the ARIA structure | a full NVDA/VoiceOver walkthrough: consent → messages → withdrawal |
| 2 Low vision (magnification/contrast) | reflow checks at zoom | operating a real device at 200%–400% |
| 3 Hearing impairment | reviewing that nothing depends on audio | caption acceptance once media content exists |
| 4 Motor/dexterity limitations | touch target sizes | keyboard-only and switch-device journeys end to end |
| 5 Sensitivity to cognitive load | reviewing one concept per screen | think-aloud testing with older participants (critically: the withdraw-consent and send-confirmation flows) |
| 6 Low digital literacy | plain-language review | paired testing with and without a helper present |
| 7 Intermittent use / fatigue | checking that state is recoverable | interruption-and-resume scenarios |

## 3. The planned test rounds (to be completed before any real recruitment)

- **R0 the automated gate (every push, already in CI)**: component tests asserting the confirmation flows, nothing pre-selected, and honest wording (the accessibility-related assertions among the 27). **Still to add: wiring axe-core scanning into CI.**
- **R1 expert walkthrough**: an accessibility expert reviews every workspace (participant/supporter/staff) against the full WCAG 2.2 AA checklist, produces a defect list, and re-checks after fixes.
- **R2 assistive-technology lab testing**: screen readers (NVDA, VoiceOver), keyboard only, switch devices and magnifiers each complete the participant's core journeys: sign in → consent (including withdrawal) → messages (including the send confirmation) → report/block → a match decision.
- **R3 real user testing (a readiness-gate item)**: ≥8 older participants (including assistive-technology users), under an ethics-approved informed consent process; the success criteria are in §4; every barrier found enters defect tracking and is retested.
- **R4 continuing acceptance**: repeat R1–R2 for each new workspace or flow; repeat R3 annually.

## 4. Success criteria (R3)

1. Each participant can, independently or by whatever means they usually use, complete: granting a consent, withdrawing a consent, sending a message and understanding its delivery state, and submitting a report.
2. **Understanding of consequences** is met for both the withdraw-consent and send-confirmation dialogs: a participant can restate in their own words what will happen ("data already locked will not be rewritten", "they have not received it yet").
3. No blocking WCAG 2.2 AA defect remains open.
4. Participants' subjective load is acceptable (a short scale + interview).

## 5. Responsibility and status

- R0 is running (wiring in axe-core is the next code increment); R1–R2 need accessibility expert resource (staffing — an unmet readiness-gate item); R3 needs ethics approval (ATR-025 Pending) — **and until that approval, no real participant may be approached in any form**.
- Until this plan has completed R1–R3 and closed the blocking defects, "accessibility testing with real users" in PILOT_READINESS_REPORT remains **unmet**.
