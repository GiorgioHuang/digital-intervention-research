/**
 * Which screen an address names, and which address a screen has.
 *
 * The participant workspace kept the current screen in React state and
 * nowhere else, so every refresh — on any screen — landed on Home. The
 * address bar said `/` throughout, which is the same defect seen from the
 * other side: the browser was never told where the person was, so it had
 * nothing to give back.
 *
 * Pure on purpose. Routing that reads `window.location` inside the
 * component can only be tested by driving a browser; here it is two total
 * functions over strings, so the awkward cases — a path nobody routes, a
 * trailing slash, a screen that cannot be restored — are ordinary tests.
 *
 * The words are the ones on the screen rather than the internal keys
 * (`/my-story`, not `/life-story`), because this address is shown to the
 * person using it and read aloud by screen readers.
 */
import type { Screen } from './screens.js';

/**
 * The screens that survive being typed in, one path each.
 *
 * `caption` and `review` are deliberately absent and handled below: they
 * are the two screens that carry something from the screen before.
 */
const PATHS: Readonly<Record<Exclude<Screen, 'review' | 'caption'>, string>> = {
  home: '/',
  information: '/information',
  consent: '/consent',
  access: '/who-has-access',
  'data-copy': '/copy-of-my-information',
  'life-story': '/my-story',
  'shared-stories': '/shared-with-me',
  community: '/community',
  message: '/messages',
  matching: '/meet-people',
  exercises: '/exercises',
  tapping: '/exercises/tapping',
  helper: '/someone-is-helping-me',
  name: '/what-other-people-call-me',
  about: '/about',
  help: '/help',
};

/** `/waiting/<contribution id>` — the one routed screen with a parameter. */
const REVIEW_PREFIX = '/waiting/';

/**
 * The address for what is on screen now.
 *
 * `caption` has no address of its own: it is reached with a photograph
 * object carried from Home, and an address cannot carry one. It reports
 * Home's, so the bar never names a screen that a refresh could not
 * produce — the alternative is an address that looks bookmarkable and
 * gives back a blank page.
 */
export function pathForScreen(screen: Screen, reviewing: string | null): string {
  if (screen === 'review') return reviewing === null ? PATHS.home : REVIEW_PREFIX + encodeURIComponent(reviewing);
  if (screen === 'caption') return PATHS.home;
  return PATHS[screen];
}

export interface Landing {
  screen: Screen;
  /** The contribution to open, when the address named one. */
  reviewing: string | null;
}

/**
 * Where an address lands.
 *
 * Anything unrecognised lands on Home rather than on an error: a wrong
 * address in this workspace is far more likely to be a mistyped or
 * truncated link than an attempt at anything, and the person holding it
 * is not owed a page that says they got it wrong.
 */
export function screenForPath(pathname: string): Landing {
  // One trailing slash is the same place; `/` itself must survive it.
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  if (path.startsWith(REVIEW_PREFIX)) {
    const id = decodeURIComponent(path.slice(REVIEW_PREFIX.length));
    return id === '' ? { screen: 'home', reviewing: null } : { screen: 'review', reviewing: id };
  }
  for (const [screen, p] of Object.entries(PATHS)) {
    if (p === path) return { screen: screen as Screen, reviewing: null };
  }
  return { screen: 'home', reviewing: null };
}
