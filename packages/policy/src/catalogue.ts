import type { PolicyConfiguration } from './types.js';

/**
 * Initial policy configuration (versioned data, not architecture): the
 * Doc 4 specific-permission catalogue subset needed for P2, with per-action
 * requirements. Undecided values stay config-driven and fail closed
 * (Master Prompt open-ADR rule 5). Actions absent here are denied.
 */
export const POLICY_V1: PolicyConfiguration = {
  policyVersion: 'policy_v0.2.0',
  rolePermissions: {
    SystemAdministrator: [
      // Administration only: no content, approval or consent authority
      // (Doc 4). role.assign is needed to bootstrap the first
      // OrganisationAdministrator; every assignment is confirmed + audited.
      'organisation.create',
      'user.invite',
      'role.assign',
      'role.revoke',
      'system.configure',
      'audit.view',
    ],
    OrganisationAdministrator: [
      'user.view',
      'user.invite',
      'role.assign',
      'role.revoke',
      'audit.view',
    ],
    ResearchCoordinator: [
      'user.view',
      'participant.view-assigned',
      'relationship.propose',
    ],
    Researcher: [
      'project.view',
      'participant.view-assigned',
      'protocol.draft',
    ],
    ResearchApprover: ['protocol.review', 'protocol.approve'],
    SafetyReviewer: ['safety-signal.record', 'safety-event.create', 'safety-event.review'],
    Participant: [
      // Participant self-service actions are owner-permitted on own resources.
      'participant.view-own',
      'participant.update-own',
      'consent.record',
      'consent.withdraw',
      'relationship.approve',
      'relationship.revoke',
      'participant.export',
    ],
    Supporter: ['participant.view-shared'],
  },
  actionRequirements: {
    'organisation.create': {},
    'user.invite': {},
    'user.view': {},
    'role.assign': { confirmationRequired: true },
    'role.revoke': { confirmationRequired: true },
    'audit.view': {},
    'system.configure': { minimumAuthStrength: 'mfa' },

    'project.view': {},
    'protocol.draft': {},
    'protocol.review': {},
    'protocol.approve': { confirmationRequired: true, minimumAuthStrength: 'mfa' },

    'participant.view-own': { ownerPermitted: true, ownerOnly: true },
    'participant.update-own': { ownerPermitted: true, ownerOnly: true },
    // Researcher/coordinator access to assigned participant data requires
    // study-participation consent and a declared research purpose.
    'participant.view-assigned': {
      consentScopes: ['study-participation'],
      requiresPurpose: true,
      allowedPurposes: ['research-operations', 'intervention-delivery', 'safety-review'],
    },
    // Supporter access rides on an authorising Relationship AND sharing consent.
    'participant.view-shared': {
      requiresRelationship: true,
      consentScopes: ['supporter-involvement'],
    },
    'participant.export': { ownerPermitted: true, ownerOnly: true, confirmationRequired: true },

    'consent.record': { ownerPermitted: true, ownerOnly: true },
    'consent.withdraw': { ownerPermitted: true, ownerOnly: true, confirmationRequired: true },
    'relationship.propose': {},
    'relationship.approve': { ownerPermitted: true, ownerOnly: true, confirmationRequired: true },
    'relationship.revoke': { ownerPermitted: true, ownerOnly: true },

    'safety-signal.record': {},
    'safety-event.create': { minimumAuthStrength: 'mfa', confirmationRequired: true },
    'safety-event.review': {},
  },
};
