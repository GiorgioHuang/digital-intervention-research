import { useEffect } from 'react';
import { staffApi, type PendingExportItem, type StaffSession } from '../../staff-api.js';
import {
  AuthStrengthNote,
  ConfirmDecision,
  ExactVersionBlock,
  SeparationOfDutiesLine,
  useDecision,
  useQueue,
} from './shared.js';

/**
 * Export decisions. Approving and rejecting go through the same
 * permission key (`export.approve`), so rejecting is *not* the lighter
 * action: it needs the same strong authentication and is barred by the
 * same separation of duties. RESEARCHER_WORKSPACE §1.5 calls out
 * presenting rejection as a lower-privilege action as a design error, so
 * both buttons carry the same notice and the same disabled rule.
 *
 * An export request is not a versioned artefact and the server publishes
 * no content hash for it, so the block shows what actually identifies the
 * decision — purpose, recipient and de-identification — rather than an
 * empty hash row implying one exists.
 *
 * The two kinds of request in this queue are not the same decision and
 * are no longer presented as one. A research export releases other
 * people's data to a third party. A portability request is a person
 * asking for a copy of their own information, where identifiable is not
 * a finding but the point — and an approver reading "De-identification:
 * None" under research-export framing could reasonably refuse a lawful
 * request, or grow used to the phrase and wave through a research export
 * that should never carry it.
 */
const PORTABILITY = 'ParticipantPortability';

const TYPE_WORDING: Record<string, string> = {
  ResearchExport: 'Research export — other people’s data leaving for a third party.',
  [PORTABILITY]: 'Someone asking for a copy of their own information.',
};
export function ExportDecisions({ session }: { session: StaffSession }) {
  const queue = useQueue<PendingExportItem>(
    async () => (await staffApi.listPendingExports(session)).data.map((i) => i.attributes),
    'exports waiting for a decision',
  );
  const decision = useDecision();

  useEffect(() => {
    void queue.refresh();
  }, []);

  const artefactOf = (e: PendingExportItem) => ({
    typeLabel: e.exportType === PORTABILITY ? 'Request for own information' : 'Export request',
    id: e.exportRequestId,
    facts: [
      { label: 'What this is', value: TYPE_WORDING[e.exportType] ?? e.exportType },
      { label: 'Purpose', value: e.purpose },
      { label: 'Recipient', value: e.recipient },
      { label: 'De-identification', value: e.deIdentification },
      // A limit already imposed on the request. Leaving it off the queue
      // made the approver assume the worst about what was being released.
      ...(e.restrictions === '' ? [] : [{ label: 'Limits already applied', value: e.restrictions }]),
      { label: 'Requested by', value: e.requestedByActorId },
    ],
  });

  const approveConsequence = (e: PendingExportItem) =>
    e.exportType === PORTABILITY
      ? 'Approving lets a copy of this person’s own information be put together for them. Identifiable is correct here — it is their information. The database refuses an identifiable research export, so this level does not mean the same thing it would on one.'
      : 'Approving releases data to the named recipient for the stated purpose, at the stated de-identification level.';

  const rejectConsequence = (e: PendingExportItem) =>
    e.exportType === PORTABILITY
      ? 'Rejecting refuses a person’s request for a copy of their own information. It is recorded the same way an approval is, and needs the same authority.'
      : 'Rejecting is recorded the same way an approval is, and needs the same authority.';

  return (
    <section aria-labelledby="export-decisions-heading">
      <h2 id="export-decisions-heading">Exports waiting for a decision</h2>
      <AuthStrengthNote
        needsMfa
        authStrength={session.authStrength}
        action="Deciding an export — approving and rejecting alike"
      />
      <p>
        This list is what the queue held when it was loaded. It carries no version marker, so refresh before deciding if
        you have had it open for a while.
      </p>

      <p>
        <button onClick={() => void queue.refresh()}>Refresh the list</button>
      </p>
      {queue.error !== '' && <p role="alert">{queue.error}</p>}
      {queue.items !== null && queue.items.length === 0 && <p>No export is waiting for a decision.</p>}

      {(queue.items ?? []).map((e) => {
        const own = e.requestedByActorId === session.actorId;
        return (
          <article key={e.exportRequestId} aria-label={`Export request ${e.exportRequestId}`}>
            <ExactVersionBlock artefact={artefactOf(e)} />
            <SeparationOfDutiesLine isOwnSubmission={own} />
            <p>
              <button
                disabled={own}
                onClick={() =>
                  decision.setPending({
                    label: 'Approve export',
                    artefact: artefactOf(e),
                    consequence: approveConsequence(e),
                    run: () => staffApi.decideExport(session, e.exportRequestId, 'Approved'),
                  })
                }
              >
                Approve this export
              </button>{' '}
              <button
                disabled={own}
                onClick={() =>
                  decision.setPending({
                    label: 'Reject export',
                    artefact: artefactOf(e),
                    consequence: rejectConsequence(e),
                    run: () => staffApi.decideExport(session, e.exportRequestId, 'Rejected'),
                  })
                }
              >
                Reject this export
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
