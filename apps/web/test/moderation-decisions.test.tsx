import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { StaffModeratorPanel } from '../src/components/StaffModeratorPanel.js';

const session = { actorId: 'actor_mod', authStrength: 'password' as const };

function stubFetch(contentId: string | null) {
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
            data: [
              {
                type: 'ModerationCase',
                id: 'mc_1',
                attributes: {
                  moderationCaseId: 'mc_1',
                  subjectActorId: 'actor_subject',
                  caseState: 'Reported',
                  reportCategory: 'harassment',
                  reportDescription: 'what was said',
                  reportedContentId: contentId,
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
  return calls;
}

const openQueue = async () => {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'View open cases' }));
  });
};

describe('moderation decisions', () => {
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  /**
   * These five are in the design and in the database vocabulary, and no
   * account restriction mechanism exists anywhere in the platform. A
   * button called "Suspend account" would close the case, report success,
   * and leave the person posting.
   */
  it('offers nothing the platform cannot carry out, and names what is missing', async () => {
    stubFetch('sp_1');
    render(<StaffModeratorPanel session={session} />);
    await openQueue();
    for (const absent of [/suspend/i, /^ban$/i, /restrict/i, /disconnect/i, /escalat/i]) {
      expect(screen.queryByRole('button', { name: absent })).toBeNull();
    }
    expect(screen.getByText(/leave the person posting/)).toBeTruthy();
    expect(screen.getByText(/no route from moderation to the safety workspace yet/)).toBeTruthy();
  });

  it('every decision says what it actually does, next to the button', async () => {
    stubFetch('sp_1');
    render(<StaffModeratorPanel session={session} />);
    await openQueue();
    expect(screen.getByText(/Takes the post out of the community feed\. It still exists/)).toBeTruthy();
    // Warning is a record of something done elsewhere, not something the
    // platform sends.
    expect(screen.getByText(/The platform does not send anything/)).toBeTruthy();
  });

  /**
   * Before this, "Remove content" on a case about behaviour closed the
   * case, reported success, and removed nothing.
   */
  it('a case that names no content is not offered the decisions that act on content', async () => {
    stubFetch(null);
    render(<StaffModeratorPanel session={session} />);
    await openQueue();
    for (const absent of ['Hide the content', 'Remove the content', 'Put the content back']) {
      expect(screen.queryByRole('button', { name: absent })).toBeNull();
    }
    expect(screen.getByText(/names no content, so the decisions that act on content are not offered/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Dismiss and close the case' })).toBeTruthy();
  });

  it('a case that names content can have it hidden', async () => {
    const calls = stubFetch('sp_1');
    render(<StaffModeratorPanel session={session} />);
    await openQueue();
    fireEvent.change(screen.getByLabelText('Reason (required)'), { target: { value: 'Breaches the space rules' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Hide the content' }));
    });
    // The consequence is repeated in the confirmation, where the decision
    // is actually being taken.
    expect(screen.getByRole('alertdialog').textContent).toContain('out of the community feed');
    expect(screen.getByRole('alertdialog').textContent).toContain('cannot be changed');
    // Nothing is sent before the confirmation is given.
    expect(calls.some((c) => c.method === 'POST')).toBe(false);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    });
    const posted = calls.find((c) => c.method === 'POST');
    expect(posted?.path).toBe('/v1/moderation-cases/mc_1/decision');
    expect(posted?.body).toMatchObject({ decision: 'Hide', reason: 'Breaches the space rules', confirmed: true });
  });

  it('a decision needs a written reason', async () => {
    stubFetch('sp_1');
    render(<StaffModeratorPanel session={session} />);
    await openQueue();
    expect(screen.getByRole('button', { name: 'Dismiss and close the case' })).toHaveProperty('disabled', true);
    fireEvent.change(screen.getByLabelText('Reason (required)'), { target: { value: 'Nothing in this breaks a rule' } });
    expect(screen.getByRole('button', { name: 'Dismiss and close the case' })).toHaveProperty('disabled', false);
  });

  it('the queue still never says who reported the case', async () => {
    stubFetch('sp_1');
    render(<StaffModeratorPanel session={session} />);
    await openQueue();
    expect(screen.getByText(/never shows who reported a case/)).toBeTruthy();
  });
});
