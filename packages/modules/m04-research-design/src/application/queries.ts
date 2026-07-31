import type { RequestContext } from '@platform/kernel';
import { assertAllowed } from '@platform/policy';
import type { M04Deps } from './commands.js';

export interface ProtocolVersionInReview {
  protocolVersionId: string;
  protocolId: string;
  researchProjectId: string;
  versionNumber: number;
  submittedByActorId: string | null;
  updatedAt: string;
}

/**
 * Approver work queue: protocol versions awaiting review. Includes the
 * submitter so an approver can see up front when separation of duties
 * bars them from deciding.
 */
export async function listProtocolVersionsInReview(
  deps: M04Deps,
  ctx: RequestContext,
): Promise<ProtocolVersionInReview[]> {
  const decision = await deps.checkPermission(ctx, {
    action: 'approval-queue.view',
    resource: { type: 'ApprovalQueue', id: 'all', state: 'Active', protectedExistence: false },
  });
  assertAllowed(decision, false);
  const res = await deps.pool.query(
    `SELECT v.id, v.protocol_id, p.research_project_id, v.version_number, v.submitted_by_actor_id, v.updated_at
       FROM research_design.protocol_versions v
       JOIN research_design.protocols p ON p.id = v.protocol_id
      WHERE v.version_state = 'In Review'
      ORDER BY v.updated_at ASC`,
  );
  return res.rows.map((r) => ({
    protocolVersionId: r.id as string,
    protocolId: r.protocol_id as string,
    researchProjectId: r.research_project_id as string,
    versionNumber: r.version_number as number,
    submittedByActorId: r.submitted_by_actor_id as string | null,
    updatedAt: (r.updated_at as Date).toISOString(),
  }));
}
