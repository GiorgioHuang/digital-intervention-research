import { newId, PlatformError, type Clock, type RequestContext } from '@platform/kernel';
import { appendToOutbox, recordAuditEvent, withTransaction, type Pool } from '@platform/database';
import { assertAllowed, type PolicyDecisionResult } from '@platform/policy';

export type PermissionCheck = (
  ctx: RequestContext,
  request: {
    action: string;
    resource: { type: string; id: string; state: string; protectedExistence: boolean; researchProjectId?: string };
    confirmed?: boolean;
  },
) => Promise<PolicyDecisionResult>;

export interface M13Deps {
  pool: Pool;
  clock: Clock;
  checkPermission: PermissionCheck;
}

export async function draftAnalysisPlan(
  deps: M13Deps,
  ctx: RequestContext,
  input: { researchProjectId: string; title: string },
): Promise<{ analysisPlanId: string }> {
  const decision = await deps.checkPermission(ctx, {
    action: 'analysis-plan.draft',
    resource: { type: 'AnalysisPlan', id: 'new', state: 'Draft', protectedExistence: false, researchProjectId: input.researchProjectId },
  });
  assertAllowed(decision, false);
  const analysisPlanId = newId('ap');
  const now = deps.clock.now();
  await withTransaction(deps.pool, async (client) => {
    await client.query(
      `INSERT INTO analysis_finding.analysis_plans (id, research_project_id, title, drafted_by_actor_id)
       VALUES ($1, $2, $3, $4)`,
      [analysisPlanId, input.researchProjectId, input.title, ctx.actor!.id],
    );
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: 'AnalysisPlanCreated',
      sourceModule: 'M13',
      aggregateType: 'AnalysisPlan',
      aggregateId: analysisPlanId,
      occurredAt: now,
    });
  });
  return { analysisPlanId };
}

export async function approveAnalysisPlan(
  deps: M13Deps,
  ctx: RequestContext,
  input: { analysisPlanId: string; confirmed: boolean },
): Promise<void> {
  if (ctx.actor?.type !== 'user') {
    throw new PlatformError('AUTHORISATION_DENIED', 'AnalysisPlan approval requires an authenticated human');
  }
  const decision = await deps.checkPermission(ctx, {
    action: 'analysis-plan.approve',
    resource: { type: 'AnalysisPlan', id: input.analysisPlanId, state: 'Draft', protectedExistence: false },
    confirmed: input.confirmed,
  });
  assertAllowed(decision, input.confirmed);
  const now = deps.clock.now();
  await withTransaction(deps.pool, async (client) => {
    const res = await client.query(
      `UPDATE analysis_finding.analysis_plans
          SET plan_state = 'Approved', approved_by_actor_id = $2, record_version = record_version + 1, updated_at = $3
        WHERE id = $1 AND plan_state IN ('Draft', 'In Review') AND drafted_by_actor_id <> $2`,
      [input.analysisPlanId, ctx.actor!.id, now],
    );
    if (res.rowCount !== 1) {
      throw new PlatformError('INVALID_STATE_TRANSITION', 'Plan not approvable, or self-approval attempted');
    }
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: 'AnalysisPlanApproved',
      sourceModule: 'M13',
      aggregateType: 'AnalysisPlan',
      aggregateId: input.analysisPlanId,
      occurredAt: now,
    });
  });
}

/**
 * Refusing an analysis plan. 'Rejected' was in the plan_state CHECK from
 * the start with nothing able to write it, so the approver's only move was
 * to approve. Refusing is the same authority and the same separation of
 * duties, and takes a reason so the drafter can find out why.
 */
export async function rejectAnalysisPlan(
  deps: M13Deps,
  ctx: RequestContext,
  input: { analysisPlanId: string; reason: string; confirmed: boolean },
): Promise<void> {
  if (ctx.actor?.type !== 'user') {
    throw new PlatformError('AUTHORISATION_DENIED', 'AnalysisPlan decisions require an authenticated human');
  }
  const decision = await deps.checkPermission(ctx, {
    action: 'analysis-plan.approve',
    resource: { type: 'AnalysisPlan', id: input.analysisPlanId, state: 'Draft', protectedExistence: false },
    confirmed: input.confirmed,
  });
  assertAllowed(decision, input.confirmed);
  if (input.reason.trim() === '') {
    throw new PlatformError('VALIDATION_ERROR', 'Refusing an analysis plan needs a reason');
  }
  const now = deps.clock.now();
  await withTransaction(deps.pool, async (client) => {
    const res = await client.query(
      `UPDATE analysis_finding.analysis_plans
          SET plan_state = 'Rejected', refused_by_actor_id = $2, refused_reason = $4, refused_at = $3,
              record_version = record_version + 1, updated_at = $3
        WHERE id = $1 AND plan_state IN ('Draft', 'In Review') AND drafted_by_actor_id <> $2`,
      [input.analysisPlanId, ctx.actor!.id, now, input.reason.trim()],
    );
    if (res.rowCount !== 1) {
      throw new PlatformError('INVALID_STATE_TRANSITION', 'Plan not refusable, or the drafter tried to refuse their own');
    }
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: 'AnalysisPlanRejected',
      sourceModule: 'M13',
      aggregateType: 'AnalysisPlan',
      aggregateId: input.analysisPlanId,
      occurredAt: now,
    });
  });
}

/**
 * AnalysisRun binds an APPROVED AnalysisPlan to an exact LOCKED
 * DatasetVersion (ADR-045/046) and captures the execution environment.
 * The run's outputs are AnalysisOutput — never automatically a Finding.
 *
 * The outcome is the caller's to state, and it was hardcoded to
 * 'Completed'. The platform performs no analysis — a person runs it
 * elsewhere and records what happened — so every run in the database
 * claimed a clean completion whatever had actually occurred. An analysis
 * that fell over, or that finished with warnings a reader would need to
 * weigh, could only be written down as though it had gone perfectly, and
 * an interpretation drawn from it would carry no hint otherwise.
 *
 * The three outcomes here are the ones a person can honestly report
 * after the fact. 'Queued', 'Running' and 'Cancelled' stay unreachable
 * on purpose: nothing here queues, runs or cancels anything, so a record
 * in one of those states would describe a machine that does not exist.
 */
export async function runAnalysis(
  deps: M13Deps,
  ctx: RequestContext,
  input: {
    analysisPlanId: string;
    datasetVersionId: string;
    outputs: Record<string, unknown>;
    environment: Record<string, unknown>;
    runState?: 'Completed' | 'Completed with Warnings' | 'Failed';
  },
): Promise<{ analysisRunId: string }> {
  const decision = await deps.checkPermission(ctx, {
    action: 'analysis.run',
    resource: { type: 'AnalysisRun', id: 'new', state: 'Draft', protectedExistence: false },
  });
  assertAllowed(decision, false);
  const plan = await deps.pool.query(
    `SELECT plan_state FROM analysis_finding.analysis_plans WHERE id = $1`,
    [input.analysisPlanId],
  );
  if (plan.rows[0]?.plan_state !== 'Approved') {
    throw new PlatformError('APPROVAL_REQUIRED', 'Analysis requires an approved AnalysisPlan');
  }
  const version = await deps.pool.query(
    `SELECT version_state FROM dataset_quality.dataset_versions WHERE id = $1`,
    [input.datasetVersionId],
  );
  if (version.rows[0] === undefined) throw new PlatformError('RESOURCE_NOT_FOUND', 'Dataset version not found');
  if (version.rows[0].version_state !== 'Locked' && version.rows[0].version_state !== 'Analysed') {
    throw new PlatformError('DATASET_LOCK_NOT_READY', 'Analysis requires a locked DatasetVersion');
  }
  const analysisRunId = newId('ar');
  const now = deps.clock.now();
  await withTransaction(deps.pool, async (client) => {
    await client.query(
      `INSERT INTO analysis_finding.analysis_runs
         (id, analysis_plan_id, dataset_version_id, run_state, outputs, environment, started_by_actor_id)
       VALUES ($1, $2, $3, $7, $4, $5, $6)`,
      [
        analysisRunId,
        input.analysisPlanId,
        input.datasetVersionId,
        JSON.stringify(input.outputs),
        JSON.stringify(input.environment),
        ctx.actor!.id,
        input.runState ?? 'Completed',
      ],
    );
    /*
     * Only a run that produced something moves the dataset on. A failed
     * run has analysed nothing, and marking the version 'Analysed'
     * because somebody tried would misdescribe the dataset to everyone
     * downstream.
     */
    if (input.runState !== 'Failed') {
      await client.query(
        `UPDATE dataset_quality.dataset_versions SET version_state = 'Analysed', record_version = record_version + 1, updated_at = $2
          WHERE id = $1 AND version_state = 'Locked'`,
        [input.datasetVersionId, now],
      );
    }
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: input.runState === 'Failed' ? 'AnalysisRunFailed' : 'AnalysisRunCompleted',
      sourceModule: 'M13',
      aggregateType: 'AnalysisRun',
      aggregateId: analysisRunId,
      occurredAt: now,
    });
  });
  return { analysisRunId };
}

export async function draftInterpretation(
  deps: M13Deps,
  ctx: RequestContext,
  input: { analysisRunId: string; interpretationText: string },
): Promise<{ interpretationRecordId: string }> {
  const decision = await deps.checkPermission(ctx, {
    action: 'interpretation.draft',
    resource: { type: 'InterpretationRecord', id: 'new', state: 'Draft', protectedExistence: false },
  });
  assertAllowed(decision, false);
  const interpretationRecordId = newId('ir');
  const now = deps.clock.now();
  await withTransaction(deps.pool, async (client) => {
    await client.query(
      `INSERT INTO analysis_finding.interpretation_records (id, analysis_run_id, interpretation_text, drafted_by_actor_id)
       VALUES ($1, $2, $3, $4)`,
      [interpretationRecordId, input.analysisRunId, input.interpretationText, ctx.actor!.id],
    );
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: 'InterpretationDrafted',
      sourceModule: 'M13',
      aggregateType: 'InterpretationRecord',
      aggregateId: interpretationRecordId,
      occurredAt: now,
    });
  });
  return { interpretationRecordId };
}

export async function approveInterpretation(
  deps: M13Deps,
  ctx: RequestContext,
  input: { interpretationRecordId: string; confirmed: boolean },
): Promise<void> {
  if (ctx.actor?.type !== 'user') {
    throw new PlatformError('AUTHORISATION_DENIED', 'Interpretation approval requires an authenticated human');
  }
  const decision = await deps.checkPermission(ctx, {
    action: 'interpretation.approve',
    resource: { type: 'InterpretationRecord', id: input.interpretationRecordId, state: 'Draft', protectedExistence: false },
    confirmed: input.confirmed,
  });
  assertAllowed(decision, input.confirmed);
  const now = deps.clock.now();
  await withTransaction(deps.pool, async (client) => {
    const res = await client.query(
      `UPDATE analysis_finding.interpretation_records
          SET interpretation_state = 'Approved', approved_by_actor_id = $2, record_version = record_version + 1, updated_at = $3
        WHERE id = $1 AND interpretation_state IN ('Draft', 'In Review') AND drafted_by_actor_id <> $2`,
      [input.interpretationRecordId, ctx.actor!.id, now],
    );
    if (res.rowCount !== 1) {
      throw new PlatformError('INVALID_STATE_TRANSITION', 'Interpretation not approvable, or self-approval attempted');
    }
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: 'InterpretationApproved',
      sourceModule: 'M13',
      aggregateType: 'InterpretationRecord',
      aggregateId: input.interpretationRecordId,
      occurredAt: now,
    });
  });
}

/** Findings require an APPROVED interpretation; approval is human + MFA. */
export async function draftResearchFinding(
  deps: M13Deps,
  ctx: RequestContext,
  input: { interpretationRecordId: string; findingText: string },
): Promise<{ researchFindingId: string }> {
  const decision = await deps.checkPermission(ctx, {
    action: 'finding.draft',
    resource: { type: 'ResearchFinding', id: 'new', state: 'Draft', protectedExistence: false },
  });
  assertAllowed(decision, false);
  const interp = await deps.pool.query(
    `SELECT interpretation_state FROM analysis_finding.interpretation_records WHERE id = $1`,
    [input.interpretationRecordId],
  );
  if (interp.rows[0]?.interpretation_state !== 'Approved') {
    throw new PlatformError('APPROVAL_REQUIRED', 'A Finding requires an approved InterpretationRecord (Output != Finding)');
  }
  const researchFindingId = newId('rf');
  const now = deps.clock.now();
  await withTransaction(deps.pool, async (client) => {
    await client.query(
      `INSERT INTO analysis_finding.research_findings (id, interpretation_record_id, finding_text, drafted_by_actor_id)
       VALUES ($1, $2, $3, $4)`,
      [researchFindingId, input.interpretationRecordId, input.findingText, ctx.actor!.id],
    );
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: 'ResearchFindingDrafted',
      sourceModule: 'M13',
      aggregateType: 'ResearchFinding',
      aggregateId: researchFindingId,
      occurredAt: now,
    });
  });
  return { researchFindingId };
}

export async function approveResearchFinding(
  deps: M13Deps,
  ctx: RequestContext,
  input: { researchFindingId: string; withLimitations?: boolean; confirmed: boolean },
): Promise<void> {
  if (ctx.actor?.type !== 'user') {
    throw new PlatformError('AUTHORISATION_DENIED', 'Finding approval requires an authenticated human');
  }
  const decision = await deps.checkPermission(ctx, {
    action: 'finding.approve',
    resource: { type: 'ResearchFinding', id: input.researchFindingId, state: 'Draft', protectedExistence: false },
    confirmed: input.confirmed,
  });
  assertAllowed(decision, input.confirmed);
  const now = deps.clock.now();
  const toState = input.withLimitations === true ? 'Approved with Limitations' : 'Approved';
  await withTransaction(deps.pool, async (client) => {
    const res = await client.query(
      `UPDATE analysis_finding.research_findings
          SET finding_state = $4, approved_by_actor_id = $2, record_version = record_version + 1, updated_at = $3
        WHERE id = $1 AND finding_state IN ('Draft', 'In Review') AND drafted_by_actor_id <> $2`,
      [input.researchFindingId, ctx.actor!.id, now, toState],
    );
    if (res.rowCount !== 1) {
      throw new PlatformError('INVALID_STATE_TRANSITION', 'Finding not approvable, or self-approval attempted');
    }
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: 'ResearchFindingApproved',
      sourceModule: 'M13',
      aggregateType: 'ResearchFinding',
      aggregateId: input.researchFindingId,
      occurredAt: now,
    });
    await recordAuditEvent(client, ctx, {
      action: 'finding.approve',
      targetType: 'ResearchFinding',
      targetId: input.researchFindingId,
      occurredAt: now,
      result: 'Succeeded',
      source: 'M13',
      policyVersion: decision.policyVersion,
    });
  });
}

/**
 * Refusing a research finding. The strongest artefact in the chain had no
 * way to be told no: everything upstream - locked dataset, recorded run,
 * approved interpretation - led to a screen with one button on it.
 */
export async function rejectResearchFinding(
  deps: M13Deps,
  ctx: RequestContext,
  input: { researchFindingId: string; reason: string; confirmed: boolean },
): Promise<void> {
  if (ctx.actor?.type !== 'user') {
    throw new PlatformError('AUTHORISATION_DENIED', 'Finding decisions require an authenticated human');
  }
  const decision = await deps.checkPermission(ctx, {
    action: 'finding.approve',
    resource: { type: 'ResearchFinding', id: input.researchFindingId, state: 'Draft', protectedExistence: false },
    confirmed: input.confirmed,
  });
  assertAllowed(decision, input.confirmed);
  if (input.reason.trim() === '') {
    throw new PlatformError('VALIDATION_ERROR', 'Refusing a finding needs a reason');
  }
  const now = deps.clock.now();
  await withTransaction(deps.pool, async (client) => {
    const res = await client.query(
      `UPDATE analysis_finding.research_findings
          SET finding_state = 'Rejected', refused_by_actor_id = $2, refused_reason = $4, refused_at = $3,
              record_version = record_version + 1, updated_at = $3
        WHERE id = $1 AND finding_state IN ('Draft', 'In Review') AND drafted_by_actor_id <> $2`,
      [input.researchFindingId, ctx.actor!.id, now, input.reason.trim()],
    );
    if (res.rowCount !== 1) {
      throw new PlatformError('INVALID_STATE_TRANSITION', 'Finding not refusable, or the drafter tried to refuse their own');
    }
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: 'ResearchFindingRejected',
      sourceModule: 'M13',
      aggregateType: 'ResearchFinding',
      aggregateId: input.researchFindingId,
      occurredAt: now,
    });
    await recordAuditEvent(client, ctx, {
      action: 'finding.approve',
      targetType: 'ResearchFinding',
      targetId: input.researchFindingId,
      occurredAt: now,
      result: 'Succeeded',
      source: 'M13',
      policyVersion: decision.policyVersion,
    });
  });
}
