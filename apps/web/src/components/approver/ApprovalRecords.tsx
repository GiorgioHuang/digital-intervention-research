import { useEffect, useState } from 'react';
import { staffApi, type PendingApprovalItem, type StaffSession } from '../../staff-api.js';
import {
  ConfirmDecision,
  ExactVersionBlock,
  SeparationOfDutiesLine,
  useDecision,
  useQueue,
} from './shared.js';
import { StrongAuthBar } from '../StrongAuthBar.js';

/**
 * M15 approval records — the general governance decisions that are not one
 * of the three specific chains. The artefact type and version come from
 * the record itself, so the block names what is actually being decided
 * rather than "an approval".
 *
 * A written reason is required for both outcomes. It is not decoration:
 * the reason is what a later reader has to reconstruct the decision from,
 * and an approval with an empty reason is indistinguishable from a
 * rubber stamp.
 */
export function ApprovalRecords({ session }: { session: StaffSession }) {
  const queue = useQueue<PendingApprovalItem>(
    async () => (await staffApi.listPendingApprovals(session)).data.map((i) => i.attributes),
    'approval records waiting for a decision',
  );
  const decision = useDecision();
  const [reasons, setReasons] = useState<Record<string, string>>({});

  useEffect(() => {
    void queue.refresh();
  }, []);

  const artefactOf = (a: PendingApprovalItem) => ({
    typeLabel: `Approval record for ${a.artefactType}`,
    id: a.approvalRecordId,
    versionNumber: a.artefactVersion,
    facts: [
      { label: 'Artefact', value: `${a.artefactType} ${a.artefactId}` },
      { label: 'Requested by', value: a.requestedByActorId },
    ],
  });

  return (
    <section aria-labelledby="approval-records-heading">
      <h2 id="approval-records-heading">Approval records waiting for a decision</h2>
      <StrongAuthBar
        session={session}
        actions={[{ key: 'approval.decide', label: 'Recording an approval decision — approving and rejecting alike' }]}
      />

      <p>
        <button onClick={() => void queue.refresh()}>Refresh the list</button>
      </p>
      {queue.error !== '' && <p role="alert">{queue.error}</p>}
      {queue.items !== null && queue.items.length === 0 && <p>No approval record is waiting for a decision.</p>}

      {(queue.items ?? []).map((a) => {
        const own = a.requestedByActorId === session.actorId;
        const reason = reasons[a.approvalRecordId] ?? '';
        const inputId = `reason-${a.approvalRecordId}`;
        return (
          <article key={a.approvalRecordId} aria-label={`Approval record ${a.approvalRecordId}`}>
            <ExactVersionBlock artefact={artefactOf(a)} />
            <SeparationOfDutiesLine isOwnSubmission={own} />
            <p>
              <label htmlFor={inputId}>Reason for this decision</label>{' '}
              <input
                id={inputId}
                value={reason}
                disabled={own}
                onChange={(e) => setReasons({ ...reasons, [a.approvalRecordId]: e.target.value })}
              />
            </p>
            {reason === '' && !own && <p>Both buttons stay unavailable until a reason is written.</p>}
            <p>
              <button
                disabled={own || reason === ''}
                onClick={() =>
                  decision.setPending({
                    label: 'Approve this approval record',
                    artefact: artefactOf(a),
                    consequence: `Your reason is recorded with the decision: “${reason}”`,
                    run: () => staffApi.decideApproval(session, a.approvalRecordId, 'Approved', reason),
                  })
                }
              >
                Approve
              </button>{' '}
              <button
                disabled={own || reason === ''}
                onClick={() =>
                  decision.setPending({
                    label: 'Reject this approval record',
                    artefact: artefactOf(a),
                    consequence: `Your reason is recorded with the decision: “${reason}”`,
                    run: () => staffApi.decideApproval(session, a.approvalRecordId, 'Rejected', reason),
                  })
                }
              >
                Reject
              </button>
            </p>
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
