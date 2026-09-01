/**
 * What one person is allowed to see of another's life story.
 *
 * This is the security core of B-30 and it is deliberately pure: given
 * what somebody stands in relation to a participant, it says which
 * visibility scopes they satisfy. No database, no permission engine, no
 * context — so every case that matters, and particularly every case that
 * must refuse, is an ordinary test rather than something to be confident
 * about on a screen.
 *
 * Nothing on this platform could read another person's story at all
 * before this, so there is no prior behaviour to be compatible with. What
 * there is instead is a promise the screen made while the feature did not
 * exist, and the rule that follows from it: this decides who may read,
 * and it fails closed at every step.
 */
import type { LifeStoryVisibility } from '../contracts/index.js';

/**
 * What a viewer is to a participant, as far as reading is concerned.
 *
 * `supporter` is an APPROVED, unexpired supporter relationship and
 * nothing weaker: the relationship table also holds Proposed,
 * PendingVerification, Restricted, Suspended, Expired, Revoked and
 * Rejected, and not one of those is somebody the participant has said may
 * read their life.
 */
export interface ViewerStanding {
  /** The viewer is the participant. */
  readonly isOwner: boolean;
  /** An Active, unexpired supporter relationship. */
  readonly isSupporter: boolean;
  /** An accepted participant-to-participant connection. */
  readonly isConnection: boolean;
  /** A member of a community the participant is also in. */
  readonly sharesCommunity: boolean;
  /** Named by the participant on this specific item. */
  readonly isSelected: boolean;
  /** Signed in to this platform at all. */
  readonly isPlatformMember: boolean;
}

export const NO_STANDING: ViewerStanding = {
  isOwner: false,
  isSupporter: false,
  isConnection: false,
  sharesCommunity: false,
  isSelected: false,
  isPlatformMember: false,
};

/**
 * Whether this viewer may read a memory at this scope.
 *
 * Written as an exhaustive switch on the scope rather than a set of
 * scopes the viewer "has", because the two are not the same thing and the
 * difference is where this kind of code goes wrong: a viewer who
 * satisfies Community does not thereby satisfy Selected People, and a
 * table of "scopes you have" invites exactly that collapse.
 *
 * Private is never readable by anyone but the owner, including a
 * supporter and including staff. An unknown scope is not readable at all
 * — a value this function has never heard of is not a licence.
 */
export function mayRead(scope: LifeStoryVisibility | string, standing: ViewerStanding): boolean {
  if (standing.isOwner) return true;
  switch (scope) {
    case 'Private':
      return false;
    case 'My Supporters':
      return standing.isSupporter;
    case 'Selected People':
      return standing.isSelected;
    case 'Connections':
      return standing.isConnection;
    case 'Community':
      return standing.sharesCommunity;
    case 'Platform Public':
      return standing.isPlatformMember;
    default:
      /*
       * Including 'Internet Public', which the database constraint
       * rejects and ADR-020 disables. If one ever reached this function
       * it would be through a path that bypassed the constraint, and the
       * answer to that is no.
       */
      return false;
  }
}

/**
 * The lifecycle states of a memory that anybody other than its owner may
 * read.
 *
 * Withdrawn is the one this exists for. The screen tells its owner a
 * withdrawn entry is "private now, and still here for you to read", and
 * that promise is only kept if withdrawal actually takes it back from
 * everyone — so withdrawal overrides visibility rather than sitting
 * beside it. Draft, Hidden, Restricted, Archived and Deleted are refused
 * for their own reasons; only Active is shared.
 */
export function sharedWithOthers(itemState: string, scope: LifeStoryVisibility | string, standing: ViewerStanding): boolean {
  if (standing.isOwner) return true;
  if (itemState !== 'Active') return false;
  return mayRead(scope, standing);
}
