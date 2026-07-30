import type { Request, Response, NextFunction } from 'express';
import { PlatformError, createRequestContext, type RequestContext } from '@platform/kernel';

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
    const actorId = authMode === 'dev-header' ? header('x-actor-id') : undefined;
    const strength = header('x-auth-strength');
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
