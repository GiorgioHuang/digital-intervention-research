import { useState } from 'react';
import { staffLoadError } from '../errors.js';
import { staffApi, type AuditEventItem, type AuditFilters, type StaffSession } from '../staff-api.js';

/**
 * Reading the platform's accountability record (G7, Doc 15 §21).
 *
 * Sixty-one places in the code write an audit event. Until this screen
 * existed, nothing anywhere read one: the store was append-only by
 * database trigger and unreadable by any human being, and `audit.view`
 * had been granted to three roles since the permission catalogue was
 * written without a single line of code ever checking it. Of everything
 * this sweep has turned up, that was the largest — the recording was
 * complete, correct and fail-closed, and no one could ever see it.
 *
 * Two things about this screen are more important than the table.
 *
 * The first is what the record does NOT contain, said before anyone
 * reads a row.
 *
 * This screen used to say that only actions which changed something are
 * written here, which reads as a promise that everything which changed
 * something is. It was not: thirty-nine application commands write to
 * the database and record nothing, including — until this was fixed —
 * the two that attach data to a participant's enrolment. A partial
 * record presented as a complete one is worse than no record, because
 * an absence in it reads as proof. Delivery and assessment now write an
 * entry, the rest are pinned by a test in the database package, and this
 * screen says plainly that it is not every change.
 *
 * Nothing records a read, so this cannot answer "who looked at my file".
 * And although the store has a column for whether a permission was
 * allowed or refused, no code has ever written either value — every row
 * here is something that was carried out or failed while being carried
 * out. A refused attempt leaves no trace at all. Somebody searching for
 * an abuse and finding nothing would otherwise conclude that nothing was
 * attempted.
 *
 * The second is that reading this is itself recorded, with the reason
 * typed below and the filters used. A record whose readers leave no
 * trace is the one record a misuser has no reason to avoid.
 */
const RESULT_WORDING: Record<string, string> = {
  Succeeded: 'went through',
  Failed: 'failed while being carried out',
  Allowed: 'permitted',
  Denied: 'refused',
};

export function AuditAccess({ session }: { session: StaffSession }) {
  const [filters, setFilters] = useState<AuditFilters>({ accessReason: '' });
  const [rows, setRows] = useState<AuditEventItem[] | null>(null);
  const [error, setError] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [askedWith, setAskedWith] = useState<AuditFilters | null>(null);

  const set = (k: keyof AuditFilters, v: string) => setFilters({ ...filters, [k]: v });

  const run = async () => {
    try {
      const res = await staffApi.listAuditEvents(session, filters);
      setRows(res.data.map((r) => r.attributes));
      setAskedWith(filters);
      setError('');
      setAnnouncement(`${res.data.length} entries. This query has been recorded in your name.`);
    } catch (err) {
      setRows(null);
      setError(staffLoadError(err, 'the audit trail'));
    }
  };

  return (
    <section aria-labelledby="audit-heading">
      <h2 id="audit-heading">Audit</h2>

      {/*
        Said first and at length, because every row below reads
        differently once it is understood, and because the most damaging
        possible use of this screen is concluding from an empty result
        that nothing happened.
      */}
      <h3>What is in here, and what is not</h3>
      <p>
        This is a record of <strong>things people did that changed something</strong>: who, what, to which record,
        when, under which role and authentication.
      </p>
      <p>
        <strong>It is not every change.</strong> An entry is written only where the code that made the change was
        written to write one, and not every part of the platform does — most of the research workflow, community and
        messaging work is missing from here today. So a gap in this record is not evidence that nothing happened,
        and it is not a finding you can rest anything on.
      </p>
      <p>
        <strong>It does not record anyone reading anything.</strong> Looking at a participant&apos;s file, opening a
        conversation, running a report — none of that is written here. This screen cannot answer &ldquo;who has
        looked at my record&rdquo;, and nobody should be told that it can.
      </p>
      <p>
        <strong>It does not record refusals.</strong> When the permission engine turns somebody down, nothing is
        written. Every entry below is something that was carried out or that failed part-way through. Somebody
        looking here for an attempted abuse would find nothing — and that absence would mean only that this store
        was never told.
      </p>
      <p>
        Entries cannot be edited or deleted by anyone, including administrators; the database refuses it. They hold
        references and never the contents of what was acted on — no message text, no life-story writing, no
        reporter&apos;s identity.
      </p>
      <p role="note">
        <strong>Your reading is recorded too</strong>, in this same store, with the reason you type and the filters
        you use. It is written before any rows come back: if it cannot be written, you do not get the rows.
      </p>

      <h3>Ask the record something</h3>
      <p>
        <label htmlFor="audit-reason">Why you are looking (required — recorded with your query)</label>
        <br />
        <input
          id="audit-reason"
          size={60}
          value={filters.accessReason}
          onChange={(e) => set('accessReason', e.target.value)}
        />
      </p>
      {/*
        D-6 ruled this box must not be required, because at the time
        nothing stored what was typed in it and a required field whose
        contents are discarded is a promise the platform does not keep.
        That ruling named its own condition: re-evaluate if the backend
        ever records the field. It records it now, so the box is required
        — and it says where the answer goes, since a person who thinks a
        field is decorative writes decoration in it.
      */}
      <p>
        <small>
          What you write here is kept with the query and can be read by anyone who can read this screen. Write what
          would let a colleague judge whether this look was warranted.
        </small>
      </p>
      <p>
        <label htmlFor="audit-from">From (date and time)</label>{' '}
        <input id="audit-from" type="datetime-local" value={filters.from ?? ''} onChange={(e) => set('from', e.target.value)} />{' '}
        <label htmlFor="audit-to">To</label>{' '}
        <input id="audit-to" type="datetime-local" value={filters.to ?? ''} onChange={(e) => set('to', e.target.value)} />
      </p>
      <p>
        <label htmlFor="audit-actor">Who acted (account identifier)</label>{' '}
        <input id="audit-actor" value={filters.actorId ?? ''} onChange={(e) => set('actorId', e.target.value)} />{' '}
        <label htmlFor="audit-action">What they did (exact action name)</label>{' '}
        <input id="audit-action" value={filters.action ?? ''} onChange={(e) => set('action', e.target.value)} />
      </p>
      <p>
        <label htmlFor="audit-ttype">Kind of record</label>{' '}
        <input id="audit-ttype" value={filters.targetType ?? ''} onChange={(e) => set('targetType', e.target.value)} />{' '}
        <label htmlFor="audit-tid">That record&apos;s identifier</label>{' '}
        <input id="audit-tid" value={filters.targetId ?? ''} onChange={(e) => set('targetId', e.target.value)} />{' '}
        <label htmlFor="audit-pid">About which participant</label>{' '}
        <input id="audit-pid" value={filters.participantId ?? ''} onChange={(e) => set('participantId', e.target.value)} />
      </p>
      <p>
        <button disabled={filters.accessReason.trim() === ''} onClick={() => void run()}>
          Search the audit trail
        </button>{' '}
        {filters.accessReason.trim() === '' && <small>A reason is needed before this can run.</small>}
      </p>

      {error !== '' && <p role="alert">{error}</p>}

      {rows !== null && rows.length === 0 && (
        <p>
          Nothing matches what you asked for. <strong>That is not the same as nothing having happened</strong> —
          check the dates and the spelling of the action, and remember that reads and refusals are never written
          here at all.
        </p>
      )}

      {rows !== null && rows.length > 0 && (
        <>
          <p>
            {rows.length} entries, most recent first.{' '}
            {rows.length >= 100 && (
              <strong>
                This is a full page and there are probably more. Narrow the dates rather than reading this as the
                whole story.
              </strong>
            )}
          </p>
          <table>
            <caption>
              Audit entries matching {askedWith?.actorId === undefined || askedWith.actorId === '' ? 'your query' : `actions by ${askedWith.actorId}`}
            </caption>
            <thead>
              <tr>
                <th scope="col">When</th>
                <th scope="col">Who</th>
                <th scope="col">Did what</th>
                <th scope="col">To which record</th>
                <th scope="col">How it ended</th>
                <th scope="col">Signed in with</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.auditEventId}>
                  <td>
                    <time dateTime={r.occurredAt}>{new Date(r.occurredAt).toLocaleString()}</time>
                  </td>
                  <td>
                    {r.actorId}
                    <br />
                    <small>
                      {r.actorType}
                      {r.activeRole === null ? '' : `, acting as ${r.activeRole}`}
                    </small>
                  </td>
                  <td>
                    {r.action}
                    {/* The reason a colleague gave for reading this very
                        record, shown beside their read like any other act. */}
                    {r.accessReason === null ? '' : <><br /><small>Reason given: {r.accessReason}</small></>}
                  </td>
                  <td>
                    {r.targetType} {r.targetId}
                    {r.participantId === null ? '' : <><br /><small>about participant {r.participantId}</small></>}
                  </td>
                  {/* Never colour alone (§200): the outcome is a word. */}
                  <td>
                    {RESULT_WORDING[r.result] ?? r.result}
                    {r.policyDecisionReason === null ? '' : <><br /><small>{r.policyDecisionReason}</small></>}
                  </td>
                  <td>{r.authStrength ?? 'not recorded'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
      <p aria-live="polite" role="status">
        {announcement}
      </p>
    </section>
  );
}
