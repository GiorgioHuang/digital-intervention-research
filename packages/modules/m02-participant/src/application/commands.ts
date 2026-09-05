import { newId, PlatformError, type Clock, type RequestContext } from '@platform/kernel';
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

/**
 * What this participant would like other people to call them, and the
 * city they are happy to say they live in.
 *
 * A SEPARATE THING from the name on the research record, by hard rule
 * (Doc 20 §354), and separate here too: a different table, a different
 * permission action, and no value copied between the two in either
 * direction. The study office may hold somebody's full name because the
 * study needs it; what other participants are shown is only ever what
 * the person put here.
 *
 * The name is not split into parts. The drawing asks for "your first
 * name", and a first name is not reliably the first word of a name in
 * every culture this study recruits from — so the participant is asked
 * what to be called and that is what is stored, whole.
 *
 * Upsert rather than insert-or-fail: changing what you are called is the
 * ordinary case, not an exception, and a screen that made somebody
 * delete a name before choosing another would leave them anonymous in
 * between.
 */
export async function setPublicProfile(
  deps: M02Deps,
  ctx: RequestContext,
  input: { participantId: string; chosenName: string; city?: string | null },
): Promise<void> {
  const decision = await deps.checkPermission(ctx, {
    action: 'public-profile.change',
    resource: {
      type: 'PublicProfile',
      id: input.participantId,
      state: 'Active',
      protectedExistence: false,
      ownerParticipantId: input.participantId,
    },
  });
  assertAllowed(decision, false);

  /*
   * Trimmed here rather than left to the CHECK constraint, because a name
   * of spaces is a person's mistake, not an attack, and the answer to it
   * is a clear refusal rather than a constraint violation surfacing as a
   * server fault. An empty city is stored as "they did not say" — the
   * field is optional, and blanking it is how somebody takes it back.
   */
  const chosenName = input.chosenName.trim();
  if (chosenName === '') {
    throw new PlatformError('VALIDATION_ERROR', 'A name is needed for other people to call you');
  }
  const city = (input.city ?? '').trim() === '' ? null : (input.city as string).trim();

  const now = deps.clock.now();
  await withTransaction(deps.pool, async (client) => {
    await client.query(
      `INSERT INTO public_profile.public_profiles (participant_id, chosen_name, city)
       VALUES ($1, $2, $3)
       ON CONFLICT (participant_id) DO UPDATE
          SET chosen_name = EXCLUDED.chosen_name,
              city = EXCLUDED.city,
              record_version = public_profile.public_profiles.record_version + 1,
              updated_at = $4`,
      [input.participantId, chosenName, city, now],
    );
    /*
     * The payload carries whether a city was given, not the city itself,
     * and never the name. An outbox message is read by machinery that has
     * no business knowing what somebody is called (ADR-034).
     */
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: M02_EVENTS.PublicProfileChanged,
      sourceModule: 'M02',
      aggregateType: 'Participant',
      aggregateId: input.participantId,
      occurredAt: now,
      payload: { hasCity: city !== null },
    });
    await recordAuditEvent(client, ctx, {
      action: 'public-profile.change',
      targetType: 'PublicProfile',
      targetId: input.participantId,
      participantId: input.participantId,
      occurredAt: now,
      result: 'Succeeded',
      source: 'M02',
      policyVersion: decision.policyVersion,
    });
  });
}

/**
 * Taking it down. Afterwards other people see the same placeholder as
 * somebody who never chose a name.
 *
 * This exists because the screen would otherwise be a one-way door: B14's
 * fourth question is "can I take it down?", and a profile that can only
 * be changed and never removed answers no. Nothing already shared is
 * deleted by this — the memories stay where they were shared, under a
 * name nobody can read any more, which is what taking a name down means.
 */
export async function withdrawPublicProfile(
  deps: M02Deps,
  ctx: RequestContext,
  input: { participantId: string; confirmed: boolean },
): Promise<void> {
  const decision = await deps.checkPermission(ctx, {
    action: 'public-profile.withdraw',
    resource: {
      type: 'PublicProfile',
      id: input.participantId,
      state: 'Active',
      protectedExistence: false,
      ownerParticipantId: input.participantId,
    },
    confirmed: input.confirmed,
  });
  assertAllowed(decision, input.confirmed);

  const now = deps.clock.now();
  await withTransaction(deps.pool, async (client) => {
    await client.query(`DELETE FROM public_profile.public_profiles WHERE participant_id = $1`, [
      input.participantId,
    ]);
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: M02_EVENTS.PublicProfileWithdrawn,
      sourceModule: 'M02',
      aggregateType: 'Participant',
      aggregateId: input.participantId,
      occurredAt: now,
    });
    await recordAuditEvent(client, ctx, {
      action: 'public-profile.withdraw',
      targetType: 'PublicProfile',
      targetId: input.participantId,
      participantId: input.participantId,
      occurredAt: now,
      result: 'Succeeded',
      source: 'M02',
      policyVersion: decision.policyVersion,
    });
  });
}
