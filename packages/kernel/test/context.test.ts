import { describe, expect, it } from 'vitest';
import { childContext, createRequestContext } from '../src/context.js';
import { isId } from '../src/ids.js';

describe('RequestContext', () => {
  it('generates req/corr/trace IDs when absent', () => {
    const ctx = createRequestContext();
    expect(isId(ctx.requestId, 'req')).toBe(true);
    expect(isId(ctx.correlationId, 'corr')).toBe(true);
    expect(isId(ctx.traceId, 'trace')).toBe(true);
    expect(ctx.causationId).toBeUndefined();
  });

  it('child context preserves correlation/trace and sets causation to the parent request', () => {
    const parent = createRequestContext({
      actor: { type: 'user', id: 'actor_1' },
      organisationId: 'org_1',
      purposeCode: 'intervention-delivery',
    });
    const child = childContext(parent);
    expect(child.correlationId).toBe(parent.correlationId);
    expect(child.traceId).toBe(parent.traceId);
    expect(child.causationId).toBe(parent.requestId);
    expect(child.requestId).not.toBe(parent.requestId);
    expect(child.actor).toEqual(parent.actor);
    expect(child.purposeCode).toBe('intervention-delivery');
  });

  it('child context accepts overrides (e.g. switching to a service account)', () => {
    const parent = createRequestContext({ actor: { type: 'user', id: 'actor_1' } });
    const child = childContext(parent, { actor: { type: 'service-account', id: 'sa_worker' } });
    expect(child.actor).toEqual({ type: 'service-account', id: 'sa_worker' });
    expect(child.correlationId).toBe(parent.correlationId);
  });
});
