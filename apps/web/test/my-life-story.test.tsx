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
      // Before the listing branch: '/v1/objects/obj_1/content' contains
      // '/objects' too, and answering it with the listing JSON would hand
      // the screen a Blob of the wrong thing.
      if (method === 'GET' && /\/objects\/[^/]+\/content$/.test(path)) {
        /*
         * The header, explicitly. The route sets Content-Type from what
         * it sniffed out of the bytes, and a Blob handed to Response does
         * not carry its own type through here — the first version of this
         * stub relied on it and the picture came back as text/plain, so
         * the screen honestly declined to show it.
         */
        return new Response(new Blob([new Uint8Array([1, 2, 3])]), {
          status: 200,
          headers: { 'content-type': 'image/jpeg' },
        });
      }
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
 * Open a folded memory.
 *
 * Every entry is a row that opens now, so a test that wants what is
 * inside one has to make the same press a person makes. The tests below
 * that assert an ABSENCE need this most: with everything folded away, a
 * check for "no Change button on a withdrawn entry" passes whether the
 * rule holds or not.
 */
async function openMemory(title = 'My garden years') {
  const row = screen
    .getAllByRole('button', { expanded: false })
    .find((b) => (b.textContent ?? '').includes(title));
  if (row === undefined) throw new Error(`no folded memory titled "${title}"`);
  await act(async () => {
    fireEvent.click(row);
  });
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
    await openMemory();
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
    await openMemory('The soup');
    expect(screen.getByText(/offered it\. It is their account/)).toBeTruthy();
  });

  it('confirming binds to the exact version and says so before it happens', async () => {
    const calls = stubFetch({ data: [item()], meta: { archiveId: 'ar_1' } });
    await act(async () => {
      render(<MyLifeStory session={session} />);
    });
    await openMemory();
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
    await openMemory();
    expect(screen.getByText(/An earlier version of this was confirmed/)).toBeTruthy();
  });

  it('creates the archive on first write rather than leaving an empty one behind', async () => {
    const calls = stubFetch({ data: [], meta: { archiveId: null } });
    await act(async () => {
      render(<MyLifeStory session={session} />);
    });
    expect(screen.getByText('You have not written anything yet')).toBeTruthy();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Write a memory' }));
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

  /**
   * Speaking is drawn and is not built — there is no audio upload, no
   * storage against an item and no transcription provider (B-2).
   *
   * So it is shown and it is NOT a control. A button that cannot do the
   * thing it names is the failure this project keeps refusing, and a
   * disabled button is not better: it still reads as something that ought
   * to work today and leaves the person wondering what they did wrong.
   */
  it('shows speaking as coming, and does not offer it as a control', async () => {
    stubFetch({ data: [], meta: { archiveId: 'ar_1' } });
    await act(async () => {
      render(<MyLifeStory session={session} />);
    });
    expect(screen.getByText('Speak a memory'), 'the drawing shows this and it has gone').toBeTruthy();
    expect(
      screen.queryByRole('button', { name: /Speak a memory/ }),
      'speaking is offered as a control, and nothing behind it can record anything',
    ).toBeNull();
    expect(screen.getByText('Not ready yet.')).toBeTruthy();
  });

  /**
   * The drawing states "Only you can see them" flatly. It is true of a
   * story that is all private and false the moment one piece is shared,
   * and this is a claim about who can read somebody's memories.
   */
  it('does not say only you can see them over a shared entry', async () => {
    stubFetch({
      data: [item(), item({ itemId: 'li_2', title: 'The move', visibility: 'Community' })],
      meta: { archiveId: 'ar_1' },
    });
    await act(async () => {
      render(<MyLifeStory session={session} />);
    });
    const line = screen.getByText(/pieces so far/).textContent ?? '';
    expect(line).toMatch(/Two pieces so far/);
    expect(line, 'a shared entry is on the page and it still says only you').not.toMatch(/only you/i);
  });

  /**
   * Choosing a question writes it into the title, which is the only record
   * of the question there is — nothing stores which prompt was answered.
   * It must not throw away words already typed, for the same reason
   * closing without saving must not.
   */
  it('opens the writing box with the question as its title, keeping anything written', async () => {
    stubFetch({ data: [], meta: { archiveId: 'ar_1' } });
    await act(async () => {
      render(<MyLifeStory session={session} />);
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Write a memory' }));
    });
    await act(async () => {
      fireEvent.change(screen.getByLabelText('In your own words'), { target: { value: 'Already typed.' } });
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Choose a question to answer' }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'What did you cook for people?' }));
    });
    expect((screen.getByLabelText('What is it about?') as HTMLInputElement).value).toBe(
      'What did you cook for people?',
    );
    expect(
      (screen.getByLabelText('In your own words') as HTMLTextAreaElement).value,
      'choosing a question threw away what was already written',
    ).toBe('Already typed.');
  });

  it('closing the writing area without saving does not throw the words away', async () => {
    stubFetch({ data: [], meta: { archiveId: 'ar_1' } });
    await act(async () => {
      render(<MyLifeStory session={session} />);
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Write a memory' }));
    });
    await act(async () => {
      fireEvent.change(screen.getByLabelText('In your own words'), { target: { value: 'Half a thought.' } });
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Close without saving' }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Write a memory' }));
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
    await openMemory();
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
    await openMemory();
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
    await openMemory();
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
    await openMemory();
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
    await openMemory();
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
    await openMemory();
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
    await openMemory();
    // No empty upload box sits on an entry with nothing attached; the
    // box is asked for.
    expect(screen.queryByLabelText('Add a photograph to this entry')).toBeNull();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Add a photograph' }));
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

  /**
   * An entry with no photographs shows nothing about photographs.
   *
   * It used to show a heading, a sentence saying there was nothing, and
   * an empty file input — three pieces of furniture around an absence,
   * on every entry, pushing the memory itself off the screen (owner,
   * 2026-09-01). Only files that cleared checking are ever listed, so
   * "nothing here" is the honest state and it is drawn as nothing.
   *
   * The half that matters: adding is still reachable. Folding a control
   * away is not removing it (D-87), and a life story that could never
   * gain a picture after the first day would be the worse screen.
   */
  it('shows no photograph furniture on an entry that has none, and still lets one be added', async () => {
    stubWithFiles([]);
    await act(async () => {
      render(<MyLifeStory session={session} />);
    });
    await openMemory();
    expect(screen.queryByText(/Nothing has been added to this entry yet/i)).toBeNull();
    expect(screen.queryByText(/Photographs on this entry/i)).toBeNull();
    expect(screen.queryByLabelText('Add a photograph to this entry'), 'an empty upload box').toBeNull();
    expect(screen.getByRole('button', { name: 'Add a photograph' })).toBeTruthy();
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
    await openMemory();
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
    await openMemory();
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
    await openMemory();
    expect(screen.getAllByRole('button', { name: 'Remove this photograph' }).length).toBeGreaterThan(0);
    // Adding is not offered, because a withdrawn entry refuses every
    // other change and the server refuses this one too.
    expect(screen.queryByLabelText('Add a photograph to this entry')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Add a photograph' }), 'adding was offered on a withdrawn entry').toBeNull();
    expect(screen.getByText(/nothing more can be added to it/i)).toBeTruthy();
    expect(screen.getByText(/you can still remove any of it/i)).toBeTruthy();
  });

  /**
   * The provenance marker, held in place.
   *
   * A className is the easiest thing in a codebase to lose: nobody's test
   * fails, nothing throws, and the screen quietly stops distinguishing a
   * machine's draft from the participant's own words. The wording is
   * already asserted elsewhere; this asserts that the distinction is also
   * visible without reading a paragraph, and — the half that matters more
   * — that the participant's own entry is NOT given the marker. A screen
   * that labels everything has labelled nothing.
   */
  it('marks a drafting tool\'s suggestion and leaves the participant\'s own words unmarked', async () => {
    stubFetch({ data: [item({ itemId: 'li_ai', sourceType: 'AIDraft' }), item({ itemId: 'li_me' })] });
    await act(async () => {
      render(<MyLifeStory session={session} />);
    });

    /*
     * Folded, the distinction must still be there. This is the failure
     * the fold introduced: with an entry closed, the sentence saying a
     * machine wrote it is inside the part nobody has opened, so a row
     * would present a model's draft and the participant's own writing
     * identically. Exactly one row carries the marker, and it is the
     * drafted one — a screen that labels both has labelled neither.
     */
    const rows = screen.getAllByRole('button', { expanded: false });
    const marked = rows.filter((r) => /a drafting tool wrote this/i.test(r.textContent ?? ''));
    expect(marked.length, 'the fold hid which entry a drafting tool wrote').toBe(1);

    for (const row of rows) {
      await act(async () => {
        fireEvent.click(row);
      });
    }
    const drafted = screen.getByText(/a drafting tool suggested this/i);
    expect(drafted.className).toContain('state--ai');
    const own = screen.getByText(/^you wrote this\.$/i);
    expect(own.className).not.toContain('state--ai');
    expect(own.className).toBe('');
  });

  /**
   * A memory is a row until somebody opens it.
   *
   * The screen used to draw every entry in full: the words, then where
   * they came from, whether they were confirmed, who could see them, its
   * photographs and its controls — a column per memory, so a story of
   * twelve was a page nobody could scan (owner, 2026-09-01, X-32).
   *
   * A real button, so the fold is reachable by keyboard and announced as
   * a fold. `aria-expanded` is asserted on both sides: a control that
   * says "collapsed" while open is worse than one that says nothing,
   * because a screen reader then describes the opposite of the screen.
   */
  it('folds a memory into a row, and opens it when pressed', async () => {
    stubFetch({ data: [item()] });
    await act(async () => {
      render(<MyLifeStory session={session} />);
    });

    const row = screen.getByRole('button', { name: /My garden years/ });
    expect(row.getAttribute('aria-expanded')).toBe('false');
    /*
     * The opened memory is absent, and enough of it is on the row to be
     * worth reading. Asserted on the element rather than the text: this
     * fixture is shorter than the excerpt allowance, so it appears on the
     * row in full and a text search cannot tell open from closed.
     */
    expect(document.querySelector('.story-entry__words')).toBeNull();
    expect(row.textContent).toMatch(/I grew roses/);
    // And who can see it, without opening anything.
    expect(row.textContent).toMatch(/Only you/);

    await act(async () => {
      fireEvent.click(row);
    });
    expect(screen.getByRole('button', { name: /My garden years/ }).getAttribute('aria-expanded')).toBe('true');
    expect(document.querySelector('.story-entry__words')?.textContent).toBe(
      'I grew roses along the whole south wall.',
    );

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /My garden years/ }));
    });
    expect(document.querySelector('.story-entry__words')).toBeNull();
  });

  /**
   * The words are the subject, and the platform's sentences are not.
   *
   * Everything in an entry was one undifferentiated column of paragraphs,
   * so "You have not confirmed this as your own words." sat in the same
   * type as the memory it was about. This asserts the separation
   * structurally — the participant's writing in one element, everything
   * this platform has to say about it in another — because that is what
   * the stylesheet hangs the hierarchy on.
   */
  it('keeps the memory apart from what the platform says about it', async () => {
    stubFetch({ data: [item()] });
    const { container } = render(<MyLifeStory session={session} />);
    await act(async () => {});
    await openMemory();

    const words = container.querySelector('.story-entry__words');
    expect(words?.textContent).toBe('I grew roses along the whole south wall.');

    const notes = container.querySelector('.story-entry__notes');
    expect(notes, 'the platform’s sentences have nowhere of their own').not.toBeNull();
    expect(notes!.textContent).toMatch(/You wrote this/);
    expect(notes!.textContent).toMatch(/Only you can see this/);
    // And the memory is not inside the quiet band with them.
    expect(notes!.contains(words!), 'the memory was filed among the notes about it').toBe(false);
  });

  /**
   * A photograph, shown as a photograph.
   *
   * Nothing on this platform could read a stored file back: every part of
   * the upload pipeline existed except that one, so a picture on a memory
   * could only ever be described — "image/jpeg · 2 KB · added Friday" —
   * on the screen whose whole subject is somebody's own life (B-27).
   */
  it('shows a photograph rather than describing one, without a second press', async () => {
    stubWithFiles([
      { id: 'obj_1', attributes: {
        objectId: 'obj_1', declaredContentType: 'image/jpeg', declaredSizeBytes: 2048,
        objectState: 'Available', dataClassification: 'Sensitive-Personal', createdAt: '2026-08-07T00:00:00Z',
      } },
    ]);
    const { container } = render(<MyLifeStory session={session} />);
    await act(async () => {});
    await openMemory();
    await act(async () => {});

    const picture = container.querySelector('img.story-photograph__image');
    expect(picture, 'the photograph is still only being described').not.toBeNull();
    expect(picture!.getAttribute('src')).toMatch(/^blob:/);
    /*
     * Nothing here knows what is in the picture, and the alt text says
     * so rather than inventing a description — "A photograph" told to
     * somebody who cannot see it is honest; "Roses on a wall" would be
     * this screen making something up about their life.
     */
    expect(picture!.getAttribute('alt')).toMatch(/Nothing here describes what is in it/);
  });

  /**
   * The server refuses to call a file an image when its bytes are not
   * one. This screen must not overrule that: putting such a file in an
   * <img> is how a page ends up asking a browser to interpret bytes the
   * platform deliberately declined to vouch for.
   */
  it('will not put a file the server would not call an image into an img tag', async () => {
    const calls: { path: string }[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (path: string, init?: RequestInit) => {
        calls.push({ path });
        if ((init?.method ?? 'GET') !== 'GET') {
          return new Response(JSON.stringify({ data: { id: 'x' } }), { status: 201 });
        }
        if (/\/objects\/[^/]+\/content$/.test(path)) {
          // What the route serves for a file whose bytes are not the
          // image it claimed to be.
          return new Response(new Blob([new Uint8Array([60, 104, 116])]), {
            status: 200,
            headers: { 'content-type': 'application/octet-stream' },
          });
        }
        if (path.includes('/objects')) {
          return new Response(
            JSON.stringify({ data: [{ id: 'obj_1', attributes: {
              objectId: 'obj_1', declaredContentType: 'image/png', declaredSizeBytes: 3,
              objectState: 'Available', dataClassification: 'Sensitive-Personal', createdAt: '2026-08-07T00:00:00Z',
            } }] }),
            { status: 200 },
          );
        }
        return new Response(JSON.stringify({ data: [item()], meta: { archiveId: 'ar_1' } }), { status: 200 });
      }),
    );
    const { container } = render(<MyLifeStory session={session} />);
    await act(async () => {});
    await openMemory();
    await act(async () => {});

    expect(container.querySelector('img.story-photograph__image'), 'a file that is not an image was drawn as one').toBeNull();
    expect(screen.getByText(/not a photograph this page can show/i)).toBeTruthy();
    // And it is still removable, which is the whole point of showing it.
    expect(screen.getByRole('button', { name: 'Remove this photograph' })).toBeTruthy();
  });

  /**
   * Closing a memory is not a request to throw away a half-written
   * correction. The same rule as the writing box, one fold later — a
   * control offered as the safe way out must not be the destructive one.
   */
  it('keeps a half-written correction when the memory is folded away', async () => {
    stubFetch({ data: [item()] });
    await act(async () => {
      render(<MyLifeStory session={session} />);
    });
    await openMemory();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Change what this says' }));
    });
    const box = screen.getByLabelText('Your words');
    await act(async () => {
      fireEvent.change(box, { target: { value: 'I grew roses, and dahlias too.' } });
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /My garden years/ }));
    });
    await openMemory();
    expect(
      (screen.getByLabelText('Your words') as HTMLTextAreaElement).value,
      'the correction was thrown away by closing the memory',
    ).toBe('I grew roses, and dahlias too.');
  });

  /**
   * The drawing puts this screen on the page ground: a plain column, with
   * one memory separated from the next by a hairline. No panel around the
   * lot, and no card around each.
   *
   * It was the opposite of that — a cream `.zone-story` panel full of
   * white `.card--story` cards — which was right while Life Story was the
   * one warm screen in a neutral product, and became a box around
   * everything once the whole participant workspace went warm (owner,
   * 2026-08-31: "我们有个框框住了所有内容"). This holds it there. Card is
   * checked as a whole word: `.card--story` contains "card", so a
   * substring test would have passed against the very markup it replaced.
   */
  it('draws the story on the page, not in a box, and its entries as rows', async () => {
    stubFetch({ data: [item()] });
    const { container } = render(<MyLifeStory session={session} />);
    await act(async () => {});
    expect(container.querySelector('section.story-screen')).not.toBeNull();
    expect(container.querySelector('.zone-story'), 'the panel is back around the whole screen').toBeNull();

    const entry = screen.getByRole('article', { name: 'My garden years' });
    expect(entry.className.split(/\s+/), 'the entry is a card again').not.toContain('card');
    expect(entry.className.split(/\s+/)).toContain('story-entry');

    /* And only one line between the ways in and the first memory. There
       were two, 11px apart: a rule the drawing has, sitting just above
       the hairline every entry already carries. Reported 2026-09-01. The
       separators on this screen are the entries' own, so any <hr> here
       is the doubled one coming back. */
    expect(container.querySelector('hr'), 'the doubled rule is back above the first entry').toBeNull();
  });

  it('draws no rule under the ways in when nothing has been written', async () => {
    /* The empty story is where the doubled rule was worst: with no entry
       beneath it, it separated one thing from nothing at all. */
    stubFetch({ data: [] });
    const { container } = render(<MyLifeStory session={session} />);
    await act(async () => {});
    expect(screen.getByText(/You have not written anything yet/)).toBeTruthy();
    expect(container.querySelector('hr'), 'a rule separating the ways in from nothing').toBeNull();
  });
});
