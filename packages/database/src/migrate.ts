import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { runner } from 'node-pg-migrate';

const migrationsDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'migrations');

export interface MigrateOptions {
  databaseUrl: string;
  direction: 'up' | 'down';
  count?: number;
}

/** Programmatic migration runner used by tests and operational tooling. */
export async function migrate(options: MigrateOptions): Promise<void> {
  await runner({
    databaseUrl: options.databaseUrl,
    dir: migrationsDir,
    direction: options.direction,
    count: options.count ?? Infinity,
    migrationsTable: 'applied_migrations',
    migrationsSchema: 'migration_admin',
    schema: 'migration_admin',
    createSchema: true,
    createMigrationsSchema: true,
    verbose: false,
    log: () => {},
  });
}
