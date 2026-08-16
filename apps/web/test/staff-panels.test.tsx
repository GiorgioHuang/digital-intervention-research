import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { StaffSafetyTriagePanel } from '../src/components/StaffSafetyTriagePanel.js';
import { StaffApproverPanel } from '../src/components/StaffApproverPanel.js';
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
      if ((init.method ?? 'GET') === 'GET') {
        // The triage screen takes its signal from the queue, never from a
        // typed identifier, so its queue has to hold something.
        const data =
          path === '/v1/safety-signals/pending-triage'
            ? [
                {
                  type: 'SafetySignal',
                  id: 'ss_1',
                  attributes: {
                    signalId: 'ss_1',
                    sourceType: 'Participant',
                    category: 'wellbeing',
                    severity: 'High',
                    description: 'Feeling unsafe',
                    signalState: 'Recorded',
                  },
                },
              ]
            : [];
        return new Response(JSON.stringify({ data }), { status: 200 });
      }
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

  /**
   * The disposition was a `<select>`, so it had a value from the moment it
   * rendered, and that value was "Close as not a safety event" — a triage
   * conclusion standing ready on every signal a reviewer opened, on the
   * screen where a conclusion matters most (C-2). This test used to rely
   * on that default: it typed a reason and submitted without ever choosing
   * anything, which is precisely the path a distracted reviewer would take.
   *
   * Now it has to choose, and the first assertion is that it cannot submit
   * before it does.
   */
  it('safety triage: nothing is pre-selected, reason is mandatory, submission is confirmed', async () => {
    const calls = stubFetch();
    render(<StaffSafetyTriagePanel session={mfaSession} />);
    for (const d of ['Escalate for higher-level review', 'Convert to a safety event', 'Close as not a safety event']) {
      expect(screen.getByLabelText(d), d).toHaveProperty('checked', false);
    }
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'View signals waiting for triage' }));
    });
    fireEvent.click(screen.getByRole('button', { name: 'Work on this signal' }));
    fireEvent.change(screen.getByLabelText(/Reason/), { target: { value: 'Checked; no risk found' } });
    // Identifier and reason are both present, and still nothing can be
    // submitted, because no disposition has been chosen.
    expect(screen.getByRole('button', { name: 'Submit disposition' })).toHaveProperty('disabled', true);
    fireEvent.click(screen.getByLabelText('Close as not a safety event'));
    fireEvent.click(screen.getByRole('button', { name: 'Submit disposition' }));
    // Confirmation before anything is sent.
    expect(screen.getByRole('alertdialog').textContent).toContain('ss_1');
    expect(calls.length).toBe(0);
    await act(async () => {
      // Named, not a bare "Confirm" (C-3).
      fireEvent.click(screen.getByRole('button', { name: 'Confirm and record the disposition' }));
    });
    expect(calls[0]?.path).toBe('/v1/safety-signals/ss_1/triage');
    expect(calls[0]?.headers['x-auth-strength']).toBe('mfa');
    expect(calls[0]?.body['confirmed']).toBe(true);
  });

  /**
   * Closing must not read as a verdict about the person. This is the most
   * dangerous sentence the platform could omit on this screen.
   */
  it('safety triage says closing is not a statement that the person is safe', async () => {
    stubFetch();
    render(<StaffSafetyTriagePanel session={mfaSession} />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'View signals waiting for triage' }));
    });
    fireEvent.click(screen.getByRole('button', { name: 'Work on this signal' }));
    fireEvent.change(screen.getByLabelText(/Reason/), { target: { value: 'No risk found' } });
    fireEvent.click(screen.getByLabelText('Close as not a safety event'));
    fireEvent.click(screen.getByRole('button', { name: 'Submit disposition' }));
    expect(screen.getByRole('alertdialog').textContent).toContain('does not mean the person is safe');
  });

  /**
   * The fourth disposition Doc 20 describes has no value in
   * `safety.safety_signals.signal_state`, so it is named as absent rather
   * than offered as a button that would record nothing.
   */
  it('safety triage names the disposition it cannot record instead of offering it', () => {
    stubFetch();
    render(<StaffSafetyTriagePanel session={mfaSession} />);
    expect(screen.queryByLabelText(/keep watching/i)).toBeNull();
    expect(screen.getByText(/no “keep watching” here/)).toBeTruthy();
  });

  it('safety triage warns up front when conversion is selected without MFA', () => {
    stubFetch();
    render(<StaffSafetyTriagePanel session={pwSession} />);
    fireEvent.click(screen.getByLabelText('Convert to a safety event'));
    const mfaNote = screen.getAllByRole('note').map((n) => n.textContent ?? '');
    expect(mfaNote.some((t) => t.includes('strong authentication'))).toBe(true);
    expect(mfaNote.some((t) => t.includes('the server will refuse this submission'))).toBe(true);
  });

  it('approver panel warns when the session lacks MFA', async () => {
    stubFetch();
    await act(async () => {
      render(<StaffApproverPanel session={pwSession} />);
    });
    expect(screen.getByText(/signed in at password level/)).toBeTruthy();
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
