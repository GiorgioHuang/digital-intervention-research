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
      setAnnouncement('已更新。');
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
        basisType: 'ActiveConnection',
        threadState: 'Active',
        createdAt: new Date().toISOString(),
      };
      setThreads((ts) => [thread, ...(ts ?? [])]);
      setActive(thread);
      setAnnouncement('会话已创建。');
    } catch (err) {
      setActionError(presentError(err));
    }
  };

  if (active !== null) {
    return (
      <section>
        <button onClick={() => setActive(null)}>← 返回会话列表</button>
        <MessagePanel
          session={session}
          threadId={active.threadId}
          recipient={{ participantId: active.otherParticipantId, displayName: active.otherParticipantId }}
        />
      </section>
    );
  }

  return (
    <section aria-labelledby="messages-heading">
      <h1 id="messages-heading">消息</h1>
      <p>
        <button onClick={() => void load()}>查看我的会话与联系</button>
      </p>
      {threads !== null && (
        <section aria-labelledby="threads-heading">
          <h2 id="threads-heading">我的会话</h2>
          {threads.length === 0 && <p>还没有会话。可以从下面的联系开始一个。</p>}
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {threads.map((t) => (
              <li key={t.threadId} style={{ marginBlock: '0.5rem' }}>
                <button onClick={() => setActive(t)}>
                  与 {t.otherParticipantId} 的会话（{t.threadState === 'Active' ? '进行中' : t.threadState}）
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
      {connections !== null && (
        <section aria-labelledby="connections-heading">
          <h2 id="connections-heading">我的联系</h2>
          {connections.length === 0 && <p>还没有联系。可以在「认识新朋友」中互相表示兴趣后建立。</p>}
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {connections.map((c) => (
              <li key={c.connectionId} style={{ marginBlock: '0.5rem' }}>
                {c.otherParticipantId}（{c.connectionState === 'Active' ? '已联系' : c.connectionState}）{' '}
                {c.connectionState === 'Active' && <button onClick={() => void startThread(c)}>开始会话</button>}
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
