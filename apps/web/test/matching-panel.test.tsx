import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { MatchingPanel } from '../src/components/MatchingPanel.js';

const session = { actorId: 'actor_test', participantId: 'pt_a' };

function stubFetch(mutualAcceptanceId?: string) {
  const calls: { path: string; body: Record<string, unknown> }[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (path: string, init: RequestInit) => {
      calls.push({ path, body: JSON.parse(init.body as string) as Record<string, unknown> });
      const meta = mutualAcceptanceId === undefined ? {} : { mutualAcceptanceId };
      return new Response(JSON.stringify({ data: { id: 'md_1', meta } }), { status: 201 });
    }),
  );
  return calls;
}

async function decideInterested(calls: { path: string; body: Record<string, unknown> }[]) {
  fireEvent.change(screen.getByLabelText('推荐标识'), { target: { value: 'cand_1' } });
  fireEvent.click(screen.getByRole('button', { name: '感兴趣' }));
  // Decision goes through an explicit confirmation bound to the exact
  // candidate and version; nothing is sent before confirming.
  const dialog = screen.getByRole('alertdialog');
  expect(dialog.textContent).toContain('cand_1');
  expect(dialog.textContent).toContain('版本 1');
  expect(calls.length).toBe(0);
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: '确认' }));
  });
}

describe('MatchingPanel (opt-in matching, ADR-036)', () => {
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

  it('a lone Interested decision is private: version-bound request, truthful no-notification message', async () => {
    const calls = stubFetch();
    render(<MatchingPanel session={session} />);
    await decideInterested(calls);
    expect(calls.length).toBe(1);
    expect(calls[0]?.path).toBe('/v1/match-candidates/cand_1/decision');
    expect(calls[0]?.body['expectedCandidateVersion']).toBe(1);
    expect(calls[0]?.body['decision']).toBe('Interested');
    const status = screen.getByRole('status');
    expect(status.textContent).toContain('对方不会收到通知');
    // No connection opportunity appears from one decision alone.
    expect(screen.queryByRole('button', { name: '建立联系' })).toBeNull();
  });

  it('mutual interest surfaces a connection opportunity that still needs its own confirmed step', async () => {
    const calls = stubFetch('ma_1');
    render(<MatchingPanel session={session} />);
    await decideInterested(calls);
    expect(screen.getByText('你们互相表示了兴趣')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '建立联系' }));
    // Still nothing sent until the confirmation inside the dialog.
    expect(calls.filter((c) => c.path.includes('activate-connection')).length).toBe(0);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '确认建立联系' }));
    });
    const conn = calls.find((c) => c.path.includes('activate-connection'));
    expect(conn?.path).toBe('/v1/mutual-acceptances/ma_1/activate-connection');
    expect(conn?.body['confirmed']).toBe(true);
  });
});
