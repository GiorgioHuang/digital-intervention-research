/**
 * Shared-device mode (DESIGN_SYSTEM §D.6; Doc 20 §306–307).
 *
 * The real setting for this study is a tablet in a community centre that
 * several people use in turn, so "who is this browser" is not a safe
 * assumption. The mode is switched on by an explicit checkbox at sign-in
 * and is never detected: a guess about whether a device is shared is both
 * wrong sometimes and impossible to explain to the person it is wrong
 * about.
 *
 * The flag itself lives in `sessionStorage`, which is the only storage
 * consistent with what the mode promises. Writing "this is a shared
 * device" into `localStorage` would leave a trace of the very session the
 * mode exists to leave no trace of, and would also survive into the next
 * person's use, where it may be false.
 */
const KEY = 'hadi.shared-device';

/**
 * Storage can be unavailable (private mode, blocked site data). A missing
 * store means "not shared", which is the same answer as an unchecked box —
 * the mode is only ever on because someone said so.
 */
export function isSharedDevice(): boolean {
  try {
    return window.sessionStorage.getItem(KEY) === 'yes';
  } catch {
    return memoryShared;
  }
}

let memoryShared = false;

export function setSharedDevice(shared: boolean): void {
  memoryShared = shared;
  try {
    if (shared) window.sessionStorage.setItem(KEY, 'yes');
    else window.sessionStorage.removeItem(KEY);
  } catch {
    /* memory fallback already set */
  }
}

/**
 * Where anything remembered about this person should be written.
 *
 * In shared-device mode nothing personal may outlive the browser session,
 * so preferences go to `sessionStorage` and are gone when the tab closes.
 * That is a real cost — someone who needs the largest text has to choose
 * it again each visit — and it is the right trade only because the
 * alternative leaves the next user of the tablet looking at settings that
 * describe the last one.
 *
 * The environment access passphrase is deliberately NOT moved here. It is
 * a door key for the prototype environment rather than anything about a
 * person, and clearing it would lock the shared tablet out of the
 * environment entirely for whoever sits down next, with no way back except
 * the original invitation link.
 */
export function preferenceStore(): Storage | null {
  try {
    return isSharedDevice() ? window.sessionStorage : window.localStorage;
  } catch {
    return null;
  }
}

/**
 * Ends one person's visit as completely as a browser allows: everything
 * this application wrote for the session is dropped, so "switch user"
 * means the next person starts from nothing rather than from a screen that
 * still remembers the last one.
 *
 * The device stays marked as shared. §D.6 describes switching user as
 * clearing `sessionStorage` outright, which would take the flag with it —
 * but the tablet did not stop being communal because the person using it
 * changed, and the effect would be that the most protective setting
 * evaporates at the exact moment a stranger sits down. So the flag is put
 * back; everything about the person is not.
 */
export function endVisit(): void {
  const shared = isSharedDevice();
  try {
    window.sessionStorage.clear();
  } catch {
    /* nothing to clear */
  }
  memoryShared = false;
  if (shared) setSharedDevice(true);
}

/**
 * Idle limits (DESIGN_SYSTEM §E.11; Doc 20 §238–239). Minutes, converted
 * once here so no screen has to hold a millisecond constant.
 */
export interface IdleLimits {
  warnAfterMs: number;
  signOutAfterMs: number;
  /**
   * How many times "Keep me signed in" may be used. On a shared device an
   * unlimited extension is the same as no timeout at all — one person can
   * hold the tablet's session open indefinitely — so it is allowed once
   * and then the sign-out happens.
   */
  maxExtensions: number;
}

const MINUTE = 60_000;

export const NORMAL_LIMITS: IdleLimits = {
  warnAfterMs: 20 * MINUTE,
  signOutAfterMs: 25 * MINUTE,
  maxExtensions: Number.POSITIVE_INFINITY,
};

export const SHARED_LIMITS: IdleLimits = {
  warnAfterMs: 5 * MINUTE,
  signOutAfterMs: 7 * MINUTE,
  maxExtensions: 1,
};

export function limitsFor(shared: boolean): IdleLimits {
  return shared ? SHARED_LIMITS : NORMAL_LIMITS;
}
