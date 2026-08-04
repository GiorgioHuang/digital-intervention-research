import type { RequestContext } from '@platform/kernel';
import { assertAllowed } from '@platform/policy';
import type { M17Deps } from './commands.js';

export interface MyContribution {
  contributionId: string;
  archiveId: string;
  itemId: string | null;
  contentText: string;
  contributionState: string;
  createdAt: string;
}

/**
 * A supporter's own proposed contributions with their honest states —
 * strictly scoped to the requesting actor; nobody lists someone else's
 * contributions here.
 */
export async function listMyContributions(deps: M17Deps, ctx: RequestContext): Promise<MyContribution[]> {
  const decision = await deps.checkPermission(ctx, {
    action: 'contribution.view-own',
    resource: { type: 'LifeStoryContribution', id: 'own', state: 'Any', protectedExistence: false },
  });
  assertAllowed(decision, false);
  const res = await deps.pool.query(
    `SELECT id, archive_id, item_id, content_text, contribution_state, created_at
       FROM life_story.contributions
      WHERE contributor_actor_id = $1
      ORDER BY created_at DESC`,
    [ctx.actor!.id],
  );
  return res.rows.map((r) => ({
    contributionId: r.id as string,
    archiveId: r.archive_id as string,
    itemId: (r.item_id as string | null) ?? null,
    contentText: r.content_text as string,
    contributionState: r.contribution_state as string,
    createdAt: (r.created_at as Date).toISOString(),
  }));
}

export interface MyLifeStoryItem {
  itemId: string;
  title: string;
  itemState: string;
  visibility: string;
  /** The version currently shown as the item, if the item has any content. */
  currentVersionId: string | null;
  versionNumber: number | null;
  contentText: string | null;
  sourceType: string | null;
  testimonyState: string | null;
  /**
   * True when some earlier version of this item was confirmed as the
   * participant's own testimony but the current one has not been. Editing
   * deliberately does not carry confirmation forward (ADR-024), so without
   * this the item would look plainly unconfirmed and the participant would
   * have no way to tell that it once was.
   */
  supersedesConfirmedVersion: boolean;
  versionCount: number;
  updatedAt: string;
}

export interface MyLifeStory {
  /** Null when no archive has been created yet — an empty story, not a hidden one. */
  archiveId: string | null;
  items: MyLifeStoryItem[];
}

/**
 * A participant reading their own life story.
 *
 * There was no read path at all. A participant could create items, revise
 * them, confirm one as their own testimony, change who can see it and
 * withdraw it — and could accept a supporter's contribution into it — but
 * nothing let them look at what was there. Accepting a contribution into
 * a story you cannot read is not a decision anyone can make properly.
 *
 * Withdrawn items stay in the result. Withdrawal makes an item private
 * and revokes its grants; it does not mean the participant should stop
 * being able to see their own history.
 */
export async function getMyLifeStory(
  deps: M17Deps,
  ctx: RequestContext,
  participantId: string,
): Promise<MyLifeStory> {
  const decision = await deps.checkPermission(ctx, {
    action: 'life-story.view-own',
    resource: {
      type: 'LifeStoryArchive',
      id: 'own',
      state: 'Any',
      protectedExistence: true,
      ownerParticipantId: participantId,
    },
  });
  assertAllowed(decision, false);
  const archive = await deps.pool.query(`SELECT id FROM life_story.archives WHERE participant_id = $1`, [
    participantId,
  ]);
  if (archive.rowCount === 0) return { archiveId: null, items: [] };
  const archiveId = archive.rows[0].id as string;

  const res = await deps.pool.query(
    `SELECT i.id,
            i.title,
            i.item_state,
            i.visibility,
            i.current_version_id,
            i.updated_at,
            v.version_number,
            v.content_text,
            v.source_type,
            v.testimony_state,
            (SELECT count(*)::int FROM life_story.item_versions av WHERE av.item_id = i.id) AS version_count,
            (SELECT count(*)::int FROM life_story.item_versions cv
              WHERE cv.item_id = i.id AND cv.testimony_state = 'ParticipantTestimony') AS confirmed_count
       FROM life_story.items i
       LEFT JOIN life_story.item_versions v ON v.id = i.current_version_id
      WHERE i.archive_id = $1
        AND i.item_state <> 'Deleted'
      ORDER BY i.updated_at DESC`,
    [archiveId],
  );
  return {
    archiveId,
    items: res.rows.map((r) => ({
      itemId: r.id as string,
      title: r.title as string,
      itemState: r.item_state as string,
      visibility: r.visibility as string,
      currentVersionId: (r.current_version_id as string | null) ?? null,
      versionNumber: (r.version_number as number | null) ?? null,
      contentText: (r.content_text as string | null) ?? null,
      sourceType: (r.source_type as string | null) ?? null,
      testimonyState: (r.testimony_state as string | null) ?? null,
      supersedesConfirmedVersion:
        r.testimony_state !== 'ParticipantTestimony' && (r.confirmed_count as number) > 0,
      versionCount: r.version_count as number,
      updatedAt: (r.updated_at as Date).toISOString(),
    })),
  };
}

export interface ContributionAwaitingReview {
  contributionId: string;
  archiveId: string;
  itemId: string | null;
  contentText: string;
  createdAt: string;
}

/**
 * Contributions a supporter has proposed into this participant's own life
 * story and that are waiting on the participant's decision.
 *
 * `life-story.review-contribution` has always been owner-only, so the
 * participant is the only person who may accept or reject one — but
 * nothing listed them, which meant a supporter could write something into
 * a participant's life story and the participant had no way to discover
 * it was there. Being the only one permitted to decide is not much use
 * without a way to find what is waiting.
 *
 * The contributor is deliberately absent from the result. Who proposed it
 * belongs on the contribution when the participant opens it, not in a
 * list that would let anyone enumerate who has been writing about them;
 * the text itself is what the decision is about.
 */
export async function listContributionsAwaitingReview(
  deps: M17Deps,
  ctx: RequestContext,
  participantId: string,
): Promise<ContributionAwaitingReview[]> {
  const decision = await deps.checkPermission(ctx, {
    action: 'life-story.review-contribution',
    resource: {
      type: 'LifeStoryContribution',
      id: 'awaiting',
      state: 'Proposed',
      protectedExistence: true,
      ownerParticipantId: participantId,
    },
  });
  assertAllowed(decision, false);
  const res = await deps.pool.query(
    `SELECT c.id, c.archive_id, c.item_id, c.content_text, c.created_at
       FROM life_story.contributions c
       JOIN life_story.archives a ON a.id = c.archive_id
      WHERE a.participant_id = $1
        AND c.contribution_state IN ('Proposed', 'In Review')
      ORDER BY c.created_at ASC`,
    [participantId],
  );
  return res.rows.map((r) => ({
    contributionId: r.id as string,
    archiveId: r.archive_id as string,
    itemId: (r.item_id as string | null) ?? null,
    contentText: r.content_text as string,
    createdAt: (r.created_at as Date).toISOString(),
  }));
}
