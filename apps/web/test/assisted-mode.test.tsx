import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { AssistedMode } from '../src/components/AssistedMode.js';
import { MessagePanel } from '../src/components/MessagePanel.js';

const session = { actorId: 'actor_a', participantId: 'pt_a' };
const recipient = { participantId: 'pt_b', displayName: 'Ben' };

/**
 * Decision D-15: assistance is read-only. The helper never acts for the
 * participant, so nothing is attributed to anyone else — what the feature
 * adds is honesty about who is present.
 */
describe('assisted mode', () => {
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('the participant turns it on, and the banner says the helper cannot act for them', async () => {
    const changes: (string | null)[] = [];
    const { rerender } = render(<AssistedMode helper={null} onChange={(h) => changes.push(h)} />);
    fireEvent.change(screen.getByLabelText('Who is helping you?'), { target: { value: '  Nurse Li  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    expect(changes).toEqual(['Nurse Li']);

    rerender(<AssistedMode helper="Nurse Li" onChange={() => undefined} />);
    const text = document.body.textContent ?? '';
    expect(text).toContain('Nurse Li is helping you right now');
    expect(text).toContain('cannot press anything for you');
    expect(text).toContain('They can see this screen');
  });

  it('the helper name never leaves the device, and the screen says so', () => {
    render(<AssistedMode helper={null} onChange={() => undefined} />);
    expect(screen.getByText(/stays on this device/)).toBeTruthy();
  });

  it('only the participant can end it', () => {
    render(<AssistedMode helper="Nurse Li" onChange={() => undefined} />);
    expect(screen.getByRole('button', { name: 'Stop — nobody is helping me now' })).toBeTruthy();
  });
});

function stubFetch() {
  const calls: { path: string; body: Record<string, unknown> }[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (path: string, init?: RequestInit) => {
      if ((init?.method ?? 'GET') === 'GET') {
        return new Response(JSON.stringify({ data: [] }), { status: 200 });
      }
      calls.push({ path, body: JSON.parse(init!.body as string) as Record<string, unknown> });
      return new Response(
        JSON.stringify({ data: { id: 'msg_1', meta: { lifecycleState: 'Queued', deliveryState: 'Queued' } } }),
        { status: 201 },
      );
    }),
  );
  return calls;
}

describe('assisted sending is disclosed to the recipient', () => {
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('the send carries the fact, and the confirmation says the recipient will be told', async () => {
    const calls = stubFetch();
    await act(async () => {
      render(<MessagePanel session={session} threadId="th_1" recipient={recipient} assisted />);
    });
    fireEvent.change(screen.getByLabelText('Your message'), { target: { value: 'Hello' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Review and send' }));
    });
    expect(screen.getByRole('alertdialog').textContent).toContain('will be told that this message was sent while you had help');

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
    });
    const send = calls.find((c) => c.path.includes('/confirm-send'));
    expect(send?.body['assisted']).toBe(true);
  });

  it('without assistance the send says so, and nothing is disclosed', async () => {
    const calls = stubFetch();
    await act(async () => {
      render(<MessagePanel session={session} threadId="th_1" recipient={recipient} />);
    });
    fireEvent.change(screen.getByLabelText('Your message'), { target: { value: 'Hello' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Review and send' }));
    });
    expect(screen.getByRole('alertdialog').textContent).not.toContain('had help');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
    });
    expect(calls.find((c) => c.path.includes('/confirm-send'))?.body['assisted']).toBe(false);
  });

  it("a received message that was sent with help tells the reader their conversation had an audience", async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            data: [
              {
                type: 'Message',
                id: 'msg_9',
                attributes: {
                  messageId: 'msg_9', senderParticipantId: 'pt_b', contentText: 'Morning',
                  messageVersion: 1, lifecycleState: 'Sent', deliveryState: 'Delivered',
                  sentWithAssistance: true, createdAt: '2026-08-01T10:00:00Z',
                },
              },
            ],
          }),
          { status: 200 },
        ),
      ),
    );
    await act(async () => {
      render(<MessagePanel session={session} threadId="th_1" recipient={recipient} />);
    });
    const list = screen.getByRole('list', { name: 'Message history' });
    expect(list.textContent).toContain('Sent while someone was helping Ben');
    expect(list.textContent).toContain('could see this conversation');
  });
});
