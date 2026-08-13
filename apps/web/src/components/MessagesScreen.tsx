import { useEffect, useState } from 'react';
import { api, type ConnectionSummary, type Session, type ThreadSummary } from '../api.js';
import { presentError, type PresentedError } from '../errors.js';
import { nameOrGap } from '../names.js';
import { ErrorState, LoadingState } from './StateBlock.js';
import { MessagePanel } from './MessagePanel.js';

/**
 * Messages entry: conversations and connections come from the API — no
 * manual identifier entry. A thread can only exist on a valid
 * CommunicationBasis (the server enforces this; ADR-031), so the list
 * here is exactly what the participant may use.
 *
 * Each conversation states that basis in words. The reason a person is
 * reachable is not incidental — it is the whole permission story, and a
 * participant who cannot see it has no way to understand why one person
 * can be written to and another cannot, or what would end that.
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
 */
const CLOSED_THREAD_WORDING: Record<string, string> = {
  Paused: 'This conversation is paused, so nothing can be sent right now.',
  Closed: 'This conversation is closed. You can read it, but nothing more can be sent.',
  Blocked: 'This conversation is not available.',
  Expired: 'The reason this conversation was possible has ended, so nothing more can be sent.',
  Archived: 'This conversation is archived. You can read it, but nothing more can be sent.',
};
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
  const [active, setActive] = useState<ThreadSummary | null>(null);
  const [ending, setEnding] = useState<ConnectionSummary | null>(null);
  const [announcement, setAnnouncement] = useState('');

  // Read on arrival: making someone press a button to see whether they
  // have any messages is a barrier with nothing behind it.
  useEffect(() => {
    void load();
  }, []);

  const load = async () => {
    try {
      const [t, c] = await Promise.all([api.listThreads(session), api.listConnections(session)]);
      setThreads(t.data.map((x) => x.attributes));
      setConnections(c.data.map((x) => x.attributes));
      setAnnouncement('The lists have been updated.');
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

  const startThread = async (conn: ConnectionSummary) => {
    try {
      const res = await api.createThread(session, conn.connectionId);
      const thread: ThreadSummary = {
        threadId: res.data.id,
        otherParticipantId: conn.otherParticipantId,
        otherDisplayName: conn.otherDisplayName,
        basisType: 'ActiveConnection',
        threadState: 'Active',
        createdAt: new Date().toISOString(),
      };
      setThreads((ts) => [thread, ...(ts ?? [])]);
      setActive(thread);
      setAnnouncement('The conversation has been created.');
    } catch (err) {
      setActionError(presentError(err));
    }
  };

  if (active !== null) {
    return (
      <section>
        <button onClick={() => setActive(null)}>← Back to the conversation list</button>
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
    <section aria-labelledby="messages-heading">
      <h1 id="messages-heading">Messages</h1>
      <p>
        <button onClick={() => void load()}>Refresh my conversations and connections</button>
      </p>
      {threads === null && connections === null && actionError === null && (
        <LoadingState label="Loading your conversations and connections…" />
      )}
      {threads !== null && (
        <section aria-labelledby="threads-heading">
          <h2 id="threads-heading">My conversations</h2>
          {threads.length === 0 && (
            <p>You have no conversations yet. You can start one from your connections below.</p>
          )}
          <ul className="list-plain">
            {threads.map((t) => (
              <li key={t.threadId}>
                <button onClick={() => setActive(t)}>
                  Conversation with {nameOrGap(t.otherDisplayName)} (
                  {t.threadState === 'Active' ? 'ongoing' : t.threadState})
                </button>
                <p>Why you can write to each other: {BASIS_WORDING[t.basisType] ?? t.basisType}.</p>
                {t.threadState !== 'Active' && (
                  <p>{CLOSED_THREAD_WORDING[t.threadState] ?? 'Nothing more can be sent in this conversation.'}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
      {ending !== null && (
        <div role="alertdialog" aria-labelledby="end-connection-heading">
          <p id="end-connection-heading">End your connection with {ending.otherDisplayName}?</p>
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
            {ending.otherDisplayName} is not told that you did this.
          </p>
          <p>
            <button onClick={() => void endThisConnection()}>Yes, end this connection</button>{' '}
            <button onClick={() => setEnding(null)}>Go back</button>
          </p>
        </div>
      )}

      {connections !== null && (
        <section aria-labelledby="connections-heading">
          <h2 id="connections-heading">My connections</h2>
          {connections.length === 0 && (
            <p>
              You have no connections yet. One can be made under Meet new people, after you and the other person have
              both said you are interested.
            </p>
          )}
          <ul className="list-plain">
            {connections.map((c) => (
              <li key={c.connectionId}>
                {c.otherDisplayName} ({c.connectionState === 'Active' ? 'connected' : c.connectionState}){' '}
                {c.connectionState === 'Active' && (
                  <>
                    <button onClick={() => void startThread(c)}>Start a conversation</button>{' '}
                    {/*
                      Until this existed the only way out of a connection
                      was to block, so an ordinary parting had to be dressed
                      up as an accusation.
                    */}
                    <button onClick={() => setEnding(c)}>End this connection</button>
                  </>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
      {actionError !== null && <ErrorState error={actionError} />}
      <p aria-live="polite" role="status">
        {announcement}
      </p>
    </section>
  );
}
