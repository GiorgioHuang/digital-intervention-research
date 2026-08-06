import { useEffect, useState } from 'react';
import { staffActionError, staffLoadError } from '../errors.js';
import { staffApi, type InterventionItem, type StaffSession } from '../staff-api.js';

/**
 * The intervention portfolio (M06).
 *
 * Six routes existed — create an intervention, add a version, submit it,
 * approve it, activate it, configure it against a project — and not one
 * of them had a caller anywhere in the product. There was no query at
 * all, so an intervention created directly against the API was invisible
 * from that moment on. For a platform whose subject is digital
 * interventions for older people, the interventions were the one thing
 * nobody could look at.
 *
 * The work is driven from the list, as the enrolment chain is: each
 * version offers the one step its state allows, and the rest of the
 * sequence is shown as words. A researcher drafts and submits; approving
 * and activating belong to somebody else and are not offered here, which
 * the screen says rather than leaving them to look missing.
 */
const VERSION_STATE_WORDING: Record<string, string> = {
  Draft: 'draft — not submitted, and can still be changed',
  'In Review': 'submitted, waiting for an approver',
  Approved: 'approved — not in use yet',
  Active: 'in use',
  Suspended: 'suspended',
  Superseded: 'replaced by a later version',
  Retired: 'retired',
  Archived: 'archived',
  Rejected: 'not approved',
};

export function Interventions({ session }: { session: StaffSession }) {
  const [items, setItems] = useState<InterventionItem[] | null>(null);
  const [error, setError] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [draft, setDraft] = useState({ interventionCode: '', name: '' });
  const [contents, setContents] = useState<Record<string, string>>({});

  const load = async () => {
    try {
      const res = await staffApi.listInterventions(session);
      setItems(res.data.map((i) => i.attributes));
      setError('');
    } catch (err) {
      setError(staffLoadError(err, 'the intervention portfolio'));
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const run = async (fn: () => Promise<unknown>, done: string) => {
    try {
      await fn();
      setAnnouncement(done);
      await load();
    } catch (err) {
      setAnnouncement(staffActionError(err, 'That step'));
    }
  };

  return (
    <section aria-labelledby="interventions-heading">
      <h2 id="interventions-heading">Interventions</h2>
      <p>
        An intervention is a name and a code that never change. What it actually consists of lives in its versions,
        and only a version can be submitted, approved or put into use — so changing an intervention means adding a
        version, never editing one that has been approved. The database refuses that outright.
      </p>
      {/*
        Said because it is about to be conspicuous by its absence: the
        approver's step is not on this screen, and somebody who cannot
        find it needs to know it is somebody else's to take.
      */}
      <p>
        You can draft a version and submit it. Approving and activating are not here: whoever approves cannot be
        whoever submitted, and the server refuses it even if both were the same person&apos;s screens.
      </p>

      <h3>Add an intervention</h3>
      <p>
        <label htmlFor="int-code">Code (permanent — it never encodes the version or the status)</label>{' '}
        <input
          id="int-code"
          value={draft.interventionCode}
          onChange={(e) => setDraft({ ...draft, interventionCode: e.target.value })}
        />
      </p>
      <p>
        <label htmlFor="int-name">Name</label>{' '}
        <input id="int-name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
      </p>
      <p>
        <button
          disabled={draft.interventionCode.trim() === '' || draft.name.trim() === ''}
          onClick={() =>
            void run(
              () => staffApi.createIntervention(session, draft.interventionCode.trim(), draft.name.trim()),
              'Added. It has no versions yet, so there is nothing to approve.',
            )
          }
        >
          Add this intervention
        </button>
      </p>

      <h3>The portfolio</h3>
      <p>
        <button onClick={() => void load()}>Refresh</button>
      </p>
      {error !== '' && <p role="alert">{error}</p>}
      {items !== null && items.length === 0 && <p>There are no interventions yet.</p>}

      {(items ?? []).map((i) => (
        <article key={i.interventionId} aria-label={`Intervention ${i.interventionCode}`}>
          <h4>
            {i.interventionCode} — {i.name}
          </h4>
          {/*
            The evidence grade is NOT shown as a grade. Both columns carry
            their defaults on every row in the database because no code
            anywhere writes either one, so printing "E0" and "Not
            Evaluated" beside an intervention would read as a judgement
            somebody made about it. On a platform about evidence-based
            interventions that is the most misleading blank there is.
          */}
          <p>
            <small>
              How strong the evidence for this is, and which way it points, are not recorded anywhere in this
              platform — there is nothing that can write them, so there is nothing to show. It is not that this
              intervention was assessed and came out low.
            </small>
          </p>
          {i.versions.length === 0 ? (
            <p>No versions yet. An intervention with no version is a name, and nothing can be approved or used.</p>
          ) : (
            <ol>
              {i.versions.map((v) => (
                <li key={v.interventionVersionId}>
                  Version {v.versionNumber}: <strong>{VERSION_STATE_WORDING[v.versionState] ?? v.versionState}</strong>
                  <br />
                  <small>
                    {v.submittedByActorId === null ? 'Not submitted by anyone yet.' : `Submitted by ${v.submittedByActorId}.`}{' '}
                    {v.approvedByActorId === null
                      ? ''
                      : `Approved by ${v.approvedByActorId} on ${new Date(v.approvedAt ?? '').toLocaleDateString()}.`}
                  </small>
                  {v.versionState === 'Draft' && (
                    <p>
                      <button
                        onClick={() =>
                          void run(
                            () => staffApi.submitInterventionVersion(session, v.interventionVersionId),
                            'Submitted. It is now waiting for an approver who is not you.',
                          )
                        }
                      >
                        Submit version {v.versionNumber} for review
                      </button>{' '}
                      <small>After this its content cannot be changed by editing — only by a further version.</small>
                    </p>
                  )}
                </li>
              ))}
            </ol>
          )}
          <p>
            <label htmlFor={`int-content-${i.interventionId}`}>What this version consists of</label>{' '}
            <input
              id={`int-content-${i.interventionId}`}
              value={contents[i.interventionId] ?? ''}
              onChange={(e) => setContents({ ...contents, [i.interventionId]: e.target.value })}
            />{' '}
            <button
              disabled={(contents[i.interventionId] ?? '').trim() === ''}
              onClick={() =>
                void run(
                  () =>
                    staffApi.createInterventionVersion(session, i.interventionId, {
                      description: (contents[i.interventionId] ?? '').trim(),
                    }),
                  'A new draft version was added.',
                )
              }
            >
              Add a version
            </button>
          </p>
        </article>
      ))}
      <p aria-live="polite" role="status">
        {announcement}
      </p>
    </section>
  );
}
