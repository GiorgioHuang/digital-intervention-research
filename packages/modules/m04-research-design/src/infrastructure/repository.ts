import type { Pool } from '@platform/database';
import type { ProtocolVersionQueryPort, ProtocolVersionView } from '../contracts/index.js';

export function createProtocolVersionQuery(pool: Pool): ProtocolVersionQueryPort {
  return {
    async findProtocolVersion(id: string): Promise<ProtocolVersionView | undefined> {
      const res = await pool.query(
        `SELECT v.id, v.protocol_id, v.version_number, v.version_state, p.research_project_id
           FROM research_design.protocol_versions v
           JOIN research_design.protocols p ON p.id = v.protocol_id
          WHERE v.id = $1`,
        [id],
      );
      const row = res.rows[0];
      if (row === undefined) return undefined;
      return {
        id: row.id,
        protocolId: row.protocol_id,
        versionNumber: row.version_number,
        state: row.version_state,
        researchProjectId: row.research_project_id,
      };
    },
  };
}
