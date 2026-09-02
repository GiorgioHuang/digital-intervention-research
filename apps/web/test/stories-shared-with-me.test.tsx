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

function stub(people: unknown[], shared: unknown[], attached: unknown[] = []) {
  const calls: string[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (path: string) => {
      calls.push(path);
      if (path.includes('/relationships/mine')) {
        return new Response(JSON.stringify({ data: people }), { status: 200 });
      }
      // Before the listing branch: the content path contains '/objects'
      // too, and the route sets Content-Type from the sniffed bytes.
      if (/\/objects\/[^/]+\/content$/.test(path)) {
        return new Response(new Blob([new Uint8Array([1, 2, 3])]), {
          status: 200,
          headers: { 'content-type': 'image/jpeg' },
        });
      }
      if (path.includes('/objects')) {
        return new Response(JSON.stringify({ data: attached }), { status: 200 });
      }
      return new Response(JSON.stringify({ data: shared, meta: { ownerParticipantId: 'pt_mum' } }), { status: 200 });
    }),
  );
  return calls;
}

/**
 * Open the person, then open the memory. Every shared memory is a row
 * that opens, the same idiom as the participant's own story — so a test
 * that wants what is inside one has to make the same two presses a person
 * makes.
 */
async function openMemory(personName = /Margaret/, title = /My garden years/) {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: personName }));
  });
  await act(async () => {});
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: title }));
  });
  await act(async () => {});
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
    await openMemory();

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

    /*
     * Folded, the mark must still be there — a reader scanning a list
     * would otherwise see a model's draft and their mother's own writing
     * as the same thing.
     */
    const row = screen.getByRole('button', { expanded: false, name: /My garden years/ });
    expect(row.textContent, 'the fold hid that a drafting tool wrote it').toMatch(/A drafting tool wrote this/);

    await act(async () => {
      fireEvent.click(row);
    });
    await act(async () => {});
    const marked = container.querySelector('.story-entry__notes .state--ai');
    expect(marked, 'a drafting tool’s words were shown as this person’s own').not.toBeNull();
    expect(marked!.textContent).toMatch(/not this person’s own words unless they have said so/i);
    // And an unconfirmed memory is not reported as confirmed.
    expect(screen.queryByText(/confirmed these are their own words/)).toBeNull();
  });

  /**
   * The photograph, on the screen of the person it was shared with.
   *
   * A photograph follows the memory it is on (owner's decision,
   * 2026-09-01), and until this the supporter could read the words and
   * not see the pictures — which on a story about somebody's life is most
   * of what there was to show.
   */
  it('shows the photographs on a memory that was shared', async () => {
    const calls = stub([person()], [memory()], [
      { id: 'obj_1', attributes: {
        objectId: 'obj_1', declaredContentType: 'image/jpeg', declaredSizeBytes: 2048,
        objectState: 'Available', dataClassification: 'Sensitive-Personal', createdAt: '2026-06-03T00:00:00Z',
      } },
    ]);
    const { container } = render(<StoriesSharedWithMe session={session} />);
    await act(async () => {});
    await openMemory();
    await act(async () => {});

    // Asked for against the OWNER's participant id, not the reader's — a
    // supporter has no participant record of their own.
    expect(
      calls.some((c) => c.includes('/participants/pt_mum/objects')),
      'the photographs were asked for against the wrong person',
    ).toBe(true);

    const picture = container.querySelector('img.story-photograph__image');
    expect(picture, 'the photograph was not shown to the person it was shared with').not.toBeNull();
    expect(picture!.getAttribute('src')).toMatch(/^blob:/);
    /*
     * Nothing here knows what is in the picture, and the alt text says so
     * rather than inventing a description of somebody's family.
     */
    expect(picture!.getAttribute('alt')).toMatch(/Nothing here describes what is in it/);
  });

  /**
   * And nothing is fetched before a memory is opened.
   *
   * A screen that pulled every picture on arrival would spend one request
   * per memory before anybody had decided to read one — on a phone, on a
   * connection that may be poor.
   */
  it('fetches no photographs until a memory is opened', async () => {
    const calls = stub([person()], [memory()], [
      { id: 'obj_1', attributes: {
        objectId: 'obj_1', declaredContentType: 'image/jpeg', declaredSizeBytes: 2048,
        objectState: 'Available', dataClassification: 'Sensitive-Personal', createdAt: '2026-06-03T00:00:00Z',
      } },
    ]);
    render(<StoriesSharedWithMe session={session} />);
    await act(async () => {});
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Margaret/ }));
    });
    await act(async () => {});

    expect(
      calls.some((c) => c.includes('/objects')),
      'photographs were fetched for a memory nobody had opened',
    ).toBe(false);
  });

  /**
   * The server refuses to call a file an image when its bytes are not
   * one. This screen must not overrule that: putting such a file in an
   * <img> asks a browser to interpret bytes the platform deliberately
   * declined to vouch for — and here they are somebody else's bytes,
   * being rendered on a third person's screen.
   */
  it('will not put a file the server would not call an image into an img tag', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (path: string) => {
        if (path.includes('/relationships/mine')) {
          return new Response(JSON.stringify({ data: [person()] }), { status: 200 });
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
              objectState: 'Available', dataClassification: 'Sensitive-Personal', createdAt: '2026-06-03T00:00:00Z',
            } }] }),
            { status: 200 },
          );
        }
        return new Response(JSON.stringify({ data: [memory()], meta: { ownerParticipantId: 'pt_mum' } }), { status: 200 });
      }),
    );
    const { container } = render(<StoriesSharedWithMe session={session} />);
    await act(async () => {});
    await openMemory();
    await act(async () => {});

    expect(
      container.querySelector('img.story-photograph__image'),
      'a file that is not an image was drawn as one on somebody else’s screen',
    ).toBeNull();
    expect(screen.getByText(/not a photograph this page can show/i)).toBeTruthy();
  });

  /**
   * A memory whose photographs were not shared still reads.
   *
   * The server refuses the listing for a memory this person may not see
   * the files of, and that refusal must not put an error over the words —
   * it is the ordinary answer, not a fault.
   */
  it('keeps the words readable when the photographs are refused', async () => {
    const calls: string[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (path: string) => {
        calls.push(path);
        if (path.includes('/relationships/mine')) {
          return new Response(JSON.stringify({ data: [person()] }), { status: 200 });
        }
        if (path.includes('/objects')) {
          return new Response(
            JSON.stringify({ error: { code: 'RESOURCE_NOT_FOUND', message: 'Object not found', requestId: 'r', retryable: false } }),
            { status: 404 },
          );
        }
        return new Response(JSON.stringify({ data: [memory()], meta: { ownerParticipantId: 'pt_mum' } }), { status: 200 });
      }),
    );
    const { container } = render(<StoriesSharedWithMe session={session} />);
    await act(async () => {});
    await openMemory();
    await act(async () => {});

    expect(screen.getByText('I grew roses along the whole south wall.')).toBeTruthy();
    expect(container.querySelector('img.story-photograph__image')).toBeNull();
    expect(
      document.body.textContent,
      'a refused photograph listing put an error over somebody’s words',
    ).not.toMatch(/did not succeed|could not determine/i);
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
