import type { RequestContext } from '@platform/kernel';
import { assertAllowed } from '@platform/policy';
import type { M03Deps } from './consent-commands.js';

export interface ConsentStateView {
  scope: string;
  /** Granted | Declined | Restricted | Deferred | Withdrawn. */
  decision: string;
  decidedAt: string;
  /** The consent text version this decision was made under. */
  templateVersion: string;
  restrictions: string[];
  expiresAt: string | null;
}

/**
 * A participant's own current consent state, read from
 * `consent_permission.consent_current` — the same projection the
 * permission engine consults when it decides whether an action is
 * allowed.
 *
 * Reading the engine's own source matters. The consent screen previously
 * showed only the result of the last button pressed in that session, so a
 * participant returning to it saw nothing at all and could not tell what
 * they had agreed to. A screen about consent that cannot state the
 * current position is not a record of anything; and if it displayed a
 * separately-derived answer, the screen and the enforcement could drift
 * apart without either being obviously wrong.
 *
 * Owner-only: `participant.view-own` is `ownerOnly` in the catalogue, so
 * this cannot be used to read anyone else's decisions.
 */
export async function listOwnConsents(
  deps: M03Deps,
  ctx: RequestContext,
  participantId: string,
): Promise<ConsentStateView[]> {
  const decision = await deps.permissions.evaluate(ctx, {
    action: 'participant.view-own',
    resource: {
      type: 'Participant',
      id: participantId,
      state: 'Active',
      protectedExistence: true,
      ownerParticipantId: participantId,
    },
  });
  assertAllowed(decision, false);
  const res = await deps.pool.query(
    `SELECT consent_scope, decision, consent_template_version, updated_at, restrictions, expires_at
       FROM consent_permission.consent_current
      WHERE participant_id = $1
      ORDER BY consent_scope ASC`,
    [participantId],
  );
  return res.rows.map((r) => ({
    scope: r.consent_scope as string,
    decision: r.decision as string,
    decidedAt: (r.updated_at as Date).toISOString(),
    templateVersion: r.consent_template_version as string,
    restrictions: (r.restrictions ?? []) as string[],
    expiresAt: r.expires_at === null ? null : (r.expires_at as Date).toISOString(),
  }));
}
