import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { ConsentPanel } from '../src/components/ConsentPanel.js';

const session = { actorId: 'actor_test', participantId: 'pt_test' };

function stubFetch() {
  const calls: { path: string; body: Record<string, unknown> }[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (path: string, init: RequestInit) => {
      calls.push({ path, body: JSON.parse(init.body as string) as Record<string, unknown> });
      return new Response(JSON.stringify({ data: { id: 'cs_1' } }), { status: 200 });
    }),
  );
  return calls;
}

describe('ConsentPanel (Doc 20 consent UX rules)', () => {
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('offers no preselected choices: grant and decline are equal-weight buttons per scope', () => {
    stubFetch();
    render(<ConsentPanel session={session} />);
    // Nothing is preselected — no checkboxes/radios at all, only explicit actions.
    expect(document.querySelectorAll('input').length).toBe(0);
    const grantButtons = screen.getAllByRole('button', { name: /^Grant "/ });
    const declineButtons = screen.getAllByRole('button', { name: /^Decline "/ });
    expect(grantButtons.length).toBe(4);
    expect(declineButtons.length).toBe(grantButtons.length);
  });

  it('decline is recorded as an explicit decision, not silence', async () => {
    const calls = stubFetch();
    render(<ConsentPanel session={session} />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Decline "Open matching"' }));
    });
    expect(calls.length).toBe(1);
    expect(calls[0]?.body['decision']).toBe('Declined');
    expect(calls[0]?.body['scope']).toBe('open-matching');
  });

  it('withdrawal requires an explicit confirmation step and can be backed out of', async () => {
    const calls = stubFetch();
    render(<ConsentPanel session={session} />);
    fireEvent.click(screen.getByRole('button', { name: 'Withdraw consent for "Take part in the research"' }));
    // A consequence summary is shown before anything happens.
    const dialog = screen.getByRole('alertdialog');
    expect(dialog.textContent).toContain('locked');
    expect(calls.length).toBe(0);
    // Backing out makes no API call.
    fireEvent.click(screen.getByRole('button', { name: 'Go back without withdrawing' }));
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(calls.length).toBe(0);
    // Confirming actually withdraws.
    fireEvent.click(screen.getByRole('button', { name: 'Withdraw consent for "Take part in the research"' }));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Confirm withdrawal of "Take part in the research"' }));
    });
    expect(calls.length).toBe(1);
    expect(calls[0]?.path).toContain('/consents/withdraw');
    expect(calls[0]?.body['confirmed']).toBe(true);
  });
});
