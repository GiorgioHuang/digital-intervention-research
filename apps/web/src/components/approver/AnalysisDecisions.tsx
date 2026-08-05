import { useEffect, useState } from 'react';
import { staffLoadError } from '../../errors.js';
import { staffApi, type AnalysisApprovalsPayload, type StaffSession } from '../../staff-api.js';
import { AuthStrengthNote, ConfirmDecision, ExactVersionBlock, SeparationOfDutiesLine, useDecision } from './shared.js';

/**
 * The three approvals along the analysis chain: plan, interpretation,
 * finding. Nothing listed any of them, so none could be approved and the
 * chain stopped at its first step.
 *
 * They are on one screen because they are the same kind of decision at
 * three depths, but they do not carry the same weight and the screen does
 * not pretend they do. Only `finding.approve` is MFA-tier, so only the
 * findings section carries the strong-authentication notice. Repeating it
 * over the other two would overstate what they cost and teach people to
 * scroll past the one that is real.
 *
 * Runs are absent: nobody approves a run. It either happened or it did
 * not, and putting it in a decision queue would suggest a judgement
 * nobody is being asked for.
 */
const EMPTY: AnalysisApprovalsPayload = { plans: [], interpretations: [], findings: [] };

export function AnalysisDecisions({ session }: { session: StaffSession }) {
  const [items, setItems] = useState<AnalysisApprovalsPayload | null>(null);
  const [loadError, setLoadError] = useState('');
  const decision = useDecision();

  const refresh = async () => {
    try {
      setItems((await staffApi.listAnalysisApprovals(session)).data);
      setLoadError('');
    } catch (err) {
      setLoadError(staffLoadError(err, 'the analysis approvals'));
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const a = items ?? EMPTY;
  const nothing = a.plans.length === 0 && a.interpretations.length === 0 && a.findings.length === 0;

  return (
    <section aria-labelledby="analysis-decisions-heading">
      <h2 id="analysis-decisions-heading">Analysis waiting to be approved</h2>
      <p>
        <button onClick={() => void refresh()}>Refresh the list</button>
      </p>
      {loadError !== '' && <p role="alert">{loadError}</p>}
      {items !== null && nothing && <p>Nothing along the analysis chain is waiting to be approved.</p>}

      <h3>Analysis plans</h3>
      {a.plans.length === 0 && <p>No analysis plan is waiting.</p>}
      {a.plans.map((p) => {
        const own = p.draftedByActorId === session.actorId;
        const artefact = {
          typeLabel: 'Analysis plan',
          id: p.analysisPlanId,
          facts: [
            { label: 'Title', value: p.title },
            { label: 'Research project', value: p.researchProjectId },
            { label: 'Written by', value: p.draftedByActorId },
          ],
        };
        return (
          <article key={p.analysisPlanId} aria-label={`Analysis plan ${p.analysisPlanId}`}>
            <ExactVersionBlock artefact={artefact} />
            <SeparationOfDutiesLine isOwnSubmission={own} />
            <p>
              <button
                disabled={own}
                onClick={() =>
                  decision.setPending({
                    label: 'Approve analysis plan',
                    artefact,
                    consequence:
                      'Approving lets runs be recorded under this plan against locked dataset versions. It does not run anything.',
                    run: () => staffApi.approveAnalysisPlan(session, p.analysisPlanId),
                  })
                }
              >
                Approve this plan
              </button>
            </p>
          </article>
        );
      })}

      <h3>Interpretations</h3>
      {a.interpretations.length === 0 && <p>No interpretation is waiting.</p>}
      {a.interpretations.map((i) => {
        const own = i.draftedByActorId === session.actorId;
        const artefact = {
          typeLabel: 'Interpretation',
          id: i.interpretationRecordId,
          facts: [
            { label: 'Plan', value: i.planTitle },
            { label: 'Of run', value: i.analysisRunId },
            { label: 'What it says', value: i.interpretationText },
            { label: 'Written by', value: i.draftedByActorId },
          ],
        };
        return (
          <article key={i.interpretationRecordId} aria-label={`Interpretation ${i.interpretationRecordId}`}>
            <ExactVersionBlock artefact={artefact} />
            <SeparationOfDutiesLine isOwnSubmission={own} />
            <p>
              <button
                disabled={own}
                onClick={() =>
                  decision.setPending({
                    label: 'Approve interpretation',
                    artefact,
                    consequence: 'Approving lets a finding be drawn from this interpretation of that one run.',
                    run: () => staffApi.approveInterpretation(session, i.interpretationRecordId),
                  })
                }
              >
                Approve this interpretation
              </button>
            </p>
          </article>
        );
      })}

      <h3>Findings</h3>
      {/* The one MFA-tier decision on this screen, and the only one that says so. */}
      <AuthStrengthNote needsMfa authStrength={session.authStrength} action="Approving a research finding" />
      {a.findings.length === 0 && <p>No finding is waiting.</p>}
      {a.findings.map((f) => {
        const own = f.draftedByActorId === session.actorId;
        const artefact = {
          typeLabel: 'Research finding',
          id: f.researchFindingId,
          facts: [
            { label: 'Plan', value: f.planTitle },
            { label: 'From interpretation', value: f.interpretationRecordId },
            { label: 'The finding', value: f.findingText },
            { label: 'Written by', value: f.draftedByActorId },
          ],
        };
        return (
          <article key={f.researchFindingId} aria-label={`Research finding ${f.researchFindingId}`}>
            <ExactVersionBlock artefact={artefact} />
            <SeparationOfDutiesLine isOwnSubmission={own} />
            <p>
              <button
                disabled={own}
                onClick={() =>
                  decision.setPending({
                    label: 'Approve research finding',
                    artefact,
                    consequence:
                      'Approving records this as a finding of the research, resting on that interpretation and the run beneath it.',
                    run: () => staffApi.approveResearchFinding(session, f.researchFindingId),
                  })
                }
              >
                Approve this finding
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
