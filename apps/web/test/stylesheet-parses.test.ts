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

  /**
   * The sign-in headline is sized from the column, not fixed.
   *
   * At a fixed 41.6px it broke across two lines from 405px downwards — the
   * string wants 468px and the column is 361 — and a smaller fixed size
   * only moves the width at which it breaks. Measured in a browser at 320,
   * 360, 390, 405, 430 and 768; that measurement cannot run in this suite,
   * so what is guarded here is that the size still derives from the
   * viewport at all. It catches a revert to a constant, which is what the
   * defect was; it cannot tell you the constant inside the clamp is right.
   */
  it('sizes the sign-in headline from the width it has to fit', () => {
    const rule = css.slice(css.indexOf('\n.welcome h1 {'));
    const body = rule.slice(0, rule.indexOf('}'));
    expect(body, 'the headline is back on a fixed size, which wraps below 407px').toMatch(/font-size:\s*clamp\(/);
    expect(body, 'the size no longer tracks the width of the column').toContain('vw');
  });

  /**
   * The label sits in the middle of the button it is in.
   *
   * The platform's buttons are `inline-flex` with `justify-content:
   * flex-start`, which is right for a button sized to its label and wrong
   * for one stretched across the column: measured at 405px, "Continue with
   * Google" sat 20px from the left edge with 130px of space after it. The
   * prototype's own declaration centres it.
   */
  it('centres the label in the full-width buttons on the sign-in screen', () => {
    const rule = css.slice(css.indexOf("\n.welcome form button[type='submit'],"));
    const body = rule.slice(0, rule.indexOf('}'));
    expect(body, 'the sign-in buttons are back on the platform default, which starts the label at the left').toContain(
      'justify-content: center;',
    );
  });

  /**
   * The reading toolbar does not scroll away.
   *
   * It is the bar that makes the text bigger and reads the page aloud, and
   * the handoff heads its section "Accessibility toolbar (always)".
   * Scrolling it off put the control furthest from the person needing it
   * at the moment they needed it. Verified in a browser by scrolling —
   * this only checks the declaration is still there, which is what a
   * revert would remove.
   */
  it('keeps the reading toolbar on screen while the page scrolls', () => {
    // Comments stripped first. This rule's own comment contains
    // `html, body { overflow-x: clip }`, and that brace ends the body
    // early — the guard failed on the working stylesheet until it did.
    const rule = withoutComments.slice(withoutComments.indexOf('\n.elder-toolbar {'));
    const body = rule.slice(0, rule.indexOf('}'));
    expect(body, 'the reading controls scroll away again').toContain('position: sticky;');
    expect(body, 'sticky with no edge to stick to does nothing').toContain('inset-block-start: 0;');
  });

  /**
   * A sticky header can cover the element Tab just moved focus to, and
   * that failure is silent — focus really did move, only the seeing of it
   * is lost (WCAG 2.4.11). The reservation has to be the bar's real
   * height, which is not a constant: at 200% it wraps to two rows.
   */
  it('reserves the toolbar’s own height so focus is never hidden under it', () => {
    expect(css, 'the scroll reservation is back on a guessed constant').toMatch(
      /scroll-padding-block:\s*var\(--elder-toolbar-height/,
    );
  });

  /**
   * The participant workspace says which colour scheme it is.
   *
   * Reported as a black tick box. It was not the tick box: the document
   * declares `color-scheme: light dark`, and the Classical palette has no
   * dark variant — every --cl- token is defined exactly once. So on a
   * device set to dark, the page painted itself light from its own tokens
   * while the browser painted the native controls dark. Measured at
   * #3b3b3b on a #f3f2f2 page; #ffffff after.
   *
   * It reached every native control, not just the one that was noticed —
   * the text fields, the message box on the about screen, the selects and
   * the scrollbars.
   */
  it('declares the colour scheme the participant workspace actually has', () => {
    const rule = withoutComments.slice(withoutComments.indexOf("\n[data-workspace='participant'] {"));
    const body = rule.slice(0, rule.indexOf('}'));
    expect(body, 'native controls follow the device again, on a workspace that is light only').toContain(
      'color-scheme: light;',
    );
  });

  /**
   * The participant chrome draws its edges with the design's hairline, not
   * the platform's default border.
   *
   * The bottom tab bar read as a hard dark rule under every screen. The
   * cause was a gap in the Classical remap: `.nav-primary` asks for
   * `--border-default` / `--color-border-default`, and this workspace
   * remaps `--color-border-*subtle*` to the divider while leaving *default*
   * pointing at #74817e — a colour chosen for the staff workspace's
   * graphic-contrast floor. Measured on the bar's own ground that is
   * 3.71:1 at 2px, against a drawing that asks for 1.38:1 at 1px, and it
   * also made the bar 73px against the handoff's 72.
   *
   * Text, not computed style, and so worth being honest about what it can
   * and cannot see: it proves the declaration is present, not that a
   * browser applies it. A rule above it could still be shadowing it. It is
   * here because the defect it guards was a *missing* declaration, which
   * is exactly what reading the text does catch — the browser measurement
   * that found it in the first place cannot run in this suite.
   */
  it('draws the tab bar’s top edge with the design’s hairline', () => {
    const rule = css.slice(css.indexOf("[data-workspace='participant'] .nav-primary {"));
    const body = rule.slice(0, rule.indexOf('}'));
    expect(
      body,
      'the participant tab bar is back on the platform default border, which is twice as thick and ~2.7x the contrast the design draws',
    ).toContain('border-block-start: var(--border-hairline) solid var(--cl-divider);');
  });
});
