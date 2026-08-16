import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { EvidenceDecisionWork } from '../src/components/EvidenceDecisionWork.js';
import { StaffApproverPanel } from '../src/components/StaffApproverPanel.js';

const researcher = { actorId: 'actor_res', authStrength: 'password' as const };
const reviewer = { actorId: 'actor_rev', authStrength: 'mfa' as const };

const reviewRow = (over: Record<string, unknown> = {}) => ({
  type: 'EvidenceReview',
  id: 'er_1',
  attributes: {
    evidenceReviewId: 'er_1',
    researchProjectId: 'rp_1',
    question: 'Does life story work improve connectedness?',
    reviewState: 'Approved',
    submittedByActorId: 'actor_res',
    approvedByActorId: 'actor_rev',
    references: [],
    updatedAt: '2026-08-04T00:00:00Z',
    ...over,
  },
});

const decisionRow = (over: Record<string, unknown> = {}) => ({
  type: 'EvidenceDecision',
  id: 'ed_1',
  attributes: {
    evidenceDecisionId: 'ed_1',
    evidenceReviewId: 'er_1',
    question: 'Does life story work improve connectedness?',
    reviewState: 'Approved',
    outcome: 'Conflicting Evidence',
    rationale: 'Two trials point opposite ways.',
    approvalState: 'Draft',
    draftedByActorId: 'actor_res',
    approvedByActorId: null,
    snapshotContentHash: null,
    updatedAt: '2026-08-04T00:00:00Z',
    ...over,
  },
});

function stubFetch(byPath: Record<string, unknown>) {
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
      if (method !== 'GET') return new Response(JSON.stringify({ data: { id: 'x' } }), { status: 201 });
      return new Response(JSON.stringify(byPath[path] ?? { data: [] }), { status: 200 });
    }),
  );
  return calls;
}

/**
 * "Conflicting evidence" is a first-class outcome, not a failure to reach
 * one. A vocabulary offering only support or refusal would push whoever
 * writes the decision into overstating one side (Doc 20 §60).
 */
describe('writing an evidence decision', () => {
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  const open = async (byPath: Record<string, unknown> = {}) => {
    const calls = stubFetch({
      '/v1/evidence-decisions/mine': { data: [] },
      '/v1/evidence-reviews/mine': { data: [reviewRow()] },
      ...byPath,
    });
    await act(async () => {
      render(<EvidenceDecisionWork session={researcher} />);
    });
    return calls;
  };

  it('offers conflicting evidence as an outcome, described as a finding', async () => {
    await open();
    const select = screen.getByLabelText('What the evidence says') as HTMLSelectElement;
    const options = [...select.options].map((o) => o.value);
    expect(options).toContain('Conflicting Evidence');
    // Approval is not an outcome: the vocabulary keeps "what the evidence
    // says" apart from "who agreed".
    expect(options).not.toContain('Approved');
    expect(options).not.toContain('Rejected');
    await act(async () => {
      fireEvent.change(select, { target: { value: 'Conflicting Evidence' } });
    });
    expect(screen.getByText(/a finding in its own right, not a failure to reach one/)).toBeTruthy();
  });

  it('distinguishes conflicting from insufficient', async () => {
    await open();
    await act(async () => {
      fireEvent.change(screen.getByLabelText('What the evidence says'), {
        target: { value: 'Insufficient Evidence' },
      });
    });
    expect(screen.getByText(/little was found, rather than found and disagreeing/)).toBeTruthy();
  });

  it('warns when the review has not been approved, without blocking it', async () => {
    await open({ '/v1/evidence-reviews/mine': { data: [reviewRow({ reviewState: 'Draft' })] } });
    await act(async () => {
      fireEvent.change(screen.getByLabelText('The review this is drawn from'), { target: { value: 'er_1' } });
    });
    expect(screen.getByRole('alert').textContent).toContain('rests on evidence nobody else has checked');
    await act(async () => {
      fireEvent.change(screen.getByLabelText(/Why/), { target: { value: 'Reasoning.' } });
    });
    // The server permits this, so the screen does not invent a rule.
    expect(screen.getByRole('button', { name: 'Write this decision' })).toHaveProperty('disabled', false);
  });

  it('a written decision says a second person is needed', async () => {
    const calls = await open();
    await act(async () => {
      fireEvent.change(screen.getByLabelText('The review this is drawn from'), { target: { value: 'er_1' } });
      fireEvent.change(screen.getByLabelText(/Why/), { target: { value: 'Two trials disagree.' } });
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Write this decision' }));
    });
    const post = calls.find((c) => c.method === 'POST');
    expect(post?.path).toBe('/v1/evidence-decisions');
    expect(post?.body['rationale']).toBe('Two trials disagree.');
    expect(screen.getByRole('status').textContent).toContain('Someone else has to agree it');
  });

  it('an agreed decision shows the snapshot it is cited by', async () => {
    await open({
      '/v1/evidence-decisions/mine': {
        data: [decisionRow({ approvalState: 'Approved', snapshotContentHash: 'c'.repeat(64) })],
      },
    });
    expect(screen.getByText('c'.repeat(64))).toBeTruthy();
    expect(screen.getByText('Agreed by a second person.')).toBeTruthy();
  });
});

describe('agreeing an evidence decision', () => {
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  const openTab = async (payload: unknown) => {
    const calls = stubFetch({ '/v1/evidence-decisions/awaiting-approval': payload });
    await act(async () => {
      render(<StaffApproverPanel session={reviewer} />);
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Evidence decisions' }));
    });
    return calls;
  };

  it('says agreeing writes an unchangeable snapshot that later work cites', async () => {
    const calls = await openTab({ data: [decisionRow()] });
    expect(screen.getByText(/The evidence conflicts — sources disagree/)).toBeTruthy();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Agree this decision' }));
    });
    const dialog = screen.getByRole('alertdialog').textContent ?? '';
    expect(dialog).toContain('cannot be changed afterwards');
    expect(dialog).toContain('has to be a new decision');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /^Confirm: / }));
    });
    expect(calls.find((c) => c.method === 'POST')?.path).toBe('/v1/evidence-decisions/ed_1/approve');
  });

  it('flags a decision drawn from a review that was never approved', async () => {
    await openTab({ data: [decisionRow({ reviewState: 'Draft' })] });
    expect(screen.getByRole('alert').textContent).toContain('Agreeing this decision does not approve that review');
  });

  it('your own decision is refused before the button, not after', async () => {
    await openTab({ data: [decisionRow({ draftedByActorId: reviewer.actorId })] });
    expect(screen.getByRole('button', { name: 'Agree this decision' })).toHaveProperty('disabled', true);
  });
});
