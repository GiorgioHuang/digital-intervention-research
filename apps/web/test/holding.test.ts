import { describe, expect, it } from 'vitest';
import { HOLDING_LINES, holdingLine } from '../src/holding.js';

/**
 * The sentence somebody reads while the session is being found.
 *
 * It was "Just a moment." — filler on the one screen where a person has
 * nothing else to look at. The owner asked for something worth reading,
 * chosen afresh each time the app opens.
 *
 * The risk this file exists for is not that the picker is broken. It is
 * that a loading screen is the easiest place in an application to put a
 * comforting sentence with nothing behind it, because nobody reviews it.
 */
describe('the holding screen’s sentence', () => {
  /**
   * The property that matters. A picker that returned the first line every
   * time would satisfy "returns one of the lines", and would be exactly
   * the defect — the owner asked for a different sentence each refresh.
   */
  it('can reach every line', () => {
    const seen = new Set<string>();
    // Sampled across the whole range a caller can produce, rather than at
    // the boundaries only: `Math.random()` returns [0, 1).
    for (let i = 0; i < 1000; i += 1) seen.add(holdingLine(i / 1000));
    expect(seen.size, 'some lines can never come up').toBe(HOLDING_LINES.length);
  });

  it('divides the range evenly, so no line is rarer than another', () => {
    const counts = new Map<string, number>();
    const N = 60_000;
    for (let i = 0; i < N; i += 1) {
      const line = holdingLine(i / N);
      counts.set(line, (counts.get(line) ?? 0) + 1);
    }
    const expected = N / HOLDING_LINES.length;
    for (const [line, n] of counts) {
      expect(Math.abs(n - expected), `"${line}" comes up ${String(n)} times against ${String(expected)}`).toBeLessThan(
        2,
      );
    }
  });

  /**
   * Somebody must see a sentence even if the caller gets the number wrong.
   * A blank line on the first screen anybody reaches is worse than the
   * wrong line.
   */
  it('still gives a sentence for a number that should never arrive', () => {
    for (const bad of [-1, 0, 1, 2, 99, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      const line = holdingLine(bad);
      expect(HOLDING_LINES, `holdingLine(${String(bad)}) returned something that is not one of the lines`).toContain(
        line,
      );
    }
  });

  it('says each thing once', () => {
    expect(new Set(HOLDING_LINES).size, 'a line is repeated, so it comes up twice as often').toBe(HOLDING_LINES.length);
  });

  /**
   * Clause 5 of the wording constitution (§E.0): no false comfort. The
   * forbidden move here is specific — a line that implies the wait is
   * nearly over, on a screen that has no idea how long it will be.
   */
  it('promises nothing about how long the wait will be', () => {
    for (const line of HOLDING_LINES) {
      expect(line, `"${line}" says something about the wait`).not.toMatch(
        /almost|nearly|shortly|soon|just a|any (moment|second)|won'?t be long|should be/i,
      );
    }
  });

  /**
   * It is read in a moment, by somebody who may find reading effortful,
   * and it is announced by a screen reader. A paragraph does not belong
   * here — and a budget is how the last one-line thing on this project
   * stopped being one line.
   */
  it('stays short enough to read in the moment it is on screen', () => {
    for (const line of HOLDING_LINES) {
      expect(line.length, `"${line}" is ${String(line.length)} characters`).toBeLessThanOrEqual(72);
      expect(line.split(/[.!?]/).filter((s) => s.trim() !== '').length, `"${line}" is more than one sentence`).toBe(1);
      expect(line.endsWith('.'), `"${line}" does not end in a full stop`).toBe(true);
    }
  });

  /**
   * Not a style rule. Each line is a claim about what this platform does,
   * shown where nobody is in a position to check it, so the second person
   * plural — "we do X for you" — is the shape to watch: it is the one that
   * invites a promise the code does not keep.
   */
  it('makes no claim the about screen does not also make', () => {
    for (const line of HOLDING_LINES) {
      expect(line, `"${line}" guarantees something`).not.toMatch(/guarantee|always|100%|completely safe|never fails/i);
    }
  });
});
