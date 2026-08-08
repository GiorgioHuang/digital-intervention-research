import { generateKeyPair, exportJWK, SignJWT, type JWTVerifyGetKey } from 'jose';
import { beforeAll, describe, expect, it } from 'vitest';
import { createGoogleVerifier, issueNonce, nonceIsValid } from '../src/auth/google-token.js';

/**
 * Verifying what Google actually said.
 *
 * These tests forge tokens with a locally generated key and hand them to
 * the verifier. Every case here is one where the token is well-formed and
 * plausible and must still be refused — because a verifier that says no to
 * garbage and yes to a near-miss is a verifier that is not doing anything.
 */

const CLIENT_ID = '1234.apps.googleusercontent.com';
const ISSUER = 'https://accounts.google.com';
const SECRET = 'a'.repeat(32);

let signingKey: CryptoKey;
let getKey: JWTVerifyGetKey;
let wrongKey: CryptoKey;

beforeAll(async () => {
  const pair = await generateKeyPair('RS256', { extractable: true });
  signingKey = pair.privateKey;
  const publicJwk = await exportJWK(pair.publicKey);
  publicJwk.alg = 'RS256';
  // Stands in for Google's JWKS endpoint. The verifier is otherwise
  // identical to the one production builds.
  getKey = (async () => pair.publicKey) as unknown as JWTVerifyGetKey;
  const other = await generateKeyPair('RS256', { extractable: true });
  wrongKey = other.privateKey;
  void publicJwk;
});

interface TokenOverrides {
  aud?: string;
  iss?: string;
  nonce?: string;
  expiresIn?: string;
  issuedAt?: number;
  email?: string;
  emailVerified?: boolean;
  hd?: string;
  sub?: string;
  key?: CryptoKey;
}

async function token(overrides: TokenOverrides = {}): Promise<string> {
  const jwt = new SignJWT({
    nonce: overrides.nonce ?? 'nonce-1',
    email: overrides.email ?? 'pat@example.org',
    email_verified: overrides.emailVerified ?? true,
    ...(overrides.hd !== undefined ? { hd: overrides.hd } : {}),
    name: 'Pat',
  })
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuer(overrides.iss ?? ISSUER)
    .setAudience(overrides.aud ?? CLIENT_ID)
    .setSubject(overrides.sub ?? 'google-sub-1')
    .setExpirationTime(overrides.expiresIn ?? '1h');
  if (overrides.issuedAt !== undefined) jwt.setIssuedAt(overrides.issuedAt);
  else jwt.setIssuedAt();
  return jwt.sign(overrides.key ?? signingKey);
}

function verifier(allowedDomains: string[] = []) {
  return createGoogleVerifier({ clientId: CLIENT_ID, allowedDomains, getKey });
}

describe('what a Google ID token is allowed to prove', () => {
  it('accepts a well-formed token and reports who it is', async () => {
    const identity = await verifier().verify(await token(), 'nonce-1');
    expect(identity.subject).toBe('google-sub-1');
    expect(identity.emailVerified).toBe(true);
    expect(identity.email).toBe('pat@example.org');
  });

  it('accepts the bare issuer spelling Google also uses', async () => {
    const identity = await verifier().verify(await token({ iss: 'accounts.google.com' }), 'nonce-1');
    expect(identity.subject).toBe('google-sub-1');
  });

  /**
   * A token minted for a DIFFERENT application, signed by Google, entirely
   * valid. Any Google developer can obtain one for their own client and
   * for this same person. Without the audience check it would sign them in
   * here, which is the single most consequential line in the verifier.
   */
  it('refuses a token addressed to another application', async () => {
    await expect(verifier().verify(await token({ aud: 'someone-else.apps.googleusercontent.com' }), 'nonce-1')).rejects.toThrow();
  });

  it('refuses a token from an issuer that is not Google', async () => {
    await expect(verifier().verify(await token({ iss: 'https://accounts.evil.test' }), 'nonce-1')).rejects.toThrow();
  });

  it('refuses a token signed by a key that is not the published one', async () => {
    await expect(verifier().verify(await token({ key: wrongKey }), 'nonce-1')).rejects.toThrow();
  });

  it('refuses an expired token', async () => {
    await expect(verifier().verify(await token({ expiresIn: '-1h' }), 'nonce-1')).rejects.toThrow();
  });

  /**
   * The nonce is what ties a token to THIS sign-in attempt. Without the
   * check, a token captured anywhere else and still inside its hour is
   * replayable here.
   */
  it('refuses a token carrying a nonce this sign-in did not ask for', async () => {
    await expect(verifier().verify(await token({ nonce: 'someone-elses-nonce' }), 'nonce-1')).rejects.toThrow();
  });

  it('refuses a token carrying no nonce at all', async () => {
    const bare = await new SignJWT({ email: 'pat@example.org', email_verified: true })
      .setProtectedHeader({ alg: 'RS256' })
      .setIssuer(ISSUER)
      .setAudience(CLIENT_ID)
      .setSubject('google-sub-1')
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(signingKey);
    await expect(verifier().verify(bare, 'nonce-1')).rejects.toThrow();
  });

  /**
   * Algorithm confusion, and the pin that refuses it.
   *
   * The attack: sign a token with HMAC and let the verifier take the
   * algorithm from the token's own header. Whether it succeeds depends on
   * whether the key resolver hands back something usable as an HMAC
   * secret — so a test that resolves to an RSA key proves nothing, because
   * jose would refuse that pairing with or without the pin. It has to be
   * asked the question it is actually there to answer.
   *
   * So this resolver is deliberately permissive: it returns a symmetric
   * key, exactly as a resolver written against a JWKS containing one
   * would. `algorithms: ['RS256']` is then the ONLY thing standing between
   * a token anybody can mint and a signed-in session, and removing that
   * line turns this test red.
   */
  it('refuses a symmetric-algorithm token even when the key resolver offers a usable secret', async () => {
    const shared = new Uint8Array(32);
    const permissive = createGoogleVerifier({
      clientId: CLIENT_ID,
      allowedDomains: [],
      getKey: (async () => shared) as unknown as JWTVerifyGetKey,
    });
    const forged = await new SignJWT({ nonce: 'nonce-1', email: 'pat@example.org', email_verified: true })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuer(ISSUER)
      .setAudience(CLIENT_ID)
      .setSubject('google-sub-1')
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(shared);
    await expect(permissive.verify(forged, 'nonce-1')).rejects.toThrow();
  });
});

describe('restricting sign-in to an organisation domain', () => {
  it('accepts a Workspace account whose hosted domain is allowed', async () => {
    const identity = await verifier(['workspace.test']).verify(
      await token({ hd: 'workspace.test', email: 'staff@workspace.test' }),
      'nonce-1',
    );
    expect(identity.hostedDomain).toBe('workspace.test');
  });

  /**
   * The trap this check exists for.
   *
   * A personal Gmail account can set its display email to almost anything,
   * and `email` is not proof of organisational membership even when
   * verified. `hd` is Google asserting "this account belongs to that
   * Workspace domain" and is the only claim that means it. A restriction
   * implemented by looking at the text after the `@` would let anybody in
   * who could register an address that ends the right way.
   */
  it('refuses a personal account whose email merely ends in the allowed domain', async () => {
    await expect(
      verifier(['workspace.test']).verify(await token({ email: 'attacker@workspace.test' }), 'nonce-1'),
    ).rejects.toThrow(/not from an organisation/);
  });

  it('refuses a Workspace account from a domain that is not listed', async () => {
    await expect(
      verifier(['workspace.test']).verify(await token({ hd: 'elsewhere.test', email: 'x@elsewhere.test' }), 'nonce-1'),
    ).rejects.toThrow(/not from an organisation/);
  });

  it('lets any Google account through when no domain is configured', async () => {
    const identity = await verifier([]).verify(await token({ email: 'someone@gmail.com' }), 'nonce-1');
    // Which grants nothing: an invitation is still required to become
    // anybody on this platform. See the session store's tests.
    expect(identity.subject).toBe('google-sub-1');
  });
});

describe('sign-in nonces', () => {
  const NOW = 1_770_000_000_000;

  it('accepts one it just issued', () => {
    expect(nonceIsValid(SECRET, issueNonce(SECRET, NOW), NOW + 1000)).toBe(true);
  });

  it('refuses one that has aged out', () => {
    expect(nonceIsValid(SECRET, issueNonce(SECRET, NOW), NOW + 6 * 60_000)).toBe(false);
  });

  it('refuses one signed with a different secret', () => {
    expect(nonceIsValid(SECRET, issueNonce('b'.repeat(32), NOW), NOW + 1000)).toBe(false);
  });

  /**
   * The expiry is inside the signed body, so moving it invalidates the
   * signature. Checking expiry BEFORE the signature would read a number
   * the caller chose — and a caller who can choose it can choose one in
   * the next century.
   */
  it('refuses one whose expiry has been edited forward', () => {
    const [random, expiry, sig] = issueNonce(SECRET, NOW).split('.') as [string, string, string];
    const far = String(Number.parseInt(expiry, 10) + 10_000_000);
    expect(nonceIsValid(SECRET, `${random}.${far}.${sig}`, NOW + 1000)).toBe(false);
  });

  it('refuses malformed input rather than throwing', () => {
    for (const bad of ['', 'x', 'a.b', 'a.b.c.d']) {
      expect(nonceIsValid(SECRET, bad, NOW)).toBe(false);
    }
  });
});
