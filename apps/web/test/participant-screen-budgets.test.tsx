import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { App } from '../src/App.js';

/**
 * How much each participant screen asks of somebody arriving at it.
 *
 * The home page reached eight destinations one honest addition at a time,
 * and nothing was watching the total until somebody looked at the finished
 * page and said it was a wall. That is the failure mode this guards: not a
 * bad decision, but a series of reasonable ones with no running count.
 *
 * The numbers below are what each screen measured on 2026-08-22, plus room
 * for roughly one honest addition. They are a **ratchet, not a target**.
 * Raising one is fine and expected; raising one silently is the thing that
 * put the home page where it was. If a change needs the room, raise the
 * number in the same commit and say why.
 *
 * **What this does not measure, stated because it matters.** Every list
 * here is stubbed empty except the enrolment, so these are arrival states
 * with no content — the floor, not the ceiling. A screen whose per-item
 * markup is verbose can still grow without limit as real data arrives, and
 * nothing here would notice. What it does catch is the way the home page
 * actually grew: static copy and controls accumulating on the page itself.
 *
 * The headroom is uneven on purpose, and mutation-testing this file made
 * that visible: adding three buttons to a one-control screen does not trip
 * anything, because 1 → 4 is exactly the "one honest addition" the budget
 * allows. The small screens therefore have loose budgets in proportion.
 * That is accepted rather than tightened — what this guards against is a
 * wall, and a screen going from one control to four is not one. Tightening
 * until every addition needs a budget change would make the guard a chore,
 * and a guard that is a chore gets deleted.
 *
 * jsdom does not implement `<details>`, so a closed disclosure is reduced
 * to its summary by hand before counting — the same correction the home
 * budget makes, and for the same reason: counting `textContent` reports
 * what is in the DOM, which is the opposite of the question here.
 */
const BUDGETS: Record<string, { words: number; controls: number; note?: string }> = {
  consent: {
    words: 400,
    controls: 16,
    // The largest by far, and legitimately so: this is where somebody
    // decides what may be done with their information, and D-2 ruled that
    // all six scopes are presented at once rather than in batches. The
    // budget is here to stop it growing, not to argue it down.
    note: 'informed consent: the text is doing work',
  },
  access: { words: 250, controls: 10 },
  'data-copy': { words: 90, controls: 4 },
  messages: { words: 90, controls: 4 },
  'life-story': { words: 90, controls: 4 },
  matching: { words: 120, controls: 8 },
  community: { words: 140, controls: 4 },
  help: { words: 280, controls: 14 },
};

const json = (b: unknown) => new Response(JSON.stringify(b), { status: 200 });

function measureVisible() {
  const main = document.querySelector('main')!.cloneNode(true) as HTMLElement;
  main.querySelectorAll('details:not([open])').forEach((d) => {
    const summary = d.querySelector('summary');
    d.replaceChildren(...(summary ? [summary] : []));
  });
  const text = (main.textContent ?? '').replace(/\s+/g, ' ').trim();
  return {
    words: text === '' ? 0 : text.split(' ').length,
    controls: main.querySelectorAll('button, a[role="button"], input, select, textarea').length,
  };
}

describe('what each participant screen asks of somebody arriving at it', () => {
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (path: string, init?: RequestInit) => {
        if (path === '/health') return json({ status: 'ok', authMode: 'dev-header' });
        if ((init?.method ?? 'GET') !== 'GET') return json({ data: { id: 'x' } });
        if (path.includes('enrolment')) {
          return json({
            data: [
              {
                attributes: {
                  enrolmentId: 'enr_1',
                  researchProjectName: 'Connected Later Life',
                  enrolmentState: 'Active',
                  enrolledAt: '2026-07-01T10:00:00Z',
                },
              },
            ],
          });
        }
        return json({ data: [], meta: {} });
      }),
    );
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  /** Reached the way a participant reaches them, through the folds. */
  const ROUTES: { screen: string; fold: string | null; button: string }[] = [
    { screen: 'consent', fold: 'Your information and who can see it', button: 'Review or change my consent choices' },
    { screen: 'access', fold: 'Your information and who can see it', button: 'See who has access to me' },
    { screen: 'data-copy', fold: 'Your information and who can see it', button: 'Ask for a copy of my information' },
    { screen: 'messages', fold: 'Things you can do any time', button: 'Write to someone you are connected with' },
    { screen: 'life-story', fold: 'Things you can do any time', button: 'Write or read my life story' },
    { screen: 'matching', fold: 'Things you can do any time', button: 'Meet new people (optional)' },
    { screen: 'community', fold: 'Things you can do any time', button: 'Visit the community (optional)' },
    { screen: 'help', fold: null, button: 'Get help or report a problem' },
  ];

  for (const { screen: name, fold, button } of ROUTES) {
    it(`${name} stays inside its budget`, async () => {
      await act(async () => {
        render(<App />);
      });
      fireEvent.change(screen.getByLabelText('Account identifier (actor id)'), { target: { value: 'actor_a' } });
      fireEvent.change(screen.getByLabelText('Participant identifier'), { target: { value: 'pt_a' } });
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
      });

      if (fold !== null) {
        const summary = [...document.querySelectorAll('main details > summary')].find(
          (el) => el.textContent?.trim() === fold,
        );
        expect(summary, `the home page no longer has a "${fold}" disclosure`).toBeTruthy();
        await act(async () => {
          fireEvent.click(summary as HTMLElement);
        });
      }
      const target = screen.queryByRole('button', { name: button });
      expect(target, `"${button}" is no longer offered on the home page`).toBeTruthy();
      await act(async () => {
        fireEvent.click(target!);
      });

      const budget = BUDGETS[name]!;
      const { words, controls } = measureVisible();
      expect(
        words,
        `${name} is ${words} words on arrival (budget ${budget.words}${budget.note === undefined ? '' : ` — ${budget.note}`}). Raise the budget in this commit if the growth is wanted.`,
      ).toBeLessThanOrEqual(budget.words);
      expect(
        controls,
        `${name} puts ${controls} controls on screen at once (budget ${budget.controls}). Fold what can wait, or raise the budget deliberately.`,
      ).toBeLessThanOrEqual(budget.controls);
    });
  }
});
