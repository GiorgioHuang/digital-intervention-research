import { useState } from 'react';
import { staffActionError, staffLoadError } from '../errors.js';
import { staffApi, type EnrolmentItem, type StaffSession } from '../staff-api.js';
import { DeliveryRecord } from './DeliveryRecord.js';
import { ProposeRelationship } from './ProposeRelationship.js';

/**
 * Enrolment coordination (M05): invite against an approved protocol
 * version, screening, a HUMAN eligibility decision with a written reason,
 * consent, enrol, activate. Withdrawal is confirmed and states its
 * consequence honestly.
 *
 * The panel used to offer all four steps and the eligibility decision as
 * always-enabled buttons beside a box you typed an enrolment identifier
 * into, with no indication anywhere of what state that enrolment was in.
 * Only one of those buttons could ever succeed, and which one was
 * unknowable from the screen: pressing "Activate" on an invitation
 * produced a refusal that was correct and useless. Offering a control
 * that cannot work is the same defect as offering one that does nothing,
 * and it is the way people learn to treat refusals as ordinary.
 *
 * So the work is driven from the list, where the state lives. Each
 * enrolment offers exactly the step its state allows and says what that
 * step is; the rest of the chain is shown as text so the sequence stays
 * legible rather than disappearing.
 */
const CHAIN: { state: string; next: string; label: string; step: 'start-screening' | 'start-consent' | 'enrol' | 'activate' }[] = [
  { state: 'Invited', next: 'Screening', label: 'Start screening', step: 'start-screening' },
  { state: 'Eligible', next: 'Consenting', label: 'Start the consent conversation', step: 'start-consent' },
  { state: 'Consenting', next: 'Enrolled', label: 'Enrol', step: 'enrol' },
  { state: 'Enrolled', next: 'Active', label: 'Activate', step: 'activate' },
];

/** What each state means in words, so the list is readable by someone who
 *  does not already know the state machine. */
const STATE_WORDING: Record<string, string> = {
  Invited: 'invited — nothing has happened yet',
  Screening: 'being screened — waiting for an eligibility decision from a person',
  Eligible: 'found eligible — the consent conversation has not started',
  Consenting: 'in the consent conversation',
  Enrolled: 'enrolled — not yet taking part',
  Active: 'taking part',
  Discontinued: 'discontinued after being found not eligible',
  Withdrawn: 'withdrawn',
  Paused: 'paused',
};

export function StaffCoordinatorPanel({ session }: { session: StaffSession }) {
  const [invite, setInvite] = useState({ participantId: '', projectId: '', protocolVersionId: '' });
  const [eligibility, setEligibility] = useState<{ id: string; decision: 'Eligible' | 'Ineligible'; reason: string } | null>(
    null,
  );
  const [withdrawing, setWithdrawing] = useState<EnrolmentItem | null>(null);
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

  /**
   * Every action reloads the list. Without it the row keeps showing the
   * state it had before the step, and the next button to press is the one
   * that has just stopped being valid.
   */
  const run = async (fn: () => Promise<unknown>, done: string) => {
    try {
      await fn();
      setAnnouncement(done);
      if (enrolments !== null) await loadEnrolments();
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
              void run(
                () => staffApi.invite(session, invite.participantId, invite.projectId, invite.protocolVersionId),
                'Invitation created.',
              )
            }
          >
            Create invitation
          </button>
        </p>
      </section>

      {/*
        The supporter path had no way in at all: POST /v1/relationships had
        no caller anywhere in the product, so a coordinator could not bring
        a family member into a participant's study.
      */}
      <ProposeRelationship session={session} />

      <section aria-labelledby="list-heading">
        <h3 id="list-heading">Enrolments</h3>
        <p>
          Each enrolment shows where it has got to and offers the one step that comes next. The steps are in a fixed
          order and cannot be taken out of it, so anything not offered here is not being withheld — it is not this
          enrolment&apos;s turn for it.
        </p>
        <p>
          <label htmlFor="list-proj">Filter by project (optional)</label>{' '}
          <input id="list-proj" value={listProjectId} onChange={(e) => setListProjectId(e.target.value)} />{' '}
          <button onClick={() => void loadEnrolments()}>View enrolments</button>
        </p>
        {enrolments !== null && enrolments.length === 0 && <p>No enrolments match.</p>}
        {(enrolments ?? []).map((e) => {
          const stage = CHAIN.find((c) => c.state === e.enrolmentState);
          const decidable = e.enrolmentState === 'Screening';
          const withdrawable = !['Withdrawn', 'Discontinued'].includes(e.enrolmentState);
          return (
            <article key={e.enrolmentId} aria-label={`Enrolment ${e.enrolmentId}`}>
              <h4>{e.enrolmentId}</h4>
              <p>
                Participant {e.participantId}, project {e.researchProjectId}.
                <br />
                Where it has got to: <strong>{STATE_WORDING[e.enrolmentState] ?? e.enrolmentState}</strong>
              </p>

              {stage !== undefined && (
                <p>
                  <button onClick={() => void run(() => staffApi.enrolmentStep(session, e.enrolmentId, stage.step), `Done: ${stage.label}`)}>
                    {stage.label}
                  </button>{' '}
                  <small>This moves it to &ldquo;{stage.next}&rdquo;.</small>
                </p>
              )}

              {/*
                The one step in the chain that is not a step: a person
                decides this and it is recorded in their name. It is only
                offered while the enrolment is being screened, because that
                is the only state the command accepts it from.
              */}
              {decidable && (
                <div>
                  <p>
                    You make the eligibility decision and it is recorded in your name — it is not a score produced by
                    the system. A reason is required, and &ldquo;not eligible&rdquo; ends this enrolment.
                  </p>
                  <p>
                    <label htmlFor={`elig-dec-${e.enrolmentId}`}>Eligibility decision</label>
                    <select
                      id={`elig-dec-${e.enrolmentId}`}
                      value={eligibility?.id === e.enrolmentId ? eligibility.decision : 'Eligible'}
                      onChange={(ev) =>
                        setEligibility({
                          id: e.enrolmentId,
                          decision: ev.target.value as 'Eligible' | 'Ineligible',
                          reason: eligibility?.id === e.enrolmentId ? eligibility.reason : '',
                        })
                      }
                    >
                      <option value="Eligible">Eligible</option>
                      <option value="Ineligible">Not eligible</option>
                    </select>
                  </p>
                  <p>
                    <label htmlFor={`elig-why-${e.enrolmentId}`}>Reason (required)</label>
                    <input
                      id={`elig-why-${e.enrolmentId}`}
                      value={eligibility?.id === e.enrolmentId ? eligibility.reason : ''}
                      onChange={(ev) =>
                        setEligibility({
                          id: e.enrolmentId,
                          decision: eligibility?.id === e.enrolmentId ? eligibility.decision : 'Eligible',
                          reason: ev.target.value,
                        })
                      }
                    />
                  </p>
                  <p>
                    <button
                      disabled={eligibility?.id !== e.enrolmentId || eligibility.reason.trim() === ''}
                      onClick={() =>
                        void run(
                          () =>
                            staffApi.eligibilityDecision(
                              session,
                              e.enrolmentId,
                              eligibility!.decision,
                              eligibility!.reason.trim(),
                            ),
                          'Eligibility decision recorded in your name.',
                        )
                      }
                    >
                      Record eligibility decision
                    </button>
                  </p>
                </div>
              )}

              {/*
                M07 had one command and no query, no route and no screen:
                an intervention could be approved and put into use, and
                nobody could record that a participant had received it.
                Only offered once they are actually taking part — there is
                nothing to record against an invitation.
              */}
              {['Active', 'Paused'].includes(e.enrolmentState) && (
                <DeliveryRecord session={session} enrolmentId={e.enrolmentId} />
              )}

              {withdrawable && (
                <p>
                  <button onClick={() => setWithdrawing(e)}>Withdraw this participant</button>
                </p>
              )}
            </article>
          );
        })}
      </section>

      {withdrawing !== null && (
        <div role="alertdialog" aria-labelledby="wd-confirm">
          <p id="wd-confirm">
            Withdraw {withdrawing.participantId} from {withdrawing.researchProjectId}? Withdrawal stops further data
            collection and propagates to related records; research datasets that are already locked are not
            rewritten.
          </p>
          <button
            onClick={() => {
              const target = withdrawing;
              setWithdrawing(null);
              void run(
                () => staffApi.withdrawEnrolment(session, target.enrolmentId, 'participant-request'),
                'Withdrawal recorded and propagation started.',
              );
            }}
          >
            Confirm withdrawal
          </button>{' '}
          <button onClick={() => setWithdrawing(null)}>Back</button>
        </div>
      )}

      <p aria-live="polite" role="status">
        {announcement}
      </p>
    </section>
  );
}
