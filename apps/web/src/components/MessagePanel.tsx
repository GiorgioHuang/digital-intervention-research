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
/**
 * Deliberately broad: a warning shown once too often costs a glance,
 * while one missed costs the thing it exists to prevent.
 */
const LINK_PATTERN = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|co|io|cn|ru|xyz|top|link)\b)/i;

export function MessagePanel({
  session,
  threadId,
  recipient,
  basis,
  closedReason,
  onGetHelp,
  assisted = false,
}: {
  session: Session;
  threadId: string;
  recipient: { participantId: string; displayName: string };
  /** Why these two may write to each other, in the caller's words. */
  basis?: string;
  /** Set when the thread can no longer be written to, with the reason. */
  closedReason?: string;
  /** Navigates to Help and safety, where blocking and reporting live. */
  onGetHelp?: () => void;
  /**
   * True while someone is helping the participant use the app (D-15).
   * The helper presses nothing — but they can read the conversation, so
   * the recipient is told.
   */
  assisted?: boolean;
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
      const res = await api.confirmSend(session, draft.id, draft.version, [recipient.participantId], assisted);
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
              {/*
                D-15: the recipient is told that someone was with the
                sender. It is stated as a fact about the circumstances, not
                as a doubt about the message or the person.
              */}
              {m.sentWithAssistance && (
                <p>
                  {m.senderParticipantId === session.participantId
                    ? 'Sent while someone was helping you.'
                    : `Sent while someone was helping ${recipient.displayName}. That person could see this conversation.`}
                </p>
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
      {/*
        Doc 20 §163: a reminder, not a decision, so it is inline rather
        than a dialog — a dialog would make it a gate the person has to
        get past, and the footnote would be a lie. It appears once a draft
        exists and before the send confirmation, and it never judges the
        other person.
      */}
      {draft !== null && !reviewing && LINK_PATTERN.test(draft.text) && (
        <section aria-labelledby="link-warning-heading">
          <h3 id="link-warning-heading">Have another look before you send</h3>
          <p>
            This message contains a link to somewhere outside the platform. People who want to trick others sometimes
            use links to get passwords or money. If you are not sure, not sending is a perfectly good choice.
          </p>
          <p>
            {/*
              "Not now" must not throw the message away. The draft is
              already saved and stays saved; the only thing this does is
              say so, because the reassuring option should not be the
              destructive one.
            */}
            <button onClick={() => setNotice('Nothing was sent. Your draft is still saved, and you can come back to it.')}>
              Not now
            </button>{' '}
            <button onClick={() => setNotice('Your text is still in the box above. Change it, then save the draft again.')}>
              Change the message
            </button>{' '}
            {onGetHelp !== undefined && <button onClick={onGetHelp}>Get help, block or report</button>}
          </p>
          <p>
            <small>This is only a reminder. It is not a judgement about anyone.</small>
          </p>
        </section>
      )}
      {reviewing && draft !== null && (
        <div role="alertdialog" aria-labelledby="send-confirm-heading">
          <h3 id="send-confirm-heading">Send confirmation</h3>
          <p>
            You are about to send the following text (version {draft.version}) to{' '}
            <strong>{recipient.displayName}</strong>:
          </p>
          <blockquote>{draft.text}</blockquote>
          {basis !== undefined && <p>You can write to each other because {basis}.</p>}
          {/*
            The single most important sentence in this dialog. Confirming
            hands the message to the delivery service; it is not delivery,
            and the platform will not later claim it was received without
            a result from that service (Doc 20 §160/§161).
          */}
          {assisted && (
            <p>
              Because someone is helping you right now, {recipient.displayName} will be told that this message was
              sent while you had help.
            </p>
          )}
          <p>
            Confirming sends it for delivery. It does not mean it has arrived: you will see the delivery state
            afterwards, and if that state is unknown it stays unknown rather than becoming &ldquo;delivered&rdquo;.
          </p>
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
