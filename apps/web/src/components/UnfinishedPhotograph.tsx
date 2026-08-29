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
      {/*
        The design says "You added a photograph on Tuesday". A weekday
        alone is only unambiguous for about a week, and this card can be
        months old — a photograph nobody captioned is exactly the thing that
        sits. So it is the date, spelled, for the same reason the waiting
        card spells its own: this is the basis of what somebody does next.
      */}
      <p>
        You added it on {addedOn(item.addedAt)}. Nobody knows yet who is in it.
      </p>
      <p>
        <button className="primary" onClick={() => onCaption(item)}>
          Add words to this photograph
        </button>
      </p>
    </section>
  );
}

const addedOn = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
