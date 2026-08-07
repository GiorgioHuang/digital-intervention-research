import { newId, PlatformError, type Clock, type RequestContext } from '@platform/kernel';
import { appendToOutbox, recordAuditEvent, withTransaction, type Pool } from '@platform/database';
import { assertAllowed } from '@platform/policy';
import type { PermissionServicePort } from '@platform/m03-consent-permission';
import type { ParticipantQueryPort } from '@platform/m02-participant';
import type { ProtocolVersionQueryPort } from '@platform/m04-research-design';
import { M05_EVENTS, type EnrolmentView } from '../contracts/index.js';

export interface M05Deps {
  pool: Pool;
  clock: Clock;
  permissions: PermissionServicePort;
  participants: ParticipantQueryPort;
  protocolVersions: ProtocolVersionQueryPort;
}

async function loadEnrolment(pool: Pool, id: string): Promise<EnrolmentView> {
  const res = await pool.query(
    `SELECT id, participant_id, research_project_id, protocol_version_id, enrolment_state, record_version
       FROM enrolment.enrolments WHERE id = $1`,
    [id],
  );
  const row = res.rows[0];
  if (row === undefined) throw new PlatformError('RESOURCE_NOT_FOUND', 'Enrolment not found');
  return {
    id: row.id,
    participantId: row.participant_id,
    researchProjectId: row.research_project_id,
    protocolVersionId: row.protocol_version_id,
    state: row.enrolment_state,
    recordVersion: row.record_version,
  };
}

/**
 * Invite a Participant to a project. Enrolment binds to the exact
 * ProtocolVersion; only an Approved or Active version is a valid basis
 * (no enrolment against drafts, ATR-004).
 */
export async function inviteParticipant(
  deps: M05Deps,
  ctx: RequestContext,
  input: { participantId: string; researchProjectId: string; protocolVersionId: string },
): Promise<{ enrolmentId: string }> {
  const decision = await deps.permissions.evaluate(ctx, {
    action: 'enrolment.invite',
    resource: {
      type: 'Enrolment',
      id: 'new',
      state: 'Draft',
      protectedExistence: false,
      researchProjectId: input.researchProjectId,
    },
  });
  assertAllowed(decision, false);

  const participant = await deps.participants.findParticipant(input.participantId);
  if (participant === undefined || participant.state !== 'Active') {
    throw new PlatformError('RESOURCE_NOT_FOUND', 'Participant not found');
  }
  const version = await deps.protocolVersions.findProtocolVersion(input.protocolVersionId);
  if (version === undefined) throw new PlatformError('RESOURCE_NOT_FOUND', 'Protocol version not found');
  if (version.state !== 'Approved' && version.state !== 'Active') {
    throw new PlatformError(
      'RESOURCE_STATE_BLOCKED',
      'Enrolment requires an approved or active protocol version',
    );
  }
  if (version.researchProjectId !== input.researchProjectId) {
    throw new PlatformError('VALIDATION_ERROR', 'Protocol version does not belong to this project', {
      details: [{ field: 'protocolVersionId', reason: 'project-mismatch' }],
    });
  }

  const enrolmentId = newId('enr');
  const now = deps.clock.now();
  await withTransaction(deps.pool, async (client) => {
    await client.query(
      `INSERT INTO enrolment.enrolments
         (id, participant_id, research_project_id, protocol_version_id, invited_by_actor_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [enrolmentId, input.participantId, input.researchProjectId, input.protocolVersionId, ctx.actor!.id],
    );
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: M05_EVENTS.ParticipantInvited,
      sourceModule: 'M05',
      aggregateType: 'Enrolment',
      aggregateId: enrolmentId,
      occurredAt: now,
      payload: { participantId: input.participantId, researchProjectId: input.researchProjectId },
    });
    await recordAuditEvent(client, ctx, {
      action: 'enrolment.invite',
      targetType: 'Enrolment',
      targetId: enrolmentId,
      participantId: input.participantId,
      occurredAt: now,
      result: 'Succeeded',
      source: 'M05',
      policyVersion: decision.policyVersion,
    });
  });
  return { enrolmentId };
}

async function transitionEnrolment(
  deps: M05Deps,
  ctx: RequestContext,
  args: {
    enrolment: EnrolmentView;
    action: string;
    fromStates: string[];
    toState: string;
    eventType: string;
    confirmed?: boolean;
    policyVersion: string;
    extraSql?: (client: Parameters<Parameters<typeof withTransaction>[1]>[0], now: Date) => Promise<void>;
  },
): Promise<void> {
  const now = deps.clock.now();
  await withTransaction(deps.pool, async (client) => {
    const res = await client.query(
      `UPDATE enrolment.enrolments
          SET enrolment_state = $3,
              withdrawn_at = CASE WHEN $3 = 'Withdrawn' THEN $4 ELSE withdrawn_at END,
              record_version = record_version + 1, updated_at = $4
        WHERE id = $1 AND enrolment_state = ANY($2)`,
      [args.enrolment.id, args.fromStates, args.toState, now],
    );
    if (res.rowCount !== 1) {
      throw new PlatformError('INVALID_STATE_TRANSITION', `Enrolment state does not allow ${args.action}`);
    }
    if (args.extraSql) await args.extraSql(client, now);
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: args.eventType,
      sourceModule: 'M05',
      aggregateType: 'Enrolment',
      aggregateId: args.enrolment.id,
      occurredAt: now,
      payload: { participantId: args.enrolment.participantId },
    });
    await recordAuditEvent(client, ctx, {
      action: args.action,
      targetType: 'Enrolment',
      targetId: args.enrolment.id,
      participantId: args.enrolment.participantId,
      occurredAt: now,
      result: 'Succeeded',
      source: 'M05',
      policyVersion: args.policyVersion,
    });
  });
}

export async function startScreening(deps: M05Deps, ctx: RequestContext, enrolmentId: string): Promise<void> {
  const enrolment = await loadEnrolment(deps.pool, enrolmentId);
  const decision = await deps.permissions.evaluate(ctx, {
    action: 'screening.start',
    resource: {
      type: 'Enrolment',
      id: enrolment.id,
      state: enrolment.state,
      protectedExistence: false,
      researchProjectId: enrolment.researchProjectId,
    },
  });
  assertAllowed(decision, false);
  await transitionEnrolment(deps, ctx, {
    enrolment,
    action: 'screening.start',
    fromStates: ['Invited'],
    toState: 'Screening',
    eventType: M05_EVENTS.ScreeningStarted,
    policyVersion: decision.policyVersion,
  });
}

/**
 * Human EligibilityDecision: AI or service accounts can never make the
 * final eligibility decision (Doc 4, Doc 19 — enforced here, not just in UI).
 */
export async function recordEligibilityDecision(
  deps: M05Deps,
  ctx: RequestContext,
  input: { enrolmentId: string; decision: 'Eligible' | 'Ineligible'; reason: string; confirmed: boolean },
): Promise<{ eligibilityDecisionId: string }> {
  if (ctx.actor?.type !== 'user') {
    throw new PlatformError('AUTHORISATION_DENIED', 'Eligibility decisions require an authenticated human');
  }
  const enrolment = await loadEnrolment(deps.pool, input.enrolmentId);
  const decision = await deps.permissions.evaluate(ctx, {
    action: 'eligibility.decide',
    resource: {
      type: 'Enrolment',
      id: enrolment.id,
      state: enrolment.state,
      protectedExistence: false,
      researchProjectId: enrolment.researchProjectId,
    },
    confirmed: input.confirmed,
  });
  assertAllowed(decision, input.confirmed);

  const eligibilityDecisionId = newId('eld');
  await transitionEnrolment(deps, ctx, {
    enrolment,
    action: 'eligibility.decide',
    fromStates: ['Screening'],
    toState: input.decision === 'Eligible' ? 'Eligible' : 'Discontinued',
    eventType: M05_EVENTS.EligibilityDecisionRecorded,
    policyVersion: decision.policyVersion,
    extraSql: async (client) => {
      await client.query(
        `INSERT INTO enrolment.eligibility_decisions
           (id, enrolment_id, protocol_version_id, decision, reason, decided_by_actor_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [eligibilityDecisionId, enrolment.id, enrolment.protocolVersionId, input.decision, input.reason, ctx.actor!.id],
      );
    },
  });
  return { eligibilityDecisionId };
}

export async function startConsentProcess(deps: M05Deps, ctx: RequestContext, enrolmentId: string): Promise<void> {
  const enrolment = await loadEnrolment(deps.pool, enrolmentId);
  const decision = await deps.permissions.evaluate(ctx, {
    action: 'screening.start',
    resource: {
      type: 'Enrolment',
      id: enrolment.id,
      state: enrolment.state,
      protectedExistence: false,
      researchProjectId: enrolment.researchProjectId,
    },
  });
  assertAllowed(decision, false);
  await transitionEnrolment(deps, ctx, {
    enrolment,
    action: 'enrolment.consenting',
    fromStates: ['Eligible'],
    toState: 'Consenting',
    eventType: M05_EVENTS.ConsentProcessStarted,
    policyVersion: decision.policyVersion,
  });
}

/**
 * Enrol the Participant. The policy engine enforces the study-participation
 * consent gate (consentScopes on 'enrolment.enrol'): no compatible current
 * consent, no enrolment — role alone is never sufficient.
 */
export async function enrolParticipant(deps: M05Deps, ctx: RequestContext, enrolmentId: string): Promise<void> {
  const enrolment = await loadEnrolment(deps.pool, enrolmentId);
  const decision = await deps.permissions.evaluate(ctx, {
    action: 'enrolment.enrol',
    resource: {
      type: 'Enrolment',
      id: enrolment.id,
      state: enrolment.state,
      protectedExistence: false,
      ownerParticipantId: enrolment.participantId,
      researchProjectId: enrolment.researchProjectId,
    },
  });
  assertAllowed(decision, false);
  await transitionEnrolment(deps, ctx, {
    enrolment,
    action: 'enrolment.enrol',
    fromStates: ['Consenting'],
    toState: 'Enrolled',
    eventType: M05_EVENTS.ParticipantEnrolled,
    policyVersion: decision.policyVersion,
  });
}

export async function activateEnrolment(deps: M05Deps, ctx: RequestContext, enrolmentId: string): Promise<void> {
  const enrolment = await loadEnrolment(deps.pool, enrolmentId);
  const decision = await deps.permissions.evaluate(ctx, {
    action: 'enrolment.activate',
    resource: {
      type: 'Enrolment',
      id: enrolment.id,
      state: enrolment.state,
      protectedExistence: false,
      researchProjectId: enrolment.researchProjectId,
    },
  });
  assertAllowed(decision, false);
  await transitionEnrolment(deps, ctx, {
    enrolment,
    action: 'enrolment.activate',
    fromStates: ['Enrolled'],
    toState: 'Active',
    eventType: M05_EVENTS.EnrolmentActivated,
    policyVersion: decision.policyVersion,
  });
}

/**
 * Withdrawal is always available to the Participant (owner-permitted) and
 * to authorised staff; requires explicit confirmation; emits
 * ParticipantWithdrawn atomically with the state change (ADR-054).
 *
 * The event is persisted reliably and consumed by nobody: no handler is
 * registered anywhere in the platform, so it is marked published having
 * reached no one (D-52). Withdrawal therefore takes effect the way
 * consent does — at the moment somebody tries to act. M07 refuses to
 * record a session against a withdrawn enrolment, and the permission
 * engine re-reads consent on every decision. Saying "propagation" here
 * would describe a mechanism that runs and does nothing.
 */
export async function withdrawParticipant(
  deps: M05Deps,
  ctx: RequestContext,
  input: { enrolmentId: string; reasonCategory?: string; confirmed: boolean },
): Promise<void> {
  const enrolment = await loadEnrolment(deps.pool, input.enrolmentId);
  const decision = await deps.permissions.evaluate(ctx, {
    action: 'enrolment.withdraw',
    resource: {
      type: 'Enrolment',
      id: enrolment.id,
      state: enrolment.state,
      protectedExistence: false,
      ownerParticipantId: enrolment.participantId,
      researchProjectId: enrolment.researchProjectId,
    },
    confirmed: input.confirmed,
  });
  assertAllowed(decision, input.confirmed);
  await transitionEnrolment(deps, ctx, {
    enrolment,
    action: 'enrolment.withdraw',
    fromStates: ['Invited', 'Screening', 'Eligible', 'Consenting', 'Enrolled', 'Active', 'Paused'],
    toState: 'Withdrawn',
    eventType: M05_EVENTS.ParticipantWithdrawn,
    policyVersion: decision.policyVersion,
    extraSql: async (client) => {
      await client.query(
        `INSERT INTO enrolment.withdrawal_records (id, enrolment_id, requested_by_actor_id, reason_category)
         VALUES ($1, $2, $3, $4)`,
        [newId('wd'), enrolment.id, ctx.actor!.id, input.reasonCategory ?? null],
      );
    },
  });
}
