import { useState } from 'react';
import { staffActionError, staffLoadError } from '../errors.js';
import { staffApi, type StaffSession, type TriageQueueItem } from '../staff-api.js';

type Disposition = 'Closed as Not a Safety Event' | 'Escalated' | 'Converted to Safety Event';
const DISPOSITIONS: { value: Disposition; label: string }[] = [
  { value: 'Closed as Not a Safety Event', label: 'Close as not a safety event' },
  { value: 'Escalated', label: 'Escalate for higher-level review' },
  { value: 'Converted to Safety Event', label: 'Convert to a safety event (needs strong authentication)' },
];

/**
 * Safety triage (ADR-039): dispositions are confirmed human work with a
 * written reason; conversion to a SafetyEvent is the strongest authority
 * (MFA) and the UI says so up front instead of failing late.
 */
export function StaffSafetyTriagePanel({ session }: { session: StaffSession }) {
  const [form, setForm] = useState({ signalId: '', disposition: DISPOSITIONS[0]!.value as Disposition, reason: '' });
  const [confirming, setConfirming] = useState(false);
  const [queue, setQueue] = useState<TriageQueueItem[] | null>(null);
  const [announcement, setAnnouncement] = useState('');

  const loadQueue = async () => {
    try {
      const res = await staffApi.listPendingTriage(session);
      setQueue(res.data.map((i) => i.attributes));
      setAnnouncement(
        res.data.length === 0
          ? 'There are no signals waiting for triage.'
          : `${res.data.length} ${res.data.length === 1 ? 'signal' : 'signals'} waiting for triage.`,
      );
    } catch (err) {
      setAnnouncement(staffLoadError(err, 'the triage queue'));
    }
  };

  const conversionWithoutMfa = form.disposition === 'Converted to Safety Event' && session.authStrength !== 'mfa';

  const submit = async () => {
    setConfirming(false);
    try {
      const res = await staffApi.triageSignal(session, form.signalId, form.disposition, form.reason);
      const eventId = res.data.meta.safetyEventId;
      setAnnouncement(
        eventId === undefined ? 'Disposition recorded.' : `Disposition recorded, safety event created: ${eventId}`,
      );
    } catch (err) {
      setAnnouncement(staffActionError(err, 'That triage decision'));
    }
  };

  return (
    <section aria-labelledby="triage-heading">
      <h2 id="triage-heading">Safety triage</h2>
      <p>
        The disposition is a human responsibility: an automated system can only raise a signal and can never create a safety
        event. Every disposition needs a written reason.
      </p>
      <p>
        <button onClick={() => void loadQueue()}>View signals waiting for triage</button>
      </p>
      {queue !== null && queue.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {queue.map((i) => (
            <li key={i.signalId} style={{ border: '1px solid currentColor', padding: '0.5rem', marginBlock: '0.5rem' }}>
              <p>
                [{i.severity}] {i.category} — {i.description} (source: {i.sourceType}, state: {i.signalState})
              </p>
              <button onClick={() => setForm((f) => ({ ...f, signalId: i.signalId }))}>Work on this signal</button>
            </li>
          ))}
        </ul>
      )}
      <p>
        <label htmlFor="triage-signal">Signal identifier</label>{' '}
        <input id="triage-signal" value={form.signalId} onChange={(e) => setForm({ ...form, signalId: e.target.value })} />
      </p>
      <p>
        <label htmlFor="triage-disposition">Disposition</label>{' '}
        <select
          id="triage-disposition"
          value={form.disposition}
          onChange={(e) => setForm({ ...form, disposition: e.target.value as Disposition })}
        >
          {DISPOSITIONS.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
      </p>
      {conversionWithoutMfa && (
        <p role="note">
          Converting a signal to a safety event needs strong authentication. You are signed in at password level, so the
          server will refuse this submission — that is expected.
        </p>
      )}
      <p>
        <label htmlFor="triage-reason">Reason (required)</label>
      </p>
      <textarea
        id="triage-reason"
        rows={2}
        value={form.reason}
        onChange={(e) => setForm({ ...form, reason: e.target.value })}
      />
      <p>
        <button disabled={form.signalId === '' || form.reason === ''} onClick={() => setConfirming(true)}>
          Submit disposition
        </button>
      </p>
      {confirming && (
        <div role="alertdialog" aria-labelledby="triage-confirm">
          <p id="triage-confirm">
            Record the disposition “{DISPOSITIONS.find((d) => d.value === form.disposition)?.label}” for signal{' '}
            {form.signalId}?
          </p>
          <button onClick={() => void submit()}>Confirm</button> <button onClick={() => setConfirming(false)}>Back</button>
        </div>
      )}
      <p aria-live="polite" role="status">
        {announcement}
      </p>
    </section>
  );
}
