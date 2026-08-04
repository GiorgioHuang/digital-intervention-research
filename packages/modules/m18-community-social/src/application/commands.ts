import { newId, PlatformError, type Clock, type RequestContext } from '@platform/kernel';
import { appendToOutbox, recordAuditEvent, withTransaction, type Pool } from '@platform/database';
import { assertAllowed, type PolicyDecisionResult } from '@platform/policy';
import { M18_EVENTS } from '../contracts/index.js';

export type PermissionCheck = (
  ctx: RequestContext,
  request: {
    action: string;
    resource: { type: string; id: string; state: string; protectedExistence: boolean; ownerParticipantId?: string };
    confirmed?: boolean;
  },
) => Promise<PolicyDecisionResult>;

/**
 * Just enough of the participant read side for this module to put a name
 * where it would otherwise print an internal identifier (decision D-12).
 * Declared here rather than imported from M02 so the dependency stays one
 * way: M18 states what it needs, and the composition root supplies M02's
 * query object, which satisfies this structurally.
 */
export interface ParticipantNamePort {
  findDisplayNames(participantIds: string[]): Promise<Map<string, string>>;
}

export interface M18Deps {
  pool: Pool;
  clock: Clock;
  checkPermission: PermissionCheck;
  participants: ParticipantNamePort;
}

/**
 * Create a Block. Synchronous, fails closed from this moment on (ATR-016):
 * the permission service reads blocks fresh on every evaluation, so
 * discovery/interaction paths are refused immediately after commit.
 */
export async function createBlock(
  deps: M18Deps,
  ctx: RequestContext,
  input: { blockerId: string; blockedActorId: string; confirmed: boolean },
): Promise<{ blockId: string }> {
  const decision = await deps.checkPermission(ctx, {
    action: 'block.create',
    resource: {
      type: 'BlockRecord',
      id: 'new',
      state: 'Draft',
      protectedExistence: true,
      ownerParticipantId: input.blockerId,
    },
    confirmed: input.confirmed,
  });
  assertAllowed(decision, input.confirmed);

  const blockId = newId('blk');
  const now = deps.clock.now();
  await withTransaction(deps.pool, async (client) => {
    await client.query(
      `INSERT INTO community_social.block_records (id, blocker_actor_id, blocked_actor_id) VALUES ($1, $2, $3)`,
      [blockId, input.blockerId, input.blockedActorId],
    );
    // Atomic pair (Doc 16 §54): BlockRecord + BlockCreated.
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: M18_EVENTS.BlockCreated,
      sourceModule: 'M18',
      aggregateType: 'BlockRecord',
      aggregateId: blockId,
      occurredAt: now,
    });
    await recordAuditEvent(client, ctx, {
      action: 'block.create',
      targetType: 'BlockRecord',
      targetId: blockId,
      occurredAt: now,
      result: 'Succeeded',
      source: 'M18',
      policyVersion: decision.policyVersion,
    });
  });
  return { blockId };
}

/** Revoking a Block restores nothing that the Block suppressed (ADR-037). */
export async function revokeBlock(
  deps: M18Deps,
  ctx: RequestContext,
  input: { blockId: string; blockerId: string; confirmed: boolean },
): Promise<void> {
  const decision = await deps.checkPermission(ctx, {
    action: 'block.revoke',
    resource: {
      type: 'BlockRecord',
      id: input.blockId,
      state: 'Active',
      protectedExistence: true,
      ownerParticipantId: input.blockerId,
    },
    confirmed: input.confirmed,
  });
  assertAllowed(decision, input.confirmed);
  const now = deps.clock.now();
  await withTransaction(deps.pool, async (client) => {
    const res = await client.query(
      `UPDATE community_social.block_records
          SET block_state = 'Revoked', revoked_at = $2, record_version = record_version + 1
        WHERE id = $1 AND block_state = 'Active'`,
      [input.blockId, now],
    );
    if (res.rowCount !== 1) throw new PlatformError('INVALID_STATE_TRANSITION', 'Block is not active');
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: M18_EVENTS.BlockRevoked,
      sourceModule: 'M18',
      aggregateType: 'BlockRecord',
      aggregateId: input.blockId,
      occurredAt: now,
    });
  });
}

/**
 * Submit a UserReport. Reports stay available regardless of Block state
 * (ADR-038) — deliberately NOT an interaction-gated action. A
 * ModerationCase is opened in the same transaction; the report's event and
 * case never carry the reporter identity (Doc 14).
 */
export async function submitUserReport(
  deps: M18Deps,
  ctx: RequestContext,
  input: {
    reporterId: string;
    reportedActorId: string;
    reportedContentId?: string;
    category: string;
    description: string;
  },
): Promise<{ reportId: string; moderationCaseId: string }> {
  const decision = await deps.checkPermission(ctx, {
    action: 'report.submit',
    resource: { type: 'UserReport', id: 'new', state: 'Draft', protectedExistence: true },
  });
  assertAllowed(decision, false);

  const reportId = newId('rep');
  const moderationCaseId = newId('mc');
  const now = deps.clock.now();
  await withTransaction(deps.pool, async (client) => {
    await client.query(
      `INSERT INTO community_social.user_reports
         (id, reporter_actor_id, reported_actor_id, reported_content_id, category, description)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [reportId, input.reporterId, input.reportedActorId, input.reportedContentId ?? null, input.category, input.description],
    );
    await client.query(
      `INSERT INTO community_social.moderation_cases (id, user_report_id, subject_actor_id) VALUES ($1, $2, $3)`,
      [moderationCaseId, reportId, input.reportedActorId],
    );
    // Payloads exclude reporter identity (Doc 15 §61).
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: M18_EVENTS.UserReportSubmitted,
      sourceModule: 'M18',
      aggregateType: 'UserReport',
      aggregateId: reportId,
      occurredAt: now,
      payload: { category: input.category },
    });
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: M18_EVENTS.ModerationCaseCreated,
      sourceModule: 'M18',
      aggregateType: 'ModerationCase',
      aggregateId: moderationCaseId,
      occurredAt: now,
    });
  });
  return { reportId, moderationCaseId };
}

/** Human, confirmed, immutable ModerationDecision; AI/automation refused. */
export async function recordModerationDecision(
  deps: M18Deps,
  ctx: RequestContext,
  input: {
    moderationCaseId: string;
    decision: 'Dismiss' | 'Warn' | 'Restrict' | 'Hide' | 'Remove' | 'Suspend' | 'Disconnect' | 'Ban' | 'Restore' | 'Escalate';
    reason: string;
    confirmed: boolean;
  },
): Promise<{ moderationDecisionId: string }> {
  if (ctx.actor?.type !== 'user') {
    throw new PlatformError('AUTHORISATION_DENIED', 'Moderation decisions require an authenticated human');
  }
  const decision = await deps.checkPermission(ctx, {
    action: 'moderation.decide',
    resource: { type: 'ModerationCase', id: input.moderationCaseId, state: 'In Review', protectedExistence: true },
    confirmed: input.confirmed,
  });
  assertAllowed(decision, input.confirmed);

  const moderationDecisionId = newId('md');
  const now = deps.clock.now();
  await withTransaction(deps.pool, async (client) => {
    const res = await client.query(
      `UPDATE community_social.moderation_cases
          SET case_state = CASE WHEN $2 = 'Dismiss' THEN 'Dismissed' ELSE 'Actioned' END,
              record_version = record_version + 1, updated_at = $3
        WHERE id = $1 AND case_state IN ('Reported', 'Awaiting Triage', 'In Review', 'Action Required', 'Reopened')`,
      [input.moderationCaseId, input.decision, now],
    );
    if (res.rowCount !== 1) throw new PlatformError('INVALID_STATE_TRANSITION', 'Case state does not allow a decision');
    await client.query(
      `INSERT INTO community_social.moderation_decisions (id, moderation_case_id, decision, reason, decided_by_actor_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [moderationDecisionId, input.moderationCaseId, input.decision, input.reason, ctx.actor!.id],
    );
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: M18_EVENTS.ModerationDecisionRecorded,
      sourceModule: 'M18',
      aggregateType: 'ModerationCase',
      aggregateId: input.moderationCaseId,
      occurredAt: now,
      payload: { decision: input.decision },
    });
    await recordAuditEvent(client, ctx, {
      action: 'moderation.decide',
      targetType: 'ModerationCase',
      targetId: input.moderationCaseId,
      occurredAt: now,
      result: 'Succeeded',
      source: 'M18',
      policyVersion: decision.policyVersion,
    });
  });
  return { moderationDecisionId };
}

export async function createCommunitySpace(
  deps: M18Deps,
  ctx: RequestContext,
  input: { name: string; rulesText: string },
): Promise<{ spaceId: string; ruleVersionId: string }> {
  const decision = await deps.checkPermission(ctx, {
    action: 'community.create',
    resource: { type: 'CommunitySpace', id: 'new', state: 'Draft', protectedExistence: false },
  });
  assertAllowed(decision, false);
  const spaceId = newId('cs');
  const ruleVersionId = newId('crv');
  const now = deps.clock.now();
  await withTransaction(deps.pool, async (client) => {
    await client.query(
      `INSERT INTO community_social.community_spaces (id, name, space_state) VALUES ($1, $2, 'Active')`,
      [spaceId, input.name],
    );
    await client.query(
      `INSERT INTO community_social.community_rule_versions (id, space_id, version_number, rules_text)
       VALUES ($1, $2, 1, $3)`,
      [ruleVersionId, spaceId, input.rulesText],
    );
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: M18_EVENTS.CommunitySpaceCreated,
      sourceModule: 'M18',
      aggregateType: 'CommunitySpace',
      aggregateId: spaceId,
      occurredAt: now,
    });
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: M18_EVENTS.CommunityRuleVersionPublished,
      sourceModule: 'M18',
      aggregateType: 'CommunityRuleVersion',
      aggregateId: ruleVersionId,
      occurredAt: now,
    });
  });
  return { spaceId, ruleVersionId };
}

/**
 * Join a Community: requires the community-participation consent scope and
 * records the exact CommunityRuleVersion presented (versioned rules).
 */
export async function joinCommunity(
  deps: M18Deps,
  ctx: RequestContext,
  input: { spaceId: string; participantId: string; ruleVersionId: string },
): Promise<{ membershipId: string }> {
  const decision = await deps.checkPermission(ctx, {
    action: 'community.join',
    resource: {
      type: 'CommunityMembership',
      id: 'new',
      state: 'Draft',
      protectedExistence: false,
      ownerParticipantId: input.participantId,
    },
  });
  assertAllowed(decision, false);
  const membershipId = newId('cm');
  const now = deps.clock.now();
  await withTransaction(deps.pool, async (client) => {
    await client.query(
      `INSERT INTO community_social.community_memberships (id, space_id, participant_id, rule_version_id)
       VALUES ($1, $2, $3, $4)`,
      [membershipId, input.spaceId, input.participantId, input.ruleVersionId],
    );
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: M18_EVENTS.CommunityMembershipActivated,
      sourceModule: 'M18',
      aggregateType: 'CommunityMembership',
      aggregateId: membershipId,
      occurredAt: now,
    });
  });
  return { membershipId };
}

/** Draft + explicit confirmed publication ("Publish to [Community]"). */
export async function draftSocialPost(
  deps: M18Deps,
  ctx: RequestContext,
  input: { spaceId: string; participantId: string; contentText: string },
): Promise<{ postId: string }> {
  const decision = await deps.checkPermission(ctx, {
    action: 'post.draft',
    resource: {
      type: 'SocialPost',
      id: 'new',
      state: 'Draft',
      protectedExistence: false,
      ownerParticipantId: input.participantId,
    },
  });
  assertAllowed(decision, false);
  const membership = await deps.pool.query(
    `SELECT 1 FROM community_social.community_memberships
      WHERE space_id = $1 AND participant_id = $2 AND membership_state = 'Active'`,
    [input.spaceId, input.participantId],
  );
  if (membership.rows[0] === undefined) {
    throw new PlatformError('AUTHORISATION_DENIED', 'Posting requires an active community membership');
  }
  const postId = newId('sp');
  const now = deps.clock.now();
  await withTransaction(deps.pool, async (client) => {
    await client.query(
      `INSERT INTO community_social.social_posts (id, space_id, author_participant_id, content_text)
       VALUES ($1, $2, $3, $4)`,
      [postId, input.spaceId, input.participantId, input.contentText],
    );
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: M18_EVENTS.SocialPostDrafted,
      sourceModule: 'M18',
      aggregateType: 'SocialPost',
      aggregateId: postId,
      occurredAt: now,
    });
  });
  return { postId };
}

export async function publishSocialPost(
  deps: M18Deps,
  ctx: RequestContext,
  input: { postId: string; participantId: string; confirmed: boolean },
): Promise<void> {
  const decision = await deps.checkPermission(ctx, {
    action: 'post.publish',
    resource: {
      type: 'SocialPost',
      id: input.postId,
      state: 'Draft',
      protectedExistence: false,
      ownerParticipantId: input.participantId,
    },
    confirmed: input.confirmed,
  });
  assertAllowed(decision, input.confirmed);
  const now = deps.clock.now();
  await withTransaction(deps.pool, async (client) => {
    const res = await client.query(
      `UPDATE community_social.social_posts
          SET post_state = 'Published', published_at = $2, record_version = record_version + 1, updated_at = $2
        WHERE id = $1 AND post_state = 'Draft' AND author_participant_id = $3`,
      [input.postId, now, input.participantId],
    );
    if (res.rowCount !== 1) throw new PlatformError('INVALID_STATE_TRANSITION', 'Post is not a draft owned by this participant');
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: M18_EVENTS.SocialPostPublished,
      sourceModule: 'M18',
      aggregateType: 'SocialPost',
      aggregateId: input.postId,
      occurredAt: now,
    });
  });
}
