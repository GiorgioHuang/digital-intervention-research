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
