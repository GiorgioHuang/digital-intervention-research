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
  /*
   * A real code that the permission engine does not raise today: a
   * missing consent returns a plain denial rather than naming consent as
   * the barrier, because saying which gate stopped somebody would
   * confirm the record exists (ADR-050). The wording is kept because the
   * code is real and something may raise it, but nobody should assume a
   * participant has seen this — what they get today is the
   * AUTHORISATION_DENIED entry, which mentions consent among the
   * possibilities precisely because it cannot say which.
   */
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
  /*
   * The everyday refusals of matching and messaging, which had no words
   * at all.
   *
   * Every one of these is a correct, expected refusal that a participant
   * will meet in ordinary use — a candidate that ran out, a connection
   * that ended mid-conversation, a draft that changed in another tab.
   * Unmapped, they all fell through to the honest but useless fallback:
   * "we could not determine the cause, and we do not know whether it took
   * effect". The platform knows exactly what happened in each of these,
   * and telling somebody it does not is its own kind of untruth — it
   * turns a normal, explainable event into an apparent malfunction, and
   * invites them to try again at something that will refuse them again.
   *
   * Each says what did not happen, because that is the part a person acts
   * on, and none of them blames the other party or reveals anything about
   * them.
   */
  /*
   * Raised where a candidate is generated, which is a coordinator's
   * action rather than a participant's — the wording is here because the
   * code can reach this presenter, not because it is an everyday sight.
   * It is about the matching preference being switched on under Meet new
   * people, NOT about the open-matching consent scope: consent gates
   * whether somebody may switch it on at all, and a missing consent
   * refuses earlier and differently.
   */
  MATCHING_NOT_ACTIVE: {
    severity: 2,
    title: 'This needs matching to be switched on',
    reassurance: 'Nothing was suggested to anyone, and nothing about you was shared.',
    reason: 'Matching has to be switched on by both people, and at least one side has not switched it on.',
    nextStep: 'You can switch yours on under Meet new people. Nobody is told whether anyone else has.',
  },
  MATCH_CANDIDATE_EXPIRED: {
    severity: 1,
    title: 'This suggestion has run out',
    reassurance: 'Your decision was not recorded, and the other person was not told anything.',
    reason: 'Suggestions are only open for a limited time, and this one has passed it.',
    nextStep: 'Refresh the list under Meet new people. Nothing is lost by a suggestion running out.',
  },
  MATCH_DECISION_CONFLICT: {
    severity: 1,
    title: 'This suggestion changed while you were looking at it',
    reassurance: 'Your decision was not recorded.',
    reason: 'What the suggestion said is not what it says now, so a decision made on the old version was not applied.',
    nextStep: 'Read it again as it stands now, then decide.',
  },
  MATCH_DECISION_NOT_OWNED: {
    severity: 2,
    title: 'This suggestion is not one of yours',
    reassurance: 'Nothing was recorded.',
    reason: 'A decision can only be made by one of the two people a suggestion is about.',
    nextStep: `Go back to Meet new people and choose from your own list. ${SUPPORT}`,
  },
  MUTUAL_ACCEPTANCE_EXPIRED: {
    severity: 1,
    title: 'This can no longer be turned into a connection',
    reassurance: 'No connection was made, and the other person was not told.',
    reason: 'You both said you were interested, but that only stays open for a limited time and it has passed.',
    nextStep: 'If you both still want to, it can start again from Meet new people.',
  },
  MUTUAL_ACCEPTANCE_ALREADY_CONSUMED: {
    severity: 1,
    title: 'You are already connected',
    reassurance: 'Nothing was changed or duplicated.',
    reason: 'This has already been turned into a connection — most likely a moment ago, or in another window.',
    nextStep: 'Open Messages; the connection is there.',
  },
  MUTUAL_ACCEPTANCE_INVALIDATED: {
    severity: 2,
    title: 'This cannot be turned into a connection',
    reassurance: 'No connection was made, and nothing was sent to anyone.',
    // Deliberately not "they withdrew" or "you were blocked": the reason
    // belongs to the other person and is not ours to disclose.
    reason: 'Something has changed since you both said you were interested, so it is no longer available.',
    nextStep: `Nothing here needs fixing by you. ${SUPPORT}`,
  },
  COMMUNICATION_BASIS_EXPIRED: {
    severity: 2,
    title: 'You can no longer write in this conversation',
    reassurance: 'Your draft is saved and nothing was sent. Everything already written is still there to read.',
    reason: 'The reason you could write to each other has ended — a connection that finished, or a supporter permission that was taken back.',
    nextStep: 'You can still read this conversation. Meet new people shows your current connections.',
  },
  CONVERSATION_THREAD_NOT_USABLE: {
    severity: 2,
    title: 'Nothing more can be sent in this conversation',
    reassurance: 'Your draft is saved and nothing was sent.',
    reason: 'This conversation is no longer open — it may be paused, closed or archived.',
    nextStep: 'You can still read everything in it.',
  },
  THREAD_PARTICIPANT_MISMATCH: {
    severity: 2,
    title: 'This conversation is not one of yours',
    reassurance: 'Nothing was sent and nothing was recorded.',
    reason: 'Only the two people a conversation is between can write in it.',
    nextStep: `Open Messages and choose one of your own conversations. ${SUPPORT}`,
  },
  MESSAGE_NOT_DRAFT: {
    severity: 1,
    title: 'This message has already been sent',
    reassurance: 'What you just typed was not added to it, and the sent message is unchanged.',
    reason: 'A message can be changed while it is a draft. Once it has gone, it stays as it was sent.',
    nextStep: 'Write a new message if you want to add something.',
  },
  MESSAGE_ALREADY_QUEUED: {
    severity: 1,
    title: 'This message is already on its way',
    reassurance: 'It was not sent twice.',
    reason: 'Sending was already confirmed for this message, most likely a moment ago or in another window.',
    nextStep: 'Open the conversation to see where it has got to.',
  },
  SEND_CONFIRMATION_MISMATCH: {
    severity: 2,
    title: 'This was not sent, because it changed after you confirmed',
    reassurance: 'Nothing was sent, and your draft is still here as it now stands.',
    reason: 'What you confirmed is not what the draft says now — the text or who it goes to has changed since.',
    nextStep: 'Read it through as it stands, then confirm again.',
  },
  RESOURCE_STATE_BLOCKED: {
    severity: 2,
    title: 'This cannot be changed as it stands',
    reassurance: 'Nothing changed, and what you typed is still here.',
    reason: 'What you are trying to change is in a state that does not allow it — something you withdrew, for instance, stays as it is.',
    nextStep: `Refresh to see how it stands now. ${SUPPORT}`,
  },
  CONFIRMATION_REQUIRED: {
    severity: 1,
    title: 'This needs you to confirm it',
    reassurance: 'Nothing has happened yet.',
    reason: 'Some steps ask you to confirm before they take effect, and that confirmation did not reach the server.',
    nextStep: 'Try the step again and confirm when asked.',
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
  /*
   * VALIDATION_ERROR, not VALIDATION_FAILED. Both presenters carried
   * wording for VALIDATION_FAILED, which this platform raises nowhere —
   * a prepared sentence for a refusal that cannot happen, while the
   * refusal that does happen fell through to "we could not determine the
   * cause". The kernel's code is VALIDATION_ERROR and every guard that
   * checks what somebody typed uses it.
   */
  VALIDATION_ERROR: {
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
  VALIDATION_ERROR: {
    reason: 'the server refused a value you supplied — the message says which',
    nextStep: 'read the message, correct that value and submit again',
  },
  /*
   * The refusals staff meet while doing the work, which had no wording:
   * every one of them fell through to a generic line that names neither
   * the reason nor the next step. Each is checked against its throw site
   * rather than guessed — the lesson from MATCHING_NOT_ACTIVE (D-44),
   * which I first worded as pointing at the wrong screen.
   */
  APPROVAL_REQUIRED: {
    // Raised where an analysis runs without an approved plan, a finding
    // rests on an unapproved interpretation, or an export is generated
    // before it was agreed to.
    reason: 'the thing this rests on has not been approved yet, and approval is somebody else\'s step',
    nextStep: 'find it in the approval queue; if it is yours to submit, submit it and wait for a different person',
  },
  DATASET_LOCK_NOT_READY: {
    reason:
      'the dataset version is not locked — a version must pass quality review before it can be locked, and analysis only runs against a locked one',
    nextStep: 'complete the quality review, then lock the version; the run binds to exactly that locked data',
  },
  DEIDENTIFICATION_REQUIRED: {
    reason: 'this would put message content into a dataset, which needs a separately governed restricted definition',
    nextStep: 'do not work around it — a restricted definition is a governance decision, not a setting here',
  },
  RESOURCE_STATE_BLOCKED: {
    reason: 'the record is in a state that does not allow this — something withdrawn or already decided, for instance',
    nextStep: 'reload to see how it stands now, and act on what it actually says',
  },
  ORGANISATION_CONTEXT_REQUIRED: {
    reason: 'this listing is scoped to one organisation and your session carries none',
    nextStep: 'sign in again with an organisation identifier; a listing that took one as an argument would be a way of asking which organisations exist',
  },
  CONFIRMATION_REQUIRED: {
    reason: 'this action is in the confirmed tier and the confirmation did not reach the server',
    nextStep: 'repeat it and confirm when asked',
  },
  INTERNAL_ERROR: {
    // Never claim to know: this is the one case where the honest answer
    // is that the platform does not know what happened.
    reason: 'the server failed in a way it did not expect, and it is not known whether the action took effect',
    nextStep: 'reload before repeating it — repeating blindly may do it twice — and report it with the code below',
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
