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
  /**
   * Constraints already applied to the request. A portability request
   * carries the third-party exclusion here; without it on the queue the
   * approver cannot see a limit that has already been imposed and would
   * have to assume the worst about what is being released.
   */
  restrictions: string;
  requestedByActorId: string;
  createdAt: string;
}

export interface MyExportRequest {
  exportRequestId: string;
  purpose: string;
  requestState: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * A participant's own requests for a copy of their information, with the
 * state each one is actually in.
 *
 * Requesting was owner-permitted from the start and had a route, but
 * nothing in the participant's workspace could reach it and nothing could
 * report back. A request you cannot see the outcome of is indistinguishable
 * from one that was never made: a rejection would look exactly like
 * silence, which is precisely what the delivery-state rules exist to
 * prevent elsewhere on this platform.
 *
 * The deciding approver is deliberately not returned. Who decided is on
 * the audit record; naming them to the requester turns a governance
 * decision into a person to argue with.
 */
export async function listMyExportRequests(
  deps: M14Deps,
  ctx: RequestContext,
  participantId: string,
): Promise<MyExportRequest[]> {
  const decision = await deps.checkPermission(ctx, {
    action: 'export.view-own',
    resource: {
      type: 'ExportRequest',
      id: 'own',
      state: 'Any',
      protectedExistence: true,
      ownerParticipantId: participantId,
    },
  });
  assertAllowed(decision, false);
  const res = await deps.pool.query(
    `SELECT id, purpose, request_state, created_at, updated_at
       FROM reporting_submission.export_requests
      WHERE participant_id = $1
        AND export_type = 'ParticipantPortability'
      ORDER BY created_at DESC`,
    [participantId],
  );
  return res.rows.map((r) => ({
    exportRequestId: r.id as string,
    purpose: r.purpose as string,
    requestState: r.request_state as string,
    createdAt: (r.created_at as Date).toISOString(),
    updatedAt: (r.updated_at as Date).toISOString(),
  }));
}

export interface ExportToCarryOut {
  exportRequestId: string;
  exportType: string;
  purpose: string;
  recipient: string;
  requestState: string;
  manifestHash: string | null;
  updatedAt: string;
}

/**
 * Exports that have been agreed to and now have to be carried out.
 *
 * Approving was the end of the road. Nothing listed an approved request,
 * so the package was never put together and the delivery was never
 * recorded — a participant who asked for a copy of their own information
 * could be told truthfully that it had been agreed to and never hear
 * another thing, because no screen anywhere could take the next step.
 *
 * Read under `export.generate`, the action that already permits carrying
 * one out: if you may do the work, you may see what is waiting to be
 * done. Deciding an export is a different job with a different action,
 * and this queue is not that one.
 *
 * `Received` is deliberately absent. It is the end of the sequence, and
 * leaving finished work in a list of work to do is how a queue stops
 * being read.
 */
export async function listExportsToCarryOut(deps: M14Deps, ctx: RequestContext): Promise<ExportToCarryOut[]> {
  const decision = await deps.checkPermission(ctx, {
    action: 'export.generate',
    resource: { type: 'ExportRequest', id: 'queue', state: 'Approved', protectedExistence: false },
  });
  assertAllowed(decision, false);
  const res = await deps.pool.query(
    `SELECT r.id, r.export_type, r.purpose, r.recipient, r.request_state, r.updated_at, p.manifest_hash
       FROM reporting_submission.export_requests r
       LEFT JOIN reporting_submission.export_packages p ON p.export_request_id = r.id
      WHERE r.request_state IN ('Approved', 'Generated', 'Delivered')
      ORDER BY r.updated_at ASC`,
  );
  return res.rows.map((r) => ({
    exportRequestId: r.id as string,
    exportType: r.export_type as string,
    purpose: r.purpose as string,
    recipient: r.recipient as string,
    requestState: r.request_state as string,
    manifestHash: (r.manifest_hash as string | null) ?? null,
    updatedAt: (r.updated_at as Date).toISOString(),
  }));
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
    `SELECT id, export_type, purpose, recipient, sources, de_identification, restrictions,
            requested_by_actor_id, created_at
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
    restrictions: r.restrictions as string,
    requestedByActorId: r.requested_by_actor_id as string,
    createdAt: (r.created_at as Date).toISOString(),
  }));
}
