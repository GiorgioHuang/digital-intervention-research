import { useEffect, useState } from 'react';
import {
  api,
  type ConnectionSummary,
  type MyRelationship,
  type Session,
  type ThreadSummary,
} from '../api.js';
import { previewLine, whenLine } from '../conversation-row.js';
import { presentError, type PresentedError } from '../errors.js';
import { nameOrGap } from '../names.js';
import { ErrorState, LoadingState } from './StateBlock.js';
import { MessagePanel } from './MessagePanel.js';

/**
 * Messages: the drawing's list of conversations.
 *
 * Each row carries who, when, and roughly what about — nothing else. The
 * screen that was here listed conversations as "Conversation with Ben
 * (ongoing)" with a paragraph under each explaining why the two could
 * write to each other, and a second section of connections beneath. It
 * said a great deal and showed nothing: a person could not tell which
 * conversation had something new in it, which is the one question this
 * screen exists to answer.
 *
 * The permission story is not lost, it has moved to where the
 * conversation is: `MessagePanel` states the basis at the top of every
 * thread it opens. The reason a person is reachable belongs beside the
 * writing, not on a list somebody is scanning.
 */
const BASIS_WORDING: Record<string, string> = {
  ActiveConnection: 'you and this person both agreed to connect',
  AuthorisedRelationship: 'you approved this person as a supporter',
  InterventionSession: 'this is part of a session in the study',
  ModeratedCommunity: 'you are both members of the same community',
};

/**
 * A thread whose state is not Active cannot be written to. Saying so on
 * the row is the honest form: the alternative is letting someone open it,
 * type, and be refused at the end.
 *
 * The drawing has no such line, because the drawing draws conversations
 * that are open. It is kept, shortened to what fits a row, and the full
 * sentence stays on the conversation itself (X-42).
 */
const CLOSED_THREAD_WORDING: Record<string, string> = {
  Paused: 'This conversation is paused, so nothing can be sent right now.',
  Closed: 'This conversation is closed. You can read it, but nothing more can be sent.',
  Blocked: 'This conversation is not available.',
  Expired: 'The reason this conversation was possible has ended, so nothing more can be sent.',
  Archived: 'This conversation is archived. You can read it, but nothing more can be sent.',
};
const CLOSED_SHORT: Record<string, string> = {
  Paused: 'Paused',
  Closed: 'Closed',
  Blocked: 'Not available',
  Expired: 'Ended',
  Archived: 'Archived',
};

/** Somebody who can be written to, from either kind of basis. */
interface Writable {
  key: string;
  name: string;
  /** The existing conversation, when there is one; otherwise how to open one. */
  threadId: string | null;
  start: () => Promise<string>;
  otherParticipantId: string;
  /** Present only for a connection, which is the only thing that can be ended here. */
  connection: ConnectionSummary | null;
}

export function MessagesScreen({
  session,
  onGetHelp,
  assistedBy,
}: {
  session: Session;
  onGetHelp?: () => void;
  assistedBy?: string | null;
}) {
  const [threads, setThreads] = useState<ThreadSummary[] | null>(null);
  const [actionError, setActionError] = useState<PresentedError | null>(null);
  const [connections, setConnections] = useState<ConnectionSummary[] | null>(null);
  const [relationships, setRelationships] = useState<MyRelationship[] | null>(null);
  const [active, setActive] = useState<ThreadSummary | null>(null);
  const [ending, setEnding] = useState<ConnectionSummary | null>(null);
  const [choosing, setChoosing] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const now = new Date();

  // Read on arrival: making someone press a button to see whether they
  // have any messages is a barrier with nothing behind it.
  useEffect(() => {
    void load();
  }, []);

  const load = async () => {
    try {
      const [t, c, r] = await Promise.all([
        api.listThreads(session),
        api.listConnections(session),
        api.listMyRelationships(session),
      ]);
      setThreads(t.data.map((x) => x.attributes));
      setConnections(c.data.map((x) => x.attributes));
      setRelationships(r.data.map((x) => x.attributes));
    } catch (err) {
      setActionError(presentError(err));
    }
  };

  const endThisConnection = async () => {
    if (ending === null) return;
    setActionError(null);
    try {
      await api.endConnection(session, ending.connectionId);
      const name = ending.otherDisplayName;
      setEnding(null);
      // The open conversation, if it is this one, has just stopped being
      // usable; leaving it open would offer a send that now fails.
      setActive(null);
      await load();
      setAnnouncement(`You are no longer connected to ${name}. What you both wrote is still there to read.`);
    } catch (err) {
      setActionError(presentError(err));
    }
  };

  /**
   * Everybody this participant may write to, from either basis.
   *
   * A supporter is only here if the relationship they were approved under
   * actually permits messages: being trusted to read what somebody shares
   * is not the same as being allowed to write to them (D-29), and the
   * server refuses the difference, so the screen must not offer it.
   */
  const writable: Writable[] = [
    ...(connections ?? [])
      .filter((c) => c.connectionState === 'Active')
      .map((c) => ({
        key: `conn_${c.connectionId}`,
        name: nameOrGap(c.otherDisplayName),
        threadId:
          threads?.find((t) => t.basisType === 'ActiveConnection' && t.otherParticipantId === c.otherParticipantId)
            ?.threadId ?? null,
        start: async () => (await api.createThread(session, c.connectionId)).data.id,
        otherParticipantId: c.otherParticipantId,
        connection: c,
      })),
    ...(relationships ?? [])
      .filter((r) => r.relationshipState === 'Active' && r.permittedActions.includes('relationship.message'))
      .map((r) => ({
        key: `rel_${r.relationshipId}`,
        name: nameOrGap(r.relatedDisplayName),
        threadId:
          threads?.find(
            (t) => t.basisType === 'AuthorisedRelationship' && t.otherParticipantId === r.relatedActorId,
          )?.threadId ?? null,
        start: async () => (await api.startRelationshipThread(session, r.relationshipId)).data.id,
        otherParticipantId: r.relatedActorId,
        connection: null,
      })),
  ];

  /**
   * Open the conversation with this person, making it first if it does
   * not exist. Asking again for one that exists returns the same
   * conversation rather than splitting the history in two, so the two
   * cases can be one act on the screen.
   */
  const writeTo = async (person: Writable) => {
    setActionError(null);
    const existing = threads?.find((t) => t.threadId === person.threadId);
    if (existing !== undefined) {
      setChoosing(false);
      setActive(existing);
      return;
    }
    try {
      const threadId = await person.start();
      const thread: ThreadSummary = {
        threadId,
        otherParticipantId: person.otherParticipantId,
        otherDisplayName: person.name,
        basisType: person.connection === null ? 'AuthorisedRelationship' : 'ActiveConnection',
        threadState: 'Active',
        createdAt: new Date().toISOString(),
        lastMessageAt: null,
        lastMessageState: null,
        lastMessageFromMe: null,
        lastMessagePreview: null,
      };
      setThreads((ts) => [thread, ...(ts ?? [])]);
      setChoosing(false);
      setActive(thread);
      setAnnouncement('The conversation has been created.');
    } catch (err) {
      setActionError(presentError(err));
    }
  };

  if (active !== null) {
    return (
      <section>
        <button className="back-link" onClick={() => setActive(null)}>
          ← Back to the conversation list
        </button>
        <MessagePanel
          session={session}
          threadId={active.threadId}
          recipient={{ participantId: active.otherParticipantId, displayName: nameOrGap(active.otherDisplayName) }}
          basis={BASIS_WORDING[active.basisType] ?? active.basisType}
          {...(onGetHelp === undefined ? {} : { onGetHelp })}
          assisted={assistedBy != null}
          {...(active.threadState === 'Active'
            ? {}
            : {
                closedReason:
                  CLOSED_THREAD_WORDING[active.threadState] ?? 'Nothing more can be sent in this conversation.',
              })}
        />
      </section>
    );
  }

  return (
    <section className="messages-screen" aria-labelledby="messages-heading">
      <h1 id="messages-heading">Messages</h1>
      {/*
        The drawing's reassurance, and it is exactly true: a thread exists
        only on a CommunicationBasis (ADR-031), which is either a
        connection this participant agreed to or a supporter they approved.
      */}
      <p className="messages-reassurance">Nobody can write to you unless you have allowed them.</p>

      {threads === null && actionError === null && <LoadingState label="Looking for your conversations…" />}

      {threads !== null && threads.length === 0 && (
        <p className="messages-reassurance">
          You have no conversations yet. Below is everybody you can write to.
        </p>
      )}

      {(threads ?? []).map((t) => (
        <button key={t.threadId} className="conversation-row" onClick={() => setActive(t)}>
          <span className="conversation-row__top">
            <span className="conversation-row__who">{nameOrGap(t.otherDisplayName)}</span>
            <span className="conversation-row__when">{whenLine(t.lastMessageAt ?? t.createdAt, now)}</span>
          </span>
          <span className="conversation-row__preview">{previewLine(t)}</span>
          {t.threadState !== 'Active' && (
            <span className="conversation-row__state">{CLOSED_SHORT[t.threadState] ?? t.threadState}</span>
          )}
        </button>
      ))}

      <button className="messages-write" aria-expanded={choosing} onClick={() => setChoosing((was) => !was)}>
        Write a message
      </button>
      {/*
        A second door to the same panel, because the panel does two
        things. Ending a connection lives in there — this is the only
        screen that lists connections — and somebody who has come to leave
        a connection will not press a button that says "Write a message"
        to do it. The drawing has no such control, and it has no way out
        of a connection either (X-44).
      */}
      <button className="messages-manage" aria-expanded={choosing} onClick={() => setChoosing((was) => !was)}>
        Who I am connected to
      </button>

      {choosing && (
        <div className="messages-chooser">
          <h2 className="messages-chooser__heading">The people you can write to</h2>
          {writable.length === 0 ? (
            /*
              Not an error, and not a dead end. Both ways somebody becomes
              reachable are named, because a person who cannot write to
              anybody needs to know what would change that.
            */
            <p>
              There is nobody you can write to yet. A conversation becomes possible when you and somebody else both
              say you are interested under Meet new people, or when you approve someone as a supporter and allow them
              to send you messages.
            </p>
          ) : (
            writable.map((person) => (
              <div key={person.key} className="messages-chooser__person">
                <button className="messages-chooser__write" onClick={() => void writeTo(person)}>
                  Write to {person.name}
                </button>
                {person.connection !== null && (
                  /*
                    Ending a connection lives here because this is the only
                    screen that lists connections. Until it existed the
                    only way out of one was to block, so an ordinary
                    parting had to be dressed up as an accusation.
                  */
                  <button className="messages-chooser__end" onClick={() => setEnding(person.connection)}>
                    End this connection
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {ending !== null && (
        <div role="alertdialog" aria-labelledby="end-connection-heading" className="messages-ending">
          <p id="end-connection-heading">End your connection with {nameOrGap(ending.otherDisplayName)}?</p>
          {/*
            The distinction that matters. Blocking says something about the
            other person and belongs to the safety screen; this says only
            that the two of you are no longer connected.
          */}
          <p>
            This is not the same as blocking. Blocking is for when someone is troubling you, and it lives under Help
            and safety. This just ends the connection.
          </p>
          <p>
            You will not be able to write to each other, and your conversations will show that nothing more can be
            sent. Nothing you have already written is deleted, and you can both still read it.{' '}
            {nameOrGap(ending.otherDisplayName)} is not told that you did this.
          </p>
          <p>
            <button onClick={() => void endThisConnection()}>Yes, end this connection</button>{' '}
            <button onClick={() => setEnding(null)}>Go back</button>
          </p>
        </div>
      )}

      {actionError !== null && <ErrorState error={actionError} />}
      <p aria-live="polite" role="status" className="visually-hidden">
        {announcement}
      </p>
    </section>
  );
}
