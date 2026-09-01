import { Catch, HttpException, type ArgumentsHost, type ExceptionFilter } from '@nestjs/common';
import type { Response } from 'express';
import type { PlatformRequest } from './http-context.js';
import { isPlatformError } from '@platform/kernel';
import { createLogger } from './logger.js';

const logger = createLogger('error', 'api-errors');

/**
 * Doc 15 §30 error envelope: {error: {code, message, details, requestId,
 * traceId, retryable}} with stable codes and safe messages. Unknown errors
 * become INTERNAL_ERROR without leaking internals (Doc 14 §61).
 */
@Catch()
export class PlatformErrorFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const res = http.getResponse<Response>();
    const req = http.getRequest<PlatformRequest>();
    const requestId = req.platformCtx?.requestId ?? 'unknown';
    const traceId = req.platformCtx?.traceId ?? 'unknown';

    if (isPlatformError(exception)) {
      res.status(exception.httpStatus).json(exception.toResponseBody(requestId, traceId));
      return;
    }
    if (exception instanceof HttpException) {
      res.status(exception.getStatus()).json({
        error: {
          code: exception.getStatus() === 404 ? 'RESOURCE_NOT_FOUND' : 'VALIDATION_ERROR',
          message: exception.message,
          details: [],
          requestId,
          traceId,
          retryable: false,
        },
      });
      return;
    }
    /*
     * A body larger than the parser accepts.
     *
     * body-parser raises this before any handler runs, so it is not an
     * HttpException and used to fall through to INTERNAL_ERROR — which
     * the participant reads as "we do not know whether it took effect",
     * over a photograph that certainly did not upload. It is a refusal,
     * it is knowable, and it is now said as one.
     */
    if (
      typeof exception === 'object' &&
      exception !== null &&
      (exception as { type?: string }).type === 'entity.too.large'
    ) {
      res.status(413).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'That file is larger than this platform accepts',
          details: [],
          requestId,
          traceId,
          retryable: false,
        },
      });
      return;
    }
    // An unexpected failure that leaves no trace server-side cannot be
    // diagnosed later: the client is told INTERNAL_ERROR by design (Doc 14
    // §61 — no internals leak), so the stack has to be recorded here or it
    // is lost. Redacted, like every other log line.
    // createLogger already applies kernel redaction to every object.
    logger.error(
      {
        requestId,
        traceId,
        method: req.method,
        path: req.originalUrl,
        err: exception instanceof Error ? { name: exception.name, message: exception.message, stack: exception.stack } : String(exception),
      },
      'Unhandled error',
    );
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Internal error', details: [], requestId, traceId, retryable: true },
    });
  }
}
