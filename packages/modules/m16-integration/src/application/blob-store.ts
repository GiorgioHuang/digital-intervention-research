import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import type { Pool } from '@platform/database';

/**
 * Where the bytes of an uploaded file actually live.
 *
 * They had nowhere to live. `storage_ops.simulated_blobs` is a `bytea`
 * column in the same Postgres the platform runs on, and the migration
 * that created it says so: "the blob store is a deterministic simulator
 * (real vendor Pending External Approval)". Every part of the quarantine
 * pipeline around it was real — the release gate is enforced by a CHECK
 * constraint, a failed scan can never yield Available — and underneath
 * it, a participant's photograph would have gone into a database column.
 *
 * The vendor decision is Cloudflare R2 (owner's ruling, 2026-08-07),
 * reached against my recommendation of Google Cloud Storage: the
 * platform already runs on GCP with workload identity federation, so GCS
 * needs no long-lived credentials and no second processor of personal
 * data. R2 was chosen anyway; what that costs is a key pair to keep in
 * Secret Manager and a second data-processing relationship to document,
 * and both are the owner's to carry.
 *
 * Two rules hold whichever store is behind this.
 *
 * The bytes are written before the record and deleted after it. A
 * failure then leaves bytes no record points at — unreachable, under an
 * opaque identifier, and reclaimable. The other order would leave a
 * record pointing at bytes that are not there, which is a file the
 * platform says it holds and does not.
 *
 * And a half-configured store is a startup failure, never a fallback.
 * Silently writing participants' files into the database because one
 * environment variable was missing is exactly the kind of quiet wrong
 * answer this platform is built to refuse.
 */
export interface BlobStore {
  /** Named in operational output so it is never a guess which store is live. */
  readonly description: string;
  put(objectId: string, content: Buffer): Promise<void>;
  /** Null when the object is not there — an absence, not an error. */
  get(objectId: string): Promise<Buffer | null>;
  /** Idempotent: deleting what is not there is not a failure. */
  delete(objectId: string): Promise<void>;
}

/**
 * The simulator, unchanged in behaviour: bytes in a Postgres column.
 * It stays because the test suite runs against it and because a
 * deployment with no object store configured must still be able to run
 * — but it says what it is, so nothing can report it as storage.
 */
export function createPostgresBlobStore(pool: Pool): BlobStore {
  return {
    description: 'simulated blob store (bytes in Postgres — not an object store)',
    async put(objectId, content) {
      await pool.query(`INSERT INTO storage_ops.simulated_blobs (object_id, content) VALUES ($1, $2)`, [
        objectId,
        content,
      ]);
    },
    async get(objectId) {
      const res = await pool.query(`SELECT content FROM storage_ops.simulated_blobs WHERE object_id = $1`, [objectId]);
      const row = res.rows[0] as { content: Buffer } | undefined;
      return row === undefined ? null : row.content;
    },
    async delete(objectId) {
      await pool.query(`DELETE FROM storage_ops.simulated_blobs WHERE object_id = $1`, [objectId]);
    },
  };
}

export interface R2Settings {
  accountId: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
}

/**
 * Cloudflare R2 over its S3-compatible API.
 *
 * One bucket, holding quarantined and released bytes alike, because the
 * platform's release gate is the database CHECK constraint and not the
 * location of the file: nothing reads bytes without first reading the
 * row. A second bucket would only be worth its complexity if the bytes
 * were ever served directly from the store, and they are not — every
 * read goes through a command that checks state first.
 */
export function createR2BlobStore(settings: R2Settings, client?: S3Client): BlobStore {
  const s3 =
    client ??
    new S3Client({
      region: 'auto',
      endpoint: `https://${settings.accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: settings.accessKeyId, secretAccessKey: settings.secretAccessKey },
    });
  return {
    description: `Cloudflare R2 bucket ${settings.bucket}`,
    async put(objectId, content) {
      await s3.send(new PutObjectCommand({ Bucket: settings.bucket, Key: objectId, Body: content }));
    },
    async get(objectId) {
      try {
        const res = await s3.send(new GetObjectCommand({ Bucket: settings.bucket, Key: objectId }));
        const bytes = await res.Body?.transformToByteArray();
        return bytes === undefined ? null : Buffer.from(bytes);
      } catch (err) {
        // A missing object is an absence. Anything else is a fault and
        // must not be reported as "the file is not there", which would
        // read as the participant never having uploaded it.
        if ((err as { name?: string }).name === 'NoSuchKey') return null;
        throw err;
      }
    },
    async delete(objectId) {
      await s3.send(new DeleteObjectCommand({ Bucket: settings.bucket, Key: objectId }));
    },
  };
}

const R2_VARS = ['R2_ACCOUNT_ID', 'R2_BUCKET', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY'] as const;

/**
 * Chooses the store from the environment, and refuses to guess.
 *
 * None of the four set means no object store is configured, which is a
 * legitimate state — the test suite and a local checkout run that way —
 * and yields the simulator. All four set yields R2. Anything between is
 * a deployment that meant to have an object store and does not, and
 * starting anyway would put participants' files in a database column
 * without anybody being told.
 */
export function createBlobStore(env: Record<string, string | undefined>, pool: Pool): BlobStore {
  const present = R2_VARS.filter((v) => (env[v] ?? '').trim() !== '');
  if (present.length === 0) return createPostgresBlobStore(pool);
  if (present.length !== R2_VARS.length) {
    const missing = R2_VARS.filter((v) => !present.includes(v));
    /*
     * A plain Error, not a PlatformError. This is a startup crash that
     * no request ever sees, and giving it a platform code would put a
     * prepared sentence in the refusal tables for something no user can
     * ever meet — the defect D-51 was about.
     */
    throw new Error(
      `Object storage is partly configured: ${missing.join(', ')} missing. ` +
        'Refusing to start rather than writing uploaded files into the database.',
    );
  }
  return createR2BlobStore({
    accountId: env['R2_ACCOUNT_ID']!,
    bucket: env['R2_BUCKET']!,
    accessKeyId: env['R2_ACCESS_KEY_ID']!,
    secretAccessKey: env['R2_SECRET_ACCESS_KEY']!,
  });
}
