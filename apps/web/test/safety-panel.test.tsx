import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { SafetyPanel } from '../src/components/SafetyPanel.js';

const session = { actorId: 'actor_test', participantId: 'pt_test' };

function stubFetch() {
  const calls: { path: string; body: Record<string, unknown> }[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (path: string, init: RequestInit) => {
      calls.push({ path, body: JSON.parse(init.body as string) as Record<string, unknown> });
      return new Response(JSON.stringify({ data: { id: 'x_1', meta: { moderationCaseId: 'mc_1' } } }), { status: 201 });
    }),
  );
  return calls;
}

describe('SafetyPanel (block & report, Doc 20 / ADR-037/038)', () => {
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('report goes to human review and the UI says so; submission posts category and description', async () => {
    const calls = stubFetch();
    render(<SafetyPanel session={session} />);
    expect(screen.getByText(/不会由自动系统单独决定/)).toBeTruthy();
    // A report survives a later block (ADR-038) — the UI states this.
    expect(screen.getByText(/即使你之后屏蔽了对方，这份报告仍会被处理/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText('对方的标识'), { target: { value: 'actor_bad' } });
    fireEvent.change(screen.getByLabelText(/发生了什么/), { target: { value: '给我发骚扰消息' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '提交报告' }));
    });
    expect(calls.length).toBe(1);
    expect(calls[0]?.path).toBe('/v1/reports');
    expect(calls[0]?.body['reportedActorId']).toBe('actor_bad');
    expect(calls[0]?.body['category']).toBe('harassment');
  });

  it('block requires explicit confirmation and can be backed out of without any API call', async () => {
    const calls = stubFetch();
    render(<SafetyPanel session={session} />);
    fireEvent.change(screen.getByLabelText('要屏蔽的人的标识'), { target: { value: 'actor_bad' } });
    fireEvent.click(screen.getByRole('button', { name: '屏蔽此人' }));
    expect(screen.getByRole('alertdialog')).toBeTruthy();
    expect(calls.length).toBe(0);
    fireEvent.click(screen.getByRole('button', { name: '返回，不屏蔽' }));
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(calls.length).toBe(0);
    fireEvent.click(screen.getByRole('button', { name: '屏蔽此人' }));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '确认屏蔽' }));
    });
    expect(calls.length).toBe(1);
    expect(calls[0]?.path).toBe('/v1/blocks');
    expect(calls[0]?.body['confirmed']).toBe(true);
  });

  it('safety concern raises a participant-sourced SafetySignal and shows the emergency disclaimer', async () => {
    const calls = stubFetch();
    render(<SafetyPanel session={session} />);
    expect(screen.getByText(/本平台不是紧急求助渠道/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText('安全担忧内容'), { target: { value: '最近感到不安全' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '提交安全担忧' }));
    });
    expect(calls[0]?.path).toBe('/v1/safety-signals');
    expect(calls[0]?.body['sourceType']).toBe('Participant');
  });
});
