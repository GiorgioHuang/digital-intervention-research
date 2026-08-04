import { useEffect, useState } from 'react';
import { api, DELIVERY_STATE_LABELS, type Session, type ThreadMessage } from '../api.js';
import { presentError, type PresentedError } from '../errors.js';
import { ErrorState } from './StateBlock.js';

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
  basis,
  closedReason,
}: {
  session: Session;
  threadId: string;
  recipient: { participantId: string; displayName: string };
  /** Why these two may write to each other, in the caller's words. */
  basis?: string;
  /** Set when the thread can no longer be written to, with the reason. */
  closedReason?: string;
}) {
  const [text, setText] = useState('');
  const [actionError, setActionError] = useState<PresentedError | null>(null);
  const [draft, setDraft] = useState<{ id: string; version: number; text: string } | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [deliveryState, setDeliveryState] = useState<string | null>(null);
  const [history, setHistory] = useState<ThreadMessage[] | null>(null);
  const [notice, setNotice] = useState('');

  // The history is the context for what is being written; requiring a
  // press to see it puts the conversation behind the compose box.
  useEffect(() => {
    void loadHistory();
  }, [threadId]);

  const loadHistory = async () => {
    try {
      const res = await api.listThreadMessages(session, threadId);
      setHistory(res.data.map((m) => m.attributes));
      setNotice(res.data.length === 0 ? 'There are no messages yet.' : 'The message history has been updated.');
    } catch (err) {
      setActionError(presentError(err));
    }
  };

  const saveDraft = async () => {
    try {
      const res = await api.draftMessage(session, threadId, text);
      setDraft({ id: res.data.id, version: 1, text });
      setReviewing(false);
      setDeliveryState('Not Submitted');
      setNotice('Your draft is saved. It has not been sent.');
    } catch (err) {
      setActionError(presentError(err));
    }
  };

  const confirmSend = async () => {
    if (!draft) return;
    try {
      const res = await api.confirmSend(session, draft.id, draft.version, [recipient.participantId]);
      setReviewing(false);
      setDeliveryState(res.data.meta.deliveryState);
      setNotice('You have confirmed sending. The message is queued for sending; it has not arrived yet.');
    } catch (err) {
      setActionError(presentError(err));
    }
  };

  const edited = draft !== null && text !== draft.text;

  return (
    <section aria-labelledby="message-heading">
      <h2 id="message-heading">Write a message</h2>
      <p>
        To: <strong>{recipient.displayName}</strong>
      </p>
      {basis !== undefined && <p>Why you can write to each other: {basis}.</p>}
      {closedReason !== undefined && <p role="note">{closedReason}</p>}
      <p>
        <button onClick={() => void loadHistory()}>Refresh message history</button>
      </p>
      {history !== null && history.length > 0 && (
        <ol style={{ listStyle: 'none', padding: 0 }} aria-label="Message history">
          {history.map((m) => (
            <li key={m.messageId} style={{ border: '1px solid currentColor', padding: '0.5rem', marginBlock: '0.5rem' }}>
              <p>
                <strong>{m.senderParticipantId === session.participantId ? 'You' : recipient.displayName}</strong>:{' '}
                {m.contentText}
              </p>
              {/* Own messages show their truthful delivery state; drafts say so. */}
              {m.senderParticipantId === session.participantId && (
                <p>Status: {DELIVERY_STATE_LABELS[m.deliveryState] ?? m.deliveryState}</p>
              )}
            </li>
          ))}
        </ol>
      )}
      <label htmlFor="message-text">Your message</label>
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
        <button onClick={() => void saveDraft()}>Save draft</button>{' '}
        <button disabled={draft === null || edited} onClick={() => setReviewing(true)}>
          Review and send
        </button>
        {edited && <span> You have changed the text — save the draft again before you review and send.</span>}
      </p>
      {reviewing && draft !== null && (
        <div role="alertdialog" aria-labelledby="send-confirm-heading">
          <h3 id="send-confirm-heading">Send confirmation</h3>
          <p>
            You are about to send the following text (version {draft.version}) to{' '}
            <strong>{recipient.displayName}</strong>:
          </p>
          <blockquote>{draft.text}</blockquote>
          <button onClick={() => void confirmSend()}>Send message</button>{' '}
          <button onClick={() => setReviewing(false)}>Go back without sending</button>
        </div>
      )}
      {deliveryState !== null && (
        <p>
          Current status: <strong>{DELIVERY_STATE_LABELS[deliveryState] ?? deliveryState}</strong>
        </p>
      )}
      {actionError !== null && <ErrorState error={actionError} />}
      <p aria-live="polite" role="status">
        {notice}
      </p>
    </section>
  );
}
