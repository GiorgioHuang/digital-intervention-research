import { pino, type Logger } from 'pino';
import { redact } from '@platform/kernel';

/**
 * Process logger with mandatory sensitive-data redaction (Doc 14 §61).
 * Every log object passes through the kernel redaction filter — this is not
 * optional and applies to all processes (API, Worker, Scheduler).
 */
export function createLogger(level: string, name: string): Logger {
  return pino({
    name,
    level,
    formatters: {
      log(object) {
        return redact(object) as Record<string, unknown>;
      },
    },
  });
}
