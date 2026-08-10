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
    resource: {
      type: string;
      id: string;
      state: string;
      protectedExistence: boolean;
      organisationId?: string;
      /** Needed by owner-permitted actions, which the engine decides on. */
      ownerParticipantId?: string;
    };
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
    /*
     * Creating an organisation deliberately grants NOTHING inside it.
     *
     * The first version of this handed the creator OrganisationAdministrator,
     * to fix a real dead end: a bootstrapped SystemAdministrator creates an
     * organisation and then cannot open a screen in it, because that role is
     * narrow by design (Doc 4: administration only) and carries
     * `role.assign` but not `user.view`.
     *
     * An existing test refused it, and was right to. Doc 4's separation is
     * that administering the software and seeing the people in a study are
     * different jobs — so a platform operator must not acquire visibility
     * of a study population as a SIDE EFFECT of an administrative act.
     * Automatic is the whole problem: nobody decided it and nothing records
     * a decision.
     *
     * The dead end is real and is fixed on the way in instead: the
     * organisation chooser offers to grant the role, which goes through
     * `assignRole` — confirmed, audited, and visible afterwards as
     * somebody having taken it. Same end state where it is wanted, and an
     * audit trail that can tell the two apart.
     */
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
    /*
     * A role somebody already holds is now something a person can ask for
     * by accident: the accounts screen has a "give this role" control, and
     * two clicks used to surface a raw duplicate-key error from Postgres.
     * The partial unique index is right — one active assignment per role
     * and scope — so this says so in words instead.
     */
    try {
      await insertRoleAssignment(client, {
        id: roleAssignmentId,
        userAccountId: input.userAccountId,
        role: input.role,
        ...(input.organisationId !== undefined ? { organisationId: input.organisationId } : {}),
        ...(input.researchProjectId !== undefined ? { researchProjectId: input.researchProjectId } : {}),
        ...(input.expiresAt !== undefined ? { expiresAt: input.expiresAt } : {}),
        assignedByActorId: actorId,
      });
    } catch (error) {
      if (typeof error === 'object' && error !== null && (error as { code?: string }).code === '23505') {
        throw new PlatformError('RESOURCE_CONFLICT', 'That person already holds this role here.');
      }
      throw error;
    }
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

  const email = normaliseInviteEmail(input.email);
  const days = normaliseInviteDays(input.expiresInDays);

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
 * Inviting the holder of an account that already exists.
 *
 * The case this is for: accounts created before Sign in with Google, or by
 * a seed. They have roles and history and no way for anybody to reach
 * them, because nothing links them to a Google identity. Without this they
 * are stranded — visible on the accounts screen, belonging to a person who
 * cannot sign in as them.
 *
 * Refused once an identity IS linked, because then the account has a
 * holder and this would be a way of handing it to somebody else.
 */
export async function inviteExistingAccount(
  deps: M01Deps,
  ctx: RequestContext,
  input: { userAccountId: string; email: string; expiresInDays?: number },
): Promise<{ invitationId: string; expiresAt: Date; invitedEmail: string }> {
  const actorId = requireActor(ctx);
  const decision = await deps.checkPermission(ctx, {
    action: 'user.invite',
    resource: { type: 'UserAccount', id: input.userAccountId, state: 'Invited', protectedExistence: false },
  });
  assertAllowed(decision, false);

  const email = normaliseInviteEmail(input.email);
  const days = normaliseInviteDays(input.expiresInDays);
  const invitationId = newId('invite');
  const now = deps.clock.now();
  const expiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  await withTransaction(deps.pool, async (client) => {
    const linked = await client.query(
      `SELECT 1 FROM identity_org.external_identities WHERE user_account_id = $1`,
      [input.userAccountId],
    );
    if (linked.rowCount !== 0) {
      throw new PlatformError(
        'RESOURCE_CONFLICT',
        'That account already belongs to somebody who can sign in. Take their roles back instead.',
      );
    }
    try {
      await client.query(
        `INSERT INTO identity_org.account_invitations
           (id, user_account_id, issuer, invited_email, expires_at, invited_by)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [invitationId, input.userAccountId, GOOGLE_ISSUER, email, expiresAt, actorId],
      );
    } catch (error) {
      if (typeof error === 'object' && error !== null && (error as { code?: string }).code === '23505') {
        throw new PlatformError(
          'RESOURCE_CONFLICT',
          'That address already has an invitation waiting. Revoke it before sending another.',
        );
      }
      throw error;
    }
    await recordAuditEvent(client, ctx, {
      action: 'user.invite',
      targetType: 'UserAccount',
      targetId: input.userAccountId,
      result: 'Succeeded',
      policyDecision: decision.outcome,
      policyVersion: decision.policyVersion,
      source: 'm01.inviteExistingAccount',
      occurredAt: now,
    });
  });
  return { invitationId, expiresAt, invitedEmail: email };
}

/**
 * A participant inviting somebody into their own circle — the daughter who
 * should be able to read a life story, the neighbour who helps with
 * messages.
 *
 * The relationship is carried by the invitation and created when it is
 * claimed, so the person being invited does not need an account first.
 * That is the whole difference from `proposeRelationship`, which requires
 * an actor identifier the participant would have no way to know.
 *
 * Scoped to named actions, and revocable from "who has access to me" the
 * moment it looks wrong.
 */
export async function inviteSupporter(
  deps: M01Deps,
  ctx: RequestContext,
  input: {
    participantId: string;
    email: string;
    relationshipType: string;
    permittedActions: readonly string[];
    expiresInDays?: number;
  },
): Promise<{ invitationId: string; expiresAt: Date; invitedEmail: string }> {
  const actorId = requireActor(ctx);
  /*
   * `relationship.approve`, not `relationship.propose`.
   *
   * Proposing belongs to coordinators in this platform's model — the
   * Participant role is granted approve and revoke, and deliberately not
   * propose, because the participant is the one who says yes to access
   * rather than the one who arranges it. A participant inviting their own
   * daughter is not arranging somebody else's access; it is approving, in
   * advance, a relationship that will exist the moment she joins. Granting
   * participants `propose` instead would have widened the existing
   * propose-a-relationship route for every participant at the same time,
   * which is a policy change nobody asked for.
   *
   * It is owner-only, so the ENGINE enforces that this is the caller's own
   * circle, against the actor→participant mapping it resolves itself.
   */
  const decision = await deps.checkPermission(ctx, {
    action: 'relationship.approve',
    resource: {
      type: 'Relationship',
      id: 'new',
      state: 'Draft',
      protectedExistence: false,
      ownerParticipantId: input.participantId,
    },
    confirmed: true,
  });
  assertAllowed(decision, true);

  // Belt and braces on top of the engine's owner-only check, because the
  // owner identifier above is supplied by this function: if a caller could
  // ever reach here with somebody else's participant id, this is what
  // still refuses.
  const owns = await deps.pool.query(
    `SELECT 1 FROM participant_profile.participants
      WHERE id = $1 AND user_account_id = $2`,
    [input.participantId, actorId],
  );
  if (owns.rowCount === 0) {
    throw new PlatformError('AUTHORISATION_DENIED', 'You may only invite somebody into your own circle');
  }
  if (input.permittedActions.length === 0) {
    throw new PlatformError('VALIDATION_ERROR', 'Choose at least one thing this person may do');
  }

  const email = normaliseInviteEmail(input.email);
  const days = normaliseInviteDays(input.expiresInDays);
  const invitationId = newId('invite');
  const now = deps.clock.now();
  const expiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  await withTransaction(deps.pool, async (client) => {
    try {
      await client.query(
        `INSERT INTO identity_org.account_invitations
           (id, issuer, invited_email, expires_at, invited_by,
            relationship_participant_id, relationship_type, relationship_permitted_actions)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          invitationId,
          GOOGLE_ISSUER,
          email,
          expiresAt,
          actorId,
          input.participantId,
          input.relationshipType,
          [...input.permittedActions],
        ],
      );
    } catch (error) {
      if (typeof error === 'object' && error !== null && (error as { code?: string }).code === '23505') {
        throw new PlatformError(
          'RESOURCE_CONFLICT',
          'That address already has an invitation waiting. Withdraw it before sending another.',
        );
      }
      throw error;
    }
    await recordAuditEvent(client, ctx, {
      action: 'relationship.approve',
      targetType: 'AccountInvitation',
      targetId: invitationId,
      participantId: input.participantId,
      result: 'Succeeded',
      policyDecision: decision.outcome,
      policyVersion: decision.policyVersion,
      source: 'm01.inviteSupporter',
      occurredAt: now,
    });
  });
  return { invitationId, expiresAt, invitedEmail: email };
}

/** What a participant sees under "who I have invited". */
export interface SupporterInvitationView {
  invitationId: string;
  invitedEmail: string;
  relationshipType: string | null;
  permittedActions: string[];
  expiresAt: string;
  createdAt: string;
}

export async function listSupporterInvitations(
  deps: M01Deps,
  ctx: RequestContext,
  input: { participantId: string },
): Promise<SupporterInvitationView[]> {
  const actorId = requireActor(ctx);
  const owns = await deps.pool.query(
    `SELECT 1 FROM participant_profile.participants WHERE id = $1 AND user_account_id = $2`,
    [input.participantId, actorId],
  );
  if (owns.rowCount === 0) {
    throw new PlatformError('AUTHORISATION_DENIED', 'You may only see invitations you sent');
  }
  const res = await deps.pool.query(
    `SELECT id, invited_email, relationship_type, relationship_permitted_actions, expires_at, created_at
       FROM identity_org.account_invitations
      WHERE relationship_participant_id = $1 AND invitation_state = 'Pending' AND expires_at > now()
      ORDER BY created_at DESC`,
    [input.participantId],
  );
  return res.rows.map((r: Record<string, unknown>) => ({
    invitationId: r['id'] as string,
    invitedEmail: r['invited_email'] as string,
    relationshipType: (r['relationship_type'] as string | null) ?? null,
    permittedActions: (r['relationship_permitted_actions'] as string[] | null) ?? [],
    expiresAt: (r['expires_at'] as Date).toISOString(),
    createdAt: (r['created_at'] as Date).toISOString(),
  }));
}

/**
 * Withdrawing one a participant sent.
 *
 * `relationship.revoke`, matching the action that removes access once it
 * exists — withdrawing an invitation is removing access before it starts,
 * and it is the same decision by the same person. Owner-only, so the
 * engine decides whose circle this is.
 *
 * Audited, because it changes who can reach somebody's information and
 * "when did that stop" is a question the audit trail has to be able to
 * answer. It recorded nothing at first, and the repository's own guard
 * test — which enumerates commands that change something and write no
 * audit entry — caught it.
 */
export async function withdrawSupporterInvitation(
  deps: M01Deps,
  ctx: RequestContext,
  input: { participantId: string; invitationId: string; confirmed: boolean },
): Promise<void> {
  const actorId = requireActor(ctx);
  const decision = await deps.checkPermission(ctx, {
    action: 'relationship.revoke',
    resource: {
      type: 'Relationship',
      id: input.invitationId,
      state: 'Proposed',
      protectedExistence: false,
      ownerParticipantId: input.participantId,
    },
    confirmed: input.confirmed,
  });
  assertAllowed(decision, input.confirmed);

  const now = deps.clock.now();
  await withTransaction(deps.pool, async (client) => {
    const result = await client.query(
      `UPDATE identity_org.account_invitations i
          SET invitation_state = 'Revoked', record_version = i.record_version + 1, updated_at = now()
         FROM participant_profile.participants p
        WHERE i.id = $1
          AND i.relationship_participant_id = p.id
          AND p.id = $2
          AND p.user_account_id = $3
          AND i.invitation_state = 'Pending'`,
      [input.invitationId, input.participantId, actorId],
    );
    if (result.rowCount === 0) {
      throw new PlatformError(
        'INVALID_STATE_TRANSITION',
        'That invitation is no longer waiting. If it was accepted, remove their access under who has access to me.',
      );
    }
    await recordAuditEvent(client, ctx, {
      action: 'relationship.revoke',
      targetType: 'AccountInvitation',
      targetId: input.invitationId,
      participantId: input.participantId,
      result: 'Succeeded',
      policyDecision: decision.outcome,
      policyVersion: decision.policyVersion,
      source: 'm01.withdrawSupporterInvitation',
      occurredAt: now,
    });
  });
}

/**
 * Not a validator so much as a refusal to record something that can never
 * be claimed: the claim matches on the token's verified email, so an
 * address with no `@` is an invitation whose only possible future is to
 * expire.
 */
function normaliseInviteEmail(raw: string): string {
  const email = raw.trim().toLowerCase();
  if (email === '' || !email.includes('@') || email.startsWith('@') || email.endsWith('@')) {
    throw new PlatformError('VALIDATION_ERROR', 'A valid email address is required to invite somebody');
  }
  return email;
}

function normaliseInviteDays(raw: number | undefined): number {
  const days = raw ?? 14;
  if (!Number.isInteger(days) || days < 1 || days > 90) {
    throw new PlatformError('VALIDATION_ERROR', 'An invitation may last between 1 and 90 days');
  }
  return days;
}

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
