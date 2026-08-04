import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { ReportWork } from '../src/components/ReportWork.js';
import { StaffApproverPanel } from '../src/components/StaffApproverPanel.js';

const researcher = { actorId: 'actor_res', authStrength: 'password' as const };
const approver = { actorId: 'actor_app', authStrength: 'mfa' as const };

const reportRow = (over: Record<string, unknown> = {}) => ({
  type: 'Report',
  id: 'rep_1:none',
  attributes: {
    reportId: 'rep_1',
    title: 'Pilot outcomes',
    reportType: 'ResearchReport',
    reportVersionId: null,
    versionNumber: null,
    versionState: null,
    approvedByActorId: null,
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
 * The export half of this module had screens; the reports beside it did
 * not. Nothing could create a report, draft a version or list one, so the
 * approval step further along had nothing to approve.
 */
describe('writing a report', () => {
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('a new report has no version, and the screen says so rather than implying one', async () => {
    const calls = stubFetch({ '/v1/report-work': { data: [] } });
    await act(async () => {
      render(<ReportWork session={researcher} />);
    });
    expect(calls[0]?.path).toBe('/v1/report-work');
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Research project identifier'), { target: { value: 'rp_1' } });
      fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Pilot outcomes' } });
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Start this report' }));
    });
    const post = calls.find((c) => c.method === 'POST');
    expect(post?.path).toBe('/v1/research-reports');
    expect(screen.getByRole('status').textContent).toContain('nothing to approve');
  });

  it('writing a version says it cannot be edited once approved', async () => {
    const calls = stubFetch({ '/v1/report-work': { data: [reportRow()] } });
    await act(async () => {
      render(<ReportWork session={researcher} />);
    });
    expect(screen.getByText('No version written yet.')).toBeTruthy();
    expect(screen.getByText(/once approved its\s+content cannot be changed/)).toBeTruthy();
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Report'), { target: { value: 'rep_1' } });
      fireEvent.change(screen.getByLabelText('What this version says'), { target: { value: 'Findings so far.' } });
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Write this version' }));
    });
    const post = calls.find((c) => c.method === 'POST');
    expect(post?.path).toBe('/v1/research-reports/rep_1/versions');
    expect((post?.body['content'] as { text: string }).text).toBe('Findings so far.');
  });

  it('an approved version stays visible to the writer, described as unchangeable', async () => {
    stubFetch({
      '/v1/report-work': {
        data: [
          reportRow({
            reportVersionId: 'rv_1',
            versionNumber: 1,
            versionState: 'Approved',
            approvedByActorId: 'actor_app',
          }),
        ],
      },
    });
    await act(async () => {
      render(<ReportWork session={researcher} />);
    });
    expect(screen.getByText(/Its content can no longer be changed/)).toBeTruthy();
  });
});

describe('approving a report version', () => {
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  const version = (createdBy: string) => ({
    type: 'ReportVersion',
    id: 'rv_1',
    attributes: {
      reportVersionId: 'rv_1',
      reportId: 'rep_1',
      reportTitle: 'Pilot outcomes',
      reportType: 'ResearchReport',
      versionNumber: 2,
      createdByActorId: createdBy,
      createdAt: '2026-08-04T00:00:00Z',
    },
  });

  const openTab = async (payload: unknown) => {
    const calls = stubFetch({ '/v1/report-versions/awaiting-approval': payload });
    await act(async () => {
      render(<StaffApproverPanel session={approver} />);
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Report versions' }));
    });
    return calls;
  };

  it('says approval fixes these exact words, and a correction is a new version', async () => {
    const calls = await openTab({ data: [version('actor_someone_else')] });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Approve this version' }));
    });
    const dialog = screen.getByRole('alertdialog').textContent ?? '';
    expect(dialog).toContain('fixes these words as version 2');
    expect(dialog).toContain('a correction is a new version');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    });
    expect(calls.find((c) => c.method === 'POST')?.path).toBe('/v1/report-versions/rv_1/approve');
  });

  it('your own version is refused before the button, not after', async () => {
    await openTab({ data: [version(approver.actorId)] });
    expect(screen.getByRole('button', { name: 'Approve this version' })).toHaveProperty('disabled', true);
  });

  it('an empty queue says so rather than looking unloaded', async () => {
    await openTab({ data: [] });
    expect(screen.getByText('No report version is waiting to be approved.')).toBeTruthy();
  });
});
