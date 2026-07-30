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
  approveDatasetDefinition,
  completeQualityReview,
  createDatasetDefinition,
  generateDatasetVersion,
  lockDatasetVersion,
  type M12Deps,
} from '@platform/m12-dataset';
import {
  approveAnalysisPlan,
  approveInterpretation,
  approveResearchFinding,
  draftAnalysisPlan,
  draftInterpretation,
  draftResearchFinding,
  runAnalysis,
  type M13Deps,
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

describe.skipIf(!dbAvailable)('M12 dataset lock + M13 analysis chain (integration)', () => {
  let pool: pg.Pool;
  const clock = new FixedClock('2026-07-30T12:00:00Z');
  let m01: M01Deps, m12: M12Deps, m13: M13Deps;
  let adminId: string, orgId: string, researcherId: string, approverId: string;
  const ctx = (id: string, extras: Record<string, unknown> = {}) =>
    createRequestContext({ actor: { type: 'user', id }, organisationId: orgId, ...extras });
  const mfa = (id: string) => ctx(id, { authStrength: 'mfa' });
  const svc = () => createRequestContext({ actor: { type: 'service-account', id: 'sa_pipeline' } });

  beforeAll(async () => {
    await migrate({ databaseUrl: DATABASE_URL, direction: 'up' });
    pool = createPool({ connectionString: DATABASE_URL, applicationName: 'm13-tests' });
    const permissions = createPermissionService({
      pool,
      clock,
      policy: POLICY_V1,
      roleAssignments: createRoleAssignmentQuery(pool),
    });
    const checkPermission = permissions.evaluate.bind(permissions);
    m01 = { pool, clock, checkPermission };
    m12 = { pool, clock, checkPermission };
    m13 = { pool, clock, checkPermission };

    ({ userAccountId: adminId } = await seedBootstrapAdministrator(pool, clock, { displayName: 'Admin' }));
    ({ organisationId: orgId } = await createOrganisation(m01, createRequestContext({ actor: { type: 'user', id: adminId } }), { name: 'Data Org' }));
    const adminCtx = ctx(adminId);
    ({ userAccountId: researcherId } = await createUserAccount(m01, adminCtx, { displayName: 'R' }));
    ({ userAccountId: approverId } = await createUserAccount(m01, adminCtx, { displayName: 'A' }));
    await assignRole(m01, adminCtx, { userAccountId: researcherId, role: 'Researcher', organisationId: orgId, confirmed: true });
    await assignRole(m01, adminCtx, { userAccountId: approverId, role: 'ResearchApprover', organisationId: orgId, confirmed: true });
  }, 30_000);

  afterAll(async () => {
    await pool?.end();
  });

  let definitionId: string, versionId: string, planId: string, runId: string, interpretationId: string, findingId: string;

  it('NEGATIVE message body cannot enter an ordinary DatasetDefinition (ADR-034)', async () => {
    await expect(
      createDatasetDefinition(m12, ctx(researcherId), {
        researchProjectId: 'rp_pilot',
        name: 'bad',
        variables: { message_body_text: 'text' },
      }),
    ).rejects.toMatchObject({ code: 'DEIDENTIFICATION_REQUIRED' });
  });

  it('definition -> approval (separation of duties) -> generation with lineage manifest', async () => {
    ({ datasetDefinitionId: definitionId } = await createDatasetDefinition(m12, ctx(researcherId), {
      researchProjectId: 'rp_pilot',
      name: 'pilot-feasibility',
      variables: { enrolment_state: 'text', exposure_state: 'text', delivery_state_category: 'text' },
    }));
    // NEGATIVE: generation before approval refused.
    await expect(
      generateDatasetVersion(m12, ctx(researcherId), { datasetDefinitionId: definitionId, sourceDescription: 'x', rowCount: 1 }),
    ).rejects.toMatchObject({ code: 'RESOURCE_STATE_BLOCKED' });

    await approveDatasetDefinition(m12, ctx(approverId), { datasetDefinitionId: definitionId, confirmed: true });
    ({ datasetVersionId: versionId } = await generateDatasetVersion(m12, ctx(researcherId), {
      datasetDefinitionId: definitionId,
      sourceDescription: 'enrolment + exposure tables as of freeze',
      rowCount: 24,
    }));
    const v = await pool.query(`SELECT manifest, version_state FROM dataset_quality.dataset_versions WHERE id = $1`, [versionId]);
    expect(v.rows[0].manifest.datasetDefinitionId).toBe(definitionId);
    expect(v.rows[0].version_state).toBe('Generated');
  });

  it('NEGATIVE analysis before lock refused; NEGATIVE automation cannot lock; human+MFA locks; locked version immutable', async () => {
    await completeQualityReview(m12, ctx(researcherId), versionId);
    ({ analysisPlanId: planId } = await draftAnalysisPlan(m13, ctx(researcherId), { researchProjectId: 'rp_pilot', title: 'Feasibility descriptives' }));
    await approveAnalysisPlan(m13, ctx(approverId), { analysisPlanId: planId, confirmed: true });

    await expect(
      runAnalysis(m13, ctx(researcherId), { analysisPlanId: planId, datasetVersionId: versionId, outputs: {}, environment: {} }),
    ).rejects.toMatchObject({ code: 'DATASET_LOCK_NOT_READY' });

    await expect(
      lockDatasetVersion(m12, svc(), { datasetVersionId: versionId, confirmed: true }),
    ).rejects.toMatchObject({ code: 'AUTHORISATION_DENIED' });
    await expect(
      lockDatasetVersion(m12, ctx(approverId), { datasetVersionId: versionId, confirmed: true }),
    ).rejects.toMatchObject({ code: 'STEP_UP_AUTHENTICATION_REQUIRED' });

    await lockDatasetVersion(m12, mfa(approverId), { datasetVersionId: versionId, confirmed: true });
    const evt = await pool.query(
      `SELECT count(*)::int AS n FROM platform_kernel.outbox_messages WHERE event_type = 'DatasetVersionLocked' AND aggregate_id = $1`,
      [versionId],
    );
    expect(evt.rows[0].n).toBe(1);

    await expect(
      pool.query(`UPDATE dataset_quality.dataset_versions SET row_count = 999 WHERE id = $1`, [versionId]),
    ).rejects.toThrow(/immutable/);
    // NEGATIVE: one lock per version (DB unique).
    await expect(
      pool.query(`INSERT INTO dataset_quality.dataset_locks (id, dataset_version_id, locked_by_actor_id, manifest_hash) VALUES ('dl_x', $1, 'a', 'h')`, [versionId]),
    ).rejects.toThrow(/duplicate key/i);
  });

  it('run binds approved plan + locked version; Output != Finding: finding refused without approved interpretation', async () => {
    ({ analysisRunId: runId } = await runAnalysis(m13, ctx(researcherId), {
      analysisPlanId: planId,
      datasetVersionId: versionId,
      outputs: { completion_rate: 0.79 },
      environment: { runtime: 'node22', seed: 42 },
    }));
    await expect(
      draftResearchFinding(m13, ctx(researcherId), { interpretationRecordId: 'ir_none', findingText: 'x' }),
    ).rejects.toMatchObject({ code: 'APPROVAL_REQUIRED' });

    ({ interpretationRecordId: interpretationId } = await draftInterpretation(m13, ctx(researcherId), {
      analysisRunId: runId,
      interpretationText: 'Completion above the 70% feasibility threshold.',
    }));
    await expect(
      draftResearchFinding(m13, ctx(researcherId), { interpretationRecordId: interpretationId, findingText: 'x' }),
    ).rejects.toMatchObject({ code: 'APPROVAL_REQUIRED' });

    await approveInterpretation(m13, ctx(approverId), { interpretationRecordId: interpretationId, confirmed: true });
    ({ researchFindingId: findingId } = await draftResearchFinding(m13, ctx(researcherId), {
      interpretationRecordId: interpretationId,
      findingText: 'The pilot pathway is feasible with accessibility safeguards.',
    }));
  });

  it('NEGATIVE self-approval of a Finding refused; approver with MFA approves; full lineage intact', async () => {
    await expect(
      approveResearchFinding(m13, mfa(researcherId), { researchFindingId: findingId, confirmed: true }),
    ).rejects.toMatchObject({ code: 'AUTHORISATION_DENIED' });

    await approveResearchFinding(m13, mfa(approverId), { researchFindingId: findingId, withLimitations: true, confirmed: true });
    const lineage = await pool.query(
      `SELECT f.finding_state, i.analysis_run_id, r.dataset_version_id, r.analysis_plan_id
         FROM analysis_finding.research_findings f
         JOIN analysis_finding.interpretation_records i ON i.id = f.interpretation_record_id
         JOIN analysis_finding.analysis_runs r ON r.id = i.analysis_run_id
        WHERE f.id = $1`,
      [findingId],
    );
    expect(lineage.rows[0].finding_state).toBe('Approved with Limitations');
    expect(lineage.rows[0].dataset_version_id).toBe(versionId);
    expect(lineage.rows[0].analysis_plan_id).toBe(planId);
  });
});

describe.skipIf(dbAvailable)('M12+M13 integration (skipped)', () => {
  it('skipped because no PostgreSQL is reachable', () => {
    expect(dbAvailable).toBe(false);
  });
});
