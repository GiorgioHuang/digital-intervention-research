# Brand assets

The `icareu` mark and wordmark, supplied by the owner (2026-08-29). These are the
source files; the copies that ship are listed below, and this directory is where a
replacement goes.

| File | What it is | Where it ships |
|---|---|---|
| `icareu-mark.svg` | The mark alone, on a 24×24 grid at stroke-width 2 | Inlined in `apps/web/src/components/elder/BrandMark.tsx` |
| `icareu-logo.svg` | Mark + wordmark, wordmark drawn as `<text>` with a forced `textLength` | Not shipped — see below |
| `favicon.svg` | The mark on a rounded `#f3f2f2` tile, 32×32 | Copied to `apps/web/public/favicon.svg` |
| `icareu-logo.png`, `icareu-logo-reverse.png` | Raster, for anywhere that cannot take SVG | Not shipped |

**The mark is inlined rather than linked.** It is 200 bytes of path data in the top
bar of every signed-in screen; a separate request for it would be a request that can
fail, and a brand that flickers in after the page is a worse first impression than
one that is simply there. Inlining also lets it take its colour from the stylesheet
(`--cl-accent`, which is `#b68235` — the mark's own colour, so nothing was
reinterpreted) instead of carrying a literal, which this project's token rules
forbid outside `:root`.

**`icareu-logo.svg` is not what the top bar renders.** Its wordmark is `<text>` with
`textLength="92" lengthAdjust="spacingAndGlyphs"`, which forces the glyphs to a fixed
width so the file looks right without the font installed. This app self-hosts
Cormorant Garamond, so the top bar sets the wordmark as live text instead: it stays
crisp at any size, it grows with the reading controls, and it is real text to a
screen reader and to find-in-page. The proportions follow the logo file — mark, then
the name at roughly 1.4× the mark's height.

**No app icon yet.** `favicon.svg` covers the browser tab. An `apple-touch-icon`
needs a square raster at 180×180 and neither PNG here is square, so none is declared
rather than declaring one that would be letterboxed or cropped through the middle of
the mark.
