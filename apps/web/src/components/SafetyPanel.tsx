import { useEffect, useState } from 'react';
import { api, type MyBlock, type Session } from '../api.js';
import { presentError, type PresentedError } from '../errors.js';
import { EmptyState, ErrorState, LoadingState } from './StateBlock.js';

/**
 * Block & Report (Doc 20; ADR-037/038): blocking is the participant's own
 * decision behind an explicit confirmation; reporting goes to staff for
 * human review — never adjudicated by automation alone — and a report
 * survives independently of any block. A safety concern raises a
 * SafetySignal reviewed by the safety team.
 *
 * THREE SCREENS, NOT ONE PANEL. These were one block of three stacked
 * forms sitting open on Help, under a page that also carried four
 * chevron rows, a display-settings disclosure and a sign-out. Somebody
 * arriving at Help — often because something has gone wrong — met three
 * forms they were not looking for before they found the one they were
 * (owner, 2026-09-06). Help is a list now, and each of these is what a
 * row opens.
 *
 * Each keeps its own wording, its own confirmation and its own request
 * exactly as it was; what changed is where they are.
 */

/** The back link every one of these carries, in the shape Help uses. */
function BackToHelp({ onBack }: { onBack: () => void }) {
  return (
    <p>
      <button className="back-link" onClick={onBack}>
        ‹ Back to help
      </button>
    </p>
  );
}

/**
 * The identifier fields below are the honest shape of what the platform
 * can do today and not a good one: nobody can be expected to know another
 * participant's internal identifier, and there is no screen that offers
 * one to copy. Reporting and blocking should start from a person on a
 * screen — a conversation, a piece in the feed — the way ending a
 * connection now does. Recorded as a gap (B-35) rather than papered over
 * with a field that looks fillable and is not.
 */
export function ReportSomething({ session, onBack }: { session: Session; onBack: () => void }) {
  const [report, setReport] = useState({ actorId: '', category: 'harassment', description: '' });
  const [actionError, setActionError] = useState<PresentedError | null>(null);
  const [announcement, setAnnouncement] = useState('');

  return (
    <section aria-labelledby="report-heading">
      <BackToHelp onBack={onBack} />
      <h1 id="report-heading">Report something that made you uncomfortable</h1>
      <p>
        Reports are read by staff — no automated system decides them on its own. If you block the other person
        afterwards, your report is still handled.
      </p>
      <p>
        <label htmlFor="report-actor">The other person&apos;s identifier</label>{' '}
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
            void (async () => {
              try {
                await api.submitReport(session, report.actorId, report.category, report.description);
                setAnnouncement('Your report has been submitted. Staff will read it.');
              } catch (err) {
                setActionError(presentError(err));
              }
            })()
          }
        >
          Submit report
        </button>
      </p>
      {actionError !== null && <ErrorState error={actionError} />}
      <p aria-live="polite" role="status">
        {announcement}
      </p>
    </section>
  );
}

export function SafetyConcern({ session, onBack }: { session: Session; onBack: () => void }) {
  const [concern, setConcern] = useState('');
  const [actionError, setActionError] = useState<PresentedError | null>(null);
  const [announcement, setAnnouncement] = useState('');

  return (
    <section aria-labelledby="concern-heading">
      <BackToHelp onBack={onBack} />
      <h1 id="concern-heading">I have a safety concern</h1>
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
            void (async () => {
              try {
                await api.recordSafetySignal(session, 'wellbeing-concern', 'Moderate', concern);
                setAnnouncement('Your safety concern has been sent to the safety team.');
              } catch (err) {
                setActionError(presentError(err));
              }
            })()
          }
        >
          Submit safety concern
        </button>
      </p>
      {actionError !== null && <ErrorState error={actionError} />}
      <p aria-live="polite" role="status">
        {announcement}
      </p>
    </section>
  );
}

export function MyBlocks({ session, onBack }: { session: Session; onBack: () => void }) {
  const [blockTarget, setBlockTarget] = useState('');
  const [confirmingBlock, setConfirmingBlock] = useState(false);
  const [blocks, setBlocks] = useState<MyBlock[] | null>(null);
  const [blocksError, setBlocksError] = useState<PresentedError | null>(null);
  const [unblocking, setUnblocking] = useState<MyBlock | null>(null);
  const [actionError, setActionError] = useState<PresentedError | null>(null);
  const [announcement, setAnnouncement] = useState('');

  const loadBlocks = async () => {
    try {
      setBlocks((await api.listMyBlocks(session)).data.map((d) => d.attributes));
      setBlocksError(null);
    } catch (err) {
      setBlocksError(presentError(err));
    }
  };

  useEffect(() => {
    void loadBlocks();
  }, []);

  const run = async (fn: () => Promise<unknown>, done: string) => {
    try {
      await fn();
      setAnnouncement(done);
      await loadBlocks();
    } catch (err) {
      setActionError(presentError(err));
    }
  };

  return (
    <section aria-labelledby="block-heading">
      <BackToHelp onBack={onBack} />
      <h1 id="block-heading">Blocking</h1>
      <p>
        Once you block someone, the two of you cannot message each other, and you will not appear in each other&apos;s
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

      {/*
        The confirmation above has always said the block can be undone at
        any time. Nothing listed a block or offered to lift one, so that
        was a promise the product did not keep — you cannot undo something
        you cannot see.
      */}
      <section aria-labelledby="blocks-heading">
        <h2 id="blocks-heading">People you have blocked</h2>
        {blocks === null && blocksError === null && <LoadingState label="Loading the blocks you have placed…" />}
        {blocksError !== null && <ErrorState error={blocksError} />}
        {blocks !== null && blocks.length === 0 && (
          <EmptyState title="You have not blocked anyone" detail="Anyone you block will be listed here." />
        )}
        {(blocks ?? []).map((b) => (
          <article key={b.blockId} aria-label={`Block ${b.blockId}`}>
            <p>
              <strong>{b.blockedDisplayName ?? b.blockedActorId}</strong> — blocked on{' '}
              {new Date(b.createdAt).toLocaleDateString()}
            </p>
            <p>
              <button onClick={() => setUnblocking(b)}>Unblock this person</button>
            </p>
            {unblocking?.blockId === b.blockId && (
              <div role="alertdialog" aria-labelledby={`unblock-${b.blockId}`}>
                <p id={`unblock-${b.blockId}`}>
                  Unblock {b.blockedDisplayName ?? b.blockedActorId}? They will be able to reach you again in the same
                  ways as anyone else. Unblocking does not bring back anything you missed, and it does not restore any
                  connection or permission that existed before — those have to be given again on their own.
                </p>
                <p>
                  <button
                    onClick={() => {
                      setUnblocking(null);
                      void run(() => api.revokeBlock(session, b.blockId), 'The block has been lifted.');
                    }}
                  >
                    Yes, unblock
                  </button>{' '}
                  <button onClick={() => setUnblocking(null)}>Keep the block</button>
                </p>
              </div>
            )}
          </article>
        ))}
      </section>

      {actionError !== null && <ErrorState error={actionError} />}
      <p aria-live="polite" role="status">
        {announcement}
      </p>
    </section>
  );
}
