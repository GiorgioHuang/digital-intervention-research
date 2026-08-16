import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { SupporterApp } from '../src/SupporterApp.js';


/**
 * A supporter had no way to learn who they support or on what terms, and
 * the contribution form asked for an archive identifier they could only
 * have been told out of band — so the whole path was unusable by anyone
 * who had not been handed an internal id.
 */
const supported = (over: Record<string, unknown> = {}) => ({
  type: 'Relationship',
  id: 'rel_1',
  attributes: {
    relationshipId: 'rel_1',
    participantId: 'pt_a',
    participantDisplayName: 'Pat Petrova',
    relationshipType: 'FamilyMember',
    relationshipState: 'Active',
    permittedActions: ['participant.view-shared', 'life-story.contribute'],
    expiresAt: null,
    ...over,
  },
});

function stubSupporterFetch(
  opts: {
    people?: unknown[];
    archiveId?: string | null;
    contributions?: unknown[];
    threads?: unknown[];
    messages?: unknown[];
  } = {},
) {
  const calls: { path: string; body?: Record<string, unknown> }[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (path: string, init?: RequestInit) => {
      calls.push({
        path,
        ...(init?.body === undefined ? {} : { body: JSON.parse(init.body as string) as Record<string, unknown> }),
      });
      if (path === '/v1/relationships/mine') {
        return new Response(JSON.stringify({ data: opts.people ?? [supported()] }), { status: 200 });
      }
      if (path.endsWith('/life-story/archive-for-contribution')) {
        return new Response(
          JSON.stringify({ data: { id: opts.archiveId === undefined ? 'arc_1' : opts.archiveId } }),
          { status: 200 },
        );
      }
      if (path === '/v1/conversation-threads/mine') {
        return new Response(JSON.stringify({ data: opts.threads ?? [] }), { status: 200 });
      }
      if (path.includes('/messages')) {
        return new Response(JSON.stringify({ data: opts.messages ?? [] }), { status: 200 });
      }
      if (path === '/v1/life-story/contributions/mine') {
        return new Response(JSON.stringify({ data: opts.contributions ?? [] }), { status: 200 });
      }
      return new Response(JSON.stringify({ data: { id: 'x' } }), { status: 201 });
    }),
  );
  return calls;
}

async function signIn() {
  render(<SupporterApp onExit={() => undefined} />);
  fireEvent.change(screen.getByLabelText(/Account identifier/), { target: { value: 'actor_sup' } });
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
  });
}

describe('supporter workspace (contribution ≠ testimony)', () => {
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('states the participant decides; accepted contributions are labelled as contributions, never testimony', async () => {
    stubSupporterFetch({
      contributions: [
        {
          type: 'LifeStoryContribution',
          id: 'ctr_1',
          attributes: {
            contributionId: 'ctr_1',
            archiveId: 'arc_1',
            contentText: 'I remember the garden that year',
            contributionState: 'Accepted',
          },
        },
      ],
    });
    render(<SupporterApp onExit={() => undefined} />);
    // Honest framing before login: the participant decides.
    expect(screen.getByText(/always their\s+decision/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText(/Account identifier/), { target: { value: 'actor_sup' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'View my contributions' }));
    });
    /**
     * The accepted state is truthful: a supporter contribution, never the
     * participant's own testimony. That fact used to ride inside a
     * parenthesis on the "Accepted" label, and a parenthesis is a signal
     * to skip — the wrong signal for the distinction the whole
     * three-state authorship model rests on. It is a field of its own now
     * (C-7), so this asserts both halves: the state reads plainly, and
     * the authorship fact stands on its own line.
     */
    expect(screen.getByText('State: Accepted')).toBeTruthy();
    expect(screen.getByText(/Is this the person’s own testimony: no/)).toBeTruthy();
  });

  it('names who they support and what the access allows, without dotted action keys', async () => {
    const calls = stubSupporterFetch();
    await signIn();
    expect(calls[0]?.path).toBe('/v1/relationships/mine');
    expect(screen.getByRole('heading', { name: 'Pat Petrova' })).toBeTruthy();
    expect(screen.getByText('They agreed to this.')).toBeTruthy();
    expect(screen.queryByText('life-story.contribute')).toBeNull();
    expect(screen.getByText(/Offer something for their life story, which only they can accept/)).toBeTruthy();
    // Consent is the participant's and is deliberately not reported here.
    expect(screen.getByText(/their\s+consent choices, which are theirs and are not shown here/)).toBeTruthy();
  });

  it('a relationship they have not decided on offers no way to write to them', async () => {
    stubSupporterFetch({ people: [supported({ relationshipState: 'PendingVerification' })] });
    await signIn();
    expect(screen.getByText('They have not decided yet.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Offer something for their life story' })).toBeNull();
  });

  it('finds where a contribution goes instead of asking for an identifier', async () => {
    const calls = stubSupporterFetch();
    await signIn();
    // The identifier the form used to demand is gone from the screen.
    expect(screen.queryByLabelText('Archive identifier')).toBeNull();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Offer something for their life story' }));
    });
    expect(calls.some((c) => c.path === '/v1/participants/pt_a/life-story/archive-for-contribution')).toBe(true);
    await act(async () => {
      fireEvent.change(screen.getByLabelText('What you would like to add'), { target: { value: 'An extra detail' } });
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Submit contribution' }));
    });
    const post = calls.find((c) => c.body !== undefined);
    expect(post?.path).toBe('/v1/life-story/archives/arc_1/contributions');
    expect(post?.body?.['contentText']).toBe('An extra detail');
  });

  it('says plainly when there is no life story to add to, rather than offering an empty form', async () => {
    stubSupporterFetch({ archiveId: null });
    await signIn();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Offer something for their life story' }));
    });
    expect(screen.getByText(/have not started a life story yet/)).toBeTruthy();
    expect(screen.queryByLabelText('What you would like to add')).toBeNull();
  });

  /**
   * A refused proposal must not explain itself.
   *
   * This test used to assert the opposite — that the refusal named the two
   * prerequisites, the approved relationship and the supporter-contribution
   * consent. That reads as helpful and is a privacy leak (C-1): a 404 here
   * is the permission engine's DenyAndHideExistence (ADR-050), whose whole
   * point is that its causes are indistinguishable, and whether a
   * participant consented to supporter contributions is a decision they
   * make *about their supporter*.
   *
   * It is also legible over time, which is the part that makes it worse
   * than a single disclosure: a supporter who watches the sentence stop
   * appearing learns the moment consent was granted, and one who watches
   * it start learns the moment it was withdrawn. So the assertions below
   * are negative — they name the phrases that must never come back — plus
   * one positive one, that the refusal still points somewhere real.
   */
  it('a refused proposal says nothing about the participant’s consent or relationship decisions', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (path: string) => {
        if (path === '/v1/relationships/mine') {
          return new Response(JSON.stringify({ data: [supported()] }), { status: 200 });
        }
        if (path.endsWith('/life-story/archive-for-contribution')) {
          return new Response(JSON.stringify({ data: { id: 'arc_1' } }), { status: 200 });
        }
        return new Response(
          JSON.stringify({ error: { code: 'RESOURCE_NOT_FOUND', message: 'x', requestId: 'r', retryable: false } }),
          { status: 404 },
        );
      }),
    );
    await signIn();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Offer something for their life story' }));
    });
    await act(async () => {
      fireEvent.change(screen.getByLabelText('What you would like to add'), { target: { value: 'An extra detail' } });
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Submit contribution' }));
    });
    const announced = screen.getByRole('status').textContent ?? '';
    for (const leak of [
      'approved your relationship',
      'consented',
      'consent',
      'has not approved',
      'relationship',
    ]) {
      expect(announced.toLowerCase(), `refusal must not mention "${leak}"`).not.toContain(leak.toLowerCase());
    }
    // It still has to be a refusal that goes somewhere, or the honest
    // version is just a dead end: it points at the supporter's own
    // permissions, which are legitimately theirs to read.
    expect(announced).toContain('could not be completed');
    expect(announced).toContain('authorised you to do');
  });

  /**
   * The wording table exists so that nobody reads "Provider Accepted" and
   * believes the message arrived. This screen printed the raw state
   * instead — the participant's own screen has been careful about this
   * from the start, and the supporter's, looking at the same message, was
   * not. The two people in one conversation must not be told different
   * things about whether it got there.
   */
  it('tells a supporter what a delivery state means, never the raw state name', async () => {
    stubSupporterFetch({
      threads: [
        { attributes: { threadId: 'th_1', otherDisplayName: 'Ann', threadState: 'Active' } },
      ],
      messages: [
        {
          attributes: {
            messageId: 'msg_1',
            senderParticipantId: 'actor_sup',
            contentText: 'Thinking of you',
            lifecycleState: 'Sent',
            deliveryState: 'Provider Accepted',
          },
        },
      ],
    });
    await signIn();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'View my conversations' }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Read it' }));
    });
    expect(screen.getByText(/Thinking of you/)).toBeTruthy();
    /* The mark and the words are separate nodes, so match on the element
       that holds both rather than on a text node. */
    const status = screen.getByText(
      (_content, el) => el?.tagName === 'SMALL' && /not received by the person yet/i.test(el.textContent ?? ''),
    );
    expect(status).toBeTruthy();
    expect(status.textContent).not.toContain('Provider Accepted');
  });
});
