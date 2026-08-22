#!/usr/bin/env node
/**
 * Does the object store actually work with these credentials?
 *
 * Nothing answered that. `/ready` reports `fileStorage` by looking at the
 * blob store's *description string*, which is built from configuration and
 * never calls R2 — so a deployment carrying a wrong, expired or revoked
 * credential reports `object-store`, passes every smoke check, and goes
 * green. The first person to find out would be the first participant to
 * upload a photograph.
 *
 * Rotation is when a credential is most likely to be wrong, and a rotation
 * deploy looks exactly like any other push. This is the check that can tell
 * them apart, and it is run by hand (`workflow_dispatch`) rather than on
 * every deploy, because every run writes an object into the real bucket —
 * the owner's ruling, and the right one for a check whose whole purpose is
 * to be run deliberately at the moment of doubt.
 *
 * It goes through `createBlobStore` rather than building its own S3 client.
 * A private client here would prove that *these* credentials work with
 * *this* script's idea of the endpoint, which is not the question. The
 * question is whether the platform's own path works, including the
 * all-four-settings-or-none refusal it makes on the way.
 */
import { Buffer } from 'node:buffer';
import { randomBytes } from 'node:crypto';
import { createBlobStore } from '../packages/modules/m16-integration/dist/application/blob-store.js';

/** Never queried: R2 is chosen before any pool call, and if it is not, that is the failure. */
const pool = {
  query: async () => {
    throw new Error(
      'the blob store fell through to the Postgres simulator — the four R2 settings are not all present',
    );
  },
};

const store = createBlobStore(process.env, pool);
if (!store.description.startsWith('Cloudflare R2')) {
  console.error(`::error::not talking to R2 — the store describes itself as "${store.description}"`);
  process.exit(1);
}

/*
 * The description names the bucket, and the bucket name is a repository
 * Variable — which this repository's own rule says becomes public the
 * moment it is printed into a log, and these logs are public. The first
 * run of this check published it. Nothing below prints the description;
 * what a reader needs is whether the round trip worked, not where.
 */

// Opaque, like every key this platform writes, and prefixed so that a leftover
// from a killed run is recognisable rather than mysterious.
const key = `deploy-check_${randomBytes(16).toString('hex')}`;
const payload = randomBytes(64);

let wrote = false;
try {
  await store.put(key, payload);
  wrote = true;

  const read = await store.get(key);
  if (read === null) {
    // Not a missing-object case: it was written a moment ago. Either the
    // write did not land or the read is looking somewhere else.
    throw new Error('wrote an object and read back nothing');
  }
  if (!Buffer.from(read).equals(payload)) {
    throw new Error(`read back ${read.length} bytes that are not the ${payload.length} written`);
  }

  await store.delete(key);
  wrote = false;

  // Delete has to be verified too. A silent no-op delete would leave every
  // run of this check behind in the bucket, and would mean the platform
  // cannot honour a withdrawal either — which is a larger promise than this.
  const afterDelete = await store.get(key);
  if (afterDelete !== null) {
    throw new Error('the object is still readable after delete');
  }

  console.log(`R2 round-trip passed: ${payload.length} bytes written, read back byte-for-byte, deleted, and confirmed gone.`);
} catch (error) {
  console.error(`::error::R2 round-trip failed: ${error instanceof Error ? error.message : String(error)}`);
  if (wrote) {
    // Best effort, and said out loud either way: a check that litters the
    // participants' bucket on failure is its own small defect.
    try {
      await store.delete(key);
      console.error(`  the test object ${key} was removed`);
    } catch {
      console.error(`::warning::could not remove the test object ${key} — delete it by hand`);
    }
  }
  process.exit(1);
}
