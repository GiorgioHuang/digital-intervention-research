import { Controller, Get, Inject, ServiceUnavailableException } from '@nestjs/common';
import type { Pool } from '@platform/database';
import type { BlobStore } from '@platform/m16-integration';

export const PG_POOL = 'PG_POOL';
export const BLOB_STORE = 'BLOB_STORE';
export const AUTH_MODE = 'AUTH_MODE';

@Controller()
export class HealthController {
  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    @Inject(BLOB_STORE) private readonly blobs: BlobStore,
    @Inject(AUTH_MODE) private readonly authMode: string,
  ) {}

  /**
   * Liveness: the process is up. Carries no dependency state.
   *
   * It also reports how people sign in, for the same reason /ready reports
   * where files go: the web app has to know which entrance to draw, and
   * the alternative was configuring the answer a second time in the
   * bundle, where it can disagree with the server for a week before
   * anybody notices. This is not a disclosure — anyone can learn it by
   * pressing the sign-in button once — and naming 'dev-header' out loud
   * is a feature, because a deployment answering that is a deployment
   * where identity is whatever a header says.
   */
  @Get('health')
  health(): { status: string; authMode: string } {
    return { status: 'ok', authMode: this.authMode };
  }

  /**
   * Readiness: the transactional system of record is reachable, and
   * where uploaded files are being put.
   *
   * The second part is here because nothing said it. The worker logs its
   * choice at startup; the API, which is what actually serves an upload,
   * chose silently — so the only way to learn whether a deployment was
   * writing participants' files to the object store or into a Postgres
   * column was to read the deploy log and trust it. A platform that
   * cannot tell you where it is putting people's files is not one you
   * can check.
   *
   * The kind only, never the bucket or the vendor: this endpoint is
   * outside the access-token gate. And it is the configured choice, not
   * a live probe — an unauthenticated endpoint that made a request to
   * the object store on demand would be an amplifier, and a paid one.
   */
  @Get('ready')
  async ready(): Promise<{ status: string; fileStorage: string }> {
    const fileStorage = this.blobs.description.startsWith('simulated')
      ? 'database-simulator'
      : 'object-store';
    try {
      await this.pool.query('SELECT 1');
      return { status: 'ready', fileStorage };
    } catch {
      // Truthful failure (ADR-055): report not-ready, never fake readiness.
      /*
       * Deliberately without fileStorage: the error filter replaces the
       * body of any HttpException with the platform's error envelope, so
       * a field put here would be written and never readable — the very
       * defect this session keeps finding. A service that is not ready
       * reports not ready, and that envelope is the filter's to own.
       */
      throw new ServiceUnavailableException({ status: 'not-ready', reason: 'database unreachable' });
    }
  }
}
