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
import {
  createParticipantQuery,
  registerParticipant,
  setPublicProfile,
  type M02Deps,
} from '@platform/m02-participant';
import {
  approveRelationship,
  createPermissionService,
  proposeRelationship,
  recordConsentDecision,
  revokeRelationship,
  type M03Deps,
} from '@platform/m03-consent-permission';
import { createProviderSimulator, handleProviderCallback, signCallback } from '@platform/m16-integration';
import {
  activateConnection,
  createRelationshipThread,
  endConnection,
  listThreadsForActor,
  activateMatchPreference,
  confirmSend,
  createBlockQuery,
  createMessageDraft,
  createThread,
  generateMatchCandidate,
  listThreads,
  recordDeliveryState,
  recordMatchDecision,
  reviseMessageDraft,
  type M18Deps,
} from '../src/index.js';

const DATABASE_URL =
  process.env['DATABASE_URL'] ?? 'postgres://platform:platform_dev_only@localhost:5432/research_platform';
const SECRET = 'callback_test_secret';

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

// Replay keys are globally unique in the callbacks table; per-run nonces
// keep the suite rerunnable on a populated development database.
const runSuffix = Date.now() % 1_000_000;

describe.skipIf(!dbAvailable)('M18/M16 messaging pipeline (integration)', () => {
  let pool: pg.Pool;
  const clock = new FixedClock('2026-07-30T12:00:00Z');
  let m01: M01Deps, m02: M02Deps, m03: M03Deps, m18: M18Deps;
  let adminId: string, orgId: string, coordId: string;
  let aAcc: string, aId: string, bAcc: string, bId: string;
  let threadId: string, messageId: string;
  let supporterActorId: string;
  // The thread test 1 leaves with words in it, so test 2 can open a newer
  // conversation and check which of the two the list puts first.
  let writtenThread = '';
  const ctx = (actorId: string) => createRequestContext({ actor: { type: 'user', id: actorId } });
  const svcCtx = () => createRequestContext({ actor: { type: 'service-account', id: 'sa_worker' } });

  beforeAll(async () => {
    await migrate({ databaseUrl: DATABASE_URL, direction: 'up' });
    pool = createPool({ connectionString: DATABASE_URL, applicationName: 'messaging-tests' });
    const participants = createParticipantQuery(pool);
    const permissions = createPermissionService({
      pool,
      clock,
      policy: POLICY_V1,
      roleAssignments: createRoleAssignmentQuery(pool),
      participantIdentity: participants,
      blocks: createBlockQuery(pool),
    });
    const checkPermission = permissions.evaluate.bind(permissions);
    m01 = { pool, clock, checkPermission };
    m02 = { pool, clock, checkPermission };
    m03 = { pool, clock, permissions };
    m18 = { pool, clock, checkPermission, participants };

    ({ userAccountId: adminId } = await seedBootstrapAdministrator(pool, clock, { displayName: 'Admin' }));
    ({ organisationId: orgId } = await createOrganisation(m01, ctx(adminId), { name: 'Msg Org' }));
    const adminCtx = createRequestContext({ actor: { type: 'user', id: adminId }, organisationId: orgId });
    ({ userAccountId: coordId } = await createUserAccount(m01, adminCtx, { displayName: 'Coord' }));
    await assignRole(m01, adminCtx, { userAccountId: coordId, role: 'ResearchCoordinator', confirmed: true });
    const mk = async (name: string): Promise<[string, string]> => {
      const { userAccountId } = await createUserAccount(m01, adminCtx, { displayName: name });
      await assignRole(m01, adminCtx, { userAccountId, role: 'Participant', confirmed: true });
      const { participantId } = await registerParticipant(m02, ctx(coordId), { displayName: name, userAccountId });
      for (const scope of ['open-matching', 'participant-messaging']) {
        await recordConsentDecision(m03, ctx(userAccountId), {
          participantId,
          scope,
          decision: 'Granted',
          templateVersion: 'ct_v1',
        });
      }
      await activateMatchPreference(m18, ctx(userAccountId), { participantId, declaredAttributes: {}, confirmed: true });
      return [userAccountId, participantId];
    };
    [aAcc, aId] = await mk('Ann');
    [bAcc, bId] = await mk('Ben');
    // A supporter is an actor with no participant record of their own —
    // which is exactly why their inbox needed its own query.
    ({ userAccountId: supporterActorId } = await createUserAccount(m01, adminCtx, { displayName: 'Sofia' }));
    await assignRole(m01, adminCtx, { userAccountId: supporterActorId, role: 'Supporter', confirmed: true });
  }, 30_000);

  afterAll(async () => {
    await pool?.end();
  });

  it('NEGATIVE thread without CommunicationBasis is refused', async () => {
    await expect(
      createThread(m18, ctx(aAcc), { connectionId: 'conn_nonexistent', creatorParticipantId: aId }),
    ).rejects.toMatchObject({ code: 'COMMUNICATION_BASIS_REQUIRED' });
  });

  it('full formation: match -> mutual acceptance -> connection -> thread', async () => {
    const { matchCandidateId } = await generateMatchCandidate(m18, ctx(coordId), {
      participantAId: aId,
      participantBId: bId,
      explanation: 'shared interests',
    });
    await recordMatchDecision(m18, ctx(aAcc), { matchCandidateId, participantId: aId, expectedCandidateVersion: 1, decision: 'Interested', confirmed: true });
    const { mutualAcceptanceId } = await recordMatchDecision(m18, ctx(bAcc), {
      matchCandidateId, participantId: bId, expectedCandidateVersion: 1, decision: 'Interested', confirmed: true,
    });
    const { connectionId } = await activateConnection(m18, ctx(aAcc), { mutualAcceptanceId: mutualAcceptanceId!, participantId: aId, confirmed: true });
    ({ threadId } = await createThread(m18, ctx(aAcc), { connectionId, creatorParticipantId: aId }));
    expect(threadId).toBeDefined();
  });

  it('draft never sends: lifecycle Draft, delivery Not Submitted, no attempts; DB check blocks delivery on drafts', async () => {
    ({ messageId } = await createMessageDraft(m18, ctx(aAcc), { threadId, senderParticipantId: aId, contentText: 'Hello Ben' }));
    const row = await pool.query(`SELECT lifecycle_state, delivery_state FROM community_social.messages WHERE id = $1`, [messageId]);
    expect(row.rows[0]).toEqual({ lifecycle_state: 'Draft', delivery_state: 'Not Submitted' });
    await expect(
      pool.query(`UPDATE community_social.messages SET delivery_state = 'Queued' WHERE id = $1`, [messageId]),
    ).rejects.toThrow(/check constraint/i);
  });

  it('NEGATIVE stale version / wrong recipients: confirmation must bind exact version and recipient set', async () => {
    await reviseMessageDraft(m18, ctx(aAcc), { messageId, senderParticipantId: aId, contentText: 'Hello Ben, edited' });
    await expect(
      confirmSend(m18, ctx(aAcc), { messageId, senderParticipantId: aId, expectedMessageVersion: 1, recipientIds: [bId], confirmed: true }),
    ).rejects.toMatchObject({ code: 'SEND_CONFIRMATION_MISMATCH' });
    await expect(
      confirmSend(m18, ctx(aAcc), { messageId, senderParticipantId: aId, expectedMessageVersion: 2, recipientIds: ['pt_wrong'], confirmed: true }),
    ).rejects.toMatchObject({ code: 'SEND_CONFIRMATION_MISMATCH' });
  });

  it('confirmed send produces Queued (not Sent/Delivered) with atomic events; edits after confirmation refused', async () => {
    await confirmSend(m18, ctx(aAcc), { messageId, senderParticipantId: aId, expectedMessageVersion: 2, recipientIds: [bId], confirmed: true });
    const row = await pool.query(`SELECT lifecycle_state, delivery_state FROM community_social.messages WHERE id = $1`, [messageId]);
    expect(row.rows[0]).toEqual({ lifecycle_state: 'Queued', delivery_state: 'Queued' });
    for (const evt of ['MessageSendConfirmed', 'MessageQueued']) {
      const n = await pool.query(
        `SELECT count(*)::int AS n FROM platform_kernel.outbox_messages WHERE event_type = $1 AND aggregate_id = $2`,
        [evt, messageId],
      );
      expect(n.rows[0].n).toBe(1);
    }
    await expect(
      reviseMessageDraft(m18, ctx(aAcc), { messageId, senderParticipantId: aId, contentText: 'sneaky edit' }),
    ).rejects.toMatchObject({ code: 'MESSAGE_NOT_DRAFT' });
  });

  let providerReference: string;

  it('provider submission and callbacks: Provider Accepted is NOT Delivered', async () => {
    const delivery = {
      recordDeliveryState: (input: Parameters<typeof recordDeliveryState>[2]) =>
        recordDeliveryState(m18, svcCtx(), input),
    };
    const simulator = createProviderSimulator(delivery);
    ({ providerReference } = await simulator.submit(messageId));

    const accepted = { provider: 'provider-simulator', providerReference, status: 'accepted' as const, timestamp: clock.now().toISOString(), nonce: `n1_${runSuffix}` };
    await handleProviderCallback(pool, delivery, SECRET, { ...accepted, signature: signCallback(SECRET, accepted) });
    let row = await pool.query(`SELECT delivery_state FROM community_social.messages WHERE id = $1`, [messageId]);
    expect(row.rows[0].delivery_state).toBe('Provider Accepted');

    const delivered = { ...accepted, status: 'delivered' as const, nonce: `n2_${runSuffix}` };
    await handleProviderCallback(pool, delivery, SECRET, { ...delivered, signature: signCallback(SECRET, delivered) });
    row = await pool.query(`SELECT delivery_state FROM community_social.messages WHERE id = $1`, [messageId]);
    expect(row.rows[0].delivery_state).toBe('Delivered');
  });

  it('NEGATIVE forged / replayed / unknown-reference callbacks', async () => {
    const delivery = {
      recordDeliveryState: (input: Parameters<typeof recordDeliveryState>[2]) =>
        recordDeliveryState(m18, svcCtx(), input),
    };
    const base = { provider: 'provider-simulator', providerReference, status: 'failed' as const, timestamp: clock.now().toISOString(), nonce: `n3_${runSuffix}` };
    await expect(
      handleProviderCallback(pool, delivery, SECRET, { ...base, signature: signCallback('wrong_secret', base) }),
    ).rejects.toMatchObject({ code: 'PROVIDER_CALLBACK_INVALID' });

    // Replay of an already-processed nonce is an idempotent duplicate.
    const replay = { provider: 'provider-simulator', providerReference, status: 'delivered' as const, timestamp: clock.now().toISOString(), nonce: `n2_${runSuffix}` };
    const result = await handleProviderCallback(pool, delivery, SECRET, { ...replay, signature: signCallback(SECRET, replay) });
    expect(result.outcome).toBe('Duplicate');

    const unknown = { provider: 'provider-simulator', providerReference: 'sim-nonexistent', status: 'delivered' as const, timestamp: clock.now().toISOString(), nonce: `n4_${runSuffix}` };
    await expect(
      handleProviderCallback(pool, delivery, SECRET, { ...unknown, signature: signCallback(SECRET, unknown) }),
    ).rejects.toMatchObject({ code: 'PROVIDER_REFERENCE_UNKNOWN' });
  });

  it('NEGATIVE delivery-state regression refused (Delivered cannot become Provider Accepted)', async () => {
    await expect(
      recordDeliveryState(m18, svcCtx(), { messageId, deliveryState: 'Provider Accepted' }),
    ).rejects.toMatchObject({ code: 'MESSAGE_DELIVERY_STATE_CONFLICT' });
  });

  it('message body never appears in outbox payloads (ADR-034)', async () => {
    const res = await pool.query(
      `SELECT payload::text AS p FROM platform_kernel.outbox_messages WHERE aggregate_id = $1`,
      [messageId],
    );
    for (const r of res.rows) {
      expect(r.p).not.toContain('Hello Ben');
    }
  });

  /**
   * 'Disconnected' was in the connection_state CHECK from the start and
   * nothing could write it, so two people could become connected and had
   * no way to stop being connected. The only exit was to block, and
   * blocking is a safety act that says something about the other person -
   * so an ordinary parting had to be dressed up as an accusation.
   */
  it('either party can end a connection alone, and the threads on it stop being usable', async () => {
    const conn = await pool.query(
      `SELECT id FROM community_social.connections WHERE participant_a_id = $1 OR participant_b_id = $1`,
      [aId],
    );
    const connectionId = conn.rows[0].id as string;

    // Not a party to it - refused before any state is read.
    await expect(
      endConnection(m18, ctx(aAcc), { connectionId, participantId: 'pt_stranger', confirmed: true }),
    ).rejects.toMatchObject({ code: 'AUTHORISATION_DENIED' });

    // The party who wants out does not need the other one's agreement.
    await endConnection(m18, ctx(bAcc), { connectionId, participantId: bId, confirmed: true });
    const after = await pool.query(`SELECT connection_state FROM community_social.connections WHERE id = $1`, [
      connectionId,
    ]);
    expect(after.rows[0].connection_state).toBe('Disconnected');

    // The thread is marked so the list tells the truth: the message
    // commands already refuse when the basis is gone, and a thread left
    // Active would read as ongoing beside a send that always fails.
    const thread = await pool.query(`SELECT thread_state FROM community_social.conversation_threads WHERE id = $1`, [
      threadId,
    ]);
    expect(thread.rows[0].thread_state).toBe('Expired');
    await expect(
      createMessageDraft(m18, ctx(aAcc), { threadId, senderParticipantId: aId, contentText: 'still there?' }),
    ).rejects.toBeDefined();

    // What was already written is not deleted; ending is not erasure.
    const kept = await pool.query(
      `SELECT count(*)::int AS n FROM community_social.messages WHERE thread_id = $1`,
      [threadId],
    );
    expect(kept.rows[0].n).toBeGreaterThan(0);

    await expect(
      endConnection(m18, ctx(bAcc), { connectionId, participantId: bId, confirmed: true }),
    ).rejects.toMatchObject({ code: 'INVALID_STATE_TRANSITION' });
  });


  /**
   * basis_type carried 'AuthorisedRelationship' from the start and nothing
   * could write it: a participant could message a stranger the platform
   * matched them with, but not the family member they themselves approved.
   * The wording for this basis has sat unreachable in the messages screen
   * since it was written.
   *
   * Being trusted to see what someone shares is not the same as being
   * allowed to write to them, so the relationship has to name
   * `relationship.message` separately (D-29).
   */
  it('a relationship only becomes a conversation when it says it may', async () => {
    const { relationshipId } = await proposeRelationship(m03, ctx(coordId), {
      participantId: aId,
      relatedActorId: supporterActorId,
      relationshipType: 'FamilyMember',
      permittedActions: ['participant.view-shared'],
    });
    await approveRelationship(m03, ctx(aAcc), { relationshipId, expectedVersion: 1, confirmed: true });

    // Approved, active, and it does not allow messages — so it is not a
    // basis for one.
    await expect(
      createRelationshipThread(m18, ctx(aAcc), { relationshipId, creatorId: aId }),
    ).rejects.toMatchObject({ code: 'COMMUNICATION_BASIS_REQUIRED' });
  });

  it('the participant opens it, the supporter reads and answers, and revoking stops it', async () => {
    const { relationshipId } = await proposeRelationship(m03, ctx(coordId), {
      participantId: aId,
      relatedActorId: supporterActorId,
      relationshipType: 'FamilyMember',
      permittedActions: ['participant.view-shared', 'relationship.message'],
    });
    await approveRelationship(m03, ctx(aAcc), { relationshipId, expectedVersion: 1, confirmed: true });

    const { threadId: relThread } = await createRelationshipThread(m18, ctx(aAcc), {
      relationshipId,
      creatorId: aId,
    });
    // One conversation per relationship: asking again returns the same one
    // rather than splitting the history in two.
    const again = await createRelationshipThread(m18, ctx(aAcc), { relationshipId, creatorId: aId });
    expect(again.threadId).toBe(relThread);

    // The supporter can find it, which is the part that did not exist.
    const inbox = await listThreadsForActor(m18, ctx(supporterActorId));
    expect(inbox.map((t) => t.threadId)).toContain(relThread);
    expect(inbox[0]?.basisType).toBe('AuthorisedRelationship');

    // And can answer: the relationship is what permits it, not a role.
    const { messageId: reply } = await createMessageDraft(m18, ctx(supporterActorId), {
      threadId: relThread,
      senderParticipantId: supporterActorId,
      contentText: 'I will bring the seedlings on Thursday.',
    });
    // Sending is still sending — a supporter confirms like anybody else.
    await expect(
      confirmSend(m18, ctx(supporterActorId), {
        messageId: reply,
        senderParticipantId: supporterActorId,
        expectedMessageVersion: 1,
        recipientIds: [aId],
        confirmed: false,
      }),
    ).rejects.toMatchObject({ code: 'CONFIRMATION_REQUIRED' });
    await confirmSend(m18, ctx(supporterActorId), {
      messageId: reply,
      senderParticipantId: supporterActorId,
      expectedMessageVersion: 1,
      recipientIds: [aId],
      confirmed: true,
    });

    /*
     * ADR-031 basis re-evaluation, which is the whole reason this is a
     * relationship-gated action rather than a role: the participant taking
     * the permission back stops the conversation at that moment.
     */
    await revokeRelationship(m03, ctx(aAcc), { relationshipId, expectedVersion: 2 });
    await expect(
      createMessageDraft(m18, ctx(supporterActorId), {
        threadId: relThread,
        senderParticipantId: supporterActorId,
        contentText: 'one more thing',
      }),
    ).rejects.toBeDefined();
  });

  /**
   * The supporter thread appeared in the participant's list named "A
   * community member".
   *
   * The other side of a relationship thread is an account, not a
   * participant, so the participant directory missed and the miss came
   * back as the placeholder written for an unidentifiable stranger in a
   * community space. It is wrong twice: a supporter is not a community
   * member, and the placeholder is deliberately identical for everybody,
   * so two approved supporters would produce two rows the participant
   * could not tell apart — on the one conversation where knowing who is
   * writing is the entire point.
   *
   * The query now declines to name what it cannot name. The name itself
   * is resolved above this module, where account names live.
   */
  it('does not describe an approved supporter as a community member', async () => {
    const { relationshipId } = await proposeRelationship(m03, ctx(coordId), {
      participantId: aId,
      relatedActorId: supporterActorId,
      relationshipType: 'FamilyMember',
      permittedActions: ['relationship.message'],
    });
    await approveRelationship(m03, ctx(aAcc), { relationshipId, expectedVersion: 1, confirmed: true });
    const { threadId: relThread } = await createRelationshipThread(m18, ctx(aAcc), {
      relationshipId,
      creatorId: aId,
    });

    const mine = await listThreads(m18, ctx(aAcc), aId);
    const supporterRow = mine.find((t) => t.threadId === relThread);
    expect(supporterRow?.basisType).toBe('AuthorisedRelationship');
    expect(supporterRow?.otherDisplayName).toBeNull();

    /*
     * The peer row. This is the Ann-Ben thread the formation test above
     * built, so it is asserted by name rather than by "not null" — an
     * undefined row would satisfy the weaker form and prove nothing.
     *
     * What a peer is called changed on 2026-09-05: it is the name Ben
     * chose to be shown as, and until he chooses one Ann sees the
     * placeholder. His research record still says 'Ben' and Ann is not
     * shown it, which is the whole of the change (§354, C2 ruling) —
     * asserted with a different public name so the two cannot be
     * confused for each other.
     */
    const peerRow = mine.find((t) => t.basisType === 'ActiveConnection');
    expect(peerRow?.otherDisplayName).toBe('A community member');

    await setPublicProfile(m02, ctx(bAcc), { participantId: bId, chosenName: 'Benny' });
    const named = await listThreads(m18, ctx(aAcc), aId);
    expect(named.find((t) => t.basisType === 'ActiveConnection')?.otherDisplayName).toBe('Benny');
    expect(JSON.stringify(named)).not.toContain('"Ben"');

    /*
     * The supporter's own list still names the participant, and this is
     * the one place the research record may still reach another human:
     * a supporter was invited by this participant, at an address she
     * typed, to help her — they know what she is called, and a list of
     * identical placeholders is exactly the defect this assertion was
     * written for.
     */
    const inbox = await listThreadsForActor(m18, ctx(supporterActorId));
    expect(inbox.find((t) => t.threadId === relThread)?.otherDisplayName).toBe('Ann');

    // And when she does choose a name, her daughter sees the chosen one
    // rather than the record — the public name wins wherever it exists.
    await setPublicProfile(m02, ctx(aAcc), { participantId: aId, chosenName: 'Annie' });
    const afterInbox = await listThreadsForActor(m18, ctx(supporterActorId));
    expect(afterInbox.find((t) => t.threadId === relThread)?.otherDisplayName).toBe('Annie');
  });

  /**
   * The messages screen is drawn as a list of conversations, each row
   * carrying who wrote, when, and roughly what about. The listing
   * supplied none of the three, so the screen could only offer a name and
   * the word "ongoing" — a list of conversations that says nothing about
   * any conversation.
   *
   * The rule the preview has to keep is the one the conversation itself
   * keeps: a draft is nobody's words yet, and somebody else's draft is
   * not even visible. A preview that showed what the thread would not is
   * a leak with a friendly face, and it would be on the screen anybody
   * glancing at the phone sees first.
   */
  it('a conversation row carries when it was last written in, and what was said', async () => {
    const { relationshipId } = await proposeRelationship(m03, ctx(coordId), {
      participantId: bId,
      relatedActorId: supporterActorId,
      relationshipType: 'FamilyMember',
      permittedActions: ['relationship.message'],
    });
    await approveRelationship(m03, ctx(bAcc), { relationshipId, expectedVersion: 1, confirmed: true });
    const { threadId: relThread } = await createRelationshipThread(m18, ctx(bAcc), {
      relationshipId,
      creatorId: bId,
    });

    const rowFor = async (id: string) => (await listThreads(m18, ctx(bAcc), bId)).find((t) => t.threadId === id);

    // Nothing written yet: the row says so on all four rather than
    // inventing a date from when the conversation was opened.
    const empty = await rowFor(relThread);
    expect(empty).toBeDefined();
    expect(empty?.lastMessageAt).toBeNull();
    expect(empty?.lastMessageState).toBeNull();
    expect(empty?.lastMessageFromMe).toBeNull();
    expect(empty?.lastMessagePreview).toBeNull();

    // A message the participant confirmed. It rests at Queued until a
    // delivery callback arrives, and with no provider configured it rests
    // there for good — so this is what an ordinary sent message looks
    // like, and the preview has to carry it.
    const { messageId: mine } = await createMessageDraft(m18, ctx(bAcc), {
      threadId: relThread,
      senderParticipantId: bId,
      contentText: 'The roses came out this week.',
    });
    const drafted = await rowFor(relThread);
    // My own draft: the row admits it exists, and withholds the words,
    // because I have not said them.
    expect(drafted?.lastMessageState).toBe('Draft');
    expect(drafted?.lastMessageFromMe).toBe(true);
    expect(drafted?.lastMessagePreview).toBeNull();
    expect(drafted?.lastMessageAt).not.toBeNull();

    await confirmSend(m18, ctx(bAcc), {
      messageId: mine,
      senderParticipantId: bId,
      expectedMessageVersion: 1,
      recipientIds: [supporterActorId],
      confirmed: true,
    });
    const sent = await rowFor(relThread);
    expect(sent?.lastMessageState).toBe('Queued');
    expect(sent?.lastMessageFromMe).toBe(true);
    expect(sent?.lastMessagePreview).toBe('The roses came out this week.');

    // The supporter's own list of the same conversation: the words are
    // there, and they are not theirs.
    const inbox = await listThreadsForActor(m18, ctx(supporterActorId));
    const theirs = inbox.find((t) => t.threadId === relThread);
    expect(theirs?.lastMessagePreview).toBe('The roses came out this week.');
    expect(theirs?.lastMessageFromMe).toBe(false);

    // The supporter answers, and the row turns around: the words are
    // theirs now, and the participant's list must not claim them as its
    // owner's. A row that says "you wrote" over somebody else's words is
    // a small lie on the screen a person checks first.
    const { messageId: reply } = await createMessageDraft(m18, ctx(supporterActorId), {
      threadId: relThread,
      senderParticipantId: supporterActorId,
      contentText: 'I will come and see them on Sunday.',
    });
    await confirmSend(m18, ctx(supporterActorId), {
      messageId: reply,
      senderParticipantId: supporterActorId,
      expectedMessageVersion: 1,
      recipientIds: [bId],
      confirmed: true,
    });
    const answered = await rowFor(relThread);
    expect(answered?.lastMessagePreview).toBe('I will come and see them on Sunday.');
    expect(answered?.lastMessageFromMe).toBe(false);
    writtenThread = relThread;
  });

  /**
   * Drafts are private to their author (Doc 20 §158), and this screen is
   * where that promise is easiest to break: the other party never opens
   * the conversation, so a preview is the only place the words would
   * appear — and it is the place they would be read fastest.
   */
  it("does not preview, or even date, somebody else's unsent draft", async () => {
    const { relationshipId } = await proposeRelationship(m03, ctx(coordId), {
      participantId: bId,
      relatedActorId: supporterActorId,
      relationshipType: 'Friend',
      permittedActions: ['relationship.message'],
    });
    await approveRelationship(m03, ctx(bAcc), { relationshipId, expectedVersion: 1, confirmed: true });
    const { threadId: quiet } = await createRelationshipThread(m18, ctx(bAcc), {
      relationshipId,
      creatorId: bId,
    });

    await createMessageDraft(m18, ctx(supporterActorId), {
      threadId: quiet,
      senderParticipantId: supporterActorId,
      contentText: 'I have been meaning to tell you something.',
    });

    const row = (await listThreads(m18, ctx(bAcc), bId)).find((t) => t.threadId === quiet);
    expect(row).toBeDefined();
    // Not the words, and not the date either: a timestamp on an otherwise
    // silent conversation says somebody is writing to you.
    expect(row?.lastMessagePreview).toBeNull();
    expect(row?.lastMessageState).toBeNull();
    expect(row?.lastMessageAt).toBeNull();

    // And the author's own list does not preview it either — a supporter
    // has no participant record to compare a sender against, so that
    // side withholds every draft rather than run a comparison that
    // quietly matches nothing.
    const theirs = (await listThreadsForActor(m18, ctx(supporterActorId))).find((t) => t.threadId === quiet);
    expect(theirs?.lastMessagePreview).toBeNull();
    expect(theirs?.lastMessageState).toBeNull();

    /*
     * The list is ordered by when somebody last wrote in a conversation,
     * not by when it was opened — and a conversation nobody has written
     * in yet is ordered by when it was opened, which is the most recent
     * thing that has happened to it.
     *
     * `quiet` was opened after everything in the test above, so it
     * legitimately leads Ben's list right now. Writing in the older
     * conversation is what makes the two orderings disagree, and that
     * disagreement is the only arrangement in which this assertion says
     * anything at all: by creation `quiet` still wins, by last-written it
     * must not.
     */
    expect(writtenThread).not.toBe('');
    const { messageId: later } = await createMessageDraft(m18, ctx(bAcc), {
      threadId: writtenThread,
      senderParticipantId: bId,
      contentText: 'Sunday suits me.',
    });
    await confirmSend(m18, ctx(bAcc), {
      messageId: later,
      senderParticipantId: bId,
      expectedMessageVersion: 1,
      recipientIds: [supporterActorId],
      confirmed: true,
    });

    const mine = await listThreads(m18, ctx(bAcc), bId);
    const at = (id: string) => mine.findIndex((t) => t.threadId === id);
    expect(at(writtenThread)).toBeGreaterThanOrEqual(0);
    expect(at(quiet)).toBeGreaterThan(at(writtenThread));
  });

});

describe.skipIf(dbAvailable)('messaging integration (skipped)', () => {
  it('skipped because no PostgreSQL is reachable', () => {
    expect(dbAvailable).toBe(false);
  });
});
