import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { DisplayPreferencesPanel } from '../src/components/DisplayPreferencesPanel.js';
import { applyPreferences, loadPreferences, DEFAULT_PREFERENCES } from '../src/preferences.js';

/**
 * The stylesheet has carried `data-font-scale`, `data-density` and
 * `data-contrast` from the start and nothing ever set them, so four text
 * sizes and three density tiers were defined and unreachable.
 */
describe('reading and display preferences', () => {
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    window.localStorage.clear();
    applyPreferences(DEFAULT_PREFERENCES);
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    window.localStorage.clear();
    applyPreferences(DEFAULT_PREFERENCES);
  });

  it('says these are preferences, not a judgement, before any option', async () => {
    await act(async () => {
      render(<DisplayPreferencesPanel />);
    });
    expect(screen.getByText(/nothing\s+here is a judgement about you/)).toBeTruthy();
    // Where they live, so "your preferences" does not imply they follow
    // the person to another device.
    expect(screen.getByText(/kept on this device only/)).toBeTruthy();
  });

  it('applies immediately and offers no Save button', async () => {
    await act(async () => {
      render(<DisplayPreferencesPanel />);
    });
    expect(screen.queryByRole('button', { name: /save/i })).toBeNull();
    await act(async () => {
      fireEvent.click(screen.getByLabelText('Largest'));
    });
    expect(document.documentElement.getAttribute('data-font-scale')).toBe('xxl');
    expect(loadPreferences().fontScale).toBe('xxl');
  });

  it('standard removes the attribute, so an operating-system setting is not quietly overridden', async () => {
    await act(async () => {
      render(<DisplayPreferencesPanel />);
    });
    await act(async () => {
      fireEvent.click(screen.getByLabelText('Higher contrast'));
    });
    expect(document.documentElement.getAttribute('data-contrast')).toBe('high');
    await act(async () => {
      fireEvent.click(screen.getByLabelText('Standard', { selector: 'input[name="contrast"]' }));
    });
    // Absent, not set to "standard": the `prefers-contrast` media query
    // must keep applying for someone who set it outside this app.
    expect(document.documentElement.hasAttribute('data-contrast')).toBe(false);
  });

  it('more space is a real setting, not a label on nothing', async () => {
    await act(async () => {
      render(<DisplayPreferencesPanel />);
    });
    await act(async () => {
      fireEvent.click(screen.getByLabelText(/More space/));
    });
    expect(document.documentElement.getAttribute('data-density')).toBe('spacious');
  });

  it('reducing movement is stored as an explicit choice, and cleared back to the device setting', async () => {
    await act(async () => {
      render(<DisplayPreferencesPanel />);
    });
    const box = screen.getByLabelText('Reduce movement');
    await act(async () => {
      fireEvent.click(box);
    });
    expect(document.documentElement.getAttribute('data-motion')).toBe('reduced');
    await act(async () => {
      fireEvent.click(box);
    });
    expect(document.documentElement.hasAttribute('data-motion')).toBe(false);
  });

  it('putting everything back to standard clears every attribute', async () => {
    await act(async () => {
      render(<DisplayPreferencesPanel />);
    });
    await act(async () => {
      fireEvent.click(screen.getByLabelText('Larger'));
      fireEvent.click(screen.getByLabelText(/More space/));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Put everything back to standard' }));
    });
    for (const attr of [
      'data-font-scale',
      'data-density',
      'data-contrast',
      'data-motion',
      'data-stimulation',
      'data-theme',
    ]) {
      expect(document.documentElement.hasAttribute(attr)).toBe(false);
    }
  });

  /**
   * Less colour, which the stylesheet has been able to do since v0.1 and
   * nothing could switch on. The assertion is deliberately in two halves:
   * that ticking it reaches the stylesheet, and that unticking it clears
   * the attribute rather than writing 'standard' — an explicit 'standard'
   * would be this app overriding a choice made outside it, which is the
   * rule every other preference here already follows.
   */
  it('less colour reaches the stylesheet and clears back off again', async () => {
    await act(async () => {
      render(<DisplayPreferencesPanel />);
    });
    await act(async () => {
      fireEvent.click(screen.getByLabelText('Use less colour'));
    });
    expect(document.documentElement.getAttribute('data-stimulation')).toBe('low');
    expect(screen.getByRole('status').textContent).toContain('Less colour');
    await act(async () => {
      fireEvent.click(screen.getByLabelText('Use less colour'));
    });
    expect(document.documentElement.hasAttribute('data-stimulation')).toBe(false);
  });

  /**
   * A way back to the light design.
   *
   * The platform follows the device's light/dark setting, so a phone set
   * to dark showed the dark variant — and until this control existed
   * there was no way out of it. The light theme is the one this project
   * was drawn for; being unable to reach it is not a preference, it is a
   * dead end.
   *
   * Following the device stays the default: somebody who set their whole
   * phone to dark meant it. So "follow my device" must clear the
   * attribute rather than write 'system', or this app would be overriding
   * a choice made outside it.
   */
  it('light and dark both reach the stylesheet, and following the device clears it again', async () => {
    await act(async () => {
      render(<DisplayPreferencesPanel />);
    });
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
    await act(async () => {
      fireEvent.click(screen.getByRole('radio', { name: 'Light' }));
    });
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    await act(async () => {
      fireEvent.click(screen.getByRole('radio', { name: 'Dark' }));
    });
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    /* Back to the device's own setting has to CLEAR the attribute, not
       write 'system'. Writing it would make this app the thing deciding,
       which is the opposite of what the option says. */
    await act(async () => {
      fireEvent.click(screen.getByRole('radio', { name: 'Follow my device' }));
    });
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
  });

  /**
   * Icon and words, never icon alone.
   *
   * Queried by accessible name rather than by visible text: that is the
   * name a screen reader announces, and it is only correct if the glyph is
   * hidden from the accessibility tree. A sun character read out as "black
   * sun with rays" in front of every option is noise, and a half-filled
   * circle means "follow my device" to nobody who has not been told — so
   * the word has to be there for everyone, and the glyph for no one alone.
   */
  it('gives every appearance option a word, with the glyph hidden from the name', async () => {
    const { container } = render(<DisplayPreferencesPanel />);
    await act(async () => {});
    for (const name of ['Follow my device', 'Light', 'Dark']) {
      expect(screen.getByRole('radio', { name }), `no radio named ${name}`).toBeTruthy();
    }
    const glyphs = [...container.querySelectorAll('fieldset span[aria-hidden="true"]')];
    expect(glyphs.length, 'the options lost their icons').toBeGreaterThanOrEqual(3);
    for (const glyph of glyphs) {
      expect(glyph.textContent?.trim().length, 'an icon rendered as nothing').toBeGreaterThan(0);
    }
  });

  /**
   * What "less colour" must never mean is "less information". Every state
   * on this platform says what it is in words and carries an icon, so
   * removing the tints removes nothing — and the screen has to promise
   * exactly that, because somebody deciding whether it is safe to turn on
   * has no other way to know.
   */
  it('says plainly that turning colour down hides nothing', async () => {
    await act(async () => {
      render(<DisplayPreferencesPanel />);
    });
    expect(screen.getByText(/Nothing is hidden/i)).toBeTruthy();
  });

  /**
   * Only options with something behind them are offered. Reading aloud,
   * one-step-at-a-time and simpler wording are all in the design and none
   * has any implementation; offering them would record a choice nothing
   * acts on.
   */
  it('offers nothing the platform cannot actually do', async () => {
    await act(async () => {
      render(<DisplayPreferencesPanel />);
    });
    for (const absent of [/read .* aloud/i, /one step at a time/i, /simpler wording/i, /more time/i]) {
      expect(screen.queryByText(absent)).toBeNull();
    }
  });

  it('a preference survives a reload', async () => {
    await act(async () => {
      render(<DisplayPreferencesPanel />);
    });
    await act(async () => {
      fireEvent.click(screen.getByLabelText('Larger still'));
    });
    cleanup();
    applyPreferences(loadPreferences());
    expect(document.documentElement.getAttribute('data-font-scale')).toBe('xl');
    await act(async () => {
      render(<DisplayPreferencesPanel />);
    });
    expect((screen.getByLabelText('Larger still') as HTMLInputElement).checked).toBe(true);
  });
});
