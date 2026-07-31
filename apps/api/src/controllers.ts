import { Body, Controller, Get, Inject, Param, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import type { Clock } from '@platform/kernel';
import type { Pool } from '@platform/database';
import {
  approveRelationship,
  proposeRelationship,
  recordConsentDecision,
  revokeRelationship,
  withdrawConsent,
  type M03Deps,
  type PermissionServicePort,
} from '@platform/m03-consent-permission';
import type { M04Deps } from '@platform/m04-research-design';
import type { M05Deps } from '@platform/m05-enrolment';
import type { M06Deps } from '@platform/m06-intervention-portfolio';
import { recordSafetySignal, type M09Deps } from '@platform/m09-safety';
import type { M12Deps } from '@platform/m12-dataset';
import type { M13Deps } from '@platform/m13-analysis';
import { requestParticipantExport, type M14Deps } from '@platform/m14-reporting';
import type { M15Deps } from '@platform/m15-governance';
import {
  changeVisibility,
  confirmTestimony,
  createArchive,
  createItem,
  proposeContribution,
  reviewContribution,
  reviseItem,
  withdrawItem,
  type LifeStorySourceType,
  type LifeStoryVisibility,
  type M17Deps,
} from '@platform/m17-life-story';
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
  m03: M03Deps;
  m04: M04Deps;
  m05: M05Deps;
  m06: M06Deps;
  m09: M09Deps;
  m12: M12Deps;
  m13: M13Deps;
  m14: M14Deps;
  m15: M15Deps;
  m17: M17Deps;
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

  @Post('participants/:participantId/export-requests')
  async requestParticipantExport(
    @Req() req: Request,
    @Param('participantId') participantId: string,
    @Body() body: { purpose: string; confirmed: boolean },
  ) {
    const ctx = requireActor(req);
    // Portability (Doc 16 §37.5): owner-only + confirmed; only permitted
    // records, third-party restrictions preserved.
    const result = await requestParticipantExport(this.deps.m14, ctx, {
      participantId,
      purpose: body.purpose,
      confirmed: body.confirmed === true,
    });
    return { data: { type: 'ExportRequest', id: result.exportRequestId, meta: { state: 'Requested' } } };
  }

  // --- M03 relationships -----------------------------------------------

  @Post('relationships')
  async proposeRelationship(
    @Req() req: Request,
    @Body() body: {
      participantId: string;
      relatedActorId: string;
      relationshipType: string;
      permittedActions: string[];
      expiresAt?: string;
    },
  ) {
    const ctx = requireActor(req);
    // A proposed relationship grants nothing: it becomes effective only
    // when the participant approves it themselves (Doc 4).
    const input: Parameters<typeof proposeRelationship>[2] = {
      participantId: body.participantId,
      relatedActorId: body.relatedActorId,
      relationshipType: body.relationshipType,
      permittedActions: body.permittedActions,
    };
    if (body.expiresAt !== undefined) input.expiresAt = new Date(body.expiresAt);
    const result = await proposeRelationship(this.deps.m03, ctx, input);
    return { data: { type: 'Relationship', id: result.relationshipId, meta: { state: 'Proposed' } } };
  }

  @Post('relationships/:relationshipId/approve')
  async approveRelationship(
    @Req() req: Request,
    @Param('relationshipId') relationshipId: string,
    @Body() body: { expectedVersion: number; confirmed: boolean },
  ) {
    const ctx = requireActor(req);
    // Owner-only: nobody can accept a relationship on the participant's
    // behalf, and approval is version-bound explicit confirmation.
    await approveRelationship(this.deps.m03, ctx, {
      relationshipId,
      expectedVersion: body.expectedVersion,
      confirmed: body.confirmed === true,
    });
    return { data: { type: 'Relationship', id: relationshipId, meta: { state: 'Active' } } };
  }

  @Post('relationships/:relationshipId/revoke')
  async revokeRelationship(
    @Req() req: Request,
    @Param('relationshipId') relationshipId: string,
    @Body() body: { expectedVersion: number },
  ) {
    const ctx = requireActor(req);
    await revokeRelationship(this.deps.m03, ctx, { relationshipId, expectedVersion: body.expectedVersion });
    return { data: { type: 'Relationship', id: relationshipId, meta: { state: 'Revoked' } } };
  }

  // --- M17 life story --------------------------------------------------

  @Post('life-story/archives')
  async createArchive(@Req() req: Request, @Body() body: { participantId: string }) {
    const ctx = requireActor(req);
    const result = await createArchive(this.deps.m17, ctx, { participantId: body.participantId });
    return { data: { type: 'LifeStoryArchive', id: result.archiveId } };
  }

  @Post('life-story/archives/:archiveId/items')
  async createItem(
    @Req() req: Request,
    @Param('archiveId') archiveId: string,
    @Body() body: { title: string; contentText: string; sourceType: LifeStorySourceType },
  ) {
    const ctx = requireActor(req);
    const result = await createItem(this.deps.m17, ctx, {
      archiveId,
      title: body.title,
      contentText: body.contentText,
      sourceType: body.sourceType,
    });
    return { data: { type: 'LifeStoryItem', id: result.itemId, meta: { versionId: result.versionId } } };
  }

  @Post('life-story/items/:itemId/revise')
  async reviseItem(
    @Req() req: Request,
    @Param('itemId') itemId: string,
    @Body() body: { contentText: string; sourceType: LifeStorySourceType },
  ) {
    const ctx = requireActor(req);
    const result = await reviseItem(this.deps.m17, ctx, {
      itemId,
      contentText: body.contentText,
      sourceType: body.sourceType,
    });
    return { data: { type: 'LifeStoryItem', id: itemId, meta: { versionId: result.versionId } } };
  }

  @Post('life-story/items/:itemId/confirm-testimony')
  async confirmTestimony(
    @Req() req: Request,
    @Param('itemId') itemId: string,
    @Body() body: { versionId: string; confirmed: boolean },
  ) {
    const ctx = requireActor(req);
    // Testimony binds to the EXACT version the participant confirmed —
    // AI Draft and Supporter Contribution never become testimony
    // implicitly (ADR-042).
    await confirmTestimony(this.deps.m17, ctx, {
      itemId,
      versionId: body.versionId,
      confirmed: body.confirmed === true,
    });
    return { data: { type: 'LifeStoryItem', id: itemId, meta: { versionId: body.versionId, testimonyState: 'ParticipantTestimony' } } };
  }

  @Post('life-story/items/:itemId/visibility')
  async changeVisibility(
    @Req() req: Request,
    @Param('itemId') itemId: string,
    @Body() body: { visibility: LifeStoryVisibility | 'Internet Public'; confirmed: boolean },
  ) {
    const ctx = requireActor(req);
    // Internet Public is feature-disabled for the first Pilot — refused
    // by the command AND the DB CHECK (defence in depth, ADR-020).
    await changeVisibility(this.deps.m17, ctx, {
      itemId,
      visibility: body.visibility,
      confirmed: body.confirmed === true,
    });
    return { data: { type: 'LifeStoryItem', id: itemId, meta: { visibility: body.visibility } } };
  }

  @Post('life-story/archives/:archiveId/contributions')
  async proposeContribution(
    @Req() req: Request,
    @Param('archiveId') archiveId: string,
    @Body() body: { itemId?: string; contentText: string },
  ) {
    const ctx = requireActor(req);
    const input: Parameters<typeof proposeContribution>[2] = { archiveId, contentText: body.contentText };
    if (body.itemId !== undefined) input.itemId = body.itemId;
    const result = await proposeContribution(this.deps.m17, ctx, input);
    return { data: { type: 'LifeStoryContribution', id: result.contributionId, meta: { state: 'Proposed' } } };
  }

  @Post('life-story/contributions/:contributionId/review')
  async reviewContribution(
    @Req() req: Request,
    @Param('contributionId') contributionId: string,
    @Body() body: { itemId: string; decision: 'Accepted' | 'Rejected' },
  ) {
    const ctx = requireActor(req);
    // Only the archive owner reviews; acceptance creates a version with
    // source SupporterContribution — it does NOT become testimony.
    const result = await reviewContribution(this.deps.m17, ctx, {
      contributionId,
      itemId: body.itemId,
      decision: body.decision,
    });
    return {
      data: {
        type: 'LifeStoryContribution',
        id: contributionId,
        meta: {
          state: body.decision,
          ...(result.versionId === undefined ? {} : { versionId: result.versionId }),
        },
      },
    };
  }

  @Post('life-story/items/:itemId/withdraw')
  async withdrawItem(@Req() req: Request, @Param('itemId') itemId: string, @Body() body: { confirmed: boolean }) {
    const ctx = requireActor(req);
    await withdrawItem(this.deps.m17, ctx, { itemId, confirmed: body.confirmed === true });
    return { data: { type: 'LifeStoryItem', id: itemId, meta: { state: 'Withdrawn' } } };
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
