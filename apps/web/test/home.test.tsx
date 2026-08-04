import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { act } from 'react';
import { App } from '../src/App.js';

function stubFetch() {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (_path: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET';
      return new Response(JSON.stringify(method === 'GET' ? { data: [], meta: {} } : { data: { id: 'x' } }), {
        status: 200,
      });
    }),
  );
}

const signIn = async () => {
  fireEvent.change(screen.getByLabelText('Account identifier (actor id)'), { target: { value: 'actor_ann' } });
  fireEvent.change(screen.getByLabelText('Participant identifier'), { target: { value: 'pt_ann' } });
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
  });
};

/**
 * Home is a task list, never a feed. The list reached eight entries as
 * each unreachable right was given a way in, and eight unlabelled buttons
 * is a wall rather than a choice.
 */
describe('participant home', () => {
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('says the page ends, rather than implying it keeps going', async () => {
    stubFetch();
    await act(async () => {
      render(<App />);
    });
    await signIn();
    expect(screen.getByText(/nothing here\s+keeps going on its own/)).toBeTruthy();
  });

  it('groups the actions, and keeps the privacy three together', async () => {
    stubFetch();
    await act(async () => {
      render(<App />);
    });
    await signIn();
    const privacy = screen.getByRole('region', { name: 'Your information and who can see it' });
    // Consent says what may be done, access says by whom, a copy is what
    // you may take away — the three answer one question together.
    expect(within(privacy).getByRole('button', { name: 'Review or change my consent choices' })).toBeTruthy();
    expect(within(privacy).getByRole('button', { name: 'See who has access to me' })).toBeTruthy();
    expect(within(privacy).getByRole('button', { name: 'Ask for a copy of my information' })).toBeTruthy();

    const anytime = screen.getByRole('region', { name: 'Things you can do any time' });
    expect(within(anytime).getByRole('button', { name: 'Write or read my life story' })).toBeTruthy();
    // Optional things are named as optional where they are offered.
    expect(within(anytime).getByRole('button', { name: 'Visit the community (optional)' })).toBeTruthy();
  });

  it('every grouped action opens the screen it names', async () => {
    stubFetch();
    await act(async () => {
      render(<App />);
    });
    await signIn();
    for (const [button, heading] of [
      ['See who has access to me', 'Who has access to me'],
      ['Ask for a copy of my information', 'A copy of my information'],
      ['Write or read my life story', 'My life story'],
    ] as const) {
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Home' }));
      });
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: button }));
      });
      expect(screen.getByRole('heading', { level: 1, name: heading })).toBeTruthy();
    }
  });
});
