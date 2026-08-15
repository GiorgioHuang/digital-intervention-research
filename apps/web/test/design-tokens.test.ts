import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * The contrast gate DESIGN_SYSTEM.md §A.1.5 has asked for since v0.1:
 * "write every combination in the table above as a unit-test assertion, so
 * that the moment a token value is changed it fails. This is the only
 * automated gate this document recommends adding." It did not exist.
 * Re-palletising the whole system to
 * Calm Teal & Warm Sand is the moment it has to, because the ratios that
 * were true of the old blue are not true of the new teal, and nothing but
 * arithmetic can tell you which.
 *
 * It reads the real stylesheet rather than a copy of the values. A test
 * holding its own table of colours passes forever while the product drifts
 * away from it — it would be asserting that I typed the same hex twice.
 *
 * WHAT IT CANNOT SEE. It checks the pairs listed here. A component that
 * puts danger-fg on story-bg is a combination nobody wrote down, and this
 * file will not catch it. That is the reason for the rule it also enforces
 * (no literal colours outside the token blocks): every combination that
 * can occur is a pair of tokens, so the list can be complete by
 * construction — but only as long as somebody keeps adding to it.
 */

/* The suite runs in jsdom, where `import.meta.url` is an http: URL and
   cannot be turned back into a path. Vitest's root is the package. */
const CSS = readFileSync(resolve(process.cwd(), 'src/styles.css'), 'utf8');

/* ---- WCAG 2.x relative luminance (DESIGN_SYSTEM.md §A.1.5, verbatim) ---- */
const lin = (c: number): number => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
};
const luminance = (hex: string): number => {
  const h = hex.replace('#', '');
  return (
    0.2126 * lin(parseInt(h.slice(0, 2), 16)) +
    0.7152 * lin(parseInt(h.slice(2, 4), 16)) +
    0.0722 * lin(parseInt(h.slice(4, 6), 16))
  );
};
export const contrast = (a: string, b: string): number => {
  const l1 = luminance(a);
  const l2 = luminance(b);
  const hi = Math.max(l1, l2);
  const lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
};

/* ---- Parse the stylesheet into per-selector token maps ---- */
const withoutComments = CSS.replace(/\/\*[\s\S]*?\*\//g, '');

/**
 * Splits `sel { body }`, carrying the enclosing at-rule into the selector.
 *
 * The media condition has to be part of the key. Dark mode is now defined
 * by `:root` inside `@media (prefers-color-scheme: dark)`, which is the
 * same selector string as the light theme's `:root` — flattening the two
 * would have merged dark's values into the light theme and quietly made
 * every light assertion measure the wrong colours.
 */
function blocks(css: string, context = ''): Array<{ selector: string; body: string }> {
  const out: Array<{ selector: string; body: string }> = [];
  let i = 0;
  while (i < css.length) {
    const open = css.indexOf('{', i);
    if (open === -1) break;
    const selector = css.slice(i, open).trim();
    let depth = 1;
    let j = open + 1;
    while (j < css.length && depth > 0) {
      if (css[j] === '{') depth += 1;
      else if (css[j] === '}') depth -= 1;
      j += 1;
    }
    const body = css.slice(open + 1, j - 1);
    if (selector.startsWith('@media') || selector.startsWith('@supports')) {
      out.push(...blocks(body, `${context}${selector.replace(/\s+/g, ' ')} `));
    } else {
      out.push({ selector: `${context}${selector}`, body });
    }
    i = j;
  }
  return out;
}

/** The at-rule wrapper the dark theme now lives behind, and its only one. */
const DARK_CONTEXT = '@media (prefers-color-scheme: dark) ';
/** The one selector dark is defined under. `:not([data-theme='light'])` is
    what makes "always light" possible without a second copy of the palette. */
const DARK_SELECTOR = `${DARK_CONTEXT}:root:not([data-theme='light'])`;

const ALL_BLOCKS = blocks(withoutComments);

function declarations(predicate: (selector: string) => boolean): Record<string, string> {
  const map: Record<string, string> = {};
  for (const { selector, body } of ALL_BLOCKS) {
    if (!predicate(selector)) continue;
    for (const m of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
      map[m[1]!] = m[2]!.trim();
    }
  }
  return map;
}

/** Plain `:root` — the light theme every user gets unless they choose otherwise. */
const light = declarations((s) => s === ':root');
/* Dark has exactly one definition — the prefers-color-scheme block. The
   duplicate `[data-theme='dark']` copy was deleted: nothing ever set that
   attribute, so it was forty hex values that had to agree with the live
   block, with no way to notice when they stopped. */
const darkOnly = declarations((s) => s === DARK_SELECTOR);
const dark = { ...light, ...darkOnly };
const highContrast = {
  ...light,
  ...declarations((s) => s === ":root[data-contrast='high']"),
};

const hex = (tokens: Record<string, string>, name: string): string => {
  const value = tokens[name];
  expect(value, `token ${name} is missing`).toBeDefined();
  expect(value, `token ${name} is not a plain hex colour: ${value}`).toMatch(/^#[0-9a-f]{6}$/i);
  return value!;
};

/* ---- The pairs. Threshold per WCAG 2.2: 4.5 for text, 3 for graphics. ---- */

/** Every surface a foreground can land on. Text must clear 4.5 on all of them. */
const SURFACES = ['--color-surface-page', '--color-surface-raised', '--color-surface-sunken'];

/** Semantic families: each is [tint background, text colour, graphic colour]. */
const FAMILIES = [
  ['--color-info-bg', '--color-info-fg', '--color-info-border'],
  ['--color-success-bg', '--color-success-fg', '--color-success-border'],
  ['--color-warning-bg', '--color-warning-fg', '--color-warning-border'],
  ['--color-danger-bg', '--color-danger-fg', '--color-danger-border'],
  ['--color-safety-bg', '--color-safety-fg', '--color-safety-border'],
  ['--color-moderation-bg', '--color-moderation-fg', '--color-moderation-border'],
  ['--color-ai-bg', '--color-ai-fg', '--color-ai-border'],
  ['--color-story-bg', '--color-story-fg', '--color-story-border'],
  ['--color-community-bg', '--color-community-fg', '--color-community-border'],
  ['--color-matching-bg', '--color-matching-fg', '--color-matching-border'],
] as const;

for (const [themeName, tokens] of [
  ['light', light],
  ['dark', dark],
  ['high contrast', highContrast],
] as const) {
  describe(`${themeName} theme carries its contrast`, () => {
    it('body and secondary text clear 4.5:1 on every surface', () => {
      for (const surface of SURFACES) {
        for (const text of ['--color-text-primary', '--color-text-secondary']) {
          expect(
            contrast(hex(tokens, text), hex(tokens, surface)),
            `${text} on ${surface}`,
          ).toBeGreaterThanOrEqual(4.5);
        }
      }
    });

    it('links clear 4.5:1 on every surface', () => {
      for (const surface of SURFACES) {
        expect(
          contrast(hex(tokens, '--color-text-link'), hex(tokens, surface)),
          `link on ${surface}`,
        ).toBeGreaterThanOrEqual(4.5);
      }
    });

    it('body text clears 4.5:1 on every semantic tint', () => {
      for (const [bg] of FAMILIES) {
        for (const text of ['--color-text-primary', '--color-text-secondary']) {
          expect(
            contrast(hex(tokens, text), hex(tokens, bg)),
            `${text} on ${bg}`,
          ).toBeGreaterThanOrEqual(4.5);
        }
      }
    });

    it('each family reads on its own tint, and its graphic tier clears 3:1 on every surface', () => {
      for (const [bg, fg, border] of FAMILIES) {
        expect(contrast(hex(tokens, fg), hex(tokens, bg)), `${fg} on ${bg}`).toBeGreaterThanOrEqual(
          4.5,
        );
        for (const surface of SURFACES) {
          expect(
            contrast(hex(tokens, border), hex(tokens, surface)),
            `${border} on ${surface}`,
          ).toBeGreaterThanOrEqual(3);
        }
      }
    });

    it('the primary action reads in all three of its states', () => {
      for (const bg of [
        '--color-action-primary-bg',
        '--color-action-primary-bg-hover',
        '--color-action-primary-bg-active',
      ]) {
        expect(
          contrast(hex(tokens, '--color-action-primary-fg'), hex(tokens, bg)),
          `primary label on ${bg}`,
        ).toBeGreaterThanOrEqual(4.5);
      }
      /* The button's own edge against the page behind it. */
      for (const surface of SURFACES) {
        expect(
          contrast(hex(tokens, '--color-action-primary-bg'), hex(tokens, surface)),
          `primary button edge on ${surface}`,
        ).toBeGreaterThanOrEqual(3);
      }
    });

    it('the secondary action reads on every surface', () => {
      for (const surface of SURFACES) {
        expect(
          contrast(hex(tokens, '--color-action-secondary-fg'), hex(tokens, surface)),
          `secondary label on ${surface}`,
        ).toBeGreaterThanOrEqual(4.5);
        expect(
          contrast(hex(tokens, '--color-action-secondary-border'), hex(tokens, surface)),
          `secondary edge on ${surface}`,
        ).toBeGreaterThanOrEqual(3);
      }
      /* Selected navigation and hover use the tint as a background. */
      expect(
        contrast(
          hex(tokens, '--color-action-secondary-fg'),
          hex(tokens, '--color-action-secondary-bg-hover'),
        ),
        'secondary label on its own hover tint',
      ).toBeGreaterThanOrEqual(4.5);
      expect(
        contrast(hex(tokens, '--color-text-primary'), hex(tokens, '--color-action-secondary-bg-hover')),
        'body text on the selected-nav tint',
      ).toBeGreaterThanOrEqual(4.5);
    });

    it('destructive solid, inverse bar and disabled controls stay readable', () => {
      expect(
        contrast(hex(tokens, '--color-danger-solid-fg'), hex(tokens, '--color-danger-solid-bg')),
      ).toBeGreaterThanOrEqual(4.5);
      expect(
        contrast(hex(tokens, '--color-text-inverse'), hex(tokens, '--color-surface-inverse')),
      ).toBeGreaterThanOrEqual(4.5);
      /* WCAG exempts disabled controls. This system does not: §B.1.4 requires
         a disabled control to explain itself, and an explanation nobody can
         read is not one. */
      expect(
        contrast(hex(tokens, '--color-disabled-fg'), hex(tokens, '--color-disabled-bg')),
        'disabled label on disabled background',
      ).toBeGreaterThanOrEqual(4.5);
    });

    it('the focus ring is visible against both of its neighbours', () => {
      /* Reading outward from the focused control: the element's own fill,
         then the halo (the box-shadow filling the outline-offset gap), then
         the ring (the outline), then the page. So the adjacencies that
         actually exist are halo/fill, ring/halo and ring/page — and §A.5
         requires 3:1 across each of them.
         The first version of this test asserted halo-against-page, which is
         not an adjacency at all: those two are separated by the ring. It
         failed on every theme, and the tokens were right. A contrast test
         that models the wrong geometry produces confident, precise, wrong
         numbers — worth more scepticism than a test that simply passes. */
      const ring = hex(tokens, '--color-focus-ring');
      const halo = hex(tokens, '--color-focus-halo');
      expect(contrast(ring, halo), 'focus ring against its halo').toBeGreaterThanOrEqual(3);
      for (const surface of SURFACES) {
        expect(
          contrast(ring, hex(tokens, surface)),
          `focus ring against ${surface}`,
        ).toBeGreaterThanOrEqual(3);
      }
      /* The halo's job is to separate the ring from whatever the control is
         filled with, so it has to clear the filled controls too. */
      for (const fill of ['--color-action-primary-bg', '--color-danger-solid-bg']) {
        expect(
          contrast(halo, hex(tokens, fill)),
          `focus halo against ${fill}`,
        ).toBeGreaterThanOrEqual(3);
      }
    });

    it('no two families share a colour, and none of them is the action colour', () => {
      /* Deriving every colour to the same minimum contrast quietly destroys
         the differences between them. Hue survives the derivation; lightness
         does not — everything lands on the same rung. Doing it the first time
         produced three blues 1.25:1 apart (safety, info, matching), a
         moderation colour byte-identical to the primary button, and a
         moderation text colour 1.07:1 from the link colour. Every one of
         those passed the contrast tests above, because contrast against a
         background says nothing about distinguishability from a sibling.
         Colour is a secondary cue here — icon and words carry the state, so
         near-misses are survivable — but two families with the *same* value
         are not two families. */
      const seen = new Map<string, string>();
      for (const [, fg, border] of FAMILIES) {
        for (const token of [fg, border]) {
          const value = hex(tokens, token).toLowerCase();
          const owner = seen.get(value);
          /* A family's own fg and border may match each other; nothing else may. */
          const sameFamily = owner?.replace(/-(fg|border)$/, '') === token.replace(/-(fg|border)$/, '');
          if (owner !== undefined && !sameFamily) {
            expect.fail(`${token} and ${owner} are both ${value}`);
          }
          seen.set(value, token);
        }
      }
      for (const [, fg, border] of FAMILIES) {
        for (const token of [fg, border]) {
          expect(
            hex(tokens, token).toLowerCase(),
            `${token} is the primary action colour — a state must not look like a button`,
          ).not.toBe(hex(tokens, '--color-action-primary-bg').toLowerCase());
        }
      }
    });

    it('the story surface is a background, not a foreground', () => {
      /* Sand is the warmest colour in the system and the most tempting to
         set text in. Life Story pages set body text directly on it. */
      for (const text of ['--color-text-primary', '--color-text-secondary']) {
        expect(
          contrast(hex(tokens, text), hex(tokens, '--color-story-surface')),
          `${text} on the Life Story surface`,
        ).toBeGreaterThanOrEqual(4.5);
      }
    });
  });
}

describe('the token architecture holds', () => {
  it('keeps every literal colour inside a token block', () => {
    /* DESIGN_SYSTEM.md §0.1: component rules may only reference semantic
       tokens. Enforced here rather than at review, because "grep before
       merging" is a habit and this is a build failure. */
    const offenders: string[] = [];
    for (const { selector, body } of ALL_BLOCKS) {
      /* `:root` possibly behind an at-rule wrapper — the dark theme's
         selector is now `@media (…) :root`, so a startsWith check would
         have called it a component rule and reported all forty of its
         values as violations. */
      const isTokenBlock = /(^|\s):root\b/.test(selector);
      if (isTokenBlock) continue;
      for (const line of body.split('\n')) {
        if (/#[0-9a-f]{3,8}\b/i.test(line) || /\brgb\(/i.test(line)) {
          offenders.push(`${selector}: ${line.trim()}`);
        }
      }
    }
    expect(offenders, 'literal colours outside :root').toEqual([]);
  });

  it('defines every colour token it references', () => {
    const referenced = new Set(
      [...withoutComments.matchAll(/var\((--color-[\w-]+)/g)].map((m) => m[1]!),
    );
    const defined = new Set(Object.keys(light).filter((k) => k.startsWith('--color-')));
    const missing = [...referenced].filter((token) => !defined.has(token));
    expect(missing, 'referenced but never defined').toEqual([]);
  });

  it('keeps hand-rolled boxes out of the components', () => {
    /* The CSS-only checks above were blind to this and said nothing while
       eleven of the most-used lists in the product — community spaces,
       matching suggestions, message threads, consent scopes — drew
       themselves with `style={{ border: '1px solid currentColor', padding:
       '1rem' }}`.
       Three things are wrong with that, and none of them is cosmetic. The
       border never becomes 3px when somebody turns on high contrast,
       because it is not --border-default. The padding never responds to
       the density preference, because it is not --space-*. And
       `currentColor` means the box borrows whatever colour its text
       happens to be, so the same list drawn inside a danger block silently
       acquires a red border it was never given.
       A stylesheet cannot see any of this, which is exactly why the rule
       needs a test that reads the components. */
    const offenders: string[] = [];
    const sources = readdirSync(resolve(process.cwd(), 'src'), {
      recursive: true,
      encoding: 'utf8',
    }).filter((f) => f.endsWith('.tsx') || f.endsWith('.ts'));
    expect(sources.length, 'found no component sources to scan').toBeGreaterThan(10);
    for (const file of sources) {
      const text = readFileSync(resolve(process.cwd(), 'src', file), 'utf8');
      for (const [index, line] of text.split('\n').entries()) {
        if (/style=\{\{/.test(line)) offenders.push(`${file}:${index + 1} inline style: ${line.trim()}`);
      }
    }
    expect(offenders, 'inline styles bypass the token layer').toEqual([]);
  });

  it('gives every mode the stylesheet defines a way to be switched on', () => {
    /* The fifth instance of one defect in this codebase: a capability that
       is fully built and cannot be invoked. `data-stimulation='low'` had a
       complete rule block from the first version of this stylesheet and
       nothing ever set the attribute, so "use less colour" — which the
       owner ranks above a full dark mode in value — was unreachable. The
       same was true of `data-simplify`, which additionally had nothing to
       act on, since no element in the app carries `.optional`.
       Reasoning by hand found these; a list of attributes cross-checked
       against the source finds the next one. An attribute set only by the
       browser (there are none today) would need an exemption here, stated
       rather than assumed. */
    /* Every `data-*` the stylesheet keys off, on any element — not just
       `:root`. Three narrowings of this pattern have each hidden a real
       instance:
         - matching only `:root[data-x=]` missed `:root:not([data-x=])`,
           which is how "always light" is implemented;
         - matching only `:root` missed `main[data-workspace='staff']`,
           four rules deciding the research workspace's column width,
           density and table height — and no element in the app has ever
           carried that attribute, so the staff screens were laid out in
           the participant's 36rem reading column on a 1280px display.
       The lesson each time is the same: a scan that models the styling
       too narrowly reports "all wired" about the exact case it cannot
       see. So this matches any element, any attribute, either form. */
    const modeAttributes = new Set(
      [...withoutComments.matchAll(/[\w:-]+(?::not\()?\[(data-[\w-]+)=/g)].map((m) => m[1]!),
    );
    expect(modeAttributes.size, 'no mode attributes found — has the selector syntax changed?')
      .toBeGreaterThan(4);
    const sources = readdirSync(resolve(process.cwd(), 'src'), {
      recursive: true,
      encoding: 'utf8',
    }).filter((f) => f.endsWith('.ts') || f.endsWith('.tsx'));
    /* Comments stripped first. The loose match above, applied to raw
       source, was satisfied by the sentence explaining the attribute:
       deleting the real `data-workspace="staff"` from the JSX left the
       comment describing it, and the test stayed green. A guard that a
       comment can satisfy is a guard that documents itself into
       uselessness — verified by re-running the mutation after this line
       was added. */
    const appCode = sources
      .map((f) => readFileSync(resolve(process.cwd(), 'src', f), 'utf8'))
      .join('\n')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '');
    /* Any mention counts as a writer, quoted or not. Looking for `'data-x'`
       specifically — the shape `preferences.ts` uses — reported
       `data-workspace` as unreachable seconds after it had been wired,
       because JSX writes it bare: `data-workspace="staff"`. That is the
       third time a too-clever pattern in this one test has produced a
       confident wrong answer. A loose match can only fail by staying
       quiet about something already handled; a tight one fails by
       shouting about something that is fine, and by missing what it was
       written to find. */
    const unreachable = [...modeAttributes].filter((attr) => !appCode.includes(attr));
    expect(unreachable, 'styled modes that nothing in the app can turn on').toEqual([]);
  });

  it('keeps the two dark definitions identical, token for token', () => {
    /* Dark is written twice, and has to be: once under
       prefers-color-scheme so it needs no JavaScript, once under
       `[data-theme='dark']` so somebody on a light device can ask for it.
       CSS has no way to put a media condition and an attribute selector
       into one selector list, so the values are duplicated.

       That duplication is the reason I first argued against offering
       "always dark" at all; the owner ruled for it, and being able to
       choose is worth more than my having one fewer copy to keep. But the
       hazard is real and unguarded duplication is how it bites: change one
       block, forget the other, and the two halves of dark mode drift apart
       with nothing to say so — least visibly for OS-dark users, who never
       touch the attribute path at all.

       So the copies are held equal here rather than by care. */
    const viaMediaQuery = declarations((s) => s === DARK_SELECTOR);
    const viaAttribute = declarations((s) => s === ":root[data-theme='dark']");
    expect(Object.keys(viaMediaQuery).length, 'the media-query dark block vanished').toBeGreaterThan(30);
    expect(Object.keys(viaAttribute).sort(), 'the two dark blocks define different tokens').toEqual(
      Object.keys(viaMediaQuery).sort(),
    );
    for (const [token, value] of Object.entries(viaAttribute)) {
      expect(viaMediaQuery[token], `${token} differs between the two dark blocks`).toBe(value);
    }

    /* Same for dark + high contrast, which is duplicated for the same
       reason and is the copy most likely to be forgotten, being the
       combination fewest people will ever look at. */
    const hcMedia = declarations(
      (s) => s === `${DARK_CONTEXT}:root[data-contrast='high']:not([data-theme='light'])`,
    );
    const hcAttribute = declarations((s) => s === ":root[data-theme='dark'][data-contrast='high']");
    expect(Object.keys(hcMedia).length).toBeGreaterThan(3);
    expect(Object.keys(hcAttribute).sort()).toEqual(Object.keys(hcMedia).sort());
    for (const [token, value] of Object.entries(hcAttribute)) {
      expect(hcMedia[token], `${token} differs between the two dark high-contrast blocks`).toBe(value);
    }
  });

  it('makes high contrast actually higher, including the state panels', () => {
    /* The mode raised body text from 12.38:1 to 21:1 and left all ten
       semantic families untouched at their 4.50 minimum — the faintest
       things on the page, unchanged, for the one person who said they
       could not read the page. Every family must now improve, not merely
       still pass: a mode named for contrast that does not raise it is a
       label. */
    for (const [bg, fg] of FAMILIES) {
      const standard = contrast(hex(light, fg), hex(light, bg));
      const high = contrast(hex(highContrast, fg), hex(highContrast, bg));
      expect(high, `${fg} on ${bg} is no better in high contrast`).toBeGreaterThan(standard);
      expect(high, `${fg} on ${bg} should reach AAA in high contrast`).toBeGreaterThanOrEqual(7);
    }
    for (const pair of [
      ['--color-text-primary', '--color-surface-page'],
      ['--color-text-secondary', '--color-surface-page'],
      ['--color-text-link', '--color-surface-page'],
      ['--color-action-primary-fg', '--color-action-primary-bg'],
    ] as const) {
      expect(
        contrast(hex(highContrast, pair[0]), hex(highContrast, pair[1])),
        `${pair[0]} on ${pair[1]} is no better in high contrast`,
      ).toBeGreaterThan(contrast(hex(light, pair[0]), hex(light, pair[1])));
    }
  });

  it('puts every table inside the container that lets it scroll', () => {
    /* §B.3.2 makes `.scroll-x` the one legal outlet for wide content, and a
       table is the widest thing this platform draws. Both of the tables
       that existed were outside it, and the symptom was not the one you
       would expect: nothing overflowed, because `overflow-wrap: anywhere`
       on the body — the guard that stops long identifiers breaking the
       layout — applies inside cells too. So the audit table fitted its 430px
       column exactly, with "Outcome" broken as "Out/co/me" and
       "participant.view" as "parti/cipa/nt.vi/ew".
       A table squeezed until it cannot be read and a table cut off at the
       edge are the same event for the person reading it, and only the
       second one looks broken. Hence a scan rather than an eye. */
    const sources = readdirSync(resolve(process.cwd(), 'src'), {
      recursive: true,
      encoding: 'utf8',
    }).filter((f) => f.endsWith('.tsx'));
    const offenders: string[] = [];
    for (const file of sources) {
      const text = readFileSync(resolve(process.cwd(), 'src', file), 'utf8');
      for (const match of text.matchAll(/<table[\s>]/g)) {
        const before = text.slice(0, match.index);
        /* The wrapper has to be the nearest opening element before it. */
        const lastOpen = before.lastIndexOf('<div className="scroll-x">');
        const lastClose = before.lastIndexOf('</div>');
        if (lastOpen === -1 || lastClose > lastOpen) {
          offenders.push(`${file}: <table> outside .scroll-x`);
        }
      }
    }
    expect(offenders, 'tables that cannot scroll get squeezed until unreadable').toEqual([]);
  });

  it('keeps the desktop workspace from stretching prose across the screen', () => {
    /* "Use the screen width" cannot mean "run the sentences the width of a
       27-inch monitor": past roughly 75 characters a line is measurably
       harder to read, because the eye has to find the next line's start.
       The width is meant to buy columns, a navigation rail and full-width
       tables — not longer lines. So the desktop cap and the reading
       measure have to stay different numbers, and the grid's column floor
       must stay under the reading measure or the columns collapse back to
       one. */
    const desktop = light['--measure-desktop'];
    const reading = light['--measure-default'];
    expect(desktop, '--measure-desktop is missing').toBeDefined();
    expect(desktop).not.toBe(reading);
    const rem = (v: string) => Number.parseFloat(v);
    expect(rem(desktop!), 'the desktop frame should be wider than a reading column').toBeGreaterThan(
      rem(reading!),
    );

    const gridRule = ALL_BLOCKS.find((b) => b.selector === "main[data-workspace='staff'] > section");
    expect(gridRule, 'the staff panel grid has gone').toBeDefined();
    expect(gridRule!.body).toContain('grid-template-columns');
    const floor = gridRule!.body.match(/minmax\((\d+(?:\.\d+)?)rem/);
    expect(floor, 'the grid no longer states a column floor').not.toBeNull();
    expect(
      Number.parseFloat(floor![1]!),
      'a column floor at or above the reading measure yields one column forever',
    ).toBeLessThan(rem(reading!));
  });

  it('gives queues and tables the full width of the desktop panel', () => {
    /* A panel's sections flow into columns, so a section is one column
       wide by default — and the first version of the desktop layout left
       the approval queue in that column: four protocol versions stacked in
       502px on a 1920px screen with a thousand pixels empty beside them.
       The outer grid had columns and the inner content never received the
       width. Both the table sections and the queue sections have to be
       told to span, and they are the two kinds of content the width was
       widened for in the first place. */
    const spanning = ALL_BLOCKS.filter(
      (b) =>
        b.selector.startsWith("main[data-workspace='staff'] > section > section:has(") &&
        /grid-column:\s*1\s*\/\s*-1/.test(b.body),
    ).map((b) => b.selector);
    expect(spanning.some((s) => s.includes('.scroll-x')), 'table sections no longer span').toBe(true);
    expect(spanning.some((s) => s.includes('article')), 'queue sections no longer span').toBe(true);
  });

  it('lets a fact list shrink instead of bursting its card', () => {
    /* The approval screens describe each artefact with a `dl`, and those
       lists mix bare dt/dd pairs with pairs wrapped in a `div`. A wrapper
       lands in the grid as one item, and its max-content width — a label
       plus a full identifier — took the label column to 377px and left the
       value column at 0. `display: contents` on the wrapper and explicit
       column numbers on dt/dd are what make the two shapes lay out alike;
       lose either and the list bursts its card again. */
    const dlBlocks = ALL_BLOCKS.filter((b) => b.selector.startsWith("main[data-workspace='staff'] dl"));
    expect(dlBlocks.length, 'the staff fact-list layout has gone').toBeGreaterThan(0);
    const wrapper = ALL_BLOCKS.find((b) => b.selector === "main[data-workspace='staff'] dl > div");
    expect(wrapper?.body, 'wrapped dt/dd pairs must not become one grid item').toContain(
      'display: contents',
    );
    for (const part of ['dt', 'dd']) {
      const rule = ALL_BLOCKS.find((b) => b.selector === `main[data-workspace='staff'] ${part}`);
      expect(rule?.body, `${part} lost its explicit column`).toMatch(/grid-column:\s*\d/);
    }
  });

  it('keeps sand out of the research workspace as anything but an accent', () => {
    /* The owner's split: participant and Life Story screens are warm, the
       research workspace is teal and blue-grey with sand reserved for a
       highlight. A staff screen that adopted the Life Story treatment
       would not be wrong so much as misleading — warmth is how this
       platform marks somebody's own memories, and a cohort table is not
       that. */
    const staffFiles = readdirSync(resolve(process.cwd(), 'src'), {
      recursive: true,
      encoding: 'utf8',
    }).filter((f) => /Staff|staff|approver/.test(f) && f.endsWith('.tsx'));
    expect(staffFiles.length, 'no staff sources found to scan').toBeGreaterThan(3);
    const offenders: string[] = [];
    for (const file of staffFiles) {
      const text = readFileSync(resolve(process.cwd(), 'src', file), 'utf8');
      if (/zone-story|card--story/.test(text)) offenders.push(file);
    }
    expect(offenders, 'staff screens using the Life Story warmth').toEqual([]);
  });

  it('gives the dark theme a value for every colour the light theme defines', () => {
    /* A token defined only in light silently inherits its light value in
       dark — which is how a white-on-white state block happens. */
    const lightColours = Object.keys(light).filter((k) => k.startsWith('--color-'));
    const missing = lightColours.filter((token) => !(token in darkOnly));
    expect(missing, 'defined in light but never overridden in dark').toEqual([]);
  });
});
