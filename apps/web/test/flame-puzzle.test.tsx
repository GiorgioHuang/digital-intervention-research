import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import {
  findFlame,
  findHint,
  generateLevel,
  levelSize,
  newPlay,
  ruledOutBy,
  solutions,
  tap,
  type Play,
} from '../src/flame-puzzle.js';
import { FlamePuzzle } from '../src/components/elder/FlamePuzzle.js';

/**
 * The flame puzzle's rules, and the screen over them.
 *
 * The property that matters most is uniqueness: a level with two answers
 * turns its last squares into a guess, and a wrong guess costs a heart.
 */
describe('flame puzzle levels', () => {
  it('has exactly one answer on every level, and it obeys the rules', () => {
    for (let n = 1; n <= 40; n += 1) {
      const level = generateLevel(n);
      const { size, regions, solution } = level;
      expect(size).toBe(levelSize(n));
      expect(solutions(size, regions, 2).length, `level ${n} has more than one answer`).toBe(1);
      expect(new Set(solution).size, `level ${n} repeats a column`).toBe(size);
      expect(new Set(solution.map((c, r) => regions[r * size + c])).size, `level ${n} repeats a region`).toBe(size);
      for (let r = 1; r < size; r += 1) expect(Math.abs(solution[r]! - solution[r - 1]!)).toBeGreaterThan(1);
    }
  });

  it('gives the same board for the same level everywhere', () => {
    expect(generateLevel(12)).toEqual(generateLevel(12));
    expect(generateLevel(12).regions).not.toEqual(generateLevel(13).regions);
  });
});

describe('flame puzzle play', () => {
  const level = generateLevel(8);
  const answer = level.solution.map((c, r) => r * level.size + c);
  const wrong = [...Array(level.size ** 2).keys()].find((i) => !answer.includes(i))!;

  it('lights a flame and crosses out what it rules out', () => {
    const { play, outcome } = tap(level, newPlay(level), answer[0]!, false);
    expect(outcome).toBe('flame');
    expect(play.found).toBe(1);
    for (const j of ruledOutBy(level, answer[0]!)) expect(play.squares[j]).toBe('ruled-out');
  });

  it('takes a heart for a wrong square, and none for a mark', () => {
    let play: Play = newPlay(level);
    ({ play } = tap(level, play, wrong, true));
    expect(play.squares[wrong]).toBe('mark');
    expect(play.hearts).toBe(3);
    // A marked square is protected from a stray flame.
    expect(tap(level, play, wrong, false).outcome).toBe('protected');
    ({ play } = tap(level, play, wrong, true));
    const result = tap(level, play, wrong, false);
    expect(result.outcome).toBe('wrong');
    expect(result.play.hearts).toBe(2);
  });

  it('always has a hint until the level is solved, and every hint is true', () => {
    let play: Play = newPlay(level);
    for (let step = 0; step < 200 && play.found < level.size; step += 1) {
      const hint = findHint(level, play, () => 0.5);
      expect(hint).not.toBeNull();
      if (hint!.kind.startsWith('only-in')) {
        expect(answer).toContain(hint!.square);
        play = tap(level, play, hint!.square, false).play;
      } else {
        expect(answer).not.toContain(hint!.square);
        play = { ...play, squares: play.squares.map((s, i) => (i === hint!.square ? 'ruled-out' : s)) };
      }
    }
    expect(play.found).toBe(level.size);
    expect(play.hearts).toBe(3);
  });

  it('finds a flame once a level', () => {
    const first = findFlame(level, newPlay(level), () => 0);
    expect(first).not.toBeNull();
    expect(answer).toContain(first!.square);
    expect(findFlame(level, first!.play)).toBeNull();
  });
});

describe('flame puzzle screen', () => {
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    window.localStorage.clear();
  });
  afterEach(cleanup);

  it('opens with how to play, then plays level 1 through to the end', () => {
    render(<FlamePuzzle onDone={() => undefined} shareUrl="https://example.test/exercises/flame-puzzle" />);
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    const level = generateLevel(1);
    const squares = screen.getAllByRole('gridcell');
    expect(squares.length).toBe(level.size ** 2);
    expect(screen.getByText(`0 of ${level.size} flames lit`)).toBeTruthy();
    level.solution.forEach((c, r) => fireEvent.click(squares[r * level.size + c]!));
    expect(screen.getByRole('heading', { name: 'Every flame is lit' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Next level' }));
    expect(screen.getByText(/^Level 2 ·/)).toBeTruthy();
  });

  it('says what a share sends before it sends anything', () => {
    render(<FlamePuzzle onDone={() => undefined} shareUrl="https://example.test/exercises/flame-puzzle" />);
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    fireEvent.click(screen.getByRole('button', { name: 'Share' }));
    expect(screen.getByText(/does not include your name/)).toBeTruthy();
    expect((screen.getByRole('textbox') as HTMLInputElement).value).toContain(
      'https://example.test/exercises/flame-puzzle',
    );
  });

  it('switches to Chinese and back', () => {
    render(<FlamePuzzle onDone={() => undefined} shareUrl="https://example.test/x" />);
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    fireEvent.click(screen.getByRole('button', { name: '中文' }));
    expect(screen.getByRole('heading', { name: '火苗谜题' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'English' }));
    expect(screen.getByRole('heading', { name: 'Flame puzzle' })).toBeTruthy();
  });
});
