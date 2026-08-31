import { afterEach, describe, expect, it, vi } from 'vitest';
import { MAX_FIELD, MAX_MESSAGE, checkContactMessage, sendContactMessage } from '../src/contact.js';

/**
 * The message box that replaced the telephone number on "Get in touch".
 *
 * The shape is the owner's own contact relay: `{ name, contact, message }`
 * POSTed as JSON to a Worker that holds its own secrets. What is tested
 * here is the part that decides whether somebody's words leave the browser
 * intact, and what they are told when they do not.
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
   * The relay truncates silently — `clean()` slices to 4000 and 200 and
   * forwards whatever survived, with nothing to tell the person who wrote
   * it that the end is missing. On a platform whose promise is that
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

  it('sends the three fields the relay reads, as JSON', async () => {
    const fetchMock = vi.fn(async () => new Response('{"ok":true}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const res = await sendContactMessage(msg({ name: '  Ann  ', contact: ' ann@example.test ' }), 'https://relay.test');
    expect(res).toEqual({ ok: true, canReply: true });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://relay.test');
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
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{"ok":true}', { status: 200 })));
    expect(await sendContactMessage(msg({ contact: '' }), 'https://relay.test')).toEqual({ ok: true, canReply: false });
    expect(await sendContactMessage(msg({ contact: '   ' }), 'https://relay.test')).toEqual({
      ok: true,
      canReply: false,
    });
  });

  it('reports a refusal from the relay as a failure, not a success', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{"ok":false}', { status: 502 })));
    expect(await sendContactMessage(msg(), 'https://relay.test')).toEqual({ ok: false, reason: 'failed' });
  });

  it('reports a network failure rather than throwing at the screen', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('offline');
      }),
    );
    await expect(sendContactMessage(msg(), 'https://relay.test')).resolves.toEqual({ ok: false, reason: 'failed' });
  });

  /**
   * With no relay configured nothing may be posted anywhere. The failure
   * mode this guards is a build that falls back to some default address
   * and quietly sends participants' messages to it.
   */
  it('sends nowhere at all when no relay is configured', async () => {
    const fetchMock = vi.fn(async () => new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    expect(await sendContactMessage(msg(), '')).toEqual({ ok: false, reason: 'not-configured' });
    expect(fetchMock, 'a message was posted somewhere with no endpoint configured').not.toHaveBeenCalled();
  });

  /** A refusal must happen before anything leaves the browser. */
  it('does not post a message it has already refused', async () => {
    const fetchMock = vi.fn(async () => new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    await sendContactMessage(msg({ message: '' }), 'https://relay.test');
    await sendContactMessage(msg({ message: 'x'.repeat(MAX_MESSAGE + 1) }), 'https://relay.test');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
