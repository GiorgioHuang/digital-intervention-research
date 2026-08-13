import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * The contrast gate DESIGN_SYSTEM.md §A.1.5 has asked for since v0.1:
 * "把上表所有组合写成单元测试断言，令牌值一旦被改动即失败。这是本文件唯一
 * 建议新增的自动化门。" It did not exist. Re-palletising the whole system to
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

/** Splits `sel { body }` at the top level, skipping over @media wrappers. */
function blocks(css: string): Array<{ selector: string; body: string }> {
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
      out.push(...blocks(body));
    } else {
      out.push({ selector, body });
    }
    i = j;
  }
  return out;
}

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
const dark = { ...light, ...declarations((s) => s.includes("[data-theme='dark']")) };
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
      const isTokenBlock = selector.startsWith(':root');
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

  it('gives the dark theme a value for every colour the light theme defines', () => {
    /* A token defined only in light silently inherits its light value in
       dark — which is how a white-on-white state block happens. */
    const darkOnly = declarations((s) => s.includes("[data-theme='dark']"));
    const lightColours = Object.keys(light).filter((k) => k.startsWith('--color-'));
    const missing = lightColours.filter((token) => !(token in darkOnly));
    expect(missing, 'defined in light but never overridden in dark').toEqual([]);
  });
});
