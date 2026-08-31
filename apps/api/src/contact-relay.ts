/**
 * "Get in touch" — carrying a message from the about screen to the study
 * team.
 *
 * The shape is the owner's own contact relay (`g-portfolio`): a browser
 * posts `{ name, contact, message }` and something forwards it to Telegram
 * with the token held out of reach. The forwarding lives here, in the API,
 * rather than in a Cloudflare Worker as first built — the two values it
 * needs are already in GCP Secret Manager, which the Worker cannot read,
 * and a second copy of a credential exists only to drift from the first.
 *
 * The reason to be careful about it is unchanged and worth keeping written
 * down: this is the one route the platform answers without an actor. It
 * takes nothing from the database, reads no context, and returns nothing
 * about anybody — so it cannot leak a record. What it can be is abused,
 * which is what the limits below are for.
 *
 * **What crosses this boundary.** The screen invites somebody to write
 * freely, so a message may carry health information, distress, or another
 * person's name, and it goes to a service outside this platform's audit
 * trail and permission engine (B-25). Nothing here logs the body, and
 * nothing that does should be added.
 */

/** The limits the browser holds too, so the two agree. */
export const MAX_MESSAGE = 4000;
export const MAX_FIELD = 200;

export interface ContactRelayConfig {
  botToken: string;
  chatId: string;
}

export interface ContactPayload {
  name: string;
  contact: string;
  message: string;
  /** The honeypot. A bot fills it; a person never sees it. */
  website?: string;
}

export type RelayOutcome =
  | { ok: true; canReply: boolean }
  | { ok: false; reason: 'no-message' | 'too-long' | 'not-configured' | 'delivery-failed' };

const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');

/**
 * What is wrong with this message, or nothing.
 *
 * Pure, and separate from sending, so the rules can be exercised without a
 * network and without a token.
 */
export function checkPayload(body: ContactPayload): Extract<RelayOutcome, { ok: false }> | null {
  if (str(body.message) === '') return { ok: false, reason: 'no-message' };
  /*
   * Refused, not trimmed. The relay this was adapted from slices to the
   * limit and forwards what survived, so a long message arrives with the
   * end missing and nobody is told. On a platform whose promise is that
   * somebody's words stay their words that is the wrong failure — and the
   * browser refuses at these same numbers, so a message either arrives
   * whole or does not arrive.
   */
  if (
    str(body.message).length > MAX_MESSAGE ||
    str(body.name).length > MAX_FIELD ||
    str(body.contact).length > MAX_FIELD
  ) {
    return { ok: false, reason: 'too-long' };
  }
  return null;
}

/**
 * The text that arrives at the other end.
 *
 * Pure and exported so the one thing that matters about it can be tested:
 * a message from somebody who left no way to be reached says so, loudly,
 * at the top. Whoever reads it needs to know before they start composing
 * a reply that there is nowhere to send one.
 */
export function relayText(body: ContactPayload): string {
  const name = str(body.name);
  const contact = str(body.contact);
  return (
    'A message from the icareu about page\n\n' +
    `Name: ${name === '' ? 'Not given' : name}\n` +
    `Reply to: ${contact === '' ? 'NOT GIVEN — this person cannot be answered' : contact}\n\n` +
    str(body.message)
  );
}

/**
 * Send it, or say why not.
 *
 * `fetchImpl` is a parameter so the failure paths — a refusal from the
 * far end, a network that is not there — can be exercised without one.
 */
export async function relayContactMessage(
  body: ContactPayload,
  config: ContactRelayConfig | undefined,
  fetchImpl: typeof fetch = fetch,
): Promise<RelayOutcome> {
  // The honeypot answers success without sending: a bot told it failed
  // tries again, and telling it nothing is what makes the trap work.
  if (str(body.website) !== '') return { ok: true, canReply: false };

  const bad = checkPayload(body);
  if (bad !== null) return bad;
  if (config === undefined) return { ok: false, reason: 'not-configured' };

  try {
    const res = await fetchImpl(`https://api.telegram.org/bot${config.botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: config.chatId,
        text: relayText(body),
        disable_web_page_preview: true,
      }),
    });
    if (!res.ok) return { ok: false, reason: 'delivery-failed' };
    return { ok: true, canReply: str(body.contact) !== '' };
  } catch {
    return { ok: false, reason: 'delivery-failed' };
  }
}
