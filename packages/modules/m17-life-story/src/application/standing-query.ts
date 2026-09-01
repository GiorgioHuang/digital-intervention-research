/**
 * What a viewer actually stands in relation to a participant, read from
 * the record.
 *
 * Separate from `standing.ts` on purpose: that file decides what a
 * standing entitles somebody to and is pure; this one establishes the
 * standing and is nothing but queries. Keeping them apart is what lets
 * the entitlement rules be tested exhaustively without a database, and
 * lets these queries be judged on one question each — does this row
 * really mean the participant said yes.
 */
import type { Pool } from '@platform/database';
import type { Clock } from '@platform/kernel';
import { NO_STANDING, type ViewerStanding } from './standing.js';

export interface StandingDeps {
  pool: Pool;
  clock: Clock;
}

/**
 * Read the viewer's standing with one participant.
 *
 * Every clause fails closed. A row has to say yes for a standing to be
 * granted; nothing is inferred from the absence of a refusal.
 */
export async function standingOf(
  deps: StandingDeps,
  input: { viewerActorId: string; viewerParticipantId: string | null; ownerParticipantId: string },
): Promise<ViewerStanding> {
  const now = deps.clock.now();

  /*
   * An approved supporter, and nothing weaker.
   *
   * The relationship table also holds Proposed, PendingVerification,
   * Restricted, Suspended, Expired, Revoked and Rejected. Only Active is
   * somebody the participant has said may act for them.
   *
   * `expires_at` is checked here rather than trusted to the sweep that
   * marks relationships Expired. That sweep is scheduled by
   * `apps/scheduler` and run by `apps/worker`, and the deployment runs
   * neither (B-29) — so in the deployed environment an expired
   * relationship still reads 'Active'. Even with the sweep running there
   * would be a window between expiry and the next pass, and reading
   * somebody's life story is not a thing to do in that window.
   */
  const supporter = await deps.pool.query(
    `SELECT 1 FROM consent_permission.relationships
      WHERE participant_id = $1
        AND related_actor_id = $2
        AND relationship_state = 'Active'
        AND revoked_at IS NULL
        AND (expires_at IS NULL OR expires_at > $3)
      LIMIT 1`,
    [input.ownerParticipantId, input.viewerActorId, now],
  );

  /*
   * A connection is participant-to-participant, so a viewer with no
   * participant record of their own — every supporter — can never hold
   * one. Asked in that order so a null never reaches the query.
   */
  let connection = false;
  let community = false;
  if (input.viewerParticipantId !== null && input.viewerParticipantId !== input.ownerParticipantId) {
    const c = await deps.pool.query(
      `SELECT 1 FROM community_social.connections
        WHERE connection_state = 'Active'
          AND ((participant_a_id = $1 AND participant_b_id = $2)
            OR (participant_a_id = $2 AND participant_b_id = $1))
        LIMIT 1`,
      [input.ownerParticipantId, input.viewerParticipantId],
    );
    connection = (c.rowCount ?? 0) > 0;

    /*
     * Sharing a community means both are Active members of the same
     * space. Muted, Suspended and Ended are not membership for this
     * purpose — somebody suspended from a space should not be reading
     * what was shared with it.
     */
    const m = await deps.pool.query(
      `SELECT 1
         FROM community_social.community_memberships mine
         JOIN community_social.community_memberships theirs ON theirs.space_id = mine.space_id
        WHERE mine.participant_id = $1 AND mine.membership_state = 'Active'
          AND theirs.participant_id = $2 AND theirs.membership_state = 'Active'
        LIMIT 1`,
      [input.viewerParticipantId, input.ownerParticipantId],
    );
    community = (m.rowCount ?? 0) > 0;
  }

  return {
    ...NO_STANDING,
    isOwner: input.viewerParticipantId !== null && input.viewerParticipantId === input.ownerParticipantId,
    isSupporter: (supporter.rowCount ?? 0) > 0,
    isConnection: connection,
    sharesCommunity: community,
    /*
     * Permanently false, and honestly so. "Selected People" is one of the
     * scopes a participant can choose and there is no table anywhere that
     * records who was selected — no per-item list of named people exists
     * on this platform (B-31). Until one does, choosing that scope shares
     * a memory with nobody, and this says so by failing closed rather
     * than by quietly widening to some other group.
     */
    isSelected: false,
    /*
     * Signed in at all. Every caller of this has already been through
     * `requireActor`, so reaching here means an authenticated actor.
     */
    isPlatformMember: true,
  };
}
