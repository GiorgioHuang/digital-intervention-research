import { createHash } from 'node:crypto';
import { newId, PlatformError, type Clock, type RequestContext } from '@platform/kernel';
import { appendToOutbox, recordAuditEvent, withTransaction, type Pool } from '@platform/database';
import { assertAllowed, type PolicyDecisionResult } from '@platform/policy';
import { M04_EVENTS } from '../contracts/index.js';

export type PermissionCheck = (
  ctx: RequestContext,
  request: {
    action: string;
    resource: {
      type: string;
      id: string;
      state: string;
      protectedExistence: boolean;
      organisationId?: string;
      researchProjectId?: string;
    };
    confirmed?: boolean;
  },
) => Promise<PolicyDecisionResult>;

export interface M04Deps {
  pool: Pool;
  clock: Clock;
  checkPermission: PermissionCheck;
}

function contentHash(content: object): string {
  return createHash('sha256').update(JSON.stringify(content)).digest('hex');
}

export async function createResearchProject(
  deps: M04Deps,
  ctx: RequestContext,
  input: { organisationId: string; title: string },
): Promise<{ researchProjectId: string }> {
  const decision = await deps.checkPermission(ctx, {
    action: 'project.create',
    resource: {
      type: 'ResearchProject',
      id: 'new',
      state: 'Draft',
      protectedExistence: false,
      organisationId: input.organisationId,
    },
  });
  assertAllowed(decision, false);

  const researchProjectId = newId('rp');
  const now = deps.clock.now();
  await withTransaction(deps.pool, async (client) => {
    await client.query(
      `INSERT INTO research_design.research_projects (id, organisation_id, title, created_by_actor_id)
       VALUES ($1, $2, $3, $4)`,
      [researchProjectId, input.organisationId, input.title, ctx.actor!.id],
    );
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: M04_EVENTS.ResearchProjectCreated,
      sourceModule: 'M04',
      aggregateType: 'ResearchProject',
      aggregateId: researchProjectId,
      occurredAt: now,
    });
    await recordAuditEvent(client, ctx, {
      action: 'project.create',
      targetType: 'ResearchProject',
      targetId: researchProjectId,
      occurredAt: now,
      result: 'Succeeded',
      source: 'M04',
      policyVersion: decision.policyVersion,
    });
  });
  return { researchProjectId };
}

export async function createProtocolVersion(
  deps: M04Deps,
  ctx: RequestContext,
  input: { researchProjectId: string; protocolId?: string; title?: string; content: object },
): Promise<{ protocolId: string; protocolVersionId: string; versionNumber: number }> {
  const decision = await deps.checkPermission(ctx, {
    action: 'protocol.draft',
    resource: {
      type: 'ProtocolVersion',
      id: 'new',
      state: 'Draft',
      protectedExistence: false,
      researchProjectId: input.researchProjectId,
    },
  });
  assertAllowed(decision, false);

  const now = deps.clock.now();
  return withTransaction(deps.pool, async (client) => {
    let protocolId = input.protocolId;
    if (protocolId === undefined) {
      protocolId = newId('prot');
      await client.query(
        `INSERT INTO research_design.protocols (id, research_project_id, title) VALUES ($1, $2, $3)`,
        [protocolId, input.researchProjectId, input.title ?? 'Protocol'],
      );
      await appendToOutbox(client, ctx, {
        eventCategory: 'Domain',
        eventType: M04_EVENTS.ProtocolCreated,
        sourceModule: 'M04',
        aggregateType: 'Protocol',
        aggregateId: protocolId,
        occurredAt: now,
      });
    }
    const next = await client.query(
      `SELECT coalesce(max(version_number), 0) + 1 AS n
         FROM research_design.protocol_versions WHERE protocol_id = $1`,
      [protocolId],
    );
    const versionNumber: number = next.rows[0].n;
    const protocolVersionId = newId('pv');
    await client.query(
      `INSERT INTO research_design.protocol_versions
         (id, protocol_id, version_number, content, content_hash)
       VALUES ($1, $2, $3, $4, $5)`,
      [protocolVersionId, protocolId, versionNumber, JSON.stringify(input.content), contentHash(input.content)],
    );
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: M04_EVENTS.ProtocolVersionDrafted,
      sourceModule: 'M04',
      aggregateType: 'ProtocolVersion',
      aggregateId: protocolVersionId,
      occurredAt: now,
    });
    await recordAuditEvent(client, ctx, {
      action: 'protocol.draft',
      targetType: 'ProtocolVersion',
      targetId: protocolVersionId,
      occurredAt: now,
      result: 'Succeeded',
      source: 'M04',
      policyVersion: decision.policyVersion,
    });
    return { protocolId, protocolVersionId, versionNumber };
  });
}

async function loadVersion(
  deps: M04Deps,
  id: string,
): Promise<{ id: string; state: string; recordVersion: number; submittedBy: string | null; researchProjectId: string; protocolId: string }> {
  const res = await deps.pool.query(
    `SELECT v.id, v.version_state, v.record_version, v.submitted_by_actor_id, v.protocol_id, p.research_project_id
       FROM research_design.protocol_versions v
       JOIN research_design.protocols p ON p.id = v.protocol_id
      WHERE v.id = $1`,
    [id],
  );
  const row = res.rows[0];
  if (row === undefined) throw new PlatformError('RESOURCE_NOT_FOUND', 'Protocol version not found');
  return {
    id: row.id,
    state: row.version_state,
    recordVersion: row.record_version,
    submittedBy: row.submitted_by_actor_id,
    researchProjectId: row.research_project_id,
    protocolId: row.protocol_id,
  };
}

async function transitionVersion(
  deps: M04Deps,
  ctx: RequestContext,
  args: {
    versionId: string;
    action: string;
    fromStates: string[];
    toState: string;
    eventType: string;
    confirmed?: boolean;
    extraSql?: (client: Parameters<Parameters<typeof withTransaction>[1]>[0], now: Date) => Promise<void>;
    setSubmittedBy?: boolean;
    setApprovedBy?: boolean;
  },
): Promise<void> {
  const version = await loadVersion(deps, args.versionId);
  const decision = await deps.checkPermission(ctx, {
    action: args.action,
    resource: {
      type: 'ProtocolVersion',
      id: version.id,
      state: version.state,
      protectedExistence: false,
      researchProjectId: version.researchProjectId,
    },
    ...(args.confirmed !== undefined ? { confirmed: args.confirmed } : {}),
  });
  assertAllowed(decision, args.confirmed ?? false);

  // Separation of duties: the approver must not be the submitter (ADR-051).
  if (args.setApprovedBy && version.submittedBy !== null && version.submittedBy === ctx.actor!.id) {
    throw new PlatformError('AUTHORISATION_DENIED', 'Self-approval is not permitted');
  }

  const now = deps.clock.now();
  await withTransaction(deps.pool, async (client) => {
    const res = await client.query(
      `UPDATE research_design.protocol_versions
          SET version_state = $3,
              submitted_by_actor_id = CASE WHEN $4 THEN $6 ELSE submitted_by_actor_id END,
              approved_by_actor_id  = CASE WHEN $5 THEN $6 ELSE approved_by_actor_id END,
              approved_at           = CASE WHEN $5 THEN $7 ELSE approved_at END,
              record_version = record_version + 1, updated_at = $7
        WHERE id = $1 AND version_state = ANY($2)`,
      [args.versionId, args.fromStates, args.toState, args.setSubmittedBy ?? false, args.setApprovedBy ?? false, ctx.actor!.id, now],
    );
    if (res.rowCount !== 1) {
      throw new PlatformError('INVALID_STATE_TRANSITION', `Version is not in a state that allows ${args.action}`);
    }
    if (args.extraSql) await args.extraSql(client, now);
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: args.eventType,
      sourceModule: 'M04',
      aggregateType: 'ProtocolVersion',
      aggregateId: args.versionId,
      occurredAt: now,
    });
    await recordAuditEvent(client, ctx, {
      action: args.action,
      targetType: 'ProtocolVersion',
      targetId: args.versionId,
      occurredAt: now,
      result: 'Succeeded',
      source: 'M04',
      policyVersion: decision.policyVersion,
    });
  });
}

export function submitProtocolVersion(deps: M04Deps, ctx: RequestContext, versionId: string): Promise<void> {
  return transitionVersion(deps, ctx, {
    versionId,
    action: 'protocol.submit',
    fromStates: ['Draft'],
    toState: 'In Review',
    eventType: M04_EVENTS.ProtocolVersionSubmittedForReview,
    setSubmittedBy: true,
  });
}

export function approveProtocolVersion(
  deps: M04Deps,
  ctx: RequestContext,
  versionId: string,
  confirmed: boolean,
): Promise<void> {
  return transitionVersion(deps, ctx, {
    versionId,
    action: 'protocol.approve',
    fromStates: ['In Review'],
    toState: 'Approved',
    eventType: M04_EVENTS.ProtocolVersionApproved,
    confirmed,
    setApprovedBy: true,
  });
}

/**
 * Refusing a protocol version.
 *
 * 'Rejected' has been in the version_state CHECK from the start and no
 * code path could write it, so the approval screen offered one outcome and
 * called it a decision. Refusing carries the same permission as approving,
 * because they are the same authority exercised two ways, and the same
 * separation of duties; it takes a reason because the researcher whose
 * version is refused has to be able to find out why.
 */
export async function rejectProtocolVersion(
  deps: M04Deps,
  ctx: RequestContext,
  versionId: string,
  input: { reason: string; confirmed: boolean },
): Promise<void> {
  if (input.reason.trim() === '') {
    throw new PlatformError('VALIDATION_ERROR', 'Refusing a protocol version needs a reason');
  }
  const version = await loadVersion(deps, versionId);
  if (version.submittedBy !== null && version.submittedBy === ctx.actor?.id) {
    throw new PlatformError('AUTHORISATION_DENIED', 'You cannot refuse a version you submitted');
  }
  return transitionVersion(deps, ctx, {
    versionId,
    action: 'protocol.approve',
    fromStates: ['In Review'],
    toState: 'Rejected',
    eventType: M04_EVENTS.ProtocolVersionRejected,
    confirmed: input.confirmed,
    extraSql: async (client, now) => {
      await client.query(
        `UPDATE research_design.protocol_versions
            SET refused_by_actor_id = $2, refused_reason = $3, refused_at = $4
          WHERE id = $1`,
        [versionId, ctx.actor!.id, input.reason.trim(), now],
      );
    },
  });
}

/** Activation supersedes any previously Active version in the same transaction. */
export async function activateProtocolVersion(
  deps: M04Deps,
  ctx: RequestContext,
  versionId: string,
  confirmed: boolean,
): Promise<void> {
  const version = await loadVersion(deps, versionId);
  return transitionVersion(deps, ctx, {
    versionId,
    action: 'protocol.activate',
    fromStates: ['Approved'],
    toState: 'Active',
    eventType: M04_EVENTS.ProtocolVersionActivated,
    confirmed,
    extraSql: async (client, now) => {
      const superseded = await client.query(
        `UPDATE research_design.protocol_versions
            SET version_state = 'Superseded', record_version = record_version + 1, updated_at = $2
          WHERE protocol_id = $1 AND version_state = 'Active' AND id <> $3
          RETURNING id`,
        [version.protocolId, now, versionId],
      );
      for (const row of superseded.rows) {
        await appendToOutbox(client, ctx, {
          eventCategory: 'Domain',
          eventType: M04_EVENTS.ProtocolVersionSuperseded,
          sourceModule: 'M04',
          aggregateType: 'ProtocolVersion',
          aggregateId: row.id,
          occurredAt: now,
        });
      }
    },
  });
}
