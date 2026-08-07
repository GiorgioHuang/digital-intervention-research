import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { MatchingPanel } from '../src/components/MatchingPanel.js';

const session = { actorId: 'actor_test', participantId: 'pt_a' };

const CANDIDATE = {
  candidateId: 'cand_1',
  candidateVersion: 3,
  explanation: 'You both listed gardening as an interest',
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
    fireEvent.click(screen.getByRole('button', { name: 'Show current suggestions' }));
  });
  // The candidate shows its explanation — never the other person's identity.
  expect(screen.getByText('You both listed gardening as an interest')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Interested' }));
  const dialog = screen.getByRole('alertdialog');
  expect(dialog.textContent).toContain('3');
  expect(calls.filter((c) => c.method === 'POST').length).toBe(0);
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
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
    expect(screen.getByText(/off by default/)).toBeTruthy();
    expect(screen.getByText(/Open matching/)).toBeTruthy();
  });

  /**
   * `matching.activate` is in the permission engine's confirmation tier
   * and this was one click, with `confirmed: true` supplied by the api
   * client. Deciding on a candidate and connecting both asked; the step
   * that puts somebody into the pool did not.
   */
  it('switching matching on asks first, and says what being in the pool means', async () => {
    const calls = stubFetch();
    render(<MatchingPanel session={session} />);
    fireEvent.change(screen.getByLabelText(/Interests I am willing to use/), { target: { value: 'gardening' } });
    fireEvent.click(screen.getByRole('button', { name: 'Switch on matching' }));
    expect(calls.filter((c) => c.method === 'POST').length).toBe(0);
    const dialog = screen.getByRole('alertdialog');
    expect(dialog.textContent).toMatch(/suggested to other people/);
    expect(dialog.textContent).toMatch(/gardening/);
    // The sentence that could only be written once there was a way out.
    expect(dialog.textContent).toMatch(/switch it off again whenever you want/i);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Yes, switch it on' }));
    });
    const post = calls.find((c) => c.method === 'POST') as { body?: Record<string, unknown>; path: string };
    expect(post.path).toBe('/v1/match-preferences');
    expect(post.body?.['confirmed']).toBe(true);
  });

  /**
   * There was no way out. activateMatchPreference inserted a row in
   * state Active and nothing anywhere set that column to anything else,
   * so "Switch on matching" was a one-way door.
   */
  it('matching can be switched off, and says what that does and does not reach', async () => {
    const calls = stubFetch();
    render(<MatchingPanel session={session} />);
    fireEvent.click(screen.getByRole('button', { name: 'Switch off matching' }));
    expect(calls.filter((c) => c.method === 'POST').length).toBe(0);
    const dialog = screen.getByRole('alertdialog');
    expect(dialog.textContent).toMatch(/stop being suggested to anyone/i);
    // Leaving the pool is not leaving the conversations it led to.
    expect(dialog.textContent).toMatch(/Conversations you are already in are not affected/i);
    expect(dialog.textContent).toMatch(/Nobody is told/i);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Yes, switch it off' }));
    });
    const post = calls.find((c) => c.method === 'POST') as { body?: Record<string, unknown>; path: string };
    expect(post.path).toBe('/v1/match-preferences/deactivate');
    expect(post.body?.['confirmed']).toBe(true);
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
    expect(status.textContent).toContain('not notified');
    expect(screen.queryByRole('button', { name: 'Connect' })).toBeNull();
  });

  it('mutual interest surfaces a connection opportunity that still needs its own confirmed step', async () => {
    const calls = stubFetch('ma_1');
    render(<MatchingPanel session={session} />);
    await loadAndChooseInterested(calls);
    expect(screen.getByText('You have both said you are interested')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Connect' }));
    expect(calls.filter((c) => c.path.includes('activate-connection')).length).toBe(0);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Confirm connection' }));
    });
    const conn = calls.find((c) => c.path.includes('activate-connection')) as { body?: Record<string, unknown>; path: string };
    expect(conn.path).toBe('/v1/mutual-acceptances/ma_1/activate-connection');
    expect(conn.body?.['confirmed']).toBe(true);
  });
});
