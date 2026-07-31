import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import pg from 'pg';
import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FixedClock, createRequestContext } from '@platform/kernel';
import { createPool, migrate } from '@platform/database';
import { POLICY_V1 } from '@platform/policy';
import { assignRole, createOrganisation, createRoleAssignmentQuery, createUserAccount, seedBootstrapAdministrator } from '@platform/m01-identity-org';
import { createParticipantQuery, registerParticipant } from '@platform/m02-participant';
import { approveRelationship, createPermissionService, proposeRelationship } from '@platform/m03-consent-permission';
import { buildAppModule } from '../src/app.module.js';

const DATABASE_URL =
  process.env['DATABASE_URL'] ?? 'postgres://platform:platform_dev_only@localhost:5432/research_platform';

async function probe(): Promise<boolean> {
  const c = new pg.Client({ connectionString: DATABASE_URL, connectionTimeoutMillis: 2000 });
  try { await c.connect(); await c.end(); return true; } catch { return false; }
}
const dbAvailable = await probe();

describe.skipIf(!dbAvailable)('HTTP API (e2e)', () => {
  let app: INestApplication;
  let baseUrl: string;
  let pool: pg.Pool;
  let patAcc: string, patId: string, strangerAcc: string;
  let researcherAcc: string, approverAcc: string, safetyAcc: string, supporterAcc: string, adminAcc: string;
  let privacyAcc: string;

  const call = (path: string, actor: string | undefined, body?: object, headers?: Record<string, string>) =>
    fetch(`${baseUrl}${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: {
        'content-type': 'application/json',
        ...(actor === undefined ? {} : { 'x-actor-id': actor }),
        ...headers,
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });

  beforeAll(async () => {
    await migrate({ databaseUrl: DATABASE_URL, direction: 'up' });
    pool = createPool({ connectionString: DATABASE_URL, applicationName: 'api-e2e-seed' });
    const clock = new FixedClock('2026-07-30T12:00:00Z');
    const permissions = createPermissionService({
      pool, clock, policy: POLICY_V1,
      roleAssignments: createRoleAssignmentQuery(pool),
      participantIdentity: createParticipantQuery(pool),
    });
    const checkPermission = permissions.evaluate.bind(permissions);
    const m01 = { pool, clock, checkPermission };
    const { userAccountId: adminId } = await seedBootstrapAdministrator(pool, clock, { displayName: 'Admin' });
    adminAcc = adminId;
    const actx = createRequestContext({ actor: { type: 'user', id: adminId } });
    const { organisationId } = await createOrganisation(m01, actx, { name: 'API Org' });
    const orgCtx = createRequestContext({ actor: { type: 'user', id: adminId }, organisationId });
    ({ userAccountId: patAcc } = await createUserAccount(m01, orgCtx, { displayName: 'Pat' }));
    ({ userAccountId: strangerAcc } = await createUserAccount(m01, orgCtx, { displayName: 'Sly' }));
    for (const acc of [patAcc, strangerAcc]) {
      await assignRole(m01, orgCtx, { userAccountId: acc, role: 'Participant', confirmed: true });
    }
    const coordCtx = orgCtx;
    await assignRole(m01, orgCtx, { userAccountId: adminId, role: 'ResearchCoordinator', confirmed: true });
    ({ participantId: patId } = await registerParticipant({ pool, clock, checkPermission }, coordCtx, {
      displayName: 'Pat', userAccountId: patAcc,
    }));
    ({ userAccountId: researcherAcc } = await createUserAccount(m01, orgCtx, { displayName: 'Res' }));
    await assignRole(m01, orgCtx, { userAccountId: researcherAcc, role: 'Researcher', confirmed: true });
    ({ userAccountId: approverAcc } = await createUserAccount(m01, orgCtx, { displayName: 'App' }));
    await assignRole(m01, orgCtx, { userAccountId: approverAcc, role: 'ResearchApprover', confirmed: true });
    ({ userAccountId: safetyAcc } = await createUserAccount(m01, orgCtx, { displayName: 'Saf' }));
    await assignRole(m01, orgCtx, { userAccountId: safetyAcc, role: 'SafetyReviewer', confirmed: true });
    ({ userAccountId: supporterAcc } = await createUserAccount(m01, orgCtx, { displayName: 'Sam' }));
    await assignRole(m01, orgCtx, { userAccountId: supporterAcc, role: 'Supporter', confirmed: true });
    ({ userAccountId: privacyAcc } = await createUserAccount(m01, orgCtx, { displayName: 'Pri' }));
    await assignRole(m01, orgCtx, { userAccountId: privacyAcc, role: 'PrivacyReviewer', confirmed: true });
    // Supporter relationship (approved by the participant) seeds the
    // life-story contribution path; relationship endpoints are not yet
    // HTTP-exposed so this uses the module commands directly.
    const m03 = { pool, clock, permissions };
    const { relationshipId } = await proposeRelationship(m03, orgCtx, {
      participantId: patId,
      relatedActorId: supporterAcc,
      relationshipType: 'FamilyMember',
      permittedActions: ['life-story.contribute'],
    });
    await approveRelationship(m03, createRequestContext({ actor: { type: 'user', id: patAcc } }), {
      relationshipId, expectedVersion: 1, confirmed: true,
    });

    app = await NestFactory.create(
      buildAppModule({ DATABASE_URL, API_PORT: 0, LOG_LEVEL: 'error', AUTH_MODE: 'dev-header' }),
      { logger: false },
    );
    await app.listen(0);
    baseUrl = await app.getUrl();
  }, 60_000);

  afterAll(async () => {
    await app?.close();
    await pool?.end();
  });

  it('health and readiness respond', async () => {
    expect((await call('/health', undefined)).status).toBe(200);
    expect((await call('/ready', undefined)).status).toBe(200);
  });

  it('NEGATIVE unauthenticated command returns the stable error envelope with 401', async () => {
    const res = await call(`/v1/participants/${patId}/consents`, undefined, {
      scope: 'study-participation', decision: 'Granted', templateVersion: 'ct_v1',
    });
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: { code: string; requestId: string; retryable: boolean } };
    expect(body.error.code).toBe('AUTHENTICATION_REQUIRED');
    expect(body.error.requestId).toBeDefined();
    expect(body.error.retryable).toBe(false);
  });

  it('participant records consent over HTTP; a stranger is refused with 403 (owner-only)', async () => {
    const ok = await call(`/v1/participants/${patId}/consents`, patAcc, {
      scope: 'study-participation', decision: 'Granted', templateVersion: 'ct_v1',
    });
    expect(ok.status).toBe(201);
    const denied = await call(`/v1/participants/${patId}/consents`, strangerAcc, {
      scope: 'study-participation', decision: 'Granted', templateVersion: 'ct_v1',
    });
    expect(denied.status).toBe(403);
    const body = (await denied.json()) as { error: { code: string } };
    expect(body.error.code).toBe('AUTHORISATION_DENIED');
  });

  it('withdrawal without confirmation maps to 409 CONFIRMATION_REQUIRED; confirmed withdrawal succeeds', async () => {
    const unconfirmed = await call(`/v1/participants/${patId}/consents/withdraw`, patAcc, {
      scope: 'study-participation', templateVersion: 'ct_v1', confirmed: false,
    });
    expect(unconfirmed.status).toBe(409);
    expect(((await unconfirmed.json()) as { error: { code: string } }).error.code).toBe('CONFIRMATION_REQUIRED');
    const confirmed = await call(`/v1/participants/${patId}/consents/withdraw`, patAcc, {
      scope: 'study-participation', templateVersion: 'ct_v1', confirmed: true,
    });
    expect(confirmed.status).toBe(201);
  });

  it('NEGATIVE thread without CommunicationBasis over HTTP returns 403 COMMUNICATION_BASIS_REQUIRED', async () => {
    const res = await call('/v1/conversation-threads', patAcc, {
      connectionId: 'conn_none', creatorParticipantId: patId,
    });
    expect(res.status).toBe(403);
    expect(((await res.json()) as { error: { code: string } }).error.code).toBe('COMMUNICATION_BASIS_REQUIRED');
  });

  it('report submission opens a ModerationCase atomically (human review, never automation alone)', async () => {
    const res = await call('/v1/reports', patAcc, {
      reporterId: patId, reportedActorId: strangerAcc, category: 'harassment', description: 'Unwanted contact',
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { data: { id: string; meta: { moderationCaseId: string } } };
    expect(body.data.id).toMatch(/^rep_/);
    expect(body.data.meta.moderationCaseId).toMatch(/^mc_/);
  });

  it('block requires explicit confirmation (409 first, 201 when confirmed)', async () => {
    const unconfirmed = await call('/v1/blocks', patAcc, {
      blockerId: patId, blockedActorId: strangerAcc, confirmed: false,
    });
    expect(unconfirmed.status).toBe(409);
    expect(((await unconfirmed.json()) as { error: { code: string } }).error.code).toBe('CONFIRMATION_REQUIRED');
    const confirmed = await call('/v1/blocks', patAcc, {
      blockerId: patId, blockedActorId: strangerAcc, confirmed: true,
    });
    expect(confirmed.status).toBe(201);
    expect(((await confirmed.json()) as { data: { id: string } }).data.id).toMatch(/^blk_/);
  });

  it('safety signal is accepted from any authenticated actor; unauthenticated is refused', async () => {
    const ok = await call('/v1/safety-signals', patAcc, {
      sourceType: 'Participant', category: 'wellbeing-concern', severity: 'Moderate', description: 'I feel unsafe',
    });
    expect(ok.status).toBe(201);
    expect(((await ok.json()) as { data: { id: string } }).data.id).toMatch(/^ss_/);
    const anon = await call('/v1/safety-signals', undefined, {
      sourceType: 'Participant', category: 'wellbeing-concern', severity: 'Moderate', description: 'x',
    });
    expect(anon.status).toBe(401);
  });

  it('NEGATIVE matching opt-in without open-matching consent is refused; granted consent enables it', async () => {
    const denied = await call('/v1/match-preferences', patAcc, {
      participantId: patId, declaredAttributes: { interests: ['gardening'] }, confirmed: true,
    });
    // Protected existence (ADR-050): the denial does not reveal resource
    // existence, so it surfaces as 404 rather than 403.
    expect(denied.status).toBe(404);
    expect(((await denied.json()) as { error: { code: string } }).error.code).toBe('RESOURCE_NOT_FOUND');

    const consent = await call(`/v1/participants/${patId}/consents`, patAcc, {
      scope: 'open-matching', decision: 'Granted', templateVersion: 'ct_v1',
    });
    expect(consent.status).toBe(201);
    const ok = await call('/v1/match-preferences', patAcc, {
      participantId: patId, declaredAttributes: { interests: ['gardening'] }, confirmed: true,
    });
    expect(ok.status).toBe(201);
    expect(((await ok.json()) as { data: { id: string } }).data.id).toMatch(/^mp_/);
  });

  it('NEGATIVE match decision on an unknown candidate returns 404 in the error envelope', async () => {
    const res = await call('/v1/match-candidates/cand_missing/decision', patAcc, {
      participantId: patId, expectedCandidateVersion: 1, decision: 'Interested', confirmed: true,
    });
    expect(res.status).toBe(404);
    expect(((await res.json()) as { error: { code: string } }).error.code).toBe('RESOURCE_NOT_FOUND');
  });

  it('safety triage over HTTP: confirmed human dispositions; conversion to SafetyEvent needs MFA', async () => {
    const sig = await call('/v1/safety-signals', patAcc, {
      sourceType: 'Participant', category: 'wellbeing-concern', severity: 'High', description: 'Triage me',
    });
    expect(sig.status).toBe(201);
    const signalId = ((await sig.json()) as { data: { id: string } }).data.id;

    // A participant probing triage learns nothing (protected existence).
    const outsider = await call(`/v1/safety-signals/${signalId}/triage`, patAcc, {
      disposition: 'Escalated', reason: 'x', confirmed: true,
    });
    expect(outsider.status).toBe(404);

    // Triage is confirmed work: unconfirmed is refused.
    const unconfirmed = await call(`/v1/safety-signals/${signalId}/triage`, safetyAcc, {
      disposition: 'Escalated', reason: 'Needs senior review', confirmed: false,
    });
    expect(unconfirmed.status).toBe(409);
    expect(((await unconfirmed.json()) as { error: { code: string } }).error.code).toBe('CONFIRMATION_REQUIRED');

    const escalated = await call(`/v1/safety-signals/${signalId}/triage`, safetyAcc, {
      disposition: 'Escalated', reason: 'Needs senior review', confirmed: true,
    });
    expect(escalated.status).toBe(201);

    // Conversion is the strongest authority: human + confirmed + MFA.
    const weakConvert = await call(`/v1/safety-signals/${signalId}/triage`, safetyAcc, {
      disposition: 'Converted to Safety Event', reason: 'Confirmed risk', confirmed: true,
    });
    expect(weakConvert.status).toBe(401);
    expect(((await weakConvert.json()) as { error: { code: string } }).error.code).toBe('STEP_UP_AUTHENTICATION_REQUIRED');

    const converted = await call(`/v1/safety-signals/${signalId}/triage`, safetyAcc, {
      disposition: 'Converted to Safety Event', reason: 'Confirmed risk', confirmed: true,
    }, { 'x-auth-strength': 'mfa' });
    expect(converted.status).toBe(201);
    const meta = ((await converted.json()) as { data: { meta: { safetyEventId?: string } } }).data.meta;
    expect(meta.safetyEventId).toMatch(/^se_/);

    // A terminal disposition cannot be triaged again.
    const again = await call(`/v1/safety-signals/${signalId}/triage`, safetyAcc, {
      disposition: 'Closed as Not a Safety Event', reason: 'no-op', confirmed: true,
    });
    expect(again.status).toBe(409);
    expect(((await again.json()) as { error: { code: string } }).error.code).toBe('INVALID_STATE_TRANSITION');
  });

  it('staff protocol chain over HTTP with separation of duties: submitter cannot approve', async () => {
    const proj = await call('/v1/research-projects', researcherAcc, { organisationId: 'org_api', title: 'HTTP Study' });
    expect(proj.status).toBe(201);
    const projectId = ((await proj.json()) as { data: { id: string } }).data.id;

    const draft = await call(`/v1/research-projects/${projectId}/protocol-versions`, researcherAcc, {
      title: 'Protocol v1', content: { design: 'pre-post' },
    });
    expect(draft.status).toBe(201);
    const versionId = ((await draft.json()) as { data: { id: string } }).data.id;

    expect((await call(`/v1/protocol-versions/${versionId}/submit`, researcherAcc, {})).status).toBe(201);

    // The researcher lacks protocol.approve entirely (and could never
    // self-approve, ADR-051).
    const selfApprove = await call(`/v1/protocol-versions/${versionId}/approve`, researcherAcc, { confirmed: true });
    expect(selfApprove.status).toBe(403);

    // Protocol approval is on the MFA list (Doc 14): password-strength
    // auth is stepped up (401), MFA succeeds.
    const weak = await call(`/v1/protocol-versions/${versionId}/approve`, approverAcc, { confirmed: true });
    expect(weak.status).toBe(401);
    expect(((await weak.json()) as { error: { code: string } }).error.code).toBe('STEP_UP_AUTHENTICATION_REQUIRED');
    const mfa = { 'x-auth-strength': 'mfa' };
    expect((await call(`/v1/protocol-versions/${versionId}/approve`, approverAcc, { confirmed: true }, mfa)).status).toBe(201);
    expect((await call(`/v1/protocol-versions/${versionId}/activate`, approverAcc, { confirmed: true })).status).toBe(201);
  });

  it('intervention chain over HTTP: draft, submit, MFA approve, activate; config refuses unapproved versions', async () => {
    const int = await call('/v1/interventions', researcherAcc, {
      interventionCode: `INT-E2E-${Date.now() % 1_000_000}`, name: 'Companionship programme',
    });
    expect(int.status).toBe(201);
    const intId = ((await int.json()) as { data: { id: string } }).data.id;

    const ver = await call(`/v1/interventions/${intId}/versions`, researcherAcc, {
      content: { sessions: 8, mode: 'group' },
    });
    expect(ver.status).toBe(201);
    const verId = ((await ver.json()) as { data: { id: string } }).data.id;

    // Draft versions are never a valid configuration basis.
    const early = await call('/v1/intervention-configurations', researcherAcc, {
      researchProjectId: 'rp_e2e_int', protocolVersionId: 'pv_e2e_ref', interventionVersionId: verId,
    });
    expect(early.status).toBe(409);
    expect(((await early.json()) as { error: { code: string } }).error.code).toBe('RESOURCE_STATE_BLOCKED');

    expect((await call(`/v1/intervention-versions/${verId}/submit`, researcherAcc, {})).status).toBe(201);
    // Intervention approval is on the MFA list, like protocol approval.
    const weak = await call(`/v1/intervention-versions/${verId}/approve`, approverAcc, { confirmed: true });
    expect(weak.status).toBe(401);
    expect(((await weak.json()) as { error: { code: string } }).error.code).toBe('STEP_UP_AUTHENTICATION_REQUIRED');
    const mfa = { 'x-auth-strength': 'mfa' };
    expect((await call(`/v1/intervention-versions/${verId}/approve`, approverAcc, { confirmed: true }, mfa)).status).toBe(201);
    expect((await call(`/v1/intervention-versions/${verId}/activate`, approverAcc, { confirmed: true })).status).toBe(201);

    const cfg = await call('/v1/intervention-configurations', researcherAcc, {
      researchProjectId: 'rp_e2e_int', protocolVersionId: 'pv_e2e_ref', interventionVersionId: verId,
    });
    expect(cfg.status).toBe(201);
    expect(((await cfg.json()) as { data: { id: string } }).data.id).toMatch(/^ic_/);
  });

  it('dataset lock over HTTP is human+MFA: password-strength auth is refused, MFA succeeds', async () => {
    const def = await call('/v1/dataset-definitions', researcherAcc, {
      researchProjectId: 'rp_http_ds', name: 'primary-outcomes', variables: { v1: 'mood' },
    });
    expect(def.status).toBe(201);
    const defId = ((await def.json()) as { data: { id: string } }).data.id;
    expect((await call(`/v1/dataset-definitions/${defId}/approve`, approverAcc, { confirmed: true })).status).toBe(201);

    const ver = await call(`/v1/dataset-definitions/${defId}/versions`, researcherAcc, {
      sourceDescription: 'synthetic extract', rowCount: 10,
    });
    expect(ver.status).toBe(201);
    const verId = ((await ver.json()) as { data: { id: string } }).data.id;
    expect((await call(`/v1/dataset-versions/${verId}/complete-quality-review`, researcherAcc, {})).status).toBe(201);

    const weak = await call(`/v1/dataset-versions/${verId}/lock`, approverAcc, { confirmed: true });
    expect(weak.status).toBe(401);
    expect(((await weak.json()) as { error: { code: string } }).error.code).toBe('STEP_UP_AUTHENTICATION_REQUIRED');

    const locked = await call(`/v1/dataset-versions/${verId}/lock`, approverAcc, { confirmed: true }, {
      'x-auth-strength': 'mfa',
    });
    expect(locked.status).toBe(201);
    expect(((await locked.json()) as { data: { id: string } }).data.id).toMatch(/^dl_/);
  });

  it('M14 report and export over HTTP: immutable approved versions; export needs MFA approval before generation; three-state delivery', async () => {
    const rpt = await call('/v1/research-reports', researcherAcc, {
      researchProjectId: 'rp_e2e_m14', title: 'Pilot outcomes', reportType: 'ResearchReport',
    });
    expect(rpt.status).toBe(201);
    const reportId = ((await rpt.json()) as { data: { id: string } }).data.id;
    const ver = await call(`/v1/research-reports/${reportId}/versions`, researcherAcc, { content: { sections: ['results'] } });
    expect(ver.status).toBe(201);
    const verId = ((await ver.json()) as { data: { id: string } }).data.id;
    // The author cannot approve their own version.
    expect((await call(`/v1/report-versions/${verId}/approve`, researcherAcc, { confirmed: true })).status).toBe(403);
    expect((await call(`/v1/report-versions/${verId}/approve`, approverAcc, { confirmed: true })).status).toBe(201);

    const exr = await call('/v1/export-requests', researcherAcc, {
      purpose: 'External statistician review', recipient: 'stats-partner',
      sources: ['dv_locked_e2e'], deIdentification: 'Pseudonymised',
    });
    expect(exr.status).toBe(201);
    const exportId = ((await exr.json()) as { data: { id: string } }).data.id;

    // No generation before approval.
    const early = await call(`/v1/export-requests/${exportId}/generate`, researcherAcc, {});
    expect(early.status).toBe(409);
    expect(((await early.json()) as { error: { code: string } }).error.code).toBe('APPROVAL_REQUIRED');

    // Export approval is MFA-tier.
    const weak = await call(`/v1/export-requests/${exportId}/decide`, approverAcc, { decision: 'Approved', confirmed: true });
    expect(weak.status).toBe(401);
    expect((await call(`/v1/export-requests/${exportId}/decide`, approverAcc, {
      decision: 'Approved', confirmed: true,
    }, { 'x-auth-strength': 'mfa' })).status).toBe(201);

    const gen = await call(`/v1/export-requests/${exportId}/generate`, researcherAcc, {});
    expect(gen.status).toBe(201);
    expect(((await gen.json()) as { data: { meta: { manifestHash: string } } }).data.meta.manifestHash).toMatch(/^[0-9a-f]{64}$/);

    // Generated ≠ Delivered ≠ Received: skipping a state is refused.
    const skip = await call(`/v1/export-requests/${exportId}/delivery`, researcherAcc, { state: 'Received' });
    expect(skip.status).toBe(409);
    expect((await call(`/v1/export-requests/${exportId}/delivery`, researcherAcc, { state: 'Delivered' })).status).toBe(201);
    expect((await call(`/v1/export-requests/${exportId}/delivery`, researcherAcc, { state: 'Received' })).status).toBe(201);
  });

  it('participant portability export over HTTP is owner-only and confirmed', async () => {
    const outsider = await call(`/v1/participants/${patId}/export-requests`, strangerAcc, {
      purpose: 'my records', confirmed: true,
    });
    expect(outsider.status).toBe(404);
    const unconfirmed = await call(`/v1/participants/${patId}/export-requests`, patAcc, {
      purpose: 'my records', confirmed: false,
    });
    expect(unconfirmed.status).toBe(409);
    const ok = await call(`/v1/participants/${patId}/export-requests`, patAcc, {
      purpose: 'my records', confirmed: true,
    });
    expect(ok.status).toBe(201);
    expect(((await ok.json()) as { data: { id: string } }).data.id).toMatch(/^exr_/);
  });

  it('M15 approval over HTTP: exact artefact version, MFA decision, requester can never decide', async () => {
    const reqRes = await call('/v1/approvals', researcherAcc, {
      artefactType: 'ProtocolVersion', artefactId: 'pv_e2e_gov', artefactVersion: 2,
    });
    expect(reqRes.status).toBe(201);
    const approvalId = ((await reqRes.json()) as { data: { id: string } }).data.id;

    const weak = await call(`/v1/approvals/${approvalId}/decide`, approverAcc, {
      decision: 'Approved', reason: 'Meets criteria', confirmed: true,
    });
    expect(weak.status).toBe(401);
    expect(((await weak.json()) as { error: { code: string } }).error.code).toBe('STEP_UP_AUTHENTICATION_REQUIRED');

    const decided = await call(`/v1/approvals/${approvalId}/decide`, approverAcc, {
      decision: 'Approved', reason: 'Meets criteria', confirmed: true,
    }, { 'x-auth-strength': 'mfa' });
    expect(decided.status).toBe(201);

    // Decided approvals are terminal.
    const again = await call(`/v1/approvals/${approvalId}/decide`, approverAcc, {
      decision: 'Rejected', reason: 'flip', confirmed: true,
    }, { 'x-auth-strength': 'mfa' });
    expect(again.status).toBe(409);
  });

  it('M15 break-glass over HTTP: MFA execution, mandatory review by someone else; governance hold lifecycle', async () => {
    const bg = await call('/v1/break-glass', adminAcc, {
      reason: 'Incident 7', scope: 'read audit trail pt_x', expiresAt: '2027-01-01T00:00:00Z', confirmed: true,
    }, { 'x-auth-strength': 'mfa' });
    expect(bg.status).toBe(201);
    const bgId = ((await bg.json()) as { data: { id: string } }).data.id;

    // The executor cannot review their own break-glass — and the admin
    // also lacks the review permission by role (disjoint by design).
    const selfReview = await call(`/v1/break-glass/${bgId}/review`, adminAcc, {
      outcome: 'Justified', confirmed: true,
    });
    expect(selfReview.status).toBe(403);

    expect((await call(`/v1/break-glass/${bgId}/review`, privacyAcc, {
      outcome: 'Justified', confirmed: true,
    })).status).toBe(201);

    const hold = await call('/v1/governance-holds', privacyAcc, {
      artefactType: 'DatasetVersion', artefactId: 'dv_e2e_hold', reason: 'Pending privacy review', confirmed: true,
    });
    expect(hold.status).toBe(201);
    const holdId = ((await hold.json()) as { data: { id: string } }).data.id;
    expect((await call(`/v1/governance-holds/${holdId}/lift`, privacyAcc, {
      liftReason: 'Review complete', confirmed: true,
    })).status).toBe(201);
  });

  it('relationship over HTTP: proposal grants nothing until the owner approves it, version-bound', async () => {
    const prop = await call('/v1/relationships', adminAcc, {
      participantId: patId, relatedActorId: researcherAcc, relationshipType: 'Friend',
      permittedActions: ['participant.view-shared'],
    });
    expect(prop.status).toBe(201);
    const relId = ((await prop.json()) as { data: { id: string } }).data.id;

    // Nobody approves on the participant's behalf.
    const outsider = await call(`/v1/relationships/${relId}/approve`, strangerAcc, {
      expectedVersion: 1, confirmed: true,
    });
    expect(outsider.status).toBe(403);

    const unconfirmed = await call(`/v1/relationships/${relId}/approve`, patAcc, {
      expectedVersion: 1, confirmed: false,
    });
    expect(unconfirmed.status).toBe(409);
    expect(((await unconfirmed.json()) as { error: { code: string } }).error.code).toBe('CONFIRMATION_REQUIRED');

    // Approval binds the exact record version the participant saw.
    const stale = await call(`/v1/relationships/${relId}/approve`, patAcc, {
      expectedVersion: 99, confirmed: true,
    });
    expect(stale.status).toBe(412);
    expect(((await stale.json()) as { error: { code: string } }).error.code).toBe('VERSION_CONFLICT');

    expect((await call(`/v1/relationships/${relId}/approve`, patAcc, {
      expectedVersion: 1, confirmed: true,
    })).status).toBe(201);

    // The owner can revoke at any time (version moved to 2 on approval).
    expect((await call(`/v1/relationships/${relId}/revoke`, patAcc, { expectedVersion: 2 })).status).toBe(201);
  });

  let archiveId: string;

  it('life story over HTTP: testimony binds the exact version; Internet Public stays disabled', async () => {
    const arch = await call('/v1/life-story/archives', patAcc, { participantId: patId });
    expect(arch.status).toBe(201);
    archiveId = ((await arch.json()) as { data: { id: string } }).data.id;

    // A stranger probing the archive learns nothing.
    const outsider = await call(`/v1/life-story/archives/${archiveId}/items`, strangerAcc, {
      title: 'x', contentText: 'x', sourceType: 'ParticipantAuthored',
    });
    expect(outsider.status).toBe(404);

    const item = await call(`/v1/life-story/archives/${archiveId}/items`, patAcc, {
      title: '花园的夏天', contentText: '那年夏天我们种了玫瑰。', sourceType: 'ParticipantAuthored',
    });
    expect(item.status).toBe(201);
    const itemBody = (await item.json()) as { data: { id: string; meta: { versionId: string } } };
    const itemId = itemBody.data.id;
    const versionId = itemBody.data.meta.versionId;

    // Confirming a version that is not the one shown is a version conflict.
    const wrong = await call(`/v1/life-story/items/${itemId}/confirm-testimony`, patAcc, {
      versionId: 'lsv_other', confirmed: true,
    });
    expect(wrong.status).toBe(412);
    expect(((await wrong.json()) as { error: { code: string } }).error.code).toBe('VERSION_CONFLICT');

    expect((await call(`/v1/life-story/items/${itemId}/confirm-testimony`, patAcc, {
      versionId, confirmed: true,
    })).status).toBe(201);

    // Internet Public is double-disabled for the first Pilot (ADR-020).
    const internet = await call(`/v1/life-story/items/${itemId}/visibility`, patAcc, {
      visibility: 'Internet Public', confirmed: true,
    });
    expect(internet.status).toBe(400);
    expect(((await internet.json()) as { error: { code: string } }).error.code).toBe('UNSUPPORTED_CAPABILITY');

    expect((await call(`/v1/life-story/items/${itemId}/visibility`, patAcc, {
      visibility: 'Connections', confirmed: true,
    })).status).toBe(201);
  });

  it('supporter contribution over HTTP needs consent; acceptance never becomes testimony', async () => {
    // One archive per participant — reuses the archive from the previous test.
    const item = await call(`/v1/life-story/archives/${archiveId}/items`, patAcc, {
      title: '老照片', contentText: '第一稿。', sourceType: 'ParticipantAuthored',
    });
    const itemId = ((await item.json()) as { data: { id: string } }).data.id;

    // Relationship exists (seeded) but the supporter-contribution consent
    // does not — denied with hidden existence.
    const early = await call(`/v1/life-story/archives/${archiveId}/contributions`, supporterAcc, {
      itemId, contentText: '我记得那天的玫瑰。',
    });
    expect(early.status).toBe(404);

    expect((await call(`/v1/participants/${patId}/consents`, patAcc, {
      scope: 'supporter-contribution', decision: 'Granted', templateVersion: 'ct_v1',
    })).status).toBe(201);

    const prop = await call(`/v1/life-story/archives/${archiveId}/contributions`, supporterAcc, {
      itemId, contentText: '我记得那天的玫瑰。',
    });
    expect(prop.status).toBe(201);
    const contributionId = ((await prop.json()) as { data: { id: string } }).data.id;

    // Only the archive owner reviews — the supporter cannot accept their own.
    const selfReview = await call(`/v1/life-story/contributions/${contributionId}/review`, supporterAcc, {
      itemId, decision: 'Accepted',
    });
    expect(selfReview.status).toBe(404);

    const accepted = await call(`/v1/life-story/contributions/${contributionId}/review`, patAcc, {
      itemId, decision: 'Accepted',
    });
    expect(accepted.status).toBe(201);
    const meta = ((await accepted.json()) as { data: { meta: { versionId?: string } } }).data.meta;
    expect(meta.versionId).toBeDefined();
    // The accepted contribution is a SupporterContribution version, not testimony.
    const v = await pool.query('SELECT source_type, testimony_state FROM life_story.item_versions WHERE id = $1', [meta.versionId]);
    expect(v.rows[0].source_type).toBe('SupporterContribution');
    expect(v.rows[0].testimony_state).toBe('NotTestimony');
  });

  it('owner can list own connections, threads and candidates; a stranger gets protected-existence 404', async () => {
    const otherId = 'pt_e2e_other';
    const candId = `cand_e2e_${Date.now()}`;
    const maId = `ma_e2e_${Date.now()}`;
    const connId = `conn_e2e_${Date.now()}`;
    const threadId = `th_e2e_${Date.now()}`;
    await pool.query(
      `INSERT INTO community_social.match_candidates (id, participant_a_id, participant_b_id, match_explanation, expires_at)
       VALUES ($1, $2, $3, '你们都选择了园艺作为兴趣', now() + interval '7 days')`,
      [candId, patId, otherId],
    );
    await pool.query(
      `INSERT INTO community_social.mutual_acceptances (id, match_candidate_id, participant_a_id, participant_b_id, acceptance_state, policy_version, effective_until, connection_id)
       VALUES ($1, $2, $3, $4, 'Consumed', 'policy_v0.2.0', now() + interval '7 days', $5)`,
      [maId, candId, patId, otherId, connId],
    );
    await pool.query(
      `INSERT INTO community_social.connections (id, mutual_acceptance_id, participant_a_id, participant_b_id)
       VALUES ($1, $2, $3, $4)`,
      [connId, maId, patId, otherId],
    );
    await pool.query(
      `INSERT INTO community_social.conversation_threads (id, basis_type, basis_reference, participant_a_id, participant_b_id)
       VALUES ($1, 'ActiveConnection', $2, $3, $4)`,
      [threadId, connId, patId, otherId],
    );

    const conns = await call(`/v1/participants/${patId}/connections`, patAcc);
    expect(conns.status).toBe(200);
    const connBody = (await conns.json()) as { data: { id: string; attributes: { otherParticipantId: string } }[] };
    expect(connBody.data.some((c) => c.id === connId && c.attributes.otherParticipantId === otherId)).toBe(true);

    const threads = await call(`/v1/participants/${patId}/conversation-threads`, patAcc);
    expect(threads.status).toBe(200);
    expect(((await threads.json()) as { data: { id: string }[] }).data.some((t) => t.id === threadId)).toBe(true);

    // Candidate listing shows the explanation but never the other
    // participant's identity (identity only after mutual acceptance).
    const cands = await call(`/v1/participants/${patId}/match-candidates`, patAcc);
    expect(cands.status).toBe(200);
    const candBody = (await cands.json()) as { data: { id: string; attributes: Record<string, unknown> }[] };
    const cand = candBody.data.find((c) => c.id === candId);
    expect(cand?.attributes['explanation']).toContain('园艺');
    expect(JSON.stringify(candBody)).not.toContain(otherId.replace('pt_', 'pt_') + '"');
    expect(Object.keys(cand?.attributes ?? {})).not.toContain('otherParticipantId');

    // A stranger probing someone else's lists learns nothing, not even
    // that the participant exists (ADR-050).
    const denied = await call(`/v1/participants/${patId}/connections`, strangerAcc);
    expect(denied.status).toBe(404);
    expect(((await denied.json()) as { error: { code: string } }).error.code).toBe('RESOURCE_NOT_FOUND');
  });
});

describe.skipIf(dbAvailable)('HTTP API (skipped)', () => {
  it('skipped because no PostgreSQL is reachable', () => { expect(dbAvailable).toBe(false); });
});
