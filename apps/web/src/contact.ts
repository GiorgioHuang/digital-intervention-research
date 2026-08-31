/**
 * Sending a message to the people who run the study.
 *
 * The shape is the owner's own contact relay (`g-portfolio`): the browser
 * POSTs `{ name, contact, message }` as JSON and something forwards it,
 * holding its own secrets. What forwards it is this platform's own API,
 * not a Cloudflare Worker as first built — the two values it needs are
 * already in GCP Secret Manager, which a Worker cannot read, and a second
 * copy of a credential exists only to drift from the first.
 *
 * So the endpoint is same-origin and fixed. There is nothing to configure
 * in the bundle and nothing that can point at the wrong relay: a fork, a
 * local build and a staging deployment each talk to their own server.
 * Whether that server can actually carry a message is the server's answer,
 * asked once at startup — see `serverInfo`.
 */
export const CONTACT_PATH = '/contact';

/**
 * The limits, held here as well as on the server.
 *
 * The relay this was adapted from truncates silently — it slices to these
 * numbers and forwards what survived. On a platform whose promise is that
 * somebody's words stay their words, a message delivered with the end
 * quietly removed, and nothing to tell the person who wrote it, is the
 * wrong failure. Both ends refuse instead, at the same numbers, so a
 * message either arrives whole or does not arrive.
 */
export const MAX_MESSAGE = 4000;
export const MAX_FIELD = 200;

export interface ContactMessage {
  name: string;
  contact: string;
  message: string;
}

export interface ContactRefused {
  ok: false;
  reason: 'no-message' | 'too-long' | 'not-configured' | 'failed';
}
export type ContactResult = { ok: true; canReply: boolean } | ContactRefused;

/**
 * What is wrong with this message, or nothing.
 *
 * Separate from sending so that the screen can refuse before it tries, and
 * so the rules are testable without a network. Pure.
 */
export function checkContactMessage(m: ContactMessage): ContactRefused | null {
  if (m.message.trim() === '') return { ok: false, reason: 'no-message' };
  if (m.message.length > MAX_MESSAGE || m.name.length > MAX_FIELD || m.contact.length > MAX_FIELD) {
    return { ok: false, reason: 'too-long' };
  }
  return null;
}

/**
 * Post the message to the relay.
 *
 * `canReply` on success is not decoration: somebody who left no way to be
 * reached has written into what they may believe is a conversation, and
 * the screen has to tell them plainly that there is no way to answer. That
 * is clause 5 of the wording constitution — unknown means unknown, and
 * "we will get back to you" said to somebody who left no address is a
 * comfort with nothing behind it.
 */
export async function sendContactMessage(m: ContactMessage, endpoint = CONTACT_PATH): Promise<ContactResult> {
  const bad = checkContactMessage(m);
  if (bad !== null) return bad;
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: m.name.trim(), contact: m.contact.trim(), message: m.message.trim() }),
    });
    /*
     * The server answers 200 with an outcome in the body, so a refusal is
     * read from the body rather than from the status. It says which:
     * "this deployment has no relay" and "it was not delivered" are
     * different things to be told, and only one of them is worth pressing
     * Send again for.
     */
    const body = (await res.json().catch(() => null)) as
      | { ok?: unknown; canReply?: unknown; reason?: unknown }
      | null;
    if (!res.ok || body === null) return { ok: false, reason: 'failed' };
    if (body.ok === true) return { ok: true, canReply: body.canReply === true };
    return { ok: false, reason: body.reason === 'not-configured' ? 'not-configured' : 'failed' };
  } catch {
    return { ok: false, reason: 'failed' };
  }
}
