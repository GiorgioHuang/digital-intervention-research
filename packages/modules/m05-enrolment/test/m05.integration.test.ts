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
import { createPermissionService, recordConsentDecision, type M03Deps } from '@platform/m03-consent-permission';
import {
  activateProtocolVersion,
  approveProtocolVersion,
  createProtocolVersion,
  createProtocolVersionQuery,
  createResearchProject,
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
  let adminId: string, orgId: string, researcherId: string, approverId: string, coordinatorId: string;
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

    ({ userAccountId: researcherId } = await createUserAccount(m01, adminCtx, { displayName: 'Researcher' }));
    ({ userAccountId: approverId } = await createUserAccount(m01, adminCtx, { displayName: 'Approver' }));
    ({ userAccountId: coordinatorId } = await createUserAccount(m01, adminCtx, { displayName: 'Coordinator' }));
    ({ userAccountId: participantAccountId } = await createUserAccount(m01, adminCtx, { displayName: 'Pat' }));

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
});

describe.skipIf(dbAvailable)('P3 integration (skipped)', () => {
  it('skipped because no PostgreSQL is reachable', () => {
    expect(dbAvailable).toBe(false);
  });
});
