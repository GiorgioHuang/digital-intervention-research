import type { PolicyConfiguration } from './types.js';

/**
 * Initial policy configuration (versioned data, not architecture): the
 * Doc 4 specific-permission catalogue subset needed for P2, with per-action
 * requirements. Undecided values stay config-driven and fail closed
 * (Master Prompt open-ADR rule 5). Actions absent here are denied.
 */
export const POLICY_V1: PolicyConfiguration = {
  policyVersion: 'policy_v0.3.0',
  rolePermissions: {
    SystemAdministrator: [
      // Administration only: no content, approval or consent authority
      // (Doc 4). role.assign is needed to bootstrap the first
      // OrganisationAdministrator; every assignment is confirmed + audited.
      'organisation.create',
      'user.invite',
      'user.suspend',
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
      'user.suspend',
      'role.assign',
      'role.revoke',
      'audit.view',
      'community.create',
      'participant.list-administrative',
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
      'intervention.view',
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
      'intervention.approve', 'intervention.activate', 'intervention.view',
      'dataset.approve-definition', 'dataset.lock',
      'analysis-plan.approve', 'interpretation.approve', 'finding.approve',
      'approval.decide',
      'report.approve', 'export.approve',
      'approval-queue.view',
      // The approver is who knows the consent text has changed, because
      // they are who approved the version that changed it.
      'consent.require-reconsent',
    ],
    EvidenceReviewer: [
      'evidence-review.view-queue',
      'evidence-review.approve',
      'evidence-decision.draft',
      'evidence-decision.view-queue',
      'evidence-decision.approve',
    ],
    SafetyReviewer: [
      'safety-signal.record',
      'safety-signal.triage',
      'safety-event.create',
      'safety-event.review',
      'safety-event.act',
      'triage-queue.view',
    ],
    Participant: [
      'life-story.view-shared',
      // Participant self-service actions are owner-permitted on own resources.
      'participant.view-own',
      'participant.update-own',
      'consent.record',
      'consent.withdraw',
      'relationship.approve',
      'relationship.revoke',
      'participant.export',
      'export.view-own',
      'enrolment.view-own',
      'enrolment.withdraw',
      'life-story.view-own',
      'life-story.view-shared',
      'life-story.create',
      'life-story.edit',
      'life-story.confirm-testimony',
      'life-story.change-visibility',
      'life-story.review-contribution',
      'life-story.withdraw',
      'life-story.export',
      'block.view-own',
      'block.create',
      'block.revoke',
      'report.submit',
      'community.join',
      'community.leave',
      'post.draft',
      'post.publish',
      'matching.activate',
      'matching.deactivate',
      'match.decide',
      'connection.activate',
      'connection.end',
      'thread.create',
      'message.draft',
      'message.confirm-send',
      'object.upload',
      'object.assign',
      'object.caption',
      'object.view-own',
      'object.delete-own',
    ],
    Supporter: [
      'participant.view-shared',
      'life-story.view-shared',
      'life-story.contribute',
      // Writing to the participant they support — only ever effective when
      // the relationship itself carries `relationship.message`, which the
      // participant approves separately from anything else (D-29).
      'relationship.message',
      'thread.view-own',
      'report.submit',
      'contribution.view-own',
      'relationship.view-own',
    ],
    Moderator: ['moderation.triage', 'moderation.decide', 'moderation-queue.view'],
    // Governance reviewers (M15): holds and break-glass retrospective
    // review. Deliberately disjoint from break-glass execution so the
    // reviewer can never be the executor by role alone.
    PrivacyReviewer: ['governance-hold.place', 'governance-hold.lift', 'break-glass.review', 'audit.view', 'governance-queue.view'],
  },
  actionRequirements: {
    'organisation.create': {},
    'user.invite': {},
    'user.view': {},
    /**
     * Stopping somebody, and letting them back.
     *
     * The enforcement for this already existed and nothing could reach it:
     * a Suspended account is refused at sign-in AND on every request of a
     * session already open, so it is the platform's only actual kill
     * switch — and no code wrote that state, so the switch had no handle.
     * Meanwhile the accounts screen told administrators that removing
     * every role was the way to stop somebody, which does not stop them
     * signing in, does not end the session they are in, and leaves them
     * everything they own.
     *
     * Confirmed but NOT held to the strong-authentication tier. The ten
     * actions that are — approving a version, releasing an export — are
     * one-way: the thing leaves. This one is reversible by the same
     * screen, and it is reached when somebody has to be stopped now. A
     * round trip to Google in that moment buys little and costs the
     * minutes that matter.
     */
    'user.suspend': { confirmationRequired: true },
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
    // Staff queue view: unscoped by design, held only by staff roles.
    'enrolment.view': {},
    /**
     * A participant seeing their own enrolment — what makes "where am I in
     * this study" and the right to leave reachable from their own screen
     * rather than only by asking staff.
     *
     * A separate action rather than `ownerPermitted` on `enrolment.view`:
     * that action is the staff queue over every enrolment, so adding
     * owner-permission to it would have granted participants the whole
     * queue. `ownerOnly` is what actually confines this one, exactly as it
     * does for `participant.view-own`.
     */
    'enrolment.view-own': { ownerPermitted: true, ownerOnly: true },

    // Object storage (Doc 14 §59): uploads and assignment are owner-only
    // on the participant's own objects.
    'object.upload': { ownerPermitted: true, ownerOnly: true },
    'object.assign': { ownerPermitted: true, ownerOnly: true },
    /*
     * Seeing one's own attachments. A separate action from assigning
     * because reading and attaching are different authorities, and
     * because `object.assign` had been gating reads as well — a write
     * action standing in for a read tells an auditor the wrong thing
     * about what somebody did.
     */
    'object.view-own': { ownerPermitted: true, ownerOnly: true },
    /*
     * Writing the words that go with a photograph. Its own action rather
     * than `object.upload` reused, for the reason stated just above about
     * `object.view-own`: a write action standing in for a different write
     * tells an auditor the wrong thing about what somebody did. Adding a
     * file and saying who is in it are different acts, and only the second
     * one puts a person's name next to a picture.
     */
    'object.caption': { ownerPermitted: true, ownerOnly: true },
    /*
     * Taking a photograph back. `object_state` has allowed 'Deleted'
     * since the first migration and nothing ever wrote it, so a
     * participant could attach a picture of their life and had no way to
     * remove it — the same one-way door D-54 found in matching, on
     * something more personal. In the confirmation tier because it
     * destroys the bytes and cannot be undone.
     */
    'object.delete-own': { ownerPermitted: true, ownerOnly: true, confirmationRequired: true },
    'moderation-queue.view': {},
    'contribution.view-own': {},

    'project.view': {},
    'project.create': {},
    'project.approve': { confirmationRequired: true, minimumAuthStrength: 'mfa' },
    'project.activate': { confirmationRequired: true },
    'question.create': {},
    'protocol.draft': {},
    'protocol.submit': {},
    'protocol.activate': { confirmationRequired: true },
    /**
     * Seeing the portfolio. M06 had six commands and no query at all, so
     * an approver had a decision to make with no way to learn there was
     * anything to decide, and the researcher who submitted a version
     * could not find out what became of it. Held by both sides of that
     * exchange, as the other work queues are.
     */
    'intervention.view': {},
    'intervention.draft': {},
    'intervention.submit': {},
    'intervention.approve': { confirmationRequired: true, minimumAuthStrength: 'mfa' },
    'intervention.activate': { confirmationRequired: true },
    'evidence.search': {},
    'evidence.reference': {},
    'evidence-review.create': {},
    'evidence-review.submit': {},
    /**
     * Seeing the evidence review queue. Separate from the approval it
     * leads to, because that one is confirmationRequired and a read
     * forced to claim confirmation is a read pretending to be a command —
     * the same split already made for `export.view-own`. Not folded into
     * `approval-queue.view` either: that would hand an evidence reviewer
     * the protocol, dataset and export queues as well.
     */
    'evidence-review.view-queue': {},
    'evidence-review.approve': { confirmationRequired: true },
    'evidence-decision.draft': {},
    /** Seeing the decision queue; the approval it leads to is confirmationRequired. */
    'evidence-decision.view-queue': {},
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
    /**
     * Administrative listing of the participants in your own organisation
     * (decision D-13). Deliberately NOT consent-gated, unlike
     * `participant.view-assigned`: this carries no research content — an
     * identifier, a name and an account state — and gating it on
     * study-participation consent would make a participant who withdrew
     * disappear from the administration they still need.
     *
     * Protected existence (ADR-050) survives because this is an
     * enumeration inside a scope the administrator already holds, not a
     * lookup that answers "does this identifier exist" for an id supplied
     * by the caller. The query filters to the organisation as well; the
     * permission decides whether you may look, the query decides what you
     * see, and both are needed.
     */
    'participant.list-administrative': {
      requiresPurpose: true,
      allowedPurposes: ['platform-administration'],
    },
    // Supporter access rides on an authorising Relationship AND sharing consent.
    'participant.view-shared': {
      requiresRelationship: true,
      consentScopes: ['supporter-involvement'],
      interaction: true,
    },
    'participant.export': { ownerPermitted: true, ownerOnly: true, confirmationRequired: true },
    /**
     * Reading the state of one's own portability requests. Separate from
     * `participant.export` because that one is confirmationRequired, and a
     * read that has to claim confirmation is a read pretending to be a
     * command.
     */
    'export.view-own': { ownerPermitted: true, ownerOnly: true },

    'consent.record': { ownerPermitted: true, ownerOnly: true },
    /**
     * Telling a participant the terms changed and their agreement no
     * longer covers the new wording.
     *
     * Deliberately NOT ownerPermitted: this is the one thing about a
     * participant's consent that somebody else does, and it is the
     * opposite of granting — it takes the access away until they answer.
     * Confirmed, because pressing it stops things the participant is
     * relying on at that moment.
     */
    'consent.require-reconsent': { confirmationRequired: true },
    'consent.withdraw': { ownerPermitted: true, ownerOnly: true, confirmationRequired: true },
    /**
     * A supporter reading the relationships they are named in. Scoped by
     * the requesting actor inside the query rather than by an owner rule,
     * because the reader here is the related party, not the participant
     * the relationship is about.
     */
    'relationship.view-own': {},
    'relationship.propose': {},
    'relationship.approve': { ownerPermitted: true, ownerOnly: true, confirmationRequired: true },
    'relationship.revoke': { ownerPermitted: true, ownerOnly: true },

    /**
     * Reading one's own life story. There was no read action at all: a
     * participant could create, edit, confirm and withdraw items but
     * nothing let them look at what was there. `ownerOnly` because a life
     * story is not staff-readable by role — sharing it with anyone else
     * goes through visibility and access grants, not through this action.
     */
    'life-story.view-own': { ownerPermitted: true, ownerOnly: true },
    /**
     * Reading what somebody else chose to share with you.
     *
     * Deliberately NOT `ownerOnly` — that is the whole of what it is for,
     * and until it existed a life story could be read by its author and
     * nobody else, which made every sharing choice on the platform a
     * control that did nothing (B-30).
     *
     * This grants the ATTEMPT and never the content. Which memories come
     * back is decided per item by the owner's own visibility choice
     * against the viewer's standing (`sharedWithOthers` in M17), the way
     * the object listing already resolves a permission and then filters
     * rows. A role reaching this action learns nothing it was not shared.
     *
     * Held by Participant and Supporter, and by no staff role: a life
     * story is not staff-readable, and it is not becoming so by being
     * shareable with a daughter.
     */
    'life-story.view-shared': { ownerPermitted: true },
    'life-story.create': { ownerPermitted: true, ownerOnly: true },
    'life-story.edit': { ownerPermitted: true, ownerOnly: true },
    'life-story.confirm-testimony': { ownerPermitted: true, ownerOnly: true, confirmationRequired: true },
    'life-story.change-visibility': { ownerPermitted: true, ownerOnly: true, confirmationRequired: true },
    'life-story.review-contribution': { ownerPermitted: true, ownerOnly: true },
    'life-story.withdraw': { ownerPermitted: true, ownerOnly: true, confirmationRequired: true },
    'life-story.export': { ownerPermitted: true, ownerOnly: true, confirmationRequired: true },
    'life-story.contribute': { requiresRelationship: true, consentScopes: ['supporter-contribution'], interaction: true },
    /**
     * A supporter writing to the participant they support.
     *
     * Its own action rather than a widening of `participant.view-shared`,
     * because being trusted to see what someone shares is not the same as
     * being allowed to write to them (D-29). A participant who wanted a
     * niece to read their life story and nothing more would otherwise have
     * granted her a channel into their inbox by accident.
     *
     * `requiresRelationship` means the relationship's own permitted actions
     * decide it, so the participant grants it by approving a relationship
     * that names it — and revoking the relationship stops it, which the
     * basis re-evaluation on every message enforces (ADR-031). Not
     * `ownerOnly`: the whole point is that someone other than the owner may
     * act, which is what a relationship is for. `interaction` brings the
     * block check with it.
     *
     * Deliberately NOT gated on `supporter-involvement` consent. That scope
     * governs a supporter seeing the participant's things; writing to
     * someone is a different act, and the relationship's own permission is
     * what authorises it.
     */
    'relationship.message': { requiresRelationship: true, interaction: true },
    /** A supporter reading the conversations they are a party to. Scoped
     *  inside the query to threads naming this actor. */
    'thread.view-own': {},

    'matching.activate': { ownerPermitted: true, ownerOnly: true, consentScopes: ['open-matching'], confirmationRequired: true },
    /*
     * The way out, and deliberately not gated on `open-matching`. Joining
     * the pool needs that consent; leaving it cannot, or withdrawing the
     * consent would lock somebody inside the thing it let them into —
     * the same reasoning D-26 used for leaving a community.
     */
    'matching.deactivate': { ownerPermitted: true, ownerOnly: true, confirmationRequired: true },
    'matching.generate': {},
    'match.decide': { ownerPermitted: true, ownerOnly: true, confirmationRequired: true },
    'connection.activate': { ownerPermitted: true, confirmationRequired: true },
    /*
     * Ending a connection is not blocking. Blocking is a safety act that
     * says something about the other person; ending a connection says only
     * that this pairing is over. Until this existed the only way out of a
     * connection was to block, so an ordinary parting had to be dressed up
     * as an accusation.
     */
    'connection.end': { ownerPermitted: true, ownerOnly: true, confirmationRequired: true },

    'thread.create': { ownerPermitted: true, ownerOnly: true, interaction: true },
    'message.draft': { ownerPermitted: true, ownerOnly: true },
    'message.confirm-send': { ownerPermitted: true, ownerOnly: true, confirmationRequired: true, interaction: true, consentScopes: ['participant-messaging'] },

    /**
     * Blocking is the one protection a participant can put in place
     * without asking anyone, so it must not be something another
     * participant can undo. These carried only `confirmationRequired`,
     * which meant the Participant role alone was enough and the engine
     * never compared the named blocker with the caller — any participant
     * could place a block in someone else's name, or revoke one. The
     * person with the strongest motive to remove a block is the person it
     * was placed against.
     */
    /** Seeing the blocks you placed — needed before "you can undo it" is true. */
    'block.view-own': { ownerPermitted: true, ownerOnly: true },
    'block.create': { ownerPermitted: true, ownerOnly: true, confirmationRequired: true },
    'block.revoke': { ownerPermitted: true, ownerOnly: true, confirmationRequired: true },
    'report.submit': {},
    'moderation.triage': {},
    'moderation.decide': { confirmationRequired: true },
    'community.create': {},
    'community.join': { ownerPermitted: true, ownerOnly: true, consentScopes: ['community-participation'] },
    /*
     * Leaving carries NO consent precondition, deliberately. Joining is
     * gated on community-participation consent; if leaving were gated the
     * same way, withdrawing that consent would trap the person inside the
     * community it was the consent for. The way out must never depend on
     * the permission that let you in.
     */
    'community.leave': { ownerPermitted: true, ownerOnly: true, confirmationRequired: true },
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

    /**
     * Present for completeness and checked by no code, on purpose.
     * `recordSafetySignal` runs no permission check at all: a person
     * raising a concern about somebody's safety is never turned away for
     * want of a role, and a participant, a supporter and a member of
     * staff can all raise one. What the command does check is the
     * provenance claim — a machine source requires a service-account
     * actor — because that is a statement about who observed the thing,
     * not permission to say it.
     */
    'safety-signal.record': {},
    'safety-signal.triage': { confirmationRequired: true },
    'safety-event.create': { minimumAuthStrength: 'mfa', confirmationRequired: true },
    'safety-event.review': {},
    /*
     * Recording what was done about a safety event, and moving where the
     * event stands. Confirmed, because each entry is permanent - the
     * timeline is append-only and a correction is a further entry with the
     * original left standing. Not MFA-tier: creating the event is the act
     * that needs the strongest authority, and putting the same barrier in
     * front of writing down what you did afterwards would discourage the
     * recording, which is the part that has to happen.
     */
    'safety-event.act': { confirmationRequired: true },
  },
};

/**
 * The actions a Relationship can actually authorise.
 *
 * Step 4 of the engine consults a relationship's `permittedActions` only
 * for actions whose requirement carries `requiresRelationship`. Anything
 * else in that list is read by nothing — and the list is not internal
 * bookkeeping: it is printed to the participant, under the heading "What
 * this would let them do", on the screen where they decide whether to
 * grant it. A grant the platform cannot honour is worse there than
 * anywhere else, because it is the participant's decision that is being
 * taken on false information.
 *
 * Derived from the requirement table rather than restated, so a new
 * relationship-bearing action is covered the day it is added and a list
 * copied by hand cannot drift away from the engine.
 */
export const RELATIONSHIP_AUTHORISABLE_ACTIONS: readonly string[] = Object.entries(POLICY_V1.actionRequirements)
  .filter(([, requirement]) => requirement.requiresRelationship === true)
  .map(([action]) => action)
  .sort();

/**
 * Actions this catalogue declares and grants that no command ever checks.
 *
 * A permission nothing checks grants nothing, so none of these is a way
 * in. What they are is a claim: this file is the platform's statement of
 * what a role may do, and it is read as one — by whoever is deciding
 * which role to give somebody, and by anyone auditing what a role could
 * have done. Ten actions here described capabilities that do not exist.
 *
 * They are kept rather than deleted, because each records a real
 * intention and deleting it would lose the design, and each is named
 * here with why. The test beside this file derives the same set from the
 * module and route sources and requires the two to match exactly, so it
 * fails in both directions: a new unchecked action cannot appear
 * quietly, and implementing one of these fails until it is removed from
 * this list.
 */
export const ACTIONS_WITH_NO_CHECK: Readonly<Record<string, string>> = {
  /*
   * The only one that is deliberate and must stay that way. A person
   * raising a concern about somebody's safety is never refused for want
   * of a role, so recordSafetySignal checks nothing — see the comment at
   * its definition. Implementing a check here would be the defect.
   */
  'safety-signal.record': 'deliberately unchecked: raising a safety concern is never refused for want of a role',

  /*
   * Decided rather than unbuilt: D-39 established that sharing with a
   * supporter does not exist in this platform at all — no code reads
   * this action and not one row has ever been written to access_grants.
   * The screens that name it say so in those words.
   */
  'participant.view-shared': 'inert by decision (D-39); the screens naming it say it grants nothing',

  // Capabilities the catalogue describes and the platform does not have.
  'participant.view-assigned': 'no staff read path to a participant record exists; staff screens read enrolments',
  'project.approve': 'projects have no approval lifecycle: project_state has no writer and no command moves it',
  'project.activate': 'projects have no approval lifecycle: project_state has no writer and no command moves it',
  'protocol.review': 'protocol versions are drafted, submitted, approved, activated or refused — there is no review step',
  'moderation.triage': 'only moderation.decide exists; a triage step separate from the decision was never built',
  'life-story.export': 'M17 holds no export command; a participant exports through M14 under participant.export',
  'evidence-snapshot.create':
    'a snapshot is only ever written inside approving an evidence decision (ADR-044), so it is never created on its own',
  'system.configure': 'the platform has no configuration surface',
};
