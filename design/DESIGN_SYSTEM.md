# DESIGN_SYSTEM — design system foundation v0.1

> Scope of delivery: UI_INVENTORY section A (the 9 design-system foundation items, A1–A9) and the cross-screen state foundation in section I (I11 loading/skeleton/empty/offline/syncing/stale, I12 version conflict, I13 error severity).
> Source of specification: Doc 20 v1.3 §13, §43–56, §224–246, §277–307, §310–320; DESIGN_BRIEF §2/§4/§6; ACCESSIBILITY_TEST_PLAN.
> This document **changes no code**. §F is a paste-ready CSS draft; landing it is the implementation agent's work.
> Phase statement: conceptual research prototype (ADR-061/062). All synthetic data, simulated providers, dev-header identity stub. This design system must not imply that ethics approval has been obtained or that real participants are being recruited.

---

## Contents

- [§0 How to read this, and the non-negotiable constraints](#0-how-to-read-this-and-the-non-negotiable-constraints)
- [§A Tokens](#a-tokens)
- [§B Global rules](#b-global-rules)
- [§C Capability-adaptive modes](#c-capability-adaptive-modes)
- [§D Responsiveness](#d-responsiveness)
- [§E State presentation specification](#e-state-presentation-specification)
- [§F CSS draft](#f-css-draft-paste-straight-into-appswebsrcstylescss)
- [§G Effect on the existing 34 tests and accessible names](#g-effect-on-the-existing-34-tests-and-accessible-names)
- [§H Key trade-offs](#h-key-trade-offs)
- [§I Open items needing a product decision](#i-open-items-needing-a-product-decision)

---

## §0 How to read this, and the non-negotiable constraints

### 0.1 The three-layer token architecture (Doc 20 §310)

```text
Foundation (raw values: colour values, the rem scale, milliseconds)
        ↓  appears exactly once, in :root
Semantic (semantic names: --color-danger-fg, --space-3, --type-size-2)
        ↓  components may reference only this layer
Component (component-private: --btn-pad-block, derived from semantic)
        ↓
Mode / Theme Override (dark, high contrast, font size, density, simplified)
```

**Hard rule**: no literal colour value, literal px or literal millisecond value may appear in component CSS. At review, every hit from `grep -nE '#[0-9a-fA-F]{3,6}|[0-9]+px|[0-9]+ms' styles.css` must fall inside `:root` or a theme-override block.

### 0.2 What this system is *not*

| Anti-pattern | Why it is forbidden |
|---|---|
| Gradients, stacked shadows, glassmorphism | Decorative weight gets read as importance; Doc 20 §319, elevation must not signify scientific confidence or authority |
| A brand accent colour used as a "wash of primary colour" | High saturation over a large area competes with the danger/safety semantic colours |
| Cards with ≥16px corner radii, anthropomorphic illustration | Doc 20 §316: do not infantilise; participants are adults |
| Badge counts, red dots, streaks, progress-bar rewards | Attention mechanics; Doc 20 §297 explicitly forbids celebratory motion for consent / matching / message volume / study completion |
| Colour intensity used to signify "AI confidence" | Doc 19 §10 epistemic discipline: confidence must be words, not visual intensity |

### 0.3 Technical boundaries

No UI framework, no CSS-in-JS, no icon-library dependency, no web-font download (it must be readable offline and on a low-bandwidth connection). All of it lands in the single file `apps/web/src/styles.css` plus one inline SVG icon module.

---

## §A Tokens

**Total: 133 semantic token names across 363 declarations** (counted from `apps/web/src/styles.css` on 2026-08-16 with comments stripped, not by hand). The distribution is in the table below, and each item is defined in §A.1–§A.9.

> **These are the live stylesheet's numbers, and they are not the §F draft's.** §F self-checks as 119 names / 254 declarations, which was true of the v0.1 draft and has not been true since the system was re-palletised and the staff desktop layout added. The figures here were the draft's too until 2026-08-16; they are now recounted from the stylesheet, which is the source of truth (§A.1.1). If the two disagree in future, this table is the one to trust and §F is a frozen appendix.

| Group | Token names | Section |
|---|---:|---|
| Colour (light + dark, two sets of values under one name) | 57 | §A.1 |
| Typography (family/size/line-height/weight/tracking + measure) | 23 | §A.2 |
| Spacing and the density multipliers | 13 | §A.3 |
| Shape and stroke | 9 | §A.4 |
| Focus dimensions (the colours count in the colour group) | 4 | §A.5 |
| Motion | 7 | §A.6 |
| elevation | 4 | §A.7 |
| z-index layers | 6 | §A.7 |
| Touch targets (including the checkbox/radio box size) | 4 | §A.8 |
| Icons | 5 | §A.9 |
| The font-size multiplier `--scale-font` | 1 | §C.1 |
| **Total** | **133** | |

**The capability-adaptive modes are six, and every one of them has a writer** in `apps/web/src/preferences.ts`: `data-font-scale` (4 steps), `data-density` (3), `data-contrast` (2), `data-motion` (2), `data-stimulation` (low), `data-theme` (3, per D-80). A seventh, `data-simplify`, was **removed on 2026-08-13** and is no longer listed here: nothing ever set it, no element carried the `.optional` class it selected, and all it could have done was change a line height the line-spacing preference already changes. Earlier versions of this paragraph listed "simplified" among the modes, which described a capability the product did not have.

### A.1 Colour tokens (A1; Doc 20 §311–312)

Contrast is measured by computing the WCAG 2.x relative-luminance formula (the script is in §A.1.5), not judged by eye. The thresholds:

- **Body text and text below 18.66px**: ≥ 4.5:1
- **Large text (≥24px, or ≥18.66px bold) and UI component boundaries/graphics**: ≥ 3:1
- **Focus indicators**: ≥ 3:1 against both of the colours adjacent to them

#### A.1.1 Light theme — Calm Teal & Warm Sand

> The theme was settled by the owner (2026-08-13): gentle, trustworthy, rational humane technology; neither a traditional hospital system nor a futuristic AI product.
> **The two tables below are generated from `apps/web/src/styles.css`, not copied by hand.** The assertions are in `apps/web/test/design-tokens.test.ts`, and changing any colour value makes them fail.

**Two tiers of the same colour** are what allows this palette to work at all. Several of the swatches in the owner's palette land between 3:1 and 4.5:1 against the page: acceptable as a border, not acceptable as body text. Using one value for both leaves only a choice between "the border is too faint" and "the text is hard to read", and both are wrong. Hence:

| Tier | Threshold | Where it is used | How the value is derived |
|---|---:|---|---|
| Graphic tier | 3:1 | Borders, icons, status bars, colour blocks | **The owner's value, used as given** |
| Text tier | 4.5:1 | Anything that has to be read | The same colour **darkened by uniform scaling** (HSL hue and saturation unchanged, only lightness lowered) |

Uniform darkening is not a substitute colour: `#287C78 → #267571` moves the hsl from 177/51/32 to 177/51/30. The tier you actually see as colour keeps the owner's palette intact.

| Token | Value | Foreground/background pairing | Measured contrast | Threshold |
|---|---|---|---:|---|
| `--color-surface-page` | `#F7F8F6` | base surface | — | — |
| `--color-surface-raised` | `#FFFFFF` | base surface | — | — |
| `--color-surface-sunken` | `#F0F3F1` | base surface | — | — |
| `--color-surface-inverse` | `#243331` | base surface | — | — |
| `--color-text-primary` | `#243331` | / page | **12.38:1** | 4.5 |
| `--color-text-primary` | `#243331` | / raised | **13.18:1** | 4.5 |
| `--color-text-primary` | `#243331` | / sunken | **11.80:1** | 4.5 |
| `--color-text-secondary` | `#566461` | / page | **5.81:1** | 4.5 |
| `--color-text-secondary` | `#566461` | / raised | **6.19:1** | 4.5 |
| `--color-text-secondary` | `#566461` | / sunken | **5.54:1** | 4.5 |
| `--color-text-link` | `#267571` | / page | **5.10:1** | 4.5 |
| `--color-text-link` | `#267571` | / raised | **5.43:1** | 4.5 |
| `--color-text-link` | `#267571` | / sunken | **4.86:1** | 4.5 |
| `--color-text-inverse` | `#FFFFFF` | / surface-inverse | **13.18:1** | 4.5 |
| `--color-border-subtle` | `#D8DEDB` | / page (**decorative only**, carries no information) | 1.28:1 | exempt¹ |
| `--color-border-default` | `#74817E` | / page (graphic; never used as text) | **3.80:1** | 3 |
| `--color-border-strong` | `#566461` | / page | **5.81:1** | 3 |
| `--color-action-primary-bg` | `#287C78` | / page (component boundary) | **4.64:1** | 3 |
| `--color-action-primary-bg` | `#287C78` | vs fg `#FFFFFF` | **4.95:1** | 4.5 |
| `--color-action-primary-bg-hover` | `#216B67` | vs fg `#FFFFFF` | **6.24:1** | 4.5 |
| `--color-action-primary-bg-active` | `#1B5B57` | vs fg `#FFFFFF` | **7.83:1** | 4.5 |
| `--color-action-secondary-fg` | `#267571` | / raised | **5.43:1** | 4.5 |
| `--color-action-secondary-border` | `#287C78` | / page | **4.64:1** | 3 |
| `--color-action-secondary-bg-hover` | `#DDEEEB` | vs secondary-fg (selected-state background) | **4.53:1** | 4.5 |
| `--color-focus-ring` | `#142523` | / page | **14.95:1** | 3 |
| `--color-focus-ring` | `#142523` | / focus-halo (inner adjacent) | **15.93:1** | 3 |
| `--color-focus-halo` | `#FFFFFF` | / primary button fill (outer adjacent) | **4.95:1** | 3 |
| `--color-info-bg` | `#E8F0F7` | Info: neutral notice | — | — |
| `--color-info-fg` | `#3E6F9E` | / info-bg | **4.59:1** | 4.5 |
| `--color-info-fg` | `#3E6F9E` | / page | **4.96:1** | 4.5 |
| `--color-info-border` | `#3E6F9E` | / page (graphic) | **4.96:1** | 3 |
| `--color-success-bg` | `#E7F3EC` | Success: completed | — | — |
| `--color-success-fg` | `#2E7B59` | / success-bg | **4.50:1** | 4.5 |
| `--color-success-fg` | `#2E7B59` | / page | **4.82:1** | 4.5 |
| `--color-success-border` | `#2F7D5B` | / page (graphic) | **4.69:1** | 3 |
| `--color-warning-bg` | `#FBF1DC` | Warning: needs attention, not blocked | — | — |
| `--color-warning-fg` | `#97641A` | / warning-bg | **4.51:1** | 4.5 |
| `--color-warning-fg` | `#97641A` | / page | **4.75:1** | 4.5 |
| `--color-warning-border` | `#B7791F` | / page (graphic) | **3.42:1** | 3 |
| `--color-danger-bg` | `#F9E8E7` | Error: blocked | — | — |
| `--color-danger-fg` | `#B34848` | / danger-bg | **4.50:1** | 4.5 |
| `--color-danger-fg` | `#B34848` | / page | **5.01:1** | 4.5 |
| `--color-danger-border` | `#B84A4A` | / page (graphic) | **4.79:1** | 3 |
| `--color-safety-bg` | `#E6ECF4` | Safety: safety signal (not an error) | — | — |
| `--color-safety-fg` | `#2A4470` | / safety-bg | **8.18:1** | 4.5 |
| `--color-safety-fg` | `#2A4470` | / page | **9.13:1** | 4.5 |
| `--color-safety-border` | `#2A4470` | / page (graphic) | **9.13:1** | 3 |
| `--color-moderation-bg` | `#E3F0EF` | Moderation: under review | — | — |
| `--color-moderation-fg` | `#1A5451` | / moderation-bg | **7.40:1** | 4.5 |
| `--color-moderation-fg` | `#1A5451` | / page | **8.11:1** | 4.5 |
| `--color-moderation-border` | `#1A5451` | / page (graphic) | **8.11:1** | 3 |
| `--color-ai-bg` | `#F0EFF8` | AI: the mark of machine output | — | — |
| `--color-ai-fg` | `#6C6898` | / ai-bg | **4.52:1** | 4.5 |
| `--color-ai-fg` | `#6C6898` | / page | **4.84:1** | 4.5 |
| `--color-ai-border` | `#7773A8` | / page (graphic) | **4.10:1** | 3 |
| `--color-story-bg` | `#F5E9D8` | Story: Life Story and meaning-bearing content | — | — |
| `--color-story-fg` | `#86633D` | / story-bg | **4.53:1** | 4.5 |
| `--color-story-fg` | `#86633D` | / page | **5.10:1** | 4.5 |
| `--color-story-border` | `#B18351` | / page (graphic) | **3.16:1** | 3 |
| `--color-community-bg` | `#E9F1EA` | Community: the community | — | — |
| `--color-community-fg` | `#52745A` | / community-bg | **4.55:1** | 4.5 |
| `--color-community-fg` | `#52745A` | / page | **4.92:1** | 4.5 |
| `--color-community-border` | `#6B9674` | / page (graphic) | **3.16:1** | 3 |
| `--color-matching-bg` | `#E9EFF4` | Matching: exploring and choosing | — | — |
| `--color-matching-fg` | `#4D6F8F` | / matching-bg | **4.55:1** | 4.5 |
| `--color-matching-fg` | `#4D6F8F` | / page | **4.95:1** | 4.5 |
| `--color-matching-border` | `#587FA3` | / page (graphic) | **3.96:1** | 3 |
| `--color-story-surface` | `#FCF8F2` | vs text-primary (Life Story area background) | **12.46:1** | 4.5 |
| `--color-danger-solid-bg` | `#A03F3F` | vs `#FFFFFF` | **6.41:1** | 4.5 |
| `--color-disabled-fg` | `#69706E` | / disabled-bg (not exempted in this system, §B.1.4) | **4.54:1** | 4.5 |

#### A.1.2 Dark theme

> The owner's ruling: this project **does not treat a full dark mode as a priority** (the people using it include older adults and people with low digital confidence; borders, states and low-contrast text are all harder to control in the dark; and research tables and the text and images of a Life Story suit a warm light ground better). Priority went to Light, high-contrast Light and the low-stimulation mode.
> But dark mode **is already in the product** — there is a switch in the preferences panel, and the system's `prefers-color-scheme` reaches it too. "Not a priority" does not mean "allowed to be bad": leaving behind a dark mode still dressed in the old blue would show anyone who chose it a different product. So it is re-palletised around the same teal, and guarded by the same test.

In the dark theme colours are lightened by **interpolating towards white** (in the light theme they are darkened by uniform scaling towards black): the hue angle is unchanged and the saturation naturally falls — a highly saturated bright colour haloes against a dark ground.

| Token | Value | Foreground/background pairing | Measured contrast | Threshold |
|---|---|---|---:|---|
| `--color-surface-page` | `#000000` | base surface | — | — |
| `--color-surface-raised` | `#1A2224` | base surface | — | — |
| `--color-surface-sunken` | `#0C1113` | base surface | — | — |
| `--color-surface-inverse` | `#E6ECEA` | base surface | — | — |
| `--color-text-primary` | `#FFFFFF` | / page | **21.00:1** | 4.5 |
| `--color-text-primary` | `#FFFFFF` | / raised | **16.18:1** | 4.5 |
| `--color-text-primary` | `#FFFFFF` | / sunken | **19.00:1** | 4.5 |
| `--color-text-secondary` | `#E9ECF2` | / page | **17.75:1** | 4.5 |
| `--color-text-secondary` | `#E9ECF2` | / raised | **13.67:1** | 4.5 |
| `--color-text-secondary` | `#E9ECF2` | / sunken | **16.06:1** | 4.5 |
| `--color-text-link` | `#6FC3BC` | / page | **10.21:1** | 4.5 |
| `--color-text-link` | `#6FC3BC` | / raised | **7.86:1** | 4.5 |
| `--color-text-link` | `#6FC3BC` | / sunken | **9.24:1** | 4.5 |
| `--color-text-inverse` | `#12181A` | / surface-inverse | **14.98:1** | 4.5 |
| `--color-border-subtle` | `#2A3335` | / page (**decorative only**, carries no information) | 1.62:1 | exempt¹ |
| `--color-border-default` | `#E9ECF2` | / page (graphic; never used as text) | **17.75:1** | 3 |
| `--color-border-strong` | `#FFFFFF` | / page | **21.00:1** | 3 |
| `--color-action-primary-bg` | `#BBD4FF` | / page (component boundary) | **13.97:1** | 3 |
| `--color-action-primary-bg` | `#BBD4FF` | vs fg `#000000` | **13.97:1** | 4.5 |
| `--color-action-primary-bg-hover` | `#55A9A3` | vs fg `#000000` | **7.59:1** | 4.5 |
| `--color-action-primary-bg-active` | `#74BCB7` | vs fg `#000000` | **9.62:1** | 4.5 |
| `--color-action-secondary-fg` | `#6FC3BC` | / raised | **7.86:1** | 4.5 |
| `--color-action-secondary-border` | `#3A958F` | / page | **5.88:1** | 3 |
| `--color-action-secondary-bg-hover` | `#16302E` | vs secondary-fg (selected-state background) | **6.82:1** | 4.5 |
| `--color-focus-ring` | `#EEF6F4` | / page | **19.12:1** | 3 |
| `--color-focus-ring` | `#EEF6F4` | / focus-halo (inner adjacent) | **18.19:1** | 3 |
| `--color-focus-halo` | `#06090A` | / primary button fill (outer adjacent) | **13.29:1** | 3 |
| `--color-info-bg` | `#13253A` | Info: neutral notice | — | — |
| `--color-info-fg` | `#678EB3` | / info-bg | **4.50:1** | 4.5 |
| `--color-info-fg` | `#678EB3` | / page | **6.10:1** | 4.5 |
| `--color-info-border` | `#5A83AA` | / page (graphic) | **5.26:1** | 3 |
| `--color-success-bg` | `#122A20` | Success: completed | — | — |
| `--color-success-fg` | `#5A987D` | / success-bg | **4.52:1** | 4.5 |
| `--color-success-fg` | `#5A987D` | / page | **6.22:1** | 4.5 |
| `--color-success-border` | `#4A8B6E` | / page (graphic) | **5.21:1** | 3 |
| `--color-warning-bg` | `#2C2209` | Warning: needs attention, not blocked | — | — |
| `--color-warning-fg` | `#BA7E27` | / warning-bg | **4.55:1** | 4.5 |
| `--color-warning-fg` | `#BA7E27` | / page | **6.10:1** | 4.5 |
| `--color-warning-border` | `#B7791F` | / page (graphic) | **5.77:1** | 3 |
| `--color-danger-bg` | `#2E1817` | Error: blocked | — | — |
| `--color-danger-fg` | `#C66E6E` | / danger-bg | **4.65:1** | 4.5 |
| `--color-danger-fg` | `#C66E6E` | / page | **5.86:1** | 4.5 |
| `--color-danger-border` | `#BD5A5A` | / page (graphic) | **4.77:1** | 3 |
| `--color-safety-bg` | `#16233A` | Safety: safety signal (not an error) | — | — |
| `--color-safety-fg` | `#7796BD` | / safety-bg | **5.15:1** | 4.5 |
| `--color-safety-fg` | `#7796BD` | / page | **6.88:1** | 4.5 |
| `--color-safety-border` | `#6A8CB6` | / page (graphic) | **6.04:1** | 3 |
| `--color-moderation-bg` | `#102B2A` | Moderation: under review | — | — |
| `--color-moderation-fg` | `#56A5A0` | / moderation-bg | **5.20:1** | 4.5 |
| `--color-moderation-fg` | `#56A5A0` | / page | **7.29:1** | 4.5 |
| `--color-moderation-border` | `#479C97` | / page (graphic) | **6.47:1** | 3 |
| `--color-ai-bg` | `#201F2E` | AI: the mark of machine output | — | — |
| `--color-ai-fg` | `#8682B2` | / ai-bg | **4.51:1** | 4.5 |
| `--color-ai-fg` | `#8682B2` | / page | **5.85:1** | 4.5 |
| `--color-ai-border` | `#7D79AB` | / page (graphic) | **5.19:1** | 3 |
| `--color-story-bg` | `#2A2117` | Story: Life Story and meaning-bearing content | — | — |
| `--color-story-fg` | `#C9955C` | / story-bg | **5.98:1** | 4.5 |
| `--color-story-fg` | `#C9955C` | / page | **7.94:1** | 4.5 |
| `--color-story-border` | `#C08C53` | / page (graphic) | **7.12:1** | 3 |
| `--color-community-bg` | `#172519` | Community: the community | — | — |
| `--color-community-fg` | `#6E9B78` | / community-bg | **5.04:1** | 4.5 |
| `--color-community-fg` | `#6E9B78` | / page | **6.62:1** | 4.5 |
| `--color-community-border` | `#679070` | / page (graphic) | **5.80:1** | 3 |
| `--color-matching-bg` | `#16222C` | Matching: exploring and choosing | — | — |
| `--color-matching-fg` | `#678BAB` | / matching-bg | **4.51:1** | 4.5 |
| `--color-matching-fg` | `#678BAB` | / page | **5.86:1** | 4.5 |
| `--color-matching-border` | `#5F83A4` | / page (graphic) | **5.27:1** | 3 |
| `--color-story-surface` | `#211A12` | vs text-primary (Life Story area background) | **17.20:1** | 4.5 |
| `--color-danger-solid-bg` | `#C66E6E` | vs `#1A0808` | **5.41:1** | 4.5 |
| `--color-disabled-fg` | `#8A9491` | / disabled-bg (not exempted in this system, §B.1.4) | **5.12:1** | 4.5 |

#### A.1.3 The division of labour between semantic colours (Doc 20 §311; they must not be interchanged)

| Semantic family | Used only for | **Must not** be used for |
|---|---|---|
| info | Neutral explanation, "this is normal", contextual banners | Anything requiring an action from the user |
| success | A fact the server has confirmed as complete | A local save, something queued, "handed to the sending service" |
| warning | Needs attention but is not blocked; conditional approval | Errors; the final confirmation of an irreversible operation |
| danger | Destructive/irreversible actions, blocking errors | Safety matters |
| **safety** | SafetySignal / SafetyEvent / urgent support routes | Ordinary errors, moderation matters |
| **moderation** | Reports, moderation decisions, appeals | Safety matters, danger |
| **ai** | AI-involvement labels, AI draft containers | Signifying the quality or confidence of AI output |
| disabled | A control that is currently unavailable | **Hiding** something for lack of permission (for protected existence see §E.9) |
| **story** | Life Story, memory cards, quotations, gentle prompts, empty states | Primary buttons; anywhere there is a state to report |
| **community** | Community spaces and the content in them | Participation rewards, popularity, a brightly coloured feed |
| **matching** | Match suggestions and the "still choosing" stage | An established connection (that is connection = the primary teal) |
| **connection** | An established, settled relationship | Match candidates, relationships awaiting confirmation |

**danger / safety / moderation must be visually distinguishable and must never substitute for one another**: this is why Doc 20 §311 lists Safety and moderation as semantic families of their own. Red = destructive action, **dark blue = safety (of the person and their wellbeing)**, dark teal = moderation (content and conduct rules).

After the primary colour changed to teal these three **were very nearly ruined, and ruined by the act of "getting them right"**. Compressing every one of them to just barely clear the same threshold (4.5:1) lets the hue survive but not the lightness — every colour lands on the same rung of brightness. What the first derivation produced: safety, info and matching, three blues, were only 1.25:1 apart from one another; moderation's border colour was **byte-for-byte identical** to the primary button; and moderation's text colour was 1.07:1 from the link colour. **All of this passed the contrast tests** — contrast measures a colour "against the background" and says not one word about "against its siblings".

After the correction, safety goes back to a distinctly deeper navy (1.84:1 from info), moderation uses a teal deeper than the primary button (1.75:1 from it), and a new assertion was added: no two semantic families may share a colour value, and no family may equal the primary action colour — **a state should not look like a button**.

Even so, colour is **always a secondary cue** in this system: safety and info are still both in the blue family and are nearly indistinguishable in greyscale. Safety matters must therefore always carry the ⬡ icon and the word "safety"; in greyscale the three are told apart by icon shape (△ / ⬡ / ▢) and by words — see §A.9 and §B.1.

#### A.1.3b How zone colours relate to semantic colours (added 2026-08-13)

The last four rows of the table above are **zone colours**, and they are **not the same kind of thing** as the semantic colours above them. Mixing the two destroys both:

- A semantic colour says "what state is this thing in" — it changes over time, and it is there to help someone **make a judgement**.
- A zone colour says "which part of the product does this content belong to" — it does not change over time, and it is there to help someone **find their way**.

**When both apply, state wins.** Someone waiting on a safety review should be told that by the screen, not told which section they are in. So zone colours appear only where there is no state to report: a quotation in a Life Story, the introduction to a community space, a match suggestion card.

Three concrete consequences:

1. **Sand is never a button colour.** Consistency of buttons matters more than the atmosphere of a zone — once someone has learned that "the teal one is the primary action", they should not have to learn it again inside Life Story. Sand does backgrounds, borders and quotation bars only.
2. **Matching and Connection are deliberately different colours.** Blue = still choosing, primary teal = already established. They are two different facts at two points on the same path, and one colour for both would make "connected" look like "another candidate".
3. **AI marks, it never fills.** The AI blue-violet is for the AI Draft label, the provenance note, and the border of a suggestion card. AI output **must not** carry more visual authority than a participant's own content (Doc 19 §10) — making the AI area a solid field of violet is using the layout to tell someone "what the machine said matters more".

**The low-stimulation mode must override all four of these together.** Miss any one and somebody who chose "low stimulation" still sees a block of colour — which is precisely what they chose it to avoid.

#### A.1.4 Use of the visibility colours (Doc 20 §312)

The visibility levels (Private / Selected People / Connections / Community / Platform Public / Internet Public) are **always carried primarily by an icon plus words, with colour as support**.

- `Private` and `Internet Public` are the two extremes, and distinguishing them **by depth of hue alone is forbidden**: `Private` uses a solid closed-lock icon plus the words "only you can see this"; `Internet Public` uses an open-globe icon plus the words "anyone on the internet can see this", and additionally sits in a `warning` bordered container.
- The intermediate levels are presented neutrally in `--color-text-secondary`, with no colouring, to avoid the "the more public, the brighter" nudge (the dark-pattern prohibition, Doc 20 §13.7).

#### A.1.5 The contrast re-check script (a reviewer can re-run it)

```js
// node contrast.mjs — WCAG 2.x relative luminance and contrast
const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
const L = (hex) => { const h = hex.replace('#', '');
  return 0.2126 * lin(parseInt(h.slice(0,2),16))
       + 0.7152 * lin(parseInt(h.slice(2,4),16))
       + 0.0722 * lin(parseInt(h.slice(4,6),16)); };
export const contrast = (a, b) => {
  const l1 = L(a), l2 = L(b), hi = Math.max(l1, l2), lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
};
```

**Acceptance requirement**: write every combination in the table above as a unit-test assertion (`expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5)`), so that the moment a token value is changed it fails. This is the only automated gate this document recommends adding.

---

### A.2 Typography tokens and rules (A2; Doc 20 §313–314)

#### A.2.1 Font families

| Token | Value |
|---|---|
| `--type-family-ui` | `Inter, 'Source Sans 3', 'Atkinson Hyperlegible', 'Noto Sans', system-ui, -apple-system, 'PingFang SC', 'Noto Sans CJK SC', 'Microsoft YaHei', sans-serif` |
| `--type-family-mono` | `ui-monospace, SFMono-Regular, Menlo, 'Noto Sans Mono CJK SC', monospace` |

No web fonts are downloaded: readability offline takes priority over visual consistency (trade-off §H.2). The named faces at the head of the stack are used when the reader already has them installed, and the stack falls back through the system font otherwise — nothing is fetched over the network either way.

**Why the CJK faces are still in the stack.** Every string in the interface is English (D-9), so they are never needed for the interface itself. They are there for **content people write**: a participant's life story, a message, a community post, a display name. What the interface is written in and what a person may type into it are two different questions, and dropping the fallbacks would answer the second one for them — a name in Chinese would render in whatever the browser chose last, which is how mismatched glyph heights and tofu boxes appear inside otherwise ordinary text.

The monospace family is used **only** for identifiers (`pt_b`, `dv_9`, version hashes) — text of that kind has to be checkable character by character (Doc 20 §54, "approval against an exact version").

#### A.2.2 The type scale (a single scale, shared by all three density levels)

The root font size stays at `112.5%` (18px), as it already is in the current `styles.css`; every dimension is expressed in `rem`, so the browser's font-size setting and 200% zoom work naturally.

| Token | Value (rem) | Default px (18px root) | Use |
|---|---|---:|---|
| `--type-size-0` | `0.833rem` | 15.0 | Only for timestamps/units inside `<small>`; **forbidden** for status text, labels and explanations |
| `--type-size-1` | `1rem` | 18.0 | Body default, buttons, forms |
| `--type-size-2` | `1.125rem` | 20.3 | Emphasised body text, card titles, text inside status badges |
| `--type-size-3` | `1.333rem` | 24.0 | h3 |
| `--type-size-4` | `1.602rem` | 28.8 | h2 |
| `--type-size-5` | `1.924rem` | 34.6 | h1 |
| `--type-size-6` | `2.311rem` | 41.6 | Landing-page display headings on public surfaces only |

The ratio is 1.2 (a minor third). **There is no step smaller than `--type-size-0`** — this is Doc 20 §314's "no tiny secondary labels" enforced at the token level: if you cannot name a smaller size, you cannot write one.

#### A.2.3 Line height

| Token | Value | Use |
|---|---|---|
| `--type-leading-tight` | `1.25` | Headings at `--type-size-4` and above |
| `--type-leading-snug` | `1.4` | `--type-size-3`, dense table cells |
| `--type-leading-normal` | `1.6` | Body default (the existing value, kept) |
| `--type-leading-loose` | `1.8` | Long-form participant text (consent explanations, community rules, life stories) |

Any body line height below 1.5 is **forbidden** (Doc 20 §314).

#### A.2.4 Font weight

| Token | Value | Use |
|---|---|---|
| `--type-weight-regular` | `400` | Body text |
| `--type-weight-medium` | `500` | Status badge text, table headers |
| `--type-weight-semibold` | `600` | Headings, buttons |
| `--type-weight-bold` | `700` | Only the object named in a confirmation dialog (recipient, community name, version number) |

**`font-weight: 300` and below is forbidden** (Doc 20 §314, "very light text"); **paragraph-level `text-transform: uppercase` is forbidden** — now that every interface string is English this is a live constraint rather than a dormant one, because uppercased running text removes the ascender and descender shapes a reader uses to recognise words, and it is read as shouting.

#### A.2.5 Letter spacing

| Token | Value | Use |
|---|---|---|
| `--type-tracking-normal` | `0` | All body text. The faces at the head of the stack are already spaced for reading at body sizes, and tracking added on top of that separates letters into shapes the eye has to reassemble |
| `--type-tracking-mono` | `0.02em` | Monospace identifiers, to make character-by-character checking easier |

#### A.2.6 Measure (line width)

| Token | Value | Use |
|---|---|---|
| `--measure-narrow` | `28rem` | Dialog body text, single-column forms |
| `--measure-default` | `36rem` | Participant body text (648px at an 18px root, i.e. roughly 70 characters per line — inside the 45–75 the reading research supports) |
| `--measure-wide` | `56rem` | Researcher/staff tables and side-by-side comparison |
| `--measure-desktop` | `96rem` | The outer bound of a staff workspace shell (added 2026-08-13 with the desktop layout). **Not a limit on line length** — body paragraphs inside it are still capped at `--measure-default` |

The readable width of `<main>` = `min(100%, var(--measure-default))`. Staff workspaces are raised to **`--measure-desktop`**, not `--measure-wide` — this paragraph said `--measure-wide` until 2026-08-16, from before the desktop layout landed; the live rule is `main[data-workspace='staff'] { max-width: var(--measure-desktop) }`. Widening the shell does not widen the text: paragraphs inside it keep the `--measure-default` cap, because a staff reader is still a reader. This replaces the existing `body { max-width: 44rem }` (see §F).

---

### A.3 Spacing tokens and the three density levels (A3; Doc 20 §315)

**One scale, one multiplier** — Doc 20 §315 requires that dense/standard/spacious "do not produce mutually incompatible separate systems". The approach: the scale is fixed, and the `--density` multiplier scales it uniformly.

| Token | Expression | Compact ×0.75 | Standard ×1 | Spacious ×1.25 |
|---|---|---:|---:|---:|
| `--space-0` | `0` | 0 | 0 | 0 |
| `--space-1` | `calc(0.25rem * var(--density))` | 3.4px | 4.5px | 5.6px |
| `--space-2` | `calc(0.5rem * var(--density))` | 6.8px | 9px | 11.3px |
| `--space-3` | `calc(0.75rem * var(--density))` | 10.1px | 13.5px | 16.9px |
| `--space-4` | `calc(1rem * var(--density))` | 13.5px | 18px | 22.5px |
| `--space-5` | `calc(1.5rem * var(--density))` | 20.3px | 27px | 33.8px |
| `--space-6` | `calc(2rem * var(--density))` | 27px | 36px | 45px |
| `--space-7` | `calc(3rem * var(--density))` | 40.5px | 54px | 67.5px |
| `--space-8` | `calc(4rem * var(--density))` | 54px | 72px | 90px |
| `--space-9` | `calc(6rem * var(--density))` | 81px | 108px | 135px |

(The px values assume an 18px root font size; `--density` is the eleventh token.)

**Density must not shrink any of these three** (doing so would repeat the target-overlap defect in §B.4):

1. `--target-min` (44px) — constant
2. `--target-gap` (the minimum clear gap between adjacent targets) — constant
3. `--focus-ring-width` / `--focus-ring-offset` — constant

That is: **density compresses whitespace only, never clickability or visibility.**

**Defaults**: the participant workspace is `spacious`; the researcher / moderation / safety / administration workspaces are `standard`; `compact` is permitted only locally, in the staff data-table areas, and only when the user has explicitly chosen it (§C).

---

### A.4 Shape and stroke tokens (A4; Doc 20 §316)

| Token | Value | Use |
|---|---|---|
| `--radius-0` | `0` | Table cells, flush-edged blocks |
| `--radius-1` | `0.25rem` | Badges, inputs, buttons |
| `--radius-2` | `0.5rem` | Cards, panels, dialogs |
| `--radius-3` | `0.75rem` | Contextual banners |
| `--radius-pill` | `999rem` | **Only** for the visibility/epistemic label pills; never for buttons |
| `--border-hairline` | `1px` | Decorative dividers (paired with `border-subtle`) |
| `--border-default` | `2px` | Inputs, cards, secondary buttons |
| `--border-strong` | `3px` | Containers that need attention (warning/stale) |
| `--border-emphasis` | `4px` | The redundant **left-hand** channel of a state container (see §B.1.3); the outer frame of an `alertdialog` |

Rules:

- Corner radii ≤ `--radius-2` (8px) for all interactive elements. The reason: Doc 20 §316, "do not infantilise" — large radii plus high saturation is the visual vocabulary of consumer gamification.
- **A stroke must never be the sole carrier of a critical state** (Doc 20 §316): a critical state = structure (the 4px left-hand bar) + icon + words + colour, all four channels present.
- Input borders are always `--border-default` + `--color-border-default` (≥3:1). `border-subtle` **must not** be used, and neither may "underline-only" inputs — their boundary is indiscernible to someone with low vision.

---

### A.5 Focus tokens (A5; Doc 20 §317)

| Token | Value | Notes |
|---|---|---|
| `--focus-ring-width` | `3px` | Constant; does not scale with density or font size |
| `--focus-ring-offset` | `2px` | The gap from the element's edge |
| `--focus-halo-width` | `2px` | A ring in the current surface colour, filling the offset gap |

**The two-ring structure** (which solves the class of problem where "the focus ring sits on the button's fill colour and has insufficient contrast"):

```text
[element fill]  →  halo 2px (= the current surface colour)  →  ring 3px (focus-ring)  →  the surface outside
                        ↑ inner adjacent                          ↑ outer adjacent
```

- The inner adjacent colour = `--color-focus-halo`: light `#FFFFFF` vs ring `#12233F` = **15.70:1**; dark `#05070B` vs ring `#F2F6FF` = **18.63:1**
- The outer adjacent colour = any surface: the lowest in light is **13.51:1** (safety-bg); the lowest in dark is **14.19:1** (success-bg)

**Both are ≥ 3:1, and neither depends on the fill colour of the focused element itself** — so the focus ring on a primary button (with its dark fill) is equally compliant. This is why the design deliberately uses two rings rather than one.

Rules:

- Use `:focus-visible`, not `:focus` (which avoids a focus ring lingering after a mouse click); but programmatic focus after a `<dialog>`/`alertdialog` opens must **force** the focus ring to show (drawn on `:focus` as well).
- **`outline: none` is forbidden**, including temporarily. It is a review grep item.
- The focus ring must be visible in every state: disabled elements do not receive focus (except in the cases that use `aria-disabled` and keep focusability, see §B.1.4); the focus ring's appearance does not change under hover/active/selected/error.
- The focus ring must never be clipped by `overflow: hidden`: `overflow: hidden` is **forbidden** on any container holding an interactive element, and where clipping is needed use `overflow: clip` + `overflow-clip-margin: var(--focus-ring-total)`.
- Focus order = DOM order = reading order. **Positive `tabindex` is forbidden**; using `order`/`row-reverse`/`grid-area` to change the visual order of interactive elements is **forbidden**.

---

### A.6 Motion tokens and reduced-motion (A6; Doc 20 §318, §297)

| Token | Value | Use |
|---|---|---|
| `--motion-duration-instant` | `0ms` | The reduced-motion override value |
| `--motion-duration-fast` | `120ms` | Colour/stroke changes (hover, focus) |
| `--motion-duration-normal` | `200ms` | Expand/collapse, dialog entry |
| `--motion-duration-slow` | `320ms` | Page-level block entry (sparingly) |
| `--motion-ease-standard` | `cubic-bezier(0.2, 0, 0.2, 1)` | General |
| `--motion-ease-enter` | `cubic-bezier(0, 0, 0.2, 1)` | Entry (decelerating) |
| `--motion-ease-exit` | `cubic-bezier(0.4, 0, 1, 1)` | Exit (accelerating) |

Rules:

- Motion **must never be the only carrier of information**: any state expressed by animation must have static words alongside it.
- **Forbidden**: celebratory motion, confetti, reward animations, streak animations — all forbidden for consent, matching, message volume and study completion (Doc 20 §297, explicitly).
- **No fake progress**: if the progress is unknown, use an indeterminate state (the words "working on it"), and do not draw a progress bar that runs to 90% and sticks (Doc 20 §224).
- **No autoplay**, no auto-rotating carousels, no infinitely looping animation.
- Focus **must not move** while AI output is streaming (Doc 20 §294); the streaming text container uses `aria-live="off"`, and on completion announces once via `role="status"`: "the draft is ready, please check it".
- Under `prefers-reduced-motion: reduce`: the existing global `animation:none/transition:none` is kept, **and** all `--motion-duration-*` are overridden to `0ms`, so that values derived through `calc()` go to zero as well. The substitute expression is an instant state change plus a change of words, not a cross-fade.

---

### A.7 Layering / elevation and z-index (A7; Doc 20 §319)

| Token | Value | Permitted for |
|---|---|---|
| `--elevation-0` | `none` | Page content, cards (the default) |
| `--elevation-1` | `0 1px 2px rgb(11 18 32 / 0.10), 0 0 0 1px rgb(11 18 32 / 0.06)` | Menus, dropdowns |
| `--elevation-2` | `0 4px 12px rgb(11 18 32 / 0.14), 0 0 0 1px rgb(11 18 32 / 0.08)` | Dialogs, sticky action bars |
| `--elevation-3` | `0 10px 28px rgb(11 18 32 / 0.20), 0 0 0 1px rgb(11 18 32 / 0.10)` | Transient overlays (one place only, see below) |

| Token | Value | Layer |
|---|---:|---|
| `--layer-base` | `0` | Ordinary content |
| `--layer-sticky` | `10` | Sticky action bars, sticky table headers |
| `--layer-header` | `20` | Contextual banners / workspace banners |
| `--layer-scrim` | `30` | The dialog scrim |
| `--layer-dialog` | `40` | `alertdialog` |
| `--layer-live` | `50` | The session-timeout warning (which must cover everything) |

Rules (Doc 20 §319):

- **Elevation must not signify scientific confidence, strength of evidence, approval authority or urgency.** A safety-critical error does not get a taller shadow for being "important" — it is expressed by position, persistence and words (§E.10).
- Shadows are nearly invisible in the dark theme, so every elevation carries its own `0 0 0 1px` outline ring; the dark theme replaces that ring with `--color-border-default`, keeping the overlay's boundary at ≥3:1 (this is already written into §F).
- At most one overlay layer per screen. **A dialog on top of a dialog is forbidden** (which also serves "one meaningful decision at a time" directly).

---

### A.8 Touch-target tokens (prerequisite for A8; Doc 20 §295)

| Token | Value | Notes |
|---|---|---|
| `--target-min` | `2.75rem` (44px at an 18px root) | The minimum tappable size, **applying to both width and height** |
| `--target-gap` | `0.5rem` (9px) | The lower bound on the **clear gap** between adjacent targets |
| `--target-hit-slop` | `0.25rem` | How far a `::before` must extend the hit area outwards when the visual size is under 44px |

The full rules are in §B.4.

---

### A.9 The icon system (A8; Doc 20 §320)

**No icon library is introduced** (dependency constraints + size + offline use). The approach: inline SVG in `apps/web/src/components/icons.tsx`, with `viewBox="0 0 24 24"`, `stroke="currentColor"`, `stroke-width="2"`, `fill="none"`, `aria-hidden="true"`, `focusable="false"`.

| Token | Value | Notes |
|---|---|---|
| `--icon-size-1` | `1em` | The same height as the inline text (inside a badge) |
| `--icon-size-2` | `1.25em` | Block-level state containers |
| `--icon-size-3` | `1.5em` | Beside a dialog title |
| `--icon-stroke` | `2` | Constant; raised to `2.5` in high-contrast mode |
| `--icon-gap` | `var(--space-2)` | The gap between icon and text |

**Icons that must carry a text label and must never appear alone** (listed explicitly in Doc 20 §320): AI, Block, Report, Visibility, Safety, Draft. This system tightens that to: **no icon may ever appear alone** — there is no such thing as an icon-only button here. Two reasons:

1. **The six Doc 20 names are exactly the ones with no settled pictogram.** There is no glyph a reader reliably reads as "this was written by a machine", "this person can no longer reach you", or "only you can see this" — unlike, say, a printer or a magnifying glass. The people using this are older adults and people with low digital confidence, for whom a guessed icon is not a small cost: guessing wrong about Block or Visibility means acting on a belief about who can see them that is false.
2. **An icon-only button's accessible name has to come from `aria-label`**, which separates the accessible name from the visible words and conflicts with the existing test strategy, where the visible words *are* the accessible name (§G).

**The shapes must differ from one another** (this is the channel that distinguishes them in greyscale and for colour-blind readers):

| Semantics | Outline shape | Description |
|---|---|---|
| info | Circle ○ | An i inside a circle |
| success | Circle + tick ✓ | A tick inside a circle |
| warning | Triangle △ | An exclamation mark inside a triangle |
| danger | Octagon ⯃ | An exclamation mark inside an octagon (clearly different from the warning triangle) |
| safety | Shield ⛊ | A shield outline |
| moderation | Square ▢ | A flag inside a square |
| ai | Diamond ◇ | A star point inside a diamond (understated; it does not glow and is not rainbow-coloured) |
| draft | Folded-corner page | A rectangle with the top-right corner turned |
| private / visibility | Closed lock / open globe | The two extremes have the greatest possible difference in shape |
| offline | Broken cloud | A cloud with a slash |
| stale / conflict | Two offset circles | Two circles out of register |
| loading | Arc | Does not spin under reduced-motion; becomes a static arc plus words |

Acceptance: render the 12 icons as greyscale PNGs with no words, and ask 3 people, blind, whether they can tell each pair apart; redraw any that cannot be told apart. **This is a design acceptance item, not an automated one.**

---

## §B Global rules

### B.1 Colour must never be the only indicator of state — the state-presentation triple

#### B.1.1 The specification

Every presentation of a state = **icon + words + colour**, all three present and each usable on its own.

```html
<!-- Inline badge (visibility, epistemic type, delivery state, approval state) -->
<span class="badge badge--warning">
  <svg class="icon" aria-hidden="true" focusable="false"><!-- triangle --></svg>
  Draft — only you can see it
</span>
```

| Channel | Requirement | The fallback when it fails |
|---|---|---|
| **Icon** | `aria-hidden="true"`, decorative, shapes distinct from one another (§A.9) | If the icon does not render, the words still express the state in full |
| **Words** | The state name is a **real text node** and forms part of the accessible name; it **must not** exist only in `aria-label`/`title`/`::before content` | — |
| **Colour** | Reinforcement only. **With all colour removed, no information is lost** | — |
| (The fourth channel) **Structure** | Critical states additionally take a left-hand `--border-emphasis` bar or a container of their own | See §B.1.3 |

#### B.1.2 Three prohibitions

1. **`content:` must not carry state text** — `::before { content: "Approved" }` is not announced by some assistive technology, and is lost under a user stylesheet.
2. **Row state must not be distinguished by `background-color` alone** (table rows, queue rows). A row's state must have a column of words.
3. **Distinguishing by icon alone is forbidden** — see §A.9, there are no icon-only states.

#### B.1.3 The four channels for a critical state

A "critical state" = one that changes the user's judgement about consequences. The list (Doc 20 §43–45, §50):

- Lifecycle: Draft / Active / Paused / Completed / Withdrawn / Superseded / Retired / Archived
- Approval: Not Submitted / In Review / Returned for Revision / Approved / **Approved with Conditions** / Rejected / Superseded / Archived
- Resource: Usable / Restricted / Suspended / Expired / Deleted / Withdrawn / **Locked** / Unavailable
- Delivery: the seven existing `DELIVERY_STATE_LABELS` states (wording unchanged, see §G)
- Sync: saved locally / syncing / synced / conflict / sync failed / needs review
- Visibility: the six levels (§A.1.4)
- Epistemic type: the eleven categories in Doc 19 §10 (platform fact / participant-provided information / participant testimony / supporter contribution / human observation / human decision / retrieved evidence / AI inference / suggestion / draft / unknown)

These **must** use a block-level state container (4px left bar + tint background + icon + words); an inline badge alone is not sufficient.

#### B.1.4 Expressing the disabled state

Disabled is not an exception to the state triple, it is an instance of it:

- **Greying out the button alone is forbidden.** Beside a greyed-out button there must be a sentence saying **why**, and **what would make it available**.
- Prefer `aria-disabled="true"` + keeping it focusable + announcing the reason via `role="status"` on click, over the `disabled` attribute (a `disabled` element cannot be focused, so a keyboard user cannot discover why it is unavailable).
- The exception: during form submission (to prevent double submission) use a real `disabled`, and show "submitting…" at the same time.
- **Lack of permission is not expressed by a disabled state** — see §E.9, protected existence.

#### B.1.5 Acceptance

1. **The greyscale check**: screenshot under `filter: grayscale(1)`; every state is still distinguishable (manual, folded into the R1 expert walkthrough).
2. **The bare-HTML check**: disable all CSS; every state's words are still readable in the document flow (automatable: `document.body.innerText` contains the state name).
3. **The `content` grep**: hits from `grep -n "content: *['\"][^'\"]" styles.css` must not contain any state word.

---

### B.2 Focus visible in every state

See §A.5 for the tokens and the two-ring structure. The interaction rules follow here (Doc 20 §294):

| Moment | Where focus goes |
|---|---|
| Screen change (`setScreen`) | The `<h1>` inside `<main>` (`tabindex="-1"`, leaving no tab stop behind once focused) |
| A dialog opens | The dialog's title (`<h2 tabindex="-1">`), **not** the primary button — this avoids a mis-tap; `aria-labelledby` points at that title |
| A dialog closes | The button that opened it (a reference to which must be kept) |
| Validation fails | The first field in error; at the same time `role="alert"` announces the error summary |
| An action succeeds | Stays where it is, announced via `role="status"`; **focus does not jump** (which avoids "I have lost my place") |
| An action fails | Stays where it is, announced via `role="alert"`; focus does not move, so the user can correct and retry directly |
| Dynamic content is inserted (a list loads) | Focus does not move; `role="status"` announces the count |
| AI output streaming | **Focus never moves** (Doc 20 §294, explicitly) |

Rule: the focus ring must never be obscured by a sticky element — a sticky header or footer must reserve `scroll-padding-block` for the content behind it (§D.5).

---

### B.3 200% zoom and large text scaling: no horizontal scrolling

#### B.3.1 Structural rules

1. **Every dimension in `rem` / `%` / `ch` / `em`**; `px` is forbidden for layout (`px` is permitted only for "physical details" such as stroke widths, focus-ring widths and shadows).
2. **Breakpoints in `rem`** (§D.1): a larger browser font size → a narrower effective viewport → automatic degradation to a single column. This is a feature, not a defect (trade-off §H.3).
3. **Fixed `height` is forbidden**; use `min-height` only.
4. **`white-space: nowrap` is forbidden** on any user-visible text; it is permitted only for monospace identifiers, and only alongside a sibling `overflow-wrap: anywhere` strategy or inside the scrolling container from §B.3.2.
5. **`overflow-wrap: anywhere`** applies globally to body containers — a long identifier (`pt_b`, a UUID, a hash) must not burst the layout.
6. The top-level guard `html, body { overflow-x: clip; }` is not there to paper over problems; it is the last line of defence, and **any layout that triggers it is a defect**.

#### B.3.2 The only legitimate outlet for wide content

Tables, code blocks, ASCII wireframes and wide charts **must not** make the page scroll horizontally; they may only scroll inside their own container:

```html
<div class="scroll-x" role="region" aria-label="Participant list (scrolls horizontally)" tabindex="0">
  <table>…</table>
</div>
```

- It must have `tabindex="0"` (scrollable by keyboard) + `role="region"` + `aria-label` (saying that it scrolls).
- Border both sides of the container with `--color-border-default`, so that "there is more content here" is visible.
- On mobile, prefer an **alternative representation** (a card list) over scrolling; but see §D.4 on when it cannot be substituted.

#### B.3.3 Acceptance

- A 1280×1024 viewport at 200% zoom (equivalent to 640×512 CSS px) and at 320×256 CSS px: `document.documentElement.scrollWidth <= clientWidth`.
- Browser minimum font size set to 24px: the same assertion, plus every 44px target still not overlapping (§B.4).
- 400% zoom (WCAG 1.4.10's formal threshold, equivalent to 320px wide): single column, no content lost.

---

### B.4 Touch targets ≥44px and adjacent targets must not overlap — the anti-recurrence rules

> **Background (a real defect)**: buttons with `min-height: 2.75rem` appeared inside line boxes determined by `line-height: 1.6 × 18px = 28.8px`. The spacing between inline-level buttons was provided by JSX `{' '}` text nodes, so once they wrapped the line boxes stacked at the line height and the 44px-tall buttons overlapped one another. The current `styles.css` already carries a local patch for the **home-page list** (`main li > button { display: block }`), but that is a spot fix, not a rule — change the container and it comes back.

#### B.4.1 Five anti-recurrence rules

**R1 | A single source for the size**
`--target-min` is the only definition of the minimum target size. Component CSS **must not** write a literal height. The review grep: `min-height:\s*[0-9.]+(rem|px)` has zero hits outside `:root`.

**R2 | An interactive element must never take part in a text line box as an inline-level element**
Every `button`, `a[role="button"]`, `input`, `select`, `summary`, and anything with an `onClick`, must have a `display` of `block` / `flex` / `grid` / `inline-flex`. **`display: inline` is forbidden**, and `align-items: center` is required. The height of an inline-level element does not participate in line-box calculation (or participates uncontrollably), and that is the root cause of the defect.

**R3 | Spacing must come from the layout, never from a whitespace text node**
The gap between adjacent targets is always provided by the parent's `display: flex; gap: var(--target-gap)` or by the child's `margin-block`.
Using JSX `{' '}`, `&nbsp;` or `<br>` as the gap between buttons is **forbidden** — they are text, they collapse with the line height, and they go out of control as the font size changes.
> The existing code at `App.tsx:60–66` (`Enter / Supporter entrance / Staff entrance`) and places such as `MessagePanel` are separated by exactly this `{' '}`. Changing them to flex containers **changes no button's accessible name** (§G.2).

**R4 | An action in the content flow is a full-width block-level target**
Action buttons inside `<li>`, `<p>` or `<td>`: if that container holds only this one action, the button fills the row (`display: block; width: 100%; text-align: start`); if there are several actions, the parent becomes `display: flex; flex-wrap: wrap; gap: var(--target-gap)` and each button takes `flex: 1 1 auto; min-width: 12rem` (which guarantees that each row is still a complete tappable block after wrapping).

**R5 | A container must not compress a target**
A container holding interactive elements **must not** have: a fixed `height`; `overflow: hidden`; a `line-height` below `--target-min` combined with constrained overflow; or `max-height` plus clipping. Where clipping is needed, use `overflow: clip; overflow-clip-margin: var(--focus-ring-total)`.

#### B.4.2 Exceptions and hit-area expansion

Only two kinds of element are permitted to be **visually** smaller than 44px:

1. Inline links in body text (WCAG 2.5.8's inline exception)
2. Inline actions in a dense table — **and they must** use `::before` to expand the hit area to 44px:

```css
.target-inline { position: relative; }
.target-inline::before {
  content: '';
  position: absolute;
  inset: calc(-1 * var(--target-hit-slop));
  min-height: var(--target-min);
  min-width: var(--target-min);
  /* expanded, vertically centred */
  top: 50%; translate: 0 -50%;
}
```

**But**: once the hit area is expanded, the **hit rectangles** of adjacent targets must still not intersect — expansion does not exempt anything from R3's spacing requirement.

#### B.4.3 The automated regression assertion (recommended for CI)

This is the crux of preventing recurrence, not an optional extra:

```ts
// Pseudocode: jsdom has no layout, so this needs Playwright / a real browser
const targets = page.locator('button, a[href], input, select, [role="button"], summary');
const rects = await targets.evaluateAll(els => els.map(e => e.getBoundingClientRect()));

// 1) size
for (const r of rects) {
  expect(r.height).toBeGreaterThanOrEqual(44);
  expect(r.width).toBeGreaterThanOrEqual(44);
}
// 2) no intersection (including the clear gap of --target-gap)
const GAP = 8;
for (let i = 0; i < rects.length; i++)
  for (let j = i + 1; j < rects.length; j++) {
    const a = rects[i], b = rects[j];
    const overlapX = Math.min(a.right, b.right) - Math.max(a.left, b.left);
    const overlapY = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
    expect(overlapX > -GAP && overlapY > -GAP).toBe(false); // one axis must have a clear distance ≥ GAP
  }
```

**The run matrix**: 320px / 375px / 768px / 1280px wide × font size {default, 24px, 32px} × density {compact, standard, spacious} × zoom {100%, 200%, 400%}. At minimum, cover the worst combination: 320px × 32px × spacious × 200%.

#### B.4.4 Extra protection for critical controls (Doc 20 §295)

`Block`, `Report`, `Cancel`, `Go back` and `Withdraw` must be "reachable and hard to hit by accident":

- The clear gap between them and any **destructive/confirming** button is raised to `--space-5` (27px at standard density), rather than `--target-gap`.
- In a confirmation dialog, `Confirm…` and `Go back, do not…` are on separate rows (on mobile) or separated by `--space-5` (on a wide screen), **and the order is always "go back/cancel" first and "confirm" second** (which prevents a muscle-memory mis-tap).
  > Note: the **button wording and accessible names of the existing implementation** (such as `Confirm block` / `Go back, do not block`) stay unchanged; only the layout and the order are adjusted — and changing the order affects tests that go by DOM order, see §G.3.

#### B.4.5 Equal-weight choice pairs: where `.btn-primary` is forbidden (Doc 20 §13.7, no dark patterns)

When two options are **equal in value**, **neither** may use `.btn-primary`; they must have the same size, the same weight, the same stroke and the same colour, differing only in their words:

| Situation | The button pair | Requirement |
|---|---|---|
| A consent choice | `Agree to "…"` / `Decline "…"` | The two are visually identical. `consent-panel.test.tsx:34–37` already asserts that the two groups have equal button counts — **that test is this rule's existing guard, and must keep passing** |
| A match decision | `Interested` / `Not for now` | As above |
| Joining an optional activity | `Take part` / `Not this time` | As above |
| Withdrawal confirmation | `Confirm withdrawal of "…"` / `Go back, do not withdraw` | As above (withdrawal is the user's right, and "go back" must not be made to look preferable) |

`.btn-primary` is permitted only for a single forward action with **no opposing option** (`Save draft`, `Submit report`, `Enter`).
**Acceptance**: for each equal-weight pair, assert that `getComputedStyle`'s `backgroundColor`, `fontWeight` and `borderWidth` are exactly the same.

---

### B.5 Semantic HTML, and "no div soup introduced for visual reasons"

| Need | The correct approach | Forbidden |
|---|---|---|
| A card | `<article>` / `<section aria-labelledby>` | `<div class="card">` |
| A status badge | `<span class="badge">` containing real text | `<div>` + `::before content` |
| A queue/list | `<ul>` / `<ol>` + `<li>` | `<div role="list">` |
| A table | `<table><thead><th scope="col">` | `<div role="grid">` |
| A disclosure | `<details><summary>` | `<div onClick>` |
| A dialog | `<div role="alertdialog" aria-labelledby aria-modal="true">` (as it currently is) or `<dialog>` | A semantics-free overlay |
| A group | `<fieldset><legend>` | `<div>` + a visual heading |
| Layout | Adding a class to an **existing** semantic element to make it a flex/grid container | Adding a purely presentational `<div>` wrapper |

**The only non-semantic wrappers permitted to be added**: `.scroll-x` (§B.3.2, carrying `role="region"`) and `.app-shell` (the outermost flex container, which already exists as the `<div>` in `App.tsx`).

---

## §C Capability-adaptive modes (C; Doc 20 §286–287)

### C.1 The five switchable dimensions (audited 2026-08-13)

All of them drive token overrides through `data-*` attributes on `<html>`. **There is no JS logic anywhere that decides "who the user is".**

| Dimension | Attribute | Values | Token override | Is there a switch? |
|---|---|---|---|---|
| Font size | `data-font-scale` | `standard` (default) / `lg` / `xl` / `xxl` | `--scale-font` = 1 / 1.125 / 1.25 / 1.5 | ✅ |
| Density | `data-density` | `standard` (default) / `spacious` | `--density` = 1 / 1.25 (§A.3) | ✅ |
| Contrast | `data-contrast` | `standard` (default) / `high` | Colour tokens swap to the high-contrast set (**including all ten semantic families, see below**); `--border-default` → 3px; `--icon-stroke` → 2.5 | ✅ |
| Motion | `data-motion` | `system` (default) / `reduced` | All durations → 0ms | ✅ |
| Less colour | `data-stimulation` | `standard` (default) / `low` | All tint backgrounds → the page background; strokes, icons and text unchanged | ✅ **added 2026-08-13** |

**This last column was added by that audit, because it is what exposed the problem.** `data-stimulation` has had a complete block of rules since v0.1, and **no code had ever set the attribute** — the owner explicitly ranked the low-stimulation mode above a full dark mode, and all along it could not be turned on. The same audit found that `data-simplify` and `data-theme` had no writer either **(what was done about each is below)**. A test has been added: scan the stylesheet for every `:root[data-*=]` selector and look for a writer in `src/` for each one; if there is none, fail.

**`data-simplify` has been deleted.** It was empty at both ends: no writer, and **not one element in the whole application carries `.optional`**, so even if it were set, all it could do is change a line height of 1.6 to 1.8 — which is what the density preference already does. By the D-75 test, this class of thing is to be deleted rather than built: giving it a switch would mean building a control labelled "simplify" that, when pressed, only widens the line spacing. Genuine "one thing at a time" is work at the flow layer (see the Step-by-Step row in C.2).

**`data-theme` is kept as the "always light" switch (the D-79 correction), and dark mode is still defined solely by `prefers-color-scheme`.** On the day it was first deleted and then restored: the reason for deleting it — "it has no writer" — was true, but the action was wrong. The correct action on finding a capability with no writer is to build the writer. What exposed this was the owner seeing dark mode on their own phone with **no path back to light at all**. The single `:not()` in `:root:not([data-theme='light'])` is now the entire implementation of "always light": the light values are already in `:root`, so once the attribute is set the dark block stops matching. **"Always dark" is provided per the owner's ruling** (D-80): it genuinely does require duplicating the whole set of dark values, so the copy is generated by a script from the live block, and a test pins the two blocks token by token to be identical — duplication is not the danger, unwatched duplication is. All three options are **icon + words**: the icon is `aria-hidden`, the words are the accessible name, and the icon is bumped up one size step (☀/☾ occupy only half the em in most fonts).

#### C.1.1 High contrast is not just darkening the body text

The first version of high contrast covered body text, secondary text, links and buttons, and **left all ten semantic families untouched**: body text went from 12.38:1 up to 21:1, while warning / danger / story / ai **stayed put at around 4.50** — the hardest things on the screen to read did not change at all. **The person who turns this mode on is precisely the person who most needs to be able to read the sentence saying they were declined.** Every family is now pushed to AAA (≥7:1), with the background closer to white and the text darkened further along the same hue. The assertion: under high contrast every family must be **strictly higher** than in standard mode, or the mode is only a name.

### C.2 Mapping to the eight modes in Doc 20 §286 (an honest comparison)

| Doc 20 mode | How this system implements it | Notes |
|---|---|---|
| Standard | All the default values | ✅ Token override |
| High Visibility | `data-contrast="high"` + `data-font-scale="xl"` | ✅ Token override |
| Simple | ❌ **Deleted, see C.1** | It existed as `data-simplify` and was empty at both ends. Genuine simplification is work at the flow layer, the same piece of work as Step-by-Step |
| Low Stimulation | `data-stimulation="low"` (which can be combined with `data-motion="reduced"`) | ✅ Token override, **and it now has a switch** (it had none before 2026-08-13) |
| Step-by-Step | ❌ **Not something tokens can implement** | It needs the flow to be broken up (multi-step forms, one decision per step). That belongs to the I16 form family and is not covered by this document |
| Read-Aloud | ❌ **Not something tokens can implement** | It needs TTS capability and the multimodal consent of §300; see §I.4, open |
| Supporter-Assisted | ❌ **Not something tokens can implement** | It needs the permission model and a presentation of "who is acting on whose behalf"; see D2/§180–181 |
| Extended Time | ❌ **Not something tokens can implement** | It belongs to session-timeout policy (I14 / §296, §238) |

**This table is an honest declaration**: this design system delivers only the part of these four dimensions that tokens can implement. The other four modes must be designed separately at the flow layer, and it must not be claimed that "all eight modes are supported".

### C.3 Absolute prohibitions

1. **No automatic determination by age.** The system must not read, infer or use a date of birth or age band to preset any mode.
2. **No automatic determination by participant group** (such as "the intervention arm defaults to spacious") — that would become a confounding variable, and it treats a person as a category.
3. **No AI inference of capability** with an automatic switch.
4. **No changing someone's settings for them because they use assistive technology** — respecting an OS signal means using it as an **initial value**, never as a lock.

Signals permitted as an **initial value** (all of them are preferences the user has themselves set in their system, not inferences about the person):

| Signal | Mapping |
|---|---|
| `prefers-color-scheme` | light / dark |
| `prefers-contrast: more` | The initial value of `data-contrast="high"` |
| `prefers-reduced-motion: reduce` | Motion tokens go to zero |
| The browser's root font size | Takes effect naturally (rem) |

Once the user sets something explicitly, the user's value takes **permanent** precedence over the OS signal.

### C.4 Requirements on the control interface (Doc 20 §287)

| Requirement | Implementation |
|---|---|
| Easy to find | A fixed "Display and reading settings" item in the primary navigation of **every** workspace; not buried in a secondary menu |
| Previewable | A **live sample area** at the top of the settings screen (a paragraph of body text + a button + a status badge), changing immediately with each choice |
| Reversible | A "restore default" beside each dimension, and a "restore all defaults" at the foot of the page |
| Persistent | `localStorage` (changing to `sessionStorage` in shared-device mode, see §D.6) |
| Usable mid-task | The settings open as a `<dialog>` from any screen, **without unmounting the current screen or losing form input**; on close, focus returns to the triggering button |

**Implementation constraint**: the attribute is written on `<html>` and the token overrides are pure CSS, so switching does not trigger a React re-render and form state is preserved naturally. This is the reason for choosing `data-*` over React Context.

**Degradation without JS**: under `<noscript>` nothing can be switched, but the `prefers-*` media queries still apply — which is why high contrast and the dark theme **must** be written twice, as a media query and as an attribute selector (§F already does this).

---

## §D Responsiveness (A9; Doc 20 §301–307)

### D.1 Breakpoints (content-driven, in rem)

| Name | Condition | What content determines it |
|---|---|---|
| (base) | `< 40rem` | Single column. The participant's default form. All design starts here |
| `sm` | `≥ 40rem` (720px at 18px) | Two `min-width: 12rem` action buttons fit on one row |
| `md` | `≥ 56rem` (1008px) | A staff workspace can show side navigation + content in two columns |
| `lg` | `≥ 76rem` (1368px) | A staff workspace can show three columns, or "list + detail + context" side by side |

**In `rem` rather than `px`**: when a user sets their font size to 32px, 40rem = 1280px and most tablets fall back to a single column — a large-text user automatically gets a single column. This is deliberate (trade-off §H.3).

### D.2 Mobile-first layout rules

1. **The base styles are the mobile styles.** Every `@media` uses `min-width` only, never `max-width`.
2. **The participant workspace is a single column at every width**, with body text capped at `--measure-default`. A wide screen adds side margin only, never more columns. The reason: Doc 20 §13.2, "one meaningful decision at a time" — multiple columns inherently place multiple decisions side by side.
3. **A staff workspace** may split into columns at `md`/`lg`, but: the inside of any column is still a single-column flow; and the context for a decision must never be split from its confirm button across two columns (Doc 20 §13.3, "explain before asking", requires them visible on the same screen; splitting them across columns counts as a violation unless both columns are fully visible in the same viewport at once).

### D.3 Navigation

| Breakpoint | Participant | Staff |
|---|---|---|
| Base | A single-row horizontally scrolling top `<nav>` (as it is now) **or** a fixed bottom bar; see §I.2, open | A top `<nav>` that can wrap |
| `sm+` | A top `<nav>`, `flex-wrap: wrap`, every item ≥44px | As above |
| `md+` | As above (unchanged, staying single-column) | A persistent left sidebar (`<nav>` + `<ul>`), with the shell at `--measure-desktop` and body paragraphs still capped at `--measure-default` |

Rules:

- No more than 7 navigation items (the existing participant navigation has 6, which is compliant).
- `aria-current="page"` is already in the existing implementation and is kept; visually it uses three channels — **a 4px solid bar on the left/bottom + bold + colour** — not colour alone.
- **If bottom navigation is adopted on mobile**: the content area must be given `padding-block-end: calc(nav height + var(--space-5))`, and it must not obscure any confirm/cancel button (Doc 20 §304, "sticky but non-obscuring").

### D.4 Degrading a table to cards (and when not to)

| Situation | What to do on mobile |
|---|---|
| Purely presentational, ≤4 fields per row (a report queue, say) | Degrade to `<ul>` + `<li>` cards, each field as `<dl><dt>field name<dd>value` |
| Data that has to be compared across rows (dataset quality review, version comparison) | **Do not degrade.** Keep the `<table>` and put it in the `.scroll-x` container from §B.3.2 |
| A queue with inline actions | Degrade to cards, with the actions becoming full-width block-level buttons per R4 |

**Note**: degrading `<table>` → `<ul>` **changes the element's role**. If a test queries with `getByRole('table')` or `getByRole('row')`, the degradation will make it fail at a narrow viewport. None of the existing 34 tests query a table role (verified, see §G.1), but any table added in future must obey this: **a responsive degradation must not change a role across a breakpoint**. The correct approaches are to have both representations present in the DOM and shown/hidden by CSS, or to use only one of them throughout. This system chooses: **queues always use `<ul>` semantics, and on a wide screen CSS Grid arranges them to look like a table**, so the role is constant. Anything that genuinely needs `<table>` semantics (multi-dimensional data) never degrades and only scrolls.

### D.5 Sticky elements

- Stickiness is used only for: staff table headers, the action bar of a long form, and the session-timeout warning.
- A sticky element must be: `position: sticky` (not `fixed`), `z-index: var(--layer-sticky)`, and no more than 25% of the viewport in total height.
- Stickiness is cancelled when the viewport height is below `30rem` (a phone in landscape, a split screen): `@media (max-height: 30rem) { .sticky { position: static } }`.
- The page must set `scroll-padding-block-start: <sticky header height>` and `scroll-padding-block-end: <sticky footer height>`, or an element reached by Tab will be covered by the sticky bar (a hard requirement of focus visibility, §B.2).

### D.6 Shared settings and shared devices (Doc 20 §306–307)

This is not an appendix to responsiveness; it is a real setting for this platform (the shared tablet in a community centre).

| Requirement | The design |
|---|---|
| A discreet page title | `<title>` is always "Healthy Ageing Research Platform" and **contains no** participant name, community name or message content. Changing screen does not change the title (the screen name is carried by `<h1>` instead) |
| Notifications carry no content | Any browser notification or badge says only "1 new message", without the sender or the body |
| Privacy screen | A fixed "Cover the screen" item in the navigation → immediately covers the content with an opaque mask plus "Covered. Tap to continue". **The mask must be an opaque block of colour and must not use `filter: blur()`** (blur can be recovered by enhancing a screenshot, and a low-vision user mistakes it for a rendering fault) |
| Easy to sign out | "Sign out" is permanently visible in the navigation, within ≤2 taps (including one confirmation), and not buried in a menu |
| Fewer previews of recent content | In shared-device mode, list screens show only the other person's identifier and the time, with no message summary |
| A safe route home | Every screen has "Back to home", and the home screen contains no preview of any content |
| Explicit user switching | "Switch user" = clear `sessionStorage` entirely + return to sign-in |
| Short timeouts | In shared-device mode, a warning after 5 idle minutes and sign-out at 7 (in normal mode, 20/25 minutes); see §E.11 |
| The current identity is visible | The contextual banner permanently shows "Currently: {identifier}" on a `--color-surface-inverse` reversed bar, which cannot be dismissed |
| Local draft protection | In shared-device mode drafts are stored server-side only; nothing is written to `localStorage`, and preferences move to `sessionStorage` |

The **switch** for shared-device mode: an explicit checkbox on the sign-in page, "this is a shared device", **unticked** by default but with prominent wording. It must not be detected automatically (detection misjudges and cannot be explained).

**Status: implemented (2026-08-05).** The switch is an explicit checkbox on the sign-in page as this section requires, and **nothing is detected**. What landed: the permanent contextual banner (the current identity); the privacy screen (an opaque block of colour, with everything behind it set `inert` — without that step, pressing Tab from behind the mask walks every control on the page and the screen reader reads out, word for word, exactly what the mask exists to hide); "Switch user"; preferences moved to `sessionStorage`; the 5/7-minute short timeouts (§E.11); and `<title>` changed to a fixed title that does not name a role.

Three places deviate from this section, on the facts:

- **"Switch user = clear `sessionStorage` entirely" is not done literally**: the shared-device flag is stored there, and doing it literally would make the most protective setting vanish at the moment a stranger sits down. After clearing, the flag is written back; nothing about a person is written back (D-18).
- **The environment access password stays in `localStorage`**: it is the key to the prototype environment's door, not information about a person, and clearing it would lock the whole shared tablet out permanently (D-18).
- **"Fewer previews of recent content" needs no implementation**: the conversation list never showed message summaries in the first place, only the other person's identifier, the basis on which they may write to each other, and the conversation's state. The same goes for browser notifications — the platform has none, so there is no content to omit.

**One correction that came from measuring**: the first version of the banner (a full sentence plus two block-level buttons) occupied 304px at 320×844, i.e. 36% of the viewport, exceeding the 25% ceiling §D.5 sets for sticky elements. With the two buttons placed side by side it is 169–197px (20–23%); at the `xl`/`xxl` font sizes it still reaches 45%, so at those two sizes stickiness is **cancelled** — someone who has chosen a larger font is exactly the person with the least screen space, and nailing nearly half their viewport to a permanent banner is the wrong direction.

---

## §E State presentation specification (I11 / I12 / I13)

### E.0 The common structure and the constitution for wording

Every state presentation shares one structure (icon + title + explanation + action + optional technical detail):

```html
<div class="state state--{severity}" role="{status|alert|none}">
  <p class="state__head">
    <svg class="icon" aria-hidden="true" focusable="false">…</svg>
    <strong>{state title}</strong>
  </p>
  <p class="state__body">{what happened / what became of your content / what did not happen}</p>
  <p class="state__actions"><button>{the next action}</button></p>
  <details class="state__detail"><summary>Technical detail</summary><p><code>{code}</code></p></details>
</div>
```

**The constitution for wording (six clauses, all of them checkable)**:

1. **Say what can be done next.** The last sentence of every error, empty and offline message must be an action the user can take or a route to getting help.
2. **Do not blame the user.** Second-person fault constructions are forbidden.
   | Forbidden | Instead |
   |---|---|
   | You entered something wrong | This field needs {requirement}. |
   | You do not have permission | This is not visible in your current role. |
   | There is a problem with your network | The server cannot be reached right now. |
   | The operation failed, please retry | It was not saved. What you wrote is still here; you can press "Save draft" again. |
   | Invalid request | This submission was not accepted, because {specific reason}. |
3. **Say whether the work was saved.** Every error must answer, explicitly, "is what I just wrote still there?"
4. **Say what did not happen** (Doc 20 §231). For example: "the message was **not** sent." "The consent was **not** changed."
5. **Give no false comfort.** Unknown means unknown: "Delivery status unknown — being checked, which does not mean it succeeded" (the existing `DELIVERY_STATE_LABELS` is already compliant and is kept). "Almost done" and "it should be fine" are forbidden.
6. **A technical code is an optional detail only**: error codes go in a `<details>` whose summary reads "Technical detail". `ERR_*` never appears in the main text.
   > The existing code concatenates the error code straight into the main text (`Could not fetch the message record: ${err.error.code}`). This is one of the changes this specification requires; the impact is in §G.4.

**Announcement rules**:

| Severity | ARIA | Does it interrupt? |
|---|---|---|
| Loading/syncing/empty | `role="status"` (`aria-live="polite"`) | No |
| Informational | `role="status"` | No |
| Recoverable error | `role="alert"` | Yes (assistive technology interrupts) |
| Blocking error | `role="alert"` + focus moves to the container | Yes |
| Safety-critical | `role="alertdialog"` + `aria-modal` | Yes, it takes over |
| Security-critical | `role="alertdialog"` + session handling | Yes, it takes over |

---

### E.1 Loading (Doc 20 §224)

| Item | Specification |
|---|---|
| Structure | `role="status"` + an icon (a static arc, which does not spin under reduced-motion) + words |
| Layout | **Preserve the layout**: the container keeps its final height (`min-height`), so content must not jump |
| Progress | **Fake progress bars are forbidden.** If it is not known, use indeterminate wording |
| Cancelling | Offered only where cancelling is safe (a read-only query can be cancelled; a write that has already been submitted cannot, and becomes "confirming, please do not submit again") |
| Timeout | At ≥10s, show a route to recovery |
| High-impact actions | Must wait for server confirmation; an optimistic update is **forbidden** (Doc 20 §224, final sentence) |

**Wording**

- Loading: `Loading {object}…`
- Submitting: `Submitting… please wait, and do not press again.`
- At ≥10s: `Still working on it. You can keep waiting, or go back a step and try again. What you wrote will not be lost.`
- A high-impact action waiting on the server: `Waiting for the server to confirm. Until it does, {object} has not been {action}.`
  - For example: `Waiting for the server to confirm. Until it does, this message has not been sent.`

### E.2 Skeletons (Doc 20 §225)

| Item | Specification |
|---|---|
| Applies to | Predictable, low-risk lists: the conversation list, the community post list, the contribution list |
| **Forbidden for** | Approval states, message delivery states, safety decisions, match results, dataset locking — these **never** use a skeleton, because the shape of the skeleton gets read as "the result already exists" |
| Accessibility | The skeleton blocks are `aria-hidden="true"`; the outer container has `role="status"` and contains the real words "loading the conversation list" |
| Motion | The shimmer sweep is permitted only at `--motion-duration-normal`; under `reduced-motion` it is a static grey block |
| Shape | Draw neutral grey bars only (`--color-surface-sunken`); **never** draw the shape of a badge, the shape of a button, or a tick |

### E.3 Empty states (Doc 20 §226)

Four questions must be answered, in a fixed order:

```text
[icon]  {why is it empty}
        {is this normal}
        {what you can do}      ← one clear action
        {where to get help}    ← a link or an explanation
```

| Situation | Wording |
|---|---|
| No messages | **No messages yet.**<br>You have not started a conversation with anyone, which is perfectly normal.<br>[See who you can contact]<br>Not sure how to start? You can contact the research team from "Help and safety". |
| No connections | **You have not made any connections yet.**<br>A connection needs both people to say they are willing, and that takes a little time.<br>[Look at "Meet new people"] (optional — you can always not take part)<br>—— |
| No match candidates | **There is nobody to suggest right now.**<br>This does not mean something has gone wrong: suggestions are based on your interests and settings, and sometimes there simply is not a good fit.<br>[Look at my interest settings]<br>—— |
| No community posts | **There are no posts in "{community name}" yet.**<br>This community has just started and nobody has posted anything.<br>[Write the first one (it is saved as a draft first, and only you can see it)]<br>—— |
| No life story | **You have not added a life story yet.**<br>This is entirely voluntary, and not adding one does not affect your part in the research.<br>[Find out what a life story is]<br>—— |
| Nothing to do (home) | **Nothing needs you today.**<br>This is normal; the research does not have a task every day.<br>[Look at my consent choices]<br>—— |
| An empty queue (staff) | **There are no {object} waiting.**<br>The queue is empty.<br>[View the records already handled]<br>—— |

**Prohibitions**: an empty state must not say things like "go and meet some new people!"; it must not use illustration to imply "you are lonely"; and the empty state of an optional feature must say plainly that it is "optional" and that "it is fine not to take part".

### E.4 Offline (Doc 20 §227)

```text
[broken-cloud icon] You are offline right now
                    You can still read what has already loaded, but not anything new.
                    Right now you **cannot**: send a message, confirm a change to your consent, or submit a report.
                    Drafts you write are saved on this device and will sync once you are back online.
                    [Check the connection again]
```

| Item | Specification |
|---|---|
| Position | A persistent banner at the top of the page (`--layer-header`), not dismissible until the connection returns |
| ARIA | `role="status"`; on recovery it announces "you are back online" |
| Scope of disabling | **Every high-impact action is disabled** (send, confirm, approve, lock, withdraw consent, submit a report). When disabled, give the reason in words per §B.1.4 |
| Drafts | State plainly that they are stored locally; in shared-device mode **nothing is stored locally**, and the wording becomes "drafts cannot be saved while offline. Please copy what you have written, or wait until you are back online." |
| Prohibition | The user must never be led to believe that a button pressed while offline "will queue and succeed". There is no implicit queue |

### E.5 Syncing (Doc 20 §228)

Six states, and **"saved locally" must be distinguished from "confirmed by the server"**:

| State | Icon | Wording | Colour |
|---|---|---|---|
| Saved locally | Folded-corner page | `Saved on this device — not uploaded yet` | info |
| Syncing | Arc | `Uploading…` | info |
| Synced | Circle + tick | `Saved to the server` | success |
| Conflict | Two offset circles | `This was changed somewhere else — you need to choose what to do` | warning |
| Sync failed | Octagon | `The upload did not succeed. Your content is still on this device and you can try again.` | danger |
| Needs review | Flag in a square | `Uploaded, waiting for a member of staff to review it` | moderation |

**The iron rule (Doc 20 §228, final sentence)**: a local save is **never** presented as "published" or "sent". The `success` green is permitted only for "confirmed by the server".

### E.6 Stale (Doc 20 §229)

```text
[two-offset-circles icon] What you are looking at is not the latest version
                          This page loaded at {time}, and {object} has been changed since.
                          You are now seeing the latest version (version {n}).
                          What changed: {summary of the difference}
                          [Continue with the latest version]  [Look at what changed first]
```

| Item | Specification |
|---|---|
| Trigger | The server's version number ≠ the version number the page holds |
| Behaviour | **Load the latest version automatically**, show the difference, and let the user redo or revise |
| Not ignorable | Staleness on Consent / Block / MutualAcceptance / DatasetLock **must block** the action, with no "ignore" option offered (Doc 20 §229, final sentence) |
| Wording | Do not say "your page has expired" (blame); say "this page loaded at {time}" (a statement) |

### E.7 Version conflict (I12; Doc 20 §230)

```text
[two-offset-circles icon] Your changes and someone else's have collided
                          Your draft has **not** been lost, and it has **not** overwritten the other changes.
                          Your version (version {a}, edited by you at {t1})
                          The version on the server (version {b}, edited by {who} at {t2})
                          [Compare side by side]
                          [Merge]  [Start again from the server's version]  [Save as a copy]  [Cancel]
```

| Item | Specification |
|---|---|
| The first guarantee | The draft is kept, and **silent overwriting is forbidden** (Doc 20 §230) |
| Must be shown | Both version numbers, who edited, when they edited, and the difference |
| Actions | Merge / refresh / save as a copy / cancel — offer the subset that applies to the situation, and do not offer the ones that do not |
| Attribution | "Who the other person is" is shown only where that user is visible to the current user; otherwise "another member of staff with permission" (protected existence, §E.9) |
| Severity | Blocking (`role="alert"` + focus moves in) |

### E.8 The four levels of error severity (I13; Doc 20 §232–237)

First, level 0: **informational is not an error**, and **must not use the warning style** (Doc 20 §233). Use the `info` semantic colour, `role="status"`, and do not interrupt.

| Level | Semantic colour | Placement | Persistence | Interrupts | Escalation |
|---|---|---|---|---|---|
| 0 informational | info | Inline, close to the point | Until the state changes | No | None |
| 1 **recoverable** | warning | Inline, next to where it went wrong | Until resolved | `role="alert"` | None |
| 2 **blocking** | danger | Top of the content area, replacing the action area | Until resolved | `role="alert"` + focus moves in | Offers a support route |
| 3 **safety-critical** | safety | Modal takeover | Until a person handles it | `alertdialog` | Routes to accountability review |
| 4 **security-critical** | danger (solid) | Modal takeover + session handling | Until re-authentication | `alertdialog` | Hides protected detail |

#### Level 1 · recoverable (§234)

**Required**: keep the input / say how to correct it / safe retry / an alternative route / a way to get help.

```text
[triangle] This message has not been saved
           What you wrote is still in the box below; it has not been lost.
           The reason: the content is over 2000 characters — it is currently 2140.
           Please remove some of it and press "Save draft" again.
           > Technical detail: VALIDATION_TOO_LONG
```

Other patterns:

- A required field left empty: `This field needs to be filled in: {field name}. Once it is, you can continue.` (focus moves to that field)
- A momentary network drop: `The server could not be reached. What you wrote is still here. [Try again]`
- Retry safety: where a retry is safe, say "[Try again]"; where it is uncertain whether it took effect, say "this request may already have taken effect. Please [refresh to see the result] first, rather than retrying directly."

#### Level 2 · blocking (§235)

**Required**: say which action was blocked / do not blame / preserve the earlier work / give a clear route to resolution or help.

```text
[octagon] You cannot post to "Gardening Corner" right now
          Your draft has been saved. It has not been lost, and it has not been published.
          The reason: this community's rules were updated to version 3 after you joined, and you need to read the new rules first.
          [Read version 3 of the rules]
          If you think this is wrong, you can contact the research team from "Help and safety".
```

Other patterns:

- A missing precondition: `To {do this}, you need to {precondition} first. [Go to {precondition}]`
- The state does not allow it: `This {object} is currently "{state}", and it cannot be {action} in that state. [Read about the states]`
- Self-approval under two-person approval: `You submitted this, so it needs a colleague with permission to approve it. [See who else can approve]`
  > The existing `staff-queues.test.tsx` asserts `/that is you, so you cannot approve it/`. Changing the wording would break that test, see §G.4.

#### Level 3 · safety-critical (§236)

**Required**: stop the unsafe action / keep emergency and support options visible at all times / route to accountability review / **give no false comfort**.

```text
[shield] Let us stop here for a moment
         We have not continued with what you were doing.
         What you wrote has been saved, and a member of staff will see it.

         If you or someone else is in danger right now, please call your local emergency number directly.
         This platform is not an emergency service.

         What happens next: this goes to a member of staff, and is not decided by an automated system on its own.
         [I understand]  [Contact the research team]
```

| Item | Specification |
|---|---|
| Structure | `role="alertdialog"` + `aria-modal="true"` + an associated title |
| The emergency route | The emergency-number text is **always present**; never collapsed, never inside a `<details>` |
| Prohibitions | Never say "everything is fine", "you are safe now" or "don't worry"; never promise a response time unless there is an SLA |
| Human authority | It must say plainly "handled by a member of staff, not decided by an automated system on its own" (Doc 20 §13.19) |
| Closing | A close button exists, but closing does not undo the accountability process already triggered; on close, focus returns to the trigger |
| Getting help is never blocked | This dialog **must not** obscure the route into "Help and safety" |

#### Level 4 · security-critical (§237)

**Required**: may end or restrict the session / hide protected detail / may require step-up authentication / give a safe route to help.

```text
[solid octagon] To protect the account, this action did not continue
                Nothing has been changed.
                This action needs your identity confirmed once more.
                [Verify your identity again]
                If this was not you, please contact us through {support channel}.
```

| Item | Specification |
|---|---|
| Minimise information | **Do not explain the specific trigger** (which would leak the detection rules); do not show IP, device, time or other detail that could be used to probe |
| Protected detail | Sensitive content already rendered on the page is masked immediately |
| Step-up | If MFA is needed: say why ("this step locks a research dataset and cannot be undone"), not merely "MFA required" |
| Ending the session | If sign-out is unavoidable: save the draft to the server first, and after signing out say "what you wrote has been saved, and it will still be there when you sign back in" |
| Help | The route to help must be **out of band** (it must not depend on the session that has been restricted) |
| Prohibition | Do not blame ("unusual activity detected" → "this action needs your identity confirmed once more") |

### E.9 Protected existence (I3; ADR-050, Doc 20 §27)

**One form of words across every state.** The backend already enforces not leaking existence, and the frontend must have a single presentation of it:

```text
[closed-lock icon] This could not be found
                   It may not exist, or it may be something you cannot see right now.
                   We do not distinguish between the two, in order to protect everyone's privacy.
                   [Back to {the level above}]
```

| The iron rules | Notes |
|---|---|
| 404 and 403 have **exactly the same frontend presentation** | No different wording, no different icon, no different colour |
| Never say "you do not have permission" | That confirms the object exists |
| Never disable instead of hiding | A "greyed-out button" leaks that "there is something here" |
| From the blocked person's point of view | Someone who has been blocked sees "not found", not "you have been blocked" |
| The loading state must not leak either | Do not render a skeleton and then turn it into a 404 — the skeleton's shape leaks the object's type |

### E.10 Severity is not expressed by elevation (Doc 20 §319)

The "importance" of a safety-critical error is expressed by **position (modal) + persistence (it does not disappear on its own) + words (the consequence stated plainly) + semantic colour + icon**.
**Forbidden**: giving a level 3/4 error a bigger shadow, a glow, an animated border, or a sound.

### E.11 Session timeout (I14; Doc 20 §238–239)

| Mode | Warning | Sign-out |
|---|---|---|
| Normal | After 20 idle minutes | 25 minutes |
| Shared device | After 5 idle minutes | 7 minutes |

The structure of the warning (`--layer-live`, the topmost layer):

```text
[arc] You will be signed out automatically in {mm:ss}
      This is to protect your privacy.
      What you wrote has been saved as a draft.
      [Keep using it]  [Save and sign out]
```

Rules:

- The countdown **must** also be in words (not a progress bar alone) and use `role="timer"`; it updates `aria-live="polite"` every 30 seconds (not every second, which would flood).
- After the timeout, sensitive content is hidden and the page shows the neutral "you have been signed out automatically. You can carry on after signing in again."
- **A timeout must not silently void a consent or an assessment** (Doc 20 §296): a consent change or assessment in progress must be written to a draft before the timeout, so it can be continued after signing back in.
- Offering an "extend" is conditional on extending being safe; in shared-device mode unlimited extension is **not offered**, and it may be extended at most once.

**Status: implemented (2026-08-05).** The two sets of limits, the countdown in words with `role="timer"`, the `aria-live="polite"` announcement on the half-minute (carried by a separate hidden region — putting a number that changes every second into the announced region buries everything else), the single extension on a shared device against unlimited in normal mode, and the return to the sign-in page with a neutral explanation after a timeout: all of it has landed.

Three places deviate from this section, on the facts:

- **It does not say "what you wrote has been saved as a draft"**: this platform saves drafts nowhere, so that sentence would make a promise at the exact moment it is about to be broken. It says "anything you have typed and not sent or saved will be lost" instead, and a test holds the original wording out (D-20). The rule above — that a timeout must not silently void a consent change or assessment in progress — can only be satisfied by "warn first, then sign out" until a draft mechanism exists; it cannot be satisfied by "it is already saved".
- **It is a dialog, not a sticky bar**: §D.5 both lists this warning as a sticky element and requires sticky elements to be ≤25% of the viewport in total height, and measuring shows the two rules contradict each other — at 320×844 this passage occupies 665px (79%), and 790px at `xxl`. The only way to fit it into 211px is to delete the sentence saying what will be lost, which is the reason it exists. The 25% ceiling governs persistent chrome that coexists with content; an interrupting warning is itself the content at that moment (D-19). **It has no scrim and does not declare `aria-modal`**: clicking behind it *is* "the person is still here", so the timer resets and the warning goes away.
- **"Idle" counts presses and keystrokes only, not pointer movement**: a sleeve resting on a trackpad should not count as "the person is still here".

---

## §F CSS draft (paste straight into `apps/web/src/styles.css`)

> ## ⚠️ SUPERSEDED — do not paste this draft over the current stylesheet
>
> This is the **v0.1 draft**, written when the palette was blue and
> `apps/web/src/styles.css` was 95 lines long. Both statements stopped being
> true when the system was re-palletised to Calm Teal & Warm Sand: the
> primary action colour here is `#1a4fa0`, and in the live stylesheet it is
> `#287c78`. The whole colour section below is the old palette.
>
> The **live stylesheet is the source of truth** for every token value, and
> `apps/web/test/design-tokens.test.ts` asserts against it, not against this
> appendix. Anyone following the original instruction below — "replace the
> entire contents of the existing file" — would revert the palette, the
> capability-adaptive modes and the staff desktop layout in one paste.
>
> This section is kept because the *structure* it lays out is still the
> structure in use — the ordering of the token layers, what belongs in
> `:root`, the two-ring focus treatment, the R1–R5 target rules. Read it for
> the shape, take the values from the stylesheet.
>
> *(Original note, kept as written: this draft has not been written into
> `apps/web/src/styles.css`; per the brief it is delivered as an appendix
> only. Once landed, the items marked "needs a code change" in §G must be
> carried out at the same time, or some of the rules — such as flex spacing
> replacing `{' '}` — will not take effect.)*

```css
/* =============================================================
   Healthy Ageing Research Platform — design system foundation v0.1
   Doc 20 v1.3 §285–320 / WCAG 2.2 AA
   The rule: component styles reference semantic tokens only; no literal
   colour value, px or ms may appear outside this file.
   ============================================================= */

/* ---------- 1. Tokens: non-colour (theme-independent) ---------- */
:root {
  /* -- The two capability-adaptive multipliers (§C) -- */
  --scale-font: 1;
  --density: 1;

  /* -- Typography (§A.2) -- */
  --type-family-ui: system-ui, -apple-system, 'PingFang SC', 'Noto Sans CJK SC',
    'Microsoft YaHei', sans-serif;
  --type-family-mono: ui-monospace, SFMono-Regular, Menlo, 'Noto Sans Mono CJK SC', monospace;

  --type-size-0: 0.833rem;
  --type-size-1: 1rem;
  --type-size-2: 1.125rem;
  --type-size-3: 1.333rem;
  --type-size-4: 1.602rem;
  --type-size-5: 1.924rem;
  --type-size-6: 2.311rem;

  --type-leading-tight: 1.25;
  --type-leading-snug: 1.4;
  --type-leading-normal: 1.6;
  --type-leading-loose: 1.8;

  --type-weight-regular: 400;
  --type-weight-medium: 500;
  --type-weight-semibold: 600;
  --type-weight-bold: 700;

  --type-tracking-normal: 0;
  --type-tracking-mono: 0.02em;

  --measure-narrow: 28rem;
  --measure-default: 36rem;
  --measure-wide: 56rem;

  /* -- Spacing (§A.3): one scale × the density multiplier -- */
  --space-0: 0;
  --space-1: calc(0.25rem * var(--density));
  --space-2: calc(0.5rem * var(--density));
  --space-3: calc(0.75rem * var(--density));
  --space-4: calc(1rem * var(--density));
  --space-5: calc(1.5rem * var(--density));
  --space-6: calc(2rem * var(--density));
  --space-7: calc(3rem * var(--density));
  --space-8: calc(4rem * var(--density));
  --space-9: calc(6rem * var(--density));

  /* -- Shape and stroke (§A.4) -- */
  --radius-0: 0;
  --radius-1: 0.25rem;
  --radius-2: 0.5rem;
  --radius-3: 0.75rem;
  --radius-pill: 999rem;
  --border-hairline: 1px;
  --border-default: 2px;
  --border-strong: 3px;
  --border-emphasis: 4px;

  /* -- Focus (§A.5): constant; does not scale with density or font size -- */
  --focus-ring-width: 3px;
  --focus-ring-offset: 2px;
  --focus-halo-width: 2px;
  --focus-ring-total: calc(var(--focus-ring-width) + var(--focus-ring-offset));

  /* -- Touch targets (§A.8): constant -- */
  --target-min: 2.75rem;
  --target-gap: 0.5rem;
  --target-hit-slop: 0.25rem;

  /* -- Motion (§A.6) -- */
  --motion-duration-instant: 0ms;
  --motion-duration-fast: 120ms;
  --motion-duration-normal: 200ms;
  --motion-duration-slow: 320ms;
  --motion-ease-standard: cubic-bezier(0.2, 0, 0.2, 1);
  --motion-ease-enter: cubic-bezier(0, 0, 0.2, 1);
  --motion-ease-exit: cubic-bezier(0.4, 0, 1, 1);

  /* -- Layering (§A.7): elevation does not signify confidence or authority -- */
  --elevation-0: none;
  --elevation-1: 0 1px 2px rgb(11 18 32 / 0.1), 0 0 0 1px rgb(11 18 32 / 0.06);
  --elevation-2: 0 4px 12px rgb(11 18 32 / 0.14), 0 0 0 1px rgb(11 18 32 / 0.08);
  --elevation-3: 0 10px 28px rgb(11 18 32 / 0.2), 0 0 0 1px rgb(11 18 32 / 0.1);
  --layer-base: 0;
  --layer-sticky: 10;
  --layer-header: 20;
  --layer-scrim: 30;
  --layer-dialog: 40;
  --layer-live: 50;

  /* -- Icons (§A.9) -- */
  --icon-size-1: 1em;
  --icon-size-2: 1.25em;
  --icon-size-3: 1.5em;
  --icon-stroke: 2;
  --icon-gap: var(--space-2);
}

/* ---------- 2. Tokens: colour — Light (the default) (§A.1.1) ---------- */
:root {
  --color-surface-page: #ffffff;
  --color-surface-raised: #f7f8fa;
  --color-surface-sunken: #eef0f4;
  --color-surface-inverse: #1b1f26;
  --color-surface-scrim: rgb(11 18 32 / 0.55);

  --color-text-primary: #16191f;   /* 17.60:1 / page */
  --color-text-secondary: #4a5261; /*  7.86:1 / page */
  --color-text-inverse: #ffffff;   /* 16.53:1 / inverse */
  --color-text-link: #14448c;      /*  9.39:1 / page */

  --color-border-subtle: #d5dae2;  /* decorative only, 1.40:1 */
  --color-border-default: #767e8c; /*  4.09:1 / page */
  --color-border-strong: #414855;  /*  9.20:1 / page */

  --color-action-primary-bg: #1a4fa0;        /* 7.87:1 / page */
  --color-action-primary-fg: #ffffff;        /* 7.87:1 / bg   */
  --color-action-primary-bg-hover: #123b7c;  /* 10.81:1 / fg  */
  --color-action-primary-bg-active: #0d2e62; /* 13.16:1 / fg  */
  --color-action-secondary-fg: #14448c;
  --color-action-secondary-border: #1a4fa0;
  --color-action-secondary-bg-hover: #e8eef8;

  --color-focus-ring: #12233f; /* ≥13.51:1 against any surface; 15.70:1 against the halo */
  --color-focus-halo: #ffffff;

  --color-info-bg: #e8f1fa;
  --color-info-fg: #0f4c81;        /* 7.76:1 / info-bg */
  --color-info-border: #1a6bb0;    /* 5.56:1 / page */
  --color-success-bg: #e6f4eb;
  --color-success-fg: #14603a;     /* 6.69:1 / success-bg */
  --color-success-border: #1f7a4c; /* 5.32:1 / page */
  --color-warning-bg: #fbf0dc;
  --color-warning-fg: #6e4200;     /* 7.62:1 / warning-bg */
  --color-warning-border: #a16207; /* 4.92:1 / page */
  --color-danger-bg: #fdecec;
  --color-danger-fg: #991b1b;      /* 7.28:1 / danger-bg */
  --color-danger-border: #c02626;  /* 5.92:1 / page */
  --color-danger-solid-bg: #9b1c1c;
  --color-danger-solid-fg: #ffffff; /* 8.15:1 */
  --color-safety-bg: #e9edfa;
  --color-safety-fg: #152a6b;      /* 11.40:1 / safety-bg */
  --color-safety-border: #2b3f8f;  /* 9.50:1 / page */
  --color-moderation-bg: #e3f2f2;
  --color-moderation-fg: #0c5257;  /* 7.73:1 / moderation-bg */
  --color-moderation-border: #12747b; /* 5.51:1 / page */
  --color-ai-bg: #efedf5;
  --color-ai-fg: #46405c;          /* 8.43:1 / ai-bg */
  --color-ai-border: #6a6285;      /* 5.68:1 / page */

  --color-disabled-bg: #f0f1f4;
  --color-disabled-fg: #5f6673;    /* 5.12:1 / disabled-bg */
  --color-disabled-border: #a8aeb9;
}

/* ---------- 3. Tokens: colour — Dark (§A.1.2) ---------- */
/* Both forms coexist: the media query (which works without JS) + the attribute selector (an explicit user choice wins) */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) {
    --color-surface-page: #0e1116;
    --color-surface-raised: #161a21;
    --color-surface-sunken: #080a0e;
    --color-surface-inverse: #e9ecf2;
    --color-surface-scrim: rgb(2 4 8 / 0.66);

    --color-text-primary: #e9ecf2;   /* 15.98:1 / page */
    --color-text-secondary: #a8b0be; /*  8.66:1 / page */
    --color-text-inverse: #0e1116;
    --color-text-link: #9cc0ff;      /* 10.26:1 / page */

    --color-border-subtle: #2a3039;
    --color-border-default: #6d7683; /*  4.11:1 / page */
    --color-border-strong: #99a2b0;  /*  7.34:1 / page */

    --color-action-primary-bg: #7fb0ff;        /* 8.61:1 / page */
    --color-action-primary-fg: #08101f;        /* 8.65:1 / bg */
    --color-action-primary-bg-hover: #a6c8ff;
    --color-action-primary-bg-active: #c2daff;
    --color-action-secondary-fg: #9cc0ff;
    --color-action-secondary-border: #7fb0ff;
    --color-action-secondary-bg-hover: #182231;

    --color-focus-ring: #f2f6ff; /* ≥14.19:1 against any surface; 18.63:1 against the halo */
    --color-focus-halo: #05070b;

    --color-info-bg: #10243a;
    --color-info-fg: #a9cff5;
    --color-info-border: #4c8fd6;
    --color-success-bg: #0e2a1d;
    --color-success-fg: #9fd9b7;
    --color-success-border: #3d9e6b;
    --color-warning-bg: #2e2208;
    --color-warning-fg: #f0ce8a;
    --color-warning-border: #c08a2e;
    --color-danger-bg: #331515;
    --color-danger-fg: #f5afaf;
    --color-danger-border: #d45c5c;
    --color-danger-solid-bg: #f5afaf;
    --color-danger-solid-fg: #1a0808;
    --color-safety-bg: #131a33;
    --color-safety-fg: #bcc9f5;
    --color-safety-border: #7186d6;
    --color-moderation-bg: #0b2628;
    --color-moderation-fg: #9fd6d8;
    --color-moderation-border: #3e9ea4;
    --color-ai-bg: #21202b;
    --color-ai-fg: #c4beda;
    --color-ai-border: #857da5;

    --color-disabled-bg: #171b22;
    --color-disabled-fg: #8b93a1;
    --color-disabled-border: #3a414c;

    /* Shadows are invisible in dark: use an outline ring as the overlay's boundary instead (≥3:1) */
    --elevation-1: 0 0 0 1px var(--color-border-default);
    --elevation-2: 0 0 0 1px var(--color-border-default), 0 4px 12px rgb(0 0 0 / 0.6);
    --elevation-3: 0 0 0 1px var(--color-border-strong), 0 10px 28px rgb(0 0 0 / 0.7);
  }
}
/* The user has explicitly chosen dark (same values as above; the attribute selector beats the media-query default) */
:root[data-theme='dark'] {
  --color-surface-page: #0e1116;
  --color-surface-raised: #161a21;
  --color-surface-sunken: #080a0e;
  --color-surface-inverse: #e9ecf2;
  --color-surface-scrim: rgb(2 4 8 / 0.66);
  --color-text-primary: #e9ecf2;
  --color-text-secondary: #a8b0be;
  --color-text-inverse: #0e1116;
  --color-text-link: #9cc0ff;
  --color-border-subtle: #2a3039;
  --color-border-default: #6d7683;
  --color-border-strong: #99a2b0;
  --color-action-primary-bg: #7fb0ff;
  --color-action-primary-fg: #08101f;
  --color-action-primary-bg-hover: #a6c8ff;
  --color-action-primary-bg-active: #c2daff;
  --color-action-secondary-fg: #9cc0ff;
  --color-action-secondary-border: #7fb0ff;
  --color-action-secondary-bg-hover: #182231;
  --color-focus-ring: #f2f6ff;
  --color-focus-halo: #05070b;
  --color-info-bg: #10243a;
  --color-info-fg: #a9cff5;
  --color-info-border: #4c8fd6;
  --color-success-bg: #0e2a1d;
  --color-success-fg: #9fd9b7;
  --color-success-border: #3d9e6b;
  --color-warning-bg: #2e2208;
  --color-warning-fg: #f0ce8a;
  --color-warning-border: #c08a2e;
  --color-danger-bg: #331515;
  --color-danger-fg: #f5afaf;
  --color-danger-border: #d45c5c;
  --color-danger-solid-bg: #f5afaf;
  --color-danger-solid-fg: #1a0808;
  --color-safety-bg: #131a33;
  --color-safety-fg: #bcc9f5;
  --color-safety-border: #7186d6;
  --color-moderation-bg: #0b2628;
  --color-moderation-fg: #9fd6d8;
  --color-moderation-border: #3e9ea4;
  --color-ai-bg: #21202b;
  --color-ai-fg: #c4beda;
  --color-ai-border: #857da5;
  --color-disabled-bg: #171b22;
  --color-disabled-fg: #8b93a1;
  --color-disabled-border: #3a414c;
  --elevation-1: 0 0 0 1px var(--color-border-default);
  --elevation-2: 0 0 0 1px var(--color-border-default), 0 4px 12px rgb(0 0 0 / 0.6);
  --elevation-3: 0 0 0 1px var(--color-border-strong), 0 10px 28px rgb(0 0 0 / 0.7);
}

/* ---------- 4. Capability-adaptive mode overrides (§C) ---------- */
/* Never determined automatically by age or by group: these attributes are written onto <html> only by an explicit user setting. */
:root[data-font-scale='lg'] { --scale-font: 1.125; }
:root[data-font-scale='xl'] { --scale-font: 1.25; }
:root[data-font-scale='xxl'] { --scale-font: 1.5; }

:root[data-density='compact'] { --density: 0.75; }
:root[data-density='standard'] { --density: 1; }
:root[data-density='spacious'] { --density: 1.25; }

/* High contrast: the OS signal is the initial value, an explicit user choice wins */
@media (prefers-contrast: more) {
  :root:not([data-contrast='standard']) {
    --color-text-primary: #000000;
    --color-text-secondary: #16191f;
    --color-border-subtle: #414855;
    --color-border-default: #16191f;
    --color-border-strong: #000000;
    --color-action-primary-bg: #0b2e6b;
    --color-action-secondary-fg: #0b2e6b;
    --border-default: 3px;
    --icon-stroke: 2.5;
  }
}
:root[data-contrast='high'] {
  --color-text-primary: #000000;         /* 21.00:1 / #ffffff */
  --color-text-secondary: #16191f;
  --color-border-subtle: #414855;
  --color-border-default: #16191f;
  --color-border-strong: #000000;
  --color-action-primary-bg: #0b2e6b;    /* 12.98:1 against a #ffffff foreground */
  --color-action-secondary-fg: #0b2e6b;
  --border-default: 3px;
  --icon-stroke: 2.5;
}
:root[data-theme='dark'][data-contrast='high'],
:root[data-contrast='high'][data-theme='dark'] {
  --color-surface-page: #000000;
  --color-text-primary: #ffffff;         /* 21.00:1 / #000000 */
  --color-text-secondary: #e9ecf2;
  --color-border-default: #e9ecf2;
  --color-border-strong: #ffffff;
  --color-action-primary-bg: #bbd4ff;    /* 13.97:1 against a #000000 foreground */
  --color-action-primary-fg: #000000;
}

/* Simplified mode: hide secondary content and increase the line height. Components mark omissible content with .optional. */
:root[data-simplify='on'] { --type-leading-normal: 1.8; }
:root[data-simplify='on'] .optional { display: none; }

/* Low-stimulation mode: remove every tint background, leaving strokes and text */
:root[data-stimulation='low'] {
  --color-info-bg: var(--color-surface-page);
  --color-success-bg: var(--color-surface-page);
  --color-warning-bg: var(--color-surface-page);
  --color-danger-bg: var(--color-surface-page);
  --color-safety-bg: var(--color-surface-page);
  --color-moderation-bg: var(--color-surface-page);
  --color-ai-bg: var(--color-surface-page);
}

/* ---------- 5. Base typography and the document ---------- */
:root {
  font-family: var(--type-family-ui);
  font-size: calc(112.5% * var(--scale-font)); /* the 18px baseline × the user's font size */
  line-height: var(--type-leading-normal);
  color-scheme: light dark;
  color: var(--color-text-primary);
  background-color: var(--color-surface-page);
  /* A sticky header/footer must not cover an element reached by Tab (§D.5) */
  scroll-padding-block: var(--space-8);
}

html,
body {
  /* The last line of defence: any layout that triggers it is a defect (§B.3.1) */
  overflow-x: clip;
}

body {
  margin: 0;
  padding: 0;
  color: var(--color-text-primary);
  background-color: var(--color-surface-page);
  /* A long identifier must not burst the layout */
  overflow-wrap: anywhere;
  word-break: normal;
}

h1, h2, h3, h4 {
  line-height: var(--type-leading-tight);
  font-weight: var(--type-weight-semibold);
  margin-block: var(--space-5) var(--space-3);
  text-wrap: balance;
}
h1 { font-size: var(--type-size-5); }
h2 { font-size: var(--type-size-4); }
h3 { font-size: var(--type-size-3); }
h4 { font-size: var(--type-size-2); }

p, li { max-width: var(--measure-default); }
p { margin-block: var(--space-3); }

small { font-size: var(--type-size-0); }
code, kbd, samp {
  font-family: var(--type-family-mono);
  letter-spacing: var(--type-tracking-mono);
  background-color: var(--color-surface-sunken);
  padding-inline: var(--space-1);
  border-radius: var(--radius-1);
}
a { color: var(--color-text-link); }

/* ---------- 6. The application shell and layout ---------- */
.app-shell {
  display: flex;
  flex-direction: column;
  min-height: 100svh;
}

main {
  display: block;
  width: 100%;
  max-width: var(--measure-default);
  margin-inline: auto;
  padding: var(--space-5) var(--space-4) var(--space-8);
  box-sizing: border-box;
}
/* Staff workspaces are wider (Doc 20 §301: staff may use a wider layout) */
main[data-workspace='staff'] { max-width: var(--measure-wide); }

section { margin-block-end: var(--space-6); }

/* The only legitimate outlet for wide content (§B.3.2) */
.scroll-x {
  overflow-x: auto;
  border: var(--border-default) solid var(--color-border-default);
  border-radius: var(--radius-2);
  padding: var(--space-2);
}

/* ---------- 7. Focus: two rings, visible on every surface and in every state (§A.5) ---------- */
:focus-visible {
  outline: var(--focus-ring-width) solid var(--color-focus-ring);
  outline-offset: var(--focus-ring-offset);
  /* The halo fills the offset gap, keeping the inner adjacent contrast ≥3:1 regardless of the element's fill colour */
  box-shadow: 0 0 0 var(--focus-halo-width) var(--color-focus-halo);
  border-radius: var(--radius-1);
}
/* Programmatic focus after a dialog opens must be visible (it is not :focus-visible at that point) */
[role='alertdialog'] :focus,
[role='alertdialog'][tabindex='-1']:focus,
h1[tabindex='-1']:focus,
h2[tabindex='-1']:focus {
  outline: var(--focus-ring-width) solid var(--color-focus-ring);
  outline-offset: var(--focus-ring-offset);
  box-shadow: 0 0 0 var(--focus-halo-width) var(--color-focus-halo);
}
/* The focus ring must not be clipped (§A.5) */
.scroll-x,
.card,
li,
section {
  overflow-clip-margin: var(--focus-ring-total);
}

.skip-link {
  position: absolute;
  left: -999rem;
}
.skip-link:focus {
  position: static;
  display: inline-block;
  padding: var(--space-2) var(--space-3);
  background-color: var(--color-surface-inverse);
  color: var(--color-text-inverse);
}

/* ---------- 8. Touch targets: the R1–R5 anti-recurrence rules (§B.4) ---------- */
/* R1: --target-min is the only source. R2: an interactive element is never inline-level. */
button,
input,
select,
textarea,
summary,
a[role='button'] {
  font: inherit;
  font-family: var(--type-family-ui);
  min-height: var(--target-min);
  box-sizing: border-box;
}

button,
a[role='button'],
summary {
  display: inline-flex;      /* R2: never display:inline */
  align-items: center;
  justify-content: flex-start;
  gap: var(--icon-gap);
  min-width: var(--target-min);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-1);
  border: var(--border-default) solid var(--color-action-secondary-border);
  background-color: var(--color-surface-page);
  color: var(--color-action-secondary-fg);
  font-weight: var(--type-weight-semibold);
  text-align: start;
  cursor: pointer;
  transition: background-color var(--motion-duration-fast) var(--motion-ease-standard);
}
button:hover,
a[role='button']:hover { background-color: var(--color-action-secondary-bg-hover); }

/* The primary action (at most one per screen, Doc 20 §13.2) */
.btn-primary {
  background-color: var(--color-action-primary-bg);
  border-color: var(--color-action-primary-bg);
  color: var(--color-action-primary-fg);
}
.btn-primary:hover { background-color: var(--color-action-primary-bg-hover); }
.btn-primary:active { background-color: var(--color-action-primary-bg-active); }

/* Destructive actions: colour is not the only indicator, and the component must carry an icon and explicit words as well */
.btn-danger {
  border-color: var(--color-danger-border);
  color: var(--color-danger-fg);
}

/* Disabled: must be accompanied by explanatory words (§B.1.4); prefer aria-disabled, which keeps it focusable */
button:disabled,
[aria-disabled='true'] {
  background-color: var(--color-disabled-bg);
  border-color: var(--color-disabled-border);
  color: var(--color-disabled-fg);
  cursor: not-allowed;
}

/* R3: spacing comes from the layout; a whitespace text node must never provide it. */
/* Every group of side-by-side actions uses this container (replacing the {' '} in the JSX). */
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--target-gap);
  align-items: stretch;
  margin-block: var(--space-4);
}
.actions > button,
.actions > form > button,
.actions > a[role='button'] {
  flex: 1 1 auto;
  min-width: 12rem;          /* R4: after wrapping, each row is still a complete tappable block */
}
/* B.4.4: extra clear distance between critical controls and confirm buttons */
.actions--critical { gap: var(--space-5); }
/* Confirmation dialogs: cancel always first, confirm second; stacked vertically on a narrow screen */
.actions--confirm { flex-direction: column; gap: var(--space-5); }
@media (min-width: 40rem) {
  .actions--confirm { flex-direction: row; }
}

/* R4: a single action in the content flow = a full-width block-level target (keeping and generalising the existing home-page patch) */
main li,
main p { margin-block: var(--space-3); }
main li > button,
main li > form > button,
main li > a[role='button'] {
  display: flex;
  width: 100%;
  text-align: start;
}
main li + li { margin-block-start: var(--target-gap); }

/* R5: a container holding interactive elements must not compress a target */
main li,
.card,
.actions {
  height: auto;
  overflow: visible;
}

/* Forms */
label {
  display: block;
  font-weight: var(--type-weight-medium);
  margin-block-end: var(--space-1);
}
input,
textarea,
select {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  padding: var(--space-2) var(--space-3);
  border: var(--border-default) solid var(--color-border-default);
  border-radius: var(--radius-1);
  background-color: var(--color-surface-page);
  color: var(--color-text-primary);
}
textarea { min-height: calc(var(--target-min) * 3); line-height: var(--type-leading-normal); }
fieldset {
  border: var(--border-default) solid var(--color-border-default);
  border-radius: var(--radius-2);
  padding: var(--space-4);
  margin-block: var(--space-5);
}
legend { font-weight: var(--type-weight-semibold); padding-inline: var(--space-2); }

/* ---------- 9. Navigation ---------- */
nav ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: var(--target-gap);
}
nav {
  padding: var(--space-3) var(--space-4);
  border-block-end: var(--border-hairline) solid var(--color-border-subtle);
  background-color: var(--color-surface-raised);
}
nav li { max-width: none; margin: 0; }
/* aria-current in three channels: structure (the left bar) + weight + colour, never colour alone */
nav [aria-current='page'] {
  border-inline-start: var(--border-emphasis) solid var(--color-action-primary-bg);
  font-weight: var(--type-weight-bold);
  background-color: var(--color-action-secondary-bg-hover);
}

main ul { padding-inline-start: var(--space-5); }
main ul:not([class]) > li { max-width: var(--measure-default); }

/* ---------- 10. State presentation: icon + words + colour + structure (§B.1 / §E) ---------- */
.icon {
  inline-size: var(--icon-size-1);
  block-size: var(--icon-size-1);
  flex: none;
  stroke-width: var(--icon-stroke);
}

/* Inline badge: the words must be a real text node, never ::before content */
.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--icon-gap);
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-pill);
  border: var(--border-hairline) solid currentColor;
  font-size: var(--type-size-1);
  font-weight: var(--type-weight-medium);
}

/* Block-level state container: the fourth channel = the 4px structural bar on the left */
.state {
  display: flow-root;
  border-inline-start: var(--border-emphasis) solid var(--color-border-strong);
  border-radius: var(--radius-2);
  padding: var(--space-4);
  margin-block: var(--space-4);
  background-color: var(--color-surface-raised);
}
.state__head {
  display: flex;
  align-items: center;
  gap: var(--icon-gap);
  margin-block-start: 0;
  font-size: var(--type-size-2);
}
.state__head .icon { inline-size: var(--icon-size-2); block-size: var(--icon-size-2); }
.state__actions { display: flex; flex-wrap: wrap; gap: var(--target-gap); }
.state__detail { margin-block-start: var(--space-3); font-size: var(--type-size-1); }

.state--info,       .badge--info       { background-color: var(--color-info-bg);       color: var(--color-info-fg);       border-inline-start-color: var(--color-info-border); }
.state--success,    .badge--success    { background-color: var(--color-success-bg);    color: var(--color-success-fg);    border-inline-start-color: var(--color-success-border); }
.state--warning,    .badge--warning    { background-color: var(--color-warning-bg);    color: var(--color-warning-fg);    border-inline-start-color: var(--color-warning-border); }
.state--danger,     .badge--danger     { background-color: var(--color-danger-bg);     color: var(--color-danger-fg);     border-inline-start-color: var(--color-danger-border); }
.state--safety,     .badge--safety     { background-color: var(--color-safety-bg);     color: var(--color-safety-fg);     border-inline-start-color: var(--color-safety-border); }
.state--moderation, .badge--moderation { background-color: var(--color-moderation-bg); color: var(--color-moderation-fg); border-inline-start-color: var(--color-moderation-border); }
.state--ai,         .badge--ai         { background-color: var(--color-ai-bg);         color: var(--color-ai-fg);         border-inline-start-color: var(--color-ai-border); }
.state--draft,      .badge--draft      { background-color: var(--color-surface-sunken); color: var(--color-text-secondary); border-inline-start-color: var(--color-border-strong); }

/* Skeleton: never imitate the shape of a badge, a button or a tick (§E.2) */
.skeleton {
  background-color: var(--color-surface-sunken);
  border-radius: var(--radius-1);
  block-size: var(--type-size-2);
  margin-block: var(--space-2);
}

/* ---------- 11. Cards, quotations, dialogs ---------- */
.card {
  border: var(--border-default) solid var(--color-border-default);
  border-radius: var(--radius-2);
  padding: var(--space-4);
  margin-block: var(--space-4);
  background-color: var(--color-surface-raised);
  box-shadow: var(--elevation-0); /* a content card is not raised */
}

blockquote {
  border-inline-start: var(--border-emphasis) solid var(--color-border-strong);
  margin-inline: 0;
  padding-inline-start: var(--space-4);
  color: var(--color-text-secondary);
}

[role='alertdialog'] {
  border: var(--border-emphasis) solid var(--color-border-strong);
  border-radius: var(--radius-2);
  padding: var(--space-5);
  margin-block: var(--space-4);
  background-color: var(--color-surface-page);
  box-shadow: var(--elevation-2);
  z-index: var(--layer-dialog);
  max-width: var(--measure-narrow);
}

/* The contextual banner (the current identity, permanently shown on a shared device) (§D.6) */
.context-banner {
  background-color: var(--color-surface-inverse);
  color: var(--color-text-inverse);
  padding: var(--space-2) var(--space-4);
  position: sticky;
  inset-block-start: 0;
  z-index: var(--layer-header);
}

/* Tables: a wide table goes into .scroll-x, so the page never scrolls horizontally (§B.3.2) */
table { border-collapse: collapse; width: 100%; }
th, td {
  text-align: start;
  padding: var(--space-2) var(--space-3);
  border-block-end: var(--border-hairline) solid var(--color-border-subtle);
  line-height: var(--type-leading-snug);
}
th { font-weight: var(--type-weight-medium); background-color: var(--color-surface-sunken); }

/* ---------- 12. Responsiveness (§D): min-width only, mobile first ---------- */
@media (min-width: 40rem) {
  main { padding-inline: var(--space-5); }
}
@media (min-width: 56rem) {
  main[data-workspace='staff'] { padding-inline: var(--space-6); }
}
/* A short viewport (a phone in landscape, a split screen) cancels stickiness, so a critical action is never covered (§D.5) */
@media (max-height: 30rem) {
  .context-banner { position: static; }
}

/* ---------- 13. Motion and reduced-motion (§A.6) ---------- */
@media (prefers-reduced-motion: reduce) {
  :root {
    --motion-duration-fast: 0ms;
    --motion-duration-normal: 0ms;
    --motion-duration-slow: 0ms;
  }
  *,
  *::before,
  *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
    scroll-behavior: auto !important;
  }
}

/* ---------- 14. Print (the researcher checking an export) ---------- */
@media print {
  nav, .actions, .skip-link { display: none; }
  main { max-width: none; }
  .state, .card { break-inside: avoid; }
  /* Colour is inevitably lost in print — which is exactly why a state must carry an icon and words */
}
```

**Self-check of the draft (verified)**: **119** unique token names; **254** `--` declarations in total (colour 47×2 = 94, non-colour 72, adaptive-mode overrides 39, and the rest are the dark theme's elevation redefinitions); zero literal colour values in the component area; `px` appears only in stroke widths, focus rings and shadows; zero occurrences of `overflow: hidden`; zero occurrences of `outline: none`; `content:` appears only in the hit-area expansion pseudo-element of §B.4.2 (an empty string, carrying no text).

---

## §G Effect on the existing 34 tests and accessible names

> **Note on reading this section (added during the 2026-08-15 translation).**
> The strings quoted below are the Chinese interface copy that existed when
> this document was written. Decision D-9 later moved every user-visible
> string in the product to English, so the copy quoted here is a record of
> what the analysis was performed against, not of what the interface says
> today. Where the current English string is known it is given alongside;
> the analysis itself — which query styles break and which do not — is
> unaffected by the language of the strings.

### G.0 The basis for these judgements (verified)

`getNodeText` in `@testing-library/dom@10.4.1` (`node_modules/.pnpm/@testing-library+dom@10.4.1/.../get-node-text.js:12`):

```js
Array.from(node.childNodes)
  .filter(child => child.nodeType === TEXT_NODE && Boolean(child.textContent))
  .map(c => c.textContent).join('')
```

**It takes direct text child nodes only.** Three actionable conclusions follow:

1. **Adding an `<svg aria-hidden>` sibling** inside an element does not affect `getByText` (SVG produces no text node), and does not affect the accessible name either (`aria-hidden` is excluded from name computation).
2. **Wrapping a whole passage in a `<span>`** does not break `getByText('X')` — the match moves from the parent to that span and is still the single match.
3. **Splitting an asserted passage across two elements** does break the assertion. This is the one real risk.

### G.1 Checking the current state

- The query styles used across the 34 tests are: `getByRole('button'|'alert'|'alertdialog'|'status'|'note'|'list', {name})`, `getByLabelText`, `getByText`, and `textContent.toContain`.
- There are **no** `getByRole('table' | 'row' | 'cell' | 'grid')` queries → the table strategy in §D.4 currently conflicts with nothing.
- There is **no** `getByTestId` → a test id cannot be used to sidestep this.
- `getByRole('list', { name: 'message record' })` depends on `<ol aria-label="message record">`; styling that list must not remove the `aria-label`.

### G.2 Changes that do not alter an accessible name (safe to carry out directly)

| Change | Why it is safe |
|---|---|
| All tokens and base styles (the §F draft) | Pure CSS |
| Inserting `<svg class="icon" aria-hidden="true" focusable="false">` before the state text | Produces no text node; excluded from accessible-name computation |
| Wrapping side-by-side buttons in `<div class="actions">` and deleting the `{' '}` from the JSX | The buttons' own text is unchanged; `{' '}` was always a text node **outside** the button |
| Adding a `className` to an existing element | Does not affect role or name |
| Changing the inline `style={{...}}` in `MessagePanel` to a class | As above |
| Adding `data-workspace="staff"` to `<main>` | Attributes do not participate in name computation |
| Adding the `.app-shell` class to the outermost `<div>`, which already exists | That `<div>` already exists |
| Adding the "Display and reading settings", "Cover the screen" and "Sign out" navigation items | These **add** accessible names; the existing 6 are untouched |
| Adding empty states / skeletons / the offline banner | New elements |

### G.3 Changes that affect tests but do **not** alter an accessible name (the tests need adjusting alongside)

| Change | Effect | Recommendation |
|---|---|---|
| §B.4.4, standardising confirmation-dialog button order as "go back/cancel" first and "confirm" second | Queries by name are unaffected; but any test using `getAllByRole('button')[0]` or relying on DOM order would fail | Verified: the existing tests **all query by name** and none depend on index → **no test changes needed**. Re-run to confirm when this lands |
| Standardising queues as `<ul>` + a CSS Grid table appearance (§D.4) | If a `<table>` were introduced later and this reverted, role queries would break | Fix the semantics now, to avoid rework later |
| `<h1 tabindex="-1">` focus management (§B.2) | `tabindex` does not affect name or role | No test changes needed |

### G.4 Changes that **do** alter an accessible name or asserted text (product and engineering must agree)

This is the only section that has to be listed item by item. There are 3:

**G.4.1 Moving the error code out of the main text and into a `<details>` (clause 6 of the wording constitution, §E.0)**

- As it stands: the consumers in `api.ts` concatenate strings like `Could not fetch the message record: ${err.error.code}`, `Did not succeed: ${err.error.code}`, `Send confirmation did not succeed: ${err.error.code}` and `Network error, the draft was not saved`, and render them straight into `role="status"` / `role="alert"`.
- What the specification requires: the main text says what happened / whether the content is still there / what did not happen / what to do next, with the error code folded into `<details><summary>Technical detail</summary>`.
- **Effect**: the `textContent` of `role="status"` / `role="alert"` changes.
- **Result of checking**: none of the existing 34 tests assert on these error strings (grepped: the tests assert only success-path copy such as the access password, "this is nothing to do with your account or your permissions", "please press what you just pressed again", "the other person will not be notified", and the delivery-state labels). → **zero test breakage expected**, but the full suite must be re-run before the change.
- **Needs a decision**: the exact wording of the new error copy (see §I.1).

**G.4.2 Putting icons in buttons such as "Decline Open Matching" (if adopted)**

- If an `<svg aria-hidden>` is inserted inside the button: the accessible name is **unchanged** (`getByRole('button', { name: 'Decline "Open Matching"' })` still passes).
- If what is inserted is a `<title>` or `aria-label` **carrying text**: the name **does** change.
- **This specification's decision**: icons are always `aria-hidden="true"` and **never** carry an `aria-label` or `<title>`. → **zero impact**. It is listed here only to make the prohibition explicit.

**G.4.3 The "that is you, so you cannot approve it" copy in `staff-queues.test.tsx`**

- The assertion as it stands: `screen.getByText(/that is you, so you cannot approve it/)`.
- The wording pattern in §E.8, "level 2 · blocking", suggests changing it to: `You submitted this, so it needs a colleague with permission to approve it.` — no blame, and it says what happens next.
- **Effect**: that assertion **would fail**.
- **Needs a decision**: whether to adopt the new wording (see §I.1). If adopted, change the test to `/needs a colleague with permission/` at the same time.
- Similar candidates (also needing a decision, and none of them currently asserted by a test): "would be refused at the password tier" and "would be refused by the server". Both already satisfy the "say the reason" requirement, so the recommendation is to **keep them as they are** and add the next action as a second sentence (an appended sentence does not break a `toContain` assertion).

### G.5 Copy that is explicitly kept and must not change (already pinned by tests and already compliant)

The following copy was checked and **satisfies this specification's honesty and no-blame requirements**, so this design system **does not recommend changing it**:

`Draft — not sent yet`, `Confirmed, queued for sending`, `Handed to the delivery service`, `Accepted by the delivery service (not received by the person yet)`, `Delivered to the other person`, `Delivery failed — you can try again`, `Delivery status unknown — being checked; this does not mean it arrived`, `Draft — only you can see it`, `the other person will not be notified`, `a locked research dataset will not be overwritten`, `not decided by an automated system on its own`, `this platform is not an emergency service`, `this report will still be dealt with even if you block the person afterwards`, `the reporter's identity is not shown`, `whether to accept it is always the person's own decision`, `this is not the person's own testimony`, `this is nothing to do with your account or your permissions`, `please press what you just pressed again`, `cannot be changed`, `posts are shown newest first.`

Plus all 34 button strings queried by name (`Save draft`, `Confirm publish`, `Go back, do not block` …). **The design system does not change button copy.**

---

## §H Key trade-offs

**H.1 | No icon library and no icon font; every icon is inline SVG, and there is no such thing as an icon-only button.**
The cost: drawing the icons and accepting their greyscale distinguishability becomes manual work; buttons are wider, and three actions no longer fit on one mobile row.
What it buys: zero dependencies, works offline, and the accessible name is always identical to the visible words (exactly aligned with the existing test strategy of 34 queries by name). It also satisfies Doc 20 §320's "AI/Block/Report/Visibility/Safety/Draft must carry a text label" naturally.
The approach rejected: a compact toolbar of icons with `aria-label` — it separates the accessible name from the visible words, so what a screen reader announces and what a sighted person reads become two strings that can drift apart, with only one of them under test.

**H.2 | No web fonts are downloaded; the named faces are used only where already installed, otherwise the system family.**
The cost: the rendered face varies by platform. A reader with Inter installed and a reader without it see different typography, so the design's typographic precision is not something this system controls. The same applies to the CJK fallbacks used for content people write.
What it buys: no font flash on first paint, readable offline, nothing to fetch on a low-bandwidth connection, and no privacy leak to a third-party font CDN (a THREAT_MODEL concern).

**H.3 | Breakpoints in `rem` rather than `px`.**
The cost: a user who has set their browser font size to 32px gets a single-column layout even on a 1280px-wide desktop — staff may feel this "wastes the screen".
What it buys: a large-text user automatically gets a single-column layout with no horizontal scrolling, which is exactly the outcome WCAG 1.4.4/1.4.10 is after. The judgement: participant readability takes priority over staff information density. If staff object strongly, `data-density="compact"` can compensate locally, but the breakpoints do not change.

**H.4 | The three density levels use one `--density` multiplier rather than three spacing scales; and density does not scale touch targets or focus rings.**
The cost: how far compact mode can compress is limited (only to 0.75×), so a genuinely "Excel-grade" dense table is not achievable.
What it buys: Doc 20 §315 explicitly requires that this "does not produce mutually incompatible separate systems"; and more importantly, any design that lets density compress a 44px target would repeat the real defect in §B.4. Better that compact mode is not compact enough.

**H.5 | Of the eight capability modes in Doc 20 §286, this system delivers only four (the ones tokens can implement), and marks the other four honestly as not delivered in §C.2.**
The cost: it cannot be claimed that "all eight modes are supported", and the related PILOT_READINESS entries have to stay unmet.
What it buys: Step-by-Step / Read-Aloud / Supporter-Assisted / Extended Time belong respectively to flow decomposition, TTS and multimodal consent, the permission model, and session policy — forcing them into the token layer would only produce a false claim of compliance. This is consistent with Doc 19's epistemic discipline: do not present a design assumption as an implemented capability.

---

## §I Open items needing a product decision

**I.1 | The final wording of the error copy, particularly "that is you, so you cannot approve it" (blocks §G.4.3)**
What §E.8 gives is a pattern, not final copy. Decisions needed: (a) whether to rewrite the existing staff-side error copy uniformly into the "no blame + what next" form; (b) if so, who updates the assertion in `staff-queues.test.tsx` alongside it.
Recommendation: the participant-side copy **must** change (cognitive load and dignity are directly at stake); the staff side can stay as it is for now, with only a second sentence of guidance appended (which does not break a `toContain` assertion). **Product must rule on this.**

**I.2 | Participant navigation on mobile: horizontally scrolling at the top vs a fixed bottom bar**
Doc 20 §304 says mobile uses "bottom or compact primary navigation"; which of the two is undecided.
- A bottom bar: reachable by thumb (relevant to older users' hand mobility), but it costs vertical space, squeezes the content at a small viewport with a large font, and conflicts with the iOS Safari bottom toolbar.
- Top horizontal scrolling: costs no vertical space, but six 44px items must scroll horizontally at 320px wide, and a horizontally scrolling navigation is unfriendly to screen readers and switch devices.
This document specifies the current state (a top `flex-wrap: wrap`), **but this needs real user testing (R3) to decide**, and should not be settled unilaterally by a design agent.

**I.3 | ~~Setting the Safety semantic colour to purple (`#5B2080` / `#D9B8F2`)~~ — CLOSED**
This item asked for a cultural review of a purple Safety colour, on the grounds that purple carries associations with mourning or religion in some contexts. It is closed twice over and is kept here only so the reasoning is not lost:

- **The colour was ruled, not reviewed into place.** D-8 settled Safety as **blue**, and D-82 reaffirmed it when the owner's status-colour rules asked for a confirmed SafetyEvent to use Error — red means a destructive action or a blocked operation, and **a person being unwell is neither**. The live token is the navy `--color-safety-fg: #2a4470` (§A.1.1), not a purple.
- **The distinguishability problem this item was really about did not go away**, and is handled in §A.1.3 instead: Safety, info and matching are all in the blue family, so Safety is carried by the ⬡ icon and the word "safety", with colour demoted to a secondary cue. The severity gradient the purple was reaching for is built inside the safety family (unreviewed signal = warning; confirmed and still needing someone = safety at full strength; resolved or closed = quiet, and never `success`).

No cultural review is outstanding for this token. Doc 20 §320's requirement that **icons** have a cultural review still stands and is unrelated to this item.

**I.4 | Whether Read-Aloud is in scope for the prototype**
Doc 20 §286 lists it as one of the modes, and §298–300 specify voice interaction and multimodal consent. This involves: browser TTS or server-side TTS (the latter has a data-egress problem, see THREAT_MODEL); whether what is read aloud includes other people's messages (a privacy boundary); and the privacy risk of reading aloud on a shared device (§306 explicitly requires discretion).
**Until product decides, this design system reserves no tokens for it and does not show the option in the settings interface.**

**I.5 | The default for the "cover the screen" privacy shield and for shared-device mode**
§D.6 requires shared-device mode to be ticked explicitly by the user. But in the real setting (a shared tablet in a community centre), the people who most need this mode are the least likely to tick it themselves.
The alternatives: (a) let the deployer mark the whole deployment as a "shared-device deployment" via an environment variable, forcing short timeouts on every session; (b) keep it as the user's own choice.
(a) is safer but removes individual choice, and it changes the semantics of consent and of the session. **Ethics and the deployer must decide this together.**

**I.6 | Whether the automated contrast gate goes into CI**
§A.1.5 recommends writing every colour combination as a unit test. That adds one test file and roughly 90 assertions, and **every token adjustment then has to update the expected values alongside it**. The benefit is that token regressions are caught; the cost is more friction when changing the palette. **Engineering must decide whether that friction is acceptable.**
