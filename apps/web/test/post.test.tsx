import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { PostMenu, PostMenuItem, PostPhotographs, PostWords } from '../src/components/Post.js';

/**
 * The parts a post is made of.
 *
 * The shape is the owner's (2026-09-07), taken from what a familiar
 * timeline does: long words folded with a way to read the rest, one
 * photograph shown whole and several side by side, any of them opening
 * larger, and everything that can be DONE to the post gathered in one
 * menu at its corner rather than laid out as a row of buttons crowding
 * somebody's writing.
 *
 * Asserted here rather than only through the screens that use them,
 * because both screens use the same pieces and neither is where the
 * behaviour lives.
 */

beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('the menu at a post’s corner', () => {
  const chosen: string[] = [];
  const openMenu = async (about = 'My garden years') => {
    await act(async () => {
      render(
        <>
          <button>Something else on the page</button>
          <PostMenu about={about}>
            <PostMenuItem onSelect={() => chosen.push('change')}>Change what this says</PostMenuItem>
            <PostMenuItem onSelect={() => chosen.push('withdraw')}>Take this out of my story</PostMenuItem>
          </PostMenu>
        </>,
      );
    });
    const trigger = screen.getByRole('button', { name: `What you can do with “${about}”` });
    trigger.focus();
    await act(async () => {
      fireEvent.click(trigger);
    });
    return trigger;
  };

  it('keeps the actions out of the way until they are asked for', async () => {
    await act(async () => {
      render(
        <PostMenu about="My garden years">
          <PostMenuItem onSelect={() => {}}>Change what this says</PostMenuItem>
        </PostMenu>,
      );
    });
    /*
     * Nothing but the one control. The five actions used to sit under
     * every memory, so the words — the point of the screen, and
     * somebody's own writing — were the smallest thing on it.
     */
    expect(screen.queryByRole('menuitem'), 'the actions are on the post before anybody asks').toBeNull();
    const trigger = screen.getByRole('button', { name: /What you can do with/ });
    expect(trigger.getAttribute('aria-haspopup'), 'the control is not announced as a menu').toBe('menu');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    /*
     * And it says which post it belongs to. Two menus on one screen are
     * otherwise the same control twice over to anybody who cannot see
     * which memory each sits beside.
     */
    expect(trigger.getAttribute('aria-label')).toMatch(/My garden years/);
  });

  it('opens onto the actions, and closing one closes the menu', async () => {
    chosen.length = 0;
    const trigger = await openMenu();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getAllByRole('menuitem').length).toBe(2);

    await act(async () => {
      fireEvent.click(screen.getByRole('menuitem', { name: 'Change what this says' }));
    });
    expect(chosen).toEqual(['change']);
    expect(screen.queryByRole('menuitem'), 'the menu stayed open over what it opened').toBeNull();
  });

  it('closes on Escape, and gives the keyboard back where it was', async () => {
    const trigger = await openMenu();
    await act(async () => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });
    expect(screen.queryByRole('menuitem'), 'Escape did not close the menu').toBeNull();
    /*
     * Back to the control that opened it. Without this somebody using a
     * keyboard is returned to the top of the page and has to travel
     * down to the post again.
     */
    expect(document.activeElement, 'the keyboard was left nowhere').toBe(trigger);
  });

  it('closes when something else on the page is pressed', async () => {
    await openMenu();
    await act(async () => {
      fireEvent.mouseDown(screen.getByRole('button', { name: 'Something else on the page' }));
    });
    expect(screen.queryByRole('menuitem'), 'the menu is still open over the page').toBeNull();
  });
});

describe('the words of a post', () => {
  it('shows a short memory whole and says nothing about there being more', async () => {
    await act(async () => {
      render(<PostWords text="I grew roses along the whole south wall." label="My garden years" />);
    });
    expect(document.querySelector('.post-words__text')!.textContent).toBe(
      'I grew roses along the whole south wall.',
    );
    expect(screen.queryByRole('button'), 'a memory with nothing hidden offered to show more').toBeNull();
  });

  it('folds a long one, and names the memory it would show more of', async () => {
    const long = `${'I grew roses along the whole south wall. '.repeat(12)}And then the frost came.`;
    await act(async () => {
      render(<PostWords text={long} label="My garden years" />);
    });
    const shown = document.querySelector('.post-words__text')!.textContent ?? '';
    expect(shown.length).toBeLessThan(long.length);
    /*
     * The control names its post. On a page of posts, "Show more" said
     * eight times over tells a screen reader nothing about which memory
     * each one belongs to.
     */
    const more = screen.getByRole('button', { name: /Show more/ });
    expect(more.textContent).toMatch(/My garden years/);
    await act(async () => {
      fireEvent.click(more);
    });
    expect(document.querySelector('.post-words__text')!.textContent).toBe(long);
  });
});

describe('the photographs on a post', () => {
  const picture = (key: string) => ({ key, url: `blob:${key}`, alt: `A photograph on ${key}.` });

  it('gives one photograph the width, and lays several side by side', async () => {
    const { unmount } = render(<PostPhotographs pictures={[picture('one')]} />);
    expect(
      document.querySelector('.post-pictures')!.className,
      'a single photograph was put in the scrolling row',
    ).not.toMatch(/post-pictures--many/);
    unmount();

    render(<PostPhotographs pictures={[picture('one'), picture('two'), picture('three')]} />);
    /*
     * Side by side and scrolled, rather than stacked down the page: a
     * memory with four photographs on it pushed its own words — and the
     * next memory — an entire screen away.
     */
    expect(
      document.querySelector('.post-pictures')!.className,
      'several photographs are still stacked down the page',
    ).toMatch(/post-pictures--many/);
    expect(document.querySelectorAll('.post-pictures__item').length).toBe(3);
  });

  it('opens a photograph to be looked at, and gives it a way out', async () => {
    await act(async () => {
      render(<PostPhotographs pictures={[picture('one'), picture('two')]} />);
    });
    expect(screen.queryByRole('dialog'), 'a photograph was open before anybody pressed one').toBeNull();

    /*
     * A button around the picture, so a keyboard reaches it and it is
     * announced as something that can be pressed — the picture's own
     * description is what names it.
     */
    const openers = screen.getAllByRole('button', { name: /Open this photograph larger/ });
    expect(openers.length).toBe(2);
    await act(async () => {
      fireEvent.click(openers[1]!);
    });

    const window_ = screen.getByRole('dialog');
    const large = window_.querySelector('img.post-pictures__large');
    expect(large, 'the photograph did not open').not.toBeNull();
    expect(large!.getAttribute('src')).toBe('blob:two');
    /* The one that was pressed, not the first one on the post. */
    expect(large!.getAttribute('alt')).toMatch(/two/);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    });
    expect(screen.queryByRole('dialog'), 'the photograph would not close').toBeNull();
  });

  it('draws nothing at all when there are no photographs', () => {
    const { container } = render(<PostPhotographs pictures={[]} />);
    expect(container.innerHTML, 'an empty row of photographs is drawn on every post without one').toBe('');
  });
});
