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
});
