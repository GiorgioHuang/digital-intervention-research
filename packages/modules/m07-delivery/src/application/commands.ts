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

export interface M07Deps {
  pool: Pool;
  clock: Clock;
  checkPermission: PermissionCheck;
}

/**
 * Record an InterventionSession with its ACTUAL exposure state (Doc 2:
 * record actual, not intended, exposure; delivery != effectiveness).
 */
export async function recordInterventionSession(
  deps: M07Deps,
  ctx: RequestContext,
  input: {
    enrolmentId: string;
    interventionConfigurationId: string;
    exposureState:
      | 'Offered' | 'Viewed' | 'Started' | 'Partially Received' | 'Completed'
      | 'Skipped' | 'Declined' | 'Failed' | 'Interrupted';
  },
): Promise<{ interventionSessionId: string }> {
  if (ctx.actor?.type !== 'user') {
    throw new PlatformError('AUTHORISATION_DENIED', 'Session recording requires an authenticated human');
  }
  const decision = await deps.checkPermission(ctx, {
    action: 'session.record',
    resource: { type: 'InterventionSession', id: 'new', state: 'Draft', protectedExistence: false },
  });
  assertAllowed(decision, false);

  /*
   * Withdrawal has to bite here, because there is nowhere else it can.
   *
   * The withdrawal command emits ParticipantWithdrawn "for downstream
   * propagation", and the outbox delivers it reliably to nobody: no
   * consumer is registered anywhere in the platform, so every event is
   * marked Published having reached no one. Meanwhile `enrolment_state`
   * was read by nothing outside M05. So a participant could withdraw
   * from a study and a session could still be recorded against their
   * enrolment the next minute — while the withdrawal screen told the
   * coordinator that data collection had stopped.
   *
   * Checking the state at the moment of the write is the mechanism this
   * platform actually has, and it is the same one consent relies on: the
   * permission engine re-reads a participant's consent on every decision
   * rather than trusting anything to have propagated. Enforcement at use
   * time cannot go stale, and does not depend on a consumer somebody has
   * not written yet.
   */
  const enrolment = await deps.pool.query(
    `SELECT enrolment_state, participant_id FROM enrolment.enrolments WHERE id = $1`,
    [input.enrolmentId],
  );
  const row = enrolment.rows[0] as { enrolment_state: string; participant_id: string } | undefined;
  if (row === undefined) throw new PlatformError('RESOURCE_NOT_FOUND', 'Enrolment not found');
  if (['Withdrawn', 'Discontinued'].includes(row.enrolment_state)) {
    throw new PlatformError(
      'RESOURCE_STATE_BLOCKED',
      'This participant has left the study; nothing further can be recorded against this enrolment',
    );
  }

  const interventionSessionId = newId('is');
  const now = deps.clock.now();
  await withTransaction(deps.pool, async (client) => {
    await client.query(
      `INSERT INTO intervention_delivery.intervention_sessions
         (id, enrolment_id, intervention_configuration_id, exposure_state, delivered_by_actor_id, occurred_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [interventionSessionId, input.enrolmentId, input.interventionConfigurationId, input.exposureState, ctx.actor!.id, now],
    );
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: 'InterventionExposureRecorded',
      sourceModule: 'M07',
      aggregateType: 'InterventionSession',
      aggregateId: interventionSessionId,
      occurredAt: now,
      payload: { exposureState: input.exposureState },
    });
    /*
     * The accountability record exists to answer what was done to a
     * participant and by whom, and recording that somebody received an
     * intervention was not in it. The audit screen says only actions
     * that changed something are written there, which a reader takes to
     * mean everything that changed is — so a participant asking what had
     * been recorded about them would have been shown a record with the
     * delivery missing, and no indication that anything was.
     */
    await recordAuditEvent(client, ctx, {
      action: 'session.record',
      targetType: 'InterventionSession',
      targetId: interventionSessionId,
      participantId: row.participant_id,
      occurredAt: now,
      result: 'Succeeded',
      source: 'M07',
      policyVersion: decision.policyVersion,
    });
  });
  return { interventionSessionId };
}
