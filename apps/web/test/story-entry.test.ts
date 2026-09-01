import { describe, expect, it } from 'vitest';
import { excerptOf, isShowableImage, metaLine, shortVisibility } from '../src/story-entry.js';

describe('what a folded memory says on its row', () => {
  it('shows a short memory whole, with nothing suggesting more', () => {
    expect(excerptOf('I grew roses.')).toBe('I grew roses.');
    expect(excerptOf('I grew roses.')).not.toMatch(/…/);
  });

  /**
   * The failure this exists for. A row ending "the neighbours would sto…"
   * reads as a broken page rather than a preview, and this audience is
   * the least likely to give the page the benefit of the doubt.
   */
  it('never cuts a word in half', () => {
    const long = 'I grew roses along the whole south wall of the house, and the neighbours would stop to look at them.';
    const shown = excerptOf(long, 60);
    expect(shown.endsWith('…')).toBe(true);
    const words = shown.slice(0, -1).trimEnd();
    expect(long.startsWith(words), `"${words}" is not how the memory begins`).toBe(true);
    expect(long[words.length], 'the cut landed inside a word').toBe(' ');
  });

  /**
   * A single word longer than the whole allowance has no space to cut on.
   * Cutting it is then the only option, and the point of the test is that
   * it returns something rather than looping or throwing.
   */
  it('copes with one very long word', () => {
    const shown = excerptOf('Antidisestablishmentarianism', 10);
    // At most `max` characters of the text, and then the ellipsis.
    expect(shown).toBe('Antidisest…');
  });

  it('says nothing when there are no words yet', () => {
    expect(excerptOf(null)).toBe('');
    expect(excerptOf('')).toBe('');
    expect(excerptOf('   \n  ')).toBe('');
  });

  it('flattens line breaks, so a row stays a row', () => {
    expect(excerptOf('One line.\n\nAnother line.')).toBe('One line. Another line.');
  });

  /**
   * Who can see it, in the words a row has room for. The unknown case
   * matters most: a visibility this screen has never heard of must be
   * shown as it is, not silently turned into "Only you" — that would be
   * the screen inventing a privacy guarantee.
   */
  it('shortens the visibilities it knows and passes on the ones it does not', () => {
    expect(shortVisibility('Private')).toBe('Only you');
    expect(shortVisibility('Community')).toBe('Your community');
    expect(shortVisibility('Something New')).toBe('Something New');
  });

  it('spells the month, because 02/06 is a different day in two countries', () => {
    const line = metaLine({ updatedAt: '2026-06-02T09:00:00Z', visibility: 'Private' });
    expect(line).toMatch(/2026/);
    expect(line, 'the date was rendered as ambiguous digits').not.toMatch(/^\d+\/\d+\/\d+/);
    expect(line).toMatch(/Only you$/);
  });

  it('leaves out a date it cannot read rather than printing Invalid Date', () => {
    expect(metaLine({ updatedAt: 'not a date', visibility: 'Private' })).toBe('Only you');
  });

  /**
   * Only the two the server will serve as images. Anything else came back
   * as an opaque download precisely because its bytes were not what it
   * claimed, and putting it in an <img> would be this screen overruling
   * the check that made it opaque.
   */
  it('only shows what the server was willing to call an image', () => {
    expect(isShowableImage('image/png')).toBe(true);
    expect(isShowableImage('image/jpeg')).toBe(true);
    for (const other of ['application/octet-stream', 'image/svg+xml', 'text/html', 'application/pdf', '']) {
      expect(isShowableImage(other), `${other} was about to be put in an img tag`).toBe(false);
    }
  });
});
