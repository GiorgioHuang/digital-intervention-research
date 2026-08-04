import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { MyResearchPart } from '../src/components/MyResearchPart.js';

const session = { actorId: 'actor_a', participantId: 'pt_a' };

const enrolment = (state: string) => ({
  data: [
    {
      id: 'enr_1',
      attributes: {
        enrolmentId: 'enr_1', researchProjectId: 'rp_1', protocolVersionId: 'pv_1',
        enrolmentState: state, updatedAt: '2026-08-01T00:00:00Z',
      },
    },
  ],
});

function stubFetch(body: unknown) {
  const calls: { path: string; method: string; body: Record<string, unknown> }[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (path: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET';
      calls.push({ path, method, body: method === 'GET' ? {} : (JSON.parse(init!.body as string) as Record<string, unknown>) });
      return new Response(JSON.stringify(method === 'GET' ? body : { data: { id: 'x' } }), { status: 200 });
    }),
  );
  return calls;
}

/**
 * Withdrawal was owner-permitted on the server all along, but nothing in
 * the participant's workspace could reach it — so leaving meant asking the
 * people you are leaving. That is not the same right.
 */
describe('a participant can see where they are and leave', () => {
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('states the stage in plain words and offers a way out', async () => {
    stubFetch(enrolment('Active'));
    await act(async () => {
      render(<MyResearchPart session={session} />);
    });
    expect(screen.getByText(/You are taking part now/)).toBeTruthy();
    expect(screen.getByText(/do not have to give a reason/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Leave this study' })).toBeTruthy();
  });

  it('leaving is confirmed, the reason is optional, and the consequences are stated honestly', async () => {
    const calls = stubFetch(enrolment('Active'));
    await act(async () => {
      render(<MyResearchPart session={session} />);
    });
    fireEvent.click(screen.getByRole('button', { name: 'Leave this study' }));

    const dialog = screen.getByRole('alertdialog');
    // Locked datasets are not rewritten — said plainly rather than implying
    // that leaving erases everything.
    expect(dialog.textContent).toContain('locked for analysis is not removed');
    expect(dialog.textContent).toContain('does not delete them');
    expect(calls.filter((c) => c.method !== 'GET').length).toBe(0);

    // Backing out sends nothing.
    fireEvent.click(screen.getByRole('button', { name: 'Go back without leaving' }));
    expect(calls.filter((c) => c.method !== 'GET').length).toBe(0);

    fireEvent.click(screen.getByRole('button', { name: 'Leave this study' }));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Yes, leave this study' }));
    });
    const post = calls.find((c) => c.method === 'POST');
    expect(post?.path).toBe('/v1/enrolments/enr_1/withdraw');
    expect(post?.body['confirmed']).toBe(true);
    // No reason typed -> none sent. Leaving is not conditional on explaining.
    expect(post?.body['reasonCategory']).toBeUndefined();
  });

  it('someone who has already left is not offered the exit again', async () => {
    stubFetch(enrolment('Withdrawn'));
    await act(async () => {
      render(<MyResearchPart session={session} />);
    });
    expect(screen.getByText(/You have left this study/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Leave this study' })).toBeNull();
  });

  it('no pause control is offered, because nothing in the platform can pause', async () => {
    stubFetch(enrolment('Active'));
    await act(async () => {
      render(<MyResearchPart session={session} />);
    });
    expect(screen.queryByRole('button', { name: /Pause/i })).toBeNull();
  });
});
