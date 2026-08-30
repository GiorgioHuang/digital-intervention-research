import { useEffect, useState } from 'react';
import { api, type ContributionAwaitingReview, type MyLifeStoryItem, type Session } from '../api.js';
import { presentError, type PresentedError } from '../errors.js';
import { ErrorState, LoadingState } from './StateBlock.js';
import { nameOrGap } from '../names.js';

/**
 * Deciding on one thing somebody has offered for your story.
 *
 * This is the handoff's `review` screen, and the deciding used to happen on
 * Home. That was measurable rather than arguable: with one contribution
 * waiting Home was 108 words and 3 controls; with three it was **224 words
 * and 7 controls**, because each one brought a heading, two sentences of
 * explanation, the offered text in full, and two buttons. The queue grew
 * the front page. The owner's instruction was that arriving must not put a
 * pile of things in front of somebody, and a page whose size is set by how
 * many people have written to you is the opposite of that.
 *
 * So Home names what is waiting and this screen is where it is answered.
 * Nothing is hidden — one tap, and everything that was on Home is here,
 * with more room than it had.
 *
 * The screen loads the list rather than being handed the item. A
 * contribution can be decided elsewhere (a second device, a helper
 * present), and a stale object passed down would show a decision that is
 * no longer there to make.
 */
export function ReviewContribution({
  session,
  contributionId,
  onDone,
}: {
  session: Session;
  contributionId: string;
  onDone: () => void;
}) {
  const [items, setItems] = useState<ContributionAwaitingReview[] | null>(null);
  const [parts, setParts] = useState<MyLifeStoryItem[] | null>(null);
  const [loadError, setLoadError] = useState<PresentedError | null>(null);
  const [actionError, setActionError] = useState<PresentedError | null>(null);
  const [choosingWhere, setChoosingWhere] = useState(false);
  /*
   * What the decision did, said afterwards.
   *
   * The screen does not jump back to Home the moment a button is pressed.
   * These two sentences are the only place a participant is told what
   * accepting actually means — that it enters their story as somebody
   * else's account and not as their own words — and a confirmation that
   * flashes past on the way to another screen is not told to anybody. So
   * the decision resolves here, in place, and going back is a separate act.
   */
  const [outcome, setOutcome] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setItems((await api.listContributionsAwaitingReview(session)).data.map((d) => d.attributes));
        setLoadError(null);
      } catch (err) {
        setLoadError(presentError(err));
      }
    })();
  }, [contributionId]);

  const contribution = (items ?? []).find((c) => c.contributionId === contributionId) ?? null;

  const decide = async (decision: 'Accepted' | 'Rejected', itemId?: string) => {
    if (contribution === null) return;
    try {
      await api.reviewContribution(session, contribution.contributionId, decision, itemId);
      setActionError(null);
      setChoosingWhere(false);
      setOutcome(
        decision === 'Accepted'
          ? 'Added to your story, marked as written by the person who offered it — not as your own words.'
          : 'Not added. Nothing of it goes into your story.',
      );
    } catch (err) {
      setActionError(presentError(err));
    }
  };

  /**
   * Accepting text that was not offered against a particular part of the
   * story means choosing where it belongs — which is the participant's
   * decision, not the supporter's and not this screen's.
   */
  const startAccepting = async () => {
    if (contribution === null) return;
    if (contribution.itemId !== null) {
      await decide('Accepted');
      return;
    }
    setChoosingWhere(true);
    setParts(null);
    try {
      setParts((await api.getMyLifeStory(session)).data.map((d) => d.attributes));
      setActionError(null);
    } catch (err) {
      setActionError(presentError(err));
    }
  };

  return (
    <section aria-labelledby="review-heading">
      <p>
        <button className="back-link" onClick={onDone}>
          ‹ Back to Home
        </button>
      </p>
      {items === null && loadError === null && <LoadingState label="Opening what was offered…" />}
      {loadError !== null && <ErrorState error={loadError} />}
      {/*
        Gone rather than missing. Somebody who taps a row and finds the
        decision already made needs to be told that plainly — most likely
        they made it themselves a moment ago on another device, or a helper
        was with them. Reporting it as an error would suggest something
        broke.
      */}
      {items !== null && contribution === null && outcome === null && (
        <>
          <h1 id="review-heading">This has already been decided</h1>
          <p>Nothing is waiting here any more. It may have been answered on another device.</p>
        </>
      )}
      {/*
        Mounted from the start and empty until there is something to say.
        A live region inserted into the page already holding its text is
        announced unreliably; one that is present and then changes is the
        pattern assistive technology is built around. It is hidden because
        the same words are shown below — this is the announcement, not a
        second copy of the message.
      */}
      <p className="visually-hidden" role="status" aria-live="polite">
        {outcome ?? ''}
      </p>
      {outcome !== null && (
        <>
          <h1 id="review-heading">That is done</h1>
          <p>{outcome}</p>
          <p>
            <button onClick={onDone}>Back to Home</button>
          </p>
        </>
      )}
      {contribution !== null && outcome === null && (
        <>
          {/*
            The name, here most of all: this is the screen where the
            decision is actually made, and making it without being told who
            wrote the words is the position B-17 existed to describe.
          */}
          <h1 id="review-heading">
            {nameOrGap(contribution.contributorDisplayName)} has offered something for your life story
          </h1>
          <p>
            Only you can decide this. Nothing is added to your story unless you accept it, and if you accept, it is
            shown as their account of things — not as your own words.
          </p>
          <blockquote>{contribution.contentText}</blockquote>
          {/*
            Both answers, exactly alike, and the same width as well — they
            were text-sized before, so the longer one was the wider one.
            Equal weight is a rule here rather than a preference
            (DESIGN_BRIEF), and width is weight.
          */}
          <div className="task__answers">
            <button onClick={() => void startAccepting()}>Add this to my story</button>
            <button onClick={() => void decide('Rejected')}>Do not add this</button>
          </div>

          {choosingWhere && (
            <div role="group" aria-labelledby="where-heading">
              <h2 id="where-heading">Where should this go?</h2>
              {parts === null && <LoadingState label="Loading the parts of your story…" />}
              {parts !== null && parts.length === 0 && (
                <p>
                  You have not written any part of your story yet, so there is nowhere to add this. You can still say
                  no to it, and you can write something first and come back.
                </p>
              )}
              {(parts ?? []).map((p) => (
                <p key={p.itemId}>
                  <button onClick={() => void decide('Accepted', p.itemId)}>Add it to “{p.title}”</button>
                </p>
              ))}
              <p>
                {/* Backing out of the choice must not decide anything. */}
                <button onClick={() => setChoosingWhere(false)}>Go back without deciding</button>
              </p>
            </div>
          )}
        </>
      )}
      {actionError !== null && <ErrorState error={actionError} />}
    </section>
  );
}
