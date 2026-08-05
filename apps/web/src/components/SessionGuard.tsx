import { useEffect, useRef, useState } from 'react';
import { limitsFor } from '../device-mode.js';

/**
 * Idle sign-out (I14; DESIGN_SYSTEM §E.11, Doc 20 §238–239).
 *
 * Twenty minutes idle warns and twenty-five signs out; on a shared device
 * five and seven. Nothing was enforcing either, so a session on a
 * community-centre tablet stayed open until someone thought to close it.
 *
 * The warning says what will actually happen. The design's draft version
 * of this dialog reassures the reader that "what you have written is
 * saved as a draft" — there is no draft saving anywhere in this
 * application, so saying it here would be a promise made at exactly the
 * moment it is about to be broken. What this says instead is that unsent
 * writing will be lost, which is both true and the reason to press the
 * button.
 */

/** Idle means no deliberate input. Pointer movement is not consent to stay
 *  signed in — a sleeve resting on a trackpad would hold a shared tablet's
 *  session open forever — so only presses and keys count. */
const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = ['pointerdown', 'keydown'];

function clock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/** "2 minutes", "30 seconds" — for the spoken announcement, which should
 *  not read out a digit that has already changed by the time it is said. */
function spoken(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  if (total >= 60) {
    const minutes = Math.round(total / 60);
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
  }
  return `${total} seconds`;
}

export function SessionGuard({
  shared,
  onSignOut,
}: {
  shared: boolean;
  onSignOut: () => void;
}) {
  const limits = limitsFor(shared);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [extensionsUsed, setExtensionsUsed] = useState(0);
  const lastActivity = useRef(Date.now());
  const extendButton = useRef<HTMLButtonElement | null>(null);

  /**
   * A single one-second tick rather than a chain of timeouts that has to
   * be torn down and rebuilt on every keypress: with a chain, one missed
   * clear leaves a stale sign-out armed, and a session that ends for no
   * visible reason is the worst version of this feature.
   */
  useEffect(() => {
    const bump = () => {
      lastActivity.current = Date.now();
    };
    for (const event of ACTIVITY_EVENTS) window.addEventListener(event, bump, true);
    const tick = window.setInterval(() => {
      const idle = Date.now() - lastActivity.current;
      if (idle >= limits.signOutAfterMs) {
        onSignOut();
        return;
      }
      setRemaining(idle >= limits.warnAfterMs ? limits.signOutAfterMs - idle : null);
    }, 1000);
    return () => {
      window.clearInterval(tick);
      for (const event of ACTIVITY_EVENTS) window.removeEventListener(event, bump, true);
    };
  }, [limits.signOutAfterMs, limits.warnAfterMs, onSignOut]);

  /**
   * The warning appears without anyone asking for it, so focus has to move
   * to it — otherwise a screen-reader user hears the announcement and has
   * no idea where the button that answers it is.
   */
  const warning = remaining !== null;
  useEffect(() => {
    if (warning) extendButton.current?.focus();
  }, [warning]);

  if (remaining === null) return null;

  const mayExtend = extensionsUsed < limits.maxExtensions;

  return (
    <div className="session-warning" role="alertdialog" aria-labelledby="idle-heading" aria-describedby="idle-body">
      <h2 id="idle-heading">You will be signed out in {clock(remaining)}</h2>
      <div id="idle-body">
        <p>
          This happens when nothing has been touched for a while. It is here so that your information is not left
          on screen for whoever comes along next.
        </p>
        {/*
          Said plainly, because it is the consequence people care about and
          because this application genuinely cannot save it for them.
        */}
        <p>Anything you have typed but not yet sent or saved will be lost.</p>
        {!mayExtend && (
          <p>
            This device was marked as shared, so the time can only be extended once. It has been extended already.
          </p>
        )}
      </div>
      {/*
        role="timer" so it is identified as a countdown, but deliberately
        not a live region: announcing a number every second buries every
        other thing the screen reader has to say. The polite announcement
        below fires on the half minute instead.
      */}
      <p role="timer">{clock(remaining)}</p>
      <p aria-live="polite" className="visually-hidden">
        {`About ${spoken(Math.round(remaining / 30000) * 30000)} before you are signed out.`}
      </p>
      <p>
        {mayExtend && (
          <>
            <button
              ref={extendButton}
              onClick={() => {
                lastActivity.current = Date.now();
                setExtensionsUsed((n) => n + 1);
                setRemaining(null);
              }}
            >
              Keep me signed in
            </button>{' '}
          </>
        )}
        <button ref={mayExtend ? undefined : extendButton} onClick={onSignOut}>
          Sign out now
        </button>
      </p>
    </div>
  );
}
