import { useEffect, useState } from 'react';
import { api, type ContributionAwaitingReview, type Session } from '../api.js';
import { presentError, type PresentedError } from '../errors.js';
import { ErrorState, LoadingState } from './StateBlock.js';
import { nameOrGap } from '../names.js';

/**
 * What is genuinely waiting on this participant.
 *
 * Only one thing qualifies today, and it is a real gap rather than a
 * nice-to-have: a supporter can propose text into a participant's own life
 * story, `life-story.review-contribution` is owner-only so the participant
 * is the only person permitted to accept or reject it — and nothing listed
 * what was waiting. Someone could write about you, into your story, and
 * you had no way to find out.
 *
 * Assessments are deliberately absent even though `Scheduled` and
 * `Available` records exist. `assessment.record` carries no owner
 * permission, so a participant cannot complete one; listing a task they
 * are not able to do would be pointing at a door they cannot open.
 *
 * **This names what is waiting; it does not ask.** The handoff puts one
 * row per waiting thing here and the deciding on its own screen, and the
 * reason is measurable: with the decision inline, Home was 108 words and 3
 * controls with one contribution waiting and 224 words and 7 controls with
 * three. A front page whose size is set by how many people have written to
 * you is exactly what the owner asked to be rid of.
 */
/**
 * "1 August 2026", not "8/1/2026".
 *
 * The bare `toLocaleDateString()` used elsewhere in this app produced
 * `8/1/2026` in the capture — which is the first of August or the eighth of
 * January depending on where the reader learned to read dates, and this row
 * is read by somebody deciding whether text written about them enters their
 * own life story. A spelled month cannot be misread. The locale is pinned
 * because the document is `lang="en"` and an unpinned one would follow
 * whatever the device happens to be set to, including formats the page's
 * own language does not use.
 */
const offeredOn = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

export function WaitingForYou({
  session,
  onReview,
}: {
  session: Session;
  /** Open one waiting thing on its own screen, where it can be answered. */
  onReview: (contributionId: string) => void;
}) {
  const [items, setItems] = useState<ContributionAwaitingReview[] | null>(null);
  const [loadError, setLoadError] = useState<PresentedError | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setItems((await api.listContributionsAwaitingReview(session)).data.map((d) => d.attributes));
        setLoadError(null);
      } catch (err) {
        setLoadError(presentError(err));
      }
    })();
  }, []);

  return (
    <section aria-labelledby="waiting-heading">
      <h2 id="waiting-heading">Waiting for you</h2>
      {items === null && loadError === null && <LoadingState label="Checking what is waiting for you…" />}
      {loadError !== null && <ErrorState error={loadError} />}
      {/*
        A plain sentence, not a bordered empty-state block. The handoff is
        specific about this and it is right: a card drawn around "there is
        nothing here" gives absence the visual weight of a task, on the one
        screen whose whole purpose is to make the difference obvious.
      */}
      {items !== null && items.length === 0 && <p>Nothing needs a decision from you today.</p>}

      <ul className="row-list">
        {(items ?? []).map((c) => (
          <li key={c.contributionId}>
            <button className="row-link" onClick={() => onReview(c.contributionId)}>
              <span className="row-link__text">
                {/*
                  The name, which the handoff asks for and which the server
                  withheld by a ruling the owner has since reversed (B-17,
                  2026-08-29 — the reasoning on both sides is recorded in
                  `listContributionsAwaitingReview`). `nameOrGap` covers the
                  account with no name on record: that is a gap in the
                  record, not an anonymous contribution, and it says so
                  instead of printing an account identifier at somebody.
                */}
                <span className="row-link__title">
                  {nameOrGap(c.contributorDisplayName)} has offered something for your story
                </span>
                {/*
                  An absolute date, not "Offered Monday". A relative date
                  needs a "now" to be relative to, which is how a page
                  starts telling somebody it was offered "in 3 days" when a
                  clock disagrees — and this project has already lost a day
                  to a test suite that agreed with reality until it did not
                  (D-103). It is also simply clearer to read.
                */}
                <span className="row-link__detail">
                  Only you can decide this. Offered {offeredOn(c.createdAt)}.
                </span>
              </span>
              <span className="row-link__chevron" aria-hidden="true">
                ›
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
