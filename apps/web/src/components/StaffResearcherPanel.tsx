import { useState } from 'react';
import { staffActionError, staffLoadError } from '../errors.js';
import { staffApi, type ProtocolVersionItem, type StaffSession } from '../staff-api.js';
import { AnalysisWork } from './AnalysisWork.js';
import { Interventions } from './Interventions.js';
import { ResearchProjects } from './ResearchProjects.js';
import { DatasetWork } from './DatasetWork.js';
import { EvidenceDecisionWork } from './EvidenceDecisionWork.js';
import { EvidenceWork } from './EvidenceWork.js';
import { ExportsToCarryOut } from './ExportsToCarryOut.js';
import { RefusalNote } from './RefusalNote.js';
import { ReportWork } from './ReportWork.js';

/**
 * Researcher workspace (M04/M14 slice): project + protocol drafting and
 * controlled export requests. There is deliberately NO identifiable
 * option for research exports — the platform cannot produce one.
 */
/** Plain words for each state, so the list is readable without knowing
 *  the state machine. */
const VERSION_WORDING: Record<string, string> = {
  Draft: 'Written. Not submitted yet.',
  'In Review': 'Submitted. Waiting for someone else to decide.',
  Approved: 'Approved. It can be activated.',
  Active: 'Active — this is the version enrolments are bound to.',
  Rejected: 'Not approved.',
  Suspended: 'Suspended.',
  Superseded: 'Replaced by a later version.',
  Archived: 'Archived.',
};

export function StaffResearcherPanel({ session }: { session: StaffSession }) {
  const [project, setProject] = useState({ organisationId: '', title: '' });
  const [draft, setDraft] = useState({ projectId: '', title: '' });
  const [submitVersionId, setSubmitVersionId] = useState('');
  const [exportForm, setExportForm] = useState({
    purpose: '',
    recipient: '',
    sources: '',
    deIdentification: 'Pseudonymised' as 'Pseudonymised' | 'Anonymised',
  });
  const [listProjectId, setListProjectId] = useState('');
  const [versions, setVersions] = useState<ProtocolVersionItem[] | null>(null);
  const [announcement, setAnnouncement] = useState('');

  const loadVersions = async () => {
    try {
      const res = await staffApi.listProtocolVersions(session, listProjectId);
      setVersions(res.data.map((i) => i.attributes));
    } catch (err) {
      setAnnouncement(staffLoadError(err, 'the protocol versions'));
    }
  };

  const run = async (fn: () => Promise<{ data: { id: string } }>, done: (id: string) => string) => {
    try {
      const res = await fn();
      setAnnouncement(done(res.data.id));
    } catch (err) {
      setAnnouncement(staffActionError(err, 'That step'));
    }
  };

  return (
    <section aria-labelledby="researcher-heading">
      <h2 id="researcher-heading">Research workspace</h2>

      <h3>Create a research project</h3>
      <p>
        <label htmlFor="rp-org">Organisation identifier</label>{' '}
        <input id="rp-org" value={project.organisationId} onChange={(e) => setProject({ ...project, organisationId: e.target.value })} />{' '}
        <label htmlFor="rp-title">Title</label>{' '}
        <input id="rp-title" value={project.title} onChange={(e) => setProject({ ...project, title: e.target.value })} />{' '}
        <button
          disabled={project.organisationId === '' || project.title === ''}
          onClick={() =>
            void run(() => staffApi.createProject(session, project.organisationId, project.title), (id) => `Project created: ${id}`)
          }
        >
          Create project
        </button>
      </p>

      <h3>Draft and submit a protocol version</h3>
      <p>Submitting records you as the submitter — you will not then be able to approve this version (separation of duties).</p>
      <p>
        <label htmlFor="pv-proj">Project identifier</label>{' '}
        <input id="pv-proj" value={draft.projectId} onChange={(e) => setDraft({ ...draft, projectId: e.target.value })} />{' '}
        <label htmlFor="pv-title">Version title</label>{' '}
        <input id="pv-title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />{' '}
        <button
          disabled={draft.projectId === '' || draft.title === ''}
          onClick={() =>
            void run(
              () => staffApi.draftProtocolVersion(session, draft.projectId, draft.title, { title: draft.title }),
              (id) => `Protocol version draft created: ${id}`,
            )
          }
        >
          Draft protocol version
        </button>
      </p>
      <p>
        <label htmlFor="pv-submit">Identifier of the version to submit</label>{' '}
        <input id="pv-submit" value={submitVersionId} onChange={(e) => setSubmitVersionId(e.target.value)} />{' '}
        <button
          disabled={submitVersionId === ''}
          onClick={() => void run(() => staffApi.submitProtocolVersion(session, submitVersionId), (id) => `Submitted for review: ${id}`)}
        >
          Submit for review
        </button>
      </p>

      {/*
        What became of the versions of this project. Nothing listed a
        researcher's own protocol versions at all: a version was drafted,
        submitted, and then left every screen — its fate learned by asking
        someone. Once refusal existed that became a hole, since the reason
        was being stored for a reader with no way to reach it.
      */}
      <h3>What has happened to the versions of a project</h3>
      <p>
        <label htmlFor="pv-list-proj">Project identifier</label>{' '}
        <input id="pv-list-proj" value={listProjectId} onChange={(e) => setListProjectId(e.target.value)} />{' '}
        <button disabled={listProjectId === ''} onClick={() => void loadVersions()}>
          Show the versions
        </button>
      </p>
      {versions !== null && versions.length === 0 && <p>That project has no protocol versions.</p>}
      {(versions ?? []).map((v) => (
        <article key={v.protocolVersionId} aria-label={`Protocol version ${v.versionNumber}`}>
          <p>
            <strong>Version {v.versionNumber}</strong> — {VERSION_WORDING[v.versionState] ?? v.versionState}
            <br />
            <small>
              {v.protocolVersionId} · content hash <code>{v.contentHash.slice(0, 12)}…</code>
            </small>
          </p>
          <RefusalNote reason={v.refusedReason} byActorId={v.refusedByActorId} verb="Not approved" />
        </article>
      ))}

      <h3>Request a controlled export</h3>
      <p>
        An export must state its purpose, its recipient and its exact sources. There is no identifiable option for research
        exports — the platform does not produce an identifiable research export.
      </p>
      <p>
        <label htmlFor="ex-purpose">Purpose</label>{' '}
        <input id="ex-purpose" value={exportForm.purpose} onChange={(e) => setExportForm({ ...exportForm, purpose: e.target.value })} />
      </p>
      <p>
        <label htmlFor="ex-recipient">Recipient</label>{' '}
        <input id="ex-recipient" value={exportForm.recipient} onChange={(e) => setExportForm({ ...exportForm, recipient: e.target.value })} />
      </p>
      <p>
        <label htmlFor="ex-sources">Sources (exact identifiers, comma-separated)</label>{' '}
        <input id="ex-sources" value={exportForm.sources} onChange={(e) => setExportForm({ ...exportForm, sources: e.target.value })} />
      </p>
      <p>
        <label htmlFor="ex-deid">De-identification level</label>{' '}
        <select
          id="ex-deid"
          value={exportForm.deIdentification}
          onChange={(e) => setExportForm({ ...exportForm, deIdentification: e.target.value as 'Pseudonymised' | 'Anonymised' })}
        >
          <option value="Pseudonymised">Pseudonymised</option>
          <option value="Anonymised">Anonymised</option>
        </select>{' '}
        <button
          disabled={exportForm.purpose === '' || exportForm.recipient === '' || exportForm.sources === ''}
          onClick={() =>
            void run(
              () =>
                staffApi.requestExport(
                  session,
                  exportForm.purpose,
                  exportForm.recipient,
                  exportForm.sources.split(/[,，]/).map((s) => s.trim()).filter((s) => s !== ''),
                  exportForm.deIdentification,
                ),
              (id) => `Export request created and waiting for a decision: ${id}`,
            )
          }
        >
          Submit export request
        </button>
      </p>

      {/*
        Searching the knowledge platform worked and attaching a reference
        worked; nothing listed a review, so the chain had no middle.
      */}
      <EvidenceWork session={session} />

      <EvidenceDecisionWork session={session} />

      {/*
        The dataset chain: only its last step (locking) had a screen, so
        the four before it could be performed by nobody.
      */}
      <DatasetWork session={session} />

      {/*
        The head of the chain, which had no list: a project's identifier
        appeared once in the message announcing it and nowhere else,
        while every screen below asks for that identifier back.
      */}
      <ResearchProjects session={session} />

      {/*
        The module the platform is named after: six commands, no callers
        anywhere in the product, and no query at all — so an intervention
        created straight against the API was invisible from that moment.
      */}
      <Interventions session={session} />

      {/*
        Every step of the analysis chain had a command and none had a
        screen, so it could only be followed by driving the API directly.
      */}
      <AnalysisWork session={session} />

      {/*
        The export half had screens; the reports beside it did not, so
        nothing could ever reach the report approval queue.
      */}
      <ReportWork session={session} />

      {/*
        Approving used to be the end of the road: nothing listed an
        approved request, so the package was never put together and the
        delivery never recorded.
      */}
      <ExportsToCarryOut session={session} />

      <p aria-live="polite" role="status">
        {announcement}
      </p>
    </section>
  );
}
