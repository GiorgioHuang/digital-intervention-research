import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import pg from 'pg';
import { createRequestContext } from '@platform/kernel';
import { recordAuditEvent } from '../src/audit.js';
import { migrate } from '../src/migrate.js';
import {
  appendToOutbox,
  claimPendingOutbox,
  markOutboxPublished,
  registerInboxMessage,
} from '../src/outbox.js';
import { createPool, withTransaction } from '../src/pool.js';

const DATABASE_URL =
  process.env['DATABASE_URL'] ?? 'postgres://platform:platform_dev_only@localhost:5432/research_platform';

async function probeDatabase(): Promise<boolean> {
  const client = new pg.Client({ connectionString: DATABASE_URL, connectionTimeoutMillis: 2000 });
  try {
    await client.connect();
    await client.end();
    return true;
  } catch {
    return false;
  }
}

const dbAvailable = await probeDatabase();

describe.skipIf(!dbAvailable)('database integration (requires PostgreSQL)', () => {
  let pool: pg.Pool;
  const ctx = createRequestContext({
    actor: { type: 'service-account', id: 'sa_test' },
    purposeCode: 'testing',
  });

  beforeAll(async () => {
    // Migration drill: down to zero, then up — proves reversibility.
    await migrate({ databaseUrl: DATABASE_URL, direction: 'up' });
    await migrate({ databaseUrl: DATABASE_URL, direction: 'down' });
    await migrate({ databaseUrl: DATABASE_URL, direction: 'up' });
    pool = createPool({ connectionString: DATABASE_URL, applicationName: 'db-tests' });
  });

  afterAll(async () => {
    await pool?.end();
  });

  it('outbox append is atomic with the surrounding transaction (ADR-015)', async () => {
    const aggregateId = `agg_rollback_${Date.now()}`;
    await expect(
      withTransaction(pool, async (client) => {
        await appendToOutbox(client, ctx, {
          eventCategory: 'Domain',
          eventType: 'UserAccountCreated',
          sourceModule: 'M01',
          aggregateType: 'UserAccount',
          aggregateId,
          occurredAt: new Date(),
        });
        throw new Error('force rollback');
      }),
    ).rejects.toThrow('force rollback');

    const res = await pool.query(
      'SELECT count(*)::int AS n FROM platform_kernel.outbox_messages WHERE aggregate_id = $1',
      [aggregateId],
    );
    expect(res.rows[0].n).toBe(0);
  });

  it('claim/publish lifecycle works and does not double-claim', async () => {
    const aggregateId = `agg_claim_${Date.now()}`;
    await withTransaction(pool, async (client) => {
      await appendToOutbox(client, ctx, {
        eventCategory: 'Domain',
        eventType: 'UserAccountCreated',
        sourceModule: 'M01',
        aggregateType: 'UserAccount',
        aggregateId,
        occurredAt: new Date(),
      });
    });

    const claimed = await withTransaction(pool, (client) => claimPendingOutbox(client, 100, new Date()));
    const mine = claimed.filter((m) => m.aggregateId === aggregateId);
    expect(mine).toHaveLength(1);

    const claimedAgain = await withTransaction(pool, (client) => claimPendingOutbox(client, 100, new Date()));
    expect(claimedAgain.filter((m) => m.aggregateId === aggregateId)).toHaveLength(0);

    await withTransaction(pool, (client) => markOutboxPublished(client, mine[0]!.id, new Date()));
    const res = await pool.query('SELECT publication_state FROM platform_kernel.outbox_messages WHERE id = $1', [
      mine[0]!.id,
    ]);
    expect(res.rows[0].publication_state).toBe('Published');
  });

  it('outbox rejects unknown event categories and modules (CHECK constraints)', async () => {
    await expect(
      withTransaction(pool, (client) =>
        client.query(
          `INSERT INTO platform_kernel.outbox_messages
             (id, event_category, event_type, source_module, aggregate_type, aggregate_id, occurred_at)
           VALUES (gen_random_uuid(), 'UXAnalytics', 'ClickHappened', 'M01', 'X', 'x', now())`,
        ),
      ),
    ).rejects.toThrow(/check constraint/i);

    await expect(
      withTransaction(pool, (client) =>
        client.query(
          `INSERT INTO platform_kernel.outbox_messages
             (id, event_category, event_type, source_module, aggregate_type, aggregate_id, occurred_at)
           VALUES (gen_random_uuid(), 'Domain', 'SomethingHappened', 'M99', 'X', 'x', now())`,
        ),
      ),
    ).rejects.toThrow(/check constraint/i);
  });

  it('inbox registration is idempotent per consumer', async () => {
    const messageId = crypto.randomUUID();
    const first = await withTransaction(pool, (client) =>
      registerInboxMessage(client, 'test-consumer', messageId, 'UserAccountCreated'),
    );
    const second = await withTransaction(pool, (client) =>
      registerInboxMessage(client, 'test-consumer', messageId, 'UserAccountCreated'),
    );
    const otherConsumer = await withTransaction(pool, (client) =>
      registerInboxMessage(client, 'another-consumer', messageId, 'UserAccountCreated'),
    );
    expect(first).toBe(true);
    expect(second).toBe(false);
    expect(otherConsumer).toBe(true);
  });

  it('idempotency records enforce scope uniqueness (Doc 15 §29)', async () => {
    const key = `key_${Date.now()}`;
    const insert = (hash: string) =>
      withTransaction(pool, (client) =>
        client.query(
          `INSERT INTO platform_kernel.idempotency_records
             (id, actor_id, organisation_id, endpoint, idempotency_key, request_hash, expires_at)
           VALUES (gen_random_uuid(), 'actor_1', 'org_1', 'POST /messages', $1, $2, now() + interval '1 day')`,
          [key, hash],
        ),
      );
    await insert('hash-a');
    await expect(insert('hash-b')).rejects.toThrow(/duplicate key/i);
  });

  it('audit_events is append-only: UPDATE and DELETE are rejected (ADR-051)', async () => {
    const auditId = await withTransaction(pool, (client) =>
      recordAuditEvent(client, ctx, {
        action: 'test.audit',
        targetType: 'TestResource',
        targetId: 'tr_1',
        occurredAt: new Date(),
        result: 'Succeeded',
        source: 'integration-test',
      }),
    );

    await expect(
      pool.query(`UPDATE governance_audit.audit_events SET action = 'tampered' WHERE id = $1`, [auditId]),
    ).rejects.toThrow(/append-only/);
    await expect(
      pool.query(`DELETE FROM governance_audit.audit_events WHERE id = $1`, [auditId]),
    ).rejects.toThrow(/append-only/);
  });
});

describe.skipIf(dbAvailable)('database integration (skipped)', () => {
  it('skipped because no PostgreSQL is reachable at DATABASE_URL', () => {
    expect(dbAvailable).toBe(false);
  });
});
