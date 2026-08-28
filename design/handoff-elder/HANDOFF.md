# Handoff: Canadian Elder People's Online Community & Personal Life Story App

## Overview

A mobile app for a Canadian research study in which elder participants record their own life
story, optionally share pieces of it with a community of other elders, and optionally do short
motor/memory exercises. The design's organising principle is **consent**: everything is private
by default, sharing is always a deliberate act, and nothing enters a person's story unless they
personally accept it.

Primary user: an elder participant (persona: Margaret Fraser, 78, Halifax, retired nurse), using
the app independently or with a family helper sitting beside her on her own device.

## About the design files

`Elder Life Story App.dc.html` is a **design reference created in HTML** — a working prototype
showing intended look and behavior. It is not production code to port line by line.

The task is to **recreate these designs in the target codebase's existing environment** (React
Native, Flutter, SwiftUI, native Android, etc.) using its established patterns, component
library, and navigation. If no environment exists yet, choose the framework appropriate to the
project and implement there.

To view the prototype: open the `.dc.html` file in a browser. `support.js` and `design-system/`
must sit alongside it (the folder structure in this bundle is already correct except that the
prototype references the design system at `_ds/classical-639e3d99-.../` — see **Files** below).

## Fidelity

**High fidelity.** Colors, typography, spacing, copy, and interaction states are final and
should be reproduced faithfully. Every value comes from the Classical design system's token
sheet (`design-system/styles.css`) except three deliberate departures documented under
**Deviations from the design system**.

The prototype is a single-column phone layout at **404 × 872 px**. Treat that as a ~390pt phone
viewport; the layout is a vertical flex column and scales by stretching, not reflowing.

---

## Global chrome

Three fixed regions on every signed-in screen, in this vertical order:

### 1. Helper banner (conditional)

Shown only while helper mode is active.

- Full width, `padding: 12px 18px`, `background: var(--color-accent-100)`,
  `border-bottom: 1px solid var(--color-accent-300)`
- Left: "Anne is helping. Margaret decides." — Lora 14px/1.35, `var(--color-accent-800)`
- Right: "Stop" button — 1px `--color-accent-700` border, radius 4px, `padding: 7px 11px`,
  Cormorant Garamond 600 13px

### 2. Accessibility toolbar (always)

- Full width, `padding: 9px 14px`, `background: var(--color-neutral-100)`,
  `border-bottom: 1px solid var(--color-divider)`, flex row, `gap: 6px`
- "Text" label (Lora 12px, `#6b6863`), then **A−** and **A+** buttons (34×34, 1px divider
  border, radius 4px), **Read aloud** (icon + label, Lora 12.5px, `--color-accent-700`),
  then pushed right: high-contrast toggle (34×34, half-filled circle icon) and language
  toggle showing **FR** or **EN**

Behavior: A−/A+ step a zoom factor on the content region by 0.1 within **0.9–1.4** (use the
updater form of setState so rapid taps accumulate). High contrast switches the content
background to `#ffffff` and text to `#000000`. Read aloud speaks the visible content region's
text via the platform TTS at rate 0.9.

### 3. Bottom tab bar (signed-in screens only)

Hidden on `welcome`, `google`, `onboarding`, and `report` — sign-in must not be skippable.

- 5 tabs, each `flex: 1`, `min-height: 72px`, Lucide icon 22px above a Cormorant Garamond 600
  13px label, `gap: 5px`
- `background: var(--color-neutral-100)`, `border-top: 1px solid var(--color-divider)`
- Active tab: `border-top: 2px solid var(--color-accent)` (with `margin-top: -1px` so it
  overlays the divider) and label/icon in `--color-accent-800`; inactive `#4a4844`
- Tabs: Home (house) · My story (open book) · Community (two figures) · Messages (envelope) ·
  Help (question circle)

### Toast

A single non-dismissing confirmation block at the bottom of the content region:
`margin-top: 22px`, `padding: 16px`, 1px `--color-accent` border, radius 4px,
`background: var(--color-accent-100)`, Lora 17px/1.55, `--color-accent-800`. It persists until
the next navigation — **nothing in this app disappears on a timer**.

---

## Screens

Screen key = the `screen` state value.

### `welcome` — Sign in

Purpose: enter the app, by Google or by the code posted in the study's letter.

- Kicker "CANADIAN ELDER LIFE STORY PROJECT" — Lora 11px, `letter-spacing: .14em`, uppercase,
  `--color-accent-700`
- H1 "Your life, in your own words." — Cormorant Garamond 400, 36px/1.1
- Body "This is where you keep your own story. Nobody else can see it unless you say so, and
  nothing is added unless you accept it." — Lora 18px/1.65
- Hairline rule
- **Continue with Google** — primary outlined button, `min-height: 66px`, 1px `--color-accent`,
  radius 4px, Cormorant 600 19px, `--color-accent-700`. **Text only in the prototype** — see
  **Assets**.
- Note: "If you have a Google account, this saves you remembering another password. We ask
  Google only for your name and email address." — Lora 15px/1.6, `#4a4844`
- Hairline rule
- Field labelled "Or use the code from your letter", placeholder "For example 4482" —
  `min-height: 58px`, Lora 20px, `letter-spacing: .06em`
- **Continue with my code** — secondary outlined button (divider border), `min-height: 62px`
- Two text links, Lora 17px underlined with `text-underline-offset: 4px`: "Someone is helping
  me use this" → `helper`; "I cannot sign in" → `help`
- Footer note: "There is no time limit on any screen. Nothing disappears while you read."

### `google` — Google account chooser

- Back link "‹ Back" → `welcome`
- H1 "Sign in with your Google account" — Cormorant 400 30px/1.16
- Body: "You will be taken to Google to sign in. Choose the account you use for email."
- Account row: 48px circle avatar (`--color-accent-100` fill, Cormorant 21px initial
  `--color-accent-800`), name Cormorant 600 18px, email Lora 15px `#605d5d`; card has 1px
  `--color-accent` border. Second row "Use a different account" with a plus icon in a
  divider-bordered circle.
- Hairline rule, then H2 "What Google tells us" (Cormorant 600 20px) and two annotation lines
  (Lora 16px/1.55, `padding-left: 18px`, `border-left: 2px solid`): accent-300 for "Your name
  and your email address", neutral-400 for "Not your email, your contacts, or anything else"
- Closing note: "Your stories are never sent to Google. Signing in this way only tells us it
  is you."

### `onboarding` — three steps, one decision each

Shared frame: kicker "Step N of 3" (Lora 12px, uppercase, tabular numerals), then a 3-pip
progress row — each pip `flex: 1`, `height: 3px`, `--color-accent` when `step >= n` else
`--color-neutral-300`. At the bottom: "‹ Go back a step" (step 1 → back to `welcome`) and the
note "Three short questions. Nothing here is final."

1. **"What should we call you?"** — body explaining the name is only on her own screens; text
   input `min-height: 62px`, Lora 22px, 1px accent border, prefilled "Margaret"; **Next**.
2. **"Your story starts private"** — three annotation lines (accent-300, accent-300,
   neutral-400): "Only you can read your story" / "Nothing is added unless you accept it" /
   "Nothing goes to the community by itself"; primary **I understand**; link "Change these now
   instead" → `consent`.
3. **"How would you like to read?"** — three rows that *apply immediately* when tapped so the
   effect is visible in place: "Make the text bigger" (A+), "Stronger black and white"
   (contrast icon), "Read the screen out to me" (speaker icon). Primary **Start my story** →
   `home` with the toast "Welcome, Margaret. Your story is private until you say otherwise."

### `home`

Order, top to bottom:

1. H1 "Good morning, Margaret" — Cormorant 400 34px/1.12; sub "One thing is unfinished. When it
   is done, it is done."
2. **Unfinished card** — `background: var(--color-neutral-100)`, 1px divider, radius 4px,
   `padding: 20px`: kicker "FINISH WHAT YOU STARTED", H2 "A photograph with no words"
   (Cormorant 600 25px), body "You added a photograph on Tuesday. Nobody knows yet who is in
   it.", primary button "Add words to this photograph" → `caption`
3. **Waiting for you** — H2 Cormorant 600 22px. If a contribution is pending: a full-width row
   button (1px divider, radius 4px, `padding: 18px`) reading "Anne has offered something for
   your story" / "Only you can decide this. Offered Monday." with a "›" chevron in
   `--color-accent-700` → `review`. If not: the plain line "Nothing needs a decision from you
   today."
4. **What you decided recently** — a hairline-ruled list of `{what, when}` rows, `what` Lora
   16px `#3a3835`, `when` Lora 14px `#605d5d` tabular and right-aligned. Seed data: "Added a
   photograph / Tue 18 Aug", "Kept your story private / Fri 14 Aug", "Accepted Anne's account
   of the crossing / Mon 3 Aug"
5. Three hairline-separated chevron rows (Lora 18px, `padding: 19px 2px`): "Your information
   and who can see it" → `consent`; "Things you can do any time" → `story`; "Exercises you can
   try" → `exercises`
6. Primary button "Get help or report a problem" → `help`

**French**: when `lang === 'fr'`, Home renders a shortened French version (greeting, the
unfinished card, and a note that full translation is in progress). Only Home is translated in
the prototype — production needs full FR for every screen.

### `story` — My life story

- H1 "Your life story", sub "Twelve pieces so far. Only you can see them."
- Two side-by-side tall buttons (`flex: 1`, `min-height: 96px`, icon 26px above Cormorant 600
  17px, accent outline): **Speak a memory** (mic) / **Write a memory** (pen)
- Full-width secondary **Choose a question to answer** (`min-height: 58px`)
- Hairline rule
- **Uncaptioned-photo card** (1px `--color-accent-300`, radius 4px, `padding: 16px`): a plate
  (see **Assets**) 132px tall, then "This one still needs words" (Cormorant 600 19px) and "Tap
  to say who is in it and when it was." → `caption`
- Entry list: hairline-separated `{title, excerpt, meta}` — title Cormorant 600 21px, excerpt
  Lora 16px/1.55 `#4a4844`, meta Lora 13.5px `#605d5d` tabular. Meta states provenance
  explicitly: "Your words, spoken · 3 min · June 2026" / "Your words, written · May 2026" /
  "Anne's account · accepted May 2026"

### `record` — Add a memory

- Back link "‹ Back to your story"; H1 "Add a memory"
- Segmented control, one bordered row (radius 4px, overflow hidden), three options **Speak /
  Write / A question**, each `flex: 1`, `min-height: 52px`, Cormorant 600 16px. Selected:
  `background: var(--color-accent-100)`, `box-shadow: inset 0 0 0 1px var(--color-accent)`,
  text `--color-accent-800`.

**Speak** — three states:
- `idle`: a 186px circle button, 1px accent border, 46px mic icon over "Start"
- `recording`: 186px circle, `--color-accent-100` fill, elapsed time Cormorant 400 42px tabular
  (`m:ss`, ticking each second); caption "Recording. Take your time."; **Stop** button
- `recorded`: a playback row (▷ + "Your recording" + "m:ss · not saved yet"), the note "We will
  type this out for you. You can read it and change any word before anyone else sees it.", then
  the composer footer (below), plus a secondary "Record it again instead"

**Write** — a textarea `min-height: 200px`, Lora 18px/1.7, placeholder "The allotment on
Barrington Street…", then the composer footer.

**A question** — an intro line then six hairline chevron rows; tapping one opens the Write
composer (fresh state — see **State management**). Prompts: "Where did you live when you were
ten?", "Who taught you something you still use?", "What was your first paid work?", "Tell me
about a winter you remember.", "Who in your family should be remembered?", "What did you cook
for people?"

**Composer footer** (identical in Speak and Write, in this order):

1. Hairline rule, H "A photograph, if you have one" (Cormorant 600 20px)
   - Empty: a 74px row button — 48px neutral-200 icon tile (Lucide image), "Add a photograph"
     (Cormorant 600 18px) / "This is not required." (Lora 15px `#605d5d`)
   - Filled: a 170px plate, an optional caption input ("A few words about the photograph, if
     you like"), and the link "Take the photograph out"
2. Hairline rule, H "Who may read this one?" (Cormorant 600 20px), then a line "Now: only me" /
   "Now: the community may read it" (Lora 17px `--color-accent-800`), then two radio cards
   (`role="radio"`, `aria-checked`, `padding: 16px`, radius 4px; selected =
   `--color-accent-100` fill + 1px accent border + a "✓" appended to the label):
   - **Only me** — "The usual choice. You can share it later." (default)
   - **The community may read it** — "Other people can read it and say something back."
3. If public is chosen, an annotation (NOT a card — `border-left: 2px solid var(--color-accent)`,
   `padding-left: 18px`, Lora 16px/1.65 `#3a3835`): "It will appear with your first name and
   your city. Never your surname, your address, or your telephone number. You can take it back
   at any time."
4. Primary save button whose **label changes with the choice**: "Keep this in my story" or
   "Keep it, and let the community read it"

### `caption` — Add words to a photograph

- "‹ Not now" → `home`
- A 230px plate
- H1 "Who is in this photograph?", sub "Speak it or type it, whichever you prefer."
- Two equal 104px buttons, both accent-outlined (deliberately equal weight): **Speak the
  answer** / **Type it**. Speaking reveals a listening block (accent border + accent-100 fill,
  "Listening. Say who is in it, then press stop."); typing reveals a 120px textarea with an
  accent border, placeholder "My mother, my sister Vera, and me at the front".
- Hairline rule, then labelled field "When was it?" (Cormorant 600 22px label), placeholder
  "A year, or just “the summer we moved”"
- Primary **Save these words** → `home` + toast; secondary **Leave it for another day**

### `review` — A contribution from Anne

- H1 "Anne has offered something for your life story"
- Body: "Only you can decide this. Nothing is added unless you accept it, and if you accept, it
  is shown as Anne's account of things — not as your own words."
- Blockquote: `border-left: 2px solid var(--color-accent)`, `padding-left: 20px`, Lora **italic**
  19px/1.65, `#3a3835`
- Attribution "Anne Fraser, your daughter · offered Monday" — Lora 14px `#605d5d`
- Two full-width `min-height: 66px` buttons — **Add this to my story** (accent outline) and
  **Do not add this** (divider outline); then a centered link "Decide another day"
- Closing note: "If you say no, Anne is told only that you decided not to add it. She is not
  told why."

### `consent` — Your information and who can see it

Four question blocks, hairline-separated. Each: question (Cormorant 600 21px), note (Lora 15px
`#605d5d`), current value line "Now: <value>" (Lora 17px `--color-accent-800`), then a wrapping
row of option buttons (`role="radio"`, `min-height: 52px`, `padding: 13px 16px`, radius 4px,
left-aligned; selected = accent-100 fill + accent border + "✓").

| Question | Note | Options (default first) |
| --- | --- | --- |
| Who can see your life story? | This covers everything you have put in, including photographs. | Only me · Me and my family · The community |
| Can the researchers read your stories? | They would read them with your name removed. | Not yet · Yes |
| Can Anne suggest things to add? | She can offer. You still decide each one. | Yes — Anne · Nobody |
| How may we contact you? | About the study only. Never to sell you anything. | Yes, by post · By telephone · Do not contact me |

Every change is immediate and confirmed by toast: "Saved. <question> — <value>."

Below: H2 "Your part in the research", the line "You joined in March 2026. Taking part is your
choice, and stopping does not affect any care or service you receive.", a secondary button
"Read what the study does with my stories", and the link "Leave the study and keep my story".

### `community` — Other people's stories

- H1 "Other people's stories"
- A reassurance block (1px divider, radius 4px, `--color-neutral-100`, `padding: 16px`): "Your
  own story stays private. Nothing of yours appears here unless you choose a piece and share
  it."
- Post list, hairline-separated. Each: kicker "<Name>, <age> · <City>" (accent-700 uppercase
  11px), title Cormorant 600 22px, excerpt Lora 16px/1.6, then an action row (`flex-wrap`,
  `gap: 9px`, every button `min-height: 48px`):
  - **Read it** — accent outline
  - **Like** — thumbs-up icon + "N people said it mattered" (`plural()`: "1 person"). Liked
    state: icon `fill: currentColor`, accent-100 fill, accent border, accent-800 text.
    `aria-label` spells out the action and count.
  - **Comments** — speech-bubble icon + "N comments" → opens the post
- Primary **Choose one of mine to share** → `story`

### `post` — Reading a public story

- "‹ Other people's stories"
- Kicker, H1 (Cormorant 400 30px/1.16), two body paragraphs (Lora 18px/1.7, **left-aligned** —
  see **Deviations**), then "Shared with the community · June 2026" (Lora 14px `#605d5d`)
- Hairline rule, then the like button at full size (`min-height: 58px`, icon 19px, label "This
  mattered to me" / "You said this mattered") and the count line "34 people said this mattered
  to them." (singular: "One person said this mattered to them.")
- Hairline rule, H2 "N comments"
- Comment list, hairline-separated: name (Cormorant 600 17px) + timestamp (Lora 14px `#605d5d`,
  right), body Lora 17px/1.6. Then per comment:
  - Someone else's → link "Report this comment" (Lora 15px `#605d5d`, underlined) → `report`
  - Your own → button "Delete my comment" (`min-height: 44px`, divider outline)
- Delete confirmation is **inline, not a modal** — an accent-bordered accent-100 block with
  "Delete your comment?", the line "It will be taken off this story. Nobody is told that you
  deleted it.", and **Yes, delete it** / **Keep it**
- Composer: label "Say something to <FirstName>. It appears under your first name only.", a
  110px textarea, then two equal buttons **Speak it instead** / **Post it**, and the note
  "Nothing from your own story is shared by commenting."
- Footer link with flag icon: **Report this story** → `report`

Posting with an empty draft must not submit — show the toast "Write something first, or press
“Speak it instead”."

### `report`

Bottom tab bar hidden (it is a focused task).

- "‹ Back" → `post`
- H1 "Report this story" / "Report <Name>’s comment"
- Body: "A person at the study office reads every report. You will not be asked to explain
  yourself, and the person you report is not told who reported them."
- H2 "What is the matter?" then five radio options: "It is upsetting or cruel" · "It is not
  true" · "It is about me and I did not agree to it" · "Someone is asking me for money" ·
  "Something else"
- Optional textarea, label "Anything you want to add, if you like", placeholder "You do not
  have to write anything."
- **Send this to the study office** (accent outline) → back to `post` + toast "Sent. The study
  office will read it and write back to you."
- **Send it, and hide this from me** (divider outline) → `community` + toast "Sent, and you
  will not see it again."
- Link "I would rather telephone someone" → `help`
- With no reason selected, both buttons show "Choose what the matter is, or telephone us
  instead." and do not submit.

### `exercises`

- "‹ Home"; H1 "Exercises you can try"
- Body: "Four short exercises for your hands, your eyes and your memory. Choose whichever you
  like, whenever you like. There is no score and nothing is counted against you."
- Four cards, `gap: 10px`, `padding: 15px`, radius 4px, flex row `gap: 15px`. Left: a 52px
  radius-4 tile holding a 26px Lucide icon — `accent-100` / `accent-800` for Tapping (the one
  available), `neutral-200` / `#4a4844` for the rest. Right: name (Cormorant 600 19px) and meta
  (Lora 15px `#605d5d`). Tapping's card carries a 1px `--color-accent-300` border, the others
  1px divider.

| Exercise | Meta | Lucide icon |
| --- | --- | --- |
| Tapping | About 3 minutes · for your hands | `pointer` |
| Drawing a spiral | About 2 minutes · for your hands | `spiral` |
| Naming what you see | About 4 minutes · for your memory | `eye` |
| Steady hold | About 1 minute · for your hands | `hand` |

- Closing block: "You can stop any exercise part way through. Nothing is saved unless you
  finish it."

### `tapping`

- "‹ All exercises"; H1 "Tapping"
- Body: "Tap the two circles one after the other, as evenly as you can. Use whichever hand you
  like, and stop whenever you want to."
- Two circles side by side: `flex: 1`, `aspect-ratio: 1`, `border-radius: 50%`, 1px accent
  border, numerals "1" and "2" in Cormorant 400 30px; hover tint, pressed = accent-100
- **Elapsed time**, centered, Cormorant 400 34px tabular — deliberately *not* the tap count
- Caption "No score is kept. This is not a test."
- **Finish** (accent outline) → `exercises` + toast "Done. Thank you for trying it."
- **Stop without saving** (divider outline) → `exercises`

Taps are counted in state for the study but **never displayed**. The clock stops on any
navigation away.

### `messages`

H1 "Messages", note "Nobody can write to you unless you have allowed them.", then hairline
thread rows: name (Cormorant 600 20px) + timestamp right, preview Lora 16px/1.55. Seed:
"Anne Fraser / Monday / I put in the bit about the tomatoes — see what you think, no hurry.";
"Study office, Dalhousie / 2 Aug / Your yearly check-in. Nothing needs doing today." Primary
**Write a message** below.

### `help`

- H1 "Get help", body "A person answers the telephone, eight in the morning until eight at
  night, every day."
- Phone card: 1px accent border, radius 4px, kicker "TELEPHONE, FREE OF CHARGE" and the number
  **1 800 555 0142** in Cormorant 400 32px tabular, `--color-accent-800`
- Chevron rows: "Someone is helping me use this" → `helper` · "Ask someone to telephone me" ·
  "Report a problem or something upsetting" · "Sign out of this device" → `welcome`

### `helper` — Helper mode

- H1 "Someone is helping me"; body "A helper works on this same device, sitting beside you.
  There is no separate sign-in, and nothing changes about who owns the story: it stays yours."
- H2 "A helper may" + three accent-300 annotation lines: read a screen out to you · write down
  what you say, in your words · find a photograph and put it in
- H2 "A helper may not" + three neutral-400 annotation lines: accept or refuse anything on your
  behalf · change who can see your story · share anything with the community
- Note: "While a helper is with you, those decisions are put aside and shown to you again once
  helping stops."
- Primary **Start helping** → `home` with the banner active and the toast "Helping has started.
  Decisions are put aside until it stops."

---

## Interactions & behavior

- **No timers anywhere.** No auto-dismissing toasts, no session timeouts, no carousels, no
  content that moves on its own. This is a hard requirement of the brief.
- **One decision per screen.** Where two actions compete, the destructive/declining one is a
  divider-outlined button of equal size, never a smaller or dimmer one.
- **Undo/escape on every commitment.** "Decide another day", "Leave it for another day", "Take
  the photograph out", "Keep it", "Stop without saving", "Delete my comment".
- **Transitions**: none in the prototype. If the target platform's navigation animates, keep it
  under 200ms and avoid parallax or motion that could disorient.
- **Hover/press**: hover is `rgba(32,31,29,.05–.07)` on neutral controls and
  `rgba(182,130,53,.12)` on accent-outlined ones; pressed uses `--color-accent-100`.
- **Focus**: `outline: 2px solid var(--color-accent); outline-offset: 2px` — never the browser
  default. On native, use the platform's equivalent focus indicator at comparable contrast.
- **Touch targets**: 62–66px for primary actions, 58px secondary, 48px minimum for inline
  actions, 44px absolute floor (the comment delete button). Never below 44.
- **Read aloud** uses `SpeechSynthesisUtterance` at `rate: 0.9` over the content region's
  `innerText`; on native, use the OS TTS.

## State management

```
screen        'welcome'|'google'|'onboarding'|'home'|'story'|'record'|'caption'|'review'|
              'consent'|'community'|'post'|'report'|'exercises'|'tapping'|'messages'|
              'help'|'helper'
onbStep       1|2|3
mode          'speak'|'write'|'ask'        // record composer tab
rec           'idle'|'recording'|'recorded'
secs/elapsed  recording clock (1s interval)
memPublic     false                        // MUST default false on every new composer
memPhoto      false
captionMode   ''|'speak'|'type'
pending       true                         // Anne's contribution awaits a decision
consent       { see, research, suggest, contact }
helperMode    false
lang          'en'|'fr'
zoom          1        (0.9 – 1.4)
hc            false
openPost      index into posts
likes         { [postIndex]: bool }
myComments    { [postIndex]: string }
draft         string
confirmDelete false
reportTarget  string
reportReason  string
taps/tapSecs/tapElapsed
toast         string
```

Two rules that matter more than they look:

1. **A fresh composer always starts private with no photograph.** Every entry point into
   `record` (Speak, Write, A question, and picking a prompt from the question list) resets
   `memPublic: false, memPhoto: false, rec: 'idle'`. Navigating away also resets them.
   Without this, an abandoned draft leaks a "public" choice onto the next memory.
2. **Clocks stop on navigation.** Both the recording timer and the tapping timer are cleared on
   any screen change and on unmount.

Data fetching: none in the prototype; all content is seed data (three community posts with
their comment threads, three story entries, six prompts, two message threads, three recent
decisions). Real implementation needs endpoints for story entries, contributions awaiting
review, consent state, community posts/likes/comments, reports, and exercise results.

## Design tokens

All from `design-system/styles.css` — read them from there rather than hard-coding.

| Token | Value | Use |
| --- | --- | --- |
| `--color-bg` | `#f3f2f2` | page ground |
| `--color-surface` | — | plate mat |
| `--color-text` | `#201f1d` | body text |
| `--color-accent` | `#b68235` | strokes, borders, active indicators |
| `--color-accent-100` | — | selected/pressed fills, helper banner, toast |
| `--color-accent-300` | — | affordance borders, positive annotation rules |
| `--color-accent-700` | — | **interactive text and links** (accent itself is only 3:1) |
| `--color-accent-800` | — | text on accent-tinted fills |
| `--color-neutral-100` | — | toolbar, tab bar, quiet cards |
| `--color-neutral-200/300` | — | icon tiles, photo placeholders |
| `--color-neutral-400` | — | negative/limitation annotation rules |
| `--color-divider` | — | every hairline |
| `--radius-sm` / 4px | | all corners |
| `--shadow-md` | | the phone frame only; UI elevation is a whisper |
| `--font-heading` | Cormorant Garamond | headings, buttons, labels; max weight 600 |
| `--font-body` | Lora | all body copy |

Literal greys used for secondary text, in ramp order: `#3a3835`, `#4a4844`, `#605d5d`,
`#6b6863`. `#605d5d` is the floor for 14–15px text (≈4.9:1); do not go lighter at small sizes.

**Type scale as built** — H1 30–36px / H2 20–25px / body 17–18px / secondary 15–16px /
meta 13.5–14px / kicker 11–12px. Tabular numerals (`font-variant-numeric: tabular-nums`) on
every figure: clocks, dates, the phone number, counts.

## Deviations from the design system

Three, all deliberate, all for 78-year-old eyes. Preserve them.

1. **Body copy is flush left, not justified.** Classical justifies body text; at this measure
   with this type size, justification opens rivers that hurt readability.
2. **The type scale is stepped up** from Classical's interface sizes — 17–18px body rather
   than the system's smaller steps, and 62px+ primary tap targets.
3. **Interactive text uses `--color-accent-700`, not `--color-accent`.** The base gold reaches
   only ~3:1 on this ground, which is fine for icons and chrome but not for text.

## Accessibility requirements

These are the brief, not polish:

- Text-size control and read-aloud on **every** screen (they live in the persistent toolbar)
- High-contrast mode
- No time limits; nothing disappears
- One decision per screen
- Plain language throughout — short sentences, no jargon, no metaphors
- Every option group is `role="radio"` + `aria-checked`, and selection is signalled **three
  ways**: fill, border, and a "✓" in the label — never colour alone
- Counts and actions are spelled out in `aria-label` ("Say this mattered to me. 34 people
  already have."), and singular/plural is handled properly

## Copy voice

Plain, warm, concrete, and never cheerful about difficult things. Two decisions worth keeping:

- The community's approval action is **"This mattered to me"**, not "Like" — these are people's
  lives.
- The training games are **"exercises"**, never "games", and **no score is ever shown**. A
  Parkinson's tapping measure framed as a game invites a score, and a score invites a person to
  read a bad day as decline. Tap counts go to the study; the participant sees only elapsed time.

Note also that the exercises are **not** framed as research on any participant-facing screen —
they are offered as something to try, freely chosen.

## Assets

- **Icons**: Lucide (https://lucide.dev), 24px grid, `stroke-width: 2`, round caps,
  `currentColor`, rendered at 15–46px. Used: house, book-open, users, mail, help-circle, mic,
  pen, image, pointer, spiral, eye, hand, volume-2, contrast, thumbs-up, message-square, flag,
  plus, play.
- **Photographs**: none. Every image is a labelled grey placeholder (`--color-neutral-300` fill,
  6px `--color-surface` mat, 1px divider outline, centered label). Production should render
  these through Classical's `.plate` treatment. **No photographic assets are supplied and none
  were generated.**
- **Google branding**: the "Continue with Google" button is **text only**. Production must use
  Google's official Sign-In button asset and follow their branding guidelines — do not
  approximate the mark.
- **Fonts**: Cormorant Garamond and Lora, loaded by the design system.

## Files

| File | What it is |
| --- | --- |
| `Elder Life Story App.dc.html` | The prototype. All 17 screens, real navigation and state. |
| `support.js` | Runtime the prototype needs to render. Not part of the design. |
| `design-system/styles.css` | **The token source.** Every colour, font, space, radius. |
| `design-system/_ds_bundle.js` | Classical's component bundle. |
| `design-system/readme.md` | Classical's own guide — direction, do's and don'ts. |

To open the prototype from this folder, the design-system reference inside the HTML points at
`_ds/classical-639e3d99-4ff6-49f0-ade1-a7c4ee7b04ca/styles.css`. Either recreate that path
around the `design-system/` files or repoint the two `<link>`/`<script>` tags at the top of the
template.

## What is not designed yet

Flagging these so they are not mistaken for omissions:

- **French.** Only Home has FR copy. Every screen needs it, and a Canadian study almost
  certainly needs FR at parity, not as a toggle afterthought.
- Three of the four exercises (spiral, naming, steady hold) are list entries only.
- Message threads open to a toast, not a conversation view.
- Sharing an existing story piece to the community (the "Choose one of mine to share" path).
- Anne's own side: how a family member composes and offers a contribution.
- Study-coordinator views.
