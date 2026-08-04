import { useState } from 'react';
import { staffActionError, staffLoadError } from '../errors.js';
import { staffApi, type ModerationCaseItem, type StaffSession } from '../staff-api.js';

type Decision = 'Dismiss' | 'Warn' | 'Restrict' | 'Hide' | 'Remove' | 'Suspend' | 'Disconnect' | 'Ban' | 'Restore' | 'Escalate';
const DECISION_LABELS: Record<Decision, string> = {
  Dismiss: 'Dismiss and close the case',
  Warn: 'Warn',
  Restrict: 'Restrict features',
  Hide: 'Hide content',
  Remove: 'Remove content',
  Suspend: 'Suspend account',
  Disconnect: 'Disconnect',
  Ban: 'Ban',
  Restore: 'Restore',
  Escalate: 'Escalate',
};

/**
 * Moderation workspace: cases come from the queue (the reporter's
 * identity is never in it — moderation judges content and behaviour, not
 * reporters). Every decision is a confirmed human act with a written
 * reason, attributed and immutable once recorded.
 */
export function StaffModeratorPanel({ session }: { session: StaffSession }) {
  const [queue, setQueue] = useState<ModerationCaseItem[] | null>(null);
  const [form, setForm] = useState({ caseId: '', decision: 'Warn' as Decision, reason: '' });
  const [confirming, setConfirming] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  const loadQueue = async () => {
    try {
      const res = await staffApi.listOpenModerationCases(session);
      setQueue(res.data.map((c) => c.attributes));
      setAnnouncement(
        res.data.length === 0
          ? 'There are no open cases.'
          : `${res.data.length} open ${res.data.length === 1 ? 'case' : 'cases'}.`,
      );
    } catch (err) {
      setAnnouncement(staffLoadError(err, 'the moderation queue'));
    }
  };

  const decide = async () => {
    setConfirming(false);
    try {
      await staffApi.recordModerationDecision(session, form.caseId, form.decision, form.reason);
      setQueue((q) => (q === null ? q : q.filter((c) => c.moderationCaseId !== form.caseId)));
      setAnnouncement('Decision recorded in your name. It cannot be changed.');
    } catch (err) {
      setAnnouncement(staffActionError(err, 'That moderation decision'));
    }
  };

  return (
    <section aria-labelledby="mod-heading">
      <h2 id="mod-heading">Moderation</h2>
      <p>
        The queue never shows who reported a case — moderation judges content and behaviour, not reporters. Every decision
        needs a written reason, and once recorded in your name it cannot be changed.
      </p>
      <p>
        <button onClick={() => void loadQueue()}>View open cases</button>
      </p>
      {queue !== null && queue.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {queue.map((c) => (
            <li key={c.moderationCaseId} style={{ border: '1px solid currentColor', padding: '0.5rem', marginBlock: '0.5rem' }}>
              <p>
                [{c.reportCategory ?? 'no report'}] {c.reportDescription ?? ''} (subject: {c.subjectActorId}, state:{' '}
                {c.caseState})
              </p>
              <button onClick={() => setForm((f) => ({ ...f, caseId: c.moderationCaseId }))}>Work on this case</button>
            </li>
          ))}
        </ul>
      )}
      <p>
        <label htmlFor="mod-case">Case identifier</label>{' '}
        <input id="mod-case" value={form.caseId} onChange={(e) => setForm({ ...form, caseId: e.target.value })} />
      </p>
      <p>
        <label htmlFor="mod-decision">Decision</label>{' '}
        <select
          id="mod-decision"
          value={form.decision}
          onChange={(e) => setForm({ ...form, decision: e.target.value as Decision })}
        >
          {(Object.keys(DECISION_LABELS) as Decision[]).map((d) => (
            <option key={d} value={d}>
              {DECISION_LABELS[d]}
            </option>
          ))}
        </select>
      </p>
      <p>
        <label htmlFor="mod-reason">Reason (required)</label>
      </p>
      <textarea id="mod-reason" rows={2} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
      <p>
        <button disabled={form.caseId === '' || form.reason === ''} onClick={() => setConfirming(true)}>
          Record decision
        </button>
      </p>
      {confirming && (
        <div role="alertdialog" aria-labelledby="mod-confirm">
          <p id="mod-confirm">
            Record the decision “{DECISION_LABELS[form.decision]}” for case {form.caseId}? It is written to the audit trail
            in your name and cannot be changed.
          </p>
          <button onClick={() => void decide()}>Confirm</button> <button onClick={() => setConfirming(false)}>Back</button>
        </div>
      )}
      <p aria-live="polite" role="status">
        {announcement}
      </p>
    </section>
  );
}
