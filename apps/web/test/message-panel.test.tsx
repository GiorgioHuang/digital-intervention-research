import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { MessagePanel } from '../src/components/MessagePanel.js';
import { DELIVERY_STATE_LABELS } from '../src/api.js';

const session = { actorId: 'actor_test', participantId: 'pt_sender' };
const recipient = { participantId: 'pt_recipient', displayName: 'Mrs Wang' };

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
    fireEvent.change(screen.getByLabelText('Your message'), { target: { value: 'Hello — see you on Thursday.' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));
    });
    expect(calls.length).toBe(1);
    fireEvent.click(screen.getByRole('button', { name: 'Review and send' }));
  }

  it('draft and send are separate; confirmation shows exact recipient and message version', async () => {
    const calls = stubFetch();
    render(<MessagePanel session={session} threadId="th_1" recipient={recipient} />);
    // Review-and-send is unavailable until a draft exists.
    expect(screen.getByRole('button', { name: 'Review and send' })).toHaveProperty('disabled', true);
    await draftAndReview(calls);
    const dialog = screen.getByRole('alertdialog');
    expect(dialog.textContent).toContain('Mrs Wang');
    expect(dialog.textContent).toContain('1');
    expect(dialog.textContent).toContain('Hello — see you on Thursday.');
    // Saving the draft did not send anything.
    expect(calls.some((c) => c.path.includes('confirm-send'))).toBe(false);
  });

  it('editing after review invalidates the pending confirmation', async () => {
    const calls = stubFetch();
    render(<MessagePanel session={session} threadId="th_1" recipient={recipient} />);
    await draftAndReview(calls);
    expect(screen.getByRole('alertdialog')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Your message'), { target: { value: 'Edited text' } });
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(screen.getByRole('button', { name: 'Review and send' })).toHaveProperty('disabled', true);
    expect(screen.getByText(/save the draft again/)).toBeTruthy();
  });

  it('successful confirmation reports Queued — never delivered', async () => {
    const calls = stubFetch();
    render(<MessagePanel session={session} threadId="th_1" recipient={recipient} />);
    await draftAndReview(calls);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
    });
    const confirm = calls.find((c) => c.path.includes('confirm-send'));
    expect(confirm?.body['expectedMessageVersion']).toBe(1);
    expect(confirm?.body['recipientIds']).toEqual(['pt_recipient']);
    const status = screen.getByText(/Current status/);
    expect(status.textContent).toContain(DELIVERY_STATE_LABELS['Queued'] as string);
    expect(status.textContent).not.toContain('Delivered to');
  });

  it('delivery-state wording never overstates: Provider Accepted ≠ received, Unknown ≠ success', () => {
    expect(DELIVERY_STATE_LABELS['Provider Accepted']).toContain('not received by the person yet');
    expect(DELIVERY_STATE_LABELS['Delivery Unknown']).toContain('does not mean it arrived');
    expect(DELIVERY_STATE_LABELS['Queued']).not.toContain('Delivered');
  });

  it('message history shows own messages with truthful delivery labels', async () => {
    const calls: string[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (path: string) => {
        calls.push(path);
        return new Response(
          JSON.stringify({
            data: [
              {
                type: 'Message', id: 'msg_h1',
                attributes: {
                  messageId: 'msg_h1', senderParticipantId: 'pt_sender', contentText: 'See you Thursday',
                  messageVersion: 1, lifecycleState: 'Sent', deliveryState: 'Provider Accepted',
                  createdAt: '2026-07-30T10:00:00Z',
                },
              },
              {
                type: 'Message', id: 'msg_h2',
                attributes: {
                  messageId: 'msg_h2', senderParticipantId: 'pt_recipient', contentText: 'That works for me',
                  messageVersion: 1, lifecycleState: 'Sent', deliveryState: 'Delivered',
                  createdAt: '2026-07-30T10:05:00Z',
                },
              },
            ],
          }),
          { status: 200 },
        );
      }),
    );
    // The history loads with the panel: it is the context for what is
    // being written, not something to go and fetch.
    await act(async () => {
      render(<MessagePanel session={session} threadId="th_1" recipient={recipient} />);
    });
    expect(calls[0]).toContain('/v1/conversation-threads/th_1/messages');
    const list = screen.getByRole('list', { name: 'Message history' });
    // Own message shows the honest label — accepted by the service, NOT received.
    expect(list.textContent).toContain('Accepted by the delivery service (not received by the person yet)');
    // The other party's message shows content but no delivery state of ours.
    expect(list.textContent).toContain('That works for me');
  });
});
