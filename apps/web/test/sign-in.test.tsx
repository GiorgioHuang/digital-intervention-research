import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { App } from '../src/App.js';

function stubFetch(status: number, body: unknown) {
  const calls: string[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (path: string) => {
      calls.push(path);
      return new Response(JSON.stringify(body), { status });
    }),
  );
  return calls;
}

const signIn = async (actor: string, participant: string) => {
  fireEvent.change(screen.getByLabelText('Account identifier (actor id)'), { target: { value: actor } });
  fireEvent.change(screen.getByLabelText('Participant identifier'), { target: { value: participant } });
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
  });
};

/**
 * The two identifiers must belong to the same person. Nothing checked
 * that, so an unpaired combination signed in and then every screen came
 * back with a protected-existence 404 that could only say "the identifier
 * may be incorrect" — and there was no control to get back to the form.
 */
describe('participant sign-in', () => {
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('a pair that does not go together is refused at the door, without saying which one is wrong', async () => {
    stubFetch(404, { error: { code: 'RESOURCE_NOT_FOUND', message: 'x', requestId: 'r', retryable: false } });
    await act(async () => {
      render(<App />);
    });
    await signIn('actor_ann', 'pt_ben');

    const alert = screen.getByRole('alert');
    expect(alert.textContent).toContain('do not work together');
    expect(alert.textContent).toContain('Nothing was signed in');
    // Naming the wrong one would answer "does this participant exist"
    // for anyone who asked (ADR-050).
    expect(alert.textContent).not.toContain('pt_ben');
    expect(alert.textContent).not.toContain('actor_ann');
    // Still on the form, not stranded inside a signed-in shell.
    expect(screen.getByLabelText('Participant identifier')).toBeTruthy();
  });

  it('a matching pair signs in', async () => {
    stubFetch(200, { data: [] });
    await act(async () => {
      render(<App />);
    });
    await signIn('actor_ann', 'pt_ann');
    // The greeting, not a fixed greeting. Home's H1 is now "Good morning" /
    // "Good afternoon" / "Good evening", and a test naming one of them
    // would pass all morning and fail after lunch on unchanged code — the
    // shape of D-103 in miniature. Which greeting is correct is decided in
    // `greeting.test.ts` at fixed instants; here it only has to be one of
    // them, which is what proves we are signed in and on Home.
    expect(screen.getByRole('heading', { name: /^Good (morning|afternoon|evening)$/ })).toBeTruthy();
  });

  /**
   * If the check itself fails for an unrelated reason, refusing to sign in
   * would punish someone for a problem that is not theirs.
   */
  it('a check that fails for another reason does not block sign-in', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('fetch failed'); }));
    await act(async () => {
      render(<App />);
    });
    await signIn('actor_ann', 'pt_ann');
    // The greeting, not a fixed greeting. Home's H1 is now "Good morning" /
    // "Good afternoon" / "Good evening", and a test naming one of them
    // would pass all morning and fail after lunch on unchanged code — the
    // shape of D-103 in miniature. Which greeting is correct is decided in
    // `greeting.test.ts` at fixed instants; here it only has to be one of
    // them, which is what proves we are signed in and on Home.
    expect(screen.getByRole('heading', { name: /^Good (morning|afternoon|evening)$/ })).toBeTruthy();
  });

  it('a signed-in person can get back to the form without reloading the page', async () => {
    stubFetch(200, { data: [] });
    await act(async () => {
      render(<App />);
    });
    await signIn('actor_ann', 'pt_ann');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Help and safety' }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Sign out and enter different identifiers' }));
    });
    expect(screen.getByLabelText('Participant identifier')).toBeTruthy();
  });

  /**
   * The participant entrance, on a deployment where the surfaces have
   * their own addresses.
   *
   * A participant used to be shown "Staff workspace" and "Supporter
   * workspace" beside their own way in. Pressing either granted nothing
   * — the permission engine decides every data path on the server — but
   * an older adult opening this for the first time should not be facing
   * two doors that are not theirs.
   *
   * What this test does NOT claim is that staff work is unreachable from
   * here. Both addresses are one deployment behind one shared token and
   * identity is still whatever `x-actor-id` says (ADR-104), so such a
   * claim would be untrue. This is about what a participant is offered.
   */
  it('offers no door into somebody else’s workspace once the addresses are split', async () => {
    vi.stubEnv('VITE_STAFF_HOSTS', 'admin.example.org');
    await act(async () => {
      render(<App />);
    });
    expect(screen.queryByRole('button', { name: 'Staff workspace' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Supporter workspace' })).toBeNull();
    // Their own way in is still there.
    expect(screen.getByRole('button', { name: /Continue/ })).toBeTruthy();
    vi.unstubAllEnvs();
  });

  /**
   * With no addresses configured the app is one entrance with every
   * door, which is what local development runs. Removing them there
   * would leave no way to reach the staff workspace at all.
   */
  it('keeps both doors when one address serves everything', async () => {
    await act(async () => {
      render(<App />);
    });
    expect(screen.getByRole('button', { name: 'Staff workspace' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Supporter workspace' })).toBeTruthy();
  });
});
