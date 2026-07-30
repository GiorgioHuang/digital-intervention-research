import { randomBytes } from 'node:crypto';

/**
 * Opaque prefixed identifiers (Doc 15 §21, Doc 16 §12).
 * Format: `<prefix>_<uuidv7-without-dashes>`; UUIDv7 gives time-ordered
 * primary keys (Doc 16 recommends UUID/UUIDv7) while staying non-semantic.
 */

const PREFIX_PATTERN = /^[a-z][a-z0-9]{1,11}$/;
const ID_PATTERN = /^[a-z][a-z0-9]{1,11}_[0-9a-f]{32}$/;

let lastMillis = -1;
let seq = 0;

/** RFC 9562 UUIDv7 with a per-millisecond monotonic sequence in rand_a. */
export function uuidv7(now: () => number = Date.now): string {
  const millis = now();
  if (millis === lastMillis) {
    seq = (seq + 1) & 0x0fff;
  } else {
    lastMillis = millis;
    seq = 0;
  }
  const bytes = randomBytes(16);
  const ms = BigInt(millis);
  bytes[0] = Number((ms >> 40n) & 0xffn);
  bytes[1] = Number((ms >> 32n) & 0xffn);
  bytes[2] = Number((ms >> 24n) & 0xffn);
  bytes[3] = Number((ms >> 16n) & 0xffn);
  bytes[4] = Number((ms >> 8n) & 0xffn);
  bytes[5] = Number(ms & 0xffn);
  bytes[6] = 0x70 | ((seq >> 8) & 0x0f);
  bytes[7] = seq & 0xff;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  return bytes.toString('hex');
}

export function newId(prefix: string, now?: () => number): string {
  if (!PREFIX_PATTERN.test(prefix)) {
    throw new Error(`Invalid ID prefix: ${prefix}`);
  }
  return `${prefix}_${uuidv7(now)}`;
}

export function isId(value: string, prefix?: string): boolean {
  if (!ID_PATTERN.test(value)) return false;
  if (prefix !== undefined) return value.startsWith(`${prefix}_`);
  return true;
}

export function idPrefix(value: string): string {
  const underscore = value.indexOf('_');
  if (underscore <= 0 || !ID_PATTERN.test(value)) {
    throw new Error('Not a platform ID');
  }
  return value.slice(0, underscore);
}
