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
  /**
   * What this person is called on screen. Until PublicProfile exists it is
   * the name on their participant record (decision D-12); an identifier is
   * never shown to another participant, because an internal key shown to
   * one person becomes a handle for correlating them across screens.
   */
  otherDisplayName: string;
  connectionState: string;
  createdAt: string;
}

/**
 * A participant whose name cannot be resolved is described, not numbered.
 * The placeholder is deliberately the same for every unresolved person so
 * it cannot be used to tell them apart.
 */
const UNNAMED = 'A community member';

async function nameOf(deps: M18Deps, ids: string[]): Promise<(id: string) => string> {
  const names = await deps.participants.findDisplayNames(ids);
  return (id: string) => names.get(id) ?? UNNAMED;
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
  const rows = res.rows.map((r) => ({
    connectionId: r.id as string,
    otherParticipantId: (r.participant_a_id === participantId ? r.participant_b_id : r.participant_a_id) as string,
    connectionState: r.connection_state as string,
    createdAt: (r.created_at as Date).toISOString(),
  }));
  const name = await nameOf(deps, rows.map((r) => r.otherParticipantId));
  return rows.map((r) => ({ ...r, otherDisplayName: name(r.otherParticipantId) }));
}

export interface ThreadSummary {
  threadId: string;
  otherParticipantId: string;
  /**
   * Null when this module cannot honestly name the other side.
   *
   * The far side of a relationship thread is a supporter, who has a user
   * account and no participant record, so looking them up in the
   * participant directory misses and falls through to the placeholder
   * below. That placeholder was written for a stranger in a community
   * space and is wrong twice over here: a supporter is not a community
   * member, and the placeholder is identical for everybody on purpose —
   * so a participant with two approved supporters would get two rows they
   * could not tell apart, for the one kind of conversation where knowing
   * who is writing is the entire point. Account names belong to M01, and
   * the composition root is where the two are allowed to meet, so this
   * query says it does not know rather than guessing.
   */
  otherDisplayName: string | null;
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
  const rows = res.rows.map((r) => ({
    threadId: r.id as string,
    otherParticipantId: (r.participant_a_id === participantId ? r.participant_b_id : r.participant_a_id) as string,
    basisType: r.basis_type as string,
    threadState: r.thread_state as string,
    createdAt: (r.created_at as Date).toISOString(),
  }));
  // Only the rows whose other side is actually a participant are looked up
  // here. Passing a supporter's account identifier into the participant
  // directory does not fail — it misses, and a miss becomes "A community
  // member", which reads as an answer.
  const peers = rows.filter((r) => r.basisType !== 'AuthorisedRelationship');
  const name = await nameOf(deps, peers.map((r) => r.otherParticipantId));
  return rows.map((r) => ({
    ...r,
    otherDisplayName: r.basisType === 'AuthorisedRelationship' ? null : name(r.otherParticipantId),
  }));
}

export interface ThreadMessage {
  messageId: string;
  senderParticipantId: string;
  contentText: string;
  messageVersion: number;
  lifecycleState: string;
  deliveryState: string;
  /** True when the sender confirmed this send while someone was helping them (D-15). */
  sentWithAssistance: boolean;
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
    `SELECT id, sender_participant_id, content_text, message_version, lifecycle_state, delivery_state,
            sent_with_assistance, created_at, updated_at
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
    sentWithAssistance: r.sent_with_assistance as boolean,
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
  reportedContentId: string | null;
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
    `SELECT c.id, c.subject_actor_id, c.case_state, r.category, r.description,
            r.reported_content_id, c.created_at
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
    // Whether the case names a piece of content decides which decisions
    // can act, so the queue has to carry it rather than leave a moderator
    // to find out by being refused.
    reportedContentId: (r.reported_content_id as string | null) ?? null,
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

export interface CommunitySpaceSummary {
  spaceId: string;
  name: string;
  ruleVersionId: string;
  ruleVersionNumber: number;
  rulesText: string;
  membershipState: string | null;
}

/**
 * Active community spaces with their CURRENT rule version and the caller's
 * own membership state. Joining always agrees to an exact rule version
 * (versioned rules), so the join affordance carries the version shown here.
 */
export async function listCommunitySpaces(
  deps: M18Deps,
  ctx: RequestContext,
  participantId: string,
): Promise<CommunitySpaceSummary[]> {
  await assertOwnView(deps, ctx, participantId);
  const res = await deps.pool.query(
    `SELECT DISTINCT ON (s.id)
            s.id, s.name, rv.id AS rule_version_id, rv.version_number, rv.rules_text, m.membership_state
       FROM community_social.community_spaces s
       JOIN community_social.community_rule_versions rv ON rv.space_id = s.id
       LEFT JOIN community_social.community_memberships m
              ON m.space_id = s.id AND m.participant_id = $1 AND m.membership_state = 'Active'
      WHERE s.space_state = 'Active'
      ORDER BY s.id, rv.version_number DESC`,
    [participantId],
  );
  return res.rows.map((r) => ({
    spaceId: r.id as string,
    name: r.name as string,
    ruleVersionId: r.rule_version_id as string,
    ruleVersionNumber: r.version_number as number,
    rulesText: r.rules_text as string,
    membershipState: (r.membership_state as string | null) ?? null,
  }));
}

export interface CommunityFeedPost {
  postId: string;
  authorParticipantId: string;
  authorDisplayName: string;
  contentText: string;
  publishedAt: string;
}

/**
 * Member-only community feed in STRICT reverse-chronological order
 * (ADR-113: default time ordering, no attention optimisation, governed
 * ranking pending approval). Blocks are fail-closed in BOTH directions:
 * a post never crosses an active block, whichever side created it.
 * Only Published posts appear — drafts are private to their author.
 */
export async function listCommunityFeed(
  deps: M18Deps,
  ctx: RequestContext,
  input: { spaceId: string; participantId: string },
): Promise<CommunityFeedPost[]> {
  await assertOwnView(deps, ctx, input.participantId);
  const membership = await deps.pool.query(
    `SELECT 1 FROM community_social.community_memberships
      WHERE space_id = $1 AND participant_id = $2 AND membership_state = 'Active'`,
    [input.spaceId, input.participantId],
  );
  if (membership.rows[0] === undefined) {
    throw new PlatformError('AUTHORISATION_DENIED', 'The feed requires an active community membership');
  }
  const res = await deps.pool.query(
    `SELECT p.id, p.author_participant_id, p.content_text, p.published_at
       FROM community_social.social_posts p
      WHERE p.space_id = $1 AND p.post_state = 'Published'
        AND NOT EXISTS (
          SELECT 1 FROM community_social.block_records b
           WHERE b.block_state = 'Active'
             AND ((b.blocker_actor_id = $2 AND b.blocked_actor_id = p.author_participant_id)
               OR (b.blocker_actor_id = p.author_participant_id AND b.blocked_actor_id = $2))
        )
      ORDER BY p.published_at DESC
      LIMIT 100`,
    [input.spaceId, input.participantId],
  );
  const rows = res.rows.map((r) => ({
    postId: r.id as string,
    authorParticipantId: r.author_participant_id as string,
    contentText: r.content_text as string,
    publishedAt: (r.published_at as Date).toISOString(),
  }));
  const name = await nameOf(deps, rows.map((r) => r.authorParticipantId));
  return rows.map((r) => ({ ...r, authorDisplayName: name(r.authorParticipantId) }));
}

export interface OwnBlockSummary {
  blockId: string;
  blockedActorId: string;
  /** The blocked person's name where it resolves; otherwise null. */
  blockedDisplayName: string | null;
  createdAt: string;
}

/**
 * The blocks this participant has placed.
 *
 * The safety screen has been telling people "you can undo it at any time"
 * while nothing anywhere listed a block or offered to lift one — a promise
 * the product did not keep. Undoing something you cannot see is not
 * something anyone can do.
 *
 * Only active blocks are returned. A lifted block is not a record the
 * participant needs kept in front of them, and re-listing it would invite
 * the reading that lifting was reversible on its own.
 */
export async function listMyBlocks(
  deps: M18Deps,
  ctx: RequestContext,
  blockerId: string,
): Promise<OwnBlockSummary[]> {
  const decision = await deps.checkPermission(ctx, {
    action: 'block.view-own',
    resource: {
      type: 'BlockRecord',
      id: 'own',
      state: 'Active',
      protectedExistence: true,
      ownerParticipantId: blockerId,
    },
  });
  assertAllowed(decision, false);
  const res = await deps.pool.query(
    `SELECT id, blocked_actor_id, created_at
       FROM community_social.block_records
      WHERE blocker_actor_id = $1 AND block_state = 'Active'
      ORDER BY created_at DESC`,
    [blockerId],
  );
  const names = await deps.participants.findDisplayNames(res.rows.map((r) => r.blocked_actor_id as string));
  return res.rows.map((r) => ({
    blockId: r.id as string,
    blockedActorId: r.blocked_actor_id as string,
    // Never a placeholder that reads like a name here: the participant
    // typed this identifier themselves, so showing it back is honest,
    // whereas "A community member" on every row would make two blocks
    // impossible to tell apart.
    blockedDisplayName: names.get(r.blocked_actor_id as string) ?? null,
    createdAt: (r.created_at as Date).toISOString(),
  }));
}

export interface OwnPostSummary {
  postId: string;
  spaceId: string;
  contentText: string;
  postState: string;
  createdAt: string;
  publishedAt: string | null;
}

/** The caller's own posts across spaces, drafts included (owner-only view). */
export async function listMyPosts(
  deps: M18Deps,
  ctx: RequestContext,
  participantId: string,
): Promise<OwnPostSummary[]> {
  await assertOwnView(deps, ctx, participantId);
  const res = await deps.pool.query(
    `SELECT id, space_id, content_text, post_state, created_at, published_at
       FROM community_social.social_posts
      WHERE author_participant_id = $1
      ORDER BY created_at DESC
      LIMIT 100`,
    [participantId],
  );
  return res.rows.map((r) => ({
    postId: r.id as string,
    spaceId: r.space_id as string,
    contentText: r.content_text as string,
    postState: r.post_state as string,
    createdAt: (r.created_at as Date).toISOString(),
    publishedAt: r.published_at === null ? null : (r.published_at as Date).toISOString(),
  }));
}

/**
 * The conversations a supporter is a party to.
 *
 * `listThreads` is keyed by participant identifier, and a supporter has no
 * participant record — so before this a thread could be written to them and
 * they could never read it. That is why relationship messaging was not
 * built until the way to read it existed: a channel somebody can only be
 * written into is worse than no channel, because the person writing
 * believes they were heard.
 *
 * Scoped inside the query to threads naming this actor, which is the same
 * shape `relationship.view-own` already uses: the reader here is the
 * related party, not the participant the conversation is about.
 */
export async function listThreadsForActor(deps: M18Deps, ctx: RequestContext): Promise<ThreadSummary[]> {
  const actorId = ctx.actor?.id;
  if (actorId === undefined) throw new PlatformError('AUTHORISATION_DENIED', 'Not authenticated');
  const decision = await deps.checkPermission(ctx, {
    action: 'thread.view-own',
    resource: { type: 'ConversationThread', id: 'mine', state: 'Any', protectedExistence: true },
  });
  assertAllowed(decision, false);
  const res = await deps.pool.query(
    `SELECT id, participant_a_id, participant_b_id, basis_type, thread_state, created_at
       FROM community_social.conversation_threads
      WHERE basis_type = 'AuthorisedRelationship' AND participant_b_id = $1
      ORDER BY created_at DESC`,
    [actorId],
  );
  const rows = res.rows.map((r) => ({
    threadId: r.id as string,
    otherParticipantId: r.participant_a_id as string,
    basisType: r.basis_type as string,
    threadState: r.thread_state as string,
    createdAt: (r.created_at as Date).toISOString(),
  }));
  // The far side here is a participant, so the directory is the right one
  // to ask — but the community placeholder is not the right answer when it
  // misses. A supporter is not in a community with the person they
  // support; they were approved by that person by name, and a row saying
  // "a community member" describes a relationship neither of them has.
  const names = await deps.participants.findDisplayNames(rows.map((r) => r.otherParticipantId));
  return rows.map((r) => ({ ...r, otherDisplayName: names.get(r.otherParticipantId) ?? null }));
}
