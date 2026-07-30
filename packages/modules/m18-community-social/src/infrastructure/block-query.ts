import type { Pool } from '@platform/database';
import type { BlockQueryPort } from '../contracts/index.js';

/** Fresh read on every call — Block authority is never cached (ADR-016). */
export function createBlockQuery(pool: Pool): BlockQueryPort {
  return {
    async findActiveBlocksInvolving(ids: readonly string[]) {
      if (ids.length === 0) return [];
      const res = await pool.query(
        `SELECT blocker_actor_id, blocked_actor_id, block_state
           FROM community_social.block_records
          WHERE block_state = 'Active'
            AND (blocker_actor_id = ANY($1) OR blocked_actor_id = ANY($1))`,
        [ids],
      );
      return res.rows.map((r) => ({
        blockerActorId: r.blocker_actor_id,
        blockedActorId: r.blocked_actor_id,
        state: r.block_state,
      }));
    },
  };
}
