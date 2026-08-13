import { Body, Controller, Get, Inject, Param, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { PlatformError } from '@platform/kernel';
import {
  activateProtocolVersion,
  approveProtocolVersion,
  rejectProtocolVersion,
  createProtocolVersion,
  createResearchProject,
  createResearchQuestion,
  listProtocolVersions,
  listProtocolVersionsInReview,
  listResearchProjects,
  submitProtocolVersion,
} from '@platform/m04-research-design';
import { listParticipantsForOrganisation } from '@platform/m02-participant';
import {
  activateEnrolment,
  enrolParticipant,
  inviteParticipant,
  listEnrolments,
  recordEligibilityDecision,
  startConsentProcess,
  startScreening,
  withdrawParticipant,
} from '@platform/m05-enrolment';
import {
  createOrganisation,
  listOrganisationAccounts,
  listOrganisationsForActor,
  revokeRole,
  inviteToPlatform,
  inviteExistingAccount,
  revokeInvitation,
  setAccountState,
  listPendingInvitations,
  assignRole,
} from '@platform/m01-identity-org';
import { listInterventionSessions, recordInterventionSession } from '@platform/m07-delivery';
import {
  activateInterventionVersion,
  approveInterventionVersion,
  createIntervention,
  createInterventionConfiguration,
  createInterventionVersion,
  submitInterventionVersion,
  listInterventions,
  listInterventionConfigurations,
} from '@platform/m06-intervention-portfolio';
import {
  listSafetyEvents,
  listSignalsAwaitingTriage,
  recordSafetyAction,
  triageSafetySignal,
  updateSafetyEventState,
} from '@platform/m09-safety';
import {
  approveEvidenceDecision,
  rejectEvidenceDecision,
  approveEvidenceReview,
  returnEvidenceReviewForRevision,
  attachKnowledgeReference,
  createEvidenceReview,
  draftEvidenceDecision,
  listDecisionWork,
  listDecisionsAwaitingApproval,
  listEvidenceWork,
  listReviewsAwaitingApproval,
  searchKnowledgeEvidence,
  submitEvidenceReview,
  type EvidenceDecisionOutcome,
} from '@platform/m10-evidence';
import { createCommunitySpace, listOpenModerationCases, recordModerationDecision } from '@platform/m18-community-social';
import {
  approveReportVersion,
  createReport,
  decideExport,
  draftReportVersion,
  generateExportPackage,
  listExportsToCarryOut,
  listPendingExportRequests,
  listReportVersionsAwaitingApproval,
  listReportWork,
  recordExportDelivery,
  requestResearchExport,
} from '@platform/m14-reporting';
import {
  decideApproval,
  executeBreakGlass,
  liftGovernanceHold,
  listAuditEvents,
  listBreakGlassPendingReview,
  listPendingApprovals,
  placeGovernanceHold,
  requestApproval,
  reviewBreakGlass,
} from '@platform/m15-governance';
import {
  approveDatasetDefinition,
  completeQualityReview,
  createDatasetDefinition,
  generateDatasetVersion,
  listDatasetWork,
  listDefinitionsAwaitingApproval,
  listLockableDatasetVersions,
  lockDatasetVersion,
} from '@platform/m12-dataset';
import {
  approveAnalysisPlan,
  rejectAnalysisPlan,
  approveInterpretation,
  approveResearchFinding,
  rejectResearchFinding,
  draftAnalysisPlan,
  draftInterpretation,
  draftResearchFinding,
  listAnalysisApprovals,
  listAnalysisWork,
  runAnalysis,
} from '@platform/m13-analysis';
import { API_DEPS, type ApiDeps } from './controllers.js';
import { requireActor } from './http-context.js';

/**
 * Staff-side command surface (Doc 15): research design, enrolment,
 * dataset lineage, and analysis chains. Every human authority stays
 * human here — eligibility decisions, protocol approvals (separation of
 * duties, ADR-051), DatasetLock (human + MFA), interpretation and
 * finding approvals. The HTTP layer only maps requests onto the module
 * commands; it never bypasses their checks.
 */
@Controller('v1')
export class StaffCommandController {
  constructor(@Inject(API_DEPS) private readonly deps: ApiDeps) {}

  // --- Staff work queues (role-gated read side) ------------------------

  @Get('safety-signals/pending-triage')
  async pendingTriage(@Req() req: Request) {
    const ctx = requireActor(req);
    const items = await listSignalsAwaitingTriage(this.deps.m09, ctx);
    return { data: items.map((i) => ({ type: 'SafetySignal', id: i.signalId, attributes: i })) };
  }

  @Get('approvals/pending')
  async pendingApprovals(@Req() req: Request) {
    const ctx = requireActor(req);
    const items = await listPendingApprovals(this.deps.m15, ctx);
    return { data: items.map((i) => ({ type: 'ApprovalRecord', id: i.approvalRecordId, attributes: i })) };
  }

  /**
   * Administrative participant list for one organisation (decision D-13).
   * The organisation comes from the request context, never from a query
   * parameter: a caller-supplied organisation would turn this into a probe
   * for which organisations exist and who is in them.
   */
  @Get('participants')
  async administeredParticipants(@Req() req: Request) {
    const ctx = requireActor(req);
    if (ctx.organisationId === undefined) {
      throw new PlatformError('ORGANISATION_CONTEXT_REQUIRED', 'An organisation context is required to list participants');
    }
    const items = await listParticipantsForOrganisation(this.deps.m02, ctx);
    return { data: items.map((i) => ({ type: 'Participant', id: i.participantId, attributes: i })) };
  }

  @Get('protocol-versions/in-review')
  async protocolVersionsInReview(@Req() req: Request) {
    const ctx = requireActor(req);
    const items = await listProtocolVersionsInReview(this.deps.m04, ctx);
    return { data: items.map((i) => ({ type: 'ProtocolVersion', id: i.protocolVersionId, attributes: i })) };
  }

  @Get('dataset-versions/lockable')
  async lockableDatasetVersions(@Req() req: Request) {
    const ctx = requireActor(req);
    const items = await listLockableDatasetVersions(this.deps.m12, ctx);
    return { data: items.map((i) => ({ type: 'DatasetVersion', id: i.datasetVersionId, attributes: i })) };
  }

  /**
   * Dataset definitions waiting to be approved. Without this the chain
   * stopped at its first step and the lock queue could never fill.
   */
  @Get('dataset-definitions/awaiting-approval')
  async definitionsAwaitingApproval(@Req() req: Request) {
    const ctx = requireActor(req);
    const items = await listDefinitionsAwaitingApproval(this.deps.m12, ctx);
    return { data: items.map((i) => ({ type: 'DatasetDefinition', id: i.datasetDefinitionId, attributes: i })) };
  }

  /** Report versions waiting to be approved — nothing listed them, so none could be. */
  @Get('report-versions/awaiting-approval')
  async reportVersionsAwaitingApproval(@Req() req: Request) {
    const ctx = requireActor(req);
    const items = await listReportVersionsAwaitingApproval(this.deps.m14, ctx);
    return { data: items.map((i) => ({ type: 'ReportVersion', id: i.reportVersionId, attributes: i })) };
  }

  /** Reports and their versions, for whoever writes them. */
  @Get('report-work')
  async reportWork(@Req() req: Request) {
    const ctx = requireActor(req);
    const items = await listReportWork(this.deps.m14, ctx);
    return {
      data: items.map((i) => ({
        type: 'Report',
        id: `${i.reportId}:${i.reportVersionId ?? 'none'}`,
        attributes: i,
      })),
    };
  }

  /** The dataset work in front of whoever prepares data, and where it has got to. */
  @Get('dataset-work')
  async datasetWork(@Req() req: Request) {
    const ctx = requireActor(req);
    const items = await listDatasetWork(this.deps.m12, ctx);
    return {
      data: items.map((i) => ({
        type: 'DatasetDefinition',
        id: `${i.datasetDefinitionId}:${i.datasetVersionId ?? 'none'}`,
        attributes: i,
      })),
    };
  }

  /**
   * The analysis chain as it stands. Every step had a command and none
   * had a screen, so the chain could only be followed by someone driving
   * the API directly.
   */
  @Get('analysis-work')
  async analysisWork(@Req() req: Request) {
    const ctx = requireActor(req);
    return { data: await listAnalysisWork(this.deps.m13, ctx) };
  }

  /** What the approver has waiting across the analysis chain. */
  @Get('analysis-approvals')
  async analysisApprovals(@Req() req: Request) {
    const ctx = requireActor(req);
    return { data: await listAnalysisApprovals(this.deps.m13, ctx) };
  }

  /**
   * Exports already agreed to, which still have to be carried out.
   * Approving used to be the end of the road: nothing listed an approved
   * request, so the package was never put together and the delivery
   * never recorded.
   */
  @Get('export-requests/to-carry-out')
  async exportsToCarryOut(@Req() req: Request) {
    const ctx = requireActor(req);
    const items = await listExportsToCarryOut(this.deps.m14, ctx);
    return { data: items.map((i) => ({ type: 'ExportRequest', id: i.exportRequestId, attributes: i })) };
  }

  @Get('export-requests/pending')
  async pendingExports(@Req() req: Request) {
    const ctx = requireActor(req);
    const items = await listPendingExportRequests(this.deps.m14, ctx);
    return { data: items.map((i) => ({ type: 'ExportRequest', id: i.exportRequestId, attributes: i })) };
  }

  @Get('break-glass/pending-review')
  async pendingBreakGlass(@Req() req: Request) {
    const ctx = requireActor(req);
    const items = await listBreakGlassPendingReview(this.deps.m15, ctx);
    return { data: items.map((i) => ({ type: 'BreakGlassRecord', id: i.breakGlassId, attributes: i })) };
  }

  /**
   * The one way to read the audit trail.
   *
   * Sixty-one call sites write to it and nothing read one, while
   * `audit.view` sat granted to three roles and checked by no code — the
   * platform's whole accountability record was append-only and
   * unreadable.
   *
   * The reason is a query parameter because it is recorded with the read.
   * Reading the audit is itself an audited action (Doc 15 §21): a trail
   * whose readers leave no trace is the one record a misuser has no
   * reason to avoid.
   */
  @Get('audit-events')
  async auditEvents(
    @Req() req: Request,
    @Query('accessReason') accessReason: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('actorId') actorId?: string,
    @Query('action') action?: string,
    @Query('targetType') targetType?: string,
    @Query('targetId') targetId?: string,
    @Query('participantId') participantId?: string,
    @Query('limit') limit?: string,
  ) {
    const ctx = requireActor(req);
    const items = await listAuditEvents(this.deps.m15, ctx, {
      accessReason: accessReason ?? '',
      ...(from === undefined ? {} : { from }),
      ...(to === undefined ? {} : { to }),
      ...(actorId === undefined ? {} : { actorId }),
      ...(action === undefined ? {} : { action }),
      ...(targetType === undefined ? {} : { targetType }),
      ...(targetId === undefined ? {} : { targetId }),
      ...(participantId === undefined ? {} : { participantId }),
      ...(limit === undefined ? {} : { limit: Number(limit) }),
    });
    return {
      data: items.map((i) => ({ type: 'AuditEvent', id: i.auditEventId, attributes: i })),
      // Said rather than left to be inferred from a round number: a full
      // page is the likeliest place for somebody to conclude they have
      // seen everything there is.
      meta: { returned: items.length },
    };
  }

  @Get('enrolments')
  async enrolments(@Req() req: Request, @Query('researchProjectId') researchProjectId?: string) {
    const ctx = requireActor(req);
    const items = await listEnrolments(
      this.deps.m05,
      ctx,
      researchProjectId === undefined ? {} : { researchProjectId },
    );
    return { data: items.map((i) => ({ type: 'Enrolment', id: i.enrolmentId, attributes: i })) };
  }

  // --- M18 moderation ---------------------------------------------------

  @Get('moderation-cases/open')
  async openModerationCases(@Req() req: Request) {
    const ctx = requireActor(req);
    // Reporter identity is deliberately absent from the queue (Doc 15 §61).
    const items = await listOpenModerationCases(this.deps.m18, ctx);
    return { data: items.map((i) => ({ type: 'ModerationCase', id: i.moderationCaseId, attributes: i })) };
  }

  @Post('moderation-cases/:caseId/decision')
  async recordModerationDecision(
    @Req() req: Request,
    @Param('caseId') moderationCaseId: string,
    @Body() body: {
      decision: 'Dismiss' | 'Warn' | 'Restrict' | 'Hide' | 'Remove' | 'Suspend' | 'Disconnect' | 'Ban' | 'Restore' | 'Escalate';
      reason: string;
      confirmed: boolean;
    },
  ) {
    const ctx = requireActor(req);
    // Human, confirmed, immutable: the decision row cannot be altered
    // afterwards (DB trigger) and automation is refused outright.
    const result = await recordModerationDecision(this.deps.m18, ctx, {
      moderationCaseId,
      decision: body.decision,
      reason: body.reason,
      confirmed: body.confirmed === true,
    });
    return {
      data: {
        type: 'ModerationDecision',
        id: result.moderationDecisionId,
        meta: { moderationCaseId, decision: body.decision },
      },
    };
  }

  // --- M04 research design -------------------------------------------

  @Post('research-projects')
  async createProject(@Req() req: Request, @Body() body: { organisationId: string; title: string }) {
    const ctx = requireActor(req);
    const result = await createResearchProject(this.deps.m04, ctx, body);
    return { data: { type: 'ResearchProject', id: result.researchProjectId } };
  }

  @Post('research-projects/:projectId/protocol-versions')
  async draftProtocolVersion(
    @Req() req: Request,
    @Param('projectId') researchProjectId: string,
    @Body() body: { protocolId?: string; title?: string; content: object },
  ) {
    const ctx = requireActor(req);
    const input: Parameters<typeof createProtocolVersion>[2] = { researchProjectId, content: body.content };
    if (body.protocolId !== undefined) input.protocolId = body.protocolId;
    if (body.title !== undefined) input.title = body.title;
    const result = await createProtocolVersion(this.deps.m04, ctx, input);
    return {
      data: {
        type: 'ProtocolVersion',
        id: result.protocolVersionId,
        meta: { protocolId: result.protocolId, versionNumber: result.versionNumber },
      },
    };
  }

  @Post('protocol-versions/:versionId/submit')
  async submitProtocol(@Req() req: Request, @Param('versionId') versionId: string) {
    const ctx = requireActor(req);
    await submitProtocolVersion(this.deps.m04, ctx, versionId);
    return { data: { type: 'ProtocolVersion', id: versionId, meta: { state: 'In Review' } } };
  }

  @Post('protocol-versions/:versionId/approve')
  async approveProtocol(@Req() req: Request, @Param('versionId') versionId: string, @Body() body: { confirmed: boolean }) {
    const ctx = requireActor(req);
    await approveProtocolVersion(this.deps.m04, ctx, versionId, body.confirmed === true);
    return { data: { type: 'ProtocolVersion', id: versionId, meta: { state: 'Approved' } } };
  }

  /**
   * Refusing carries the same permission as approving - they are one
   * authority exercised two ways - so there is no separate route guard,
   * only a required reason.
   */
  @Get('research-projects/:projectId/protocol-versions')
  async protocolVersions(@Req() req: Request, @Param('projectId') projectId: string) {
    const ctx = requireActor(req);
    const items = await listProtocolVersions(this.deps.m04, ctx, projectId);
    return { data: items.map((i) => ({ type: 'ProtocolVersion', id: i.protocolVersionId, attributes: i })) };
  }

  @Post('protocol-versions/:versionId/reject')
  async rejectProtocol(
    @Req() req: Request,
    @Param('versionId') versionId: string,
    @Body() body: { reason: string; confirmed: boolean },
  ) {
    const ctx = requireActor(req);
    await rejectProtocolVersion(this.deps.m04, ctx, versionId, {
      reason: body.reason ?? '',
      confirmed: body.confirmed === true,
    });
    return { data: { type: 'ProtocolVersion', id: versionId, meta: { state: 'Rejected' } } };
  }

  @Post('protocol-versions/:versionId/activate')
  async activateProtocol(@Req() req: Request, @Param('versionId') versionId: string, @Body() body: { confirmed: boolean }) {
    const ctx = requireActor(req);
    await activateProtocolVersion(this.deps.m04, ctx, versionId, body.confirmed === true);
    return { data: { type: 'ProtocolVersion', id: versionId, meta: { state: 'Active' } } };
  }

  // --- M05 enrolment --------------------------------------------------

  @Post('enrolments/invite')
  async invite(
    @Req() req: Request,
    @Body() body: { participantId: string; researchProjectId: string; protocolVersionId: string },
  ) {
    const ctx = requireActor(req);
    const result = await inviteParticipant(this.deps.m05, ctx, body);
    return { data: { type: 'Enrolment', id: result.enrolmentId, meta: { state: 'Invited' } } };
  }

  @Post('enrolments/:enrolmentId/start-screening')
  async startScreening(@Req() req: Request, @Param('enrolmentId') enrolmentId: string) {
    const ctx = requireActor(req);
    await startScreening(this.deps.m05, ctx, enrolmentId);
    return { data: { type: 'Enrolment', id: enrolmentId, meta: { state: 'Screening' } } };
  }

  @Post('enrolments/:enrolmentId/eligibility-decision')
  async eligibility(
    @Req() req: Request,
    @Param('enrolmentId') enrolmentId: string,
    @Body() body: { decision: 'Eligible' | 'Ineligible'; reason: string; confirmed: boolean },
  ) {
    const ctx = requireActor(req);
    // Human authority: the module refuses service accounts outright.
    const result = await recordEligibilityDecision(this.deps.m05, ctx, {
      enrolmentId,
      decision: body.decision,
      reason: body.reason,
      confirmed: body.confirmed === true,
    });
    return { data: { type: 'EligibilityDecision', id: result.eligibilityDecisionId } };
  }

  @Post('enrolments/:enrolmentId/start-consent')
  async startConsent(@Req() req: Request, @Param('enrolmentId') enrolmentId: string) {
    const ctx = requireActor(req);
    await startConsentProcess(this.deps.m05, ctx, enrolmentId);
    return { data: { type: 'Enrolment', id: enrolmentId, meta: { state: 'Consenting' } } };
  }

  @Post('enrolments/:enrolmentId/enrol')
  async enrol(@Req() req: Request, @Param('enrolmentId') enrolmentId: string) {
    const ctx = requireActor(req);
    await enrolParticipant(this.deps.m05, ctx, enrolmentId);
    return { data: { type: 'Enrolment', id: enrolmentId, meta: { state: 'Enrolled' } } };
  }

  @Post('enrolments/:enrolmentId/activate')
  async activate(@Req() req: Request, @Param('enrolmentId') enrolmentId: string) {
    const ctx = requireActor(req);
    await activateEnrolment(this.deps.m05, ctx, enrolmentId);
    return { data: { type: 'Enrolment', id: enrolmentId, meta: { state: 'Active' } } };
  }

  @Post('enrolments/:enrolmentId/withdraw')
  async withdraw(
    @Req() req: Request,
    @Param('enrolmentId') enrolmentId: string,
    @Body() body: { reasonCategory?: string; confirmed: boolean },
  ) {
    const ctx = requireActor(req);
    const input: Parameters<typeof withdrawParticipant>[2] = { enrolmentId, confirmed: body.confirmed === true };
    if (body.reasonCategory !== undefined) input.reasonCategory = body.reasonCategory;
    await withdrawParticipant(this.deps.m05, ctx, input);
    return { data: { type: 'Enrolment', id: enrolmentId, meta: { state: 'Withdrawn' } } };
  }

  // --- M04 projects and questions ---------------------------------------

  /**
   * The projects in this organisation and the questions they ask.
   *
   * `project.view` was granted to the researcher and checked nowhere, and
   * nothing listed a project: one was created, its identifier was shown
   * once in an announcement, and every screen downstream then asked for
   * that identifier back from memory.
   */
  @Get('research-projects')
  async researchProjects(@Req() req: Request) {
    const ctx = requireActor(req);
    const items = await listResearchProjects(this.deps.m04, ctx);
    return { data: items.map((p) => ({ type: 'ResearchProject', id: p.researchProjectId, attributes: p })) };
  }

  /** The question a study asks. Documentation, read by people — nothing
   *  in the platform acts on it, and the screen says so. */
  @Post('research-projects/:researchProjectId/questions')
  async addResearchQuestion(
    @Req() req: Request,
    @Param('researchProjectId') researchProjectId: string,
    @Body() body: { questionText: string },
  ) {
    const ctx = requireActor(req);
    const result = await createResearchQuestion(this.deps.m04, ctx, {
      researchProjectId,
      questionText: body.questionText ?? '',
    });
    return { data: { type: 'ResearchQuestion', id: result.researchQuestionId } };
  }

  // --- M07 delivery -----------------------------------------------------

  /**
   * Which intervention version a project is running, and what was
   * actually delivered under it.
   *
   * M07 held one command and nothing else — no query, no route, no
   * screen. An intervention could be approved and put into use and
   * nobody could record that a participant had received it. Delivery was
   * the part of a delivery platform with no way in.
   */
  @Get('intervention-configurations')
  async interventionConfigurations(@Req() req: Request, @Query('researchProjectId') researchProjectId?: string) {
    const ctx = requireActor(req);
    const items = await listInterventionConfigurations(this.deps.m06, ctx, researchProjectId);
    return {
      data: items.map((c) => ({
        type: 'InterventionConfiguration',
        id: c.interventionConfigurationId,
        attributes: c,
      })),
    };
  }

  @Get('enrolments/:enrolmentId/intervention-sessions')
  async interventionSessions(@Req() req: Request, @Param('enrolmentId') enrolmentId: string) {
    const ctx = requireActor(req);
    const items = await listInterventionSessions(this.deps.m07, ctx, enrolmentId);
    return {
      data: items.map((s) => ({ type: 'InterventionSession', id: s.interventionSessionId, attributes: s })),
    };
  }

  /** Recording what actually happened. Never what was meant to happen. */
  @Post('intervention-sessions')
  async recordSession(
    @Req() req: Request,
    @Body() body: {
      enrolmentId: string;
      interventionConfigurationId: string;
      exposureState:
        | 'Offered' | 'Viewed' | 'Started' | 'Partially Received' | 'Completed'
        | 'Skipped' | 'Declined' | 'Failed' | 'Interrupted';
    },
  ) {
    const ctx = requireActor(req);
    const result = await recordInterventionSession(this.deps.m07, ctx, {
      enrolmentId: body.enrolmentId,
      interventionConfigurationId: body.interventionConfigurationId,
      exposureState: body.exposureState,
    });
    return { data: { type: 'InterventionSession', id: result.interventionSessionId } };
  }

  // --- M01 accounts and roles -------------------------------------------

  /**
   * Who holds what in this organisation.
   *
   * `revokeRole` has existed since M01 was written — permission check,
   * version guard, domain event, audit entry — with no route and no
   * screen, and `user.view` was granted to two roles and checked nowhere.
   * Access could be given and never taken back.
   *
   * The organisation comes from the request context and never from an
   * argument: a listing that takes an organisation identifier is a way of
   * asking which organisations exist.
   */
  @Get('user-accounts')
  async organisationAccounts(@Req() req: Request) {
    const ctx = requireActor(req);
    const items = await listOrganisationAccounts(this.deps.m01, ctx);
    return { data: items.map((a) => ({ type: 'UserAccount', id: a.userAccountId, attributes: a })) };
  }

  /**
   * The organisations this person may act in.
   *
   * Staff used to type an organisation identifier into a box on the
   * sign-in screen, which meant finding it with a SQL query first. It is
   * a value the server has always known and the person never should have
   * had to.
   */
  @Get('organisations')
  async organisations(@Req() req: Request) {
    const ctx = requireActor(req);
    const items = await listOrganisationsForActor(this.deps.m01, ctx);
    return { data: items.map((o) => ({ type: 'Organisation', id: o.organisationId, attributes: o })) };
  }

  /** Creating one. `createOrganisation` was another command with no route. */
  @Post('organisations')
  async createOrganisationRoute(@Req() req: Request, @Body() body: { name: string }) {
    const ctx = requireActor(req);
    const result = await createOrganisation(this.deps.m01, ctx, { name: body.name });
    return { data: { type: 'Organisation', id: result.organisationId } };
  }

  /**
   * Inviting somebody onto the platform (ADR-104).
   *
   * Before this route, the only way to invite anybody was to write a row
   * into the database of a running deployment by hand. That is fine once,
   * for the first administrator; as the standing answer to "how do I add a
   * coordinator" it is a way of guaranteeing that expiries go unset and
   * addresses go unlowercased.
   *
   * It does NOT send an email — the platform has no mail sender. The
   * address and the expiry come back so whoever invited can pass them on,
   * and the screen says so rather than letting somebody assume a message
   * went out.
   */
  @Post('account-invitations')
  async inviteToPlatformAccount(
    @Req() req: Request,
    @Body() body: { displayName: string; email: string; expiresInDays?: number },
  ) {
    const ctx = requireActor(req);
    const result = await inviteToPlatform(this.deps.m01, ctx, {
      displayName: body.displayName,
      email: body.email,
      // From the request context, never from the body: an organisation
      // taken as an argument is a way of asking which organisations exist,
      // and of writing an account into one the caller has no standing in.
      ...(ctx.organisationId !== undefined ? { organisationId: ctx.organisationId } : {}),
      ...(body.expiresInDays !== undefined ? { expiresInDays: body.expiresInDays } : {}),
    });
    return {
      data: {
        type: 'AccountInvitation',
        id: result.invitationId,
        attributes: {
          userAccountId: result.userAccountId,
          invitedEmail: result.invitedEmail,
          expiresAt: result.expiresAt.toISOString(),
        },
      },
    };
  }

  /**
   * Inviting the holder of an account that already exists — the ones made
   * before Sign in with Google, or by a seed. Without this they are
   * stranded: on the accounts screen, with roles, and nobody able to sign
   * in as them.
   */
  @Post('user-accounts/:userAccountId/invitations')
  async inviteExistingAccountHolder(
    @Req() req: Request,
    @Param('userAccountId') userAccountId: string,
    @Body() body: { email: string; expiresInDays?: number },
  ) {
    const ctx = requireActor(req);
    const result = await inviteExistingAccount(this.deps.m01, ctx, {
      userAccountId,
      email: body.email,
      ...(body.expiresInDays !== undefined ? { expiresInDays: body.expiresInDays } : {}),
    });
    return {
      data: {
        type: 'AccountInvitation',
        id: result.invitationId,
        attributes: { invitedEmail: result.invitedEmail, expiresAt: result.expiresAt.toISOString() },
      },
    };
  }

  /** What is still outstanding. An invited account holds no role yet, so it
   *  does not appear in the accounts listing — without this, an unclaimed
   *  invitation is invisible until it stops mattering. */
  @Get('account-invitations')
  async accountInvitations(@Req() req: Request) {
    const ctx = requireActor(req);
    const items = await listPendingInvitations(this.deps.m01, ctx);
    return {
      data: items.map((i) => ({ type: 'AccountInvitation', id: i.invitationId, attributes: i })),
    };
  }

  @Post('account-invitations/:invitationId/revoke')
  async revokeAccountInvitation(
    @Req() req: Request,
    @Param('invitationId') invitationId: string,
    @Body() body: { confirmed: boolean },
  ) {
    const ctx = requireActor(req);
    await revokeInvitation(this.deps.m01, ctx, { invitationId, confirmed: body.confirmed === true });
    return { data: { type: 'AccountInvitation', id: invitationId, meta: { state: 'Revoked' } } };
  }

  /**
   * Giving somebody a role.
   *
   * `assignRole` has been in M01 since it was written — permission check,
   * scope, confirmation, audit — with no route and no screen, exactly like
   * `revokeRole` before it. Access could be taken back through the UI and
   * never given, so every new colleague meant another hand-written row.
   */
  @Post('user-accounts/:userAccountId/role-assignments')
  async assignRoleToAccount(
    @Req() req: Request,
    @Param('userAccountId') userAccountId: string,
    @Body() body: { role: string; confirmed: boolean; expiresAt?: string },
  ) {
    const ctx = requireActor(req);
    const result = await assignRole(this.deps.m01, ctx, {
      userAccountId,
      role: body.role as Parameters<typeof assignRole>[2]['role'],
      ...(ctx.organisationId !== undefined ? { organisationId: ctx.organisationId } : {}),
      ...(body.expiresAt !== undefined ? { expiresAt: new Date(body.expiresAt) } : {}),
      confirmed: body.confirmed === true,
    });
    return { data: { type: 'RoleAssignment', id: result.roleAssignmentId } };
  }

  /**
   * Stopping somebody, and letting them back.
   *
   * The only action on this platform that ends a session already in
   * progress. Every other control here decides what somebody may do next.
   */
  @Post('user-accounts/:userAccountId/account-state')
  async changeAccountState(
    @Req() req: Request,
    @Param('userAccountId') userAccountId: string,
    @Body() body: { state: 'Suspended' | 'Active'; confirmed: boolean },
  ) {
    const ctx = requireActor(req);
    await setAccountState(this.deps.m01, ctx, {
      userAccountId,
      state: body.state === 'Suspended' ? 'Suspended' : 'Active',
      confirmed: body.confirmed === true,
    });
    return { data: { type: 'UserAccount', id: userAccountId, meta: { accountState: body.state } } };
  }

  /** Taking a role back. Confirmed, and version-bound so a role that
   *  changed under the administrator is refused rather than merged. */
  @Post('role-assignments/:roleAssignmentId/revoke')
  async revokeRoleAssignment(
    @Req() req: Request,
    @Param('roleAssignmentId') roleAssignmentId: string,
    @Body() body: { expectedVersion: number; confirmed: boolean },
  ) {
    const ctx = requireActor(req);
    await revokeRole(this.deps.m01, ctx, {
      roleAssignmentId,
      expectedVersion: body.expectedVersion,
      confirmed: body.confirmed === true,
    });
    return { data: { type: 'RoleAssignment', id: roleAssignmentId, meta: { state: 'Revoked' } } };
  }

  // --- M06 intervention portfolio ---------------------------------------

  /**
   * The portfolio, which nothing could see. M06 had six commands and no
   * query at all: the approver had decisions to make with no way to learn
   * there was anything to decide, and the researcher who submitted a
   * version could not find out what became of it.
   */
  @Get('interventions')
  async interventions(@Req() req: Request) {
    const ctx = requireActor(req);
    const items = await listInterventions(this.deps.m06, ctx);
    return { data: items.map((i) => ({ type: 'Intervention', id: i.interventionId, attributes: i })) };
  }

  @Post('interventions')
  async createIntervention(@Req() req: Request, @Body() body: { interventionCode: string; name: string }) {
    const ctx = requireActor(req);
    const result = await createIntervention(this.deps.m06, ctx, body);
    return { data: { type: 'Intervention', id: result.interventionId } };
  }

  @Post('interventions/:interventionId/versions')
  async draftInterventionVersion(
    @Req() req: Request,
    @Param('interventionId') interventionId: string,
    @Body() body: { content: object },
  ) {
    const ctx = requireActor(req);
    const result = await createInterventionVersion(this.deps.m06, ctx, { interventionId, content: body.content });
    return {
      data: {
        type: 'InterventionVersion',
        id: result.interventionVersionId,
        meta: { versionNumber: result.versionNumber },
      },
    };
  }

  @Post('intervention-versions/:versionId/submit')
  async submitInterventionVersion(@Req() req: Request, @Param('versionId') versionId: string) {
    const ctx = requireActor(req);
    await submitInterventionVersion(this.deps.m06, ctx, versionId);
    return { data: { type: 'InterventionVersion', id: versionId, meta: { state: 'In Review' } } };
  }

  @Post('intervention-versions/:versionId/approve')
  async approveInterventionVersion(
    @Req() req: Request,
    @Param('versionId') versionId: string,
    @Body() body: { confirmed: boolean },
  ) {
    const ctx = requireActor(req);
    await approveInterventionVersion(this.deps.m06, ctx, versionId, body.confirmed === true);
    return { data: { type: 'InterventionVersion', id: versionId, meta: { state: 'Approved' } } };
  }

  @Post('intervention-versions/:versionId/activate')
  async activateInterventionVersion(
    @Req() req: Request,
    @Param('versionId') versionId: string,
    @Body() body: { confirmed: boolean },
  ) {
    const ctx = requireActor(req);
    await activateInterventionVersion(this.deps.m06, ctx, versionId, body.confirmed === true);
    return { data: { type: 'InterventionVersion', id: versionId, meta: { state: 'Active' } } };
  }

  @Post('intervention-configurations')
  async createInterventionConfiguration(
    @Req() req: Request,
    @Body() body: {
      researchProjectId: string;
      protocolVersionId: string;
      interventionVersionId: string;
      settings?: object;
    },
  ) {
    const ctx = requireActor(req);
    // Lineage binding: the configuration references the EXACT protocol
    // and intervention versions; only Approved/Active intervention
    // versions are a valid basis.
    const input: Parameters<typeof createInterventionConfiguration>[2] = {
      researchProjectId: body.researchProjectId,
      protocolVersionId: body.protocolVersionId,
      interventionVersionId: body.interventionVersionId,
    };
    if (body.settings !== undefined) input.settings = body.settings;
    const result = await createInterventionConfiguration(this.deps.m06, ctx, input);
    return { data: { type: 'InterventionConfiguration', id: result.interventionConfigurationId } };
  }

  // --- M09 safety triage ----------------------------------------------

  @Get('safety-events')
  async safetyEvents(@Req() req: Request) {
    const ctx = requireActor(req);
    const items = await listSafetyEvents(this.deps.m09, ctx);
    return { data: items.map((i) => ({ type: 'SafetyEvent', id: i.safetyEventId, attributes: i })) };
  }

  @Post('safety-events/:safetyEventId/actions')
  async recordSafetyAction(
    @Req() req: Request,
    @Param('safetyEventId') safetyEventId: string,
    @Body() body: {
      label: string;
      actionState: 'Not Started' | 'In Progress' | 'Completed' | 'No Action Taken';
      note: string;
      confirmed: boolean;
    },
  ) {
    const ctx = requireActor(req);
    const result = await recordSafetyAction(this.deps.m09, ctx, {
      safetyEventId,
      label: body.label ?? '',
      actionState: body.actionState,
      note: body.note ?? '',
      confirmed: body.confirmed === true,
    });
    return { data: { type: 'SafetyEventAction', id: result.entryId, meta: { state: body.actionState } } };
  }

  @Post('safety-events/:safetyEventId/state')
  async moveSafetyEvent(
    @Req() req: Request,
    @Param('safetyEventId') safetyEventId: string,
    @Body() body: { toState: string; note: string; confirmed: boolean },
  ) {
    const ctx = requireActor(req);
    await updateSafetyEventState(this.deps.m09, ctx, {
      safetyEventId,
      toState: body.toState,
      note: body.note ?? '',
      confirmed: body.confirmed === true,
    });
    return { data: { type: 'SafetyEvent', id: safetyEventId, meta: { state: body.toState } } };
  }


  @Post('safety-signals/:signalId/triage')
  async triageSafetySignal(
    @Req() req: Request,
    @Param('signalId') safetySignalId: string,
    @Body() body: {
      disposition: 'Closed as Not a Safety Event' | 'Escalated' | 'Converted to Safety Event';
      reason: string;
      confirmed: boolean;
    },
  ) {
    const ctx = requireActor(req);
    // Human authority (ADR-039/ATR-017): triage is confirmed human work;
    // conversion to a SafetyEvent additionally requires MFA. The module
    // refuses non-human actors unconditionally.
    const result = await triageSafetySignal(this.deps.m09, ctx, {
      safetySignalId,
      disposition: body.disposition,
      reason: body.reason,
      confirmed: body.confirmed === true,
    });
    return {
      data: {
        type: 'SafetySignal',
        id: safetySignalId,
        meta: {
          disposition: body.disposition,
          ...(result.safetyEventId === undefined ? {} : { safetyEventId: result.safetyEventId }),
        },
      },
    };
  }

  // --- M12 dataset lineage --------------------------------------------

  @Post('dataset-definitions')
  async createDatasetDefinition(
    @Req() req: Request,
    @Body() body: { researchProjectId: string; name: string; variables: Record<string, unknown> },
  ) {
    const ctx = requireActor(req);
    const result = await createDatasetDefinition(this.deps.m12, ctx, body);
    return { data: { type: 'DatasetDefinition', id: result.datasetDefinitionId } };
  }

  @Post('dataset-definitions/:definitionId/approve')
  async approveDatasetDefinition(
    @Req() req: Request,
    @Param('definitionId') datasetDefinitionId: string,
    @Body() body: { confirmed: boolean },
  ) {
    const ctx = requireActor(req);
    await approveDatasetDefinition(this.deps.m12, ctx, { datasetDefinitionId, confirmed: body.confirmed === true });
    return { data: { type: 'DatasetDefinition', id: datasetDefinitionId, meta: { state: 'Approved' } } };
  }

  @Post('dataset-definitions/:definitionId/versions')
  async generateVersion(
    @Req() req: Request,
    @Param('definitionId') datasetDefinitionId: string,
    @Body() body: { sourceDescription: string; rowCount: number },
  ) {
    const ctx = requireActor(req);
    const result = await generateDatasetVersion(this.deps.m12, ctx, {
      datasetDefinitionId,
      sourceDescription: body.sourceDescription,
      rowCount: body.rowCount,
    });
    return { data: { type: 'DatasetVersion', id: result.datasetVersionId } };
  }

  @Post('dataset-versions/:versionId/complete-quality-review')
  async qualityReview(@Req() req: Request, @Param('versionId') versionId: string) {
    const ctx = requireActor(req);
    await completeQualityReview(this.deps.m12, ctx, versionId);
    return { data: { type: 'DatasetVersion', id: versionId, meta: { state: 'Quality Reviewed' } } };
  }

  @Post('dataset-versions/:versionId/lock')
  async lock(@Req() req: Request, @Param('versionId') datasetVersionId: string, @Body() body: { confirmed: boolean }) {
    const ctx = requireActor(req);
    // Human + MFA authority (ATR-013): auth strength arrives via
    // X-Auth-Strength and is enforced by the policy engine.
    const result = await lockDatasetVersion(this.deps.m12, ctx, { datasetVersionId, confirmed: body.confirmed === true });
    return { data: { type: 'DatasetLock', id: result.datasetLockId, meta: { datasetVersionId } } };
  }

  // --- M14 reporting and export ----------------------------------------

  // 'research-reports' avoids colliding with /v1/reports (M18 user reports).
  @Post('research-reports')
  async createReport(
    @Req() req: Request,
    @Body() body: { researchProjectId: string; title: string; reportType: 'ParticipantSummary' | 'ResearchReport' | 'FindingPackage' },
  ) {
    const ctx = requireActor(req);
    const result = await createReport(this.deps.m14, ctx, body);
    return { data: { type: 'Report', id: result.reportId } };
  }

  @Post('research-reports/:reportId/versions')
  async draftReportVersion(@Req() req: Request, @Param('reportId') reportId: string, @Body() body: { content: object }) {
    const ctx = requireActor(req);
    const result = await draftReportVersion(this.deps.m14, ctx, { reportId, content: body.content });
    return {
      data: { type: 'ReportVersion', id: result.reportVersionId, meta: { versionNumber: result.versionNumber } },
    };
  }

  @Post('report-versions/:versionId/approve')
  async approveReportVersion(@Req() req: Request, @Param('versionId') versionId: string, @Body() body: { confirmed: boolean }) {
    const ctx = requireActor(req);
    // Approver ≠ author (code + DB CHECK); approved content becomes
    // immutable at the database layer.
    await approveReportVersion(this.deps.m14, ctx, { reportVersionId: versionId, confirmed: body.confirmed === true });
    return { data: { type: 'ReportVersion', id: versionId, meta: { state: 'Approved' } } };
  }

  @Post('export-requests')
  async requestResearchExport(
    @Req() req: Request,
    @Body() body: {
      purpose: string;
      recipient: string;
      sources: string[];
      restrictions?: string;
      deIdentification: 'Pseudonymised' | 'Anonymised';
    },
  ) {
    const ctx = requireActor(req);
    // Research exports never leave identifiable (command type + DB CHECK).
    const input: Parameters<typeof requestResearchExport>[2] = {
      purpose: body.purpose,
      recipient: body.recipient,
      sources: body.sources,
      deIdentification: body.deIdentification,
    };
    if (body.restrictions !== undefined) input.restrictions = body.restrictions;
    const result = await requestResearchExport(this.deps.m14, ctx, input);
    return { data: { type: 'ExportRequest', id: result.exportRequestId, meta: { state: 'Requested' } } };
  }

  @Post('export-requests/:exportRequestId/decide')
  async decideExport(
    @Req() req: Request,
    @Param('exportRequestId') exportRequestId: string,
    @Body() body: { decision: 'Approved' | 'Rejected'; confirmed: boolean },
  ) {
    const ctx = requireActor(req);
    await decideExport(this.deps.m14, ctx, {
      exportRequestId,
      decision: body.decision,
      confirmed: body.confirmed === true,
    });
    return { data: { type: 'ExportRequest', id: exportRequestId, meta: { state: body.decision } } };
  }

  @Post('export-requests/:exportRequestId/generate')
  async generateExportPackage(@Req() req: Request, @Param('exportRequestId') exportRequestId: string) {
    const ctx = requireActor(req);
    const result = await generateExportPackage(this.deps.m14, ctx, { exportRequestId });
    return {
      data: {
        type: 'ExportPackage',
        id: result.exportPackageId,
        meta: { manifestHash: result.manifestHash, state: 'Generated' },
      },
    };
  }

  @Post('export-requests/:exportRequestId/delivery')
  async recordExportDelivery(
    @Req() req: Request,
    @Param('exportRequestId') exportRequestId: string,
    @Body() body: { state: 'Delivered' | 'Received' },
  ) {
    const ctx = requireActor(req);
    // Generated ≠ Delivered ≠ Received: forward transitions only.
    await recordExportDelivery(this.deps.m14, ctx, { exportRequestId, state: body.state });
    return { data: { type: 'ExportRequest', id: exportRequestId, meta: { state: body.state } } };
  }

  // --- M15 governance ---------------------------------------------------

  @Post('approvals')
  async requestApproval(
    @Req() req: Request,
    @Body() body: { artefactType: string; artefactId: string; artefactVersion: number },
  ) {
    const ctx = requireActor(req);
    const result = await requestApproval(this.deps.m15, ctx, body);
    return { data: { type: 'ApprovalRecord', id: result.approvalRecordId, meta: { state: 'Requested' } } };
  }

  @Post('approvals/:approvalRecordId/decide')
  async decideApproval(
    @Req() req: Request,
    @Param('approvalRecordId') approvalRecordId: string,
    @Body() body: { decision: 'Approved' | 'Rejected'; reason: string; confirmed: boolean },
  ) {
    const ctx = requireActor(req);
    // Human + confirmed + MFA; the requester can never decide (ADR-051,
    // enforced in code AND by the DB CHECK).
    await decideApproval(this.deps.m15, ctx, {
      approvalRecordId,
      decision: body.decision,
      reason: body.reason,
      confirmed: body.confirmed === true,
    });
    return { data: { type: 'ApprovalRecord', id: approvalRecordId, meta: { state: body.decision } } };
  }

  @Post('governance-holds')
  async placeGovernanceHold(
    @Req() req: Request,
    @Body() body: { artefactType: string; artefactId: string; reason: string; confirmed: boolean },
  ) {
    const ctx = requireActor(req);
    const result = await placeGovernanceHold(this.deps.m15, ctx, {
      artefactType: body.artefactType,
      artefactId: body.artefactId,
      reason: body.reason,
      confirmed: body.confirmed === true,
    });
    return { data: { type: 'GovernanceHold', id: result.governanceHoldId, meta: { state: 'Active' } } };
  }

  @Post('governance-holds/:governanceHoldId/lift')
  async liftGovernanceHold(
    @Req() req: Request,
    @Param('governanceHoldId') governanceHoldId: string,
    @Body() body: { liftReason: string; confirmed: boolean },
  ) {
    const ctx = requireActor(req);
    await liftGovernanceHold(this.deps.m15, ctx, {
      governanceHoldId,
      liftReason: body.liftReason,
      confirmed: body.confirmed === true,
    });
    return { data: { type: 'GovernanceHold', id: governanceHoldId, meta: { state: 'Lifted' } } };
  }

  @Post('break-glass')
  async executeBreakGlass(
    @Req() req: Request,
    @Body() body: { reason: string; scope: string; expiresAt: string; confirmed: boolean },
  ) {
    const ctx = requireActor(req);
    // Emergency access is never silent: MFA + confirmed, explicit
    // reason/scope/expiry, and a mandatory retrospective review by
    // someone else (Doc 16 §38.5).
    const result = await executeBreakGlass(this.deps.m15, ctx, {
      reason: body.reason,
      scope: body.scope,
      expiresAt: new Date(body.expiresAt),
      confirmed: body.confirmed === true,
    });
    return { data: { type: 'BreakGlassRecord', id: result.breakGlassId, meta: { reviewState: 'Pending Review' } } };
  }

  @Post('break-glass/:breakGlassId/review')
  async reviewBreakGlass(
    @Req() req: Request,
    @Param('breakGlassId') breakGlassId: string,
    @Body() body: { outcome: 'Justified' | 'Not Justified' | 'Needs Follow-Up'; confirmed: boolean },
  ) {
    const ctx = requireActor(req);
    await reviewBreakGlass(this.deps.m15, ctx, {
      breakGlassId,
      outcome: body.outcome,
      confirmed: body.confirmed === true,
    });
    return { data: { type: 'BreakGlassRecord', id: breakGlassId, meta: { reviewState: 'Reviewed', outcome: body.outcome } } };
  }

  // --- M13 analysis chain ---------------------------------------------

  @Post('analysis-plans')
  async draftPlan(@Req() req: Request, @Body() body: { researchProjectId: string; title: string }) {
    const ctx = requireActor(req);
    const result = await draftAnalysisPlan(this.deps.m13, ctx, body);
    return { data: { type: 'AnalysisPlan', id: result.analysisPlanId, meta: { state: 'Draft' } } };
  }

  @Post('analysis-plans/:planId/approve')
  async approvePlan(@Req() req: Request, @Param('planId') analysisPlanId: string, @Body() body: { confirmed: boolean }) {
    const ctx = requireActor(req);
    await approveAnalysisPlan(this.deps.m13, ctx, { analysisPlanId, confirmed: body.confirmed === true });
    return { data: { type: 'AnalysisPlan', id: analysisPlanId, meta: { state: 'Approved' } } };
  }

  @Post('analysis-plans/:planId/reject')
  async rejectPlan(
    @Req() req: Request,
    @Param('planId') analysisPlanId: string,
    @Body() body: { reason: string; confirmed: boolean },
  ) {
    const ctx = requireActor(req);
    await rejectAnalysisPlan(this.deps.m13, ctx, {
      analysisPlanId,
      reason: body.reason ?? '',
      confirmed: body.confirmed === true,
    });
    return { data: { type: 'AnalysisPlan', id: analysisPlanId, meta: { state: 'Rejected' } } };
  }

  @Post('analysis-runs')
  async run(
    @Req() req: Request,
    @Body() body: {
      analysisPlanId: string;
      datasetVersionId: string;
      outputs: Record<string, unknown>;
      environment: Record<string, unknown>;
      /** What actually happened. Hardcoded to 'Completed' until now, so
       *  every run on record claimed a clean completion. */
      runState?: 'Completed' | 'Completed with Warnings' | 'Failed';
    },
  ) {
    const ctx = requireActor(req);
    // Runs execute against locked dataset versions only (ATR-013).
    const result = await runAnalysis(this.deps.m13, ctx, body);
    return { data: { type: 'AnalysisRun', id: result.analysisRunId } };
  }

  @Post('analysis-runs/:runId/interpretations')
  async draftInterpretation(
    @Req() req: Request,
    @Param('runId') analysisRunId: string,
    @Body() body: { interpretationText: string },
  ) {
    const ctx = requireActor(req);
    const result = await draftInterpretation(this.deps.m13, ctx, {
      analysisRunId,
      interpretationText: body.interpretationText,
    });
    return { data: { type: 'InterpretationRecord', id: result.interpretationRecordId, meta: { state: 'Draft' } } };
  }

  @Post('interpretations/:interpretationId/approve')
  async approveInterpretation(
    @Req() req: Request,
    @Param('interpretationId') interpretationRecordId: string,
    @Body() body: { confirmed: boolean },
  ) {
    const ctx = requireActor(req);
    await approveInterpretation(this.deps.m13, ctx, { interpretationRecordId, confirmed: body.confirmed === true });
    return { data: { type: 'InterpretationRecord', id: interpretationRecordId, meta: { state: 'Approved' } } };
  }

  @Post('interpretations/:interpretationId/findings')
  async draftFinding(
    @Req() req: Request,
    @Param('interpretationId') interpretationRecordId: string,
    @Body() body: { findingText: string },
  ) {
    const ctx = requireActor(req);
    const result = await draftResearchFinding(this.deps.m13, ctx, {
      interpretationRecordId,
      findingText: body.findingText,
    });
    return { data: { type: 'ResearchFinding', id: result.researchFindingId, meta: { state: 'Draft' } } };
  }

  @Post('findings/:findingId/approve')
  async approveFinding(
    @Req() req: Request,
    @Param('findingId') researchFindingId: string,
    @Body() body: { withLimitations?: boolean; confirmed: boolean },
  ) {
    const ctx = requireActor(req);
    const input: Parameters<typeof approveResearchFinding>[2] = {
      researchFindingId,
      confirmed: body.confirmed === true,
    };
    if (body.withLimitations !== undefined) input.withLimitations = body.withLimitations;
    await approveResearchFinding(this.deps.m13, ctx, input);
    return { data: { type: 'ResearchFinding', id: researchFindingId, meta: { state: 'Approved' } } };
  }

  @Post('findings/:findingId/reject')
  async rejectFinding(
    @Req() req: Request,
    @Param('findingId') researchFindingId: string,
    @Body() body: { reason: string; confirmed: boolean },
  ) {
    const ctx = requireActor(req);
    await rejectResearchFinding(this.deps.m13, ctx, {
      researchFindingId,
      reason: body.reason ?? '',
      confirmed: body.confirmed === true,
    });
    return { data: { type: 'ResearchFinding', id: researchFindingId, meta: { state: 'Rejected' } } };
  }

  // ── M18 community administration ───────────────────────────────────────

  @Post('community-spaces')
  async createCommunitySpace(@Req() req: Request, @Body() body: { name: string; rulesText: string }) {
    const ctx = requireActor(req);
    // community.create (OrganisationAdministrator): the space starts with
    // rule version 1 — members always join against an explicit version.
    const result = await createCommunitySpace(this.deps.m18, ctx, body);
    return {
      data: { type: 'CommunitySpace', id: result.spaceId, meta: { ruleVersionId: result.ruleVersionId } },
    };
  }

  // ── M10 evidence & knowledge integration (ADR-044 / ADR-052) ──────────

  @Get('evidence/search')
  async searchEvidence(@Req() req: Request, @Query('q') q?: string) {
    const ctx = requireActor(req);
    // Live read-through to the Knowledge Platform ACL; upstream failure is
    // a 503 DEPENDENCY_UNAVAILABLE, never an empty "no evidence" answer.
    const items = await searchKnowledgeEvidence(this.deps.m10, ctx, q ?? '');
    return { data: items.map((r) => ({ type: 'KnowledgeResource', id: r.externalIdentifier, attributes: r })) };
  }

  /**
   * Evidence reviews being built, with their references. Nothing listed
   * them, so a review could only be added to by someone tracking
   * identifiers outside the product.
   */
  @Get('evidence-reviews/mine')
  async evidenceWork(@Req() req: Request) {
    const ctx = requireActor(req);
    const items = await listEvidenceWork(this.deps.m10, ctx);
    return { data: items.map((i) => ({ type: 'EvidenceReview', id: i.evidenceReviewId, attributes: i })) };
  }

  /** Evidence reviews submitted and waiting for a reviewer. */
  @Get('evidence-reviews/awaiting-approval')
  async reviewsAwaitingApproval(@Req() req: Request) {
    const ctx = requireActor(req);
    const items = await listReviewsAwaitingApproval(this.deps.m10, ctx);
    return { data: items.map((i) => ({ type: 'EvidenceReview', id: i.evidenceReviewId, attributes: i })) };
  }

  /** Evidence decisions and the reviews they are drawn from. */
  @Get('evidence-decisions/mine')
  async decisionWork(@Req() req: Request) {
    const ctx = requireActor(req);
    const items = await listDecisionWork(this.deps.m10, ctx);
    return { data: items.map((i) => ({ type: 'EvidenceDecision', id: i.evidenceDecisionId, attributes: i })) };
  }

  /** Evidence decisions waiting for a second person. */
  @Get('evidence-decisions/awaiting-approval')
  async decisionsAwaitingApproval(@Req() req: Request) {
    const ctx = requireActor(req);
    const items = await listDecisionsAwaitingApproval(this.deps.m10, ctx);
    return { data: items.map((i) => ({ type: 'EvidenceDecision', id: i.evidenceDecisionId, attributes: i })) };
  }

  @Post('evidence-reviews')
  async createEvidenceReview(
    @Req() req: Request,
    @Body() body: { researchProjectId: string; question: string },
  ) {
    const ctx = requireActor(req);
    const result = await createEvidenceReview(this.deps.m10, ctx, body);
    return { data: { type: 'EvidenceReview', id: result.evidenceReviewId } };
  }

  @Post('evidence-reviews/:reviewId/references')
  async attachReference(
    @Req() req: Request,
    @Param('reviewId') evidenceReviewId: string,
    @Body() body: { externalIdentifier: string },
  ) {
    const ctx = requireActor(req);
    const result = await attachKnowledgeReference(this.deps.m10, ctx, {
      evidenceReviewId,
      externalIdentifier: body.externalIdentifier,
    });
    return { data: { type: 'KnowledgeReference', id: result.knowledgeReferenceId } };
  }

  @Post('evidence-reviews/:reviewId/submit')
  async submitEvidenceReview(@Req() req: Request, @Param('reviewId') reviewId: string) {
    const ctx = requireActor(req);
    await submitEvidenceReview(this.deps.m10, ctx, reviewId);
    return { data: { type: 'EvidenceReview', id: reviewId, meta: { state: 'In Review' } } };
  }

  @Post('evidence-reviews/:reviewId/approve')
  async approveEvidenceReview(
    @Req() req: Request,
    @Param('reviewId') reviewId: string,
    @Body() body: { confirmed: boolean },
  ) {
    const ctx = requireActor(req);
    await approveEvidenceReview(this.deps.m10, ctx, reviewId, body.confirmed === true);
    return { data: { type: 'EvidenceReview', id: reviewId, meta: { state: 'Approved' } } };
  }

  @Post('evidence-reviews/:reviewId/return')
  async returnEvidenceReview(
    @Req() req: Request,
    @Param('reviewId') evidenceReviewId: string,
    @Body() body: { reason: string; confirmed: boolean },
  ) {
    const ctx = requireActor(req);
    await returnEvidenceReviewForRevision(this.deps.m10, ctx, {
      evidenceReviewId,
      reason: body.reason ?? '',
      confirmed: body.confirmed === true,
    });
    return { data: { type: 'EvidenceReview', id: evidenceReviewId, meta: { state: 'Returned for Revision' } } };
  }

  @Post('evidence-decisions')
  async draftEvidenceDecision(
    @Req() req: Request,
    @Body() body: { evidenceReviewId: string; outcome: EvidenceDecisionOutcome; rationale: string },
  ) {
    const ctx = requireActor(req);
    const result = await draftEvidenceDecision(this.deps.m10, ctx, body);
    return { data: { type: 'EvidenceDecision', id: result.evidenceDecisionId, meta: { state: 'Draft' } } };
  }

  @Post('evidence-decisions/:decisionId/reject')
  async rejectEvidenceDecisionRoute(
    @Req() req: Request,
    @Param('decisionId') evidenceDecisionId: string,
    @Body() body: { reason: string; confirmed: boolean },
  ) {
    const ctx = requireActor(req);
    await rejectEvidenceDecision(this.deps.m10, ctx, {
      evidenceDecisionId,
      reason: body.reason ?? '',
      confirmed: body.confirmed === true,
    });
    return { data: { type: 'EvidenceDecision', id: evidenceDecisionId, meta: { state: 'Rejected' } } };
  }

  @Post('evidence-decisions/:decisionId/approve')
  async approveEvidenceDecision(
    @Req() req: Request,
    @Param('decisionId') evidenceDecisionId: string,
    @Body() body: { confirmed: boolean },
  ) {
    const ctx = requireActor(req);
    const result = await approveEvidenceDecision(this.deps.m10, ctx, {
      evidenceDecisionId,
      confirmed: body.confirmed === true,
    });
    return {
      data: {
        type: 'EvidenceDecision',
        id: evidenceDecisionId,
        meta: { state: 'Approved', evidenceSnapshotId: result.evidenceSnapshotId },
      },
    };
  }
}
