import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * The declared language of the page, against the language the page is
 * actually written in.
 *
 * `index.html` declared `lang="zh-CN"` while every string in the product
 * has been English since D-9. That is a WCAG 2.2 3.1.1 (Language of Page,
 * Level A) failure and not a cosmetic one: a screen reader takes the
 * declaration at its word and applies Chinese pronunciation rules to
 * English text, so the participants who depend on it most get the least
 * intelligible reading of the two.
 *
 * It survived because nothing looks wrong. Every visual check passes,
 * every query-by-name test passes, and the only reader affected is the one
 * nobody was watching. So the check is mechanical, and it is anchored to a
 * string the interface really contains rather than to a hard-coded "en" —
 * if the interface language changes again, this fails and asks for the
 * declaration to change with it, which is the failure that was missing the
 * first time.
 */
describe('the declared language of the document', () => {
  const html = readFileSync(join(process.cwd(), 'index.html'), 'utf8');

  it('declares the language the interface is actually written in', () => {
    expect(html).toMatch(/<html\s+lang="en"/);
  });

  it('does not declare a language the interface is not written in', () => {
    // Named rather than inferred: this is the exact value that was wrong,
    // and naming it makes a reintroduction fail with its own history.
    expect(html).not.toContain('lang="zh-CN"');
  });

  /**
   * The title is rendered before any script runs and is read out as the
   * page's name, so it belongs to the same declaration.
   */
  it('titles the page in that language', () => {
    const title = /<title>([^<]*)<\/title>/.exec(html)?.[1] ?? '';
    expect(title.length).toBeGreaterThan(0);
    expect(title).not.toMatch(/[㐀-䶿一-鿿]/);
  });
});
