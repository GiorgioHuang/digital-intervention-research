import { Body, Controller, Get, Inject, Param, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import type { Clock } from '@platform/kernel';
import type { Pool } from '@platform/database';
import { recordConsentDecision, withdrawConsent, type PermissionServicePort } from '@platform/m03-consent-permission';
import type { M04Deps } from '@platform/m04-research-design';
import type { M05Deps } from '@platform/m05-enrolment';
import { recordSafetySignal, type M09Deps } from '@platform/m09-safety';
import type { M12Deps } from '@platform/m12-dataset';
import type { M13Deps } from '@platform/m13-analysis';
import {
  activateConnection,
  activateMatchPreference,
  confirmSend,
  createBlock,
  createMessageDraft,
  createThread,
  listConnections,
  listMatchCandidates,
  listThreads,
  recordMatchDecision,
  revokeBlock,
  submitUserReport,
  type M18Deps,
} from '@platform/m18-community-social';
import { requireActor } from './http-context.js';

export const API_DEPS = 'API_DEPS';

export interface ApiDeps {
  pool: Pool;
  clock: Clock;
  permissions: PermissionServicePort;
  m04: M04Deps;
  m05: M05Deps;
  m09: M09Deps;
  m12: M12Deps;
  m13: M13Deps;
  m18: M18Deps;
}

/**
 * Representative Doc 15 command endpoints (explicit transitions, no generic
 * CRUD): consent record/withdraw and the messaging slice. Remaining module
 * commands are exposed incrementally with the same pattern.
 */
@Controller('v1')
export class CommandController {
  constructor(@Inject(API_DEPS) private readonly deps: ApiDeps) {}

  @Post('participants/:participantId/consents')
  async recordConsent(
    @Req() req: Request,
    @Param('participantId') participantId: string,
    @Body() body: { scope: string; decision: 'Granted' | 'Declined' | 'Restricted' | 'Deferred'; templateVersion: string },
  ) {
    const ctx = requireActor(req);
    const result = await recordConsentDecision(
      { pool: this.deps.pool, clock: this.deps.clock, permissions: this.deps.permissions },
      ctx,
      { participantId, scope: body.scope, decision: body.decision, templateVersion: body.templateVersion },
    );
    return { data: { type: 'ConsentDecision', id: result.consentDecisionId } };
  }

  @Post('participants/:participantId/consents/withdraw')
  async withdraw(
    @Req() req: Request,
    @Param('participantId') participantId: string,
    @Body() body: { scope: string; templateVersion: string; confirmed: boolean },
  ) {
    const ctx = requireActor(req);
    const result = await withdrawConsent(
      { pool: this.deps.pool, clock: this.deps.clock, permissions: this.deps.permissions },
      ctx,
      { participantId, scope: body.scope, templateVersion: body.templateVersion, confirmed: body.confirmed === true },
    );
    return { data: { type: 'ConsentDecision', id: result.consentDecisionId } };
  }

  @Post('conversation-threads')
  async createThread(
    @Req() req: Request,
    @Body() body: { connectionId: string; creatorParticipantId: string },
  ) {
    const ctx = requireActor(req);
    const result = await createThread(this.deps.m18, ctx, body);
    return { data: { type: 'ConversationThread', id: result.threadId } };
  }

  @Post('conversation-threads/:threadId/messages')
  async draftMessage(
    @Req() req: Request,
    @Param('threadId') threadId: string,
    @Body() body: { senderParticipantId: string; contentText: string },
  ) {
    const ctx = requireActor(req);
    const result = await createMessageDraft(this.deps.m18, ctx, { threadId, ...body });
    return { data: { type: 'Message', id: result.messageId, meta: { lifecycleState: 'Draft' } } };
  }

  @Post('messages/:messageId/confirm-send')
  async confirmSend(
    @Req() req: Request,
    @Param('messageId') messageId: string,
    @Body() body: { senderParticipantId: string; expectedMessageVersion: number; recipientIds: string[]; confirmed: boolean },
  ) {
    const ctx = requireActor(req);
    const result = await confirmSend(this.deps.m18, ctx, {
      messageId,
      senderParticipantId: body.senderParticipantId,
      expectedMessageVersion: body.expectedMessageVersion,
      recipientIds: body.recipientIds,
      confirmed: body.confirmed === true,
    });
    // Truthful state (ADR-055/Doc 20 §160): confirmation produces Queued.
    return { data: { type: 'Message', id: messageId, meta: { sendConfirmationId: result.sendConfirmationId, lifecycleState: 'Queued', deliveryState: 'Queued' } } };
  }

  @Post('blocks')
  async createBlock(
    @Req() req: Request,
    @Body() body: { blockerId: string; blockedActorId: string; confirmed: boolean },
  ) {
    const ctx = requireActor(req);
    const result = await createBlock(this.deps.m18, ctx, {
      blockerId: body.blockerId,
      blockedActorId: body.blockedActorId,
      confirmed: body.confirmed === true,
    });
    return { data: { type: 'BlockRecord', id: result.blockId } };
  }

  @Post('blocks/:blockId/revoke')
  async revokeBlock(
    @Req() req: Request,
    @Param('blockId') blockId: string,
    @Body() body: { blockerId: string; confirmed: boolean },
  ) {
    const ctx = requireActor(req);
    await revokeBlock(this.deps.m18, ctx, {
      blockId,
      blockerId: body.blockerId,
      confirmed: body.confirmed === true,
    });
    return { data: { type: 'BlockRecord', id: blockId, meta: { state: 'Revoked' } } };
  }

  @Post('reports')
  async submitReport(
    @Req() req: Request,
    @Body() body: {
      reporterId: string;
      reportedActorId: string;
      reportedContentId?: string;
      category: string;
      description: string;
    },
  ) {
    const ctx = requireActor(req);
    const input: Parameters<typeof submitUserReport>[2] = {
      reporterId: body.reporterId,
      reportedActorId: body.reportedActorId,
      category: body.category,
      description: body.description,
    };
    if (body.reportedContentId !== undefined) input.reportedContentId = body.reportedContentId;
    const result = await submitUserReport(this.deps.m18, ctx, input);
    // A ModerationCase is opened in the same transaction: reports are
    // reviewed by staff, never adjudicated by automation alone.
    return { data: { type: 'UserReport', id: result.reportId, meta: { moderationCaseId: result.moderationCaseId } } };
  }

  @Post('safety-signals')
  async recordSafetySignal(
    @Req() req: Request,
    @Body() body: {
      sourceType: 'Participant' | 'Supporter' | 'Staff';
      category: string;
      severity: 'Low' | 'Moderate' | 'High' | 'Critical';
      description: string;
    },
  ) {
    const ctx = requireActor(req);
    // HTTP callers raise human-sourced signals only; AI/Rule/Integration
    // sources originate inside the platform (ADR-039).
    const result = await recordSafetySignal(this.deps.m09, ctx, {
      sourceType: body.sourceType,
      category: body.category,
      severity: body.severity,
      description: body.description,
    });
    return { data: { type: 'SafetySignal', id: result.safetySignalId } };
  }

  @Post('match-preferences')
  async activateMatchPreference(
    @Req() req: Request,
    @Body() body: { participantId: string; declaredAttributes: Record<string, unknown>; confirmed: boolean },
  ) {
    const ctx = requireActor(req);
    const result = await activateMatchPreference(this.deps.m18, ctx, {
      participantId: body.participantId,
      declaredAttributes: body.declaredAttributes ?? {},
      confirmed: body.confirmed === true,
    });
    return { data: { type: 'MatchPreference', id: result.matchPreferenceId, meta: { state: 'Active' } } };
  }

  @Post('match-candidates/:candidateId/decision')
  async recordMatchDecision(
    @Req() req: Request,
    @Param('candidateId') candidateId: string,
    @Body() body: {
      participantId: string;
      expectedCandidateVersion: number;
      decision: 'Interested' | 'Not Now' | 'Dismissed' | 'Blocked' | 'Reported';
      confirmed: boolean;
    },
  ) {
    const ctx = requireActor(req);
    const result = await recordMatchDecision(this.deps.m18, ctx, {
      matchCandidateId: candidateId,
      participantId: body.participantId,
      expectedCandidateVersion: body.expectedCandidateVersion,
      decision: body.decision,
      confirmed: body.confirmed === true,
    });
    // mutualAcceptanceId appears only when BOTH parties independently
    // chose Interested (ADR-036); one decision alone never connects.
    return {
      data: {
        type: 'MatchDecision',
        id: result.matchDecisionId,
        meta: result.mutualAcceptanceId === undefined ? {} : { mutualAcceptanceId: result.mutualAcceptanceId },
      },
    };
  }

  @Get('participants/:participantId/connections')
  async listConnections(@Req() req: Request, @Param('participantId') participantId: string) {
    const ctx = requireActor(req);
    const items = await listConnections(this.deps.m18, ctx, participantId);
    return { data: items.map((c) => ({ type: 'Connection', id: c.connectionId, attributes: c })) };
  }

  @Get('participants/:participantId/conversation-threads')
  async listThreads(@Req() req: Request, @Param('participantId') participantId: string) {
    const ctx = requireActor(req);
    const items = await listThreads(this.deps.m18, ctx, participantId);
    return { data: items.map((t) => ({ type: 'ConversationThread', id: t.threadId, attributes: t })) };
  }

  @Get('participants/:participantId/match-candidates')
  async listMatchCandidates(@Req() req: Request, @Param('participantId') participantId: string) {
    const ctx = requireActor(req);
    const items = await listMatchCandidates(this.deps.m18, ctx, participantId);
    return { data: items.map((c) => ({ type: 'MatchCandidate', id: c.candidateId, attributes: c })) };
  }

  @Post('mutual-acceptances/:mutualAcceptanceId/activate-connection')
  async activateConnection(
    @Req() req: Request,
    @Param('mutualAcceptanceId') mutualAcceptanceId: string,
    @Body() body: { participantId: string; confirmed: boolean },
  ) {
    const ctx = requireActor(req);
    const result = await activateConnection(this.deps.m18, ctx, {
      mutualAcceptanceId,
      participantId: body.participantId,
      confirmed: body.confirmed === true,
    });
    return { data: { type: 'Connection', id: result.connectionId, meta: { state: 'Active' } } };
  }
}
