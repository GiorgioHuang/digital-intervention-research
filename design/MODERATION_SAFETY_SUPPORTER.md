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

**Purpose / the questions it answers**

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

**Confirmation copy in full**

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

**State matrix**

| State | Presentation and copy in full |
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

**Accessibility points**

- The "you can help with" and "must be her" columns stack vertically on mobile, each with its own subheading, rather than using a table layout.
- After the record is confirmed it announces: `Your help has been recorded.`

---

### D6 Reporting a concern / the access-revoked state

> These are two interfaces that must live in one place and **must never explain each other**: a report is something a supporter initiates; revoked access is the person's own decision, and its reason **must not** be disclosed to the supporter.

**Purpose / the questions it answers**

- What kind of thing am I worried about, and which route does it take?
- Where do I go in an emergency? (the answer: not here)
- My access is gone — what can I do now?

**D6-a report a problem · wireframe**

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

── With deadlines ─────────────
Appeals awaiting review      2  · nearest deadline: in 3 days
Restoration reviews          1

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

**Wireframe**

```
<h1>Record the decision · case MC-1043</h1>

Once recorded, a decision is written to the audit trail and can be
neither changed nor deleted. If a record is wrong, it can only be
dealt with through the appeal or restoration process, and the
original record is kept.

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
- After a successful record it announces: `The decision has been recorded in your name and cannot be changed. The case has been removed from the queue.`

---

### E5 Appeals and restoration

**Purpose / the questions it answers**

- What was the original decision, and on what basis?
- What has the appellant said?
- Am I allowed to review this one? (the conflict-of-interest check)
- What is restored, and what is not?

**Wireframe**

```
<h1>Appeal review · AP-233</h1>

── Conflict-of-interest check ──
Original decision by: M-004
You: M-011
✓ You took no part in the original decision, so you may review it.
(If they match it shows: ✗ You made the original decision and
  cannot review this appeal. [Hand to another reviewer])

── The original decision (cannot be changed) ──
Case MC-1043 · content hidden
Rule: community rules v3, clause 4
When: 2026-07-30 · decided by: M-004
Reason: «as written»
🔒 This record is kept whatever this review concludes.

── The appellant's statement ──
«as written»
Submitted: 2026-08-01

── Material the appellant added ──
[✓] 1 screenshot (passed scanning)
Nothing unrelated to this appeal is shown.

── Review conclusion ──────────
( ) Uphold the original decision
( ) Change the disposition: [dropdown]
( ) Overturn the disposition and restore the content
Reason (mandatory):
┌────────────────────────────┐
└────────────────────────────┘

        [Record the review conclusion]
```

**Restoration sub-screen (§192)**

```
<h1>Restore · MC-1043</h1>

To be restored: community post SP-7781 (version 2)
After restoring: the post is visible again to its original audience
Restrictions still in force: none
Takes effect: immediately
Will be notified: the author
Will not be notified: whether the reporter is notified is governed by the
          notification policy; this screen shows nothing about the reporter
The original decision record: kept, not deleted  🔒
```

**Confirmation copy in full**

```
Record the review conclusion "overturn the disposition and restore the content"?

Object: the disposition "hide the content" on case MC-1043
Effect: post SP-7781 becomes visible again to its original audience
Still kept: both the original decision record and this review record are
      kept, and neither is deleted or rewritten
They will see: "Your appeal has been reviewed, the original disposition has
      been overturned, and the content has been restored."
Reversibility: this review record cannot be changed
Audit: written to the audit trail in your name  🔒

[Confirm and record the review conclusion]        [Go back and change it]
```

**State matrix**

| State | Presentation and copy in full |
|---|---|
| LOADING | `Loading the appeal…` |
| EMPTY | `There are no appeals waiting for review. This is a normal state.` |
| ERROR | The generic ERROR copy + `Neither the original decision nor the appeal has been changed.` |
| FORBIDDEN | Refused for conflict of interest: `You made the original decision on this case and cannot review your own decision. Nothing has gone wrong — this is separation of duties. [Hand to another reviewer]` |
| PROTECTED | The generic PROTECTED copy |

**Accessibility points**

- The result of the conflict-of-interest check is **the first thing on the page**, announced once via `role="status"` when loading completes.
- ✓/✗ must carry words (`you may review this` / `you cannot review this`) and never stand as symbols alone.
- The "original decision" block uses a `<blockquote>` with an explicit heading, semantically separated from the "review conclusion" form, so a screen reader does not run the two reasons together.

---

### E6 The moderation → safety handover

**Purpose / the questions it answers**

- Could what I am looking at be a safety concern?
- What happens after I submit? (the answer: a person on the safety team assesses it; **no safety event is confirmed by this**)
- Do I still carry on with my moderation disposition? (the answer: yes — the two lines run independently)

**Wireframe**

```
<h1>Hand to the safety team · case MC-1043</h1>

This creates a **safety signal**.

A safety signal = a lead awaiting assessment
A safety event = something a safety reviewer has confirmed

After submitting:
· a safety reviewer assesses it, in person
· **no safety event exists now, and none is created automatically**
· your moderation disposition is not paused by this;
  the two lines run independently

── What you observed (the minimum necessary) ──
Category: ( ) risk of self-harm  ( ) being threatened
      ( ) possible fraud or financial abuse
      ( ) deteriorating health  ( ) something else
Your description (mandatory; write only what you
actually saw, not what you infer or diagnose):
┌────────────────────────────┐
└────────────────────────────┘

Linked to: this case, MC-1043 (attached automatically)
Not attached: that account's research data, assessment
          results, or message content

        [Create a safety signal]
```

**Confirmation copy in full**

```
Create a safety signal?
· This is a lead awaiting assessment, not a confirmed safety event
· A safety reviewer assesses it in person; the system never confirms an event automatically
· What is attached: your description and the link to case MC-1043
· What is not attached: that account's research data, assessment results, or message content
· Your moderation disposition is unaffected and still needs you to carry on with it
· Once written, this signal cannot be changed  🔒
[Confirm and create the safety signal]        [Go back]
```

**State matrix**

| State | Presentation and copy in full |
|---|---|
| LOADING | `Submitting…` |
| EMPTY | With no linked signals: `This case has no safety signals linked to it.` |
| ERROR | `The safety signal could not be created. What you wrote is still here. **No signal was created.** If this needs dealing with immediately, contact the safety duty contact directly using "safety duty contact details". [Try again]` |
| FORBIDDEN | `Your role cannot create safety signals. Nothing has gone wrong. Please pass it on through "safety duty contact details".` |
| PROTECTED | The generic PROTECTED copy |

**Accessibility points**

- The definition "a signal is not an event" sits **before** the form, as a permanent paragraph rather than a collapsed one.
- The error state must offer a route **outside the platform** (the duty contact details), because this is a safety-critical error (§236: never offer false reassurance).

---

## §4 F. Safety workspace (F1–F6)

> The hard constraints running through this group:
> **(1) A safety signal is not a safety event.** They are counted separately, sit in separate sections, and carry different badge shapes; converting a signal into an event is a **human + MFA** action.
> **(2) "Close as not a safety event" and "convert to a safety event" must be equally reachable and neutrally worded.** Both are legitimate conclusions, and the interface must not make either direction look like the "safer" or "more responsible" one.
> **(3) The platform is not an emergency service.** Every safety screen must reach "the realistic next step available right now" within one interaction.

### F1 Safety dashboard

**Purpose / the questions it answers**

- How many **unconfirmed signals** are there, and how many **confirmed events**? (counted separately)
- Is anything past its response deadline?
- Is anyone, or any feature, currently suspended?
- Has any escalation contact failed?

**Wireframe**

```
<h1>Safety dashboard</h1>

A signal is a lead awaiting assessment; an event is something a person has confirmed.
They are counted separately and must never be added together.

── Safety signals (unconfirmed) ──
Not yet triaged        5
Past the response deadline   1
[Open the signal queue]

── Safety events (confirmed) ──
In progress            2
Actions overdue        1
[View safety events]

── Currently suspended ────────
Participants suspended   1
Features suspended       2 (matching, messages)
[View suspensions and restoration]

── Escalation ─────────────────
Failed escalation contacts   0
[The escalation contact list]

────────────────────────────
⚠ This platform is not an emergency service.
When something needs immediate intervention, use the real-world
channels in the "escalation contact list"; nothing inside the
platform happens immediately.
```

**State matrix**

| State | Presentation and copy in full |
|---|---|
| LOADING | Counts show `…` and **never 0**. Copy: `Reading…  (no number is shown until it has been read, so that unknown is never mistaken for zero)` |
| EMPTY | `There are no untriaged signals and no safety events in progress. This is a normal state.` (congratulatory wording is forbidden) |
| ERROR | `The safety counts could not be read. This does not mean there are no signals or events waiting. Please try again; if it keeps failing, confirm verbally through the duty process. [Try again]` |
| FORBIDDEN | `Your role cannot view the safety dashboard. Nothing has gone wrong. The safety and moderation queues are separated by role.` |
| PROTECTED | The dashboard is aggregate only and involves no individual object |

**Accessibility points**

- "Signals" and "events" are two `<section>` elements each with its own `<h2>`, so a screen reader cannot run the two sets of numbers together.
- A count and its meaning share one accessible name: `Open the signal queue (5 untriaged signals)`.
- The note about what this is not for is permanently in the footer position, as `role="note"`.

---

### F2 The SafetySignal queue

**Purpose / the questions it answers**

- Which one is most urgent, and how much response time is left?
- Did it come from a person or from an automated system?
- Whose responsibility is it?
- **The question it must not answer: what diagnostic conclusion this signal implies.**

**Wireframe**

```
<h1>Safety signals awaiting triage</h1>

These are all **unconfirmed signals**.
An automated system can only raise a signal; it can never create a safety event.

Sort: urgency → response deadline

┌────────────────────────────┐
│ [Signal · unconfirmed] SS-2210 │
│ Urgency: high (words + icon) │
│ Category: possible mention of self-harm risk │
│ Source: submitted by the participant │
│ Scope: participant P-118 ·   │
│       research project RP-3  │
│ Received: 4 hours ago        │
│ Owner: unclaimed             │
│ Response deadline: 4 hours left │
│ Summary (the minimum necessary): │
│   «a one-sentence summary»   │
│           [Start triage]     │
└────────────────────────────┘

┌────────────────────────────┐
│ [Signal · unconfirmed] SS-2211 │
│ Source: [raised automatically · not confirmed by a person] │
│ Automated classification: possible fraud script │
│ A possibility offered by an automated system is not a conclusion. │
│           [Start triage]     │
└────────────────────────────┘
```

**State matrix**

| State | Presentation and copy in full |
|---|---|
| LOADING | `Loading the signal queue…` (skeleton screens forbidden: §225 lists Safety decision explicitly) |
| EMPTY | `There are no signals awaiting triage. This is a normal state. New signals will appear here, ordered by urgency.` |
| ERROR | `The signal queue could not be fetched. **This does not mean there are no signals waiting.** Please try again; if it keeps failing, confirm through another channel under the duty process and do not treat this screen as authoritative. [Try again]` |
| FORBIDDEN | `Your role cannot view the safety signal queue. Nothing has gone wrong.` |
| PROTECTED | `This content cannot be shown. This signal may have been triaged by somebody else. Go back to the queue and carry on.` |

**Accessibility points**

- Urgency: the word `high` + a triangle icon + `--color-warning` (three redundant channels); a red row background **must not** be the only marker.
- Where the source is automated, the accessible name begins `Signal raised automatically, not confirmed by a person`, so a screen reader hears the qualifier before the classification.
- The response deadline gives relative and absolute time: `4 hours left (until 2026-08-03 18:00)`.

---

### F3 The human triage view

**Purpose / the questions it answers**

- What is the minimum background I need to know?
- What are this person's current consent and suspension states? (they determine what I can do)
- What conclusions are available? They are equally legitimate.
- What is the realistic next step I should take right now?

**Wireframe**

```
<h1>Triage · SS-2210</h1>
[Signal · unconfirmed]  Response deadline: 4 hours left

⚠ This platform is not an emergency service.
If you judge there is immediate danger: contact the real-world
channels through "escalation contacts" first, then come back
and record the disposition.
              [The escalation contact list]

── The minimum necessary background ──
Source: submitted by the participant under "safety concerns"
When: 2026-08-03 10:12
As written: «…»
Related content cited: message M-9921 (1)
  Only content related to this signal is cited.

── Current state (it determines what you can do) ──
Consent: messages = allowed · matching = allowed · AI = not applicable
Suspension: none
Previous safety history: 1 closed signal in the past 12 months
  · 2026-02-11 · closed as not a safety event
  Research or assessment data unrelated to safety is not shown.

── What the automated system suggests (if anything) ──
[Raised automatically · not confirmed by a person]
Possible relevance: wording associated with self-harm risk
This is a prompt. It is not a judgement, and it is not a diagnosis.

── Conclusion (choose one of four; all equally legitimate) ──
( ) Close: not a safety event
( ) Keep watching
( ) Escalate: needs higher-level review
( ) Convert to a safety event ⚑ (requires MFA)

Reason (mandatory for all four conclusions):
┌────────────────────────────┐
└────────────────────────────┘

        [Record the disposition]
```

**The specific measures that keep this neutral (the constraint this group breaks most easily)**

| Measure | Rule |
|---|---|
| Ordering | The four conclusions run in the natural order of increasing impact, with **no visual grouping**; "convert to an event" is not set apart at the bottom or separated by a rule |
| Visual weight | All four options share font size, line height and spacing exactly; `convert to a safety event` carries only the extra ⚑ MFA marker and **no danger colour** |
| Wording | `Close: not a safety event` — never "no action needed", "false alarm" or "ruled out"; `convert to a safety event` — never "danger confirmed" or "case opened" |
| Symmetric requirements | All four require a reason, with the same minimum length; requiring an explanation **only** for "close" is forbidden |
| Symmetric confirmation | All four go through the **detailed confirmation tier**, with an identical structure |
| Nothing pre-selected | The radio group pre-selects nothing. The current implementation's `<select>` defaults to "close: not a safety event", which is a substantive default leaning, and must be changed (§8, C-2 — still open as of 2026-08-16) |

**State matrix**

| State | Presentation and copy in full |
|---|---|
| LOADING | `Loading the signal…`; the conclusion area is `disabled` until the background has loaded: `You can record a disposition once the background has loaded.` |
| EMPTY | With no related content cited: `This signal has no platform content linked to it. That does not prevent you reaching a conclusion — you can judge on the source statement alone.` |
| ERROR | A safety-critical error: `The background for this signal could not be loaded. **Do not make a disposition from impression.** Please try again; if it keeps failing, verify through another channel under the duty process. [Try again] [The escalation contact list]` |
| FORBIDDEN | `Your role cannot triage safety signals. Nothing has gone wrong. Please pass it on through "the escalation contact list".` |
| PROTECTED | `This content cannot be shown. This signal may have been triaged by somebody else. Go back to the queue and carry on.` |

**Accessibility points**

- The note about what this is not for is the **second element on the page** (immediately after the `<h1>`), as `role="note"`, and is not collapsible.
- The four conclusions sit in `<fieldset><legend>Conclusion (all four are equally legitimate and all require a reason)</legend>` — the legend itself carries the statement of neutrality.
- The MFA notice is announced through `aria-live="polite"` when that option is selected, rather than interrupting with a dialog.

---

### F4 Closing as not a safety event / converting to a safety event

> Both directions share **one confirmation template**, differing only in content. This is how "equally reachable, neutrally worded" is actually delivered: an isomorphic confirmation body is itself the evidence of neutrality.

**Confirmation copy in full — closing as not a safety event**

```
Record signal SS-2210 as "close: not a safety event"?

Object: safety signal SS-2210 (participant P-118)
Conclusion: does not constitute a safety event
Reason: «the reason you wrote»
Follow-up support: [ ] arrange further observation  [ ] refer to research support
      [ ] no follow-up needed
They will see: by default the person is not notified; if you tick
      "tell the person", they will see
      "the safety concern you raised has been looked at by the safety team"
The signal is kept: the original signal is kept in full and is not deleted
Reversibility: this disposition record cannot be changed. If something new
      comes up later, raise a new signal rather than rewriting this one
Audit: written to the audit trail in your name  🔒

[Confirm and record the disposition]        [Go back]
```

**Confirmation copy in full — converting to a safety event (MFA)**

```
Convert signal SS-2210 into a safety event?

Object: safety signal SS-2210 (participant P-118)
Conclusion: confirmed as a safety event
Category: {mandatory}   Severity: {mandatory}
Relationship to the intervention: {mandatory: related / possibly related / unrelated / cannot be determined}
Interventions or features affected: {mandatory}
Immediate action: {choose at least one, or explicitly choose "no action for now"}
Monitoring arrangement: {mandatory}
Reporting requirement: {yes/no, and on what basis}
Owner: {you}
Reason: «the reason you wrote»
The signal is kept: the original signal is kept in full
Reversibility: this record cannot be changed. The event itself can be closed
      later, but it is never deleted
Authentication: this action requires MFA-tier authentication ⚑
Audit: written to the audit trail in your name  🔒

[Confirm and convert to a safety event]        [Go back]
```

**The checkable test of "equally reachable"**

1. The two actions are in the same radio group, the same DOM distance apart, with no separating element between them.
2. The two confirmation dialogs differ by ≤ 2 field rows and are **isomorphic line by line** (object / conclusion / reason / what is kept / reversibility / audit all align).
3. The two confirm buttons match in accessible-name length and visual size and use the same colour token (`--color-action-primary`); **neither uses `--color-danger`**.
4. The number of interactions from "start triage" to either confirmation is the same (choose → write the reason → record → confirm = 4 steps).

**State matrix**

| State | Presentation and copy in full |
|---|---|
| LOADING | While submitting: `Recording the disposition…`, with the button `disabled` |
| EMPTY | Not applicable |
| ERROR | `The disposition could not be recorded. What you wrote is still here. **The signal is still untriaged and still needs dealing with.** Please try again. [Try again]` — it must not leave anyone believing it is finished |
| FORBIDDEN | Insufficient MFA: `Converting to a safety event requires MFA-tier authentication and you are at the password tier. **Nothing has been changed and the signal is still untriaged.** You can sign in again with MFA and then handle it, or choose "escalate: needs higher-level review" to pass it to somebody who holds the permission.` |
| PROTECTED | `This content cannot be shown. This signal may have been triaged by somebody else.` |

**Accessibility points**

- The MFA requirement is stated **when the option is selected** (the current implementation already has a `role="note"` for this; keep it), never as a failure after submission.
- The confirmation dialog uses a `<dl>` structure with `aria-describedby` pointing at the whole list; focus lands on the title on entry.
- After a successful record it announces: `The disposition has been recorded. Signal SS-2210 is closed as not a safety event.` or `The disposition has been recorded. Safety event SE-0042 has been created.`

---

### F5 The SafetyEvent view and safety actions

**Purpose / the questions it answers**

- What has this event confirmed? (category, severity, relationship)
- What actions exist now, who owns them, and are they done?
- What monitoring and suspension state is it in?
- What has happened on the timeline?

**Wireframe**

```
<h1>Safety event SE-0042</h1>
[Safety event · confirmed]   Owner: S-003

── What was confirmed ─────────
Category: risk of self-harm
Severity: medium
Relationship to the intervention: possibly related
Affected: messaging, matching
Confirmed by: S-003 · 2026-08-03 14:20
Originating signal: SS-2210 [View]

── Actions ────────────────────
┌────────────────────────────┐
│ Contact the participant      │
│ Permission: safety reviewer  │
│ Status: done · S-003 ·       │
│       2026-08-03 15:02       │
└────────────────────────────┘
┌────────────────────────────┐
│ Suspend matching             │
│ Permission: safety reviewer ⚑│
│ Status: in progress · review 8-10 │
│         [View suspension detail] │
└────────────────────────────┘
┌────────────────────────────┐
│ Notify the approved contacts │
│ Status: not started · 1 day overdue ⚠ │
│         [Record this action] │
└────────────────────────────┘

[Add an action]

── Monitoring ─────────────────
Current: daily review · next 2026-08-04
[Change the monitoring arrangement]

── Timeline ───────────────────
(shows only records relating to this event)
2026-08-03 14:20 event confirmed · S-003
2026-08-03 15:02 participant contacted · S-003
2026-08-03 15:10 matching suspended · S-003
🔒 the timeline is append-only and cannot be changed
```

**State matrix**

| State | Presentation and copy in full |
|---|---|
| LOADING | `Loading the safety event…` |
| EMPTY | With no actions: `No actions have been recorded on this event yet. If no action is genuinely needed, add a "no action for now" with your reason — blank is not the same as judged.` |
| ERROR | `The full details of this safety event could not be loaded. **Do not take this as meaning the actions are complete.** Please try again. [Try again]` |
| FORBIDDEN | `Your role can see this event but cannot record safety actions. Nothing has gone wrong.` |
| PROTECTED | The generic PROTECTED copy |

**Key interactions and confirmation copy**

```
Record the action "notify the approved contacts" as done?
· Object: safety event SE-0042
· What is recorded: the action's name, when it was completed, and your name
· What is not recorded: anything specific said in a call or conversation
· Once written this record cannot be changed; to correct it,
  add a correction record — the original is kept  🔒
[Confirm and record]        [Go back]
```

**Accessibility points**

- Severity and relationship are both words (`medium`, `possibly related`) and must never be a colour scale alone (§200: an alert colour must not carry it by itself).
- Each action card is an `<li>` + `<dl>`, with the status inside the accessible name: `Record this action (notify the approved contacts, not started, 1 day overdue)`.
- The timeline is an `<ol>`, with times in `<time datetime>`.

---

### F6 Suspension / restoration and the emergency-limitation notice

**Purpose / the questions it answers**

- What is the **smallest scope** I need to suspend? What does the person still have afterwards?
- Who owns it, and when is it reviewed?
- What has to be satisfied before restoring?
- What does the person themselves see?
- In an emergency, what is the realistic next step?

**F6-a suspension · wireframe**

```
<h1>Suspend · participant P-118</h1>

Prefer the smallest scope that achieves the purpose.
Suspending everything is usually not necessary.

── Scope (multiple choice, smallest first) ──
[ ] Suspend matching
[ ] Suspend messages with a particular connection
[ ] Suspend all messages
[ ] Suspend AI features (globally disabled in this prototype)
[ ] Suspend a particular intervention component
[ ] Suspend all of the participant's platform activity ⚑

── What you will see once you choose ──
Effects taking hold immediately: «updates live as you tick»
The person can still: view and withdraw consent,
  view their own content, export, contact research support,
  and use "Help and safety"
Reason category: [dropdown, mandatory]
Review date: [date, mandatory]
Owner: you (S-003)
How it is lifted: see the "restoration" process; it needs review and approval

        [Record the suspension]
```

**F6-b restoration · wireframe**

```
<h1>Restore · participant P-118</h1>

Restoration is confirmed item by item. There is no one-click restore.

[ ] The review is complete (review record: ____)
[ ] Any corrective measures needed are complete
[ ] Confirmed that the person's current consent is still valid
[ ] Confirmed that the person still meets the participation criteria
[ ] Confirmed that the relevant features are in a usable state
[ ] The person has been spoken to and told about the restoration
[ ] Approval has been obtained (approver: ____) ⚑

The original suspension record: kept, never deleted  🔒

        [Record the restoration]
```

**F6-c the emergency-limitation notice (this platform is not an emergency service)**

This notice is a **shared component**, appearing in: the F1 footer, the top of F3, both F6 screens, the participant's "Help and safety" screen, the D6 reporting screen, and the H4 public information page. The content is identical everywhere and must not be shortened or edited for a particular context:

```
┌────────────────────────────┐
│ This platform is not an emergency service │
│                            │
│ Nothing here happens immediately.          │
│                            │
│ If somebody is in immediate danger:        │
│ · call your local emergency number         │
│ · or contact your local crisis support     │
│   «placeholder: the specific number and    │
│    service name must be filled in for the  │
│    deployment region and approved by       │
│    ethics review — see §10»                │
│                            │
│ What the research team can do:             │
│ · respond to safety concerns raised in the │
│   platform, weekdays 09:00–17:00           │
│ · have a person look at every safety signal│
│ · suspend the relevant features if needed  │
│                            │
│ What the research team cannot do:          │
│ · provide medical or psychological treatment│
│ · attend in person or make contact instantly│
│ · stand in for the emergency services      │
└────────────────────────────┘
```

> **The honest marking required in the conceptual research phase**: this prototype is a synthetic-data environment, and "what the research team can do" above is, at this stage, **behaviour of the future system being modelled**. The participant-facing version must add: `This is a research prototype demonstration environment. There are no real participants and no real duty response.` (See open item U-6 in §10: on a real deployment that sentence must be removed, and the emergency numbers must be settled by ethics review.)

**State matrix (both F6 screens)**

| State | Presentation and copy in full |
|---|---|
| LOADING | `Loading the current suspension state…`; until it has been read, the suspend/restore buttons are `disabled`: `The current state has to be confirmed first, to avoid a duplicate suspension or a mistaken restoration.` |
| EMPTY | Nothing suspended: `No participants or features are currently suspended. This is a normal state.` |
| ERROR | Safety-critical: `This {suspension/restoration} could not be recorded. **The state has not changed** — {the previous state} is still in force. Please try again; if it keeps failing, act immediately under the duty process and do not treat this screen as authoritative. [Try again] [The escalation contact list]` |
| FORBIDDEN | `This action requires MFA-tier authentication / the approver role. Nothing has been changed.` |
| PROTECTED | The generic PROTECTED copy |

**Confirmation copy in full (suspension)**

```
Suspend the "matching" feature for participant P-118?

Object: participant P-118 · matching only
Immediate effect: no new match candidates are generated;
      existing connections and messages are unaffected
The person can still: view and withdraw consent, view their own
      content, export, contact research support, use Help and safety
Reason category: related to a safety event
Review date: 2026-08-10
Owner: S-003 (you)
They will see: "Your matching has been switched off for now.
      The research team will be in touch."
How it is lifted: it needs review, corrective measures and approval;
      there is no one-click restore
Reversibility: the suspension can be lifted; **this suspension record cannot be changed**  🔒

[Confirm and suspend matching]        [Go back]
```

**Accessibility points**

- The scope checkboxes run in order of increasing impact, with the `<legend>` reading `Scope (prefer the smallest necessary scope)`.
- The "what you will see once you choose" area is an `aria-live="polite"` preview of the effects, announcing one summary after a change rather than a long announcement on every tick.
- The seven confirmations on the restoration screen are checkboxes rather than a single button: **no one-click restore** is expressed in the interaction, not only in the copy.

---

## §5 H. Public and invitation surfaces (H1–H5)

> The shared constraint (§22): **these interfaces expose the least information possible.** An unauthenticated surface must never reveal whether a given person is a participant, has been invited, or has activated an account.

### H1 Sign-in / identity entry (currently the dev-header stub + the access-password banner)

**Purpose / the questions it answers**

- What environment is this? (the answer must be: the development environment of a research prototype)
- Is what I am typing authentication? (the answer must be: **no**)
- Which workspace am I going to?
- What is the access password, and why is it needed?

> **The easiest design mistake to make on this screen is to make the development stub look like a real sign-in.**
> A handsome sign-in card + a password field + a "Sign in" button leads an operator — and an audience at a demonstration, and a reviewer — to believe authentication exists. THREAT_MODEL lists "no real authentication" as an inherent high risk, and the interface must **actively work against** that misreading rather than stay neutral about it.

**Wireframe**

```
┌────────────────────────────────┐
│ ⚠ Development identity stub · not authentication │
│                                │
│ This environment has no identity authentication. │
│ The identifiers you type below **are not         │
│ verified** — the system simply believes whoever  │
│ you say you are.                                 │
│                                │
│ Therefore:                     │
│ · there is only synthetic data here, no real people │
│ · this environment must not be opened to the public │
│ · what you do here does not represent any real   │
│   authorisation or approval                      │
│                                │
│ Proper identity authentication (OIDC) is not yet │
│ implemented, pending ADR-104.  │
└────────────────────────────────┘

<h1>Healthy Ageing Research Platform (development environment)</h1>

── Choose the workspace to enter ──
( ) Participant
( ) Supporter
( ) Staff

── Enter the development-environment identifiers ──
(the fields shown follow the workspace chosen)

Participant:
  Account identifier (actor id)      [        ]
  Participant identifier (participant id) [    ]

Staff:
  Account identifier (actor id)      [        ]
  Claimed authentication strength    [dropdown]
    · password tier (MFA-tier actions will be refused)
    · MFA
  ⓘ This is the strength you **claim**, not a verified
    result. The server decides on the basis of it, but
    nothing has verified that you actually completed MFA.

        [Enter as this identity]

── The environment's access password ──
This environment sits behind a shared access password.
The password is **the door to the environment**, not your account:
· everybody shares the same password
· it does not distinguish between people, and it cannot be revoked for one person
· it is not a substitute for authentication

Access password  [••••••••]   [Save the password]
The password is stored only in this device's browser.

────────────────────────────────
[Public study information]  [Accessibility statement]  [Contact support]
```

**The structure left open for OIDC (replaceable without changing the information architecture)**

| Now (the stub) | Later (OIDC) | The structural guarantee |
|---|---|---|
| The "development identity stub" alert block at the top | Removed | It is a self-contained `<section role="alert">`, and deleting it does not affect the rest of the layout |
| The "choose a workspace" radio group | Kept, but driven by **the roles the server returns** (§28, role-aware navigation) | The selector component's interface is unchanged; only its data source moves from local state to the server |
| "Enter the development-environment identifiers" | Replaced by a single `[Sign in with your organisation account]` button | That block is a self-contained `<section>`, replaced whole |
| The "claimed authentication strength" dropdown | Replaced by the `authStrength` the server returns, displayed read-only | Authentication strength is always a **displayed value** in the UI, and never anything other than an editable input in the interim |
| "The environment's access password" | Kept or removed depending on the deployment | It is already a self-contained `AccessTokenGate` component |
| The context banner's "not real authentication" | Becomes "authenticated with an organisation account · {method}" | The banner slot is kept; only its content changes |

**State matrix**

| State | Presentation and copy in full |
|---|---|
| LOADING | This screen has no remote dependency and has no LOADING state. A fake loading animation **must not** be added to make it "feel like signing in" |
| EMPTY | Not applicable (no list). With the fields empty, `[Enter as this identity]` is `disabled` and says `Fill in the identifiers to continue.` |
| ERROR | The first request after entering fails: `Could not reach the service. The identifiers you typed are still here. The service may not be running, or the access password may be wrong. [Try again] [Check the access password]` |
| FORBIDDEN | The password is right but the identity holds no workspace permission: `This identifier holds no workspace permissions in this environment. Check that it is correct, or use an identifier issued for the synthetic environment.` (This is a synthetic environment with no enumeration risk; on a real deployment this copy must become the generic form — see §10 U-3) |
| PROTECTED | Not applicable to this screen; but any 404 **after entering** always takes the generic PROTECTED copy |

**The access-password banner (triggered; reuses the existing `AccessTokenGate`)**

Keep the existing copy (it is already honest) and add one sentence about the boundary:

```
This environment needs an access password
The server refused that request because the browser did not carry
this environment's access password. This has nothing to do with your
account or your permissions — it is the door to this research
prototype environment.
It is a shared password, does not distinguish between people, and is
not a substitute for authentication.
Access password [••••••]  [Save the password]
The password is stored only in this device's browser and does not travel in the page address.
```

**Accessibility points**

- The development-stub alert is a `<section role="alert" aria-labelledby>` and is **announced once on page load** — this is the only chance a screen-reader user has to hear "this is not authentication".
- The explanation of "claimed authentication strength" is bound to the `<select>` through `aria-describedby`, not set beside it as small text.
- The password input is `type="password" autocomplete="off"` with a visible `<label>`.
- When the workspace radio group changes, the appearance and disappearance of the fields below is announced through `aria-live="polite"`: `Switched to the staff workspace; an account identifier and an authentication strength are needed.`

---

### H2 The secure invitation landing page

**Purpose / the questions it answers**

- Who invited me, and what study is this?
- Why me?
- May I decline? (the answer must be: yes, with no consequences)
- Is this link safe, and how long is it valid?

**Wireframe**

```
(an unauthenticated surface · shows no personal information at all)

<h1>You have been invited to take part in a study</h1>

Invited by: «the name of the research organisation»
Study: «the study's name»
Invitation number: INV-… (the number only; never a name)

── Why you were invited ───────
«a paragraph: where from, and on what criteria»

── Taking part is entirely voluntary ──
· You may decline, and you do not have to give a reason
· Declining will not affect any service or care you receive
  now or in future
· You can read all the information before deciding
· You can change your mind at any time

── This invitation ────────────
Valid until: 2026-09-30
The link is for you alone; please do not forward it

[Read more]        [I do not want to take part]
Both choices are equally valid.

────────────────────────────
[Public study information]  [Contact support]  [Accessibility statement]
⚠ This platform is not an emergency service (explanation)
```

**Elements that must not appear (§92, avoids urgency pressure)**

- Countdown timers, "limited places", "closes today", or a progress-bar-style "you are 20% complete"
- A pre-selected "continue", or "I do not want to take part" rendered as small print
- Any name, address or health information shown before the identity has been verified

**State matrix**

| State | Presentation and copy in full |
|---|---|
| LOADING | `Loading the invitation…` |
| EMPTY | Not applicable |
| ERROR | `This invitation could not be loaded. It may be a network problem. You can try again, or contact research support (details below). [Try again]` |
| FORBIDDEN | Not applicable (an unauthenticated surface) |
| PROTECTED | **An invalid link, an expired one, one already used, and one that never existed — the copy must be identical for all four**: `This link cannot be used at the moment. If you did receive an invitation, contact research support to check. [Contact support]` |

**Accessibility points**

- "Taking part is entirely voluntary" is an `<h2>` block, not a footnote.
- The two choices are the same width and weight, and DOM order = visual order.
- The page declares `lang="en"`; an unauthenticated page still needs a skip link and visible focus.
  *(Corrected 2026-08-16: this said `lang="zh-CN"`, which was right when the interface was Chinese. Every interface string is English since D-9, and `apps/web/index.html` still declares `lang="zh-CN"` — so a screen reader applies Chinese pronunciation rules to English text, and a translation tool is told the page is in a language it is not. The document now states the correct value; the code fix is listed in §8.)*

---

### H3 Account activation

**Purpose / the questions it answers**

- How many steps are there, and which one am I on?
- Why does my identity have to be verified?
- Can somebody help me do it?
- What if I am on a shared device?
- What if I forget?

**Wireframe**

```
<h1>Set up your account</h1>
Step 2 of 3  ●●○

── Why this step is needed ────
We need to confirm that it is you setting up the account,
so that nobody else can take part in the study in your name.

── What to do in this step ────
Enter the one-time code you were sent.

Code  [      ]
        [Continue]
        [Did not receive a code?]

── Would you like someone to help? ──
Yes. You can ask somebody you trust to help you do this.
Helping does not give them any access to your account.
[About getting help]

── A note about shared devices ──
If other people also use this device:
[ ] This is a shared device
   Once ticked: your signed-in state is not kept on this device,
   the session ends automatically when you leave,
   and notifications show no detail.
```

**State matrix**

| State | Presentation and copy in full |
|---|---|
| LOADING | `Checking…` (the button is `disabled`; repeat submissions must not be allowed) |
| EMPTY | Not applicable |
| ERROR | `That code could not be verified. You have not been locked out and you can try again. If it keeps failing, [request a new code] or [contact research support].` — never blames the user, and always gives a next step |
| FORBIDDEN | Not applicable |
| PROTECTED | A wrong code / one already used / an expired one / no such account: **the copy is identical**: `This code cannot be used at the moment. You can request a new code, or contact research support.` |

**Accessibility points**

- The step indicator is both words (`Step 2 of 3`) and a graphic; dots alone are not enough.
- The code input is `inputmode="numeric" autocomplete="one-time-code"` and is a **single field**, not six separate boxes (separate boxes are extremely hostile to screen-reader users and to people with motor impairments).
- The shared-device explanation is associated with its checkbox through `aria-describedby`, and the effect of ticking it is announced via `aria-live`.
- The time limit (how long a code is valid) must be extendable or renewable (§296).

---

### H4 Public study information and support contacts

**Purpose / the questions it answers**

- What is this study, who is running it, and why?
- What happens to my data?
- How do I reach a person?
- **What stage is this thing actually at?** (this must be honest: a conceptual research prototype)

**Wireframe**

```
<h1>About this study</h1>

┌────────────────────────────┐
│ Current status: conceptual research prototype │
│                            │
│ This is a prototype of a research platform,   │
│ demonstrated with **synthetic data**.         │
│ · there are no real participants              │
│ · nobody is being recruited                   │
│ · ethics approval has not been obtained       │
│ · the consent and approval flows shown here   │
│   are design models of a future system        │
└────────────────────────────┘

── What this study is trying to answer ──
«a plain-language explanation»
[About the knowledge types]
  ⓘ Every conclusion shown on this site is marked with
    the kind of knowledge it is (observation / inference /
    design hypothesis / prototype observation, and so on).
    Synthetic or simulated results are never presented
    as empirical evidence.

── Who is running it ──────────
«the organisation, the lead, the funding source, the conflict-of-interest statement»

── What taking part involves ──
«plain language: how much time, what is involved, that you can leave»

── Your data ──────────────────
«what is collected, how long it is kept, who can see it, how to leave»

── Contact us ─────────────────
Research support: «email / telephone»
Hours: weekdays 09:00–17:00
Accessibility help: «channel»
Complaints and ethics questions: «an independent channel»

⚠ This platform is not an emergency service (the full explanation)
```

**State matrix**

| State | Presentation and copy in full |
|---|---|
| LOADING | A static page; normally no LOADING state |
| EMPTY | Not applicable |
| ERROR | `This page cannot be shown in full at the moment. You can still contact research support in these ways: «the statically embedded contact details»` — the contact details must be hardcoded in the page and must not depend on a request |
| FORBIDDEN | Not applicable (a public page) |
| PROTECTED | Not applicable |

**Accessibility points**

- The "current status" block is the first content on the page and is announced on load (this is the only safeguard against the prototype being mistaken for a running service).
- Contact details use `<address>`; a telephone number is a `tel:` link with the number itself visible as text.
- Every plain-language paragraph keeps a measure of ≤70 characters, with no unexplained jargon.

---

### H5 Accessibility statement

**Purpose / the questions it answers**

- What standard does this platform claim to meet?
- Where does it fall short? (this must be listed honestly)
- What do I do if I hit a barrier, and how soon will I hear back?
- What settings can I adjust?

**Wireframe**

```
<h1>Accessibility statement</h1>

── What we are aiming for ─────
WCAG 2.2 AA, and usability across seven modes of use
(vision / low vision / hearing / motor / cognitive load /
low digital literacy / intermittent use).

── How far we have got: partially conformant ──
Stated honestly: we have run baseline checks at the code level and
**have not completed testing with real users**, including with older
participants. We therefore cannot claim full conformance.

Done:
· content is not lost at 200% zoom
· every operable element has a visible focus indicator
· touch targets are ≥44 pixels and do not overlap
· the "reduce motion" system setting is respected
· changes of state are announced to screen readers

Not done:
· automated accessibility scanning is not yet in continuous integration
· an accessibility expert walkthrough has not been carried out
· assistive-technology lab testing has not been carried out
· real user testing with older participants has not been carried out
  (it requires ethics approval first)

── What you can adjust ────────
· Text size (four steps)
· Space between things (two)
· Contrast (standard / high)
· Movement (follow the system / reduced)
· Light or dark (follow the system / light / dark)
· Colour (standard / low stimulation, which removes the tinted backgrounds)
You choose these settings; they are **never** determined automatically
from your age.
[Open display and reading settings]
*(List corrected 2026-08-16: it previously named four settings including a
"simplified mode (less on each screen)". `data-simplify` was removed on
2026-08-13 — nothing set it and nothing carried the class it selected — while
light/dark and low stimulation were added later and were missing here. An
accessibility statement that lists a control the product does not have, and
omits two it does, misinforms exactly the reader who most needs it to be
accurate.)*

── If you hit a barrier ───────
Please tell us. We record it as a defect and fix it.
Contact: «email / telephone / form»
Response time: within 5 working days
If it is affecting your participation in the study, contact research support as well.

── About this statement ───────
Last updated: «date» · Assessed by: code review and
automated testing (not including real user testing)
```

**State matrix**

| State | Presentation and copy in full |
|---|---|
| LOADING | A static page |
| EMPTY | Not applicable |
| ERROR | `This page cannot be shown in full at the moment. To report an accessibility problem: «the statically embedded channel»` |
| FORBIDDEN / PROTECTED | Not applicable (a public page) |

**Accessibility points**

- The "not done" list must not be collapsible — it is the core of the page's honesty (ACCESSIBILITY_TEST_PLAN §5 identifies these as unmet readiness-gate items).
- The page is itself a model of accessible implementation: correct heading levels, `<ul>`, `<address>`, and nothing carried by colour alone.
- "Open display and reading settings" links to B13 (the participant preferences), and is equally reachable from the staff workspaces.

---

## §6 Reporter protection: a checkable checklist

> Scope: all of E1–E6, F2–F5 (when a signal originates in a report), and D6 (reports submitted by supporters).
> Every item is **binary and decidable**, for use in both design review and implementation review.

| # | Check | How it is decided | Consequence of breach |
|---|---|---|---|
| R-1 | **No field** of the queue or case detail contains a reporter identifier | Inspect the raw JSON on the wire (the e2e test already asserts this) + no frontend component may reference `reporterId` | Design error |
| R-2 | The queue does not show the **precise time** of a report, only a band | No report time at `HH:MM` resolution exists on a queue card | Design error |
| R-3 | The queue's default sort does not use arrival order or report time, and sorting by report time is not offered | That option does not exist in the list of sort options | Design error |
| R-4 | The reporter's own account is **collapsed by default**, and opening it needs an explicit action + a warning + an audit record | In E3 that block is a `<details>` and is closed by default | Design error |
| R-5 | Cases of equal priority and deadline are not ordered by arrival | The sort key includes a stable hash of the case ID | Design error |
| R-6 | The report count is shown as a band (1 / 2–4 / 5+), never as a count changing over time | No exact count curve or time series exists on a card | Design error |
| R-7 | The disposition interface offers no route of any kind to "adjust by reporter" (such as "other reports from the same reporter") | No such navigation exists in the interface | Design error |
| R-8 | The status shown to a reporter uses only safe wording: `received` / `being reviewed` / `dealt with` / `more information needed` / `closed`; it never discloses the disposition or the evidence | The status enumeration in D6 and in the participant-side reporting centre | Design error |
| R-9 | The explanation visible to the person subject to a disposition contains no clue pointing at the reporter (timing, quoted wording, counts) | Review of the copy templates behind E4's "what the other person will see" preview | Design error |
| R-10 | "Hand to the safety team" (E6) carries no reporter information | E6's confirmation copy states explicitly what is and is not carried | Design error |

---

## §7 Evidence minimisation: checkable rules

| # | Rule | Where it lands |
|---|---|---|
| M-1 | Evidence visible by default = the one item reported (with the version number as at the time of the report) | E3 |
| M-2 | Previous dispositions show only: the past 12 months + in force + the same rule clause | E3 |
| M-3 | Reports not upheld, reports withdrawn, and history under a different rule are **never shown** | E3 |
| M-4 | The moderation interface offers no route of any kind to research data, assessment results, message content, matching records or safety records | All of E1–E6 |
| M-5 | Every piece of evidence must carry: a source label, a timestamp, and a version number | E3, E5 |
| M-6 | Retrieval beyond the default scope = an explicit request + a mandatory reason + the scope + an audit record + review by a third person | E3 |
| M-7 | Safety triage's "minimum necessary background" contains only: the source statement, related content cited, the current consent and suspension state, and safety history of the same kind | F3 |
| M-8 | The safety interface does not display research data or assessment results | F1–F6 |
| M-9 | Every opening or retrieval of evidence is written to the access audit, and the interface says so beforehand | E3, F3 |
| M-10 | A supporter can only see what they submitted themselves, never the person's existing entries (unless a grant says otherwise) | D3, D4 |

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
| C-10 | `apps/web/index.html` declares `lang="zh-CN"` | **The document language is wrong.** Every interface string has been English since D-9, so a screen reader applies Chinese pronunciation rules to English text, and assistive technology and translation tools are told the page is in a language it is not. WCAG 3.1.1 (Language of Page) is a Level A criterion | Change to `lang="en"` | ❌ **OPEN** — found 2026-08-16 while converting the documents; it is a consequence of the English conversion itself, not a pre-existing defect |
| C-9 | Every panel: errors showed only `Not successful: {code}` | Breaks §231 (does not say what was saved, what did **not** happen, or how to recover) | Adopt the §1.2 generic ERROR structure plus each screen's own additional sentence | ✅ **DONE** — the panels call `staffLoadError` / `staffActionError` from `errors.ts`, which separates a failed read from a refused command and states the reason and the next step |

### 8.2 Suggested (not errors, but short of the specification)

| # | Location | Suggestion |
|---|---|---|
| S-1 | The queue loads from a manual button (`View open cases`) | Keep the manual button (it suits intermittent use) but load once automatically on entering the panel, and rename it `Refresh the queue` — **this change would break existing tests**, so it is listed as a suggestion pending product confirmation |
| S-2 | Case and signal identifiers are typed into a text field | Fill them in automatically on clicking through from the queue and show them as a read-only summary; keep manual entry in a collapsed "development environment" area |
| S-3 | Every panel has a single `role="status"` announcement region | Keep it, but errors should also use `role="alert"` (severity grading, §232) |
| S-4 | `styles.css` has no tokens | Delivered by A1–A9; the tokens this file references are listed in §1.7. *(This row is itself out of date: the stylesheet has had tokens since 2026-08-04 and now carries 133 of them.)* |

---

## §9 Design trade-offs (decided, with reasons)

| # | Trade-off | Decision | Reason |
|---|---|---|---|
| T-1 | The reporter's account: withhold entirely vs collapsed by default | **Collapsed by default + a warning + an audit record** | Withholding it entirely strips a disposition of the context it needs (Doc 20 §187 requires the report summary and the evidence), which drives a moderator to go digging through more history instead — widening the exposure rather than narrowing it. Collapsed + audited is a checkable middle state |
| T-2 | Report timing: hide it entirely vs bands | **Bands (<24h / 1–3 days / >3 days)** | Hiding it entirely breaks deadline and ageing management (§39 requires ageing cases). Bands keep the operational capability and cut off precise inference |
| T-3 | Safety triage conclusions: 3 vs 4 (Doc 20 §196 lists 4) | **4 (close / keep watching / escalate / convert to an event)**; the current implementation has only 3, missing "keep watching" | §196 lists Monitor explicitly. Without it, "not sure yet" is forced into either "close" or "escalate", manufacturing a binary judgement. *(Verified against the code 2026-08-16: `DISPOSITIONS` still holds three entries — this trade-off's description of the implementation is still accurate.)* |
| T-4 | Safety screen density: dense (more on one screen) vs standard | **Standard** | The safety workspace optimises for not getting it wrong, not for seeing more. The urgency in §20 refers to response speed, not screen density |
| T-5 | Supporter workspace density | **The participant's spacious level** | A supporter is often an older spouse or a friend of the same generation; treating "not a participant" as "staff density" is a false assumption |
| T-6 | Where "hand to the safety team" sits: inside the moderation decision vs beside it | **Beside it, with equal weight** | Putting it among the decision options makes it "a kind of disposition" and therefore mutually exclusive with one; in fact the two lines must proceed independently (§194) |
| T-7 | Restoration (F6-b): one-click vs seven separate confirmations | **Seven separate confirmations** | §203 enumerates seven preconditions; turning them into a single button means the interface asserts on somebody's behalf that all seven are met |
| T-8 | The emergency-limitation notice: repeated on every screen vs only on the help page | **Repeated on every screen (a shared component, identical content)** | A safety screen is used precisely when something has gone wrong, and nobody goes hunting through a help page at that moment |
| T-9 | The H1 sign-in stub: make it look like a real sign-in (better for demonstrations) vs mark it plainly as a stub | **Mark it plainly as a stub** | THREAT_MODEL lists the absence of authentication as an inherent high risk, and the interface must actively work against the misreading. A handsome demonstration gives way to honesty |
| T-10 | Empty-queue copy: encouraging vs neutral | **Neutral** | A congratulatory empty state ("all done, well done!") rewards the act of clearing the queue, which is direct contamination of judgement in moderation and safety |
| T-11 | Counts during LOADING: show 0 vs show `…` | **Show `…`** | "Not read yet" is not "zero". In a safety or moderation context that distinction is safety-critical |
| T-12 | Skeleton screens | **Forbidden for queues, decisions, dispositions and approvals** | §225 lists it explicitly: a skeleton must not imitate an approval or a Safety decision |

---

## §10 Open items (needing a product / ethics / legal decision; this document does not decide them)

| # | Open item | Interfaces affected | Who decides | How blocking |
|---|---|---|---|---|
| U-1 | **The actual content of the emergency contact channels**: the local emergency number and crisis-support service name in F6-c depend on the deployment region; Doc 20 §204 requires that "Emergency wording must be approved for the Conceptual Prototype setting" | F1, F3, F6, D6, H4, the participant help screen | Ethics review + legal counsel for the deployment region | **High**: placeholder text must not go live, even in a prototype |
| U-2 | **Whether a "duty response" promise is shown during the conceptual prototype phase**: there is no real duty rota today, but if the interface says nothing at all a safety screen loses its "next step"; if it does say something, it may be mistaken for a real service | F1, F3, F6, D6 | Product + ethics | High |
| U-3 | **H1's FORBIDDEN copy must become generic on a real deployment**: in a synthetic environment "this identifier holds no workspace permissions" is useful debugging information; in a real one it is account enumeration | H1 | Security + product | Medium (must be resolved before deployment) |
| U-4 | **Whether and when a reporter is told the outcome**: §193 permits "Action Taken where disclosure is permitted", but the criteria for "permitted" are undefined | D6, the participant reporting centre, E4 | Product + legal | Medium |
| U-5 | **The 12-month window for previous dispositions**: set provisionally in this document on the principle of proportionality; Doc 20 specifies no window | E3 | Product + moderation policy | Medium |
| U-6 | **The 14-day appeal window**: Doc 20 §191 requires that an appeal exists but specifies no period | E4, E5 | Product + legal | Medium |
| U-7 | **The definition of an "independent reviewer"**: §191 requires an independent reviewer "where required"; only "not the original decision-maker" is implemented today | E5 | Product + governance | Medium |
| U-8 | **Who can see a supporter's record of help**: D5 assumes the person themselves can; Doc 20 §183 says only "records assistance when relevant to fidelity" and does not say who sees it | D5 | Research design + ethics | Medium |
| U-9 | **The generic reason given when a supporter's access is revoked**: §185 permits a "generic reason where appropriate", but "appropriate" is undefined; this document takes the most conservative reading (give no specific reason) | D6-b | Product + privacy | Low |
| U-10 | **Notification boundaries**: who is notified on restoration (E5) and suspension (F6), and in how much detail, which belongs to the I18 notification policy (outside this file's scope) | E5, F5, F6 | Product + the I18 design owner | Medium |
| U-11 | **S-1's automatic queue loading**: changing an existing accessible name breaks tests, and product needs to confirm whether that test change is acceptable | E2, F2 | Product | Low |
| U-12 | **The value tables for safety event severity and category**: F4/F5's mandatory fields need a controlled vocabulary, and the backend enumerations are not yet fully aligned with Doc 20 | F4, F5 | Research design + backend | Medium |
| U-13 | **Whether the "proportionality" note on a moderation disposition is mandatory**: this document makes it mandatory (§189 lists proportionality), which adds to a moderator's burden | E4 | Product + moderation policy | Low |

---

## Appendix: what this file covers

| Group | Units | Status |
|---|---|---|
| D | D1 supporter home / D2 invitations and permission review / D3 submitting a contribution / D4 contribution status list / D5 supporting a shared activity / D6 reporting a concern and revoked access | 6 / 6 |
| E | E1 moderation dashboard / E2 report queue / E3 case detail / E4 decisions and confirmation / E5 appeals and restoration / E6 the moderation → safety handover | 6 / 6 |
| F | F1 safety dashboard / F2 signal queue / F3 human triage / F4 closing and converting / F5 safety events and actions / F6 suspension, restoration and emergency limits | 6 / 6 |
| H | H1 sign-in / identity entry / H2 secure invitation landing page / H3 account activation / H4 public study information / H5 accessibility statement | 5 / 5 |
| | **Total** | **23 / 23** |
