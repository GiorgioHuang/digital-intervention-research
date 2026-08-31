import { useState } from 'react';
import { contactEndpoint, MAX_FIELD, MAX_MESSAGE, sendContactMessage } from '../../contact.js';

/**
 * "Get in touch" on the about screen — a box to write in, in place of the
 * telephone number.
 *
 * The owner's decision (2026-08-31), and it closes B-22: the number that
 * stood here was in the 555-01xx range reserved for fiction and rang
 * nobody. A box that reaches somebody is better than a number that does
 * not.
 *
 * **It is not a replacement for a telephone, and it does not pretend to
 * be.** The card it replaces said a person answers between eight in the
 * morning and eight at night; nothing here answers at any particular time,
 * so nothing here says it does. Somebody in immediate difficulty needs a
 * route this screen cannot give them, which is why the safety wording
 * below points elsewhere for that rather than inviting them to type.
 *
 * Signed out as well as signed in: the about screen is reached from the
 * footer of every screen including sign-in, and this box has to work there
 * — it is now the only way to reach a person for somebody who cannot get
 * in, which is exactly when a contact route matters most.
 */
export function ContactBox({ endpoint = contactEndpoint() }: { endpoint?: string }) {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [message, setMessage] = useState('');
  /** The honeypot, from the owner's own relay: a bot fills it, a person cannot see it. */
  const [website, setWebsite] = useState('');
  const [status, setStatus] = useState<{ kind: 'ok' | 'problem'; text: string } | null>(null);
  const [sending, setSending] = useState(false);

  if (endpoint === '') {
    /*
     * No relay configured. Saying so is the only honest thing: a form that
     * accepts a message and drops it would be worse than the fictional
     * telephone number this replaced, because that at least failed where
     * the person could see it.
     */
    return (
      <div className="contact-box">
        <p role="status">
          There is no way to send a message from this copy of the site yet. If you are taking part in the study, the
          person who enrolled you can be reached the way they told you.
        </p>
      </div>
    );
  }

  const remaining = MAX_MESSAGE - message.length;

  return (
    <form
      className="contact-box"
      onSubmit={(e) => {
        e.preventDefault();
        if (website !== '') return; // a bot filled the hidden field
        setSending(true);
        setStatus(null);
        void sendContactMessage({ name, contact, message }, endpoint).then((res) => {
          setSending(false);
          if (res.ok) {
            setName('');
            setContact('');
            setMessage('');
            setStatus({
              kind: 'ok',
              // Clause 3: say whether it was sent. Clause 5: say what is
              // not known — nobody here can promise when it is read.
              text: res.canReply
                ? 'Your message was sent. Somebody will read it and write back to you.'
                : 'Your message was sent. You did not leave a way to reach you, so there is no way to write back — send another with an address or a telephone number if you would like an answer.',
            });
            return;
          }
          setStatus({
            kind: 'problem',
            text:
              res.reason === 'no-message'
                ? 'There is nothing written yet. Write your message in the box, then press Send.'
                : res.reason === 'too-long'
                  ? `That is longer than this box can send. Shorten it to ${String(MAX_MESSAGE)} characters and press Send again — what you wrote is still here.`
                  : 'The message was not sent. What you wrote is still here, so you can press Send again in a moment.',
          });
        });
      }}
    >
      <p>
        <label htmlFor="contact-name">Your name</label>
        <input
          id="contact-name"
          value={name}
          maxLength={MAX_FIELD}
          autoComplete="name"
          onChange={(e) => setName(e.target.value)}
        />
      </p>
      <p>
        <label htmlFor="contact-reach">How to reach you</label>
        <span className="field-note" id="contact-reach-note">
          An email address or a telephone number. Without one there is no way to write back.
        </span>
        <input
          id="contact-reach"
          value={contact}
          maxLength={MAX_FIELD}
          aria-describedby="contact-reach-note"
          onChange={(e) => setContact(e.target.value)}
        />
      </p>
      <p>
        <label htmlFor="contact-message">Your message</label>
        <textarea
          id="contact-message"
          rows={6}
          value={message}
          /*
           * Not `maxLength`: an input that silently stops accepting
           * letters is the same failure as the relay silently cutting
           * them off, moved earlier. The count says what is left and the
           * check refuses on submit, so nobody loses words without being
           * told.
           */
          aria-describedby="contact-message-left"
          onChange={(e) => setMessage(e.target.value)}
        />
        <span className="field-note" id="contact-message-left" aria-live="polite">
          {remaining >= 0
            ? `${String(remaining)} characters left`
            : `${String(-remaining)} characters too many — this box can send ${String(MAX_MESSAGE)}`}
        </span>
      </p>
      {/* The honeypot. Off-screen, not focusable, and hidden from readers. */}
      <input
        className="visually-hidden"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
      />
      <button type="submit" disabled={sending}>
        {sending ? 'Sending…' : 'Send message'}
      </button>
      {status !== null && (
        <p role={status.kind === 'ok' ? 'status' : 'alert'} className={`contact-box__status is-${status.kind}`}>
          {status.text}
        </p>
      )}
    </form>
  );
}
