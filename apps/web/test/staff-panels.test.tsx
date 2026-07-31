import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { StaffSafetyTriagePanel } from '../src/components/StaffSafetyTriagePanel.js';
import { StaffApproverPanel } from '../src/components/StaffApproverPanel.js';
import { StaffCoordinatorPanel } from '../src/components/StaffCoordinatorPanel.js';
import { StaffResearcherPanel } from '../src/components/StaffResearcherPanel.js';

const mfaSession = { actorId: 'actor_staff', authStrength: 'mfa' as const };
const pwSession = { actorId: 'actor_staff', authStrength: 'password' as const };

function stubFetch() {
  const calls: { path: string; headers: Record<string, string>; body: Record<string, unknown> }[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (path: string, init: RequestInit) => {
      calls.push({
        path,
        headers: init.headers as Record<string, string>,
        body: JSON.parse(init.body as string) as Record<string, unknown>,
      });
      return new Response(JSON.stringify({ data: { id: 'x_1', meta: { safetyEventId: 'se_1' } } }), { status: 201 });
    }),
  );
  return calls;
}

describe('staff panels (server-judged authority, honest MFA labelling)', () => {
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('safety triage: reason is mandatory, submission is confirmed, auth strength header is forwarded', async () => {
    const calls = stubFetch();
    render(<StaffSafetyTriagePanel session={mfaSession} />);
    fireEvent.change(screen.getByLabelText('信号标识'), { target: { value: 'ss_1' } });
    // No reason -> cannot submit.
    expect(screen.getByRole('button', { name: '提交处置' })).toHaveProperty('disabled', true);
    fireEvent.change(screen.getByLabelText(/理由/), { target: { value: '经核实无风险' } });
    fireEvent.click(screen.getByRole('button', { name: '提交处置' }));
    // Confirmation before anything is sent.
    expect(screen.getByRole('alertdialog').textContent).toContain('ss_1');
    expect(calls.length).toBe(0);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '确认' }));
    });
    expect(calls[0]?.path).toBe('/v1/safety-signals/ss_1/triage');
    expect(calls[0]?.headers['x-auth-strength']).toBe('mfa');
    expect(calls[0]?.body['confirmed']).toBe(true);
  });

  it('safety triage warns up front when conversion is selected without MFA', () => {
    stubFetch();
    render(<StaffSafetyTriagePanel session={pwSession} />);
    fireEvent.change(screen.getByLabelText('处置'), { target: { value: 'Converted to Safety Event' } });
    expect(screen.getByRole('note').textContent).toContain('MFA');
    expect(screen.getByRole('note').textContent).toContain('会被服务端拒绝');
  });

  it('approver: dataset lock goes through a confirmation naming the exact artefact and is audit-attributed', async () => {
    const calls = stubFetch();
    render(<StaffApproverPanel session={mfaSession} />);
    fireEvent.change(screen.getByLabelText('数据集版本标识'), { target: { value: 'dv_9' } });
    fireEvent.click(screen.getByRole('button', { name: '锁定数据集版本（MFA）' }));
    const dialog = screen.getByRole('alertdialog');
    expect(dialog.textContent).toContain('dv_9');
    expect(dialog.textContent).toContain('署名');
    expect(calls.length).toBe(0);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '确认执行' }));
    });
    expect(calls[0]?.path).toBe('/v1/dataset-versions/dv_9/lock');
    expect(calls[0]?.body['confirmed']).toBe(true);
  });

  it('approver panel warns when the session lacks MFA', () => {
    stubFetch();
    render(<StaffApproverPanel session={pwSession} />);
    expect(screen.getByText(/密码级别下会被拒绝/)).toBeTruthy();
  });

  it('coordinator: eligibility decision needs a written reason; withdrawal is confirmed with honest consequences', async () => {
    const calls = stubFetch();
    render(<StaffCoordinatorPanel session={mfaSession} />);
    fireEvent.change(screen.getByLabelText('入组标识'), { target: { value: 'enr_1' } });
    // Eligibility button stays disabled without a reason.
    expect(screen.getByRole('button', { name: '记录资格决定' })).toHaveProperty('disabled', true);
    fireEvent.change(screen.getByLabelText('资格决定理由'), { target: { value: '符合纳入标准' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '记录资格决定' }));
    });
    expect(calls[0]?.path).toBe('/v1/enrolments/enr_1/eligibility-decision');
    expect(calls[0]?.body['reason']).toBe('符合纳入标准');

    fireEvent.click(screen.getByRole('button', { name: '为该参与者办理退出' }));
    const dialog = screen.getByRole('alertdialog');
    expect(dialog.textContent).toContain('已锁定的研究数据集不会被改写');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '确认退出' }));
    });
    expect(calls.some((c) => c.path === '/v1/enrolments/enr_1/withdraw')).toBe(true);
  });

  it('researcher export form offers NO identifiable option and splits exact sources', async () => {
    const calls = stubFetch();
    render(<StaffResearcherPanel session={mfaSession} />);
    const options = Array.from(screen.getByLabelText('去标识级别').querySelectorAll('option')).map((o) =>
      (o as HTMLOptionElement).value,
    );
    expect(options).toEqual(['Pseudonymised', 'Anonymised']);
    fireEvent.change(screen.getByLabelText('目的'), { target: { value: '外部统计复核' } });
    fireEvent.change(screen.getByLabelText('接收方'), { target: { value: 'stats-partner' } });
    fireEvent.change(screen.getByLabelText(/来源/), { target: { value: 'dv_1, dv_2' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '提交导出申请' }));
    });
    expect(calls[0]?.path).toBe('/v1/export-requests');
    expect(calls[0]?.body['sources']).toEqual(['dv_1', 'dv_2']);
  });
});
