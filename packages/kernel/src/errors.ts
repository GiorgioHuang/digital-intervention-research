import { ERROR_CODES, RETRYABLE_CODES, type ErrorCode } from './error-codes.js';

export interface ErrorDetail {
  field?: string;
  reason: string;
}

export interface ErrorAction {
  type: string;
  href?: string;
}

/**
 * Structured platform error (Doc 15 §30 error envelope). Serialised at the
 * API edge as {error: {code, message, details, action, requestId, traceId,
 * retryable}}. Messages must be safe: no secrets, internal schema names,
 * stack traces or protected-resource existence hints (Doc 14 §61).
 */
export class PlatformError extends Error {
  readonly code: ErrorCode;
  readonly httpStatus: number;
  readonly details: readonly ErrorDetail[];
  readonly action: ErrorAction | undefined;
  readonly retryable: boolean;

  constructor(
    code: ErrorCode,
    message: string,
    options: { details?: ErrorDetail[]; action?: ErrorAction; cause?: unknown } = {},
  ) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = 'PlatformError';
    this.code = code;
    this.httpStatus = ERROR_CODES[code];
    this.details = options.details ?? [];
    this.action = options.action;
    this.retryable = RETRYABLE_CODES.has(code);
  }

  toResponseBody(requestId: string, traceId: string): object {
    return {
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
        ...(this.action ? { action: this.action } : {}),
        requestId,
        traceId,
        retryable: this.retryable,
      },
    };
  }
}

/**
 * Protected existence (ADR-050, Doc 14 §17): where revealing that a resource
 * exists is unsafe, unauthorised access returns the same RESOURCE_NOT_FOUND
 * as a genuinely missing resource. Always use this helper for protected
 * resource types so the two responses stay byte-identical.
 */
export function protectedNotFound(resourceLabel: string): PlatformError {
  return new PlatformError('RESOURCE_NOT_FOUND', `${resourceLabel} not found`);
}

export function isPlatformError(value: unknown): value is PlatformError {
  return value instanceof PlatformError;
}
