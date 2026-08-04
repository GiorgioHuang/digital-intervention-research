import { useEffect, useState } from 'react';
import { staffActionError, staffLoadError } from '../errors.js';
import { staffApi, type ReportWorkItem, type StaffSession } from '../staff-api.js';

/**
 * Writing a report and drafting versions of it.
 *
 * The export half of this module had screens; the reports it sits beside
 * did not. Nothing could create a report, draft a version or list one, so
 * the approval step further along had nothing to approve — the same shape
 * as the dataset chain, in the module next door.
 *
 * Approved content is immutable: the database refuses any change to an
 * approved version other than superseding it. The screen says so, because
 * someone who expects to be able to fix a typo afterwards should learn
 * that before the version is approved rather than after.
 */
const REPORT_TYPES = [
  { value: 'ResearchReport', label: 'Research report' },
  { value: 'ParticipantSummary', label: 'Summary written for participants' },
  { value: 'FindingPackage', label: 'Package of findings' },
];

const VERSION_WORDING: Record<string, string> = {
  Draft: 'Written. Waiting for someone else to approve it.',
  Approved: 'Approved. Its content can no longer be changed.',
  Superseded: 'Replaced by a later version.',
};

export function ReportWork({ session }: { session: StaffSession }) {
  const [items, setItems] = useState<ReportWorkItem[] | null>(null);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [form, setForm] = useState({ projectId: '', title: '', reportType: 'ResearchReport' });
  const [drafting, setDrafting] = useState<{ reportId: string; text: string } | null>(null);

  const load = async () => {
    try {
      setItems((await staffApi.listReportWork(session)).data.map((i) => i.attributes));
      setLoadError('');
    } catch (err) {
      setLoadError(staffLoadError(err, 'the reports'));
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

  /** One row per report, so the draft control is not repeated per version. */
  const reports = new Map<string, ReportWorkItem>();
  for (const i of items ?? []) if (!reports.has(i.reportId)) reports.set(i.reportId, i);

  return (
    <section aria-labelledby="report-work-heading">
      <h3 id="report-work-heading">Reports</h3>

      <h4>Start a report</h4>
      <p>
        <label htmlFor="rp-proj">Research project identifier</label>{' '}
        <input id="rp-proj" value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })} />
      </p>
      <p>
        <label htmlFor="rp-rtitle">Title</label>{' '}
        <input id="rp-rtitle" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      </p>
      <p>
        <label htmlFor="rp-type">Kind of report</label>{' '}
        <select id="rp-type" value={form.reportType} onChange={(e) => setForm({ ...form, reportType: e.target.value })}>
          {REPORT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </p>
      <p>
        <button
          disabled={form.projectId === '' || form.title === ''}
          onClick={() =>
            void run(
              () => staffApi.createResearchReport(session, form.projectId, form.title, form.reportType),
              'Report started. It has no version yet, so there is nothing to approve.',
            )
          }
        >
          Start this report
        </button>
      </p>

      <h4>Reports and their versions</h4>
      <p>
        <button onClick={() => void load()}>Refresh</button>
      </p>
      {loadError !== '' && <p role="alert">{loadError}</p>}
      {items !== null && items.length === 0 && <p>No report has been started yet.</p>}

      {(items ?? []).map((r) => (
        <article key={`${r.reportId}:${r.reportVersionId ?? 'none'}`} aria-label={`Report ${r.title}`}>
          <p>
            <strong>{r.title}</strong> — {REPORT_TYPES.find((t) => t.value === r.reportType)?.label ?? r.reportType}
          </p>
          {r.versionState === null ? (
            <p>No version written yet.</p>
          ) : (
            <p>
              Version {r.versionNumber} — {VERSION_WORDING[r.versionState] ?? r.versionState}
            </p>
          )}
        </article>
      ))}

      {reports.size > 0 && (
        <>
          <h4>Write a version</h4>
          <p>
            You cannot approve what you write. A version needs someone else to approve it, and once approved its
            content cannot be changed — the database refuses it. Writing again creates a new version rather than
            editing the approved one.
          </p>
          <p>
            <label htmlFor="rv-report">Report</label>{' '}
            <select
              id="rv-report"
              value={drafting?.reportId ?? ''}
              onChange={(e) => setDrafting({ reportId: e.target.value, text: drafting?.text ?? '' })}
            >
              <option value="">Choose a report</option>
              {[...reports.values()].map((r) => (
                <option key={r.reportId} value={r.reportId}>
                  {r.title}
                </option>
              ))}
            </select>
          </p>
          <p>
            <label htmlFor="rv-text">What this version says</label>
          </p>
          <textarea
            id="rv-text"
            rows={4}
            value={drafting?.text ?? ''}
            onChange={(e) => setDrafting({ reportId: drafting?.reportId ?? '', text: e.target.value })}
          />
          <p>
            <button
              disabled={drafting === null || drafting.reportId === '' || drafting.text === ''}
              onClick={() =>
                void run(() => {
                  const d = drafting!;
                  setDrafting(null);
                  return staffApi.draftReportVersion(session, d.reportId, d.text);
                }, 'Version written. It needs someone else to approve it.')
              }
            >
              Write this version
            </button>
          </p>
        </>
      )}

      {actionError !== '' && <p role="alert">{actionError}</p>}
      <p aria-live="polite" role="status">
        {announcement}
      </p>
    </section>
  );
}
