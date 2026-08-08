import { createHash, randomBytes } from 'node:crypto';
import type { Pool } from '@platform/database';
import { PlatformError, newId } from '@platform/kernel';
import type { AuthStrength } from '@platform/policy';
import type { GoogleIdentity } from './google-token.js';

/**
 * Sessions, and the two things that decide who a signed-in person is.
 *
 * Google says "this is the holder of Google account `sub`". That sentence
 * contains no platform account, no role, and no permission. Turning it
 * into one is this file's whole job, and it refuses by default: a Google
 * account that matches no link and no invitation gets nothing. There is no
 * self-signup, because on a platform holding older adults' health data the
 * question "who let this person in" must always have an answer, and
 * "they had a Google account" is not one.
 */

export interface AuthenticatedSession {
  sessionId: string;
  userAccountId: string;
  authStrength: AuthStrength;
  expiresAt: Date;
}

export interface SignInResult extends AuthenticatedSession {
  /**
   * The cookie value. This is the only moment it exists in readable form
   * anywhere — the database holds its SHA-256 and nothing else.
   */
  token: string;
  displayName: string;
}

export interface SessionStoreOptions {
  pool: Pool;
  sessionTtlMinutes: number;
  stepUpTtlMinutes: number;
  /** Domains where the operator asserts 2-Step Verification is enforced. */
  mfaDomains: readonly string[];
  now?: () => Date;
}

/** Account states a sign-in may proceed from. */
const SIGN_IN_STATES = new Set(['Active', 'Invited', 'Restricted']);

export interface SessionStore {
  signIn(identity: GoogleIdentity, nonce: string): Promise<SignInResult>;
  resolve(token: string): Promise<AuthenticatedSession | undefined>;
  stepUp(token: string, identity: GoogleIdentity): Promise<AuthenticatedSession>;
  signOut(token: string): Promise<void>;
}

export function createSessionStore(options: SessionStoreOptions): SessionStore {
  const { pool } = options;
  const now = options.now ?? ((): Date => new Date());
  const mfaDomains = options.mfaDomains.map((d) => d.toLowerCase());

  return {
    async signIn(identity: GoogleIdentity, nonce: string): Promise<SignInResult> {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // Matched on (issuer, subject). Never on email — see the migration
        // for why an address is not an identity.
        const linked = await client.query<{ id: string; user_account_id: string }>(
          `SELECT id, user_account_id
             FROM identity_org.external_identities
            WHERE issuer = $1 AND subject = $2
            FOR UPDATE`,
          [identity.issuer, identity.subject],
        );

        const identityRow =
          linked.rows[0] ?? (await claimInvitation(client, identity));

        const account = await client.query<{ display_name: string; account_state: string }>(
          `SELECT display_name, account_state
             FROM identity_org.user_accounts
            WHERE id = $1`,
          [identityRow.user_account_id],
        );
        const accountRow = account.rows[0];
        if (accountRow === undefined || !SIGN_IN_STATES.has(accountRow.account_state)) {
          // Suspending an account is a safety action on this platform. It
          // has to stop the next sign-in as well as the current session,
          // or it stops nothing that matters.
          throw new PlatformError('AUTHORISATION_DENIED', 'This account cannot be used to sign in');
        }
        // A claimed invitation turns an 'Invited' account into a real one.
        if (accountRow.account_state === 'Invited') {
          await client.query(
            `UPDATE identity_org.user_accounts
                SET account_state = 'Active', record_version = record_version + 1, updated_at = now()
              WHERE id = $1`,
            [identityRow.user_account_id],
          );
        }

        await client.query(
          `UPDATE identity_org.external_identities
              SET last_seen_at = now(), email_at_link = $2, updated_at = now()
            WHERE id = $1`,
          [identityRow.id, identity.email ?? null],
        );

        const baseStrength: 'password' | 'mfa' =
          identity.hostedDomain !== undefined && mfaDomains.includes(identity.hostedDomain.toLowerCase())
            ? 'mfa'
            : 'password';

        const token = randomBytes(32).toString('base64url');
        const sessionId = newId('sess');
        const expiresAt = new Date(now().getTime() + options.sessionTtlMinutes * 60_000);

        try {
          await client.query(
            `INSERT INTO identity_org.auth_sessions
               (id, token_hash, user_account_id, external_identity_id,
                base_auth_strength, hosted_domain, sign_in_nonce, expires_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              sessionId,
              hashToken(token),
              identityRow.user_account_id,
              identityRow.id,
              baseStrength,
              identity.hostedDomain ?? null,
              nonce,
              expiresAt,
            ],
          );
        } catch (error) {
          // The nonce's unique index. A second exchange of the same Google
          // token lands here, which is the point: the nonce is short-lived,
          // and this makes the window zero rather than short.
          if (isUniqueViolation(error)) {
            throw new PlatformError('AUTHENTICATION_REQUIRED', 'Google sign-in could not be verified');
          }
          throw error;
        }

        await client.query('COMMIT');
        return {
          sessionId,
          token,
          userAccountId: identityRow.user_account_id,
          displayName: accountRow.display_name,
          authStrength: baseStrength,
          expiresAt,
        };
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    },

    async resolve(token: string): Promise<AuthenticatedSession | undefined> {
      const result = await pool.query<{
        id: string;
        user_account_id: string;
        base_auth_strength: 'password' | 'mfa';
        step_up_until: Date | null;
        expires_at: Date;
        last_seen_at: Date | null;
        account_state: string;
      }>(
        `SELECT s.id, s.user_account_id, s.base_auth_strength, s.step_up_until,
                s.expires_at, s.last_seen_at, a.account_state
           FROM identity_org.auth_sessions s
           JOIN identity_org.user_accounts a ON a.id = s.user_account_id
          WHERE s.token_hash = $1
            AND s.revoked_at IS NULL
            AND s.expires_at > now()`,
        [hashToken(token)],
      );
      const row = result.rows[0];
      if (row === undefined) return undefined;
      // Re-checked on every request, not just at sign-in. A suspension
      // that only stopped the next sign-in would leave whoever is already
      // signed in working for as long as their session had left.
      if (!SIGN_IN_STATES.has(row.account_state)) return undefined;

      // Touched at most every five minutes: "when was this session last
      // used" is worth having, and worth one write per request nowhere.
      const stale =
        row.last_seen_at === null || now().getTime() - row.last_seen_at.getTime() > 5 * 60_000;
      if (stale) {
        await pool.query(`UPDATE identity_org.auth_sessions SET last_seen_at = now() WHERE id = $1`, [
          row.id,
        ]);
      }

      return {
        sessionId: row.id,
        userAccountId: row.user_account_id,
        authStrength: effectiveStrength(row.base_auth_strength, row.step_up_until, now()),
        expiresAt: row.expires_at,
      };
    },

    async stepUp(token: string, identity: GoogleIdentity): Promise<AuthenticatedSession> {
      const result = await pool.query<{
        id: string;
        user_account_id: string;
        base_auth_strength: 'password' | 'mfa';
        expires_at: Date;
        subject: string;
        issuer: string;
      }>(
        `SELECT s.id, s.user_account_id, s.base_auth_strength, s.expires_at,
                e.subject, e.issuer
           FROM identity_org.auth_sessions s
           JOIN identity_org.external_identities e ON e.id = s.external_identity_id
          WHERE s.token_hash = $1
            AND s.revoked_at IS NULL
            AND s.expires_at > now()`,
        [hashToken(token)],
      );
      const row = result.rows[0];
      if (row === undefined) throw new PlatformError('AUTHENTICATION_REQUIRED', 'Authentication required');

      // The re-authentication has to be the same person as the session.
      // Without this check, anybody able to sign in with any accepted
      // Google account could raise the authentication strength of a
      // session belonging to somebody else — which is exactly backwards,
      // since the actions behind step-up are the consequential ones.
      if (row.subject !== identity.subject || row.issuer !== identity.issuer) {
        throw new PlatformError('AUTHORISATION_DENIED', 'That is a different Google account from this session');
      }

      const stepUpUntil = new Date(now().getTime() + options.stepUpTtlMinutes * 60_000);
      await pool.query(
        `UPDATE identity_org.auth_sessions
            SET step_up_until = $2, record_version = record_version + 1, updated_at = now()
          WHERE id = $1`,
        [row.id, stepUpUntil],
      );
      return {
        sessionId: row.id,
        userAccountId: row.user_account_id,
        authStrength: 'step-up',
        expiresAt: row.expires_at,
      };
    },

    async signOut(token: string): Promise<void> {
      await pool.query(
        `UPDATE identity_org.auth_sessions
            SET revoked_at = now(), revoked_reason = 'signed-out', updated_at = now()
          WHERE token_hash = $1 AND revoked_at IS NULL`,
        [hashToken(token)],
      );
    },
  };
}

/**
 * The only path from an unknown Google account to a platform account: a
 * pending invitation addressed to the verified email this token carries.
 *
 * `email_verified` is required because an unverified address is a string
 * somebody typed. Without that check, anyone could create a Google account
 * claiming a coordinator's address and claim their invitation.
 */
async function claimInvitation(
  client: { query: Pool['query'] },
  identity: GoogleIdentity,
): Promise<{ id: string; user_account_id: string }> {
  const refused = new PlatformError(
    'AUTHORISATION_DENIED',
    'That Google account has not been invited to this platform',
  );
  if (!identity.emailVerified || identity.email === undefined) throw refused;

  const invitation = await client.query<{ id: string; user_account_id: string }>(
    `SELECT id, user_account_id
       FROM identity_org.account_invitations
      WHERE issuer = $1
        AND lower(invited_email) = lower($2)
        AND invitation_state = 'Pending'
        AND expires_at > now()
      FOR UPDATE`,
    [identity.issuer, identity.email],
  );
  const row = invitation.rows[0];
  if (row === undefined) throw refused;

  const identityId = newId('extid');
  await client.query(
    `INSERT INTO identity_org.external_identities
       (id, issuer, subject, user_account_id, email_at_link)
     VALUES ($1, $2, $3, $4, $5)`,
    [identityId, identity.issuer, identity.subject, row.user_account_id, identity.email],
  );
  await client.query(
    `UPDATE identity_org.account_invitations
        SET invitation_state = 'Claimed', claimed_at = now(), claimed_identity_id = $2,
            record_version = record_version + 1, updated_at = now()
      WHERE id = $1`,
    [row.id, identityId],
  );
  return { id: identityId, user_account_id: row.user_account_id };
}

function effectiveStrength(
  base: 'password' | 'mfa',
  stepUpUntil: Date | null,
  at: Date,
): AuthStrength {
  if (stepUpUntil !== null && stepUpUntil.getTime() > at.getTime()) return 'step-up';
  return base;
}

export function hashToken(token: string): Buffer {
  return createHash('sha256').update(token).digest();
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: string }).code === '23505';
}
