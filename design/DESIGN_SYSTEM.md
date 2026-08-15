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

**Total: 119 semantic token names.** Of these, 47 colour names × two sets of values (light/dark) = 94 declarations, and the remaining 72 names have 1 declaration each; the capability-adaptive modes (font size / density / contrast / simplified / low-stimulation) add a further 39 override declarations. The §F draft contains 254 `--` declarations in total, which is consistent with this. The distribution is in the table below, and each item is defined in §A.1–§A.9.

| Group | Token names | Section |
|---|---:|---|
| Colour (light + dark, two sets of values under one name) | 47 | §A.1 |
| Typography (family/size/line-height/weight/tracking 19 + measure 3) | 22 | §A.2 |
| Spacing (10) and the density multiplier (1) | 11 | §A.3 |
| Shape and stroke | 9 | §A.4 |
| Focus dimensions (the colours count in the colour group) | 4 | §A.5 |
| Motion | 7 | §A.6 |
| elevation | 4 | §A.7 |
| z-index layers | 6 | §A.7 |
| Touch targets | 3 | §A.8 |
| Icons | 5 | §A.9 |
| The font-size multiplier `--scale-font` | 1 | §C.1 |
| **Total** | **119** | |

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
| `--color-danger-solid-bg` | `#A03F3F` | 与 `#FFFFFF` | **6.41:1** | 4.5 |
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
| `--color-danger-solid-bg` | `#C66E6E` | 与 `#1A0808` | **5.41:1** | 4.5 |
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
| `--type-family-ui` | `system-ui, -apple-system, 'PingFang SC', 'Noto Sans CJK SC', 'Microsoft YaHei', sans-serif` |
| `--type-family-mono` | `ui-monospace, SFMono-Regular, Menlo, 'Noto Sans Mono CJK SC', monospace` |

No web fonts are downloaded: readability offline takes priority over visual consistency (trade-off §H.2). The monospace family is used **only** for identifiers (`pt_b`, `dv_9`, version hashes) — text of that kind has to be checkable character by character (Doc 20 §54, "approval against an exact version").

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

**`font-weight: 300` and below is forbidden** (Doc 20 §314, "very light text"); **paragraph-level `text-transform: uppercase` is forbidden** (no effect on Chinese, but it applies to identifiers and terms in English).

#### A.2.5 Letter spacing

| Token | Value | Use |
|---|---|---|
| `--type-tracking-normal` | `0` | All Chinese text |
| `--type-tracking-mono` | `0.02em` | Monospace identifiers, to make character-by-character checking easier |

#### A.2.6 Measure (line width)

| Token | Value | Use |
|---|---|---|
| `--measure-narrow` | `28rem` | Dialog body text, single-column forms |
| `--measure-default` | `36rem` | Participant body text (roughly 34–40 Chinese characters per line) |
| `--measure-wide` | `56rem` | Researcher/staff tables and side-by-side comparison |

The readable width of `<main>` = `min(100%, var(--measure-default))`; staff workspaces are raised to `--measure-wide`. This replaces the existing `body { max-width: 44rem }` (see §F).

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

**Icons that must carry a text label and must never appear alone** (listed explicitly in Doc 20 §320): AI, Block, Report, Visibility, Safety, Draft. This system tightens that to: **no icon may ever appear alone** — there is no such thing as an icon-only button here. The reasons: icon semantics are more ambiguous in a Chinese-language interface, and an icon-only button's accessible name depends on `aria-label`, which conflicts with the existing "the visible words are the accessible name" test strategy (§G).

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
| loading | 圆弧 | reduced-motion 下不旋转，改为静态圆弧 + 文字 |

验收：把 12 个图标渲染为灰度 PNG，无文字，请 3 人盲测能否两两区分；不能区分的重画。**这是设计验收项，不是自动化项。**

---

## §B 全局规则

### B.1 颜色不得是唯一状态指示 —— 状态呈现三元组

#### B.1.1 规范

任一状态呈现 = **图标 + 文字 + 颜色**，三者齐备且各自独立可用。

```html
<!-- 行内徽章（可见性、认识论类型、投递状态、审批状态） -->
<span class="badge badge--warning">
  <svg class="icon" aria-hidden="true" focusable="false"><!-- 三角 --></svg>
  草稿 — 只有你能看到
</span>
```

| 通道 | 要求 | 失效时的后备 |
|---|---|---|
| **图标** | `aria-hidden="true"`，装饰性，形状互异（§A.9） | 图标不渲染时文字仍完整表达状态 |
| **文字** | 状态名是**真实文本节点**，构成可访问名的一部分，**不得**只存在于 `aria-label`/`title`/`::before content` | — |
| **颜色** | 仅强化。**移除全部颜色后，信息零损失** | — |
| （第四通道）**结构** | 关键状态额外加左侧 `--border-emphasis` 条或独立容器 | 见 §B.1.3 |

#### B.1.2 三条禁令

1. **禁止 `content:` 承载状态文字**——`::before { content: "已批准" }` 在部分 AT 下不播报，且用户样式表下丢失。
2. **禁止仅靠 `background-color` 区分行状态**（表格行、队列行）。行状态必须有一列文字。
3. **禁止仅靠图标区分**——见 §A.9，无纯图标状态。

#### B.1.3 关键状态的四通道

「关键状态」= 会改变用户对后果判断的状态。清单（Doc 20 §43–45、§50）：

- 生命周期：Draft / Active / Paused / Completed / Withdrawn / Superseded / Retired / Archived
- 审批：Not Submitted / In Review / Returned for Revision / Approved / **Approved with Conditions** / Rejected / Superseded / Archived
- 资源：Usable / Restricted / Suspended / Expired / Deleted / Withdrawn / **Locked** / Unavailable
- 投递：现有 `DELIVERY_STATE_LABELS` 七态（保持文案不变，见 §G）
- 同步：本地已保存 / 正在同步 / 已同步 / 冲突 / 同步失败 / 需要复核
- 可见性：六级（§A.1.4）
- 认识论类型：Doc 19 §10 十一类（平台事实 / 参与者提供信息 / 参与者证言 / 支持者贡献 / 人工观察 / 人工决定 / 检索到的证据 / AI 推断 / 建议 / 草稿 / 未知）

这些**必须**用块级状态容器（左 4px 条 + tint 底 + 图标 + 文字），不得只用行内徽章。

#### B.1.4 禁用态的表达

禁用不是状态三元组的例外，而是它的一个实例：

- **禁止**只把按钮变灰。灰色按钮旁必须有一句说明**为什么**以及**怎样才能启用**。
- 优先用 `aria-disabled="true"` + 保留可聚焦性 + 点击时用 `role="status"` 播报原因，而不是 `disabled` 属性（`disabled` 元素不可聚焦，键盘用户无法发现它为什么不可用）。
- 例外：表单提交中（防重复提交）用真 `disabled`，并同步显示「正在提交…」。
- **权限不足不用禁用态表达**——见 §E.9 受保护存在。

#### B.1.5 验收

1. **灰度检查**：`filter: grayscale(1)` 下截图，所有状态仍可区分（人工，纳入 R1 专家走查）。
2. **裸 HTML 检查**：禁用全部 CSS，所有状态文字仍在文档流中可读（可自动化：`document.body.innerText` 包含状态名）。
3. **`content` grep**：`grep -n "content: *['\"][^'\"]" styles.css` 的命中不得包含中文或状态词。

---

### B.2 焦点在所有状态可见

见 §A.5 令牌与双环结构。此处补交互规则（Doc 20 §294）：

| 时机 | 焦点去向 |
|---|---|
| 屏幕切换（`setScreen`） | `<main>` 内的 `<h1>`（`tabindex="-1"`，聚焦后不留 tabstop） |
| 对话框打开 | 对话框标题（`<h2 tabindex="-1">`），**不是**主按钮——避免误触；`aria-labelledby` 指向该标题 |
| 对话框关闭 | 触发它的按钮（必须保存引用） |
| 校验失败 | 第一个出错字段；同时 `role="alert"` 播报错误摘要 |
| 动作成功 | 停在原地，用 `role="status"` 播报；**不跳转焦点**（避免"我的位置没了"） |
| 动作失败 | 停在原地，`role="alert"` 播报；焦点不动，用户可直接改后重试 |
| 动态内容插入（列表加载） | 焦点不动，`role="status"` 播报数量 |
| AI 流式输出 | **焦点绝不移动**（Doc 20 §294 明文） |

规则：焦点环不得被粘性元素遮挡——粘性头/尾必须为其后的内容预留 `scroll-padding-block`（§D.5）。

---

### B.3 200% 缩放与高文本缩放：不横向滚动

#### B.3.1 结构规则

1. **一切尺寸用 `rem` / `%` / `ch` / `em`**，禁止布局用 `px`（`px` 只允许出现在描边宽度、焦点环宽度、阴影这些"物理细节"上）。
2. **断点用 `rem`**（§D.1）：浏览器字号调大 → 有效视口变窄 → 自动降级为单列。这是特性不是缺陷（取舍 §H.3）。
3. **禁止固定 `height`**；只用 `min-height`。
4. **禁止 `white-space: nowrap`** 于任何用户可见文本；仅允许用于等宽标识符，且必须配 `overflow-wrap: anywhere` 的兄弟策略或放入 §B.3.2 的滚动容器。
5. **`overflow-wrap: anywhere`** 全局生效于正文容器——长标识符（`pt_b`、UUID、哈希）不撑破布局。
6. 顶层守卫：`html, body { overflow-x: clip; }` 不用来掩盖问题，而是作为最后一道防线；**任何触发它的布局都是缺陷**。

#### B.3.2 宽内容的唯一合法出口

表格、代码块、ASCII 线框、宽图表**不得**让页面横向滚动，只能在自己的容器里滚动：

```html
<div class="scroll-x" role="region" aria-label="参与者列表（可横向滚动）" tabindex="0">
  <table>…</table>
</div>
```

- 必须 `tabindex="0"`（键盘可滚）+ `role="region"` + `aria-label`（说明它可滚动）。
- 容器两侧用 `--color-border-default` 描边，让"这里还有内容"可见。
- 移动端优先给**替代表示**（卡片列表）而非滚动；但见 §D.4 关于何时不能替代。

#### B.3.3 验收

- 视口 1280×1024 @ 200% 缩放（等效 640×512 CSS px）与 320×256 CSS px：`document.documentElement.scrollWidth <= clientWidth`。
- 浏览器最小字号设为 24px：同上断言 + 所有 44px 目标仍不重叠（§B.4）。
- 400% 缩放（WCAG 1.4.10 的正式门槛，等效 320px 宽）：单列，无内容丢失。

---

### B.4 触控目标 ≥44px 且相邻目标不得重叠 —— 防复发规则

> **背景（真实缺陷）**：`min-height: 2.75rem` 的按钮出现在由 `line-height: 1.6 × 18px = 28.8px` 决定的行框里。行内级按钮之间靠 JSX 的 `{' '}` 文本节点提供间隔，换行后行框按行高堆叠，44px 高的按钮相互压叠。现有 `styles.css` 已针对**首页列表**做了局部修补（`main li > button { display: block }`），但这是点修，不是规则——换一个容器就会复发。

#### B.4.1 五条不可复发规则

**R1｜尺寸唯一来源**
`--target-min` 是最小目标尺寸的唯一定义。组件 CSS **禁止**写字面高度。评审 grep：`min-height:\s*[0-9.]+(rem|px)` 在 `:root` 之外零命中。

**R2｜交互元素不得作为行内级参与文本行框**
所有 `button`、`a[role="button"]`、`input`、`select`、`summary`、以及任何有 `onClick` 的元素，其 `display` 必须是 `block` / `flex` / `grid` / `inline-flex` 之一，**禁止 `display: inline`**，且必须 `align-items: center`。行内级元素的高度不参与行框计算（或参与得不可控），这是缺陷根因。

**R3｜间距必须由布局提供，禁止由空白文本节点提供**
相邻目标之间的间隔一律由父容器的 `display: flex; gap: var(--target-gap)` 或子元素的 `margin-block` 提供。
**禁止**用 JSX 的 `{' '}`、`&nbsp;`、`<br>` 作为按钮之间的间隔——它们是文本，会随行高塌陷、随字号变化失控。
> 现有代码 `App.tsx:60–66`（`进入 / 支持者入口 / 员工入口`）与 `MessagePanel` 等处正是 `{' '}` 分隔。改为 flex 容器 **不改变任何按钮的可访问名**（§G.2）。

**R4｜内容流中的动作是整行块级目标**
`<li>`、`<p>`、`<td>` 内的动作按钮：若该容器内只有这一个动作，按钮占满整行（`display: block; width: 100%; text-align: start`）；若有多个动作，父容器改为 `display: flex; flex-wrap: wrap; gap: var(--target-gap)`，且每个按钮 `flex: 1 1 auto; min-width: 12rem`（保证换行后每行仍是完整可点块）。

**R5｜容器不得压缩目标**
包含交互元素的容器**禁止**：固定 `height`、`overflow: hidden`、`line-height` 小于 `--target-min` 的同时限制溢出、`max-height` + 裁剪。需要裁剪时用 `overflow: clip; overflow-clip-margin: var(--focus-ring-total)`。

#### B.4.2 例外与命中区扩展

只有两类元素允许**视觉**小于 44px：

1. 正文中的行内链接（WCAG 2.5.8 的 inline exception）
2. 密集表格中的行内动作——**且必须**用 `::before` 把命中区扩到 44px：

```css
.target-inline { position: relative; }
.target-inline::before {
  content: '';
  position: absolute;
  inset: calc(-1 * var(--target-hit-slop));
  min-height: var(--target-min);
  min-width: var(--target-min);
  /* 垂直居中扩展 */
  top: 50%; translate: 0 -50%;
}
```

**但**：命中区扩展后相邻目标的**命中矩形**同样不得相交——扩展不豁免 R3 的间距要求。

#### B.4.3 自动化回归断言（建议纳入 CI）

这是防复发的关键，不是可选项：

```ts
// 伪代码：jsdom 无布局，需 Playwright / 真实浏览器
const targets = page.locator('button, a[href], input, select, [role="button"], summary');
const rects = await targets.evaluateAll(els => els.map(e => e.getBoundingClientRect()));

// 1) 尺寸
for (const r of rects) {
  expect(r.height).toBeGreaterThanOrEqual(44);
  expect(r.width).toBeGreaterThanOrEqual(44);
}
// 2) 互不相交（含 --target-gap 的净空隙）
const GAP = 8;
for (let i = 0; i < rects.length; i++)
  for (let j = i + 1; j < rects.length; j++) {
    const a = rects[i], b = rects[j];
    const overlapX = Math.min(a.right, b.right) - Math.max(a.left, b.left);
    const overlapY = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
    expect(overlapX > -GAP && overlapY > -GAP).toBe(false); // 需有一轴净距 ≥ GAP
  }
```

**运行矩阵**：320px / 375px / 768px / 1280px 宽 × 字号 {默认, 24px, 32px} × 密度 {compact, standard, spacious} × 缩放 {100%, 200%, 400%}。至少覆盖 320px×32px×spacious×200% 这一最恶劣组合。

#### B.4.4 关键控件的额外保护（Doc 20 §295）

`屏蔽`、`报告`、`取消`、`返回`、`撤回` 必须"可达且不易误触"：

- 与**破坏性/确认类**按钮之间的净空隙提升至 `--space-5`（标准密度 27px），而非 `--target-gap`。
- 确认对话框中，`确认…` 与 `返回，不…` 分列两行（移动端）或用 `--space-5` 分隔（宽屏），**且顺序恒为「返回/取消」在前、「确认」在后**（防止肌肉记忆误触）。
  > 注：现有实现（如 `确认屏蔽` / `返回，不屏蔽`）的**按钮文案与可访问名保持不变**，只调整布局与顺序 —— 顺序调整会影响按 DOM 顺序的测试，见 §G.3。

#### B.4.5 等权重选择对：`.btn-primary` 的禁用场景（Doc 20 §13.7 无暗黑模式）

当两个选项在**价值上等权**时，**两者都不得**使用 `.btn-primary`，必须同尺寸、同字重、同描边、同色，只有文字不同：

| 场景 | 按钮对 | 要求 |
|---|---|---|
| 同意选择 | `同意「…」` / `拒绝「…」` | 两者视觉完全相同。`consent-panel.test.tsx:34–37` 已断言两组按钮数量相等——**这条测试是这条规则的现有守卫，必须保持通过** |
| 匹配决定 | `感兴趣` / `暂时不` | 同上 |
| 参与可选活动 | `参加` / `这次不参加` | 同上 |
| 撤回确认 | `确认撤回「…」` / `返回，不撤回` | 同上（撤回是用户的权利，不得让"返回"显得更可取） |

`.btn-primary` 只允许用于**没有对立选项**的单一前进动作（`保存草稿`、`提交报告`、`进入`）。
**验收**：对每一组等权按钮断言 `getComputedStyle` 的 `backgroundColor`、`fontWeight`、`borderWidth` 完全相同。

---

### B.5 语义 HTML 与"不得为视觉引入 div 汤"

| 需求 | 正确做法 | 禁止 |
|---|---|---|
| 卡片 | `<article>` / `<section aria-labelledby>` | `<div class="card">` |
| 状态徽章 | `<span class="badge">` 内含真实文本 | `<div>` + `::before content` |
| 队列/列表 | `<ul>` / `<ol>` + `<li>` | `<div role="list">` |
| 表格 | `<table><thead><th scope="col">` | `<div role="grid">` |
| 折叠 | `<details><summary>` | `<div onClick>` |
| 对话框 | `<div role="alertdialog" aria-labelledby aria-modal="true">`（现状）或 `<dialog>` | 无语义浮层 |
| 分组 | `<fieldset><legend>` | `<div>` + 视觉标题 |
| 布局 | 在**已有**语义元素上加 class 做 flex/grid 容器 | 新增纯布局 `<div>` 包裹层 |

**唯一允许新增的非语义包裹**：`.scroll-x`（§B.3.2，带 `role="region"`）与 `.app-shell`（最外层 flex 容器，现已存在于 `App.tsx` 的 `<div>`）。

---

## §C 能力自适应模式（C；Doc 20 §286–287）

### C.1 五个可切换维度（2026-08-13 核对）

全部以 `<html>` 上的 `data-*` 属性驱动令牌覆盖。**没有任何 JS 逻辑判断"用户是谁"。**

| 维度 | 属性 | 取值 | 令牌覆盖 | 有开关吗 |
|---|---|---|---|---|
| 字号 | `data-font-scale` | `standard`(默认) / `lg` / `xl` / `xxl` | `--scale-font` = 1 / 1.125 / 1.25 / 1.5 | ✅ |
| 密度 | `data-density` | `standard`(默认) / `spacious` | `--density` = 1 / 1.25（§A.3） | ✅ |
| 对比 | `data-contrast` | `standard`(默认) / `high` | 颜色令牌换成高对比组（**含十个语义族，见下**）；`--border-default` → 3px；`--icon-stroke` → 2.5 | ✅ |
| 动效 | `data-motion` | `system`(默认) / `reduced` | 全部 duration → 0ms | ✅ |
| 少一点颜色 | `data-stimulation` | `standard`(默认) / `low` | 全部 tint 底 → 页面底；描边、图标、文字不变 | ✅ **2026-08-13 补上** |

**这一栏是这次核对加的，因为它揭出了问题。** `data-stimulation` 从 v0.1 起就有完整的规则块，而**没有任何代码设过这个属性**——所有者明确把「低刺激模式」排在完整深色模式之前，而它一直是打不开的。同一次核对还发现 `data-simplify` 与 `data-theme` 也没有写入方**（处理见下）**。已加一条测试：扫描样式表里所有 `:root[data-*=]` 选择器，逐个到 `src/` 里找写入方，找不到就失败。

**`data-simplify` 已删除。** 它两头都空：没有写入方，而且**全应用没有一个元素带 `.optional`**，所以就算设上，能做的只有把行高 1.6 改成 1.8——那件事「密度」偏好本来就在做。按 D-75 的判法，这一类要删不要建：给它补开关，等于造一个写着「简化」、按下去只把行距变宽的控件。真正的「一次只做一件事」是流程层的工作（见 C.2 的 Step-by-Step 行）。

**`data-theme` 保留为「一律浅色」的开关（D-79 修正），深色模式仍由 `prefers-color-scheme` 单一定义。** 当天先删后补：删的理由是「没有写入方」，属实但动作错了——发现一个能力没有写入方，正确的动作是补写入方。所有者在自己手机上看到深色、且**没有任何路径回到浅色**，才暴露出来。现在 `:root:not([data-theme='light'])` 这一个 `:not()` 就是「一律浅色」的全部实现：浅色值本来就在 `:root`，属性一设，深色块不再命中。**「一律深色」照所有者裁定提供**（D-80）：它确实需要复制整套深色值，所以副本由脚本从活的那一块生成，并有一条测试逐个令牌锁住两块完全一致——重复本身不可怕，无人看守的重复才是。三个选项都是**图标 + 文字**：图标 `aria-hidden`、文字作可及名称，且图标放大一档（☀/☾ 在多数字体里只占字面一半）。 从来没有代码设过 `data-theme`，所以那 40 条 hex 是**第二份副本**：它必须与媒体查询里的那份逐字一致，却没有任何机制能在它们分叉时出声——而先被改坏的多半是媒体查询那份，也就是所有系统深色使用者真正走的那条路。删掉副本之后，深色模式对使用者的行为**一点没变**（仍然跟随系统设置），只是不再有第二份会悄悄过期的值。所有者已定「深色模式不作优先」，所以没有补应用内开关；哪天要补，把属性选择器与写入方一起加回来即可。

#### C.1.1 高对比不是只把正文调黑

第一版高对比只覆盖了正文、次要文字、链接与按钮，**十个语义族一个没动**：正文从 12.38:1 抬到 21:1，而 warning / danger / story / ai 四块**原地停在 4.50 上下**——整屏最难读的东西一点没变。**打开这个模式的人，正是最需要把「被拒绝了」那句话看清楚的人。** 现在每一族都推到 AAA（≥7:1），底更接近白、字沿同一色相继续压暗。断言：高对比下每一族都必须**严格高于**标准模式，否则这个模式只是个名字。

### C.2 与 Doc 20 §286 八种模式的映射（诚实对照）

| Doc 20 模式 | 本系统实现 | 说明 |
|---|---|---|
| Standard | 全部默认值 | ✅ 令牌覆盖 |
| High Visibility | `data-contrast="high"` + `data-font-scale="xl"` | ✅ 令牌覆盖 |
| Simple | ❌ **已删除，见 C.1** | 曾以 `data-simplify` 存在，两头都空。真正的简化是流程层的工作，与 Step-by-Step 同属一件事 |
| Low Stimulation | `data-stimulation="low"`（+ 可与 `data-motion="reduced"` 同开） | ✅ 令牌覆盖，**且已有开关**（2026-08-13 前没有） |
| Step-by-Step | ❌ **不是令牌能实现的** | 需要流程层拆分（多步表单、每步一个决定）。属 I16 表单族，本文件不覆盖 |
| Read-Aloud | ❌ **不是令牌能实现的** | 需要 TTS 能力与 §300 多模态同意；见 §I.4 未决 |
| Supporter-Assisted | ❌ **不是令牌能实现的** | 需要权限模型与"谁在代为操作"的呈现；见 D2/§180–181 |
| Extended Time | ❌ **不是令牌能实现的** | 属会话超时策略（I14 / §296、§238） |

**这张表是诚实声明**：本设计系统只交付 4 个维度中可由令牌实现的部分，另 4 种模式必须在流程层单独设计，不得声称"已支持八种模式"。

### C.3 绝对禁令

1. **不得按年龄自动判定**。系统不得读取、推断或使用出生日期/年龄段来预设任何模式。
2. **不得按参与者分组自动判定**（如"干预组默认宽松"）——那会成为混杂变量，且是把人当类别对待。
3. **不得由 AI 推断能力**并自动切换。
4. **不得因某人使用了辅助技术就替他改变设置**——尊重 OS 信号只作**初始值**，不作锁定。

允许作为**初始值**的信号（都是用户自己在系统里设过的偏好，不是对人的推断）：

| 信号 | 映射 |
|---|---|
| `prefers-color-scheme` | light / dark |
| `prefers-contrast: more` | `data-contrast="high"` 初始值 |
| `prefers-reduced-motion: reduce` | 动效令牌归零 |
| 浏览器根字号 | 天然生效（rem） |

用户一旦显式设置，用户值**永久优先**于 OS 信号。

### C.4 控制界面要求（Doc 20 §287）

| 要求 | 实现 |
|---|---|
| 易于找到 | 在**每个**工作区的主导航中有固定项「显示与阅读设置」；不埋在二级菜单 |
| 可预览 | 设置页顶部有**实时样例区**（一段正文 + 一个按钮 + 一个状态徽章），随选择即时变化 |
| 可逆 | 每个维度旁有「恢复默认」，页面底部有「全部恢复默认」 |
| 持久 | `localStorage`（共享设备模式下改为 `sessionStorage`，见 §D.6） |
| 任务中可用 | 设置以 `<dialog>` 形式从任何屏幕打开，**不卸载当前屏幕、不丢失表单输入**；关闭后焦点回到触发按钮 |

**实现约束**：属性写在 `<html>` 上、令牌覆盖是纯 CSS，因此切换不触发 React 重渲染，表单状态天然保留。这是选择 `data-*` 而非 React Context 的理由。

**无 JS 降级**：`<noscript>` 下无法切换，但 `prefers-*` 媒体查询仍生效——因此高对比与暗色主题**必须**同时写成媒体查询与属性选择器两套（§F 已如此实现）。

---

## §D 响应式（A9；Doc 20 §301–307）

### D.1 断点（内容驱动，rem 单位）

| 名称 | 条件 | 由什么内容决定 |
|---|---|---|
| （基准） | `< 40rem` | 单列。参与者默认形态。所有设计从这里开始 |
| `sm` | `≥ 40rem`（720px @18px） | 一行能放下两个 `min-width: 12rem` 的动作按钮 |
| `md` | `≥ 56rem`（1008px） | 员工工作区可以出现侧边导航 + 内容两列 |
| `lg` | `≥ 76rem`（1368px） | 员工工作区可以出现三列或"列表 + 详情 + 上下文"并列 |

**用 `rem` 而非 `px`**：用户把字号调到 32px 时，40rem = 1280px，多数平板会落回单列——大字用户自动得到单列。这是有意为之（取舍 §H.3）。

### D.2 移动优先的布局规则

1. **基准样式 = 移动样式**。所有 `@media` 只用 `min-width`，不用 `max-width`。
2. **参与者工作区在任何宽度下都是单列**，正文宽度封顶 `--measure-default`。宽屏只增加左右留白，不增加列数。理由：Doc 20 §13.2「一次一个有意义的决定」——多列天然并列多个决定。
3. **员工工作区**可在 `md`/`lg` 分列，但：任一列内部仍是单列流；不得把一个决定的上下文与它的确认按钮分到两列（Doc 20 §13.3「先解释再询问」要求同屏可见，分列视为违规，除非两列在同一视口内同时完整可见）。

### D.3 导航

| 断点 | 参与者 | 员工 |
|---|---|---|
| 基准 | 顶部单行横向滚动的 `<nav>`（现状）**或**底部固定栏；见 §I.2 未决 | 顶部 `<nav>`，可换行 |
| `sm+` | 顶部 `<nav>`，`flex-wrap: wrap`，每项 ≥44px | 同上 |
| `md+` | 同上（不变，保持单列） | 左侧持久侧栏（`<nav>` + `<ul>`），内容区 `--measure-wide` |

规则：

- 导航项数 ≤ 7（现有参与者导航为 6 项，合规）。
- `aria-current="page"` 已在现有实现，保留；视觉上用**左/下 4px 实心条 + 加粗 + 颜色**三通道，不只用颜色。
- **移动端底部导航若采用**：必须为内容区加 `padding-block-end: calc(导航高度 + var(--space-5))`，且不得遮挡任何 `确认/取消` 按钮（Doc 20 §304「sticky but non-obscuring」）。

### D.4 表格 → 卡片的降级（以及何时不降级）

| 情况 | 移动端做法 |
|---|---|
| 纯展示、每行 ≤4 个字段（如报告队列） | 降级为 `<ul>` + `<li>` 卡片，每字段 `<dl><dt>字段名<dd>值` |
| 需要跨行比较的数据（数据集质量复核、版本对比） | **不降级**。保留 `<table>`，放进 §B.3.2 的 `.scroll-x` 容器 |
| 带行内动作的队列 | 降级为卡片，动作按 R4 变为整行块级按钮 |

**注意**：`<table>` → `<ul>` 的降级**改变了元素角色**。若某个测试用 `getByRole('table')` 或 `getByRole('row')` 查询，降级会在窄视口下失败。现有 34 个测试中**没有**表格角色查询（已核对，见 §G.1），但未来新增表格时必须遵守：**响应式降级不得跨断点改变角色**——正确做法是两种表示同时存在于 DOM、用 CSS 显隐，或统一只用一种。本系统选择：**队列一律用 `<ul>` 语义，宽屏用 CSS Grid 排成表格外观**，从而角色恒定。真正需要 `<table>` 语义的（多维数据）则永不降级、只滚动。

### D.5 粘性元素

- 粘性只用于：员工表格表头、长表单的动作条、会话超时警告。
- 粘性元素必须：`position: sticky`（非 `fixed`）、`z-index: var(--layer-sticky)`、总高度 ≤ 视口 25%。
- 视口高度 < `30rem`（横屏手机、分屏）时取消粘性：`@media (max-height: 30rem) { .sticky { position: static } }`。
- 页面必须设 `scroll-padding-block-start: <粘性头高度>` 与 `scroll-padding-block-end: <粘性尾高度>`，否则键盘 Tab 到的元素会被粘性条盖住（焦点可见性硬要求，§B.2）。

### D.6 共享环境与共享设备（Doc 20 §306–307）

这不是"响应式的附属"，而是本平台的真实场景（社区中心的共用平板）。

| 要求 | 设计 |
|---|---|
| 谨慎的页面标题 | `<title>` 恒为「健康老龄化研究平台」，**不含**参与者姓名、社区名、消息内容。切屏不改 title（改用 `<h1>` 承载屏幕名） |
| 通知不含内容 | 任何浏览器通知/角标只说「有 1 条新消息」，不带发件人与正文 |
| 隐私屏 | 导航中固定项「遮住屏幕」→ 立即覆盖内容为不透明遮罩 + 「已遮住。点击继续」。**遮罩必须是不透明色块，不得用 `filter: blur()`**（模糊可被截图增强还原，且低视力用户误以为是渲染故障） |
| 易于登出 | 「退出登录」在导航中恒定可见，≤2 次点击（含一次确认），不埋在菜单 |
| 减少最近内容预览 | 共享设备模式下，列表页只显示对方标识与时间，不显示消息摘要 |
| 安全返回首页 | 每屏有「回到首页」，且首页不含任何内容预览 |
| 显式用户切换 | 「切换使用者」= 完全清空 `sessionStorage` + 重新进入登录 |
| 短超时 | 共享设备模式空闲 5 分钟警告、7 分钟登出（普通模式 20/25 分钟）；见 §E.11 |
| 当前身份可见 | 上下文横幅恒显示「当前：{标识}」，用 `--color-surface-inverse` 反色条，不可关闭 |
| 本地草稿保护 | 共享设备模式下草稿只存服务端；`localStorage` 不写任何内容，偏好设置改存 `sessionStorage` |

共享设备模式的**开关**：登录页上的显式复选框「这是共用的设备」，默认**未勾选**但文案醒目。不得自动探测（探测会误判且不可解释）。

**状态：已实现（2026-08-05）**。开关按本节要求做成登录页的显式复选框，且**不探测**。已落地：恒显的上下文横幅（当前身份）、隐私屏（不透明色块，并把身后一切设为 `inert`——没有这一步，从遮罩后面按 Tab 会走遍页面上每一个控件，屏幕阅读器把遮罩要挡的东西一字不落读出来）、「切换使用者」、偏好改存 `sessionStorage`、5/7 分钟短超时（§E.11）、`<title>` 改为不含角色的固定标题。

三处按事实偏离本节：

- **「切换使用者 = 完全清空 `sessionStorage`」不照字面做**：共享设备标记正存在那里，照字面做会让最保护人的设置在陌生人坐下的那一刻消失。清空后把标记写回，关于人的一切不写回（D-18）。
- **环境访问口令仍留在 `localStorage`**：它是原型环境的门钥匙而不是关于人的信息；清掉它会让整台公用平板从此进不来（D-18）。
- **「减少最近内容预览」无需实现**：会话列表本来就不显示消息摘要，只有对方标识、可以互相写信的依据与会话状态。浏览器通知同理——平台没有通知，没有内容可省。

**量出来的一处修正**：横幅第一版（一句整话＋两个块级按钮）在 320×844 下占 304px，即视口的 36%，超过 §D.5 给粘性元素的 25% 上限。改成两个并排按钮后为 169–197px（20–23%）；`xl`/`xxl` 两档字号下仍达 45%，故在这两档**取消粘性**——选择放大字号的人正是屏幕空间最紧的人，把接近一半的视口钉死给一条常驻横幅，方向就是反的。

---

## §E 状态呈现规范（I11 / I12 / I13）

### E.0 通用结构与文案宪法

所有状态呈现共用一个结构（图标 + 标题 + 说明 + 动作 + 可选技术细节）：

```html
<div class="state state--{severity}" role="{status|alert|none}">
  <p class="state__head">
    <svg class="icon" aria-hidden="true" focusable="false">…</svg>
    <strong>{状态标题}</strong>
  </p>
  <p class="state__body">{发生了什么 / 你的内容怎么样了 / 什么没有发生}</p>
  <p class="state__actions"><button>{下一步动作}</button></p>
  <details class="state__detail"><summary>技术细节</summary><p><code>{code}</code></p></details>
</div>
```

**文案宪法（六条，全部可检验）**：

1. **说明下一步能做什么**。每条错误/空/离线文案的最后一句必须是一个用户可执行的动作或一条求助路径。
2. **不指责用户**。禁用第二人称过失句式。
   | 禁止 | 改为 |
   |---|---|
   | 你输入的内容有误 | 这一项需要填写{要求}。 |
   | 你没有权限 | 这一项在你当前的角色下看不到。 |
   | 你的网络有问题 | 现在连不上服务器。 |
   | 操作失败，请重试 | 没有保存成功。你写的内容还在，可以再点一次「保存草稿」。 |
   | 无效的请求 | 这次提交没有被接受，因为{具体原因}。 |
3. **说明工作是否保存**。每条错误必须明确回答"我刚才写的东西还在吗"。
4. **说明什么没有发生**（Doc 20 §231）。例：「消息**没有**发出。」「同意**没有**被更改。」
5. **不给虚假安慰**。未知就是未知：「送达状态未知 — 正在核实，不代表成功」（现有 `DELIVERY_STATE_LABELS` 已合规，保持）。禁止「马上就好」「应该没问题」。
6. **技术码只作可选细节**：错误码放 `<details>`，摘要文字为「技术细节」。主文案里不出现 `ERR_*`。
   > 现有代码把错误码直接拼进主文案（`未能获取消息记录：${err.error.code}`）。这是本规范要求改动的一处，影响见 §G.4。

**播报规则**：

| 严重度 | ARIA | 是否打断 |
|---|---|---|
| 加载/同步/空 | `role="status"`（`aria-live="polite"`） | 否 |
| 信息性 | `role="status"` | 否 |
| 可恢复错误 | `role="alert"` | 是（AT 打断） |
| 阻断错误 | `role="alert"` + 焦点移到容器 | 是 |
| 安全关键 | `role="alertdialog"` + `aria-modal` | 是，接管 |
| 安全性关键 | `role="alertdialog"` + 会话处理 | 是，接管 |

---

### E.1 加载（Doc 20 §224）

| 项 | 规范 |
|---|---|
| 结构 | `role="status"` + 图标（静态圆弧，reduced-motion 下不转）+ 文字 |
| 布局 | **保留布局**：容器保持最终高度（`min-height`），不得让内容跳动 |
| 进度 | **禁止假进度条**。不知道就用不确定态文字 |
| 取消 | 只在取消安全时提供（只读查询可取消；已提交的写操作不可取消，改为「正在确认，请勿重复提交」） |
| 超时 | ≥10s 显示恢复路径 |
| 高影响动作 | 必须等服务端确认，**不得**乐观更新（Doc 20 §224 末句） |

**文案**

- 载入中：`正在载入{对象}…`
- 提交中：`正在提交…请稍候，不要重复点击。`
- ≥10s：`还在处理。你可以继续等待，或者回到上一步再试一次。你写的内容不会丢。`
- 高影响动作等待服务端：`正在等待服务器确认。在确认之前，{对象}还没有{动作}。`
  - 例：`正在等待服务器确认。在确认之前，这条消息还没有发出。`

### E.2 骨架（Doc 20 §225）

| 项 | 规范 |
|---|---|
| 适用 | 可预测的低风险列表：会话列表、社区帖子列表、贡献列表 |
| **禁止** | 审批状态、消息投递状态、安全决定、匹配结果、数据集锁定 —— 这些**绝不**用骨架，因为骨架的形状会被读成"结果已存在" |
| 无障碍 | 骨架块 `aria-hidden="true"`；外层容器 `role="status"` 内含真实文字「正在载入会话列表」 |
| 动效 | 微光扫过仅在 `--motion-duration-normal` 下允许；`reduced-motion` 时静态灰块 |
| 形状 | 只画中性灰条（`--color-surface-sunken`），**不得**画出徽章形状、按钮形状或对勾 |

### E.3 空状态（Doc 20 §226）

必须回答四问，顺序固定：

```text
[图标]  {为什么是空的}
        {这是正常的吗}
        {你可以做什么}   ← 一个明确动作
        {去哪里求助}     ← 链接或说明
```

| 场景 | 文案 |
|---|---|
| 无消息 | **还没有消息。**<br>你还没有和任何人开始会话，这很正常。<br>[去看看可以联系的人]<br>不确定怎么开始？在「帮助与安全」里可以联系研究团队。 |
| 无联系人 | **你还没有建立联系。**<br>建立联系需要双方都表示愿意，这需要一点时间。<br>[看看「认识新朋友」]（可选，你随时可以不参加）<br>—— |
| 无匹配候选 | **现在没有可以推荐的人。**<br>这不代表出了问题：推荐依据你的兴趣与设置，有时候就是没有合适的。<br>[看看我的兴趣设置]<br>—— |
| 无社区帖子 | **「{社区名}」里还没有帖子。**<br>这个社区刚开始，还没有人发布内容。<br>[写第一篇（会先存成草稿，只有你能看到）]<br>—— |
| 无生命故事 | **你还没有添加生命故事。**<br>这是完全自愿的，不添加也不影响你参与研究。<br>[了解生命故事是什么]<br>—— |
| 无待办（首页） | **今天没有需要你做的事。**<br>这是正常的，研究不会每天都有任务。<br>[看看我的同意选择]<br>—— |
| 队列为空（员工） | **当前没有待处理的{对象}。**<br>队列为空。<br>[查看已处理的记录]<br>—— |

**禁令**：空状态不得写「快去认识新朋友吧！」这类促动语；不得用插画暗示"你很孤单"；可选功能的空状态必须明写「可选」「不参加也没关系」。

### E.4 离线（Doc 20 §227）

```text
[断云图标] 现在是离线状态
           已经载入的内容还能看，新的内容看不到。
           你现在**不能**：发送消息、确认同意的更改、提交报告。
           你写的草稿保存在这台设备上，连上网络后会同步。
           [重新检查连接]
```

| 项 | 规范 |
|---|---|
| 位置 | 页面顶部持久横幅（`--layer-header`），不可关闭，直到恢复 |
| ARIA | `role="status"`；恢复时播报「已经重新连上」 |
| 禁用范围 | **所有高影响动作禁用**（发送、确认、批准、锁定、撤回同意、举报提交）。禁用时按 §B.1.4 给出原因文字 |
| 草稿 | 明确说明存在本地；共享设备模式下**不存本地**，文案改为「离线时无法保存草稿。请把内容复制下来，或等连上网络再写。」 |
| 禁令 | 不得让用户以为离线时点的按钮"排队会成功"。没有隐式队列 |

### E.5 同步（Doc 20 §228）

六态，**必须区分"本地已保存"与"服务端已确认"**：

| 状态 | 图标 | 文案 | 颜色 |
|---|---|---|---|
| 本地已保存 | 折角纸 | `已保存在这台设备上 — 还没有上传` | info |
| 正在同步 | 圆弧 | `正在上传…` | info |
| 已同步 | 圆+勾 | `已保存到服务器` | success |
| 冲突 | 双圆错位 | `这一项在别处被改过 — 需要你选择怎么处理` | warning |
| 同步失败 | 八角 | `没有上传成功。内容还在这台设备上，可以再试一次。` | danger |
| 需要复核 | 方框旗 | `已上传，等待工作人员复核` | moderation |

**铁律（Doc 20 §228 末句）**：本地保存**绝不**呈现为"已发布/已发送"。`success` 绿色只允许用于"服务端已确认"。

### E.6 陈旧（Doc 20 §229）

```text
[双圆错位图标] 你看到的内容不是最新的
                这一页是在 {时间} 载入的，之后{对象}被改过。
                现在显示的是最新版本（第 {n} 版）。
                变化：{差异摘要}
                [用最新版本继续]  [先看看变化]
```

| 项 | 规范 |
|---|---|
| 触发 | 服务端版本号 ≠ 页面持有版本号 |
| 行为 | **自动载入最新版**，展示差异，让用户重做或修订 |
| 不可忽略 | Consent / Block / MutualAcceptance / DatasetLock 的陈旧**必须阻断**动作，不给「忽略」选项（Doc 20 §229 末句） |
| 文案 | 不说「你的页面过期了」（指责）；说「这一页是在 {时间} 载入的」（陈述） |

### E.7 版本冲突（I12；Doc 20 §230）

```text
[双圆错位图标] 你的修改和别人的修改撞上了
                你的草稿**没有丢**，也**没有**覆盖别人的修改。
                你的版本（第 {a} 版，你在 {t1} 编辑）
                服务器上的版本（第 {b} 版，{谁} 在 {t2} 编辑）
                [并排比较]
                [合并]  [用服务器版本重来]  [另存为副本]  [取消]
```

| 项 | 规范 |
|---|---|
| 首要保证 | 草稿保留，**禁止静默覆盖**（Doc 20 §230） |
| 必须展示 | 双方版本号、编辑者、编辑时间、差异 |
| 动作 | 合并 / 刷新 / 另存副本 / 取消 —— 按场景提供适用子集，不提供不适用的 |
| 署名 | "别人是谁"仅在该用户对当前用户可见时显示；否则「另一位有权限的工作人员」（受保护存在，§E.9） |
| 严重度 | 阻断级（`role="alert"` + 焦点移入） |

### E.8 错误四级严重度（I13；Doc 20 §232–237）

先说明第 0 级：**信息性**不是错误，**不得使用 warning 样式**（Doc 20 §233）。用 `info` 语义色，`role="status"`，不打断。

| 级别 | 语义色 | 放置 | 持久性 | 打断 | 升级 |
|---|---|---|---|---|---|
| 0 信息性 | info | 就近内联 | 直到状态改变 | 否 | 无 |
| 1 **可恢复** | warning | 出错处就近内联 | 直到解决 | `role="alert"` | 无 |
| 2 **阻断** | danger | 内容区顶部，替换动作区 | 直到解决 | `role="alert"` + 焦点移入 | 提供支持路径 |
| 3 **安全关键** | safety | 模态接管 | 直到人工处理 | `alertdialog` | 路由到问责复核 |
| 4 **安全性关键** | danger（实心） | 模态接管 + 会话处理 | 直到重新认证 | `alertdialog` | 隐藏受保护细节 |

#### 1 级 · 可恢复（§234）

**必备**：保留输入 / 指出如何修正 / 安全重试 / 备选路径 / 求助入口。

```text
[三角] 这条消息还没有保存
       你写的内容还在下面的框里，没有丢。
       原因：内容超过了 2000 字，现在是 2140 字。
       请删掉一些内容再点「保存草稿」。
       > 技术细节：VALIDATION_TOO_LONG
```

其它模式：

- 必填未填：`这一项需要填写：{字段名}。填好之后就可以继续。`（焦点移到该字段）
- 网络瞬断：`没有连上服务器。你写的内容还在。[再试一次]`
- 重试安全性：可安全重试的写「[再试一次]」；不确定是否已生效的写「这次请求可能已经生效了。请先[刷新看看结果]，不要直接重试。」

#### 2 级 · 阻断（§235）

**必备**：说明被挡住的是什么动作 / 不指责 / 保留之前的工作 / 给出明确解决或求助路径。

```text
[八角] 现在不能发布到「园艺角」
        你的草稿已经保存，没有丢，也没有发布出去。
        原因：这个社区的规则在你加入之后更新到了第 3 版，需要你先看过新规则。
        [查看第 3 版规则]
        如果你觉得这不对，可以在「帮助与安全」里联系研究团队。
```

其它模式：

- 前置条件缺失：`要{做这件事}，需要先{前置}。[去{前置}]`
- 状态不允许：`这个{对象}现在是「{状态}」，在这个状态下不能{动作}。[查看状态说明]`
- 双人批准中自批：`这一项是你提交的，需要另一位有权限的同事来批准。[查看还有谁可以批准]`
  > 现有 `staff-queues.test.tsx` 断言 `/是你，不能自批/`。改文案会破坏该测试，见 §G.4。

#### 3 级 · 安全关键（§236）

**必备**：停止不安全的动作 / 紧急与支持选项始终可见 / 路由到问责复核 / **不给虚假安慰**。

```text
[盾形] 这一步先停下来
        我们没有继续刚才的操作。
        你写的内容已经保存，工作人员会看到。

        如果你或其他人现在有危险，请直接拨打当地紧急电话。
        本平台不是紧急求助渠道。

        接下来：这件事会转给工作人员处理，不是由自动系统单独决定。
        [我知道了]  [联系研究团队]
```

| 项 | 规范 |
|---|---|
| 结构 | `role="alertdialog"` + `aria-modal="true"` + 标题关联 |
| 紧急路径 | 紧急电话说明**恒在**，不折叠、不放 `<details>` |
| 禁令 | 不得说「一切正常」「已经安全了」「别担心」；不得承诺响应时间除非有 SLA |
| 人的权威 | 必须写明「由工作人员处理，不是自动系统单独决定」（Doc 20 §13.19） |
| 关闭 | 关闭按钮存在，但关闭不撤销已触发的问责流程；关闭后焦点回触发点 |
| 不阻塞求助 | 该对话框**不得**遮挡「帮助与安全」入口 |

#### 4 级 · 安全性关键（§237）

**必备**：可能结束/限制会话 / 隐藏受保护细节 / 可能要求 step-up 认证 / 给出安全的求助路径。

```text
[实心八角] 为了保护账户，这次操作没有继续
            没有任何内容被更改。
            这次操作需要再确认一次身份。
            [重新验证身份]
            如果不是你本人在操作，请通过{支持渠道}联系我们。
```

| 项 | 规范 |
|---|---|
| 信息最小化 | **不说明具体触发原因**（不泄露检测规则）；不显示 IP、设备、时间等可用于探测的细节 |
| 受保护细节 | 页面上已渲染的敏感内容立即遮蔽 |
| step-up | 若需 MFA：说明为什么需要（「这一步会锁定研究数据集，不能撤销」），不只说"需要 MFA" |
| 会话终止 | 若必须登出：先保存草稿到服务端，登出后提示「你写的内容已经保存，重新登录后还在」 |
| 求助 | 求助渠道必须是**带外**的（不依赖已被限制的会话） |
| 禁令 | 不得指责（「检测到异常行为」→「这次操作需要再确认一次身份」） |

### E.9 受保护存在（I3；ADR-050、Doc 20 §27）

**跨所有状态的统一措辞**。后端已强制不泄露存在性，前端必须有唯一呈现：

```text
[闭锁图标] 找不到这一项
            它可能不存在，也可能你现在看不到它。
            这两种情况我们不做区分，这是为了保护每个人的隐私。
            [回到{上一层}]
```

| 铁律 | 说明 |
|---|---|
| 404 与 403 **前端呈现完全相同** | 不得用不同文案、不同图标、不同颜色 |
| 不得说「你没有权限」 | 那等于确认了对象存在 |
| 不得禁用而非隐藏 | 一个"灰掉的按钮"会泄露"这里有东西" |
| 被屏蔽方视角 | 被屏蔽的人看到的是"找不到"，不是"你被屏蔽了" |
| 加载态也不得泄露 | 不得先渲染骨架再变 404 —— 骨架的形状会泄露对象类型 |

### E.10 严重度不靠 elevation 表达（Doc 20 §319）

安全关键错误的"重要性"由**位置（模态）+ 持久性（不自动消失）+ 文字（明说后果）+ 语义色 + 图标**表达。
**禁止**：把 3/4 级错误的阴影调大、加发光、加边框动画、加声音。

### E.11 会话超时（I14；Doc 20 §238–239）

| 模式 | 警告 | 登出 |
|---|---|---|
| 普通 | 空闲 20 分钟 | 25 分钟 |
| 共享设备 | 空闲 5 分钟 | 7 分钟 |

警告结构（`--layer-live`，最高层）：

```text
[圆弧] 还有 {mm:ss} 就会自动退出
        这是为了保护你的隐私。
        你写的内容已经保存成草稿。
        [继续使用]  [保存并退出]
```

规则：

- 倒计时**必须**同时有文字（不只有进度条），并用 `role="timer"`；每 30 秒更新一次 `aria-live="polite"`（不是每秒，避免刷屏）。
- 超时后敏感内容隐藏，页面显示中性的「已经自动退出。重新登录后可以继续。」
- **超时不得静默作废同意或评估**（Doc 20 §296）：进行中的同意变更/评估在超时前必须落草稿，超时后重新登录可继续。
- 提供「延长」的前提是延长是安全的；共享设备模式下**不提供**无限延长，最多延长一次。

**状态：已实现（2026-08-05）**。两档限时、文字倒计时与 `role="timer"`、整半分钟的 `aria-live="polite"` 播报（由独立的隐藏区域承担——把每秒变化的数字放进朗读区域会把其他一切埋掉）、共享设备最多延长一次而普通模式不限次、超时后回到登录页并显示中性说明，都已落地。

三处按事实偏离本节：

- **不说「你写的内容已经保存成草稿」**：本平台没有任何地方保存草稿，这句话会在它即将被打破的那一刻做出承诺。改说「你打了还没送出或保存的内容会丢失」，并由测试守住原文案不得出现（D-20）。上面那条「超时不得静默作废进行中的同意变更或评估」，在草稿机制存在之前只能靠「先警告、再登出」满足，不能靠「已经存好了」满足。
- **做对话框，不做粘性条**：§D.5 一边把本警告列进粘性元素，一边规定粘性元素总高 ≤ 视口 25%，量出来这两条矛盾——320×844 下这段话占 665px（79%），`xxl` 下 790px。压进 211px 的唯一办法是删掉「会丢什么」那句，而那正是它存在的理由。25% 上限管的是与内容并存的常驻框架元件；打断式警告在那一刻本身就是内容（D-19）。**不加遮罩、不声明 `aria-modal`**：在它后面点一下就是「人还在」，计时器因此重置、警告随即消失。
- **「空闲」只认按下与按键，不认指针移动**：袖子压在触控板上不该等于「人还在」。

---

## §F CSS 草案（可直接粘贴进 `apps/web/src/styles.css`）

> **本草案未写入 `apps/web/src/styles.css`**，按简报要求只作为附录交付。
> 落地方式：**替换**现有文件全部内容（现有 95 行的全部行为都已在本草案中保留或增强：18px 根字号、rem 尺寸、可见焦点、44px 目标、skip-link、reduced-motion、`main li` 块级按钮修补）。
> 落地后需同时执行 §G 中标注为「需要代码改动」的项，否则部分规则（如 flex 间距替代 `{' '}`）不会生效。

```css
/* =============================================================
   健康老龄化研究平台 — 设计系统基座 v0.1
   Doc 20 v1.3 §285–320 / WCAG 2.2 AA
   规则：组件样式只引用 semantic 令牌；本文件之外不得出现字面色值/px/ms。
   ============================================================= */

/* ---------- 1. 令牌：非颜色（主题无关） ---------- */
:root {
  /* -- 能力自适应的两个乘数（§C） -- */
  --scale-font: 1;
  --density: 1;

  /* -- 排版 (§A.2) -- */
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

  /* -- 间距 (§A.3)：单一刻度 × 密度乘数 -- */
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

  /* -- 形状与描边 (§A.4) -- */
  --radius-0: 0;
  --radius-1: 0.25rem;
  --radius-2: 0.5rem;
  --radius-3: 0.75rem;
  --radius-pill: 999rem;
  --border-hairline: 1px;
  --border-default: 2px;
  --border-strong: 3px;
  --border-emphasis: 4px;

  /* -- 焦点 (§A.5)：恒定，不随密度/字号缩放 -- */
  --focus-ring-width: 3px;
  --focus-ring-offset: 2px;
  --focus-halo-width: 2px;
  --focus-ring-total: calc(var(--focus-ring-width) + var(--focus-ring-offset));

  /* -- 触控目标 (§A.8)：恒定 -- */
  --target-min: 2.75rem;
  --target-gap: 0.5rem;
  --target-hit-slop: 0.25rem;

  /* -- 动效 (§A.6) -- */
  --motion-duration-instant: 0ms;
  --motion-duration-fast: 120ms;
  --motion-duration-normal: 200ms;
  --motion-duration-slow: 320ms;
  --motion-ease-standard: cubic-bezier(0.2, 0, 0.2, 1);
  --motion-ease-enter: cubic-bezier(0, 0, 0.2, 1);
  --motion-ease-exit: cubic-bezier(0.4, 0, 1, 1);

  /* -- 层级 (§A.7)：elevation 不表示置信度或权威 -- */
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

  /* -- 图标 (§A.9) -- */
  --icon-size-1: 1em;
  --icon-size-2: 1.25em;
  --icon-size-3: 1.5em;
  --icon-stroke: 2;
  --icon-gap: var(--space-2);
}

/* ---------- 2. 令牌：颜色 — Light（默认） (§A.1.1) ---------- */
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

  --color-border-subtle: #d5dae2;  /* 装饰专用，1.40:1 */
  --color-border-default: #767e8c; /*  4.09:1 / page */
  --color-border-strong: #414855;  /*  9.20:1 / page */

  --color-action-primary-bg: #1a4fa0;        /* 7.87:1 / page */
  --color-action-primary-fg: #ffffff;        /* 7.87:1 / bg   */
  --color-action-primary-bg-hover: #123b7c;  /* 10.81:1 / fg  */
  --color-action-primary-bg-active: #0d2e62; /* 13.16:1 / fg  */
  --color-action-secondary-fg: #14448c;
  --color-action-secondary-border: #1a4fa0;
  --color-action-secondary-bg-hover: #e8eef8;

  --color-focus-ring: #12233f; /* ≥13.51:1 与任一 surface；15.70:1 与 halo */
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

/* ---------- 3. 令牌：颜色 — Dark (§A.1.2) ---------- */
/* 两套写法并存：媒体查询（无 JS 也生效）+ 属性选择器（用户显式选择优先） */
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

    --color-focus-ring: #f2f6ff; /* ≥14.19:1 与任一 surface；18.63:1 与 halo */
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

    /* dark 下阴影不可见：改用描边环作为浮层边界（≥3:1） */
    --elevation-1: 0 0 0 1px var(--color-border-default);
    --elevation-2: 0 0 0 1px var(--color-border-default), 0 4px 12px rgb(0 0 0 / 0.6);
    --elevation-3: 0 0 0 1px var(--color-border-strong), 0 10px 28px rgb(0 0 0 / 0.7);
  }
}
/* 用户显式选择 dark（与上方同值；属性选择器胜出于媒体查询默认） */
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

/* ---------- 4. 能力自适应模式覆盖 (§C) ---------- */
/* 绝不按年龄或分组自动判定：这些属性只能由用户显式设置写到 <html> 上。 */
:root[data-font-scale='lg'] { --scale-font: 1.125; }
:root[data-font-scale='xl'] { --scale-font: 1.25; }
:root[data-font-scale='xxl'] { --scale-font: 1.5; }

:root[data-density='compact'] { --density: 0.75; }
:root[data-density='standard'] { --density: 1; }
:root[data-density='spacious'] { --density: 1.25; }

/* 高对比：OS 信号作初始值，用户显式选择优先 */
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
  --color-action-primary-bg: #0b2e6b;    /* 12.98:1 与 #ffffff 前景 */
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
  --color-action-primary-bg: #bbd4ff;    /* 13.97:1 与 #000000 前景 */
  --color-action-primary-fg: #000000;
}

/* 简化模式：隐藏次要内容、加大行高。组件用 .optional 标记可省略的内容。 */
:root[data-simplify='on'] { --type-leading-normal: 1.8; }
:root[data-simplify='on'] .optional { display: none; }

/* 低刺激模式：去掉全部 tint 底，只留描边与文字 */
:root[data-stimulation='low'] {
  --color-info-bg: var(--color-surface-page);
  --color-success-bg: var(--color-surface-page);
  --color-warning-bg: var(--color-surface-page);
  --color-danger-bg: var(--color-surface-page);
  --color-safety-bg: var(--color-surface-page);
  --color-moderation-bg: var(--color-surface-page);
  --color-ai-bg: var(--color-surface-page);
}

/* ---------- 5. 基础排版与文档 ---------- */
:root {
  font-family: var(--type-family-ui);
  font-size: calc(112.5% * var(--scale-font)); /* 18px 基准 × 用户字号 */
  line-height: var(--type-leading-normal);
  color-scheme: light dark;
  color: var(--color-text-primary);
  background-color: var(--color-surface-page);
  /* 粘性头/尾不得遮住 Tab 到的元素 (§D.5) */
  scroll-padding-block: var(--space-8);
}

html,
body {
  /* 最后一道防线：任何触发它的布局都是缺陷 (§B.3.1) */
  overflow-x: clip;
}

body {
  margin: 0;
  padding: 0;
  color: var(--color-text-primary);
  background-color: var(--color-surface-page);
  /* 长标识符不撑破布局 */
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

/* ---------- 6. 应用外壳与布局 ---------- */
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
/* 员工工作区更宽（Doc 20 §301：员工可用更宽布局） */
main[data-workspace='staff'] { max-width: var(--measure-wide); }

section { margin-block-end: var(--space-6); }

/* 宽内容的唯一合法出口 (§B.3.2) */
.scroll-x {
  overflow-x: auto;
  border: var(--border-default) solid var(--color-border-default);
  border-radius: var(--radius-2);
  padding: var(--space-2);
}

/* ---------- 7. 焦点：双环，在所有 surface 与状态下可见 (§A.5) ---------- */
:focus-visible {
  outline: var(--focus-ring-width) solid var(--color-focus-ring);
  outline-offset: var(--focus-ring-offset);
  /* halo 填满 offset 间隙，使内侧相邻对比 ≥3:1，与元素填充色无关 */
  box-shadow: 0 0 0 var(--focus-halo-width) var(--color-focus-halo);
  border-radius: var(--radius-1);
}
/* 对话框打开后的编程式聚焦必须可见（此时不是 :focus-visible） */
[role='alertdialog'] :focus,
[role='alertdialog'][tabindex='-1']:focus,
h1[tabindex='-1']:focus,
h2[tabindex='-1']:focus {
  outline: var(--focus-ring-width) solid var(--color-focus-ring);
  outline-offset: var(--focus-ring-offset);
  box-shadow: 0 0 0 var(--focus-halo-width) var(--color-focus-halo);
}
/* 焦点环不得被裁掉 (§A.5) */
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

/* ---------- 8. 触控目标：R1–R5 防复发规则 (§B.4) ---------- */
/* R1：--target-min 是唯一来源。R2：交互元素绝不是 inline 级。 */
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
  display: inline-flex;      /* R2：绝不 display:inline */
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

/* 主动作（每屏至多一个，Doc 20 §13.2） */
.btn-primary {
  background-color: var(--color-action-primary-bg);
  border-color: var(--color-action-primary-bg);
  color: var(--color-action-primary-fg);
}
.btn-primary:hover { background-color: var(--color-action-primary-bg-hover); }
.btn-primary:active { background-color: var(--color-action-primary-bg-active); }

/* 破坏性动作：颜色不是唯一指示，组件必须同时带图标与明确文字 */
.btn-danger {
  border-color: var(--color-danger-border);
  color: var(--color-danger-fg);
}

/* 禁用：必须配说明文字 (§B.1.4)；优先用 aria-disabled 保留可聚焦性 */
button:disabled,
[aria-disabled='true'] {
  background-color: var(--color-disabled-bg);
  border-color: var(--color-disabled-border);
  color: var(--color-disabled-fg);
  cursor: not-allowed;
}

/* R3：间距由布局提供，禁止靠空白文本节点。 */
/* 任何并排的动作组统一用这个容器（替代 JSX 里的 {' '}）。 */
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
  min-width: 12rem;          /* R4：换行后每行仍是完整可点块 */
}
/* B.4.4：关键控件与确认按钮的额外净距 */
.actions--critical { gap: var(--space-5); }
/* 确认对话框：取消恒在前，确认在后；窄屏纵向排列 */
.actions--confirm { flex-direction: column; gap: var(--space-5); }
@media (min-width: 40rem) {
  .actions--confirm { flex-direction: row; }
}

/* R4：内容流中的单一动作 = 整行块级目标（保留并推广现有首页的修补） */
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

/* R5：包含交互元素的容器不得压缩目标 */
main li,
.card,
.actions {
  height: auto;
  overflow: visible;
}

/* 表单 */
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

/* ---------- 9. 导航 ---------- */
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
/* aria-current 三通道：结构（左条）+ 字重 + 颜色，绝不只靠颜色 */
nav [aria-current='page'] {
  border-inline-start: var(--border-emphasis) solid var(--color-action-primary-bg);
  font-weight: var(--type-weight-bold);
  background-color: var(--color-action-secondary-bg-hover);
}

main ul { padding-inline-start: var(--space-5); }
main ul:not([class]) > li { max-width: var(--measure-default); }

/* ---------- 10. 状态呈现：图标 + 文字 + 颜色 + 结构 (§B.1 / §E) ---------- */
.icon {
  inline-size: var(--icon-size-1);
  block-size: var(--icon-size-1);
  flex: none;
  stroke-width: var(--icon-stroke);
}

/* 行内徽章：文字必须是真实文本节点，绝不用 ::before content */
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

/* 块级状态容器：第四通道 = 左侧 4px 结构条 */
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

/* 骨架：绝不模仿徽章/按钮/对勾的形状 (§E.2) */
.skeleton {
  background-color: var(--color-surface-sunken);
  border-radius: var(--radius-1);
  block-size: var(--type-size-2);
  margin-block: var(--space-2);
}

/* ---------- 11. 卡片、引用、对话框 ---------- */
.card {
  border: var(--border-default) solid var(--color-border-default);
  border-radius: var(--radius-2);
  padding: var(--space-4);
  margin-block: var(--space-4);
  background-color: var(--color-surface-raised);
  box-shadow: var(--elevation-0); /* 内容卡片不抬升 */
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

/* 上下文横幅（当前身份，共享设备场景恒显） (§D.6) */
.context-banner {
  background-color: var(--color-surface-inverse);
  color: var(--color-text-inverse);
  padding: var(--space-2) var(--space-4);
  position: sticky;
  inset-block-start: 0;
  z-index: var(--layer-header);
}

/* 表格：宽表放进 .scroll-x，不让页面横向滚动 (§B.3.2) */
table { border-collapse: collapse; width: 100%; }
th, td {
  text-align: start;
  padding: var(--space-2) var(--space-3);
  border-block-end: var(--border-hairline) solid var(--color-border-subtle);
  line-height: var(--type-leading-snug);
}
th { font-weight: var(--type-weight-medium); background-color: var(--color-surface-sunken); }

/* ---------- 12. 响应式 (§D)：只用 min-width，移动优先 ---------- */
@media (min-width: 40rem) {
  main { padding-inline: var(--space-5); }
}
@media (min-width: 56rem) {
  main[data-workspace='staff'] { padding-inline: var(--space-6); }
}
/* 矮视口（横屏手机、分屏）取消粘性，避免遮挡关键动作 (§D.5) */
@media (max-height: 30rem) {
  .context-banner { position: static; }
}

/* ---------- 13. 动效与 reduced-motion (§A.6) ---------- */
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

/* ---------- 14. 打印（研究者导出核对场景） ---------- */
@media print {
  nav, .actions, .skip-link { display: none; }
  main { max-width: none; }
  .state, .card { break-inside: avoid; }
  /* 打印时颜色必然丢失 —— 这正是状态必须带图标与文字的原因 */
}
```

**草案自查（已复核）**：唯一令牌名 **119** 个，`--` 声明合计 **254** 条（颜色 47×2 = 94，非颜色 72，自适应模式覆盖 39，其余为 dark 主题的 elevation 重定义）；组件区零字面色值；`px` 仅出现于描边宽度/焦点环/阴影；`overflow: hidden` 零处；`outline: none` 零处；`content:` 仅出现在 §B.4.2 的命中区扩展伪元素（空字符串，不承载文字）。

---

## §G 对现有 34 个测试与可访问名的影响

### G.0 判定依据（已核实）

`@testing-library/dom@10.4.1` 的 `getNodeText`（`node_modules/.pnpm/@testing-library+dom@10.4.1/.../get-node-text.js:12`）：

```js
Array.from(node.childNodes)
  .filter(child => child.nodeType === TEXT_NODE && Boolean(child.textContent))
  .map(c => c.textContent).join('')
```

**只取直接文本子节点**。由此得出三条可操作结论：

1. 在元素内**新增 `<svg aria-hidden>` 兄弟节点**不影响 `getByText`（SVG 不产生文本节点），也不影响可访问名（`aria-hidden` 从名称计算中剔除）。
2. **把整段文字包进一层 `<span>`** 不会破坏 `getByText('X')`——匹配从父元素转移到该 span，仍是唯一匹配。
3. **把一段被断言的文字拆到两个元素**会破坏断言。这是唯一的真实风险。

### G.1 现状核对

- 34 个测试中查询方式为：`getByRole('button'|'alert'|'alertdialog'|'status'|'note'|'list', {name})`、`getByLabelText`、`getByText`、`textContent.toContain`。
- **无** `getByRole('table' | 'row' | 'cell' | 'grid')` 查询 → §D.4 的表格策略当前无冲突。
- **无** `getByTestId` → 不能靠 test-id 规避。
- `getByRole('list', { name: '消息记录' })` 依赖 `<ol aria-label="消息记录">`；样式化该列表不得移除 `aria-label`。

### G.2 不改变可访问名的改动（可直接执行）

| 改动 | 为什么安全 |
|---|---|
| 全部令牌与基础样式（§F 草案） | 纯 CSS |
| 在状态文字前插入 `<svg class="icon" aria-hidden="true" focusable="false">` | 不产生文本节点；从可访问名计算中剔除 |
| 用 `<div class="actions">` 包裹并排按钮，删除 JSX 中的 `{' '}` | 按钮自身文本不变；`{' '}` 本就是按钮**之外**的文本节点 |
| 给现有元素加 `className` | 不影响角色与名称 |
| `MessagePanel` 中的行内 `style={{...}}` 改为 class | 同上 |
| 给 `<main>` 加 `data-workspace="staff"` | 属性不参与名称计算 |
| 加 `.app-shell` class 到已存在的最外层 `<div>` | 该 `<div>` 已存在 |
| 加「显示与阅读设置」「遮住屏幕」「退出登录」导航项 | **新增**可访问名，不改动已有 6 项 |
| 加空状态/骨架/离线横幅 | 新增元素 |

### G.3 会影响测试但**不**改变可访问名的改动（需同步调整测试）

| 改动 | 影响 | 建议 |
|---|---|---|
| §B.4.4 确认对话框按钮顺序统一为「返回/取消」在前、「确认」在后 | 按名查询不受影响；但若某测试用 `getAllByRole('button')[0]` 或依赖 DOM 顺序，会失败 | 已核对：现有测试**均按名查询**，无序号依赖 → **无需改测试**。此改动落地时需复跑确认 |
| 队列统一为 `<ul>` + CSS Grid 表格外观（§D.4） | 若未来引入 `<table>` 再改回会破坏角色查询 | 现在就定死语义，避免以后返工 |
| `<h1 tabindex="-1">` 焦点管理（§B.2） | `tabindex` 不影响名称/角色 | 无需改测试 |

### G.4 **会改变可访问名或断言文本**的改动（需产品与工程共同确认）

这是唯一需要单列的一节。共 3 项：

**G.4.1 错误码从主文案移入 `<details>`（§E.0 文案宪法第 6 条）**

- 现状：`api.ts` 消费方拼接 `未能获取消息记录：${err.error.code}`、`未成功：${err.error.code}`、`发送确认未成功：${err.error.code}`、`网络错误，草稿未保存` 等，直接渲染进 `role="status"` / `role="alert"`。
- 规范要求：主文案说明「发生了什么 / 内容是否还在 / 什么没有发生 / 下一步」，错误码折进 `<details><summary>技术细节</summary>`。
- **影响**：`role="status"` / `role="alert"` 的 `textContent` 改变。
- **核对结果**：现有 34 个测试中**没有**断言这些错误文案（已 grep：测试只断言 `访问口令`、`与你的账号和权限无关`、`请再点一次刚才的操作`、`对方不会收到通知`、投递状态标签等成功路径文案）。→ **预计零测试破坏**，但改动前必须复跑全量。
- **需要决策**：新错误文案的具体措辞（见 §I.1）。

**G.4.2 「拒绝『开放匹配』」等按钮的图标化（如果采纳）**

- 若在按钮内插入 `<svg aria-hidden>`：可访问名**不变**（`getByRole('button', { name: '拒绝「开放匹配」' })` 仍通过）。
- 若插入的是**带文字的** `<title>` 或 `aria-label`：名称**会变**。
- **本规范的决定**：图标一律 `aria-hidden="true"` 且**永不**携带 `aria-label` / `<title>`。→ **零影响**。此项列出仅为明确禁令。

**G.4.3 `staff-queues.test.tsx` 的「是你，不能自批」文案**

- 现状断言：`screen.getByText(/是你，不能自批/)`。
- §E.8「2 级 · 阻断」的文案模式建议改为：`这一项是你提交的，需要另一位有权限的同事来批准。`——不指责、说明下一步。
- **影响**：该断言**会失败**。
- **需要决策**：是否采纳新措辞（见 §I.1）。若采纳，同步改测试为 `/需要另一位有权限的同事/`。
- 类似候选（同样需决策，当前均未被测试断言）：`密码级别下会被拒绝`、`会被服务端拒绝`——这两条其实已符合"说明原因"的要求，建议**保留原文**，仅补充下一步动作作为第二句（追加句不会破坏 `toContain` 断言）。

### G.5 明确保留、不得改动的文案（已被测试锁定且措辞已合规）

以下文案经核对**符合本规范的诚实与不指责要求**，本设计系统**不建议改动**：

`草稿 — 尚未发送`、`已确认，排队发送中`、`已提交给发送服务`、`发送服务已接受（对方尚未收到）`、`已送达对方`、`发送失败 — 可重试`、`送达状态未知 — 正在核实，不代表成功`、`草稿 — 只有你能看到`、`对方不会收到通知`、`已锁定的研究数据集不会被改写`、`不会由自动系统单独决定`、`本平台不是紧急求助渠道`、`即使你之后屏蔽了对方，这份报告仍会被处理`、`不显示举报人身份`、`是否采纳始终由本人决定`、`不是本人证言`、`与你的账号和权限无关`、`请再点一次刚才的操作`、`不可更改`、`帖子按时间从新到旧显示。`

以及全部 34 个按名查询的按钮文案（`保存草稿`、`确认发布`、`返回，不屏蔽` …）。**设计系统不改按钮文案。**

---

## §H 关键取舍

**H.1｜不引入图标库与图标字体，图标全部内联 SVG，且不存在纯图标按钮。**
代价：图标制作与灰度可辨性验收成为人工工作量；按钮更宽，移动端一行放不下三个动作。
换取：零依赖、离线可用、可访问名恒等于可见文字（与现有 34 个按名查询的测试策略完全对齐），且天然满足 Doc 20 §320「AI/Block/Report/Visibility/Safety/Draft 必须有文字标签」。
放弃的方案：图标+`aria-label` 的紧凑工具栏——它会让可访问名与可见文字分离，中文界面里尤其危险。

**H.2｜不下载 Web 字体，用系统字族。**
代价：跨平台中文字形不一致（PingFang / 微软雅黑 / Noto 的字重与字面不同），设计稿的排版精度下降。
换取：首屏无字体闪烁、离线可读、低带宽下不出现"方块字"，且不产生第三方字体 CDN 的隐私外流（THREAT_MODEL 关注项）。

**H.3｜断点用 `rem` 而非 `px`。**
代价：把浏览器字号调到 32px 的用户，在 1280px 宽的桌面上也会拿到单列布局——员工可能觉得"浪费了屏幕"。
换取：大字用户自动获得单列、无横向滚动的布局，这正是 WCAG 1.4.4/1.4.10 想要的结果。判断：参与者的可读性优先于员工的信息密度。若员工强烈反对，可用 `data-density="compact"` 局部补偿，但断点不改。

**H.4｜三档密度用一个 `--density` 乘数，而不是三套间距刻度；且密度不缩放触控目标、焦点环。**
代价：紧凑模式的压缩幅度受限（只能到 0.75×），做不出真正"Excel 级"的密集表格。
换取：Doc 20 §315 明确要求"不产生互不兼容的独立系统"；更重要的是，任何允许密度压缩 44px 目标的设计都会重演 §B.4 那个真实缺陷。宁可紧凑模式不够紧凑。

**H.5｜Doc 20 §286 的八种能力模式，本系统只交付其中四种（令牌可实现的），并在 §C.2 中如实标注另外四种未交付。**
代价：不能宣称"已支持八种模式"，PILOT_READINESS 相关条目要保持未满足。
换取：Step-by-Step / Read-Aloud / Supporter-Assisted / Extended Time 分别属于流程拆分、TTS 与多模态同意、权限模型、会话策略——把它们塞进令牌层只会产出假的合规声明。这与 Doc 19 的认识论纪律一致：不把设计假设呈现为已实现的能力。

---

## §I 需要产品决策的未决项

**I.1｜错误文案的最终措辞，特别是 `是你，不能自批`（阻塞 §G.4.3）**
§E.8 给出的是模式，不是最终文案。需要决定：(a) 是否统一改写现有员工侧错误文案为"不指责 + 下一步"格式；(b) 若改，`staff-queues.test.tsx` 的断言同步更新由谁执行。
建议：参与者侧文案**必须**改（认知负荷与尊严直接相关）；员工侧可先保留，仅追加第二句动作提示（不破坏 `toContain` 断言）。**需要产品拍板。**

**I.2｜参与者移动端导航：顶部横向滚动 vs 底部固定栏**
Doc 20 §304 说移动端用「bottom or compact primary navigation」，二选一未定。
- 底部栏：拇指可达（老年用户手部灵活度考量），但占用垂直空间、在小视口 + 大字号下会挤压内容，且与 iOS Safari 底部工具栏冲突。
- 顶部横滚：不占垂直空间，但 6 个 44px 项在 320px 宽下必须横滚，而横滚导航对屏幕阅读器与开关设备不友好。
本文件按现状（顶部 `flex-wrap: wrap`）出规范，**但这需要真实用户测试（R3）来决定**，不应由设计代理单方面拍板。

**I.3｜Safety 语义色定为紫色（`#5B2080` / `#D9B8F2`）**
理由是必须与 danger（红）和 moderation（青）三方可分。但紫色在部分文化语境中与哀悼/宗教相关，Doc 20 §320 要求图标"经过文化审查"，颜色同理。**需要文化与伦理评审确认**，尤其在中文语境下。备选：深橙棕（但与 warning 距离过近）。

**I.4｜Read-Aloud（朗读）模式是否纳入原型范围**
Doc 20 §286 列为模式之一，§298–300 规定了语音交互与多模态同意。这牵涉：浏览器 TTS 还是服务端 TTS（后者有数据外流问题，见 THREAT_MODEL）；朗读内容是否包含他人的消息（隐私边界）；共享设备上朗读的隐私风险（§306 明确要求"谨慎"）。
**在产品决定之前，本设计系统不为其预留令牌，也不在设置界面中显示该选项。**

**I.5｜「遮住屏幕」隐私屏与共享设备模式的默认值**
§D.6 规定共享设备模式必须由用户显式勾选。但真实场景（社区中心公用平板）里，最需要这个模式的人最不可能主动勾选。
备选：(a) 由部署方在环境变量中把整个部署实例标记为"共享设备部署"，所有会话强制短超时；(b) 保持用户自选。
(a) 更安全但剥夺个体选择，且改变了同意与会话的语义。**需要伦理与部署方共同决策。**

**I.6｜对比度自动化门是否进 CI**
§A.1.5 建议把全部颜色组合写成单元测试。这会增加一个测试文件与约 90 条断言，并且**任何令牌调整都必须同步更新期望值**。收益是令牌回归可捕获，成本是改配色的摩擦变大。**需要工程决定是否接受这个摩擦。**
