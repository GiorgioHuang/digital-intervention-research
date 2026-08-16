# RESEARCHER_WORKSPACE — design specification for the researcher and administration workspaces

> Covers UI_INVENTORY section C (17 researcher units, C1–C17) and section G (7 administration units, G1–G7) — **24 interface units** in total.
> Source of specification: Doc 20 v1.3 §17, §21, §37, §41, §57–91, §251–270; Doc 19 v1.3 §10 (the ten epistemic types), §38 (finding types); every non-negotiable principle in DESIGN_BRIEF; THREAT_MODEL / SECURITY_AND_PRIVACY_PLAN; KNOWLEDGE_GRAPH_INTEGRATION (the evidence search in C3/C4 is genuinely connected to the Healthy Aging Knowledge Graph MCP).
> Form of delivery: a structured specification + ASCII wireframes, with no visual mockup images (DESIGN_BRIEF §7.3).
> Dependencies: the design system foundation A1–A9 (tokens, icons, breakpoints) is defined in `design/DESIGN_SYSTEM.md`. This file references its token names (`--color-*` / `--space-N` / `--type-size-N` / `--density` / `--target-gap`); **where the two disagree, DESIGN_SYSTEM.md wins**, and this file's semantic constraints (which element carries which guarantee) are unchanged.
> This file changes no code and modifies no other file under design/.

---

## 0. How to read this, and the statement of scope

**The facts of the phase (which the interface must tell the truth about)**: this is currently a conceptual research prototype (ADR-061/062). The participants are synthetic personas, the data is synthetic, the providers are simulators, and identity is the dev-header stub. Therefore:

- **Every number, every table and every analysis output** that appears in the researcher workspace must carry a data-source marking: `[synthetic data]`.
- No screen may use wording implying that ethics approval has been obtained or that real participants are being recruited.
- The consent and approval screens are UX models of the **future system being modelled**; where the researcher workspace refers to them, it qualifies them with "(model)".

**Every interface unit in this file follows the same five parts**: ① purpose and information-density position ② the ASCII wireframe ③ the state matrix (loading / empty queue / error / insufficient permission / strong authentication required) ④ key interactions and the confirmation copy in full ⑤ accessibility points.

---

## 1. Rules shared by the researcher and administration workspaces

This section is the common foundation for all 24 interfaces. The per-interface sections record only what differs and do not repeat any of this.

### 1.1 Information density: high density is allowed; sacrificing readability is not

Doc 20 §17 requires the researcher workspace to be optimised for information density, and §315 requires the dense/standard/spacious levels to come from **one source**. The design system (design/DESIGN_SYSTEM.md) implements the three levels with **one scale + a `--density` multiplier**: dense = 0.75, standard = 1, spacious = 1.25. The researcher and administration workspaces set `--density: .75` on their container, which **compresses spacing only, never the font size**. The hard floors are below, and breaching one is a design error:

| Dimension | Value at dense | Hard floor (never conceded to density) |
|---|---|---|
| Body font size | `--type-size-1` (1rem = 18px at a 112.5% root) — **dense does not change the font size** | Text carrying meaning must never fall below `--type-size-1`; `--type-size-0` (15px) is allowed only for timestamps and units inside `<small>`; there is no such thing as a "tiny secondary label" (§314) |
| Line height | Dense table cells use `--type-leading-snug` (1.4) | ≥ 1.4; prose text (explanations, limits, reasons) returns to the standard body line height |
| Table row height | Content rows take `--space-5` padding (dense ≈ 20px) | **A row containing an interactive control is ≥ 2.75rem (44px)**, see 1.9 |
| Column spacing | `--space-3` (dense ≈ 10px) | The clear gap between adjacent tappable targets is ≥ `--target-gap`, and **they must never overlap under any circumstances** (this has already been a real defect: 44px buttons inside a 29px line box, overlapping each other); row-level actions in a dense table must extend the hit area to 44px with `::before` (see the corresponding item in DESIGN_SYSTEM) |
| Measure | Unlimited in tables; ≤ 76 characters for prose blocks | Explanatory, consequence and reason text is ≤ 76 characters |
| Primary decisions per screen | 1 | A single screen must never place two high-impact decisions side by side (DESIGN_BRIEF §2) |

**Density is achieved by "more columns, tighter rows, clearer hierarchy", not by "smaller text, lower contrast, cramped spacing".** High density comes from the following, never from reducing the font size:

1. Tables default to few columns (5–7), with the rest behind a "choose columns" control (§251), and a **saved view** remembering the choice;
2. Long identifiers (`pv_7`, `sha256:…`) are truncated by default with the full value in `title` and a copy button — but **version numbers and hashes are always shown in full on an approval screen** (see 1.4);
3. Detail is reached by expanding a row or through a detail panel on the right, never by stacking dialogs;
4. On mobile, tables degrade to card lists (§251: horizontal overflow alone is not acceptable).

### 1.2 The epistemic tag system (Doc 19 §10's ten types → a visual specification)

**This is the most important component in the researcher workspace.** Any element that states a conclusion must be able to answer "what kind of knowledge is this".

Component name: `EpistemicTag`. Presentation = **icon + label + (on first appearance) the formal term**, with colour only as support (§311, colour must not be the only state indicator). The border form encodes how well established something is, and the form is not the only indicator either — the label already says it.

> *(Corrected 2026-08-16: this table previously had a "Chinese label" column and an "English" column, from when the interface was Chinese. Since D-9 every interface string is English, so the label column below is the label a reader actually sees, and the formal term is kept beside it because several of them — "source-derived", "deductive consequence" — are terms of art from Doc 19 that the plain label alone would blur.)*

| Type | Label | Formal term | Icon | Border | Additional requirement |
|---|---|---|---|---|---|
| 1 | Definition | definition | ▣ | Solid | — |
| 2 | From a source | source-derived | ◆ | Solid | **The source must be shown on the same screen** (DOI/PMID/document section) |
| 3 | Follows deductively | deductive consequence | ⊢ | Solid | The premises must be expandable |
| 4 | Design assumption | design assumption | ◇ | Dashed | Footnote: "this is an assumption and has not been verified." |
| 5 | Simulated observation | simulated observation | ◌ | Dotted | Footnote: "this comes from a simulated run and is not empirical evidence." + the seed/scenario identifier |
| 6 | Prototype observation | prototype observation | ◎ | Dotted | Footnote: "this comes from a prototype execution record and is not empirical evidence." + the run identifier |
| 7 | Inference | inference | ↝ | Dashed | The basis for the inference must be expandable |
| 8 | Speculation | speculative proposition | ？ | Dashed | Footnote: "this is speculation and no source supports it." |
| 9 | Contradiction | contradiction | ⚠ | Double, heavy | **Never collapsed and never hidden by default** (Doc 19 §40) |
| 10 | Future empirical question | future empirical question | ⧗ | Dashed | Footnote: "the current research cannot answer this question." |

Rules:

- **Untagged = blocked.** Content stating a conclusion without an epistemic tag cannot be saved or submitted; the form validation copy is: `This has no epistemic tag yet. Choose which kind of knowledge it is.`
- **Synthetic data is never presented as empirical evidence**: tags of types 5 and 6 always carry the `[synthetic data]` source badge beside them, and that badge travels into exports and reports as well (C17).
- Screen readers: `EpistemicTag` renders as `<span class="epi" role="note"><span class="visually-hidden">Knowledge type: </span>Simulated observation (simulated observation)</span>`; the footnote is body text inside the same `role="note"`, never a tooltip.
- Sorting and filtering: any table listing conclusions must support filtering by epistemic type, and **filtering out the "contradiction" type requires an explicit action and shows "N contradictions hidden" in the table header**.

### 1.3 三级认识论阶梯：分析输出 ≠ 解释 ≠ 发现

This is the core discipline of C15/C16. All three must be distinguishable at a glance, visually and in wording:

| Layer | Object | Typography | Wording template | Forbidden |
|---|---|---|---|---|
| Output | `AnalysisOutput` | Monospace, no narration, a grey code block, the header marked `machine-computed result` | "The output of run `ar_12` against locked dataset `dv_9`" | Interpretive verbs such as "shows", "indicates", "suggests" |
| Interpretation | `InterpretationRecord` | A quotation block (heavy left border) + the person's name + the time + an epistemic tag | "<name>'s interpretation: …", "Alternative interpretation: …", "Limitations: …" | "Conclusion" or "proves"; the "alternative interpretation" field must never be omitted |
| Finding | `ResearchFinding` | A card + the approval-status stamp + **the exact version chain** (question / protocol / intervention / AI configuration / DatasetLock / AnalysisRun / Interpretation) | "Finding (<finding type>): …" + "Uncertainty: …" + "Limitations: …" | An AI draft presented as a finding; if any element of the version chain is missing it cannot be submitted |

**The finding type (Doc 19 §38)** must be chosen from a fixed set of eight: internally coherent / conditionally coherent / underdetermined / refuted / incomplete / implementation-dependent / source-dependent / left for empirical testing. This is the **theoretical finding type**, and it is a **separate dimension** from the approval state (§89: In Review / Approved / Approved with Limitations / Rejected / Superseded / Withdrawn / Archived). The two must be displayed side by side and must never be merged into a single "status".

### 1.4 Approval against an exact version (a hard constraint)

**Every approval screen must show, within the same viewport as the "approve" control: the type, identifier, exact version number and content hash of the object being approved.** None of it may go into a collapsed area, a tooltip, or a secondary page.

The standard block (component name `ExactVersionBlock`, reused by every approval screen):

```text
┌─ What you are approving ──────────────────────────────────────┐
│ Type       ProtocolVersion                                     │
│ Identifier pv_7f3a91c2                          [copy]         │
│ Version    v2                                                  │
│ Content hash  sha256:9b1c4e0a7d55f2318a6e0c4477bd91ea… [copy][full]│
│ Drafted by  researcher_lin     Submitted 2026-08-01 09:14 CST  │
│ Differences from the previous version  12 (3 touching consent, │
│                                         1 touching dataset boundaries) │
│                                              [View the differences by section] │
└───────────────────────────────────────────────────────────────┘
```

Rules:

- The hash shows the first 16 hex characters + `…` by default; `[full]` expands it in place to the complete value (never navigating away), and the complete value can be selected and copied. **The approval confirmation dialog shows the hash in full.**
- If the object is rewritten while you are reading it (`VERSION_CONFLICT` / a change in the record's version), the approval control is disabled immediately and shows: `This object was changed while you were looking at it. Open the latest version again before deciding.`
- Evidence snapshots (C4) and dataset locks (C14) additionally carry a `manifestHash`; it is displayed alongside in the same block and never merged with the content hash.

### 1.5 Separation of duties (stated up front, never as an error after submitting)

Backend behaviour (already implemented): `m04` protocol approval and `m15` approval decisions throw `AUTHORISATION_DENIED` ("Self-approval is not permitted") when the submitter is the decision-maker; `m12` dataset-definition approval throws `INVALID_STATE_TRANSITION` ("Definition not approvable, or self-approval attempted"); and for `m14` export decisions, "the decision-maker is not the requester" is enforced both in code and by a database CHECK. **Rejecting an export goes through the same `export.approve` permission key as approving one, so rejection equally requires MFA and is equally bound by separation of duties** — the interface must never present "reject" as the lower-privilege action.

**The export queue contains two kinds of decision that are not the same thing, and one screen's tone must not cover both (added 2026-08-04)**: a `ResearchExport` hands **somebody else's data** to a third party; a `ParticipantPortability` request is **a person asking for their own information**. For the latter, "de-identification: none" is not a finding but the point of the thing — it *is* their own information. Presented in the register of a research export, an approver might refuse a legitimate data-subject request; and conversely, someone used to reading that line might grow lax about a genuine research export (the database CHECK already refuses identifiable research exports, and the screen says so directly rather than leaving the approver to worry about it). Hence: the type is rendered in plain words, the consequences of approving and of rejecting are worded separately, and **the restrictions already placed on the request are shown** (a portability request carries "third-party content excluded" by default — not showing it leaves the approver to assume the worst case). When rejecting a person's request for their own information, the confirmation copy says honestly what is being refused, while keeping "rejection has the same permission and the same strong authentication as approval".

The design requirement: **a user knows they cannot approve something before they ever see the button.**

Three layers of forewarning:

1. **The queue**: every row in the pending list shows the submitter/requester; where the submitter is the current identity, that row's decision button is `disabled` and an explanation appears in the row itself (never as a tooltip):
   `You submitted this, so under separation of duties you cannot approve it. Another approver can handle it.`
2. **The detail**: a permanent line below the `ExactVersionBlock` giving "your relationship to this object": `You are the submitter of this version.` / `You neither drafted nor submitted this version, so you can decide it.`
3. **The drafting side** (the submit actions in C5/C14/C17): the submit confirmation states the consequence in advance —
   `Submitting records you as the submitter. You will not be able to approve this version afterwards (separation of duties). Submit it?`

Forbidden: putting separation-of-duties information only in the error after submission; and a button that can be pressed and then returns 403.

### 1.6 The strong-authentication (MFA) forewarning contract

The actions the backend's `packages/policy/src/catalogue.ts` genuinely requires `minimumAuthStrength: 'mfa'` for (within this file's scope):

> *(Verified against the catalogue on 2026-08-16: it declares exactly ten actions at the mfa tier, and they are exactly the ten below. None of the actions listed as confirmation-only carries `mfa`. Both halves of this section are therefore accurate — which matters, because an over-warning is as much a design error as an under-warning.)*

| Action | Permission key | Appears in |
|---|---|---|
| Approve a protocol version | `protocol.approve` | C6 |
| Approve a research project | `project.approve` | C2 |
| Approve an intervention version | `intervention.approve` | C7 |
| Lock a dataset | `dataset.lock` | C14 |
| Approve a research finding | `finding.approve` | C16 |
| Approve an export | `export.approve` | C17 |
| An M15 approval decision | `approval.decide` | C6/C14/C17/across G |
| System configuration | `system.configure` | G3/G4/G6 |
| Execute break-glass access | `break-glass.execute` | G7 (SystemAdministrator only) |
| Convert to a safety event | `safety-event.create` | The safety workspace (referenced here only in C13) |

Requiring confirmation but **not** MFA (mislabelling these as MFA is "over-warning", and is equally a design error): approving an evidence review, approving an evidence decision, approving an analysis plan, approving an interpretation, approving a dataset definition, **activating** a protocol/project/intervention, an eligibility decision, approving a report, placing a governance hold, and break-glass review.

**The forewarning contract (three moments; missing any one is an error)**:

1. **On entering the screen**: a "strong-authentication actions on this screen" bar at the top, listing which of this screen's buttons require MFA.
2. **On the control**: the button text itself carries `(requires strong authentication)`, rather than an icon hinting at it.
3. **The first line of the confirmation dialog**: `This action requires strong authentication (MFA).` Where the current session's authentication strength is insufficient, **the button is disabled from the outset** and an actionable next step is given:
   `You are authenticated at the password tier and cannot carry out this action. Sign in again with strong authentication (MFA) and come back.` (On the current dev stub: `Sign out and choose "MFA" in the development sign-in stub.`)

Forbidden: raising the strong-authentication requirement only after a click; and treating `STEP_UP_AUTHENTICATION_REQUIRED` as a normal path — its appearance is by definition a failure of forewarning, and the interface should say `You should have been told this in advance. Please report this to the platform maintainers.`

### 1.7 Provenance before assertion: the evidence card specification (the core of C3/C4, reused throughout)

Component name `EvidenceResultCard` (Doc 20 §60). **Strong and weak evidence must not be presented as equals.**

The fixed field order (provenance comes before the assertion):

```text
┌─ Evidence result ─────────────────────────────────────────────┐
│ ① Provenance  DOI:10.1177/1088868310377394   [Open in the source system]│
│ ② Source system  graceage-knowledge-mcp                        │
│    Search identifier (version)  sha256:4c1a…e097   Searched 2026-08-03 11:02│
│ ③ Study design  systematic review / meta-analysis              │
│ ④ Evidence strength  high (tier: high, score 80) ← upstream curation metadata [source-derived]│
│ ⑤ Population relevance  community-dwelling adults 65+   ⑥ Setting  non-clinical│
│ ⑦ Direction  reduces risk (reduces_risk_of)                    │
│ ⑧ Conflict marker  ⚠ conflicting evidence exists (2)  [Compare side by side]│
│ ⑨ Licence  not stated (do not redistribute on this basis)      │
│ ⑩ Title and abstract  Social participation and loneliness…     │
│    "The abstract is upstream content, not a conclusion of this platform."│
│ ── Decision ──  ( ) Include   ( ) Exclude   ( ) Defer   Reason: [__________]│
└───────────────────────────────────────────────────────────────┘
```

Mandatory rules:

- **Evidence must never be compressed into a single confidence colour** (§60). Strength is expressed by three things together: the tier in words, the study design, and the score.
- **Weak, indirect and missing evidence are shown explicitly**, and **not in the same format as strong evidence**:
  - Strong (`tier: high`): the full card, solid border.
  - Moderate/low (`moderate`/`low`): a line at the top of the card reading `The evidence is weaker — not enough to support an intervention decision, only enough to support "further research is needed".`
  - Indirect (population or setting mismatch): add `Indirect evidence: the source population differs from this study's population (<difference>).`
  - **Missing**: not "no results" but an explicit `evidence gap card`: `No evidence was found on this question. That is itself part of the research finding.` with a `Record as a knowledge gap` action.
  - **Conflicting**: `⚠ conflicting evidence` is always visible, with the side-by-side comparison view §61 requires; conflict must never be averaged away or resolved by taking the highest.
- **The source system's certainty/quality is upstream curation metadata**, marked `[source-derived]` on the card, worded: `This is the rating the source system gave, not a judgement by this platform.`
- **An unavailable dependency must never collapse into "no evidence found"**: `DEPENDENCY_UNAVAILABLE` (HTTP 503) is shown as "the search did not complete"; see the error states in 1.8.

### 1.8 The five-state matrix, defined once

Each interface section's state matrix records only what is specific to that screen; the common foundation is below.

| State | Trigger | Common presentation | Common copy |
|---|---|---|---|
| Loading | The request has not returned | The skeleton preserves the final layout's row count and column widths (to prevent jumping); `aria-busy="true"` on the region container; announced once via `role="status"` | `Loading…` (after 3 seconds, add: `Still loading; the connection may be slow.`) |
| Empty queue | 200 with 0 rows | **No illustration placeholder**; one sentence of fact + one next action | `There is nothing waiting.` (made specific per screen; see the sections) |
| Error | 4xx/5xx | Graded: recoverable / blocking / safety-critical / security-critical (§231–237); shows the error code + an explanation + **the next step**; never blames the user | See the table below |
| Insufficient permission | `AUTHORISATION_DENIED` / `SPECIFIC_PERMISSION_REQUIRED` | Replaces the main area in place, without navigating away; says which permission is missing and whom to ask | `Your role does not hold the permission for this action. It needs <role>. You can ask your organisation's administrator for it.` |
| MFA required | The session's authentication strength is below what is required | The button is disabled + the strong-authentication bar at the top + an explanation in place (1.6) | `This action requires strong authentication (MFA). You are authenticated at the password tier.` |

Error code → copy (one table for the researcher and administration workspaces; anything not listed is treated as an unexpected error):

| Code | Grade | Copy | Next step |
|---|---|---|---|
| `RESOURCE_NOT_FOUND` | Blocking | `This object cannot be found, or you do not have permission to see it.` | `Check the identifier, or ask a colleague who has permission.` (Protected existence: "does not exist" and "not permitted" must not be distinguished) |
| `VERSION_CONFLICT` | Recoverable | `This object was changed while you were looking at it.` | `[Reload the latest version]` (keeping any reason text you have typed) |
| `CONFIRMATION_REQUIRED` | Recoverable | `This action needs explicit confirmation.` | Open the confirmation dialog |
| `STEP_UP_AUTHENTICATION_REQUIRED` | Blocking | `This action requires strong authentication (MFA). The interface should have told you in advance — that is a defect.` | `Sign in again with MFA, and report this to the platform maintainers.` |
| `AUTHORISATION_DENIED` (self-approval) | Blocking | `You submitted this, so under separation of duties you cannot approve it.` | `Ask another approver to handle it.` |
| `INVALID_STATE_TRANSITION` | Blocking | `This object's current state does not allow this action.` | Show the current state and the permitted next steps |
| `IMMUTABLE_RESOURCE` | Blocking | `This object can no longer be changed.` | `To change it, create a new version.` |
| `DATASET_LOCK_NOT_READY` | Blocking | `This dataset version cannot be locked yet.` | List the unmet preconditions, each linked |
| `LINEAGE_INCOMPLETE` | Blocking | `The lineage is incomplete and this cannot continue.` | Name the missing source version |
| `DEIDENTIFICATION_REQUIRED` | Blocking | `This export does not meet the de-identification requirement.` | Name which source does not meet it |
| `EXPORT_REQUIRES_APPROVAL` | Recoverable | `An export must be approved first.` | `[Submit an approval request]` |
| `CONSENT_REQUIRED` / `PURPOSE_NOT_PERMITTED` | Blocking (security-critical) | `The consent scope or purpose of use for this data does not allow this action.` | `Check the research purpose you selected; if it is genuinely needed, go through a protocol amendment.` |
| `DEPENDENCY_UNAVAILABLE` | Recoverable | `The search did not complete — the external knowledge base cannot be reached right now. This does not mean "there is no evidence".` | `[Try again]`; **showing an empty result list is forbidden** |
| `DATA_QUALITY_FAILURE` | Blocking | `The data quality rules did not pass.` | Link to the list of quality problems |
| `AUDIT_UNAVAILABLE` | Safety-critical | `The audit log cannot be written at the moment, so this action was not carried out.` | `Try again later; do not work around it.` |

### 1.9 Tables and the keyboard: the accessibility baseline (shared by every list screen)

- Semantics: `<table>` + `<caption>` (visible or `visually-hidden`) + `<thead><th scope="col">` + a `<th scope="row">` in each row carrying the primary identifier. **No div grids** (the existing a11y tests depend on roles and accessible names).
- Sorting: `<th aria-sort="ascending|descending|none">` + a `<button>` inside the header cell, with an accessible name of the form `Sort by submitted time (currently: ascending)`. After sorting, `role="status"` announces `Sorted by submitted time, ascending, 12 rows.`
- Row actions: **each action button's accessible name must be unique and contain the object's identifier** (for example `Open pv_7f3a91c2`), or neither a screen reader nor a test can tell them apart.
- Touch: rows containing an action have `min-height: 2.75rem`; the action column is `display:flex; gap: .5rem;` with buttons at `min-height: 2.75rem` — **never force a 44px target into a 29px line box** (a defect that has actually happened).
- Keyboard: tables use the ordinary Tab order (no grid roving tabindex unless there are more than 12 columns and it has been separately usability-tested); row expansion uses a `<button aria-expanded>` controlling the row immediately after it.
- Pagination: `<nav aria-label="Pagination">`; after a page change it announces `Page 2 of 5, showing rows 26–50.`
- Filtering: after a filter change it announces the result count, `7 rows after filtering.`; **"contradictions / low-strength evidence have been hidden" must be announced explicitly**.
- Mobile (< 48rem): tables become card lists, each card with an `<h3>` as its primary identifier; never relying on horizontal scrolling. Where a table genuinely needs to scroll horizontally, the scroll container gets `tabindex="0"` + `role="region"` + `aria-label`.
- 200% zoom: the column selection drops automatically to the essential columns, and the page never scrolls horizontally.

### 1.10 The workspace boundary banner (mandatory in section G, applicable in section C)

Doc 20 §21: **administration grants no research, moderation or safety authority**. §41: research findings and moderation decisions are not administrative KPIs.

Every administration screen carries a permanent, non-decorative boundary statement at the top (`role="note"`, not dismissible):

`The administration workspace governs running and access only: accounts, roles, integrations, jobs, flags and audit. It grants no research, moderation or safety authority — research conclusions, moderation decisions and safety dispositions are neither made here nor shown here.`

The corresponding boundary statement in the researcher workspace (appearing in C1 and C13):

`The safety information shown in the researcher workspace is the minimum necessary indicator. Detailed safety review happens in the safety workspace, not here.`

---

## 2. C. Researcher workspace (C1–C17)

### C1 Researcher dashboard (Doc 20 §37)

**① Purpose and density**: let a researcher see in one screen "who is waiting on me today", and **do not make it a feed**. Density: dense; a grid of section cards (3 columns on desktop / 2 on tablet / 1 on mobile). Each card is a **queue**, not a KPI number — the numbers are only secondary annotation. Turning "number of findings" or "number of participants" into achievement-style large numerals is **forbidden** (the no-dark-patterns principle).

**② Wireframe**

```text
┌───────────────────────────────────────────────────────────────────────┐
│ [Skip to main content]                                                │
│ Researcher workspace  Identity: researcher_lin (password tier)  Project: RP-001 ▾ │
├───────────────────────────────────────────────────────────────────────┤
│ ⓘ All data is synthetic (conceptual research phase). No number here is an empirical result. │
│ ⓘ Strong-authentication actions on this screen: none. Approval actions live on their own screens and are marked in advance. │
├───────────────────────────────────────────────────────────────────────┤
│ ┌ Waiting for me ──────────────┐ ┌ Waiting for others (mine) ──────┐ │
│ │ • Protocol versions to review 3 │ │ • Protocols I submitted, awaiting approval 2 │ │
│ │ • Evidence reviews to finish  1 │ │ • Exports I requested, awaiting approval 1 │ │
│ │ • Interpretations to draft    2 │ │   (separation of duties: I cannot approve my own) │ │
│ │            [Open my queue]      │ │            [See submission status] │ │
│ └──────────────────────────────┘ └─────────────────────────────────┘ │
│ ┌ Enrolment and assessment ────┐ ┌ Delivery problems ──────────────┐ │
│ │ Enrolled 24 · awaiting activation 3 · withdrawn 1 │ │ Delivery unconfirmed 2 · failed 1 · interrupted 1 │ │
│ │ Assessments due 5 · overdue 2 │ │ "unconfirmed ≠ they received it" │ │
│ └──────────────────────────────┘ └─────────────────────────────────┘ │
│ ┌ Safety (minimum necessary) ──┐ ┌ Data quality and datasets ──────┐ │
│ │ Open safety signals 2 · currently suspended 1 │ │ Unresolved quality problems 4 (1 blocking) │ │
│ │ ⓘ Detailed review happens in the safety workspace. │ │ Dataset versions lockable 1 (needs strong authentication) │ │
│ └──────────────────────────────┘ └─────────────────────────────────┘ │
│ ┌ AI awaiting human review ────┐ ┌ Milestones ─────────────────────┐ │
│ │ AI drafts awaiting human review 6 │ │ Conceptual research completion criteria 3/7 │ │
│ │ ⓘ An AI draft is not a decision. │ │ [View the research traceability matrix] │ │
│ └──────────────────────────────┘ └─────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────────┘
```

**③ State matrix**

| State | Presentation |
|---|---|
| Loading | Six card skeletons keeping the card headings (the headings are static copy and render first); `aria-busy` on the grid container |
| Empty queue | Each card has its own empty state. Queue: `There is nothing needing your attention.` Safety: `There are no open safety signals.` No large zeros |
| Error | **Degrade card by card**, never fail the whole screen: that card shows `This section could not be loaded (<code>). [Try again]` while the rest render normally |
| Insufficient permission | A card you cannot see is not rendered as an empty shell; it says `Your role cannot see this section (it needs <role>).` The safety card shows counts only, and no content, to anyone who is not a SafetyReviewer |
| MFA required | The dashboard itself contains no MFA actions; links to screens that do carry `(requires strong authentication)` in the link text |

**④ Key interactions and confirmation copy**: the dashboard has **no** high-impact actions, only navigation. Any "approve in one click" here is a design error.

**⑤ Accessibility**: the grid is 6 × `<section aria-labelledby>`, so a screen reader can jump by heading; counts inside a card are written as complete sentences (`Protocol versions awaiting my review: 3`) rather than as isolated numbers; `role="status"` announces one summary only when a refresh completes: `Queue updated: 6 items waiting for you.`

---

### C2 Research projects and research questions (§57–58) — partially implemented

**① Purpose and density**: create a `ResearchProject` and a `ResearchQuestion`, and give "PICO + uncertainty + evidence needed" a structure. Density: standard leaning dense; the form is multi-step but **does not hide the existence of the later steps** (§247–249). Creation does not require every future detail to be filled in (§57).

**② Wireframe**

```text
Research projects › New project
┌───────────────────────────────────────────────────────────────┐
│ Step 1/3 purpose and scope   2/3 organisation and leads   3/3 first research question │
│ (A draft can be saved at any time; creating a project does not require every future detail.) │
├───────────────────────────────────────────────────────────────┤
│ Title*       [_____________________________________]          │
│ Purpose*     [multi-line, ≤76 characters per line ____]        │
│ Scope        [multi-line __________________________]          │
│ Organisation*[dropdown: organisation ▾]                        │
│ Leads*       [multi-select: actor ▾]                           │
│                                   [Save draft]  [Next]        │
└───────────────────────────────────────────────────────────────┘

Research projects › RP-001 › Research questions
┌───────────────────────────────────────────────────────────────┐
│ Primary question (exactly 1, required)                        │
│  Population P [__] Intervention I [__] Comparator C [__] Outcome O [__] Setting [__] │
│  Uncertainty*     [why the answer is not known now _______]    │
│  Feasibility goal [__________________________________]         │
│  Evidence needed* [what kind of evidence would answer it __]   │
│  Epistemic position* [dropdown: future empirical question ▾]  ⧗ future empirical question │
│  ⓘ In the conceptual research phase, most questions should land on "future empirical question" or "design assumption". │
│ ─ AI drafting ─────────────────────────────────────────────── │
│  [Have AI draft the wording]                                   │
│  ┌ AI draft (not adopted) ───────────────────────────────┐    │
│  │ 🤖 Drafted by AI · this is a draft, not a research question. │
│  │ "Among community-dwelling adults aged 65 and over, does a digital reminiscence intervention…" │
│  │        [Adopt as my wording] [Edit then adopt] [Discard] │  │
│  └───────────────────────────────────────────────────────┘    │
│ Secondary questions (0..n)                  [Add a secondary question] │
│                                   [Save draft]  [Submit the question] │
└───────────────────────────────────────────────────────────────┘
```

**③ State matrix**

| State | Presentation |
|---|---|
| Loading | Form fields render disabled with skeleton labels; anything already typed is restored from the local draft with the notice `Restored what you had not saved.` |
| Empty queue | An empty project list: `There are no research projects yet. A research project is what every protocol, dataset and finding belongs to. [New project]` |
| Error | `VALIDATION_ERROR` anchors in place to the field (`aria-describedby` points at the error text, and focus moves to the first field in error); a network error keeps every input, worded `This was not submitted, and everything you typed is still here. [Try again]` |
| Insufficient permission | Without `project.create` the form is not rendered, and it says `Your role cannot create research projects (it needs Researcher). You can still view existing projects.` |
| MFA required | Creating and drafting do **not** require MFA. **Approving** a project (`project.approve`) does, but that belongs to the C6 approval view; this screen states it in advance beside the submit button: `After submitting, an approver approves it with strong authentication (MFA). You cannot approve what you submitted yourself.` |

**④ Key interactions and confirmation copy**

- Submitting a research question (confirmation dialog):
  `Submit this research question? Submitting records you as the submitter, and you will not be able to approve it afterwards (separation of duties). This question's epistemic position is "future empirical question" — the interface will go on marking it that way.`
  Buttons: `Confirm and submit` / `Go back and keep editing`
- Adopting an AI draft (confirmed in place, not in a dialog):
  `Once adopted, this text becomes your wording and is yours. The AI's involvement is recorded in this question's provenance.`
- Discarding a draft: `Discard this AI draft? It will not be saved.`

**⑤ Accessibility**: the three-step form uses an `<ol>` step indicator + `aria-current="step"`; the AI draft area is `role="region" aria-label="AI draft (not adopted)"` with readable "drafted by AI" text before the draft (never carried by an icon); each of the five PICO fields has its own `<label>`, and a placeholder is never used in place of a label.

---

### C3 证据检索与结果卡（§59–61）— 真实 KG 对接

**实施状态（2026-08-04）：部分实现。** 检索、建评审、附引用、提交、他人批准这条链已可达；此前检索能调、附引用能调，**但没有任何查询列出评审**，于是一份评审只能由在产品之外记着标识的人来建、来加、来提交，链尾的评审队列也没有任何人够得到。三条措辞守住本节的要求：（1）**先出处、后论断（§51）**——结果卡先出「来源系统 · 外部标识 · 版本」，再出标题与摘要；摘要是检索系统对一篇东西的说法，出处才是让人判断要不要信它的东西。（2）**检索失败不写成「没有证据」**——上游不可达返回 503，屏上显示为错误，绝不显示空结果；「问不到」与「没有」是两件事。（3）**解析失败的引用不被渲染成引用**——解析不到时记录以原始标识作标题、来源写 `unknown`，若与已解析的并排照常渲染，就把「我们找不到这个」变成了看起来像一条引用的东西；因此逐条标注解析状态，批准屏还在控件旁统计「N 条中有 M 条未与来源核对过，批准并不会去核对它们」。

冲突证据的呈现（§60）与证据快照已随 C4 实现。

**① 目标与密度**：把外部知识图谱的检索结果变成**可审阅的证据材料**，而不是"答案"。密度：dense 列表 + 右侧详情栏（桌面）；手机为卡片流 + 详情下钻。**这一屏的数据是真的（真实 MCP 调用），但图谱内容是人工策展种子语料**——必须说清楚。

**② 线框**

```text
证据 › 检索
┌───────────────────────────────────────────────────────────────────────┐
│ ⓘ 检索结果来自外部知识库 graceage-knowledge-mcp（真实调用）。         │
│   图谱内容是人工策展的种子语料，规模有限，不足以支撑完整证据综述。    │
│   [来源推导] 检索结果不是本平台的研究结论；只有你人工附加的引用       │
│   才会成为平台状态。                                                  │
├───────────────────────────────────────────────────────────────────────┤
│ 检索问题* [loneliness in older adults ______________] [检索]          │
│ 绑定到研究问题 [RQ-001 ▾]   证据评审 [ER-004（草稿）▾ | 新建]        │
├─ 结果 5 条 ── 筛选：[强度 全部▾][研究设计 全部▾][冲突 仅看▢] 排序：[相关度▾]│
│                                                                       │
│ ┌ 1 ── ga:loneliness ────────────────────────────── 强度：高 ⚠冲突 ┐ │
│ │ 出处 DOI:10.1177/1088868310377394 · 设计 系统综述/元分析          │ │
│ │ 检索标识 sha256:4c1a…e097 · 检索时刻 2026-08-03 11:02             │ │
│ │ 人群 65+ 社区居住 · 情境 非临床 · 方向 降低风险                   │ │
│ │ ⚠ 存在冲突证据 2 条                        [并排比较冲突证据]     │ │
│ │ 摘要（上游内容，非本平台结论）：…                                 │ │
│ │ 决定：( )纳入 ( )排除 ( )暂缓  理由*[__________] [附加为引用]     │ │
│ └───────────────────────────────────────────────────────────────────┘ │
│ ┌ 2 ── ga:digital-reminiscence ─────────────────── 强度：低 ────────┐ │
│ │ ⚠ 证据强度较低——不足以支撑干预决定，只能支持「需要进一步研究」。 │ │
│ │ 间接证据：来源人群为混合年龄，与本研究人群（65+）不一致。         │ │
│ │ …                                                                 │ │
│ └───────────────────────────────────────────────────────────────────┘ │
│ ┌ 证据缺口 ─────────────────────────────────────────────────────────┐ │
│ │ 关于「数字化怀旧干预对孤独感的效果」没有检索到直接证据。          │ │
│ │ 这本身是研究发现的一部分。        [记录为知识缺口]                │ │
│ └───────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────────┘
```

冲突并排比较（§61）：

```text
并排比较：ga:loneliness 的冲突证据
┌──────────────────────────┬──────────────────────────┐
│ A  DOI:10.1177/108886…   │ B  PMID:29710…           │
│ 方向 降低风险            │ 方向 无显著影响          │
│ 设计 系统综述/元分析     │ 设计 随机对照试验        │
│ 人群 65+ 社区            │ 人群 75+ 机构居住        │
│ 强度 高                  │ 强度 中                  │
├──────────────────────────┴──────────────────────────┤
│ ⚠ 这两条证据不一致。不要取平均，也不要只取其中一条。│
│   请在证据决定里显式记录这个冲突。                  │
│   建议的证据决定取值：Conflicting Evidence（冲突证据）│
└─────────────────────────────────────────────────────┘
```

**③ 状态矩阵**

| 态 | 呈现 |
|---|---|
| 加载 | 检索按钮进入 `aria-busy`，文案 `正在检索外部知识库…`；**超过 15 秒**（语义检索冷路径真实存在）追加 `外部知识库的语义检索有时需要十几秒，仍在等待。`；不设自动超时取消（客户端 45 秒） |
| 空队列 | **区分两种空**：① 真的没有匹配 → 证据缺口卡（见线框），提供 `记录为知识缺口`；② 结果被筛选清空 → `当前筛选下没有结果。[清除筛选]`，并显示被筛掉的数量 |
| 错误 | `DEPENDENCY_UNAVAILABLE`：整块替换为 `检索没有完成——外部知识库现在连不上。这不代表「没有证据」。[重试]`，**绝不显示空列表**；`PROVIDER_TIMEOUT` 同理 |
| 权限不足 | 无 `evidence.search`：`你的角色不能检索证据（需要 Researcher）。` 参与者身份访问一律 403 |
| 需要 MFA | 检索与附加引用**不需要** MFA。屏顶强认证条显示：`本屏没有需要强认证的动作。` |

**④ 关键交互与确认文案**

- 附加为引用（确认对话框，因为这是"外部内容进入平台状态"的时刻）：
  `把这条外部证据附加为引用？
  会记录：外部标识 <ga:loneliness>、检索标识（版本）<sha256:4c1a…e097>、检索时刻 <2026-08-03 11:02>、以及你写的理由。
  附加之后，这条引用属于证据评审 ER-004，可以被排除但不会被删除。`
  按钮：`确认附加` / `返回`
- 记录为知识缺口：`把「<问题>」记录为知识缺口？这会成为一条带 [未来经验问题] 标签的研究记录，不是一个结论。`
- 排除/暂缓必须写理由，按钮在理由为空时禁用，说明文字：`排除也是研究记录的一部分，请写清理由。`

**⑤ 无障碍**：结果列表是 `<ol>`，每条 `<li>` 内 `<h3>` 为外部标识；筛选变更后 `role="status"` 播报 `筛选后 3 条，其中 1 条有冲突证据。`；"⚠ 冲突"必须有文字"存在冲突证据"，不靠图标；并排比较用 `<table>` 两列，列头为 A/B 的出处；`[在来源系统打开]` 为外链，加 `（在新窗口打开）`。

---

### C4 证据决定与快照（§62–63）

**实施状态（2026-08-04）：部分实现。** 可就某份评审写决定、由第二人同意；同意时在同一事务写入**不可更改的 EvidenceSnapshot**，内容哈希上屏——那份快照才是后续工作引用的东西，因此确认文案直说「这是措辞还能改的最后一刻，之后要改只能是一份新决定」。三条措辞：（1）**结果词表是平台的，不是界面发明的**——数据库拒绝词表之外的值，且「已批准／已拒绝／暂定」**不是**结果；结果回答「证据说什么」，批准回答「谁同意了」，把两者合一会让一份决定因为有人签了字而读起来像已成定论。（2）**「证据相互冲突」是一等结果**（§60），按发现来写而不是按「没能得出结论」来写；只提供支持/反对的词表会把写决定的人往夸大某一侧推。（3）与「证据不足」**明确区分**：一个是找到了且互相矛盾，一个是几乎没找到。决定可以写在尚未批准的评审上——命令允许，界面因此**如实警告而不假装拦截**（界面自行收窄等于发明一条服务器没有的规则）；批准屏另标「同意这份决定并不等于批准那份评审」。

**未实现**：证据快照的独立浏览屏（当前只在决定行内显示哈希）。

**① 目标与密度**：把一组证据引用收敛为**七选一的证据决定**，再冻结为**不可变快照**。密度：标准（这是决定屏，不是浏览屏）。**单屏一个决定**。

**② 线框**

```text
证据 › ER-004 › 证据决定
┌───────────────────────────────────────────────────────────────┐
│ 研究问题 RQ-001「数字化怀旧干预能否降低社区老年人的孤独感」    │
│ 纳入引用 4 · 排除 3 · 暂缓 1                  [查看全部引用]  │
│ ⚠ 其中 2 条被标记为冲突证据。冲突不会被自动消解。             │
├─ 决定（七选一，必选其一）─────────────────────────────────────┤
│ ( ) 支持                Support                                │
│ ( ) 有条件支持          Support with Conditions   → 条件* [__] │
│ ( ) 证据不足            Insufficient Evidence                  │
│ (•) 证据冲突            Conflicting Evidence                   │
│ ( ) 限制                Restrict                               │
│ ( ) 不予推进            Do Not Proceed                         │
│ ( ) 需要研究            Research Required                      │
│ ⓘ 这是科学结论；它与「谁批准了这个决定」是两件事，分开记录。   │
│ 适用性与局限*  [__________________________________________]    │
│ 认识论标签*    [来源推导 ◆]（自动建议，可改；不得留空）        │
│                                     [保存草稿] [提交决定]     │
└───────────────────────────────────────────────────────────────┘

证据 › ER-004 › 证据快照（创建前复核）
┌───────────────────────────────────────────────────────────────┐
│ 快照创建后不可更改。它会被协议版本引用为「批准时所依据的证据」│
├───────────────────────────────────────────────────────────────┤
│ 纳入的知识引用（4）                                            │
│  ┌────────────────┬──────────────┬──────────────┬───────────┐ │
│  │ 外部标识        │ 检索标识(版本)│ 检索时刻     │ 来源系统  │ │
│  ├────────────────┼──────────────┼──────────────┼───────────┤ │
│  │ ga:loneliness  │ sha256:4c1a… │ 08-03 11:02  │ graceage… │ │
│  │ ga:ucla        │ sha256:77b0… │ 08-03 11:03  │ graceage… │ │
│  └────────────────┴──────────────┴──────────────┴───────────┘ │
│ 排除的引用（3）与理由                            [展开]        │
│ 完整性  ⚠ 未覆盖：机构居住人群；理论节点仅 3 个（语料限制）    │
│ 许可    未声明——不得据此再分发原文                            │
│ 内容哈希  sha256:be31f0a9…（对纳入集合与理由的哈希）  [全文]   │
│                                        [创建快照（不可更改）] │
└───────────────────────────────────────────────────────────────┘
```

**③ 状态矩阵**

| 态 | 呈现 |
|---|---|
| 加载 | 引用表骨架；决定单选组在数据到齐前禁用（防止对空集合做决定） |
| 空队列 | 无纳入引用时**不允许**提交决定：`这个证据评审还没有纳入任何引用。没有引用的证据决定不成立。[回到检索]`（"证据不足"也必须基于至少一次检索记录） |
| 错误 | `INVALID_STATE_TRANSITION`：`这个证据评审已经提交或已完成，不能再改决定。`；`VERSION_CONFLICT`：保留你写的适用性文本并提示重载 |
| 权限不足 | 起草决定需 `evidence-decision.draft`（Researcher / EvidenceReviewer）；批准需 `evidence-decision.approve`（EvidenceReviewer）。研究者看到的批准按钮显示为 `批准由证据评审人完成（你没有这个权限）` |
| 需要 MFA | 证据决定批准**只需确认，不需要 MFA**。屏顶条：`本屏没有需要强认证的动作。批准由证据评审人确认执行。`（**不得**错标为 MFA） |

**④ 确认文案**

- 提交决定：`确认提交这个证据决定（证据冲突 / Conflicting Evidence）？提交后记录你是提交人，批准由证据评审人完成；你不能批准自己提交的决定。`
- 创建快照（这是不可逆动作，用 `alertdialog`）：
  `创建证据快照？
  快照会冻结当前纳入的 4 条引用、它们的检索标识与检索时刻，以及你写的排除理由。
  内容哈希：sha256:be31f0a97c4d1e2b…（完整值）
  快照创建后不可更改，也不能删除。协议批准会引用这个快照。`
  按钮：`创建快照（不可更改）` / `返回复核`

**⑤ 无障碍**：七个选项是 `<fieldset><legend>证据决定</legend>` 的 radio 组，**无预选**（默认无选中，避免暗黑模式诱导）；中英文并列写在同一 `<label>` 内；引用表符合 1.9；哈希用 `<code>` + 可复制按钮，可访问名 `复制内容哈希`。

---

### C5 协议版本编辑器（§64–65）— 已有局部实现

**① 目标与密度**：分节编辑一个协议版本，随时可见"完整度"与"与上一版差异"。密度：dense 三栏（章节导航 / 编辑区 / 右侧完整度与评论）；手机为单栏 + 章节抽屉。**自动保存不等于提交，更不等于批准**（§65 硬要求）。

**② 线框**

```text
协议 › PR-002 › 版本 v3（草稿）
┌──────────────┬────────────────────────────────────┬───────────────┐
│ 章节          │ 3. 干预与剂量                      │ 完整度 7/11   │
│ ✓1 目的       │ ┌────────────────────────────────┐ │ ✗ 5 同意影响  │
│ ✓2 人群       │ │ …正文编辑区…                   │ │ ✗ 8 数据集边界│
│ ●3 干预与剂量 │ │                                │ │ ✗ 9 匹配规则  │
│ ✗5 同意影响   │ └────────────────────────────────┘ │ ✗11 安全规则  │
│ ✗8 数据集边界 │ 引用的证据快照* [ES-011 sha256:be31…▾]│─ 评论(2) ────│
│ …            │ 引用的干预版本* [IV-004 v2 ▾]        │ 未解决 2      │
│              │ [让 AI 起草本节] 🤖                  │ @approver_wu │
├──────────────┴────────────────────────────────────┴───────────────┤
│ 草稿已于 11:32 自动保存。自动保存不会提交，也不会批准。            │
│ [查看与 v2 的差异] [校验] [提交评审]                               │
└───────────────────────────────────────────────────────────────────┘
```

**③ 状态矩阵**

| 态 | 呈现 |
|---|---|
| 加载 | 章节导航先渲染（结构已知），正文骨架；未加载完不允许编辑，避免覆盖 |
| 空队列 | 新建版本时所有章节为空：`这是一个空白的新版本。你也可以从 v2 复制内容再修改。[从 v2 复制]` |
| 错误 | 自动保存失败必须**显式**：`自动保存失败（<码>）。你的修改还在这个页面里，但没有保存到服务器。[重试保存]`——不得静默；`VERSION_CONFLICT` 走 §230 版本冲突呈现：并排显示你的版本与服务器版本，由人选择 |
| 权限不足 | 无 `protocol.draft`：只读模式，顶部 `你可以查看这个协议版本，但不能编辑（需要 Researcher）。` |
| 需要 MFA | 编辑与提交**不需要** MFA。提交按钮旁固定说明：`提交后由批准人以强认证（MFA）批准。你不能批准自己提交的版本。` |

**④ 确认文案**

- 提交评审：
  `确认提交协议版本 v3 评审？
  提交时会固定这一版的内容并生成内容哈希，批准人只能批准这个确切版本。
  提交后会记录你是提交人——此后你不能批准这个版本（职责分离）。
  还有 4 个章节未完成、2 条评论未解决；提交后这些仍会显示给批准人。`
  按钮：`确认提交` / `返回继续编辑`
- 离开未保存：`这一页有未保存的修改。离开会丢失它们。` `留在本页` / `丢弃修改离开`
- AI 起草：草稿插入时以 `🤖 AI 起草 · 未采纳` 区块包裹，`[采纳到本节]` 后区块消失并在本节来源里记录"AI 参与"。

**⑤ 无障碍**：章节导航是 `<nav aria-label="协议章节">` + 列表；完成状态用文字（`已完成`/`未完成`）不只用 ✓/✗ 符号（符号加 `aria-hidden` 并配文字）；自动保存状态用 `role="status" aria-live="polite"` 播报，但**限流**（每 30 秒最多一次，避免打断屏幕阅读器）；差异视图用 `<ins>`/`<del>` 语义标签，并提供"仅列出变更章节"的文本摘要（不依赖颜色区分增删）。

---

### C6 协议审批视图（§66、§89）— 已有局部实现

**① 目标与密度**：这是**精确版本后批准**原则最集中的屏。密度：标准（决定屏），信息完整但不堆叠第二个决定。

**② 线框**

```text
批准 › 协议版本 pv_7f3a91c2
┌───────────────────────────────────────────────────────────────────────┐
│ ⓘ 本屏的强认证动作：批准协议版本（需要 MFA）。你当前是 MFA 级认证。   │
├─ 你正在批准的对象 ────────────────────────────────────────────────────┤
│ 类型 ProtocolVersion  标识 pv_7f3a91c2 [复制]  版本号 v3               │
│ 内容哈希 sha256:9b1c4e0a7d55f231… [全文][复制]                         │
│ 起草人 researcher_lin  提交人 researcher_lin  提交 2026-08-01 09:14    │
│ 你与这个对象的关系：你不是起草人也不是提交人，可以决定。               │
├─ 与 v2 的变更（12 处）────────────────────────────────────────────────┤
│ • 3 处涉及同意（模型）：新增「社区参与」范围 → 需要重新同意           │
│ • 1 处涉及数据集边界：纳入消息元数据（不含内容）                       │
│ • 8 处文字修订                                    [查看逐节差异]      │
├─ 未解决评论（2）─────────────────────────────────────────────────────┤
│ @approver_wu 在 §8：数据集边界的措辞需要与 M12 定义对齐（未解决）      │
├─ 依据与影响 ─────────────────────────────────────────────────────────┤
│ 证据快照   ES-011  sha256:be31f0a9… （不可变）        [查看]          │
│ 干预配置   IV-004 v2                                   [查看]          │
│ AI 配置    Level-5 全禁（当前阶段）                    [查看]          │
│ 同意影响   需要重新同意：是（影响 24 名合成参与者）                   │
│ 社区/匹配  社区「园艺角」规则 v2；匹配策略无变化                       │
│ 审核/安全  审核负责人已就位：是；安全规则无变化                        │
│ 数据集定义 DD-003（草稿）——⚠ 尚未批准                                │
├───────────────────────────────────────────────────────────────────────┤
│ 决定（单选，必填理由）                                                │
│  ( ) 批准这个版本（需要强认证 MFA）                                    │
│  ( ) 退回起草人                                                        │
│ 理由* [__________________________________________________]            │
│                                              [提交我的决定]           │
└───────────────────────────────────────────────────────────────────────┘
```

**③ 状态矩阵**

| 态 | 呈现 |
|---|---|
| 加载 | `ExactVersionBlock` 优先渲染（版本与哈希是决定的前提，必须先到）；未到齐前决定区禁用并注明 `依据信息还没加载完，暂时不能决定。` |
| 空队列 | 待评审队列为空：`现在没有待你评审的协议版本。` + `你提交的版本会由其他批准人处理。` |
| 错误 | 自批准 `AUTHORISATION_DENIED`：本屏**不应到达**（队列层已禁用）；若仍发生，显示 `这是你提交的，按职责分离规则你不能批准它。界面本该提前拦住——这是一个缺陷。`；`VERSION_CONFLICT`：禁用决定区，`这个版本在你阅读期间被改动了。请重新打开最新版本。` |
| 权限不足 | 无 `protocol.approve`：显示完整只读审批视图（研究者需要看得到依据）+ `你可以查看，但不能批准（需要 ResearchApprover）。` |
| 需要 MFA | 密码级会话：批准单选项禁用并标 `需要强认证（MFA）`；`退回起草人` 仍可用（不需要 MFA）。说明：`你当前是密码级认证，不能执行批准。可以退回起草人，或以 MFA 重新登录后再批准。` |

**④ 确认文案（原文）**

```
确认批准 ProtocolVersion pv_7f3a91c2 版本 v3？
内容哈希：sha256:9b1c4e0a7d55f2318a6e0c4477bd91ea（完整值）
你批准的是这个确切版本。之后对协议的任何修改都必须走新版本。
这次批准会以 researcher_wu 的身份署名并写入审计。
影响：需要重新同意（24 名合成参与者，模型）；数据集定义 DD-003 仍未批准。
这个操作需要强认证（MFA）。
```
按钮：`确认批准这个版本` / `返回复核`

退回：`确认退回给起草人？会把你写的理由发给 researcher_lin，版本回到草稿状态。`

**⑤ 无障碍**：确认对话框 `role="alertdialog" aria-labelledby aria-describedby`，焦点进入后落在标题，Esc = 返回；哈希在对话框内以 `<code>` 完整呈现且允许换行（不横向滚动）；决定 radio 无预选；"未解决评论"是 `<ul>`，数量写进 `<h3>` 文本；`需要强认证（MFA）` 是按钮可访问名的一部分，不是纯视觉徽标。

---

### C7 干预配置（§67）

**① 目标与密度**：定义干预的目的、组件版本、路径、剂量、完成判据与保障。密度：dense 表单 + 组件版本表。

**② 线框**

```text
干预 › IV-004 › 版本 v3（草稿）
┌───────────────────────────────────────────────────────────────┐
│ 目的*        [___________________________________]            │
│ 结局映射*    [关联 RQ-001 的结局 O ▾]                          │
├─ 组件与版本（精确版本，逐行）─────────────────────────────────┤
│ 组件              │ 版本 │ 内容哈希      │ 顺序 │ 操作        │
│ 生命故事提示集    │ v4   │ sha256:0a1b…  │ 1    │ [更换版本]  │
│ 社区活动脚本      │ v2   │ sha256:77cd…  │ 2    │ [更换版本]  │
│ ⓘ 组件版本变更会改变干预的同一性——变更后需要新的干预版本。    │
├─ 路径 / 排程 / 剂量 ──────────────────────────────────────────┤
│ 路径 [标准 ▾]  排程 [每周 2 次 ▾]  剂量 [20–30 分钟]           │
│ 完成判据* [__________]   自适应范围 [±1 次/周]                 │
├─ 角色与规则 ──────────────────────────────────────────────────┤
│ 支持者角色 [仅协助记录 ▾]  生命故事规则 [参与者授权后可见 ▾]   │
│ 社区规则 [园艺角 v2 ▾]     匹配规则 [沿用协议 ▾]               │
│ AI 角色  [当前阶段：全部禁用（Level-5）]  🔒 不可在此开启      │
├─ 保障 ────────────────────────────────────────────────────────┤
│ ☑ 参与者可随时跳过任一活动      ☑ 安全信号可在活动内提交      │
│                          [保存草稿] [提交批准（批准需要 MFA）] │
└───────────────────────────────────────────────────────────────┘
```

**③ 状态矩阵**

| 态 | 呈现 |
|---|---|
| 加载 | 组件版本表骨架；下拉在版本清单到齐前禁用 |
| 空队列 | 无可选组件版本：`还没有可用的组件版本。干预必须引用确切的组件版本，不能引用「最新」。[去创建组件版本]` |
| 错误 | 引用了未批准的组件版本 → `INVALID_STATE_TRANSITION`：`组件「社区活动脚本 v2」还没有被批准，不能作为干预内容。` |
| 权限不足 | 无 `intervention.draft`：只读 + `你可以查看这个干预配置，但不能编辑（需要 Researcher）。` |
| 需要 MFA | 起草/提交不需要；`intervention.approve` 需要 MFA。提交按钮旁：`提交后由批准人以强认证（MFA）批准；你不能批准自己提交的版本。` |

**④ 确认文案**：`确认提交干预版本 v3 批准？提交会固定当前的组件版本组合（生命故事提示集 v4、社区活动脚本 v2）与内容哈希。批准人只能批准这个确切组合。`

**⑤ 无障碍**：组件表按 1.9；"AI 角色不可开启"是文字说明 + `disabled` 控件 + `aria-describedby` 指向原因，不是隐藏控件（隐藏会让人以为功能不存在，而事实是"被禁止"——§71 要求"被隐藏的敏感功能必须可见地写明禁止"）。

---

### C8 AI 干预配置与变更警告（§68–69）

**① 目标与密度**：展示 AI 的**有效配置**与**变更影响**。当前阶段 Level-5 全禁——**这不是"没有这个界面"，而是这个界面显示"被禁止"的事实与原因**。密度：dense 只读表 + 变更警告面板。

**② 线框**

```text
AI 配置 › 有效版本（只读）
┌───────────────────────────────────────────────────────────────┐
│ ⓘ 当前阶段：AI 行动等级 Level-5（全部禁用）。下列配置是被建模的│
│   未来系统的配置面，现在没有任何 AI 角色在运行。               │
├───────────────────────────────────────────────────────────────┤
│ 启用的 AI 角色    （无）— 全部禁用                             │
│ 模型别名          companion-draft-alias（未绑定供应商）        │
│ 供应商限制        仅限已审批供应商；当前 0 个已审批            │
│ 提示词版本        prompt_v0（未激活）  哈希 sha256:1f20…       │
│ 输出模式          life-story-draft.v1                          │
│ 检索来源          仅参与者本人内容；禁止跨参与者检索           │
│ 工具集            （空）                                       │
│ 行动等级          Level-5 全禁                                 │
│ 记忆策略          不保留（无会话记忆）                         │
│ 生命故事规则      AI 只能产出草稿，永不自动确认为证言           │
│ 社区/匹配规则     禁止 AI 参与匹配与互相接受                    │
│ 消息规则          AI 可起草，发送必须由参与者确认               │
│ 审核/安全策略     AI 分类结果不是安全事件                       │
│ 评估              未运行                                       │
│ 有效版本          aicfg_v0  哈希 sha256:c440…      [查看历史]  │
└───────────────────────────────────────────────────────────────┘

变更警告（当有人尝试修改时）
┌─ ⚠ 这是重大变更 ──────────────────────────────────────────────┐
│ 受影响参与者   24 名（合成）                                   │
│ 生效协议       PR-002 v3（已批准）                             │
│ 数据类影响     新增：会读取参与者生命故事草稿                  │
│ 干预保真度影响 干预内容将改变——不能与旧版本合并分析           │
│ 需要重新评估   是（AI 评估套件未运行）                         │
│ 需要重新同意   是（模型：新增数据用途）                        │
│ 发布方式       分阶段（先 0 名，再手动扩大）                   │
│ 回滚           可回滚到 aicfg_v0；回滚不撤销已产生的草稿       │
│ ⓘ 当前 Level-5 全禁，这个变更无法提交。这个面板显示的是「如果 │
│   可以变更，会发生什么」。                                     │
└───────────────────────────────────────────────────────────────┘
```

**③ 状态矩阵**

| 态 | 呈现 |
|---|---|
| 加载 | 只读表骨架 |
| 空队列 | 无历史版本：`还没有 AI 配置历史。当前是初始配置 aicfg_v0。` |
| 错误 | 读取失败：`AI 配置没能加载（<码>）。在加载出来之前，不要假设 AI 是关闭还是开启。[重试]`（失败关闭措辞） |
| 权限不足 | 非 Researcher/ResearchApprover：不显示提示词内容与哈希，显示 `提示词内容对你的角色不可见。` |
| 需要 MFA | 当前阶段不可变更，因此没有 MFA 动作。屏顶：`本屏没有可执行的变更动作（Level-5 全禁）。` |

**④ 确认文案**（未来启用时的模板，现在以禁用态展示）：
`确认把 AI 配置从 aicfg_v0 变更为 aicfg_v1？这会改变 24 名参与者接触到的干预内容，旧版本与新版本的数据不能合并分析。需要重新同意与重新评估。这个操作需要强认证（MFA）。`

**⑤ 无障碍**：Level-5 禁用不用灰字暗示，用明确文字 `全部禁用`；变更警告面板是 `role="note"`（非弹窗），八项影响是 `<dl>`；"不能提交"的原因写在按钮的 `aria-describedby` 里。

---

### C9 社区配置（§70）

**① 目标与密度**：配置 `CommunitySpace` 与其规则版本。密度：标准。**没有审核负责人就不能激活**（§70 硬要求）。

**② 线框**

```text
社区 › 园艺角 › 配置
┌───────────────────────────────────────────────────────────────┐
│ 目的*        [___________________________]                     │
│ 参与资格     [已入组且已同意「社区参与」▾]                     │
│ 规则版本*    [CR-园艺角 v2  sha256:5ac9… ▾]  [查看规则全文]    │
│ 审核负责人*  [（未指派）▾]  ⚠ 未指派                           │
│ 内容类型     ☑ 文字  ☑ 图片  ☐ 音频（本阶段不启用）           │
│ 可见性       [仅本社区成员 ▾]（默认最小可见性）                │
│ 举报与审核   举报去向：审核工作区；举报人身份不进入社区视图     │
│ 归档策略     [研究结束后只读归档 ▾]                            │
│ 原型阶段     [概念研究（合成参与者）]                          │
├───────────────────────────────────────────────────────────────┤
│ [保存草稿]  [激活社区] ← 禁用：未指派审核负责人               │
│ ⓘ 没有就位的审核负责人，社区不能激活。                        │
└───────────────────────────────────────────────────────────────┘
```

**③ 状态矩阵**

| 态 | 呈现 |
|---|---|
| 加载 | 规则版本下拉禁用直至清单到齐 |
| 空队列 | 无规则版本：`还没有社区规则版本。社区必须绑定一个确切的规则版本才能激活。[创建规则版本]` |
| 错误 | 激活时审核负责人被撤职 → `INVALID_STATE_TRANSITION`：`审核负责人已不在岗，社区没有激活。请重新指派。` |
| 权限不足 | 无 `community.create`：只读 + `需要 OrganisationAdministrator 或 Researcher。` |
| 需要 MFA | 社区创建/激活**不需要** MFA。屏顶：`本屏没有需要强认证的动作。` |

**④ 确认文案**：
`确认激活社区「园艺角」？激活后，符合资格的参与者会看到这个社区并可以加入。规则版本 CR-园艺角 v2（sha256:5ac9…）会作为加入时展示的确切规则。审核负责人：moderator_zhang。`

**⑤ 无障碍**：`激活社区` 按钮禁用时，`aria-describedby` 指向禁用原因文本；勾选框组用 `<fieldset><legend>`；"默认最小可见性"是**默认值**且在标签处写明"默认"。

---

### C10 匹配 / 互相接受 / 连接策略配置（§71）

**① 目标与密度**：配置匹配策略。**这一屏的设计要点是"能力的缺席必须可见"**：不得提供任何"自动互相接受 / 自动连接 / 自动消息"的选项，并且要写明这是被禁止的，而不是尚未实现。密度：dense 表单。

**② 线框**

```text
匹配策略 › PR-002
┌───────────────────────────────────────────────────────────────┐
│ 目的*             [___________________________]                │
│ 允许用于匹配的属性  ☑ 声明的兴趣  ☑ 语言  ☐ 所在城市          │
│ 禁止用于匹配的属性（不可更改，制度性禁止）                     │
│   ✗ 健康状况  ✗ 认知评估结果  ✗ 消息内容  ✗ 生命故事内容      │
│   ✗ 任何未向参与者披露的推断属性                               │
│   ⓘ 这些不是「暂未支持」，是被禁止的。                         │
│ 匹配解释规则*     [必须用参与者能读懂的话说明为什么被推荐 ▾]   │
│ 候选上限 [3/周]   候选有效期 [14 天]                           │
│ 匹配决定取值      感兴趣 / 暂时不 / 忽略（可撤回：是）         │
│   ⓘ 「暂时不」与「感兴趣」在参与者界面里等重，不得诱导。      │
│ 公平性复核        [每 30 天 ▾]   上次复核：未进行              │
│ 屏蔽处理          屏蔽后互不出现，且不透露屏蔽的存在           │
│ 互相接受来源      仅参与者本人的双向明示                       │
│ 互相接受有效期    [30 天]  失效条件：撤回同意 / 屏蔽 / 过期    │
│ 连接激活          单次使用；一次互相接受只能激活一个连接       │
│ 沟通依据          [平台内消息 ▾]                               │
│ 连接请求功能      [停用]（本阶段）                             │
│ 分阶段启用        [阶段 1：仅生成候选，不启用消息 ▾]           │
├───────────────────────────────────────────────────────────────┤
│ 制度性禁止（本界面永不提供）                                   │
│  ✗ 自动产生互相接受   ✗ 自动建立连接   ✗ 自动发送消息         │
│                                        [保存草稿] [提交批准]  │
└───────────────────────────────────────────────────────────────┘
```

**③ 状态矩阵**

| 态 | 呈现 |
|---|---|
| 加载 | 禁止项区块**先渲染**（静态，不依赖网络）——保证任何加载状态下"禁止"都可见 |
| 空队列 | 无历史策略：`还没有匹配策略。在策略批准之前，匹配不会产生任何候选。` |
| 错误 | 保存失败：常规可恢复错误；**禁止项不受任何错误态影响** |
| 权限不足 | 只读 + `你可以查看匹配策略，但不能修改（需要 Researcher）。` |
| 需要 MFA | 提交不需要；批准走协议/审批链（MFA）。屏顶：`本屏没有需要强认证的动作；策略的批准在协议审批中完成（需要 MFA）。` |

**④ 确认文案**：`确认提交匹配策略？策略只有在被批准后才生效。当前阶段设定为「阶段 1：仅生成候选，不启用消息」——参与者不会因此收到任何消息。`

**⑤ 无障碍**：禁止属性列表用 `<ul>` + 文字 `禁止`（`✗` 加 `aria-hidden`）；"制度性禁止"区块 `role="note"`；每个禁止项都是完整句子，屏幕阅读器逐条可读。

---

### C11 合成人物画像与情景设置（§72）

**① 目标与密度**：创建合成人物与情景，并**在每一步都提醒这不是真人**。密度：dense 表格（画像列表）+ 标准表单（情景）。

**② 线框**

```text
合成人物画像
┌───────────────────────────────────────────────────────────────────────┐
│ ⓘ 这里的每一个「参与者」都是合成人物。他们不是真人，不能被联系，      │
│   他们产生的任何数据都不是经验证据。                                  │
├───────────────────────────────────────────────────────────────────────┤
│ 研究代码 │ 情景族      │ 能力设定      │ 生成种子 │ 状态   │ 操作     │
│ SP-001   │ 孤独感-高   │ 屏幕阅读器    │ seed:42  │ 已激活 │ [查看]   │
│ SP-002   │ 生命故事-低 │ 大字号+简化   │ seed:43  │ 草稿   │ [查看]   │
│ ⓘ 生成种子与情景定义是可复现性的一部分（Doc 19 §39），不可事后修改。 │
├───────────────────────────────────────────────────────────────────────┤
│ 情景族  孤独感-高                                                     │
│  描述* [__________]  邀请→筛查→资格→同意→入组→路径→激活（模拟）      │
│  ⓘ 资格决定必须由人做出。AI 可以整理材料，不能做资格决定。           │
│                                            [创建画像] [批量生成…]     │
└───────────────────────────────────────────────────────────────────────┘
```

**③ 状态矩阵**

| 态 | 呈现 |
|---|---|
| 加载 | 表格骨架 |
| 空队列 | `还没有合成人物画像。合成画像用于原型验证，不能替代真实参与者研究。[创建第一个画像]` |
| 错误 | 批量生成部分失败 → `PARTIAL_RESULT`：`生成了 8 个，3 个失败。失败的原因逐条列在下面——没有被静默跳过。` |
| 权限不足 | `你的角色不能创建合成画像（需要 Researcher）。` |
| 需要 MFA | 无 MFA 动作 |

**④ 确认文案**：`确认批量生成 20 个合成画像（情景族「孤独感-高」，种子 42–61）？这些是合成人物，不是真人。生成后种子与情景定义不可更改。`

**⑤ 无障碍**：表格按 1.9；"合成"提示位于 `<main>` 起始处并被 `<h1>` 之后的第一个 `role="note"` 承载，屏幕阅读器最先读到。

---

### C12 参与者列表与详情（研究者视角，§73–74）— 已有局部实现（入组队列）

**① 目标与密度**：以**假名研究代码**为主键的高密度列表 + 权限分区详情。**排除私人社交内容与举报人身份**（§73 硬要求）。密度：dense 表格。

**② 线框**

```text
参与者（研究者视角）              项目 [RP-001 ▾]  [列选择] [保存视图]
┌────────┬────────┬────────┬──────┬──────┬────────┬──────┬──────────┐
│研究代码│入组状态│同意状态│路径  │暴露  │到期评估│安全  │最近活动  │
├────────┼────────┼────────┼──────┼──────┼────────┼──────┼──────────┤
│SP-001  │已激活  │有效    │标准  │已完成│1 项到期│—     │2 天前    │
│SP-002  │待激活  │部分撤回│标准  │已提供│逾期 1  │⚠开放 │6 小时前  │
│SP-003  │已退出  │已撤回  │—    │—    │—      │—     │11 天前   │
└────────┴────────┴────────┴──────┴──────┴────────┴──────┴──────────┘
ⓘ 这里不显示私人消息、生命故事内容与举报人身份。

参与者 SP-002（假名）
┌ 概览 │ 同意 │ 入组 │ 干预 │ 评估 │ 观察 │ 安全 │ 数据质量 │ 审计 ┐
│ 生命故事 · 消息 · 匹配详情 · 审核证据：未授权（不显示）           │
├───────────────────────────────────────────────────────────────────┤
│ 同意（模型）                                                      │
│  study-participation  有效   2026-07-02 授予                      │
│  community-participation  已撤回  2026-07-30 撤回                 │
│  ⓘ 撤回会影响可用于分析的数据范围；已锁定数据集不会被改写。      │
│ 你的访问目的* [research-operations ▾]  ⓘ 目的会被记录进审计。    │
└───────────────────────────────────────────────────────────────────┘
```

**③ 状态矩阵**

| 态 | 呈现 |
|---|---|
| 加载 | 表格骨架保留列宽 |
| 空队列 | 无筛选结果：`当前筛选下没有参与者。[清除筛选]`；项目确无参与者：`这个项目还没有参与者。参与者从入组流程进入。[去入组协调]` |
| 错误 | `PURPOSE_NOT_PERMITTED`：`你选择的访问目的不允许查看这项数据。请选择正确的目的，或说明为什么需要。` |
| 权限不足 | 未授权的 Tab **仍然可见但禁用**并注明 `未授权（不显示内容）`——存在性本身不敏感；**受保护存在的对象**（如已屏蔽关系）走 `RESOURCE_NOT_FOUND` 统一文案，不透露存在 |
| 需要 MFA | 无 MFA 动作（查看不需要 MFA；导出走 C17） |

**④ 确认文案**：切换访问目的：`把访问目的改为「安全审阅」？这次访问会以这个目的写入审计。只有确实用于安全审阅时才选它。`

**⑤ 无障碍**：研究代码列是 `<th scope="row">`；安全列的 `⚠开放` 写作 `有开放的安全信号`；Tab 组用 `role="tablist"` + `aria-selected` + `aria-controls`，禁用 Tab 用 `aria-disabled="true"` 并保留在 Tab 序中（这样屏幕阅读器用户知道有这些分区且知道自己没权限）。

---

### C13 干预与评估监测（§75–77）

**① 目标与密度**：区分十种干预交付状态与八种评估状态，**完成永不从"已指派"推断**（§75 硬要求）。密度：dense 矩阵表 + 图表（图表须带 §253 全部元数据）。

**② 线框**

```text
监测 › 干预交付                                     周期 [近 4 周 ▾]
┌──────────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┐
│ 活动     │指派│提供│查看│开始│部分│完成│跳过│拒绝│失败│中断│
├──────────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┤
│ 生命故事 │ 24 │ 22 │ 18 │ 14 │  3 │  9 │  4 │  2 │  1 │  1 │
│ 社区活动 │ 24 │ 20 │ 15 │ 11 │  2 │  8 │  3 │  1 │  1 │  0 │
└──────────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┘
ⓘ 「完成」只来自明确的完成事件，不由「已指派」推断。
ⓘ [合成数据] 这是运行监测，不是研究结果。不得作为效果证据。

监测 › 评估
┌──────────┬──────┬────┬────┬────┬────┬────┬──────┬────┐
│ 评估     │已排期│到期│开始│暂停│完成│拒绝│已作废│逾期│
│ 基线     │ 24   │ 0  │ 24 │ 0  │ 22 │ 1  │ 1    │ 0  │
│ 随访 4 周│ 24   │ 5  │ 12 │ 2  │ 10 │ 0  │ 0    │ 2  │
└──────────┴──────┴────┴────┴────┴────┴────┴──────┴────┘
缺失原因（在权限允许时显示）：拒绝 1 · 技术失败 1 · 未知 3
ⓘ 「未知」就是未知，不填补、不推断。

安全（最小必要）
 开放安全信号 2 · 当前暂停 1 · 需要跟进 1 · 对本项目的影响：入组暂停
 ⓘ 详细的安全审阅在安全工作区进行，不在这里。
```

**③ 状态矩阵**

| 态 | 呈现 |
|---|---|
| 加载 | 矩阵表骨架，列头先渲染（状态名是固定词表） |
| 空队列 | `所选周期内没有交付记录。` + `这不代表没有发生——请确认周期与筛选。` |
| 错误 | 部分聚合失败：`有 1 项指标没能计算（<码>）。表里那一格显示「未计算」，不显示 0。` ——**绝不用 0 代替失败** |
| 权限不足 | 缺失原因列对无权限角色显示 `缺失原因对你的角色不可见。`；安全区仅显示计数 |
| 需要 MFA | 无 MFA 动作 |

**④ 关键交互**：无高影响动作（只读监测）。可下钻到 C12 参与者详情；下钻链接可访问名含研究代码。

**⑤ 无障碍**：矩阵表每列表头 `<th scope="col">` 用完整状态名（不缩写）；数字单元格 `aria-label` 形如 `生命故事，完成，9 人`；图表（若使用）必须提供 `<table>` 数据替代（§253），并带标题/单位/分母/时间范围/来源/不确定性；`未计算` 是文字，不是空格。

---

### C14 数据集定义 → 变量 → 生成 → 质量复核 → 锁定（§78–83）— 已有局部实现（可锁定队列 + 锁定）

**① 目标与密度**：五段式流水线；**锁定是本工作区最强的人工权威动作之一（人工 + MFA + 不可逆）**。密度：dense（变量表、质量问题表）+ 标准（锁定确认）。

**实施状态（2026-08-04）：整条链已可达。** 此前**只有最后一步（锁定）有界面**——写定义、批准定义、生成版本、完成质量复核这四步没有任何界面能执行，于是可锁定队列**永远不可能通过产品被填满**：一个队列填不满的决策屏，等于从没被人用过。现在研究者一侧有「数据集」区块（写定义 / 生成版本 / 记录质量复核完成，`listDatasetWork` 以 `dataset.define` 为门——能干这活就能看到活干到哪了），批准人一侧新增「数据集定义」决策屏（`listDefinitionsAwaitingApproval`）。措辞守三条：变量字典即「装什么进去」，**消息正文默认排除、未列出的就不包含**（ADR-034），批准确认把这句话放在控件旁；**起草人不能批准自己写的定义**（命令与数据库 CHECK 双重强制），行内在按钮之前就说明，不是提交后才报错；「记录质量复核完成」是**人对自己行为的记录**，不叫「批准」，并明说它不是锁定。**批准定义不是 MFA 级**（`dataset.approve-definition` 只要求确认，锁定才要求 MFA）——屏上不谎称需要强认证，夸大一个动作的代价是另一种不诚实，且会教人忽略那些真实的提示。

**② 线框（锁定确认屏为重点）**

```text
数据集 › DD-003 › 变量构建
┌────────────┬──────────┬──────────┬────┬────────┬──────┬──────┬────────┐
│ 变量名     │ 来源     │ 来源版本 │类型│ 派生   │缺失  │敏感度│ 同意   │
├────────────┼──────────┼──────────┼────┼────────┼──────┼──────┼────────┤
│ ucla_total │ 评估M08  │ v2       │数值│ 求和   │按题  │中    │ 研究参与│
│ msg_count  │ 消息M07  │ v3       │计数│ 元数据 │无    │高    │ 消息    │
│ ⚠ 私人内容默认排除：消息正文、生命故事正文不在可选来源里。            │
│ 纳入理由*（每个变量必填）                                             │
└───────────────────────────────────────────────────────────────────────┘

数据集 › dv_9 › 锁定确认
┌───────────────────────────────────────────────────────────────────────┐
│ ⓘ 本屏的强认证动作：锁定数据集版本（需要 MFA）。你当前是 MFA 级认证。 │
├─ 你正在锁定的对象 ────────────────────────────────────────────────────┤
│ DatasetVersion  dv_9   版本号 v1   定义 DD-003（已批准 v2）           │
│ 清单哈希 sha256:aa71c3e0d9f4b21… [全文][复制]                          │
├─ 复核清单（全部必须显式确认）─────────────────────────────────────────┤
│ ☑ 血缘完整：来源 3 个，版本均已固定           [查看血缘]              │
│ ☑ 撤回与同意处理：2 名参与者撤回，其数据已按规则排除                  │
│ ☑ 质量与去标识：假名化；未解决问题 0 个（阻断级 0）                   │
│ ☑ 消息与社交变量边界：仅元数据，无正文        [查看边界]              │
│ ☑ 清单与校验和已复核                                                  │
│ ☑ 兼容的分析计划：AP-002（已批准）                                    │
│ 数据截止  2026-08-01 23:59 CST                                        │
│ 行数/实体数  行 1,248 · 实体 24（在可安全显示的范围内）               │
│ 限制  仅用于 RP-001；不得再分发                                       │
├───────────────────────────────────────────────────────────────────────┤
│ 锁定后这个版本不可更改，分析只能针对锁定版本运行。锁定不可撤销。      │
│                                        [锁定这个数据集版本（需要 MFA）]│
├─ 锁定进度（提交后）───────────────────────────────────────────────────┤
│ ① 已查看确认  ② 已提交确认  ③ 锁定命令处理中…  ④ 已锁定 / 命令失败    │
│ ⓘ 在拥有该领域的模块确认之前，这里不会显示「已锁定」。               │
└───────────────────────────────────────────────────────────────────────┘
```

**③ 状态矩阵**

| 态 | 呈现 |
|---|---|
| 加载 | 复核清单项逐项加载，**未加载完成的项不显示为已勾选**；锁定按钮在所有项到齐前禁用 |
| 空队列 | 可锁定队列空：`现在没有可以锁定的数据集版本。数据集版本需要先完成质量复核。` |
| 错误 | `DATASET_LOCK_NOT_READY`：列出未满足项并可跳转；`LINEAGE_INCOMPLETE`：`血缘信息不完整，不能锁定。缺失：来源「评估 M08」的版本未固定。`；**命令失败**显示为进度③→"命令失败"，**绝不显示「已锁定」** |
| 权限不足 | 无 `dataset.lock`：显示完整只读复核清单 + `你可以查看复核清单，但不能锁定（需要 ResearchApprover）。` |
| 需要 MFA | 密码级：锁定按钮禁用 + `锁定数据集版本需要强认证（MFA）。你当前是密码级认证，请以 MFA 重新登录后再来。` |

**④ 确认文案（原文）**

```
确认锁定 DatasetVersion dv_9（版本 v1）？
清单哈希：sha256:aa71c3e0d9f4b218c7e5309fbb4d1a62（完整值）
数据截止：2026-08-01 23:59 CST；行 1,248；实体 24。
锁定后这个版本不可更改，也不能删除。此后的分析只能针对这个锁定版本运行。
参与者之后撤回同意，不会改写这个已锁定的数据集——撤回会体现在后续版本里。
这次锁定会以 approver_wu 的身份署名并写入审计。
这个操作需要强认证（MFA）。锁定不可撤销。
```
按钮：`锁定这个数据集版本` / `返回复核`

**⑤ 无障碍**：复核清单是 `<ul>`，每项 `✔/✘` 配文字（`已满足`/`未满足`）；进度四段用 `<ol>` + `aria-current="step"`，状态变化经 `role="status"` 播报（`锁定命令已提交，正在处理。` → `已锁定。`）；确认对话框内哈希完整、可换行；变量表按 1.9。

---

### C15 分析计划 / 运行 / 解释记录（§84–87）

**实施状态（2026-08-04）：部分实现。** 写计划 → 他人批准 → 记录运行 → 写解释 → 他人批准这条链已可达；此前**每一步都有命令、没有一步有界面**，各环节又只以标识互相引用，因此这条链连「看」都看不了，更谈不上走。两条措辞：（1）**「记录运行」不是「执行分析」**——平台没有计算引擎，存下来的是人对「针对这一版数据跑了分析、产出是什么」的记录；把按钮写成「运行分析」等于声称平台做了这件事。（2）**只能针对已锁定的数据集版本**（服务器返回 `DATASET_LOCK_NOT_READY`），因此选择器只列已锁定的并说明原因，而不是让人选完再被拒绝；每次运行显示所针对版本的 manifest 哈希——这正是先锁定再分析的意义：解释只针对一次运行，运行只针对那一份数据。

**① 目标与密度**：把"计划 → 运行 → 输出 → 解释"分成四个不可混淆的层。密度：dense（运行列表）+ 标准（解释编辑）。**这里是认识论阶梯的执行处（见 1.3）**。

**② 线框**

```text
分析 › 运行 ar_12
┌───────────────────────────────────────────────────────────────────────┐
│ 分析计划 AP-002（已批准 v1）  锁定数据集 dv_9 sha256:aa71…            │
│ 代码版本 git:9f2c1ab  环境 env:py3.11-2026-07  参数 seed=42, alpha=.05│
│ 状态 已完成（有警告）  开始 11:02  结束 11:04                         │
│ 警告 2：① 子组 n=3 过小 ② 缺失率 12% 超过计划阈值 10%                │
├─ 分析输出（机器计算结果，未经解释）───────────────────────────────────┤
│ ```                                                                   │
│ ucla_total  baseline mean 44.2 (sd 8.1)  n=22                         │
│ ucla_total  wk4      mean 41.8 (sd 8.6)  n=20                         │
│ diff -2.4  95% CI [-6.1, 1.3]                                         │
│ ```                                                                   │
│ ◌ 模拟观察 · [合成数据] 来自合成数据的计算结果，不是经验证据。        │
├─ 解释记录（人写的，不是数据本身）─────────────────────────────────────┤
│ ▌ researcher_lin 的解释（草稿）                                       │
│ ▌ 关联研究问题 RQ-001 · 选用输出：上方两行                            │
│ ▌ 解释* [_____________________________________________]               │
│ ▌ 替代解释*（至少一条）[__________________________]                   │
│ ▌ 缺失情况* [12% 缺失，原因未知的 3 例未填补]                          │
│ ▌ 路径差异 / 无障碍 / 公平性 / 审核 / 安全 / AI：[逐项 __________]     │
│ ▌ 局限* [__________]  不确定性* [__________]                          │
│ ▌ 认识论标签* [◌ 模拟观察 ▾]                                          │
│ ▌ ⓘ 合成数据的结果永远不能写成「干预有效」。                          │
│                              [保存草稿] [提交人工复核]                │
└───────────────────────────────────────────────────────────────────────┘
```

**③ 状态矩阵**

| 态 | 呈现 |
|---|---|
| 加载 | 运行状态轮询：`排队中 → 运行中 → …`，`role="status"` 每次状态变化播报一次；输出区骨架 |
| 空队列 | 无已批准计划：`还没有已批准的分析计划。分析只能针对已批准的计划和已锁定的数据集运行。`；无运行：`还没有分析运行。` |
| 错误 | `失败`：显示失败诊断与日志入口，`这次运行失败了，没有产生输出。失败本身会被记录，不会被隐藏。`；`已取消`/`已被取代`各有独立文案（不合并成"失败"） |
| 权限不足 | 无 `analysis.run`：只读；无 `interpretation.approve`：解释可写不可批准，按钮注明 `批准解释需要 ResearchApprover。` |
| 需要 MFA | 分析运行、解释批准**都不需要** MFA（`interpretation.approve` 仅需确认）。屏顶：`本屏没有需要强认证的动作。`（**不得**错标） |

**④ 确认文案**

- 运行：`确认运行分析计划 AP-002？将针对锁定数据集 dv_9（sha256:aa71…）运行，代码版本 git:9f2c1ab，参数 seed=42。运行记录不可删除。`
- 提交解释复核：`确认提交这份解释记录？它会被标注为「模拟观察」并且始终带 [合成数据] 标记。提交后记录你是撰写人。`
- 批准解释：`确认批准这份解释记录？批准的是解释本身，不是它所依据的数据结论。`

**⑤ 无障碍**：输出区用 `<pre><code>` 且容器 `tabindex="0" role="region" aria-label="分析输出"`（可键盘滚动）；解释区用 `<blockquote>` + `<cite>`；三层（输出/解释/发现）各有独立 `<h3>`，标题文本本身说明层级差别（`分析输出（机器计算结果）`）。

---

### C16 研究发现与干预决定（§88–90）

**实施状态（2026-08-04）：部分实现。** 研究发现可从**已批准的解释**中写出并由他人批准；批准屏把发现所依托的解释与运行标识列在控件旁，起草人不能批准自己写的发现（命令 + 数据库 CHECK），行内在按钮之前说明。**强认证提示只出现在发现一节**：三个批准里只有 `finding.approve` 是 MFA 级，在计划与解释上重复这条提示会夸大那两者的代价，并教人略过唯一真实的那条。**运行不进审批队列**：没有人「批准」一次运行，它要么发生过要么没有，把它放进决策队列会暗示一种没人在要求的判断。**未实现**：干预决定（§90 的 InterventionDecision）。

**① 目标与密度**：产出 `ResearchFinding`（带**理论发现类型** + **审批状态**两个独立维度）与 `InterventionDecision`（八选一）。密度：标准。**AI 草稿永远是草稿**。

**② 线框**

```text
发现 › RF-006
┌───────────────────────────────────────────────────────────────────────┐
│ 研究问题 RQ-001（确切版本 v2）                                         │
├─ 精确版本链（缺一不可提交）───────────────────────────────────────────┤
│ 协议版本 PR-002 v3 sha256:9b1c… │ 干预版本 IV-004 v3 sha256:31d0…     │
│ AI 配置 aicfg_v0 sha256:c440…   │ 数据集锁定 dv_9 sha256:aa71…        │
│ 分析运行 ar_12 git:9f2c1ab      │ 解释记录 IR-008（已批准）            │
├─ 发现 ────────────────────────────────────────────────────────────────┤
│ 发现类型*（理论）  [欠决定 underdetermined ▾]                          │
│ 审批状态（独立维度） 评审中                                            │
│ ⓘ 这两个是不同的东西：一个说「这个结论在理论上处于什么状态」，        │
│   另一个说「谁批准了记录这个结论」。                                   │
│ 断言* [在合成情景下，数字化怀旧干预与孤独感量表变化的关系不能被确定。] │
│ 不确定性* [样本为合成；区间跨越无效应值。]                             │
│ 局限* [语料规模有限；子组 n=3；缺失率 12%。]                           │
│ 认识论标签* [◌ 模拟观察]  [合成数据]                                   │
│ ┌ 🤖 AI 草稿（未采纳，永远是草稿）──────────────────────────────┐     │
│ │ 「结果提示干预可能有益…」  ⚠ 这句写法违反纪律：合成数据不能   │     │
│ │   写成有益。 [修改后采纳] [丢弃]                               │     │
│ └────────────────────────────────────────────────────────────────┘     │
│                                    [保存草稿] [提交批准（需要 MFA）]  │
└───────────────────────────────────────────────────────────────────────┘

干预决定 › 基于 RF-006
 ( ) 保留 Retain   ( ) 修订 Revise   ( ) 限制 Restrict   ( ) 复制 Replicate
 ( ) 扩大 Expand   ( ) 暂停 Suspend  ( ) 退役 Retire     (•) 继续探索性研究
 依据（自动带入并显示精确版本）：证据 ES-011 / 协议 PR-002 v3 /
 干预 IV-004 v3 / 数据集 dv_9 / 分析 ar_12 / 发现 RF-006
 ⓘ 当前阶段所有数据为合成，因此「扩大」「保留」这类决定需要额外说明理由。
```

**③ 状态矩阵**

| 态 | 呈现 |
|---|---|
| 加载 | 版本链区块骨架；版本链未到齐前提交按钮禁用（`版本链还没加载完，暂时不能提交。`） |
| 空队列 | 无已批准解释：`还没有已批准的解释记录。发现必须基于已批准的解释。` |
| 错误 | 版本链缺项 → `LINEAGE_INCOMPLETE`：逐项列出缺什么；`AUTHORISATION_DENIED`（自批准）由队列层前置拦截 |
| 权限不足 | `finding.draft` = Researcher；`finding.approve` = ResearchApprover。研究者看到批准按钮为禁用 + `批准由 ResearchApprover 以强认证（MFA）完成；你不能批准自己起草的发现。` |
| 需要 MFA | 起草不需要；**批准需要 MFA**。屏顶：`本屏的强认证动作：批准研究发现（需要 MFA）。` |

**④ 确认文案（批准，原文）**

```
确认批准研究发现 RF-006？
发现类型（理论）：欠决定（underdetermined）
断言：在合成情景下，数字化怀旧干预与孤独感量表变化的关系不能被确定。
依据的精确版本：协议 PR-002 v3（sha256:9b1c…）、干预 IV-004 v3、AI 配置 aicfg_v0、
数据集锁定 dv_9（sha256:aa71…）、分析运行 ar_12（git:9f2c1ab）、解释 IR-008。
这份发现来自合成数据，会始终带 [合成数据] 标记，不能作为经验证据引用。
这次批准会以 approver_wu 的身份署名并写入审计。
这个操作需要强认证（MFA）。
```
按钮：`确认批准这份发现` / `返回复核`

**⑤ 无障碍**：发现类型与审批状态是两个独立 `<dl>` 项，标签文字明确区分；AI 草稿区 `role="region" aria-label="AI 草稿，未采纳"`，纪律违规提示用 `role="alert"`（因为它是即时校验结果）；八项干预决定是无预选 radio 组，中英文同 label。

---

### C17 报告与受控导出（§91）— 已有局部实现（导出审批队列）

**① 目标与密度**：报告版本 + 受控导出全链：申请 → 批准（MFA）→ 生成 → 投递 → 回执 → 过期。**"已生成"不是"已投递"**（§91 硬要求）。密度：标准 + dense 队列表。

**实施状态（2026-08-04）**：**报告一侧**（开报告 / 写版本 / 他人批准）已实现——此前本节名字里的「报告」没有任何界面，只有导出半边有屏，报告版本审批队列因此永远没有东西可批。批准即固定该版本：数据库触发器拒绝改动已批准版本的内容，更正只能是新版本；起草人不能批准自己写的版本（命令 + 数据库 CHECK），行内在按钮之前说明；`report.approve` 只要求确认，**不是 MFA 级**，屏上不谎称需要强认证。导出一侧：申请、批准（MFA + 职责分离）、**生成、投递记录、签收记录**已实现（研究者工作区内「等待执行的导出」区块，`listExportsToCarryOut` 以 `export.generate` 为门——能干这活就能看到活）。此前**批准就是终点**：没有任何查询列出已批准的请求，包永远不会被生成，投递也永远不会被记录；一个索取自己信息副本的人会被如实告知「已同意」，然后再也没有下文——不是因为谁拒绝了，而是因为任何界面都无法走下一步。三态措辞守住 §91：`Approved` 写「还没有生成包」，`Generated` 写「包已存在，尚未交付任何人」，`Delivered` 写「已记录为交付，接收方尚未确认」。**「记录我已交付」是人对自己行为的记录，不是平台的动作**——平台不发送任何东西，按钮因此不叫「投递」。已签收（`Received`）离开队列：把已完成的工作留在待办列表里，是让待办列表不再被人看的做法。**过期未实现**（没有任何命令或字段承载导出的过期）。

**② 线框**

```text
导出 › 新建申请
┌───────────────────────────────────────────────────────────────┐
│ 报告类型* [统计复核用数据集 ▾]   受众* [外部统计伙伴 ▾]        │
│ 目的*     [_____________________________________]              │
│ 接收方*   [_____________________________________]              │
│ 精确来源* [dv_9（已锁定，sha256:aa71…）] [+ 添加来源]          │
│ 去标识*   ( ) 假名化   ( ) 匿名化                              │
│ ⓘ 研究导出没有「可识别」选项——平台不会生成可识别的研究导出。 │
│ 限制      [仅用于约定目的；不得再分发]  有效期 [30 天]         │
│ ⓘ 导出内容会携带 [合成数据] 标记；接收方看到的是合成数据。    │
│                                            [提交导出申请]     │
└───────────────────────────────────────────────────────────────┘

导出 › ex_5 › 状态（诚实的状态机）
 ① 已申请 → ② 已批准（approver_wu，MFA，08-03 12:10）
 → ③ 已生成（12:12，清单 sha256:5e90…） → ④ 已投递给供应商（12:13）
 → ⑤ 回执：未确认
 ⓘ 「已生成」不等于「已投递」；「已投递给供应商」不等于「接收方已收到」。
```

**③ 状态矩阵**

| 态 | 呈现 |
|---|---|
| 加载 | 队列骨架；来源下拉在锁定版本清单到齐前禁用 |
| 空队列 | 待批准导出为空：`现在没有待决定的导出申请。`；无可选来源：`没有可导出的来源。导出只能引用已锁定的数据集版本或已批准的报告版本。` |
| 错误 | `EXPORT_REQUIRES_APPROVAL`：`导出必须先获得批准。[提交批准申请]`；`DEIDENTIFICATION_REQUIRED`：指出哪个来源不满足；投递失败：`投递失败——接收方没有收到。这不是「可能收到了」。[查看失败原因]` |
| 权限不足 | 申请需 `export.request`（Researcher）；批准需 `export.approve`（ResearchApprover）。研究者在队列里看到自己的申请，决定按钮禁用 + `这是你申请的，你不能批准它。` |
| 需要 MFA | 申请不需要；**批准需要 MFA**。屏顶：`本屏的强认证动作：导出批准（需要 MFA）。` |

**④ 确认文案（批准，原文）**

```
确认批准导出申请 ex_5？
接收方：stats-partner（外部）
目的：外部统计复核
来源：dv_9（已锁定，sha256:aa71c3e0d9f4b218…）
去标识：假名化
有效期：30 天；限制：仅用于约定目的，不得再分发
批准之后数据会离开平台边界。这次批准会以你的身份署名并写入审计。
导出内容标记为 [合成数据]。
这个操作需要强认证（MFA）。
```
按钮：`确认批准这次导出` / `拒绝` 走独立对话框（一次只确认一件事） / `返回`

**⑤ 无障碍**：状态机是 `<ol>` + 每步 `已完成 / 进行中 / 未开始` 文字；`回执：未确认` 必须是文字（不用灰点）；去标识 radio 无预选；批准与拒绝是两个独立按钮，各自的确认对话框只确认一件事。

---

## 3. G. 管理工作区（G1–G7）

> **全局边界（每屏顶部固定 `role="note"`，不可关闭）**：
> `管理工作区只管运行与访问：账号、角色、集成、作业、旗标、审计。它不授予研究、审核或安全权威——研究结论、审核决定、安全处置都不在这里做，也不在这里显示。`

### G1 管理仪表盘与系统状态（§41）

**① 目标与密度**：运行健康度总览。**研究发现与审核决定不是管理 KPI**（§41 硬要求）——因此仪表盘上**不得出现**"发现数""审核处理量""参与者数"。密度：dense 卡片网格。

**② 线框**

```text
管理工作区 › 仪表盘
┌───────────────────────────────────────────────────────────────────────┐
│ ⓘ 管理工作区只管运行与访问…（边界横幅，见上）                        │
├───────────────────────────────────────────────────────────────────────┤
│ ┌ 服务健康 ────────────┐ ┌ 作业与死信 ───────┐ ┌ 集成 ────────────┐ │
│ │ API 正常  worker 正常│ │ 失败作业 3        │ │ 知识库 MCP 正常  │ │
│ │ 调度器 正常          │ │ 死信 1（最早 2h） │ │ 邮件供应商 模拟  │ │
│ │ 数据库 正常          │ │ [打开作业队列]    │ │ 对象存储 正常    │ │
│ └──────────────────────┘ └───────────────────┘ └──────────────────┘ │
│ ┌ 安全告警 ────────────┐ ┌ 备份 ─────────────┐ ┌ 删除传播 ────────┐ │
│ │ 破窗访问 0 次（24h） │ │ 上次成功 06:00    │ │ 待传播 1（撤回）  │ │
│ │ 认证失败率 正常      │ │ 恢复演练 未进行 ⚠│ │ 超时未完成 0      │ │
│ └──────────────────────┘ └───────────────────┘ └──────────────────┘ │
│ ┌ 功能旗标 ────────────┐ ┌ 支持问题 ─────────┐                       │
│ │ 已开启 4 / 共 11     │ │ 待处理 2          │                       │
│ │ 与安全相关的旗标 0   │ │                   │                       │
│ └──────────────────────┘ └───────────────────┘                       │
│ ⓘ 这里不显示研究发现、审核决定或参与者内容。                          │
└───────────────────────────────────────────────────────────────────────┘
```

**③ 状态矩阵**

| 态 | 呈现 |
|---|---|
| 加载 | 逐卡片骨架 |
| 空队列 | `没有失败作业。` `没有待处理的支持问题。` |
| 错误 | **健康度探测失败必须显式**：`这一项的健康状态无法确定（<码>）。不要当作「正常」。[重试]` |
| 权限不足 | 非 SystemAdministrator/OrganisationAdministrator：整屏替换为 `你的角色不能访问管理工作区。` |
| 需要 MFA | 仪表盘只读，无 MFA 动作；跳转到 G3/G4/G6/G7 的链接文字带 `（其中的变更需要强认证）` |

**④ 关键交互**：无高影响动作。**禁止**在仪表盘上放"重跑全部失败作业"这类批量按钮（一次一个有意义的决定）。

**⑤ 无障碍**：每卡片 `<section aria-labelledby>`；健康状态用文字（`正常`/`无法确定`/`异常`）+ 图标，不用纯色点；`role="status"` 在刷新后播报一次汇总。

---

### G2 用户与组织（§21）

**① 目标与密度**：账号与组织的运行性管理。**不得显示参与者的研究内容**。密度：dense 表格。

**② 线框**

```text
管理 › 用户                          组织 [全部 ▾] [列选择] [保存视图]
┌──────────────┬──────────┬──────────┬────────┬────────┬─────────────┐
│ 账号标识     │ 显示名   │ 组织     │ 角色数 │ 状态   │ 操作        │
├──────────────┼──────────┼──────────┼────────┼────────┼─────────────┤
│ researcher_lin│ 林研究员 │ ORG-01   │ 1      │ 启用   │ [查看 lin]  │
│ approver_wu   │ 吴批准人 │ ORG-01   │ 1      │ 启用   │ [查看 wu]   │
│ SP-002        │ （参与者）│ ORG-01  │ 1      │ 启用   │ [查看 SP-002]│
└──────────────┴──────────┴──────────┴────────┴────────┴─────────────┘
ⓘ 参与者账号在这里只显示账号事实（启用/停用、角色、组织）。
  同意、生命故事、消息、匹配、举报内容在管理工作区一律不可见。
```

**③ 状态矩阵**

| 态 | 呈现 |
|---|---|
| 加载 | 表格骨架 |
| 空队列 | `这个组织还没有用户。[邀请用户]` |
| 错误 | 常规；`RESOURCE_NOT_FOUND` 统一受保护存在文案 |
| 权限不足 | 无 `user.view`：`你的角色不能查看用户列表。` |
| 需要 MFA | 查看与邀请不需要 MFA；**角色变更在 G3**（仅需确认，不需 MFA——不得错标）。屏顶：`本屏没有需要强认证的动作。` |

**④ 确认文案**：邀请用户：`确认向 <邮箱> 发出邀请？邀请会创建一个待激活账号，不会授予任何角色。角色需要单独指派。`（**默认无角色**——最小权限）

**⑤ 无障碍**：账号标识列 `<th scope="row">`；操作按钮名含标识（`查看 researcher_lin`）；参与者行的"内容不可见"说明在表格 `<caption>` 内，不只在页脚。

---

### G3 角色与服务账号（§21）

**① 目标与密度**：角色指派/撤销与服务账号管理。**这是权限的入口，必须最保守**。密度：标准（这是决定屏）。

**② 线框**

```text
管理 › 用户 researcher_lin › 角色
┌───────────────────────────────────────────────────────────────┐
│ 当前角色  Researcher（自 2026-07-01，指派人 org_admin_chen）   │
├─ 指派新角色 ──────────────────────────────────────────────────┤
│ 角色* [ResearchApprover ▾]                                     │
│ ⓘ 这个角色能做什么（在指派之前就告诉你）：                     │
│   • 批准协议版本、项目、干预版本（需要强认证 MFA）             │
│   • 批准分析计划、解释、研究发现（发现批准需要 MFA）           │
│   • 锁定数据集版本（需要 MFA，不可逆）                         │
│   • 批准导出（需要 MFA，数据会离开平台边界）                   │
│ ⚠ 职责分离提醒：researcher_lin 当前是 Researcher，会起草与提交│
│   协议。同时拥有 ResearchApprover 不会让他能批准自己提交的     │
│   内容（系统会拒绝），但会让他能批准同事提交的内容。           │
│ 理由* [_____________________________]                          │
│                                             [指派这个角色]    │
├─ 服务账号 ────────────────────────────────────────────────────┤
│ svc_kg_reader  权限：evidence.search  上次使用 11:02  [查看]   │
│ ⓘ 服务账号不能拥有批准类权限。                                │
└───────────────────────────────────────────────────────────────┘
```

**③ 状态矩阵**

| 态 | 呈现 |
|---|---|
| 加载 | 角色能力清单是静态词表，**先渲染**（保证"先解释再询问"在任何加载态成立） |
| 空队列 | `这个账号还没有任何角色。没有角色的账号不能执行任何操作。` |
| 错误 | 撤销最后一个管理员 → `INVALID_STATE_TRANSITION`：`不能撤销最后一个组织管理员的角色。请先指派另一位。` |
| 权限不足 | 无 `role.assign`：只读 + `你的角色不能指派角色（需要 OrganisationAdministrator 或 SystemAdministrator）。` |
| 需要 MFA | `role.assign`/`role.revoke` **只需确认，不需要 MFA**；`system.configure`（服务账号密钥轮换等）**需要 MFA**。屏顶按实际动作分别标注，不得笼统写"本屏需要 MFA"。 |

**④ 确认文案**

- 指派：`确认把 ResearchApprover 指派给 researcher_lin？他将能够批准协议、锁定数据集、批准导出（这些都需要强认证）。他仍然不能批准自己提交的内容。这次指派会署名并写入审计。`
- 撤销：`确认撤销 researcher_lin 的 ResearchApprover 角色？撤销立即生效，他正在处理的审批将无法完成。`

**⑤ 无障碍**：角色能力清单是 `<ul>`，在角色下拉的 `aria-describedby` 里引用（选择变化时清单同步更新并 `role="status"` 播报 `已显示 ResearchApprover 的权限说明`）；理由必填，按钮禁用时 `aria-describedby` 说明原因。

---

### G4 集成与 AI 供应商配置（§21）

**① 目标与密度**：外部集成的连接与状态。**AI 供应商配置在此只做"连接与凭据"，AI 的研究用途配置在 C8**——两者必须分开，管理不得决定 AI 在研究中的角色。密度：dense 表 + 详情。

**② 线框**

```text
管理 › 集成
┌──────────────────┬────────┬────────────┬──────────┬──────────────┐
│ 集成             │ 模式   │ 端点       │ 状态     │ 操作         │
├──────────────────┼────────┼────────────┼──────────┼──────────────┤
│ 知识库（MCP）    │ mcp    │ ack.icar…  │ 正常     │ [查看 KG]    │
│ 邮件供应商       │ 模拟   │ （模拟）   │ 模拟中   │ [查看 邮件]  │
│ 对象存储         │ 真实   │ …          │ 正常     │ [查看 存储]  │
└──────────────────┴────────┴────────────┴──────────┴──────────────┘
ⓘ「模拟」就是模拟：模拟供应商不会把任何东西送到任何人手上。

知识库（MCP）详情
 模式 [simulator | mcp]  当前 mcp   ⓘ 切到 simulator 会让证据检索
   返回确定性的模拟结果——研究者界面会显示为「模拟」，不是真实检索。
 端点 <知识图谱端点>   超时 45s   上次成功调用 11:02
 失败策略 失败关闭：连不上时返回「检索没有完成」，绝不返回空结果。
 ⓘ AI 供应商的凭据在这里管理；AI 在研究中的角色由协议与 AI 配置
   （研究者工作区）决定，不在这里决定。
                                   [修改配置（需要强认证 MFA）]
```

**③ 状态矩阵**

| 态 | 呈现 |
|---|---|
| 加载 | 状态列显示 `正在探测…`，**不预设"正常"** |
| 空队列 | `还没有配置任何集成。` |
| 错误 | 探测失败：`无法确定这个集成的状态（<码>）。不要当作正常。[重试]` |
| 权限不足 | 无 `system.configure`：只读 + `你可以查看集成状态，但不能修改（需要 SystemAdministrator）。` |
| 需要 MFA | 修改配置需要 MFA。屏顶：`本屏的强认证动作：修改集成配置（需要 MFA）。` |

**④ 确认文案**：
`确认把知识库集成从 mcp 切换为 simulator？
研究者的证据检索将改为返回确定性的模拟结果，界面会标注为「模拟」。
已经附加的引用不受影响，它们记录的是当时的检索标识。
这个操作需要强认证（MFA），会署名并写入审计。`

**⑤ 无障碍**：状态列文字化（`正常`/`模拟中`/`无法确定`）；密钥类字段永不明文回显，显示 `已设置（不显示）` + `[更换]`；表格按 1.9。

---

### G5 作业与死信队列（§21）

**① 目标与密度**：运行性作业与死信处理。密度：dense 表。**重放是逐条决定，不做"全部重放"**。

**② 线框**

```text
管理 › 作业 › 死信队列（1）
┌────────┬────────────────┬──────┬────────────┬────────────────────┐
│ 作业   │ 类型           │ 尝试 │ 最早失败   │ 操作               │
├────────┼────────────────┼──────┼────────────┼────────────────────┤
│ job_31 │ 撤回传播       │ 5    │ 2h 前      │ [查看 job_31]      │
│        │ 影响：SP-002 的撤回还没有传播到所有下游。                │
│        │ 错误：DEPENDENCY_UNAVAILABLE（对象存储超时）              │
│        │ [重放这一条] [标记为需要人工处理]                        │
└────────┴────────────────┴──────┴────────────┴────────────────────┘
ⓘ 死信不会自动消失，也不会自动重放。每一条都需要一个人决定。
ⓘ 与参与者权利有关的作业（撤回传播、删除传播）在这里置顶。
```

**③ 状态矩阵**

| 态 | 呈现 |
|---|---|
| 加载 | 表格骨架 |
| 空队列 | `没有死信。所有作业都已成功处理。` |
| 错误 | 重放失败：`重放没有成功（<码>）。这一条仍在死信队列里。` |
| 权限不足 | `你的角色不能处理作业队列（需要 SystemAdministrator）。` |
| 需要 MFA | 重放/标记**不需要** MFA（不是权威动作，是运行动作）。屏顶：`本屏没有需要强认证的动作。` |

**④ 确认文案**：`确认重放 job_31（撤回传播，SP-002）？重放会重新尝试把这次撤回传播到下游。如果再次失败，它会留在死信队列。`

**⑤ 无障碍**：影响与错误是行展开内容（`aria-expanded` 控制），不是 tooltip；置顶的权利相关作业在 `<caption>` 中说明排序规则。

---

### G6 功能旗标（§21）

**① 目标与密度**：旗标的开关与影响。**旗标不能用来绕过同意、审核或安全**——界面要写明。密度：dense 表。

**② 线框**

```text
管理 › 功能旗标
┌────────────────────┬──────┬──────────────────────────┬────────────┐
│ 旗标               │ 状态 │ 影响                     │ 操作       │
├────────────────────┼──────┼──────────────────────────┼────────────┤
│ matching.enabled   │ 关闭 │ 参与者看不到「认识新朋友」│ [查看]     │
│ community.enabled  │ 开启 │ 社区在参与者首页可见     │ [查看]     │
│ ai.companion       │ 关闭 │ 受 Level-5 全禁约束，     │ 锁定       │
│                    │      │ 这个旗标不能被开启       │            │
└────────────────────┴──────┴──────────────────────────┴────────────┘
ⓘ 旗标只能关闭或开启功能的可见性与可用性。旗标不能绕过同意检查、
  审核流程或安全规则——那些由权限引擎与协议决定，不受旗标影响。
```

**③ 状态矩阵**

| 态 | 呈现 |
|---|---|
| 加载 | 表格骨架；**旗标状态未知时不显示"关闭"**，显示 `未知` |
| 空队列 | `还没有定义功能旗标。` |
| 错误 | 切换失败：`旗标没有改变（<码>）。当前仍然是「关闭」。` |
| 权限不足 | 只读 + `你的角色不能修改功能旗标（需要 SystemAdministrator）。` |
| 需要 MFA | 修改旗标属 `system.configure`，**需要 MFA**。屏顶：`本屏的强认证动作：修改功能旗标（需要 MFA）。` |

**④ 确认文案**：`确认开启 matching.enabled？开启后，符合条件且已同意「开放匹配」的参与者会在首页看到「认识新朋友」。这不会绕过任何同意检查——没有同意的参与者仍然看不到。这个操作需要强认证（MFA）。`

**⑤ 无障碍**：状态用文字（`开启`/`关闭`/`未知`/`锁定`）；被锁定的旗标用 `aria-disabled` + 原因文本，不隐藏。

---

### G7 审计访问（§21）

**① 目标与密度**：**查审计本身也是被审计的动作**。密度：dense 表 + 强筛选。**审计不显示被审计资源的内容**，只显示"谁、对什么、做了什么、什么时候、依据什么权限"。

**② 线框**

```text
管理 › 审计访问
┌───────────────────────────────────────────────────────────────────────┐
│ ⓘ 你在这里的每一次查询也会被记录，包括你输入的筛选条件与访问理由。    │
│ 访问理由* [_______________________]（必填，会随查询一并记录）         │
│ 时间 [2026-08-01 → 08-03] 行动者 [__] 动作 [__] 对象类型 [__] [查询]  │
├───────────┬────────────┬──────────────┬──────────┬────────┬──────────┤
│ 时间      │ 行动者     │ 动作         │ 对象     │ 结果   │ 认证强度 │
├───────────┼────────────┼──────────────┼──────────┼────────┼──────────┤
│ 08-03 12:10│ approver_wu│ export.approve│ ex_5    │ 允许   │ mfa      │
│ 08-03 11:44│ researcher…│ protocol.approve│ pv_7  │ 拒绝   │ mfa      │
│           │ 拒绝原因：自批准不被允许（职责分离）                     │
└───────────┴────────────┴──────────────┴──────────┴────────┴──────────┘
ⓘ 审计只显示动作与判定，不显示被访问资源的内容。
ⓘ 破窗访问（break-glass）单独列出，并且必须由不同角色事后复核。
```

**③ 状态矩阵**

| 态 | 呈现 |
|---|---|
| 加载 | 表格骨架；查询未填理由时按钮禁用 |
| 空队列 | `这个条件下没有审计记录。`（**不等于"没有发生"**：追加 `请确认时间范围与筛选条件。`） |
| 错误 | `AUDIT_UNAVAILABLE`：`审计服务暂时不可用。因为审计不可写，某些操作现在会被拒绝而不是被静默执行。` |
| 权限不足 | 无 `audit.view`：`你的角色不能访问审计（需要 SystemAdministrator、OrganisationAdministrator 或 PrivacyReviewer）。` |
| 需要 MFA | **查看审计不需要 MFA**（`audit.view` 无 MFA 要求）；**破窗执行需要 MFA 且仅 SystemAdministrator**。屏顶分别标注。 |

**④ 确认文案**：破窗访问（若在此屏提供入口）：
`确认执行破窗访问？这会在正常权限之外临时授予访问，范围：<范围>，有效期至 <时间>。每一次破窗访问都会被记录，并且必须由另一位角色（隐私复核人）事后复核。理由是必填的，会公开给复核人。这个操作需要强认证（MFA）。`

**⑤ 无障碍**：访问理由是必填 `<textarea>` 且 `aria-required="true"`；拒绝原因作为行展开文本；表格支持按时间/行动者排序（`aria-sort`）；查询结果数经 `role="status"` 播报。

---

## 4. 已实现 → 目标设计 差异清单

现状：`apps/web/src/StaffApp.tsx` + `components/Staff*.tsx` 是**无样式语义 HTML**，把 C2/C5/C6/C12/C14/C17 的一部分压缩进 3 个面板（研究者 / 批准 / 入组协调）。以下为逐项差异。

### 4.1 结构性差异（信息架构）

| 现状 | 目标设计 | 理由 |
|---|---|---|
| `StaffApp` 用 5 个"工作区"按钮（入组协调/研究者/批准/安全 triage/内容审核）平铺 | 研究者工作区应有 §17 的 17 个目的地（仪表盘/项目/问题/证据/协议/干预/参与者/入组/交付/评估/安全/AI/数据集/分析/发现/报告/治理任务）；"批准"不是一个工作区，而是**每类工件的审批视图**（C6/C14/C17 各自的屏） | Doc 20 §17、§26–29 角色感知导航 |
| `StaffApproverPanel` 在一屏并列 4 类高影响决定（协议批准、数据集锁定、导出决定、M15 审批） | 拆成 4 个决定屏，每屏一个决定 | DESIGN_BRIEF §2「单屏不得并列两个高影响决定」 |
| 所有对象靠**手输标识符**（`协议版本标识`、`数据集版本标识`、`导出申请标识`、`审批记录标识`） | 队列驱动：从待办进入对象详情屏，标识符只读显示 + 可复制 | 手输标识符是误操作源；且无法在决定前展示版本/哈希 |
| 审批时**不显示内容哈希**（数据集锁定队列显示 `manifestHash.slice(0,12)`，协议批准完全不显示哈希） | 每个审批屏必须有 `ExactVersionBlock`：类型 + 标识 + 版本号 + **完整可展开哈希** + 差异摘要 | **精确版本后批准（不可协商）** |
| 协议审批屏没有 §66 要求的依据（证据快照、干预配置、AI 配置、同意影响、社区/匹配影响、审核/安全影响、数据集定义、未解决评论） | C6 全部补齐 | §66 |
| 职责分离只在队列行内提示"是你，不能自批"，但决定按钮仍可点 | 队列行按钮 `disabled` + 行内说明；详情屏"你与这个对象的关系"一行；起草侧提交确认提前告知 | **职责分离前置（不可协商）** |
| MFA 提示是按钮文字里的"（MFA）"+ 一句总说明 | 三时点契约：屏顶强认证条 + 按钮文字 `（需要强认证）` + 确认对话框首行；密码级会话下按钮**禁用**而非可点 | **人的权威 / 不得点击后才突然弹出（不可协商）** |
| `MFA_REQUIRED_ACTIONS` 常量列出 5 项，其中「M15 审批决定」正确，但界面把「导出决定（含拒绝）」整体标 MFA | 按 `catalogue.ts` 精确标注：`export.approve` 需要 MFA；**拒绝导出走同一权限键，也需要 MFA**（此项现状正确）；但**证据决定批准、分析计划批准、解释批准、数据集定义批准、协议激活、资格决定不需要 MFA**，新屏不得错标 | 过度警告与漏报同为错误 |
| 无空状态设计（列表为空时只有一行文字或什么都没有） | 每个队列/表格有具名空态（见各章节） | Doc 20 §224–229、I11 |
| 错误呈现为原始错误码（`未成功：${err.error.code}`） | 错误码 → 中文文案 + 分级 + 下一步（1.8 表） | Doc 20 §231–237 |
| 研究者面板的导出表单没有说明「已生成 ≠ 已投递」，也没有状态机 | C17 状态机 5 段 + 诚实措辞 | §91 |
| 全部使用 `<ul style={{listStyle:'none'}}>` 承载表格型数据 | 改为 `<table>` + `<caption>` + `<th scope>`，含排序与列选择 | §251、1.9 |
| 没有认识论标签、没有 `[合成数据]` 标记 | 全工作区强制 | Doc 19 §10、DESIGN_BRIEF §3 |
| 没有 C3/C4 证据界面（后端与 KG 已通） | 新建 C3/C4 | UI_INVENTORY P1 |

### 4.2 会改变可访问名的改动（影响现有测试）

> 说明：`apps/web/test/staff-panels.test.tsx` 与 `apps/web/test/staff-queues.test.tsx` 按可访问名与文本查询元素。下表列出**必须改**（原则驱动）与**建议不改**（无原则理由，改了只是制造测试churn）。

**A. 必须改（原则驱动），会破坏测试：**

| # | 现可访问名 / 文本 | 目标 | 破坏的断言 | 原因 |
|---|---|---|---|---|
| 1 | `button 名 "选择"`（协议/锁定/导出/审批四个队列共 4 处同名） | `打开 pv_7f3a91c2`（含对象标识，唯一） | `staff-queues.test.tsx`：`getByRole('button', { name: '选择' })` | 同名按钮在屏幕阅读器下不可区分（1.9） |
| 2 | `button 名 "查看待办"`（手动触发加载） | 进入屏幕即加载；保留 `刷新待办` 作为显式刷新 | `staff-queues.test.tsx`：`getByRole('button', { name: '查看待办' })` | 队列屏的默认状态应是"已加载"，"空"与"未加载"必须可区分 |
| 3 | `label "协议版本标识"` / `"数据集版本标识"` / `"导出申请标识"` / `"审批记录标识"`（可编辑 input） | 改为只读展示 + `复制协议版本标识`（button）；输入框取消 | `staff-panels.test.tsx`：`getByLabelText('数据集版本标识')`；`staff-queues.test.tsx`：`getByLabelText('协议版本标识')` | 手输标识符无法承载"精确版本后批准" |
| 4 | `button 名 "锁定数据集版本（MFA）"` | `锁定这个数据集版本（需要强认证）` | `staff-panels.test.tsx`：锁定用例 | "MFA"是术语缩写；"需要强认证"是可读文案且承载预告契约 |
| 5 | `button 名 "批准（MFA）"` / `"激活"` / `"批准导出（MFA）"` / `"拒绝导出（MFA）"` | `批准这个协议版本（需要强认证）` / `激活这个协议版本` / `批准这次导出（需要强认证）` / `拒绝这次导出（需要强认证）` | 未被现有测试直接断言（`批准（MFA）` 目前无断言），但 `staff-panels.test.tsx` 断言了 `密码级别下会被拒绝` 文本 | 同上；且拒绝需独立确认对话框 |
| 6 | 文本 `"注意：标注 MFA 的操作在当前密码级别下会被拒绝。"` | 屏顶强认证条：`本屏的强认证动作：批准协议版本、锁定数据集版本、导出批准。你当前是密码级认证，这些按钮已禁用。` | `staff-panels.test.tsx`：`getByText(/密码级别下会被拒绝/)` | "会被拒绝"是事后语气；预告契约要求"已禁用 + 下一步" |
| 7 | 文本 `"——是你，不能自批"`（行内后缀） | 独立句：`这是你提交的，按职责分离规则你不能批准它。` + 按钮禁用 | `staff-queues.test.tsx`：`getByText(/是你，不能自批/)` | 破折号后缀不是完整句，屏幕阅读器读起来是碎片 |
| 8 | `button 名 "确认执行"`（通用，四类动作共用） | 按动作具名：`确认批准这个版本` / `锁定这个数据集版本` / `确认批准这次导出` / `确认这个审批决定` | `staff-panels.test.tsx`：`getByRole('button', { name: '确认执行' })` | 确认按钮必须点名后果（DESIGN_BRIEF §2） |

**B. 建议不改（保持稳定，减少测试churn）：**

`提交处置`、`确认`（安全 triage）、`信号标识`、`处理此信号`、`查看待处理信号`、`记录资格决定`、`资格决定理由`、`入组标识`、`为该参与者办理退出`、`确认退出`、`目的`、`接收方`、`来源（逗号分隔的精确标识）`、`去标识级别`、`提交导出申请`、`创建项目`、`起草协议版本`、`提交评审` —— 这些名称已经符合"动作 + 对象"的原则，目标设计沿用。

**C. 需要新增断言（新行为，无破坏）：**

- 密码级会话下，`批准…（需要强认证）` 按钮 `disabled === true`（现状是可点后 403）。
- 自提交对象的队列行，其 `打开 …` 按钮之外的决定按钮 `disabled === true`。
- 审批确认对话框文本包含**完整内容哈希**（现状仅数据集队列列出前 12 位，且不进对话框）。
- 空队列渲染具名空态文本（现状仅入组列表有 `没有匹配的入组记录。`）。
- 证据检索在 `DEPENDENCY_UNAVAILABLE` 下不渲染空结果列表，而渲染 `检索没有完成` 文本。

**D. 迁移建议**：改动 1–8 集中在 `StaffApproverPanel` 拆分这一次重构里完成，一次性更新两个测试文件，避免分批改名。`StaffCoordinatorPanel`、`StaffSafetyTriagePanel`、`StaffResearcherPanel` 的现有可访问名不动，视觉与状态设计可以单独落地。

---

## 5. 关键取舍（已决定，记录理由）

1. **密度 vs. 触控目标**：dense 档把内容行压到 2rem，但**含控件的行强制回到 2.75rem**。取舍结果是"密集表格 + 稀疏动作列"，而不是全局密集。理由：历史上真实发生过 44px 按钮落进 29px 行框互相压叠的缺陷。

2. **队列驱动 vs. 标识符输入**：全面改为队列驱动，代价是失去"直接粘贴标识符跳转"的效率。补偿：每个对象详情屏提供 `[复制标识]`，并保留一个全局"按标识打开"入口（在 §34 搜索规则下实现），但它导向**详情屏**，不导向决定按钮。

3. **审批屏的哈希呈现**：默认 16 hex 截断，确认对话框内完整。取舍：完整哈希占屏且难读，但**决定的那一刻必须看到完整值**。折中是"浏览时截断，决定时完整"。

4. **权限不足时显示只读视图 vs. 完全隐藏**：对**非受保护存在**的研究工件（协议、数据集、发现），权限不足显示完整只读视图 + 说明——研究者需要看得到依据才能协作。对**受保护存在**的对象（被屏蔽关系、举报人身份），一律 `RESOURCE_NOT_FOUND` 统一文案，不区分"不存在"与"无权限"。

5. **认识论标签强制必填**：增加了每次记录结论的成本。接受这个成本——这是本平台区别于普通研究工具的核心纪律，且当前阶段（合成数据）尤其需要它防止越界表述。

6. **管理仪表盘不显示研究/审核指标**：管理员会失去"平台在产出什么"的总览。这是刻意的（§41）。若确需运行性总览，只允许"作业量、错误率、可用性"这类与内容无关的指标。

7. **AI 配置屏在 Level-5 全禁下仍然存在**：显示"被禁止"比隐藏更诚实，也让"禁止"这件事可被审计与评审。代价是屏幕上存在大量不可操作的控件——用文字说明而非灰化暗示来化解。

8. **不做 grid roving tabindex**：研究者表格列多，roving tabindex 能提升导航效率，但会引入与现有测试和普通 Tab 序不一致的风险。默认用普通 Tab 序；仅在列 > 12 且经过可用性验证后按表启用。

---

## 6. 需要产品决策的未决项

> 以下各项与 Doc 20 存在张力或超出设计权限，**不擅自决定**。

| # | 未决项 | 张力所在 | 需要谁决定 | 若不决定的临时处理 |
|---|---|---|---|---|
| U1 | **协议批准是否属于"双人批准"**：UI_INVENTORY 把 C6 记为"精确版本、**双人**"；但 Doc 20 §66 本身不含双人要求，§245 只说 Dual Approval 用于"由策略指定的**选定治理动作**"（例外数据放行、高影响配置）。`catalogue.ts` 当前对 `protocol.approve` 只强制"批准人 ≠ 提交人"（单批准人 + 职责分离） | 清单 vs. 规范 vs. 实现，三者不一致 | 研究治理负责人 + 后端 | 界面按**单批准人 + 职责分离**设计，并在审批屏显示 `本次批准需要 1 名批准人（与提交人不同）`，为未来"2 名"预留批准人列表位与第二签名区；同时需要澄清哪些动作属于 §245 的双人范围（候选：导出批准、破窗执行） |
| U2 | **数据集锁定的批准人角色**：`dataset.lock` 属 ResearchApprover。研究者无法锁定自己定义的数据集——这是好的，但 §82 的"人工授权"没写明是否需要与 `dataset.approve-definition` 的批准人不同 | 职责分离粒度 | 研究治理负责人 | 界面显示两个批准人的身份（定义批准人 / 锁定人），若相同则显示提示 `定义与锁定由同一人完成`，不阻断 |
| U3 | **管理工作区是否能看到参与者账号的存在**：G2 目前显示参与者账号行（仅账号事实）。若参与者存在本身在某些情境下是受保护信息（ADR-050），管理列表就不该显示 | 运维需要 vs. 受保护存在 | 隐私负责人 | 当前设计显示账号事实但不显示任何内容；若判定为受保护，改为"仅按精确标识查询，不列表" |
| U4 | **审计访问的"访问理由"是否必填**：设计上设为必填（提高滥用成本），但后端 `audit.view` 无此要求 | 设计 vs. 实现 | 隐私负责人 | 前端必填、随查询记录；若后端不记录该字段，需后端增加，否则这是"假的保障" |
| U5 | **`STEP_UP_AUTHENTICATION_REQUIRED` 与 `mfa`/`step-up` 三级**：`AuthStrength` 有 `password | mfa | step-up` 三级，但 `catalogue.ts` 目前最高只用到 `mfa`。是否有动作应升到 `step-up`（例如破窗执行、导出批准） | 安全分级 | 安全负责人 | 界面统一用"强认证（MFA）"一种措辞；若引入 step-up，需要第二套措辞（`需要再次验证身份`） |
| U6 | **合成阶段的"干预决定"是否应禁用部分取值**：§90 提供八种取值，但当前全部数据为合成，"扩大 Expand""保留 Retain"在合成证据上做出是有风险的表述 | 完整性 vs. 认识论纪律 | 研究负责人 | 当前设计保留八项但对 Expand/Retain/Retire 要求额外理由字段并显示警告；是否直接禁用需研究负责人决定 |
| U7 | **报告与导出内容中的 `[合成数据]` 标记形式**：界面内已强制；导出的文件本身（CSV/PDF）如何携带该标记（文件名？页眉？清单字段？）超出 UI 设计范围 | 跨边界诚实性 | 研究负责人 + 后端 | 界面在批准确认中声明"导出内容标记为 [合成数据]"，但**该声明的兑现需要后端实现**——在实现前，这句话不得出现（否则是虚假承诺） |
| U8 | **研究者工作区的 17 个目的地是否全部进主导航**：Doc 20 §17 列出 17 项，移动端不可能平铺 | 完整性 vs. §33 移动导航 | 产品 | 桌面：主导航 8 项 + "更多"分组；移动：底部 4 项 + 抽屉。分组归属需产品确认 |
| U9 | **KG 语料局限的呈现强度**：KNOWLEDGE_GRAPH_INTEGRATION 明确种子语料"远不足以支撑真实证据综述"。C3 目前把这句话放在屏顶固定说明 | 可用性 vs. 诚实 | 研究负责人 | 保持屏顶固定说明；是否在每张证据卡上重复该限制（更诚实但更嘈杂）需决定 |
| U10 | **"保存视图"是否跨用户共享** | 协作 vs. 个人配置泄露（保存的筛选条件可能暴露研究意图） | 产品 + 隐私 | 当前设计为**仅个人**，不提供共享 |

---

## 7. 落地检查表（实现时逐项自检）

- [ ] 每个审批屏的批准控件同视口内可见：类型 / 标识 / 版本号 / 内容哈希
- [ ] 确认对话框内显示**完整**哈希
- [ ] 提交人 = 当前身份时，决定按钮在**渲染时**即禁用并给出完整句说明
- [ ] 起草侧提交确认提前说明"提交后你不能批准"
- [ ] 屏顶强认证条列出本屏所有 MFA 动作；密码级会话下相应按钮禁用
- [ ] 没有任何 MFA 要求是在点击后才出现的
- [ ] 每张证据卡显示出处 / 研究设计 / 证据强度 / 冲突证据
- [ ] 弱、间接、缺失证据有区别于强证据的版式与显式说明
- [ ] `DEPENDENCY_UNAVAILABLE` 不渲染空结果列表
- [ ] 每个结论性元素有认识论标签；合成数据结果带 `[合成数据]`
- [ ] 分析输出 / 解释 / 发现三层版式与措辞可区分
- [ ] 管理工作区每屏有边界横幅；管理仪表盘无研究/审核指标
- [ ] 所有列表为 `<table>` 语义，排序有 `aria-sort` + 播报
- [ ] 行内动作按钮可访问名唯一且含对象标识
- [ ] 含控件的行 ≥ 2.75rem，相邻目标不重叠
- [ ] 每个列表有具名空态；空态与加载态、错误态可区分
- [ ] 错误显示中文解释 + 下一步，不显示裸错误码
- [ ] 200% 缩放下无横向页面滚动
