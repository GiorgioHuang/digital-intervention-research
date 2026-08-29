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

/**
 * Where a supporter would put a contribution for this participant.
 *
 * The supporter workspace asked people to type an archive identifier they
 * could only have been told out of band, which made the whole
 * contribution path unusable by anyone who had not been handed an
 * internal id. This answers the same question the contribute command
 * already gates on, under exactly that gate: if you may contribute, you
 * may know where to. It creates nothing — only the participant creates
 * their own archive.
 *
 * Null when the participant has not started a life story. That is a true
 * answer rather than a refusal, and it does not reveal anything the
 * permission has not already granted: whoever passes `life-story.contribute`
 * holds an approved relationship and the participant's supporter-contribution
 * consent.
 */
export async function findArchiveForContribution(
  deps: M17Deps,
  ctx: RequestContext,
  participantId: string,
): Promise<string | null> {
  const decision = await deps.checkPermission(ctx, {
    action: 'life-story.contribute',
    resource: {
      type: 'LifeStoryArchive',
      id: 'for-contribution',
      state: 'Active',
      protectedExistence: true,
      ownerParticipantId: participantId,
    },
  });
  assertAllowed(decision, false);
  const res = await deps.pool.query(`SELECT id FROM life_story.archives WHERE participant_id = $1`, [participantId]);
  return (res.rows[0]?.id as string | undefined) ?? null;
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
  /** The account that proposed it. A name is the caller's to look up. */
  contributorActorId: string;
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
 * **The contributor is now returned, and that reverses a ruling this file
 * used to state.** It read: "Who proposed it belongs on the contribution
 * when the participant opens it, not in a list that would let anyone
 * enumerate who has been writing about them." The owner has ruled
 * otherwise (2026-08-29) and the design shows the name on the list —
 * "Anne has offered something for your story".
 *
 * Recorded rather than quietly changed, because the old reasoning was not
 * empty and whoever reads this next should see what was traded. Two things
 * were weighed against it. The endpoint is owner-only — the permission is
 * `life-story.review-contribution`, which nobody but the archive's owner
 * holds — so "anyone" was never the caller; it was whoever else can see
 * the screen, which on a shared tablet is a real audience. Against that:
 * somebody is deciding whether another person's words enter their own life
 * story, and doing it without being told who wrote them is the worse
 * position to be in. The decision needs the name more than the list needs
 * the discretion.
 *
 * The actor id is what comes back from here. Turning it into a name is the
 * caller's job, through M01's `AccountNameQueryPort` — this module does not
 * read `identity_org` tables.
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
    `SELECT c.id, c.archive_id, c.item_id, c.content_text, c.contributor_actor_id, c.created_at
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
    contributorActorId: r.contributor_actor_id as string,
    createdAt: (r.created_at as Date).toISOString(),
  }));
}
