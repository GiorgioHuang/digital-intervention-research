import { useState } from 'react';
import { api, type ConnectionSummary, type Session, type ThreadSummary } from '../api.js';
import { presentError, type PresentedError } from '../errors.js';
import { ErrorState } from './StateBlock.js';
import { MessagePanel } from './MessagePanel.js';

/**
 * Messages entry: conversations and connections come from the API — no
 * manual identifier entry. A thread can only exist on a valid
 * CommunicationBasis (the server enforces this; ADR-031), so the list
 * here is exactly what the participant may use.
 */
export function MessagesScreen({ session }: { session: Session }) {
  const [threads, setThreads] = useState<ThreadSummary[] | null>(null);
  const [actionError, setActionError] = useState<PresentedError | null>(null);
  const [connections, setConnections] = useState<ConnectionSummary[] | null>(null);
  const [active, setActive] = useState<ThreadSummary | null>(null);
  const [announcement, setAnnouncement] = useState('');

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
          recipient={{ participantId: active.otherParticipantId, displayName: active.otherDisplayName }}
        />
      </section>
    );
  }

  return (
    <section aria-labelledby="messages-heading">
      <h1 id="messages-heading">Messages</h1>
      <p>
        <button onClick={() => void load()}>Show my conversations and connections</button>
      </p>
      {threads !== null && (
        <section aria-labelledby="threads-heading">
          <h2 id="threads-heading">My conversations</h2>
          {threads.length === 0 && (
            <p>You have no conversations yet. You can start one from your connections below.</p>
          )}
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {threads.map((t) => (
              <li key={t.threadId} style={{ marginBlock: '0.5rem' }}>
                <button onClick={() => setActive(t)}>
                  Conversation with {t.otherDisplayName} ({t.threadState === 'Active' ? 'ongoing' : t.threadState})
                </button>
              </li>
            ))}
          </ul>
        </section>
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
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {connections.map((c) => (
              <li key={c.connectionId} style={{ marginBlock: '0.5rem' }}>
                {c.otherDisplayName} ({c.connectionState === 'Active' ? 'connected' : c.connectionState}){' '}
                {c.connectionState === 'Active' && (
                  <button onClick={() => void startThread(c)}>Start a conversation</button>
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
