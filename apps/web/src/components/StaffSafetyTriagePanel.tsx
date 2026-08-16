import { useState } from 'react';
import { SafetyEvents } from './SafetyEvents.js';
import { staffActionError, staffLoadError } from '../errors.js';
import { staffApi, type StaffSession, type TriageQueueItem } from '../staff-api.js';

type Disposition = 'Closed as Not a Safety Event' | 'Escalated' | 'Converted to Safety Event';

/**
 * The three dispositions the platform can actually record.
 *
 * Order matters and this one is deliberate: closing is no longer first.
 * These were a `<select>`, and a select has a value from the moment it
 * renders — so "Close as not a safety event" was the standing answer on
 * every signal a reviewer opened. That is a triage conclusion nobody
 * reached, on the screen where the conclusion matters most, and it broke
 * both "nothing is pre-selected" and "closing and converting carry equal
 * weight" at once (C-2). They are radios now, with nothing selected until
 * a person selects it.
 */
const DISPOSITIONS: { value: Disposition; label: string; note: string }[] = [
  {
    value: 'Escalated',
    label: 'Escalate for higher-level review',
    note: 'Someone more senior looks at it. It stays open.',
  },
  {
    value: 'Converted to Safety Event',
    label: 'Convert to a safety event',
    note: 'Needs strong authentication. This is the only way a safety event comes into being — no automated system can create one (ADR-039).',
  },
  {
    value: 'Closed as Not a Safety Event',
    label: 'Close as not a safety event',
    note: 'Your judgement that this is not one. It does not mean the person is safe.',
  },
];

/**
 * Safety triage (ADR-039): dispositions are confirmed human work with a
 * written reason; conversion to a SafetyEvent is the strongest authority
 * (MFA) and the UI says so up front instead of failing late.
 */
export function StaffSafetyTriagePanel({ session }: { session: StaffSession }) {
  // Null, not a default. Nothing is chosen until a person chooses it.
  const [form, setForm] = useState<{ signalId: string; disposition: Disposition | null; reason: string }>({
    signalId: '',
    disposition: null,
    reason: '',
  });
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
    if (form.disposition === null) return;
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
        <ul className="list-plain">
          {queue.map((i) => (
            <li key={i.signalId} className="card">
              <p>
                [{i.severity}] {i.category} — {i.description} (source: {i.sourceType}, state: {i.signalState})
              </p>
              <button onClick={() => setForm((f) => ({ ...f, signalId: i.signalId }))}>Work on this signal</button>
            </li>
          ))}
        </ul>
      )}
      {/*
        Chosen from the queue, not typed.
        The identifier was a free text field, which is the shape D-13 and
        D-24 both ruled against — an identifier named in the request is not
        an authority, and a field that accepts any string invites triaging a
        signal nobody opened. It also made the queue decorative: a reviewer
        could type past it entirely, which is how a disposition gets
        recorded against a signal whose description was never read.

        The identifier is now a fact on the screen rather than an input.
        Nothing is lost: the queue is the only place a signal for triage
        comes from, and the server decides the outcome either way.
      */}
      {form.signalId === '' ? (
        <p role="note">
          Choose a signal from the queue above to work on. Reading it is the first step of triaging it, so it is not
          something to type past.
        </p>
      ) : (
        <p>
          Working on signal: <strong>{form.signalId}</strong>{' '}
          <button onClick={() => setForm({ signalId: '', disposition: null, reason: '' })}>
            Choose a different signal
          </button>
        </p>
      )}
      <fieldset>
        <legend>Disposition</legend>
        <p>Nothing is chosen until you choose it. These carry equal weight — closing is a decision like any other.</p>
        {DISPOSITIONS.map((d) => (
          <p key={d.value}>
            <input
              type="radio"
              id={`triage-${d.value.replace(/\s+/g, '-')}`}
              name="triage-disposition"
              value={d.value}
              checked={form.disposition === d.value}
              onChange={() => setForm({ ...form, disposition: d.value })}
            />{' '}
            <label htmlFor={`triage-${d.value.replace(/\s+/g, '-')}`}>{d.label}</label>
            <br />
            <span>{d.note}</span>
          </p>
        ))}
        {/*
          Doc 20 §196 describes a fourth disposition — keep watching — and
          it is not here, because `safety.safety_signals.signal_state` has
          no value for it: the CHECK admits Recorded, Awaiting Triage, In
          Review, Escalated, Converted and Closed, and nothing else. A
          "keep watching" button would close the reviewer's screen, report
          success, and record nothing at all — the empty control this
          project keeps dismantling. Naming it is the honest half: a
          reviewer who wants to watch a signal needs to know the platform
          cannot, rather than assume this screen hid it.
        */}
        <p role="note">
          There is no “keep watching” here. Doc 20 describes one, and the platform has nowhere to record it — a signal can
          only be escalated, converted or closed. If watching is what this needs, escalate it and say so in the reason;
          do not close it.
        </p>
      </fieldset>
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
        <button
          disabled={form.signalId === '' || form.reason === '' || form.disposition === null}
          onClick={() => setConfirming(true)}
        >
          Submit disposition
        </button>
      </p>
      {confirming && form.disposition !== null && (
        <div role="alertdialog" aria-labelledby="triage-confirm">
          <p id="triage-confirm">
            Record the disposition “{DISPOSITIONS.find((d) => d.value === form.disposition)?.label}” for signal{' '}
            {form.signalId}?
          </p>
          {form.disposition === 'Closed as Not a Safety Event' && (
            <p>Closing records your judgement that this is not a safety event. It does not mean the person is safe.</p>
          )}
          {/*
            The button used to say "Confirm", which names nothing: read
            aloud out of context it could be confirming anything on any
            screen, and this is the screen where what is being confirmed
            matters most (C-3).
          */}
          <button onClick={() => void submit()}>Confirm and record the disposition</button>{' '}
          <button onClick={() => setConfirming(false)}>Back, do not record it</button>
        </div>
      )}
      <p aria-live="polite" role="status">
        {announcement}
      </p>
      {/*
        Converting a signal said "converted to a safety event" and the
        event then went where nobody could look. The events belong on the
        same screen as the triage that creates them.
      */}
      <SafetyEvents session={session} />
    </section>
  );
}
