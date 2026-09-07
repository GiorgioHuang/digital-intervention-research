import { useEffect, useRef, type ReactNode } from 'react';

/**
 * A window over the page, for anything a control opens.
 *
 * Every one of these used to be rendered inline, at the point in the
 * component where its state happened to be handled — which is very often
 * nowhere near the button that opens it. Reported on a community post:
 * pressing "Report" put the form at the very foot of the page, below
 * every other post, so it looked as though nothing had happened and the
 * button was pressed again and again (owner, 2026-09-06).
 *
 * It is written by hand rather than with `<dialog>`: `showModal` gives
 * the top layer, focus trapping and Esc for free, and jsdom implements
 * none of it — so the behaviour that matters here could not be tested at
 * all. The behaviours are therefore implemented and asserted:
 *
 *  * focus moves into the window when it opens, and back to the control
 *    that opened it when it closes — otherwise somebody using a keyboard
 *    or a screen reader is left where they were, reading the page behind;
 *  * Tab stays inside it;
 *  * Escape closes it;
 *  * the page behind does not scroll.
 *
 * The backdrop deliberately does NOT close it. These windows hold reports
 * and confirmations somebody has begun to fill in, and a stray tap beside
 * one — easy on a phone, easier with an unsteady hand — must not throw
 * away what they wrote. Every window carries its own way out, in words.
 */
export function Modal({
  labelledBy,
  role = 'alertdialog',
  wide = false,
  onClose,
  children,
}: {
  /** The id of the heading or first line inside — the window's name. */
  labelledBy: string;
  role?: 'dialog' | 'alertdialog';
  /** For a photograph opened to be looked at: as much room as there is. */
  wide?: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const panel = useRef<HTMLDivElement | null>(null);
  const opener = useRef<Element | null>(null);
  /*
   * The current way out, not the one this window opened with.
   *
   * The listener below is registered once, so it closes over whatever
   * `onClose` was on the first render — and a way out that reads state,
   * as the correction window's does when it keeps what was typed, would
   * act on the state as it stood when the window opened. Escape then
   * kept the first draft and threw away everything written since.
   */
  const closing = useRef(onClose);
  closing.current = onClose;

  useEffect(() => {
    opener.current = document.activeElement;
    const focusables = () =>
      [
        ...(panel.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ) ?? []),
      ].filter((el) => !el.hasAttribute('disabled'));
    /*
     * The panel itself, not its first button. Focusing a button reads it
     * out and nothing else, so somebody hears "Send" without hearing what
     * they are sending; focusing the window announces its name and its
     * text first, which is the whole reason it opened.
     */
    panel.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        closing.current();
        return;
      }
      if (e.key !== 'Tab') return;
      const items = focusables();
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0]!;
      const last = items[items.length - 1]!;
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === panel.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey, true);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey, true);
      document.body.style.overflow = previousOverflow;
      /*
       * Back where they were. Without this the page behind takes focus at
       * its very start, so closing a window sends somebody using a
       * keyboard back to the top of the screen instead of to the button
       * they pressed.
       */
      if (opener.current instanceof HTMLElement && opener.current.isConnected) opener.current.focus();
    };
  }, []);

  return (
    <div className="modal">
      <div
        className={wide ? 'modal__panel modal__panel--wide' : 'modal__panel'}
        ref={panel}
        role={role}
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
      >
        {children}
      </div>
    </div>
  );
}
