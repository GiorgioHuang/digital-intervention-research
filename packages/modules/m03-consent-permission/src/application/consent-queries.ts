import type { RequestContext } from '@platform/kernel';
import { relationshipStateNow } from './in-force.js';
import { assertAllowed } from '@platform/policy';
import type { M03Deps } from './consent-commands.js';

export interface OwnRelationshipView {
  relationshipId: string;
  relatedActorId: string;
  relationshipType: string;
  relationshipState: string;
  /** The dotted actions this relationship authorises, verbatim. */
  permittedActions: string[];
  expiresAt: string | null;
  /** Required by approve and revoke, which are optimistically concurrent. */
  recordVersion: number;
  proposedAt: string;
}

/**
 * Who has, or has asked for, access to this participant — and on what
 * terms.
 *
 * Approving and revoking a relationship have always been owner-only, so
 * the participant is the only person who can let a supporter in or shut
 * them out. Nothing listed relationships, which made both unreachable:
 * a proposal sat waiting for an approval the participant could not see
 * they had been asked for, and an active relationship could not be ended
 * by the one person entitled to end it. Consent answers "what may be
 * done with my information"; this answers "by whom", and the permission
 * engine requires both.
 *
 * Revoked, rejected and expired relationships stay in the result. Someone
 * asking who has access to them is also entitled to know who used to.
 *
 * Read under `participant.view-own`, the same owner-only action the
 * consent view uses — this is the participant's own record read from
 * their own workspace, not a new kind of access.
 */
export async function listOwnRelationships(
  deps: M03Deps,
  ctx: RequestContext,
  participantId: string,
): Promise<OwnRelationshipView[]> {
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
    `SELECT id, related_actor_id, relationship_type, relationship_state,
            permitted_actions, expires_at, record_version, created_at
       FROM consent_permission.relationships
      WHERE participant_id = $1
      ORDER BY created_at DESC`,
    [participantId],
  );
  return res.rows.map((r) => ({
    relationshipId: r.id as string,
    relatedActorId: r.related_actor_id as string,
    relationshipType: r.relationship_type as string,
    /*
     * The state it is really in, not the state last written down.
     *
     * `relationship_state` is moved to 'Expired' by a sweep, and there is
     * no worker to run it (owner, 2026-09-02) — so a relationship that
     * lapsed months ago still reads 'Active' in the column. This is the
     * screen that answers "who has access to my information", and
     * telling somebody an access is Active when it lapsed is being wrong
     * about who can read them, in the direction that worries a person
     * more. The permission engine has never been fooled by it; only the
     * description was.
     */
    relationshipState: relationshipStateNow(
      r.relationship_state as string,
      (r.expires_at as Date | null) ?? null,
      deps.clock.now(),
    ),
    permittedActions: (r.permitted_actions ?? []) as string[],
    expiresAt: r.expires_at === null ? null : (r.expires_at as Date).toISOString(),
    recordVersion: r.record_version as number,
    proposedAt: (r.created_at as Date).toISOString(),
  }));
}

export interface SupportedPersonView {
  relationshipId: string;
  participantId: string;
  relationshipType: string;
  relationshipState: string;
  permittedActions: string[];
  expiresAt: string | null;
}

/**
 * The relationships in which the requesting actor is the supported-from
 * side — "who am I a supporter for, and on what terms".
 *
 * Strictly the caller's own: the actor id comes from the request context
 * and is never a parameter, so this cannot be pointed at somebody else's
 * relationships. That is the same shape as `listMyContributions`, and the
 * lesson recorded in D-13 about scope that arrives as an argument.
 *
 * A supporter previously had no way to learn who they support or what
 * they are permitted to do, and the contribution form asked them to type
 * an archive identifier they could only have been told out of band.
 *
 * Relationship state is reported exactly as recorded and nothing more.
 * Whether an action will actually succeed depends on the participant's
 * consent and on other things that are theirs to decide; reporting this
 * as though it were the whole answer would let a supporter conclude
 * things about the participant that the participant did not choose to
 * tell them.
 */
export async function listRelationshipsForActor(
  deps: M03Deps,
  ctx: RequestContext,
): Promise<SupportedPersonView[]> {
  const decision = await deps.permissions.evaluate(ctx, {
    action: 'relationship.view-own',
    resource: { type: 'Relationship', id: 'own', state: 'Any', protectedExistence: false },
  });
  assertAllowed(decision, false);
  const res = await deps.pool.query(
    `SELECT id, participant_id, relationship_type, relationship_state, permitted_actions, expires_at
       FROM consent_permission.relationships
      WHERE related_actor_id = $1
      ORDER BY created_at DESC`,
    [ctx.actor!.id],
  );
  return res.rows.map((r) => ({
    relationshipId: r.id as string,
    participantId: r.participant_id as string,
    relationshipType: r.relationship_type as string,
    /* Worked out now, not when a sweep gets to it. See above. */
    relationshipState: relationshipStateNow(
      r.relationship_state as string,
      (r.expires_at as Date | null) ?? null,
      deps.clock.now(),
    ),
    permittedActions: (r.permitted_actions ?? []) as string[],
    expiresAt: r.expires_at === null ? null : (r.expires_at as Date).toISOString(),
  }));
}

export interface ConsentStateView {
  scope: string;
  /** Granted | Declined | Restricted | Deferred | Withdrawn | ReConsentRequired. */
  decision: string;
  decidedAt: string;
  /** The consent text version this decision was made under. */
  templateVersion: string;
  restrictions: string[];
  expiresAt: string | null;
  /**
   * What changed, when somebody other than the participant wrote this row.
   * Only a demand to agree again carries one — an ordinary decision needs
   * no explanation, because the participant made it themselves.
   */
  decisionNote: string | null;
  /**
   * Whether somebody was helping when this was decided. Never who — the
   * helper's name stays on the participant's own device (D-15).
   */
  assistanceRecorded: boolean;
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
    `SELECT consent_scope, decision, consent_template_version, updated_at, restrictions, expires_at,
            decision_note, assistance_recorded
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
    decisionNote: (r.decision_note as string | null) ?? null,
    assistanceRecorded: r.assistance_recorded === true,
  }));
}
