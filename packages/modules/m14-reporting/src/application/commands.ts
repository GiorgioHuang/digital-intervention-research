import { createHash } from 'node:crypto';
import { newId, PlatformError, type Clock, type RequestContext } from '@platform/kernel';
import { appendToOutbox, recordAuditEvent, withTransaction, type Pool } from '@platform/database';
import { assertAllowed, type PolicyDecisionResult } from '@platform/policy';
import { M14_EVENTS } from '../contracts/index.js';

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

export interface M14Deps {
  pool: Pool;
  clock: Clock;
  checkPermission: PermissionCheck;
}

export async function createReport(
  deps: M14Deps,
  ctx: RequestContext,
  input: { researchProjectId: string; title: string; reportType: 'ParticipantSummary' | 'ResearchReport' | 'FindingPackage' },
): Promise<{ reportId: string }> {
  const decision = await deps.checkPermission(ctx, {
    action: 'report.create',
    resource: { type: 'Report', id: 'new', state: 'Draft', protectedExistence: false },
  });
  assertAllowed(decision, false);

  const reportId = newId('rpt');
  const now = deps.clock.now();
  await withTransaction(deps.pool, async (client) => {
    await client.query(
      `INSERT INTO reporting_submission.reports (id, research_project_id, title, report_type, created_by_actor_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [reportId, input.researchProjectId, input.title, input.reportType, ctx.actor!.id],
    );
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: M14_EVENTS.ReportCreated,
      sourceModule: 'M14',
      aggregateType: 'Report',
      aggregateId: reportId,
      occurredAt: now,
      payload: { reportType: input.reportType },
    });
    await recordAuditEvent(client, ctx, {
      action: 'report.create',
      targetType: 'Report',
      targetId: reportId,
      occurredAt: now,
      result: 'Succeeded',
      source: 'M14',
      policyVersion: decision.policyVersion,
    });
  });
  return { reportId };
}

export async function draftReportVersion(
  deps: M14Deps,
  ctx: RequestContext,
  input: { reportId: string; content: object },
): Promise<{ reportVersionId: string; versionNumber: number }> {
  const decision = await deps.checkPermission(ctx, {
    action: 'report.create',
    resource: { type: 'ReportVersion', id: 'new', state: 'Draft', protectedExistence: false },
  });
  assertAllowed(decision, false);

  const reportVersionId = newId('rpv');
  const now = deps.clock.now();
  return withTransaction(deps.pool, async (client) => {
    const next = await client.query(
      `SELECT COALESCE(MAX(version_number), 0) + 1 AS n
         FROM reporting_submission.report_versions WHERE report_id = $1`,
      [input.reportId],
    );
    const versionNumber = next.rows[0].n as number;
    await client.query(
      `INSERT INTO reporting_submission.report_versions (id, report_id, version_number, content, created_by_actor_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [reportVersionId, input.reportId, versionNumber, JSON.stringify(input.content), ctx.actor!.id],
    );
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: M14_EVENTS.ReportVersionDrafted,
      sourceModule: 'M14',
      aggregateType: 'ReportVersion',
      aggregateId: reportVersionId,
      occurredAt: now,
      payload: { versionNumber },
    });
    await recordAuditEvent(client, ctx, {
      action: 'report.create',
      targetType: 'ReportVersion',
      targetId: reportVersionId,
      occurredAt: now,
      result: 'Succeeded',
      source: 'M14',
      policyVersion: decision.policyVersion,
    });
    return { reportVersionId, versionNumber };
  });
}

/** Approve a report version: confirmed, approver ≠ author (code + CHECK); approved content becomes immutable (trigger). */
export async function approveReportVersion(
  deps: M14Deps,
  ctx: RequestContext,
  input: { reportVersionId: string; confirmed: boolean },
): Promise<void> {
  const rec = await deps.pool.query(
    `SELECT version_state, created_by_actor_id FROM reporting_submission.report_versions WHERE id = $1`,
    [input.reportVersionId],
  );
  const row = rec.rows[0];
  if (row === undefined) throw new PlatformError('RESOURCE_NOT_FOUND', 'Report version not found');
  const decision = await deps.checkPermission(ctx, {
    action: 'report.approve',
    resource: { type: 'ReportVersion', id: input.reportVersionId, state: row.version_state, protectedExistence: false },
    confirmed: input.confirmed,
  });
  assertAllowed(decision, input.confirmed);
  if (row.created_by_actor_id === ctx.actor!.id) {
    throw new PlatformError('AUTHORISATION_DENIED', 'Self-approval is not permitted');
  }

  const now = deps.clock.now();
  await withTransaction(deps.pool, async (client) => {
    const res = await client.query(
      `UPDATE reporting_submission.report_versions
          SET version_state = 'Approved', approved_by_actor_id = $2, updated_at = $3
        WHERE id = $1 AND version_state = 'Draft'`,
      [input.reportVersionId, ctx.actor!.id, now],
    );
    if (res.rowCount !== 1) throw new PlatformError('INVALID_STATE_TRANSITION', 'Version is not a draft');
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: M14_EVENTS.ReportVersionApproved,
      sourceModule: 'M14',
      aggregateType: 'ReportVersion',
      aggregateId: input.reportVersionId,
      occurredAt: now,
    });
    await recordAuditEvent(client, ctx, {
      action: 'report.approve',
      targetType: 'ReportVersion',
      targetId: input.reportVersionId,
      occurredAt: now,
      result: 'Succeeded',
      source: 'M14',
      policyVersion: decision.policyVersion,
    });
  });
}

/** Research export request: never identifiable (Doc 16 §37.2 + DB CHECK). */
export async function requestResearchExport(
  deps: M14Deps,
  ctx: RequestContext,
  input: {
    purpose: string;
    recipient: string;
    sources: string[];
    restrictions?: string;
    deIdentification: 'Pseudonymised' | 'Anonymised';
  },
): Promise<{ exportRequestId: string }> {
  const decision = await deps.checkPermission(ctx, {
    action: 'export.request',
    resource: { type: 'ExportRequest', id: 'new', state: 'Requested', protectedExistence: false },
  });
  assertAllowed(decision, false);
  if (input.sources.length === 0) {
    throw new PlatformError('VALIDATION_ERROR', 'An export names its exact sources');
  }
  return insertExportRequest(deps, ctx, {
    exportType: 'ResearchExport',
    purpose: input.purpose,
    recipient: input.recipient,
    sources: input.sources,
    restrictions: input.restrictions ?? '',
    deIdentification: input.deIdentification,
    participantId: null,
    policyVersion: decision.policyVersion,
  });
}

/**
 * Participant portability export (Doc 16 §37.5): owner-only + confirmed;
 * scope is fixed to the participant's own permitted records and
 * third-party restrictions are preserved in the manifest.
 */
export async function requestParticipantExport(
  deps: M14Deps,
  ctx: RequestContext,
  input: { participantId: string; purpose: string; confirmed: boolean },
): Promise<{ exportRequestId: string }> {
  const decision = await deps.checkPermission(ctx, {
    action: 'participant.export',
    resource: {
      type: 'ExportRequest',
      id: 'new',
      state: 'Requested',
      protectedExistence: true,
      ownerParticipantId: input.participantId,
    },
    confirmed: input.confirmed,
  });
  assertAllowed(decision, input.confirmed);
  return insertExportRequest(deps, ctx, {
    exportType: 'ParticipantPortability',
    purpose: input.purpose,
    recipient: 'participant-self',
    sources: ['own-permitted-records'],
    restrictions: 'third-party content excluded per source restrictions',
    deIdentification: 'None',
    participantId: input.participantId,
    policyVersion: decision.policyVersion,
  });
}

async function insertExportRequest(
  deps: M14Deps,
  ctx: RequestContext,
  args: {
    exportType: string;
    purpose: string;
    recipient: string;
    sources: string[];
    restrictions: string;
    deIdentification: string;
    participantId: string | null;
    policyVersion: string;
  },
): Promise<{ exportRequestId: string }> {
  const exportRequestId = newId('exr');
  const now = deps.clock.now();
  await withTransaction(deps.pool, async (client) => {
    await client.query(
      `INSERT INTO reporting_submission.export_requests
         (id, export_type, purpose, recipient, sources, restrictions, de_identification, participant_id, requested_by_actor_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        exportRequestId,
        args.exportType,
        args.purpose,
        args.recipient,
        JSON.stringify(args.sources),
        args.restrictions,
        args.deIdentification,
        args.participantId,
        ctx.actor!.id,
      ],
    );
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: M14_EVENTS.ExportRequested,
      sourceModule: 'M14',
      aggregateType: 'ExportRequest',
      aggregateId: exportRequestId,
      occurredAt: now,
      payload: { exportType: args.exportType, deIdentification: args.deIdentification },
    });
    await recordAuditEvent(client, ctx, {
      action: 'export.request',
      targetType: 'ExportRequest',
      targetId: exportRequestId,
      occurredAt: now,
      result: 'Succeeded',
      source: 'M14',
      policyVersion: args.policyVersion,
    });
  });
  return { exportRequestId };
}

/** Export decision: human + confirmed + MFA, decider ≠ requester (code + CHECK). */
export async function decideExport(
  deps: M14Deps,
  ctx: RequestContext,
  input: { exportRequestId: string; decision: 'Approved' | 'Rejected'; confirmed: boolean },
): Promise<void> {
  const rec = await deps.pool.query(
    `SELECT request_state, requested_by_actor_id FROM reporting_submission.export_requests WHERE id = $1`,
    [input.exportRequestId],
  );
  const row = rec.rows[0];
  if (row === undefined) throw new PlatformError('RESOURCE_NOT_FOUND', 'Export request not found');
  const decision = await deps.checkPermission(ctx, {
    action: 'export.approve',
    resource: { type: 'ExportRequest', id: input.exportRequestId, state: row.request_state, protectedExistence: false },
    confirmed: input.confirmed,
  });
  assertAllowed(decision, input.confirmed);
  if (row.requested_by_actor_id === ctx.actor!.id) {
    throw new PlatformError('AUTHORISATION_DENIED', 'Self-approval is not permitted');
  }

  const now = deps.clock.now();
  await withTransaction(deps.pool, async (client) => {
    const res = await client.query(
      `UPDATE reporting_submission.export_requests
          SET request_state = $2, approved_by_actor_id = $3, record_version = record_version + 1, updated_at = $4
        WHERE id = $1 AND request_state = 'Requested'`,
      [input.exportRequestId, input.decision, ctx.actor!.id, now],
    );
    if (res.rowCount !== 1) throw new PlatformError('INVALID_STATE_TRANSITION', 'Export is not open for decision');
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: M14_EVENTS.ExportDecided,
      sourceModule: 'M14',
      aggregateType: 'ExportRequest',
      aggregateId: input.exportRequestId,
      occurredAt: now,
      payload: { decision: input.decision },
    });
    await recordAuditEvent(client, ctx, {
      action: 'export.approve',
      targetType: 'ExportRequest',
      targetId: input.exportRequestId,
      occurredAt: now,
      result: 'Succeeded',
      source: 'M14',
      policyVersion: decision.policyVersion,
    });
  });
}

/**
 * Write the manifest for an APPROVED export; manifest + hash recorded
 * atomically.
 *
 * Named carefully, because the screens above it once called this "putting
 * the package together". It reads no participant data, gathers no records
 * and produces no file: the manifest is the export's own type, sources,
 * de-identification and restrictions, with a SHA-256 over that JSON.
 * Whoever carries the export out assembles it themselves and checks it
 * against this — which is the whole purpose of the hash, and is lost the
 * moment anybody believes the platform decided what went into the file.
 */
export async function generateExportPackage(
  deps: M14Deps,
  ctx: RequestContext,
  input: { exportRequestId: string },
): Promise<{ exportPackageId: string; manifestHash: string }> {
  const rec = await deps.pool.query(
    `SELECT request_state, export_type, sources, de_identification, restrictions
       FROM reporting_submission.export_requests WHERE id = $1`,
    [input.exportRequestId],
  );
  const row = rec.rows[0];
  if (row === undefined) throw new PlatformError('RESOURCE_NOT_FOUND', 'Export request not found');
  const decision = await deps.checkPermission(ctx, {
    action: 'export.generate',
    resource: { type: 'ExportRequest', id: input.exportRequestId, state: row.request_state, protectedExistence: false },
  });
  assertAllowed(decision, false);
  if (row.request_state !== 'Approved') {
    throw new PlatformError('APPROVAL_REQUIRED', 'Only approved exports can be generated');
  }

  const now = deps.clock.now();
  const manifest = {
    exportRequestId: input.exportRequestId,
    exportType: row.export_type,
    sources: row.sources,
    deIdentification: row.de_identification,
    restrictions: row.restrictions,
    generatedAt: now.toISOString(),
  };
  const manifestHash = createHash('sha256').update(JSON.stringify(manifest)).digest('hex');
  const exportPackageId = newId('exp');
  await withTransaction(deps.pool, async (client) => {
    await client.query(
      `INSERT INTO reporting_submission.export_packages (id, export_request_id, manifest, manifest_hash, generated_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [exportPackageId, input.exportRequestId, JSON.stringify(manifest), manifestHash, now],
    );
    await client.query(
      `UPDATE reporting_submission.export_requests
          SET request_state = 'Generated', record_version = record_version + 1, updated_at = $2
        WHERE id = $1 AND request_state = 'Approved'`,
      [input.exportRequestId, now],
    );
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: M14_EVENTS.ExportPackageGenerated,
      sourceModule: 'M14',
      aggregateType: 'ExportRequest',
      aggregateId: input.exportRequestId,
      occurredAt: now,
      payload: { manifestHash },
    });
    await recordAuditEvent(client, ctx, {
      action: 'export.generate',
      targetType: 'ExportRequest',
      targetId: input.exportRequestId,
      occurredAt: now,
      result: 'Succeeded',
      source: 'M14',
      policyVersion: decision.policyVersion,
    });
  });
  return { exportPackageId, manifestHash };
}

/**
 * Delivery states are distinct and truthful (Doc 16 §37.3): Generated is
 * not Delivered, Delivered is not Received; only forward transitions.
 */
export async function recordExportDelivery(
  deps: M14Deps,
  ctx: RequestContext,
  input: { exportRequestId: string; state: 'Delivered' | 'Received' },
): Promise<void> {
  const rec = await deps.pool.query(
    `SELECT request_state FROM reporting_submission.export_requests WHERE id = $1`,
    [input.exportRequestId],
  );
  const row = rec.rows[0];
  if (row === undefined) throw new PlatformError('RESOURCE_NOT_FOUND', 'Export request not found');
  const decision = await deps.checkPermission(ctx, {
    action: 'export.record-delivery',
    resource: { type: 'ExportRequest', id: input.exportRequestId, state: row.request_state, protectedExistence: false },
  });
  assertAllowed(decision, false);
  const from = input.state === 'Delivered' ? 'Generated' : 'Delivered';

  const now = deps.clock.now();
  await withTransaction(deps.pool, async (client) => {
    const res = await client.query(
      `UPDATE reporting_submission.export_requests
          SET request_state = $2, record_version = record_version + 1, updated_at = $3
        WHERE id = $1 AND request_state = $4`,
      [input.exportRequestId, input.state, now, from],
    );
    if (res.rowCount !== 1) {
      throw new PlatformError('INVALID_STATE_TRANSITION', `Delivery must move ${from} -> ${input.state}`);
    }
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: M14_EVENTS.ExportDeliveryStateChanged,
      sourceModule: 'M14',
      aggregateType: 'ExportRequest',
      aggregateId: input.exportRequestId,
      occurredAt: now,
      payload: { state: input.state },
    });
    await recordAuditEvent(client, ctx, {
      action: 'export.record-delivery',
      targetType: 'ExportRequest',
      targetId: input.exportRequestId,
      occurredAt: now,
      result: 'Succeeded',
      source: 'M14',
      policyVersion: decision.policyVersion,
    });
  });
}
