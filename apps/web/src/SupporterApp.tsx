import { useState } from 'react';
import { accessTokenHeader, PlatformApiError, raiseApiError, type ApiError } from './api.js';
import { staffActionError } from './errors.js';
import { AccessTokenGate } from './components/AccessTokenGate.js';

interface SupporterSession {
  actorId: string;
}

async function req<T>(session: SupporterSession, path: string, body?: object): Promise<T> {
  const res = await fetch(path, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { 'content-type': 'application/json', 'x-actor-id': session.actorId, ...accessTokenHeader() },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const json = (await res.json()) as T & { error?: ApiError };
  if (!res.ok) raiseApiError(json, res.status);
  return json;
}

interface Contribution {
  contributionId: string;
  archiveId: string;
  contentText: string;
  contributionState: string;
}

const STATE_LABELS: Record<string, string> = {
  Proposed: 'Submitted, waiting for them to review it',
  'In Review': 'They are reviewing it',
  Accepted: 'Accepted (recorded as your contribution, not as their own testimony)',
  Rejected: 'Not accepted',
  Withdrawn: 'Withdrawn',
  Superseded: 'Replaced by a newer version',
};

/**
 * Supporter workspace (Doc 20): propose life-story contributions and
 * follow their honest states. A contribution needs the participant's
 * approved relationship AND their supporter-contribution consent; the
 * participant decides — acceptance records it as a SUPPORTER
 * contribution, never as the participant's own testimony (ADR-042).
 */
export function SupporterApp({ onExit }: { onExit: () => void }) {
  const [session, setSession] = useState<SupporterSession | null>(null);
  const [actorId, setActorId] = useState('');
  const [form, setForm] = useState({ archiveId: '', itemId: '', contentText: '' });
  const [mine, setMine] = useState<Contribution[] | null>(null);
  const [report, setReport] = useState({ actorId: '', description: '' });
  const [announcement, setAnnouncement] = useState('');

  const run = async (fn: () => Promise<unknown>, done: string) => {
    try {
      await fn();
      setAnnouncement(done);
    } catch (err) {
      setAnnouncement(
        err instanceof PlatformApiError && err.status === 404
          ? 'Not submitted: this needs the participant to have approved your relationship and to have consented to supporter contributions.'
          : staffActionError(err, 'That step'),
      );
    }
  };

  if (session === null) {
    return (
      <main>
        <h1>Supporter workspace (development environment)</h1>
        <p>
          You can propose additions to the life story of someone close to you. Whether to accept is always their
          decision, and anything accepted is recorded as your contribution — it does not become their own testimony.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (actorId !== '') setSession({ actorId });
          }}
        >
          <p>
            <label htmlFor="sup-actor">Account identifier (actor id)</label>{' '}
            <input id="sup-actor" value={actorId} onChange={(e) => setActorId(e.target.value)} />
          </p>
          <button type="submit">Continue</button>{' '}
          <button type="button" onClick={onExit}>
            Back
          </button>
        </form>
      </main>
    );
  }

  return (
    <main>
      <h1>Supporter workspace</h1>
      <AccessTokenGate />
      <section aria-labelledby="contrib-heading">
        <h2 id="contrib-heading">Propose a life story contribution</h2>
        <p>
          Submitting needs them to have approved your relationship and to have consented to supporter contributions.
          What you write goes to them first, and they decide whether to accept it.
        </p>
        <p>
          <label htmlFor="c-archive">Archive identifier</label>{' '}
          <input id="c-archive" value={form.archiveId} onChange={(e) => setForm({ ...form, archiveId: e.target.value })} />
        </p>
        <p>
          <label htmlFor="c-item">Item identifier (leave empty to propose a new item)</label>{' '}
          <input id="c-item" value={form.itemId} onChange={(e) => setForm({ ...form, itemId: e.target.value })} />
        </p>
        <p>
          <label htmlFor="c-text">What you would like to add</label>
        </p>
        <textarea id="c-text" rows={3} value={form.contentText} onChange={(e) => setForm({ ...form, contentText: e.target.value })} />
        <p>
          <button
            disabled={form.archiveId === '' || form.contentText === ''}
            onClick={() =>
              void run(
                () =>
                  req(session, `/v1/life-story/archives/${form.archiveId}/contributions`, {
                    ...(form.itemId === '' ? {} : { itemId: form.itemId }),
                    contentText: form.contentText,
                  }),
                'Submitted, waiting for them to review it.',
              )
            }
          >
            Submit contribution
          </button>
        </p>
      </section>

      <section aria-labelledby="mine-heading">
        <h2 id="mine-heading">My contributions</h2>
        <p>
          <button
            onClick={() =>
              void run(async () => {
                const res = await req<{ data: { attributes: Contribution }[] }>(session, '/v1/life-story/contributions/mine');
                setMine(res.data.map((c) => c.attributes));
              }, 'Updated.')
            }
          >
            View my contributions
          </button>
        </p>
        {mine !== null && (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {mine.length === 0 && <li>You have not submitted any contributions yet.</li>}
            {mine.map((c) => (
              <li key={c.contributionId} style={{ border: '1px solid currentColor', padding: '0.5rem', marginBlock: '0.5rem' }}>
                <p>{c.contentText}</p>
                <p>State: {STATE_LABELS[c.contributionState] ?? c.contributionState}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="sup-report-heading">
        <h2 id="sup-report-heading">Report a problem</h2>
        <p>Reports are read by staff — no automated system decides them on its own.</p>
        <p>
          <label htmlFor="r-actor">The other person&apos;s identifier</label>{' '}
          <input id="r-actor" value={report.actorId} onChange={(e) => setReport({ ...report, actorId: e.target.value })} />
        </p>
        <p>
          <label htmlFor="r-desc">What happened</label>
        </p>
        <textarea id="r-desc" rows={2} value={report.description} onChange={(e) => setReport({ ...report, description: e.target.value })} />
        <p>
          <button
            disabled={report.actorId === '' || report.description === ''}
            onClick={() =>
              void run(
                () =>
                  req(session, '/v1/reports', {
                    reporterId: session.actorId,
                    reportedActorId: report.actorId,
                    category: 'other',
                    description: report.description,
                  }),
                'Report submitted. Staff will read it.',
              )
            }
          >
            Submit report
          </button>
        </p>
      </section>

      <p>
        <button onClick={onExit}>Leave the supporter workspace</button>
      </p>
      <p aria-live="polite" role="status">
        {announcement}
      </p>
    </main>
  );
}
