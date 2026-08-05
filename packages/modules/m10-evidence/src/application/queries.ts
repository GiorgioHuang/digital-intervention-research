import type { RequestContext } from '@platform/kernel';
import { assertAllowed } from '@platform/policy';
import type { KnowledgePlatformPort, KnowledgeResource } from '../contracts/index.js';
import type { M10Deps, PermissionCheck } from './commands.js';

export interface M10QueryDeps {
  checkPermission: PermissionCheck;
  knowledgePlatform: KnowledgePlatformPort;
}

/**
 * Permission-gated evidence search through the Knowledge Platform ACL.
 * Read-only: results are ephemeral suggestions — nothing becomes platform
 * state until a human attaches a KnowledgeReference to an EvidenceReview
 * (provenance recorded there, ADR-052). Port failures propagate as
 * DEPENDENCY_UNAVAILABLE rather than an empty result set.
 */
export async function searchKnowledgeEvidence(
  deps: M10QueryDeps,
  ctx: RequestContext,
  query: string,
): Promise<KnowledgeResource[]> {
  const decision = await deps.checkPermission(ctx, {
    action: 'evidence.search',
    resource: { type: 'KnowledgeResource', id: 'external', state: 'Active', protectedExistence: false },
  });
  assertAllowed(decision, false);
  return deps.knowledgePlatform.searchEvidence(query);
}

export interface EvidenceReference {
  knowledgeReferenceId: string;
  externalIdentifier: string;
  title: string;
  sourceSystem: string;
  externalVersion: string | null;
  /** Resolved | Unresolved | Resolution Failed | Source Unavailable. */
  resolutionState: string;
  retrievedAt: string | null;
}

export interface EvidenceReviewSummary {
  evidenceReviewId: string;
  researchProjectId: string;
  question: string;
  reviewState: string;
  submittedByActorId: string | null;
  approvedByActorId: string | null;
  references: EvidenceReference[];
  updatedAt: string;
}

async function loadReviews(deps: M10Deps, where: string, params: unknown[]): Promise<EvidenceReviewSummary[]> {
  const res = await deps.pool.query(
    `SELECT r.id, r.research_project_id, r.question, r.review_state,
            r.submitted_by_actor_id, r.approved_by_actor_id, r.updated_at
       FROM evidence.evidence_reviews r
      ${where}
      ORDER BY r.updated_at DESC`,
    params,
  );
  if (res.rowCount === 0) return [];
  const refs = await deps.pool.query(
    `SELECT rr.evidence_review_id, k.id, k.external_identifier, k.title, k.source_system,
            k.external_version, k.resolution_state, k.retrieved_at
       FROM evidence.evidence_review_references rr
       JOIN evidence.knowledge_references k ON k.id = rr.knowledge_reference_id
      WHERE rr.evidence_review_id = ANY($1::text[])
      ORDER BY k.created_at ASC`,
    [res.rows.map((r) => r.id as string)],
  );
  const byReview = new Map<string, EvidenceReference[]>();
  for (const k of refs.rows) {
    const list = byReview.get(k.evidence_review_id as string) ?? [];
    list.push({
      knowledgeReferenceId: k.id as string,
      externalIdentifier: k.external_identifier as string,
      title: k.title as string,
      sourceSystem: k.source_system as string,
      externalVersion: (k.external_version as string | null) ?? null,
      resolutionState: k.resolution_state as string,
      retrievedAt: k.retrieved_at === null ? null : (k.retrieved_at as Date).toISOString(),
    });
    byReview.set(k.evidence_review_id as string, list);
  }
  return res.rows.map((r) => ({
    evidenceReviewId: r.id as string,
    researchProjectId: r.research_project_id as string,
    question: r.question as string,
    reviewState: r.review_state as string,
    submittedByActorId: (r.submitted_by_actor_id as string | null) ?? null,
    approvedByActorId: (r.approved_by_actor_id as string | null) ?? null,
    references: byReview.get(r.id as string) ?? [],
    updatedAt: (r.updated_at as Date).toISOString(),
  }));
}

/**
 * Evidence reviews being built, with the references attached to each.
 *
 * Searching the knowledge platform was reachable and attaching a
 * reference was reachable, but nothing listed a review — so a review
 * could be started, added to and submitted only by someone tracking
 * identifiers outside the product, and the approval queue at the end of
 * the chain had nothing anyone could get to.
 *
 * Every reference carries its resolution state, because a reference that
 * failed to resolve is stored with the raw identifier as its title and
 * `unknown` as its source. Rendering that beside a resolved one would
 * turn a failed lookup into what looks like a citation, which is the
 * exact opposite of stating the source before the claim.
 *
 * Read under `evidence.reference`, the action that already permits
 * building a review.
 */
export async function listEvidenceWork(deps: M10Deps, ctx: RequestContext): Promise<EvidenceReviewSummary[]> {
  const decision = await deps.checkPermission(ctx, {
    action: 'evidence.reference',
    resource: { type: 'EvidenceReview', id: 'queue', state: 'Any', protectedExistence: false },
  });
  assertAllowed(decision, false);
  return loadReviews(deps, '', []);
}

/**
 * Evidence reviews submitted and waiting for a reviewer.
 *
 * The submitter is returned because approving one's own submission is
 * barred by a database CHECK as well as by the command, and a reviewer
 * should learn that from the row rather than from a refused decision.
 */
export async function listReviewsAwaitingApproval(
  deps: M10Deps,
  ctx: RequestContext,
): Promise<EvidenceReviewSummary[]> {
  const decision = await deps.checkPermission(ctx, {
    // Not `evidence-review.approve`: that action is confirmationRequired,
    // and a read forced to claim a confirmation it never made is a read
    // pretending to be a command.
    action: 'evidence-review.view-queue',
    resource: { type: 'EvidenceReview', id: 'queue', state: 'In Review', protectedExistence: false },
  });
  assertAllowed(decision, false);
  return loadReviews(deps, `WHERE r.review_state = 'In Review'`, []);
}

export interface EvidenceDecisionSummary {
  evidenceDecisionId: string;
  evidenceReviewId: string;
  question: string;
  /** The review's own state — a decision may be drafted before it is approved. */
  reviewState: string;
  outcome: string;
  rationale: string;
  approvalState: string;
  draftedByActorId: string;
  approvedByActorId: string | null;
  /** The immutable snapshot written when the decision was approved. */
  snapshotContentHash: string | null;
  updatedAt: string;
}

async function loadDecisions(
  deps: M10Deps,
  where: string,
): Promise<EvidenceDecisionSummary[]> {
  const res = await deps.pool.query(
    `SELECT d.id, d.evidence_review_id, d.outcome, d.rationale, d.approval_state,
            d.drafted_by_actor_id, d.approved_by_actor_id, d.updated_at,
            r.question, r.review_state, s.content_hash
       FROM evidence.evidence_decisions d
       JOIN evidence.evidence_reviews r ON r.id = d.evidence_review_id
       LEFT JOIN evidence.evidence_snapshots s ON s.evidence_decision_id = d.id
      ${where}
      ORDER BY d.updated_at DESC`,
  );
  return res.rows.map((r) => ({
    evidenceDecisionId: r.id as string,
    evidenceReviewId: r.evidence_review_id as string,
    question: r.question as string,
    reviewState: r.review_state as string,
    outcome: r.outcome as string,
    rationale: r.rationale as string,
    approvalState: r.approval_state as string,
    draftedByActorId: r.drafted_by_actor_id as string,
    approvedByActorId: (r.approved_by_actor_id as string | null) ?? null,
    snapshotContentHash: (r.content_hash as string | null) ?? null,
    updatedAt: (r.updated_at as Date).toISOString(),
  }));
}

/**
 * Evidence decisions and the reviews they are drawn from.
 *
 * The review's own state travels with each decision on purpose. Nothing
 * stops a decision being drafted from a review nobody has approved, and
 * a screen that hid that would let a decision look settled when the
 * evidence under it had not been checked by anyone.
 *
 * Read under `evidence-decision.draft`, the action that already permits
 * writing one.
 */
export async function listDecisionWork(deps: M10Deps, ctx: RequestContext): Promise<EvidenceDecisionSummary[]> {
  const decision = await deps.checkPermission(ctx, {
    action: 'evidence-decision.draft',
    resource: { type: 'EvidenceDecision', id: 'queue', state: 'Any', protectedExistence: false },
  });
  assertAllowed(decision, false);
  return loadDecisions(deps, '');
}

/**
 * Evidence decisions waiting for a second person.
 *
 * Read under `evidence-decision.view-queue` rather than the approval
 * action, which is confirmationRequired — a read forced to claim a
 * confirmation it never made is a read pretending to be a command.
 */
export async function listDecisionsAwaitingApproval(
  deps: M10Deps,
  ctx: RequestContext,
): Promise<EvidenceDecisionSummary[]> {
  const decision = await deps.checkPermission(ctx, {
    action: 'evidence-decision.view-queue',
    resource: { type: 'EvidenceDecision', id: 'queue', state: 'Draft', protectedExistence: false },
  });
  assertAllowed(decision, false);
  return loadDecisions(deps, `WHERE d.approval_state IN ('Draft', 'In Review')`);
}
