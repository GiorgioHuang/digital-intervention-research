import 'reflect-metadata';
import { join } from 'node:path';
import express from 'express';
import { createApiApp } from './app-factory.js';
import { loadConfig } from './config.js';
import { createLogger } from './logger.js';
import { servesSpaShell } from './spa-fallback.js';

async function bootstrap(): Promise<void> {
  const config = loadConfig();
  const logger = createLogger(config.LOG_LEVEL, 'api');

  const app = await createApiApp(config);
  app.enableShutdownHooks();
  if (config.WEB_DIST_DIR !== undefined) {
    // Single-service deployment: the API serves the built web app. Static
    // assets are open (they carry no data — every data path stays behind
    // /v1 and its gates); unknown GETs fall back to the SPA shell.
    const dist = config.WEB_DIST_DIR;
    app.use(express.static(dist));
    app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
      if (servesSpaShell(req.method, req.path)) {
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
