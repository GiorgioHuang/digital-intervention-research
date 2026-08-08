import { timingSafeEqual } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import { PlatformError, createRequestContext, type RequestContext } from '@platform/kernel';

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
 * Request-context middleware (Doc 15 §22 headers). Authentication is a
 * DEVELOPMENT STUB: with AUTH_MODE=dev-header the actor comes from
 * X-Actor-Id / X-Auth-Strength headers. This mode exists only for local
 * development and the synthetic Pilot; production authentication is the
 * OIDC integration pending ADR-104 and the stub refuses to run unless
 * explicitly enabled. Client-supplied org/project/purpose headers are
 * references to re-evaluate — they grant nothing by themselves (Doc 14).
 */
export function requestContextMiddleware(authMode: string) {
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
    (req as PlatformRequest).platformCtx = createRequestContext({
      ...(header('x-request-id') !== undefined ? { requestId: header('x-request-id')! } : {}),
      ...(actorId !== undefined ? { actor: { type: 'user', id: actorId } } : {}),
      ...(header('x-organisation-id') !== undefined ? { organisationId: header('x-organisation-id')! } : {}),
      ...(header('x-research-project-id') !== undefined ? { researchProjectId: header('x-research-project-id')! } : {}),
      ...(header('x-purpose-code') !== undefined ? { purposeCode: header('x-purpose-code')! } : {}),
      ...(strength === 'mfa' || strength === 'step-up' || strength === 'password'
        ? { authStrength: strength }
        : {}),
    });
    next();
  };
}

export function requireActor(req: Request): RequestContext {
  if ((req as PlatformRequest).platformCtx.actor === undefined) {
    throw new PlatformError('AUTHENTICATION_REQUIRED', 'Authentication required');
  }
  return (req as PlatformRequest).platformCtx;
}
