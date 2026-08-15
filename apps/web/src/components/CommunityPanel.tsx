import { useCallback, useEffect, useState } from 'react';
import {
  api,
  PlatformApiError,
  type CommunityFeedPost,
  type CommunitySpaceSummary,
  type OwnPostSummary,
  type Session,
} from '../api.js';
import { presentError, type PresentedError } from '../errors.js';
import { EmptyState, ErrorState, LoadingState } from './StateBlock.js';

/**
 * Community screen (Doc 20; ADR-113): joining is optional and gated on the
 * community-participation consent; joining agrees to an EXACT rule version,
 * shown in full before confirming. The feed is member-only and strictly
 * chronological — no algorithmic ranking, no engagement mechanics, and no
 * unread counts. Posting is draft-first: nothing leaves the author without
 * an explicit confirmed "Publish to [community]" step, mirroring message
 * sending.
 */
const POST_STATE_LABELS: Record<string, string> = {
  Draft: 'Draft — only you can see it',
  Published: 'Published',
  Hidden: 'Hidden for now (under review)',
  Restricted: 'Limited visibility',
  Removed: 'Removed (decided by a person, not by an automated system)',
  Deleted: 'Deleted',
  Archived: 'Archived',
  Restored: 'Restored',
  Withdrawn: 'Withdrawn',
};

export function CommunityPanel({ session }: { session: Session }) {
  const [spaces, setSpaces] = useState<CommunitySpaceSummary[] | null>(null);
  const [joining, setJoining] = useState<CommunitySpaceSummary | null>(null);
  const [openSpace, setOpenSpace] = useState<CommunitySpaceSummary | null>(null);
  const [feed, setFeed] = useState<CommunityFeedPost[] | null>(null);
  const [myPosts, setMyPosts] = useState<OwnPostSummary[]>([]);
  const [composeText, setComposeText] = useState('');
  const [publishing, setPublishing] = useState<OwnPostSummary | null>(null);
  const [announcement, setAnnouncement] = useState('');
  // Distinguish "not loaded yet" from "loaded and empty": a blank area
  // that silently means "still loading" misreports the system state.
  const [spacesLoading, setSpacesLoading] = useState(true);
  const [spacesError, setSpacesError] = useState<PresentedError | null>(null);
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedError, setFeedError] = useState<PresentedError | null>(null);
  const [actionError, setActionError] = useState<PresentedError | null>(null);
  const [reporting, setReporting] = useState<{ postId: string; category: string; description: string } | null>(null);
  const [leaving, setLeaving] = useState<CommunitySpaceSummary | null>(null);

  const loadSpaces = useCallback(async () => {
    setSpacesLoading(true);
    setSpacesError(null);
    try {
      const res = await api.listCommunitySpaces(session);
      setSpaces(res.data.map((s) => s.attributes));
      if (res.data.length === 0) setAnnouncement('There are no open communities yet.');
    } catch (err) {
      setSpaces([]);
      setSpacesError(presentError(err));
    } finally {
      setSpacesLoading(false);
    }
  }, [session]);

  const loadMyPosts = useCallback(async () => {
    try {
      const res = await api.listMyPosts(session);
      setMyPosts(res.data.map((p) => p.attributes));
    } catch {
      /* the my-posts list is auxiliary; feed errors are announced separately */
    }
  }, [session]);

  useEffect(() => {
    void loadSpaces();
    void loadMyPosts();
  }, [loadSpaces, loadMyPosts]);

  const openFeed = async (space: CommunitySpaceSummary) => {
    setOpenSpace(space);
    setFeed(null);
    setFeedLoading(true);
    setFeedError(null);
    try {
      const res = await api.listCommunityFeed(session, space.spaceId);
      setFeed(res.data.map((p) => p.attributes));
      setAnnouncement(
        res.data.length === 0
          ? 'There are no posts in this community yet.'
          : 'The posts are shown in time order, newest first.',
      );
    } catch (err) {
      setFeed([]);
      setFeedError(presentError(err));
    } finally {
      setFeedLoading(false);
    }
  };

  const join = async () => {
    if (joining === null) return;
    const space = joining;
    setJoining(null);
    setActionError(null);
    try {
      await api.joinCommunity(session, space.spaceId, space.ruleVersionId);
      setAnnouncement(
        `You have joined "${space.name}". You can stop taking part at any time, and that does not affect anything else.`,
      );
      await loadSpaces();
    } catch (err) {
      // A consent-gated join denial arrives as a protected-existence 404,
      // so the generic wording would send the person hunting for a wrong
      // identifier. Name the one thing they can actually act on.
      if (err instanceof PlatformApiError && (err.status === 403 || err.status === 404)) {
        setActionError({
          severity: 2,
          title: `You cannot join "${space.name}" yet`,
          reassurance: 'You have not been added to this community, and nothing was published.',
          reason: 'Joining a community needs your consent for "Join the community" first.',
          nextStep:
            'Open My consent choices, grant "Join the community", then come back and join. You can change it back at any time.',
          code: err.error?.code ?? 'AUTHORISATION_DENIED',
        });
      } else {
        setActionError(presentError(err));
      }
    }
  };

  const draft = async () => {
    if (openSpace === null || composeText.trim() === '') return;
    setActionError(null);
    try {
      await api.draftSocialPost(session, openSpace.spaceId, composeText.trim());
      setComposeText('');
      setAnnouncement('Your draft is saved. Only you can see it, and publishing needs an explicit confirmation from you.');
      await loadMyPosts();
    } catch (err) {
      setActionError(presentError(err));
    }
  };

  const publish = async () => {
    if (publishing === null) return;
    const post = publishing;
    setPublishing(null);
    setActionError(null);
    try {
      await api.publishSocialPost(session, post.postId);
      setAnnouncement('Published. Members of that community can now see this post.');
      await loadMyPosts();
      if (openSpace !== null && openSpace.spaceId === post.spaceId) await openFeed(openSpace);
    } catch (err) {
      setActionError(presentError(err));
    }
  };

  const spaceName = (spaceId: string) => spaces?.find((s) => s.spaceId === spaceId)?.name ?? spaceId;
  const leave = async () => {
    if (leaving === null) return;
    setActionError(null);
    try {
      await api.leaveCommunity(session, leaving.spaceId);
      const name = leaving.name;
      setLeaving(null);
      // If the feed for that community was open, it must close: staying on
      // a feed you are no longer a member of would show posts the platform
      // has just stopped letting you see.
      if (openSpace !== null && openSpace.spaceId === leaving.spaceId) setOpenSpace(null);
      await loadSpaces();
      setAnnouncement(`You have left ${name}. What you posted there is still there; you are not.`);
    } catch (err) {
      setActionError(presentError(err));
    }
  };

  const sendReport = async () => {
    if (reporting === null) return;
    setActionError(null);
    try {
      await api.reportPost(session, reporting.postId, reporting.category, reporting.description.trim());
      setReporting(null);
      // Says what will happen next, and does not promise a reply or a
      // particular outcome, because neither is guaranteed.
      setAnnouncement('Your report has been sent. A person will read it. The post stays where it is until someone decides.');
    } catch (err) {
      setActionError(presentError(err));
    }
  };

  const drafts = myPosts.filter((p) => p.postState === 'Draft');

  return (
    <section aria-labelledby="community-heading">
      <h2 id="community-heading">Community (optional)</h2>
      <p>
        Taking part in a community is entirely optional. You see the community's rules before you join. Posts are shown
        in time order — there is no algorithmic ranking, and no likes or view counts. Posts from people you have blocked
        are not shown to you, and they cannot see your posts.
      </p>
      {/*
        Until a separate public profile exists, the name other members see
        is the one on the participant record. That is a real disclosure,
        not a detail: someone deciding whether to post should know which
        name it will carry, and there is currently no screen where they
        could choose a different one.
      */}
      <p>
        Posts you publish here carry the name on your participant record. There is not yet a separate name you can
        choose for the community.
      </p>

      <section aria-labelledby="spaces-heading">
        <h3 id="spaces-heading">Community list</h3>
        <p>
          <button onClick={() => void loadSpaces()}>Refresh the list</button>
        </p>
        {spacesLoading && <LoadingState label="Loading the community list…" />}
        {spacesError !== null && <ErrorState error={spacesError} />}
        {!spacesLoading && spacesError === null && spaces !== null && spaces.length === 0 && (
          <EmptyState title="There are no open communities yet" detail="When a new community opens, it will appear here." />
        )}
        {spaces !== null && spaces.length > 0 && (
          <ul className="list-plain">
            {spaces.map((s) => (
              <li key={s.spaceId} className="card card--community">
                <p>
                  <strong>{s.name}</strong>{' '}
                  {s.membershipState === 'Active' ? <span>(you are a member)</span> : <span>(not joined)</span>}
                </p>
                {s.membershipState === 'Active' ? (
                  <>
                    <button onClick={() => void openFeed(s)}>Open "{s.name}"</button>{' '}
                    {/*
                      Joining was reachable and leaving was not, so "taking
                      part is entirely optional" was true exactly once.
                    */}
                    <button onClick={() => setLeaving(s)}>Leave "{s.name}"</button>
                  </>
                ) : (
                  <button onClick={() => setJoining(s)}>Read the rules and join</button>
                )}
              </li>
            ))}
          </ul>
        )}
        {leaving !== null && (
          <div role="alertdialog" aria-labelledby="leave-confirm-heading">
            <p id="leave-confirm-heading">Leave "{leaving.name}"?</p>
            {/*
              What actually happens, said before the button. Leaving stops
              the feed and stops posting; it does not delete what was
              already written, and pretending otherwise would be the
              opposite mistake from the one this fixes.
            */}
            <p>
              You will stop seeing this community's posts and will not be able to post to it. What you have already
              posted stays where it is — leaving does not delete it. You can join again later; you will be asked to
              read the rules again.
            </p>
            <p>
              <button onClick={() => void leave()}>Yes, leave this community</button>{' '}
              <button onClick={() => setLeaving(null)}>Go back</button>
            </p>
          </div>
        )}

        {joining !== null && (
          <div role="alertdialog" aria-labelledby="join-confirm-heading">
            <p id="join-confirm-heading">
              Before you join "{joining.name}", please read the community rules (version {joining.ruleVersionNumber}):
            </p>
            <blockquote>{joining.rulesText}</blockquote>
            <p>
              Joining means you agree to the version of the rules shown above. Joining also needs your consent for
              "Join the community". You can stop taking part at any time.
            </p>
            <button onClick={() => void join()}>Agree to the rules and join</button>{' '}
            <button onClick={() => setJoining(null)}>Go back</button>
          </div>
        )}
      </section>

      {openSpace !== null && (
        <section aria-labelledby="feed-heading">
          <h3 id="feed-heading">Posts in "{openSpace.name}"</h3>
          <p>Posts are shown in time order, newest first.</p>
          {feedLoading && <LoadingState label="Loading the posts…" />}
          {feedError !== null && <ErrorState error={feedError} />}
          {!feedLoading && feedError === null && feed !== null && feed.length === 0 && (
            <EmptyState title="There are no posts in this community yet" detail="You can write the first one below." />
          )}
          {feed !== null && feed.length > 0 && (
            <ul className="list-plain">
              {feed.map((p) => (
                <li key={p.postId} className="card">
                  <p>{p.contentText}</p>
                  <p>
                    <small>
                      {p.authorParticipantId === session.participantId ? 'You' : p.authorDisplayName} ·{' '}
                      {new Date(p.publishedAt).toLocaleString()}
                    </small>
                  </p>
                  {/*
                    Reporting from where the thing is (decision D-4's main
                    path). Without it a report could only be made on the
                    Help screen by typing somebody's identifier, and no
                    report could name a post at all — so the moderation
                    decisions that act on content had nothing to act on.
                    Your own post is not reportable; withdrawing your own
                    writing is a different thing and this is not it.
                  */}
                  {p.authorParticipantId !== session.participantId && (
                    <p>
                      <button onClick={() => setReporting({ postId: p.postId, category: 'unkind', description: '' })}>
                        Report this post
                      </button>
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}

          <section aria-labelledby="compose-heading">
            <h4 id="compose-heading">Write a post</h4>
            <p>
              <label htmlFor="compose-text">
                What you would like to share (it is saved as a draft first; publishing needs your confirmation)
              </label>
            </p>
            <textarea
              id="compose-text"
              rows={3}
              value={composeText}
              onChange={(e) => setComposeText(e.target.value)}
            />
            <p>
              <button onClick={() => void draft()}>Save draft</button>
            </p>
          </section>
        </section>
      )}

      {drafts.length > 0 && (
        <section aria-labelledby="drafts-heading">
          <h3 id="drafts-heading">My drafts</h3>
          <p>
            Only you can see a draft. Once it is published, members of that community can see it, and staff review it
            against the community rules.
          </p>
          <ul className="list-plain">
            {drafts.map((p) => (
              <li key={p.postId} className="card card--draft">
                <p>{p.contentText}</p>
                <p>
                  <small>
                    {POST_STATE_LABELS[p.postState] ?? p.postState} · Community: {spaceName(p.spaceId)}
                  </small>
                </p>
                <button onClick={() => setPublishing(p)}>Publish…</button>
              </li>
            ))}
          </ul>
          {publishing !== null && (
            <div role="alertdialog" aria-labelledby="publish-confirm-heading">
              <p id="publish-confirm-heading">
                Publish this to "{spaceName(publishing.spaceId)}"? Once published, members of that community can see
                it.
              </p>
              <blockquote>{publishing.contentText}</blockquote>
              <button onClick={() => void publish()}>Confirm publishing</button>{' '}
              <button onClick={() => setPublishing(null)}>Go back</button>
            </div>
          )}
        </section>
      )}

      {reporting !== null && (
        <div role="alertdialog" aria-labelledby="report-post-heading">
          <h4 id="report-post-heading">Report this post</h4>
          <p>
            A person reads every report. Nothing is decided automatically. You are not told who else has reported
            anything, and the person you are reporting is never told that it was you.
          </p>
          <p>
            <label htmlFor="report-post-category">What is wrong with it</label>
            <select
              id="report-post-category"
              value={reporting.category}
              onChange={(e) => setReporting({ ...reporting, category: e.target.value })}
            >
              <option value="unkind">Unkind or hurtful</option>
              <option value="personal-information">It shares someone's private information</option>
              <option value="not-about-this-community">It does not belong in this community</option>
              <option value="something-else">Something else</option>
            </select>
          </p>
          <p>
            <label htmlFor="report-post-description">In your own words (required)</label>
          </p>
          <textarea
            id="report-post-description"
            rows={3}
            value={reporting.description}
            onChange={(e) => setReporting({ ...reporting, description: e.target.value })}
          />
          <p>
            <button disabled={reporting.description.trim() === ''} onClick={() => void sendReport()}>
              Send this report
            </button>{' '}
            <button onClick={() => setReporting(null)}>Go back</button>
          </p>
        </div>
      )}

      {actionError !== null && <ErrorState error={actionError} />}
      <p aria-live="polite" role="status">
        {announcement}
      </p>
    </section>
  );
}
