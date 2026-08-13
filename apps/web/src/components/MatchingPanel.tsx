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
  /*
   * `matching.activate` is in the permission engine's confirmation tier
   * and this was a single click, with `confirmed: true` supplied by the
   * api client. Deciding on a candidate and connecting both asked; the
   * step that puts somebody into the pool in the first place did not.
   */
  const [confirmingMatching, setConfirmingMatching] = useState(false);
  const [confirmingStop, setConfirmingStop] = useState(false);
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
          <button onClick={() => setConfirmingMatching(true)}>Switch on matching</button>
        </p>
        {confirmingMatching && (
          <div role="alertdialog" aria-labelledby="matching-confirm-heading">
            <h4 id="matching-confirm-heading">Switch matching on?</h4>
            <p>
              You will start being suggested to other people who have also switched it on, and they will start being
              suggested to you. Nobody is told anything about you beyond the interests you typed here.
            </p>
            <p>
              What you shared: {interests.trim() === '' ? 'no interests — you can add some later' : interests.trim()}
            </p>
            {/*
              This sentence could not be written until there was a way
              out: activateMatchPreference inserted an Active row and
              nothing set that column to anything else, so matching was a
              one-way door and a reassurance here would have been a
              promise the platform did not keep.
            */}
            <p>
              You can switch it off again whenever you want. Nothing you have already done is undone by that — any
              conversation you are already in stays as it is.
            </p>
            <p>
              <button
                onClick={() => {
                  setConfirmingMatching(false);
                  void run(
                    () =>
                      api.activateMatching(
                        session,
                        { interests: interests.split(/[,，]/).map((s) => s.trim()).filter((s) => s !== '') },
                        true,
                      ),
                    'Matching is now on. Only the interests you chose to share are used for suggestions.',
                  );
                }}
              >
                Yes, switch it on
              </button>{' '}
              <button onClick={() => setConfirmingMatching(false)}>Go back</button>
            </p>
          </div>
        )}

        {/*
          The exit. Offered without first reading the current state,
          because there is no query for it and the command is the same
          answer either way — asking to leave something you were not in
          should leave you out of it, not produce a correction. What
          actually changed is reported back rather than assumed.
        */}
        <p>
          <button onClick={() => setConfirmingStop(true)}>Switch off matching</button>
        </p>
        {confirmingStop && (
          <div role="alertdialog" aria-labelledby="matching-stop-heading">
            <h4 id="matching-stop-heading">Switch matching off?</h4>
            <p>
              You stop being suggested to anyone and nobody new is suggested to you. Nobody is told that you have done
              this.
            </p>
            <p>
              Conversations you are already in are not affected, and nothing you have already said or done is removed.
              If you want a particular conversation to end, that is the separate step under Messages.
            </p>
            <p>You can switch it back on later.</p>
            <p>
              <button
                onClick={() => {
                  setConfirmingStop(false);
                  void (async () => {
                    try {
                      const res = await api.deactivateMatching(session, true);
                      setActionError(null);
                      setAnnouncement(
                        res.data.meta.changed
                          ? 'Matching is off. You are not being suggested to anyone.'
                          : 'Matching was already off. You are not being suggested to anyone.',
                      );
                    } catch (err) {
                      setActionError(presentError(err));
                    }
                  })();
                }}
              >
                Yes, switch it off
              </button>{' '}
              <button onClick={() => setConfirmingStop(false)}>Go back</button>
            </p>
          </div>
        )}
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
          <ul className="list-plain">
            {candidates.map((c) => (
              <li key={c.candidateId} className="card card--matching">
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

      {/*
        Matching is blue because it is still a question; this block is the
        primary teal because the answer has arrived. They are two different
        facts on one path, so they must not share a colour — "we both said
        yes" reading like "here is another suggestion" is the one confusion
        this screen cannot afford.
      */}
      {mutualAcceptanceId !== null && (
        <section className="state state--connection" aria-labelledby="mutual-heading">
          <h3 id="mutual-heading" className="state__head">You have both said you are interested</h3>
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
