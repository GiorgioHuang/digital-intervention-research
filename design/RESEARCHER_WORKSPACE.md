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

**Implementation status (2026-08-04): partially implemented.** The chain of search → create a review → attach citations → submit → have somebody else approve is now reachable. Previously the search could be called and citations could be attached, **but no query listed reviews at all** — so a review could only be created, added to and submitted by somebody keeping the identifier in their head outside the product, and nobody could reach the review queue at the end of the chain. Three points of wording hold this section's requirements: (1) **provenance before assertion (§51)** — a result card leads with "source system · external identifier · version" and only then gives the title and abstract; the abstract is the search system's account of a thing, whereas the provenance is what lets a person judge whether to believe it. (2) **A failed search is never written as "no evidence"** — an unreachable upstream returns 503 and appears on screen as an error, never as an empty result; "we could not ask" and "there is none" are different facts. (3) **A citation that fails to resolve is not rendered as a citation** — when it does not resolve, the record takes the raw identifier as its title with the source `unknown`, and rendering that alongside resolved ones as though nothing were different would turn "we cannot find this" into something that looks like a citation. Each one is therefore marked with its resolution status, and the approval screen additionally counts beside the control: "M of N have not been checked against a source, and approving does not check them."

The presentation of conflicting evidence (§60) and the evidence snapshot came with C4.

**① Purpose and density**: turn search results from an external knowledge graph into **reviewable evidence material**, not into "answers". Density: a dense list + a detail panel on the right (desktop); on mobile, a card stream with drill-down to detail. **The data on this screen is real (a genuine MCP call), but the graph's content is a hand-curated seed corpus** — and that must be said plainly.

**② 线框**

```text
Evidence › Search
┌───────────────────────────────────────────────────────────────────────┐
│ ⓘ Results come from the external knowledge base graceage-knowledge-mcp (a genuine call). │
│   The graph's content is a hand-curated seed corpus, limited in size and │
│   not sufficient to support a complete evidence review.                │
│   [source-derived] A search result is not a research conclusion of this │
│   platform; only a citation you attach by hand becomes platform state. │
├───────────────────────────────────────────────────────────────────────┤
│ Search question* [loneliness in older adults ________] [Search]       │
│ Bound to research question [RQ-001 ▾]   Evidence review [ER-004 (draft) ▾ | New] │
├─ 5 results ── Filter: [Strength all▾][Design all▾][Conflicts only▢] Sort: [Relevance▾]│
│                                                                       │
│ ┌ 1 ── ga:loneliness ──────────────────────── Strength: high ⚠conflict ┐│
│ │ Provenance DOI:10.1177/1088868310377394 · Design systematic review/meta-analysis │ │
│ │ Search identifier sha256:4c1a…e097 · Searched 2026-08-03 11:02    │ │
│ │ Population 65+ community-dwelling · Setting non-clinical · Direction reduces risk │ │
│ │ ⚠ 2 pieces of conflicting evidence exist   [Compare conflicts side by side] │ │
│ │ Abstract (upstream content, not a conclusion of this platform): …  │ │
│ │ Decision: ( )Include ( )Exclude ( )Defer  Reason*[______] [Attach as a citation] │ │
│ └───────────────────────────────────────────────────────────────────┘ │
│ ┌ 2 ── ga:digital-reminiscence ──────────────── Strength: low ──────┐ │
│ │ ⚠ The evidence is weaker — not enough to support an intervention decision, │ │
│ │   only enough to support "further research is needed".            │ │
│ │ Indirect evidence: the source population is mixed-age and does not │ │
│ │   match this study's population (65+).                            │ │
│ │ …                                                                 │ │
│ └───────────────────────────────────────────────────────────────────┘ │
│ ┌ Evidence gap ─────────────────────────────────────────────────────┐ │
│ │ No direct evidence was found on "the effect of digital reminiscence │ │
│ │ interventions on loneliness".                                      │ │
│ │ That is itself part of the research finding. [Record as a knowledge gap] │ │
│ └───────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────────┘
```

The side-by-side conflict comparison (§61):

```text
Side by side: conflicting evidence for ga:loneliness
┌──────────────────────────┬──────────────────────────┐
│ A  DOI:10.1177/108886…   │ B  PMID:29710…           │
│ Direction reduces risk   │ Direction no significant effect │
│ Design systematic review/meta-analysis │ Design randomised controlled trial │
│ Population 65+ community │ Population 75+ institutional │
│ Strength high            │ Strength moderate        │
├──────────────────────────┴──────────────────────────┤
│ ⚠ These two disagree. Do not average them, and do not │
│   simply take one of them.                            │
│   Record this conflict explicitly in the evidence decision. │
│   Suggested evidence-decision value: Conflicting Evidence │
└─────────────────────────────────────────────────────┘
```

**③ 状态矩阵**

| State | Presentation |
|---|---|
| Loading | The search button takes `aria-busy` with the copy `Searching the external knowledge base…`; **after 15 seconds** (the semantic search's cold path genuinely is that slow) it adds `Semantic search against the external knowledge base sometimes takes upwards of ten seconds. Still waiting.`; there is no automatic timeout cancellation (the client's own limit is 45 seconds) |
| Empty queue | **Two kinds of empty, distinguished**: ① genuinely no match → the evidence gap card (see the wireframe), offering `Record as a knowledge gap`; ② results filtered to nothing → `No results under the current filter. [Clear the filter]`, showing how many were filtered out |
| Error | `DEPENDENCY_UNAVAILABLE`: the whole block is replaced with `The search did not complete — the external knowledge base cannot be reached right now. This does not mean "there is no evidence". [Try again]`, and **an empty list is never shown**; `PROVIDER_TIMEOUT` behaves the same way |
| Insufficient permission | Without `evidence.search`: `Your role cannot search evidence (it needs Researcher).` Access from a participant identity is always 403 |
| MFA required | Searching and attaching citations do **not** require MFA. The strong-authentication bar at the top says: `No action on this screen requires strong authentication.` |

**④ Key interactions and confirmation copy**

- Attaching as a citation (a confirmation dialog, because this is the moment external content enters platform state):
  `Attach this external evidence as a citation?
  What will be recorded: the external identifier <ga:loneliness>, the search identifier (version) <sha256:4c1a…e097>, the time searched <2026-08-03 11:02>, and the reason you wrote.
  Once attached, this citation belongs to evidence review ER-004. It can be excluded, but it will not be deleted.`
  Buttons: `Confirm and attach` / `Go back`
- Recording a knowledge gap: `Record "<question>" as a knowledge gap? This becomes a research record tagged [future empirical question], not a conclusion.`
- Excluding or deferring requires a reason; the button is disabled while the reason is empty, with the explanation: `An exclusion is part of the research record too — please write down why.`

**⑤ Accessibility**: the result list is an `<ol>` with an `<h3>` inside each `<li>` carrying the external identifier; after a filter change `role="status"` announces `3 results after filtering, 1 of which has conflicting evidence.`; "⚠ conflict" must carry the words "conflicting evidence exists" and never rest on the icon; the side-by-side comparison is a two-column `<table>` with A/B provenance as the column headers; `[Open in the source system]` is an external link and adds `(opens in a new window)`.

---

### C4 证据决定与快照（§62–63）

**Implementation status (2026-08-04): partially implemented.** A decision can be written against a review and agreed by a second person; on agreement an **immutable EvidenceSnapshot** is written in the same transaction, with its content hash on screen — that snapshot is what later work cites, which is why the confirmation copy says outright that this is the last moment the wording can change, and that changing it afterwards means a new decision. Three points of wording: (1) **the outcome vocabulary belongs to the platform and is not invented by the interface** — the database rejects values outside it, and "approved / rejected / provisional" are **not** outcomes; an outcome answers "what does the evidence say" and approval answers "who agreed", and merging the two makes a decision read as settled because somebody signed it. (2) **"The evidence conflicts" is a first-class outcome** (§60), written as a finding rather than as a failure to reach a conclusion; a vocabulary offering only support and oppose pushes whoever writes the decision towards overstating one side. (3) It is **explicitly distinguished** from "insufficient evidence": one means things were found and they contradict each other, the other that almost nothing was found. A decision may be written against a review that has not been approved — the command allows it, so the interface **warns honestly rather than pretending to block** (an interface narrowing this on its own would be inventing a rule the server does not have); the approval screen additionally notes that "agreeing with this decision is not the same as approving that review".

**Not implemented**: a browsing screen of its own for evidence snapshots (the hash is currently shown only inline on the decision).

**① Purpose and density**: converge a set of evidence citations into **one of seven evidence decisions**, then freeze it as an **immutable snapshot**. Density: standard (this is a decision screen, not a browsing screen). **One decision per screen.**

**② 线框**

```text
Evidence › ER-004 › Evidence decision
┌───────────────────────────────────────────────────────────────┐
│ Research question RQ-001 "Can a digital reminiscence intervention │
│ reduce loneliness among community-dwelling older adults?"      │
│ Citations included 4 · excluded 3 · deferred 1  [View all citations] │
│ ⚠ 2 of them are marked as conflicting evidence. Conflict is never resolved automatically. │
├─ Decision (choose exactly one of seven) ──────────────────────┤
│ ( ) Support                                                    │
│ ( ) Support with Conditions   → conditions* [__]               │
│ ( ) Insufficient Evidence                                      │
│ (•) Conflicting Evidence                                       │
│ ( ) Restrict                                                   │
│ ( ) Do Not Proceed                                             │
│ ( ) Research Required                                          │
│ ⓘ This is the scientific conclusion. It is a different thing from │
│   "who approved this decision", and the two are recorded separately. │
│ Applicability and limitations*  [_____________________________] │
│ Epistemic tag*  [source-derived ◆] (suggested automatically, editable; never blank) │
│                                     [Save draft] [Submit the decision] │
└───────────────────────────────────────────────────────────────┘

Evidence › ER-004 › Evidence snapshot (review before creating)
┌───────────────────────────────────────────────────────────────┐
│ Once created, a snapshot cannot be changed. A protocol version cites it │
│ as "the evidence this was approved on".                        │
├───────────────────────────────────────────────────────────────┤
│ Knowledge citations included (4)                               │
│  ┌────────────────┬──────────────┬──────────────┬───────────┐ │
│  │ External id    │ Search id (version) │ Searched  │ Source system │ │
│  ├────────────────┼──────────────┼──────────────┼───────────┤ │
│  │ ga:loneliness  │ sha256:4c1a… │ 08-03 11:02  │ graceage… │ │
│  │ ga:ucla        │ sha256:77b0… │ 08-03 11:03  │ graceage… │ │
│  └────────────────┴──────────────┴──────────────┴───────────┘ │
│ Citations excluded (3) and the reasons          [Expand]       │
│ Completeness  ⚠ not covered: institutional populations; only 3 theory nodes (a limit of the corpus) │
│ Licence  not stated — do not redistribute the original on this basis │
│ Content hash  sha256:be31f0a9… (over the included set and the reasons) [full] │
│                                        [Create the snapshot (immutable)] │
└───────────────────────────────────────────────────────────────┘
```

**③ 状态矩阵**

| State | Presentation |
|---|---|
| Loading | A skeleton for the citation table; the decision radio group is disabled until the data has arrived (so a decision cannot be made against an empty set) |
| Empty queue | With no citations included, submitting a decision is **not allowed**: `This evidence review has no citations included. An evidence decision with no citations does not stand. [Back to search]` ("insufficient evidence" must also rest on at least one recorded search) |
| Error | `INVALID_STATE_TRANSITION`: `This evidence review has already been submitted or completed, and the decision can no longer be changed.`; `VERSION_CONFLICT`: keeps the applicability text you wrote and prompts a reload |
| Insufficient permission | Drafting a decision needs `evidence-decision.draft` (Researcher / EvidenceReviewer); approving needs `evidence-decision.approve` (EvidenceReviewer). A researcher sees the approve button rendered as `Approval is done by an evidence reviewer (you do not hold this permission)` |
| MFA required | Approving an evidence decision **requires confirmation only, not MFA**. The bar at the top says: `No action on this screen requires strong authentication. Approval is carried out by an evidence reviewer with a confirmation.` (Mislabelling it as MFA is **forbidden**) |

**④ Confirmation copy**

- Submitting the decision: `Submit this evidence decision (Conflicting Evidence)? Submitting records you as the submitter; approval is carried out by an evidence reviewer, and you cannot approve a decision you submitted yourself.`
- Creating the snapshot (an irreversible action, so an `alertdialog`):
  `Create the evidence snapshot?
  The snapshot freezes the 4 citations currently included, their search identifiers and search times, and the exclusion reasons you wrote.
  Content hash: sha256:be31f0a97c4d1e2b… (the full value)
  Once created a snapshot cannot be changed and cannot be deleted. Protocol approval cites this snapshot.`
  Buttons: `Create the snapshot (immutable)` / `Go back and review`

**⑤ Accessibility**: the seven options are a radio group in `<fieldset><legend>Evidence decision</legend>` with **nothing pre-selected** (no default choice, so nothing is nudged); the citation table follows 1.9; the hash is a `<code>` plus a copy button whose accessible name is `Copy the content hash`.

---

### C5 Protocol version editor (§64–65) — partially implemented

**① Purpose and density**: edit a protocol version section by section, with "how complete it is" and "what differs from the previous version" visible at all times. Density: dense, three columns (section navigation / editing area / completeness and comments on the right); a single column with a section drawer on mobile. **Autosave is not submission, and it is certainly not approval** (a hard requirement of §65).

**② Wireframe**

```text
Protocols › PR-002 › version v3 (draft)
┌──────────────┬────────────────────────────────────┬───────────────┐
│ Sections      │ 3. Intervention and dose           │ Complete 7/11 │
│ ✓1 Purpose    │ ┌────────────────────────────────┐ │ ✗ 5 Consent impact │
│ ✓2 Population │ │ …the editing area…             │ │ ✗ 8 Dataset boundaries │
│ ●3 Intervention and dose │ │                     │ │ ✗ 9 Matching rules │
│ ✗5 Consent impact │ └────────────────────────────┘ │ ✗11 Safety rules │
│ ✗8 Dataset boundaries │ Evidence snapshot cited* [ES-011 sha256:be31…▾]│─ Comments (2) ─│
│ …            │ Intervention version cited* [IV-004 v2 ▾] │ Unresolved 2 │
│              │ [Have AI draft this section] 🤖    │ @approver_wu  │
├──────────────┴────────────────────────────────────┴───────────────┤
│ Draft autosaved at 11:32. Autosaving does not submit, and does not approve. │
│ [View the differences from v2] [Validate] [Submit for review]      │
└───────────────────────────────────────────────────────────────────┘
```

**③ State matrix**

| State | Presentation |
|---|---|
| Loading | The section navigation renders first (its structure is known) with a skeleton for the body; editing is not allowed until loading completes, to prevent overwriting |
| Empty queue | On a new version every section is empty: `This is a blank new version. You can also copy the content from v2 and edit it. [Copy from v2]` |
| Error | A failed autosave must be **explicit**: `Autosave failed (<code>). Your changes are still on this page but have not been saved to the server. [Retry saving]` — never silent; `VERSION_CONFLICT` uses the §230 version-conflict presentation, showing your version and the server's side by side for a person to choose between |
| Insufficient permission | Without `protocol.draft`: read-only mode, with `You can view this protocol version but cannot edit it (it needs Researcher).` at the top |
| MFA required | Editing and submitting do **not** require MFA. A permanent note beside the submit button: `After submitting, an approver approves it with strong authentication (MFA). You cannot approve a version you submitted yourself.` |

**④ Confirmation copy**

- Submitting for review:
  `Submit protocol version v3 for review?
  Submitting fixes this version's content and generates a content hash, and an approver can only approve this exact version.
  Submitting records you as the submitter — you will not be able to approve this version afterwards (separation of duties).
  4 sections are still incomplete and 2 comments are unresolved; these remain visible to the approver after submission.`
  Buttons: `Confirm and submit` / `Go back and keep editing`
- Leaving with unsaved changes: `This page has unsaved changes. Leaving will lose them.` `Stay on this page` / `Discard the changes and leave`
- AI drafting: an inserted draft is wrapped in a `🤖 Drafted by AI · not adopted` block; after `[Adopt into this section]` the block disappears and "AI involvement" is recorded in that section's provenance.

**⑤ Accessibility**: the section navigation is a `<nav aria-label="Protocol sections">` + list; completion status is words (`complete`/`incomplete`) rather than only ✓/✗ symbols (the symbols carry `aria-hidden` and are paired with words); autosave status is announced through `role="status" aria-live="polite"` but is **rate-limited** (at most once every 30 seconds, so it does not keep interrupting a screen reader); the diff view uses the semantic `<ins>`/`<del>` elements and provides a text summary listing only the changed sections (never relying on colour to distinguish an addition from a deletion).

---

### C6 Protocol approval view (§66, §89) — partially implemented

**① Purpose and density**: this is the screen where the **approval against an exact version** principle is most concentrated. Density: standard (a decision screen) — complete information, with no second decision stacked on top.

**② Wireframe**

```text
Approvals › protocol version pv_7f3a91c2
┌───────────────────────────────────────────────────────────────────────┐
│ ⓘ Strong-authentication actions on this screen: approve a protocol version (requires MFA). You are currently at the MFA tier. │
├─ What you are approving ──────────────────────────────────────────────┤
│ Type ProtocolVersion  Identifier pv_7f3a91c2 [copy]  Version v3        │
│ Content hash sha256:9b1c4e0a7d55f231… [full][copy]                     │
│ Drafted by researcher_lin  Submitted by researcher_lin  2026-08-01 09:14 │
│ Your relationship to this object: you neither drafted nor submitted it, so you can decide. │
├─ Changes from v2 (12) ────────────────────────────────────────────────┤
│ • 3 touching consent (model): adds the "community participation" scope → re-consent required │
│ • 1 touching dataset boundaries: includes message metadata (not content) │
│ • 8 textual revisions                            [View differences by section] │
├─ Unresolved comments (2) ─────────────────────────────────────────────┤
│ @approver_wu on §8: the wording of the dataset boundary needs to align with the M12 definition (unresolved) │
├─ Basis and impact ────────────────────────────────────────────────────┤
│ Evidence snapshot  ES-011  sha256:be31f0a9… (immutable)   [View]      │
│ Intervention configuration  IV-004 v2                     [View]      │
│ AI configuration  Level-5 entirely prohibited (current phase) [View]  │
│ Consent impact  Re-consent required: yes (affects 24 synthetic participants) │
│ Community/matching  Community "Gardening Corner" rules v2; matching policy unchanged │
│ Moderation/safety  A moderation owner is in place: yes; safety rules unchanged │
│ Dataset definition  DD-003 (draft) — ⚠ not yet approved               │
├───────────────────────────────────────────────────────────────────────┤
│ Decision (choose one; a reason is required)                           │
│  ( ) Approve this version (requires strong authentication, MFA)       │
│  ( ) Send back to the drafter                                         │
│ Reason* [__________________________________________________]          │
│                                              [Submit my decision]     │
└───────────────────────────────────────────────────────────────────────┘
```

**③ State matrix**

| State | Presentation |
|---|---|
| Loading | The `ExactVersionBlock` renders first (the version and hash are preconditions of the decision and must arrive first); until everything has arrived the decision area is disabled and notes `The basis has not finished loading, so no decision can be made yet.` |
| Empty queue | An empty review queue: `There are no protocol versions awaiting your review.` + `Versions you submitted are handled by other approvers.` |
| Error | Self-approval `AUTHORISATION_DENIED`: this screen **should never be reached** in that state (the queue already disables it); if it happens anyway, it shows `You submitted this, so under separation of duties you cannot approve it. The interface should have stopped you earlier — that is a defect.`; `VERSION_CONFLICT`: the decision area is disabled, `This version was changed while you were reading it. Open the latest version again.` |
| Insufficient permission | Without `protocol.approve`: the full approval view is shown read-only (a researcher needs to see the basis) + `You can view this but cannot approve it (it needs ResearchApprover).` |
| MFA required | A password-tier session: the approve option is disabled and marked `requires strong authentication (MFA)`; `Send back to the drafter` remains available (it does not require MFA). The explanation: `You are authenticated at the password tier and cannot approve. You can send it back to the drafter, or sign in again with MFA and then approve.` |

**④ Confirmation copy (in full)**

```
Approve ProtocolVersion pv_7f3a91c2, version v3?
Content hash: sha256:9b1c4e0a7d55f2318a6e0c4477bd91ea (the full value)
What you are approving is this exact version. Any later change to the protocol has to go through a new version.
This approval is signed in the name of researcher_wu and written to the audit trail.
Impact: re-consent required (24 synthetic participants, model); dataset definition DD-003 is still unapproved.
This action requires strong authentication (MFA).
```
Buttons: `Confirm and approve this version` / `Go back and review`

Sending back: `Send this back to the drafter? The reason you wrote goes to researcher_lin, and the version returns to draft.`

**⑤ Accessibility**: the confirmation dialog is `role="alertdialog" aria-labelledby aria-describedby`, focus lands on the title on entry, and Esc = go back; the hash is presented in full inside the dialog as `<code>` and is allowed to wrap (never scrolling horizontally); the decision radios pre-select nothing; "unresolved comments" is a `<ul>` with the count written into the `<h3>` text; `requires strong authentication (MFA)` is part of the button's accessible name, not a purely visual badge.

---

### C7 Intervention configuration (§67)

**① Purpose and density**: define an intervention's purpose, component versions, pathway, dose, completion criteria and safeguards. Density: a dense form + the component version table.

**② Wireframe**

```text
Interventions › IV-004 › version v3 (draft)
┌───────────────────────────────────────────────────────────────┐
│ Purpose*     [___________________________________]            │
│ Outcome mapping* [linked to RQ-001's outcome O ▾]              │
├─ Components and versions (exact versions, row by row) ────────┤
│ Component            │ Version │ Content hash │ Order │ Action │
│ Life-story prompt set │ v4     │ sha256:0a1b… │ 1     │ [Change version] │
│ Community activity script │ v2 │ sha256:77cd… │ 2     │ [Change version] │
│ ⓘ Changing a component version changes the intervention's identity — a new intervention version is required afterwards. │
├─ Pathway / schedule / dose ───────────────────────────────────┤
│ Pathway [standard ▾]  Schedule [twice weekly ▾]  Dose [20–30 minutes] │
│ Completion criteria* [__________]   Adaptive range [±1 per week] │
├─ Roles and rules ─────────────────────────────────────────────┤
│ Supporter role [help with recording only ▾]  Life-story rule [visible once the participant grants it ▾] │
│ Community rules [Gardening Corner v2 ▾]     Matching rules [follow the protocol ▾] │
│ AI role  [current phase: entirely disabled (Level-5)]  🔒 cannot be switched on here │
├─ Safeguards ──────────────────────────────────────────────────┤
│ ☑ A participant may skip any activity at any time  ☑ A safety signal can be raised within an activity │
│                     [Save draft] [Submit for approval (approval requires MFA)] │
└───────────────────────────────────────────────────────────────┘
```

**③ State matrix**

| State | Presentation |
|---|---|
| Loading | A skeleton for the component version table; the dropdowns are disabled until the version list has arrived |
| Empty queue | No component versions available: `There are no component versions available yet. An intervention must cite exact component versions and cannot cite "the latest". [Go and create a component version]` |
| Error | Citing an unapproved component version → `INVALID_STATE_TRANSITION`: `The component "Community activity script v2" has not been approved and cannot be part of an intervention.` |
| Insufficient permission | Without `intervention.draft`: read-only + `You can view this intervention configuration but cannot edit it (it needs Researcher).` |
| MFA required | Drafting and submitting do not; `intervention.approve` does. Beside the submit button: `After submitting, an approver approves it with strong authentication (MFA); you cannot approve a version you submitted yourself.` |

**④ Confirmation copy**: `Submit intervention version v3 for approval? Submitting fixes the current combination of component versions (life-story prompt set v4, community activity script v2) and the content hash. An approver can only approve this exact combination.`

**⑤ Accessibility**: the component table follows 1.9; "the AI role cannot be switched on" is a written explanation + a `disabled` control + `aria-describedby` pointing at the reason, and never a hidden control (hiding it would leave someone believing the capability does not exist, when the fact is that it is *forbidden* — §71 requires that a hidden sensitive capability be visibly stated as prohibited).

---

### C8 AI intervention configuration and change warnings (§68–69)

**① Purpose and density**: display the AI's **effective configuration** and the **impact of a change**. In the current phase Level-5 is entirely prohibited — and **this is not "there is no such screen"; it is a screen that displays the fact of the prohibition and its reason**. Density: a dense read-only table + the change-warning panel.

**② Wireframe**

```text
AI configuration › effective version (read-only)
┌───────────────────────────────────────────────────────────────┐
│ ⓘ Current phase: AI action Level-5 (entirely disabled). The configuration │
│   below is the configuration surface of the future system being modelled; │
│   no AI role is running now.                                   │
├───────────────────────────────────────────────────────────────┤
│ AI roles enabled   (none) — all disabled                       │
│ Model alias        companion-draft-alias (not bound to a provider) │
│ Provider restriction  approved providers only; 0 approved at present │
│ Prompt version     prompt_v0 (not active)  hash sha256:1f20…   │
│ Output schema      life-story-draft.v1                         │
│ Retrieval sources  the participant's own content only; cross-participant retrieval is forbidden │
│ Tool set           (empty)                                     │
│ Action level       Level-5, entirely prohibited                │
│ Memory policy      nothing retained (no session memory)        │
│ Life-story rule    AI can only produce a draft, and never confirms testimony automatically │
│ Community/matching rule  AI is forbidden from taking part in matching or mutual acceptance │
│ Message rule       AI may draft; sending must be confirmed by the participant │
│ Moderation/safety policy  an AI classification is not a safety event │
│ Evaluation         not run                                     │
│ Effective version  aicfg_v0  hash sha256:c440…     [View history] │
└───────────────────────────────────────────────────────────────┘

The change warning (shown when somebody attempts a modification)
┌─ ⚠ This is a significant change ──────────────────────────────┐
│ Participants affected   24 (synthetic)                         │
│ Protocol in force       PR-002 v3 (approved)                   │
│ Data impact             new: it would read participants' life-story drafts │
│ Intervention fidelity   the intervention's content would change — it cannot be analysed together with the previous version │
│ Re-evaluation required  yes (the AI evaluation suite has not been run) │
│ Re-consent required     yes (model: a new purpose for the data) │
│ Release method          staged (0 participants first, then widened by hand) │
│ Rollback                can roll back to aicfg_v0; rolling back does not retract drafts already produced │
│ ⓘ Level-5 is entirely prohibited at present, so this change cannot be │
│   submitted. This panel shows what would happen if it could be. │
└───────────────────────────────────────────────────────────────┘
```

**③ 状态矩阵**

| State | Presentation |
|---|---|
| Loading | A skeleton for the read-only table |
| Empty queue | No version history: `There is no AI configuration history yet. The current configuration is the initial aicfg_v0.` |
| Error | A failed read: `The AI configuration could not be loaded (<code>). Until it has loaded, do not assume the AI is either off or on. [Try again]` (fail-closed wording) |
| Insufficient permission | Anyone who is not Researcher/ResearchApprover: the prompt content and its hash are not shown, and it says `The prompt content is not visible to your role.` |
| MFA required | Nothing can be changed in the current phase, so there is no MFA action. At the top: `There is no change action available on this screen (Level-5, entirely prohibited).` |

**④ Confirmation copy** (the template for when it is switched on in future, shown here in its disabled state):
`Change the AI configuration from aicfg_v0 to aicfg_v1? This changes the intervention content 24 participants encounter, and data from the old and new versions cannot be analysed together. Re-consent and re-evaluation are required. This action requires strong authentication (MFA).`

**⑤ Accessibility**: the Level-5 prohibition is not implied by grey text but stated in words, `entirely disabled`; the change-warning panel is `role="note"` (not a dialog), and its eight impacts are a `<dl>`; the reason it "cannot be submitted" is in the button's `aria-describedby`.

---

### C9 Community configuration (§70)

**① Purpose and density**: configure a `CommunitySpace` and its rule versions. Density: standard. **Without a moderation owner it cannot be activated** (a hard requirement of §70).

**② Wireframe**

```text
Communities › Gardening Corner › configuration
┌───────────────────────────────────────────────────────────────┐
│ Purpose*     [___________________________]                     │
│ Eligibility  [enrolled and has consented to "community participation" ▾] │
│ Rule version* [CR-Gardening-Corner v2  sha256:5ac9… ▾]  [Read the rules in full] │
│ Moderation owner* [(unassigned) ▾]  ⚠ unassigned               │
│ Content types  ☑ text  ☑ images  ☐ audio (not enabled in this phase) │
│ Visibility   [members of this community only ▾] (the minimum visibility by default) │
│ Reporting and moderation  reports go to the moderation workspace; the reporter's identity never enters the community view │
│ Archiving policy  [read-only archive after the study ends ▾]   │
│ Prototype phase  [conceptual research (synthetic participants)] │
├───────────────────────────────────────────────────────────────┤
│ [Save draft]  [Activate the community] ← disabled: no moderation owner assigned │
│ ⓘ Without a moderation owner in place, a community cannot be activated. │
└───────────────────────────────────────────────────────────────┘
```

**③ 状态矩阵**

| State | Presentation |
|---|---|
| Loading | The rule-version dropdown is disabled until the list has arrived |
| Empty queue | No rule versions: `There are no community rule versions yet. A community must be bound to an exact rule version before it can be activated. [Create a rule version]` |
| Error | The moderation owner is removed during activation → `INVALID_STATE_TRANSITION`: `The moderation owner is no longer in post, and the community was not activated. Please assign another.` |
| Insufficient permission | Without `community.create`: read-only + `This needs OrganisationAdministrator or Researcher.` |
| MFA required | Creating and activating a community do **not** require MFA. At the top: `No action on this screen requires strong authentication.` |

**④ Confirmation copy**:
`Activate the community "Gardening Corner"? Once activated, eligible participants will see this community and can join it. Rule version CR-Gardening-Corner v2 (sha256:5ac9…) becomes the exact set of rules shown when they join. Moderation owner: moderator_zhang.`

**⑤ Accessibility**: while the `Activate the community` button is disabled, `aria-describedby` points at the text giving the reason; checkbox groups use `<fieldset><legend>`; "the minimum visibility by default" is a **default value** and the label says "default" explicitly.

---

### C10 Matching / mutual acceptance / connection policy configuration (§71)

**① Purpose and density**: configure the matching policy. **The design point of this screen is that the absence of a capability must be visible**: no option for "automatic mutual acceptance / automatic connection / automatic messaging" may be offered, and it must be stated that this is *forbidden* rather than not yet built. Density: a dense form.

**② Wireframe**

```text
Matching policy › PR-002
┌───────────────────────────────────────────────────────────────┐
│ Purpose*          [___________________________]                │
│ Attributes allowed for matching  ☑ stated interests  ☑ language  ☐ city │
│ Attributes forbidden for matching (not editable; an institutional prohibition) │
│   ✗ health status  ✗ cognitive assessment results  ✗ message content  ✗ life-story content │
│   ✗ any inferred attribute that has not been disclosed to the participant │
│   ⓘ These are not "not supported yet". They are forbidden.     │
│ Match explanation rule* [must explain in words the participant can read why they were suggested ▾] │
│ Candidate limit [3/week]   Candidate validity [14 days]        │
│ Match decision values  Interested / Not for now / Ignore (withdrawable: yes) │
│   ⓘ "Not for now" and "Interested" carry equal weight in the participant's interface and must not be nudged. │
│ Fairness review    [every 30 days ▾]   Last review: not carried out │
│ Blocking behaviour  once blocked, neither appears to the other, and the existence of the block is never disclosed │
│ Source of mutual acceptance  only an explicit two-way action by the participants themselves │
│ Mutual acceptance validity [30 days]  Lapses on: consent withdrawn / a block / expiry │
│ Connection activation  single use; one mutual acceptance can activate only one connection │
│ Communication basis [in-platform messages ▾]                   │
│ Connection requests [disabled] (this phase)                    │
│ Staged rollout     [stage 1: generate candidates only, messaging not enabled ▾] │
├───────────────────────────────────────────────────────────────┤
│ Institutional prohibitions (this interface never offers these) │
│  ✗ automatically produced mutual acceptance   ✗ automatically established connections   ✗ automatically sent messages │
│                                        [Save draft] [Submit for approval] │
└───────────────────────────────────────────────────────────────┘
```

**③ State matrix**

| State | Presentation |
|---|---|
| Loading | The prohibitions block **renders first** (it is static and needs no network) — so "forbidden" is visible in every loading state |
| Empty queue | No policy history: `There is no matching policy yet. Until a policy is approved, matching produces no candidates at all.` |
| Error | A failed save: an ordinary recoverable error; **the prohibitions are unaffected by any error state** |
| Insufficient permission | Read-only + `You can view the matching policy but cannot change it (it needs Researcher).` |
| MFA required | Submitting does not; approval goes through the protocol/approval chain (MFA). At the top: `No action on this screen requires strong authentication; the policy is approved as part of protocol approval (which requires MFA).` |

**④ Confirmation copy**: `Submit the matching policy? A policy takes effect only once approved. The current phase is set to "stage 1: generate candidates only, messaging not enabled" — no participant will receive a message as a result of this.`

**⑤ Accessibility**: the forbidden-attribute list is a `<ul>` with the word `forbidden` (the `✗` carries `aria-hidden`); the "institutional prohibitions" block is `role="note"`; each prohibition is a complete sentence, readable one by one by a screen reader.

---

### C11 合成人物画像与情景设置（§72）

**① Purpose and density**: create synthetic personas and scenarios, and **remind the reader at every step that these are not real people**. Density: a dense table (the persona list) + a standard form (scenarios).

**② Wireframe**

```text
Synthetic personas
┌───────────────────────────────────────────────────────────────────────┐
│ ⓘ Every "participant" here is a synthetic persona. They are not real  │
│   people, they cannot be contacted, and no data they produce is        │
│   empirical evidence.                                                 │
├───────────────────────────────────────────────────────────────────────┤
│ Study code │ Scenario family │ Capability profile │ Seed │ State │ Action │
│ SP-001     │ loneliness-high │ screen reader      │ seed:42 │ active │ [View] │
│ SP-002     │ life-story-low  │ large text + simplified │ seed:43 │ draft │ [View] │
│ ⓘ The generation seed and the scenario definition are part of reproducibility (Doc 19 §39) and cannot be changed afterwards. │
├───────────────────────────────────────────────────────────────────────┤
│ Scenario family  loneliness-high                                      │
│  Description* [__________]  invite→screen→eligibility→consent→enrol→pathway→activate (simulated) │
│  ⓘ An eligibility decision must be made by a person. AI may assemble the material; it cannot make the eligibility decision. │
│                                            [Create a persona] [Generate in bulk…] │
└───────────────────────────────────────────────────────────────────────┘
```

**③ State matrix**

| State | Presentation |
|---|---|
| Loading | A table skeleton |
| Empty queue | `There are no synthetic personas yet. Synthetic personas are for validating the prototype and are not a substitute for research with real participants. [Create the first persona]` |
| Error | A partial failure in bulk generation → `PARTIAL_RESULT`: `8 were generated and 3 failed. The reason for each failure is listed below — none was skipped silently.` |
| Insufficient permission | `Your role cannot create synthetic personas (it needs Researcher).` |
| MFA required | No MFA actions |

**④ Confirmation copy**: `Generate 20 synthetic personas in bulk (scenario family "loneliness-high", seeds 42–61)? These are synthetic personas, not real people. Once generated, the seeds and the scenario definition cannot be changed.`

**⑤ Accessibility**: the table follows 1.9; the "synthetic" notice sits at the start of `<main>` and is carried by the first `role="note"` after the `<h1>`, so a screen reader reaches it first.

---

### C12 参与者列表与详情（研究者视角，§73–74）— 已有局部实现（入组队列）

**① Purpose and density**: a high-density list keyed on the **pseudonymous study code** + detail partitioned by permission. **Private social content and reporter identities are excluded** (a hard requirement of §73). Density: a dense table.

**② Wireframe**

```text
Participants (researcher's view)        Project [RP-001 ▾]  [Choose columns] [Save view]
┌────────┬──────────┬──────────┬────────┬──────────┬────────────┬────────┬────────────┐
│Study code│Enrolment│Consent   │Pathway │Exposure  │Assessments due│Safety│Last activity│
├────────┼──────────┼──────────┼────────┼──────────┼────────────┼────────┼────────────┤
│SP-001  │Active    │Valid     │Standard│Completed │1 due       │—       │2 days ago  │
│SP-002  │Awaiting activation│Partly withdrawn│Standard│Provided│1 overdue│⚠ open│6 hours ago│
│SP-003  │Withdrawn │Withdrawn │—       │—         │—           │—       │11 days ago │
└────────┴──────────┴──────────┴────────┴──────────┴────────────┴────────┴────────────┘
ⓘ Private messages, life-story content and reporter identities are not shown here.

Participant SP-002 (pseudonymous)
┌ Overview │ Consent │ Enrolment │ Intervention │ Assessments │ Observations │ Safety │ Data quality │ Audit ┐
│ Life story · messages · match detail · moderation evidence: not authorised (not shown) │
├───────────────────────────────────────────────────────────────────┤
│ Consent (model)                                                   │
│  study-participation  valid   granted 2026-07-02                  │
│  community-participation  withdrawn  withdrawn 2026-07-30         │
│  ⓘ A withdrawal affects what data may be used in analysis; datasets already locked are not rewritten. │
│ Your purpose of access* [research-operations ▾]  ⓘ The purpose is written to the audit trail. │
└───────────────────────────────────────────────────────────────────┘
```

**③ State matrix**

| State | Presentation |
|---|---|
| Loading | A table skeleton preserving the column widths |
| Empty queue | No results under the filter: `There are no participants under the current filter. [Clear the filter]`; a project with genuinely none: `This project has no participants yet. Participants arrive through the enrolment process. [Go to enrolment coordination]` |
| Error | `PURPOSE_NOT_PERMITTED`: `The purpose of access you selected does not permit viewing this data. Select the correct purpose, or state why it is needed.` |
| Insufficient permission | An unauthorised tab **remains visible but disabled**, marked `not authorised (content not shown)` — the existence of the tab is not itself sensitive; **objects under protected existence** (such as a blocked relationship) take the shared `RESOURCE_NOT_FOUND` copy and never disclose that they exist |
| MFA required | No MFA actions (viewing does not require MFA; exports go through C17) |

**④ Confirmation copy**: changing the purpose of access: `Change the purpose of access to "safety review"? This visit is written to the audit trail under that purpose. Choose it only when it genuinely is a safety review.`

**⑤ Accessibility**: the study-code column is a `<th scope="row">`; the safety column's `⚠ open` is written as `has an open safety signal`; the tab group uses `role="tablist"` + `aria-selected` + `aria-controls`, and a disabled tab uses `aria-disabled="true"` while remaining in the tab order (so a screen-reader user knows the sections exist and knows they lack permission).

---

### C13 干预与评估监测（§75–77）

**① Purpose and density**: distinguish the ten intervention delivery states from the eight assessment states, and **never infer completion from "assigned"** (a hard requirement of §75). Density: a dense matrix table + charts (which must carry all of §253's metadata).

**② Wireframe**

```text
Monitoring › intervention delivery                  Period [last 4 weeks ▾]
┌──────────┬────────┬────────┬──────┬───────┬───────┬─────────┬──────┬────────┬──────┬────────────┐
│ Activity │Assigned│Provided│Viewed│Started│Partial│Completed│Skipped│Declined│Failed│Interrupted │
├──────────┼────────┼────────┼──────┼───────┼───────┼─────────┼──────┼────────┼──────┼────────────┤
│ Life story│ 24    │ 22     │ 18   │ 14    │  3    │  9      │  4   │  2     │  1   │  1         │
│ Community activity│ 24 │ 20 │ 15   │ 11    │  2    │  8      │  3   │  1     │  1   │  0         │
└──────────┴────────┴────────┴──────┴───────┴───────┴─────────┴──────┴────────┴──────┴────────────┘
ⓘ "Completed" comes only from an explicit completion event and is never inferred from "assigned".
ⓘ [synthetic data] This is operational monitoring, not a research result. It must not be used as evidence of effect.

Monitoring › assessments
┌──────────┬─────────┬────┬───────┬──────┬─────────┬────────┬────────┬───────┐
│ Assessment│Scheduled│Due │Started│Paused│Completed│Declined│Voided  │Overdue│
│ Baseline  │ 24      │ 0  │ 24    │ 0    │ 22      │ 1      │ 1      │ 0     │
│ Follow-up 4 weeks│ 24│ 5 │ 12    │ 2    │ 10      │ 0      │ 0      │ 2     │
└──────────┴─────────┴────┴───────┴──────┴─────────┴────────┴────────┴───────┘
Reasons for missingness (shown where permission allows): declined 1 · technical failure 1 · unknown 3
ⓘ "Unknown" means unknown. It is not filled in and it is not inferred.

Safety (minimum necessary)
 Open safety signals 2 · currently suspended 1 · needing follow-up 1 · effect on this project: enrolment suspended
 ⓘ Detailed safety review happens in the safety workspace, not here.
```

**③ State matrix**

| State | Presentation |
|---|---|
| Loading | A matrix skeleton with the column headers rendered first (the state names are a fixed vocabulary) |
| Empty queue | `There are no delivery records in the selected period.` + `That does not mean nothing happened — check the period and the filters.` |
| Error | A partial aggregation failure: `1 measure could not be computed (<code>). That cell shows "not computed" rather than 0.` — **0 must never stand in for a failure** |
| Insufficient permission | The missingness-reason column shows `Reasons for missingness are not visible to your role.` to roles without permission; the safety block shows counts only |
| MFA required | No MFA actions |

**④ Key interactions**: no high-impact actions (this is read-only monitoring). It can drill down to the C12 participant detail; the drill-down link's accessible name contains the study code.

**⑤ Accessibility**: each column header in the matrix is a `<th scope="col">` carrying the full state name (never abbreviated); numeric cells have an `aria-label` of the form `Life story, completed, 9 people`; charts (where used) must provide a `<table>` data alternative (§253) carrying the title, units, denominator, time range, source and uncertainty; `not computed` is words, never a blank.

---

### C14 Dataset definition → variables → generation → quality review → lock (§78–83) — partially implemented (the lockable queue + locking)

**① Purpose and density**: a five-stage pipeline; **locking is one of the strongest human-authority actions in this workspace (human + MFA + irreversible)**. Density: dense (the variable table, the quality-problem table) + standard (the lock confirmation).

**Implementation status (2026-08-04): the whole chain is now reachable.** Previously **only the last step, locking, had an interface** — writing a definition, approving it, generating a version and completing the quality review could none of them be carried out from any screen, so the lockable queue **could never be filled through the product**: a decision screen whose queue cannot be filled has never been used by anyone. There is now a "Datasets" block on the researcher's side (write a definition / generate a version / record that the quality review is complete, with `listDatasetWork` gated on `dataset.define` — if you can do the work you can see how far it has got), and a new "dataset definitions" decision screen on the approver's side (`listDefinitionsAwaitingApproval`). Three points of wording: the variable dictionary is "what goes in", **message bodies are excluded by default and what is not listed is not included** (ADR-034), and the approval confirmation puts that sentence beside the control; **a drafter cannot approve their own definition** (enforced both by the command and by a database CHECK), stated in the row before the button rather than raised as an error after submission; and "record that the quality review is complete" is **a person's record of their own action**, is not called "approve", and says plainly that it is not locking. **Approving a definition is not at the MFA tier** (`dataset.approve-definition` requires confirmation only; locking is what requires MFA) — the screen does not falsely claim strong authentication is needed, because overstating an action's cost is its own kind of dishonesty and teaches people to ignore the notices that are real.

**② 线框（锁定确认屏为重点）**

```text
Datasets › DD-003 › variable construction
┌────────────┬──────────┬───────────┬──────┬──────────┬─────────┬──────────┬──────────┐
│ Variable   │ Source   │ Source ver│ Type │ Derivation│Missing  │Sensitivity│ Consent  │
├────────────┼──────────┼───────────┼──────┼──────────┼─────────┼──────────┼──────────┤
│ ucla_total │ Assessment M08 │ v2  │Numeric│ Sum      │per item │ Medium   │ study participation │
│ msg_count  │ Messages M07   │ v3  │Count │ Metadata │none     │ High     │ messaging │
│ ⚠ Private content is excluded by default: message bodies and life-story bodies are not among the selectable sources. │
│ Reason for inclusion* (required for every variable)                    │
└───────────────────────────────────────────────────────────────────────┘

Datasets › dv_9 › lock confirmation
┌───────────────────────────────────────────────────────────────────────┐
│ ⓘ Strong-authentication actions on this screen: lock a dataset version (requires MFA). You are currently at the MFA tier. │
├─ What you are locking ────────────────────────────────────────────────┤
│ DatasetVersion  dv_9   Version v1   Definition DD-003 (approved, v2)  │
│ Manifest hash sha256:aa71c3e0d9f4b21… [full][copy]                     │
├─ Review checklist (every item must be confirmed explicitly) ──────────┤
│ ☑ Lineage complete: 3 sources, all versions pinned      [View lineage] │
│ ☑ Withdrawals and consent handled: 2 participants withdrew, and their data is excluded per the rules │
│ ☑ Quality and de-identification: pseudonymised; 0 unresolved problems (0 blocking) │
│ ☑ Message and social variable boundaries: metadata only, no bodies [View boundaries] │
│ ☑ Manifest and checksums reviewed                                      │
│ ☑ A compatible analysis plan: AP-002 (approved)                        │
│ Data cut-off  2026-08-01 23:59 CST                                     │
│ Rows / entities  1,248 rows · 24 entities (within the range safe to display) │
│ Restrictions  for RP-001 only; not to be redistributed                 │
├───────────────────────────────────────────────────────────────────────┤
│ Once locked this version cannot be changed, and analysis can only run against a locked version. Locking cannot be undone. │
│                                   [Lock this dataset version (requires MFA)] │
├─ Lock progress (after submitting) ────────────────────────────────────┤
│ ① Reviewed  ② Confirmation submitted  ③ Lock command processing…  ④ Locked / command failed │
│ ⓘ This never shows "locked" until the module that owns the domain has confirmed it. │
└───────────────────────────────────────────────────────────────────────┘
```

**③ 状态矩阵**

| State | Presentation |
|---|---|
| Loading | The checklist items load one by one, and **an item that has not finished loading is never shown as ticked**; the lock button is disabled until every item has arrived |
| Empty queue | An empty lockable queue: `There are no dataset versions available to lock. A dataset version has to complete its quality review first.` |
| Error | `DATASET_LOCK_NOT_READY`: lists the unmet items, each linked; `LINEAGE_INCOMPLETE`: `The lineage is incomplete and this cannot be locked. Missing: the version of the source "Assessment M08" is not pinned.`; **a command failure** shows as progress ③ → "command failed", and **"locked" is never displayed** |
| Insufficient permission | Without `dataset.lock`: the full checklist is shown read-only + `You can view the checklist but cannot lock it (it needs ResearchApprover).` |
| MFA required | At the password tier: the lock button is disabled + `Locking a dataset version requires strong authentication (MFA). You are at the password tier; sign in again with MFA and come back.` |

**④ Confirmation copy (in full)**

```
Lock DatasetVersion dv_9 (version v1)?
Manifest hash: sha256:aa71c3e0d9f4b218c7e5309fbb4d1a62 (the full value)
Data cut-off: 2026-08-01 23:59 CST; 1,248 rows; 24 entities.
Once locked, this version cannot be changed and cannot be deleted. Analysis from now on can only run against this locked version.
If a participant withdraws consent later, this locked dataset is not rewritten — the withdrawal appears in subsequent versions.
This lock is signed in the name of approver_wu and written to the audit trail.
This action requires strong authentication (MFA). Locking cannot be undone.
```
Buttons: `Lock this dataset version` / `Go back and review`

**⑤ Accessibility**: the checklist is a `<ul>` with each `✔/✘` paired with words (`met`/`not met`); the four progress stages are an `<ol>` + `aria-current="step"`, with changes announced through `role="status"` (`The lock command has been submitted and is processing.` → `Locked.`); the hash inside the confirmation dialog is complete and allowed to wrap; the variable table follows 1.9.

---

### C15 分析计划 / 运行 / 解释记录（§84–87）

**Implementation status (2026-08-04): partially implemented.** The chain of write a plan → have somebody else approve it → record a run → write an interpretation → have somebody else approve it is now reachable; previously **every step had a command and not one had an interface**, and each stage referred to the others by identifier alone, so the chain could not even be *looked at*, let alone walked. Two points of wording: (1) **"record a run" is not "execute an analysis"** — the platform has no compute engine, and what is stored is a person's record that an analysis was run against this version of the data and what it produced; labelling the button "run analysis" would claim the platform did the thing. (2) **It can only run against a locked dataset version** (the server returns `DATASET_LOCK_NOT_READY`), so the selector lists only locked ones and explains why, rather than letting somebody choose and then refusing them; each run displays the manifest hash of the version it ran against — which is the whole point of locking before analysing: an interpretation is about one run, and a run is about that one body of data.

**① Purpose and density**: separate "plan → run → output → interpretation" into four layers that cannot be confused with one another. Density: dense (the run list) + standard (interpretation editing). **This is where the epistemic ladder is enforced (see 1.3).**

**② 线框**

```text
Analysis › run ar_12
┌───────────────────────────────────────────────────────────────────────┐
│ Analysis plan AP-002 (approved v1)  Locked dataset dv_9 sha256:aa71…  │
│ Code version git:9f2c1ab  Environment env:py3.11-2026-07  Parameters seed=42, alpha=.05│
│ Status completed (with warnings)  Started 11:02  Finished 11:04       │
│ 2 warnings: ① subgroup n=3 is too small ② 12% missingness exceeds the planned threshold of 10% │
├─ Analysis output (a machine-computed result, uninterpreted) ──────────┤
│ ```                                                                   │
│ ucla_total  baseline mean 44.2 (sd 8.1)  n=22                         │
│ ucla_total  wk4      mean 41.8 (sd 8.6)  n=20                         │
│ diff -2.4  95% CI [-6.1, 1.3]                                         │
│ ```                                                                   │
│ ◌ Simulated observation · [synthetic data] a computation over synthetic data, not empirical evidence. │
├─ Interpretation record (written by a person; not the data itself) ────┤
│ ▌ researcher_lin's interpretation (draft)                             │
│ ▌ Related research question RQ-001 · outputs used: the two rows above │
│ ▌ Interpretation* [_____________________________________________]     │
│ ▌ Alternative interpretation* (at least one) [____________________]   │
│ ▌ Missingness* [12% missing; 3 cases of unknown cause not imputed]    │
│ ▌ Pathway differences / accessibility / fairness / moderation / safety / AI: [each _______] │
│ ▌ Limitations* [__________]  Uncertainty* [__________]                │
│ ▌ Epistemic tag* [◌ simulated observation ▾]                          │
│ ▌ ⓘ A result from synthetic data can never be written as "the intervention works". │
│                              [Save draft] [Submit for human review]   │
└───────────────────────────────────────────────────────────────────────┘
```

**③ State matrix**

| State | Presentation |
|---|---|
| Loading | Polling the run's status: `queued → running → …`, announced once per change through `role="status"`; a skeleton for the output area |
| Empty queue | No approved plans: `There are no approved analysis plans yet. An analysis can only run against an approved plan and a locked dataset.`; no runs: `There are no analysis runs yet.` |
| Error | `failed`: shows the failure diagnostics and a way into the logs, `This run failed and produced no output. The failure itself is recorded and is not hidden.`; `cancelled` and `superseded` each have their own copy (never merged into "failed") |
| Insufficient permission | Without `analysis.run`: read-only; without `interpretation.approve`: an interpretation can be written but not approved, and the button notes `Approving an interpretation needs ResearchApprover.` |
| MFA required | Neither running an analysis nor approving an interpretation requires MFA (`interpretation.approve` needs confirmation only). At the top: `No action on this screen requires strong authentication.` (Mislabelling this is **forbidden**) |

**④ Confirmation copy**

- Running: `Run analysis plan AP-002? It will run against locked dataset dv_9 (sha256:aa71…), code version git:9f2c1ab, parameters seed=42. The run record cannot be deleted.`
- Submitting an interpretation for review: `Submit this interpretation record? It will be marked "simulated observation" and will always carry the [synthetic data] marking. Submitting records you as its author.`
- Approving an interpretation: `Approve this interpretation record? What is being approved is the interpretation itself, not the conclusion about the data it rests on.`

**⑤ Accessibility**: the output area uses `<pre><code>` with the container as `tabindex="0" role="region" aria-label="Analysis output"` (so it can be scrolled by keyboard); the interpretation area uses `<blockquote>` + `<cite>`; the three layers (output/interpretation/finding) each have their own `<h3>`, and the heading text itself states the difference in layer (`Analysis output (a machine-computed result)`).

---

### C16 研究发现与干预决定（§88–90）

**Implementation status (2026-08-04): partially implemented.** A research finding can be written from an **approved interpretation** and approved by somebody else; the approval screen lists the interpretation and run identifier the finding rests on beside the control, the drafter cannot approve their own finding (command + database CHECK), and the row says so before the button. **The strong-authentication notice appears only in the findings section**: of the three approvals, only `finding.approve` is at the MFA tier, and repeating the notice on plans and interpretations would overstate their cost and teach people to skip past the one that is real. **Runs do not enter an approval queue**: nobody "approves" a run — it either happened or it did not, and putting it in a decision queue would imply a judgement nobody is asking for. **Not implemented**: intervention decisions (§90's InterventionDecision).

**① Purpose and density**: produce a `ResearchFinding` (carrying two independent dimensions: the **theoretical finding type** and the **approval state**) and an `InterventionDecision` (one of eight). Density: standard. **An AI draft is always a draft.**

**② 线框**

```text
Findings › RF-006
┌───────────────────────────────────────────────────────────────────────┐
│ Research question RQ-001 (exact version v2)                           │
├─ The exact version chain (all of it, or it cannot be submitted) ──────┤
│ Protocol version PR-002 v3 sha256:9b1c… │ Intervention version IV-004 v3 sha256:31d0… │
│ AI configuration aicfg_v0 sha256:c440…  │ Dataset lock dv_9 sha256:aa71… │
│ Analysis run ar_12 git:9f2c1ab          │ Interpretation record IR-008 (approved) │
├─ The finding ─────────────────────────────────────────────────────────┤
│ Finding type* (theoretical)  [underdetermined ▾]                       │
│ Approval state (an independent dimension)  in review                   │
│ ⓘ These are different things: one says what state this conclusion is in │
│   theoretically, the other says who approved recording it.             │
│ Assertion* [Under synthetic scenarios, the relationship between a digital │
│   reminiscence intervention and change on the loneliness scale cannot be determined.] │
│ Uncertainty* [The sample is synthetic; the interval spans the null value.] │
│ Limitations* [The corpus is limited in size; subgroup n=3; 12% missingness.] │
│ Epistemic tag* [◌ simulated observation]  [synthetic data]             │
│ ┌ 🤖 AI draft (not adopted; always a draft) ────────────────────┐     │
│ │ "The results suggest the intervention may be beneficial…"      │     │
│ │ ⚠ This wording breaks the discipline: a synthetic result cannot │     │
│ │   be written as beneficial. [Edit then adopt] [Discard]        │     │
│ └────────────────────────────────────────────────────────────────┘     │
│                            [Save draft] [Submit for approval (requires MFA)] │
└───────────────────────────────────────────────────────────────────────┘

Intervention decision › based on RF-006
 ( ) Retain   ( ) Revise   ( ) Restrict   ( ) Replicate
 ( ) Expand   ( ) Suspend  ( ) Retire     (•) Continue exploratory research
 Basis (carried in automatically, showing exact versions): evidence ES-011 / protocol PR-002 v3 /
 intervention IV-004 v3 / dataset dv_9 / analysis ar_12 / finding RF-006
 ⓘ All data in the current phase is synthetic, so decisions such as "expand" or "retain" require an additional stated reason.
```

**③ 状态矩阵**

| State | Presentation |
|---|---|
| Loading | A skeleton for the version-chain block; until the chain has arrived the submit button is disabled (`The version chain has not finished loading, so this cannot be submitted yet.`) |
| Empty queue | No approved interpretations: `There are no approved interpretation records yet. A finding must rest on an approved interpretation.` |
| Error | A missing element of the version chain → `LINEAGE_INCOMPLETE`: lists exactly what is missing; `AUTHORISATION_DENIED` (self-approval) is intercepted earlier, at the queue |
| Insufficient permission | `finding.draft` = Researcher; `finding.approve` = ResearchApprover. A researcher sees the approve button disabled + `Approval is carried out by a ResearchApprover with strong authentication (MFA); you cannot approve a finding you drafted.` |
| MFA required | Drafting does not; **approval does**. At the top: `Strong-authentication actions on this screen: approve a research finding (requires MFA).` |

**④ Confirmation copy (approval, in full)**

```
Approve research finding RF-006?
Finding type (theoretical): underdetermined
Assertion: Under synthetic scenarios, the relationship between a digital reminiscence intervention and change on the loneliness scale cannot be determined.
The exact versions it rests on: protocol PR-002 v3 (sha256:9b1c…), intervention IV-004 v3, AI configuration aicfg_v0,
dataset lock dv_9 (sha256:aa71…), analysis run ar_12 (git:9f2c1ab), interpretation IR-008.
This finding comes from synthetic data, will always carry the [synthetic data] marking, and cannot be cited as empirical evidence.
This approval is signed in the name of approver_wu and written to the audit trail.
This action requires strong authentication (MFA).
```
Buttons: `Confirm and approve this finding` / `Go back and review`

**⑤ Accessibility**: the finding type and the approval state are two separate `<dl>` items whose label text distinguishes them explicitly; the AI draft area is `role="region" aria-label="AI draft, not adopted"`, and a discipline breach is flagged with `role="alert"` (it is the result of live validation); the eight intervention decisions are a radio group with nothing pre-selected.

---

### C17 报告与受控导出（§91）— 已有局部实现（导出审批队列）

**① Purpose and density**: report versions + the full controlled-export chain: request → approve (MFA) → generate → deliver → receipt → expiry. **"Generated" is not "delivered"** (a hard requirement of §91). Density: standard + a dense queue table.

**Implementation status (2026-08-04)**: **the reports side** (open a report / write a version / have somebody else approve it) is implemented — the "reports" in this section's title previously had no interface at all, only the export half had a screen, and so the report-version approval queue never had anything in it to approve. Approval fixes that version: a database trigger refuses any change to the content of an approved version, and a correction can only be a new version; the drafter cannot approve their own version (command + database CHECK), stated in the row before the button; and `report.approve` requires confirmation only and is **not at the MFA tier**, so the screen does not falsely claim strong authentication is needed. On the export side: requesting, approving (MFA + separation of duties), and **generating, recording delivery and recording receipt** are implemented (the "exports waiting to be carried out" block in the researcher workspace, with `listExportsToCarryOut` gated on `export.generate` — if you can do the work you can see the work). Previously **approval was the end of the line**: no query listed approved requests, the package would never be generated, and delivery would never be recorded; somebody asking for a copy of their own information would be told honestly that it had been agreed and then hear nothing further — not because anyone refused, but because no interface could take the next step. The three states' wording holds §91: `Approved` says "no package has been generated yet", `Generated` says "the package exists and has been given to nobody", and `Delivered` says "recorded as delivered; the recipient has not confirmed". **"Record that I have delivered it" is a person's record of their own action, not an action by the platform** — the platform sends nothing, which is why the button is not called "deliver". Once received (`Received`) it leaves the queue: leaving finished work in a to-do list is how a to-do list stops being read. **Expiry is not implemented** (no command or field carries the expiry of an export).

**② 线框**

```text
Exports › new request
┌───────────────────────────────────────────────────────────────┐
│ Report type* [dataset for statistical review ▾]  Audience* [external statistical partner ▾] │
│ Purpose*   [_____________________________________]             │
│ Recipient* [_____________________________________]             │
│ Exact sources* [dv_9 (locked, sha256:aa71…)] [+ Add a source]  │
│ De-identification*  ( ) pseudonymised   ( ) anonymised         │
│ ⓘ A research export has no "identifiable" option — the platform does not generate identifiable research exports. │
│ Restrictions [for the agreed purpose only; not to be redistributed]  Valid for [30 days] │
│ ⓘ The export carries the [synthetic data] marking; what the recipient sees is synthetic data. │
│                                            [Submit the export request] │
└───────────────────────────────────────────────────────────────┘

Exports › ex_5 › status (an honest state machine)
 ① Requested → ② Approved (approver_wu, MFA, 08-03 12:10)
 → ③ Generated (12:12, manifest sha256:5e90…) → ④ Handed to the provider (12:13)
 → ⑤ Receipt: not confirmed
 ⓘ "Generated" is not "delivered"; "handed to the provider" is not "the recipient received it".
```

**③ 状态矩阵**

| State | Presentation |
|---|---|
| Loading | A queue skeleton; the source dropdown is disabled until the list of locked versions has arrived |
| Empty queue | No exports awaiting approval: `There are no export requests awaiting a decision.`; no sources available: `There are no exportable sources. An export can only cite a locked dataset version or an approved report version.` |
| Error | `EXPORT_REQUIRES_APPROVAL`: `An export must be approved first. [Submit an approval request]`; `DEIDENTIFICATION_REQUIRED`: names which source does not meet it; a failed delivery: `Delivery failed — the recipient did not receive it. This is not "they may have received it". [See why it failed]` |
| Insufficient permission | Requesting needs `export.request` (Researcher); approving needs `export.approve` (ResearchApprover). A researcher sees their own request in the queue with the decision button disabled + `You requested this, so you cannot approve it.` |
| MFA required | Requesting does not; **approving does**. At the top: `Strong-authentication actions on this screen: approve an export (requires MFA).` |

**④ Confirmation copy (approval, in full)**

```
Approve export request ex_5?
Recipient: stats-partner (external)
Purpose: external statistical review
Source: dv_9 (locked, sha256:aa71c3e0d9f4b218…)
De-identification: pseudonymised
Valid for: 30 days; restrictions: for the agreed purpose only, not to be redistributed
After approval the data leaves the platform's boundary. This approval is signed in your name and written to the audit trail.
The export is marked [synthetic data].
This action requires strong authentication (MFA).
```
Buttons: `Confirm and approve this export` / `Reject` opens its own dialog (one thing confirmed at a time) / `Go back`

**⑤ Accessibility**: the state machine is an `<ol>` with each step carrying the words `done / in progress / not started`; `Receipt: not confirmed` must be words (never a grey dot); the de-identification radios pre-select nothing; approve and reject are two separate buttons, and each one's confirmation dialog confirms one thing only.

---

## 3. G. 管理工作区（G1–G7）

> **The global boundary (a permanent `role="note"` at the top of every screen, not dismissible)**:
> `The administration workspace governs running and access only: accounts, roles, integrations, jobs, flags and audit. It grants no research, moderation or safety authority — research conclusions, moderation decisions and safety dispositions are neither made here nor shown here.`

### G1 管理仪表盘与系统状态（§41）

**① Purpose and density**: an overview of operational health. **Research findings and moderation decisions are not administrative KPIs** (a hard requirement of §41) — so "number of findings", "moderation throughput" and "number of participants" **must not appear** on this dashboard. Density: a dense card grid.

**② Wireframe**

```text
Administration workspace › dashboard
┌───────────────────────────────────────────────────────────────────────┐
│ ⓘ The administration workspace governs running and access only… (the boundary banner, above) │
├───────────────────────────────────────────────────────────────────────┤
│ ┌ Service health ──────┐ ┌ Jobs and dead letters ┐ ┌ Integrations ───┐ │
│ │ API ok  worker ok    │ │ Failed jobs 3         │ │ Knowledge MCP ok │ │
│ │ Scheduler ok         │ │ Dead letters 1 (oldest 2h) │ │ Email provider simulated │ │
│ │ Database ok          │ │ [Open the job queue]  │ │ Object storage ok │ │
│ └──────────────────────┘ └───────────────────────┘ └─────────────────┘ │
│ ┌ Security alerts ─────┐ ┌ Backups ──────────────┐ ┌ Deletion propagation ┐ │
│ │ Break-glass access 0 (24h) │ │ Last success 06:00 │ │ Awaiting propagation 1 (a withdrawal) │ │
│ │ Authentication failure rate normal │ │ Restore rehearsal not carried out ⚠ │ │ Overdue and unfinished 0 │ │
│ └──────────────────────┘ └───────────────────────┘ └─────────────────┘ │
│ ┌ Feature flags ───────┐ ┌ Support issues ───────┐                     │
│ │ Enabled 4 of 11      │ │ Awaiting attention 2  │                     │
│ │ Safety-related flags 0 │ │                     │                     │
│ └──────────────────────┘ └───────────────────────┘                     │
│ ⓘ Research findings, moderation decisions and participant content are not shown here. │
└───────────────────────────────────────────────────────────────────────┘
```

**③ State matrix**

| State | Presentation |
|---|---|
| Loading | A skeleton per card |
| Empty queue | `No failed jobs.` `No support issues awaiting attention.` |
| Error | **A failed health probe must be explicit**: `The health of this item cannot be determined (<code>). Do not treat it as "ok". [Try again]` |
| Insufficient permission | Anyone who is not SystemAdministrator/OrganisationAdministrator: the whole screen is replaced with `Your role cannot access the administration workspace.` |
| MFA required | The dashboard is read-only and has no MFA actions; links to G3/G4/G6/G7 carry `(changes there require strong authentication)` in the link text |

**④ Key interactions**: no high-impact actions. Bulk buttons such as "re-run all failed jobs" on the dashboard are **forbidden** (one meaningful decision at a time).

**⑤ Accessibility**: each card is a `<section aria-labelledby>`; health status is words (`ok`/`cannot be determined`/`faulty`) + an icon, never a plain coloured dot; `role="status"` announces one summary after a refresh.

---

### G2 用户与组织（§21）

**① Purpose and density**: operational management of accounts and organisations. **A participant's research content must not be displayed.** Density: a dense table.

**② Wireframe**

```text
Administration › users                Organisation [all ▾] [Choose columns] [Save view]
┌───────────────┬──────────────┬──────────┬───────┬─────────┬──────────────┐
│ Account id    │ Display name │ Organisation │ Roles │ State │ Action       │
├───────────────┼──────────────┼──────────┼───────┼─────────┼──────────────┤
│ researcher_lin│ Lin (researcher) │ ORG-01 │ 1     │ Active  │ [View lin]   │
│ approver_wu   │ Wu (approver)    │ ORG-01 │ 1     │ Active  │ [View wu]    │
│ SP-002        │ (participant)    │ ORG-01 │ 1     │ Active  │ [View SP-002]│
└───────────────┴──────────────┴──────────┴───────┴─────────┴──────────────┘
ⓘ A participant account shows only account facts here (active/suspended, roles, organisation).
  Consent, life stories, messages, matches and report content are never visible in the administration workspace.
```

**③ State matrix**

| State | Presentation |
|---|---|
| Loading | A table skeleton |
| Empty queue | `This organisation has no users yet. [Invite a user]` |
| Error | The usual; `RESOURCE_NOT_FOUND` takes the shared protected-existence copy |
| Insufficient permission | Without `user.view`: `Your role cannot view the user list.` |
| MFA required | Viewing and inviting do not require MFA; **role changes are in G3** (confirmation only, not MFA — mislabelling this is forbidden). At the top: `No action on this screen requires strong authentication.` |

**④ Confirmation copy**: inviting a user: `Send an invitation to <email>? The invitation creates an account awaiting activation and grants no roles. Roles are assigned separately.` (**no role by default** — least privilege)

**⑤ Accessibility**: the account-id column is a `<th scope="row">`; action button names contain the identifier (`View researcher_lin`); the "content not visible" note for participant rows is inside the table's `<caption>`, not only in the footer.

---

### G3 Roles and service accounts (§21)

**① Purpose and density**: assigning and revoking roles, and managing service accounts. **This is the entrance to permission and must be the most conservative screen there is.** Density: standard (it is a decision screen).

**② Wireframe**

```text
Administration › user researcher_lin › roles
┌───────────────────────────────────────────────────────────────┐
│ Current roles  Researcher (since 2026-07-01, assigned by org_admin_chen) │
├─ Assign a new role ───────────────────────────────────────────┤
│ Role* [ResearchApprover ▾]                                     │
│ ⓘ What this role can do (told to you before you assign it):    │
│   • approve protocol versions, projects and intervention versions (requires strong authentication, MFA) │
│   • approve analysis plans, interpretations and research findings (approving a finding requires MFA) │
│   • lock dataset versions (requires MFA, irreversible)         │
│   • approve exports (requires MFA; the data leaves the platform's boundary) │
│ ⚠ Separation-of-duties note: researcher_lin is currently a Researcher and │
│   drafts and submits protocols. Holding ResearchApprover as well will not │
│   let them approve what they submitted themselves (the system refuses), │
│   but it will let them approve what colleagues submit.          │
│ Reason* [_____________________________]                        │
│                                             [Assign this role] │
├─ Service accounts ────────────────────────────────────────────┤
│ svc_kg_reader  Permission: evidence.search  Last used 11:02  [View] │
│ ⓘ A service account cannot hold approval permissions.          │
└───────────────────────────────────────────────────────────────┘
```

**③ State matrix**

| State | Presentation |
|---|---|
| Loading | The list of a role's capabilities is a static vocabulary and **renders first** (so "explain before asking" holds in every loading state) |
| Empty queue | `This account holds no roles. An account with no roles cannot carry out any action.` |
| Error | Revoking the last administrator → `INVALID_STATE_TRANSITION`: `The last organisation administrator's role cannot be revoked. Assign another first.` |
| Insufficient permission | Without `role.assign`: read-only + `Your role cannot assign roles (it needs OrganisationAdministrator or SystemAdministrator).` |
| MFA required | `role.assign`/`role.revoke` **require confirmation only, not MFA**; `system.configure` (rotating a service account's key and so on) **does require MFA**. The bar at the top marks each action according to what it actually requires, and must never say "this screen requires MFA" in general terms. |

**④ Confirmation copy**

- Assigning: `Assign ResearchApprover to researcher_lin? They will be able to approve protocols, lock datasets and approve exports (all of which require strong authentication). They still will not be able to approve anything they submitted themselves. This assignment is signed and written to the audit trail.`
- Revoking: `Revoke researcher_lin's ResearchApprover role? It takes effect immediately, and any approval they are part-way through cannot be completed.`

**⑤ Accessibility**: the list of role capabilities is a `<ul>` referenced from the role dropdown's `aria-describedby` (when the selection changes the list updates with it and `role="status"` announces `Showing what ResearchApprover can do`); the reason is mandatory, and while the button is disabled `aria-describedby` gives the reason.

---

### G4 Integrations and AI provider configuration (§21)

**① Purpose and density**: the connection and status of external integrations. **AI provider configuration here covers only "connection and credentials"; how AI is used in research is configured in C8** — the two must stay separate, and administration must never decide the role AI plays in research. Density: a dense table + detail.

**② Wireframe**

```text
Administration › integrations
┌──────────────────┬───────────┬────────────┬──────────────┬──────────────┐
│ Integration      │ Mode      │ Endpoint   │ Status       │ Action       │
├──────────────────┼───────────┼────────────┼──────────────┼──────────────┤
│ Knowledge base (MCP) │ mcp   │ <endpoint> │ ok           │ [View KG]    │
│ Email provider   │ simulated │ (simulated)│ simulating   │ [View email] │
│ Object storage   │ real      │ …          │ ok           │ [View storage] │
└──────────────────┴───────────┴────────────┴──────────────┴──────────────┘
ⓘ "Simulated" means simulated: a simulated provider does not put anything into anybody's hands.

Knowledge base (MCP) detail
 Mode [simulator | mcp]  currently mcp   ⓘ Switching to simulator makes evidence
   search return deterministic simulated results — the researcher's interface
   shows them as "simulated", not as a real search.
 Endpoint <knowledge graph endpoint>   Timeout 45s   Last successful call 11:02
 Failure policy  fail closed: when it cannot be reached it returns "the search did not complete", and never an empty result.
 ⓘ AI provider credentials are managed here; the role AI plays in research is
   decided by the protocol and the AI configuration (in the researcher
   workspace), not here.
                                   [Change the configuration (requires strong authentication, MFA)]
```

**③ State matrix**

| State | Presentation |
|---|---|
| Loading | The status column shows `probing…` and **never presumes "ok"** |
| Empty queue | `No integrations have been configured yet.` |
| Error | A failed probe: `The status of this integration cannot be determined (<code>). Do not treat it as ok. [Try again]` |
| Insufficient permission | Without `system.configure`: read-only + `You can view integration status but cannot change it (it needs SystemAdministrator).` |
| MFA required | Changing the configuration requires MFA. At the top: `Strong-authentication actions on this screen: change an integration's configuration (requires MFA).` |

**④ Confirmation copy**:
`Switch the knowledge-base integration from mcp to simulator?
Researchers' evidence searches will start returning deterministic simulated results, and the interface will mark them as "simulated".
Citations already attached are unaffected; they record the search identifier as it was at the time.
This action requires strong authentication (MFA), is signed, and is written to the audit trail.`

**⑤ Accessibility**: the status column is in words (`ok`/`simulating`/`cannot be determined`); secret fields are never echoed in the clear and show `set (not displayed)` + `[Replace]`; the table follows 1.9.

---

### G5 Jobs and the dead-letter queue (§21)

**① Purpose and density**: operational jobs and dead-letter handling. Density: a dense table. **A replay is decided one item at a time; there is no "replay everything".**

**② Wireframe**

```text
Administration › jobs › dead-letter queue (1)
┌────────┬──────────────────────┬──────────┬───────────────┬────────────────────┐
│ Job    │ Type                 │ Attempts │ First failed  │ Action             │
├────────┼──────────────────────┼──────────┼───────────────┼────────────────────┤
│ job_31 │ Withdrawal propagation │ 5      │ 2h ago        │ [View job_31]      │
│        │ Impact: SP-002's withdrawal has not propagated to everything downstream. │
│        │ Error: DEPENDENCY_UNAVAILABLE (object storage timeout)  │
│        │ [Replay this one] [Mark as needing a person]            │
└────────┴──────────────────────┴──────────┴───────────────┴────────────────────┘
ⓘ A dead letter does not disappear on its own and is never replayed automatically. Each one needs a person to decide.
ⓘ Jobs bearing on a participant's rights (withdrawal propagation, deletion propagation) are pinned to the top here.
```

**③ State matrix**

| State | Presentation |
|---|---|
| Loading | A table skeleton |
| Empty queue | `There are no dead letters. Every job has been processed successfully.` |
| Error | A failed replay: `The replay did not succeed (<code>). This one is still in the dead-letter queue.` |
| Insufficient permission | `Your role cannot work the job queue (it needs SystemAdministrator).` |
| MFA required | Replaying and marking do **not** require MFA (these are operational actions, not authority actions). At the top: `No action on this screen requires strong authentication.` |

**④ Confirmation copy**: `Replay job_31 (withdrawal propagation, SP-002)? Replaying tries again to propagate this withdrawal downstream. If it fails again it stays in the dead-letter queue.`

**⑤ Accessibility**: the impact and the error are row-expansion content (controlled by `aria-expanded`), never a tooltip; the sorting rule that pins rights-related jobs to the top is explained in the `<caption>`.

---

### G6 Feature flags (§21)

**① Purpose and density**: switching flags and their impact. **A flag must never be used to bypass consent, moderation or safety** — and the interface says so. Density: a dense table.

**② Wireframe**

```text
Administration › feature flags
┌────────────────────┬────────┬────────────────────────────────┬──────────┐
│ Flag               │ State  │ Impact                         │ Action   │
├────────────────────┼────────┼────────────────────────────────┼──────────┤
│ matching.enabled   │ off    │ Participants do not see "Meet new people" │ [View] │
│ community.enabled  │ on     │ The community is visible on the participant home │ [View] │
│ ai.companion       │ off    │ Bound by the Level-5 prohibition;│ locked   │
│                    │        │ this flag cannot be switched on │          │
└────────────────────┴────────┴────────────────────────────────┴──────────┘
ⓘ A flag can only switch a feature's visibility and availability off or on. A flag cannot
  bypass a consent check, a moderation process or a safety rule — those are decided by the
  permission engine and the protocol, and no flag affects them.
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
