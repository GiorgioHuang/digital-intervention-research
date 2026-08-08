import type { NextFunction, Request, Response } from 'express';
import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config.js';
import {
  requestContextMiddleware,
  type PlatformRequest,
  type ResolvedSession,
} from '../src/http-context.js';

const BASE = {
  DATABASE_URL: 'postgres://u:p@localhost:5432/db',
  LOG_LEVEL: 'error',
} as NodeJS.ProcessEnv;

const GOOGLE_ENV = {
  ...BASE,
  AUTH_MODE: 'google',
  GOOGLE_CLIENT_ID: '1234.apps.googleusercontent.com',
  SESSION_SECRET: 'x'.repeat(32),
} as NodeJS.ProcessEnv;

interface CallOptions {
  headers?: Record<string, string>;
  method?: string;
  session?: ResolvedSession | undefined;
}

async function contextFor(authMode: string, options: CallOptions = {}) {
  const req = {
    headers: options.headers ?? {},
    method: options.method ?? 'GET',
  } as unknown as Request;
  const middleware = requestContextMiddleware({
    authMode,
    ...(authMode === 'google'
      ? { resolveSession: async (): Promise<ResolvedSession | undefined> => options.session }
      : {}),
  });
  await new Promise<void>((resolve, reject) => {
    middleware(req, {} as Response, ((err?: unknown) => (err ? reject(err) : resolve())) as NextFunction);
  });
  return (req as PlatformRequest).platformCtx;
}

const SESSION: ResolvedSession = { userAccountId: 'acct_1', authStrength: 'mfa' };
const COOKIE = { cookie: 'platform_session=tok-1' };

/**
 * Who the platform thinks is asking.
 *
 * Two modes with nothing shared between them: `google` resolves a session
 * cookie this platform issued, `dev-header` believes a header. The tests
 * that matter here are the ones proving the second cannot leak into the
 * first.
 */
describe('the two authentication modes, and the wall between them', () => {
  it('defaults to the development stub rather than to something half-configured', () => {
    expect(loadConfig(BASE).AUTH_MODE).toBe('dev-header');
  });

  it('accepts a complete Google configuration', () => {
    const config = loadConfig(GOOGLE_ENV);
    expect(config.AUTH_MODE).toBe('google');
    expect(config.SESSION_TTL_MINUTES).toBe(720);
  });

  /**
   * The mode used to be called `oidc` while ADR-104 was undecided. An old
   * deployment carrying that value should be told what it is now, not
   * quietly treated as something adjacent.
   */
  it('refuses the old placeholder mode name and says what replaced it', () => {
    expect(() => loadConfig({ ...BASE, AUTH_MODE: 'oidc' })).toThrow(/AUTH_MODE=google/);
  });

  it.each([['GOOGLE_CLIENT_ID'], ['SESSION_SECRET']])(
    'refuses to start in Google mode without %s',
    (missing) => {
      const env = { ...GOOGLE_ENV };
      delete env[missing];
      expect(() => loadConfig(env)).toThrow(new RegExp(missing));
    },
  );

  it('refuses a session secret too short to be worth signing with', () => {
    expect(() => loadConfig({ ...GOOGLE_ENV, SESSION_SECRET: 'short' })).toThrow(/SESSION_SECRET/);
  });

  /* ------------------------------------------------------------------ */

  it('reads the actor and strength from headers while the stub is on', async () => {
    const ctx = await contextFor('dev-header', {
      headers: { 'x-actor-id': 'actor_1', 'x-auth-strength': 'mfa' },
    });
    expect(ctx.actor).toEqual({ type: 'user', id: 'actor_1' });
    expect(ctx.authStrength).toBe('mfa');
  });

  /**
   * The one that matters for ADR-104.
   *
   * The strength header was once read in EVERY mode while the actor header
   * was read only under the stub — so a correct Google implementation
   * would still have accepted a client's own claim to be `mfa`, and the
   * strong tier guards approving an intervention version and deciding an
   * export. Both must go quiet together.
   */
  it('ignores both auth headers entirely once the stub is off', async () => {
    const ctx = await contextFor('google', {
      headers: { 'x-actor-id': 'actor_1', 'x-auth-strength': 'mfa' },
    });
    expect(ctx.actor).toBeUndefined();
    expect(
      ctx.authStrength,
      'a client must not be able to declare its own authentication strength',
    ).toBeUndefined();
  });

  /**
   * And the same in the presence of a real session: a header must not be
   * able to upgrade a genuine sign-in either. Somebody signed in at
   * `password` who can reach `step-up` by adding a header has defeated
   * every step-up check on the platform.
   */
  it('does not let a header raise the strength of a real session', async () => {
    const ctx = await contextFor('google', {
      headers: { ...COOKIE, 'x-auth-strength': 'step-up' },
      session: { userAccountId: 'acct_1', authStrength: 'password' },
    });
    expect(ctx.actor).toEqual({ type: 'user', id: 'acct_1' });
    expect(ctx.authStrength).toBe('password');
  });

  it('resolves the session cookie to an actor', async () => {
    const ctx = await contextFor('google', { headers: COOKIE, session: SESSION });
    expect(ctx.actor).toEqual({ type: 'user', id: 'acct_1' });
    expect(ctx.authStrength).toBe('mfa');
  });

  it('carries no actor when there is no cookie', async () => {
    const ctx = await contextFor('google', { session: SESSION });
    expect(ctx.actor).toBeUndefined();
  });

  it('carries no actor when the session no longer resolves', async () => {
    const ctx = await contextFor('google', { headers: COOKIE, session: undefined });
    expect(ctx.actor).toBeUndefined();
  });

  /* ------------------------------------------------------------------ */

  /**
   * Cross-site request forgery. The browser attaches the session cookie to
   * a form post from anybody's page; SameSite=Lax is the first lock and
   * this header is the second, because a cross-site form cannot set one at
   * all. Without it a participant merely visiting a page could have
   * something changed in their name.
   */
  it('refuses to authenticate a state-changing request without the client header', async () => {
    const ctx = await contextFor('google', { headers: COOKIE, method: 'POST', session: SESSION });
    expect(ctx.actor).toBeUndefined();
  });

  it('authenticates a state-changing request that carries the client header', async () => {
    const ctx = await contextFor('google', {
      headers: { ...COOKIE, 'x-platform-client': 'web' },
      method: 'POST',
      session: SESSION,
    });
    expect(ctx.actor).toEqual({ type: 'user', id: 'acct_1' });
  });

  it.each([['DELETE'], ['PUT'], ['PATCH']])('applies the same rule to %s', async (method) => {
    const ctx = await contextFor('google', { headers: COOKIE, method, session: SESSION });
    expect(ctx.actor).toBeUndefined();
  });

  it('leaves reads alone, which need no such header', async () => {
    const ctx = await contextFor('google', { headers: COOKIE, method: 'GET', session: SESSION });
    expect(ctx.actor).toEqual({ type: 'user', id: 'acct_1' });
  });

  /* ------------------------------------------------------------------ */

  /**
   * Headers that are references rather than grants stay readable in every
   * mode — they name an organisation or a purpose to re-evaluate against
   * and confer nothing on their own (Doc 14). Pinned so that closing the
   * strength hole is not read as "stop reading headers".
   */
  it('still reads the headers that grant nothing by themselves', async () => {
    const ctx = await contextFor('google', {
      headers: { 'x-organisation-id': 'org_1', 'x-purpose-code': 'care' },
    });
    expect(ctx.organisationId).toBe('org_1');
    expect(ctx.purposeCode).toBe('care');
  });
});
