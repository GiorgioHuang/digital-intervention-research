import { newId, type Clock, type RequestContext } from '@platform/kernel';
import { appendToOutbox, recordAuditEvent, withTransaction, type Pool } from '@platform/database';
import { assertAllowed, type PolicyDecisionResult } from '@platform/policy';
import { M02_EVENTS } from '../contracts/index.js';

export type PermissionCheck = (
  ctx: RequestContext,
  request: {
    action: string;
    resource: {
      type: string;
      id: string;
      state: string;
      protectedExistence: boolean;
      ownerParticipantId?: string;
      organisationId?: string;
    };
    confirmed?: boolean;
  },
) => Promise<PolicyDecisionResult>;

export interface M02Deps {
  pool: Pool;
  clock: Clock;
  checkPermission: PermissionCheck;
}

export async function registerParticipant(
  deps: M02Deps,
  ctx: RequestContext,
  input: { displayName: string; userAccountId?: string },
): Promise<{ participantId: string }> {
  const decision = await deps.checkPermission(ctx, {
    action: 'participant.register',
    resource: { type: 'Participant', id: 'new', state: 'Draft', protectedExistence: false },
  });
  assertAllowed(decision, false);

  const participantId = newId('pt');
  const now = deps.clock.now();
  await withTransaction(deps.pool, async (client) => {
    await client.query(
      `INSERT INTO participant_profile.participants (id, user_account_id, display_name) VALUES ($1, $2, $3)`,
      [participantId, input.userAccountId ?? null, input.displayName],
    );
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: M02_EVENTS.ParticipantRegistered,
      sourceModule: 'M02',
      aggregateType: 'Participant',
      aggregateId: participantId,
      occurredAt: now,
    });
    await recordAuditEvent(client, ctx, {
      action: 'participant.register',
      targetType: 'Participant',
      targetId: participantId,
      participantId,
      occurredAt: now,
      result: 'Succeeded',
      source: 'M02',
      policyVersion: decision.policyVersion,
    });
  });
  return { participantId };
}

/**
 * Record an accessibility preference. Explicit Participant choice always
 * outranks inference (Doc 5 adaptation priority); the source is recorded and
 * previous values are superseded, never overwritten.
 */
export async function recordAccessibilityPreference(
  deps: M02Deps,
  ctx: RequestContext,
  input: {
    participantId: string;
    preferenceType: string;
    preferenceValue: string;
    source: 'ExplicitChoice' | 'SavedPreference' | 'TaskRequirement' | 'SupporterAssisted' | 'ObservedDifficulty' | 'SystemSuggestion';
  },
): Promise<{ preferenceId: string }> {
  const decision = await deps.checkPermission(ctx, {
    action: 'participant.update-own',
    resource: {
      type: 'AccessibilityPreference',
      id: input.participantId,
      state: 'Active',
      protectedExistence: false,
      ownerParticipantId: input.participantId,
    },
  });
  assertAllowed(decision, false);

  const preferenceId = newId('ap');
  const now = deps.clock.now();
  await withTransaction(deps.pool, async (client) => {
    await client.query(
      `UPDATE participant_profile.accessibility_preferences
          SET superseded_at = $3
        WHERE participant_id = $1 AND preference_type = $2 AND superseded_at IS NULL`,
      [input.participantId, input.preferenceType, now],
    );
    await client.query(
      `INSERT INTO participant_profile.accessibility_preferences
         (id, participant_id, preference_type, preference_value, source)
       VALUES ($1, $2, $3, $4, $5)`,
      [preferenceId, input.participantId, input.preferenceType, input.preferenceValue, input.source],
    );
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: M02_EVENTS.AccessibilityPreferenceRecorded,
      sourceModule: 'M02',
      aggregateType: 'Participant',
      aggregateId: input.participantId,
      occurredAt: now,
      payload: { preferenceType: input.preferenceType, source: input.source },
    });
    await recordAuditEvent(client, ctx, {
      action: 'participant.update-own',
      targetType: 'AccessibilityPreference',
      targetId: preferenceId,
      participantId: input.participantId,
      occurredAt: now,
      result: 'Succeeded',
      source: 'M02',
      policyVersion: decision.policyVersion,
    });
  });
  return { preferenceId };
}
