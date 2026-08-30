import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { Exercises, Tapping, clock } from '../src/components/elder/Exercises.js';

/**
 * The exercises, and the one rule that outranks everything else on these
 * screens.
 *
 * The copy voice section: these are "exercises", never "games", and **no
 * score is ever shown**. "A Parkinson's tapping measure framed as a game
 * invites a score, and a score invites a person to read a bad day as
 * decline." Taps go to the study; the participant sees elapsed time.
 */
describe('exercises', () => {
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });
  afterEach(cleanup);

  it('offers four, and says there is no score before anybody starts', () => {
    render(<Exercises onHome={() => undefined} onTapping={() => undefined} />);
    for (const name of ['Tapping', 'Drawing a spiral', 'Naming what you see', 'Steady hold']) {
      expect(screen.getByText(name), `${name} is missing`).toBeTruthy();
    }
    expect(screen.getByText(/There is no score and nothing is counted against you/)).toBeTruthy();
    // "exercises", never "games" — the word choice is the copy voice's own
    // ruling and the reason the framing works at all.
    expect(document.body.textContent, 'these are being called games').not.toMatch(/\bgames?\b/i);
  });

  /**
   * Three of the four have nothing behind them (B-10). They are drawn
   * because the design draws them and because somebody choosing
   * "whichever you like" should see what the four are — but they are not
   * controls, so nothing here opens a door that does not open.
   */
  it('only opens the one that opens', () => {
    const opened: number[] = [];
    render(<Exercises onHome={() => undefined} onTapping={() => opened.push(1)} />);
    const buttons = screen.getAllByRole('button');
    // Back, plus Tapping. Nothing else is pressable.
    expect(buttons.length, 'a door that does not open is being offered').toBe(2);
    fireEvent.click(screen.getByText('Tapping').closest('button')!);
    expect(opened).toEqual([1]);
    expect(screen.getAllByText('Not ready yet.').length).toBe(3);
  });
});

describe('tapping', () => {
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  /**
   * The whole point of the screen. Tapping is counted for the study and the
   * count must never reach the surface — not as a number, not as a
   * progress bar, not as praise for a good one.
   */
  it('shows a clock and never a count', () => {
    render(<Tapping onDone={() => undefined} />);
    const circles = screen.getAllByRole('button', { name: /^Circle [12]$/ });
    expect(circles.length).toBe(2);
    for (let i = 0; i < 17; i += 1) fireEvent.click(circles[i % 2]!);
    act(() => {
      vi.advanceTimersByTime(5_000);
    });
    expect(screen.getByRole('timer').textContent, 'the clock is not running').toBe('0:05');
    // 17 taps happened. The number must appear nowhere.
    expect(document.body.textContent, 'the tap count reached the screen').not.toMatch(/\b17\b/);
    expect(screen.getByText('No score is kept. This is not a test.')).toBeTruthy();
  });

  /** The clock starts on the first tap, not on arrival: sitting looking at the screen is not time spent. */
  it('does not start counting until the first tap', () => {
    render(<Tapping onDone={() => undefined} />);
    act(() => {
      vi.advanceTimersByTime(9_000);
    });
    expect(screen.getByRole('timer').textContent).toBe('0:00');
  });

  /**
   * The design's Finish says "Nothing is saved unless you finish it".
   * Nothing receives a finished exercise (B-10), so Finish says what
   * actually happens rather than promising a save with nowhere to go.
   */
  it('does not claim to have saved anything', () => {
    const done: (string | undefined)[] = [];
    render(<Tapping onDone={(m) => done.push(m)} />);
    fireEvent.click(screen.getByRole('button', { name: 'Finish' }));
    expect(done[0]).toContain('not built yet');
    expect(done[0], 'the screen claims a save that goes nowhere').not.toMatch(/saved\b(?!.*not)/i);
  });

  it('stops without saving, silently', () => {
    const done: (string | undefined)[] = [];
    render(<Tapping onDone={(m) => done.push(m)} />);
    fireEvent.click(screen.getByRole('button', { name: 'Stop without saving' }));
    expect(done).toEqual([undefined]);
  });

  it('counts the clock in minutes and seconds', () => {
    expect(clock(0)).toBe('0:00');
    expect(clock(9_400)).toBe('0:09');
    expect(clock(65_000)).toBe('1:05');
    expect(clock(600_000)).toBe('10:00');
  });
});
