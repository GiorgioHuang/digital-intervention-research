# design/canvas

A visual philosophy and the plate that expresses it.

| File | What it is |
|---|---|
| `MEASURED_ABSENCE.md` | The philosophy. Generic by intent — an aesthetic position, not a brief for this platform |
| `MEASURED_ABSENCE.png` | The plate, 2800 × 4000 |
| `MEASURED_ABSENCE.pdf` | The same, 1050 × 1500 pt, one page |
| `build.mjs` | The generator. `node build.mjs` writes `plate.html`; render it with headless Chromium |

The figures on the plate are the real ones: words and controls visible on
each participant screen as somebody arrives at it, measured on 2026-08-22
before and after D-100/D-101. Six surfaces are unchanged and three are not,
which is the truth and a better image than a uniform reduction would have
been. The palette is the platform's own — `--color-surface-page`,
`--color-text-primary`, `--color-action-primary-bg` — rather than a palette
invented for the occasion.

`plate.html` is generated and deliberately not committed: it inlines the OFL
fonts as base64, and redistributing font binaries without their licence
files is not ours to do. The fonts live in the canvas-design skill.

Rebuild:

```bash
cd design/canvas
node build.mjs
CHROME=/opt/pw-browsers/chromium-1194/chrome-linux/chrome
$CHROME --headless --disable-gpu --no-sandbox --hide-scrollbars \
  --screenshot=MEASURED_ABSENCE.png --window-size=1400,2000 \
  --force-device-scale-factor=2 plate.html
$CHROME --headless --disable-gpu --no-sandbox \
  --print-to-pdf=MEASURED_ABSENCE.pdf --no-pdf-header-footer plate.html
```
