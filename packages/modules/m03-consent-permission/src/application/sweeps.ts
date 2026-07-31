import type { Clock, RequestContext } from '@platform/kernel';
import { appendToOutbox, recordAuditEvent, withTransaction, type Pool } from '@platform/database';

/** Sweeps need no permission service: they are time, not authority. */
export interface SweepDeps {
  pool: Pool;
  clock: Clock;
}

/**
 * Relationship expiry sweep (scheduler-invoked, system actor): an Active
 * relationship past its expires_at stops granting anything. The
 * permission engine already refuses expired relationships at use time
 * (fail closed); this sweep makes the stored state match reality and
 * emits the lifecycle event. Consent expiry deliberately has NO sweep:
 * it is evaluated at use time per decision (Doc 4).
 */
export async function expireRelationships(
  deps: SweepDeps,
  ctx: RequestContext,
): Promise<{ expired: number }> {
  const now = deps.clock.now();
  return withTransaction(deps.pool, async (client) => {
    const res = await client.query(
      `UPDATE consent_permission.relationships
          SET relationship_state = 'Expired', record_version = record_version + 1, updated_at = $1
        WHERE relationship_state = 'Active' AND expires_at IS NOT NULL AND expires_at <= $1
        RETURNING id, participant_id`,
      [now],
    );
    for (const row of res.rows) {
      await appendToOutbox(client, ctx, {
        eventCategory: 'Domain',
        eventType: 'RelationshipExpired',
        sourceModule: 'M03',
        aggregateType: 'Relationship',
        aggregateId: row.id as string,
        occurredAt: now,
      });
    }
    if (res.rowCount !== null && res.rowCount > 0) {
      await recordAuditEvent(client, ctx, {
        action: 'relationship.expire-sweep',
        targetType: 'Relationship',
        targetId: `batch:${res.rowCount}`,
        occurredAt: now,
        result: 'Succeeded',
        source: 'M03',
        policyVersion: 'system-sweep',
      });
    }
    return { expired: res.rowCount ?? 0 };
  });
}
