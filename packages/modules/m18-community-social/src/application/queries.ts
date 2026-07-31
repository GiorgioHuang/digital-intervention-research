import type { RequestContext } from '@platform/kernel';
import { assertAllowed } from '@platform/policy';
import type { M18Deps } from './commands.js';

/**
 * Participant-owned read side: each list is gated through the permission
 * engine as an owner-only view of the caller's own social graph, so a
 * stranger's attempt is denied without revealing existence (ADR-050).
 */
async function assertOwnView(deps: M18Deps, ctx: RequestContext, participantId: string): Promise<void> {
  const decision = await deps.checkPermission(ctx, {
    action: 'participant.view-own',
    resource: {
      type: 'SocialGraph',
      id: participantId,
      state: 'Active',
      protectedExistence: true,
      ownerParticipantId: participantId,
    },
  });
  assertAllowed(decision, false);
}

export interface ConnectionSummary {
  connectionId: string;
  otherParticipantId: string;
  connectionState: string;
  createdAt: string;
}

export async function listConnections(
  deps: M18Deps,
  ctx: RequestContext,
  participantId: string,
): Promise<ConnectionSummary[]> {
  await assertOwnView(deps, ctx, participantId);
  const res = await deps.pool.query(
    `SELECT id, participant_a_id, participant_b_id, connection_state, created_at
       FROM community_social.connections
      WHERE participant_a_id = $1 OR participant_b_id = $1
      ORDER BY created_at DESC`,
    [participantId],
  );
  return res.rows.map((r) => ({
    connectionId: r.id as string,
    otherParticipantId: (r.participant_a_id === participantId ? r.participant_b_id : r.participant_a_id) as string,
    connectionState: r.connection_state as string,
    createdAt: (r.created_at as Date).toISOString(),
  }));
}

export interface ThreadSummary {
  threadId: string;
  otherParticipantId: string;
  basisType: string;
  threadState: string;
  createdAt: string;
}

export async function listThreads(
  deps: M18Deps,
  ctx: RequestContext,
  participantId: string,
): Promise<ThreadSummary[]> {
  await assertOwnView(deps, ctx, participantId);
  const res = await deps.pool.query(
    `SELECT id, participant_a_id, participant_b_id, basis_type, thread_state, created_at
       FROM community_social.conversation_threads
      WHERE participant_a_id = $1 OR participant_b_id = $1
      ORDER BY created_at DESC`,
    [participantId],
  );
  return res.rows.map((r) => ({
    threadId: r.id as string,
    otherParticipantId: (r.participant_a_id === participantId ? r.participant_b_id : r.participant_a_id) as string,
    basisType: r.basis_type as string,
    threadState: r.thread_state as string,
    createdAt: (r.created_at as Date).toISOString(),
  }));
}

export interface MatchCandidateSummary {
  candidateId: string;
  candidateVersion: number;
  explanation: string;
  expiresAt: string;
}

/**
 * Current actionable candidates only. The other participant's identity is
 * deliberately NOT included: before a mutual acceptance, a candidate is
 * an explanation, not a person's identity (Doc 11 matching rules).
 */
export async function listMatchCandidates(
  deps: M18Deps,
  ctx: RequestContext,
  participantId: string,
): Promise<MatchCandidateSummary[]> {
  await assertOwnView(deps, ctx, participantId);
  const res = await deps.pool.query(
    `SELECT id, candidate_version, match_explanation, expires_at
       FROM community_social.match_candidates
      WHERE (participant_a_id = $1 OR participant_b_id = $1)
        AND candidate_state IN ('Generated', 'Available', 'Viewed')
        AND expires_at > $2
      ORDER BY created_at DESC`,
    [participantId, deps.clock.now()],
  );
  return res.rows.map((r) => ({
    candidateId: r.id as string,
    candidateVersion: r.candidate_version as number,
    explanation: r.match_explanation as string,
    expiresAt: (r.expires_at as Date).toISOString(),
  }));
}
