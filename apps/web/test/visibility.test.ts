import { describe, expect, it } from 'vitest';
import { VISIBILITY_CHOICES, visibilityLabel } from '../src/visibility.js';

describe('the scopes a memory may be given', () => {
  it('starts from Private, which is where every memory starts', () => {
    expect(VISIBILITY_CHOICES[0]?.value).toBe('Private');
  });

  /**
   * The one this file exists to hold. "Selected People" is accepted by
   * the database and by the command, and there is no table anywhere
   * recording who was selected (B-31) — so choosing it shares a memory
   * with nobody. A control that cannot do the thing it names is the
   * failure this project keeps taking out, so it is not offered.
   */
  it('does not offer a scope with nobody behind it', () => {
    expect(
      VISIBILITY_CHOICES.map((c) => c.value),
      'Selected People was offered, and nothing records who is selected',
    ).not.toContain('Selected People');
  });

  /**
   * And not being offered is not the same as not existing. A memory
   * already carrying one of these must still be named accurately, or the
   * screen would be unable to tell its owner who can see it.
   */
  it('can still name a scope it no longer offers', () => {
    expect(visibilityLabel('Selected People')).toBe('People I chose');
    expect(visibilityLabel('Platform Public')).toBe('Anyone using this platform');
    expect(visibilityLabel('My Supporters')).toBe('The people who help me');
  });

  it('passes on a scope it has never heard of rather than inventing one', () => {
    expect(visibilityLabel('Something New')).toBe('Something New');
  });

  it('says what each choice means before it is made', () => {
    for (const choice of VISIBILITY_CHOICES) {
      expect(choice.meaning.length, `${choice.value} is offered with no explanation`).toBeGreaterThan(20);
      expect(choice.label).not.toBe('');
    }
  });
});
