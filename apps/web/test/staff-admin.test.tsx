import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { StaffAdminPanel } from '../src/components/StaffAdminPanel.js';

const session = { actorId: 'actor_admin', authStrength: 'mfa' as const, organisationId: 'org_1' };

/**
 * Path-aware, because this panel also holds the accounts-and-roles
 * section now and answering every GET with the participant list would
 * hand it a payload the API never produces.
 */
function stubFetch(body: unknown, status = 200) {
  const calls: { path: string; headers: Record<string, string> }[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (path: string, init?: RequestInit) => {
      calls.push({ path, headers: (init?.headers ?? {}) as Record<string, string> });
      if (path.includes('/v1/user-accounts')) return new Response(JSON.stringify({ data: [] }), { status: 200 });
      return new Response(JSON.stringify(body), { status });
    }),
  );
  return calls;
}

const ROW = {
  data: [
    {
      type: 'Participant',
      id: 'pt_1',
      attributes: {
        participantId: 'pt_1',
        displayName: 'Ann',
        participantState: 'Active',
        userAccountId: 'actor_ann',
        registeredAt: '2026-07-30T00:00:00Z',
      },
    },
  ],
};

/**
 * Decision D-13. The risk this screen has to avoid is not "an admin sees
 * too much" — it is that a scoped listing quietly becomes an existence
 * oracle.
 */
describe('administrative participant list', () => {
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('lists the organisation from the session and never takes an identifier to look up', async () => {
    const calls = stubFetch(ROW);
    await act(async () => {
      render(<StaffAdminPanel session={session} />);
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Show the participant list' }));
    });

    // Targeted rather than positional: the accounts-and-roles section on
    // this panel loads on mount, so it is not the first call any more.
    const listing = calls.find((c) => c.path.startsWith('/v1/participants'));
    expect(listing?.path).toBe('/v1/participants');
    // The organisation travels in the context, not the URL: a
    // caller-supplied organisation would probe which ones exist.
    expect(listing?.path).not.toContain('org_1');
    expect(listing?.headers['x-organisation-id']).toBe('org_1');
    // The permission requires this purpose; asserting it here keeps the
    // client from silently dropping it and getting a confusing denial.
    expect(listing?.headers['x-purpose-code']).toBe('platform-administration');

    expect(screen.getByText('Ann')).toBeTruthy();
    /*
     * No free-text field exists that could be used to test an identifier.
     *
     * This used to assert that the panel had NO textbox at all, which was
     * a fair proxy while it had none. The invite form on the accounts
     * section beside it has two, so the assertion is now made against what
     * it was always about: nothing here takes a participant or account
     * identifier and tells you whether it exists. The invite fields are a
     * person's name and the address to invite them at — neither is looked
     * up, and both are refused or recorded regardless of who exists.
     */
    const textboxes = screen.queryAllByRole('textbox').map((el) => el.getAttribute('id'));
    expect(textboxes.sort()).toEqual(['invite-email', 'invite-name']);
  });

  it('says what the list is not, so it is not read as a complete roll', async () => {
    stubFetch(ROW);
    await act(async () => {
      render(<StaffAdminPanel session={session} />);
    });
    // A participant without a platform account has no organisation to be
    // scoped by, and the screen admits it rather than implying completeness.
    expect(screen.getByText(/not a complete roll/)).toBeTruthy();
    expect(screen.getByText(/Nothing here shows what anyone is enrolled in/)).toBeTruthy();
  });

  it('without an organisation it offers no list at all rather than an unscoped one', async () => {
    const calls = stubFetch(ROW);
    await act(async () => {
      render(<StaffAdminPanel session={{ actorId: 'actor_admin', authStrength: 'mfa' }} />);
    });
    // Both sections decline, and neither asks the server for an unscoped
    // listing it would refuse anyway.
    expect(screen.getAllByRole('alert').some((a) => (a.textContent ?? '').includes('without an organisation'))).toBe(
      true,
    );
    expect(screen.queryByRole('button', { name: 'Show the participant list' })).toBeNull();
    expect(calls.length).toBe(0);
  });

  it('a refused listing explains the refusal without inventing a reason', async () => {
    stubFetch(
      { error: { code: 'AUTHORISATION_DENIED', message: 'denied', requestId: 'r', retryable: false } },
      403,
    );
    await act(async () => {
      render(<StaffAdminPanel session={session} />);
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Show the participant list' }));
    });
    const status = screen.getAllByRole('status').map((n) => n.textContent ?? '').join(' ');
    expect(status).toContain('Could not load the participant list');
    expect(status).toContain('Nothing changed');
    // Separation of duties is about deciding, not about reading a list.
    expect(status).not.toContain('separation of duties');
  });
});
