import PgBoss from 'pg-boss';
import { pino } from 'pino';
import { z } from 'zod';
import { redact } from '@platform/kernel';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

/**
 * Scheduler process: owns recurring schedules only; the Worker executes the
 * jobs. Future schedules land here as modules arrive: reconciliation runs,
 * MutualAcceptance/MatchCandidate expiry sweeps, retention reviews,
 * delivery-unknown escalation (ADR-124).
 */
async function main(): Promise<void> {
  const env = envSchema.parse(process.env);
  const logger = pino({
    name: 'scheduler',
    level: env.LOG_LEVEL,
    formatters: { log: (o) => redact(o) as Record<string, unknown> },
  });

  const boss = new PgBoss({ connectionString: env.DATABASE_URL, schema: 'platform_jobs' });
  boss.on('error', (err) => logger.error({ err }, 'pg-boss error'));
  await boss.start();

  await boss.createQueue('idempotency-cleanup');
  await boss.schedule('idempotency-cleanup', '15 * * * *');
  logger.info('Scheduler started: idempotency-cleanup hourly at :15');

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'scheduler shutting down');
    await boss.stop({ graceful: true });
    process.exit(0);
  };
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

main().catch((err) => {
  console.error('Scheduler failed to start', err);
  process.exit(1);
});
