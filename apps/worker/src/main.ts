import PgBoss from 'pg-boss';
import { pino } from 'pino';
import { z } from 'zod';
import { createPool } from '@platform/database';
import { redact } from '@platform/kernel';
import { EventDispatcher, startOutboxLoop } from './outbox-publisher.js';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

export const IDEMPOTENCY_CLEANUP_QUEUE = 'idempotency-cleanup';

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
