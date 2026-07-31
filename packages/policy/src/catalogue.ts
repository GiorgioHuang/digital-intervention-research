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
      // Operational emergency access only — always MFA + confirmed, always
      // recorded, always retrospectively reviewed by a DIFFERENT role.
      'break-glass.execute',
    ],
    OrganisationAdministrator: [
      'user.view',
      'user.invite',
      'role.assign',
      'role.revoke',
      'audit.view',
      'community.create',
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
      'matching.generate',
      'session.record',
      'assessment.record',
      'enrolment.view',
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
      'dataset.define',
      'dataset.generate',
      'dataset.review',
      'analysis-plan.draft',
      'analysis.run',
      'interpretation.draft',
      'finding.draft',
      'approval.request',
      'report.create',
      'export.request',
      'export.generate',
      'export.record-delivery',
    ],
    ResearchApprover: [
      'protocol.review', 'protocol.approve', 'protocol.activate',
      'project.approve', 'project.activate',
      'intervention.approve', 'intervention.activate',
      'dataset.approve-definition', 'dataset.lock',
      'analysis-plan.approve', 'interpretation.approve', 'finding.approve',
      'approval.decide',
      'report.approve', 'export.approve',
      'approval-queue.view',
    ],
    EvidenceReviewer: ['evidence-review.approve', 'evidence-decision.draft', 'evidence-decision.approve'],
    SafetyReviewer: ['safety-signal.record', 'safety-signal.triage', 'safety-event.create', 'safety-event.review', 'triage-queue.view'],
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
      'block.create',
      'block.revoke',
      'report.submit',
      'community.join',
      'post.draft',
      'post.publish',
      'matching.activate',
      'match.decide',
      'connection.activate',
      'thread.create',
      'message.draft',
      'message.confirm-send',
      'object.upload',
      'object.assign',
    ],
    Supporter: ['participant.view-shared', 'life-story.contribute', 'report.submit'],
    Moderator: ['moderation.triage', 'moderation.decide'],
    // Governance reviewers (M15): holds and break-glass retrospective
    // review. Deliberately disjoint from break-glass execution so the
    // reviewer can never be the executor by role alone.
    PrivacyReviewer: ['governance-hold.place', 'governance-hold.lift', 'break-glass.review', 'audit.view', 'governance-queue.view'],
  },
  actionRequirements: {
    'organisation.create': {},
    'user.invite': {},
    'user.view': {},
    'role.assign': { confirmationRequired: true },
    'role.revoke': { confirmationRequired: true },
    'audit.view': {},
    'system.configure': { minimumAuthStrength: 'mfa' },

    // M15 governance (Doc 16 §38): approval decisions and break-glass
    // execution are the strongest authorities (human + confirmed + MFA);
    // separation of duties is additionally enforced in code and by DB CHECK.
    'approval.request': {},
    'approval.decide': { confirmationRequired: true, minimumAuthStrength: 'mfa' },
    'governance-hold.place': { confirmationRequired: true },
    'governance-hold.lift': { confirmationRequired: true },
    'break-glass.execute': { confirmationRequired: true, minimumAuthStrength: 'mfa' },
    'break-glass.review': { confirmationRequired: true },

    // M14 reporting/export (Doc 16 §37): exports cross the platform
    // boundary, so approval is the strongest authority tier.
    'report.create': {},
    'report.approve': { confirmationRequired: true },
    'export.request': {},
    'export.approve': { confirmationRequired: true, minimumAuthStrength: 'mfa' },
    'export.generate': {},
    'export.record-delivery': {},

    // Staff work-queue read actions: role-gated, no confirmation/MFA —
    // seeing a queue is not deciding it.
    'triage-queue.view': {},
    'approval-queue.view': {},
    'governance-queue.view': {},
    'enrolment.view': {},

    // Object storage (Doc 14 §59): uploads and assignment are owner-only
    // on the participant's own objects.
    'object.upload': { ownerPermitted: true, ownerOnly: true },
    'object.assign': { ownerPermitted: true, ownerOnly: true },

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
      interaction: true,
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
    'life-story.contribute': { requiresRelationship: true, consentScopes: ['supporter-contribution'], interaction: true },

    'matching.activate': { ownerPermitted: true, ownerOnly: true, consentScopes: ['open-matching'], confirmationRequired: true },
    'matching.generate': {},
    'match.decide': { ownerPermitted: true, ownerOnly: true, confirmationRequired: true },
    'connection.activate': { ownerPermitted: true, confirmationRequired: true },

    'thread.create': { ownerPermitted: true, ownerOnly: true, interaction: true },
    'message.draft': { ownerPermitted: true, ownerOnly: true },
    'message.confirm-send': { ownerPermitted: true, ownerOnly: true, confirmationRequired: true, interaction: true, consentScopes: ['participant-messaging'] },

    'block.create': { confirmationRequired: true },
    'block.revoke': { confirmationRequired: true },
    'report.submit': {},
    'moderation.triage': {},
    'moderation.decide': { confirmationRequired: true },
    'community.create': {},
    'community.join': { ownerPermitted: true, ownerOnly: true, consentScopes: ['community-participation'] },
    'post.draft': { ownerPermitted: true, ownerOnly: true },
    'post.publish': { ownerPermitted: true, ownerOnly: true, confirmationRequired: true },

    'session.record': {},
    'assessment.record': {},

    'dataset.define': {},
    'dataset.approve-definition': { confirmationRequired: true },
    'dataset.generate': {},
    'dataset.review': {},
    'dataset.lock': { confirmationRequired: true, minimumAuthStrength: 'mfa' },
    'analysis-plan.draft': {},
    'analysis-plan.approve': { confirmationRequired: true },
    'analysis.run': {},
    'interpretation.draft': {},
    'interpretation.approve': { confirmationRequired: true },
    'finding.draft': {},
    'finding.approve': { confirmationRequired: true, minimumAuthStrength: 'mfa' },

    'safety-signal.record': {},
    'safety-signal.triage': { confirmationRequired: true },
    'safety-event.create': { minimumAuthStrength: 'mfa', confirmationRequired: true },
    'safety-event.review': {},
  },
};
