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
