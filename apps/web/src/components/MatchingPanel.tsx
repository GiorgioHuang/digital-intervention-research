import { useState } from 'react';
import { api, type MatchCandidateSummary, type Session } from '../api.js';
import { presentError, type PresentedError } from '../errors.js';
import { ErrorState } from './StateBlock.js';

type Decision = 'Interested' | 'Not Now' | 'Dismissed';
const DECISION_LABELS: Record<Decision, string> = {
  Interested: 'Interested',
  'Not Now': 'Not now',
  Dismissed: "Don't show this person again",
};

/**
 * Opt-in matching (Doc 20; ADR-036): matching is off by default and
 * requires the open-matching consent; each decision is independent and
 * private — choosing "Interested" alone notifies nobody; only when both
 * people independently choose it does a connection opportunity appear,
 * and the connection itself still needs an explicit confirmed step.
 * Candidates come from the API and show only the match explanation —
 * never the other person's identity before mutual acceptance.
 */
export function MatchingPanel({ session }: { session: Session }) {
  const [interests, setInterests] = useState('');
  const [actionError, setActionError] = useState<PresentedError | null>(null);
  const [candidates, setCandidates] = useState<MatchCandidateSummary[] | null>(null);
  const [pending, setPending] = useState<{ candidate: MatchCandidateSummary; decision: Decision } | null>(null);
  const [mutualAcceptanceId, setMutualAcceptanceId] = useState<string | null>(null);
  const [confirmingConnection, setConfirmingConnection] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  const run = async (fn: () => Promise<unknown>, done: string) => {
    try {
      await fn();
      setAnnouncement(done);
    } catch (err) {
      setActionError(presentError(err));
    }
  };

  const loadCandidates = async () => {
    try {
      const res = await api.listMatchCandidates(session);
      setCandidates(res.data.map((c) => c.attributes));
      setAnnouncement(
        res.data.length === 0
          ? 'There are no new suggestions right now. Having no suggestions is perfectly all right.'
          : 'The suggestions have been updated.',
      );
    } catch (err) {
      setActionError(presentError(err));
    }
  };

  const decide = async () => {
    if (pending === null) return;
    const { candidate, decision } = pending;
    setPending(null);
    try {
      const res = await api.matchDecision(session, candidate.candidateId, candidate.candidateVersion, decision, true);
      setCandidates((cs) => (cs === null ? cs : cs.filter((c) => c.candidateId !== candidate.candidateId)));
      const ma = res.data.meta.mutualAcceptanceId;
      if (ma !== undefined) {
        setMutualAcceptanceId(ma);
        setAnnouncement('You have both said you are interested. Whether to connect is still your decision.');
      } else {
        setAnnouncement(
          decision === 'Interested'
            ? 'Your interest has been recorded. The other person is not notified; only if they also say they are interested will the two of you see it.'
            : 'Your choice has been recorded. The other person is not notified at all.',
        );
      }
    } catch (err) {
      setActionError(presentError(err));
    }
  };

  return (
    <section aria-labelledby="matching-heading">
      <h2 id="matching-heading">Meet new people (optional)</h2>
      <p>
        Matching is off by default. Before it can be switched on, you need to grant "Open matching" under My consent
        choices. You can withdraw at any time, and that does not affect anything else.
      </p>

      <section aria-labelledby="optin-heading">
        <h3 id="optin-heading">Switch on matching</h3>
        <p>
          <label htmlFor="interests">Interests I am willing to use for matching (separated by commas)</label>
        </p>
        <textarea id="interests" rows={2} value={interests} onChange={(e) => setInterests(e.target.value)} />
        <p>
          <button
            onClick={() =>
              void run(
                () =>
                  api.activateMatching(
                    session,
                    { interests: interests.split(/[,，]/).map((s) => s.trim()).filter((s) => s !== '') },
                    true,
                  ),
                'Matching is now on. Only the interests you chose to share are used for suggestions.',
              )
            }
          >
            Switch on matching
          </button>
        </p>
      </section>

      <section aria-labelledby="candidate-heading">
        <h3 id="candidate-heading">Current suggestions</h3>
        <p>
          All three choices are equally valid. Choosing "Not now" does not affect later suggestions. The other person
          is not told what you chose.
        </p>
        <p>
          <button onClick={() => void loadCandidates()}>Show current suggestions</button>
        </p>
        {candidates !== null && (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {candidates.map((c) => (
              <li key={c.candidateId} style={{ border: '1px solid currentColor', padding: '1rem', marginBlock: '0.75rem' }}>
                {/* Explanation only — identity is never shown before mutual acceptance. */}
                <p>{c.explanation}</p>
                <p>
                  {(Object.keys(DECISION_LABELS) as Decision[]).map((d) => (
                    <span key={d}>
                      <button onClick={() => setPending({ candidate: c, decision: d })}>{DECISION_LABELS[d]}</button>{' '}
                    </span>
                  ))}
                </p>
              </li>
            ))}
          </ul>
        )}
        {pending !== null && (
          <div role="alertdialog" aria-labelledby="decision-confirm-heading">
            <p id="decision-confirm-heading">
              Choose "{DECISION_LABELS[pending.decision]}" for this suggestion (version{' '}
              {pending.candidate.candidateVersion})? The other person is not notified.
            </p>
            <blockquote>{pending.candidate.explanation}</blockquote>
            <button onClick={() => void decide()}>Confirm</button>{' '}
            <button onClick={() => setPending(null)}>Go back</button>
          </div>
        )}
      </section>

      {mutualAcceptanceId !== null && (
        <section aria-labelledby="mutual-heading">
          <h3 id="mutual-heading">You have both said you are interested</h3>
          <p>
            Whether to connect is still your decision. If you do not connect, the other person is not notified.
          </p>
          <button onClick={() => setConfirmingConnection(true)}>Connect</button>
          {confirmingConnection && (
            <div role="alertdialog" aria-labelledby="conn-confirm-heading">
              <p id="conn-confirm-heading">
                Connect with this person? Once you are connected, the two of you can exchange messages. You can block
                them or end the connection at any time.
              </p>
              <button
                onClick={() => {
                  setConfirmingConnection(false);
                  void run(
                    () => api.activateConnection(session, mutualAcceptanceId, true),
                    'You are now connected. You can write to each other under Messages.',
                  );
                }}
              >
                Confirm connection
              </button>{' '}
              <button onClick={() => setConfirmingConnection(false)}>Go back</button>
            </div>
          )}
        </section>
      )}

      {actionError !== null && <ErrorState error={actionError} />}
      <p aria-live="polite" role="status">
        {announcement}
      </p>
    </section>
  );
}
