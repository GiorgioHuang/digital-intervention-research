import { useEffect } from 'react';
import { staffApi, type LockableVersion, type StaffSession } from '../../staff-api.js';
import { AuthStrengthNote, ConfirmDecision, ExactVersionBlock, useDecision, useQueue } from './shared.js';

/**
 * Dataset version locking. The manifest hash is the whole point of the
 * screen: locking says "analysis may run against exactly this", so the
 * hash sits next to the control and appears in full in the confirmation.
 *
 * No separation-of-duties line here: whether the person who approved the
 * dataset definition may also lock the version is still an open product
 * question (DESIGN_DECISIONS, open items). Stating a rule the platform
 * does not enforce would be worse than stating none.
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
              facts: [{ label: 'Dataset definition', value: v.datasetDefinitionId }],
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
