/**
 * Who a memory is for.
 *
 * Pure, so the awkward part — which scopes may honestly be offered — is a
 * test rather than a judgement made in markup.
 */

export interface VisibilityChoice {
  readonly value: string;
  /** What the participant is choosing, in their words. */
  readonly label: string;
  /** What it means, said once, before they choose. */
  readonly meaning: string;
}

/**
 * The scopes this screen offers.
 *
 * `Selected People` is deliberately absent. It is a scope the platform
 * accepts and there is no table anywhere recording who was selected — no
 * per-item list of named people exists (B-31) — so choosing it shares a
 * memory with nobody. Offering it would be a control that cannot do the
 * thing it names, which is the failure this project keeps taking out; it
 * comes back when there is something behind it.
 *
 * `Platform Public` is absent for a different reason: it shares with
 * every stranger on the platform, and nothing on these screens yet shows
 * somebody who those strangers are or lets them take it back one person
 * at a time. It is not refused anywhere — a memory already set to it
 * keeps it — it is simply not offered as a new choice here (X-38).
 */
export const VISIBILITY_CHOICES: readonly VisibilityChoice[] = [
  {
    value: 'Private',
    label: 'Only me',
    meaning: 'Nobody else can open it. This is where every memory starts.',
  },
  {
    value: 'My Supporters',
    label: 'The people who help me',
    meaning: 'The family and friends you have approved as supporters. Not anybody else.',
  },
  {
    value: 'Connections',
    label: 'People I am connected with',
    meaning: 'Other people using this platform who you and they both agreed to connect with.',
  },
  {
    value: 'Community',
    label: 'My community',
    meaning: 'Everybody in a community space you have joined.',
  },
];

/**
 * What a scope is called, including the ones no longer offered.
 *
 * A memory already set to `Selected People` or `Platform Public` must
 * still be described accurately on the screen — not being offered as a
 * new choice is not the same as not existing, and a memory whose scope
 * the screen could not name would be worse than one it can.
 */
export function visibilityLabel(value: string): string {
  const offered = VISIBILITY_CHOICES.find((c) => c.value === value);
  if (offered !== undefined) return offered.label;
  if (value === 'Selected People') return 'People I chose';
  if (value === 'Platform Public') return 'Anyone using this platform';
  return value;
}
