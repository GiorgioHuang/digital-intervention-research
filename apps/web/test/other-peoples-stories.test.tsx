import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { OtherPeoplesStories } from '../src/components/OtherPeoplesStories.js';

const session = { actorId: 'actor_a', participantId: 'pt_a' };

const piece = (over: Record<string, unknown> = {}) => ({
  id: 'li_1',
  attributes: {
    itemId: 'li_1',
    title: 'The winter we moved',
    contentText: 'The lorry could not get up the hill, so we carried it all.',
    sourceType: 'ParticipantAuthored',
    testimonyState: 'ParticipantTestimony',
    updatedAt: '2026-06-02T00:00:00Z',
    ownerParticipantId: 'pt_mum',
    ownerDisplayName: 'Margaret',
    mine: false,
    ...over,
  },
});

function stub(pieces: unknown[]) {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ data: pieces }), { status: 200 })));
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('other people’s stories', () => {
  it('shows who wrote a piece, and opens it', async () => {
    stub([piece()]);
    render(<OtherPeoplesStories session={session} onGoToMyStory={() => undefined} />);
    await act(async () => {});

    expect(screen.getByText('Margaret')).toBeTruthy();
    // Folded until asked for, like every other story row.
    expect(document.querySelector('.story-entry__words')).toBeNull();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /The winter we moved/ }));
    });
    expect(document.querySelector('.story-entry__words')?.textContent).toMatch(/could not get up the hill/);
  });

  /**
   * The drawing's reassurance is only true if a piece they DID share
   * appears — and it is the only way somebody can check that sharing did
   * what they meant. It is marked as theirs rather than presented as
   * somebody else's.
   */
  it('marks the reader’s own shared piece as theirs', async () => {
    stub([piece({ mine: true, ownerDisplayName: 'Ann' })]);
    render(<OtherPeoplesStories session={session} onGoToMyStory={() => undefined} />);
    await act(async () => {});
    expect(screen.getByText('Yours')).toBeTruthy();
    expect(screen.getByText(/Nothing of yours appears here unless you choose a piece and share it/)).toBeTruthy();
  });

  /**
   * A name that could not be resolved is said to be unknown rather than
   * filled in. Putting somebody's memory under a made-up name is worse
   * than saying the name is missing.
   */
  it('does not invent a name it was not given', async () => {
    stub([piece({ ownerDisplayName: null })]);
    render(<OtherPeoplesStories session={session} onGoToMyStory={() => undefined} />);
    await act(async () => {});
    expect(screen.getByText('Somebody on this platform')).toBeTruthy();
  });

  /**
   * A reader scanning a feed would otherwise see a model's draft and
   * somebody's own writing as the same thing (ADR-024).
   */
  it('marks a drafting tool’s words on the row', async () => {
    stub([piece({ sourceType: 'AIDraft', testimonyState: 'NotTestimony' })]);
    const { container } = render(<OtherPeoplesStories session={session} onGoToMyStory={() => undefined} />);
    await act(async () => {});
    const row = screen.getByRole('button', { expanded: false, name: /The winter we moved/ });
    expect(row.textContent, 'the feed hid that a drafting tool wrote it').toMatch(/A drafting tool wrote this/);
    expect(container.querySelector('.state--ai')).not.toBeNull();
  });

  /**
   * The drawing has a like button and a comment button. Nothing exists
   * behind either — no reactions table, no comments table — and comments
   * on somebody's life story would need moderation, reporting and
   * blocking before they could be offered at all. A control that cannot
   * do the thing it names is the failure this project keeps taking out
   * (X-40).
   */
  it('offers no control it cannot honour', async () => {
    stub([piece()]);
    render(<OtherPeoplesStories session={session} onGoToMyStory={() => undefined} />);
    await act(async () => {});
    const buttons = screen.getAllByRole('button').map((b) => b.textContent ?? '');
    for (const absent of [/like/i, /comment/i, /reply/i]) {
      expect(buttons.filter((b) => absent.test(b)), `a ${String(absent)} control was drawn`).toEqual([]);
    }
  });

  it('leads back to my story to choose one to share', async () => {
    stub([]);
    let went = false;
    render(<OtherPeoplesStories session={session} onGoToMyStory={() => (went = true)} />);
    await act(async () => {});
    expect(screen.getByText(/Nothing has been shared with you yet/i)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Choose one of mine to share' }));
    expect(went).toBe(true);
  });
});
