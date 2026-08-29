import { useCallback } from 'react';
import { BrandMark } from './BrandMark.js';

/**
 * The toolbar that sits on every signed-in screen.
 *
 * From the handoff's "Global chrome" §2. Text size, reading aloud, contrast
 * and language are not settings buried somewhere — they are permanently on
 * screen, which is the brief rather than a nicety: "Text-size control and
 * read-aloud on **every** screen".
 *
 * **One deliberate departure, and it is the design's own rule against the
 * design's own measurement.** The handoff specifies 34×34 controls here,
 * and states under Accessibility requirements that touch targets are
 * "44px absolute floor … Never below 44." Those cannot both hold. The rule
 * wins over the measurement: these are 44, which is also this platform's
 * floor (R1, `--target-min`). Recorded rather than silently reconciled.
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
   * be laid out by a test. Where speech is genuinely unavailable it is
   * disabled and says why, rather than vanishing and taking the layout
   * question with it.
   */
  const speechAvailable = typeof window !== 'undefined' && 'speechSynthesis' in window;

  return (
    <div className="elder-toolbar">
      {/*
        The brand, on the owner's instruction: on a wide screen the mark and
        the name sit at the left and the controls align to the right.

        It is a fifth child of this row but it is not a fifth control. Below
        the wide-screen breakpoint the stylesheet takes it out of the flow
        entirely (`display: none`), so the phone bar is the same four items,
        266px of them, that were measured to hold one row at 320px. Where it
        is shown, it takes the auto margin and the contrast button gives its
        own up — otherwise the two autos would fight and leave the contrast
        control marooned at the far end, away from the three it belongs with.
      */}
      <BrandMark />
      {/*
        One row, on the owner's instruction.
        
        It fits because the language toggle is gone: this study is English
        only, and a FR/EN control promised a French that was never coming.
        That freed the width the second row had been costing. What remains
        still refuses to shrink and refuses to wrap inside itself — the
        first version of this bar squeezed until the label came apart
        letter by letter, and a control narrower than its own word is not a
        smaller control.
      */}
      {/*
        The handoff's visible "Text" label is dropped, and it is the price
        of one row at 320px — measured, not guessed: the row was 50px over
        there, and this and the gap coming back to the handoff's own 6px
        are exactly that. It is the least harmful thing to lose. A− beside
        A+ is a near-universal pairing, and neither button is unlabelled:
        each carries "Make the text smaller"/"bigger" as its accessible
        name, so a screen reader announces more than the word "Text" ever
        gave a sighted reader.
      */}
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
        className="elder-toolbar__square"
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
        <span aria-hidden="true">🔊</span> Read aloud
      </button>
      <button
        type="button"
        className="elder-toolbar__square elder-toolbar__push"
        aria-pressed={highContrast}
        aria-label="Stronger black and white"
        onClick={() => onHighContrast(!highContrast)}
      >
        <span aria-hidden="true">◐</span>
      </button>
    </div>
  );
}
