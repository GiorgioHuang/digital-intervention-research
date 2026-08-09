import { newId, PlatformError, type Clock, type RequestContext } from '@platform/kernel';
import {
  appendToOutbox,
  recordAuditEvent,
  withTransaction,
  type Pool,
} from '@platform/database';
import { assertAllowed, type PolicyDecisionResult } from '@platform/policy';
import { M01_EVENTS, type Role } from '../contracts/index.js';
import {
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

/**
 * Inviting somebody onto the platform (ADR-104, D-68/D-69).
 *
 * Until this existed, an invitation could only be written by hand, straight
 * into the database of a running deployment — which is how you end up with
 * an expiry nobody set, an address nobody lowercased, and an account state
 * that does not match the invitation beside it. It is one transaction
 * because it is one act: the account, its membership, and the invitation
 * that lets its holder claim it.
 *
 * WHAT THIS DOES NOT DO: send an email. The platform has no mail sender and
 * this does not pretend otherwise — it returns the address and the expiry
 * so whoever invited can pass them on themselves. A function called
 * "invite" that silently posts nothing anywhere is worse than one that says
 * it is only recording the invitation.
 */
export async function inviteToPlatform(
  deps: M01Deps,
  ctx: RequestContext,
  input: {
    displayName: string;
    email: string;
    organisationId?: string;
    /** Default two weeks. An invitation that never expires is a permanent
     *  unclaimed way into an account, sitting in somebody's mailbox. */
    expiresInDays?: number;
  },
): Promise<{ userAccountId: string; invitationId: string; expiresAt: Date; invitedEmail: string }> {
  const actorId = requireActor(ctx);
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

  const email = input.email.trim().toLowerCase();
  // Not a validator so much as a refusal to record something that cannot
  // possibly be claimed: the claim matches on the token's verified email,
  // so an address with no `@` is an invitation that can only ever expire.
  if (email === '' || !email.includes('@') || email.startsWith('@') || email.endsWith('@')) {
    throw new PlatformError('VALIDATION_ERROR', 'A valid email address is required to invite somebody');
  }
  const days = input.expiresInDays ?? 14;
  if (!Number.isInteger(days) || days < 1 || days > 90) {
    throw new PlatformError('VALIDATION_ERROR', 'An invitation may last between 1 and 90 days');
  }

  const userAccountId = newId('actor');
  const invitationId = newId('invite');
  const now = deps.clock.now();
  const expiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  await withTransaction(deps.pool, async (client) => {
    // 'Invited', not 'Active': the account exists but nobody holds it yet,
    // and the sign-in path is what turns it Active on a successful claim.
    await client.query(
      `INSERT INTO identity_org.user_accounts (id, display_name, account_state, origin)
       VALUES ($1, $2, 'Invited', 'invitation')`,
      [userAccountId, input.displayName],
    );
    if (input.organisationId !== undefined) {
      await insertMembership(client, {
        id: newId('mem'),
        organisationId: input.organisationId,
        userAccountId,
      });
    }
    try {
      await client.query(
        `INSERT INTO identity_org.account_invitations
           (id, user_account_id, issuer, invited_email, expires_at, invited_by)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [invitationId, userAccountId, GOOGLE_ISSUER, email, expiresAt, actorId],
      );
    } catch (error) {
      // The partial unique index on (issuer, lower(invited_email)) where
      // Pending. Two live invitations to one address would mean a first
      // sign-in facing two candidate accounts, so the second is refused
      // here rather than resolved arbitrarily later.
      if (typeof error === 'object' && error !== null && (error as { code?: string }).code === '23505') {
        throw new PlatformError(
          'RESOURCE_CONFLICT',
          'That address already has an invitation waiting. Revoke it before sending another.',
        );
      }
      throw error;
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
      result: 'Succeeded',
      policyDecision: decision.outcome,
      policyVersion: decision.policyVersion,
      source: 'm01.inviteToPlatform',
      occurredAt: now,
    });
  });

  return { userAccountId, invitationId, expiresAt, invitedEmail: email };
}

/** Google's issuer string, matching what the sign-in path records. */
const GOOGLE_ISSUER = 'https://accounts.google.com';

/**
 * Withdrawing an invitation that has not been claimed. Needed because an
 * invitation is a live way into an account: a colleague who never joined,
 * an address typed wrong, somebody who left before their first day.
 */
export async function revokeInvitation(
  deps: M01Deps,
  ctx: RequestContext,
  input: { invitationId: string; confirmed: boolean },
): Promise<void> {
  requireActor(ctx);
  const decision = await deps.checkPermission(ctx, {
    action: 'user.invite',
    resource: { type: 'UserAccount', id: input.invitationId, state: 'Invited', protectedExistence: false },
  });
  assertAllowed(decision, input.confirmed);

  const now = deps.clock.now();
  await withTransaction(deps.pool, async (client) => {
    const result = await client.query(
      `UPDATE identity_org.account_invitations
          SET invitation_state = 'Revoked', record_version = record_version + 1, updated_at = now()
        WHERE id = $1 AND invitation_state = 'Pending'`,
      [input.invitationId],
    );
    // A claimed invitation cannot be revoked — the person is already in,
    // and pretending otherwise would leave an administrator believing they
    // had closed a door that is open. Suspending the account is the action
    // that actually stops them.
    if (result.rowCount === 0) {
      throw new PlatformError(
        'INVALID_STATE_TRANSITION',
        'That invitation is no longer pending. If it was claimed, suspend the account instead.',
      );
    }
    await recordAuditEvent(client, ctx, {
      action: 'user.invite',
      targetType: 'AccountInvitation',
      targetId: input.invitationId,
      result: 'Succeeded',
      policyDecision: decision.outcome,
      policyVersion: decision.policyVersion,
      source: 'm01.revokeInvitation',
      occurredAt: now,
    });
  });
}
