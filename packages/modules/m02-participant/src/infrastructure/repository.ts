import type { Pool } from '@platform/database';
import type { ParticipantQueryPort, ParticipantView } from '../contracts/index.js';

export function createParticipantQuery(pool: Pool): ParticipantQueryPort {
  return {
    async findParticipant(participantId: string): Promise<ParticipantView | undefined> {
      const res = await pool.query(
        `SELECT id, user_account_id, display_name, participant_state
           FROM participant_profile.participants WHERE id = $1`,
        [participantId],
      );
      const row = res.rows[0];
      if (row === undefined) return undefined;
      return {
        id: row.id,
        userAccountId: row.user_account_id ?? undefined,
        displayName: row.display_name,
        state: row.participant_state,
      };
    },
    async findParticipantIdByAccount(userAccountId: string): Promise<string | undefined> {
      const res = await pool.query(
        `SELECT id FROM participant_profile.participants WHERE user_account_id = $1`,
        [userAccountId],
      );
      return res.rows[0]?.id;
    },
    async findDisplayNames(participantIds: string[]): Promise<Map<string, string>> {
      if (participantIds.length === 0) return new Map();
      const res = await pool.query(
        `SELECT id, display_name FROM participant_profile.participants WHERE id = ANY($1::text[])`,
        [[...new Set(participantIds)]],
      );
      return new Map(res.rows.map((r) => [r.id as string, r.display_name as string]));
    },
  };
}
