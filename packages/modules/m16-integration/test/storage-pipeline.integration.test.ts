import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import pg from 'pg';
import { FixedClock, createRequestContext } from '@platform/kernel';
import { createPool, migrate } from '@platform/database';
import { POLICY_V1 } from '@platform/policy';
import {
  assignRole,
  createOrganisation,
  createRoleAssignmentQuery,
  createUserAccount,
  seedBootstrapAdministrator,
  type M01Deps,
} from '@platform/m01-identity-org';
import { createParticipantQuery, registerParticipant } from '@platform/m02-participant';
import { createPermissionService } from '@platform/m03-consent-permission';
import {
  assertObjectSendable,
  completeUpload,
  createPostgresBlobStore,
  DEFAULT_STORAGE_CONFIG,
  EICAR_MARKER,
  getObjectStatus,
  initiateUpload,
  listObjectsForResource,
  releaseObject,
  SCAN_ERROR_MARKER,
  scanPendingObjects,
  type StorageDeps,
} from '../src/index.js';

const DATABASE_URL =
  process.env['DATABASE_URL'] ?? 'postgres://platform:platform_dev_only@localhost:5432/research_platform';

async function probe(): Promise<boolean> {
  const c = new pg.Client({ connectionString: DATABASE_URL, connectionTimeoutMillis: 2000 });
  try {
    await c.connect();
    await c.end();
    return true;
  } catch {
    return false;
  }
}
const dbAvailable = await probe();

describe.skipIf(!dbAvailable)('object-storage quarantine pipeline (integration)', () => {
  let pool: pg.Pool;
  const clock = new FixedClock('2026-07-30T12:00:00Z');
  let storage: StorageDeps;
  let patAcc: string, patId: string, otherAcc: string;
  const cfg = DEFAULT_STORAGE_CONFIG;
  const ctx = (id: string) => createRequestContext({ actor: { type: 'user', id } });
  const sysCtx = () =>
    createRequestContext({ actor: { type: 'service-account', id: 'sa_scheduler' }, purposeCode: 'platform-maintenance' });

  const upload = async (content: Buffer, contentType = 'text/plain') => {
    const { objectId } = await initiateUpload(storage, ctx(patAcc), cfg, {
      ownerParticipantId: patId,
      declaredContentType: contentType,
      declaredSizeBytes: content.byteLength,
    });
    await completeUpload(storage, ctx(patAcc), { objectId, content });
    return objectId;
  };

  beforeAll(async () => {
    await migrate({ databaseUrl: DATABASE_URL, direction: 'up' });
    pool = createPool({ connectionString: DATABASE_URL, applicationName: 'storage-tests' });
    const permissions = createPermissionService({
      pool,
      clock,
      policy: POLICY_V1,
      roleAssignments: createRoleAssignmentQuery(pool),
      participantIdentity: createParticipantQuery(pool),
    });
    const checkPermission = permissions.evaluate.bind(permissions);
    const m01: M01Deps = { pool, clock, checkPermission };
    storage = { pool, clock, checkPermission, blobs: createPostgresBlobStore(pool) };

    const { userAccountId: adminId } = await seedBootstrapAdministrator(pool, clock, { displayName: 'Admin' });
    const { organisationId } = await createOrganisation(m01, ctx(adminId), { name: 'Storage Org' });
    const adminCtx = createRequestContext({ actor: { type: 'user', id: adminId }, organisationId });
    ({ userAccountId: patAcc } = await createUserAccount(m01, adminCtx, { displayName: 'P' }));
    ({ userAccountId: otherAcc } = await createUserAccount(m01, adminCtx, { displayName: 'O' }));
    for (const acc of [patAcc, otherAcc]) {
      await assignRole(m01, adminCtx, { userAccountId: acc, role: 'Participant', confirmed: true });
    }
    await assignRole(m01, adminCtx, { userAccountId: adminId, role: 'ResearchCoordinator', confirmed: true });
    ({ participantId: patId } = await registerParticipant({ pool, clock, checkPermission }, adminCtx, {
      displayName: 'P', userAccountId: patAcc,
    }));
  }, 30_000);

  afterAll(async () => {
    await pool?.end();
  });

  it('fail closed at the gate: disallowed type and oversize are refused before any bytes land', async () => {
    await expect(
      initiateUpload(storage, ctx(patAcc), cfg, {
        ownerParticipantId: patId, declaredContentType: 'application/x-msdownload', declaredSizeBytes: 100,
      }),
    ).rejects.toMatchObject({ code: 'UNSUPPORTED_CAPABILITY' });
    await expect(
      initiateUpload(storage, ctx(patAcc), cfg, {
        ownerParticipantId: patId, declaredContentType: 'text/plain', declaredSizeBytes: cfg.maxSizeBytes + 1,
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
    // Uploading for someone else's participant identity is hidden-denied.
    await expect(
      initiateUpload(storage, ctx(otherAcc), cfg, {
        ownerParticipantId: patId, declaredContentType: 'text/plain', declaredSizeBytes: 100,
      }),
    ).rejects.toMatchObject({ code: 'RESOURCE_NOT_FOUND' });
  });

  it('size mismatch with the declaration rejects the object', async () => {
    const { objectId } = await initiateUpload(storage, ctx(patAcc), cfg, {
      ownerParticipantId: patId, declaredContentType: 'text/plain', declaredSizeBytes: 5,
    });
    await expect(
      completeUpload(storage, ctx(patAcc), { objectId, content: Buffer.from('longer than five') }),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
    const status = await getObjectStatus(storage, ctx(patAcc), objectId);
    expect(status.objectState).toBe('Rejected');
  });

  it('clean pipeline: quarantined until scan + classification + owning resource are ALL complete', async () => {
    const objectId = await upload(Buffer.from('family photo bytes'));
    // Quarantined, not sendable.
    await expect(assertObjectSendable(storage, objectId)).rejects.toMatchObject({ code: 'ATTACHMENT_NOT_READY' });
    // Release before scan is refused.
    await expect(
      releaseObject(storage, ctx(patAcc), cfg, { objectId, owningResourceType: 'LifeStoryItem', owningResourceId: 'lsi_1' }),
    ).rejects.toMatchObject({ code: 'ATTACHMENT_NOT_READY' });

    const { scanned } = await scanPendingObjects(storage, sysCtx());
    expect(scanned).toBeGreaterThanOrEqual(1);
    // Clean scan alone is still not Available.
    await expect(assertObjectSendable(storage, objectId)).rejects.toMatchObject({ code: 'ATTACHMENT_NOT_READY' });

    // Unmapped resource types fail closed.
    await expect(
      releaseObject(storage, ctx(patAcc), cfg, { objectId, owningResourceType: 'Mystery', owningResourceId: 'x' }),
    ).rejects.toMatchObject({ code: 'UNSUPPORTED_CAPABILITY' });

    const { dataClassification } = await releaseObject(storage, ctx(patAcc), cfg, {
      objectId, owningResourceType: 'LifeStoryItem', owningResourceId: 'lsi_1',
    });
    // Classification derives from the owning resource and inherits its sensitivity.
    expect(dataClassification).toBe('Sensitive-Personal');
    await assertObjectSendable(storage, objectId);
    const status = await getObjectStatus(storage, ctx(patAcc), objectId);
    expect(status.objectState).toBe('Available');
  });

  /**
   * The question that could not be asked. Ownership was recorded on the
   * object's side only — the life story holds no reference back — and
   * the sole query was for a single object by its identifier. So a
   * participant could attach a photograph to a life story entry and that
   * entry could never show it, unless they had memorised an opaque
   * identifier. This is why D-50 refused to build the upload screen.
   */
  /**
   * Attaching in one act.
   *
   * It took three calls, and the third could not be made until a worker
   * sweep had scanned the file — every five minutes, and only while an
   * instance is alive, since the service scales to zero. So a
   * participant uploaded a photograph, waited an unknown time, came back
   * and pressed a second button to attach it. That asks somebody to do
   * the platform's bookkeeping and to know when a background job has
   * run.
   *
   * The destination is now part of the request that starts the upload,
   * and the clean scan releases it. Nothing about the release gate is
   * relaxed: the scan still has to come back clean, and the CHECK
   * constraint still refuses Available without a classification and an
   * owning resource.
   */
  it('a destination given at the start is attached by the scan, with no second act', async () => {
    const { objectId } = await initiateUpload(storage, ctx(patAcc), cfg, {
      ownerParticipantId: patId,
      declaredContentType: 'text/plain',
      declaredSizeBytes: 5,
      attachTo: { owningResourceType: 'LifeStoryItem', owningResourceId: 'lsi_one_step' },
    });
    await completeUpload(storage, ctx(patAcc), { objectId, content: Buffer.from('hello') });

    // Still quarantined: naming a destination does not attach anything.
    const before = await listObjectsForResource(storage, ctx(patAcc), {
      ownerParticipantId: patId, owningResourceType: 'LifeStoryItem', owningResourceId: 'lsi_one_step',
    });
    expect(before).toEqual([]);

    await scanPendingObjects(storage, sysCtx(), cfg);

    const after = await listObjectsForResource(storage, ctx(patAcc), {
      ownerParticipantId: patId, owningResourceType: 'LifeStoryItem', owningResourceId: 'lsi_one_step',
    });
    expect(after.map((a) => a.objectId)).toEqual([objectId]);
    // The classification came from the resource type, exactly as the
    // explicit release path derives it.
    expect(after[0]?.dataClassification).toBe('Sensitive-Personal');
  });

  /**
   * A destination does not make a bad file good. The same clean-scan
   * requirement stands, and the record must not read as attached.
   */
  it('malware with a destination is rejected and attached to nothing', async () => {
    const { objectId } = await initiateUpload(storage, ctx(patAcc), cfg, {
      ownerParticipantId: patId,
      declaredContentType: 'text/plain',
      declaredSizeBytes: EICAR_MARKER.length,
      attachTo: { owningResourceType: 'LifeStoryItem', owningResourceId: 'lsi_bad' },
    });
    await completeUpload(storage, ctx(patAcc), { objectId, content: Buffer.from(EICAR_MARKER) });
    await scanPendingObjects(storage, sysCtx(), cfg);

    expect(
      await listObjectsForResource(storage, ctx(patAcc), {
        ownerParticipantId: patId, owningResourceType: 'LifeStoryItem', owningResourceId: 'lsi_bad',
      }),
    ).toEqual([]);
    const row = await pool.query(
      `SELECT object_state, owning_resource_id FROM storage_ops.stored_objects WHERE id = $1`,
      [objectId],
    );
    expect(row.rows[0]).toMatchObject({ object_state: 'Rejected', owning_resource_id: null });
  });

  /**
   * Told before the upload, not after. A resource type with no
   * classification policy cannot receive objects, and learning that once
   * the bytes are already sent means being told a file is stuck for a
   * reason that could have been given first.
   */
  it('refuses an unmapped destination before any bytes are sent', async () => {
    await expect(
      initiateUpload(storage, ctx(patAcc), cfg, {
        ownerParticipantId: patId,
        declaredContentType: 'text/plain',
        declaredSizeBytes: 5,
        attachTo: { owningResourceType: 'SomethingUnmapped', owningResourceId: 'x_1' },
      }),
    ).rejects.toMatchObject({ code: 'UNSUPPORTED_CAPABILITY' });
  });

  it('a record can be asked what is attached to it, and only its owner may ask', async () => {
    const objectId = await upload(Buffer.from('a photograph of a garden'));
    await scanPendingObjects(storage, sysCtx());
    await releaseObject(storage, ctx(patAcc), cfg, {
      objectId, owningResourceType: 'LifeStoryItem', owningResourceId: 'lsi_read_1',
    });

    const attached = await listObjectsForResource(storage, ctx(patAcc), {
      ownerParticipantId: patId, owningResourceType: 'LifeStoryItem', owningResourceId: 'lsi_read_1',
    });
    expect(attached.map((a) => a.objectId)).toEqual([objectId]);
    expect(attached[0]).toMatchObject({ objectState: 'Available', dataClassification: 'Sensitive-Personal' });

    // A different entry is a different answer, not the same list.
    expect(
      await listObjectsForResource(storage, ctx(patAcc), {
        ownerParticipantId: patId, owningResourceType: 'LifeStoryItem', owningResourceId: 'lsi_read_2',
      }),
    ).toEqual([]);

    // Somebody else asking about this participant's attachments is
    // refused: the existence of the record is protected, not only its
    // contents (D-39 — sharing with a supporter does not exist here).
    await expect(
      listObjectsForResource(storage, ctx(otherAcc), {
        ownerParticipantId: patId, owningResourceType: 'LifeStoryItem', owningResourceId: 'lsi_read_1',
      }),
    ).rejects.toBeDefined();
  });

  /**
   * Anything short of Available has not cleared quarantine, and listing
   * it would show a file the platform is not prepared to hand back.
   */
  it('does not list an object until it has cleared quarantine and been attached', async () => {
    const pending = await upload(Buffer.from('not scanned yet'));
    const ask = () =>
      listObjectsForResource(storage, ctx(patAcc), {
        ownerParticipantId: patId, owningResourceType: 'LifeStoryItem', owningResourceId: 'lsi_read_3',
      });
    expect(await ask()).toEqual([]);
    // A clean scan alone is still not enough — it is not attached yet.
    await scanPendingObjects(storage, sysCtx());
    expect(await ask()).toEqual([]);
    await releaseObject(storage, ctx(patAcc), cfg, {
      objectId: pending, owningResourceType: 'LifeStoryItem', owningResourceId: 'lsi_read_3',
    });
    expect((await ask()).map((a) => a.objectId)).toEqual([pending]);
  });

  it('malware is rejected and the blob is purged; scan failure never means safe', async () => {
    const bad = await upload(Buffer.from(`prefix ${EICAR_MARKER} suffix`));
    await scanPendingObjects(storage, sysCtx());
    const badStatus = await getObjectStatus(storage, ctx(patAcc), bad);
    expect(badStatus.objectState).toBe('Rejected');
    expect(badStatus.scanOutcome).toBe('Malware Detected');
    const blob = await pool.query(`SELECT 1 FROM storage_ops.simulated_blobs WHERE object_id = $1`, [bad]);
    expect(blob.rowCount).toBe(0);

    const errored = await upload(Buffer.from(`x ${SCAN_ERROR_MARKER} y`));
    await scanPendingObjects(storage, sysCtx());
    const errStatus = await getObjectStatus(storage, ctx(patAcc), errored);
    // Processing failure does not mark an item safe (Doc 14 §59).
    expect(errStatus.objectState).toBe('Quarantined');
    expect(errStatus.scanOutcome).toBe('Scan Failed');
    await expect(assertObjectSendable(storage, errored)).rejects.toMatchObject({ code: 'ATTACHMENT_NOT_READY' });
    await expect(
      releaseObject(storage, ctx(patAcc), cfg, { objectId: errored, owningResourceType: 'Message', owningResourceId: 'msg_x' }),
    ).rejects.toMatchObject({ code: 'ATTACHMENT_NOT_READY' });
  });

  it('DB CHECK backstop: Available without a clean scan is impossible even bypassing the commands', async () => {
    const objectId = await upload(Buffer.from('bytes'));
    await expect(
      pool.query(`UPDATE storage_ops.stored_objects SET object_state = 'Available' WHERE id = $1`, [objectId]),
    ).rejects.toThrow(/stored_objects/);
  });

  it('status is owner-only with hidden existence for everyone else', async () => {
    const objectId = await upload(Buffer.from('private bytes'));
    await expect(getObjectStatus(storage, ctx(otherAcc), objectId)).rejects.toMatchObject({
      code: 'RESOURCE_NOT_FOUND',
    });
  });
});

describe.skipIf(dbAvailable)('storage pipeline (skipped)', () => {
  it('skipped because no PostgreSQL is reachable', () => {
    expect(dbAvailable).toBe(false);
  });
});
