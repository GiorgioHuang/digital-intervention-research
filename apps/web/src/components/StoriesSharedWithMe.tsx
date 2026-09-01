import { useEffect, useState } from 'react';
import { api, type SharedStoryItem, type Session, type SupportedPerson } from '../api.js';
import { presentError, type PresentedError } from '../errors.js';
import { EmptyState, ErrorState, LoadingState } from './StateBlock.js';
import { entryDate } from '../story-entry.js';

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

  useEffect(() => {
    void (async () => {
      try {
        setPeople((await api.listPeopleISupport(session)).data.map((d) => d.attributes));
      } catch (err) {
        setError(presentError(err));
      }
    })();
  }, []);

  const open = async (person: SupportedPerson) => {
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
        {(items ?? []).map((memory) => (
          <article key={memory.itemId} className="story-entry" aria-label={memory.title}>
            <h2 className="story-entry__heading">{memory.title}</h2>
            <p className="story-entry__meta">{entryDate(memory.updatedAt)}</p>
            {memory.contentText !== null && <blockquote className="story-entry__words">{memory.contentText}</blockquote>}
            <div className="story-entry__notes">
              {/*
                Provenance travels with the memory. A reader who cannot
                tell a drafting tool's words from their mother's has been
                told something false about their mother (ADR-024).
              */}
              <p className={memory.sourceType === 'AIDraft' ? 'state state--ai' : undefined}>
                {SOURCE_WORDING[memory.sourceType ?? ''] ?? 'Where these words came from is not recorded.'}
              </p>
              {memory.testimonyState === 'ParticipantTestimony' && (
                <p>They have confirmed these are their own words.</p>
              )}
            </div>
          </article>
        ))}
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
              <button onClick={() => void open(person)}>
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
