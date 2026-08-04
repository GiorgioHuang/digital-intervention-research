import type { ReactNode } from 'react';
import { presentError, type PresentedError } from '../errors.js';

/**
 * Shared presentation for the states every list and form can be in
 * (design system §E; Doc 20 §224–237). Two rules carry most of the
 * value here:
 *
 * - "Nothing yet" and "not loaded yet" are different facts and must read
 *   differently; a blank area that means "still loading" is a lie.
 * - Every state is icon + words. Colour is a secondary cue, so the whole
 *   thing still reads in greyscale, in print, and for anyone who does not
 *   perceive the hue difference (§A.1, and Safety is blue now, which
 *   makes this rule load-bearing rather than decorative).
 */
export function LoadingState({ label }: { label: string }) {
  return (
    <p className="state state--info" role="status">
      <span aria-hidden="true">◌</span> {label}
    </p>
  );
}

export function EmptyState({ title, detail }: { title: string; detail?: string }) {
  return (
    <div className="state state--neutral">
      <p>
        <span aria-hidden="true">○</span> <strong>{title}</strong>
      </p>
      {detail !== undefined && <p>{detail}</p>}
    </div>
  );
}

const SEVERITY_ICON: Record<number, string> = { 1: '△', 2: '⬡', 3: '⬟' };
/* Severity maps onto the spec's semantic families: recoverable warns,
   blocking is danger, safety-critical uses the Safety family (blue, so
   the icon and the word carry it — see the decision record D-8). */
const SEVERITY_CLASS: Record<number, string> = {
  1: 'state--warning',
  2: 'state--danger',
  3: 'state--safety',
};

export function ErrorState({ error, actions }: { error: PresentedError; actions?: ReactNode }) {
  return (
    <div className={`state ${SEVERITY_CLASS[error.severity]}`} role="alert">
      <p>
        <span aria-hidden="true">{SEVERITY_ICON[error.severity]}</span> <strong>{error.title}</strong>
      </p>
      <p>{error.reassurance}</p>
      {error.reason !== undefined && <p>{error.reason}</p>}
      <p>{error.nextStep}</p>
      {actions}
      {/* The code helps support and nobody else, so it stays collapsed. */}
      <details>
        <summary>技术细节</summary>
        <p>
          <code>{error.code}</code>
        </p>
      </details>
    </div>
  );
}

/** Convenience for the common `catch (err)` path. */
export function toErrorState(err: unknown): PresentedError {
  return presentError(err);
}
