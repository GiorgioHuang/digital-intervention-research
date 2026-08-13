import { newId, PlatformError, type Clock, type RequestContext } from '@platform/kernel';
import { appendToOutbox, recordAuditEvent, withTransaction, type Pool } from '@platform/database';
import { assertAllowed, RELATIONSHIP_AUTHORISABLE_ACTIONS } from '@platform/policy';
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
    /**
     * Whether somebody was helping the participant when they decided.
     * The column for this has existed since the consent tables were
     * written and nothing ever set it, while a chat message sent with
     * help was marked and said so to its recipient — the platform
     * recorded assistance for small talk and not for consent.
     *
     * Never who. The helper's name is the participant's own business and
     * stays on their device (D-15).
     */
    assistanceRecorded?: boolean;
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
      assistanceRecorded: input.assistanceRecorded === true,
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
 * Tell a participant that the terms they agreed to have changed, and that
 * the access resting on that agreement stops until they agree again.
 *
 * `decision` has permitted 'ReConsentRequired' since the consent tables
 * were written and no code has ever set it. The permission engine reads
 * that value and refuses everything the scope gates until the
 * participant answers, and the error catalogue carries a message for the
 * outcome. The whole mechanism was built, wired and unreachable: a
 * consent text could be revised and every participant would carry on
 * under an agreement to wording that no longer existed, while the screen
 * showed them a cheerful "Granted".
 *
 * Three refusals matter more than the write.
 *
 * There must be something to supersede. Demanding re-consent for a scope
 * that was declined, withdrawn or never decided changes nothing and would
 * tell the person who pressed it that they had acted.
 *
 * The version must actually be different. Otherwise this is a button that
 * cuts a participant's access off and gives them nothing new to read.
 *
 * And the note is required, because a demand to agree again without
 * saying what changed is not a request — the participant cannot judge the
 * thing they are being asked to judge, and their only real option is to
 * agree to whatever it is.
 */
export async function requireReConsent(
  deps: M03Deps,
  ctx: RequestContext,
  input: {
    participantId: string;
    scope: string;
    newTemplateVersion: string;
    whatChanged: string;
    researchProjectId?: string;
    confirmed: boolean;
  },
): Promise<{ consentDecisionId: string }> {
  const decision = await deps.permissions.evaluate(ctx, {
    action: 'consent.require-reconsent',
    resource: {
      type: 'Consent',
      id: `${input.participantId}:${input.scope}`,
      state: 'Active',
      protectedExistence: false,
      ownerParticipantId: input.participantId,
      ...(input.researchProjectId !== undefined ? { researchProjectId: input.researchProjectId } : {}),
    },
    confirmed: input.confirmed,
  });
  assertAllowed(decision, input.confirmed);

  const note = input.whatChanged.trim();
  if (note === '') {
    throw new PlatformError('VALIDATION_ERROR', 'Say what changed: a demand to agree again cannot be silent');
  }

  const projectId = input.researchProjectId ?? '';
  const current = await deps.pool.query(
    `SELECT decision, consent_template_version FROM consent_permission.consent_current
      WHERE participant_id = $1 AND research_project_id = $2 AND consent_scope = $3`,
    [input.participantId, projectId, input.scope],
  );
  const row = current.rows[0] as { decision: string; consent_template_version: string } | undefined;
  if (row === undefined || !['Granted', 'Restricted'].includes(row.decision)) {
    throw new PlatformError(
      'RESOURCE_STATE_BLOCKED',
      'There is no agreement here to supersede, so asking again would change nothing',
    );
  }
  if (row.consent_template_version === input.newTemplateVersion) {
    throw new PlatformError(
      'RESOURCE_STATE_BLOCKED',
      'That is the version they already agreed to — this would stop their access and give them nothing new to read',
    );
  }

  const consentDecisionId = newId('cd');
  const now = deps.clock.now();
  await withTransaction(deps.pool, async (client) => {
    await appendConsentDecision(client, {
      id: consentDecisionId,
      participantId: input.participantId,
      ...(input.researchProjectId !== undefined ? { researchProjectId: input.researchProjectId } : {}),
      scope: input.scope,
      templateVersion: input.newTemplateVersion,
      decision: 'ReConsentRequired',
      decidedByActorId: ctx.actor!.id,
      effectiveFrom: now,
      decisionNote: note,
    });
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: M03_EVENTS.ConsentRecorded,
      sourceModule: 'M03',
      aggregateType: 'Consent',
      aggregateId: consentDecisionId,
      occurredAt: now,
      payload: { participantId: input.participantId, scope: input.scope, decision: 'ReConsentRequired' },
    });
    await recordAuditEvent(client, ctx, {
      action: 'consent.require-reconsent',
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
 * change (outbox, ADR-018/054). The event reaches no consumer today
 * (D-52) and withdrawal does not depend on one: the permission engine
 * re-reads `consent_current` on every decision, so a withdrawal is in
 * force at the next action rather than whenever something propagates.
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
    /** Whether somebody was helping. Withdrawing matters as much as
     *  granting, and more if a question is ever raised about it. */
    assistanceRecorded?: boolean;
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
      assistanceRecorded: input.assistanceRecorded === true,
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

  /*
   * A relationship may only carry actions the engine will actually
   * consult it for.
   *
   * `permittedActions` was written here verbatim, and step 4 of the
   * engine reads a relationship's list only for actions whose
   * requirement carries `requiresRelationship`. Anything else went into
   * the row, was read by nothing, and — this is the part that matters —
   * was printed back to the participant under "What this would let them
   * do" on the screen where they decide whether to approve it, falling
   * through to the raw string when no wording matched. So the one
   * decision on the platform that is entirely the participant's own
   * could be taken on a list the platform did not understand and would
   * never honour.
   *
   * The staff screen has only ever offered the three real ones, so
   * nothing legitimate is refused by this; it closes the gap between
   * that screen and the route behind it, which validates nothing.
   */
  const unhonourable = input.permittedActions.filter((a) => !RELATIONSHIP_AUTHORISABLE_ACTIONS.includes(a));
  if (unhonourable.length > 0) {
    throw new PlatformError(
      'VALIDATION_ERROR',
      `A relationship cannot grant ${unhonourable.join(', ')}: nothing in the platform reads a relationship for those, ` +
        'so the participant would be shown access that would never take effect',
    );
  }

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

/**
 * Pausing somebody's access, and letting it resume.
 *
 * Until this existed a participant had exactly one way to stop somebody:
 * end it, permanently. Getting it back then meant the other person being
 * proposed again and the participant approving again — a negotiation with
 * somebody they may have paused precisely because they did not want to
 * talk to them this week.
 *
 * The state was already there and already understood everywhere else. The
 * schema has carried 'Suspended' since M03 was written, the permission
 * engine counts only 'Active' relationships when it looks for one, and the
 * participant's own screen has had the words "Access is paused" waiting on
 * it. Nothing could ever set it.
 *
 * The cases are ordinary: a daughter travelling for a month, a son the
 * participant has fallen out with, or simply wanting to think. Offering
 * only the permanent version pushes people either to leave access on when
 * they would rather not, or to end something they will have to negotiate
 * to restore. Neither is a choice anybody should have to make about their
 * own life story.
 *
 * `relationship.revoke` is the permission, because pausing is removing
 * access — a lesser version of the same decision by the same person, and
 * owner-only so the engine checks whose circle this is.
 */
export async function pauseRelationship(
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
    // Only from Active. Pausing something already revoked would look like
    // it could be resumed, and pausing a proposal is not a thing anybody
    // means — declining it is.
    const ok = await transitionRelationship(client, {
      id: rel.id,
      expectedVersion: input.expectedVersion,
      fromStates: ['Active', 'Restricted'],
      toState: 'Suspended',
      now,
    });
    if (!ok) throw new PlatformError('VERSION_CONFLICT', 'Relationship changed concurrently');
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: M03_EVENTS.RelationshipPaused,
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
      source: 'M03.pauseRelationship',
      policyVersion: decision.policyVersion,
    });
  });
}

/**
 * Letting a paused relationship resume. `relationship.approve`, because
 * this is the participant giving access again — the same decision they
 * made the first time, and confirmed for the same reason.
 */
export async function resumeRelationship(
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
    // Paused only. Resuming something that was ENDED would quietly undo a
    // permanent decision without the other person being proposed again,
    // which is the whole difference between the two.
    const ok = await transitionRelationship(client, {
      id: rel.id,
      expectedVersion: input.expectedVersion,
      fromStates: ['Suspended'],
      toState: 'Active',
      now,
    });
    if (!ok) throw new PlatformError('VERSION_CONFLICT', 'Relationship changed concurrently');
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: M03_EVENTS.RelationshipResumed,
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
      source: 'M03.resumeRelationship',
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
