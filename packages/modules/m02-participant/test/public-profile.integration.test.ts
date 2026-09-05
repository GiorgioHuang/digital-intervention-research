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
  createParticipantQuery,
  getMyPublicProfile,
  registerParticipant,
  setPublicProfile,
  withdrawPublicProfile,
  type M02Deps,
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

/**
 * The public profile: what other people are shown.
 *
 * Doc 20 §354 is a hard rule — this and the research record are two
 * different things and may not be merged. Every outward-facing name on
 * the product used to come from the research record, because it was the
 * only name there was; D-12 recorded that as a cost and left the question
 * open until a public profile existed. These are the guarantees that make
 * the separation real rather than a comment in a migration.
 */
describe.skipIf(!dbAvailable)('the public profile (integration)', () => {
  let pool: pg.Pool;
  const clock = new FixedClock('2026-09-05T09:00:00Z');
  let m01: M01Deps, m02: M02Deps;
  let adminId: string, orgId: string, coordId: string;
  let margaretAcc: string, margaretId: string, otherAcc: string, otherId: string;
  const ctx = (actorId: string) => createRequestContext({ actor: { type: 'user', id: actorId } });

  beforeAll(async () => {
    await migrate({ databaseUrl: DATABASE_URL, direction: 'up' });
    pool = createPool({ connectionString: DATABASE_URL, applicationName: 'public-profile-tests' });
    const participants = createParticipantQuery(pool);
    const permissions = createPermissionService({
      pool,
      clock,
      policy: POLICY_V1,
      roleAssignments: createRoleAssignmentQuery(pool),
      participantIdentity: participants,
    });
    const checkPermission = permissions.evaluate.bind(permissions);
    m01 = { pool, clock, checkPermission };
    m02 = { pool, clock, checkPermission };

    ({ userAccountId: adminId } = await seedBootstrapAdministrator(pool, clock, { displayName: 'Admin' }));
    ({ organisationId: orgId } = await createOrganisation(m01, ctx(adminId), { name: 'Profile Org' }));
    const adminCtx = createRequestContext({ actor: { type: 'user', id: adminId }, organisationId: orgId });
    ({ userAccountId: coordId } = await createUserAccount(m01, adminCtx, { displayName: 'Coord' }));
    await assignRole(m01, adminCtx, { userAccountId: coordId, role: 'ResearchCoordinator', confirmed: true });

    const mk = async (name: string): Promise<[string, string]> => {
      const { userAccountId } = await createUserAccount(m01, adminCtx, { displayName: name });
      await assignRole(m01, adminCtx, { userAccountId, role: 'Participant', confirmed: true });
      const { participantId } = await registerParticipant(m02, ctx(coordId), { displayName: name, userAccountId });
      return [userAccountId, participantId];
    };
    // The research record holds the full name, because the study office
    // needs it. Nothing on these tests may show it to anybody else.
    [margaretAcc, margaretId] = await mk('Margaret Fraser');
    [otherAcc, otherId] = await mk('Somebody Else');
  }, 30_000);

  afterAll(async () => {
    await pool?.end();
  });

  it('starts as nothing at all, which is what other people see', async () => {
    expect(await getMyPublicProfile(m02, ctx(margaretAcc), margaretId)).toBeNull();
    const names = await createParticipantQuery(pool).findPublicNames([margaretId]);
    expect(names.get(margaretId)).toBeUndefined();
  });

  it('holds what the person chose, and changing it replaces it', async () => {
    await setPublicProfile(m02, ctx(margaretAcc), { participantId: margaretId, chosenName: 'Margaret', city: 'Halifax' });
    expect(await getMyPublicProfile(m02, ctx(margaretAcc), margaretId)).toEqual({
      chosenName: 'Margaret',
      city: 'Halifax',
    });

    // Changing what you are called is ordinary, not an exception — and it
    // must not require being nameless in between.
    await setPublicProfile(m02, ctx(margaretAcc), { participantId: margaretId, chosenName: 'Maggie', city: 'Halifax' });
    expect((await getMyPublicProfile(m02, ctx(margaretAcc), margaretId))?.chosenName).toBe('Maggie');
    const rows = await pool.query(
      `SELECT count(*)::int AS n, max(record_version) AS v FROM public_profile.public_profiles WHERE participant_id = $1`,
      [margaretId],
    );
    expect(rows.rows[0].n).toBe(1);
    expect(rows.rows[0].v).toBe(2);
  });

  /**
   * The hard rule, checked as a fact about the data rather than as a
   * comment: nothing copies a value between the two records in either
   * direction. Choosing a public name does not touch the research record,
   * and the research record's name never appears in the public one.
   */
  it('never copies anything between the research record and this one', async () => {
    await setPublicProfile(m02, ctx(margaretAcc), { participantId: margaretId, chosenName: 'Maggie', city: 'Halifax' });
    const research = await pool.query(
      `SELECT display_name FROM participant_profile.participants WHERE id = $1`,
      [margaretId],
    );
    expect(research.rows[0].display_name).toBe('Margaret Fraser');
    const shown = await createParticipantQuery(pool).findPublicNames([margaretId]);
    expect(shown.get(margaretId)?.chosenName).toBe('Maggie');
    expect(shown.get(margaretId)?.chosenName).not.toContain('Fraser');
  });

  /**
   * An absent public profile is an absence, not a cue to go and look at
   * the research record. This is the one that would undo the whole
   * separation if it were ever written as a COALESCE.
   */
  it('leaves somebody who chose nothing absent, rather than falling back', async () => {
    const shown = await createParticipantQuery(pool).findPublicNames([margaretId, otherId]);
    expect(shown.has(margaretId)).toBe(true);
    expect(shown.has(otherId)).toBe(false);
  });

  it('refuses a name that is not a name', async () => {
    await expect(
      setPublicProfile(m02, ctx(otherAcc), { participantId: otherId, chosenName: '   ' }),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
    expect(await getMyPublicProfile(m02, ctx(otherAcc), otherId)).toBeNull();
  });

  it('stores a city only when one was given, and blanking it takes it back', async () => {
    await setPublicProfile(m02, ctx(otherAcc), { participantId: otherId, chosenName: '  Sam  ', city: '  Truro ' });
    expect(await getMyPublicProfile(m02, ctx(otherAcc), otherId)).toEqual({ chosenName: 'Sam', city: 'Truro' });
    await setPublicProfile(m02, ctx(otherAcc), { participantId: otherId, chosenName: 'Sam', city: '   ' });
    expect((await getMyPublicProfile(m02, ctx(otherAcc), otherId))?.city).toBeNull();
  });

  /**
   * Only the person themselves. Not another participant, and not the
   * study office either — no staff role holds `public-profile.change`,
   * because what somebody is called in front of other people is not the
   * study office's decision to make.
   */
  it('is nobody else’s to set, staff included', async () => {
    for (const actor of [otherAcc, coordId, adminId]) {
      await expect(
        setPublicProfile(m02, ctx(actor), { participantId: margaretId, chosenName: 'Not hers to choose' }),
        `${actor} was allowed to name somebody else`,
      ).rejects.toMatchObject({ code: 'AUTHORISATION_DENIED' });
    }
    expect((await getMyPublicProfile(m02, ctx(margaretAcc), margaretId))?.chosenName).toBe('Maggie');
  });

  /**
   * Taking it down is a real way out, it is confirmed, and it goes back
   * to the placeholder — not to the research record, which would make
   * "take my name down" mean "show the study office's name instead".
   */
  it('can be taken down, once confirmed, back to nothing', async () => {
    await setPublicProfile(m02, ctx(margaretAcc), { participantId: margaretId, chosenName: 'Maggie' });
    await expect(
      withdrawPublicProfile(m02, ctx(margaretAcc), { participantId: margaretId, confirmed: false }),
    ).rejects.toMatchObject({ code: 'CONFIRMATION_REQUIRED' });
    expect(await getMyPublicProfile(m02, ctx(margaretAcc), margaretId)).not.toBeNull();

    await withdrawPublicProfile(m02, ctx(margaretAcc), { participantId: margaretId, confirmed: true });
    expect(await getMyPublicProfile(m02, ctx(margaretAcc), margaretId)).toBeNull();
    const shown = await createParticipantQuery(pool).findPublicNames([margaretId]);
    expect(shown.has(margaretId)).toBe(false);
  });

  /**
   * The audit record says what happened without saying what the name is.
   * A change of name is a decision worth recording; the name itself is
   * not the audit store's to keep (ADR-034).
   */
  it('records the change without recording the name', async () => {
    await setPublicProfile(m02, ctx(margaretAcc), { participantId: margaretId, chosenName: 'Rosalind', city: 'Truro' });
    const audit = await pool.query(
      `SELECT count(*)::int AS n FROM governance_audit.audit_events
        WHERE action = 'public-profile.change' AND participant_id = $1`,
      [margaretId],
    );
    expect(audit.rows[0].n).toBeGreaterThan(0);
    const outbox = await pool.query(
      `SELECT payload::text AS p FROM platform_kernel.outbox_messages
        WHERE event_type = 'PublicProfileChanged' AND aggregate_id = $1`,
      [margaretId],
    );
    for (const r of outbox.rows) {
      expect(r.p).not.toContain('Rosalind');
      expect(r.p).not.toContain('Truro');
    }
  });
});

describe.skipIf(dbAvailable)('public profile (skipped)', () => {
  it('skipped because no PostgreSQL is reachable', () => {
    expect(dbAvailable).toBe(false);
  });
});
