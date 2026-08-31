import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { act } from 'react';
import { App } from '../src/App.js';
import { completeRedirect, detectAuthMode } from '../src/auth.js';

/**
 * The entrance a person actually meets, and the checks behind it.
 *
 * The participant entrance is the one an older adult opens first, so the
 * tests about what is and is not on it are not cosmetic: an identifier box
 * on a screen that no longer uses identifiers is a box somebody will try
 * to fill in.
 */

function mockHealth(authMode: string): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/health')) {
        return new Response(JSON.stringify({ status: 'ok', authMode }), { status: 200 });
      }
      if (url.includes('/v1/auth/session')) {
        return new Response(
          JSON.stringify({ error: { code: 'AUTHENTICATION_REQUIRED', message: 'Not signed in' } }),
          { status: 401 },
        );
      }
      return new Response(JSON.stringify({ data: [] }), { status: 200 });
    }),
  );
}

describe('which entrance a deployment shows', () => {
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    sessionStorage.clear();
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    window.location.hash = '';
  });

  it('asks the server rather than carrying a second copy of the answer', async () => {
    mockHealth('google');
    await expect(detectAuthMode()).resolves.toBe('google');
  });

  /**
   * A server too old to answer had only one mode, so that is the honest
   * reading — and it is also the safe one here, because the stub refuses
   * to run anywhere real.
   */
  it('falls back to the stub when the server cannot say', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('nope', { status: 500 })));
    await expect(detectAuthMode()).resolves.toBe('dev-header');
  });

  it('offers Google, and no identifier boxes, where Google is configured', async () => {
    mockHealth('google');
    await act(async () => {
      render(<App />);
    });
    // "Continue with Google", the design's label. The participant
    // entrance is the one place it differs; the staff and supporter
    // entrances keep GoogleSignIn's default "Sign in with Google".
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeTruthy();
    expect(screen.queryByLabelText(/account identifier/i)).toBeNull();
    expect(screen.queryByLabelText(/participant identifier/i)).toBeNull();
  });

  /**
   * The synthetic pilot and local development still run on the stub, and
   * removing their way in would have been a quiet way to break both.
   */
  it('keeps the development identifiers where the stub is configured', async () => {
    mockHealth('dev-header');
    await act(async () => {
      render(<App />);
    });
    expect(screen.getByLabelText(/account identifier/i)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /sign in with google/i })).toBeNull();
  });
});

describe('coming back from Google', () => {
  beforeEach(() => {
    sessionStorage.clear();
    window.location.hash = '';
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    window.location.hash = '';
  });

  it('does nothing on an ordinary page load', async () => {
    await expect(completeRedirect()).resolves.toBeUndefined();
  });

  /**
   * `state` is this app checking its own redirect. Without it, a link
   * somebody was sent could drop them back here carrying a response this
   * app never asked for — and the exchange must not even be attempted,
   * which is why the assertion is on fetch never being called.
   */
  it('refuses a response whose state this app did not issue', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    sessionStorage.setItem('platformAuthState', 'sign-in:the-real-one');
    window.location.hash = '#id_token=abc&state=sign-in:forged';

    const outcome = await completeRedirect();
    expect(outcome?.error).toMatch(/could not be completed/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('refuses a response when this app issued no state at all', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    window.location.hash = '#id_token=abc&state=sign-in:whatever';

    const outcome = await completeRedirect();
    expect(outcome?.error).toBeDefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  /**
   * The token is in the address bar when the browser lands. It comes out
   * before anything else can read it and before the page can be
   * bookmarked or the URL shared — a fragment is not sent to servers, but
   * it is very much still on the screen.
   */
  it('takes the token out of the address bar', async () => {
    vi.stubGlobal('fetch', vi.fn());
    window.location.hash = '#id_token=abc&state=sign-in:forged';
    await completeRedirect();
    expect(window.location.hash).toBe('');
  });

  it('reports a refusal from Google without pretending to be signed in', async () => {
    vi.stubGlobal('fetch', vi.fn());
    sessionStorage.setItem('platformAuthState', 'sign-in:s');
    window.location.hash = '#error=access_denied&state=sign-in:s';

    const outcome = await completeRedirect();
    expect(outcome?.session).toBeUndefined();
    expect(outcome?.error).toBeDefined();
  });
});
