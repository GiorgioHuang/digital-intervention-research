import { useCallback } from 'react';

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
  language,
  onLanguage,
  readAloudTarget,
}: {
  zoom: number;
  onZoom: (next: (from: number) => number) => void;
  highContrast: boolean;
  onHighContrast: (next: boolean) => void;
  language: 'en' | 'fr';
  onLanguage: (next: 'en' | 'fr') => void;
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
        Two groups, and the reason is arithmetic rather than taste.
        Measured at 390px: the six controls come to 429px against 362px of
        usable width. The handoff's own bar fits because its squares are
        34px on a 404px frame; at the 44px its accessibility section
        requires, they do not. Both cannot hold, so the row becomes two
        rows — each group whole, nothing shrunk, nothing broken mid-word.
      */}
      <div className="elder-toolbar__group">
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
      </div>
      <div className="elder-toolbar__group elder-toolbar__group--end">
        <button
          type="button"
          className="elder-toolbar__square"
          aria-pressed={highContrast}
          aria-label="Stronger black and white"
          onClick={() => onHighContrast(!highContrast)}
        >
          <span aria-hidden="true">◐</span>
        </button>
        <button
          type="button"
          className="elder-toolbar__square"
          onClick={() => onLanguage(language === 'en' ? 'fr' : 'en')}
          aria-label={language === 'en' ? 'Passer en français' : 'Switch to English'}
        >
          {language === 'en' ? 'FR' : 'EN'}
        </button>
      </div>
    </div>
  );
}
