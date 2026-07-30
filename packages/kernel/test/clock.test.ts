import { describe, expect, it } from 'vitest';
import { FixedClock, SystemClock } from '../src/clock.js';

describe('FixedClock', () => {
  it('returns the fixed instant and never drifts', () => {
    const clock = new FixedClock('2026-01-01T00:00:00.000Z');
    expect(clock.now().toISOString()).toBe('2026-01-01T00:00:00.000Z');
    expect(clock.now().toISOString()).toBe('2026-01-01T00:00:00.000Z');
  });

  it('advances deterministically', () => {
    const clock = new FixedClock('2026-01-01T00:00:00.000Z');
    clock.advance(90_000);
    expect(clock.now().toISOString()).toBe('2026-01-01T00:01:30.000Z');
  });

  it('returned Date is a copy — mutating it does not affect the clock', () => {
    const clock = new FixedClock('2026-01-01T00:00:00.000Z');
    clock.now().setFullYear(1999);
    expect(clock.now().getUTCFullYear()).toBe(2026);
  });
});

describe('SystemClock', () => {
  it('tracks real time', () => {
    const before = Date.now();
    const observed = new SystemClock().now().getTime();
    const after = Date.now();
    expect(observed).toBeGreaterThanOrEqual(before);
    expect(observed).toBeLessThanOrEqual(after);
  });
});
