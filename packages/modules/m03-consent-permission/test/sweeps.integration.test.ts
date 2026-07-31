import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import pg from 'pg';
import { FixedClock, createRequestContext } from '@platform/kernel';
import { createPool, migrate } from '@platform/database';
import { expireRelationships } from '../src/index.js';

const DATABASE_URL =
  process.env['DATABASE_URL'] ?? 'postgres://platform:platform_dev_only@localhost:5432/research_platform';

async function probe(): Promise<boolean> {
  const c = new pg.Client({ connectionString: DATABASE_URL, connectionTimeoutMillis: 2000 });
  try {
    await c.connect();
    await c.end();
    return true;
  } catch {
    return false;
  }
}
const dbAvailable = await probe();

describe.skipIf(!dbAvailable)('M03 relationship expiry sweep (integration)', () => {
  let pool: pg.Pool;
  const clock = new FixedClock('2026-07-30T12:00:00Z');
  const run = Date.now() % 1_000_000;

  beforeAll(async () => {
    await migrate({ databaseUrl: DATABASE_URL, direction: 'up' });
    pool = createPool({ connectionString: DATABASE_URL, applicationName: 'm03-sweeps' });
  }, 30_000);

  afterAll(async () => {
    await pool?.end();
  });

  it('expires only Active relationships past expires_at; open-ended ones stay Active', async () => {
    const lapsed = `rel_sw_lapsed_${run}`;
    const openEnded = `rel_sw_open_${run}`;
    await pool.query(
      `INSERT INTO consent_permission.relationships
         (id, participant_id, related_actor_id, relationship_type, relationship_state, permitted_actions, expires_at, proposed_by_actor_id)
       VALUES ($1, 'pt_sw_rel', 'actor_sw_x', 'Friend', 'Active', '{}', '2026-07-30T09:00:00Z', 'actor_sw_p'),
              ($2, 'pt_sw_rel', 'actor_sw_y', 'Friend', 'Active', '{}', NULL, 'actor_sw_p')`,
      [lapsed, openEnded],
    );
    const ctx = createRequestContext({
      actor: { type: 'service-account', id: 'sa_scheduler' },
      purposeCode: 'platform-maintenance',
    });
    const { expired } = await expireRelationships({ pool, clock }, ctx);
    expect(expired).toBeGreaterThanOrEqual(1);
    const states = await pool.query(
      `SELECT id, relationship_state FROM consent_permission.relationships WHERE id IN ($1, $2)`,
      [lapsed, openEnded],
    );
    const byId = Object.fromEntries(states.rows.map((r) => [r.id, r.relationship_state]));
    expect(byId[lapsed]).toBe('Expired');
    expect(byId[openEnded]).toBe('Active');
    const ev = await pool.query(
      `SELECT count(*)::int AS n FROM platform_kernel.outbox_messages
        WHERE event_type = 'RelationshipExpired' AND aggregate_id = $1`,
      [lapsed],
    );
    expect(ev.rows[0].n).toBe(1);
  });
});

describe.skipIf(dbAvailable)('M03 sweeps (skipped)', () => {
  it('skipped because no PostgreSQL is reachable', () => {
    expect(dbAvailable).toBe(false);
  });
});
