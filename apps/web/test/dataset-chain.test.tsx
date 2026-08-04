import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { DatasetWork } from '../src/components/DatasetWork.js';
import { StaffApproverPanel } from '../src/components/StaffApproverPanel.js';

const researcher = { actorId: 'actor_res', authStrength: 'password' as const };
const approver = { actorId: 'actor_app', authStrength: 'mfa' as const };

const work = (over: Record<string, unknown> = {}) => ({
  type: 'DatasetDefinition',
  id: 'dd_1:none',
  attributes: {
    datasetDefinitionId: 'dd_1',
    name: 'pilot-feasibility',
    definitionState: 'Draft',
    approvedByActorId: null,
    datasetVersionId: null,
    versionNumber: null,
    versionState: null,
    rowCount: null,
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
 * The chain is define, approve, generate, quality-review, lock. Only the
 * last step had a screen, so the four before it could be performed by
 * nobody and the lock queue could never fill through the product — a
 * decision screen whose queue cannot be populated has never been used.
 */
describe('preparing a dataset', () => {
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('writing a definition names what goes in, and says who may approve it', async () => {
    const calls = stubFetch({ '/v1/dataset-work': { data: [] } });
    await act(async () => {
      render(<DatasetWork session={researcher} />);
    });
    expect(screen.getByText(/anything not named here is not included/i)).toBeTruthy();
    expect(screen.getByText(/You cannot approve what you write here/)).toBeTruthy();
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Research project identifier'), { target: { value: 'rp_1' } });
      fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'pilot' } });
      fireEvent.change(screen.getByLabelText(/Variables to include/), {
        target: { value: 'enrolment_state, exposure_state' },
      });
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Write this definition' }));
    });
    const post = calls.find((c) => c.method === 'POST');
    expect(post?.path).toBe('/v1/dataset-definitions');
    expect(Object.keys(post?.body['variables'] as Record<string, unknown>)).toEqual([
      'enrolment_state',
      'exposure_state',
    ]);
  });

  it('a draft definition offers no way to generate from it', async () => {
    stubFetch({ '/v1/dataset-work': { data: [work()] } });
    await act(async () => {
      render(<DatasetWork session={researcher} />);
    });
    expect(screen.getByText(/Waiting for someone else to approve it/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Generate a version' })).toBeNull();
  });

  it('an approved definition can be generated from, and the version is not called reviewed', async () => {
    const calls = stubFetch({
      '/v1/dataset-work': { data: [work({ definitionState: 'Approved', approvedByActorId: 'actor_app' })] },
    });
    await act(async () => {
      render(<DatasetWork session={researcher} />);
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Generate a version' }));
    });
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Where the data came from'), { target: { value: 'freeze tables' } });
      fireEvent.change(screen.getByLabelText('How many rows'), { target: { value: '24' } });
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Generate it' }));
    });
    const post = calls.find((c) => c.method === 'POST');
    expect(post?.path).toBe('/v1/dataset-definitions/dd_1/versions');
    expect(post?.body['rowCount']).toBe(24);
    expect(screen.getByRole('status').textContent).toContain('quality review has not been completed');
  });

  it('completing the quality review records a person’s statement and does not lock anything', async () => {
    const calls = stubFetch({
      '/v1/dataset-work': {
        data: [
          work({
            definitionState: 'Approved',
            datasetVersionId: 'dv_1',
            versionNumber: 1,
            versionState: 'Generated',
            rowCount: 24,
          }),
        ],
      },
    });
    await act(async () => {
      render(<DatasetWork session={researcher} />);
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Record that the quality review is finished' }));
    });
    expect(calls.find((c) => c.method === 'POST')?.path).toBe('/v1/dataset-versions/dv_1/complete-quality-review');
    expect(screen.getByRole('status').textContent).toContain('you are not locking it here');
  });
});

describe('approving a dataset definition', () => {
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  const definition = (createdBy: string) => ({
    type: 'DatasetDefinition',
    id: 'dd_1',
    attributes: {
      datasetDefinitionId: 'dd_1',
      researchProjectId: 'rp_1',
      name: 'pilot-feasibility',
      variables: { enrolment_state: 'included', exposure_state: 'included' },
      createdByActorId: createdBy,
      createdAt: '2026-08-04T00:00:00Z',
    },
  });

  const openTab = async (payload: unknown) => {
    const calls = stubFetch({ '/v1/dataset-definitions/awaiting-approval': payload });
    await act(async () => {
      render(<StaffApproverPanel session={approver} />);
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Dataset definitions' }));
    });
    return calls;
  };

  it('shows what the dataset would contain, and approves against that exact definition', async () => {
    const calls = await openTab({ data: [definition('actor_someone_else')] });
    expect(screen.getByText('enrolment_state, exposure_state')).toBeTruthy();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Approve this definition' }));
    });
    const dialog = screen.getByRole('alertdialog').textContent ?? '';
    expect(dialog).toContain('Anything not named here is not included');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    });
    const post = calls.find((c) => c.method === 'POST');
    expect(post?.path).toBe('/v1/dataset-definitions/dd_1/approve');
    expect(post?.body['confirmed']).toBe(true);
  });

  it('your own definition is refused before the button, not after', async () => {
    await openTab({ data: [definition(approver.actorId)] });
    expect(screen.getByRole('button', { name: 'Approve this definition' })).toHaveProperty('disabled', true);
  });

  it('an empty queue says so rather than looking unloaded', async () => {
    await openTab({ data: [] });
    expect(screen.getByText('No dataset definition is waiting to be approved.')).toBeTruthy();
  });
});
