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
  onError,
}: {
  label?: string;
  description?: string;
  onError?: (message: string) => void;
}): JSX.Element {
  const [starting, setStarting] = useState(false);

  return (
    <>
      <p>
        {description ??
          'You will be taken to Google to sign in, then brought straight back here. This platform never sees your Google password.'}
      </p>
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
