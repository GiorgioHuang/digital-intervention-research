import { useState } from 'react';
import { api, type Session } from '../api.js';
import { presentError, type PresentedError } from '../errors.js';
import { ErrorState } from './StateBlock.js';

/**
 * Granular consent (Doc 20 consent UX rules): one concept per choice, no
 * preselected options, decline as reachable as accept, withdrawal behind
 * an explicit confirmation step with a plain-language consequence summary.
 */
const SCOPES: { scope: string; label: string; description: string }[] = [
  {
    scope: 'study-participation',
    label: 'Take part in the research',
    description: 'Allow the research team to use my participation records in this study.',
  },
  {
    scope: 'community-participation',
    label: 'Join the community',
    description: 'Allow me to join moderated community spaces.',
  },
  {
    scope: 'open-matching',
    label: 'Open matching',
    description:
      'Allow the platform to suggest people I might meet, based on the interests I choose to share. Off by default.',
  },
  {
    scope: 'participant-messaging',
    label: 'Messaging',
    description: 'Allow me to exchange messages with people I am connected with.',
  },
];

export function ConsentPanel({ session }: { session: Session }) {
  const [status, setStatus] = useState<Record<string, string>>({});
  const [actionError, setActionError] = useState<PresentedError | null>(null);
  const [pendingWithdrawal, setPendingWithdrawal] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');

  const act = async (scope: string, fn: () => Promise<unknown>, done: string) => {
    try {
      await fn();
      setStatus((s) => ({ ...s, [scope]: done }));
      setAnnouncement(`${scope}: ${done}`);
    } catch (err) {
      setActionError(presentError(err));
      const msg = '';
      setStatus((s) => ({ ...s, [scope]: msg }));
      setAnnouncement(msg);
    }
  };

  return (
    <section aria-labelledby="consent-heading">
      <h2 id="consent-heading">My consent choices</h2>
      <p>
        Each choice here is separate. Declining any one of them does not affect the others, and does not affect your
        right to withdraw from the study.
      </p>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {SCOPES.map(({ scope, label, description }) => (
          <li key={scope} style={{ marginBlock: '1rem', border: '1px solid currentColor', padding: '1rem' }}>
            <h3>{label}</h3>
            <p>{description}</p>
            {/* No preselection: both actions are equal-weight buttons. */}
            <button onClick={() => act(scope, () => api.recordConsent(session, scope, 'Granted'), 'Granted')}>
              Grant "{label}"
            </button>{' '}
            <button onClick={() => act(scope, () => api.recordConsent(session, scope, 'Declined'), 'Declined')}>
              Decline "{label}"
            </button>{' '}
            <button onClick={() => setPendingWithdrawal(scope)}>Withdraw consent for "{label}"</button>
            {pendingWithdrawal === scope && (
              <div role="alertdialog" aria-labelledby={`wd-${scope}`} style={{ marginTop: '0.5rem' }}>
                <p id={`wd-${scope}`}>
                  After you withdraw, the platform stops using your information for this purpose. Research datasets
                  that are already locked are not rewritten, but no new data of yours is added to them.
                </p>
                <button
                  onClick={() => {
                    setPendingWithdrawal(null);
                    void act(scope, () => api.withdrawConsent(session, scope, true), 'Withdrawn');
                  }}
                >
                  Confirm withdrawal of "{label}"
                </button>{' '}
                <button onClick={() => setPendingWithdrawal(null)}>Go back without withdrawing</button>
              </div>
            )}
            {status[scope] !== undefined && <p aria-live="off">Status: {status[scope]}</p>}
          </li>
        ))}
      </ul>
      {actionError !== null && <ErrorState error={actionError} />}
      <p aria-live="polite" role="status">{announcement}</p>
    </section>
  );
}
