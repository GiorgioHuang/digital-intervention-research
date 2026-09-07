import { useEffect, useState } from 'react';
import { api, type AttachedFile, type SharedStoryItem, type Session, type SupportedPerson } from '../api.js';
import { presentError, type PresentedError } from '../errors.js';
import { EmptyState, ErrorState, LoadingState } from './StateBlock.js';
import { entryDate, openingWords } from '../story-entry.js';
import { usePhotographs } from '../photographs.js';
import { PostFooter, PostPhotographs, PostWords } from './Post.js';

/**
 * The stories people have shared with you.
 *
 * The other end of B-30, and the half that makes any of it real. A
 * participant could set a memory to be readable by the people who support
 * them and there was nowhere for those people to read it — which would
 * have made the whole scope a control that does nothing, the failure this
 * project keeps taking out.
 *
 * Written for a supporter: somebody's daughter, opening what her mother
 * chose to show her. What she is shown is exactly what was shared and
 * nothing around it — not which scope it carries, not how many times it
 * was rewritten, not what else exists. A memory that is not here is not
 * described as missing, because saying "there are others you cannot see"
 * would tell her something about her mother's story that her mother did
 * not share.
 */

/** Who wrote the words, said to the person reading them. */
const SOURCE_WORDING: Record<string, string> = {
  ParticipantAuthored: 'They wrote this themselves.',
  AIDraft: 'A drafting tool suggested these words. They are not this person’s own words unless they have said so.',
  SupporterContribution: 'Someone who supports them wrote this and offered it.',
  Transcription: 'This was typed up from something they said.',
  Translation: 'This is a translation of something written elsewhere.',
};

export function StoriesSharedWithMe({ session }: { session: Session }) {
  const [people, setPeople] = useState<SupportedPerson[] | null>(null);
  const [reading, setReading] = useState<SupportedPerson | null>(null);
  const [items, setItems] = useState<SharedStoryItem[] | null>(null);
  const [error, setError] = useState<PresentedError | null>(null);
  const [files, setFiles] = useState<Record<string, AttachedFile[]>>({});
  const { pictures, settled, load: loadPictures, canShow } = usePhotographs(session);

  useEffect(() => {
    void (async () => {
      try {
        setPeople((await api.listPeopleISupport(session)).data.map((d) => d.attributes));
      } catch (err) {
        setError(presentError(err));
      }
    })();
  }, []);

  const openStory = async (person: SupportedPerson) => {
    setReading(person);
    setItems(null);
    try {
      const shared = (await api.sharedLifeStory(session, person.participantId)).data.map((d) => d.attributes);
      setItems(shared);
      setError(null);
      /*
       * And their photographs, with them. There is no fold any more —
       * a memory is a post and its words are simply there (owner,
       * 2026-09-07) — so nothing is left to hang the fetch on. One
       * request per memory, as on the participant's own story (B-38).
       */
      await Promise.all(shared.map((memory) => loadFiles(person.participantId, memory.itemId)));
    } catch (err) {
      setError(presentError(err));
    }
  };

  const name = (p: SupportedPerson) => p.participantDisplayName ?? 'Somebody you support';

  /**
   * A memory's photographs.
   *
   * A photograph follows the memory it is on, so the server returns these
   * only if this memory was shared with the person asking — nothing here
   * decides that, and nothing here needs to.
   */
  const loadFiles = async (ownerParticipantId: string, itemId: string) => {
    try {
      const attached = (await api.listItemFilesOwnedBy(session, ownerParticipantId, itemId)).data.map(
        (d) => d.attributes,
      );
      setFiles((f) => ({ ...f, [itemId]: attached }));
      await loadPictures(attached);
    } catch {
      /*
       * Quiet, and the memory stays readable. A refusal here is the
       * ordinary answer for a memory whose photographs were not shared,
       * and it is not a reason to put an error over somebody's words.
       */
      setFiles((f) => ({ ...f, [itemId]: [] }));
    }
  };

  if (error !== null && people === null) return <ErrorState error={error} />;
  if (people === null) return <LoadingState label="Looking for the stories shared with you…" />;

  if (reading !== null) {
    return (
      <section className="story-screen" aria-labelledby="shared-story-heading">
        <p>
          <button className="story-action" onClick={() => setReading(null)}>
            ‹ Back to the people you support
          </button>
        </p>
        <h1 id="shared-story-heading">{name(reading)}&rsquo;s life story</h1>
        {items === null && error === null && <LoadingState label="Opening their story…" />}
        {error !== null && <ErrorState error={error} />}
        {items !== null && items.length === 0 && (
          /*
            Nothing shared is not nothing written, and this must not
            imply either. It says what is true of this screen and stops.
          */
          <EmptyState
            title="They have not shared anything with you"
            detail="Only they can decide what to share, and they can change that whenever they like."
          />
        )}
        {(items ?? []).map((memory) => {
          const shown = files[memory.itemId] ?? [];
          /*
            A memory carries no title (owner, 2026-09-07), so what names
            it on this screen is the opening of its own words — for a
            screen reader moving between posts, and for anything that has
            to say which memory it means.
          */
          const name = openingWords(memory.contentText);
          /*
           * The ones there is a picture for, and the rest. A photograph
           * this page cannot draw is described rather than shown as a
           * broken frame — but it is somebody's mother's photograph, so
           * nothing is said about it at all until its fetch has finished.
           */
          const viewable = shown.filter((f) => {
            const held = pictures[f.objectId];
            return held !== undefined && canShow(held.type);
          });
          const described = shown.filter((f) => !viewable.includes(f));
          return (
            /*
             * A post, the same shape as the community feed and the
             * participant's own story (owner, 2026-09-07). It used to
             * fold to a row that had to be pressed before a word could
             * be read — which is the wrong idiom here for the same
             * reason it was wrong there: this is somebody's daughter
             * opening what her mother chose to show her, and a list of
             * titles gives her nothing to read.
             */
            <article key={memory.itemId} className="post" aria-label={name}>
              <div className="post__head">
                <div>
                                    {/*
                    Marked at the head, where it is read before the
                    words are. A reader who cannot tell a model's draft
                    from their mother's own writing has been told
                    something false about their mother (ADR-024, Doc 19
                    §10).
                  */}
                  {memory.sourceType === 'AIDraft' && (
                    <p className="story-entry__meta">
                      <span className="state state--ai">A drafting tool wrote this</span>
                    </p>
                  )}
                </div>
              </div>

              {memory.contentText !== null && <PostWords text={memory.contentText} label={name} />}

              <PostPhotographs
                pictures={viewable.map((f) => ({
                  key: f.objectId,
                  url: pictures[f.objectId]!.url,
                  alt: `A photograph on this memory. Nothing here describes what is in it.`,
                }))}
              />

              {described.length > 0 && (
                <ul className="story-photographs list-plain">
                  {described.map((f) => (
                    <li key={f.objectId} className="story-photograph">
                      {!settled.has(f.objectId) ? (
                        /*
                          Still arriving. A quiet frame the size the
                          photograph will fill, and no words: this said
                          "This photograph has not loaded", which is a
                          failure reported before there has been one —
                          and it said it over somebody's own photograph
                          every single time one was opened (owner,
                          2026-09-07). The sentence is for a screen
                          reader, which has nothing to look at.
                        */
                        <div className="story-photograph__loading" role="status">
                          <span className="visually-hidden">The photograph is loading.</span>
                        </div>
                      ) : (
                        <p className="story-photograph__unshown">
                          {pictures[f.objectId] === undefined
                            ? 'This photograph has not loaded.'
                            : 'This file is not a photograph this page can show.'}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              <div className="story-entry__notes">
                {/*
                  Provenance travels with the memory, in full sentences
                  as well as the mark above (ADR-024).
                */}
                <p className={memory.sourceType === 'AIDraft' ? 'state state--ai' : undefined}>
                  {SOURCE_WORDING[memory.sourceType ?? ''] ?? 'Where these words came from is not recorded.'}
                </p>
                {memory.testimonyState === 'ParticipantTestimony' && (
                  <p>They have confirmed these are their own words.</p>
                )}
              </div>

              <PostFooter when={entryDate(memory.updatedAt)} />
            </article>
          );
        })}
      </section>
    );
  }

  return (
    <section className="story-screen" aria-labelledby="shared-with-me-heading">
      <h1 id="shared-with-me-heading">Stories shared with you</h1>
      {people.length === 0 ? (
        <EmptyState
          title="Nobody has made you a supporter yet"
          detail="When somebody does, and chooses to share part of their life story with the people who help them, it will be here."
        />
      ) : (
        <ul className="story-prompts list-plain">
          {people.map((person) => (
            <li key={person.relationshipId}>
              <button onClick={() => void openStory(person)}>
                <span className="story-scope__label">{name(person)}</span>
                <span className="story-scope__meaning">
                  {person.relationshipState === 'Active'
                    ? 'Open what they have shared with you'
                    : `This relationship is ${person.relationshipState.toLowerCase()}, so there is nothing to read.`}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
