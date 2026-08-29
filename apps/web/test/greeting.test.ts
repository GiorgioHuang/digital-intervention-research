import { describe, expect, it } from 'vitest';
import { AFTERNOON_UNTIL, MORNING_UNTIL, greeting, greetingFor } from '../src/greeting.js';

/**
 * Fixed instants, never `new Date()`.
 *
 * This file is small on purpose: it exists so that no other test has to
 * name a greeting. A component test that renders Home and asserts "Good
 * morning" passes every morning and fails every afternoon, on code nobody
 * touched — which is exactly the failure this project already spent a day
 * on (D-103: a deterministic clock that governed only writes agreed with
 * reality until it did not). The boundaries are decided here; elsewhere it
 * is only ever asserted that the greeting is one of the three.
 *
 * Local time, deliberately: this greets somebody sitting in their kitchen,
 * so the hours are read off their own clock. The dates below carry no zone
 * suffix, which is what makes them local.
 */
const at = (hhmm: string) => new Date(`2026-08-29T${hhmm}:00`);

describe('the greeting on Home', () => {
  it('changes at midday and at six', () => {
    expect(greeting(at('00:00'))).toBe('Good morning');
    expect(greeting(at('11:59'))).toBe('Good morning');
    expect(greeting(at('12:00'))).toBe('Good afternoon');
    expect(greeting(at('17:59'))).toBe('Good afternoon');
    expect(greeting(at('18:00'))).toBe('Good evening');
    expect(greeting(at('23:59'))).toBe('Good evening');
  });

  /** The boundaries are the constants, not two numbers that happen to agree. */
  it('puts its boundaries where it says it does', () => {
    expect(greeting(at(`${String(MORNING_UNTIL - 1).padStart(2, '0')}:59`))).toBe('Good morning');
    expect(greeting(at(`${String(MORNING_UNTIL).padStart(2, '0')}:00`))).toBe('Good afternoon');
    expect(greeting(at(`${String(AFTERNOON_UNTIL).padStart(2, '0')}:00`))).toBe('Good evening');
  });

  /**
   * Every hour of the day produces one of the three. A fourth state — or a
   * gap where an hour falls through both comparisons — would reach Home as
   * "undefined" in the page's largest type.
   */
  it('has no hour it cannot greet', () => {
    for (let h = 0; h < 24; h += 1) {
      expect(
        greeting(at(`${String(h).padStart(2, '0')}:30`)),
        `hour ${h} has no greeting`,
      ).toMatch(/^Good (morning|afternoon|evening)$/);
    }
  });

  /**
   * The handoff greets by name. This platform has no name to greet with —
   * a participant session is `{actorId, participantId}` (gap B-16) — so
   * the greeting stands alone rather than addressing somebody as an
   * identifier. When a name does arrive, this is the shape it takes.
   */
  it('greets by name only when there is a name', () => {
    expect(greetingFor(at('09:00'), null)).toBe('Good morning');
    expect(greetingFor(at('09:00'), 'Margaret')).toBe('Good morning, Margaret');
  });
});
