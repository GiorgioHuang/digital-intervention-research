import type { RequestContext } from '@platform/kernel';
import { assertAllowed } from '@platform/policy';
import type { M05Deps } from './commands.js';

export interface EnrolmentSummary {
  enrolmentId: string;
  participantId: string;
  researchProjectId: string;
  protocolVersionId: string;
  enrolmentState: string;
  updatedAt: string;
}

/** Coordinator work list: enrolments, optionally scoped to one project. */
export async function listEnrolments(
  deps: M05Deps,
  ctx: RequestContext,
  filter?: { researchProjectId?: string },
): Promise<EnrolmentSummary[]> {
  const decision = await deps.permissions.evaluate(ctx, {
    action: 'enrolment.view',
    resource: { type: 'EnrolmentQueue', id: 'all', state: 'Active', protectedExistence: false },
  });
  assertAllowed(decision, false);
  const projectId = filter?.researchProjectId;
  const res = await deps.pool.query(
    `SELECT id, participant_id, research_project_id, protocol_version_id, enrolment_state, updated_at
       FROM enrolment.enrolments
      WHERE ($1::text IS NULL OR research_project_id = $1)
      ORDER BY updated_at DESC`,
    [projectId ?? null],
  );
  return res.rows.map((r) => ({
    enrolmentId: r.id as string,
    participantId: r.participant_id as string,
    researchProjectId: r.research_project_id as string,
    protocolVersionId: r.protocol_version_id as string,
    enrolmentState: r.enrolment_state as string,
    updatedAt: (r.updated_at as Date).toISOString(),
  }));
}
