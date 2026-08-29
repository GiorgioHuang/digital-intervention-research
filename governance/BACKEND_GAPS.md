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
| ~~B-4~~ | ~~The uncaptioned-photo prompt~~ | `caption` / `caption_written_at` on `storage_ops.stored_objects`, `captionObject` behind a new `object.caption` action, and `listUncaptionedPhotographs`; Home card and `caption` screen | **Closed 2026-08-29.** Nullable because null *is* the state the card exists to find; an empty caption clears back to null rather than storing emptiness that would read as answered. Its own permission rather than the upload's — adding a file and saying who is in it are different acts, and only the second puts a person's name next to a picture. Two database constraints enforce both-or-neither and no-blank at the level the application cannot bypass, and both were tested against a real Postgres |
| B-5 | **Consent, the design's shape** — four questions, each with two or three options, each change confirmed immediately | M03 holds **six scopes** with grant / decline / withdraw | The two models do not map. This is a ruling for the owner, not a mapping exercise — see D-103 |
| B-6 | **Community posts** — other participants' shared stories with name, age, city, excerpt | M18 community spaces and a chronological feed | Sharing a **life-story piece** to the community; the design's post shape (age, city, first name only); the "Choose one of mine to share" path |
| B-7 | **"This mattered to me"** — a per-post count and a per-viewer state | nothing | An approval relation and its count. The design is explicit that it is **not** a like: the word matters and so does the absence of a running score anywhere else |
| B-8 | **Comments** — list, post, delete your own, report someone else's | nothing | Comment storage, authorship, deletion, and the report path below |
| B-9 | **Reports** — five reasons, optional note, "send and hide this from me" | M09 safety signals and M18 moderation exist | A participant-facing report endpoint carrying the design's reasons, and a **hide-from-me** relation, which is a per-viewer suppression the platform does not have |
| B-10 | **Exercises and tapping** — four exercises; taps counted for the study and **never shown** | nothing | An exercise-result record. Note the design's rule: the participant sees elapsed time only, and a score must never be displayed. Whatever is built must make displaying one awkward |
| B-11 | **Messages as conversations** — thread rows open to a conversation | M07 delivery and threads exist | The design opens a thread to a toast; a real conversation view needs the existing thread queries wired up |
| ~~B-12~~ | ~~French at parity~~ | — | **Closed by decision, not by work (2026-08-28, owner): the study is English only.** The handoff's FR/EN toggle is removed rather than left switching between English and English. Reopening this is a real piece of work — there is no localisation layer — so it is struck through rather than deleted, and anybody proposing French should read that as "not started", not as "nearly there" |
| B-13 | **Helper mode, decisions deferred** — "those decisions are put aside and shown to you again once helping stops" | `AssistedMode` is read-only assistance (D-15) | Deferring a decision while a helper is present, and re-presenting it afterwards. D-15 ruled read-only assistance deliberately; this is a change to that ruling, not an addition |
| ~~B-14~~ | ~~Recent decisions~~ | `listMyRecentDecisions` (M15) over `governance_audit.audit_events`, served at `GET /v1/participants/:id/decisions` | **Closed 2026-08-29.** The store had sixty-one writers and one reader — the staff view, behind `audit.view`, which no participant holds. This is the second reader and cannot become the first: the actor is the caller and is not a parameter, the actions are an allow-list of decisions rather than everything logged, and `result = 'Succeeded'` keeps refused attempts out. Reading it is deliberately not itself audited, unlike `listAuditEvents` — nobody can look at anybody else through it, and Home loads it every visit. The phrases stop where the record stops: an audit row does not say which way a contribution review went, so nothing claims it did |
| ~~B-15~~ | ~~A brand mark~~ | the owner's `icareu` mark and wordmark, source in `design/brand/`, inlined in `apps/web/src/components/elder/BrandMark.tsx` and shipped as `apps/web/public/favicon.svg` | **Closed 2026-08-29.** It arrived on this project's own icon grid — 24×24 at stroke-width 2, the same as `TabIcon` — and its `#b68235` is exactly `--cl-accent`, so nothing was reinterpreted. Still missing: an `apple-touch-icon`, which wants a square 180×180 raster and neither supplied PNG is square |
| ~~B-16~~ | ~~A name to greet~~ | `getMyProfile` (M02) behind `participant.view-own`, served at `GET /v1/participants/:id/profile` | **Closed 2026-08-29.** The name had been in `participant_profile.participants.display_name` since M02's first migration; what was missing was a way for its owner to read it. Null is still a real answer — a participant with no profile row is a normal synthetic-setup state — and the greeting then stands on its own rather than falling back to the identifier |
| ~~B-17~~ | ~~Who offered this~~ | the contributor's account id from M17, turned into a name by M01's `AccountNameQueryPort` in the controller | **Closed 2026-08-29 by an owner ruling that reverses an earlier one.** The query used to withhold the contributor because naming them in a list "would let anyone enumerate who has been writing about them". Weighed against it: the endpoint is owner-only, so "anyone" was never the caller but whoever else can see the screen; and somebody deciding whether another person's words enter their own life story needs to know who wrote them more than the list needs the discretion. Both sides of the trade are recorded in the query's own comment. An account with no name shows as a stated gap, never as an identifier |
| B-18 | **Helper mode defers decisions** — the design's `helper` screen says "those decisions are put aside and shown to you again once helping stops" | D-15's read-only assistance, and B-13 | Same gap as B-13, seen from the screen that promises it. The sentence is **not printed**: it is the one thing somebody is relying on while another person reads their screen, and nothing in the platform does it. What the screen says instead is what is true — the decisions stay theirs and nothing is held back |
| B-19 | **Showing the photograph on the caption screen** — the design puts the picture above the field | nothing serves a released object's bytes to a client | The screen asks somebody to say who is in a photograph it cannot show them. Quarantined bytes are deliberately never served; what is missing is the released path. Until it exists the screen says the picture cannot be shown rather than leaving a blank space that reads as a failure to load |

## Where the build departs from the handoff, and why

| # | The handoff says | The build does | Why |
|---|---|---|---|
| X-1 | Toolbar controls are 34×34 | 44×44 | The same document requires that targets are "44px absolute floor … Never below 44". Both cannot hold; a stated rule outranks a measurement that contradicts it |
| X-2 | A visible "Text" label before A−/A+ | No visible label | The owner requires one row. Measured at 320px the row was 50px over; dropping the label and taking the gap back to the handoff's own 6px is exactly that. Neither button is unlabelled — each carries "Make the text smaller"/"bigger" as its accessible name |
| X-4 | A FR/EN toggle in the toolbar | No toggle | The study is English only (owner, 2026-08-28). Removing it is also what bought the width for one row |
| X-3 | Five tabs, 13px labels | Same, stepping to a smaller size below 24.5rem | Measured: "Community" is one word and clipped at 320 and 360. A clipped word is not a smaller word |
| X-6 | The unfinished card says "You added a photograph on Tuesday" | "You added it on 18 August 2026" | A weekday alone is unambiguous for about a week, and an uncaptioned photograph is exactly the thing that sits for months. Same reason the waiting card spells its date out |
| X-7 | Home greets by name | "Good morning" | No name exists to greet with — B-16 |
| X-8 | Home's third chevron row is "Exercises you can try" → `exercises` | "Your part in the research" → the enrolment view | The `exercises` screen does not exist and has nothing to record into (B-10). A row that opens nothing is the mistake this project has made five times over. The row it replaces is a real screen |
| X-9 | Toolbar controls 34×34 | `--target-min`, which is 49.5px at this workspace's 18px root | The same document requires "44px absolute floor … Never below 44" — X-1 restated with the true number. The earlier note said 44; 2.75rem against an 18px root is 49.5, and the arithmetic in the older comments assumed 16 |
| X-10 | Chevron rows in Lora 18px on one line | Lora 18px at every width, wrapping below 390px | The handoff's frame is 404px and it says the layout "scales by stretching, not reflowing". Measured: one line at 404 and 390; at 360 and 320 the longest of the three takes a second line. Stepping the type down would have kept the line count and cost every phone 3px of body text, which is the wrong trade for this reader |
| X-11 | The toolbar shows the wordmark and the speaker glyph together | Two breakpoints: the glyph goes below 414px, the name below 374px | Measured with the whole wide configuration forced on, the bar needs 400px; with the glyph hidden, the name alone fits from 364. One breakpoint would serve the stricter number and take the name off a 390 phone and off the handoff's own 404 frame. The glyph is decorative and `aria-hidden`; §A.9 forbids an icon without a label, not a label without an icon |

## Not gaps — deliberate absences the design shares

- No timers, no auto-dismissing anything. The platform already refuses this and so does the design.
- No score, ever, on an exercise.
- Photographs: **no photographic assets exist**, and the design uses labelled grey placeholders throughout. Production must not substitute stock imagery of older people for real participants' photographs.
