import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { StaffSafetyTriagePanel } from '../src/components/StaffSafetyTriagePanel.js';
import { StaffApproverPanel } from '../src/components/StaffApproverPanel.js';

const session = { actorId: 'actor_staff', authStrength: 'mfa' as const };

function stubFetch(routes: Record<string, unknown>) {
  const calls: { path: string; method: string }[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (path: string, init?: RequestInit) => {
      calls.push({ path, method: init?.method ?? 'GET' });
      const hit = Object.entries(routes).find(([prefix]) => path.startsWith(prefix));
      return new Response(JSON.stringify(hit === undefined ? { data: [] } : hit[1]), { status: 200 });
    }),
  );
  return calls;
}

const protocolRow = (submittedBy: string) => ({
  '/v1/protocol-versions/in-review': {
    data: [
      {
        type: 'ProtocolVersion',
        id: 'pv_7',
        attributes: {
          protocolVersionId: 'pv_7',
          researchProjectId: 'rp_1',
          versionNumber: 2,
          contentHash: '9b1c4e0a7d55f2318a6e0c4477bd91ea3c8f2d6b17a409e5cc0d84f1b2e73a60',
          submittedByActorId: submittedBy,
          updatedAt: '2026-08-01T09:14:00Z',
        },
      },
    ],
  },
});

describe('staff work queues replace manual identifier entry', () => {
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('triage queue lists open signals and prefills the form on selection', async () => {
    stubFetch({
      '/v1/safety-signals/pending-triage': {
        data: [
          {
            type: 'SafetySignal',
            id: 'ss_9',
            attributes: {
              signalId: 'ss_9', sourceType: 'Participant', category: 'wellbeing',
              severity: 'High', description: 'Feeling unsafe', signalState: 'Recorded',
            },
          },
        ],
      },
    });
    render(<StaffSafetyTriagePanel session={session} />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'View signals waiting for triage' }));
    });
    expect(screen.getByText(/Feeling unsafe/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Work on this signal' }));
    expect((screen.getByLabelText('Signal identifier') as HTMLInputElement).value).toBe('ss_9');
  });

  /**
   * The defect this pins down shipped once: the queue said "that is you,
   * so you cannot approve it" while an approve button sitting under a
   * typed identifier stayed enabled. RESEARCHER_WORKSPACE §1.5 calls
   * clickable-then-403 a design error, so the control itself must be
   * unavailable.
   */
  it('an approver cannot press approve on their own submission', async () => {
    const calls = stubFetch(protocolRow('actor_staff'));
    await act(async () => {
      render(<StaffApproverPanel session={session} />);
    });
    expect(screen.getByText(/You submitted this\./)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Approve this protocol version' })).toHaveProperty('disabled', true);
    // No identifier field exists to route around the disabled control.
    expect(screen.queryByLabelText('Protocol version identifier')).toBeNull();
    expect(calls.every((c) => c.method === 'GET')).toBe(true);
  });

  it('someone else’s submission is decidable, and the decision names the exact version and hash', async () => {
    const calls = stubFetch(protocolRow('actor_other'));
    await act(async () => {
      render(<StaffApproverPanel session={session} />);
    });
    expect(screen.getByText(/You did not draft or submit this version/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Approve this protocol version' }));

    // §1.4: type, identifier, exact version and the FULL hash are in the
    // confirmation, not behind a disclosure.
    const dialog = screen.getByRole('alertdialog');
    expect(dialog.textContent).toContain('pv_7');
    expect(dialog.textContent).toContain('v2');
    expect(dialog.textContent).toContain('9b1c4e0a7d55f2318a6e0c4477bd91ea3c8f2d6b17a409e5cc0d84f1b2e73a60');
    expect(dialog.textContent).toContain('in your name');
    expect(calls.some((c) => c.method === 'POST')).toBe(false);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    });
    expect(calls.some((c) => c.method === 'POST' && c.path === '/v1/protocol-versions/pv_7/approve')).toBe(true);
  });

  /**
   * §1.4: if the artefact changed while it was being read, the decision
   * must not be applied to something the approver has not seen.
   */
  it('a version that changed while it was being read is not decided', async () => {
    const calls = stubFetch(protocolRow('actor_other'));
    await act(async () => {
      render(<StaffApproverPanel session={session} />);
    });
    fireEvent.click(screen.getByRole('button', { name: 'Approve this protocol version' }));

    // The server now reports a different content hash for the same id.
    vi.unstubAllGlobals();
    const after = stubFetch({
      '/v1/protocol-versions/in-review': {
        data: [
          {
            type: 'ProtocolVersion',
            id: 'pv_7',
            attributes: {
              protocolVersionId: 'pv_7', researchProjectId: 'rp_1', versionNumber: 2,
              contentHash: '0000000000000000000000000000000000000000000000000000000000000001', submittedByActorId: 'actor_other',
              updatedAt: '2026-08-01T11:00:00Z',
            },
          },
        ],
      },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    });
    expect(after.some((c) => c.method === 'POST')).toBe(false);
    expect(screen.getByRole('status').textContent).toContain('changed while you were reading it');
    expect(screen.getByRole('status').textContent).toContain('Nothing was submitted');
    expect(calls.some((c) => c.method === 'POST')).toBe(false);
  });

  /**
   * §1.6 is symmetrical: an action outside the strong-authentication tier
   * must not be dressed as if it were in it. `protocol.activate` carries
   * no `minimumAuthStrength` in the catalogue.
   */
  it('activation is not labelled as needing strong authentication', async () => {
    stubFetch(protocolRow('actor_other'));
    await act(async () => {
      render(<StaffApproverPanel session={session} />);
    });
    const activate = screen.getByRole('button', { name: 'Activate this protocol version' });
    expect(activate).toHaveProperty('disabled', false);
    const notes = screen.getAllByRole('note').map((n) => n.textContent ?? '');
    expect(notes.some((t) => t.includes('Approving a protocol version') && t.includes('strong authentication'))).toBe(true);
    expect(
      notes.some((t) => t.includes('Activating') && t.includes('not in the strong-authentication tier')),
    ).toBe(true);
  });

  /**
   * Decision D-11: the definition's approver may also lock the version.
   * The screen has to say so — silence would leave someone who approved
   * the definition guessing whether the button is theirs to press — and
   * it still names the approver, because permitted is not invisible.
   */
  it('locking says plainly that the definition approver may also lock, and names them', async () => {
    stubFetch({
      '/v1/dataset-versions/lockable': {
        data: [
          {
            type: 'DatasetVersion',
            id: 'dv_9',
            attributes: {
              datasetVersionId: 'dv_9', datasetDefinitionId: 'dd_2', versionNumber: 3,
              manifestHash: 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90',
              definitionApprovedByActorId: 'actor_staff',
            },
          },
        ],
      },
    });
    await act(async () => {
      render(<StaffApproverPanel session={session} />);
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Dataset locks' }));
    });
    const article = screen.getByRole('article', { name: 'Dataset version dv_9' });
    expect(article.textContent).toContain('that is you, which is permitted here');
    expect(screen.getByText(/not barred by separation of duties/)).toBeTruthy();
    // Being the approver does not disable the control.
    expect(screen.getByRole('button', { name: 'Lock this dataset version' })).toHaveProperty('disabled', false);
  });

  /** Rejecting an export uses the same permission key as approving it. */
  it('rejecting an export is presented with the same authority as approving it', async () => {
    stubFetch({
      '/v1/export-requests/pending': {
        data: [
          {
            type: 'ExportRequest',
            id: 'er_3',
            attributes: {
              exportRequestId: 'er_3', exportType: 'Analysis dataset', purpose: 'Secondary analysis',
              recipient: 'Partner university', deIdentification: 'Anonymised', requestedByActorId: 'actor_other',
            },
          },
        ],
      },
    });
    await act(async () => {
      render(<StaffApproverPanel session={session} />);
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Exports' }));
    });
    const note = screen.getAllByRole('note').map((n) => n.textContent ?? '').join(' ');
    expect(note).toContain('approving and rejecting alike');
    expect(screen.getByRole('button', { name: 'Reject this export' })).toHaveProperty('disabled', false);
  });

  /**
   * A research export releases other people's data to a third party. A
   * portability request is a person asking for a copy of their own
   * information, where identifiable is not a finding but the point.
   * Presenting them as one decision could push an approver into refusing
   * a lawful request, or make the phrase familiar enough to wave through
   * a research export that should never carry it.
   */
  it('a request for someone\u2019s own information is not framed as a research export', async () => {
    stubFetch({
      '/v1/export-requests/pending': {
        data: [
          {
            type: 'ExportRequest',
            id: 'er_4',
            attributes: {
              exportRequestId: 'er_4',
              exportType: 'ParticipantPortability',
              purpose: 'A copy of my own information, requested by me',
              recipient: 'participant-self',
              deIdentification: 'None',
              restrictions: 'third-party content excluded per source restrictions',
              requestedByActorId: 'actor_pat',
            },
          },
        ],
      },
    });
    await act(async () => {
      render(<StaffApproverPanel session={session} />);
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Exports' }));
    });
    expect(screen.getByText('Someone asking for a copy of their own information.')).toBeTruthy();
    // A limit already imposed on the request, so the approver is not left
    // assuming the worst about what would be released.
    expect(screen.getByText('third-party content excluded per source restrictions')).toBeTruthy();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Approve this export' }));
    });
    const dialog = screen.getByRole('alertdialog').textContent ?? '';
    expect(dialog).toContain('Identifiable is correct here');
    expect(dialog).toContain('database refuses an identifiable research export');
  });

  it('refusing a request for own information says what it refuses', async () => {
    stubFetch({
      '/v1/export-requests/pending': {
        data: [
          {
            type: 'ExportRequest',
            id: 'er_5',
            attributes: {
              exportRequestId: 'er_5',
              exportType: 'ParticipantPortability',
              purpose: 'A copy of my own information, requested by me',
              recipient: 'participant-self',
              deIdentification: 'None',
              restrictions: '',
              requestedByActorId: 'actor_pat',
            },
          },
        ],
      },
    });
    await act(async () => {
      render(<StaffApproverPanel session={session} />);
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Exports' }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Reject this export' }));
    });
    const dialog = screen.getByRole('alertdialog').textContent ?? '';
    expect(dialog).toContain('refuses a person\u2019s request for a copy of their own information');
    // Still the same authority as approving — rejection is not the lighter act.
    expect(dialog).toContain('needs the same authority');
  });
});
