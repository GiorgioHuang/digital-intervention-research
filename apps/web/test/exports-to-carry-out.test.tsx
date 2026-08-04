import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { ExportsToCarryOut } from '../src/components/ExportsToCarryOut.js';

const session = { actorId: 'actor_res', authStrength: 'mfa' as const };

const row = (over: Record<string, unknown> = {}) => ({
  type: 'ExportRequest',
  id: 'exr_1',
  attributes: {
    exportRequestId: 'exr_1',
    exportType: 'ParticipantPortability',
    purpose: 'A copy of my own information, requested by me',
    recipient: 'participant-self',
    requestState: 'Approved',
    manifestHash: null,
    updatedAt: '2026-08-04T00:00:00Z',
    ...over,
  },
});

function stubFetch(rows: unknown[]) {
  const calls: { path: string; method: string; body: Record<string, unknown> }[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (path: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET';
      calls.push({
        path,
        method,
        body: method === 'GET' ? {} : (JSON.parse(init!.body as string) as Record<string, unknown>),
      });
      return new Response(JSON.stringify(method === 'GET' ? { data: rows } : { data: { id: 'x' } }), { status: 200 });
    }),
  );
  return calls;
}

/**
 * Approving used to be the end of the road: nothing listed an approved
 * request, so the package was never put together and the delivery never
 * recorded. Someone could be told truthfully that their request was
 * agreed to, and never hear another thing.
 */
describe('exports waiting to be carried out', () => {
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('an agreed export offers the work, and does not claim anything exists yet', async () => {
    const calls = stubFetch([row()]);
    await act(async () => {
      render(<ExportsToCarryOut session={session} />);
    });
    expect(calls[0]?.path).toBe('/v1/export-requests/to-carry-out');
    expect(screen.getByText(/The package has not been put together yet/)).toBeTruthy();
    expect(screen.queryByText(/Manifest hash/)).toBeNull();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Put the package together' }));
    });
    const post = calls.find((c) => c.method === 'POST');
    expect(post?.path).toBe('/v1/export-requests/exr_1/generate');
  });

  it('a generated package is not described as handed over, and the hash is shown', async () => {
    const calls = stubFetch([row({ requestState: 'Generated', manifestHash: 'a'.repeat(64) })]);
    await act(async () => {
      render(<ExportsToCarryOut session={session} />);
    });
    expect(screen.getByText(/Nothing has been handed over/)).toBeTruthy();
    expect(screen.getByText('a'.repeat(64))).toBeTruthy();
    // The platform sends nothing, so the control records what a person
    // did rather than claiming a transfer happened here.
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Record that I handed it over' }));
    });
    const post = calls.find((c) => c.method === 'POST');
    expect(post?.path).toBe('/v1/export-requests/exr_1/delivery');
    expect(post?.body['state']).toBe('Delivered');
    expect(screen.getByRole('status').textContent).toContain('not something this platform did');
  });

  it('handed over is not confirmed received', async () => {
    const calls = stubFetch([row({ requestState: 'Delivered', manifestHash: 'b'.repeat(64) })]);
    await act(async () => {
      render(<ExportsToCarryOut session={session} />);
    });
    expect(screen.getByText(/The recipient has not confirmed it/)).toBeTruthy();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Record that they confirmed receiving it' }));
    });
    expect(calls.find((c) => c.method === 'POST')?.body['state']).toBe('Received');
  });

  it('names a request for someone’s own information as what it is', async () => {
    stubFetch([row()]);
    await act(async () => {
      render(<ExportsToCarryOut session={session} />);
    });
    expect(screen.getByText(/A copy of someone’s own information, for them/)).toBeTruthy();
  });

  it('an empty queue says so rather than looking unloaded', async () => {
    stubFetch([]);
    await act(async () => {
      render(<ExportsToCarryOut session={session} />);
    });
    expect(screen.getByText('Nothing is waiting to be carried out.')).toBeTruthy();
  });
});
