import { useEffect, useState } from 'react';
import { RefusalNote } from './RefusalNote.js';
import { staffActionError, staffLoadError } from '../errors.js';
import { staffApi, type EvidenceReviewItem, type KnowledgeResourceItem, type StaffSession } from '../staff-api.js';

/**
 * Searching the knowledge platform and building an evidence review from
 * what comes back.
 *
 * Searching was reachable and attaching a reference was reachable, but
 * nothing listed a review — so one could be started, added to and
 * submitted only by someone tracking identifiers outside the product, and
 * the reviewer's queue at the end of the chain had nothing anyone could
 * get to.
 *
 * Two rules the screen has to hold to.
 *
 * Source before assertion (Doc 20 §51): a result leads with where it came
 * from and which version of it, not with its summary. The summary is what
 * a search engine says about a paper; the source is what lets a reader
 * decide whether to believe any of it.
 *
 * A failed lookup is not a citation. When the platform cannot resolve an
 * identifier the reference is stored with the raw identifier as its title
 * and `unknown` as its source, and rendering that like a resolved one
 * would turn "we could not find this" into what looks like a reference.
 */
const RESOLUTION_WORDING: Record<string, string> = {
  Resolved: 'Found in the source system.',
  Unresolved: 'Not looked up yet.',
  'Resolution Failed': 'Could not be found. Nothing here has been checked against a source.',
  'Source Unavailable': 'The source system could not be reached, so this has not been checked.',
};

const REVIEW_WORDING: Record<string, string> = {
  Draft: 'Being put together. Not submitted.',
  'In Review': 'Submitted. Waiting for someone else to approve it.',
  Approved: 'Approved.',
  'Returned for Revision': 'Sent back for more work.',
  Superseded: 'Replaced by a later review.',
  Archived: 'Archived.',
};

export function EvidenceWork({ session }: { session: StaffSession }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<KnowledgeResourceItem[] | null>(null);
  const [searchError, setSearchError] = useState('');
  const [reviews, setReviews] = useState<EvidenceReviewItem[] | null>(null);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [form, setForm] = useState({ projectId: '', question: '' });
  const [attachTo, setAttachTo] = useState('');

  const load = async () => {
    try {
      setReviews((await staffApi.listEvidenceWork(session)).data.map((i) => i.attributes));
      setLoadError('');
    } catch (err) {
      setLoadError(staffLoadError(err, 'the evidence reviews'));
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

  const search = async () => {
    try {
      setResults((await staffApi.searchEvidence(session, query)).data.map((i) => i.attributes));
      setSearchError('');
    } catch (err) {
      // Never rendered as "no results": a failure to ask is not an answer.
      setResults(null);
      setSearchError(staffLoadError(err, 'the knowledge platform'));
    }
  };

  const open = (reviews ?? []).filter((r) => r.reviewState === 'Draft');

  return (
    <section aria-labelledby="evidence-heading">
      <h3 id="evidence-heading">Evidence</h3>

      <h4>Search the knowledge platform</h4>
      <p>
        Results come from an outside system and are suggestions, not platform records. Nothing here is kept until you
        attach it to a review.
      </p>
      <p>
        <label htmlFor="ev-q">What are you looking for</label>{' '}
        <input id="ev-q" value={query} onChange={(e) => setQuery(e.target.value)} />{' '}
        <button disabled={query === ''} onClick={() => void search()}>
          Search
        </button>
      </p>
      {searchError !== '' && <p role="alert">{searchError}</p>}
      {results !== null && results.length === 0 && (
        <p>Nothing came back for that. That is an answer from the source system, not a failure to ask it.</p>
      )}
      {(results ?? []).map((r) => (
        <article key={r.externalIdentifier} aria-label={`Result ${r.externalIdentifier}`}>
          {/* Source first, then the claim (§51). */}
          <p>
            <strong>{r.sourceSystem}</strong> · {r.externalIdentifier} · version {r.externalVersion}
          </p>
          <p>{r.title}</p>
          <p>{r.summary}</p>
          {open.length > 0 && (
            <p>
              <label htmlFor={`att-${r.externalIdentifier}`}>Attach to</label>{' '}
              <select id={`att-${r.externalIdentifier}`} value={attachTo} onChange={(e) => setAttachTo(e.target.value)}>
                <option value="">Choose a review</option>
                {open.map((rev) => (
                  <option key={rev.evidenceReviewId} value={rev.evidenceReviewId}>
                    {rev.question}
                  </option>
                ))}
              </select>{' '}
              <button
                disabled={attachTo === ''}
                onClick={() =>
                  void run(
                    () => staffApi.attachEvidenceReference(session, attachTo, r.externalIdentifier),
                    'Attached. The platform looked it up again and recorded what it found.',
                  )
                }
              >
                Attach this
              </button>
            </p>
          )}
        </article>
      ))}

      <h4>Start a review</h4>
      <p>
        <label htmlFor="ev-proj">Research project identifier</label>{' '}
        <input id="ev-proj" value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })} />
      </p>
      <p>
        <label htmlFor="ev-question">The question this review answers</label>{' '}
        <input id="ev-question" value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} />
      </p>
      <p>
        <button
          disabled={form.projectId === '' || form.question === ''}
          onClick={() =>
            void run(
              () => staffApi.createEvidenceReview(session, form.projectId, form.question),
              'Review started. Attach what it rests on before submitting it.',
            )
          }
        >
          Start this review
        </button>
      </p>

      <h4>Reviews</h4>
      <p>
        <button onClick={() => void load()}>Refresh</button>
      </p>
      {loadError !== '' && <p role="alert">{loadError}</p>}
      {reviews !== null && reviews.length === 0 && <p>No evidence review has been started yet.</p>}

      {(reviews ?? []).map((r) => (
        <article key={r.evidenceReviewId} aria-label={`Review ${r.question}`}>
          <p>
            <strong>{r.question}</strong> — {REVIEW_WORDING[r.reviewState] ?? r.reviewState}
          </p>
          <RefusalNote reason={r.refusedReason} byActorId={r.refusedByActorId} verb="Sent back" />
          {r.references.length === 0 ? (
            <p>Nothing attached yet. A review with nothing attached rests on nothing.</p>
          ) : (
            <ul>
              {r.references.map((k) => (
                <li key={k.knowledgeReferenceId}>
                  <strong>{k.sourceSystem}</strong> · {k.externalIdentifier}
                  {k.externalVersion === null ? '' : ` · version ${k.externalVersion}`} — {k.title}
                  <br />
                  {RESOLUTION_WORDING[k.resolutionState] ?? k.resolutionState}
                </li>
              ))}
            </ul>
          )}
          {r.reviewState === 'Draft' && (
            <p>
              <button
                disabled={r.references.length === 0}
                onClick={() =>
                  void run(
                    () => staffApi.submitEvidenceReview(session, r.evidenceReviewId),
                    'Submitted. Someone else has to approve it — you cannot approve your own.',
                  )
                }
              >
                Submit for review
              </button>
              {r.references.length === 0 && ' Attach at least one reference first.'}
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
