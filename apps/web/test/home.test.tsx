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
    expect(screen.getByText(/when it is done, it is done/)).toBeTruthy();
  });

  /**
   * A caveat this file has to carry, because it cannot test around it.
   *
   * jsdom does not implement `<details>`: everything inside a closed one is
   * still visible to `getByRole`, so no assertion here can tell "folded but
   * reachable" from "folded and unreachable". A test that merely finds the
   * buttons would pass either way and prove nothing about what a browser
   * shows.
   *
   * So these assert the *structure* that decides the browser's behaviour —
   * a `<details>` with a `<summary>` naming it, and the buttons inside that
   * same element — rather than visibility, which is not observable here.
   */
  const disclosure = (name: string): HTMLDetailsElement => {
    const summary = [...document.querySelectorAll('main details > summary')].find(
      (el) => el.textContent?.trim() === name,
    );
    expect(summary, `no <details> on the home page is named "${name}"`).toBeTruthy();
    return summary!.parentElement as HTMLDetailsElement;
  };

  it('folds the groups away, and keeps the privacy three together inside one', async () => {
    stubFetch();
    await act(async () => {
      render(<App />);
    });
    await signIn();

    const privacy = disclosure('Your information and who can see it');
    expect(privacy.hasAttribute('open'), 'the privacy group is open on arrival').toBe(false);
    // Consent says what may be done, access says by whom, a copy is what
    // you may take away — the three answer one question together, and
    // folding them must not scatter them.
    expect(within(privacy).getByRole('button', { name: 'Review or change my consent choices' })).toBeTruthy();
    expect(within(privacy).getByRole('button', { name: 'See who has access to me' })).toBeTruthy();
    expect(within(privacy).getByRole('button', { name: 'Ask for a copy of my information' })).toBeTruthy();

    const anytime = disclosure('Things you can do any time');
    expect(anytime.hasAttribute('open'), 'the any-time group is open on arrival').toBe(false);
    expect(within(anytime).getByRole('button', { name: 'Write or read my life story' })).toBeTruthy();
    // Optional things are named as optional where they are offered.
    expect(within(anytime).getByRole('button', { name: 'Visit the community (optional)' })).toBeTruthy();
  });

  /**
   * Folding is not removing. D-87 ruled this on the staff side and it holds
   * harder here: an older participant who has been told a right exists must
   * still be able to reach it, and "we tidied it away" is not an answer.
   */
  it('still offers every destination it offered before', async () => {
    stubFetch();
    await act(async () => {
      render(<App />);
    });
    await signIn();
    for (const name of [
      'Review or change my consent choices',
      'See who has access to me',
      'Ask for a copy of my information',
      'Write to someone you are connected with',
      'Write or read my life story',
      'Meet new people (optional)',
      'Visit the community (optional)',
      'Get help or report a problem',
    ]) {
      expect(screen.getByRole('button', { name }), `${name} is no longer offered`).toBeTruthy();
    }
  });

  /**
   * The decision is the page. Everything else is one line until asked for,
   * and that ordering is the whole change — a task presented after eight
   * things that need nothing is a task competing with them.
   */
  it('puts what is waiting above everything that is merely available', async () => {
    stubFetch();
    await act(async () => {
      render(<App />);
    });
    await signIn();
    const waiting = screen.getByRole('heading', { name: 'Waiting for you' });
    // Named rather than "the first <details> in main": the assisted-mode
    // disclosure sits above the h1 and would satisfy a positional test
    // while proving nothing about the groups. The first version of this
    // assertion did exactly that and passed for the wrong reason.
    for (const name of [
      'Your information and who can see it',
      'Things you can do any time',
      'Your part in the research',
    ]) {
      expect(
        waiting.compareDocumentPosition(disclosure(name)) & Node.DOCUMENT_POSITION_FOLLOWING,
        `"${name}" comes before what is waiting for you`,
      ).toBeTruthy();
    }
  });

  /**
   * Help does not fold. It duplicates the bottom bar, which is the exact
   * redundancy removed everywhere else here — kept because the cost of the
   * duplication is one line and the cost of being wrong is somebody in
   * difficulty having to open a disclosure first.
   */
  it('leaves help in the open', async () => {
    stubFetch();
    await act(async () => {
      render(<App />);
    });
    await signIn();
    const help = screen.getByRole('button', { name: 'Get help or report a problem' });
    expect(help.closest('details'), 'help was folded away').toBeNull();
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
