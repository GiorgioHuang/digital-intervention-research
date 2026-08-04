import { accessTokenHeader, raiseApiError, type ApiError } from './api.js';

/**
 * Staff-side HTTP client. Same boundary rules as the participant client:
 * HTTP only, no module imports. The UI never decides authority — every
 * command is judged by the server's permission engine; this client just
 * forwards the dev-header identity and the authentication strength so
 * MFA-tier actions are honestly represented (production OIDC pending
 * ADR-104).
 */
export interface StaffSession {
  actorId: string;
  authStrength: 'password' | 'mfa';
}

async function post<T>(session: StaffSession, path: string, body: object): Promise<T> {
  const res = await fetch(path, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-actor-id': session.actorId,
      'x-auth-strength': session.authStrength,
      ...accessTokenHeader(),
    },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as T & { error?: ApiError };
  if (!res.ok) raiseApiError(json, res.status);
  return json;
}

async function get<T>(session: StaffSession, path: string): Promise<T> {
  const res = await fetch(path, {
    headers: { 'x-actor-id': session.actorId, 'x-auth-strength': session.authStrength, ...accessTokenHeader() },
  });
  const json = (await res.json()) as T & { error?: ApiError };
  if (!res.ok) raiseApiError(json, res.status);
  return json;
}

type Id = { data: { id: string } };
type List<A> = { data: { id: string; attributes: A }[] };

export interface TriageQueueItem {
  signalId: string;
  sourceType: string;
  category: string;
  severity: string;
  description: string;
  signalState: string;
}
export interface ProtocolInReview {
  protocolVersionId: string;
  researchProjectId: string;
  versionNumber: number;
  /** The exact content the decision binds to (RESEARCHER_WORKSPACE §1.4). */
  contentHash: string;
  submittedByActorId: string | null;
  updatedAt: string;
}
export interface PendingApprovalItem {
  approvalRecordId: string;
  artefactType: string;
  artefactId: string;
  artefactVersion: number;
  requestedByActorId: string;
}
export interface LockableVersion {
  datasetVersionId: string;
  datasetDefinitionId: string;
  versionNumber: number;
  manifestHash: string;
  definitionApprovedByActorId: string | null;
}
export interface PendingExportItem {
  exportRequestId: string;
  exportType: string;
  purpose: string;
  recipient: string;
  deIdentification: string;
  requestedByActorId: string;
}
export interface ModerationCaseItem {
  moderationCaseId: string;
  subjectActorId: string;
  caseState: string;
  reportCategory: string | null;
  reportDescription: string | null;
}
export interface EnrolmentItem {
  enrolmentId: string;
  participantId: string;
  researchProjectId: string;
  enrolmentState: string;
}

export const staffApi = {
  // M09 safety triage
  triageSignal: (
    s: StaffSession,
    signalId: string,
    disposition: 'Closed as Not a Safety Event' | 'Escalated' | 'Converted to Safety Event',
    reason: string,
  ) =>
    post<{ data: { meta: { safetyEventId?: string } } }>(s, `/v1/safety-signals/${signalId}/triage`, {
      disposition,
      reason,
      confirmed: true,
    }),

  // M05 enrolment chain
  invite: (s: StaffSession, participantId: string, researchProjectId: string, protocolVersionId: string) =>
    post<Id>(s, '/v1/enrolments/invite', { participantId, researchProjectId, protocolVersionId }),
  enrolmentStep: (s: StaffSession, enrolmentId: string, step: 'start-screening' | 'start-consent' | 'enrol' | 'activate') =>
    post<Id>(s, `/v1/enrolments/${enrolmentId}/${step}`, {}),
  eligibilityDecision: (s: StaffSession, enrolmentId: string, decision: 'Eligible' | 'Ineligible', reason: string) =>
    post<Id>(s, `/v1/enrolments/${enrolmentId}/eligibility-decision`, { decision, reason, confirmed: true }),
  withdrawEnrolment: (s: StaffSession, enrolmentId: string, reasonCategory: string) =>
    post<Id>(s, `/v1/enrolments/${enrolmentId}/withdraw`, { reasonCategory, confirmed: true }),

  // M04 protocol chain (researcher side)
  createProject: (s: StaffSession, organisationId: string, title: string) =>
    post<Id>(s, '/v1/research-projects', { organisationId, title }),
  draftProtocolVersion: (s: StaffSession, projectId: string, title: string, content: object) =>
    post<Id>(s, `/v1/research-projects/${projectId}/protocol-versions`, { title, content }),
  submitProtocolVersion: (s: StaffSession, versionId: string) =>
    post<Id>(s, `/v1/protocol-versions/${versionId}/submit`, {}),

  // Approver actions (all confirmed; server enforces MFA where required)
  approveProtocolVersion: (s: StaffSession, versionId: string) =>
    post<Id>(s, `/v1/protocol-versions/${versionId}/approve`, { confirmed: true }),
  activateProtocolVersion: (s: StaffSession, versionId: string) =>
    post<Id>(s, `/v1/protocol-versions/${versionId}/activate`, { confirmed: true }),
  lockDatasetVersion: (s: StaffSession, versionId: string) =>
    post<Id>(s, `/v1/dataset-versions/${versionId}/lock`, { confirmed: true }),
  decideExport: (s: StaffSession, exportRequestId: string, decision: 'Approved' | 'Rejected') =>
    post<Id>(s, `/v1/export-requests/${exportRequestId}/decide`, { decision, confirmed: true }),
  decideApproval: (s: StaffSession, approvalRecordId: string, decision: 'Approved' | 'Rejected', reason: string) =>
    post<Id>(s, `/v1/approvals/${approvalRecordId}/decide`, { decision, reason, confirmed: true }),

  // Work queues (role-gated read side; seeing a queue is not deciding it)
  listPendingTriage: (s: StaffSession) => get<List<TriageQueueItem>>(s, '/v1/safety-signals/pending-triage'),
  listProtocolVersionsInReview: (s: StaffSession) => get<List<ProtocolInReview>>(s, '/v1/protocol-versions/in-review'),
  listPendingApprovals: (s: StaffSession) => get<List<PendingApprovalItem>>(s, '/v1/approvals/pending'),
  listLockableDatasetVersions: (s: StaffSession) => get<List<LockableVersion>>(s, '/v1/dataset-versions/lockable'),
  listPendingExports: (s: StaffSession) => get<List<PendingExportItem>>(s, '/v1/export-requests/pending'),
  listEnrolments: (s: StaffSession, researchProjectId?: string) =>
    get<List<EnrolmentItem>>(
      s,
      researchProjectId === undefined || researchProjectId === ''
        ? '/v1/enrolments'
        : `/v1/enrolments?researchProjectId=${encodeURIComponent(researchProjectId)}`,
    ),

  // Moderation (queue omits reporter identity by design)
  listOpenModerationCases: (s: StaffSession) => get<List<ModerationCaseItem>>(s, '/v1/moderation-cases/open'),
  recordModerationDecision: (s: StaffSession, caseId: string, decision: string, reason: string) =>
    post<Id>(s, `/v1/moderation-cases/${caseId}/decision`, { decision, reason, confirmed: true }),

  // M14 export request (researcher side; identifiable exports impossible)
  requestExport: (
    s: StaffSession,
    purpose: string,
    recipient: string,
    sources: string[],
    deIdentification: 'Pseudonymised' | 'Anonymised',
  ) => post<Id>(s, '/v1/export-requests', { purpose, recipient, sources, deIdentification }),
};

/** MFA-tier actions (Doc 14): shown to staff so the step-up is never a surprise. */
export const MFA_REQUIRED_ACTIONS = [
  'Convert a safety signal to a safety event',
  'Approve a protocol or intervention version',
  'Lock a dataset version',
  'Approve an export',
  'Record an M15 approval decision',
] as const;
