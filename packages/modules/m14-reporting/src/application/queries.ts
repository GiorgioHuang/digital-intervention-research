import type { RequestContext } from '@platform/kernel';
import { assertAllowed } from '@platform/policy';
import type { M14Deps } from './commands.js';

export interface PendingExportRequest {
  exportRequestId: string;
  exportType: string;
  purpose: string;
  recipient: string;
  sources: unknown;
  deIdentification: string;
  requestedByActorId: string;
  createdAt: string;
}

/** Approver work queue: export requests awaiting a decision. */
export async function listPendingExportRequests(
  deps: M14Deps,
  ctx: RequestContext,
): Promise<PendingExportRequest[]> {
  const decision = await deps.checkPermission(ctx, {
    action: 'approval-queue.view',
    resource: { type: 'ApprovalQueue', id: 'all', state: 'Active', protectedExistence: false },
  });
  assertAllowed(decision, false);
  const res = await deps.pool.query(
    `SELECT id, export_type, purpose, recipient, sources, de_identification, requested_by_actor_id, created_at
       FROM reporting_submission.export_requests
      WHERE request_state = 'Requested'
      ORDER BY created_at ASC`,
  );
  return res.rows.map((r) => ({
    exportRequestId: r.id as string,
    exportType: r.export_type as string,
    purpose: r.purpose as string,
    recipient: r.recipient as string,
    sources: r.sources,
    deIdentification: r.de_identification as string,
    requestedByActorId: r.requested_by_actor_id as string,
    createdAt: (r.created_at as Date).toISOString(),
  }));
}
