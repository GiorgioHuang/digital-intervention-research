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
    // The Han ranges are written as escapes rather than as literal
    // characters, so a repository-wide search for Chinese does not match
    // the one file whose job is to find it.
    expect(title).not.toMatch(/[\u3400-\u4dbf\u4e00-\u9fff]/);
  });
});

/**
 * The tab icon.
 *
 * Two halves that can drift apart without either looking broken: the
 * declaration in `index.html`, and the file it points at. A rename, or a
 * change to what the build copies, leaves the declaration pointing at
 * nothing — and the page still renders perfectly. The tab just quietly goes
 * back to the browser's blank sheet, which is the state this replaced and
 * which no screenshot of the app would ever show.
 */
describe('the tab icon', () => {
  const html = readFileSync(join(process.cwd(), 'index.html'), 'utf8');

  it('declares an icon and ships the file it names', () => {
    const href = /<link[^>]*rel="icon"[^>]*href="([^"]+)"/.exec(html)?.[1];
    expect(href, 'no icon is declared; the tab falls back to a blank sheet').toBeTruthy();
    // Served from `public/`, so the URL path is the filename under it.
    expect(
      readFileSync(join(process.cwd(), 'public', href!.replace(/^\//, '')), 'utf8'),
      'the declared icon file is not there',
    ).toContain('<svg');
  });

  /**
   * §D.6 governs what the browser tab may disclose, and the answer is: not
   * who is using the platform. A brand mark says which site is open — which
   * the title already says in words — and distinguishes nobody. What must
   * not appear is a second icon that varies by role or by person.
   */
  it('declares one icon, the same for everybody', () => {
    expect((html.match(/rel="icon"/g) ?? []).length).toBe(1);
    expect(html, 'an icon is being chosen per role or per person').not.toMatch(
      /rel="icon"[^>]*(participant|staff|supporter|researcher)/i,
    );
  });
});
