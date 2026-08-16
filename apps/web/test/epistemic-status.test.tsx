import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { EpistemicStatus } from '../src/components/EpistemicStatus.js';

/**
 * DESIGN_BRIEF §3 requires every concluding element in the researcher
 * interface to say which kind of knowledge it is, and nothing had been
 * built — no epistemic tags, and no marking anywhere that the outputs rest
 * on synthetic data. A researcher could read an analysis output, an
 * interpretation and a finding without meeting a single word saying none
 * of it describes anything that happened to a person.
 *
 * These pin the two halves of the honest answer: the claim that is true by
 * construction is made, and the claim the platform cannot support is
 * refused out loud rather than left as a blank.
 */
describe('what kind of knowledge is on the research screens', () => {
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('marks the data as synthetic and refuses the empirical reading of it', () => {
    render(<EpistemicStatus authMode="google" />);
    expect(screen.getByText(/\[synthetic data\]/)).toBeTruthy();
    expect(screen.getByText(/is synthetic, produced for a conceptual research prototype/)).toBeTruthy();
    const text = screen.getByRole('note').textContent ?? '';
    expect(text).toContain('no output, interpretation, finding or report from this platform is empirical evidence');
    expect(text).toContain('none of it may be written up as though it were');
  });

  /**
   * Saying what it is not is only half of it. A researcher told the data is
   * worthless would be told something false: coherence is exactly what a
   * conceptual prototype can show, and leaving that out invites the screens
   * to be dismissed rather than read carefully.
   */
  it('says what the prototype can show, not only what it cannot', () => {
    render(<EpistemicStatus authMode="google" />);
    expect(screen.getByText(/whether the model is coherent/)).toBeTruthy();
  });

  /**
   * The absence of per-item tags has to be stated, or it reads as an
   * omission — or worse, as though somebody classified these items and the
   * label merely failed to render. There is no field to hold such a tag and
   * nothing writes one, so a per-item label would be invented at render
   * time: the empty control this project keeps dismantling.
   */
  it('names the tagging it cannot do, and why, rather than leaving a blank', () => {
    render(<EpistemicStatus authMode="google" />);
    const text = screen.getByRole('note').textContent ?? '';
    expect(text).toContain('not');
    expect(text).toContain('nowhere to record such a tag');
    expect(text).toContain('would be invented rather than recorded');
    // And it explains why one statement covers everything, so the reader
    // does not go looking for per-item labels that will never appear.
    expect(text).toContain('without exception');
  });

  /**
   * Under the development stub the identity is whatever the caller claims
   * (ADR-104), so the stronger sentence is available. Under Google the
   * people signing in are real staff — the data is still synthetic, and
   * that claim must not weaken with the auth mode.
   */
  it('adds the unverified-identity fact only where it is true', () => {
    const { unmount } = render(<EpistemicStatus authMode="dev-header" />);
    expect(screen.getByText(/nobody signing in has been verified/)).toBeTruthy();
    unmount();
    render(<EpistemicStatus authMode="google" />);
    expect(screen.queryByText(/nobody signing in has been verified/)).toBeNull();
    // The synthetic-data claim is the one that does not vary.
    expect(screen.getByText(/\[synthetic data\]/)).toBeTruthy();
  });
});
