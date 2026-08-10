import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { act } from 'react';
import { StaffApp } from '../src/StaffApp.js';

/**
 * Which organisation the staff workspace opens, and when it asks.
 *
 * The case these exist for is a platform administrator with one
 * organisation. They see it by platform-wide standing, which is exactly
 * the state of holding NO role inside it, so opening it refuses every
 * screen — and the control that fixes that lives on the chooser. Skipping
 * the chooser "because there is only one" put the one person who needed
 * that screen in the one place they could never reach it.
 */
function mockServer(organisations: { organisationId: string; name: string; standing: string }[]): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/health')) {
        return new Response(JSON.stringify({ status: 'ok', authMode: 'google' }), { status: 200 });
      }
      if (url.includes('/v1/auth/session')) {
        return new Response(
          JSON.stringify({ actorId: 'acct_1', displayName: 'Owner', authStrength: 'password', expiresAt: '2030-01-01T00:00:00Z' }),
          { status: 200 },
        );
      }
      if (url.includes('/v1/organisations')) {
        return new Response(
          JSON.stringify({ data: organisations.map((o) => ({ id: o.organisationId, attributes: o })) }),
          { status: 200 },
        );
      }
      return new Response(JSON.stringify({ data: [] }), { status: 200 });
    }),
  );
}

describe('choosing an organisation to work in', () => {
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    sessionStorage.clear();
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  /**
   * The bug this pins. One organisation, seen only because they administer
   * the platform: the chooser must still appear, because it carries the
   * only way to gain standing inside it.
   */
  it('still asks when the only organisation is one they hold no role in', async () => {
    mockServer([{ organisationId: 'org_1', name: 'Test Org', standing: 'platform-administrator' }]);
    await act(async () => {
      render(<StaffApp />);
    });
    expect(screen.getByRole('heading', { name: /choose an organisation/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /make me its administrator/i })).toBeTruthy();
  });

  /** A choice of one IS skipped when they actually hold standing in it. */
  it('opens straight into the only organisation they hold a role in', async () => {
    mockServer([{ organisationId: 'org_1', name: 'Test Org', standing: 'role' }]);
    await act(async () => {
      render(<StaffApp />);
    });
    expect(screen.queryByRole('heading', { name: /choose an organisation/i })).toBeNull();
  });

  it('asks when there is more than one, even where they hold roles', async () => {
    mockServer([
      { organisationId: 'org_1', name: 'One', standing: 'role' },
      { organisationId: 'org_2', name: 'Two', standing: 'membership' },
    ]);
    await act(async () => {
      render(<StaffApp />);
    });
    expect(screen.getByRole('heading', { name: /choose an organisation/i })).toBeTruthy();
    // No repair offered where they already have standing.
    expect(screen.queryByRole('button', { name: /make me its administrator/i })).toBeNull();
  });

  it('offers to create one when they are in none', async () => {
    mockServer([]);
    await act(async () => {
      render(<StaffApp />);
    });
    expect(screen.getByLabelText(/name a new organisation/i)).toBeTruthy();
  });
});
