import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import pg from 'pg';
import { FixedClock, createRequestContext } from '@platform/kernel';
import { createPool, migrate } from '@platform/database';
import { POLICY_V1 } from '@platform/policy';
import {
  assignRole,
  createOrganisation,
  createRoleAssignmentQuery,
  createUserAccount,
  seedBootstrapAdministrator,
  type M01Deps,
} from '@platform/m01-identity-org';
import { createPermissionService } from '@platform/m03-consent-permission';
import {
  activateInterventionVersion,
  approveInterventionVersion,
  createIntervention,
  createInterventionConfiguration,
  createInterventionVersion,
  submitInterventionVersion,
  type M06Deps,
} from '@platform/m06-intervention-portfolio';
import {
  approveEvidenceDecision,
  approveEvidenceReview,
  returnEvidenceReviewForRevision,
  rejectEvidenceDecision,
  attachKnowledgeReference,
  createEvidenceReview,
  listDecisionWork,
  listDecisionsAwaitingApproval,
  listEvidenceWork,
  listReviewsAwaitingApproval,
  createKnowledgePlatformSimulator,
  draftEvidenceDecision,
  submitEvidenceReview,
  type M10Deps,
} from '../src/index.js';

const DATABASE_URL =
  process.env['DATABASE_URL'] ?? 'postgres://platform:platform_dev_only@localhost:5432/research_platform';

async function probe(): Promise<boolean> {
  const c = new pg.Client({ connectionString: DATABASE_URL, connectionTimeoutMillis: 2000 });
  try {
    await c.connect();
    await c.end();
    return true;
  } catch {
    return false;
  }
}
const dbAvailable = await probe();

describe.skipIf(!dbAvailable)('M06 intervention portfolio + M10 evidence chain (integration)', () => {
  let pool: pg.Pool;
  const clock = new FixedClock('2026-07-30T12:00:00Z');
  const kp = createKnowledgePlatformSimulator();
  const runSuffix = `${Date.now() % 1_000_000}`;
  let m01: M01Deps, m06: M06Deps, m10: M10Deps;
  let adminId: string, orgId: string, researcherId: string, reviewerId: string, approverId: string;

  const ctx = (actorId: string, extras: Record<string, unknown> = {}) =>
    createRequestContext({ actor: { type: 'user', id: actorId }, organisationId: orgId, ...extras });

  beforeAll(async () => {
    await migrate({ databaseUrl: DATABASE_URL, direction: 'up' });
    pool = createPool({ connectionString: DATABASE_URL, applicationName: 'm10-tests' });
    const permissions = createPermissionService({
      pool,
      clock,
      policy: POLICY_V1,
      roleAssignments: createRoleAssignmentQuery(pool),
    });
    const checkPermission = permissions.evaluate.bind(permissions);
    m01 = { pool, clock, checkPermission };
    m06 = { pool, clock, checkPermission };
    m10 = { pool, clock, checkPermission, knowledgePlatform: kp };

    ({ userAccountId: adminId } = await seedBootstrapAdministrator(pool, clock, { displayName: 'Admin' }));
    ({ organisationId: orgId } = await createOrganisation(m01, createRequestContext({ actor: { type: 'user', id: adminId } }), { name: 'M10 Org' }));
    const adminCtx = ctx(adminId);
    ({ userAccountId: researcherId } = await createUserAccount(m01, adminCtx, { displayName: 'R' }));
    ({ userAccountId: reviewerId } = await createUserAccount(m01, adminCtx, { displayName: 'EV' }));
    ({ userAccountId: approverId } = await createUserAccount(m01, adminCtx, { displayName: 'A' }));
    await assignRole(m01, adminCtx, { userAccountId: researcherId, role: 'Researcher', organisationId: orgId, confirmed: true });
    await assignRole(m01, adminCtx, { userAccountId: reviewerId, role: 'EvidenceReviewer', organisationId: orgId, confirmed: true });
    await assignRole(m01, adminCtx, { userAccountId: approverId, role: 'ResearchApprover', organisationId: orgId, confirmed: true });
  }, 30_000);

  afterAll(async () => {
    await pool?.end();
  });

  let reviewId: string, decisionId: string, snapshotId: string;

  it('evidence chain: review -> KP reference with provenance -> submit -> human approve', async () => {
    ({ evidenceReviewId: reviewId } = await createEvidenceReview(m10, ctx(researcherId), {
      researchProjectId: 'rp_evidence',
      question: 'Does participant-controlled life story work improve connectedness?',
    }));
    const { knowledgeReferenceId } = await attachKnowledgeReference(m10, ctx(researcherId), {
      evidenceReviewId: reviewId,
      externalIdentifier: 'kp-ref-0001',
    });
    const ref = await pool.query(`SELECT * FROM evidence.knowledge_references WHERE id = $1`, [knowledgeReferenceId]);
    expect(ref.rows[0].resolution_state).toBe('Resolved');
    expect(ref.rows[0].external_version).toBe('v3');
    expect(ref.rows[0].provenance.sourceSystem).toBe('knowledge-platform-simulator');

    await submitEvidenceReview(m10, ctx(researcherId), reviewId);
    await approveEvidenceReview(m10, ctx(reviewerId), reviewId, true);
    const review = await pool.query(`SELECT review_state FROM evidence.evidence_reviews WHERE id = $1`, [reviewId]);
    expect(review.rows[0].review_state).toBe('Approved');
  });

  /**
   * Approving was the only exit this queue had. 'Returned for Revision'
   * was in the review_state CHECK from the start and nothing could write
   * it, so a reviewer who judged a review inadequate could do nothing but
   * leave it sitting there - and the only way to clear a queue was to
   * approve everything in it.
   */
  it('a review can be sent back, with a reason, by someone other than its submitter', async () => {
    const { evidenceReviewId } = await createEvidenceReview(m10, ctx(researcherId), {
      researchProjectId: 'rp_evidence',
      question: 'Is there anything behind this at all?',
    });
    await submitEvidenceReview(m10, ctx(researcherId), evidenceReviewId);

    await expect(
      returnEvidenceReviewForRevision(m10, ctx(reviewerId), { evidenceReviewId, reason: '   ', confirmed: true }),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
    // The submitter cannot send back their own. Here the permission check
    // refuses first, because a researcher holds no approval permission at
    // all; the WHERE clause on submitted_by_actor_id is the second line,
    // for anyone who does hold it.
    await expect(
      returnEvidenceReviewForRevision(m10, ctx(researcherId), {
        evidenceReviewId,
        reason: 'on reflection',
        confirmed: true,
      }),
    ).rejects.toMatchObject({ code: 'AUTHORISATION_DENIED' });

    await returnEvidenceReviewForRevision(m10, ctx(reviewerId), {
      evidenceReviewId,
      reason: 'Nothing is attached, so there is nothing to check it against.',
      confirmed: true,
    });
    const row = await pool.query(
      `SELECT review_state, refused_by_actor_id, refused_reason FROM evidence.evidence_reviews WHERE id = $1`,
      [evidenceReviewId],
    );
    expect(row.rows[0].review_state).toBe('Returned for Revision');
    expect(row.rows[0].refused_by_actor_id).toBe(reviewerId);
    expect(row.rows[0].refused_reason).toContain('nothing to check it against');
  });

  it('unresolvable reference is recorded as Resolution Failed, never invented', async () => {
    const { knowledgeReferenceId } = await attachKnowledgeReference(m10, ctx(researcherId), {
      evidenceReviewId: reviewId,
      externalIdentifier: 'kp-ref-9999',
    });
    const ref = await pool.query(`SELECT resolution_state, retrieved_at FROM evidence.knowledge_references WHERE id = $1`, [knowledgeReferenceId]);
    expect(ref.rows[0].resolution_state).toBe('Resolution Failed');
    expect(ref.rows[0].retrieved_at).toBeNull();
  });

  /**
   * Searching worked and attaching a reference worked; nothing listed a
   * review, so the chain had no middle and the reviewer's queue at the
   * end had nothing anyone could reach.
   */
  it('the evidence queues carry what a review rests on, including what could not be found', async () => {
    const { evidenceReviewId } = await createEvidenceReview(m10, ctx(researcherId), {
      researchProjectId: 'rp_evidence',
      question: 'Queue visible?',
    });
    await attachKnowledgeReference(m10, ctx(researcherId), {
      evidenceReviewId,
      externalIdentifier: 'kp-ref-0001',
    });
    await attachKnowledgeReference(m10, ctx(researcherId), {
      evidenceReviewId,
      externalIdentifier: 'kp-ref-9999',
    });

    const work = (await listEvidenceWork(m10, ctx(researcherId))).find(
      (r) => r.evidenceReviewId === evidenceReviewId,
    );
    expect(work?.reviewState).toBe('Draft');
    // A failed lookup travels with its state attached. Without it the
    // screen would render the raw identifier as though it were a
    // citation, which is the failure this module exists to prevent.
    const failed = work?.references.find((k) => k.externalIdentifier === 'kp-ref-9999');
    expect(failed?.resolutionState).toBe('Resolution Failed');
    expect(failed?.sourceSystem).toBe('unknown');
    expect(failed?.retrievedAt).toBeNull();
    const found = work?.references.find((k) => k.externalIdentifier === 'kp-ref-0001');
    expect(found?.resolutionState).toBe('Resolved');
    expect(found?.externalVersion).toBe('v3');

    // A draft is not in the reviewer's queue; submitting puts it there.
    expect(
      (await listReviewsAwaitingApproval(m10, ctx(reviewerId))).map((r) => r.evidenceReviewId),
    ).not.toContain(evidenceReviewId);
    await submitEvidenceReview(m10, ctx(researcherId), evidenceReviewId);
    const waiting = (await listReviewsAwaitingApproval(m10, ctx(reviewerId))).find(
      (r) => r.evidenceReviewId === evidenceReviewId,
    );
    // Approving one's own submission is barred by a database CHECK as
    // well as by the command; the reviewer learns that from the row.
    expect(waiting?.submittedByActorId).toBe(researcherId);
    expect(waiting?.references).toHaveLength(2);

    await approveEvidenceReview(m10, ctx(reviewerId), evidenceReviewId, true);
    expect(
      (await listReviewsAwaitingApproval(m10, ctx(reviewerId))).map((r) => r.evidenceReviewId),
    ).not.toContain(evidenceReviewId);

    // Each queue is read under the action that already permits its work.
    await expect(listEvidenceWork(m10, ctx(reviewerId))).rejects.toMatchObject({ code: 'AUTHORISATION_DENIED' });
    await expect(listReviewsAwaitingApproval(m10, ctx(researcherId))).rejects.toMatchObject({
      code: 'AUTHORISATION_DENIED',
    });
  });

  /**
   * A decision may be written from a review nobody has approved. The
   * command permits it, so the queue reports the review's own state
   * rather than the screen inventing a rule the server does not have.
   */
  it('the decision queues carry the review state and the snapshot hash', async () => {
    const { evidenceReviewId } = await createEvidenceReview(m10, ctx(researcherId), {
      researchProjectId: 'rp_evidence',
      question: 'Conflicting outcome visible?',
    });
    const { evidenceDecisionId } = await draftEvidenceDecision(m10, ctx(researcherId), {
      evidenceReviewId,
      // Conflicting evidence is a first-class outcome, not a failure to
      // reach one.
      outcome: 'Conflicting Evidence',
      rationale: 'Two trials point opposite ways and neither is clearly stronger.',
    });

    const drafted = (await listDecisionWork(m10, ctx(researcherId))).find(
      (d) => d.evidenceDecisionId === evidenceDecisionId,
    );
    expect(drafted?.outcome).toBe('Conflicting Evidence');
    expect(drafted?.reviewState).toBe('Draft');
    expect(drafted?.snapshotContentHash).toBeNull();

    const waiting = (await listDecisionsAwaitingApproval(m10, ctx(reviewerId))).find(
      (d) => d.evidenceDecisionId === evidenceDecisionId,
    );
    expect(waiting?.draftedByActorId).toBe(researcherId);

    await approveEvidenceDecision(m10, ctx(reviewerId), { evidenceDecisionId, confirmed: true });
    // Agreed decisions leave the queue and carry the snapshot that later
    // work cites.
    expect(
      (await listDecisionsAwaitingApproval(m10, ctx(reviewerId))).map((d) => d.evidenceDecisionId),
    ).not.toContain(evidenceDecisionId);
    const agreed = (await listDecisionWork(m10, ctx(researcherId))).find(
      (d) => d.evidenceDecisionId === evidenceDecisionId,
    );
    expect(agreed?.approvalState).toBe('Approved');
    expect(agreed?.snapshotContentHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('NEGATIVE canonical outcomes: the database rejects non-canonical decision outcomes', async () => {
    await expect(
      pool.query(
        `INSERT INTO evidence.evidence_decisions (id, evidence_review_id, outcome, rationale, drafted_by_actor_id)
         VALUES ('ed_bad', $1, 'Approved', 'x', 'a')`,
        [reviewId],
      ),
    ).rejects.toThrow(/check constraint/i);
  });

  it('decision drafted by researcher, approved by a different human; snapshot created atomically and immutable', async () => {
    ({ evidenceDecisionId: decisionId } = await draftEvidenceDecision(m10, ctx(researcherId), {
      evidenceReviewId: reviewId,
      outcome: 'Support with Conditions',
      rationale: 'Beneficial with accessibility safeguards.',
    }));
    ({ evidenceSnapshotId: snapshotId } = await approveEvidenceDecision(m10, ctx(reviewerId), {
      evidenceDecisionId: decisionId,
      confirmed: true,
    }));
    const snap = await pool.query(`SELECT snapshot_type, content FROM evidence.evidence_snapshots WHERE id = $1`, [snapshotId]);
    expect(snap.rows[0].snapshot_type).toBe('Evidence Decision');
    expect(snap.rows[0].content.outcome).toBe('Support with Conditions');

    await expect(
      pool.query(`UPDATE evidence.evidence_snapshots SET content = '{}'::jsonb WHERE id = $1`, [snapshotId]),
    ).rejects.toThrow(/immutable/);
    await expect(
      pool.query(`DELETE FROM evidence.evidence_snapshots WHERE id = $1`, [snapshotId]),
    ).rejects.toThrow(/immutable/);
  });

  /**
   * A snapshot is the immutable record of what an agreed decision rested
   * on. A refused decision rests on nothing anyone may cite afterwards, so
   * refusing must not write one.
   */
  it('refusing an evidence decision writes no snapshot', async () => {
    const { evidenceDecisionId } = await draftEvidenceDecision(m10, ctx(researcherId), {
      evidenceReviewId: reviewId,
      outcome: 'Insufficient Evidence',
      rationale: 'Two small studies and nothing else.',
    });
    await expect(
      rejectEvidenceDecision(m10, ctx(reviewerId), { evidenceDecisionId, reason: ' ', confirmed: true }),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
    await rejectEvidenceDecision(m10, ctx(reviewerId), {
      evidenceDecisionId,
      reason: 'The rationale does not follow from the references attached.',
      confirmed: true,
    });
    const row = await pool.query(
      `SELECT approval_state, refused_by_actor_id, refused_reason FROM evidence.evidence_decisions WHERE id = $1`,
      [evidenceDecisionId],
    );
    expect(row.rows[0].approval_state).toBe('Rejected');
    expect(row.rows[0].refused_reason).toContain('does not follow from the references');
    const snaps = await pool.query(
      `SELECT count(*)::int AS n FROM evidence.evidence_snapshots WHERE evidence_decision_id = $1`,
      [evidenceDecisionId],
    );
    expect(snaps.rows[0].n).toBe(0);
  });

  it('NEGATIVE self-approval: drafter cannot approve their own EvidenceDecision', async () => {
    const { evidenceDecisionId } = await draftEvidenceDecision(m10, ctx(reviewerId), {
      evidenceReviewId: reviewId,
      outcome: 'Research Required',
      rationale: 'gap identified',
    });
    await expect(
      approveEvidenceDecision(m10, ctx(reviewerId), { evidenceDecisionId, confirmed: true }),
    ).rejects.toMatchObject({ code: 'INVALID_STATE_TRANSITION' });
  });

  it('NEGATIVE automation: a service account cannot approve an EvidenceDecision', async () => {
    const { evidenceDecisionId } = await draftEvidenceDecision(m10, ctx(researcherId), {
      evidenceReviewId: reviewId,
      outcome: 'Support',
      rationale: 'x',
    });
    await expect(
      approveEvidenceDecision(
        m10,
        createRequestContext({ actor: { type: 'service-account', id: 'sa_bot' }, organisationId: orgId }),
        { evidenceDecisionId, confirmed: true },
      ),
    ).rejects.toMatchObject({ code: 'AUTHORISATION_DENIED' });
  });

  let interventionVersionId: string;

  it('intervention: stable identity + immutable approved version + single active', async () => {
    const { interventionId } = await createIntervention(m06, ctx(researcherId), {
      interventionCode: `INT-004-${runSuffix}`,
      name: 'Life Story and Participant-Controlled Personal Archive',
    });
    ({ interventionVersionId } = await createInterventionVersion(m06, ctx(researcherId), {
      interventionId,
      content: { components: ['archive', 'prompts', 'sharing-controls'] },
    }));
    await submitInterventionVersion(m06, ctx(researcherId), interventionVersionId);
    const approverCtx = createRequestContext({
      actor: { type: 'user', id: approverId },
      organisationId: orgId,
      authStrength: 'mfa',
    });
    await approveInterventionVersion(m06, approverCtx, interventionVersionId, true);
    await activateInterventionVersion(m06, approverCtx, interventionVersionId, true);

    await expect(
      pool.query(
        `UPDATE intervention_portfolio.intervention_versions SET content = '{}'::jsonb, content_hash = 'x' WHERE id = $1`,
        [interventionVersionId],
      ),
    ).rejects.toThrow(/immutable/);
  });

  it('NEGATIVE draft binding: configuration cannot reference a non-approved intervention version', async () => {
    const { interventionId } = await createIntervention(m06, ctx(researcherId), {
      interventionCode: `INT-009-${runSuffix}`,
      name: 'Ability-Adaptive Onboarding',
    });
    const draft = await createInterventionVersion(m06, ctx(researcherId), { interventionId, content: { v: 1 } });
    await expect(
      createInterventionConfiguration(m06, ctx(researcherId), {
        researchProjectId: 'rp_evidence',
        protocolVersionId: 'pv_x',
        interventionVersionId: draft.interventionVersionId,
      }),
    ).rejects.toMatchObject({ code: 'RESOURCE_STATE_BLOCKED' });
  });

  it('configuration binds exact approved versions (lineage)', async () => {
    const { interventionConfigurationId } = await createInterventionConfiguration(m06, ctx(researcherId), {
      researchProjectId: 'rp_evidence',
      protocolVersionId: 'pv_x',
      interventionVersionId,
      settings: { aiLayer: 'draft-only' },
    });
    const row = await pool.query(
      `SELECT intervention_version_id FROM intervention_portfolio.intervention_configurations WHERE id = $1`,
      [interventionConfigurationId],
    );
    expect(row.rows[0].intervention_version_id).toBe(interventionVersionId);
  });
});

describe.skipIf(dbAvailable)('M06+M10 integration (skipped)', () => {
  it('skipped because no PostgreSQL is reachable', () => {
    expect(dbAvailable).toBe(false);
  });
});
