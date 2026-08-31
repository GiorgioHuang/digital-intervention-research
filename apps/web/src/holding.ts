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
   * Why it is out of copyright **in Canada**, in words: the author's death
   * year, or the traditional/no-author basis. Required whenever `source`
   * is given.
   */
  readonly publicDomainBecause?: string;
  /**
   * The same question for the **United States**, answered separately and
   * required for every quotation.
   *
   * These are two different answers and this project has already met a
   * case where they diverged: Anne of Ingleside is public domain in Canada
   * and, its US term having been renewed, is under copyright there until
   * 1 January 2035. Canada runs on the author's death; the United States,
   * for anything published from 1930 to 1963, ran on whether the term was
   * renewed. A work published before 1930 is clear there outright, which
   * is the easy answer and the one every quotation below relies on.
   *
   * It is a required field rather than a note because "public domain" said
   * without a country is the exact shape of the mistake — and this
   * deployment is reachable from anywhere, so the Canadian answer is never
   * the whole answer.
   */
  readonly unitedStatesBecause?: string;
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
  // Quoted lines, supplied by the owner (2026-08-31).
  //
  // `wordingComparedWith` records who compared the words with the text and
  // says so plainly, because this workspace still cannot reach Project
  // Gutenberg, Wikisource, Standard Ebooks or the Internet Archive. It is
  // the owner's verification, not mine, and the field says which so that
  // the next person to read it knows what was and was not done.
  //
  // Every author here was already public domain in Canada under the old
  // life + 50 term before the 2022 extension, so the extension did not
  // revive anything: Carman (d. 1929) from 1980, Montgomery (d. 1942) from
  // 1993, Service (d. 1958) from 2009.
  //
  // The United States is a separate question and it is the one that
  // decided this list, because the deployment is reachable from anywhere.
  // A work published before 1930 is public domain there outright; a work
  // published from 1930 on depended on renewal and can still be in
  // copyright. Everything below is pre-1930 publication and clear in both
  // countries. The four lines from Anne of Ingleside (1939) are not, and
  // are held out until somebody checks the US renewal record — see the
  // note after this list.
  // ---------------------------------------------------------------------
  {
    text: 'There is something in the autumn that is native to my blood.',
    source: 'Bliss Carman, “A Vagabond Song”',
    publicDomainBecause: 'Carman died in 1929; the poem was published in the 1890s, well before 1930',
    unitedStatesBecause: 'published in the 1890s — before 1930, so public domain in the United States outright',
    wordingComparedWith: 'the text, by the owner (2026-08-31)',
  },
  {
    text: 'My heart is like a rhyme.',
    source: 'Bliss Carman, “A Vagabond Song”',
    publicDomainBecause: 'Carman died in 1929; the poem was published in the 1890s, well before 1930',
    unitedStatesBecause: 'published in the 1890s — before 1930, so public domain in the United States outright',
    wordingComparedWith: 'the text, by the owner (2026-08-31)',
  },
  {
    text: 'His were songs so full of a wholesome laughter.',
    source: 'L. M. Montgomery, “The Poet”, The Watchman and Other Poems (1916)',
    publicDomainBecause: 'Montgomery died in 1942; published 1916, before 1930',
    unitedStatesBecause: 'published 1916 — before 1930, so public domain in the United States outright',
    wordingComparedWith: 'the text, by the owner (2026-08-31)',
  },
  {
    text: 'The Arctic trails have their secret tales.',
    source: 'Robert W. Service, “The Cremation of Sam McGee” (1907)',
    publicDomainBecause: 'Service died in 1958; published 1907, before 1930',
    unitedStatesBecause: 'published 1907 — before 1930, so public domain in the United States outright',
    wordingComparedWith: 'the text, by the owner (2026-08-31)',
  },
];

/**
 * Held out until 2035, or until somebody licenses them.
 *
 * The owner supplied four more lines from L. M. Montgomery's *Anne of
 * Ingleside* (1939). They are the warmest of the ten, and they are public
 * domain in Canada — Montgomery died in 1942, so the work passed out of
 * copyright here in 1993 under the old life + 50 term, before the 2022
 * extension, which revived nothing.
 *
 * They are not in the product because the United States is a separate
 * question with a different answer. A 1939 work kept its US copyright if
 * the term was renewed; this one's was, so it runs to **1 January 2035**
 * (owner, 2026-08-31). This deployment is reachable from anywhere.
 *
 * That is the finding, and it is why `unitedStatesBecause` above is a
 * required field rather than a comment: the four lines looked cleared
 * because they were cleared in the country the project is run from, and
 * nothing in the code would have asked the second question. Now a
 * quotation that has not answered it is withheld from the screen.
 *
 * The remaining routes are a licence from the rights holder, or the
 * owner's own decision that a single attributed sentence is fair use —
 * which is a strong argument and still not the same as being cleared.
 * Neither is a code change; both are somebody's signature.
 */

/**
 * The lines that may actually be shown.
 *
 * A quoted line whose wording has not been compared with its text is
 * withheld rather than shown, so an entry added in good faith and left
 * half-done cannot reach a participant by simply being forgotten about.
 */
export function holdingLines(all: readonly HoldingLine[] = HOLDING_LINES): readonly HoldingLine[] {
  return all.filter(
    (l) => l.source === null || (l.wordingComparedWith !== undefined && l.unitedStatesBecause !== undefined),
  );
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
