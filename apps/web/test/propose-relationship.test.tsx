import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { ProposeRelationship } from '../src/components/ProposeRelationship.js';

const session = { actorId: 'actor_coord', authStrength: 'password' as const };

/**
 * POST /v1/relationships had no caller anywhere in the product, so the
 * whole supporter path could only be started by whoever could call the
 * API. In the demo it existed because the seed made it.
 */
function stubFetch() {
  const calls: { path: string; method: string; body: Record<string, unknown> | undefined }[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (path: string, init?: RequestInit) => {
      calls.push({
        path,
        method: init?.method ?? 'GET',
        body: typeof init?.body === 'string' ? (JSON.parse(init.body) as Record<string, unknown>) : undefined,
      });
      return new Response(JSON.stringify({ data: { id: 'rel_1' } }), { status: 201 });
    }),
  );
  return calls;
}

describe('proposing a supporter', () => {
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  /**
   * A coordinator who believes proposing granted access would tell a
   * family member they have it.
   */
  it('says proposing grants nothing, before the form', () => {
    stubFetch();
    render(<ProposeRelationship session={session} />);
    expect(screen.getByText(/Proposing does not grant anything/)).toBeTruthy();
    expect(screen.getByText(/Do not tell them they have access/)).toBeTruthy();
  });

  /**
   * Exactly two actions are relationship-gated in the whole platform.
   * Offering more would record permissions nothing reads.
   */
  it('offers only what a relationship actually gates, and says why the list is short', () => {
    stubFetch();
    render(<ProposeRelationship session={session} />);
    expect(screen.getByLabelText('See what the participant chooses to share')).toBeTruthy();
    expect(screen.getByLabelText('Offer additions to their life story')).toBeTruthy();
    expect(screen.getByText(/These are the only ones/)).toBeTruthy();
    expect(screen.getByText(/would record permissions that nothing reads/)).toBeTruthy();
  });

  /**
   * Its own permission, not a consequence of being able to see things:
   * a participant who wanted a niece to read their life story and nothing
   * more would otherwise have granted her a channel into their inbox by
   * accident (D-29).
   */
  it('messaging is a separate permission, and says the participant starts it', () => {
    stubFetch();
    render(<ProposeRelationship session={session} />);
    expect(screen.getByLabelText('Write to the participant, and read what they write back')).toBeTruthy();
    expect(screen.getByText(/not the same as being allowed into their inbox/)).toBeTruthy();
    expect(screen.getByText(/a supporter cannot start one/)).toBeTruthy();
  });

  /** Each permission says what it still depends on. */
  it('says each permission also needs the participant to have consented', () => {
    stubFetch();
    render(<ProposeRelationship session={session} />);
    expect(screen.getByText(/Also needs supporter-contribution consent/)).toBeTruthy();
    expect(screen.getByText(/the participant decides what is accepted/)).toBeTruthy();
  });

  /**
   * `participant.view-shared` is read by no code anywhere: no query is
   * gated on it, no screen would show it, and a participant has no way to
   * mark anything as shared. It was ticked by default, so the shortest
   * path through this screen recorded an access right that does not
   * exist — and the participant then approved it believing they had
   * shared their information (D-39).
   */
  it('says the sharing permission does nothing, and does not tick it by default', async () => {
    stubFetch();
    render(<ProposeRelationship session={session} />);
    const box = screen.getByLabelText('See what the participant chooses to share') as HTMLInputElement;
    expect(box.checked).toBe(false);
    expect(screen.getByText(/NOT IN USE/)).toBeTruthy();
    expect(screen.getByText(/grants no access at all/)).toBeTruthy();

    // Choosing only that one is called out where the choice is made.
    fireEvent.change(screen.getByLabelText('Participant identifier'), { target: { value: 'pt_a' } });
    fireEvent.change(screen.getByLabelText("The supporter's account identifier"), { target: { value: 'actor_s' } });
    await act(async () => {
      fireEvent.click(box);
    });
    expect(screen.getByText(/Everything you have chosen is a permission nothing acts on/)).toBeTruthy();
  });

  it('will not propose a relationship that permits nothing', async () => {
    stubFetch();
    render(<ProposeRelationship session={session} />);
    fireEvent.change(screen.getByLabelText('Participant identifier'), { target: { value: 'pt_a' } });
    fireEvent.change(screen.getByLabelText("The supporter's account identifier"), { target: { value: 'actor_s' } });
    // Nothing is ticked to begin with, so this is already the empty case.
    expect(screen.getByRole('button', { name: 'Propose this relationship' })).toHaveProperty('disabled', true);
    expect(screen.getByText(/would be a record with no effect/)).toBeTruthy();
  });

  it('proposes with the type and the chosen permissions, and says it is not yet in force', async () => {
    const calls = stubFetch();
    render(<ProposeRelationship session={session} />);
    fireEvent.change(screen.getByLabelText('Participant identifier'), { target: { value: 'pt_a' } });
    fireEvent.change(screen.getByLabelText("The supporter's account identifier"), { target: { value: 'actor_s' } });
    fireEvent.change(screen.getByLabelText('How they are related'), { target: { value: 'FamilyMember' } });
    await act(async () => {
      fireEvent.click(screen.getByLabelText('Offer additions to their life story'));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Propose this relationship' }));
    });
    const posted = calls.find((c) => c.method === 'POST');
    expect(posted?.path).toBe('/v1/relationships');
    expect(posted?.body).toMatchObject({
      participantId: 'pt_a',
      relatedActorId: 'actor_s',
      relationshipType: 'FamilyMember',
      permittedActions: ['life-story.contribute'],
    });
    expect(screen.getByText(/waits for the participant to approve it/)).toBeTruthy();
  });
});
