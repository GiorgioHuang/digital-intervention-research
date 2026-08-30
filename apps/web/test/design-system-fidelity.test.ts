import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * The participant workspace against the design system it is built from.
 *
 * `design/handoff-elder/design-system.css` is the owner's file, vendored
 * verbatim — "this file is the source of truth for the system's look". The
 * `--cl-*` ramp in `styles.css` was hand-copied out of a handoff table, and
 * a hand-copy is a fact that agrees with its source until somebody retunes
 * one end. This is the check that would notice.
 *
 * It compares values, not names. The two files name the same colour
 * differently — `--color-accent-700` there, `--cl-accent-700` here —
 * because this workspace's tokens sit inside a platform token layer that
 * the staff and supporter workspaces also use, and importing the design
 * system's names at the root would rename colours out from under them.
 */
const ds = readFileSync(
  resolve(process.cwd(), '..', '..', 'design', 'handoff-elder', 'design-system.css'),
  'utf8',
);
const mine = readFileSync(resolve(process.cwd(), 'src', 'styles.css'), 'utf8');

const read = (css: string, name: string): string | undefined => {
  const m = new RegExp(`${name}:\\s*([^;]+);`).exec(css);
  return m?.[1]?.trim();
};

/** Every colour this workspace takes from the system, by both names. */
const COLOURS: [mine: string, theirs: string][] = [
  ['--cl-bg', '--color-bg'],
  ['--cl-text', '--color-text'],
  ['--cl-accent', '--color-accent'],
  ['--cl-accent-100', '--color-accent-100'],
  ['--cl-accent-200', '--color-accent-200'],
  ['--cl-accent-300', '--color-accent-300'],
  ['--cl-accent-700', '--color-accent-700'],
  ['--cl-accent-800', '--color-accent-800'],
  ['--cl-neutral-100', '--color-neutral-100'],
  ['--cl-neutral-200', '--color-neutral-200'],
  ['--cl-neutral-300', '--color-neutral-300'],
  ['--cl-neutral-400', '--color-neutral-400'],
  // Translucent, exactly as the system states it. A flat hex here is the
  // mix resolved against one background, which is wrong on every other
  // one — the toolbar and the quiet cards both sit on neutral-100.
  ['--cl-divider', '--color-divider'],
];

describe('the participant workspace against the design system it came from', () => {
  it('takes every colour from the vendored file, value for value', () => {
    for (const [ours, theirs] of COLOURS) {
      const expected = read(ds, theirs);
      expect(expected, `${theirs} is missing from the vendored design system`).toBeDefined();
      expect(read(mine, ours), `${ours} has drifted from ${theirs}`).toBe(expected);
    }
  });

  /**
   * The secondary-text ramp is quoted in the handoff's own words — "Literal
   * greys used for secondary text, in ramp order" — and two of the four are
   * also neutral steps in the system. `#605d5d` is called out there as the
   * floor for 14-15px text at about 4.9:1; going lighter at those sizes is
   * the failure this asserts against.
   */
  it('keeps the secondary-text ramp the handoff names', () => {
    expect(read(mine, '--cl-text-2')).toBe('#3a3835');
    expect(read(mine, '--cl-text-3')).toBe('#4a4844');
    expect(read(mine, '--cl-text-4')).toBe('#605d5d');
    expect(read(mine, '--cl-text-4'), 'the floor for small text has moved').toBe(read(ds, '--color-neutral-700'));
  });

  /**
   * The system's fonts, without the system's `@import`.
   *
   * The vendored file opens with an `@import` from fonts.googleapis.com.
   * This app does not follow it and must not: the faces are self-hosted, so
   * a participant's browser never tells Google that somebody opened a
   * health-research app, and the page still renders where that host is
   * unreachable. The families are the same either way.
   */
  /**
   * Every corner in the artboards is 4px, and the handoff's token table
   * says so in as many words. This workspace was inheriting the platform's
   * 9-10px control radii, which is a visibly softer object than the one
   * drawn.
   */
  it('rounds every corner the way the system does', () => {
    // Searched forward FROM the block, not from the top of the file.
    // `--radius-3` is defined in `:root` too, hundreds of lines earlier, so
    // an unanchored `indexOf` found that one and the slice came out empty —
    // which failed with "expected undefined", a defect in the guard
    // reported as a defect in the code.
    const from = mine.indexOf("[data-workspace='participant'] {");
    expect(from, 'the participant token block has been renamed').toBeGreaterThan(-1);
    const block = mine.slice(from, mine.indexOf('}', mine.indexOf('--radius-3', from)));
    const md = read(ds, '--radius-md');
    expect(md, 'the vendored system no longer defines --radius-md').toBe('4px');
    for (const step of ['--radius-1', '--radius-2', '--radius-3']) {
      expect(read(block, step), `${step} is not the system's corner`).toBe(md);
    }
  });

  it('uses the system’s families and fetches them from nobody', () => {
    expect(ds, 'the vendored file no longer imports webfonts; this test is stale').toContain(
      'fonts.googleapis.com',
    );
    expect(mine, 'the app is fetching fonts from Google').not.toContain('fonts.googleapis.com');
    expect(read(mine, '--cl-family-display')).toMatch(/Cormorant Garamond/);
    expect(read(mine, '--cl-family-body')).toMatch(/Lora/);
  });
});
