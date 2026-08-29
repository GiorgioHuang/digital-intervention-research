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
    const at = css.indexOf('.nav-primary {');
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
   * The brand, on the owner's instruction: wide screen, controls right, mark
   * and name left. What is worth a test is not that it looks right — it is
   * that it cannot reach the phone, where the four controls were measured to
   * fill the row and a fifth item is what put this bar on two lines before.
   */
  it('shows the brand only where there is room for it', async () => {
    await arrive();
    expect(screen.getByText('icareu'), 'the wordmark is gone').toBeTruthy();
    // It is the first item, so the controls that follow are pushed right as
    // one group rather than the brand being stranded after them.
    expect(document.querySelector('.elder-toolbar > *')?.className).toContain('elder-toolbar__brand');

    const css = readFileSync(resolve(process.cwd(), 'src/styles.css'), 'utf8');
    // Anchors asserted found, not merely used. `indexOf` returns -1 when a
    // rule has been renamed, and slicing from -1 yields '' — which fails
    // every `toContain` below for the wrong reason and passes every
    // `not.toContain` one might add later (D-90).
    const from = css.indexOf('.elder-toolbar__brand { display: none; }');
    const to = css.indexOf('.elder-toolbar__brand-mark', from + 1);
    expect(from, 'the brand is no longer hidden by default').toBeGreaterThan(-1);
    expect(to, 'the brand block no longer ends where this test looks for it').toBeGreaterThan(from);
    const brand = css.slice(from, to);
    expect(brand, 'the brand now reaches the phone, where the row has no width for it').toMatch(
      /@media \(min-width: 34rem\)/,
    );
    // Two auto margins in one row leave the contrast control marooned at the
    // far end. Where the brand takes the auto, the contrast button drops its
    // own — asserted, because it is one line and easy to lose.
    expect(brand, 'the brand does not push the controls right').toContain('margin-inline-end: auto');
    expect(brand, 'the contrast button keeps its own auto margin, which splits the group').toContain(
      '.elder-toolbar__push { margin-inline-start: 0; }',
    );
  });
});
