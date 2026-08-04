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
import { createParticipantQuery, registerParticipant, type M02Deps } from '@platform/m02-participant';
import { createPermissionService, recordConsentDecision, type M03Deps } from '@platform/m03-consent-permission';
import { createProviderSimulator, handleProviderCallback, signCallback } from '@platform/m16-integration';
import {
  activateConnection,
  activateMatchPreference,
  confirmSend,
  createBlockQuery,
  createMessageDraft,
  createThread,
  generateMatchCandidate,
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
});

describe.skipIf(dbAvailable)('messaging integration (skipped)', () => {
  it('skipped because no PostgreSQL is reachable', () => {
    expect(dbAvailable).toBe(false);
  });
});
