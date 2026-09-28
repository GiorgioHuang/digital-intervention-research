/**
 * The flame puzzle: levels, and the rules of play.
 *
 * A square board is split into as many coloured regions as it has rows.
 * One flame goes in each region, one in each row and one in each column,
 * and no two flames may touch, diagonals included.
 *
 * Levels are generated rather than stored, from a seed that is the level
 * number, so level 11 is the same board on every device and a shared link
 * to "level 11" names the same thing for both people. Every level is
 * checked to have exactly one solution: a puzzle with two answers turns
 * the last few squares into a guess, and a wrong guess costs a heart.
 *
 * Pure on purpose, like `routes.ts`: the screen is a thin view over these
 * functions, so the rules are ordinary tests rather than a browser drive.
 */

export interface Level {
  n: number;
  size: number;
  /** Region index of each square, row by row. */
  regions: number[];
  /** The column of the flame in each row. */
  solution: number[];
}

/** What a square shows. `ruled-out` is crossed out by the puzzle, `mark` by the person. */
export type Square = '' | 'flame' | 'ruled-out' | 'wrong' | 'mark';

export interface Play {
  n: number;
  squares: Square[];
  hearts: number;
  found: number;
  /** "Find a flame" uses left on this level. */
  finds: number;
}

export const HEARTS = 3;
export const FINDS_PER_LEVEL = 1;
export const STARTING_HINTS = 3;
export const MAX_HINTS = 9;

export function levelSize(n: number): number {
  return n <= 2 ? 5 : n <= 6 ? 6 : n <= 14 ? 7 : n <= 29 ? 8 : 9;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], rnd: () => number): T[] {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rnd() * (i + 1));
    [items[i], items[j]] = [items[j]!, items[i]!];
  }
  return items;
}

const range = (n: number) => [...Array(n).keys()];
const SIDES: [number, number][] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

/** One flame per row and column, none touching. */
function randomPlacement(size: number, rnd: () => number): number[] {
  const cols: number[] = [];
  const used = new Array<boolean>(size).fill(false);
  const go = (r: number): boolean => {
    if (r === size) return true;
    for (const c of shuffle(range(size), rnd)) {
      if (used[c] || (r > 0 && Math.abs(cols[r - 1]! - c) < 2)) continue;
      used[c] = true;
      cols[r] = c;
      if (go(r + 1)) return true;
      used[c] = false;
    }
    return false;
  };
  go(0);
  return cols;
}

/** Up to `limit` solutions of a board, each as a column per row. */
export function solutions(size: number, regions: number[], limit: number): number[][] {
  const out: number[][] = [];
  const cols = new Array<number>(size);
  const usedCol = new Array<boolean>(size).fill(false);
  const usedRegion = new Array<boolean>(size).fill(false);
  const go = (r: number) => {
    if (r === size) {
      out.push(cols.slice());
      return;
    }
    for (let c = 0; c < size && out.length < limit; c += 1) {
      const g = regions[r * size + c]!;
      if (usedCol[c] || usedRegion[g] || (r > 0 && Math.abs(cols[r - 1]! - c) < 2)) continue;
      usedCol[c] = usedRegion[g] = true;
      cols[r] = c;
      go(r + 1);
      usedCol[c] = usedRegion[g] = false;
    }
  };
  go(0);
  return out;
}

function growRegions(size: number, solution: number[], rnd: () => number): number[] {
  const regions = new Array<number>(size * size).fill(-1);
  const frontier: number[] = [];
  solution.forEach((c, r) => {
    regions[r * size + c] = r;
    frontier.push(r * size + c);
  });
  let left = size * size - size;
  while (left > 0) {
    const i = Math.floor(rnd() * frontier.length);
    const cell = frontier[i]!;
    const r = Math.floor(cell / size);
    const c = cell % size;
    const open = SIDES.map(([dr, dc]) => [r + dr, c + dc] as const).filter(
      ([a, b]) => a >= 0 && b >= 0 && a < size && b < size && regions[a * size + b]! < 0,
    );
    if (open.length === 0) {
      frontier.splice(i, 1);
      continue;
    }
    const [a, b] = open[Math.floor(rnd() * open.length)]!;
    regions[a * size + b] = regions[cell]!;
    frontier.push(a * size + b);
    left -= 1;
  }
  return regions;
}

/** Whether region `g` stays in one piece once `skip` leaves it. */
function connectedWithout(size: number, regions: number[], g: number, skip: number): boolean {
  const cells = range(size * size).filter((i) => regions[i] === g && i !== skip);
  if (cells.length === 0) return false;
  const seen = new Set([cells[0]!]);
  const stack = [cells[0]!];
  while (stack.length > 0) {
    const x = stack.pop()!;
    const r = Math.floor(x / size);
    const c = x % size;
    for (const [dr, dc] of SIDES) {
      const a = r + dr;
      const b = c + dc;
      if (a < 0 || b < 0 || a >= size || b >= size) continue;
      const y = a * size + b;
      if (y !== skip && regions[y] === g && !seen.has(y)) {
        seen.add(y);
        stack.push(y);
      }
    }
  }
  return seen.size === cells.length;
}

const cache = new Map<number, Level>();

/**
 * Level `n`, the same on every device.
 *
 * Regions are grown outward from a hidden answer, then squares that a
 * rival answer depends on are moved into a neighbouring region until the
 * hidden answer is the only one left.
 */
export function generateLevel(n: number): Level {
  const hit = cache.get(n);
  if (hit) return hit;
  const size = levelSize(n);
  const rnd = mulberry32(n * 7919 + 17);
  for (let attempt = 0; attempt < 200; attempt += 1) {
    const solution = randomPlacement(size, rnd);
    const regions = growRegions(size, solution, rnd);
    const answer = new Set(solution.map((c, r) => r * size + c));
    let found = solutions(size, regions, 40);
    for (let step = 0; step < 400 && found.length > 1; step += 1) {
      const rival = found.find((s) => s.some((c, r) => c !== solution[r]))!;
      const candidates = rival.map((c, r) => r * size + c).filter((x) => !answer.has(x));
      const cell = candidates[Math.floor(rnd() * candidates.length)]!;
      const r = Math.floor(cell / size);
      const c = cell % size;
      const from = regions[cell]!;
      const to = shuffle(
        SIDES.map(([dr, dc]) => [r + dr, c + dc] as const)
          .filter(([a, b]) => a >= 0 && b >= 0 && a < size && b < size)
          .map(([a, b]) => regions[a * size + b]!)
          .filter((g) => g !== from),
        rnd,
      );
      if (to.length === 0 || !connectedWithout(size, regions, from, cell)) continue;
      regions[cell] = to[0]!;
      const next = solutions(size, regions, 40);
      if (next.length >= 1 && next.length <= found.length) found = next;
      else regions[cell] = from;
    }
    if (found.length === 1) {
      const level = { n, size, regions, solution };
      cache.set(n, level);
      return level;
    }
  }
  throw new Error(`level ${n} could not be generated`);
}

export function newPlay(level: Level): Play {
  return { n: level.n, squares: new Array<Square>(level.size ** 2).fill(''), hearts: HEARTS, found: 0, finds: FINDS_PER_LEVEL };
}

export const isAnswer = (level: Level, i: number) => level.solution[Math.floor(i / level.size)] === i % level.size;

/** Every square a flame at `i` rules out: its row, its column, its region and its eight neighbours. */
export function ruledOutBy(level: Level, i: number): number[] {
  const { size, regions } = level;
  const r = Math.floor(i / size);
  const c = i % size;
  return range(size * size).filter((j) => {
    if (j === i) return false;
    const a = Math.floor(j / size);
    const b = j % size;
    return a === r || b === c || regions[j] === regions[i] || (Math.abs(a - r) <= 1 && Math.abs(b - c) <= 1);
  });
}

function light(level: Level, play: Play, i: number): Play {
  const squares = play.squares.slice();
  squares[i] = 'flame';
  for (const j of ruledOutBy(level, i)) if (squares[j] === '' || squares[j] === 'mark') squares[j] = 'ruled-out';
  return { ...play, squares, found: play.found + 1 };
}

export type TapOutcome = 'flame' | 'wrong' | 'marked' | 'unmarked' | 'protected' | 'nothing';

/**
 * A tap on square `i`. In mark mode it pencils or erases a cross; otherwise
 * it tries a flame there, and a wrong square costs a heart.
 */
export function tap(level: Level, play: Play, i: number, marking: boolean): { play: Play; outcome: TapOutcome } {
  const now = play.squares[i];
  if (play.hearts <= 0 || play.found === level.size) return { play, outcome: 'nothing' };
  if (marking) {
    if (now !== '' && now !== 'mark') return { play, outcome: 'nothing' };
    const squares = play.squares.slice();
    squares[i] = now === '' ? 'mark' : '';
    return { play: { ...play, squares }, outcome: now === '' ? 'marked' : 'unmarked' };
  }
  if (now === 'mark') return { play, outcome: 'protected' };
  if (now !== '') return { play, outcome: 'nothing' };
  if (isAnswer(level, i)) return { play: light(level, play, i), outcome: 'flame' };
  const squares = play.squares.slice();
  squares[i] = 'wrong';
  return { play: { ...play, squares, hearts: play.hearts - 1 }, outcome: 'wrong' };
}

export type Hint =
  | { kind: 'only-in-region' | 'only-in-row' | 'only-in-column'; square: number }
  | { kind: 'would-block' | 'ruled-out'; square: number };

const open = (play: Play, i: number) => play.squares[i] === '' || play.squares[i] === 'mark';

/**
 * One step of reasoning, the simplest available.
 *
 * First a region, row or column with only one open square left — that
 * square is shown, not filled, so the person places the flame. Failing
 * that, a square whose flame would leave some region, row or column with
 * nowhere to go, which is crossed out. Failing that, any wrong square.
 */
export function findHint(level: Level, play: Play, rnd: () => number = Math.random): Hint | null {
  const { size, regions } = level;
  const groups: { kind: 'only-in-region' | 'only-in-row' | 'only-in-column'; squares: number[] }[] = [
    ...range(size).map((g) => ({ kind: 'only-in-region' as const, squares: range(size * size).filter((i) => regions[i] === g) })),
    ...range(size).map((r) => ({ kind: 'only-in-row' as const, squares: range(size).map((c) => r * size + c) })),
    ...range(size).map((c) => ({ kind: 'only-in-column' as const, squares: range(size).map((r) => r * size + c) })),
  ];
  const unsolved = groups.filter((g) => !g.squares.some((i) => play.squares[i] === 'flame'));
  for (const g of unsolved) {
    const left = g.squares.filter((i) => open(play, i));
    if (left.length === 1) return { kind: g.kind, square: left[0]! };
  }
  const wrong = range(size * size).filter((i) => open(play, i) && !isAnswer(level, i));
  for (const i of wrong) {
    const blocked = new Set([i, ...ruledOutBy(level, i)]);
    const strands = unsolved.some(
      (g) => !g.squares.includes(i) && g.squares.filter((j) => open(play, j)).every((j) => blocked.has(j)),
    );
    if (strands) return { kind: 'would-block', square: i };
  }
  if (wrong.length === 0) return null;
  return { kind: 'ruled-out', square: wrong[Math.floor(rnd() * wrong.length)]! };
}

/** Crosses out a hinted square; a square that was only pointed at is left for the person. */
export function applyHint(play: Play, hint: Hint): Play {
  if (hint.kind !== 'would-block' && hint.kind !== 'ruled-out') return play;
  const squares = play.squares.slice();
  squares[hint.square] = 'ruled-out';
  return { ...play, squares };
}

/** "Find a flame": lights one flame not yet found. */
export function findFlame(level: Level, play: Play, rnd: () => number = Math.random): { play: Play; square: number } | null {
  if (play.finds <= 0 || play.hearts <= 0) return null;
  const left = level.solution.map((c, r) => r * level.size + c).filter((i) => play.squares[i] !== 'flame');
  if (left.length === 0) return null;
  const square = left[Math.floor(rnd() * left.length)]!;
  return { play: { ...light(level, play, square), finds: play.finds - 1 }, square };
}

export const solved = (level: Level, play: Play) => play.found === level.size;
export const failed = (play: Play) => play.hearts <= 0;
/** Stars for a solved level: one per heart kept. */
export const starsFor = (play: Play) => Math.max(1, play.hearts);
