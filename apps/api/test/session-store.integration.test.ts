import pg from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createPool, migrate, type Pool } from '@platform/database';
import { FixedClock, createRequestContext, newId } from '@platform/kernel';
import { POLICY_V1 } from '@platform/policy';
import { createRoleAssignmentQuery, listOrganisationAccounts } from '@platform/m01-identity-org';
import { createParticipantQuery } from '@platform/m02-participant';
import { createPermissionService } from '@platform/m03-consent-permission';
import {
  inviteExistingAccount,
  inviteSupporter,
  inviteToPlatform,
  listOrganisationsForActor,
  listPendingInvitations,
  listSupporterInvitations,
  revokeInvitation,
  withdrawSupporterInvitation,
} from '@platform/m01-identity-org';
import { createSessionStore, hashToken, type SessionStore } from '../src/auth/session-store.js';
import type { GoogleIdentity } from '../src/auth/google-token.js';

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

const ISSUER = 'https://accounts.google.com';

function identity(overrides: Partial<GoogleIdentity> = {}): GoogleIdentity {
  return {
    issuer: ISSUER,
    subject: 'google-sub-pat',
    email: 'pat@example.org',
    emailVerified: true,
    issuedAt: Math.floor(Date.now() / 1000),
    ...overrides,
  };
}

/**
 * Turning "the holder of a Google account" into "somebody this platform
 * knows". Most of what follows is about the ways that step can go wrong
 * quietly.
 */
describe.skipIf(!dbAvailable)('sessions, invitations, and who a Google account turns out to be', () => {
  let pool: Pool;
  let sessions: SessionStore;
  /** Invitation-only, for the tests about refusing an uninvited account. */
  let closedSessions: SessionStore;
  let permissions: ReturnType<typeof createPermissionService>;
  let nonceSeq = 0;

  const nextNonce = (): string => `nonce-${(nonceSeq += 1)}`;

  async function makeAccount(
    displayName: string,
    state: 'Invited' | 'Active' | 'Suspended' = 'Invited',
  ): Promise<string> {
    const id = newId('acct');
    await pool.query(
      `INSERT INTO identity_org.user_accounts (id, display_name, account_state) VALUES ($1, $2, $3)`,
      [id, displayName, state],
    );
    return id;
  }

  async function expectStillPending(accountId: string): Promise<void> {
    const row = await pool.query<{ invitation_state: string }>(
      `SELECT invitation_state FROM identity_org.account_invitations WHERE user_account_id = $1`,
      [accountId],
    );
    expect(row.rows[0]?.invitation_state).toBe('Pending');
  }

  async function invite(accountId: string, email: string, expiresInMinutes = 60): Promise<string> {
    const id = newId('invite');
    await pool.query(
      `INSERT INTO identity_org.account_invitations (id, user_account_id, issuer, invited_email, expires_at)
       VALUES ($1, $2, $3, $4, now() + ($5 || ' minutes')::interval)`,
      [id, accountId, ISSUER, email, String(expiresInMinutes)],
    );
    return id;
  }

  beforeAll(async () => {
    await migrate({ databaseUrl: DATABASE_URL, direction: 'up' });
    pool = createPool({ connectionString: DATABASE_URL, applicationName: 'session-store-test' });
    sessions = createSessionStore({
      pool,
      sessionTtlMinutes: 60,
      stepUpTtlMinutes: 10,
      mfaDomains: ['mfa-enforced.test'],
      allowSelfSignup: true,
    });
    closedSessions = createSessionStore({
      pool,
      sessionTtlMinutes: 60,
      stepUpTtlMinutes: 10,
      mfaDomains: [],
      allowSelfSignup: false,
    });
    permissions = createPermissionService({
      pool,
      clock: new FixedClock('2026-08-08T12:00:00Z'),
      policy: POLICY_V1,
      roleAssignments: createRoleAssignmentQuery(pool),
      participantIdentity: createParticipantQuery(pool),
    });
  });

  afterAll(async () => {
    await pool.end();
  });

  beforeEach(async () => {
    await pool.query('DELETE FROM identity_org.auth_sessions');
    await pool.query('DELETE FROM identity_org.account_invitations');
    await pool.query('DELETE FROM identity_org.external_identities');
    await pool.query('DELETE FROM consent_permission.relationships');
  });

  /* ---------------------------------------------------------------- */
  /* Getting in at all                                                */
  /* ---------------------------------------------------------------- */

  /**
   * Self-signup is on (owner's ruling). What an uninvited account gets is
   * an account and a participant record of its own — and, as the tests
   * further down establish, a view of nobody.
   */
  it('lets an uninvited Google account register itself', async () => {
    const result = await sessions.signIn(identity(), nextNonce());
    const account = await pool.query<{ origin: string; account_state: string }>(
      `SELECT origin, account_state FROM identity_org.user_accounts WHERE id = $1`,
      [result.userAccountId],
    );
    expect(account.rows[0]?.origin).toBe('self-registered');
    expect(account.rows[0]?.account_state).toBe('Active');
  });

  it('gives a self-registered account a participant record of its own', async () => {
    const result = await sessions.signIn(identity(), nextNonce());
    const participant = await pool.query(
      `SELECT 1 FROM participant_profile.participants WHERE user_account_id = $1`,
      [result.userAccountId],
    );
    expect(participant.rowCount).toBe(1);
  });

  it('recognises a self-registered person on their second visit rather than making another account', async () => {
    const first = await sessions.signIn(identity(), nextNonce());
    const second = await sessions.signIn(identity(), nextNonce());
    expect(second.userAccountId).toBe(first.userAccountId);
    const accounts = await pool.query<{ count: string }>(
      `SELECT count(*)::text AS count FROM identity_org.external_identities`,
    );
    expect(accounts.rows[0]?.count).toBe('1');
  });

  /**
   * Where the population is a fixed cohort rather than an open service,
   * the flag closes the door and the old refusal is the whole behaviour.
   */
  it('still refuses an uninvited account where self-signup is off', async () => {
    await expect(closedSessions.signIn(identity(), nextNonce())).rejects.toThrow(/not been invited/);
  });

  it('lets an invited account sign in, and marks the account active', async () => {
    const account = await makeAccount('Pat');
    await invite(account, 'pat@example.org');

    const result = await sessions.signIn(identity(), nextNonce());
    expect(result.userAccountId).toBe(account);
    expect(result.authStrength).toBe('password');

    const state = await pool.query<{ account_state: string }>(
      `SELECT account_state FROM identity_org.user_accounts WHERE id = $1`,
      [account],
    );
    expect(state.rows[0]?.account_state).toBe('Active');
  });

  /**
   * An unverified address is a string somebody typed into a signup form.
   * Accepting it would let anyone claim a colleague's invitation by
   * creating a Google account that merely asserts their address.
   */
  it('refuses to claim an invitation with an unverified email', async () => {
    const account = await makeAccount('Pat');
    await invite(account, 'pat@example.org');
    // Self-signup means they are not turned away — they become a stranger
    // with an account of their own. The point is that they do not become
    // Pat, which is what an unverified address would otherwise buy.
    const result = await sessions.signIn(identity({ emailVerified: false }), nextNonce());
    expect(result.userAccountId).not.toBe(account);
    await expectStillPending(account);
  });

  it('refuses an invitation that has expired', async () => {
    const account = await makeAccount('Pat');
    await invite(account, 'pat@example.org', -1);
    const result = await sessions.signIn(identity(), nextNonce());
    expect(result.userAccountId).not.toBe(account);
  });


  /* ---------------------------------------------------------------- */
  /* What registering gets you, and what an invitation adds            */
  /* ---------------------------------------------------------------- */

  /**
   * The ruling this whole path rests on: "registering does not show you
   * anybody else's information."
   *
   * It is not enforced by anything in the sign-in code, and that is the
   * point — it falls out of the permission engine. A self-registered
   * account holds no role assignments, so step 2 denies with
   * 'no-granting-role' for every action on a resource it does not own.
   * Asserted here against the REAL permission service rather than by
   * reasoning about it, because this is the sentence the decision was
   * made on and it should fail loudly if it ever stops being true.
   */
  it('leaves a self-registered account unable to reach another participant', async () => {
    const stranger = await sessions.signIn(identity(), nextNonce());
    const otherAccount = await makeAccount('Ann', 'Active');
    const otherParticipant = newId('pt');
    await pool.query(
      `INSERT INTO participant_profile.participants (id, user_account_id, display_name)
       VALUES ($1, $2, 'Ann')`,
      [otherParticipant, otherAccount],
    );

    const decision = await permissions.evaluate(
      createRequestContext({ actor: { type: 'user', id: stranger.userAccountId } }),
      {
        action: 'life-story.contribute',
        resource: {
          type: 'LifeStoryItem',
          id: newId('lsi'),
          state: 'Active',
          ownerParticipantId: otherParticipant,
          protectedExistence: true,
        },
      },
    );
    // Not merely denied — the existence of the item is hidden too
    // (ADR-050): a stranger asking after somebody else's life story does
    // not get to learn that there is one.
    expect(decision.outcome).toBe('DenyAndHideExistence');
    // The reason is asserted, not just the refusal. An action name that is
    // not in the catalogue also denies — with 'unknown-action' — so a test
    // checking only the outcome would keep passing after a rename and
    // would be proving nothing about roles at all. (It did, briefly.)
    expect(decision.reason).toBe('no-granting-role');
  });

  /**
   * And the other half: "somebody who arrived on an invitation sees the
   * person who invited them." The invitation carries the relationship, so
   * claiming it is what opens the door — scoped to named actions, and
   * still re-decided by the engine on every request.
   */
  it('gives an invited supporter the relationship that lets them see the person who invited them', async () => {
    const inviterAccount = await makeAccount('Ann', 'Active');
    const inviterParticipant = newId('pt');
    await pool.query(
      `INSERT INTO participant_profile.participants (id, user_account_id, display_name)
       VALUES ($1, $2, 'Ann')`,
      [inviterParticipant, inviterAccount],
    );
    await pool.query(
      `INSERT INTO identity_org.account_invitations
         (id, issuer, invited_email, expires_at, invited_by,
          relationship_participant_id, relationship_type, relationship_permitted_actions)
       VALUES ($1, $2, $3, now() + interval '1 hour', $4, $5, 'FamilyMember', $6)`,
      [
        newId('invite'),
        ISSUER,
        'daughter@example.org',
        inviterAccount,
        inviterParticipant,
        ['life-story.contribute'],
      ],
    );

    const daughter = await sessions.signIn(
      identity({ subject: 'google-sub-daughter', email: 'daughter@example.org' }),
      nextNonce(),
    );

    const relationship = await pool.query<{ relationship_state: string; permitted_actions: string[] }>(
      `SELECT relationship_state, permitted_actions
         FROM consent_permission.relationships
        WHERE participant_id = $1 AND related_actor_id = $2`,
      [inviterParticipant, daughter.userAccountId],
    );
    expect(relationship.rows[0]?.relationship_state).toBe('Active');
    expect(relationship.rows[0]?.permitted_actions).toEqual(['life-story.contribute']);

    // And what that is worth at the engine. The stranger above stopped at
    // 'no-granting-role'; the daughter gets past the role and relationship
    // steps and stops at consent, which is exactly where an invitation is
    // supposed to leave somebody — an invitation opens a door, it does not
    // stand in for the participant's consent.
    await pool.query(
      `INSERT INTO identity_org.role_assignments
         (id, user_account_id, role, assignment_state, assigned_by_actor_id)
       VALUES ($1, $2, 'Supporter', 'Active', $3)`,
      [newId('ra'), daughter.userAccountId, inviterAccount],
    );
    const decision = await permissions.evaluate(
      createRequestContext({ actor: { type: 'user', id: daughter.userAccountId } }),
      {
        action: 'life-story.contribute',
        resource: {
          type: 'LifeStoryItem',
          id: newId('lsi'),
          state: 'Active',
          ownerParticipantId: inviterParticipant,
          protectedExistence: true,
        },
      },
    );
    expect(decision.reason).toBe('consent-missing');
  });

  /**
   * A supporter invited to help somebody is not thereby enrolled in a
   * study. Creating a participant record for them would put a person into
   * research that nobody consented on their behalf to.
   */
  it('does not enrol an invited supporter as a participant', async () => {
    const inviterAccount = await makeAccount('Ann', 'Active');
    const inviterParticipant = newId('pt');
    await pool.query(
      `INSERT INTO participant_profile.participants (id, user_account_id, display_name)
       VALUES ($1, $2, 'Ann')`,
      [inviterParticipant, inviterAccount],
    );
    await pool.query(
      `INSERT INTO identity_org.account_invitations
         (id, issuer, invited_email, expires_at,
          relationship_participant_id, relationship_type, relationship_permitted_actions)
       VALUES ($1, $2, $3, now() + interval '1 hour', $4, 'FamilyMember', $5)`,
      [newId('invite'), ISSUER, 'daughter@example.org', inviterParticipant, ['life-story.contribute']],
    );

    const daughter = await sessions.signIn(
      identity({ subject: 'google-sub-daughter', email: 'daughter@example.org' }),
      nextNonce(),
    );
    const participant = await pool.query(
      `SELECT 1 FROM participant_profile.participants WHERE user_account_id = $1`,
      [daughter.userAccountId],
    );
    expect(participant.rowCount).toBe(0);
  });

  /**
   * The gap self-signup opened.
   *
   * Before, an invitation was only ever looked for when the Google account
   * was unknown. Once anybody can register, the ordinary case is that the
   * daughter ALREADY signed up last week out of curiosity — and her
   * mother's invitation would then have sat unclaimed forever, doing
   * nothing, with no error on either side.
   */
  it('applies an invitation to somebody who had already registered', async () => {
    const daughterIdentity = identity({ subject: 'google-sub-daughter', email: 'daughter@example.org' });
    const daughter = await sessions.signIn(daughterIdentity, nextNonce());

    const inviterAccount = await makeAccount('Ann', 'Active');
    const inviterParticipant = newId('pt');
    await pool.query(
      `INSERT INTO participant_profile.participants (id, user_account_id, display_name)
       VALUES ($1, $2, 'Ann')`,
      [inviterParticipant, inviterAccount],
    );
    await pool.query(
      `INSERT INTO identity_org.account_invitations
         (id, issuer, invited_email, expires_at,
          relationship_participant_id, relationship_type, relationship_permitted_actions)
       VALUES ($1, $2, $3, now() + interval '1 hour', $4, 'FamilyMember', $5)`,
      [newId('invite'), ISSUER, 'daughter@example.org', inviterParticipant, ['life-story.contribute']],
    );

    const again = await sessions.signIn(daughterIdentity, nextNonce());
    expect(again.userAccountId).toBe(daughter.userAccountId);

    const relationship = await pool.query(
      `SELECT 1 FROM consent_permission.relationships
        WHERE participant_id = $1 AND related_actor_id = $2 AND relationship_state = 'Active'`,
      [inviterParticipant, daughter.userAccountId],
    );
    expect(relationship.rowCount).toBe(1);
  });

  it('spends an invitation once, not on every subsequent sign-in', async () => {
    const inviterAccount = await makeAccount('Ann', 'Active');
    const inviterParticipant = newId('pt');
    await pool.query(
      `INSERT INTO participant_profile.participants (id, user_account_id, display_name)
       VALUES ($1, $2, 'Ann')`,
      [inviterParticipant, inviterAccount],
    );
    await pool.query(
      `INSERT INTO identity_org.account_invitations
         (id, issuer, invited_email, expires_at,
          relationship_participant_id, relationship_type, relationship_permitted_actions)
       VALUES ($1, $2, $3, now() + interval '1 hour', $4, 'FamilyMember', $5)`,
      [newId('invite'), ISSUER, 'daughter@example.org', inviterParticipant, ['life-story.contribute']],
    );
    const who = identity({ subject: 'google-sub-daughter', email: 'daughter@example.org' });
    await sessions.signIn(who, nextNonce());
    await sessions.signIn(who, nextNonce());

    const relationships = await pool.query<{ count: string }>(
      `SELECT count(*)::text AS count FROM consent_permission.relationships
        WHERE participant_id = $1`,
      [inviterParticipant],
    );
    expect(relationships.rows[0]?.count).toBe('1');
  });


  /* ---------------------------------------------------------------- */
  /* Inviting somebody, from the screen rather than by hand            */
  /* ---------------------------------------------------------------- */

  /**
   * The whole round trip: an administrator records an invitation, and the
   * person it names signs in and lands on the account it made for them.
   *
   * Worth asserting as one arc rather than two halves, because the halves
   * were written days apart and the thing that binds them is a lowercased
   * email in one place matching a verified email in another. That is
   * exactly the kind of seam that holds in unit tests and parts in
   * production.
   */
  describe('inviting from the administrator screen', () => {
    let adminCtx: ReturnType<typeof createRequestContext>;
    let m01: { pool: Pool; clock: FixedClock; checkPermission: typeof permissions.evaluate };
    let organisationId: string;

    beforeEach(async () => {
      await pool.query('DELETE FROM identity_org.organisation_memberships');
      await pool.query('DELETE FROM identity_org.role_assignments');
      organisationId = newId('org');
      await pool.query(`INSERT INTO identity_org.organisations (id, name) VALUES ($1, 'Test Org')`, [
        organisationId,
      ]);
      const admin = await makeAccount('Admin', 'Active');
      await pool.query(
        `INSERT INTO identity_org.role_assignments
           (id, user_account_id, role, organisation_id, assignment_state, assigned_by_actor_id)
         VALUES ($1, $2, 'OrganisationAdministrator', $3, 'Active', 'system-bootstrap')`,
        [newId('ra'), admin, organisationId],
      );
      adminCtx = createRequestContext({
        actor: { type: 'user', id: admin },
        organisationId,
        purposeCode: 'platform-administration',
      });
      m01 = { pool, clock: new FixedClock('2026-08-09T12:00:00Z'), checkPermission: permissions.evaluate.bind(permissions) };
    });

    it('records an invitation the named person can then claim', async () => {
      const invitation = await inviteToPlatform(m01, adminCtx, {
        displayName: 'Sam',
        email: 'Sam@Example.org',
        organisationId,
      });
      // Lowercased on the way in, because the claim matches on lower(email)
      // and an address typed with capitals would otherwise never match.
      expect(invitation.invitedEmail).toBe('sam@example.org');

      const signedIn = await sessions.signIn(
        identity({ subject: 'google-sub-sam', email: 'sam@example.org' }),
        nextNonce(),
      );
      expect(signedIn.userAccountId).toBe(invitation.userAccountId);

      const account = await pool.query<{ account_state: string; origin: string }>(
        `SELECT account_state, origin FROM identity_org.user_accounts WHERE id = $1`,
        [invitation.userAccountId],
      );
      expect(account.rows[0]?.account_state).toBe('Active');
      expect(account.rows[0]?.origin).toBe('invitation');
    });

    /**
     * The claimed person has a membership and no role. They must still be
     * visible to the administrator — otherwise they are on the platform
     * and unreachable by the person meant to give them a role.
     */
    it('shows a claimed invitee on the accounts screen before they hold any role', async () => {
      const invitation = await inviteToPlatform(m01, adminCtx, {
        displayName: 'Sam',
        email: 'sam@example.org',
        organisationId,
      });
      await sessions.signIn(identity({ subject: 'google-sub-sam', email: 'sam@example.org' }), nextNonce());

      const accounts = await listOrganisationAccounts(m01, adminCtx);
      const sam = accounts.find((a) => a.userAccountId === invitation.userAccountId);
      expect(sam, 'a claimed invitee with no role must still be listed').toBeDefined();
      expect(sam?.roles.filter((r) => r.assignmentState === 'Active')).toEqual([]);
    });

    it('lists what is outstanding and stops listing it once claimed', async () => {
      await inviteToPlatform(m01, adminCtx, { displayName: 'Sam', email: 'sam@example.org', organisationId });
      expect((await listPendingInvitations(m01, adminCtx)).map((i) => i.invitedEmail)).toEqual([
        'sam@example.org',
      ]);

      await sessions.signIn(identity({ subject: 'google-sub-sam', email: 'sam@example.org' }), nextNonce());
      expect(await listPendingInvitations(m01, adminCtx)).toEqual([]);
    });

    /**
     * Two live invitations to one address would mean a first sign-in facing
     * two candidate accounts. Refused at the point of asking, with a
     * message that says what to do, rather than resolved arbitrarily later.
     */
    it('refuses a second live invitation to the same address', async () => {
      await inviteToPlatform(m01, adminCtx, { displayName: 'Sam', email: 'sam@example.org', organisationId });
      await expect(
        inviteToPlatform(m01, adminCtx, { displayName: 'Sam again', email: 'SAM@example.org', organisationId }),
      ).rejects.toThrow(/already has an invitation waiting/);
    });

    it('lets a withdrawn invitation no longer be claimed', async () => {
      const invitation = await inviteToPlatform(m01, adminCtx, {
        displayName: 'Sam',
        email: 'sam@example.org',
        organisationId,
      });
      await revokeInvitation(m01, adminCtx, { invitationId: invitation.invitationId, confirmed: true });

      const signedIn = await sessions.signIn(
        identity({ subject: 'google-sub-sam', email: 'sam@example.org' }),
        nextNonce(),
      );
      // Self-signup means they still get in — as a stranger with their own
      // account, not as the person the withdrawn invitation named.
      expect(signedIn.userAccountId).not.toBe(invitation.userAccountId);
    });

    it('refuses to withdraw an invitation that has already been claimed', async () => {
      const invitation = await inviteToPlatform(m01, adminCtx, {
        displayName: 'Sam',
        email: 'sam@example.org',
        organisationId,
      });
      await sessions.signIn(identity({ subject: 'google-sub-sam', email: 'sam@example.org' }), nextNonce());
      await expect(
        revokeInvitation(m01, adminCtx, { invitationId: invitation.invitationId, confirmed: true }),
      ).rejects.toThrow(/no longer pending/);
    });

    /** `user.invite` is granted to administrators only. */
    it('refuses to invite anybody on behalf of somebody with no standing', async () => {
      const stranger = await sessions.signIn(identity(), nextNonce());
      const strangerCtx = createRequestContext({
        actor: { type: 'user', id: stranger.userAccountId },
        organisationId,
      });
      await expect(
        inviteToPlatform(m01, strangerCtx, { displayName: 'Sam', email: 'sam@example.org', organisationId }),
      ).rejects.toThrow();
    });
  });


  /* ---------------------------------------------------------------- */
  /* The first administrator                                          */
  /* ---------------------------------------------------------------- */

  /**
   * Otherwise the only answer to "how do I get an administrator" is to
   * open a SQL client against a running deployment — which is a fine
   * answer once and a terrible one as a standing instruction.
   */
  describe('bootstrapping the first administrator', () => {
    const bootstrapEmail = 'owner@example.org';
    let bootstrapSessions: SessionStore;

    beforeEach(async () => {
      await pool.query('DELETE FROM identity_org.role_assignments');
      bootstrapSessions = createSessionStore({
        pool,
        sessionTtlMinutes: 60,
        stepUpTtlMinutes: 10,
        mfaDomains: [],
        allowSelfSignup: true,
        bootstrapAdminEmail: bootstrapEmail,
      });
    });

    const adminCount = async (accountId: string): Promise<number> => {
      const r = await pool.query<{ count: string }>(
        `SELECT count(*)::text AS count FROM identity_org.role_assignments
          WHERE user_account_id = $1 AND role = 'SystemAdministrator' AND assignment_state = 'Active'`,
        [accountId],
      );
      return Number(r.rows[0]?.count ?? '0');
    };

    it('grants the configured address the administrator role on first sign-in', async () => {
      const signedIn = await bootstrapSessions.signIn(
        identity({ subject: 'google-sub-owner', email: bootstrapEmail }),
        nextNonce(),
      );
      expect(await adminCount(signedIn.userAccountId)).toBe(1);
    });

    /**
     * The condition that turns this from a back door into a bootstrap.
     * Once anybody holds the role, the configured address stops meaning
     * anything — including for the person named in it.
     */
    it('does nothing once the platform already has an administrator', async () => {
      const existing = await makeAccount('Somebody', 'Active');
      await pool.query(
        `INSERT INTO identity_org.role_assignments
           (id, user_account_id, role, assignment_state, assigned_by_actor_id)
         VALUES ($1, $2, 'SystemAdministrator', 'Active', 'system-bootstrap')`,
        [newId('ra'), existing],
      );

      const signedIn = await bootstrapSessions.signIn(
        identity({ subject: 'google-sub-owner', email: bootstrapEmail }),
        nextNonce(),
      );
      expect(await adminCount(signedIn.userAccountId)).toBe(0);
    });

    /**
     * Otherwise anybody who learned the configured address could make a
     * Google account asserting it and become the platform's administrator.
     */
    it('refuses an unverified email even when it matches', async () => {
      const signedIn = await bootstrapSessions.signIn(
        identity({ subject: 'google-sub-liar', email: bootstrapEmail, emailVerified: false }),
        nextNonce(),
      );
      expect(await adminCount(signedIn.userAccountId)).toBe(0);
    });

    it('grants nothing to a different address', async () => {
      const signedIn = await bootstrapSessions.signIn(
        identity({ subject: 'google-sub-other', email: 'someone.else@example.org' }),
        nextNonce(),
      );
      expect(await adminCount(signedIn.userAccountId)).toBe(0);
    });

    it('grants nothing when no address is configured', async () => {
      const signedIn = await sessions.signIn(
        identity({ subject: 'google-sub-owner', email: bootstrapEmail }),
        nextNonce(),
      );
      expect(await adminCount(signedIn.userAccountId)).toBe(0);
    });

    it('does not grant it twice when that person signs in again', async () => {
      const who = identity({ subject: 'google-sub-owner', email: bootstrapEmail });
      const first = await bootstrapSessions.signIn(who, nextNonce());
      await bootstrapSessions.signIn(who, nextNonce());
      expect(await adminCount(first.userAccountId)).toBe(1);
    });
  });


  /* ---------------------------------------------------------------- */
  /* The remaining things that used to need SQL                       */
  /* ---------------------------------------------------------------- */

  describe('reaching accounts and circles without a SQL client', () => {
    let adminAccount: string;
    let adminCtx: ReturnType<typeof createRequestContext>;
    let m01: { pool: Pool; clock: FixedClock; checkPermission: typeof permissions.evaluate };
    let organisationId: string;

    beforeEach(async () => {
      await pool.query('DELETE FROM identity_org.organisation_memberships');
      await pool.query('DELETE FROM identity_org.role_assignments');
      organisationId = newId('org');
      await pool.query(`INSERT INTO identity_org.organisations (id, name) VALUES ($1, 'Test Org')`, [
        organisationId,
      ]);
      adminAccount = await makeAccount('Admin', 'Active');
      await pool.query(
        `INSERT INTO identity_org.role_assignments
           (id, user_account_id, role, organisation_id, assignment_state, assigned_by_actor_id)
         VALUES ($1, $2, 'OrganisationAdministrator', $3, 'Active', 'system-bootstrap')`,
        [newId('ra'), adminAccount, organisationId],
      );
      adminCtx = createRequestContext({
        actor: { type: 'user', id: adminAccount },
        organisationId,
        purposeCode: 'platform-administration',
      });
      m01 = {
        pool,
        clock: new FixedClock('2026-08-09T12:00:00Z'),
        checkPermission: permissions.evaluate.bind(permissions),
      };
    });

    /**
     * The accounts made before Sign in with Google — roles, history, and
     * nobody able to sign in as them.
     */
    it('lets an administrator invite the holder of an account that already exists', async () => {
      const stranded = await makeAccount('Seeded Coordinator', 'Active');
      await pool.query(
        `INSERT INTO identity_org.organisation_memberships (id, organisation_id, user_account_id)
         VALUES ($1, $2, $3)`,
        [newId('mem'), organisationId, stranded],
      );

      const accountsBefore = await listOrganisationAccounts(m01, adminCtx);
      expect(accountsBefore.find((a) => a.userAccountId === stranded)?.hasSignIn).toBe(false);

      await inviteExistingAccount(m01, adminCtx, { userAccountId: stranded, email: 'coord@example.org' });
      const signedIn = await sessions.signIn(
        identity({ subject: 'google-sub-coord', email: 'coord@example.org' }),
        nextNonce(),
      );
      expect(signedIn.userAccountId).toBe(stranded);

      const accountsAfter = await listOrganisationAccounts(m01, adminCtx);
      expect(accountsAfter.find((a) => a.userAccountId === stranded)?.hasSignIn).toBe(true);
    });

    /**
     * Once an account has a holder, inviting somebody to it would be a way
     * of handing over somebody else's identity and history.
     */
    it('refuses to invite a holder to an account that already has one', async () => {
      const stranded = await makeAccount('Seeded Coordinator', 'Active');
      await inviteExistingAccount(m01, adminCtx, { userAccountId: stranded, email: 'coord@example.org' });
      await sessions.signIn(identity({ subject: 'google-sub-coord', email: 'coord@example.org' }), nextNonce());

      await expect(
        inviteExistingAccount(m01, adminCtx, { userAccountId: stranded, email: 'someone.else@example.org' }),
      ).rejects.toThrow(/already belongs to somebody/);
    });

    it('lists the organisations an actor may act in, and no others', async () => {
      const outsider = await sessions.signIn(identity(), nextNonce());
      const otherOrg = newId('org');
      await pool.query(`INSERT INTO identity_org.organisations (id, name) VALUES ($1, 'Elsewhere')`, [otherOrg]);

      expect((await listOrganisationsForActor(m01, adminCtx)).map((o) => o.organisationId)).toEqual([
        organisationId,
      ]);
      const outsiderCtx = createRequestContext({ actor: { type: 'user', id: outsider.userAccountId } });
      expect(await listOrganisationsForActor(m01, outsiderCtx)).toEqual([]);
    });

    /** The one person who belongs to none and most needs to choose one. */
    it('shows every organisation to a platform-wide administrator', async () => {
      const sysAdmin = await makeAccount('Sys', 'Active');
      await pool.query(
        `INSERT INTO identity_org.role_assignments
           (id, user_account_id, role, assignment_state, assigned_by_actor_id)
         VALUES ($1, $2, 'SystemAdministrator', 'Active', 'system-bootstrap')`,
        [newId('ra'), sysAdmin],
      );
      const ctx = createRequestContext({ actor: { type: 'user', id: sysAdmin } });
      expect((await listOrganisationsForActor(m01, ctx)).length).toBeGreaterThanOrEqual(1);
    });

    /* -------------------------------------------------------------- */

    async function participantWithAccount(email: string, subject: string): Promise<{ account: string; participant: string }> {
      const signedIn = await sessions.signIn(identity({ subject, email }), nextNonce());
      const p = await pool.query<{ id: string }>(
        `SELECT id FROM participant_profile.participants WHERE user_account_id = $1`,
        [signedIn.userAccountId],
      );
      return { account: signedIn.userAccountId, participant: p.rows[0]!.id };
    }

    it('lets a participant invite somebody into their own circle', async () => {
      const ann = await participantWithAccount('ann@example.org', 'google-sub-ann');
      const annCtx = createRequestContext({ actor: { type: 'user', id: ann.account } });

      await inviteSupporter(m01, annCtx, {
        participantId: ann.participant,
        email: 'daughter@example.org',
        relationshipType: 'FamilyMember',
        permittedActions: ['life-story.contribute'],
      });
      expect((await listSupporterInvitations(m01, annCtx, { participantId: ann.participant })).length).toBe(1);

      const daughter = await sessions.signIn(
        identity({ subject: 'google-sub-daughter', email: 'daughter@example.org' }),
        nextNonce(),
      );
      const rel = await pool.query(
        `SELECT 1 FROM consent_permission.relationships
          WHERE participant_id = $1 AND related_actor_id = $2 AND relationship_state = 'Active'`,
        [ann.participant, daughter.userAccountId],
      );
      expect(rel.rowCount).toBe(1);
    });

    /**
     * The check that matters. Without it, anybody able to propose a
     * relationship could hand out access to somebody else's life story
     * simply by naming their participant identifier.
     */
    it('refuses to invite somebody into a circle that is not yours', async () => {
      const ann = await participantWithAccount('ann@example.org', 'google-sub-ann');
      const ben = await participantWithAccount('ben@example.org', 'google-sub-ben');
      const benCtx = createRequestContext({ actor: { type: 'user', id: ben.account } });

      await expect(
        inviteSupporter(m01, benCtx, {
          participantId: ann.participant,
          email: 'accomplice@example.org',
          relationshipType: 'FamilyMember',
          permittedActions: ['life-story.contribute'],
        }),
        // Refused by the permission engine before this function's own
        // check is reached: `relationship.approve` is owner-only, so the
        // engine compares the caller against the resource owner using the
        // actor→participant mapping it resolves itself. The hand-written
        // check behind it stays as a second lock on the identifier this
        // code supplies.
      ).rejects.toThrow(/not-resource-owner|your own circle/);
    });

    it('refuses an invitation that permits nothing', async () => {
      const ann = await participantWithAccount('ann@example.org', 'google-sub-ann');
      const annCtx = createRequestContext({ actor: { type: 'user', id: ann.account } });
      await expect(
        inviteSupporter(m01, annCtx, {
          participantId: ann.participant,
          email: 'daughter@example.org',
          relationshipType: 'FamilyMember',
          permittedActions: [],
        }),
      ).rejects.toThrow(/at least one thing/);
    });

    it('lets a participant withdraw one, and refuses to withdraw somebody else\'s', async () => {
      const ann = await participantWithAccount('ann@example.org', 'google-sub-ann');
      const ben = await participantWithAccount('ben@example.org', 'google-sub-ben');
      const annCtx = createRequestContext({ actor: { type: 'user', id: ann.account } });
      const benCtx = createRequestContext({ actor: { type: 'user', id: ben.account } });

      const invitation = await inviteSupporter(m01, annCtx, {
        participantId: ann.participant,
        email: 'daughter@example.org',
        relationshipType: 'FamilyMember',
        permittedActions: ['life-story.contribute'],
      });

      await expect(
        withdrawSupporterInvitation(m01, benCtx, {
          participantId: ann.participant,
          invitationId: invitation.invitationId,
          confirmed: true,
        }),
      ).rejects.toThrow();

      await withdrawSupporterInvitation(m01, annCtx, {
        participantId: ann.participant,
        invitationId: invitation.invitationId,
        confirmed: true,
      });
      expect(await listSupporterInvitations(m01, annCtx, { participantId: ann.participant })).toEqual([]);
    });
  });

  /* ---------------------------------------------------------------- */
  /* An email address is not an identity                              */
  /* ---------------------------------------------------------------- */

  /**
   * The trap the schema is shaped around.
   *
   * An invitation is claimed once and then spent. After that the person is
   * their Google `sub`. A second, different Google account presenting the
   * same address — because it was renamed, or because a Workspace
   * administrator reassigned it to the departing coordinator's replacement
   * — is a stranger, and gets nothing.
   */
  it('does not let a second Google account inherit an address that has already been claimed', async () => {
    const account = await makeAccount('Pat');
    await invite(account, 'pat@example.org');
    await sessions.signIn(identity(), nextNonce());

    // Under self-signup the stranger is not turned away, which makes the
    // assertion sharper rather than weaker: they get an account, and it is
    // emphatically not Pat's.
    const stranger = await sessions.signIn(
      identity({ subject: 'google-sub-somebody-else' }),
      nextNonce(),
    );
    expect(stranger.userAccountId).not.toBe(account);
  });

  /**
   * And the same principle in the other direction: once linked, the person
   * is the `sub`, so changing their email address — a marriage, a rename,
   * a new domain — must not lock them out of their own account or quietly
   * make them somebody new.
   */
  it('keeps recognising the same person after their email address changes', async () => {
    const account = await makeAccount('Pat');
    await invite(account, 'pat@example.org');
    await sessions.signIn(identity(), nextNonce());

    const later = await sessions.signIn(identity({ email: 'pat.new@example.org' }), nextNonce());
    expect(later.userAccountId).toBe(account);

    const links = await pool.query<{ count: string }>(
      `SELECT count(*)::text AS count FROM identity_org.external_identities WHERE user_account_id = $1`,
      [account],
    );
    expect(links.rows[0]?.count).toBe('1');
  });

  /* ---------------------------------------------------------------- */
  /* Sessions                                                          */
  /* ---------------------------------------------------------------- */

  it('resolves a live session to its account', async () => {
    const account = await makeAccount('Pat');
    await invite(account, 'pat@example.org');
    const { token } = await sessions.signIn(identity(), nextNonce());

    const resolved = await sessions.resolve(token);
    expect(resolved?.userAccountId).toBe(account);
  });

  it('resolves nothing for a token that was never issued', async () => {
    expect(await sessions.resolve('not-a-real-token')).toBeUndefined();
  });

  /**
   * A database backup, a logged query, or somebody reading a row over a
   * shoulder must not come away holding something replayable.
   */
  it('stores the session token only as a hash', async () => {
    const account = await makeAccount('Pat');
    await invite(account, 'pat@example.org');
    const { token } = await sessions.signIn(identity(), nextNonce());

    const rows = await pool.query<{ token_hash: Buffer }>(
      `SELECT token_hash FROM identity_org.auth_sessions`,
    );
    expect(rows.rows[0]?.token_hash.equals(hashToken(token))).toBe(true);

    const plaintext = await pool.query<{ count: string }>(
      `SELECT count(*)::text AS count FROM identity_org.auth_sessions
        WHERE token_hash::text LIKE '%' || $1 || '%'`,
      [token],
    );
    expect(plaintext.rows[0]?.count).toBe('0');
  });

  it('stops resolving a session once it is signed out', async () => {
    const account = await makeAccount('Pat');
    await invite(account, 'pat@example.org');
    const { token } = await sessions.signIn(identity(), nextNonce());

    await sessions.signOut(token);
    expect(await sessions.resolve(token)).toBeUndefined();
  });

  /**
   * Suspension is a safety action on this platform. If it only stopped the
   * NEXT sign-in, somebody suspended mid-shift would keep working for as
   * long as their session had left — which is exactly the window
   * suspension exists to close.
   */
  it('stops resolving an existing session the moment the account is suspended', async () => {
    const account = await makeAccount('Pat');
    await invite(account, 'pat@example.org');
    const { token } = await sessions.signIn(identity(), nextNonce());
    expect(await sessions.resolve(token)).toBeDefined();

    await pool.query(`UPDATE identity_org.user_accounts SET account_state = 'Suspended' WHERE id = $1`, [
      account,
    ]);
    expect(await sessions.resolve(token)).toBeUndefined();
  });

  it('refuses to sign in to a suspended account at all', async () => {
    const account = await makeAccount('Pat');
    await invite(account, 'pat@example.org');
    await sessions.signIn(identity(), nextNonce());
    await pool.query(`UPDATE identity_org.user_accounts SET account_state = 'Suspended' WHERE id = $1`, [
      account,
    ]);
    await expect(sessions.signIn(identity(), nextNonce())).rejects.toThrow(/cannot be used to sign in/);
  });

  /**
   * The nonce is short-lived, which bounds a replayed Google token to
   * minutes. Recording it makes that window zero.
   */
  it('refuses to exchange the same sign-in nonce twice', async () => {
    const account = await makeAccount('Pat');
    await invite(account, 'pat@example.org');
    const nonce = nextNonce();
    await sessions.signIn(identity(), nonce);
    await expect(sessions.signIn(identity(), nonce)).rejects.toThrow();
  });

  /* ---------------------------------------------------------------- */
  /* Authentication strength                                           */
  /* ---------------------------------------------------------------- */

  /**
   * A plain Google sign-in proves the person holds that Google account and
   * nothing more. Google's ID tokens carry no `amr`, so recording anything
   * stronger here would be the platform telling its own permission engine
   * something nobody established.
   */
  it('treats an ordinary Google sign-in as password strength, never mfa', async () => {
    const account = await makeAccount('Pat');
    await invite(account, 'pat@example.org');
    const result = await sessions.signIn(identity(), nextNonce());
    expect(result.authStrength).toBe('password');
  });

  it('records mfa only for a hosted domain the operator has vouched for', async () => {
    const account = await makeAccount('Staff');
    await invite(account, 'staff@mfa-enforced.test');
    const result = await sessions.signIn(
      identity({ subject: 'google-sub-staff', email: 'staff@mfa-enforced.test', hostedDomain: 'mfa-enforced.test' }),
      nextNonce(),
    );
    expect(result.authStrength).toBe('mfa');
  });

  it('raises a session to step-up after a fresh re-authentication', async () => {
    const account = await makeAccount('Pat');
    await invite(account, 'pat@example.org');
    const { token } = await sessions.signIn(identity(), nextNonce());
    expect((await sessions.resolve(token))?.authStrength).toBe('password');

    await sessions.stepUp(token, identity());
    expect((await sessions.resolve(token))?.authStrength).toBe('step-up');
  });

  /**
   * Step-up is what stands in front of approving an intervention version
   * and deciding an export. If any accepted Google account could raise
   * anybody's session, the strongest tier on the platform would be the
   * easiest one to obtain.
   */
  it('refuses to raise a session with somebody else\'s Google account', async () => {
    const pat = await makeAccount('Pat');
    await invite(pat, 'pat@example.org');
    const { token } = await sessions.signIn(identity(), nextNonce());

    const other = await makeAccount('Sam');
    await invite(other, 'sam@example.org');
    const samIdentity = identity({ subject: 'google-sub-sam', email: 'sam@example.org' });
    await sessions.signIn(samIdentity, nextNonce());

    await expect(sessions.stepUp(token, samIdentity)).rejects.toThrow(/different Google account/);
    expect((await sessions.resolve(token))?.authStrength).toBe('password');
  });

  it('refuses to raise a session that has been signed out', async () => {
    const account = await makeAccount('Pat');
    await invite(account, 'pat@example.org');
    const { token } = await sessions.signIn(identity(), nextNonce());
    await sessions.signOut(token);
    await expect(sessions.stepUp(token, identity())).rejects.toThrow();
  });
});
