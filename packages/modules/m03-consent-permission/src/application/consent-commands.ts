import { newId, PlatformError, type Clock, type RequestContext } from '@platform/kernel';
import { appendToOutbox, recordAuditEvent, withTransaction, type Pool } from '@platform/database';
import { assertAllowed } from '@platform/policy';
import { M03_EVENTS, type PermissionServicePort } from '../contracts/index.js';
import {
  appendConsentDecision,
  findCurrentConsent,
  findRelationship,
  insertRelationship,
  transitionRelationship,
} from '../infrastructure/repository.js';

export interface M03Deps {
  pool: Pool;
  clock: Clock;
  permissions: PermissionServicePort;
}

/**
 * Record a granular consent decision for one scope (Doc 4: consent is
 * never a global boolean; decisions are append-only history).
 */
export async function recordConsentDecision(
  deps: M03Deps,
  ctx: RequestContext,
  input: {
    participantId: string;
    scope: string;
    decision: 'Granted' | 'Declined' | 'Restricted' | 'Deferred';
    templateVersion: string;
    researchProjectId?: string;
    restrictions?: string[];
    expiresAt?: Date;
  },
): Promise<{ consentDecisionId: string }> {
  const decision = await deps.permissions.evaluate(ctx, {
    action: 'consent.record',
    resource: {
      type: 'Consent',
      id: `${input.participantId}:${input.scope}`,
      state: 'Draft',
      protectedExistence: false,
      ownerParticipantId: input.participantId,
      ...(input.researchProjectId !== undefined ? { researchProjectId: input.researchProjectId } : {}),
    },
  });
  assertAllowed(decision, false);

  const consentDecisionId = newId('cd');
  const now = deps.clock.now();
  await withTransaction(deps.pool, async (client) => {
    await appendConsentDecision(client, {
      id: consentDecisionId,
      participantId: input.participantId,
      ...(input.researchProjectId !== undefined ? { researchProjectId: input.researchProjectId } : {}),
      scope: input.scope,
      templateVersion: input.templateVersion,
      decision: input.decision,
      ...(input.restrictions !== undefined ? { restrictions: input.restrictions } : {}),
      decidedByActorId: ctx.actor!.id,
      effectiveFrom: now,
      ...(input.expiresAt !== undefined ? { expiresAt: input.expiresAt } : {}),
    });
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: M03_EVENTS.ConsentRecorded,
      sourceModule: 'M03',
      aggregateType: 'Consent',
      aggregateId: consentDecisionId,
      occurredAt: now,
      payload: { participantId: input.participantId, scope: input.scope, decision: input.decision },
    });
    await recordAuditEvent(client, ctx, {
      action: 'consent.record',
      targetType: 'Consent',
      targetId: consentDecisionId,
      participantId: input.participantId,
      occurredAt: now,
      result: 'Succeeded',
      source: 'M03',
      policyVersion: decision.policyVersion,
    });
  });
  return { consentDecisionId };
}

/**
 * Withdraw consent for one scope. Withdrawal is scoped, not all-or-nothing;
 * the ConsentWithdrawn Domain Event commits atomically with the state
 * change (outbox) so downstream propagation is reliable (ADR-018/054).
 */
export async function withdrawConsent(
  deps: M03Deps,
  ctx: RequestContext,
  input: {
    participantId: string;
    scope: string;
    templateVersion: string;
    researchProjectId?: string;
    confirmed: boolean;
  },
): Promise<{ consentDecisionId: string }> {
  const decision = await deps.permissions.evaluate(ctx, {
    action: 'consent.withdraw',
    resource: {
      type: 'Consent',
      id: `${input.participantId}:${input.scope}`,
      state: 'Granted',
      protectedExistence: false,
      ownerParticipantId: input.participantId,
      ...(input.researchProjectId !== undefined ? { researchProjectId: input.researchProjectId } : {}),
    },
    confirmed: input.confirmed,
  });
  assertAllowed(decision, input.confirmed);

  const current = await findCurrentConsent(deps.pool, input.participantId, input.scope, input.researchProjectId);
  if (current === undefined) {
    throw new PlatformError('RESOURCE_NOT_FOUND', 'No consent recorded for this scope');
  }
  if (current.decision === 'Withdrawn') {
    throw new PlatformError('INVALID_STATE_TRANSITION', 'Consent for this scope is already withdrawn');
  }

  const consentDecisionId = newId('cd');
  const now = deps.clock.now();
  await withTransaction(deps.pool, async (client) => {
    await appendConsentDecision(client, {
      id: consentDecisionId,
      participantId: input.participantId,
      ...(input.researchProjectId !== undefined ? { researchProjectId: input.researchProjectId } : {}),
      scope: input.scope,
      templateVersion: input.templateVersion,
      decision: 'Withdrawn',
      decidedByActorId: ctx.actor!.id,
      effectiveFrom: now,
    });
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: M03_EVENTS.ConsentWithdrawn,
      sourceModule: 'M03',
      aggregateType: 'Consent',
      aggregateId: consentDecisionId,
      occurredAt: now,
      payload: { participantId: input.participantId, scope: input.scope },
    });
    await recordAuditEvent(client, ctx, {
      action: 'consent.withdraw',
      targetType: 'Consent',
      targetId: consentDecisionId,
      participantId: input.participantId,
      occurredAt: now,
      result: 'Succeeded',
      source: 'M03',
      policyVersion: decision.policyVersion,
    });
  });
  return { consentDecisionId };
}

/** Propose a relationship (starts PendingVerification; Doc 4 relationship model). */
export async function proposeRelationship(
  deps: M03Deps,
  ctx: RequestContext,
  input: {
    participantId: string;
    relatedActorId: string;
    relationshipType: string;
    permittedActions: string[];
    expiresAt?: Date;
  },
): Promise<{ relationshipId: string }> {
  const decision = await deps.permissions.evaluate(ctx, {
    action: 'relationship.propose',
    resource: { type: 'Relationship', id: 'new', state: 'Draft', protectedExistence: false },
  });
  assertAllowed(decision, false);

  const relationshipId = newId('rel');
  const now = deps.clock.now();
  await withTransaction(deps.pool, async (client) => {
    await insertRelationship(client, {
      id: relationshipId,
      participantId: input.participantId,
      relatedActorId: input.relatedActorId,
      relationshipType: input.relationshipType,
      permittedActions: input.permittedActions,
      proposedByActorId: ctx.actor!.id,
      ...(input.expiresAt !== undefined ? { expiresAt: input.expiresAt } : {}),
    });
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: M03_EVENTS.RelationshipProposed,
      sourceModule: 'M03',
      aggregateType: 'Relationship',
      aggregateId: relationshipId,
      occurredAt: now,
    });
    await recordAuditEvent(client, ctx, {
      action: 'relationship.propose',
      targetType: 'Relationship',
      targetId: relationshipId,
      participantId: input.participantId,
      occurredAt: now,
      result: 'Succeeded',
      source: 'M03',
      policyVersion: decision.policyVersion,
    });
  });
  return { relationshipId };
}

/**
 * Approve (activate) a relationship — only the Participant themselves
 * (owner-only action; direction never reverses, Doc 4).
 */
export async function approveRelationship(
  deps: M03Deps,
  ctx: RequestContext,
  input: { relationshipId: string; expectedVersion: number; confirmed: boolean },
): Promise<void> {
  const rel = await findRelationship(deps.pool, input.relationshipId);
  if (rel === undefined) throw new PlatformError('RESOURCE_NOT_FOUND', 'Relationship not found');

  const decision = await deps.permissions.evaluate(ctx, {
    action: 'relationship.approve',
    resource: {
      type: 'Relationship',
      id: rel.id,
      state: rel.state,
      protectedExistence: false,
      ownerParticipantId: rel.participantId,
    },
    confirmed: input.confirmed,
  });
  assertAllowed(decision, input.confirmed);

  const now = deps.clock.now();
  await withTransaction(deps.pool, async (client) => {
    const ok = await transitionRelationship(client, {
      id: rel.id,
      expectedVersion: input.expectedVersion,
      fromStates: ['Proposed', 'PendingVerification'],
      toState: 'Active',
      now,
    });
    if (!ok) throw new PlatformError('VERSION_CONFLICT', 'Relationship changed concurrently or state disallows approval');
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: M03_EVENTS.RelationshipApproved,
      sourceModule: 'M03',
      aggregateType: 'Relationship',
      aggregateId: rel.id,
      occurredAt: now,
    });
    await recordAuditEvent(client, ctx, {
      action: 'relationship.approve',
      targetType: 'Relationship',
      targetId: rel.id,
      participantId: rel.participantId,
      occurredAt: now,
      result: 'Succeeded',
      source: 'M03',
      policyVersion: decision.policyVersion,
    });
  });
}

/** Revoke a relationship — prompt effect; access stops on next evaluation. */
export async function revokeRelationship(
  deps: M03Deps,
  ctx: RequestContext,
  input: { relationshipId: string; expectedVersion: number },
): Promise<void> {
  const rel = await findRelationship(deps.pool, input.relationshipId);
  if (rel === undefined) throw new PlatformError('RESOURCE_NOT_FOUND', 'Relationship not found');

  const decision = await deps.permissions.evaluate(ctx, {
    action: 'relationship.revoke',
    resource: {
      type: 'Relationship',
      id: rel.id,
      state: rel.state,
      protectedExistence: false,
      ownerParticipantId: rel.participantId,
    },
  });
  assertAllowed(decision, false);

  const now = deps.clock.now();
  await withTransaction(deps.pool, async (client) => {
    const ok = await transitionRelationship(client, {
      id: rel.id,
      expectedVersion: input.expectedVersion,
      fromStates: ['Proposed', 'PendingVerification', 'Active', 'Restricted', 'Suspended'],
      toState: 'Revoked',
      now,
    });
    if (!ok) throw new PlatformError('VERSION_CONFLICT', 'Relationship changed concurrently');
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: M03_EVENTS.RelationshipRevoked,
      sourceModule: 'M03',
      aggregateType: 'Relationship',
      aggregateId: rel.id,
      occurredAt: now,
    });
    await recordAuditEvent(client, ctx, {
      action: 'relationship.revoke',
      targetType: 'Relationship',
      targetId: rel.id,
      participantId: rel.participantId,
      occurredAt: now,
      result: 'Succeeded',
      source: 'M03',
      policyVersion: decision.policyVersion,
    });
  });
}
