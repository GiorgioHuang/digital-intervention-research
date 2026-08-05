import { useEffect, useState } from 'react';
import { staffApi, type BreakGlassRecordItem, type StaffSession } from '../staff-api.js';
import {
  AuthStrengthNote,
  ConfirmDecision,
  ExactVersionBlock,
  useDecision,
  useQueue,
} from './approver/shared.js';

/**
 * Emergency access: the declaration, and the review that follows it.
 *
 * Both commands existed on the server with nothing calling either, so
 * `break-glass/pending-review` was a queue that could never be looked at
 * and could never have been filled through the product anyway. That is
 * the same defect found in the dataset and report chains — except this
 * one sits on the platform's accountability path, where a queue nobody
 * can see is the whole failure.
 *
 * WHAT THIS DOES NOT DO. Nothing in the codebase reads
 * `governance_audit.break_glass_records`. The permission engine does not
 * consult it, so recording emergency access grants no access at all, and
 * the expiry it carries expires nothing. This is the same shape as
 * recording an analysis run (C15): the act happens outside the platform
 * — at a console, at the database — and what the platform holds is the
 * account of it. The wording therefore never says "get access", and the
 * screen says plainly that no permission changes. Naming this button
 * "emergency access" would be the most consequential lie available here:
 * someone in a genuine emergency would press it and believe they were
 * now in.
 */
const OUTCOMES: { value: 'Justified' | 'Not Justified' | 'Needs Follow-Up'; label: string; meaning: string }[] = [
  {
    value: 'Justified',
    label: 'It was justified',
    meaning: 'The emergency was real and what was done was proportionate to it.',
  },
  {
    value: 'Not Justified',
    label: 'It was not justified',
    meaning:
      'The access should not have been taken. This does not undo it — nothing here can — it records that it was wrong.',
  },
  {
    value: 'Needs Follow-Up',
    label: 'It needs following up',
    meaning: 'Not decided either way yet. Something outside this screen has to happen before it can be.',
  },
];

export function StaffGovernancePanel({ session }: { session: StaffSession }) {
  return (
    <>
      <RecordEmergencyAccess session={session} />
      <BreakGlassReviews session={session} />
      <HoldsNotHere />
    </>
  );
}

function RecordEmergencyAccess({ session }: { session: StaffSession }) {
  const [reason, setReason] = useState('');
  const [scope, setScope] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const decision = useDecision();

  return (
    <section aria-labelledby="break-glass-heading">
      <h2 id="break-glass-heading">Record emergency access</h2>
      {/*
        First, before the form, because it changes whether someone should
        be on this screen at all.
      */}
      <p role="note">
        <strong>This does not give you access.</strong> The platform stores what you write here and changes no
        permission for anyone, including you. If you need to reach something urgently, that happens outside this
        platform. What this screen is for is putting it on the record so that somebody else has to look at it
        afterwards.
      </p>
      <p>
        Recording it is not optional after the fact and not private: every record goes into a queue that a different
        person reviews, and it cannot be reviewed by whoever recorded it.
      </p>
      <AuthStrengthNote needsMfa authStrength={session.authStrength} action="Recording emergency access" />
      <p>
        <label htmlFor="bg-reason">Why — what happened, in your own words</label>
        <textarea id="bg-reason" value={reason} rows={3} onChange={(e) => setReason(e.target.value)} />
      </p>
      <p>
        <label htmlFor="bg-scope">What you reached — be specific about which systems and whose information</label>
        <textarea id="bg-scope" value={scope} rows={2} onChange={(e) => setScope(e.target.value)} />
      </p>
      <p>
        <label htmlFor="bg-expires">When you expect to be finished</label>
        <input
          id="bg-expires"
          type="datetime-local"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
        />
      </p>
      {/*
        Said next to the field rather than left to be assumed. The record
        carries an expiry and nothing in the platform acts on it, so a
        reader who takes it for an automatic cut-off would be wrong about
        the one thing that matters most.
      */}
      <p>
        <small>
          This is what you are telling the reviewer to expect. Nothing switches off at that time — the platform is
          not holding a door open, so it has none to close.
        </small>
      </p>
      <p>
        <button
          disabled={reason.trim() === '' || scope.trim() === '' || expiresAt === ''}
          onClick={() =>
            decision.setPending({
              label: 'Record emergency access',
              artefact: {
                typeLabel: 'Emergency access record',
                id: 'new',
                facts: [
                  { label: 'Why', value: reason },
                  { label: 'What was reached', value: scope },
                  { label: 'Expected to be finished by', value: expiresAt },
                  { label: 'Recorded by', value: session.actorId },
                ],
              },
              consequence:
                'This is written down permanently, under your name, and goes to someone else to review. It grants no access and cancels nothing.',
              run: () =>
                staffApi.recordBreakGlass(session, reason.trim(), scope.trim(), new Date(expiresAt).toISOString()),
            })
          }
        >
          Record this
        </button>
      </p>
      {decision.pending !== null && (
        <ConfirmDecision
          pending={decision.pending}
          busy={decision.busy}
          onConfirm={() => void decision.execute()}
          onCancel={() => decision.setPending(null)}
        />
      )}
      <p aria-live="polite" role="status">
        {decision.announcement}
      </p>
    </section>
  );
}

function BreakGlassReviews({ session }: { session: StaffSession }) {
  const queue = useQueue<BreakGlassRecordItem>(
    async () => (await staffApi.listBreakGlassPendingReview(session)).data.map((i) => i.attributes),
    'emergency access records waiting to be reviewed',
  );
  const decision = useDecision();

  useEffect(() => {
    void queue.refresh();
  }, []);

  return (
    <section aria-labelledby="break-glass-review-heading">
      <h2 id="break-glass-review-heading">Emergency access waiting to be reviewed</h2>
      <p>
        Every recorded emergency access has to be looked at by someone who did not record it. Reviewing does not
        undo anything and does not close any access — the access, if there was any, happened elsewhere and is over or
        is not. What a review does is say, on the record, whether it should have happened.
      </p>
      <AuthStrengthNote
        needsMfa={false}
        authStrength={session.authStrength}
        action="Reviewing an emergency access record"
      />
      <p>
        <button onClick={() => void queue.refresh()}>Refresh the list</button>
      </p>
      {queue.error !== '' && <p role="alert">{queue.error}</p>}
      {queue.items !== null && queue.items.length === 0 && (
        <p>No emergency access is waiting to be reviewed.</p>
      )}
      {(queue.items ?? []).map((r) => {
        const own = r.executedByActorId === session.actorId;
        const artefact = {
          typeLabel: 'Emergency access record',
          id: r.breakGlassId,
          facts: [
            { label: 'Recorded by', value: r.executedByActorId },
            { label: 'Why', value: r.reason },
            { label: 'What was reached', value: r.scope },
            { label: 'Said it would be finished by', value: r.expiresAt },
            { label: 'Recorded at', value: r.createdAt },
          ],
        };
        return (
          <article key={r.breakGlassId} aria-label={`Emergency access record ${r.breakGlassId}`}>
            <ExactVersionBlock artefact={artefact} />
            {/*
              Not the shared separation-of-duties line: this rule is not
              "you drafted it", it is "you are the person this review is
              about", which is a different and blunter thing to say.
            */}
            {own ? (
              <p>
                <strong>You recorded this.</strong> A person cannot review their own emergency access. Someone else
                holding this permission has to.
              </p>
            ) : (
              <p>You did not record this, so you can review it.</p>
            )}
            {OUTCOMES.map((o) => (
              <p key={o.value}>
                <button
                  disabled={own}
                  onClick={() =>
                    decision.setPending({
                      label: o.label,
                      artefact,
                      consequence: `${o.meaning} It is written down under your name and cannot be changed afterwards.`,
                      run: () => staffApi.reviewBreakGlass(session, r.breakGlassId, o.value),
                    })
                  }
                >
                  {o.label}
                </button>{' '}
                <small>{o.meaning}</small>
              </p>
            ))}
          </article>
        );
      })}
      {decision.pending !== null && (
        <ConfirmDecision
          pending={decision.pending}
          busy={decision.busy}
          onConfirm={() => void decision.execute()}
          onCancel={() => decision.setPending(null)}
        />
      )}
      <p aria-live="polite" role="status">
        {decision.announcement}
      </p>
    </section>
  );
}

/**
 * Governance holds are deliberately absent, and saying so is better than
 * leaving a reviewer to wonder where they went.
 */
function HoldsNotHere() {
  return (
    <section aria-labelledby="holds-heading">
      <h2 id="holds-heading">Governance holds are not here</h2>
      <p>
        The server can record a governance hold on something, and nothing anywhere reads that record. No command
        checks for a hold before changing an artefact, so a hold placed today would stop nothing and the artefact
        would carry on being edited, approved and exported exactly as before.
      </p>
      <p>
        A screen offering to freeze something that does not freeze is worse than no screen: whoever placed the hold
        would stop looking for another way to stop it. So the control is not offered until placing a hold actually
        prevents something.
      </p>
    </section>
  );
}
