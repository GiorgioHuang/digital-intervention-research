-- Up Migration
-- Sign in with Google (ADR-104: owner's ruling 2026-08-08 — Google is the
-- identity provider, for staff and participants alike; M01 remains the
-- authority on what a UserAccount may do).
--
-- Three tables, and the difference between them is the whole design:
--   external_identities  — who a Google account IS, forever, matched on `sub`
--   account_invitations  — how a Google account first EARNS a platform account
--   auth_sessions        — a signed-in session this platform can end

-- ---------------------------------------------------------------------------
-- Which Google account is which platform account.
-- ---------------------------------------------------------------------------
CREATE TABLE identity_org.external_identities (
  id               text PRIMARY KEY,
  -- Recorded rather than assumed. Google signs its tokens as one of two
  -- issuer strings and the platform may one day accept a second provider;
  -- a subject is only unique WITHIN an issuer, so the pair is the identity.
  issuer           text NOT NULL,
  -- Google's `sub`. This, and nothing else, is who the person is.
  subject          text NOT NULL,
  user_account_id  text NOT NULL REFERENCES identity_org.user_accounts (id),
  -- Kept for support ("which address did they sign in with?") and NEVER
  -- for matching anybody to anything.
  --
  -- An email address is not an identity. Its owner can rename it, and on
  -- Google Workspace an administrator can reassign it to a different
  -- person after the first one leaves. Code that looked accounts up by
  -- email would hand the second holder of an address everything the first
  -- holder could see — for this platform, a departed coordinator's address
  -- reissued to their replacement would silently carry over that person's
  -- access to participants. `sub` is stable for the life of the Google
  -- account and is never reissued. This column is decorative by design and
  -- there is a test that fails if a lookup starts depending on it.
  email_at_link    text,
  linked_at        timestamptz NOT NULL DEFAULT now(),
  last_seen_at     timestamptz,
  record_version   integer NOT NULL DEFAULT 1,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- The identity itself: one platform account per (issuer, subject).
CREATE UNIQUE INDEX external_identities_subject_unique
  ON identity_org.external_identities (issuer, subject);

-- And the other direction: one Google account per platform account per
-- issuer. Without this, a second link row could quietly give a second
-- person full use of somebody else's account, and the audit trail would
-- show only the account — which is precisely the thing an audit trail on
-- this platform exists to be able to answer.
CREATE UNIQUE INDEX external_identities_account_unique
  ON identity_org.external_identities (user_account_id, issuer);

-- ---------------------------------------------------------------------------
-- How an unknown Google account becomes a known one. There is no self
-- signup: an account is created by somebody who is entitled to create it,
-- and the invitation is what a first sign-in claims. A Google account with
-- no invitation and no link gets nothing.
-- ---------------------------------------------------------------------------
CREATE TABLE identity_org.account_invitations (
  id               text PRIMARY KEY,
  user_account_id  text NOT NULL REFERENCES identity_org.user_accounts (id),
  issuer           text NOT NULL,
  -- Lowercased at write time. This is the ONE place an email address is
  -- allowed to decide anything, and it decides exactly once: which pending
  -- invitation a first sign-in is allowed to claim. The moment it is
  -- claimed, identity becomes the `sub` recorded above and this row is
  -- spent. Reading this as "the platform identifies people by email" is
  -- the error the whole table is shaped to prevent.
  invited_email    text NOT NULL,
  invitation_state text NOT NULL DEFAULT 'Pending'
                   CHECK (invitation_state IN ('Pending', 'Claimed', 'Revoked', 'Expired')),
  -- Invitations expire. An invitation that never expires is a permanent
  -- unclaimed way into an account, sitting in somebody's mailbox.
  expires_at       timestamptz NOT NULL,
  claimed_at       timestamptz,
  claimed_identity_id text REFERENCES identity_org.external_identities (id),
  invited_by       text REFERENCES identity_org.user_accounts (id),
  record_version   integer NOT NULL DEFAULT 1,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- At most one live invitation per address per issuer, so a first sign-in
-- can never face two candidate accounts and pick one.
CREATE UNIQUE INDEX account_invitations_pending_unique
  ON identity_org.account_invitations (issuer, lower(invited_email))
  WHERE invitation_state = 'Pending';

CREATE INDEX account_invitations_account
  ON identity_org.account_invitations (user_account_id);

-- A claimed invitation must say what claimed it; a pending one must not
-- pretend to have been claimed. Half a claim is not a claim.
ALTER TABLE identity_org.account_invitations
  ADD CONSTRAINT account_invitations_claim_complete
  CHECK (
    (invitation_state = 'Claimed') = (claimed_at IS NOT NULL)
    AND (claimed_at IS NULL) = (claimed_identity_id IS NULL)
  );

-- ---------------------------------------------------------------------------
-- Sessions. Server-side and revocable on purpose: suspending an account has
-- to be able to end that person's access now, not in an hour when a
-- self-contained token happens to expire. On a platform where suspension is
-- a safety action, "wait for it to time out" is not an answer.
-- ---------------------------------------------------------------------------
CREATE TABLE identity_org.auth_sessions (
  id                text PRIMARY KEY,
  -- SHA-256 of the cookie value, never the value. A database backup, a log
  -- of a slow query, or a support engineer reading a row must not come away
  -- holding something that can be replayed as a live session.
  token_hash        bytea NOT NULL,
  user_account_id   text NOT NULL REFERENCES identity_org.user_accounts (id),
  external_identity_id text NOT NULL REFERENCES identity_org.external_identities (id),
  -- What the sign-in itself established, before any step-up.
  --
  -- 'password' is what a plain Google sign-in proves: the person holds that
  -- Google account. Whether they used a second factor is NOT in the token —
  -- Google's ID tokens carry no `amr` — so claiming 'mfa' from a bare
  -- sign-in would be a lie the permission engine believes. It is recorded
  -- as 'mfa' only where the operator has asserted, in configuration, that
  -- the hosted domain enforces 2-Step Verification, and `hosted_domain`
  -- below keeps that derivation auditable after the fact.
  base_auth_strength text NOT NULL DEFAULT 'password'
                    CHECK (base_auth_strength IN ('password', 'mfa')),
  hosted_domain     text,
  -- Set by a fresh re-authentication in front of a consequential action
  -- (approving an intervention version, deciding an export). Deliberately
  -- short: it answers "is the person who is about to do this still at the
  -- keyboard", and an answer to that question goes stale in minutes.
  step_up_until     timestamptz,
  -- The nonce this sign-in presented, kept so it cannot be presented
  -- twice. The nonce is signed and short-lived, which bounds a replayed
  -- Google ID token to a few minutes; recording it here makes that zero,
  -- because the second exchange of the same token collides on the unique
  -- index below and is refused. Sessions outlive the nonce window by
  -- hours, so a cleanup pass can never free one early.
  sign_in_nonce     text,
  issued_at         timestamptz NOT NULL DEFAULT now(),
  expires_at        timestamptz NOT NULL,
  last_seen_at      timestamptz,
  revoked_at        timestamptz,
  revoked_reason    text,
  record_version    integer NOT NULL DEFAULT 1,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX auth_sessions_token_hash_unique
  ON identity_org.auth_sessions (token_hash);

CREATE UNIQUE INDEX auth_sessions_nonce_unique
  ON identity_org.auth_sessions (sign_in_nonce)
  WHERE sign_in_nonce IS NOT NULL;

-- "End every session this person has" is a single action, so it gets an
-- index rather than a sequential scan through everybody's sessions.
CREATE INDEX auth_sessions_account_live
  ON identity_org.auth_sessions (user_account_id)
  WHERE revoked_at IS NULL;

CREATE INDEX auth_sessions_expiry
  ON identity_org.auth_sessions (expires_at)
  WHERE revoked_at IS NULL;

-- Down Migration
DROP TABLE identity_org.auth_sessions;
DROP TABLE identity_org.account_invitations;
DROP TABLE identity_org.external_identities;
