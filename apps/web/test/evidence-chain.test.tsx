import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { EvidenceWork } from '../src/components/EvidenceWork.js';
import { StaffApproverPanel } from '../src/components/StaffApproverPanel.js';

const researcher = { actorId: 'actor_res', authStrength: 'password' as const };
const reviewer = { actorId: 'actor_rev', authStrength: 'mfa' as const };

const resolvedRef = {
  knowledgeReferenceId: 'kr_1',
  externalIdentifier: 'kp-ref-0001',
  title: 'Loneliness in later life',
  sourceSystem: 'knowledge-platform-simulator',
  externalVersion: 'v3',
  resolutionState: 'Resolved',
  retrievedAt: '2026-08-04T00:00:00Z',
};

const failedRef = {
  knowledgeReferenceId: 'kr_2',
  externalIdentifier: 'kp-ref-9999',
  title: 'kp-ref-9999',
  sourceSystem: 'unknown',
  externalVersion: null,
  resolutionState: 'Resolution Failed',
  retrievedAt: null,
};

const review = (over: Record<string, unknown> = {}) => ({
  type: 'EvidenceReview',
  id: 'er_1',
  attributes: {
    evidenceReviewId: 'er_1',
    researchProjectId: 'rp_1',
    question: 'Does life story work improve connectedness?',
    reviewState: 'Draft',
    submittedByActorId: null,
    approvedByActorId: null,
    references: [resolvedRef],
    updatedAt: '2026-08-04T00:00:00Z',
    ...over,
  },
});

function stubFetch(byPath: Record<string, unknown>, failPaths: string[] = []) {
  const calls: { path: string; method: string; body: Record<string, unknown> }[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (path: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET';
      calls.push({
        path,
        method,
        body: method === 'GET' ? {} : (JSON.parse(init!.body as string) as Record<string, unknown>),
      });
      if (failPaths.some((f) => path.startsWith(f))) {
        return new Response(
          JSON.stringify({
            error: { code: 'DEPENDENCY_UNAVAILABLE', message: 'x', requestId: 'r', retryable: true },
          }),
          { status: 503 },
        );
      }
      if (method !== 'GET') return new Response(JSON.stringify({ data: { id: 'x' } }), { status: 201 });
      return new Response(JSON.stringify(byPath[path.split('?')[0] ?? path] ?? { data: [] }), { status: 200 });
    }),
  );
  return calls;
}

/**
 * Searching worked and attaching a reference worked; nothing listed a
 * review, so the chain had no middle and the reviewer's queue at the end
 * had nothing anyone could reach.
 */
describe('building an evidence review', () => {
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('a search result leads with its source, not its summary', async () => {
    const calls = stubFetch({
      '/v1/evidence-reviews/mine': { data: [] },
      '/v1/evidence/search': {
        data: [
          {
            type: 'KnowledgeResource',
            id: 'kp-ref-0001',
            attributes: {
              externalIdentifier: 'kp-ref-0001',
              title: 'Loneliness in later life',
              sourceSystem: 'knowledge-platform-simulator',
              externalVersion: 'v3',
              summary: 'A review of interventions.',
            },
          },
        ],
      },
    });
    await act(async () => {
      render(<EvidenceWork session={researcher} />);
    });
    await act(async () => {
      fireEvent.change(screen.getByLabelText('What are you looking for'), { target: { value: 'loneliness' } });
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    });
    expect(calls.some((c) => c.path.startsWith('/v1/evidence/search?q=loneliness'))).toBe(true);
    const card = screen.getByRole('article', { name: 'Result kp-ref-0001' });
    // Source and version precede the title and the summary.
    const text = card.textContent ?? '';
    expect(text.indexOf('knowledge-platform-simulator')).toBeLessThan(text.indexOf('A review of interventions'));
    expect(text).toContain('version v3');
  });

  it('a failure to reach the knowledge platform is not shown as "no evidence"', async () => {
    stubFetch({ '/v1/evidence-reviews/mine': { data: [] } }, ['/v1/evidence/search']);
    await act(async () => {
      render(<EvidenceWork session={researcher} />);
    });
    await act(async () => {
      fireEvent.change(screen.getByLabelText('What are you looking for'), { target: { value: 'loneliness' } });
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    });
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.queryByText(/Nothing came back for that/)).toBeNull();
  });

  it('a reference that could not be found is not rendered as a citation', async () => {
    stubFetch({ '/v1/evidence-reviews/mine': { data: [review({ references: [resolvedRef, failedRef] })] } });
    await act(async () => {
      render(<EvidenceWork session={researcher} />);
    });
    expect(screen.getByText(/Could not be found\. Nothing here has been checked against a source/)).toBeTruthy();
    expect(screen.getByText(/Found in the source system/)).toBeTruthy();
  });

  it('a review with nothing attached cannot be submitted, and says why', async () => {
    stubFetch({ '/v1/evidence-reviews/mine': { data: [review({ references: [] })] } });
    await act(async () => {
      render(<EvidenceWork session={researcher} />);
    });
    expect(screen.getByText(/rests on nothing/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Submit for review' })).toHaveProperty('disabled', true);
  });

  it('submitting says someone else must approve it', async () => {
    const calls = stubFetch({ '/v1/evidence-reviews/mine': { data: [review()] } });
    await act(async () => {
      render(<EvidenceWork session={researcher} />);
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Submit for review' }));
    });
    expect(calls.find((c) => c.method === 'POST')?.path).toBe('/v1/evidence-reviews/er_1/submit');
    expect(screen.getByRole('status').textContent).toContain('cannot approve your own');
  });
});

describe('approving an evidence review', () => {
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  const openTab = async (payload: unknown) => {
    const calls = stubFetch({ '/v1/evidence-reviews/awaiting-approval': payload });
    await act(async () => {
      render(<StaffApproverPanel session={reviewer} />);
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Evidence reviews' }));
    });
    return calls;
  };

  it('warns when references were not confirmed, and says approving does not confirm them', async () => {
    const calls = await openTab({
      data: [
        review({
          reviewState: 'In Review',
          submittedByActorId: 'actor_res',
          references: [resolvedRef, failedRef],
        }),
      ],
    });
    expect(screen.getByRole('alert').textContent).toContain('1 of 2 references were not confirmed');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Approve this review' }));
    });
    const dialog = screen.getByRole('alertdialog').textContent ?? '';
    expect(dialog).toContain('approving does not resolve them');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /^Confirm: / }));
    });
    expect(calls.find((c) => c.method === 'POST')?.path).toBe('/v1/evidence-reviews/er_1/approve');
  });

  it('a fully resolved review carries no warning', async () => {
    await openTab({ data: [review({ reviewState: 'In Review', submittedByActorId: 'actor_res' })] });
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('your own submission is refused before the button, not after', async () => {
    await openTab({ data: [review({ reviewState: 'In Review', submittedByActorId: reviewer.actorId })] });
    expect(screen.getByRole('button', { name: 'Approve this review' })).toHaveProperty('disabled', true);
  });
});
