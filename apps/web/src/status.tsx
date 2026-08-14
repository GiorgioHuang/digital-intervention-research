import { DELIVERY_STATE_LABELS } from './api.js';

/**
 * One table deciding how every status looks.
 *
 * Until now a status was a bare sentence: `<p>Status: {label}</p>`. The
 * wording was careful — "Accepted by the delivery service (not received by
 * the person yet)" is exactly right — but a wall of identical grey
 * sentences makes the reader parse each one to find out whether anything
 * is wrong, which is the work a status is supposed to save them.
 *
 * The owner's rules, and what each is protecting:
 *
 * - **`Provider Accepted` and `Delivered` must not share a green.** They
 *   are the two states most easily confused and the confusion is the
 *   dangerous direction: one means a machine took the message, the other
 *   means it reached a person. Accepted is therefore in-progress blue, and
 *   green is kept for the single state where somebody actually received
 *   something.
 * - **`Delivery Unknown` is neutral or warning, never error.** "We do not
 *   know" and "it failed" are different facts, and showing the first as
 *   the second tells somebody their message definitely did not arrive when
 *   the truth is that nobody can say. On a platform where a message can be
 *   an older person reaching out, that is not a cosmetic error.
 * - **`Draft`, `Pending`, `Expired` are grey or blue-grey.** Nothing has
 *   gone wrong in any of them; they are simply not finished.
 * - **`Blocked` is a low-saturation red, never a large bright one.** It is
 *   a boundary, not an alarm.
 *
 * Colour is the third cue, never the first: every entry carries a mark and
 * words, so the whole table still reads in greyscale, in the low-colour
 * mode, and for anyone who does not perceive the hue difference.
 */
export type StatusTone =
  | 'draft'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger'
  | 'safety'
  | 'neutral';

export interface StatusPresentation {
  tone: StatusTone;
  /** Aria-hidden mark, so the state survives greyscale and low-colour mode. */
  mark: string;
  words: string;
}

/**
 * Delivery, in the order it actually happens.
 *
 * The words are the ones already agreed (Doc 20 §161) and are not restated
 * here — they come from `DELIVERY_STATE_LABELS`, so there is one place to
 * change what a status says, and this table only decides how it looks.
 */
export const DELIVERY_STATUS: Record<string, StatusPresentation> = {
  /* Not sent: the participant still holds it. Nothing has gone wrong. */
  'Not Submitted': { tone: 'draft', mark: '○', words: DELIVERY_STATE_LABELS['Not Submitted']! },
  Queued: { tone: 'draft', mark: '◌', words: DELIVERY_STATE_LABELS['Queued']! },
  /* On its way. Blue, because in-progress is not an achievement. */
  'Sent to Provider': { tone: 'info', mark: '→', words: DELIVERY_STATE_LABELS['Sent to Provider']! },
  /* NOT green. A delivery service accepting a message is a fact about a
     machine; the person it is addressed to may never see it. */
  'Provider Accepted': {
    tone: 'info',
    mark: '→',
    words: DELIVERY_STATE_LABELS['Provider Accepted']!,
  },
  /* The only green in the table: somebody received something. */
  Delivered: { tone: 'success', mark: '✓', words: DELIVERY_STATE_LABELS['Delivered']! },
  'Delivery Failed': { tone: 'danger', mark: '⬟', words: DELIVERY_STATE_LABELS['Delivery Failed']! },
  /* Warning, never danger: nobody knows, and "we do not know" must not be
     dressed as "it failed". */
  'Delivery Unknown': {
    tone: 'warning',
    mark: '△',
    words: DELIVERY_STATE_LABELS['Delivery Unknown']!,
  },
};

/**
 * The generic not-finished-yet states, wherever they appear.
 *
 * Kept separate from delivery because these words belong to many things —
 * a consent, an export, a post, an invitation — and all of them mean the
 * same thing to a reader: this is not done, and that is not a problem.
 */
export const LIFECYCLE_STATUS: Record<string, StatusPresentation> = {
  Draft: { tone: 'draft', mark: '○', words: 'Draft — not sent yet' },
  Pending: { tone: 'draft', mark: '◌', words: 'Waiting' },
  Expired: { tone: 'draft', mark: '◌', words: 'Expired' },
  /* A boundary somebody set on purpose, not a fault. Low-saturation red
     and never a filled panel — see the note above. */
  Blocked: { tone: 'danger', mark: '⊘', words: 'Blocked' },
};

/**
 * A status as a line of its own: mark, words, and a coloured edge.
 *
 * Not a pill. Several of these sentences are a full clause — "Accepted by
 * the delivery service (not received by the person yet)" — and a pill
 * shape would either truncate the clause or stretch into a lozenge the
 * width of the screen. The clause is the part that keeps the status
 * honest, so the shape gives way to it.
 */
export function StatusLine({ status }: { status: StatusPresentation }) {
  return (
    <p className={`state state--${status.tone}`}>
      <span aria-hidden="true">{status.mark}</span> {status.words}
    </p>
  );
}

/** Falls back to the raw value rather than hiding a state nobody mapped. */
export function deliveryStatus(state: string): StatusPresentation {
  return DELIVERY_STATUS[state] ?? { tone: 'neutral', mark: '·', words: state };
}

/**
 * Safety, graded inside its own family rather than escalated into red.
 *
 * The owner asked for a confirmed SafetyEvent to use Error. The design
 * system forbids it (§A.1.3, D-8): danger means a destructive action or a
 * blocked operation, and safety has its own family precisely so that a
 * person being unwell never looks like the software breaking. The owner
 * ruled to keep blue.
 *
 * So the gradation the rule was reaching for is built inside the family
 * instead, which it turns out to need anyway — "somebody mentioned a
 * concern", "a reviewer confirmed it", and "it was dealt with weeks ago"
 * are three different situations that were all rendered identically:
 *
 * - An unreviewed **signal** is warning. Nobody has confirmed anything
 *   yet, and dressing an unreviewed concern as a confirmed event would
 *   overstate what is known about a person.
 * - A confirmed **event that still needs somebody** is the safety family
 *   at full strength: blue, marked, and named in words.
 * - A confirmed event that has been **resolved or closed** goes quiet.
 *   Leaving it loud makes a screen of finished business look like a
 *   screen of emergencies, and a reviewer who sees ten alarms every day
 *   stops seeing any of them.
 *
 * Red appears nowhere in this table. That is the point of it.
 */
export const SAFETY_SIGNAL_STATUS: StatusPresentation = {
  tone: 'warning',
  mark: '△',
  words: 'Reported, not yet reviewed',
};

export const SAFETY_EVENT_STATUS: Record<string, StatusPresentation> = {
  Open: { tone: 'safety', mark: '⬡', words: 'Confirmed — nobody has picked it up yet' },
  'In Review': { tone: 'safety', mark: '⬡', words: 'Someone is looking at it' },
  'Action Required': { tone: 'safety', mark: '⬡', words: 'Something needs doing' },
  Monitoring: { tone: 'safety', mark: '⬡', words: 'Being watched for now' },
  Reopened: { tone: 'safety', mark: '⬡', words: 'Opened again' },
  /* Finished business, deliberately quiet — but never "success": nothing
     here is an achievement, and a resolved record does not mean a
     resolved risk. The screen says so in words next to this. */
  Resolved: { tone: 'draft', mark: '○', words: 'Recorded as dealt with' },
  Closed: { tone: 'draft', mark: '○', words: 'Closed' },
};

export function safetyEventStatus(state: string): StatusPresentation {
  return SAFETY_EVENT_STATUS[state] ?? { tone: 'safety', mark: '⬡', words: state };
}
