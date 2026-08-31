import { afterEach, describe, expect, it, vi } from 'vitest';
import { CONTACT_PATH, MAX_FIELD, MAX_MESSAGE, checkContactMessage, sendContactMessage } from '../src/contact.js';

/**
 * The message box that replaced the telephone number on "Get in touch".
 *
 * The shape is the owner's own contact relay: `{ name, contact, message }`
 * POSTed as JSON to something that holds its own secrets — here, this
 * platform's own API, at a fixed same-origin path. What is tested is the
 * part that decides whether somebody's words leave the browser intact, and
 * what they are told when they do not.
 */
const msg = (over: Partial<{ name: string; contact: string; message: string }> = {}) => ({
  name: '',
  contact: '',
  message: 'Hello, I have a question about the study.',
  ...over,
});

describe('sending a message to the study team', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('refuses an empty message rather than sending nothing', () => {
    expect(checkContactMessage(msg({ message: '   ' }))).toEqual({ ok: false, reason: 'no-message' });
  });

  /**
   * The relay this was adapted from truncates silently — it slices to
   * 4000 and 200 and forwards whatever survived, with nothing to tell the
   * person who wrote it that the end is missing. On a platform whose promise is that
   * somebody's words stay their words, a message delivered with the end
   * quietly removed is the wrong failure, so the browser refuses first.
   */
  it('refuses rather than letting the relay cut the end off silently', () => {
    expect(checkContactMessage(msg({ message: 'x'.repeat(MAX_MESSAGE + 1) }))?.reason).toBe('too-long');
    expect(checkContactMessage(msg({ name: 'x'.repeat(MAX_FIELD + 1) }))?.reason).toBe('too-long');
    expect(checkContactMessage(msg({ contact: 'x'.repeat(MAX_FIELD + 1) }))?.reason).toBe('too-long');
    // Exactly at the limit goes through: an off-by-one here refuses a
    // message the relay would have carried whole.
    expect(checkContactMessage(msg({ message: 'x'.repeat(MAX_MESSAGE) }))).toBeNull();
  });

  it('sends the three fields the relay reads, as JSON, to its own server', async () => {
    const fetchMock = vi.fn(async () => new Response('{"ok":true,"canReply":true}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const res = await sendContactMessage(msg({ name: '  Ann  ', contact: ' ann@example.test ' }));
    expect(res).toEqual({ ok: true, canReply: true });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    // Same origin, and fixed. Nothing in the bundle can point it elsewhere.
    expect(url).toBe(CONTACT_PATH);
    expect(init.method).toBe('POST');
    expect(JSON.parse(String(init.body))).toEqual({
      name: 'Ann',
      contact: 'ann@example.test',
      message: 'Hello, I have a question about the study.',
    });
  });

  /**
   * Somebody who left no address has written into what they may well
   * believe is a conversation. Saying "we will write back" to them is a
   * comfort with nothing behind it — clause 5 — so the result carries
   * whether a reply is even possible and the screen says which.
   */
  it('reports that no reply is possible when no address was given', async () => {
    // The server decides this, because the server is what will be read
    // from; the browser only relays the answer to the screen.
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{"ok":true,"canReply":false}', { status: 200 })));
    expect(await sendContactMessage(msg({ contact: '' }))).toEqual({ ok: true, canReply: false });
  });

  it('reports a refusal from the relay as a failure, not a success', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{"ok":false}', { status: 502 })));
    expect(await sendContactMessage(msg())).toEqual({ ok: false, reason: 'failed' });
  });

  it('reports a network failure rather than throwing at the screen', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('offline');
      }),
    );
    await expect(sendContactMessage(msg())).resolves.toEqual({ ok: false, reason: 'failed' });
  });

  /**
   * "This deployment has no relay" and "it was not delivered" are
   * different things to be told, and only one of them is worth pressing
   * Send again for. The server says which in the body, and the distinction
   * has to survive the trip — collapsing both into "failed" would invite
   * somebody to retry into a server that can never send.
   */
  it('keeps a deployment with no relay apart from a delivery that failed', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{"ok":false,"reason":"not-configured"}', { status: 200 })));
    expect(await sendContactMessage(msg())).toEqual({ ok: false, reason: 'not-configured' });

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('{"ok":false,"reason":"delivery-failed"}', { status: 200 })),
    );
    expect(await sendContactMessage(msg())).toEqual({ ok: false, reason: 'failed' });
  });

  /** A refusal must happen before anything leaves the browser. */
  it('does not post a message it has already refused', async () => {
    const fetchMock = vi.fn(async () => new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    await sendContactMessage(msg({ message: '' }));
    await sendContactMessage(msg({ message: 'x'.repeat(MAX_MESSAGE + 1) }));
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
