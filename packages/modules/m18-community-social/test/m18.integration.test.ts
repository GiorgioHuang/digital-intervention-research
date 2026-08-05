import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import pg from 'pg';
import { FixedClock, createRequestContext } from '@platform/kernel';
import { createPool, migrate } from '@platform/database';
import { POLICY_V1 } from '@platform/policy';
import {
  assignRole,
  createOrganisation,
  createRoleAssignmentQuery,
  createUserAccount,
  seedBootstrapAdministrator,
  type M01Deps,
} from '@platform/m01-identity-org';
import { createParticipantQuery, registerParticipant, type M02Deps } from '@platform/m02-participant';
import {
  approveRelationship,
  createPermissionService,
  proposeRelationship,
  recordConsentDecision,
  type M03Deps,
} from '@platform/m03-consent-permission';
import {
  createBlock,
  createBlockQuery,
  createCommunitySpace,
  draftSocialPost,
  joinCommunity,
  listCommunityFeed,
  listOpenModerationCases,
  publishSocialPost,
  recordModerationDecision,
  listMyBlocks,
  revokeBlock,
  submitUserReport,
  type M18Deps,
} from '../src/index.js';

const DATABASE_URL =
  process.env['DATABASE_URL'] ?? 'postgres://platform:platform_dev_only@localhost:5432/research_platform';

async function probe(): Promise<boolean> {
  const c = new pg.Client({ connectionString: DATABASE_URL, connectionTimeoutMillis: 2000 });
  try {
    await c.connect();
    await c.end();
    return true;
  } catch {
    return false;
  }
}
const dbAvailable = await probe();

describe.skipIf(!dbAvailable)('M18 block/report/moderation/community (integration)', () => {
  let pool: pg.Pool;
  const clock = new FixedClock('2026-07-30T12:00:00Z');
  let m01: M01Deps, m02: M02Deps, m03: M03Deps, m18: M18Deps;
  let adminId: string, orgId: string, moderatorId: string, supporterId: string, coordinatorId: string;
  let patAccountId: string, patId: string;
  let strangerAccountId: string, strangerId: string;
  const ctx = (actorId: string) => createRequestContext({ actor: { type: 'user', id: actorId } });

  beforeAll(async () => {
    await migrate({ databaseUrl: DATABASE_URL, direction: 'up' });
    pool = createPool({ connectionString: DATABASE_URL, applicationName: 'm18-tests' });
    const participants = createParticipantQuery(pool);
    const permissions = createPermissionService({
      pool,
      clock,
      policy: POLICY_V1,
      roleAssignments: createRoleAssignmentQuery(pool),
      participantIdentity: participants,
      blocks: createBlockQuery(pool),
    });
    const checkPermission = permissions.evaluate.bind(permissions);
    m01 = { pool, clock, checkPermission };
    m02 = { pool, clock, checkPermission };
    m03 = { pool, clock, permissions };
    m18 = { pool, clock, checkPermission, participants };

    ({ userAccountId: adminId } = await seedBootstrapAdministrator(pool, clock, { displayName: 'Admin' }));
    ({ organisationId: orgId } = await createOrganisation(m01, ctx(adminId), { name: 'M18 Org' }));
    const adminCtx = createRequestContext({ actor: { type: 'user', id: adminId }, organisationId: orgId });
    ({ userAccountId: patAccountId } = await createUserAccount(m01, adminCtx, { displayName: 'Pat' }));
    ({ userAccountId: supporterId } = await createUserAccount(m01, adminCtx, { displayName: 'Sam' }));
    ({ userAccountId: moderatorId } = await createUserAccount(m01, adminCtx, { displayName: 'Mo' }));
    ({ userAccountId: coordinatorId } = await createUserAccount(m01, adminCtx, { displayName: 'Coord' }));
    await assignRole(m01, adminCtx, { userAccountId: patAccountId, role: 'Participant', confirmed: true });
    await assignRole(m01, adminCtx, { userAccountId: supporterId, role: 'Supporter', confirmed: true });
    await assignRole(m01, adminCtx, { userAccountId: moderatorId, role: 'Moderator', confirmed: true });
    await assignRole(m01, adminCtx, { userAccountId: coordinatorId, role: 'ResearchCoordinator', confirmed: true });
    await assignRole(m01, adminCtx, { userAccountId: adminId, role: 'OrganisationAdministrator', organisationId: orgId, confirmed: true });

    ({ participantId: patId } = await registerParticipant(m02, ctx(coordinatorId), {
      displayName: 'Pat P.',
      userAccountId: patAccountId,
    }));

    // A second participant with no connection to Pat at all. Present to
    // prove that holding the Participant role does not let someone act on
    // another participant's blocks.
    ({ userAccountId: strangerAccountId } = await createUserAccount(m01, adminCtx, { displayName: 'Stranger' }));
    await assignRole(m01, adminCtx, { userAccountId: strangerAccountId, role: 'Participant', confirmed: true });
    ({ participantId: strangerId } = await registerParticipant(m02, ctx(coordinatorId), {
      displayName: 'Stranger S.',
      userAccountId: strangerAccountId,
    }));

    // Supporter with active relationship + consent (to prove Block overrides both).
    const { relationshipId } = await proposeRelationship(m03, ctx(coordinatorId), {
      participantId: patId,
      relatedActorId: supporterId,
      relationshipType: 'Friend',
      permittedActions: ['participant.view-shared'],
    });
    await approveRelationship(m03, ctx(patAccountId), { relationshipId, expectedVersion: 1, confirmed: true });
    await recordConsentDecision(m03, ctx(patAccountId), {
      participantId: patId,
      scope: 'supporter-involvement',
      decision: 'Granted',
      templateVersion: 'ct_v1',
    });
  }, 30_000);

  afterAll(async () => {
    await pool?.end();
  });

  const supporterView = () =>
    m03.permissions.evaluate(ctx(supporterId), {
      action: 'participant.view-shared',
      resource: {
        type: 'ParticipantRecord',
        id: patId,
        state: 'Active',
        protectedExistence: true,
        ownerParticipantId: patId,
      },
    });

  let blockId: string;

  it('block fails closed synchronously: relationship + consent no longer grant access', async () => {
    expect((await supporterView()).outcome).toBe('Allow');
    ({ blockId } = await createBlock(m18, ctx(patAccountId), {
      blockerId: patId,
      blockedActorId: supporterId,
      confirmed: true,
    }));
    const after = await supporterView();
    expect(after.outcome).toBe('DenyAndHideExistence');
    expect(after.reason).toBe('blocked-interaction');
    const outbox = await pool.query(
      `SELECT count(*)::int AS n FROM platform_kernel.outbox_messages WHERE event_type = 'BlockCreated' AND aggregate_id = $1`,
      [blockId],
    );
    expect(outbox.rows[0].n).toBe(1);
  });

  /**
   * A block is the one protection a participant can put in place without
   * asking anyone. If another participant can take it away, it is not a
   * protection at all — and the person with the strongest motive to remove
   * it is the person it was placed against.
   */
  it('NEGATIVE another participant cannot revoke, or create, someone else\'s block', async () => {
    await expect(
      revokeBlock(m18, ctx(strangerAccountId), { blockId, confirmed: true }),
    ).rejects.toMatchObject({ code: 'RESOURCE_NOT_FOUND' });
    const still = await pool.query(`SELECT block_state FROM community_social.block_records WHERE id = $1`, [blockId]);
    expect(still.rows[0].block_state).toBe('Active');

    // Nor can they place one in another participant's name.
    await expect(
      createBlock(m18, ctx(strangerAccountId), { blockerId: patId, blockedActorId: moderatorId, confirmed: true }),
    ).rejects.toMatchObject({ code: 'RESOURCE_NOT_FOUND' });
    const none = await pool.query(
      `SELECT count(*)::int AS n FROM community_social.block_records WHERE blocker_actor_id = $1 AND blocked_actor_id = $2`,
      [patId, moderatorId],
    );
    expect(none.rows[0].n).toBe(0);

    // Their own block is unaffected by all of this.
    const { blockId: ownBlockId } = await createBlock(m18, ctx(strangerAccountId), {
      blockerId: strangerId,
      blockedActorId: supporterId,
      confirmed: true,
    });
    await revokeBlock(m18, ctx(strangerAccountId), { blockId: ownBlockId, confirmed: true });
  });

  /**
   * The confirmation on the safety screen has always said a block can be
   * undone at any time. Nothing listed one, so that promise had nothing
   * behind it.
   */
  it('a participant lists the blocks they placed, and only their own', async () => {
    const mine = await listMyBlocks(m18, ctx(patAccountId), patId);
    expect(mine.map((b) => b.blockId)).toContain(blockId);
    expect(mine.every((b) => b.blockId !== 'blk_someone_else')).toBe(true);

    // The stranger's own list is empty — they revoked their only block —
    // and Pat's list is not readable by them at all.
    expect(await listMyBlocks(m18, ctx(strangerAccountId), strangerId)).toHaveLength(0);
    await expect(listMyBlocks(m18, ctx(strangerAccountId), patId)).rejects.toMatchObject({
      code: 'RESOURCE_NOT_FOUND',
    });
  });

  it('NEGATIVE duplicate active block rejected by the database', async () => {
    await expect(
      createBlock(m18, ctx(patAccountId), { blockerId: patId, blockedActorId: supporterId, confirmed: true }),
    ).rejects.toThrow(/duplicate key/i);
  });

  it('report remains available AFTER block (ADR-038) and opens a ModerationCase; reporter identity not in events', async () => {
    const { reportId, moderationCaseId } = await submitUserReport(m18, ctx(supporterId), {
      reporterId: supporterId,
      reportedActorId: patAccountId,
      category: 'harassment',
      description: 'details for moderators only',
    });
    const evt = await pool.query(
      `SELECT payload FROM platform_kernel.outbox_messages WHERE event_type = 'UserReportSubmitted' AND aggregate_id = $1`,
      [reportId],
    );
    expect(JSON.stringify(evt.rows[0].payload)).not.toContain(supporterId);
    const mc = await pool.query(`SELECT case_state FROM community_social.moderation_cases WHERE id = $1`, [moderationCaseId]);
    expect(mc.rows[0].case_state).toBe('Reported');
  });

  it('NEGATIVE automation cannot decide moderation; human moderator can; decision is immutable', async () => {
    const { moderationCaseId } = await submitUserReport(m18, ctx(patAccountId), {
      reporterId: patAccountId,
      reportedActorId: supporterId,
      category: 'spam',
      description: 'x',
    });
    await expect(
      recordModerationDecision(
        m18,
        createRequestContext({ actor: { type: 'service-account', id: 'sa_ai' } }),
        { moderationCaseId, decision: 'Ban', reason: 'auto', confirmed: true },
      ),
    ).rejects.toMatchObject({ code: 'AUTHORISATION_DENIED' });

    const { moderationDecisionId } = await recordModerationDecision(m18, ctx(moderatorId), {
      moderationCaseId,
      decision: 'Warn',
      reason: 'first occurrence',
      confirmed: true,
    });
    await expect(
      pool.query(`UPDATE community_social.moderation_decisions SET decision = 'Ban' WHERE id = $1`, [moderationDecisionId]),
    ).rejects.toThrow(/immutable/);
  });

  it('block revocation restores nothing (ADR-037): view stays denied until authority re-established', async () => {
    await revokeBlock(m18, ctx(patAccountId), { blockId, confirmed: true });
    // Block gone, but this test proves revocation did not auto-restore
    // anything else: relationship + consent were untouched here so access
    // returns ONLY because those authorities still stand on their own.
    const after = await supporterView();
    expect(after.outcome).toBe('Allow');
    const blocks = await pool.query(`SELECT block_state FROM community_social.block_records WHERE id = $1`, [blockId]);
    expect(blocks.rows[0].block_state).toBe('Revoked');
  });

  it('community: consent-gated join with exact rule version; posting requires membership; publish is confirmed', async () => {
    const { spaceId, ruleVersionId } = await createCommunitySpace(m18, createRequestContext({ actor: { type: 'user', id: adminId }, organisationId: orgId }), {
      name: 'Garden Stories',
      rulesText: 'Be kind.',
    });

    // No community-participation consent -> denied.
    await expect(
      joinCommunity(m18, ctx(patAccountId), { spaceId, participantId: patId, ruleVersionId }),
    ).rejects.toMatchObject({ code: 'AUTHORISATION_DENIED' });

    await recordConsentDecision(m03, ctx(patAccountId), {
      participantId: patId,
      scope: 'community-participation',
      decision: 'Granted',
      templateVersion: 'ct_v1',
    });
    const { membershipId } = await joinCommunity(m18, ctx(patAccountId), { spaceId, participantId: patId, ruleVersionId });
    const mem = await pool.query(`SELECT rule_version_id FROM community_social.community_memberships WHERE id = $1`, [membershipId]);
    expect(mem.rows[0].rule_version_id).toBe(ruleVersionId);

    const { postId } = await draftSocialPost(m18, ctx(patAccountId), {
      spaceId,
      participantId: patId,
      contentText: 'Hello garden friends',
    });
    // Draft is not published; publication needs explicit confirmation.
    await expect(
      publishSocialPost(m18, ctx(patAccountId), { postId, participantId: patId, confirmed: false }),
    ).rejects.toMatchObject({ code: 'CONFIRMATION_REQUIRED' });
    await publishSocialPost(m18, ctx(patAccountId), { postId, participantId: patId, confirmed: true });
    const post = await pool.query(`SELECT post_state FROM community_social.social_posts WHERE id = $1`, [postId]);
    expect(post.rows[0].post_state).toBe('Published');

    // Decision D-12: the feed carries a name, not an internal identifier.
    // Until PublicProfile exists that name is the one on the participant
    // record, and it must actually be resolved — a screen that prints the
    // key hands every reader a handle for correlating that person.
    const feed = await listCommunityFeed(m18, ctx(patAccountId), { spaceId, participantId: patId });
    const mine = feed.find((f) => f.postId === postId);
    expect(mine?.authorDisplayName).toBe('Pat P.');
    expect(mine?.authorDisplayName).not.toContain('pt_');
  });

  it('a participant whose name cannot be resolved is described, never numbered', async () => {
    // Nothing in the platform deletes a participant row, so this is not a
    // reachable state today; the guarantee still has to hold, because the
    // alternative fallback — printing the id — is the exact defect D-12
    // exists to remove.
    const bare: M18Deps = { ...m18, participants: { findDisplayNames: async () => new Map() } };
    const { spaceId, ruleVersionId } = await createCommunitySpace(
      m18,
      createRequestContext({ actor: { type: 'user', id: adminId }, organisationId: orgId }),
      { name: 'Unnamed Corner', rulesText: 'Be kind.' },
    );
    await joinCommunity(m18, ctx(patAccountId), { spaceId, participantId: patId, ruleVersionId });
    const { postId } = await draftSocialPost(m18, ctx(patAccountId), {
      spaceId,
      participantId: patId,
      contentText: 'Hello again',
    });
    await publishSocialPost(m18, ctx(patAccountId), { postId, participantId: patId, confirmed: true });

    const feed = await listCommunityFeed(bare, ctx(patAccountId), { spaceId, participantId: patId });
    expect(feed[0]?.authorDisplayName).toBe('A community member');
    expect(feed[0]?.authorDisplayName).not.toContain(patId);
  });
  /**
   * Until this was fixed, every content decision was a lie of the worst
   * kind available here: "Remove content" closed the case as Actioned,
   * told the moderator it was done, and left the post in the community
   * feed. post_state carried Hidden, Removed and Restored in its CHECK
   * constraint and nothing ever wrote any of them.
   */
  it('hiding reported content takes it out of the feed, and restoring puts it back', async () => {
    const { spaceId, ruleVersionId } = await createCommunitySpace(
      m18,
      createRequestContext({ actor: { type: 'user', id: adminId }, organisationId: orgId }),
      { name: 'Moderated Corner', rulesText: 'Be kind.' },
    );
    // Granted here rather than leaned on from an earlier test: this one
    // is about moderation, and it should not fail because the order of
    // the file changed.
    await recordConsentDecision(m03, ctx(patAccountId), {
      participantId: patId,
      scope: 'community-participation',
      decision: 'Granted',
      templateVersion: 'ct_v1',
    });
    await joinCommunity(m18, ctx(patAccountId), { spaceId, participantId: patId, ruleVersionId });
    const { postId } = await draftSocialPost(m18, ctx(patAccountId), {
      spaceId,
      participantId: patId,
      contentText: 'Something someone objected to',
    });
    await publishSocialPost(m18, ctx(patAccountId), { postId, participantId: patId, confirmed: true });
    expect(
      (await listCommunityFeed(m18, ctx(patAccountId), { spaceId, participantId: patId })).some((f) => f.postId === postId),
    ).toBe(true);

    const { moderationCaseId } = await submitUserReport(m18, ctx(supporterId), {
      reporterId: supporterId,
      reportedActorId: patAccountId,
      reportedContentId: postId,
      category: 'harassment',
      description: 'this post',
    });
    await recordModerationDecision(m18, ctx(moderatorId), {
      moderationCaseId,
      decision: 'Hide',
      reason: 'Breaches the space rules',
      confirmed: true,
    });
    const hidden = await pool.query(`SELECT post_state FROM community_social.social_posts WHERE id = $1`, [postId]);
    expect(hidden.rows[0].post_state).toBe('Hidden');
    expect(
      (await listCommunityFeed(m18, ctx(patAccountId), { spaceId, participantId: patId })).some((f) => f.postId === postId),
    ).toBe(false);

    // Reopened so a second decision is allowed on the same case.
    await pool.query(`UPDATE community_social.moderation_cases SET case_state = 'Reopened' WHERE id = $1`, [
      moderationCaseId,
    ]);
    await recordModerationDecision(m18, ctx(moderatorId), {
      moderationCaseId,
      decision: 'Restore',
      reason: 'Reconsidered on appeal',
      confirmed: true,
    });
    expect(
      (await listCommunityFeed(m18, ctx(patAccountId), { spaceId, participantId: patId })).some((f) => f.postId === postId),
    ).toBe(true);
  });

  /**
   * Without this, "Remove content" on a case about behaviour succeeds,
   * reports that the content was removed, and removes nothing.
   */
  it('NEGATIVE a content decision on a case that names no content is refused', async () => {
    const { moderationCaseId } = await submitUserReport(m18, ctx(supporterId), {
      reporterId: supporterId,
      reportedActorId: patAccountId,
      category: 'harassment',
      description: 'how they spoke to me',
    });
    await expect(
      recordModerationDecision(m18, ctx(moderatorId), {
        moderationCaseId,
        decision: 'Remove',
        reason: 'x',
        confirmed: true,
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
    const untouched = await pool.query(`SELECT case_state FROM community_social.moderation_cases WHERE id = $1`, [
      moderationCaseId,
    ]);
    expect(untouched.rows[0].case_state).toBe('Reported');
  });

  /**
   * Escalating used to close the case as Actioned, so "pass this on" and
   * "this is dealt with" were the same button: the case left the queue and
   * nobody was passed anything.
   */
  it('escalating leaves the case open rather than closing it as actioned', async () => {
    const { moderationCaseId } = await submitUserReport(m18, ctx(supporterId), {
      reporterId: supporterId,
      reportedActorId: patAccountId,
      category: 'safety',
      description: 'beyond me',
    });
    await recordModerationDecision(m18, ctx(moderatorId), {
      moderationCaseId,
      decision: 'Escalate',
      reason: 'This needs the safety team',
      confirmed: true,
    });
    const after = await pool.query(`SELECT case_state FROM community_social.moderation_cases WHERE id = $1`, [
      moderationCaseId,
    ]);
    expect(after.rows[0].case_state).toBe('Action Required');
    expect(
      (await listOpenModerationCases(m18, ctx(moderatorId))).some((c) => c.moderationCaseId === moderationCaseId),
    ).toBe(true);
  });

});

describe.skipIf(dbAvailable)('M18 integration (skipped)', () => {
  it('skipped because no PostgreSQL is reachable', () => {
    expect(dbAvailable).toBe(false);
  });
});
