import { PlatformApiError, type ApiError } from './api.js';

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
    },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as T & { error?: ApiError };
  if (!res.ok) throw new PlatformApiError(json.error as ApiError, res.status);
  return json;
}

type Id = { data: { id: string } };

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
  '转为安全事件（Converted to Safety Event）',
  '协议/干预版本批准',
  '数据集锁定（DatasetLock）',
  '导出批准',
  'M15 审批决定',
] as const;
