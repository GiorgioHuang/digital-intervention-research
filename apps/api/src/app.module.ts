import { Module, type MiddlewareConsumer, type NestModule } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { SystemClock } from '@platform/kernel';
import { createPool } from '@platform/database';
import { POLICY_V1 } from '@platform/policy';
import { createAccountNameQuery, createRoleAssignmentQuery } from '@platform/m01-identity-org';
import { mayReadLifeStoryItem } from '@platform/m17-life-story';
import { createParticipantQuery } from '@platform/m02-participant';
import { createPermissionService } from '@platform/m03-consent-permission';
import { createProtocolVersionQuery } from '@platform/m04-research-design';
import { createKnowledgePlatformMcpClient, createKnowledgePlatformSimulator } from '@platform/m10-evidence';
import { createBlobStore } from '@platform/m16-integration';
import { createBlockQuery } from '@platform/m18-community-social';
import type { ApiConfig } from './config.js';
import { AUTH_MODE, BLOB_STORE, CONTACT_READY, HealthController, PG_POOL } from './health.controller.js';
import { CONTACT_RELAY, ContactController } from './contact.controller.js';
import type { ContactRelayConfig } from './contact-relay.js';
import { API_DEPS, CommandController, type ApiDeps } from './controllers.js';
import { StaffCommandController } from './staff-controllers.js';
import { PlatformErrorFilter } from './error-filter.js';
import { accessTokenMiddleware, requestContextMiddleware } from './http-context.js';
import { AUTH_DEPS, AuthController, type AuthDeps } from './auth/auth.controller.js';
import { createGoogleVerifier } from './auth/google-token.js';
import { createSessionStore } from './auth/session-store.js';

/** Comma-separated domain lists, lowercased; empty entries dropped. */
function splitDomains(raw: string | undefined): string[] {
  return (raw ?? '')
    .split(',')
    .map((d) => d.trim().toLowerCase())
    .filter((d) => d !== '');
}

export function buildAppModule(config: ApiConfig) {
  const pool = createPool({ connectionString: config.DATABASE_URL, applicationName: 'api' });
  const clock = new SystemClock();
  const permissions = createPermissionService({
    pool,
    clock,
    policy: POLICY_V1,
    roleAssignments: createRoleAssignmentQuery(pool),
    participantIdentity: createParticipantQuery(pool),
    blocks: createBlockQuery(pool),
  });
  const checkPermission = permissions.evaluate.bind(permissions);
  const moduleDeps = { pool, clock, checkPermission };
  /*
   * Where uploaded bytes go. Built once and reported on /ready, because
   * this process is the one that serves an upload and it used to choose
   * in silence.
   */
  const blobs = createBlobStore(process.env, pool);
  console.log(JSON.stringify({ msg: 'object storage', blobStore: blobs.description }));
  // ADR-052: the external Healthy Aging Knowledge Graph stays behind the
  // KnowledgePlatformPort ACL; 'mcp' mode makes real JSON-RPC calls.
  const knowledgePlatform =
    config.KNOWLEDGE_PLATFORM_MODE === 'mcp'
      ? createKnowledgePlatformMcpClient({ baseUrl: config.KNOWLEDGE_MCP_URL! })
      : createKnowledgePlatformSimulator();
  const deps: ApiDeps = {
    pool,
    clock,
    permissions,
    accountNames: createAccountNameQuery(pool),
    participantNames: createParticipantQuery(pool),
    m01: moduleDeps,
    m02: moduleDeps,
    m03: { pool, clock, permissions },
    m04: moduleDeps,
    m05: {
      pool,
      clock,
      permissions,
      participants: createParticipantQuery(pool),
      protocolVersions: createProtocolVersionQuery(pool),
    },
    m06: moduleDeps,
    m07: moduleDeps,
    m09: moduleDeps,
    m10: { ...moduleDeps, knowledgePlatform },
    m12: moduleDeps,
    m13: moduleDeps,
    m14: moduleDeps,
    m15: moduleDeps,
    /*
     * The port that lets a photograph follow the memory it is on.
     *
     * M16 knows nothing about life stories and must not learn — a module
     * that reads `life_story.items` to decide who may see a file has put
     * the life story's rules in the storage layer, where the next reader
     * of those rules will not look. So the question is asked here, at the
     * boundary where the two modules already meet, and answered by M17.
     *
     * Every uncertainty answers no: an owning type this does not know, an
     * actor it cannot resolve, a memory that is not there. It is deciding
     * whether to hand over somebody's photograph.
     */
    m16storage: {
      ...moduleDeps,
      blobs,
      mayReadOwningResource: async (ctx, input) => {
        if (input.owningResourceType !== 'LifeStoryItem') return false;
        const viewerActorId = ctx.actor?.id;
        if (viewerActorId === undefined) return false;
        const viewerParticipantId =
          (await createParticipantQuery(pool).findParticipantIdByAccount(viewerActorId)) ?? null;
        return mayReadLifeStoryItem(
          { pool, clock },
          {
            itemId: input.owningResourceId,
            ownerParticipantId: input.ownerParticipantId,
            viewerActorId,
            viewerParticipantId,
          },
        );
      },
    },
    m17: moduleDeps,
    m18: { ...moduleDeps, participants: createParticipantQuery(pool) },
  };

  /*
   * Sign in with Google (ADR-104), built only in the mode that uses it.
   * Under the dev-header stub there is no session store and no verifier at
   * all, so the stub cannot be handed a real session and a real session
   * cannot be satisfied by a header.
   */
  const google =
    config.AUTH_MODE === 'google'
      ? (() => {
          const sessions = createSessionStore({
            pool,
            sessionTtlMinutes: config.SESSION_TTL_MINUTES,
            stepUpTtlMinutes: config.STEP_UP_TTL_MINUTES,
            mfaDomains: splitDomains(config.GOOGLE_MFA_DOMAINS),
            allowSelfSignup: config.ALLOW_SELF_SIGNUP,
            bootstrapAdminEmail: config.BOOTSTRAP_ADMIN_EMAIL,
          });
          const authDeps: AuthDeps = {
            verifier: createGoogleVerifier({
              clientId: config.GOOGLE_CLIENT_ID!,
              allowedDomains: splitDomains(config.GOOGLE_ALLOWED_DOMAINS),
            }),
            sessions,
            findParticipantIdByAccount: (id: string) =>
              createParticipantQuery(pool).findParticipantIdByAccount(id),
            findDisplayName: async (id: string) =>
              (await createAccountNameQuery(pool).findDisplayNames([id])).get(id),
            sessionSecret: config.SESSION_SECRET!,
            clientId: config.GOOGLE_CLIENT_ID!,
            // Plain HTTP is local development only. A Secure cookie there
            // is never stored and sign-in silently fails to stick.
            secureCookies: config.COOKIE_SECURE,
            stepUpMaxAgeSeconds: config.STEP_UP_MAX_AGE_SECONDS,
          };
          return { sessions, authDeps };
        })()
      : undefined;

  const contactRelay: ContactRelayConfig | undefined =
    config.CONTACT_BOT_TOKEN !== undefined && config.CONTACT_CHAT_ID !== undefined
      ? { botToken: config.CONTACT_BOT_TOKEN, chatId: config.CONTACT_CHAT_ID }
      : undefined;

  @Module({
    controllers: [
      HealthController,
      ContactController,
      CommandController,
      StaffCommandController,
      ...(google !== undefined ? [AuthController] : []),
    ],
    providers: [
      { provide: PG_POOL, useValue: pool },
      { provide: BLOB_STORE, useValue: blobs },
      { provide: AUTH_MODE, useValue: config.AUTH_MODE },
      /*
       * Both halves or neither. A token with no destination, or a
       * destination with no token, is not a half-working relay — it is a
       * screen that accepts somebody's message and cannot send it, which
       * is the one outcome worse than saying there is no way to send.
       */
      { provide: CONTACT_RELAY, useValue: contactRelay },
      { provide: CONTACT_READY, useValue: contactRelay !== undefined },
      { provide: API_DEPS, useValue: deps },
      { provide: APP_FILTER, useClass: PlatformErrorFilter },
      ...(google !== undefined ? [{ provide: AUTH_DEPS, useValue: google.authDeps }] : []),
    ],
  })
  class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer): void {
      if (config.ACCESS_TOKEN !== undefined) {
        consumer.apply(accessTokenMiddleware(config.ACCESS_TOKEN)).forRoutes('*');
      }
      consumer
        .apply(
          requestContextMiddleware({
            authMode: config.AUTH_MODE,
            ...(google !== undefined
              ? { resolveSession: (token: string) => google.sessions.resolve(token) }
              : {}),
          }),
        )
        .forRoutes('*');
    }
  }
  return AppModule;
}
