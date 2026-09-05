import { createHash, randomBytes } from 'node:crypto';
import type { Pool } from '@platform/database';
import { PlatformError, newId } from '@platform/kernel';
import type { AuthStrength } from '@platform/policy';
import type { GoogleIdentity } from './google-token.js';

/**
 * Sessions, and the three ways somebody comes to have one.
 *
 * Google says "this is the holder of Google account `sub`". That sentence
 * contains no platform account, no role, and no permission. Turning it into
 * one is this file's job, and there are exactly three routes (owner's
 * ruling, 2026-08-08):
 *
 *   ALREADY LINKED   — the `sub` is known. Nothing is granted; the account
 *                      simply is who it was.
 *   INVITATION       — a pending invitation addressed to this verified
 *                      email. This is the ONLY route that grants anything:
 *                      the account it names, or a relationship to the
 *                      participant who sent it.
 *   SELF-SIGNUP      — nobody invited them. They get an account and a
 *                      participant record of their own, and a view of
 *                      nobody. Not a weaker check: an actor with no role
 *                      assignments is denied by the permission engine at
 *                      step 2 ('no-granting-role') for everything it does
 *                      not own, Open Matching requires both sides to have
 *                      opted in, and a community requires a consent scope
 *                      they have not granted. A self-registered account is
 *                      alone on the platform until somebody invites it or
 *                      it consents to something.
 *
 * `origin` is written down for each, because "who let this person in" is a
 * question that must still have an answer once the answer stops being
 * "an administrator did".
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
  /**
   * Whether an uninvited Google account may register itself. When off, the
   * platform is invitation-only and an unknown account is refused — which
   * is the right posture for a deployment whose population is a fixed
   * cohort rather than an open service.
   */
  allowSelfSignup: boolean;
  /** See config: the first administrator, while there is no other. */
  bootstrapAdminEmail?: string | undefined;
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
          linked.rows[0] ??
          (await admit(client, identity, now(), options.allowSelfSignup));

        // An invitation sent to somebody who had ALREADY registered used to
        // sit unclaimed forever: the linked-identity branch returned before
        // anything looked for one. So a participant inviting their daughter,
        // who happens to have signed up last week out of curiosity, would
        // have watched the invitation do nothing at all — with no error, on
        // either side. Grants are applied on every sign-in, and claiming is
        // idempotent because the invitation is marked spent in the same
        // transaction.
        if (linked.rows[0] !== undefined) {
          await applyPendingInvitationTo(client, identity, identityRow.user_account_id, now());
        }

        /*
         * An account with a participant record holds the Participant
         * role. Checked on every sign-in rather than only where the
         * record is made, because everybody already on the platform got
         * their record from a version that wrote no role at all, and a
         * fix that only applies to new arrivals leaves them broken for
         * good — nothing else on this platform would ever grant it to
         * them except a member of staff opening the accounts screen.
         */
        await ensureParticipantRole(client, identityRow.user_account_id);

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

        await maybeBootstrapAdministrator(client, identity, identityRow.user_account_id, options.bootstrapAdminEmail);

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
            AND s.expires_at > $2`,
        [hashToken(token), now()],
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
            AND s.expires_at > $2`,
        [hashToken(token), now()],
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
 * Admits a Google account nobody has seen before: by invitation, or on its
 * own. Returns the identity row now linked to it.
 */
async function admit(
  client: { query: Pool['query'] },
  identity: GoogleIdentity,
  asOf: Date,
  allowSelfSignup: boolean,
): Promise<{ id: string; user_account_id: string }> {
  const invitation = await findPendingInvitation(client, identity, asOf);

  if (invitation === undefined) {
    if (!allowSelfSignup) {
      throw new PlatformError(
        'AUTHORISATION_DENIED',
        'That Google account has not been invited to this platform',
      );
    }
    return selfRegister(client, identity);
  }

  // An invitation may name an account somebody created in advance (staff
  // onboarding, where the roles are already on it) or none at all (a
  // participant inviting somebody into their circle).
  const accountId =
    invitation.user_account_id ??
    (await createAccount(client, identity, 'invitation'));
  const identityId = await linkIdentity(client, identity, accountId);
  await grantInvitation(client, invitation, accountId, identityId);
  return { id: identityId, user_account_id: accountId };
}

/**
 * Applies a pending invitation to somebody who already has an account.
 * Silent when there is none, which is the ordinary case on every sign-in.
 */
async function applyPendingInvitationTo(
  client: { query: Pool['query'] },
  identity: GoogleIdentity,
  accountId: string,
  asOf: Date,
): Promise<void> {
  const invitation = await findPendingInvitation(client, identity, asOf);
  if (invitation === undefined) return;
  // An invitation naming a DIFFERENT pre-created account cannot be applied
  // to this one: the two accounts are two people as far as the audit trail
  // is concerned, and merging them here would be inventing a fact. Left
  // pending so it is visible as unclaimed rather than quietly consumed.
  if (invitation.user_account_id !== null && invitation.user_account_id !== accountId) return;
  const link = await client.query<{ id: string }>(
    `SELECT id FROM identity_org.external_identities WHERE issuer = $1 AND subject = $2`,
    [identity.issuer, identity.subject],
  );
  await grantInvitation(client, invitation, accountId, link.rows[0]!.id);
}

interface PendingInvitation {
  id: string;
  user_account_id: string | null;
  relationship_participant_id: string | null;
  relationship_type: string | null;
  relationship_permitted_actions: string[];
  creates_participant: boolean;
}

/**
 * `email_verified` is required because an unverified address is a string
 * somebody typed into a signup form. Without that check, anyone could make
 * a Google account asserting a coordinator's address and claim their
 * invitation — and with self-signup on, the difference between an invited
 * account and a self-registered one is the whole of what an invitation
 * grants.
 */
async function findPendingInvitation(
  client: { query: Pool['query'] },
  identity: GoogleIdentity,
  asOf: Date,
): Promise<PendingInvitation | undefined> {
  if (!identity.emailVerified || identity.email === undefined) return undefined;
  const result = await client.query<PendingInvitation>(
    `SELECT id, user_account_id, relationship_participant_id, relationship_type,
            relationship_permitted_actions, creates_participant
       FROM identity_org.account_invitations
      WHERE issuer = $1
        AND lower(invited_email) = lower($2)
        AND invitation_state = 'Pending'
        AND expires_at > $3
      FOR UPDATE`,
    [identity.issuer, identity.email, asOf],
  );
  return result.rows[0];
}

/**
 * Spends the invitation and hands over what it carries: a participant
 * record if it makes one, and the relationship that lets its holder see
 * the person who invited them.
 *
 * The relationship is created Active rather than awaiting approval because
 * the participant who sent the invitation IS the approval — they named the
 * address and the actions. It inherits the trust level of email, exactly
 * as every invitation does, which is why invitations expire and why "who
 * has access to me" can revoke this the moment it looks wrong.
 */
async function grantInvitation(
  client: { query: Pool['query'] },
  invitation: PendingInvitation,
  accountId: string,
  identityId: string,
): Promise<void> {
  if (invitation.creates_participant) {
    await ensureParticipant(client, accountId);
  }
  if (invitation.relationship_participant_id !== null) {
    await client.query(
      `INSERT INTO consent_permission.relationships
         (id, participant_id, related_actor_id, relationship_type, relationship_state,
          permitted_actions, proposed_by_actor_id)
       VALUES ($1, $2, $3, $4, 'Active', $5, $2)
       ON CONFLICT DO NOTHING`,
      [
        newId('rel'),
        invitation.relationship_participant_id,
        accountId,
        invitation.relationship_type,
        invitation.relationship_permitted_actions,
      ],
    );
  }
  await client.query(
    `UPDATE identity_org.account_invitations
        SET invitation_state = 'Claimed', claimed_at = now(), claimed_identity_id = $2,
            record_version = record_version + 1, updated_at = now()
      WHERE id = $1`,
    [invitation.id, identityId],
  );
}

/**
 * Registering with nobody's permission. The account is real and it is
 * alone: no role assignments, so the permission engine denies everything it
 * does not own; no relationships, so nobody's information is reachable
 * through one; no consents, so Open Matching and every community stay shut.
 */
async function selfRegister(
  client: { query: Pool['query'] },
  identity: GoogleIdentity,
): Promise<{ id: string; user_account_id: string }> {
  const accountId = await createAccount(client, identity, 'self-registered');
  await ensureParticipant(client, accountId);
  const identityId = await linkIdentity(client, identity, accountId);
  return { id: identityId, user_account_id: accountId };
}

async function createAccount(
  client: { query: Pool['query'] },
  identity: GoogleIdentity,
  origin: 'self-registered' | 'invitation',
): Promise<string> {
  const accountId = newId('acct');
  await client.query(
    `INSERT INTO identity_org.user_accounts (id, display_name, account_state, origin)
     VALUES ($1, $2, 'Active', $3)`,
    // Google's `name` is what the person calls themselves, and it is the
    // only name available at this point. Falling back to the email would
    // print an address at other people on every screen that shows a name.
    [accountId, identity.displayName ?? 'New member', origin],
  );
  return accountId;
}

/**
 * Idempotent: a supporter invited twice, or an account that self-registered
 * and later claims a participant-creating invitation, must not end up as
 * two people. The unique index on (user_account_id) enforces it; this
 * checks first so the ordinary path does not rely on catching an error.
 *
 * The Participant role is NOT granted here. Both callers run inside a
 * sign-in, and the sign-in path checks the invariant afterwards for every
 * account — so a grant here would be a second place doing the same thing
 * that no test could tell apart from the first.
 */
async function ensureParticipant(
  client: { query: Pool['query'] },
  accountId: string,
): Promise<void> {
  const existing = await client.query(
    `SELECT 1 FROM participant_profile.participants WHERE user_account_id = $1`,
    [accountId],
  );
  if (existing.rowCount === 0) {
    const account = await client.query<{ display_name: string }>(
      `SELECT display_name FROM identity_org.user_accounts WHERE id = $1`,
      [accountId],
    );
    await client.query(
      `INSERT INTO participant_profile.participants (id, user_account_id, display_name)
       VALUES ($1, $2, $3)`,
      [newId('pt'), accountId, account.rows[0]?.display_name ?? 'New member'],
    );
  }
}

/**
 * A participant record and the Participant role are the same fact, and
 * only one of them was ever written.
 *
 * Nothing on this platform assigned the Participant role except a staff
 * screen. So everybody who signed in with Google got a participant record
 * and no role — and every screen that reads something SOMEBODY ELSE
 * shared was denied, because those are the only participant actions that
 * are not owner-scoped. The community feed and "stories shared with me"
 * answered 404 for every real person on the platform, while passing their
 * tests, because the test fixtures assign the role by hand.
 *
 * WHAT THIS DOES NOT WIDEN. Every other action the Participant role
 * carries is `ownerOnly`, so it was already reachable by the owner
 * without any role, and the ones that are not owner-only carry their own
 * second gate: the two shared-view actions are resolved against the
 * standing the viewer actually has (`reachOf`, `mayRead`), so somebody
 * with no supporters, no connections and no community still sees nothing.
 * `connection.activate` needs a mutual acceptance and `enrolment.withdraw`
 * needs to be the enrolee. What this grants is the fact that the account
 * is a participant, which is what the role names.
 *
 * Platform-wide (no organisation scope) deliberately: being a participant
 * is not a fact about an organisation, and an org-scoped assignment would
 * stop applying the moment a request carried a different one.
 */
async function ensureParticipantRole(
  client: { query: Pool['query'] },
  accountId: string,
): Promise<void> {
  /*
   * This runs for every account signing in, staff and supporters
   * included, and they must not be given the study's own actions. A
   * participant record is the whole of what makes somebody a
   * participant here.
   */
  const isParticipant = await client.query(
    `SELECT 1 FROM participant_profile.participants WHERE user_account_id = $1`,
    [accountId],
  );
  if (isParticipant.rowCount === 0) return;
  const held = await client.query(
    `SELECT 1 FROM identity_org.role_assignments
      WHERE user_account_id = $1 AND role = 'Participant' AND assignment_state = 'Active'
      LIMIT 1`,
    [accountId],
  );
  if (held.rowCount !== 0) return;
  /*
   * Revoked, suspended or expired assignments are left alone and are not
   * re-granted here: a role somebody took away is a decision, and a
   * sign-in must not quietly undo it. Only an account with no active
   * assignment and no history of one gets it.
   */
  const previous = await client.query(
    `SELECT 1 FROM identity_org.role_assignments
      WHERE user_account_id = $1 AND role = 'Participant' LIMIT 1`,
    [accountId],
  );
  if (previous.rowCount !== 0) return;
  await client.query(
    `INSERT INTO identity_org.role_assignments
       (id, user_account_id, role, assignment_state, assigned_by_actor_id)
     VALUES ($1, $2, 'Participant', 'Active', 'system-registration')
     ON CONFLICT DO NOTHING`,
    [newId('ra'), accountId],
  );
}

/**
 * Granting the first administrator, so that the answer to "how do I get an
 * administrator" is not "open a SQL client against production".
 *
 * Three conditions, and the third is the one that matters: the address must
 * be configured, the token's email must be VERIFIED and equal to it, and
 * the platform must currently have no administrator at all. That last one
 * turns a standing back door into a one-time bootstrap — once anybody
 * holds the role, this function stops doing anything, including for
 * whoever is named in the configuration.
 *
 * Unverified email is refused for the obvious reason: otherwise anyone who
 * learned the configured address could make a Google account asserting it
 * and become the administrator of the platform.
 */
async function maybeBootstrapAdministrator(
  client: { query: Pool['query'] },
  identity: GoogleIdentity,
  userAccountId: string,
  configuredEmail: string | undefined,
): Promise<void> {
  if (configuredEmail === undefined || configuredEmail.trim() === '') return;
  if (!identity.emailVerified || identity.email === undefined) return;
  if (identity.email.trim().toLowerCase() !== configuredEmail.trim().toLowerCase()) return;

  const existing = await client.query(
    `SELECT 1 FROM identity_org.role_assignments
      WHERE role = 'SystemAdministrator' AND assignment_state = 'Active'
      LIMIT 1`,
  );
  if (existing.rowCount !== 0) return;

  await client.query(
    `INSERT INTO identity_org.role_assignments
       (id, user_account_id, role, assignment_state, assigned_by_actor_id)
     VALUES ($1, $2, 'SystemAdministrator', 'Active', 'system-bootstrap')
     ON CONFLICT DO NOTHING`,
    [newId('ra'), userAccountId],
  );
}

async function linkIdentity(
  client: { query: Pool['query'] },
  identity: GoogleIdentity,
  accountId: string,
): Promise<string> {
  const identityId = newId('extid');
  await client.query(
    `INSERT INTO identity_org.external_identities
       (id, issuer, subject, user_account_id, email_at_link)
     VALUES ($1, $2, $3, $4, $5)`,
    [identityId, identity.issuer, identity.subject, accountId, identity.email ?? null],
  );
  return identityId;
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
