import { useState } from 'react';
import { api, DELIVERY_STATE_LABELS, PlatformApiError, type Session, type ThreadMessage } from '../api.js';

/**
 * Messaging composer (Doc 20 §158–161): saving a draft and sending are
 * separate actions; the send confirmation shows the exact recipient and
 * the exact message version being confirmed; editing after review
 * invalidates the pending confirmation; a successful confirmation is
 * reported as Queued — never as delivered.
 */
export function MessagePanel({
  session,
  threadId,
  recipient,
}: {
  session: Session;
  threadId: string;
  recipient: { participantId: string; displayName: string };
}) {
  const [text, setText] = useState('');
  const [draft, setDraft] = useState<{ id: string; version: number; text: string } | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [deliveryState, setDeliveryState] = useState<string | null>(null);
  const [history, setHistory] = useState<ThreadMessage[] | null>(null);
  const [notice, setNotice] = useState('');

  const loadHistory = async () => {
    try {
      const res = await api.listThreadMessages(session, threadId);
      setHistory(res.data.map((m) => m.attributes));
      setNotice(res.data.length === 0 ? '还没有消息。' : '消息记录已更新。');
    } catch (err) {
      setNotice(err instanceof PlatformApiError ? `未能获取消息记录：${err.error.code}` : '网络错误');
    }
  };

  const saveDraft = async () => {
    try {
      const res = await api.draftMessage(session, threadId, text);
      setDraft({ id: res.data.id, version: 1, text });
      setReviewing(false);
      setDeliveryState('Not Submitted');
      setNotice('草稿已保存。尚未发送。');
    } catch (err) {
      setNotice(err instanceof PlatformApiError ? `未成功：${err.error.code}` : '网络错误，草稿未保存');
    }
  };

  const confirmSend = async () => {
    if (!draft) return;
    try {
      const res = await api.confirmSend(session, draft.id, draft.version, [recipient.participantId]);
      setReviewing(false);
      setDeliveryState(res.data.meta.deliveryState);
      setNotice('已确认发送。消息正在排队，尚未送达。');
    } catch (err) {
      setNotice(err instanceof PlatformApiError ? `发送确认未成功：${err.error.code}` : '网络错误，消息未发送');
    }
  };

  const edited = draft !== null && text !== draft.text;

  return (
    <section aria-labelledby="message-heading">
      <h2 id="message-heading">写消息</h2>
      <p>
        收件人：<strong>{recipient.displayName}</strong>
      </p>
      <p>
        <button onClick={() => void loadHistory()}>查看消息记录</button>
      </p>
      {history !== null && history.length > 0 && (
        <ol style={{ listStyle: 'none', padding: 0 }} aria-label="消息记录">
          {history.map((m) => (
            <li key={m.messageId} style={{ border: '1px solid currentColor', padding: '0.5rem', marginBlock: '0.5rem' }}>
              <p>
                <strong>{m.senderParticipantId === session.participantId ? '我' : recipient.displayName}</strong>：
                {m.contentText}
              </p>
              {/* Own messages show their truthful delivery state; drafts say so. */}
              {m.senderParticipantId === session.participantId && (
                <p>状态：{DELIVERY_STATE_LABELS[m.deliveryState] ?? m.deliveryState}</p>
              )}
            </li>
          ))}
        </ol>
      )}
      <label htmlFor="message-text">消息内容</label>
      <textarea
        id="message-text"
        rows={4}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          // Editing invalidates any pending review/confirmation step.
          if (reviewing) setReviewing(false);
        }}
      />
      <p>
        {/* Save Draft and Review-and-send are separate, equal actions. */}
        <button onClick={() => void saveDraft()}>保存草稿</button>{' '}
        <button disabled={draft === null || edited} onClick={() => setReviewing(true)}>
          检查并发送
        </button>
        {edited && <span> 内容已修改——请先重新保存草稿，再检查并发送。</span>}
      </p>
      {reviewing && draft !== null && (
        <div role="alertdialog" aria-labelledby="send-confirm-heading">
          <h3 id="send-confirm-heading">发送确认</h3>
          <p>
            你即将把以下内容（版本 {draft.version}）发送给 <strong>{recipient.displayName}</strong>：
          </p>
          <blockquote>{draft.text}</blockquote>
          <button onClick={() => void confirmSend()}>发送消息</button>{' '}
          <button onClick={() => setReviewing(false)}>返回，不发送</button>
        </div>
      )}
      {deliveryState !== null && (
        <p>
          当前状态：<strong>{DELIVERY_STATE_LABELS[deliveryState] ?? deliveryState}</strong>
        </p>
      )}
      <p aria-live="polite" role="status">
        {notice}
      </p>
    </section>
  );
}
