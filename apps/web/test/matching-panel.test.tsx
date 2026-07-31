import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { MatchingPanel } from '../src/components/MatchingPanel.js';

const session = { actorId: 'actor_test', participantId: 'pt_a' };

const CANDIDATE = {
  candidateId: 'cand_1',
  candidateVersion: 3,
  explanation: '你们都选择了园艺作为兴趣',
  expiresAt: '2026-08-30T00:00:00Z',
};

function stubFetch(mutualAcceptanceId?: string) {
  const calls: { path: string; method: string; body?: Record<string, unknown> }[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (path: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET';
      calls.push({
        path,
        method,
        ...(init?.body === undefined ? {} : { body: JSON.parse(init.body as string) as Record<string, unknown> }),
      });
      if (method === 'GET') {
        return new Response(
          JSON.stringify({ data: [{ type: 'MatchCandidate', id: CANDIDATE.candidateId, attributes: CANDIDATE }] }),
          { status: 200 },
        );
      }
      const meta = mutualAcceptanceId === undefined ? {} : { mutualAcceptanceId };
      return new Response(JSON.stringify({ data: { id: 'md_1', meta } }), { status: 201 });
    }),
  );
  return calls;
}

async function loadAndChooseInterested(calls: { path: string; method: string }[]) {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: '查看当前推荐' }));
  });
  // The candidate shows its explanation — never the other person's identity.
  expect(screen.getByText('你们都选择了园艺作为兴趣')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: '感兴趣' }));
  const dialog = screen.getByRole('alertdialog');
  expect(dialog.textContent).toContain('版本 3');
  expect(calls.filter((c) => c.method === 'POST').length).toBe(0);
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: '确认' }));
  });
}

describe('MatchingPanel (opt-in matching over API lists, ADR-036)', () => {
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('states that matching is off by default and needs the open-matching consent', () => {
    stubFetch();
    render(<MatchingPanel session={session} />);
    expect(screen.getByText(/匹配默认关闭/)).toBeTruthy();
    expect(screen.getByText(/「开放匹配」/)).toBeTruthy();
  });

  it('candidates come from the API; a decision is version-bound, confirmed, and private', async () => {
    const calls = stubFetch();
    render(<MatchingPanel session={session} />);
    await loadAndChooseInterested(calls);
    const post = calls.find((c) => c.method === 'POST') as { body?: Record<string, unknown>; path: string };
    expect(post.path).toBe('/v1/match-candidates/cand_1/decision');
    expect(post.body?.['expectedCandidateVersion']).toBe(3);
    expect(post.body?.['decision']).toBe('Interested');
    const status = screen.getByRole('status');
    expect(status.textContent).toContain('对方不会收到通知');
    expect(screen.queryByRole('button', { name: '建立联系' })).toBeNull();
  });

  it('mutual interest surfaces a connection opportunity that still needs its own confirmed step', async () => {
    const calls = stubFetch('ma_1');
    render(<MatchingPanel session={session} />);
    await loadAndChooseInterested(calls);
    expect(screen.getByText('你们互相表示了兴趣')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '建立联系' }));
    expect(calls.filter((c) => c.path.includes('activate-connection')).length).toBe(0);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '确认建立联系' }));
    });
    const conn = calls.find((c) => c.path.includes('activate-connection')) as { body?: Record<string, unknown>; path: string };
    expect(conn.path).toBe('/v1/mutual-acceptances/ma_1/activate-connection');
    expect(conn.body?.['confirmed']).toBe(true);
  });
});
