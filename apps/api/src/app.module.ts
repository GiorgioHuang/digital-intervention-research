import { Module, type MiddlewareConsumer, type NestModule } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { SystemClock } from '@platform/kernel';
import { createPool } from '@platform/database';
import { POLICY_V1 } from '@platform/policy';
import { createRoleAssignmentQuery } from '@platform/m01-identity-org';
import { createParticipantQuery } from '@platform/m02-participant';
import { createPermissionService } from '@platform/m03-consent-permission';
import { createBlockQuery } from '@platform/m18-community-social';
import type { ApiConfig } from './config.js';
import { HealthController, PG_POOL } from './health.controller.js';
import { API_DEPS, CommandController, type ApiDeps } from './controllers.js';
import { PlatformErrorFilter } from './error-filter.js';
import { requestContextMiddleware } from './http-context.js';

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
  const deps: ApiDeps = {
    pool,
    clock,
    permissions,
    m09: { pool, clock, checkPermission },
    m18: { pool, clock, checkPermission },
  };

  @Module({
    controllers: [HealthController, CommandController],
    providers: [
      { provide: PG_POOL, useValue: pool },
      { provide: API_DEPS, useValue: deps },
      { provide: APP_FILTER, useClass: PlatformErrorFilter },
    ],
  })
  class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer): void {
      consumer.apply(requestContextMiddleware(config.AUTH_MODE)).forRoutes('*');
    }
  }
  return AppModule;
}
