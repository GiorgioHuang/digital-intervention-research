import { useEffect, useState } from 'react';
import { api, type SharedStoryPiece, type Session } from '../api.js';
import { presentError, type PresentedError } from '../errors.js';
import { EmptyState, ErrorState, LoadingState } from './StateBlock.js';
import { entryDate, excerptOf } from '../story-entry.js';

/**
 * "Other people's stories" — the drawing's community screen.
 *
 * The tab already had a screen, and it was a different thing: community
 * spaces, joining them, drafting and publishing posts (M18). The drawing
 * under this tab is a feed of pieces of other people's LIFE STORIES, with
 * "Choose one of mine to share" leading back to My story — which is what
 * the Community and Connections scopes were for, and until now they
 * reached nobody (B-30).
 *
 * What the drawing has that this does not is a like button and a comment
 * button. Nothing exists behind either: there is no reactions table and
 * no comments table anywhere on this platform, and comments on somebody's
 * life story would need moderation, reporting and blocking before they
 * could be offered at all. A control that cannot do the thing it names is
 * the failure this project keeps taking out, so they are not drawn
 * (X-40).
 */
export function OtherPeoplesStories({ session, onGoToMyStory }: { session: Session; onGoToMyStory: () => void }) {
  const [pieces, setPieces] = useState<SharedStoryPiece[] | null>(null);
  const [error, setError] = useState<PresentedError | null>(null);
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set());

  useEffect(() => {
    void (async () => {
      try {
        setPieces((await api.storiesSharedWithMe(session)).data.map((d) => d.attributes));
      } catch (err) {
        setError(presentError(err));
      }
    })();
  }, []);

  const toggle = (itemId: string) =>
    setOpen((was) => {
      const next = new Set(was);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });

  /**
   * Who wrote it. A name that could not be resolved is said to be
   * unknown rather than filled in — putting somebody's memory under a
   * made-up name is worse than saying the name is missing.
   */
  const who = (piece: SharedStoryPiece) =>
    piece.mine ? 'Yours' : (piece.ownerDisplayName ?? 'Somebody on this platform');

  if (error !== null) return <ErrorState error={error} />;
  if (pieces === null) return <LoadingState label="Looking for stories shared with you…" />;

  return (
    <section className="story-screen" aria-labelledby="others-heading">
      <h1 id="others-heading">Other people&rsquo;s stories</h1>
      {/*
        The drawing's reassurance, and it is exactly true: nothing of
        theirs is here unless they chose a piece and shared it, and a
        piece they did share appears — marked "Yours" — which is the only
        way somebody can check that sharing did what they meant.
      */}
      <p className="story-reassurance">
        Your own story stays private. Nothing of yours appears here unless you choose a piece and share it.
      </p>

      {pieces.length === 0 ? (
        <EmptyState
          title="Nothing has been shared with you yet"
          detail="When somebody in your community shares a piece of their story, it will be here."
        />
      ) : (
        pieces.map((piece) => {
          const isOpen = open.has(piece.itemId);
          const body = `shared-piece-${piece.itemId}`;
          return (
            <article key={piece.itemId} className="story-entry" aria-label={piece.title}>
              <p className="story-entry__who">{who(piece)}</p>
              <h2 className="story-entry__heading">
                <button
                  className="story-entry__open"
                  aria-expanded={isOpen}
                  aria-controls={body}
                  onClick={() => toggle(piece.itemId)}
                >
                  <span className="story-entry__title">{piece.title}</span>
                  {!isOpen && excerptOf(piece.contentText) !== '' && (
                    <span className="story-entry__excerpt">{excerptOf(piece.contentText)}</span>
                  )}
                  <span className="story-entry__meta">
                    {entryDate(piece.updatedAt)}
                    {/*
                      Marked on the row. A reader scanning a feed would
                      otherwise see a model's draft and somebody's own
                      writing as the same thing (ADR-024, Doc 19 §10).
                    */}
                    {piece.sourceType === 'AIDraft' && (
                      <span className="state state--ai">A drafting tool wrote this</span>
                    )}
                  </span>
                </button>
              </h2>
              {isOpen && (
                <div id={body} className="story-entry__body">
                  {piece.contentText !== null && (
                    <blockquote className="story-entry__words">{piece.contentText}</blockquote>
                  )}
                  <div className="story-entry__notes">
                    {piece.testimonyState === 'ParticipantTestimony' ? (
                      <p>They have confirmed these are their own words.</p>
                    ) : (
                      <p>They have not confirmed these as their own words.</p>
                    )}
                  </div>
                </div>
              )}
            </article>
          );
        })
      )}

      <hr />
      <button className="story-ask" onClick={onGoToMyStory}>
        Choose one of mine to share
      </button>
    </section>
  );
}
