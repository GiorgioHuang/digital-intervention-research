import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { StaffGovernancePanel } from '../src/components/StaffGovernancePanel.js';

const session = { actorId: 'actor_admin', authStrength: 'mfa' as const };

function stubFetch(routes: Record<string, unknown>) {
  const calls: { path: string; method: string; body: unknown }[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (path: string, init?: RequestInit) => {
      calls.push({
        path,
        method: init?.method ?? 'GET',
        body: typeof init?.body === 'string' ? JSON.parse(init.body) : undefined,
      });
      const hit = Object.entries(routes).find(([prefix]) => path.startsWith(prefix));
      return new Response(JSON.stringify(hit === undefined ? { data: [] } : hit[1]), { status: 200 });
    }),
  );
  return calls;
}

const record = (executedBy: string) => ({
  '/v1/break-glass/pending-review': {
    data: [
      {
        type: 'BreakGlassRecord',
        id: 'bg_1',
        attributes: {
          breakGlassId: 'bg_1',
          executedByActorId: executedBy,
          reason: 'Participant reported being locked out during a safety call',
          scope: 'consent projection for participant p_9',
          expiresAt: '2026-08-05T18:00:00Z',
          createdAt: '2026-08-05T09:00:00Z',
        },
      },
    ],
  },
});

describe('emergency access', () => {
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  const open = async (routes: Record<string, unknown> = {}) => {
    const calls = stubFetch(routes);
    await act(async () => {
      render(<StaffGovernancePanel session={session} />);
    });
    return calls;
  };

  /**
   * Nothing in the codebase reads break_glass_records — the permission
   * engine never consults it — so recording emergency access grants none.
   * A button that reads like a door would be pressed by someone in a real
   * emergency who then believed they were in.
   */
  it('says it grants no access, before anything else on the screen', async () => {
    await open();
    expect(screen.getByText(/This does not give you access/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Record this' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /get .*access|grant .*access|unlock/i })).toBeNull();
  });

  /** The record carries an expiry and nothing acts on it. */
  it('does not let the expiry read as an automatic cut-off', async () => {
    await open();
    expect(screen.getByText(/Nothing switches off at that time/)).toBeTruthy();
  });

  it('will not record an empty declaration — reason, scope and expiry are the whole point', async () => {
    await open();
    const button = screen.getByRole('button', { name: 'Record this' }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    await act(async () => {
      fireEvent.change(screen.getByLabelText(/Why — what happened/), { target: { value: 'locked out' } });
      fireEvent.change(screen.getByLabelText(/What you reached/), { target: { value: 'consent projection' } });
    });
    expect((screen.getByRole('button', { name: 'Record this' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('records what was typed, and says what recording does before it happens', async () => {
    const calls = await open();
    await act(async () => {
      fireEvent.change(screen.getByLabelText(/Why — what happened/), { target: { value: 'safety call' } });
      fireEvent.change(screen.getByLabelText(/What you reached/), { target: { value: 'consent for p_9' } });
      fireEvent.change(screen.getByLabelText(/When you expect to be finished/), {
        target: { value: '2026-08-05T18:00' },
      });
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Record this' }));
    });
    expect(screen.getByText(/grants no access and cancels nothing/)).toBeTruthy();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    });
    const posted = calls.find((c) => c.method === 'POST' && c.path.endsWith('/v1/break-glass'));
    expect(posted?.body).toMatchObject({ reason: 'safety call', scope: 'consent for p_9', confirmed: true });
  });

  it('shows what is waiting to be reviewed, with what was reached and by whom', async () => {
    await open(record('actor_other'));
    expect(screen.getByText(/consent projection for participant p_9/)).toBeTruthy();
    expect(screen.getByText('actor_other')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'It was justified' })).toBeTruthy();
  });

  /** The rule is not "you drafted it" — it is "this review is about you". */
  it('the person who recorded it cannot review it, and the row says why', async () => {
    await open(record('actor_admin'));
    expect(screen.getByText(/You recorded this/)).toBeTruthy();
    for (const label of ['It was justified', 'It was not justified', 'It needs following up']) {
      expect((screen.getByRole('button', { name: label }) as HTMLButtonElement).disabled).toBe(true);
    }
  });

  it('reviewing does not claim to undo or close anything', async () => {
    const calls = await open(record('actor_other'));
    expect(screen.getByText(/Reviewing does not undo anything and does not close any access/)).toBeTruthy();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'It was not justified' }));
    });
    expect(screen.getAllByText(/This does not undo it/).length).toBeGreaterThan(0);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    });
    const posted = calls.find((c) => c.method === 'POST' && c.path.includes('/review'));
    expect(posted?.body).toMatchObject({ outcome: 'Not Justified', confirmed: true });
  });

  /**
   * A hold that freezes nothing would make whoever placed it stop looking
   * for another way to stop the thing.
   */
  it('offers no governance hold, and says why it is missing rather than leaving a gap', async () => {
    await open();
    expect(screen.queryByRole('button', { name: /hold/i })).toBeNull();
    expect(screen.getByText(/a hold placed today would stop nothing/i)).toBeTruthy();
  });
});
