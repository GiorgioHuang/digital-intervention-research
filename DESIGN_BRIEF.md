# DESIGN_BRIEF

> The brief handed to the design agent. Specification sources: Doc 20 v1.3 (UX flows and design system, 330 sections), Doc 19 v1.3 (conceptual research, epistemic discipline), ACCESSIBILITY_TEST_PLAN, THREAT_MODEL. The list of units still to be designed is in UI_INVENTORY.md (93 of them).

## 1. What this product is not

An older-adults games app, an AI chatbot, a social network, a cognitive testing system, a care-management system — **none of these**. It is a human-centred, evidence-based digital intervention research platform. The visuals and interactions must not borrow the attention mechanics of social products.

## 2. The non-negotiable principles (Doc 20 §13, the design consequences of the 20 core principles)

| Principle | Design consequence (testable) |
|---|---|
| One meaningful decision at a time | no screen may place two high-impact decisions side by side; a confirmation dialog confirms one thing only |
| Explain before asking | for any action that asks something of the participant, its consequence and its audience are visible on the same screen — not behind a tooltip or a second page |
| Confirm consequences | the confirmation text for a high-impact action names the object and the consequence ("Publish to 'Gardening Corner'? Every member will be able to see it") |
| No dark patterns | visual weight must not steer the participant toward one option; "Not now" and "Interested" carry equal weight |
| Private by default | the lowest visibility is the default; raising visibility must be an explicit action |
| Audience before publication | the audience is presented above the publish control |
| Draft before send/publish | draft and sent states are visually distinguishable, and a draft is marked "only you can see this" |
| Provenance before assertion | any evidential content must show its source and evidence strength alongside it |
| Exact version before approval | an approval screen must show the exact version number or hash of the object being approved |
| Human authority before high-impact actions | an automated output must never be presented as decided; AI output must be labelled and require human confirmation |
| Colour is never the only state indicator | every state = icon + words + (optionally) colour |

## 3. Epistemic discipline (Doc 19 §10 / Doc 20 §52)

The interface must distinguish and make visible the labels: observation / inference / source-derived / design assumption / contradiction / prototype observation and the rest; **synthetic or simulated results must never be presented as empirical evidence**. Every concluding element in the researcher interface must be able to answer "which kind of knowledge is this?".

> **Status as at 2026-08-16**: half built, and the half that is missing is missing on purpose.
>
> The `[synthetic data]` marking exists: the staff workspace opens with a statement that everything on these screens is synthetic, that nothing produced here is empirical evidence, and — because saying only what it is not would be its own falsehood — that what a conceptual prototype *can* show is coherence.
>
> The **per-item epistemic tags** are not built and cannot honestly be. No artefact carries a knowledge-type field and nothing writes one, so a tag on an analysis output would be invented at render time, or be a control recording a value no query reads. An invented label is worse than an absent one: absence is legible, whereas a label reads as though somebody classified the item. So the interface states the gap instead — items are not tagged individually, the platform has nowhere to record such a tag, and the one statement therefore covers everything without exception. **Unlock condition**: a written knowledge-type field on the artefacts that carry conclusions, plus the rule that an untagged conclusion cannot be submitted.

## 4. The accessibility floor (Doc 20 §285–300; WCAG 2.2 AA)

- No loss of content or function at 200% zoom or under large text scaling, and no horizontal scrolling
- Touch targets ≥44px and **not overlapping their neighbours** (a real defect has already occurred here: 44px buttons dropped into 29px row boxes and pressed into one another)
- Focus visible on every surface and in every state; focus order matches reading order
- Screen readers: state changes announced through a live region; dialogs use `alertdialog` with the title associated
- Respect reduced-motion; motion must never carry the only copy of a piece of information
- Capability-adaptive modes (§286–287): text size, density, contrast and a simplified mode are switchable by the user, and **never selected automatically on the basis of age**

## 5. Language (Doc 20 §277–284)

- Participant language: plain, second person, never condescending, and never using "the elderly" as a label
- Honest wording beats reassuring wording: a delivery state must not report "the provider accepted it" as "they have received it"; unknown means unknown
- Refusal and failure text says **what can be done next**, and does not blame the user
- The interface language is English (D-9). The glossary stays stable: consent / testimony / draft / connection / mutual acceptance / moderation / safety signal — one term per concept, used identically in the interface, the tests and these documents

## 6. Technical constraints (a design has to land in the implementation that exists)

- React 18 + Vite, no UI framework dependency; styling is a single CSS file, no CSS-in-JS
- Tokens are delivered as CSS custom properties (`--color-…` / `--space-…` / `--type-…`), supporting light and dark (`color-scheme: light dark` is enabled at `styles.css:634`)
- Components are semantic HTML (`<nav> <main> <section> <ul> <button> <dialog role=alertdialog>`); **div soup must not be introduced for visual reasons**, because the existing accessibility assertions query by role and accessible name
- The 386 existing front-end tests (49 files) query elements by accessible name — for example `getByRole('button', { name: 'Save draft' })`. **Changing the words changes the tests**; if a change is needed, list it explicitly in the deliverable
- Mobile first: real use happens on a phone (verified)

## 7. What the deliverable must contain

1. **A design system specification**: the token list (with concrete values and contrast verification), component rules, state tables; expressed as CSS custom properties that can be dropped in as they stand
2. **A per-screen specification**: purpose, information hierarchy, block order, the state matrix (loading / empty / error / not permitted / protected existence), the key interactions and confirmation wording, and the accessibility points
3. **No visual mock-up images**: deliver a structured specification plus ASCII/Markdown wireframe descriptions, so it can be implemented and reviewed directly
4. **Trade-offs and open questions marked explicitly**: wherever something conflicts with Doc 20 or needs a product decision, give it its own section rather than deciding unilaterally

## 8. A reminder about scope

This is currently a conceptual research prototype (ADR-061/062): entirely synthetic data, simulated providers, a dev-header identity stub. The consent and approval screens are a UX model **of the future system being modelled**; present them faithfully in the design, but they must not imply that ethics approval has been obtained or that real participants are being recruited.
