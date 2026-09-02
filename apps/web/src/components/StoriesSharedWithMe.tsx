import { useEffect, useState } from 'react';
import { api, type AttachedFile, type SharedStoryItem, type Session, type SupportedPerson } from '../api.js';
import { presentError, type PresentedError } from '../errors.js';
import { EmptyState, ErrorState, LoadingState } from './StateBlock.js';
import { entryDate, excerptOf } from '../story-entry.js';
import { usePhotographs } from '../photographs.js';

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
  /**
   * Which memories are open, the same idiom as the participant's own
   * story: a row that opens, so a story of forty pieces is a list
   * somebody can read rather than forty columns to scroll past.
   *
   * It is also what keeps the photograph requests proportional. A screen
   * that fetched every picture on arrival would spend one request per
   * memory before anybody had decided to read one.
   */
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set());
  const [files, setFiles] = useState<Record<string, AttachedFile[]>>({});
  const { pictures, load: loadPictures, canShow } = usePhotographs(session);

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
      setItems((await api.sharedLifeStory(session, person.participantId)).data.map((d) => d.attributes));
      setError(null);
    } catch (err) {
      setError(presentError(err));
    }
  };

  const name = (p: SupportedPerson) => p.participantDisplayName ?? 'Somebody you support';

  /**
   * Opening a memory brings its photographs with it.
   *
   * A photograph follows the memory it is on, so the server returns these
   * only if this memory was shared with the person asking — nothing here
   * decides that, and nothing here needs to.
   */
  const toggle = (itemId: string) => {
    const opening = !open.has(itemId);
    setOpen((was) => {
      const next = new Set(was);
      if (opening) next.add(itemId);
      else next.delete(itemId);
      return next;
    });
    if (opening && files[itemId] === undefined && reading !== null) void loadFiles(reading.participantId, itemId);
  };

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
          const isOpen = open.has(memory.itemId);
          const body = `shared-${memory.itemId}`;
          const shown = files[memory.itemId] ?? [];
          return (
            <article key={memory.itemId} className="story-entry" aria-label={memory.title}>
              <h2 className="story-entry__heading">
                <button
                  className="story-entry__open"
                  aria-expanded={isOpen}
                  aria-controls={body}
                  onClick={() => toggle(memory.itemId)}
                >
                  <span className="story-entry__title">{memory.title}</span>
                  {!isOpen && excerptOf(memory.contentText) !== '' && (
                    <span className="story-entry__excerpt">{excerptOf(memory.contentText)}</span>
                  )}
                  <span className="story-entry__meta">
                    {entryDate(memory.updatedAt)}
                    {/*
                      Marked on the row, not only inside. A reader
                      scanning a list would otherwise see a model's draft
                      and their mother's own writing as the same thing
                      (ADR-024, Doc 19 §10).
                    */}
                    {memory.sourceType === 'AIDraft' && (
                      <span className="state state--ai">A drafting tool wrote this</span>
                    )}
                  </span>
                </button>
              </h2>
              {isOpen && (
                <div id={body} className="story-entry__body">
                  {memory.contentText !== null && (
                    <blockquote className="story-entry__words">{memory.contentText}</blockquote>
                  )}
                  {shown.length > 0 && (
                    <ul className="story-photographs list-plain">
                      {shown.map((f) => {
                        const picture = pictures[f.objectId];
                        return (
                          <li key={f.objectId} className="story-photograph">
                            {picture !== undefined && canShow(picture.type) ? (
                              <img
                                className="story-photograph__image"
                                src={picture.url}
                                alt={`A photograph on ${memory.title}. Nothing here describes what is in it.`}
                              />
                            ) : (
                              <p className="story-photograph__unshown">
                                {picture === undefined
                                  ? 'This photograph has not loaded.'
                                  : 'This file is not a photograph this page can show.'}
                              </p>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  <div className="story-entry__notes">
                    {/*
                      Provenance travels with the memory. A reader who
                      cannot tell a drafting tool's words from their
                      mother's has been told something false about their
                      mother (ADR-024).
                    */}
                    <p className={memory.sourceType === 'AIDraft' ? 'state state--ai' : undefined}>
                      {SOURCE_WORDING[memory.sourceType ?? ''] ?? 'Where these words came from is not recorded.'}
                    </p>
                    {memory.testimonyState === 'ParticipantTestimony' && (
                      <p>They have confirmed these are their own words.</p>
                    )}
                  </div>
                </div>
              )}
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
