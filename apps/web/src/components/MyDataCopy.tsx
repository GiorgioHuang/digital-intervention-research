import { useEffect, useState } from 'react';
import { api, type MyExportRequest, type Session } from '../api.js';
import { presentError, type PresentedError } from '../errors.js';
import { EmptyState, ErrorState, LoadingState } from './StateBlock.js';

/**
 * Asking for a copy of your own information, and seeing what happened to
 * the request.
 *
 * The command was owner-permitted and had a route from the start, but
 * nothing in the participant's workspace reached it, so this right existed
 * only for whoever knew the API. The listing matters just as much as the
 * button: a request whose outcome you cannot see is indistinguishable from
 * one that was never made, and a rejection would look exactly like
 * silence.
 *
 * The wording never promises delivery. A request is reviewed by someone
 * who is not the person who asked — the database refuses a decision made
 * by the requester.
 *
 * What it used to promise was a copy. "The copy has been put together"
 * described a step nothing performs: the command writes a manifest —
 * what was agreed may be shared, with a hash over it — and reads no
 * records at all. The people running the study gather the information
 * and get it to the person themselves. Someone told their copy existed
 * would be waiting for a file this platform was never going to produce,
 * and "the copy has been sent to you" would have them checking an inbox
 * for something nothing here sends.
 *
 * So the states are described as what they are: a decision, a record of
 * what may be shared, and somebody's account of handing it over.
 */
const STATE_WORDING: Record<string, string> = {
  Requested: 'Asked for. Nobody has looked at it yet.',
  Approved: 'Agreed to. Nothing has been gathered yet.',
  Rejected: 'Not agreed to. If you want to know why, ask the research team.',
  Generated:
    'The research team has written down exactly what may be shared with you. They still have to gather it and get it to you — this platform does not do that part.',
  Delivered: 'Somebody has recorded that they gave it to you. If nothing has reached you, say so — that record is theirs, not proof.',
  Received: 'You confirmed you received the copy.',
};

/** Nothing further will happen to these on its own. */
const SETTLED = new Set(['Rejected', 'Received']);

export function MyDataCopy({ session }: { session: Session }) {
  const [requests, setRequests] = useState<MyExportRequest[] | null>(null);
  const [loadError, setLoadError] = useState<PresentedError | null>(null);
  const [actionError, setActionError] = useState<PresentedError | null>(null);
  const [asking, setAsking] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  const load = async () => {
    try {
      setRequests((await api.listMyExportRequests(session)).data.map((d) => d.attributes));
      setLoadError(null);
    } catch (err) {
      setLoadError(presentError(err));
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const ask = async () => {
    try {
      await api.requestMyExport(session);
      setActionError(null);
      setAsking(false);
      setAnnouncement('Asked for. You can see what happens to it on this screen.');
      await load();
    } catch (err) {
      setActionError(presentError(err));
    }
  };

  const open = (requests ?? []).filter((r) => !SETTLED.has(r.requestState));

  return (
    <section aria-labelledby="data-copy-heading">
      <h1 id="data-copy-heading">A copy of my information</h1>
      <p>
        You can ask for a copy of the information this platform holds about you. You do not have to say why.
      </p>

      {requests === null && loadError === null && <LoadingState label="Loading what you have asked for…" />}
      {loadError !== null && <ErrorState error={loadError} />}

      {requests !== null && requests.length === 0 && (
        <EmptyState title="You have not asked for a copy yet" detail="Asking does not change anything else." />
      )}

      {(requests ?? []).map((r) => (
        <article key={r.exportRequestId} aria-label={`Request ${r.exportRequestId}`}>
          <p>
            <strong>Asked for on {new Date(r.createdAt).toLocaleDateString()}:</strong>{' '}
            {STATE_WORDING[r.requestState] ?? r.requestState}
          </p>
        </article>
      ))}

      {requests !== null && open.length === 0 && !asking && (
        <p>
          <button onClick={() => setAsking(true)}>Ask for a copy of my information</button>
        </p>
      )}
      {requests !== null && open.length > 0 && (
        <p>
          You have already asked, and that request has not finished. Asking again would not make it any faster.
        </p>
      )}

      {asking && (
        <div role="alertdialog" aria-labelledby="ask-copy-heading">
          <h2 id="ask-copy-heading">Ask for a copy of your information?</h2>
          <p>
            This is a request, not a download. Someone other than you reviews it — the platform will not let the
            person who asked be the person who agrees.
          </p>
          <p>
            After that, <strong>people gather the information and get it to you</strong>. Nothing is sent from here
            and no file appears on this screen. What this platform records is the decision and exactly what may be
            shared; the rest is the research team&apos;s work, and if it does not reach you, they are who to ask.
          </p>
          <p>
            The copy covers the records you are allowed to have. Things other people wrote about themselves are not
            included, because they are not yours to take away.
          </p>
          <p>
            <button onClick={() => void ask()}>Yes, ask for a copy</button>{' '}
            <button onClick={() => setAsking(false)}>Go back without asking</button>
          </p>
        </div>
      )}

      {actionError !== null && <ErrorState error={actionError} />}
      <p aria-live="polite" role="status">
        {announcement}
      </p>
    </section>
  );
}
