import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { WhoHasAccess } from '../src/components/WhoHasAccess.js';

const session = { actorId: 'actor_a', participantId: 'pt_a' };

const rel = (over: Record<string, unknown> = {}) => ({
  id: 'rel_1',
  attributes: {
    relationshipId: 'rel_1',
    relatedActorId: 'ua_sam',
    relatedDisplayName: 'Sam Okafor',
    relationshipType: 'FamilyMember',
    // The state every relationship is actually created in.
    relationshipState: 'PendingVerification',
    permittedActions: ['participant.view-shared'],
    expiresAt: null,
    recordVersion: 3,
    proposedAt: '2026-08-01T00:00:00Z',
    ...over,
  },
});

function stubFetch(body: unknown) {
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
      return new Response(JSON.stringify(method === 'GET' ? body : { data: { id: 'rel_1' } }), { status: 200 });
    }),
  );
  return calls;
}

/**
 * Approving and revoking a relationship have always been owner-only, and
 * nothing listed relationships — so a proposal sat waiting on an approval
 * the participant could not see they had been asked for, and an active
 * one could not be ended by the only person entitled to end it.
 */
describe('who has access to me', () => {
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('names the person and says in plain words what the access would allow', async () => {
    const calls = stubFetch({ data: [rel()] });
    await act(async () => {
      render(<WhoHasAccess session={session} />);
    });
    expect(calls[0]?.path).toBe('/v1/participants/pt_a/relationships');
    expect(screen.getByText('Sam Okafor')).toBeTruthy();
    // The dotted action key never reaches the participant.
    expect(screen.queryByText('participant.view-shared')).toBeNull();
    // The permission is recorded and nothing acts on it, so the screen
    // says that rather than describing access the participant does not
    // have and could not revoke (D-39).
    expect(screen.getByText(/nothing on this platform acts on it/)).toBeTruthy();
    expect(screen.getByText(/no way here to share something with a supporter yet/)).toBeTruthy();
    // No claim that anyone is checking their details: nothing does.
    expect(screen.getByText(/Waiting for you to decide\./)).toBeTruthy();
    expect(screen.queryByText(/still being checked/)).toBeNull();
    // Relationship and consent are separate gates and the screen says so.
    expect(screen.getAllByText(/does not change your consent choices/).length).toBeGreaterThan(0);
  });

  /**
   * A relationship's permitted actions are stored on the row and were
   * written with no validation, then printed here under "What this would
   * let them do" — falling through to the raw string when no wording
   * matched. So the participant could be asked to approve a list the
   * platform had never heard of, in whatever words the proposer chose.
   * The write refuses those now; a row already carrying one says what it
   * is rather than dressing itself up as access.
   */
  it('an access the platform does not recognise says so, rather than reading as a capability', async () => {
    stubFetch({ data: [rel({ permittedActions: ['read your medical records'] })] });
    await act(async () => {
      render(<WhoHasAccess session={session} />);
    });
    expect(screen.getByText(/which this platform does not recognise/)).toBeTruthy();
    expect(screen.getByText(/It grants nothing/)).toBeTruthy();
    // The phrase is still shown, because hiding what is on the record
    // would leave the participant unable to ask about it — but it is
    // never shown as a thing this grants.
    expect(document.body.textContent).toContain('read your medical records');
  });

  it('approving is version-bound and confirmed', async () => {
    const calls = stubFetch({ data: [rel()] });
    await act(async () => {
      render(<WhoHasAccess session={session} />);
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Decide about this' }));
    });
    expect(screen.getByText(/Nothing has been given yet/)).toBeTruthy();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Yes, give this access' }));
    });
    const post = calls.find((c) => c.method === 'POST');
    expect(post?.path).toBe('/v1/relationships/rel_1/approve');
    expect(post?.body['expectedVersion']).toBe(3);
    expect(post?.body['confirmed']).toBe(true);
  });

  it('refusing a proposal and ending live access both revoke, and neither claims to unsee anything', async () => {
    const calls = stubFetch({ data: [rel({ relationshipState: 'Active' })] });
    await act(async () => {
      render(<WhoHasAccess session={session} />);
    });
    expect(screen.getByText(/Has access now/)).toBeTruthy();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: "End this person's access" }));
    });
    expect(screen.getByText(/ending access cannot unsee it/)).toBeTruthy();
    expect(screen.getByText(/You do not have to give a reason/)).toBeTruthy();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Yes, end it' }));
    });
    const post = calls.find((c) => c.method === 'POST');
    expect(post?.path).toBe('/v1/relationships/rel_1/revoke');
    expect(post?.body['expectedVersion']).toBe(3);
  });

  it('keeps ended access in the list, with no control to act on it', async () => {
    stubFetch({ data: [rel({ relationshipState: 'Revoked' })] });
    await act(async () => {
      render(<WhoHasAccess session={session} />);
    });
    expect(screen.getByText(/You ended this\. It gives no access/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: "End this person's access" })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Decide about this' })).toBeNull();
  });

  it('says plainly when nobody has access, rather than showing an empty area', async () => {
    stubFetch({ data: [] });
    await act(async () => {
      render(<WhoHasAccess session={session} />);
    });
    expect(screen.getByText('Nobody has access to your information')).toBeTruthy();
  });

  it('falls back to the identifier rather than inventing a name', async () => {
    stubFetch({ data: [rel({ relatedDisplayName: null })] });
    await act(async () => {
      render(<WhoHasAccess session={session} />);
    });
    expect(screen.getByRole('heading', { name: 'ua_sam' })).toBeTruthy();
  });
});
