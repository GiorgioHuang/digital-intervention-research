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

export const M01_EVENTS = {
  UserAccountCreated: 'UserAccountCreated',
  OrganisationCreated: 'OrganisationCreated',
  OrganisationMembershipAdded: 'OrganisationMembershipAdded',
  RoleAssigned: 'RoleAssigned',
  RoleRevoked: 'RoleRevoked',
} as const;

export type { Role };
