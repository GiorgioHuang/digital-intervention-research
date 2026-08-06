import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { ResearchProjects } from '../src/components/ResearchProjects.js';

const session = { actorId: 'actor_r', authStrength: 'password' as const, organisationId: 'org_1' };

const PROJECTS = {
  data: [
    {
      type: 'ResearchProject',
      id: 'rp_1',
      attributes: {
        researchProjectId: 'rp_1',
        organisationId: 'org_1',
        title: 'Loneliness and life story work',
        createdByActorId: 'actor_r',
        createdAt: '2026-08-01T00:00:00Z',
        questions: [
          {
            researchQuestionId: 'rq_1',
            questionText: 'Does life story work reduce loneliness?',
            questionState: 'Draft',
            createdAt: '2026-08-02T00:00:00Z',
          },
        ],
      },
    },
  ],
};

function stubFetch(body: unknown = PROJECTS) {
  const calls: { path: string; method: string; body: Record<string, unknown> }[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (path: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET';
      if (method === 'GET') {
        calls.push({ path, method, body: {} });
        return new Response(JSON.stringify(body), { status: 200 });
      }
      calls.push({ path, method, body: JSON.parse(init!.body as string) as Record<string, unknown> });
      return new Response(JSON.stringify({ data: { id: 'rq_2' } }), { status: 201 });
    }),
  );
  return calls;
}

/**
 * project.view was granted to the researcher and checked by no code, and
 * nothing listed a project: its identifier appeared once in the message
 * announcing it, while every screen downstream asked for it back.
 */
describe('research projects', () => {
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('shows the identifier the screens downstream ask for', async () => {
    stubFetch();
    await act(async () => {
      render(<ResearchProjects session={session} />);
    });
    expect(screen.getByText('rp_1')).toBeTruthy();
    expect(screen.getByText('Does life story work reduce loneliness?')).toBeTruthy();
  });

  /**
   * project_state and project_phase have eight and nine values between
   * them and no writer, so every project carries the column defaults.
   * Printing them would put a study's position on screen as though
   * somebody had set it.
   */
  it('shows no lifecycle, and says why', async () => {
    stubFetch();
    await act(async () => {
      render(<ResearchProjects session={session} />);
    });
    expect(screen.getByText(/is not shown, because it is not recorded/i)).toBeTruthy();
    expect(document.body.textContent).not.toContain('Design');
  });

  /**
   * The distinction that keeps this from being the thing this project
   * refuses to build. A control nothing reads is a false promise; a
   * research question is documentation, and its reader is a person.
   */
  it('says a question is documentation rather than a setting', async () => {
    const calls = stubFetch();
    await act(async () => {
      render(<ResearchProjects session={session} />);
    });
    expect(screen.getByText(/it is not a filter, a gate or a setting/i)).toBeTruthy();
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Add a question'), { target: { value: 'Does it help?' } });
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Record this question' }));
    });
    const post = calls.find((c) => c.method === 'POST');
    expect(post?.path).toBe('/v1/research-projects/rp_1/questions');
    expect(post?.body['questionText']).toBe('Does it help?');
  });

  it('a project with no question says what is missing rather than looking complete', async () => {
    stubFetch({ data: [{ ...PROJECTS.data[0], attributes: { ...PROJECTS.data[0]!.attributes, questions: [] } }] });
    await act(async () => {
      render(<ResearchProjects session={session} />);
    });
    expect(screen.getByText(/nobody reading this project later will know what it set out to answer/i)).toBeTruthy();
  });

  it('without an organisation it asks for nothing rather than an unscoped list', async () => {
    const calls = stubFetch();
    await act(async () => {
      render(<ResearchProjects session={{ actorId: 'actor_r', authStrength: 'password' }} />);
    });
    expect(screen.getByRole('alert').textContent).toContain('without an organisation');
    expect(calls.length).toBe(0);
  });
});
