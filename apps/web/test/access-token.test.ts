import { afterEach, describe, expect, it } from 'vitest';
import { accessTokenHeader, captureAccessToken } from '../src/api.js';

/**
 * Deployed-perimeter glue: a token passed once via ?token=… is stored,
 * stripped from the address bar (it must not linger in the URL for
 * history/screenshots), and attached to every API request thereafter.
 */
describe('access token capture and header attachment', () => {
  afterEach(() => {
    window.localStorage.removeItem('platformAccessToken');
  });

  it('without a stored token no header is added (local development unchanged)', () => {
    expect(accessTokenHeader()).toEqual({});
  });

  it('captures ?token=… into storage, strips it from the URL, then attaches the header', () => {
    window.history.replaceState(null, '', '/?token=tok-abc123&x=1');
    captureAccessToken();
    expect(window.location.search).not.toContain('token=');
    expect(window.location.search).toContain('x=1');
    expect(accessTokenHeader()).toEqual({ 'x-access-token': 'tok-abc123' });
  });
});
