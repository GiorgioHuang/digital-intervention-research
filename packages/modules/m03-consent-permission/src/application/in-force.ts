/**
 * Whether a relationship is in force, worked out when somebody asks.
 *
 * `relationship_state` is moved to 'Expired' by a scheduled sweep. The
 * owner's ruling (2026-09-02) is that there is no worker, so nothing
 * moves it — and a relationship that ran out last month still reads
 * 'Active' in the column, for ever.
 *
 * The permission engine was never fooled by that: it compares `expiresAt`
 * against the clock every time it decides, and the messaging commands do
 * the same. So an expired relationship has never been able to authorise
 * anything. What it could do is be DESCRIBED wrongly — the screen that
 * tells a participant who has access to their information read the stored
 * column and said "Active" over a relationship that had lapsed. That is
 * the same fault as telling somebody their community can see a memory
 * nobody can reach: it is not a leak, it is the platform being wrong
 * about who can read them, in the direction that worries a person more.
 *
 * Pure and separate so every reader can use the one rule, and so the
 * awkward cases — no expiry at all, an expiry exactly now, a state that
 * is not Active — are ordinary tests.
 */

/**
 * The state a relationship is really in.
 *
 * Only ever narrows: a relationship that has lapsed reads 'Expired', and
 * nothing else is rewritten. A Revoked or Suspended relationship whose
 * expiry has also passed stays Revoked or Suspended — what somebody did
 * deliberately is a better description than what time did afterwards.
 */
export function relationshipStateNow(storedState: string, expiresAt: Date | null, now: Date): string {
  if (storedState !== 'Active') return storedState;
  if (expiresAt === null) return storedState;
  // `<=`, matching the sweep: an expiry that has arrived has passed.
  return expiresAt <= now ? 'Expired' : storedState;
}

/** Whether it authorises anything at this moment. */
export function relationshipInForce(storedState: string, expiresAt: Date | null, now: Date): boolean {
  return relationshipStateNow(storedState, expiresAt, now) === 'Active';
}
