import type { AuthMode } from '../auth.js';

/**
 * What a supporter is told about where they are.
 *
 * The supporter workspace said nothing at all. Somebody could be invited
 * by a person they know, sign in, read a life story and write into it,
 * and never learn that the person is a synthetic persona and the story is
 * not anyone's. The staff workspace has `EpistemicStatus` for this, and
 * the specification (MODERATION_SAFETY_SUPPORTER H-series) shows a banner
 * here — it had simply never been built.
 *
 * `EpistemicStatus` is deliberately not reused. It answers "which kind of
 * knowledge is this?" and speaks about outputs, interpretations, findings
 * and reports, because that is what a researcher is looking at. A
 * supporter is looking at a person. The claim they need is smaller and
 * more direct, and putting the researcher's paragraphs in front of them
 * would bury it.
 *
 * The second sentence is conditional, and that is the whole reason this
 * takes `authMode`. Under the dev-header stub nobody signing in has been
 * verified, and saying so is worth the line. Under `AUTH_MODE=google` it
 * would be false: the people signing in are real, and only the *data* is
 * synthetic — which is the claim that must not weaken (D-67, and the same
 * split `EpistemicStatus` makes).
 */
export function SyntheticNotice({ authMode }: { authMode: AuthMode | undefined }) {
  const unverifiedIdentity = authMode === 'dev-header';

  return (
    <section role="note" aria-labelledby="synthetic-notice-heading">
      <h2 id="synthetic-notice-heading">About this workspace</h2>
      <p>
        <strong>[synthetic data]</strong> This is a conceptual research prototype. The people you are shown here are
        simulated, and so is everything about them — a life story here is not anyone&rsquo;s life story, and a message
        here was not written by anyone. Nothing you add describes a real person, and nothing here should be read as
        though it did.
        {unverifiedIdentity && ' Identity in this environment is a development stub, so nobody signing in has been verified either.'}
      </p>
    </section>
  );
}
