import { useEffect, useState } from 'react';
import { staffActionError, staffLoadError } from '../errors.js';
import { staffApi, type AnalysisWorkPayload, type DatasetWorkItem, type StaffSession } from '../staff-api.js';

/**
 * The analysis chain: plan, run, interpretation, finding.
 *
 * Every step had a command and none had a screen, so a plan could be
 * drafted, approved, run against a locked dataset, interpreted and turned
 * into a finding only by someone driving the API directly. Each artefact
 * refers to the one before it by identifier, so without a listing the
 * chain could not even be followed, let alone built.
 *
 * Two things this screen must not overstate.
 *
 * Recording a run is not performing one. There is no compute engine here:
 * what is stored is a person's record that an analysis was run against
 * exactly this dataset version and what it produced. A control labelled
 * "Run the analysis" would claim the platform did the work.
 *
 * A run can only be made against a locked dataset version, and the server
 * refuses otherwise. The picker therefore offers locked versions only and
 * says why, rather than letting someone choose one and meet a refusal.
 */
const PLAN_WORDING: Record<string, string> = {
  Draft: 'Written. Waiting for someone else to approve it.',
  'In Review': 'Being looked at by an approver.',
  Approved: 'Approved. A run can be recorded under it.',
  Active: 'Active.',
  Rejected: 'Not approved.',
  Superseded: 'Replaced by a later plan.',
  Archived: 'Archived.',
};

const STEP_WORDING: Record<string, string> = {
  Draft: 'Written. Waiting for someone else.',
  'In Review': 'Being looked at.',
  Approved: 'Approved.',
  'Approved with Limitations': 'Approved, with limitations recorded.',
  Rejected: 'Not approved.',
  Superseded: 'Replaced by a later one.',
  Withdrawn: 'Withdrawn.',
  Archived: 'Archived.',
};

const EMPTY: AnalysisWorkPayload = { plans: [], runs: [], interpretations: [], findings: [] };

export function AnalysisWork({ session }: { session: StaffSession }) {
  const [work, setWork] = useState<AnalysisWorkPayload | null>(null);
  const [datasets, setDatasets] = useState<DatasetWorkItem[]>([]);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [planForm, setPlanForm] = useState({ projectId: '', title: '' });
  const [runForm, setRunForm] = useState({ planId: '', versionId: '', outputs: '' });
  const [interpForm, setInterpForm] = useState({ runId: '', text: '' });
  const [findingForm, setFindingForm] = useState({ interpretationId: '', text: '' });

  const load = async () => {
    try {
      const [w, d] = await Promise.all([staffApi.listAnalysisWork(session), staffApi.listDatasetWork(session)]);
      // Each part defaulted rather than trusted: a response missing a
      // list means nothing is there, and should read as an empty chain
      // rather than take the whole workspace down.
      setWork({ ...EMPTY, ...w.data });
      setDatasets(d.data.map((i) => i.attributes));
      setLoadError('');
    } catch (err) {
      setLoadError(staffLoadError(err, 'the analysis work'));
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

  const w = work ?? EMPTY;
  const approvedPlans = w.plans.filter((p) => p.planState === 'Approved' || p.planState === 'Active');
  // Only a locked version can be analysed; the server refuses the rest.
  const lockedVersions = datasets.filter(
    (d) => d.datasetVersionId !== null && (d.versionState === 'Locked' || d.versionState === 'Analysed'),
  );
  const approvedInterpretations = w.interpretations.filter((i) => i.interpretationState === 'Approved');

  return (
    <section aria-labelledby="analysis-heading">
      <h3 id="analysis-heading">Analysis</h3>

      <h4>Write an analysis plan</h4>
      <p>Nothing can be run until someone else approves the plan.</p>
      <p>
        <label htmlFor="ap-proj">Research project identifier</label>{' '}
        <input id="ap-proj" value={planForm.projectId} onChange={(e) => setPlanForm({ ...planForm, projectId: e.target.value })} />{' '}
        <label htmlFor="ap-title">Title</label>{' '}
        <input id="ap-title" value={planForm.title} onChange={(e) => setPlanForm({ ...planForm, title: e.target.value })} />{' '}
        <button
          disabled={planForm.projectId === '' || planForm.title === ''}
          onClick={() =>
            void run(
              () => staffApi.draftAnalysisPlan(session, planForm.projectId, planForm.title),
              'Plan written. It needs someone else to approve it before anything can be run under it.',
            )
          }
        >
          Write this plan
        </button>
      </p>

      <h4>Record a run</h4>
      <p>
        This records that an analysis was run and what it produced. The platform does not perform the analysis, and
        recording it here does not make it so.
      </p>
      <p>
        A run can only be recorded against a dataset version that has been locked. That is the point of locking: an
        interpretation is about a run, and a run is about exactly that data.
      </p>
      <p>
        <label htmlFor="ar-plan">Plan</label>{' '}
        <select id="ar-plan" value={runForm.planId} onChange={(e) => setRunForm({ ...runForm, planId: e.target.value })}>
          <option value="">Choose an approved plan</option>
          {approvedPlans.map((p) => (
            <option key={p.analysisPlanId} value={p.analysisPlanId}>
              {p.title}
            </option>
          ))}
        </select>
        {approvedPlans.length === 0 && ' No plan has been approved yet.'}
      </p>
      <p>
        <label htmlFor="ar-version">Locked dataset version</label>{' '}
        <select id="ar-version" value={runForm.versionId} onChange={(e) => setRunForm({ ...runForm, versionId: e.target.value })}>
          <option value="">Choose a locked version</option>
          {lockedVersions.map((d) => (
            <option key={d.datasetVersionId!} value={d.datasetVersionId!}>
              {d.name} v{d.versionNumber}
            </option>
          ))}
        </select>
        {lockedVersions.length === 0 && ' No dataset version has been locked yet.'}
      </p>
      <p>
        <label htmlFor="ar-outputs">What the analysis produced</label>
      </p>
      <textarea
        id="ar-outputs"
        rows={3}
        value={runForm.outputs}
        onChange={(e) => setRunForm({ ...runForm, outputs: e.target.value })}
      />
      <p>
        <button
          disabled={runForm.planId === '' || runForm.versionId === '' || runForm.outputs === ''}
          onClick={() =>
            void run(
              () => staffApi.runAnalysis(session, runForm.planId, runForm.versionId, runForm.outputs),
              'Recorded as run against that exact dataset version.',
            )
          }
        >
          Record this run
        </button>
      </p>

      <h4>Interpret a run</h4>
      <p>
        <label htmlFor="ir-run">Run</label>{' '}
        <select id="ir-run" value={interpForm.runId} onChange={(e) => setInterpForm({ ...interpForm, runId: e.target.value })}>
          <option value="">Choose a run</option>
          {w.runs.map((r) => (
            <option key={r.analysisRunId} value={r.analysisRunId}>
              {r.planTitle} · {r.analysisRunId}
            </option>
          ))}
        </select>
      </p>
      <p>
        <label htmlFor="ir-text">What the run means</label>
      </p>
      <textarea
        id="ir-text"
        rows={3}
        value={interpForm.text}
        onChange={(e) => setInterpForm({ ...interpForm, text: e.target.value })}
      />
      <p>
        <button
          disabled={interpForm.runId === '' || interpForm.text === ''}
          onClick={() =>
            void run(
              () => staffApi.draftInterpretation(session, interpForm.runId, interpForm.text),
              'Interpretation written. Someone else has to approve it.',
            )
          }
        >
          Write this interpretation
        </button>
      </p>

      <h4>Draw a finding</h4>
      <p>A finding rests on an approved interpretation, and its own approval needs strong authentication.</p>
      <p>
        <label htmlFor="fd-interp">Approved interpretation</label>{' '}
        <select
          id="fd-interp"
          value={findingForm.interpretationId}
          onChange={(e) => setFindingForm({ ...findingForm, interpretationId: e.target.value })}
        >
          <option value="">Choose an approved interpretation</option>
          {approvedInterpretations.map((i) => (
            <option key={i.interpretationRecordId} value={i.interpretationRecordId}>
              {i.planTitle} · {i.interpretationRecordId}
            </option>
          ))}
        </select>
        {approvedInterpretations.length === 0 && ' No interpretation has been approved yet.'}
      </p>
      <p>
        <label htmlFor="fd-text">The finding</label>
      </p>
      <textarea
        id="fd-text"
        rows={3}
        value={findingForm.text}
        onChange={(e) => setFindingForm({ ...findingForm, text: e.target.value })}
      />
      <p>
        <button
          disabled={findingForm.interpretationId === '' || findingForm.text === ''}
          onClick={() =>
            void run(
              () => staffApi.draftResearchFinding(session, findingForm.interpretationId, findingForm.text),
              'Finding written. Someone else has to approve it, with strong authentication.',
            )
          }
        >
          Write this finding
        </button>
      </p>

      <h4>Where the work has got to</h4>
      <p>
        <button onClick={() => void load()}>Refresh</button>
      </p>
      {loadError !== '' && <p role="alert">{loadError}</p>}
      {work !== null && w.plans.length === 0 && <p>No analysis plan has been written yet.</p>}

      {w.plans.map((p) => (
        <article key={p.analysisPlanId} aria-label={`Plan ${p.title}`}>
          <p>
            <strong>{p.title}</strong> — {PLAN_WORDING[p.planState] ?? p.planState}
          </p>
          {w.runs
            .filter((r) => r.analysisPlanId === p.analysisPlanId)
            .map((r) => (
              <div key={r.analysisRunId}>
                <p>
                  Run against dataset version {r.datasetVersionId} — <code>{r.datasetManifestHash}</code>
                </p>
                {w.interpretations
                  .filter((i) => i.analysisRunId === r.analysisRunId)
                  .map((i) => (
                    <div key={i.interpretationRecordId}>
                      <p>
                        Interpretation — {STEP_WORDING[i.interpretationState] ?? i.interpretationState}
                      </p>
                      <blockquote>{i.interpretationText}</blockquote>
                      {w.findings
                        .filter((f) => f.interpretationRecordId === i.interpretationRecordId)
                        .map((f) => (
                          <div key={f.researchFindingId}>
                            <p>Finding — {STEP_WORDING[f.findingState] ?? f.findingState}</p>
                            <blockquote>{f.findingText}</blockquote>
                          </div>
                        ))}
                    </div>
                  ))}
              </div>
            ))}
        </article>
      ))}

      {actionError !== '' && <p role="alert">{actionError}</p>}
      <p aria-live="polite" role="status">
        {announcement}
      </p>
    </section>
  );
}
