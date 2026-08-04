import { useEffect } from 'react';
import { staffApi, type ProtocolInReview, type StaffSession } from '../../staff-api.js';
import {
  AuthStrengthNote,
  ConfirmDecision,
  ExactVersionBlock,
  SeparationOfDutiesLine,
  useDecision,
  useQueue,
} from './shared.js';

/**
 * Protocol version decisions. Two actions live here and they are not the
 * same tier: approving is in the strong-authentication tier and is barred
 * by separation of duties, activating is neither. The catalogue is the
 * authority for that (`protocol.approve` carries
 * `minimumAuthStrength: 'mfa'`, `protocol.activate` does not), and
 * §1.6 treats over-warning as the same class of error as under-warning.
 */
export function ProtocolDecisions({ session }: { session: StaffSession }) {
  const queue = useQueue<ProtocolInReview>(
    async () => (await staffApi.listProtocolVersionsInReview(session)).data.map((i) => i.attributes),
    'protocol versions in review',
  );
  const decision = useDecision();

  useEffect(() => {
    void queue.refresh();
    // The queue is read once on entry; refreshing is an explicit action so
    // the list cannot shift under a decision in progress.
  }, []);

  const marker = (p: ProtocolInReview) => `${p.contentHash}|${p.updatedAt}`;
  const recheck = (id: string) => async () => {
    const rows = (await staffApi.listProtocolVersionsInReview(session)).data.map((i) => i.attributes);
    const found = rows.find((r) => r.protocolVersionId === id);
    return found === undefined ? null : marker(found);
  };

  return (
    <section aria-labelledby="protocol-decisions-heading">
      <h2 id="protocol-decisions-heading">Protocol versions in review</h2>
      <AuthStrengthNote needsMfa authStrength={session.authStrength} action="Approving a protocol version" />
      <p role="note">
        Activating an approved version needs your confirmation only — it is not in the strong-authentication tier.
      </p>

      <p>
        <button onClick={() => void queue.refresh()}>Refresh the list</button>
      </p>
      {queue.error !== '' && <p role="alert">{queue.error}</p>}

      {queue.items !== null && queue.items.length === 0 && <p>No protocol version is waiting for a decision.</p>}
      {(queue.items ?? []).map((p) => {
        const own = p.submittedByActorId === session.actorId;
        return (
          <article key={p.protocolVersionId} aria-label={`Protocol version ${p.protocolVersionId}`}>
            <ExactVersionBlock
              artefact={{
                typeLabel: 'Protocol version',
                id: p.protocolVersionId,
                versionNumber: p.versionNumber,
                hashLabel: 'Content hash',
                hash: p.contentHash,
                facts: [
                  { label: 'Research project', value: p.researchProjectId },
                  { label: 'Submitted by', value: p.submittedByActorId ?? 'not recorded' },
                ],
              }}
            />
            <SeparationOfDutiesLine isOwnSubmission={own} />
            <p>
              <button
                disabled={own}
                onClick={() =>
                  decision.setPending({
                    label: 'Approve protocol version',
                    artefact: {
                      typeLabel: 'Protocol version',
                      id: p.protocolVersionId,
                      versionNumber: p.versionNumber,
                      hashLabel: 'Content hash',
                      hash: p.contentHash,
                    },
                    consequence:
                      'An approved version becomes immutable. Changing anything in it later means drafting a new version.',
                    marker: marker(p),
                    recheck: recheck(p.protocolVersionId),
                    run: () => staffApi.approveProtocolVersion(session, p.protocolVersionId),
                  })
                }
              >
                Approve this protocol version
              </button>{' '}
              <button
                onClick={() =>
                  decision.setPending({
                    label: 'Activate protocol version',
                    artefact: {
                      typeLabel: 'Protocol version',
                      id: p.protocolVersionId,
                      versionNumber: p.versionNumber,
                      hashLabel: 'Content hash',
                      hash: p.contentHash,
                    },
                    consequence:
                      'Activating makes this the version new enrolments are bound to. Any previously active version stops being the active one.',
                    marker: marker(p),
                    recheck: recheck(p.protocolVersionId),
                    run: () => staffApi.activateProtocolVersion(session, p.protocolVersionId),
                  })
                }
              >
                Activate this protocol version
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
