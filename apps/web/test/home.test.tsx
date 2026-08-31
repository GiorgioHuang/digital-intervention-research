import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
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


  it('offers three rows, and each one goes somewhere', async () => {
    stubFetch();
    await act(async () => {
      render(<App />);
    });
    await signIn();
    // The live prototype's rows, in its order. They were `<details>` that
    // opened in place, which put the consent controls themselves on the
    // front page; the owner ruled they navigate (2026-08-31).
    for (const row of ['Your information and who can see it', 'Things you can do any time', 'Exercises you can try']) {
      expect(screen.getByRole('button', { name: row }), `${row} is no longer on Home`).toBeTruthy();
    }
    expect(
      document.querySelectorAll('main details').length,
      'a disclosure is back on Home, which puts a screen’s controls on the front page',
    ).toBe(0);
  });

  /**
   * Folding is not removing, and neither is moving. D-87 ruled this on the
   * staff side and it holds harder here: an older participant who has been
   * told a right exists must still be able to reach it, and "we tidied it
   * away" is not an answer. Home stopped naming these when its rows became
   * the prototype's three, so this walks to each one and proves it arrives.
   */
  it('still reaches every destination it used to offer', async () => {
    stubFetch();
    await act(async () => {
      render(<App />);
    });
    await signIn();
    const walk = async (steps: string[], heading: RegExp) => {
      for (const step of steps) {
        const b = screen.queryByRole('button', { name: step });
        expect(b, `"${step}" is no longer offered`).toBeTruthy();
        await act(async () => {
          fireEvent.click(b!);
        });
      }
      expect(
        screen.getAllByRole('heading').some((h) => heading.test(h.textContent ?? '')),
        `${steps.join(' → ')} did not arrive at ${heading}`,
      ).toBe(true);
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Home' }));
      });
    };
    await walk(['Your information and who can see it'], /information and who can see it|consent/i);
    await walk(['Your information and who can see it', 'Who has access to you'], /access/i);
    await walk(['Your information and who can see it', 'Ask for a copy of your information'], /copy/i);
    await walk(['Things you can do any time'], /life story/i);
    await walk(['Exercises you can try'], /Exercises you can try/);
    await walk(['Get help or report a problem'], /help/i);
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
    // Named rather than positional: a positional test would pass on
    // whatever happened to be first and prove nothing about these rows.
    for (const name of ['Your information and who can see it', 'Things you can do any time', 'Exercises you can try']) {
      expect(
        waiting.compareDocumentPosition(screen.getByRole('button', { name })) &
          Node.DOCUMENT_POSITION_FOLLOWING,
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

  it('every row opens the screen it names', async () => {
    stubFetch();
    await act(async () => {
      render(<App />);
    });
    await signIn();
    for (const [steps, heading] of [
      [['Your information and who can see it', 'Who has access to you'], 'Who has access to me'],
      [['Your information and who can see it', 'Ask for a copy of your information'], 'A copy of my information'],
      [['Things you can do any time'], 'My life story'],
      [['Exercises you can try'], 'Exercises you can try'],
    ] as const) {
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Home' }));
      });
      for (const step of steps) {
        await act(async () => {
          fireEvent.click(screen.getByRole('button', { name: step }));
        });
      }
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
