import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { App } from '../src/App.js';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });
const stub = (authMode = 'dev-header') =>
  vi.stubGlobal(
    'fetch',
    vi.fn(async (path: string) => {
      if (path === '/health') return json({ status: 'ok', authMode });
      return json({ data: [], meta: {} });
    }),
  );

const signIn = async () => {
  fireEvent.change(screen.getByLabelText('Account identifier (actor id)'), { target: { value: 'a' } });
  fireEvent.change(screen.getByLabelText('Participant identifier'), { target: { value: 'p' } });
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
  });
};

/**
 * "About this project".
 *
 * It is where somebody decides whether to trust this with their life
 * story, and it is where the telephone number is — which is why the
 * prototype puts a link to it in the footer of every screen, before
 * sign-in included.
 */
describe('about this project', () => {
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  /**
   * Reachable before sign-in, which is the case that needs saying: that
   * screen returns before the app's routing is ever consulted, so the
   * footer link there is a different path through the code and would fail
   * on its own.
   */
  it('opens from the footer on the sign-in screen, and comes back', async () => {
    stub();
    await act(async () => {
      render(<App />);
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'about' }));
    });
    expect(screen.getByRole('heading', { level: 1, name: 'About this project' })).toBeTruthy();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '‹ Back to sign in' }));
    });
    expect(screen.getByRole('heading', { name: 'Your life, in your own words.' })).toBeTruthy();
  });

  it('opens from the footer once signed in, and from Help', async () => {
    stub();
    await act(async () => {
      render(<App />);
    });
    await signIn();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'about' }));
    });
    expect(screen.getByRole('heading', { level: 1, name: 'About this project' })).toBeTruthy();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '‹ Back to Home' }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Help and safety' }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'About this project' }));
    });
    expect(screen.getByRole('heading', { level: 1, name: 'About this project' })).toBeTruthy();
  });

  it('says what it says in the prototype', async () => {
    stub();
    await act(async () => {
      render(<App />);
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'about' }));
    });
    const text = document.body.textContent ?? '';
    for (const line of [
      'icareu is a place for older people in Canada',
      'It is run by the Healthy Aging Intelligence Lab',
      'stopping does not affect any care or service you receive',
      'Everything you write is private until you decide otherwise',
      'Nothing is added to your story unless you accept it',
      'We never sell your information',
    ]) {
      expect(text, `"${line}" is missing`).toContain(line);
    }
  });

  /**
   * The telephone number is gone, and nothing is left behind.
   *
   * It was in the 555-01xx range reserved for fiction — the number a
   * person in difficulty would ring, reaching nobody (B-22). The owner
   * replaced it with a message box. A number left in one screen after
   * being removed from another is the failure this whole file has already
   * met once, so the check is the same shape: walk the tree, not one file.
   */
  it('leaves no fictional telephone number anywhere in the source', () => {
    const root = resolve(process.cwd(), 'src');
    const files: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (/\.(ts|tsx)$/.test(entry.name)) files.push(full);
      }
    };
    walk(root);
    const where: string[] = [];
    for (const file of files) {
      const code = readFileSync(file, 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/[^\n]*/g, '');
      // The whole reserved range, not just the one number that was here:
      // the next placeholder somebody reaches for will be a different
      // 555-01xx, and it would rings nowhere just the same.
      if (/\b555[\s-]?01\d\d\b/.test(code)) where.push(file.slice(root.length + 1));
    }
    expect(where, `a fiction-range telephone number is still in: ${where.join(', ')}`).toEqual([]);
  });

  /**
   * The box works signed out, and that is the point of it.
   *
   * About is reached from the footer of every screen, sign-in included,
   * and with the telephone gone this is the only way to reach a person for
   * somebody who cannot get in — which is exactly when a contact route
   * matters most. A form that only existed behind sign-in would be missing
   * for the people most likely to need it.
   */
  it('offers the message box to somebody who has not signed in', async () => {
    vi.stubEnv('VITE_CONTACT_ENDPOINT', 'https://contact.test/relay');
    stub();
    await act(async () => {
      render(<App />);
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'about' }));
    });
    expect(screen.getByRole('heading', { name: 'About this project' })).toBeTruthy();
    expect(screen.getByLabelText('Your message')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Send message' })).toBeTruthy();
  });

  /**
   * With no relay configured there is no way to reach anybody from this
   * screen, and the screen has to say so.
   *
   * A form that accepts a message and drops it would be worse than the
   * fictional telephone number it replaced — that at least failed where
   * the person could see it fail. This is the state of any build whose
   * VITE_CONTACT_ENDPOINT is unset, which includes every local build, so
   * it is not a hypothetical.
   */
  it('says plainly when there is no way to send a message at all', async () => {
    vi.stubEnv('VITE_CONTACT_ENDPOINT', '');
    stub();
    await act(async () => {
      render(<App />);
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'about' }));
    });
    expect(screen.queryByRole('button', { name: 'Send message' }), 'a form that goes nowhere is on screen').toBeNull();
    expect(screen.getByText(/no way to send a message from this copy of the site/)).toBeTruthy();
  });
});
