import type { RequestContext } from '@platform/kernel';
import { assertAllowed } from '@platform/policy';
import type { M06Deps } from './commands.js';

export interface InterventionVersionView {
  interventionVersionId: string;
  versionNumber: number;
  versionState: string;
  submittedByActorId: string | null;
  approvedByActorId: string | null;
  approvedAt: string | null;
  recordVersion: number;
  createdAt: string;
}

export interface InterventionView {
  interventionId: string;
  interventionCode: string;
  name: string;
  lifecycleMaturity: string;
  /**
   * Returned verbatim and never dressed up. Nothing in the platform
   * writes either of these: every intervention that exists carries the
   * column defaults, so 'E0' means "no code has ever set this" and not
   * "graded E0". The screen has to say that rather than print a grade
   * nobody awarded.
   */
  evidenceStatus: string;
  evidenceDirection: string;
  versions: InterventionVersionView[];
}

/**
 * The intervention portfolio, which nothing could see.
 *
 * M06 had six routes — create an intervention, add a version, submit it,
 * approve it, activate it, configure it for a project — and not one
 * caller anywhere in the product. There was also no query of any kind, so
 * even an intervention created straight against the API was invisible
 * afterwards: the approver had a decision to make and no way to learn
 * there was anything to decide, and the researcher who submitted a
 * version could not find out what became of it. For a platform whose
 * subject is digital interventions, the interventions were the one thing
 * nobody could look at.
 *
 * Versions come back with their intervention rather than as a separate
 * queue. Which step is available depends on the state the version is
 * already in, and a screen that cannot see the state can only offer every
 * button and let the server refuse most of them.
 */
export async function listInterventions(deps: M06Deps, ctx: RequestContext): Promise<InterventionView[]> {
  const decision = await deps.checkPermission(ctx, {
    action: 'intervention.view',
    resource: { type: 'Intervention', id: 'all', state: 'Active', protectedExistence: false },
  });
  assertAllowed(decision, false);

  const res = await deps.pool.query(
    `SELECT id, intervention_code, name, lifecycle_maturity, evidence_status, evidence_direction
       FROM intervention_portfolio.interventions
      ORDER BY intervention_code ASC`,
  );
  const versions = await deps.pool.query(
    `SELECT id, intervention_id, version_number, version_state, submitted_by_actor_id,
            approved_by_actor_id, approved_at, record_version, created_at
       FROM intervention_portfolio.intervention_versions
      ORDER BY intervention_id ASC, version_number DESC`,
  );
  const byIntervention = new Map<string, InterventionVersionView[]>();
  for (const v of versions.rows) {
    const list = byIntervention.get(v.intervention_id as string) ?? [];
    list.push({
      interventionVersionId: v.id as string,
      versionNumber: v.version_number as number,
      versionState: v.version_state as string,
      submittedByActorId: (v.submitted_by_actor_id as string | null) ?? null,
      approvedByActorId: (v.approved_by_actor_id as string | null) ?? null,
      approvedAt: v.approved_at === null ? null : (v.approved_at as Date).toISOString(),
      recordVersion: v.record_version as number,
      createdAt: (v.created_at as Date).toISOString(),
    });
    byIntervention.set(v.intervention_id as string, list);
  }
  return res.rows.map((r) => ({
    interventionId: r.id as string,
    interventionCode: r.intervention_code as string,
    name: r.name as string,
    lifecycleMaturity: r.lifecycle_maturity as string,
    evidenceStatus: r.evidence_status as string,
    evidenceDirection: r.evidence_direction as string,
    versions: byIntervention.get(r.id as string) ?? [],
  }));
}

export interface InterventionConfigurationView {
  interventionConfigurationId: string;
  researchProjectId: string;
  protocolVersionId: string;
  interventionVersionId: string;
  interventionCode: string;
  interventionName: string;
  versionNumber: number;
  versionState: string;
  configurationState: string;
  createdAt: string;
}

/**
 * Which intervention version a project is running, under which protocol
 * version.
 *
 * This was deliberately left off screen (D-41): the command existed with
 * a route and no caller, nothing read a configuration, and building a
 * screen for it would have added a control that records a decision
 * nothing acts on. The unlock condition written into that decision was
 * that something must actually read one — and recording a delivered
 * session does, because a session cannot say what a participant was
 * exposed to without naming the exact configuration it came from. So
 * this exists now for the same reason it did not before.
 *
 * `configuration_state` is returned verbatim and must not be shown as a
 * lifecycle: it is inserted as 'Draft' and no code has ever moved it, so
 * every configuration in the database reads the same.
 */
export async function listInterventionConfigurations(
  deps: M06Deps,
  ctx: RequestContext,
  researchProjectId?: string,
): Promise<InterventionConfigurationView[]> {
  const decision = await deps.checkPermission(ctx, {
    action: 'intervention.view',
    resource: { type: 'InterventionConfiguration', id: 'all', state: 'Active', protectedExistence: false },
  });
  assertAllowed(decision, false);
  const res = await deps.pool.query(
    `SELECT c.id, c.research_project_id, c.protocol_version_id, c.intervention_version_id,
            c.configuration_state, c.created_at,
            v.version_number, v.version_state, i.intervention_code, i.name
       FROM intervention_portfolio.intervention_configurations c
       JOIN intervention_portfolio.intervention_versions v ON v.id = c.intervention_version_id
       JOIN intervention_portfolio.interventions i ON i.id = v.intervention_id
      ${researchProjectId === undefined ? '' : 'WHERE c.research_project_id = $1'}
      ORDER BY c.created_at DESC`,
    researchProjectId === undefined ? [] : [researchProjectId],
  );
  return res.rows.map((r) => ({
    interventionConfigurationId: r.id as string,
    researchProjectId: r.research_project_id as string,
    protocolVersionId: r.protocol_version_id as string,
    interventionVersionId: r.intervention_version_id as string,
    interventionCode: r.intervention_code as string,
    interventionName: r.name as string,
    versionNumber: r.version_number as number,
    versionState: r.version_state as string,
    configurationState: r.configuration_state as string,
    createdAt: (r.created_at as Date).toISOString(),
  }));
}
