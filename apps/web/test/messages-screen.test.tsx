import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { MessagesScreen } from '../src/components/MessagesScreen.js';

const session = { actorId: 'actor_test', participantId: 'pt_a' };

const THREAD = {
  threadId: 'th_1',
  otherParticipantId: 'pt_b',
  otherDisplayName: 'Ben',
  basisType: 'ActiveConnection',
  threadState: 'Active',
  createdAt: '2026-07-30T00:00:00Z',
};
const CONNECTION = {
  connectionId: 'conn_1',
  otherParticipantId: 'pt_c',
  otherDisplayName: 'Cara',
  connectionState: 'Active',
  createdAt: '2026-07-30T00:00:00Z',
};

function stubFetchWith(thread: typeof THREAD) {
  const calls: { path: string; method: string }[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (path: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET';
      calls.push({ path, method });
      if (path.endsWith('/conversation-threads') && method === 'GET') {
        return new Response(JSON.stringify({ data: [{ type: 'ConversationThread', id: thread.threadId, attributes: thread }] }), { status: 200 });
      }
      if (path.endsWith('/connections')) {
        return new Response(JSON.stringify({ data: [{ type: 'Connection', id: CONNECTION.connectionId, attributes: CONNECTION }] }), { status: 200 });
      }
      return new Response(JSON.stringify({ data: { id: 'th_new' } }), { status: 201 });
    }),
  );
  return calls;
}
const stubFetch = () => stubFetchWith(THREAD);

describe('MessagesScreen (API-driven lists replace manual identifiers)', () => {
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('threads and connections come from owner-scoped queries; opening a thread shows the composer', async () => {
    const calls = stubFetch();
    await act(async () => {
      render(<MessagesScreen session={session} />);
    });
    // Loaded on arrival: no button stands between a person and their
    // messages.
    expect(calls.some((c) => c.path === '/v1/participants/pt_a/conversation-threads')).toBe(true);
    expect(calls.some((c) => c.path === '/v1/participants/pt_a/connections')).toBe(true);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Conversation with Ben/ }));
    });
    expect(screen.getByText('Write a message')).toBeTruthy();
    expect(screen.getByText('Ben')).toBeTruthy();
    // Decision D-12: an internal identifier shown to another participant
    // becomes a handle for correlating them across screens, so it must not
    // appear anywhere on the page — not even beside the name.
    expect(document.body.textContent).not.toContain('pt_b');
  });

  /**
   * The reason a person is reachable is the whole permission story
   * (ADR-031: a thread exists only on a CommunicationBasis). A
   * participant who cannot see it has no way to understand why one person
   * can be written to and another cannot, or what would end that.
   */
  it('every conversation says why the two may write to each other', async () => {
    stubFetch();
    await act(async () => {
      render(<MessagesScreen session={session} />);
    });
    expect(screen.getByText(/Why you can write to each other: you and this person both agreed to connect/)).toBeTruthy();
  });

  /**
   * A thread that can no longer be written to says so on the row. The
   * alternative — letting someone open it, compose, and be refused at the
   * end — spends their effort before telling them.
   */
  it('a conversation that can no longer be written to says so before it is opened', async () => {
    cleanup();
    vi.unstubAllGlobals();
    stubFetchWith({ ...THREAD, threadId: 'th_2', threadState: 'Expired' });
    await act(async () => {
      render(<MessagesScreen session={session} />);
    });
    expect(screen.getByText(/The reason this conversation was possible has ended/)).toBeTruthy();
  });

  /**
   * A name the server could not resolve is said to be missing, not
   * papered over. Every unnamed person on this list used to become "A
   * community member" — a description written for an unidentifiable
   * stranger in a community space, and identical for everybody on
   * purpose. Applied to an approved supporter it was wrong twice: they
   * are not a community member, and a participant with two supporters got
   * two rows they could not tell apart.
   */
  it('says a name is missing rather than describing someone it cannot name', async () => {
    cleanup();
    vi.unstubAllGlobals();
    stubFetchWith({
      ...THREAD,
      threadId: 'th_3',
      otherDisplayName: null as unknown as string,
      basisType: 'AuthorisedRelationship',
    });
    await act(async () => {
      render(<MessagesScreen session={session} />);
    });
    expect(screen.getByRole('button', { name: /Conversation with Someone whose name is missing/ })).toBeTruthy();
    expect(document.body.textContent).not.toContain('A community member');
    // The basis is still stated: the participant approved this person, and
    // that is why the conversation exists at all.
    expect(screen.getByText(/you approved this person as a supporter/)).toBeTruthy();
  });

  it('a new conversation starts from an Active connection, not from a typed identifier', async () => {
    const calls = stubFetch();
    await act(async () => {
      render(<MessagesScreen session={session} />);
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Start a conversation' }));
    });
    const post = calls.find((c) => c.method === 'POST');
    expect(post?.path).toBe('/v1/conversation-threads');
    // The composer opens for the connection's counterpart, named.
    expect(screen.getByText('Write a message')).toBeTruthy();
    expect(screen.getByText('Cara')).toBeTruthy();
    expect(document.body.textContent).not.toContain('pt_c');
  });
});
