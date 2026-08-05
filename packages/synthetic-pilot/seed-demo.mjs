/**
 * Synthetic demo seed for a deployed environment (Doc 19 §2 / ADR-062:
 * SYNTHETIC DATA ONLY — never run this against anything holding real
 * personal data). It creates one organisation, one account per role, two
 * participants with granted consents, a community space with published
 * posts, an active connection with a delivered message, a life-story item
 * with confirmed testimony, and a supporter relationship, then prints the
 * identifiers needed by the dev-header sign-in stub.
 *
 * It also walks the research chain end to end — evidence review and
 * decision, dataset definition through to a locked version, analysis plan
 * through to an approved finding, a report version, and an export carried
 * through to delivered — and leaves one item waiting in each decision
 * queue. Those screens were all empty in the deployed demo, which made
 * the work look like nothing had been built; an empty queue also cannot
 * show whether the chain behind it works.
 *
 * Idempotent: if the demo organisation already exists it prints the
 * existing identifiers and changes nothing.
 *
 *   DATABASE_URL=… node packages/synthetic-pilot/seed-demo.mjs
 */
import { writeFileSync } from 'node:fs';
import { SystemClock, createRequestContext } from '@platform/kernel';
import { createPool } from '@platform/database';
import { POLICY_V1 } from '@platform/policy';
import {
  assignRole,
  createOrganisation,
  createRoleAssignmentQuery,
  createUserAccount,
  seedBootstrapAdministrator,
} from '@platform/m01-identity-org';
import { createParticipantQuery, registerParticipant } from '@platform/m02-participant';
import { executeBreakGlass } from '@platform/m15-governance';
import {
  approveProtocolVersion,
  createProtocolVersion,
  createProtocolVersionQuery,
  createResearchProject,
  submitProtocolVersion,
} from '@platform/m04-research-design';
import {
  activateEnrolment,
  enrolParticipant,
  inviteParticipant,
  recordEligibilityDecision,
  startConsentProcess,
  startScreening,
} from '@platform/m05-enrolment';
import {
  approveRelationship,
  createPermissionService,
  proposeRelationship,
  recordConsentDecision,
} from '@platform/m03-consent-permission';
import {
  activateConnection,
  activateMatchPreference,
  confirmSend,
  createBlockQuery,
  createCommunitySpace,
  createMessageDraft,
  createThread,
  draftSocialPost,
  generateMatchCandidate,
  joinCommunity,
  publishSocialPost,
  recordMatchDecision,
} from '@platform/m18-community-social';
import {
  approveEvidenceDecision,
  approveEvidenceReview,
  attachKnowledgeReference,
  createEvidenceReview,
  createKnowledgePlatformSimulator,
  draftEvidenceDecision,
  submitEvidenceReview,
} from '@platform/m10-evidence';
import {
  approveDatasetDefinition,
  completeQualityReview,
  createDatasetDefinition,
  generateDatasetVersion,
  lockDatasetVersion,
} from '@platform/m12-dataset';
import {
  approveAnalysisPlan,
  approveInterpretation,
  approveResearchFinding,
  draftAnalysisPlan,
  draftInterpretation,
  draftResearchFinding,
  runAnalysis,
} from '@platform/m13-analysis';
import {
  approveReportVersion,
  createReport,
  decideExport,
  draftReportVersion,
  generateExportPackage,
  recordExportDelivery,
  requestParticipantExport,
  requestResearchExport,
} from '@platform/m14-reporting';
import {
  changeVisibility,
  confirmTestimony,
  createArchive,
  createItem,
  proposeContribution,
} from '@platform/m17-life-story';

const DATABASE_URL = process.env['DATABASE_URL'];
if (DATABASE_URL === undefined || DATABASE_URL === '') {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const ORG_NAME = 'HADI Demo Organisation (synthetic)';
const pool = createPool({ connectionString: DATABASE_URL, applicationName: 'seed-demo' });

/**
 * Machine-readable summary for follow-up checks (DEMO_JSON_OUT), so a
 * verification step can exercise the deployed API as a seeded participant
 * instead of a human retyping identifiers.
 */
function writeJson(participants, spaceId, organisationId) {
  const out = process.env['DEMO_JSON_OUT'];
  if (out === undefined || out === '') return;
  // Prefer the seeded demo participant by name; a database that also holds
  // rows from other runs must not silently hand back an unrelated one.
  const first = participants.find((p) => p.display_name === 'Ann') ?? participants[0];
  writeFileSync(
    out,
    JSON.stringify({
      participantActorId: first?.user_account_id ?? null,
      participantId: first?.id ?? null,
      spaceId: spaceId ?? null,
      organisationId: organisationId ?? null,
    }),
  );
}

function printAccounts(rows, participants, spaceName, organisationId) {
  console.log('\n=== Demo accounts (dev-header sign-in stub; all synthetic) ===\n');
  // The staff workspace asks for this when signing in: organisation-scoped
  // reads (the administrative participant list) have nothing to scope to
  // without it, so an account list that omits it is not usable on its own.
  if (organisationId !== undefined) console.log(`  Organisation identifier: ${organisationId}\n`);
  for (const r of rows) console.log(`  ${r.role.padEnd(26)} actor id: ${r.id}   (${r.display_name})`);
  console.log('');
  for (const p of participants) {
    console.log(`  Participant ${p.display_name}: actor id ${p.user_account_id} / participant id ${p.id}`);
  }
  if (spaceName !== undefined) console.log(`\n  Community: ${spaceName}`);
  console.log('');
}

async function existingDemo() {
  const org = await pool.query(`SELECT id FROM identity_org.organisations WHERE name = $1`, [ORG_NAME]);
  if (org.rows[0] === undefined) return false;
  const accounts = await pool.query(
    `SELECT DISTINCT ON (u.id) u.id, u.display_name, r.role
       FROM identity_org.user_accounts u
       JOIN identity_org.role_assignments r ON r.user_account_id = u.id AND r.assignment_state = 'Active'
      ORDER BY u.id, r.role`,
  );
  const participants = await pool.query(
    `SELECT id, display_name, user_account_id FROM participant_profile.participants ORDER BY created_at`,
  );
  // The space reported back must be one the demo participant actually
  // belongs to — the feed is member-only, so any other space would make a
  // follow-up check fail for the wrong reason.
  const space = await pool.query(
    `SELECT s.id, s.name
       FROM community_social.community_spaces s
       JOIN community_social.community_memberships m
         ON m.space_id = s.id AND m.membership_state = 'Active'
       JOIN participant_profile.participants p
         ON p.id = m.participant_id AND p.display_name = 'Ann'
      ORDER BY s.created_at DESC
      LIMIT 1`,
  );
  // Listing is database-wide, not filtered to this seed run: on a demo
  // environment that is the whole population, and hiding rows created by
  // other means would misrepresent what is actually there.
  console.log('Demo data already exists; nothing was changed. Accounts currently in the database:');
  printAccounts(accounts.rows, participants.rows, space.rows[0]?.name, org.rows[0].id);
  // The demo participants are the ones registered by this seed; the first
  // row by creation time is Ann.
  writeJson(participants.rows, space.rows[0]?.id, org.rows[0].id);
  return true;
}

async function main() {
  if (await existingDemo()) return;

  const clock = new SystemClock();
  const participantsQuery = createParticipantQuery(pool);
  const permissions = createPermissionService({
    pool,
    clock,
    policy: POLICY_V1,
    roleAssignments: createRoleAssignmentQuery(pool),
    participantIdentity: participantsQuery,
    blocks: createBlockQuery(pool),
  });
  const checkPermission = permissions.evaluate.bind(permissions);
  const base = { pool, clock, checkPermission };
  const m03 = { pool, clock, permissions };
  // M05 reaches the permission service directly rather than through a
  // bound checkPermission, and needs the participant and protocol query
  // ports to refuse an invitation that cites a draft protocol.
  const m05 = {
    pool,
    clock,
    permissions,
    participants: participantsQuery,
    protocolVersions: createProtocolVersionQuery(pool),
  };
  // The evidence module reaches the knowledge platform through its ACL;
  // the simulator is what the deployed demo uses unless configured
  // otherwise, and it resolves kp-ref-0001 and refuses kp-ref-9999.
  const m10 = { ...base, knowledgePlatform: createKnowledgePlatformSimulator() };

  const { userAccountId: adminId } = await seedBootstrapAdministrator(pool, clock, { displayName: 'Admin Alex' });
  const { organisationId: orgId } = await createOrganisation(
    base,
    createRequestContext({ actor: { type: 'user', id: adminId } }),
    { name: ORG_NAME },
  );
  const ctx = (id, extras = {}) =>
    createRequestContext({ actor: { type: 'user', id }, organisationId: orgId, ...extras });
  const a = ctx(adminId);

  await assignRole(base, a, { userAccountId: adminId, role: 'OrganisationAdministrator', organisationId: orgId, confirmed: true });

  // Roles that are scoped to the organisation vs. platform-wide follow the
  // same split the pilot uses; the coordinator and participants are not
  // organisation-scoped so their permission checks do not depend on the
  // organisation header being present.
  const mk = async (name, role, scoped = true) => {
    // The organisation membership is what ties an account to an
    // organisation; without it the account exists but belongs to nobody,
    // and every organisation-scoped listing comes back empty.
    const { userAccountId } = await createUserAccount(base, a, { displayName: name, organisationId: orgId });
    await assignRole(base, a, { userAccountId, role, ...(scoped ? { organisationId: orgId } : {}), confirmed: true });
    return userAccountId;
  };
  const researcherId = await mk('Researcher Rae', 'Researcher');
  const approverId = await mk('Approver Avery', 'ResearchApprover');
  const evidenceReviewerId = await mk('Evidence reviewer Evan', 'EvidenceReviewer');
  const safetyId = await mk('Safety reviewer Sam', 'SafetyReviewer');
  const privacyId = await mk('Privacy reviewer Priya', 'PrivacyReviewer');
  const moderatorId = await mk('Moderator Mia', 'Moderator');
  const coordId = await mk('Coordinator Cody', 'ResearchCoordinator', false);
  const supporterId = await mk('Supporter Sofia', 'Supporter', false);
  const annAcc = await mk('Participant Ann', 'Participant', false);
  const benAcc = await mk('Participant Ben', 'Participant', false);

  const { participantId: annId } = await registerParticipant(base, ctx(coordId), {
    displayName: 'Ann',
    userAccountId: annAcc,
  });
  const { participantId: benId } = await registerParticipant(base, ctx(coordId), {
    displayName: 'Ben',
    userAccountId: benAcc,
  });

  // Consents are granted by the participants themselves (owner-only).
  for (const [acc, pid] of [[annAcc, annId], [benAcc, benId]]) {
    for (const scope of [
      'study-participation',
      'open-matching',
      'participant-messaging',
      'community-participation',
      'supporter-involvement',
      'supporter-contribution',
    ]) {
      await recordConsentDecision(m03, ctx(acc), { participantId: pid, scope, decision: 'Granted', templateVersion: 'ct_v1' });
    }
  }

  // Community: a space with published rules, both participants joined, and
  // one published post each so the feed is not empty on first sign-in.
  const { spaceId, ruleVersionId } = await createCommunitySpace(base, a, {
    name: 'Gardening Corner',
    rulesText: 'Be kind. Respect each other\'s experience. Do not share anyone else\'s private information. Staff review reports against these rules.',
  });
  for (const [acc, pid] of [[annAcc, annId], [benAcc, benId]]) {
    await joinCommunity(base, ctx(acc), { spaceId, participantId: pid, ruleVersionId });
  }
  for (const [acc, pid, text] of [
    [annAcc, annId, 'My tomatoes did well this year — happy to share what I changed.'],
    [benAcc, benId, 'I grow mint on the balcony. It makes a good tea in summer.'],
  ]) {
    const { postId } = await draftSocialPost(base, ctx(acc), { spaceId, participantId: pid, contentText: text });
    await publishSocialPost(base, ctx(acc), { postId, participantId: pid, confirmed: true });
  }

  // Matching -> mutual acceptance -> connection -> a confirmed message, so
  // the Messages screen has a real thread. Delivery stays in its honest
  // post-confirmation state (Queued) — no provider simulation here.
  for (const [acc, pid] of [[annAcc, annId], [benAcc, benId]]) {
    await activateMatchPreference(base, ctx(acc), {
      participantId: pid,
      declaredAttributes: { interests: ['gardening', 'music'] },
      confirmed: true,
    });
  }
  const { matchCandidateId } = await generateMatchCandidate(base, ctx(coordId), {
    participantAId: annId,
    participantBId: benId,
    explanation: 'You both listed gardening as an interest.',
  });
  await recordMatchDecision(base, ctx(annAcc), { matchCandidateId, participantId: annId, expectedCandidateVersion: 1, decision: 'Interested', confirmed: true });
  const { mutualAcceptanceId } = await recordMatchDecision(base, ctx(benAcc), { matchCandidateId, participantId: benId, expectedCandidateVersion: 1, decision: 'Interested', confirmed: true });
  const { connectionId } = await activateConnection(base, ctx(annAcc), { mutualAcceptanceId, participantId: annId, confirmed: true });
  const { threadId } = await createThread(base, ctx(annAcc), { connectionId, creatorParticipantId: annId });
  const { messageId } = await createMessageDraft(base, ctx(annAcc), {
    threadId,
    senderParticipantId: annId,
    contentText: 'Hello Ben — would you like to talk about our gardens?',
  });
  await confirmSend(base, ctx(annAcc), {
    messageId,
    senderParticipantId: annId,
    expectedMessageVersion: 1,
    recipientIds: [benId],
    confirmed: true,
  });

  // Life story: an AI draft confirmed as testimony by its author, so the
  // Draft-vs-Testimony distinction is visible in the deployed app.
  const { archiveId } = await createArchive(base, ctx(annAcc), { participantId: annId });
  const { itemId, versionId } = await createItem(base, ctx(annAcc), {
    archiveId,
    title: 'My years in the garden',
    contentText: 'This text was drafted by AI and is waiting for me to confirm it.',
    sourceType: 'AIDraft',
  });
  await confirmTestimony(base, ctx(annAcc), { itemId, versionId, confirmed: true });
  await changeVisibility(base, ctx(annAcc), { itemId, visibility: 'Selected People', confirmed: true });

  // Supporter relationship, approved by the participant herself.
  const { relationshipId } = await proposeRelationship(m03, ctx(coordId), {
    participantId: annId,
    relatedActorId: supporterId,
    relationshipType: 'FamilyMember',
    permittedActions: ['life-story.contribute'],
  });
  await approveRelationship(m03, ctx(annAcc), { relationshipId, expectedVersion: 1, confirmed: true });

  // Something actually waiting on Ann, so the "Waiting for you" block on
  // Home is not permanently empty in the demo. No part of the story is
  // named, because a supporter writing from their own workspace is not
  // shown the participant's story and cannot name one — accepting it
  // therefore asks Ann where it belongs.
  await proposeContribution(base, ctx(supporterId), {
    archiveId,
    contentText: 'I remember you carrying seedlings up the hill in the rain that spring.',
  });

  // A relationship Ben has not decided on, so the approve path is visible
  // from both sides: Ben sees a decision waiting, Sofia sees that he has
  // not decided.
  await proposeRelationship(m03, ctx(coordId), {
    participantId: benId,
    relatedActorId: supporterId,
    relationshipType: 'Friend',
    permittedActions: ['participant.view-shared'],
  });

  /*
   * The research chain, end to end and then some left waiting.
   *
   * Every one of these screens was empty in the deployed demo until now,
   * which made six increments of work look like nothing had been built —
   * and an empty queue cannot show whether the chain works. Each chain is
   * therefore walked to completion once, and left with one item waiting
   * so the decision screens have something real in them.
   *
   * MFA is asserted where the platform requires it (dataset lock, export
   * decision, finding approval). This is the dev-header stub, not real
   * authentication (ADR-104) — it says what strength the request claims,
   * which is exactly what the deployed demo does too.
   */
  const mfa = (id) => ctx(id, { authStrength: 'mfa' });

  /*
   * A real project and an approved protocol, then two enrolments.
   *
   * The coordinator's workspace is the first tab staff land on and the
   * demo left it completely empty: no enrolment had ever been created, so
   * the chain that the coordinator screen exists to walk had never been
   * walked through the product at all. The protocol decision queue was
   * empty for the same reason.
   *
   * Separation of duties is real here and not decoration - the researcher
   * drafts and submits, the approver approves, and they are different
   * people (ADR-051, enforced again by a database CHECK).
   */
  const { researchProjectId } = await createResearchProject(base, ctx(researcherId), {
    organisationId: orgId,
    title: 'Life story and connectedness in later life',
  });
  const { protocolId, protocolVersionId } = await createProtocolVersion(base, ctx(researcherId), {
    researchProjectId,
    title: 'Pilot protocol',
    content: { summary: 'Participant-controlled life story work, with supporter contributions.' },
  });
  await submitProtocolVersion(base, ctx(researcherId), protocolVersionId);
  await approveProtocolVersion(base, mfa(approverId), protocolVersionId, true);

  // A second version left in review, so the protocol decision queue holds
  // something the approver can actually decide.
  const { protocolVersionId: pendingProtocolVersionId } = await createProtocolVersion(base, ctx(researcherId), {
    researchProjectId,
    protocolId,
    content: { summary: 'Adds a second assessment point at twelve weeks.' },
  });
  await submitProtocolVersion(base, ctx(researcherId), pendingProtocolVersionId);

  // Ann's enrolment walked the whole way, so the states after the first
  // are not hypothetical.
  const { enrolmentId: annEnrolment } = await inviteParticipant(m05, ctx(coordId), {
    participantId: annId,
    researchProjectId,
    protocolVersionId,
  });
  await startScreening(m05, ctx(coordId), annEnrolment);
  await recordEligibilityDecision(m05, ctx(coordId), {
    enrolmentId: annEnrolment,
    decision: 'Eligible',
    reason: 'Within the age range and able to consent for herself.',
    confirmed: true,
  });
  await startConsentProcess(m05, ctx(coordId), annEnrolment);
  await enrolParticipant(m05, ctx(coordId), annEnrolment);
  await activateEnrolment(m05, ctx(coordId), annEnrolment);

  // Ben's left mid-chain at the one point where the platform is waiting
  // for a person rather than for a step: the eligibility decision.
  const { enrolmentId: benEnrolment } = await inviteParticipant(m05, ctx(coordId), {
    participantId: benId,
    researchProjectId,
    protocolVersionId,
  });
  await startScreening(m05, ctx(coordId), benEnrolment);

  // Evidence: one review carried to approved, with a reference that
  // resolved and one that did not, so the honest "not found" state is
  // visible rather than hypothetical.
  const { evidenceReviewId } = await createEvidenceReview(m10, ctx(researcherId), {
    researchProjectId: 'rp_demo',
    question: 'Does participant-controlled life story work improve connectedness?',
  });
  await attachKnowledgeReference(m10, ctx(researcherId), { evidenceReviewId, externalIdentifier: 'kp-ref-0001' });
  await attachKnowledgeReference(m10, ctx(researcherId), { evidenceReviewId, externalIdentifier: 'kp-ref-9999' });
  await submitEvidenceReview(m10, ctx(researcherId), evidenceReviewId);
  await approveEvidenceReview(m10, ctx(evidenceReviewerId), evidenceReviewId, true);

  const { evidenceDecisionId } = await draftEvidenceDecision(m10, ctx(researcherId), {
    evidenceReviewId,
    // The interesting outcome: a finding in its own right, not a failure.
    outcome: 'Conflicting Evidence',
    rationale: 'Two trials point opposite ways and neither is clearly the stronger design.',
  });
  await approveEvidenceDecision(m10, ctx(evidenceReviewerId), { evidenceDecisionId, confirmed: true });

  // Left waiting for the evidence reviewer's queue.
  const { evidenceReviewId: pendingReviewId } = await createEvidenceReview(m10, ctx(researcherId), {
    researchProjectId: 'rp_demo',
    question: 'Do supporter contributions change what participants write about themselves?',
  });
  await attachKnowledgeReference(m10, ctx(researcherId), {
    evidenceReviewId: pendingReviewId,
    externalIdentifier: 'kp-ref-0001',
  });
  await submitEvidenceReview(m10, ctx(researcherId), pendingReviewId);

  // Dataset: definition through to a locked version, which is what the
  // analysis chain needs to exist at all.
  const { datasetDefinitionId } = await createDatasetDefinition(base, ctx(researcherId), {
    researchProjectId: 'rp_demo',
    name: 'pilot-feasibility',
    variables: { enrolment_state: 'text', delivery_state_category: 'text' },
  });
  await approveDatasetDefinition(base, ctx(approverId), { datasetDefinitionId, confirmed: true });
  const { datasetVersionId } = await generateDatasetVersion(base, ctx(researcherId), {
    datasetDefinitionId,
    sourceDescription: 'enrolment and delivery tables as of the demo freeze',
    rowCount: 24,
  });
  await completeQualityReview(base, ctx(researcherId), datasetVersionId);
  await lockDatasetVersion(base, mfa(approverId), { datasetVersionId, confirmed: true });

  // Left waiting for the approver's dataset queue.
  await createDatasetDefinition(base, ctx(researcherId), {
    researchProjectId: 'rp_demo',
    name: 'pilot-messaging',
    variables: { thread_count: 'integer', delivery_state_category: 'text' },
  });

  // Analysis: plan, a run recorded against that locked version, an
  // interpretation and a finding.
  const { analysisPlanId } = await draftAnalysisPlan(base, ctx(researcherId), {
    researchProjectId: 'rp_demo',
    title: 'Feasibility descriptives',
  });
  await approveAnalysisPlan(base, ctx(approverId), { analysisPlanId, confirmed: true });
  const { analysisRunId } = await runAnalysis(base, ctx(researcherId), {
    analysisPlanId,
    datasetVersionId,
    outputs: { summary: '24 enrolments, delivery states even across categories' },
    environment: { note: 'recorded by hand — this platform does not run analyses' },
  });
  const { interpretationRecordId } = await draftInterpretation(base, ctx(researcherId), {
    analysisRunId,
    interpretationText: 'Uptake was even across delivery categories; nothing suggests a site effect.',
  });
  await approveInterpretation(base, ctx(approverId), { interpretationRecordId, confirmed: true });
  const { researchFindingId } = await draftResearchFinding(base, ctx(researcherId), {
    interpretationRecordId,
    findingText: 'The design is feasible at this scale, with the limitations recorded in the interpretation.',
  });
  await approveResearchFinding(base, mfa(approverId), { researchFindingId, confirmed: true });

  // Reports: one approved, one left waiting.
  const { reportId } = await createReport(base, ctx(researcherId), {
    researchProjectId: 'rp_demo',
    title: 'Pilot feasibility report',
    reportType: 'ResearchReport',
  });
  const { reportVersionId } = await draftReportVersion(base, ctx(researcherId), {
    reportId,
    content: { text: 'Feasibility held at this scale. Conflicting evidence on connectedness is recorded separately.' },
  });
  await approveReportVersion(base, ctx(approverId), { reportVersionId, confirmed: true });
  await draftReportVersion(base, ctx(researcherId), {
    reportId,
    content: { text: 'Second version, waiting for someone else to approve it.' },
  });

  // Exports: one research export carried through to delivered, and one
  // request from a participant for a copy of their own information left
  // waiting — the two kinds the decision screen keeps apart.
  const { exportRequestId } = await requestResearchExport(base, ctx(researcherId), {
    purpose: 'Independent statistical check',
    recipient: 'stats-partner',
    sources: [datasetVersionId],
    deIdentification: 'Pseudonymised',
  });
  await decideExport(base, mfa(approverId), { exportRequestId, decision: 'Approved', confirmed: true });
  await generateExportPackage(base, ctx(researcherId), { exportRequestId });
  await recordExportDelivery(base, ctx(researcherId), { exportRequestId, state: 'Delivered' });
  await requestParticipantExport(base, ctx(benAcc), {
    participantId: benId,
    purpose: 'A copy of my own information, requested by me',
    confirmed: true,
  });

  // One emergency-access record left awaiting its review, so the privacy
  // reviewer's queue holds something real. The bootstrap administrator is
  // the only role that may record one and the privacy reviewer is the
  // only role that may review one, which is the separation the rule
  // depends on - they cannot be the same person by role alone.
  await executeBreakGlass(base, mfa(adminId), {
    reason: 'Participant Ann rang the safety line saying she could not reach her own consent page.',
    scope: 'Read the consent projection for Ann directly in the database.',
    expiresAt: new Date(clock.now().getTime() + 4 * 60 * 60 * 1000),
    confirmed: true,
  });

  console.log('\nDemo data created (all synthetic).');
  printAccounts(
    [
      { id: adminId, display_name: 'Admin Alex', role: 'OrganisationAdministrator' },
      { id: researcherId, display_name: 'Researcher Rae', role: 'Researcher' },
      { id: approverId, display_name: 'Approver Avery', role: 'ResearchApprover' },
      { id: evidenceReviewerId, display_name: 'Evidence reviewer Evan', role: 'EvidenceReviewer' },
      { id: safetyId, display_name: 'Safety reviewer Sam', role: 'SafetyReviewer' },
      { id: privacyId, display_name: 'Privacy reviewer Priya', role: 'PrivacyReviewer' },
      { id: moderatorId, display_name: 'Moderator Mia', role: 'Moderator' },
      { id: coordId, display_name: 'Coordinator Cody', role: 'ResearchCoordinator' },
      { id: supporterId, display_name: 'Supporter Sofia', role: 'Supporter' },
    ],
    [
      { id: annId, display_name: 'Ann', user_account_id: annAcc },
      { id: benId, display_name: 'Ben', user_account_id: benAcc },
    ],
    'Gardening Corner',
    orgId,
  );
  writeJson([{ id: annId, display_name: 'Ann', user_account_id: annAcc }], spaceId, orgId);
}

main()
  .then(() => pool.end())
  .catch(async (err) => {
    console.error('seed failed:', err);
    await pool.end();
    process.exit(1);
  });
