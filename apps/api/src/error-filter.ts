import { Catch, HttpException, type ArgumentsHost, type ExceptionFilter } from '@nestjs/common';
import type { Response } from 'express';
import type { PlatformRequest } from './http-context.js';
import { isPlatformError } from '@platform/kernel';

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
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Internal error', details: [], requestId, traceId, retryable: true },
    });
  }
}
