import { describe, expect, it } from 'vitest';
import { mayRead, NO_STANDING, sharedWithOthers, type ViewerStanding } from '../src/index.js';

const standing = (over: Partial<ViewerStanding> = {}): ViewerStanding => ({ ...NO_STANDING, ...over });

const SCOPES = ['Private', 'My Supporters', 'Selected People', 'Connections', 'Community', 'Platform Public'];

/**
 * Who may read somebody's life.
 *
 * Nothing on this platform could read another person's story before this,
 * so there is no prior behaviour to preserve — only the requirement that
 * this be right the first time. It is tested mostly from the refusing
 * side, because a wrong "no" is an inconvenience and a wrong "yes" hands
 * somebody's memories to a person they did not choose.
 */
describe('who may read a memory', () => {
  it('lets the owner read their own, at every scope', () => {
    for (const scope of SCOPES) {
      expect(mayRead(scope, standing({ isOwner: true })), `the owner was refused their own ${scope} memory`).toBe(true);
    }
  });

  /**
   * The one that must never move. Private is private from everybody —
   * supporters, connections, communities, staff, and anyone holding every
   * other standing at once.
   */
  it('never lets anybody but the owner read a private memory', () => {
    const everyone = standing({
      isSupporter: true,
      isConnection: true,
      sharesCommunity: true,
      isSelected: true,
      isPlatformMember: true,
    });
    expect(mayRead('Private', everyone), 'a private memory was readable by somebody else').toBe(false);
    expect(mayRead('Private', NO_STANDING)).toBe(false);
  });

  /**
   * Each scope answers to its own standing and to nothing else.
   *
   * This is the collapse worth guarding: it is tempting to treat standing
   * as a ladder — a supporter is "closer" than the community, so surely a
   * supporter sees community posts too. The participant did not say that.
   * They said who this memory is for.
   */
  it('does not let one standing satisfy another scope', () => {
    const cases: Array<[keyof ViewerStanding, string]> = [
      ['isSupporter', 'My Supporters'],
      ['isSelected', 'Selected People'],
      ['isConnection', 'Connections'],
      ['sharesCommunity', 'Community'],
      ['isPlatformMember', 'Platform Public'],
    ];
    for (const [held, opens] of cases) {
      const only = standing({ [held]: true });
      expect(mayRead(opens, only), `${held} did not open ${opens}`).toBe(true);
      for (const scope of SCOPES) {
        if (scope === opens) continue;
        expect(mayRead(scope, only), `${held} alone opened ${scope}`).toBe(false);
      }
    }
  });

  it('refuses a scope it has never heard of, rather than falling through', () => {
    const everyone = standing({
      isSupporter: true,
      isConnection: true,
      sharesCommunity: true,
      isSelected: true,
      isPlatformMember: true,
    });
    // 'Internet Public' is refused by the database constraint and disabled
    // by ADR-020; reaching here would mean a path went round the
    // constraint, and the answer to that is still no.
    for (const scope of ['Internet Public', '', 'public', 'Everyone', 'undefined']) {
      expect(mayRead(scope, everyone), `"${scope}" was treated as a licence`).toBe(false);
    }
  });

  it('gives somebody with no standing nothing at all', () => {
    for (const scope of SCOPES) {
      expect(mayRead(scope, NO_STANDING), `a stranger could read a ${scope} memory`).toBe(false);
    }
  });
});

/**
 * Withdrawal takes a memory back from everybody.
 *
 * The screen tells its owner a withdrawn entry is "private now, and still
 * here for you to read". That promise is only kept if withdrawing
 * actually removes it from everyone who could reach it — so the lifecycle
 * state overrides the scope rather than sitting beside it.
 */
describe('which memories leave the owner at all', () => {
  it('stops sharing a withdrawn memory, whatever it was shared with', () => {
    const supporter = standing({ isSupporter: true });
    expect(sharedWithOthers('Active', 'My Supporters', supporter)).toBe(true);
    expect(
      sharedWithOthers('Withdrawn', 'My Supporters', supporter),
      'a withdrawn memory was still readable by a supporter',
    ).toBe(false);
  });

  it('shares nothing that is not Active', () => {
    const supporter = standing({ isSupporter: true });
    for (const state of ['Draft', 'Hidden', 'Restricted', 'Withdrawn', 'Archived', 'Deleted', 'Unknown']) {
      expect(sharedWithOthers(state, 'My Supporters', supporter), `a ${state} memory was shared`).toBe(false);
    }
    expect(sharedWithOthers('Active', 'My Supporters', supporter)).toBe(true);
  });

  it('still lets the owner read their own withdrawn memory', () => {
    // The other half of the promise: it is taken back from everybody
    // else, and kept for them.
    expect(sharedWithOthers('Withdrawn', 'Private', standing({ isOwner: true }))).toBe(true);
  });
});
