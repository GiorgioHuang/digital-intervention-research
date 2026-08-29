import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { act } from 'react';
import { ReviewContribution } from '../src/components/ReviewContribution.js';
import { ConsentPanel } from '../src/components/ConsentPanel.js';

/**
 * Visual weight must not steer.
 *
 * DESIGN_BRIEF states it as a rule — "visual weight must not steer the
 * participant toward one option; 'Not now' and 'Interested' carry equal
 * weight" — and DESIGN_SYSTEM §788 specifies the acceptance: for each
 * equal-weight pair, assert that background, font weight and border are
 * exactly equal. **That acceptance was never implemented.** The rule that
 * stops this interface nudging people had nothing holding it.
 *
 * It nearly cost something. Making the affirmative answer a solid primary
 * button is the obvious way to give a page hierarchy, it looks like better
 * design, and here it would be steering somebody toward accepting another
 * person's words into their own life story. Nothing in the suite would have
 * gone red.
 *
 * Asserted on the class rather than on `getComputedStyle`: every difference
 * of weight in this codebase arrives as a class (`btn-primary`,
 * `btn-danger`), jsdom does not resolve `var()` so a computed-style
 * comparison would be comparing two unresolved strings, and identical
 * classes is the stronger claim anyway — it fails at the point where the
 * nudge would actually be introduced.
 */
const WEIGHTED = ['btn-primary', 'btn-danger'];

const pairIsEqual = (a: HTMLElement, b: HTMLElement, what: string) => {
  expect(a.className, `${what}: the two answers no longer carry the same class`).toBe(b.className);
  for (const el of [a, b]) {
    for (const cls of WEIGHTED) {
      expect(
        el.classList.contains(cls),
        `${what}: "${el.textContent}" was given ${cls}, which steers the choice`,
      ).toBe(false);
    }
  }
};

const session = { actorId: 'actor_t', participantId: 'pt_t' };
const json = (b: unknown) => new Response(JSON.stringify(b), { status: 200 });

describe('equal-weight pairs stay equal', () => {
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('accepting and refusing a contribution to your own life story', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (path: string) =>
        json(
          path.includes('awaiting-review')
            ? {
                data: [
                  {
                    attributes: {
                      contributionId: 'ctr_1',
                      archiveId: 'arc_1',
                      contentText: 'I remember the allotment that summer.',
                      itemId: null,
                      createdAt: '2026-08-01T10:00:00Z',
                    },
                  },
                ],
              }
            : { data: [] },
        ),
      ),
    );
    await act(async () => {
      // The pair lives on the review screen now: Home names what is
      // waiting and this is where it is answered.
      render(
        <ReviewContribution session={session as never} contributionId="ctr_1" onDone={() => {}} />,
      );
    });
    pairIsEqual(
      screen.getByRole('button', { name: 'Add this to my story' }),
      screen.getByRole('button', { name: 'Do not add this' }),
      'life-story contribution',
    );
  });

  it('granting and declining a consent scope', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => json({ data: [] })));
    await act(async () => {
      render(<ConsentPanel session={session as never} />);
    });
    // Every scope, not the first: a nudge introduced on one of six would be
    // the easiest of all to miss.
    const grants = screen.getAllByRole('button', { name: /^Grant "/ });
    const declines = screen.getAllByRole('button', { name: /^Decline "/ });
    expect(grants.length, 'the consent screen offers no scopes').toBeGreaterThanOrEqual(6);
    expect(declines.length).toBe(grants.length);
    grants.forEach((g, i) => pairIsEqual(g, declines[i]!, `consent scope ${i + 1}`));
  });
});
