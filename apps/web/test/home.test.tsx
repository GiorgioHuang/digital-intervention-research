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

/**
 * Help and safety is for help and safety.
 *
 * Measured: the display-preferences block was 191 words and 15 controls,
 * against the safety panel's 131 and 8 — the biggest thing on the page,
 * on the page somebody reaches when they are in difficulty. Two people
 * were being failed at once: one waded through text-size settings to reach
 * what they came for, and the other had to guess that "make the text
 * bigger" lived under "Help and safety".
 *
 * Folding answers the first. The summary answers the second, and is why
 * this is not simply hiding: it names what is inside in the words somebody
 * would use looking for it, which the heading underneath does not.
 */
describe('the help screen', () => {
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  const openHelp = async () => {
    stubFetch();
    await act(async () => {
      render(<App />);
    });
    await signIn();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Help and safety' }));
    });
  };

  it('leads with safety, and folds the display settings behind a plain label', async () => {
    await openHelp();
    // What the page is for stays open.
    expect(screen.getByRole('button', { name: /Report/i })).toBeTruthy();

    const summary = [...document.querySelectorAll('main details > summary')].find((el) =>
      /text bigger/i.test(el.textContent ?? ''),
    );
    expect(summary, 'the display settings are not behind a summary that says what they are').toBeTruthy();
    expect((summary!.parentElement as HTMLDetailsElement).hasAttribute('open')).toBe(false);
    // Folded, not removed.
    expect(screen.getByRole('heading', { name: 'How this looks and reads' })).toBeTruthy();
  });

  /**
   * This block described the dev-header stub and rendered unconditionally,
   * so the deployed environment — which signs people in with Google — told
   * participants something untrue about how they got here, and offered a
   * button naming a thing they had never done.
   *
   * Written against a Google deployment specifically. The first version of
   * this test read whichever mode happened to be active and asserted
   * accordingly — and `detectAuthMode` falls back to the stub here, so it
   * checked the stub's wording every time and could never have seen the
   * defect it was written for.
   */
  it('does not explain typed identifiers to somebody who signed in with Google', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (path: string, init?: RequestInit) => {
        if (path === '/health') {
          return new Response(JSON.stringify({ status: 'ok', authMode: 'google' }), { status: 200 });
        }
        if (path === '/v1/auth/session') {
          return new Response(
            JSON.stringify({ actorId: 'actor_ann', displayName: 'Ann', authStrength: 'password', participantId: 'pt_ann', expiresAt: '2099-01-01T00:00:00Z' }),
            { status: 200 },
          );
        }
        return new Response(
          JSON.stringify((init?.method ?? 'GET') === 'GET' ? { data: [], meta: {} } : { data: { id: 'x' } }),
          { status: 200 },
        );
      }),
    );
    await act(async () => {
      render(<App />);
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Help and safety' }));
    });
    const section = screen.getByRole('heading', { name: 'Signing out' }).closest('section')!;
    expect(section.textContent, 'a Google sign-in is still explained as typed identifiers').not.toMatch(
      /identifiers you typed/,
    );
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeTruthy();
    expect(
      screen.queryByRole('button', { name: 'Sign out and enter different identifiers' }),
      'the button still offers to enter identifiers nobody typed',
    ).toBeNull();
  });

  it('still explains the identifiers under the development stub', async () => {
    await openHelp();
    const section = screen.getByRole('heading', { name: 'Signing in as someone else' }).closest('section')!;
    expect(section.textContent).toMatch(/identifiers you typed/);
  });
});
