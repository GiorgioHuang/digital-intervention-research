import { describe, expect, it, vi } from 'vitest';
import { ContactController, CONTACT_RELAY } from '../src/contact.controller.js';
import { checkPayload, relayContactMessage, relayText, MAX_FIELD, MAX_MESSAGE } from '../src/contact-relay.js';

/**
 * The one route this platform answers without an actor.
 *
 * It is safe to be: it reads nothing, returns nothing about anybody, and
 * touches no record — so it cannot leak. What it can be is abused, and
 * what it can do badly is lose part of somebody's message or tell them
 * something untrue about what happened to it. Those are what these cover.
 */
const ok = () => ({ ok: true }) as unknown as Response;
const body = (over: Record<string, unknown> = {}) => ({
  name: '',
  contact: '',
  message: 'Hello, I have a question about the study.',
  ...over,
});
const relay = { botToken: 'token', chatId: 'chat' };

describe('the contact relay', () => {
  it('refuses an empty message', () => {
    expect(checkPayload(body({ message: '   ' }))?.reason).toBe('no-message');
  });

  /**
   * Refused, not trimmed. The relay this was adapted from slices to these
   * numbers and forwards what survived, so a long message arrives with the
   * end missing and nobody is told.
   */
  it('refuses over-length rather than delivering a message with the end cut off', () => {
    expect(checkPayload(body({ message: 'x'.repeat(MAX_MESSAGE + 1) }))?.reason).toBe('too-long');
    expect(checkPayload(body({ name: 'x'.repeat(MAX_FIELD + 1) }))?.reason).toBe('too-long');
    expect(checkPayload(body({ contact: 'x'.repeat(MAX_FIELD + 1) }))?.reason).toBe('too-long');
    // Exactly at the limit goes through: an off-by-one here refuses a
    // message that would have been carried whole.
    expect(checkPayload(body({ message: 'x'.repeat(MAX_MESSAGE) }))).toBeNull();
  });

  it('sends nothing at all when it has been refused', async () => {
    const sent = vi.fn();
    for (const bad of [body({ message: '' }), body({ message: 'x'.repeat(MAX_MESSAGE + 1) })]) {
      await relayContactMessage(bad, relay, sent as unknown as typeof fetch);
    }
    expect(sent, 'a refused message was still sent').not.toHaveBeenCalled();
  });

  it('sends nothing when this deployment has no relay, and says which', async () => {
    const sent = vi.fn();
    expect(await relayContactMessage(body(), undefined, sent as unknown as typeof fetch)).toEqual({
      ok: false,
      reason: 'not-configured',
    });
    expect(sent).not.toHaveBeenCalled();
  });

  /**
   * The honeypot answers success without sending. A bot told it failed
   * tries again; telling it nothing is what makes the trap work.
   */
  it('swallows a message that filled the hidden field, without sending it', async () => {
    const sent = vi.fn();
    expect(await relayContactMessage(body({ website: 'spam' }), relay, sent as unknown as typeof fetch)).toEqual({
      ok: true,
      canReply: false,
    });
    expect(sent).not.toHaveBeenCalled();
  });

  it('reports a refusal from the far end as a failure, not a success', async () => {
    const sent = vi.fn(async () => ({ ok: false }) as unknown as Response);
    expect(await relayContactMessage(body(), relay, sent as unknown as typeof fetch)).toEqual({
      ok: false,
      reason: 'delivery-failed',
    });
  });

  it('reports a network failure rather than throwing at the caller', async () => {
    const sent = vi.fn(async () => {
      throw new Error('offline');
    });
    await expect(relayContactMessage(body(), relay, sent as unknown as typeof fetch)).resolves.toEqual({
      ok: false,
      reason: 'delivery-failed',
    });
  });

  it('says whether a reply is even possible', async () => {
    const sent = vi.fn(async () => ok());
    expect(await relayContactMessage(body({ contact: 'a@b.test' }), relay, sent as unknown as typeof fetch)).toEqual({
      ok: true,
      canReply: true,
    });
    expect(await relayContactMessage(body({ contact: '   ' }), relay, sent as unknown as typeof fetch)).toEqual({
      ok: true,
      canReply: false,
    });
  });

  /**
   * Whoever reads it needs to know there is nowhere to send a reply BEFORE
   * they start composing one, not after.
   */
  it('says loudly, at the top, when the sender left no way to be reached', () => {
    expect(relayText(body({ contact: '' }))).toMatch(/Reply to: NOT GIVEN/);
    expect(relayText(body({ contact: 'a@b.test' }))).toMatch(/Reply to: a@b\.test/);
    expect(relayText(body({ name: '' }))).toMatch(/Name: Not given/);
  });

  it('carries the message itself through unchanged', () => {
    expect(relayText(body({ message: '  Two lines\nof it.  ' }))).toContain('Two lines\nof it.');
  });
});

/**
 * The rate limit is a brake on a person or a naive script, not a defence
 * against anybody who means it — it is per instance and this service runs
 * up to three. What it buys is that the one unauthenticated route here
 * cannot be turned into an outbound request amplifier by a single caller
 * in a loop.
 */
describe('the contact endpoint', () => {
  it('stops one address sending without limit', async () => {
    const controller = new ContactController(undefined);
    const results = [];
    for (let i = 0; i < 8; i += 1) results.push(await controller.send(body(), '1.2.3.4'));
    // The first few are answered on their merits; the rest are refused.
    expect(results.filter((r) => !r.ok && r.reason === 'not-configured').length).toBe(5);
    expect(results.filter((r) => !r.ok && r.reason === 'delivery-failed').length).toBe(3);
  });

  it('does not hold one caller against another', async () => {
    const controller = new ContactController(undefined);
    for (let i = 0; i < 6; i += 1) await controller.send(body(), '1.2.3.4');
    const other = await controller.send(body(), '5.6.7.8');
    expect(other, 'a second address was refused for the first one’s traffic').toEqual({
      ok: false,
      reason: 'not-configured',
    });
  });

  it('is exported under the token the module provides', () => {
    expect(CONTACT_RELAY).toBe('CONTACT_RELAY');
  });
});
