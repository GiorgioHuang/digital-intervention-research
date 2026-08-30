import { useEffect, useState } from 'react';
import { api, type Session, type UncaptionedPhotograph } from '../api.js';

/**
 * "FINISH WHAT YOU STARTED" — the handoff's Home card.
 *
 * One photograph the person added to their life story and has not said
 * anything about. It is deliberately one, and deliberately not a count: a
 * card reading "4 photographs need words" is a chore list, and this is
 * meant to be a single thing somebody can finish this morning and then be
 * done. The greeting's second line says the same — "when it is done, it is
 * done".
 *
 * Absent when there is nothing unfinished, and absent when it cannot be
 * read. Neither is an error worth showing: the rest of Home still works,
 * and a person with nothing outstanding should see a page with nothing
 * outstanding on it rather than a block explaining that.
 */
export function UnfinishedPhotograph({
  session,
  onCaption,
  onPresence,
}: {
  session: Session;
  onCaption: (photograph: UncaptionedPhotograph) => void;
  /**
   * Whether there turned out to be anything unfinished. The greeting's
   * second line depends on it — the handoff says "One thing is unfinished"
   * — and a page cannot say that until this has answered.
   */
  onPresence?: (present: boolean) => void;
}) {
  const [item, setItem] = useState<UncaptionedPhotograph | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await api.listUncaptionedPhotographs(session);
        const found = res.data[0]?.attributes ?? null;
        if (cancelled) return;
        setItem(found);
        onPresence?.(found !== null);
      } catch {
        if (cancelled) return;
        setItem(null);
        onPresence?.(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (item === null) return null;

  return (
    <section className="unfinished" aria-labelledby="unfinished-heading">
      <p className="unfinished__kicker">Finish what you started</p>
      <h2 id="unfinished-heading">A photograph with no words</h2>
      {/* The design's line, and the design's date. */}
      <p>You added a photograph on {addedOn(item.addedAt)}. Nobody knows yet who is in it.</p>
      <p>
        <button className="primary" onClick={() => onCaption(item)}>
          Add words to this photograph
        </button>
      </p>
    </section>
  );
}

/**
 * "Tuesday" — the design's own form.
 *
 * A weekday names a day inside the last week and repeats every seven days
 * after that, and this card can be months old. The owner has ruled for the
 * drawing (2026-08-30); I had substituted a spelled date on my own
 * judgement, which is the substitution being undone here.
 */
const addedOn = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-GB', { weekday: 'long' });
