import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { ConsentPanel } from '../src/components/ConsentPanel.js';

const session = { actorId: 'actor_test', participantId: 'pt_test' };

const CURRENT = {
  data: [
    {
      id: 'open-matching',
      attributes: {
        scope: 'open-matching', decision: 'Withdrawn', decidedAt: '2026-07-30T00:00:00Z',
        templateVersion: 'ct_v1', restrictions: [], expiresAt: null,
      },
    },
    {
      id: 'study-participation',
      attributes: {
        scope: 'study-participation', decision: 'Granted', decidedAt: '2026-07-28T00:00:00Z',
        templateVersion: 'ct_v1', restrictions: [], expiresAt: null,
      },
    },
  ],
};

/** GETs carry no body; only the commands do. */
function stubFetch(current: unknown = CURRENT) {
  const calls: { path: string; method: string; body: Record<string, unknown> }[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (path: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET';
      if (method === 'GET') {
        calls.push({ path, method, body: {} });
        return new Response(JSON.stringify(current), { status: 200 });
      }
      calls.push({ path, method, body: JSON.parse(init!.body as string) as Record<string, unknown> });
      return new Response(JSON.stringify({ data: { id: 'cs_1' } }), { status: 200 });
    }),
  );
  return calls;
}
const commands = (calls: { method: string }[]) => calls.filter((c) => c.method !== 'GET');

describe('ConsentPanel (Doc 20 consent UX rules)', () => {
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('offers no preselected choices: grant and decline are equal-weight buttons per scope', async () => {
    stubFetch();
    await act(async () => {
      render(<ConsentPanel session={session} />);
    });
    // Nothing is preselected — no checkboxes/radios at all, only explicit actions.
    expect(document.querySelectorAll('input').length).toBe(0);
    const grantButtons = screen.getAllByRole('button', { name: /^Grant "/ });
    const declineButtons = screen.getAllByRole('button', { name: /^Decline "/ });
    // Every scope the platform actually enforces is offered — including
    // the two that govern what a supporter may see and do, which the
    // screen previously omitted while the server gated on them.
    expect(grantButtons.length).toBe(6);
    expect(declineButtons.length).toBe(grantButtons.length);
  });

  it('decline is recorded as an explicit decision, not silence', async () => {
    const calls = stubFetch();
    await act(async () => {
      render(<ConsentPanel session={session} />);
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Decline "Open matching"' }));
    });
    const posted = commands(calls);
    expect(posted.length).toBe(1);
    expect(posted[0]?.body['decision']).toBe('Declined');
    expect(posted[0]?.body['scope']).toBe('open-matching');
  });

  /**
   * The screen used to show only the result of a button pressed in this
   * session, so someone returning to it saw nothing and could not tell
   * what they had agreed to. The standing position now comes from the
   * server — and from the same projection the permission engine reads, so
   * the screen cannot claim one thing while the server enforces another.
   */
  it('shows the current position from the server on arrival, before anything is pressed', async () => {
    const calls = stubFetch();
    await act(async () => {
      render(<ConsentPanel session={session} />);
    });
    expect(calls[0]?.path).toBe('/v1/participants/pt_test/consents');
    expect(calls[0]?.method).toBe('GET');
    expect(commands(calls).length).toBe(0);

    const body = document.body.textContent ?? '';
    expect(body).toContain('Withdrawn');
    expect(body).toContain('Granted');
    // A scope with no decision says so rather than looking like a refusal.
    expect(body).toContain('Not decided yet');
    // The consent text version the decision was made under is shown.
    expect(body).toContain('ct_v1');
  });

  it('re-reads the server after a decision instead of assuming it landed', async () => {
    const calls = stubFetch();
    await act(async () => {
      render(<ConsentPanel session={session} />);
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Grant "Messaging"' }));
    });
    const gets = calls.filter((c) => c.method === 'GET');
    expect(gets.length).toBe(2);
  });

  it('each choice states what it actually controls', async () => {
    stubFetch();
    await act(async () => {
      render(<ConsentPanel session={session} />);
    });
    const body = document.body.textContent ?? '';
    expect(body).toContain('What this controls:');
    // The supporter scopes describe the access they gate, in those terms.
    expect(body).toContain('What an approved supporter can read');
    expect(body).toContain('Whether a supporter may add a contribution');
  });

  it('withdrawal requires an explicit confirmation step and can be backed out of', async () => {
    const calls = stubFetch();
    await act(async () => {
      render(<ConsentPanel session={session} />);
    });
    fireEvent.click(screen.getByRole('button', { name: 'Withdraw consent for "Take part in the research"' }));
    // A consequence summary is shown before anything happens.
    const dialog = screen.getByRole('alertdialog');
    expect(dialog.textContent).toContain('locked');
    expect(commands(calls).length).toBe(0);
    // Backing out makes no API call.
    fireEvent.click(screen.getByRole('button', { name: 'Go back without withdrawing' }));
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(commands(calls).length).toBe(0);
    // Confirming actually withdraws.
    fireEvent.click(screen.getByRole('button', { name: 'Withdraw consent for "Take part in the research"' }));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Confirm withdrawal of "Take part in the research"' }));
    });
    const posted = commands(calls);
    expect(posted.length).toBe(1);
    expect(posted[0]?.path).toContain('/consents/withdraw');
    expect(posted[0]?.body['confirmed']).toBe(true);
  });
});
