import { useEffect } from 'react';
import { staffApi, type EvidenceDecisionItem, type StaffSession } from '../../staff-api.js';
import {
  ConfirmDecision,
  ExactVersionBlock,
  RefuseControl,
  SeparationOfDutiesLine,
  useDecision,
  useQueue,
} from './shared.js';

/**
 * Agreeing an evidence decision.
 *
 * Approving writes an immutable EvidenceSnapshot in the same transaction:
 * the outcome, the reasoning and the review it came from, hashed. That is
 * what later work cites, so approving is the last moment anyone can
 * change what is being recorded — the confirmation says so rather than
 * leaving it to be discovered when an edit is refused.
 *
 * The outcome is shown in plain words. "Conflicting evidence" is a real
 * outcome and is not dressed up as a problem with the decision; a
 * reviewer who reads it as a failure would be pushed toward sending back
 * an honest reading.
 */
const OUTCOME_WORDING: Record<string, string> = {
  Support: 'The evidence supports this',
  'Support with Conditions': 'Supported, but only under stated conditions',
  'Conflicting Evidence': 'The evidence conflicts — sources disagree',
  'Insufficient Evidence': 'There is not enough evidence either way',
  'Research Required': 'This needs its own research first',
  Restrict: 'Restrict this',
  'Do Not Proceed': 'Do not proceed',
};

export function EvidenceDecisions({ session }: { session: StaffSession }) {
  const queue = useQueue<EvidenceDecisionItem>(
    async () => (await staffApi.listDecisionsAwaitingApproval(session)).data.map((i) => i.attributes),
    'evidence decisions waiting to be agreed',
  );
  const decision = useDecision();

  useEffect(() => {
    void queue.refresh();
  }, []);

  return (
    <section aria-labelledby="evidence-decisions-heading">
      <h2 id="evidence-decisions-heading">Evidence decisions waiting to be agreed</h2>
      <p>
        Agreeing one writes an unchangeable snapshot of its outcome and reasoning. That snapshot is what later work
        cites, so this is the last point at which the wording can change.
      </p>
      <p>
        <button onClick={() => void queue.refresh()}>Refresh the list</button>
      </p>
      {queue.error !== '' && <p role="alert">{queue.error}</p>}
      {queue.items !== null && queue.items.length === 0 && <p>No evidence decision is waiting to be agreed.</p>}

      {(queue.items ?? []).map((d) => {
        const own = d.draftedByActorId === session.actorId;
        const artefact = {
          typeLabel: 'Evidence decision',
          id: d.evidenceDecisionId,
          facts: [
            { label: 'Question', value: d.question },
            { label: 'What the evidence says', value: OUTCOME_WORDING[d.outcome] ?? d.outcome },
            { label: 'Reasoning', value: d.rationale },
            { label: 'The review it comes from', value: `${d.evidenceReviewId} (${d.reviewState})` },
            { label: 'Written by', value: d.draftedByActorId },
          ],
        };
        return (
          <article key={d.evidenceDecisionId} aria-label={`Evidence decision ${d.evidenceDecisionId}`}>
            <ExactVersionBlock artefact={artefact} />
            <SeparationOfDutiesLine isOwnSubmission={own} />
            {d.reviewState !== 'Approved' && (
              <p role="alert">
                The review this comes from is {d.reviewState}, not Approved. Agreeing this decision does not approve
                that review.
              </p>
            )}
            <p>
              <button
                disabled={own}
                onClick={() =>
                  decision.setPending({
                    label: 'Agree evidence decision',
                    artefact,
                    consequence:
                      'Agreeing records this outcome and this reasoning in a snapshot that cannot be changed afterwards. A different conclusion later has to be a new decision.',
                    run: () => staffApi.approveEvidenceDecision(session, d.evidenceDecisionId),
                  })
                }
              >
                Agree this decision
              </button>
            </p>
            <RefuseControl
              idPrefix={d.evidenceDecisionId}
              label="Do not agree with this decision"
              help="No snapshot is written. A snapshot is the record of what an agreed decision rested on, and this one is not agreed."
              disabled={own}
              onRefuse={(reason) =>
                decision.setPending({
                  label: 'Refuse evidence decision',
                  artefact,
                  consequence:
                    'The decision is refused and no snapshot is written, so nothing here can be cited afterwards as agreed. Your reason is stored with it.',
                  run: () => staffApi.rejectEvidenceDecision(session, d.evidenceDecisionId, reason),
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
