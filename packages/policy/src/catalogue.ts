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
      'participant.register',
      'enrolment.invite',
      'screening.start',
      'eligibility.decide',
      'enrolment.enrol',
      'enrolment.activate',
      'enrolment.withdraw',
    ],
    Researcher: [
      'project.view',
      'project.create',
      'question.create',
      'participant.view-assigned',
      'protocol.draft',
      'protocol.submit',
      'intervention.draft',
      'intervention.submit',
      'evidence.search',
      'evidence.reference',
      'evidence-review.create',
      'evidence-review.submit',
      'evidence-decision.draft',
      'evidence-snapshot.create',
    ],
    ResearchApprover: [
      'protocol.review', 'protocol.approve', 'protocol.activate',
      'project.approve', 'project.activate',
      'intervention.approve', 'intervention.activate',
    ],
    EvidenceReviewer: ['evidence-review.approve', 'evidence-decision.draft', 'evidence-decision.approve'],
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
      'enrolment.withdraw',
      'life-story.create',
      'life-story.edit',
      'life-story.confirm-testimony',
      'life-story.change-visibility',
      'life-story.review-contribution',
      'life-story.withdraw',
      'life-story.export',
    ],
    Supporter: ['participant.view-shared', 'life-story.contribute'],
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
    'project.create': {},
    'project.approve': { confirmationRequired: true, minimumAuthStrength: 'mfa' },
    'project.activate': { confirmationRequired: true },
    'question.create': {},
    'protocol.draft': {},
    'protocol.submit': {},
    'protocol.activate': { confirmationRequired: true },
    'intervention.draft': {},
    'intervention.submit': {},
    'intervention.approve': { confirmationRequired: true, minimumAuthStrength: 'mfa' },
    'intervention.activate': { confirmationRequired: true },
    'evidence.search': {},
    'evidence.reference': {},
    'evidence-review.create': {},
    'evidence-review.submit': {},
    'evidence-review.approve': { confirmationRequired: true },
    'evidence-decision.draft': {},
    'evidence-decision.approve': { confirmationRequired: true },
    'evidence-snapshot.create': {},
    'participant.register': {},
    'enrolment.invite': {},
    'screening.start': {},
    'eligibility.decide': { confirmationRequired: true },
    'enrolment.enrol': { consentScopes: ['study-participation'] },
    'enrolment.activate': {},
    'enrolment.withdraw': { ownerPermitted: true, confirmationRequired: true },
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

    'life-story.create': { ownerPermitted: true, ownerOnly: true },
    'life-story.edit': { ownerPermitted: true, ownerOnly: true },
    'life-story.confirm-testimony': { ownerPermitted: true, ownerOnly: true, confirmationRequired: true },
    'life-story.change-visibility': { ownerPermitted: true, ownerOnly: true, confirmationRequired: true },
    'life-story.review-contribution': { ownerPermitted: true, ownerOnly: true },
    'life-story.withdraw': { ownerPermitted: true, ownerOnly: true, confirmationRequired: true },
    'life-story.export': { ownerPermitted: true, ownerOnly: true, confirmationRequired: true },
    'life-story.contribute': { requiresRelationship: true, consentScopes: ['supporter-contribution'] },

    'safety-signal.record': {},
    'safety-event.create': { minimumAuthStrength: 'mfa', confirmationRequired: true },
    'safety-event.review': {},
  },
};
