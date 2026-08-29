import { describe, expect, it } from 'vitest';
import { listMyRecentDecisions, OWN_DECISION_ACTIONS } from '../src/index.js';
import type { M15Deps } from '../src/index.js';

const ctx = { actor: { id: 'acct_margaret', type: 'user' as const } } as never;

const deps = (rows: { action: string; occurred_at: Date }[]) => {
  const queries: { sql: string; params: unknown[] }[] = [];
  return {
    seen: queries,
    deps: {
      pool: {
        query: async (sql: string, params: unknown[]) => {
          queries.push({ sql, params });
          return { rows };
        },
      },
      clock: { now: () => new Date('2026-08-29T00:00:00Z') },
      checkPermission: async () => ({ outcome: 'Allow', reason: 'owner' }),
    } as unknown as M15Deps,
  };
};

/**
 * A participant reading back what they themselves decided.
 *
 * The audit store had sixty-one writers and one reader — the staff view,
 * behind `audit.view`, which no participant holds. This is the second
 * reader and it must never become the first: what is tested here is the
 * three things that keep them apart, because each of them is one line and
 * every one of them fails silently.
 */
describe('what a participant decided', () => {
  it('reads the caller’s own rows, and takes no actor from the caller', async () => {
    const { deps: d, seen } = deps([]);
    await listMyRecentDecisions(d, ctx, 'pt_margaret');
    const q = seen[0]!;
    expect(q.sql, 'the actor is no longer pinned to the caller').toContain('actor_id = $1');
    expect(q.params[0], 'a caller could point this at somebody else').toBe('acct_margaret');
    // Scoped to this participant as well: a supporter who is also a
    // participant must not see what they did in somebody else's archive on
    // their own front page.
    expect(q.sql).toContain('participant_id = $2');
    expect(q.params[1]).toBe('pt_margaret');
    // Refused attempts are not decisions. A participant's own record of
    // what they decided is not the place to re-present something the
    // platform stopped.
    expect(q.sql, "attempts the platform refused are being shown back as decisions").toContain(
      "result = 'Succeeded'",
    );
  });

  /**
   * An allow-list, not a deny-list. Most audited actions are reads, sweeps
   * or staff work, and a new one added anywhere in the platform must be
   * absent from this section until somebody decides it is a decision and
   * writes the words for it.
   */
  it('returns only actions on the allow-list', async () => {
    const { deps: d, seen } = deps([]);
    await listMyRecentDecisions(d, ctx, 'pt_margaret');
    expect(seen[0]!.sql).toContain('action = ANY($3::text[])');
    const allowed = seen[0]!.params[2] as string[];
    expect(allowed).toEqual(Object.keys(OWN_DECISION_ACTIONS));
    for (const read of ['audit.view', 'life-story.view-own', 'enrolment.view', 'moderation.decide']) {
      expect(allowed, `${read} is not a decision this person made about their life`).not.toContain(read);
    }
  });

  it('turns each action into words, and has words for every action it allows', async () => {
    const { deps: d } = deps([
      { action: 'life-story.change-visibility', occurred_at: new Date('2026-08-14T09:00:00Z') },
    ]);
    const out = await listMyRecentDecisions(d, ctx, 'pt_margaret');
    expect(out).toEqual([
      {
        action: 'life-story.change-visibility',
        what: 'Changed who can see part of your story',
        when: '2026-08-14T09:00:00.000Z',
      },
    ]);
    // Every allowed action has a phrase, or a row comes back saying
    // "undefined" in the participant's own history.
    for (const [action, words] of Object.entries(OWN_DECISION_ACTIONS)) {
      expect(words, `${action} has no words`).toMatch(/^[A-Z]/);
    }
  });

  /**
   * The audit store holds references and safe metadata only (Doc 14 §61),
   * so the phrases must stop where the record stops. Nothing here may claim
   * a direction the row does not carry — a contribution review is recorded
   * the same way whether it was accepted or refused, and saying "Accepted"
   * would be inventing the half that matters most.
   */
  it('claims nothing the audit row does not hold', () => {
    expect(OWN_DECISION_ACTIONS['life-story.review-contribution']).toBe(
      'Decided about something offered for your story',
    );
    for (const words of Object.values(OWN_DECISION_ACTIONS)) {
      expect(words, `"${words}" names a person or quotes content`).not.toMatch(/"|“|”/);
    }
  });

  it('bounds what it returns however much is asked for', async () => {
    const { deps: d, seen } = deps([]);
    await listMyRecentDecisions(d, ctx, 'pt_margaret', 10_000);
    expect(seen[0]!.params[3]).toBe(20);
    await listMyRecentDecisions(d, ctx, 'pt_margaret', -5);
    expect(seen[1]!.params[3]).toBe(1);
  });
});
