/**
 * What a conversation says about itself on the list screen.
 *
 * The drawing gives each conversation three things: who it is with, when
 * it was last written in, and roughly what about. The first is a name.
 * The other two are judgements — about time, and about whether words may
 * be shown at all — so they are pure functions here, where the awkward
 * cases are ordinary tests rather than something to catch on a
 * screenshot.
 */

/**
 * When somebody last wrote, in the few words a right-aligned column has.
 *
 * Days, not hours and minutes. "11:42" tells a person nothing unless they
 * already know it was today, and a clock time on a message from three
 * weeks ago is actively misleading at a glance. Recent days are named
 * because a name is read faster than a date is decoded, and the year is
 * added only when it is not this one.
 *
 * `now` is passed in rather than read from the clock so that this can be
 * tested at all.
 */
export function whenLine(iso: string | null, now: Date): string {
  if (iso === null) return '';
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return '';
  /*
   * Compared as calendar days in the reader's own timezone, not as
   * elapsed milliseconds. A message sent at eleven last night is
   * "Yesterday" at nine this morning, and "10 hours ago" is not what
   * anybody means by it.
   */
  const midnight = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((midnight(now) - midnight(at)) / 86_400_000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  // Named weekdays only while the name is unambiguous. On the eighth day
  // "Tuesday" would mean either of two Tuesdays.
  if (days > 1 && days < 7) return at.toLocaleDateString(undefined, { weekday: 'long' });
  const sameYear = at.getFullYear() === now.getFullYear();
  return at.toLocaleDateString(
    undefined,
    sameYear ? { day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short', year: 'numeric' },
  );
}

/**
 * The second line: what was last said, or why nothing is shown.
 *
 * A conversation with no preview is not left blank. Blank reads as a
 * fault in the page, and the reasons a preview is withheld are all worth
 * saying — an unsent draft of your own is something you might want to go
 * back and finish.
 *
 * Nothing here decides whether the words may be shown. The server sends
 * the words or does not, by the same rule the conversation itself
 * applies, and this only words the absence.
 */
export function previewLine(thread: {
  lastMessageState: string | null;
  lastMessageFromMe: boolean | null;
  lastMessagePreview: string | null;
}): string {
  if (thread.lastMessagePreview !== null) return thread.lastMessagePreview;
  if (thread.lastMessageState === null) return 'Nothing has been written yet.';
  if (thread.lastMessageState === 'Draft') {
    return thread.lastMessageFromMe === true
      ? 'You have started something here and have not sent it.'
      : 'Nothing has been sent here yet.';
  }
  /*
   * A state that is neither nothing, nor a draft, nor something the
   * server was willing to quote. Nothing can currently write such a state
   * (B-32), and when something does — withdrawal, most likely — this line
   * says the true thing without claiming to know which.
   */
  return 'The last message here is not shown.';
}
