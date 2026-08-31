import { describe, expect, it } from 'vitest';
import { piecesSoFar, whoCanSee } from '../src/story-summary.js';

/**
 * The line under "Your life story".
 *
 * The drawing writes it as "Twelve pieces so far. Only you can see them."
 * The second sentence is a claim about who can read somebody's memories,
 * and that is the one worth testing hardest: a screen that says "only you"
 * over an entry another person can read is worse than saying nothing.
 */
describe('the line under the heading', () => {
  it('spells the count as the drawing spells it', () => {
    expect(piecesSoFar(12)).toBe('Twelve pieces so far.');
    expect(piecesSoFar(1)).toBe('One piece so far.');
  });

  it('says the story is empty rather than counting nothing', () => {
    expect(piecesSoFar(0)).toBe('Nothing here yet.');
    // Nothing should ever ask for a negative count; if something does, the
    // answer is still a sentence rather than "-1 pieces".
    expect(piecesSoFar(-3)).toBe('Nothing here yet.');
  });

  /**
   * Past twelve a word is harder to read at a glance than a figure, which
   * is the opposite of what this audience needs. The boundary is where a
   * table like this goes wrong, so it is pinned from both sides.
   */
  it('turns to figures where words stop helping', () => {
    expect(piecesSoFar(13)).toBe('13 pieces so far.');
    expect(piecesSoFar(40)).toBe('40 pieces so far.');
  });

  it('says only you can see them when that is true', () => {
    expect(whoCanSee(['Private', 'Private', 'Private'])).toBe('Only you can see them.');
  });

  /**
   * The failure this exists for. One shared piece makes the drawing's flat
   * sentence false, and going quiet about it would be its own kind of
   * wrong — so it says how many.
   */
  it('never claims only you can see them once something is shared', () => {
    for (const shared of ['Community', 'Connections', 'Selected People', 'Platform Public']) {
      const line = whoCanSee(['Private', shared, 'Private']);
      expect(line, `"${line}" was said with a ${shared} entry present`).not.toMatch(/only you/i);
      expect(line).toBe('You have shared one of them.');
    }
  });

  it('counts how many are shared, and says when it is all of them', () => {
    expect(whoCanSee(['Community', 'Private', 'Community', 'Private'])).toBe('You have shared 2 of them.');
    expect(whoCanSee(['Community', 'Community'])).toBe('You have shared all of them.');
    expect(whoCanSee(['Community'])).toBe('You have shared it.');
  });

  it('says nothing about visibility when there is nothing to see', () => {
    expect(whoCanSee([])).toBe('');
  });
});
