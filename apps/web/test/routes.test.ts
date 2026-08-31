import { describe, expect, it } from 'vitest';
import { pathForScreen, screenForPath } from '../src/routes.js';
import type { Screen } from '../src/screens.js';

/**
 * Refreshing any screen landed on Home, because the current screen lived
 * in React state and nowhere else. These are the two functions that give
 * the browser something to come back to.
 */
const ROUTABLE: Screen[] = [
  'home',
  'information',
  'consent',
  'access',
  'data-copy',
  'life-story',
  'community',
  'message',
  'matching',
  'exercises',
  'tapping',
  'helper',
  'about',
  'help',
];

describe('addresses', () => {
  /**
   * The property that actually matters — not "the table has the right
   * strings", which would pass on a table that agreed with itself and
   * lost every screen on refresh anyway.
   */
  it('brings every routable screen back to itself', () => {
    for (const s of ROUTABLE) {
      expect(screenForPath(pathForScreen(s, null)).screen, `${s} does not survive its own address`).toBe(s);
    }
  });

  it('gives each screen a different address', () => {
    const seen = new Map<string, Screen>();
    for (const s of ROUTABLE) {
      const p = pathForScreen(s, null);
      expect(seen.get(p), `${s} and ${String(seen.get(p))} share the address ${p}`).toBeUndefined();
      seen.set(p, s);
    }
  });

  it('carries the contribution being reviewed', () => {
    const at = screenForPath(pathForScreen('review', 'contrib_7'));
    expect(at.screen).toBe('review');
    expect(at.reviewing).toBe('contrib_7');
  });

  /**
   * An identifier with a slash in it would otherwise read as a deeper
   * path and lose everything after the slash — which would open the wrong
   * contribution, not merely fail to open one.
   */
  it('survives an identifier that needs escaping', () => {
    const at = screenForPath(pathForScreen('review', 'a/b c'));
    expect(at.reviewing).toBe('a/b c');
  });

  /**
   * The caption screen is handed a photograph object by the screen before
   * it, and an address cannot carry one. Naming it in the bar would make
   * it look bookmarkable and hand back a blank page.
   */
  it('does not offer an address that would come back empty', () => {
    expect(pathForScreen('caption', null)).toBe(pathForScreen('home', null));
    expect(pathForScreen('review', null)).toBe(pathForScreen('home', null));
  });

  it('lands a mistyped or truncated address on Home rather than an error', () => {
    for (const p of ['/nothing-here', '/my-storyy', '', '/waiting/', '/exercises/tapping/deeper']) {
      expect(screenForPath(p).screen, `${p} did not land on Home`).toBe('home');
    }
  });

  it('treats one trailing slash as the same place', () => {
    expect(screenForPath('/my-story/').screen).toBe('life-story');
    expect(screenForPath('/').screen).toBe('home');
  });

  /**
   * The address is shown to the person using it and read out by screen
   * readers, so it is written in the words on the screen rather than in
   * the internal keys.
   */
  it('is written in the words on the screen, not the internal keys', () => {
    expect(pathForScreen('life-story', null)).toBe('/my-story');
    expect(pathForScreen('data-copy', null)).toBe('/copy-of-my-information');
    expect(pathForScreen('access', null)).toBe('/who-has-access');
  });
});
