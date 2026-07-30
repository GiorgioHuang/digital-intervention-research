import { randomUUID } from 'node:crypto';
import type { PoolClient } from 'pg';
import type { RequestContext } from '@platform/kernel';
import { PlatformError } from '@platform/kernel';

export interface AuditEventInput {
  action: string;
  targetType: string;
  targetId: string;
  resourceVersion?: bigint | number;
  participantId?: string;
  occurredAt: Date;
  result: 'Allowed' | 'Denied' | 'Succeeded' | 'Failed';
  policyDecision?: string;
  policyDecisionReason?: string;
  policyVersion?: string;
  source: string;
  activeRole?: string;
  dataClassification?: string;
}

/**
 * Record a governance audit event (append-only store, ADR-051).
 * Pass references only — never copy message text, private Life Story
 * content, reporter identity or full AI prompts into audit fields
 * (Doc 14 §61). If the audit write fails the caller's transaction fails
 * with it: high-risk writes must not proceed without audit (fail closed).
 */
export async function recordAuditEvent(
  client: PoolClient,
  ctx: RequestContext,
  input: AuditEventInput,
): Promise<string> {
  if (ctx.actor === undefined) {
    throw new PlatformError('INTERNAL_ERROR', 'Audit events require an actor in the request context');
  }
  const id = randomUUID();
  await client.query(
    `INSERT INTO governance_audit.audit_events
       (id, actor_type, actor_id, active_role, auth_strength, action,
        target_type, target_id, resource_version, purpose_code,
        organisation_id, research_project_id, participant_id, occurred_at,
        result, policy_decision, policy_decision_reason, policy_version,
        source, correlation_id, causation_id, trace_id, data_classification)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)`,
    [
      id,
      ctx.actor.type,
      ctx.actor.id,
      input.activeRole ?? null,
      ctx.authStrength ?? null,
      input.action,
      input.targetType,
      input.targetId,
      input.resourceVersion === undefined ? null : input.resourceVersion.toString(),
      ctx.purposeCode ?? null,
      ctx.organisationId ?? null,
      ctx.researchProjectId ?? null,
      input.participantId ?? null,
      input.occurredAt,
      input.result,
      input.policyDecision ?? null,
      input.policyDecisionReason ?? null,
      input.policyVersion ?? null,
      input.source,
      ctx.correlationId,
      ctx.causationId ?? null,
      ctx.traceId,
      input.dataClassification ?? null,
    ],
  );
  return id;
}
