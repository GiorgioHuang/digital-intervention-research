import { useEffect } from 'react';
import { staffApi, type ReportVersionAwaitingApprovalItem, type StaffSession } from '../../staff-api.js';
import { ConfirmDecision, ExactVersionBlock, SeparationOfDutiesLine, useDecision, useQueue } from './shared.js';

/**
 * Approving a report version.
 *
 * Nothing listed report versions, so none could be approved — the export
 * half of this module had screens and the reports beside it did not.
 *
 * Two things belong next to the control. The author cannot approve their
 * own version, enforced by the command and again by a database CHECK, and
 * the row says so before the button. And approval makes the content
 * immutable: a database trigger refuses any change to an approved version
 * other than superseding it, so approving is the last moment anyone can
 * change their mind about these words.
 *
 * Not MFA-tier: `report.approve` requires confirmation and no more.
 * Saying otherwise would overstate what the action costs, which teaches
 * people to discount the notices that are real.
 */
const TYPE_WORDING: Record<string, string> = {
  ResearchReport: 'Research report',
  ParticipantSummary: 'Summary written for participants',
  FindingPackage: 'Package of findings',
};

export function ReportDecisions({ session }: { session: StaffSession }) {
  const queue = useQueue<ReportVersionAwaitingApprovalItem>(
    async () => (await staffApi.listReportVersionsAwaitingApproval(session)).data.map((i) => i.attributes),
    'report versions waiting to be approved',
  );
  const decision = useDecision();

  useEffect(() => {
    void queue.refresh();
  }, []);

  return (
    <section aria-labelledby="report-decisions-heading">
      <h2 id="report-decisions-heading">Report versions waiting to be approved</h2>
      <p>
        Approving fixes the content of this exact version. After that it cannot be changed — the database refuses it,
        and a correction has to be a new version.
      </p>
      <p>
        <button onClick={() => void queue.refresh()}>Refresh the list</button>
      </p>
      {queue.error !== '' && <p role="alert">{queue.error}</p>}
      {queue.items !== null && queue.items.length === 0 && <p>No report version is waiting to be approved.</p>}

      {(queue.items ?? []).map((v) => {
        const own = v.createdByActorId === session.actorId;
        const artefact = {
          typeLabel: 'Report version',
          id: v.reportVersionId,
          versionNumber: v.versionNumber,
          facts: [
            { label: 'Report', value: v.reportTitle },
            { label: 'Kind', value: TYPE_WORDING[v.reportType] ?? v.reportType },
            { label: 'Written by', value: v.createdByActorId },
          ],
        };
        return (
          <article key={v.reportVersionId} aria-label={`Report version ${v.reportVersionId}`}>
            <ExactVersionBlock artefact={artefact} />
            <SeparationOfDutiesLine isOwnSubmission={own} />
            <p>
              <button
                disabled={own}
                onClick={() =>
                  decision.setPending({
                    label: 'Approve report version',
                    artefact,
                    consequence:
                      'Approving fixes these words as version ' +
                      String(v.versionNumber) +
                      '. They cannot be edited afterwards; a correction is a new version.',
                    run: () => staffApi.approveReportVersion(session, v.reportVersionId),
                  })
                }
              >
                Approve this version
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
