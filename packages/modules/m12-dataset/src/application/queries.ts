import type { RequestContext } from '@platform/kernel';
import { assertAllowed } from '@platform/policy';
import type { M12Deps } from './commands.js';

export interface LockableDatasetVersion {
  datasetVersionId: string;
  datasetDefinitionId: string;
  versionNumber: number;
  manifestHash: string;
  updatedAt: string;
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
    `SELECT id, dataset_definition_id, version_number, manifest_hash, updated_at
       FROM dataset_quality.dataset_versions
      WHERE version_state = 'Quality Reviewed'
      ORDER BY updated_at ASC`,
  );
  return res.rows.map((r) => ({
    datasetVersionId: r.id as string,
    datasetDefinitionId: r.dataset_definition_id as string,
    versionNumber: r.version_number as number,
    manifestHash: r.manifest_hash as string,
    updatedAt: (r.updated_at as Date).toISOString(),
  }));
}
