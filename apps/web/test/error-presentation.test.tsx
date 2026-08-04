import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { act } from 'react';
import { PlatformApiError } from '../src/api.js';
import { presentError, staffActionError, staffLoadError } from '../src/errors.js';
import { EmptyState, ErrorState, LoadingState } from '../src/components/StateBlock.js';

const apiError = (code: string, status: number) =>
  new PlatformApiError({ code, message: 'm', requestId: 'r', retryable: false }, status);

/**
 * The contract this pins down is not "an error is displayed" — it is that
 * a person reading the screen learns what happened, that their work
 * survived, and what to do next, without being handed a code or blamed.
 */
describe('error presentation', () => {
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });
  afterEach(cleanup);

  it('every mapped error says what survived and what to do next', () => {
    for (const code of [
      'AUTHORISATION_DENIED',
      'CONSENT_REQUIRED',
      'BLOCKED_INTERACTION',
      'VERSION_CONFLICT',
      'DEPENDENCY_UNAVAILABLE',
      'RESOURCE_NOT_FOUND',
    ]) {
      const p = presentError(apiError(code, 400));
      expect(p.title.length).toBeGreaterThan(0);
      expect(p.reassurance.length).toBeGreaterThan(0);
      expect(p.nextStep.length).toBeGreaterThan(0);
      // No blame, no bare codes in the human-facing text. "not something
      // you did wrong" is the opposite of blame, so negated forms are
      // stripped before the check rather than counted as violations.
      for (const text of [p.title, p.reassurance, p.reason ?? '', p.nextStep]) {
        expect(text).not.toContain(code);
        const withoutDenials = text
          .toLowerCase()
          .replace(/\bnot\s+(something\s+)?you\s+did\s+wrong\b/g, '')
          .replace(/\bnothing\s+you\s+did\s+wrong\b/g, '');
        expect(withoutDenials).not.toMatch(/you (did|entered) (something )?wrong|your mistake|invalid input by you/);
      }
    }
  });

  it('a protected-existence 404 never confirms the thing exists', () => {
    const p = presentError(apiError('RESOURCE_NOT_FOUND', 404));
    // It must hold for both "wrong identifier" and "not yours to see".
    expect(p.reason).toContain('identifier may be incorrect');
    expect(p.reason).toContain('may not be open to you');
  });

  it('an unmapped code admits the outcome is unknown instead of guessing', () => {
    const p = presentError(apiError('SOMETHING_NEW', 500));
    expect(p.reason).toContain('we do not know whether it took effect');
    expect(p.nextStep).toContain('rather than submitting again');
  });

  it('a non-API failure is reported as a network problem, not a server verdict', () => {
    const p = presentError(new TypeError('fetch failed'));
    expect(p.code).toBe('NETWORK');
    expect(p.severity).toBe(1);
  });

  it('the technical code is rendered but collapsed', async () => {
    await act(async () => {
      render(<ErrorState error={presentError(apiError('CONSENT_REQUIRED', 403))} />);
    });
    const alert = screen.getByRole('alert');
    const details = alert.querySelector('details');
    expect(details!.open).toBe(false);
    expect(details!.textContent).toContain('CONSENT_REQUIRED');
  });

  it('severity picks the semantic family; safety-critical is not styled as danger', async () => {
    await act(async () => {
      render(<ErrorState error={{ ...presentError(apiError('X', 500)), severity: 3 }} />);
    });
    expect(screen.getByRole('alert').className).toContain('state--safety');
  });

  /**
   * Staff keep the code — they act on it — but the line has to say why and
   * what to do, and it must not claim to know an outcome it cannot know.
   */
  it('a refused staff command says nothing changed; an unreachable server admits it does not know', () => {
    const refused = staffActionError(apiError('AUTHORISATION_DENIED', 403), 'Approve protocol version');
    expect(refused).toContain('Approve protocol version was refused');
    expect(refused).toContain('separation of duties');
    expect(refused).toContain('Nothing changed');
    expect(refused).toContain('Next:');
    expect(refused).toContain('(AUTHORISATION_DENIED)');

    // A transport failure can happen after the server applied the command,
    // so "nothing was submitted" would be a guess stated as fact.
    const unreachable = staffActionError(new TypeError('fetch failed'), 'Approve protocol version');
    expect(unreachable).toContain('whether it took effect is unknown');
    expect(unreachable).not.toContain('Nothing changed');
    expect(unreachable).toContain('Reload the queue');

    // An unmapped code is the same problem: unknown, so do not repeat it.
    const unmapped = staffActionError(apiError('SOMETHING_NEW', 500), 'Lock dataset version');
    expect(unmapped).toContain('whether it took effect is unknown');
    expect(unmapped).toContain('rather than repeating it');
  });

  it('a staff read failure states plainly that a read changed nothing', () => {
    const line = staffLoadError(apiError('RESOURCE_NOT_FOUND', 404), 'pending work');
    expect(line).toContain('Could not load pending work');
    // Protected existence holds on the staff side too: the line must not
    // resolve "does not exist" versus "outside your scope".
    expect(line).toContain('deliberately indistinguishable');
    expect(line).toContain('Nothing changed');
    expect(line).toContain('(RESOURCE_NOT_FOUND)');
  });

  it('loading and empty are different statements, both carrying an icon and words', async () => {
    await act(async () => {
      render(
        <>
          <LoadingState label="Loading communities…" />
          <EmptyState title="No communities are open yet" detail="Any community that opens will appear here." />
        </>,
      );
    });
    // "Still loading" is announced politely; "nothing there" is a fact on
    // the page, not a status update.
    expect(screen.getByRole('status').textContent).toContain('Loading');
    expect(screen.getByText('No communities are open yet')).toBeTruthy();
  });
});
