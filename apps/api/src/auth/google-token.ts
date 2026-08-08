import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose';
import { PlatformError } from '@platform/kernel';

/**
 * Verifying a Google ID token (ADR-104).
 *
 * Everything here is a check that fails closed. The failure mode of this
 * file is not "sign-in is broken" — that gets noticed in a minute — it is
 * "sign-in accepts something it should not", which gets noticed never. So
 * each claim is checked explicitly and the reasons are written down.
 */

/**
 * Google signs with both spellings and has done for years; a token bearing
 * the one you did not list is a valid token from the right issuer.
 */
const GOOGLE_ISSUERS = ['https://accounts.google.com', 'accounts.google.com'];

const GOOGLE_JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs';

export interface GoogleIdentity {
  issuer: string;
  subject: string;
  email?: string | undefined;
  emailVerified: boolean;
  hostedDomain?: string | undefined;
  displayName?: string | undefined;
  /** Seconds since the epoch — when Google issued this token. */
  issuedAt: number;
}

export interface GoogleVerifierOptions {
  clientId: string;
  allowedDomains: readonly string[];
  /** Injectable for tests; production reaches Google's JWKS endpoint. */
  getKey?: JWTVerifyGetKey;
}

export interface GoogleVerifier {
  verify(idToken: string, expectedNonce: string): Promise<GoogleIdentity>;
}

function authFailed(message: string): PlatformError {
  // One outward-facing code for every way a token can be wrong. Which
  // check failed is worth a great deal to an attacker probing the
  // endpoint and nothing at all to the person trying to sign in, who
  // needs "that did not work, try again" and not a taxonomy.
  return new PlatformError('AUTHENTICATION_REQUIRED', message);
}

export function createGoogleVerifier(options: GoogleVerifierOptions): GoogleVerifier {
  // Cached across requests by jose, which also honours the endpoint's
  // cache headers and re-fetches when a token arrives with an unknown
  // `kid`. Built once: a per-request JWKS set would fetch Google's keys
  // on every sign-in and turn their availability into ours.
  const getKey = options.getKey ?? createRemoteJWKSet(new URL(GOOGLE_JWKS_URL));

  return {
    async verify(idToken: string, expectedNonce: string): Promise<GoogleIdentity> {
      let payload;
      try {
        ({ payload } = await jwtVerify(idToken, getKey, {
          issuer: GOOGLE_ISSUERS,
          audience: options.clientId,
          // Pinned, and this is the one line here that is load-bearing
          // against a whole class of attack: without it a token whose
          // header says `alg: none`, or one signed with HMAC using a
          // public key as the secret, is a token this function would
          // otherwise be willing to consider.
          algorithms: ['RS256'],
          // Google's ID tokens live an hour and `jwtVerify` enforces
          // `exp` itself. The tolerance covers clock skew between this
          // container and Google, in the small direction only.
          clockTolerance: 30,
        }));
      } catch {
        throw authFailed('Google sign-in could not be verified');
      }

      const subject = typeof payload.sub === 'string' ? payload.sub : '';
      if (subject === '') throw authFailed('Google sign-in could not be verified');

      // The nonce binds this token to the sign-in attempt that asked for
      // it. Without it, an ID token minted for this same client in some
      // other context is replayable here for as long as it lives.
      const nonce = typeof payload['nonce'] === 'string' ? payload['nonce'] : '';
      if (!constantTimeEquals(nonce, expectedNonce)) {
        throw authFailed('Google sign-in could not be verified');
      }

      const emailVerified = payload['email_verified'] === true;
      const email = typeof payload['email'] === 'string' ? payload['email'] : undefined;
      const hostedDomain = typeof payload['hd'] === 'string' ? payload['hd'] : undefined;

      // A domain restriction, when configured, is checked against `hd` and
      // never against the email's text after an `@`. `hd` is asserted by
      // Google for Workspace accounts; an address ending in the right
      // characters is asserted by whoever typed it, and a personal Gmail
      // account can be named to end in almost anything.
      if (options.allowedDomains.length > 0) {
        const domain = hostedDomain?.toLowerCase() ?? '';
        if (!options.allowedDomains.includes(domain)) {
          throw new PlatformError(
            'AUTHORISATION_DENIED',
            'That Google account is not from an organisation this platform accepts',
          );
        }
      }

      return {
        issuer: typeof payload.iss === 'string' ? payload.iss : GOOGLE_ISSUERS[0]!,
        subject,
        email,
        emailVerified,
        hostedDomain,
        displayName: typeof payload['name'] === 'string' ? payload['name'] : undefined,
        issuedAt: typeof payload.iat === 'number' ? payload.iat : 0,
      };
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Nonces                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Sign-in nonces are signed rather than stored: a table of pending nonces
 * is a table that needs sweeping, and everything needed to trust one fits
 * in the value itself. Single use is enforced elsewhere, when the session
 * is written — see the unique index on auth_sessions.sign_in_nonce. This
 * function is the "not older than a few minutes, and minted by us" half.
 */
const NONCE_TTL_SECONDS = 300;

export function issueNonce(secret: string, nowMs: number): string {
  const random = randomBytes(16).toString('base64url');
  const expiry = Math.floor(nowMs / 1000) + NONCE_TTL_SECONDS;
  const body = `${random}.${expiry}`;
  return `${body}.${sign(secret, body)}`;
}

export function nonceIsValid(secret: string, nonce: string, nowMs: number): boolean {
  const parts = nonce.split('.');
  if (parts.length !== 3) return false;
  const [random, expiry, signature] = parts as [string, string, string];
  // Signature first: an expiry read off an unverified string is a number
  // the caller chose, and comparing against it before checking the
  // signature would let anybody mint a nonce that never expires.
  if (!constantTimeEquals(signature, sign(secret, `${random}.${expiry}`))) return false;
  const expiresAt = Number.parseInt(expiry, 10);
  return Number.isFinite(expiresAt) && expiresAt * 1000 > nowMs;
}

function sign(secret: string, body: string): string {
  return createHmac('sha256', secret).update(body).digest('base64url');
}

function constantTimeEquals(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  // timingSafeEqual throws on a length mismatch rather than returning
  // false, and the lengths here are not secret.
  if (left.length !== right.length || left.length === 0) return false;
  return timingSafeEqual(left, right);
}
