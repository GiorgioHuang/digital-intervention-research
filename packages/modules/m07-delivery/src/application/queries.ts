import type { RequestContext } from '@platform/kernel';
import { assertAllowed } from '@platform/policy';
import type { M07Deps } from './commands.js';

export interface InterventionSessionView {
  interventionSessionId: string;
  enrolmentId: string;
  interventionConfigurationId: string;
  exposureState: string;
  deliveredByActorId: string;
  occurredAt: string;
}

/**
 * What was actually delivered to a participant, and what came of it.
 *
 * M07 held one command and nothing else: no query, no route, no screen.
 * An intervention could be drafted, approved and put into use, and no
 * one could record that a participant had ever received it — or read
 * back what had been recorded. On a platform whose subject is delivering
 * digital interventions to older people, delivery was the part with no
 * way in.
 *
 * Gated on `session.record` rather than a new view action, the way the
 * protocol list is gated on `protocol.draft`: whoever is entrusted to
 * write down what happened in a session is entrusted to read what they
 * and their colleagues wrote. `session_state` is not returned at all —
 * it defaults to 'Completed' and no code has ever set it, so every row
 * claims completion regardless of what the exposure says.
 */
export async function listInterventionSessions(
  deps: M07Deps,
  ctx: RequestContext,
  enrolmentId: string,
): Promise<InterventionSessionView[]> {
  const decision = await deps.checkPermission(ctx, {
    action: 'session.record',
    resource: { type: 'InterventionSession', id: enrolmentId, state: 'Draft', protectedExistence: false },
  });
  assertAllowed(decision, false);
  const res = await deps.pool.query(
    `SELECT id, enrolment_id, intervention_configuration_id, exposure_state,
            delivered_by_actor_id, occurred_at
       FROM intervention_delivery.intervention_sessions
      WHERE enrolment_id = $1
      ORDER BY occurred_at DESC`,
    [enrolmentId],
  );
  return res.rows.map((r) => ({
    interventionSessionId: r.id as string,
    enrolmentId: r.enrolment_id as string,
    interventionConfigurationId: r.intervention_configuration_id as string,
    exposureState: r.exposure_state as string,
    deliveredByActorId: r.delivered_by_actor_id as string,
    occurredAt: (r.occurred_at as Date).toISOString(),
  }));
}
