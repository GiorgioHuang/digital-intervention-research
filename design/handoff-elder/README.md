# The Canadian Elder Life Story handoff

The design this participant workspace is being rebuilt to, kept in the repository so
that "what did the design actually say?" has an answer that does not depend on
somebody still having the zip.

| File | What it is |
|---|---|
| `HANDOFF.md` | The designer's document, verbatim. Screens, copy, sizes, states, and the list of what is deliberately not designed yet |
| `prototype-component.jsx.txt` | The prototype's own React component, lifted out of the `.dc.html`. **The authority when the prose and the build disagree** — it is what was actually seen and approved |
| `classical-tokens.css` | The Classical design system's token sheet. Values are read from here rather than retyped; the ones in use are mirrored into `apps/web/src/styles.css` as the `--cl-*` ramp |

Not copied in: `_ds_bundle.js` and `support.js` (the prototype's runtime, not the design)
and the fonts, which are self-hosted through `@fontsource` instead.

The prototype is a `.dc.html` canvas that loads React, ReactDOM and Babel from a CDN.
That CDN is blocked here, so rendering it needs those three served locally — the copies
in `node_modules` are the same versions. It is a reference, not something that has to run.

## What is being followed, and what is not

The owner's instruction is to implement the design strictly. Two places where it meets an
existing ruling are recorded rather than resolved quietly:

- **Weighting a pair of answers.** The design gives the accepting button an accent outline
  and the declining one a divider outline. `DESIGN_SYSTEM` §788's acceptance covers
  background, font weight and border *width* — not border colour — so the design sits
  inside the letter of that rule; the guard written on 2026-08-22 was stricter than the
  rule it enforced and is relaxed to match it. What that no longer catches is written into
  the test.
- **The consent model.** The design asks four questions with two or three options each;
  M03 holds six scopes with grant / decline / withdraw. The screens follow the design and
  the divergence is `BACKEND_GAPS.md` B-5.
