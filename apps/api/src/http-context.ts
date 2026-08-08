import { timingSafeEqual } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import { PlatformError, createRequestContext, type RequestContext } from '@platform/kernel';
import { readCookie, SESSION_COOKIE } from './auth/cookies.js';

/**
 * Shared-secret perimeter for cloud deployments: every /v1 request must
 * carry X-Access-Token. Constant-time comparison; a missing or wrong token
 * is 401 in the standard error envelope. This gate is a compensating
 * control in front of the dev-header stub, not authentication (ADR-104).
 */
export function accessTokenMiddleware(token: string) {
  const expected = Buffer.from(token);
  return (req: Request, res: Response, next: NextFunction): void => {
    // originalUrl, not path: inside a mounted middleware `path` is relative
    // to the mount point and the /v1 prefix check would silently pass.
    if (!req.originalUrl.startsWith('/v1')) return next();
    const presented = req.headers['x-access-token'];
    const buf = typeof presented === 'string' ? Buffer.from(presented) : Buffer.alloc(0);
    if (buf.length === expected.length && timingSafeEqual(buf, expected)) return next();
    res.status(401).json({
      error: { code: 'AUTHENTICATION_REQUIRED', message: 'Access token required', requestId: 'unknown', retryable: false },
    });
  };
}

export interface PlatformRequest extends Request {
  platformCtx: RequestContext;
}

/**
 * Request-context middleware (Doc 15 §22 headers), and the one place the
 * platform decides who is asking.
 *
 * Two modes, and no path between them. Under AUTH_MODE=google the actor
 * comes from a session cookie this platform issued after verifying a Google
 * ID token (ADR-104), and headers cannot name an actor at all. Under
 * AUTH_MODE=dev-header the actor is whatever X-Actor-Id says — a
 * development and synthetic-pilot stub, never a deployment holding real
 * people's data.
 *
 * Client-supplied org/project/purpose headers are read in both modes: they
 * are references to re-evaluate against, and they grant nothing by
 * themselves (Doc 14).
 */
export interface RequestContextOptions {
  authMode: string;
  /**
   * Resolves the session cookie to an actor under AUTH_MODE=google. Absent
   * under the stub, which is why the stub cannot accidentally acquire real
   * sessions and real sessions cannot accidentally acquire the stub.
   */
  resolveSession?: (token: string) => Promise<ResolvedSession | undefined>;
}

export interface ResolvedSession {
  userAccountId: string;
  authStrength: 'password' | 'mfa' | 'step-up';
}

/**
 * The session cookie travels on its own, attached by the browser to
 * anything aimed at this origin including a form on somebody else's site.
 * SameSite=Lax already keeps it off cross-site POSTs, and this is the
 * second lock: a custom header cannot be set by a cross-site form at all,
 * and a cross-site fetch that tries earns a preflight this API never
 * approves. Two independent mechanisms, because the cost is one header on
 * a client we write and the failure is somebody's data changed by a page
 * they merely visited.
 */
const CLIENT_HEADER = 'x-platform-client';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function requestContextMiddleware(options: RequestContextOptions | string) {
  const opts: RequestContextOptions = typeof options === 'string' ? { authMode: options } : options;
  const { authMode } = opts;
  return (req: Request, _res: Response, next: NextFunction): void => {
    const header = (name: string): string | undefined => {
      const v = req.headers[name.toLowerCase()];
      return typeof v === 'string' && v !== '' ? v : undefined;
    };
    // Both the identity and its strength are stub input, and both stop
    // being read the moment the stub is off. The strength header used to
    // be read in every mode, which meant the strong-authentication tier —
    // approving an intervention version, deciding an export — would still
    // have been satisfied by a client saying 'mfa' about itself after the
    // stub was replaced. A real implementation has to take it from the
    // token's own claims; leaving the header live would have let the
    // weaker answer keep working, which is the way this kind of thing
    // survives a migration nobody re-reads.
    const stub = authMode === 'dev-header';
    const actorId = stub ? header('x-actor-id') : undefined;
    const strength = stub ? header('x-auth-strength') : undefined;

    // Everything that is not the actor is the same in both modes: these
    // are references to re-evaluate against, and they grant nothing on
    // their own (Doc 14).
    const base = {
      ...(header('x-request-id') !== undefined ? { requestId: header('x-request-id')! } : {}),
      ...(header('x-organisation-id') !== undefined ? { organisationId: header('x-organisation-id')! } : {}),
      ...(header('x-research-project-id') !== undefined ? { researchProjectId: header('x-research-project-id')! } : {}),
      ...(header('x-purpose-code') !== undefined ? { purposeCode: header('x-purpose-code')! } : {}),
    };

    const assign = (actor: { id: string; strength?: 'password' | 'mfa' | 'step-up' } | undefined): void => {
      (req as PlatformRequest).platformCtx = createRequestContext({
        ...base,
        ...(actor !== undefined ? { actor: { type: 'user' as const, id: actor.id } } : {}),
        ...(actor?.strength !== undefined ? { authStrength: actor.strength } : {}),
      });
    };

    if (stub) {
      assign(
        actorId === undefined
          ? undefined
          : {
              id: actorId,
              ...(strength === 'mfa' || strength === 'step-up' || strength === 'password'
                ? { strength }
                : {}),
            },
      );
      next();
      return;
    }

    const resolve = opts.resolveSession;
    const token = resolve === undefined ? undefined : readCookie(req, SESSION_COOKIE);
    if (resolve === undefined || token === undefined) {
      // No session: the context carries no actor, and everything behind
      // requireActor answers 401. Anonymous is a valid state — /health and
      // the sign-in endpoints live here.
      assign(undefined);
      next();
      return;
    }

    // A state-changing request authenticated by a cookie must also carry a
    // header no cross-site page can attach. Checked before the session is
    // looked up so a forged request never becomes a signed-in one, not
    // even briefly.
    if (!SAFE_METHODS.has(req.method) && header(CLIENT_HEADER) === undefined) {
      assign(undefined);
      next();
      return;
    }

    resolve(token)
      .then((session) => {
        assign(
          session === undefined
            ? undefined
            : { id: session.userAccountId, strength: session.authStrength },
        );
        next();
      })
      .catch((error: unknown) => {
        next(error);
      });
  };
}


export function requireActor(req: Request): RequestContext {
  if ((req as PlatformRequest).platformCtx.actor === undefined) {
    throw new PlatformError('AUTHENTICATION_REQUIRED', 'Authentication required');
  }
  return (req as PlatformRequest).platformCtx;
}
