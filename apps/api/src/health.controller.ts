import { Controller, Get, Inject, ServiceUnavailableException } from '@nestjs/common';
import type { Pool } from '@platform/database';

export const PG_POOL = 'PG_POOL';

@Controller()
export class HealthController {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  /** Liveness: the process is up. Carries no dependency state. */
  @Get('health')
  health(): { status: string } {
    return { status: 'ok' };
  }

  /** Readiness: the transactional system of record is reachable. */
  @Get('ready')
  async ready(): Promise<{ status: string }> {
    try {
      await this.pool.query('SELECT 1');
      return { status: 'ready' };
    } catch {
      // Truthful failure (ADR-055): report not-ready, never fake readiness.
      throw new ServiceUnavailableException({ status: 'not-ready', reason: 'database unreachable' });
    }
  }
}
