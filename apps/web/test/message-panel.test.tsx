import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { MessagePanel } from '../src/components/MessagePanel.js';
import { DELIVERY_STATE_LABELS } from '../src/api.js';

const session = { actorId: 'actor_test', participantId: 'pt_sender' };
const recipient = { participantId: 'pt_recipient', displayName: '王奶奶' };

function stubFetch() {
  const calls: { path: string; body: Record<string, unknown> }[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (path: string, init: RequestInit) => {
      calls.push({ path, body: JSON.parse(init.body as string) as Record<string, unknown> });
      const payload = path.includes('/confirm-send')
        ? { data: { meta: { lifecycleState: 'Approved for Send', deliveryState: 'Queued' } } }
        : { data: { id: 'msg_1' } };
      return new Response(JSON.stringify(payload), { status: 200 });
    }),
  );
  return calls;
}

describe('MessagePanel (Doc 20 §158–161 send confirmation)', () => {
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  async function draftAndReview(calls: { path: string; body: Record<string, unknown> }[]) {
    fireEvent.change(screen.getByLabelText('消息内容'), { target: { value: '你好，周四见。' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '保存草稿' }));
    });
    expect(calls.length).toBe(1);
    fireEvent.click(screen.getByRole('button', { name: '检查并发送' }));
  }

  it('draft and send are separate; confirmation shows exact recipient and message version', async () => {
    const calls = stubFetch();
    render(<MessagePanel session={session} threadId="th_1" recipient={recipient} />);
    // Review-and-send is unavailable until a draft exists.
    expect(screen.getByRole('button', { name: '检查并发送' })).toHaveProperty('disabled', true);
    await draftAndReview(calls);
    const dialog = screen.getByRole('alertdialog');
    expect(dialog.textContent).toContain('王奶奶');
    expect(dialog.textContent).toContain('版本 1');
    expect(dialog.textContent).toContain('你好，周四见。');
    // Saving the draft did not send anything.
    expect(calls.some((c) => c.path.includes('confirm-send'))).toBe(false);
  });

  it('editing after review invalidates the pending confirmation', async () => {
    const calls = stubFetch();
    render(<MessagePanel session={session} threadId="th_1" recipient={recipient} />);
    await draftAndReview(calls);
    expect(screen.getByRole('alertdialog')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('消息内容'), { target: { value: '改过的内容' } });
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(screen.getByRole('button', { name: '检查并发送' })).toHaveProperty('disabled', true);
    expect(screen.getByText(/请先重新保存草稿/)).toBeTruthy();
  });

  it('successful confirmation reports Queued — never delivered', async () => {
    const calls = stubFetch();
    render(<MessagePanel session={session} threadId="th_1" recipient={recipient} />);
    await draftAndReview(calls);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '发送消息' }));
    });
    const confirm = calls.find((c) => c.path.includes('confirm-send'));
    expect(confirm?.body['expectedMessageVersion']).toBe(1);
    expect(confirm?.body['recipientIds']).toEqual(['pt_recipient']);
    const status = screen.getByText(/当前状态/);
    expect(status.textContent).toContain(DELIVERY_STATE_LABELS['Queued'] as string);
    expect(status.textContent).not.toContain('已送达');
  });

  it('delivery-state wording never overstates: Provider Accepted ≠ received, Unknown ≠ success', () => {
    expect(DELIVERY_STATE_LABELS['Provider Accepted']).toContain('对方尚未收到');
    expect(DELIVERY_STATE_LABELS['Delivery Unknown']).toContain('不代表成功');
    expect(DELIVERY_STATE_LABELS['Queued']).not.toContain('送达');
  });
});
