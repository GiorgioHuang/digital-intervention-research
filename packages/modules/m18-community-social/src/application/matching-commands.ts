import { newId, PlatformError, type RequestContext } from '@platform/kernel';
import { appendToOutbox, recordAuditEvent, withTransaction } from '@platform/database';
import { assertAllowed } from '@platform/policy';
import type { M18Deps } from './commands.js';

const MATCHING_EVENTS = {
  MatchPreferenceActivated: 'MatchPreferenceActivated',
  MatchCandidateGenerated: 'MatchCandidateGenerated',
  MatchDecisionRecorded: 'MatchDecisionRecorded',
  MutualAcceptanceRecorded: 'MutualAcceptanceRecorded',
  ConnectionActivated: 'ConnectionActivated',
} as const;

/** ADR-125 pending: effective period is configuration, not architecture. */
export interface MatchingConfig {
  mutualAcceptanceTtlMs: number;
  candidateTtlMs: number;
  policyVersion: string;
}
export const DEFAULT_MATCHING_CONFIG: MatchingConfig = {
  mutualAcceptanceTtlMs: 7 * 24 * 3600_000,
  candidateTtlMs: 14 * 24 * 3600_000,
  policyVersion: 'matching-policy_v0.1',
};

/** Open Matching is inactive by default; explicit consented opt-in (ADR-026). */
export async function activateMatchPreference(
  deps: M18Deps,
  ctx: RequestContext,
  input: { participantId: string; declaredAttributes: Record<string, unknown>; confirmed: boolean },
): Promise<{ matchPreferenceId: string }> {
  const decision = await deps.checkPermission(ctx, {
    action: 'matching.activate',
    resource: {
      type: 'MatchPreference',
      id: 'new',
      state: 'Inactive',
      protectedExistence: true,
      ownerParticipantId: input.participantId,
    },
    confirmed: input.confirmed,
  });
  assertAllowed(decision, input.confirmed);
  const matchPreferenceId = newId('mp');
  const now = deps.clock.now();
  await withTransaction(deps.pool, async (client) => {
    await client.query(
      `INSERT INTO community_social.match_preferences (id, participant_id, preference_state, declared_attributes)
       VALUES ($1, $2, 'Active', $3)`,
      [matchPreferenceId, input.participantId, JSON.stringify(input.declaredAttributes)],
    );
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: MATCHING_EVENTS.MatchPreferenceActivated,
      sourceModule: 'M18',
      aggregateType: 'MatchPreference',
      aggregateId: matchPreferenceId,
      occurredAt: now,
    });
    await recordAuditEvent(client, ctx, {
      action: 'matching.activate',
      targetType: 'MatchPreference',
      targetId: matchPreferenceId,
      participantId: input.participantId,
      occurredAt: now,
      result: 'Succeeded',
      source: 'M18',
      policyVersion: decision.policyVersion,
    });
  });
  return { matchPreferenceId };
}

/**
 * Rule-based candidate generation (ADR-112 pending; algorithm is a stub but
 * the gates are real): both participants must have ACTIVE MatchPreferences
 * and no active Block between them — checked synchronously (fail closed).
 */
export async function generateMatchCandidate(
  deps: M18Deps,
  ctx: RequestContext,
  input: { participantAId: string; participantBId: string; explanation: string; config?: MatchingConfig },
): Promise<{ matchCandidateId: string }> {
  const decision = await deps.checkPermission(ctx, {
    action: 'matching.generate',
    resource: { type: 'MatchCandidate', id: 'new', state: 'Draft', protectedExistence: true },
  });
  assertAllowed(decision, false);
  const cfg = input.config ?? DEFAULT_MATCHING_CONFIG;

  const prefs = await deps.pool.query(
    `SELECT participant_id FROM community_social.match_preferences
      WHERE participant_id = ANY($1) AND preference_state = 'Active'`,
    [[input.participantAId, input.participantBId]],
  );
  if (prefs.rowCount !== 2) {
    throw new PlatformError('MATCHING_NOT_ACTIVE', 'Both participants must have opted into Open Matching');
  }
  const blocks = await deps.pool.query(
    `SELECT 1 FROM community_social.block_records
      WHERE block_state = 'Active'
        AND ((blocker_actor_id = $1 AND blocked_actor_id = $2) OR (blocker_actor_id = $2 AND blocked_actor_id = $1))`,
    [input.participantAId, input.participantBId],
  );
  if (blocks.rowCount !== 0) {
    throw new PlatformError('BLOCKED_INTERACTION', 'A block prevents candidate generation');
  }

  const matchCandidateId = newId('mcand');
  const now = deps.clock.now();
  await withTransaction(deps.pool, async (client) => {
    await client.query(
      `INSERT INTO community_social.match_candidates
         (id, participant_a_id, participant_b_id, match_explanation, expires_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [matchCandidateId, input.participantAId, input.participantBId, input.explanation, new Date(now.getTime() + cfg.candidateTtlMs)],
    );
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: MATCHING_EVENTS.MatchCandidateGenerated,
      sourceModule: 'M18',
      aggregateType: 'MatchCandidate',
      aggregateId: matchCandidateId,
      occurredAt: now,
    });
  });
  return { matchCandidateId };
}

/**
 * Record ONE actor's independent MatchDecision against the exact candidate
 * version (ADR-027). When both current decisions are compatible
 * ('Interested'), the server creates the MutualAcceptance in the same
 * transaction with exactly two source decisions (ADR-028); the other
 * actor's decision is never disclosed by this command.
 */
export async function recordMatchDecision(
  deps: M18Deps,
  ctx: RequestContext,
  input: {
    matchCandidateId: string;
    participantId: string;
    expectedCandidateVersion: number;
    decision: 'Interested' | 'Not Now' | 'Dismissed' | 'Blocked' | 'Reported';
    confirmed: boolean;
    config?: MatchingConfig;
  },
): Promise<{ matchDecisionId: string; mutualAcceptanceId?: string }> {
  const cand = await deps.pool.query(
    `SELECT participant_a_id, participant_b_id, candidate_version, candidate_state, expires_at
       FROM community_social.match_candidates WHERE id = $1`,
    [input.matchCandidateId],
  );
  const c = cand.rows[0];
  if (c === undefined) throw new PlatformError('RESOURCE_NOT_FOUND', 'Match candidate not found');
  // Exact ownership: the decider must be one of the candidate's two actors.
  if (input.participantId !== c.participant_a_id && input.participantId !== c.participant_b_id) {
    throw new PlatformError('MATCH_DECISION_NOT_OWNED', 'You are not a party to this match candidate');
  }
  const decision = await deps.checkPermission(ctx, {
    action: 'match.decide',
    resource: {
      type: 'MatchCandidate',
      id: input.matchCandidateId,
      state: c.candidate_state,
      protectedExistence: true,
      ownerParticipantId: input.participantId,
    },
    confirmed: input.confirmed,
  });
  assertAllowed(decision, input.confirmed);

  const now = deps.clock.now();
  if (c.expires_at <= now) throw new PlatformError('MATCH_CANDIDATE_EXPIRED', 'Candidate has expired');
  if (input.expectedCandidateVersion !== c.candidate_version) {
    throw new PlatformError('MATCH_DECISION_CONFLICT', 'Candidate version has changed; review again');
  }

  const cfg = input.config ?? DEFAULT_MATCHING_CONFIG;
  const matchDecisionId = newId('mdec');
  let mutualAcceptanceId: string | undefined;
  await withTransaction(deps.pool, async (client) => {
    await client.query(
      `INSERT INTO community_social.match_decisions
         (id, match_candidate_id, candidate_version, decided_by_participant_id, decision)
       VALUES ($1, $2, $3, $4, $5)`,
      [matchDecisionId, input.matchCandidateId, input.expectedCandidateVersion, input.participantId, input.decision],
    );
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: MATCHING_EVENTS.MatchDecisionRecorded,
      sourceModule: 'M18',
      aggregateType: 'MatchDecision',
      aggregateId: matchDecisionId,
      occurredAt: now,
    });

    // Server-side evaluation: two compatible current 'Interested' decisions
    // (locked to avoid a race) create the MutualAcceptance atomically.
    if (input.decision === 'Interested') {
      const both = await client.query(
        `SELECT id, decided_by_participant_id FROM community_social.match_decisions
          WHERE match_candidate_id = $1 AND decision = 'Interested' FOR UPDATE`,
        [input.matchCandidateId],
      );
      if (both.rowCount === 2) {
        mutualAcceptanceId = newId('ma');
        await client.query(
          `INSERT INTO community_social.mutual_acceptances
             (id, match_candidate_id, participant_a_id, participant_b_id, policy_version, effective_until)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [mutualAcceptanceId, input.matchCandidateId, c.participant_a_id, c.participant_b_id, cfg.policyVersion, new Date(now.getTime() + cfg.mutualAcceptanceTtlMs)],
        );
        for (const d of both.rows) {
          await client.query(
            `INSERT INTO community_social.mutual_acceptance_sources (mutual_acceptance_id, match_decision_id)
             VALUES ($1, $2)`,
            [mutualAcceptanceId, d.id],
          );
        }
        await appendToOutbox(client, ctx, {
          eventCategory: 'Domain',
          eventType: MATCHING_EVENTS.MutualAcceptanceRecorded,
          sourceModule: 'M18',
          aggregateType: 'MutualAcceptance',
          aggregateId: mutualAcceptanceId,
          occurredAt: now,
        });
      }
    }
  });
  return mutualAcceptanceId === undefined ? { matchDecisionId } : { matchDecisionId, mutualAcceptanceId };
}

/**
 * Activate a Connection from a valid, current, UNUSED MutualAcceptance.
 * Consumption and activation are one transaction; single use is also a DB
 * constraint (ADR-030). There is no generic create-connection path.
 */
export async function activateConnection(
  deps: M18Deps,
  ctx: RequestContext,
  input: { mutualAcceptanceId: string; participantId: string; confirmed: boolean },
): Promise<{ connectionId: string }> {
  const ma = await deps.pool.query(
    `SELECT participant_a_id, participant_b_id, acceptance_state, effective_until
       FROM community_social.mutual_acceptances WHERE id = $1`,
    [input.mutualAcceptanceId],
  );
  const row = ma.rows[0];
  if (row === undefined) throw new PlatformError('MUTUAL_ACCEPTANCE_NOT_FOUND', 'Mutual acceptance not found');
  if (input.participantId !== row.participant_a_id && input.participantId !== row.participant_b_id) {
    throw new PlatformError('AUTHORISATION_DENIED', 'Not a party to this mutual acceptance');
  }
  const decision = await deps.checkPermission(ctx, {
    action: 'connection.activate',
    resource: {
      type: 'MutualAcceptance',
      id: input.mutualAcceptanceId,
      state: row.acceptance_state,
      protectedExistence: true,
      ownerParticipantId: input.participantId,
    },
    confirmed: input.confirmed,
  });
  assertAllowed(decision, input.confirmed);

  const now = deps.clock.now();
  if (row.acceptance_state === 'Consumed') {
    throw new PlatformError('MUTUAL_ACCEPTANCE_ALREADY_CONSUMED', 'This mutual acceptance was already used');
  }
  if (row.acceptance_state !== 'Active' && row.acceptance_state !== 'Recorded') {
    throw new PlatformError('MUTUAL_ACCEPTANCE_INVALIDATED', 'Mutual acceptance is not usable');
  }
  if (row.effective_until <= now) {
    throw new PlatformError('MUTUAL_ACCEPTANCE_EXPIRED', 'Mutual acceptance has expired');
  }

  const connectionId = newId('conn');
  await withTransaction(deps.pool, async (client) => {
    // Consume with a state precondition so concurrent activation loses.
    const consumed = await client.query(
      `UPDATE community_social.mutual_acceptances
          SET acceptance_state = 'Consumed', connection_id = $2
        WHERE id = $1 AND acceptance_state IN ('Active', 'Recorded') AND effective_until > $3`,
      [input.mutualAcceptanceId, connectionId, now],
    );
    if (consumed.rowCount !== 1) {
      throw new PlatformError('MUTUAL_ACCEPTANCE_ALREADY_CONSUMED', 'Mutual acceptance is no longer usable');
    }
    await client.query(
      `INSERT INTO community_social.connections (id, mutual_acceptance_id, participant_a_id, participant_b_id)
       VALUES ($1, $2, $3, $4)`,
      [connectionId, input.mutualAcceptanceId, row.participant_a_id, row.participant_b_id],
    );
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: MATCHING_EVENTS.ConnectionActivated,
      sourceModule: 'M18',
      aggregateType: 'Connection',
      aggregateId: connectionId,
      occurredAt: now,
    });
    await recordAuditEvent(client, ctx, {
      action: 'connection.activate',
      targetType: 'Connection',
      targetId: connectionId,
      participantId: input.participantId,
      occurredAt: now,
      result: 'Succeeded',
      source: 'M18',
      policyVersion: decision.policyVersion,
    });
  });
  return { connectionId };
}

/** ConnectionRequest is deferred and feature-disabled for the first Pilot (ADR-029). */
export function createConnectionRequest(): never {
  throw new PlatformError('CONNECTION_REQUEST_FEATURE_DISABLED', 'Direct connection requests are disabled for the first Pilot');
}
