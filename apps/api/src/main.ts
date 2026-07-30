import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { buildAppModule } from './app.module.js';
import { loadConfig } from './config.js';
import { createLogger } from './logger.js';

async function bootstrap(): Promise<void> {
  const config = loadConfig();
  const logger = createLogger(config.LOG_LEVEL, 'api');

  const app = await NestFactory.create(buildAppModule(config), { logger: false });
  app.enableShutdownHooks();
  await app.listen(config.API_PORT);
  logger.info({ port: config.API_PORT }, 'API process started');
}

bootstrap().catch((err) => {
  console.error('API failed to start', err);
  process.exit(1);
});
