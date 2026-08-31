import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { App } from '../src/App.js';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { HELPLINE_PLACEHOLDER } from '../src/components/elder/AboutScreen.js';

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
      'Dalhousie University, Halifax, Nova Scotia',
    ]) {
      expect(text, `"${line}" is missing`).toContain(line);
    }
  });

  /**
   * The telephone is dialled, not read out.
   *
   * On the device most of these people are holding, a number that is only
   * text has to be copied out by hand — by somebody who may be ringing
   * because they cannot manage the screen in front of them.
   */
  it('makes the telephone number pressable', async () => {
    stub();
    await act(async () => {
      render(<App />);
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'about' }));
    });
    const link = screen.getByRole('link', { name: HELPLINE_PLACEHOLDER });
    expect(link.getAttribute('href')).toBe(`tel:${HELPLINE_PLACEHOLDER.replace(/\s/g, '')}`);
  });

  /**
   * **The number is fiction, and this is the one place it is written.**
   *
   * 555-01xx is the range reserved so that no real line is dialled by
   * accident. The consequence here is specific: this is the number a person
   * in difficulty rings, on a screen built for somebody who may have no
   * other way to ask for help. Keeping it to a single named constant is
   * what stops it being copied into a second screen and then found in only
   * one of them. B-22.
   */
  it('keeps the placeholder helpline in exactly one place', () => {
    expect(HELPLINE_PLACEHOLDER, 'the helpline changed; is it real yet?').toBe('1 800 555 0142');
    // Written once as a value. The comment above it names it too, which is
    // the point of the comment, so comments are stripped before counting —
    // what must not happen is a second literal in the code, which would be
    // missed when the real number arrives.
    //
    // **This used to read only AboutScreen.tsx**, which is the one file a
    // second copy cannot be in. It said, in its own comment, that it was
    // what stopped the number being copied into a second screen — and
    // `App.tsx` had already copied it into the "I cannot sign in" message,
    // where it sat unseen. A guard that reads a single file cannot answer
    // a question about every file, and this one was written as though it
    // could. It now walks the whole source tree.
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
      for (let i = 0; i < code.split(HELPLINE_PLACEHOLDER).length - 1; i += 1) {
        where.push(file.slice(root.length + 1));
      }
    }
    expect(where, `the number is written in more than one place: ${where.join(', ')}`).toEqual([
      'components/elder/AboutScreen.tsx',
    ]);
  });
});
