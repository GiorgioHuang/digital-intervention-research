import { Module, type MiddlewareConsumer, type NestModule } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { SystemClock } from '@platform/kernel';
import { createPool } from '@platform/database';
import { POLICY_V1 } from '@platform/policy';
import { createAccountNameQuery, createRoleAssignmentQuery } from '@platform/m01-identity-org';
import { createParticipantQuery } from '@platform/m02-participant';
import { createPermissionService } from '@platform/m03-consent-permission';
import { createProtocolVersionQuery } from '@platform/m04-research-design';
import { createKnowledgePlatformMcpClient, createKnowledgePlatformSimulator } from '@platform/m10-evidence';
import { createBlobStore } from '@platform/m16-integration';
import { createBlockQuery } from '@platform/m18-community-social';
import type { ApiConfig } from './config.js';
import { HealthController, PG_POOL } from './health.controller.js';
import { API_DEPS, CommandController, type ApiDeps } from './controllers.js';
import { StaffCommandController } from './staff-controllers.js';
import { PlatformErrorFilter } from './error-filter.js';
import { accessTokenMiddleware, requestContextMiddleware } from './http-context.js';

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
    m16storage: { ...moduleDeps, blobs: createBlobStore(process.env, pool) },
    m17: moduleDeps,
    m18: { ...moduleDeps, participants: createParticipantQuery(pool) },
  };

  @Module({
    controllers: [HealthController, CommandController, StaffCommandController],
    providers: [
      { provide: PG_POOL, useValue: pool },
      { provide: API_DEPS, useValue: deps },
      { provide: APP_FILTER, useClass: PlatformErrorFilter },
    ],
  })
  class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer): void {
      if (config.ACCESS_TOKEN !== undefined) {
        consumer.apply(accessTokenMiddleware(config.ACCESS_TOKEN)).forRoutes('*');
      }
      consumer.apply(requestContextMiddleware(config.AUTH_MODE)).forRoutes('*');
    }
  }
  return AppModule;
}
