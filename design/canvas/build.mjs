import { readFileSync, writeFileSync } from 'node:fs';

const FONTS = '/root/.claude/skills/synced/canvas-design/canvas-fonts';
const b64 = (f) => readFileSync(`${FONTS}/${f}`).toString('base64');

/* ── Palette: the ground of a room, ink that remembers it, one reserved accent ── */
const PAPER = '#F7F8F6';
const INK = '#243331';
const GREY = '#566461';
const TEAL = '#287C78';

/* ── Measure ─────────────────────────────────────────────────────────────────
   Nine surfaces. `was` and `is` are words; `cw`/`ci` are controls. Six are
   unchanged, three are not — which is the truth, and a better image than a
   uniform reduction would have been.                                        */
const SURFACES = [
  { id: '01', name: 'ARRIVAL',        was: 191, is: 113, cw: 11, ci: 3 },
  { id: '02', name: 'PERMISSION',     was: 395, is: 354, cw: 18, ci: 12 },
  { id: '03', name: 'WHO MAY SEE',    was: 216, is: 216, cw: 6,  ci: 6 },
  { id: '04', name: 'A COPY',         was: 49,  is: 49,  cw: 1,  ci: 1 },
  { id: '05', name: 'CORRESPONDENCE', was: 52,  is: 52,  cw: 1,  ci: 1 },
  { id: '06', name: 'THE ARCHIVE',    was: 44,  is: 44,  cw: 1,  ci: 1 },
  { id: '07', name: 'ENCOUNTER',      was: 83,  is: 83,  cw: 4,  ci: 4 },
  { id: '08', name: 'THE COMMONS',    was: 102, is: 102, cw: 1,  ci: 1 },
  { id: '09', name: 'RECOURSE',       was: 420, is: 237, cw: 24, ci: 9 },
];

const W = 1400, H = 2000;
const ML = 156, MR = 156;
const MEASURE = W - ML - MR;              // 1088
const MAXW = Math.max(...SURFACES.map((s) => s.was));
const PITCH = MEASURE / MAXW;             // one tick per word
const TICK_H = 30;

/* Each register is one thing, not three: label, accumulation, rule, controls,
   set close enough to read as a unit and spaced so that no unit touches the
   next. The step is chosen so that nine of them reach the foot — the empty
   band beneath them was leftover, and leftover is not the same as measured. */
const REG_TOP = 540;
const REG_STEP = 132;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const n = (v) => Number(v.toFixed(3));
const parts = [];
const P = (s) => parts.push(s);

/* ── Ground: paper, with a grain that is felt rather than seen ───────────── */
P(`<rect width="${W}" height="${H}" fill="${PAPER}"/>`);
P(`<rect width="${W}" height="${H}" fill="url(#grain)" opacity="0.5"/>`);

/* ── Plate frame: a single hairline, inset. The first measurement. ───────── */
P(`<rect x="${ML - 40}" y="96" width="${MEASURE + 80}" height="${H - 96 - 118}" fill="none" stroke="${INK}" stroke-opacity="0.16" stroke-width="0.75"/>`);

/* ── Head ───────────────────────────────────────────────────────────────── */
P(`<text x="${ML}" y="188" class="mono xs" fill="${GREY}" letter-spacing="3.4">PLATE IV — OF NINE SURFACES AND WHAT THEY ASK</text>`);
P(`<line x1="${ML}" y1="212" x2="${W - MR}" y2="212" stroke="${INK}" stroke-opacity="0.22" stroke-width="0.75"/>`);

P(`<text x="${ML}" y="330" class="disp" fill="${INK}" letter-spacing="15">MEASURED</text>`);
P(`<text x="${ML}" y="428" class="disp" fill="${INK}" letter-spacing="15">ABSENCE</text>`);

/* Right-hand apparatus block: the reading, stated flatly. */
const rx = W - MR;
/* Two alignments nobody will notice and everything rests on: the third
   legend line shares MEASURED's baseline, and the figure shares ABSENCE's.
   The block stops floating beside the title and starts belonging to it. */
P(`<text x="${rx}" y="286" text-anchor="end" class="mono xs" fill="${GREY}" letter-spacing="2.2">ONE MARK · ONE WORD</text>`);
P(`<text x="${rx}" y="308" text-anchor="end" class="mono xs" fill="${GREY}" letter-spacing="2.2">SOLID · WHAT REMAINS</text>`);
P(`<text x="${rx}" y="330" text-anchor="end" class="mono xs" fill="${GREY}" letter-spacing="2.2">FAINT · WHAT WAS TAKEN</text>`);
P(`<text x="${rx}" y="352" text-anchor="end" class="mono xs" fill="${TEAL}" letter-spacing="2.2">RULE · WHERE IT NOW ENDS</text>`);
P(`<text x="${rx}" y="428" text-anchor="end" class="mono lg" fill="${INK}">1552 / 1248</text>`);
P(`<text x="${rx}" y="450" text-anchor="end" class="mono xs" fill="${GREY}" letter-spacing="2.2">TOTAL BEFORE / AFTER</text>`);

/* ── Registers ──────────────────────────────────────────────────────────── */
SURFACES.forEach((s, i) => {
  const y = REG_TOP + i * REG_STEP;
  const changed = s.is !== s.was;

  // Label rail
  P(`<text x="${ML}" y="${y - 34}" class="mono xs" fill="${changed ? TEAL : GREY}" letter-spacing="3">${s.id} · ${esc(s.name)}</text>`);

  // Figures, right-aligned on the measure
  P(`<text x="${rx}" y="${y - 34}" text-anchor="end" class="mono xs" fill="${GREY}" letter-spacing="1.6">${
    changed ? `${s.was} → ${s.is}` : `${s.is}`
  }</text>`);

  // Hairline the register sits on
  P(`<line x1="${ML}" y1="${y + TICK_H + 13}" x2="${W - MR}" y2="${y + TICK_H + 13}" stroke="${INK}" stroke-opacity="0.13" stroke-width="0.75"/>`);

  // The accumulation: one tick per word, ruled at an identical interval.
  const keep = [], gone = [];
  for (let k = 0; k < s.was; k += 1) {
    const x = n(ML + k * PITCH + PITCH / 2);
    (k < s.is ? keep : gone).push(`M${x} ${y}V${y + TICK_H}`);
  }
  if (gone.length) P(`<path d="${gone.join('')}" stroke="${INK}" stroke-opacity="0.125" stroke-width="0.9"/>`);
  P(`<path d="${keep.join('')}" stroke="${INK}" stroke-opacity="0.92" stroke-width="0.9"/>`);

  // Where it now ends — the one event the accent is spent on.
  if (changed) {
    const bx = n(ML + s.is * PITCH);
    P(`<line x1="${bx}" y1="${y - 15}" x2="${bx}" y2="${y + TICK_H + 15}" stroke="${TEAL}" stroke-width="1.1"/>`);
  }

  // Controls: filled for what remains, hollow for what was withdrawn.
  // Controls sit under the register's own rule, on a pitch that is an exact
  // multiple of the word pitch — so the two systems of marks rhyme rather
  // than merely coexist. Nobody will see why; it is why it settles.
  const cy = y + TICK_H + 24;
  const CP = PITCH * 4, CS = n(PITCH * 1.75);
  for (let c = 0; c < s.cw; c += 1) {
    const cx = n(ML + c * CP);
    if (c < s.ci) P(`<rect x="${cx}" y="${cy}" width="${CS}" height="${CS}" fill="${INK}" fill-opacity="0.85"/>`);
    else P(`<rect x="${n(cx + 0.4)}" y="${n(cy + 0.4)}" width="${n(CS - 0.8)}" height="${n(CS - 0.8)}" fill="none" stroke="${INK}" stroke-opacity="0.28" stroke-width="0.7"/>`);
  }
});

/* ── Foot ───────────────────────────────────────────────────────────────── */
const fy = REG_TOP + 8 * REG_STEP + 130;
P(`<line x1="${ML}" y1="${fy}" x2="${W - MR}" y2="${fy}" stroke="${INK}" stroke-opacity="0.22" stroke-width="0.75"/>`);

// The one sentence permitted to speak at human volume, where the eye lands last.
P(`<text x="${ML}" y="${fy + 70}" class="serif" fill="${INK}">nothing here keeps going on its own</text>`);
P(`<line x1="${ML}" y1="${fy + 92}" x2="${ML + 322}" y2="${fy + 88}" stroke="${TEAL}" stroke-width="1.1"/>`);

P(`<text x="${rx}" y="${fy + 34}" text-anchor="end" class="mono xs" fill="${GREY}" letter-spacing="2.2">SURFACES OBSERVED · IX</text>`);
P(`<text x="${rx}" y="${fy + 56}" text-anchor="end" class="mono xs" fill="${GREY}" letter-spacing="2.2">SURFACES ALTERED · III</text>`);
P(`<text x="${rx}" y="${fy + 78}" text-anchor="end" class="mono xs" fill="${GREY}" letter-spacing="2.2">CONTROLS WITHDRAWN · XXVII</text>`);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>
  <filter id="grainf" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="7"/>
    <feColorMatrix type="saturate" values="0"/>
    <feComponentTransfer><feFuncA type="linear" slope="0.05"/></feComponentTransfer>
  </filter>
  <pattern id="grain" width="${W}" height="${H}" patternUnits="userSpaceOnUse">
    <rect width="${W}" height="${H}" filter="url(#grainf)"/>
  </pattern>
</defs>
${parts.join('\n')}
</svg>`;

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:'PlateDisp';src:url(data:font/ttf;base64,${b64('Jura-Light.ttf')}) format('truetype');}
@font-face{font-family:'PlateMono';src:url(data:font/ttf;base64,${b64('GeistMono-Regular.ttf')}) format('truetype');}
@font-face{font-family:'PlateSerif';src:url(data:font/ttf;base64,${b64('InstrumentSerif-Italic.ttf')}) format('truetype');}
@page{size:${W}px ${H}px;margin:0}
html,body{margin:0;padding:0;background:${PAPER}}
svg{display:block}
.disp{font-family:'PlateDisp';font-size:78px;font-weight:300}
.mono{font-family:'PlateMono'}
.xs{font-size:11.5px}
.lg{font-size:27px}
.serif{font-family:'PlateSerif';font-size:41px}
</style></head><body>${svg}</body></html>`;

writeFileSync('plate.html', html);
console.log(`plate.html written — measure ${MEASURE}px, pitch ${PITCH.toFixed(3)}px/word, ${SURFACES.reduce((a,s)=>a+s.was,0)} marks`);
