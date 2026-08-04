import { useEffect } from 'react';
import { staffApi, type LockableVersion, type StaffSession } from '../../staff-api.js';
import { AuthStrengthNote, ConfirmDecision, ExactVersionBlock, useDecision, useQueue } from './shared.js';

/**
 * Dataset version locking. The manifest hash is the whole point of the
 * screen: locking says "analysis may run against exactly this", so the
 * hash sits next to the control and appears in full in the confirmation.
 *
 * Approver and locker may be the same person (decision D-11), which is
 * what the platform already does — `lockDatasetVersion` checks the
 * version's state and the `dataset.lock` permission, and nothing else.
 * The screen says so outright instead of leaving a locker who approved
 * the definition to guess whether they are allowed. It still names who
 * approved the definition, because "permitted" is not "invisible": the
 * chain stays readable even where it is not barred.
 */
export function DatasetLock({ session }: { session: StaffSession }) {
  const queue = useQueue<LockableVersion>(
    async () => (await staffApi.listLockableDatasetVersions(session)).data.map((i) => i.attributes),
    'dataset versions that can be locked',
  );
  const decision = useDecision();

  useEffect(() => {
    void queue.refresh();
  }, []);

  const recheck = (id: string) => async () => {
    const rows = (await staffApi.listLockableDatasetVersions(session)).data.map((i) => i.attributes);
    const found = rows.find((r) => r.datasetVersionId === id);
    return found === undefined ? null : found.manifestHash;
  };

  return (
    <section aria-labelledby="dataset-lock-heading">
      <h2 id="dataset-lock-heading">Dataset versions that can be locked</h2>
      <AuthStrengthNote needsMfa authStrength={session.authStrength} action="Locking a dataset version" />
      <p>
        A locked version cannot be changed afterwards, and analysis can only run against a locked version. Check the
        manifest hash against the one you reviewed before locking.
      </p>
      <p>
        Locking is not barred by separation of duties: if you approved the dataset definition, you may lock a version
        generated from it. Each row still names who approved the definition.
      </p>

      <p>
        <button onClick={() => void queue.refresh()}>Refresh the list</button>
      </p>
      {queue.error !== '' && <p role="alert">{queue.error}</p>}
      {queue.items !== null && queue.items.length === 0 && <p>No dataset version is waiting to be locked.</p>}

      {(queue.items ?? []).map((v) => (
        <article key={v.datasetVersionId} aria-label={`Dataset version ${v.datasetVersionId}`}>
          <ExactVersionBlock
            artefact={{
              typeLabel: 'Dataset version',
              id: v.datasetVersionId,
              versionNumber: v.versionNumber,
              hashLabel: 'Manifest hash',
              hash: v.manifestHash,
              facts: [
                { label: 'Dataset definition', value: v.datasetDefinitionId },
                {
                  label: 'Definition approved by',
                  value:
                    v.definitionApprovedByActorId === null
                      ? 'not recorded'
                      : v.definitionApprovedByActorId === session.actorId
                        ? `${v.definitionApprovedByActorId} — that is you, which is permitted here`
                        : v.definitionApprovedByActorId,
                },
              ],
            }}
          />
          <p>
            <button
              onClick={() =>
                decision.setPending({
                  label: 'Lock dataset version',
                  artefact: {
                    typeLabel: 'Dataset version',
                    id: v.datasetVersionId,
                    versionNumber: v.versionNumber,
                    hashLabel: 'Manifest hash',
                    hash: v.manifestHash,
                  },
                  consequence: 'A locked version cannot be changed or unlocked. Analysis runs against exactly this manifest.',
                  marker: v.manifestHash,
                  recheck: recheck(v.datasetVersionId),
                  run: () => staffApi.lockDatasetVersion(session, v.datasetVersionId),
                })
              }
            >
              Lock this dataset version
            </button>
          </p>
        </article>
      ))}

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
