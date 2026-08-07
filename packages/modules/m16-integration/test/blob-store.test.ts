import { describe, expect, it } from 'vitest';
import { createBlobStore, createR2BlobStore } from '../src/application/blob-store.js';
import type { Pool } from '@platform/database';

const R2 = {
  R2_ACCOUNT_ID: 'acct',
  R2_BUCKET: 'uploads',
  R2_ACCESS_KEY_ID: 'key',
  R2_SECRET_ACCESS_KEY: 'secret',
};

/** Never used: every case here is decided before a query is issued. */
const pool = { query: async () => ({ rows: [] }) } as unknown as Pool;

/**
 * Choosing where a participant's files go.
 *
 * They had nowhere to go: the pipeline wrote them into a `bytea` column
 * in the platform's own Postgres, which the migration that created it
 * says outright is a simulator. The vendor is now Cloudflare R2 (the
 * owner's ruling), and the part of that decision worth a test is not the
 * happy path but the middle: a deployment that meant to have an object
 * store and has three of the four settings must not start and quietly
 * put people's photographs in a database column instead.
 */
describe('choosing where uploaded bytes go', () => {
  it('uses the simulator when no object store is configured, and says that is what it is', () => {
    const store = createBlobStore({}, pool);
    expect(store.description).toMatch(/simulated/i);
    expect(store.description).toMatch(/not an object store/i);
  });

  it('uses R2 when it is fully configured, and names the bucket', () => {
    expect(createBlobStore(R2, pool).description).toBe('Cloudflare R2 bucket uploads');
  });

  /**
   * The case that matters. A missing secret is exactly how this would
   * happen in practice, and falling back would be silent: the deployment
   * would come up healthy, uploads would appear to work, and the files
   * would be somewhere nobody intended.
   */
  it('refuses to start when the object store is only partly configured', () => {
    for (const missing of Object.keys(R2)) {
      const partial = { ...R2, [missing]: '' };
      expect(() => createBlobStore(partial, pool), `${missing} missing should refuse`).toThrowError(
        new RegExp(`${missing}[\\s\\S]*missing`),
      );
      expect(() => createBlobStore(partial, pool)).toThrowError(/Refusing to start/);
    }
  });

  /** Whitespace is not configuration. */
  it('treats a blank setting as absent rather than as a value', () => {
    expect(() => createBlobStore({ ...R2, R2_BUCKET: '   ' }, pool)).toThrowError(/R2_BUCKET/);
  });

  /**
   * A missing object is an absence; anything else is a fault. Reporting a
   * network failure as "not there" would tell a participant their file
   * was never uploaded.
   */
  it('reports a missing object as absent and a failure as a failure', async () => {
    const missing = Object.assign(new Error('nope'), { name: 'NoSuchKey' });
    const absent = createR2BlobStore(
      { accountId: 'a', bucket: 'b', accessKeyId: 'k', secretAccessKey: 's' },
      { send: async () => { throw missing; } } as never,
    );
    await expect(absent.get('obj_1')).resolves.toBeNull();

    const broken = createR2BlobStore(
      { accountId: 'a', bucket: 'b', accessKeyId: 'k', secretAccessKey: 's' },
      { send: async () => { throw new Error('connection reset'); } } as never,
    );
    await expect(broken.get('obj_1')).rejects.toThrowError(/connection reset/);
  });

  it('round-trips through the S3 API it is given', async () => {
    const calls: { command: string; key?: string }[] = [];
    const store = createR2BlobStore(
      { accountId: 'a', bucket: 'uploads', accessKeyId: 'k', secretAccessKey: 's' },
      {
        send: async (cmd: { constructor: { name: string }; input: { Key?: string } }) => {
          calls.push({ command: cmd.constructor.name, key: cmd.input.Key });
          return { Body: { transformToByteArray: async () => new Uint8Array([1, 2, 3]) } };
        },
      } as never,
    );
    await store.put('obj_1', Buffer.from('hello'));
    expect(await store.get('obj_1')).toEqual(Buffer.from([1, 2, 3]));
    await store.delete('obj_1');
    expect(calls.map((c) => c.command)).toEqual(['PutObjectCommand', 'GetObjectCommand', 'DeleteObjectCommand']);
    // The object identifier is the key: opaque, and never a filename the
    // participant chose, which would put their words in a bucket listing.
    expect(calls.every((c) => c.key === 'obj_1')).toBe(true);
  });

  /**
   * The same rule in the place it is most likely to be broken. The
   * deploy assembles the settings itself, and a workflow that attached
   * the bucket without the keys — or the keys without the bucket —
   * would produce exactly the partial configuration the code refuses,
   * turning a deployment into a crash loop. Read out of the workflow so
   * this cannot pass while the thing that actually deploys says
   * something else.
   */
  it('the deploy attaches all four settings or none', async () => {
    const { readFileSync } = await import('node:fs');
    const { join } = await import('node:path');
    const yaml = readFileSync(join(process.cwd(), '..', '..', '..', '.github', 'workflows', 'deploy.yml'), 'utf8');
    const guarded = yaml.slice(yaml.indexOf('R2_PRESENT=true'), yaml.indexOf('gcloud run deploy'));
    expect(guarded, 'the R2 block is no longer in deploy.yml in the expected shape').toContain('R2_PRESENT');
    // Every setting is attached inside the same branch, and that branch
    // requires each of the four to be present.
    const attach = guarded.slice(guarded.indexOf('if [ "$R2_PRESENT" = true ]'), guarded.indexOf('else'));
    for (const v of ['R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_ACCOUNT_ID', 'R2_BUCKET']) {
      expect(attach, `${v} must be attached only inside the all-present branch`).toContain(v);
    }
    for (const s of ['HADI_R2_ACCESS_KEY_ID', 'HADI_R2_SECRET_ACCESS_KEY']) {
      expect(guarded, `${s} presence must be checked`).toContain(s);
    }
    expect(guarded).toMatch(/vars\.R2_ACCOUNT_ID[\s\S]*vars\.R2_BUCKET[\s\S]*R2_PRESENT=false/);
  });
});
