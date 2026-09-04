import { describe, expect, it } from 'vitest';
import { previewLine, whenLine } from '../src/conversation-row.js';

/**
 * The two judgements a conversation row makes. Both are on the screen a
 * person checks first, so both are wrong in ways that matter: a date that
 * reads as today when it was three weeks ago, and words on the front
 * screen that nobody has said.
 */
describe('when a conversation was last written in', () => {
  const now = new Date(2026, 8, 4, 9, 0, 0); // Friday 4 September 2026, morning

  it('names the recent days rather than dating them', () => {
    expect(whenLine(new Date(2026, 8, 4, 8, 30).toISOString(), now)).toBe('Today');
    expect(whenLine(new Date(2026, 8, 3, 23, 50).toISOString(), now)).toBe('Yesterday');
  });

  /**
   * Calendar days, not elapsed hours. Eleven last night is nine and a
   * half hours ago, and calling that "Today" is the mistake a
   * milliseconds-since comparison makes.
   */
  it('counts the day that has turned, not the hours that have passed', () => {
    expect(whenLine(new Date(2026, 8, 3, 23, 30).toISOString(), now)).toBe('Yesterday');
    // And the other way: early this morning is Today, though it is only
    // a few hours old and a coarse comparison could round it away.
    expect(whenLine(new Date(2026, 8, 4, 0, 10).toISOString(), now)).toBe('Today');
  });

  it('names a weekday only while the name means one day', () => {
    // Three days back: Tuesday, and there is only one Tuesday it can be.
    expect(whenLine(new Date(2026, 8, 1, 12, 0).toISOString(), now)).toBe(
      new Date(2026, 8, 1).toLocaleDateString(undefined, { weekday: 'long' }),
    );
    // Eight days back is the same weekday name as yesterday-but-seven,
    // so it is dated instead.
    const older = whenLine(new Date(2026, 7, 27, 12, 0).toISOString(), now);
    expect(older).not.toMatch(/day$/);
    expect(older).toContain('27');
  });

  it('adds the year only when it is not this one', () => {
    expect(whenLine(new Date(2026, 1, 2, 12, 0).toISOString(), now)).not.toContain('2026');
    expect(whenLine(new Date(2025, 11, 2, 12, 0).toISOString(), now)).toContain('2025');
  });

  it('says nothing rather than something wrong when there is no date', () => {
    expect(whenLine(null, now)).toBe('');
    expect(whenLine('not a date', now)).toBe('');
  });
});

describe('what the row says was last said', () => {
  it('quotes the words when the server sent them', () => {
    expect(
      previewLine({ lastMessageState: 'Queued', lastMessageFromMe: true, lastMessagePreview: 'The roses came out.' }),
    ).toBe('The roses came out.');
  });

  /**
   * The withheld cases are worded, not left blank. A blank second line
   * reads as a fault in the page, and each of these is worth saying —
   * particularly an unsent draft of one's own, which is a thing somebody
   * might want to go back and finish.
   */
  it('says why there is nothing to quote', () => {
    expect(previewLine({ lastMessageState: null, lastMessageFromMe: null, lastMessagePreview: null })).toBe(
      'Nothing has been written yet.',
    );
    expect(previewLine({ lastMessageState: 'Draft', lastMessageFromMe: true, lastMessagePreview: null })).toMatch(
      /have not sent it/,
    );
    expect(previewLine({ lastMessageState: 'Withdrawn', lastMessageFromMe: false, lastMessagePreview: null })).toBe(
      'The last message here is not shown.',
    );
  });

  /**
   * The line never invents the words. Whether they may be shown is the
   * server's decision, made by the same rule the conversation itself
   * applies; this only words the absence.
   */
  it('never puts words on the row that the server withheld', () => {
    for (const state of ['Draft', 'Withdrawn', 'Cancelled', 'Expired', null]) {
      const line = previewLine({ lastMessageState: state, lastMessageFromMe: false, lastMessagePreview: null });
      expect(line).not.toContain('roses');
      expect(line.length).toBeGreaterThan(0);
    }
  });
});
