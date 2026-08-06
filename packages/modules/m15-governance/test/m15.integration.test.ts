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
import { createPermissionService } from '@platform/m03-consent-permission';
import {
  decideApproval,
  executeBreakGlass,
  liftGovernanceHold,
  placeGovernanceHold,
  listAuditEvents,
  requestApproval,
  reviewBreakGlass,
  type M15Deps,
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

describe.skipIf(!dbAvailable)('M15 governance (integration)', () => {
  let pool: pg.Pool;
  const clock = new FixedClock('2026-07-30T12:00:00Z');
  let m01: M01Deps, m15: M15Deps;
  let adminId: string, researcherId: string, researcher2Id: string, approverId: string, privacyId: string;
  const ctx = (id: string, strength?: 'password' | 'mfa') =>
    createRequestContext({ actor: { type: 'user', id }, ...(strength === undefined ? {} : { authStrength: strength }) });

  beforeAll(async () => {
    await migrate({ databaseUrl: DATABASE_URL, direction: 'up' });
    pool = createPool({ connectionString: DATABASE_URL, applicationName: 'm15-tests' });
    const permissions = createPermissionService({
      pool,
      clock,
      policy: POLICY_V1,
      roleAssignments: createRoleAssignmentQuery(pool),
    });
    const checkPermission = permissions.evaluate.bind(permissions);
    m01 = { pool, clock, checkPermission };
    m15 = { pool, clock, checkPermission };

    ({ userAccountId: adminId } = await seedBootstrapAdministrator(pool, clock, { displayName: 'Admin' }));
    const { organisationId } = await createOrganisation(m01, ctx(adminId), { name: 'Gov Org' });
    const adminCtx = createRequestContext({ actor: { type: 'user', id: adminId }, organisationId });
    ({ userAccountId: researcherId } = await createUserAccount(m01, adminCtx, { displayName: 'R1' }));
    ({ userAccountId: researcher2Id } = await createUserAccount(m01, adminCtx, { displayName: 'R2' }));
    ({ userAccountId: approverId } = await createUserAccount(m01, adminCtx, { displayName: 'Ap' }));
    ({ userAccountId: privacyId } = await createUserAccount(m01, adminCtx, { displayName: 'Pv' }));
    await assignRole(m01, adminCtx, { userAccountId: researcherId, role: 'Researcher', confirmed: true });
    await assignRole(m01, adminCtx, { userAccountId: researcher2Id, role: 'Researcher', confirmed: true });
    await assignRole(m01, adminCtx, { userAccountId: approverId, role: 'ResearchApprover', confirmed: true });
    // The approver may also request approvals in this scenario.
    await assignRole(m01, adminCtx, { userAccountId: approverId, role: 'Researcher', confirmed: true });
    await assignRole(m01, adminCtx, { userAccountId: privacyId, role: 'PrivacyReviewer', confirmed: true });
  }, 30_000);

  afterAll(async () => {
    await pool?.end();
  });

  it('approval binds one exact artefact version and is decided by a different human with MFA', async () => {
    const { approvalRecordId } = await requestApproval(m15, ctx(researcherId), {
      artefactType: 'ProtocolVersion',
      artefactId: 'pv_gov_1',
      artefactVersion: 3,
    });

    // MFA required for the decision.
    await expect(
      decideApproval(m15, ctx(approverId, 'password'), {
        approvalRecordId, decision: 'Approved', reason: 'Meets criteria', confirmed: true,
      }),
    ).rejects.toMatchObject({ code: 'STEP_UP_AUTHENTICATION_REQUIRED' });

    await decideApproval(m15, ctx(approverId, 'mfa'), {
      approvalRecordId, decision: 'Approved', reason: 'Meets criteria', confirmed: true,
    });

    const row = await pool.query(
      `SELECT approval_state, decision_auth_strength, artefact_version
         FROM governance_audit.approval_records WHERE id = $1`,
      [approvalRecordId],
    );
    expect(row.rows[0]).toMatchObject({ approval_state: 'Approved', decision_auth_strength: 'mfa', artefact_version: 3 });

    // Decided approvals are terminal.
    await expect(
      decideApproval(m15, ctx(approverId, 'mfa'), {
        approvalRecordId, decision: 'Rejected', reason: 'flip', confirmed: true,
      }),
    ).rejects.toMatchObject({ code: 'INVALID_STATE_TRANSITION' });
  });

  it('NEGATIVE self-approval is refused in code AND by the DB CHECK', async () => {
    const { approvalRecordId } = await requestApproval(m15, ctx(approverId), {
      artefactType: 'DatasetVersion', artefactId: 'dv_gov_1', artefactVersion: 1,
    });
    await expect(
      decideApproval(m15, ctx(approverId, 'mfa'), {
        approvalRecordId, decision: 'Approved', reason: 'mine', confirmed: true,
      }),
    ).rejects.toMatchObject({ code: 'AUTHORISATION_DENIED' });
    // Defence in depth: a direct write bypassing the command also fails.
    await expect(
      pool.query(
        `UPDATE governance_audit.approval_records
            SET approval_state = 'Approved', decided_by_actor_id = requested_by_actor_id
          WHERE id = $1`,
        [approvalRecordId],
      ),
    ).rejects.toThrow(/approval_records/);
  });

  it('approval state history is append-only', async () => {
    const hist = await pool.query(
      `SELECT id FROM governance_audit.approval_state_history LIMIT 1`,
    );
    await expect(
      pool.query(`DELETE FROM governance_audit.approval_state_history WHERE id = $1`, [hist.rows[0].id]),
    ).rejects.toThrow(/append-only/);
  });

  it('governance hold: place and lift by a privacy reviewer, confirmed', async () => {
    const { governanceHoldId } = await placeGovernanceHold(m15, ctx(privacyId), {
      artefactType: 'DatasetVersion', artefactId: 'dv_gov_2', reason: 'Pending privacy review', confirmed: true,
    });
    // Researchers hold no governance-hold authority.
    await expect(
      liftGovernanceHold(m15, ctx(researcherId), { governanceHoldId, liftReason: 'x', confirmed: true }),
    ).rejects.toMatchObject({ code: 'AUTHORISATION_DENIED' });
    await liftGovernanceHold(m15, ctx(privacyId), {
      governanceHoldId, liftReason: 'Review complete', confirmed: true,
    });
    await expect(
      liftGovernanceHold(m15, ctx(privacyId), { governanceHoldId, liftReason: 'again', confirmed: true }),
    ).rejects.toMatchObject({ code: 'INVALID_STATE_TRANSITION' });
  });

  it('break-glass: MFA + confirmed + reason/scope/expiry; review is mandatory and never by the executor', async () => {
    await expect(
      executeBreakGlass(m15, ctx(adminId, 'password'), {
        reason: 'Incident 42', scope: 'read participant pt_x audit trail', expiresAt: new Date('2026-07-31T12:00:00Z'), confirmed: true,
      }),
    ).rejects.toMatchObject({ code: 'STEP_UP_AUTHENTICATION_REQUIRED' });

    const { breakGlassId } = await executeBreakGlass(m15, ctx(adminId, 'mfa'), {
      reason: 'Incident 42', scope: 'read participant pt_x audit trail', expiresAt: new Date('2026-07-31T12:00:00Z'), confirmed: true,
    });

    // The executor cannot review their own break-glass.
    await expect(
      reviewBreakGlass(m15, createRequestContext({ actor: { type: 'user', id: adminId } }), {
        breakGlassId, outcome: 'Justified', confirmed: true,
      }),
    ).rejects.toMatchObject({ code: 'AUTHORISATION_DENIED' });

    await reviewBreakGlass(m15, ctx(privacyId), { breakGlassId, outcome: 'Justified', confirmed: true });
    const row = await pool.query(
      `SELECT review_state, review_outcome FROM governance_audit.break_glass_records WHERE id = $1`,
      [breakGlassId],
    );
    expect(row.rows[0]).toMatchObject({ review_state: 'Reviewed', review_outcome: 'Justified' });
  });

  /**
   * Sixty-one call sites wrote audit events and nothing read one, while
   * `audit.view` sat granted to three roles and checked by no code. The
   * platform's whole accountability record was append-only and
   * unreadable — the recording was complete, correct and fail-closed, and
   * no human being could ever see it.
   */
  it('the audit trail can be read, only with a reason, and reading it is itself recorded', async () => {
    // A researcher holds no audit.view: it is granted to system and
    // organisation administrators and to privacy reviewers.
    await expect(
      listAuditEvents(m15, ctx(researcherId), { accessReason: 'curious' }),
    ).rejects.toMatchObject({ code: 'AUTHORISATION_DENIED' });

    // The reason is not decoration. Without one there is no read.
    await expect(
      listAuditEvents(m15, ctx(privacyId), { accessReason: '   ' }),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });

    const rows = await listAuditEvents(m15, ctx(privacyId), {
      accessReason: 'Reviewing break-glass 42',
      targetType: 'BreakGlassRecord',
    });
    // The break-glass execution earlier in this suite is in here, which is
    // the point: the record of the strongest thing anyone can do was
    // being written into a store no one could open.
    expect(rows.some((r) => r.action === 'break-glass.execute')).toBe(true);

    /*
     * And the read itself was written before the rows came back, with the
     * reason and the filters. A trail whose readers leave no trace is the
     * one record a misuser has no reason to avoid.
     */
    const own = await pool.query(
      `SELECT access_reason, query_filters, actor_id FROM governance_audit.audit_events
        WHERE action = 'audit.view' ORDER BY occurred_at DESC LIMIT 1`,
    );
    expect(own.rows[0]).toMatchObject({ actor_id: privacyId, access_reason: 'Reviewing break-glass 42' });
    expect(own.rows[0].query_filters).toMatchObject({ targetType: 'BreakGlassRecord' });

    // A refused read leaves nothing behind, because nothing writes a
    // refusal anywhere in this store. The screen says so; this pins it.
    const denied = await pool.query(
      `SELECT count(*)::int AS n FROM governance_audit.audit_events WHERE result IN ('Allowed', 'Denied')`,
    );
    expect(denied.rows[0].n).toBe(0);
  });
});

describe.skipIf(dbAvailable)('M15 governance (skipped)', () => {
  it('skipped because no PostgreSQL is reachable', () => {
    expect(dbAvailable).toBe(false);
  });
});
