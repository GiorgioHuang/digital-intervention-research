/**
 * What the screen says while the session is being found.
 *
 * It said "Just a moment." — filler, and the owner asked for something
 * worth reading (2026-08-31). These are the moments when somebody is
 * looking at an otherwise empty page, so the sentence they get is one of
 * the things this project actually promises them.
 *
 * **Every line here is kept by something in the codebase, not asserted on
 * a page.** That is the whole constraint, and it is why the list is short:
 * a reassuring sentence with nothing behind it is the failure mode this
 * platform is built against, and a loading screen is the easiest place in
 * an application to put one, because nobody reviews it.
 *
 * Clause 5 of the wording constitution (§E.0) applies with particular
 * force here: no line may suggest the wait is nearly over. "Almost done"
 * and "it should be fine" are forbidden, and so is anything that means
 * them. None of these say anything about the wait at all — which is also
 * why the loading fact itself is announced separately rather than being
 * folded into whichever sentence came up.
 */
export const HOLDING_LINES: readonly string[] = [
  // The consent projection the permission engine reads: nothing is visible
  // to anybody else until a decision says so.
  'Everything you write is private until you decide otherwise.',
  // Owner-only contribution review (m17): a contribution offered by a
  // supporter waits for the participant and is never merged for them.
  'Nothing is added to your story unless you accept it.',
  // There is no advertising path in the platform, and no third-party sale.
  'We never sell your information.',
  // Consent withdrawal and relationship revocation are both built, and
  // both take effect at the permission engine rather than in a report.
  //
  // Says "withdrawn later", not "changed back": withdrawal stops the
  // platform using the information from that point, and the panel is
  // explicit that research datasets already locked are not rewritten.
  // "You can change your mind about any of it" would promise, on a
  // loading screen where nobody would check it, the one thing this
  // platform is careful never to promise anywhere else.
  'Any choice you make here can be withdrawn later.',
  // The life-story item is authored by the participant; a supporter's
  // account of a memory is a separate, attributed contribution.
  'Your story stays in your own words.',
];

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
export function holdingLine(at: number): string {
  const count = HOLDING_LINES.length;
  const raw = Number.isFinite(at) ? Math.floor(at * count) : 0;
  const index = Math.min(Math.max(raw, 0), count - 1);
  return HOLDING_LINES[index] as string;
}
