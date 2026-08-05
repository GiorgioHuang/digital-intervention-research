import type { RequestContext } from '@platform/kernel';
import { assertAllowed } from '@platform/policy';
import type { M04Deps } from './commands.js';

export interface ProtocolVersionInReview {
  protocolVersionId: string;
  protocolId: string;
  researchProjectId: string;
  versionNumber: number;
  /**
   * The exact content this decision would bind to. RESEARCHER_WORKSPACE
   * §1.4 requires the type, identifier, exact version number and content
   * hash to be visible in the same viewport as the approve control — an
   * approver who cannot see the hash cannot tell whether the version in
   * front of them is the one they read.
   */
  contentHash: string;
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
    `SELECT v.id, v.protocol_id, p.research_project_id, v.version_number, v.content_hash,
            v.submitted_by_actor_id, v.updated_at
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
    contentHash: r.content_hash as string,
    submittedByActorId: r.submitted_by_actor_id as string | null,
    updatedAt: (r.updated_at as Date).toISOString(),
  }));
}

export interface ProtocolVersionSummary {
  protocolVersionId: string;
  protocolId: string;
  researchProjectId: string;
  versionNumber: number;
  versionState: string;
  contentHash: string;
  submittedByActorId: string | null;
  approvedByActorId: string | null;
  refusedByActorId: string | null;
  refusedReason: string | null;
  updatedAt: string;
}

/**
 * What happened to the protocol versions of a project.
 *
 * Nothing listed a researcher's own protocol versions at all. A version
 * could be drafted and submitted and then vanished from every screen: its
 * fate was learned by asking someone. That was already a gap; once
 * refusal existed it became a hole, because a refusal nobody can read is
 * only a disappearance — the reason was being stored for a reader who had
 * no way to reach it.
 *
 * Read under `protocol.draft`, the action that already permits writing
 * one: seeing what became of your own submission is not a separate
 * authority from making it.
 */
export async function listProtocolVersions(
  deps: M04Deps,
  ctx: RequestContext,
  researchProjectId: string,
): Promise<ProtocolVersionSummary[]> {
  const decision = await deps.checkPermission(ctx, {
    action: 'protocol.draft',
    resource: {
      type: 'ProtocolVersion',
      id: 'queue',
      state: 'Any',
      protectedExistence: false,
      researchProjectId,
    },
  });
  assertAllowed(decision, false);
  const res = await deps.pool.query(
    `SELECT v.id, v.protocol_id, p.research_project_id, v.version_number, v.version_state,
            v.content_hash, v.submitted_by_actor_id, v.approved_by_actor_id,
            v.refused_by_actor_id, v.refused_reason, v.updated_at
       FROM research_design.protocol_versions v
       JOIN research_design.protocols p ON p.id = v.protocol_id
      WHERE p.research_project_id = $1
      ORDER BY v.version_number DESC`,
    [researchProjectId],
  );
  return res.rows.map((r) => ({
    protocolVersionId: r.id as string,
    protocolId: r.protocol_id as string,
    researchProjectId: r.research_project_id as string,
    versionNumber: r.version_number as number,
    versionState: r.version_state as string,
    contentHash: r.content_hash as string,
    submittedByActorId: (r.submitted_by_actor_id as string | null) ?? null,
    approvedByActorId: (r.approved_by_actor_id as string | null) ?? null,
    refusedByActorId: (r.refused_by_actor_id as string | null) ?? null,
    refusedReason: (r.refused_reason as string | null) ?? null,
    updatedAt: (r.updated_at as Date).toISOString(),
  }));
}
