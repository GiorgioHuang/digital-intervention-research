import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { SafetyEvents } from '../src/components/SafetyEvents.js';

const session = { actorId: 'actor_safety', authStrength: 'mfa' as const };

/**
 * A safety event could be created and then nothing could change it,
 * nothing listed it and nothing showed it. The triage screen said the
 * reviewer had "converted this to a safety event" — which reads as an
 * escalation to something that will be worked — and nothing worked it.
 */
function stubFetch(event: Record<string, unknown> | null) {
  const calls: { path: string; method: string; body: Record<string, unknown> | undefined }[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (path: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET';
      calls.push({
        path,
        method,
        body: typeof init?.body === 'string' ? (JSON.parse(init.body) as Record<string, unknown>) : undefined,
      });
      if (method === 'GET') {
        return new Response(
          JSON.stringify({
            data: event === null ? [] : [{ type: 'SafetyEvent', id: 'se_1', attributes: event }],
          }),
          { status: 200 },
        );
      }
      return new Response(JSON.stringify({ data: { id: 'sae_1' } }), { status: 201 });
    }),
  );
  return calls;
}

const EVENT = (over: Record<string, unknown> = {}) => ({
  safetyEventId: 'se_1',
  safetySignalId: 'ss_1',
  eventState: 'Open',
  confirmedByActorId: 'actor_other',
  confirmedAt: '2026-08-03T14:20:00Z',
  category: 'self-harm risk',
  severity: 'High',
  description: 'Said on a call that they had been thinking about not being here',
  timeline: [],
  ...over,
});

describe('safety events', () => {
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  const open = async (event: Record<string, unknown> | null = EVENT()) => {
    const calls = stubFetch(event);
    await act(async () => {
      render(<SafetyEvents session={session} />);
    });
    return calls;
  };

  /** The platform holds the account of what people did; it does nothing. */
  it('says the platform does nothing about a safety event on its own', async () => {
    await open();
    expect(screen.getByText(/does not do anything about a safety event on its own/)).toBeTruthy();
    expect(screen.getByText(/cannot be edited or deleted afterwards/)).toBeTruthy();
  });

  /** §200: severity is words, never a colour on its own. */
  it('shows severity and category as words', async () => {
    await open();
    expect(screen.getByText(/self-harm risk · severity High/)).toBeTruthy();
    expect(screen.getByText(/Open — confirmed, nobody has picked it up yet/)).toBeTruthy();
  });

  /**
   * Anyone reading later cannot tell "nothing was needed" from "nobody
   * looked", so the empty state has to say which one a blank is.
   */
  it('an event with nothing recorded says a blank is not a judgement', async () => {
    await open();
    expect(screen.getByText(/a blank is not a judgement/)).toBeTruthy();
    expect(screen.getByText(/cannot tell the difference between/)).toBeTruthy();
  });

  it('records what was done, and asks for what was done rather than what was said', async () => {
    const calls = await open();
    expect(screen.getByText(/Write what was done, not what was said/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Record this' })).toHaveProperty('disabled', true);
    fireEvent.change(screen.getByLabelText('What you did'), { target: { value: 'Rang the participant' } });
    fireEvent.change(screen.getByLabelText(/Anything a colleague would need to know/), {
      target: { value: 'They agreed to a call back tomorrow.' },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Record this' }));
    });
    const posted = calls.find((c) => c.method === 'POST');
    expect(posted?.path).toBe('/v1/safety-events/se_1/actions');
    expect(posted?.body).toMatchObject({ label: 'Rang the participant', actionState: 'Completed', confirmed: true });
  });

  /** "Decided that no action was needed" is a real answer and must exist. */
  it('offers recording that no action was needed', async () => {
    await open();
    const options = Array.from(
      (screen.getByLabelText('Where it stands') as HTMLSelectElement).querySelectorAll('option'),
    ).map((o) => o.textContent);
    expect(options).toContain('Decided that no action was needed');
  });

  /**
   * A screen offering a move the command refuses would be a control that
   * cannot work — the defect this whole sweep exists to remove.
   */
  it('offers only the moves the state allows', async () => {
    await open();
    const options = Array.from(
      (screen.getByLabelText('Move it to') as HTMLSelectElement).querySelectorAll('option'),
    ).map((o) => o.getAttribute('value'));
    expect(options).toEqual(['', 'In Review']);
  });

  /**
   * The most dangerous wording available here: closing a record and ending
   * a risk are not the same act.
   */
  it('resolving says plainly that it does not mean the person is safe', async () => {
    await open(EVENT({ eventState: 'In Review' }));
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Move it to'), { target: { value: 'Resolved' } });
    });
    expect(screen.getByText(/It does not mean the person is safe/)).toBeTruthy();
  });

  it('the timeline shows both what was done and where the event moved, with who and when', async () => {
    await open(
      EVENT({
        eventState: 'In Review',
        timeline: [
          {
            entryId: 'sae_1',
            entryType: 'Action',
            label: 'Rang the participant',
            actionState: 'Completed',
            note: 'They agreed to a call back tomorrow.',
            recordedByActorId: 'actor_safety',
            recordedAt: '2026-08-03T15:02:00Z',
          },
          {
            entryId: 'sae_2',
            entryType: 'State',
            label: 'In Review',
            actionState: null,
            note: 'picked this up',
            recordedByActorId: 'actor_safety',
            recordedAt: '2026-08-03T15:10:00Z',
          },
        ],
      }),
    );
    expect(screen.getByText('Rang the participant')).toBeTruthy();
    expect(screen.getByText('Moved to In Review')).toBeTruthy();
    expect(screen.getAllByText(/actor_safety/).length).toBeGreaterThan(0);
  });

  /**
   * The design asks for relatedness to the intervention and nothing
   * records it. Leaving the question out silently would read as though
   * nobody had asked it.
   */
  it('says what it cannot show, rather than leaving the question out', async () => {
    await open();
    expect(screen.getByText(/the platform has nowhere to put that judgement/)).toBeTruthy();
  });
});
