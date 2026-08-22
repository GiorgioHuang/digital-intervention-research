# Participant workspace — interface design specification

> Scope: the 19 items of UI_INVENTORY.md section B (B1–B7 implemented, B8–B19 not).
> Specification sources: Doc 20 v1.3 §16, §36, §95–178, §205–220; constraint sources: DESIGN_BRIEF.md, ADR-050, ADR-020, ACCESSIBILITY_TEST_PLAN.md.
> Phase statement (ADR-061/062): entirely synthetic data, simulated providers for AI, communications and malware scanning, and **two identity modes** — real Sign in with Google (ADR-104) in the deployed environment, and the dev-header stub in local development and the test suite. The consent and approval screens described here are a UX model **of the future system being modelled**, and the interface must not imply that ethics approval has been obtained or that real participants are being recruited.
>
> This file does not define concrete values for colour, type size or spacing — those belong to the design system foundation (A1–A9). It cites token names, never colour values.
>
> **On the wording in this file (D-9).** Every string quoted in a wireframe or a confirmation below is the **intent** of that copy. The English strings in the implementation are the current source of truth for the exact phrasing, and the front-end tests query by accessible name — so changing the words in the product means changing the tests, and this document follows rather than governs. What does not vary is the honesty constraint behind each string: a delivery state may not be overstated, protected existence must be indistinguishable from absence, a draft must say only you can see it, and a contribution is not testimony.

---

## Contents

- [0. Shared rules](#0-shared-rules) (read before any of B1–B19)
- [B1 Home (the task list)](#b1-home-the-task-list)
- [B2 My consent choices](#b2-my-consent-choices)
- [B3 Messages: the conversation list](#b3-messages-the-conversation-list)
- [B4 Messages: a conversation and the send confirmation](#b4-messages-a-conversation-and-the-send-confirmation)
- [B5 Meeting new people (matching)](#b5-meeting-new-people-matching)
- [B6 Community](#b6-community)
- [B7 Help and safety](#b7-help-and-safety)
- [B8 My research](#b8-my-research)
- [B9 Life Story: the archive home](#b9-life-story-the-archive-home)
- [B10 Life Story: create / AI draft / confirm as testimony](#b10-life-story-create--ai-draft--confirm-as-testimony)
- [B11 Life Story: visibility and audience](#b11-life-story-visibility-and-audience)
- [B12 Life Story: withdrawal and export](#b12-life-story-withdrawal-and-export)
- [B13 Accessibility and preferences](#b13-accessibility-and-preferences)
- [B14 Public profile editing and preview](#b14-public-profile-editing-and-preview)
- [B15 Assessments (baseline / follow-up)](#b15-assessments-baseline--follow-up)
- [B16 Activities and interactions: prepare / complete / reflect](#b16-activities-and-interactions-prepare--complete--reflect)
- [B17 Reporting and blocking centre](#b17-reporting-and-blocking-centre)
- [B18 Pausing and leaving](#b18-pausing-and-leaving)
- [B19 AI companion](#b19-ai-companion)
- [Appendix A: B1–B7, the gap between what is implemented and the target design](#appendix-a-b1b7-the-gap-between-what-is-implemented-and-the-target-design)
- [Appendix B: substantive deviations between the implementation and Doc 20](#appendix-b-substantive-deviations-between-the-implementation-and-doc-20)
- [Appendix C: open items needing a product decision](#appendix-c-open-items-needing-a-product-decision)

---

## 0. Shared rules

The rules below apply to every screen B1–B19. Each screen records only its **deviations or additions**, never a repetition.

### 0.1 The screen skeleton (mobile first, single column)

```text
┌──────────────────────────────────────┐
│ [Skip to main content] ← first focusable │
├──────────────────────────────────────┤
│ <header> context banner (only when     │
│          there is something to say)    │
│  · environment notice (synthetic       │
│    research prototype)                 │
│  · access token missing (role=alert)   │
│  · global degradation / offline        │
├──────────────────────────────────────┤
│ <main id="main-content">              │
│  h1  the screen's title                │
│  p   one sentence on what this screen  │
│      is for                            │
│  ── block 1 (the most important        │
│      decision or task)                 │
│  ── block 2                            │
│  ── …                                  │
│  <p role="status" aria-live=polite>    │ ← exactly one per screen
│ </main>                               │
├──────────────────────────────────────┤
│ <nav aria-label="Main">               │ ← bottom on mobile, left on desktop
│  Home / My research / My life story /  │
│  Messages / Community / Meeting new    │
│  people / My consent choices /         │
│  Settings / Help and safety            │
└──────────────────────────────────────┘
```

- **One `h1` per screen**, matching its navigation item's name or a natural expansion of it. In the current implementation ConsentPanel / MatchingPanel / CommunityPanel / SafetyPanel use an `h2` as the screen's main heading — the target design standardises on `h1` (the accessible name does not change, only the role level; see Appendix A).
- The number of navigation items is fixed and does not grow or shrink with content; no numeric badge is ever shown.
- Desktop (≥64rem): navigation is a fixed 16rem left column and `main` is centred at a maximum of 48rem, with no second content column introduced. Tablet (≥40rem): navigation is a row at the top. Mobile (<40rem): navigation is at the bottom, each item ≥44px with ≥8px between neighbours (they must not overlap — ACCESSIBILITY_TEST_PLAN records a real defect here).

> **The nine destinations in this section are incompatible with "a single row at the bottom on mobile" at 320px — that is a conflict inside the specification, not the implementation cutting corners.**
> The arithmetic: 9 × 44px + 8 × 8px = 460px > 320px, which does not fit at any type size; measured, English labels need 53–77px at `--type-size-0`, so five items already exceed the usable width at 390px (see DESIGN_DECISIONS D-10).
> The current implementation takes **four** per D-10 (Home / Consent / Messages / Help), with the remaining destinations reached from the home page's task list; the bottom bar wraps to multiple lines at 200%/400% zoom rather than scrolling horizontally.
> Returning to nine requires first deciding the tiering (four at the bottom plus a "More" secondary panel, say, or nine in the desktop left column and four on mobile), and that decision has not been made — so A1.4, "expand the navigation to nine", is **blocked** on mobile.

### 0.2 The absolute prohibitions (Doc 20 §354; a violation is a design error)

| Prohibited | Where it applies |
|---|---|
| Unread counts, message counts, red dots | all navigation and all lists |
| Likes, reaction counts, view counts, "trending" / "recommended for you" | B6 community, B9 Life Story, B14 public profile |
| Algorithmic ordering | B6's feed is strictly reverse chronological; B5's candidates ascend by expiry time and **never by score** |
| Streaks, progress-bar pressure, "you haven't … for 3 days" | all reminders and B8/B15/B16 |
| A hidden compatibility score | B5 |
| Presenting an AI draft as testimony | B10, B19 |
| A toast as the only confirmation of a high-impact action | sending, publishing, blocking, withdrawing consent, confirming testimony, leaving |
| Colour as the only state indicator | all status badges |
| Age as a label ("the elderly", "senior mode") | all copy and B13's mode names |

### 0.3 Button hierarchy and label rules (Doc 20 §323–324)

- At most one Primary per decision area. **"One meaningful decision at a time"**: two high-impact Primaries may never sit side by side on one screen.
- A label is a verb plus a specific object. A confirmation button must name the object: `Confirm publishing to "Gardening Corner"`, never `OK` / `Yes` / `Continue`.
- A cancel button says what will **not** happen: `Back, don't send` / `Back, don't withdraw` / `Back, don't block`.
- **The neutrality test** (no dark patterns): `Interested` / `Not now` / `Don't show me this person again` must be identical in size, weight, colour token and order (visually equal in weight), and none of them may be a Primary.
- Destructive actions (block, withdraw, leave, delete) use `--color-action-destructive`, **and also** carry an icon and the words "this cannot be undone automatically" — colour is never the only indicator.

### 0.4 The family of confirmation patterns (Doc 20 §241–246)

| Level | Used for | Presentation |
|---|---|---|
| Simple confirmation | low-risk and reversible (save a draft, mute) | an inline notice + an undo link, no dialog |
| Detailed confirmation | sending a message, publishing a post, confirming testimony, changing visibility, turning matching on, joining a community, blocking | `role="alertdialog"`, containing **the exact version or verbatim content of what is being confirmed** |
| Reinforced confirmation (step-up) | Platform Public visibility, exporting an entire life story, leaving all research | a detailed confirmation + a second input (retyping the name of the action); simulated by the dev-header stub in this phase |
| Two-person approval | **not used** in the participant workspace | — |
| Human review | B19's high-impact actions proposed by AI | show a "waiting for human review" state; never pass silently |

**Dialog requirements (all levels)**: `role="alertdialog"` + `aria-labelledby` (the title) + `aria-describedby` (the consequences paragraph); focus moves to the dialog's title on open; `Esc` is equivalent to the cancel button; focus returns to the triggering button on close; focus may not escape the dialog.

### 0.5 The five states every screen must answer

Every screen must define its presentation for the five situations below. A missing one means the design is not finished.

| State | General rule |
|---|---|
| **Loading** | say what is being done (`Loading your conversations…`), preserve the layout height, and never show a fake progress bar; a high-impact action must not display as complete before the server confirms it (Doc 20 §224). Skeleton screens are only for low-risk lists and **never** for delivery states, approvals, match results or safety decisions (§225). |
| **Empty** | explain (1) why it is empty, (2) whether that is normal, (3) what you can do, (4) where to get help. It must **not** imply failure or a personal shortcoming (§226). |
| **Error** | say (1) what happened, (2) whether your content was saved, (3) what did **not** happen, (4) how to recover, (5) whether retrying is safe, (6) how to reach a person. A technical error code is a secondary, expandable detail only (§231). Graded as Informational / recoverable / blocking / safety-critical / security-critical (§232–237). |
| **Not permitted (explicable)** | explain only when **what is missing is a choice of the participant's own**. The copy points at an actionable next step: `To use this you first need to agree to "Community participation" under My consent choices.` — and **discloses nothing about another person or the existence of a resource**. |
| **Protected existence** (ADR-050) | one uniform presentation that **does not distinguish "does not exist" from "you are not permitted"**. See 0.6. |

### 0.6 The uniform presentation of protected existence (ADR-050, all screens)

The backend answers `DenyAndHideExistence → 404` for every protected resource. The front end must present 404 and 403 with **the same copy**, never leaking the difference through a difference in wording.

> **Accessible name: `This page cannot be opened right now`** (`h1`)
>
> Body text:
> ```
> This link cannot be opened right now. The content may no longer be there,
> or you may not have permission to see it.
> We will not tell you which — that protects everyone's privacy, including yours.
> You can go back to the home page, or contact the research team.
> ```
> Actions: `Back to home` (Primary), `Contact the research team` (Secondary).

**A corollary (a hard constraint on B7/B17)**: any form that lets someone type another person's identifier freely and gives success or failure feedback based on it is an existence-probing channel. No such form may exist in the participant workspace — blocking and reporting can only be started from existing context (a conversation, a candidate card, a post, a connection). See Appendix B, deviation #1.

### 0.7 Live regions and announcements

- Exactly one `<p role="status" aria-live="polite">` per screen, announcing **the result of an operation** (success, failure, a state change) and never plain navigation.
- Serious errors (safety-critical, security-critical, a missing access token) use their own `role="alert"` and do not reuse the status region.
- **Prohibited**: rendering persistent server state inside a live region as a status display (the current ConsentPanel's `<p aria-live="off">Status: …</p>` conflates "the result of the last operation" with "the current consent state"; see Appendix A).
- After a list refresh, announce the count and its meaning: `Updated: 3 conversations.` — never an unread count, because there is none.

### 0.8 The general construction of a status badge (Doc 20 §56; colour is never sufficient)

```
[icon] label text · time   ⓘ explanation (expandable)
```
All three parts are required: an icon (distinguishable by shape, not dependent on colour) + a text label + a one-sentence expandable explanation. A badge may never be colour alone, nor icon alone.

### 0.9 The delivery state vocabulary (honest wording; already implemented in `apps/web/src/api.ts`, and the design adopts it unchanged)

| Domain state | What the participant sees | Explanation (expandable) |
|---|---|---|
| Not Submitted | `Draft — not sent yet` | Only you can see this. |
| Queued | `Confirmed, queued to send` | You confirmed sending it and the system is working on it. |
| Sent to Provider | `Handed to the sending service` | It has gone to the service responsible for delivery; the result is not known yet. |
| Provider Accepted | `The sending service accepted it (they have not received it yet)` | The delivery service took this message. **That is not the same as it reaching them.** |
| Delivered | `Delivered to them` | The delivery service confirmed it arrived. Whether it was read, we do not know. |
| Delivery Failed | `Sending failed — you can try again` | It did not arrive. Your content is still here and you can try again. |
| Delivery Unknown | `Delivery state unknown — being checked; this does not mean success` | We do not know the result for now. **Unknown means unknown**, and it will never quietly become "delivered". |

**Hard rule**: the interface may never rewrite `failed` or `unknown` as `delivered` without a result from the owning domain; it may never show `sent` on a mere "confirmation succeeded"; and it shows no read receipts (not enabled in this phase).

### 0.10 Glossary (stable; no synonym substitution)

consent / withdraw consent / testimony / draft / publish / connection (making contact) / both expressed interest / audience / visibility / moderation / safety signal / block / report / pause / leave.

### 0.11 Language (Doc 20 §277–284)

Second person, short sentences, plain; never condescending; never age labels ("the elderly", "seniors", "silver"); refusal and failure copy says **what can be done next** first and does not blame; no promise of benefit ("this will make you less lonely" ✗).

---

## B1 Home (the task list)

**Documents**: Doc 20 §36, §107 | **Status**: implemented (`apps/web/src/App.tsx`)

### Purpose, and the questions this screen answers

The home page is **the list of things to do today**, not something you can scroll forever. It answers:

1. Where am I in this research right now?
2. What is waiting for me today? (and this list is **finite and can be finished**)
3. Where is the thing I did not finish writing last time?
4. Is an assessment due?
5. Who do I go to if something is wrong? What if I want to stop?

**It does not answer**: "what is everyone else doing". There is no other person's content on the home page.

### Wireframe (mobile)

```text
┌──────────────────────────────────────┐
│ h1  What would you like to do today?  │
│ p   Here is what is waiting for you.  │
│     When it is done, it is done —     │
│     new things do not keep appearing. │
│                                      │
│ ┌ Where you are in the research ────┐ │
│ │ [◐] Stage 2 · of 4                │ │
│ │ Taking part for 3 weeks           │ │
│ │ [See my research →]               │ │
│ └───────────────────────────────────┘ │
│                                      │
│ h2  Waiting for you (3)               │
│ ┌ task card ────────────────────────┐ │
│ │ [!] Follow-up questionnaire       │ │
│ │ About 10 minutes · any time this  │ │
│ │ week                              │ │
│ │ You can stop partway; answers are │ │
│ │ kept.                             │ │
│ │ [Start the follow-up]             │ │
│ └───────────────────────────────────┘ │
│ ┌ task card ────────────────────────┐ │
│ │ [✎] You have 1 unfinished life    │ │
│ │     story draft                   │ │
│ │ Only you can see it               │ │
│ │ [Keep writing this draft]         │ │
│ └───────────────────────────────────┘ │
│ ┌ task card ────────────────────────┐ │
│ │ [✉] Mrs Zhang sent you a message  │ │
│ │ (no count, no content preview)    │ │
│ │ [Open this conversation]          │ │
│ └───────────────────────────────────┘ │
│                                      │
│ h2  Things you can do any time        │
│ ・[Write to someone you are connected │
│    to]                               │
│ ・[Look at the community (optional)]  │
│ ・[Meet new people (optional)]        │
│ ・[See or change my consent choices]  │
│ ・[Adjust text size, contrast and     │
│    reading]                          │
│                                      │
│ h2  If you need help or want to stop  │
│ ・[Get help or report a problem]      │
│ ・[Pause or leave the research]       │
│                                      │
│ p[role=status]                       │
└──────────────────────────────────────┘
```

Desktop (≥64rem): the same single column, `main` centred at 48rem; task cards do not split into columns — **no two-column grid**, to avoid "two decisions at once".

### Information hierarchy and block order (not interchangeable)

1. `h1` + one sentence managing the expectation that the list finishes
2. **Where you are in the research** (the current stage, read-only, pointing at B8)
3. **Waiting for you**: a due assessment > an unfinished draft > a social action awaiting your decision (a mutual acceptance to confirm, a new message). At most one card per kind; more than one collapses into "open the list".
4. **Things you can do any time** (no time pressure, with optionality stated in the label)
5. **If you need help or want to stop** (always visible on the home page, never buried in settings; Doc 20 §354 names "hiding withdrawal" as an anti-pattern)

### State matrix

| State | Presentation |
|---|---|
| Loading | `Seeing what is waiting for you today…`, holding the height of three cards; blocks 4 and 5 are available immediately (they need no network) and render first. |
| Empty (no tasks) | Under `h2 Waiting for you`: `There is nothing for you to do right now. That is normal — the research does not have something scheduled every day. If you would like to do something, anything below is available.` **No encouragement copy such as "well done" or "keep it up".** |
| Error | An inline recoverable error in blocks 2 and 3: `We could not fetch today's list. Nothing of yours was lost and nothing was changed.` + `Try again` + `Contact the research team`. Blocks 4 and 5 remain usable. |
| Not permitted | The home page is never wholly unavailable; if the target of a single task card requires consent, the card is rewritten as: `This needs you to agree to "Community participation" first.` + `Go to my consent choices`. |
| Protected existence | When the object a task card points at is no longer visible, the card **disappears silently**, leaving no trace such as "that content was deleted"; after a refresh the status region announces only `The list has been updated.` |

### Key interactions and confirmation copy

The home page **carries no action requiring confirmation** — it only navigates. That is deliberate: confirmation happens on the target screen, where the full account of consequences lives ("explain before asking").

### Accessibility points

- Focus order: skip link → h1 → stage card → task cards (in DOM order) → optional actions → help/leave → navigation.
- Each task card is an `<li>` with **exactly one** focusable button inside; the card as a whole is not clickable (avoiding an overlapping hit area between "the whole card" and "the button inside it").
- Buttons are block level at 100% width with `min-height: 2.75rem`, and `<li>`s are ≥0.75rem apart (already implemented in the existing CSS, and kept).
- The task count goes into the `h2` text (`Waiting for you (3)`) so a screen reader learns the size at once; **this is not an unread count** — it is the number of tasks not yet done, and it drops to zero and disappears when they are.
- `role="status"` announces the result of a refresh.

---

## B2 My consent choices

**Documents**: Doc 20 §95–102 | **Status**: implemented (`ConsentPanel.tsx`, currently six scopes — every one the platform actually gates on; see D-2)

**A companion new screen, "Who can access me" (`WhoHasAccess.tsx`, UI_INVENTORY B20)**: consent governs "what may be done with my information", an authorised relationship governs "by whom", and **the permission engine requires both** — `participant.view-shared` requires `requiresRelationship` and `supporter-involvement` consent together. Only the first half was on screen before, so the participant's workspace could not state what state their data was actually in. `relationship.approve` and `relationship.revoke` have always been `ownerOnly`, and no query listed relationships: a proposal waited on an approval the participant could not see, and an authorisation already in force could not be ended by the only person entitled to end it. The new screen makes both reachable and says plainly that the two gates do not substitute for one another (ending an authorisation does not change consent, and changing consent does not end an authorisation). **Note**: a relationship's initial state after creation is `PendingVerification`, and nothing on the platform ever "verifies" anything — the participant's decision is the only way out, so the wording is identical to `Proposed` and must not say "we are checking who they are", which would describe a check nobody performs and invite someone to consent on the strength of it.

### Purpose, and the questions this screen answers

1. What exactly have I agreed to, and what is the state now? (**the current state must be permanently visible**)
2. For each item, what happens if I say yes, what happens if I say no, and can I agree to only part of it?
3. Which are required and which are optional?
4. How do I change it, and what happens to things that already happened?

### Wireframe (mobile, the "My consent choices" overview)

```text
┌──────────────────────────────────────┐
│ h1  My consent choices                │
│ p   Each of these is a separate       │
│     choice. Saying no to any one of   │
│     them does not affect the others,  │
│     and does not affect your right to │
│     leave the research at any time.   │
│ [Consent form v1.3 · you chose on     │
│  2026-07-02]  [See my consent receipt]│
│                                      │
│ h2  Required (you cannot take part    │
│     without agreeing)                 │
│ ┌ consent item ─────────────────────┐ │
│ │ h3 Taking part in the research    │ │
│ │ [●] Now: agreed · 2026-07-02      │ │← badge always present
│ │ Why we ask: the research team     │ │
│ │   needs to record your taking part│ │
│ │ What information: your            │ │
│ │   participation record, your      │ │
│ │   assessment answers              │ │
│ │ Who can see it: the research team │ │
│ │   (not other participants)        │ │
│ │ If you say yes: …                 │ │
│ │ If you say no: you will not enter │ │
│ │   this research                   │ │
│ │ How to change it: you can         │ │
│ │   withdraw here at any time       │ │
│ │ [Agree to "Taking part"]          │ │← equal weight
│ │ [Decline "Taking part"]           │ │
│ │ [Withdraw consent to "Taking      │ │
│ │  part"]                           │ │
│ └───────────────────────────────────┘ │
│                                      │
│ h2  Optional                          │
│ ┌ consent item (with restrictions) ─┐ │
│ │ h3 Sharing my life story          │ │
│ │ [○] Now: not chosen yet           │ │
│ │ …(the same six paragraphs)…       │ │
│ │ [Agree to "Sharing my life story"]│ │
│ │ [Agree with conditions…]          │ │← opens the restriction picker
│ │ [Decline "Sharing my life story"] │ │
│ └───────────────────────────────────┘ │
│  …(the remaining items, grouped per   │
│    §97)…                             │
│                                      │
│ h2  You can always                    │
│ ・[See my consent receipt]            │
│ ・[Pause or leave the research]       │
│ p[role=status]                       │
└──────────────────────────────────────┘
```

### Information hierarchy and block order

1. `h1` + the opening that "each is separate and none affects your right to leave" (**it must come before any choice control** — explain before asking)
2. The consent form version + when you last decided + the way to the receipt
3. The **required** group
4. The **optional** group (the 22 scopes of §97 in thematic subgroups: research and assessment / life story / social / AI / data use and contact)
5. The receipt and the way out of the research

**The order inside a consent item card is fixed (the eight elements of §98)**: title → **current state** → why we ask → what information is involved → who can see it → what saying yes, saying no or adding conditions means → whether it is required → how to change it → the choice controls. The controls always come after the explanation.

### State matrix

| State | Presentation |
|---|---|
| Loading | `Reading your current consent choices…`; **no choice button renders until they have been read** (so a participant never acts against an unknown current state). |
| Empty (nothing chosen yet) | A notice at the top: `You have not made any choices yet. Every item below defaults to "not chosen yet" — not to "agreed".` Every badge reads `Not chosen yet`. |
| Error (read failed) | Blocking: `We could not read your consent choices, so this page cannot be changed for now — so that you do not decide without being able to see where you stand.` + `Try again` + `Contact the research team`. Every choice control is disabled with the reason stated. |
| Error (submit failed) | Recoverable: `That did not change. Your consent choices are exactly as they were, with nothing altered.` + the reason (an expandable error code) + `Try again`. |
| Not permitted | Not applicable — a participant may always see their own consent choices. |
| Protected existence | Not applicable (this is your own resource). A URL pointing at someone else's consent record → the uniform page of 0.6. |

### Key interactions and the confirmation copy

**Agree** (no dialog; it can be changed directly)
> Result announcement: `Recorded: you agreed to "Taking part in the research". You can withdraw at any time.`

**Decline**
> Result announcement: `Recorded: you declined "Joining the community". This does not affect your other choices.`

**Agree with conditions** (opens a dialog that does exactly one thing)
> Title: `Add conditions to "Sharing my life story"`
> Body: `You can agree to this and still keep some limits. The limits you choose are written into your consent record.`
> Options (checkboxes, none pre-selected): `Not for public display` / `May not be quoted` / `May not be downloaded` / `No longer used after the follow-up ends`
> Primary: `Save the conditions on "Sharing my life story"`  Secondary: `Back, don't change anything`

**Withdraw** (a detailed confirmation; the dialog handles one item at a time)
> Title: `Withdraw consent to "Taking part in the research"`
> Body:
> ```
> After withdrawing:
> ・The platform stops using your information for this purpose.
> ・Research datasets that are already locked will not be rewritten —
>   research records have to stay intact, and we cannot change them afterwards.
> ・No new data of yours will enter those datasets.
> ・This does not automatically take you out of the whole research; if you
>   want everything to stop, use "Pause or leave the research".
> ```
> Primary: `Confirm withdrawing "Taking part in the research"`  Secondary: `Back, don't withdraw`
> Result announcement: `Consent to "Taking part in the research" has been withdrawn. You can see this change in your consent receipt.`

**The comprehension check (§99, new)**: this is not an exam. Four single-choice questions; a wrong answer **does not block** and only expands an explanation.
> Example stem: `Does a private life story ever become public on its own?`
> Copy after a wrong answer: `It does not become public on its own. Visibility only changes when you change it yourself. Would you like to read that part again?` + `Read it again` / `I understand, carry on`
> **Prohibited**: shaming wording such as "incorrect" or "failed".

**The consent confirmation summary (§100, new, one screen before submitting)**
> Title: `Confirm your consent choices`
> Lists: what was agreed / what was declined / what conditions were added / supporter involvement / anything AI-related / anything social / data use
> Primary: `Submit my consent choices` (never "Submit" or "OK" alone)

**The consent receipt (§101, new, a separate screen you can return to)**: the date, the consent form's version number, each choice, any restrictions, whether anyone assisted you, who recorded it, and the two ways onward, `Change my consent choices` and `Pause or leave the research`. The receipt's main view does not carry long legal text; that lives in a "See the full consent form text (v1.3)" collapsible.

### Accessibility points

- Each consent item is an `<li>` containing an `h3`; the status badge follows the `h3` immediately, constructed per 0.8.
- The three (or four) choice buttons **may not** be implemented as a radio group — the "selected" appearance of a radio makes "not chosen yet" hard to tell from "declined", and the risk of pre-selection is high. Use equally weighted buttons plus a permanent status badge.
- The withdrawal dialog: `role="alertdialog"`, `aria-labelledby` on the title and `aria-describedby` on the consequences paragraph; focus enters at the title; closing returns to the "Withdraw…" button.
- Each comprehension check question is its own `fieldset` + `legend`; the explanation expands in place with `aria-live="polite"` and does not navigate away.
- At 200% zoom: the six explanatory paragraphs in a card become collapsible (`<details>`) with the first, "why we ask", expanded by default and the rest collapsed — **collapsing must never hide the consequences**, and "what saying no means" must remain visible by default.

---

## B3 Messages: the conversation list

**Documents**: Doc 20 §157–158 | **Status**: implemented (`MessagesScreen.tsx`)

### Purpose, and the questions this screen answers

1. Who can I talk to right now, and **why** am I allowed to talk to this person? (the CommunicationBasis)
2. Which conversations are already under way?
3. Which established connections have not started a conversation yet?
4. What do I do if I want to stop being in touch with someone?

**It does not answer**: "who is online", "who read my message", "how many unread do I have".

### Wireframe (mobile)

```text
┌──────────────────────────────────────┐
│ h1  Messages                          │
│ p   You can only write to people you  │
│     are connected to and are still    │
│     allowed to contact. What is below │
│     is all of it.                     │
│                                      │
│ h2  Conversations under way (2)       │
│ ┌ conversation row ─────────────────┐ │
│ │ Mrs Zhang                         │ │← permitted public identity
│ │ [✓] Under way                     │ │
│ │ Because: you both expressed        │ │← CommunicationBasis
│ │ interest in matching and made a   │ │
│ │ connection                        │ │
│ │ Last exchange: 3 days ago         │ │← no content preview
│ │ [Open the conversation with Mrs   │ │
│ │  Zhang]                           │ │
│ └───────────────────────────────────┘ │
│ ┌ conversation row (basis lapsed) ──┐ │
│ │ Mr Li                             │ │
│ │ [⊘] You cannot write here now     │ │
│ │ Because: your connection has ended.│ │
│ │ You can still see earlier messages.│ │
│ │ [See the record of this           │ │← read-only
│ │  conversation]                    │ │
│ └───────────────────────────────────┘ │
│                                      │
│ h2  Connected, no conversation yet (1)│
│ ┌ connection row ───────────────────┐ │
│ │ Mr Wang                           │ │
│ │ [✓] Connected · 2026-07-20        │ │
│ │ Because: you both expressed        │ │
│ │ interest in matching             │ │
│ │ [Start a conversation with Mr Wang]│ │
│ └───────────────────────────────────┘ │
│                                      │
│ ・[See who I have blocked or reported] │ │→ B17
│ p[role=status]                       │
└──────────────────────────────────────┘
```

### Information hierarchy and block order

1. `h1` + the boundary statement that you can only write to people you are connected to
2. **Conversations under way** (in reverse order of last exchange — that is chronological, not algorithmic)
3. **Connected, no conversation yet**
4. The way through to the reporting and blocking centre

The order inside a conversation row: the other person's **permitted public identity** → the status badge → **why you can (or cannot) write** → the time of the last exchange → the action.
The "why" must come before the action (explain before asking).

**The CommunicationBasis label vocabulary (Doc 20 §157, one of four)**:
`You both expressed interest in matching and made a connection` / `This is an existing contact of yours, verified` / `Because you are both taking part in the same research activity` / `You interact in a moderated community`.

### State matrix

| State | Presentation |
|---|---|
| Loading | `Reading your conversations and connections…`, holding two rows of space. **Changed to load on entry**, so "see my conversations and contacts" no longer has to be pressed (see Appendix A). |
| Empty (both empty) | `There is nobody you can write to yet. That is normal. To meet new people, go to "Meeting new people"; it is entirely optional, and not taking part does not affect the research.` + `Go to meeting new people (optional)` |
| Empty (connections, no conversations) | `You are connected to 1 person and have not started a conversation. Start whenever you have something to say; there is no time limit.` |
| Error | Recoverable: `We could not read your conversation list. Nothing was changed, and your messages are all still there.` + `Try again` |
| Not permitted (messaging consent missing) | The whole screen is replaced: `To use messages you first need to agree to "Messaging" under My consent choices.` + `Go to my consent choices` |
| Not permitted (messaging suspended) | `Messages are suspended right now. The research team will tell you separately why and how it will resume. You can still see your earlier messages.` |
| Protected existence | Someone blocked or revoked **does not appear in the list**, and leaves no placeholder; visiting their conversation URL directly → the uniform page of 0.6. Wording such as "that user is unavailable", which confirms the other person exists, is **prohibited**. |

### Key interactions and confirmation copy

**Start a conversation** (a simple confirmation — creating an empty conversation sends nothing and is low risk)
> Result announcement: `A conversation with Mr Wang has been started. No message has been sent yet.`

**Open a read-only conversation**: enters B4's read-only mode, with the editor area replaced by an explanation (see B4's state matrix).

### Accessibility points

- Each of the two `h2` groups is its own `<ul>`; each row is an `<li>` with one primary button inside.
- A button's accessible name includes the other person's name: `Open the conversation with Mrs Zhang` (not `Open`).
- Status badges are constructed per 0.8; the icon on `[⊘] You cannot write here now` is clearly different in shape from "under way".
- Focus order: h1 → conversations under way → connections not started → the reporting and blocking way through → navigation.
- `aria-live` is **not used** to announce "a new message arrived" — there is no live push, and there is no unread indicator.

---

## B4 Messages: a conversation and the send confirmation

**Documents**: Doc 20 §158–163 | **Status**: implemented (`MessagePanel.tsx`)

### Purpose, and the questions this screen answers

1. Who am I talking to, and why am I allowed to talk to them right now?
2. Was what I wrote saved? Was it sent? **Did they receive it** (answered honestly, including "we do not know")?
3. Can I look at the exact content once more before it goes?
4. This message looks wrong (asking for money, for a password, a suspicious link) — what can I do?

### Wireframe (mobile)

```text
┌──────────────────────────────────────┐
│ [← Back to conversations]             │
│ h1  Conversation with Mrs Zhang       │
│ [✓] You can write here now            │
│ Because: you both expressed interest  │
│ in matching and made a connection. ⓘ  │
│                                      │
│ h2  Messages                          │
│ ┌ their message ────────────────────┐ │
│ │ Mrs Zhang · 28 July 10:12         │ │
│ │ How are your tomatoes doing?      │ │
│ │ [Report this message]             │ │← always reachable
│ │ [Block Mrs Zhang]                 │ │
│ └───────────────────────────────────┘ │
│ ┌ my message ───────────────────────┐ │
│ │ You · 28 July 11:03               │ │
│ │ Three are ripe.                   │ │
│ │ [◔] The sending service accepted  │ │
│ │     it (they have not received it)│ │
│ │     ⓘ The delivery service took   │ │
│ │        this message. That is not  │ │
│ │        the same as it reaching    │ │
│ │        them.                      │ │
│ └───────────────────────────────────┘ │
│ ┌ my message (unknown) ─────────────┐ │
│ │ You · 29 July 09:40               │ │
│ │ Are you free tomorrow?            │ │
│ │ [?] Delivery state unknown —      │ │
│ │     being checked; this does not  │ │
│ │     mean success                  │ │
│ │     ⓘ We do not know the result   │ │
│ │        for now.                   │ │
│ │ [Send it again] [See the delivery │ │
│ │  record]                          │ │
│ └───────────────────────────────────┘ │
│                                      │
│ h2  Write a message                   │
│ label Message                         │
│ ┌──────────────────────────────────┐ │
│ │                                  │ │
│ └──────────────────────────────────┘ │
│ [Draft — only you can see this]       │← the draft state persists visually
│ [Save draft]     [Check and send]     │
│                                      │
│ ・[Get help]                          │
│ p[role=status]                       │
└──────────────────────────────────────┘
```

**The send confirmation dialog**

```text
┌ role=alertdialog ────────────────────┐
│ h3 Confirm sending to Mrs Zhang       │
│ To: Mrs Zhang (this one person only)  │
│ Version: version 1                    │
│ Why you may write now: you made a     │
│   connection                          │
│ Attachments: none                     │
│ ┌ the exact content ───────────────┐  │
│ │ I'll be at the community garden  │  │
│ │ tomorrow morning.                │  │
│ └──────────────────────────────────┘  │
│ After it goes:                        │
│ ・We queue it first, then hand it to   │
│   the sending service.                │
│ ・A successful confirmation is not the │
│   same as them receiving it.          │
│ ・Once it has gone to the sending      │
│   service it may not be recallable.   │
│ [Send the message]  [Back, don't send] │
└──────────────────────────────────────┘
```

### Information hierarchy and block order

1. Back → `h1 Conversation with {them}`
2. **The communication basis state** (may you write, and why) — before the writing area
3. The messages (chronological, newest at the bottom; each carrying its own source and state)
4. Writing a message (draft → check and send)
5. The way to help

**The rule for showing delivery state**: only **your own sent** messages show a delivery state (their messages have none). The state uses the vocabulary of 0.9 and the construction of 0.8 (icon + text + an expandable explanation).

### State matrix

| State | Presentation |
|---|---|
| Loading (the messages) | `Reading the messages…`; the writing area is **usable immediately** (writing a draft does not depend on the history). |
| Empty (no messages) | `Neither of you has written yet. Say whatever you like, in your own time.` |
| Error (saving a draft failed) | Recoverable, and it must say that the words are still there: `The draft was not saved. What you wrote is still in the box below; nothing was lost.` + `Try again` |
| Error (send confirmation failed) | Recoverable: `Sending did not go through, and this message was **not** sent. Your draft is still here.` + the reason + `Try again` |
| Error (delivery failed / unknown) | See 0.9; before `Send it again`, show: `Sending it again creates a new delivery attempt. If the previous one did in fact arrive, they may receive it twice.` |
| Not permitted (the communication basis has lapsed) | The whole writing area is replaced, **not merely reduced to a greyed-out button**: `You cannot write to Mr Li now, because your connection has ended. You can still see the earlier messages. To be in touch again you would need to make a new connection.` |
| Not permitted (you blocked them) | `You blocked this person, so you cannot write to them. You can review or undo this in the reporting and blocking centre.` (**it does not say whether they know**) |
| Protected existence | When the other account is no longer reachable, the conversation becomes read-only with the copy `This conversation can only be viewed now.` — **with no explanation of why**, and no distinction between them leaving, being suspended, or having blocked you. |

### Key interactions and the confirmation copy

**Save draft** (a simple confirmation)
> `Draft saved. Only you can see it, and it has not been sent.`

**Editing invalidates a confirmation** (existing behaviour kept, copy retained)
> `The content changed — save the draft again, then check and send.`

**The send confirmation** (a detailed confirmation; the copy is in the wireframe above)
> Primary: `Send the message`  Secondary: `Back, don't send`
> Success announcement: `Sending confirmed. The message is queued and has not arrived yet.`

**The scam and link warning (§163, new)**: appears inline **after the draft is saved and before check-and-send**, with no dialog (it is not a decision, it is a prompt).
> Title: `Have another look before it goes`
> Body: `There is a link to somewhere else in this message. People who want to trick you sometimes use links to get passwords or money. If you are not sure, it is entirely fine not to send it.`
> Actions (equal weight): `Don't send for now` / `Change what I wrote` / `Block this person` / `Report this person` / `Get help`
> Footnote: `This is only a reminder, and is not a judgement about anyone.`

**Retrying (§162, new)**
> Title: `Send "Are you free tomorrow?" again`
> Body: `We do not know how the last one ended. Sending it again creates a new delivery attempt; if the last one did arrive, they may see it twice.`
> Primary: `Send it again`  Secondary: `Back, don't send for now`

### Accessibility points

- The messages are an `<ol aria-label="Messages">` (the existing accessible name is kept).
- Each message is an `<li>`: sender → time → content → state. The state text follows the content in the DOM, so the screen reader's order is natural.
- State changes announce into `role="status"`; **the delivery state itself does not go into a live region** (it is persistent state, not an event).
- The send confirmation dialog: `aria-describedby` points at the three "after it goes" consequences; the exact content is a `<blockquote>` and can be read aloud.
- Touch: `Send the message` and `Back, don't send` need ≥8px between them whether stacked or side by side, and **must not touch** (to prevent mis-taps).
- The scam warning uses `role="status"` (not `alert`) — it does not interrupt, and it does not accuse.

---

## B5 Meeting new people (matching)

**Documents**: Doc 20 §143–156 | **Status**: implemented (`MatchingPanel.tsx`)

### Purpose, and the questions this screen answers

1. What is this, and do I want to take part? (off by default, optional)
2. What information of mine does the platform use to suggest people, and who can see it?
3. Why was this person suggested to me? (**you see the explanation, not who they are**)
4. What happens after I say "Interested"? Will they know? (no)
5. After "you both expressed interest", do I have to make a connection? (no)

### Wireframe (mobile; each of the four stages is its own screen or section)

**Stage 0 — the introduction (§143, required reading on first entry)**

```text
┌──────────────────────────────────────┐
│ h1  Meeting new people (optional)     │
│ p   This is off by default. Taking    │
│     part or not makes no difference   │
│     to the rest of the research.      │
│                                      │
│ h2  Three different things            │
│ ┌──────────────────────────────────┐ │
│ │ A suggestion ≠ Both expressed     │ │
│ │               interest ≠ Connected│ │
│ │ ───────────   ──────────   ───────│ │
│ │ the system    both people   you    │ │
│ │ shows you an  separately    both   │ │
│ │ explanation   said          agree  │ │
│ │ of someone    "Interested"  to be  │ │
│ │ who might     (their        in     │ │
│ │ suit you      choice is     touch  │ │
│ │               private to    │      │ │
│ │               you)                 │ │
│ └──────────────────────────────────┘ │
│ h2  What you should know              │
│ ・Your choice is not told to them.     │
│ ・Their choice is not told to you.     │
│ ・Suggestions expire, and expiry means │
│   nothing about anyone.               │
│ ・The platform does not promise you    │
│   will get on, or that anyone will    │
│   answer.                             │
│ ・You can pause or leave matching at   │
│   any time.                           │
│ ・You can block or report at any time. │
│ [Carry on and choose what I share]    │
│ [Not taking part for now]             │
└──────────────────────────────────────┘
```

**Stage 1 — the review before turning it on (§145)**

```text
┌──────────────────────────────────────┐
│ h1  Before turning matching on        │
│ h2  The information you plan to use    │
│ label Interests I am willing to use   │
│       for matching (comma separated)  │
│ [gardening, chess                   ] │
│ ・Language: English                    │
│ ・Rough location: city level (not your │
│   street or building)                 │
│ ・How you prefer to be contacted:      │
│   text messages                       │
│                                      │
│ h2  Who sees this                     │
│ ・The people you are suggested to see   │
│   only a statement like "you both     │
│   chose gardening", not your name.    │
│ ・Until you have both expressed        │
│   interest, they cannot see who you   │
│   are.                                │
│ h2  How long it lasts                 │
│ ・Each suggestion expires after 14 days.│
│ ・You can pause at any time (keeping   │
│   existing suggestions) or leave       │
│   entirely (all suggestions lapse).   │
│ [Turn matching on] [Back, not yet]    │
└──────────────────────────────────────┘
```

**Stage 2 — the candidate list and the decision (§147–152)**

```text
┌──────────────────────────────────────┐
│ h1  Current suggestions               │
│ p   Every choice here is equally       │
│     legitimate. "Not now" does not     │
│     affect later suggestions. Your     │
│     choice is not told to them.       │
│                                      │
│ ┌ candidate card ───────────────────┐ │
│ │ Why this was suggested to you:    │ │
│ │ You both chose gardening as an    │ │
│ │ interest, both use English, and   │ │
│ │ both prefer text messages.        │ │
│ │ [See the full explanation]        │ │← §149
│ │ [⏳] Expires in 7 days            │ │
│ │ ────────────────────────────────  │ │
│ │ [Interested] [Not now]            │ │← all three equal
│ │ [Don't show me this person again] │ │
│ │ ────────────────────────────────  │ │
│ │ [Block] [Report]                  │ │← secondary, always present
│ └───────────────────────────────────┘ │
│ p[role=status]                       │
└──────────────────────────────────────┘
```

**Stage 3 — mutual acceptance and making a connection (§155–156, its own screen)**

```text
┌──────────────────────────────────────┐
│ h1  You both expressed interest       │
│ [✓] Mutual acceptance valid ·         │
│     lapses in 14 days                 │
│ p   The two of you each chose          │
│     "Interested" separately. Whether   │
│     to make a connection is still     │
│     yours to decide. Not making one   │
│     does not notify them.             │
│ h2  After a connection is made         │
│ ・You can write to each other.         │
│ ・You will see the name they chose to  │
│   show.                               │
│ ・It does not mean they can see your   │
│   life story.                         │
│ ・It does not make them your supporter.│
│ ・You can disconnect, block or report  │
│   at any time.                        │
│ [Make a connection] [Not for now]     │
└──────────────────────────────────────┘
```

### Information hierarchy and block order

Introduction (once; reachable afterwards from help) → the review before turning it on → the candidate list → mutual acceptance → making a connection.
**Each stage is one screen, and each screen is one decision.** The current implementation stacks "turn matching on", "see suggestions" and "make a connection" on the same screen — a violation of "one meaningful decision at a time" (see Appendix A).

**The order inside a candidate card**: the explanation (why suggested) → the way to the full explanation → the expiry time → the three equally weighted decisions → block/report.
**Never present**: their name, avatar, internal identifier, a score, "87% match", or a ranking.

**The MatchExplanation detail (§149)** must contain: which attributes you entered yourself, when you entered them, **a statement of uncertainty** (`This is only a comparison of what each of you wrote down. It is not a judgement about whether you will get on.`), the matching policy's version number, and the prohibited-use statement (`This information may not be used for selling, fundraising or any commercial purpose. Please report it if you see that.`).

### State matrix

| State | Presentation |
|---|---|
| Loading | `Seeing whether there are new suggestions…` |
| Empty (no candidates, §154) | `There are no suitable suggestions right now. That does not mean anything is wrong, and it is not because of you. A suggestion only appears when it suits both sides, and sometimes it just takes time. You can: change the interests you are willing to share / pause matching / look at the community (a different route).` |
| Empty (matching not turned on) | `Matching is off. To turn it on, first look at which of your information it would use.` + `Learn about it and turn matching on` |
| Error | Recoverable: `We could not fetch suggestions. Nothing in your matching settings was changed.` + `Try again` |
| Not permitted (consent missing) | `To use matching you first need to agree to "Open matching" under My consent choices. That one is off by default.` + `Go to my consent choices` |
| Not permitted (matching suspended) | `Matching is suspended right now. The connections you already have are unaffected.` |
| **Protected existence** | When a candidate or a mutual acceptance lapses (they left, blocked you, it expired, or it was already used for a connection), the card disappears or is replaced with an **unattributed** statement: `This suggestion can no longer be used. That is common and can happen for many reasons.` It **never** says it was the other person's doing. |
| The five mutual-acceptance states (§155) | `Being checked (no result yet)` / `Mutual acceptance valid` / `Mutual acceptance expired` / `Mutual acceptance lapsed` / `Already used to make a connection`. Every one of them is worded **without blame**: `lapsed` is explained as `Something changed, and this can no longer be used. It is nobody's fault.` |

### Key interactions and the confirmation copy

**Turn matching on** (a detailed confirmation)
> Title: `Turn matching on?`
> Body: `Once it is on, the platform uses what you chose above (gardening, chess, English, text messages, city-level location) to look for people who might suit you. Until you have both expressed interest, nobody can see who you are. You can pause or leave at any time.`
> Primary: `Turn matching on`  Secondary: `Back, not yet`
> Success announcement: `Matching is on. Only the interests you chose to share are used for suggestions.`

**The "Interested" confirmation (§151; all five points are required)**
> Title: `Choose "Interested" for this suggestion?`
> Body:
> ```
> After choosing "Interested":
> ・You are not connected yet.
> ・They are not notified, and will not know what you chose.
> ・Their choice is equally private to you.
> ・Only if they separately choose "Interested" too will you both see
>   "you both expressed interest".
> ・This suggestion expires in 7 days; after that it cannot be chosen.
> ```
> Primary: `Confirm "Interested"`  Secondary: `Back`

**The "Not now" / "Don't show me this person again" confirmation (§152)**
> Title: `Choose "Not now" for this suggestion?`
> Body: `"Not now" means only that you are not considering it this time; you might meet them again if things change. "Don't show me this person again" takes this suggestion out of your current list. Neither choice leaves any negative mark on you or on them, and neither is the same as blocking. They are not notified.`
> Primary: `Confirm "Not now"`  Secondary: `Back`

**Make a connection (a detailed confirmation)**
> Title: `Make a connection?`
> Body: `Once it is made you can write to each other, and you will see the name they chose to show. It does not mean they can see your life story, and it does not give them any care or research authority. You can disconnect, block or report at any time.`
> Primary: `Confirm making a connection`  Secondary: `Back`
> Success announcement: `The connection has been made. You can write to each other under "Messages" now.`
> Failure (the mutual acceptance expired, lapsed or was already used): `The connection could not be made, because this mutual acceptance can no longer be used. It is nobody's fault, and it does not mean they turned you down. You can carry on looking at other suggestions.`

**Blocking from the matching screen (§153)**: no identifier is shown; it acts directly on the candidate. The confirmation copy is in B7/B17, with one sentence added: `We will not tell you whether they know about this.`

### Accessibility points

- The three decision buttons: side by side in one `<p>`, `min-height: 2.75rem`, ≥8px apart; **the same CSS class**, and applying a primary style to `Interested` is prohibited (this can be checked automatically: the computed styles of all three must be identical).
- Block and report are visually secondary but **must be reachable by Tab**, and are never hidden inside a disclosure (§354, "hiding Block or Report").
- A candidate card is an `<li>`; the explanation text is the first readable element inside it.
- The expiry countdown is text (`Expires in 7 days`), never motion or a colour gradient; it is identical under `reduced-motion`.
- Stage 3 is its own screen, with focus moving to the `h1` on entry.
- `role="status"` announces the result of a decision; after a decision the card is removed from the list and it announces `Your choice has been recorded. They will not be notified.`

---

## B6 Community

**Documents**: Doc 20 §134–142 | **Status**: implemented (`CommunityPanel.tsx`)

### Purpose, and the questions this screen answers

1. What communities are there, and what is each one for?
2. What are the rules before I join? (**the exact rule version**)
3. What order is anything in here? (time, and nothing else)
4. When does what I write become visible to others? (only after I explicitly publish it)
5. What can I do about content that upsets me?

### Wireframe (mobile)

```text
┌──────────────────────────────────────┐
│ h1  Community (optional)              │
│ p   Taking part in the community is    │
│     entirely optional. Posts appear    │
│     in time order, with no algorithmic │
│     ordering, no likes and no view     │
│     counts. Posts from people you have │
│     blocked do not appear, and they    │
│     cannot see your posts either.     │
│                                      │
│ h2  Communities                       │
│ ┌──────────────────────────────────┐ │
│ │ Gardening Corner                  │ │
│ │ [✓] You are a member · rules v3   │ │
│ │ For balconies and vegetable plots │ │
│ │ [Enter "Gardening Corner"]        │ │
│ │ [See the rules] [Stop taking part │ │
│ │  in "Gardening Corner"]           │ │
│ └──────────────────────────────────┘ │
│ ┌──────────────────────────────────┐ │
│ │ Old Photographs                   │ │
│ │ [○] Not joined · rules v1         │ │
│ │ [Read the rules and join]         │ │
│ └──────────────────────────────────┘ │
│                                      │
│ h2  My drafts (1)                     │
│ ┌ dashed border ───────────────────┐ │
│ │ The tomatoes ripened today        │ │
│ │ [✎] Draft — only you can see this │ │
│ │ Community: Gardening Corner       │ │
│ │ [Publish…] [Delete this draft]    │ │
│ └──────────────────────────────────┘ │
│ p[role=status]                       │
└──────────────────────────────────────┘
```

**Inside a community**

```text
┌──────────────────────────────────────┐
│ [← Back to communities]               │
│ h1  Gardening Corner                  │
│ [✓] You are a member · you agreed to   │
│     rules v3                          │
│ [See this version of the rules]       │
│ p   Posts appear newest first.        │
│                                      │
│ h2  Write a post                      │
│ label What you would like to share     │
│       (saved as a draft first; you    │
│       confirm before publishing)      │
│ ┌──────────────────────────────────┐ │
│ └──────────────────────────────────┘ │
│ [Save draft]                          │
│ p Once saved, only you can see it. For │
│   members to see it, you have to      │
│   publish it explicitly under "My     │
│   drafts".                            │
│                                      │
│ h2  Posts in Gardening Corner          │
│ ┌ post card ───────────────────────┐ │
│ │ Zhou of the Balcony ·             │ │← safe public identity
│ │   30 July 08:20                   │ │
│ │ The tomatoes ripened today        │ │
│ │ [Report this post]                │ │← always reachable
│ │ [Block Zhou of the Balcony]       │ │
│ └──────────────────────────────────┘ │
│ ┌ post card (yours) ────────────────┐ │
│ │ You · 29 July · [✓] Published     │ │
│ │ It rained yesterday               │ │
│ │ [Withdraw this post]              │ │
│ └──────────────────────────────────┘ │
│ p[role=status]                       │
└──────────────────────────────────────┘
```

### Information hierarchy and block order

**The list page**: the explanation (no algorithm, no likes, blocking is in force) → the community list → my drafts.
**Inside a community**: back → `h1 community name` → membership and rule version → **writing a post (drafts first)** → the post stream.

Putting "writing" before "reading" is what keeps both the home page and the community page from becoming a consumption feed — a participant comes here to do something, not to scroll.

**The order inside a post card**: the author's safe public identity → the time → the content → (if it came from a life story) the source attribution → the state (own posts only) → report/block.

**The post state vocabulary (§139)** (implemented, and kept): `Draft — only you can see this` / `Published` / `Temporarily hidden (under review)` / `Visibility restricted` / `Removed (a human moderation decision)` / `Deleted` / `Archived` / `Restored` / `Withdrawn`.
**Hard rule**: a post whose visibility is restricted **may not** be presented as "deleted".

### State matrix

| State | Presentation |
|---|---|
| Loading | `Reading the communities…` / `Opening "Gardening Corner"…` |
| Empty (no communities) | `There are no open communities yet. When the research team opens one, it will appear here.` |
| Empty (a community with no posts) | `There are no posts in this community yet. You can write the first one, or just look around — either is fine.` |
| Empty (no drafts) | The "My drafts" block does not render at all (no content, no placeholder). |
| Error (joining failed) | Recoverable: `We could not join you to "Gardening Corner"; your membership has not changed.` + the reason + `Try again` |
| Error (publishing failed) | Recoverable, and it must say so: `That was not published. This is **still a draft**, and only you can see it.` |
| Not permitted (consent missing) | `Joining a community needs you to agree to "Community participation" under My consent choices first.` + `Go to my consent choices` (this mapping already exists in the implementation and is kept) |
| Not permitted (posting suspended by moderation) | `You cannot post in this community right now. The research team will tell you separately why and how it will resume. You can still read posts.` |
| Protected existence | Posts from anyone blocked or removed **do not appear and leave no placeholder**; visiting their URL directly → the uniform page of 0.6. Wording such as "that content was deleted", which confirms it once existed, is **not shown**. |

### Key interactions and the confirmation copy

**Joining a community (a detailed confirmation, bound to the exact rule version)**
> Title: `Read the community rules (version 3) before joining "Gardening Corner"`
> The rules are presented in full in a `<blockquote>` (not collapsed, not summarised)
> Closing sentence: `Joining means you agree to the version above. Joining requires that you have already agreed to "Community participation"; you can stop taking part at any time.`
> Primary: `Agree to the rules and join`  Secondary: `Back`
> Success announcement: `You have joined "Gardening Corner". You can stop taking part at any time, and it will not affect anything else.`

**Save draft**
> `Draft saved. Only you can see it; you have to confirm explicitly before it is published.`

**Publish (a detailed confirmation, naming the community)**
> Title: `Confirm publishing to "Gardening Corner"? Every member will be able to see it.`
> The content is presented verbatim in a `<blockquote>`
> Added: `After publishing: members of the community can see this post; staff moderate it by hand under the community rules; you can withdraw it, but people who have already read it may remember what it said.`
> Primary: `Confirm publishing`  Secondary: `Back`
> Success announcement: `Published. Members of the community can see this post now.`

**Stop taking part in a community (§141, new)**
> Title: `Stop taking part in "Gardening Corner"?`
> Body: `After stopping: you will no longer see this community's posts and cannot post. Posts you already published stay in the community — if you want them taken back, withdraw them one by one first and then stop. Matching is a separate thing and is unaffected. Your part in the research also continues, unless you separately choose to leave.`
> Primary: `Confirm stopping "Gardening Corner"`  Secondary: `Back, keep taking part`

**Reporting content in a community (§142, new; started from the post card, with no identifier typed)**
> Steps: choose a type → add anything you want to say (optional) → whether to block as well → submit
> The receipt after submitting: `We have your report. A person will look at it. To protect everyone involved, we will not tell you the details of what happens next, and we will not tell them who reported it.` It **must not** predict the outcome.

### Accessibility points

- The rules dialog may be very long: `role="alertdialog"` + an internally scrollable area + `tabindex="0"` so it can be scrolled from the keyboard; the dialog itself must never burst the viewport.
- `Enter "Gardening Corner"`, `Stop taking part in "Gardening Corner"`, `Block Zhou of the Balcony` — accessible names carry the specific object.
- The post stream is a `<ul>`; `Report` and `Block` inside each card are secondary buttons and are Tab-reachable.
- A draft card uses a dashed border **and** the words `[✎] Draft — only you can see this` (shape + text, never relying on colour).
- At 200% zoom: post cards are a single column with no horizontal scrolling; long content is handled by `overflow-wrap: anywhere`.

---

## B7 Help and safety

**Documents**: Doc 20 §142, §166–168 | **Status**: implemented (`SafetyPanel.tsx`, embedded in the App's help screen)

### Purpose, and the questions this screen answers

1. I am in trouble right now — who do I go to? (**this is at the very top**)
2. What about an emergency? (stated plainly: not this platform)
3. I want someone to leave me alone → block
4. I want staff to know what happened → report
5. I am worried about my own safety or someone else's → a safety signal

### Wireframe (mobile)

```text
┌──────────────────────────────────────┐
│ h1  Help and safety                   │
│                                      │
│ ┌ Emergencies (permanent, at the top)┐│
│ │ [!] If you or someone else is in   ││
│ │     danger right now               ││
│ │ Call your local emergency number   ││
│ │ directly.                          ││
│ │ This platform is not an emergency  ││
│ │ channel, and staff are not watching││
│ │ it around the clock.               ││
│ └────────────────────────────────────┘│
│                                      │
│ h2  Contact the research team         │
│ You can contact the research team at   │
│ any time, about anything, including    │
│ "can I stop".                         │
│ [Contact the research team]           │
│                                      │
│ h2  I want to block someone            │
│ p Blocking starts from somewhere you   │
│   and this person have crossed paths:  │
│   a conversation, a community post, or │
│   a suggestion. That way we do not     │
│   need you to type any identifier.    │
│ ・[Go to my conversations]             │
│ ・[Go to the community]                │
│ ・[See who I have blocked]             │← B17
│                                      │
│ h2  I want to report what happened     │
│ p A report is read by staff, and is    │
│   never decided by an automated system │
│   alone. Even if you block them        │
│   afterwards, the report is still      │
│   handled.                            │
│ ・[Report from a conversation]         │
│ ・[Report from a community post]       │
│ ・[Report something not about specific │
│    content]  ← the general way in     │
│                                      │
│ h2  I have a safety concern            │
│ p The safety team reads what you send.  │
│   It can be about you or about someone │
│   else.                               │
│ label What you are worried about (in   │
│       your own words)                 │
│ ┌──────────────────────────────────┐ │
│ └──────────────────────────────────┘ │
│ [Submit a safety concern]             │
│ p Someone will read this after you send │
│   it. It does not automatically alert  │
│   any emergency service.               │
│                                      │
│ h2  Other                             │
│ ・[Common questions]                   │
│ ・[Accessibility statement]            │
│ ・[Pause or leave the research]        │
│ p[role=status]                       │
└──────────────────────────────────────┘
```

### Information hierarchy and block order (the order is itself a safety design)

1. **The emergency statement** (always first, always visible, never collapsed)
2. Contact the research team (the lowest-threshold way to get help)
3. Blocking (**started from context**; this screen only routes)
4. Reporting (the same, plus one general way in that concerns no specific person)
5. Safety concerns (free text; the only action that can be submitted from this screen)
6. Other (FAQ / accessibility statement / pause and leave)

### State matrix

| State | Presentation |
|---|---|
| Loading | This screen **renders without the network**: the emergency statement and the contact details are static content and must be visible offline. |
| Empty | Not applicable. |
| Error (submitting a safety concern failed) | Safety-critical: `That did not reach the safety team. What you wrote is still in the box below. If this is urgent, do not wait here — call your local emergency number, or contact the research team directly.` + `Try again` + `Contact the research team`. A toast alone is **not permitted**. |
| Error (offline) | A banner at the top: `There is no connection right now. Emergency calls do not need one.` |
| Not permitted | Not applicable — help and safety are always available to every participant, regardless of any consent item, suspension or moderation state. **This is a hard rule.** |
| Protected existence | The blocking and reporting routes enumerate nobody; the general reporting route accepts no identifier. See Appendix B, deviation #1. |

### Key interactions and the confirmation copy

**The blocking confirmation (§166–167, started from context, a detailed confirmation)**
> Title: `Block Mrs Zhang?`
> Body:
> ```
> After blocking:
> ・You will not appear in each other's suggestions again.
> ・Neither of you can write to the other.
> ・Neither of you can see the other's posts or public profile.
> ・We will try to cancel messages that are queued and not yet sent — but if one
>   has already gone to the sending service it may already have been sent, and
>   we cannot take it back.
> ・Content involving this person will no longer enter the AI's context.
> ・We will not tell you whether they know about this.
>
> Blocking is your own decision and you can undo it at any time. Undoing it does
> not automatically restore the connection, conversation or suggestions you had —
> those would have to start again.
> ```
> A secondary option (a checkbox, not pre-selected): `Report this person as well`
> Primary: `Confirm blocking`  Secondary: `Back, don't block`
> Success announcement: `Blocked. We have tried to cancel messages that had not gone yet.`

**The report receipt (§142; it does not predict the outcome)**
> `We have your report. A person will look at it. To protect everyone involved, we will not tell you the details of what happens next, and we will not tell them who reported it. You can see the reports you have submitted in the reporting and blocking centre.`

**The safety concern receipt**
> `This has gone to the safety team. Someone will read it. It does not automatically alert any emergency service — if this is urgent, call your local emergency number.`

### Accessibility points

- The emergency statement uses `<section role="note">` (not `role="alert"` — it is permanent content, not a new event, and an alert would interrupt the reading every time the screen is entered).
- The safety concern textarea must have a **visible** `<label>` (the current implementation uses `aria-label`; see Appendix A): `What you are worried about (in your own words)`.
- Focus order: h1 → the emergency statement → contact the team → the blocking routes → the reporting routes → safety concerns → other → navigation. **The emergency information must come first in the focus order.**
- On a failed submission, focus moves to the error notice (`role="alert"` + `tabindex="-1"`).
- No part of this screen may be simplified away in "simplified mode" (B13) — safety content is exempt from content reduction.

---

## B8 My research

**Documents**: Doc 20 §108 | **Status**: not implemented

### Purpose, and the questions this screen answers

1. What research am I actually taking part in, and why is it being done?
2. How long am I taking part for, and where am I now?
3. What have I done, and what is coming?
4. What did I agree to? (points at B2)
5. When will there be results, and how will I be told?

**This screen makes no decisions** — it is the map of "where I am". Every action button routes somewhere else.

### Wireframe (mobile)

```text
┌──────────────────────────────────────┐
│ h1  My research                       │
│ [ℹ] This is a conceptual research      │← the phase statement, required
│     prototype. There are no real      │
│     participants yet, and no real     │
│     conclusions.                      │
│                                      │
│ h2  What this research is trying to    │
│     find out                          │
│ p (the purpose in plain words, 2–4     │
│    sentences)                         │
│ [Read a fuller explanation]           │
│                                      │
│ h2  Where you are                     │
│ ┌ timeline (vertical) ──────────────┐ │
│ │ [✓] Learning and consent          │ │
│ │     done 2026-07-02               │ │
│ │ [✓] Baseline questionnaire        │ │
│ │     done 2026-07-05               │ │
│ │ [◐] Activity stage                │ │← current
│ │     under way · week 3            │ │
│ │ [ ] Follow-up questionnaire       │ │
│ │     expected mid-August           │ │
│ │ [ ] Ending and results            │ │
│ │     expected October              │ │
│ └───────────────────────────────────┘ │
│ p About 3 months in all. The times are │
│   estimates, not targets. Finishing    │
│   later is fine.                      │
│                                      │
│ h2  What is coming                    │
│ ・Follow-up questionnaire · about 10   │
│   minutes · this week                 │
│   [Start the follow-up]               │
│                                      │
│ h2  What you have done                │
│ ・Baseline questionnaire · 2026-07-05 ·│
│   completed                           │
│ ・First interaction record ·           │
│   2026-07-12                          │
│ [See the full record]                 │
│                                      │
│ h2  How this research uses your        │
│     information                       │
│ ・The research team can see: …         │
│ ・Other participants cannot see: …     │
│ ・Results are published in aggregate,  │
│   never naming anyone.                │
│ [See or change my consent choices]    │
│                                      │
│ h2  Results                           │
│ p When the research ends we will tell   │
│   every participant the overall        │
│   results in plain words. We will not  │
│   give you a personal diagnosis or     │
│   assessment — this research does not  │
│   do that.                            │
│                                      │
│ ・[Contact the research team]          │
│ ・[Pause or leave the research]        │
│ p[role=status]                       │
└──────────────────────────────────────┘
```

### Information hierarchy and block order

1. The phase statement (a synthetic prototype, no real conclusions)
2. The purpose of the research (in plain words)
3. **Where you are** (the timeline, including the total duration)
4. What is coming (the only block with an action)
5. What you have done
6. How your information is used (→ B2)
7. The plan for results (stating explicitly that no personal conclusion is given)
8. Help and leaving

### State matrix

| State | Presentation |
|---|---|
| Loading | `Reading where you are in the research…`; the purpose and the results plan are static content and render first. |
| Empty (just enrolled, no records) | Under "What you have done": `No records yet. You have just started, and that is normal.` |
| Error | Recoverable and local: `We could not read where you are. The description of the research is still available, and none of your records is lost.` + `Try again` |
| Not permitted | Not applicable (this is your own resource). |
| Protected existence | If the enrolment record is not reachable → the uniform page of 0.6. |
| Paused | A banner at the top: `Your participation is paused. Nothing new will be scheduled while it is. You can resume at any time.` + `See the pause settings` |
| Left | `You have left this research. This page is kept so you can look at your records from the time and your leaving receipt.` + `See my leaving receipt` |

### Key interactions and confirmation copy

No action requires confirmation. **The one discipline that matters here is the copy**: the timeline may not use evaluative wording such as "behind", "overdue" or "incomplete"; use `Not done yet` / `Expected mid-August`.

### Accessibility points

- The timeline is an `<ol>` with each step an `<li>`; states use an icon plus text (`[✓] Done` / `[◐] Under way` / `[ ] Not done yet`), never colour alone.
- The current step carries `aria-current="step"`.
- Under `h2 Where you are`, give a one-sentence summary first (`You are at step 3 of 5`), so a screen reader user knows their position without listening through every item.
- The phase statement uses `<section role="note">`, not `alert`.

---

## B9 Life Story: the archive home

**Documents**: Doc 20 §109–110 | **Status**: **partly implemented** (the M17 backend has archives / items / versions / visibility / contributions / withdraw / export)

**Implemented**: reading your own life story (`life-story.view-own`, `ownerOnly`), writing a new item, and confirming an **exact version** as testimony. Before this there was no read path at all — the permission catalogue did not contain a single read action: a participant could write, revise, confirm and withdraw, and could not see what was in there, while a supporter could already propose content into it. Asking someone to accept or decline a contribution to a story they cannot read is not a decision that can be made properly.

Each item states its source and confirmation state beside itself (ADR-024) rather than in a legend somewhere else: who wrote it (you / a supporter / a drafting tool / a transcription / a translation), and whether you confirmed that these are your own words. After the text changes, an earlier version's confirmation **does not** carry across to the new version, and the screen says so plainly — otherwise the record would come to mean "you confirmed words you never read". A withdrawn item is still readable by its author — withdrawing takes it back from other people, not the platform ruling that you may no longer remember your own past.

**Not implemented**: visibility and audience (B11), export (B12), revising an existing item, and AI drafting (not enabled per D-14).

### Purpose, and the questions this screen answers

1. What have I written?
2. Which are still drafts (only I can see them)? Which have I confirmed as my testimony?
3. Which have been shared, and with whom?
4. What has someone contributed to me that is waiting for my decision?
5. How do I export them, or take them back?

**"Private is the default" must be visible on the screen, never guessed at.**

### Wireframe (mobile)

```text
┌──────────────────────────────────────┐
│ h1  My life story                     │
│ [🔒] By default only you can see these.│
│      Others can only see something if  │
│      you change its visibility         │
│      explicitly.                      │
│                                      │
│ ┌ main actions ─────────────────────┐ │
│ │ [Keep writing: My father's bicycle]│ │← first when a draft exists
│ │ [Write a new one]                 │ │
│ └───────────────────────────────────┘ │
│                                      │
│ h2  Waiting for you (1)                │
│ ・Xiaofang added something to "My      │
│   father's bicycle"                   │
│   [Look at it and decide]             │← §128
│   p What somebody else adds does not   │
│     become your testimony until you    │
│     confirm it.                       │
│                                      │
│ h2  Drafts (2)                        │
│ ┌ dashed card ──────────────────────┐ │
│ │ My father's bicycle               │ │
│ │ [✎] Draft · version 3 · only you  │ │
│ │     can see this                  │ │
│ │ Last changed: yesterday           │ │
│ │ [Keep writing] [Delete this draft] │ │
│ └───────────────────────────────────┘ │
│                                      │
│ h2  What I have confirmed (4)          │
│ ┌ solid card ───────────────────────┐ │
│ │ The summer of 1976                │ │
│ │ [✓] Your testimony · version 2    │ │
│ │     you confirmed on 2026-07-20   │ │
│ │ [🔒] Visibility: only you         │ │
│ │ [View] [Change visibility]        │ │
│ │ [Change it again]                 │ │
│ └───────────────────────────────────┘ │
│ ┌ solid card (shared) ──────────────┐ │
│ │ The lane in the old photograph    │ │
│ │ [✓] Your testimony · version 1    │ │
│ │ [👥] Visibility: my connections   │ │
│ │      (3 people)                   │ │
│ │      [See which 3 people]         │ │
│ │ [View] [Change visibility]        │ │
│ │ [Take the sharing back]           │ │
│ └───────────────────────────────────┘ │
│                                      │
│ h2  Managing                          │
│ ・[Export my whole life story]         │
│ ・[Ask someone to add to it]           │
│ ・[About life stories]                 │
│ p[role=status]                       │
└──────────────────────────────────────┘
```

### Information hierarchy and block order

1. `h1` + **the private-by-default statement** (before any content)
2. The main actions: keep writing a draft > write a new one
3. Waiting for you (supporter contributions awaiting a decision)
4. Drafts (dashed, `only you can see this`)
5. What I have confirmed (solid, with the testimony label + a visibility badge)
6. Managing (export / invite a contribution / explanation)

**Never present**: view counts, who has looked, "this one is popular", or recommendation ordering. Ordering is by when it was last changed.

### State matrix

| State | Presentation |
|---|---|
| Loading | `Reading your life story…` |
| Empty (brand new) | `You have not written anything yet. A life story is you telling your own life — whether you write, what you write and how much are all yours to decide. What you write can only be seen by you unless you change that.` + `Write a new one` + `See where people usually start` (→ the prompt cards, B10) |
| Empty (confirmed items, no drafts) | The "Drafts" block does not render. |
| Error | Recoverable: `We could not read your life story. Everything of yours is still there — nothing lost and nothing changed.` + `Try again` |
| Not permitted (life story consent missing) | `This part needs you to agree to it under My consent choices first.` + `Go to my consent choices` |
| Protected existence | An item that is not reachable **does not render**; visiting its URL directly → the uniform page of 0.6. "This one was deleted" is **not shown**. |

### Key interactions and confirmation copy

**Delete a draft** (a detailed confirmation — a draft took effort and deleting it cannot be undone)
> Title: `Delete the draft "My father's bicycle"?`
> Body: `This draft will be deleted and cannot be recovered. It has not been confirmed as your testimony and has not been shared with anyone. If you simply do not want to write for now, you can leave it — drafts do not expire and nothing will chase you.`
> Primary: `Confirm deleting this draft`  Secondary: `Back, keep it for now`

**Handling a supporter's contribution (§128)**: the way in is here; the full flow is in B10's "what somebody else added" section.

### Accessibility points

- A draft card (dashed + `[✎] Draft`) and a testimony card (solid + `[✓] Your testimony`): distinguished three ways over, by shape, icon and text.
- Visibility badges are constructed per 0.8: `[🔒] Visibility: only you` / `[👥] Visibility: my connections (3 people)`; `See which 3 people` is a Tab-reachable link.
- Multiple buttons in a card: block or inline, either is fine, but neighbouring buttons are ≥8px apart and ≥44px tall.
- Block counts go into the `h2` (`Drafts (2)`).
- Focus: on entry, focus is on the `h1`; returning from B10, focus returns to the card just edited.

---

## B10 Life Story: create / AI draft / confirm as testimony

**Documents**: Doc 20 §111–118, §128–129 | **Status**: not implemented (the backend has `createItem` / `reviseItem` / `confirmTestimony` / `reviewContribution`)

### Purpose, and the questions this screen answers

1. What am I going to write? (prompt cards help you start, but can be skipped and you can choose your own subject)
2. What can AI do for me? **Did AI write this or did I?**
3. Are the names, places and dates the AI "read out" of my words correct? (confirmed one at a time)
4. When does this text become "my testimony"? (**only after I explicitly confirm that one exact version**)
5. What if I want to change it after confirming?

**The core discipline of this screen**: `an AI draft ≠ your testimony`. AI output carries the `Draft` and `AI involved` labels permanently until the person confirms it; the confirming action is bound to an **exact version number**.

### Wireframe (mobile; five steps, one screen each)

**Step 1 — choosing a subject (§112)**

```text
┌──────────────────────────────────────┐
│ h1  Where would you like to start?    │
│ p These are only prompts. You can skip │
│   any of them, or choose your own      │
│   subject.                            │
│ ┌ prompt card ──────────────────────┐ │
│ │ A place you often go               │ │
│ │ About 10 minutes · you can type or │ │
│ │ speak                              │ │
│ │ [Use this prompt]                  │ │
│ └───────────────────────────────────┘ │
│ ┌ prompt card (sensitive) ──────────┐ │
│ │ A loss                             │ │
│ │ [⚠] This one is not easy for some  │ │
│ │     people                         │ │
│ │ About 15 minutes                   │ │
│ │ [Use this prompt] [Skip this one]  │ │
│ └───────────────────────────────────┘ │
│ [I'll choose my own subject]          │
│ [Not writing for now, back to my life │
│  story]                               │
└──────────────────────────────────────┘
```

**Step 2 — drafting (§113–114)**

```text
┌──────────────────────────────────────┐
│ h1  Writing: My father's bicycle      │
│ [✎] Draft · only you can see this ·    │← persistent, sticks to the top
│     saved automatically just now       │  while scrolling
│                                      │
│ label What you would like to write     │
│ ┌──────────────────────────────────┐ │
│ │ My father had an old black        │ │
│ │ roadster…                         │ │
│ └──────────────────────────────────┘ │
│                                      │
│ h2  Would you like AI to help?         │
│     (optional)                        │
│ p AI gets things wrong. Every sentence │
│   it changes for you only counts once  │
│   you have read it yourself.           │
│ ・[Help me start]                      │
│ ・[Turn my speech into text]           │
│ ・[Tidy up the paragraphs]             │
│ ・[Suggest a title]                    │
│ ・[Say it more simply]                 │
│                                      │
│ ─ what the AI wrote (if you used it) ─ │
│ [🤖] AI draft · not your testimony yet │
│ ┌──────────────────────────────────┐ │
│ │ (the AI output, directly editable)│ │
│ └──────────────────────────────────┘ │
│ [Replace my text with this]           │
│ [No thanks, discard it]               │
│                                      │
│ [Save draft] [Check the details in it →]│
│ [This subject is uncomfortable for me] │← §129
└──────────────────────────────────────┘
```

**Step 3 — confirming the details one at a time (§115)**

```text
┌──────────────────────────────────────┐
│ h1  Are these details right?           │
│ p These were read out of what you       │
│   wrote. [🤖] They are AI suggestions,  │
│   not verified facts. Only you know     │
│   whether they are right.              │
│                                      │
│ ┌ detail ───────────────────────────┐ │
│ │ Person: father                     │ │
│ │ [Confirm] [Change it] [Remove it]  │ │← all four equal
│ │ [Not sure]                         │ │
│ └───────────────────────────────────┘ │
│ ┌ detail ───────────────────────────┐ │
│ │ Year: sometime in the 1970s        │ │
│ │ [Confirm] [Change it] [Remove it]  │ │
│ │ [Not sure]                         │ │
│ └───────────────────────────────────┘ │
│ [Leave these for now]                 │← leaving them all is allowed
│ [Next: look at this whole version →]   │
└──────────────────────────────────────┘
```

**Step 4 — confirming as testimony (§116–117)**

```text
┌──────────────────────────────────────┐
│ h1  Confirm that this is your story    │
│ h2  The exact version you are          │
│     confirming                        │
│ [📄] Version 3 · saved 2026-08-03 14:20│
│ ┌ the exact text (whole, untruncated)┐ │
│ │ My father had an old black         │ │
│ │ roadster…                          │ │
│ └───────────────────────────────────┘ │
│ h2  Where this version came from       │
│ ・Written by you: most of it            │
│ ・[🤖] AI involved: tidying paragraphs, │
│   suggesting a title                  │
│ ・Added by others: none                 │
│ h2  The details you confirmed           │
│ ・Person: father (you confirmed)        │
│ ・Year: not sure (kept as uncertain)    │
│ h2  After confirming                    │
│ ・This version is marked "your          │
│   testimony" — meaning this is your     │
│   own account of your own experience.  │
│ ・It does **not** mean anyone has        │
│   checked whether it is historically   │
│   accurate.                            │
│ ・Confirming does not change            │
│   visibility. It is "only you" now,    │
│   and will still be "only you".        │
│ ・You can change it later; a change      │
│   creates a new version, and the old   │
│   one is kept.                         │
│                                      │
│ [Confirm this is my story]            │← the wording §324 specifies
│ [Back, let me change it]              │
└──────────────────────────────────────┘
```

### Information hierarchy and block order

Choosing a subject → drafting (AI optional, and placed **after** the writing area) → confirming details → **confirming as testimony** → visibility (B11, a separate step and a **separate action**).

**Hard rules**:
- Confirming as testimony **does not** change visibility along the way. They are two screens with two confirmations (Doc 20 §116 states that "current visibility" is **displayed** at this step, not changed).
- Autosave saves **only** a draft; it never confirms testimony and never shares (§113). The autosave notice reads `saved automatically just now (still a draft)`.
- AI output always appears in **its own block** carrying `[🤖] AI draft · not your testimony yet`, and only enters the participant's own text through an explicit `Replace my text with this`.

### State matrix

| State | Presentation |
|---|---|
| Loading (AI working) | `The AI is tidying this up… (a few seconds)` with `Cancel` available (§224 permits a safe cancel). **No fake progress bar.** |
| Empty (no details found) | `Nothing was found that needs confirming. That is normal — carry straight on.` |
| Error (autosave failed) | A persistent inline warning (not a toast): `Automatic saving did not work. What you wrote is still on this page, but has not reached the server. Please press "Save draft", or copy the text somewhere first.` |
| Error (AI unavailable, §221) | `The AI help is not available right now. You can write as usual — this does not affect saving or confirming.` |
| Error (confirming testimony failed: a version conflict) | Blocking: `We could not confirm, because this content was changed elsewhere. We stopped so that you do not confirm words you have not read. Please look at the latest version and confirm that.` + `See the latest version` |
| Not permitted | As B9. |
| Protected existence | As B9. |
| A sensitive subject (§129) | Appears inline, no dialog: `It is quite normal for this subject to be hard to write about. You can: [Pause for now] [Save as a draft only you can see] [Skip this prompt] [Don't let the AI use this text] [Contact the research team] [Report] [Safety help]`. The wording is calm and **does not use** "warning" or "danger". |

### Key interactions and the confirmation copy

**Confirming as testimony (a detailed confirmation bound to the exact version)**
> Primary button: `Confirm this is my story`
> Dialog title: `Confirm version 3 as your testimony?`
> Body: `What you are confirming is version 3 exactly as you see it above, word for word. After confirming, this version is marked "your testimony" — meaning it is your own account, not that anyone has checked it as historical fact. Visibility does not change, and is "only you" now.`
> Primary: `Confirm this is my story`  Secondary: `Back, let me look again`
> Success announcement: `Confirmed. Version 3 is now marked as your testimony. Visibility has not changed and only you can see it.`

**Changing it after confirming (§118)**
> Notice: `What you confirmed is version 3. A change creates version 4; version 3 is kept, still labelled as the testimony you confirmed on 2026-08-03. Version 4 is a draft until you confirm it again.`
> Primary: `Start changing it (creating a new version)`  Secondary: `Back`

**What somebody else added (§128)**
> Title: `Xiaofang added something to "My father's bicycle"`
> Body: `Xiaofang wrote this, not you. Until you decide, it does not appear in your story and does not become your testimony — **and even if you accept it, what somebody else added stays marked "added by someone else" and never becomes your testimony.**`
> Four equally weighted actions: `Accept it as their addition` / `Change it and then accept` / `Don't accept it` / `Ask them to take it back`
> Success announcement (accept): `Accepted. This is marked "added by Xiaofang" and shown separately from your own testimony.`

**The AI involvement label vocabulary (§53, shown permanently beside the content)**: `AI draft` / `AI transcription` / `AI translation` / `AI tidying` / `AI suggestion`. The label **remains** after saving and does not disappear on confirmation — confirming makes it "testimony the participant confirmed, drafted with AI involvement", not "written by the participant alone".

### Accessibility points

- The draft label sticks to the top (`position: sticky`), but degrades to a static block at the top under `prefers-reduced-motion` and at 200% zoom, so it never covers content.
- The four detail-confirmation buttons are the same class, equal in weight and Tab-reachable; each detail is an `<li>` with an `<h3>` or emphasised text as the prefix of its accessible name (`Person: father`).
- The AI output area is `aria-live="polite"`, announcing on completion: `The AI has produced a tidied version below. It is not your testimony yet.`
- The confirmation dialog's `aria-describedby` points at the four "after confirming" consequences.
- Voice input (if enabled): the recording state uses text + icon + a timer, never flashing; the stop button is ≥44px and well away from "delete".
- The long-text editor must not scroll horizontally at 200% zoom; `overflow-wrap: anywhere`.

---

## B11 Life Story: visibility and audience

**Documents**: Doc 20 §119–124, §46–48 | **Status**: **not built, waiting for a reader** (ruling D-16). The backend has `changeVisibility` and `Internet Public` is refused (`UNSUPPORTED_CAPABILITY`), but **no read path anywhere looks at `visibility`** — the only query in the repository that reads items, `getMyLifeStory`, is `ownerOnly`, so changing something to `Community` still leaves the actual audience at zero. `Selected People` is worse still: no command can write `life_story.access_grants`. Putting this on screen now would leave a participant believing they had shared when they had not. **Unlock condition**: first a non-owner read path that respects `visibility` and `access_grants`, and a command that writes grants

### Purpose, and the questions this screen answers

1. Who can see this one right now?
2. If I change it to X, **which people** exactly can see it? (the audience must be nameable or countable)
3. What can they do? (view / comment / quote / download / forward)
4. Can I change it back, and what about people who already saw it?

**Audience before publication**: the audience picker and the audience preview must appear **before** the "confirm the change" control.

### Wireframe (mobile)

```text
┌──────────────────────────────────────┐
│ [← Back]                              │
│ h1  Who can see "The lane in the old   │
│     photograph"                       │
│ Now: [🔒] only you                    │
│                                      │
│ h2  Choose a scope                    │
│ ┌ option ───────────────────────────┐ │
│ │ (•) Only you                       │ │
│ │     Nobody but you can see it.     │ │
│ │     The research team does not     │ │
│ │     read the content either,       │ │
│ │     unless you separately agree.   │ │
│ └───────────────────────────────────┘ │
│ ┌ option ───────────────────────────┐ │
│ │ ( ) People I choose                │ │
│ │     You pick them one by one. Only │ │
│ │     people who already have a      │ │
│ │     relationship with you can be   │ │
│ │     chosen.                        │ │
│ └───────────────────────────────────┘ │
│ ┌ option ───────────────────────────┐ │
│ │ ( ) My connections                 │ │
│ │     3 people right now. Connections│ │
│ │     you make later will **not**    │ │
│ │     see it automatically unless    │ │
│ │     you come back and change this. │ │
│ └───────────────────────────────────┘ │
│ ┌ option ───────────────────────────┐ │
│ │ ( ) A community                    │ │
│ │     Members of that community and  │ │
│ │     its moderators can see it. It  │ │
│ │     appears among the community's  │ │
│ │     posts.                         │ │
│ └───────────────────────────────────┘ │
│ ┌ option ───────────────────────────┐ │
│ │ ( ) Public on the platform         │ │
│ │     Every signed-in eligible user  │ │
│ │     on the platform can see it,    │ │
│ │     and it may be found by search  │ │
│ │     within the platform.           │ │
│ │     [Public on the platform ≠      │ │
│ │      public on the internet]       │ │
│ └───────────────────────────────────┘ │
│ ┌ unavailable (explained) ──────────┐ │
│ │ [✗] Public on the internet         │ │
│ │     This prototype does not offer  │ │
│ │     this. Putting content on the   │ │
│ │     internet needs a separate      │ │
│ │     process and separate approval. │ │
│ └───────────────────────────────────┘ │
│                                      │
│ h2  Audience preview                  │← appears as soon as you choose
│ You chose: my connections             │
│ ・These 3 people: Mrs Zhang, Mr Wang,  │
│   Mr Li  [See the list]               │
│ ・Do they have to sign in: yes         │
│ ・People you blocked: cannot see it    │
│ ・Can it be found by search: no        │
│ ・Can they comment: no                 │
│ ・Can they quote or download: no       │
│ ・Can you change it back: yes, any time│
│                                      │
│ [Change visibility to "my connections"]│
│ [Back, don't change anything]         │
└──────────────────────────────────────┘
```

### Information hierarchy and block order

1. The current visibility (state where things stand first)
2. The scope options (including the unavailable one and why)
3. **The audience preview** (appearing as soon as a choice is made, before the submit button)
4. Submit and cancel

**The eight elements of an audience preview (§47)**: exactly who / whether signing in is required / whether blocked people are excluded / whether it can be found by search / whether they can comment / whether they can quote, download or forward / whether it can be taken back / the scope of research use. All eight are required.

### State matrix

| State | Presentation |
|---|---|
| Loading (the audience count) | `Working out exactly who is in this scope…`; **until it is known, the submit button is disabled** with the reason: `You have to know exactly who before you can confirm.` |
| Empty (chose "my connections" and there are none) | `You have no connections yet, so this scope holds 0 people right now. Choosing it means nobody would see it. Connections you make later will not see it automatically either — you would need to come back and change this.` |
| Empty ("people I choose" with nobody to choose, §121) | `There is nobody you can choose right now. Only people who already have a relationship with you can be chosen.` |
| Error | Recoverable: `Visibility was not changed. It is still "only you", with nothing altered.` + `Try again` |
| Not permitted (sharing consent missing) | `To share a life story you first need to agree to "Sharing my life story" under My consent choices.` + `Go to my consent choices` |
| Not permitted (public on the internet) | The option is permanently visible but not selectable, with the reason attached (see the wireframe). It is **not hidden** — hiding it would suggest no such thing exists. |
| Protected existence | The candidate list for "people I choose" contains **only already-authorised** people; there is no search box for querying arbitrary people (that would be existence probing). See Appendix B, deviation #1. |

### Key interactions and the confirmation copy

**Lowering visibility (making it private, a simple confirmation)**
> `Changed to "only you". Others cannot see it now. People who already read it may remember what it said, and we cannot take that back.`

**Raising visibility to "my connections" (a detailed confirmation)**
> Title: `Show "The lane in the old photograph" to your 3 connections?`
> Body: `Those 3 people are: Mrs Zhang, Mr Wang and Mr Li. They can read it; they cannot comment, quote or download it. Connections you make later will not see it automatically. You can change it back to "only you" at any time.`
> Primary: `Confirm showing it to these 3 people`  Secondary: `Back, don't change anything`

**Raising it to "public on the platform" (a reinforced, step-up confirmation)**
> Title: `Make "The lane in the old photograph" public on the platform?`
> Body: `Every signed-in eligible user on the platform will be able to see it, and it may be found by search within the platform. This is **not** public on the internet — it will not appear in search engines. You can change it back at any time, but we cannot make anyone who read it beforehand forget it.`
> The reinforcing step: `Type "public on the platform" to confirm` (a text field)
> Primary: `Confirm making it public on the platform`  Secondary: `Back, don't change anything`

**The additional statement for a community audience (§123)**
> `Once it goes to a community, members of that community and its moderators can see it, it appears in the community's posts, and it is subject to version 3 of that community's rules.`

### Accessibility points

- The scope options use `<fieldset>` + `<legend>Choose a scope</legend>` + a radio group (radios are right here: mutually exclusive single values with a clear "current value").
- An unavailable option uses `disabled` + `aria-describedby` pointing at the reason text — **never** grey alone.
- The audience preview area is `aria-live="polite"`, announcing on a change of choice: `You chose my connections, which is 3 people.`
- The list expands in a `<details>` with `<summary>See the list</summary>`.
- The submit button's accessible name contains the target scope (`Change visibility to "my connections"`) — the consequence is legible from the button's name alone.

---

## B12 Life Story: withdrawal and export

**Documents**: Doc 20 §125–126 | **Status**: **partly implemented**. **Implemented**: asking the platform for a copy of your own information (`participant.export`, owner-only + confirmed), and **seeing what became of that request** (a new `export.view-own`). The request had always been permitted on the server and the route existed, but the participant workspace had no way in — so the right existed only for people who knew the API; and adding a button alone was not enough either, because **a request whose outcome cannot be seen is indistinguishable from a request never made, and a refusal looks exactly like silence**. The wording promises no delivery: this is a request, reviewed by **someone other than the person who made it** (the database layer refuses approval by the requester), and the copy is produced after that; `Approved` is not written as "generated", and `Generated` is not written as "delivered". Asking **requires no reason** — a copy of your own information is not conditional on explaining yourself. Withdrawing a life story item (`withdrawItem`) exists in the backend, and the participant screen offers no way in yet. **Not implemented**: exporting a single life story item, and the withdrawal entry point

### Purpose, and the questions this screen answers

1. I want one of these not to be seen any more — how, and how many kinds of "taking it back" are there?
2. After taking it back, what about what already happened? (answered honestly: people who read it remember, and we cannot help that)
3. I want a copy of what I wrote — how do I get it, and when?
4. Does the export contain anyone else's content? Was AI involved?

### Wireframe (mobile, withdrawal)

```text
┌──────────────────────────────────────┐
│ [← Back]                              │
│ h1  Taking back "The lane in the old   │
│     photograph"                       │
│ p There are several kinds of "taking    │
│   back", of different strength. Choose │
│   one.                                │
│                                      │
│ ┌ option ───────────────────────────┐ │
│ │ ( ) Make it visible only to me     │ │
│ │     The content stays; others can  │ │
│ │     no longer see it.              │ │
│ │     [The lightest kind; you can    │ │
│ │      change it back any time]      │ │
│ └───────────────────────────────────┘ │
│ ┌ option ───────────────────────────┐ │
│ │ ( ) Take it down from the community│ │
│ │     The post disappears from       │ │
│ │     "Gardening Corner". The content│ │
│ │     stays in your archive.         │ │
│ └───────────────────────────────────┘ │
│ ┌ option ───────────────────────────┐ │
│ │ ( ) Do not use this one in research│ │
│ │     Research datasets generated    │ │
│ │     from now on will not include   │ │
│ │     it. [Datasets already locked   │ │
│ │     will not be rewritten]         │ │
│ └───────────────────────────────────┘ │
│ ┌ option (destructive) ─────────────┐ │
│ │ ( ) Ask for this one to be deleted │ │
│ │     [⚠] Once deleted it cannot be  │ │
│ │     recovered. For the integrity   │ │
│ │     of the research record, some   │ │
│ │     governance records (who did    │ │
│ │     what and when) are kept, but   │ │
│ │     they do not hold the content.  │ │
│ └───────────────────────────────────┘ │
│                                      │
│ h2  What happens afterwards            │
│ Immediately:                          │
│ ・[✓] others can no longer see it      │
│ Takes a little time:                  │
│ ・[⏳] cached copies update gradually  │
│ What we cannot do:                    │
│ ・[✗] what people who read it remember │
│ ・[✗] screenshots anyone saved         │
│                                      │
│ [Confirm: make it visible only to me]  │
│ [Back, don't take it back]            │
└──────────────────────────────────────┘
```

### Wireframe (mobile, export)

```text
┌──────────────────────────────────────┐
│ h1  Export my life story              │
│ h2  What it will contain              │
│ ・6 pieces you confirmed as testimony  │
│   (with the history of every version) │
│ ・2 drafts                             │
│ ・1 passage added by someone else      │
│   (marked with who added it)          │
│ ・What AI was involved in (and where)  │
│ ・The visibility and sharing record     │
│ h2  What it will not contain           │
│ ・Content written by others that you    │
│   have no right to take away          │
│ ・Any information about another         │
│   participant                         │
│ h2  Format                            │
│ ・One ZIP file containing plain text    │
│   and images                          │
│                                      │
│ [Start making the export file]        │
│                                      │
│ ─ afterwards ──────────────────────── │
│ [◐] Being made · a few minutes        │
│ [✓] Ready · available for 7 days      │
│     [Download]                        │
│ [✓] You downloaded it on 2026-08-03   │
└──────────────────────────────────────┘
```

### Information hierarchy and block order

**Withdrawal**: the options (lightest to heaviest) → **the three classes of consequence (immediate / takes time / cannot be done)** → confirmation.
**Export**: what it contains → what it does not → the format → making it → three states (being made / ready / downloaded, which §126 explicitly requires be kept separate).

The three classes of consequence are the design core of this screen: Doc 20 §125 requires it to "show immediate effects and pending propagation", and this design adds a third class, **"what we cannot do"** — a direct consequence of the honest-wording principle.

### State matrix

| State | Presentation |
|---|---|
| Loading (making the export) | `Being made · a few minutes`. **You can leave this screen**: `You can go and do something else; it will be here when it is ready.` No fake progress bar. |
| Empty (nothing to export) | `You have not written anything yet, so there is nothing to export right now.` |
| Error (withdrawal failed) | Recoverable: `That was not taken back. Visibility is still "my connections", with nothing altered.` + `Try again` |
| Error (export failed) | Recoverable: `The export file was not made. None of your content was affected at all.` + `Try again` + `Contact the research team` |
| Not permitted (export consent missing) | `To export, you first need to agree to "Export" under My consent choices.` |
| Protected existence | The export contains **no** identifier of any other participant; content added by others is trimmed to the scope it was authorised under, and the file states `this passage was written by somebody else, and is included here under the scope authorised at the time`. |

### Key interactions and the confirmation copy

**Make it visible only to me (a simple confirmation)**
> `Changed to "only you". Others cannot see it now. What people who already read it remember is not something we can take back.`

**Ask for deletion (a reinforced confirmation)**
> Title: `Delete "The lane in the old photograph"?`
> Body:
> ```
> After deleting:
> ・The content of this one is deleted and cannot be recovered.
> ・Every historical version of it is deleted with it.
> ・For the integrity of the research record, one governance record is kept:
>   that a piece of content was deleted, when, and by whom. That record does
>   not hold the content itself.
> ・If this content has already gone into a locked research dataset, that
>   dataset will not be rewritten — we cannot change a locked research record
>   after the fact. Datasets generated from now on will not include it.
> ・What people who already read it remember is not something we can take back.
> ```
> The reinforcing step: `Type the title of this one to confirm: The lane in the old photograph`
> Primary: `Confirm deleting this one`  Secondary: `Back, don't delete`

**The three export announcements**
> Being made: `Being made. You can go and do something else.`
> Ready: `The export file is ready and can be downloaded for 7 days.`
> Downloaded: `Downloaded. The file is on your device — please look after it, because it holds your own personal content.`

### Accessibility points

- The three classes of consequence use three icon-bearing lists (`[✓]` immediate / `[⏳]` takes time / `[✗]` cannot be done), with distinguishable icon shapes.
- The destructive option uses the destructive token **and** a `[⚠]` icon **and** the words "cannot be recovered".
- The reinforced confirmation's text field has a visible `<label>`, with `aria-describedby` pointing at the exact words to be typed.
- The export status area is `aria-live="polite"`; when polling, it announces only **on a change of state** and does not repeat "being made".
- The `Download` button does not render while the file is not ready (rather than rendering disabled) — so nobody keeps pressing a greyed-out button.

---

## B13 Accessibility and preferences (capability-adaptive modes)

**Documents**: Doc 20 §103–104, §286–287 | **Status**: **partly implemented (2026-08-04)**

**Implemented**: text size (standard / large / larger / largest), content density (standard / spacious), contrast (standard / high) and reduced motion. The style hooks for these four (`data-font-scale` / `data-density` / `data-contrast`) **had always been in the stylesheet with no code anywhere setting them** — four text sizes and three densities defined and unreachable, which is "the capability exists and nobody can invoke it", the exact counterpart of "the control does nothing when pressed". Per §B13 they **take effect immediately with no save button** (a save button would mean it had not taken effect yet), with a live preview. "Standard" **removes the attribute rather than writing `standard`**: writing "standard" explicitly would quietly override what the user has already set at the operating system level (`prefers-contrast` / `prefers-reduced-motion`), and the screen says honestly "your device already asks for …, and this platform is already following it". Preferences **are stored on this device only**, which the screen says out loud, so that "your preferences" is not read as something that travels with the person. In the wording, **no option is described as a deficit**.

**Deliberately not implemented**: read aloud, one step at a time, simpler wording, and longer time to act. They are in the design and none of them is in the implementation — putting them on screen would record a choice no code will ever read, the same rule laid down by D-2. "Someone is helping me" is already implemented as D-15's persistent assistance banner, and this screen only points there rather than duplicating a control.

**A measurement defect fixed along the way**: at 320px (§G's 400% zoom target), the widest navigation label `Messages` (bold as the current item) needs 71px while each slot gives only 68px, so it was **clipped by 3px** — D-10's arithmetic was slightly optimistic. The fix was to take back the navigation bar's own side padding (it is edge-anchored chrome and does not need the body text's margin), **not to reduce the type size**: shrinking the text for older users to accommodate a layout points the wrong way. At the `xl` and `xxl` sizes the navigation now wraps to **2+2 rather than 3+1** — 3+1 clipped `Messages` by 7px and gave `Help` a whole row to itself; a larger type size is exactly what a user chose in order to read, and clipping a label at that moment removes the words precisely where they were most needed.

### Purpose, and the questions this screen answers

1. The text is too small / the contrast is not enough / the animation is dizzying / I want it read to me — where do I change that?
2. What will it look like after I change it? (**seen on the spot, with no need to save first**)
3. How do I go back if I get it wrong?
4. Will people think less of me for changing these? (no — **not one option is described as a deficit**)

### Wireframe (mobile)

```text
┌──────────────────────────────────────┐
│ h1  Reading and using this            │
│ p These are your preferences and you   │
│   can change them at any time. What    │
│   you choose makes no difference to    │
│   anything in the research, and is not │
│   treated as a judgement about you.   │
│                                      │
│ ┌ live preview (sticky) ────────────┐ │
│ │ Preview                            │ │
│ │ This is what body text looks like. │ │
│ │ [This is a button]                 │ │
│ │ label This is a text field         │ │
│ │ [__________]                       │ │
│ └───────────────────────────────────┘ │
│                                      │
│ h2  Text size                         │
│ ( ) Standard ( ) Large (•) Larger      │
│ ( ) Largest                           │
│                                      │
│ h2  Contrast                          │
│ (•) Standard  ( ) High contrast        │
│                                      │
│ h2  Content density                    │
│ (•) Standard                          │
│ ( ) Spacious (less on each screen,     │
│     more space between things)        │
│                                      │
│ h2  Wording and steps                  │
│ [ ] Use simpler wording                │
│ [ ] Show one step at a time            │
│ [ ] Show less on the page, only what   │
│     is needed                         │
│     p Safety and emergency information │
│       is always kept.                 │
│                                      │
│ h2  Sound and motion                   │
│ [ ] Read the content aloud             │
│ [ ] Reduce motion                      │
│     p Your system settings already ask  │
│       for reduced motion, and we are   │
│       already following that.          │
│                                      │
│ h2  Time                              │
│ [ ] I need longer to do things         │
│     p We try not to impose time limits  │
│       anyway. With this on, anything   │
│       that is timed gives more time.   │
│                                      │
│ h2  Someone helping me                 │
│ [ ] Someone is helping me use this      │
│     p Once on, the interface makes clear│
│       who is using it. Every step the  │
│       person helping you takes is       │
│       recorded as theirs, not yours.   │
│                                      │
│ [Save these settings]                 │
│ [Put everything back to standard]     │
│ p[role=status]                       │
└──────────────────────────────────────┘
```

### Information hierarchy and block order

1. `h1` + **the no-judgement statement** (before any option)
2. **The live preview** (sticky, always visible — §104 requires a live preview)
3. Visual: text size → contrast → content density
4. Cognitive: simpler wording → one step at a time → less on the page
5. Sensory: read aloud → reduce motion
6. Time
7. Assisted mode
8. Save / back to standard

**Naming discipline (§104, "No selection is labelled as a deficit")**:
- ✗ `senior mode`, `easy mode`, `accessibility mode`, `assisted mode`
- ✓ `Larger`, `High contrast`, `Spacious`, `Use simpler wording`, `Show one step at a time`
- The screen's title is `Reading and using this`, not `Accessibility settings` (which implies "you have a disability"). The navigation item carries the same name.

### State matrix

| State | Presentation |
|---|---|
| Loading | This screen **renders from the locally saved preferences first** and then syncs with the server; there is no "loading settings" blank. |
| Empty (never set) | Everything at standard, with a notice at the top: `These are the standard settings. You can try any of them below, and the preview changes as you do.` |
| Error (save failed) | Recoverable, and it must state what is in force: `The settings did not reach the server. They are in effect on this device, and on another device you would have to set them again.` + `Try again` |
| Not permitted | Not applicable — preferences are always available to everyone, regardless of consent items or a suspension. |
| Protected existence | Not applicable. |
| Assisted mode on | A global context banner (visible on every screen): `"Someone is helping me" is on. The person using this is: Nurse Li.` + `Switch back to using it myself` |

### Key interactions and the confirmation copy

**Effective on the spot; saving is persistence**: every change takes effect **immediately** in the preview and across the whole interface; `Save these settings` only syncs it to the account. This is what §287's "available during a task, no restart" requires directly.

**Back to standard (a simple confirmation)**
> Title: `Put every setting back to standard?`
> Body: `Text size, contrast, density and the other preferences all return to standard. You can change them again at any time.`
> Primary: `Confirm going back to standard`  Secondary: `Back, keep my settings`

**Turning assisted mode on (a detailed confirmation)**
> Title: `Turn on "Someone is helping me use this"?`
> Body: `Once on, the interface shows at all times who is using it. Every action the person helping you takes is recorded as theirs, not yours. Some things — agreeing to something, confirming your testimony, leaving the research — **can only be done by you**, and nobody can do them for you.`
> Primary: `Confirm turning assisted mode on`  Secondary: `Back, don't turn it on`

### Accessibility points

- The preview is sticky (`position: sticky`); at 200% zoom, if it occupies more than 40% of the screen, it degrades to a "Preview" button opening a dismissible preview panel.
- Each group of options is a `<fieldset>` + `<legend>`; single choices use radios and multiple choices use checkboxes (semantically correct here, because there is a definite "current value").
- After a change, `role="status"` announces: `Text size changed to "Larger".`
- **`Reduce motion` takes its default from the system**: if the system already has `prefers-reduced-motion` on, the checkbox is pre-ticked with the explanation attached (see the wireframe), and the system-level setting cannot be turned "off" here — it can only be additionally turned on where the system has not.
- Keyboard: no slider is used for text size — discrete radios are easier with a keyboard and a screen reader.
- Changing a setting on this screen **must not** lose focus: after changing the text size, focus stays on the radio just operated.

---

## B14 Public profile editing and preview

**Documents**: Doc 20 §131–133, §256 | **Status**: not implemented

### Purpose, and the questions this screen answers

1. What does "me" look like to people in matching and in the community?
2. For each piece of information, do I want it up there? (**opt-in per item, nothing by default**)
3. Who can see it once it is up, and what does it look like on a phone and on a computer?
4. Can I take it down?

**Hard rule**: the public profile and the participant profile (the research one) are **two different things**, the interface must say so, and they may not be merged (§354, "combining ParticipantProfile and PublicProfile").

### Wireframe (mobile)

```text
┌──────────────────────────────────────┐
│ h1  My public profile                 │
│ [ℹ] This is not the same thing as the  │
│     record the research team sees.     │
│     Nothing in the research record     │
│     appears here automatically, and    │
│     what you put here does not become  │
│     part of the research record.      │
│ Current state: [○] not switched on     │
│                                      │
│ h2  Choose what to put up              │
│ p Each is chosen separately. By default│
│   none of them is up.                 │
│ ┌──────────────────────────────────┐ │
│ │ [ ] What you would like to be      │ │
│ │     called                         │ │
│ │     [Zhou of the Balcony_________] │ │
│ │     p Please do not use your real   │ │
│ │       full name.                   │ │
│ ├──────────────────────────────────┤ │
│ │ [ ] A short introduction           │ │
│ ├──────────────────────────────────┤ │
│ │ [ ] Broad interests                │ │
│ ├──────────────────────────────────┤ │
│ │ [ ] Languages you use              │ │
│ ├──────────────────────────────────┤ │
│ │ [ ] Rough location (city level)    │ │
│ │     p No street or building is      │ │
│ │       shown.                       │ │
│ ├──────────────────────────────────┤ │
│ │ [ ] How you prefer to be contacted │ │
│ ├──────────────────────────────────┤ │
│ │ [ ] Some of the life stories I     │ │
│ │     confirmed                      │ │
│ │     [Choose…] p Only ones you have  │ │
│ │     confirmed as testimony and     │ │
│ │     whose visibility allows it.    │ │
│ └──────────────────────────────────┘ │
│ ┌ what cannot go up (explained) ────┐ │
│ │ [✗] Date of birth, contact details,│ │
│ │     address, health information,   │ │
│ │     research records               │ │
│ │     These never appear in a public │ │
│ │     profile.                       │ │
│ └───────────────────────────────────┘ │
│                                      │
│ h2  Preview                           │
│ [Phone] [Computer]  ← switch          │
│ ┌ what others see ──────────────────┐ │
│ │ Zhou of the Balcony               │ │
│ │ Interests: gardening, chess       │ │
│ │ Language: English                 │ │
│ └───────────────────────────────────┘ │
│ p People you have blocked cannot see    │
│   this profile, and will not see you    │
│   anywhere.                           │
│                                      │
│ [Switch my public profile on]         │
│ [Keep it for now, don't switch it on] │
└──────────────────────────────────────┘
```

### Information hierarchy and block order

1. `h1` + **the statement distinguishing it from the research record** (first)
2. The current state (on / off)
3. The per-item choices (all off by default)
4. **The fields that cannot go up, and why** (permanently visible, never hidden)
5. The preview (phone/computer switch)
6. Switch on / keep for now

### State matrix

| State | Presentation |
|---|---|
| Loading | `Reading your public profile…` |
| Empty (never created) | `You do not have a public profile. That is entirely fine — without one you can still take part in the research, write a life story, and write to people you are connected to. Only strangers in matching and the community use it.` |
| Empty (items ticked but nothing filled in) | In the preview: `There is nothing here, so others would see an empty profile. It is better to fill in at least one thing before switching it on.` |
| Error | Recoverable: `That was not saved. What you typed is still on this page.` + `Try again` |
| Not permitted (public profile consent missing) | `To create a public profile you first need to agree to "Public profile" under My consent choices.` |
| Protected existence | The preview shows **your** profile; there is no way in to "look at someone else's profile" (that belongs to the matching and community contexts and is bound by blocking and authorisation). |
| Switched off | `Your public profile is switched off. Others cannot see it, and your content is still here.` + `Switch it back on` |

### Key interactions and the confirmation copy

**Switching on (a detailed confirmation)**
> Title: `Switch your public profile on?`
> Body: `Once it is on, people who come across you in matching and in the community see what is in the preview above: how you are called, your interests, your language. Anything you did not tick does not appear. People you have blocked cannot see it. You can switch it off or change it at any time — but what people who already saw it remember is not something we can take back.`
> Primary: `Confirm switching my public profile on`  Secondary: `Back, not yet`

**Switching off (a simple confirmation)**
> `Switched off. Others can no longer see your public profile. What you filled in is still here and you can switch it back on at any time.`

**Adding a life story reference (a detailed confirmation)**
> Title: `Put "The lane in the old photograph" in your public profile?`
> Body: `This one's visibility is currently "my connections". Putting it in your public profile makes its visibility the same as the profile's — meaning everyone who can see your profile can see this piece. That is a raising of visibility, and it needs its own confirmation.`
> Primary: `Confirm adding it, and raising this piece's visibility`  Secondary: `Back, don't add it`

### Accessibility points

- Each field is a `<fieldset>`: a checkbox (whether to include it) plus an input (what to include); while unticked the input is `disabled` with `aria-describedby` explaining "tick it first to fill this in".
- The block of fields that cannot go up uses `role="note"`, not `alert`.
- The phone/computer preview switch is a `role="tablist"` (two tabs), and switching does not move focus.
- The preview content is marked `aria-label="what others see"`, and every button inside the preview is `disabled` or rendered as plain text — **nothing inside a preview may be pressable**, so it is never mistaken for the real profile.
- At 200% zoom, the "computer" preview becomes its own horizontally scrollable container (`overflow-x: auto`), and the page itself does not scroll horizontally.

---

## B15 Assessments (baseline / follow-up)

**Documents**: Doc 20 §106, §172, §250 | **Status**: **not built, two things are missing** (ruling D-17). First, `assessment.record` is `{}` — it carries no owner permission and is granted only to ResearchCoordinator, so **a participant cannot record their own assessment at all**; and the command does not check whose `enrolmentId` it is. Second, and more fundamentally: **there is no instrument bank on the platform**. Both `assessment_records.instrument` and `instrument_version` are free text, and no table holds items, options, scoring or versions. Building the screen would mean the implementer inventing the item content — and instrument items are approved research material, not interface copy that can be made up along the way. **The home page's "waiting for you" block therefore deliberately omits assessments too**: listing something the participant cannot do is pointing at a door they cannot open. **Unlock conditions**: (1) approved instrument content and a versioned item bank in the database; (2) a new owner-scoped `assessment.record-own`, with the resource's ownership derived from the participant on the enrolment and never accepted from the caller (the lesson of D-13)

### Purpose, and the questions this screen answers

1. What questionnaire is this, why is it being asked, and roughly how long is it?
2. Can I stop partway? Is what I have done wasted if I do?
3. Can I leave some questions unanswered? (yes, and it **does not count as missingness of unknown cause**)
4. What happens after I finish? Will somebody score me or draw conclusions?

**Hard rule**: nothing may imply any benefit or conclusion before analysis (§172, "avoids claiming benefit before analysis").

### Wireframe (mobile, one question at a time)

```text
┌──────────────────────────────────────┐
│ [← Save and leave]                    │
│ h1  Follow-up questionnaire           │
│ p Question 3 · of 12                  │← textual progress, no animated bar
│ ────────────────────────────────────  │
│                                      │
│ h2  In the last two weeks, how often   │
│     did you feel connected to other    │
│     people?                           │
│ p Choose the one closest to how it     │
│   felt. There is no right or wrong.   │
│                                      │
│ ( ) Almost never                      │
│ ( ) Occasionally                      │
│ ( ) About half the time               │
│ ( ) Most of the time                  │
│ ( ) Almost always                     │
│ ────────────────────────────────────  │
│ ( ) I would rather not answer this     │← §106 requires this explicitly
│                                      │
│ [Next question]                       │
│ [Previous question]                   │
│                                      │
│ ・[What does this question mean?]      │
│ ・[I want to pause and finish later]   │
│ p What you have answered is saved;      │
│   just come back and carry on.         │
│ p[role=status]                       │
└──────────────────────────────────────┘
```

**Before starting (the explanation screen)**

```text
┌──────────────────────────────────────┐
│ h1  Follow-up questionnaire           │
│ h2  What this is for                  │
│ p These questions are for seeing        │
│   whether things have changed overall  │
│   over this period. It is not a test   │
│   and not a health check — it gives    │
│   you no personal diagnosis or         │
│   assessment.                         │
│ h2  Roughly how long                   │
│ p About 10 minutes. You can stop at     │
│   any time and what you answered is    │
│   kept.                               │
│ h2  Who sees your answers               │
│ p The research team does. Other         │
│   participants do not. What is         │
│   published is aggregate numbers, and  │
│   never names anyone.                 │
│ h2  If you would rather not answer      │
│     something                         │
│ p Every question has "I would rather    │
│   not answer this". Choosing it is     │
│   entirely fine and affects nothing.   │
│ [Start]  [Not now, back to home]      │
└──────────────────────────────────────┘
```

### Information hierarchy and block order

The explanation screen (purpose / duration / who sees it / skippable) → one question at a time → the completion receipt.

**Inside each question**: the stem → one sentence on how to answer → the options (in a consistent direction, from "less" to "more") → **`I would rather not answer this` (separated by a rule, but visually equal in weight)** → navigation → help and pause.

**Scale direction discipline (§250)**: every question in one questionnaire must run in the same direction; reversing partway is not permitted. Option text must be complete (never bare numbers "1 2 3 4 5").

### State matrix

| State | Presentation |
|---|---|
| Loading | `Opening the questionnaire…`; anything already answered renders from the local draft first. |
| Empty | Not applicable (a questionnaire always has questions). If no assessment is due, the way in does not appear in B1/B8. |
| Error (saving one answer failed) | Recoverable but prominent: `That answer was not saved. What you chose is still on the screen. Try again?` + `Try again` + `Save and leave` (which attempts to submit the whole thing) |
| Error (submission failed) | Blocking: `The questionnaire was not submitted. Everything you answered is still here and nothing was lost. You can try again, or leave now and come back to submit it.` |
| Not permitted (assessment consent missing) | `This questionnaire needs you to agree to "Assessments" under My consent choices first.` |
| Protected existence | An assessment record belongs to its own participant; visiting someone else's assessment URL → the uniform page of 0.6. |
| Expired | `The window for this questionnaire has passed. This is not your fault — questionnaires in research have fixed time ranges. The research team will know this one was not collected.` **No blame.** |
| Left partway | Recorded as `Partially Completed` with a missingness reason of `Not Collected`; the interface copy: `Saved. You reached question 3, and can come back to it at any time.` |

### Key interactions and the confirmation copy

**"I would rather not answer this"** (no confirmation; it takes effect directly)
> Announcement: `Recorded: you chose not to answer this one. On to the next.`
> The backend mapping: this question's missingness reason = `Participant Declined` (**explicit**, never a silent empty value).

**Pause (a simple confirmation)**
> `Saved. You reached question 3 and can come back at any time. There is no time limit.`

**Submit (a detailed confirmation)**
> Title: `Submit this follow-up questionnaire?`
> Body: `You answered 10 questions and chose not to answer 2. After submitting, it cannot be changed.`
> Primary: `Submit this questionnaire`  Secondary: `Back, let me look again`

**The completion receipt**
> `We have your answers. Thank you. They are analysed together with other participants' answers, and we will not draw any personal conclusion about you from them. When the research ends, the overall results will be shared with every participant.`
> **Prohibited copy**: `Well done!` / `Your score is…` / `You are doing better than last time` / any celebratory animation.

### Accessibility points

- Each question is a `<fieldset>` + `<legend>` (the stem); the options are radios.
- Progress is text (`Question 3 · of 12`), placed after the `h1` and announced by `aria-live="polite"` on a change of question.
- After changing question, focus moves to the new `<legend>` (`tabindex="-1"`) rather than to the first option — hear the question before choosing.
- `I would rather not answer this` is a member of the same radio group (semantically correct as a mutually exclusive choice), separated from the main scale by a rule, and **must not** be smaller or fainter.
- There is no countdown. If the research design requires a time window, state the closing date in words on the explanation screen only, and never show a countdown while answering (§296).
- `Save and leave` is in the top left and reachable at any time; its touch target is ≥44px and well away from `Next question`.

---

## B16 Activities and interactions: prepare / complete / reflect

**Documents**: Doc 20 §169–171 | **Status**: not implemented

### Purpose, and the questions this screen answers

1. What is this interaction I am about to have, and what do I want out of it?
2. What would I like to talk about? (possibly bringing a piece of my own life story)
3. Did it happen? (**the platform does not judge that for me**)
4. How did it feel? Would I do it again? Do I need help?

**Hard rule (§170)**: the platform **must not** infer "the interaction happened" from "a message was sent". A completion state can only be recorded by the participant themselves.

### Wireframe (mobile, three stages)

**Preparing (§169)**

```text
┌──────────────────────────────────────┐
│ h1  Getting ready for a conversation   │
│ p All of this is optional. Going        │
│   straight to the conversation with     │
│   no preparation is entirely fine.     │
│ h2  What you would like from this       │
│ ( ) Just to talk                       │
│ ( ) To get to know someone new         │
│ ( ) To talk about something on my mind │
│ ( ) Not sure yet                       │
│ h2  What you might talk about           │
│ [interests, recent things, the past…]  │
│ h2  Whether to bring a piece of your    │
│     story                             │
│ ・[Choose a life story I confirmed]     │
│   p Once chosen, they can only see it   │
│     if you choose to share it during   │
│     the conversation. Choosing it      │
│     shares nothing by itself.          │
│ h2  How you will talk                   │
│ ( ) Messages ( ) A phone call           │
│ ( ) In person                          │
│ h2  What would make it easier            │
│ [ ] I would like them to speak slowly   │
│ [ ] I would prefer text, not voice      │
│ h2  Your limits                         │
│ p You can end the conversation, block    │
│   or report at any time. You do not     │
│   have to give a reason.               │
│ [Save this preparation]                │
│ [Go straight to the conversation]      │
└──────────────────────────────────────┘
```

**Recording completion (§170)**

```text
┌──────────────────────────────────────┐
│ h1  How did the last conversation go?  │
│ p Only you know what actually happened, │
│   so this one is yours to say. The     │
│   system does not judge it for you.    │
│ ( ) We talked                          │
│ ( ) I tried, but it did not happen     │
│ ( ) It did not happen                  │
│ ( ) I decided not to                   │
│ ( ) It was cut short partway           │
│ ( ) I need help                        │← selecting this reveals the help routes
│ [Record this]  [Later]                 │
└──────────────────────────────────────┘
```

**Reflecting (§171)**

```text
┌──────────────────────────────────────┐
│ h1  Would you like to say how it felt?  │
│     (optional)                        │
│ p Every question can be skipped.        │
│ ・Did this conversation actually happen? │
│ ・Did it mean something to you?          │
│ ・Did you feel they were listening?      │
│ ・Was it hard?                           │
│ ・Was there anything that made you       │
│   uncomfortable?                       │
│   [Yes] → shown immediately:            │
│   [Report] [Safety help]               │
│ ・Would you do it again?                 │
│ ・Do you need help right now?            │
│ h2  Anything else you would like to say  │
│     (optional)                        │
│ label What you would like to say        │
│ [                                   ]  │
│ [Submit my reflection] [Skip this]     │
└──────────────────────────────────────┘
```

### Information hierarchy and block order

Preparing (all optional) → the conversation itself (which happens off the platform or in messages) → recording completion (**recorded by the participant**) → reflecting (all skippable).

### State matrix

| State | Presentation |
|---|---|
| Loading | `Reading what is arranged for this activity…` |
| Empty (nothing arranged) | `There is no conversation arranged right now. You can write to anyone you are connected to at any time — that needs no arrangement.` |
| Error | Recoverable: `That was not saved. Everything you filled in is still here.` + `Try again` |
| Not permitted | `This part needs you to agree to "Intervention delivery" first.` + `Go to my consent choices` |
| Protected existence | If the other person is no longer reachable, the activity card becomes: `The arrangement for this conversation cannot go ahead. That is common and can happen for many reasons. You can record what actually happened, or simply skip it.` **Never attributed to the other person.** |
| Completion not recorded | The home page's task card: `You have a conversation whose outcome is not recorded yet` — neutral wording, and **no chasing, no red, no exclamation mark**. |

### Key interactions and the confirmation copy

**Recording completion (a simple confirmation)**
> `Recorded: we talked. Thank you for telling us.`
> After choosing `I need help`: `All right. Here are people you can go to.` + `Contact the research team` + `Safety help` + `Report a problem` (all three appearing immediately, with no second press needed)

**Choosing "something made me uncomfortable" in the reflection**
> Shown inline immediately (no dialog, no interruption of the form): `If you would like to say more about it, or would like staff to know, any of these are available. You can also do nothing at all, and that is entirely fine.` + `Report` + `Safety help` + `Contact the research team`

**Submitting a reflection**
> `We have it. This is read alongside other participants' feedback, to understand the overall picture.`

### Accessibility points

- The six completion options are one radio group, visually equal in weight — **`We talked` must not carry the Primary style** (that would steer towards reporting success).
- Each reflection question is its own `fieldset`, and every one has an equally weighted `Skip this question` option.
- The "uncomfortable" branch expands in place with `aria-live="polite"`, and focus does not jump.
- The life story picker on the preparation screen opens a dialog, and on return focus goes back to the `Choose a life story I confirmed` button.
- Every button is ≥44px; `Record this` and `Later` are ≥8px apart.

---

## B17 Reporting and blocking centre

**Documents**: Doc 20 §168 | **Status**: not implemented (currently scattered through B7's SafetyPanel)

### Purpose, and the questions this screen answers

1. Who have I blocked?
2. Which conversations have I muted?
3. What have I reported, and where does it stand?
4. What happens if I unblock someone?
5. What else can I do?

**The boundary**: moderation evidence and the details of moderation decisions **are not shown here** (§168, "Moderator evidence and confidential decisions remain protected"). A participant sees only what they themselves submitted and whether the platform received it.

### Wireframe (mobile)

```text
┌──────────────────────────────────────┐
│ h1  What I have blocked and reported   │
│                                      │
│ h2  People I have blocked (2)          │
│ ┌──────────────────────────────────┐ │
│ │ Mrs Zhang                         │ │
│ │ [🚫] Blocked · 2026-07-28         │ │
│ │ You will not appear in each        │ │
│ │ other's suggestions, cannot write  │ │
│ │ to each other, and cannot see each │ │
│ │ other's posts.                     │ │
│ │ [Unblock Mrs Zhang]               │ │
│ └──────────────────────────────────┘ │
│                                      │
│ h2  Conversations I have muted (1)     │
│ ┌──────────────────────────────────┐ │
│ │ Conversation with Mr Wang         │ │
│ │ [🔕] Muted                        │ │
│ │ The connection is still there and  │ │
│ │ you can still write to each other; │ │
│ │ there are simply no reminders. He  │ │
│ │ does not know you muted it.        │ │
│ │ [Unmute]                          │ │
│ └──────────────────────────────────┘ │
│                                      │
│ h2  Reports I have submitted (3)       │
│ ┌──────────────────────────────────┐ │
│ │ 2026-07-28 · Harassment           │ │
│ │ [✓] Received; staff will read it  │ │
│ │ What you wrote: "He keeps asking  │ │
│ │ me for my phone number"           │ │
│ │ ⓘ To protect everyone involved we  │ │
│ │   will not tell you the details of │ │
│ │   what happens next, and will not  │ │
│ │   tell them who reported it.       │ │
│ │ [See the receipt for this report]  │ │
│ └──────────────────────────────────┘ │
│                                      │
│ h2  What else I can do                 │
│ ・[Contact the research team]          │
│ ・[Safety help]                        │
│ ・[Pause or leave the research]        │
│ p[role=status]                       │
└──────────────────────────────────────┘
```

### Information hierarchy and block order

1. People I have blocked
2. Conversations I have muted
3. Reports I have submitted (with the statement that **details of the handling are not disclosed**)
4. What else I can do

**The report state vocabulary (two states only, honestly)**: `[✓] Received; staff will read it` / `[✓] Finished being handled`.
**Not shown**: `under review`, `confirmed as a breach`, `they have been penalised` — those would leak moderation decisions and could mislead while the outcome is undecided (§193 reporter protection, §168 decision confidentiality).

### State matrix

| State | Presentation |
|---|---|
| Loading | `Reading…` |
| Empty (all empty) | `You have not blocked anyone and have not submitted a report. This page is usually empty, and it is here when you need it.` + `Safety help` |
| Empty (one section) | That whole `h2` block does not render (no "nothing here" placeholder). |
| Error | Recoverable: `That could not be read. Your blocks and reports are all still there and are unaffected.` + `Try again` |
| Not permitted | Not applicable — like B7, this is always available. |
| Protected existence | It shows **only things you did yourself**. If someone in your block list has left the platform, the entry stays (it is your record), and no new state about them is shown. |

### Key interactions and the confirmation copy

**Unblocking (a detailed confirmation — this is an action that increases access)**
> Title: `Unblock Mrs Zhang?`
> Body:
> ```
> After unblocking:
> ・You may meet each other again in suggestions.
> ・But the connection and conversation you had do not come back automatically —
>   those would have to start again.
> ・A report you submitted earlier is unaffected, and staff will still handle it.
> ・We will not tell them that you unblocked them.
> ・You can block them again at any time.
> ```
> Primary: `Confirm unblocking`  Secondary: `Back, keep them blocked`

**Unmuting (a simple confirmation)**
> `Unmuted. You will get reminders when there are new messages in this conversation.`

**The report receipt (a read-only screen)**
> Contents: the time it was submitted, the type you chose, your own words, `[✓] Received; staff will read it`, `we will not tell them who reported it`, and `Contact the research team`.
> There is **no** "check the progress" route.

### Accessibility points

- Each of the three sections is a `<ul>`; each entry is an `<li>` with one primary button.
- Status badges are constructed per 0.8 (`[🚫] Blocked`, `[🔕] Muted`, `[✓] Received`).
- Section counts go into the `h2`.
- The unblock dialog: `aria-describedby` points at the five consequences.
- The report's own words are a `<blockquote>` and can be read aloud.

---

## B18 Pausing and leaving

**Documents**: Doc 20 §173–178 | **Status**: not implemented

### Purpose, and the questions this screen answers

1. I want a break — can I stop only part of it?
2. After stopping, what stops and what carries on?
3. What happens to data I already gave? (honestly: locked datasets are not rewritten)
4. How do I know it really stopped? (the receipt)
5. Can I come back later?

**Hard rule**: the way out is permanently visible in **four** places — the home page, My research, My consent choices, and Help and safety. Any design that hides the way out is an anti-pattern (§354).

### Wireframe (mobile, four steps)

**Step 1 — choosing the scope (§175)**

```text
┌──────────────────────────────────────┐
│ h1  Pausing or leaving                │
│ p You do not have to stop everything.  │
│   You can stop just part of it, or     │
│   simply pause for a while. You do not │
│   have to give any reason.            │
│                                      │
│ h2  Choose one first                   │
│ ( ) Pause for a while — you can resume │
│     it yourself later                 │
│ ( ) Stop certain parts permanently     │
│ ( ) Leave this research entirely       │
│                                      │
│ h2  Which parts (choose as many as     │
│     you like)                         │
│ [ ] Community                          │
│ [ ] Meeting new people (matching)      │
│ [ ] One particular connection          │
│ [ ] Messages                           │
│ [ ] Sharing my life story (the content │
│     stays)                            │
│ [ ] Supporter involvement              │
│ [ ] AI help                            │
│ [ ] What the AI remembers              │
│ [ ] Future questionnaires              │
│ [ ] Future contact                     │
│ [ ] Every research activity            │
│ [Carry on and see what would happen →] │
└──────────────────────────────────────┘
```

**Step 2 — the summary of consequences (§176)**

```text
┌──────────────────────────────────────┐
│ h1  What would happen                 │
│ p You chose: leave this research        │
│   entirely.                           │
│                                      │
│ h2  [✓] Stops immediately              │
│ ・No further activity is arranged for   │
│   you                                 │
│ ・No further questionnaires are sent    │
│ ・Your public profile is switched off   │
│ ・Your community posts are taken down   │
│                                      │
│ h2  [⏳] Takes a little time           │
│ ・Messages already queued will be        │
│   cancelled if possible               │
│ ・Cached content updates gradually      │
│                                      │
│ h2  [→] What carries on                │
│ ・Connections you made are disconnected,│
│   and the other person receives no     │
│   explanation                         │
│ ・Your own life story content stays in  │
│   your archive, unless you separately  │
│   ask for it to be deleted            │
│                                      │
│ h2  [!] What we cannot do              │
│ ・Research datasets that are already    │
│   locked will not be rewritten. That   │
│   is what the integrity of a research  │
│   record requires — locked data cannot │
│   be changed afterwards. Datasets       │
│   generated from now on will not       │
│   include your data.                  │
│ ・What people who already saw your       │
│   content remember.                    │
│ ・Records kept for governance and        │
│   audit (who did what and when), which │
│   do not hold your content itself.     │
│                                      │
│ h2  Your data, still your choice       │
│ ( ) Data already collected may continue │
│     to be used in this research        │
│ ( ) Please stop using my data in future │
│     analyses                          │
│ h2  Contacting you later                │
│ ( ) You may contact me with the results │
│ ( ) Do not contact me again            │
│ [Carry on →]                          │
└──────────────────────────────────────┘
```

**Step 3 — confirmation** (the copy is below)
**Step 4 — the receipt (§177)**

```text
┌──────────────────────────────────────┐
│ h1  Your leaving receipt              │
│ [✓] In effect · 2026-08-03 15:42      │
│ h2  What you stopped                   │
│ ・Left this research entirely           │
│ h2  What has been done                 │
│ ・Activity scheduling has stopped       │
│ ・Your public profile is switched off   │
│ ・Your community posts are taken down   │
│ h2  Still in progress                  │
│ ・[⏳] Queued messages are being         │
│   cancelled if possible               │
│ h2  What is kept                       │
│ ・Locked research datasets (not          │
│   rewritten)                          │
│ ・Governance records (without content)  │
│ h2  Afterwards                         │
│ ・You chose: you may contact me with     │
│   the results                         │
│ ・If you want to come back, just contact │
│   the research team.                   │
│ [Save this receipt]                   │
│ [Contact the research team]           │
└──────────────────────────────────────┘
```

### Information hierarchy and block order

Choose the scope → **the four classes of consequence** → the data and contact choices → confirmation → the receipt.

The four classes (immediate / takes time / carries on / cannot be done) are this screen's core structure, one level finer than §176 requires — because "what we cannot do" has to be kept apart from "what carries on": the first is a limit of capability and the second is a design choice.

### State matrix

| State | Presentation |
|---|---|
| Loading | `Working out what this would affect…`; **the confirm button is not shown until it is worked out**. |
| Empty | Not applicable. |
| Error (submission failed) | Blocking: `That was not submitted. You are still in the research and nothing has changed. If you want to stop right away, you can contact the research team directly and they can do it for you.` + `Try again` + `Contact the research team` |
| Error (partial success) | Listed honestly: `Part of it is in effect: the community has stopped. Part of it did not go through: matching has not stopped. You can try again, or contact the research team.` A vague "partly failed" is **not permitted**. |
| Not permitted | Not applicable — leaving is always available and is **not restricted by any suspension, moderation or safety state**. A hard rule. |
| Protected existence | The picker for "one particular connection" lists only your own connections. |
| Currently paused | At the top: `You are paused (since 2026-07-20).` + `Resume taking part` + `Change this to leaving permanently` |

### Key interactions and the confirmation copy

**Pausing (a detailed confirmation)**
> Title: `Pause your activity in this research?`
> Body: `While paused, no new activity is arranged for you and no questionnaires are sent. All your content is kept. You can resume yourself at any time — nobody's approval is needed.`
> Primary: `Confirm pausing`  Secondary: `Back, don't pause`

**Leaving entirely (a reinforced, step-up confirmation)**
> Title: `Leave this research entirely?`
> Body: `You will leave every activity in this research. Everything listed on the previous page will happen, including that datasets already locked will not be rewritten. Leaving needs no reason, and nobody will ask you why. If you want to come back later, just contact the research team.`
> The reinforcing step: `Type "leave the research" to confirm`
> Primary: `Confirm leaving this research`  Secondary: `Back, don't leave`
> Success announcement: `You have left. Your receipt is below.`

**Language discipline (§174, "Withdrawal language remains neutral")**:
- ✗ `Are you sure you want to go?` `Are you certain you want to give up?` `We will miss you` `Your contribution is valuable — will you reconsider?`
- ✓ `Confirm leaving this research` `Leaving needs no reason`
- **No** retention content may be inserted anywhere in the leaving flow, and the "Back" button must not be made a Primary.

### Accessibility points

- Step 1's "choose one first" is a radio group; "which parts" is checkboxes, in two different `fieldset`s.
- The four classes of consequence use four `h2`s + icon lists (`[✓]` `[⏳]` `[→]` `[!]`), with distinguishable icon shapes and text.
- The reinforced confirmation's field has a visible `<label>`; when the typed text does not match, the prompt does not accuse: `What you typed is different from the words above. Please type "leave the research" exactly.`
- The receipt can be saved (`Save this receipt`, download or print), and is a **screen you can return to on its own** (reachable from B2's consent receipt and from B8).
- Focus moves to each step's `h1` between the four steps.
- The leaving flow uses **no** timer, countdown or "last chance" pressure.

---

## B19 AI companion

**Documents**: Doc 20 §205–220 (see also §221 degraded states, §53, §179) | **Status**: not implemented (the M11 gateway exists; the 17 Level-5 actions in `PROHIBITED_AI_ACTIONS` are refused by name in the backend)

### Purpose, and the questions this screen answers

1. What is this — a person or a machine? (**it always says first: this is AI**)
2. What can it do for me right now? What can it **not** do?
3. Where does what it says come from? Can it be relied on?
4. What has it remembered about me? Can I make it forget?
5. When it cannot or will not do something, who do I go to?

### The architectural principle: there is no global chat box

**Doc 20 §205 states it explicitly: `A universal global chat is not the primary interface.`**
AI appears only at **defined contextual entry points**, each with a fixed role, a fixed set of available tools and a fixed context scope:

| Entry point | Role label | Can do | Can never do |
|---|---|---|---|
| B10 the life story editor | `Life story assistant` | help you start, transcribe, translate, tidy, suggest a title, say it more simply, propose details for you to confirm | confirm testimony (`confirm_participant_testimony` is prohibited) |
| B4 writing a message | `Message draft assistant` | change the tone, say it more clearly, translate | choose the recipient, change the communication basis, confirm sending (`send_message_unconfirmed` is prohibited) |
| B5 the match explanation | `Suggestion explainer` | explain this suggestion in plain words | decide for you, create a mutual acceptance, make a connection (all prohibited) |
| B6 a post draft | `Post draft assistant` | rewrite a draft | publish |
| B8 / the consent explanation | `Research explainer` | explain the research and the consent terms | consent or withdraw on your behalf (`grant_consent` / `withdraw_consent` prohibited) |
| B16 preparing and reflecting | `Conversation preparation assistant` | help you think of subjects, organise your thoughts | judge whether the interaction happened |
| Global navigation | `Navigation help` | tell you where a feature is | act for you |

There is **no** "AI companion" destination in the navigation. What exists is a "where AI can help" explanation page (listing the table above + memory controls + conversation history), reached from B13 or from help.

### Wireframe (mobile; the life story assistant inside B10 as the example)

```text
┌ AI panel (embedded, not a full-screen ┐
│  chat)                                │
│ ┌ role header (always the first line)┐ │
│ │ [🤖] Life story assistant · this   │ │
│ │      is AI, not a person           │ │
│ │ It can: help you start, transcribe,│ │
│ │ tidy up, suggest a title.          │ │
│ │ It cannot: confirm for you that    │ │
│ │ this is your story, and cannot     │ │
│ │ share it with anyone for you.      │ │
│ │ Whether it remembers: nothing from │ │
│ │ this is remembered, unless you     │ │
│ │ allow it under "What the AI        │ │
│ │ remembers".                        │ │
│ │ [Find a person to help →]          │ │
│ └───────────────────────────────────┘ │
│                                      │
│ [Help me start]                       │
│                                      │
│ ┌ response (§208's five parts) ─────┐ │
│ │ ① The answer                       │ │
│ │ "You could start with how the      │ │
│ │  bicycle first came to be there."  │ │
│ │                                    │ │
│ │ ② Where this came from             │ │
│ │ [Source] an AI suggestion (not     │ │
│ │        based on anything you have  │ │
│ │        written; general writing    │ │
│ │        advice)                     │ │
│ │                                    │ │
│ │ ③ How certain                      │ │
│ │ [◐] Needs your confirmation — this │ │
│ │     is only a suggestion, not a    │ │
│ │     statement about your life.     │ │
│ │                                    │ │
│ │ ④ What you can do next             │ │
│ │ ・[Use this opening] ・[Try another]│ │
│ │ ・[Don't use it]                    │ │
│ │                                    │ │
│ │ ⑤ [Find a person to help]          │ │
│ │                                    │ │
│ │ [See how it got there] ← collapsed │ │
│ │                          by default│ │
│ └───────────────────────────────────┘ │
│                                      │
│ p AI gets things wrong. Everything it   │
│   gives you only counts once you have  │
│   read it yourself.                   │
└──────────────────────────────────────┘
```

**When the AI proposes an action (§212–214)**

```text
┌ role=alertdialog ────────────────────┐
│ h3 The AI suggests doing this — it is  │
│    your decision                      │
│ [🤖] This is a suggestion from the AI; │
│      it has not been done.            │
│ What: save this text as a draft        │
│ On what: "My father's bicycle"         │
│ Who will see it: only you              │
│ Why it suggests it: you wrote something│
│   and have not saved it               │
│ What will happen: one more draft, which│
│   only you can see                    │
│ Can it be undone: yes, you can delete  │
│   the draft                           │
│ What of yours it uses: this passage    │
│ ────────────────────────────────────  │
│ [Save as a draft]   [No thanks]       │
│ p This confirmation applies to this     │
│   one suggestion only. If you change    │
│   the content it has to be confirmed    │
│   again.                              │
└──────────────────────────────────────┘
```

**After it is done (§214)**: what is shown is **the result the owning domain returned**, not what the model said.
```
[✓] Saved as a draft
    Saved by "Life story" · 2026-08-03 14:20
    [See this draft]
```

### Information hierarchy and block order (fixed for every AI panel)

1. **The role header** (this is AI / the current role / what it can do / what it cannot / whether it remembers / how to reach a person) — §206–207, **always first and never collapsible**
2. The available actions (few and specific, not a free text box)
3. The response (§208's five parts: the answer → the source → the uncertainty → what next → find a person)
4. Long reasoning collapsed behind `See how it got there`
5. The closing reminder: `AI gets things wrong`

**The source label vocabulary (§209)**: `approved research material` / `your preference settings` / `testimony you confirmed` / `your life story draft` / `information in this suggestion` / `community rules` / `retrieved material` / `the result of running a tool` / `an AI suggestion`.

**The uncertainty label vocabulary (§210)**: `grounded` / `partly grounded` / `needs your confirmation` / `a draft` / `needs human review` / `cannot be verified`. Constructed per 0.8 (icon + text + expandable).

### State matrix

| State | Presentation |
|---|---|
| Loading | `Thinking… (a few seconds)` + a `Stop waiting` button. No fake progress and no typewriter animation (still less under `reduced-motion`). |
| Empty (no history) | `You have not used the AI help here. Using it or not is up to you — everything works just as well without it.` |
| Error (AI unavailable, §221) | `The AI help is not available right now. This does not affect writing, saving or confirming things yourself.` + `Try again` + `Find a person to help` |
| Error (provider degraded, §223) | `The AI is slow or unsteady right now. What you wrote is unaffected.` |
| Error (knowledge degraded, §222) | `The research material cannot be reached right now, so it may not be able to answer questions about the research. You can ask the research team directly.` + `Contact the research team` |
| Not permitted (AI consent missing) | The AI panel does not render at all, and its place is taken by: `AI help needs you to agree to it under My consent choices first. Not agreeing is entirely fine — you can do everything yourself.` |
| Not permitted (AI suspended) | `AI help is suspended right now. Writing, saving and confirming things yourself are unaffected.` |
| Protected existence | The AI's context **never** contains a blocked person, another person's protected resource, or another person's private content. If the participant asks about someone else, the response is uniformly: `I cannot answer that, and I cannot confirm whether such a person exists.` (the same line as 0.6) |
| Needs human review (§216) | `[⏳] Somebody needs to look at this. It has gone to staff. There is nothing for you to do now, and you can cancel it.` + showing: what is being reviewed / roughly what path it takes / the current state / `Cancel this review` / `If it is urgent, contact the research team directly` |
| Refusal (§215) | See the copy below |

### Key interactions and the confirmation copy

**An AI refusal (§215)**
> `I cannot do that.`
> `Why: confirming whether a passage is your testimony can only be done by you. That is a rule, not a technical problem.`
> `You can: go and confirm this version yourself.` + `[Go and confirm]`
> `If you would rather talk to a person:` + `[Contact the research team]`
> Internal security detail must **not** be exposed (it does not say "the policy engine refused action=confirm_participant_testimony").

**An AI safety escalation (§217)**
> `It sounds as though things may be hard right now.`
> `If you or someone else is in danger, please call your local emergency number. This platform is not an emergency channel.`
> `Would you like me to tell the safety team about this? A person will look at it.` + `[Tell the safety team]` + `[Not for now]`
> After submitting: `The safety team has been told, and someone will look at it.` — it **never** says `this has been confirmed as a safety event` (a SafetySignal is not a SafetyEvent, §354).

**AI dependency safeguards (§218, a hard rule at the interface level)**
AI copy is **forbidden** to: express liking or love, imply exclusivity ("only I understand you"), show disappointment when you leave ("are you going? I will miss you"), discourage you from reaching people ("you can just tell me"), press you to say more ("go on, tell me more"), or use guilt ("you have not been here in a while").
AI copy **should** say things like: `This might be better said to a person. Would you like help thinking about how to start?` / `This is a fine place to stop. Stop whenever you like.`

**AI memory controls (§179, §220, its own screen)**

```text
┌──────────────────────────────────────┐
│ h1  What the AI remembers             │
│ p These are things the AI noted down to │
│   help you. They are separate from     │
│   your life story and your profile —   │
│   what it remembers is not your        │
│   testimony.                          │
│ ┌──────────────────────────────────┐ │
│ │ "Prefers text, not voice"         │ │
│ │ Where it came from: what you chose │ │
│ │   in your preferences             │ │
│ │ What it is used for: so it answers │ │
│ │   you in text by default          │ │
│ │ Which roles can use it: message    │ │
│ │   draft assistant, conversation    │ │
│ │   preparation assistant           │ │
│ │ When it expires: when the research │ │
│ │   ends                            │ │
│ │ Limits: not used for matching      │ │
│ │ [Change it] [Make it forget this]  │ │
│ └──────────────────────────────────┘ │
│ [Make it forget everything]           │
│ p There is nothing hidden here such as  │
│   a "personalisation score". What you   │
│   see is all of it.                   │
└──────────────────────────────────────┘
```

> **Make it forget this (a simple confirmation)**: `Forgotten. The AI will not use this again.`
> **Make it forget everything (a detailed confirmation)**: title `Make the AI forget everything it remembers?` body `The AI will no longer use any of this to help you, and may ask some things it has asked before. Your life story, your profile and the research data are unaffected — those are separate things.` Primary `Confirm forgetting everything`  Secondary `Back, keep them`

**How the Level-5 prohibitions appear in the interface**: the backend refuses 17 actions by name. The interface must not offer those paths at all, **before any suggestion appears**: there is simply no "consent for me", "confirm my testimony for me", "send for me", "make a connection for me" or "publish for me" button anywhere in an AI panel. If such an intent appears in a model's output, the interface presents it as a refusal (see the refusal copy above) and **must not** render it as a pressable suggestion.

### Accessibility points

- The role header is the first readable element in the panel, `role="note"`, not collapsible and not dismissible.
- The AI generation area is `aria-live="polite"` with `aria-busy="true"`, and does not announce intermediate fragments — **it announces once, on completion** (so a screen reader is not interrupted word by word).
- The first announced sentence is fixed: `The AI has responded.` (so the user knows at once that this is AI output and not a person)
- `See how it got there` is a `<details>`, collapsed by default, and does not affect the main flow's focus.
- The AI suggestion dialog: `role="alertdialog"`, with `aria-describedby` pointing at the "what will happen" and "can it be undone" paragraphs.
- The AI draft text box is directly editable; after editing, the `[🤖] AI draft` label is **kept** (with `· you changed it` appended) and does not disappear because it was edited.
- Refusals and degraded states use `role="status"` rather than `alert` (they are not emergencies); a safety escalation uses `role="alert"`.

---

## Appendix A: B1–B7, the gap between what is implemented and the target design

What the markings mean: **[name]** = changes an accessible name or visible text and therefore **affects the front-end tests directly**, so the tests change with it; **[structure]** = changes only a role, level or order, leaving the tests unaffected (verified: no `getByRole('heading')` query in the suite); **[new]** = a new element, affecting no existing assertion.

> **Rechecked 2026-08-16.** This appendix was written when the suite held 34 front-end tests; it now holds **375 across 47 files**, and every string it quotes has been English since D-9. The accessible names below are given in their English form, and the authoritative list is the test files themselves — a list restated into a document drifts from the code, which is the lesson D-51 records.

### B1 Home (`App.tsx`)

| # | Currently | Target | Impact |
|---|---|---|---|
| A1.1 | only five navigation buttons, with no "current step in the research" | add a "where you are in the research" block | [new] |
| A1.2 | ~~no due assessments, no drafts, no social action awaiting a decision~~ | **Partly implemented**: a "waiting for you" block was added to the home page. It lists one kind only, because that is the only kind that both genuinely exists and the participant can genuinely act on: content a supporter has proposed for their life story — `life-story.review-contribution` is `ownerOnly`, so only the participant can accept or decline it, and until now no query listed pending contributions at all, meaning somebody could write into your story without your ever knowing. **Accepting asks "which part does it go on"**: a supporter writing from their own workspace cannot see the participant's story and so cannot say where it belongs; **declining needs no location at all** — previously both accepting and declining required an itemId, so a contribution of this kind could be neither accepted nor declined and would sit in the list forever (now fixed). When the participant has not written anything yet it says honestly that there is nowhere to put it, and they can still say no. **Assessments are not included**: `assessment.record` carries no owner permission and a participant cannot complete one, so listing it would point at a door they cannot open. **Drafts and pending social actions are not included**: the former is local state, and there is no social action yet awaiting a participant's decision | done, to the extent it could be done honestly |
| A1.3 | ~~no way to "pause or leave"~~ | **Partly implemented**: the home page permanently carries "where you are in the research" + "leave this research" (leaving has always been owner-permitted in the backend; participants simply could not reach it). **Pausing is not implemented**: `Paused` is a legal state with no command able to enter it, and a button for it would be a control that does nothing | done, to the extent it could be done honestly |
| A1.4 | no "My research", "My life story" or "Settings" navigation items | expand the navigation to nine | [new] |
| A1.5 | ~~no expectation-setting sentence after `h1 What would you like to do today?`~~ | **Implemented, shortened 2026-08-22 (D-100)**: `Anything that needs a decision from you is below, and when it is done, it is done.` Was: `Anything that needs a decision from you is below. When those are done, they are done — nothing here keeps going on its own.` The anti-feed statement is said out loud rather than implied by the layout | done |
| A1.6 | ~~the task list is a flat `<ul>` of five buttons~~ | **Implemented, grouped differently from the original idea**: three `h2` groups — "your information and who can see it" / "things you can do any time" / "help and safety". "Waiting for you" no longer needs a group of its own — it is already two named blocks on the home page, "waiting for you" (A1.2) and "where you are in the research" (A1.3). **Regrouped around privacy**: as each unreachable right gained a way in, the list grew from 5 entries to 8, and eight unlabelled buttons are a wall rather than a choice; whereas consent (what may be done with my information), who can access me (by whom) and asking for a copy (what I can take away) together answer exactly one question — "who can see my things" — which is a real cluster rather than tidying | done. **Superseded by D-100 (2026-08-22, owner's instruction).** Grouping answered the wall by naming its parts; it did not reduce what was on screen, and all eight stayed visible. Measured on an enrolled participant with one contribution waiting: **191 words and 11 controls**, with the two buttons that wanted an answer third and fourth among eight that wanted nothing. The three groups are now `<details>`, closed on arrival, and what is waiting comes first — 113 words and 3 controls, most of the remaining words being the task itself. The privacy cluster's reasoning is unchanged and the three stay together inside one disclosure. Nothing was removed: every destination is still reachable by name, asserted separately, because folding that loses a right is not a tidier page but a smaller promise |
| A1.7 | the navigation is a row at the top | bottom on mobile, a left column on desktop | [structure] |

**Note**: the copy of the five existing buttons is **unchanged**, and they move into the "things you can do any time" group.

### B2 My consent choices (`ConsentPanel.tsx`)

| # | Currently | Target | Impact |
|---|---|---|---|
| A2.1 | ~~the screen's main heading is an `h2`~~ | **Implemented**: it is now `h1 My consent choices`, with each scope's title an `h2` beneath it | done |
| A2.2 | only four consent scopes | expand to §97's 22, in "required" and "optional" groups across five thematic subgroups | [new] (six today — every one the platform actually gates on; putting the other 16 on screen before each has a permission gating it would be a false assurance, see D-2) |
| A2.3 | one sentence of description per item | expand to §98's eight elements (why we ask / what information / who can see it / whether it is required / the three consequences / how to change it / current state) | [new] |
| A2.4 | ~~**no permanent current state**~~ | **Implemented**: the current state is permanently visible and read from the server (`consent_current`, the same projection table the permission engine uses), with the time of the decision and the consent text version it rests on; operation results go only into `role="status"`, and the `aria-live="off"` element has been removed | **[name]** — done |
| A2.5 | no "agree with conditions" | add `Agree with conditions…` + the restriction dialog | [new] |
| A2.6 | no comprehension check (§99) | add | [new] |
| A2.7 | no pre-submission confirmation summary (§100) | add `Submit my consent choices` | [new] |
| A2.8 | no consent receipt (§101) and no re-consent (§102) | add the receipt as its own screen | [new] |
| A2.9 | the withdrawal dialog states one consequence | expand to four (including "this is not the same as leaving the research") | [name] (the `wd-{scope}` paragraph's text changes; a test matching on text needs updating) |

**Accessible names that must not change** (the tests depend on them directly): `Agree to "…"`, `Decline "…"`, `Withdraw consent for "…"`, `Confirm withdrawing "…"`, `Back, don't withdraw`. The target design keeps all five patterns.

### B3 Messages: the conversation list (`MessagesScreen.tsx`)

| # | Currently | Target | Impact |
|---|---|---|---|
| A3.1 | ~~loads only on a press~~ | **Implemented**: loads on entry with a loading state; the button became `Refresh my conversations and connections` | done |
| A3.2 | ~~the conversation button's name exposed the internal participantId~~ | **Implemented**: it now shows the permitted public identity, resolved through `otherDisplayName` (D-12); when a name cannot be resolved it shows the uniform placeholder and never falls back to an ID | done |
| A3.3 | ~~no CommunicationBasis statement~~ | **Implemented**: each row shows `Why you can write to each other: …`, with wording for each of the four bases (ActiveConnection / AuthorisedRelationship / InterventionSession / ModeratedCommunity) | done |
| A3.4 | ~~the connection row rendered the internal ID~~ | **Implemented** with A3.2 — the public identity plus a status badge | done |
| A3.5 | ~~no read-only presentation for a lapsed basis~~ | **Implemented**: a conversation that is not Active says on the list row itself that it can no longer be written to, and repeats it inside the conversation as a `role=note`; nobody now opens it, writes, and only then gets refused | done |
| A3.6 | no way through to the reporting and blocking centre | add | [new] |
| A3.7 | the empty state is one sentence | expand to §226's four elements | [name] (the empty-state text changes) |

**Kept**: the `Start a conversation` button's name is unchanged.

### B4 Messages: the conversation (`MessagePanel.tsx`)

| # | Currently | Target | Impact |
|---|---|---|---|
| A4.1 | `h2 Write a message` is the screen's main heading; the recipient's `displayName` was really the participantId | `h1 Conversation with {them}`, with `Write a message` demoted to `h2`. The display name half is **done** (D-12) | **[name]** — the heading level change remains |
| A4.2 | ~~history loads only on a press~~ | **Implemented**: loads on entry; the button became `Refresh message history` | done |
| A4.3 | ~~no CommunicationBasis shown~~ | **Implemented**: the top of the conversation states why you may write, and states the reason when you may not | done |
| A4.4 | the send confirmation had only the recipient, version and content | **Partly implemented**: the communication basis and "confirmed is not delivered" have been added (confirming only hands it to the delivery service; unknown stays unknown and never becomes delivered). Attachments and scan state are **not** added — this implementation has no attachments, and writing a line about them would claim a check that does not exist | done, to the extent it could be done honestly |
| A4.5 | ~~no scam or link warning~~ | **Implemented**: appears inline when a draft contains an external link (not a dialog — it is a prompt, not a decision), the copy passes no judgement on the other person, and the footnote says "this is only a reminder". Three actions rather than five: `Not now` (**which does not clear the draft** — a reassuring option must not be destructive), `Change the message`, and `Get help, block or report` (which really navigates to Help and safety, where blocking and reporting live) | done |
| A4.6 | no retry for a failure or unknown (§162) | add `Send it again` + the duplicate-delivery warning | [new] |
| A4.7 | no `Report this message` / `Block {them}` beside a message | permanently present beside each of their messages | [new] |
| A4.8 | the draft state appears once in a `notice` | make it a persistent sticky label, `Draft — only you can see this` | [new] |

**Kept**: the `Message` label, `Save draft`, `Check and send`, `Send the message`, the edit-invalidates-confirmation copy, `Current state:`, `<ol aria-label="Messages">`, and all of `DELIVERY_STATE_LABELS`.

### B5 Meeting new people (`MatchingPanel.tsx`)

| # | Currently | Target | Impact |
|---|---|---|---|
| A5.1 | the screen's main heading is `h2 Meet new people (optional)` | make it `h1` | [structure] — **still open** (verified 2026-08-16) |
| A5.2 | turning matching on, seeing suggestions and making a connection are **all on one screen** | split into four stage screens (introduction / the review before turning it on / candidates / mutual acceptance and connection) | [structure] + **[name]** (`matching-panel.test.tsx` depends on `Make a connection` appearing on the same screen) |
| A5.3 | no introduction screen (§143) and no `suggestion ≠ mutual interest ≠ connection` diagram | add | [new] |
| A5.4 | the `Turn matching on` button takes effect directly, with no §145 review | add the review screen + a detailed confirmation | [new] (the `Turn matching on` name is kept, moving to the review screen) |
| A5.5 | the candidate card has only the explanation and the three decisions | add the expiry time, `See the full explanation` (§149), `Block` and `Report` | [new] |
| A5.6 | no MatchExplanation detail (source / timing / uncertainty / policy version / prohibited use) | add | [new] |
| A5.7 | the "Interested" confirmation says only that the other person is not notified | expand to §151's five points | [name] (the dialog text changes; the `Confirm` button's name should become `Confirm "Interested"`) **[name]** |
| A5.8 | mutual acceptance has only "exists / does not exist" and lives in memory | five states (being checked / valid / expired / lapsed / already used), read from the server | [new] |
| A5.9 | there is no empty-state block for candidates (only an announcement) | add §154's empty state | [name] (the sentence moves from the status region into a block) |
| A5.10 | the three decision buttons are already equal in weight ✅ | keep, and add the checkable rule that all three computed styles must be identical | — |

**Kept**: `See current suggestions`, `Interested`, `Make a connection`, `Confirm making a connection`, `You both expressed interest`, the matching-is-off-by-default sentence, and the gardening explanation string.
**A rename proposed (a trade-off)**: the generic `Confirm` → `Confirm "Interested"` (§324 forbids a vague label). This breaks `getByRole('button', {name: 'Confirm'})`.

### B6 Community (`CommunityPanel.tsx`)

| # | Currently | Target | Impact |
|---|---|---|---|
| A6.1 | the screen's main heading is `h2 Community (optional)` | make it `h1` | [structure] — **still open** (verified 2026-08-16) |
| A6.2 | ~~a post's author was rendered as the internal participantId~~ | **Implemented**: it now shows `authorDisplayName`, with `You` for your own posts (D-12) | done |
| A6.3 | feed cards have no `Report` / `Block` | permanently on every card (§136 requires it) | [new] |
| A6.4 | no "stop taking part in this community" (§141) | add | [new] |
| A6.5 | no "report community content" flow (§142) | add the five-step flow, **started from the post card with no identifier typed** | [new] — the reporting main path from a post landed with D-24 |
| A6.6 | "My drafts" is at the bottom of the community list page, separated from the community it belongs to | keep it on the list page (an overview across communities) and also show that community's drafts inside it | [new] |
| A6.7 | the writing area comes after the feed | move it **before** the feed (offer the chance to write before reading, so it is not a consumption feed) | [structure] |
| A6.8 | no "withdraw a published post" | add `Withdraw this post` | [new] |
| A6.9 | no community rule version badge (it appears once, in the join dialog) | permanently on the community card and inside it: `rules v3` + `See this version of the rules` | [new] |
| A6.10 | the publish confirmation has no "after publishing" consequences | add them | [name] (the dialog text changes) |

**Kept**: `Read the rules and join`, `Agree to the rules and join`, `Enter "…"`, `Publish…`, `Confirm publishing`, `Draft — only you can see this`, the "what you would like to share" label, the "posts appear newest first" sentence, and all of `POST_STATE_LABELS`.

### B7 Help and safety (`SafetyPanel.tsx` + the App's help screen)

| # | Currently | Target | Impact |
|---|---|---|---|
| A7.1 | **reporting requires typing `The other person's identifier`; blocking requires typing `Identifier of the person to block`** | move both to starting from context (a conversation / a post / a candidate card), with this screen only routing | **[name]** — `getByLabelText` on both fields, `Block this person` and `Submit report` are all affected. **This is the most important entry in this list**; see Appendix B deviation #1. **Still open** (verified 2026-08-16: both fields are still in `SafetyPanel.tsx`). D-24 added the main path from a post; the free-text fields remain as the fallback |
| A7.2 | the emergency statement is in the middle of the App's help screen (inside a `<p>`) | move it to the very top as its own permanent `role="note"` block | [structure] (the "this platform is not an emergency channel" text is kept) |
| A7.3 | `SafetyPanel`'s main heading is `h2 Blocking and reporting` | split it: Help and safety (B7) keeps the routes and safety concerns; the block and report records move into B17 | [structure] — **still open** |
| A7.4 | the block confirmation is one sentence | expand to §166–167's seven effects + a `Report this person as well` checkbox | [name] (the `block-confirm-heading` text changes; `Confirm block` and `Back, don't block` keep their names) |
| A7.5 | the safety concern textarea uses `aria-label="Your safety concern"` with no visible label | make it a visible `<label>What you are worried about (in your own words)</label>` | **[name]** — **still open** (verified 2026-08-16) |
| A7.6 | no "contact the research team" route | add, after the emergency statement | [new] |
| A7.7 | no FAQ, accessibility statement or pause/leave routes | add | [new] |
| A7.8 | the report receipt is one sentence | expand to not predicting the outcome + the reporter-protection statement | [name] |
| A7.9 | a failed safety concern goes through the generic error path | handle it at the safety-critical level (keep the content + the emergency number reminder + contact the team) | [new] |

**Kept**: `Submit safety concern`, `Confirm block`, `Back, don't block`, the "a report is read by staff and never decided by an automated system alone" sentence, the "even if you block them afterwards, the report is still handled" sentence, and "this platform is not an emergency channel".

### The changes that alter accessible names, collected (tests change with them)

| Change | Test files affected | Suggested handling |
|---|---|---|
| A2.4 the permanent consent status badge replacing the `aria-live="off"` paragraph | `consent-panel.test.tsx` | assert on the badge text — **done** |
| A3.1 removing the manual load (loading on entry) | `messages-screen.test.tsx` | wait for the list — **done** |
| A3.2 / A3.4 / A6.2 internal ID → public identity | `messages-screen.test.tsx`, `community-panel.test.tsx` | the mock data gained `displayName`; assertions use the display name — **done** |
| A4.2 removing the manual history load | `message-panel.test.tsx` | wait for the `Messages` list — **done** |
| A5.2 splitting matching into four stages | `matching-panel.test.tsx` | the test drives it stage by stage — open |
| A5.7 `Confirm` → `Confirm "Interested"` | `matching-panel.test.tsx` | rename directly (**needs a product decision**, see Appendix C open item #6) — open |
| A7.1 removing the identifier fields, starting blocking and reporting from context | `safety-panel.test.tsx` | the test drives it from a conversation or post context — open |
| A7.5 the visible label on the safety concern field | `safety-panel.test.tsx` | change the `getByLabelText` argument — open |

Changes that **do not alter an accessible name** (A1.*, A5.1, A6.1, A6.7, A7.2 and the rest) can land first without blocking the tests. Suggested order: do every [structure] and [new] change first, then handle the [name] ones in one pass.

---

## Appendix B: substantive deviations between the implementation and Doc 20

In order of severity. My judgement is that #1–#3 **must be fixed**; #4–#8 are specification gaps.

> **Rechecked 2026-08-16.** Four of the eight have since been closed by later rulings; each says so inline, with the ruling that closed it named. They are kept rather than deleted, because what closed them is part of the record.

### Deviation #1 (serious, security): free identifier fields for blocking and reporting are an existence-probing channel, contrary to ADR-050

**Status: still open** (verified 2026-08-16). `SafetyPanel.tsx` still has two free-text fields: `The other person's identifier` (reporting) and `Identifier of the person to block` (blocking), with different feedback on success and failure.

That constitutes an enumerable probing interface: any participant can type guessed identifiers repeatedly and infer from the difference in feedback **whether an identifier exists on the platform**. ADR-050 requires protected resources to answer `DenyAndHideExistence → 404` uniformly; the backend does that, and the front end reopens the door — because the backend cannot distinguish "a participant blocking someone who does not exist" (which should be a 404) from "a participant blocking someone who exists but is unrelated to them" (which may succeed).

**Doc 20 §27 is explicit**: `The interface must not explain that one person has blocked another unless policy permits disclosure.` §153 is explicit: `The interface does not disclose whether the other person was notified.` The current implementation violates neither directly, but the field itself leaks something more basic — existence.

**The direction of the fix** (written into the B7/B17/B6/B5/B4 designs): blocking and reporting **can only be started from existing context** (a conversation, a post, a candidate card, a connection), with the target supplied by that context and no identifier typed by the participant. B7 keeps only the routes plus "a report not about specific content" (which points at nobody and is free text + an optional category).

**Progress**: D-24 added the main path — a report can now point at a post, with the reported person derived from the post's author and the caller's value ignored. What remains is retiring the two free-text fields.

**Note**: this is not only a UI problem — if the backend's `POST /blocks` accepts an arbitrary `targetActorId`, the API is still a probing surface even after the UI changes. It is worth assessing at the same time whether the backend should require a shared context before permitting a block or report (which is beyond the design agent's scope and is recorded as Appendix C open item #1).

### Deviation #2 (serious, privacy + terminology): the interface rendered internal participant identifiers as people's identities

**Status: RESOLVED (D-12, 2026-08-05).** `MessagesScreen` and `CommunityPanel` used to render `otherParticipantId` and `authorParticipantId` directly as display names. All three M18 queries now resolve `display_name` through a batch port (`findDisplayNames`, so a feed does not make 100 single lookups), and where a name cannot be resolved the uniform placeholder `A community member` is shown and **it never falls back to an ID**. Relationship conversations return `null` from the module and are resolved at the composition root through M01's account names (D-30), because the other side of one of those is an account rather than a participant.

The original reasoning is kept because the cost D-12 records is still live: PublicProfile (B14) is not implemented, so **every outward-facing name today comes from the research-side record**, and a participant cannot choose per §132 how they are addressed. The community page says so out loud.

### Deviation #3 (moderate, principle): matching's three stages are crowded onto one screen, contrary to "one meaningful decision at a time"

**Status: still open.** `MatchingPanel.tsx` offers all of the following inside one `<section>`: turning matching on (high impact — it starts your data being used for suggestions), deciding on a candidate (high impact) and making a connection (high impact). DESIGN_BRIEF §2 states that no screen may place two high-impact decisions side by side.

It also lacks §143's introduction and §145's pre-activation review — a participant can press `Turn matching on` **without knowing which of their information is used, who can see it, or when it expires**, which directly violates "explain before asking".

**The direction of the fix**: four screens (see B5).

### Deviation #4 (moderate): the consent screen has no "current state"

**Status: RESOLVED (A2.4).** `ConsentPanel` now reads the current consent state from the server on entry (`consent_current`, the same projection the permission engine uses) and shows it permanently, with the decision time and the consent text version. The secondary problem is gone too: the `<p aria-live="off">Status: …</p>` element, which rendered an operation result as text that looked like persistent state, has been removed, and results go only into `role="status"`.

### Deviation #5 (moderate): there are only a few consent scopes where §97 asks for 22

**Status: partly addressed, and deliberately so (D-2).** There were four; there are now six — `study-participation`, `community-participation`, `open-matching`, `participant-messaging`, `supporter-involvement`, `supporter-contribution` — and those six are exactly the scopes that appear in `packages/policy/src/catalogue.ts` as the `consentScopes` precondition of some action. The two added were the two that decide what a supporter can see and do.

The remaining 16 stay off deliberately: `consent_current.consent_scope` has no CHECK constraint, so any string can be written, and adding switches that no check will ever read would be a promise of protection the platform does not offer. The consequence is real and should be stated: the "not permitted" states of B9–B12 (life story), B14 (public profile), B15 (assessments) and B19 (AI) cannot cite a consent scope that does not exist yet. **Unlock condition**: each remaining scope first gates some action in the permission catalogue.

### Deviation #6 (moderate): screen heading levels are inconsistent

**Status: partly resolved.** `MessagesScreen` and `ConsentPanel` now use `h1` as the screen's main heading. `MatchingPanel`, `CommunityPanel` and `SafetyPanel` still use `h2` (verified 2026-08-16), while the App's home and help screens use `h1`. The result is that heading levels are still unstable within one application, and "navigate by heading" behaves inconsistently for a screen reader user (a concern ACCESSIBILITY_TEST_PLAN tracks).

### Deviation #7 (minor): lists used to require a button press before loading

**Status: mostly resolved.** `MessagesScreen`, `MessagePanel`, `ConsentPanel`, `CommunityPanel` and `SafetyPanel` all load on entry now, with the buttons becoming explicit refreshes. `MatchingPanel` still requires a press (verified 2026-08-16), so two patterns still coexist in one application.

Doc 20 §224–226 assumes "content on entry, or an explicit loading or empty state". A manual load button adds a meaningless press and makes "empty" indistinguishable from "not pressed yet".

### Deviation #8 (minor): no empty-state design and no error grading

**Status: partly resolved.** D-44 gave 15 error codes their own four-part copy (what happened / what was preserved / what did not happen / what to do next), and D-51 fixed the wording table's own defect (a sentence written for a code the platform does not have, and none for the code that actually occurs). What is still missing is the general component specification: five grades of severity per §232, a technical code shown only as an optional detail per §231, and empty states as persistent blocks on the screen rather than a sentence in an announcement that disappears on refresh.

**Note**: these belong to UI_INVENTORY I11/I13; this file gives the specific copy in each screen's state matrix, and the unified component specification belongs in the design system deliverable.

### What was done right and should not be lost in a refactor

- The honest wording of `DELIVERY_STATE_LABELS`'s seven states, especially `The sending service accepted it (they have not received it yet)` and `Delivery state unknown — being checked; this does not mean success` — the part of the whole implementation that best matches Doc 20 §50/§161.
- Matching's three decisions are visually equal in weight, and `Interested` was never made a Primary.
- The announcement after a matching decision: they are not notified, and only if they also express interest…
- Joining a community is bound to the exact rule version, shown in full.
- A community draft is marked `Draft — only you can see this`, and publishing requires an explicit confirmation naming the community.
- `POST_STATE_LABELS` distinguishes "visibility restricted" from "removed" and does not conflate either with "deleted".
- Editing a message invalidates its confirmation (the `edited` check).
- The statement that reporting and blocking are independent: even if you block them afterwards, the report is still handled.
- `AccessTokenGate` states the environment problem and the identity problem separately, which is correct error attribution.
- The CSS comment recording the "44px buttons dropped into 29px row boxes and pressing into one another" fix, and the `main li > button { display:block }` rule.

---

## Appendix C: open items needing a product decision

I do not decide these unilaterally. Each gives the options and my inclination, and the product or research team decides.

### C1 (blocks B7/B17, security): should the backend require a "shared context" before permitting a block or report?

Even with the front end starting from context, `POST /blocks` and `POST /reports` can still be called directly with an arbitrary `targetActorId`.
- Option A: the backend requires a shared context between the target and the caller (a conversation, a candidate, a post in a shared community), and 404s otherwise.
- Option B: leave it as it is and constrain only the front end (the API remains a probing surface).
- Option C: permit a block with no context, but return an identical response for every outcome (success and non-existence indistinguishable).
**My inclination**: A combined with C. But "I know this person offline and want to block them in advance" is a real need and A would shut it out — the product has to judge that scenario's priority. *(D-4 ruled the free-initiation path is kept, so the question narrows to whether C alone is sufficient.)*

### C2 (blocks B3/B6/B14): what is shown when a PublicProfile is absent?

A participant may make a connection or post before having a PublicProfile.
- Option A: require a PublicProfile before entering matching or the community.
- Option B: show a neutral placeholder (`A community member`).
- Option C: show a system-generated neutral pseudonym (`Member A`, `Gardener 3`).
**My inclination**: B (before matching) + A (required before entering matching). C risks the pseudonym being used as an identity. **Never** fall back to a participantId.
*(D-12 ruled: show `participants.display_name` with `A community member` as the placeholder and never an ID. That is a third answer — it uses the research-side name because PublicProfile does not exist, and it says so on screen. The question stays open for when B14 is built.)*

### C3 (blocks B2): all 22 consent scopes at once, or in batches?

§97's full list on one screen is a heavy cognitive load even when grouped.
- Option A: present all of them at once (complete, and heavy).
- Option B: batch by research stage (what is required at enrolment plus the core; ask the optional ones when a feature is first used).
- Option C: present all of them, with the optional ones collapsed by default into group summaries.
**My inclination**: C. But whether B ("just-in-time consent") is ethically acceptable is a question for research ethics — particularly whether "deciding about consent at the moment you are attracted by a feature" constitutes undue influence.
*(D-2 ruled A: all at once, no batching by feature, for exactly that reason. What is on screen today is the six the platform enforces.)*

### C4 (affects B5): the expiry periods for MutualAcceptance and for candidates

The design says "candidates expire after 14 days" and "mutual acceptance lapses after 14 days"; those are placeholders. The real values should come from C10 (the matching policy configuration). A researcher must define them, and they **must be stated to the participant on the §145 review screen**.

### C5 (affects B4/B19): is the AI message draft assistant enabled in this phase?

The M11 gateway exists, but a message draft assistant introduces the research-validity question of how much of what a participant sends is their own (a Doc 19 concern).
- Option A: not enabled in this phase; AI appears only in the life story and in navigation help.
- Option B: enabled, but every AI-assisted message also shows the **recipient** a `[🤖] they used AI to help write this` label.
- Option C: enabled, with the label shown only to the sender.
**My inclination**: A, for this phase. If B is chosen, a new product decision is needed: whether disclosing AI involvement to the recipient contaminates the very human interaction the intervention is studying.
*(D-14 ruled A — not for now — and recorded that if it is ever enabled, the disclosure question has to be answered first.)*

### C6 (affects the tests): should `Confirm` be renamed to `Confirm "Interested"`?

§324 forbids a vague label where the consequences are significant. The matching decision's confirmation button is currently called `Confirm`. Renaming breaks one assertion in `matching-panel.test.tsx`.
**My inclination**: rename. But since the tests are a behavioural contract, the cost of changing them has to be acceptable.

### C7 (affects B13 and the whole app): how is "who is using this" obtained in assisted mode?

B13's assisted mode requires the interface to show "Nurse Li is using this now" and to record actions as the assistant's. Identity is currently the dev-header stub with no notion of two identities (actor + on-behalf-of). This needs M01 and permission-side support and is not purely a design question.
*(D-15 ruled a different answer: **read-only assistance**. The assistant never acts for the participant, so no second identity is introduced and "who did what" in the record is the participant throughout — which was already true. What is added is honesty about who is present, with the assistant's name held on the device only. The question's premise has also expired: identity is no longer the dev-header stub — the deployed environment runs Sign in with Google (ADR-104). That changes nothing about this ruling, because D-15's answer never depended on the stub; it is recorded so the question is not re-opened on a fact that is no longer true.)*

### C8 (affects B12/B18): the exact scope of "governance records are kept" after a participant asks for deletion

The copy says "who did what and when is kept, without the content itself". That boundary has to match the actual audit and retention policy, or the copy is dishonest. Governance has to give the exact scope before the copy can be finalised. *(ADR-120 has no settled value.)*

### C9 (affects B15): is `I would rather not answer this` available on every instrument?

§106 says `Prefer not to answer where permitted`. Which instruments allow it and which do not (it may affect the validity of a scale's scoring) has to be defined per instrument by a researcher. The design assumes it is allowed everywhere and that needs confirming.

### C10 (affects B1 and the whole app): where the home page's task cards get their data, and when they refresh

"Waiting for you" needs to aggregate four sources: due assessments, life story drafts, pending mutual acceptances and new messages. There is no such aggregating endpoint. Is it a new `GET /participants/:id/home-tasks`, or four concurrent requests from the front end? The latter makes the home page jump about in blocks on a slow connection. This needs agreeing with the backend.

### C11 (still open in Doc 20 §363, and not mine to decide either)

- §363-5 `how to explain a MutualAcceptance expiring or lapsing without blame` — B5 uses `Something changed, and this can no longer be used. It is nobody's fault.`, which is a design assumption and **unverified**.
- §363-6 `how to present Provider Accepted and Delivery Unknown` — I judge the existing implementation's wording to be the best available, but it is equally unverified with participants.
- §363-2 `which audience labels are least ambiguous` — B11's five scope labels (only you / people I choose / my connections / a community / public on the platform) are my proposal and need usability verification.

Under Doc 19's epistemic discipline all three are to be marked **design assumptions**, and must not be written into any report as verified conclusions.

---

## Change log

| Version | Date | Contents |
|---|---|---|
| v1.0 | 2026-08-03 | First version: all 19 items B1–B19; Appendix A (the B1–B7 gap and its accessible-name impact), Appendix B (8 substantive deviations), Appendix C (11 open items). |
| v1.1 | 2026-08-16 | Converted to English. Every status claim rechecked against the code rather than translated on trust: Appendix B deviations #2 and #4 closed (D-12, A2.4), #5 and #7 partly closed, #1 confirmed still open with the two free-text fields still in `SafetyPanel.tsx`; Appendix A's "34 front-end tests" corrected to 375 across 47 files; the accessible-name lists restated in English with the test files named as the authority; B19's Level-5 count corrected from 18 to 17 against `PROHIBITED_AI_ACTIONS`; the Appendix C items later settled by a ruling now name it. Two stray tool-call fragments at the end of the file were removed. |
