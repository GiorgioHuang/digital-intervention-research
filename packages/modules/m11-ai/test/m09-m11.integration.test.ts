import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import pg from 'pg';
import { FixedClock, createRequestContext } from '@platform/kernel';
import { createPool, migrate } from '@platform/database';
import { POLICY_V1 } from '@platform/policy';
import {
  assignRole,
  createOrganisation,
  createRoleAssignmentQuery,
  createUserAccount,
  seedBootstrapAdministrator,
  type M01Deps,
} from '@platform/m01-identity-org';
import { createPermissionService } from '@platform/m03-consent-permission';
import { recordSafetySignal, triageSafetySignal, type M09Deps } from '@platform/m09-safety';
import {
  createModelGateway,
  createModelProviderSimulator,
  createToolGateway,
  PROHIBITED_AI_ACTIONS,
} from '../src/index.js';

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

describe.skipIf(!dbAvailable)('M09 safety + M11 AI governance (integration)', () => {
  let pool: pg.Pool;
  const clock = new FixedClock('2026-07-30T12:00:00Z');
  let m01: M01Deps, m09: M09Deps;
  let adminId: string, orgId: string, reviewerId: string;
  const aiCtx = () => createRequestContext({ actor: { type: 'service-account', id: 'sa_ai_orchestrator' } });
  const ctx = (id: string) => createRequestContext({ actor: { type: 'user', id } });

  beforeAll(async () => {
    await migrate({ databaseUrl: DATABASE_URL, direction: 'up' });
    pool = createPool({ connectionString: DATABASE_URL, applicationName: 'm11-tests' });
    const permissions = createPermissionService({
      pool,
      clock,
      policy: POLICY_V1,
      roleAssignments: createRoleAssignmentQuery(pool),
    });
    const checkPermission = permissions.evaluate.bind(permissions);
    m01 = { pool, clock, checkPermission };
    m09 = { pool, clock, checkPermission };

    ({ userAccountId: adminId } = await seedBootstrapAdministrator(pool, clock, { displayName: 'Admin' }));
    ({ organisationId: orgId } = await createOrganisation(m01, ctx(adminId), { name: 'Safety Org' }));
    const adminCtx = createRequestContext({ actor: { type: 'user', id: adminId }, organisationId: orgId });
    ({ userAccountId: reviewerId } = await createUserAccount(m01, adminCtx, { displayName: 'Sage' }));
    await assignRole(m01, adminCtx, { userAccountId: reviewerId, role: 'SafetyReviewer', confirmed: true });
  }, 30_000);

  afterAll(async () => {
    await pool?.end();
  });

  let signalId: string;

  it('AI (automation) may raise a SafetySignal — emitted as AISafetySignalRaised', async () => {
    ({ safetySignalId: signalId } = await recordSafetySignal(m09, aiCtx(), {
      sourceType: 'AI',
      category: 'distress-language',
      severity: 'High',
      description: 'Model flagged possible acute distress in a drafted message.',
    }));
    const evt = await pool.query(
      `SELECT event_type FROM platform_kernel.outbox_messages WHERE aggregate_id = $1`,
      [signalId],
    );
    expect(evt.rows[0].event_type).toBe('AISafetySignalRaised');
  });

  it('NEGATIVE automation cannot confirm a SafetyEvent (ATR-017)', async () => {
    await expect(
      triageSafetySignal(m09, aiCtx(), {
        safetySignalId: signalId,
        disposition: 'Converted to Safety Event',
        reason: 'auto',
        confirmed: true,
      }),
    ).rejects.toMatchObject({ code: 'AUTHORISATION_DENIED' });
    const events = await pool.query(`SELECT count(*)::int AS n FROM safety.safety_events`);
    expect(events.rows[0].n).toBe(0);
  });

  it('NEGATIVE human without MFA gets step-up on conversion', async () => {
    await expect(
      triageSafetySignal(m09, ctx(reviewerId), {
        safetySignalId: signalId,
        disposition: 'Converted to Safety Event',
        reason: 'confirmed risk',
        confirmed: true,
      }),
    ).rejects.toMatchObject({ code: 'STEP_UP_AUTHENTICATION_REQUIRED' });
  });

  it('human SafetyReviewer with MFA converts the signal; SafetyEvent exists exactly once', async () => {
    const mfaCtx = createRequestContext({ actor: { type: 'user', id: reviewerId }, authStrength: 'mfa' });
    const { safetyEventId } = await triageSafetySignal(m09, mfaCtx, {
      safetySignalId: signalId,
      disposition: 'Converted to Safety Event',
      reason: 'reviewed transcript; risk confirmed',
      confirmed: true,
    });
    expect(safetyEventId).toBeDefined();
    const row = await pool.query(`SELECT confirmed_by_actor_id FROM safety.safety_events WHERE id = $1`, [safetyEventId]);
    expect(row.rows[0].confirmed_by_actor_id).toBe(reviewerId);
    // Same signal cannot be converted twice.
    await expect(
      triageSafetySignal(m09, mfaCtx, {
        safetySignalId: signalId,
        disposition: 'Converted to Safety Event',
        reason: 'again',
        confirmed: true,
      }),
    ).rejects.toMatchObject({ code: 'INVALID_STATE_TRANSITION' });
  });

  it('closing a signal as not-an-event requires a reason', async () => {
    const { safetySignalId } = await recordSafetySignal(m09, ctx(reviewerId), {
      sourceType: 'Staff',
      category: 'technical',
      severity: 'Low',
      description: 'Looked like distress; was a typo.',
    });
    await expect(
      triageSafetySignal(m09, ctx(reviewerId), {
        safetySignalId,
        disposition: 'Closed as Not a Safety Event',
        reason: '  ',
        confirmed: true,
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
    await triageSafetySignal(m09, ctx(reviewerId), {
      safetySignalId,
      disposition: 'Closed as Not a Safety Event',
      reason: 'confirmed benign after review',
      confirmed: true,
    });
  });

  it('Model Gateway: approved alias resolves; unknown alias fails closed (no silent substitution)', async () => {
    const gateway = createModelGateway(createModelProviderSimulator(), {
      'participant-support-low-risk': 'sim-model-a',
    });
    const res = await gateway.invoke({ alias: 'participant-support-low-risk', instructions: 'x', input: 'hello' });
    expect(res.resolvedModelId).toBe('sim-model-a');
    expect(res.epistemicType).toBe('Draft');
    await expect(
      gateway.invoke({ alias: 'unapproved-alias', instructions: 'x', input: 'y' }),
    ).rejects.toMatchObject({ code: 'DEPENDENCY_UNAVAILABLE' });
  });

  it('Tool Gateway: allowlisted tool executes and is recorded; unregistered tool refused', async () => {
    const toolGateway = createToolGateway({ pool, clock }, [
      {
        toolId: 'raise_safety_signal',
        actionLevel: 4,
        execute: async (args) =>
          recordSafetySignal(m09, aiCtx(), {
            sourceType: 'AI',
            category: String(args['category']),
            severity: 'Moderate',
            description: String(args['description']),
          }),
      },
    ]);
    const result = (await toolGateway.invoke(aiCtx(), 'raise_safety_signal', {
      category: 'scam-pattern',
      description: 'possible scam language',
    })) as { safetySignalId: string };
    expect(result.safetySignalId).toBeDefined();

    await expect(toolGateway.invoke(aiCtx(), 'delete_everything', {})).rejects.toMatchObject({
      code: 'AUTHORISATION_DENIED',
    });
    const rec = await pool.query(
      `SELECT outcome, refusal_reason FROM ai_companion.ai_tool_invocations WHERE tool_id = 'delete_everything'`,
    );
    expect(rec.rows[0]).toEqual({ outcome: 'Refused', refusal_reason: 'tool-not-in-allowlist' });
  });

  it('NEGATIVE every Level-5 prohibited action is refused BY NAME, even if someone registers it as a tool', async () => {
    const maliciousTools = PROHIBITED_AI_ACTIONS.map((toolId) => ({
      toolId,
      actionLevel: 4 as const,
      execute: async () => 'should never run',
    }));
    const toolGateway = createToolGateway({ pool, clock }, maliciousTools);
    for (const action of PROHIBITED_AI_ACTIONS) {
      await expect(toolGateway.invoke(aiCtx(), action, {})).rejects.toMatchObject({
        code: 'AUTHORISATION_DENIED',
      });
    }
    const rec = await pool.query(
      `SELECT count(*)::int AS n FROM ai_companion.ai_tool_invocations
        WHERE refusal_reason = 'level-5-prohibited-autonomous-action'`,
    );
    expect(rec.rows[0].n).toBe(PROHIBITED_AI_ACTIONS.length);
  });
});

describe.skipIf(dbAvailable)('M09+M11 integration (skipped)', () => {
  it('skipped because no PostgreSQL is reachable', () => {
    expect(dbAvailable).toBe(false);
  });
});
