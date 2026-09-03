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
  changeVisibility,
  confirmTestimony,
  createArchive,
  createItem,
  findArchiveForContribution,
  getMyLifeStory,
  getSharedLifeStory,
  listStoriesSharedWithMe,
  listContributionsAwaitingReview,
  proposeContribution,
  reviewContribution,
  reviseItem,
  withdrawItem,
  type M17Deps,
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

describe.skipIf(!dbAvailable)('M17 Life Story (integration)', () => {
  let pool: pg.Pool;
  const clock = new FixedClock('2026-07-30T12:00:00Z');
  let m01: M01Deps, m02: M02Deps, m03: M03Deps, m17: M17Deps;
  let names: ReturnType<typeof createParticipantQuery>;
  let adminId: string, orgId: string, coordinatorId: string, supporterId: string;
  let participantAccountId: string, participantId: string;
  let archiveId: string, itemId: string, aiDraftVersionId: string;

  const ctx = (actorId: string) => createRequestContext({ actor: { type: 'user', id: actorId } });

  beforeAll(async () => {
    await migrate({ databaseUrl: DATABASE_URL, direction: 'up' });
    pool = createPool({ connectionString: DATABASE_URL, applicationName: 'm17-tests' });
    const participants = createParticipantQuery(pool);
    const permissions = createPermissionService({
      pool,
      clock,
      policy: POLICY_V1,
      roleAssignments: createRoleAssignmentQuery(pool),
      participantIdentity: participants,
    });
    const checkPermission = permissions.evaluate.bind(permissions);
    m01 = { pool, clock, checkPermission };
    m02 = { pool, clock, checkPermission };
    m03 = { pool, clock, permissions };
    m17 = { pool, clock, checkPermission };
    names = createParticipantQuery(pool);

    ({ userAccountId: adminId } = await seedBootstrapAdministrator(pool, clock, { displayName: 'Admin' }));
    ({ organisationId: orgId } = await createOrganisation(m01, ctx(adminId), { name: 'M17 Org' }));
    const adminCtx = createRequestContext({ actor: { type: 'user', id: adminId }, organisationId: orgId });
    ({ userAccountId: participantAccountId } = await createUserAccount(m01, adminCtx, { displayName: 'Pat' }));
    ({ userAccountId: supporterId } = await createUserAccount(m01, adminCtx, { displayName: 'Sam' }));
    ({ userAccountId: coordinatorId } = await createUserAccount(m01, adminCtx, { displayName: 'Coord' }));
    await assignRole(m01, adminCtx, { userAccountId: participantAccountId, role: 'Participant', confirmed: true });
    await assignRole(m01, adminCtx, { userAccountId: supporterId, role: 'Supporter', confirmed: true });
    await assignRole(m01, adminCtx, { userAccountId: coordinatorId, role: 'ResearchCoordinator', organisationId: orgId, confirmed: true });
    await assignRole(m01, adminCtx, { userAccountId: adminId, role: 'ResearchCoordinator', confirmed: true });

    ({ participantId } = await registerParticipant(
      m02,
      createRequestContext({ actor: { type: 'user', id: coordinatorId }, organisationId: orgId }),
      { displayName: 'Pat P.', userAccountId: participantAccountId },
    ));
  }, 30_000);

  afterAll(async () => {
    await pool?.end();
  });

  it('participant creates a private-by-default archive and item', async () => {
    ({ archiveId } = await createArchive(m17, ctx(participantAccountId), { participantId }));
    ({ itemId, versionId: aiDraftVersionId } = await createItem(m17, ctx(participantAccountId), {
      archiveId,
      title: 'My garden years',
      contentText: 'AI-suggested draft about gardening memories.',
      sourceType: 'AIDraft',
    }));
    const item = await pool.query(`SELECT item_state, visibility FROM life_story.items WHERE id = $1`, [itemId]);
    expect(item.rows[0].item_state).toBe('Draft');
    expect(item.rows[0].visibility).toBe('Private');
  });

  it('NEGATIVE AI Draft is not testimony: version records AIDraft source and NotTestimony', async () => {
    const v = await pool.query(`SELECT source_type, testimony_state FROM life_story.item_versions WHERE id = $1`, [
      aiDraftVersionId,
    ]);
    expect(v.rows[0].source_type).toBe('AIDraft');
    expect(v.rows[0].testimony_state).toBe('NotTestimony');
  });

  it('NEGATIVE non-owner: coordinator/supporter cannot confirm testimony, and existence is hidden', async () => {
    for (const actor of [coordinatorId, supporterId]) {
      await expect(
        confirmTestimony(m17, ctx(actor), { itemId, versionId: aiDraftVersionId, confirmed: true }),
      ).rejects.toMatchObject({ code: 'RESOURCE_NOT_FOUND' });
    }
  });

  it('only the participant confirms the EXACT version as Participant Testimony', async () => {
    await confirmTestimony(m17, ctx(participantAccountId), { itemId, versionId: aiDraftVersionId, confirmed: true });
    const v = await pool.query(
      `SELECT testimony_state, confirmed_by_participant_id FROM life_story.item_versions WHERE id = $1`,
      [aiDraftVersionId],
    );
    expect(v.rows[0].testimony_state).toBe('ParticipantTestimony');
    expect(v.rows[0].confirmed_by_participant_id).toBe(participantId);
    const outbox = await pool.query(
      `SELECT count(*)::int AS n FROM platform_kernel.outbox_messages
        WHERE event_type = 'ParticipantTestimonyConfirmed' AND aggregate_id = $1`,
      [itemId],
    );
    expect(outbox.rows[0].n).toBe(1);
  });

  it('editing creates a NEW version that does not inherit testimony (re-confirmation required)', async () => {
    const { versionId: v2 } = await reviseItem(m17, ctx(participantAccountId), {
      itemId,
      contentText: 'Edited by participant.',
      sourceType: 'ParticipantAuthored',
    });
    const rows = await pool.query(
      `SELECT id, testimony_state FROM life_story.item_versions WHERE item_id = $1 ORDER BY version_number`,
      [itemId],
    );
    expect(rows.rows).toHaveLength(2);
    expect(rows.rows[1].id).toBe(v2);
    expect(rows.rows[1].testimony_state).toBe('NotTestimony');
    expect(rows.rows[0].testimony_state).toBe('ParticipantTestimony');
  });

  it('NEGATIVE version content immutability: stored versions cannot be edited in place', async () => {
    await expect(
      pool.query(`UPDATE life_story.item_versions SET content_text = 'tampered' WHERE id = $1`, [aiDraftVersionId]),
    ).rejects.toThrow(/immutable/);
    await expect(
      pool.query(`UPDATE life_story.item_versions SET testimony_state = 'NotTestimony' WHERE id = $1`, [aiDraftVersionId]),
    ).rejects.toThrow(/silently unconfirmed/);
  });

  it('NEGATIVE Internet Public is feature-disabled: command AND database both refuse', async () => {
    await expect(
      changeVisibility(m17, ctx(participantAccountId), {
        itemId,
        visibility: 'Internet Public',
        confirmed: true,
      }),
    ).rejects.toMatchObject({ code: 'UNSUPPORTED_CAPABILITY' });
    await expect(
      pool.query(`UPDATE life_story.items SET visibility = 'Internet Public' WHERE id = $1`, [itemId]),
    ).rejects.toThrow(/check constraint/i);
  });

  it('visibility change is a confirmed owner action and emits the canonical event', async () => {
    await changeVisibility(m17, ctx(participantAccountId), { itemId, visibility: 'Selected People', confirmed: true });
    const outbox = await pool.query(
      `SELECT payload FROM platform_kernel.outbox_messages
        WHERE event_type = 'LifeStoryItemVisibilityChanged' AND aggregate_id = $1`,
      [itemId],
    );
    expect(outbox.rows[0].payload.visibility).toBe('Selected People');
  });

  it('supporter contribution requires relationship + supporter-contribution consent', async () => {
    // No relationship yet -> denied with hidden existence.
    await expect(
      proposeContribution(m17, ctx(supporterId), { archiveId, contentText: 'I remember the roses.' }),
    ).rejects.toMatchObject({ code: 'RESOURCE_NOT_FOUND' });

    const { relationshipId } = await proposeRelationship(m03, ctx(adminId), {
      participantId,
      relatedActorId: supporterId,
      relationshipType: 'FamilyMember',
      permittedActions: ['life-story.contribute'],
    });
    await approveRelationship(m03, ctx(participantAccountId), { relationshipId, expectedVersion: 1, confirmed: true });

    // Relationship active but consent missing -> still denied.
    await expect(
      proposeContribution(m17, ctx(supporterId), { archiveId, contentText: 'I remember the roses.' }),
    ).rejects.toMatchObject({ code: 'RESOURCE_NOT_FOUND' });

    await recordConsentDecision(m03, ctx(participantAccountId), {
      participantId,
      scope: 'supporter-contribution',
      decision: 'Granted',
      templateVersion: 'ct_v1',
    });
    const { contributionId } = await proposeContribution(m17, ctx(supporterId), {
      archiveId,
      itemId,
      contentText: 'I remember the roses you grew.',
    });

    // Acceptance creates a SupporterContribution version — never testimony,
    // authorship preserved as the contributor.
    const { versionId } = await reviewContribution(m17, ctx(participantAccountId), {
      contributionId,
      itemId,
      decision: 'Accepted',
    });
    const v = await pool.query(
      `SELECT source_type, testimony_state, authored_by_actor_id FROM life_story.item_versions WHERE id = $1`,
      [versionId],
    );
    expect(v.rows[0].source_type).toBe('SupporterContribution');
    expect(v.rows[0].testimony_state).toBe('NotTestimony');
    expect(v.rows[0].authored_by_actor_id).toBe(supporterId);
  });

  /**
   * The supporter workspace used to ask for an archive identifier nobody
   * could learn from inside the product. This answers it under exactly
   * the permission that already allows contributing — so it hands out
   * nothing the caller could not already act on — and refuses everyone
   * else without confirming there is anything there.
   */
  it('a permitted contributor can find where a contribution goes; nobody else can', async () => {
    expect(await findArchiveForContribution(m17, ctx(supporterId), participantId)).toBe(archiveId);

    for (const actor of [coordinatorId, adminId]) {
      await expect(findArchiveForContribution(m17, ctx(actor), participantId)).rejects.toMatchObject({
        code: 'RESOURCE_NOT_FOUND',
      });
    }
  });

  it('NEGATIVE supporter cannot accept their own contribution', async () => {
    const { contributionId } = await proposeContribution(m17, ctx(supporterId), {
      archiveId,
      itemId,
      contentText: 'Another memory.',
    });
    await expect(
      reviewContribution(m17, ctx(supporterId), { contributionId, itemId, decision: 'Accepted' }),
    ).rejects.toMatchObject({ code: 'RESOURCE_NOT_FOUND' });
  });

  /**
   * A supporter writing from their own workspace cannot name a part of
   * the story, because they are not shown it. Requiring an item to
   * REJECT was the defect: such a contribution could be neither accepted
   * nor refused, so it sat in the participant's list permanently.
   */
  it('a contribution with no part named can still be refused, and accepted into a chosen part', async () => {
    const { contributionId: loose } = await proposeContribution(m17, ctx(supporterId), {
      archiveId,
      contentText: 'Something offered without saying where it belongs.',
    });
    await reviewContribution(m17, ctx(participantAccountId), { contributionId: loose, decision: 'Rejected' });
    const refused = await pool.query(
      `SELECT contribution_state FROM life_story.contributions WHERE id = $1`,
      [loose],
    );
    expect(refused.rows[0].contribution_state).toBe('Rejected');

    // Accepting the same shape needs somewhere to put it, chosen by the
    // participant, and the answer is a validation error rather than a
    // silent no-op.
    const { contributionId: second } = await proposeContribution(m17, ctx(supporterId), {
      archiveId,
      contentText: 'Another one with no place named.',
    });
    await expect(
      reviewContribution(m17, ctx(participantAccountId), { contributionId: second, decision: 'Accepted' }),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
    // Into a part of the story the participant picks, which is their
    // decision and not the supporter's.
    const { itemId: chosen } = await createItem(m17, ctx(participantAccountId), {
      archiveId,
      title: 'Where I want this to go',
      contentText: 'A part of my story I wrote myself.',
      sourceType: 'ParticipantAuthored',
    });
    const { versionId } = await reviewContribution(m17, ctx(participantAccountId), {
      contributionId: second,
      itemId: chosen,
      decision: 'Accepted',
    });
    expect(versionId).toBeDefined();
    const v = await pool.query(
      `SELECT source_type, testimony_state FROM life_story.item_versions WHERE id = $1`,
      [versionId],
    );
    expect(v.rows[0].source_type).toBe('SupporterContribution');
    expect(v.rows[0].testimony_state).toBe('NotTestimony');
  });

  /**
   * Ownership now comes from the contribution rather than from an item
   * the caller names, so text offered to one story cannot be steered into
   * another.
   */
  it('NEGATIVE a contribution cannot be accepted into a part of a different story', async () => {
    const otherAccount = (await createUserAccount(m01, createRequestContext({ actor: { type: 'user', id: adminId }, organisationId: orgId }), { displayName: 'Second P.' })).userAccountId;
    await assignRole(m01, createRequestContext({ actor: { type: 'user', id: adminId }, organisationId: orgId }), { userAccountId: otherAccount, role: 'Participant', confirmed: true });
    const { participantId: otherPid } = await registerParticipant(
      m02,
      createRequestContext({ actor: { type: 'user', id: coordinatorId }, organisationId: orgId }),
      { displayName: 'Second P.', userAccountId: otherAccount },
    );
    const { archiveId: otherArchive } = await createArchive(m17, ctx(otherAccount), { participantId: otherPid });
    const { itemId: otherItem } = await createItem(m17, ctx(otherAccount), {
      archiveId: otherArchive,
      title: 'Their own story',
      contentText: 'Written by the other participant.',
      sourceType: 'ParticipantAuthored',
    });

    const { contributionId } = await proposeContribution(m17, ctx(supporterId), {
      archiveId,
      contentText: 'Offered to the first participant only.',
    });
    await expect(
      reviewContribution(m17, ctx(participantAccountId), {
        contributionId,
        itemId: otherItem,
        decision: 'Accepted',
      }),
    ).rejects.toMatchObject({ code: 'RESOURCE_NOT_FOUND' });
  });

  /**
   * Being the only person permitted to decide is worth nothing without a
   * way to find what is waiting. This pins down both halves: the
   * participant sees the contribution left Proposed by the test above, and
   * the same owner-only permission that stops a supporter accepting their
   * own contribution also stops anyone reading the queue.
   */
  it('the participant lists contributions awaiting their review; nobody else can', async () => {
    const waiting = await listContributionsAwaitingReview(m17, ctx(participantAccountId), participantId);
    expect(waiting.map((c) => c.contentText)).toContain('Another memory.');
    // Already accepted, so no longer waiting on anyone.
    expect(waiting.map((c) => c.contentText)).not.toContain('I remember the roses you grew.');

    // The supporter who wrote it, and staff, are refused — and the refusal
    // does not reveal that anything is there to be refused about.
    for (const actor of [supporterId, coordinatorId]) {
      await expect(listContributionsAwaitingReview(m17, ctx(actor), participantId)).rejects.toMatchObject({
        code: 'RESOURCE_NOT_FOUND',
      });
    }

    // And a participant cannot read another participant's queue by asking
    // for it — the owner check is on the resource, not on the caller alone.
    const { participantId: otherParticipantId } = await registerParticipant(
      m02,
      createRequestContext({ actor: { type: 'user', id: coordinatorId }, organisationId: orgId }),
      { displayName: 'Other P.' },
    );
    await expect(
      listContributionsAwaitingReview(m17, ctx(participantAccountId), otherParticipantId),
    ).rejects.toMatchObject({ code: 'RESOURCE_NOT_FOUND' });
  });

  /**
   * There was no read path at all before this. The story could be written
   * to, confirmed, reshaped and contributed to, and nobody could look at
   * it — including the person whose story it is.
   */
  it('the participant reads their own story, with provenance intact; nobody else can read it', async () => {
    const story = await getMyLifeStory(m17, ctx(participantAccountId), participantId);
    expect(story.archiveId).toBe(archiveId);
    const item = story.items.find((i) => i.itemId === itemId);
    // The current version is the accepted supporter contribution, which is
    // not testimony — and the earlier confirmation is not silently carried
    // onto it, but is not hidden either.
    expect(item?.sourceType).toBe('SupporterContribution');
    expect(item?.testimonyState).toBe('NotTestimony');
    expect(item?.supersedesConfirmedVersion).toBe(true);
    expect(item?.versionCount).toBe(3);
    expect(item?.visibility).toBe('Selected People');

    for (const actor of [supporterId, coordinatorId, adminId]) {
      await expect(getMyLifeStory(m17, ctx(actor), participantId)).rejects.toMatchObject({
        code: 'RESOURCE_NOT_FOUND',
      });
    }
  });

  it('withdrawal resets visibility to Private, revokes grants, emits event; history preserved', async () => {
    /*
     * A unique id per run. This was the literal 'ag_1', which made the
     * test pass exactly once against any given database and then fail on
     * a duplicate primary key — so the suite was green only because
     * something reset the database between runs, and running this file
     * twice reported a defect that was not there.
     */
    await pool.query(
      `INSERT INTO life_story.access_grants (id, item_id, grantee_actor_id) VALUES ($3, $1, $2)`,
      [itemId, supporterId, `ag_${String(Date.now())}`],
    );
    await withdrawItem(m17, ctx(participantAccountId), { itemId, confirmed: true });

    const item = await pool.query(`SELECT item_state, visibility, withdrawn_at FROM life_story.items WHERE id = $1`, [itemId]);
    expect(item.rows[0].item_state).toBe('Withdrawn');
    expect(item.rows[0].visibility).toBe('Private');
    expect(item.rows[0].withdrawn_at).not.toBeNull();

    const grants = await pool.query(`SELECT revoked_at FROM life_story.access_grants WHERE item_id = $1`, [itemId]);
    expect(grants.rows.every((g) => g.revoked_at !== null)).toBe(true);

    const versions = await pool.query(`SELECT count(*)::int AS n FROM life_story.item_versions WHERE item_id = $1`, [itemId]);
    expect(versions.rows[0].n).toBe(3);

    await expect(
      reviseItem(m17, ctx(participantAccountId), { itemId, contentText: 'x', sourceType: 'ParticipantAuthored' }),
    ).rejects.toMatchObject({ code: 'RESOURCE_STATE_BLOCKED' });
  });

  /**
   * Withdrawal takes an item away from everyone else. It must not take it
   * away from the person who wrote it — that would be the platform
   * deciding they may not remember their own past.
   */
  it('a withdrawn item is still readable by its owner, and says it was withdrawn', async () => {
    const story = await getMyLifeStory(m17, ctx(participantAccountId), participantId);
    const item = story.items.find((i) => i.itemId === itemId);
    expect(item?.itemState).toBe('Withdrawn');
    expect(item?.visibility).toBe('Private');
    expect(item?.contentText).not.toBeNull();
  });

  /**
   * The community feed — "Other people's stories".
   *
   * The Community and Connections scopes reached nobody: a participant
   * could mark a memory for their community and there was no feed to
   * carry it (B-30 left this open after the supporter path was built).
   *
   * Written mostly from the refusing side. A feed is the place where a
   * mistake is worst: it does not leak one memory to one person, it puts
   * somebody's life in front of everybody who opens a tab.
   */
  describe('the feed of stories shared with me', () => {
    let feedParticipant: string, feedAccount: string;
    let mineShared: string, minePrivate: string;

    const feed = (viewer: string, viewerParticipantId: string | null) =>
      listStoriesSharedWithMe({ ...m17, participantNames: names }, ctx(viewer), {
        viewerActorId: viewer,
        viewerParticipantId,
      });

    const shareable = async (title: string, visibility: string) => {
      const { itemId: id, versionId } = await createItem(m17, ctx(participantAccountId), {
        archiveId, title, contentText: `The words of ${title}.`, sourceType: 'ParticipantAuthored',
      });
      await confirmTestimony(m17, ctx(participantAccountId), { itemId: id, versionId, confirmed: true });
      if (visibility !== 'Private') {
        await changeVisibility(m17, ctx(participantAccountId), { itemId: id, visibility: visibility as never, confirmed: true });
      }
      return id;
    };

    beforeAll(async () => {
      const adminCtx = createRequestContext({ actor: { type: 'user', id: adminId }, organisationId: orgId });
      ({ userAccountId: feedAccount } = await createUserAccount(m01, adminCtx, { displayName: 'Fern' }));
      await assignRole(m01, adminCtx, { userAccountId: feedAccount, role: 'Participant', confirmed: true });
      ({ participantId: feedParticipant } = await registerParticipant(
        m02,
        createRequestContext({ actor: { type: 'user', id: coordinatorId }, organisationId: orgId }),
        { displayName: 'Fern F.', userAccountId: feedAccount },
      ));
      mineShared = await shareable('For the whole community', 'Community');
      minePrivate = await shareable('For nobody at all', 'Private');
    }, 30_000);

    /**
     * A stranger sees nothing. No connection, no community, no
     * relationship — and the memory is marked Community, which means a
     * community they are not in.
     */
    it('shows nothing to somebody who shares no community', async () => {
      const seen = await feed(feedAccount, feedParticipant);
      expect(seen.map((p) => p.itemId), 'a community memory reached somebody outside it').not.toContain(mineShared);
    });

    /**
     * And the one that would be worst. A private memory must never be in
     * a feed — not for a stranger, and not for its own author, whose
     * screen is headed with other people's stories.
     */
    it('never puts a private memory in the feed, including the author’s own', async () => {
      for (const [viewer, pid] of [[feedAccount, feedParticipant], [participantAccountId, participantId]] as const) {
        const seen = await feed(viewer, pid);
        expect(seen.map((p) => p.itemId), 'a private memory was in the feed').not.toContain(minePrivate);
      }
    });

    /**
     * Their own shared piece IS there, and marked. The drawing promises
     * "nothing of yours appears here unless you choose a piece and share
     * it", which is only true if a piece they did share appears — and it
     * is the only way somebody can check that sharing did what they
     * meant.
     */
    it('shows the author their own shared piece, marked as theirs', async () => {
      const seen = await feed(participantAccountId, participantId);
      const own = seen.find((p) => p.itemId === mineShared);
      expect(own, 'their own shared piece was missing from the feed').toBeDefined();
      expect(own?.mine).toBe(true);
      expect(own?.ownerDisplayName).toBe('Pat P.');
    });

    /**
     * Standing is not a ladder, tested from the side that can catch it.
     *
     * A mutation that let ANY reach match ANY scope went green, because
     * the only viewer being asked was a community member with no
     * supporter relationship — an empty set matches nothing either way.
     * The supporter holds a real relationship, so a Community memory
     * reaching them is the collapse this is for.
     */
    it('does not give a supporter what was shared with a community', async () => {
      const seen = await feed(supporterId, null);
      expect(
        seen.map((p) => p.itemId),
        'a supporter was given a memory shared with a community',
      ).not.toContain(mineShared);

      // And the scope that does name them reaches them.
      const forFamily = await shareable('For my family only', 'My Supporters');
      const after = await feed(supporterId, null);
      expect(after.map((p) => p.itemId), 'the supporter scope did not carry the memory').toContain(forFamily);
    }, 30_000);

    /**
     * Only Active memories. A draft is something somebody has not
     * finished saying, and a withdrawn one is something they took back —
     * a feed carrying either would publish a decision they did not make.
     *
     * A mutation removing the state filter went green, because every
     * fixture here was Active. This makes one of each.
     */
    it('carries no draft and nothing withdrawn, whatever scope they were given', async () => {
      const draft = await createItem(m17, ctx(participantAccountId), {
        archiveId, title: 'Half a thought', contentText: 'Not finished.', sourceType: 'ParticipantAuthored',
      });
      await changeVisibility(m17, ctx(participantAccountId), {
        itemId: draft.itemId, visibility: 'Community' as never, confirmed: true,
      });

      const taken = await shareable('Shared and then taken back', 'Community');
      await withdrawItem(m17, ctx(participantAccountId), { itemId: taken, confirmed: true });

      const seen = (await feed(participantAccountId, participantId)).map((p) => p.itemId);
      expect(seen, 'an unfinished draft was published to the feed').not.toContain(draft.itemId);
      expect(seen, 'a withdrawn memory was still in the feed').not.toContain(taken);
    }, 30_000);

    /**
     * Sharing a community opens it, and only for the scope that names
     * the community. Standing is not a ladder here either.
     */
    it('shows a community memory to somebody in that community, and not other scopes', async () => {
      const space = await pool.query(
        `SELECT id, (SELECT id FROM community_social.community_rule_versions WHERE space_id = s.id LIMIT 1) AS rule
           FROM community_social.community_spaces s LIMIT 1`,
      );
      if (space.rowCount === 0) return; // no space fixture in this suite
      for (const pid of [participantId, feedParticipant]) {
        await pool.query(
          `INSERT INTO community_social.community_memberships (id, space_id, participant_id, rule_version_id, membership_state)
           VALUES ($1, $2, $3, $4, 'Active') ON CONFLICT DO NOTHING`,
          [`cm_${pid}`, space.rows[0].id, pid, space.rows[0].rule],
        );
      }
      const seen = await feed(feedAccount, feedParticipant);
      expect(seen.map((p) => p.itemId), 'sharing a community did not carry the memory').toContain(mineShared);

      const supportersOnly = await shareable('For family only', 'My Supporters');
      const after = await feed(feedAccount, feedParticipant);
      expect(
        after.map((p) => p.itemId),
        'a community member was given what was shared with supporters',
      ).not.toContain(supportersOnly);
    }, 30_000);
  });

  /**
   * Reading somebody else's story — the path that did not exist.
   *
   * `life-story.view-own` is `ownerOnly` and was the only way in, so every
   * visibility a participant chose was recorded, audited and read by
   * nothing (B-30). These are written mostly from the refusing side: a
   * wrong "no" here is a disappointment, and a wrong "yes" hands somebody's
   * memories to a person they did not choose.
   */
  describe('what a supporter can read', () => {
    let forSupporters: string, forCommunity: string, stillPrivate: string, notConfirmed: string;

    const shareable = async (title: string, visibility: string) => {
      const { itemId: id, versionId } = await createItem(m17, ctx(participantAccountId), {
        archiveId,
        title,
        contentText: `The words of ${title}.`,
        sourceType: 'ParticipantAuthored',
      });
      // Confirming is what makes an item Active, and only an Active item
      // is ever shared — a memory its author has not confirmed as their
      // own words stays a draft and reaches nobody.
      await confirmTestimony(m17, ctx(participantAccountId), { itemId: id, versionId, confirmed: true });
      if (visibility !== 'Private') {
        await changeVisibility(m17, ctx(participantAccountId), { itemId: id, visibility: visibility as never, confirmed: true });
      }
      return id;
    };

    const read = (viewer: string, viewerParticipantId: string | null = null) =>
      getSharedLifeStory(m17, ctx(viewer), {
        ownerParticipantId: participantId,
        viewerActorId: viewer,
        viewerParticipantId,
      });

    beforeAll(async () => {
      forSupporters = await shareable('For my family', 'My Supporters');
      forCommunity = await shareable('For the community', 'Community');
      stillPrivate = await shareable('Just for me', 'Private');
      const draft = await createItem(m17, ctx(participantAccountId), {
        archiveId, title: 'Not finished', contentText: 'Half a thought.', sourceType: 'ParticipantAuthored',
      });
      notConfirmed = draft.itemId;
      await changeVisibility(m17, ctx(participantAccountId), {
        itemId: notConfirmed, visibility: 'My Supporters' as never, confirmed: true,
      });
    }, 30_000);

    it('gives a supporter the memories shared with supporters', async () => {
      const story = await read(supporterId);
      expect(story.items.map((i) => i.itemId)).toContain(forSupporters);
      expect(story.items.find((i) => i.itemId === forSupporters)?.contentText).toBe('The words of For my family.');
    });

    /** The one that must never move. */
    it('never gives a supporter a private memory', async () => {
      const story = await read(supporterId);
      expect(story.items.map((i) => i.itemId), 'a private memory reached a supporter').not.toContain(stillPrivate);
    });

    /**
     * Standing is not a ladder. A supporter is "closer" than the
     * community in an everyday sense, and the participant did not say
     * that — they said who this memory is for.
     */
    it('does not give a supporter what was shared with the community', async () => {
      const story = await read(supporterId);
      expect(story.items.map((i) => i.itemId), 'a supporter read a community memory').not.toContain(forCommunity);
    });

    /**
     * A memory whose author has not confirmed it as their own words is a
     * draft, whatever scope it carries. Sharing it would put words in
     * somebody's mouth that they have not stood behind.
     */
    it('shares nothing the participant has not confirmed, whatever it is marked', async () => {
      const story = await read(supporterId);
      expect(story.items.map((i) => i.itemId), 'an unconfirmed draft was shared').not.toContain(notConfirmed);
    });

    /**
     * A life story is not staff-readable, and it did not become so by
     * becoming shareable with a daughter. The coordinator holds no
     * `life-story.view-shared` at all, so they are refused before any
     * standing is computed — and told the archive is not there rather
     * than that they may not have it, because its existence is protected.
     */
    it('refuses a research coordinator outright, without confirming the story exists', async () => {
      await expect(read(coordinatorId)).rejects.toMatchObject({ code: 'RESOURCE_NOT_FOUND' });
    });

    /**
     * The claim this whole design rests on: the permission grants the
     * ATTEMPT and never the content.
     *
     * Another participant holds `life-story.view-shared` through the
     * Participant role, exactly as the supporter does. They reach the
     * query, and they are no relation — so what comes back is nothing.
     * If standing were ever skipped, or the role treated as sufficient,
     * this is the test that fails.
     */
    it('lets an unrelated participant reach the query and gives them nothing', async () => {
      const { userAccountId: strangerAccount } = await createUserAccount(
        m01,
        createRequestContext({ actor: { type: 'user', id: adminId }, organisationId: orgId }),
        { displayName: 'Stranger' },
      );
      await assignRole(
        m01,
        createRequestContext({ actor: { type: 'user', id: adminId }, organisationId: orgId }),
        { userAccountId: strangerAccount, role: 'Participant', confirmed: true },
      );
      const { participantId: strangerParticipant } = await registerParticipant(
        m02,
        createRequestContext({ actor: { type: 'user', id: coordinatorId }, organisationId: orgId }),
        { displayName: 'Sandy S.', userAccountId: strangerAccount },
      );

      const story = await read(strangerAccount, strangerParticipant);
      expect(story.items, 'an unrelated participant read somebody else’s life story').toEqual([]);
    }, 30_000);

    /**
     * Withdrawal takes a memory back from everybody. The screen promises
     * its owner that a withdrawn entry is "private now, and still here
     * for you to read", and that is only true if it actually leaves the
     * people who could reach it.
     */
    it('takes a withdrawn memory back from a supporter', async () => {
      expect((await read(supporterId)).items.map((i) => i.itemId)).toContain(forSupporters);
      await withdrawItem(m17, ctx(participantAccountId), { itemId: forSupporters, confirmed: true });
      expect(
        (await read(supporterId)).items.map((i) => i.itemId),
        'a withdrawn memory was still readable by a supporter',
      ).not.toContain(forSupporters);
      // And its owner still has it.
      const mine = await getMyLifeStory(m17, ctx(participantAccountId), participantId);
      expect(mine.items.find((i) => i.itemId === forSupporters)?.contentText).not.toBeNull();
    });

    /**
     * Only an approved relationship, and this was not tested until a
     * mutation showed it: loosening the query to "any state but
     * Rejected" left every test green.
     *
     * The table holds Proposed, PendingVerification, Restricted,
     * Suspended, Expired, Revoked and Rejected as well as Active, and not
     * one of them is somebody the participant has said may read their
     * life. A proposal nobody accepted is the worst of them — it would
     * mean anyone who can propose a relationship can read a life story by
     * proposing one.
     */
    it('grants nothing on a relationship the participant has not approved', async () => {
      const item = await shareable('For approved family only', 'My Supporters');
      const setState = (state: string) =>
        pool.query(
          `UPDATE consent_permission.relationships SET relationship_state = $2
            WHERE participant_id = $1 AND related_actor_id = $3`,
          [participantId, state, supporterId],
        );

      for (const state of [
        'Proposed', 'PendingVerification', 'Restricted', 'Suspended', 'Expired', 'Revoked', 'Rejected',
      ]) {
        await setState(state);
        const story = await read(supporterId);
        expect(
          story.items.map((i) => i.itemId),
          `a ${state} relationship let a supporter read a life story`,
        ).not.toContain(item);
      }

      await setState('Active');
      expect((await read(supporterId)).items.map((i) => i.itemId)).toContain(item);
    }, 30_000);

    /**
     * A row that says both things at once.
     *
     * `revoked_at IS NULL` sits alongside the state check as
     * defence-in-depth, and a mutation showed nothing exercised it: the
     * revoke command sets the state as well, so the state check alone
     * kept every test green. The case it exists for is a row that is
     * revoked and still reads Active — from a partial write, a repair by
     * hand, or a future path that sets one and forgets the other. When a
     * record disagrees with itself about whether somebody may read a life
     * story, the answer is no.
     */
    it('refuses a relationship marked revoked even if its state still says Active', async () => {
      const item = await shareable('For family, until revoked', 'My Supporters');
      await pool.query(
        `UPDATE consent_permission.relationships SET revoked_at = $2, relationship_state = 'Active'
          WHERE participant_id = $1 AND related_actor_id = $3`,
        [participantId, '2026-07-15T00:00:00Z', supporterId],
      );
      expect(
        (await read(supporterId)).items.map((i) => i.itemId),
        'a revoked relationship read a life story because its state still said Active',
      ).not.toContain(item);

      await pool.query(
        `UPDATE consent_permission.relationships SET revoked_at = NULL
          WHERE participant_id = $1 AND related_actor_id = $2`,
        [participantId, supporterId],
      );
      expect((await read(supporterId)).items.map((i) => i.itemId)).toContain(item);
    }, 30_000);

    /**
     * And an expired relationship stops granting the moment it expires,
     * without waiting for anything to notice.
     *
     * `relationship_state` is moved to Expired by a scheduled sweep, and
     * the deployment runs neither the scheduler nor the worker (B-29) —
     * so in the deployed environment an expired relationship reads
     * 'Active' for ever. Even with the sweep running there is a window
     * between expiry and the next pass, and reading somebody's life story
     * is not a thing to do in that window.
     */
    it('stops granting the moment a relationship expires, without waiting for a sweep', async () => {
      const item = await shareable('For family, for now', 'My Supporters');
      const setExpiry = (at: string | null) =>
        pool.query(
          `UPDATE consent_permission.relationships SET expires_at = $2
            WHERE participant_id = $1 AND related_actor_id = $3`,
          [participantId, at, supporterId],
        );

      // Still 'Active' in the column, and already past.
      await setExpiry('2026-07-01T00:00:00Z');
      const rows = await pool.query(
        `SELECT relationship_state FROM consent_permission.relationships
          WHERE participant_id = $1 AND related_actor_id = $2`,
        [participantId, supporterId],
      );
      expect(rows.rows[0].relationship_state, 'the fixture stopped testing what it was for').toBe('Active');

      expect(
        (await read(supporterId)).items.map((i) => i.itemId),
        'an expired relationship still read a life story',
      ).not.toContain(item);

      await setExpiry(null);
      expect((await read(supporterId)).items.map((i) => i.itemId)).toContain(item);
    }, 30_000);

    /**
     * What a reader is not told. Which scope a memory carries is the
     * author's business — that a daughter can read it does not entitle
     * her to know whether her mother also shared it with the community —
     * and neither is how many times it was rewritten.
     */
    it('does not hand the reader the author’s own working', async () => {
      // Its own memory: the test above withdraws the shared one, and a
      // shape assertion over an empty list asserts nothing.
      await shareable('Something to look at', 'My Supporters');
      const story = await read(supporterId);
      const any = story.items[0];
      expect(any, 'no memory came back to check the shape of').toBeDefined();
      expect(Object.keys(any!).sort()).toEqual(
        ['contentText', 'itemId', 'sourceType', 'testimonyState', 'title', 'updatedAt'].sort(),
      );
    });
  });
});

describe.skipIf(dbAvailable)('M17 integration (skipped)', () => {
  it('skipped because no PostgreSQL is reachable', () => {
    expect(dbAvailable).toBe(false);
  });
});
