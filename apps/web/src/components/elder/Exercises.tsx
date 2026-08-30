import { useEffect, useRef, useState } from 'react';

/**
 * The exercises, and the tapping exercise — the handoff's `exercises` and
 * `tapping`.
 *
 * The copy voice section is emphatic about two things and both are load
 * bearing: these are **exercises**, never "games", and **no score is ever
 * shown**. "A Parkinson's tapping measure framed as a game invites a
 * score, and a score invites a person to read a bad day as decline." Taps
 * go to the study; the participant sees elapsed time and nothing else.
 *
 * **Nothing is recorded yet (B-10).** There is no exercise-result store
 * and no endpoint, so a finished exercise goes nowhere. The screens are
 * built and the closing lines say what is true — "Nothing is saved unless
 * you finish it" is the design's line, and this build cannot save it
 * either way, so Finish says what actually happens instead.
 */
const EXERCISES: {
  key: string;
  name: string;
  meta: string;
  icon: 'pointer' | 'spiral' | 'eye' | 'hand';
  available: boolean;
}[] = [
  { key: 'tapping', name: 'Tapping', meta: 'About 3 minutes · for your hands', icon: 'pointer', available: true },
  { key: 'spiral', name: 'Drawing a spiral', meta: 'About 2 minutes · for your hands', icon: 'spiral', available: false },
  { key: 'naming', name: 'Naming what you see', meta: 'About 4 minutes · for your memory', icon: 'eye', available: false },
  { key: 'hold', name: 'Steady hold', meta: 'About 1 minute · for your hands', icon: 'hand', available: false },
];

/** Lucide paths, on the 24px grid at stroke 2 the rest of the app uses. */
const ICONS: Record<string, JSX.Element> = {
  pointer: (
    <>
      <path d="M22 14a8 8 0 0 1-8 8" />
      <path d="M18 11v-1a2 2 0 0 0-2-2a2 2 0 0 0-2 2" />
      <path d="M14 10V9a2 2 0 0 0-2-2a2 2 0 0 0-2 2v1" />
      <path d="M10 9.5V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v10" />
      <path d="M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
    </>
  ),
  spiral: <path d="M12 21a9 9 0 0 0 9-9 7 7 0 0 0-7-7 5 5 0 0 0-5 5 3 3 0 0 0 3 3 1 1 0 0 0 1-1" />,
  eye: (
    <>
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  hand: (
    <>
      <path d="M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2" />
      <path d="M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2" />
      <path d="M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8" />
      <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
    </>
  ),
};

const Icon = ({ name }: { name: string }) => (
  <svg
    viewBox="0 0 24 24"
    width="26"
    height="26"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    {ICONS[name]}
  </svg>
);

export function Exercises({ onHome, onTapping }: { onHome: () => void; onTapping: () => void }) {
  return (
    <section aria-labelledby="exercises-heading">
      <p>
        <button className="back-link" onClick={onHome}>
          ‹ Home
        </button>
      </p>
      <h1 id="exercises-heading">Exercises you can try</h1>
      <p>
        Four short exercises for your hands, your eyes and your memory. Choose whichever you like, whenever you like.
        There is no score and nothing is counted against you.
      </p>
      <ul className="exercise-list">
        {EXERCISES.map((e) => (
          <li key={e.key}>
            {/*
              Only Tapping opens. The other three are drawn because the
              design draws them and because a person choosing "whichever
              you like" should see what the four are — but they are not
              buttons, so nothing here offers a door that does not open
              (D-2, D-5, D-21, D-34, D-75). What they are is said in words.
            */}
            {e.available ? (
              <button className="exercise exercise--open" onClick={onTapping}>
                <span className="exercise__tile exercise__tile--open">
                  <Icon name={e.icon} />
                </span>
                <span className="exercise__text">
                  <span className="exercise__name">{e.name}</span>
                  <span className="exercise__meta">{e.meta}</span>
                </span>
              </button>
            ) : (
              <div className="exercise">
                <span className="exercise__tile">
                  <Icon name={e.icon} />
                </span>
                <span className="exercise__text">
                  <span className="exercise__name">{e.name}</span>
                  <span className="exercise__meta">{e.meta}</span>
                  <span className="exercise__meta">Not ready yet.</span>
                </span>
              </div>
            )}
          </li>
        ))}
      </ul>
      <p>
        <small>You can stop any exercise part way through.</small>
      </p>
    </section>
  );
}

/**
 * Tapping.
 *
 * The elapsed clock is the only number on the screen. The tap count is
 * held here because the design says it goes to the study — and nothing
 * receives it, so it goes nowhere (B-10). It is deliberately awkward to
 * display: it never leaves this component and no prop carries it out.
 */
export function Tapping({ onDone }: { onDone: (message?: string) => void }) {
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const taps = useRef(0);

  useEffect(() => {
    if (startedAt === null) return;
    const id = setInterval(() => setElapsed(Date.now() - startedAt), 200);
    // "The clock stops on any navigation away" — unmounting is that.
    return () => clearInterval(id);
  }, [startedAt]);

  const tap = () => {
    taps.current += 1;
    if (startedAt === null) setStartedAt(Date.now());
  };

  return (
    <section aria-labelledby="tapping-heading">
      <p>
        <button className="back-link" onClick={() => onDone()}>
          ‹ All exercises
        </button>
      </p>
      <h1 id="tapping-heading">Tapping</h1>
      <p>
        Tap the two circles one after the other, as evenly as you can. Use whichever hand you like, and stop whenever
        you want to.
      </p>
      <div className="tapping">
        {[1, 2].map((n) => (
          <button key={n} className="tapping__circle" onClick={tap} aria-label={`Circle ${n}`}>
            {n}
          </button>
        ))}
      </div>
      {/*
        Elapsed time, and deliberately not the tap count. A score invites a
        person to read a bad day as decline, which is the copy voice's own
        reason and the reason this screen shows a clock instead.
      */}
      <p className="tapping__clock" role="timer" aria-live="off">
        {clock(elapsed)}
      </p>
      <p className="tapping__caption">No score is kept. This is not a test.</p>
      <p>
        {/*
          The design's Finish says "Nothing is saved unless you finish it".
          Nothing receives a finished exercise (B-10), so this says what
          actually happens rather than promising a save that has nowhere to
          go.
        */}
        <button
          className="primary"
          onClick={() => onDone('Done. Thank you for trying it. Nothing was recorded — this part is not built yet.')}
        >
          Finish
        </button>
      </p>
      <p>
        <button onClick={() => onDone()}>Stop without saving</button>
      </p>
    </section>
  );
}

/** m:ss, tabular, from milliseconds. */
export const clock = (ms: number): string => {
  const total = Math.floor(ms / 1000);
  return `${String(Math.floor(total / 60))}:${String(total % 60).padStart(2, '0')}`;
};
