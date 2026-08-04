import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { CommunityPanel } from '../src/components/CommunityPanel.js';

const session = { actorId: 'actor_test', participantId: 'pt_a' };

const SPACE_UNJOINED = {
  spaceId: 'cs_1',
  name: 'Gardening Corner',
  ruleVersionId: 'crv_1',
  ruleVersionNumber: 2,
  rulesText: 'Be kind. Do not share other people\'s private information.',
  membershipState: null,
};
const SPACE_JOINED = { ...SPACE_UNJOINED, membershipState: 'Active' };
const FEED_POST = {
  postId: 'sp_9',
  authorParticipantId: 'pt_b',
  authorDisplayName: 'Ben',
  contentText: 'The tomatoes are ripe today',
  publishedAt: '2026-08-01T02:00:00Z',
};
const DRAFT_POST = {
  postId: 'sp_d1',
  spaceId: 'cs_1',
  contentText: 'My first post',
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
      fireEvent.click(screen.getByRole('button', { name: 'Read the rules and join' }));
    });
    const dialog = screen.getByRole('alertdialog');
    // The exact rules text and version number are shown BEFORE any join call.
    expect(dialog.textContent).toContain("Be kind. Do not share other people's private information.");
    expect(dialog.textContent).toContain('2');
    expect(calls.filter((c) => c.method === 'POST').length).toBe(0);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Agree to the rules and join' }));
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
      fireEvent.click(screen.getByRole('button', { name: 'Read the rules and join' }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Agree to the rules and join' }));
    });
    // A blocked action is announced as an alert, not a passive status
    // line, and it names the one thing the person can act on rather than
    // an error code. The code stays available for support, collapsed.
    const alert = screen.getByRole('alert');
    expect(alert.textContent).toContain('Join the community');
    expect(alert.textContent).toContain('My consent choices');
    // The code is present for support but starts collapsed, so the person
    // reads guidance rather than AUTHORISATION_DENIED.
    const details = alert.querySelector('details');
    expect(details).not.toBeNull();
    expect(details!.open).toBe(false);
    expect(details!.textContent).toContain('AUTHORISATION_DENIED');
  });

  it('a member opens the chronological feed and drafts stay private until confirmed publish', async () => {
    const calls = stubFetch({ joined: true, drafts: [DRAFT_POST] });
    await act(async () => {
      render(<CommunityPanel session={session} />);
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Open "Gardening Corner"' }));
    });
    expect(screen.getByText('The tomatoes are ripe today')).toBeTruthy();
    expect(screen.getAllByText(/newest first/).length).toBeGreaterThan(0);
    // Decision D-12: the author is named, and the internal identifier does
    // not reach the page at all.
    expect(screen.getByText(/Ben/)).toBeTruthy();
    expect(document.body.textContent).not.toContain('pt_b');

    // Compose saves a DRAFT only — no publish call yet.
    fireEvent.change(screen.getByLabelText(/What you would like to share/), { target: { value: 'Hello everyone' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));
    });
    const draftCall = calls.find((c) => c.method === 'POST' && c.path === '/v1/social-posts');
    expect(draftCall?.body).toMatchObject({ spaceId: 'cs_1', participantId: 'pt_a', contentText: 'Hello everyone' });
    expect(calls.some((c) => c.path.includes('/publish'))).toBe(false);

    // The pre-seeded draft is labelled as private and publishes only after
    // an explicit confirmation naming the community.
    expect(screen.getByText(/only you can see it/).textContent).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Publish…' }));
    const dialog = screen.getByRole('alertdialog');
    expect(dialog.textContent).toContain('Gardening Corner');
    expect(calls.some((c) => c.path.includes('/publish'))).toBe(false);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Confirm publishing' }));
    });
    const publish = calls.find((c) => c.method === 'POST' && c.path === '/v1/social-posts/sp_d1/publish');
    expect(publish?.body).toMatchObject({ participantId: 'pt_a', confirmed: true });
  });
});
