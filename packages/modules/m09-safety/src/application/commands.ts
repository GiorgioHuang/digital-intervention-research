import { newId, PlatformError, type Clock, type RequestContext } from '@platform/kernel';
import { appendToOutbox, recordAuditEvent, withTransaction, type Pool } from '@platform/database';
import { assertAllowed, type PolicyDecisionResult } from '@platform/policy';

export type PermissionCheck = (
  ctx: RequestContext,
  request: {
    action: string;
    resource: { type: string; id: string; state: string; protectedExistence: boolean };
    confirmed?: boolean;
  },
) => Promise<PolicyDecisionResult>;

export interface M09Deps {
  pool: Pool;
  clock: Clock;
  checkPermission: PermissionCheck;
}

/**
 * Record a SafetySignal. Any source may raise one — including AI and
 * automation (ADR-039: detection creates signals, never events). This is
 * deliberately NOT permission-gated beyond authentication: safety
 * reporting must never be blocked by role gaps (fail open for signals,
 * fail closed for events).
 */
export async function recordSafetySignal(
  deps: M09Deps,
  ctx: RequestContext,
  input: {
    sourceType: 'Participant' | 'Supporter' | 'Staff' | 'Assessment' | 'AI' | 'Rule' | 'Integration';
    category: string;
    severity: 'Low' | 'Moderate' | 'High' | 'Critical';
    description: string;
  },
): Promise<{ safetySignalId: string }> {
  if (ctx.actor === undefined) throw new PlatformError('AUTHENTICATION_REQUIRED', 'No actor');
  const safetySignalId = newId('ss');
  const now = deps.clock.now();
  await withTransaction(deps.pool, async (client) => {
    await client.query(
      `INSERT INTO safety.safety_signals (id, source_type, raised_by_actor_id, category, severity, description)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [safetySignalId, input.sourceType, ctx.actor!.id, input.category, input.severity, input.description],
    );
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: input.sourceType === 'AI' ? 'AISafetySignalRaised' : 'SafetySignalRecorded',
      sourceModule: input.sourceType === 'AI' ? 'M11' : 'M09',
      aggregateType: 'SafetySignal',
      aggregateId: safetySignalId,
      occurredAt: now,
      payload: { severity: input.severity, category: input.category },
    });
  });
  return { safetySignalId };
}

/**
 * Human triage disposition. Conversion to a SafetyEvent creates the event
 * in the same transaction — only an authorised human with MFA can do this
 * (ADR-039/ATR-017); service accounts are refused unconditionally.
 */
export async function triageSafetySignal(
  deps: M09Deps,
  ctx: RequestContext,
  input: {
    safetySignalId: string;
    disposition: 'Closed as Not a Safety Event' | 'Escalated' | 'Converted to Safety Event';
    reason: string;
    confirmed: boolean;
  },
): Promise<{ safetyEventId?: string }> {
  if (ctx.actor?.type !== 'user') {
    throw new PlatformError('AUTHORISATION_DENIED', 'Safety triage requires an authenticated human');
  }
  const isConversion = input.disposition === 'Converted to Safety Event';
  const decision = await deps.checkPermission(ctx, {
    action: isConversion ? 'safety-event.create' : 'safety-signal.triage',
    resource: { type: 'SafetySignal', id: input.safetySignalId, state: 'Recorded', protectedExistence: true },
    confirmed: input.confirmed,
  });
  assertAllowed(decision, input.confirmed);
  if (input.reason.trim() === '') {
    throw new PlatformError('VALIDATION_ERROR', 'A triage disposition requires a reason');
  }

  const now = deps.clock.now();
  let safetyEventId: string | undefined;
  await withTransaction(deps.pool, async (client) => {
    const res = await client.query(
      `UPDATE safety.safety_signals
          SET signal_state = $2, triage_reason = $3, triaged_by_actor_id = $4,
              record_version = record_version + 1, updated_at = $5
        WHERE id = $1 AND signal_state IN ('Recorded', 'Awaiting Triage', 'In Review', 'Escalated')`,
      [input.safetySignalId, input.disposition, input.reason, ctx.actor!.id, now],
    );
    if (res.rowCount !== 1) throw new PlatformError('INVALID_STATE_TRANSITION', 'Signal state does not allow triage');
    if (isConversion) {
      safetyEventId = newId('se');
      await client.query(
        `INSERT INTO safety.safety_events (id, safety_signal_id, confirmed_by_actor_id) VALUES ($1, $2, $3)`,
        [safetyEventId, input.safetySignalId, ctx.actor!.id],
      );
      await appendToOutbox(client, ctx, {
        eventCategory: 'Domain',
        eventType: 'SafetyEventCreated',
        sourceModule: 'M09',
        aggregateType: 'SafetyEvent',
        aggregateId: safetyEventId,
        occurredAt: now,
      });
    } else {
      await appendToOutbox(client, ctx, {
        eventCategory: 'Domain',
        eventType: input.disposition === 'Escalated' ? 'SafetySignalEscalated' : 'SafetySignalClosedAsNotEvent',
        sourceModule: 'M09',
        aggregateType: 'SafetySignal',
        aggregateId: input.safetySignalId,
        occurredAt: now,
      });
    }
    await recordAuditEvent(client, ctx, {
      action: isConversion ? 'safety-event.create' : 'safety-signal.triage',
      targetType: 'SafetySignal',
      targetId: input.safetySignalId,
      occurredAt: now,
      result: 'Succeeded',
      source: 'M09',
      policyVersion: decision.policyVersion,
    });
  });
  return safetyEventId === undefined ? {} : { safetyEventId };
}
