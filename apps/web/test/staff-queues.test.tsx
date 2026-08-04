import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { StaffSafetyTriagePanel } from '../src/components/StaffSafetyTriagePanel.js';
import { StaffApproverPanel } from '../src/components/StaffApproverPanel.js';

const session = { actorId: 'actor_staff', authStrength: 'mfa' as const };

function stubFetch(routes: Record<string, unknown>) {
  const calls: { path: string; method: string }[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (path: string, init?: RequestInit) => {
      calls.push({ path, method: init?.method ?? 'GET' });
      const hit = Object.entries(routes).find(([prefix]) => path.startsWith(prefix));
      return new Response(JSON.stringify(hit === undefined ? { data: [] } : hit[1]), { status: 200 });
    }),
  );
  return calls;
}

describe('staff work queues replace manual identifier entry', () => {
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('triage queue lists open signals and prefills the form on selection', async () => {
    stubFetch({
      '/v1/safety-signals/pending-triage': {
        data: [
          {
            type: 'SafetySignal',
            id: 'ss_9',
            attributes: {
              signalId: 'ss_9', sourceType: 'Participant', category: 'wellbeing',
              severity: 'High', description: 'Feeling unsafe', signalState: 'Recorded',
            },
          },
        ],
      },
    });
    render(<StaffSafetyTriagePanel session={session} />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'View signals waiting for triage' }));
    });
    expect(screen.getByText(/Feeling unsafe/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Work on this signal' }));
    expect((screen.getByLabelText('Signal identifier') as HTMLInputElement).value).toBe('ss_9');
  });

  it('approver queues show the submitter so self-approval is visible before trying', async () => {
    stubFetch({
      '/v1/protocol-versions/in-review': {
        data: [
          {
            type: 'ProtocolVersion',
            id: 'pv_7',
            attributes: {
              protocolVersionId: 'pv_7', researchProjectId: 'rp_1', versionNumber: 2,
              submittedByActorId: 'actor_staff',
            },
          },
        ],
      },
    });
    render(<StaffApproverPanel session={session} />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'View pending work' }));
    });
    // The queue itself warns that this item was submitted by the viewer.
    expect(screen.getByText(/that is you, so you cannot approve it/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Select' }));
    expect((screen.getByLabelText('Protocol version identifier') as HTMLInputElement).value).toBe('pv_7');
  });
});
