import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import pg from 'pg';
import { FixedClock, createRequestContext, PlatformError } from '@platform/kernel';
import { createPool, migrate, withTransaction } from '@platform/database';
import { POLICY_V1 } from '@platform/policy';
import {
  assignRole,
  createOrganisation,
  listOrganisationAccounts,
  revokeRole,
  createRoleAssignmentQuery,
  createUserAccount,
  seedBootstrapAdministrator,
  type M01Deps,
} from '@platform/m01-identity-org';
import { createPermissionService } from '../src/application/permission-service.js';
import {
  approveRelationship,
  proposeRelationship,
  recordConsentDecision,
  requireReConsent,
  revokeRelationship,
  withdrawConsent,
  type M03Deps,
} from '../src/application/consent-commands.js';
import {
  listOwnConsents,
  listOwnRelationships,
  listRelationshipsForActor,
} from '../src/application/consent-queries.js';

const DATABASE_URL =
  process.env['DATABASE_URL'] ?? 'postgres://platform:platform_dev_only@localhost:5432/research_platform';

async function probe(): Promise<boolean> {
  const c = new pg.Client({ connectionString: DATABASE_URL, connectionTimeoutMillis: 2000 });
  try {
    await c.connect();
    await c.end();
    return true;
  } catch {
    return false;
  }
}
const dbAvailable = await probe();

describe.skipIf(!dbAvailable)('M01+M03 identity, consent and permission (integration)', () => {
  let pool: pg.Pool;
  const clock = new FixedClock('2026-07-30T12:00:00Z');
  let m01: M01Deps;
  let m03: M03Deps;
  let adminId: string;
  let orgId: string;
  let participantId: string;
  let researcherId: string;
  let supporterId: string;

  const ctxFor = (actorId: string, extras: Record<string, string> = {}) =>
    createRequestContext({
      actor: { type: 'user', id: actorId },
      ...extras,
    });

  beforeAll(async () => {
    await migrate({ databaseUrl: DATABASE_URL, direction: 'up' });
    pool = createPool({ connectionString: DATABASE_URL, applicationName: 'm03-tests' });

    const permissions = createPermissionService({
      pool,
      clock,
      policy: POLICY_V1,
      roleAssignments: createRoleAssignmentQuery(pool),
    });
    m03 = { pool, clock, permissions };
    m01 = { pool, clock, checkPermission: (ctx, req) => permissions.evaluate(ctx, req) };

    ({ userAccountId: adminId } = await seedBootstrapAdministrator(pool, clock, {
      displayName: 'Bootstrap Admin',
    }));
    ({ organisationId: orgId } = await createOrganisation(m01, ctxFor(adminId), { name: 'Test Org' }));

    // Admin invites accounts, then assigns roles (confirmed: high-impact).
    const adminCtx = ctxFor(adminId, { organisationId: orgId });
    ({ userAccountId: participantId } = await createUserAccount(m01, adminCtx, {
      displayName: 'Pat Participant',
      organisationId: orgId,
    }));
    ({ userAccountId: researcherId } = await createUserAccount(m01, adminCtx, {
      displayName: 'Ria Researcher',
      organisationId: orgId,
    }));
    ({ userAccountId: supporterId } = await createUserAccount(m01, adminCtx, {
      displayName: 'Sam Supporter',
      organisationId: orgId,
    }));
    // OrganisationAdministrator for org, then role assignments in scope.
    await assignRole(m01, adminCtx, { userAccountId: adminId, role: 'OrganisationAdministrator', organisationId: orgId, confirmed: true });
    await assignRole(m01, adminCtx, { userAccountId: participantId, role: 'Participant', confirmed: true });
    await assignRole(m01, adminCtx, {
      userAccountId: researcherId,
      role: 'Researcher',
      organisationId: orgId,
      researchProjectId: 'rp_1',
      confirmed: true,
    });
    await assignRole(m01, adminCtx, { userAccountId: supporterId, role: 'Supporter', confirmed: true });
    // Coordinator role (unscoped for the test) so the admin actor may propose relationships.
    await assignRole(m01, adminCtx, { userAccountId: adminId, role: 'ResearchCoordinator', confirmed: true });
  }, 30_000);

  afterAll(async () => {
    await pool?.end();
  });

  const researcherView = () =>
    m03.permissions.evaluate(
      createRequestContext({
        actor: { type: 'user', id: researcherId },
        organisationId: orgId,
        researchProjectId: 'rp_1',
        purposeCode: 'research-operations',
      }),
      {
        action: 'participant.view-assigned',
        resource: {
          type: 'ParticipantRecord',
          id: participantId,
          state: 'Active',
          protectedExistence: true,
          ownerParticipantId: participantId,
          organisationId: orgId,
          researchProjectId: 'rp_1',
        },
      },
    );

  it('NEGATIVE role-only bypass: researcher with valid role but NO consent is denied, existence hidden', async () => {
    const decision = await researcherView();
    expect(decision.outcome).toBe('DenyAndHideExistence');
    expect(decision.reason).toBe('consent-missing');
  });

  it('participant records study-participation consent (owner-only), then researcher is allowed', async () => {
    await recordConsentDecision(m03, ctxFor(participantId), {
      participantId,
      scope: 'study-participation',
      decision: 'Granted',
      templateVersion: 'ct_v1',
    });
    const decision = await researcherView();
    expect(decision.outcome).toBe('Allow');
  });

  it('NEGATIVE cross-participant: another actor cannot record consent for the participant', async () => {
    await expect(
      recordConsentDecision(m03, ctxFor(researcherId), {
        participantId,
        scope: 'study-participation',
        decision: 'Granted',
        templateVersion: 'ct_v1',
      }),
    ).rejects.toMatchObject({ code: 'AUTHORISATION_DENIED' });
  });

  it('withdrawal requires explicit confirmation (AllowWithConfirmation)', async () => {
    await expect(
      withdrawConsent(m03, ctxFor(participantId), {
        participantId,
        scope: 'study-participation',
        templateVersion: 'ct_v1',
        confirmed: false,
      }),
    ).rejects.toMatchObject({ code: 'CONFIRMATION_REQUIRED' });
  });

  it('NEGATIVE withdrawn consent: withdrawal atomically emits ConsentWithdrawn and access is denied afterwards', async () => {
    await withdrawConsent(m03, ctxFor(participantId), {
      participantId,
      scope: 'study-participation',
      templateVersion: 'ct_v1',
      confirmed: true,
    });

    // Outbox atomic pair: state change + ConsentWithdrawn committed together.
    const outbox = await pool.query(
      `SELECT count(*)::int AS n FROM platform_kernel.outbox_messages
        WHERE event_type = 'ConsentWithdrawn' AND payload->>'participantId' = $1`,
      [participantId],
    );
    expect(outbox.rows[0].n).toBeGreaterThanOrEqual(1);

    const decision = await researcherView();
    expect(decision.outcome).toBe('DenyAndHideExistence');
    expect(decision.reason).toBe('consent-withdrawn');

    // Consent decision history is append-only (DB trigger).
    await expect(
      pool.query(`UPDATE consent_permission.consent_decisions SET decision = 'Granted'`),
    ).rejects.toThrow(/append-only/);
  });

  it('every evaluation is recorded as a PolicyDecision with policy version', async () => {
    const res = await pool.query(
      `SELECT outcome, policy_version FROM consent_permission.policy_decisions
        WHERE actor_id = $1 AND action = 'participant.view-assigned'
        ORDER BY evaluated_at`,
      [researcherId],
    );
    expect(res.rows.length).toBeGreaterThanOrEqual(3);
    expect(res.rows.every((r) => r.policy_version === POLICY_V1.policyVersion)).toBe(true);
  });

  it('supporter path: relationship + consent both required; revocation of either denies', async () => {
    const supporterCtx = ctxFor(supporterId);
    const view = () =>
      m03.permissions.evaluate(supporterCtx, {
        action: 'participant.view-shared',
        resource: {
          type: 'ParticipantRecord',
          id: participantId,
          state: 'Active',
          protectedExistence: true,
          ownerParticipantId: participantId,
        },
      });

    // No relationship at all -> hidden.
    expect((await view()).outcome).toBe('DenyAndHideExistence');

    // Propose (coordinator-free path: admin proposes) + participant approves.
    const { relationshipId } = await proposeRelationship(m03, ctxFor(adminId), {
      participantId,
      relatedActorId: supporterId,
      relationshipType: 'FamilyMember',
      permittedActions: ['participant.view-shared'],
    });
    // Pending verification -> still not allowed.
    expect((await view()).outcome).not.toBe('Allow');

    await approveRelationship(m03, ctxFor(participantId), {
      relationshipId,
      expectedVersion: 1,
      confirmed: true,
    });
    // Relationship active but supporter-involvement consent missing -> denied.
    expect((await view()).reason).toBe('consent-missing');

    await recordConsentDecision(m03, ctxFor(participantId), {
      participantId,
      scope: 'supporter-involvement',
      decision: 'Granted',
      templateVersion: 'ct_v1',
    });
    expect((await view()).outcome).toBe('Allow');

    // Withdraw the consent -> denied again (prompt effect on next evaluation).
    await withdrawConsent(m03, ctxFor(participantId), {
      participantId,
      scope: 'supporter-involvement',
      templateVersion: 'ct_v1',
      confirmed: true,
    });
    expect((await view()).outcome).toBe('DenyAndHideExistence');
  });

  it('optimistic concurrency: stale expectedVersion on relationship approval conflicts', async () => {
    const { relationshipId } = await proposeRelationship(m03, ctxFor(adminId), {
      participantId,
      relatedActorId: supporterId,
      relationshipType: 'Friend',
      permittedActions: ['participant.view-shared'],
    });
    await expect(
      approveRelationship(m03, ctxFor(participantId), {
        relationshipId,
        expectedVersion: 99,
        confirmed: true,
      }),
    ).rejects.toMatchObject({ code: 'VERSION_CONFLICT' });
  });

  it('duplicate active role assignment in the same scope is rejected by the database', async () => {
    const adminCtx = ctxFor(adminId, { organisationId: orgId });
    await expect(
      assignRole(m01, adminCtx, { userAccountId: participantId, role: 'Participant', confirmed: true }),
    ).rejects.toThrow(/duplicate key/i);
  });

  it('unknown actor gets deny (no roles), and unauthenticated context denies', async () => {
    const decision = await m03.permissions.evaluate(ctxFor('actor_ghost'), {
      action: 'participant.view-assigned',
      resource: {
        type: 'ParticipantRecord',
        id: participantId,
        state: 'Active',
        protectedExistence: true,
        ownerParticipantId: participantId,
      },
    });
    expect(decision.outcome).toBe('DenyAndHideExistence');

    const anonymous = await m03.permissions.evaluate(createRequestContext(), {
      action: 'participant.view-assigned',
      resource: { type: 'ParticipantRecord', id: participantId, state: 'Active', protectedExistence: true },
    });
    expect(anonymous.outcome).toBe('DenyAndHideExistence');
  });

  it('PlatformError surfaces stable error codes end to end', async () => {
    try {
      await withdrawConsent(m03, ctxFor(researcherId), {
        participantId,
        scope: 'study-participation',
        templateVersion: 'ct_v1',
        confirmed: true,
      });
      expect.unreachable('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(PlatformError);
      expect((err as PlatformError).code).toBe('AUTHORISATION_DENIED');
    }
  });

  it('audit trail exists for consent actions and is append-only', async () => {
    const res = await pool.query(
      `SELECT count(*)::int AS n FROM governance_audit.audit_events
        WHERE participant_id = $1 AND action IN ('consent.record', 'consent.withdraw')`,
      [participantId],
    );
    expect(res.rows[0].n).toBeGreaterThanOrEqual(3);
  });

  it('transactionality: failed command leaves no partial consent state', async () => {
    // Force a failure inside the transaction by violating the append-only
    // trigger via a poisoned decision id (duplicate primary key).
    const { consentDecisionId } = await recordConsentDecision(m03, ctxFor(participantId), {
      participantId,
      scope: 'ai-assistance',
      decision: 'Granted',
      templateVersion: 'ct_v1',
    });
    const before = await pool.query(
      `SELECT count(*)::int AS n FROM consent_permission.consent_decisions WHERE participant_id = $1`,
      [participantId],
    );
    await expect(
      withTransaction(pool, async (client) => {
        await client.query(
          `INSERT INTO consent_permission.consent_decisions
             (id, participant_id, consent_scope, consent_template_version, decision,
              decided_by_actor_id, effective_from)
           VALUES ($1, $2, 'x', 'v', 'Granted', 'a', now())`,
          [consentDecisionId, participantId],
        );
      }),
    ).rejects.toThrow(/duplicate key/i);
    const after = await pool.query(
      `SELECT count(*)::int AS n FROM consent_permission.consent_decisions WHERE participant_id = $1`,
      [participantId],
    );
    expect(after.rows[0].n).toBe(before.rows[0].n);
  });

  /**
   * The consent screen reads this. It has to be the same projection the
   * permission engine consults, or the screen could show one position
   * while the server enforces another and neither would look wrong.
   */
  it('a participant reads their own current position, and a withdrawal shows as withdrawn', async () => {
    const own = ctxFor(participantId);
    await recordConsentDecision(m03, own, {
      participantId,
      scope: 'participant-messaging',
      decision: 'Granted',
      templateVersion: 'ct_v1',
    });
    const granted = await listOwnConsents(m03, own, participantId);
    const messaging = granted.find((c) => c.scope === 'participant-messaging');
    expect(messaging?.decision).toBe('Granted');
    expect(messaging?.templateVersion).toBe('ct_v1');

    await withdrawConsent(m03, own, {
      participantId,
      scope: 'participant-messaging',
      templateVersion: 'ct_v1',
      confirmed: true,
    });
    const afterWithdrawal = await listOwnConsents(m03, own, participantId);
    expect(afterWithdrawal.find((c) => c.scope === 'participant-messaging')?.decision).toBe('Withdrawn');

    // Owner-only: another participant's decisions are not readable, and
    // the denial does not distinguish "no such participant" from "not
    // yours" (ADR-050).
    await expect(listOwnConsents(m03, ctxFor(researcherId), participantId)).rejects.toMatchObject({
      code: 'RESOURCE_NOT_FOUND',
    });
  });

  /**
   * Approving and revoking have always been owner-only, so the
   * participant is the only person who may let a supporter in or shut one
   * out — and nothing listed relationships, which made both unreachable.
   * A proposal waited on an approval they could not see they had been
   * asked for.
   */
  it('a participant lists who has, or has asked for, access — and ends it', async () => {
    const own = ctxFor(participantId);
    const { relationshipId } = await proposeRelationship(m03, ctxFor(adminId), {
      participantId,
      relatedActorId: supporterId,
      relationshipType: 'FamilyMember',
      permittedActions: ['participant.view-shared'],
    });

    const waiting = await listOwnRelationships(m03, own, participantId);
    const proposed = waiting.find((r) => r.relationshipId === relationshipId);
    // Every relationship is created PendingVerification; nothing in the
    // platform verifies anything from there, and the participant's
    // decision is the only way out. The screen therefore words it the
    // same as Proposed rather than describing a check nobody performs.
    expect(proposed?.relationshipState).toBe('PendingVerification');
    expect(proposed?.permittedActions).toEqual(['participant.view-shared']);
    // The version comes back with the row: approve and revoke are
    // version-bound, so a list that omitted it could not drive either.
    expect(typeof proposed?.recordVersion).toBe('number');

    await approveRelationship(m03, own, {
      relationshipId,
      expectedVersion: proposed!.recordVersion,
      confirmed: true,
    });
    const active = (await listOwnRelationships(m03, own, participantId)).find(
      (r) => r.relationshipId === relationshipId,
    );
    expect(active?.relationshipState).toBe('Active');

    await revokeRelationship(m03, own, { relationshipId, expectedVersion: active!.recordVersion });
    const ended = (await listOwnRelationships(m03, own, participantId)).find(
      (r) => r.relationshipId === relationshipId,
    );
    // Kept in the list rather than disappearing: someone asking who has
    // access to them is also entitled to know who used to.
    expect(ended?.relationshipState).toBe('Revoked');

    // Owner-only, and the refusal does not distinguish "no such
    // participant" from "not yours".
    await expect(listOwnRelationships(m03, ctxFor(supporterId), participantId)).rejects.toMatchObject({
      code: 'RESOURCE_NOT_FOUND',
    });
    await expect(listOwnRelationships(m03, ctxFor(researcherId), participantId)).rejects.toMatchObject({
      code: 'RESOURCE_NOT_FOUND',
    });
  });

  /**
   * The other side of the same record. A supporter had no way to learn
   * who they support or on what terms, and the contribution form asked
   * them for an archive identifier they could only have been told out of
   * band.
   */
  it('a supporter reads the relationships they are named in, and only those', async () => {
    const mine = await listRelationshipsForActor(m03, ctxFor(supporterId));
    expect(mine.length).toBeGreaterThan(0);
    expect(mine.every((r) => r.participantId === participantId)).toBe(true);

    // Scoped by the requesting actor and never by an argument — there is
    // nothing to point at somebody else's relationships with — and the
    // action itself is not held by staff roles.
    await expect(listRelationshipsForActor(m03, ctxFor(researcherId))).rejects.toMatchObject({
      code: 'AUTHORISATION_DENIED',
    });
  });

  /**
   * `ReConsentRequired` has been a permitted consent decision since the
   * tables were written. The permission engine reads it and refuses
   * everything the scope gates, and `assert.ts` carries a message for the
   * outcome — a complete, working mechanism for "the terms you agreed to
   * have changed" that nothing in the platform could trigger. A consent
   * text could be revised and every participant would carry on under an
   * agreement to wording that no longer existed.
   */
  it('the terms can change: access stops until the participant agrees again', async () => {
    const approverId = (
      await createUserAccount(m01, ctxFor(adminId, { organisationId: orgId }), {
        displayName: 'Ada Approver',
        organisationId: orgId,
      })
    ).userAccountId;
    await assignRole(m01, ctxFor(adminId, { organisationId: orgId }), {
      userAccountId: approverId,
      role: 'ResearchApprover',
      organisationId: orgId,
      confirmed: true,
    });

    const scope = 'community-participation';
    await recordConsentDecision(m03, ctxFor(participantId), {
      participantId,
      scope,
      decision: 'Granted',
      templateVersion: 'ct_v1',
    });

    // Not the participant's own action, and not something a researcher
    // can do either: it is the one thing about somebody's consent that
    // another person does, and it takes access away.
    await expect(
      requireReConsent(m03, ctxFor(researcherId), {
        participantId,
        scope,
        newTemplateVersion: 'ct_v2',
        whatChanged: 'x',
        confirmed: true,
      }),
    ).rejects.toMatchObject({ code: 'AUTHORISATION_DENIED' });

    const approverCtx = ctxFor(approverId, { organisationId: orgId });

    // A demand nobody can read is only an obstruction.
    await expect(
      requireReConsent(m03, approverCtx, {
        participantId, scope, newTemplateVersion: 'ct_v2', whatChanged: '   ', confirmed: true,
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });

    // The same version would stop their access and give them nothing new
    // to read.
    await expect(
      requireReConsent(m03, approverCtx, {
        participantId, scope, newTemplateVersion: 'ct_v1', whatChanged: 'nothing really', confirmed: true,
      }),
    ).rejects.toMatchObject({ code: 'RESOURCE_STATE_BLOCKED' });

    // There must be an agreement to supersede: asking again where there
    // is none changes nothing while telling the approver they acted.
    await expect(
      requireReConsent(m03, approverCtx, {
        participantId, scope: 'open-matching', newTemplateVersion: 'ct_v2', whatChanged: 'reworded', confirmed: true,
      }),
    ).rejects.toMatchObject({ code: 'RESOURCE_STATE_BLOCKED' });

    await requireReConsent(m03, approverCtx, {
      participantId,
      scope,
      newTemplateVersion: 'ct_v2',
      whatChanged: 'The section on who can see your posts was rewritten.',
      confirmed: true,
    });

    // The engine's own outcome, reachable at last — and the participant
    // is told what changed rather than only that something did.
    const decision = await m03.permissions.evaluate(ctxFor(participantId), {
      action: 'community.join',
      resource: {
        type: 'CommunitySpace', id: 'cs_x', state: 'Active', protectedExistence: false,
        ownerParticipantId: participantId,
      },
    });
    expect(decision.outcome).toBe('ReConsentRequired');
    const view = (await listOwnConsents(m03, ctxFor(participantId), participantId)).find((c) => c.scope === scope);
    expect(view?.decision).toBe('ReConsentRequired');
    expect(view?.decisionNote).toContain('who can see your posts');
    expect(view?.templateVersion).toBe('ct_v2');

    // Agreeing again restores it, and the note goes with the answer.
    await recordConsentDecision(m03, ctxFor(participantId), {
      participantId, scope, decision: 'Granted', templateVersion: 'ct_v2',
    });
    const after = await m03.permissions.evaluate(ctxFor(participantId), {
      action: 'community.join',
      resource: {
        type: 'CommunitySpace', id: 'cs_x', state: 'Active', protectedExistence: false,
        ownerParticipantId: participantId,
      },
    });
    expect(after.outcome).not.toBe('ReConsentRequired');
    const settled = (await listOwnConsents(m03, ctxFor(participantId), participantId)).find((c) => c.scope === scope);
    expect(settled?.decisionNote).toBeNull();
  });

  /**
   * `assistance_recorded` has been on the consent history since the first
   * migration and nothing ever set it — while a chat message sent with
   * somebody helping carried its own flag and said so to the recipient.
   * The platform recorded assistance for small talk and recorded nothing
   * about whether anybody was sitting beside a person when they agreed to
   * take part.
   */
  it('records that somebody was helping when consent was decided, and never who', async () => {
    const scope = 'participant-messaging';
    await recordConsentDecision(m03, ctxFor(participantId), {
      participantId,
      scope,
      decision: 'Granted',
      templateVersion: 'ct_v1',
      assistanceRecorded: true,
    });
    const view = (await listOwnConsents(m03, ctxFor(participantId), participantId)).find((c) => c.scope === scope);
    expect(view?.assistanceRecorded).toBe(true);

    // The history carries it too, which is where it has to live: the
    // projection only holds the choice standing now.
    const history = await pool.query(
      `SELECT assistance_recorded FROM consent_permission.consent_decisions
        WHERE participant_id = $1 AND consent_scope = $2 ORDER BY recorded_at DESC LIMIT 1`,
      [participantId, scope],
    );
    expect(history.rows[0].assistance_recorded).toBe(true);

    // Nothing anywhere holds the helper's name: it stays on the
    // participant's device (D-15), and recording it would make their
    // household a matter of study record.
    const columns = await pool.query(
      `SELECT column_name FROM information_schema.columns
        WHERE table_schema = 'consent_permission' AND table_name = 'consent_decisions'`,
    );
    const names = columns.rows.map((r) => r.column_name as string);
    expect(names.some((n) => n.includes('helper') || n.includes('assistant'))).toBe(false);

    // Deciding alone is the default and is recorded as such, so "no help"
    // is a fact rather than an absence.
    await recordConsentDecision(m03, ctxFor(participantId), {
      participantId, scope, decision: 'Declined', templateVersion: 'ct_v1',
    });
    const alone = (await listOwnConsents(m03, ctxFor(participantId), participantId)).find((c) => c.scope === scope);
    expect(alone?.assistanceRecorded).toBe(false);
  });

  /**
   * `revokeRole` had its permission check, its optimistic version guard,
   * its domain event and its audit entry from the day M01 was written,
   * and no route and no screen; `user.view` was granted to two roles and
   * checked by no code at all; and nothing listed an account or a role.
   * Access on this platform could be given and never taken back.
   */
  it('a role can be listed and taken back, and the refusal is immediate', async () => {
    const adminCtx = ctxFor(adminId, { organisationId: orgId });

    // The researcher could read a participant record before this.
    const before = await researcherView();
    expect(before.outcome).not.toBe('Deny');

    const accounts = await listOrganisationAccounts(m01, adminCtx);
    const theirs = accounts.find((a) => a.userAccountId === researcherId);
    expect(theirs).toBeDefined();
    const role = theirs!.roles.find((r) => r.role === 'Researcher' && r.assignmentState === 'Active');
    expect(role).toBeDefined();

    // Version-bound: a role that changed underneath is refused, not merged.
    await expect(
      revokeRole(m01, adminCtx, { roleAssignmentId: role!.roleAssignmentId, expectedVersion: 99, confirmed: true }),
    ).rejects.toMatchObject({ code: 'VERSION_CONFLICT' });

    // High-impact, so unconfirmed is refused too.
    await expect(
      revokeRole(m01, adminCtx, {
        roleAssignmentId: role!.roleAssignmentId,
        expectedVersion: role!.recordVersion,
        confirmed: false,
      }),
    ).rejects.toBeDefined();

    await revokeRole(m01, adminCtx, {
      roleAssignmentId: role!.roleAssignmentId,
      expectedVersion: role!.recordVersion,
      confirmed: true,
    });

    /*
     * What the whole thing is for: the next thing they try is refused,
     * and refused for the right reason. The outcome hides the record's
     * existence (ADR-050) rather than saying "denied" — a former
     * colleague learning that this participant exists would be the thing
     * revocation was meant to prevent.
     */
    const after = await researcherView();
    expect(after.outcome).toBe('DenyAndHideExistence');
    expect(after.reason).toBe('no-granting-role');

    // The record of the revocation stays visible rather than the row
    // vanishing: who took it back and when is the part somebody will need.
    const listed = (await listOrganisationAccounts(m01, adminCtx))
      .find((a) => a.userAccountId === researcherId)!
      .roles.find((r) => r.roleAssignmentId === role!.roleAssignmentId);
    expect(listed?.assignmentState).toBe('Revoked');
    expect(listed?.revokedByActorId).toBe(adminId);

    /*
     * And an account cannot be closed: five states exist on the column
     * and nothing writes any of them, so 'Active' is the default rather
     * than anybody's decision. The screen says so, because an
     * administrator who believes otherwise thinks they have shut somebody
     * out when they have not.
     */
    expect(accounts.every((a) => a.accountState === 'Active')).toBe(true);
  });
});

describe.skipIf(dbAvailable)('M01+M03 integration (skipped)', () => {
  it('skipped because no PostgreSQL is reachable', () => {
    expect(dbAvailable).toBe(false);
  });
});
