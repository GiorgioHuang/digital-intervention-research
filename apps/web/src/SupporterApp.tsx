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

interface SupportedPerson {
  relationshipId: string;
  participantId: string;
  participantDisplayName: string | null;
  relationshipType: string;
  relationshipState: string;
  permittedActions: string[];
  expiresAt: string | null;
}

/**
 * What the relationship record says, said plainly. Deliberately says
 * nothing about whether an action will actually succeed — that also
 * depends on the participant's consent and on other things that are
 * theirs to decide, and reporting those here would let a supporter
 * work out something the participant did not choose to tell them.
 */
const RELATIONSHIP_STATE_LABELS: Record<string, string> = {
  Proposed: 'They have not decided yet.',
  PendingVerification: 'They have not decided yet.',
  Active: 'They agreed to this.',
  Restricted: 'They agreed to this, with limits.',
  Suspended: 'This is paused.',
  Expired: 'This has run out.',
  Revoked: 'They ended this.',
  Rejected: 'They said no to this.',
};

const SUPPORTER_ACTION_LABELS: Record<string, string> = {
  'participant.view-shared': 'See what they have chosen to share with supporters',
  'life-story.contribute': 'Offer something for their life story, which only they can accept',
};

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
  const [form, setForm] = useState({ contentText: '' });
  const [mine, setMine] = useState<Contribution[] | null>(null);
  const [report, setReport] = useState({ actorId: '', description: '' });
  const [announcement, setAnnouncement] = useState('');
  const [people, setPeople] = useState<SupportedPerson[] | null>(null);
  const [writingFor, setWritingFor] = useState<SupportedPerson | null>(null);
  /**
   * Where the contribution goes, looked up rather than typed. Undefined
   * means not looked up yet; null means they have not started a life
   * story, which is a different fact and reads differently.
   */
  const [archiveId, setArchiveId] = useState<string | null | undefined>(undefined);

  const loadPeople = async (s: SupporterSession) => {
    const res = await req<{ data: { attributes: SupportedPerson }[] }>(s, '/v1/relationships/mine');
    setPeople(res.data.map((p) => p.attributes));
  };

  const startWriting = async (p: SupportedPerson) => {
    setWritingFor(p);
    setArchiveId(undefined);
    setForm({ contentText: '' });
    await run(async () => {
      const res = await req<{ data: { id: string | null } }>(
        session!,
        `/v1/participants/${p.participantId}/life-story/archive-for-contribution`,
      );
      setArchiveId(res.data.id);
    }, '');
  };

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
            if (actorId === '') return;
            const s = { actorId };
            setSession(s);
            void run(() => loadPeople(s), '');
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
      {/*
        A supporter used to have to type an archive identifier they could
        only have been told out of band, and had no way to learn who they
        support or on what terms. Both are now read from the relationships
        they are actually named in.
      */}
      <section aria-labelledby="people-heading">
        <h2 id="people-heading">The people you support</h2>
        <p>
          Everything here was decided by the person themselves. What you can actually do also depends on their
          consent choices, which are theirs and are not shown here.
        </p>
        {people === null && <p>Loading the people you support…</p>}
        {people !== null && people.length === 0 && (
          <p>Nobody has named you as a supporter. If someone does, they will appear here once they decide.</p>
        )}
        {(people ?? []).map((p) => (
          <article key={p.relationshipId} aria-label={`Supporting ${p.participantDisplayName ?? p.participantId}`}>
            <h3>{p.participantDisplayName ?? p.participantId}</h3>
            <p>{RELATIONSHIP_STATE_LABELS[p.relationshipState] ?? p.relationshipState}</p>
            {p.permittedActions.length > 0 && (
              <ul>
                {p.permittedActions.map((a) => (
                  <li key={a}>{SUPPORTER_ACTION_LABELS[a] ?? a}</li>
                ))}
              </ul>
            )}
            {p.expiresAt !== null && <p>This runs out on {new Date(p.expiresAt).toLocaleDateString()}.</p>}
            {p.permittedActions.includes('life-story.contribute') && p.relationshipState === 'Active' && (
              <p>
                <button onClick={() => void startWriting(p)}>Offer something for their life story</button>
              </p>
            )}
          </article>
        ))}
      </section>

      {writingFor !== null && (
        <section aria-labelledby="contrib-heading">
          <h2 id="contrib-heading">
            Offer something for {writingFor.participantDisplayName ?? writingFor.participantId}
          </h2>
          <p>
            What you write goes to them first, and they decide whether to accept it. If they accept, it is kept as
            your account of things — it does not become their own words.
          </p>
          {archiveId === undefined && <p>Checking where this would go…</p>}
          {archiveId === null && (
            <p>They have not started a life story yet, so there is nothing to add to.</p>
          )}
          {archiveId !== undefined && archiveId !== null && (
            <>
              <p>
                <label htmlFor="c-text">What you would like to add</label>
              </p>
              <textarea
                id="c-text"
                rows={3}
                value={form.contentText}
                onChange={(e) => setForm({ contentText: e.target.value })}
              />
              <p>
                <button
                  disabled={form.contentText === ''}
                  onClick={() =>
                    void run(
                      () => req(session, `/v1/life-story/archives/${archiveId}/contributions`, {
                        contentText: form.contentText,
                      }),
                      'Submitted, waiting for them to review it.',
                    )
                  }
                >
                  Submit contribution
                </button>{' '}
                {/* Closing does not discard what was typed. */}
                <button onClick={() => setWritingFor(null)}>Close</button>
              </p>
            </>
          )}
        </section>
      )}

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
