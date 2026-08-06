import { PlatformError, type RequestContext } from '@platform/kernel';
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

export interface ResearchQuestionView {
  researchQuestionId: string;
  questionText: string;
  questionState: string;
  createdAt: string;
}

export interface ResearchProjectView {
  researchProjectId: string;
  organisationId: string;
  title: string;
  createdByActorId: string;
  createdAt: string;
  questions: ResearchQuestionView[];
}

/**
 * The projects in this organisation, and the questions they ask.
 *
 * `project.view` was granted to the researcher and checked by no code,
 * and nothing anywhere listed a project. A researcher created one, was
 * shown its identifier once in an announcement, and had no way to see it
 * again — every screen downstream then asked them to type that identifier
 * back in from memory. The head of the research chain was the one part of
 * it with no list.
 *
 * `project_state` and `project_phase` are deliberately not returned.
 * Nothing writes either column, so every project carries 'Draft' and
 * 'Design' as defaults; handing them to a screen would put a lifecycle
 * position on a project that nobody set and that no code will ever move.
 *
 * Scoped to the caller's organisation from the request context and never
 * from an argument, for the same reason the account listing is: a listing
 * that takes an organisation identifier is a way of asking which
 * organisations exist.
 */
export async function listResearchProjects(
  deps: M04Deps,
  ctx: RequestContext,
): Promise<ResearchProjectView[]> {
  const decision = await deps.checkPermission(ctx, {
    action: 'project.view',
    resource: { type: 'ResearchProject', id: 'all', state: 'Draft', protectedExistence: false },
  });
  assertAllowed(decision, false);
  const organisationId = ctx.organisationId;
  if (organisationId === undefined) {
    throw new PlatformError('ORGANISATION_CONTEXT_REQUIRED', 'An organisation context is required to list projects');
  }

  const res = await deps.pool.query(
    `SELECT id, organisation_id, title, created_by_actor_id, created_at
       FROM research_design.research_projects
      WHERE organisation_id = $1
      ORDER BY created_at DESC`,
    [organisationId],
  );
  const questions = await deps.pool.query(
    `SELECT q.id, q.research_project_id, q.question_text, q.question_state, q.created_at
       FROM research_design.research_questions q
       JOIN research_design.research_projects p ON p.id = q.research_project_id
      WHERE p.organisation_id = $1
      ORDER BY q.created_at ASC`,
    [organisationId],
  );
  const byProject = new Map<string, ResearchQuestionView[]>();
  for (const q of questions.rows) {
    const list = byProject.get(q.research_project_id as string) ?? [];
    list.push({
      researchQuestionId: q.id as string,
      questionText: q.question_text as string,
      questionState: q.question_state as string,
      createdAt: (q.created_at as Date).toISOString(),
    });
    byProject.set(q.research_project_id as string, list);
  }
  return res.rows.map((p) => ({
    researchProjectId: p.id as string,
    organisationId: p.organisation_id as string,
    title: p.title as string,
    createdByActorId: p.created_by_actor_id as string,
    createdAt: (p.created_at as Date).toISOString(),
    questions: byProject.get(p.id as string) ?? [],
  }));
}
