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
  deleteObject,
  DEFAULT_STORAGE_CONFIG,
  EICAR_MARKER,
  getObjectStatus,
  initiateUpload,
  listObjectsForResource,
  readObject,
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

  /*
   * Attaching now requires the entry to exist and to still accept
   * additions, so these tests make real ones rather than inventing
   * identifiers — the guard is the point, not an obstacle to work round.
   */
  const entry = async (id: string, state = 'Active') => {
    await pool.query(
      `INSERT INTO life_story.archives (id, participant_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      ['ar_storage', patId],
    );
    await pool.query(
      `INSERT INTO life_story.items (id, archive_id, title, item_state) VALUES ($1, 'ar_storage', $2, $3)
       ON CONFLICT (id) DO NOTHING`,
      [id, `Entry ${id}`, state],
    );
    return id;
  };

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
      attachTo: { owningResourceType: 'LifeStoryItem', owningResourceId: await entry('lsi_one_step') },
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
      attachTo: { owningResourceType: 'LifeStoryItem', owningResourceId: await entry('lsi_bad') },
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

  /**
   * Reading a photograph back.
   *
   * Every other part of the pipeline existed and this did not, so a
   * photograph could be uploaded, scanned, released and listed, and never
   * looked at (B-27).
   */
  const PNG_BYTES = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    Buffer.from('not really the rest of a png, but the signature is what is read'),
  ]);

  it('hands a photograph back to the person whose photograph it is', async () => {
    const objectId = await upload(PNG_BYTES, 'image/png');
    await scanPendingObjects(storage, sysCtx());
    await releaseObject(storage, ctx(patAcc), cfg, {
      objectId, owningResourceType: 'LifeStoryItem', owningResourceId: await entry('lsi_read_png'),
    });

    const content = await readObject(storage, ctx(patAcc), { objectId });
    expect(content.bytes.equals(PNG_BYTES), 'the bytes came back changed').toBe(true);
    expect(content.contentType).toBe('image/png');
    expect(content.inline).toBe(true);
  });

  /**
   * The security case, end to end rather than only over the sniffer.
   *
   * The upload declares image/png and the bytes are a page of markup. The
   * declaration is kept on the record — it is part of what somebody
   * claimed — and it is not what gets served: the answer is an opaque
   * download, so a browser is never told this is a picture and never
   * offered the chance to run it on this origin.
   */
  it('will not serve a file as an image because the upload said so', async () => {
    const markup = Buffer.from('<html><script>alert(document.cookie)</script></html>');
    const objectId = await upload(markup, 'image/png');
    await scanPendingObjects(storage, sysCtx());
    await releaseObject(storage, ctx(patAcc), cfg, {
      objectId, owningResourceType: 'LifeStoryItem', owningResourceId: await entry('lsi_read_liar'),
    });

    const content = await readObject(storage, ctx(patAcc), { objectId });
    expect(content.contentType, 'a page of markup was about to be served as an image').toBe('application/octet-stream');
    expect(content.inline).toBe(false);
    // Still recorded as what was claimed — the record of the claim is not
    // rewritten just because the claim was false.
    expect(content.declaredContentType).toBe('image/png');
  });

  /**
   * Quarantine means quarantine. A file that has been received but not
   * yet checked must not be readable — handing back bytes the platform
   * has not finished inspecting is the one thing quarantine exists to
   * prevent, and "it is mine" is not an argument against it.
   */
  it('refuses a file that has not finished being checked', async () => {
    const objectId = await upload(PNG_BYTES, 'image/png');
    await expect(readObject(storage, ctx(patAcc), { objectId })).rejects.toMatchObject({
      code: 'ATTACHMENT_NOT_READY',
    });
  });

  /**
   * A photograph in quarantine, seen by the person who sent it.
   *
   * The listing returned Available alone, for everybody including the
   * owner — so a file that had been received and not yet checked was
   * invisible to the person who sent it, and since nothing runs the scan
   * sweep in the deployed environment (B-29) it stayed invisible for
   * good. From a phone that looked like: send a photograph, see it,
   * refresh, and it is gone with nothing said. Reported 2026-09-02.
   */
  it('shows the owner a photograph that is still being checked', async () => {
    const entryId = await entry('lsi_quarantined');
    const objectId = await upload(PNG_BYTES, 'image/png');
    // Attached at the start, and not yet scanned: the state the report
    // is about.
    await pool.query(
      `UPDATE storage_ops.stored_objects
          SET owning_resource_type = 'LifeStoryItem', owning_resource_id = $2
        WHERE id = $1`,
      [objectId, entryId],
    );

    const mine = await listObjectsForResource(storage, ctx(patAcc), {
      ownerParticipantId: patId, owningResourceType: 'LifeStoryItem', owningResourceId: entryId,
    });
    const found = mine.find((a) => a.objectId === objectId);
    expect(found, 'the owner could not see their own photograph while it was being checked').toBeDefined();
    expect(found?.objectState).toBe('Quarantined');
  });

  /**
   * And nobody else does. A file that has not cleared checking is not
   * something to hand to a third person, and which files somebody tried
   * to add and had refused is their business and not their daughter's.
   */
  it('shows a shared viewer only what has cleared checking', async () => {
    const entryId = await entry('lsi_quarantined_shared');
    const cleared = await upload(PNG_BYTES, 'image/png');
    await scanPendingObjects(storage, sysCtx());
    await releaseObject(storage, ctx(patAcc), cfg, {
      objectId: cleared, owningResourceType: 'LifeStoryItem', owningResourceId: entryId,
    });
    const waiting = await upload(PNG_BYTES, 'image/png');
    await pool.query(
      `UPDATE storage_ops.stored_objects
          SET owning_resource_type = 'LifeStoryItem', owning_resource_id = $2
        WHERE id = $1`,
      [waiting, entryId],
    );

    const shared: StorageDeps = { ...storage, mayReadOwningResource: async () => true };
    const theirs = await listObjectsForResource(shared, ctx(otherAcc), {
      ownerParticipantId: patId, owningResourceType: 'LifeStoryItem', owningResourceId: entryId,
    });
    expect(theirs.map((a) => a.objectId)).toEqual([cleared]);
    expect(
      theirs.map((a) => a.objectId),
      'a file that had not cleared checking was handed to somebody else',
    ).not.toContain(waiting);

    // The owner sees both, and which is which.
    const mine = await listObjectsForResource(storage, ctx(patAcc), {
      ownerParticipantId: patId, owningResourceType: 'LifeStoryItem', owningResourceId: entryId,
    });
    expect(mine.map((a) => a.objectId).sort()).toEqual([cleared, waiting].sort());
  });

  /**
   * A photograph follows the memory it is on.
   *
   * The owner's decision (2026-09-01, B-30): one scope per memory,
   * governing the words and the pictures together. M16 cannot answer
   * "may this person see this memory" and must not learn how — so it
   * asks, through a port, and these exercise the port rather than
   * assuming it.
   *
   * The port here stands in for the one the API wires to M17. What is
   * tested is that M16 asks it, believes a yes, believes a no, and never
   * asks at all when nothing is wired.
   */
  describe('a photograph on a shared memory', () => {
    const withPort = (answer: boolean | ((input: { owningResourceId: string }) => boolean)): StorageDeps => ({
      ...storage,
      mayReadOwningResource: async (_ctx, input) =>
        typeof answer === 'function' ? answer(input) : answer,
    });

    const attached = async (owningResourceId: string) => {
      const objectId = await upload(PNG_BYTES, 'image/png');
      await scanPendingObjects(storage, sysCtx());
      await releaseObject(storage, ctx(patAcc), cfg, {
        objectId, owningResourceType: 'LifeStoryItem', owningResourceId: await entry(owningResourceId),
      });
      return objectId;
    };

    it('hands the photograph to somebody the memory was shared with', async () => {
      const objectId = await attached('lsi_shared_yes');
      const content = await readObject(withPort(true), ctx(otherAcc), { objectId });
      expect(content.contentType).toBe('image/png');
      const listed = await listObjectsForResource(withPort(true), ctx(otherAcc), {
        ownerParticipantId: patId, owningResourceType: 'LifeStoryItem', owningResourceId: 'lsi_shared_yes',
      });
      expect(listed.map((a) => a.objectId)).toEqual([objectId]);
    });

    /**
     * And refuses when the memory says no — which is the answer for a
     * private memory, a withdrawn one, and anybody with no standing.
     * Told as "not there", because the object's existence is protected.
     */
    it('refuses when the memory it is on was not shared with them', async () => {
      const objectId = await attached('lsi_shared_no');
      await expect(readObject(withPort(false), ctx(otherAcc), { objectId })).rejects.toMatchObject({
        code: 'RESOURCE_NOT_FOUND',
      });
      await expect(
        listObjectsForResource(withPort(false), ctx(otherAcc), {
          ownerParticipantId: patId, owningResourceType: 'LifeStoryItem', owningResourceId: 'lsi_shared_no',
        }),
      ).rejects.toMatchObject({ code: 'RESOURCE_NOT_FOUND' });
    });

    /**
     * With no port wired, nothing is shared. A deployment that forgets to
     * wire it shares no photographs at all, rather than every photograph
     * — the safe direction for that mistake.
     */
    it('shares nothing at all when no port is wired', async () => {
      const objectId = await attached('lsi_shared_unwired');
      await expect(readObject(storage, ctx(otherAcc), { objectId })).rejects.toMatchObject({
        code: 'RESOURCE_NOT_FOUND',
      });
    });

    /** And the owner never depends on the port to reach their own file. */
    it('gives the owner their own photograph whatever the port says', async () => {
      const objectId = await attached('lsi_shared_owner');
      expect((await readObject(withPort(false), ctx(patAcc), { objectId })).inline).toBe(true);
    });

    /**
     * The port is asked about the memory the file is actually on. A port
     * that answered for one memory while the file belonged to another
     * would share the wrong photographs, and nothing else here would
     * notice.
     */
    it('asks about the memory this file is attached to, and no other', async () => {
      const objectId = await attached('lsi_shared_which');
      const asked: string[] = [];
      const deps: StorageDeps = {
        ...storage,
        mayReadOwningResource: async (_ctx, input) => {
          asked.push(input.owningResourceId);
          return true;
        },
      };
      await readObject(deps, ctx(otherAcc), { objectId });
      expect(asked).toEqual(['lsi_shared_which']);
    });
  });

  /**
   * Somebody else asking is told the object is not there — not that they
   * may not have it.
   *
   * That is the point, and it caught this test out first: the object is
   * `protectedExistence`, so a refusal that said "permission denied"
   * would confirm to a stranger that a particular photograph exists on a
   * particular participant's record. The code is asserted rather than
   * merely "it threw", because the difference between the two answers is
   * the whole of what protected existence buys.
   */
  it('tells somebody else it is not there, rather than that they may not have it', async () => {
    const objectId = await upload(PNG_BYTES, 'image/png');
    await scanPendingObjects(storage, sysCtx());
    await releaseObject(storage, ctx(patAcc), cfg, {
      objectId, owningResourceType: 'LifeStoryItem', owningResourceId: await entry('lsi_read_other'),
    });
    await expect(readObject(storage, ctx(otherAcc), { objectId })).rejects.toMatchObject({
      code: 'RESOURCE_NOT_FOUND',
    });
    // And the owner still gets it, so the refusal above is about who is
    // asking and not about the object being unreadable to everyone.
    expect((await readObject(storage, ctx(patAcc), { objectId })).inline).toBe(true);
  });

  /**
   * A record pointing at bytes that are not there. The upload path writes
   * the bytes first so that this cannot happen from here, but a store can
   * lose an object for its own reasons, and the honest answer is that the
   * file is gone rather than an empty picture.
   */
  it('says the file is gone rather than returning nothing at all', async () => {
    const objectId = await upload(PNG_BYTES, 'image/png');
    await scanPendingObjects(storage, sysCtx());
    await releaseObject(storage, ctx(patAcc), cfg, {
      objectId, owningResourceType: 'LifeStoryItem', owningResourceId: await entry('lsi_read_lost'),
    });
    await storage.blobs.delete(objectId);
    await expect(readObject(storage, ctx(patAcc), { objectId })).rejects.toMatchObject({
      code: 'RESOURCE_NOT_FOUND',
    });
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

  /**
   * Taking a photograph back. 'Deleted' has been in the CHECK constraint
   * since the first migration with nothing ever writing it, so an
   * attached file was a one-way door — and only became reachable when
   * the screen for adding one existed.
   */
  it('an owner can remove a photograph: the bytes go, the fact that it existed stays', async () => {
    const { objectId } = await initiateUpload(storage, ctx(patAcc), cfg, {
      ownerParticipantId: patId,
      declaredContentType: 'text/plain',
      declaredSizeBytes: 5,
      attachTo: { owningResourceType: 'LifeStoryItem', owningResourceId: await entry('lsi_remove') },
    });
    await completeUpload(storage, ctx(patAcc), { objectId, content: Buffer.from('hello') });
    await scanPendingObjects(storage, sysCtx(), cfg);
    expect(
      (await listObjectsForResource(storage, ctx(patAcc), {
        ownerParticipantId: patId, owningResourceType: 'LifeStoryItem', owningResourceId: 'lsi_remove',
      })).length,
    ).toBe(1);

    await deleteObject(storage, ctx(patAcc), { objectId, confirmed: true });

    // Gone from the entry, and the bytes are gone from the store.
    expect(
      await listObjectsForResource(storage, ctx(patAcc), {
        ownerParticipantId: patId, owningResourceType: 'LifeStoryItem', owningResourceId: 'lsi_remove',
      }),
    ).toEqual([]);
    expect(await storage.blobs.get(objectId)).toBeNull();

    // The row stays. Erasing the fact that anything happened is not the
    // platform's to do quietly — what remains holds no photograph.
    const row = await pool.query(
      `SELECT object_state, owning_resource_id FROM storage_ops.stored_objects WHERE id = $1`,
      [objectId],
    );
    expect(row.rows[0]).toMatchObject({ object_state: 'Deleted', owning_resource_id: null });

    // Asking twice is not an error; the answer is the same either way.
    await deleteObject(storage, ctx(patAcc), { objectId, confirmed: true });
  });

  /**
   * A withdrawn entry refuses every other change — it cannot be revised,
   * and its testimony cannot be confirmed — while nothing stopped a
   * photograph being attached to one. The screen tells the participant a
   * withdrawn entry is kept for them to read, not that it is still open
   * for additions.
   */
  it('refuses to attach to a withdrawn entry, and says what stays', async () => {
    await entry('lsi_withdrawn', 'Withdrawn');
    await expect(
      initiateUpload(storage, ctx(patAcc), cfg, {
        ownerParticipantId: patId,
        declaredContentType: 'text/plain',
        declaredSizeBytes: 5,
        attachTo: { owningResourceType: 'LifeStoryItem', owningResourceId: 'lsi_withdrawn' },
      }),
    ).rejects.toMatchObject({ code: 'RESOURCE_STATE_BLOCKED' });
  });

  /** An entry that does not exist is not a place to put a photograph. */
  it('refuses to attach to an entry that is not there', async () => {
    await expect(
      initiateUpload(storage, ctx(patAcc), cfg, {
        ownerParticipantId: patId,
        declaredContentType: 'text/plain',
        declaredSizeBytes: 5,
        attachTo: { owningResourceType: 'LifeStoryItem', owningResourceId: 'lsi_nowhere' },
      }),
    ).rejects.toMatchObject({ code: 'RESOURCE_NOT_FOUND' });
  });

  /** Destroying somebody's photograph is not something a click may do alone. */
  it('removal is refused without a confirmation, and to anyone but the owner', async () => {
    const objectId = await upload(Buffer.from('mine'));
    await expect(deleteObject(storage, ctx(patAcc), { objectId, confirmed: false })).rejects.toBeDefined();
    await expect(deleteObject(storage, ctx(otherAcc), { objectId, confirmed: true })).rejects.toBeDefined();
    const row = await pool.query(`SELECT object_state FROM storage_ops.stored_objects WHERE id = $1`, [objectId]);
    expect(row.rows[0].object_state).not.toBe('Deleted');
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
