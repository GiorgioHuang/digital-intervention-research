import type { RequestContext } from '@platform/kernel';
import { assertAllowed } from '@platform/policy';
import type { M13Deps } from './commands.js';

export interface AnalysisPlanSummary {
  analysisPlanId: string;
  researchProjectId: string;
  title: string;
  planState: string;
  draftedByActorId: string;
  approvedByActorId: string | null;
  /** Why it was refused, if it was — otherwise a refusal is a state change
   *  nobody can act on. */
  refusedByActorId: string | null;
  refusedReason: string | null;
  updatedAt: string;
}

export interface AnalysisRunSummary {
  analysisRunId: string;
  analysisPlanId: string;
  planTitle: string;
  datasetVersionId: string;
  /** The manifest hash of the dataset the run was made against. */
  datasetManifestHash: string;
  runState: string;
  startedByActorId: string;
  createdAt: string;
}

export interface InterpretationSummary {
  interpretationRecordId: string;
  analysisRunId: string;
  planTitle: string;
  interpretationText: string;
  interpretationState: string;
  draftedByActorId: string;
  approvedByActorId: string | null;
  updatedAt: string;
}

export interface FindingSummary {
  researchFindingId: string;
  interpretationRecordId: string;
  planTitle: string;
  findingText: string;
  findingState: string;
  draftedByActorId: string;
  approvedByActorId: string | null;
  refusedByActorId: string | null;
  refusedReason: string | null;
  updatedAt: string;
}

export interface AnalysisWork {
  plans: AnalysisPlanSummary[];
  runs: AnalysisRunSummary[];
  interpretations: InterpretationSummary[];
  findings: FindingSummary[];
}

async function plans(deps: M13Deps, where: string): Promise<AnalysisPlanSummary[]> {
  const res = await deps.pool.query(
    `SELECT id, research_project_id, title, plan_state, drafted_by_actor_id, approved_by_actor_id,
            refused_by_actor_id, refused_reason, updated_at
       FROM analysis_finding.analysis_plans
      ${where}
      ORDER BY updated_at DESC`,
  );
  return res.rows.map((r) => ({
    analysisPlanId: r.id as string,
    researchProjectId: r.research_project_id as string,
    title: r.title as string,
    planState: r.plan_state as string,
    draftedByActorId: r.drafted_by_actor_id as string,
    approvedByActorId: (r.approved_by_actor_id as string | null) ?? null,
    refusedByActorId: (r.refused_by_actor_id as string | null) ?? null,
    refusedReason: (r.refused_reason as string | null) ?? null,
    updatedAt: (r.updated_at as Date).toISOString(),
  }));
}

async function runs(deps: M13Deps): Promise<AnalysisRunSummary[]> {
  const res = await deps.pool.query(
    `SELECT r.id, r.analysis_plan_id, r.dataset_version_id, r.run_state, r.started_by_actor_id, r.created_at,
            p.title, v.manifest_hash
       FROM analysis_finding.analysis_runs r
       JOIN analysis_finding.analysis_plans p ON p.id = r.analysis_plan_id
       JOIN dataset_quality.dataset_versions v ON v.id = r.dataset_version_id
      ORDER BY r.created_at DESC`,
  );
  return res.rows.map((r) => ({
    analysisRunId: r.id as string,
    analysisPlanId: r.analysis_plan_id as string,
    planTitle: r.title as string,
    datasetVersionId: r.dataset_version_id as string,
    datasetManifestHash: r.manifest_hash as string,
    runState: r.run_state as string,
    startedByActorId: r.started_by_actor_id as string,
    createdAt: (r.created_at as Date).toISOString(),
  }));
}

async function interpretations(deps: M13Deps, where: string): Promise<InterpretationSummary[]> {
  const res = await deps.pool.query(
    `SELECT i.id, i.analysis_run_id, i.interpretation_text, i.interpretation_state,
            i.drafted_by_actor_id, i.approved_by_actor_id, i.updated_at, p.title
       FROM analysis_finding.interpretation_records i
       JOIN analysis_finding.analysis_runs r ON r.id = i.analysis_run_id
       JOIN analysis_finding.analysis_plans p ON p.id = r.analysis_plan_id
      ${where}
      ORDER BY i.updated_at DESC`,
  );
  return res.rows.map((r) => ({
    interpretationRecordId: r.id as string,
    analysisRunId: r.analysis_run_id as string,
    planTitle: r.title as string,
    interpretationText: r.interpretation_text as string,
    interpretationState: r.interpretation_state as string,
    draftedByActorId: r.drafted_by_actor_id as string,
    approvedByActorId: (r.approved_by_actor_id as string | null) ?? null,
    updatedAt: (r.updated_at as Date).toISOString(),
  }));
}

async function findings(deps: M13Deps, where: string): Promise<FindingSummary[]> {
  const res = await deps.pool.query(
    `SELECT f.id, f.interpretation_record_id, f.finding_text, f.finding_state,
            f.drafted_by_actor_id, f.approved_by_actor_id,
            f.refused_by_actor_id, f.refused_reason, f.updated_at, p.title
       FROM analysis_finding.research_findings f
       JOIN analysis_finding.interpretation_records i ON i.id = f.interpretation_record_id
       JOIN analysis_finding.analysis_runs r ON r.id = i.analysis_run_id
       JOIN analysis_finding.analysis_plans p ON p.id = r.analysis_plan_id
      ${where}
      ORDER BY f.updated_at DESC`,
  );
  return res.rows.map((r) => ({
    researchFindingId: r.id as string,
    interpretationRecordId: r.interpretation_record_id as string,
    planTitle: r.title as string,
    findingText: r.finding_text as string,
    findingState: r.finding_state as string,
    draftedByActorId: r.drafted_by_actor_id as string,
    approvedByActorId: (r.approved_by_actor_id as string | null) ?? null,
    refusedByActorId: (r.refused_by_actor_id as string | null) ?? null,
    refusedReason: (r.refused_reason as string | null) ?? null,
    updatedAt: (r.updated_at as Date).toISOString(),
  }));
}

/**
 * The analysis chain as it stands: plans, the runs made under them, the
 * interpretations of those runs and the findings drawn from those.
 *
 * Every step of this chain had a command and none had a screen, so a
 * plan could be drafted, approved, run against a locked dataset,
 * interpreted and turned into a finding only by someone driving the API
 * directly. Each artefact refers to the one before it by identifier, so
 * without a listing the chain could not even be followed, let alone
 * built.
 *
 * A run carries the manifest hash of the dataset it was made against.
 * That is the point of locking a dataset before analysing it: an
 * interpretation is only about a run, and a run is only about exactly
 * that data.
 *
 * Read under `analysis-plan.draft`, the action that already permits
 * starting the chain.
 */
export async function listAnalysisWork(deps: M13Deps, ctx: RequestContext): Promise<AnalysisWork> {
  const decision = await deps.checkPermission(ctx, {
    action: 'analysis-plan.draft',
    resource: { type: 'AnalysisPlan', id: 'queue', state: 'Any', protectedExistence: false },
  });
  assertAllowed(decision, false);
  return {
    plans: await plans(deps, ''),
    runs: await runs(deps),
    interpretations: await interpretations(deps, ''),
    findings: await findings(deps, ''),
  };
}

export interface AnalysisApprovals {
  plans: AnalysisPlanSummary[];
  interpretations: InterpretationSummary[];
  findings: FindingSummary[];
}

/**
 * What the approver has waiting across the analysis chain.
 *
 * Runs are absent because nobody approves a run: it either happened or it
 * did not, and putting it in a decision queue would suggest a judgement
 * that is not being asked for.
 *
 * Read under `approval-queue.view`, the action the other approver queues
 * already use — not under the three approval actions themselves, which
 * are confirmationRequired and one of which is MFA-tier.
 */
export async function listAnalysisApprovals(deps: M13Deps, ctx: RequestContext): Promise<AnalysisApprovals> {
  const decision = await deps.checkPermission(ctx, {
    action: 'approval-queue.view',
    resource: { type: 'ApprovalQueue', id: 'all', state: 'Active', protectedExistence: false },
  });
  assertAllowed(decision, false);
  return {
    plans: await plans(deps, `WHERE plan_state IN ('Draft', 'In Review')`),
    interpretations: await interpretations(deps, `WHERE i.interpretation_state IN ('Draft', 'In Review')`),
    findings: await findings(deps, `WHERE f.finding_state IN ('Draft', 'In Review')`),
  };
}
