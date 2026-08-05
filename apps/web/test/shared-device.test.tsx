import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { App } from '../src/App.js';
import { SessionGuard } from '../src/components/SessionGuard.js';
import { SharedDeviceBar } from '../src/components/SharedDeviceBar.js';
import {
  endVisit,
  isSharedDevice,
  NORMAL_LIMITS,
  preferenceStore,
  setSharedDevice,
  SHARED_LIMITS,
} from '../src/device-mode.js';
import { DEFAULT_PREFERENCES, loadPreferences, savePreferences } from '../src/preferences.js';

const MINUTE = 60_000;

describe('shared-device mode', () => {
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  afterEach(() => {
    cleanup();
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it('is off unless someone says so — it is never detected', () => {
    expect(isSharedDevice()).toBe(false);
  });

  /**
   * The flag itself must not outlive the browser session: writing "this
   * device is shared" into localStorage would leave a trace of the very
   * visit the mode exists to leave no trace of.
   */
  it('keeps the flag in storage that dies with the tab', () => {
    setSharedDevice(true);
    expect(window.sessionStorage.getItem('hadi.shared-device')).toBe('yes');
    expect(window.localStorage.getItem('hadi.shared-device')).toBeNull();
  });

  it('moves preferences off the device, so the next person does not inherit them', () => {
    setSharedDevice(true);
    expect(preferenceStore()).toBe(window.sessionStorage);
    savePreferences({ ...DEFAULT_PREFERENCES, fontScale: 'xxl' });
    expect(window.localStorage.length).toBe(0);
    expect(loadPreferences().fontScale).toBe('xxl');
    // Closing the tab is what sessionStorage.clear() stands in for here.
    window.sessionStorage.clear();
    expect(loadPreferences().fontScale).toBe('standard');
  });

  it('switching user drops the person but keeps the device marked as shared', () => {
    setSharedDevice(true);
    savePreferences({ ...DEFAULT_PREFERENCES, fontScale: 'xl' });
    endVisit();
    expect(loadPreferences().fontScale).toBe('standard');
    // The tablet did not stop being communal because the person changed.
    expect(isSharedDevice()).toBe(true);
  });

  it('shortens the idle limits rather than leaving them to a general default', () => {
    expect(SHARED_LIMITS.warnAfterMs).toBe(5 * MINUTE);
    expect(SHARED_LIMITS.signOutAfterMs).toBe(7 * MINUTE);
    expect(NORMAL_LIMITS.warnAfterMs).toBe(20 * MINUTE);
    expect(NORMAL_LIMITS.signOutAfterMs).toBe(25 * MINUTE);
  });
});

describe('the shared-device bar', () => {
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });
  afterEach(() => cleanup());

  it('says who is signed in and offers a way out without going into a menu', async () => {
    const switched = vi.fn();
    await act(async () => {
      render(<SharedDeviceBar identity="participant-7" onSwitchUser={switched} />);
    });
    expect(screen.getByText('participant-7')).toBeTruthy();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /sign out and switch user/i }));
    });
    expect(switched).toHaveBeenCalledTimes(1);
  });

  /**
   * WCAG 2.5.3: the visible words have to be inside the accessible name,
   * or someone saying "switch user" to a voice control does not get the
   * button they are looking at.
   */
  it('the shortened label is contained in the fuller name it is announced by', async () => {
    await act(async () => {
      render(<SharedDeviceBar identity="participant-7" onSwitchUser={() => {}} />);
    });
    const button = screen.getByRole('button', { name: 'Sign out and switch user' });
    expect(button.getAttribute('aria-label')?.toLowerCase()).toContain(
      (button.textContent ?? '').trim().toLowerCase(),
    );
  });

  /**
   * The cover has to take the keyboard with it. Without that, tabbing from
   * behind it walks every control on the page and a screen reader reads
   * out precisely what the cover was raised to hide.
   */
  it('covering the screen makes everything behind it inert, and uncovering releases it', async () => {
    await act(async () => {
      render(<SharedDeviceBar identity="participant-7" onSwitchUser={() => {}} />);
    });
    const behind = Array.from(document.body.children).filter((c) => c.id !== 'privacy-cover');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Cover screen' }));
    });
    expect(document.getElementById('privacy-cover')).not.toBeNull();
    expect(behind.every((c) => c.hasAttribute('inert'))).toBe(true);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /the screen is covered/i }));
    });
    expect(document.getElementById('privacy-cover')).toBeNull();
    expect(behind.some((c) => c.hasAttribute('inert'))).toBe(false);
  });
});

describe('the way into shared-device mode', () => {
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    window.sessionStorage.clear();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ data: [] }), { status: 200 })),
    );
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    window.sessionStorage.clear();
  });

  const signIn = async () => {
    fireEvent.change(screen.getByLabelText('Account identifier (actor id)'), { target: { value: 'actor-1' } });
    fireEvent.change(screen.getByLabelText('Participant identifier'), { target: { value: 'participant-1' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    });
  };

  it('is a checkbox on the way in, unticked, and says what ticking it costs', async () => {
    await act(async () => {
      render(<App />);
    });
    const box = screen.getByLabelText('This is a shared device') as HTMLInputElement;
    expect(box.checked).toBe(false);
    // The cost people most deserve to know before ticking: the text size
    // they chose does not survive the visit.
    expect(screen.getByText(/keeps nothing on the device after you close the browser/)).toBeTruthy();
  });

  it('once ticked, the bar with identity and a way out is on the screen after signing in', async () => {
    await act(async () => {
      render(<App />);
    });
    await act(async () => {
      fireEvent.click(screen.getByLabelText('This is a shared device'));
    });
    await signIn();
    expect(screen.getByText('participant-1')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Cover screen' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /sign out and switch user/i })).toBeTruthy();
  });

  it('no bar on a personal device — a permanent inverse bar for no risk is space taken from the task', async () => {
    await act(async () => {
      render(<App />);
    });
    await signIn();
    expect(screen.queryByRole('button', { name: 'Cover screen' })).toBeNull();
  });

  it('switching user returns to the door and leaves nothing of the visit behind', async () => {
    await act(async () => {
      render(<App />);
    });
    await act(async () => {
      fireEvent.click(screen.getByLabelText('This is a shared device'));
    });
    await signIn();
    savePreferences({ ...DEFAULT_PREFERENCES, fontScale: 'xxl' });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /sign out and switch user/i }));
    });
    expect(screen.getByLabelText('Participant identifier')).toBeTruthy();
    expect(loadPreferences().fontScale).toBe('standard');
    // Still ticked: the tablet is still communal for whoever sits down next.
    expect((screen.getByLabelText('This is a shared device') as HTMLInputElement).checked).toBe(true);
  });
});

describe('idle sign-out', () => {
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    vi.useFakeTimers();
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  const advance = async (ms: number) => {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(ms);
    });
  };

  it('says nothing until the warning is due', async () => {
    await act(async () => {
      render(<SessionGuard shared onSignOut={() => {}} />);
    });
    await advance(4 * MINUTE);
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });

  it('warns at five minutes on a shared device and signs out at seven', async () => {
    const out = vi.fn();
    await act(async () => {
      render(<SessionGuard shared onSignOut={out} />);
    });
    await advance(5 * MINUTE + 1000);
    expect(screen.getByRole('alertdialog')).toBeTruthy();
    expect(out).not.toHaveBeenCalled();
    await advance(2 * MINUTE);
    expect(out).toHaveBeenCalled();
  });

  it('a personal device gets twenty minutes, not five', async () => {
    await act(async () => {
      render(<SessionGuard shared={false} onSignOut={() => {}} />);
    });
    await advance(10 * MINUTE);
    expect(screen.queryByRole('alertdialog')).toBeNull();
    await advance(10 * MINUTE + 1000);
    expect(screen.getByRole('alertdialog')).toBeTruthy();
  });

  /**
   * The design's draft of this dialog reassures the reader that what they
   * wrote is saved as a draft. Nothing in this application saves drafts,
   * so that sentence would be a promise made at the moment it is broken.
   */
  it('does not claim to have saved anything, and says what is actually lost', async () => {
    await act(async () => {
      render(<SessionGuard shared onSignOut={() => {}} />);
    });
    await advance(5 * MINUTE + 1000);
    expect(screen.getByText(/typed but not yet sent or saved will be lost/)).toBeTruthy();
    expect(screen.queryByText(/saved as a draft/i)).toBeNull();
  });

  it('a countdown that is text, identified as a timer, and announced on the half minute', async () => {
    await act(async () => {
      render(<SessionGuard shared onSignOut={() => {}} />);
    });
    await advance(5 * MINUTE + 1000);
    const timer = screen.getByRole('timer');
    expect(timer.textContent).toMatch(/^\d:\d\d$/);
    // Not itself a live region: a number read out every second buries
    // everything else the screen reader has to say.
    expect(timer.getAttribute('aria-live')).toBeNull();
    const announced = document.querySelector('[aria-live="polite"]');
    expect(announced?.textContent).toMatch(/before you are signed out/);
  });

  it('activity puts the warning away and starts the clock again', async () => {
    const out = vi.fn();
    await act(async () => {
      render(<SessionGuard shared onSignOut={out} />);
    });
    await advance(5 * MINUTE + 1000);
    expect(screen.getByRole('alertdialog')).toBeTruthy();
    await act(async () => {
      fireEvent.keyDown(window, { key: 'a' });
    });
    await advance(1000);
    expect(screen.queryByRole('alertdialog')).toBeNull();
    await advance(4 * MINUTE);
    expect(out).not.toHaveBeenCalled();
  });

  /**
   * Unlimited extension on a shared device is the same as no timeout: one
   * person can hold the tablet's session open all afternoon.
   */
  it('a shared device may be extended once, and then not again', async () => {
    await act(async () => {
      render(<SessionGuard shared onSignOut={() => {}} />);
    });
    await advance(5 * MINUTE + 1000);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Keep me signed in' }));
    });
    await advance(5 * MINUTE + 1000);
    expect(screen.getByRole('alertdialog')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Keep me signed in' })).toBeNull();
    expect(screen.getByText(/can only be extended once/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Sign out now' })).toBeTruthy();
  });

  it('a personal device is not limited to one extension', async () => {
    await act(async () => {
      render(<SessionGuard shared={false} onSignOut={() => {}} />);
    });
    for (let i = 0; i < 3; i += 1) {
      await advance(20 * MINUTE + 1000);
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Keep me signed in' }));
      });
    }
    await advance(20 * MINUTE + 1000);
    expect(screen.getByRole('button', { name: 'Keep me signed in' })).toBeTruthy();
  });
});
