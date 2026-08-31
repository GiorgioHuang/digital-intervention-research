import { describe, expect, it } from 'vitest';
import { HOLDING_LINES, holdingLine, holdingLines } from '../src/holding.js';
import type { HoldingLine } from '../src/holding.js';

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
    for (let i = 0; i < 1000; i += 1) seen.add(holdingLine(i / 1000).text);
    expect(seen.size, 'some lines can never come up').toBe(holdingLines().length);
  });

  it('divides the range evenly, so no line is rarer than another', () => {
    const counts = new Map<string, number>();
    const N = 60_000;
    for (let i = 0; i < N; i += 1) {
      const line = holdingLine(i / N).text;
      counts.set(line, (counts.get(line) ?? 0) + 1);
    }
    const expected = N / holdingLines().length;
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
      expect(
        holdingLines().map((l) => l.text),
        `holdingLine(${String(bad)}) returned something that is not one of the lines`,
      ).toContain(line.text);
    }
  });

  it('says each thing once', () => {
    expect(new Set(HOLDING_LINES.map((l) => l.text)).size, 'a line is repeated, so it comes up twice as often').toBe(
      HOLDING_LINES.length,
    );
  });

  /**
   * Clause 5 of the wording constitution (§E.0): no false comfort. The
   * forbidden move here is specific — a line that implies the wait is
   * nearly over, on a screen that has no idea how long it will be.
   */
  it('promises nothing about how long the wait will be', () => {
    for (const { text: line } of HOLDING_LINES) {
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
    for (const { text: line } of HOLDING_LINES) {
      expect(line.length, `"${line}" is ${String(line.length)} characters`).toBeLessThanOrEqual(72);
      expect(line.split(/[.!?]/).filter((s) => s.trim() !== '').length, `"${line}" is more than one sentence`).toBe(1);
      expect(line.endsWith('.'), `"${line}" does not end in a full stop`).toBe(true);
    }
  });

  /**
   * A quoted line that nobody checked must not reach a participant.
   *
   * This is the failure the gate exists for, and it is not "somebody adds
   * a wrong quotation" — it is "somebody adds a plausible one, means to
   * check it, and does not". An unchecked entry looks exactly like a
   * checked one in a diff, so it has to be the code that refuses it.
   */
  it('withholds a quoted line whose wording nobody has compared with the text', () => {
    const unchecked: HoldingLine = {
      text: 'A line somebody was fairly sure about.',
      source: 'Some Author, Some Book (1908)',
      publicDomainBecause: 'the author died in 1942',
    };
    const shown = holdingLines([...HOLDING_LINES, unchecked]).map((l) => l.text);
    expect(shown, 'an unverified quotation would have been shown to a participant').not.toContain(unchecked.text);

    const checked: HoldingLine = { ...unchecked, wordingComparedWith: 'the 1908 first edition, page 4' };
    expect(holdingLines([...HOLDING_LINES, checked]).map((l) => l.text)).toContain(checked.text);
  });

  /**
   * Quoting somebody without saying who is presenting their words as ours,
   * and a public-domain claim that is only in a person's head cannot be
   * checked by the next person to look.
   */
  it('makes every quoted line say whose it is and why it may be used', () => {
    for (const line of HOLDING_LINES) {
      if (line.source === null) continue;
      expect(line.source, `"${line.text}" is quoted with an empty source`).not.toBe('');
      expect(
        line.publicDomainBecause,
        `"${line.text}" is quoted with no stated reason it is out of copyright`,
      ).toBeTruthy();
    }
  });

  /** The platform's own sentences are not attributed to anybody. */
  it('claims no author for the sentences the platform wrote itself', () => {
    const own = HOLDING_LINES.filter((l) => l.source === null);
    expect(own.length, 'the platform has stopped speaking for itself here').toBeGreaterThan(0);
    for (const line of own) {
      expect(line.publicDomainBecause, `"${line.text}" is the platform's own and needs no copyright note`).toBeUndefined();
    }
  });

  /**
   * Not a style rule. Each line is a claim about what this platform does,
   * shown where nobody is in a position to check it, so the second person
   * plural — "we do X for you" — is the shape to watch: it is the one that
   * invites a promise the code does not keep.
   */
  it('makes no claim the about screen does not also make', () => {
    for (const { text: line } of HOLDING_LINES) {
      expect(line, `"${line}" guarantees something`).not.toMatch(/guarantee|always|100%|completely safe|never fails/i);
    }
  });
});
