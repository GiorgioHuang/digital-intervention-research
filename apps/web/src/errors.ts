import { PlatformApiError } from './api.js';

/**
 * Error presentation (design system §E.8, Doc 20 §231–237). Four things
 * every message must answer: what happened, whether the person's work
 * survived, what did NOT happen, and what to do next. The technical code
 * is a detail for support, never the message itself — a participant
 * reading `AUTHORISATION_DENIED` learns nothing and is told nothing.
 *
 * Severity is a presentation decision, not a synonym for HTTP status:
 * level 1 is recoverable in place, level 2 blocks the action and needs a
 * route out, level 3 is safety-critical and takes over.
 */
export type ErrorSeverity = 1 | 2 | 3;

export interface PresentedError {
  severity: ErrorSeverity;
  title: string;
  /** What survived and what did not happen. */
  reassurance: string;
  /** Why, in plain language — omitted when we cannot say honestly. */
  reason?: string;
  /** The next thing the person can actually do. */
  nextStep: string;
  /** Technical code, shown only inside a details disclosure. */
  code: string;
}

const SUPPORT = 'If this looks wrong, you can contact the research team from Help and safety.';

/**
 * Protected existence (ADR-050): a 404 may mean the thing is not there OR
 * that this person may not know it exists. The wording must fit both, so
 * it never confirms existence and never blames the other person.
 */
const NOT_FOUND: Omit<PresentedError, 'code'> = {
  severity: 2,
  title: 'This item cannot be opened right now',
  reassurance: 'Nothing you typed has been lost, and nothing was submitted.',
  reason: 'The identifier may be incorrect, or this item may not be open to you.',
  nextStep: `Please check the identifier. ${SUPPORT}`,
};

const BY_CODE: Record<string, Omit<PresentedError, 'code'>> = {
  AUTHENTICATION_REQUIRED: {
    severity: 2,
    title: 'This environment needs its access passphrase',
    reassurance: 'That action did not run, and what you typed is still here.',
    reason: 'This is not about your account or your permissions — it is the door to this research prototype environment.',
    nextStep: 'Enter the passphrase in the notice at the top of the page, then try again.',
  },
  AUTHORISATION_DENIED: {
    severity: 2,
    title: 'This cannot be done right now',
    reassurance: 'Nothing changed, and what you typed is still here.',
    reason: 'This action needs something that is not in place yet, such as a consent choice or an approval from the other person.',
    nextStep: `You can check the related options under My consent choices. ${SUPPORT}`,
  },
  RESOURCE_NOT_FOUND: NOT_FOUND,
  CONSENT_REQUIRED: {
    severity: 2,
    title: 'This step needs a consent choice from you',
    reassurance: 'Nothing was submitted, and what you typed is still here.',
    reason: 'The related consent choice is not currently set to granted.',
    nextStep: 'Open My consent choices to review and change it. You can change it back at any time.',
  },
  BLOCKED_INTERACTION: {
    severity: 2,
    title: 'This interaction did not happen',
    reassurance: 'Nothing was sent, and the other person is not notified.',
    reason: 'A block is in place between you.',
    nextStep: 'You can review and manage blocks under Help and safety.',
  },
  COMMUNICATION_BASIS_REQUIRED: {
    severity: 2,
    title: 'You cannot message this person yet',
    reassurance: 'Your draft is saved and was not sent.',
    reason: 'Messaging needs a connection between you that is still current.',
    nextStep: 'You can check the connection under Meet new people.',
  },
  VERSION_CONFLICT: {
    severity: 1,
    title: 'This item has just been updated by someone else',
    reassurance: 'Your changes are not lost, and nothing of theirs was overwritten.',
    reason: 'It changed while you were working on it.',
    nextStep: 'Refresh to see the current version, then decide whether to continue.',
  },
  INVALID_STATE_TRANSITION: {
    severity: 1,
    title: 'Its current state does not allow this action',
    reassurance: 'Nothing changed.',
    nextStep: 'Refresh to see its current state; you can try again once it changes.',
  },
  VALIDATION_FAILED: {
    severity: 1,
    title: 'One field still needs a change',
    reassurance: 'What you wrote is still below and has not been lost.',
    nextStep: 'Make the change described, then submit again.',
  },
  STEP_UP_AUTHENTICATION_REQUIRED: {
    severity: 2,
    title: 'This action needs stronger authentication',
    reassurance: 'The action did not run, and what you typed is still here.',
    nextStep: 'Sign in again with strong authentication, then try again.',
  },
  DEPENDENCY_UNAVAILABLE: {
    severity: 1,
    title: 'An external system cannot be reached right now',
    reassurance: 'Your content is not lost, and this step did not half-happen.',
    reason: 'This is a problem in the external system, not something you did wrong.',
    nextStep: 'Please try again in a little while.',
  },
  RATE_LIMITED: {
    severity: 1,
    title: 'Too many requests in a short time',
    reassurance: 'Nothing was lost.',
    nextStep: 'Wait a moment, then try again.',
  },
};

const NETWORK: Omit<PresentedError, 'code'> = {
  severity: 1,
  title: 'The server could not be reached',
  reassurance: 'What you wrote is still here, and nothing was submitted.',
  nextStep: 'Check your connection, then try again.',
};

const UNKNOWN: Omit<PresentedError, 'code'> = {
  severity: 1,
  title: 'This step did not succeed',
  // Never claim to know what happened when we do not: an unmapped code
  // may or may not have taken effect, and saying otherwise would be a
  // guess presented as fact.
  reassurance: 'What you wrote is still here.',
  reason: 'We could not determine the cause, and we do not know whether it took effect.',
  nextStep: 'Refresh to check the result rather than submitting again. If the problem continues, contact the research team from Help and safety.',
};

export function presentError(err: unknown): PresentedError {
  if (!(err instanceof PlatformApiError)) return { ...NETWORK, code: 'NETWORK' };
  const code = err.error?.code ?? 'UNKNOWN';
  // A protected-existence 404 and a genuine missing record are the same
  // wording by design; see NOT_FOUND.
  const mapped = BY_CODE[code] ?? (err.status === 404 ? NOT_FOUND : UNKNOWN);
  return { ...mapped, code };
}
