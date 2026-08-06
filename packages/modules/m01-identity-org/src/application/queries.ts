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

  // Accounts reachable from this organisation are those holding a role in
  // it. There is no membership table: a role assignment scoped to the
  // organisation is what "belongs to" means here, and inventing a wider
  // answer would list accounts the caller has no standing over.
  const res = await deps.pool.query(
    `SELECT DISTINCT a.id, a.display_name, a.account_state, a.actor_type
       FROM identity_org.user_accounts a
       JOIN identity_org.role_assignments r ON r.user_account_id = a.id
      WHERE r.organisation_id = $1
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
