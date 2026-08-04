import { useState } from 'react';
import { staffActionError, staffLoadError } from '../errors.js';
import { staffApi, type EnrolmentItem, type StaffSession } from '../staff-api.js';

/**
 * Enrolment coordination (M05): the chain is explicit — invite against an
 * approved protocol version, screening, a HUMAN eligibility decision with
 * a written reason, consent, enrol, activate. Withdrawal is confirmed and
 * states its consequence honestly.
 */
export function StaffCoordinatorPanel({ session }: { session: StaffSession }) {
  const [invite, setInvite] = useState({ participantId: '', projectId: '', protocolVersionId: '' });
  const [enrolmentId, setEnrolmentId] = useState('');
  const [eligibility, setEligibility] = useState({ decision: 'Eligible' as 'Eligible' | 'Ineligible', reason: '' });
  const [confirmingWithdraw, setConfirmingWithdraw] = useState(false);
  const [listProjectId, setListProjectId] = useState('');
  const [enrolments, setEnrolments] = useState<EnrolmentItem[] | null>(null);
  const [announcement, setAnnouncement] = useState('');

  const loadEnrolments = async () => {
    try {
      const res = await staffApi.listEnrolments(session, listProjectId);
      setEnrolments(res.data.map((i) => i.attributes));
      setAnnouncement('Enrolment list updated.');
    } catch (err) {
      setAnnouncement(staffLoadError(err, 'the enrolment list'));
    }
  };

  const run = async (fn: () => Promise<unknown>, done: string) => {
    try {
      await fn();
      setAnnouncement(done);
    } catch (err) {
      setAnnouncement(staffActionError(err, 'That enrolment step'));
    }
  };

  return (
    <section aria-labelledby="coord-heading">
      <h2 id="coord-heading">Enrolment</h2>

      <section aria-labelledby="invite-heading">
        <h3 id="invite-heading">Invite a participant</h3>
        <p>An invitation can only cite an approved or activated protocol version — a draft protocol cannot be the basis for enrolment.</p>
        <p>
          <label htmlFor="inv-pat">Participant identifier</label>{' '}
          <input id="inv-pat" value={invite.participantId} onChange={(e) => setInvite({ ...invite, participantId: e.target.value })} />
        </p>
        <p>
          <label htmlFor="inv-proj">Project identifier</label>{' '}
          <input id="inv-proj" value={invite.projectId} onChange={(e) => setInvite({ ...invite, projectId: e.target.value })} />
        </p>
        <p>
          <label htmlFor="inv-pv">Protocol version identifier</label>{' '}
          <input id="inv-pv" value={invite.protocolVersionId} onChange={(e) => setInvite({ ...invite, protocolVersionId: e.target.value })} />
        </p>
        <p>
          <button
            disabled={invite.participantId === '' || invite.projectId === '' || invite.protocolVersionId === ''}
            onClick={() =>
              void run(async () => {
                const res = await staffApi.invite(session, invite.participantId, invite.projectId, invite.protocolVersionId);
                setEnrolmentId(res.data.id);
              }, 'Invitation created.')
            }
          >
            Create invitation
          </button>
        </p>
      </section>

      <section aria-labelledby="list-heading">
        <h3 id="list-heading">Enrolment list</h3>
        <p>
          <label htmlFor="list-proj">Filter by project (optional)</label>{' '}
          <input id="list-proj" value={listProjectId} onChange={(e) => setListProjectId(e.target.value)} />{' '}
          <button onClick={() => void loadEnrolments()}>View enrolment list</button>
        </p>
        {enrolments !== null && (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {enrolments.length === 0 && <li>No enrolments match.</li>}
            {enrolments.map((e) => (
              <li key={e.enrolmentId}>
                {e.enrolmentId} (participant {e.participantId}, project {e.researchProjectId}, state: {e.enrolmentState}){' '}
                <button onClick={() => setEnrolmentId(e.enrolmentId)}>Select</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="chain-heading">
        <h3 id="chain-heading">Enrolment steps</h3>
        <p>
          <label htmlFor="enr-id">Enrolment identifier</label>{' '}
          <input id="enr-id" value={enrolmentId} onChange={(e) => setEnrolmentId(e.target.value)} />
        </p>
        <p>
          {(
            [
              ['start-screening', 'Start screening'],
              ['start-consent', 'Start consent'],
              ['enrol', 'Enrol'],
              ['activate', 'Activate'],
            ] as const
          ).map(([step, label]) => (
            <span key={step}>
              <button
                disabled={enrolmentId === ''}
                onClick={() => void run(() => staffApi.enrolmentStep(session, enrolmentId, step), `Done: ${label}`)}
              >
                {label}
              </button>{' '}
            </span>
          ))}
        </p>

        <h4>Eligibility decision (a human responsibility)</h4>
        <p>You make the eligibility decision and it is recorded in your name — it is not a score produced by the system. A reason is required.</p>
        <p>
          <select
            aria-label="Eligibility decision"
            value={eligibility.decision}
            onChange={(e) => setEligibility({ ...eligibility, decision: e.target.value as 'Eligible' | 'Ineligible' })}
          >
            <option value="Eligible">Eligible</option>
            <option value="Ineligible">Not eligible</option>
          </select>{' '}
          <input
            aria-label="Reason for the eligibility decision"
            placeholder="Reason (required)"
            value={eligibility.reason}
            onChange={(e) => setEligibility({ ...eligibility, reason: e.target.value })}
          />{' '}
          <button
            disabled={enrolmentId === '' || eligibility.reason === ''}
            onClick={() =>
              void run(
                () => staffApi.eligibilityDecision(session, enrolmentId, eligibility.decision, eligibility.reason),
                'Eligibility decision recorded in your name.',
              )
            }
          >
            Record eligibility decision
          </button>
        </p>

        <h4>Withdrawal</h4>
        <p>
          <button disabled={enrolmentId === ''} onClick={() => setConfirmingWithdraw(true)}>
            Withdraw this participant
          </button>
        </p>
        {confirmingWithdraw && (
          <div role="alertdialog" aria-labelledby="wd-confirm">
            <p id="wd-confirm">
              Withdraw this participant? Withdrawal stops further data collection and propagates to related records; research
              datasets that are already locked are not rewritten.
            </p>
            <button
              onClick={() => {
                setConfirmingWithdraw(false);
                void run(
                  () => staffApi.withdrawEnrolment(session, enrolmentId, 'participant-request'),
                  'Withdrawal recorded and propagation started.',
                );
              }}
            >
              Confirm withdrawal
            </button>{' '}
            <button onClick={() => setConfirmingWithdraw(false)}>Back</button>
          </div>
        )}
      </section>

      <p aria-live="polite" role="status">
        {announcement}
      </p>
    </section>
  );
}
