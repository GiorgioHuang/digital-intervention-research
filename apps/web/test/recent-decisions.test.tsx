import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { act } from 'react';
import { RecentDecisions } from '../src/components/RecentDecisions.js';

const session = { actorId: 'actor_m', participantId: 'pt_m' };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

const row = (what: string, when: string, action = 'consent.record') => ({
  id: '0',
  attributes: { action, what, when },
});

/**
 * "What you decided recently".
 *
 * The platform recorded every one of these and showed none of them back to
 * the person who made them: sixty-one call sites write to `audit_events`
 * and the only thing that read one was the staff view, behind `audit.view`,
 * which no participant holds. Somebody who cannot remember whether they
 * already answered a question — or who was told by a helper that they
 * agreed to something — now has their own record to look at.
 */
describe('what you decided recently', () => {
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  const render_ = async (body: unknown, status = 200) => {
    const calls: string[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (path: string) => {
        calls.push(path);
        return json(body, status);
      }),
    );
    await act(async () => {
      render(<RecentDecisions session={session} />);
    });
    return calls;
  };

  it('lists what was decided and when, in the participant’s own words', async () => {
    const calls = await render_({
      data: [
        row('Kept your story private', '2026-08-14T09:00:00Z', 'life-story.change-visibility'),
        row('Answered a consent question', '2026-08-18T09:00:00Z'),
      ],
    });
    expect(calls[0]).toBe('/v1/participants/pt_m/decisions?limit=3');
    expect(screen.getByText('Kept your story private')).toBeTruthy();
    // The handoff's format: weekday, day, month, and no year on a list that
    // is recent by construction.
    expect(screen.getByText('Fri 14 Aug')).toBeTruthy();
    // No comma. `toLocaleDateString` puts one in — "Fri, 14 Aug" — and it
    // is the widest character in a column that has to stay narrow on a
    // 320px phone.
    expect(screen.queryByText(/Fri, 14 Aug/), 'the date has picked up a comma').toBeNull();
    // A real <time>, so the machine-readable instant survives the human
    // wording — a screen reader and a copy-paste both get the full date.
    expect(screen.getByText('Fri 14 Aug').getAttribute('datetime')).toBe('2026-08-14T09:00:00Z');
  });

  /**
   * A participant at the start of the study has decided nothing yet, and a
   * bordered block saying so on their first morning is unkind and useless.
   * The section is absent, not empty.
   */
  it('shows nothing at all when there is nothing to show', async () => {
    await render_({ data: [] });
    expect(screen.queryByRole('heading', { name: 'What you decided recently' })).toBeNull();
  });

  /**
   * A look back is not a task. If it cannot be read, it must not put an
   * error above the thing on this page that actually wants doing.
   */
  it('disappears rather than erroring when it cannot be read', async () => {
    await render_({ error: { code: 'NOPE' } }, 500);
    expect(screen.queryByRole('heading', { name: 'What you decided recently' })).toBeNull();
    expect(document.body.textContent, 'a look back put an error on the page').not.toMatch(
      /could not|went wrong|error/i,
    );
  });
});
