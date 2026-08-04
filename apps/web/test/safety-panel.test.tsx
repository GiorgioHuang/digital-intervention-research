import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { SafetyPanel } from '../src/components/SafetyPanel.js';

const session = { actorId: 'actor_test', participantId: 'pt_test' };

/**
 * `calls` holds the commands only. The panel now also reads the blocks
 * the participant has placed on mount, and counting that read as an
 * action would make every "no API call was made" assertion meaningless.
 */
function stubFetch(blocks: unknown[] = []) {
  const calls: { path: string; body: Record<string, unknown> }[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (path: string, init?: RequestInit) => {
      if ((init?.method ?? 'GET') === 'GET') {
        return new Response(JSON.stringify({ data: blocks }), { status: 200 });
      }
      calls.push({ path, body: JSON.parse(init!.body as string) as Record<string, unknown> });
      return new Response(JSON.stringify({ data: { id: 'x_1', meta: { moderationCaseId: 'mc_1' } } }), { status: 201 });
    }),
  );
  return calls;
}

const blockRow = {
  id: 'blk_1',
  attributes: {
    blockId: 'blk_1',
    blockedActorId: 'actor_bad',
    blockedDisplayName: 'Sam S.',
    createdAt: '2026-08-01T00:00:00Z',
  },
};

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
    await act(async () => {
      render(<SafetyPanel session={session} />);
    });
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
    await act(async () => {
      render(<SafetyPanel session={session} />);
    });
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
    await act(async () => {
      render(<SafetyPanel session={session} />);
    });
    expect(screen.getByText(/not an emergency service/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Your safety concern'), { target: { value: 'I have been feeling unsafe recently' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Submit safety concern' }));
    });
    expect(calls[0]?.path).toBe('/v1/safety-signals');
    expect(calls[0]?.body['sourceType']).toBe('Participant');
  });

  /**
   * The block confirmation has always said "you can undo it at any time".
   * Nothing listed a block or lifted one, so that was a promise with
   * nothing behind it — you cannot undo what you cannot see.
   */
  it('lists the blocks placed and lifts one, without claiming anything is restored', async () => {
    const calls = stubFetch([blockRow]);
    await act(async () => {
      render(<SafetyPanel session={session} />);
    });
    expect(screen.getByText('Sam S.', { exact: false })).toBeTruthy();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Unblock this person' }));
    });
    expect(screen.getByText(/does not bring back anything you missed/)).toBeTruthy();
    expect(screen.getByText(/have to be given again on their own/)).toBeTruthy();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Yes, unblock' }));
    });
    expect(calls[0]?.path).toBe('/v1/blocks/blk_1/revoke');
    // No blocker is sent: who placed the block is read from the block.
    expect(calls[0]?.body['blockerId']).toBeUndefined();
  });

  it('says plainly when no one is blocked, rather than showing an empty area', async () => {
    stubFetch([]);
    await act(async () => {
      render(<SafetyPanel session={session} />);
    });
    expect(screen.getByText('You have not blocked anyone')).toBeTruthy();
  });
});
