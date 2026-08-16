import type { StaffSession } from '../staff-api.js';

/**
 * What on this screen will need strong authentication, said once, at the
 * top, before anything is attempted.
 *
 * §1.6 asks for a bar rather than the scattered per-section notes that
 * were there: an approver arriving at a screen should learn up front which
 * of its actions the server will refuse at the password tier, not discover
 * it a section at a time — and least of all discover it after reading a
 * protocol version, forming a judgement, and pressing.
 *
 * Two things it must not do. It must not claim an action needs strong
 * authentication when the catalogue does not say so, because a person told
 * to re-authenticate for nothing learns to re-authenticate reflexively.
 * And it must not go quiet on a screen where nothing does — saying so
 * plainly is what makes the bar informative on the screens where something
 * does, so `actions` being empty is a case with its own sentence rather
 * than a reason to render nothing.
 *
 * The names come from the permission catalogue's `minimumAuthStrength:
 * 'mfa'` entries, and `strong-auth-bar.test.ts` checks the union of every
 * screen's list against the catalogue read from source — a hand-kept list
 * would drift from the engine exactly as the wording table did (D-51).
 */
export function StrongAuthBar({
  session,
  actions,
  notInTier,
}: {
  session: StaffSession;
  /** The MFA-tier action keys this screen can reach. May be empty. */
  actions: readonly { key: string; label: string }[];
  /**
   * Notable actions on this screen that are NOT in the tier.
   *
   * §1.6 is symmetric: an action that does not need strong authentication
   * must never be labelled as if it did — and on a screen that has both,
   * the "and this one does not" belongs in the same place as the "this one
   * does". Split across the screen, they are what a reader has to
   * assemble; together they are one answer.
   */
  notInTier?: readonly string[];
}) {
  if (actions.length === 0) {
    return (
      <p role="note" data-strong-auth-bar="none">
        Nothing on this screen needs strong authentication.
      </p>
    );
  }

  // Both tiers satisfy the requirement, and the engine ranks a fresh
  // re-authentication ABOVE a second factor, because it answers the harder
  // question — is the person still at the keyboard. Naming which one is
  // met keeps this honest about what the person actually did.
  const met = session.authStrength === 'mfa' || session.authStrength === 'step-up';

  return (
    <section role="note" aria-labelledby="strong-auth-heading" data-strong-auth-bar={met ? 'met' : 'unmet'}>
      <h3 id="strong-auth-heading">Strong authentication on this screen</h3>
      <p>
        {met
          ? session.authStrength === 'step-up'
            ? 'You confirmed it was you a moment ago, which meets it. These are the actions that needed it:'
            : 'You are signed in at that level. These are the actions that needed it:'
          : 'You are signed in at password level, so the server will refuse these until you confirm it is you — use “Confirm it is you” at the top of the workspace. Everything else on this screen works as usual:'}
      </p>
      <ul>
        {actions.map((a) => (
          <li key={a.key}>{a.label}</li>
        ))}
      </ul>
      {!met && (
        /*
          Said because the alternative is a person who assumes the whole
          screen is unusable and leaves. The refusal is per action, and
          reading, queueing and drafting are unaffected.
        */
        <p>Reading the queue, opening an item and writing a reason all work now; only the actions above are refused.</p>
      )}
      {(notInTier ?? []).length > 0 && (
        <p>
          Not in the tier, and it needs your confirmation only:{' '}
          {(notInTier ?? []).join('; ')}. These work at any authentication level.
        </p>
      )}
    </section>
  );
}
