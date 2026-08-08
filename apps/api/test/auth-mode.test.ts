import type { NextFunction, Request, Response } from 'express';
import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config.js';
import { requestContextMiddleware, type PlatformRequest } from '../src/http-context.js';

const BASE = {
  DATABASE_URL: 'postgres://u:p@localhost:5432/db',
  LOG_LEVEL: 'error',
} as NodeJS.ProcessEnv;

function contextFor(authMode: string, headers: Record<string, string>) {
  const req = { headers } as unknown as Request;
  requestContextMiddleware(authMode)(req, {} as Response, (() => {}) as NextFunction);
  return (req as PlatformRequest).platformCtx;
}

/**
 * What the authentication stub is, and what has to stop working when it
 * goes away.
 *
 * There is one implemented mode: `dev-header`, in which the actor is
 * whoever the `x-actor-id` header says. It is a development and synthetic
 * pilot stub, held shut in deployments by a shared access token that is a
 * perimeter and not authentication. `oidc` (ADR-104) names the target and
 * nothing implements it.
 */
describe('the authentication stub, and the mode that is only a name', () => {
  it('defaults to the stub rather than to something unimplemented', () => {
    expect(loadConfig(BASE).AUTH_MODE).toBe('dev-header');
  });

  /**
   * Setting `oidc` used to be accepted. The process then started
   * cleanly and refused every request, because no actor is ever
   * resolved — fail closed, and indistinguishable from a platform that
   * is simply broken. The configuration is refused instead, and the
   * message says which of the two it is.
   */
  it('refuses to start in a mode nothing implements, and says why', () => {
    expect(() => loadConfig({ ...BASE, AUTH_MODE: 'oidc' })).toThrow(/ADR-104|NOT implemented/);
  });

  it('reads the actor and the auth strength from headers while the stub is on', () => {
    const ctx = contextFor('dev-header', { 'x-actor-id': 'actor_1', 'x-auth-strength': 'mfa' });
    expect(ctx.actor).toEqual({ type: 'user', id: 'actor_1' });
    expect(ctx.authStrength).toBe('mfa');
  });

  /**
   * The one that matters for ADR-104.
   *
   * The strength header was read in EVERY mode, while the actor header
   * was read only under the stub. So an OIDC implementation that
   * resolved identity properly would still have accepted a client's own
   * claim to be `mfa` — and the strong-authentication tier is what
   * guards approving an intervention version and deciding an export.
   * The check would have looked present and been worth nothing.
   *
   * Both must go quiet together. A real implementation takes the
   * strength from the token's claims; until it does, the honest answer
   * is that this request has no strength at all.
   */
  it('reads neither once the stub is off, so nothing can claim its own strength', () => {
    const ctx = contextFor('oidc', { 'x-actor-id': 'actor_1', 'x-auth-strength': 'mfa' });
    expect(ctx.actor).toBeUndefined();
    expect(ctx.authStrength, 'a client must not be able to declare its own authentication strength').toBeUndefined();
  });

  /**
   * Headers that are references rather than grants stay readable in any
   * mode — they name an organisation or a purpose to re-evaluate against
   * and confer nothing on their own (Doc 14). Pinned so that fixing the
   * strength leak above is not read as "stop reading headers".
   */
  it('still reads the headers that grant nothing by themselves', () => {
    const ctx = contextFor('oidc', { 'x-organisation-id': 'org_1', 'x-purpose-code': 'care' });
    expect(ctx.organisationId).toBe('org_1');
    expect(ctx.purposeCode).toBe('care');
  });
});
