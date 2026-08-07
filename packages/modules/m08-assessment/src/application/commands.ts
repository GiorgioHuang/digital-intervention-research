import { newId, PlatformError, type Clock, type RequestContext } from '@platform/kernel';
import { appendToOutbox, withTransaction, type Pool } from '@platform/database';
import { assertAllowed, type PolicyDecisionResult } from '@platform/policy';

export type PermissionCheck = (
  ctx: RequestContext,
  request: {
    action: string;
    resource: { type: string; id: string; state: string; protectedExistence: boolean };
    confirmed?: boolean;
  },
) => Promise<PolicyDecisionResult>;

export interface M08Deps {
  pool: Pool;
  clock: Clock;
  checkPermission: PermissionCheck;
}

/**
 * Record an AssessmentRecord bound to the EXACT instrument version.
 * Missingness is explicit and typed — never silent (Doc 19).
 */
export async function recordAssessment(
  deps: M08Deps,
  ctx: RequestContext,
  input: {
    enrolmentId: string;
    instrument: string;
    instrumentVersion: string;
    recordState: 'Completed' | 'Partially Completed' | 'Declined' | 'Expired' | 'Invalidated';
    responses?: Record<string, unknown>;
    missingnessReason?:
      | 'Not Collected' | 'Participant Declined' | 'Participant Unable' | 'Technical Failure'
      | 'Missed Visit' | 'Not Applicable' | 'Lost to Follow-Up' | 'Withdrawn' | 'Unknown';
  },
): Promise<{ assessmentRecordId: string }> {
  const decision = await deps.checkPermission(ctx, {
    action: 'assessment.record',
    resource: { type: 'AssessmentRecord', id: 'new', state: 'Draft', protectedExistence: false },
  });
  assertAllowed(decision, false);
  if (input.recordState === 'Completed' && input.responses === undefined) {
    throw new PlatformError('VALIDATION_ERROR', 'A completed assessment requires responses');
  }

  /*
   * The same use-time check M07 makes, and for the same reason: the
   * ParticipantWithdrawn event reaches no consumer, so nothing revokes
   * anything downstream on withdrawal. If withdrawal is to mean data
   * collection stops, it has to be the write that refuses.
   *
   * But not every write. `missingnessReason` already carries
   * 'Withdrawn', and Doc 19's rule is that missingness is explicit and
   * typed, never silent. Refusing the whole table after withdrawal would
   * leave the dataset with a blank where it could have said why the row
   * is empty, which is the failure that vocabulary exists to prevent.
   * So: no new responses may be collected, and a record that states the
   * absence is still allowed.
   */
  const enrolment = await deps.pool.query(
    `SELECT enrolment_state FROM enrolment.enrolments WHERE id = $1`,
    [input.enrolmentId],
  );
  const row = enrolment.rows[0] as { enrolment_state: string } | undefined;
  if (row === undefined) throw new PlatformError('RESOURCE_NOT_FOUND', 'Enrolment not found');
  if (['Withdrawn', 'Discontinued'].includes(row.enrolment_state) && input.responses !== undefined) {
    throw new PlatformError(
      'RESOURCE_STATE_BLOCKED',
      'This participant has left the study; no further answers can be recorded against this enrolment. ' +
        'A record stating why the assessment was not collected can still be entered.',
    );
  }
  const assessmentRecordId = newId('asr');
  const now = deps.clock.now();
  await withTransaction(deps.pool, async (client) => {
    await client.query(
      `INSERT INTO assessment_outcome.assessment_records
         (id, enrolment_id, instrument, instrument_version, record_state, responses, missingness_reason,
          recorded_by_actor_id, occurred_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        assessmentRecordId,
        input.enrolmentId,
        input.instrument,
        input.instrumentVersion,
        input.recordState,
        input.responses === undefined ? null : JSON.stringify(input.responses),
        input.missingnessReason ?? null,
        ctx.actor!.id,
        now,
      ],
    );
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: input.recordState === 'Completed' ? 'AssessmentCompleted' : 'AssessmentInvalidated',
      sourceModule: 'M08',
      aggregateType: 'AssessmentRecord',
      aggregateId: assessmentRecordId,
      occurredAt: now,
      payload: { instrument: input.instrument, recordState: input.recordState },
    });
  });
  return { assessmentRecordId };
}
