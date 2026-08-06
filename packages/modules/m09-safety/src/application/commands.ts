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

/**
 * Recording what was done about a confirmed safety event.
 *
 * A SafetyEvent was born 'Open' and nothing could ever change it, nothing
 * listed one, and nothing showed one. The triage screen said the reviewer
 * had "converted this to a safety event" — which reads as an escalation to
 * something that will be worked — and nothing worked it.
 *
 * Every entry is permanent. The timeline is append-only in the database as
 * well as here, so a correction is a further entry with the original left
 * standing: a safety record that can be tidied up afterwards is not a
 * record.
 *
 * The note says what was done, never what was said. The design is explicit
 * that the content of a call or a conversation is not recorded here, and
 * the screen says so before the button.
 */
export async function recordSafetyAction(
  deps: M09Deps,
  ctx: RequestContext,
  input: {
    safetyEventId: string;
    label: string;
    actionState: 'Not Started' | 'In Progress' | 'Completed' | 'No Action Taken';
    note: string;
    confirmed: boolean;
  },
): Promise<{ entryId: string }> {
  if (ctx.actor?.type !== 'user') {
    throw new PlatformError('AUTHORISATION_DENIED', 'Safety actions are recorded by people, not by automation');
  }
  const event = await deps.pool.query(`SELECT event_state FROM safety.safety_events WHERE id = $1`, [
    input.safetyEventId,
  ]);
  const row = event.rows[0];
  if (row === undefined) throw new PlatformError('RESOURCE_NOT_FOUND', 'Safety event not found');
  const decision = await deps.checkPermission(ctx, {
    action: 'safety-event.act',
    resource: { type: 'SafetyEvent', id: input.safetyEventId, state: row.event_state as string, protectedExistence: true },
    confirmed: input.confirmed,
  });
  assertAllowed(decision, input.confirmed);
  if (input.label.trim() === '' || input.note.trim() === '') {
    throw new PlatformError('VALIDATION_ERROR', 'An action needs to say what it was and where it stands');
  }

  const entryId = newId('sae');
  const now = deps.clock.now();
  await withTransaction(deps.pool, async (client) => {
    await client.query(
      `INSERT INTO safety.safety_event_timeline
         (id, safety_event_id, entry_type, label, action_state, note, recorded_by_actor_id, recorded_at)
       VALUES ($1, $2, 'Action', $3, $4, $5, $6, $7)`,
      [entryId, input.safetyEventId, input.label.trim(), input.actionState, input.note.trim(), ctx.actor!.id, now],
    );
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: 'SafetyActionRecorded',
      sourceModule: 'M09',
      aggregateType: 'SafetyEvent',
      aggregateId: input.safetyEventId,
      occurredAt: now,
      // The note is not in the payload: what was done travels, what was
      // said does not.
      payload: { actionState: input.actionState },
    });
    await recordAuditEvent(client, ctx, {
      action: 'safety-event.act',
      targetType: 'SafetyEvent',
      targetId: input.safetyEventId,
      occurredAt: now,
      result: 'Succeeded',
      source: 'M09',
      policyVersion: decision.policyVersion,
    });
  });
  return { entryId };
}

/** Where an event may go from where it is. Closing and resolving are the
 *  ends; both are reachable only from a state where somebody has looked. */
const EVENT_TRANSITIONS: Record<string, string[]> = {
  Open: ['In Review'],
  'In Review': ['Action Required', 'Monitoring', 'Resolved', 'Closed'],
  'Action Required': ['Monitoring', 'Resolved', 'Closed'],
  Monitoring: ['Action Required', 'Resolved', 'Closed'],
  Resolved: ['Reopened'],
  Closed: ['Reopened'],
  Reopened: ['In Review'],
};

export function nextSafetyEventStates(from: string): string[] {
  return EVENT_TRANSITIONS[from] ?? [];
}

/**
 * Moving where a safety event stands. The change goes onto the same
 * timeline as the actions, so the account of what happened is one thing
 * rather than two half-histories.
 *
 * Resolving does not mean the person is safe. The platform holds the
 * record of what people did; it does not do anything itself, and no
 * wording here may suggest that closing a record closes a risk.
 */
export async function updateSafetyEventState(
  deps: M09Deps,
  ctx: RequestContext,
  input: { safetyEventId: string; toState: string; note: string; confirmed: boolean },
): Promise<void> {
  if (ctx.actor?.type !== 'user') {
    throw new PlatformError('AUTHORISATION_DENIED', 'Safety event states are moved by people, not by automation');
  }
  const event = await deps.pool.query(`SELECT event_state FROM safety.safety_events WHERE id = $1`, [
    input.safetyEventId,
  ]);
  const row = event.rows[0];
  if (row === undefined) throw new PlatformError('RESOURCE_NOT_FOUND', 'Safety event not found');
  const from = row.event_state as string;
  const decision = await deps.checkPermission(ctx, {
    action: 'safety-event.act',
    resource: { type: 'SafetyEvent', id: input.safetyEventId, state: from, protectedExistence: true },
    confirmed: input.confirmed,
  });
  assertAllowed(decision, input.confirmed);
  if (input.note.trim() === '') {
    throw new PlatformError('VALIDATION_ERROR', 'Moving a safety event needs a reason');
  }
  if (!nextSafetyEventStates(from).includes(input.toState)) {
    throw new PlatformError('INVALID_STATE_TRANSITION', `A safety event cannot go from ${from} to ${input.toState}`);
  }

  const now = deps.clock.now();
  await withTransaction(deps.pool, async (client) => {
    const res = await client.query(
      `UPDATE safety.safety_events
          SET event_state = $2, record_version = record_version + 1, updated_at = $3
        WHERE id = $1 AND event_state = $4`,
      [input.safetyEventId, input.toState, now, from],
    );
    if (res.rowCount !== 1) {
      throw new PlatformError('INVALID_STATE_TRANSITION', 'The event moved while you were reading it');
    }
    await client.query(
      `INSERT INTO safety.safety_event_timeline
         (id, safety_event_id, entry_type, label, note, recorded_by_actor_id, recorded_at)
       VALUES ($1, $2, 'State', $3, $4, $5, $6)`,
      [newId('sae'), input.safetyEventId, input.toState, input.note.trim(), ctx.actor!.id, now],
    );
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: 'SafetyEventStateChanged',
      sourceModule: 'M09',
      aggregateType: 'SafetyEvent',
      aggregateId: input.safetyEventId,
      occurredAt: now,
      payload: { from, to: input.toState },
    });
    await recordAuditEvent(client, ctx, {
      action: 'safety-event.act',
      targetType: 'SafetyEvent',
      targetId: input.safetyEventId,
      occurredAt: now,
      result: 'Succeeded',
      source: 'M09',
      policyVersion: decision.policyVersion,
    });
  });
}
