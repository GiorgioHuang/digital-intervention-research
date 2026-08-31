import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { act } from 'react';
import { App } from '../src/App.js';
import { copyrightYear } from '../src/greeting.js';
import { COPYRIGHT_HOLDER } from '../src/components/elder/SiteFooter.js';

const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });

const arrive = async (authMode: string) => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (path: string) => {
      if (path === '/health') return json({ status: 'ok', authMode });
      return json({ data: [], meta: {} });
    }),
  );
  await act(async () => {
    render(<App />);
  });
};

/**
 * The screen everybody meets first.
 *
 * It was the one screen in the app rendered outside the participant
 * workspace — no `data-workspace` attribute, so none of the Classical
 * tokens, none of the faces, none of the type scale reached it. It looked
 * like a different product from every other screen, which on a first
 * impression is the worst place for that to be true.
 */
describe('the way in', () => {
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('is inside the participant workspace, like every other screen', async () => {
    await arrive('google');
    expect(
      document.querySelector("[data-workspace='participant']"),
      'the first screen is outside the design system again',
    ).toBeTruthy();
  });

  it('says what this is before it asks for anything', async () => {
    await arrive('google');
    // The live prototype's opening: brand, name, study, headline. The
    // earlier written handoff's lede paragraph and its "no time limit" line
    // are both gone from it.
    // Two: the one in the toolbar and the centred one on the screen
    // itself. Both are the prototype's.
    expect(screen.getAllByText('icareu').length, 'the brand block is gone').toBe(2);
    expect(document.querySelector('.brand-block__mark'), 'the centred mark is gone').toBeTruthy();
    expect(screen.getByText('Canadian Elder Life Story Project')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Your life, in your own words.' })).toBeTruthy();
    expect(screen.queryByText(/Nobody else can see it unless you say so/), 'the retired lede is back').toBeNull();
  });

  /**
   * Doc 20 §13.2: at most one primary action per screen. One address serves
   * three audiences in development, and the supporter and staff entrances
   * were drawn as full-width outlines identical to the way in — three
   * equal-looking buttons under a headline promising one thing. The
   * dev-header path had already been fixed for exactly this; the Google
   * path reintroduced it.
   */
  it('offers one way in, and does not dress the other doors as it', async () => {
    await arrive('google');
    const wayIn = screen.getByRole('button', { name: 'Continue with Google' });
    expect(wayIn).toBeTruthy();
    for (const other of ['Supporter workspace', 'Staff workspace']) {
      const el = screen.queryByRole('button', { name: other });
      if (el === null) continue;
      expect(el.className, `${other} is dressed as the way in`).toContain('link-button');
      expect(el.className).not.toBe(wayIn.className);
    }
  });

  it('carries the copyright, and the year is not baked in', async () => {
    await arrive('google');
    // The holder is a placeholder the owner should confirm; what this
    // asserts is that the footer shows whatever the constant says, so
    // correcting it stays a single edit.
    // Read off the footer's own text rather than with a text matcher: React
    // renders "© ", the year and the holder as separate text nodes, so a
    // string or regex matcher looks for something no single node contains.
    const footer = document.querySelector('.site-footer');
    expect(footer, 'there is no footer').toBeTruthy();
    expect(footer!.textContent).toMatch(/^© \d{4} Healthy Aging Intelligence Lab \(HAIL\)$/);
    expect(COPYRIGHT_HOLDER, 'the holder changed; update this test with it').toBe(
      'Healthy Aging Intelligence Lab (HAIL)',
    );
    expect(copyrightYear(new Date('2031-02-01T00:00:00'))).toBe(2031);
    expect(copyrightYear(new Date('2026-12-31T23:00:00'))).toBe(2026);
  });
});
