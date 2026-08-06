import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { Interventions } from '../src/components/Interventions.js';
import { InterventionDecisions } from '../src/components/approver/InterventionDecisions.js';

const researcher = { actorId: 'actor_r', authStrength: 'password' as const, organisationId: 'org_1' };
const approver = { actorId: 'actor_a', authStrength: 'mfa' as const, organisationId: 'org_1' };

const PORTFOLIO = {
  data: [
    {
      type: 'Intervention',
      id: 'int_1',
      attributes: {
        interventionId: 'int_1',
        interventionCode: 'INT-001',
        name: 'Life story work with a supporter',
        lifecycleMaturity: 'Concept',
        evidenceStatus: 'E0',
        evidenceDirection: 'Not Evaluated',
        versions: [
          {
            interventionVersionId: 'iv_2',
            versionNumber: 2,
            versionState: 'In Review',
            submittedByActorId: 'actor_r',
            approvedByActorId: null,
            approvedAt: null,
            recordVersion: 2,
            createdAt: '2026-08-06T00:00:00Z',
          },
          {
            interventionVersionId: 'iv_1',
            versionNumber: 1,
            versionState: 'Active',
            submittedByActorId: 'actor_r',
            approvedByActorId: 'actor_a',
            approvedAt: '2026-08-05T00:00:00Z',
            recordVersion: 4,
            createdAt: '2026-08-04T00:00:00Z',
          },
        ],
      },
    },
  ],
};

function stubFetch(body: unknown = PORTFOLIO) {
  const calls: { path: string; method: string }[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (path: string, init?: RequestInit) => {
      calls.push({ path, method: init?.method ?? 'GET' });
      if ((init?.method ?? 'GET') === 'GET') return new Response(JSON.stringify(body), { status: 200 });
      return new Response(JSON.stringify({ data: { id: 'x' } }), { status: 201 });
    }),
  );
  return calls;
}

/**
 * M06 had six commands, no query at all, and no caller anywhere in the
 * product. On the module the platform is named after, the interventions
 * were the one thing nobody could look at.
 */
describe('the intervention portfolio', () => {
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  /**
   * Both evidence columns carry their database defaults on every row
   * because nothing writes either one. Printing "E0" beside an
   * intervention would read as an assessment somebody made — the most
   * misleading blank available on a platform about evidence.
   */
  it('does not show an evidence grade nobody awarded', async () => {
    stubFetch();
    await act(async () => {
      render(<Interventions session={researcher} />);
    });
    expect(screen.getByText(/INT-001 — Life story work with a supporter/)).toBeTruthy();
    expect(screen.getByText(/are not recorded anywhere in this platform/i)).toBeTruthy();
    expect(document.body.textContent).not.toContain('E0');
    expect(document.body.textContent).not.toContain('Not Evaluated');
  });

  it('offers only the step a version’s state allows, and says whose the others are', async () => {
    stubFetch();
    await act(async () => {
      render(<Interventions session={researcher} />);
    });
    // The active version and the submitted one are both listed; neither
    // can be submitted again, so no submit control exists for them.
    expect(screen.queryByRole('button', { name: /Submit version/ })).toBeNull();
    expect(screen.getByText(/Approving and activating are not here/i)).toBeTruthy();
  });

  it('the approver sees what is waiting, and activation says what it replaces', async () => {
    stubFetch();
    await act(async () => {
      render(<InterventionDecisions session={approver} />);
    });
    expect(screen.getByRole('button', { name: 'Approve version 2' })).toBeTruthy();
    // Version 1 is Active, not Approved, so it offers nothing.
    expect(screen.queryByRole('button', { name: /Put version 1 into use/ })).toBeNull();
  });

  it('an approved version says which version putting it into use replaces', async () => {
    stubFetch({
      data: [
        {
          type: 'Intervention',
          id: 'int_1',
          attributes: {
            ...PORTFOLIO.data[0]!.attributes,
            versions: [
              {
                interventionVersionId: 'iv_2', versionNumber: 2, versionState: 'Approved',
                submittedByActorId: 'actor_r', approvedByActorId: 'actor_a',
                approvedAt: '2026-08-06T00:00:00Z', recordVersion: 3, createdAt: '2026-08-06T00:00:00Z',
              },
              {
                interventionVersionId: 'iv_1', versionNumber: 1, versionState: 'Active',
                submittedByActorId: 'actor_r', approvedByActorId: 'actor_a',
                approvedAt: '2026-08-05T00:00:00Z', recordVersion: 4, createdAt: '2026-08-04T00:00:00Z',
              },
            ],
          },
        },
      ],
    });
    await act(async () => {
      render(<InterventionDecisions session={approver} />);
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Put version 2 into use' }));
    });
    expect(screen.getByText(/This replaces version 1, which stops being the one in use/i)).toBeTruthy();
  });
});
