import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { App } from '../src/App.js';

const json = (b: unknown) => new Response(JSON.stringify(b), { status: 200 });

/**
 * The bar takes its own room, so nothing has to reserve it.
 *
 * There used to be a reservation: `main` carried bottom padding the
 * height of the bar, written at runtime into a custom property from a
 * measurement. It was wrong twice. Keyed on the session, it went stale
 * the day a screen without a bar appeared in front of the workspace —
 * the observer, still watching a node no longer in the document, wrote
 * `0px`, and the foot of every long screen sat under the tabs for the
 * rest of that visit. And the bar it was measuring was `position: fixed`,
 * which on Chrome for Android is anchored to the layout viewport and
 * therefore sits below the visible area whenever the URL bar is showing:
 * the tabs were cut in half on the about screen, labels gone (owner,
 * 2026-09-06).
 *
 * The bar is sticky and in the flow now. It occupies its own space, so
 * content cannot be underneath it and no measurement is needed — the
 * property, the observer and the padding rule are all gone. jsdom lays
 * nothing out, so this asserts the shape that makes it true; the layout
 * itself was checked in a browser at 393x700 on every screen, both
 * colour schemes, scrolled to the foot.
 */
describe('the room the tab bar takes', () => {
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (path: string, init?: RequestInit) => {
        if (path === '/health') return json({ status: 'ok', authMode: 'dev-header' });
        if (path.endsWith('/public-profile')) return json({ data: null });
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
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Not now/ }));
    });
  };

  it('writes no measurement anywhere, on the screens with a bar or without', async () => {
    await arrive();
    expect(document.querySelector('.nav-primary')).not.toBeNull();
    expect(
      document.documentElement.style.getPropertyValue('--nav-primary-height'),
      'the runtime measurement is back; it is the thing that went stale',
    ).toBe('');
  });

  it('is the last thing in the shell, so normal flow puts it at the foot', async () => {
    await arrive();
    const shell = document.querySelector('[data-workspace="participant"]')!;
    expect(shell.lastElementChild?.classList.contains('nav-primary')).toBe(true);
  });
});

/**
 * The participant workspace paints the whole window.
 *
 * Reported from a phone in dark mode (owner, 2026-09-05): black below the
 * content. This element carries the Classical ground and was only as tall
 * as what was on it, so on a short screen the page behind showed through
 * — and the page behind is `--color-surface-page`, which in dark mode is
 * #12181a. The workspace is a light design and cannot leave the window's
 * ground to a scheme it does not use.
 *
 * Asserted against the stylesheet, as the other chrome tests are: jsdom
 * applies no stylesheet and lays nothing out, so a computed-style check
 * would read '' and pass whatever the CSS said. The layout itself was
 * checked in a browser at 403x878 in both schemes, across all five tabs.
 */
describe('the ground under the participant workspace', () => {
  const css = readFileSync(resolve(process.cwd(), 'src/styles.css'), 'utf8');
  /*
   * The rule's own braces, found by scanning, rather than by guessing
   * what comes after it in the file.
   *
   * The first version of this sliced to a selector that is not in the
   * stylesheet at all. `indexOf` returned -1, `slice(a, -1)` took
   * everything to the end of the file, and the test then passed on a
   * `min-block-size: 100svh` belonging to a different rule — while the
   * one it was written for had been deleted. A guard that cannot see its
   * own defect is worse than none, because it is counted.
   */
  const shell = (() => {
    const start = css.indexOf("[data-workspace='participant'] {\n  --type-family-ui");
    expect(start, 'the workspace rule this guard reads has been renamed').toBeGreaterThan(-1);
    const end = css.indexOf('\n}', start);
    expect(end, 'the workspace rule is unterminated').toBeGreaterThan(start);
    return css.slice(start, end);
  })();

  it('covers the window, so nothing behind it can show', () => {
    expect(shell, 'the workspace no longer paints its own ground').toContain('background-color: var(--cl-bg)');
    expect(shell, 'a short screen can show the page behind the workspace again').toContain(
      'min-block-size: 100svh',
    );
    // `svh`, not `vh`: on a phone `100vh` is the LARGE viewport, so it
    // overshoots by the height of the address bar and leaves every screen
    // scrollable by that much.
    expect(shell).not.toContain('min-block-size: 100vh');
  });

  it('puts the footer at the foot rather than after the last thing on a short screen', () => {
    const from = css.indexOf("[data-workspace='participant'] > main {");
    expect(from, 'the rule this guard reads has been renamed').toBeGreaterThan(-1);
    const to = css.indexOf("[data-workspace='participant'] main > section", from);
    expect(to, 'the rule this guard reads is no longer followed by the one it stops at').toBeGreaterThan(from);
    const main = css.slice(from, to);
    expect(main, 'main no longer takes the slack the window leaves').toContain('flex: 1 1 auto');
    expect(main, 'the footer is no longer pushed to the foot').toContain('margin-block-start: auto');
  });
});
