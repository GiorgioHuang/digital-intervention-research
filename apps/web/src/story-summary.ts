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
 * Who can read them.
 *
 * The drawing states "Only you can see them" flatly. This used to derive
 * a different sentence the moment one piece was shared — "You have shared
 * one of them" — on the reasoning that saying "only you" over something
 * somebody else could read is worse than saying nothing.
 *
 * The reasoning was right and the premise was wrong. Nobody else can read
 * any of them: `life-story.view-own` is `ownerOnly`, `getMyLifeStory` is
 * the only query that exists, and no route or screen reads another
 * person's story (B-30). Setting a memory to Community records a choice
 * and shows it to nobody. So the drawing's flat sentence turns out to be
 * the true one, and what this adds is the part it cannot say on its own:
 * that a choice was made and has not taken effect.
 *
 * Both halves are needed. "Only you can see them" alone would hide that
 * somebody has asked to share; the count alone would say sharing happened.
 */
export function whoCanSee(visibilities: readonly string[]): string {
  if (visibilities.length === 0) return '';
  const one = visibilities.length === 1;
  const seen = one ? 'Only you can see it.' : 'Only you can see them.';
  const shared = visibilities.filter((v) => v !== PRIVATE).length;
  if (shared === 0) return seen;
  if (shared === visibilities.length) {
    return one ? `${seen} You have chosen to share it.` : `${seen} You have chosen to share them all.`;
  }
  return shared === 1
    ? `${seen} You have chosen to share one of them.`
    : `${seen} You have chosen to share ${String(shared)} of them.`;
}
