import { useEffect, useState } from 'react';
import { api, type AttachedFile, type MyLifeStoryItem, type Session } from '../api.js';
import { presentError, type PresentedError } from '../errors.js';
import { EmptyState, ErrorState, LoadingState } from './StateBlock.js';
import { TabIcon } from './elder/TabIcon.js';
import { piecesSoFar, whoCanSee } from '../story-summary.js';

/**
 * The six questions the drawing offers, in its order.
 *
 * Copy, not data: nothing records which question a memory answered, so
 * choosing one opens the writing box with the question as the title. That
 * is the whole of what it does, and it is worth saying because a list of
 * prompts looks like it ought to be doing more.
 */
const STORY_PROMPTS = [
  'Where did you live when you were ten?',
  'Who taught you something you still use?',
  'What was your first paid work?',
  'Tell me about a winter you remember.',
  'Who in your family should be remembered?',
  'What did you cook for people?',
] as const;

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
  /** Whether the six questions are showing. They are copy, not stored. */
  const [prompting, setPrompting] = useState(false);
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
  /**
   * Taking an entry out of the story.
   *
   * `withdrawItem` had a route and no caller, while this screen already
   * carried the sentence describing what a withdrawn entry is — "You
   * withdrew this. It is private and nobody else can reach it; it is
   * kept here for you." A state nobody could reach, described in the
   * present tense.
   */
  const [withdrawing, setWithdrawing] = useState<MyLifeStoryItem | null>(null);
  const [announcement, setAnnouncement] = useState('');
  /*
   * Photographs on an entry. Loaded per entry rather than with the list,
   * because a listing that always fetched them would make every visit
   * pay for something most entries do not have.
   */
  const [files, setFiles] = useState<Record<string, AttachedFile[]>>({});
  const [uploading, setUploading] = useState<string | null>(null);
  /*
   * Taking a photograph back. `object_state` has allowed 'Deleted' since
   * the first migration and nothing wrote it, so until now a participant
   * could add a picture of their life and had no way to remove it — and
   * nothing made that reachable until the screen above existed.
   */
  const [removing, setRemoving] = useState<{ itemId: string; objectId: string } | null>(null);

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

  const loadFiles = async (itemId: string) => {
    try {
      const res = await api.listLifeStoryItemFiles(session, itemId);
      setFiles((f) => ({ ...f, [itemId]: res.data.map((d) => d.attributes) }));
    } catch (err) {
      setActionError(presentError(err));
    }
  };

  /*
   * One act. The destination goes with the request that starts the
   * upload, so nobody has to come back and attach the file once it has
   * been checked.
   *
   * What is said afterwards is deliberately narrow. The file has been
   * received and is being checked; it is NOT on the entry yet, and this
   * platform's checker recognises a test string rather than real
   * malware, so nothing here says the file was scanned for viruses.
   */
  const remove = async (itemId: string, objectId: string) => {
    setRemoving(null);
    try {
      await api.removeFile(session, objectId);
      setActionError(null);
      setAnnouncement('The photograph is gone. Your entry is unchanged.');
      await loadFiles(itemId);
    } catch (err) {
      setActionError(presentError(err));
    }
  };

  const attach = async (itemId: string, file: File) => {
    setUploading(itemId);
    try {
      await api.attachToLifeStoryItem(session, itemId, file);
      setActionError(null);
      setAnnouncement(
        'Your file has been received and is being checked. It is not on this entry yet — look again in a few minutes.',
      );
      await loadFiles(itemId);
    } catch (err) {
      setActionError(presentError(err));
    } finally {
      setUploading(null);
    }
  };

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

  const withdraw = async (item: MyLifeStoryItem) => {
    try {
      await api.withdrawLifeStoryItem(session, item.itemId);
      setActionError(null);
      setWithdrawing(null);
      setAnnouncement('Withdrawn. It is private now, and it is still here for you to read.');
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
    /* The one screen the owner asked to feel warm rather than clinical:
       a cream ground (Sand 50) instead of the neutral page, with each
       entry a white card carrying a sand edge. The warmth is the room,
       not the writing — see the note on `.zone-story` in styles.css for
       why sand is never a foreground here. */
    <section className="zone-story" aria-labelledby="life-story-heading">
      <h1 id="life-story-heading">Your life story</h1>
      {/*
        Both halves of this line are counted rather than asserted. The
        drawing says "Only you can see them" flatly; it is true of a story
        that is all private and false the moment one piece is shared, and
        a screen that says "only you" over something somebody else can
        read is worse than saying nothing at all.
      */}
      <p className="story-summary">
        {piecesSoFar(items?.length ?? 0)} {whoCanSee((items ?? []).map((i) => i.visibility))}
      </p>

      {/*
        The drawing's two ways in, side by side and the same size.

        Speaking is drawn and is not built: there is no audio upload, no
        storage against an item and no transcription provider (B-2). It is
        shown because the drawing shows it and because somebody should be
        able to see that it is coming, but it is NOT a control — a button
        that cannot do the thing it names is the failure this project
        keeps refusing. Same shape as the exercises that are not ready.
      */}
      <div className="story-ways-in">
        <div className="story-way-in story-way-in--not-ready">
          <TabIcon name="mic" />
          <span className="story-way-in__label">Speak a memory</span>
          <span className="story-way-in__note">Not ready yet.</span>
        </div>
        <button
          className="story-way-in"
          onClick={() => {
            // Deliberately does not reset the draft. "Close without
            // saving" keeps what was typed, so re-opening has to keep it
            // too — clearing here would make the safe way out destructive
            // one step later, which is the same defect at a distance.
            setPrompting(false);
            setWriting(true);
          }}
        >
          <TabIcon name="pen" />
          <span className="story-way-in__label">Write a memory</span>
        </button>
      </div>

      <p>
        <button
          className="row-summary"
          aria-expanded={prompting}
          onClick={() => {
            setWriting(false);
            setPrompting((v) => !v);
          }}
        >
          Choose a question to answer
        </button>
      </p>

      {prompting && (
        <ul className="story-prompts">
          {STORY_PROMPTS.map((q) => (
            <li key={q}>
              <button
                className="row-summary"
                onClick={() => {
                  // The question becomes the title, which is the only
                  // record of it there is — nothing stores the prompt.
                  // The text is left alone for the same reason as above:
                  // choosing a question is not a request to throw away
                  // whatever was already written.
                  setPrompting(false);
                  setDraft((d) => ({ ...d, title: q }));
                  setWriting(true);
                }}
              >
                {q}
              </button>
            </li>
          ))}
        </ul>
      )}
      <hr />

      {items === null && loadError === null && <LoadingState label="Loading your life story…" />}
      {loadError !== null && <ErrorState error={loadError} />}

      {items !== null && items.length === 0 && (
        <EmptyState
          title="You have not written anything yet"
          detail="Whatever you write is kept private to you until you decide to share it."
        />
      )}

      {writing && (
        <div>
          <h2>{draft.title === '' ? 'Write a memory' : draft.title}</h2>
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
        <article key={item.itemId} className="card card--story" aria-label={item.title}>
          <h2>{item.title}</h2>
          {item.contentText !== null && <blockquote>{item.contentText}</blockquote>}
          {/*
            Where the words came from. A drafting tool's suggestion is
            marked; everything else is stated in plain text and left
            unmarked.
            Marking only the machine is the point. The AI family is a
            LABEL, never a fill: an entry the participant wrote must not
            end up looking quieter on their own page than one a model
            produced (Doc 19 §10). The words still carry it — the marker
            only makes the distinction survivable at a glance.
          */}
          <p className={item.sourceType === 'AIDraft' ? 'state state--ai' : undefined}>
            {SOURCE_WORDING[item.sourceType ?? ''] ?? 'Where this came from is not recorded.'}
          </p>
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
            Photographs. Only files that have cleared checking are listed
            — anything else has not been accepted yet, and showing it
            would say the entry holds something it does not.
          */}
          {/*
            Shown on a withdrawn entry too, and this matters. The screen
            tells its owner a withdrawn entry is kept for them to read —
            hiding its photographs would take them away without saying
            so, and the remove control lives in here, so hiding it would
            put the pictures beyond reach again for exactly the people
            who had decided they wanted the entry private. What is not
            offered is adding: a withdrawn entry refuses every other
            change, and the server refuses this one too.
          */}
          <div>
              <h3>Photographs on this entry</h3>
              {files[item.itemId] === undefined ? (
                <p>
                  <button onClick={() => void loadFiles(item.itemId)}>Show photographs on this entry</button>
                </p>
              ) : files[item.itemId]!.length === 0 ? (
                <p>Nothing has been added to this entry yet.</p>
              ) : (
                <ul>
                  {files[item.itemId]!.map((f) => (
                    <li key={f.objectId}>
                      {f.declaredContentType} · {Math.max(1, Math.round(f.declaredSizeBytes / 1024))} KB · added{' '}
                      {new Date(f.createdAt).toLocaleDateString()}{' '}
                      <button onClick={() => setRemoving({ itemId: item.itemId, objectId: f.objectId })}>
                        Remove this photograph
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {item.itemState === 'Withdrawn' ? (
                <p>You withdrew this entry, so nothing more can be added to it. What is already here stays, and you can still remove any of it.</p>
              ) : (
                <p>
                  <label htmlFor={`file-${item.itemId}`}>Add a photograph to this entry</label>{' '}
                  <input
                    id={`file-${item.itemId}`}
                    type="file"
                    disabled={uploading !== null}
                    onChange={(e) => {
                      const chosen = e.target.files?.[0];
                      if (chosen !== undefined) void attach(item.itemId, chosen);
                    }}
                  />
                </p>
              )}
              {/*
                What this platform can and cannot say about a file. The
                checker recognises a test string, not real malware
                (ADR-126), so "checked" is as far as the wording may go.
              */}
              <p>
                <small>
                  A file you add is kept privately and is checked before it appears here. Nobody else can see it —
                  this platform has no way to share a photograph with anyone, not even a supporter.
                </small>
              </p>
          </div>
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

          {item.itemState !== 'Withdrawn' && revising === null && (
            <p>
              <button onClick={() => setWithdrawing(item)}>Take this out of my story</button>
            </p>
          )}

          {withdrawing?.itemId === item.itemId && (
            <div role="alertdialog" aria-labelledby={`withdraw-${item.itemId}`}>
              <h3 id={`withdraw-${item.itemId}`}>Take &ldquo;{item.title}&rdquo; out of your story?</h3>
              {/*
                What it does and, just as importantly, what it does not.
                "Withdraw" reads to many people as "delete", and somebody
                who wanted it gone would otherwise think it was.
              */}
              <p>
                It becomes private, and anyone you had shared it with can no longer reach it. <strong>It is not
                deleted.</strong> You can still read it here, and every version you wrote is kept.
              </p>
              <p>
                You will not be able to change it afterwards, and it cannot be put back into the story from this
                screen.
              </p>
              {item.testimonyState === 'ParticipantTestimony' && (
                <p>
                  You confirmed this as your own words. That confirmation stays on the record — withdrawing does not
                  unsay it.
                </p>
              )}
              <p>
                <button onClick={() => void withdraw(item)}>Yes, take it out</button>{' '}
                <button onClick={() => setWithdrawing(null)}>Leave it as it is</button>
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
      {removing !== null && (
        <div role="alertdialog" aria-labelledby="remove-file-confirm">
          <h3 id="remove-file-confirm">Remove this photograph?</h3>
          {/*
            What is destroyed and what is not, said before it happens.
            The bytes go and cannot be brought back; the row saying a
            file was added and removed stays, because quietly erasing the
            fact that anything happened is not the platform's to do.
          */}
          <p>
            The photograph itself is deleted and cannot be brought back — not by you, and not by anyone here.
          </p>
          <p>
            Your entry and everything you wrote are untouched. A note that you added a file and removed it stays in
            the account of what happened to your record; that note holds no photograph.
          </p>
          <p>
            <button onClick={() => void remove(removing.itemId, removing.objectId)}>Yes, remove it</button>{' '}
            <button onClick={() => setRemoving(null)}>Keep it</button>
          </p>
        </div>
      )}
      <p aria-live="polite" role="status">
        {announcement}
      </p>
    </section>
  );
}
