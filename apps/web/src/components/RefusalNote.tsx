/**
 * What an approver said when they did not accept something.
 *
 * The refusal reason was being stored for a reader who had no way to
 * reach it: every screen showed the new state and nothing showed why. A
 * state that says "Not approved" and stops there tells the person who
 * wrote the thing that it failed, and nothing about what to do next —
 * which makes a refusal a disappearance with a label on it.
 *
 * The refuser is named. A decision recorded in someone's name that is
 * then shown anonymously to the person it lands on is only half an
 * attribution, and the half that is missing is the half they need in
 * order to reply.
 */
export function RefusalNote({
  reason,
  byActorId,
  verb = 'Not accepted',
}: {
  reason: string | null;
  byActorId: string | null;
  verb?: string;
}) {
  if (reason === null || reason === '') return null;
  return (
    <div className="refusal-note">
      <p>
        <strong>{verb}</strong>
        {byActorId === null ? '' : ` by ${byActorId}`}:
      </p>
      <blockquote>{reason}</blockquote>
      {/*
        Said plainly, because the state name alone reads like a dead end.
        Nothing here is deleted and a new attempt is always possible; not
        saying so leaves people believing the work is lost.
      */}
      <p>
        <small>Nothing has been deleted. You can take this into account and try again.</small>
      </p>
    </div>
  );
}
