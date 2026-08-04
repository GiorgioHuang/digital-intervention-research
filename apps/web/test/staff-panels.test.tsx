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
      // The approver screens read their queue on entry, so GETs with no
      // body reach this stub too; only commands carry one.
      if ((init.method ?? 'GET') === 'GET') return new Response(JSON.stringify({ data: [] }), { status: 200 });
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
    fireEvent.change(screen.getByLabelText('Signal identifier'), { target: { value: 'ss_1' } });
    // No reason -> cannot submit.
    expect(screen.getByRole('button', { name: 'Submit disposition' })).toHaveProperty('disabled', true);
    fireEvent.change(screen.getByLabelText(/Reason/), { target: { value: 'Checked; no risk found' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit disposition' }));
    // Confirmation before anything is sent.
    expect(screen.getByRole('alertdialog').textContent).toContain('ss_1');
    expect(calls.length).toBe(0);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    });
    expect(calls[0]?.path).toBe('/v1/safety-signals/ss_1/triage');
    expect(calls[0]?.headers['x-auth-strength']).toBe('mfa');
    expect(calls[0]?.body['confirmed']).toBe(true);
  });

  it('safety triage warns up front when conversion is selected without MFA', () => {
    stubFetch();
    render(<StaffSafetyTriagePanel session={pwSession} />);
    fireEvent.change(screen.getByLabelText('Disposition'), { target: { value: 'Converted to Safety Event' } });
    expect(screen.getByRole('note').textContent).toContain('strong authentication');
    expect(screen.getByRole('note').textContent).toContain('the server will refuse this submission');
  });

  it('approver panel warns when the session lacks MFA', async () => {
    stubFetch();
    await act(async () => {
      render(<StaffApproverPanel session={pwSession} />);
    });
    expect(screen.getByText(/signed in at password level/)).toBeTruthy();
  });

  it('coordinator: eligibility decision needs a written reason; withdrawal is confirmed with honest consequences', async () => {
    const calls = stubFetch();
    render(<StaffCoordinatorPanel session={mfaSession} />);
    fireEvent.change(screen.getByLabelText('Enrolment identifier'), { target: { value: 'enr_1' } });
    // Eligibility button stays disabled without a reason.
    expect(screen.getByRole('button', { name: 'Record eligibility decision' })).toHaveProperty('disabled', true);
    fireEvent.change(screen.getByLabelText('Reason for the eligibility decision'), { target: { value: 'Meets the inclusion criteria' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Record eligibility decision' }));
    });
    expect(calls[0]?.path).toBe('/v1/enrolments/enr_1/eligibility-decision');
    expect(calls[0]?.body['reason']).toBe('Meets the inclusion criteria');

    fireEvent.click(screen.getByRole('button', { name: 'Withdraw this participant' }));
    const dialog = screen.getByRole('alertdialog');
    expect(dialog.textContent).toContain('locked');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Confirm withdrawal' }));
    });
    expect(calls.some((c) => c.path === '/v1/enrolments/enr_1/withdraw')).toBe(true);
  });

  it('researcher export form offers NO identifiable option and splits exact sources', async () => {
    const calls = stubFetch();
    render(<StaffResearcherPanel session={mfaSession} />);
    const options = Array.from(screen.getByLabelText('De-identification level').querySelectorAll('option')).map((o) =>
      (o as HTMLOptionElement).value,
    );
    expect(options).toEqual(['Pseudonymised', 'Anonymised']);
    fireEvent.change(screen.getByLabelText('Purpose'), { target: { value: 'External statistical review' } });
    fireEvent.change(screen.getByLabelText('Recipient'), { target: { value: 'stats-partner' } });
    fireEvent.change(screen.getByLabelText(/Sources/), { target: { value: 'dv_1, dv_2' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Submit export request' }));
    });
    expect(calls[0]?.path).toBe('/v1/export-requests');
    expect(calls[0]?.body['sources']).toEqual(['dv_1', 'dv_2']);
  });
});
