import { createHash } from 'node:crypto';
import { newId, PlatformError, type Clock, type RequestContext } from '@platform/kernel';
import { appendToOutbox, recordAuditEvent, withTransaction, type Pool } from '@platform/database';
import { assertAllowed, type PolicyDecisionResult } from '@platform/policy';

export type PermissionCheck = (
  ctx: RequestContext,
  request: {
    action: string;
    resource: { type: string; id: string; state: string; protectedExistence: boolean; researchProjectId?: string };
    confirmed?: boolean;
  },
) => Promise<PolicyDecisionResult>;

export interface M12Deps {
  pool: Pool;
  clock: Clock;
  checkPermission: PermissionCheck;
}

const hash = (o: object) => createHash('sha256').update(JSON.stringify(o)).digest('hex');

export async function createDatasetDefinition(
  deps: M12Deps,
  ctx: RequestContext,
  input: { researchProjectId: string; name: string; variables: Record<string, unknown> },
): Promise<{ datasetDefinitionId: string }> {
  const decision = await deps.checkPermission(ctx, {
    action: 'dataset.define',
    resource: { type: 'DatasetDefinition', id: 'new', state: 'Draft', protectedExistence: false, researchProjectId: input.researchProjectId },
  });
  assertAllowed(decision, false);
  // Message body is excluded from ordinary datasets by default (ADR-034).
  const varNames = Object.keys(input.variables).map((v) => v.toLowerCase());
  if (varNames.some((v) => v.includes('message_body') || v.includes('messagecontent'))) {
    throw new PlatformError('DEIDENTIFICATION_REQUIRED', 'Message content requires a separately governed restricted DatasetDefinition');
  }
  const datasetDefinitionId = newId('dd');
  const now = deps.clock.now();
  await withTransaction(deps.pool, async (client) => {
    await client.query(
      `INSERT INTO dataset_quality.dataset_definitions (id, research_project_id, name, variables, created_by_actor_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [datasetDefinitionId, input.researchProjectId, input.name, JSON.stringify(input.variables), ctx.actor!.id],
    );
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: 'DatasetDefinitionCreated',
      sourceModule: 'M12',
      aggregateType: 'DatasetDefinition',
      aggregateId: datasetDefinitionId,
      occurredAt: now,
    });
  });
  return { datasetDefinitionId };
}

export async function approveDatasetDefinition(
  deps: M12Deps,
  ctx: RequestContext,
  input: { datasetDefinitionId: string; confirmed: boolean },
): Promise<void> {
  const decision = await deps.checkPermission(ctx, {
    action: 'dataset.approve-definition',
    resource: { type: 'DatasetDefinition', id: input.datasetDefinitionId, state: 'Draft', protectedExistence: false },
    confirmed: input.confirmed,
  });
  assertAllowed(decision, input.confirmed);
  const now = deps.clock.now();
  await withTransaction(deps.pool, async (client) => {
    const res = await client.query(
      `UPDATE dataset_quality.dataset_definitions
          SET definition_state = 'Approved', approved_by_actor_id = $2,
              record_version = record_version + 1, updated_at = $3
        WHERE id = $1 AND definition_state IN ('Draft', 'In Review') AND created_by_actor_id <> $2`,
      [input.datasetDefinitionId, ctx.actor!.id, now],
    );
    if (res.rowCount !== 1) {
      throw new PlatformError('INVALID_STATE_TRANSITION', 'Definition not approvable, or self-approval attempted');
    }
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: 'DatasetDefinitionApproved',
      sourceModule: 'M12',
      aggregateType: 'DatasetDefinition',
      aggregateId: input.datasetDefinitionId,
      occurredAt: now,
    });
  });
}

/** Generation requires an APPROVED definition; manifest records lineage. */
export async function generateDatasetVersion(
  deps: M12Deps,
  ctx: RequestContext,
  input: { datasetDefinitionId: string; sourceDescription: string; rowCount: number },
): Promise<{ datasetVersionId: string }> {
  const decision = await deps.checkPermission(ctx, {
    action: 'dataset.generate',
    resource: { type: 'DatasetVersion', id: 'new', state: 'Draft', protectedExistence: false },
  });
  assertAllowed(decision, false);
  const def = await deps.pool.query(
    `SELECT definition_state FROM dataset_quality.dataset_definitions WHERE id = $1`,
    [input.datasetDefinitionId],
  );
  if (def.rows[0] === undefined) throw new PlatformError('RESOURCE_NOT_FOUND', 'Dataset definition not found');
  if (def.rows[0].definition_state !== 'Approved') {
    throw new PlatformError('RESOURCE_STATE_BLOCKED', 'Generation requires an approved DatasetDefinition');
  }
  const now = deps.clock.now();
  const manifest = {
    datasetDefinitionId: input.datasetDefinitionId,
    source: input.sourceDescription,
    generatedAt: now.toISOString(),
    rowCount: input.rowCount,
  };
  const datasetVersionId = newId('dv');
  await withTransaction(deps.pool, async (client) => {
    const next = await client.query(
      `SELECT coalesce(max(version_number), 0) + 1 AS n FROM dataset_quality.dataset_versions WHERE dataset_definition_id = $1`,
      [input.datasetDefinitionId],
    );
    await client.query(
      `INSERT INTO dataset_quality.dataset_versions
         (id, dataset_definition_id, version_number, manifest, manifest_hash, row_count)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [datasetVersionId, input.datasetDefinitionId, next.rows[0].n, JSON.stringify(manifest), hash(manifest), input.rowCount],
    );
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: 'DatasetVersionGenerated',
      sourceModule: 'M12',
      aggregateType: 'DatasetVersion',
      aggregateId: datasetVersionId,
      occurredAt: now,
    });
  });
  return { datasetVersionId };
}

export async function completeQualityReview(
  deps: M12Deps,
  ctx: RequestContext,
  datasetVersionId: string,
): Promise<void> {
  const decision = await deps.checkPermission(ctx, {
    action: 'dataset.review',
    resource: { type: 'DatasetVersion', id: datasetVersionId, state: 'Generated', protectedExistence: false },
  });
  assertAllowed(decision, false);
  const now = deps.clock.now();
  await withTransaction(deps.pool, async (client) => {
    const res = await client.query(
      `UPDATE dataset_quality.dataset_versions
          SET version_state = 'Quality Reviewed', record_version = record_version + 1, updated_at = $2
        WHERE id = $1 AND version_state IN ('Generated', 'Quality Review')`,
      [datasetVersionId, now],
    );
    if (res.rowCount !== 1) throw new PlatformError('INVALID_STATE_TRANSITION', 'Version not reviewable');
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: 'DatasetQualityReviewCompleted',
      sourceModule: 'M12',
      aggregateType: 'DatasetVersion',
      aggregateId: datasetVersionId,
      occurredAt: now,
    });
  });
}

/**
 * DatasetLock: a HUMAN with MFA and explicit confirmation locks a
 * quality-reviewed version; AI/automation can never lock (ADR-045,
 * ATR-018). The lock captures the manifest hash and the version becomes
 * immutable (DB trigger). Canonical event: DatasetVersionLocked —
 * deprecated aliases are lint-banned.
 */
export async function lockDatasetVersion(
  deps: M12Deps,
  ctx: RequestContext,
  input: { datasetVersionId: string; confirmed: boolean },
): Promise<{ datasetLockId: string }> {
  if (ctx.actor?.type !== 'user') {
    throw new PlatformError('AUTHORISATION_DENIED', 'DatasetLock requires an authenticated human');
  }
  const decision = await deps.checkPermission(ctx, {
    action: 'dataset.lock',
    resource: { type: 'DatasetVersion', id: input.datasetVersionId, state: 'Quality Reviewed', protectedExistence: false },
    confirmed: input.confirmed,
  });
  assertAllowed(decision, input.confirmed);

  const now = deps.clock.now();
  const datasetLockId = newId('dl');
  await withTransaction(deps.pool, async (client) => {
    const res = await client.query(
      `UPDATE dataset_quality.dataset_versions
          SET version_state = 'Locked', record_version = record_version + 1, updated_at = $2
        WHERE id = $1 AND version_state = 'Quality Reviewed'
        RETURNING manifest_hash`,
      [input.datasetVersionId, now],
    );
    if (res.rows[0] === undefined) {
      throw new PlatformError('DATASET_LOCK_NOT_READY', 'Version must complete quality review before locking');
    }
    await client.query(
      `INSERT INTO dataset_quality.dataset_locks (id, dataset_version_id, locked_by_actor_id, manifest_hash)
       VALUES ($1, $2, $3, $4)`,
      [datasetLockId, input.datasetVersionId, ctx.actor!.id, res.rows[0].manifest_hash],
    );
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: 'DatasetVersionLocked',
      sourceModule: 'M12',
      aggregateType: 'DatasetVersion',
      aggregateId: input.datasetVersionId,
      occurredAt: now,
    });
    await recordAuditEvent(client, ctx, {
      action: 'dataset.lock',
      targetType: 'DatasetVersion',
      targetId: input.datasetVersionId,
      occurredAt: now,
      result: 'Succeeded',
      source: 'M12',
      policyVersion: decision.policyVersion,
    });
  });
  return { datasetLockId };
}
