/**
 * What the screen says while the session is being found.
 *
 * It said "Just a moment." — filler, and the owner asked for something
 * worth reading (2026-08-31). These are the moments when somebody is
 * looking at an otherwise empty page, so the sentence they get should be
 * worth the glance.
 *
 * There are two kinds of sentence this screen can carry, and the type
 * keeps them apart because they carry different risks.
 *
 * **The platform's own words** (`source: null`). Every one of these is
 * kept by something in this codebase rather than asserted on a page. That
 * is the whole constraint: a loading screen is the easiest place in an
 * application to put a comforting sentence with nothing behind it,
 * because nobody reviews it.
 *
 * **Somebody else's words** (`source` given). The owner asked for lines
 * that would take an older Canadian back to the years they grew up in
 * (2026-08-31), which means published writing, which means two things
 * have to be true before a line goes in, and neither may be assumed:
 *
 *   1. It is out of copyright. Canada's term became life + 70 at the end
 *      of 2022 without reviving anything already expired, so an author who
 *      died on or before 31 December 1971 is in the public domain here.
 *      Name the author and the death year in the entry, so the claim can
 *      be checked rather than remembered.
 *   2. **The wording has been compared with the text.** Not recalled —
 *      compared. A line that is nearly right, printed under a real
 *      writer's name, is a misquotation published in their name, and this
 *      screen would repeat it to every participant on every visit.
 *
 * Nothing quoted may ship until both are done, and `holdingLines` below
 * withholds any entry that has not been marked as compared. That is
 * deliberate: the failure this guards against is not a wrong line, it is a
 * plausible line that nobody got round to checking.
 */
export interface HoldingLine {
  readonly text: string;
  /**
   * Where the words come from, for a line that is not this platform's own:
   * author, work and year, in the form a reader could look up. `null` means
   * the platform wrote it, and then the bar is the one above — it must be
   * kept by the code.
   */
  readonly source: string | null;
  /**
   * Why it is out of copyright, in words: the author's death year for a
   * Canadian public-domain claim, or the traditional/no-author basis.
   * Required whenever `source` is given.
   */
  readonly publicDomainBecause?: string;
  /**
   * Set only once the wording has been compared with the text itself, and
   * says against what. Unset means "not yet compared", and an entry that
   * has not been compared is never shown.
   */
  readonly wordingComparedWith?: string;
}

export const HOLDING_LINES: readonly HoldingLine[] = [
  {
    // The consent projection the permission engine reads: nothing is
    // visible to anybody else until a decision says so.
    text: 'Everything you write is private until you decide otherwise.',
    source: null,
  },
  {
    // Owner-only contribution review (m17): a contribution offered by a
    // supporter waits for the participant and is never merged for them.
    text: 'Nothing is added to your story unless you accept it.',
    source: null,
  },
  {
    // There is no advertising path in the platform, and no third-party sale.
    text: 'We never sell your information.',
    source: null,
  },
  {
    // Consent withdrawal and relationship revocation are both built, and
    // both take effect at the permission engine rather than in a report.
    //
    // Says "withdrawn later", not "changed back": withdrawal stops the
    // platform using the information from that point, and the panel is
    // explicit that research datasets already locked are not rewritten.
    // "You can change your mind about any of it" would promise, on a
    // loading screen where nobody would check it, the one thing this
    // platform is careful never to promise anywhere else.
    text: 'Any choice you make here can be withdrawn later.',
    source: null,
  },
  {
    // The life-story item is authored by the participant; a supporter's
    // account of a memory is a separate, attributed contribution.
    text: 'Your story stays in your own words.',
    source: null,
  },
  // ---------------------------------------------------------------------
  // Quoted lines go here.
  //
  // The owner chose public-domain Canadian writing that this generation
  // read at school (2026-08-31). Montgomery (d. 1942), Leacock (d. 1944),
  // Service (d. 1958) and Johnson (d. 1913) are all out of copyright in
  // Canada, and — published before 1930 — in the United States too.
  //
  // None are here yet, and the reason is recorded rather than left as an
  // absence somebody fills in from memory later: this workspace cannot
  // reach Project Gutenberg, Wikisource, Standard Ebooks or the Internet
  // Archive, so no wording could be compared with a text. Writing them
  // from recall would have put an unverified quotation under a named
  // author into the product, which is the thing the rules above exist to
  // prevent.
  //
  // To add one: paste the line exactly as printed, give `source` and
  // `publicDomainBecause`, and set `wordingComparedWith` to the edition
  // or page it was compared against.
  // ---------------------------------------------------------------------
];

/**
 * The lines that may actually be shown.
 *
 * A quoted line whose wording has not been compared with its text is
 * withheld rather than shown, so an entry added in good faith and left
 * half-done cannot reach a participant by simply being forgotten about.
 */
export function holdingLines(all: readonly HoldingLine[] = HOLDING_LINES): readonly HoldingLine[] {
  return all.filter((l) => l.source === null || l.wordingComparedWith !== undefined);
}

/**
 * Which line to show, from a number in `[0, 1)`.
 *
 * The randomness is the caller's — `Math.random()` here would put a
 * non-deterministic value inside the thing under test, and this project
 * has already been caught once by a clock that only governed writes
 * (D-103). As a total function over a number it is testable at fixed
 * inputs, including the inputs that should never arrive.
 *
 * Out-of-range values are clamped rather than rejected. A caller that gets
 * this wrong should still see a sentence: the alternative is a blank line
 * or a crash on the screen somebody reaches before anything else.
 */
export function holdingLine(at: number): HoldingLine {
  const lines = holdingLines();
  const count = lines.length;
  const raw = Number.isFinite(at) ? Math.floor(at * count) : 0;
  const index = Math.min(Math.max(raw, 0), count - 1);
  return lines[index] as HoldingLine;
}
