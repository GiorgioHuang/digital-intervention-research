import { useState } from 'react';
import { api, type Session } from '../api.js';
import { presentError, type PresentedError } from '../errors.js';
import { ErrorState } from './StateBlock.js';

/**
 * Block & Report (Doc 20; ADR-037/038): blocking is the participant's own
 * decision behind an explicit confirmation; reporting goes to staff for
 * human review — never adjudicated by automation alone — and a report
 * survives independently of any block. A safety concern raises a
 * SafetySignal reviewed by the safety team.
 */
export function SafetyPanel({ session }: { session: Session }) {
  const [report, setReport] = useState({ actorId: '', category: 'harassment', description: '' });
  const [actionError, setActionError] = useState<PresentedError | null>(null);
  const [blockTarget, setBlockTarget] = useState('');
  const [confirmingBlock, setConfirmingBlock] = useState(false);
  const [concern, setConcern] = useState('');
  const [announcement, setAnnouncement] = useState('');

  const run = async (fn: () => Promise<unknown>, done: string) => {
    try {
      await fn();
      setAnnouncement(done);
    } catch (err) {
      setActionError(presentError(err));
    }
  };

  return (
    <section aria-labelledby="safety-heading">
      <h2 id="safety-heading">Blocking and reporting</h2>

      <section aria-labelledby="report-heading">
        <h3 id="report-heading">Report something that made you uncomfortable</h3>
        <p>
          Reports are read by staff — no automated system decides them on its own. If you block the other person
          afterwards, your report is still handled.
        </p>
        <p>
          <label htmlFor="report-actor">The other person's identifier</label>{' '}
          <input
            id="report-actor"
            value={report.actorId}
            onChange={(e) => setReport({ ...report, actorId: e.target.value })}
          />
        </p>
        <p>
          <label htmlFor="report-category">Type</label>{' '}
          <select
            id="report-category"
            value={report.category}
            onChange={(e) => setReport({ ...report, category: e.target.value })}
          >
            <option value="harassment">Harassment</option>
            <option value="unsafe-content">Unsafe content</option>
            <option value="scam">Possible scam</option>
            <option value="other">Something else</option>
          </select>
        </p>
        <p>
          <label htmlFor="report-description">What happened (in your own words)</label>
        </p>
        <textarea
          id="report-description"
          rows={3}
          value={report.description}
          onChange={(e) => setReport({ ...report, description: e.target.value })}
        />
        <p>
          <button
            disabled={report.actorId === '' || report.description === ''}
            onClick={() =>
              void run(
                () => api.submitReport(session, report.actorId, report.category, report.description),
                'Your report has been submitted. Staff will read it.',
              )
            }
          >
            Submit report
          </button>
        </p>
      </section>

      <section aria-labelledby="block-heading">
        <h3 id="block-heading">Block someone</h3>
        <p>
          Once you block someone, the two of you cannot message each other, and you will not appear in each other's
          suggestions. The other person is not notified.
        </p>
        <p>
          <label htmlFor="block-actor">Identifier of the person to block</label>{' '}
          <input id="block-actor" value={blockTarget} onChange={(e) => setBlockTarget(e.target.value)} />
        </p>
        <p>
          <button disabled={blockTarget === ''} onClick={() => setConfirmingBlock(true)}>
            Block this person
          </button>
        </p>
        {confirmingBlock && (
          <div role="alertdialog" aria-labelledby="block-confirm-heading">
            <p id="block-confirm-heading">
              Block {blockTarget}? Blocking is your own decision and you can undo it at any time; undoing a block does
              not bring back anything you missed in the meantime.
            </p>
            <button
              onClick={() => {
                setConfirmingBlock(false);
                void run(() => api.createBlock(session, blockTarget, true), 'The block is in place.');
              }}
            >
              Confirm block
            </button>{' '}
            <button onClick={() => setConfirmingBlock(false)}>Go back without blocking</button>
          </div>
        )}
      </section>

      <section aria-labelledby="concern-heading">
        <h3 id="concern-heading">I have a safety concern</h3>
        <p>
          The safety team reads what you send here. If you or someone else is in immediate danger, call your local
          emergency number — this platform is not an emergency service.
        </p>
        <textarea
          id="concern-text"
          aria-label="Your safety concern"
          rows={3}
          value={concern}
          onChange={(e) => setConcern(e.target.value)}
        />
        <p>
          <button
            disabled={concern === ''}
            onClick={() =>
              void run(
                () => api.recordSafetySignal(session, 'wellbeing-concern', 'Moderate', concern),
                'Your safety concern has been sent to the safety team.',
              )
            }
          >
            Submit safety concern
          </button>
        </p>
      </section>

      {actionError !== null && <ErrorState error={actionError} />}
      <p aria-live="polite" role="status">
        {announcement}
      </p>
    </section>
  );
}
