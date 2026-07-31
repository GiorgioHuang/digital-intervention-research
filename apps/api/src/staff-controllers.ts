import { Body, Controller, Inject, Param, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import {
  activateProtocolVersion,
  approveProtocolVersion,
  createProtocolVersion,
  createResearchProject,
  submitProtocolVersion,
} from '@platform/m04-research-design';
import {
  activateEnrolment,
  enrolParticipant,
  inviteParticipant,
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
import {
  approveDatasetDefinition,
  completeQualityReview,
  createDatasetDefinition,
  generateDatasetVersion,
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
