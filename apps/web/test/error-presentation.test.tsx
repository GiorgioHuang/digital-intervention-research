import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { act } from 'react';
import { PlatformApiError } from '../src/api.js';
import { presentError } from '../src/errors.js';
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
      // No blame, no bare codes in the human-facing text.
      for (const text of [p.title, p.reassurance, p.reason ?? '', p.nextStep]) {
        expect(text).not.toContain(code);
        expect(text).not.toMatch(/你(的操作)?(错|违规)/);
      }
    }
  });

  it('a protected-existence 404 never confirms the thing exists', () => {
    const p = presentError(apiError('RESOURCE_NOT_FOUND', 404));
    // It must hold for both "wrong identifier" and "not yours to see".
    expect(p.reason).toContain('标识不正确');
    expect(p.reason).toContain('不对你开放');
  });

  it('an unmapped code admits the outcome is unknown instead of guessing', () => {
    const p = presentError(apiError('SOMETHING_NEW', 500));
    expect(p.reason).toContain('不确定这次操作是否已经生效');
    expect(p.nextStep).toContain('不要直接重复提交');
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

  it('loading and empty are different statements, both carrying an icon and words', async () => {
    await act(async () => {
      render(
        <>
          <LoadingState label="正在获取社区列表…" />
          <EmptyState title="目前还没有开放的社区" detail="有新的社区开放时，会出现在这里。" />
        </>,
      );
    });
    // "Still loading" is announced politely; "nothing there" is a fact on
    // the page, not a status update.
    expect(screen.getByRole('status').textContent).toContain('正在获取');
    expect(screen.getByText('目前还没有开放的社区')).toBeTruthy();
  });
});
