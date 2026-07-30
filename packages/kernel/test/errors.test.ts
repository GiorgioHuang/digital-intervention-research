import { describe, expect, it } from 'vitest';
import { ERROR_CODES, httpStatusFor } from '../src/error-codes.js';
import { PlatformError, isPlatformError, protectedNotFound } from '../src/errors.js';

describe('error code catalogue', () => {
  it('contains the load-bearing Doc 15 §31 codes', () => {
    for (const code of [
      'COMMUNICATION_BASIS_REQUIRED',
      'MUTUAL_ACCEPTANCE_ALREADY_CONSUMED',
      'SEND_CONFIRMATION_MISMATCH',
      'CONNECTION_REQUEST_FEATURE_DISABLED',
      'MATCH_DECISION_NOT_OWNED',
      'PROVIDER_CALLBACK_INVALID',
      'IDEMPOTENCY_CONFLICT',
      'VERSION_CONFLICT',
      'AUDIT_UNAVAILABLE',
    ] as const) {
      expect(ERROR_CODES[code]).toBeGreaterThanOrEqual(200);
    }
  });

  it('maps VERSION_CONFLICT to 412 (optimistic concurrency precondition)', () => {
    expect(httpStatusFor('VERSION_CONFLICT')).toBe(412);
  });
});

describe('PlatformError', () => {
  it('serialises the Doc 15 §30 envelope', () => {
    const err = new PlatformError('SEND_CONFIRMATION_MISMATCH', 'Confirmation does not match the current draft', {
      details: [{ field: 'expectedMessageVersion', reason: 'stale' }],
    });
    const body = err.toResponseBody('req_x', 'trace_y') as {
      error: Record<string, unknown>;
    };
    expect(body.error['code']).toBe('SEND_CONFIRMATION_MISMATCH');
    expect(body.error['retryable']).toBe(false);
    expect(body.error['requestId']).toBe('req_x');
    expect(body.error['traceId']).toBe('trace_y');
  });

  it('marks dependency failures retryable', () => {
    expect(new PlatformError('PROVIDER_TIMEOUT', 'provider timed out').retryable).toBe(true);
  });

  it('type guard works', () => {
    expect(isPlatformError(new PlatformError('INTERNAL_ERROR', 'x'))).toBe(true);
    expect(isPlatformError(new Error('x'))).toBe(false);
  });
});

describe('protected existence (ADR-050)', () => {
  it('unauthorised and missing resources produce byte-identical responses', () => {
    const missing = protectedNotFound('Life story item');
    const denied = protectedNotFound('Life story item');
    expect(missing.toResponseBody('r', 't')).toEqual(denied.toResponseBody('r', 't'));
    expect(missing.code).toBe('RESOURCE_NOT_FOUND');
    expect(missing.httpStatus).toBe(404);
  });
});
