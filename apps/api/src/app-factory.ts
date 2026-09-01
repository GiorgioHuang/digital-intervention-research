import { NestFactory } from '@nestjs/core';
import type { INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { buildAppModule } from './app.module.js';
import { bodyParsers } from './body-limits.js';
import type { ApiConfig } from './config.js';

/**
 * The API application, built the same way everywhere.
 *
 * It used to be built in three places — the process, the end-to-end
 * suite, and the access-gate suite — each calling `NestFactory.create`
 * with its own options. That is how the body-size limit went untested for
 * as long as it did: a fix in `main.ts` would have changed what the
 * deployment ran and nothing the tests exercised, so the suite could stay
 * green over a photograph upload that failed for every participant.
 */
export async function createApiApp(config: ApiConfig): Promise<NestExpressApplication> {
  const app = await NestFactory.create<NestExpressApplication>(buildAppModule(config), {
    logger: false,
    /*
     * Off, so that the parsers below are the only ones. Nest's own is
     * registered with a 100kB limit that nothing here could change.
     *
     * This also drops the urlencoded parser Nest registers alongside it,
     * which was checked rather than assumed: no route on this platform
     * reads a form-encoded body, and the Google sign-in returns its token
     * in the URL fragment (`response_mode: 'fragment'`, apps/web/src/
     * auth.ts) rather than posting a form back.
     */
    bodyParser: false,
  });
  app.use(bodyParsers());
  return app;
}

/** For a caller that has already built its own module (the gate suite). */
export async function createApiAppFrom(module: unknown): Promise<INestApplication> {
  const app = await NestFactory.create(module as Parameters<typeof NestFactory.create>[0], {
    logger: false,
    bodyParser: false,
  });
  app.use(bodyParsers());
  return app;
}
