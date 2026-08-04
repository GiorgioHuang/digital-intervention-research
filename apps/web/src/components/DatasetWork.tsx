import { useEffect, useState } from 'react';
import { staffActionError, staffLoadError } from '../errors.js';
import { staffApi, type DatasetWorkItem, type StaffSession } from '../staff-api.js';

/**
 * Preparing a dataset: define it, generate a version once the definition
 * has been approved, and complete the quality review.
 *
 * The chain is define, approve, generate, quality-review, lock. Only the
 * last step had a screen, so the four before it could be performed by
 * nobody — which meant the lock queue could never fill through the
 * product no matter what an approver did. A decision screen whose queue
 * cannot be populated has never been used by anyone.
 *
 * Approving the definition is somebody else's job, and deliberately not
 * offered here: the drafter cannot approve their own definition, and the
 * database refuses it as well as the command.
 */
const DEFINITION_WORDING: Record<string, string> = {
  Draft: 'Written. Waiting for someone else to approve it.',
  'In Review': 'Being looked at by an approver.',
  Approved: 'Approved. A version can be generated from it.',
  Superseded: 'Replaced by a newer definition.',
  Archived: 'Archived.',
};

const VERSION_WORDING: Record<string, string> = {
  Draft: 'Not generated yet.',
  Generated: 'Generated. The quality review has not been completed.',
  'Quality Review': 'Being quality reviewed.',
  'Quality Reviewed': 'Quality reviewed. Waiting for an approver to lock it.',
  Locked: 'Locked. It cannot be changed, and analysis can cite it.',
  Analysed: 'Analysed.',
  Superseded: 'Replaced by a newer version.',
  Archived: 'Archived.',
};

export function DatasetWork({ session }: { session: StaffSession }) {
  const [items, setItems] = useState<DatasetWorkItem[] | null>(null);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [form, setForm] = useState({ projectId: '', name: '', variables: '' });
  const [generating, setGenerating] = useState<{ id: string; source: string; rows: string } | null>(null);

  const load = async () => {
    try {
      setItems((await staffApi.listDatasetWork(session)).data.map((i) => i.attributes));
      setLoadError('');
    } catch (err) {
      setLoadError(staffLoadError(err, 'the dataset work'));
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const run = async (fn: () => Promise<unknown>, said: string) => {
    try {
      await fn();
      setActionError('');
      setAnnouncement(said);
      await load();
    } catch (err) {
      setActionError(staffActionError(err, 'That step'));
    }
  };

  return (
    <section aria-labelledby="dataset-work-heading">
      <h3 id="dataset-work-heading">Datasets</h3>

      <h4>Define a dataset</h4>
      <p>
        The variable dictionary names what goes in. Message bodies are excluded by default, so anything not named
        here is not included.
      </p>
      <p>
        <label htmlFor="dd-project">Research project identifier</label>{' '}
        <input id="dd-project" value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })} />
      </p>
      <p>
        <label htmlFor="dd-name">Name</label>{' '}
        <input id="dd-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </p>
      <p>
        <label htmlFor="dd-vars">Variables to include (separated by commas)</label>{' '}
        <input id="dd-vars" value={form.variables} onChange={(e) => setForm({ ...form, variables: e.target.value })} />
      </p>
      <p>
        You cannot approve what you write here. Approval is a separate decision by someone else, and the database
        refuses it if the two are the same person.
      </p>
      <p>
        <button
          disabled={form.projectId === '' || form.name === '' || form.variables === ''}
          onClick={() =>
            void run(
              () =>
                staffApi.createDatasetDefinition(
                  session,
                  form.projectId,
                  form.name,
                  form.variables.split(',').map((v) => v.trim()).filter((v) => v !== ''),
                ),
              'Definition written. It needs someone else to approve it before a version can be generated.',
            )
          }
        >
          Write this definition
        </button>
      </p>

      <h4>Where the work has got to</h4>
      <p>
        <button onClick={() => void load()}>Refresh</button>
      </p>
      {loadError !== '' && <p role="alert">{loadError}</p>}
      {items !== null && items.length === 0 && <p>No dataset has been defined yet.</p>}

      {(items ?? []).map((d) => (
        <article
          key={`${d.datasetDefinitionId}:${d.datasetVersionId ?? 'none'}`}
          aria-label={`Dataset ${d.name}${d.versionNumber === null ? '' : ` version ${d.versionNumber}`}`}
        >
          <p>
            <strong>{d.name}</strong> — {DEFINITION_WORDING[d.definitionState] ?? d.definitionState}
          </p>
          {d.versionState !== null && (
            <p>
              Version {d.versionNumber} ({d.rowCount} rows) — {VERSION_WORDING[d.versionState] ?? d.versionState}
            </p>
          )}

          {d.definitionState === 'Approved' && d.datasetVersionId === null && (
            <>
              <p>
                <button onClick={() => setGenerating({ id: d.datasetDefinitionId, source: '', rows: '' })}>
                  Generate a version
                </button>
              </p>
              {generating?.id === d.datasetDefinitionId && (
                <div>
                  <p>
                    <label htmlFor={`src-${d.datasetDefinitionId}`}>Where the data came from</label>{' '}
                    <input
                      id={`src-${d.datasetDefinitionId}`}
                      value={generating.source}
                      onChange={(e) => setGenerating({ ...generating, source: e.target.value })}
                    />
                  </p>
                  <p>
                    <label htmlFor={`rows-${d.datasetDefinitionId}`}>How many rows</label>{' '}
                    <input
                      id={`rows-${d.datasetDefinitionId}`}
                      inputMode="numeric"
                      value={generating.rows}
                      onChange={(e) => setGenerating({ ...generating, rows: e.target.value })}
                    />
                  </p>
                  <p>
                    <button
                      disabled={generating.source === '' || !/^\d+$/.test(generating.rows)}
                      onClick={() =>
                        void run(() => {
                          const g = generating;
                          setGenerating(null);
                          return staffApi.generateDatasetVersion(
                            session,
                            g.id,
                            g.source,
                            Number.parseInt(g.rows, 10),
                          );
                        }, 'Version generated. The quality review has not been completed.')
                      }
                    >
                      Generate it
                    </button>{' '}
                    <button onClick={() => setGenerating(null)}>Close</button>
                  </p>
                </div>
              )}
            </>
          )}

          {d.versionState === 'Generated' && d.datasetVersionId !== null && (
            <p>
              {/*
                Says what it records rather than "Approve": completing the
                review is a statement that the review was done, and the
                platform did not do it.
              */}
              <button
                onClick={() =>
                  void run(
                    () => staffApi.completeQualityReview(session, d.datasetVersionId!),
                    'Recorded as quality reviewed. An approver can now lock it; you are not locking it here.',
                  )
                }
              >
                Record that the quality review is finished
              </button>
            </p>
          )}
        </article>
      ))}

      {actionError !== '' && <p role="alert">{actionError}</p>}
      <p aria-live="polite" role="status">
        {announcement}
      </p>
    </section>
  );
}
