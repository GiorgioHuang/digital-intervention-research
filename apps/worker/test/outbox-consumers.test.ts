import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import pino from 'pino';
import { EventDispatcher, publishOutboxBatch } from '../src/outbox-publisher.js';

const ROOT = join(process.cwd(), '..', '..');
const logger = pino({ level: 'silent' });

/**
 * A stub pool that records every statement. `claimPendingOutbox` is the
 * only query whose result shape matters; everything else is a write.
 */
function stubPool(events: { id: string; event_type: string }[]) {
  const statements: string[] = [];
  const client = {
    query: async (sql: string) => {
      statements.push(sql);
      if (sql.includes("SET publication_state = 'Publishing'")) {
        return {
          rows: events.map((e) => ({
            ...e,
            event_category: 'Domain',
            event_schema_version: 1,
            source_module: 'M05',
            aggregate_type: 'Enrolment',
            aggregate_id: 'en_1',
            payload: {},
            attempt_count: 1,
          })),
        };
      }
      // A first delivery: the inbox insert affected a row.
      return { rows: [], rowCount: sql.includes('inbox_messages') ? 1 : 0 };
    },
    release: () => undefined,
  };
  return { pool: { connect: async () => client } as never, statements };
}

/**
 * What the outbox actually guarantees.
 *
 * The machinery around it — inbox deduplication, exponential-backoff
 * retry, dead-lettering after ten attempts, a visibility timeout that
 * recovers messages from a publisher that died mid-flight — all reads as
 * reliable delivery, and it is: `EventDispatcher` will faithfully hand
 * each event to every consumer registered for it. No consumer is
 * registered. `register()` is not called anywhere in this repository, so
 * every domain event the platform has ever emitted was claimed,
 * dispatched to nobody, and marked **Published** — a word that reads as
 * "delivered and acted upon".
 *
 * That is defensible as an MVP position; what is not defensible is a
 * screen telling a coordinator that withdrawal "propagates to related
 * records" on the strength of it. Withdrawal is enforced where the
 * platform can actually enforce it: at the moment of the write, in M07
 * and M08 (see D-52).
 */
describe('the outbox’s real delivery guarantee', () => {
  it('marks an event Published after handing it to nobody', async () => {
    const { pool, statements } = stubPool([{ id: 'ob_1', event_type: 'ParticipantWithdrawn' }]);
    const handled = await publishOutboxBatch(pool, new EventDispatcher(), logger);

    expect(handled).toBe(1);
    // No inbox row was written, because there was no consumer to dedupe for.
    expect(statements.some((s) => s.includes('inbox'))).toBe(false);
    // And the message is Published all the same.
    expect(statements.some((s) => s.includes("SET publication_state = 'Published'"))).toBe(true);
  });

  it('would deliver, if anything had asked to receive', async () => {
    const { pool } = stubPool([{ id: 'ob_2', event_type: 'ParticipantWithdrawn' }]);
    const dispatcher = new EventDispatcher();
    const seen: string[] = [];
    dispatcher.register('ParticipantWithdrawn', 'test-consumer', async (m) => {
      seen.push(m.id);
    });
    await publishOutboxBatch(pool, dispatcher, logger);
    // The mechanism works. Nothing in the platform uses it.
    expect(seen).toEqual(['ob_2']);
  });

  /**
   * The tripwire. If a consumer is ever registered, this fails — and the
   * failure is the reminder that D-52's reasoning, and the withdrawal
   * wording that rests on it ("It does not reach back"), have to be
   * revisited before the consumer lands, not after.
   */
  it('has no registered consumer anywhere in the platform', () => {
    let out = '';
    try {
      // git grep exits 1 on no match, which is the outcome under test.
      out = execFileSync('git', ['grep', '-nE', '--untracked', '\\.register\\(', '--', 'apps', 'packages'], {
        cwd: ROOT,
        encoding: 'utf8',
      });
    } catch (e) {
      out = (e as { stdout?: string }).stdout ?? '';
    }
    const hits = out.split('\n').filter((l) => l.length > 0 && !l.startsWith('apps/worker/test/'));
    expect(hits, 'a consumer now exists — revisit D-52 and the withdrawal wording').toEqual([]);
  });
});
