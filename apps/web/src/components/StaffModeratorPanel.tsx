import { useState } from 'react';
import { staffActionError, staffLoadError } from '../errors.js';
import { staffApi, type ModerationCaseItem, type StaffSession } from '../staff-api.js';

/**
 * Moderation workspace: cases come from the queue (the reporter's
 * identity is never in it — moderation judges content and behaviour, not
 * reporters). Every decision is a confirmed human act with a written
 * reason, attributed and immutable once recorded.
 *
 * The decision list used to offer all ten outcomes in a dropdown beside a
 * box you typed a case identifier into. Nothing reads
 * `moderation_decisions`, and until this change nothing wrote a post's
 * state either, so "Remove content" removed nothing, "Hide content" hid
 * nothing and "Suspend account" suspended nobody — the case closed as
 * Actioned and the content stayed in the community. That is the worst
 * form of the rule against controls that record a decision nothing acts
 * on, because the moderator, the reporter and the person reported all
 * come away believing something happened.
 *
 * Hide, Remove and Restore now move the post's state and the feed already
 * shows only published posts, so those three are real. The rest are shown
 * for what they are.
 */
type Decision = 'Dismiss' | 'Hide' | 'Remove' | 'Restore' | 'Warn';

interface Choice {
  decision: Decision;
  label: string;
  /** What actually happens. Shown next to the control, not in a tooltip. */
  effect: string;
  needsContent: boolean;
}

const CHOICES: Choice[] = [
  {
    decision: 'Dismiss',
    label: 'Dismiss and close the case',
    effect: 'Closes the case. Nothing happens to the content or to the person.',
    needsContent: false,
  },
  {
    decision: 'Hide',
    label: 'Hide the content',
    effect: 'Takes the post out of the community feed. It still exists and can be restored.',
    needsContent: true,
  },
  {
    decision: 'Remove',
    label: 'Remove the content',
    effect: 'Takes the post out of the community feed and marks it removed. The text is not deleted from the record.',
    needsContent: true,
  },
  {
    decision: 'Restore',
    label: 'Put the content back',
    effect: 'Returns the post to the community feed.',
    needsContent: true,
  },
  {
    decision: 'Warn',
    label: 'Record that you warned them',
    effect:
      'Records that you warned this person. The platform does not send anything — this is your account of a conversation you had elsewhere.',
    needsContent: false,
  },
];

export function StaffModeratorPanel({ session }: { session: StaffSession }) {
  const [queue, setQueue] = useState<ModerationCaseItem[] | null>(null);
  const [confirming, setConfirming] = useState<{ item: ModerationCaseItem; choice: Choice } | null>(null);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [announcement, setAnnouncement] = useState('');

  const loadQueue = async () => {
    try {
      const res = await staffApi.listOpenModerationCases(session);
      setQueue(res.data.map((c) => c.attributes));
      setAnnouncement(
        res.data.length === 0
          ? 'There are no open cases.'
          : `${res.data.length} open ${res.data.length === 1 ? 'case' : 'cases'}.`,
      );
    } catch (err) {
      setAnnouncement(staffLoadError(err, 'the moderation queue'));
    }
  };

  const decide = async (item: ModerationCaseItem, choice: Choice) => {
    setConfirming(null);
    try {
      await staffApi.recordModerationDecision(
        session,
        item.moderationCaseId,
        choice.decision,
        (reasons[item.moderationCaseId] ?? '').trim(),
      );
      setAnnouncement('Decision recorded in your name. It cannot be changed.');
      await loadQueue();
    } catch (err) {
      setAnnouncement(staffActionError(err, 'That moderation decision'));
    }
  };

  return (
    <section aria-labelledby="mod-heading">
      <h2 id="mod-heading">Moderation</h2>
      <p>
        The queue never shows who reported a case — moderation judges content and behaviour, not reporters. Every
        decision needs a written reason, and once recorded in your name it cannot be changed.
      </p>
      <p>
        <button onClick={() => void loadQueue()}>View open cases</button>
      </p>

      {queue !== null && queue.length === 0 && <p>There are no open cases.</p>}
      {(queue ?? []).map((c) => {
        const reason = reasons[c.moderationCaseId] ?? '';
        const hasContent = c.reportedContentId !== null;
        return (
          <article key={c.moderationCaseId} aria-label={`Case ${c.moderationCaseId}`}>
            <h3>{c.moderationCaseId}</h3>
            <p>
              Reported as <strong>{c.reportCategory ?? 'no category given'}</strong>: {c.reportDescription ?? '—'}
              <br />
              About: {c.subjectActorId}. State: {c.caseState}.
              <br />
              {hasContent ? (
                <>Names a piece of content: {c.reportedContentId}</>
              ) : (
                // Said rather than left to be discovered by a refusal.
                <>
                  This case is about behaviour and names no content, so the decisions that act on content are not
                  offered.
                </>
              )}
            </p>
            <p>
              <label htmlFor={`mod-reason-${c.moderationCaseId}`}>Reason (required)</label>
              <textarea
                id={`mod-reason-${c.moderationCaseId}`}
                rows={2}
                value={reason}
                onChange={(e) => setReasons({ ...reasons, [c.moderationCaseId]: e.target.value })}
              />
            </p>
            {CHOICES.filter((ch) => !ch.needsContent || hasContent).map((ch) => (
              <p key={ch.decision}>
                <button disabled={reason.trim() === ''} onClick={() => setConfirming({ item: c, choice: ch })}>
                  {ch.label}
                </button>{' '}
                <small>{ch.effect}</small>
              </p>
            ))}
          </article>
        );
      })}

      <NotOfferedHere />

      {confirming !== null && (
        <div role="alertdialog" aria-labelledby="mod-confirm">
          <p id="mod-confirm">
            {confirming.choice.label}, for case {confirming.item.moderationCaseId}?
          </p>
          <p>{confirming.choice.effect}</p>
          <p>It is written to the audit trail in your name and cannot be changed.</p>
          <button onClick={() => void decide(confirming.item, confirming.choice)}>Confirm</button>{' '}
          <button onClick={() => setConfirming(null)}>Back</button>
        </div>
      )}
      <p aria-live="polite" role="status">
        {announcement}
      </p>
    </section>
  );
}

/**
 * The five outcomes that are in the design and in the database vocabulary
 * and have no mechanism behind them. Naming them here is the point: a
 * moderator who cannot find "suspend" needs to know it is missing because
 * the platform cannot do it, not because this screen is hiding it.
 */
function NotOfferedHere() {
  return (
    <section aria-labelledby="mod-missing-heading">
      <h3 id="mod-missing-heading">What this screen cannot do</h3>
      <p>
        Restricting someone&apos;s features, suspending an account, disconnecting two people and banning are all in
        the decision vocabulary and none of them exists in this platform. There is no account restriction anywhere in
        the code, so a button called &ldquo;Suspend account&rdquo; would close the case, tell you it was done, and
        leave the person posting.
      </p>
      <p>
        Escalating is not offered either, because there is no route from moderation to the safety workspace yet.
        Recording an escalation would move the case out of your hands without moving it into anyone else&apos;s.
      </p>
      <p>
        If one of these is what a case needs, it has to be arranged outside the platform for now. Say so in the reason
        on whichever decision you do record, so the case history says what really happened.
      </p>
    </section>
  );
}
