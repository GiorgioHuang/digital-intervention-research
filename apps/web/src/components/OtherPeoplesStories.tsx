import { useEffect, useState } from 'react';
import { api, type AttachedFile, type SharedStoryPiece, type Session } from '../api.js';
import { presentError, type PresentedError } from '../errors.js';
import { EmptyState, ErrorState, LoadingState } from './StateBlock.js';
import { entryDate } from '../story-entry.js';
import { usePhotographs } from '../photographs.js';
import { PostMenu, PostMenuItem, PostPhotographs, PostWords, PostFooter } from './Post.js';
import { ReportPerson } from './ReportPerson.js';

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
export function OtherPeoplesStories({
  session,
  onGoToMyStory,
  onGetHelp,
}: {
  session: Session;
  onGoToMyStory: () => void;
  onGetHelp?: () => void;
}) {
  const [pieces, setPieces] = useState<SharedStoryPiece[] | null>(null);
  const [error, setError] = useState<PresentedError | null>(null);
  /*
   * The piece being reported. Reporting is offered here — on the thing
   * somebody is actually reading — rather than on a settings page behind
   * a field asking for the author's internal identifier, which nobody
   * can know (owner, 2026-09-06).
   */
  const [reporting, setReporting] = useState<SharedStoryPiece | null>(null);
  /*
   * The photographs on each piece.
   *
   * This screen did not ask for them at all — so a memory shared with
   * its photograph appeared here as words alone, while the supporter's
   * screen showed the same memory with the picture on it. The scope work
   * made a photograph travel with the memory it is on (B-30); the feed
   * was the one reader that never looked.
   */
  const [files, setFiles] = useState<Record<string, AttachedFile[]>>({});
  const { pictures, load: loadPictures, canShow } = usePhotographs(session);

  useEffect(() => {
    void (async () => {
      try {
        const shared = (await api.storiesSharedWithMe(session)).data.map((d) => d.attributes);
        setPieces(shared);
        /*
         * Each piece's photographs, quietly and in parallel. A refusal
         * is the ordinary answer for a memory whose photographs were not
         * shared, and it is not a reason to put an error over somebody's
         * words — so a failure leaves that piece with none and the feed
         * readable.
         */
        await Promise.all(
          shared.map(async (piece) => {
            try {
              const attached = (
                await api.listItemFilesOwnedBy(session, piece.ownerParticipantId, piece.itemId)
              ).data.map((d) => d.attributes);
              if (attached.length === 0) return;
              setFiles((f) => ({ ...f, [piece.itemId]: attached }));
              await loadPictures(attached);
            } catch {
              /* This piece has no photographs to show; the words remain. */
            }
          }),
        );
      } catch (err) {
        setError(presentError(err));
      }
    })();
  }, []);

  /**
   * Who wrote it. A name that could not be resolved is said to be
   * unknown rather than filled in — putting somebody's memory under a
   * made-up name is worse than saying the name is missing.
   */
  const who = (piece: SharedStoryPiece) =>
    piece.mine ? 'Yours' : (piece.ownerDisplayName ?? 'A community member');

  /*
   * Name and city, which is exactly what the sharing screen promises a
   * shared memory will carry — and the city only when they chose to say
   * one. It is joined here rather than on the server so the two stay
   * separately readable: a screen that wants only the name has one.
   */
  const whoLine = (piece: SharedStoryPiece) =>
    piece.mine || piece.ownerCity === null ? who(piece) : `${who(piece)} · ${piece.ownerCity}`;

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
        pieces.map((piece) => (
          /*
           * A post, in the shape the owner asked for (2026-09-07): the
           * words folded with a way to read the rest, photographs shown,
           * everything that can be done at the corner, and when it was
           * written at the foot.
           *
           * It used to fold to a single row that opened. That was right
           * for a list of one's OWN memories, where somebody is looking
           * for a particular one among many; it is wrong for a feed of
           * other people's, where nobody knows what they are looking for
           * and a row of titles gives them no reason to open any of it.
           */
          <article key={piece.itemId} className="post" aria-label={piece.title}>
            <div className="post__head">
              <div>
                <p className="story-entry__who">{whoLine(piece)}</p>
                <h2 className="post__title">{piece.title}</h2>
              </div>
              {/*
                Only on somebody else's piece. A menu on your own with
                nothing in it would be a control that opens onto nothing;
                reporting your own memory is refused by the server, since
                a report names the author and here the author would be
                the reporter.
              */}
              {!piece.mine && (
                <PostMenu about={piece.title}>
                  <PostMenuItem onSelect={() => setReporting(piece)}>Report this</PostMenuItem>
                </PostMenu>
              )}
            </div>

            {piece.contentText !== null && <PostWords text={piece.contentText} label={piece.title} />}

            <PostPhotographs
              pictures={(files[piece.itemId] ?? [])
                .filter((f) => {
                  const held = pictures[f.objectId];
                  return held !== undefined && canShow(held.type);
                })
                .map((f) => ({
                  key: f.objectId,
                  url: pictures[f.objectId]!.url,
                  alt: `A photograph on ${piece.title}. Nothing here describes what is in it.`,
                }))}
            />

            <div className="story-entry__notes">
              {/*
                Provenance stays on the post rather than moving into the
                menu: a reader who cannot tell a drafting tool's words
                from their mother's has been told something false about
                their mother (ADR-024, Doc 19 §10).
              */}
              {piece.sourceType === 'AIDraft' && <p className="state state--ai">A drafting tool wrote this</p>}
              {piece.testimonyState === 'ParticipantTestimony' ? (
                <p>They have confirmed these are their own words.</p>
              ) : (
                <p>They have not confirmed these as their own words.</p>
              )}
            </div>

            <PostFooter when={entryDate(piece.updatedAt)} />
          </article>
        ))
      )}

      <hr />
      <button className="story-ask" onClick={onGoToMyStory}>
        Choose one of mine to share
      </button>
      {/*
        A window over the feed, not instead of it: the piece being
        reported stays on screen behind, which is what somebody is
        reporting and what they should still be able to see.
      */}
      {reporting !== null && (
        <ReportPerson
          session={session}
          name={who(reporting)}
          /*
            The MEMORY, not its author: the server looks the author up
            from the piece, so the case cannot be opened against somebody
            this screen merely named (D-107).
          */
          subject={{ kind: 'item', itemId: reporting.itemId }}
          onBack={() => setReporting(null)}
          {...(onGetHelp === undefined ? {} : { onGetHelp })}
        />
      )}
    </section>
  );
}
