import { useState } from 'react';
import { beginSignIn } from '../auth.js';

/**
 * The sign-in control, for participants and staff alike.
 *
 * Written as one plain button on purpose. The people who use the
 * participant entrance are older adults, some on a borrowed tablet at a
 * community centre, and the screen they meet first should contain one
 * thing to do and a sentence saying what will happen. "You will be taken
 * to Google" is in that sentence because being sent to a different-looking
 * page unannounced is exactly what people are taught to be afraid of, and
 * a person who backs out there has not signed in.
 */
export function GoogleSignIn({
  label = 'Sign in with Google',
  description,
  registers = false,
  onError,
}: {
  label?: string;
  description?: string;
  /** Whether signing in here may create an account (self-signup). */
  registers?: boolean;
  onError?: (message: string) => void;
}): JSX.Element {
  const [starting, setStarting] = useState(false);

  return (
    <>
      {/*
        An empty description removes the line entirely, which the
        participant sign-in screen uses: the design puts one sentence of
        its own AFTER the button instead. Everywhere else the default
        stands, because being sent to a different-looking page unannounced
        is what people are taught to be afraid of.
      */}
      {description !== '' && (
        <p>
          {description ??
            'You will be taken to Google to sign in, then brought straight back here. This platform never sees your Google password.'}
        </p>
      )}
      {/*
        Signing in can CREATE an account, and the button has to say so.
        Somebody who has never been here before presses the same control as
        somebody returning, and "sign in" alone would let a person make an
        account without noticing they had. The second sentence is the one
        that answers what people actually worry about at this point.
      */}
      {registers && (
        <p>
          If you have not used this platform before, this creates your account. You will see only your own
          information — nobody else&apos;s — unless someone invites you to see theirs.
        </p>
      )}
      <button
        type="button"
        disabled={starting}
        onClick={() => {
          setStarting(true);
          void beginSignIn('sign-in').catch(() => {
            // The redirect never happened, so the person is still here and
            // owed an explanation rather than a button that did nothing.
            setStarting(false);
            onError?.('Could not start sign-in. Please check your connection and try again.');
          });
        }}
      >
        {starting ? 'Taking you to Google…' : label}
      </button>
    </>
  );
}
