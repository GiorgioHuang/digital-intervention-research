import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { DeliveryRecord } from '../src/components/DeliveryRecord.js';

const session = { actorId: 'actor_coord', authStrength: 'password' as const, organisationId: 'org_1' };

const CONFIG = {
  type: 'InterventionConfiguration',
  id: 'ic_1',
  attributes: {
    interventionConfigurationId: 'ic_1',
    researchProjectId: 'rp_1',
    protocolVersionId: 'pv_1',
    interventionVersionId: 'iv_1',
    interventionCode: 'INT-001',
    interventionName: 'Life story work with a supporter',
    versionNumber: 1,
    versionState: 'Active',
    configurationState: 'Draft',
    createdAt: '2026-08-01T00:00:00Z',
  },
};

const SESSION_ROW = {
  type: 'InterventionSession',
  id: 'is_1',
  attributes: {
    interventionSessionId: 'is_1',
    enrolmentId: 'en_1',
    interventionConfigurationId: 'ic_1',
    exposureState: 'Partially Received',
    deliveredByActorId: 'actor_coord',
    occurredAt: '2026-08-05T10:00:00Z',
  },
};

function stubFetch(configs: unknown[] = [CONFIG], sessions: unknown[] = [SESSION_ROW]) {
  const calls: { path: string; method: string; body: Record<string, unknown> }[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (path: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET';
      if (method === 'GET') {
        calls.push({ path, method, body: {} });
        const data = path.includes('intervention-configurations') ? configs : sessions;
        return new Response(JSON.stringify({ data }), { status: 200 });
      }
      calls.push({ path, method, body: JSON.parse(init!.body as string) as Record<string, unknown> });
      return new Response(JSON.stringify({ data: { id: 'is_2' } }), { status: 201 });
    }),
  );
  return calls;
}

/**
 * M07 held one command and nothing else: no query, no route, no screen.
 * An intervention could be approved and put into use and nobody could
 * record that a participant had received it.
 */
describe('what a participant actually received', () => {
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  /**
   * The distinction the design states outright (Doc 2) and that a screen
   * can quietly destroy: this is actual exposure, not intended exposure,
   * and delivery is not effectiveness.
   */
  it('does not let a delivery record read as an outcome', async () => {
    stubFetch();
    await act(async () => {
      render(<DeliveryRecord session={session} enrolmentId="en_1" />);
    });
    expect(screen.getByText(/It is not a claim that anything worked/i)).toBeTruthy();
    expect(screen.getByText(/the session ran to the end and nothing more/i)).toBeTruthy();
  });

  /**
   * session_state defaults to 'Completed' and nothing writes it, so the
   * row saying only part of it reached her also claims completion.
   * Showing it would contradict the exposure on the same line.
   */
  it('shows the exposure and never the session state', async () => {
    stubFetch();
    await act(async () => {
      render(<DeliveryRecord session={session} enrolmentId="en_1" />);
    });
    // Scoped to the recorded row: the same wording is also an option in
    // the picker, and matching either would prove nothing about the log.
    const rows = screen.getAllByRole('listitem').map((li) => li.textContent ?? '');
    expect(rows.some((r) => r.includes('Partly received') && r.includes('actor_coord'))).toBe(true);
    expect(document.body.textContent).not.toContain('session_state');
    // Nor the raw vocabulary that would read as a claim of completion.
    expect(rows.every((r) => !r.includes('Completed'))).toBe(true);
  });

  it('an empty record says it is not the same as nothing having happened', async () => {
    stubFetch([CONFIG], []);
    await act(async () => {
      render(<DeliveryRecord session={session} enrolmentId="en_1" />);
    });
    expect(screen.getByText(/not the same as nothing having happened/i)).toBeTruthy();
  });

  it('records against an exact configuration, and says what each state means', async () => {
    const calls = stubFetch();
    await act(async () => {
      render(<DeliveryRecord session={session} enrolmentId="en_1" />);
    });
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Which configuration they were exposed to'), {
        target: { value: 'ic_1' },
      });
    });
    await act(async () => {
      fireEvent.change(screen.getByLabelText('What actually happened'), { target: { value: 'Declined' } });
    });
    // Declining is the participant's decision and is recorded as theirs.
    expect(screen.getByText(/That is their decision and is recorded as theirs/i)).toBeTruthy();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Record this' }));
    });
    const post = calls.find((c) => c.method === 'POST');
    expect(post?.path).toBe('/v1/intervention-sessions');
    expect(post?.body).toMatchObject({
      enrolmentId: 'en_1',
      interventionConfigurationId: 'ic_1',
      exposureState: 'Declined',
    });
  });

  /**
   * A session has to name the exact configuration somebody was exposed
   * to, so with none there is nothing to record against — said rather
   * than offered as a control that would fail.
   */
  it('with no configuration it explains why there is nothing to record', async () => {
    stubFetch([], []);
    await act(async () => {
      render(<DeliveryRecord session={session} enrolmentId="en_1" />);
    });
    expect(screen.getByText(/no intervention has been configured for a project yet/i)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Record this' })).toBeNull();
  });
});
