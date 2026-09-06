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

/**
 * The blocks somebody has placed, and the way to lift one.
 *
 * There is no "block this person" form here any more. Blocking started
 * from a field asking for the other person's internal identifier, which
 * nobody can know and no screen anywhere offers to copy — so the control
 * was, in practice, unusable by the person it was for (B-35). It is
 * offered where you meet somebody instead: in the conversation, and on a
 * piece in the feed, where there is nothing to type.
 *
 * This screen stays because a block has to be visible to be undone. The
 * confirmation has always said "you can undo it at any time", and a list
 * is what makes that true.
 */
export function MyBlocks({ session, onBack }: { session: Session; onBack: () => void }) {
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
        You block somebody where you meet them: at the foot of your conversation with them, or under a piece of
        their story you are reading. There is nothing to type.
      </p>

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
