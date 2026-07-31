import PgBoss from 'pg-boss';
import { pino } from 'pino';
import { z } from 'zod';
import { createPool, recoverStalePublishing, withTransaction } from '@platform/database';
import { PlatformError, SystemClock, createRequestContext, redact } from '@platform/kernel';
import { expireRelationships } from '@platform/m03-consent-permission';
import { scanPendingObjects } from '@platform/m16-integration';
import {
  expireMatchCandidates,
  expireMutualAcceptances,
  reconcileDeliveryUnknown,
} from '@platform/m18-community-social';
import { EventDispatcher, startOutboxLoop } from './outbox-publisher.js';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  // Config-driven threshold (ADR-124): how long a message may sit in a
  // non-terminal provider state before it becomes Delivery Unknown.
  DELIVERY_UNKNOWN_AFTER_MINUTES: z.coerce.number().int().positive().default(120),
});

export const IDEMPOTENCY_CLEANUP_QUEUE = 'idempotency-cleanup';
export const SWEEP_QUEUES = [
  'match-candidate-expiry',
  'mutual-acceptance-expiry',
  'relationship-expiry',
  'delivery-unknown-reconciliation',
  'outbox-stale-recovery',
  'object-scan',
] as const;

async function main(): Promise<void> {
  const env = envSchema.parse(process.env);
  const logger = pino({
    name: 'worker',
    level: env.LOG_LEVEL,
    formatters: { log: (o) => redact(o) as Record<string, unknown> },
  });

  const pool = createPool({ connectionString: env.DATABASE_URL, applicationName: 'worker' });
  const boss = new PgBoss({ connectionString: env.DATABASE_URL, schema: 'platform_jobs' });
  boss.on('error', (err) => logger.error({ err }, 'pg-boss error'));
  await boss.start();
  await boss.createQueue(IDEMPOTENCY_CLEANUP_QUEUE);

  await boss.work(IDEMPOTENCY_CLEANUP_QUEUE, async () => {
    const res = await pool.query(
      `DELETE FROM platform_kernel.idempotency_records WHERE expires_at < now()`,
    );
    logger.info({ deleted: res.rowCount }, 'expired idempotency records cleaned up');
  });

  // Time-driven lifecycle sweeps run as the scheduler service account:
  // they enforce elapsed time, they hold no human authority. The stub
  // permission check fails closed — sweeps must never need one.
  const clock = new SystemClock();
  const sweepCtx = () =>
    createRequestContext({
      actor: { type: 'service-account', id: 'sa_scheduler' },
      purposeCode: 'platform-maintenance',
    });
  const sweepDeps = {
    pool,
    clock,
    checkPermission: () => {
      throw new PlatformError('AUTHORISATION_DENIED', 'Sweeps hold no authority');
    },
  };
  for (const queue of SWEEP_QUEUES) await boss.createQueue(queue);
  await boss.work('match-candidate-expiry', async () => {
    const { expired } = await expireMatchCandidates(sweepDeps, sweepCtx());
    if (expired > 0) logger.info({ expired }, 'match candidates expired');
  });
  await boss.work('mutual-acceptance-expiry', async () => {
    const { expired } = await expireMutualAcceptances(sweepDeps, sweepCtx());
    if (expired > 0) logger.info({ expired }, 'mutual acceptances expired');
  });
  await boss.work('relationship-expiry', async () => {
    const { expired } = await expireRelationships({ pool, clock }, sweepCtx());
    if (expired > 0) logger.info({ expired }, 'relationships expired');
  });
  await boss.work('delivery-unknown-reconciliation', async () => {
    const { reconciled } = await reconcileDeliveryUnknown(sweepDeps, sweepCtx(), {
      staleAfterMs: env.DELIVERY_UNKNOWN_AFTER_MINUTES * 60_000,
    });
    if (reconciled > 0) logger.warn({ reconciled }, 'messages moved to Delivery Unknown (never assumed delivered)');
  });
  await boss.work('object-scan', async () => {
    const { scanned } = await scanPendingObjects(sweepDeps, sweepCtx());
    if (scanned > 0) logger.info({ scanned }, 'quarantined objects scanned');
  });
  await boss.work('outbox-stale-recovery', async () => {
    const recovered = await withTransaction(pool, (client) => recoverStalePublishing(client, clock.now()));
    if (recovered > 0) logger.warn({ recovered }, 'stale Publishing outbox rows returned to Pending');
  });

  // Event consumers register here as modules land (P2+). Empty registry for now.
  const dispatcher = new EventDispatcher();
  const stopOutbox = startOutboxLoop(pool, dispatcher, logger);

  logger.info('Worker process started (outbox publisher + job queues)');

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'worker shutting down');
    stopOutbox();
    await boss.stop({ graceful: true });
    await pool.end();
    process.exit(0);
  };
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

main().catch((err) => {
  console.error('Worker failed to start', err);
  process.exit(1);
});
