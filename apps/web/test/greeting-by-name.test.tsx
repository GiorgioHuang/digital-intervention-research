import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { App } from '../src/App.js';

/**
 * "Good morning, Margaret".
 *
 * The name was in `participant_profile.participants.display_name` from
 * M02's first migration and there was no way for its owner to read it, so
 * Home greeted a stranger. What is worth testing is not that a name
 * appears — it is the two ways this can go wrong on the first screen
 * somebody sees: greeting them by an identifier, and putting an error
 * block above their morning because a courtesy failed.
 */
const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });

const stub = (profile: unknown, profileStatus = 200) =>
  vi.stubGlobal(
    'fetch',
    vi.fn(async (path: string) => {
      if (path === '/health') return json({ status: 'ok', authMode: 'dev-header' });
      if (path.endsWith('/profile')) {
        return profileStatus === 200
          ? json(profile)
          : new Response(JSON.stringify({ error: { code: 'NOPE' } }), { status: profileStatus });
      }
      return json({ data: [], meta: {} });
    }),
  );

const arrive = async () => {
  await act(async () => {
    render(<App />);
  });
  fireEvent.change(screen.getByLabelText('Account identifier (actor id)'), { target: { value: 'actor_m' } });
  fireEvent.change(screen.getByLabelText('Participant identifier'), { target: { value: 'pt_margaret' } });
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
  });
};

describe('greeting the person by name', () => {
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('uses the name from the profile', async () => {
    stub({ data: { id: 'pt_margaret', attributes: { participantId: 'pt_margaret', displayName: 'Margaret' } } });
    await arrive();
    // The greeting itself is decided in `greeting.test.ts` at fixed
    // instants; here it only has to be one of the three, with the name.
    expect(screen.getByRole('heading', { name: /^Good (morning|afternoon|evening), Margaret$/ })).toBeTruthy();
  });

  /**
   * A participant with no profile row is a real state during synthetic
   * setup. The greeting stands on its own — it must never fall back to the
   * identifier, which is the nearest string to hand and would address
   * somebody as "pt_margaret" in the largest type on the page.
   */
  it('greets without a name rather than by an identifier', async () => {
    stub({ data: null });
    await arrive();
    const heading = screen.getByRole('heading', { name: /^Good (morning|afternoon|evening)$/ });
    expect(heading.textContent, 'the greeting is addressing somebody by an id').not.toMatch(/pt_|actor_/);
  });

  /**
   * The greeting is a courtesy and the page is not. If the name cannot be
   * read, everything else on Home still has to work — and no error block
   * appears above somebody's morning because a courtesy failed.
   */
  it('survives the profile failing, silently', async () => {
    stub(null, 500);
    await arrive();
    expect(screen.getByRole('heading', { name: /^Good (morning|afternoon|evening)$/ })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Waiting for you' }), 'the page died with the greeting').toBeTruthy();
    expect(
      document.body.textContent,
      'a failed courtesy put an error above the page',
    ).not.toMatch(/could not be reached|something went wrong/i);
  });
});
