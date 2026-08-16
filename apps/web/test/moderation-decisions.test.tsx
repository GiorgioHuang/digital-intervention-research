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
                  // Deliberately the kind of thing a person writes about
                  // what was done to them: it carries where they go and
                  // when, which is what makes the queue card the wrong
                  // place for it.
                  reportDescription: 'He waits by the allotment gate on Tuesdays when I come to water',
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
    const dialog = screen.getByRole('alertdialog').textContent ?? '';
    expect(dialog).toContain('out of the community feed');
    expect(dialog).toContain('cannot be changed');
    /**
     * Immutability may not be the last thing said (C-5). "This cannot be
     * changed", full stop, reads as "and nothing can be done", which is
     * false twice over and lands hardest on the moderator hesitating over
     * a borderline case — told the decision is permanent and offered no
     * way back, doing nothing feels safest, and an untouched queue is its
     * own harm. Both true things have to follow it.
     */
    expect(dialog).toContain('not its effect');
    expect(dialog).toContain('can appeal');
    expect(dialog).toContain('other than you');
    // Nothing is sent before the confirmation is given.
    expect(calls.some((c) => c.method === 'POST')).toBe(false);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Confirm and record this decision' }));
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

  /**
   * Withholding the reporter's identifier is not the same as withholding
   * the reporter (C-6). Their own account of what happened was printed on
   * the queue card beside the category, on every open case at once — and a
   * person describing what was done to them writes in their own words,
   * which carry them: a place, a routine, a time of day, sometimes a name.
   *
   * The queue is the highest-risk surface on this screen. It is scanned
   * rather than read, it is on screen longer than anything else, and it is
   * what a shoulder or a shared display sees. The account is not removed —
   * a moderator needs it to decide — but reading it is now a deliberate
   * press, so a moderator triaging by category never opens it at all.
   */
  it('the reporter’s own words are not on the queue card, and are one press away', async () => {
    stubFetch('sp_1');
    const { container } = render(<StaffModeratorPanel session={session} />);
    await openQueue();
    const account = 'He waits by the allotment gate on Tuesdays when I come to water';

    const disclosure = container.querySelector('details');
    expect(disclosure, 'the account belongs behind a disclosure').not.toBeNull();
    expect(disclosure!.hasAttribute('open'), 'it must be closed by default').toBe(false);
    expect(disclosure!.textContent).toContain(account);

    /**
     * The load-bearing assertion, and it has to be phrased as absence from
     * the card rather than presence in the disclosure.
     *
     * The first version of this test asserted only that the account sits
     * inside the `<details>` — and it passed with the account put straight
     * back onto the card, because on the card it is interpolated into a
     * sentence, so `getByText` never matched it there and nothing noticed
     * the second copy. A guard that cannot see the defect it was written
     * for is worse than none.
     *
     * So: take the case card, remove the disclosure, and read what is left.
     */
    const card = screen.getByLabelText('Case mc_1').cloneNode(true) as HTMLElement;
    card.querySelectorAll('details').forEach((d) => d.remove());
    expect(card.textContent).toContain('harassment');
    expect(card.textContent, 'the reporter’s own words must not be on the card').not.toContain(account);
    expect(card.textContent, 'not even a fragment of them').not.toContain('allotment');
  });
});
