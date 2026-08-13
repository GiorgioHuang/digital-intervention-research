import { useEffect, useState } from 'react';
import { api, type ConsentState, type Session } from '../api.js';
import { presentError, type PresentedError } from '../errors.js';
import { ErrorState, LoadingState } from './StateBlock.js';

/**
 * Granular consent (Doc 20 consent UX rules): one concept per choice, no
 * preselected options, decline as reachable as accept, withdrawal behind
 * an explicit confirmation step with a plain-language consequence summary.
 *
 * These are the scopes this platform actually enforces — every one of them
 * appears in `packages/policy/src/catalogue.ts` as a `consentScopes`
 * requirement on at least one action, so granting or withdrawing it
 * changes what the server permits. Decision D-2 asks for the full list of
 * 22 from Doc 20 §97; that cannot be shown honestly until each of those
 * scopes gates something, because a control that records a decision no
 * check ever reads is not a control — it is a claim of protection the
 * platform does not provide. See D-2's note in DESIGN_DECISIONS.
 */
const SCOPES: { scope: string; label: string; description: string; governs: string }[] = [
  {
    scope: 'study-participation',
    label: 'Take part in the research',
    description: 'Allow the research team to use my participation records in this study.',
    governs: 'Enrolment, and any researcher or coordinator access to your records.',
  },
  {
    scope: 'community-participation',
    label: 'Join the community',
    description: 'Allow me to join moderated community spaces.',
    governs: 'Joining a community space. Without it, joining is refused.',
  },
  {
    scope: 'open-matching',
    label: 'Open matching',
    description:
      'Allow the platform to suggest people I might meet, based on the interests I choose to share. Off by default.',
    governs: 'Being put forward as a possible match. Without it, no one is suggested to you and you are not suggested to anyone.',
  },
  {
    scope: 'participant-messaging',
    label: 'Messaging',
    description: 'Allow me to exchange messages with people I am connected with.',
    governs: 'Sending a message. Without it, sending is refused.',
  },
  {
    scope: 'supporter-involvement',
    label: 'Let a supporter see what I share with them',
    description:
      'Allow someone I have approved as a supporter — a family member or friend — to see the parts of my information that the supporter relationship covers.',
    governs: 'What an approved supporter can read. Withdrawing it stops that access, even while the relationship stands.',
  },
  {
    scope: 'supporter-contribution',
    label: 'Let a supporter add to my life story',
    description:
      'Allow an approved supporter to contribute to my life story. What they write is their account, not mine, and is always shown as theirs.',
    governs: 'Whether a supporter may add a contribution at all.',
  },
];

/** Human wording for the state the server actually holds. */
const DECISION_LABELS: Record<string, string> = {
  Granted: 'Granted',
  Declined: 'Declined',
  Withdrawn: 'Withdrawn',
  Restricted: 'Granted with limits',
  Deferred: 'Not decided yet',
  ReConsentRequired: 'Waiting for you to agree again',
  Superseded: 'Replaced by a later decision',
};

/**
 * The consent text version a decision is recorded under.
 *
 * It was hardcoded to 'ct_v1' at the API client, which was harmless while
 * nothing could ever change a consent text and became wrong the moment
 * something could: a participant asked to agree to a revised wording
 * would have been recorded as agreeing to the old one — the exact fact
 * the demand existed to establish. The platform has no template registry,
 * so a scope with no decision yet still falls back to 'ct_v1'.
 */
const versionShown = (state: ConsentState | undefined): string => state?.templateVersion ?? 'ct_v1';

export function ConsentPanel({ session, assistedBy }: { session: Session; assistedBy?: string | null }) {
  const [current, setCurrent] = useState<Record<string, ConsentState> | null>(null);
  const [loadError, setLoadError] = useState<PresentedError | null>(null);
  const [actionError, setActionError] = useState<PresentedError | null>(null);
  const [pendingWithdrawal, setPendingWithdrawal] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');

  /**
   * The current position comes from the server, not from what was pressed
   * in this session: a participant returning to this screen has to be able
   * to see what they have agreed to, and the answer must be the one the
   * permission engine enforces.
   */
  const load = async () => {
    try {
      const res = await api.listMyConsents(session);
      setCurrent(Object.fromEntries(res.data.map((d) => [d.attributes.scope, d.attributes])));
      setLoadError(null);
    } catch (err) {
      setLoadError(presentError(err));
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const act = async (scope: string, fn: () => Promise<unknown>, done: string) => {
    try {
      await fn();
      setActionError(null);
      setAnnouncement(done);
      // Re-read rather than assume: the recorded state is the server's.
      await load();
    } catch (err) {
      setActionError(presentError(err));
      setAnnouncement('');
    }
  };

  return (
    <section aria-labelledby="consent-heading">
      <h1 id="consent-heading">My consent choices</h1>
      <p>
        Each choice here is separate. Declining any one of them does not affect the others, and does not affect your
        right to withdraw from the study.
      </p>
      <p>
        These are the choices this platform acts on. Each one changes what the server allows, so a choice you make here
        takes effect rather than only being noted.
      </p>
      {/*
        Said before any of the choices, not beside each button. The
        platform already marked a chat message sent while somebody was
        helping and recorded nothing about whether anybody was present for
        this — the one decision where it matters most. Now that it does,
        the participant is told, because a fact recorded about them that
        they did not know was being recorded is not a safeguard.
      */}
      {assistedBy != null && (
        <p role="note">
          <strong>{assistedBy} is helping you right now, and your choices below will be recorded as made with
          somebody helping.</strong> Their name is not recorded — only that someone was here. This does not make your
          choice count for less; it is written down so that nobody has to guess about it later.
        </p>
      )}

      {current === null && loadError === null && <LoadingState label="Loading your current choices…" />}
      {loadError !== null && <ErrorState error={loadError} />}

      <ul className="list-plain">
        {SCOPES.map(({ scope, label, description, governs }) => {
          const state = current?.[scope];
          return (
            <li key={scope} className="card">
              <h2>{label}</h2>
              <p>{description}</p>
              <p>
                <strong>What this controls:</strong> {governs}
              </p>
              {/*
                The consent tables have permitted 'ReConsentRequired' since
                they were written, the permission engine reads it and stops
                everything the scope gates, and nothing could ever set it —
                so a consent text could be revised and every participant
                carried on under an agreement to wording that no longer
                existed, while this screen said "Granted" at them.
                Now that it can happen, it is said at the top of the entry
                and in the present tense: this has already stopped, it is
                not about to.
              */}
              {state?.decision === 'ReConsentRequired' && (
                <div role="note" className="state state--warning">
                  <p>
                    <strong>The wording of this changed, so your agreement to it no longer stands.</strong> Until you
                    agree to the new wording, {governs.charAt(0).toLowerCase() + governs.slice(1)} — that has already
                    stopped, not in a while.
                  </p>
                  <p>
                    <strong>What changed:</strong> {state.decisionNote ?? 'Nobody wrote down what changed.'}
                  </p>
                  <p>
                    You do not have to agree. Declining leaves things stopped and takes nothing else away — not your
                    other choices, and not your place in the study.
                  </p>
                </div>
              )}
              {/*
                Stated as a fact on the page, not as a live announcement:
                it is the standing position, not the result of an action.
              */}
              <p>
                <strong>Current choice:</strong>{' '}
                {state === undefined
                  ? 'Not decided yet'
                  : `${DECISION_LABELS[state.decision] ?? state.decision} · recorded ${new Date(state.decidedAt)
                      .toISOString()
                      .slice(0, 10)} under consent text ${state.templateVersion}`}
                {state !== undefined && state.restrictions.length > 0 && ` · limits: ${state.restrictions.join(', ')}`}
                {state?.assistanceRecorded === true && ' · made with somebody helping'}
              </p>
              {/* No preselection: both actions are equal-weight buttons. */}
              <button
                onClick={() =>
                  act(
                    scope,
                    () => api.recordConsent(session, scope, 'Granted', versionShown(state), assistedBy != null),
                    `Granted: ${label}`,
                  )
                }
              >
                Grant "{label}"
              </button>{' '}
              <button
                onClick={() =>
                  act(
                    scope,
                    () => api.recordConsent(session, scope, 'Declined', versionShown(state), assistedBy != null),
                    `Declined: ${label}`,
                  )
                }
              >
                Decline "{label}"
              </button>{' '}
              <button onClick={() => setPendingWithdrawal(scope)}>Withdraw consent for "{label}"</button>
              {pendingWithdrawal === scope && (
                <div role="alertdialog" aria-labelledby={`wd-${scope}`}>
                  <p id={`wd-${scope}`}>
                    After you withdraw, the platform stops using your information for this purpose. Research datasets
                    that are already locked are not rewritten, but no new data of yours is added to them.
                  </p>
                  <button
                    onClick={() => {
                      setPendingWithdrawal(null);
                      void act(
                        scope,
                        () => api.withdrawConsent(session, scope, true, versionShown(state), assistedBy != null),
                        `Withdrawn: ${label}`,
                      );
                    }}
                  >
                    Confirm withdrawal of "{label}"
                  </button>{' '}
                  <button onClick={() => setPendingWithdrawal(null)}>Go back without withdrawing</button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {actionError !== null && <ErrorState error={actionError} />}
      <p aria-live="polite" role="status">
        {announcement}
      </p>
    </section>
  );
}
