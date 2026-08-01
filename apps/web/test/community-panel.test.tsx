import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { CommunityPanel } from '../src/components/CommunityPanel.js';

const session = { actorId: 'actor_test', participantId: 'pt_a' };

const SPACE_UNJOINED = {
  spaceId: 'cs_1',
  name: '园艺角',
  ruleVersionId: 'crv_1',
  ruleVersionNumber: 2,
  rulesText: '友善交流；不分享他人隐私。',
  membershipState: null,
};
const SPACE_JOINED = { ...SPACE_UNJOINED, membershipState: 'Active' };
const FEED_POST = {
  postId: 'sp_9',
  authorParticipantId: 'pt_b',
  contentText: '今天的番茄熟了',
  publishedAt: '2026-08-01T02:00:00Z',
};
const DRAFT_POST = {
  postId: 'sp_d1',
  spaceId: 'cs_1',
  contentText: '我的第一条帖子',
  postState: 'Draft',
  createdAt: '2026-08-01T01:00:00Z',
  publishedAt: null,
};

interface Call {
  path: string;
  method: string;
  body?: Record<string, unknown>;
}

function stubFetch(opts: { joined: boolean; drafts?: typeof DRAFT_POST[]; joinStatus?: number }) {
  const calls: Call[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (path: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET';
      calls.push({
        path,
        method,
        ...(init?.body === undefined ? {} : { body: JSON.parse(init.body as string) as Record<string, unknown> }),
      });
      if (method === 'GET' && path.endsWith('/community-spaces')) {
        const space = opts.joined ? SPACE_JOINED : SPACE_UNJOINED;
        return new Response(JSON.stringify({ data: [{ type: 'CommunitySpace', id: space.spaceId, attributes: space }] }), {
          status: 200,
        });
      }
      if (method === 'GET' && path.endsWith('/feed')) {
        return new Response(JSON.stringify({ data: [{ type: 'SocialPost', id: FEED_POST.postId, attributes: FEED_POST }] }), {
          status: 200,
        });
      }
      if (method === 'GET' && path.endsWith('/social-posts')) {
        const drafts = opts.drafts ?? [];
        return new Response(
          JSON.stringify({ data: drafts.map((d) => ({ type: 'SocialPost', id: d.postId, attributes: d })) }),
          { status: 200 },
        );
      }
      if (method === 'POST' && path.endsWith('/join')) {
        const status = opts.joinStatus ?? 201;
        return status < 400
          ? new Response(JSON.stringify({ data: { id: 'cm_1' } }), { status })
          : new Response(
              JSON.stringify({ error: { code: 'AUTHORISATION_DENIED', message: 'denied', requestId: 'r', retryable: false } }),
              { status },
            );
      }
      return new Response(JSON.stringify({ data: { id: 'sp_new' } }), { status: 201 });
    }),
  );
  return calls;
}

describe('CommunityPanel (optional community, versioned rules, chronological feed)', () => {
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('joining shows the exact rule version and posts the agreed ruleVersionId', async () => {
    const calls = stubFetch({ joined: false });
    await act(async () => {
      render(<CommunityPanel session={session} />);
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '查看规则并加入' }));
    });
    const dialog = screen.getByRole('alertdialog');
    // The exact rules text and version number are shown BEFORE any join call.
    expect(dialog.textContent).toContain('友善交流；不分享他人隐私。');
    expect(dialog.textContent).toContain('第 2 版');
    expect(calls.filter((c) => c.method === 'POST').length).toBe(0);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '同意规则并加入' }));
    });
    const join = calls.find((c) => c.method === 'POST' && c.path === '/v1/community-spaces/cs_1/join');
    expect(join?.body).toMatchObject({ participantId: 'pt_a', ruleVersionId: 'crv_1' });
  });

  it('a consent-gated join denial explains the consent path instead of a raw code', async () => {
    stubFetch({ joined: false, joinStatus: 404 });
    await act(async () => {
      render(<CommunityPanel session={session} />);
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '查看规则并加入' }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '同意规则并加入' }));
    });
    expect(screen.getByRole('status').textContent).toContain('社区参与');
  });

  it('a member opens the chronological feed and drafts stay private until confirmed publish', async () => {
    const calls = stubFetch({ joined: true, drafts: [DRAFT_POST] });
    await act(async () => {
      render(<CommunityPanel session={session} />);
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '进入「园艺角」' }));
    });
    expect(screen.getByText('今天的番茄熟了')).toBeTruthy();
    expect(screen.getByText('帖子按时间从新到旧显示。')).toBeTruthy();

    // Compose saves a DRAFT only — no publish call yet.
    fireEvent.change(screen.getByLabelText(/想分享的内容/), { target: { value: '大家好' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '保存草稿' }));
    });
    const draftCall = calls.find((c) => c.method === 'POST' && c.path === '/v1/social-posts');
    expect(draftCall?.body).toMatchObject({ spaceId: 'cs_1', participantId: 'pt_a', contentText: '大家好' });
    expect(calls.some((c) => c.path.includes('/publish'))).toBe(false);

    // The pre-seeded draft is labelled as private and publishes only after
    // an explicit confirmation naming the community.
    expect(screen.getByText(/草稿 — 只有你能看到/).textContent).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '发布…' }));
    const dialog = screen.getByRole('alertdialog');
    expect(dialog.textContent).toContain('发布到「园艺角」');
    expect(calls.some((c) => c.path.includes('/publish'))).toBe(false);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '确认发布' }));
    });
    const publish = calls.find((c) => c.method === 'POST' && c.path === '/v1/social-posts/sp_d1/publish');
    expect(publish?.body).toMatchObject({ participantId: 'pt_a', confirmed: true });
  });
});
