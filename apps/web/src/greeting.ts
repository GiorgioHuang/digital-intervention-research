/**
 * "Good morning" — the handoff's H1 for Home.
 *
 * A pure function of an instant, taking the time rather than reading it.
 *
 * This is the D-103 lesson applied before the fact rather than after. Nine
 * tests once failed on unchanged code four days after they were written,
 * because a clock that governed only half of what it should agreed with
 * reality until it did not. A greeting is the same shape of trap in
 * miniature: a test that renders Home and asserts "Good morning" passes
 * every morning and fails every afternoon, and the failure would look like
 * a defect in Home. So the boundaries are decided here, tested at fixed
 * instants, and the component supplies `new Date()` at the one place where
 * reading the real clock is the point.
 *
 * The clock is the participant's own — this greets somebody sitting in
 * their kitchen, so their local time is the right time and the server's is
 * not.
 */
export const MORNING_UNTIL = 12;
export const AFTERNOON_UNTIL = 18;

export function greeting(at: Date): string {
  const hour = at.getHours();
  if (hour < MORNING_UNTIL) return 'Good morning';
  if (hour < AFTERNOON_UNTIL) return 'Good afternoon';
  return 'Good evening';
}

/**
 * The handoff greets by name — "Good morning, Margaret". This platform does
 * not know the name: a participant session is `{actorId, participantId}`
 * and there is no query that returns what a participant is called (gap
 * B-16). Rather than greet a stranger by an identifier, or invent a
 * placeholder that would read as somebody's name, the greeting stands on
 * its own until a name exists to use. Recorded so the missing half is a
 * known absence and not an oversight.
 */
export const greetingFor = (at: Date, name: string | null): string =>
  name === null ? greeting(at) : `${greeting(at)}, ${name}`;
