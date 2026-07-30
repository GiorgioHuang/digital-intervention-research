import pg from 'pg';

export type { Pool, PoolClient } from 'pg';
export type Queryable = pg.Pool | pg.PoolClient;

export interface DatabaseConfig {
  connectionString: string;
  max?: number;
  applicationName?: string;
}

export function createPool(config: DatabaseConfig): pg.Pool {
  return new pg.Pool({
    connectionString: config.connectionString,
    max: config.max ?? 10,
    application_name: config.applicationName ?? 'research-platform',
  });
}

/**
 * Run `fn` inside a single transaction. This is the ONLY sanctioned way to
 * commit aggregate state together with its outbox events (ADR-015): pass the
 * transaction client to both the repository write and appendToOutbox.
 */
export async function withTransaction<T>(
  pool: pg.Pool,
  fn: (client: pg.PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // connection-level failure: rollback is implicit when the connection drops
    }
    throw err;
  } finally {
    client.release();
  }
}
