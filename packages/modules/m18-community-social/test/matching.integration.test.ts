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
import {
  activateConnection,
  activateMatchPreference,
  createBlock,
  createBlockQuery,
  createConnectionRequest,
  generateMatchCandidate,
  recordMatchDecision,
  type M18Deps,
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

describe.skipIf(!dbAvailable)('M18 matching -> MutualAcceptance -> Connection (integration)', () => {
  let pool: pg.Pool;
  const clock = new FixedClock('2026-07-30T12:00:00Z');
  let m01: M01Deps, m02: M02Deps, m03: M03Deps, m18: M18Deps;
  let adminId: string, orgId: string, coordId: string;
  let aAcc: string, aId: string, bAcc: string, bId: string, cAcc: string, cId: string;
  const ctx = (actorId: string) => createRequestContext({ actor: { type: 'user', id: actorId } });

  beforeAll(async () => {
    await migrate({ databaseUrl: DATABASE_URL, direction: 'up' });
    pool = createPool({ connectionString: DATABASE_URL, applicationName: 'matching-tests' });
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
    m18 = { pool, clock, checkPermission };

    ({ userAccountId: adminId } = await seedBootstrapAdministrator(pool, clock, { displayName: 'Admin' }));
    ({ organisationId: orgId } = await createOrganisation(m01, ctx(adminId), { name: 'Match Org' }));
    const adminCtx = createRequestContext({ actor: { type: 'user', id: adminId }, organisationId: orgId });
    const mk = async (name: string): Promise<[string, string]> => {
      const { userAccountId } = await createUserAccount(m01, adminCtx, { displayName: name });
      await assignRole(m01, adminCtx, { userAccountId, role: 'Participant', confirmed: true });
      const { participantId } = await registerParticipant(m02, ctx(coordId), { displayName: name, userAccountId });
      return [userAccountId, participantId];
    };
    ({ userAccountId: coordId } = await createUserAccount(m01, adminCtx, { displayName: 'Coord' }));
    await assignRole(m01, adminCtx, { userAccountId: coordId, role: 'ResearchCoordinator', confirmed: true });
    [aAcc, aId] = await mk('Alice');
    [bAcc, bId] = await mk('Bob');
    [cAcc, cId] = await mk('Cara');
  }, 30_000);

  afterAll(async () => {
    await pool?.end();
  });

  let candidateId: string, mutualAcceptanceId: string;

  it('NEGATIVE opt-in: activation requires open-matching consent; generation requires both active', async () => {
    await expect(
      activateMatchPreference(m18, ctx(aAcc), { participantId: aId, declaredAttributes: { interests: ['garden'] }, confirmed: true }),
    ).rejects.toMatchObject({ code: 'RESOURCE_NOT_FOUND' }); // consent missing, existence hidden

    for (const [acc, pid] of [[aAcc, aId], [bAcc, bId], [cAcc, cId]] as const) {
      await recordConsentDecision(m03, ctx(acc), {
        participantId: pid,
        scope: 'open-matching',
        decision: 'Granted',
        templateVersion: 'ct_v1',
      });
    }
    await activateMatchPreference(m18, ctx(aAcc), { participantId: aId, declaredAttributes: { interests: ['garden'] }, confirmed: true });
    // Bob has consent but has NOT opted in -> generation refused.
    await expect(
      generateMatchCandidate(m18, ctx(coordId), { participantAId: aId, participantBId: bId, explanation: 'shared interests' }),
    ).rejects.toMatchObject({ code: 'MATCHING_NOT_ACTIVE' });
    await activateMatchPreference(m18, ctx(bAcc), { participantId: bId, declaredAttributes: { interests: ['garden'] }, confirmed: true });
    await activateMatchPreference(m18, ctx(cAcc), { participantId: cId, declaredAttributes: { interests: ['walks'] }, confirmed: true });
  });

  it('NEGATIVE block prevents candidate generation synchronously', async () => {
    const { blockId } = await createBlock(m18, ctx(aAcc), { blockerId: aId, blockedActorId: cId, confirmed: true });
    await expect(
      generateMatchCandidate(m18, ctx(coordId), { participantAId: aId, participantBId: cId, explanation: 'x' }),
    ).rejects.toMatchObject({ code: 'BLOCKED_INTERACTION' });
    void blockId;
  });

  it('candidate generated with explanation; NEGATIVE cross-actor decision refused', async () => {
    ({ matchCandidateId: candidateId } = await generateMatchCandidate(m18, ctx(coordId), {
      participantAId: aId,
      participantBId: bId,
      explanation: 'You both enjoy gardening.',
    }));
    // Cara is not a party to this candidate.
    await expect(
      recordMatchDecision(m18, ctx(cAcc), {
        matchCandidateId: candidateId,
        participantId: cId,
        expectedCandidateVersion: 1,
        decision: 'Interested',
        confirmed: true,
      }),
    ).rejects.toMatchObject({ code: 'MATCH_DECISION_NOT_OWNED' });
    // Alice cannot submit Bob's decision (ownerOnly on Bob's identity).
    await expect(
      recordMatchDecision(m18, ctx(aAcc), {
        matchCandidateId: candidateId,
        participantId: bId,
        expectedCandidateVersion: 1,
        decision: 'Interested',
        confirmed: true,
      }),
    ).rejects.toMatchObject({ code: 'RESOURCE_NOT_FOUND' });
  });

  it('NEGATIVE stale candidate version conflicts', async () => {
    await expect(
      recordMatchDecision(m18, ctx(aAcc), {
        matchCandidateId: candidateId,
        participantId: aId,
        expectedCandidateVersion: 99,
        decision: 'Interested',
        confirmed: true,
      }),
    ).rejects.toMatchObject({ code: 'MATCH_DECISION_CONFLICT' });
  });

  it('one Interested decision alone creates no MutualAcceptance; two compatible decisions create it server-side', async () => {
    const first = await recordMatchDecision(m18, ctx(aAcc), {
      matchCandidateId: candidateId,
      participantId: aId,
      expectedCandidateVersion: 1,
      decision: 'Interested',
      confirmed: true,
    });
    expect(first.mutualAcceptanceId).toBeUndefined();

    const second = await recordMatchDecision(m18, ctx(bAcc), {
      matchCandidateId: candidateId,
      participantId: bId,
      expectedCandidateVersion: 1,
      decision: 'Interested',
      confirmed: true,
    });
    expect(second.mutualAcceptanceId).toBeDefined();
    mutualAcceptanceId = second.mutualAcceptanceId!;

    const sources = await pool.query(
      `SELECT count(*)::int AS n FROM community_social.mutual_acceptance_sources WHERE mutual_acceptance_id = $1`,
      [mutualAcceptanceId],
    );
    expect(sources.rows[0].n).toBe(2);
  });

  it('NEGATIVE duplicate decision by the same actor rejected by the database', async () => {
    await expect(
      recordMatchDecision(m18, ctx(aAcc), {
        matchCandidateId: candidateId,
        participantId: aId,
        expectedCandidateVersion: 1,
        decision: 'Not Now',
        confirmed: true,
      }),
    ).rejects.toThrow(/duplicate key/i);
  });

  it('Connection activates once; NEGATIVE reuse refused by command and DB', async () => {
    const { connectionId } = await activateConnection(m18, ctx(aAcc), {
      mutualAcceptanceId,
      participantId: aId,
      confirmed: true,
    });
    const conn = await pool.query(`SELECT mutual_acceptance_id FROM community_social.connections WHERE id = $1`, [connectionId]);
    expect(conn.rows[0].mutual_acceptance_id).toBe(mutualAcceptanceId);

    await expect(
      activateConnection(m18, ctx(bAcc), { mutualAcceptanceId, participantId: bId, confirmed: true }),
    ).rejects.toMatchObject({ code: 'MUTUAL_ACCEPTANCE_ALREADY_CONSUMED' });

    // DB invariant: consumed <-> linked connection.
    await expect(
      pool.query(`UPDATE community_social.mutual_acceptances SET connection_id = NULL WHERE id = $1`, [mutualAcceptanceId]),
    ).rejects.toThrow(/check constraint/i);
  });

  it('NEGATIVE expired MutualAcceptance cannot activate a Connection', async () => {
    const { matchCandidateId } = await generateMatchCandidate(m18, ctx(coordId), {
      participantAId: bId,
      participantBId: cId,
      explanation: 'Shared walking group.',
    });
    await recordMatchDecision(m18, ctx(bAcc), { matchCandidateId, participantId: bId, expectedCandidateVersion: 1, decision: 'Interested', confirmed: true });
    const { mutualAcceptanceId: ma2 } = await recordMatchDecision(m18, ctx(cAcc), {
      matchCandidateId,
      participantId: cId,
      expectedCandidateVersion: 1,
      decision: 'Interested',
      confirmed: true,
    });
    clock.advance(8 * 24 * 3600_000); // beyond the 7-day TTL
    await expect(
      activateConnection(m18, ctx(bAcc), { mutualAcceptanceId: ma2!, participantId: bId, confirmed: true }),
    ).rejects.toMatchObject({ code: 'MUTUAL_ACCEPTANCE_EXPIRED' });
    clock.set('2026-07-30T12:00:00Z');
  });

  it('NEGATIVE ConnectionRequest is feature-disabled (ADR-029)', () => {
    expect(() => createConnectionRequest()).toThrowError(
      expect.objectContaining({ code: 'CONNECTION_REQUEST_FEATURE_DISABLED' }),
    );
  });
});

describe.skipIf(dbAvailable)('matching integration (skipped)', () => {
  it('skipped because no PostgreSQL is reachable', () => {
    expect(dbAvailable).toBe(false);
  });
});
