import { newId, PlatformError, type Clock, type RequestContext } from '@platform/kernel';
import { appendToOutbox, recordAuditEvent, withTransaction, type Pool } from '@platform/database';
import { assertAllowed, type PolicyDecisionResult } from '@platform/policy';
import { M15_EVENTS } from '../contracts/index.js';

/*
 * `ownerParticipantId` is optional and every command in this file leaves it
 * unset: governance work is staff work, judged on role and organisation.
 * It is here for the one query that is not — a participant reading back
 * what they themselves decided, which the engine can only judge as
 * owner-permitted if it is told whose record it is. The field was already
 * part of the platform's resource shape; this module's copy of the type was
 * simply narrower than the thing it describes.
 */
export type PermissionCheck = (
  ctx: RequestContext,
  request: {
    action: string;
    resource: {
      type: string;
      id: string;
      state: string;
      protectedExistence: boolean;
      ownerParticipantId?: string;
    };
    confirmed?: boolean;
  },
) => Promise<PolicyDecisionResult>;

export interface M15Deps {
  pool: Pool;
  clock: Clock;
  checkPermission: PermissionCheck;
}

/**
 * Request an approval for one EXACT artefact version (Doc 16 §38.1).
 * The request records who asked; the same person can never decide it
 * (ADR-051 — enforced here AND by the DB CHECK).
 */
export async function requestApproval(
  deps: M15Deps,
  ctx: RequestContext,
  input: { artefactType: string; artefactId: string; artefactVersion: number },
): Promise<{ approvalRecordId: string }> {
  const decision = await deps.checkPermission(ctx, {
    action: 'approval.request',
    resource: { type: 'ApprovalRecord', id: 'new', state: 'Requested', protectedExistence: false },
  });
  assertAllowed(decision, false);

  const approvalRecordId = newId('apr');
  const now = deps.clock.now();
  await withTransaction(deps.pool, async (client) => {
    await client.query(
      `INSERT INTO governance_audit.approval_records
         (id, artefact_type, artefact_id, artefact_version, requested_by_actor_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [approvalRecordId, input.artefactType, input.artefactId, input.artefactVersion, ctx.actor!.id],
    );
    await client.query(
      `INSERT INTO governance_audit.approval_state_history (id, approval_record_id, from_state, to_state, actor_id)
       VALUES ($1, $2, 'None', 'Requested', $3)`,
      [newId('ash'), approvalRecordId, ctx.actor!.id],
    );
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: M15_EVENTS.ApprovalRequested,
      sourceModule: 'M15',
      aggregateType: 'ApprovalRecord',
      aggregateId: approvalRecordId,
      occurredAt: now,
      payload: { artefactType: input.artefactType, artefactVersion: input.artefactVersion },
    });
    await recordAuditEvent(client, ctx, {
      action: 'approval.request',
      targetType: 'ApprovalRecord',
      targetId: approvalRecordId,
      occurredAt: now,
      result: 'Succeeded',
      source: 'M15',
      policyVersion: decision.policyVersion,
    });
  });
  return { approvalRecordId };
}

/**
 * Decide an approval: human + confirmed + MFA, and never the requester.
 * The decision stores the authenticated strength as reviewer-authority
 * evidence (Doc 16 §38.2).
 */
export async function decideApproval(
  deps: M15Deps,
  ctx: RequestContext,
  input: { approvalRecordId: string; decision: 'Approved' | 'Rejected'; reason: string; confirmed: boolean },
): Promise<void> {
  if (ctx.actor?.type !== 'user') {
    throw new PlatformError('AUTHORISATION_DENIED', 'Approval decisions require an authenticated human');
  }
  const rec = await deps.pool.query(
    `SELECT approval_state, requested_by_actor_id FROM governance_audit.approval_records WHERE id = $1`,
    [input.approvalRecordId],
  );
  const row = rec.rows[0];
  if (row === undefined) throw new PlatformError('RESOURCE_NOT_FOUND', 'Approval record not found');
  const decision = await deps.checkPermission(ctx, {
    action: 'approval.decide',
    resource: {
      type: 'ApprovalRecord',
      id: input.approvalRecordId,
      state: row.approval_state,
      protectedExistence: false,
    },
    confirmed: input.confirmed,
  });
  assertAllowed(decision, input.confirmed);
  if (row.requested_by_actor_id === ctx.actor.id) {
    throw new PlatformError('AUTHORISATION_DENIED', 'Self-approval is not permitted');
  }
  if (input.reason.trim() === '') {
    throw new PlatformError('VALIDATION_ERROR', 'An approval decision requires a reason');
  }

  const now = deps.clock.now();
  await withTransaction(deps.pool, async (client) => {
    const res = await client.query(
      `UPDATE governance_audit.approval_records
          SET approval_state = $2, decided_by_actor_id = $3, decision_reason = $4,
              decision_auth_strength = $5, record_version = record_version + 1, updated_at = $6
        WHERE id = $1 AND approval_state = 'Requested'`,
      [input.approvalRecordId, input.decision, ctx.actor!.id, input.reason, ctx.authStrength ?? 'mfa', now],
    );
    if (res.rowCount !== 1) {
      throw new PlatformError('INVALID_STATE_TRANSITION', 'Approval is not open for decision');
    }
    await client.query(
      `INSERT INTO governance_audit.approval_state_history (id, approval_record_id, from_state, to_state, actor_id)
       VALUES ($1, $2, 'Requested', $3, $4)`,
      [newId('ash'), input.approvalRecordId, input.decision, ctx.actor!.id],
    );
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: M15_EVENTS.ApprovalDecided,
      sourceModule: 'M15',
      aggregateType: 'ApprovalRecord',
      aggregateId: input.approvalRecordId,
      occurredAt: now,
      payload: { decision: input.decision },
    });
    await recordAuditEvent(client, ctx, {
      action: 'approval.decide',
      targetType: 'ApprovalRecord',
      targetId: input.approvalRecordId,
      occurredAt: now,
      result: 'Succeeded',
      source: 'M15',
      policyVersion: decision.policyVersion,
    });
  });
}

/** Place a governance hold on an artefact (confirmed reviewer action). */
export async function placeGovernanceHold(
  deps: M15Deps,
  ctx: RequestContext,
  input: { artefactType: string; artefactId: string; reason: string; confirmed: boolean },
): Promise<{ governanceHoldId: string }> {
  const decision = await deps.checkPermission(ctx, {
    action: 'governance-hold.place',
    resource: { type: 'GovernanceHold', id: 'new', state: 'Draft', protectedExistence: false },
    confirmed: input.confirmed,
  });
  assertAllowed(decision, input.confirmed);

  const governanceHoldId = newId('gh');
  const now = deps.clock.now();
  await withTransaction(deps.pool, async (client) => {
    await client.query(
      `INSERT INTO governance_audit.governance_holds (id, artefact_type, artefact_id, reason, placed_by_actor_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [governanceHoldId, input.artefactType, input.artefactId, input.reason, ctx.actor!.id],
    );
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: M15_EVENTS.GovernanceHoldPlaced,
      sourceModule: 'M15',
      aggregateType: 'GovernanceHold',
      aggregateId: governanceHoldId,
      occurredAt: now,
      payload: { artefactType: input.artefactType },
    });
    await recordAuditEvent(client, ctx, {
      action: 'governance-hold.place',
      targetType: 'GovernanceHold',
      targetId: governanceHoldId,
      occurredAt: now,
      result: 'Succeeded',
      source: 'M15',
      policyVersion: decision.policyVersion,
    });
  });
  return { governanceHoldId };
}

export async function liftGovernanceHold(
  deps: M15Deps,
  ctx: RequestContext,
  input: { governanceHoldId: string; liftReason: string; confirmed: boolean },
): Promise<void> {
  const decision = await deps.checkPermission(ctx, {
    action: 'governance-hold.lift',
    resource: { type: 'GovernanceHold', id: input.governanceHoldId, state: 'Active', protectedExistence: false },
    confirmed: input.confirmed,
  });
  assertAllowed(decision, input.confirmed);

  const now = deps.clock.now();
  await withTransaction(deps.pool, async (client) => {
    const res = await client.query(
      `UPDATE governance_audit.governance_holds
          SET hold_state = 'Lifted', lifted_by_actor_id = $2, lift_reason = $3,
              record_version = record_version + 1, updated_at = $4
        WHERE id = $1 AND hold_state = 'Active'`,
      [input.governanceHoldId, ctx.actor!.id, input.liftReason, now],
    );
    if (res.rowCount !== 1) throw new PlatformError('INVALID_STATE_TRANSITION', 'Hold is not active');
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: M15_EVENTS.GovernanceHoldLifted,
      sourceModule: 'M15',
      aggregateType: 'GovernanceHold',
      aggregateId: input.governanceHoldId,
      occurredAt: now,
    });
    await recordAuditEvent(client, ctx, {
      action: 'governance-hold.lift',
      targetType: 'GovernanceHold',
      targetId: input.governanceHoldId,
      occurredAt: now,
      result: 'Succeeded',
      source: 'M15',
      policyVersion: decision.policyVersion,
    });
  });
}

/**
 * Break-glass emergency access record (Doc 16 §38.5): always MFA +
 * confirmed, always carries reason/scope/expiry, and is born awaiting a
 * mandatory retrospective review by someone else.
 */
export async function executeBreakGlass(
  deps: M15Deps,
  ctx: RequestContext,
  input: { reason: string; scope: string; expiresAt: Date; confirmed: boolean },
): Promise<{ breakGlassId: string }> {
  if (ctx.actor?.type !== 'user') {
    throw new PlatformError('AUTHORISATION_DENIED', 'Break-glass requires an authenticated human');
  }
  const decision = await deps.checkPermission(ctx, {
    action: 'break-glass.execute',
    resource: { type: 'BreakGlassRecord', id: 'new', state: 'Draft', protectedExistence: false },
    confirmed: input.confirmed,
  });
  assertAllowed(decision, input.confirmed);
  if (input.reason.trim() === '' || input.scope.trim() === '') {
    throw new PlatformError('VALIDATION_ERROR', 'Break-glass requires an explicit reason and scope');
  }
  if (input.expiresAt <= deps.clock.now()) {
    throw new PlatformError('VALIDATION_ERROR', 'Break-glass expiry must be in the future');
  }

  const breakGlassId = newId('bg');
  const now = deps.clock.now();
  await withTransaction(deps.pool, async (client) => {
    await client.query(
      `INSERT INTO governance_audit.break_glass_records (id, executed_by_actor_id, reason, scope, expires_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [breakGlassId, ctx.actor!.id, input.reason, input.scope, input.expiresAt],
    );
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: M15_EVENTS.BreakGlassExecuted,
      sourceModule: 'M15',
      aggregateType: 'BreakGlassRecord',
      aggregateId: breakGlassId,
      occurredAt: now,
      payload: { scope: input.scope },
    });
    await recordAuditEvent(client, ctx, {
      action: 'break-glass.execute',
      targetType: 'BreakGlassRecord',
      targetId: breakGlassId,
      occurredAt: now,
      result: 'Succeeded',
      source: 'M15',
      policyVersion: decision.policyVersion,
    });
  });
  return { breakGlassId };
}

/** Mandatory retrospective review — never by the executor. */
export async function reviewBreakGlass(
  deps: M15Deps,
  ctx: RequestContext,
  input: {
    breakGlassId: string;
    outcome: 'Justified' | 'Not Justified' | 'Needs Follow-Up';
    confirmed: boolean;
  },
): Promise<void> {
  if (ctx.actor?.type !== 'user') {
    throw new PlatformError('AUTHORISATION_DENIED', 'Break-glass review requires an authenticated human');
  }
  const rec = await deps.pool.query(
    `SELECT review_state, executed_by_actor_id FROM governance_audit.break_glass_records WHERE id = $1`,
    [input.breakGlassId],
  );
  const row = rec.rows[0];
  if (row === undefined) throw new PlatformError('RESOURCE_NOT_FOUND', 'Break-glass record not found');
  const decision = await deps.checkPermission(ctx, {
    action: 'break-glass.review',
    resource: {
      type: 'BreakGlassRecord',
      id: input.breakGlassId,
      state: row.review_state,
      protectedExistence: false,
    },
    confirmed: input.confirmed,
  });
  assertAllowed(decision, input.confirmed);
  if (row.executed_by_actor_id === ctx.actor.id) {
    throw new PlatformError('AUTHORISATION_DENIED', 'Break-glass cannot be reviewed by its executor');
  }

  const now = deps.clock.now();
  await withTransaction(deps.pool, async (client) => {
    const res = await client.query(
      `UPDATE governance_audit.break_glass_records
          SET review_state = 'Reviewed', reviewed_by_actor_id = $2, review_outcome = $3, reviewed_at = $4
        WHERE id = $1 AND review_state = 'Pending Review'`,
      [input.breakGlassId, ctx.actor!.id, input.outcome, now],
    );
    if (res.rowCount !== 1) throw new PlatformError('INVALID_STATE_TRANSITION', 'Record already reviewed');
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: M15_EVENTS.BreakGlassReviewed,
      sourceModule: 'M15',
      aggregateType: 'BreakGlassRecord',
      aggregateId: input.breakGlassId,
      occurredAt: now,
      payload: { outcome: input.outcome },
    });
    await recordAuditEvent(client, ctx, {
      action: 'break-glass.review',
      targetType: 'BreakGlassRecord',
      targetId: input.breakGlassId,
      occurredAt: now,
      result: 'Succeeded',
      source: 'M15',
      policyVersion: decision.policyVersion,
    });
  });
}
