import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { CommunityPanel } from '../src/components/CommunityPanel.js';
import { MessagesScreen } from '../src/components/MessagesScreen.js';

const session = { actorId: 'actor_test', participantId: 'pt_a' };

/**
 * You could join a community and connect to someone, and never leave
 * either: 'Ended' and 'Disconnected' were in the CHECK constraints from
 * the start and nothing could write them. The only exit from a connection
 * was to block, which is a safety act — so an ordinary parting had to be
 * dressed up as an accusation.
 */
function stubFetch(routes: Record<string, unknown>) {
  const calls: { path: string; method: string; body: Record<string, unknown> | undefined }[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (path: string, init?: RequestInit) => {
      calls.push({
        path,
        method: init?.method ?? 'GET',
        body: typeof init?.body === 'string' ? (JSON.parse(init.body) as Record<string, unknown>) : undefined,
      });
      const hit = Object.entries(routes).find(([prefix]) => path.startsWith(prefix));
      return new Response(JSON.stringify(hit === undefined ? { data: [] } : hit[1]), { status: 200 });
    }),
  );
  return calls;
}

const SPACES = {
  '/v1/participants/pt_a/community-spaces': {
    data: [
      {
        type: 'CommunitySpace',
        id: 'cs_1',
        attributes: {
          spaceId: 'cs_1',
          name: 'Gardening Corner',
          ruleVersionId: 'crv_1',
          ruleVersionNumber: 2,
          rulesText: 'Be kind.',
          membershipState: 'Active',
        },
      },
    ],
  },
};

const CONNECTIONS = {
  '/v1/participants/pt_a/connections': {
    data: [
      {
        type: 'Connection',
        id: 'conn_1',
        attributes: {
          connectionId: 'conn_1',
          otherParticipantId: 'pt_b',
          otherDisplayName: 'Ben',
          connectionState: 'Active',
          createdAt: '2026-08-01T02:00:00Z',
        },
      },
    ],
  },
};

describe('leaving a community', () => {
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('offers a way out, and says what leaving does and does not do', async () => {
    const calls = stubFetch(SPACES);
    await act(async () => {
      render(<CommunityPanel session={session} />);
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Leave "Gardening Corner"' }));
    });
    // Not erasure — saying otherwise would be the opposite mistake from
    // the one this fixes.
    expect(screen.getByText(/leaving does not delete it/)).toBeTruthy();
    expect(screen.getByText(/You can join again later/)).toBeTruthy();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Yes, leave this community' }));
    });
    const posted = calls.find((c) => c.method === 'POST');
    expect(posted?.path).toBe('/v1/community-spaces/cs_1/leave');
    expect(posted?.body).toMatchObject({ participantId: 'pt_a', confirmed: true });
  });

  it('leaving is confirmed first — nothing is sent on the first press', async () => {
    const calls = stubFetch(SPACES);
    await act(async () => {
      render(<CommunityPanel session={session} />);
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Leave "Gardening Corner"' }));
    });
    expect(calls.some((c) => c.method === 'POST')).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: 'Go back' }));
    expect(screen.queryByRole('button', { name: 'Yes, leave this community' })).toBeNull();
  });
});

describe('ending a connection', () => {
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  /**
   * The distinction that matters: blocking says something about the other
   * person, ending a connection says only that this pairing is over.
   */
  it('says plainly that it is not blocking, and where blocking lives instead', async () => {
    stubFetch(CONNECTIONS);
    await act(async () => {
      render(<MessagesScreen session={session} />);
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'End this connection' }));
    });
    expect(screen.getByText(/This is not the same as blocking/)).toBeTruthy();
    expect(screen.getByText(/for when someone is troubling you/)).toBeTruthy();
  });

  it('says what happens to the conversations, and that the other person is not told', async () => {
    stubFetch(CONNECTIONS);
    await act(async () => {
      render(<MessagesScreen session={session} />);
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'End this connection' }));
    });
    expect(screen.getByText(/Nothing you have already written is deleted/)).toBeTruthy();
    // Withdrawing quietly is part of what makes it safe to do.
    expect(screen.getByText(/is not told that you did this/)).toBeTruthy();
  });

  it('ends the connection when confirmed', async () => {
    const calls = stubFetch(CONNECTIONS);
    await act(async () => {
      render(<MessagesScreen session={session} />);
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'End this connection' }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Yes, end this connection' }));
    });
    const posted = calls.find((c) => c.method === 'POST');
    expect(posted?.path).toBe('/v1/connections/conn_1/end');
    expect(posted?.body).toMatchObject({ participantId: 'pt_a', confirmed: true });
  });
});
