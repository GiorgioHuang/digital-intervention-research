import type { RequestContext } from '@platform/kernel';
import { assertAllowed } from '@platform/policy';
import type { M15Deps } from './commands.js';

export interface PendingApproval {
  approvalRecordId: string;
  artefactType: string;
  artefactId: string;
  artefactVersion: number;
  requestedByActorId: string;
  createdAt: string;
}

/** Open approval requests (approver work queue). */
export async function listPendingApprovals(deps: M15Deps, ctx: RequestContext): Promise<PendingApproval[]> {
  const decision = await deps.checkPermission(ctx, {
    action: 'approval-queue.view',
    resource: { type: 'ApprovalQueue', id: 'all', state: 'Active', protectedExistence: false },
  });
  assertAllowed(decision, false);
  const res = await deps.pool.query(
    `SELECT id, artefact_type, artefact_id, artefact_version, requested_by_actor_id, created_at
       FROM governance_audit.approval_records
      WHERE approval_state = 'Requested'
      ORDER BY created_at ASC`,
  );
  return res.rows.map((r) => ({
    approvalRecordId: r.id as string,
    artefactType: r.artefact_type as string,
    artefactId: r.artefact_id as string,
    artefactVersion: r.artefact_version as number,
    requestedByActorId: r.requested_by_actor_id as string,
    createdAt: (r.created_at as Date).toISOString(),
  }));
}

export interface PendingBreakGlassReview {
  breakGlassId: string;
  executedByActorId: string;
  reason: string;
  scope: string;
  expiresAt: string;
  createdAt: string;
}

/** Break-glass records awaiting their mandatory retrospective review. */
export async function listBreakGlassPendingReview(
  deps: M15Deps,
  ctx: RequestContext,
): Promise<PendingBreakGlassReview[]> {
  const decision = await deps.checkPermission(ctx, {
    action: 'governance-queue.view',
    resource: { type: 'GovernanceQueue', id: 'all', state: 'Active', protectedExistence: false },
  });
  assertAllowed(decision, false);
  const res = await deps.pool.query(
    `SELECT id, executed_by_actor_id, reason, scope, expires_at, created_at
       FROM governance_audit.break_glass_records
      WHERE review_state = 'Pending Review'
      ORDER BY created_at ASC`,
  );
  return res.rows.map((r) => ({
    breakGlassId: r.id as string,
    executedByActorId: r.executed_by_actor_id as string,
    reason: r.reason as string,
    scope: r.scope as string,
    expiresAt: (r.expires_at as Date).toISOString(),
    createdAt: (r.created_at as Date).toISOString(),
  }));
}
