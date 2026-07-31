import { Body, Controller, Get, Inject, Param, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import {
  activateProtocolVersion,
  approveProtocolVersion,
  createProtocolVersion,
  createResearchProject,
  listProtocolVersionsInReview,
  submitProtocolVersion,
} from '@platform/m04-research-design';
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
  activateInterventionVersion,
  approveInterventionVersion,
  createIntervention,
  createInterventionConfiguration,
  createInterventionVersion,
  submitInterventionVersion,
} from '@platform/m06-intervention-portfolio';
import { listSignalsAwaitingTriage, triageSafetySignal } from '@platform/m09-safety';
import { listOpenModerationCases, recordModerationDecision } from '@platform/m18-community-social';
import {
  approveReportVersion,
  createReport,
  decideExport,
  draftReportVersion,
  generateExportPackage,
  listPendingExportRequests,
  recordExportDelivery,
  requestResearchExport,
} from '@platform/m14-reporting';
import {
  decideApproval,
  executeBreakGlass,
  liftGovernanceHold,
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
  listLockableDatasetVersions,
  lockDatasetVersion,
} from '@platform/m12-dataset';
import {
  approveAnalysisPlan,
  approveInterpretation,
  approveResearchFinding,
  draftAnalysisPlan,
  draftInterpretation,
  draftResearchFinding,
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

  // --- M06 intervention portfolio -------------------------------------

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

  @Post('analysis-runs')
  async run(
    @Req() req: Request,
    @Body() body: {
      analysisPlanId: string;
      datasetVersionId: string;
      outputs: Record<string, unknown>;
      environment: Record<string, unknown>;
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
}
