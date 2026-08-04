import type { Pool, PoolClient } from '@platform/database';
import type { AccountNameQueryPort, RoleAssignmentQueryPort, RoleAssignmentView } from '../contracts/index.js';

export async function insertUserAccount(
  client: PoolClient,
  row: { id: string; displayName: string; actorType?: 'user' | 'service-account' },
): Promise<void> {
  await client.query(
    `INSERT INTO identity_org.user_accounts (id, display_name, actor_type) VALUES ($1, $2, $3)`,
    [row.id, row.displayName, row.actorType ?? 'user'],
  );
}

export async function insertOrganisation(client: PoolClient, row: { id: string; name: string }): Promise<void> {
  await client.query(`INSERT INTO identity_org.organisations (id, name) VALUES ($1, $2)`, [row.id, row.name]);
}

export async function insertMembership(
  client: PoolClient,
  row: { id: string; organisationId: string; userAccountId: string },
): Promise<void> {
  await client.query(
    `INSERT INTO identity_org.organisation_memberships (id, organisation_id, user_account_id)
     VALUES ($1, $2, $3)`,
    [row.id, row.organisationId, row.userAccountId],
  );
}

export async function insertRoleAssignment(
  client: PoolClient,
  row: {
    id: string;
    userAccountId: string;
    role: string;
    organisationId?: string;
    researchProjectId?: string;
    expiresAt?: Date;
    assignedByActorId: string;
  },
): Promise<void> {
  await client.query(
    `INSERT INTO identity_org.role_assignments
       (id, user_account_id, role, organisation_id, research_project_id, expires_at, assigned_by_actor_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      row.id,
      row.userAccountId,
      row.role,
      row.organisationId ?? null,
      row.researchProjectId ?? null,
      row.expiresAt ?? null,
      row.assignedByActorId,
    ],
  );
}

/** Optimistic-concurrency revoke: fails (returns false) on version mismatch. */
export async function revokeRoleAssignment(
  client: PoolClient,
  args: { id: string; expectedVersion: number; revokedByActorId: string; now: Date },
): Promise<boolean> {
  const res = await client.query(
    `UPDATE identity_org.role_assignments
        SET assignment_state = 'Revoked', revoked_at = $3, revoked_by_actor_id = $4,
            record_version = record_version + 1, updated_at = $3
      WHERE id = $1 AND record_version = $2 AND assignment_state = 'Active'`,
    [args.id, args.expectedVersion, args.now, args.revokedByActorId],
  );
  return res.rowCount === 1;
}

export async function findRoleAssignments(
  queryable: Pool | PoolClient,
  userAccountId: string,
): Promise<RoleAssignmentView[]> {
  const res = await queryable.query(
    `SELECT id, user_account_id, role, organisation_id, research_project_id, assignment_state, expires_at
       FROM identity_org.role_assignments
      WHERE user_account_id = $1`,
    [userAccountId],
  );
  return res.rows.map((r) => ({
    id: r.id,
    userAccountId: r.user_account_id,
    role: r.role,
    state: r.assignment_state,
    ...(r.organisation_id === null ? {} : { organisationId: r.organisation_id }),
    ...(r.research_project_id === null ? {} : { researchProjectId: r.research_project_id }),
    ...(r.expires_at === null ? {} : { expiresAt: r.expires_at }),
  }));
}

export function createRoleAssignmentQuery(pool: Pool): RoleAssignmentQueryPort {
  return {
    findRoleAssignments: (userAccountId) => findRoleAssignments(pool, userAccountId),
  };
}

export function createAccountNameQuery(pool: Pool): AccountNameQueryPort {
  return {
    async findDisplayNames(userAccountIds: string[]): Promise<Map<string, string>> {
      if (userAccountIds.length === 0) return new Map();
      const res = await pool.query(
        `SELECT id, display_name FROM identity_org.user_accounts WHERE id = ANY($1::text[])`,
        [[...new Set(userAccountIds)]],
      );
      return new Map(res.rows.map((r) => [r.id as string, r.display_name as string]));
    },
  };
}
