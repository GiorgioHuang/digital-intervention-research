import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { StaffAdminPanel } from '../src/components/StaffAdminPanel.js';

const session = { actorId: 'actor_admin', authStrength: 'mfa' as const, organisationId: 'org_1' };

function stubFetch(body: unknown, status = 200) {
  const calls: { path: string; headers: Record<string, string> }[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (path: string, init?: RequestInit) => {
      calls.push({ path, headers: (init?.headers ?? {}) as Record<string, string> });
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

    expect(calls[0]?.path).toBe('/v1/participants');
    // The organisation travels in the context, not the URL: a
    // caller-supplied organisation would probe which ones exist.
    expect(calls[0]?.path).not.toContain('org_1');
    expect(calls[0]?.headers['x-organisation-id']).toBe('org_1');
    // The permission requires this purpose; asserting it here keeps the
    // client from silently dropping it and getting a confusing denial.
    expect(calls[0]?.headers['x-purpose-code']).toBe('platform-administration');

    expect(screen.getByText('Ann')).toBeTruthy();
    // No free-text field exists that could be used to test an identifier.
    expect(screen.queryByRole('textbox')).toBeNull();
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
    expect(screen.getByRole('alert').textContent).toContain('without an organisation');
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
    const status = screen.getByRole('status').textContent ?? '';
    expect(status).toContain('Could not load the participant list');
    expect(status).toContain('Nothing changed');
    // Separation of duties is about deciding, not about reading a list.
    expect(status).not.toContain('separation of duties');
  });
});
