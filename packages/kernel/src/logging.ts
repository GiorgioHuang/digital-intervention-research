/**
 * Sensitive-data redaction for logs, traces and error reporting.
 *
 * Doc 14 §61: logs/traces must exclude Life Story and Message content,
 * assessment responses, match preferences, reporter identity, safety
 * details, consent documents, model prompts/outputs, credentials and full
 * external payloads. This module is the single source of truth for the
 * redaction key list; every logger in every process must be built with it.
 */

export const REDACTED = '[REDACTED]';

/** Key names (case-insensitive, snake/camel tolerated) that are always redacted. */
export const SENSITIVE_KEY_PATTERNS: readonly RegExp[] = [
  /message.?body/i,
  /message.?content/i,
  /life.?story.?(text|content|narrative)/i,
  /assessment.?response/i,
  /match.?preference/i,
  /reporter.?(identity|id|name)/i,
  /safety.?(narrative|detail)/i,
  /consent.?(document|content|text)/i,
  /(^|_)prompt(s)?($|_)/i,
  /completion/i,
  /model.?(input|output)/i,
  /password/i,
  /passcode/i,
  /secret/i,
  /credential/i,
  /(access|refresh|id).?token/i,
  /authorization/i,
  /api.?key/i,
  /private.?key/i,
  /linkage.?key/i,
  /precise.?location/i,
  /latitude/i,
  /longitude/i,
];

export function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY_PATTERNS.some((p) => p.test(key));
}

const MAX_DEPTH = 12;

/**
 * Deep-copy a value with sensitive keys replaced by REDACTED. Safe against
 * cycles (cyclic references are cut with '[CYCLE]') and depth bombs.
 */
export function redact(value: unknown): unknown {
  return redactInner(value, new WeakSet(), 0);
}

function redactInner(value: unknown, seen: WeakSet<object>, depth: number): unknown {
  if (value === null || typeof value !== 'object') return value;
  if (depth >= MAX_DEPTH) return '[TRUNCATED]';
  if (seen.has(value)) return '[CYCLE]';
  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((item) => redactInner(item, seen, depth + 1));
  }
  if (value instanceof Date) return new Date(value.getTime());

  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value)) {
    out[key] = isSensitiveKey(key) ? REDACTED : redactInner(val, seen, depth + 1);
  }
  return out;
}
