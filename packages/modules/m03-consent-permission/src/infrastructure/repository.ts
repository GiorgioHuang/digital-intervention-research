import type { Pool, PoolClient } from '@platform/database';
import type { ConsentScopeState, RelationshipInput } from '@platform/policy';

export async function appendConsentDecision(
  client: PoolClient,
  row: {
    id: string;
    participantId: string;
    researchProjectId?: string;
    scope: string;
    templateVersion: string;
    decision: string;
    restrictions?: string[];
    decidedByActorId: string;
    effectiveFrom: Date;
    expiresAt?: Date;
    /** Only set when somebody other than the participant needs to explain
     *  the row — today, a demand to agree again. */
    decisionNote?: string;
  },
): Promise<void> {
  await client.query(
    `INSERT INTO consent_permission.consent_decisions
       (id, participant_id, research_project_id, consent_scope, consent_template_version,
        decision, restrictions, decided_by_actor_id, effective_from, expires_at,
        decision_note)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
    [
      row.id,
      row.participantId,
      row.researchProjectId ?? null,
      row.scope,
      row.templateVersion,
      row.decision,
      row.restrictions ?? [],
      row.decidedByActorId,
      row.effectiveFrom,
      row.expiresAt ?? null,
      row.decisionNote ?? null,
    ],
  );
  // Maintain the current-state projection in the same transaction.
  await client.query(
    `INSERT INTO consent_permission.consent_current
       (participant_id, research_project_id, consent_scope, decision,
        consent_template_version, restrictions, expires_at, last_decision_id, updated_at,
        decision_note)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8, now(), $9)
     ON CONFLICT (participant_id, research_project_id, consent_scope)
     DO UPDATE SET decision = EXCLUDED.decision,
                   consent_template_version = EXCLUDED.consent_template_version,
                   restrictions = EXCLUDED.restrictions,
                   expires_at = EXCLUDED.expires_at,
                   last_decision_id = EXCLUDED.last_decision_id,
                   updated_at = now(),
                   -- Cleared by an ordinary decision: once the participant
                   -- has answered, the explanation of what they were asked
                   -- is history and the history table keeps it.
                   decision_note = EXCLUDED.decision_note`,
    [
      row.participantId,
      row.researchProjectId ?? '',
      row.scope,
      row.decision,
      row.templateVersion,
      row.restrictions ?? [],
      row.expiresAt ?? null,
      row.id,
      row.decisionNote ?? null,
    ],
  );
}

export async function findCurrentConsents(
  queryable: Pool | PoolClient,
  participantId: string,
  researchProjectId?: string,
): Promise<ConsentScopeState[]> {
  const res = await queryable.query(
    `SELECT consent_scope, decision, restrictions, expires_at
       FROM consent_permission.consent_current
      WHERE participant_id = $1 AND research_project_id IN ('', $2)`,
    [participantId, researchProjectId ?? ''],
  );
  return res.rows.map((r) => ({
    scope: r.consent_scope,
    decision: r.decision,
    ...(r.expires_at === null ? {} : { expiresAt: r.expires_at }),
    ...(r.restrictions.length === 0 ? {} : { restrictions: r.restrictions }),
  }));
}

export async function findCurrentConsent(
  queryable: Pool | PoolClient,
  participantId: string,
  scope: string,
  researchProjectId?: string,
): Promise<{ decision: string } | undefined> {
  const res = await queryable.query(
    `SELECT decision FROM consent_permission.consent_current
      WHERE participant_id = $1 AND research_project_id = $2 AND consent_scope = $3`,
    [participantId, researchProjectId ?? '', scope],
  );
  return res.rows[0];
}

export async function insertRelationship(
  client: PoolClient,
  row: {
    id: string;
    participantId: string;
    relatedActorId: string;
    relationshipType: string;
    permittedActions: string[];
    proposedByActorId: string;
    expiresAt?: Date;
  },
): Promise<void> {
  await client.query(
    `INSERT INTO consent_permission.relationships
       (id, participant_id, related_actor_id, relationship_type, relationship_state,
        permitted_actions, proposed_by_actor_id, expires_at)
     VALUES ($1,$2,$3,$4,'PendingVerification',$5,$6,$7)`,
    [
      row.id,
      row.participantId,
      row.relatedActorId,
      row.relationshipType,
      row.permittedActions,
      row.proposedByActorId,
      row.expiresAt ?? null,
    ],
  );
}

export async function transitionRelationship(
  client: PoolClient,
  args: { id: string; expectedVersion: number; fromStates: string[]; toState: string; now: Date },
): Promise<boolean> {
  const res = await client.query(
    `UPDATE consent_permission.relationships
        SET relationship_state = $4,
            revoked_at = CASE WHEN $4 = 'Revoked' THEN $5 ELSE revoked_at END,
            record_version = record_version + 1, updated_at = $5
      WHERE id = $1 AND record_version = $2 AND relationship_state = ANY($3)`,
    [args.id, args.expectedVersion, args.fromStates, args.toState, args.now],
  );
  return res.rowCount === 1;
}

export async function findRelationshipsForActor(
  queryable: Pool | PoolClient,
  relatedActorId: string,
): Promise<RelationshipInput[]> {
  const res = await queryable.query(
    `SELECT relationship_state, participant_id, permitted_actions, expires_at
       FROM consent_permission.relationships
      WHERE related_actor_id = $1`,
    [relatedActorId],
  );
  return res.rows.map((r) => ({
    state: r.relationship_state,
    participantId: r.participant_id,
    permittedActions: r.permitted_actions,
    ...(r.expires_at === null ? {} : { expiresAt: r.expires_at }),
  }));
}

export async function findRelationship(
  queryable: Pool | PoolClient,
  id: string,
): Promise<{ id: string; participantId: string; state: string; recordVersion: number } | undefined> {
  const res = await queryable.query(
    `SELECT id, participant_id, relationship_state, record_version
       FROM consent_permission.relationships WHERE id = $1`,
    [id],
  );
  const row = res.rows[0];
  if (row === undefined) return undefined;
  return { id: row.id, participantId: row.participant_id, state: row.relationship_state, recordVersion: row.record_version };
}

export async function insertPolicyDecision(
  queryable: Pool | PoolClient,
  row: {
    id: string;
    actorId: string;
    action: string;
    resourceType: string;
    resourceId: string;
    outcome: string;
    reason: string;
    policyVersion: string;
    purposeCode?: string;
    organisationId?: string;
    researchProjectId?: string;
    correlationId?: string;
    traceId?: string;
  },
): Promise<void> {
  await queryable.query(
    `INSERT INTO consent_permission.policy_decisions
       (id, actor_id, action, resource_type, resource_id, outcome, reason, policy_version,
        purpose_code, organisation_id, research_project_id, correlation_id, trace_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
    [
      row.id,
      row.actorId,
      row.action,
      row.resourceType,
      row.resourceId,
      row.outcome,
      row.reason,
      row.policyVersion,
      row.purposeCode ?? null,
      row.organisationId ?? null,
      row.researchProjectId ?? null,
      row.correlationId ?? null,
      row.traceId ?? null,
    ],
  );
}
