import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { StaffCoordinatorPanel } from '../src/components/StaffCoordinatorPanel.js';

const session = { actorId: 'actor_staff', authStrength: 'mfa' as const };

/**
 * The panel used to put all four chain steps and the eligibility decision
 * beside a box you typed an enrolment identifier into, every button
 * enabled, with the state shown nowhere. Only one of them could succeed
 * and which one was unknowable from the screen.
 */
function stubFetch(states: string[]) {
  const calls: { path: string; method: string; body: Record<string, unknown> | undefined }[] = [];
  let index = 0;
  vi.stubGlobal(
    'fetch',
    vi.fn(async (path: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET';
      calls.push({
        path,
        method,
        body: typeof init?.body === 'string' ? (JSON.parse(init.body) as Record<string, unknown>) : undefined,
      });
      if (method === 'GET' && path.startsWith('/v1/enrolments')) {
        // Each reload advances to the next state, so a test can watch the
        // row offer the step that follows the one just taken.
        const state = states[Math.min(index, states.length - 1)];
        index += 1;
        return new Response(
          JSON.stringify({
            data: [
              {
                type: 'Enrolment',
                id: 'enr_1',
                attributes: {
                  enrolmentId: 'enr_1',
                  participantId: 'pt_9',
                  researchProjectId: 'rp_1',
                  enrolmentState: state,
                },
              },
            ],
          }),
          { status: 200 },
        );
      }
      return new Response(JSON.stringify({ data: { id: 'x_1' } }), { status: 201 });
    }),
  );
  return calls;
}

const load = async () => {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'View enrolments' }));
  });
};

describe('the enrolment chain', () => {
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('says where each enrolment has got to, in words rather than a state name alone', async () => {
    stubFetch(['Invited']);
    render(<StaffCoordinatorPanel session={session} />);
    await load();
    expect(screen.getByText(/invited — nothing has happened yet/)).toBeTruthy();
  });

  it('offers only the step the state allows, and says where that step leads', async () => {
    stubFetch(['Invited']);
    render(<StaffCoordinatorPanel session={session} />);
    await load();
    expect(screen.getByRole('button', { name: 'Start screening' })).toBeTruthy();
    expect(screen.getByText(/moves it to “Screening”/)).toBeTruthy();
    // The three later steps cannot succeed from Invited, so they are not
    // on the screen to be pressed.
    for (const later of ['Start the consent conversation', 'Enrol', 'Activate']) {
      expect(screen.queryByRole('button', { name: later })).toBeNull();
    }
  });

  it('does not offer a chain step while the enrolment is waiting on a person', async () => {
    stubFetch(['Screening']);
    render(<StaffCoordinatorPanel session={session} />);
    await load();
    for (const step of ['Start screening', 'Start the consent conversation', 'Enrol', 'Activate']) {
      expect(screen.queryByRole('button', { name: step })).toBeNull();
    }
    expect(screen.getByRole('button', { name: 'Record eligibility decision' })).toBeTruthy();
  });

  /**
   * The eligibility decision only exists between Screening and Eligible;
   * offering it anywhere else is offering something the command refuses.
   */
  it('offers the eligibility decision only while screening', async () => {
    stubFetch(['Enrolled']);
    render(<StaffCoordinatorPanel session={session} />);
    await load();
    expect(screen.queryByRole('button', { name: 'Record eligibility decision' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Activate' })).toBeTruthy();
  });

  it('the eligibility decision needs a written reason and is recorded in the deciding person’s name', async () => {
    const calls = stubFetch(['Screening']);
    render(<StaffCoordinatorPanel session={session} />);
    await load();
    expect(screen.getByRole('button', { name: 'Record eligibility decision' })).toHaveProperty('disabled', true);
    expect(screen.getByText(/recorded in your name — it is not a score produced by the system/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Reason (required)'), {
      target: { value: 'Meets the inclusion criteria' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Record eligibility decision' }));
    /*
     * `eligibility.decide` is in the permission engine's confirmation
     * tier and the api client sends `confirmed: true` unconditionally.
     * Until this landed the screen recorded on one click, so the server
     * was told a person had confirmed on the strength of a constant in
     * the transport layer.
     */
    expect(calls.find((c) => c.path === '/v1/enrolments/enr_1/eligibility-decision')).toBeUndefined();
    const dialog = screen.getByRole('alertdialog');
    expect(dialog.textContent).toMatch(/Meets the inclusion criteria/);
    expect(dialog.textContent).toMatch(/cannot be changed afterwards/);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Yes, record it' }));
    });
    const posted = calls.find((c) => c.path === '/v1/enrolments/enr_1/eligibility-decision');
    expect(posted?.body).toMatchObject({ decision: 'Eligible', reason: 'Meets the inclusion criteria' });
  });

  /**
   * "Not eligible" ends the enrolment, so the confirmation has to say
   * that rather than leaving it to be discovered from the row afterwards.
   */
  it('refusing eligibility says in the confirmation that it ends the enrolment', async () => {
    stubFetch(['Screening']);
    render(<StaffCoordinatorPanel session={session} />);
    await load();
    fireEvent.change(screen.getByLabelText('Eligibility decision'), { target: { value: 'Ineligible' } });
    fireEvent.change(screen.getByLabelText('Reason (required)'), { target: { value: 'outside the age range' } });
    fireEvent.click(screen.getByRole('button', { name: 'Record eligibility decision' }));
    expect(screen.getByRole('alertdialog').textContent).toMatch(/ends their enrolment/);
  });

  /**
   * Without the reload the row keeps the state it had before the step,
   * and the button on offer is the one that has just stopped working.
   */
  it('a completed step moves the row on, so the next button is the next step', async () => {
    stubFetch(['Invited', 'Screening']);
    render(<StaffCoordinatorPanel session={session} />);
    await load();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Start screening' }));
    });
    expect(screen.queryByRole('button', { name: 'Start screening' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Record eligibility decision' })).toBeTruthy();
  });

  /**
   * The dialog used to say withdrawal "propagates to related records"
   * and the screen then announced that "propagation started". Neither
   * was true: the event is written to the outbox and no consumer is
   * registered to receive it, so it is marked published having reached
   * nobody. The word has to stay out, because a coordinator who reads it
   * will believe the downstream is handled.
   */
  it('withdrawal never claims to propagate', async () => {
    stubFetch(['Active']);
    render(<StaffCoordinatorPanel session={session} />);
    await load();
    fireEvent.click(screen.getByRole('button', { name: 'Withdraw this participant' }));
    expect(screen.getByRole('alertdialog').textContent).not.toMatch(/propagat/i);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Confirm withdrawal' }));
    });
    expect(document.body.textContent).not.toMatch(/propagat/i);
  });

  it('withdrawal is confirmed and says what it does and does not reach', async () => {
    const calls = stubFetch(['Active']);
    render(<StaffCoordinatorPanel session={session} />);
    await load();
    fireEvent.click(screen.getByRole('button', { name: 'Withdraw this participant' }));
    const dialog = screen.getByRole('alertdialog');
    // What it does: the writes that attach data to this enrolment refuse
    // from this moment, which is the only thing withdrawal actually does.
    expect(dialog.textContent).toMatch(/nothing further can be recorded against this enrolment/i);
    // And what it does not do, said plainly rather than left to be assumed.
    expect(dialog.textContent).toMatch(/It does not reach back/);
    expect(dialog.textContent).toContain('locked');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Confirm withdrawal' }));
    });
    expect(calls.some((c) => c.path === '/v1/enrolments/enr_1/withdraw')).toBe(true);
    // The announcement repeats the same narrow claim, not a wider one.
    expect(
      screen.getAllByRole('status').some((s) => /Nothing further can be recorded/i.test(s.textContent ?? '')),
    ).toBe(true);
  });

  /**
   * Every action reloads the list, and the reload used to announce
   * 'Enrolment list updated.' after the outcome had been announced —
   * overwriting it. Whatever the screen had just been told to say about
   * a consequential act, what remained in the live region was that a
   * list had been refreshed.
   */
  it('what the action did is what the screen still says afterwards', async () => {
    stubFetch(['Active', 'Withdrawn']);
    render(<StaffCoordinatorPanel session={session} />);
    await load();
    fireEvent.click(screen.getByRole('button', { name: 'Withdraw this participant' }));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Confirm withdrawal' }));
    });
    const live = screen.getAllByRole('status').map((s) => s.textContent ?? '');
    expect(live.some((t) => /Nothing further can be recorded/i.test(t))).toBe(true);
    expect(live.every((t) => t !== 'Enrolment list updated.')).toBe(true);
    // The reload still happened — the row has moved on.
    expect(screen.queryByRole('button', { name: 'Withdraw this participant' })).toBeNull();
  });

  it('an enrolment that has already ended is not offered a withdrawal', async () => {
    stubFetch(['Withdrawn']);
    render(<StaffCoordinatorPanel session={session} />);
    await load();
    expect(screen.queryByRole('button', { name: 'Withdraw this participant' })).toBeNull();
  });

  /**
   * Absence has to be explained, or it reads as the screen hiding
   * something from this particular person.
   */
  it('says why the rest of the chain is not on offer', async () => {
    stubFetch(['Invited']);
    render(<StaffCoordinatorPanel session={session} />);
    await load();
    expect(screen.getByText(/it is not this enrolment's turn for it/)).toBeTruthy();
  });
});
