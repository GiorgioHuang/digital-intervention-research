import { PlatformError, type RequestContext } from '@platform/kernel';
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

export interface ThreadMessage {
  messageId: string;
  senderParticipantId: string;
  contentText: string;
  messageVersion: number;
  lifecycleState: string;
  deliveryState: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Message history for one thread. Only a thread party may read it, and
 * DRAFTS ARE PRIVATE TO THEIR AUTHOR: an unconfirmed message is never
 * visible to the other party (Doc 20 §158 — nothing is sent, so nothing
 * is shown). Delivery states come through untranslated so the UI can
 * render them truthfully.
 */
export async function listThreadMessages(
  deps: M18Deps,
  ctx: RequestContext,
  input: { threadId: string; participantId: string },
): Promise<ThreadMessage[]> {
  await assertOwnView(deps, ctx, input.participantId);
  const thread = await deps.pool.query(
    `SELECT participant_a_id, participant_b_id FROM community_social.conversation_threads WHERE id = $1`,
    [input.threadId],
  );
  const t = thread.rows[0];
  // Non-parties learn nothing — not even that the thread exists.
  if (t === undefined || (input.participantId !== t.participant_a_id && input.participantId !== t.participant_b_id)) {
    throw new PlatformError('RESOURCE_NOT_FOUND', 'Thread not found');
  }
  const res = await deps.pool.query(
    `SELECT id, sender_participant_id, content_text, message_version, lifecycle_state, delivery_state, created_at, updated_at
       FROM community_social.messages
      WHERE thread_id = $1
        AND (lifecycle_state <> 'Draft' OR sender_participant_id = $2)
      ORDER BY created_at ASC`,
    [input.threadId, input.participantId],
  );
  return res.rows.map((r) => ({
    messageId: r.id as string,
    senderParticipantId: r.sender_participant_id as string,
    contentText: r.content_text as string,
    messageVersion: r.message_version as number,
    lifecycleState: r.lifecycle_state as string,
    deliveryState: r.delivery_state as string,
    createdAt: (r.created_at as Date).toISOString(),
    updatedAt: (r.updated_at as Date).toISOString(),
  }));
}

export interface OpenModerationCase {
  moderationCaseId: string;
  subjectActorId: string;
  caseState: string;
  reportCategory: string | null;
  reportDescription: string | null;
  createdAt: string;
}

/**
 * Moderator work queue: open cases with the report's category and
 * description. The REPORTER'S IDENTITY IS DELIBERATELY EXCLUDED
 * (Doc 15 §61) — moderation judges content and behaviour, not reporters.
 */
export async function listOpenModerationCases(
  deps: M18Deps,
  ctx: RequestContext,
): Promise<OpenModerationCase[]> {
  const decision = await deps.checkPermission(ctx, {
    action: 'moderation-queue.view',
    resource: { type: 'ModerationQueue', id: 'all', state: 'Active', protectedExistence: false },
  });
  assertAllowed(decision, false);
  const res = await deps.pool.query(
    `SELECT c.id, c.subject_actor_id, c.case_state, r.category, r.description, c.created_at
       FROM community_social.moderation_cases c
       LEFT JOIN community_social.user_reports r ON r.id = c.user_report_id
      WHERE c.case_state IN ('Reported', 'Awaiting Triage', 'In Review', 'Action Required', 'Reopened')
      ORDER BY c.created_at ASC`,
  );
  return res.rows.map((r) => ({
    moderationCaseId: r.id as string,
    subjectActorId: r.subject_actor_id as string,
    caseState: r.case_state as string,
    reportCategory: (r.category as string | null) ?? null,
    reportDescription: (r.description as string | null) ?? null,
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
