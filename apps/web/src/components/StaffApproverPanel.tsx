import { useState } from 'react';
import type { StaffSession } from '../staff-api.js';
import { AnalysisDecisions } from './approver/AnalysisDecisions.js';
import { ApprovalRecords } from './approver/ApprovalRecords.js';
import { DatasetDefinitions } from './approver/DatasetDefinitions.js';
import { DatasetLock } from './approver/DatasetLock.js';
import { EvidenceDecisions } from './approver/EvidenceDecisions.js';
import { EvidenceReviews } from './approver/EvidenceReviews.js';
import { ExportDecisions } from './approver/ExportDecisions.js';
import { ProtocolDecisions } from './approver/ProtocolDecisions.js';
import { ReportDecisions } from './approver/ReportDecisions.js';

/**
 * Approver workspace. One screen per decision type rather than one screen
 * holding four kinds of decision behind free-text identifier fields.
 *
 * The old single panel had the defect RESEARCHER_WORKSPACE §1.5 names
 * outright: the queue said "that is you, so you cannot approve it", and
 * the approve button underneath was still enabled against a typed
 * identifier — clickable, then 403. Deciding now starts from the queue
 * row, so the control a person can press is a control the server will
 * accept, and each decision carries the exact artefact it binds to
 * (§1.4) instead of an identifier the approver has to trust they typed
 * correctly.
 */
type Decision = 'protocol' | 'definition' | 'dataset' | 'evidence' | 'evidence-decision' | 'report' | 'analysis' | 'export' | 'approval';

const DECISIONS: { key: Decision; label: string }[] = [
  { key: 'protocol', label: 'Protocol versions' },
  // The step the lock queue waits on. Without it nothing could ever
  // reach that queue, and the locking screen had never had a row in it.
  { key: 'definition', label: 'Dataset definitions' },
  { key: 'dataset', label: 'Dataset locks' },
  // The reports beside the exports: nothing listed report versions,
  // so none could ever be approved.
  // Nothing listed submitted evidence reviews, so none could be
  // approved: search worked, and the end of the chain did not.
  { key: 'evidence', label: 'Evidence reviews' },
  { key: 'evidence-decision', label: 'Evidence decisions' },
  { key: 'report', label: 'Report versions' },
  // Plan, interpretation and finding: three approvals nothing listed.
  { key: 'analysis', label: 'Analysis' },
  { key: 'export', label: 'Exports' },
  { key: 'approval', label: 'Approval records' },
];

export function StaffApproverPanel({ session }: { session: StaffSession }) {
  const [screen, setScreen] = useState<Decision>('protocol');

  return (
    <section aria-labelledby="approver-heading">
      <h1 id="approver-heading">Approvals</h1>
      <p>
        Every decision is recorded in your name and bound to an exact artefact. You cannot decide something you
        submitted yourself — separation of duties, enforced by the server and shown here before you reach the control.
      </p>
      {/*
        The authentication level is stated once, by the screen you are on,
        because that note also names which action needs it. Repeating it
        here would be a second sentence saying less.
      */}

      <nav aria-label="Decision type">
        <ul>
          {DECISIONS.map((d) => (
            <li key={d.key}>
              <button aria-current={screen === d.key ? 'page' : undefined} onClick={() => setScreen(d.key)}>
                {d.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {screen === 'protocol' && <ProtocolDecisions session={session} />}
      {screen === 'definition' && <DatasetDefinitions session={session} />}
      {screen === 'dataset' && <DatasetLock session={session} />}
      {screen === 'evidence' && <EvidenceReviews session={session} />}
      {screen === 'evidence-decision' && <EvidenceDecisions session={session} />}
      {screen === 'report' && <ReportDecisions session={session} />}
      {screen === 'analysis' && <AnalysisDecisions session={session} />}
      {screen === 'export' && <ExportDecisions session={session} />}
      {screen === 'approval' && <ApprovalRecords session={session} />}
    </section>
  );
}
