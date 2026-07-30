import type {
  AuthStrength,
  EvaluationInput,
  EvaluationTraceEntry,
  PolicyConfiguration,
  PolicyDecisionResult,
  PermissionOutcome,
  RoleAssignmentInput,
} from './types.js';

const AUTH_RANK: Record<AuthStrength, number> = { password: 1, mfa: 2, 'step-up': 3 };

/**
 * Deterministic Effective Permission evaluation implementing the Doc 4
 * twelve-step sequence with deny-by-default and the canonical conflict
 * order (explicit deny wins; unresolved -> deny). Pure function: same
 * input, same output, fully explainable via the trace.
 */
export function evaluatePermission(
  config: PolicyConfiguration,
  input: EvaluationInput,
): PolicyDecisionResult {
  const trace: EvaluationTraceEntry[] = [];
  const t = (step: string, note: string) => trace.push({ step, note });

  const deny = (reason: string): PolicyDecisionResult =>
    finalise(
      input.resource.protectedExistence ? 'DenyAndHideExistence' : 'Deny',
      reason,
      [],
    );
  const finalise = (
    outcome: PermissionOutcome,
    reason: string,
    fieldRestrictions: readonly string[],
  ): PolicyDecisionResult => {
    t('12-record-decision', `${outcome}: ${reason}`);
    return { outcome, policyVersion: config.policyVersion, reason, fieldRestrictions, trace };
  };

  // Step 1 — authenticate actor.
  if (!input.actor.authenticated) {
    t('1-authenticate', 'actor not authenticated');
    return deny('actor-not-authenticated');
  }
  t('1-authenticate', `actor ${input.actor.type} authenticated`);

  // Step 10 (evaluated early because explicit deny overrides everything,
  // Doc 4 conflict rule 1; recorded in sequence position for the trace).
  if (input.explicitDenies.length > 0) {
    t('10-explicit-deny', `explicit deny applies: ${input.explicitDenies.join(', ')}`);
    return deny('explicit-deny');
  }

  // Block check: interactions between blocked actors fail closed (ATR-016).
  const requirement = config.actionRequirements[input.action];
  if (requirement === undefined) {
    t('8-specific-permission', `action '${input.action}' is not in the permission catalogue`);
    return deny('unknown-action');
  }
  if (requirement.interaction && input.resource.ownerParticipantId !== undefined) {
    const blocked = input.blocks.some(
      (b) =>
        b.state === 'Active' &&
        ((b.blockerActorId === input.resource.ownerParticipantId && b.blockedActorId === input.actor.id) ||
          (b.blockerActorId === input.actor.id && b.blockedActorId === input.resource.ownerParticipantId)),
    );
    if (blocked) {
      t('10-block', 'active Block between actor and resource owner');
      return deny('blocked-interaction');
    }
  }

  // Steps 2–3 — resolve active roles and scope; owner access path.
  const actorIsResourceOwner =
    input.resource.ownerParticipantId !== undefined &&
    input.resource.ownerParticipantId === input.actor.id;
  if (requirement.ownerOnly === true && !actorIsResourceOwner) {
    t('2-role', 'owner-only action attempted by a non-owner');
    return deny('not-resource-owner');
  }
  const isOwner = requirement.ownerPermitted === true && actorIsResourceOwner;

  const activeRoles = input.roleAssignments.filter((ra) => roleIsUsable(ra, input));
  const grantingRoles = activeRoles.filter((ra) =>
    (config.rolePermissions[ra.role] ?? []).includes(input.action),
  );
  if (isOwner) {
    t('2-role', 'actor is the resource-owning Participant (owner-permitted action)');
  } else if (grantingRoles.length > 0) {
    t('2-role', `granted by role(s): ${grantingRoles.map((r) => r.role).join(', ')}`);
  } else {
    t('2-role', 'no active, in-scope role grants this specific permission');
    return deny('no-granting-role');
  }

  // Step 4 — relationship.
  let relationshipPending = false;
  if (requirement.requiresRelationship && !isOwner) {
    const owner = input.resource.ownerParticipantId;
    const candidates = input.relationships.filter(
      (r) =>
        r.participantId === owner &&
        r.permittedActions.includes(input.action) &&
        (r.expiresAt === undefined || r.expiresAt > input.now),
    );
    const active = candidates.filter((r) => r.state === 'Active');
    if (active.length === 0) {
      if (candidates.some((r) => r.state === 'PendingVerification')) {
        relationshipPending = true;
        t('4-relationship', 'relationship exists but is pending verification');
      } else {
        t('4-relationship', 'no active authorising relationship covers this action');
        return deny('relationship-required');
      }
    } else {
      t('4-relationship', 'active authorising relationship found');
    }
  }

  // Step 5 — consent (evaluated at use time; each necessary scope must hold).
  let reConsent = false;
  const restrictions: string[] = [];
  for (const scope of requirement.consentScopes ?? []) {
    const state = input.consents.find((c) => c.scope === scope);
    if (state === undefined) {
      t('5-consent', `consent scope '${scope}' missing`);
      return deny('consent-missing');
    }
    switch (state.decision) {
      case 'Granted':
        if (state.expiresAt !== undefined && state.expiresAt <= input.now) {
          reConsent = true;
          t('5-consent', `consent scope '${scope}' expired`);
        } else {
          t('5-consent', `consent scope '${scope}' granted`);
        }
        break;
      case 'Restricted':
        restrictions.push(...(state.restrictions ?? [`consent-restriction:${scope}`]));
        t('5-consent', `consent scope '${scope}' granted with restrictions`);
        break;
      case 'Expired':
      case 'ReConsentRequired':
        reConsent = true;
        t('5-consent', `consent scope '${scope}' requires re-consent`);
        break;
      case 'Withdrawn':
      case 'Declined':
      case 'Deferred':
      case 'Superseded':
        t('5-consent', `consent scope '${scope}' is ${state.decision}`);
        return deny(`consent-${state.decision.toLowerCase()}`);
    }
  }

  // Step 6 — purpose.
  if (requirement.requiresPurpose || requirement.allowedPurposes !== undefined) {
    if (input.purposeCode === undefined) {
      t('6-purpose', 'purpose required but not declared');
      return deny('purpose-required');
    }
    if (
      requirement.allowedPurposes !== undefined &&
      !requirement.allowedPurposes.includes(input.purposeCode)
    ) {
      t('6-purpose', `purpose '${input.purposeCode}' incompatible with action`);
      return deny('purpose-not-permitted');
    }
    t('6-purpose', `purpose '${input.purposeCode}' compatible`);
  }

  // Step 7 — context is enforced through role-scope matching (step 2/3);
  // record it for explainability.
  t(
    '7-context',
    `organisation=${input.context.organisationId ?? '-'} project=${input.context.researchProjectId ?? '-'}`,
  );

  // Step 9 — resource state gate.
  if (
    requirement.allowedResourceStates !== undefined &&
    !requirement.allowedResourceStates.includes(input.resource.state)
  ) {
    t('9-resource-state', `state '${input.resource.state}' blocks this action`);
    return deny('resource-state-blocked');
  }
  t('9-resource-state', `state '${input.resource.state}' permits this action`);

  // Ordered non-allow outcomes (fail closed before any allow variant).
  if (reConsent) return finalise('ReConsentRequired', 're-consent-required', []);
  if (relationshipPending) {
    return finalise('RelationshipVerificationRequired', 'relationship-verification-required', []);
  }
  if (requirement.minimumAuthStrength !== undefined) {
    const have = input.actor.authStrength === undefined ? 0 : AUTH_RANK[input.actor.authStrength];
    if (have < AUTH_RANK[requirement.minimumAuthStrength]) {
      t('1-authenticate', `auth strength below required '${requirement.minimumAuthStrength}'`);
      return finalise('StepUpAuthenticationRequired', 'step-up-required', []);
    }
  }
  if (requirement.humanReviewRequired) return finalise('AllowWithHumanReview', 'human-review-required', []);
  if (requirement.confirmationRequired) {
    return finalise('AllowWithConfirmation', 'confirmation-required', restrictions);
  }
  // Step 11 — field minimisation.
  if (restrictions.length > 0) {
    t('11-field-minimisation', `restrictions: ${restrictions.join(', ')}`);
    return finalise('AllowWithFieldRestrictions', 'allowed-with-restrictions', restrictions);
  }
  return finalise('Allow', 'allowed', []);
}

function roleIsUsable(ra: RoleAssignmentInput, input: EvaluationInput): boolean {
  if (ra.state !== 'Active') return false;
  if (ra.expiresAt !== undefined && ra.expiresAt <= input.now) return false;
  // Role scope must cover the resource/context (narrower scope wins by
  // construction: an org/project-scoped assignment only applies there).
  if (ra.organisationId !== undefined) {
    const target = input.resource.organisationId ?? input.context.organisationId;
    if (target !== ra.organisationId) return false;
  }
  if (ra.researchProjectId !== undefined) {
    const target = input.resource.researchProjectId ?? input.context.researchProjectId;
    if (target !== ra.researchProjectId) return false;
  }
  return true;
}
