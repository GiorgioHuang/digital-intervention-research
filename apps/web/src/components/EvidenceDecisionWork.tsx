import { useEffect, useState } from 'react';
import { staffActionError, staffLoadError } from '../errors.js';
import { staffApi, type EvidenceDecisionItem, type EvidenceReviewItem, type StaffSession } from '../staff-api.js';

/**
 * Drafting an evidence decision from a review.
 *
 * The outcome vocabulary is the platform's, not a set of verdicts
 * invented here: the database refuses anything outside it, and
 * "Approved", "Rejected" and "Provisional" are deliberately not outcomes.
 * An outcome answers what the evidence says; approval is a separate fact
 * about who agreed, and collapsing the two would let a decision read as
 * settled because somebody signed it.
 *
 * "Conflicting evidence" is a first-class outcome and reads like one. It
 * is what an honest reading often produces, and a vocabulary that offered
 * only support or refusal would push whoever writes the decision into
 * overstating one side (Doc 20 §60).
 */
const OUTCOMES: { value: string; label: string; detail: string }[] = [
  { value: 'Support', label: 'The evidence supports this', detail: 'What was found points the same way.' },
  {
    value: 'Support with Conditions',
    label: 'Supported, but only under stated conditions',
    detail: 'The conditions belong in the reasoning below, not left implied.',
  },
  {
    value: 'Conflicting Evidence',
    label: 'The evidence conflicts',
    detail: 'Sources disagree. This is a finding in its own right, not a failure to reach one.',
  },
  {
    value: 'Insufficient Evidence',
    label: 'There is not enough evidence either way',
    detail: 'Different from conflicting: little was found, rather than found and disagreeing.',
  },
  { value: 'Research Required', label: 'This needs its own research first', detail: 'Nothing existing answers it.' },
  { value: 'Restrict', label: 'Restrict this', detail: 'The evidence points against doing it as proposed.' },
  { value: 'Do Not Proceed', label: 'Do not proceed', detail: 'The evidence points against doing it at all.' },
];

const APPROVAL_WORDING: Record<string, string> = {
  Draft: 'Written. Waiting for someone else.',
  'In Review': 'Being looked at.',
  Approved: 'Agreed by a second person.',
  'Approved with Conditions': 'Agreed with conditions.',
  Rejected: 'Not agreed.',
  Superseded: 'Replaced by a later decision.',
  Withdrawn: 'Withdrawn.',
  Archived: 'Archived.',
};

export function EvidenceDecisionWork({ session }: { session: StaffSession }) {
  const [decisions, setDecisions] = useState<EvidenceDecisionItem[] | null>(null);
  const [reviews, setReviews] = useState<EvidenceReviewItem[] | null>(null);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [form, setForm] = useState({ reviewId: '', outcome: 'Support', rationale: '' });

  const load = async () => {
    try {
      const [d, r] = await Promise.all([staffApi.listDecisionWork(session), staffApi.listEvidenceWork(session)]);
      setDecisions(d.data.map((i) => i.attributes));
      setReviews(r.data.map((i) => i.attributes));
      setLoadError('');
    } catch (err) {
      setLoadError(staffLoadError(err, 'the evidence decisions'));
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const run = async (fn: () => Promise<unknown>, said: string) => {
    try {
      await fn();
      setActionError('');
      setAnnouncement(said);
      await load();
    } catch (err) {
      setActionError(staffActionError(err, 'That step'));
    }
  };

  const chosen = (reviews ?? []).find((r) => r.evidenceReviewId === form.reviewId);
  const detail = OUTCOMES.find((o) => o.value === form.outcome)?.detail ?? '';

  return (
    <section aria-labelledby="evidence-decision-heading">
      <h3 id="evidence-decision-heading">Evidence decisions</h3>

      <h4>Write a decision</h4>
      <p>
        <label htmlFor="ed-review">The review this is drawn from</label>{' '}
        <select id="ed-review" value={form.reviewId} onChange={(e) => setForm({ ...form, reviewId: e.target.value })}>
          <option value="">Choose a review</option>
          {(reviews ?? []).map((r) => (
            <option key={r.evidenceReviewId} value={r.evidenceReviewId}>
              {r.question}
            </option>
          ))}
        </select>
      </p>
      {chosen !== undefined && chosen.reviewState !== 'Approved' && (
        // Stated, not blocked: the server permits this, and a control that
        // silently narrowed it would be the screen inventing a rule.
        <p role="alert">
          This review has not been approved. A decision drawn from it rests on evidence nobody else has checked.
        </p>
      )}
      <p>
        <label htmlFor="ed-outcome">What the evidence says</label>{' '}
        <select id="ed-outcome" value={form.outcome} onChange={(e) => setForm({ ...form, outcome: e.target.value })}>
          {OUTCOMES.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </p>
      <p>{detail}</p>
      <p>
        <label htmlFor="ed-rationale">Why — the reasoning, in full</label>
      </p>
      <textarea
        id="ed-rationale"
        rows={4}
        value={form.rationale}
        onChange={(e) => setForm({ ...form, rationale: e.target.value })}
      />
      <p>
        You cannot approve what you write. A decision needs a second person, and approving it writes an unchangeable
        snapshot of exactly these words.
      </p>
      <p>
        <button
          disabled={form.reviewId === '' || form.rationale === ''}
          onClick={() =>
            void run(
              () => staffApi.draftEvidenceDecision(session, form.reviewId, form.outcome, form.rationale),
              'Decision written. Someone else has to agree it before it counts for anything.',
            )
          }
        >
          Write this decision
        </button>
      </p>

      <h4>Decisions</h4>
      <p>
        <button onClick={() => void load()}>Refresh</button>
      </p>
      {loadError !== '' && <p role="alert">{loadError}</p>}
      {decisions !== null && decisions.length === 0 && <p>No evidence decision has been written yet.</p>}

      {(decisions ?? []).map((d) => (
        <article key={d.evidenceDecisionId} aria-label={`Decision ${d.evidenceDecisionId}`}>
          <p>
            <strong>{OUTCOMES.find((o) => o.value === d.outcome)?.label ?? d.outcome}</strong> — {d.question}
          </p>
          <p>{APPROVAL_WORDING[d.approvalState] ?? d.approvalState}</p>
          <blockquote>{d.rationale}</blockquote>
          {d.snapshotContentHash !== null && (
            <p>
              Snapshot: <code>{d.snapshotContentHash}</code>
            </p>
          )}
        </article>
      ))}

      {actionError !== '' && <p role="alert">{actionError}</p>}
      <p aria-live="polite" role="status">
        {announcement}
      </p>
    </section>
  );
}
