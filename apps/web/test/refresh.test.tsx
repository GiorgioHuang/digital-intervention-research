import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { App } from '../src/App.js';
import { holdingLines } from '../src/holding.js';

/**
 * What happens when somebody presses refresh.
 *
 * Two defects, reported together and caused separately:
 *
 *   1. The sign-in screen flashed up on every refresh, on every screen,
 *      before Home appeared. `session` starts null and finding it again is
 *      three network round trips, so a signed-in person was shown the
 *      signed-out screen for as long as that took. Being told "you are
 *      signed out" and then "no you are not" is a reason to stop trusting
 *      the screen — and this audience is the least likely to shrug it off.
 *
 *   2. Refreshing anywhere landed on Home. The current screen lived in
 *      React state and nowhere else, so the browser had nothing to give
 *      back.
 *
 * A deployed sign-in (Google) is used throughout, because that is where
 * both defects live: the dev-header stub has no session to restore and
 * settles at once.
 */
function googleFetch(hasSession: boolean) {
  return vi.fn(async (path: string, init?: RequestInit) => {
    if (path === '/health') {
      return new Response(JSON.stringify({ status: 'ok', authMode: 'google' }), { status: 200 });
    }
    if (path === '/v1/auth/session') {
      return hasSession
        ? new Response(
            JSON.stringify({
              actorId: 'actor_ann',
              displayName: 'Ann',
              authStrength: 'password',
              participantId: 'pt_ann',
              expiresAt: '2099-01-01T00:00:00Z',
            }),
            { status: 200 },
          )
        : new Response(JSON.stringify({ error: 'no session' }), { status: 401 });
    }
    return new Response(
      JSON.stringify((init?.method ?? 'GET') === 'GET' ? { data: [], meta: {} } : { data: { id: 'x' } }),
      { status: 200 },
    );
  });
}

/**
 * The sign-in screen, identified by its headline.
 *
 * The first version of this looked for the "Continue with Google" button,
 * and could never have failed: on the frame this test inspects `authMode`
 * is still undefined, so that button is not drawn yet even when the whole
 * sign-in screen is. It asserted the absence of something already absent,
 * and passed with the defect restored. The headline is on the sign-in
 * screen from its first paint and on nothing else.
 */
const signInShowing = () =>
  screen.queryByRole('heading', { level: 1, name: 'Your life, in your own words.' }) !== null;

describe('pressing refresh', () => {
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    window.history.replaceState(null, '', '/');
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    window.history.replaceState(null, '', '/');
  });

  /**
   * The whole of defect 1. A synchronous `act` flushes React's own work
   * and nothing else, so this observes the frame the person actually saw —
   * after the first render, before the session comes back. An `await act`
   * here would flush the session too and the test would pass with the
   * defect present, which is the trap this is written around.
   */
  it('does not show the sign-in screen to somebody who is signed in', async () => {
    vi.stubGlobal('fetch', googleFetch(true));
    act(() => {
      render(<App />);
    });
    expect(signInShowing(), 'the sign-in screen flashed up before the session came back').toBe(false);

    await act(async () => {});
    await act(async () => {});
    expect(screen.getByRole('heading', { level: 1 }).textContent).toMatch(/Good (morning|afternoon|evening)/);
    expect(signInShowing()).toBe(false);
  });

  /**
   * The holding state must end. A flag that is set on the way in and only
   * cleared on the happy path leaves somebody who is genuinely signed out
   * looking at "Just a moment" for ever — a worse failure than the flash,
   * because nothing arrives to correct it.
   */
  it('reaches the sign-in screen when there really is no session', async () => {
    vi.stubGlobal('fetch', googleFetch(false));
    await act(async () => {
      render(<App />);
    });
    await act(async () => {});
    expect(signInShowing(), 'the holding screen never resolved for a signed-out visitor').toBe(true);
  });

  /**
   * The holding screen says something worth reading, and still says that
   * the page is working.
   *
   * Those are two different jobs and they are done by two elements. A
   * screen reader that announced only "We never sell your information"
   * would tell somebody who cannot see the page a true thing and not the
   * one they needed — so the state is stated for assistive technology and
   * the sentence is what is on the screen.
   */
  it('shows one of the sentences while it looks for the session', async () => {
    vi.stubGlobal('fetch', googleFetch(true));
    act(() => {
      render(<App />);
    });
    const status = screen.getByRole('status');
    const shown = status.querySelector('[aria-hidden="true"]')?.textContent ?? '';
    expect(
      holdingLines().map((l) => l.text),
      `"${shown}" is not one of the sentences`,
    ).toContain(shown);
    expect(status.textContent, 'nothing tells a screen reader the page is working').toMatch(/Opening your pages/);
    await act(async () => {});
    await act(async () => {});
  });

  /**
   * §E.1 requires a route to recovery at ten seconds. The holding screen
   * did not have one, so a session lookup that never answered left
   * somebody on a quiet page for ever — a worse failure than the flash it
   * replaced, because nothing arrives to correct it.
   */
  it('offers a way out when the wait goes on', async () => {
    vi.useFakeTimers();
    // A session that never comes back: the case the timer exists for.
    vi.stubGlobal(
      'fetch',
      vi.fn(async (path: string) => {
        if (path === '/health') {
          return new Response(JSON.stringify({ status: 'ok', authMode: 'google' }), { status: 200 });
        }
        if (path === '/v1/auth/session') return new Promise<Response>(() => undefined);
        return new Response(JSON.stringify({ data: [], meta: {} }), { status: 200 });
      }),
    );
    try {
      await act(async () => {
        render(<App />);
      });
      await act(async () => {});
      expect(screen.queryByText(/taking longer than usual/), 'the way out was offered immediately').toBeNull();
      await act(async () => {
        await vi.advanceTimersByTimeAsync(10_000);
      });
      const out = screen.getByText(/taking longer than usual/);
      // Clause 2, do not blame; clause 3, say whether the work was saved;
      // clause 1, end on something the person can do.
      expect(out.textContent).toMatch(/Nothing is wrong with your account/);
      expect(out.textContent).toMatch(/nothing you have written is affected/i);
      expect(out.textContent).toMatch(/Close this page and open it again\.$/);
    } finally {
      vi.useRealTimers();
    }
  });

  /** Defect 2, from the address inward. */
  it('opens the screen the address names', async () => {
    vi.stubGlobal('fetch', googleFetch(true));
    window.history.replaceState(null, '', '/my-story');
    await act(async () => {
      render(<App />);
    });
    await act(async () => {});
    expect(screen.getByRole('heading', { level: 1, name: 'My life story' })).toBeTruthy();
  });

  /** Defect 2, from the screen outward — the half that makes refresh work. */
  it('puts the screen in the address, so there is something to come back to', async () => {
    vi.stubGlobal('fetch', googleFetch(true));
    await act(async () => {
      render(<App />);
    });
    await act(async () => {});
    expect(window.location.pathname).toBe('/');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Exercises you can try' }));
    });
    expect(window.location.pathname, 'the address still says Home while the exercises are on screen').toBe(
      '/exercises',
    );
  });

  /**
   * Back and Forward are the same mechanism seen from the other side. They
   * used to walk straight out of the app on the first press, because
   * nothing had ever been pushed into the history.
   */
  it('answers the browser’s Back button', async () => {
    vi.stubGlobal('fetch', googleFetch(true));
    await act(async () => {
      render(<App />);
    });
    await act(async () => {});
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Exercises you can try' }));
    });
    expect(screen.getByRole('heading', { level: 1, name: 'Exercises you can try' })).toBeTruthy();

    await act(async () => {
      window.history.back();
    });
    // jsdom runs the traversal on a later task, not a microtask, so a
    // flushed promise is not enough to observe it.
    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });
    expect(window.location.pathname).toBe('/');
    expect(screen.getByRole('heading', { level: 1 }).textContent).toMatch(/Good (morning|afternoon|evening)/);
  });

  /**
   * Rewriting the path must not throw away the rest of the address.
   *
   * The access token was the case this was written for, and it turned out
   * not to be the case at all: `captureAccessToken` stores it and strips
   * `?token=` deliberately, so it is already gone by the first navigation.
   * The guard is kept, with a parameter the app does not read, because the
   * property it protects is the general one — a router that rebuilds the
   * address from the path alone silently drops everything else on it.
   */
  it('does not throw away the rest of the address when it rewrites the path', async () => {
    vi.stubGlobal('fetch', googleFetch(true));
    window.history.replaceState(null, '', '/?from=letter');
    await act(async () => {
      render(<App />);
    });
    await act(async () => {});
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Exercises you can try' }));
    });
    expect(window.location.pathname).toBe('/exercises');
    expect(window.location.search, 'the query string was dropped on navigation').toBe('?from=letter');
  });
});
