import { useEffect, useState } from 'react';
import {
  DEFAULT_PREFERENCES,
  loadPreferences,
  savePreferences,
  systemPrefersMoreContrast,
  systemPrefersReducedMotion,
  type DisplayPreferences,
} from '../preferences.js';

/**
 * How this reads and how it behaves (design B13).
 *
 * The stylesheet has carried these hooks from the start and nothing ever
 * set them, so four text sizes and three density tiers were defined and
 * unreachable.
 *
 * Three rules from the design, kept:
 *
 * Nothing here is described as a deficiency. These are preferences, not
 * accommodations for a shortcoming, and the first paragraph says so
 * before any option appears.
 *
 * Changes apply as they are made. The design asks for the effect to be
 * visible without saving first, so there is no Save button — a Save
 * button would imply the change had not happened yet.
 *
 * Only options with something behind them are offered. Reading aloud,
 * one-step-at-a-time and simpler wording are all in the design and none
 * has any implementation, so offering them would record a choice nothing
 * acts on — the same false claim as a consent scope no check reads (D-2).
 */
const FONT_SIZES: { value: DisplayPreferences['fontScale']; label: string }[] = [
  { value: 'standard', label: 'Standard' },
  { value: 'lg', label: 'Larger' },
  { value: 'xl', label: 'Larger still' },
  { value: 'xxl', label: 'Largest' },
];

export function DisplayPreferencesPanel() {
  const [prefs, setPrefs] = useState<DisplayPreferences>(DEFAULT_PREFERENCES);
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    setPrefs(loadPreferences());
  }, []);

  const change = (next: Partial<DisplayPreferences>, said: string) => {
    const merged = { ...prefs, ...next };
    setPrefs(merged);
    savePreferences(merged);
    setAnnouncement(said);
  };

  return (
    <section aria-labelledby="display-prefs-heading">
      <h2 id="display-prefs-heading">How this looks and reads</h2>
      <p>
        These are your preferences. Choosing any of them changes nothing about your part in the research, and nothing
        here is a judgement about you.
      </p>
      <p>
        They are kept on this device only. If you use a different phone or computer, you will need to set them again
        there — this platform does not store them for you.
      </p>

      {/*
        Live preview, so the effect is visible before any decision is
        final — and there is nothing to make final, since changes apply
        as they are made.
      */}
      <section aria-labelledby="prefs-preview-heading">
        <h3 id="prefs-preview-heading">Preview</h3>
        <p>This is what ordinary text looks like.</p>
        <p>
          <button type="button">This is a button</button>
        </p>
      </section>

      <fieldset>
        <legend>Text size</legend>
        {FONT_SIZES.map((f) => (
          <p key={f.value}>
            <label>
              <input
                type="radio"
                name="font-scale"
                value={f.value}
                checked={prefs.fontScale === f.value}
                onChange={() => change({ fontScale: f.value }, `Text size: ${f.label}.`)}
              />{' '}
              {f.label}
            </label>
          </p>
        ))}
        <p>Your browser can also zoom the whole page. This changes the text without changing anything else.</p>
      </fieldset>

      <fieldset>
        <legend>Space between things</legend>
        <p>
          <label>
            <input
              type="radio"
              name="density"
              value="standard"
              checked={prefs.density === 'standard'}
              onChange={() => change({ density: 'standard' }, 'Standard spacing.')}
            />{' '}
            Standard
          </label>
        </p>
        <p>
          <label>
            <input
              type="radio"
              name="density"
              value="spacious"
              checked={prefs.density === 'spacious'}
              onChange={() => change({ density: 'spacious' }, 'More space between things.')}
            />{' '}
            More space (less on each screen, further apart)
          </label>
        </p>
      </fieldset>

      <fieldset>
        <legend>Contrast</legend>
        <p>
          <label>
            <input
              type="radio"
              name="contrast"
              value="standard"
              checked={prefs.contrast === 'standard'}
              onChange={() => change({ contrast: 'standard' }, 'Standard contrast.')}
            />{' '}
            Standard
          </label>
        </p>
        <p>
          <label>
            <input
              type="radio"
              name="contrast"
              value="high"
              checked={prefs.contrast === 'high'}
              onChange={() => change({ contrast: 'high' }, 'Higher contrast.')}
            />{' '}
            Higher contrast
          </label>
        </p>
        {systemPrefersMoreContrast() && (
          // Said rather than silently overridden: someone who set this in
          // their operating system should not have to wonder whether this
          // screen has undone it.
          <p>Your device already asks for more contrast, and this platform is already following that.</p>
        )}
      </fieldset>

      <fieldset>
        <legend>Movement</legend>
        <p>
          <label>
            <input
              type="checkbox"
              checked={prefs.motion === 'reduced'}
              onChange={(e) =>
                change(
                  { motion: e.target.checked ? 'reduced' : 'system' },
                  e.target.checked ? 'Movement reduced.' : 'Movement follows your device setting.',
                )
              }
            />{' '}
            Reduce movement
          </label>
        </p>
        {systemPrefersReducedMotion() && (
          <p>Your device already asks for less movement, and this platform is already following that.</p>
        )}
      </fieldset>

      {/*
        Light or the device's own setting.

        The platform follows `prefers-color-scheme`, so a phone set to dark
        showed the dark variant with no way back — and the light design is
        the one this project was drawn for, on the owner's own reasoning
        about older adults, research tables and photographs. Following the
        device stays the default, because a person who set their whole
        phone to dark meant it; what was missing was the way out.

        There is no "always dark" here: see the note on `Theme` for why
        that one costs a duplicate palette and this one costs a selector.
      */}
      <fieldset>
        <legend>Light or dark</legend>
        <p>
          <label>
            <input
              type="radio"
              name="theme"
              value="system"
              checked={prefs.theme === 'system'}
              onChange={() => change({ theme: 'system' }, 'Following your device.')}
            />{' '}
            Follow my device
          </label>
        </p>
        <p>
          <label>
            <input
              type="radio"
              name="theme"
              value="light"
              checked={prefs.theme === 'light'}
              onChange={() => change({ theme: 'light' }, 'Always light.')}
            />{' '}
            Always light
          </label>
        </p>
        <p>
          <small>
            Your device is set to decide this for every app. Choose &ldquo;Always light&rdquo; if you would rather this
            one stayed light.
          </small>
        </p>
      </fieldset>

      {/*
        Less colour.

        Offered here rather than as a "simple view" because it takes nothing
        away: every state on this platform is said in words and marked with
        an icon, and colour is only ever the third cue. Removing the tinted
        panels therefore removes no information — which is exactly why a
        setting like this can be offered honestly, and why it could not be
        if any screen relied on a colour to mean something.
      */}
      <fieldset>
        <legend>Colour</legend>
        <p>
          <label>
            <input
              type="checkbox"
              checked={prefs.stimulation === 'low'}
              onChange={(e) =>
                change(
                  { stimulation: e.target.checked ? 'low' : 'standard' },
                  e.target.checked ? 'Less colour.' : 'Standard colour.',
                )
              }
            />{' '}
            Use less colour
          </label>
        </p>
        <p>
          <small>
            Removes the coloured panels behind messages. Nothing is hidden: every message still says what it is in
            words, and still carries its own mark.
          </small>
        </p>
      </fieldset>

      <p>
        <button type="button" onClick={() => change(DEFAULT_PREFERENCES, 'Everything is back to standard.')}>
          Put everything back to standard
        </button>
      </p>
      <p>
        If someone is helping you use this, the banner at the top of every screen is where that is turned on and off.
      </p>

      <p aria-live="polite" role="status">
        {announcement}
      </p>
    </section>
  );
}
