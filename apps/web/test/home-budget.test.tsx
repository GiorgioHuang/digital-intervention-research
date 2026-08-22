import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { App } from '../src/App.js';

/**
 * How much the home page asks of somebody who has just opened it.
 *
 * This exists because the page grew without anybody deciding it should.
 * Each time a right turned out to be unreachable it was given a way in
 * from here, every one of those additions was right on its own, and the
 * list went from five entries to eight — at which point the design note
 * for A1.6 observed that "eight unlabelled buttons are a wall rather than
 * a choice" and grouped them. Grouping did not reduce what was on screen.
 *
 * Measured before the fold, on an enrolled participant with one
 * contribution waiting: **191 words and 11 controls**, with the two
 * buttons that actually wanted an answer third and fourth in a field of
 * eight that wanted nothing. After: 113 words and 3 controls, and most of
 * the words that remain are the task itself.
 *
 * The budget is deliberately loose — it is a ratchet against silent
 * regrowth, not a target to optimise towards. If a genuine addition needs
 * the room, raise the number and say why in the commit; that is a decision
 * being taken, which is the whole point. What must not happen again is the
 * page doubling while every individual change looks reasonable.
 */
const WORD_BUDGET = 140;
const CONTROL_BUDGET = 5;

const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });

const stubPopulated = () =>
  vi.stubGlobal(
    'fetch',
    vi.fn(async (path: string, init?: RequestInit) => {
      if (path === '/health') return json({ status: 'ok', authMode: 'dev-header' });
      if ((init?.method ?? 'GET') !== 'GET') return json({ data: { id: 'x' } });
      // The case that matters: somebody actually in the study, with
      // something waiting. An empty account flatters this page.
      if (path.includes('contributions/awaiting-review')) {
        return json({
          data: [
            {
              attributes: {
                contributionId: 'ctr_1',
                archiveId: 'arc_1',
                contentText: 'I remember the allotment that summer, and how you kept the tomatoes going.',
                contributorDisplayName: 'Sam Petrova',
                offeredAt: '2026-08-01T10:00:00Z',
              },
            },
          ],
        });
      }
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

/**
 * What a participant sees, not what the DOM holds.
 *
 * jsdom does not implement `<details>`, so `textContent` counts everything
 * folded away as though it were on screen — which would make this measure
 * the opposite of what it is for. A closed disclosure contributes its
 * summary and nothing else, exactly as a browser renders it. The first
 * version of this measurement did not do that and reported 186 words where
 * a participant sees 114.
 */
function visibleOnHome(): { words: number; controls: number } {
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

describe('what the home page asks of somebody who has just opened it', () => {
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  const arrive = async () => {
    stubPopulated();
    await act(async () => {
      render(<App />);
    });
    fireEvent.change(screen.getByLabelText('Account identifier (actor id)'), { target: { value: 'actor_ann' } });
    fireEvent.change(screen.getByLabelText('Participant identifier'), { target: { value: 'pt_ann' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    });
  };

  it('stays inside its budget with a task waiting', async () => {
    await arrive();
    const { words, controls } = visibleOnHome();
    expect(words, `the home page is back up to ${words} words (budget ${WORD_BUDGET})`).toBeLessThanOrEqual(
      WORD_BUDGET,
    );
    expect(
      controls,
      `${controls} controls are on screen at once (budget ${CONTROL_BUDGET}) — the wall is growing back`,
    ).toBeLessThanOrEqual(CONTROL_BUDGET);
  });

  it('spends what it does have on the task rather than on navigation', async () => {
    await arrive();
    const { controls } = visibleOnHome();
    // The decision's own two buttons, plus help. Anything beyond that is a
    // destination competing with the thing to be decided.
    expect(screen.getByRole('button', { name: 'Add this to my story' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Do not add this' })).toBeTruthy();
    expect(controls, 'a destination has escaped back onto the first screen').toBeLessThanOrEqual(3);
  });
});
