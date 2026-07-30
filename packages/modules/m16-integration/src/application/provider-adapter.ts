import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { PlatformError } from '@platform/kernel';
import type { Pool } from '@platform/database';
import type { DeliveryCommandPort, ProviderCallback } from '../contracts/index.js';

const SIMULATOR_PROVIDER = 'provider-simulator';

export function signCallback(secret: string, cb: Omit<ProviderCallback, 'signature'>): string {
  return createHmac('sha256', secret)
    .update(`${cb.provider}|${cb.providerReference}|${cb.status}|${cb.timestamp}|${cb.nonce}`)
    .digest('hex');
}

/**
 * Deterministic communication-provider simulator (ADR-111 pending): submits
 * a queued message "to the provider" and returns the provider reference.
 * Canonical state moves only via the injected M18 command (ADR-033).
 */
export function createProviderSimulator(delivery: DeliveryCommandPort) {
  return {
    provider: SIMULATOR_PROVIDER,
    async submit(messageId: string): Promise<{ providerReference: string }> {
      const providerReference = `sim-${randomUUID()}`;
      await delivery.recordDeliveryState({
        messageId,
        deliveryState: 'Sent to Provider',
        provider: SIMULATOR_PROVIDER,
        providerReference,
      });
      return { providerReference };
    },
  };
}

const STATUS_MAP: Record<ProviderCallback['status'], 'Provider Accepted' | 'Delivered' | 'Delivery Failed' | 'Delivery Unknown'> = {
  accepted: 'Provider Accepted',
  delivered: 'Delivered',
  failed: 'Delivery Failed',
  unknown: 'Delivery Unknown',
};

/**
 * Callback ingress (Doc 15 §provider adapters): authenticate signature,
 * replay-protect via unique nonce key, resolve the provider reference to
 * the canonical message, translate the status and invoke the M18 command.
 * Duplicate callbacks are idempotent no-ops. Callbacks can never create
 * send authority or content — only delivery-state evidence.
 */
export async function handleProviderCallback(
  pool: Pool,
  delivery: DeliveryCommandPort,
  secret: string,
  cb: ProviderCallback,
): Promise<{ outcome: 'Processed' | 'Duplicate' }> {
  const expected = signCallback(secret, cb);
  const valid =
    expected.length === cb.signature.length &&
    timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(cb.signature, 'hex'));
  const replayKey = `${cb.provider}:${cb.nonce}`;

  if (!valid) {
    await pool.query(
      `INSERT INTO integration_ops.provider_callback_records
         (id, provider, provider_reference, replay_key, signature_valid, raw_status, outcome)
       VALUES ($1, $2, $3, $4, false, $5, 'Rejected')
       ON CONFLICT (replay_key) DO NOTHING`,
      [randomUUID(), cb.provider, cb.providerReference, `rejected:${randomUUID()}`, cb.status],
    );
    throw new PlatformError('PROVIDER_CALLBACK_INVALID', 'Callback signature verification failed');
  }

  // Replay protection: first insert wins; duplicates are recorded no-ops.
  const inserted = await pool.query(
    `INSERT INTO integration_ops.provider_callback_records
       (id, provider, provider_reference, replay_key, signature_valid, raw_status, mapped_state, outcome)
     VALUES ($1, $2, $3, $4, true, $5, $6, 'Processed')
     ON CONFLICT (replay_key) DO NOTHING
     RETURNING id`,
    [randomUUID(), cb.provider, cb.providerReference, replayKey, cb.status, STATUS_MAP[cb.status]],
  );
  if (inserted.rowCount === 0) return { outcome: 'Duplicate' };

  const attempt = await pool.query(
    `SELECT message_id FROM community_social.message_delivery_attempts
      WHERE provider = $1 AND provider_reference = $2`,
    [cb.provider, cb.providerReference],
  );
  if (attempt.rows[0] === undefined) {
    throw new PlatformError('PROVIDER_REFERENCE_UNKNOWN', 'Callback references no known delivery attempt');
  }
  await delivery.recordDeliveryState({
    messageId: attempt.rows[0].message_id,
    deliveryState: STATUS_MAP[cb.status],
  });
  return { outcome: 'Processed' };
}
