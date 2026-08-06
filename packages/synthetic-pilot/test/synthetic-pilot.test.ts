/**
 * Synthetic Pilot end-to-end (Doc 18 §210 / MS-13): one governed research
 * cycle from evidence to InterventionDecision-ready Finding, executed with
 * deterministic seed data and simulators. Negative scenarios are covered
 * in the module suites; this file proves the FULL vertical slice composes.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import pg from 'pg';
import { FixedClock, createRequestContext } from '@platform/kernel';
import { createPool, migrate } from '@platform/database';
import { POLICY_V1 } from '@platform/policy';
import { assignRole, createOrganisation, createRoleAssignmentQuery, createUserAccount, seedBootstrapAdministrator, type M01Deps } from '@platform/m01-identity-org';
import { createParticipantQuery, registerParticipant, type M02Deps } from '@platform/m02-participant';
import { createPermissionService, recordConsentDecision, withdrawConsent, type M03Deps } from '@platform/m03-consent-permission';
import { activateProtocolVersion, approveProtocolVersion, createProtocolVersion, createProtocolVersionQuery, createResearchProject, submitProtocolVersion, type M04Deps } from '@platform/m04-research-design';
import { activateEnrolment, enrolParticipant, inviteParticipant, recordEligibilityDecision, startConsentProcess, startScreening, withdrawParticipant, type M05Deps } from '@platform/m05-enrolment';
import { activateInterventionVersion, approveInterventionVersion, createIntervention, createInterventionConfiguration, createInterventionVersion, submitInterventionVersion, type M06Deps } from '@platform/m06-intervention-portfolio';
import { listInterventionSessions, recordInterventionSession, type M07Deps } from '@platform/m07-delivery';
import { recordAssessment, type M08Deps } from '@platform/m08-assessment';
import { approveEvidenceDecision, attachKnowledgeReference, createEvidenceReview, createKnowledgePlatformSimulator, draftEvidenceDecision, submitEvidenceReview, approveEvidenceReview, type M10Deps } from '@platform/m10-evidence';
import { approveDatasetDefinition, completeQualityReview, createDatasetDefinition, generateDatasetVersion, lockDatasetVersion, type M12Deps } from '@platform/m12-dataset';
import { approveAnalysisPlan, approveInterpretation, approveResearchFinding, draftAnalysisPlan, draftInterpretation, draftResearchFinding, runAnalysis, type M13Deps } from '@platform/m13-analysis';
import { createProviderSimulator, handleProviderCallback, signCallback } from '@platform/m16-integration';
import { changeVisibility, confirmTestimony, createArchive, createItem, type M17Deps } from '@platform/m17-life-story';
import { activateConnection, activateMatchPreference, confirmSend, createBlockQuery, createCommunitySpace, createMessageDraft, createThread, generateMatchCandidate, joinCommunity, recordDeliveryState, recordMatchDecision, type M18Deps } from '@platform/m18-community-social';

const DATABASE_URL = process.env['DATABASE_URL'] ?? 'postgres://platform:platform_dev_only@localhost:5432/research_platform';
const SECRET = 'pilot_secret';
async function probe(): Promise<boolean> {
  const c = new pg.Client({ connectionString: DATABASE_URL, connectionTimeoutMillis: 2000 });
  try { await c.connect(); await c.end(); return true; } catch { return false; }
}
const dbAvailable = await probe();

describe.skipIf(!dbAvailable)('Synthetic Pilot: one governed research cycle end to end', () => {
  let pool: pg.Pool;
  const clock = new FixedClock('2026-07-30T09:00:00Z');
  let m01: M01Deps; let deps: { checkPermission: M01Deps['checkPermission'] } & Record<string, unknown>;
  let m02: M02Deps, m03: M03Deps, m04: M04Deps, m05: M05Deps, m06: M06Deps, m07: M07Deps, m08: M08Deps, m10: M10Deps, m12: M12Deps, m13: M13Deps, m17: M17Deps, m18: M18Deps;
  let orgId: string, adminId: string, researcherId: string, approverId: string, reviewerId: string, coordId: string;
  let annAcc: string, annId: string, benAcc: string, benId: string;
  const ctx = (id: string, extras: Record<string, unknown> = {}) => createRequestContext({ actor: { type: 'user', id }, organisationId: orgId, ...extras });
  const mfa = (id: string) => ctx(id, { authStrength: 'mfa' });

  beforeAll(async () => {
    await migrate({ databaseUrl: DATABASE_URL, direction: 'up' });
    pool = createPool({ connectionString: DATABASE_URL, applicationName: 'synthetic-pilot' });
    const participants = createParticipantQuery(pool);
    const permissions = createPermissionService({
      pool, clock, policy: POLICY_V1,
      roleAssignments: createRoleAssignmentQuery(pool),
      participantIdentity: participants,
      blocks: createBlockQuery(pool),
    });
    const checkPermission = permissions.evaluate.bind(permissions);
    const base = { pool, clock, checkPermission };
    m01 = base; m02 = base; m04 = base; m06 = base; m07 = base; m08 = base; m12 = base; m13 = base; m17 = base; m18 = base;
    m03 = { pool, clock, permissions };
    m10 = { ...base, knowledgePlatform: createKnowledgePlatformSimulator() };
    m05 = { pool, clock, permissions, participants, protocolVersions: createProtocolVersionQuery(pool) };
    deps = base;

    ({ userAccountId: adminId } = await seedBootstrapAdministrator(pool, clock, { displayName: 'Pilot Admin' }));
    ({ organisationId: orgId } = await createOrganisation(m01, createRequestContext({ actor: { type: 'user', id: adminId } }), { name: 'Synthetic Pilot Org' }));
    const a = ctx(adminId);
    const mk = async (name: string, role: string, scoped = true) => {
      const { userAccountId } = await createUserAccount(m01, a, { displayName: name });
      await assignRole(m01, a, { userAccountId, role: role as never, ...(scoped ? { organisationId: orgId } : {}), confirmed: true });
      return userAccountId;
    };
    await assignRole(m01, a, { userAccountId: adminId, role: 'OrganisationAdministrator', organisationId: orgId, confirmed: true });
    researcherId = await mk('Rae', 'Researcher');
    approverId = await mk('Avery', 'ResearchApprover');
    reviewerId = await mk('Evan', 'EvidenceReviewer');
    coordId = await mk('Cody', 'ResearchCoordinator', false);
    annAcc = await mk('Ann', 'Participant', false);
    benAcc = await mk('Ben', 'Participant', false);
    ({ participantId: annId } = await registerParticipant(m02, ctx(coordId), { displayName: 'Ann', userAccountId: annAcc }));
    ({ participantId: benId } = await registerParticipant(m02, ctx(coordId), { displayName: 'Ben', userAccountId: benAcc }));
  }, 60_000);

  afterAll(async () => { await pool?.end(); });

  let projectId: string, protocolVersionId: string, configurationId: string;
  let annEnrolment: string, benEnrolment: string;
  let versionId: string, findingId: string;

  it('Stage 0 — evidence to approved active protocol and intervention configuration', async () => {
    const { evidenceReviewId } = await createEvidenceReview(m10, ctx(researcherId), { researchProjectId: 'pre-registration', question: 'Life story + connection feasibility?' });
    await attachKnowledgeReference(m10, ctx(researcherId), { evidenceReviewId, externalIdentifier: 'kp-ref-0001' });
    await submitEvidenceReview(m10, ctx(researcherId), evidenceReviewId);
    await approveEvidenceReview(m10, ctx(reviewerId), evidenceReviewId, true);
    const { evidenceDecisionId } = await draftEvidenceDecision(m10, ctx(researcherId), { evidenceReviewId, outcome: 'Support with Conditions', rationale: 'accessibility safeguards required' });
    const { evidenceSnapshotId } = await approveEvidenceDecision(m10, ctx(reviewerId), { evidenceDecisionId, confirmed: true });
    expect(evidenceSnapshotId).toBeDefined();

    ({ researchProjectId: projectId } = await createResearchProject(m04, ctx(researcherId), { organisationId: orgId, title: 'Synthetic Pilot' }));
    const rctx = ctx(researcherId, { researchProjectId: projectId });
    const v = await createProtocolVersion(m04, rctx, { researchProjectId: projectId, title: 'Pilot Protocol', content: { design: 'single-arm', evidenceSnapshotId } });
    protocolVersionId = v.protocolVersionId;
    await submitProtocolVersion(m04, rctx, protocolVersionId);
    const actx = createRequestContext({ actor: { type: 'user', id: approverId }, organisationId: orgId, researchProjectId: projectId, authStrength: 'mfa' });
    await approveProtocolVersion(m04, actx, protocolVersionId, true);
    await activateProtocolVersion(m04, actx, protocolVersionId, true);

    const { interventionId } = await createIntervention(m06, ctx(researcherId), { interventionCode: `INT-004-SP${Date.now() % 1e6}`, name: 'Life Story' });
    const iv = await createInterventionVersion(m06, ctx(researcherId), { interventionId, content: { components: ['archive', 'connection'] } });
    await submitInterventionVersion(m06, ctx(researcherId), iv.interventionVersionId);
    await approveInterventionVersion(m06, actx, iv.interventionVersionId, true);
    await activateInterventionVersion(m06, actx, iv.interventionVersionId, true);
    ({ interventionConfigurationId: configurationId } = await createInterventionConfiguration(m06, ctx(researcherId), {
      researchProjectId: projectId, protocolVersionId, interventionVersionId: iv.interventionVersionId,
    }));
  });

  it('Stage A — consent, enrolment, private life story with confirmed testimony', async () => {
    const cctx = (_id: string) => createRequestContext({ actor: { type: 'user', id: coordId }, organisationId: orgId, researchProjectId: projectId }) && ctx(coordId, { researchProjectId: projectId });
    const enrol = async (pid: string, acc: string): Promise<string> => {
      const { enrolmentId } = await inviteParticipant(m05, cctx(coordId), { participantId: pid, researchProjectId: projectId, protocolVersionId });
      await startScreening(m05, cctx(coordId), enrolmentId);
      await recordEligibilityDecision(m05, cctx(coordId), { enrolmentId, decision: 'Eligible', reason: 'meets criteria', confirmed: true });
      await startConsentProcess(m05, cctx(coordId), enrolmentId);
      for (const scope of ['study-participation', 'open-matching', 'participant-messaging', 'community-participation']) {
        await recordConsentDecision(m03, ctx(acc), { participantId: pid, scope, decision: 'Granted', templateVersion: 'ct_v1' });
      }
      await enrolParticipant(m05, cctx(coordId), enrolmentId);
      await activateEnrolment(m05, cctx(coordId), enrolmentId);
      return enrolmentId;
    };
    annEnrolment = await enrol(annId, annAcc);
    benEnrolment = await enrol(benId, benAcc);

    const { archiveId } = await createArchive(m17, ctx(annAcc), { participantId: annId });
    const { itemId, versionId: storyVersion } = await createItem(m17, ctx(annAcc), {
      archiveId, title: 'Garden years', contentText: 'AI draft of my gardening story.', sourceType: 'AIDraft',
    });
    await confirmTestimony(m17, ctx(annAcc), { itemId, versionId: storyVersion, confirmed: true });
    await changeVisibility(m17, ctx(annAcc), { itemId, visibility: 'Selected People', confirmed: true });
  });

  it('Stage B/C — community, matching, connection, confirmed message with provider delivery', async () => {
    const { spaceId, ruleVersionId } = await createCommunitySpace(m18, ctx(adminId), { name: 'Pilot Garden', rulesText: 'Be kind.' });
    await joinCommunity(m18, ctx(annAcc), { spaceId, participantId: annId, ruleVersionId });

    for (const [acc, pid] of [[annAcc, annId], [benAcc, benId]] as const) {
      await activateMatchPreference(m18, ctx(acc), { participantId: pid, declaredAttributes: { interests: ['garden'] }, confirmed: true });
    }
    const { matchCandidateId } = await generateMatchCandidate(m18, ctx(coordId), { participantAId: annId, participantBId: benId, explanation: 'Shared gardening interest.' });
    await recordMatchDecision(m18, ctx(annAcc), { matchCandidateId, participantId: annId, expectedCandidateVersion: 1, decision: 'Interested', confirmed: true });
    const { mutualAcceptanceId } = await recordMatchDecision(m18, ctx(benAcc), { matchCandidateId, participantId: benId, expectedCandidateVersion: 1, decision: 'Interested', confirmed: true });
    const { connectionId } = await activateConnection(m18, ctx(annAcc), { mutualAcceptanceId: mutualAcceptanceId!, participantId: annId, confirmed: true });
    const { threadId } = await createThread(m18, ctx(annAcc), { connectionId, creatorParticipantId: annId });
    const { messageId } = await createMessageDraft(m18, ctx(annAcc), { threadId, senderParticipantId: annId, contentText: 'Hello Ben, shall we talk gardens?' });
    await confirmSend(m18, ctx(annAcc), { messageId, senderParticipantId: annId, expectedMessageVersion: 1, recipientIds: [benId], confirmed: true });

    const delivery = { recordDeliveryState: (i: Parameters<typeof recordDeliveryState>[2]) => recordDeliveryState(m18, createRequestContext({ actor: { type: 'service-account', id: 'sa_worker' } }), i) };
    const sim = createProviderSimulator(delivery);
    const { providerReference } = await sim.submit(messageId);
    for (const [status, nonce] of [['accepted', 'sp1'], ['delivered', 'sp2']] as const) {
      const cb = { provider: 'provider-simulator', providerReference, status, timestamp: clock.now().toISOString(), nonce };
      await handleProviderCallback(pool, delivery, SECRET, { ...cb, signature: signCallback(SECRET, cb) });
    }
    const msg = await pool.query(`SELECT delivery_state FROM community_social.messages WHERE id = $1`, [messageId]);
    expect(msg.rows[0].delivery_state).toBe('Delivered');

    await recordInterventionSession(m07, ctx(coordId), { enrolmentId: annEnrolment, interventionConfigurationId: configurationId, exposureState: 'Completed' });

    /*
     * M07 held one command and nothing else — no query, no route, no
     * screen. An intervention could be approved and put into use and
     * nobody could record that a participant had received it, or read
     * back what had been recorded. Delivery was the part of a delivery
     * platform with no way in.
     */
    await recordInterventionSession(m07, ctx(coordId), {
      enrolmentId: annEnrolment, interventionConfigurationId: configurationId, exposureState: 'Partially Received',
    });
    const delivered = await listInterventionSessions(m07, ctx(coordId), annEnrolment);
    expect(delivered.map((d) => d.exposureState)).toContain('Partially Received');
    expect(delivered.every((d) => d.deliveredByActorId === coordId)).toBe(true);

    /*
     * And why the screen shows the exposure and never session_state: the
     * column defaults to 'Completed' and no code has ever written it, so
     * the row that says only part of it reached her also claims the
     * session completed. Printing both would contradict itself on one
     * line.
     */
    const raw = await pool.query(
      `SELECT exposure_state, session_state FROM intervention_delivery.intervention_sessions
        WHERE enrolment_id = $1 AND exposure_state = 'Partially Received'`,
      [annEnrolment],
    );
    expect(raw.rows[0]).toMatchObject({ exposure_state: 'Partially Received', session_state: 'Completed' });

    // Reading is gated: a participant holds no session.record.
    await expect(listInterventionSessions(m07, ctx(annAcc), annEnrolment)).rejects.toBeDefined();
    await recordAssessment(m08, ctx(coordId), {
      enrolmentId: annEnrolment, instrument: 'end-of-pilot-experience', instrumentVersion: 'v1',
      recordState: 'Completed', responses: { meaningfulness: 4, burden: 1 },
    });
  });

  it('Stage D — dataset, human lock, analysis, human-approved finding with full lineage', async () => {
    const rctx = ctx(researcherId, { researchProjectId: projectId });
    const { datasetDefinitionId } = await createDatasetDefinition(m12, rctx, {
      researchProjectId: projectId, name: 'pilot-core', variables: { enrolment_state: 'text', exposure_state: 'text' },
    });
    await approveDatasetDefinition(m12, ctx(approverId), { datasetDefinitionId, confirmed: true });
    ({ datasetVersionId: versionId } = await generateDatasetVersion(m12, rctx, { datasetDefinitionId, sourceDescription: 'freeze', rowCount: 2 }));
    await completeQualityReview(m12, rctx, versionId);
    await lockDatasetVersion(m12, mfa(approverId), { datasetVersionId: versionId, confirmed: true });

    const { analysisPlanId } = await draftAnalysisPlan(m13, rctx, { researchProjectId: projectId, title: 'Feasibility' });
    await approveAnalysisPlan(m13, ctx(approverId), { analysisPlanId, confirmed: true });
    /*
     * The outcome was hardcoded to 'Completed' in the command, so every
     * run on record claimed a clean completion whatever had happened: an
     * analysis that fell over could only be written down as though it
     * had gone perfectly.
     */
    const failed = await runAnalysis(m13, rctx, {
      analysisPlanId, datasetVersionId: versionId, outputs: { error: 'convergence failure' },
      environment: { seed: 7 }, runState: 'Failed',
    });
    const failedRow = await pool.query(
      `SELECT run_state FROM analysis_finding.analysis_runs WHERE id = $1`, [failed.analysisRunId],
    );
    expect(failedRow.rows[0].run_state).toBe('Failed');
    // A failed run analysed nothing, so the version it ran against is
    // still locked rather than being marked analysed because somebody
    // tried.
    const afterFailure = await pool.query(
      `SELECT version_state FROM dataset_quality.dataset_versions WHERE id = $1`, [versionId],
    );
    expect(afterFailure.rows[0].version_state).toBe('Locked');

    const { analysisRunId } = await runAnalysis(m13, rctx, { analysisPlanId, datasetVersionId: versionId, outputs: { completion: 1.0 }, environment: { seed: 7 } });
    const { interpretationRecordId } = await draftInterpretation(m13, rctx, { analysisRunId, interpretationText: 'Both synthetic participants completed the pathway.' });
    await approveInterpretation(m13, ctx(approverId), { interpretationRecordId, confirmed: true });
    ({ researchFindingId: findingId } = await draftResearchFinding(m13, rctx, { interpretationRecordId, findingText: 'Synthetic pilot pathway is executable end to end.' }));
    await approveResearchFinding(m13, mfa(approverId), { researchFindingId: findingId, withLimitations: true, confirmed: true });
    const f = await pool.query(`SELECT finding_state FROM analysis_finding.research_findings WHERE id = $1`, [findingId]);
    expect(f.rows[0].finding_state).toBe('Approved with Limitations');
  });

  it('Scenario 30 — withdrawal propagates: consent withdrawal + study withdrawal end future access', async () => {
    await withdrawConsent(m03, ctx(benAcc), { participantId: benId, scope: 'study-participation', templateVersion: 'ct_v1', confirmed: true });
    const decision = await (m05.permissions).evaluate(ctx(researcherId, { researchProjectId: projectId, purposeCode: 'research-operations' }), {
      action: 'participant.view-assigned',
      resource: { type: 'ParticipantRecord', id: benId, state: 'Active', protectedExistence: true, ownerParticipantId: benId, researchProjectId: projectId },
    });
    expect(decision.outcome).toBe('DenyAndHideExistence');
    await withdrawParticipant(m05, ctx(benAcc), { enrolmentId: benEnrolment, confirmed: true });
    const events = await pool.query(
      `SELECT count(*)::int AS n FROM platform_kernel.outbox_messages WHERE event_type IN ('ConsentWithdrawn', 'ParticipantWithdrawn')`,
    );
    expect(events.rows[0].n).toBeGreaterThanOrEqual(2);
    void deps;
  });
});

describe.skipIf(dbAvailable)('synthetic pilot (skipped)', () => {
  it('skipped because no PostgreSQL is reachable', () => { expect(dbAvailable).toBe(false); });
});
