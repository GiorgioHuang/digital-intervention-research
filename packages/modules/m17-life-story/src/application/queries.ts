import type { RequestContext } from '@platform/kernel';
import { assertAllowed } from '@platform/policy';
import type { M17Deps } from './commands.js';
import { sharedWithOthers } from './standing.js';
import { reachOf, standingOf, type StandingDeps } from './standing-query.js';

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


/**
 * One memory as somebody else sees it.
 *
 * Narrower than the owner's own view, and the omissions are the point. A
 * reader is not shown which scope the memory carries — that a daughter
 * can read it does not entitle her to know whether her mother also shared
 * it with the community — nor how many times it was rewritten, which is
 * the author's own working and nobody else's.
 *
 * What is kept is provenance. Whether a drafting tool wrote the words,
 * and whether the participant has confirmed them as their own, travel
 * with the memory: a reader who cannot tell a model's draft from their
 * mother's words has been told something false about their mother
 * (ADR-024).
 */
export interface SharedLifeStoryItem {
  itemId: string;
  title: string;
  contentText: string | null;
  sourceType: string | null;
  testimonyState: string | null;
  updatedAt: string;
}

export interface SharedLifeStory {
  ownerParticipantId: string;
  items: SharedLifeStoryItem[];
}

/**
 * Somebody else's life story, as far as they have shared it.
 *
 * The read path that did not exist. Until this, `getMyLifeStory` was the
 * only query on a life story and `life-story.view-own` is `ownerOnly`, so
 * every visibility a participant chose was recorded, audited and read by
 * nothing (B-30) — a control that did nothing, on the feature the whole
 * project is for.
 *
 * The permission grants the attempt; it never grants the content. Which
 * memories come back is decided one at a time by the owner's own choice
 * against the viewer's standing, so a role can reach this query and still
 * be told nothing. An owner asking for their own story through here gets
 * the same answer as everybody else and should use `getMyLifeStory`,
 * which is theirs.
 */
export async function getSharedLifeStory(
  deps: M17Deps & StandingDeps,
  ctx: RequestContext,
  input: { ownerParticipantId: string; viewerActorId: string; viewerParticipantId: string | null },
): Promise<SharedLifeStory> {
  const decision = await deps.checkPermission(ctx, {
    action: 'life-story.view-shared',
    resource: {
      type: 'LifeStoryArchive',
      id: 'shared',
      state: 'Any',
      protectedExistence: true,
      ownerParticipantId: input.ownerParticipantId,
    },
  });
  assertAllowed(decision, false);

  const standing = await standingOf(deps, {
    viewerActorId: input.viewerActorId,
    viewerParticipantId: input.viewerParticipantId,
    ownerParticipantId: input.ownerParticipantId,
  });

  const res = await deps.pool.query(
    `SELECT i.id, i.title, i.item_state, i.visibility, i.updated_at,
            v.content_text, v.source_type, v.testimony_state
       FROM life_story.items i
       JOIN life_story.archives a ON a.id = i.archive_id
       LEFT JOIN life_story.item_versions v ON v.id = i.current_version_id
      WHERE a.participant_id = $1
      ORDER BY i.updated_at DESC`,
    [input.ownerParticipantId],
  );

  /*
   * Filtered here rather than in the SQL. The rule that decides who may
   * read somebody's life is worth having in one place, exhaustively
   * tested without a database, rather than spread across a WHERE clause
   * that has to be re-read every time a scope is added.
   */
  const items = res.rows
    .filter((r) => sharedWithOthers(r.item_state as string, r.visibility as string, standing))
    .map((r) => ({
      itemId: r.id as string,
      title: r.title as string,
      contentText: (r.content_text as string | null) ?? null,
      sourceType: (r.source_type as string | null) ?? null,
      testimonyState: (r.testimony_state as string | null) ?? null,
      updatedAt: (r.updated_at as Date).toISOString(),
    }));

  return { ownerParticipantId: input.ownerParticipantId, items };
}


/** One piece in the community feed, with who wrote it. */
export interface SharedStoryPiece extends SharedLifeStoryItem {
  ownerParticipantId: string;
  /** Null when the name cannot be resolved; the screen says so rather than filling it in. */
  ownerDisplayName: string | null;
  /** Yours, so the screen can say so rather than presenting it as somebody else's. */
  mine: boolean;
}

/**
 * The pieces of other people's stories this person may read.
 *
 * The drawing calls the screen "Other people's stories", and until now
 * the Community and Connections scopes reached nobody: a participant
 * could mark a memory for their community and there was no feed to carry
 * it (B-30 left this open after the supporter path was built).
 *
 * Their own shared pieces are included and marked. The drawing's
 * reassurance says "Nothing of yours appears here unless you choose a
 * piece and share it", which is only true if a piece they DID share
 * appears — and it is the only way somebody can check that sharing did
 * what they meant.
 *
 * Private is excluded explicitly rather than left to the standing rule.
 * `sharedWithOthers` says yes to the owner for anything, which is right
 * when it is answering "may Margaret read her own memory" and wrong here:
 * a feed that leaned on it would put a participant's private memories
 * into a screen headed with other people's.
 */
export async function listStoriesSharedWithMe(
  deps: M17Deps & StandingDeps & { participantNames: { findDisplayNames(ids: string[]): Promise<Map<string, string>> } },
  ctx: RequestContext,
  input: { viewerActorId: string; viewerParticipantId: string | null; limit?: number },
): Promise<SharedStoryPiece[]> {
  const decision = await deps.checkPermission(ctx, {
    action: 'life-story.view-shared',
    resource: { type: 'LifeStoryArchive', id: 'feed', state: 'Any', protectedExistence: true },
  });
  assertAllowed(decision, false);

  const reach = await reachOf(deps, input);
  const limit = Math.min(Math.max(input.limit ?? 50, 1), 200);

  /*
   * Whose stories, worked out first, so this is one query rather than
   * one per participant on the platform. Each scope is matched only
   * against the people who satisfy THAT scope — a supporter does not
   * thereby see what was shared with a community, because the
   * participant did not say that.
   */
  const res = await deps.pool.query(
    `SELECT i.id, i.title, i.visibility, i.updated_at, a.participant_id,
            v.content_text, v.source_type, v.testimony_state
       FROM life_story.items i
       JOIN life_story.archives a ON a.id = i.archive_id
       LEFT JOIN life_story.item_versions v ON v.id = i.current_version_id
      WHERE i.item_state = 'Active'
        AND i.visibility <> 'Private'
        AND (
          a.participant_id = $1
          OR (i.visibility = 'My Supporters' AND a.participant_id = ANY($2::text[]))
          OR (i.visibility = 'Connections' AND a.participant_id = ANY($3::text[]))
          OR (i.visibility = 'Community' AND a.participant_id = ANY($4::text[]))
          OR i.visibility = 'Platform Public'
        )
      ORDER BY i.updated_at DESC
      LIMIT $5`,
    [
      input.viewerParticipantId ?? '',
      reach.supporterOf,
      reach.connectedTo,
      reach.sharesCommunityWith,
      limit,
    ],
  );

  const names = await deps.participantNames.findDisplayNames(res.rows.map((r) => r.participant_id as string));
  return res.rows.map((r) => ({
    itemId: r.id as string,
    title: r.title as string,
    contentText: (r.content_text as string | null) ?? null,
    sourceType: (r.source_type as string | null) ?? null,
    testimonyState: (r.testimony_state as string | null) ?? null,
    updatedAt: (r.updated_at as Date).toISOString(),
    ownerParticipantId: r.participant_id as string,
    ownerDisplayName: names.get(r.participant_id as string) ?? null,
    mine: input.viewerParticipantId !== null && r.participant_id === input.viewerParticipantId,
  }));
}
