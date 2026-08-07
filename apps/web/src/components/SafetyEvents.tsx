import { useEffect, useState } from 'react';
import { staffActionError, staffLoadError } from '../errors.js';
import { staffApi, type SafetyEventItem, type StaffSession } from '../staff-api.js';

/**
 * Confirmed safety events, and what has been done about each (F5).
 *
 * A safety event could be created — the strongest thing a safety reviewer
 * can do — and then nothing could change it, nothing listed it and nothing
 * showed it. The triage screen said the reviewer had "converted this to a
 * safety event", which reads as an escalation to something that will be
 * worked, and nothing worked it. The permission to read one
 * (`safety-event.review`) had existed all along with nothing to read.
 *
 * Nothing on this screen suggests the platform does anything about a
 * safety event. It holds the account of what people did. Resolving a
 * record does not resolve a risk, and the wording says so where somebody
 * is about to press the button.
 */
const ACTION_STATES = [
  { value: 'Not Started' as const, label: 'Not started' },
  { value: 'In Progress' as const, label: 'In progress' },
  { value: 'Completed' as const, label: 'Done' },
  {
    value: 'No Action Taken' as const,
    label: 'Decided that no action was needed',
  },
];

/** Plain words, and never colour alone (§200). */
const EVENT_STATE_WORDING: Record<string, string> = {
  Open: 'Open — confirmed, nobody has picked it up yet',
  'In Review': 'Someone is looking at it',
  'Action Required': 'Something needs doing',
  Monitoring: 'Being watched for now',
  Resolved: 'Recorded as dealt with',
  Closed: 'Closed',
  Reopened: 'Opened again',
};

/**
 * Kept in step with the module's own table. A screen that offered a move
 * the command refuses would be a control that cannot work, which is the
 * defect this whole sweep exists to remove.
 */
const NEXT_STATES: Record<string, string[]> = {
  Open: ['In Review'],
  'In Review': ['Action Required', 'Monitoring', 'Resolved', 'Closed'],
  'Action Required': ['Monitoring', 'Resolved', 'Closed'],
  Monitoring: ['Action Required', 'Resolved', 'Closed'],
  Resolved: ['Reopened'],
  Closed: ['Reopened'],
  Reopened: ['In Review'],
};

export function SafetyEvents({ session }: { session: StaffSession }) {
  const [events, setEvents] = useState<SafetyEventItem[] | null>(null);
  const [error, setError] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [drafts, setDrafts] = useState<
    Record<string, { label: string; actionState: (typeof ACTION_STATES)[number]['value']; note: string }>
  >({});
  const [moves, setMoves] = useState<Record<string, { toState: string; note: string }>>({});
  /*
   * Both writes on this screen check `safety-event.act`, which the
   * permission engine puts in the confirmation tier, and both recorded on
   * one click with `confirmed: true` supplied by the api client — the
   * server was told a person had confirmed on the word of a constant in
   * the transport layer. The screen already said what it had done after
   * the fact ("Recorded in your name. It cannot be changed"), which is
   * the wrong moment for a sentence like that.
   */
  const [confirming, setConfirming] = useState<
    { kind: 'action' | 'move'; eventId: string; heading: string; lines: string[]; go: () => Promise<unknown> } | null
  >(null);

  const load = async () => {
    try {
      const res = await staffApi.listSafetyEvents(session);
      setEvents(res.data.map((e) => e.attributes));
      setError('');
    } catch (err) {
      setError(staffLoadError(err, 'the safety events'));
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
      setAnnouncement(staffActionError(err, 'That safety record'));
    }
  };

  return (
    <section aria-labelledby="safety-events-heading">
      <h3 id="safety-events-heading">Confirmed safety events</h3>
      <p>
        A safety event exists because a person confirmed one. This screen is the record of what people have done
        about it. <strong>The platform does not do anything about a safety event on its own</strong> — it does not
        contact anyone, does not restrict anything and does not watch anything. Everything here is somebody writing
        down what they did.
      </p>
      <p>
        What you write is kept and cannot be edited or deleted afterwards. If something needs correcting, add another
        entry saying so; the first one stays.
      </p>
      <p>
        <button onClick={() => void load()}>Refresh the list</button>
      </p>
      {error !== '' && <p role="alert">{error}</p>}
      {events !== null && events.length === 0 && (
        <p>There are no confirmed safety events. Signals that have not been converted are on the triage screen.</p>
      )}

      {(events ?? []).map((e) => {
        const draft = drafts[e.safetyEventId] ?? { label: '', actionState: 'Completed' as const, note: '' };
        const move = moves[e.safetyEventId] ?? { toState: '', note: '' };
        const onwards = NEXT_STATES[e.eventState] ?? [];
        return (
          <article key={e.safetyEventId} aria-label={`Safety event ${e.safetyEventId}`}>
            <h4>{e.safetyEventId}</h4>
            {/* Severity in words, never a colour on its own (§200). */}
            <dl>
              <dt>Where it stands</dt>
              <dd>{EVENT_STATE_WORDING[e.eventState] ?? e.eventState}</dd>
              <dt>What was reported</dt>
              <dd>
                {e.category} · severity {e.severity}
              </dd>
              <dd>{e.description}</dd>
              <dt>Confirmed by</dt>
              <dd>
                {e.confirmedByActorId} on {new Date(e.confirmedAt).toLocaleString()}
              </dd>
            </dl>
            {/*
              Said rather than quietly omitted: the design asks for how
              related this is to the intervention, and nothing anywhere
              records it. A screen that left the question out would read as
              though nobody had asked it.
            */}
            <p>
              <small>
                How related this is to the intervention is not recorded anywhere yet, so it is not shown. It is not
                that nobody judged it — the platform has nowhere to put that judgement.
              </small>
            </p>

            <h5>What has been done</h5>
            {e.timeline.length === 0 ? (
              <p>
                Nothing has been recorded against this event. If no action is genuinely needed, record that as an
                action with your reason — <strong>a blank is not a judgement</strong>, and anyone reading this later
                cannot tell the difference between "nothing was needed" and "nobody looked".
              </p>
            ) : (
              <ol>
                {e.timeline.map((t) => (
                  <li key={t.entryId}>
                    <strong>{t.entryType === 'State' ? `Moved to ${t.label}` : t.label}</strong>
                    {t.actionState === null ? '' : ` — ${t.actionState}`}
                    <br />
                    {t.note}
                    <br />
                    <small>
                      {t.recordedByActorId} ·{' '}
                      <time dateTime={t.recordedAt}>{new Date(t.recordedAt).toLocaleString()}</time>
                    </small>
                  </li>
                ))}
              </ol>
            )}

            <h5>Record something you did</h5>
            <p>
              <label htmlFor={`sa-label-${e.safetyEventId}`}>What you did</label>
              <input
                id={`sa-label-${e.safetyEventId}`}
                value={draft.label}
                onChange={(ev) => setDrafts({ ...drafts, [e.safetyEventId]: { ...draft, label: ev.target.value } })}
              />
            </p>
            <p>
              <label htmlFor={`sa-state-${e.safetyEventId}`}>Where it stands</label>
              <select
                id={`sa-state-${e.safetyEventId}`}
                value={draft.actionState}
                onChange={(ev) =>
                  setDrafts({
                    ...drafts,
                    [e.safetyEventId]: {
                      ...draft,
                      actionState: ev.target.value as (typeof ACTION_STATES)[number]['value'],
                    },
                  })
                }
              >
                {ACTION_STATES.map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label}
                  </option>
                ))}
              </select>
            </p>
            <p>
              <label htmlFor={`sa-note-${e.safetyEventId}`}>Anything a colleague would need to know (required)</label>
              <textarea
                id={`sa-note-${e.safetyEventId}`}
                rows={2}
                value={draft.note}
                onChange={(ev) => setDrafts({ ...drafts, [e.safetyEventId]: { ...draft, note: ev.target.value } })}
              />
            </p>
            {/*
              The design is explicit that the content of a call or a
              conversation is not recorded here. Saying it beside the box is
              the only place it can prevent anything.
            */}
            <p>
              <small>
                Write what was done, not what was said. What someone told you in a call belongs in the clinical
                record, not here.
              </small>
            </p>
            <p>
              <button
                disabled={draft.label.trim() === '' || draft.note.trim() === ''}
                onClick={() =>
                  setConfirming({
                    kind: 'action',
                    eventId: e.safetyEventId,
                    heading: `Record “${draft.label.trim()}” against this safety event?`,
                    lines: [
                      `Where it stands: ${ACTION_STATES.find((a) => a.value === draft.actionState)?.label ?? draft.actionState}.`,
                      `What you wrote: “${draft.note.trim()}”`,
                      'It is recorded in your name and cannot be edited or deleted afterwards. A correction is another entry; this one stays.',
                    ],
                    go: () =>
                      staffApi.recordSafetyAction(
                        session,
                        e.safetyEventId,
                        draft.label.trim(),
                        draft.actionState,
                        draft.note.trim(),
                      ),
                  })
                }
              >
                Record this
              </button>
            </p>

            {onwards.length > 0 && (
              <>
                <h5>Move where this event stands</h5>
                <p>
                  <label htmlFor={`sm-state-${e.safetyEventId}`}>Move it to</label>
                  <select
                    id={`sm-state-${e.safetyEventId}`}
                    value={move.toState}
                    onChange={(ev) =>
                      setMoves({ ...moves, [e.safetyEventId]: { ...move, toState: ev.target.value } })
                    }
                  >
                    <option value="">Choose…</option>
                    {onwards.map((st) => (
                      <option key={st} value={st}>
                        {EVENT_STATE_WORDING[st] ?? st}
                      </option>
                    ))}
                  </select>
                </p>
                <p>
                  <label htmlFor={`sm-note-${e.safetyEventId}`}>Why (required)</label>
                  <textarea
                    id={`sm-note-${e.safetyEventId}`}
                    rows={2}
                    value={move.note}
                    onChange={(ev) => setMoves({ ...moves, [e.safetyEventId]: { ...move, note: ev.target.value } })}
                  />
                </p>
                {/*
                  The one sentence that has to be here. Closing a record and
                  ending a risk are not the same act, and a screen that let
                  them read as one would be the most dangerous wording in
                  the platform.
                */}
                {(move.toState === 'Resolved' || move.toState === 'Closed') && (
                  <p role="note">
                    This records that the platform's part is finished. It does not mean the person is safe, and
                    nothing here tells anyone that they are.
                  </p>
                )}
                <p>
                  <button
                    disabled={move.toState === '' || move.note.trim() === ''}
                    onClick={() =>
                      setConfirming({
                        kind: 'move',
                        eventId: e.safetyEventId,
                        heading: `Move this event to “${EVENT_STATE_WORDING[move.toState] ?? move.toState}”?`,
                        lines: [
                          `Your reason: “${move.note.trim()}”`,
                          ...(move.toState === 'Resolved' || move.toState === 'Closed'
                            ? [
                                'This records that the platform’s part is finished. It does not mean the person is safe, and nothing here tells anyone that they are.',
                              ]
                            : []),
                          'It is recorded in your name and cannot be edited or deleted afterwards.',
                        ],
                        go: () =>
                          staffApi.moveSafetyEvent(session, e.safetyEventId, move.toState, move.note.trim()),
                      })
                    }
                  >
                    Move this event
                  </button>
                </p>
              </>
            )}
          </article>
        );
      })}
      {confirming !== null && (
        <div role="alertdialog" aria-labelledby="safety-confirm">
          <p id="safety-confirm">{confirming.heading}</p>
          {confirming.lines.map((l) => (
            <p key={l}>{l}</p>
          ))}
          <p>
            <button
              onClick={() => {
                const target = confirming;
                setConfirming(null);
                void run(target.go, 'Recorded in your name. It cannot be changed.');
              }}
            >
              Yes, record it
            </button>{' '}
            <button onClick={() => setConfirming(null)}>Go back</button>
          </p>
        </div>
      )}
      <p aria-live="polite" role="status">
        {announcement}
      </p>
    </section>
  );
}
