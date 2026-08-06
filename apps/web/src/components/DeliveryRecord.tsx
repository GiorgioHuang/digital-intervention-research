import { useEffect, useState } from 'react';
import { staffActionError, staffLoadError } from '../errors.js';
import {
  staffApi,
  type InterventionConfigurationItem,
  type InterventionSessionItem,
  type StaffSession,
} from '../staff-api.js';

/**
 * What a participant actually received, written down by the person who
 * was there.
 *
 * M07 held one command and nothing else: no query, no route, no screen.
 * An intervention could be drafted, approved and put into use, and
 * nobody could record that a participant had ever received it — or read
 * back what had been recorded. On a platform whose whole subject is
 * delivering digital interventions to older people, delivery was the
 * part with no way in.
 *
 * The wording carries one distinction that the design states outright
 * (Doc 2) and that a screen can quietly destroy: this records ACTUAL
 * exposure, not intended exposure, and delivery is not effectiveness.
 * "Completed" means the session ran to the end, not that it worked. A
 * screen that let those two read as one would turn a delivery log into
 * an outcome claim, and a study would be reported on it.
 *
 * `session_state` is not shown and is not written by anything: it
 * defaults to 'Completed', so every row in the database claims
 * completion regardless of what its exposure says. Printing it would
 * contradict the exposure on the same line.
 */
const EXPOSURE: { value: string; label: string; detail: string }[] = [
  { value: 'Offered', label: 'Offered', detail: 'It was put in front of them. Nothing more is claimed.' },
  { value: 'Viewed', label: 'Viewed', detail: 'They looked at it. Whether they took anything from it is not recorded.' },
  { value: 'Started', label: 'Started', detail: 'They began it.' },
  { value: 'Partially Received', label: 'Partly received', detail: 'Some of it reached them and some did not.' },
  { value: 'Completed', label: 'Completed', detail: 'It ran to the end. This says nothing about whether it helped.' },
  { value: 'Skipped', label: 'Skipped', detail: 'It was passed over. Not the same as declining it.' },
  { value: 'Declined', label: 'Declined', detail: 'They said no to it. That is their decision and is recorded as theirs.' },
  { value: 'Failed', label: 'Failed', detail: 'It did not work — a fault on our side, not theirs.' },
  { value: 'Interrupted', label: 'Interrupted', detail: 'It started and was cut short.' },
];

const EXPOSURE_WORDING: Record<string, string> = Object.fromEntries(EXPOSURE.map((e) => [e.value, e.label]));

export function DeliveryRecord({ session, enrolmentId }: { session: StaffSession; enrolmentId: string }) {
  const [configurations, setConfigurations] = useState<InterventionConfigurationItem[] | null>(null);
  const [sessions, setSessions] = useState<InterventionSessionItem[] | null>(null);
  const [error, setError] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [draft, setDraft] = useState({ interventionConfigurationId: '', exposureState: '' });

  const load = async () => {
    try {
      const [c, s] = await Promise.all([
        staffApi.listInterventionConfigurations(session),
        staffApi.listInterventionSessions(session, enrolmentId),
      ]);
      setConfigurations(c.data.map((x) => x.attributes));
      setSessions(s.data.map((x) => x.attributes));
      setError('');
    } catch (err) {
      setError(staffLoadError(err, 'what has been delivered'));
    }
  };

  useEffect(() => {
    void load();
  }, [enrolmentId]);

  const record = async () => {
    try {
      await staffApi.recordInterventionSession(
        session,
        enrolmentId,
        draft.interventionConfigurationId,
        draft.exposureState,
      );
      setDraft({ interventionConfigurationId: '', exposureState: '' });
      setAnnouncement('Recorded in your name. It says what happened, not that it worked.');
      await load();
    } catch (err) {
      setAnnouncement(staffActionError(err, 'That session'));
    }
  };

  const chosen = EXPOSURE.find((e) => e.value === draft.exposureState);

  return (
    <section aria-labelledby={`delivery-${enrolmentId}`}>
      <h5 id={`delivery-${enrolmentId}`}>What this participant has actually received</h5>
      {/*
        Said before the list and before the control, because it is the
        one thing a delivery log is routinely misread as.
      */}
      <p>
        <small>
          This is a record of what happened, written by whoever was there. It is not a claim that anything worked —
          &ldquo;completed&rdquo; means the session ran to the end and nothing more. The platform delivers nothing on
          its own and observes nothing on its own.
        </small>
      </p>
      {error !== '' && <p role="alert">{error}</p>}

      {sessions !== null && sessions.length === 0 && (
        <p>Nothing has been recorded for this enrolment. That is not the same as nothing having happened.</p>
      )}
      {(sessions ?? []).length > 0 && (
        <ol>
          {(sessions ?? []).map((s) => (
            <li key={s.interventionSessionId}>
              <strong>{EXPOSURE_WORDING[s.exposureState] ?? s.exposureState}</strong> ·{' '}
              <time dateTime={s.occurredAt}>{new Date(s.occurredAt).toLocaleString()}</time>
              <br />
              <small>
                Recorded by {s.deliveredByActorId}, against configuration {s.interventionConfigurationId}
              </small>
            </li>
          ))}
        </ol>
      )}

      {configurations !== null && configurations.length === 0 ? (
        <p>
          There is nothing to record against: no intervention has been configured for a project yet. A session has to
          name the exact configuration a participant was exposed to, so that comes first.
        </p>
      ) : (
        <>
          <p>
            <label htmlFor={`cfg-${enrolmentId}`}>Which configuration they were exposed to</label>{' '}
            <select
              id={`cfg-${enrolmentId}`}
              value={draft.interventionConfigurationId}
              onChange={(e) => setDraft({ ...draft, interventionConfigurationId: e.target.value })}
            >
              <option value="">Choose…</option>
              {(configurations ?? []).map((c) => (
                <option key={c.interventionConfigurationId} value={c.interventionConfigurationId}>
                  {c.interventionCode} v{c.versionNumber} — project {c.researchProjectId}
                </option>
              ))}
            </select>
          </p>
          <p>
            <label htmlFor={`exp-${enrolmentId}`}>What actually happened</label>{' '}
            <select
              id={`exp-${enrolmentId}`}
              value={draft.exposureState}
              onChange={(e) => setDraft({ ...draft, exposureState: e.target.value })}
            >
              <option value="">Choose…</option>
              {EXPOSURE.map((e) => (
                <option key={e.value} value={e.value}>
                  {e.label}
                </option>
              ))}
            </select>
          </p>
          {chosen !== undefined && (
            <p>
              <small>{chosen.detail}</small>
            </p>
          )}
          <p>
            <button
              disabled={draft.interventionConfigurationId === '' || draft.exposureState === ''}
              onClick={() => void record()}
            >
              Record this
            </button>
          </p>
        </>
      )}
      <p aria-live="polite" role="status">
        {announcement}
      </p>
    </section>
  );
}
