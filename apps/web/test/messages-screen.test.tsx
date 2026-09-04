import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import type { MyRelationship, ThreadSummary } from '../src/api.js';
import { MessagesScreen } from '../src/components/MessagesScreen.js';

const session = { actorId: 'actor_test', participantId: 'pt_a' };

const THREAD: ThreadSummary = {
  threadId: 'th_1',
  otherParticipantId: 'pt_b',
  otherDisplayName: 'Ben',
  basisType: 'ActiveConnection',
  threadState: 'Active',
  createdAt: '2026-07-30T00:00:00Z',
  lastMessageAt: new Date().toISOString(),
  lastMessageState: 'Queued',
  lastMessageFromMe: false,
  lastMessagePreview: 'The roses came out this week.',
};
const CONNECTION = {
  connectionId: 'conn_1',
  otherParticipantId: 'pt_c',
  otherDisplayName: 'Cara',
  connectionState: 'Active',
  createdAt: '2026-07-30T00:00:00Z',
};
/** A supporter who may read what is shared and may NOT send messages. */
const READ_ONLY_SUPPORTER: MyRelationship = {
  relationshipId: 'rel_read',
  relatedActorId: 'usr_reader',
  relatedDisplayName: 'Dorothy',
  relationshipType: 'FamilyMember',
  relationshipState: 'Active',
  permittedActions: ['participant.view-shared'],
  expiresAt: null,
  recordVersion: 2,
  proposedAt: '2026-07-01T00:00:00Z',
};

function stubFetchWith(thread: ThreadSummary, relationships: MyRelationship[] = []) {
  const calls: { path: string; method: string }[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (path: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET';
      calls.push({ path, method });
      const body = (data: unknown) => new Response(JSON.stringify({ data }), { status: 200 });
      if (path.endsWith('/conversation-threads') && method === 'GET') {
        return body([{ type: 'ConversationThread', id: thread.threadId, attributes: thread }]);
      }
      if (path.endsWith('/connections')) {
        return body([{ type: 'Connection', id: CONNECTION.connectionId, attributes: CONNECTION }]);
      }
      if (path.endsWith('/relationships') && method === 'GET') {
        return body(relationships.map((r) => ({ type: 'Relationship', id: r.relationshipId, attributes: r })));
      }
      return new Response(JSON.stringify({ data: { id: 'th_new' } }), { status: 201 });
    }),
  );
  return calls;
}
const stubFetch = () => stubFetchWith(THREAD);
const arrive = async () => {
  await act(async () => {
    render(<MessagesScreen session={session} />);
  });
};

describe('MessagesScreen (the drawing: who, when, and what about)', () => {
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('threads and connections come from owner-scoped queries; opening a thread shows the composer', async () => {
    const calls = stubFetch();
    await arrive();
    // Loaded on arrival: no button stands between a person and their
    // messages.
    expect(calls.some((c) => c.path === '/v1/participants/pt_a/conversation-threads')).toBe(true);
    expect(calls.some((c) => c.path === '/v1/participants/pt_a/connections')).toBe(true);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Ben/ }));
    });
    expect(screen.getByText('Ben')).toBeTruthy();
    // Decision D-12: an internal identifier shown to another participant
    // becomes a handle for correlating them across screens, so it must not
    // appear anywhere on the page — not even beside the name.
    expect(document.body.textContent).not.toContain('pt_b');
  });

  /**
   * The three things the drawing puts on a row. Without them the list
   * could only offer a name and the word "ongoing", which answers none of
   * the questions somebody opens this screen with.
   */
  it('a conversation row says who, when it was last written in, and what was said', async () => {
    stubFetch();
    await arrive();
    const row = screen.getByRole('button', { name: /Ben/ });
    expect(row.textContent).toContain('Ben');
    expect(row.textContent).toContain('Today');
    expect(row.textContent).toContain('The roses came out this week.');
  });

  /**
   * The server withholds the words of anything nobody has said. The row
   * then has to say something: a blank second line reads as a fault in
   * the page, and an unsent draft of one's own is a thing somebody might
   * want to go back and finish.
   */
  it('words the absence when the server withheld the last message', async () => {
    stubFetchWith({
      ...THREAD,
      threadId: 'th_draft',
      lastMessageState: 'Draft',
      lastMessageFromMe: true,
      lastMessagePreview: null,
    });
    await arrive();
    const row = screen.getByRole('button', { name: /Ben/ });
    expect(row.textContent).toMatch(/have not sent it/);
    expect(row.textContent).not.toContain('roses');
  });

  /**
   * The reason a person is reachable is the whole permission story
   * (ADR-031: a thread exists only on a CommunicationBasis). It is stated
   * where the conversation is rather than on the list, which is scanned:
   * the explanation belongs beside the writing.
   */
  it('every conversation says why the two may write to each other, on the conversation', async () => {
    stubFetch();
    await arrive();
    // Not a paragraph under every row on the list.
    expect(screen.queryByText(/Why you can write to each other/)).toBeNull();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Ben/ }));
    });
    expect(screen.getByText(/you and this person both agreed to connect/)).toBeTruthy();
  });

  /**
   * A thread that can no longer be written to says so on the row. The
   * alternative — letting someone open it, compose, and be refused at the
   * end — spends their effort before telling them.
   */
  it('a conversation that can no longer be written to says so before it is opened', async () => {
    stubFetchWith({ ...THREAD, threadId: 'th_2', threadState: 'Expired' });
    await arrive();
    expect(screen.getByRole('button', { name: /Ben/ }).textContent).toContain('Ended');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Ben/ }));
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
    stubFetchWith({
      ...THREAD,
      threadId: 'th_3',
      otherDisplayName: null as unknown as string,
      basisType: 'AuthorisedRelationship',
    });
    await arrive();
    expect(screen.getByRole('button', { name: /Someone whose name is missing/ })).toBeTruthy();
    expect(document.body.textContent).not.toContain('A community member');
  });

  it('a new conversation starts from an Active connection, not from a typed identifier', async () => {
    const calls = stubFetch();
    await arrive();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Write a message' }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Write to Cara' }));
    });
    const post = calls.find((c) => c.method === 'POST');
    expect(post?.path).toBe('/v1/conversation-threads');
    // The composer opens for the connection's counterpart, named.
    expect(screen.getByText('Cara')).toBeTruthy();
    expect(document.body.textContent).not.toContain('pt_c');
  });

  /**
   * Being trusted to read what somebody shares is not being allowed to
   * write to them (D-29). The server refuses the difference, so the
   * screen must not offer it: a "Write to Dorothy" that always fails
   * spends somebody's effort to tell them no.
   */
  it('does not offer to write to a supporter whose approval does not allow messages', async () => {
    stubFetchWith(THREAD, [
      READ_ONLY_SUPPORTER,
      { ...READ_ONLY_SUPPORTER, relationshipId: 'rel_msg', relatedActorId: 'usr_writer', relatedDisplayName: 'Edith', permittedActions: ['participant.view-shared', 'relationship.message'] },
    ]);
    await arrive();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Write a message' }));
    });
    // The one who was allowed to send messages is offered; the one who
    // was not is absent, not disabled — a control that cannot work is not
    // shown at all.
    expect(screen.getByRole('button', { name: 'Write to Edith' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Write to Dorothy' })).toBeNull();
  });

  /**
   * Ending a connection lives here because this is the only screen that
   * lists connections. Until it existed the only way out of one was to
   * block, and an ordinary parting had to be dressed up as an accusation.
   */
  it('keeps the way out of a connection, and keeps it apart from blocking', async () => {
    stubFetch();
    await arrive();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Who I am connected to' }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'End this connection' }));
    });
    expect(screen.getByText(/This is not the same as blocking/)).toBeTruthy();
  });
});
