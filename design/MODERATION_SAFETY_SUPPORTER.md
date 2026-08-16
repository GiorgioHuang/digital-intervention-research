# Moderation / Safety / Supporter / public surface design specification

> Covers UI_INVENTORY's **D1–D6 (supporter, 6), E1–E6 (moderation, 6), F1–F6 (safety, 6) and H1–H5 (public and invitation, 5)** — **23 interface units** in total.
> Source of specification: Doc 20 v1.3 §18–20, §22, §27, §38–40, §92–93, §127–129, §180–204, §224–246, §265–267, §280–282, §285–307, §310–320; DESIGN_BRIEF; THREAT_MODEL; ACCESSIBILITY_TEST_PLAN.
> Phase framing (ADR-061/062): all synthetic data, simulated providers, and the **dev-header identity stub**. The interfaces described here must present that honestly and **must not imply that ethics approval has been obtained, that real authentication exists, or that real participants are being reached**.
> This file defines only the D/E/F/H groups. The design system foundation (A1–A9) and the cross-screen shared components (I1–I18) are defined in separately delivered files; this file only **consumes** their tokens and components, and the consumption list is in §1.7.

> **On the copy blocks in this file.** The literal copy quoted throughout is a
> **statement of intent**, not the authoritative wording. Under D-9 the English
> strings in the code are the current source of truth for what a screen says,
> and the specification and the implementation are a known, accepted
> divergence. This file was written in Chinese and has been translated to
> English; translating a copy block **does not** make it the implemented
> string. Where the two differ, the code wins, and the difference is a fact
> about the product to be checked — not a licence to edit either one to match
> the other.

---

## Contents

- §1 Shared conventions (read first)
- §2 D. Supporter workspace (D1–D6)
- §3 E. Moderation workspace (E1–E6)
- §4 F. Safety workspace (F1–F6)
- §5 H. Public and invitation surfaces (H1–H5)
- §6 Reporter protection: a checkable checklist
- §7 Evidence minimisation: checkable rules
- §8 The list of changes to the existing implementation, and their effect on tests
- §9 Design trade-offs (decided, with reasons)
- §10 Open items (needing a product / ethics / legal decision)

---

## §1 Shared conventions (read first)

### 1.1 The division of tone between the three workspaces

| Workspace | Tone (Doc 20 §280–282) | Density level (§315) | Never appears |
|---|---|---|---|
| Supporter | Plain, second person, explicit that **you are not this person** | The participant's spacious level, `--space-scale-spacious` | "on their behalf", "your records", "your story" |
| Moderation | Evidence-based, non-inflammatory, proportionate, pointing at the rule, open to appeal and review | Standard, `--space-scale-standard` | "malicious user", "repeat offender", "the reporter says" |
| Safety | Calm, direct, non-diagnostic, minimal, oriented to action | Standard (not dense: on a safety screen, what matters more than speed is not getting it wrong) | "crisis" or "emergency" for an unconfirmed signal; diagnostic words ("depression", "suicidal") |

### 1.2 The five states, defined once (used by every state matrix in this file)

| Code | Meaning | HTTP | Presentation rule |
|---|---|---|---|
| **LOADING** | The request is in progress | — | The text state `Loading…`, with `role="status"` + `aria-busy="true"`. **Skeleton screens are forbidden for queues, decisions, dispositions, approvals, deliveries and locking** (§225) — a skeleton makes "not read yet" look like "already empty" |
| **EMPTY** | The request succeeded, the result is 0, and this is a normal state | 200 | Must answer the four questions (§226): why is it empty / is this normal / what can you do / where can you get help. An empty queue **must not** use congratulatory wording ("Great, all done!") — that rewards clearing the queue rather than disposing of things correctly |
| **ERROR** | The request failed | 5xx / network | State what happened, whether any input was lost, what did **not** happen, whether it is safe to retry, and how to get help; the technical code folds away as optional detail (§231) |
| **FORBIDDEN** | The identity is known; the role does not hold this permission | 403 | Say plainly "your role cannot do this" + this is not an error + who can + how to request it. **Must not** simultaneously imply whether the object exists |
| **PROTECTED** | Protected existence (DenyAndHideExistence) | 404 | Always the same generic copy, "This content cannot be shown." **Must not** distinguish "does not exist" from "you are not allowed to see it", and must never use wording usable for enumeration such as "has been deleted", "has been blocked" or "no such user" (§27, ADR-050) |

> **FORBIDDEN and PROTECTED must be two entirely different pieces of copy, and neither may leak the other's information.**
> The test: give the same URL to two different roles, and if the two pages between them let you conclude "this object exists", that is a design defect.

**The generic copy in full (ready to land):**

```
LOADING    Loading…
EMPTY      (see each screen)
ERROR      This request could not be completed. What you typed is still here and has not been submitted. You can try again; if it keeps failing, contact research support (see "Help").
           [show technical details]  Error code: {code} | Request time: {ts}
FORBIDDEN  Your current role cannot carry out this action. Nothing has gone wrong.
           This action is the responsibility of {role name}. If you believe you should have this permission, request it through "Help".
PROTECTED  This content cannot be shown.
           If you arrived here from a link, the link may no longer be valid. Go back a level and carry on with your work.
```

### 1.3 Choosing a confirmation pattern (§240–246)

| Tier | Used for | Component |
|---|---|---|
| Simple confirmation | Reversible, low impact (saving a draft, withdrawing your own submission) | `<dialog role="alertdialog">`, one sentence + two buttons of equal weight |
| Detailed confirmation | High impact, open to appeal (a moderation decision, closing a signal, suspending a feature) | A structured confirmation body of seven lines: **object / effect / duration / what the other person will see / appeal route / reversibility / audit** |
| Step-up (MFA) | Converting to a safety event, banning, restoring access | Detailed confirmation + a notice of the authentication strength required; **state the strength required while the action is still visible, never let it fail only on submission** |
| Two-person approval | Out of scope for this file (it belongs to the researcher workspace) | — |

**Non-negotiable confirmation rules:**

1. One dialog confirms one thing (DESIGN_BRIEF §2).
2. "Confirm" and "Go back" carry **equal visual weight**; colour and size must not be used to steer (no dark patterns).
3. **Zero network requests** before the confirmation dialog appears (the existing component tests assert this behaviour and it must be kept).
4. The confirm button of a destructive or immutable action **must name the action**: `Confirm and record the decision`, never just `Confirm`.
5. **A statement of immutability must appear on the same screen as the appeal route** — saying it cannot be changed while offering no way out is a design defect.

### 1.4 Badges and state presentation (colour must not be the only indicator; §56, §311–312)

Every state badge = **an icon + a text label + (optionally) colour**, where the text label carries the meaning on its own.

| Badge | Text | Icon meaning | Token |
|---|---|---|---|
| Safety signal (unconfirmed) | `Signal · unconfirmed` | Hollow circle | `--color-safety-signal` |
| Safety event (confirmed) | `Safety event · confirmed` | Solid square | `--color-safety-event` |
| Moderation case | `Case · {state}` | Document | `--color-moderation` |
| AI / automated source | `Signal raised automatically (not confirmed by a person)` | Square brackets | `--color-ai` |
| Immutable record | `Written to the audit trail · cannot be changed` | Lock | `--color-text-muted` |
| Permission expiry | `Permission valid until {date}` | Clock | `--color-info` |

> **Signal and event must not be distinguished by colour alone**: shape (hollow/solid) + words (unconfirmed/confirmed) + separation (different `<section>` elements, each with its own heading and count) give three redundant channels.

### 1.5 Wireframe notation

```
[Button]      Primary/secondary button (written side by side where they carry equal weight)
( )           Radio    [ ] Checkbox (never pre-selected)
▸ / ▾         Collapsed / expanded (collapsed by default = an explicit action is needed to retrieve it)
⚑             An action requiring MFA
🔒            Cannot be changed once written
─────         A block separator
«…»           A placeholder for system-generated text
```

The mobile baseline breakpoint is 360px; every wireframe is expressed as a **single column**, with desktop adding only a column-width constraint (`max-width: 44rem`) and an optional two-column queue/detail split. **The order of the information does not change at any breakpoint** (§305).

### 1.6 The common full-screen structure (shared by the D/E/F workspaces)

```
┌────────────────────────────────┐
│ [Skip to main content]         │  skip-link
├────────────────────────────────┤
│ Context banner (I1)            │  ← see 1.6.1
├────────────────────────────────┤
│ <nav aria-label="… navigation">│  the current item carries aria-current="page"
├────────────────────────────────┤
│ <main id="main">               │
│   <h1> screen name             │
│   …content…                    │
│ </main>                        │
├────────────────────────────────┤
│ <p role="status" aria-live>    │  the announcement region (permanent; takes no visual space when empty)
└────────────────────────────────┘
```

#### 1.6.1 The context banner (present on every screen, not collapsible)

```
┌────────────────────────────────┐
│ Conceptual research prototype · synthetic data      │
│ Identity comes from a development-environment       │
│ header. This is not real authentication.            │
│ Currently: {actorId} ({password/MFA} tier)          │
└────────────────────────────────┘
```

The reason: THREAT_MODEL §6.1, "no real authentication", is an **inherent high risk**. The banner is the only place that can go on telling an operator "what you are doing right now carries no authentication behind it", and it must not be collapsed for the sake of appearance or shown only on the sign-in screen.

### 1.7 What this file consumes from the design system (A1–A9 / the I series)

This file depends on the tokens and components below; where the foundation names something differently, the foundation wins and this file is corrected to match:

- Colour: `--color-surface-{base,raised,sunken}`, `--color-text-{default,muted,inverse}`, `--color-border-{default,strong}`, `--color-action-{primary,secondary}`, `--color-focus`, `--color-{info,success,warning,danger}`, `--color-safety-{signal,event}`, `--color-moderation`, `--color-ai`, `--color-disabled`
- Spacing: `--space-scale-{dense,standard,spacious}` and `--space-{1..8}`
- Typography: `--type-{body,label,heading-{1,2,3},mono}`, `--type-measure` (a measure of ≤ 70 characters)
- Focus: `--focus-width`, `--focus-offset`, `--focus-color`
- Shape: `--radius-{sm,md}`, `--border-width-{default,strong}`
- Components: I3 protected-existence presentation, I4 state badges, I10 delivery states, I11 loading/empty, I13 error grading, I15 the confirmation pattern family, I18 notification boundaries

---

## §2 D. Supporter workspace (D1–D6)

> The first principle running through this whole group (Doc 20 §18, §128, §182): **a supporter is not the person themselves.** What a supporter submits is a "contribution", and once the person accepts it, it remains **the supporter's contribution** — it never becomes **the person's own testimony**. The interface wording must make that distinction impossible to misread, and not by way of a footnote but through the fields themselves.

### D1 Supporter home

**Purpose / the questions this screen answers**

- What am I currently authorised to do, and what can I not do? (visible permissions)
- Is there anything waiting for me? (invitations, help the person has asked for)
- Who has the things I submitted, right now?
- Where do I go when something goes wrong?

**Wireframe (mobile first)**

```
Conceptual research prototype · synthetic data
Identity comes from a development-environment header, not real authentication
────────────────────────────────
<h1>Supporter home</h1>

You are here to help «Mrs Lin».
Whether anything is taken up is hers to decide.
You cannot decide for her, and you cannot speak for her.

── Waiting for you ────────────
▸ 1 invitation awaiting your answer
  [View the invitation]
▸ She has asked for your help preparing 1 activity
  [View the request]

── What you can currently do ──
Relationship: family member (confirmed by her)
Purpose: helping add to a life story
Can access: the "childhood" scope of the life-story archive
Can do: submit contributions (not edit, not publish)
Permission valid until 2026-12-31
Limits: you cannot see the content of her existing entries
              [See the full permissions]

── The contributions you submitted ──
3 in total · 1 awaiting her review
              [See my contributions]

── If you need help ───────────
[Report a problem]   [Help and contacts]
```

**State matrix**

| State | Presentation and copy in full |
|---|---|
| LOADING | `Loading…` (each block loads separately, and the permissions block loads **first**; while the permissions are unknown, no submittable action may be rendered) |
| EMPTY | With nothing waiting: `There is nothing for you to deal with right now. That is normal — helping goes at her pace, and you do not need to go looking for something to do. You can look at your permissions or the contributions you have submitted at any time.` |
| ERROR | The generic ERROR copy; when the permissions block alone fails: `Your permissions cannot be read at the moment. Until they can, the way to submit stays closed — this is so you do not submit something that turns out not to be allowed. [Try again]` |
| FORBIDDEN | `Your role cannot open the supporter home. Nothing has gone wrong. If you think this is a mistake, contact research support through "Help".` |
| PROTECTED | The generic PROTECTED copy (this is also the path taken when the person being supported has revoked the relationship or has left the study — it **must not** say "she has revoked your permissions"; see D6 and §6) |

**Key interactions and confirmation copy**

- The home screen **carries no submitting action at all**; it only routes. The reason: one meaningful decision at a time.
- "See the full permissions" is navigation, not a dialog — permissions are there to be read, not to be confirmed away.

**Accessibility points**

- The paragraph stating the identity and the boundary comes immediately after the `<h1>`, so a screen reader hears "whether anything is taken up is hers to decide" on the first screen.
- Each block is a `<section aria-labelledby>`; the number waiting goes into the heading — `Waiting for you (1)` — rather than existing only as a visual badge.
- Action buttons in list items are block-level and clickable across the full row (the existing `main li > button` rule in styles.css), with touch targets ≥44px and ≥8px between rows so they never overlap.
- The spacious density level; a measure of ≤70 characters; a single column at 200% zoom with no horizontal scrolling.

---

### D2 Invitations and permission review (visible permissions)

**Implementation status (2026-08-04): partially implemented.** "The people you support" is built: a supporter can read the granted relationships they have been written into (`relationship.view-own`, always fetched using the actor in the request context and **accepting no identifier parameter** — there is nothing that could be used to point at somebody else's relationship), showing for each one the other person's name, the relationship's state, and **what this relationship allows** (dotted action keys never reach the screen; they are rendered in plain words). Previously a supporter had no way to know whom they supported or what they were authorised to do, while the contribution form required an archive identifier that could only be learned from outside the system — so the whole path was unusable to anyone who had not been handed an internal id. Where a contribution goes is now answered by `life-story.contribute`, the permission that **already governs contributing** (if you can contribute, you can find out where to), and when the other person has no life story yet the screen says honestly that there is nothing to add to, rather than presenting an empty form.

**Two things deliberately not done**: (1) **the other person's consent status is not reported** — consent belongs to the participant, and showing it to a supporter would let them infer something the participant had not chosen to tell them; the interface says only "what you can actually do also depends on their consent choices, which are theirs and are not shown here". (2) **Blocks are not shown** — when a participant blocks somebody, that person is not notified (B7 already states this), so the relationship still displays as Active while the operation is refused; this is deliberate, and the wording avoids presenting a relationship state as "you will definitely be able to do this".

**Not yet implemented**: accepting and declining an invitation is still only on the participant's side (UI_INVENTORY B20); and a supporter withdrawing themselves has no command.

**目标 / 要回答的问题**

- Who invited me, and what for?
- What will I get, what will I not get, and until when?
- May I decline? What happens if I do?
- Who can take it back afterwards? (the answer must be: she can at any time, and I can withdraw myself)

**Wireframe**

```
<h1>Invitation to help</h1>

«Mrs Lin» has invited you to be her supporter.
She can change or withdraw this at any time.

── What this invitation covers ──
Relationship type: family member
Purpose: helping add the childhood part of a life story
You can access: the life-story archive · the "childhood" scope only
You can:
  · submit suggested content (submitted for her to review)
  · withdraw your own suggestions before she has reviewed them
You cannot:
  · see the content of her existing entries
  · edit or delete her content
  · publish anything on her behalf
  · see her messages, matches, assessments or research data
Valid until: 2026-12-31 (it ends automatically)
Her current consent: supporter contributions allowed (she can withdraw this at any time)

── Your answer ────────────────
[Accept this invitation]      [Decline]
Both choices are equally valid. Declining notifies nobody
but her, and does not affect the record of your relationship.
```

**State matrix**

| State | Presentation and copy in full |
|---|---|
| LOADING | `Loading the invitation…` (the buttons **must not** be rendered before the content: explain first, ask second. The answer buttons stay `disabled` until the permission list has rendered, and say `The invitation is still loading; you can answer once it has.`) |
| EMPTY | `You have no invitations awaiting an answer. That is normal. If somebody invites you to help, it will appear here.` |
| ERROR | The generic ERROR copy + `Your answer was not submitted, and the invitation is still valid.` |
| FORBIDDEN | The generic FORBIDDEN copy |
| PROTECTED | The generic PROTECTED copy. **An invitation withdrawn by the person, one that has expired, and one that never existed are presented identically** |

**Confirmation copy in full**

Accepting:

```
Accept this invitation to help?
· You will get: submitting suggested content to the "childhood" scope
· You will not get: seeing, editing or publishing her content
· Valid: until 2026-12-31, ending automatically
· She can withdraw it at any time; you can withdraw at any time too
· Accepting is written to the audit record  🔒
[Confirm and accept]        [Go back]
```

Declining:

```
Decline this invitation?
· You will get no access at all
· She will see that you did not accept, but not why
· You can still be invited again later
[Confirm and decline]        [Go back]
```

**Accessibility points**

- The "you can" and "you cannot" lists are both `<ul>` and of **comparable length** — the limits must not be compressed into one line of small text (§314 forbids tiny secondary labels).
- `role="alertdialog"` + `aria-labelledby` pointing at the confirmation title; focus lands on the title when it opens and returns to the triggering button when it closes.
- The two answer buttons match in DOM order and visual order, with the same width and weight; **giving "accept" the primary colour while "decline" is a text link is forbidden**.

---

### D3 Submitting a Life Story contribution

**Purpose / the questions it answers**

- Which piece of content am I adding to?
- How do I know this? (provenance before assertion)
- What happens after I submit? (the answer: it goes to her and no further — it is not published and does not become testimony)
- Can I still change it after submitting?

**Wireframe**

```
<h1>Submit a contribution</h1>

What you add goes to «Mrs Lin» first, and she decides whether to take it up.
Submitting publishes nothing, and does not make it her testimony.

── Which piece you are adding to ──
( ) Add to an existing entry: «The summer of 1958»
( ) Suggest a new entry
(The scopes offered come from what she granted you; they cannot be widened.)

── What you want to add ───────
┌────────────────────────────┐
│                            │
└────────────────────────────┘
Only you can see a draft until you submit it.

── How you know this ──────────
( ) I was there myself
( ) She told me
( ) Another family member passed it on
( ) From a document, photograph or letter
( ) I am not sure
(Required. She will see this when she reviews it.)

Attribution: submitted in your name («Mr Wang»)
      —— a contribution always carries your name, and never moves to hers

[Submit for her to review]      [Save draft]
```

**State matrix**

| State | Presentation and copy in full |
|---|---|
| LOADING | While the scope options load, the submit button is `disabled`: `Reading the scopes you have been granted…` |
| EMPTY | With no scope available: `There is nothing you can add to at the moment. That may be because she has not granted access to a specific entry, or because the grant has expired. You can look at your permissions, or wait for her to send a new invitation. [See my permissions]` |
| ERROR | `This could not be submitted. What you wrote is still here and has not been sent. You can try again; if it keeps failing, contact research support from "Help".` |
| FORBIDDEN | `Your role cannot submit life-story contributions. Nothing has gone wrong.` |
| PROTECTED | The generic PROTECTED copy. **The current implementation explains a 404 as "this requires the participant to have approved your relationship and consented to supporter contributions" — that is a design defect: it leaks the person's consent status to the supporter.** It must be changed to the generic copy; see §8 |

**确认文案原文**

```
Submit this addition for «Mrs Lin» to review?
· Who receives it: only her (and research support staff where necessary)
· What will happen: she will see your content, the source you chose, and your name
· What will not happen: it will not be published, and it will not become her testimony
· After submitting: you can withdraw it until she starts reviewing
· This submission is written to the record  🔒
[Confirm and submit]        [Go back and keep editing]
```

**Accessibility points**

- The radio group uses `<fieldset><legend>` with **nothing pre-selected** (the existing convention, matching ConsentPanel).
- The textarea has a visible `<label>`, not an `aria-label`; any character limit must be visible and referenced in `aria-describedby`.
- The result is announced through the existing `role="status" aria-live="polite"` region: `Submitted, waiting for her to review it.`

---

### D4 My contributions and their status (accepted ≠ testimony)

**Purpose / the questions it answers**

- What state is each thing I submitted in?
- What does "accepted" actually mean?
- What can I still do? (withdraw / resubmit)

**Wireframe**

```
<h1>My contributions</h1>

Anything accepted keeps your name on it and is stored as **your contribution**.
It does not become her testimony — only she can confirm testimony.

── 3 items ────────────────────
┌────────────────────────────┐
│ «That summer she was at the mill…»  │
│ State: accepted              │
│ Is this the person's testimony: no  │
│ Attributed to: Mr Wang (family member) │
│ Your source: she told me     │
│ Accepted: 2026-07-11         │
│ 🔒 written to the record, cannot be changed │
└────────────────────────────┘
┌────────────────────────────┐
│ «About grandmother's yard…»  │
│ State: submitted, waiting for her to review │
│ Is this the person's testimony: no  │
│         [Withdraw this submission]  │
└────────────────────────────┘
┌────────────────────────────┐
│ «…»                        │
│ State: not accepted          │
│ Is this the person's testimony: no  │
│ Not being accepted does not mean    │
│ there is anything wrong with it —   │
│ she may simply have chosen not to   │
│ include it.                  │
└────────────────────────────┘
```

**A key design judgement: `Is this the person's testimony: no` is a field of its own, present on every card, including the accepted ones.**
The current implementation tucks that sentence into a parenthesis on the status label (`accepted (recorded as your contribution, not the person's testimony)`) — a parenthesis is a typographic signal that can be skipped over. A field is not.

**状态矩阵**

| 状态 | 呈现与文案原文 |
|---|---|
| LOADING | `Loading your contributions…` |
| EMPTY | `You have not submitted any contributions yet. That is normal. When she invites you to add to something, the record of what you submitted will appear here. [Find out what I can add to]` |
| ERROR | The generic ERROR copy; the list keeps the last successful result, marked `What follows may not be up to date (last updated: {ts})` |
| FORBIDDEN | The generic FORBIDDEN copy |
| PROTECTED | Where visibility of a single item has been revoked, that whole item is replaced with `This content cannot be shown.`, **giving no reason**, while the remaining items display normally |

**Confirmation copy in full (withdrawing)**

```
Withdraw this submission?
· She will no longer see it
· What you wrote is kept as a draft, and you can revise it and submit it again
· If she has already started reviewing, withdrawing may no longer take effect — you will be told if so
[Confirm and withdraw]        [Go back]
```

**Accessibility points**

- The cards are a `<ul><li>`, and inside each card is a **definition list** `<dl>` (field name / value), so a screen reader reads out "is this the person's testimony: no" field by field.
- The state is both words and a badge; a block of colour alone is not allowed.
- The withdraw button is block-level and full width, with ≥8px between it and the rest of the card.

---

### D5 Supporting a shared activity

**Purpose / the questions it answers**

- What has she asked me to help with?
- Will the help I give be recorded, and who can see it?
- What may I help with, and what must she do herself?

**Wireframe**

```
<h1>Helping with an activity</h1>

What she has asked for your help with is listed below.
Any step that is hers to decide has to be done by her —
you can help her operate things, but you cannot decide for her.

── She has asked for your help with ──
┌────────────────────────────┐
│ Preparing a video call (Thursday 15:00) │
│ You can help with: setting up the device, │
│           making the text bigger, checking the connection │
│ Must be her: whether to take part, what to say │
│         [Record that I helped]        │
└────────────────────────────┘

── About records of help ──────
If you record that you helped, that record is kept as
"how it was carried out" data for the research, and she
can see it. The record contains only: the kind of help,
when, and who gave it.
It does not contain anything you talked about.
```

**State matrix**

| State | Presentation and copy in full |
|---|---|
| LOADING | `Loading requests for help…` |
| EMPTY | `She has not asked for your help with any activity at the moment. That is normal — whether help is needed is hers to decide.` |
| ERROR | The generic ERROR copy + `The record of help was not saved. You can record it later; the time will be the one you enter.` |
| FORBIDDEN | `Your current permissions do not include helping with activities. Nothing has gone wrong. If she wants you to help with activities, she needs to add that to what she has granted you.` |
| PROTECTED | The generic PROTECTED copy |

**Confirmation copy in full**

```
Record that you gave help with "setting up the device"?
· What is recorded: the kind of help, when, and your name
· What is not recorded: anything specific you talked about or did
· Who can see it: her and the research team
· Why: the research needs to know what help an activity was carried out with
· Once written this record cannot be changed; if it is wrong, contact research support to correct it  🔒
[Confirm and record]        [Go back]
```

**无障碍要点**

- 「你可以帮」/「必须她本人」两栏在移动端垂直堆叠且各有小标题，不用表格布局。
- 记录确认后播报：`已记录你的协助。`

---

### D6 报告关切 / 访问被撤销状态

> 这是两个必须共存于一处、但**绝不能互相解释**的界面：报告是支持者主动发起的；访问被撤销是本人的决定，其原因**不得**向支持者披露。

**目标 / 要回答的问题**

- 我担心的这件事，属于哪一类？该走哪条路？
- 紧急情况我该去哪？（答案：不是这里）
- 我的访问没有了，我现在能做什么？

**D6-a 报告一个问题 · 线框**

```
<h1>Report a problem</h1>

Choose the type first; different types take different routes.

( ) A problem with the system or with using it (it will not open, a button does nothing)
    → handled by research support, usually a reply within 2 working days
( ) A privacy concern (I saw something I should not have)
    → research support + the privacy lead
( ) Somebody is harassing or approaching people inappropriately
    → looked at by a person on the moderation team
( ) I am worried about her safety
    → looked at by a person on the safety team
( ) Something else

── What happened (in your own words) ──
┌────────────────────────────┐
└────────────────────────────┘

⚠ This platform is not an emergency service.
If somebody is in danger, call your local emergency
number directly; nothing here happens immediately.
Research support hours: weekdays 09:00–17:00.

[Submit]
```

**D6-b access revoked · wireframe**

```
<h1>Your access has ended</h1>

Your access to things relating to «Mrs Lin»
ended on 2026-08-01.

This may be because the grant expired, was changed, or
because the research arrangements changed.
The specific reason is not shown here.

What you already submitted is unaffected;
whether it stays is hers to decide.

[Back to home]      [Help and contacts]
```

**State matrix**

| State | Presentation and copy in full |
|---|---|
| LOADING | `Loading…` |
| EMPTY | With no report history: `You have not submitted any reports. That is normal.` |
| ERROR | The generic ERROR copy + `Your report was not submitted. What you wrote is still here — please try again. If this is a safety emergency, do not wait here; follow the emergency note above.` |
| FORBIDDEN | The generic FORBIDDEN copy (reporting is open to every supporter in principle, so this appears very rarely) |
| PROTECTED | **Revoked access is the explicit form of PROTECTED**: D6-b says only "it has ended" + the effective date + a generic reason, and never "she revoked your permissions", "she has left the study" or "she blocked you" |

**Confirmation copy in full**

```
Submit this report?
· Who will see it: {by type} research support / the moderation team / the safety team
· A person will look at it; no automated system decides on its own
· She is not automatically told that you submitted a report
· After submitting, you can follow it under "My reports": received → being reviewed → dealt with
[Confirm and submit]        [Go back]
```

**Accessibility points**

- The note about what this is not for sits **before the submit button**, as a permanent `role="note"` paragraph — never a tooltip and never a collapsed block.
- Each option in the type radio group carries a line saying where it goes, associated with the option through `aria-describedby`.
- On D6-b, focus lands on the `<h1>` when the page loads, and "your access has ended" is announced once via `role="status"`.

---

## §3 E. Moderation workspace (E1–E6)

> Three hard constraints run through this whole group:
> **(1) The reporter's identity never appears, and must not be exposed indirectly through timing, wording or ordering either (§6 has a checkable checklist).**
> **(2) Evidence minimisation: present only what the disposition requires, never lay out the reported person's full history (§7).**
> **(3) Decisions are immutable: the confirmation copy must state that a record cannot be changed once made, and give the appeal and restoration route on the same screen.**

### E1 Moderation dashboard

**Purpose / the questions it answers**

- What is waiting for me right now, and in what order?
- Is anything close to a deadline (an appeal window, a handling deadline)?
- Is there anything that needs handing to the safety team?

**Wireframe**

```
<h1>Moderation dashboard</h1>

Moderation judges content and conduct, not the person who reported it.
The queue contains no reporter identities.

── Needing attention ──────────
Cases awaiting assignment    7  [Open the queue]
Assigned to me               3  [View]
Past the handling deadline   1  [View]

── 有期限的 ───────────────────
申诉待复核            2  · 最近期限：3 天后
恢复复核              1

── Safety-related ─────────────
Cases linked to a safety signal   2
  Note: safety judgements are made by the safety team.
  Only the link is shown here, never the conclusion of
  a safety assessment.

── Reference ──────────────────
[Community rule versions]  [Disposition scale reference]  [Help]
```

**State matrix**

| State | Presentation and copy in full |
|---|---|
| LOADING | Each count shows `…` with `aria-busy="true"`; **it must not show 0** — not yet read is not zero |
| EMPTY | `There are no cases waiting. This is a normal state and needs nothing from you. New items will appear here when the queue has them.` (congratulatory wording is **forbidden**) |
| ERROR | `The queue counts could not be read. This does not mean there are no cases waiting — please try again. [Try again]` |
| FORBIDDEN | `Your role cannot view the moderation dashboard. Nothing has gone wrong. The queues are separated by role: an approver cannot see the moderation queue, and a moderator cannot see the approval queue.` |
| PROTECTED | The dashboard presents aggregate counts only, never objects; PROTECTED for an individual object is handled in E2/E3 |

**Accessibility points**

- Each count is part of the accessible name of its link or button — `Open the queue (7 cases awaiting assignment)` — rather than relying on visual adjacency.
- A change in the counts is announced once through `aria-live="polite"`; frequent polled announcements are forbidden (they make the screen unusable for a screen-reader user).

---

### E2 The report queue (the reporter's identity never appears)

**Purpose / the questions it answers**

- Which one should be dealt with first?
- What is each one about, which community does it involve, and which rule?
- **The question it must not answer: who reported this.**

**Wireframe**

```
<h1>Cases waiting</h1>

The queue shows neither who reported something nor when they reported it.
Acting on the reporter's identity, or on a guess at it, is a breach.

Sort: priority → deadline   [Change sorting]
Filter: [All] [Assigned to me] [Overdue]

┌────────────────────────────┐
│ Case MC-1043                │
│ Priority: high              │
│ Type: harassment            │
│ Object type: community post │
│ Community: Gardening Corner │
│ Received: 1–3 days ago ⓘ    │
│ Number of reports: 2        │
│ Assignment: unassigned      │
│ Automated signal: [yes · unconfirmed] ⓘ │
│ Safety link: none           │
│ Deadline: in 2 days         │
│           [Open the case]   │
└────────────────────────────┘

ⓘ The time received is shown as a band (under 24 hours /
  1–3 days / more than 3 days), so that the reporter
  cannot be inferred from a precise time.
ⓘ An automated signal is only a prompt. It has not been
  confirmed by a person and must never be the sole basis
  for a disposition.
```

**The specific measures protecting the reporter (this screen is the highest-risk surface)**

| Leak channel | Design countermeasure |
|---|---|
| A direct field | The payload layer already guarantees no reporterId (THREAT_MODEL §5; the e2e test asserts against the raw JSON); **the frontend must never add one back** |
| Precise timing | The queue shows **bands** only (<24h / 1–3 days / >3 days); a precise timestamp appears only in E3's evidence area, and only as the time of the **content**, never of the **report** |
| Ordering | The default sort is `priority → deadline`, and **sorting by report time is not offered**; within the same priority and deadline the order is a stable hash of the case ID, not the order of arrival |
| Wording | The reporter's own account **never enters a queue card** (see the staged disclosure in E3) |
| Volume | Only a **band** of the report count is shown (1 / 2–4 / 5 or more), enough to support a judgement of proportion, and never a curve of the exact count over time |

**State matrix**

| State | Presentation and copy in full |
|---|---|
| LOADING | `Loading the case queue…` (skeleton screens are forbidden) |
| EMPTY | `There are no cases waiting. This is a normal state. New reports will appear here as they arrive, ordered by priority and deadline.` |
| ERROR | `The queue could not be fetched. This does not mean the queue is empty. You can try again; if it keeps failing, tell the operations duty contact. [Try again] ▸technical details` |
| FORBIDDEN | `Your role cannot view the moderation queue. Nothing has gone wrong.` |
| PROTECTED | When an item in the queue is not visible once opened: `This content cannot be shown. This case may have been reassigned or closed. Go back to the queue and carry on.` — **note: this copy must be identical for "does not exist" and "you are not allowed"** |

**Accessibility points**

- The queue is a `<ul>`, each case an `<article aria-labelledby="case-MC-1043">` inside an `<li>`; the fields sit in a `<dl>`.
- Priority = words + an icon (never colour alone); "high" must not be a red block on its own.
- Filtering and sorting are a group of `<button aria-pressed>`, and after a change `role="status"` announces `Sorted by deadline, 7 cases.`
- Each `[Open the case]` is a block-level full-width button, 44px tall, with ≥12px between rows.

---

### E3 Case detail and minimised presentation of evidence

**Purpose / the questions it answers**

- Exactly which piece of content, and which version of it, was reported?
- Which version of which rule applies?
- Under the principle of proportionality, what do I need in order to decide?
- **The question it must not answer: what has this person said and done in general.**

**Wireframe**

```
<h1>Case MC-1043</h1>
[Case · under review]  Deadline: in 2 days

── Report summary (classified by the system) ──
Type: harassment
Object: community post SP-7781 (version 2)
Community: Gardening Corner
Number of reports: 2

▸ Show the reporter's own account
  Before you open this: the account was written by the
  person who reported it and may contain things about
  themselves. You must not use it to infer who they are,
  and you must not let it change the disposition.
  Opening it is written to the access audit.

── The reported content ───────
┌────────────────────────────┐
│ «…the post's text…»          │
│ Published: 2026-07-28 10:14  │
│ Version: 2 (current)  [View version 1] │
│ Source: published by the participant themselves │
└────────────────────────────┘
Only the one item that was reported is shown.

── The applicable rule ────────
Gardening Corner community rules v3 (in force from 2026-05-01)
Clause 4: no demeaning remarks directed at a person
[Read the rules in full]
⚠ v3 was in force when the post was made, and matches the current version.

── Previous dispositions relevant to this one ──
**Dispositions in force** against this account in the past 12 months: 1
  · 2026-03-02 · warning · rule clause 4
Reports that were not upheld are not shown, and neither is
history unrelated to this rule.

── Automated signal ───────────
[Signal raised automatically · not confirmed by a person]
Classification: possible demeaning remark
Must not be the sole basis for a disposition.

── Need more evidence? ────────
Retrieving anything outside this scope requires a written
reason, is recorded in the audit trail, and is reviewed by
a third person.
              [Request more evidence]

────────────────────────────
[Go to the decision]        [Hand to the safety team]
```

**The specific rules of evidence minimisation (checkable; see also §7)**

1. Visible by default = **the one item that was reported** (in the version it was in when reported).
2. Previous dispositions show only: the past 12 months, **dispositions in force**, under **the same rule clause**. Reports that were not upheld are never shown.
3. The reporter's account is **collapsed by default**; opening it is an explicit action + an explicit warning + an audit record.
4. Any retrieval beyond that scope goes through "request more evidence": a mandatory reason + the scope + an audit record + review by a third person.
5. The interface offers **no route at all** to that account's research data, assessment results, safety records, message content or matching records (§188: avoid unrelated research or Safety data).

**State matrix**

| State | Presentation and copy in full |
|---|---|
| LOADING | `Loading the case…`; the evidence area is not rendered until loading completes; the route to the decision is `disabled` and says `You can go to the decision once the evidence has loaded.` |
| EMPTY | Where the author has deleted the content: `The reported content is no longer available (the author deleted it). You can still decide on the evidence snapshot that was kept. [View the evidence snapshot]`; and with no snapshot: `There is no evidence available. A restrictive disposition should not be made without evidence — you can close this as not upheld, or request retrieval.` |
| ERROR | The generic ERROR copy + `Nothing about the case has changed.` |
| FORBIDDEN | `This case is not assigned to you, and your role is not one that can review it. Nothing has gone wrong. [Request assignment]` |
| PROTECTED | The generic PROTECTED copy (covering: the case does not exist / belongs to somebody else / has been merged / you are not allowed) |

**Key interactions and confirmation copy**

Opening the reporter's account:

```
Show the reporter's own account?
· It was written by the person who reported this and may contain information from which they could be identified
· You must not use it to infer who they are, and you must not let it change the disposition
· Opening it is recorded in the access audit under your name  🔒
[Open, understood]      [Do not open]
```

Requesting more evidence:

```
Request evidence beyond the current scope?
· You are requesting: {scope}
· Reason: {mandatory, stored with the record}
· Content outside the scope is reviewed by a third person and does not become visible immediately
· Both the request and the review outcome are recorded in the audit trail  🔒
[Submit the request]        [Go back]
```

**Accessibility points**

- The collapsed area uses a native `<details><summary>`, and the `summary`'s accessible name carries the warning: `Show the reporter's own account (opening it is recorded in the audit trail)`.
- The rule version uses `<data value="v3">`; the version number must be words and must never be implied by colour or position alone.
- "Go to the decision" and "Hand to the safety team" sit side by side with **equal weight** — handing to safety is not the "heavier" option, and it is not an escape from making a disposition (see the wording in E6).
- Long content areas scroll independently with `overflow-x: auto`; the page body never scrolls horizontally.

---

### E4 Moderation decisions and confirmation (immutable)

**Purpose / the questions it answers**

- What disposition am I about to make, under which rule, and is it proportionate?
- What will the person subject to it see?
- How can they appeal?
- Can I change it afterwards? (The answer: no. So the confirmation screen must say that plainly, and give the appeal and restoration route on the same screen.)

**线框**

```
<h1>记录决定 · 个案 MC-1043</h1>

决定一旦记录即写入审计，不可修改、不可删除。
如果记录有误，只能通过申诉或恢复流程处理，
原始记录会被保留。

── Disposition ────────────────
( ) Not upheld, close
( ) Warning
( ) Hide the content
( ) Remove the content
( ) Restrict features      Duration: [  ] days
( ) Disconnect
( ) Suspend the account ⚑  Duration: [  ] days
( ) Ban ⚑
⚑ Requires MFA-tier authentication. You are currently at the password tier.

── Basis ──────────────────────
Rule: Gardening Corner community rules v3 · clause 4 ▾
Evidence: [✓] post SP-7781 v2
      [ ] the reporter's account (opened)
Reason (mandatory; it will be read on an appeal review):
┌────────────────────────────┐
└────────────────────────────┘

── Proportionality (mandatory) ──
Why is this disposition proportionate to the conduct?
┌────────────────────────────┐
└────────────────────────────┘

── What the other person will see ──
«a preview of the participant-readable explanation generated from the above»
[Edit the explanation they will see]

── Appeal ─────────────────────
Can be appealed: yes · within 14 days
        [Record the decision]
```

**Confirmation copy in full (the detailed tier, seven-line structure)**

```
Record the decision "hide the content" on case MC-1043?

Object: community post SP-7781 (version 2), author account A-2291
Effect: the post becomes invisible to everyone; the account is not restricted
Duration: indefinite (it can be lifted through the restoration process)
They will see: "A post of yours in 'Gardening Corner' has been hidden,
      under clause 4 of community rules v3. You can appeal within 14 days."
Appeal: yes, within 14 days; reviewed by somebody who took no part in this decision
Reversibility: the content can be made visible again through the restoration
      process, but **this decision record itself cannot be changed or deleted**
Audit: written to the audit trail in your name  🔒

[Confirm and record the decision]        [Go back and change it]
```

MFA-tier actions (suspend / ban) add a line, and it appears **the moment the option is selected**, never on submission:

```
This disposition requires MFA-tier authentication. You are currently
at the password tier, and submitting will be refused by the server.
Sign in again with MFA before handling it, or choose a disposition
that does not require MFA.
```

**State matrix**

| State | Presentation and copy in full |
|---|---|
| LOADING | While submitting, the button becomes `Recording…` and `disabled`; **repeat clicks must not be allowed** (idempotence is guaranteed by the server, but the interface should not manufacture a repeated intent) |
| EMPTY | Not applicable (this screen has no list). If somebody else has closed the case: `This case has been closed and no further decision can be recorded. [View the decision that was recorded]` |
| ERROR | `This decision could not be recorded. The reason and the proportionality note you wrote are both still here. **No disposition has taken effect.** You can try again. [Try again] ▸technical details` |
| FORBIDDEN | Insufficient permission (including insufficient MFA): `This disposition requires MFA-tier authentication and you are at the password tier. Nothing has been changed. [How to raise your authentication strength]` |
| PROTECTED | The generic PROTECTED copy |

**Accessibility points**

- The disposition is a radio group in `<fieldset><legend>Disposition</legend>` with **nothing pre-selected**, or an equivalent that pre-selects nothing.
  *(Checked against the code 2026-08-16 and corrected: this previously said the implementation used a `<select>` defaulting to "warning" and referred to §8. That was true of the version rebuilt on 2026-08-05 and is no longer. `StaffModeratorPanel.tsx` now renders one button per decision from a `CHOICES` table, each with its effect stated beside it rather than in a tooltip, and nothing is chosen until a button is pressed — so the dark-pattern risk the note described, a default amounting to a disposition nobody chose, has been removed. The implementation also carries only the five decisions that genuinely act (Dismiss / Hide / Remove / Restore / Warn); see §8 for the five deliberately absent.)*
- The confirmation dialog is `role="alertdialog"` with the seven-line structure as a `<dl>`; focus lands on the title when it opens, and `aria-describedby` points at the whole `<dl>`.
- "Confirm and record the decision" and "Go back and change it" are the same width and weight; "go back" must never be a text link.
- 记录成功后播报：`决定已记录，以你的身份署名，不可修改。个案已从队列移除。`

---

### E5 申诉与恢复

**目标 / 要回答的问题**

- 原决定是什么、依据什么？
- 申诉人说了什么？
- 我能不能复核这一件？（利益冲突检查）
- 恢复什么、不恢复什么？

**线框**

```
<h1>申诉复核 · AP-233</h1>

── 利益冲突检查 ───────────────
原决定人：M-004
你：M-011
✓ 你未参与原决定，可以复核。
（若相同则显示：✗ 你作出了原决定，不能复核
  这件申诉。[转给其他复核人]）

── 原决定（不可修改）───────────
个案 MC-1043 · 隐藏内容
规则：社区规则 v3 第 4 条
时间：2026-07-30 · 决定人：M-004
理由：«原文»
🔒 无论本次复核结果如何，这条记录都会保留。

── 申诉人的陈述 ───────────────
«原文»
提交时间：2026-08-01

── 申诉人补充的材料 ────────────
[✓] 1 张截图（已通过扫描）
不显示与本次申诉无关的其他内容。

── 复核结论 ───────────────────
( ) 维持原决定
( ) 改变处置：[下拉]
( ) 撤销处置并恢复内容
理由（必填）：
┌────────────────────────────┐
└────────────────────────────┘

        [记录复核结论]
```

**恢复子屏（§192）**

```
<h1>恢复 · MC-1043</h1>

将要恢复：社区帖子 SP-7781（版本 2）
恢复后：该帖子对原受众重新可见
仍然保留的限制：无
生效时间：立即
会通知：作者本人
不会通知：举报人是否收到通知由通知策略决定，
          本屏不显示举报人相关信息
原决定记录：保留，不删除  🔒
```

**确认文案原文**

```
确认记录复核结论「撤销处置并恢复内容」？

对象：个案 MC-1043 的处置「隐藏内容」
效果：帖子 SP-7781 恢复为原受众可见
仍保留：原决定记录与本次复核记录都会保留，
      不会被删除或改写
对方会看到：「你的申诉已复核，原处置已撤销，
      内容已恢复。」
可逆性：本条复核记录不可修改
审计：以你的身份署名写入审计  🔒

[确认记录复核结论]        [返回修改]
```

**状态矩阵**

| 状态 | 呈现与文案原文 |
|---|---|
| LOADING | `正在载入申诉…` |
| EMPTY | `现在没有待复核的申诉。这是正常状态。` |
| ERROR | 通用 ERROR + `原决定与申诉都没有被改动。` |
| FORBIDDEN | 利益冲突拒绝：`你作出了这件个案的原决定，不能复核自己的决定。这不是出错，是职责分离。[转给其他复核人]` |
| PROTECTED | 通用 PROTECTED |

**无障碍要点**

- 利益冲突检查结果是**页面的第一条内容**，用 `role="status"` 在载入完成时播报一次。
- ✓/✗ 必须配文字（`可以复核` / `不能复核`），不得只有符号。
- 「原决定」区块用 `<blockquote>` + 明确标题，与「复核结论」表单在语义上分离，避免屏幕阅读器把两段理由混淆。

---

### E6 审核 → 安全联动

**目标 / 要回答的问题**

- 我看到的这件事，可能是安全问题吗？
- 我提交后会发生什么？（答案：安全团队人工评估；**没有任何安全事件被确认**）
- 我的审核处置还要不要继续做？（答案：要，两条线各自独立）

**线框**

```
<h1>转给安全团队 · 个案 MC-1043</h1>

这会创建一个**安全信号**。

安全信号 = 一条待评估的线索
安全事件 = 经安全审阅人确认的事件

提交后：
· 安全审阅人会人工评估
· **现在没有、也不会自动产生安全事件**
· 你的审核处置不会因此暂停，
  两条线各自独立进行

── 你观察到什么（最小必要）─────
类别：( ) 自伤风险  ( ) 受到威胁
      ( ) 疑似诈骗或经济侵害
      ( ) 健康状况恶化  ( ) 其他
你的描述（必填，只写你实际看到的，
不要写推测或诊断）：
┌────────────────────────────┐
└────────────────────────────┘

关联：本个案 MC-1043（自动附带）
不会附带：该账号的研究数据、评估结果、
          消息内容

        [创建安全信号]
```

**确认文案原文**

```
确认创建一个安全信号？
· 这是一条待评估的线索，不是已确认的安全事件
· 安全审阅人会人工评估；系统不会自动确认事件
· 会附带：你的描述与个案 MC-1043 的关联
· 不会附带：该账号的研究数据、评估结果、消息内容
· 你的审核处置不受影响，仍需你继续处理
· 这条信号写入后不可修改  🔒
[确认创建安全信号]        [返回]
```

**状态矩阵**

| 状态 | 呈现与文案原文 |
|---|---|
| LOADING | `正在提交…` |
| EMPTY | 已关联信号列表为空：`这个个案还没有关联任何安全信号。` |
| ERROR | `没能创建安全信号。你写的描述还在。**没有信号被创建。** 如果这件事需要立即处理，请按「安全值班联系方式」直接联系安全值班人。[重试]` |
| FORBIDDEN | `你的角色不能创建安全信号。这不是出错。请通过「安全值班联系方式」转达。` |
| PROTECTED | 通用 PROTECTED |

**无障碍要点**

- 「信号 ≠ 事件」的定义在表单**之前**，是常驻段落而非折叠。
- 错误态必须给出**平台之外的替代路径**（值班联系方式），因为这是安全关键错误（§236：不得给出虚假安慰）。

---

## §4 F. 安全工作区（F1–F6）

> 贯穿全组的硬约束：
> **(1) 安全信号 ≠ 安全事件。** 计数分开、分区分开、徽章形状不同；从信号到事件的转换是**人工 + MFA** 动作。
> **(2) 「关闭为非安全事件」与「转为安全事件」必须同等可达、措辞中立。** 两者都是正当结论；界面不得让任一方向显得更「安全」或更「负责」。
> **(3) 平台不是紧急求助渠道。** 每一个安全屏都要能在 1 次交互内到达「现在能做的现实的下一步」。

### F1 安全仪表盘

**目标 / 要回答的问题**

- 有多少**未确认的信号**、多少**已确认的事件**？（分开计数）
- 有没有超过响应时限的？
- 有谁/什么功能正处于暂停？
- 升级联系有没有失败？

**线框**

```
<h1>安全仪表盘</h1>

信号是待评估的线索；事件是经人工确认的。
两者分开统计，不能相加。

── 安全信号（未确认）───────────
未分诊              5
超过响应时限        1
[打开信号队列]

── 安全事件（已确认）───────────
进行中              2
逾期未完成的动作    1
[查看安全事件]

── 暂停中 ─────────────────────
参与者暂停          1
功能暂停            2（匹配、消息）
[查看暂停与恢复]

── 升级 ───────────────────────
升级联系失败        0
[升级联系人清单]

────────────────────────────
⚠ 本平台不是紧急求助渠道。
需要立即介入时，按「升级联系人清单」
中的现实渠道联系；平台内的处理不是即时的。
```

**状态矩阵**

| 状态 | 呈现与文案原文 |
|---|---|
| LOADING | 计数位 `…`，**绝不显示 0**。文案：`正在读取…（读到之前不显示数字，避免把未知当成零）` |
| EMPTY | `现在没有未分诊的信号，也没有进行中的安全事件。这是正常状态。`（禁止祝贺式措辞） |
| ERROR | `没能读取安全计数。这不代表没有待处理的信号或事件。请重试；若持续失败，按值班流程口头确认。[重试]` |
| FORBIDDEN | `你的角色不能查看安全仪表盘。这不是出错。安全队列与审核队列按角色隔离。` |
| PROTECTED | 仪表盘仅聚合，不涉及单个对象 |

**无障碍要点**

- 「信号」与「事件」是两个 `<section>`，各有 `<h2>`，屏幕阅读器无法把两组数字读成一组。
- 计数与其含义在同一个可访问名内：`打开信号队列（5 个未分诊信号）`。
- 紧急限制说明常驻页脚位置，`role="note"`。

---

### F2 SafetySignal 队列

**目标 / 要回答的问题**

- 哪条最急、还剩多少响应时间？
- 来源是人还是自动系统？
- 归谁负责？
- **不该回答的问题：这条信号意味着什么诊断结论。**

**线框**

```
<h1>待分诊的安全信号</h1>

这些都是**未确认的信号**。
自动系统只能产生信号，永远不能创建安全事件。

排序：紧急度 → 响应时限

┌────────────────────────────┐
│ [信号 · 未确认] SS-2210     │
│ 紧急度：高（文字+图标）      │
│ 类别：自伤风险的可能提及     │
│ 来源：参与者本人提交         │
│ 范围：参与者 P-118 ·         │
│       研究项目 RP-3          │
│ 收到：4 小时前               │
│ 负责人：未认领               │
│ 响应时限：还剩 4 小时        │
│ 摘要（最小必要）：           │
│   «一句话摘要»               │
│           [开始分诊]         │
└────────────────────────────┘

┌────────────────────────────┐
│ [信号 · 未确认] SS-2211     │
│ 来源：[自动产生 · 未经人工确认]│
│ 自动分类：可能的诈骗话术      │
│ 自动系统给出的可能性不是结论。│
│           [开始分诊]         │
└────────────────────────────┘
```

**状态矩阵**

| 状态 | 呈现与文案原文 |
|---|---|
| LOADING | `正在载入信号队列…`（骨架屏禁用：§225 明列 Safety decision 不得用骨架） |
| EMPTY | `当前没有待分诊的信号。这是正常状态。新的信号进入后会按紧急度排在这里。` |
| ERROR | `没能获取信号队列。**这不代表没有待处理的信号。** 请重试；若持续失败，按值班流程通过其他渠道确认，不要以此屏为准。[重试]` |
| FORBIDDEN | `你的角色不能查看安全信号队列。这不是出错。` |
| PROTECTED | `无法显示这个内容。这条信号可能已由他人分诊。返回队列继续。` |

**无障碍要点**

- 紧急度：`高` 文字 + 三角图标 + `--color-warning`（三重冗余）；**不得**用红色行底作为唯一标识。
- 来源为自动时，可访问名以 `自动产生的信号，未经人工确认` 开头，屏幕阅读器先听到限定词再听到分类。
- 响应时限用相对时间 + 绝对时间：`还剩 4 小时（截至 2026-08-03 18:00）`。

---

### F3 人工分诊视图

**目标 / 要回答的问题**

- 我需要知道的最小必要背景是什么？
- 这个人当前的同意与暂停状态是什么？（决定我能做什么）
- 有哪些结论可选？它们同等正当。
- 我要立刻做的现实的下一步是什么？

**线框**

```
<h1>分诊 · SS-2210</h1>
[信号 · 未确认]  响应时限：还剩 4 小时

⚠ 本平台不是紧急求助渠道。
如判断有立即危险：先按「升级联系人」联系
现实渠道，再回来记录处置。
              [升级联系人清单]

── 最小必要背景 ───────────────
来源：参与者本人在「安全担忧」中提交
时间：2026-08-03 10:12
原文：«…»
相关内容引用：消息 M-9921（1 条）
  只引用与本信号相关的内容。

── 当前状态（影响你能做什么）───
同意状态：消息=允许 · 匹配=允许 · AI=不适用
暂停状态：无
既往安全历史：过去 12 个月 1 条已关闭信号
  · 2026-02-11 · 关闭为非安全事件
  不显示与安全无关的研究或评估数据。

── 自动系统的提示（如有）───────
[自动产生 · 未经人工确认]
可能性提示：自伤风险相关表述
这是提示，不是判断，也不是诊断。

── 结论（四选一，同等正当）─────
( ) 关闭：不是安全事件
( ) 继续观察
( ) 升级：需要更高级别审查
( ) 转为安全事件 ⚑（需要 MFA）

理由（必填，四种结论都必填）：
┌────────────────────────────┐
└────────────────────────────┘

        [记录处置]
```

**中立性的具体设计手段（这是本组最容易违反的约束）**

| 手段 | 规则 |
|---|---|
| 排序 | 四个结论按「影响由小到大」自然排列，**不做视觉分组**，不把「转为事件」单独放在底部或用分隔线隔开 |
| 视觉权重 | 四个单选项字号、行高、间距完全一致；`转为安全事件` 只多一个 ⚑ MFA 标记，**不加危险色** |
| 措辞 | `关闭：不是安全事件` —— 不写「无需处理」「误报」「排除」；`转为安全事件` —— 不写「确认危险」「立案」 |
| 必填对称 | 四种结论都必填理由、字数下限相同；**不得**只对「关闭」要求解释 |
| 确认对称 | 四种结论都走**详细确认档**，结构完全一致 |
| 无预选 | 单选组无预选。现有实现的 `<select>` 默认选中「关闭：不是安全事件」——这是实质性的默认倾向，必须改（§8） |

**状态矩阵**

| 状态 | 呈现与文案原文 |
|---|---|
| LOADING | `正在载入信号…`；结论区在背景载入完成前 `disabled`：`背景载入完成后才能记录处置。` |
| EMPTY | 无相关内容引用时：`这条信号没有关联的平台内容。这不影响你作出结论——你可以只依据来源陈述判断。` |
| ERROR | 安全关键错误：`没能载入这条信号的背景。**不要凭印象作处置。** 请重试；若持续失败，按值班流程通过其他渠道核实。[重试] [升级联系人清单]` |
| FORBIDDEN | `你的角色不能分诊安全信号。这不是出错。请通过「升级联系人清单」转达。` |
| PROTECTED | `无法显示这个内容。这条信号可能已由他人分诊。返回队列继续。` |

**无障碍要点**

- 紧急限制说明是页面**第二个元素**（紧跟 `<h1>`），`role="note"`，不可折叠。
- 四个结论在 `<fieldset><legend>结论（四种结论同等正当，都需要填写理由）</legend>`——legend 本身承载中立性声明。
- MFA 提示在选中该项时通过 `aria-live="polite"` 播报，不用弹窗打断。

---

### F4 关闭为非安全事件 / 转为安全事件

> 两个方向共用**同一个确认模板**，只有内容不同。这是「同等可达、措辞中立」的落地方式：同构的确认体本身就是中立性的证据。

**确认文案原文 —— 关闭为非安全事件**

```
确认把信号 SS-2210 记录为「关闭：不是安全事件」？

对象：安全信号 SS-2210（参与者 P-118）
结论：不构成安全事件
理由：«你填写的理由»
后续支持：[ ] 安排后续观察  [ ] 转介研究支持
      [ ] 不需要后续
对方会看到：默认不通知本人；若你勾选了
      「告知本人」，本人会看到
      「你提出的安全担忧已由安全团队查看」
信号保留：原始信号会完整保留，不会被删除
可逆性：这条处置记录不可修改。若后续出现
      新情况，应新建信号，而不是改写这一条
审计：以你的身份署名写入审计  🔒

[确认记录处置]        [返回]
```

**确认文案原文 —— 转为安全事件（MFA）**

```
确认把信号 SS-2210 转为安全事件？

对象：安全信号 SS-2210（参与者 P-118）
结论：确认为安全事件
类别：{必填}   严重度：{必填}
与干预的关联性：{必填：相关/可能相关/不相关/无法判定}
受影响的干预或功能：{必填}
立即动作：{至少选一项，或明确选择「暂不采取动作」}
监测安排：{必填}
上报要求：{是/否，及依据}
负责人：{你}
理由：«你填写的理由»
信号保留：原始信号会完整保留
可逆性：这条记录不可修改。事件本身可以在
      后续被关闭，但不会被删除
认证：这项操作需要 MFA 级认证 ⚑
审计：以你的身份署名写入审计  🔒

[确认转为安全事件]        [返回]
```

**「同等可达」的落地判据（可检验）**

1. 两个动作在同一个单选组内，DOM 距离相同，无中间分隔元素。
2. 两个确认对话框的字段行数差 ≤ 2 行，且**逐行同构**（对象/结论/理由/保留/可逆性/审计对齐）。
3. 两个确认按钮的可访问名长度与视觉尺寸一致，颜色令牌相同（`--color-action-primary`），**都不使用 `--color-danger`**。
4. 从「开始分诊」到任一确认，交互次数相同（选择 → 填理由 → 记录 → 确认 = 4 步）。

**状态矩阵**

| 状态 | 呈现与文案原文 |
|---|---|
| LOADING | 提交中：`正在记录处置…`，按钮 `disabled` |
| EMPTY | 不适用 |
| ERROR | `没能记录这个处置。你填写的内容还在。**信号仍然是未分诊状态，仍然需要处理。** 请重试。[重试]` ——不得让人误以为已经处理完 |
| FORBIDDEN | MFA 不足：`转为安全事件需要 MFA 级认证，你当前是密码级。**没有任何内容被改动，信号仍未分诊。** 你可以以 MFA 重新登录后再处理，或选择「升级：需要更高级别审查」把它交给有权限的人。` |
| PROTECTED | `无法显示这个内容。这条信号可能已由他人分诊。` |

**无障碍要点**

- MFA 需求在**选中时**即提示（现有实现已有 `role="note"` 提示，保留），而不是提交后才失败。
- 确认对话框内 `<dl>` 结构，`aria-describedby` 指向整个列表；焦点进入时在标题。
- 记录成功后播报：`处置已记录。信号 SS-2210 已关闭为非安全事件。` 或 `处置已记录。安全事件 SE-0042 已创建。`

---

### F5 SafetyEvent 视图与安全动作

**目标 / 要回答的问题**

- 这个事件确认了什么？（类别、严重度、关联性）
- 现在有哪些动作、谁负责、做完了没有？
- 现在处于什么监测与暂停状态？
- 时间线上发生过什么？

**线框**

```
<h1>安全事件 SE-0042</h1>
[安全事件 · 已确认]   负责人：S-003

── 确认内容 ───────────────────
类别：自伤风险
严重度：中
与干预的关联性：可能相关
受影响：消息功能、匹配功能
确认人：S-003 · 2026-08-03 14:20
来源信号：SS-2210 [查看]

── 动作 ───────────────────────
┌────────────────────────────┐
│ 联系参与者                   │
│ 权限：安全审阅人             │
│ 状态：已完成 · S-003 ·       │
│       2026-08-03 15:02       │
└────────────────────────────┘
┌────────────────────────────┐
│ 暂停匹配功能                 │
│ 权限：安全审阅人 ⚑           │
│ 状态：进行中 · 复核时间 8-10  │
│         [查看暂停详情]       │
└────────────────────────────┘
┌────────────────────────────┐
│ 通知已批准的联系人           │
│ 状态：未开始 · 逾期 1 天 ⚠   │
│         [记录这项动作]       │
└────────────────────────────┘

[添加一项动作]

── 监测 ───────────────────────
当前：每日复核 · 下次 2026-08-04
[更改监测安排]

── 时间线 ─────────────────────
（只显示与本事件相关的记录）
2026-08-03 14:20 事件确认 · S-003
2026-08-03 15:02 已联系参与者 · S-003
2026-08-03 15:10 暂停匹配功能 · S-003
🔒 时间线为追加记录，不可修改
```

**状态矩阵**

| 状态 | 呈现与文案原文 |
|---|---|
| LOADING | `正在载入安全事件…` |
| EMPTY | 无动作时：`这个事件还没有记录任何动作。如果确实不需要采取动作，请添加一条「暂不采取动作」并说明理由——空白不等于已判断。` |
| ERROR | `没能载入这个安全事件的完整信息。**不要据此认为动作已完成。** 请重试。[重试]` |
| FORBIDDEN | `你的角色可以看到这个事件，但不能记录安全动作。这不是出错。` |
| PROTECTED | 通用 PROTECTED |

**关键交互与确认文案**

```
确认记录动作「通知已批准的联系人」为已完成？
· 对象：安全事件 SE-0042
· 记录内容：动作名称、完成时间、你的署名
· 不记录：通话或谈话的具体内容
· 这条记录写入后不可修改；如需更正，
  应追加一条更正记录，原记录保留  🔒
[确认记录]        [返回]
```

**无障碍要点**

- 严重度、关联性都是文字（`中`、`可能相关`），不得只用色阶（§200：不得只用告警色）。
- 每个动作卡是 `<li>` + `<dl>`，状态在可访问名内：`记录这项动作（通知已批准的联系人，未开始，逾期 1 天）`。
- 时间线是 `<ol>`，时间用 `<time datetime>`。

---

### F6 暂停 / 恢复与紧急限制说明

**目标 / 要回答的问题**

- 我要暂停的**最小范围**是什么？暂停后本人还剩什么？
- 谁负责、什么时候复核？
- 恢复需要满足什么？
- 本人那边看到的是什么？
- 紧急情况下现实可行的下一步是什么？

**F6-a 暂停 · 线框**

```
<h1>暂停 · 参与者 P-118</h1>

优先选择能达到目的的最小范围。
暂停全部功能通常不是必要的。

── 范围（可多选，从小到大）─────
[ ] 暂停匹配
[ ] 暂停与特定连接的消息
[ ] 暂停全部消息
[ ] 暂停 AI 功能（本原型中已全局禁用）
[ ] 暂停某个干预组件
[ ] 暂停参与者的全部平台活动 ⚑

── 你选择后会看到 ─────────────
立即生效的效果：«随勾选实时更新»
本人仍然可以：查看和撤回同意、
  查看自己的内容、导出、联系研究支持、
  使用「帮助与安全」
理由类别：[下拉，必填]
复核时间：[日期，必填]
负责人：你（S-003）
恢复方式：见「恢复」流程，需要复核与批准

        [记录暂停]
```

**F6-b 恢复 · 线框**

```
<h1>恢复 · 参与者 P-118</h1>

恢复需要逐项确认，不能一键恢复。

[ ] 已完成复核（复核记录：____）
[ ] 已完成需要的纠正措施
[ ] 已确认本人当前同意仍然有效
[ ] 已确认本人仍符合参与条件
[ ] 已确认相关功能处于可用状态
[ ] 已与本人沟通并告知恢复
[ ] 已获得批准（批准人：____）⚑

原暂停记录：保留，不会被删除  🔒

        [记录恢复]
```

**F6-c 紧急限制说明（本平台不是紧急求助渠道）**

这段说明是**共用组件**，出现在：F1 页脚、F3 顶部、F6 两屏、参与者「帮助与安全」屏、D6 报告屏、H4 公共信息页。内容一致，不得因场景删改：

```
┌────────────────────────────┐
│ 本平台不是紧急求助渠道       │
│                            │
│ 本平台的处理不是即时的。     │
│                            │
│ 如果有人正处于立即的危险中： │
│ · 拨打当地紧急电话           │
│ · 或联系当地危机支援服务     │
│   «此处为占位：具体号码与服务 │
│    名称需按部署地区填写，    │
│    并经伦理审查批准——见 §10» │
│                            │
│ 研究团队能做的：            │
│ · 工作日 09:00–17:00 回应    │
│   平台内的安全担忧           │
│ · 人工查看每一条安全信号     │
│ · 必要时暂停相关功能         │
│                            │
│ 研究团队不能做的：          │
│ · 提供医疗或心理治疗         │
│ · 即时到场或即时联系         │
│ · 代替紧急服务              │
└────────────────────────────┘
```

> **概念研究阶段的诚实标注**：本原型为合成数据环境，上述「研究团队能做的」在当前阶段**是被建模的未来系统行为**。参与者可见的版本必须加一句：`当前为研究原型演示环境，没有真实参与者，也没有真实的值班响应。`（见 §10 未决项 U-6：真实部署时该句必须移除，且紧急号码必须由伦理审查确定。）

**状态矩阵（F6 两屏合并）**

| 状态 | 呈现与文案原文 |
|---|---|
| LOADING | `正在载入当前暂停状态…`；在读到之前，暂停/恢复按钮 `disabled`：`需要先确认当前状态，避免重复暂停或误恢复。` |
| EMPTY | 无暂停中对象：`当前没有处于暂停的参与者或功能。这是正常状态。` |
| ERROR | 安全关键：`没能记录这次{暂停/恢复}。**状态没有改变**——{原状态}仍然有效。请重试；若持续失败，立即按值班流程处理，不要以此屏为准。[重试] [升级联系人清单]` |
| FORBIDDEN | `这项操作需要 MFA 级认证 / 需要批准人角色。没有任何内容被改动。` |
| PROTECTED | 通用 PROTECTED |

**确认文案原文（暂停）**

```
确认暂停参与者 P-118 的「匹配」功能？

对象：参与者 P-118 · 仅匹配功能
立即效果：不再产生新的匹配候选；
      已有的连接与消息不受影响
本人仍然可以：查看与撤回同意、查看自己的
      内容、导出、联系研究支持、使用帮助与安全
理由类别：安全事件相关
复核时间：2026-08-10
负责人：S-003（你）
本人会看到：「你的匹配功能已暂时停用。
      研究团队会与你联系。」
恢复方式：需要复核、纠正措施与批准，
      不能一键恢复
可逆性：暂停可以解除；**本条暂停记录不可修改**  🔒

[确认暂停匹配]        [返回]
```

**无障碍要点**

- 范围复选组按影响从小到大排列，`<legend>` 写明 `范围（优先选择最小必要范围）`。
- 「你选择后会看到」区域是 `aria-live="polite"` 的效果预览，勾选变化后播报一次汇总（不是每次勾选都长篇播报）。
- 恢复屏的七项确认是复选而非一个按钮：**不能一键恢复**是交互层面的表达，不只是文案。

---

## §5 H. 公共与邀请 surface（H1–H5）

> 共同约束（§22）：**这些界面暴露最少信息。** 未认证 surface 不得泄露某个人是否是参与者、是否被邀请、是否已激活。

### H1 登录 / 身份入口（当前为 dev-header 桩 + 访问口令横幅）

**目标 / 要回答的问题**

- 这是什么环境？（答案必须是：研究原型的开发环境）
- 我现在填的东西是不是认证？（答案必须是：**不是**）
- 我要去哪个工作区？
- 访问口令是什么、为什么要它？

> **这一屏最容易犯的设计错误，是把开发桩做得像真登录。**
> 一个漂亮的登录卡片 + 密码框 + 「登录」按钮，会让操作者（以及演示的观众、评审人）误以为存在认证。THREAT_MODEL 把「无真实认证」列为固有高风险；界面必须**主动对抗**这个误解，而不是保持中立。

**线框**

```
┌────────────────────────────────┐
│ ⚠ 开发环境身份桩 · 不是认证     │
│                                │
│ 这个环境没有身份认证。          │
│ 下面填写的标识**不会被验证**——  │
│ 系统会直接相信你填写的身份。    │
│                                │
│ 因此：                         │
│ · 这里只有合成数据，没有真实的人 │
│ · 这个环境不得对外开放          │
│ · 你在这里的操作不代表任何真实   │
│   的授权或批准                  │
│                                │
│ 正式的身份认证（OIDC）尚未实施， │
│ 待 ADR-104 决定。               │
└────────────────────────────────┘

<h1>健康老龄化研究平台（开发环境）</h1>

── 选择要进入的工作区 ────────────
( ) 参与者
( ) 支持者
( ) 员工

── 填写开发环境标识 ─────────────
（随所选工作区显示对应字段）

参与者：
  账户标识（actor id）      [        ]
  参与者标识（participant id）[      ]

员工：
  账户标识（actor id）      [        ]
  声明的认证强度            [下拉]
    · 密码级（MFA 级操作会被拒绝）
    · MFA
  ⓘ 这是你**声明**的强度，不是验证结果。
    服务端据此裁决，但没有任何东西
    验证过你确实完成了 MFA。

        [以这个身份进入]

── 环境访问口令 ─────────────────
这个环境在一个共享访问口令之后。
口令是**环境的门**，不是你的账号：
· 所有人共用同一个口令
· 它不区分个人，也不能单独撤销某个人
· 它不能替代认证

访问口令  [••••••••]   [保存口令]
口令只保存在这台设备的浏览器里。

────────────────────────────────
[公开研究信息]  [无障碍声明]  [联系支持]
```

**为未来 OIDC 留出的结构（不改信息架构即可替换）**

| 现在（桩） | 未来（OIDC） | 结构上的保证 |
|---|---|---|
| 顶部「开发环境身份桩」告警块 | 移除 | 它是一个独立 `<section role="alert">`，删除不影响其余布局 |
| 「选择工作区」单选 | 保留，但改为**由服务端返回的角色**驱动（§28 角色感知导航） | 选择器组件接口不变，数据源从本地状态换成服务端 |
| 「填写开发环境标识」 | 替换为 `[使用机构账号登录]` 单按钮 | 该区块是一个独立 `<section>`，整块替换 |
| 「声明的认证强度」下拉 | 替换为服务端返回的 `authStrength`，只读展示 | 认证强度在 UI 中始终是**展示值**，不是可编辑输入以外的任何东西 |
| 「环境访问口令」 | 视部署决定保留或移除 | 已是独立组件 `AccessTokenGate` |
| 上下文横幅「不是真实认证」 | 改为「已通过机构账号认证 · {方式}」 | 横幅槽位保留，只换内容 |

**状态矩阵**

| 状态 | 呈现与文案原文 |
|---|---|
| LOADING | 本屏无远程依赖，无 LOADING 态。**不得**为了「像登录」而加假的载入动画 |
| EMPTY | 不适用（无列表）。字段未填时 `[以这个身份进入]` 为 `disabled` 并说明 `填写标识后才能进入。` |
| ERROR | 进入后首个请求失败：`没能连上服务。你填写的标识还在。这可能是服务未启动，或访问口令不正确。[重试] [检查访问口令]` |
| FORBIDDEN | 口令正确但身份无任何工作区权限：`这个标识在当前环境里没有任何工作区权限。检查标识是否正确，或使用合成环境分配的标识。`（合成环境，无枚举风险；真实部署时此文案必须改为通用式——见 §10 U-3） |
| PROTECTED | 不适用于本屏；但**进入后**的任何 404 一律走通用 PROTECTED |

**访问口令横幅（触发式，沿用现有 `AccessTokenGate`）**

保留现有文案（已经是诚实的），补一句边界说明：

```
需要此环境的访问口令
服务器拒绝了刚才的请求，因为浏览器没有携带这个
环境的访问口令。这与你的账号和权限无关——它是
这个研究原型环境的访问门。
它是共享口令，不区分个人，也不能替代认证。
访问口令 [••••••]  [保存口令]
口令只保存在这台设备的浏览器里，不会随页面地址传播。
```

**无障碍要点**

- 开发桩告警是 `<section role="alert" aria-labelledby>`，页面载入时**主动播报一次**——这是屏幕阅读器用户唯一能听到「这不是认证」的机会。
- 「声明的认证强度」的说明通过 `aria-describedby` 绑定到 `<select>`，不是旁边的小字。
- 口令输入 `type="password" autocomplete="off"`，有可见 `<label>`。
- 工作区单选组改变时，下方字段的出现/消失通过 `aria-live="polite"` 播报：`已切换到员工工作区，需要填写账户标识与认证强度。`

---

### H2 安全邀请落地页

**目标 / 要回答的问题**

- 谁邀请我、这是什么研究？
- 为什么是我？
- 我可以不参加吗？（答案必须是：可以，且没有后果）
- 这个链接安全吗、有效期多久？

**线框**

```
（未登录 surface · 不显示任何个人信息）

<h1>你收到一份研究邀请</h1>

邀请方：«研究机构名称»
研究：«研究名称»
邀请编号：INV-…（只显示编号，不显示姓名）

── 为什么邀请你 ───────────────
«一段说明：从哪里、按什么标准邀请»

── 参加是完全自愿的 ────────────
· 你可以不参加，不需要说明理由
· 不参加不会影响你现在或将来获得的
  任何服务或照护
· 你可以先看完全部信息再决定
· 你随时可以改变主意

── 这份邀请 ───────────────────
有效期至：2026-09-30
链接只能由你使用；请不要转发

[继续了解]        [我不参加]
两个选择同等有效。

────────────────────────────
[公开研究信息]  [联系支持]  [无障碍声明]
⚠ 本平台不是紧急求助渠道（说明）
```

**不得出现的元素（§92 avoids urgency pressure）**

- 倒计时器、「名额有限」、「今天截止」、进度条式的「你已完成 20%」
- 预选的「继续」、把「我不参加」做成小字链接
- 任何在未验证身份前显示的姓名、地址、健康信息

**状态矩阵**

| 状态 | 呈现与文案原文 |
|---|---|
| LOADING | `正在载入邀请…` |
| EMPTY | 不适用 |
| ERROR | `没能载入这份邀请。这可能是网络问题。可以再试一次，或联系研究支持（联系方式见下）。[重试]` |
| FORBIDDEN | 不适用（未登录 surface） |
| PROTECTED | **链接无效、已过期、已使用、从不存在——四种情况文案必须完全一致**：`这个链接现在不能使用。如果你确实收到过邀请，请联系研究支持核对。[联系支持]` |

**无障碍要点**

- 「参加是完全自愿的」是 `<h2>` 区块，不是脚注。
- 两个选择等宽等重，DOM 顺序 = 视觉顺序。
- 页面 `lang="zh-CN"`；未登录页也必须有 skip-link 与可见焦点。

---

### H3 账户激活

**目标 / 要回答的问题**

- 我要做几步、现在第几步？
- 为什么要验证身份？
- 别人能帮我完成吗？
- 我用的是共用设备怎么办？
- 忘了怎么办？

**线框**

```
<h1>启用你的账户</h1>
第 2 步，共 3 步  ●●○

── 为什么需要这一步 ────────────
我们需要确认是你本人在启用账户，
这样别人不能用你的名义参加研究。

── 这一步要做什么 ──────────────
输入你收到的一次性验证码。

验证码  [      ]
        [继续]
        [没有收到验证码？]

── 需要人帮忙吗 ───────────────
可以。你可以请你信任的人协助你操作。
协助的人不会因此获得你的账户权限。
[了解协助方式]

── 共用设备提醒 ───────────────
如果这台设备别人也会用：
[ ] 这是共用设备
   勾选后：不在这台设备保存登录状态，
   离开时自动结束会话，
   通知内容不显示细节。
```

**状态矩阵**

| 状态 | 呈现与文案原文 |
|---|---|
| LOADING | `正在验证…`（按钮 `disabled`，不得允许重复提交） |
| EMPTY | 不适用 |
| ERROR | `没能验证这个验证码。你没有被锁定，可以再试。如果多次失败，请[申请新的验证码]或[联系研究支持]。` ——不指责用户，给下一步 |
| FORBIDDEN | 不适用 |
| PROTECTED | 验证码错误 / 已使用 / 已过期 / 账户不存在：**文案一致**：`这个验证码现在不能使用。你可以申请一个新的验证码，或联系研究支持。` |

**无障碍要点**

- 步骤指示既是文字（`第 2 步，共 3 步`）也是图形，不能只有圆点。
- 验证码输入 `inputmode="numeric" autocomplete="one-time-code"`，单一输入框而非 6 个分离框（分离框对屏幕阅读器与运动障碍用户极不友好）。
- 「共用设备」复选说明与复选框通过 `aria-describedby` 关联，勾选后效果用 `aria-live` 播报。
- 时间限制（验证码有效期）必须可延长或可重新申请（§296）。

---

### H4 公开研究信息与支持联系

**目标 / 要回答的问题**

- 这是什么研究、谁在做、为什么？
- 我的数据会怎样？
- 我怎么联系到人？
- **当前这个东西是什么阶段？**（必须诚实：概念研究原型）

**线框**

```
<h1>关于这项研究</h1>

┌────────────────────────────┐
│ 当前状态：概念研究原型       │
│                            │
│ 这是一个用**合成数据**演示的  │
│ 研究平台原型。              │
│ · 没有真实参与者            │
│ · 没有在招募任何人          │
│ · 尚未获得伦理批准          │
│ · 页面中展示的同意与审批流程 │
│   是对未来系统的设计模型     │
└────────────────────────────┘

── 这项研究想回答什么 ──────────
«平白语言说明»
[查看知识类型说明]
  ⓘ 本站展示的每条结论都标注了它属于
    哪一类知识（观察 / 推断 / 设计假设 /
    原型观察等）。合成或模拟的结果
    不会被当作经验证据呈现。

── 谁在做 ─────────────────────
«机构、负责人、资助来源、利益冲突声明»

── 参与意味着什么 ──────────────
«平白语言：时间、内容、可退出»

── 你的数据 ───────────────────
«收集什么、保存多久、谁能看到、如何退出»

── 联系我们 ───────────────────
研究支持：«邮箱 / 电话»
服务时间：工作日 09:00–17:00
无障碍协助：«渠道»
投诉与伦理问题：«独立渠道»

⚠ 本平台不是紧急求助渠道（完整说明）
```

**状态矩阵**

| 状态 | 呈现与文案原文 |
|---|---|
| LOADING | 静态页，通常无 LOADING |
| EMPTY | 不适用 |
| ERROR | `这个页面暂时无法完整显示。你仍然可以通过下面的方式联系研究支持：«静态兜底的联系方式»` ——联系方式必须硬编码在页面中，不依赖请求 |
| FORBIDDEN | 不适用（公开页） |
| PROTECTED | 不适用 |

**无障碍要点**

- 「当前状态」块是页面第一个内容，载入时播报（这是防止「原型被误认为在运行的服务」的唯一保障）。
- 联系方式用 `<address>`；电话号码是 `tel:` 链接且号码本身可见为文字。
- 所有平白语言段落行宽 ≤70 字符，无术语未解释。

---

### H5 无障碍声明

**目标 / 要回答的问题**

- 这个平台声称达到什么标准？
- 哪些地方还没达到？（必须诚实列出）
- 我遇到障碍怎么办、多久有回应？
- 有哪些可调的设置？

**线框**

```
<h1>无障碍声明</h1>

── 我们的目标 ─────────────────
WCAG 2.2 AA，以及七种使用模式的可用性
（视觉 / 低视力 / 听觉 / 运动 / 认知负荷 /
低数字素养 / 间歇性使用）。

── 当前达到的程度：部分符合 ────
诚实说明：我们做过代码层的基线检查，
**尚未完成真实用户测试**，包括与老年
参与者的测试。因此我们不能声称完全符合。

已完成：
· 200% 缩放不丢失内容
· 所有可操作元素有可见焦点
· 触控目标 ≥44 像素且互不重叠
· 尊重「减少动效」系统设置
· 状态变化会被屏幕阅读器播报

尚未完成：
· 自动化无障碍扫描尚未接入持续集成
· 无障碍专家走查尚未进行
· 辅助技术实验室测试尚未进行
· 老年参与者真实用户测试尚未进行
  （需先获得伦理批准）

── 你可以调整 ─────────────────
· 字号与行距（三档）
· 对比度（标准 / 高）
· 简化模式（减少每屏内容）
· 减少动效
这些设置由你选择，**不会**根据你的年龄
自动判定。
[打开显示与阅读设置]

── 遇到障碍怎么办 ──────────────
请告诉我们，我们会记录为缺陷并修复。
联系：«邮箱 / 电话 / 表单»
回应时间：工作日 5 个工作日内
如果这影响你参与研究，请同时联系研究支持。

── 本声明 ─────────────────────
最后更新：«日期» · 评估方式：代码审查与
自动化测试（未含真实用户测试）
```

**状态矩阵**

| 状态 | 呈现与文案原文 |
|---|---|
| LOADING | 静态页 |
| EMPTY | 不适用 |
| ERROR | `这个页面暂时无法完整显示。无障碍问题反馈渠道：«静态兜底»` |
| FORBIDDEN / PROTECTED | 不适用（公开页） |

**无障碍要点**

- 「尚未完成」清单不得折叠——这是诚实性的核心内容（ACCESSIBILITY_TEST_PLAN §5 明确它是就绪门未满足项）。
- 页面本身是无障碍实现的样板：正确的标题层级、`<ul>`、`<address>`、无仅色彩表意。
- 「打开显示与阅读设置」链接到 B13（参与者偏好设置），在员工工作区同样可达。

---

## §6 举报人保护：可检验检查表

> 适用范围：E1–E6 全部、F2–F5（当信号来自举报时）、D6（支持者提交的报告）。
> 每一条都是**二值可判定**的，用于设计评审与实现评审。

| # | 检查项 | 判定方法 | 违反后果 |
|---|---|---|---|
| R-1 | 队列与案件详情的**任何字段**都不含举报人标识 | 抓包看原始 JSON（e2e 已断言）+ 前端组件不得有 `reporterId` 的引用 | 设计错误 |
| R-2 | 队列不显示举报的**精确时间**，只显示区间 | 队列卡片中不存在 `HH:MM` 级的举报时间 | 设计错误 |
| R-3 | 队列默认排序不含入队顺序 / 举报时间；不提供按举报时间排序 | 排序选项清单中不存在该项 | 设计错误 |
| R-4 | 举报人自述文本**默认折叠**，展开需显式动作 + 警示 + 审计 | E3 中该区块是 `<details>` 且默认 closed | 设计错误 |
| R-5 | 同优先级、同时限的个案顺序不是入队序 | 排序键包含个案 ID 的稳定散列 | 设计错误 |
| R-6 | 报告数量以分档显示（1 / 2–4 / 5+），不显示随时间变化的计数序列 | 卡片中无精确计数曲线或时间序列 | 设计错误 |
| R-7 | 处置界面不提供「按举报人调整」的任何入口（如「同一举报人的其他报告」） | 界面中不存在该导航 | 设计错误 |
| R-8 | 面向举报人的状态只用安全措辞：`已收到` / `审阅中` / `已处理` / `需要补充信息` / `已关闭`；不披露处置内容与证据 | D6 与参与者侧报告中心的状态枚举 | 设计错误 |
| R-9 | 被处置者可见的说明中不出现任何指向举报人的线索（时间、措辞引用、数量） | E4「对方会看到」预览的文案模板审查 | 设计错误 |
| R-10 | 「转给安全团队」（E6）不携带举报人信息 | E6 确认文案明示携带项与不携带项 | 设计错误 |

---

## §7 证据最小化：可检验规则

| # | 规则 | 落地位置 |
|---|---|---|
| M-1 | 默认可见证据 = 被报告的那一条内容（含报告时点的版本号） | E3 |
| M-2 | 既往处置只显示：过去 12 个月 + 已生效 + 同一规则条款 | E3 |
| M-3 | 未成立的报告、被撤回的报告、不同规则下的历史**一律不显示** | E3 |
| M-4 | 审核界面不提供通往研究数据、评估结果、消息内容、匹配记录、安全记录的任何入口 | E1–E6 全部 |
| M-5 | 每一项证据必须带：来源标签、时间戳、版本号 | E3、E5 |
| M-6 | 超出默认范围的调取 = 显式申请 + 必填理由 + 范围 + 审计 + 第三人复核 | E3 |
| M-7 | 安全分诊的「最小必要背景」只含：来源陈述、相关内容引用、当前同意与暂停状态、同类安全历史 | F3 |
| M-8 | 安全界面不显示研究数据与评估结果 | F1–F6 |
| M-9 | 每次证据展开/调取都记入访问审计，并在界面上事先告知 | E3、F3 |
| M-10 | 支持者只能看到自己提交的内容，看不到本人已有条目（除非授权明示） | D3、D4 |

---

## §8 Changes needed to the existing implementation, and their effect on tests

> DESIGN_BRIEF §6: "changing copy changes the tests". Each item is listed below.
> Accessible names preserved: `View open cases`, `Handle this case`, `Record the decision`, `Confirm`, `View pending signals`, `Handle this signal`, `Submit the disposition`, `Enter`, `View my contributions`, `Submit a contribution`, `Save the password`, `Submit a report`.

> **Status re-verified against the code on 2026-08-16.** This list was written
> as a snapshot and had never been revisited, so it claimed defects that were
> fixed months ago while other entries were still live. Every row below was
> checked by reading the component named in it. Two are now done, one is
> partly done, and six are still open — the six matter, and they were easy to
> lose among the two that no longer applied.

### 8.1 Must fix (design errors in the current implementation)

| # | Location | Problem | Fix | Status (2026-08-16) |
|---|---|---|---|---|
| C-1 | `SupporterApp.tsx`, the 404 branch: "Not submitted: this needs the participant to have approved your relationship and to have consented to supporter contributions." | **Leaks the participant's relationship approval and consent status to their supporter** (protected existence is explained away) | Use the generic PROTECTED copy: `This submission could not be completed. If you are not sure what you can add to at the moment, look at your permissions.` | ❌ **STILL OPEN** — the string is at `SupporterApp.tsx:149`, unchanged. This is the most serious item in the list: it is a privacy leak, not a wording preference |
| C-2 | `StaffSafetyTriagePanel.tsx`: the disposition is a `<select>` whose first and therefore default option is "Close as not a safety event" | **A default value amounts to a triage conclusion nobody chose**, breaking both "nothing pre-selected" and "closing and converting carry equal weight" | Replace with a `<fieldset>` radio group with nothing pre-selected, four options (close / keep watching / escalate / convert to an event) | ❌ **STILL OPEN** — the `<select>` is at line 81 and `DISPOSITIONS[0]` is still the closing option |
| C-3 | `StaffSafetyTriagePanel.tsx`: the confirm button is named `Confirm` | Breaks "a confirm button must name the action" | Rename to `Confirm and record the disposition` | ❌ **STILL OPEN** — line 119 is still a bare `Confirm` |
| C-4 | `StaffModeratorPanel.tsx`: the disposition was a `<select>` defaulting to "warning" | Same as C-2 | Replace with a radio group with nothing pre-selected | ✅ **DONE** — the panel now renders one button per decision from a `CHOICES` table, each stating its effect beside the control rather than in a tooltip, and nothing is chosen until a button is pressed |
| C-5 | `StaffModeratorPanel.tsx`: the confirmation says only that it cannot be changed | **No appeal route and no reversibility line** (a non-negotiable constraint) | Adopt the seven-line confirmation body from §E4, including the "appeal" and "reversibility" lines | ❌ **STILL OPEN** — the dialog carries the label, the effect, and "It is written to the audit trail in your name and cannot be changed", and stops there. Stating immutability while offering no way out is precisely what rule 5 of §1.3 forbids |
| C-6 | `StaffModeratorPanel.tsx`: the queue card renders `reportDescription` directly (the reporter's own account) | **The reporter's own account may contain identifying information about them, and it appears at the queue level** | Show only `reportCategory` at the queue level; move the account itself into E3's collapsed-by-default area | ❌ **STILL OPEN** — line 124 renders `Reported as {reportCategory}: {reportDescription}` on the card. This is the §6 reporter-protection surface, and the queue is the screen §E2 identifies as the highest-risk one |
| C-7 | `SupporterApp.tsx`: the status label puts "not their own testimony" inside a parenthesis | A parenthesis is a typographic signal that can be skipped over | Make it a field of its own, `Is this the person's testimony: no`, on every card | ❌ **STILL OPEN** — line 75 is still `Accepted (recorded as your contribution, not as their own testimony)` |
| C-8 | `App.tsx` / `StaffApp.tsx`, the development stub sign-in | The stub had one sentence and did not say that the identity entered is never verified | Adopt the §H1 warning block (`role="alert"`, with its four consequences) | ⚠️ **PARTLY DONE** — `App.tsx:213–215` now says "Development sign-in stub… Nothing here verifies who you are — this is not authentication (ADR-104)", which covers the core omission. It is not yet the §H1 block with all four consequences enumerated |
| C-9 | Every panel: errors showed only `Not successful: {code}` | Breaks §231 (does not say what was saved, what did **not** happen, or how to recover) | Adopt the §1.2 generic ERROR structure plus each screen's own additional sentence | ✅ **DONE** — the panels call `staffLoadError` / `staffActionError` from `errors.ts`, which separates a failed read from a refused command and states the reason and the next step |

### 8.2 Suggested (not errors, but short of the specification)

| # | Location | Suggestion |
|---|---|---|
| S-1 | The queue loads from a manual button (`View open cases`) | Keep the manual button (it suits intermittent use) but load once automatically on entering the panel, and rename it `Refresh the queue` — **this change would break existing tests**, so it is listed as a suggestion pending product confirmation |
| S-2 | Case and signal identifiers are typed into a text field | Fill them in automatically on clicking through from the queue and show them as a read-only summary; keep manual entry in a collapsed "development environment" area |
| S-3 | Every panel has a single `role="status"` announcement region | Keep it, but errors should also use `role="alert"` (severity grading, §232) |
| S-4 | `styles.css` has no tokens | Delivered by A1–A9; the tokens this file references are listed in §1.7. *(This row is itself out of date: the stylesheet has had tokens since 2026-08-04 and now carries 133 of them.)* |

---

## §9 设计取舍（已决定，附理由）

| # | 取舍 | 决定 | 理由 |
|---|---|---|---|
| T-1 | 举报人自述：完全不给 vs 默认折叠 | **默认折叠 + 警示 + 审计** | 完全不给会让处置失去必要语境（Doc 20 §187 要求 report summary 与 evidence），导致审核者转而去翻更多历史——反而扩大暴露面。折叠 + 审计是可检验的中间态 |
| T-2 | 举报时间：完全隐藏 vs 区间 | **区间（<24h / 1–3 天 / >3 天）** | 完全隐藏会使处理时限与老化管理失效（§39 要求 ageing cases）。区间保留了运营能力，切断了精确推断 |
| T-3 | 安全分诊结论：3 项（Doc 20 §196 是 4 项）vs 4 项 | **4 项（关闭 / 继续观察 / 升级 / 转为事件）**；现有实现只有 3 项（缺「继续观察」） | §196 明列 Monitor。缺了它会把「还不确定」挤进「关闭」或「升级」，人为制造二元判断 |
| T-4 | 安全屏密度：密集档（更多信息一屏内）vs 标准档 | **标准档** | 安全工作区优化的是「不出错」，不是「看得多」。§20 的 urgency 指响应速度，不是屏幕密度 |
| T-5 | 支持者工作区密度 | **参与者宽松档** | 支持者常常也是老年配偶或同龄亲友；按「非参与者=员工密度」处理是错误假设 |
| T-6 | 「转给安全团队」的位置：审核决定之内 vs 与决定并列 | **并列且等权** | 放进决定选项里会让它成为「一种处置」，从而与审核处置互斥；实际上两条线必须各自独立进行（§194） |
| T-7 | 恢复（F6-b）：一键恢复 vs 七项逐条确认 | **七项逐条确认** | §203 列举了七个前置条件；把它们做成一个按钮等于让界面替人断言这些条件已满足 |
| T-8 | 紧急限制说明：每屏重复 vs 只在帮助页 | **每屏重复（共用组件，内容一致）** | 安全屏的使用场景就是「出事的时候」，此时没有人会去翻帮助页 |
| T-9 | H1 登录桩：做得像真登录（利于演示）vs 明确标注为桩 | **明确标注为桩** | THREAT_MODEL 把无认证列为固有高风险；界面必须主动对抗误解。演示美观让位于诚实 |
| T-10 | 空队列文案：正向鼓励 vs 中性 | **中性** | 祝贺式空态（「全部处理完，太棒了！」）会奖励清空队列的行为，对审核与安全是直接的判断污染 |
| T-11 | 计数在 LOADING 时显示 0 vs 显示 `…` | **显示 `…`** | 「未读到」不是「零」。安全/审核场景下这个区别是安全关键的 |
| T-12 | 骨架屏 | **队列、决定、处置、批准一律禁用** | §225 明确列出：骨架屏不得模仿 approval / Safety decision |

---

## §10 未决项（需产品 / 伦理 / 法务决策，本文件不擅自决定）

| # | 未决项 | 影响的界面 | 需要谁决定 | 阻塞程度 |
|---|---|---|---|---|
| U-1 | **紧急联系渠道的具体内容**：F6-c 中的当地紧急电话号码与危机支援服务名称，取决于部署地区；Doc 20 §204 要求「Emergency wording must be approved for the Conceptual Prototype setting」 | F1、F3、F6、D6、H4、参与者帮助屏 | 伦理审查 + 部署地区法务 | **高**：占位文字不能上线，即使是原型 |
| U-2 | **概念原型阶段是否显示「值班响应」承诺**：当前无真实值班，但界面若完全不写，安全屏会失去「下一步」；若写了，可能被误解为真实服务 | F1、F3、F6、D6 | 产品 + 伦理 | 高 |
| U-3 | **H1 的 FORBIDDEN 文案在真实部署时必须改为通用式**：合成环境下「这个标识没有任何工作区权限」是有用的调试信息，真实环境下它是账号枚举 | H1 | 安全 + 产品 | 中（部署前必须解决） |
| U-4 | **举报人是否以及何时被告知处置结果**：§193 允许「Action Taken where disclosure is permitted」，但「permitted」的判定标准未定义 | D6、参与者报告中心、E4 | 产品 + 法务 | 中 |
| U-5 | **既往处置的显示窗口取 12 个月**：本文件按比例原则暂定，Doc 20 未规定具体窗口 | E3 | 产品 + 审核政策 | 中 |
| U-6 | **申诉期限取 14 天**：Doc 20 §191 要求有申诉但未规定期限 | E4、E5 | 产品 + 法务 | 中 |
| U-7 | **「独立复核人」的定义**：§191 要求 independent reviewer「where required」；当前只实现了「非原决定人」这一条 | E5 | 产品 + 治理 | 中 |
| U-8 | **支持者协助记录的可见性**：D5 假定本人可见；Doc 20 §183 只说「records assistance when relevant to fidelity」，未说谁可见 | D5 | 研究设计 + 伦理 | 中 |
| U-9 | **支持者访问被撤销时的通用原因文案**：§185 允许「generic reason where appropriate」，但「appropriate」未定义；本文件采取最保守解释（不给具体原因） | D6-b | 产品 + 隐私 | 低 |
| U-10 | **通知边界**：恢复（E5）与暂停（F6）时谁被通知、通知内容多详细，涉及 I18 通知策略（本文件范围外） | E5、F5、F6 | 产品 + I18 设计负责人 | 中 |
| U-11 | **S-1 的队列自动载入**：改变现有可访问名会破坏测试，需产品确认是否接受这次测试改动 | E2、F2 | 产品 | 低 |
| U-12 | **安全事件的严重度与类别取值表**：F4/F5 的必填字段需要受控词表，当前后端枚举与 Doc 20 未完全对齐 | F4、F5 | 研究设计 + 后端 | 中 |
| U-13 | **审核处置的「比例说明」是否必填**：本文件设为必填（§189 列出 proportionality），会增加审核者负担 | E4 | 产品 + 审核政策 | 低 |

---

## 附：本文件覆盖清单

| 组 | 单元 | 状态 |
|---|---|---|
| D | D1 支持者首页 / D2 邀请与权限复核 / D3 贡献提交 / D4 贡献状态列表 / D5 共享活动支持 / D6 报告关切与访问被撤销 | 6 / 6 |
| E | E1 审核仪表盘 / E2 报告队列 / E3 案件详情 / E4 决定与确认 / E5 申诉与恢复 / E6 审核→安全联动 | 6 / 6 |
| F | F1 安全仪表盘 / F2 信号队列 / F3 人工分诊 / F4 关闭与转换 / F5 安全事件与动作 / F6 暂停恢复与紧急限制 | 6 / 6 |
| H | H1 登录身份入口 / H2 安全邀请落地页 / H3 账户激活 / H4 公开研究信息 / H5 无障碍声明 | 5 / 5 |
| | **合计** | **23 / 23** |
