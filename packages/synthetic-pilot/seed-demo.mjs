/**
 * Synthetic demo seed for a deployed environment (Doc 19 §2 / ADR-062:
 * SYNTHETIC DATA ONLY — never run this against anything holding real
 * personal data). It creates one organisation, one account per role, two
 * participants with granted consents, a community space with published
 * posts, an active connection with a delivered message, a life-story item
 * with confirmed testimony, and a supporter relationship, then prints the
 * identifiers needed by the dev-header sign-in stub.
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
  changeVisibility,
  confirmTestimony,
  createArchive,
  createItem,
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
function writeJson(participants, spaceId) {
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
    }),
  );
}

function printAccounts(rows, participants, spaceName) {
  console.log('\n=== Demo accounts (dev-header sign-in stub; all synthetic) ===\n');
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
  printAccounts(accounts.rows, participants.rows, space.rows[0]?.name);
  // The demo participants are the ones registered by this seed; the first
  // row by creation time is Ann.
  writeJson(participants.rows, space.rows[0]?.id);
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
    const { userAccountId } = await createUserAccount(base, a, { displayName: name });
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
  );
  writeJson([{ id: annId, display_name: 'Ann', user_account_id: annAcc }], spaceId);
}

main()
  .then(() => pool.end())
  .catch(async (err) => {
    console.error('seed failed:', err);
    await pool.end();
    process.exit(1);
  });
