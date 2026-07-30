import { newId, type Clock, type RequestContext } from '@platform/kernel';
import type { Pool } from '@platform/database';
import {
  evaluatePermission,
  type EvaluationInput,
  type PolicyConfiguration,
  type PolicyDecisionResult,
} from '@platform/policy';
import type { RoleAssignmentQueryPort } from '@platform/m01-identity-org';
import type { PermissionRequest, PermissionServicePort } from '../contracts/index.js';
import {
  findCurrentConsents,
  findRelationshipsForActor,
  insertPolicyDecision,
} from '../infrastructure/repository.js';

/** Structural port: resolves the Participant identity an account acts as (M02). */
export interface ParticipantIdentityPort {
  findParticipantIdByAccount(userAccountId: string): Promise<string | undefined>;
}

/** Structural port: active Blocks involving any of the given identities (M18). */
export interface BlockQueryPort {
  findActiveBlocksInvolving(ids: readonly string[]): Promise<
    { blockerActorId: string; blockedActorId: string; state: 'Active' | 'Revoked' }[]
  >;
}

export interface PermissionServiceDeps {
  pool: Pool;
  clock: Clock;
  policy: PolicyConfiguration;
  roleAssignments: RoleAssignmentQueryPort;
  /** Optional until M02 is composed in; absent = accounts act only as themselves. */
  participantIdentity?: ParticipantIdentityPort;
  /** Optional until M18 is composed in; absent = no blocks known. */
  blocks?: BlockQueryPort;
}

/**
 * M03 permission service: gathers deterministic inputs (roles from M01,
 * relationships/consents from M03 tables), evaluates the pure policy
 * engine, and records the PolicyDecision (Doc 4 step 12). Critical
 * authorities are read fresh from the transactional store on every
 * evaluation — never from caches (ADR-016).
 */
export function createPermissionService(deps: PermissionServiceDeps): PermissionServicePort {
  return {
    async evaluate(ctx: RequestContext, request: PermissionRequest): Promise<PolicyDecisionResult> {
      const actorId = ctx.actor?.id;
      const now = deps.clock.now();
      const actorParticipantId =
        actorId !== undefined && deps.participantIdentity !== undefined
          ? await deps.participantIdentity.findParticipantIdByAccount(actorId)
          : undefined;

      const input: EvaluationInput = {
        actor: {
          id: actorId ?? 'anonymous',
          type: ctx.actor?.type ?? 'user',
          authenticated: ctx.actor !== undefined,
          ...(ctx.authStrength !== undefined ? { authStrength: ctx.authStrength } : {}),
          ...(actorParticipantId !== undefined ? { participantId: actorParticipantId } : {}),
        },
        action: request.action,
        resource: {
          type: request.resource.type,
          id: request.resource.id,
          state: request.resource.state,
          protectedExistence: request.resource.protectedExistence,
          ...(request.resource.ownerParticipantId !== undefined
            ? { ownerParticipantId: request.resource.ownerParticipantId }
            : {}),
          ...(request.resource.organisationId !== undefined
            ? { organisationId: request.resource.organisationId }
            : {}),
          ...(request.resource.researchProjectId !== undefined
            ? { researchProjectId: request.resource.researchProjectId }
            : {}),
        },
        roleAssignments: actorId === undefined ? [] : await deps.roleAssignments.findRoleAssignments(actorId),
        relationships: actorId === undefined ? [] : await findRelationshipsForActor(deps.pool, actorId),
        consents:
          request.resource.ownerParticipantId === undefined
            ? []
            : await findCurrentConsents(
                deps.pool,
                request.resource.ownerParticipantId,
                request.resource.researchProjectId ?? ctx.researchProjectId,
              ),
        ...(ctx.purposeCode !== undefined ? { purposeCode: ctx.purposeCode } : {}),
        context: {
          ...(ctx.organisationId !== undefined ? { organisationId: ctx.organisationId } : {}),
          ...(ctx.researchProjectId !== undefined ? { researchProjectId: ctx.researchProjectId } : {}),
        },
        blocks:
          deps.blocks === undefined
            ? []
            : await deps.blocks.findActiveBlocksInvolving(
                [actorId, actorParticipantId, request.resource.ownerParticipantId].filter(
                  (x): x is string => x !== undefined,
                ),
              ),
        explicitDenies: [],
        now,
      };

      const decision = evaluatePermission(deps.policy, input);

      // Step 12 — record the decision (never blocks the deny path).
      await insertPolicyDecision(deps.pool, {
        id: newId('pd'),
        actorId: actorId ?? 'anonymous',
        action: request.action,
        resourceType: request.resource.type,
        resourceId: request.resource.id,
        outcome: decision.outcome,
        reason: decision.reason,
        policyVersion: decision.policyVersion,
        ...(ctx.purposeCode !== undefined ? { purposeCode: ctx.purposeCode } : {}),
        ...(ctx.organisationId !== undefined ? { organisationId: ctx.organisationId } : {}),
        ...(ctx.researchProjectId !== undefined ? { researchProjectId: ctx.researchProjectId } : {}),
        correlationId: ctx.correlationId,
        traceId: ctx.traceId,
      });

      return decision;
    },
  };
}
