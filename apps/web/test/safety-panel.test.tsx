import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { SafetyPanel } from '../src/components/SafetyPanel.js';

const session = { actorId: 'actor_test', participantId: 'pt_test' };

function stubFetch() {
  const calls: { path: string; body: Record<string, unknown> }[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (path: string, init: RequestInit) => {
      calls.push({ path, body: JSON.parse(init.body as string) as Record<string, unknown> });
      return new Response(JSON.stringify({ data: { id: 'x_1', meta: { moderationCaseId: 'mc_1' } } }), { status: 201 });
    }),
  );
  return calls;
}

describe('SafetyPanel (block & report, Doc 20 / ADR-037/038)', () => {
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('report goes to human review and the UI says so; submission posts category and description', async () => {
    const calls = stubFetch();
    render(<SafetyPanel session={session} />);
    expect(screen.getByText(/no automated system decides them on its own/)).toBeTruthy();
    // A report survives a later block (ADR-038) — the UI states this.
    expect(screen.getByText(/your report is still handled/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText("The other person's identifier"), { target: { value: 'actor_bad' } });
    fireEvent.change(screen.getByLabelText(/What happened/), { target: { value: 'They sent me harassing messages' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Submit report' }));
    });
    expect(calls.length).toBe(1);
    expect(calls[0]?.path).toBe('/v1/reports');
    expect(calls[0]?.body['reportedActorId']).toBe('actor_bad');
    expect(calls[0]?.body['category']).toBe('harassment');
  });

  it('block requires explicit confirmation and can be backed out of without any API call', async () => {
    const calls = stubFetch();
    render(<SafetyPanel session={session} />);
    fireEvent.change(screen.getByLabelText('Identifier of the person to block'), { target: { value: 'actor_bad' } });
    fireEvent.click(screen.getByRole('button', { name: 'Block this person' }));
    expect(screen.getByRole('alertdialog')).toBeTruthy();
    expect(calls.length).toBe(0);
    fireEvent.click(screen.getByRole('button', { name: 'Go back without blocking' }));
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(calls.length).toBe(0);
    fireEvent.click(screen.getByRole('button', { name: 'Block this person' }));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Confirm block' }));
    });
    expect(calls.length).toBe(1);
    expect(calls[0]?.path).toBe('/v1/blocks');
    expect(calls[0]?.body['confirmed']).toBe(true);
  });

  it('safety concern raises a participant-sourced SafetySignal and shows the emergency disclaimer', async () => {
    const calls = stubFetch();
    render(<SafetyPanel session={session} />);
    expect(screen.getByText(/not an emergency service/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Your safety concern'), { target: { value: 'I have been feeling unsafe recently' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Submit safety concern' }));
    });
    expect(calls[0]?.path).toBe('/v1/safety-signals');
    expect(calls[0]?.body['sourceType']).toBe('Participant');
  });
});
