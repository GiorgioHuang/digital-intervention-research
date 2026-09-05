import type { Pool } from '@platform/database';
import type { ParticipantQueryPort, ParticipantView, PublicName } from '../contracts/index.js';

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
    /*
     * Reads the public profile and NOTHING else. There is deliberately no
     * join to the participants table and no COALESCE onto its
     * display_name: a participant who has chosen no public name is absent
     * from this map, and the screens turn that absence into the uniform
     * placeholder. A fallback here would quietly undo the separation the
     * table exists to make (§354).
     */
    async findPublicNames(participantIds: string[]): Promise<Map<string, PublicName>> {
      if (participantIds.length === 0) return new Map();
      const res = await pool.query(
        `SELECT participant_id, chosen_name, city
           FROM public_profile.public_profiles WHERE participant_id = ANY($1::text[])`,
        [[...new Set(participantIds)]],
      );
      return new Map(
        res.rows.map((r) => [
          r.participant_id as string,
          { chosenName: r.chosen_name as string, city: (r.city as string | null) ?? null },
        ]),
      );
    },
  };
}
