import pg from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createPool, migrate, type Pool } from '@platform/database';
import { newId } from '@platform/kernel';
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
    });
  });

  afterAll(async () => {
    await pool.end();
  });

  beforeEach(async () => {
    await pool.query('DELETE FROM identity_org.auth_sessions');
    await pool.query('DELETE FROM identity_org.account_invitations');
    await pool.query('DELETE FROM identity_org.external_identities');
  });

  /* ---------------------------------------------------------------- */
  /* Getting in at all                                                */
  /* ---------------------------------------------------------------- */

  /**
   * The default answer. Anybody in the world can obtain a Google account
   * and present a perfectly valid token; if that were enough, the platform
   * would be open to everyone with a browser.
   */
  it('refuses a Google account nobody invited', async () => {
    await expect(sessions.signIn(identity(), nextNonce())).rejects.toThrow(/not been invited/);
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
    await expect(
      sessions.signIn(identity({ emailVerified: false }), nextNonce()),
    ).rejects.toThrow(/not been invited/);
  });

  it('refuses an invitation that has expired', async () => {
    const account = await makeAccount('Pat');
    await invite(account, 'pat@example.org', -1);
    await expect(sessions.signIn(identity(), nextNonce())).rejects.toThrow(/not been invited/);
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

    await expect(
      sessions.signIn(identity({ subject: 'google-sub-somebody-else' }), nextNonce()),
    ).rejects.toThrow(/not been invited/);
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
