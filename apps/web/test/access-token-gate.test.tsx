import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { AccessTokenGate } from '../src/components/AccessTokenGate.js';
import { accessTokenHeader, api, PlatformApiError, storeAccessToken } from '../src/api.js';

const session = { actorId: 'actor_test', participantId: 'pt_a' };

/**
 * The deployed environment's access token is stripped from the address bar
 * on capture, so a lost copy must be recoverable inside the app; and a
 * rejected token must be reported as an environment problem rather than as
 * an error code buried in whichever panel happened to call.
 */
describe('access-token recovery after a 401', () => {
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    storeAccessToken('');
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    storeAccessToken('');
  });

  it('stays out of the way until the server rejects a request', async () => {
    await act(async () => {
      render(<AccessTokenGate />);
    });
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('a 401 raises the gate, and the re-entered token is attached to later requests', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              error: { code: 'AUTHENTICATION_REQUIRED', message: 'Access token required', requestId: 'r', retryable: false },
            }),
            { status: 401 },
          ),
      ),
    );
    await act(async () => {
      render(<AccessTokenGate />);
    });

    // No token stored: the request goes out bare and comes back 401.
    expect(accessTokenHeader()).toEqual({});
    await act(async () => {
      await api.listCommunitySpaces(session).catch((e: unknown) => {
        expect(e).toBeInstanceOf(PlatformApiError);
      });
    });

    const alert = screen.getByRole('alert');
    expect(alert.textContent).toContain('访问口令');
    // The wording must not blame the person's account or permissions.
    expect(alert.textContent).toContain('与你的账号和权限无关');

    fireEvent.change(screen.getByLabelText('访问口令'), { target: { value: ' tok-xyz ' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '保存口令' }));
    });
    expect(screen.getByRole('alert').textContent).toContain('请再点一次刚才的操作');
    // Trimmed and now attached to every subsequent call.
    expect(accessTokenHeader()).toEqual({ 'x-access-token': 'tok-xyz' });
  });
});
