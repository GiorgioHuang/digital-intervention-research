import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import pg from 'pg';
import { FixedClock, PlatformError, createRequestContext } from '@platform/kernel';
import { createPool, migrate } from '@platform/database';
import { expireMatchCandidates, expireMutualAcceptances, reconcileDeliveryUnknown, type M18Deps } from '../src/index.js';

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

const NOW = '2026-07-30T12:00:00Z';
const PAST = '2026-07-30T09:00:00Z';
const FUTURE = '2026-07-31T12:00:00Z';

describe.skipIf(!dbAvailable)('M18 time-driven sweeps (integration)', () => {
  let pool: pg.Pool;
  const clock = new FixedClock(NOW);
  let m18: M18Deps;
  const ctx = () =>
    createRequestContext({
      actor: { type: 'service-account', id: 'sa_scheduler' },
      purposeCode: 'platform-maintenance',
    });
  const run = Date.now() % 1_000_000;

  beforeAll(async () => {
    await migrate({ databaseUrl: DATABASE_URL, direction: 'up' });
    pool = createPool({ connectionString: DATABASE_URL, applicationName: 'm18-sweeps' });
    m18 = {
      pool,
      clock,
      // Sweeps hold no authority — a permission check would be a bug.
      checkPermission: () => {
        throw new PlatformError('AUTHORISATION_DENIED', 'Sweeps hold no authority');
      },
      // Sweeps read no participant names either; resolving one here would
      // be as much a bug as checking a permission.
      participants: {
        findDisplayNames: () => {
          throw new PlatformError('AUTHORISATION_DENIED', 'Sweeps do not read participant names');
        },
      },
    };
  }, 30_000);

  afterAll(async () => {
    await pool?.end();
  });

  it('expires only past-due actionable candidates and emits MatchCandidateExpired', async () => {
    const stale = `cand_sw_stale_${run}`;
    const fresh = `cand_sw_fresh_${run}`;
    await pool.query(
      `INSERT INTO community_social.match_candidates (id, participant_a_id, participant_b_id, match_explanation, expires_at)
       VALUES ($1, 'pt_sw_a', 'pt_sw_b', 'x', $3), ($2, 'pt_sw_a', 'pt_sw_c', 'x', $4)`,
      [stale, fresh, PAST, FUTURE],
    );
    const { expired } = await expireMatchCandidates(m18, ctx());
    expect(expired).toBeGreaterThanOrEqual(1);
    const states = await pool.query(
      `SELECT id, candidate_state FROM community_social.match_candidates WHERE id IN ($1, $2)`,
      [stale, fresh],
    );
    const byId = Object.fromEntries(states.rows.map((r) => [r.id, r.candidate_state]));
    expect(byId[stale]).toBe('Expired');
    expect(byId[fresh]).toBe('Available');
    const ev = await pool.query(
      `SELECT count(*)::int AS n FROM platform_kernel.outbox_messages
        WHERE event_type = 'MatchCandidateExpired' AND aggregate_id = $1`,
      [stale],
    );
    expect(ev.rows[0].n).toBe(1);
  });

  it('expires lapsed unconsumed mutual acceptances but never touches consumed ones', async () => {
    const candA = `cand_sw_ma_${run}`;
    const candB = `cand_sw_mb_${run}`;
    const lapsed = `ma_sw_lapsed_${run}`;
    const consumed = `ma_sw_consumed_${run}`;
    const conn = `conn_sw_${run}`;
    await pool.query(
      `INSERT INTO community_social.match_candidates (id, participant_a_id, participant_b_id, match_explanation, expires_at)
       VALUES ($1, 'pt_sw_a', 'pt_sw_b', 'x', $3), ($2, 'pt_sw_a', 'pt_sw_c', 'x', $3)`,
      [candA, candB, FUTURE],
    );
    await pool.query(
      `INSERT INTO community_social.mutual_acceptances (id, match_candidate_id, participant_a_id, participant_b_id, acceptance_state, policy_version, effective_until, connection_id)
       VALUES ($1, $3, 'pt_sw_a', 'pt_sw_b', 'Active', 'p', $5, NULL),
              ($2, $4, 'pt_sw_a', 'pt_sw_c', 'Consumed', 'p', $6, $7)`,
      [lapsed, consumed, candA, candB, PAST, PAST, conn],
    );
    await pool.query(
      `INSERT INTO community_social.connections (id, mutual_acceptance_id, participant_a_id, participant_b_id)
       VALUES ($1, $2, 'pt_sw_a', 'pt_sw_c')`,
      [conn, consumed],
    );
    await expireMutualAcceptances(m18, ctx());
    const states = await pool.query(
      `SELECT id, acceptance_state FROM community_social.mutual_acceptances WHERE id IN ($1, $2)`,
      [lapsed, consumed],
    );
    const byId = Object.fromEntries(states.rows.map((r) => [r.id, r.acceptance_state]));
    // Lapsed unconsumed acceptance expires; the consumed one is history
    // bound to its connection and stays Consumed.
    expect(byId[lapsed]).toBe('Expired');
    expect(byId[consumed]).toBe('Consumed');
  });

  it('moves stale in-flight messages to Delivery Unknown — never to Delivered', async () => {
    const thread = `th_sw_${run}`;
    const staleMsg = `msg_sw_stale_${run}`;
    const doneMsg = `msg_sw_done_${run}`;
    await pool.query(
      `INSERT INTO community_social.conversation_threads (id, basis_type, basis_reference, participant_a_id, participant_b_id)
       VALUES ($1, 'ActiveConnection', 'conn_sw_ref', 'pt_sw_a', 'pt_sw_b')`,
      [thread],
    );
    await pool.query(
      `INSERT INTO community_social.messages (id, thread_id, sender_participant_id, content_text, lifecycle_state, delivery_state, updated_at)
       VALUES ($1, $3, 'pt_sw_a', 'x', 'Sent', 'Provider Accepted', $4),
              ($2, $3, 'pt_sw_a', 'x', 'Sent', 'Delivered', $4)`,
      [staleMsg, doneMsg, thread, PAST],
    );
    const { reconciled } = await reconcileDeliveryUnknown(m18, ctx(), { staleAfterMs: 2 * 60 * 60 * 1000 });
    expect(reconciled).toBeGreaterThanOrEqual(1);
    const states = await pool.query(
      `SELECT id, delivery_state FROM community_social.messages WHERE id IN ($1, $2)`,
      [staleMsg, doneMsg],
    );
    const byId = Object.fromEntries(states.rows.map((r) => [r.id, r.delivery_state]));
    expect(byId[staleMsg]).toBe('Delivery Unknown');
    // Terminal states are untouched: reconciliation never invents success.
    expect(byId[doneMsg]).toBe('Delivered');
  });
});

describe.skipIf(dbAvailable)('M18 sweeps (skipped)', () => {
  it('skipped because no PostgreSQL is reachable', () => {
    expect(dbAvailable).toBe(false);
  });
});
