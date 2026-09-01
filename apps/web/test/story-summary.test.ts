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
   * This test used to assert the opposite, and its premise was wrong.
   *
   * It required the line NOT to say "only you" once a piece was shared,
   * on the reasoning that saying so over something another person can
   * read is worse than saying nothing. The reasoning holds. What did not
   * is that anybody can read it: `life-story.view-own` is `ownerOnly`,
   * `getMyLifeStory` is the only query there is, and no route, screen or
   * module reads another person's story (B-30). Setting a memory to
   * Community records a choice and shows it to nobody.
   *
   * So "only you can see them" is the true half — and a line that stopped
   * there would hide that somebody asked to share and nothing came of it,
   * which on a project about keeping people connected to their families
   * is the half that matters. Both are required here, together.
   */
  it('says only you can see them even when something is marked shared, and says a choice was made', () => {
    for (const shared of ['Community', 'Connections', 'Selected People', 'Platform Public']) {
      const line = whoCanSee(['Private', shared, 'Private']);
      expect(line, `"${line}" claimed a ${shared} entry had reached somebody`).toBe(
        'Only you can see them. You have chosen to share one of them.',
      );
    }
  });

  /**
   * The failure mode to guard hardest: a line that says sharing happened.
   * Nothing on this platform can show a story to another person, and a
   * sentence in the past tense over an entry nobody has seen is the
   * screen telling somebody their family has read them.
   */
  it('never says a memory has been shared, only that it was chosen to be', () => {
    for (const set of [['Community'], ['Community', 'Private'], ['Community', 'Community'], []]) {
      const line = whoCanSee(set);
      expect(line, `"${line}" says the sharing already happened`).not.toMatch(/you have shared/i);
    }
  });

  it('counts how many were chosen, and says when it is all of them', () => {
    expect(whoCanSee(['Community', 'Private', 'Community', 'Private'])).toBe(
      'Only you can see them. You have chosen to share 2 of them.',
    );
    expect(whoCanSee(['Community', 'Community'])).toBe('Only you can see them. You have chosen to share them all.');
    expect(whoCanSee(['Community'])).toBe('Only you can see it. You have chosen to share it.');
  });

  it('says nothing about visibility when there is nothing to see', () => {
    expect(whoCanSee([])).toBe('');
  });
});
