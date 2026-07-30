import { newId } from './ids.js';

/**
 * Request context propagated through every command/query, outbox event and
 * audit record (Doc 15 §22 headers, Doc 16 correlation fields).
 * Client-supplied organisation/project/purpose values are references to
 * re-evaluate — carrying them here grants no authority.
 */
export interface ActorReference {
  readonly type: 'user' | 'service-account' | 'system';
  readonly id: string;
}

export interface RequestContext {
  readonly requestId: string;
  readonly correlationId: string;
  readonly causationId: string | undefined;
  readonly traceId: string;
  readonly actor: ActorReference | undefined;
  readonly organisationId: string | undefined;
  readonly researchProjectId: string | undefined;
  readonly purposeCode: string | undefined;
  readonly authStrength: 'password' | 'mfa' | 'step-up' | undefined;
}

export interface RequestContextInit {
  requestId?: string;
  correlationId?: string;
  causationId?: string;
  traceId?: string;
  actor?: ActorReference;
  organisationId?: string;
  researchProjectId?: string;
  purposeCode?: string;
  authStrength?: 'password' | 'mfa' | 'step-up';
}

export function createRequestContext(init: RequestContextInit = {}): RequestContext {
  const requestId = init.requestId ?? newId('req');
  return {
    requestId,
    correlationId: init.correlationId ?? newId('corr'),
    causationId: init.causationId,
    traceId: init.traceId ?? newId('trace'),
    actor: init.actor,
    organisationId: init.organisationId,
    researchProjectId: init.researchProjectId,
    purposeCode: init.purposeCode,
    authStrength: init.authStrength,
  };
}

/**
 * Derive the context for follow-on work caused by the current request
 * (worker jobs, event handlers): same correlation/trace chain, new request
 * ID, causation set to the parent request.
 */
export function childContext(parent: RequestContext, overrides: Partial<RequestContextInit> = {}): RequestContext {
  return createRequestContext({
    correlationId: parent.correlationId,
    causationId: parent.requestId,
    traceId: parent.traceId,
    ...(parent.actor ? { actor: parent.actor } : {}),
    ...(parent.organisationId !== undefined ? { organisationId: parent.organisationId } : {}),
    ...(parent.researchProjectId !== undefined ? { researchProjectId: parent.researchProjectId } : {}),
    ...(parent.purposeCode !== undefined ? { purposeCode: parent.purposeCode } : {}),
    ...(parent.authStrength !== undefined ? { authStrength: parent.authStrength } : {}),
    ...stripUndefined(overrides),
  });
}

function stripUndefined<T extends object>(obj: T): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out as Partial<T>;
}
