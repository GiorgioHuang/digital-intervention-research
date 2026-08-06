import { useEffect, useState } from 'react';
import { api, type MyLifeStoryItem, type Session } from '../api.js';
import { presentError, type PresentedError } from '../errors.js';
import { EmptyState, ErrorState, LoadingState } from './StateBlock.js';

/**
 * The participant's own life story.
 *
 * Nothing could read it. A participant could create items, revise them,
 * confirm one as their own testimony, change who sees it and withdraw it,
 * and a supporter could propose text into it — but no screen and no query
 * showed what was there. Accepting a contribution into a story you cannot
 * read is not a decision anyone can make properly.
 *
 * The provenance of every piece of text is stated on the piece of text,
 * not in a legend somewhere: who wrote it, and whether the participant
 * has confirmed it as their own words. That distinction is the whole
 * point of ADR-024 and it is worth nothing if the screen blurs it.
 */

/** Who wrote this version, said plainly. */
const SOURCE_WORDING: Record<string, string> = {
  ParticipantAuthored: 'You wrote this.',
  AIDraft: 'A drafting tool suggested this. It is not your words unless you say so.',
  SupporterContribution: 'Someone who supports you wrote this and offered it. It is their account.',
  Transcription: 'This was typed up from something you said.',
  Translation: 'This is a translation of something written elsewhere.',
};

const VISIBILITY_WORDING: Record<string, string> = {
  Private: 'Only you can see this.',
  'Selected People': 'Only the people you chose can see this.',
  Connections: 'The people you are connected with can see this.',
  Community: 'People in your community can see this.',
  'Platform Public': 'Anyone using this platform can see this.',
};

const STATE_NOTE: Record<string, string> = {
  Draft: 'Still a draft.',
  Hidden: 'Hidden for now.',
  Restricted: 'Restricted by the research team.',
  Withdrawn: 'You withdrew this. It is private and nobody else can reach it; it is kept here for you.',
  Archived: 'Archived.',
};

export function MyLifeStory({ session }: { session: Session }) {
  const [items, setItems] = useState<MyLifeStoryItem[] | null>(null);
  const [archiveId, setArchiveId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<PresentedError | null>(null);
  const [actionError, setActionError] = useState<PresentedError | null>(null);
  const [writing, setWriting] = useState(false);
  const [draft, setDraft] = useState({ title: '', text: '' });
  const [confirming, setConfirming] = useState<MyLifeStoryItem | null>(null);
  /**
   * Changing an entry you already wrote.
   *
   * `reviseItem` has existed with a route and no caller: a participant
   * could write an entry and never change a word of it from any screen.
   * This one told them about revision three times over — that earlier
   * versions are kept, that changing the text un-confirms it, and by
   * showing "you have changed this since confirming" — while offering no
   * way to do it. Being unable to correct your own account of your own
   * life is a strange thing for a life story to enforce.
   */
  const [revising, setRevising] = useState<{ itemId: string; text: string } | null>(null);
  const [announcement, setAnnouncement] = useState('');

  const load = async () => {
    try {
      const res = await api.getMyLifeStory(session);
      setItems(res.data.map((d) => d.attributes));
      setArchiveId(res.meta.archiveId);
      setLoadError(null);
    } catch (err) {
      setLoadError(presentError(err));
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const save = async () => {
    if (draft.title.trim() === '' || draft.text.trim() === '') {
      setAnnouncement('Both a title and something to say are needed before this can be saved.');
      return;
    }
    try {
      // The archive is created on first use rather than up front, so
      // someone who never writes anything never has an empty one.
      const id = archiveId ?? (await api.createLifeStoryArchive(session)).data.id;
      await api.createLifeStoryItem(session, id, draft.title.trim(), draft.text.trim());
      setActionError(null);
      setWriting(false);
      setDraft({ title: '', text: '' });
      setAnnouncement('Saved. Only you can see it — nothing is shared until you choose to share it.');
      await load();
    } catch (err) {
      setActionError(presentError(err));
    }
  };

  const revise = async (item: MyLifeStoryItem) => {
    if (revising === null) return;
    try {
      await api.reviseLifeStoryItem(session, item.itemId, revising.text.trim());
      setActionError(null);
      setRevising(null);
      setAnnouncement(
        item.testimonyState === 'ParticipantTestimony'
          ? 'Saved as a new version. It is not confirmed as your own words yet — the earlier confirmation stands for the earlier words.'
          : 'Saved as a new version. Nothing you wrote before was overwritten.',
      );
      await load();
    } catch (err) {
      setActionError(presentError(err));
    }
  };

  const confirm = async (item: MyLifeStoryItem) => {
    if (item.currentVersionId === null) return;
    try {
      await api.confirmTestimony(session, item.itemId, item.currentVersionId);
      setActionError(null);
      setConfirming(null);
      setAnnouncement('Confirmed as your own words, for this exact version.');
      await load();
    } catch (err) {
      setActionError(presentError(err));
    }
  };

  return (
    <section aria-labelledby="life-story-heading">
      <h1 id="life-story-heading">My life story</h1>
      <p>
        This is yours. Everything you write here starts private, and stays private until you choose otherwise.
      </p>

      {items === null && loadError === null && <LoadingState label="Loading your life story…" />}
      {loadError !== null && <ErrorState error={loadError} />}

      {items !== null && items.length === 0 && (
        <EmptyState
          title="You have not written anything yet"
          detail="Whatever you write is kept private to you until you decide to share it."
        />
      )}

      {items !== null && !writing && (
        <p>
          <button onClick={() => setWriting(true)}>Write something new</button>
        </p>
      )}

      {writing && (
        <div>
          <h2>Write something new</h2>
          <p>
            <label htmlFor="ls-title">What is it about?</label>{' '}
            <input id="ls-title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          </p>
          <p>
            <label htmlFor="ls-text">In your own words</label>
            <br />
            <textarea
              id="ls-text"
              rows={6}
              value={draft.text}
              onChange={(e) => setDraft({ ...draft, text: e.target.value })}
            />
          </p>
          <p>
            Nothing writes this for you. What you save here is recorded as written by you, because it is.
          </p>
          <p>
            <button onClick={() => void save()}>Save to my story</button>{' '}
            {/*
              Deliberately does not throw the text away: a button offered
              as the safe way out must not be the destructive one.
            */}
            <button onClick={() => setWriting(false)}>Close without saving</button>
          </p>
        </div>
      )}

      {(items ?? []).map((item) => (
        <article key={item.itemId} aria-label={item.title}>
          <h2>{item.title}</h2>
          {item.contentText !== null && <blockquote>{item.contentText}</blockquote>}
          <p>{SOURCE_WORDING[item.sourceType ?? ''] ?? 'Where this came from is not recorded.'}</p>
          <p>
            {item.testimonyState === 'ParticipantTestimony'
              ? 'You have confirmed this is in your own words.'
              : 'You have not confirmed this as your own words.'}
          </p>
          {item.supersedesConfirmedVersion && (
            <p>
              An earlier version of this was confirmed as your own words. This one has not been — changing the text
              does not carry that confirmation forward, because it would then say you confirmed something you never
              read.
            </p>
          )}
          <p>{VISIBILITY_WORDING[item.visibility] ?? item.visibility}</p>
          {STATE_NOTE[item.itemState] !== undefined && <p>{STATE_NOTE[item.itemState]}</p>}
          {item.versionCount > 1 && (
            <p>
              This has been written {item.versionCount} times. Nothing you wrote before was overwritten — earlier
              versions are kept.
            </p>
          )}
          {/*
            Not offered on a withdrawn item: the command refuses it, and a
            control that cannot work is the same defect as one that does
            nothing.
          */}
          {item.itemState !== 'Withdrawn' && item.contentText !== null && revising === null && (
            <p>
              <button onClick={() => setRevising({ itemId: item.itemId, text: item.contentText ?? '' })}>
                Change what this says
              </button>
            </p>
          )}

          {revising?.itemId === item.itemId && (
            <div>
              <p>
                <label htmlFor={`revise-${item.itemId}`}>Your words</label>
              </p>
              <textarea
                id={`revise-${item.itemId}`}
                rows={6}
                value={revising.text}
                onChange={(e) => setRevising({ itemId: item.itemId, text: e.target.value })}
              />
              <p>Nothing you wrote before is overwritten. The earlier version is kept and you can still read it.</p>
              {/*
                Said here rather than after the fact: confirming applied to
                the exact words that were confirmed, so changing them
                leaves the new text unconfirmed. The participant is about
                to undo something they did deliberately.
              */}
              {item.testimonyState === 'ParticipantTestimony' && (
                <p role="note">
                  <strong>You confirmed these words as your own.</strong> That confirmation belongs to the words you
                  confirmed, not to this entry, so the new text will not be confirmed until you say so again. What you
                  confirmed before stays on the record as it was.
                </p>
              )}
              <p>
                <button
                  disabled={revising.text.trim() === '' || revising.text === item.contentText}
                  onClick={() => void revise(item)}
                >
                  Save this version
                </button>{' '}
                <button onClick={() => setRevising(null)}>Leave it as it was</button>
              </p>
            </div>
          )}

          {item.testimonyState !== 'ParticipantTestimony' &&
            item.currentVersionId !== null &&
            item.itemState !== 'Withdrawn' && (
              <p>
                <button onClick={() => setConfirming(item)}>Confirm this is in my own words</button>
              </p>
            )}

          {confirming?.itemId === item.itemId && (
            <div role="alertdialog" aria-labelledby={`confirm-${item.itemId}`}>
              <h3 id={`confirm-${item.itemId}`}>Confirm this is in your own words?</h3>
              <p>
                This applies to exactly the words above, and to no other version. If you change the text afterwards,
                the new text is not confirmed until you say so again.
              </p>
              {item.sourceType !== 'ParticipantAuthored' && (
                <p>
                  These words were not written by you. Confirming says you stand behind them as your own; the record
                  still keeps who wrote them.
                </p>
              )}
              <p>
                <button onClick={() => void confirm(item)}>Yes, these are my words</button>{' '}
                <button onClick={() => setConfirming(null)}>Not now</button>
              </p>
            </div>
          )}
        </article>
      ))}

      {actionError !== null && <ErrorState error={actionError} />}
      <p aria-live="polite" role="status">
        {announcement}
      </p>
    </section>
  );
}
