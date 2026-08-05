import { useState } from 'react';
import { staffActionError } from '../errors.js';
import { staffApi, type StaffSession } from '../staff-api.js';
import { DatasetWork } from './DatasetWork.js';
import { EvidenceWork } from './EvidenceWork.js';
import { ExportsToCarryOut } from './ExportsToCarryOut.js';
import { ReportWork } from './ReportWork.js';

/**
 * Researcher workspace (M04/M14 slice): project + protocol drafting and
 * controlled export requests. There is deliberately NO identifiable
 * option for research exports — the platform cannot produce one.
 */
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
  const [announcement, setAnnouncement] = useState('');

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

      {/*
        The dataset chain: only its last step (locking) had a screen, so
        the four before it could be performed by nobody.
      */}
      <DatasetWork session={session} />

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
