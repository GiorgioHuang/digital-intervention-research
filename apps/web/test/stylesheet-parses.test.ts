import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * The stylesheet parses, and every rule in it survives.
 *
 * A stray `}` — left behind when a media query was deleted and its closing
 * brace was not — swallowed the whole `.elder-toolbar` rule. CSS error
 * recovery does not stop at a bad brace; it discards the next construct
 * and carries on, so the file still "worked", the build still succeeded,
 * every test still passed, and the toolbar quietly lost its layout on
 * every screen. It was found by measuring a browser, three steps after it
 * shipped.
 *
 * Nothing in the toolchain would have caught it. Vite does not validate
 * CSS, eslint does not read it, and a test that asserts on the file's text
 * — which several here do — reads the rule perfectly well as text while a
 * browser is throwing it away.
 *
 * So this counts braces, which is the one thing that class of error always
 * violates. It is deliberately crude: a real parser would need a browser,
 * and the failure this exists for is always an unbalanced block.
 */
const css = readFileSync(resolve(process.cwd(), 'src', 'styles.css'), 'utf8');

/** Strip comments without moving anything: a comment becomes blank space. */
const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));

describe('the stylesheet', () => {
  it('opens and closes every block', () => {
    let depth = 0;
    let line = 1;
    const stray: number[] = [];
    for (const ch of withoutComments) {
      if (ch === '\n') line += 1;
      else if (ch === '{') depth += 1;
      else if (ch === '}') {
        depth -= 1;
        if (depth < 0) {
          stray.push(line);
          depth = 0;
        }
      }
    }
    expect(stray, `a closing brace with nothing open at line(s) ${stray.join(', ')}`).toEqual([]);
    expect(depth, `${depth} block(s) left open at the end of the file`).toBe(0);
  });

  it('closes every comment it opens', () => {
    expect(css.split('/*').length, 'an unterminated comment swallows the rest of the file').toBe(
      css.split('*/').length,
    );
  });

  /**
   * The rules a broken brace eats first are the ones right after it, so
   * naming a few load-bearing selectors turns "the file is malformed" into
   * "this specific thing stopped existing". These are the chrome every
   * participant screen depends on.
   */
  it('still contains the rules the participant chrome is built from', () => {
    for (const selector of [
      '\n.elder-toolbar {',
      '\n.elder-toolbar__controls {',
      '\n.nav-primary {',
      "\n[data-workspace='participant'] {",
      '\n.welcome {',
      '\n.site-footer {',
    ]) {
      expect(css, `${selector.trim()} is gone`).toContain(selector);
    }
  });
});
