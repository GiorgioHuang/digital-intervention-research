/**
 * Sending a message to the people who run the study.
 *
 * The shape is the owner's own contact relay, taken from the portfolio
 * (`cloudflare-worker/worker.js`): the browser POSTs `{ name, contact,
 * message }` as JSON to a Worker, and the Worker forwards it. Nothing about
 * the destination is known here, and nothing about it may be — the relay
 * holds its own secrets, and a token in a browser bundle is a token
 * published.
 *
 * The endpoint is configuration, not a literal. The portfolio can hardcode
 * its own address because it is one site; this bundle is deployed by a
 * workflow, and a hardcoded address would mean a fork, a local build or a
 * staging deployment all posting participants' messages to the production
 * relay.
 *
 * Read when it is needed rather than captured at module load: a `const`
 * would freeze the value the first time anything imported this file, which
 * makes the unconfigured case — the one where the about screen has no way
 * to reach anybody — impossible to exercise without reloading modules.
 * Configuration that can only be observed once is configuration nobody
 * tests.
 *
 * A `const` here would freeze the value the first time anything imported
 * this file, which makes the unconfigured case — the one where the about
 * screen has no way to reach anybody — impossible to exercise without
 * reloading modules. Configuration that can only be observed once is
 * configuration nobody tests.
 */
export function contactEndpoint(): string {
  return (import.meta.env['VITE_CONTACT_ENDPOINT'] as string | undefined) ?? '';
}

/**
 * The relay's own limits, enforced here as well.
 *
 * `worker.js` silently truncates: `clean()` slices to 4000 and 200 and
 * sends what is left. On a platform whose promise is that somebody's words
 * stay their words, a message that arrives with the end quietly removed —
 * and no indication to the person who wrote it that anything was cut — is
 * the wrong failure. Held to the same numbers so the browser can say so
 * before anything is sent.
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
export async function sendContactMessage(m: ContactMessage, endpoint = contactEndpoint()): Promise<ContactResult> {
  const bad = checkContactMessage(m);
  if (bad !== null) return bad;
  if (endpoint === '') return { ok: false, reason: 'not-configured' };
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: m.name.trim(), contact: m.contact.trim(), message: m.message.trim() }),
    });
    if (!res.ok) return { ok: false, reason: 'failed' };
    return { ok: true, canReply: m.contact.trim() !== '' };
  } catch {
    return { ok: false, reason: 'failed' };
  }
}
