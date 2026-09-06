import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { useState } from 'react';
import { Modal } from '../src/components/Modal.js';
import { CommunityPanel } from '../src/components/CommunityPanel.js';

/**
 * Anything a control opens is a window over the page.
 *
 * They were rendered inline, at whatever point in the component the state
 * happened to be handled — very often nowhere near the button. Reported
 * on a community post: pressing "Report" put the form at the foot of the
 * page, below every other post, so it looked as though nothing had
 * happened and the button was pressed again and again (owner,
 * 2026-09-06).
 */
function Harness() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Open it</button>
      <button>Something else on the page</button>
      {open && (
        <Modal labelledBy="harness-heading" onClose={() => setOpen(false)}>
          <p id="harness-heading">What is the matter?</p>
          <input aria-label="Your words" />
          <button onClick={() => setOpen(false)}>Go back</button>
        </Modal>
      )}
    </>
  );
}

beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('a window over the page', () => {
  const open = async () => {
    await act(async () => {
      render(<Harness />);
    });
    // Focused first, as a browser does when a button is pressed: jsdom
    // does not move focus on click, and without this the test would be
    // asserting that focus returns to <body>.
    screen.getByRole('button', { name: 'Open it' }).focus();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Open it' }));
    });
  };

  it('names itself by what is inside it', async () => {
    await open();
    const dialog = screen.getByRole('alertdialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-labelledby')).toBe('harness-heading');
  });

  /**
   * The window takes focus, and gives it back.
   *
   * Without the first, somebody using a keyboard or a screen reader is
   * left reading the page behind and never learns the window opened —
   * which is the same failure the sighted report was about, arriving by a
   * different route. Without the second, closing it drops them at the top
   * of the page instead of at the button they pressed.
   */
  it('takes focus when it opens and hands it back when it closes', async () => {
    await open();
    const dialog = screen.getByRole('alertdialog');
    expect(document.activeElement).toBe(dialog);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Go back' }));
    });
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Open it' }));
  });

  it('closes on Escape', async () => {
    await open();
    await act(async () => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });

  /**
   * Tab stays inside. Otherwise the next press leaves for the page
   * behind, which is still there and still full of controls that would
   * now do something while a half-written report sits open.
   */
  it('keeps Tab inside it', async () => {
    await open();
    const back = screen.getByRole('button', { name: 'Go back' });
    back.focus();
    await act(async () => {
      fireEvent.keyDown(document, { key: 'Tab' });
    });
    expect(document.activeElement).toBe(screen.getByLabelText('Your words'));
  });

  /** The page behind does not scroll away underneath it. */
  it('holds the page still while it is open', async () => {
    await open();
    expect(document.body.style.overflow).toBe('hidden');
    await act(async () => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });
    expect(document.body.style.overflow).not.toBe('hidden');
  });

  /**
   * A stray tap beside the window must not throw away what somebody
   * wrote. Easy to do on a phone, easier with an unsteady hand — and
   * every window carries its own way out, in words.
   */
  it('does not close when the page behind it is tapped', async () => {
    await open();
    await act(async () => {
      fireEvent.click(document.querySelector('.modal')!);
    });
    expect(screen.getByRole('alertdialog')).toBeTruthy();
  });
});

/**
 * And the screen it was reported on. The report form is a window now, so
 * it is on screen the moment the button is pressed rather than at the
 * foot of a page of posts, below everything else.
 */
describe('reporting a community post', () => {
  const SPACE = {
    spaceId: 'cs_1',
    name: 'Gardening Corner',
    ruleVersionId: 'crv_1',
    ruleVersionNumber: 2,
    rulesText: 'Be kind.',
    membershipState: 'Active',
  };
  const POST = {
    postId: 'sp_9',
    authorParticipantId: 'pt_b',
    authorDisplayName: 'Ben',
    contentText: 'The tomatoes are ripe today',
    publishedAt: '2026-08-01T02:00:00Z',
  };

  it('opens the form in a window, not at the foot of the page', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (path: string, init?: RequestInit) => {
        const method = init?.method ?? 'GET';
        if (method === 'GET' && path.endsWith('/community-spaces')) {
          return new Response(JSON.stringify({ data: [{ id: SPACE.spaceId, attributes: SPACE }] }), { status: 200 });
        }
        if (method === 'GET' && path.endsWith('/feed')) {
          return new Response(JSON.stringify({ data: [{ id: POST.postId, attributes: POST }] }), { status: 200 });
        }
        return new Response(JSON.stringify({ data: [] }), { status: 200 });
      }),
    );
    await act(async () => {
      render(<CommunityPanel session={{ actorId: 'a', participantId: 'pt_a' }} />);
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Open "Gardening Corner"' }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Report this post' }));
    });
    const dialog = screen.getByRole('alertdialog');
    expect(dialog.getAttribute('aria-labelledby')).toBe('report-post-heading');
    // The form is INSIDE the window rather than loose in the page — which
    // is the whole of the report: it used to render below every post.
    expect(dialog.contains(screen.getByLabelText(/In your own words/))).toBe(true);
    expect(document.activeElement).toBe(dialog);
  });
});
