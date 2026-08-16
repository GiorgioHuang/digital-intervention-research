import type { AuthMode } from '../auth.js';

/**
 * What kind of knowledge anything on the research screens is.
 *
 * DESIGN_BRIEF §3 requires every concluding element in the researcher
 * interface to answer "which kind of knowledge is this?", and Doc 19 §10
 * gives ten epistemic types to answer it with. Nothing had been built —
 * neither the tags nor any marking that outputs rest on synthetic data —
 * and this is the honest half of that requirement.
 *
 * **What is deliberately not built: a per-record epistemic tag.**
 * There is no field to put one in. No table carries a provenance or
 * knowledge-type column, and nothing anywhere writes one, so a tag on an
 * analysis output would either be invented at render time or be a control
 * recording a value no query reads — the empty control this project keeps
 * dismantling (D-2, D-5, D-21, D-34). D-5 already ruled the narrower
 * version of this: until the backend writes the marking, the interface
 * must not claim the export carries it.
 *
 * **What is built, because it is true by construction.** This is a
 * conceptual research prototype (ADR-061/062). Every participant is
 * simulated, every provider is a simulator, and under the development
 * identity stub nobody's identity was ever verified — so no record here
 * can be about an identified real person. That is a property of the
 * deployment rather than of a row, which is exactly why it needs no field
 * to be stated truthfully.
 *
 * The distinction matters more than it looks. A missing marking is read as
 * "this is ordinary data"; a per-record tag nobody wrote would be read as
 * "somebody classified this". Saying the first plainly and refusing the
 * second is the whole of what can be done honestly today.
 */
export function EpistemicStatus({ authMode }: { authMode: AuthMode | undefined }) {
  // Under the stub, identity is whatever the caller claims (ADR-104), so
  // the stronger sentence is available and worth saying. Under Google the
  // people signing in are real staff — the *data* is still synthetic, and
  // that is the claim that must not weaken.
  const unverifiedIdentity = authMode === 'dev-header';

  return (
    <section role="note" aria-labelledby="epistemic-heading">
      <h2 id="epistemic-heading">What kind of knowledge is on these screens</h2>
      <p>
        <strong>[synthetic data]</strong> Everything here — every participant, every message, every assessment answer,
        every delivery record — is synthetic, produced for a conceptual research prototype. Nothing on these screens
        describes anything that happened to a real person.
      </p>
      <p>
        So no output, interpretation, finding or report from this platform is empirical evidence, and none of it may be
        written up as though it were. What it can show is whether the model is coherent: whether the chain holds, whether
        an invariant survives a case designed to break it, whether a definition stays stable under use.
        {unverifiedIdentity && ' Identity here is a development stub, so nobody signing in has been verified either.'}
      </p>
      {/*
        Stating the gap rather than leaving it to be discovered. A reader
        who notices there are no per-item tags should learn that the
        platform cannot produce them, not conclude that this screen dropped
        them or that somebody classified these items and the label is
        merely missing.
      */}
      <p>
        Individual items are <strong>not</strong> tagged one by one with the knowledge types of Doc 19 §10. The platform
        has nowhere to record such a tag — no field, and nothing that writes one — so a label on a single item would be
        invented rather than recorded. The statement above applies to everything on these screens without exception,
        which is why it is made once, here, rather than repeated per item.
      </p>
    </section>
  );
}
