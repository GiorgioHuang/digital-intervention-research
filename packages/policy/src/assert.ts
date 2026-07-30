import { PlatformError } from '@platform/kernel';
import type { PolicyDecisionResult } from './types.js';

/**
 * Shared decision-to-error mapping used by every module command handler:
 * converts non-allow outcomes into the stable Doc 15 error codes.
 */
export function assertAllowed(decision: PolicyDecisionResult, confirmed = false): void {
  switch (decision.outcome) {
    case 'Allow':
    case 'AllowWithFieldRestrictions':
      return;
    case 'AllowWithConfirmation':
      if (confirmed) return;
      throw new PlatformError('CONFIRMATION_REQUIRED', 'This action requires explicit confirmation');
    case 'AllowWithHumanReview':
      throw new PlatformError('HUMAN_REVIEW_REQUIRED', 'This action requires human review');
    case 'StepUpAuthenticationRequired':
      throw new PlatformError('STEP_UP_AUTHENTICATION_REQUIRED', 'Stronger authentication required');
    case 'ReConsentRequired':
      throw new PlatformError('CONSENT_EXPIRED', 'Re-consent is required');
    case 'RelationshipVerificationRequired':
      throw new PlatformError('RELATIONSHIP_REQUIRED', 'Relationship verification required');
    case 'DenyAndHideExistence':
      throw new PlatformError('RESOURCE_NOT_FOUND', 'Resource not found');
    default:
      throw new PlatformError('AUTHORISATION_DENIED', `Not permitted (${decision.reason})`);
  }
}
