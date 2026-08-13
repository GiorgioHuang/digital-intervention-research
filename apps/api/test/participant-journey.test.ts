import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import pg from 'pg';
import { NestFactory } from '@nestjs/core';
import type { INestApplication } from '@nestjs/common';
import { createPool, migrate, type Pool } from '@platform/database';
import { buildAppModule } from '../src/app.module.js';
import { createSessionStore } from '../src/auth/session-store.js';

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

/**
 * The whole participant workspace, opened by somebody who has just
 * registered and has nothing.
 *
 * This exists because reasoning about it screen by screen is not reliable.
 * Looking for what a self-registered participant could reach, I checked
 * the permission catalogue and found two actions denied to them —
 * `relationship.view-own` and `contribution.view-own`, both needing a role
 * they do not hold — and was about to grant the Participant role to fix
 * it. Both were false alarms: those actions belong to the SUPPORTER's
 * screens, and the participant's own "who has access to me" asks
 * `participant.view-own`, which is owner-permitted. Testing an action in
 * isolation says nothing about whether a screen opens.
 *
 * So this walks the endpoints the participant app actually calls, as the
 * person who has the least: an account with no roles, a participant record
 * of their own, no consents, no enrolments, no relationships. Every one of
 * them must open. A screen that refuses somebody looking at their own
 * empty account is the platform telling a person they are not allowed to
 * be themselves.
 *
 * Every test file in this package migrates and writes to ONE shared
 * database, so they cannot run at the same time: two `migrate()` calls
 * collide on the migration lock, and two suites writing relationships see
 * each other's rows. That race existed before this file — I hit it once and
 * wrongly called it transient — but a third file made it reliable. The
 * package's test script therefore passes `--no-file-parallelism`, the same
 * way m03 does for the same reason. Adding a fourth file is fine; removing
 * that flag is not.
 */
describe.skipIf(!dbAvailable)('a first-time participant opens every screen', () => {
  let app: INestApplication;
  let base: string;
  let pool: Pool;
  let account: string;
  let participant: string;

  beforeAll(async () => {
    await migrate({ databaseUrl: DATABASE_URL, direction: 'up' });
    pool = createPool({ connectionString: DATABASE_URL, applicationName: 'participant-journey' });
    const sessions = createSessionStore({
      pool,
      sessionTtlMinutes: 60,
      stepUpTtlMinutes: 10,
      mfaDomains: [],
      allowSelfSignup: true,
    });
    const uniq = `${Date.now()}${Math.trunc(process.hrtime()[1] / 1000)}`;
    const result = await sessions.signIn(
      {
        issuer: 'https://accounts.google.com',
        subject: `journey-${uniq}`,
        email: `journey${uniq}@example.org`,
        emailVerified: true,
        issuedAt: Math.floor(Date.now() / 1000),
      },
      `nonce-journey-${uniq}`,
    );
    account = result.userAccountId;
    participant = (
      await pool.query<{ id: string }>(
        `SELECT id FROM participant_profile.participants WHERE user_account_id = $1`,
        [account],
      )
    ).rows[0]!.id;

    app = await NestFactory.create(
      buildAppModule({
        DATABASE_URL,
        API_PORT: 0,
        LOG_LEVEL: 'error',
        // The stub, so the walk needs no Google round trip. The actor is
        // trusted from the header; the permission engine behind it is the
        // same one AUTH_MODE=google reaches, which is the part under test.
        AUTH_MODE: 'dev-header',
        KNOWLEDGE_PLATFORM_MODE: 'simulator',
      } as never),
      { logger: false },
    );
    await app.listen(0);
    base = await app.getUrl();
  }, 60_000);

  afterAll(async () => {
    await app?.close();
    await pool?.end();
  });

  const SCREENS = [
    ['their consent choices', 'consents'],
    ['who has access to them', 'relationships'],
    ['what they are enrolled in', 'enrolments'],
    ['their life story', 'life-story'],
    ['contributions waiting for their review', 'life-story/contributions/awaiting-review'],
    ['their requests for a copy of their data', 'export-requests'],
    ['who they have blocked', 'blocks'],
    ['the communities they are in', 'community-spaces'],
    ['their connections', 'connections'],
    ['their conversations', 'conversation-threads'],
    ['people suggested to them', 'match-candidates'],
    ['their own posts', 'social-posts'],
    ['people they have invited', 'supporter-invitations'],
  ] as const;

  it.each(SCREENS)('opens %s', async (_label, path) => {
    const res = await fetch(`${base}/v1/participants/${participant}/${path}`, {
      headers: { 'x-actor-id': account, 'x-platform-client': 'web' },
    });
    const body = res.ok ? '' : JSON.stringify(await res.json());
    expect(res.status, `${path} refused a participant looking at their own account: ${body}`).toBe(200);
  });

  /**
   * Not a screen — the attachments endpoint refuses to guess which record
   * is being asked about, because answering an unnamed one with an empty
   * list reads as "this record has no files". The client always names it.
   */
  it('refuses to list attachments without saying which record', async () => {
    const res = await fetch(`${base}/v1/participants/${participant}/objects`, {
      headers: { 'x-actor-id': account, 'x-platform-client': 'web' },
    });
    expect(res.status).toBe(400);
  });
});
