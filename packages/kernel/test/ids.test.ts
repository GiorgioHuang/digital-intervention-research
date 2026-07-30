import { describe, expect, it } from 'vitest';
import { idPrefix, isId, newId, uuidv7 } from '../src/ids.js';

describe('uuidv7', () => {
  it('produces 32 hex chars with version 7 and RFC variant bits', () => {
    const id = uuidv7();
    expect(id).toMatch(/^[0-9a-f]{32}$/);
    expect(id[12]).toBe('7');
    expect(['8', '9', 'a', 'b']).toContain(id[16]);
  });

  it('is time-ordered across distinct milliseconds', () => {
    let t = 1_700_000_000_000;
    const a = uuidv7(() => t);
    t += 5;
    const b = uuidv7(() => t);
    expect(a < b).toBe(true);
  });

  it('is monotonic within the same millisecond', () => {
    const t = 1_700_000_000_000;
    const a = uuidv7(() => t);
    const b = uuidv7(() => t);
    expect(a.slice(0, 12)).toBe(b.slice(0, 12));
    expect(a < b).toBe(true);
  });
});

describe('newId / isId / idPrefix', () => {
  it('creates prefixed opaque IDs', () => {
    const id = newId('msg');
    expect(isId(id)).toBe(true);
    expect(isId(id, 'msg')).toBe(true);
    expect(isId(id, 'pv')).toBe(false);
    expect(idPrefix(id)).toBe('msg');
  });

  it('rejects invalid prefixes', () => {
    expect(() => newId('')).toThrow();
    expect(() => newId('BAD')).toThrow();
    expect(() => newId('has_underscore')).toThrow();
    expect(() => newId('waytoolongprefix')).toThrow();
  });

  it('rejects malformed IDs', () => {
    expect(isId('msg-abc')).toBe(false);
    expect(isId('msg_zzz')).toBe(false);
    expect(() => idPrefix('nonsense')).toThrow();
  });
});
