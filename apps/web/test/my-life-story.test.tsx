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
 * The life story answers one shape and the attachment listing another,
 * so a single canned body cannot serve both — a stub that returned the
 * life story for every GET would make the file list look populated.
 */
function stubWithFiles(files: unknown[], only?: unknown) {
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
      if (method === 'GET' && path.includes('/objects')) {
        return new Response(JSON.stringify({ data: files }), { status: 200 });
      }
      if (method === 'GET') {
        return new Response(JSON.stringify({ data: [only ?? item()], meta: { archiveId: 'ar_1' } }), { status: 200 });
      }
      return new Response(JSON.stringify({ data: { id: 'obj_1' } }), { status: 201 });
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

  /**
   * `withdrawItem` had a route and no caller, while this screen already
   * carried the sentence describing what a withdrawn entry is — "You
   * withdrew this. It is private and nobody else can reach it; it is
   * kept here for you." A state nobody could reach, described in the
   * present tense.
   *
   * The word "withdraw" reads to many people as "delete". Somebody who
   * wanted it gone needs to know before they press that it is not.
   */
  it('withdrawing says what it does and, plainly, that it is not deletion', async () => {
    const calls = stubFetch({ data: [item()], meta: { archiveId: 'ar_1' } });
    await act(async () => {
      render(<MyLifeStory session={session} />);
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Take this out of my story' }));
    });
    // Nothing sent until it is confirmed.
    expect(calls.filter((c) => c.method === 'POST').length).toBe(0);
    expect(screen.getByText(/It is not\s+deleted/)).toBeTruthy();
    expect(screen.getByText(/You can still read it here, and every version you wrote is kept/)).toBeTruthy();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Yes, take it out' }));
    });
    const post = calls.find((c) => c.path.includes('/withdraw'));
    expect(post?.body['confirmed']).toBe(true);
  });

  /**
   * Withdrawing does not unsay a confirmation. The record of what
   * somebody stood behind stays as it was, and they are told that rather
   * than left to wonder.
   */
  it('says a confirmed entry stays confirmed after withdrawal', async () => {
    stubFetch({ data: [item({ testimonyState: 'ParticipantTestimony' })], meta: { archiveId: 'ar_1' } });
    await act(async () => {
      render(<MyLifeStory session={session} />);
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Take this out of my story' }));
    });
    expect(screen.getByText(/withdrawing does not unsay it/i)).toBeTruthy();
  });

  it('an already withdrawn entry offers neither change nor withdrawal', async () => {
    stubFetch({ data: [item({ itemState: 'Withdrawn' })], meta: { archiveId: 'ar_1' } });
    await act(async () => {
      render(<MyLifeStory session={session} />);
    });
    expect(screen.queryByRole('button', { name: 'Take this out of my story' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Change what this says' })).toBeNull();
    // And the entry is still readable by its author, as the screen says.
    expect(screen.getByText(/I grew roses/)).toBeTruthy();
  });

  /**
   * Photographs on an entry, and the two sentences that must not be
   * written.
   *
   * Attaching used to take three calls, the last of which could only be
   * made after a background sweep had checked the file — so a
   * participant uploaded a photograph and had to come back and attach it
   * themselves. The destination now goes with the upload.
   *
   * The wording is bounded by what the platform can do. The checker
   * recognises a test string, not real malware (ADR-126), so nothing
   * here may say a file was scanned for viruses; and sharing with a
   * supporter does not exist at all (D-39), so the screen says that
   * rather than implying an audience.
   */
  it('adds a photograph in one act, and never claims it was scanned for viruses', async () => {
    const calls = stubWithFiles([]);
    await act(async () => {
      render(<MyLifeStory session={session} />);
    });
    const input = screen.getAllByLabelText('Add a photograph to this entry')[0]!;
    const file = new File([new Uint8Array([1, 2, 3])], 'gran.jpg', { type: 'image/jpeg' });
    // jsdom's File does not implement arrayBuffer(); browsers do.
    Object.defineProperty(file, 'arrayBuffer', {
      value: async () => new Uint8Array([1, 2, 3]).buffer,
    });
    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
    });

    const started = calls.find((c) => c.path === '/v1/objects');
    expect(started?.body).toMatchObject({
      declaredContentType: 'image/jpeg',
      declaredSizeBytes: 3,
      attachTo: { owningResourceType: 'LifeStoryItem' },
    });
    expect(calls.some((c) => /\/v1\/objects\/.*\/content$/.test(c.path))).toBe(true);
    // One act: the participant is never asked to release it themselves.
    expect(calls.some((c) => /\/release$/.test(c.path))).toBe(false);

    const said = document.body.textContent ?? '';
    // It is not on the entry yet, and the screen says so.
    expect(said).toMatch(/received and is being checked/i);
    expect(said).toMatch(/not on this entry yet/i);
    // The two claims the platform cannot keep.
    expect(said).not.toMatch(/virus|malware|scanned for/i);
    expect(said).toMatch(/no way to share a photograph with anyone/i);
  });

  /** Only files that cleared checking are listed; nothing else is shown as held. */
  it('lists nothing for an entry with no accepted files, and says so', async () => {
    stubWithFiles([]);
    await act(async () => {
      render(<MyLifeStory session={session} />);
    });
    await act(async () => {
      fireEvent.click(screen.getAllByRole('button', { name: 'Show photographs on this entry' })[0]!);
    });
    expect(screen.getByText(/Nothing has been added to this entry yet/i)).toBeTruthy();
  });

  /**
   * A photograph could be added and never taken back. `object_state` has
   * allowed 'Deleted' since the first migration and nothing ever wrote
   * it — a one-way door, on a picture of somebody's life, and one that
   * only became reachable when the screen for adding a photograph
   * existed.
   */
  it('a photograph can be removed, and the confirmation says what is destroyed and what is not', async () => {
    const calls = stubWithFiles([
      { id: 'obj_1', attributes: {
        objectId: 'obj_1', declaredContentType: 'image/jpeg', declaredSizeBytes: 2048,
        objectState: 'Available', dataClassification: 'Sensitive-Personal', createdAt: '2026-08-07T00:00:00Z',
      } },
    ]);
    await act(async () => {
      render(<MyLifeStory session={session} />);
    });
    await act(async () => {
      fireEvent.click(screen.getAllByRole('button', { name: 'Show photographs on this entry' })[0]!);
    });
    fireEvent.click(screen.getAllByRole('button', { name: 'Remove this photograph' })[0]!);

    // Nothing is destroyed on the first click.
    expect(calls.some((c) => c.path.includes('/delete'))).toBe(false);
    const dialog = screen.getByRole('alertdialog');
    expect(dialog.textContent).toMatch(/cannot be brought back/i);
    // And what survives, so nobody thinks their entry went with it.
    expect(dialog.textContent).toMatch(/entry and everything you wrote are untouched/i);
    expect(dialog.textContent).toMatch(/that note holds no photograph/i);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Yes, remove it' }));
    });
    const deleted = calls.find((c) => c.path === '/v1/objects/obj_1/delete');
    expect(deleted?.body).toMatchObject({ confirmed: true });
  });

  it('keeping it destroys nothing', async () => {
    const calls = stubWithFiles([
      { id: 'obj_1', attributes: {
        objectId: 'obj_1', declaredContentType: 'image/jpeg', declaredSizeBytes: 2048,
        objectState: 'Available', dataClassification: 'Sensitive-Personal', createdAt: '2026-08-07T00:00:00Z',
      } },
    ]);
    await act(async () => {
      render(<MyLifeStory session={session} />);
    });
    await act(async () => {
      fireEvent.click(screen.getAllByRole('button', { name: 'Show photographs on this entry' })[0]!);
    });
    fireEvent.click(screen.getAllByRole('button', { name: 'Remove this photograph' })[0]!);
    fireEvent.click(screen.getByRole('button', { name: 'Keep it' }));
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(calls.some((c) => c.path.includes('/delete'))).toBe(false);
  });

  /**
   * Withdrawing an entry must not take its photographs out of reach.
   *
   * The screen tells its owner a withdrawn entry is private and kept for
   * them to read. Hiding the attachment block on a withdrawn entry took
   * the pictures away without saying so — and the remove control lives
   * inside that block, so it also put them beyond deletion, for exactly
   * the people who had just decided they wanted the entry private. That
   * is the one-way door again, on the same increment that closed it.
   */
  it('a withdrawn entry still shows its photographs, and can still remove them', async () => {
    stubWithFiles(
      [
        { id: 'obj_1', attributes: {
          objectId: 'obj_1', declaredContentType: 'image/jpeg', declaredSizeBytes: 2048,
          objectState: 'Available', dataClassification: 'Sensitive-Personal', createdAt: '2026-08-07T00:00:00Z',
        } },
      ],
      item({ itemState: 'Withdrawn' }),
    );
    await act(async () => {
      render(<MyLifeStory session={session} />);
    });
    await act(async () => {
      fireEvent.click(screen.getAllByRole('button', { name: 'Show photographs on this entry' })[0]!);
    });
    expect(screen.getAllByRole('button', { name: 'Remove this photograph' }).length).toBeGreaterThan(0);
    // Adding is not offered, because a withdrawn entry refuses every
    // other change and the server refuses this one too.
    expect(screen.queryByLabelText('Add a photograph to this entry')).toBeNull();
    expect(screen.getByText(/nothing more can be added to it/i)).toBeTruthy();
    expect(screen.getByText(/you can still remove any of it/i)).toBeTruthy();
  });
});
