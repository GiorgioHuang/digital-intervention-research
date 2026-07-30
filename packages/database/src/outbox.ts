import { randomUUID } from 'node:crypto';
import type { PoolClient } from 'pg';
import type { RequestContext } from '@platform/kernel';

export type EventCategory = 'Domain' | 'Integration' | 'Operational' | 'Audit';

export interface OutboxEntry {
  eventCategory: EventCategory;
  eventType: string;
  eventSchemaVersion?: number;
  sourceModule: string;
  aggregateType: string;
  aggregateId: string;
  aggregateVersion?: bigint | number;
  occurredAt: Date;
  /** Minimum-necessary payload: opaque references only (Doc 15 §61). */
  payload?: Record<string, unknown>;
  dataClassification?: string;
}

/**
 * Append an event to the transactional outbox. MUST be called with the same
 * transaction client that writes the aggregate state so that state change
 * and event publication commit or roll back atomically (ADR-015; the atomic
 * pairs of Doc 16 §54 — BlockCreated, MutualAcceptanceRecorded,
 * ConnectionActivated, MessageSendConfirmed, DatasetVersionLocked, ... —
 * all rely on this function being used inside the owning command).
 */
export async function appendToOutbox(
  client: PoolClient,
  ctx: RequestContext,
  entry: OutboxEntry,
): Promise<string> {
  const id = randomUUID();
  await client.query(
    `INSERT INTO platform_kernel.outbox_messages
       (id, event_category, event_type, event_schema_version, source_module,
        aggregate_type, aggregate_id, aggregate_version, occurred_at,
        purpose_code, data_classification, correlation_id, causation_id,
        trace_id, payload)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
    [
      id,
      entry.eventCategory,
      entry.eventType,
      entry.eventSchemaVersion ?? 1,
      entry.sourceModule,
      entry.aggregateType,
      entry.aggregateId,
      entry.aggregateVersion === undefined ? null : entry.aggregateVersion.toString(),
      entry.occurredAt,
      ctx.purposeCode ?? null,
      entry.dataClassification ?? null,
      ctx.correlationId,
      ctx.causationId ?? null,
      ctx.traceId,
      JSON.stringify(entry.payload ?? {}),
    ],
  );
  return id;
}

export interface ClaimedOutboxMessage {
  id: string;
  eventCategory: EventCategory;
  eventType: string;
  eventSchemaVersion: number;
  sourceModule: string;
  aggregateType: string;
  aggregateId: string;
  payload: Record<string, unknown>;
  attemptCount: number;
}

/**
 * Claim a batch of pending outbox messages for publication using
 * FOR UPDATE SKIP LOCKED so concurrent publishers never double-claim.
 * Caller must COMMIT after marking each message published/failed.
 */
export async function claimPendingOutbox(
  client: PoolClient,
  batchSize: number,
  now: Date,
): Promise<ClaimedOutboxMessage[]> {
  const res = await client.query(
    `UPDATE platform_kernel.outbox_messages m
        SET publication_state = 'Publishing', attempt_count = m.attempt_count + 1
      WHERE m.id IN (
        SELECT id FROM platform_kernel.outbox_messages
         WHERE publication_state IN ('Pending', 'Failed')
           AND (next_attempt_at IS NULL OR next_attempt_at <= $2)
         ORDER BY created_at
         LIMIT $1
         FOR UPDATE SKIP LOCKED
      )
      RETURNING m.id, m.event_category, m.event_type, m.event_schema_version,
                m.source_module, m.aggregate_type, m.aggregate_id, m.payload, m.attempt_count`,
    [batchSize, now],
  );
  return res.rows.map((r) => ({
    id: r.id,
    eventCategory: r.event_category,
    eventType: r.event_type,
    eventSchemaVersion: r.event_schema_version,
    sourceModule: r.source_module,
    aggregateType: r.aggregate_type,
    aggregateId: r.aggregate_id,
    payload: r.payload,
    attemptCount: r.attempt_count,
  }));
}

export async function markOutboxPublished(client: PoolClient, id: string, publishedAt: Date): Promise<void> {
  await client.query(
    `UPDATE platform_kernel.outbox_messages
        SET publication_state = 'Published', published_at = $2
      WHERE id = $1 AND publication_state = 'Publishing'`,
    [id, publishedAt],
  );
}

export async function markOutboxFailed(
  client: PoolClient,
  id: string,
  nextAttemptAt: Date | null,
): Promise<void> {
  await client.query(
    `UPDATE platform_kernel.outbox_messages
        SET publication_state = CASE WHEN $2::timestamptz IS NULL THEN 'DeadLettered' ELSE 'Failed' END,
            next_attempt_at = $2
      WHERE id = $1 AND publication_state = 'Publishing'`,
    [id, nextAttemptAt],
  );
}

/**
 * Consumer-side idempotency (inbox). Returns true when this consumer sees the
 * message for the first time; false when it is a duplicate delivery.
 */
export async function registerInboxMessage(
  client: PoolClient,
  consumerName: string,
  messageId: string,
  eventType: string,
): Promise<boolean> {
  const res = await client.query(
    `INSERT INTO platform_kernel.inbox_messages (consumer_name, message_id, event_type)
     VALUES ($1, $2, $3)
     ON CONFLICT (consumer_name, message_id) DO NOTHING`,
    [consumerName, messageId, eventType],
  );
  return res.rowCount === 1;
}
