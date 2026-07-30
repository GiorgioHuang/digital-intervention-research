import { createHash } from 'node:crypto';
import { newId, PlatformError, type Clock, type RequestContext } from '@platform/kernel';
import { appendToOutbox, recordAuditEvent, withTransaction, type Pool } from '@platform/database';
import { assertAllowed, type PolicyDecisionResult } from '@platform/policy';
import { M06_EVENTS } from '../contracts/index.js';

export type PermissionCheck = (
  ctx: RequestContext,
  request: {
    action: string;
    resource: {
      type: string;
      id: string;
      state: string;
      protectedExistence: boolean;
      researchProjectId?: string;
    };
    confirmed?: boolean;
  },
) => Promise<PolicyDecisionResult>;

export interface M06Deps {
  pool: Pool;
  clock: Clock;
  checkPermission: PermissionCheck;
}

const hash = (o: object) => createHash('sha256').update(JSON.stringify(o)).digest('hex');

export async function createIntervention(
  deps: M06Deps,
  ctx: RequestContext,
  input: { interventionCode: string; name: string },
): Promise<{ interventionId: string }> {
  const decision = await deps.checkPermission(ctx, {
    action: 'intervention.draft',
    resource: { type: 'Intervention', id: 'new', state: 'Draft', protectedExistence: false },
  });
  assertAllowed(decision, false);

  const interventionId = newId('int');
  const now = deps.clock.now();
  await withTransaction(deps.pool, async (client) => {
    await client.query(
      `INSERT INTO intervention_portfolio.interventions (id, intervention_code, name) VALUES ($1, $2, $3)`,
      [interventionId, input.interventionCode, input.name],
    );
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: M06_EVENTS.InterventionCreated,
      sourceModule: 'M06',
      aggregateType: 'Intervention',
      aggregateId: interventionId,
      occurredAt: now,
    });
    await recordAuditEvent(client, ctx, {
      action: 'intervention.draft',
      targetType: 'Intervention',
      targetId: interventionId,
      occurredAt: now,
      result: 'Succeeded',
      source: 'M06',
      policyVersion: decision.policyVersion,
    });
  });
  return { interventionId };
}

export async function createInterventionVersion(
  deps: M06Deps,
  ctx: RequestContext,
  input: { interventionId: string; content: object },
): Promise<{ interventionVersionId: string; versionNumber: number }> {
  const decision = await deps.checkPermission(ctx, {
    action: 'intervention.draft',
    resource: { type: 'InterventionVersion', id: 'new', state: 'Draft', protectedExistence: false },
  });
  assertAllowed(decision, false);

  const now = deps.clock.now();
  return withTransaction(deps.pool, async (client) => {
    const next = await client.query(
      `SELECT coalesce(max(version_number), 0) + 1 AS n
         FROM intervention_portfolio.intervention_versions WHERE intervention_id = $1`,
      [input.interventionId],
    );
    const versionNumber: number = next.rows[0].n;
    const interventionVersionId = newId('iv');
    await client.query(
      `INSERT INTO intervention_portfolio.intervention_versions
         (id, intervention_id, version_number, content, content_hash)
       VALUES ($1, $2, $3, $4, $5)`,
      [interventionVersionId, input.interventionId, versionNumber, JSON.stringify(input.content), hash(input.content)],
    );
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: M06_EVENTS.InterventionVersionDrafted,
      sourceModule: 'M06',
      aggregateType: 'InterventionVersion',
      aggregateId: interventionVersionId,
      occurredAt: now,
    });
    await recordAuditEvent(client, ctx, {
      action: 'intervention.draft',
      targetType: 'InterventionVersion',
      targetId: interventionVersionId,
      occurredAt: now,
      result: 'Succeeded',
      source: 'M06',
      policyVersion: decision.policyVersion,
    });
    return { interventionVersionId, versionNumber };
  });
}

async function transition(
  deps: M06Deps,
  ctx: RequestContext,
  args: {
    versionId: string;
    action: string;
    fromStates: string[];
    toState: string;
    eventType: string;
    confirmed?: boolean;
    setSubmittedBy?: boolean;
    setApprovedBy?: boolean;
    supersedeActive?: boolean;
  },
): Promise<void> {
  const res = await deps.pool.query(
    `SELECT id, intervention_id, version_state, submitted_by_actor_id
       FROM intervention_portfolio.intervention_versions WHERE id = $1`,
    [args.versionId],
  );
  const row = res.rows[0];
  if (row === undefined) throw new PlatformError('RESOURCE_NOT_FOUND', 'Intervention version not found');

  const decision = await deps.checkPermission(ctx, {
    action: args.action,
    resource: { type: 'InterventionVersion', id: row.id, state: row.version_state, protectedExistence: false },
    ...(args.confirmed !== undefined ? { confirmed: args.confirmed } : {}),
  });
  assertAllowed(decision, args.confirmed ?? false);
  if (args.setApprovedBy && row.submitted_by_actor_id !== null && row.submitted_by_actor_id === ctx.actor!.id) {
    throw new PlatformError('AUTHORISATION_DENIED', 'Self-approval is not permitted');
  }

  const now = deps.clock.now();
  await withTransaction(deps.pool, async (client) => {
    const updated = await client.query(
      `UPDATE intervention_portfolio.intervention_versions
          SET version_state = $3,
              submitted_by_actor_id = CASE WHEN $4 THEN $6 ELSE submitted_by_actor_id END,
              approved_by_actor_id  = CASE WHEN $5 THEN $6 ELSE approved_by_actor_id END,
              approved_at           = CASE WHEN $5 THEN $7 ELSE approved_at END,
              record_version = record_version + 1, updated_at = $7
        WHERE id = $1 AND version_state = ANY($2)`,
      [args.versionId, args.fromStates, args.toState, args.setSubmittedBy ?? false, args.setApprovedBy ?? false, ctx.actor!.id, now],
    );
    if (updated.rowCount !== 1) {
      throw new PlatformError('INVALID_STATE_TRANSITION', `Version state does not allow ${args.action}`);
    }
    if (args.supersedeActive) {
      const superseded = await client.query(
        `UPDATE intervention_portfolio.intervention_versions
            SET version_state = 'Superseded', record_version = record_version + 1, updated_at = $2
          WHERE intervention_id = $1 AND version_state = 'Active' AND id <> $3
          RETURNING id`,
        [row.intervention_id, now, args.versionId],
      );
      for (const s of superseded.rows) {
        await appendToOutbox(client, ctx, {
          eventCategory: 'Domain',
          eventType: M06_EVENTS.InterventionVersionSuperseded,
          sourceModule: 'M06',
          aggregateType: 'InterventionVersion',
          aggregateId: s.id,
          occurredAt: now,
        });
      }
    }
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: args.eventType,
      sourceModule: 'M06',
      aggregateType: 'InterventionVersion',
      aggregateId: args.versionId,
      occurredAt: now,
    });
    await recordAuditEvent(client, ctx, {
      action: args.action,
      targetType: 'InterventionVersion',
      targetId: args.versionId,
      occurredAt: now,
      result: 'Succeeded',
      source: 'M06',
      policyVersion: decision.policyVersion,
    });
  });
}

export const submitInterventionVersion = (deps: M06Deps, ctx: RequestContext, versionId: string) =>
  transition(deps, ctx, {
    versionId,
    action: 'intervention.submit',
    fromStates: ['Draft'],
    toState: 'In Review',
    eventType: M06_EVENTS.InterventionVersionSubmittedForReview,
    setSubmittedBy: true,
  });

export const approveInterventionVersion = (deps: M06Deps, ctx: RequestContext, versionId: string, confirmed: boolean) =>
  transition(deps, ctx, {
    versionId,
    action: 'intervention.approve',
    fromStates: ['In Review'],
    toState: 'Approved',
    eventType: M06_EVENTS.InterventionVersionApproved,
    confirmed,
    setApprovedBy: true,
  });

export const activateInterventionVersion = (deps: M06Deps, ctx: RequestContext, versionId: string, confirmed: boolean) =>
  transition(deps, ctx, {
    versionId,
    action: 'intervention.activate',
    fromStates: ['Approved'],
    toState: 'Active',
    eventType: M06_EVENTS.InterventionVersionActivated,
    confirmed,
    supersedeActive: true,
  });

/** Configuration binds exact protocol + intervention versions (lineage). */
export async function createInterventionConfiguration(
  deps: M06Deps,
  ctx: RequestContext,
  input: {
    researchProjectId: string;
    protocolVersionId: string;
    interventionVersionId: string;
    settings?: object;
  },
): Promise<{ interventionConfigurationId: string }> {
  const decision = await deps.checkPermission(ctx, {
    action: 'intervention.draft',
    resource: {
      type: 'InterventionConfiguration',
      id: 'new',
      state: 'Draft',
      protectedExistence: false,
      researchProjectId: input.researchProjectId,
    },
  });
  assertAllowed(decision, false);

  const version = await deps.pool.query(
    `SELECT version_state FROM intervention_portfolio.intervention_versions WHERE id = $1`,
    [input.interventionVersionId],
  );
  if (version.rows[0] === undefined) throw new PlatformError('RESOURCE_NOT_FOUND', 'Intervention version not found');
  if (!['Approved', 'Active'].includes(version.rows[0].version_state)) {
    throw new PlatformError('RESOURCE_STATE_BLOCKED', 'Configuration requires an approved or active intervention version');
  }

  const interventionConfigurationId = newId('ic');
  const now = deps.clock.now();
  await withTransaction(deps.pool, async (client) => {
    await client.query(
      `INSERT INTO intervention_portfolio.intervention_configurations
         (id, research_project_id, protocol_version_id, intervention_version_id, settings)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        interventionConfigurationId,
        input.researchProjectId,
        input.protocolVersionId,
        input.interventionVersionId,
        JSON.stringify(input.settings ?? {}),
      ],
    );
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: M06_EVENTS.InterventionConfigurationCreated,
      sourceModule: 'M06',
      aggregateType: 'InterventionConfiguration',
      aggregateId: interventionConfigurationId,
      occurredAt: now,
    });
    await recordAuditEvent(client, ctx, {
      action: 'intervention.draft',
      targetType: 'InterventionConfiguration',
      targetId: interventionConfigurationId,
      occurredAt: now,
      result: 'Succeeded',
      source: 'M06',
      policyVersion: decision.policyVersion,
    });
  });
  return { interventionConfigurationId };
}
