import { Module } from '@nestjs/common';
import { createPool } from '@platform/database';
import type { ApiConfig } from './config.js';
import { HealthController, PG_POOL } from './health.controller.js';

export function buildAppModule(config: ApiConfig) {
  @Module({
    controllers: [HealthController],
    providers: [
      {
        provide: PG_POOL,
        useFactory: () => createPool({ connectionString: config.DATABASE_URL, applicationName: 'api' }),
      },
    ],
  })
  class AppModule {}
  return AppModule;
}
