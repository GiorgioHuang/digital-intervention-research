import { newId, PlatformError, type Clock, type RequestContext } from '@platform/kernel';
import { appendToOutbox, withTransaction, type Pool } from '@platform/database';
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
  });
  return { interventionSessionId };
}
