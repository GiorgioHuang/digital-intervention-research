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
import { createParticipantQuery, registerParticipant } from '@platform/m02-participant';
import { createPermissionService } from '@platform/m03-consent-permission';
import {
  approveReportVersion,
  createReport,
  decideExport,
  draftReportVersion,
  generateExportPackage,
  listExportsToCarryOut,
  listMyExportRequests,
  listPendingExportRequests,
  listReportVersionsAwaitingApproval,
  listReportWork,
  recordExportDelivery,
  requestParticipantExport,
  requestResearchExport,
  type M14Deps,
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

describe.skipIf(!dbAvailable)('M14 reporting and export (integration)', () => {
  let pool: pg.Pool;
  const clock = new FixedClock('2026-07-30T12:00:00Z');
  let m01: M01Deps, m14: M14Deps;
  let researcherId: string, approverId: string;
  let patAcc: string, patId: string, otherAcc: string;
  const ctx = (id: string, strength?: 'password' | 'mfa') =>
    createRequestContext({ actor: { type: 'user', id }, ...(strength === undefined ? {} : { authStrength: strength }) });

  beforeAll(async () => {
    await migrate({ databaseUrl: DATABASE_URL, direction: 'up' });
    pool = createPool({ connectionString: DATABASE_URL, applicationName: 'm14-tests' });
    const permissions = createPermissionService({
      pool,
      clock,
      policy: POLICY_V1,
      roleAssignments: createRoleAssignmentQuery(pool),
      participantIdentity: createParticipantQuery(pool),
    });
    const checkPermission = permissions.evaluate.bind(permissions);
    m01 = { pool, clock, checkPermission };
    m14 = { pool, clock, checkPermission };

    const { userAccountId: adminId } = await seedBootstrapAdministrator(pool, clock, { displayName: 'Admin' });
    const { organisationId } = await createOrganisation(m01, ctx(adminId), { name: 'Report Org' });
    const adminCtx = createRequestContext({ actor: { type: 'user', id: adminId }, organisationId });
    ({ userAccountId: researcherId } = await createUserAccount(m01, adminCtx, { displayName: 'R' }));
    ({ userAccountId: approverId } = await createUserAccount(m01, adminCtx, { displayName: 'A' }));
    ({ userAccountId: patAcc } = await createUserAccount(m01, adminCtx, { displayName: 'P' }));
    ({ userAccountId: otherAcc } = await createUserAccount(m01, adminCtx, { displayName: 'O' }));
    await assignRole(m01, adminCtx, { userAccountId: researcherId, role: 'Researcher', confirmed: true });
    await assignRole(m01, adminCtx, { userAccountId: approverId, role: 'ResearchApprover', confirmed: true });
    for (const acc of [patAcc, otherAcc]) {
      await assignRole(m01, adminCtx, { userAccountId: acc, role: 'Participant', confirmed: true });
    }
    await assignRole(m01, adminCtx, { userAccountId: adminId, role: 'ResearchCoordinator', confirmed: true });
    ({ participantId: patId } = await registerParticipant({ pool, clock, checkPermission }, adminCtx, {
      displayName: 'P', userAccountId: patAcc,
    }));
  }, 30_000);

  afterAll(async () => {
    await pool?.end();
  });

  it('report version chain: draft, no self-approval, approved content immutable (trigger)', async () => {
    const { reportId } = await createReport(m14, ctx(researcherId), {
      researchProjectId: 'rp_m14', title: 'Pilot outcomes', reportType: 'ResearchReport',
    });
    const { reportVersionId, versionNumber } = await draftReportVersion(m14, ctx(researcherId), {
      reportId, content: { sections: ['methods', 'results'] },
    });
    expect(versionNumber).toBe(1);

    await expect(
      approveReportVersion(m14, ctx(researcherId), { reportVersionId, confirmed: true }),
    ).rejects.toMatchObject({ code: 'AUTHORISATION_DENIED' });

    await approveReportVersion(m14, ctx(approverId), { reportVersionId, confirmed: true });

    // Approved content is immutable at the database layer.
    await expect(
      pool.query(`UPDATE reporting_submission.report_versions SET content = '{}' WHERE id = $1`, [reportVersionId]),
    ).rejects.toThrow(/immutable/);
    // Re-approval of a non-draft is refused.
    await expect(
      approveReportVersion(m14, ctx(approverId), { reportVersionId, confirmed: true }),
    ).rejects.toMatchObject({ code: 'INVALID_STATE_TRANSITION' });
  });

  /**
   * Nothing listed report versions, so none could ever be approved: the
   * export half of this module had screens and the reports beside it did
   * not. These queues are what both sides are driven from.
   */
  it('the report queues follow the chain, and name the author before the button', async () => {
    const { reportId } = await createReport(m14, ctx(researcherId), {
      researchProjectId: 'rp_m14', title: 'Queue visible', reportType: 'ResearchReport',
    });
    // A report with no version has nothing to approve, and the queue does
    // not invent one.
    const started = (await listReportWork(m14, ctx(researcherId))).find((r) => r.reportId === reportId);
    expect(started?.versionState).toBeNull();

    const { reportVersionId } = await draftReportVersion(m14, ctx(researcherId), {
      reportId, content: { text: 'What this version says.' },
    });
    const waiting = (await listReportVersionsAwaitingApproval(m14, ctx(approverId))).find(
      (v) => v.reportVersionId === reportVersionId,
    );
    // Approving one's own version is barred by the command and by a
    // database CHECK; the approver learns that from the row.
    expect(waiting?.createdByActorId).toBe(researcherId);
    expect(waiting?.reportTitle).toBe('Queue visible');

    await approveReportVersion(m14, ctx(approverId), { reportVersionId, confirmed: true });
    // Approved versions leave the queue, which stays a list of work.
    expect(
      (await listReportVersionsAwaitingApproval(m14, ctx(approverId))).map((v) => v.reportVersionId),
    ).not.toContain(reportVersionId);
    // But stay visible to the writer, who otherwise could not tell
    // whether to draft another — approved content cannot be edited.
    const after = (await listReportWork(m14, ctx(researcherId))).find(
      (r) => r.reportVersionId === reportVersionId,
    );
    expect(after?.versionState).toBe('Approved');
    expect(after?.approvedByActorId).toBe(approverId);

    // Read under the action that already permits the work.
    await expect(listReportWork(m14, ctx(patAcc))).rejects.toMatchObject({ code: 'AUTHORISATION_DENIED' });
  });

  it('research export: approval-gated generation, MFA decision, truthful three-state delivery', async () => {
    const { exportRequestId } = await requestResearchExport(m14, ctx(researcherId), {
      purpose: 'External statistician review',
      recipient: 'stats-partner',
      sources: ['dv_locked_1'],
      deIdentification: 'Pseudonymised',
    });

    await expect(
      generateExportPackage(m14, ctx(researcherId), { exportRequestId }),
    ).rejects.toMatchObject({ code: 'APPROVAL_REQUIRED' });

    await expect(
      decideExport(m14, ctx(approverId, 'password'), { exportRequestId, decision: 'Approved', confirmed: true }),
    ).rejects.toMatchObject({ code: 'STEP_UP_AUTHENTICATION_REQUIRED' });

    await decideExport(m14, ctx(approverId, 'mfa'), { exportRequestId, decision: 'Approved', confirmed: true });

    const { manifestHash } = await generateExportPackage(m14, ctx(researcherId), { exportRequestId });
    expect(manifestHash).toMatch(/^[0-9a-f]{64}$/);

    // Generated is not Delivered; Delivered is not Received.
    await expect(
      recordExportDelivery(m14, ctx(researcherId), { exportRequestId, state: 'Received' }),
    ).rejects.toMatchObject({ code: 'INVALID_STATE_TRANSITION' });
    await recordExportDelivery(m14, ctx(researcherId), { exportRequestId, state: 'Delivered' });
    await recordExportDelivery(m14, ctx(researcherId), { exportRequestId, state: 'Received' });
  });

  it('NEGATIVE identifiable research export is impossible: command types forbid it and the DB CHECK backstops', async () => {
    await expect(
      pool.query(
        `INSERT INTO reporting_submission.export_requests
           (id, export_type, purpose, recipient, sources, de_identification, requested_by_actor_id)
         VALUES ('exr_bad', 'ResearchExport', 'x', 'y', '[]', 'None', 'actor_x')`,
      ),
    ).rejects.toThrow(/export_requests/);
  });

  it('participant portability export is owner-only and confirmed', async () => {
    await expect(
      requestParticipantExport(m14, ctx(otherAcc), { participantId: patId, purpose: 'my records', confirmed: true }),
    ).rejects.toMatchObject({ code: 'RESOURCE_NOT_FOUND' });

    await expect(
      requestParticipantExport(m14, ctx(patAcc), { participantId: patId, purpose: 'my records', confirmed: false }),
    ).rejects.toMatchObject({ code: 'CONFIRMATION_REQUIRED' });

    const { exportRequestId } = await requestParticipantExport(m14, ctx(patAcc), {
      participantId: patId, purpose: 'my records', confirmed: true,
    });
    const row = await pool.query(
      `SELECT export_type, participant_id, restrictions FROM reporting_submission.export_requests WHERE id = $1`,
      [exportRequestId],
    );
    expect(row.rows[0].export_type).toBe('ParticipantPortability');
    expect(row.rows[0].participant_id).toBe(patId);
    // Third-party restrictions are preserved, not silently dropped.
    expect(row.rows[0].restrictions).toContain('third-party');
  });

  /**
   * Asking was reachable; finding out what happened was not. A request
   * whose outcome the requester cannot see is indistinguishable from one
   * that was never made — a rejection would read exactly like silence.
   */
  it('a participant reads the state of their own requests, and nobody else can', async () => {
    const mine = await listMyExportRequests(m14, ctx(patAcc), patId);
    expect(mine).toHaveLength(1);
    expect(mine[0]!.requestState).toBe('Requested');

    // The read is separate from the confirmed command, so it does not have
    // to claim a confirmation it never made.
    await expect(listMyExportRequests(m14, ctx(otherAcc), patId)).rejects.toMatchObject({
      code: 'RESOURCE_NOT_FOUND',
    });
  });

  /**
   * The approver queue mixes two decisions that are not the same act, and
   * the facts that tell them apart have to reach the screen. A limit
   * already imposed on the request is one of them - without it the
   * approver assumes the worst about what would be released.
   */
  /**
   * Approving used to be the end of the road: nothing listed an approved
   * request, so the package was never put together and the delivery
   * never recorded. Someone could be told truthfully that their request
   * was agreed to and never hear another thing.
   */
  it('an agreed export appears in the work queue, and leaves it when it is finished', async () => {
    const { exportRequestId } = await requestParticipantExport(m14, ctx(patAcc), {
      participantId: patId, purpose: 'a copy for me', confirmed: true,
    });
    // Not yet decided, so it is not work for anyone.
    expect((await listExportsToCarryOut(m14, ctx(researcherId))).map((e) => e.exportRequestId)).not.toContain(
      exportRequestId,
    );

    await decideExport(m14, ctx(approverId, 'mfa'), { exportRequestId, decision: 'Approved', confirmed: true });
    const waiting = (await listExportsToCarryOut(m14, ctx(researcherId))).find(
      (e) => e.exportRequestId === exportRequestId,
    );
    expect(waiting?.requestState).toBe('Approved');
    // Nothing exists yet, and the queue does not pretend otherwise.
    expect(waiting?.manifestHash).toBeNull();

    await generateExportPackage(m14, ctx(researcherId), { exportRequestId });
    const generated = (await listExportsToCarryOut(m14, ctx(researcherId))).find(
      (e) => e.exportRequestId === exportRequestId,
    );
    expect(generated?.requestState).toBe('Generated');
    expect(generated?.manifestHash).toMatch(/^[0-9a-f]{64}$/);

    await recordExportDelivery(m14, ctx(researcherId), { exportRequestId, state: 'Delivered' });
    await recordExportDelivery(m14, ctx(researcherId), { exportRequestId, state: 'Received' });
    // Finished work leaves the list; a queue that keeps completed items
    // stops being read.
    expect((await listExportsToCarryOut(m14, ctx(researcherId))).map((e) => e.exportRequestId)).not.toContain(
      exportRequestId,
    );

    // Read under the action that already permits doing the work; deciding
    // an export is a different job with a different action.
    await expect(listExportsToCarryOut(m14, ctx(patAcc))).rejects.toMatchObject({
      code: 'AUTHORISATION_DENIED',
    });
  });

  it('the approver queue carries the limits already applied to a request', async () => {
    const pending = await listPendingExportRequests(m14, ctx(approverId));
    const portability = pending.find((p) => p.exportType === 'ParticipantPortability');
    expect(portability?.restrictions).toContain('third-party');
    expect(portability?.deIdentification).toBe('None');
  });
});

describe.skipIf(dbAvailable)('M14 reporting (skipped)', () => {
  it('skipped because no PostgreSQL is reachable', () => {
    expect(dbAvailable).toBe(false);
  });
});
