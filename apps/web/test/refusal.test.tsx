import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { ProtocolDecisions } from '../src/components/approver/ProtocolDecisions.js';
import { EvidenceReviews } from '../src/components/approver/EvidenceReviews.js';

const session = { actorId: 'actor_approver', authStrength: 'mfa' as const };

/**
 * Every approval screen in the platform offered exactly one outcome, so
 * the only way to clear a queue was to approve everything in it. Five of
 * the artefacts carried a refusal in their CHECK constraint that no code
 * could write.
 */
function stubFetch(rows: Record<string, unknown>) {
  const calls: { path: string; method: string; body: Record<string, unknown> | undefined }[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (path: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET';
      calls.push({
        path,
        method,
        body: typeof init?.body === 'string' ? (JSON.parse(init.body) as Record<string, unknown>) : undefined,
      });
      const hit = Object.entries(rows).find(([prefix]) => path.startsWith(prefix));
      return new Response(JSON.stringify(hit === undefined ? { data: [] } : hit[1]), { status: 200 });
    }),
  );
  return calls;
}

const protocolRow = (submittedBy: string) => ({
  '/v1/protocol-versions/in-review': {
    data: [
      {
        type: 'ProtocolVersion',
        id: 'pv_7',
        attributes: {
          protocolVersionId: 'pv_7',
          researchProjectId: 'rp_1',
          versionNumber: 2,
          contentHash: '9b1c4e0a7d55f2318a6e0c4477bd91ea3c8f2d6b17a409e5cc0d84f1b2e73a60',
          submittedByActorId: submittedBy,
          updatedAt: '2026-08-01T09:14:00Z',
        },
      },
    ],
  },
});

const reviewRow = (submittedBy: string) => ({
  '/v1/evidence-reviews/awaiting-approval': {
    data: [
      {
        type: 'EvidenceReview',
        id: 'er_1',
        attributes: {
          evidenceReviewId: 'er_1',
          researchProjectId: 'rp_1',
          question: 'Does it help?',
          reviewState: 'In Review',
          submittedByActorId: submittedBy,
          approvedByActorId: null,
          references: [],
          updatedAt: '2026-08-01T09:14:00Z',
        },
      },
    ],
  },
});

describe('saying no', () => {
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('a protocol version can be refused, and refusing needs a reason first', async () => {
    const calls = stubFetch(protocolRow('actor_other'));
    await act(async () => {
      render(<ProtocolDecisions session={session} />);
    });
    const refuse = screen.getByRole('button', { name: 'Refuse this version' });
    expect(refuse).toHaveProperty('disabled', true);
    fireEvent.change(screen.getByLabelText('Why you are not accepting it (required)'), {
      target: { value: 'The consent wording does not match the scopes the platform enforces' },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Refuse this version' }));
    });
    // The consequence is stated where the decision is taken.
    expect(screen.getByRole('alertdialog').textContent).toContain('stored with it so whoever submitted it can see why');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    });
    const posted = calls.find((c) => c.method === 'POST' && c.path.endsWith('/reject'));
    expect(posted?.path).toBe('/v1/protocol-versions/pv_7/reject');
    expect(posted?.body).toMatchObject({ confirmed: true });
    expect(String(posted?.body?.['reason'])).toContain('does not match the scopes');
  });

  /** Refusing is the same authority as approving and carries the same
   *  separation of duties. */
  it('you cannot refuse what you submitted', async () => {
    stubFetch(protocolRow('actor_approver'));
    await act(async () => {
      render(<ProtocolDecisions session={session} />);
    });
    fireEvent.change(screen.getByLabelText('Why you are not accepting it (required)'), {
      target: { value: 'on reflection' },
    });
    expect(screen.getByRole('button', { name: 'Refuse this version' })).toHaveProperty('disabled', true);
  });

  it('an evidence review can be sent back, and the wording does not say it was thrown away', async () => {
    const calls = stubFetch(reviewRow('actor_other'));
    await act(async () => {
      render(<EvidenceReviews session={session} />);
    });
    expect(screen.getByText(/It is not approved and it is not thrown away/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Why you are not accepting it (required)'), {
      target: { value: 'Nothing is attached to check it against' },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Send this review back' }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    });
    const posted = calls.find((c) => c.method === 'POST');
    expect(posted?.path).toBe('/v1/evidence-reviews/er_1/return');
    expect(String(posted?.body?.['reason'])).toContain('Nothing is attached');
  });
});
