import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { App } from '../src/App.js';
import { UnfinishedPhotograph } from '../src/components/UnfinishedPhotograph.js';
import { CaptionPhotograph } from '../src/components/CaptionPhotograph.js';

const session = { actorId: 'actor_m', participantId: 'pt_m' };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

const photo = {
  objectId: 'obj_1',
  owningResourceId: 'li_1',
  declaredContentType: 'image/jpeg',
  addedAt: '2026-08-18T09:00:00Z',
};

/**
 * "A photograph with no words."
 *
 * A picture in somebody's life story with nobody named in it is the part
 * most likely to be lost — the one person who knows is the one looking at
 * it, and there is a window for asking them. What is tested here is that
 * the card is one thing to finish rather than a chore list, and that it
 * never appears when there is nothing to finish.
 */
describe('the unfinished photograph', () => {
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  const show = async (body: unknown, status = 200) => {
    const calls: string[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (path: string) => {
        calls.push(path);
        return json(body, status);
      }),
    );
    const opened: string[] = [];
    await act(async () => {
      render(<UnfinishedPhotograph session={session} onCaption={(p) => opened.push(p.objectId)} />);
    });
    return { calls, opened };
  };

  it('names the one thing to finish, and when it was started', async () => {
    const { calls, opened } = await show({ data: [{ id: 'obj_1', attributes: photo }] });
    expect(calls[0]).toBe('/v1/participants/pt_m/uncaptioned-photographs?limit=1');
    expect(screen.getByRole('heading', { name: 'A photograph with no words' })).toBeTruthy();
    // The date spelled out. A weekday alone — the design's "on Tuesday" —
    // is unambiguous for about a week, and an uncaptioned photograph is
    // exactly the thing that sits for months.
    expect(screen.getByText(/You added it on 18 August 2026/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Add words to this photograph' }));
    expect(opened).toEqual(['obj_1']);
  });

  /**
   * One, never a count. "4 photographs need words" is a chore list, and
   * this card is meant to be a single thing somebody finishes and is then
   * done with — which is what the greeting's second line promises.
   */
  it('shows one thing, not how many are outstanding', async () => {
    await show({
      data: [1, 2, 3].map((n) => ({ id: `obj_${n}`, attributes: { ...photo, objectId: `obj_${n}` } })),
    });
    expect(screen.getAllByRole('heading', { name: 'A photograph with no words' }).length).toBe(1);
    expect(document.body.textContent, 'the card is counting outstanding work at somebody').not.toMatch(/\b[2-9]\d* photograph/);
  });

  it('is absent when nothing is unfinished, and when it cannot be read', async () => {
    await show({ data: [] });
    expect(screen.queryByRole('heading', { name: 'A photograph with no words' })).toBeNull();
    cleanup();
    await show({ error: {} }, 500);
    expect(screen.queryByRole('heading', { name: 'A photograph with no words' })).toBeNull();
    expect(document.body.textContent, 'a failed card put an error on Home').not.toMatch(/went wrong|could not/i);
  });
});

/**
 * The greeting's second line, which the handoff makes conditional: "One
 * thing is unfinished. When it is done, it is done." A page that says that
 * with nothing unfinished on it is telling somebody there is work waiting
 * when there is not — on the screen whose entire job is to make that
 * difference legible.
 */
describe('the line under the greeting', () => {
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  const arrive = async (uncaptioned: unknown[]) => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (path: string) => {
        if (path === '/health') return json({ status: 'ok', authMode: 'dev-header' });
        if (path.includes('uncaptioned-photographs')) return json({ data: uncaptioned });
        return json({ data: [], meta: {} });
      }),
    );
    await act(async () => {
      render(<App />);
    });
    fireEvent.change(screen.getByLabelText('Account identifier (actor id)'), { target: { value: 'a' } });
    fireEvent.change(screen.getByLabelText('Participant identifier'), { target: { value: 'pt_m' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    });
  };

  it('says one thing is unfinished only when one is', async () => {
    await arrive([{ id: 'obj_1', attributes: photo }]);
    expect(screen.getByText('One thing is unfinished. When it is done, it is done.')).toBeTruthy();
  });

  it('does not claim work is waiting when none is', async () => {
    await arrive([]);
    expect(
      screen.queryByText(/One thing is unfinished/),
      'the page says something is unfinished with nothing on it',
    ).toBeNull();
    expect(screen.getByText(/Anything that needs a decision from you is below/)).toBeTruthy();
  });
});

describe('saying who is in the photograph', () => {
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  const open = () => {
    const calls: { path: string; body: Record<string, unknown> }[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (path: string, init?: RequestInit) => {
        if ((init?.method ?? 'GET') !== 'GET') {
          calls.push({ path, body: JSON.parse(init!.body as string) as Record<string, unknown> });
        }
        return json({ data: { attributes: { caption: 'x' } } });
      }),
    );
    const done: number[] = [];
    render(<CaptionPhotograph session={session} photograph={photo} onDone={() => done.push(1)} />);
    return { calls, done };
  };

  it('sends the words and comes back', async () => {
    const { calls, done } = open();
    fireEvent.change(screen.getByLabelText('Who is in it, and when was it?'), {
      target: { value: '  My sister Anne, about 1962.  ' },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save these words' }));
    });
    expect(calls[0]?.path).toBe('/v1/objects/obj_1/caption');
    expect(calls[0]?.body['caption']).toBe('  My sister Anne, about 1962.  ');
    expect(done).toEqual([1]);
  });

  /**
   * The photograph is not shown, because nothing serves a released
   * object's bytes to a client (B-19). A blank space where a picture
   * belongs reads as a failure to load; this says what it is.
   */
  it('says the picture cannot be shown rather than leaving a hole', () => {
    open();
    expect(screen.getByText(/picture cannot be shown/)).toBeTruthy();
  });

  it('will not save nothing', () => {
    open();
    expect((screen.getByRole('button', { name: 'Save these words' }) as HTMLButtonElement).disabled).toBe(true);
  });
});
