import { PlatformError, type RequestContext } from '@platform/kernel';
import { assertAllowed } from '@platform/policy';
import type { M02Deps } from './commands.js';

export interface AdministeredParticipant {
  participantId: string;
  displayName: string;
  /*
   * participantState is deliberately NOT here.
   *
   * `participant_state` carries Active / Paused / Withdrawn / Archived and
   * no code has ever written any of them, so every row reads 'Active'
   * because that is the column default. Nothing enforces it either — no
   * query filters on it and the permission engine never looks at it — so
   * unlike account_state and relationship_state, which were enforced
   * everywhere and merely unwritable, this one means nothing at either
   * end.
   *
   * It was being printed on the administration screen under the heading
   * "Account state", which was wrong twice: it is not the account state,
   * and it is not a state anybody maintains. A column that always says
   * the same word looks like a fact that has been checked.
   *
   * Leaving somebody in a study or not IS tracked, per enrolment, by
   * `enrolment_state` — which participants set themselves when they leave
   * a study, and which the enrolment screens show. That is the real
   * question and it has a real answer; this field was a second, emptier
   * copy of it.
   */
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
    `SELECT p.id, p.display_name, p.user_account_id, p.created_at
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
    userAccountId: (r.user_account_id as string | null) ?? null,
    registeredAt: (r.created_at as Date).toISOString(),
  }));
}

export interface MyProfile {
  participantId: string;
  displayName: string;
}

/**
 * What to call the person using the app.
 *
 * The handoff greets by name — "Good morning, Margaret" — and nothing
 * returned one, so Home greeted a stranger. The name has been in
 * `participant_profile.participants.display_name` since M02's first
 * migration; what was missing was a way for its owner to read it.
 *
 * Owner-only, and the participant is not a parameter the caller chooses.
 * `participant.view-own` is an owner-permitted action, so the engine
 * decides whether this actor owns this record — but the row is also
 * fetched by the id the permission was judged against, which means a
 * caller cannot pass one participant's id while the engine evaluates
 * another's context. Neither check is sufficient alone; this is the same
 * shape as `listParticipantsForOrganisation` above.
 *
 * Null when there is no such participant, rather than an error. This is
 * the app asking about itself, and a missing profile is a real state
 * during synthetic setup — a screen that says "Good morning" without a
 * name is correct there, where a 404 on the home screen is not.
 */
export async function getMyProfile(
  deps: M02Deps,
  ctx: RequestContext,
  participantId: string,
): Promise<MyProfile | null> {
  const decision = await deps.checkPermission(ctx, {
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
    `SELECT id, display_name FROM participant_profile.participants WHERE id = $1`,
    [participantId],
  );
  const row = res.rows[0];
  if (row === undefined) return null;
  return { participantId: row.id as string, displayName: row.display_name as string };
}
