import type { RequestContext } from '@platform/kernel';
import type { PolicyDecisionResult } from '@platform/policy';

export interface PermissionRequest {
  action: string;
  resource: {
    type: string;
    id: string;
    state: string;
    protectedExistence: boolean;
    ownerParticipantId?: string;
    organisationId?: string;
    researchProjectId?: string;
  };
  /** Explicit confirmation supplied for AllowWithConfirmation actions. */
  confirmed?: boolean;
}

/** The platform-wide permission evaluation service (owned by M03). */
export interface PermissionServicePort {
  evaluate(ctx: RequestContext, request: PermissionRequest): Promise<PolicyDecisionResult>;
}

export const M03_EVENTS = {
  RelationshipProposed: 'RelationshipProposed',
  RelationshipApproved: 'RelationshipApproved',
  RelationshipRevoked: 'RelationshipRevoked',
  ConsentRecorded: 'ConsentRecorded',
  ConsentWithdrawn: 'ConsentWithdrawn',
  PolicyDecisionRecorded: 'PolicyDecisionRecorded',
} as const;
