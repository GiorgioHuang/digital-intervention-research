import { createHash } from 'node:crypto';
import { newId, PlatformError, type RequestContext } from '@platform/kernel';
import { appendToOutbox, recordAuditEvent, withTransaction } from '@platform/database';
import { assertAllowed } from '@platform/policy';
import type { M18Deps } from './commands.js';

const MSG_EVENTS = {
  ConversationThreadCreated: 'ConversationThreadCreated',
  MessageDraftCreated: 'MessageDraftCreated',
  MessageDraftRevised: 'MessageDraftRevised',
  MessageSendConfirmed: 'MessageSendConfirmed',
  MessageQueued: 'MessageQueued',
  MessageSent: 'MessageSent',
  MessageProviderAccepted: 'MessageProviderAccepted',
  MessageDelivered: 'MessageDelivered',
  MessageDeliveryFailed: 'MessageDeliveryFailed',
} as const;

const recipientHash = (ids: readonly string[]) =>
  createHash('sha256').update([...ids].sort().join(',')).digest('hex');

async function assertNoBlock(deps: M18Deps, a: string, b: string): Promise<void> {
  const res = await deps.pool.query(
    `SELECT 1 FROM community_social.block_records
      WHERE block_state = 'Active'
        AND ((blocker_actor_id = $1 AND blocked_actor_id = $2) OR (blocker_actor_id = $2 AND blocked_actor_id = $1))`,
    [a, b],
  );
  if (res.rowCount !== 0) throw new PlatformError('BLOCKED_INTERACTION', 'A block prevents this interaction');
}

/**
 * Create a ConversationThread. A current approved CommunicationBasis is
 * required (ADR-031); for the first Pilot the basis here is an ACTIVE
 * Connection whose two parties are exactly the thread participants.
 * The basis is re-evaluated at creation AND at every effectful action.
 */
export async function createThread(
  deps: M18Deps,
  ctx: RequestContext,
  input: { connectionId: string; creatorParticipantId: string },
): Promise<{ threadId: string }> {
  const conn = await deps.pool.query(
    `SELECT participant_a_id, participant_b_id, connection_state FROM community_social.connections WHERE id = $1`,
    [input.connectionId],
  );
  const c = conn.rows[0];
  if (c === undefined || c.connection_state !== 'Active') {
    throw new PlatformError('COMMUNICATION_BASIS_REQUIRED', 'No current approved communication basis');
  }
  if (input.creatorParticipantId !== c.participant_a_id && input.creatorParticipantId !== c.participant_b_id) {
    throw new PlatformError('AUTHORISATION_DENIED', 'Not a party to this connection');
  }
  const decision = await deps.checkPermission(ctx, {
    action: 'thread.create',
    resource: {
      type: 'ConversationThread',
      id: 'new',
      state: 'Draft',
      protectedExistence: true,
      ownerParticipantId: input.creatorParticipantId,
    },
  });
  assertAllowed(decision, false);
  await assertNoBlock(deps, c.participant_a_id, c.participant_b_id);

  const threadId = newId('ct');
  const now = deps.clock.now();
  await withTransaction(deps.pool, async (client) => {
    await client.query(
      `INSERT INTO community_social.conversation_threads
         (id, basis_type, basis_reference, participant_a_id, participant_b_id)
       VALUES ($1, 'ActiveConnection', $2, $3, $4)`,
      [threadId, input.connectionId, c.participant_a_id, c.participant_b_id],
    );
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: MSG_EVENTS.ConversationThreadCreated,
      sourceModule: 'M18',
      aggregateType: 'ConversationThread',
      aggregateId: threadId,
      occurredAt: now,
    });
  });
  return { threadId };
}

interface ThreadRow {
  id: string;
  basisType: string;
  basisReference: string;
  participantA: string;
  participantB: string;
  state: string;
}

async function loadThread(deps: M18Deps, threadId: string): Promise<ThreadRow> {
  const res = await deps.pool.query(
    `SELECT id, basis_type, basis_reference, participant_a_id, participant_b_id, thread_state
       FROM community_social.conversation_threads WHERE id = $1`,
    [threadId],
  );
  const r = res.rows[0];
  if (r === undefined) throw new PlatformError('RESOURCE_NOT_FOUND', 'Thread not found');
  return {
    id: r.id,
    basisType: r.basis_type,
    basisReference: r.basis_reference,
    participantA: r.participant_a_id,
    participantB: r.participant_b_id,
    state: r.thread_state,
  };
}

/**
 * Basis re-evaluation for effectful message actions (ADR-031).
 *
 * Branching on the basis is the point of the ADR: a thread is only usable
 * while the thing that made it possible is still in force. For a matched
 * connection that is the connection still being Active; for an authorised
 * relationship it is the relationship still being Active AND still
 * carrying `relationship.message` — a participant who revokes the
 * relationship, or has it narrowed, stops the conversation at that moment
 * rather than at the next time somebody thinks to check.
 */
async function assertBasisEffective(deps: M18Deps, thread: ThreadRow): Promise<void> {
  if (thread.state !== 'Active') {
    throw new PlatformError('CONVERSATION_THREAD_NOT_USABLE', 'Thread is not usable');
  }
  if (thread.basisType === 'AuthorisedRelationship') {
    const rel = await deps.pool.query(
      `SELECT relationship_state, permitted_actions, expires_at
         FROM consent_permission.relationships WHERE id = $1`,
      [thread.basisReference],
    );
    const r = rel.rows[0];
    const stillPermits =
      r !== undefined &&
      r.relationship_state === 'Active' &&
      (r.permitted_actions as string[]).includes('relationship.message') &&
      (r.expires_at === null || (r.expires_at as Date) > deps.clock.now());
    if (!stillPermits) {
      throw new PlatformError('COMMUNICATION_BASIS_EXPIRED', 'The communication basis is no longer effective');
    }
    return;
  }
  const conn = await deps.pool.query(
    `SELECT connection_state FROM community_social.connections WHERE id = $1`,
    [thread.basisReference],
  );
  if (conn.rows[0]?.connection_state !== 'Active') {
    throw new PlatformError('COMMUNICATION_BASIS_EXPIRED', 'The communication basis is no longer effective');
  }
}

/**
 * Which permission a message action needs, and whose resource it is.
 *
 * On a relationship thread the two parties are not alike: participantA is
 * the participant and participantB is the supporter. The participant is
 * writing their own message and owns it. The supporter is writing into
 * somebody else's conversation, so the resource is the PARTICIPANT'S and
 * the action is the relationship-gated one — which is what makes the
 * participant's approval of that relationship the thing that permits it.
 */
function messagingAuthority(
  thread: ThreadRow,
  senderId: string,
  ownAction: 'message.draft' | 'message.confirm-send',
): { action: string; ownerParticipantId: string } {
  if (thread.basisType === 'AuthorisedRelationship' && senderId !== thread.participantA) {
    return { action: 'relationship.message', ownerParticipantId: thread.participantA };
  }
  return { action: ownAction, ownerParticipantId: senderId };
}

/**
 * A conversation resting on an authorised relationship.
 *
 * `basis_type` has carried 'AuthorisedRelationship' from the start and
 * nothing could write it: threads could only rest on a matched connection,
 * so a participant could message a stranger the platform suggested and not
 * the family member they themselves approved. For a study about older
 * people and connection that was the wrong way round, and the wording for
 * this basis — "you approved this person as a supporter" — sat unreachable
 * in the messages screen.
 *
 * The relationship must name `relationship.message` among its permitted
 * actions. Being trusted to see what someone shares is not the same as
 * being allowed to write to them, so the participant grants this
 * separately (D-29); a relationship that does not name it is not a basis
 * for a conversation and the thread is refused rather than created and
 * then found unusable.
 *
 * participantA is the participant and participantB is the supporter. They
 * are not alike here — one owns the conversation and the other is in it by
 * permission — and every later check depends on the order.
 */
export async function createRelationshipThread(
  deps: M18Deps,
  ctx: RequestContext,
  input: { relationshipId: string; creatorId: string },
): Promise<{ threadId: string }> {
  const rel = await deps.pool.query(
    `SELECT participant_id, related_actor_id, relationship_state, permitted_actions, expires_at
       FROM consent_permission.relationships WHERE id = $1`,
    [input.relationshipId],
  );
  const r = rel.rows[0];
  if (r === undefined) throw new PlatformError('RESOURCE_NOT_FOUND', 'Relationship not found');
  const participantId = r.participant_id as string;
  const supporterId = r.related_actor_id as string;
  if (input.creatorId !== participantId && input.creatorId !== supporterId) {
    throw new PlatformError('AUTHORISATION_DENIED', 'Not a party to this relationship');
  }
  if (
    r.relationship_state !== 'Active' ||
    !(r.permitted_actions as string[]).includes('relationship.message') ||
    (r.expires_at !== null && (r.expires_at as Date) <= deps.clock.now())
  ) {
    throw new PlatformError('COMMUNICATION_BASIS_REQUIRED', 'That relationship does not allow messages');
  }

  const decision = await deps.checkPermission(ctx, {
    action: input.creatorId === participantId ? 'thread.create' : 'relationship.message',
    resource: {
      type: 'ConversationThread',
      id: 'new',
      state: 'Draft',
      protectedExistence: true,
      ownerParticipantId: participantId,
    },
  });
  assertAllowed(decision, false);
  await assertNoBlock(deps, participantId, supporterId);

  // One conversation per relationship: a second would split the same
  // history in two and leave each party reading half of it.
  const existing = await deps.pool.query(
    `SELECT id FROM community_social.conversation_threads
      WHERE basis_type = 'AuthorisedRelationship' AND basis_reference = $1 AND thread_state = 'Active'`,
    [input.relationshipId],
  );
  if (existing.rows[0] !== undefined) return { threadId: existing.rows[0].id as string };

  const threadId = newId('ct');
  const now = deps.clock.now();
  await withTransaction(deps.pool, async (client) => {
    await client.query(
      `INSERT INTO community_social.conversation_threads
         (id, basis_type, basis_reference, participant_a_id, participant_b_id)
       VALUES ($1, 'AuthorisedRelationship', $2, $3, $4)`,
      [threadId, input.relationshipId, participantId, supporterId],
    );
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: MSG_EVENTS.ConversationThreadCreated,
      sourceModule: 'M18',
      aggregateType: 'ConversationThread',
      aggregateId: threadId,
      occurredAt: now,
    });
    await recordAuditEvent(client, ctx, {
      action: 'thread.create',
      targetType: 'ConversationThread',
      targetId: threadId,
      participantId,
      occurredAt: now,
      result: 'Succeeded',
      source: 'M18',
      policyVersion: decision.policyVersion,
    });
  });
  return { threadId };
}

/** Creating a Draft never sends (ADR-032): delivery stays Not Submitted. */
export async function createMessageDraft(
  deps: M18Deps,
  ctx: RequestContext,
  input: { threadId: string; senderParticipantId: string; contentText: string },
): Promise<{ messageId: string }> {
  const thread = await loadThread(deps, input.threadId);
  if (input.senderParticipantId !== thread.participantA && input.senderParticipantId !== thread.participantB) {
    throw new PlatformError('THREAD_PARTICIPANT_MISMATCH', 'Sender is not a thread participant');
  }
  const authority = messagingAuthority(thread, input.senderParticipantId, 'message.draft');
  const decision = await deps.checkPermission(ctx, {
    action: authority.action,
    resource: {
      type: 'Message',
      id: 'new',
      state: 'Draft',
      protectedExistence: true,
      ownerParticipantId: authority.ownerParticipantId,
    },
  });
  assertAllowed(decision, false);
  await assertBasisEffective(deps, thread);

  const messageId = newId('msg');
  const now = deps.clock.now();
  await withTransaction(deps.pool, async (client) => {
    await client.query(
      `INSERT INTO community_social.messages (id, thread_id, sender_participant_id, content_text)
       VALUES ($1, $2, $3, $4)`,
      [messageId, input.threadId, input.senderParticipantId, input.contentText],
    );
    // Payload excludes the message body (ADR-034).
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: MSG_EVENTS.MessageDraftCreated,
      sourceModule: 'M18',
      aggregateType: 'Message',
      aggregateId: messageId,
      occurredAt: now,
    });
  });
  return { messageId };
}

/** Editing bumps the version and invalidates any prior confirmation. */
export async function reviseMessageDraft(
  deps: M18Deps,
  ctx: RequestContext,
  input: { messageId: string; senderParticipantId: string; contentText: string },
): Promise<{ messageVersion: number }> {
  const owning = await deps.pool.query(`SELECT thread_id FROM community_social.messages WHERE id = $1`, [
    input.messageId,
  ]);
  if (owning.rows[0] === undefined) throw new PlatformError('RESOURCE_NOT_FOUND', 'Message not found');
  const draftThread = await loadThread(deps, owning.rows[0].thread_id as string);
  const editAuthority = messagingAuthority(draftThread, input.senderParticipantId, 'message.draft');
  const decision = await deps.checkPermission(ctx, {
    action: editAuthority.action,
    resource: {
      type: 'Message',
      id: input.messageId,
      state: 'Draft',
      protectedExistence: true,
      ownerParticipantId: editAuthority.ownerParticipantId,
    },
  });
  assertAllowed(decision, false);
  const now = deps.clock.now();
  return withTransaction(deps.pool, async (client) => {
    const res = await client.query(
      `UPDATE community_social.messages
          SET content_text = $2, message_version = message_version + 1,
              record_version = record_version + 1, updated_at = $3
        WHERE id = $1 AND sender_participant_id = $4 AND lifecycle_state = 'Draft'
        RETURNING message_version`,
      [input.messageId, input.contentText, now, input.senderParticipantId],
    );
    if (res.rows[0] === undefined) {
      throw new PlatformError('MESSAGE_NOT_DRAFT', 'Only drafts can be revised; confirmed messages need a new draft');
    }
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: MSG_EVENTS.MessageDraftRevised,
      sourceModule: 'M18',
      aggregateType: 'Message',
      aggregateId: input.messageId,
      occurredAt: now,
    });
    return { messageVersion: res.rows[0].message_version };
  });
}

/**
 * SendConfirmation: bound to the current actor, EXACT message version and
 * EXACT recipient set (ADR-032). Re-validates basis + Block, then commits
 * confirmation + Queued state + MessageSendConfirmed + MessageQueued in one
 * transaction (Doc 16 §54 atomic pair). Confirmation produces Queued —
 * never Sent or Delivered.
 */
export async function confirmSend(
  deps: M18Deps,
  ctx: RequestContext,
  input: {
    messageId: string;
    senderParticipantId: string;
    expectedMessageVersion: number;
    recipientIds: string[];
    confirmed: boolean;
    /**
     * True when the participant pressed send while someone was helping
     * them (decision D-15). The helper never acts for them — assistance
     * is read-only — but the recipient is told, because a conversation
     * whose audience is larger than one party believes is not the
     * conversation they think they are having.
     */
    assisted?: boolean;
  },
): Promise<{ sendConfirmationId: string }> {
  const msg = await deps.pool.query(
    `SELECT m.thread_id, m.message_version, m.lifecycle_state, m.sender_participant_id
       FROM community_social.messages m WHERE m.id = $1`,
    [input.messageId],
  );
  const m = msg.rows[0];
  if (m === undefined) throw new PlatformError('RESOURCE_NOT_FOUND', 'Message not found');
  if (m.sender_participant_id !== input.senderParticipantId) {
    throw new PlatformError('AUTHORISATION_DENIED', 'Only the author can confirm their message');
  }
  const thread = await loadThread(deps, m.thread_id);
  const authority = messagingAuthority(thread, input.senderParticipantId, 'message.confirm-send');
  const decision = await deps.checkPermission(ctx, {
    action: authority.action,
    resource: {
      type: 'Message',
      id: input.messageId,
      state: m.lifecycle_state,
      protectedExistence: true,
      ownerParticipantId: authority.ownerParticipantId,
    },
    confirmed: input.confirmed,
  });
  assertAllowed(decision, input.confirmed);
  /*
   * `message.confirm-send` carries confirmationRequired in the catalogue,
   * so the participant's own send is already guarded by the policy engine.
   * `relationship.message` deliberately does not — making it
   * confirmationRequired would also demand a confirmation to write a
   * draft, and a supporter would have to confirm typing. Sending is still
   * sending, so the guard lives here instead of being quietly absent.
   */
  if (authority.action === 'relationship.message' && input.confirmed !== true) {
    throw new PlatformError('CONFIRMATION_REQUIRED', 'Sending needs to be confirmed');
  }
  await assertBasisEffective(deps, thread);
  const other = thread.participantA === input.senderParticipantId ? thread.participantB : thread.participantA;
  await assertNoBlock(deps, input.senderParticipantId, other);

  if (m.lifecycle_state !== 'Draft') {
    throw new PlatformError('MESSAGE_ALREADY_QUEUED', 'Message is not a draft');
  }
  if (m.message_version !== input.expectedMessageVersion) {
    throw new PlatformError('SEND_CONFIRMATION_MISMATCH', 'Confirmation does not match the current draft version');
  }
  const expectedRecipients = [other];
  if (recipientHash(input.recipientIds) !== recipientHash(expectedRecipients)) {
    throw new PlatformError('SEND_CONFIRMATION_MISMATCH', 'Confirmation does not match the exact recipient set');
  }

  const sendConfirmationId = newId('cfm');
  const now = deps.clock.now();
  await withTransaction(deps.pool, async (client) => {
    const upd = await client.query(
      `UPDATE community_social.messages
          SET lifecycle_state = 'Queued', delivery_state = 'Queued', recipient_set_hash = $2,
              sent_with_assistance = $5,
              record_version = record_version + 1, updated_at = $3
        WHERE id = $1 AND lifecycle_state = 'Draft' AND message_version = $4`,
      [
        input.messageId,
        recipientHash(input.recipientIds),
        now,
        input.expectedMessageVersion,
        input.assisted === true,
      ],
    );
    if (upd.rowCount !== 1) throw new PlatformError('SEND_CONFIRMATION_MISMATCH', 'Draft changed concurrently');
    await client.query(
      `INSERT INTO community_social.message_send_confirmations
         (id, message_id, message_version, recipient_set_hash, confirmed_by_participant_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [sendConfirmationId, input.messageId, input.expectedMessageVersion, recipientHash(input.recipientIds), input.senderParticipantId],
    );
    for (const eventType of [MSG_EVENTS.MessageSendConfirmed, MSG_EVENTS.MessageQueued]) {
      await appendToOutbox(client, ctx, {
        eventCategory: 'Domain',
        eventType,
        sourceModule: 'M18',
        aggregateType: 'Message',
        aggregateId: input.messageId,
        occurredAt: now,
      });
    }
    await recordAuditEvent(client, ctx, {
      action: 'message.confirm-send',
      targetType: 'Message',
      targetId: input.messageId,
      participantId: input.senderParticipantId,
      occurredAt: now,
      result: 'Succeeded',
      source: 'M18',
      policyVersion: decision.policyVersion,
    });
  });
  return { sendConfirmationId };
}

/** M18-owned delivery-state command — the ONLY path M16 may use (ADR-033). */
const DELIVERY_TRANSITIONS: Record<string, { from: string[]; event: string }> = {
  'Sent to Provider': { from: ['Queued'], event: MSG_EVENTS.MessageSent },
  'Provider Accepted': { from: ['Sent to Provider'], event: MSG_EVENTS.MessageProviderAccepted },
  Delivered: { from: ['Provider Accepted', 'Sent to Provider'], event: MSG_EVENTS.MessageDelivered },
  'Delivery Failed': { from: ['Queued', 'Sent to Provider', 'Provider Accepted'], event: MSG_EVENTS.MessageDeliveryFailed },
  'Delivery Unknown': { from: ['Queued', 'Sent to Provider', 'Provider Accepted'], event: MSG_EVENTS.MessageDeliveryFailed },
};

export async function recordDeliveryState(
  deps: M18Deps,
  ctx: RequestContext,
  input: { messageId: string; deliveryState: keyof typeof DELIVERY_TRANSITIONS; providerReference?: string; provider?: string },
): Promise<void> {
  const t = DELIVERY_TRANSITIONS[input.deliveryState];
  if (t === undefined) throw new PlatformError('MESSAGE_DELIVERY_STATE_CONFLICT', 'Unknown delivery state');
  const now = deps.clock.now();
  await withTransaction(deps.pool, async (client) => {
    const res = await client.query(
      `UPDATE community_social.messages
          SET delivery_state = $2,
              lifecycle_state = CASE WHEN $2 IN ('Sent to Provider', 'Provider Accepted', 'Delivered') THEN 'Sent' ELSE lifecycle_state END,
              record_version = record_version + 1, updated_at = $3
        WHERE id = $1 AND delivery_state = ANY($4)`,
      [input.messageId, input.deliveryState, now, t.from],
    );
    if (res.rowCount !== 1) {
      throw new PlatformError('MESSAGE_DELIVERY_STATE_CONFLICT', `Transition to ${input.deliveryState} not allowed from current state`);
    }
    if (input.deliveryState === 'Sent to Provider' && input.provider !== undefined && input.providerReference !== undefined) {
      const seq = await client.query(
        `SELECT coalesce(max(attempt_seq), 0) + 1 AS n FROM community_social.message_delivery_attempts WHERE message_id = $1`,
        [input.messageId],
      );
      await client.query(
        `INSERT INTO community_social.message_delivery_attempts (id, message_id, attempt_seq, provider, provider_reference)
         VALUES ($1, $2, $3, $4, $5)`,
        [newId('att'), input.messageId, seq.rows[0].n, input.provider, input.providerReference],
      );
    }
    await appendToOutbox(client, ctx, {
      eventCategory: 'Domain',
      eventType: t.event,
      sourceModule: 'M18',
      aggregateType: 'Message',
      aggregateId: input.messageId,
      occurredAt: now,
      payload: { deliveryState: input.deliveryState },
    });
  });
}
