# BACKEND_GAPS

> What the Canadian Elder Life Story handoff asks for that this platform cannot yet
> serve. Kept as the front end is built, not written up afterwards, on the owner's
> instruction: **build the front end first, record the missing back end for later.**
>
> Status started 2026-08-22. A row leaves this file when an endpoint exists **and** a
> screen reads from it — not when either half alone is done.

## How the front end behaves while a row here is open

Every screen built against a gap says so on the screen, in the participant's words, and
offers nothing it cannot honour. That is not politeness: this project has removed a
control that promised what the platform could not deliver more than once (D-2, D-5,
D-21, D-34, D-75), and the consent screen was found offering six withdrawals that were
certain to fail (D-101). A design handed over complete is exactly the circumstance in
which that mistake gets made again, at speed.

## Gaps

| # | What the design needs | What exists | What is missing |
|---|---|---|---|
| B-1 | **Story entries** — list of a participant's own memories with title, excerpt, and provenance meta ("Your words, spoken · 3 min · June 2026" / "Anne's account · accepted May 2026") | M17 Life Story holds items and contributions | A query returning entries with **provenance and duration** in the shape the list needs; nothing records "spoken" against "written", and nothing records an audio length |
| B-2 | **Speech capture** — record audio, show an elapsed clock, then "We will type this out for you" | nothing | Audio upload, storage against a life-story item, and transcription. R2 holds bytes; there is no audio pipeline and no transcription provider (ADR-109 is unchosen) |
| B-3 | **Photographs on a memory** — attach, caption, and "take the photograph out" | R2 object storage is connected and exercised | Image upload from the browser, a per-item photo relation, a caption field, and removal. **Malware scanning is still a simulator** (ADR-126) — nothing may claim a photograph has been checked |
| B-4 | **The uncaptioned-photo prompt** — "A photograph with no words", "You added a photograph on Tuesday" | nothing | Depends on B-3; also needs "has no caption" to be a queryable state |
| B-5 | **Consent, the design's shape** — four questions, each with two or three options, each change confirmed immediately | M03 holds **six scopes** with grant / decline / withdraw | The two models do not map. This is a ruling for the owner, not a mapping exercise — see D-103 |
| B-6 | **Community posts** — other participants' shared stories with name, age, city, excerpt | M18 community spaces and a chronological feed | Sharing a **life-story piece** to the community; the design's post shape (age, city, first name only); the "Choose one of mine to share" path |
| B-7 | **"This mattered to me"** — a per-post count and a per-viewer state | nothing | An approval relation and its count. The design is explicit that it is **not** a like: the word matters and so does the absence of a running score anywhere else |
| B-8 | **Comments** — list, post, delete your own, report someone else's | nothing | Comment storage, authorship, deletion, and the report path below |
| B-9 | **Reports** — five reasons, optional note, "send and hide this from me" | M09 safety signals and M18 moderation exist | A participant-facing report endpoint carrying the design's reasons, and a **hide-from-me** relation, which is a per-viewer suppression the platform does not have |
| B-10 | **Exercises and tapping** — four exercises; taps counted for the study and **never shown** | nothing | An exercise-result record. Note the design's rule: the participant sees elapsed time only, and a score must never be displayed. Whatever is built must make displaying one awkward |
| B-11 | **Messages as conversations** — thread rows open to a conversation | M07 delivery and threads exist | The design opens a thread to a toast; a real conversation view needs the existing thread queries wired up |
| ~~B-12~~ | ~~French at parity~~ | — | **Closed by decision, not by work (2026-08-28, owner): the study is English only.** The handoff's FR/EN toggle is removed rather than left switching between English and English. Reopening this is a real piece of work — there is no localisation layer — so it is struck through rather than deleted, and anybody proposing French should read that as "not started", not as "nearly there" |
| B-13 | **Helper mode, decisions deferred** — "those decisions are put aside and shown to you again once helping stops" | `AssistedMode` is read-only assistance (D-15) | Deferring a decision while a helper is present, and re-presenting it afterwards. D-15 ruled read-only assistance deliberately; this is a change to that ruling, not an addition |
| B-14 | **Recent decisions** — "What you decided recently", three rows of `{what, when}` | the audit trail records decisions | A participant-facing query over their own decisions, in plain words rather than action codes |
| ~~B-15~~ | ~~A brand mark~~ | the owner's `icareu` mark and wordmark, source in `design/brand/`, inlined in `apps/web/src/components/elder/BrandMark.tsx` and shipped as `apps/web/public/favicon.svg` | **Closed 2026-08-29.** It arrived on this project's own icon grid — 24×24 at stroke-width 2, the same as `TabIcon` — and its `#b68235` is exactly `--cl-accent`, so nothing was reinterpreted. Still missing: an `apple-touch-icon`, which wants a square 180×180 raster and neither supplied PNG is square |
| B-16 | **A name to greet** — the handoff's H1 is "Good morning, Margaret" | a participant session is `{actorId, participantId}` | Nothing returns what a participant is called. Home greets without a name rather than addressing somebody by an identifier or by an invented placeholder; `greetingFor(at, name)` already takes the name, so this closes with a query and one argument |
| B-17 | **Who offered this** — the handoff's row reads "Anne has offered something for your story" | `listContributionsAwaitingReview` withholds the contributor **on purpose** — naming them in a list "would let anyone enumerate who has been writing about them" | That ruling stands for the list. But the same comment says the name belongs "on the contribution when the participant opens it", and the review screen has no query that returns it either — so a participant decides whether text enters their own life story without being told who wrote it. The absence is real on both sides |

## Where the build departs from the handoff, and why

| # | The handoff says | The build does | Why |
|---|---|---|---|
| X-1 | Toolbar controls are 34×34 | 44×44 | The same document requires that targets are "44px absolute floor … Never below 44". Both cannot hold; a stated rule outranks a measurement that contradicts it |
| X-2 | A visible "Text" label before A−/A+ | No visible label | The owner requires one row. Measured at 320px the row was 50px over; dropping the label and taking the gap back to the handoff's own 6px is exactly that. Neither button is unlabelled — each carries "Make the text smaller"/"bigger" as its accessible name |
| X-4 | A FR/EN toggle in the toolbar | No toggle | The study is English only (owner, 2026-08-28). Removing it is also what bought the width for one row |
| X-3 | Five tabs, 13px labels | Same, stepping to a smaller size below 24.5rem | Measured: "Community" is one word and clipped at 320 and 360. A clipped word is not a smaller word |
| X-5 | Home's "Waiting for you" row names the contributor | "Someone has offered something for your story" | The query that feeds it withholds the contributor deliberately, to stop a list enumerating who has been writing about somebody. A ruling about a participant's exposure outranks a design that was not weighing it — see B-17 |
| X-6 | The unfinished card ("FINISH WHAT YOU STARTED") and "What you decided recently" | Neither is on Home | Both need data nothing produces (B-4, B-14). A card with a button that goes nowhere is the mistake this project has made five times over (D-2, D-5, D-21, D-34, D-75); an empty section is worse than an absent one on a screen whose job is to make "there is something to do" legible at a glance |
| X-7 | Home greets by name | "Good morning" | No name exists to greet with — B-16 |

## Not gaps — deliberate absences the design shares

- No timers, no auto-dismissing anything. The platform already refuses this and so does the design.
- No score, ever, on an exercise.
- Photographs: **no photographic assets exist**, and the design uses labelled grey placeholders throughout. Production must not substitute stock imagery of older people for real participants' photographs.
