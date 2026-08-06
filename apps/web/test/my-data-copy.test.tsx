import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { MyDataCopy } from '../src/components/MyDataCopy.js';

const session = { actorId: 'actor_a', participantId: 'pt_a' };

const request = (state: string) => ({
  data: [
    {
      id: 'exr_1',
      attributes: {
        exportRequestId: 'exr_1',
        purpose: 'A copy of my own information, requested by me',
        requestState: state,
        createdAt: '2026-08-01T00:00:00Z',
        updatedAt: '2026-08-02T00:00:00Z',
      },
    },
  ],
});

function stubFetch(body: unknown) {
  const calls: { path: string; method: string; body: Record<string, unknown> }[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (path: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET';
      calls.push({
        path,
        method,
        body: method === 'GET' ? {} : (JSON.parse(init!.body as string) as Record<string, unknown>),
      });
      return new Response(JSON.stringify(method === 'GET' ? body : { data: { id: 'exr_1' } }), { status: 200 });
    }),
  );
  return calls;
}

/**
 * The right to a copy of your own information existed on the server and
 * nowhere a participant could reach. These pin down the two things that
 * make it a real right rather than a button: it does not ask why, and it
 * reports honestly what happened to the request instead of leaving a
 * rejection looking like silence.
 */
describe('asking for a copy of my information', () => {
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('asks without requiring a reason, and does not promise delivery', async () => {
    const calls = stubFetch({ data: [] });
    await act(async () => {
      render(<MyDataCopy session={session} />);
    });
    expect(calls[0]?.path).toBe('/v1/participants/pt_a/export-requests');
    expect(screen.getByText(/You do not have to say why/)).toBeTruthy();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Ask for a copy of my information' }));
    });
    // The confirmation says what this is and what it is not.
    expect(screen.getByText(/This is a request, not a download/)).toBeTruthy();
    expect(screen.getByText(/will not let the person who asked be the person who agrees/)).toBeTruthy();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Yes, ask for a copy' }));
    });
    const post = calls.find((c) => c.method === 'POST');
    expect(post?.path).toBe('/v1/participants/pt_a/export-requests');
    expect(post?.body['confirmed']).toBe(true);
  });

  it('a refusal is stated, not left looking like silence', async () => {
    stubFetch(request('Rejected'));
    await act(async () => {
      render(<MyDataCopy session={session} />);
    });
    expect(screen.getByText(/Not agreed to/)).toBeTruthy();
    // Settled, so asking again is offered rather than blocked.
    expect(screen.getByRole('button', { name: 'Ask for a copy of my information' })).toBeTruthy();
  });

  it('an agreed request does not claim the copy exists or has been sent', async () => {
    stubFetch(request('Approved'));
    await act(async () => {
      render(<MyDataCopy session={session} />);
    });
    expect(screen.getByText(/Nothing has been gathered yet/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Ask for a copy of my information' })).toBeNull();
    expect(screen.getByText(/Asking again would not make it any faster/)).toBeTruthy();
  });

  /**
   * The screen used to say "the copy has been put together", describing a
   * step nothing performs: the command writes a record of what may be
   * shared and reads no data at all. Somebody told their copy existed
   * would be waiting for a file this platform was never going to make.
   */
  it('does not tell the participant a copy of their information exists', async () => {
    stubFetch(request('Generated'));
    await act(async () => {
      render(<MyDataCopy session={session} />);
    });
    expect(screen.getByText(/written down exactly what may be shared with you/i)).toBeTruthy();
    expect(screen.getByText(/this platform does not do that part/i)).toBeTruthy();
    expect(document.body.textContent).not.toContain('put together');
  });

  /**
   * And "the copy has been sent to you" would have somebody checking an
   * inbox for something nothing here sends. It is one person's account of
   * what they did, which is worth saying and is not proof.
   */
  it('a recorded hand-over is somebody’s account, not proof it arrived', async () => {
    stubFetch(request('Delivered'));
    await act(async () => {
      render(<MyDataCopy session={session} />);
    });
    expect(screen.getByText(/If nothing has reached you, say so/i)).toBeTruthy();
    expect(document.body.textContent).not.toContain('has been sent to you');
  });
});
