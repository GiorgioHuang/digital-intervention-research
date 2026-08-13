import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { AccountsAndRoles } from '../src/components/AccountsAndRoles.js';

const session = { actorId: 'actor_admin', authStrength: 'mfa' as const, organisationId: 'org_1' };

const role = (over: Record<string, unknown> = {}) => ({
  roleAssignmentId: 'ra_1',
  role: 'Researcher',
  organisationId: 'org_1',
  researchProjectId: null,
  assignmentState: 'Active',
  expiresAt: null,
  assignedByActorId: 'actor_admin',
  revokedAt: null,
  revokedByActorId: null,
  recordVersion: 3,
  createdAt: '2026-08-01T00:00:00Z',
  ...over,
});

function stubFetch(roles: unknown[] = [role()]) {
  const calls: { path: string; method: string; body: Record<string, unknown> }[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (path: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET';
      if (method === 'GET') {
        calls.push({ path, method, body: {} });
        return new Response(
          JSON.stringify({
            data: [
              {
                type: 'UserAccount',
                id: 'actor_r',
                attributes: {
                  userAccountId: 'actor_r',
                  displayName: 'Researcher Rae',
                  accountState: 'Active',
                  actorType: 'user',
                  roles,
                },
              },
            ],
          }),
          { status: 200 },
        );
      }
      calls.push({ path, method, body: JSON.parse(init!.body as string) as Record<string, unknown> });
      return new Response(JSON.stringify({ data: { id: 'ra_1' } }), { status: 201 });
    }),
  );
  return calls;
}

/**
 * revokeRole had its permission check, version guard, domain event and
 * audit entry from the day M01 was written, and no route and no screen.
 * Access could be given and never taken back.
 */
describe('accounts and roles', () => {
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  /**
   * This used to assert the opposite — that an account could not be closed
   * and that removing every role was the only way to stop somebody. That
   * was true of the development stub and false the moment sign-in became
   * real: revoking roles leaves the person signed in, able to sign in
   * again, and holding everything they own. The screen now has to
   * distinguish the two, because an administrator who reaches for the
   * wrong one believes they have shut somebody out and has not.
   */
  it('distinguishes taking a role back from stopping somebody', async () => {
    stubFetch();
    await act(async () => {
      render(<AccountsAndRoles session={session} />);
    });
    expect(screen.getByText(/removing roles does not stop them signing in/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /suspend this account/i })).toBeTruthy();
  });

  it('asks before ending somebody\'s session, and says that is what it does', async () => {
    const calls = stubFetch();
    await act(async () => {
      render(<AccountsAndRoles session={session} />);
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /suspend this account/i }));
    });
    expect(screen.getByText(/signed out immediately/i)).toBeTruthy();
    // Nothing sent until it is confirmed.
    expect(calls.some((c) => c.path.includes('/account-state'))).toBe(false);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Suspend them' }));
    });
    const call = calls.find((c) => c.path.includes('/account-state'));
    expect(call).toBeDefined();
    expect(call?.body).toMatchObject({ state: 'Suspended', confirmed: true });
  });

  it('revoking is confirmed, version-bound, and says what it does not undo', async () => {
    const calls = stubFetch();
    await act(async () => {
      render(<AccountsAndRoles session={session} />);
    });
    expect(screen.getByText(/does not remove anything the person did/i)).toBeTruthy();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Take back this role' }));
    });
    // Nothing sent until confirmed.
    expect(calls.filter((c) => c.method === 'POST').length).toBe(0);
    expect(screen.getByText(/This is their last role in force/i)).toBeTruthy();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Yes, take it back' }));
    });
    const post = calls.find((c) => c.method === 'POST');
    expect(post?.path).toBe('/v1/role-assignments/ra_1/revoke');
    expect(post?.body['expectedVersion']).toBe(3);
    expect(post?.body['confirmed']).toBe(true);
  });

  it('a role already taken back offers nothing and keeps who took it', async () => {
    stubFetch([
      role({
        assignmentState: 'Revoked',
        revokedAt: '2026-08-05T00:00:00Z',
        revokedByActorId: 'actor_admin',
      }),
    ]);
    await act(async () => {
      render(<AccountsAndRoles session={session} />);
    });
    expect(screen.queryByRole('button', { name: 'Take back this role' })).toBeNull();
    expect(screen.getByText(/taken back by actor_admin/)).toBeTruthy();
    /*
     * The consequence of holding nothing is stated rather than implied.
     *
     * The wording changed with ADR-104. It used to say the platform had no
     * way to stop somebody signing in, which was true of the dev-header
     * stub and is not true now: suspending an account refuses the next
     * sign-in AND kills the session in flight. Leaving the old sentence up
     * would have told an administrator they were powerless over exactly
     * the thing they had just been given power over.
     */
    expect(screen.getByText(/see nothing but their own account/i)).toBeTruthy();
  });
});
