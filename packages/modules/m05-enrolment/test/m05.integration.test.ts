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
import { listOwnEnrolments } from '../src/application/queries.js';
import {
  createParticipantQuery,
  listParticipantsForOrganisation,
  registerParticipant,
  type M02Deps,
} from '@platform/m02-participant';
import { createPermissionService, recordConsentDecision, type M03Deps } from '@platform/m03-consent-permission';
import {
  activateProtocolVersion,
  approveProtocolVersion,
  rejectProtocolVersion,
  createProtocolVersion,
  createProtocolVersionQuery,
  createResearchProject,
  createResearchQuestion,
  listResearchProjects,
  submitProtocolVersion,
  type M04Deps,
} from '@platform/m04-research-design';
import {
  activateEnrolment,
  enrolParticipant,
  inviteParticipant,
  recordEligibilityDecision,
  startConsentProcess,
  startScreening,
  withdrawParticipant,
  type M05Deps,
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

describe.skipIf(!dbAvailable)('P3 research core: project -> protocol -> enrolment (integration)', () => {
  let pool: pg.Pool;
  const clock = new FixedClock('2026-07-30T12:00:00Z');
  let m01: M01Deps, m02: M02Deps, m03: M03Deps, m04: M04Deps, m05: M05Deps;
  let adminId: string, orgAdminId: string, orgId: string, researcherId: string, approverId: string, coordinatorId: string;
  let participantAccountId: string, participantId: string;
  let projectId: string, versionId: string;

  const ctx = (actorId: string, extras: Record<string, unknown> = {}) =>
    createRequestContext({ actor: { type: 'user', id: actorId }, ...extras });

  beforeAll(async () => {
    await migrate({ databaseUrl: DATABASE_URL, direction: 'up' });
    pool = createPool({ connectionString: DATABASE_URL, applicationName: 'm05-tests' });

    const participants = createParticipantQuery(pool);
    const permissions = createPermissionService({
      pool,
      clock,
      policy: POLICY_V1,
      roleAssignments: createRoleAssignmentQuery(pool),
      participantIdentity: participants,
    });
    const checkPermission = (c: Parameters<typeof permissions.evaluate>[0], r: Parameters<typeof permissions.evaluate>[1]) =>
      permissions.evaluate(c, r);
    m01 = { pool, clock, checkPermission };
    m02 = { pool, clock, checkPermission };
    m03 = { pool, clock, permissions };
    m04 = { pool, clock, checkPermission };
    m05 = {
      pool,
      clock,
      permissions,
      participants,
      protocolVersions: createProtocolVersionQuery(pool),
    };

    ({ userAccountId: adminId } = await seedBootstrapAdministrator(pool, clock, { displayName: 'Admin' }));
    ({ organisationId: orgId } = await createOrganisation(m01, ctx(adminId), { name: 'P3 Org' }));
    const adminCtx = ctx(adminId, { organisationId: orgId });

    ({ userAccountId: orgAdminId } = await createUserAccount(m01, adminCtx, { displayName: 'Org Admin' }));
    ({ userAccountId: researcherId } = await createUserAccount(m01, adminCtx, { displayName: 'Researcher' }));
    ({ userAccountId: approverId } = await createUserAccount(m01, adminCtx, { displayName: 'Approver' }));
    ({ userAccountId: coordinatorId } = await createUserAccount(m01, adminCtx, { displayName: 'Coordinator' }));
    ({ userAccountId: participantAccountId } = await createUserAccount(m01, adminCtx, {
      displayName: 'Pat',
      organisationId: orgId,
    }));

    await assignRole(m01, adminCtx, {
      userAccountId: orgAdminId,
      role: 'OrganisationAdministrator',
      organisationId: orgId,
      confirmed: true,
    });
    await assignRole(m01, adminCtx, { userAccountId: researcherId, role: 'Researcher', organisationId: orgId, confirmed: true });
    await assignRole(m01, adminCtx, { userAccountId: approverId, role: 'ResearchApprover', organisationId: orgId, confirmed: true });
    await assignRole(m01, adminCtx, { userAccountId: coordinatorId, role: 'ResearchCoordinator', organisationId: orgId, confirmed: true });
    await assignRole(m01, adminCtx, { userAccountId: participantAccountId, role: 'Participant', confirmed: true });

    ({ participantId } = await registerParticipant(m02, ctx(coordinatorId, { organisationId: orgId }), {
      displayName: 'Pat P.',
      userAccountId: participantAccountId,
    }));
  }, 30_000);

  afterAll(async () => {
    await pool?.end();
  });

  it('researcher creates project and drafts a protocol version', async () => {
    ({ researchProjectId: projectId } = await createResearchProject(m04, ctx(researcherId, { organisationId: orgId }), {
      organisationId: orgId,
      title: 'Pilot Feasibility Study',
    }));
    const draft = await createProtocolVersion(m04, ctx(researcherId, { organisationId: orgId, researchProjectId: projectId }), {
      researchProjectId: projectId,
      title: 'Pilot Protocol',
      content: { design: 'single-arm mixed-method', durationWeeks: 4 },
    });
    versionId = draft.protocolVersionId;
    expect(draft.versionNumber).toBe(1);
  });

  it('NEGATIVE self-approval: submitter cannot approve their own protocol version (ADR-051)', async () => {
    await submitProtocolVersion(m04, ctx(researcherId, { organisationId: orgId, researchProjectId: projectId }), versionId);
    // Give the researcher an approver role to prove the block is separation
    // of duties, not a missing role.
    await assignRole(m01, ctx(adminId, { organisationId: orgId }), {
      userAccountId: researcherId,
      role: 'ResearchApprover',
      organisationId: orgId,
      confirmed: true,
    });
    await expect(
      approveProtocolVersion(
        m04,
        createRequestContext({
          actor: { type: 'user', id: researcherId },
          organisationId: orgId,
          researchProjectId: projectId,
          authStrength: 'mfa',
        }),
        versionId,
        true,
      ),
    ).rejects.toMatchObject({ code: 'AUTHORISATION_DENIED' });
  });

  /**
   * 'Rejected' has been in the version_state CHECK from the start and no
   * code path could write it, so the protocol approval screen offered one
   * outcome and called it a decision.
   */
  it('a protocol version can be refused, with a reason, and cannot then be approved', async () => {
    const approverCtx = createRequestContext({
      actor: { type: 'user', id: approverId },
      organisationId: orgId,
      researchProjectId: projectId,
      authStrength: 'mfa',
    });
    const { protocolVersionId: refusable } = await createProtocolVersion(
      m04,
      ctx(researcherId, { organisationId: orgId, researchProjectId: projectId }),
      { researchProjectId: projectId, title: 'A version that should not pass', content: { summary: 'Not this one' } },
    );
    await submitProtocolVersion(m04, ctx(researcherId, { organisationId: orgId, researchProjectId: projectId }), refusable);

    await expect(
      rejectProtocolVersion(m04, approverCtx, refusable, { reason: '   ', confirmed: true }),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });

    await rejectProtocolVersion(m04, approverCtx, refusable, {
      reason: 'The consent wording does not match the scopes the platform enforces.',
      confirmed: true,
    });
    const row = await pool.query(
      `SELECT version_state, refused_by_actor_id, refused_reason FROM research_design.protocol_versions WHERE id = $1`,
      [refusable],
    );
    expect(row.rows[0].version_state).toBe('Rejected');
    expect(row.rows[0].refused_by_actor_id).toBe(approverId);
    expect(row.rows[0].refused_reason).toContain('does not match the scopes');

    await expect(approveProtocolVersion(m04, approverCtx, refusable, true)).rejects.toMatchObject({
      code: 'INVALID_STATE_TRANSITION',
    });
  });

  it('approver (mfa) approves and activates; approved content becomes immutable at the DB layer', async () => {
    const approverCtx = createRequestContext({
      actor: { type: 'user', id: approverId },
      organisationId: orgId,
      researchProjectId: projectId,
      authStrength: 'mfa',
    });
    await approveProtocolVersion(m04, approverCtx, versionId, true);
    await activateProtocolVersion(m04, approverCtx, versionId, true);

    await expect(
      pool.query(
        `UPDATE research_design.protocol_versions SET content = '{"tampered":true}'::jsonb, content_hash = 'x' WHERE id = $1`,
        [versionId],
      ),
    ).rejects.toThrow(/immutable/);
  });

  it('NEGATIVE step-up: approval without MFA session is refused', async () => {
    const v2 = await createProtocolVersion(m04, ctx(researcherId, { organisationId: orgId, researchProjectId: projectId }), {
      researchProjectId: projectId,
      content: { design: 'amended' },
    });
    await submitProtocolVersion(m04, ctx(researcherId, { organisationId: orgId, researchProjectId: projectId }), v2.protocolVersionId);
    await expect(
      approveProtocolVersion(
        m04,
        createRequestContext({
          actor: { type: 'user', id: approverId },
          organisationId: orgId,
          researchProjectId: projectId,
          authStrength: 'password',
        }),
        v2.protocolVersionId,
        true,
      ),
    ).rejects.toMatchObject({ code: 'STEP_UP_AUTHENTICATION_REQUIRED' });
  });

  it('NEGATIVE draft protocol: enrolment cannot bind to a non-approved version', async () => {
    const draft = await createProtocolVersion(m04, ctx(researcherId, { organisationId: orgId, researchProjectId: projectId }), {
      researchProjectId: projectId,
      content: { design: 'draft-only' },
    });
    await expect(
      inviteParticipant(m05, ctx(coordinatorId, { organisationId: orgId, researchProjectId: projectId }), {
        participantId,
        researchProjectId: projectId,
        protocolVersionId: draft.protocolVersionId,
      }),
    ).rejects.toMatchObject({ code: 'RESOURCE_STATE_BLOCKED' });
  });

  let enrolmentId: string;

  it('invitation -> screening -> human eligibility decision', async () => {
    const coordCtx = ctx(coordinatorId, { organisationId: orgId, researchProjectId: projectId });
    ({ enrolmentId } = await inviteParticipant(m05, coordCtx, {
      participantId,
      researchProjectId: projectId,
      protocolVersionId: versionId,
    }));
    await startScreening(m05, coordCtx, enrolmentId);
    await recordEligibilityDecision(m05, coordCtx, {
      enrolmentId,
      decision: 'Eligible',
      reason: 'meets all criteria',
      confirmed: true,
    });
    const row = await pool.query(`SELECT enrolment_state FROM enrolment.enrolments WHERE id = $1`, [enrolmentId]);
    expect(row.rows[0].enrolment_state).toBe('Eligible');
  });

  it('NEGATIVE service-account eligibility: automation cannot decide eligibility', async () => {
    const coordCtx = ctx(coordinatorId, { organisationId: orgId, researchProjectId: projectId });
    const { enrolmentId: other } = await inviteParticipant(m05, coordCtx, {
      participantId: (await registerParticipant(m02, coordCtx, { displayName: 'Second P.' })).participantId,
      researchProjectId: projectId,
      protocolVersionId: versionId,
    });
    await startScreening(m05, coordCtx, other);
    await expect(
      recordEligibilityDecision(
        m05,
        createRequestContext({ actor: { type: 'service-account', id: 'sa_bot' }, organisationId: orgId }),
        { enrolmentId: other, decision: 'Eligible', reason: 'auto', confirmed: true },
      ),
    ).rejects.toMatchObject({ code: 'AUTHORISATION_DENIED' });
  });

  it('NEGATIVE consent gate: enrolment without study-participation consent is refused', async () => {
    const coordCtx = ctx(coordinatorId, { organisationId: orgId, researchProjectId: projectId });
    await startConsentProcess(m05, coordCtx, enrolmentId);
    await expect(enrolParticipant(m05, coordCtx, enrolmentId)).rejects.toMatchObject({
      code: 'AUTHORISATION_DENIED',
    });
  });

  it('participant grants consent via their own account (identity mapping), then enrolment succeeds and activates', async () => {
    // The participant acts through their user account; ownerOnly resolves
    // through the account->participant mapping.
    await recordConsentDecision(m03, ctx(participantAccountId), {
      participantId,
      scope: 'study-participation',
      decision: 'Granted',
      templateVersion: 'ct_v1',
    });
    const coordCtx = ctx(coordinatorId, { organisationId: orgId, researchProjectId: projectId });
    await enrolParticipant(m05, coordCtx, enrolmentId);
    await activateEnrolment(m05, coordCtx, enrolmentId);
    const row = await pool.query(`SELECT enrolment_state FROM enrolment.enrolments WHERE id = $1`, [enrolmentId]);
    expect(row.rows[0].enrolment_state).toBe('Active');
  });

  it('NEGATIVE duplicate enrolment: second live enrolment for the same participant+project is rejected', async () => {
    await expect(
      inviteParticipant(m05, ctx(coordinatorId, { organisationId: orgId, researchProjectId: projectId }), {
        participantId,
        researchProjectId: projectId,
        protocolVersionId: versionId,
      }),
    ).rejects.toThrow(/duplicate key/i);
  });

  it('participant withdraws via their own account; ParticipantWithdrawn committed atomically', async () => {
    await withdrawParticipant(m05, ctx(participantAccountId), {
      enrolmentId,
      reasonCategory: 'personal',
      confirmed: true,
    });
    const row = await pool.query(`SELECT enrolment_state, withdrawn_at FROM enrolment.enrolments WHERE id = $1`, [enrolmentId]);
    expect(row.rows[0].enrolment_state).toBe('Withdrawn');
    expect(row.rows[0].withdrawn_at).not.toBeNull();
    const outbox = await pool.query(
      `SELECT count(*)::int AS n FROM platform_kernel.outbox_messages
        WHERE event_type = 'ParticipantWithdrawn' AND aggregate_id = $1`,
      [enrolmentId],
    );
    expect(outbox.rows[0].n).toBe(1);
  });

  it('exact protocol version reference is preserved on the enrolment (no silent migration)', async () => {
    const row = await pool.query(`SELECT protocol_version_id FROM enrolment.enrolments WHERE id = $1`, [enrolmentId]);
    expect(row.rows[0].protocol_version_id).toBe(versionId);
  });

  /**
   * The right to withdraw was owner-permitted from the start, but the
   * participant could not reach their own enrolment to exercise it. This
   * pins down that they can read it and that nobody else's is visible.
   */
  it('a participant reads their own enrolment, and cannot read anyone else\'s', async () => {
    const own = ctx(participantAccountId);
    const mine = await listOwnEnrolments(m05, own, participantId);
    expect(mine.some((e) => e.enrolmentId === enrolmentId)).toBe(true);
    expect(mine.every((e) => e.participantId === participantId)).toBe(true);

    // Another participant's enrolment is not readable, and the refusal
    // does not distinguish "no such participant" from "not yours".
    const otherParticipant = (
      await registerParticipant(m02, ctx(coordinatorId, { organisationId: orgId }), { displayName: 'Second P.' })
    ).participantId;
    await expect(listOwnEnrolments(m05, own, otherParticipant)).rejects.toMatchObject({
      code: 'RESOURCE_NOT_FOUND',
    });
  });

  /**
   * Decision D-13. The listing is scoped by the query as well as by the
   * permission, because either alone is a hole: a permission without a
   * scoped query lets a correctly-roled administrator read another
   * organisation, and a scoped query without a permission lets anyone read
   * their own.
   */
  it('an administrator lists only their own organisation, and only administrative fields', async () => {
    const orgAdminCtx = ctx(orgAdminId, { organisationId: orgId, purposeCode: 'platform-administration' });
    const listed = await listParticipantsForOrganisation(m02, orgAdminCtx);
    const pat = listed.find((p) => p.participantId === participantId);
    expect(pat?.displayName).toBe('Pat P.');
    /*
     * participantState is deliberately absent.
     *
     * It used to be asserted here as 'Active', which it always was —
     * `participant_state` is a column default that no code has ever
     * written and nothing anywhere enforces. The administration screen
     * printed it under the heading "Account state", so a value nobody
     * maintained was being shown as a checked fact. Whether somebody is
     * still taking part is tracked per enrolment, which participants set
     * themselves, and that question already has a real answer.
     */
    // Administrative facts only — nothing about enrolment or consent.
    expect(Object.keys(pat ?? {}).sort()).toEqual(
      ['displayName', 'participantId', 'registeredAt', 'userAccountId'].sort(),
    );

    // A second organisation the administrator does not hold a role in.
    const { organisationId: otherOrgId } = await createOrganisation(m01, ctx(adminId), { name: 'Other Org' });
    const otherCtx = ctx(orgAdminId, { organisationId: otherOrgId, purposeCode: 'platform-administration' });
    await expect(listParticipantsForOrganisation(m02, otherCtx)).rejects.toMatchObject({
      code: 'AUTHORISATION_DENIED',
    });

    // A role that is not administrative cannot read it at all.
    await expect(
      listParticipantsForOrganisation(m02, ctx(researcherId, { organisationId: orgId, purposeCode: 'platform-administration' })),
    ).rejects.toMatchObject({ code: 'AUTHORISATION_DENIED' });

    // Purpose is required: the same administrator without one is refused.
    await expect(
      listParticipantsForOrganisation(m02, ctx(orgAdminId, { organisationId: orgId })),
    ).rejects.toMatchObject({ code: 'AUTHORISATION_DENIED' });

    // The platform operator does not get this by virtue of running the
    // platform. Administering the software and seeing the people in a
    // study are different jobs, and SystemAdministrator holds the first.
    await expect(
      listParticipantsForOrganisation(m02, ctx(adminId, { organisationId: orgId, purposeCode: 'platform-administration' })),
    ).rejects.toMatchObject({ code: 'AUTHORISATION_DENIED' });
  });

  /**
   * `project.view` was granted to the researcher and checked by no code,
   * and nothing anywhere listed a project: one was created, its
   * identifier was shown once in an announcement, and every screen
   * downstream then asked for that identifier back from memory. The head
   * of the research chain was the only part of it with no list.
   *
   * `research_questions` had a table from the day M04 was written and
   * nothing ever inserted a row, so a project was a title and nothing
   * else.
   */
  it('projects can be listed with the questions they ask, scoped to the organisation', async () => {
    const researcherCtx = ctx(researcherId, { organisationId: orgId });
    const { researchProjectId } = await createResearchProject(m04, researcherCtx, {
      organisationId: orgId,
      title: 'Loneliness and life story work',
    });
    await createResearchQuestion(m04, researcherCtx, {
      researchProjectId,
      questionText: 'Does participant-controlled life story work reduce loneliness?',
    });
    // A question that says nothing is not a question.
    await expect(
      createResearchQuestion(m04, researcherCtx, { researchProjectId, questionText: '   ' }),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });

    const projects = await listResearchProjects(m04, researcherCtx);
    const mine = projects.find((p) => p.researchProjectId === researchProjectId);
    expect(mine?.title).toBe('Loneliness and life story work');
    expect(mine?.questions.map((q) => q.questionText)).toEqual([
      'Does participant-controlled life story work reduce loneliness?',
    ]);

    /*
     * The organisation comes from the context and never from an argument:
     * a listing that takes one is a way of asking which organisations
     * exist. Without a context this researcher is refused by the
     * permission engine before the query's own guard is reached, because
     * their role is scoped to the organisation — the guard behind it
     * still matters for a holder whose grant is not scoped, which is why
     * it stays.
     */
    await expect(listResearchProjects(m04, ctx(researcherId))).rejects.toMatchObject({
      code: 'AUTHORISATION_DENIED',
    });

    // Held by the researcher, not by everyone with a staff login.
    await expect(
      listResearchProjects(m04, ctx(coordinatorId, { organisationId: orgId })),
    ).rejects.toMatchObject({ code: 'AUTHORISATION_DENIED' });
  });
});

describe.skipIf(dbAvailable)('P3 integration (skipped)', () => {
  it('skipped because no PostgreSQL is reachable', () => {
    expect(dbAvailable).toBe(false);
  });
});
