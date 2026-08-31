/**
 * The line under "Your life story".
 *
 * The drawing writes it as "Twelve pieces so far. Only you can see them."
 * Both halves are claims about the person's own story, so both are counted
 * rather than asserted: the second sentence in particular is a statement
 * about who can read their memories, and a screen that says "only you"
 * over an entry somebody else can read is worse than saying nothing.
 *
 * Pure, so the awkward numbers — none, one, and the boundary where words
 * give way to figures — are ordinary tests rather than something to notice
 * on a screenshot.
 */

/** What counts as nobody else being able to read it. */
const PRIVATE = 'Private';

const WORDS = [
  'No',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Eleven',
  'Twelve',
];

/**
 * "Twelve pieces so far." — spelled out as the drawing spells it, and only
 * as far as the drawing goes. Past twelve a word is harder to read at a
 * glance than a figure, which is the opposite of what this audience needs,
 * so the figure takes over.
 */
export function piecesSoFar(count: number): string {
  if (count <= 0) return 'Nothing here yet.';
  const n = count < WORDS.length ? WORDS[count]! : String(count);
  return `${n} ${count === 1 ? 'piece' : 'pieces'} so far.`;
}

/**
 * Who can read them, counted from the entries themselves.
 *
 * The drawing states "Only you can see them" flatly. It is true of a story
 * that is all private and false the moment one piece is shared, and this
 * is not a detail to be approximate about — so the sentence is derived,
 * and when something is shared it says how much rather than going quiet.
 */
export function whoCanSee(visibilities: readonly string[]): string {
  if (visibilities.length === 0) return '';
  const shared = visibilities.filter((v) => v !== PRIVATE).length;
  if (shared === 0) return 'Only you can see them.';
  if (shared === visibilities.length) {
    return visibilities.length === 1 ? 'You have shared it.' : 'You have shared all of them.';
  }
  return shared === 1 ? 'You have shared one of them.' : `You have shared ${String(shared)} of them.`;
}
