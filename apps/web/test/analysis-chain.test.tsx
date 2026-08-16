import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { act } from 'react';
import { AnalysisWork } from '../src/components/AnalysisWork.js';
import { StaffApproverPanel } from '../src/components/StaffApproverPanel.js';
import type { StaffSession } from '../src/staff-api.js';

const researcher = { actorId: 'actor_res', authStrength: 'password' as const };
const approver = { actorId: 'actor_app', authStrength: 'mfa' as const };
const weakApprover = { actorId: 'actor_app', authStrength: 'password' as const };

const plan = (over: Record<string, unknown> = {}) => ({
  analysisPlanId: 'ap_1',
  researchProjectId: 'rp_1',
  title: 'Feasibility descriptives',
  planState: 'Approved',
  draftedByActorId: 'actor_res',
  approvedByActorId: 'actor_app',
  updatedAt: '2026-08-04T00:00:00Z',
  ...over,
});

const datasetRow = (over: Record<string, unknown> = {}) => ({
  type: 'DatasetDefinition',
  id: 'dd_1:dv_1',
  attributes: {
    datasetDefinitionId: 'dd_1',
    name: 'pilot-feasibility',
    definitionState: 'Approved',
    approvedByActorId: 'actor_app',
    datasetVersionId: 'dv_1',
    versionNumber: 1,
    versionState: 'Locked',
    rowCount: 24,
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
 * Every step of the analysis chain had a command and none had a screen,
 * so it could only be followed by someone driving the API directly.
 */
describe('the analysis chain', () => {
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  const open = async (over: Record<string, unknown> = {}) => {
    const calls = stubFetch({
      '/v1/analysis-work': { data: { plans: [plan()], runs: [], interpretations: [], findings: [] } },
      '/v1/dataset-work': { data: [datasetRow()] },
      ...over,
    });
    await act(async () => {
      render(<AnalysisWork session={researcher} />);
    });
    return calls;
  };

  it('does not claim the platform performs the analysis', async () => {
    await open();
    expect(screen.getByText(/The platform does not perform the analysis/)).toBeTruthy();
    // The control records; it does not run.
    expect(screen.getByRole('button', { name: 'Record this run' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Run the analysis' })).toBeNull();
  });

  it('offers only locked dataset versions, and says why', async () => {
    await open({ '/v1/dataset-work': { data: [datasetRow(), datasetRow({ datasetVersionId: 'dv_2', versionState: 'Generated' })] } });
    const select = screen.getByLabelText('Locked dataset version') as HTMLSelectElement;
    const values = [...select.options].map((o) => o.value);
    expect(values).toContain('dv_1');
    // A generated-but-unlocked version is not offered: the server refuses it.
    expect(values).not.toContain('dv_2');
    expect(screen.getByText(/an interpretation is about a run, and a run is about exactly that data/)).toBeTruthy();
  });

  it('says plainly when nothing has been locked yet, rather than offering an empty picker', async () => {
    await open({ '/v1/dataset-work': { data: [datasetRow({ versionState: 'Generated' })] } });
    expect(screen.getByText(/No dataset version has been locked yet/)).toBeTruthy();
  });

  it('recording a run posts the plan, the exact version and what it produced', async () => {
    const calls = await open();
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Plan'), { target: { value: 'ap_1' } });
      fireEvent.change(screen.getByLabelText('Locked dataset version'), { target: { value: 'dv_1' } });
      fireEvent.change(screen.getByLabelText('What the analysis produced'), { target: { value: 'Mean 4.2' } });
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Record this run' }));
    });
    const post = calls.find((c) => c.method === 'POST');
    expect(post?.path).toBe('/v1/analysis-runs');
    expect(post?.body['datasetVersionId']).toBe('dv_1');
    expect(screen.getByRole('status').textContent).toContain('against that exact dataset version');
  });

  it('shows the manifest hash of the dataset a run was made against', async () => {
    await open({
      '/v1/analysis-work': {
        data: {
          plans: [plan()],
          runs: [
            {
              analysisRunId: 'ar_1',
              analysisPlanId: 'ap_1',
              planTitle: 'Feasibility descriptives',
              datasetVersionId: 'dv_1',
              datasetManifestHash: 'd'.repeat(64),
              runState: 'Completed',
              startedByActorId: 'actor_res',
              createdAt: '2026-08-04T00:00:00Z',
            },
          ],
          interpretations: [],
          findings: [],
        },
      },
    });
    expect(screen.getByText('d'.repeat(64))).toBeTruthy();
  });

  it('a finding needs an approved interpretation, and says so when there is none', async () => {
    await open();
    expect(screen.getByText(/No interpretation has been approved yet/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Write this finding' })).toHaveProperty('disabled', true);
  });
  /**
   * The outcome was hardcoded to 'Completed' in the command, so every run
   * on record claimed a clean completion whatever had happened. An
   * analysis that fell over could only be written down as though it had
   * gone perfectly, and an interpretation drawn from it carried no hint
   * otherwise.
   */
  it('a run can say it failed, and says what that leaves behind', async () => {
    await open();
    // The states that would describe a machine this platform does not
    // have are not offered, and the screen says why.
    expect(screen.getByText(/would describe a machine that does not exist/i)).toBeTruthy();
    await act(async () => {
      fireEvent.change(screen.getByLabelText('How it went'), { target: { value: 'Failed' } });
    });
    expect(screen.getByText(/leaves the dataset version as it was — locked, not analysed/i)).toBeTruthy();
    // The prompt changes with it: a failed run has no output to describe.
    expect(screen.getByLabelText('What went wrong')).toBeTruthy();
  });
});

describe('approving along the analysis chain', () => {
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  const payload = (over: Record<string, unknown> = {}) => ({
    data: {
      plans: [plan({ planState: 'Draft', approvedByActorId: null })],
      interpretations: [
        {
          interpretationRecordId: 'ir_1',
          analysisRunId: 'ar_1',
          planTitle: 'Feasibility descriptives',
          interpretationText: 'Uptake was even across sites.',
          interpretationState: 'Draft',
          draftedByActorId: 'actor_res',
          approvedByActorId: null,
          updatedAt: '2026-08-04T00:00:00Z',
        },
      ],
      findings: [
        {
          researchFindingId: 'rf_1',
          interpretationRecordId: 'ir_1',
          planTitle: 'Feasibility descriptives',
          findingText: 'The design is feasible at this scale.',
          findingState: 'Draft',
          draftedByActorId: 'actor_res',
          approvedByActorId: null,
          updatedAt: '2026-08-04T00:00:00Z',
        },
      ],
      ...over,
    },
  });

  const openTab = async (session: StaffSession, body: unknown = payload()) => {
    const calls = stubFetch({ '/v1/analysis-approvals': body });
    await act(async () => {
      render(<StaffApproverPanel session={session} />);
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Analysis' }));
    });
    return calls;
  };

  /**
   * Only `finding.approve` is MFA-tier. Repeating the notice over the
   * plan and interpretation sections would overstate what those cost and
   * teach people to scroll past the one that is real.
   */
  it('carries the strong-authentication notice only where it is true', async () => {
    await openTab(weakApprover);
    const notes = screen.getAllByRole('note').map((n) => n.textContent ?? '');
    expect(notes).toHaveLength(1);
    expect(notes[0]).toContain('research finding');
  });

  it('approving a plan says it permits runs but does not run anything', async () => {
    const calls = await openTab(approver);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Approve this plan' }));
    });
    const dialog = screen.getByRole('alertdialog').textContent ?? '';
    expect(dialog).toContain('It does not run anything');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /^Confirm: / }));
    });
    expect(calls.find((c) => c.method === 'POST')?.path).toBe('/v1/analysis-plans/ap_1/approve');
  });

  it('a finding names the interpretation and run it rests on', async () => {
    await openTab(approver);
    const article = screen.getByRole('article', { name: 'Research finding rf_1' });
    expect(within(article).getByText('ir_1')).toBeTruthy();
  });

  it('your own draft is refused before the button, not after', async () => {
    await openTab({ ...approver, actorId: 'actor_res' });
    expect(screen.getByRole('button', { name: 'Approve this plan' })).toHaveProperty('disabled', true);
    expect(screen.getByRole('button', { name: 'Approve this finding' })).toHaveProperty('disabled', true);
  });

  it('an empty chain says so rather than looking unloaded', async () => {
    await openTab(approver, { data: { plans: [], interpretations: [], findings: [] } });
    expect(screen.getByText('Nothing along the analysis chain is waiting to be approved.')).toBeTruthy();
  });

});
