import { newId, PlatformError, type Clock, type RequestContext } from '@platform/kernel';
import { appendToOutbox, recordAuditEvent, withTransaction, type Pool, type PoolClient } from '@platform/database';
import { assertAllowed, type PolicyDecisionResult } from '@platform/policy';
import { M17_EVENTS, type LifeStorySourceType, type LifeStoryVisibility } from '../contracts/index.js';

export type PermissionCheck = (
  ctx: RequestContext,
  request: {
    action: string;
    resource: { type: string; id: string; state: string; protectedExistence: boolean; ownerParticipantId?: string };
    confirmed?: boolean;
  },
) => Promise<PolicyDecisionResult>;

export interface M17Deps {
  pool: Pool;
  clock: Clock;
  checkPermission: PermissionCheck;
}

interface ItemRow {
  id: string;
  archiveId: string;
  participantId: string;
  state: string;
  visibility: string;
  currentVersionId: string | null;
}

async function loadItem(pool: Pool, itemId: string): Promise<ItemRow> {
  const res = await pool.query(
    `SELECT i.id, i.archive_id, a.participant_id, i.item_state, i.visibility, i.current_version_id
       FROM life_story.items i JOIN life_story.archives a ON a.id = i.archive_id
      WHERE i.id = $1`,
    [itemId],
  );
  const row = res.rows[0];
  // Life Story items are protected-existence resources (ADR-050).
  if (row === undefined) throw new PlatformError('RESOURCE_NOT_FOUND', 'Life story item not found');
  return {
    id: row.id,
    archiveId: row.archive_id,
    participantId: row.participant_id,
    state: row.item_state,
    visibility: row.visibility,
    currentVersionId: row.current_version_id,
  };
}

async function insertVersion(
  client: PoolClient,
  args: {
    itemId: string;
    contentText: string;
    sourceType: LifeStorySourceType;
    authoredByActorId: string;
  },
): Promise<string> {
  const next = await client.query(
    `SELECT coalesce(max(version_number), 0) + 1 AS n FROM life_story.item_versions WHERE item_id = $1`,
    [args.itemId],
  );
  const versionId = newId('lsv');
  await client.query(
    `INSERT INTO life_story.item_versions (id, item_id, version_number, content_text, source_type, authored_by_actor_id)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [versionId, args.itemId, next.rows[0].n, args.contentText, args.sourceType, args.authoredByActorId],
  );
  await client.query(`UPDATE life_story.items SET current_version_id = $2, updated_at = now() WHERE id = $1`, [
    args.itemId,
    versionId,
  ]);
  return versionId;
}

export async function createArchive(
  deps: M17Deps,
  ctx: RequestContext,
  input: { participantId: string },
): Promise<{ archiveId: string }> {
  const decision = await deps.checkPermission(ctx, {
    action: 'life-story.create',
    resource: {
      type: 'LifeStoryArchive',
      id: 'new',
      state: 'Draft',
      protectedExistence: false,
      ownerParticipantId: input.participantId,
    },
  });
  assertAllowed(decision, false);
  const archiveId = newId('lsa');
  const now = deps.clock.now();
  await withTransaction(deps.pool, async (client) => {
    await client.query(`INSERT INTO life_story.archives (id, participant_id) VALUES ($1, $2)`, [
      archiveId,
      input.participantId,
    ]);
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: M17_EVENTS.LifeStoryArchiveCreated,
      sourceModule: 'M17',
      aggregateType: 'LifeStoryArchive',
      aggregateId: archiveId,
      occurredAt: now,
    });
    await recordAuditEvent(client, ctx, {
      action: 'life-story.create',
      targetType: 'LifeStoryArchive',
      targetId: archiveId,
      participantId: input.participantId,
      occurredAt: now,
      result: 'Succeeded',
      source: 'M17',
      policyVersion: decision.policyVersion,
    });
  });
  return { archiveId };
}

/**
 * Create an item with its first version. `sourceType` records true
 * authorship: an AI-produced draft is stored as AIDraft and is NOT
 * Participant Testimony (ADR-024); nothing here can set testimony state.
 */
export async function createItem(
  deps: M17Deps,
  ctx: RequestContext,
  input: { archiveId: string; title: string; contentText: string; sourceType: LifeStorySourceType },
): Promise<{ itemId: string; versionId: string }> {
  const archive = await deps.pool.query(`SELECT participant_id FROM life_story.archives WHERE id = $1`, [
    input.archiveId,
  ]);
  if (archive.rows[0] === undefined) throw new PlatformError('RESOURCE_NOT_FOUND', 'Archive not found');
  const participantId: string = archive.rows[0].participant_id;

  const decision = await deps.checkPermission(ctx, {
    action: 'life-story.create',
    resource: {
      type: 'LifeStoryItem',
      id: 'new',
      state: 'Draft',
      protectedExistence: true,
      ownerParticipantId: participantId,
    },
  });
  assertAllowed(decision, false);

  const itemId = newId('lsi');
  const now = deps.clock.now();
  let versionId = '';
  await withTransaction(deps.pool, async (client) => {
    await client.query(`INSERT INTO life_story.items (id, archive_id, title) VALUES ($1, $2, $3)`, [
      itemId,
      input.archiveId,
      input.title,
    ]);
    versionId = await insertVersion(client, {
      itemId,
      contentText: input.contentText,
      sourceType: input.sourceType,
      authoredByActorId: ctx.actor!.id,
    });
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: M17_EVENTS.LifeStoryItemDrafted,
      sourceModule: 'M17',
      aggregateType: 'LifeStoryItem',
      aggregateId: itemId,
      occurredAt: now,
      // Reference-only payload: never the story text (Doc 15 §61).
      payload: { sourceType: input.sourceType },
    });
    await recordAuditEvent(client, ctx, {
      action: 'life-story.create',
      targetType: 'LifeStoryItem',
      targetId: itemId,
      participantId,
      occurredAt: now,
      result: 'Succeeded',
      source: 'M17',
      policyVersion: decision.policyVersion,
    });
  });
  return { itemId, versionId };
}

/** Add a revision. Editing never mutates a prior version (new version row). */
export async function reviseItem(
  deps: M17Deps,
  ctx: RequestContext,
  input: { itemId: string; contentText: string; sourceType: LifeStorySourceType },
): Promise<{ versionId: string }> {
  const item = await loadItem(deps.pool, input.itemId);
  if (['Withdrawn', 'Deleted', 'Archived'].includes(item.state)) {
    throw new PlatformError('RESOURCE_STATE_BLOCKED', 'Item state does not allow revision');
  }
  const decision = await deps.checkPermission(ctx, {
    action: 'life-story.edit',
    resource: {
      type: 'LifeStoryItem',
      id: item.id,
      state: item.state,
      protectedExistence: true,
      ownerParticipantId: item.participantId,
    },
  });
  assertAllowed(decision, false);

  const now = deps.clock.now();
  let versionId = '';
  await withTransaction(deps.pool, async (client) => {
    versionId = await insertVersion(client, {
      itemId: item.id,
      contentText: input.contentText,
      sourceType: input.sourceType,
      authoredByActorId: ctx.actor!.id,
    });
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: M17_EVENTS.LifeStoryItemUpdated,
      sourceModule: 'M17',
      aggregateType: 'LifeStoryItem',
      aggregateId: item.id,
      occurredAt: now,
      payload: { sourceType: input.sourceType },
    });
  });
  return { versionId };
}

/**
 * Confirm the EXACT version as Participant Testimony. Only the owning
 * Participant can do this (ownerOnly + confirmation); the version binding
 * prevents confirming content the Participant has not seen (ATR-007).
 */
export async function confirmTestimony(
  deps: M17Deps,
  ctx: RequestContext,
  input: { itemId: string; versionId: string; confirmed: boolean },
): Promise<void> {
  const item = await loadItem(deps.pool, input.itemId);
  const decision = await deps.checkPermission(ctx, {
    action: 'life-story.confirm-testimony',
    resource: {
      type: 'LifeStoryItem',
      id: item.id,
      state: item.state,
      protectedExistence: true,
      ownerParticipantId: item.participantId,
    },
    confirmed: input.confirmed,
  });
  assertAllowed(decision, input.confirmed);

  const now = deps.clock.now();
  await withTransaction(deps.pool, async (client) => {
    const res = await client.query(
      `UPDATE life_story.item_versions
          SET testimony_state = 'ParticipantTestimony', confirmed_by_participant_id = $3, confirmed_at = $4
        WHERE id = $1 AND item_id = $2 AND testimony_state = 'NotTestimony'`,
      [input.versionId, item.id, item.participantId, now],
    );
    if (res.rowCount !== 1) {
      throw new PlatformError('VERSION_CONFLICT', 'Version not found for this item or already confirmed');
    }
    await client.query(
      `UPDATE life_story.items SET item_state = 'Active', record_version = record_version + 1, updated_at = $2
        WHERE id = $1 AND item_state = 'Draft'`,
      [item.id, now],
    );
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: M17_EVENTS.ParticipantTestimonyConfirmed,
      sourceModule: 'M17',
      aggregateType: 'LifeStoryItem',
      aggregateId: item.id,
      occurredAt: now,
      payload: { versionId: input.versionId },
    });
    await recordAuditEvent(client, ctx, {
      action: 'life-story.confirm-testimony',
      targetType: 'LifeStoryItem',
      targetId: item.id,
      participantId: item.participantId,
      occurredAt: now,
      result: 'Succeeded',
      source: 'M17',
      policyVersion: decision.policyVersion,
    });
  });
}

/**
 * Change visibility (separate dimension from lifecycle state). Internet
 * Public is feature-disabled for the first Pilot — refused here AND by the
 * database CHECK constraint (defence in depth, ADR-020).
 */
export async function changeVisibility(
  deps: M17Deps,
  ctx: RequestContext,
  input: { itemId: string; visibility: LifeStoryVisibility | 'Internet Public'; confirmed: boolean },
): Promise<void> {
  if (input.visibility === 'Internet Public') {
    throw new PlatformError('UNSUPPORTED_CAPABILITY', 'Internet Public publication is disabled for the first Pilot');
  }
  const item = await loadItem(deps.pool, input.itemId);
  if (['Withdrawn', 'Deleted'].includes(item.state)) {
    throw new PlatformError('RESOURCE_STATE_BLOCKED', 'Withdrawn items cannot change visibility');
  }
  const decision = await deps.checkPermission(ctx, {
    action: 'life-story.change-visibility',
    resource: {
      type: 'LifeStoryItem',
      id: item.id,
      state: item.state,
      protectedExistence: true,
      ownerParticipantId: item.participantId,
    },
    confirmed: input.confirmed,
  });
  assertAllowed(decision, input.confirmed);

  const now = deps.clock.now();
  await withTransaction(deps.pool, async (client) => {
    await client.query(
      `UPDATE life_story.items SET visibility = $2, record_version = record_version + 1, updated_at = $3 WHERE id = $1`,
      [item.id, input.visibility, now],
    );
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: M17_EVENTS.LifeStoryItemVisibilityChanged,
      sourceModule: 'M17',
      aggregateType: 'LifeStoryItem',
      aggregateId: item.id,
      occurredAt: now,
      payload: { visibility: input.visibility },
    });
    await recordAuditEvent(client, ctx, {
      action: 'life-story.change-visibility',
      targetType: 'LifeStoryItem',
      targetId: item.id,
      participantId: item.participantId,
      occurredAt: now,
      result: 'Succeeded',
      source: 'M17',
      policyVersion: decision.policyVersion,
    });
  });
}

/** Supporter proposes a contribution (requires Relationship + consent scope). */
export async function proposeContribution(
  deps: M17Deps,
  ctx: RequestContext,
  input: { archiveId: string; itemId?: string; contentText: string },
): Promise<{ contributionId: string }> {
  const archive = await deps.pool.query(`SELECT participant_id FROM life_story.archives WHERE id = $1`, [
    input.archiveId,
  ]);
  if (archive.rows[0] === undefined) throw new PlatformError('RESOURCE_NOT_FOUND', 'Archive not found');
  const participantId: string = archive.rows[0].participant_id;

  const decision = await deps.checkPermission(ctx, {
    action: 'life-story.contribute',
    resource: {
      type: 'LifeStoryContribution',
      id: 'new',
      state: 'Draft',
      protectedExistence: true,
      ownerParticipantId: participantId,
    },
  });
  assertAllowed(decision, false);

  const contributionId = newId('lsc');
  const now = deps.clock.now();
  await withTransaction(deps.pool, async (client) => {
    await client.query(
      `INSERT INTO life_story.contributions (id, archive_id, item_id, contributor_actor_id, content_text)
       VALUES ($1, $2, $3, $4, $5)`,
      [contributionId, input.archiveId, input.itemId ?? null, ctx.actor!.id, input.contentText],
    );
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: M17_EVENTS.LifeStoryContributionCreated,
      sourceModule: 'M17',
      aggregateType: 'LifeStoryContribution',
      aggregateId: contributionId,
      occurredAt: now,
    });
  });
  return { contributionId };
}

/**
 * Participant reviews a contribution. Acceptance creates a new item version
 * with source SupporterContribution — it does NOT become Participant
 * Testimony and never transfers ownership (Doc 8 §2.4 invariants).
 */
export async function reviewContribution(
  deps: M17Deps,
  ctx: RequestContext,
  input: { contributionId: string; itemId: string; decision: 'Accepted' | 'Rejected' },
): Promise<{ versionId?: string }> {
  const item = await loadItem(deps.pool, input.itemId);
  const decision = await deps.checkPermission(ctx, {
    action: 'life-story.review-contribution',
    resource: {
      type: 'LifeStoryContribution',
      id: input.contributionId,
      state: 'Proposed',
      protectedExistence: true,
      ownerParticipantId: item.participantId,
    },
  });
  assertAllowed(decision, false);

  const now = deps.clock.now();
  let versionId: string | undefined;
  await withTransaction(deps.pool, async (client) => {
    const res = await client.query(
      `UPDATE life_story.contributions
          SET contribution_state = $2, record_version = record_version + 1, updated_at = $3
        WHERE id = $1 AND contribution_state = 'Proposed'
        RETURNING contributor_actor_id, content_text`,
      [input.contributionId, input.decision, now],
    );
    const row = res.rows[0];
    if (row === undefined) throw new PlatformError('INVALID_STATE_TRANSITION', 'Contribution is not in Proposed');
    if (input.decision === 'Accepted') {
      versionId = await insertVersion(client, {
        itemId: item.id,
        contentText: row.content_text,
        sourceType: 'SupporterContribution',
        authoredByActorId: row.contributor_actor_id,
      });
    }
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType:
        input.decision === 'Accepted'
          ? M17_EVENTS.LifeStoryContributionAccepted
          : M17_EVENTS.LifeStoryContributionRejected,
      sourceModule: 'M17',
      aggregateType: 'LifeStoryContribution',
      aggregateId: input.contributionId,
      occurredAt: now,
    });
  });
  return versionId === undefined ? {} : { versionId };
}

/** Withdraw an item: future access stops; audit and history preserved. */
export async function withdrawItem(
  deps: M17Deps,
  ctx: RequestContext,
  input: { itemId: string; confirmed: boolean },
): Promise<void> {
  const item = await loadItem(deps.pool, input.itemId);
  const decision = await deps.checkPermission(ctx, {
    action: 'life-story.withdraw',
    resource: {
      type: 'LifeStoryItem',
      id: item.id,
      state: item.state,
      protectedExistence: true,
      ownerParticipantId: item.participantId,
    },
    confirmed: input.confirmed,
  });
  assertAllowed(decision, input.confirmed);

  const now = deps.clock.now();
  await withTransaction(deps.pool, async (client) => {
    const res = await client.query(
      `UPDATE life_story.items
          SET item_state = 'Withdrawn', visibility = 'Private', withdrawn_at = $2,
              record_version = record_version + 1, updated_at = $2
        WHERE id = $1 AND item_state NOT IN ('Withdrawn', 'Deleted')`,
      [item.id, now],
    );
    if (res.rowCount !== 1) throw new PlatformError('INVALID_STATE_TRANSITION', 'Item is already withdrawn');
    // Revoke all active Selected People grants in the same transaction.
    await client.query(`UPDATE life_story.access_grants SET revoked_at = $2 WHERE item_id = $1 AND revoked_at IS NULL`, [
      item.id,
      now,
    ]);
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: M17_EVENTS.LifeStoryItemWithdrawn,
      sourceModule: 'M17',
      aggregateType: 'LifeStoryItem',
      aggregateId: item.id,
      occurredAt: now,
    });
    await recordAuditEvent(client, ctx, {
      action: 'life-story.withdraw',
      targetType: 'LifeStoryItem',
      targetId: item.id,
      participantId: item.participantId,
      occurredAt: now,
      result: 'Succeeded',
      source: 'M17',
      policyVersion: decision.policyVersion,
    });
  });
}
