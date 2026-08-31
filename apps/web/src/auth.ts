import { accessTokenHeader, platformClientHeader, PlatformApiError, type ApiError } from './api.js';

/**
 * Sign in with Google (ADR-104).
 *
 * This uses the OpenID Connect redirect flow against Google directly
 * rather than Google's drop-in button script. Three reasons, in order of
 * how much they matter here:
 *
 *  1. The people signing in include older adults on old devices and slow
 *     connections. A redirect to a page Google renders works everywhere a
 *     browser works; a third-party script that must load, initialise and
 *     draw an iframe before anything is clickable has more ways to end up
 *     as a blank space where the button should be.
 *  2. The button is ours, so it can be sized, worded and contrasted like
 *     every other control on the page instead of being whatever Google
 *     ships this quarter.
 *  3. Nothing third-party executes on an origin that renders participants'
 *     health information.
 *
 * The token comes back in the URL fragment, which browsers do not send to
 * servers and do not put in `Referer` — so it never lands in an access log.
 */

const GOOGLE_AUTHORIZE = 'https://accounts.google.com/o/oauth2/v2/auth';
const STATE_KEY = 'platformAuthState';
const RETURN_KEY = 'platformAuthReturn';

export interface AuthSession {
  actorId: string;
  displayName: string;
  authStrength: 'password' | 'mfa' | 'step-up';
  participantId?: string;
  expiresAt: string;
}

/** What the sign-in redirect is for: a first sign-in, or a re-confirmation. */
export type AuthPurpose = 'sign-in' | 'step-up';

export type AuthMode = 'google' | 'dev-header';

/**
 * Which entrance to draw, asked of the server rather than configured into
 * the bundle a second time. Two copies of this answer can disagree, and
 * the failure of the disagreement is a sign-in screen that cannot sign
 * anybody in.
 *
 * Falls back to the development stub only when the answer is unreadable,
 * which is the honest reading of a server too old to say — that build had
 * no other mode.
 */
export interface ServerInfo {
  authMode: AuthMode;
  /** Whether this deployment can carry a message from the about screen. */
  contact: boolean;
}

/**
 * What the server says about itself, in one request.
 *
 * Both answers come from the side that knows. Configuring either of them a
 * second time in the bundle is how a build-time flag and a runtime secret
 * disagree for a week, and the person who finds out is the one whose
 * message went nowhere.
 *
 * Unreachable is read as the stub with no relay: the safe direction, since
 * it draws the local entrance and says plainly that nothing can be sent.
 */
export async function serverInfo(): Promise<ServerInfo> {
  try {
    const res = await fetch('/health');
    if (!res.ok) return { authMode: 'dev-header', contact: false };
    const body = (await res.json()) as { authMode?: unknown; contact?: unknown };
    return {
      authMode: body.authMode === 'google' ? 'google' : 'dev-header',
      contact: body.contact === true,
    };
  } catch {
    return { authMode: 'dev-header', contact: false };
  }
}

export async function detectAuthMode(): Promise<AuthMode> {
  return (await serverInfo()).authMode;
}

async function readJson<T>(res: Response): Promise<T> {
  const json = (await res.json()) as T & { error?: ApiError };
  if (!res.ok) throw new PlatformApiError(json.error as ApiError, res.status);
  return json;
}

/**
 * Who this browser is, according to the server. The session cookie is
 * HttpOnly, so this is the only way to find out — which is the point: the
 * answer comes from the side that can verify it, not from whatever the
 * last page left in local storage.
 */
export async function currentSession(): Promise<AuthSession | undefined> {
  const res = await fetch('/v1/auth/session', {
    headers: { ...platformClientHeader(), ...accessTokenHeader() },
  });
  if (res.status === 401) return undefined;
  return readJson<AuthSession>(res);
}

export async function signOut(): Promise<void> {
  await fetch('/v1/auth/session', {
    method: 'DELETE',
    headers: { ...platformClientHeader(), ...accessTokenHeader() },
  });
}

/**
 * Sends the browser to Google. Returns only if the redirect could not be
 * started, because otherwise the page is gone.
 */
export async function beginSignIn(purpose: AuthPurpose = 'sign-in', returnTo?: string): Promise<void> {
  const { nonce, clientId } = await readJson<{ nonce: string; clientId: string }>(
    await fetch('/v1/auth/nonce', { headers: { ...platformClientHeader(), ...accessTokenHeader() } }),
  );

  // `state` is this app checking its own redirect, separately from the
  // nonce, which is the server checking Google's token. Without it a link
  // somebody was sent could drop them back here mid-flow carrying a
  // response this app never asked for.
  const state = `${purpose}:${randomToken()}`;
  sessionStorage.setItem(STATE_KEY, state);
  sessionStorage.setItem(RETURN_KEY, returnTo ?? window.location.pathname + window.location.search);

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'id_token',
    scope: 'openid email profile',
    redirect_uri: redirectUri(),
    nonce,
    state,
    // Keeps the token out of the query string, and therefore out of server
    // logs, browser history entries sent to servers, and `Referer`.
    response_mode: 'fragment',
    // A step-up asks Google to authenticate the person again rather than
    // silently reissuing a token for a session from this morning. It is
    // the whole claim being made: not "who is this account" but "is that
    // person still at the keyboard, right now".
    ...(purpose === 'step-up' ? { prompt: 'login' as const, max_age: '0' } : {}),
  });
  window.location.assign(`${GOOGLE_AUTHORIZE}?${params.toString()}`);
}

export interface RedirectOutcome {
  session?: AuthSession;
  stepUpStrength?: string;
  returnTo: string;
  error?: string;
}

/**
 * Completes a sign-in if this page load is the return leg of one.
 * Returns undefined for an ordinary page load, so callers can call it
 * unconditionally at start-up.
 */
export async function completeRedirect(): Promise<RedirectOutcome | undefined> {
  const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : '';
  if (hash === '') return undefined;
  const fragment = new URLSearchParams(hash);
  const idToken = fragment.get('id_token');
  const state = fragment.get('state');
  const googleError = fragment.get('error');
  if (idToken === null && googleError === null) return undefined;

  const expectedState = sessionStorage.getItem(STATE_KEY);
  const returnTo = sessionStorage.getItem(RETURN_KEY) ?? '/';
  sessionStorage.removeItem(STATE_KEY);
  sessionStorage.removeItem(RETURN_KEY);
  // The token is taken out of the address bar before anything else can
  // read it, and before the person can bookmark or share the URL.
  clearFragment();

  if (googleError !== null) return { returnTo, error: 'Sign-in was not completed.' };
  if (state === null || expectedState === null || state !== expectedState) {
    return { returnTo, error: 'Sign-in could not be completed. Please try again.' };
  }

  const purpose: AuthPurpose = state.startsWith('step-up:') ? 'step-up' : 'sign-in';
  const nonceCarrier = idToken!;
  try {
    if (purpose === 'step-up') {
      const result = await exchange<{ authStrength: string }>('/v1/auth/step-up', nonceCarrier);
      return { returnTo, stepUpStrength: result.authStrength };
    }
    const session = await exchange<AuthSession>('/v1/auth/session', nonceCarrier);
    return { returnTo, session };
  } catch (error) {
    return {
      returnTo,
      error:
        error instanceof PlatformApiError
          ? error.error.message
          : 'Sign-in could not be completed. Please try again.',
    };
  }
}

/**
 * The nonce the server issued is inside the token Google signed, so the
 * client does not need to remember it — it is read back out and sent
 * alongside, and the server checks the two against each other.
 */
async function exchange<T>(path: string, idToken: string): Promise<T> {
  const nonce = nonceFromToken(idToken);
  const res = await fetch(path, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...platformClientHeader(),
      ...accessTokenHeader(),
    },
    body: JSON.stringify({ credential: idToken, nonce }),
  });
  return readJson<T>(res);
}

/**
 * Reads the nonce out of an unverified token, and that is all it is for.
 * Nothing here is trusted: the server verifies the signature and then
 * checks this same claim itself. Treating any other field from this
 * function as true would be reading an attacker's JSON.
 */
function nonceFromToken(idToken: string): string {
  const parts = idToken.split('.');
  if (parts.length !== 3) return '';
  try {
    const payload = JSON.parse(atob(parts[1]!.replace(/-/g, '+').replace(/_/g, '/'))) as {
      nonce?: unknown;
    };
    return typeof payload.nonce === 'string' ? payload.nonce : '';
  } catch {
    return '';
  }
}

function redirectUri(): string {
  // Registered in the Google Cloud console per deployed hostname. The
  // staff and participant entrances are different hostnames on one
  // service, so both are registered.
  return `${window.location.origin}/`;
}

function clearFragment(): void {
  window.history.replaceState(null, '', window.location.pathname + window.location.search);
}

function randomToken(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}
