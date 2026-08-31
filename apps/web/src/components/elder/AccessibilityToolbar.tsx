import { useCallback } from 'react';
import { BrandMark } from './BrandMark.js';

/**
 * The toolbar that sits on every signed-in screen — the handoff's "Global
 * chrome" §2, built to the drawing.
 *
 * "Text" label, then A− and A+ as two 34×34 buttons, then Read aloud as an
 * icon with its label, then the contrast toggle. Text size and reading
 * aloud are the brief rather than a nicety: "Text-size control and
 * read-aloud on **every** screen".
 *
 * **34×34 is the drawing, and the same document's accessibility section
 * says "44px absolute floor … Never below 44."** Those cannot both hold,
 * and the owner has ruled for the drawing (2026-08-30). Recorded here
 * rather than argued: 34px clears WCAG 2.2's 24px minimum (2.5.8, AA) and
 * fails its 44px enhanced target (2.5.5, AAA), which is the trade being
 * made. Every other control in this app keeps `--target-min`.
 *
 * The language toggle the drawing shows is absent on the owner's separate
 * instruction — this study is English only, and an FR/EN control would
 * switch between English and English.
 */
export const ZOOM_MIN = 0.9;
export const ZOOM_MAX = 1.4;
export const ZOOM_STEP = 0.1;

/** Kept to one decimal: repeated addition of 0.1 otherwise drifts. */
const step = (from: number, by: number): number =>
  Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Number((from + by).toFixed(2))));

export function AccessibilityToolbar({
  zoom,
  onZoom,
  highContrast,
  onHighContrast,
  readAloudTarget,
}: {
  zoom: number;
  onZoom: (next: (from: number) => number) => void;
  highContrast: boolean;
  onHighContrast: (next: boolean) => void;
  /** The region whose words are read. Nothing outside it is spoken. */
  readAloudTarget: React.RefObject<HTMLElement | null>;
}) {
  /*
   * Reading aloud speaks what is on the screen, at 0.9 — slower than the
   * default, which is the handoff's rate and audibly better for the person
   * this is for. If the browser has no speech, the control says so instead
   * of pretending: a button that appears to work and does nothing is worse
   * here than one that admits it.
   */
  const speak = useCallback(() => {
    const region = readAloudTarget.current;
    if (region === null) return;
    const synth = typeof window === 'undefined' ? undefined : window.speechSynthesis;
    if (synth === undefined) return;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(region.innerText);
    utterance.rate = 0.9;
    synth.speak(utterance);
  }, [readAloudTarget]);

  /*
   * Always rendered, never conditional.
   *
   * This used to disappear where `speechSynthesis` was absent, which meant
   * the toolbar had one shape in the test environment and another in a
   * browser — and the shape that was never measured was the one that
   * overflowed. A control whose presence depends on the environment cannot
   * be laid out by a test.
   */
  const speechAvailable = typeof window !== 'undefined' && 'speechSynthesis' in window;

  return (
    <div className="elder-toolbar">
      {/* The owner's, not the drawing's: the drawing has no mark here. */}
      <BrandMark />
      {/*
        The controls in one group, and the bar spaced between the two.
        
        The push used to be an `auto` margin on the brand. In a flex row
        that is allowed to wrap, an auto main-axis margin absorbs the whole
        line — so the brand took a line to itself and every control went
        below it. That is the same trap a spacer element caused earlier in
        this bar's life, arrived at from the other direction, and the fix
        is to stop asking a margin to do a layout's job.
      */}
      <div className="elder-toolbar__controls">
        <span className="elder-toolbar__label">Text</span>
      <button
        type="button"
        className="elder-toolbar__square"
        aria-label="Make the text smaller"
        onClick={() => onZoom((from) => step(from, -ZOOM_STEP))}
        disabled={zoom <= ZOOM_MIN}
      >
        A−
      </button>
      <button
        type="button"
        className="elder-toolbar__square elder-toolbar__square--plus"
        aria-label="Make the text bigger"
        onClick={() => onZoom((from) => step(from, ZOOM_STEP))}
        disabled={zoom >= ZOOM_MAX}
      >
        A+
      </button>
      <button
        type="button"
        className="elder-toolbar__read"
        onClick={speak}
        disabled={!speechAvailable}
        {...(speechAvailable ? {} : { title: 'This browser cannot read the screen out.' })}
      >
        {/* The drawing's speaker, 15px, stroke 1.8, round caps. */}
        <svg
          className="elder-toolbar__read-icon"
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M11 5 6 9H3v6h3l5 4V5z" />
          <path d="M16 9a4 4 0 0 1 0 6" />
          <path d="M19 6.5a8 8 0 0 1 0 11" />
        </svg>
        Read aloud
      </button>
      <button
        type="button"
        className="elder-toolbar__square"
        aria-pressed={highContrast}
        aria-label="Stronger black and white"
        onClick={() => onHighContrast(!highContrast)}
      >
        {/* The drawing's half-filled circle, 16px, stroke 1.6. */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          aria-hidden="true"
          focusable="false"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 3v18a9 9 0 0 0 0-18z" fill="currentColor" />
        </svg>
        </button>
      </div>
    </div>
  );
}
