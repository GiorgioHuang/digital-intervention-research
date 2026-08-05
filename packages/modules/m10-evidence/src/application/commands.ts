import { createHash } from 'node:crypto';
import { newId, PlatformError, type Clock, type RequestContext } from '@platform/kernel';
import { appendToOutbox, recordAuditEvent, withTransaction, type Pool } from '@platform/database';
import { assertAllowed, type PolicyDecisionResult } from '@platform/policy';
import {
  M10_EVENTS,
  type EvidenceDecisionOutcome,
  type KnowledgePlatformPort,
} from '../contracts/index.js';

export type PermissionCheck = (
  ctx: RequestContext,
  request: {
    action: string;
    resource: { type: string; id: string; state: string; protectedExistence: boolean; researchProjectId?: string };
    confirmed?: boolean;
  },
) => Promise<PolicyDecisionResult>;

export interface M10Deps {
  pool: Pool;
  clock: Clock;
  checkPermission: PermissionCheck;
  knowledgePlatform: KnowledgePlatformPort;
}

const hash = (o: object) => createHash('sha256').update(JSON.stringify(o)).digest('hex');

export async function createEvidenceReview(
  deps: M10Deps,
  ctx: RequestContext,
  input: { researchProjectId: string; question: string },
): Promise<{ evidenceReviewId: string }> {
  const decision = await deps.checkPermission(ctx, {
    action: 'evidence-review.create',
    resource: {
      type: 'EvidenceReview',
      id: 'new',
      state: 'Draft',
      protectedExistence: false,
      researchProjectId: input.researchProjectId,
    },
  });
  assertAllowed(decision, false);

  const evidenceReviewId = newId('er');
  const now = deps.clock.now();
  await withTransaction(deps.pool, async (client) => {
    await client.query(
      `INSERT INTO evidence.evidence_reviews (id, research_project_id, question) VALUES ($1, $2, $3)`,
      [evidenceReviewId, input.researchProjectId, input.question],
    );
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: M10_EVENTS.EvidenceReviewCreated,
      sourceModule: 'M10',
      aggregateType: 'EvidenceReview',
      aggregateId: evidenceReviewId,
      occurredAt: now,
    });
    await recordAuditEvent(client, ctx, {
      action: 'evidence-review.create',
      targetType: 'EvidenceReview',
      targetId: evidenceReviewId,
      occurredAt: now,
      result: 'Succeeded',
      source: 'M10',
      policyVersion: decision.policyVersion,
    });
  });
  return { evidenceReviewId };
}

/**
 * Resolve an external Knowledge Platform resource through the ACL and attach
 * it as a local KnowledgeReference with provenance (source, identifier,
 * version, retrieval time — Doc 0 provenance-by-default).
 */
export async function attachKnowledgeReference(
  deps: M10Deps,
  ctx: RequestContext,
  input: { evidenceReviewId: string; externalIdentifier: string },
): Promise<{ knowledgeReferenceId: string }> {
  const decision = await deps.checkPermission(ctx, {
    action: 'evidence.reference',
    resource: { type: 'KnowledgeReference', id: 'new', state: 'Draft', protectedExistence: false },
  });
  assertAllowed(decision, false);

  const resolved = await deps.knowledgePlatform.resolveReference(input.externalIdentifier);
  const now = deps.clock.now();
  const knowledgeReferenceId = newId('kr');
  await withTransaction(deps.pool, async (client) => {
    await client.query(
      `INSERT INTO evidence.knowledge_references
         (id, external_identifier, title, source_system, external_version, resolution_state, retrieved_at, provenance)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        knowledgeReferenceId,
        input.externalIdentifier,
        resolved?.title ?? input.externalIdentifier,
        resolved?.sourceSystem ?? 'unknown',
        resolved?.externalVersion ?? null,
        resolved === undefined ? 'Resolution Failed' : 'Resolved',
        resolved === undefined ? null : now,
        JSON.stringify(resolved ?? {}),
      ],
    );
    await client.query(
      `INSERT INTO evidence.evidence_review_references (evidence_review_id, knowledge_reference_id)
       VALUES ($1, $2)`,
      [input.evidenceReviewId, knowledgeReferenceId],
    );
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: M10_EVENTS.KnowledgeReferenceCreated,
      sourceModule: 'M10',
      aggregateType: 'KnowledgeReference',
      aggregateId: knowledgeReferenceId,
      occurredAt: now,
    });
    await recordAuditEvent(client, ctx, {
      action: 'evidence.reference',
      targetType: 'KnowledgeReference',
      targetId: knowledgeReferenceId,
      occurredAt: now,
      result: 'Succeeded',
      source: 'M10',
      policyVersion: decision.policyVersion,
    });
  });
  return { knowledgeReferenceId };
}

export async function submitEvidenceReview(deps: M10Deps, ctx: RequestContext, reviewId: string): Promise<void> {
  const decision = await deps.checkPermission(ctx, {
    action: 'evidence-review.submit',
    resource: { type: 'EvidenceReview', id: reviewId, state: 'Draft', protectedExistence: false },
  });
  assertAllowed(decision, false);
  const now = deps.clock.now();
  await withTransaction(deps.pool, async (client) => {
    const res = await client.query(
      `UPDATE evidence.evidence_reviews
          SET review_state = 'In Review', submitted_by_actor_id = $2,
              record_version = record_version + 1, updated_at = $3
        WHERE id = $1 AND review_state = 'Draft'`,
      [reviewId, ctx.actor!.id, now],
    );
    if (res.rowCount !== 1) throw new PlatformError('INVALID_STATE_TRANSITION', 'Review is not in Draft');
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: M10_EVENTS.EvidenceReviewSubmittedForReview,
      sourceModule: 'M10',
      aggregateType: 'EvidenceReview',
      aggregateId: reviewId,
      occurredAt: now,
    });
  });
}

/** Human approval of the review; no automated process may approve (Doc 9 §29). */
export async function approveEvidenceReview(
  deps: M10Deps,
  ctx: RequestContext,
  reviewId: string,
  confirmed: boolean,
): Promise<void> {
  if (ctx.actor?.type !== 'user') {
    throw new PlatformError('AUTHORISATION_DENIED', 'Evidence approvals require an authenticated human');
  }
  const decision = await deps.checkPermission(ctx, {
    action: 'evidence-review.approve',
    resource: { type: 'EvidenceReview', id: reviewId, state: 'In Review', protectedExistence: false },
    confirmed,
  });
  assertAllowed(decision, confirmed);
  const now = deps.clock.now();
  await withTransaction(deps.pool, async (client) => {
    const res = await client.query(
      `UPDATE evidence.evidence_reviews
          SET review_state = 'Approved', approved_by_actor_id = $2,
              record_version = record_version + 1, updated_at = $3
        WHERE id = $1 AND review_state = 'In Review' AND submitted_by_actor_id <> $2`,
      [reviewId, ctx.actor!.id, now],
    );
    if (res.rowCount !== 1) {
      throw new PlatformError('INVALID_STATE_TRANSITION', 'Review not in In Review, or self-approval attempted');
    }
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: M10_EVENTS.EvidenceReviewCompleted,
      sourceModule: 'M10',
      aggregateType: 'EvidenceReview',
      aggregateId: reviewId,
      occurredAt: now,
    });
  });
}

/**
 * Sending an evidence review back.
 *
 * The approval command was the only exit this queue had, so a reviewer who
 * judged a review inadequate could do nothing but leave it sitting there -
 * and the only way to clear a queue was to approve everything in it. The
 * state existed in the schema from the start ('Returned for Revision') and
 * nothing could write it.
 *
 * Refusing is the same authority as approving, so it takes the same
 * permission and the same separation of duties: you cannot send back what
 * you submitted. It takes a reason because the person whose work is sent
 * back has to be able to find out why.
 */
export async function returnEvidenceReviewForRevision(
  deps: M10Deps,
  ctx: RequestContext,
  input: { evidenceReviewId: string; reason: string; confirmed: boolean },
): Promise<void> {
  if (ctx.actor?.type !== 'user') {
    throw new PlatformError('AUTHORISATION_DENIED', 'Evidence decisions require an authenticated human');
  }
  const decision = await deps.checkPermission(ctx, {
    action: 'evidence-review.approve',
    resource: { type: 'EvidenceReview', id: input.evidenceReviewId, state: 'In Review', protectedExistence: false },
    confirmed: input.confirmed,
  });
  assertAllowed(decision, input.confirmed);
  if (input.reason.trim() === '') {
    throw new PlatformError('VALIDATION_ERROR', 'Sending a review back needs a reason');
  }
  const now = deps.clock.now();
  await withTransaction(deps.pool, async (client) => {
    const res = await client.query(
      `UPDATE evidence.evidence_reviews
          SET review_state = 'Returned for Revision', refused_by_actor_id = $2, refused_reason = $3,
              refused_at = $4, record_version = record_version + 1, updated_at = $4
        WHERE id = $1 AND review_state = 'In Review' AND submitted_by_actor_id <> $2`,
      [input.evidenceReviewId, ctx.actor!.id, input.reason.trim(), now],
    );
    if (res.rowCount !== 1) {
      throw new PlatformError('INVALID_STATE_TRANSITION', 'Review not in In Review, or the submitter tried to send back their own');
    }
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: M10_EVENTS.EvidenceReviewReturnedForRevision,
      sourceModule: 'M10',
      aggregateType: 'EvidenceReview',
      aggregateId: input.evidenceReviewId,
      occurredAt: now,
    });
  });
}

/**
 * Refusing an evidence decision. No snapshot is written: a snapshot is the
 * immutable record of what an approved decision rested on, and a refused
 * decision rests on nothing that anyone may cite afterwards.
 */
export async function rejectEvidenceDecision(
  deps: M10Deps,
  ctx: RequestContext,
  input: { evidenceDecisionId: string; reason: string; confirmed: boolean },
): Promise<void> {
  if (ctx.actor?.type !== 'user') {
    throw new PlatformError('AUTHORISATION_DENIED', 'Evidence decisions require an authenticated human');
  }
  const decision = await deps.checkPermission(ctx, {
    action: 'evidence-decision.approve',
    resource: { type: 'EvidenceDecision', id: input.evidenceDecisionId, state: 'Draft', protectedExistence: false },
    confirmed: input.confirmed,
  });
  assertAllowed(decision, input.confirmed);
  if (input.reason.trim() === '') {
    throw new PlatformError('VALIDATION_ERROR', 'Refusing a decision needs a reason');
  }
  const now = deps.clock.now();
  await withTransaction(deps.pool, async (client) => {
    const res = await client.query(
      `UPDATE evidence.evidence_decisions
          SET approval_state = 'Rejected', refused_by_actor_id = $2, refused_reason = $3,
              refused_at = $4, record_version = record_version + 1, updated_at = $4
        WHERE id = $1 AND approval_state IN ('Draft', 'In Review') AND drafted_by_actor_id <> $2`,
      [input.evidenceDecisionId, ctx.actor!.id, input.reason.trim(), now],
    );
    if (res.rowCount !== 1) {
      throw new PlatformError('INVALID_STATE_TRANSITION', 'Decision not refusable, or the drafter tried to refuse their own');
    }
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: M10_EVENTS.EvidenceDecisionRejected,
      sourceModule: 'M10',
      aggregateType: 'EvidenceDecision',
      aggregateId: input.evidenceDecisionId,
      occurredAt: now,
    });
  });
}

export async function draftEvidenceDecision(
  deps: M10Deps,
  ctx: RequestContext,
  input: { evidenceReviewId: string; outcome: EvidenceDecisionOutcome; rationale: string },
): Promise<{ evidenceDecisionId: string }> {
  const decision = await deps.checkPermission(ctx, {
    action: 'evidence-decision.draft',
    resource: { type: 'EvidenceDecision', id: 'new', state: 'Draft', protectedExistence: false },
  });
  assertAllowed(decision, false);

  const evidenceDecisionId = newId('ed');
  const now = deps.clock.now();
  await withTransaction(deps.pool, async (client) => {
    await client.query(
      `INSERT INTO evidence.evidence_decisions (id, evidence_review_id, outcome, rationale, drafted_by_actor_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [evidenceDecisionId, input.evidenceReviewId, input.outcome, input.rationale, ctx.actor!.id],
    );
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: M10_EVENTS.EvidenceDecisionCreated,
      sourceModule: 'M10',
      aggregateType: 'EvidenceDecision',
      aggregateId: evidenceDecisionId,
      occurredAt: now,
    });
  });
  return { evidenceDecisionId };
}

/**
 * Human EvidenceDecision approval, then an immutable EvidenceSnapshot is
 * created in the same transaction (ADR-044: decision + snapshot precede
 * protocol use).
 */
export async function approveEvidenceDecision(
  deps: M10Deps,
  ctx: RequestContext,
  input: { evidenceDecisionId: string; confirmed: boolean },
): Promise<{ evidenceSnapshotId: string }> {
  if (ctx.actor?.type !== 'user') {
    throw new PlatformError('AUTHORISATION_DENIED', 'Evidence approvals require an authenticated human');
  }
  const decision = await deps.checkPermission(ctx, {
    action: 'evidence-decision.approve',
    resource: { type: 'EvidenceDecision', id: input.evidenceDecisionId, state: 'Draft', protectedExistence: false },
    confirmed: input.confirmed,
  });
  assertAllowed(decision, input.confirmed);

  const now = deps.clock.now();
  const evidenceSnapshotId = newId('es');
  await withTransaction(deps.pool, async (client) => {
    const res = await client.query(
      `UPDATE evidence.evidence_decisions
          SET approval_state = 'Approved', approved_by_actor_id = $2, approved_at = $3,
              record_version = record_version + 1, updated_at = $3
        WHERE id = $1 AND approval_state IN ('Draft', 'In Review') AND drafted_by_actor_id <> $2
        RETURNING evidence_review_id, outcome, rationale`,
      [input.evidenceDecisionId, ctx.actor!.id, now],
    );
    const row = res.rows[0];
    if (row === undefined) {
      throw new PlatformError('INVALID_STATE_TRANSITION', 'Decision not approvable, or self-approval attempted');
    }
    const content = {
      evidenceDecisionId: input.evidenceDecisionId,
      evidenceReviewId: row.evidence_review_id,
      outcome: row.outcome,
      rationale: row.rationale,
      approvedAt: now.toISOString(),
    };
    await client.query(
      `INSERT INTO evidence.evidence_snapshots
         (id, snapshot_type, evidence_review_id, evidence_decision_id, content, content_hash, created_by_actor_id)
       VALUES ($1, 'Evidence Decision', $2, $3, $4, $5, $6)`,
      [evidenceSnapshotId, row.evidence_review_id, input.evidenceDecisionId, JSON.stringify(content), hash(content), ctx.actor!.id],
    );
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: M10_EVENTS.EvidenceDecisionApproved,
      sourceModule: 'M10',
      aggregateType: 'EvidenceDecision',
      aggregateId: input.evidenceDecisionId,
      occurredAt: now,
    });
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: M10_EVENTS.EvidenceSnapshotCreated,
      sourceModule: 'M10',
      aggregateType: 'EvidenceSnapshot',
      aggregateId: evidenceSnapshotId,
      occurredAt: now,
    });
    await recordAuditEvent(client, ctx, {
      action: 'evidence-decision.approve',
      targetType: 'EvidenceDecision',
      targetId: input.evidenceDecisionId,
      occurredAt: now,
      result: 'Succeeded',
      source: 'M10',
      policyVersion: decision.policyVersion,
    });
  });
  return { evidenceSnapshotId };
}
