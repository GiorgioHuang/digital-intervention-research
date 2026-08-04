import { useState } from 'react';

/**
 * Assisted mode (decision D-15): read-only assistance.
 *
 * The helper never acts for the participant. There is no second identity,
 * nothing is done "on behalf of" anyone, and every control still has to be
 * pressed by the participant — so every record stays true about who did
 * what. What this adds is honesty about who is *present*.
 *
 * Two things follow from that, and both are deliberate:
 *
 * - The helper's name is entered by the participant and never leaves the
 *   device. It exists so the banner can say something meaningful to the
 *   person being helped; nobody else has a use for it.
 * - Messages sent while it is on are marked for the recipient. A helper
 *   can read the whole conversation, so the other party's audience is
 *   larger than they would otherwise assume — that is theirs to know.
 *
 * The participant turns it on and off. A mode that someone else could
 * switch on would be surveillance wearing the word "help".
 */
export function AssistedMode({
  helper,
  onChange,
}: {
  helper: string | null;
  onChange: (helper: string | null) => void;
}) {
  const [name, setName] = useState('');

  if (helper !== null) {
    return (
      <section aria-labelledby="assist-on-heading" className="state state--info">
        <h2 id="assist-on-heading">{helper} is helping you right now</h2>
        <p>
          They can see this screen, including your messages. Everything you do is still done by you — {helper} cannot
          press anything for you.
        </p>
        <p>Messages you send while this is on will say that someone was helping you.</p>
        <p>
          <button
            onClick={() => {
              onChange(null);
              setName('');
            }}
          >
            Stop — nobody is helping me now
          </button>
        </p>
      </section>
    );
  }

  return (
    <details>
      <summary>Someone is helping me use this</summary>
      <p>
        If a family member, friend or member of staff is sitting with you, you can say so. They will still not be able
        to do anything for you — you press everything yourself — but the app will show who is with you, and anyone you
        message will be told that someone was helping.
      </p>
      <p>
        <label htmlFor="helper-name">Who is helping you?</label>{' '}
        <input id="helper-name" value={name} onChange={(e) => setName(e.target.value)} />
      </p>
      <p>
        <small>This name stays on this device. It is not sent anywhere, and nobody else sees it.</small>
      </p>
      <p>
        <button disabled={name.trim() === ''} onClick={() => onChange(name.trim())}>
          Start
        </button>
      </p>
    </details>
  );
}
