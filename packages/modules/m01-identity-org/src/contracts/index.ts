import type { Role, RoleAssignmentInput } from '@platform/policy';

/** Public read contracts of M01 — the only surface other modules may use. */

export interface UserAccountView {
  id: string;
  displayName: string;
  accountState: 'Invited' | 'Active' | 'Restricted' | 'Suspended' | 'Closed';
}

export interface RoleAssignmentView extends RoleAssignmentInput {
  id: string;
  userAccountId: string;
}

/** Query port consumed by M03's permission service (implemented by M01). */
export interface RoleAssignmentQueryPort {
  findRoleAssignments(userAccountId: string): Promise<RoleAssignmentView[]>;
}

/**
 * Account display names, in batches. Needed wherever a screen would
 * otherwise print an account identifier at a person — "who has access to
 * me" being the case that made it necessary, since an opaque identifier
 * there tells the participant nothing about who they are deciding about.
 */
export interface AccountNameQueryPort {
  findDisplayNames(userAccountIds: string[]): Promise<Map<string, string>>;
}

export const M01_EVENTS = {
  UserAccountCreated: 'UserAccountCreated',
  OrganisationCreated: 'OrganisationCreated',
  OrganisationMembershipAdded: 'OrganisationMembershipAdded',
  RoleAssigned: 'RoleAssigned',
  RoleRevoked: 'RoleRevoked',
} as const;

export type { Role };
