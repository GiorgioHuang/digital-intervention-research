import { useState } from 'react';
import { staffActionError, staffLoadError } from '../errors.js';
import {
  staffApi,
  type LockableVersion,
  type PendingApprovalItem,
  type PendingExportItem,
  type ProtocolInReview,
  type StaffSession,
} from '../staff-api.js';

type PendingAction =
  | { kind: 'protocol-approve'; id: string }
  | { kind: 'protocol-activate'; id: string }
  | { kind: 'dataset-lock'; id: string }
  | { kind: 'export-decide'; id: string; decision: 'Approved' | 'Rejected' }
  | { kind: 'approval-decide'; id: string; decision: 'Approved' | 'Rejected'; reason: string };

const ACTION_LABELS: Record<PendingAction['kind'], string> = {
  'protocol-approve': 'Approve protocol version (strong authentication)',
  'protocol-activate': 'Activate protocol version',
  'dataset-lock': 'Lock dataset version (strong authentication; a locked version cannot be changed)',
  'export-decide': 'Export decision (strong authentication)',
  'approval-decide': 'M15 approval decision (strong authentication)',
};

/**
 * Approver workspace (ADR-051): every decision is an explicit confirmed
 * step naming the exact artefact; MFA-tier actions are labelled so the
 * step-up is expected, not a surprise. You can never approve your own
 * submission — the server refuses it and this UI says so.
 */
export function StaffApproverPanel({ session }: { session: StaffSession }) {
  const [protocolVersionId, setProtocolVersionId] = useState('');
  const [datasetVersionId, setDatasetVersionId] = useState('');
  const [exportRequestId, setExportRequestId] = useState('');
  const [approval, setApproval] = useState({ id: '', reason: '' });
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [queues, setQueues] = useState<{
    protocols: ProtocolInReview[];
    locks: LockableVersion[];
    exports: PendingExportItem[];
    approvals: PendingApprovalItem[];
  } | null>(null);
  const [announcement, setAnnouncement] = useState('');

  const loadQueues = async () => {
    try {
      const [protocols, locks, exports, approvals] = await Promise.all([
        staffApi.listProtocolVersionsInReview(session),
        staffApi.listLockableDatasetVersions(session),
        staffApi.listPendingExports(session),
        staffApi.listPendingApprovals(session),
      ]);
      setQueues({
        protocols: protocols.data.map((i) => i.attributes),
        locks: locks.data.map((i) => i.attributes),
        exports: exports.data.map((i) => i.attributes),
        approvals: approvals.data.map((i) => i.attributes),
      });
      setAnnouncement('Pending work updated.');
    } catch (err) {
      setAnnouncement(staffLoadError(err, 'pending work'));
    }
  };

  const execute = async () => {
    if (pending === null) return;
    const action = pending;
    setPending(null);
    try {
      if (action.kind === 'protocol-approve') await staffApi.approveProtocolVersion(session, action.id);
      else if (action.kind === 'protocol-activate') await staffApi.activateProtocolVersion(session, action.id);
      else if (action.kind === 'dataset-lock') await staffApi.lockDatasetVersion(session, action.id);
      else if (action.kind === 'export-decide') await staffApi.decideExport(session, action.id, action.decision);
      else await staffApi.decideApproval(session, action.id, action.decision, action.reason);
      setAnnouncement(`Done: ${ACTION_LABELS[action.kind]} (${action.id})`);
    } catch (err) {
      setAnnouncement(staffActionError(err, ACTION_LABELS[action.kind]));
    }
  };

  return (
    <section aria-labelledby="approver-heading">
      <h2 id="approver-heading">Approvals</h2>
      <p>
        Every decision is recorded in your name and bound to an exact artefact. You cannot approve something you submitted
        yourself — the server refuses it, and another person with the right permission has to decide it (separation of
        duties).
        {session.authStrength !== 'mfa' &&
          ' Note: the actions marked as needing strong authentication will be refused while you are signed in at password level.'}
      </p>

      <p>
        <button onClick={() => void loadQueues()}>View pending work</button>
      </p>
      {queues !== null && (
        <section aria-labelledby="queues-heading">
          <h3 id="queues-heading">Pending work</h3>
          <h4>Protocol versions in review ({queues.protocols.length})</h4>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {queues.protocols.map((p) => (
              <li key={p.protocolVersionId}>
                {p.protocolVersionId} (version {p.versionNumber}, project {p.researchProjectId}, submitted by{' '}
                {p.submittedByActorId ?? 'unknown'}
                {p.submittedByActorId === session.actorId ? ' — that is you, so you cannot approve it' : ''}){' '}
                <button onClick={() => setProtocolVersionId(p.protocolVersionId)}>Select</button>
              </li>
            ))}
          </ul>
          <h4>Dataset versions that can be locked ({queues.locks.length})</h4>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {queues.locks.map((v) => (
              <li key={v.datasetVersionId}>
                {v.datasetVersionId} (version {v.versionNumber}, manifest hash {v.manifestHash.slice(0, 12)}…){' '}
                <button onClick={() => setDatasetVersionId(v.datasetVersionId)}>Select</button>
              </li>
            ))}
          </ul>
          <h4>Exports waiting for a decision ({queues.exports.length})</h4>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {queues.exports.map((e) => (
              <li key={e.exportRequestId}>
                {e.exportRequestId} ({e.exportType}, purpose: {e.purpose}, recipient: {e.recipient}, de-identification:{' '}
                {e.deIdentification}){' '}
                <button onClick={() => setExportRequestId(e.exportRequestId)}>Select</button>
              </li>
            ))}
          </ul>
          <h4>Approval records waiting for a decision ({queues.approvals.length})</h4>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {queues.approvals.map((a) => (
              <li key={a.approvalRecordId}>
                {a.approvalRecordId} ({a.artefactType} {a.artefactId} version {a.artefactVersion}, requested by{' '}
                {a.requestedByActorId}
                {a.requestedByActorId === session.actorId ? ' — that is you, so you cannot approve it' : ''}){' '}
                <button onClick={() => setApproval((f) => ({ ...f, id: a.approvalRecordId }))}>Select</button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <h3>Protocol version</h3>
      <p>
        <label htmlFor="ap-pv">Protocol version identifier</label>{' '}
        <input id="ap-pv" value={protocolVersionId} onChange={(e) => setProtocolVersionId(e.target.value)} />{' '}
        <button disabled={protocolVersionId === ''} onClick={() => setPending({ kind: 'protocol-approve', id: protocolVersionId })}>
          Approve protocol version (strong authentication)
        </button>{' '}
        <button disabled={protocolVersionId === ''} onClick={() => setPending({ kind: 'protocol-activate', id: protocolVersionId })}>
          Activate protocol version
        </button>
      </p>

      <h3>Dataset lock</h3>
      <p>
        Locking is a human decision that needs strong authentication. A locked version cannot be changed, and analysis can
        only run against a locked version.
      </p>
      <p>
        <label htmlFor="ap-dv">Dataset version identifier</label>{' '}
        <input id="ap-dv" value={datasetVersionId} onChange={(e) => setDatasetVersionId(e.target.value)} />{' '}
        <button disabled={datasetVersionId === ''} onClick={() => setPending({ kind: 'dataset-lock', id: datasetVersionId })}>
          Lock dataset version (strong authentication)
        </button>
      </p>

      <h3>Export decision</h3>
      <p>
        <label htmlFor="ap-ex">Export request identifier</label>{' '}
        <input id="ap-ex" value={exportRequestId} onChange={(e) => setExportRequestId(e.target.value)} />{' '}
        <button
          disabled={exportRequestId === ''}
          onClick={() => setPending({ kind: 'export-decide', id: exportRequestId, decision: 'Approved' })}
        >
          Approve export (strong authentication)
        </button>{' '}
        <button
          disabled={exportRequestId === ''}
          onClick={() => setPending({ kind: 'export-decide', id: exportRequestId, decision: 'Rejected' })}
        >
          Reject export (strong authentication)
        </button>
      </p>

      <h3>M15 approval record</h3>
      <p>
        <label htmlFor="ap-apr">Approval record identifier</label>{' '}
        <input id="ap-apr" value={approval.id} onChange={(e) => setApproval({ ...approval, id: e.target.value })} />{' '}
        <input
          aria-label="Reason for the approval decision"
          placeholder="Reason (required)"
          value={approval.reason}
          onChange={(e) => setApproval({ ...approval, reason: e.target.value })}
        />{' '}
        <button
          disabled={approval.id === '' || approval.reason === ''}
          onClick={() => setPending({ kind: 'approval-decide', id: approval.id, decision: 'Approved', reason: approval.reason })}
        >
          Approve approval record (strong authentication)
        </button>{' '}
        <button
          disabled={approval.id === '' || approval.reason === ''}
          onClick={() => setPending({ kind: 'approval-decide', id: approval.id, decision: 'Rejected', reason: approval.reason })}
        >
          Reject approval record (strong authentication)
        </button>
      </p>

      {pending !== null && (
        <div role="alertdialog" aria-labelledby="approve-confirm">
          <p id="approve-confirm">
            Confirm “{ACTION_LABELS[pending.kind]}” on <strong>{pending.id}</strong>
            {'decision' in pending ? `, decision: ${pending.decision === 'Approved' ? 'approve' : 'reject'}` : ''}? This
            decision is recorded in your name in the audit trail.
          </p>
          <button onClick={() => void execute()}>Confirm</button>{' '}
          <button onClick={() => setPending(null)}>Back</button>
        </div>
      )}

      <p aria-live="polite" role="status">
        {announcement}
      </p>
    </section>
  );
}
