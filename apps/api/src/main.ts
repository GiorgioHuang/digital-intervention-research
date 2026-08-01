import 'reflect-metadata';
import { join } from 'node:path';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import express from 'express';
import { buildAppModule } from './app.module.js';
import { loadConfig } from './config.js';
import { createLogger } from './logger.js';

async function bootstrap(): Promise<void> {
  const config = loadConfig();
  const logger = createLogger(config.LOG_LEVEL, 'api');

  const app = await NestFactory.create<NestExpressApplication>(buildAppModule(config), { logger: false });
  app.enableShutdownHooks();
  if (config.WEB_DIST_DIR !== undefined) {
    // Single-service deployment: the API serves the built web app. Static
    // assets are open (they carry no data — every data path stays behind
    // /v1 and its gates); unknown GETs fall back to the SPA shell.
    const dist = config.WEB_DIST_DIR;
    app.use(express.static(dist));
    app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
      if (req.method === 'GET' && !req.path.startsWith('/v1') && !req.path.startsWith('/health')) {
        res.sendFile(join(dist, 'index.html'));
      } else {
        next();
      }
    });
  }
  await app.listen(config.API_PORT);
  logger.info({ port: config.API_PORT, webDistDir: config.WEB_DIST_DIR ?? null }, 'API process started');
}

bootstrap().catch((err) => {
  console.error('API failed to start', err);
  process.exit(1);
});
