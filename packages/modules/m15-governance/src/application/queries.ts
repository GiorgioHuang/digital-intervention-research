import { PlatformError, type RequestContext } from '@platform/kernel';
import { recordAuditEvent, withTransaction } from '@platform/database';
import { assertAllowed } from '@platform/policy';
import type { M15Deps } from './commands.js';

export interface PendingApproval {
  approvalRecordId: string;
  artefactType: string;
  artefactId: string;
  artefactVersion: number;
  requestedByActorId: string;
  createdAt: string;
}

/** Open approval requests (approver work queue). */
export async function listPendingApprovals(deps: M15Deps, ctx: RequestContext): Promise<PendingApproval[]> {
  const decision = await deps.checkPermission(ctx, {
    action: 'approval-queue.view',
    resource: { type: 'ApprovalQueue', id: 'all', state: 'Active', protectedExistence: false },
  });
  assertAllowed(decision, false);
  const res = await deps.pool.query(
    `SELECT id, artefact_type, artefact_id, artefact_version, requested_by_actor_id, created_at
       FROM governance_audit.approval_records
      WHERE approval_state = 'Requested'
      ORDER BY created_at ASC`,
  );
  return res.rows.map((r) => ({
    approvalRecordId: r.id as string,
    artefactType: r.artefact_type as string,
    artefactId: r.artefact_id as string,
    artefactVersion: r.artefact_version as number,
    requestedByActorId: r.requested_by_actor_id as string,
    createdAt: (r.created_at as Date).toISOString(),
  }));
}

export interface PendingBreakGlassReview {
  breakGlassId: string;
  executedByActorId: string;
  reason: string;
  scope: string;
  expiresAt: string;
  createdAt: string;
}

/** Break-glass records awaiting their mandatory retrospective review. */
export async function listBreakGlassPendingReview(
  deps: M15Deps,
  ctx: RequestContext,
): Promise<PendingBreakGlassReview[]> {
  const decision = await deps.checkPermission(ctx, {
    action: 'governance-queue.view',
    resource: { type: 'GovernanceQueue', id: 'all', state: 'Active', protectedExistence: false },
  });
  assertAllowed(decision, false);
  const res = await deps.pool.query(
    `SELECT id, executed_by_actor_id, reason, scope, expires_at, created_at
       FROM governance_audit.break_glass_records
      WHERE review_state = 'Pending Review'
      ORDER BY created_at ASC`,
  );
  return res.rows.map((r) => ({
    breakGlassId: r.id as string,
    executedByActorId: r.executed_by_actor_id as string,
    reason: r.reason as string,
    scope: r.scope as string,
    expiresAt: (r.expires_at as Date).toISOString(),
    createdAt: (r.created_at as Date).toISOString(),
  }));
}

export interface AuditEventRow {
  auditEventId: string;
  occurredAt: string;
  actorType: string;
  actorId: string;
  activeRole: string | null;
  authStrength: string | null;
  action: string;
  targetType: string;
  targetId: string;
  result: string;
  policyDecision: string | null;
  policyDecisionReason: string | null;
  policyVersion: string | null;
  source: string;
  participantId: string | null;
  accessReason: string | null;
}

export interface AuditQuery {
  /** Required. Recorded with the query, which is what makes asking worth anything. */
  accessReason: string;
  from?: string;
  to?: string;
  actorId?: string;
  action?: string;
  targetType?: string;
  targetId?: string;
  participantId?: string;
  limit?: number;
}

/**
 * The one thing that reads the audit trail.
 *
 * Sixty-one call sites write to `audit_events`; until this, nothing read
 * one. `audit.view` had been granted to three roles since the catalogue
 * was written and was checked nowhere, so the platform's whole
 * accountability record was append-only and unreadable — the strongest
 * form of "recording is not performing" in the codebase, because the
 * recording was real and complete and no human being could ever see it.
 *
 * Reading it is itself recorded, in the same append-only store, before
 * the rows are returned (Doc 15 §21). An audit trail whose readers leave
 * no trace is the one record a misuser has no reason to avoid. The
 * reader's stated reason and their filters go in with it: the reason
 * makes the asking worth something, and the filters let a later reader
 * tell a targeted look-up from a sweep of everybody.
 *
 * The write happens first and outside the try — if the audit cannot be
 * written the read does not happen. That is the same rule the commands
 * follow (ADR-051, fail closed), and it matters more here than anywhere:
 * an unrecorded look at the audit trail is exactly the look somebody
 * would want.
 */
export async function listAuditEvents(
  deps: M15Deps,
  ctx: RequestContext,
  query: AuditQuery,
): Promise<AuditEventRow[]> {
  const decision = await deps.checkPermission(ctx, {
    action: 'audit.view',
    resource: { type: 'AuditEvent', id: 'query', state: 'Active', protectedExistence: false },
  });
  assertAllowed(decision, false);
  const reason = query.accessReason.trim();
  if (reason === '') {
    throw new PlatformError('VALIDATION_ERROR', 'A reason for reading the audit trail is required');
  }

  // Bounded on the server, not only in the screen. A caller who asks for
  // everything gets a page and is told so, rather than holding the whole
  // store open.
  const limit = Math.min(Math.max(query.limit ?? 100, 1), 500);
  const filters: Record<string, string | number> = { limit };
  const where: string[] = [];
  const params: unknown[] = [];
  const add = (sql: string, key: keyof AuditQuery, value: string | undefined) => {
    if (value === undefined || value === '') return;
    params.push(value);
    where.push(`${sql} $${params.length}`);
    filters[key] = value;
  };
  add('occurred_at >=', 'from', query.from);
  add('occurred_at <=', 'to', query.to);
  add('actor_id =', 'actorId', query.actorId);
  add('action =', 'action', query.action);
  add('target_type =', 'targetType', query.targetType);
  add('target_id =', 'targetId', query.targetId);
  add('participant_id =', 'participantId', query.participantId);

  await withTransaction(deps.pool, async (client) => {
    await recordAuditEvent(client, ctx, {
      action: 'audit.view',
      targetType: 'AuditEvent',
      targetId: 'query',
      occurredAt: deps.clock.now(),
      result: 'Succeeded',
      source: 'M15',
      accessReason: reason,
      queryFilters: filters,
    });
  });

  params.push(limit);
  const res = await deps.pool.query(
    `SELECT id, occurred_at, actor_type, actor_id, active_role, auth_strength, action,
            target_type, target_id, result, policy_decision, policy_decision_reason,
            policy_version, source, participant_id, access_reason
       FROM governance_audit.audit_events
      ${where.length === 0 ? '' : `WHERE ${where.join(' AND ')}`}
      ORDER BY occurred_at DESC
      LIMIT $${params.length}`,
    params,
  );
  return res.rows.map((r) => ({
    auditEventId: r.id as string,
    occurredAt: (r.occurred_at as Date).toISOString(),
    actorType: r.actor_type as string,
    actorId: r.actor_id as string,
    activeRole: (r.active_role as string | null) ?? null,
    authStrength: (r.auth_strength as string | null) ?? null,
    action: r.action as string,
    targetType: r.target_type as string,
    targetId: r.target_id as string,
    result: r.result as string,
    policyDecision: (r.policy_decision as string | null) ?? null,
    policyDecisionReason: (r.policy_decision_reason as string | null) ?? null,
    policyVersion: (r.policy_version as string | null) ?? null,
    source: r.source as string,
    participantId: (r.participant_id as string | null) ?? null,
    accessReason: (r.access_reason as string | null) ?? null,
  }));
}

/**
 * The actions that count as a decision somebody made about their own life
 * on this platform.
 *
 * An allow-list, not a deny-list, and that is the whole safety of this
 * query. Sixty-odd actions are audited and most of them are reads, sweeps
 * or staff work; "What you decided recently" must never turn into a log of
 * everything a participant did, still less of everything done to them. A
 * new action added anywhere in the platform is absent from this list until
 * somebody decides it is a decision and writes the words for it.
 *
 * Each entry is what the row can honestly be said to mean. The audit store
 * holds references and safe metadata only (Doc 14 §61) — no content, and
 * for a contribution review not even which way it went — so the phrases
 * stop where the record stops. "Decided about something offered for your
 * story" is less than the design's "Accepted Anne's account of the
 * crossing", and it is what the row supports.
 */
export const OWN_DECISION_ACTIONS: Readonly<Record<string, string>> = Object.freeze({
  'consent.record': 'Answered a consent question',
  'consent.withdraw': 'Withdrew a consent',
  'life-story.create': 'Started your life story',
  'life-story.edit': 'Wrote in your life story',
  'life-story.change-visibility': 'Changed who can see part of your story',
  'life-story.confirm-testimony': 'Confirmed part of your story as your own words',
  'life-story.withdraw': 'Took part of your story back',
  'life-story.review-contribution': 'Decided about something offered for your story',
  'object.upload': 'Added a file to your story',
  'object.delete-own': 'Removed a file',
  'relationship.approve': 'Approved someone to be in touch with you',
  'relationship.revoke': 'Ended someone’s access to you',
  'enrolment.enrol': 'Joined a study',
  'enrolment.withdraw': 'Left a study',
  'block.create': 'Blocked someone',
  'block.revoke': 'Unblocked someone',
  'community.join': 'Joined a community space',
  'community.leave': 'Left a community space',
  'message.confirm-send': 'Sent a message',
  'post.publish': 'Shared a story with the community',
  'participant.export': 'Asked for a copy of your information',
});

export interface OwnDecision {
  /** The audited action. The words for it live in `OWN_DECISION_ACTIONS`. */
  action: string;
  what: string;
  when: string;
}

/**
 * "What you decided recently" — the handoff's Home section.
 *
 * The platform recorded every one of these and showed none of them back to
 * the person who made them. Sixty-one call sites write to `audit_events`;
 * the only thing that read one was the staff audit view, behind
 * `audit.view`, which no participant holds and should not.
 *
 * **This is not that query and must not become it.** Three things keep it
 * apart:
 *
 * - The actor is `ctx.actor.id` and is not a parameter. There is no
 *   argument by which a caller can ask about somebody else, so the query
 *   cannot be pointed at another person's record even by a caller who
 *   holds every permission in the catalogue.
 * - The actions are an allow-list of decisions, so a read, a sweep or a
 *   staff action never appears here even when the actor performed it.
 *   `result = 'Succeeded'` keeps out attempts that were refused — a
 *   participant's own record of what they decided is not the place to
 *   re-present something the platform stopped.
 * - It is scoped to the participant whose Home this is, so a supporter who
 *   is also a participant does not see what they did in somebody else's
 *   archive on their own front page.
 *
 * Reading it is deliberately **not** itself audited, which is a departure
 * from `listAuditEvents` above and needs saying. That rule exists because
 * an audit trail whose readers leave no trace is the one record a misuser
 * has no reason to avoid — it is about people looking at other people's
 * records. Nobody can look at anybody else through this, and Home loads it
 * on every visit; recording each of those would fill the store with a
 * person reading their own history and make the trail harder to read, not
 * easier.
 */
export async function listMyRecentDecisions(
  deps: M15Deps,
  ctx: RequestContext,
  participantId: string,
  limit = 3,
): Promise<OwnDecision[]> {
  const decision = await deps.checkPermission(ctx, {
    action: 'participant.view-own',
    resource: {
      type: 'Participant',
      id: participantId,
      state: 'Active',
      protectedExistence: true,
      ownerParticipantId: participantId,
    },
  });
  assertAllowed(decision, false);
  const capped = Math.min(Math.max(limit, 1), 20);
  const res = await deps.pool.query(
    `SELECT action, occurred_at
       FROM governance_audit.audit_events
      WHERE actor_id = $1
        AND participant_id = $2
        AND result = 'Succeeded'
        AND action = ANY($3::text[])
      ORDER BY occurred_at DESC
      LIMIT $4`,
    [ctx.actor!.id, participantId, Object.keys(OWN_DECISION_ACTIONS), capped],
  );
  return res.rows.map((r) => ({
    action: r.action as string,
    what: OWN_DECISION_ACTIONS[r.action as string]!,
    when: (r.occurred_at as Date).toISOString(),
  }));
}
