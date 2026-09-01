import { createHash } from 'node:crypto';
import { newId, PlatformError, type Clock, type RequestContext } from '@platform/kernel';
import { appendToOutbox, recordAuditEvent, withTransaction, type Pool } from '@platform/database';
import { assertAllowed, type PolicyDecisionResult } from '@platform/policy';
import type { BlobStore } from './blob-store.js';

export type PermissionCheck = (
  ctx: RequestContext,
  request: {
    action: string;
    resource: {
      type: string;
      id: string;
      state: string;
      protectedExistence: boolean;
      ownerParticipantId?: string;
    };
    confirmed?: boolean;
  },
) => Promise<PolicyDecisionResult>;

export interface StorageDeps {
  pool: Pool;
  clock: Clock;
  checkPermission: PermissionCheck;
  /**
   * Where the bytes go. Until this existed the pipeline wrote them into
   * a Postgres column with no way to put them anywhere else — see
   * blob-store.ts for what that meant and what the ordering rules are.
   */
  blobs: BlobStore;
}

/**
 * Upload policy is configuration, not architecture: values fail closed —
 * anything not explicitly allowed is refused (Doc 14 §59).
 */
export interface StorageConfig {
  maxSizeBytes: number;
  allowedContentTypes: readonly string[];
  /** Owning-resource type -> Data Classification (deterministic mapping). */
  classificationByResourceType: Readonly<Record<string, string>>;
}

export const DEFAULT_STORAGE_CONFIG: StorageConfig = {
  maxSizeBytes: 10 * 1024 * 1024,
  allowedContentTypes: ['image/jpeg', 'image/png', 'audio/mpeg', 'application/pdf', 'text/plain'],
  classificationByResourceType: {
    LifeStoryItem: 'Sensitive-Personal',
    Message: 'Private',
    AssessmentRecord: 'Sensitive-Personal',
  },
};

/**
 * Deterministic scanner simulator (real scanning vendor Pending External
 * Approval): content containing the EICAR test marker is malware; content
 * containing SIMULATE_SCAN_ERROR fails the scan. A failed scan NEVER
 * marks an object safe (Doc 14 §59).
 */
export const EICAR_MARKER = 'EICAR-STANDARD-ANTIVIRUS-TEST-FILE';
export const SCAN_ERROR_MARKER = 'SIMULATE_SCAN_ERROR';

export async function initiateUpload(
  deps: StorageDeps,
  ctx: RequestContext,
  config: StorageConfig,
  input: {
    ownerParticipantId: string;
    declaredContentType: string;
    declaredSizeBytes: number;
    /**
     * Where this is going, said at the start rather than in a second
     * call the participant has to make later. Optional: the explicit
     * release path is unchanged, and an upload with no destination yet
     * is legitimate.
     */
    attachTo?: { owningResourceType: string; owningResourceId: string };
  },
): Promise<{ objectId: string }> {
  const decision = await deps.checkPermission(ctx, {
    action: 'object.upload',
    resource: {
      type: 'StoredObject',
      id: 'new',
      state: 'Pending Upload',
      protectedExistence: true,
      ownerParticipantId: input.ownerParticipantId,
    },
  });
  assertAllowed(decision, false);
  // Fail closed: type and size must be explicitly allowed.
  if (!config.allowedContentTypes.includes(input.declaredContentType)) {
    throw new PlatformError('UNSUPPORTED_CAPABILITY', 'This file type is not accepted');
  }
  if (input.declaredSizeBytes <= 0 || input.declaredSizeBytes > config.maxSizeBytes) {
    throw new PlatformError('VALIDATION_ERROR', 'File size exceeds the accepted limit');
  }
  /*
   * The destination is checked now, not at release. A resource type with
   * no classification policy cannot receive objects, and finding that
   * out after somebody has uploaded a photograph means telling them
   * their file is stuck somewhere for a reason they could have been told
   * before they chose it.
   */
  if (input.attachTo !== undefined && config.classificationByResourceType[input.attachTo.owningResourceType] === undefined) {
    throw new PlatformError('UNSUPPORTED_CAPABILITY', 'No classification policy for this resource type');
  }

  /*
   * And the thing it is going onto has to still accept it.
   *
   * A withdrawn life-story entry refuses every other change — it cannot
   * be revised, and its testimony cannot be confirmed — while nothing
   * stopped a photograph being attached to one. The screen tells the
   * participant a withdrawn entry is kept for them to read, not that it
   * is still open for additions, and the platform should not be quietly
   * more permissive than what it says.
   *
   * Read at the moment of the write and by direct query, the way M07 and
   * M08 read an enrolment's state (D-52): use-time evaluation is the
   * mechanism this platform has, and nothing propagates.
   */
  if (input.attachTo?.owningResourceType === 'LifeStoryItem') {
    const item = await deps.pool.query(
      `SELECT item_state FROM life_story.items WHERE id = $1`,
      [input.attachTo.owningResourceId],
    );
    const state = (item.rows[0] as { item_state: string } | undefined)?.item_state;
    if (state === undefined) throw new PlatformError('RESOURCE_NOT_FOUND', 'That entry does not exist');
    if (['Withdrawn', 'Deleted', 'Archived'].includes(state)) {
      throw new PlatformError(
        'RESOURCE_STATE_BLOCKED',
        'This entry has been withdrawn; nothing further can be added to it. What is already on it stays.',
      );
    }
  }

  const objectId = newId('obj');
  const now = deps.clock.now();
  await withTransaction(deps.pool, async (client) => {
    await client.query(
      `INSERT INTO storage_ops.stored_objects
         (id, owner_participant_id, uploaded_by_actor_id, declared_content_type, declared_size_bytes,
          intended_owning_resource_type, intended_owning_resource_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        objectId, input.ownerParticipantId, ctx.actor!.id, input.declaredContentType, input.declaredSizeBytes,
        input.attachTo?.owningResourceType ?? null, input.attachTo?.owningResourceId ?? null,
      ],
    );
    await recordAuditEvent(client, ctx, {
      action: 'object.upload',
      targetType: 'StoredObject',
      targetId: objectId,
      participantId: input.ownerParticipantId,
      occurredAt: now,
      result: 'Succeeded',
      source: 'M16',
      policyVersion: decision.policyVersion,
    });
  });
  return { objectId };
}

/**
 * Complete the upload: checksum is computed server-side, the size must
 * match the declaration, and the object lands in QUARANTINE — never
 * directly in Available.
 */
export async function completeUpload(
  deps: StorageDeps,
  ctx: RequestContext,
  input: { objectId: string; content: Buffer },
): Promise<{ checksum: string }> {
  const row = await loadOwnedObject(deps, ctx, input.objectId);
  if (row.object_state !== 'Pending Upload') {
    throw new PlatformError('INVALID_STATE_TRANSITION', 'Object is not awaiting upload');
  }
  const now = deps.clock.now();
  if (input.content.byteLength !== Number(row.declared_size_bytes)) {
    await deps.pool.query(
      `UPDATE storage_ops.stored_objects
          SET object_state = 'Rejected', rejection_reason = 'size mismatch with declaration',
              record_version = record_version + 1, updated_at = $2
        WHERE id = $1`,
      [input.objectId, now],
    );
    throw new PlatformError('VALIDATION_ERROR', 'Uploaded size does not match the declaration');
  }
  const checksum = createHash('sha256').update(input.content).digest('hex');
  /*
   * Bytes first, then the record. If this write succeeds and the
   * transaction below does not, what is left is bytes no record points
   * at: unreachable, under an opaque identifier, and reclaimable. The
   * other order leaves a record pointing at bytes that are not there,
   * which is the platform saying it holds a file it does not.
   */
  await deps.blobs.put(input.objectId, input.content);
  await withTransaction(deps.pool, async (client) => {
    await client.query(
      `UPDATE storage_ops.stored_objects
          SET object_state = 'Quarantined', checksum_sha256 = $2, record_version = record_version + 1, updated_at = $3
        WHERE id = $1 AND object_state = 'Pending Upload'`,
      [input.objectId, checksum, now],
    );
    await appendToOutbox(client, ctx, {
      eventCategory: 'Operational',
      eventType: 'ObjectQuarantined',
      sourceModule: 'M16',
      aggregateType: 'StoredObject',
      aggregateId: input.objectId,
      occurredAt: now,
    });
  });
  return { checksum };
}

/**
 * Scan one quarantined object (worker-invoked or explicit). Outcomes:
 * Clean keeps the object quarantined (release still requires
 * classification + owning resource); malware rejects it; a scan error
 * leaves it quarantined and unsafe — processing failure never means safe.
 */
export async function scanObject(
  deps: StorageDeps,
  ctx: RequestContext,
  input: { objectId: string },
  config: StorageConfig = DEFAULT_STORAGE_CONFIG,
): Promise<{ outcome: 'Clean' | 'Malware Detected' | 'Scan Failed' }> {
  const obj = await deps.pool.query(
    `SELECT object_state, intended_owning_resource_type, intended_owning_resource_id
       FROM storage_ops.stored_objects WHERE id = $1`,
    [input.objectId],
  );
  const row = obj.rows[0];
  if (row === undefined) throw new PlatformError('RESOURCE_NOT_FOUND', 'Object not found');
  if (row.object_state !== 'Quarantined') {
    throw new PlatformError('INVALID_STATE_TRANSITION', 'Only quarantined objects are scanned');
  }
  const content = await deps.blobs.get(input.objectId);
  /*
   * A quarantined row whose bytes are gone is not clean and is not
   * malware — it is a fault, and the one outcome that must never be
   * inferred from a fault is safety.
   */
  if (content === null) {
    throw new PlatformError('INTERNAL_ERROR', 'The stored bytes for this object could not be read');
  }
  const text = content.toString('utf8');
  const outcome: 'Clean' | 'Malware Detected' | 'Scan Failed' = text.includes(EICAR_MARKER)
    ? 'Malware Detected'
    : text.includes(SCAN_ERROR_MARKER)
      ? 'Scan Failed'
      : 'Clean';

  const now = deps.clock.now();
  await withTransaction(deps.pool, async (client) => {
    if (outcome === 'Malware Detected') {
      await client.query(
        `UPDATE storage_ops.stored_objects
            SET scan_outcome = $2, object_state = 'Rejected', rejection_reason = 'malware detected',
                record_version = record_version + 1, updated_at = $3
          WHERE id = $1`,
        [input.objectId, outcome, now],
      );
    } else if (outcome === 'Clean' && row.intended_owning_resource_type !== null) {
      /*
       * The destination was named when the upload began, so this is
       * where it takes effect. Doing it here rather than asking the
       * participant for a second act is the whole point: a clean scan is
       * the last thing the platform was waiting for, and it is the
       * platform's business to notice, not theirs.
       *
       * Every part of the release gate still holds — the CHECK
       * constraint on this table refuses Available without a clean scan,
       * a checksum, a classification and an owning resource, and the
       * classification is derived from the resource type exactly as the
       * explicit path derives it.
       */
      const classification = config.classificationByResourceType[row.intended_owning_resource_type as string];
      if (classification === undefined) {
        // Unreachable via initiateUpload, which refuses an unmapped type
        // up front. Fail closed rather than assume: an object released
        // without a classification is a file nobody has graded.
        throw new PlatformError('UNSUPPORTED_CAPABILITY', 'No classification policy for this resource type');
      }
      await client.query(
        `UPDATE storage_ops.stored_objects
            SET scan_outcome = $2, object_state = 'Available', data_classification = $4,
                owning_resource_type = $5, owning_resource_id = $6,
                record_version = record_version + 1, updated_at = $3
          WHERE id = $1`,
        [
          input.objectId, outcome, now, classification,
          row.intended_owning_resource_type, row.intended_owning_resource_id,
        ],
      );
      await recordAuditEvent(client, ctx, {
        action: 'object.assign',
        targetType: 'StoredObject',
        targetId: input.objectId,
        occurredAt: now,
        result: 'Succeeded',
        source: 'M16',
        policyVersion: 'storage-pipeline',
      });
    } else {
      await client.query(
        `UPDATE storage_ops.stored_objects
            SET scan_outcome = $2, record_version = record_version + 1, updated_at = $3
          WHERE id = $1`,
        [input.objectId, outcome, now],
      );
    }
    await appendToOutbox(client, ctx, {
      eventCategory: 'Operational',
      eventType: outcome === 'Malware Detected' ? 'ObjectRejected' : 'ObjectScanned',
      sourceModule: 'M16',
      aggregateType: 'StoredObject',
      aggregateId: input.objectId,
      occurredAt: now,
      payload: { outcome },
    });
  });
  /*
   * After the record, not inside it. The row already says Rejected, so
   * nothing will serve these bytes whatever happens here; if the delete
   * fails they are a leak to reclaim, not a file the platform is still
   * offering. Doing it inside the transaction would mean a rollback
   * could restore the record for bytes already gone.
   */
  if (outcome === 'Malware Detected') await deps.blobs.delete(input.objectId);
  return { outcome };
}

/** Worker sweep: scan every quarantined object without an outcome yet. */
export async function scanPendingObjects(
  deps: StorageDeps,
  ctx: RequestContext,
  config: StorageConfig = DEFAULT_STORAGE_CONFIG,
): Promise<{ scanned: number }> {
  const res = await deps.pool.query(
    `SELECT id FROM storage_ops.stored_objects WHERE object_state = 'Quarantined' AND scan_outcome IS NULL`,
  );
  let scanned = 0;
  for (const row of res.rows) {
    await scanObject(deps, ctx, { objectId: row.id as string }, config);
    scanned += 1;
  }
  return { scanned };
}

/**
 * Release from quarantine: owner assigns the owning resource; the Data
 * Classification derives deterministically from the resource type
 * (config). Only a clean-scanned object can be released — the DB CHECK
 * backstops every gate.
 */
export async function releaseObject(
  deps: StorageDeps,
  ctx: RequestContext,
  config: StorageConfig,
  input: { objectId: string; owningResourceType: string; owningResourceId: string },
): Promise<{ dataClassification: string }> {
  const row = await loadOwnedObject(deps, ctx, input.objectId);
  if (row.object_state !== 'Quarantined' || row.scan_outcome !== 'Clean') {
    throw new PlatformError('ATTACHMENT_NOT_READY', 'Object has not cleared quarantine');
  }
  const dataClassification = config.classificationByResourceType[input.owningResourceType];
  if (dataClassification === undefined) {
    // Fail closed: unmapped resource types cannot receive objects.
    throw new PlatformError('UNSUPPORTED_CAPABILITY', 'No classification policy for this resource type');
  }
  const now = deps.clock.now();
  await withTransaction(deps.pool, async (client) => {
    const res = await client.query(
      `UPDATE storage_ops.stored_objects
          SET object_state = 'Available', data_classification = $2,
              owning_resource_type = $3, owning_resource_id = $4,
              record_version = record_version + 1, updated_at = $5
        WHERE id = $1 AND object_state = 'Quarantined' AND scan_outcome = 'Clean'`,
      [input.objectId, dataClassification, input.owningResourceType, input.owningResourceId, now],
    );
    if (res.rowCount !== 1) throw new PlatformError('ATTACHMENT_NOT_READY', 'Object has not cleared quarantine');
    await appendToOutbox(client, ctx, {
      eventCategory: 'Operational',
      eventType: 'ObjectReleased',
      sourceModule: 'M16',
      aggregateType: 'StoredObject',
      aggregateId: input.objectId,
      occurredAt: now,
      payload: { owningResourceType: input.owningResourceType, dataClassification },
    });
    await recordAuditEvent(client, ctx, {
      action: 'object.assign',
      targetType: 'StoredObject',
      targetId: input.objectId,
      occurredAt: now,
      result: 'Succeeded',
      source: 'M16',
      policyVersion: 'storage-pipeline',
    });
  });
  return { dataClassification };
}

export interface StoredObjectStatus {
  objectId: string;
  objectState: string;
  scanOutcome: string | null;
  declaredContentType: string;
  dataClassification: string | null;
  owningResourceType: string | null;
  rejectionReason: string | null;
}

/** Owner-only status (protected existence for everyone else). */
export async function getObjectStatus(
  deps: StorageDeps,
  ctx: RequestContext,
  objectId: string,
): Promise<StoredObjectStatus> {
  const row = await loadOwnedObject(deps, ctx, objectId);
  return {
    objectId,
    objectState: row.object_state as string,
    scanOutcome: (row.scan_outcome as string | null) ?? null,
    declaredContentType: row.declared_content_type as string,
    dataClassification: (row.data_classification as string | null) ?? null,
    owningResourceType: (row.owning_resource_type as string | null) ?? null,
    rejectionReason: (row.rejection_reason as string | null) ?? null,
  };
}

export interface AttachedObject {
  objectId: string;
  declaredContentType: string;
  declaredSizeBytes: number;
  objectState: string;
  dataClassification: string | null;
  createdAt: string;
}

/**
 * The objects attached to one owning resource — the read path that did
 * not exist.
 *
 * `releaseObject` records ownership on the object's side, and nothing
 * pointed back: the life story holds no reference to an object, and the
 * only query was for a single object by its identifier. So a file could
 * be uploaded, cleared and attached to a life story entry, and that
 * entry could never show it — unless the person had memorised an opaque
 * identifier. D-50 refused to build the upload screen for exactly this
 * reason, and this is the half that removes it.
 *
 * Owner-scoped, deliberately. Attachments belong to the participant who
 * uploaded them, and no supporter or member of staff reads them here —
 * D-39 established that sharing with a supporter does not exist in this
 * platform at all, so a listing that pretended otherwise would be the
 * control-that-does-nothing this project keeps removing.
 *
 * Only Available objects. Anything short of that has not cleared
 * quarantine, and a screen that listed it would be showing a file the
 * platform is not prepared to hand back.
 */
export async function listObjectsForResource(
  deps: StorageDeps,
  ctx: RequestContext,
  input: { ownerParticipantId: string; owningResourceType: string; owningResourceId: string },
): Promise<AttachedObject[]> {
  const decision = await deps.checkPermission(ctx, {
    action: 'object.view-own',
    resource: {
      type: 'StoredObject',
      id: `${input.owningResourceType}:${input.owningResourceId}`,
      state: 'Available',
      protectedExistence: true,
      ownerParticipantId: input.ownerParticipantId,
    },
  });
  assertAllowed(decision, false);
  const res = await deps.pool.query(
    `SELECT id, declared_content_type, declared_size_bytes, object_state, data_classification, created_at
       FROM storage_ops.stored_objects
      WHERE owner_participant_id = $1
        AND owning_resource_type = $2
        AND owning_resource_id = $3
        AND object_state = 'Available'
      ORDER BY created_at`,
    [input.ownerParticipantId, input.owningResourceType, input.owningResourceId],
  );
  return res.rows.map((r) => ({
    objectId: r.id as string,
    declaredContentType: r.declared_content_type as string,
    declaredSizeBytes: Number(r.declared_size_bytes),
    objectState: r.object_state as string,
    dataClassification: (r.data_classification as string | null) ?? null,
    createdAt: (r.created_at as Date).toISOString(),
  }));
}

/**
 * Taking a photograph back.
 *
 * `object_state` has allowed 'Deleted' since the first migration and no
 * code ever wrote it. So a participant could attach a picture to their
 * life story and had no way to remove it — a one-way door, on something
 * more personal than the one D-54 found in matching. Nothing made that
 * reachable until the screen for adding a photograph existed, which is
 * the increment immediately before this one.
 *
 * The bytes go; the row stays. What remains says a file was added and
 * removed and holds no photograph — deleting the row too would erase
 * the fact that anything ever happened, and the account of what happened
 * to somebody's record is not the platform's to quietly edit.
 *
 * Record first, then bytes, for the reason the whole pipeline follows:
 * a failure after the commit leaves bytes nothing points at, and the
 * other order would leave a record pointing at bytes that are gone.
 */
/**
 * What a photograph actually looks like, read from the bytes.
 *
 * The declared content type is whatever the uploading client said, and
 * it is kept because it is part of the record of what somebody claimed.
 * It is not what this serves: the two magic numbers below are checked
 * against the stored bytes, and only a file that really is the image it
 * claims to be is handed back as an image. Anything else is served as
 * an opaque download.
 *
 * The reason is narrow and worth stating. These bytes come from a person
 * and go back to a browser on this platform's own origin. A file that
 * declares itself an image and is markup would, served inline and
 * believed, run as this site — which is stored cross-site scripting with
 * the participant's own photograph as the vector. Sniffing is what makes
 * the declaration unable to lie.
 */
const IMAGE_SIGNATURES: ReadonlyArray<{ contentType: string; magic: readonly number[] }> = [
  { contentType: 'image/jpeg', magic: [0xff, 0xd8, 0xff] },
  { contentType: 'image/png', magic: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
];

/** The image this really is, or null for anything else. */
export function sniffImageType(bytes: Buffer): string | null {
  for (const { contentType, magic } of IMAGE_SIGNATURES) {
    if (bytes.length < magic.length) continue;
    if (magic.every((b, i) => bytes[i] === b)) return contentType;
  }
  return null;
}

export interface ObjectContent {
  bytes: Buffer;
  /** What the browser is told, derived from the bytes and never from the upload. */
  contentType: string;
  /** True only for a file that really is one of the images above. */
  inline: boolean;
  declaredContentType: string;
}

/**
 * The bytes of somebody's own photograph.
 *
 * Every part of the upload path existed — initiate, complete, scan,
 * release, list, delete — and nothing could read a file back. So a
 * participant could add a photograph to a memory and the screen could
 * only ever say "image/jpeg · 412 KB · added Tuesday": a filing card
 * where the picture should be. On a screen whose whole subject is
 * somebody's own life that is close to the worst place for it, and it is
 * why the life story showed a list of facts about photographs rather
 * than photographs (B-27).
 *
 * Owner-scoped through the same `object.view-own` the listing uses, so
 * this adds a way to read a file and no new right to read one.
 *
 * Available only. A file still in quarantine has not cleared checking,
 * and handing back bytes this platform has not finished inspecting is
 * exactly what quarantine exists to prevent.
 */
export async function readObject(
  deps: StorageDeps,
  ctx: RequestContext,
  input: { objectId: string },
): Promise<ObjectContent> {
  const res = await deps.pool.query(
    `SELECT object_state, owner_participant_id, declared_content_type
       FROM storage_ops.stored_objects WHERE id = $1`,
    [input.objectId],
  );
  const row = res.rows[0] as
    | { object_state: string; owner_participant_id: string; declared_content_type: string }
    | undefined;
  if (row === undefined) throw new PlatformError('RESOURCE_NOT_FOUND', 'Object not found');
  const decision = await deps.checkPermission(ctx, {
    action: 'object.view-own',
    resource: {
      type: 'StoredObject',
      id: input.objectId,
      state: row.object_state,
      protectedExistence: true,
      ownerParticipantId: row.owner_participant_id,
    },
  });
  assertAllowed(decision, false);
  if (row.object_state !== 'Available') {
    throw new PlatformError('ATTACHMENT_NOT_READY', 'That file has not finished being checked');
  }
  const bytes = await deps.blobs.get(input.objectId);
  /*
   * A record pointing at bytes that are not there. completeUpload writes
   * the bytes before the record precisely so this cannot happen, but a
   * store can lose an object for reasons of its own, and the honest
   * answer is that the file is gone — not an empty image.
   */
  if (bytes === null) throw new PlatformError('RESOURCE_NOT_FOUND', 'The file itself is no longer in storage');
  const sniffed = sniffImageType(bytes);
  return {
    bytes,
    contentType: sniffed ?? 'application/octet-stream',
    inline: sniffed !== null,
    declaredContentType: row.declared_content_type,
  };
}

export async function deleteObject(
  deps: StorageDeps,
  ctx: RequestContext,
  input: { objectId: string; confirmed: boolean },
): Promise<void> {
  const res = await deps.pool.query(
    `SELECT object_state, owner_participant_id FROM storage_ops.stored_objects WHERE id = $1`,
    [input.objectId],
  );
  const row = res.rows[0] as { object_state: string; owner_participant_id: string } | undefined;
  if (row === undefined) throw new PlatformError('RESOURCE_NOT_FOUND', 'Object not found');
  const decision = await deps.checkPermission(ctx, {
    action: 'object.delete-own',
    resource: {
      type: 'StoredObject',
      id: input.objectId,
      state: row.object_state,
      protectedExistence: true,
      ownerParticipantId: row.owner_participant_id,
    },
    confirmed: input.confirmed,
  });
  assertAllowed(decision, input.confirmed);
  if (row.object_state === 'Deleted') return; // Already gone; saying so twice helps nobody.

  const now = deps.clock.now();
  await withTransaction(deps.pool, async (client) => {
    await client.query(
      `UPDATE storage_ops.stored_objects
          SET object_state = 'Deleted', owning_resource_type = NULL, owning_resource_id = NULL,
              record_version = record_version + 1, updated_at = $2
        WHERE id = $1`,
      [input.objectId, now],
    );
    await appendToOutbox(client, ctx, {
      eventCategory: 'Operational',
      eventType: 'ObjectDeleted',
      sourceModule: 'M16',
      aggregateType: 'StoredObject',
      aggregateId: input.objectId,
      occurredAt: now,
    });
    await recordAuditEvent(client, ctx, {
      action: 'object.delete-own',
      targetType: 'StoredObject',
      targetId: input.objectId,
      participantId: row.owner_participant_id,
      occurredAt: now,
      result: 'Succeeded',
      source: 'M16',
      policyVersion: decision.policyVersion,
    });
  });
  await deps.blobs.delete(input.objectId);
}

/** Attachment gate (Doc 15 §58.4): anything short of Available refuses. */
export async function assertObjectSendable(deps: StorageDeps, objectId: string): Promise<void> {
  const res = await deps.pool.query(
    `SELECT object_state FROM storage_ops.stored_objects WHERE id = $1`,
    [objectId],
  );
  if (res.rows[0]?.object_state !== 'Available') {
    throw new PlatformError('ATTACHMENT_NOT_READY', 'Attachment is pending or quarantined');
  }
}

async function loadOwnedObject(
  deps: StorageDeps,
  ctx: RequestContext,
  objectId: string,
): Promise<Record<string, unknown>> {
  const res = await deps.pool.query(`SELECT * FROM storage_ops.stored_objects WHERE id = $1`, [objectId]);
  const row = res.rows[0];
  if (row === undefined) throw new PlatformError('RESOURCE_NOT_FOUND', 'Object not found');
  const decision = await deps.checkPermission(ctx, {
    action: 'object.assign',
    resource: {
      type: 'StoredObject',
      id: objectId,
      state: row.object_state as string,
      protectedExistence: true,
      ownerParticipantId: row.owner_participant_id as string,
    },
  });
  assertAllowed(decision, false);
  return row as Record<string, unknown>;
}

export interface UncaptionedPhotograph {
  objectId: string;
  /** The life-story item it is attached to, so the screen can open it. */
  owningResourceId: string;
  declaredContentType: string;
  /** When it was added — the card says "You added a photograph on Tuesday". */
  addedAt: string;
}

/**
 * Photographs somebody added to their life story and has not said
 * anything about.
 *
 * This is the state behind the design's "FINISH WHAT YOU STARTED" card:
 * "A photograph with no words … Nobody knows yet who is in it." It is not
 * a nag and it is not a completion score. It is one specific thing a
 * person started and did not finish, and it is worth surfacing because a
 * photograph with nobody named in it is the part of a life story most
 * likely to be lost — the person who knows is the one looking at it.
 *
 * Images only. A PDF or an audio file attached to a story is not a
 * photograph with nobody in it, and asking somebody to say who is in their
 * consent form would be nonsense.
 *
 * Available only, which matters more here than it looks: an object is
 * Available only after a clean malware scan, a checksum, a classification
 * and an owning resource (the release gate in the first storage
 * migration). A quarantined upload is not a photograph in somebody's story
 * yet, and putting it on Home would be telling them a file is in a place
 * it has not reached.
 */
export async function listUncaptionedPhotographs(
  deps: StorageDeps,
  ctx: RequestContext,
  ownerParticipantId: string,
  limit = 1,
): Promise<UncaptionedPhotograph[]> {
  const decision = await deps.checkPermission(ctx, {
    action: 'object.view-own',
    resource: {
      type: 'StoredObject',
      id: 'uncaptioned',
      state: 'Available',
      protectedExistence: true,
      ownerParticipantId,
    },
  });
  assertAllowed(decision, false);
  const capped = Math.min(Math.max(limit, 1), 20);
  const res = await deps.pool.query(
    `SELECT id, owning_resource_id, declared_content_type, created_at
       FROM storage_ops.stored_objects
      WHERE owner_participant_id = $1
        AND object_state = 'Available'
        AND owning_resource_type = 'LifeStoryItem'
        AND declared_content_type LIKE 'image/%'
        AND caption IS NULL
      ORDER BY created_at DESC
      LIMIT $2`,
    [ownerParticipantId, capped],
  );
  return res.rows.map((r) => ({
    objectId: r.id as string,
    owningResourceId: r.owning_resource_id as string,
    declaredContentType: r.declared_content_type as string,
    addedAt: (r.created_at as Date).toISOString(),
  }));
}

/**
 * Saying who is in a photograph, and when it was.
 *
 * Its own permission (`object.caption`) rather than the upload's: adding a
 * file and saying who is in it are different acts, and only the second one
 * puts a person's name next to a picture. The catalogue entry says the
 * same thing at more length.
 *
 * Clearing is allowed and is not a deletion. Somebody who wrote a name and
 * then thought better of it must be able to take it back without taking
 * the photograph back too, so an empty caption stores null — the state the
 * photograph was in before, which the Home card will find again. A stored
 * empty string would read as "answered" to every query and would be a
 * silent way of losing the question.
 */
export async function captionObject(
  deps: StorageDeps,
  ctx: RequestContext,
  input: { objectId: string; caption: string },
): Promise<{ caption: string | null }> {
  const owner = await deps.pool.query(
    `SELECT owner_participant_id, object_state FROM storage_ops.stored_objects WHERE id = $1`,
    [input.objectId],
  );
  const row = owner.rows[0];
  /*
   * Protected existence (ADR-050): a caller who does not own this must not
   * learn whether it exists. The permission is checked against the owner
   * where there is one, and against a value that cannot match where there
   * is not — so a missing object and somebody else's object refuse
   * identically.
   */
  const decision = await deps.checkPermission(ctx, {
    action: 'object.caption',
    resource: {
      type: 'StoredObject',
      id: input.objectId,
      state: 'Available',
      protectedExistence: true,
      ownerParticipantId: (row?.owner_participant_id as string | undefined) ?? 'no-such-owner',
    },
  });
  assertAllowed(decision, false);
  if (row === undefined) {
    throw new PlatformError('RESOURCE_NOT_FOUND', 'No such file');
  }
  if (row.object_state !== 'Available') {
    throw new PlatformError(
      'INVALID_STATE_TRANSITION',
      'This file is not ready yet, so nothing can be written about it',
    );
  }
  const caption = input.caption.trim();
  const stored = caption === '' ? null : caption;
  await withTransaction(deps.pool, async (client) => {
    await client.query(
      `UPDATE storage_ops.stored_objects
          SET caption = $2, caption_written_at = $3, record_version = record_version + 1, updated_at = $3
        WHERE id = $1`,
      [input.objectId, stored, stored === null ? null : deps.clock.now()],
    );
    await recordAuditEvent(client, ctx, {
      action: 'object.caption',
      targetType: 'StoredObject',
      targetId: input.objectId,
      occurredAt: deps.clock.now(),
      result: 'Succeeded',
      source: 'M16',
      // The words themselves are never copied here: audit rows carry
      // references and safe metadata only (Doc 14 §61), and a caption is
      // a participant's own writing about their own photograph.
    });
  });
  return { caption: stored };
}
