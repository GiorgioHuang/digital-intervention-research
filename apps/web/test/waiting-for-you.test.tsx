import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { WaitingForYou } from '../src/components/WaitingForYou.js';

const session = { actorId: 'actor_a', participantId: 'pt_a' };

const waiting = {
  data: [
    {
      id: 'con_1',
      attributes: {
        contributionId: 'con_1', archiveId: 'ar_1', itemId: 'li_1',
        contentText: 'She always brought soup when anyone was ill.',
        createdAt: '2026-08-01T00:00:00Z',
      },
    },
  ],
};

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
      return new Response(JSON.stringify(method === 'GET' ? body : { data: { id: 'x' } }), { status: 200 });
    }),
  );
  return calls;
}

/**
 * A supporter can propose text into a participant's life story, and
 * `life-story.review-contribution` is owner-only — so the participant is
 * the only person who may decide. Nothing listed what was waiting, which
 * meant someone could write about you, into your story, without you being
 * able to find out.
 */
describe('what is waiting for the participant', () => {
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('shows a proposed contribution with its text, and says only they can decide', async () => {
    const calls = stubFetch(waiting);
    await act(async () => {
      render(<WaitingForYou session={session} />);
    });
    expect(calls[0]?.path).toBe('/v1/participants/pt_a/life-story/contributions/awaiting-review');
    expect(screen.getByText(/She always brought soup/)).toBeTruthy();
    expect(screen.getByText(/Only you can decide this/)).toBeTruthy();
    // Accepting does not turn someone else's account into the
    // participant's own words — the screen says so before the decision.
    expect(screen.getByText(/not as your own words/)).toBeTruthy();
  });

  it('accepting posts the decision and says what it did, in the contributor\'s voice not the participant\'s', async () => {
    const calls = stubFetch(waiting);
    await act(async () => {
      render(<WaitingForYou session={session} />);
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Add this to my story' }));
    });
    const post = calls.find((c) => c.method === 'POST');
    expect(post?.path).toBe('/v1/life-story/contributions/con_1/review');
    expect(post?.body['decision']).toBe('Accepted');
    expect(screen.getByRole('status').textContent).toContain('not as your own words');
  });

  it('declining says plainly that nothing of it enters the story', async () => {
    const calls = stubFetch(waiting);
    await act(async () => {
      render(<WaitingForYou session={session} />);
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Do not add this' }));
    });
    expect(calls.find((c) => c.method === 'POST')?.body['decision']).toBe('Rejected');
    expect(screen.getByRole('status').textContent).toContain('Nothing of it goes into your story');
  });

  it('an empty list says nothing is waiting rather than looking broken', async () => {
    stubFetch({ data: [] });
    await act(async () => {
      render(<WaitingForYou session={session} />);
    });
    expect(screen.getByText('Nothing is waiting for you')).toBeTruthy();
  });
});
