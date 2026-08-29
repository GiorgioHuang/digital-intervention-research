import { useEffect, useState } from 'react';
import { api, type OwnDecision, type Session } from '../api.js';

/**
 * "What you decided recently" — the handoff's Home section.
 *
 * The platform recorded every one of these and showed none of them back to
 * the person who made them. That is worth more than a section on a page:
 * somebody who cannot remember whether they already answered a question,
 * or who was told by a helper that they agreed to something, now has a
 * place to look that is their own record rather than staff's.
 *
 * **It shows nothing rather than an empty state.** A participant with no
 * decisions yet is at the start, and a bordered block reading "you have not
 * decided anything" on their first morning says something unkind and
 * useless. The same is true of a failure: this is a look back, not a task,
 * and it must never put an error above the thing that actually wants
 * doing. Both cases render null.
 */
export function RecentDecisions({ session }: { session: Session }) {
  const [items, setItems] = useState<OwnDecision[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await api.listMyRecentDecisions(session);
        if (!cancelled) setItems(res.data.map((d) => d.attributes));
      } catch {
        if (!cancelled) setItems([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (items === null || items.length === 0) return null;

  return (
    <section aria-labelledby="decided-heading">
      <h2 id="decided-heading">What you decided recently</h2>
      <ul className="decision-list">
        {items.map((d, i) => (
          <li key={`${d.action}-${d.when}-${i}`}>
            <span className="decision-list__what">{d.what}</span>
            {/*
              A real <time>, and the date in the participant's own words
              rather than a machine's: "Tue 18 Aug", the handoff's own
              format. Tabular numerals so a column of dates lines up, which
              is what makes a list like this readable at a glance instead of
              needing to be read.
            */}
            <time className="decision-list__when" dateTime={d.when}>
              {decidedOn(d.when)}
            </time>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * "Tue 18 Aug" — the handoff's format, and no year.
 *
 * The year is left off because this list is the last three things and they
 * are recent by construction; a year on every row is noise that pushes the
 * date column wider on the narrowest phone. That is a different judgement
 * from the waiting card, which spells the date out in full — that one can
 * be months old and is the basis of a decision, and there an ambiguous or
 * partial date is worth the width.
 */
const decidedOn = (iso: string): string => {
  // Assembled from parts rather than taken from `toLocaleDateString`, which
  // inserts a comma — "Tue, 18 Aug" against the handoff's "Tue 18 Aug". A
  // comma there is not a typo to shrug at: it is the widest character in a
  // column that has to stay narrow on a 320px phone, and this list is read
  // by scanning the column rather than by reading the rows.
  const parts = new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).formatToParts(new Date(iso));
  return parts
    .filter((part) => part.type !== 'literal')
    .map((part) => part.value)
    .join(' ');
};
