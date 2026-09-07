import { PictureCorner, PostFooter, PostMenu, PostMenuItem, PostPhotographs, PostWords } from './Post.js';
import { Modal } from './Modal.js';
import { useEffect, useRef, useState } from 'react';
import {
  api,
  MAX_FILE_BYTES,
  MAX_FILE_MB,
  PHOTOGRAPH_TYPES,
  PHOTOGRAPH_TYPE_WORDS,
  UploadInterrupted,
  type AttachedFile,
  type MyLifeStoryItem,
  type Session,
} from '../api.js';
import { presentError, type PresentedError } from '../errors.js';
import { EmptyState, ErrorState, LoadingState } from './StateBlock.js';
import { TabIcon } from './elder/TabIcon.js';
import { piecesSoFar, whoCanSee } from '../story-summary.js';
import { entryDate, isShowableImage, metaLine, openingWords, quotedOpening } from '../story-entry.js';
import { VISIBILITY_CHOICES, visibilityLabel } from '../visibility.js';

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

/**
 * Who can see a memory — the choice, not a claim about what has happened.
 *
 * These said "People in your community can see this" and the like, and
 * every one of them was false. Visibility is stored on the item and
 * audited when it changes, and nothing reads it: `life-story.view-own` is
 * `ownerOnly` in the policy catalogue, `getMyLifeStory` is the only query
 * there is, and no route, screen or module reads another person's story
 * (B-30). So a participant chose to share a memory with their community,
 * was told they had, and nobody could reach it.
 *
 * Which direction the error ran matters. Nothing leaked — the platform
 * was more private than it said. But somebody may have believed their
 * granddaughter could read their story, and she could not, and on a
 * project whose purpose is keeping people connected to their families
 * that is the worse half of the two.
 *
 * So these state the choice, and `SHARING_NOT_BUILT` below says plainly
 * what has come of it. Neither promises when that changes.
 */
const VISIBILITY_WORDING: Record<string, string> = {
  Private: 'Only you can see this.',
  'Selected People': 'You have chosen to share this with the people you pick.',
  Connections: 'You have chosen to share this with the people you are connected with.',
  Community: 'You have chosen to share this with your community.',
  'Platform Public': 'You have chosen to share this with anyone using this platform.',
};

/**
 * True as of the reading path being built.
 *
 * This used to say nothing on the platform could show a story to another
 * person, which was so and is not any more: a supporter can open what was
 * shared with supporters. What is still true is that the other scopes
 * have no screen behind them yet — a connection or a community member has
 * nowhere to read one — so the sentence says which is which rather than
 * covering both with one reassurance.
 */
const SHARING_REACHABLE: Record<string, string> = {
  'My Supporters': 'The people who help you can open this from their own account.',
};
const SHARING_NO_SCREEN_YET =
  'There is not yet a screen where they can read it, so nobody has opened it. Your choice is on the record and holds when there is.';

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
  /**
   * What is being written. Words, and nothing else.
   *
   * There was a title field above them, required, so nobody could save a
   * memory until they had named it — a form to fill in before somebody
   * could begin saying what happened to them. Taken out on the owner's
   * instruction (2026-09-07); the question a person chose to answer is
   * still shown above the box while they write, and is not stored,
   * because it is this platform's question and not their words.
   */
  const [draft, setDraft] = useState({ text: '' });
  /** The question being answered, if one was chosen. Never stored. */
  const [answering, setAnswering] = useState<string | null>(null);
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
   * Half-written corrections, kept when the window is closed.
   *
   * Closing a window is not a request to throw away what is in it — the
   * same rule the writing box has always had, and the reason its way out
   * says "Close without saving". The correction window did throw it
   * away, including on Escape, which is the way most people close a
   * window and the one nobody presses expecting to lose a paragraph.
   *
   * Kept per memory rather than as one draft: two corrections started on
   * two memories are two different pieces of somebody's writing.
   */
  const [keptCorrections, setKeptCorrections] = useState<Record<string, string>>({});
  const closeCorrection = () => {
    if (revising !== null) setKeptCorrections((k) => ({ ...k, [revising.itemId]: revising.text }));
    setRevising(null);
  };
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
  /**
   * Whether the announcement is already on the screen somewhere else.
   *
   * The live region has to carry every outcome, because somebody using a
   * screen reader gets nothing from a photograph appearing. But when the
   * same words are already shown in place — on the photograph itself —
   * printing them again at the foot of the entry is the very line the
   * picture was meant to replace. So it is announced and not repeated.
   */
  const [announcementShownInPlace, setAnnouncementShownInPlace] = useState(false);
  const say = (words: string, shownInPlace = false) => {
    setAnnouncement(words);
    setAnnouncementShownInPlace(shownInPlace);
  };
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
  /**
   * Which memories are open.
   *
   * Each entry is a row that opens, so a story of forty pieces is a list
   * somebody can read rather than forty columns of platform sentences
   * they have to scroll past (X-32, decided by the owner 2026-09-01).
   *
   * A set, not one at a time: comparing two memories is an ordinary thing
   * to want to do, and closing somebody's place in one to look at another
   * is the kind of small rudeness that adds up.
   *
   * Nothing is cleared on close. `revising` in particular survives, so a
   * half-written correction is still there on reopening — closing a
   * drawer is not a request to throw away what is in it.
   */
  /**
   * Whose upload box is showing.
   *
   * An entry with no photographs shows no empty file input. Adding one is
   * a button in the actions row that reveals the box — folded, not
   * removed (D-87), because a life story that could never gain a picture
   * after the first day would be a worse screen than a cluttered one.
   */
  const [adding, setAdding] = useState<string | null>(null);
  /**
   * Which memory's scope is being chosen.
   *
   * There was no control at all: `changeVisibility` had a command and a
   * route, and nothing in the app called either, so every memory was
   * Private for ever and every sentence about who could see it described
   * a choice nobody could make (B-30).
   */
  const [choosingScope, setChoosingScope] = useState<string | null>(null);
  /**
   * A widening waiting to be confirmed by a person.
   *
   * `life-story.change-visibility` is confirmation-tier, and a client that
   * sends `confirmed: true` because somebody tapped a list has confirmed
   * on their behalf. The direction decides: letting more people read a
   * memory is confirmed, and taking it back to Private happens at once —
   * the same rule the platform already applies to resuming access versus
   * pausing it, where stopping something needs no ceremony.
   */
  const [confirmingScope, setConfirmingScope] = useState<{ item: MyLifeStoryItem; visibility: string } | null>(null);
  /**
   * Photographs, as pictures.
   *
   * The bytes cannot be an `<img src>`: this platform authenticates with
   * headers and a browser sends none when it fetches an image. So each
   * file is fetched like any other request and kept here as an object
   * URL, which also keeps a Sensitive-Personal photograph out of the
   * address bar. The ref is the same map, for revoking on unmount — a
   * cleanup that read the state would capture whatever it held on the
   * render it was created in, and leak every URL made after that.
   */
  /**
   * Previews the browser would not draw.
   *
   * Reported from a real phone: the photograph uploaded and where the
   * preview should have been there was a broken-image glyph. Why the
   * browser declined is not knowable from here; that the picture went is.
   */
  const [unpreviewable, setUnpreviewable] = useState<ReadonlySet<string>>(new Set());
  /** Cleared on unmount, so a poll in flight stops asking. */
  const onScreen = useRef(true);
  useEffect(() => {
    onScreen.current = true;
    return () => {
      onScreen.current = false;
    };
  }, []);
  /*
   * What a shared memory will carry of this person's name.
   *
   * Read here rather than assumed, because the confirmation below makes
   * a promise about it and the promise has to be true: somebody who has
   * chosen no public name appears to other people as the placeholder,
   * not under the name the study office has (D-105).
   */
  const [publicName, setPublicName] = useState<{
    chosenName: string;
    city: string | null;
  } | null>(null);
  useEffect(() => {
    void (async () => {
      try {
        setPublicName((await api.myPublicProfile(session)).data?.attributes ?? null);
      } catch {
        /* The confirmation words the uncertain case, so a failure here
           costs a detail rather than the ability to share. */
      }
    })();
  }, []);
  const [pictures, setPictures] = useState<Record<string, { url: string; type: string }>>({});
  /*
   * The photographs whose fetch has finished, whether it worked or not.
   *
   * Without this, "not here yet" and "will never be here" are one state,
   * and the screen said "This photograph has not loaded" — plus its type
   * and its size in kilobytes — during the ordinary second while it was
   * loading. A failure reported before there has been one, over
   * somebody's own photograph, every time an entry was opened (owner,
   * 2026-09-07).
   */
  const [settled, setSettled] = useState<ReadonlySet<string>>(new Set());
  const picturesRef = useRef<Record<string, { url: string; type: string }>>({});
  picturesRef.current = pictures;
  useEffect(
    () => () => {
      for (const p of Object.values(picturesRef.current)) URL.revokeObjectURL(p.url);
    },
    [],
  );

  const load = async () => {
    try {
      const res = await api.getMyLifeStory(session);
      const arrived = res.data.map((d) => d.attributes);
      setItems(arrived);
      setArchiveId(res.meta.archiveId);
      setLoadError(null);
      /*
       * Asked for once each. The guard is a ref rather than the `files`
       * state because this runs before React has re-rendered with it,
       * and two loads racing would otherwise each start the same fetch.
       */
      const wanted = arrived.filter((i) => !asked.current.has(i.itemId));
      asked.current = new Set([...asked.current, ...wanted.map((i) => i.itemId)]);
      await Promise.all(wanted.map((i) => loadFiles(i.itemId)));
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
      const attached = res.data.map((d) => d.attributes);
      setFiles((f) => ({ ...f, [itemId]: attached }));
      await Promise.all(attached.map((f) => loadPicture(f)));
    } catch (err) {
      setActionError(presentError(err));
    }
  };

  /**
   * One photograph, as a photograph.
   *
   * A failure here is deliberately quiet. The entry and its words are on
   * the screen already, and turning "one picture would not load" into the
   * screen's error state would push somebody's own memory aside to report
   * a thumbnail — so the file falls back to being described instead, and
   * the entry stays readable.
   */
  const loadPicture = async (file: AttachedFile) => {
    if (picturesRef.current[file.objectId] !== undefined) return;
    try {
      const blob = await api.readFileContent(session, file.objectId);
      const url = URL.createObjectURL(blob);
      setPictures((p) => {
        // Two opens racing for the same file: keep the first and revoke
        // this one, rather than leaking the URL that lost.
        if (p[file.objectId] !== undefined) {
          URL.revokeObjectURL(url);
          return p;
        }
        return { ...p, [file.objectId]: { url, type: blob.type } };
      });
    } catch {
      /* Described rather than shown; see above. */
    } finally {
      setSettled((was) => new Set(was).add(file.objectId));
    }
  };

  /**
   * A memory's photographs, fetched once the memory itself is on the
   * screen.
   *
   * They used to be fetched when a memory was unfolded, which was also
   * the press that showed its words. There is no fold any more — a
   * memory is a post and its words are simply there (owner, 2026-09-07)
   * — so nothing is left to hang the fetch on but the story arriving.
   *
   * That is one request per memory, and a story of forty makes forty of
   * them (recorded as B-38: the listing is per-item on the server, and a
   * single "everything on this archive" listing is the fix). Each is
   * small, they go together rather than in sequence, and asking once per
   * memory is still better than what it replaced, which was showing
   * nobody their own photographs until they pressed a second time.
   */
  const asked = useRef<ReadonlySet<string>>(new Set());

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
      // The bytes are still in this tab until the URL is revoked, which
      // for a photograph somebody has just asked to be rid of is the
      // wrong place to be relaxed about.
      setPictures((p) => {
        const held = p[objectId];
        if (held === undefined) return p;
        URL.revokeObjectURL(held.url);
        const rest = { ...p };
        delete rest[objectId];
        return rest;
      });
      await loadFiles(itemId);
    } catch (err) {
      setActionError(presentError(err));
    }
  };

  const attach = async (itemId: string, file: File) => {
    /*
     * Said here rather than raised as an error, because the wording is
     * the point. `presentError` replaces a server message with prepared
     * wording by design, so a refusal routed through it arrives as "one
     * field still needs a change" — which does not tell somebody their
     * photograph is twice the size this platform can take. This is the
     * same kind of refusal as "both a title and something to say are
     * needed", and it is said the same way.
     *
     * `api.attachToLifeStoryItem` refuses at the same number too, so no
     * caller can skip the check by not being this one.
     */
    if (file.size > MAX_FILE_BYTES) {
      setAnnouncement(
        `That photograph is about ${String(Math.round(file.size / 1024 / 1024))} MB, and the largest this platform can take is ${String(MAX_FILE_MB)} MB. Nothing was sent. A smaller copy, or a photograph of the photograph, will go through.`,
      );
      return;
    }
    /*
     * And the format, named. The server refuses this too, but its
     * refusal arrives through `presentError` as prepared wording that
     * does not say which formats would have worked — which is the one
     * thing somebody standing in front of this needs to know.
     */
    if (!(PHOTOGRAPH_TYPES as readonly string[]).includes(file.type)) {
      setAnnouncement(
        `That file is ${file.type === '' ? 'in a format this platform could not identify' : file.type}, and this platform can take ${PHOTOGRAPH_TYPE_WORDS} photographs. Nothing was sent.`,
      );
      return;
    }
    setUploading(itemId);
    try {
      const objectId = await api.attachToLifeStoryItem(session, itemId, file);
      setActionError(null);
      /*
       * The picture, for this session only. The server will not serve
       * the bytes of a file that has not cleared checking — that is what
       * quarantine is — so the browser's own copy is the only way to
       * show it now. The ROW comes from the record instead, which is why
       * a refresh no longer erases the photograph: it used to exist
       * nowhere but here (reported 2026-09-02).
       */
      setPictures((p) => ({ ...p, [objectId]: { url: URL.createObjectURL(file), type: file.type } }));
      setAdding(null);
      // Said as well as shown: somebody using a screen reader gets no
      // benefit from a picture appearing.
      say('Your photograph has been received and is being checked. It is not on this entry yet.', true);
      await loadFiles(itemId);
      void watchUpload(itemId, objectId);
    } catch (err) {
      /*
       * Which half failed decides what is true. If the bytes failed there
       * is already a record waiting for them, so "nothing was submitted"
       * — the sentence the network wording gives — would be false. It is
       * said plainly instead, and the prepared error block is kept for
       * the case where nothing was started at all.
       */
      if (err instanceof UploadInterrupted) {
        setActionError(null);
        say(
          'The photograph did not finish sending. Nothing is on your entry and nothing you have written is affected. You can choose it again.',
        );
      } else {
        setActionError(presentError(err));
      }
    } finally {
      setUploading(null);
    }
  };

  /**
   * What happened to it, asked rather than assumed.
   *
   * The old sentence promised "look again in a few minutes", which is a
   * cadence this screen cannot keep on its own — checking is a scheduled
   * sweep, and how long it takes is not this screen's to promise (B-29).
   * So it asks: a few times, backing off, and then it stops and offers a
   * button rather than polling somebody's connection for ever.
   */
  const checkUpload = async (itemId: string, objectId: string): Promise<string | null> => {
    try {
      const { objectState } = (await api.objectStatus(session, objectId)).data.attributes;
      if (!onScreen.current) return null;
      if (objectState === 'Available') {
        say('Your photograph has been checked and is on this entry now.', true);
      }
      /*
       * Reload on every answer, not only the happy one. The row on the
       * screen carries the state it was last given, and a photograph that
       * has been refused must stop saying it is being checked.
       */
      await loadFiles(itemId);
      return objectState;
    } catch {
      /* Asked again on the next attempt; a failed question is not news. */
      return null;
    }
  };

  const WAITS = [1500, 3000, 6000, 12000];
  const watchUpload = async (itemId: string, objectId: string) => {
    const first = await checkUpload(itemId, objectId);
    if (first === 'Available' || first === 'Rejected') return;
    for (const wait of WAITS) {
      await new Promise((r) => setTimeout(r, wait));
      if (!onScreen.current) return;
      const state = await checkUpload(itemId, objectId);
      if (state === 'Available' || state === 'Rejected') return;
    }
  };

  const save = async () => {
    if (draft.text.trim() === '') {
      setAnnouncement('There is nothing written yet, so there is nothing to save.');
      return;
    }
    try {
      // The archive is created on first use rather than up front, so
      // someone who never writes anything never has an empty one.
      const id = archiveId ?? (await api.createLifeStoryArchive(session)).data.id;
      await api.createLifeStoryItem(session, id, draft.text.trim());
      setActionError(null);
      setWriting(false);
      setDraft({ text: '' });
      setAnswering(null);
      setAnnouncement('Saved. Only you can see it — nothing is shared until you choose to share it.');
      await load();
    } catch (err) {
      setActionError(presentError(err));
    }
  };

  const setScope = async (item: MyLifeStoryItem, visibility: string) => {
    try {
      await api.setLifeStoryVisibility(session, item.itemId, visibility);
      setActionError(null);
      setChoosingScope(null);
      setConfirmingScope(null);
      say(
        visibility === 'Private'
          ? 'Only you can see this now.'
          : `Saved. ${visibilityLabel(visibility)} can see this now.`,
      );
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
      // Saved, so there is nothing half-written left to keep.
      setKeptCorrections((k) => {
        const next = { ...k };
        delete next[item.itemId];
        return next;
      });
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
    /* No box. The drawing puts this screen straight onto the page ground
       — a plain column, no panel, no border, no second surface.

       It used to be a cream room (`.zone-story`) with white cards inside
       it, and that was right when Life Story was the one warm screen in
       an otherwise neutral product. The Classical handoff made the whole
       participant workspace warm, so the panel stopped marking anything
       out and became a box around everything, with the entries as boxes
       inside it. What separates one memory from the next now is a
       hairline, which is what the drawing uses. */
    <section className="story-screen" aria-labelledby="life-story-heading">
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

      {/*
        Full width, as the drawing draws it, and quieter than the two ways
        in above — it is the third way, not the first. It was neither:
        `row-summary` is styled only inside `.nav-rows`, so on this button
        the class named nothing and it fell through to the default action
        button, coming out 242px wide in a 361px column and louder than
        the two it sits under.
      */}
      <button
        className="story-ask"
        aria-expanded={prompting}
        onClick={() => {
          setWriting(false);
          setPrompting((v) => !v);
        }}
      >
        Choose a question to answer
      </button>

      {prompting && (
        <ul className="story-prompts">
          {STORY_PROMPTS.map((q) => (
            <li key={q}>
              <button
                className="row-summary"
                onClick={() => {
                  /*
                    The question is shown above the box and stored
                    nowhere. It is this platform's prompt, not the
                    participant's words, and a memory that recorded it
                    would have the platform's sentence sitting inside
                    somebody's account of their own life.
                    The text is left alone for the same reason as above:
                    choosing a question is not a request to throw away
                    whatever was already written.
                  */
                  setPrompting(false);
                  setAnswering(q);
                  setWriting(true);
                }}
              >
                {q}
              </button>
            </li>
          ))}
        </ul>
      )}

      {/*
        No rule here. The drawing has one, and following it drew two lines
        11px apart: every entry already carries a hairline above it, so
        the rule fell just above the first entry's own. The drawing could
        afford it because a photograph card sits in the gap. With nothing
        written yet it was worse — a line separating one thing from
        nothing at all.
      */}
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
          <h2>{answering ?? 'Write a memory'}</h2>
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
          <p>Nothing writes this for you. What you save here is recorded as written by you, because it is.</p>
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

      {(items ?? []).map((item) => {
        const shown = files[item.itemId] ?? [];
        /*
         * The ones there is a picture for, and the rest. The split is
         * here rather than inside the loop because the two are drawn
         * differently: a photograph is shown, and anything else is
         * described.
         */
        const hasPicture = (f: AttachedFile) => {
          const held = pictures[f.objectId];
          return held !== undefined && isShowableImage(held.type) && !unpreviewable.has(f.objectId);
        };
        /*
         * Only what is actually ON the entry goes in the row of
         * photographs. A file still being checked has a preview — it was
         * just chosen from this phone — and drawing it beside the others
         * would say the entry holds something it does not (ADR-124). It
         * is shown below instead, marked with what is happening to it.
         */
        const isViewable = (f: AttachedFile) => hasPicture(f) && f.objectState === 'Available';
        const viewable = shown.filter(isViewable);
        const described = shown.filter((f) => !isViewable(f));
        const canChange = item.itemState !== 'Withdrawn' && revising === null;
        /*
          What to call it, now that a memory has no title (owner,
          2026-09-07): its own opening words. Used for the name a screen
          reader navigates by, for the menu at its corner, and for every
          window that has to say which memory it is about.
        */
        const name = openingWords(item.contentText);
        return (
          <article key={item.itemId} className="post" aria-label={name}>
            {/*
              The memory as a post (owner, 2026-09-07): its words on the
              screen, folded only if they are long, and everything that
              can be DONE to it gathered at the corner. It used to fold to
              a single row that opened, with five or six buttons under
              the words once it did — and those buttons crowded the one
              thing the screen is for, which is somebody's own writing.

              And no title above them. There was one, and it was drawn
              larger and darker than the writing it named — so the first
              thing on a memory was a label the participant had been made
              to invent before they could start.
            */}
            <div className="post__head">
              <div>
                <p className="story-entry__meta">
                  {metaLine(item)}
                  {/*
                    Never behind the menu. A drafting tool's suggestion is
                    marked on the post itself: the provenance distinction
                    is the whole point of ADR-024, and putting it one
                    press away would blur exactly what it exists to keep
                    clear (Doc 19 §10).
                  */}
                  {item.sourceType === 'AIDraft' && <span className="state state--ai">A drafting tool wrote this</span>}
                  {item.itemState === 'Withdrawn' && <span className="story-entry__flag">Taken out of your story</span>}
                </p>
              </div>
              {/*
                No menu at all when there is nothing in it. A withdrawn
                memory allows none of these, and a control that opens
                onto an empty list is a control that does nothing.
              */}
              {(canChange || item.itemState !== 'Withdrawn') && (
                <PostMenu about={name}>
                  {canChange && item.contentText !== null && (
                    <PostMenuItem
                      onSelect={() =>
                        setRevising({
                          itemId: item.itemId,
                          text: keptCorrections[item.itemId] ?? item.contentText ?? '',
                        })
                      }
                    >
                      Change what this says
                    </PostMenuItem>
                  )}
                  {item.itemState !== 'Withdrawn' && (
                    <PostMenuItem onSelect={() => setAdding(item.itemId)}>Add a photograph</PostMenuItem>
                  )}
                  {item.testimonyState !== 'ParticipantTestimony' &&
                    item.currentVersionId !== null &&
                    item.itemState !== 'Withdrawn' && (
                      <PostMenuItem onSelect={() => setConfirming(item)}>Confirm this is in my own words</PostMenuItem>
                    )}
                  {canChange && (
                    <PostMenuItem onSelect={() => setChoosingScope(item.itemId)}>Who can see this</PostMenuItem>
                  )}
                  {canChange && (
                    <PostMenuItem onSelect={() => setWithdrawing(item)}>Take this out of my story</PostMenuItem>
                  )}
                </PostMenu>
              )}
            </div>

            <div className="story-entry__body">
              {/*
                The memory itself: the largest, darkest thing here, and
                first. Everything below it is this platform talking
                about somebody's words, which is a different kind of
                text and is set as one.
              */}
              {item.contentText !== null && <PostWords text={item.contentText} label={name} />}

              {/*
                Photographs, shown rather than described, and shown on
                opening — there is no second press. Only files that have
                cleared checking are listed; anything else has not been
                accepted yet, and showing it would say the entry holds
                something it does not.

                Kept on a withdrawn entry too. The screen tells its
                owner a withdrawn entry is kept for them to read, and
                hiding its photographs would take them away without
                saying so — the remove control lives here, so hiding it
                would also put them beyond reach for exactly the people
                who decided they wanted the entry private. What is not
                offered is adding: the server refuses that, so the
                screen does not offer it.
              */}
              {/*
                The ones that can be shown, shown: one fills the width
                and several go side by side to be scrolled, because a
                memory with four photographs stacked down the page put
                its own words a screen away (owner, 2026-09-07). Any of
                them opens larger.
              */}
              <PostPhotographs
                pictures={viewable.map((f) => ({
                  key: f.objectId,
                  url: pictures[f.objectId]!.url,
                  alt: `A photograph on this memory. Nothing here describes what is in it.`,
                  corner: (
                    <PictureCorner
                      label={`Remove this photograph from ${name}`}
                      onSelect={() =>
                        setRemoving({
                          itemId: item.itemId,
                          objectId: f.objectId,
                        })
                      }
                    />
                  ),
                }))}
              />

              {/*
                And the ones that cannot: still arriving, in quarantine,
                refused, or a file this page cannot draw. Described
                rather than drawn as a broken picture, each with the way
                to take it off — there is nothing for an icon to sit on.
              */}
              {described.length > 0 && (
                <ul className="story-photographs list-plain">
                  {described.map((f) => (
                    <li key={f.objectId} className="story-photograph story-photograph--pending">
                      {hasPicture(f) ? (
                        /*
                            The preview of something still being checked.
                            Drawn, because it is somebody's photograph and
                            they have just handed it over — but inside the
                            dashed block, with the state beneath it, so it
                            does not read as being on the entry.
                          */
                        <img
                          className="story-photograph__image"
                          src={pictures[f.objectId]!.url}
                          alt="A photograph on this memory. Nothing here describes what is in it."
                          onError={() => setUnpreviewable((was) => new Set(was).add(f.objectId))}
                        />
                      ) : !settled.has(f.objectId) && f.objectState === 'Available' ? (
                        <div className="story-photograph__loading" role="status">
                          <span className="visually-hidden">The photograph is loading.</span>
                        </div>
                      ) : (
                        <p className="story-photograph__unshown">
                          {unpreviewable.has(f.objectId)
                            ? 'This page cannot show you this photograph. That is a fault of this page and not of your photograph — it reached this platform.'
                            : pictures[f.objectId] === undefined
                              ? f.objectState !== 'Available'
                                ? 'This photograph is here and cannot be shown until it has been checked.'
                                : 'This photograph has not loaded.'
                              : 'This file is not a photograph this page can show.'}{' '}
                          {f.declaredContentType} · {Math.max(1, Math.round(f.declaredSizeBytes / 1024))} KB
                        </p>
                      )}
                      {/*
                        What is happening to it, from the record rather
                        than from this session's memory. A photograph in
                        quarantine used to exist only as a preview held
                        in the browser, so a refresh erased it and
                        somebody had every reason to think the platform
                        had lost their photograph (reported 2026-09-02).
                      */}
                      {f.objectState === 'Quarantined' && (
                        <p className="story-photograph__state">
                          <strong>Received, and being checked.</strong> It is not on your entry yet. Nothing you have
                          written is affected, and it stays here whether or not you close this page. Nobody else can see
                          it — this platform has no way to share a photograph with anyone who has not been given the
                          memory it is on.
                        </p>
                      )}
                      {f.objectState === 'Rejected' && (
                        <p className="story-photograph__state">
                          <strong>This photograph was not accepted.</strong> It is not on your entry and nothing else
                          has changed. You can try a different one, or ask the research team from Help and safety.
                        </p>
                      )}
                      {settled.has(f.objectId) && (
                        <p className="story-photograph__actions">
                          <button
                            className="story-action"
                            onClick={() =>
                              setRemoving({
                                itemId: item.itemId,
                                objectId: f.objectId,
                              })
                            }
                          >
                            Remove this photograph
                          </button>
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {adding === item.itemId && item.itemState !== 'Withdrawn' && (
                <Modal labelledBy={`upload-heading-${item.itemId}`} onClose={() => setAdding(null)}>
                  <h3 id={`upload-heading-${item.itemId}`} className="modal__heading">
                    Add a photograph to this memory
                  </h3>
                  {/*
                    What will go through, said before the file is
                    chosen rather than after it is refused. Both
                    numbers were only ever enforced: somebody picked a
                    photograph, waited, and was told no by a screen
                    that had never said what yes looked like.
                  */}
                  <p className="story-upload__accepts">
                    <strong>
                      {PHOTOGRAPH_TYPE_WORDS}, up to {MAX_FILE_MB} MB.
                    </strong>{' '}
                    Some phones save photographs in another format, which this platform cannot take yet. If yours will
                    not go through, that is why — it is nothing you have done wrong, and whoever helps you with your
                    phone can save a copy in one of these.
                  </p>
                  <p>
                    <label htmlFor={`file-${item.itemId}`}>Add a photograph to this entry</label>{' '}
                    <input
                      id={`file-${item.itemId}`}
                      type="file"
                      /*
                          A hint to the file picker, not a gate — most
                          pickers let somebody choose anything anyway, and
                          the server is what actually refuses. It saves a
                          person from scrolling past files that were never
                          going to work.
                        */
                      accept={PHOTOGRAPH_TYPES.join(',')}
                      disabled={uploading !== null}
                      onChange={(e) => {
                        const chosen = e.target.files?.[0];
                        if (chosen !== undefined) void attach(item.itemId, chosen);
                      }}
                    />
                  </p>
                  {/*
                    What this platform can and cannot say about a file.
                    The checker recognises a test string, not real
                    malware (ADR-126), so "checked" is as far as the
                    wording may go.
                  */}
                  {/*
                    This said "no way to share a photograph with anyone,
                    not even a supporter", which stopped being true on
                    2026-09-02 when a photograph began travelling with
                    the memory it is on. Found by reading the screen
                    rather than by any test: nothing checks the wording
                    of a reassurance against what the platform does, and
                    a promise that has quietly become false is worse
                    than one that was never made.
                  */}
                  <p className="story-note">
                    A photograph you add is kept privately and is checked before it appears here. It goes wherever the
                    memory it is on goes — so while that memory is only yours, the photograph is too, and if you later
                    let somebody read the memory they will see the photograph with it.
                  </p>
                  <p>
                    <button className="story-action" onClick={() => setAdding(null)}>
                      Not now
                    </button>
                  </p>
                </Modal>
              )}
              {item.itemState === 'Withdrawn' && shown.length > 0 && (
                <p className="story-note">
                  You withdrew this entry, so nothing more can be added to it. What is already here stays, and you can
                  still remove any of it.
                </p>
              )}

              {choosingScope === item.itemId && (
                <div className="story-scope">
                  <h3>Who can see {quotedOpening(item.contentText)}?</h3>
                  <p className="story-note">
                    It is <strong>{visibilityLabel(item.visibility)}</strong> at the moment. Changing this changes who
                    can open it from now on; it does not tell anybody, and you can change it again whenever you like.
                  </p>
                  <ul className="story-prompts list-plain">
                    {VISIBILITY_CHOICES.map((choice) => (
                      <li key={choice.value}>
                        <button
                          disabled={choice.value === item.visibility}
                          onClick={() =>
                            choice.value === 'Private'
                              ? void setScope(item, choice.value)
                              : setConfirmingScope({
                                  item,
                                  visibility: choice.value,
                                })
                          }
                        >
                          <span className="story-scope__label">{choice.label}</span>
                          <span className="story-scope__meaning">{choice.meaning}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                  <p>
                    <button className="story-action" onClick={() => setChoosingScope(null)}>
                      Leave it as it is
                    </button>
                  </p>
                </div>
              )}

              {confirmingScope?.item.itemId === item.itemId && (
                <Modal labelledBy={`scope-${item.itemId}`} onClose={() => setConfirmingScope(null)}>
                  <h3 id={`scope-${item.itemId}`}>
                    Let {visibilityLabel(confirmingScope.visibility).toLowerCase()} read{' '}
                    {quotedOpening(confirmingScope.item.contentText)}?
                  </h3>
                  <p>
                    They will be able to open it, and the photographs on it, from their own account. You can change this
                    back at any time, and doing so takes it away from them again.
                  </p>
                  <p>Nobody is told. It simply becomes something they can open if they look.</p>
                  {/*
                    The drawing's promise about what a shared memory
                    carries of your name — said truthfully, which means
                    reading what this person actually chose rather than
                    reciting the drawing's "your first name and your
                    city". Not shown for supporters: they were invited
                    by name and already know who you are.
                  */}
                  {confirmingScope.visibility !== 'My Supporters' &&
                    (publicName === null ? (
                      <p>
                        You have not chosen a name for other people yet, so it will appear as &ldquo;a community
                        member&rdquo;. You can choose one under Help, in &ldquo;What other people call me&rdquo;.
                      </p>
                    ) : (
                      <p>
                        It will appear as{' '}
                        <strong>
                          {publicName.chosenName}
                          {publicName.city === null ? '' : ` · ${publicName.city}`}
                        </strong>
                        . Never the fuller name the study office has, and never your address or your telephone number.
                      </p>
                    ))}
                  <p>
                    <button className="story-action" onClick={() => void setScope(item, confirmingScope.visibility)}>
                      Yes, let them read it
                    </button>{' '}
                    <button className="story-action" onClick={() => setConfirmingScope(null)}>
                      Not now
                    </button>
                  </p>
                </Modal>
              )}

              {revising?.itemId === item.itemId && (
                <Modal labelledBy={`revise-heading-${item.itemId}`} onClose={closeCorrection}>
                  <h3 id={`revise-heading-${item.itemId}`} className="modal__heading">
                    Change the words of this memory
                  </h3>
                  <p>
                    <label htmlFor={`revise-${item.itemId}`}>Your words</label>
                  </p>
                  <textarea
                    id={`revise-${item.itemId}`}
                    rows={6}
                    value={revising.text}
                    onChange={(e) => setRevising({ itemId: item.itemId, text: e.target.value })}
                  />
                  <p className="story-note">
                    Nothing you wrote before is overwritten. The earlier version is kept and you can still read it.
                  </p>
                  {/*
                    Said here rather than after the fact: confirming
                    applied to the exact words that were confirmed, so
                    changing them leaves the new text unconfirmed. The
                    participant is about to undo something they did
                    deliberately.
                  */}
                  {item.testimonyState === 'ParticipantTestimony' && (
                    <p role="note" className="story-note">
                      <strong>You confirmed these words as your own.</strong> That confirmation belongs to the words you
                      confirmed, not to this entry, so the new text will not be confirmed until you say so again. What
                      you confirmed before stays on the record as it was.
                    </p>
                  )}
                  <p>
                    <button
                      className="story-action"
                      disabled={revising.text.trim() === '' || revising.text === item.contentText}
                      onClick={() => void revise(item)}
                    >
                      Save this version
                    </button>{' '}
                    {/*
                      Deliberately keeps what was typed: a button offered
                      as the safe way out must not be the destructive
                      one. The memory is left exactly as it was — that is
                      what this closes without doing — and the words wait
                      here for the next opening.
                    */}
                    <button className="story-action" onClick={closeCorrection}>
                      Close without saving
                    </button>
                  </p>
                </Modal>
              )}

              {withdrawing?.itemId === item.itemId && (
                <Modal labelledBy={`withdraw-${item.itemId}`} onClose={() => setWithdrawing(null)}>
                  <h3 id={`withdraw-${item.itemId}`}>Take {quotedOpening(item.contentText)} out of your story?</h3>
                  {/*
                    What it does and, just as importantly, what it does
                    not. "Withdraw" reads to many people as "delete",
                    and somebody who wanted it gone would otherwise
                    think it was.
                  */}
                  <p>
                    It becomes private, and anyone you had shared it with can no longer reach it.{' '}
                    <strong>It is not deleted.</strong> You can still read it here, and every version you wrote is kept.
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
                    <button className="story-action" onClick={() => void withdraw(item)}>
                      Yes, take it out
                    </button>{' '}
                    <button className="story-action" onClick={() => setWithdrawing(null)}>
                      Leave it as it is
                    </button>
                  </p>
                </Modal>
              )}

              {confirming?.itemId === item.itemId && (
                <Modal labelledBy={`confirm-${item.itemId}`} onClose={() => setConfirming(null)}>
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
                    <button className="story-action" onClick={() => void confirm(item)}>
                      Yes, these are my words
                    </button>{' '}
                    <button className="story-action" onClick={() => setConfirming(null)}>
                      Not now
                    </button>
                  </p>
                </Modal>
              )}

              {/*
                What this platform knows about the entry, kept apart
                from the entry. These are the platform's sentences, not
                the participant's, and they are set quieter and last so
                that the words above are unmistakably the subject —
                quieter by weight and colour, never by dropping below
                the size this workspace is readable at.
              */}
              <div className="story-entry__notes">
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
                    An earlier version of this was confirmed as your own words. This one has not been — changing the
                    text does not carry that confirmation forward, because it would then say you confirmed something you
                    never read.
                  </p>
                )}
                <p>{VISIBILITY_WORDING[item.visibility] ?? item.visibility}</p>
                {item.visibility !== 'Private' && <p>{SHARING_REACHABLE[item.visibility] ?? SHARING_NO_SCREEN_YET}</p>}
                {STATE_NOTE[item.itemState] !== undefined && <p>{STATE_NOTE[item.itemState]}</p>}
                {item.versionCount > 1 && (
                  <p>
                    This has been written {item.versionCount} times. Nothing you wrote before was overwritten — earlier
                    versions are kept.
                  </p>
                )}
              </div>
              <PostFooter when={entryDate(item.updatedAt)} />
            </div>
          </article>
        );
      })}

      {actionError !== null && <ErrorState error={actionError} />}
      {removing !== null && (
        <Modal labelledBy="remove-file-confirm" onClose={() => setRemoving(null)}>
          <h3 id="remove-file-confirm">Remove this photograph?</h3>
          {/*
            What is destroyed and what is not, said before it happens.
            The bytes go and cannot be brought back; the row saying a
            file was added and removed stays, because quietly erasing the
            fact that anything happened is not the platform's to do.
          */}
          <p>The photograph itself is deleted and cannot be brought back — not by you, and not by anyone here.</p>
          <p>
            Your entry and everything you wrote are untouched. A note that you added a file and removed it stays in the
            account of what happened to your record; that note holds no photograph.
          </p>
          <p>
            <button onClick={() => void remove(removing.itemId, removing.objectId)}>Yes, remove it</button>{' '}
            <button onClick={() => setRemoving(null)}>Keep it</button>
          </p>
        </Modal>
      )}
      <p aria-live="polite" role="status" className={announcementShownInPlace ? 'visually-hidden' : undefined}>
        {announcement}
      </p>
    </section>
  );
}
