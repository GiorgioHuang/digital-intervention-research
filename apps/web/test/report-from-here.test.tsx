import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { OtherPeoplesStories } from '../src/components/OtherPeoplesStories.js';
import { MessagesScreen } from '../src/components/MessagesScreen.js';
import type { SharedStoryPiece, ThreadSummary } from '../src/api.js';

const session = { actorId: 'actor_a', participantId: 'pt_a' };

/**
 * Reporting and blocking are offered where you meet somebody, and there
 * is nothing to type (owner, 2026-09-06).
 *
 * They used to live on Help, behind a field asking for the other
 * person's internal identifier — which nobody can know and no screen
 * anywhere offers to copy, so both controls were unusable by the person
 * they were for (B-35). This is the same defect the messages screen had
 * before connections came from the API, and the same one D-12 removed
 * from the naming path.
 */
function calls() {
  const seen: { path: string; method: string; body: Record<string, unknown> | undefined }[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (path: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET';
      seen.push({
        path,
        method,
        body: typeof init?.body === 'string' ? (JSON.parse(init.body) as Record<string, unknown>) : undefined,
      });
      if (method !== 'GET') {
        return new Response(JSON.stringify({ data: { id: 'x', meta: { moderationCaseId: 'mc_1' } } }), {
          status: 201,
        });
      }
      if (path.endsWith('/conversation-threads')) {
        return new Response(JSON.stringify({ data: [{ id: THREAD.threadId, attributes: THREAD }] }), { status: 200 });
      }
      return new Response(JSON.stringify({ data: [], meta: {} }), { status: 200 });
    }),
  );
  return seen;
}

const PIECE: SharedStoryPiece = {
  itemId: 'lsi_1',
  title: 'The winter we moved',
  contentText: 'The lorry could not get up the hill.',
  sourceType: 'ParticipantAuthored',
  testimonyState: 'ParticipantTestimony',
  updatedAt: '2026-06-02T00:00:00Z',
  ownerParticipantId: 'pt_mum',
  ownerDisplayName: 'Margaret',
  ownerCity: null,
  mine: false,
};

const THREAD: ThreadSummary = {
  threadId: 'th_1',
  otherParticipantId: 'pt_b',
  otherDisplayName: 'Ben',
  basisType: 'ActiveConnection',
  threadState: 'Active',
  createdAt: '2026-07-30T00:00:00Z',
  lastMessageAt: null,
  lastMessageState: null,
  lastMessageFromMe: null,
  lastMessagePreview: null,
};

beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('reporting a piece of somebody’s story, from the piece', () => {
  const openPiece = async (piece: SharedStoryPiece = PIECE) => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ data: [{ id: piece.itemId, attributes: piece }] }), { status: 200 })),
    );
    await act(async () => {
      render(<OtherPeoplesStories session={session} onGoToMyStory={() => undefined} />);
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /The winter we moved/ }));
    });
  };

  it('offers it on the piece, and asks nothing to be typed', async () => {
    await openPiece();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Report this' }));
    });
    expect(screen.getByRole('heading', { level: 1, name: 'Report Margaret' })).toBeTruthy();
    // No identifier field anywhere: who is being reported came from the
    // piece that was open.
    expect(document.querySelectorAll('input').length).toBe(0);
  });

  /**
   * The report names the MEMORY, not its author. `submitUserReport`
   * already resolves the subject from a post for the reason written
   * beside it — a reporter naming both could open a case against the
   * wrong person on their own say-so — and a report from the feed had no
   * such path (D-107).
   */
  it('names the memory and lets the server work out whose it is', async () => {
    await openPiece();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Report this' }));
    });
    const seen = calls();
    fireEvent.click(screen.getByRole('radio', { name: /unkind or upsetting/ }));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Send this to the study office' }));
    });
    const post = seen.find((c) => c.method === 'POST');
    expect(post?.path).toBe('/v1/reports');
    expect(post?.body?.['reportedLifeStoryItemId']).toBe('lsi_1');
    expect(post?.body?.['category']).toBe('harassment');
    // The author is not sent as the subject: this screen does not get to
    // say who a case is opened against.
    expect(post?.body?.['reportedActorId']).toBe('');
  });

  /** The words are optional, as the drawing says; the reason is not. */
  it('will not send without a reason, and will send without words', async () => {
    await openPiece();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Report this' }));
    });
    const send = screen.getByRole('button', { name: 'Send this to the study office' }) as HTMLButtonElement;
    expect(send.disabled).toBe(true);
    const seen = calls();
    fireEvent.click(screen.getByRole('radio', { name: /Something else/ }));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Send this to the study office' }));
    });
    expect(seen.find((c) => c.method === 'POST')?.body?.['description']).toBe('');
  });

  /**
   * Not on your own piece. The server resolves the subject from the
   * memory, so reporting your own would open a case against yourself —
   * a control that can do nothing useful is not offered.
   */
  it('is not offered on the reader’s own piece', async () => {
    await openPiece({ ...PIECE, mine: true });
    expect(screen.queryByRole('button', { name: 'Report this' })).toBeNull();
  });

  /**
   * Blocking is not offered from a piece: the feed hands this screen a
   * participant to name, not one to act on, and "hide this person" from
   * a memory would be a block placed on somebody the reader may never
   * have spoken to. It is offered in the conversation, where it is.
   */
  it('does not offer to block from a piece', async () => {
    await openPiece();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Report this' }));
    });
    expect(screen.queryByRole('button', { name: /hide this person/ })).toBeNull();
  });
});

describe('reporting and blocking the person you are talking to', () => {
  const openConversation = async () => {
    calls();
    await act(async () => {
      render(<MessagesScreen session={session} />);
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Ben/ }));
    });
  };

  it('is offered at the foot of the conversation, with nothing to type', async () => {
    await openConversation();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Report Ben' }));
    });
    expect(screen.getByRole('heading', { level: 1, name: 'Report Ben' })).toBeTruthy();
    expect(document.querySelectorAll('input').length).toBe(0);
  });

  /**
   * The drawing has one button that reports and hides in a single press.
   * A block is confirmation-tier here, and the confirmation is what says
   * what a block DOES — a label cannot carry it. So it asks, and backing
   * out sends nothing at all.
   */
  it('asks before blocking, and backing out sends neither the report nor the block', async () => {
    await openConversation();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Report Ben' }));
    });
    const seen = calls();
    fireEvent.click(screen.getByRole('radio', { name: /unkind or upsetting/ }));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Send it, and hide this person from me' }));
    });
    expect(screen.getByRole('alertdialog').textContent).toMatch(/not appear in each other/);
    expect(seen.some((c) => c.method === 'POST')).toBe(false);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Go back' }));
    });
    expect(seen.some((c) => c.method === 'POST')).toBe(false);
  });

  it('sends the report and the block, in that order, on one confirmed answer', async () => {
    await openConversation();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Report Ben' }));
    });
    const seen = calls();
    fireEvent.click(screen.getByRole('radio', { name: /trying to trick me/ }));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Send it, and hide this person from me' }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Yes, send it and block Ben' }));
    });
    const posts = seen.filter((c) => c.method === 'POST');
    expect(posts.map((p) => p.path)).toEqual(['/v1/reports', '/v1/blocks']);
    // The CONVERSATION is named, and the server works out who the other
    // party is — this screen does not get to say who a case is opened
    // against (B-36).
    expect(posts[0]?.body?.['reportedThreadId']).toBe('th_1');
    expect(posts[0]?.body?.['reportedActorId']).toBe('');
    expect(posts[0]?.body?.['category']).toBe('scam');
    // Blocking is the one that does name somebody, and should: it is a
    // decision about your own screens with no authority over them.
    expect(posts[1]?.body?.['blockedActorId']).toBe('pt_b');
    expect(posts[1]?.body?.['confirmed']).toBe(true);
    // And it says both things happened, rather than only the report.
    expect(screen.getByText(/Ben is blocked as well/)).toBeTruthy();
  });
});
