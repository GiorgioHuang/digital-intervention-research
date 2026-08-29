import { useState } from 'react';

/**
 * Helper mode, on its own screen — the handoff's `helper`.
 *
 * It used to be a disclosure sitting above the heading of **every** screen,
 * which is the single biggest thing separating the built Home from the
 * design: a row reading "Someone is helping me use this" was the first
 * thing on the page, ahead of the greeting, for the large majority of
 * people who have nobody sitting with them. The design puts it where it
 * belongs — a chevron row on Help, opening this — and leaves the top of
 * Home to the person whose morning it is.
 *
 * **What a helper may not do is not decoration here.** D-15 ruled that
 * assistance is read-only: the helper never acts, every control is still
 * pressed by the participant, and every record stays true about who did
 * what. The design's own list says the same, so the two agree — with one
 * exception, kept out deliberately.
 */
export function HelperScreen({
  helper,
  onChange,
  onDone,
}: {
  helper: string | null;
  onChange: (helper: string | null) => void;
  onDone: () => void;
}) {
  const [name, setName] = useState('');

  return (
    <section aria-labelledby="helper-heading">
      <p>
        <button className="back-link" onClick={onDone}>
          ‹ Back to help
        </button>
      </p>
      <h1 id="helper-heading">Someone is helping me</h1>
      <p>
        A helper works on this same device, sitting beside you. There is no separate sign-in, and nothing changes
        about who owns the story: it stays yours.
      </p>

      <h2>A helper may</h2>
      <ul className="annotation annotation--may">
        <li>read a screen out to you</li>
        <li>write down what you say, in your words</li>
        <li>find a photograph and put it in</li>
      </ul>

      <h2>A helper may not</h2>
      <ul className="annotation annotation--may-not">
        <li>accept or refuse anything on your behalf</li>
        <li>change who can see your story</li>
        <li>share anything with the community</li>
      </ul>

      {/*
        The design's note here reads "While a helper is with you, those
        decisions are put aside and shown to you again once helping stops."
        It is not printed, because this platform does not do it: nothing
        defers a decision while a helper is present and nothing re-presents
        it afterwards (gap B-13, and a change to D-15's ruling rather than
        an addition to it). Printing the sentence would tell somebody their
        decisions are being held for them when they are not — which is the
        one thing they are relying on while another person reads their
        screen. What is said instead is what is true.
      */}
      <p>
        The decisions stay yours to make while they are here. Nothing is held back for later, so take the time you
        want, and press everything yourself.
      </p>

      {helper === null ? (
        <>
          <p>
            <label htmlFor="helper-name">Who is helping you?</label>{' '}
            <input id="helper-name" value={name} onChange={(e) => setName(e.target.value)} />
          </p>
          <p>
            <small>This name stays on this device. It is not sent anywhere, and nobody else sees it.</small>
          </p>
          <p>
            <button
              className="primary"
              disabled={name.trim() === ''}
              onClick={() => {
                onChange(name.trim());
                onDone();
              }}
            >
              Start helping
            </button>
          </p>
        </>
      ) : (
        <p>
          <button
            className="primary"
            onClick={() => {
              onChange(null);
              setName('');
              onDone();
            }}
          >
            Stop — nobody is helping me now
          </button>
        </p>
      )}
      {/*
        Said once here rather than on every screen. A helper can read the
        whole conversation, so the other party's audience is larger than
        they would otherwise assume — that is theirs to know, and the
        marking happens whether or not this paragraph is read.
      */}
      <p>
        <small>Messages you send while someone is helping will say that someone was helping you.</small>
      </p>
    </section>
  );
}
