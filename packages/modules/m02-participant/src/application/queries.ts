import { PlatformError, type RequestContext } from '@platform/kernel';
import { assertAllowed } from '@platform/policy';
import type { M02Deps } from './commands.js';

export interface AdministeredParticipant {
  participantId: string;
  displayName: string;
  participantState: string;
  /** Absent for a participant who has no login (Doc 8 §2.2). */
  userAccountId: string | null;
  registeredAt: string;
}

/**
 * Administrative listing of the participants in one organisation
 * (decision D-13). It carries no research content — identifier, name,
 * account state — so it is not consent-gated; see the catalogue entry for
 * why gating it would break the administration of someone who withdrew.
 *
 * Protected existence (ADR-050) is not weakened by this. The dangerous
 * shape is a lookup that takes an identifier from the caller and reveals
 * whether it exists; this takes no identifier and enumerates inside a
 * scope the administrator already holds. The permission decides whether
 * they may look at all, and this query independently restricts what comes
 * back to their own organisation — neither check is sufficient alone.
 *
 * Participants without a platform account cannot be attributed to an
 * organisation, so they are absent here. That is a real gap and the
 * screen says so rather than presenting this as a complete roll.
 *
 * The organisation is read from the context and is deliberately NOT a
 * parameter. When it was one, a caller could pass the organisation their
 * role is scoped to while acting in a different context, and the engine —
 * which prefers the resource's organisation over the context's — allowed
 * it. The scope the permission is judged against and the scope the rows
 * come from must be the same value, and the caller must not choose it.
 */
export async function listParticipantsForOrganisation(
  deps: M02Deps,
  ctx: RequestContext,
): Promise<AdministeredParticipant[]> {
  const organisationId = ctx.organisationId;
  if (organisationId === undefined || organisationId === '') {
    throw new PlatformError('ORGANISATION_CONTEXT_REQUIRED', 'An organisation context is required to list participants');
  }
  const decision = await deps.checkPermission(ctx, {
    action: 'participant.list-administrative',
    resource: {
      type: 'Participant',
      id: 'all',
      state: 'Active',
      protectedExistence: false,
      organisationId,
    },
  });
  assertAllowed(decision, false);
  const res = await deps.pool.query(
    `SELECT p.id, p.display_name, p.participant_state, p.user_account_id, p.created_at
       FROM participant_profile.participants p
       JOIN identity_org.organisation_memberships m
         ON m.user_account_id = p.user_account_id AND m.membership_state = 'Active'
      WHERE m.organisation_id = $1
      ORDER BY p.created_at DESC`,
    [organisationId],
  );
  return res.rows.map((r) => ({
    participantId: r.id as string,
    displayName: r.display_name as string,
    participantState: r.participant_state as string,
    userAccountId: (r.user_account_id as string | null) ?? null,
    registeredAt: (r.created_at as Date).toISOString(),
  }));
}
