import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import pg from 'pg';
import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FixedClock, createRequestContext } from '@platform/kernel';
import { createPool, migrate } from '@platform/database';
import { POLICY_V1 } from '@platform/policy';
import { assignRole, createOrganisation, createRoleAssignmentQuery, createUserAccount, seedBootstrapAdministrator } from '@platform/m01-identity-org';
import { createParticipantQuery, registerParticipant } from '@platform/m02-participant';
import { createPermissionService } from '@platform/m03-consent-permission';
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
  let researcherAcc: string, approverAcc: string, safetyAcc: string;

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
