import { useEffect } from 'react';
import { staffApi, type EvidenceReviewItem, type StaffSession } from '../../staff-api.js';
import { ConfirmDecision, ExactVersionBlock, RefuseControl, SeparationOfDutiesLine, useDecision, useQueue } from './shared.js';

/**
 * Approving an evidence review.
 *
 * Nothing listed submitted reviews, so none could be approved: the search
 * and the reference-attaching worked, and the end of the chain was
 * unreachable.
 *
 * What the review rests on is shown in full next to the control, with
 * each reference's resolution state. A reference the platform could not
 * resolve is stored with the raw identifier as its title and `unknown` as
 * its source — approving a review while that sits unread would be
 * approving a claim whose source nobody checked, which is the failure
 * this whole module exists to prevent.
 *
 * The submitter cannot approve their own review, enforced by the command
 * and again by a database CHECK, and the row says so before the button.
 */
const RESOLUTION_WORDING: Record<string, string> = {
  Resolved: 'found in the source system',
  Unresolved: 'not looked up',
  'Resolution Failed': 'NOT FOUND — nothing here was checked against a source',
  'Source Unavailable': 'source system unreachable — not checked',
};

export function EvidenceReviews({ session }: { session: StaffSession }) {
  const queue = useQueue<EvidenceReviewItem>(
    async () => (await staffApi.listReviewsAwaitingApproval(session)).data.map((i) => i.attributes),
    'evidence reviews waiting to be approved',
  );
  const decision = useDecision();

  useEffect(() => {
    void queue.refresh();
  }, []);

  return (
    <section aria-labelledby="evidence-reviews-heading">
      <h2 id="evidence-reviews-heading">Evidence reviews waiting to be approved</h2>
      <p>
        Approving says this review's references are what it rests on. Anything that could not be found in its source
        system is marked, and approving does not make it found.
      </p>
      <p>
        <button onClick={() => void queue.refresh()}>Refresh the list</button>
      </p>
      {queue.error !== '' && <p role="alert">{queue.error}</p>}
      {queue.items !== null && queue.items.length === 0 && <p>No evidence review is waiting to be approved.</p>}

      {(queue.items ?? []).map((r) => {
        const own = r.submittedByActorId === session.actorId;
        const unresolved = r.references.filter((k) => k.resolutionState !== 'Resolved');
        const artefact = {
          typeLabel: 'Evidence review',
          id: r.evidenceReviewId,
          facts: [
            { label: 'Question', value: r.question },
            { label: 'Research project', value: r.researchProjectId },
            { label: 'Submitted by', value: r.submittedByActorId ?? 'unknown' },
            {
              label: 'What it rests on',
              value:
                r.references.length === 0
                  ? 'nothing attached'
                  : r.references
                      .map(
                        (k) =>
                          `${k.sourceSystem} ${k.externalIdentifier}` +
                          `${k.externalVersion === null ? '' : ` v${k.externalVersion}`}` +
                          ` (${RESOLUTION_WORDING[k.resolutionState] ?? k.resolutionState})`,
                      )
                      .join('; '),
            },
          ],
        };
        return (
          <article key={r.evidenceReviewId} aria-label={`Evidence review ${r.evidenceReviewId}`}>
            <ExactVersionBlock artefact={artefact} />
            <SeparationOfDutiesLine isOwnSubmission={own} />
            {unresolved.length > 0 && (
              <p role="alert">
                {unresolved.length} of {r.references.length} references were not confirmed against their source
                system. Approving does not check them.
              </p>
            )}
            <p>
              <button
                disabled={own}
                onClick={() =>
                  decision.setPending({
                    label: 'Approve evidence review',
                    artefact,
                    consequence:
                      unresolved.length > 0
                        ? 'Approving records this review as approved with references that were not confirmed against their source. Those stay marked as unconfirmed; approving does not resolve them.'
                        : 'Approving records this review as approved, resting on exactly the references listed.',
                    run: () => staffApi.approveEvidenceReview(session, r.evidenceReviewId),
                  })
                }
              >
                Approve this review
              </button>
            </p>
            {/*
              The other half of a decision. Until this existed the only way
              to clear this queue was to approve everything in it, and a
              reviewer who judged a review inadequate could do nothing at
              all — which is a screen that asks for a judgement and accepts
              only one answer.
            */}
            <RefuseControl
              idPrefix={r.evidenceReviewId}
              label="Send this review back"
              help="It goes back to whoever submitted it, with your reason. It is not approved and it is not thrown away."
              disabled={own}
              onRefuse={(reason) =>
                decision.setPending({
                  label: 'Send this review back',
                  artefact,
                  consequence:
                    'The review returns to its submitter for revision, carrying your reason. Nothing about it is deleted, and it can be submitted again.',
                  run: () => staffApi.returnEvidenceReview(session, r.evidenceReviewId, reason),
                })
              }
            />
          </article>
        );
      })}

      {decision.pending !== null && (
        <ConfirmDecision
          pending={decision.pending}
          busy={decision.busy}
          onConfirm={() => void decision.execute()}
          onCancel={() => decision.setPending(null)}
        />
      )}
      <p aria-live="polite" role="status">
        {decision.announcement}
      </p>
    </section>
  );
}
