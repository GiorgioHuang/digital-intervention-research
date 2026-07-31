import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { MessagesScreen } from '../src/components/MessagesScreen.js';

const session = { actorId: 'actor_test', participantId: 'pt_a' };

const THREAD = {
  threadId: 'th_1',
  otherParticipantId: 'pt_b',
  basisType: 'ActiveConnection',
  threadState: 'Active',
  createdAt: '2026-07-30T00:00:00Z',
};
const CONNECTION = {
  connectionId: 'conn_1',
  otherParticipantId: 'pt_c',
  connectionState: 'Active',
  createdAt: '2026-07-30T00:00:00Z',
};

function stubFetch() {
  const calls: { path: string; method: string }[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (path: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET';
      calls.push({ path, method });
      if (path.endsWith('/conversation-threads') && method === 'GET') {
        return new Response(JSON.stringify({ data: [{ type: 'ConversationThread', id: THREAD.threadId, attributes: THREAD }] }), { status: 200 });
      }
      if (path.endsWith('/connections')) {
        return new Response(JSON.stringify({ data: [{ type: 'Connection', id: CONNECTION.connectionId, attributes: CONNECTION }] }), { status: 200 });
      }
      return new Response(JSON.stringify({ data: { id: 'th_new' } }), { status: 201 });
    }),
  );
  return calls;
}

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
    render(<MessagesScreen session={session} />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '查看我的会话与联系' }));
    });
    expect(calls.some((c) => c.path === '/v1/participants/pt_a/conversation-threads')).toBe(true);
    expect(calls.some((c) => c.path === '/v1/participants/pt_a/connections')).toBe(true);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /与 pt_b 的会话/ }));
    });
    expect(screen.getByText('写消息')).toBeTruthy();
    expect(screen.getByText('pt_b')).toBeTruthy();
  });

  it('a new conversation starts from an Active connection, not from a typed identifier', async () => {
    const calls = stubFetch();
    render(<MessagesScreen session={session} />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '查看我的会话与联系' }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '开始会话' }));
    });
    const post = calls.find((c) => c.method === 'POST');
    expect(post?.path).toBe('/v1/conversation-threads');
    // The composer opens for the connection's counterpart.
    expect(screen.getByText('写消息')).toBeTruthy();
    expect(screen.getByText('pt_c')).toBeTruthy();
  });
});
