import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { StaffModeratorPanel } from '../src/components/StaffModeratorPanel.js';
import { SupporterApp } from '../src/SupporterApp.js';

const session = { actorId: 'actor_mod', authStrength: 'mfa' as const };

describe('moderator panel (human, confirmed, immutable decisions)', () => {
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('queue shows category and subject but never a reporter; selection prefills; decision is confirmed', async () => {
    const calls: { path: string; body?: Record<string, unknown> }[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (path: string, init?: RequestInit) => {
        calls.push({
          path,
          ...(init?.body === undefined ? {} : { body: JSON.parse(init.body as string) as Record<string, unknown> }),
        });
        if (path === '/v1/moderation-cases/open') {
          return new Response(
            JSON.stringify({
              data: [
                {
                  type: 'ModerationCase', id: 'mc_1',
                  attributes: {
                    moderationCaseId: 'mc_1', subjectActorId: 'actor_subject',
                    caseState: 'Reported', reportCategory: 'harassment', reportDescription: 'Harassing messages',
                  },
                },
              ],
            }),
            { status: 200 },
          );
        }
        return new Response(JSON.stringify({ data: { id: 'md_1' } }), { status: 201 });
      }),
    );
    render(<StaffModeratorPanel session={session} />);
    // The UI states the reporter-anonymity and immutability rules up front.
    expect(screen.getByText(/never shows who reported/)).toBeTruthy();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'View open cases' }));
    });
    expect(screen.getByText(/Harassing messages/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Work on this case' }));
    expect((screen.getByLabelText('Case identifier') as HTMLInputElement).value).toBe('mc_1');

    // Reason is mandatory; nothing posts before the confirmation dialog.
    expect(screen.getByRole('button', { name: 'Record decision' })).toHaveProperty('disabled', true);
    fireEvent.change(screen.getByLabelText(/Reason/), { target: { value: 'First breach; warning' } });
    fireEvent.click(screen.getByRole('button', { name: 'Record decision' }));
    const dialog = screen.getByRole('alertdialog');
    expect(dialog.textContent).toContain('cannot be changed');
    expect(calls.filter((c) => c.body !== undefined).length).toBe(0);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    });
    const post = calls.find((c) => c.body !== undefined);
    expect(post?.path).toBe('/v1/moderation-cases/mc_1/decision');
    expect(post?.body?.['confirmed']).toBe(true);
  });
});

describe('supporter workspace (contribution ≠ testimony)', () => {
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('states the participant decides; accepted contributions are labelled as contributions, never testimony', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (path: string) => {
        if (path === '/v1/life-story/contributions/mine') {
          return new Response(
            JSON.stringify({
              data: [
                {
                  type: 'LifeStoryContribution', id: 'ctr_1',
                  attributes: {
                    contributionId: 'ctr_1', archiveId: 'arc_1',
                    contentText: 'I remember the garden that year', contributionState: 'Accepted',
                  },
                },
              ],
            }),
            { status: 200 },
          );
        }
        return new Response(JSON.stringify({ data: { id: 'x' } }), { status: 201 });
      }),
    );
    render(<SupporterApp onExit={() => undefined} />);
    // Honest framing before login: the participant decides.
    expect(screen.getByText(/always their\s+decision/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText(/Account identifier/), { target: { value: 'actor_sup' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'View my contributions' }));
    });
    // The accepted state is truthful: a supporter contribution, not testimony.
    expect(screen.getByText(/not as their own testimony/)).toBeTruthy();
  });

  it('a denied proposal explains the relationship + consent prerequisites instead of a bare error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({ error: { code: 'RESOURCE_NOT_FOUND', message: 'x', requestId: 'r', retryable: false } }),
          { status: 404 },
        ),
      ),
    );
    render(<SupporterApp onExit={() => undefined} />);
    fireEvent.change(screen.getByLabelText(/Account identifier/), { target: { value: 'actor_sup' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.change(screen.getByLabelText('Archive identifier'), { target: { value: 'arc_1' } });
    fireEvent.change(screen.getByLabelText('What you would like to add'), { target: { value: 'An extra detail' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Submit contribution' }));
    });
    expect(screen.getByRole('status').textContent).toContain('approved your relationship');
  });
});
