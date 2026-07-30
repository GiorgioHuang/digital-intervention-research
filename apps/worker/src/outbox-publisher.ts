import type { Logger } from 'pino';
import {
  claimPendingOutbox,
  markOutboxFailed,
  markOutboxPublished,
  registerInboxMessage,
  withTransaction,
  type ClaimedOutboxMessage,
  type Pool,
} from '@platform/database';

export type EventHandler = (message: ClaimedOutboxMessage) => Promise<void>;

/**
 * In-process event dispatcher (Doc 13 §18.2: an in-process dispatcher with
 * outbox persistence is acceptable for the MVP). Consumers register per
 * event type and are deduplicated through the inbox table, so delivery is
 * at-least-once with consumer-side idempotency (ADR-015).
 */
export class EventDispatcher {
  private readonly handlers = new Map<string, Map<string, EventHandler>>();

  register(eventType: string, consumerName: string, handler: EventHandler): void {
    if (!this.handlers.has(eventType)) this.handlers.set(eventType, new Map());
    const byConsumer = this.handlers.get(eventType)!;
    if (byConsumer.has(consumerName)) {
      throw new Error(`Consumer ${consumerName} already registered for ${eventType}`);
    }
    byConsumer.set(consumerName, handler);
  }

  consumersFor(eventType: string): ReadonlyMap<string, EventHandler> {
    return this.handlers.get(eventType) ?? new Map();
  }
}

const RETRY_BASE_MS = 5_000;
const MAX_ATTEMPTS = 10;

export async function publishOutboxBatch(
  pool: Pool,
  dispatcher: EventDispatcher,
  logger: Logger,
  batchSize = 50,
): Promise<number> {
  const claimed = await withTransaction(pool, (client) => claimPendingOutbox(client, batchSize, new Date()));
  for (const message of claimed) {
    try {
      const consumers = dispatcher.consumersFor(message.eventType);
      for (const [consumerName, handler] of consumers) {
        await withTransaction(pool, async (client) => {
          const firstDelivery = await registerInboxMessage(client, consumerName, message.id, message.eventType);
          if (firstDelivery) await handler(message);
        });
      }
      await withTransaction(pool, (client) => markOutboxPublished(client, message.id, new Date()));
    } catch (err) {
      const exhausted = message.attemptCount >= MAX_ATTEMPTS;
      const nextAttempt = exhausted
        ? null
        : new Date(Date.now() + RETRY_BASE_MS * 2 ** Math.min(message.attemptCount, 8));
      logger.error(
        { outboxId: message.id, eventType: message.eventType, attempt: message.attemptCount, exhausted, err },
        'outbox publication failed',
      );
      await withTransaction(pool, (client) => markOutboxFailed(client, message.id, nextAttempt));
    }
  }
  return claimed.length;
}

export function startOutboxLoop(
  pool: Pool,
  dispatcher: EventDispatcher,
  logger: Logger,
  intervalMs = 2_000,
): () => void {
  let running = false;
  const timer = setInterval(() => {
    if (running) return;
    running = true;
    publishOutboxBatch(pool, dispatcher, logger)
      .catch((err) => logger.error({ err }, 'outbox loop iteration failed'))
      .finally(() => {
        running = false;
      });
  }, intervalMs);
  timer.unref();
  return () => clearInterval(timer);
}
