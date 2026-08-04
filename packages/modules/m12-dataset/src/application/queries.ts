import type { RequestContext } from '@platform/kernel';
import { assertAllowed } from '@platform/policy';
import type { M12Deps } from './commands.js';

export interface LockableDatasetVersion {
  datasetVersionId: string;
  datasetDefinitionId: string;
  versionNumber: number;
  manifestHash: string;
  /**
   * Who approved the definition this version was generated from. Locking
   * is not barred when that is the same person as the locker (decision
   * D-11), but the locker should still be able to see the chain rather
   * than take it on trust.
   */
  definitionApprovedByActorId: string | null;
  updatedAt: string;
}

export interface DefinitionAwaitingApproval {
  datasetDefinitionId: string;
  researchProjectId: string;
  name: string;
  variables: unknown;
  createdByActorId: string;
  createdAt: string;
}

/**
 * Approver work queue: dataset definitions waiting to be approved.
 *
 * Nothing listed them, and a definition has to be approved before any
 * version can be generated from it — so the lock queue further down the
 * chain could never fill through the product at all. A decision screen
 * whose queue cannot be populated is a screen that has never been used.
 *
 * The drafter is returned because approving one's own definition is
 * barred, at the database as well as in the command, and an approver
 * should learn that from the row rather than from a failed submission.
 */
export async function listDefinitionsAwaitingApproval(
  deps: M12Deps,
  ctx: RequestContext,
): Promise<DefinitionAwaitingApproval[]> {
  const decision = await deps.checkPermission(ctx, {
    action: 'approval-queue.view',
    resource: { type: 'ApprovalQueue', id: 'all', state: 'Active', protectedExistence: false },
  });
  assertAllowed(decision, false);
  const res = await deps.pool.query(
    `SELECT id, research_project_id, name, variables, created_by_actor_id, created_at
       FROM dataset_quality.dataset_definitions
      WHERE definition_state IN ('Draft', 'In Review')
      ORDER BY created_at ASC`,
  );
  return res.rows.map((r) => ({
    datasetDefinitionId: r.id as string,
    researchProjectId: r.research_project_id as string,
    name: r.name as string,
    variables: r.variables,
    createdByActorId: r.created_by_actor_id as string,
    createdAt: (r.created_at as Date).toISOString(),
  }));
}

export interface DatasetWorkItem {
  datasetDefinitionId: string;
  name: string;
  definitionState: string;
  /** Null until someone other than the drafter has approved it. */
  approvedByActorId: string | null;
  datasetVersionId: string | null;
  versionNumber: number | null;
  versionState: string | null;
  rowCount: number | null;
  updatedAt: string;
}

/**
 * The dataset work in front of whoever prepares data: definitions and
 * the versions generated from them, with the state each is in.
 *
 * The chain is define, approve, generate, quality-review, lock. Only the
 * last step had a screen, so the four before it could be performed by
 * nobody and the lock queue stayed empty no matter what anyone did.
 *
 * Read under `dataset.define`, the action that already permits starting
 * the chain — if you may do this work, you may see where it has got to.
 * Locked and later states stay in the list, because knowing a version is
 * locked is exactly what stops someone waiting for a step that has
 * already happened.
 */
export async function listDatasetWork(deps: M12Deps, ctx: RequestContext): Promise<DatasetWorkItem[]> {
  const decision = await deps.checkPermission(ctx, {
    action: 'dataset.define',
    resource: { type: 'DatasetDefinition', id: 'queue', state: 'Any', protectedExistence: false },
  });
  assertAllowed(decision, false);
  const res = await deps.pool.query(
    `SELECT d.id AS definition_id, d.name, d.definition_state, d.approved_by_actor_id,
            v.id AS version_id, v.version_number, v.version_state, v.row_count,
            GREATEST(d.updated_at, COALESCE(v.updated_at, d.updated_at)) AS updated_at
       FROM dataset_quality.dataset_definitions d
       LEFT JOIN dataset_quality.dataset_versions v ON v.dataset_definition_id = d.id
      ORDER BY updated_at DESC`,
  );
  return res.rows.map((r) => ({
    datasetDefinitionId: r.definition_id as string,
    name: r.name as string,
    definitionState: r.definition_state as string,
    approvedByActorId: (r.approved_by_actor_id as string | null) ?? null,
    datasetVersionId: (r.version_id as string | null) ?? null,
    versionNumber: (r.version_number as number | null) ?? null,
    versionState: (r.version_state as string | null) ?? null,
    rowCount: (r.row_count as number | null) ?? null,
    updatedAt: (r.updated_at as Date).toISOString(),
  }));
}

/** Approver work queue: quality-reviewed versions eligible for DatasetLock. */
export async function listLockableDatasetVersions(
  deps: M12Deps,
  ctx: RequestContext,
): Promise<LockableDatasetVersion[]> {
  const decision = await deps.checkPermission(ctx, {
    action: 'approval-queue.view',
    resource: { type: 'ApprovalQueue', id: 'all', state: 'Active', protectedExistence: false },
  });
  assertAllowed(decision, false);
  const res = await deps.pool.query(
    `SELECT v.id, v.dataset_definition_id, v.version_number, v.manifest_hash, v.updated_at,
            d.approved_by_actor_id
       FROM dataset_quality.dataset_versions v
       JOIN dataset_quality.dataset_definitions d ON d.id = v.dataset_definition_id
      WHERE v.version_state = 'Quality Reviewed'
      ORDER BY v.updated_at ASC`,
  );
  return res.rows.map((r) => ({
    datasetVersionId: r.id as string,
    datasetDefinitionId: r.dataset_definition_id as string,
    versionNumber: r.version_number as number,
    manifestHash: r.manifest_hash as string,
    definitionApprovedByActorId: r.approved_by_actor_id as string | null,
    updatedAt: (r.updated_at as Date).toISOString(),
  }));
}
