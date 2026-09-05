import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { App } from '../src/App.js';

const json = (b: unknown) => new Response(JSON.stringify(b), { status: 200 });

/**
 * The fixed bottom bar covers the foot of every screen unless `main`
 * reserves exactly as much room as the bar takes up, and the reservation
 * is a measurement written into `--nav-primary-height` at runtime.
 *
 * The measurement used to be keyed on the session. That was true for as
 * long as every signed-in screen had the bar — and stopped being true the
 * day a screen without one arrived in front of the workspace (the
 * first-arrival naming screen, 2026-09-05). The bar unmounts, the
 * observer still watching the detached node fires with a height of zero,
 * `0px` is written, and nothing re-runs it because the session has not
 * changed. For the rest of that visit the reservation was 36px against a
 * 72px bar, and the foot of every long screen — the footer, the last
 * button on a form — sat underneath it.
 *
 * jsdom has no layout, so the height is mocked. What is being tested is
 * not the number but WHEN it is taken: that the bar going away and coming
 * back leaves the reservation right.
 */
describe('the reservation for the fixed tab bar', () => {
  const BAR_HEIGHT = 72;
  let restoreHeight: (() => void) | undefined;

  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const original = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight');
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
      configurable: true,
      get(this: HTMLElement) {
        // Only the bar, and only while it is in the document — which is
        // the whole of what went wrong.
        return this.classList?.contains('nav-primary') && this.isConnected ? BAR_HEIGHT : 0;
      },
    });
    restoreHeight = () => {
      if (original === undefined) delete (HTMLElement.prototype as { offsetHeight?: unknown }).offsetHeight;
      else Object.defineProperty(HTMLElement.prototype, 'offsetHeight', original);
    };
    vi.stubGlobal(
      'fetch',
      vi.fn(async (path: string, init?: RequestInit) => {
        if (path === '/health') return json({ status: 'ok', authMode: 'dev-header' });
        // No public name: the first-arrival screen appears, and it has no
        // tab bar. This is the sequence that broke the measurement.
        if (path.endsWith('/public-profile')) return json({ data: null });
        if ((init?.method ?? 'GET') !== 'GET') return json({ data: { id: 'x' } });
        return json({ data: [], meta: {} });
      }),
    );
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    restoreHeight?.();
    document.documentElement.style.removeProperty('--nav-primary-height');
  });

  const reserved = () => document.documentElement.style.getPropertyValue('--nav-primary-height');

  it('is measured again when the bar comes back after a screen without one', async () => {
    await act(async () => {
      render(<App />);
    });
    fireEvent.change(screen.getByLabelText('Account identifier (actor id)'), { target: { value: 'a' } });
    fireEvent.change(screen.getByLabelText('Participant identifier'), { target: { value: 'p' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    });

    // The first-arrival screen: no bar, so nothing to reserve. The stale
    // number from before must not be left behind either.
    expect(screen.getByRole('heading', { name: /What should we call you/ })).toBeTruthy();
    expect(document.querySelector('.nav-primary')).toBeNull();
    expect(reserved()).toBe('');

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Not now/ }));
    });

    // The workspace, with the bar — and the reservation is its height,
    // not the zero left behind by the node that went away.
    expect(document.querySelector('.nav-primary')).not.toBeNull();
    expect(reserved()).toBe(`${BAR_HEIGHT}px`);
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
