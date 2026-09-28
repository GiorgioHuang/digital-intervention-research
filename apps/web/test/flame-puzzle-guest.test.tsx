import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { App } from '../src/App.js';

/**
 * A shared link to the flame puzzle, opened by somebody who is not signed
 * in (owner, 2026-09-28): they play at once, and are asked to sign in only
 * to keep their progress or to go anywhere else in the study.
 */
function signedOutFetch() {
  return vi.fn(async (path: string) => {
    if (path === '/health') return new Response(JSON.stringify({ status: 'ok', authMode: 'google' }), { status: 200 });
    return new Response(JSON.stringify({ error: 'no session' }), { status: 401 });
  });
}

const signInShowing = () =>
  screen.queryByRole('heading', { level: 1, name: 'Your life, in your own words.' }) !== null;

describe('the flame puzzle, signed out', () => {
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.history.replaceState(null, '', '/exercises/flame-puzzle');
    vi.stubGlobal('fetch', signedOutFetch());
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    window.history.replaceState(null, '', '/');
  });

  const open = async () => {
    await act(async () => {
      render(<App />);
    });
    await act(async () => {});
  };

  it('opens the puzzle, not the sign-in screen', async () => {
    await open();
    expect(signInShowing()).toBe(false);
    expect(screen.getByRole('heading', { level: 1, name: 'Flame puzzle' })).toBeTruthy();
    expect(screen.getAllByRole('gridcell').length).toBeGreaterThan(0);
  });

  it('asks for sign-in to keep progress, and stays on the puzzle address', async () => {
    await open();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    fireEvent.click(screen.getByRole('button', { name: 'Sign in to keep your progress' }));
    expect(signInShowing()).toBe(true);
    // Sign-in starts from here, so it comes back here.
    expect(window.location.pathname).toBe('/exercises/flame-puzzle');
  });

  it('asks for sign-in to go anywhere else', async () => {
    await open();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    fireEvent.click(screen.getByRole('button', { name: '‹ All exercises' }));
    expect(signInShowing()).toBe(true);
    expect(window.location.pathname).toBe('/exercises');
  });

  it('leaves every other address behind the sign-in screen', async () => {
    window.history.replaceState(null, '', '/exercises');
    await open();
    expect(signInShowing()).toBe(true);
  });

  /**
   * Google sends everybody back to `/`, the one registered redirect. The
   * address sign-in was started from travels in `returnTo`, and going back
   * there is what brings "sign in to keep your progress" back to the
   * puzzle, with what was played as a guest carried over.
   */
  it('comes back to the puzzle from Google, with the progress carried over', async () => {
    const session = {
      actorId: 'actor_ann',
      displayName: 'Ann',
      authStrength: 'password',
      participantId: 'pt_ann',
      expiresAt: '2099-01-01T00:00:00Z',
    };
    vi.stubGlobal(
      'fetch',
      vi.fn(async (path: string, init?: RequestInit) => {
        if (path === '/health') return new Response(JSON.stringify({ status: 'ok', authMode: 'google' }), { status: 200 });
        if (path === '/v1/auth/session') return new Response(JSON.stringify(session), { status: 200 });
        return new Response(
          JSON.stringify((init?.method ?? 'GET') === 'GET' ? { data: [], meta: {} } : { data: { id: 'x' } }),
          { status: 200 },
        );
      }),
    );
    window.sessionStorage.setItem('platformAuthState', 'sign-in:s');
    window.sessionStorage.setItem('platformAuthReturn', '/exercises/flame-puzzle');
    window.sessionStorage.setItem(
      'flame-puzzle-carry',
      JSON.stringify({ unlocked: 1, stars: {}, hints: 3, sound: false, current: null }),
    );
    window.history.replaceState(null, '', '/#id_token=abc&state=sign-in:s');
    await open();
    await act(async () => {});
    expect(screen.getByRole('heading', { level: 1, name: 'Flame puzzle' })).toBeTruthy();
    expect(window.location.pathname).toBe('/exercises/flame-puzzle');
    expect(window.sessionStorage.getItem('flame-puzzle-carry'), 'the carried play was not taken up').toBeNull();
  });
});
