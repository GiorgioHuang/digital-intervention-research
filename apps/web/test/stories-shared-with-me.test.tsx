import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { StoriesSharedWithMe } from '../src/components/StoriesSharedWithMe.js';

const session = { actorId: 'actor_sam', participantId: '' };

const person = (over: Record<string, unknown> = {}) => ({
  id: 'rel_1',
  attributes: {
    relationshipId: 'rel_1',
    participantId: 'pt_mum',
    participantDisplayName: 'Margaret',
    relationshipType: 'FamilyMember',
    relationshipState: 'Active',
    ...over,
  },
});

const memory = (over: Record<string, unknown> = {}) => ({
  id: 'li_1',
  attributes: {
    itemId: 'li_1',
    title: 'My garden years',
    contentText: 'I grew roses along the whole south wall.',
    sourceType: 'ParticipantAuthored',
    testimonyState: 'ParticipantTestimony',
    updatedAt: '2026-06-02T00:00:00Z',
    ...over,
  },
});

function stub(people: unknown[], shared: unknown[]) {
  const calls: string[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (path: string) => {
      calls.push(path);
      if (path.includes('/relationships/mine')) {
        return new Response(JSON.stringify({ data: people }), { status: 200 });
      }
      return new Response(JSON.stringify({ data: shared, meta: { ownerParticipantId: 'pt_mum' } }), { status: 200 });
    }),
  );
  return calls;
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

/**
 * The other end of B-30.
 *
 * A participant could mark a memory readable by the people who support
 * them and there was nowhere for those people to read it. Without this
 * screen the whole scope is a control that does nothing.
 */
describe('a supporter reading what was shared with them', () => {
  it('lists the people who have made them a supporter, and opens one', async () => {
    const calls = stub([person()], [memory()]);
    render(<StoriesSharedWithMe session={session} />);
    await act(async () => {});
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Margaret/ }));
    });
    await act(async () => {});

    expect(calls.some((c) => c.includes('/participants/pt_mum/life-story/shared'))).toBe(true);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toMatch(/Margaret’s life story/);
    expect(screen.getByText('I grew roses along the whole south wall.')).toBeTruthy();
    expect(screen.getByText(/They have confirmed these are their own words/)).toBeTruthy();
  });

  /**
   * Provenance travels with the memory. A daughter who cannot tell a
   * drafting tool's words from her mother's has been told something false
   * about her mother (ADR-024) — and this screen is the one place she has
   * no other way to find out.
   */
  it('tells the reader when a drafting tool wrote the words', async () => {
    stub([person()], [memory({ sourceType: 'AIDraft', testimonyState: 'NotTestimony' })]);
    const { container } = render(<StoriesSharedWithMe session={session} />);
    await act(async () => {});
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Margaret/ }));
    });
    await act(async () => {});

    const marked = container.querySelector('.state--ai');
    expect(marked, 'a drafting tool’s words were shown as this person’s own').not.toBeNull();
    expect(marked!.textContent).toMatch(/not this person’s own words unless they have said so/i);
    // And an unconfirmed memory is not reported as confirmed.
    expect(screen.queryByText(/confirmed these are their own words/)).toBeNull();
  });

  /**
   * Nothing shared is not nothing written, and the screen must not imply
   * either. Saying "there are others you cannot see" would tell somebody
   * about their mother's story that their mother did not share.
   */
  it('does not hint at memories that were not shared', async () => {
    stub([person()], []);
    render(<StoriesSharedWithMe session={session} />);
    await act(async () => {});
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Margaret/ }));
    });
    await act(async () => {});

    expect(screen.getByText(/have not shared anything with you/i)).toBeTruthy();
    const said = document.body.textContent ?? '';
    expect(said, 'the screen implied there is more it is not showing').not.toMatch(/other|hidden|private|rest of/i);
  });

  it('says plainly when nobody has made them a supporter', async () => {
    stub([], []);
    render(<StoriesSharedWithMe session={session} />);
    await act(async () => {});
    expect(screen.getByText(/Nobody has made you a supporter yet/i)).toBeTruthy();
  });

  /**
   * A relationship that is not Active grants nothing — the server refuses
   * it — so the row says so rather than offering a door that opens onto
   * an error.
   */
  it('does not offer to open a story through a relationship that is not active', async () => {
    stub([person({ relationshipState: 'Suspended' })], [memory()]);
    render(<StoriesSharedWithMe session={session} />);
    await act(async () => {});
    expect(screen.getByText(/relationship is suspended, so there is nothing to read/i)).toBeTruthy();
  });
});
