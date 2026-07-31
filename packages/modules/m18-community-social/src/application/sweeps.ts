import type { RequestContext } from '@platform/kernel';
import { appendToOutbox, recordAuditEvent, withTransaction } from '@platform/database';
import type { M18Deps } from './commands.js';
import { recordDeliveryState } from './messaging-commands.js';

/**
 * Time-driven lifecycle sweeps (scheduler-invoked, system actor). These
 * are deterministic state-machine transitions mandated by configuration
 * (TTLs are config, not architecture — ADR-125 pending): they decide
 * nothing a human owns, they only make elapsed time visible and truthful.
 */

/** Candidates past their expiry stop being actionable (ADR-036). */
export async function expireMatchCandidates(
  deps: M18Deps,
  ctx: RequestContext,
): Promise<{ expired: number }> {
  const now = deps.clock.now();
  return withTransaction(deps.pool, async (client) => {
    const res = await client.query(
      `UPDATE community_social.match_candidates
          SET candidate_state = 'Expired'
        WHERE candidate_state IN ('Generated', 'Available', 'Viewed') AND expires_at <= $1
        RETURNING id`,
      [now],
    );
    for (const row of res.rows) {
      await appendToOutbox(client, ctx, {
        eventCategory: 'Domain',
        eventType: 'MatchCandidateExpired',
        sourceModule: 'M18',
        aggregateType: 'MatchCandidate',
        aggregateId: row.id as string,
        occurredAt: now,
      });
    }
    if (res.rowCount !== null && res.rowCount > 0) {
      await recordAuditEvent(client, ctx, {
        action: 'matching.expire-sweep',
        targetType: 'MatchCandidate',
        targetId: `batch:${res.rowCount}`,
        occurredAt: now,
        result: 'Succeeded',
        source: 'M18',
        policyVersion: 'system-sweep',
      });
    }
    return { expired: res.rowCount ?? 0 };
  });
}

/** Unconsumed mutual acceptances lapse at effective_until (Doc 18 §118). */
export async function expireMutualAcceptances(
  deps: M18Deps,
  ctx: RequestContext,
): Promise<{ expired: number }> {
  const now = deps.clock.now();
  return withTransaction(deps.pool, async (client) => {
    const res = await client.query(
      `UPDATE community_social.mutual_acceptances
          SET acceptance_state = 'Expired'
        WHERE acceptance_state IN ('Recorded', 'Active') AND effective_until <= $1
        RETURNING id`,
      [now],
    );
    for (const row of res.rows) {
      await appendToOutbox(client, ctx, {
        eventCategory: 'Domain',
        eventType: 'MutualAcceptanceExpired',
        sourceModule: 'M18',
        aggregateType: 'MutualAcceptance',
        aggregateId: row.id as string,
        occurredAt: now,
      });
    }
    if (res.rowCount !== null && res.rowCount > 0) {
      await recordAuditEvent(client, ctx, {
        action: 'matching.expire-sweep',
        targetType: 'MutualAcceptance',
        targetId: `batch:${res.rowCount}`,
        occurredAt: now,
        result: 'Succeeded',
        source: 'M18',
        policyVersion: 'system-sweep',
      });
    }
    return { expired: res.rowCount ?? 0 };
  });
}

/**
 * Delivery-unknown reconciliation (ADR-124): a message stuck in a
 * non-terminal provider state past the threshold becomes Delivery
 * Unknown — the truthful state — never silently assumed Delivered.
 * Goes through the M18-owned recordDeliveryState command so the dual
 * state machine and events stay consistent.
 */
export async function reconcileDeliveryUnknown(
  deps: M18Deps,
  ctx: RequestContext,
  config: { staleAfterMs: number },
): Promise<{ reconciled: number }> {
  const now = deps.clock.now();
  const cutoff = new Date(now.getTime() - config.staleAfterMs);
  const res = await deps.pool.query(
    `SELECT id FROM community_social.messages
      WHERE delivery_state IN ('Queued', 'Sent to Provider', 'Provider Accepted')
        AND updated_at <= $1`,
    [cutoff],
  );
  let reconciled = 0;
  for (const row of res.rows) {
    await recordDeliveryState(deps, ctx, { messageId: row.id as string, deliveryState: 'Delivery Unknown' });
    reconciled += 1;
  }
  return { reconciled };
}
