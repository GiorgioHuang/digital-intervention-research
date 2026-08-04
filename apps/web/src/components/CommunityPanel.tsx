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
 * an explicit confirmed "发布到[社区]" step, mirroring message sending.
 */
const POST_STATE_LABELS: Record<string, string> = {
  Draft: '草稿 — 只有你能看到',
  Published: '已发布',
  Hidden: '已被暂时隐藏（审核中）',
  Restricted: '已被限制可见',
  Removed: '已被移除（人工审核决定）',
  Deleted: '已删除',
  Archived: '已归档',
  Restored: '已恢复',
  Withdrawn: '已撤回',
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

  const loadSpaces = useCallback(async () => {
    setSpacesLoading(true);
    setSpacesError(null);
    try {
      const res = await api.listCommunitySpaces(session);
      setSpaces(res.data.map((s) => s.attributes));
      if (res.data.length === 0) setAnnouncement('目前还没有开放的社区。');
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
      setAnnouncement(res.data.length === 0 ? '这个社区还没有帖子。' : '帖子已按时间顺序显示。');
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
      setAnnouncement(`已加入「${space.name}」。你随时可以停止参与，这不影响其他功能。`);
      await loadSpaces();
    } catch (err) {
      // A consent-gated join denial arrives as a protected-existence 404,
      // so the generic wording would send the person hunting for a wrong
      // identifier. Name the one thing they can actually act on.
      if (err instanceof PlatformApiError && (err.status === 403 || err.status === 404)) {
        setActionError({
          severity: 2,
          title: `现在还不能加入「${space.name}」`,
          reassurance: '你没有被加入这个社区，也没有任何内容被发布。',
          reason: '加入社区需要你先同意「社区参与」。',
          nextStep: '去「我的同意选择」同意「社区参与」，然后再回来加入；你随时可以再改回去。',
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
      setAnnouncement('草稿已保存。只有你能看到；发布前需要你明确确认。');
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
      setAnnouncement('已发布。社区成员现在可以看到这条帖子。');
      await loadMyPosts();
      if (openSpace !== null && openSpace.spaceId === post.spaceId) await openFeed(openSpace);
    } catch (err) {
      setActionError(presentError(err));
    }
  };

  const spaceName = (spaceId: string) => spaces?.find((s) => s.spaceId === spaceId)?.name ?? spaceId;
  const drafts = myPosts.filter((p) => p.postState === 'Draft');

  return (
    <section aria-labelledby="community-heading">
      <h2 id="community-heading">社区（可选）</h2>
      <p>
        参加社区完全是可选的。加入前会看到该社区的规则；帖子按时间顺序显示，没有算法排序，也没有点赞或浏览量。
        你屏蔽的人的帖子不会显示，对方也看不到你的帖子。
      </p>

      <section aria-labelledby="spaces-heading">
        <h3 id="spaces-heading">社区列表</h3>
        <p>
          <button onClick={() => void loadSpaces()}>刷新列表</button>
        </p>
        {spacesLoading && <LoadingState label="正在获取社区列表…" />}
        {spacesError !== null && <ErrorState error={spacesError} />}
        {!spacesLoading && spacesError === null && spaces !== null && spaces.length === 0 && (
          <EmptyState title="目前还没有开放的社区" detail="有新的社区开放时，会出现在这里。" />
        )}
        {spaces !== null && spaces.length > 0 && (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {spaces.map((s) => (
              <li key={s.spaceId} style={{ border: '1px solid currentColor', padding: '1rem', marginBlock: '0.75rem' }}>
                <p>
                  <strong>{s.name}</strong>{' '}
                  {s.membershipState === 'Active' ? <span>（你是成员）</span> : <span>（未加入）</span>}
                </p>
                {s.membershipState === 'Active' ? (
                  <button onClick={() => void openFeed(s)}>进入「{s.name}」</button>
                ) : (
                  <button onClick={() => setJoining(s)}>查看规则并加入</button>
                )}
              </li>
            ))}
          </ul>
        )}
        {joining !== null && (
          <div role="alertdialog" aria-labelledby="join-confirm-heading">
            <p id="join-confirm-heading">
              加入「{joining.name}」前，请先阅读社区规则（第 {joining.ruleVersionNumber} 版）：
            </p>
            <blockquote>{joining.rulesText}</blockquote>
            <p>加入即表示你同意上面这一版规则。加入需要你已同意「社区参与」；你随时可以停止参与。</p>
            <button onClick={() => void join()}>同意规则并加入</button>{' '}
            <button onClick={() => setJoining(null)}>返回</button>
          </div>
        )}
      </section>

      {openSpace !== null && (
        <section aria-labelledby="feed-heading">
          <h3 id="feed-heading">「{openSpace.name}」的帖子</h3>
          <p>帖子按时间从新到旧显示。</p>
          {feedLoading && <LoadingState label="正在获取帖子…" />}
          {feedError !== null && <ErrorState error={feedError} />}
          {!feedLoading && feedError === null && feed !== null && feed.length === 0 && (
            <EmptyState title="这个社区还没有帖子" detail="你可以在下面写第一条。" />
          )}
          {feed !== null && feed.length > 0 && (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {feed.map((p) => (
                <li key={p.postId} style={{ border: '1px solid currentColor', padding: '1rem', marginBlock: '0.75rem' }}>
                  <p>{p.contentText}</p>
                  <p>
                    <small>
                      {p.authorParticipantId === session.participantId ? '你' : `成员 ${p.authorParticipantId}`} ·{' '}
                      {new Date(p.publishedAt).toLocaleString()}
                    </small>
                  </p>
                </li>
              ))}
            </ul>
          )}

          <section aria-labelledby="compose-heading">
            <h4 id="compose-heading">写一条帖子</h4>
            <p>
              <label htmlFor="compose-text">想分享的内容（先存为草稿，发布前需要你确认）</label>
            </p>
            <textarea
              id="compose-text"
              rows={3}
              value={composeText}
              onChange={(e) => setComposeText(e.target.value)}
            />
            <p>
              <button onClick={() => void draft()}>保存草稿</button>
            </p>
          </section>
        </section>
      )}

      {drafts.length > 0 && (
        <section aria-labelledby="drafts-heading">
          <h3 id="drafts-heading">我的草稿</h3>
          <p>草稿只有你能看到。发布后社区成员可以看到，工作人员按社区规则进行人工审核。</p>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {drafts.map((p) => (
              <li key={p.postId} style={{ border: '1px dashed currentColor', padding: '1rem', marginBlock: '0.75rem' }}>
                <p>{p.contentText}</p>
                <p>
                  <small>
                    {POST_STATE_LABELS[p.postState] ?? p.postState} · 社区：{spaceName(p.spaceId)}
                  </small>
                </p>
                <button onClick={() => setPublishing(p)}>发布…</button>
              </li>
            ))}
          </ul>
          {publishing !== null && (
            <div role="alertdialog" aria-labelledby="publish-confirm-heading">
              <p id="publish-confirm-heading">确认发布到「{spaceName(publishing.spaceId)}」？发布后社区成员都能看到。</p>
              <blockquote>{publishing.contentText}</blockquote>
              <button onClick={() => void publish()}>确认发布</button>{' '}
              <button onClick={() => setPublishing(null)}>返回</button>
            </div>
          )}
        </section>
      )}

      {actionError !== null && <ErrorState error={actionError} />}
      <p aria-live="polite" role="status">
        {announcement}
      </p>
    </section>
  );
}
