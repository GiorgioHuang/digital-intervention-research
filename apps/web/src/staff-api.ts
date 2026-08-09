import { accessTokenHeader, platformClientHeader, raiseApiError, type ApiError } from './api.js';

/**
 * Staff-side HTTP client. Same boundary rules as the participant client:
 * HTTP only, no module imports. The UI never decides authority — every
 * command is judged by the server's permission engine; this client just
 * forwards the dev-header identity and the authentication strength so
 * MFA-tier actions are honestly represented (production OIDC pending
 * ADR-104).
 */
export interface InvitationItem {
  invitationId: string;
  userAccountId: string | null;
  displayName: string | null;
  invitedEmail: string;
  expiresAt: string;
  invitedBy: string | null;
  createdAt: string;
}

export interface StaffSession {
  actorId: string;
  /**
   * 'step-up' outranks 'mfa' in the permission engine: it is a fresh
   * re-authentication, which answers a harder question than "was a second
   * factor used at some point today".
   */
  authStrength: 'password' | 'mfa' | 'step-up';
  /**
   * Organisation the staff member is acting in. Scoped reads use it, and
   * the server takes it from the request context rather than a query
   * parameter — a caller-supplied organisation would turn a scoped
   * listing into a probe for which organisations exist.
   */
  organisationId?: string;
}

/**
 * Purpose accompanies a request; the permission engine refuses an action
 * whose declared purpose does not match the one it allows. Sending it only
 * where it is needed keeps a purpose from being asserted by default.
 */
function purposeHeader(purpose?: string): Record<string, string> {
  return purpose === undefined ? {} : { 'x-purpose-code': purpose };
}

function orgHeader(session: StaffSession): Record<string, string> {
  return session.organisationId === undefined || session.organisationId === ''
    ? {}
    : { 'x-organisation-id': session.organisationId };
}

async function post<T>(session: StaffSession, path: string, body: object): Promise<T> {
  const res = await fetch(path, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-actor-id': session.actorId,
      'x-auth-strength': session.authStrength,
      ...orgHeader(session),
      ...platformClientHeader(),
      ...accessTokenHeader(),
    },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as T & { error?: ApiError };
  if (!res.ok) raiseApiError(json, res.status);
  return json;
}

async function get<T>(session: StaffSession, path: string, purpose?: string): Promise<T> {
  const res = await fetch(path, {
    headers: {
      'x-actor-id': session.actorId,
      'x-auth-strength': session.authStrength,
      ...orgHeader(session),
      ...purposeHeader(purpose),
      ...platformClientHeader(),
      ...accessTokenHeader(),
    },
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
/** A protocol version and what became of it, for whoever submitted it. */
export interface ProtocolVersionItem {
  protocolVersionId: string;
  researchProjectId: string;
  versionNumber: number;
  versionState: string;
  contentHash: string;
  submittedByActorId: string | null;
  approvedByActorId: string | null;
  refusedByActorId: string | null;
  refusedReason: string | null;
  updatedAt: string;
}
export interface SafetyTimelineEntry {
  entryId: string;
  entryType: 'Action' | 'State';
  label: string;
  actionState: string | null;
  note: string;
  recordedByActorId: string;
  recordedAt: string;
}
export interface SafetyEventItem {
  safetyEventId: string;
  safetySignalId: string;
  eventState: string;
  confirmedByActorId: string;
  confirmedAt: string;
  category: string;
  severity: string;
  description: string;
  timeline: SafetyTimelineEntry[];
}
export interface InterventionConfigurationItem {
  interventionConfigurationId: string;
  researchProjectId: string;
  protocolVersionId: string;
  interventionVersionId: string;
  interventionCode: string;
  interventionName: string;
  versionNumber: number;
  versionState: string;
  configurationState: string;
  createdAt: string;
}

export interface InterventionSessionItem {
  interventionSessionId: string;
  enrolmentId: string;
  interventionConfigurationId: string;
  exposureState: string;
  deliveredByActorId: string;
  occurredAt: string;
}

export interface ResearchQuestionItem {
  researchQuestionId: string;
  questionText: string;
  questionState: string;
  createdAt: string;
}

export interface ResearchProjectItem {
  researchProjectId: string;
  organisationId: string;
  title: string;
  createdByActorId: string;
  createdAt: string;
  questions: ResearchQuestionItem[];
}

export interface RoleAssignmentItem {
  roleAssignmentId: string;
  role: string;
  organisationId: string | null;
  researchProjectId: string | null;
  assignmentState: string;
  expiresAt: string | null;
  assignedByActorId: string;
  revokedAt: string | null;
  revokedByActorId: string | null;
  recordVersion: number;
  createdAt: string;
}

export interface AccountItem {
  userAccountId: string;
  displayName: string;
  /** Returned verbatim; nothing in the platform ever writes it. */
  accountState: string;
  actorType: string;
  roles: RoleAssignmentItem[];
}

export interface InterventionVersionItem {
  interventionVersionId: string;
  versionNumber: number;
  versionState: string;
  submittedByActorId: string | null;
  approvedByActorId: string | null;
  approvedAt: string | null;
  recordVersion: number;
  createdAt: string;
}

export interface InterventionItem {
  interventionId: string;
  interventionCode: string;
  name: string;
  lifecycleMaturity: string;
  /** Returned verbatim; nothing in the platform ever writes either. */
  evidenceStatus: string;
  evidenceDirection: string;
  versions: InterventionVersionItem[];
}

/** One line of the platform's accountability record. */
export interface AuditEventItem {
  auditEventId: string;
  occurredAt: string;
  actorType: string;
  actorId: string;
  activeRole: string | null;
  authStrength: string | null;
  action: string;
  targetType: string;
  targetId: string;
  result: string;
  policyDecision: string | null;
  policyDecisionReason: string | null;
  policyVersion: string | null;
  source: string;
  participantId: string | null;
  accessReason: string | null;
}

export interface AuditFilters {
  accessReason: string;
  from?: string;
  to?: string;
  actorId?: string;
  action?: string;
  targetType?: string;
  targetId?: string;
  participantId?: string;
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
  restrictions: string;
  requestedByActorId: string;
}
export interface DefinitionAwaitingApprovalItem {
  datasetDefinitionId: string;
  researchProjectId: string;
  name: string;
  variables: Record<string, unknown>;
  createdByActorId: string;
  createdAt: string;
}
export interface DatasetWorkItem {
  datasetDefinitionId: string;
  name: string;
  definitionState: string;
  approvedByActorId: string | null;
  datasetVersionId: string | null;
  versionNumber: number | null;
  versionState: string | null;
  rowCount: number | null;
  updatedAt: string;
}
export interface KnowledgeResourceItem {
  externalIdentifier: string;
  title: string;
  sourceSystem: string;
  externalVersion: string;
  summary: string;
}
export interface EvidenceReferenceItem {
  knowledgeReferenceId: string;
  externalIdentifier: string;
  title: string;
  sourceSystem: string;
  externalVersion: string | null;
  resolutionState: string;
  retrievedAt: string | null;
}
export interface EvidenceReviewItem {
  evidenceReviewId: string;
  researchProjectId: string;
  question: string;
  reviewState: string;
  submittedByActorId: string | null;
  approvedByActorId: string | null;
  refusedByActorId: string | null;
  refusedReason: string | null;
  references: EvidenceReferenceItem[];
  updatedAt: string;
}
/**
 * A recorded emergency-access declaration awaiting its retrospective
 * review. The platform does not grant the access — see BreakGlassPanel —
 * so this is a record of what someone says they did and why.
 */
export interface BreakGlassRecordItem {
  breakGlassId: string;
  executedByActorId: string;
  reason: string;
  scope: string;
  expiresAt: string;
  createdAt: string;
}
export interface AnalysisPlanItem {
  analysisPlanId: string;
  researchProjectId: string;
  title: string;
  planState: string;
  draftedByActorId: string;
  approvedByActorId: string | null;
  refusedByActorId: string | null;
  refusedReason: string | null;
  updatedAt: string;
}
export interface AnalysisRunItem {
  analysisRunId: string;
  analysisPlanId: string;
  planTitle: string;
  datasetVersionId: string;
  datasetManifestHash: string;
  runState: string;
  startedByActorId: string;
  createdAt: string;
}
export interface InterpretationItem {
  interpretationRecordId: string;
  analysisRunId: string;
  planTitle: string;
  interpretationText: string;
  interpretationState: string;
  draftedByActorId: string;
  approvedByActorId: string | null;
  updatedAt: string;
}
export interface FindingItem {
  researchFindingId: string;
  interpretationRecordId: string;
  planTitle: string;
  findingText: string;
  findingState: string;
  draftedByActorId: string;
  approvedByActorId: string | null;
  refusedByActorId: string | null;
  refusedReason: string | null;
  updatedAt: string;
}
export interface AnalysisWorkPayload {
  plans: AnalysisPlanItem[];
  runs: AnalysisRunItem[];
  interpretations: InterpretationItem[];
  findings: FindingItem[];
}
export interface AnalysisApprovalsPayload {
  plans: AnalysisPlanItem[];
  interpretations: InterpretationItem[];
  findings: FindingItem[];
}
export interface EvidenceDecisionItem {
  evidenceDecisionId: string;
  evidenceReviewId: string;
  question: string;
  reviewState: string;
  outcome: string;
  rationale: string;
  approvalState: string;
  draftedByActorId: string;
  approvedByActorId: string | null;
  refusedByActorId: string | null;
  refusedReason: string | null;
  snapshotContentHash: string | null;
  updatedAt: string;
}
export interface ReportVersionAwaitingApprovalItem {
  reportVersionId: string;
  reportId: string;
  reportTitle: string;
  reportType: string;
  versionNumber: number;
  createdByActorId: string;
  createdAt: string;
}
export interface ReportWorkItem {
  reportId: string;
  title: string;
  reportType: string;
  reportVersionId: string | null;
  versionNumber: number | null;
  versionState: string | null;
  approvedByActorId: string | null;
  updatedAt: string;
}
export interface ExportToCarryOutItem {
  exportRequestId: string;
  exportType: string;
  purpose: string;
  recipient: string;
  requestState: string;
  manifestHash: string | null;
  updatedAt: string;
}
export interface ModerationCaseItem {
  moderationCaseId: string;
  subjectActorId: string;
  caseState: string;
  reportCategory: string | null;
  reportDescription: string | null;
  /** Null when the case is about behaviour rather than a piece of content;
   *  the decisions that act on content are not offered for those. */
  reportedContentId: string | null;
}
export interface AdministeredParticipant {
  participantId: string;
  displayName: string;
  participantState: string;
  userAccountId: string | null;
  registeredAt: string;
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

  // M09 safety events: created and then unreachable until now
  /**
   * Telling a participant the terms changed. Confirmed, because it stops
   * what the scope permits at the moment it is recorded.
   */
  requireReConsent: (
    s: StaffSession,
    participantId: string,
    scope: string,
    newTemplateVersion: string,
    whatChanged: string,
  ) =>
    post<Id>(s, `/v1/participants/${participantId}/consents/require-reconsent`, {
      scope,
      newTemplateVersion,
      whatChanged,
      confirmed: true,
    }),

  listInterventionConfigurations: (s: StaffSession, researchProjectId?: string) =>
    get<List<InterventionConfigurationItem>>(
      s,
      `/v1/intervention-configurations${researchProjectId === undefined || researchProjectId === '' ? '' : `?researchProjectId=${encodeURIComponent(researchProjectId)}`}`,
    ),
  createInterventionConfiguration: (
    s: StaffSession,
    researchProjectId: string,
    protocolVersionId: string,
    interventionVersionId: string,
  ) =>
    post<Id>(s, '/v1/intervention-configurations', {
      researchProjectId,
      protocolVersionId,
      interventionVersionId,
    }),
  listInterventionSessions: (s: StaffSession, enrolmentId: string) =>
    get<List<InterventionSessionItem>>(s, `/v1/enrolments/${enrolmentId}/intervention-sessions`),
  recordInterventionSession: (
    s: StaffSession,
    enrolmentId: string,
    interventionConfigurationId: string,
    exposureState: string,
  ) => post<Id>(s, '/v1/intervention-sessions', { enrolmentId, interventionConfigurationId, exposureState }),

  listResearchProjects: (s: StaffSession) => get<List<ResearchProjectItem>>(s, '/v1/research-projects'),
  addResearchQuestion: (s: StaffSession, researchProjectId: string, questionText: string) =>
    post<Id>(s, `/v1/research-projects/${researchProjectId}/questions`, { questionText }),

  listOrganisationAccounts: (s: StaffSession) => get<List<AccountItem>>(s, '/v1/user-accounts'),
  /** Version-bound: a role that changed underneath is refused, not merged. */
  revokeRole: (s: StaffSession, roleAssignmentId: string, expectedVersion: number) =>
    post<Id>(s, `/v1/role-assignments/${roleAssignmentId}/revoke`, { expectedVersion, confirmed: true }),
  inviteToPlatform: (s: StaffSession, input: { displayName: string; email: string; expiresInDays?: number }) =>
    post<{ data: { id: string; attributes: { userAccountId: string; invitedEmail: string; expiresAt: string } } }>(
      s,
      '/v1/account-invitations',
      input,
    ),
  listInvitations: (s: StaffSession) =>
    get<{ data: { id: string; attributes: InvitationItem }[] }>(s, '/v1/account-invitations'),
  revokeInvitation: (s: StaffSession, invitationId: string) =>
    post<Id>(s, `/v1/account-invitations/${invitationId}/revoke`, { confirmed: true }),
  assignRole: (s: StaffSession, userAccountId: string, role: string) =>
    post<Id>(s, `/v1/user-accounts/${userAccountId}/role-assignments`, { role, confirmed: true }),

  listInterventions: (s: StaffSession) => get<List<InterventionItem>>(s, '/v1/interventions'),
  createIntervention: (s: StaffSession, interventionCode: string, name: string) =>
    post<Id>(s, '/v1/interventions', { interventionCode, name }),
  createInterventionVersion: (s: StaffSession, interventionId: string, content: Record<string, unknown>) =>
    post<Id>(s, `/v1/interventions/${interventionId}/versions`, { content }),
  submitInterventionVersion: (s: StaffSession, versionId: string) =>
    post<Id>(s, `/v1/intervention-versions/${versionId}/submit`, {}),
  approveInterventionVersion: (s: StaffSession, versionId: string) =>
    post<Id>(s, `/v1/intervention-versions/${versionId}/approve`, { confirmed: true }),
  activateInterventionVersion: (s: StaffSession, versionId: string) =>
    post<Id>(s, `/v1/intervention-versions/${versionId}/activate`, { confirmed: true }),

  listSafetyEvents: (s: StaffSession) => get<List<SafetyEventItem>>(s, '/v1/safety-events'),

  /**
   * Reading the audit trail. The reason travels with the query because it
   * is recorded with it — this is the one read in the product that writes
   * something, and it writes before it returns anything.
   */
  listAuditEvents: (s: StaffSession, filters: AuditFilters) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(filters)) if (v !== undefined && v !== '') q.set(k, v);
    return get<List<AuditEventItem> & { meta?: { returned: number } }>(s, `/v1/audit-events?${q.toString()}`);
  },
  recordSafetyAction: (
    s: StaffSession,
    eventId: string,
    label: string,
    actionState: 'Not Started' | 'In Progress' | 'Completed' | 'No Action Taken',
    note: string,
  ) => post<Id>(s, `/v1/safety-events/${eventId}/actions`, { label, actionState, note, confirmed: true }),
  moveSafetyEvent: (s: StaffSession, eventId: string, toState: string, note: string) =>
    post<Id>(s, `/v1/safety-events/${eventId}/state`, { toState, note, confirmed: true }),

  /**
   * Proposing a relationship. Nothing in the product could do this: the
   * whole supporter path existed only for whoever could call the API, so a
   * coordinator could not bring a family member into the study at all.
   *
   * Proposing grants nothing — the participant approves it themselves.
   */
  proposeRelationship: (
    s: StaffSession,
    participantId: string,
    relatedActorId: string,
    relationshipType: string,
    permittedActions: string[],
  ) => post<Id>(s, '/v1/relationships', { participantId, relatedActorId, relationshipType, permittedActions }),

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
  /**
   * Refusing is the same authority as approving, exercised the other way,
   * so it goes to the same permission and always carries a reason - the
   * person whose work is refused has to be able to find out why.
   */
  rejectProtocolVersion: (s: StaffSession, versionId: string, reason: string) =>
    post<Id>(s, `/v1/protocol-versions/${versionId}/reject`, { reason, confirmed: true }),
  approveProtocolVersion: (s: StaffSession, versionId: string) =>
    post<Id>(s, `/v1/protocol-versions/${versionId}/approve`, { confirmed: true }),
  activateProtocolVersion: (s: StaffSession, versionId: string) =>
    post<Id>(s, `/v1/protocol-versions/${versionId}/activate`, { confirmed: true }),
  lockDatasetVersion: (s: StaffSession, versionId: string) =>
    post<Id>(s, `/v1/dataset-versions/${versionId}/lock`, { confirmed: true }),
  createDatasetDefinition: (s: StaffSession, researchProjectId: string, name: string, variables: string[]) =>
    post<Id>(s, '/v1/dataset-definitions', {
      researchProjectId,
      name,
      // Message bodies are excluded by default (ADR-034); the dictionary
      // names what is included, so an empty one includes nothing.
      variables: Object.fromEntries(variables.map((v) => [v, 'included'])),
    }),
  approveDatasetDefinition: (s: StaffSession, definitionId: string) =>
    post<Id>(s, `/v1/dataset-definitions/${definitionId}/approve`, { confirmed: true }),
  generateDatasetVersion: (s: StaffSession, definitionId: string, sourceDescription: string, rowCount: number) =>
    post<Id>(s, `/v1/dataset-definitions/${definitionId}/versions`, { sourceDescription, rowCount }),
  completeQualityReview: (s: StaffSession, versionId: string) =>
    post<Id>(s, `/v1/dataset-versions/${versionId}/complete-quality-review`, {}),
  decideExport: (s: StaffSession, exportRequestId: string, decision: 'Approved' | 'Rejected') =>
    post<Id>(s, `/v1/export-requests/${exportRequestId}/decide`, { decision, confirmed: true }),
  decideApproval: (s: StaffSession, approvalRecordId: string, decision: 'Approved' | 'Rejected', reason: string) =>
    post<Id>(s, `/v1/approvals/${approvalRecordId}/decide`, { decision, reason, confirmed: true }),

  // Work queues (role-gated read side; seeing a queue is not deciding it)
  listPendingTriage: (s: StaffSession) => get<List<TriageQueueItem>>(s, '/v1/safety-signals/pending-triage'),
  listProtocolVersionsInReview: (s: StaffSession) => get<List<ProtocolInReview>>(s, '/v1/protocol-versions/in-review'),
  /**
   * What became of the versions of one project. Nothing listed a
   * researcher's own versions at all: a submission left the screen and its
   * fate was learned by asking someone.
   */
  listProtocolVersions: (s: StaffSession, projectId: string) =>
    get<List<ProtocolVersionItem>>(s, `/v1/research-projects/${projectId}/protocol-versions`),
  listPendingApprovals: (s: StaffSession) => get<List<PendingApprovalItem>>(s, '/v1/approvals/pending'),
  listLockableDatasetVersions: (s: StaffSession) => get<List<LockableVersion>>(s, '/v1/dataset-versions/lockable'),
  listDefinitionsAwaitingApproval: (s: StaffSession) =>
    get<List<DefinitionAwaitingApprovalItem>>(s, '/v1/dataset-definitions/awaiting-approval'),
  listDatasetWork: (s: StaffSession) => get<List<DatasetWorkItem>>(s, '/v1/dataset-work'),
  listReportVersionsAwaitingApproval: (s: StaffSession) =>
    get<List<ReportVersionAwaitingApprovalItem>>(s, '/v1/report-versions/awaiting-approval'),
  listReportWork: (s: StaffSession) => get<List<ReportWorkItem>>(s, '/v1/report-work'),
  /**
   * Live read-through to the knowledge platform. An upstream failure is a
   * 503, never an empty "no evidence" answer — the screen must not turn
   * "we could not ask" into "there is nothing".
   */
  searchEvidence: (s: StaffSession, q: string) =>
    get<List<KnowledgeResourceItem>>(s, `/v1/evidence/search?q=${encodeURIComponent(q)}`),
  listEvidenceWork: (s: StaffSession) => get<List<EvidenceReviewItem>>(s, '/v1/evidence-reviews/mine'),
  listReviewsAwaitingApproval: (s: StaffSession) =>
    get<List<EvidenceReviewItem>>(s, '/v1/evidence-reviews/awaiting-approval'),
  createEvidenceReview: (s: StaffSession, researchProjectId: string, question: string) =>
    post<Id>(s, '/v1/evidence-reviews', { researchProjectId, question }),
  attachEvidenceReference: (s: StaffSession, reviewId: string, externalIdentifier: string) =>
    post<Id>(s, `/v1/evidence-reviews/${reviewId}/references`, { externalIdentifier }),
  submitEvidenceReview: (s: StaffSession, reviewId: string) =>
    post<Id>(s, `/v1/evidence-reviews/${reviewId}/submit`, {}),
  returnEvidenceReview: (s: StaffSession, reviewId: string, reason: string) =>
    post<Id>(s, `/v1/evidence-reviews/${reviewId}/return`, { reason, confirmed: true }),
  approveEvidenceReview: (s: StaffSession, reviewId: string) =>
    post<Id>(s, `/v1/evidence-reviews/${reviewId}/approve`, { confirmed: true }),
  listBreakGlassPendingReview: (s: StaffSession) =>
    get<List<BreakGlassRecordItem>>(s, '/v1/break-glass/pending-review'),
  /**
   * Named "record" and not "get access": the platform stores the
   * declaration and does not widen anyone's permissions on the strength
   * of it.
   */
  recordBreakGlass: (s: StaffSession, reason: string, scope: string, expiresAt: string) =>
    post<Id>(s, '/v1/break-glass', { reason, scope, expiresAt, confirmed: true }),
  reviewBreakGlass: (s: StaffSession, breakGlassId: string, outcome: 'Justified' | 'Not Justified' | 'Needs Follow-Up') =>
    post<Id>(s, `/v1/break-glass/${breakGlassId}/review`, { outcome, confirmed: true }),
  listDecisionWork: (s: StaffSession) => get<List<EvidenceDecisionItem>>(s, '/v1/evidence-decisions/mine'),
  listAnalysisWork: (s: StaffSession) => get<{ data: AnalysisWorkPayload }>(s, '/v1/analysis-work'),
  listAnalysisApprovals: (s: StaffSession) => get<{ data: AnalysisApprovalsPayload }>(s, '/v1/analysis-approvals'),
  draftAnalysisPlan: (s: StaffSession, researchProjectId: string, title: string) =>
    post<Id>(s, '/v1/analysis-plans', { researchProjectId, title }),
  rejectAnalysisPlan: (s: StaffSession, planId: string, reason: string) =>
    post<Id>(s, `/v1/analysis-plans/${planId}/reject`, { reason, confirmed: true }),
  approveAnalysisPlan: (s: StaffSession, planId: string) =>
    post<Id>(s, `/v1/analysis-plans/${planId}/approve`, { confirmed: true }),
  /**
   * Records that an analysis was run and what it produced. The platform
   * does not perform the analysis, so the wording never says it did.
   */
  runAnalysis: (
    s: StaffSession,
    analysisPlanId: string,
    datasetVersionId: string,
    outputs: string,
    runState: 'Completed' | 'Completed with Warnings' | 'Failed',
  ) =>
    post<Id>(s, '/v1/analysis-runs', {
      analysisPlanId,
      datasetVersionId,
      outputs: { summary: outputs },
      environment: {},
      runState,
    }),
  draftInterpretation: (s: StaffSession, runId: string, interpretationText: string) =>
    post<Id>(s, `/v1/analysis-runs/${runId}/interpretations`, { interpretationText }),
  approveInterpretation: (s: StaffSession, interpretationId: string) =>
    post<Id>(s, `/v1/interpretations/${interpretationId}/approve`, { confirmed: true }),
  draftResearchFinding: (s: StaffSession, interpretationId: string, findingText: string) =>
    post<Id>(s, `/v1/interpretations/${interpretationId}/findings`, { findingText }),
  rejectResearchFinding: (s: StaffSession, findingId: string, reason: string) =>
    post<Id>(s, `/v1/findings/${findingId}/reject`, { reason, confirmed: true }),
  approveResearchFinding: (s: StaffSession, findingId: string) =>
    post<Id>(s, `/v1/findings/${findingId}/approve`, { confirmed: true }),
  listDecisionsAwaitingApproval: (s: StaffSession) =>
    get<List<EvidenceDecisionItem>>(s, '/v1/evidence-decisions/awaiting-approval'),
  draftEvidenceDecision: (s: StaffSession, evidenceReviewId: string, outcome: string, rationale: string) =>
    post<Id>(s, '/v1/evidence-decisions', { evidenceReviewId, outcome, rationale }),
  rejectEvidenceDecision: (s: StaffSession, decisionId: string, reason: string) =>
    post<Id>(s, `/v1/evidence-decisions/${decisionId}/reject`, { reason, confirmed: true }),
  approveEvidenceDecision: (s: StaffSession, decisionId: string) =>
    post<Id>(s, `/v1/evidence-decisions/${decisionId}/approve`, { confirmed: true }),
  createResearchReport: (s: StaffSession, researchProjectId: string, title: string, reportType: string) =>
    post<Id>(s, '/v1/research-reports', { researchProjectId, title, reportType }),
  draftReportVersion: (s: StaffSession, reportId: string, text: string) =>
    post<Id>(s, `/v1/research-reports/${reportId}/versions`, { content: { text } }),
  approveReportVersion: (s: StaffSession, reportVersionId: string) =>
    post<Id>(s, `/v1/report-versions/${reportVersionId}/approve`, { confirmed: true }),
  listPendingExports: (s: StaffSession) => get<List<PendingExportItem>>(s, '/v1/export-requests/pending'),
  listExportsToCarryOut: (s: StaffSession) =>
    get<List<ExportToCarryOutItem>>(s, '/v1/export-requests/to-carry-out'),
  generateExportPackage: (s: StaffSession, exportRequestId: string) =>
    post(s, `/v1/export-requests/${exportRequestId}/generate`, {}),
  /**
   * A record of what a person did, not something the platform performs.
   * Generated is not Delivered and Delivered is not Received.
   */
  recordExportDelivery: (s: StaffSession, exportRequestId: string, state: 'Delivered' | 'Received') =>
    post(s, `/v1/export-requests/${exportRequestId}/delivery`, { state }),
  listEnrolments: (s: StaffSession, researchProjectId?: string) =>
    get<List<EnrolmentItem>>(
      s,
      researchProjectId === undefined || researchProjectId === ''
        ? '/v1/enrolments'
        : `/v1/enrolments?researchProjectId=${encodeURIComponent(researchProjectId)}`,
    ),

  // M02 administrative participant list (decision D-13): identifier, name
  // and account state only — no research content, so it is not consent-gated.
  listParticipants: (s: StaffSession) =>
    get<List<AdministeredParticipant>>(s, '/v1/participants', 'platform-administration'),

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
