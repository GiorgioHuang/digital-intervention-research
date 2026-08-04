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

/**
 * Staff-side wording (design system §I.1: participants must never see a
 * code, staff keep it because they act on it). Staff screens were saying
 * only `Not successful: AUTHORISATION_DENIED`, which states neither why
 * nor what to do — and their network branch claimed "nothing was
 * submitted", which is not knowable: a transport failure can happen after
 * the server has already applied the command. Both are fixed here.
 *
 * The code stays at the end of the line, so the existing announcements
 * remain greppable in support conversations.
 */
const STAFF_BY_CODE: Record<string, { reason: string; nextStep: string }> = {
  AUTHENTICATION_REQUIRED: {
    reason: 'the browser did not send this environment\'s access passphrase',
    nextStep: 'enter it in the notice at the top of the page, then repeat the action',
  },
  AUTHORISATION_DENIED: {
    // Deliberately generic: this entry is reached by reads as well as
    // commands. Separation of duties explains a refused *decision*, never
    // a refused *listing*, so that explanation belongs in the command
    // override below rather than here.
    reason: 'your current role and scope do not carry it',
    nextStep: 'check with whoever administers roles in your organisation',
  },
  STEP_UP_AUTHENTICATION_REQUIRED: {
    reason: 'this action is in the strong-authentication tier',
    nextStep: 'sign in again with strong authentication, then repeat it',
  },
  RESOURCE_NOT_FOUND: {
    reason:
      'the identifier does not resolve for you — it may not exist, or it may be outside your scope, and the two are deliberately indistinguishable',
    nextStep: 'check the identifier against the queue listing',
  },
  INVALID_STATE_TRANSITION: {
    reason: 'the artefact is no longer in the state this action requires — someone may have decided it already',
    nextStep: 'reload the queue to see its current state',
  },
  VERSION_CONFLICT: {
    reason: 'the artefact changed after this queue was loaded',
    nextStep: 'reload the queue and decide against the current version',
  },
  VALIDATION_FAILED: {
    reason: 'the server rejected the request body',
    nextStep: 'correct the field named in the response, then submit again',
  },
  CONSENT_REQUIRED: {
    reason: 'the participant has not granted the consent this step depends on',
    nextStep: 'do not work around it — the consent decision belongs to the participant',
  },
  DEPENDENCY_UNAVAILABLE: {
    reason: 'an external system this step depends on could not be reached, so the step did not half-happen',
    nextStep: 'retry in a few minutes',
  },
  RATE_LIMITED: { reason: 'too many requests in a short time', nextStep: 'wait a moment, then retry' },
};

/** A queue or listing that could not be read. Nothing was changed by a read. */
export function staffLoadError(err: unknown, what: string): string {
  if (!(err instanceof PlatformApiError)) {
    return `Could not load ${what}: the server could not be reached. Nothing changed. Check the connection, then try again. (NETWORK)`;
  }
  const code = err.error?.code ?? 'UNKNOWN';
  const mapped = STAFF_BY_CODE[code];
  if (mapped === undefined) {
    return `Could not load ${what}: the cause is not one this screen recognises. Nothing changed. Reload, and report the code if it persists. (${code})`;
  }
  return `Could not load ${what}: ${mapped.reason}. Nothing changed. Next: ${mapped.nextStep}. (${code})`;
}

/**
 * Codes whose cause differs between reading and commanding. A refused
 * listing is a role-and-scope fact; a refused decision is usually
 * separation of duties. Saying the latter on a failed queue load — which
 * the shared table did at first — sends the reader looking for a conflict
 * of interest that has nothing to do with why the list would not load.
 */
const STAFF_COMMAND_OVERRIDES: Record<string, { reason: string; nextStep: string }> = {
  AUTHORISATION_DENIED: {
    reason:
      'your current role and scope do not carry this action — for a decision this is usually separation of duties, because the approver cannot be the person who submitted the artefact',
    nextStep: 'ask a colleague who holds the permission to decide it',
  },
};

/**
 * A command that did not succeed. The distinction that matters to an
 * approver is whether the decision landed: a rejected command definitely
 * did not, an unreachable server is genuinely unknown, and this says so
 * instead of guessing.
 */
export function staffActionError(err: unknown, what: string): string {
  if (!(err instanceof PlatformApiError)) {
    return `${what} did not complete: the server could not be reached, so whether it took effect is unknown. Reload the queue to check before trying again. (NETWORK)`;
  }
  const code = err.error?.code ?? 'UNKNOWN';
  const mapped = STAFF_COMMAND_OVERRIDES[code] ?? STAFF_BY_CODE[code];
  if (mapped === undefined) {
    return `${what} did not complete: the cause is not one this screen recognises, and whether it took effect is unknown. Reload the queue to check rather than repeating it. (${code})`;
  }
  return `${what} was refused: ${mapped.reason}. Nothing changed. Next: ${mapped.nextStep}. (${code})`;
}
