import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { App } from '../src/App.js';

const json = (b: unknown) => new Response(JSON.stringify(b), { status: 200 });

/**
 * The chrome the handoff puts on every signed-in screen.
 *
 * Text size and reading aloud are the brief rather than a preference panel:
 * "Text-size control and read-aloud on **every** screen". A build that
 * quietly moved either into a settings page would satisfy no test and break
 * the requirement, so the test is about presence and permanence.
 */
describe('the elder chrome', () => {
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (path: string, init?: RequestInit) => {
        if (path === '/health') return json({ status: 'ok', authMode: 'dev-header' });
        if ((init?.method ?? 'GET') !== 'GET') return json({ data: { id: 'x' } });
        return json({ data: [], meta: {} });
      }),
    );
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  const arrive = async () => {
    await act(async () => {
      render(<App />);
    });
    fireEvent.change(screen.getByLabelText('Account identifier (actor id)'), { target: { value: 'a' } });
    fireEvent.change(screen.getByLabelText('Participant identifier'), { target: { value: 'p' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    });
  };

  it('carries the reading controls on the screen, not in a settings page', async () => {
    await arrive();
    expect(screen.getByRole('button', { name: 'Make the text bigger' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Make the text smaller' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Stronger black and white' })).toBeTruthy();
  });

  /**
   * The handoff has a FR/EN toggle. The owner ruled the study English only,
   * so it is gone rather than left switching between English and English —
   * a control that promises a translation nobody is writing is the empty
   * control this project keeps removing (D-2, D-5, D-21, D-34, D-75).
   */
  it('offers no language toggle, because there is no second language', async () => {
    await arrive();
    expect(screen.queryByRole('button', { name: /Passer en français|Switch to English/ })).toBeNull();
    expect(screen.queryByText(/^(FR|EN)$/)).toBeNull();
  });

  /**
   * The zoom is stepped through an updater rather than from the value read
   * at render, which the handoff calls out: rapid taps must accumulate. A
   * version that read `zoom` from the closure would drop every tap that
   * landed inside the same frame — and this is a person pressing A+ four
   * times because the first press did not seem to do anything.
   */
  it('accumulates rapid presses instead of racing them', async () => {
    await arrive();
    const bigger = screen.getByRole('button', { name: 'Make the text bigger' });
    await act(async () => {
      fireEvent.click(bigger);
      fireEvent.click(bigger);
      fireEvent.click(bigger);
    });
    const content = document.querySelector('[data-elder-content]') as HTMLElement;
    expect(content.getAttribute('data-zoom')).toBe('130');
  });

  it('stops at the ends of the range the handoff gives', async () => {
    await arrive();
    const bigger = screen.getByRole('button', { name: 'Make the text bigger' });
    await act(async () => {
      for (let i = 0; i < 12; i += 1) fireEvent.click(bigger);
    });
    const content = document.querySelector('[data-elder-content]') as HTMLElement;
    expect(content.getAttribute('data-zoom')).toBe('140');
    expect((bigger as HTMLButtonElement).disabled, 'the control keeps offering a step it will not take').toBe(true);
  });

  it('switches the content region to high contrast, and says it is pressed', async () => {
    await arrive();
    const toggle = screen.getByRole('button', { name: 'Stronger black and white' });
    expect(toggle.getAttribute('aria-pressed')).toBe('false');
    await act(async () => {
      fireEvent.click(toggle);
    });
    expect(toggle.getAttribute('aria-pressed')).toBe('true');
    expect(document.querySelector('[data-elder-content]')?.getAttribute('data-contrast')).toBe('high');
  });

  /**
   * Five, from the handoff's tab bar. D-10 had settled on four with width
   * arithmetic; the owner's ruling supersedes the conclusion, not the
   * obligation to re-measure — which found the labels clipping at 320 and
   * 360 until the type stepped down. Every tab carries an icon **and** a
   * word: DESIGN_SYSTEM §A.9's rule that no icon appears alone still holds.
   */
  it('offers the five destinations, each with a word beside its icon', async () => {
    await arrive();
    for (const name of ['Home', 'My life story', 'Other people’s stories', 'Messages', 'Help and safety']) {
      const tab = screen.getByRole('button', { name });
      expect(tab, `${name} is missing from the tab bar`).toBeTruthy();
      expect(tab.querySelector('svg'), `${name} has no icon`).toBeTruthy();
      expect(tab.textContent?.trim(), `${name} is an icon with no word`).not.toBe('');
    }
  });

  it('shows the helper banner only while somebody is helping', async () => {
    await arrive();
    expect(screen.queryByText(/is helping\./)).toBeNull();
  });
});

/**
 * The toolbar reached a real browser broken, and the way it got there is
 * the part worth guarding.
 *
 * "Read aloud" was rendered only where `speechSynthesis` existed. jsdom has
 * none, so every measurement I took was of a bar with one fewer control
 * than the one people were using — and the missing control was the widest.
 * On a phone the row then squeezed until the label came apart letter by
 * letter, "T / ex / t", and "Read aloud" went to four lines. A control
 * narrower than its own word is not a smaller control; it is a broken one,
 * and this is the bar somebody uses to make the text bigger.
 *
 * So the shape of this bar may not depend on the environment: every
 * control is always present, disabled where it cannot work.
 */
describe('the toolbar has one shape everywhere', () => {
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (path: string, init?: RequestInit) => {
        if (path === '/health') return json({ status: 'ok', authMode: 'dev-header' });
        if ((init?.method ?? 'GET') !== 'GET') return json({ data: { id: 'x' } });
        return json({ data: [], meta: {} });
      }),
    );
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  const arrive = async () => {
    await act(async () => {
      render(<App />);
    });
    fireEvent.change(screen.getByLabelText('Account identifier (actor id)'), { target: { value: 'a' } });
    fireEvent.change(screen.getByLabelText('Participant identifier'), { target: { value: 'p' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    });
  };

  it('offers read aloud even where the browser cannot speak', async () => {
    // jsdom has no speechSynthesis, which is precisely the environment that
    // hid this. The control is here, and disabled, rather than absent.
    expect('speechSynthesis' in window, 'this test no longer proves anything').toBe(false);
    await arrive();
    const read = screen.getByRole('button', { name: /Read aloud/ });
    expect(read).toBeTruthy();
    expect((read as HTMLButtonElement).disabled).toBe(true);
  });

  /**
   * Six controls at the 44px this platform requires come to 429px against
   * 362px of usable width at 390. The handoff's own bar fits because its
   * squares are 34px on a 404px frame, and its accessibility section
   * forbids going below 44 — both cannot hold. The bar is therefore two
   * groups that break between themselves and never inside a control.
   */
  it('breaks between groups, never inside a control', async () => {
    await arrive();
    /*
     * One row is the owner's instruction, and it holds at 320px only
     * because the width was measured rather than assumed: the language
     * toggle is gone, the gap is the handoff's own 6px rather than the
     * spacing token I had rounded it up to, and the decorative "Text"
     * label is dropped. Four controls, 266px of them, inside 292px of
     * usable width at the narrowest phone this serves.
     *
     * Asserted against the stylesheet, as the token tests do: jsdom applies
     * no stylesheet, so a computed-style check would read '' and pass for
     * the wrong reason whatever the CSS said.
     */
    const css = readFileSync(resolve(process.cwd(), 'src/styles.css'), 'utf8');
    const bar = css.slice(css.indexOf('.elder-toolbar {'), css.indexOf('.elder-helper-banner'));
    expect(bar, 'toolbar items may shrink again').toContain('flex: 0 0 auto');
    expect(bar, 'toolbar items may wrap inside themselves again').toContain('white-space: nowrap');
    expect(
      document.querySelectorAll('.elder-toolbar button').length,
      'a fifth control is back in the top bar, which is what put it on two rows',
    ).toBe(4);
  });

  /**
   * The tabs stay at the bottom at every width.
   *
   * They did not. A rule from before the elder handoff turned the bar back
   * into a static top navigation above 40rem — and because this nav is
   * written *before* the toolbar in the markup, `position: static` did not
   * merely move the tabs to the top, it put them above the reading
   * controls. The top of a wide participant screen became a row of
   * destinations instead of the text-size buttons the brief puts on every
   * screen, and nothing in the suite noticed: jsdom applies no stylesheet
   * and lays nothing out, so no rendering test could ever have caught it.
   *
   * So the guard is against the stylesheet text and against the one
   * structural fact that makes the defect possible.
   */
  it('keeps the tabs below the reading controls at every width', async () => {
    await arrive();
    const nav = document.querySelector('.nav-primary');
    const bar = document.querySelector('.elder-toolbar');
    expect(nav, 'the primary nav is gone').toBeTruthy();
    // This is what makes the CSS load-bearing: in document order the nav
    // comes first, so anything that returns it to normal flow puts it above
    // the toolbar. Asserted so the rule below is not mistaken for a
    // preference.
    expect(
      nav!.compareDocumentPosition(bar!) & Node.DOCUMENT_POSITION_FOLLOWING,
      'the nav no longer precedes the toolbar; the rule below may be stale',
    ).toBeTruthy();

    const css = readFileSync(resolve(process.cwd(), 'src/styles.css'), 'utf8');
    // Anchored to the start of a line. Plain `.nav-primary {` also matches
    // inside `[data-workspace='participant'] .nav-primary {`, and once that
    // scoped rule was added ahead of the base one this guard read the wrong
    // block and reported the bar as no longer fixed when it was.
    const at = css.indexOf('\n.nav-primary {');
    expect(at, 'the .nav-primary rule has been renamed').toBeGreaterThan(-1);
    expect(
      css.slice(at, css.indexOf('}', at)),
      'the tab bar is no longer fixed',
    ).toMatch(/position:\s*fixed/);
    // Anywhere in the file, in any media query: a single `position: static`
    // on this selector is the whole defect.
    expect(
      css,
      'something returns the tab bar to normal flow, which puts it above the reading controls',
    ).not.toMatch(/\.nav-primary[^{}]*\{[^{}]*position:\s*static/);
    // The bar is fixed, so main reserves its height. The removed block also
    // cancelled that reserve, which would have hidden the last row of every
    // wide screen behind the tabs.
    expect(css, 'main no longer reserves room for the fixed bar').toContain(
      'body:has(.nav-primary) main {',
    );
    expect(css, 'the reserved room is cancelled again').not.toMatch(
      /body:has\(\.nav-primary\) main \{ padding-block-end: var\(--space-6\); \}/,
    );
  });

  /**
   * The mark stays; the name is what gives way.
   *
   * The first version hid the whole brand below the breakpoint, because
   * the reading controls filled the row at 320px. The owner's correction
   * was that the mark must survive there — so the room was found rather
   * than the mark dropped: the two size buttons became a segmented pair
   * sharing one border, the decorative speaker glyph goes, and the bar's
   * own side padding tightens. All three are narrow-width rules, and all
   * three are what keep 320px on one row, so all three are asserted.
   */
  it('keeps the mark at every width and drops only the name', async () => {
    await arrive();
    expect(screen.getByText('icareu'), 'the wordmark is gone from the markup').toBeTruthy();
    expect(document.querySelector('.elder-toolbar__brand-mark'), 'the mark is gone').toBeTruthy();
    // First in the row, so everything after it is pushed right as one
    // group rather than the brand being stranded after the controls.
    expect(document.querySelector('.elder-toolbar > *')?.className).toContain('elder-toolbar__brand');

    const css = readFileSync(resolve(process.cwd(), 'src/styles.css'), 'utf8');
    // Anchors asserted found, not merely used: `indexOf` returns -1 when a
    // rule is renamed, and slicing from -1 yields '' — which fails every
    // `toContain` for the wrong reason and passes every `not.toContain`
    // somebody adds later (D-90).
    const from = css.indexOf('@media (max-width: 25.9rem) {');
    expect(from, 'the narrow-width block has moved or been renamed').toBeGreaterThan(-1);
    // Both anchors asserted, not just the outer one. Deleting the
    // read-icon rule collapsed this slice to '' and the failure that came
    // out named the wordmark — a guard reporting a defect that was not
    // there, found by mutation-testing this very test.
    const iconAt = css.indexOf('.elder-toolbar__read-icon', from);
    expect(iconAt, 'the speaker glyph is back, and it is width this row has not got').toBeGreaterThan(from);
    // The name gives way at a narrower width than the glyph does — one
    // breakpoint would have to serve the stricter of the two and would
    // take the name off a 390 phone.
    const nameAt = css.indexOf('@media (max-width: 23.4rem) {');
    expect(nameAt, 'the name and the glyph share a breakpoint again').toBeGreaterThan(iconAt);
    // +1 so the block's own closing brace is inside the slice; without it
    // the last rule reads as unterminated and its assertion fails on the
    // punctuation rather than on the rule.
    const narrow = css.slice(from, css.indexOf('}', css.indexOf('.elder-toolbar__wordmark', nameAt)) + 1);
    expect(narrow, 'the name no longer gives way on a phone').toContain(
      '.elder-toolbar__wordmark { display: none; }',
    );
    expect(narrow, 'the mark is being hidden along with the name').not.toContain(
      '.elder-toolbar__brand { display: none',
    );
    expect(narrow, 'the speaker glyph is back, and it is 18px this row has not got').toContain(
      '.elder-toolbar__read-icon { display: none; }',
    );

    // One auto margin, not two. Two each take a share of the free space,
    // which is what left the contrast button alone at the far end.
    expect(css, 'the controls no longer align right').toContain('margin-inline-end: auto');
    expect(css, 'a second auto margin is back, which splits the control group').not.toContain(
      '.elder-toolbar__push',
    );
  });

  /**
   * One control to look at, two things to press.
   *
   * "Merge the +/- buttons into one longer button" cannot mean one button:
   * smaller and bigger are two actions, and a control whose meaning depends
   * on which half was pressed is not something a screen reader can
   * announce. So the pair shares a border and keeps two targets, each at
   * the full floor — and the borders overlap rather than nesting inside a
   * wrapper, which is what keeps the pair the same height as the buttons
   * beside it instead of 4px taller.
   */
  it('merges the size buttons visually without merging them for real', async () => {
    await arrive();
    const halves = document.querySelectorAll('.elder-toolbar__zoom > button');
    expect(halves.length, 'the size pair is not two buttons').toBe(2);
    expect(screen.getByRole('button', { name: 'Make the text smaller' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Make the text bigger' })).toBeTruthy();

    const css = readFileSync(resolve(process.cwd(), 'src/styles.css'), 'utf8');
    const at = css.indexOf('.elder-toolbar__zoom > button {');
    expect(at, 'the size pair rule has been renamed').toBeGreaterThan(-1);
    const rule = css.slice(at, css.indexOf('}', at));
    expect(rule, 'a half of the size pair has dropped below the touch floor').toContain(
      'min-inline-size: var(--target-min)',
    );
    expect(rule, 'a half of the size pair has dropped below the touch floor').toContain(
      'min-block-size: var(--target-min)',
    );
    // A wrapper border would add its own height and make this control
    // taller than everything beside it. Measured at 54px against 50 the
    // first time this was built.
    expect(css, 'the shared edge is drawn as a wrapper again').toContain(
      '.elder-toolbar__zoom > button + button { margin-inline-start: calc(-1 * var(--border-default)); }',
    );
  });
});
