import { useEffect, useState } from 'react';
import { api, type ContributionAwaitingReview, type Session } from '../api.js';
import { presentError, type PresentedError } from '../errors.js';
import { EmptyState, ErrorState, LoadingState } from './StateBlock.js';

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
 */
export function WaitingForYou({ session }: { session: Session }) {
  const [items, setItems] = useState<ContributionAwaitingReview[] | null>(null);
  const [loadError, setLoadError] = useState<PresentedError | null>(null);
  const [actionError, setActionError] = useState<PresentedError | null>(null);
  const [announcement, setAnnouncement] = useState('');

  const load = async () => {
    try {
      setItems((await api.listContributionsAwaitingReview(session)).data.map((d) => d.attributes));
      setLoadError(null);
    } catch (err) {
      setLoadError(presentError(err));
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const decide = async (c: ContributionAwaitingReview, decision: 'Accepted' | 'Rejected') => {
    if (c.itemId === null) {
      setAnnouncement('This contribution is not attached to a part of your story yet, so it cannot be decided here.');
      return;
    }
    try {
      await api.reviewContribution(session, c.contributionId, c.itemId, decision);
      setActionError(null);
      setAnnouncement(
        decision === 'Accepted'
          ? 'Added to your story, marked as written by the person who offered it — not as your own words.'
          : 'Not added. Nothing of it goes into your story.',
      );
      await load();
    } catch (err) {
      setActionError(presentError(err));
    }
  };

  return (
    <section aria-labelledby="waiting-heading">
      <h2 id="waiting-heading">Waiting for you</h2>

      {items === null && loadError === null && <LoadingState label="Checking what is waiting for you…" />}
      {loadError !== null && <ErrorState error={loadError} />}
      {items !== null && items.length === 0 && (
        <EmptyState title="Nothing is waiting for you" detail="Anything that needs your decision will appear here." />
      )}

      {(items ?? []).map((c) => (
        <article key={c.contributionId} aria-label={`Contribution ${c.contributionId}`}>
          <h3>Someone has offered something for your life story</h3>
          <p>
            Only you can decide this. Nothing is added to your story unless you accept it, and if you accept, it is
            shown as their account of things — not as your own words.
          </p>
          <blockquote>{c.contentText}</blockquote>
          <p>
            <button onClick={() => void decide(c, 'Accepted')}>Add this to my story</button>{' '}
            <button onClick={() => void decide(c, 'Rejected')}>Do not add this</button>
          </p>
        </article>
      ))}

      {actionError !== null && <ErrorState error={actionError} />}
      <p aria-live="polite" role="status">
        {announcement}
      </p>
    </section>
  );
}
