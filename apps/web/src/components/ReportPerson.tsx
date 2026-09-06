import { Modal } from './Modal.js';
import { useState } from 'react';
import { api, type Session } from '../api.js';
import { presentError, type PresentedError } from '../errors.js';
import { ErrorState } from './StateBlock.js';

/**
 * Reporting somebody, from the place you met them.
 *
 * This screen is the drawing's report artboard, and the drawing puts it
 * behind a piece of content rather than in a settings page — which is
 * the owner's ruling too (2026-09-06): report and block belong where you
 * are interacting with the person, and then there is nothing to type.
 * What was here instead was a form on the Help page asking for the other
 * person's internal identifier, which nobody can know and no screen
 * anywhere offers to copy (B-35, closed by this).
 *
 * The reasons are the platform's four moderation categories in the words
 * somebody would use about a person, not the words a queue uses about a
 * case.
 */
const REASONS: readonly { value: string; label: string }[] = [
  { value: 'harassment', label: 'They have been unkind or upsetting' },
  { value: 'scam', label: 'They may be trying to trick me' },
  { value: 'unsafe-content', label: 'Something here is not safe' },
  { value: 'other', label: 'Something else' },
];

export function ReportPerson({
  session,
  name,
  /**
   * How the report names who it is about — never by naming them.
   *
   * `item` names the MEMORY and `thread` names the CONVERSATION; either
   * way the server works out whose it is, so this screen cannot open a
   * case against somebody it merely named. `blockIdentity` is separate
   * and is not the same kind of thing: blocking is a decision about your
   * own screens with no authority over anybody, so naming who to hide
   * from yourself is exactly what it should be.
   */
  subject,
  onBack,
  onGetHelp,
}: {
  session: Session;
  name: string;
  subject:
    | { kind: 'item'; itemId: string }
    | { kind: 'thread'; threadId: string; blockIdentity: string };
  onBack: () => void;
  onGetHelp?: () => void;
}) {
  const [reason, setReason] = useState<string | null>(null);
  const [words, setWords] = useState('');
  const [error, setError] = useState<PresentedError | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<'report' | 'report-and-block' | null>(null);
  /*
   * The block half, waiting to be answered.
   *
   * The drawing has one button that reports and hides in a single press,
   * and its label says so — but a block is confirmation-tier on this
   * platform (`block.create`), and the confirmation is there so that
   * somebody knows what a block DOES before one is placed: no messages
   * either way, no suggestions, the other person not told, and undoing it
   * brings nothing back. A label cannot carry that. So the drawing's
   * button asks first, and the send happens on the answer.
   */
  const [askingBlock, setAskingBlock] = useState(false);

  const send = async (alsoBlock: boolean) => {
    if (reason === null) return;
    setError(null);
    setSending(true);
    try {
      if (subject.kind === 'item') await api.reportLifeStoryItem(session, subject.itemId, reason, words);
      else await api.reportThread(session, subject.threadId, reason, words);
      /*
       * The block is a second act and is only offered on the button that
       * says so. It is attempted after the report, and a failure here
       * leaves the report standing — which is the truthful order: a
       * report that reached the study office is not undone by a block
       * that did not (ADR-038 keeps them independent).
       */
      if (alsoBlock && subject.kind === 'thread') {
        await api.createBlock(session, subject.blockIdentity, true);
      }
      setSent(alsoBlock ? 'report-and-block' : 'report');
    } catch (err) {
      setError(presentError(err));
    } finally {
      setSending(false);
    }
  };

  if (sent !== null) {
    return (
      <section aria-labelledby="report-sent-heading">
        <h1 id="report-sent-heading">Thank you. It has been sent.</h1>
        <p role="status">
          A person at the study office will read it. You will not be asked to explain yourself, and {name} is not
          told who reported them.
        </p>
        {sent === 'report-and-block' && (
          <p>
            {name} is blocked as well. The two of you cannot write to each other, and you will not appear in each
            other&apos;s suggestions. You can undo the block under Help, in &ldquo;Blocking&rdquo;.
          </p>
        )}
        <p>
          <button className="back-link" onClick={onBack}>
            ‹ Go back
          </button>
        </p>
      </section>
    );
  }

  return (
    <section aria-labelledby="report-heading">
      <p>
        <button className="back-link" onClick={onBack}>
          ‹ Back
        </button>
      </p>
      <h1 id="report-heading">Report {name}</h1>
      <p>
        A person at the study office reads every report. You will not be asked to explain yourself, and the person
        you report is not told who reported them.
      </p>

      <h2 id="report-reason-heading">What is the matter?</h2>
      <div className="report-reasons" role="radiogroup" aria-labelledby="report-reason-heading">
        {REASONS.map((r) => (
          <button
            key={r.value}
            type="button"
            role="radio"
            aria-checked={reason === r.value}
            className="report-reason"
            onClick={() => setReason(r.value)}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="report-words">
        <label htmlFor="report-words">Anything you want to add, if you like</label>
        <textarea
          id="report-words"
          rows={4}
          placeholder="You do not have to write anything."
          value={words}
          onChange={(e) => setWords(e.target.value)}
        />
      </div>

      {error !== null && <ErrorState error={error} />}

      {/*
        Both buttons need a reason chosen. A report with no category is a
        case a moderator opens knowing nothing about why it was sent, and
        the words are optional by design — so the reason is the one thing
        this screen has to have.
      */}
      <button className="report-send" disabled={reason === null || sending} onClick={() => void send(false)}>
        Send this to the study office
      </button>
      {subject.kind === 'thread' && (
        <button className="report-send-and-hide" disabled={reason === null || sending} onClick={() => setAskingBlock(true)}>
          Send it, and hide this person from me
        </button>
      )}
      {askingBlock && (
        <Modal labelledBy="hide-heading" onClose={() => setAskingBlock(false)}>
          <p id="hide-heading">Send the report and block {name}?</p>
          <p>
            The two of you will not be able to write to each other, and you will not appear in each other&apos;s
            suggestions. {name} is not told, either about the report or about the block.
          </p>
          <p>
            You can undo the block at any time under Help, in &ldquo;Blocking&rdquo; — undoing it does not bring back
            anything you missed in the meantime, and your report is handled either way.
          </p>
          <p>
            <button
              disabled={sending}
              onClick={() => {
                setAskingBlock(false);
                void send(true);
              }}
            >
              Yes, send it and block {name}
            </button>{' '}
            <button onClick={() => setAskingBlock(false)}>Go back</button>
          </p>
        </Modal>
      )}
      {onGetHelp !== undefined && (
        <button className="report-telephone" onClick={onGetHelp}>
          I would rather telephone someone
        </button>
      )}
    </section>
  );
}
