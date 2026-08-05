/**
 * Reading and display preferences.
 *
 * The stylesheet has carried these hooks from the start — `data-font-scale`,
 * `data-density`, `data-contrast` on the root element — and nothing ever
 * set them. Three density tiers and four text sizes were defined and
 * unreachable: the mirror image of a control that does nothing, which is
 * a capability nobody can invoke.
 *
 * Only preferences with real CSS behind them are offered. A toggle for
 * "read it aloud" or "one step at a time" would record a choice nothing
 * acts on, which is the same false claim as a consent scope no permission
 * check reads (decision D-2).
 *
 * Everything here lives on this device. There is no server-side
 * preference store, so a setting made here does not follow the person to
 * another device, and the screen has to say that rather than let "your
 * preferences" imply it.
 */
export type FontScale = 'standard' | 'lg' | 'xl' | 'xxl';
export type Density = 'standard' | 'spacious';
export type Contrast = 'standard' | 'high';
export type Motion = 'system' | 'reduced';

export interface DisplayPreferences {
  fontScale: FontScale;
  density: Density;
  contrast: Contrast;
  motion: Motion;
}

export const DEFAULT_PREFERENCES: DisplayPreferences = {
  fontScale: 'standard',
  density: 'standard',
  contrast: 'standard',
  motion: 'system',
};

const KEY = 'hadi.display-preferences';

/** Storage can be unavailable or full; a preference is never worth an exception. */
function safeRead(): Partial<DisplayPreferences> {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw === null ? {} : (JSON.parse(raw) as Partial<DisplayPreferences>);
  } catch {
    return {};
  }
}

export function loadPreferences(): DisplayPreferences {
  return { ...DEFAULT_PREFERENCES, ...safeRead() };
}

/**
 * Writes the preferences onto the root element, where the stylesheet
 * reads them. `standard` removes the attribute rather than setting it,
 * so the operating system's own signals — `prefers-contrast`,
 * `prefers-reduced-motion` — keep applying unless the person has said
 * otherwise. Overriding those with an explicit "standard" would quietly
 * undo a setting made outside this application.
 */
export function applyPreferences(p: DisplayPreferences): void {
  const root = document.documentElement;
  const set = (name: string, value: string | null) => {
    if (value === null) root.removeAttribute(name);
    else root.setAttribute(name, value);
  };
  set('data-font-scale', p.fontScale === 'standard' ? null : p.fontScale);
  set('data-density', p.density === 'standard' ? null : p.density);
  set('data-contrast', p.contrast === 'standard' ? null : p.contrast);
  set('data-motion', p.motion === 'system' ? null : p.motion);
}

export function savePreferences(p: DisplayPreferences): void {
  applyPreferences(p);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    // Applied for this session even if it cannot be remembered. The
    // screen says where preferences are kept, so a failure to store is
    // not a failure to take effect.
  }
}

/** True when the operating system already asks for less motion. */
export function systemPrefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** True when the operating system already asks for more contrast. */
export function systemPrefersMoreContrast(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-contrast: more)').matches;
}
