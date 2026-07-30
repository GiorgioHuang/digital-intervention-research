/**
 * Effective Permission model (Doc 4, ADR-017):
 *   Role + Relationship + Consent + Purpose + Context + SpecificPermission + ResourceState
 * plus Visibility, Block, DataClassification and action risk where relevant.
 * The engine is a pure deterministic function — no IO, no LLM (Doc 13 §12.9).
 */

/** Doc 4 permission decision outcomes. */
export type PermissionOutcome =
  | 'Allow'
  | 'AllowWithFieldRestrictions'
  | 'AllowWithConfirmation'
  | 'AllowWithHumanReview'
  | 'AllowTemporarily'
  | 'Deny'
  | 'DenyAndHideExistence'
  | 'ReConsentRequired'
  | 'RelationshipVerificationRequired'
  | 'StepUpAuthenticationRequired'
  | 'SafetyReviewRequired';

export type AuthStrength = 'password' | 'mfa' | 'step-up';

/** Canonical MVP roles (Doc 4; optional roles included for completeness). */
export type Role =
  | 'Participant'
  | 'Supporter'
  | 'InformalCaregiver'
  | 'ProfessionalCaregiver'
  | 'ResearchCoordinator'
  | 'Researcher'
  | 'DataAnalyst'
  | 'ResearchApprover'
  | 'EvidenceReviewer'
  | 'SafetyReviewer'
  | 'PrivacyReviewer'
  | 'OrganisationAdministrator'
  | 'SystemAdministrator';

export interface RoleAssignmentInput {
  role: Role;
  state: 'Proposed' | 'PendingApproval' | 'Active' | 'Suspended' | 'Expired' | 'Revoked' | 'Rejected';
  organisationId?: string;
  researchProjectId?: string;
  expiresAt?: Date;
}

export interface RelationshipInput {
  state:
    | 'Proposed'
    | 'PendingVerification'
    | 'Active'
    | 'Restricted'
    | 'Suspended'
    | 'Expired'
    | 'Revoked'
    | 'Rejected';
  /** Participant who granted the relationship (direction: participant -> actor). */
  participantId: string;
  /** Dotted actions this relationship's permission scope covers. */
  permittedActions: readonly string[];
  expiresAt?: Date;
}

export type ConsentDecisionState =
  | 'Granted'
  | 'Declined'
  | 'Restricted'
  | 'Deferred'
  | 'Withdrawn'
  | 'Expired'
  | 'Superseded'
  | 'ReConsentRequired';

export interface ConsentScopeState {
  scope: string;
  decision: ConsentDecisionState;
  expiresAt?: Date;
  restrictions?: readonly string[];
}

export interface ResourceInput {
  type: string;
  id: string;
  /** Canonical resource state (Draft, In Review, Approved, Active, Locked, Withdrawn, ...). */
  state: string;
  /** Participant who owns the data, where applicable. */
  ownerParticipantId?: string;
  organisationId?: string;
  researchProjectId?: string;
  /** ADR-050: deny must not reveal that this resource exists. */
  protectedExistence: boolean;
  dataClassification?: string;
}

export interface BlockInput {
  blockerActorId: string;
  blockedActorId: string;
  state: 'Active' | 'Revoked';
}

export interface ActorInput {
  id: string;
  type: 'user' | 'service-account' | 'system';
  authenticated: boolean;
  authStrength?: AuthStrength;
  /** Participant identity this account acts as, where one exists (M02 mapping). */
  participantId?: string;
}

/** Per-action requirements — versioned policy data, not code. */
export interface ActionRequirement {
  /** Consent scopes that must all be currently Granted (evaluated at use time). */
  consentScopes?: readonly string[];
  /** Action requires an authorising Relationship from the resource-owning Participant. */
  requiresRelationship?: boolean;
  /** Purposes compatible with this action; undefined = any declared purpose. */
  allowedPurposes?: readonly string[];
  /** Purpose must be declared at all. */
  requiresPurpose?: boolean;
  /** Resource states in which the action is permitted; undefined = any. */
  allowedResourceStates?: readonly string[];
  /** Minimum authentication strength (Doc 14 §12 step-up list). */
  minimumAuthStrength?: AuthStrength;
  /** High-impact action needs explicit confirmation (Allow with Confirmation). */
  confirmationRequired?: boolean;
  /** Needs human review before effect. */
  humanReviewRequired?: boolean;
  /** Block-sensitive interaction between two actors (fails closed on Block). */
  interaction?: boolean;
  /** The resource owner (Participant acting on own data) is allowed without role grant. */
  ownerPermitted?: boolean;
  /**
   * Only the resource-owning Participant may perform this action, regardless
   * of role grants (self-service actions: own consent, own profile, own
   * relationship approval). Prevents cross-Participant access via role.
   */
  ownerOnly?: boolean;
}

export interface PolicyConfiguration {
  policyVersion: string;
  /** Role -> dotted specific permissions granted (Doc 4 catalogue). */
  rolePermissions: Readonly<Record<string, readonly string[]>>;
  /** Dotted action -> requirements. Actions absent from this map are denied. */
  actionRequirements: Readonly<Record<string, ActionRequirement>>;
}

export interface EvaluationInput {
  actor: ActorInput;
  /** Dotted specific permission being exercised, e.g. 'consent.withdraw'. */
  action: string;
  resource: ResourceInput;
  roleAssignments: readonly RoleAssignmentInput[];
  relationships: readonly RelationshipInput[];
  /** Current consent state of the resource-owning Participant for relevant scopes. */
  consents: readonly ConsentScopeState[];
  purposeCode?: string;
  context: { organisationId?: string; researchProjectId?: string };
  blocks: readonly BlockInput[];
  /** Explicit deny rules that apply to this request (already resolved). */
  explicitDenies: readonly string[];
  now: Date;
}

export interface EvaluationTraceEntry {
  step: string;
  note: string;
}

export interface PolicyDecisionResult {
  outcome: PermissionOutcome;
  policyVersion: string;
  /** Machine-readable primary reason (stable vocabulary for audit + errors). */
  reason: string;
  /** Field restrictions to apply when outcome is AllowWithFieldRestrictions. */
  fieldRestrictions: readonly string[];
  /** Explainability trail (Doc 4: decisions must be explainable). */
  trace: readonly EvaluationTraceEntry[];
}
