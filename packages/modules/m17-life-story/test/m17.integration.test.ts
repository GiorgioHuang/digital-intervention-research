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

  it('withdrawal resets visibility to Private, revokes grants, emits event; history preserved', async () => {
    await pool.query(
      `INSERT INTO life_story.access_grants (id, item_id, grantee_actor_id) VALUES ('ag_1', $1, $2)`,
      [itemId, supporterId],
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
});

describe.skipIf(dbAvailable)('M17 integration (skipped)', () => {
  it('skipped because no PostgreSQL is reachable', () => {
    expect(dbAvailable).toBe(false);
  });
});
