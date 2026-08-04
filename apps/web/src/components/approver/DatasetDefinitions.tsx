import { useEffect } from 'react';
import { staffApi, type DefinitionAwaitingApprovalItem, type StaffSession } from '../../staff-api.js';
import { ConfirmDecision, ExactVersionBlock, SeparationOfDutiesLine, useDecision, useQueue } from './shared.js';

/**
 * Approving a dataset definition — the step the whole chain waits on.
 *
 * Nothing listed definitions, so none could be approved, so no version
 * could be generated from one, so the lock queue further down could never
 * fill through the product. The locking screen existed and had never had
 * anything in it.
 *
 * The drafter cannot approve their own definition. That is enforced by
 * the command and again by a database CHECK, and the row says so before
 * the button is pressed rather than after — the same rule the protocol
 * screen already applies (ADR-051).
 *
 * Approving is not MFA-tier here: `dataset.approve-definition` requires
 * confirmation but not strong authentication, unlike locking. The screen
 * does not claim otherwise; overstating what an action costs is its own
 * kind of dishonesty, and it teaches people to ignore the notices that
 * are real.
 */
export function DatasetDefinitions({ session }: { session: StaffSession }) {
  const queue = useQueue<DefinitionAwaitingApprovalItem>(
    async () => (await staffApi.listDefinitionsAwaitingApproval(session)).data.map((i) => i.attributes),
    'dataset definitions waiting to be approved',
  );
  const decision = useDecision();

  useEffect(() => {
    void queue.refresh();
  }, []);

  return (
    <section aria-labelledby="dataset-definitions-heading">
      <h2 id="dataset-definitions-heading">Dataset definitions waiting to be approved</h2>
      <p>
        A definition says what goes into a dataset. Nothing can be generated from it until it is approved, and
        approving it is not the same as locking a version generated later.
      </p>
      <p>
        <button onClick={() => void queue.refresh()}>Refresh the list</button>
      </p>
      {queue.error !== '' && <p role="alert">{queue.error}</p>}
      {queue.items !== null && queue.items.length === 0 && <p>No dataset definition is waiting to be approved.</p>}

      {(queue.items ?? []).map((d) => {
        const own = d.createdByActorId === session.actorId;
        const artefact = {
          typeLabel: 'Dataset definition',
          id: d.datasetDefinitionId,
          facts: [
            { label: 'Name', value: d.name },
            { label: 'Research project', value: d.researchProjectId },
            // What the dataset will contain is the decision itself, so it
            // belongs next to the control and not behind a link.
            { label: 'Variables included', value: Object.keys(d.variables).join(', ') || 'none' },
            { label: 'Written by', value: d.createdByActorId },
          ],
        };
        return (
          <article key={d.datasetDefinitionId} aria-label={`Dataset definition ${d.datasetDefinitionId}`}>
            <ExactVersionBlock artefact={artefact} />
            <SeparationOfDutiesLine isOwnSubmission={own} />
            <p>
              <button
                disabled={own}
                onClick={() =>
                  decision.setPending({
                    label: 'Approve dataset definition',
                    artefact,
                    consequence:
                      'Approving lets versions be generated from exactly these variables. Anything not named here is not included, and message bodies are excluded by default.',
                    run: () => staffApi.approveDatasetDefinition(session, d.datasetDefinitionId),
                  })
                }
              >
                Approve this definition
              </button>
            </p>
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
