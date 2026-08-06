import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { MyLifeStory } from '../src/components/MyLifeStory.js';

const session = { actorId: 'actor_a', participantId: 'pt_a' };

const item = (over: Record<string, unknown> = {}) => ({
  id: 'li_1',
  attributes: {
    itemId: 'li_1',
    title: 'My garden years',
    itemState: 'Active',
    visibility: 'Private',
    currentVersionId: 'lv_2',
    versionNumber: 2,
    contentText: 'I grew roses along the whole south wall.',
    sourceType: 'ParticipantAuthored',
    testimonyState: 'NotTestimony',
    supersedesConfirmedVersion: false,
    versionCount: 2,
    updatedAt: '2026-08-01T00:00:00Z',
    ...over,
  },
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
      return new Response(JSON.stringify(method === 'GET' ? body : { data: { id: 'ar_new' } }), { status: 200 });
    }),
  );
  return calls;
}

/**
 * Nothing could read a life story. A participant could write into it,
 * confirm testimony, change visibility and withdraw items — and could
 * accept a supporter's contribution into it — with no way to see what was
 * there. These pin down the two things the screen has to get right: the
 * provenance of every piece of text, and that confirmation binds to one
 * exact version.
 */
describe('a participant reading their own life story', () => {
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('reads the story and says who wrote each piece and whether it is confirmed', async () => {
    const calls = stubFetch({ data: [item()], meta: { archiveId: 'ar_1' } });
    await act(async () => {
      render(<MyLifeStory session={session} />);
    });
    expect(calls[0]?.path).toBe('/v1/participants/pt_a/life-story');
    expect(screen.getByText(/I grew roses/)).toBeTruthy();
    expect(screen.getByText('You wrote this.')).toBeTruthy();
    expect(screen.getByText('You have not confirmed this as your own words.')).toBeTruthy();
    expect(screen.getByText(/Only you can see this/)).toBeTruthy();
  });

  it("names a supporter's contribution as their account, not the participant's words", async () => {
    stubFetch({
      data: [item({ sourceType: 'SupporterContribution', title: 'The soup' })],
      meta: { archiveId: 'ar_1' },
    });
    await act(async () => {
      render(<MyLifeStory session={session} />);
    });
    expect(screen.getByText(/offered it\. It is their account/)).toBeTruthy();
  });

  it('confirming binds to the exact version and says so before it happens', async () => {
    const calls = stubFetch({ data: [item()], meta: { archiveId: 'ar_1' } });
    await act(async () => {
      render(<MyLifeStory session={session} />);
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Confirm this is in my own words' }));
    });
    expect(screen.getByText(/applies to exactly the words above, and to no other version/)).toBeTruthy();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Yes, these are my words' }));
    });
    const post = calls.find((c) => c.method === 'POST');
    expect(post?.path).toBe('/v1/life-story/items/li_1/confirm-testimony');
    expect(post?.body['versionId']).toBe('lv_2');
    expect(post?.body['confirmed']).toBe(true);
  });

  it('says when an earlier version was confirmed but this one is not', async () => {
    stubFetch({ data: [item({ supersedesConfirmedVersion: true })], meta: { archiveId: 'ar_1' } });
    await act(async () => {
      render(<MyLifeStory session={session} />);
    });
    expect(screen.getByText(/An earlier version of this was confirmed/)).toBeTruthy();
  });

  it('creates the archive on first write rather than leaving an empty one behind', async () => {
    const calls = stubFetch({ data: [], meta: { archiveId: null } });
    await act(async () => {
      render(<MyLifeStory session={session} />);
    });
    expect(screen.getByText('You have not written anything yet')).toBeTruthy();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Write something new' }));
    });
    await act(async () => {
      fireEvent.change(screen.getByLabelText('What is it about?'), { target: { value: 'Sunday walks' } });
      fireEvent.change(screen.getByLabelText('In your own words'), { target: { value: 'We went every week.' } });
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save to my story' }));
    });
    const posts = calls.filter((c) => c.method === 'POST');
    expect(posts[0]?.path).toBe('/v1/life-story/archives');
    expect(posts[1]?.path).toBe('/v1/life-story/archives/ar_new/items');
    // Recorded as written by the participant, because it was — this screen
    // has no drafting assistant, so any other provenance would be false.
    expect(posts[1]?.body['sourceType']).toBe('ParticipantAuthored');
  });

  it('closing the writing area without saving does not throw the words away', async () => {
    stubFetch({ data: [], meta: { archiveId: 'ar_1' } });
    await act(async () => {
      render(<MyLifeStory session={session} />);
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Write something new' }));
    });
    await act(async () => {
      fireEvent.change(screen.getByLabelText('In your own words'), { target: { value: 'Half a thought.' } });
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Close without saving' }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Write something new' }));
    });
    expect((screen.getByLabelText('In your own words') as HTMLTextAreaElement).value).toBe('Half a thought.');
  });

  /**
   * `reviseItem` had a route and no caller, so a participant could write
   * an entry and never change a word of it from any screen — while this
   * screen told them about revision three times over: that earlier
   * versions are kept, that changing the text leaves it unconfirmed, and
   * by displaying "you have changed this since confirming", a state only
   * reachable by revising. Being unable to correct your own account of
   * your own life is a strange thing for a life story to enforce.
   */
  it('an entry can be changed, and says nothing is overwritten', async () => {
    const calls = stubFetch({ data: [item({ contentText: 'I grew up by the sea.' })], meta: { archiveId: 'ar_1' } });
    await act(async () => {
      render(<MyLifeStory session={session} />);
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Change what this says' }));
    });
    // Pre-filled with what is there, so changing it is editing rather
    // than starting again from nothing.
    const box = screen.getByLabelText('Your words') as HTMLTextAreaElement;
    expect(box.value).toBe('I grew up by the sea.');
    expect(screen.getByText(/Nothing you wrote before is overwritten/)).toBeTruthy();
    await act(async () => {
      fireEvent.change(box, { target: { value: 'I grew up by the sea, in a house with a red door.' } });
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save this version' }));
    });
    const post = calls.find((c) => c.path.includes('/revise'));
    expect(post?.body['contentText']).toBe('I grew up by the sea, in a house with a red door.');
    // Never a provenance the participant did not have: this screen has no
    // drafting assistant (D-14).
    expect(post?.body['sourceType']).toBe('ParticipantAuthored');
  });

  /**
   * The confirmation belonged to the exact words confirmed. Changing them
   * undoes something the participant did deliberately, so they are told
   * before saving rather than after.
   */
  it('warns that changing confirmed words leaves the new text unconfirmed', async () => {
    stubFetch({
      data: [item({ contentText: 'My words.', testimonyState: 'ParticipantTestimony' })],
      meta: { archiveId: 'ar_1' },
    });
    await act(async () => {
      render(<MyLifeStory session={session} />);
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Change what this says' }));
    });
    expect(screen.getByText(/You confirmed these words as your own/)).toBeTruthy();
    expect(screen.getByText(/will not be confirmed until you say so again/)).toBeTruthy();
  });

  /**
   * A withdrawn item cannot be revised — the command refuses it, and a
   * control that cannot work is the same defect as one that does nothing.
   */
  it('does not offer to change a withdrawn entry', async () => {
    stubFetch({ data: [item({ contentText: 'Gone.', itemState: 'Withdrawn' })], meta: { archiveId: 'ar_1' } });
    await act(async () => {
      render(<MyLifeStory session={session} />);
    });
    expect(screen.queryByRole('button', { name: 'Change what this says' })).toBeNull();
  });
});
