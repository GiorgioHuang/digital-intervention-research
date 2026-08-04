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
