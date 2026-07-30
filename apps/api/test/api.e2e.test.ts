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

  const call = (path: string, actor: string | undefined, body?: object) =>
    fetch(`${baseUrl}${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: {
        'content-type': 'application/json',
        ...(actor === undefined ? {} : { 'x-actor-id': actor }),
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
});

describe.skipIf(dbAvailable)('HTTP API (skipped)', () => {
  it('skipped because no PostgreSQL is reachable', () => { expect(dbAvailable).toBe(false); });
});
