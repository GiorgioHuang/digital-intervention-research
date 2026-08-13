import { Body, Controller, Get, Inject, Param, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { PlatformError, type Clock } from '@platform/kernel';
import type { Pool } from '@platform/database';
import {
  inviteSupporter,
  listSupporterInvitations,
  withdrawSupporterInvitation,
  type AccountNameQueryPort,
  type M01Deps,
} from '@platform/m01-identity-org';
import type { M02Deps } from '@platform/m02-participant';
import {
  approveRelationship,
  listOwnConsents,
  listOwnRelationships,
  listRelationshipsForActor,
  proposeRelationship,
  recordConsentDecision,
  requireReConsent,
  revokeRelationship,
  pauseRelationship,
  resumeRelationship,
  withdrawConsent,
  type M03Deps,
  type PermissionServicePort,
} from '@platform/m03-consent-permission';
import type { M04Deps } from '@platform/m04-research-design';
import { listOwnEnrolments, type M05Deps } from '@platform/m05-enrolment';
import type { M06Deps } from '@platform/m06-intervention-portfolio';
import type { M07Deps } from '@platform/m07-delivery';
import { recordSafetySignal, type M09Deps } from '@platform/m09-safety';
import type { M10Deps } from '@platform/m10-evidence';
import type { M12Deps } from '@platform/m12-dataset';
import type { M13Deps } from '@platform/m13-analysis';
import { listMyExportRequests, requestParticipantExport, type M14Deps } from '@platform/m14-reporting';
import {
  completeUpload,
  DEFAULT_STORAGE_CONFIG,
  getObjectStatus,
  listObjectsForResource,
  deleteObject as deleteStoredObject,
  initiateUpload,
  releaseObject,
  type StorageDeps,
} from '@platform/m16-integration';
import type { M15Deps } from '@platform/m15-governance';
import {
  changeVisibility,
  confirmTestimony,
  createArchive,
  createItem,
  findArchiveForContribution,
  getMyLifeStory,
  listContributionsAwaitingReview,
  listMyContributions,
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
  endConnection,
  activateMatchPreference,
  deactivateMatchPreference,
  confirmSend,
  createBlock,
  createMessageDraft,
  createThread,
  createRelationshipThread,
  listThreadsForActor,
  draftSocialPost,
  joinCommunity,
  leaveCommunity,
  listCommunityFeed,
  listCommunitySpaces,
  listConnections,
  listMatchCandidates,
  listMyBlocks,
  listMyPosts,
  listThreadMessages,
  listThreads,
  publishSocialPost,
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
  /** Account display names (M01), for screens that would otherwise print an identifier at a person. */
  accountNames: AccountNameQueryPort;
  /** Participant display names (M02), for the same reason on the supporter side. */
  participantNames: { findDisplayNames(participantIds: string[]): Promise<Map<string, string>> };
  m01: M01Deps;
  m02: M02Deps;
  m03: M03Deps;
  m04: M04Deps;
  m05: M05Deps;
  m06: M06Deps;
  m07: M07Deps;
  m09: M09Deps;
  m10: M10Deps;
  m12: M12Deps;
  m13: M13Deps;
  m14: M14Deps;
  m15: M15Deps;
  m16storage: StorageDeps;
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

  /** The participant's own enrolments: where they are, and what to leave. */
  @Get('participants/:participantId/enrolments')
  async myEnrolments(@Req() req: Request, @Param('participantId') participantId: string) {
    const ctx = requireActor(req);
    const items = await listOwnEnrolments(this.deps.m05, ctx, participantId);
    return { data: items.map((i) => ({ type: 'Enrolment', id: i.enrolmentId, attributes: i })) };
  }

  /**
   * The participant's own current consent state, read from the same
   * projection the permission engine consults — so what the screen shows
   * and what the server enforces cannot drift apart.
   */
  @Get('participants/:participantId/consents')
  async myConsents(@Req() req: Request, @Param('participantId') participantId: string) {
    const ctx = requireActor(req);
    const items = await listOwnConsents(
      { pool: this.deps.pool, clock: this.deps.clock, permissions: this.deps.permissions },
      ctx,
      participantId,
    );
    return { data: items.map((i) => ({ type: 'ConsentState', id: i.scope, attributes: i })) };
  }

  @Post('participants/:participantId/consents')
  async recordConsent(
    @Req() req: Request,
    @Param('participantId') participantId: string,
    @Body()
    body: {
      scope: string;
      decision: 'Granted' | 'Declined' | 'Restricted' | 'Deferred';
      templateVersion: string;
      /** Whether somebody was helping. Never who — that name stays on the
       *  participant's device (D-15). */
      assisted?: boolean;
    },
  ) {
    const ctx = requireActor(req);
    const result = await recordConsentDecision(
      { pool: this.deps.pool, clock: this.deps.clock, permissions: this.deps.permissions },
      ctx,
      {
        participantId,
        scope: body.scope,
        decision: body.decision,
        templateVersion: body.templateVersion,
        assistanceRecorded: body.assisted === true,
      },
    );
    return { data: { type: 'ConsentDecision', id: result.consentDecisionId } };
  }

  @Post('participants/:participantId/consents/withdraw')
  async withdraw(
    @Req() req: Request,
    @Param('participantId') participantId: string,
    @Body() body: { scope: string; templateVersion: string; confirmed: boolean; assisted?: boolean },
  ) {
    const ctx = requireActor(req);
    const result = await withdrawConsent(
      { pool: this.deps.pool, clock: this.deps.clock, permissions: this.deps.permissions },
      ctx,
      {
        participantId,
        scope: body.scope,
        templateVersion: body.templateVersion,
        confirmed: body.confirmed === true,
        assistanceRecorded: body.assisted === true,
      },
    );
    return { data: { type: 'ConsentDecision', id: result.consentDecisionId } };
  }

  /**
   * Telling a participant the terms changed. Staff-side and confirmed:
   * this is the one thing about somebody's consent that another person
   * does, and it takes access away until they answer.
   */
  @Post('participants/:participantId/consents/require-reconsent')
  async requireReConsent(
    @Req() req: Request,
    @Param('participantId') participantId: string,
    @Body() body: { scope: string; newTemplateVersion: string; whatChanged: string; confirmed: boolean },
  ) {
    const ctx = requireActor(req);
    const result = await requireReConsent(
      { pool: this.deps.pool, clock: this.deps.clock, permissions: this.deps.permissions },
      ctx,
      {
        participantId,
        scope: body.scope,
        newTemplateVersion: body.newTemplateVersion,
        whatChanged: body.whatChanged,
        confirmed: body.confirmed === true,
      },
    );
    return { data: { type: 'ConsentDecision', id: result.consentDecisionId, meta: { decision: 'ReConsentRequired' } } };
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
    @Body()
    body: {
      senderParticipantId: string;
      expectedMessageVersion: number;
      recipientIds: string[];
      confirmed: boolean;
      assisted?: boolean;
    },
  ) {
    const ctx = requireActor(req);
    const result = await confirmSend(this.deps.m18, ctx, {
      messageId,
      senderParticipantId: body.senderParticipantId,
      ...(body.assisted === undefined ? {} : { assisted: body.assisted }),
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

  /**
   * The blocks this participant placed. The safety screen promises they
   * can be undone at any time; that promise needs something that lists
   * them.
   */
  @Get('participants/:participantId/blocks')
  async myBlocks(@Req() req: Request, @Param('participantId') participantId: string) {
    const ctx = requireActor(req);
    const items = await listMyBlocks(this.deps.m18, ctx, participantId);
    return { data: items.map((b) => ({ type: 'BlockRecord', id: b.blockId, attributes: b })) };
  }

  @Post('blocks/:blockId/revoke')
  async revokeBlock(
    @Req() req: Request,
    @Param('blockId') blockId: string,
    @Body() body: { confirmed: boolean },
  ) {
    const ctx = requireActor(req);
    // The blocker is read from the block, not accepted from the caller:
    // a request that names its own authority is not authority.
    await revokeBlock(this.deps.m18, ctx, { blockId, confirmed: body.confirmed === true });
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
    /*
     * HTTP callers raise human-sourced signals only; AI/Rule/Integration
     * sources originate inside the platform (ADR-039). That was asserted
     * here in a comment and in a TypeScript union, both of which are
     * erased at runtime while nothing validates a request body — so any
     * authenticated caller could plant a signal the reviewer would read
     * as machine-raised. The rule is enforced in the command now, where
     * every caller passes, rather than described at the boundary.
     */
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

  /**
   * Switching Open Matching off. Not gated on the `open-matching`
   * consent — leaving cannot need the consent that let you in, or
   * withdrawing it would lock somebody inside.
   */
  @Post('match-preferences/deactivate')
  async deactivateMatchPreference(
    @Req() req: Request,
    @Body() body: { participantId: string; confirmed: boolean },
  ) {
    const ctx = requireActor(req);
    const result = await deactivateMatchPreference(this.deps.m18, ctx, {
      participantId: body.participantId,
      confirmed: body.confirmed === true,
    });
    return {
      data: {
        type: 'MatchPreference',
        id: result.matchPreferenceId ?? 'none',
        meta: { state: 'Inactive', changed: result.matchPreferenceId !== null },
      },
    };
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

  // --- M16 object storage (quarantine pipeline, Doc 14 §59) ------------

  @Post('objects')
  async initiateUpload(
    @Req() req: Request,
    @Body()
    body: {
      ownerParticipantId: string;
      declaredContentType: string;
      declaredSizeBytes: number;
      attachTo?: { owningResourceType: string; owningResourceId: string };
    },
  ) {
    const ctx = requireActor(req);
    const result = await initiateUpload(this.deps.m16storage, ctx, DEFAULT_STORAGE_CONFIG, body);
    return { data: { type: 'StoredObject', id: result.objectId, meta: { state: 'Pending Upload' } } };
  }

  @Post('objects/:objectId/content')
  async completeUpload(
    @Req() req: Request,
    @Param('objectId') objectId: string,
    @Body() body: { contentBase64: string },
  ) {
    const ctx = requireActor(req);
    // Uploads land in QUARANTINE — never directly available (Doc 14 §59).
    const result = await completeUpload(this.deps.m16storage, ctx, {
      objectId,
      content: Buffer.from(body.contentBase64, 'base64'),
    });
    return { data: { type: 'StoredObject', id: objectId, meta: { state: 'Quarantined', checksum: result.checksum } } };
  }

  @Post('objects/:objectId/release')
  async releaseObject(
    @Req() req: Request,
    @Param('objectId') objectId: string,
    @Body() body: { owningResourceType: string; owningResourceId: string },
  ) {
    const ctx = requireActor(req);
    const result = await releaseObject(this.deps.m16storage, ctx, DEFAULT_STORAGE_CONFIG, {
      objectId,
      owningResourceType: body.owningResourceType,
      owningResourceId: body.owningResourceId,
    });
    return {
      data: {
        type: 'StoredObject',
        id: objectId,
        meta: { state: 'Available', dataClassification: result.dataClassification },
      },
    };
  }

  /**
   * The attachments on one resource. The read path that did not exist:
   * ownership is recorded on the object's side and nothing pointed back,
   * so a file could be attached to a life-story entry that could never
   * show it.
   */
  @Get('participants/:participantId/objects')
  async listObjectsForResource(
    @Req() req: Request,
    @Param('participantId') participantId: string,
    @Query('owningResourceType') owningResourceType: string,
    @Query('owningResourceId') owningResourceId: string,
  ) {
    const ctx = requireActor(req);
    /*
     * Which record is being asked about is required, not guessed at.
     * Without it the query matches nothing and answers with an empty
     * list, which reads as "this record has no files" — an absence
     * presented as a fact about a record nobody named. There is no
     * validation pipe at this boundary, so the check is here.
     */
    if ((owningResourceType ?? '') === '' || (owningResourceId ?? '') === '') {
      throw new PlatformError('VALIDATION_ERROR', 'Say which record you are asking about');
    }
    const items = await listObjectsForResource(this.deps.m16storage, ctx, {
      ownerParticipantId: participantId,
      owningResourceType,
      owningResourceId,
    });
    return { data: items.map((a) => ({ type: 'StoredObject', id: a.objectId, attributes: a })) };
  }

  @Post('objects/:objectId/delete')
  async deleteObject(@Req() req: Request, @Param('objectId') objectId: string, @Body() body: { confirmed: boolean }) {
    const ctx = requireActor(req);
    await deleteStoredObject(this.deps.m16storage, ctx, { objectId, confirmed: body.confirmed === true });
    return { data: { type: 'StoredObject', id: objectId, meta: { state: 'Deleted' } } };
  }

  @Get('objects/:objectId')
  async objectStatus(@Req() req: Request, @Param('objectId') objectId: string) {
    const ctx = requireActor(req);
    const status = await getObjectStatus(this.deps.m16storage, ctx, objectId);
    return { data: { type: 'StoredObject', id: objectId, attributes: status } };
  }

  /**
   * What a participant has attached to one of their own records.
   *
   * Ownership was recorded only on the object's side, so nothing could
   * ask the question the other way round: a file attached to a life
   * story entry could never be found from that entry. The owning
   * resource is named in the query rather than the path because M16
   * knows nothing about life stories, and a route per owning type would
   * put that knowledge in the wrong module.
   */
  @Get('participants/:participantId/objects')
  async myAttachedObjects(
    @Req() req: Request,
    @Param('participantId') participantId: string,
    @Query('owningResourceType') owningResourceType: string,
    @Query('owningResourceId') owningResourceId: string,
  ) {
    const ctx = requireActor(req);
    if (!owningResourceType || !owningResourceId) {
      throw new PlatformError(
        'VALIDATION_ERROR',
        'Say which record the attachments belong to: owningResourceType and owningResourceId are both required',
      );
    }
    const items = await listObjectsForResource(this.deps.m16storage, ctx, {
      ownerParticipantId: participantId,
      owningResourceType,
      owningResourceId,
    });
    return { data: items.map((o) => ({ type: 'StoredObject', id: o.objectId, attributes: o })) };
  }

  /**
   * The state of one's own portability requests. Owner-only: a request
   * whose outcome the requester cannot see is indistinguishable from one
   * that was never made.
   */
  @Get('participants/:participantId/export-requests')
  async myExportRequests(@Req() req: Request, @Param('participantId') participantId: string) {
    const ctx = requireActor(req);
    const items = await listMyExportRequests(this.deps.m14, ctx, participantId);
    return { data: items.map((e) => ({ type: 'ExportRequest', id: e.exportRequestId, attributes: e })) };
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

  /**
   * Who has, or has asked for, access to this participant. Approving and
   * revoking have always been owner-only; nothing listed what there was
   * to approve or revoke, which made both unreachable from the one
   * workspace entitled to reach them.
   *
   * The related person's name is resolved here rather than inside M03:
   * account names belong to M01, and the composition root is where the
   * two are allowed to meet.
   */
  @Get('participants/:participantId/relationships')
  async myRelationships(@Req() req: Request, @Param('participantId') participantId: string) {
    const ctx = requireActor(req);
    const items = await listOwnRelationships(this.deps.m03, ctx, participantId);
    const names = await this.deps.accountNames.findDisplayNames(items.map((r) => r.relatedActorId));
    return {
      data: items.map((r) => ({
        type: 'Relationship',
        id: r.relationshipId,
        attributes: { ...r, relatedDisplayName: names.get(r.relatedActorId) ?? null },
      })),
    };
  }

  /**
   * The relationships the caller is named in as the supporting side. A
   * supporter had no way to learn who they support or on what terms, and
   * the participant's name is resolved here for the same reason as above.
   */
  @Get('relationships/mine')
  async supportedPeople(@Req() req: Request) {
    const ctx = requireActor(req);
    const items = await listRelationshipsForActor(this.deps.m03, ctx);
    const names = await this.deps.participantNames.findDisplayNames(items.map((r) => r.participantId));
    return {
      data: items.map((r) => ({
        type: 'Relationship',
        id: r.relationshipId,
        attributes: { ...r, participantDisplayName: names.get(r.participantId) ?? null },
      })),
    };
  }

  /**
   * Where a contribution for this participant would go. Gated on the very
   * permission that allows contributing — if you may contribute, you may
   * know where to — so it hands out nothing the caller could not already
   * act on.
   */
  @Get('participants/:participantId/life-story/archive-for-contribution')
  async archiveForContribution(@Req() req: Request, @Param('participantId') participantId: string) {
    const ctx = requireActor(req);
    const archiveId = await findArchiveForContribution(this.deps.m17, ctx, participantId);
    return { data: { type: 'LifeStoryArchive', id: archiveId }, meta: { started: archiveId !== null } };
  }

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

  /**
   * Inviting somebody who is not on the platform yet into your circle.
   *
   * `POST /relationships` needs an actor identifier, which a participant
   * has no way of knowing for a daughter who has never signed in — so the
   * only way to bring somebody new in was for an administrator to write a
   * row by hand. This records the relationship on an invitation instead,
   * and it comes into force when they claim it.
   */
  @Post('participants/:participantId/supporter-invitations')
  async inviteSupporterRoute(
    @Req() req: Request,
    @Param('participantId') participantId: string,
    @Body() body: { email: string; relationshipType: string; permittedActions: string[]; expiresInDays?: number },
  ) {
    const ctx = requireActor(req);
    const result = await inviteSupporter(this.deps.m01, ctx, {
      participantId,
      email: body.email,
      relationshipType: body.relationshipType,
      permittedActions: body.permittedActions ?? [],
      ...(body.expiresInDays !== undefined ? { expiresInDays: body.expiresInDays } : {}),
    });
    return {
      data: {
        type: 'SupporterInvitation',
        id: result.invitationId,
        attributes: { invitedEmail: result.invitedEmail, expiresAt: result.expiresAt.toISOString() },
      },
    };
  }

  @Get('participants/:participantId/supporter-invitations')
  async supporterInvitations(@Req() req: Request, @Param('participantId') participantId: string) {
    const ctx = requireActor(req);
    const items = await listSupporterInvitations(this.deps.m01, ctx, { participantId });
    return { data: items.map((i) => ({ type: 'SupporterInvitation', id: i.invitationId, attributes: i })) };
  }

  @Post('participants/:participantId/supporter-invitations/:invitationId/withdraw')
  async withdrawSupporterInvitationRoute(
    @Req() req: Request,
    @Param('participantId') participantId: string,
    @Param('invitationId') invitationId: string,
    @Body() body: { confirmed: boolean },
  ) {
    const ctx = requireActor(req);
    await withdrawSupporterInvitation(this.deps.m01, ctx, {
      participantId,
      invitationId,
      confirmed: body.confirmed === true,
    });
    return { data: { type: 'SupporterInvitation', id: invitationId, meta: { state: 'Revoked' } } };
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

  /**
   * Pausing, and letting it resume. The difference from revoke is the
   * whole point: ending access is permanent and getting it back needs the
   * other person proposed again, which is a negotiation with somebody a
   * participant may have paused precisely to avoid this week.
   */
  @Post('relationships/:relationshipId/pause')
  async pauseRelationshipRoute(
    @Req() req: Request,
    @Param('relationshipId') relationshipId: string,
    @Body() body: { expectedVersion: number },
  ) {
    const ctx = requireActor(req);
    await pauseRelationship(this.deps.m03, ctx, {
      relationshipId,
      expectedVersion: body.expectedVersion,
    });
    return { data: { type: 'Relationship', id: relationshipId, meta: { state: 'Suspended' } } };
  }

  @Post('relationships/:relationshipId/resume')
  async resumeRelationshipRoute(
    @Req() req: Request,
    @Param('relationshipId') relationshipId: string,
    @Body() body: { expectedVersion: number; confirmed: boolean },
  ) {
    const ctx = requireActor(req);
    await resumeRelationship(this.deps.m03, ctx, {
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

  /**
   * A participant reading their own life story. Owner-only: this is not a
   * staff-readable resource, and sharing it with anyone else runs through
   * visibility and access grants rather than through this route.
   */
  @Get('participants/:participantId/life-story')
  async myLifeStory(@Req() req: Request, @Param('participantId') participantId: string) {
    const ctx = requireActor(req);
    const story = await getMyLifeStory(this.deps.m17, ctx, participantId);
    return {
      data: story.items.map((i) => ({ type: 'LifeStoryItem', id: i.itemId, attributes: i })),
      meta: { archiveId: story.archiveId },
    };
  }

  /**
   * The conversations a supporter is a party to. Keyed by the requesting
   * actor, because a supporter has no participant record — which is why
   * relationship messaging could not exist until this did: a channel
   * somebody can only be written into is worse than no channel.
   */
  @Get('conversation-threads/mine')
  async myThreadsAsSupporter(@Req() req: Request) {
    const ctx = requireActor(req);
    const items = await listThreadsForActor(this.deps.m18, ctx);
    return { data: items.map((t) => ({ type: 'ConversationThread', id: t.threadId, attributes: t })) };
  }

  @Post('relationships/:relationshipId/conversation-thread')
  async startRelationshipThread(
    @Req() req: Request,
    @Param('relationshipId') relationshipId: string,
    @Body() body: { creatorId: string },
  ) {
    const ctx = requireActor(req);
    // Refused unless the relationship itself names relationship.message:
    // being trusted to see what someone shares is not being allowed to
    // write to them (D-29).
    const result = await createRelationshipThread(this.deps.m18, ctx, {
      relationshipId,
      creatorId: body.creatorId,
    });
    return { data: { type: 'ConversationThread', id: result.threadId, meta: { basis: 'AuthorisedRelationship' } } };
  }

  @Get('life-story/contributions/mine')
  async listMyContributions(@Req() req: Request) {
    const ctx = requireActor(req);
    // Strictly the requesting actor's own proposals with honest states.
    const items = await listMyContributions(this.deps.m17, ctx);
    return { data: items.map((c) => ({ type: 'LifeStoryContribution', id: c.contributionId, attributes: c })) };
  }

  /**
   * What a supporter has proposed into this participant's life story and
   * is waiting on them to decide. Reviewing has always been owner-only;
   * until now nothing let the owner find what was waiting.
   */
  @Get('participants/:participantId/life-story/contributions/awaiting-review')
  async contributionsAwaitingReview(@Req() req: Request, @Param('participantId') participantId: string) {
    const ctx = requireActor(req);
    const items = await listContributionsAwaitingReview(this.deps.m17, ctx, participantId);
    return { data: items.map((c) => ({ type: 'LifeStoryContribution', id: c.contributionId, attributes: c })) };
  }

  @Post('life-story/contributions/:contributionId/review')
  async reviewContribution(
    @Req() req: Request,
    @Param('contributionId') contributionId: string,
    @Body() body: { itemId?: string; decision: 'Accepted' | 'Rejected' },
  ) {
    const ctx = requireActor(req);
    // Only the archive owner reviews; acceptance creates a version with
    // source SupporterContribution — it does NOT become testimony.
    // Saying no needs nowhere to put anything, so itemId is optional.
    const result = await reviewContribution(this.deps.m17, ctx, {
      contributionId,
      ...(body.itemId === undefined || body.itemId === '' ? {} : { itemId: body.itemId }),
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

  /**
   * The supporter's name is resolved here, for the same reason the
   * relationship list resolves it here: the other side of a relationship
   * thread has a user account and no participant record, so M18 leaves it
   * unnamed rather than looking a supporter up in the participant
   * directory and printing the miss as "A community member". A participant
   * who approved somebody by name is entitled to see that name on the
   * conversation it produced.
   */
  @Get('participants/:participantId/conversation-threads')
  async listThreads(@Req() req: Request, @Param('participantId') participantId: string) {
    const ctx = requireActor(req);
    const items = await listThreads(this.deps.m18, ctx, participantId);
    const unnamed = items.filter((t) => t.otherDisplayName === null);
    const names = await this.deps.accountNames.findDisplayNames(unnamed.map((t) => t.otherParticipantId));
    return {
      data: items.map((t) => ({
        type: 'ConversationThread',
        id: t.threadId,
        attributes: {
          ...t,
          otherDisplayName: t.otherDisplayName ?? names.get(t.otherParticipantId) ?? null,
        },
      })),
    };
  }

  @Get('conversation-threads/:threadId/messages')
  async listThreadMessages(
    @Req() req: Request,
    @Param('threadId') threadId: string,
    @Query('participantId') participantId: string,
  ) {
    const ctx = requireActor(req);
    // Thread parties only; drafts stay private to their author.
    const items = await listThreadMessages(this.deps.m18, ctx, { threadId, participantId: participantId ?? '' });
    return { data: items.map((m) => ({ type: 'Message', id: m.messageId, attributes: m })) };
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

  // ── M18 community spaces & posts (Doc 20 community; ADR-113) ──────────

  @Get('participants/:participantId/community-spaces')
  async listCommunitySpaces(@Req() req: Request, @Param('participantId') participantId: string) {
    const ctx = requireActor(req);
    // Each space carries the exact rule version a join would agree to.
    const items = await listCommunitySpaces(this.deps.m18, ctx, participantId);
    return { data: items.map((s) => ({ type: 'CommunitySpace', id: s.spaceId, attributes: s })) };
  }

  @Get('participants/:participantId/community-spaces/:spaceId/feed')
  async listCommunityFeed(
    @Req() req: Request,
    @Param('participantId') participantId: string,
    @Param('spaceId') spaceId: string,
  ) {
    const ctx = requireActor(req);
    // Member-only, strictly chronological, blocks fail-closed (ADR-113).
    const items = await listCommunityFeed(this.deps.m18, ctx, { spaceId, participantId });
    return { data: items.map((p) => ({ type: 'SocialPost', id: p.postId, attributes: p })) };
  }

  @Get('participants/:participantId/social-posts')
  async listMyPosts(@Req() req: Request, @Param('participantId') participantId: string) {
    const ctx = requireActor(req);
    const items = await listMyPosts(this.deps.m18, ctx, participantId);
    return { data: items.map((p) => ({ type: 'SocialPost', id: p.postId, attributes: p })) };
  }

  @Post('connections/:connectionId/end')
  async endConnection(
    @Req() req: Request,
    @Param('connectionId') connectionId: string,
    @Body() body: { participantId: string; confirmed: boolean },
  ) {
    const ctx = requireActor(req);
    // Either party alone. Requiring both to agree would leave the person
    // who wants out in until the other consents.
    await endConnection(this.deps.m18, ctx, {
      connectionId,
      participantId: body.participantId,
      confirmed: body.confirmed === true,
    });
    return { data: { type: 'Connection', id: connectionId, meta: { state: 'Disconnected' } } };
  }

  @Post('community-spaces/:spaceId/join')
  async joinCommunity(
    @Req() req: Request,
    @Param('spaceId') spaceId: string,
    @Body() body: { participantId: string; ruleVersionId: string },
  ) {
    const ctx = requireActor(req);
    // Requires the community-participation consent scope; the exact rule
    // version being agreed to is recorded on the membership.
    const result = await joinCommunity(this.deps.m18, ctx, {
      spaceId,
      participantId: body.participantId,
      ruleVersionId: body.ruleVersionId,
    });
    return { data: { type: 'CommunityMembership', id: result.membershipId, meta: { state: 'Active' } } };
  }

  @Post('community-spaces/:spaceId/leave')
  async leaveCommunity(
    @Req() req: Request,
    @Param('spaceId') spaceId: string,
    @Body() body: { participantId: string; confirmed: boolean },
  ) {
    const ctx = requireActor(req);
    // Deliberately NOT gated on the community-participation consent that
    // joining requires: withdrawing that consent must not trap someone
    // inside the community it was the consent for.
    await leaveCommunity(this.deps.m18, ctx, {
      spaceId,
      participantId: body.participantId,
      confirmed: body.confirmed === true,
    });
    return { data: { type: 'CommunityMembership', id: spaceId, meta: { state: 'Ended' } } };
  }

  @Post('social-posts')
  async draftSocialPost(
    @Req() req: Request,
    @Body() body: { spaceId: string; participantId: string; contentText: string },
  ) {
    const ctx = requireActor(req);
    const result = await draftSocialPost(this.deps.m18, ctx, body);
    return { data: { type: 'SocialPost', id: result.postId, meta: { state: 'Draft' } } };
  }

  @Post('social-posts/:postId/publish')
  async publishSocialPost(
    @Req() req: Request,
    @Param('postId') postId: string,
    @Body() body: { participantId: string; confirmed: boolean },
  ) {
    const ctx = requireActor(req);
    // Explicit confirmed "Publish to [Community]" — a draft never leaves
    // the author without this step.
    await publishSocialPost(this.deps.m18, ctx, {
      postId,
      participantId: body.participantId,
      confirmed: body.confirmed === true,
    });
    return { data: { type: 'SocialPost', id: postId, meta: { state: 'Published' } } };
  }
}
