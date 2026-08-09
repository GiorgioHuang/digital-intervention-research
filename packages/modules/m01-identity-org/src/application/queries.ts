import { PlatformError, type RequestContext } from '@platform/kernel';
import { assertAllowed } from '@platform/policy';
import type { M01Deps } from './commands.js';

export interface RoleAssignmentView {
  roleAssignmentId: string;
  role: string;
  organisationId: string | null;
  researchProjectId: string | null;
  assignmentState: string;
  expiresAt: string | null;
  assignedByActorId: string;
  revokedAt: string | null;
  revokedByActorId: string | null;
  /** Required by revoke, which is optimistically concurrent. */
  recordVersion: number;
  createdAt: string;
}

export interface AccountView {
  userAccountId: string;
  displayName: string;
  /**
   * Returned verbatim. Nothing in the platform writes this column, so
   * every account carries the default and 'Active' means "no code has
   * ever set this" rather than "somebody checked". The screen has to say
   * so, because an account state that always reads Active is worse than
   * none: it answers a question nobody actually asked the platform.
   */
  accountState: string;
  actorType: string;
  roles: RoleAssignmentView[];
}

/**
 * Who holds what in this organisation.
 *
 * `revokeRole` has existed since M01 was written — with its permission
 * check, its optimistic version guard, its domain event and its audit
 * entry — and no route and no screen. `user.view` was granted to the
 * organisation administrator and the coordinator and checked by no code
 * at all. Nothing listed accounts or their roles.
 *
 * So access on this platform could be given and never taken back. A
 * coordinator who left the study, a researcher whose involvement ended,
 * an account that should have been shut down — none of it could be
 * touched from any screen, and the only thing standing between a former
 * colleague and a participant's records was that nobody had thought to
 * check.
 *
 * Scoped to the caller's organisation from the request context, never
 * from an argument: a listing that takes an organisation identifier is a
 * way of asking which organisations exist.
 */
export async function listOrganisationAccounts(deps: M01Deps, ctx: RequestContext): Promise<AccountView[]> {
  const decision = await deps.checkPermission(ctx, {
    action: 'user.view',
    resource: { type: 'UserAccount', id: 'all', state: 'Active', protectedExistence: false },
  });
  assertAllowed(decision, false);
  const organisationId = ctx.organisationId;
  if (organisationId === undefined) {
    throw new PlatformError('ORGANISATION_CONTEXT_REQUIRED', 'An organisation context is required to list accounts');
  }

  // Belonging to an organisation is membership OR a role scoped to it.
  //
  // This used to be roles alone, on the stated grounds that "there is no
  // membership table" — and there is: `organisation_memberships`, written
  // by every account this platform creates. Reading only roles meant an
  // account with a membership and no role was invisible here, which was
  // harmless while accounts arrived with their roles already attached and
  // stopped being harmless the moment people could be invited: somebody
  // who claimed an invitation had a membership, no role, and therefore no
  // row on the one screen that can give them a role. They were on the
  // platform and unreachable by the person meant to be administering them.
  //
  // Still scoped: both halves are conditioned on this organisation, so
  // this lists nobody the caller lacks standing over.
  const res = await deps.pool.query(
    `SELECT DISTINCT a.id, a.display_name, a.account_state, a.actor_type
       FROM identity_org.user_accounts a
       LEFT JOIN identity_org.role_assignments r
              ON r.user_account_id = a.id AND r.organisation_id = $1
       LEFT JOIN identity_org.organisation_memberships m
              ON m.user_account_id = a.id AND m.organisation_id = $1
      WHERE r.id IS NOT NULL OR m.id IS NOT NULL
      ORDER BY a.display_name ASC`,
    [organisationId],
  );
  const roles = await deps.pool.query(
    `SELECT id, user_account_id, role, organisation_id, research_project_id, assignment_state,
            expires_at, assigned_by_actor_id, revoked_at, revoked_by_actor_id, record_version, created_at
       FROM identity_org.role_assignments
      WHERE organisation_id = $1
      ORDER BY created_at ASC`,
    [organisationId],
  );
  const byAccount = new Map<string, RoleAssignmentView[]>();
  for (const r of roles.rows) {
    const list = byAccount.get(r.user_account_id as string) ?? [];
    list.push({
      roleAssignmentId: r.id as string,
      role: r.role as string,
      organisationId: (r.organisation_id as string | null) ?? null,
      researchProjectId: (r.research_project_id as string | null) ?? null,
      assignmentState: r.assignment_state as string,
      expiresAt: r.expires_at === null ? null : (r.expires_at as Date).toISOString(),
      assignedByActorId: r.assigned_by_actor_id as string,
      revokedAt: r.revoked_at === null ? null : (r.revoked_at as Date).toISOString(),
      revokedByActorId: (r.revoked_by_actor_id as string | null) ?? null,
      recordVersion: r.record_version as number,
      createdAt: (r.created_at as Date).toISOString(),
    });
    byAccount.set(r.user_account_id as string, list);
  }
  return res.rows.map((a) => ({
    userAccountId: a.id as string,
    displayName: a.display_name as string,
    accountState: a.account_state as string,
    actorType: a.actor_type as string,
    roles: byAccount.get(a.id as string) ?? [],
  }));
}

export interface PendingInvitationView {
  invitationId: string;
  userAccountId: string | null;
  displayName: string | null;
  invitedEmail: string;
  expiresAt: string;
  invitedBy: string | null;
  createdAt: string;
}

/**
 * Invitations still waiting to be claimed.
 *
 * Needed as its own listing rather than a column on the accounts screen,
 * because an invited account holds no role yet and the accounts listing
 * derives membership FROM roles — so an invited colleague is invisible
 * there until the moment they no longer need chasing. An administrator
 * who cannot see what is outstanding re-sends invitations that already
 * exist, and the partial unique index then refuses them, which reads as
 * the platform being broken.
 *
 * Scoped by organisation through the account's role/membership, and
 * invitations that belong to no organisation are visible to the
 * platform-wide administrator only.
 */
export async function listPendingInvitations(
  deps: M01Deps,
  ctx: RequestContext,
): Promise<PendingInvitationView[]> {
  const decision = await deps.checkPermission(ctx, {
    action: 'user.view',
    resource: { type: 'UserAccount', id: 'all', state: 'Invited', protectedExistence: false },
  });
  assertAllowed(decision, false);
  const organisationId = ctx.organisationId;
  if (organisationId === undefined) {
    throw new PlatformError(
      'ORGANISATION_CONTEXT_REQUIRED',
      'An organisation context is required to list invitations',
    );
  }
  const res = await deps.pool.query(
    `SELECT i.id, i.user_account_id, a.display_name, i.invited_email,
            i.expires_at, i.invited_by, i.created_at
       FROM identity_org.account_invitations i
       LEFT JOIN identity_org.user_accounts a ON a.id = i.user_account_id
       JOIN identity_org.organisation_memberships m ON m.user_account_id = i.user_account_id
      WHERE i.invitation_state = 'Pending'
        AND i.expires_at > now()
        AND m.organisation_id = $1
      ORDER BY i.created_at DESC`,
    [organisationId],
  );
  return res.rows.map((r: Record<string, unknown>) => ({
    invitationId: r['id'] as string,
    userAccountId: (r['user_account_id'] as string | null) ?? null,
    displayName: (r['display_name'] as string | null) ?? null,
    invitedEmail: r['invited_email'] as string,
    expiresAt: (r['expires_at'] as Date).toISOString(),
    invitedBy: (r['invited_by'] as string | null) ?? null,
    createdAt: (r['created_at'] as Date).toISOString(),
  }));
}
