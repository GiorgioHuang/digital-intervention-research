import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { AuditAccess } from '../src/components/AuditAccess.js';

const session = { actorId: 'actor_privacy', authStrength: 'password' as const, organisationId: 'org_1' };

function stubFetch(body: unknown, status = 200) {
  const calls: { path: string }[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (path: string) => {
      calls.push({ path });
      return new Response(JSON.stringify(body), { status });
    }),
  );
  return calls;
}

const ONE_ROW = {
  data: [
    {
      type: 'AuditEvent',
      id: 'ae_1',
      attributes: {
        auditEventId: 'ae_1',
        occurredAt: '2026-08-06T10:00:00Z',
        actorType: 'user',
        actorId: 'actor_admin',
        activeRole: 'SystemAdministrator',
        authStrength: 'mfa',
        action: 'break-glass.execute',
        targetType: 'BreakGlassRecord',
        targetId: 'bg_1',
        result: 'Succeeded',
        policyDecision: null,
        policyDecisionReason: null,
        policyVersion: 'policy_v0.2.0',
        source: 'M15',
        participantId: null,
        accessReason: null,
      },
    },
  ],
};

/**
 * The screen that reads the platform's accountability record. Sixty-one
 * places write to that record and nothing read one, while audit.view sat
 * granted to three roles and checked by no code.
 *
 * What this screen must never do is let somebody read an empty result as
 * evidence that nothing happened — reads and refusals are not written to
 * this store at all.
 */
describe('AuditAccess (G7)', () => {
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('says what the record does not contain before showing a single row', async () => {
    stubFetch(ONE_ROW);
    render(<AuditAccess session={session} />);
    expect(screen.getByText(/does not record anyone reading anything/i)).toBeTruthy();
    expect(screen.getByText(/does not record refusals/i)).toBeTruthy();
    expect(screen.getByText(/Your reading is recorded too/i)).toBeTruthy();
  });

  it('will not search without a reason, and sends the reason with the query', async () => {
    const calls = stubFetch(ONE_ROW);
    render(<AuditAccess session={session} />);
    const button = screen.getByRole('button', { name: 'Search the audit trail' }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    await act(async () => {
      fireEvent.change(screen.getByLabelText(/Why you are looking/), {
        target: { value: 'Reviewing break-glass 42' },
      });
    });
    expect(button.disabled).toBe(false);
    await act(async () => {
      fireEvent.click(button);
    });
    expect(calls[0]?.path).toContain('accessReason=Reviewing+break-glass+42');
    expect(screen.getByText('break-glass.execute')).toBeTruthy();
  });

  /**
   * The one sentence this screen exists to prevent somebody from not
   * hearing. An empty audit result is not evidence of an empty history.
   */
  it('an empty result says it is not the same as nothing having happened', async () => {
    stubFetch({ data: [] });
    render(<AuditAccess session={session} />);
    await act(async () => {
      fireEvent.change(screen.getByLabelText(/Why you are looking/), { target: { value: 'checking' } });
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Search the audit trail' }));
    });
    expect(screen.getByText(/not the same as nothing having happened/i)).toBeTruthy();
  });
});
