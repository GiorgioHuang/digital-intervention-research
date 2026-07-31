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
                    caseState: 'Reported', reportCategory: 'harassment', reportDescription: '骚扰消息',
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
    expect(screen.getByText(/不显示举报人身份/)).toBeTruthy();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '查看待处理个案' }));
    });
    expect(screen.getByText(/骚扰消息/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '处理此个案' }));
    expect((screen.getByLabelText('个案标识') as HTMLInputElement).value).toBe('mc_1');

    // Reason is mandatory; nothing posts before the confirmation dialog.
    expect(screen.getByRole('button', { name: '记录决定' })).toHaveProperty('disabled', true);
    fireEvent.change(screen.getByLabelText(/理由/), { target: { value: '首次违规，警告' } });
    fireEvent.click(screen.getByRole('button', { name: '记录决定' }));
    const dialog = screen.getByRole('alertdialog');
    expect(dialog.textContent).toContain('不可更改');
    expect(calls.filter((c) => c.body !== undefined).length).toBe(0);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '确认记录' }));
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
                    contentText: '我记得那年的花园', contributionState: 'Accepted',
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
    expect(screen.getByText(/是否采纳始终由本人决定/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText(/账户标识/), { target: { value: 'actor_sup' } });
    fireEvent.click(screen.getByRole('button', { name: '进入' }));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '查看我的贡献' }));
    });
    // The accepted state is truthful: a supporter contribution, not testimony.
    expect(screen.getByText(/不是本人证言/)).toBeTruthy();
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
    fireEvent.change(screen.getByLabelText(/账户标识/), { target: { value: 'actor_sup' } });
    fireEvent.click(screen.getByRole('button', { name: '进入' }));
    fireEvent.change(screen.getByLabelText('档案标识'), { target: { value: 'arc_1' } });
    fireEvent.change(screen.getByLabelText('你想补充的内容'), { target: { value: '补充内容' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '提交贡献' }));
    });
    expect(screen.getByRole('status').textContent).toContain('已批准你们的关系');
  });
});
