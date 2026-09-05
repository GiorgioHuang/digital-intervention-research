import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { WhatOthersCallMe } from '../src/components/elder/WhatOthersCallMe.js';

const session = { actorId: 'actor_a', participantId: 'pt_a' };

function stub(existing: { chosenName: string; city: string | null } | null) {
  const calls: { path: string; method: string; body: Record<string, unknown> | undefined }[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (path: string, init?: RequestInit) => {
      calls.push({
        path,
        method: init?.method ?? 'GET',
        body: typeof init?.body === 'string' ? (JSON.parse(init.body) as Record<string, unknown>) : undefined,
      });
      if ((init?.method ?? 'GET') === 'GET') {
        return new Response(
          JSON.stringify({
            data: existing === null ? null : { type: 'PublicProfile', id: 'pt_a', attributes: existing },
          }),
          { status: 200 },
        );
      }
      return new Response(JSON.stringify({ data: { type: 'PublicProfile', id: 'pt_a' } }), { status: 200 });
    }),
  );
  return calls;
}

const arrive = async (props: Partial<Parameters<typeof WhatOthersCallMe>[0]> = {}) => {
  await act(async () => {
    render(
      <WhatOthersCallMe
        session={session}
        onRecord="Margaret Fraser"
        firstTime
        onDone={() => undefined}
        {...props}
      />,
    );
  });
};

describe('what other people call me', () => {
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  /**
   * The whole point of the screen: two names, and a sentence on each
   * saying who sees it. Somebody signing in with Google had the name from
   * their Google account become the name every other participant saw,
   * without ever being asked.
   */
  it('says which name other people see and which one stays with the study office', async () => {
    stub(null);
    await arrive();
    expect(screen.getByText(/the only name other people ever see/)).toBeTruthy();
    expect(screen.getByText(/Only the study office sees this/)).toBeTruthy();
    expect(screen.getByText('Margaret Fraser')).toBeTruthy();
  });

  /**
   * The name on the research record is shown, not editable. Rewriting it
   * is a change to research data and a first-run screen is not where that
   * should happen unreviewed (B-33) — so it must not look like a box
   * somebody can type in and find their typing lost.
   */
  it('does not offer to edit the research record', async () => {
    stub(null);
    await arrive();
    const inputs = [...document.querySelectorAll('input')].map((i) => i.id);
    expect(inputs).toEqual(['call-me-name', 'call-me-city']);
  });

  it('sends the chosen name and the city, and treats a blank city as not said', async () => {
    const calls = stub(null);
    await arrive();
    fireEvent.change(screen.getByLabelText(/What would you like to be called/), { target: { value: 'Margaret' } });
    fireEvent.change(screen.getByLabelText(/Your city or town/), { target: { value: '   ' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    });
    const post = calls.find((c) => c.method === 'POST');
    expect(post?.path).toBe('/v1/participants/pt_a/public-profile');
    expect(post?.body).toEqual({ chosenName: 'Margaret', city: null });
  });

  /** A name is the one thing the screen cannot do without. */
  it('will not continue with no name at all', async () => {
    stub(null);
    await arrive();
    expect((screen.getByRole('button', { name: 'Continue' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(screen.getByLabelText(/What would you like to be called/), { target: { value: '  ' } });
    expect((screen.getByRole('button', { name: 'Continue' }) as HTMLButtonElement).disabled).toBe(true);
  });

  /**
   * Choosing nothing is a real answer under the ruling, so the screen has
   * to be passable — and it has to say what it costs, in the words the
   * other person would actually see, rather than quietly letting somebody
   * past.
   */
  it('lets somebody past without a name, and says what other people will see', async () => {
    stub(null);
    let done = false;
    await arrive({ onDone: () => (done = true) });
    const skip = screen.getByRole('button', { name: /Not now/ });
    expect(skip.textContent).toContain('a community member');
    fireEvent.click(skip);
    expect(done).toBe(true);
  });

  it('comes back with what was already chosen, and can change it', async () => {
    const calls = stub({ chosenName: 'Maggie', city: 'Halifax' });
    await arrive({ firstTime: false });
    expect((screen.getByLabelText(/What would you like to be called/) as HTMLInputElement).value).toBe('Maggie');
    expect((screen.getByLabelText(/Your city or town/) as HTMLInputElement).value).toBe('Halifax');
    fireEvent.change(screen.getByLabelText(/What would you like to be called/), { target: { value: 'Margaret' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save this' }));
    });
    expect(calls.find((c) => c.method === 'POST')?.body).toEqual({ chosenName: 'Margaret', city: 'Halifax' });
  });

  /**
   * Taking a name down asks first, and what it says has to be true on
   * both counts: other people go back to the placeholder, and what was
   * already shared is not deleted by this.
   */
  it('asks before taking a name down, and does not send anything until it is answered', async () => {
    const calls = stub({ chosenName: 'Maggie', city: null });
    await arrive({ firstTime: false });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Take my name down' }));
    });
    expect(screen.getByText(/see you as .a community member./)).toBeTruthy();
    expect(screen.getByText(/Nothing you have already shared is deleted/)).toBeTruthy();
    expect(calls.some((c) => c.method === 'POST')).toBe(false);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Yes, take it down' }));
    });
    expect(calls.find((c) => c.method === 'POST')?.path).toBe('/v1/participants/pt_a/public-profile/withdraw');
  });

  /** There is nothing to take down before anything was chosen. */
  it('offers no way to take down a name that was never chosen', async () => {
    stub(null);
    await arrive({ firstTime: false });
    expect(screen.queryByRole('button', { name: 'Take my name down' })).toBeNull();
  });
});
