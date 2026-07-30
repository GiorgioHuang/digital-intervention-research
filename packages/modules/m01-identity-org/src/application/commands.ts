import { newId, PlatformError, type Clock, type RequestContext } from '@platform/kernel';
import {
  appendToOutbox,
  recordAuditEvent,
  withTransaction,
  type Pool,
} from '@platform/database';
import type { PolicyDecisionResult } from '@platform/policy';
import { M01_EVENTS, type Role } from '../contracts/index.js';
import {
  findRoleAssignments,
  insertMembership,
  insertOrganisation,
  insertRoleAssignment,
  insertUserAccount,
  revokeRoleAssignment,
} from '../infrastructure/repository.js';

/**
 * Permission evaluation port — implemented by M03's PermissionService and
 * injected at composition time, so M01 does not depend on M03 (no cycles).
 */
export type PermissionCheck = (
  ctx: RequestContext,
  request: {
    action: string;
    resource: { type: string; id: string; state: string; protectedExistence: boolean; organisationId?: string };
    confirmed?: boolean;
  },
) => Promise<PolicyDecisionResult>;

export interface M01Deps {
  pool: Pool;
  clock: Clock;
  checkPermission: PermissionCheck;
}

function requireActor(ctx: RequestContext): string {
  if (ctx.actor === undefined) throw new PlatformError('AUTHENTICATION_REQUIRED', 'No authenticated actor');
  return ctx.actor.id;
}

function assertAllowed(decision: PolicyDecisionResult, confirmed: boolean): void {
  switch (decision.outcome) {
    case 'Allow':
    case 'AllowWithFieldRestrictions':
      return;
    case 'AllowWithConfirmation':
      if (confirmed) return;
      throw new PlatformError('CONFIRMATION_REQUIRED', 'This action requires explicit confirmation');
    case 'StepUpAuthenticationRequired':
      throw new PlatformError('STEP_UP_AUTHENTICATION_REQUIRED', 'Stronger authentication required');
    case 'DenyAndHideExistence':
      throw new PlatformError('RESOURCE_NOT_FOUND', 'Resource not found');
    default:
      throw new PlatformError('AUTHORISATION_DENIED', `Not permitted (${decision.reason})`);
  }
}

export async function createOrganisation(
  deps: M01Deps,
  ctx: RequestContext,
  input: { name: string },
): Promise<{ organisationId: string }> {
  requireActor(ctx);
  const decision = await deps.checkPermission(ctx, {
    action: 'organisation.create',
    resource: { type: 'Organisation', id: 'new', state: 'Draft', protectedExistence: false },
  });
  assertAllowed(decision, false);

  const organisationId = newId('org');
  const now = deps.clock.now();
  await withTransaction(deps.pool, async (client) => {
    await insertOrganisation(client, { id: organisationId, name: input.name });
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: M01_EVENTS.OrganisationCreated,
      sourceModule: 'M01',
      aggregateType: 'Organisation',
      aggregateId: organisationId,
      occurredAt: now,
    });
    await recordAuditEvent(client, ctx, {
      action: 'organisation.create',
      targetType: 'Organisation',
      targetId: organisationId,
      occurredAt: now,
      result: 'Succeeded',
      source: 'M01',
      policyVersion: decision.policyVersion,
    });
  });
  return { organisationId };
}

export async function createUserAccount(
  deps: M01Deps,
  ctx: RequestContext,
  input: { displayName: string; organisationId?: string },
): Promise<{ userAccountId: string }> {
  requireActor(ctx);
  const decision = await deps.checkPermission(ctx, {
    action: 'user.invite',
    resource: {
      type: 'UserAccount',
      id: 'new',
      state: 'Draft',
      protectedExistence: false,
      ...(input.organisationId !== undefined ? { organisationId: input.organisationId } : {}),
    },
  });
  assertAllowed(decision, false);

  const userAccountId = newId('actor');
  const now = deps.clock.now();
  await withTransaction(deps.pool, async (client) => {
    await insertUserAccount(client, { id: userAccountId, displayName: input.displayName });
    if (input.organisationId !== undefined) {
      await insertMembership(client, {
        id: newId('mem'),
        organisationId: input.organisationId,
        userAccountId,
      });
    }
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: M01_EVENTS.UserAccountCreated,
      sourceModule: 'M01',
      aggregateType: 'UserAccount',
      aggregateId: userAccountId,
      occurredAt: now,
    });
    await recordAuditEvent(client, ctx, {
      action: 'user.invite',
      targetType: 'UserAccount',
      targetId: userAccountId,
      occurredAt: now,
      result: 'Succeeded',
      source: 'M01',
      policyVersion: decision.policyVersion,
    });
  });
  return { userAccountId };
}

export async function assignRole(
  deps: M01Deps,
  ctx: RequestContext,
  input: {
    userAccountId: string;
    role: Role;
    organisationId?: string;
    researchProjectId?: string;
    expiresAt?: Date;
    confirmed: boolean;
  },
): Promise<{ roleAssignmentId: string }> {
  const actorId = requireActor(ctx);
  const decision = await deps.checkPermission(ctx, {
    action: 'role.assign',
    resource: {
      type: 'RoleAssignment',
      id: 'new',
      state: 'Draft',
      protectedExistence: false,
      ...(input.organisationId !== undefined ? { organisationId: input.organisationId } : {}),
    },
    confirmed: input.confirmed,
  });
  assertAllowed(decision, input.confirmed);

  const roleAssignmentId = newId('ra');
  const now = deps.clock.now();
  await withTransaction(deps.pool, async (client) => {
    await insertRoleAssignment(client, {
      id: roleAssignmentId,
      userAccountId: input.userAccountId,
      role: input.role,
      ...(input.organisationId !== undefined ? { organisationId: input.organisationId } : {}),
      ...(input.researchProjectId !== undefined ? { researchProjectId: input.researchProjectId } : {}),
      ...(input.expiresAt !== undefined ? { expiresAt: input.expiresAt } : {}),
      assignedByActorId: actorId,
    });
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: M01_EVENTS.RoleAssigned,
      sourceModule: 'M01',
      aggregateType: 'RoleAssignment',
      aggregateId: roleAssignmentId,
      occurredAt: now,
      payload: { role: input.role, userAccountId: input.userAccountId },
    });
    await recordAuditEvent(client, ctx, {
      action: 'role.assign',
      targetType: 'RoleAssignment',
      targetId: roleAssignmentId,
      occurredAt: now,
      result: 'Succeeded',
      source: 'M01',
      policyVersion: decision.policyVersion,
    });
  });
  return { roleAssignmentId };
}

export async function revokeRole(
  deps: M01Deps,
  ctx: RequestContext,
  input: { roleAssignmentId: string; expectedVersion: number; confirmed: boolean },
): Promise<void> {
  const actorId = requireActor(ctx);
  const decision = await deps.checkPermission(ctx, {
    action: 'role.revoke',
    resource: { type: 'RoleAssignment', id: input.roleAssignmentId, state: 'Active', protectedExistence: false },
    confirmed: input.confirmed,
  });
  assertAllowed(decision, input.confirmed);

  const now = deps.clock.now();
  await withTransaction(deps.pool, async (client) => {
    const ok = await revokeRoleAssignment(client, {
      id: input.roleAssignmentId,
      expectedVersion: input.expectedVersion,
      revokedByActorId: actorId,
      now,
    });
    if (!ok) {
      throw new PlatformError('VERSION_CONFLICT', 'Role assignment was modified concurrently or is not active');
    }
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: M01_EVENTS.RoleRevoked,
      sourceModule: 'M01',
      aggregateType: 'RoleAssignment',
      aggregateId: input.roleAssignmentId,
      occurredAt: now,
    });
    await recordAuditEvent(client, ctx, {
      action: 'role.revoke',
      targetType: 'RoleAssignment',
      targetId: input.roleAssignmentId,
      occurredAt: now,
      result: 'Succeeded',
      source: 'M01',
      policyVersion: decision.policyVersion,
    });
  });
}

/**
 * Bootstrap seed for development/tests ONLY: creates the first
 * SystemAdministrator directly (there is no actor yet who could pass a
 * permission check). Audited as a system action; never expose via API.
 */
export async function seedBootstrapAdministrator(
  pool: Pool,
  clock: Clock,
  input: { displayName: string },
): Promise<{ userAccountId: string }> {
  const userAccountId = newId('actor');
  const now = clock.now();
  await withTransaction(pool, async (client) => {
    await insertUserAccount(client, { id: userAccountId, displayName: input.displayName });
    await insertRoleAssignment(client, {
      id: newId('ra'),
      userAccountId,
      role: 'SystemAdministrator',
      assignedByActorId: 'system-bootstrap',
    });
    await recordAuditEvent(
      client,
      {
        requestId: newId('req'),
        correlationId: newId('corr'),
        causationId: undefined,
        traceId: newId('trace'),
        actor: { type: 'system', id: 'system-bootstrap' },
        organisationId: undefined,
        researchProjectId: undefined,
        purposeCode: 'bootstrap',
        authStrength: undefined,
      },
      {
        action: 'bootstrap.seed-administrator',
        targetType: 'UserAccount',
        targetId: userAccountId,
        occurredAt: now,
        result: 'Succeeded',
        source: 'M01',
      },
    );
  });
  return { userAccountId };
}
