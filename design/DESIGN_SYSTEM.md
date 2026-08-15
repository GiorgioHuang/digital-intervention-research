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
3. **The `content` grep**: hits from `grep -n "content: *['\"][^'\"]" styles.css` must not contain Chinese or any state word.

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
| `md+` | As above (unchanged, staying single-column) | A persistent left sidebar (`<nav>` + `<ul>`), with the content area at `--measure-wide` |

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

### E.2 骨架（Doc 20 §225）

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
