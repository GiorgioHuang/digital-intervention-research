import { useEffect, useState } from 'react';
import { api, type MyEnrolment, type Session } from '../api.js';
import { presentError, type PresentedError } from '../errors.js';
import { ErrorState, LoadingState } from './StateBlock.js';

/**
 * Where the participant stands in the study, and how to leave it.
 *
 * The withdrawal command was already owner-permitted — a participant has
 * always been allowed to withdraw themselves — but nothing in their
 * workspace could find the enrolment to withdraw from, so in practice
 * leaving meant asking staff to do it. A right that can only be exercised
 * by asking the people you are leaving is not the same right.
 *
 * Pausing is deliberately absent. `Paused` is a valid enrolment state,
 * but no command transitions into it, so a pause button would be a
 * control that does nothing.
 */
const STAGE_WORDING: Record<string, string> = {
  Invited: 'You have been invited. Nothing has started yet.',
  Screening: 'The team is checking whether this study is suitable for you.',
  Eligible: 'You can take part. The consent conversation comes next.',
  Consenting: 'You are going through the consent questions.',
  Enrolled: 'You have joined. The activities have not started yet.',
  Active: 'You are taking part now.',
  Paused: 'Your participation is paused.',
  Completed: 'Your part in this study is finished. Thank you.',
  Withdrawn: 'You have left this study.',
  Discontinued: 'This study stopped for reasons that were not about you.',
};

const LEFT = new Set(['Withdrawn', 'Completed', 'Discontinued']);

export function MyResearchPart({ session }: { session: Session }) {
  const [enrolments, setEnrolments] = useState<MyEnrolment[] | null>(null);
  const [loadError, setLoadError] = useState<PresentedError | null>(null);
  const [actionError, setActionError] = useState<PresentedError | null>(null);
  const [leaving, setLeaving] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [announcement, setAnnouncement] = useState('');

  const load = async () => {
    try {
      setEnrolments((await api.listMyEnrolments(session)).data.map((d) => d.attributes));
      setLoadError(null);
    } catch (err) {
      setLoadError(presentError(err));
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const leave = async (enrolmentId: string) => {
    try {
      await api.withdrawFromStudy(session, enrolmentId, reason);
      setLeaving(null);
      setReason('');
      setActionError(null);
      setAnnouncement('You have left the study. Nothing further will be collected from you.');
      await load();
    } catch (err) {
      setActionError(presentError(err));
    }
  };

  return (
    <section aria-labelledby="my-research-heading">
      <h2 id="my-research-heading">Your part in the research</h2>

      {enrolments === null && loadError === null && <LoadingState label="Loading your part in the research…" />}
      {loadError !== null && <ErrorState error={loadError} />}
      {enrolments !== null && enrolments.length === 0 && (
        <p>You are not taking part in any study on this platform.</p>
      )}

      {(enrolments ?? []).map((e) => (
        <article key={e.enrolmentId} aria-label={`Study ${e.researchProjectId}`}>
          <p>
            <strong>Where you are:</strong> {STAGE_WORDING[e.enrolmentState] ?? e.enrolmentState}
          </p>
          {!LEFT.has(e.enrolmentState) && (
            <>
              <p>
                You can leave this study at any time. You do not have to give a reason, and leaving does not affect
                any care or service you receive elsewhere.
              </p>
              <p>
                <button onClick={() => setLeaving(e.enrolmentId)}>Leave this study</button>
              </p>
            </>
          )}

          {leaving === e.enrolmentId && (
            <div role="alertdialog" aria-labelledby={`leave-${e.enrolmentId}`}>
              <h3 id={`leave-${e.enrolmentId}`}>Leave this study?</h3>
              <p>
                Nothing new will be collected from you, and the activities stop. Information already included in a
                dataset that has been locked for analysis is not removed from it — locked datasets are not rewritten —
                but nothing further of yours is added.
              </p>
              <p>Your consent choices and your messages are separate; leaving here does not delete them.</p>
              <p>
                <label htmlFor={`reason-${e.enrolmentId}`}>
                  If you want to say why, you can (you do not have to)
                </label>{' '}
                <input id={`reason-${e.enrolmentId}`} value={reason} onChange={(ev) => setReason(ev.target.value)} />
              </p>
              <p>
                <button onClick={() => void leave(e.enrolmentId)}>Yes, leave this study</button>{' '}
                <button
                  onClick={() => {
                    setLeaving(null);
                    setReason('');
                  }}
                >
                  Go back without leaving
                </button>
              </p>
            </div>
          )}
        </article>
      ))}

      {actionError !== null && <ErrorState error={actionError} />}
      <p aria-live="polite" role="status">
        {announcement}
      </p>
    </section>
  );
}
