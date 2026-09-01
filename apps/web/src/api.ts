/**
 * Thin HTTP client for the platform API (Doc 15 conventions). The web app
 * never imports module packages — it talks to the API boundary only.
 * `x-actor-id` goes on every request, and whether it means anything is the
 * server's decision, not this client's: under `AUTH_MODE=dev-header` the
 * server reads it, and under `AUTH_MODE=google` (ADR-104, the deployed
 * environment) it is ignored in favour of the session.
 */
export interface ApiError {
  code: string;
  message: string;
  requestId: string;
  retryable: boolean;
}

export class PlatformApiError extends Error {
  constructor(readonly error: ApiError, readonly status: number) {
    super(error.message);
  }
}

export interface SupporterInvitationItem {
  invitationId: string;
  invitedEmail: string;
  relationshipType: string | null;
  permittedActions: string[];
  expiresAt: string;
  createdAt: string;
}

export interface Session {
  actorId: string;
  participantId: string;
}

/**
 * Deployed environments sit behind a shared access token (server-side
 * X-Access-Token gate). A token may arrive once as ?token=… — it is stored
 * and stripped from the address bar so it does not linger in history — but
 * it must ALSO be enterable in the app: the stripped history entry can
 * never re-authenticate on its own, and clearing site data wipes the
 * stored copy. Locally no token is configured and nothing changes.
 */
const TOKEN_KEY = 'platformAccessToken';
export const AUTH_REQUIRED_EVENT = 'platform-auth-required';
/** The session ended — a different problem, with a different fix. */
export const SESSION_ENDED_EVENT = 'platform-session-ended';

export function readAccessToken(): string {
  try {
    return window.localStorage.getItem(TOKEN_KEY) ?? '';
  } catch {
    // Storage can be unavailable (private mode, blocked cookies); the app
    // still works for one session via the in-memory fallback below.
    return memoryToken;
  }
}

let memoryToken = '';

export function storeAccessToken(token: string): void {
  memoryToken = token;
  try {
    if (token === '') window.localStorage.removeItem(TOKEN_KEY);
    else window.localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* memory fallback already set */
  }
}

export function captureAccessToken(): void {
  const url = new URL(window.location.href);
  const token = url.searchParams.get('token');
  if (token !== null && token !== '') {
    storeAccessToken(token);
    url.searchParams.delete('token');
    window.history.replaceState(null, '', url.toString());
  }
}

/**
 * Sent on every request, and it is not decoration.
 *
 * Under Sign in with Google the session is an HttpOnly cookie, which the
 * browser attaches by itself — including to a request made by a form on
 * somebody else's page. A cross-site form cannot set a header, so this is
 * how the server tells a request this app made from one merely aimed at
 * it. The server refuses to authenticate a state-changing request without
 * it (see http-context.ts).
 */
export function platformClientHeader(): Record<string, string> {
  return { 'x-platform-client': 'web' };
}

export function accessTokenHeader(): Record<string, string> {
  const token = readAccessToken();
  return token === '' ? {} : { 'x-access-token': token };
}

/**
 * Two 401s, two different problems, two different things to do about them.
 *
 * AUTHENTICATION_FAILED is the environment's shared passphrase — nothing to
 * do with the person or their permissions. AUTHENTICATION_REQUIRED is the
 * sign-in itself having ended. Announcing them as the same thing sent
 * somebody whose session had merely expired off to hunt for a passphrase.
 */
export function raiseApiError(json: { error?: ApiError }, status: number): never {
  const error = json.error as ApiError;
  if (status === 401 && error?.code === 'AUTHENTICATION_FAILED') {
    window.dispatchEvent(new CustomEvent(AUTH_REQUIRED_EVENT));
  }
  if (status === 401 && error?.code === 'AUTHENTICATION_REQUIRED') {
    window.dispatchEvent(new CustomEvent(SESSION_ENDED_EVENT));
  }
  throw new PlatformApiError(error, status);
}

/**
 * The largest file this platform accepts, held on the browser's side too.
 *
 * The same number as `DEFAULT_STORAGE_CONFIG.maxSizeBytes` in M16. The web
 * app never imports a module package (Doc 15), so it is written again
 * here rather than shared; `apps/api/test/body-limits.test.ts` is what
 * stops the two drifting.
 */
export const MAX_FILE_MB = 10;
export const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;

/**
 * What the photograph control accepts, and the words the screen says it
 * in.
 *
 * The platform's own list is wider — it also takes MP3, PDF and plain
 * text — and this is deliberately narrower: the control is labelled "Add
 * a photograph", and naming the wider list here would describe something
 * this screen is not for. Held to being a subset of what the gate really
 * accepts by `apps/api/test/body-limits.test.ts`, so the screen can never
 * come to name a format the server refuses.
 */
export const PHOTOGRAPH_TYPES = ['image/jpeg', 'image/png'] as const;
export const PHOTOGRAPH_TYPE_WORDS = 'JPEG or PNG';

async function post<T>(session: Session, path: string, body: object): Promise<T> {
  const res = await fetch(path, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-actor-id': session.actorId,
      ...platformClientHeader(),
      ...accessTokenHeader(),
    },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as T & { error?: ApiError };
  if (!res.ok) raiseApiError(json, res.status);
  return json;
}

/**
 * A file's bytes, rather than a description of them.
 *
 * Not an `<img src>`, and it cannot be one: this platform authenticates
 * with headers, and a browser sends none of them when it fetches an
 * image. So the bytes are fetched like any other request and handed to
 * the screen as a Blob for it to make an object URL from — which also
 * keeps a Sensitive-Personal photograph out of the address bar and out
 * of anything that logs URLs.
 *
 * The error body is JSON like everywhere else, so a refusal still
 * arrives as a PlatformError and not as a broken picture.
 */
async function readBlob(session: Session, path: string): Promise<Blob> {
  const res = await fetch(path, {
    headers: { 'x-actor-id': session.actorId, ...platformClientHeader(), ...accessTokenHeader() },
  });
  if (!res.ok) {
    let json: { error?: ApiError } = {};
    try {
      json = (await res.json()) as { error?: ApiError };
    } catch {
      // A body that is not JSON is still a failure; raiseApiError says so.
    }
    raiseApiError(json, res.status);
  }
  return res.blob();
}

async function get<T>(session: Session, path: string): Promise<T> {
  const res = await fetch(path, {
    headers: { 'x-actor-id': session.actorId, ...platformClientHeader(), ...accessTokenHeader() },
  });
  const json = (await res.json()) as T & { error?: ApiError };
  if (!res.ok) raiseApiError(json, res.status);
  return json;
}

export interface ConnectionSummary {
  connectionId: string;
  /** Kept for actions that need it; never rendered at another participant. */
  otherParticipantId: string;
  otherDisplayName: string;
  connectionState: string;
  createdAt: string;
}

export interface ThreadSummary {
  threadId: string;
  otherParticipantId: string;
  /** Null when the server could not resolve who the other side is. The
   *  screen says so rather than filling the gap with a description. */
  otherDisplayName: string | null;
  basisType: string;
  threadState: string;
  createdAt: string;
}

export interface MatchCandidateSummary {
  candidateId: string;
  candidateVersion: number;
  explanation: string;
  expiresAt: string;
}

export interface ThreadMessage {
  messageId: string;
  senderParticipantId: string;
  contentText: string;
  messageVersion: number;
  lifecycleState: string;
  deliveryState: string;
  sentWithAssistance: boolean;
  createdAt: string;
}

export interface CommunitySpaceSummary {
  spaceId: string;
  name: string;
  ruleVersionId: string;
  ruleVersionNumber: number;
  rulesText: string;
  membershipState: string | null;
}

export interface CommunityFeedPost {
  postId: string;
  authorParticipantId: string;
  authorDisplayName: string;
  contentText: string;
  publishedAt: string;
}

export interface OwnPostSummary {
  postId: string;
  spaceId: string;
  contentText: string;
  postState: string;
  createdAt: string;
  publishedAt: string | null;
}

export interface ConsentState {
  scope: string;
  decision: string;
  decidedAt: string;
  templateVersion: string;
  restrictions: string[];
  expiresAt: string | null;
  /** What changed, when the participant is being asked to agree again. */
  decisionNote: string | null;
  /** Whether somebody was helping when this was decided. Never who. */
  assistanceRecorded: boolean;
}

export interface MyEnrolment {
  enrolmentId: string;
  researchProjectId: string;
  protocolVersionId: string;
  enrolmentState: string;
  updatedAt: string;
}

export interface ContributionAwaitingReview {
  contributionId: string;
  archiveId: string;
  itemId: string | null;
  contentText: string;
  contributorActorId: string;
  /**
   * Who offered it. Null when the account has no name on record — which is
   * a different thing from an anonymous contribution, and the screen says
   * so in words rather than falling back to the account identifier.
   */
  contributorDisplayName: string | null;
  createdAt: string;
}

export interface UncaptionedPhotograph {
  objectId: string;
  /** The life-story item it is attached to. */
  owningResourceId: string;
  declaredContentType: string;
  addedAt: string;
}

export interface OwnDecision {
  /** The audited action. The words are the server's, not the screen's. */
  action: string;
  what: string;
  when: string;
}

export interface MyProfile {
  participantId: string;
  displayName: string;
}

export interface AttachedFile {
  objectId: string;
  declaredContentType: string;
  declaredSizeBytes: number;
  objectState: string;
  dataClassification: string | null;
  createdAt: string;
}

export interface MyLifeStoryItem {
  itemId: string;
  title: string;
  itemState: string;
  visibility: string;
  currentVersionId: string | null;
  versionNumber: number | null;
  contentText: string | null;
  sourceType: string | null;
  testimonyState: string | null;
  supersedesConfirmedVersion: boolean;
  versionCount: number;
  updatedAt: string;
}

export interface MyRelationship {
  relationshipId: string;
  relatedActorId: string;
  relatedDisplayName: string | null;
  relationshipType: string;
  relationshipState: string;
  permittedActions: string[];
  expiresAt: string | null;
  recordVersion: number;
  proposedAt: string;
}

export interface MyBlock {
  blockId: string;
  blockedActorId: string;
  blockedDisplayName: string | null;
  createdAt: string;
}

export interface MyExportRequest {
  exportRequestId: string;
  purpose: string;
  requestState: string;
  createdAt: string;
  updatedAt: string;
}

export const api = {
  listMyRelationships: (s: Session) =>
    get<{ data: { id: string; attributes: MyRelationship }[] }>(
      s,
      `/v1/participants/${s.participantId}/relationships`,
    ),
  /** Version-bound: approving something that changed under you is refused, not merged. */
  approveRelationship: (s: Session, relationshipId: string, expectedVersion: number) =>
    post(s, `/v1/relationships/${relationshipId}/approve`, { expectedVersion, confirmed: true }),
  pauseRelationship: (s: Session, relationshipId: string, expectedVersion: number) =>
    post(s, `/v1/relationships/${relationshipId}/pause`, { expectedVersion }),
  resumeRelationship: (s: Session, relationshipId: string, expectedVersion: number) =>
    post(s, `/v1/relationships/${relationshipId}/resume`, { expectedVersion, confirmed: true }),
  inviteSupporter: (
    s: Session,
    input: { email: string; relationshipType: string; permittedActions: string[] },
  ) =>
    post<{ data: { attributes: { invitedEmail: string; expiresAt: string } } }>(
      s,
      `/v1/participants/${s.participantId}/supporter-invitations`,
      input,
    ),
  listSupporterInvitations: (s: Session) =>
    get<{ data: { id: string; attributes: SupporterInvitationItem }[] }>(
      s,
      `/v1/participants/${s.participantId}/supporter-invitations`,
    ),
  withdrawSupporterInvitation: (s: Session, invitationId: string) =>
    post(s, `/v1/participants/${s.participantId}/supporter-invitations/${invitationId}/withdraw`, {
      confirmed: true,
    }),
  revokeRelationship: (s: Session, relationshipId: string, expectedVersion: number) =>
    post(s, `/v1/relationships/${relationshipId}/revoke`, { expectedVersion }),
  listMyExportRequests: (s: Session) =>
    get<{ data: { id: string; attributes: MyExportRequest }[] }>(
      s,
      `/v1/participants/${s.participantId}/export-requests`,
    ),
  /**
   * Asking for a copy is confirmed but deliberately carries no reason
   * from the participant: the right to a copy of your own information is
   * not conditional on explaining why you want it.
   */
  requestMyExport: (s: Session) =>
    post(s, `/v1/participants/${s.participantId}/export-requests`, {
      purpose: 'A copy of my own information, requested by me',
      confirmed: true,
    }),
  getMyLifeStory: (s: Session) =>
    get<{ data: { id: string; attributes: MyLifeStoryItem }[]; meta: { archiveId: string | null } }>(
      s,
      `/v1/participants/${s.participantId}/life-story`,
    ),
  createLifeStoryArchive: (s: Session) =>
    post<{ data: { id: string } }>(s, `/v1/life-story/archives`, { participantId: s.participantId }),
  createLifeStoryItem: (s: Session, archiveId: string, title: string, contentText: string) =>
    post(s, `/v1/life-story/archives/${archiveId}/items`, {
      title,
      contentText,
      // Written by the participant in their own words. Never AIDraft here:
      // this screen has no drafting assistant (D-14), so claiming one wrote
      // it would be a false provenance record.
      sourceType: 'ParticipantAuthored',
    }),
  /**
   * Changing what you wrote. Nothing is overwritten — the command adds a
   * version and keeps every earlier one — and the provenance stays
   * ParticipantAuthored for the same reason it does above: this screen
   * has no drafting assistant (D-14).
   */
  reviseLifeStoryItem: (s: Session, itemId: string, contentText: string) =>
    post(s, `/v1/life-story/items/${itemId}/revise`, { contentText, sourceType: 'ParticipantAuthored' }),
  /**
   * Withdrawing an entry. Confirmed, because it is the participant
   * reaching into their own record and closing something — and because
   * the command refuses it unconfirmed.
   */
  withdrawLifeStoryItem: (s: Session, itemId: string) =>
    post(s, `/v1/life-story/items/${itemId}/withdraw`, { confirmed: true }),
  /**
   * Adding a photograph to an entry, in one act.
   *
   * The destination is named when the upload starts, so the participant
   * does not have to come back and attach it once a background sweep has
   * checked the file. What they get back is the object's identifier and
   * nothing else — it is not attached yet, and this must not report that
   * it is.
   */
  attachToLifeStoryItem: async (s: Session, itemId: string, file: File) => {
    /*
     * Asked before the file is read, not after it is sent.
     *
     * The size is known the moment somebody chooses the file, and reading
     * a large one into memory, turning it into base64 and posting it in
     * order to be told no is a slow way to say something that could have
     * been said at once — on a phone, on a connection that may be poor.
     * The server refuses at the same numbers, so this is a kindness and
     * not the check.
     */
    if (file.size > MAX_FILE_BYTES) {
      throw new PlatformApiError(
        {
          code: 'VALIDATION_ERROR',
          message: `That photograph is ${String(Math.round(file.size / 1024 / 1024))} MB, and the largest this platform can take is ${String(MAX_FILE_MB)} MB.`,
          requestId: 'local',
          retryable: false,
        },
        400,
      );
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    const started = await post<{ data: { id: string } }>(s, '/v1/objects', {
      ownerParticipantId: s.participantId,
      declaredContentType: file.type,
      declaredSizeBytes: bytes.byteLength,
      attachTo: { owningResourceType: 'LifeStoryItem', owningResourceId: itemId },
    });
    let binary = '';
    for (const b of bytes) binary += String.fromCharCode(b);
    await post(s, `/v1/objects/${started.data.id}/content`, { contentBase64: btoa(binary) });
    return started.data.id;
  },
  /**
   * Taking a photograph back. Confirmation-tier and irreversible: the
   * bytes go, and what remains says a file was added and removed.
   */
  removeFile: (s: Session, objectId: string) =>
    post(s, `/v1/objects/${objectId}/delete`, { confirmed: true }),
  /**
   * What to call the person using the app. Null is a real answer, not a
   * failure: during synthetic setup a session can name a participant with
   * no profile row, and Home greeting without a name is correct there.
   */
  /**
   * The last few decisions this person made, in their own words. The server
   * holds the vocabulary: a screen that translated action codes itself
   * would drift from what the platform actually recorded.
   */
  /**
   * Photographs in this person's story with nothing said about them. One,
   * because the Home card is one unfinished thing rather than a list of
   * chores.
   */
  listUncaptionedPhotographs: (s: Session, limit = 1) =>
    get<{ data: { id: string; attributes: UncaptionedPhotograph }[] }>(
      s,
      `/v1/participants/${s.participantId}/uncaptioned-photographs?limit=${String(limit)}`,
    ),
  /** An empty caption clears it; it never removes the photograph. */
  captionPhotograph: (s: Session, objectId: string, caption: string) =>
    post<{ data: { attributes: { caption: string | null } } }>(s, `/v1/objects/${objectId}/caption`, { caption }),
  listMyRecentDecisions: (s: Session, limit = 3) =>
    get<{ data: { id: string; attributes: OwnDecision }[] }>(
      s,
      `/v1/participants/${s.participantId}/decisions?limit=${String(limit)}`,
    ),
  getMyProfile: (s: Session) =>
    get<{ data: { id: string; attributes: MyProfile } | null }>(s, `/v1/participants/${s.participantId}/profile`),
  listLifeStoryItemFiles: (s: Session, itemId: string) =>
    get<{ data: { id: string; attributes: AttachedFile }[] }>(
      s,
      `/v1/participants/${s.participantId}/objects?owningResourceType=LifeStoryItem&owningResourceId=${encodeURIComponent(itemId)}`,
    ),
  readFileContent: (s: Session, objectId: string) => readBlob(s, `/v1/objects/${objectId}/content`),
  confirmTestimony: (s: Session, itemId: string, versionId: string) =>
    post(s, `/v1/life-story/items/${itemId}/confirm-testimony`, { versionId, confirmed: true }),
  listContributionsAwaitingReview: (s: Session) =>
    get<{ data: { id: string; attributes: ContributionAwaitingReview }[] }>(
      s,
      `/v1/participants/${s.participantId}/life-story/contributions/awaiting-review`,
    ),
  /** Saying no needs nowhere to put anything, so the item is only sent when accepting. */
  reviewContribution: (
    s: Session,
    contributionId: string,
    decision: 'Accepted' | 'Rejected',
    itemId?: string,
  ) =>
    post(s, `/v1/life-story/contributions/${contributionId}/review`, {
      decision,
      ...(itemId === undefined ? {} : { itemId }),
    }),
  listMyEnrolments: (s: Session) =>
    get<{ data: { id: string; attributes: MyEnrolment }[] }>(s, `/v1/participants/${s.participantId}/enrolments`),
  /**
   * Leaving is owner-permitted and confirmed. A reason is deliberately
   * optional: the right to withdraw cannot be made conditional on
   * explaining yourself.
   */
  withdrawFromStudy: (s: Session, enrolmentId: string, reasonCategory?: string) =>
    post(s, `/v1/enrolments/${enrolmentId}/withdraw`, {
      confirmed: true,
      ...(reasonCategory === undefined || reasonCategory === '' ? {} : { reasonCategory }),
    }),
  listMyConsents: (s: Session) =>
    get<{ data: { id: string; attributes: ConsentState }[] }>(s, `/v1/participants/${s.participantId}/consents`),
  /**
   * The version must be the one the participant is actually being shown.
   * It was hardcoded to 'ct_v1', which was harmless while no consent text
   * could ever change — and became wrong the moment one could: somebody
   * asked to agree to a revised wording would have been recorded as
   * agreeing to the old one, which is the exact fact the demand existed
   * to establish. The platform has no consent-template registry, so
   * 'ct_v1' remains the fallback for a scope with no decision yet.
   *
   * `assisted` says somebody was helping, never who (D-15).
   */
  recordConsent: (
    s: Session,
    scope: string,
    decision: 'Granted' | 'Declined',
    templateVersion: string,
    assisted: boolean,
  ) => post(s, `/v1/participants/${s.participantId}/consents`, { scope, decision, templateVersion, assisted }),
  withdrawConsent: (s: Session, scope: string, confirmed: boolean, templateVersion: string, assisted: boolean) =>
    post(s, `/v1/participants/${s.participantId}/consents/withdraw`, {
      scope,
      templateVersion,
      confirmed,
      assisted,
    }),
  draftMessage: (s: Session, threadId: string, contentText: string) =>
    post<{ data: { id: string } }>(s, `/v1/conversation-threads/${threadId}/messages`, {
      senderParticipantId: s.participantId,
      contentText,
    }),
  confirmSend: (
    s: Session,
    messageId: string,
    expectedMessageVersion: number,
    recipientIds: string[],
    assisted = false,
  ) =>
    post<{ data: { meta: { lifecycleState: string; deliveryState: string } } }>(
      s,
      `/v1/messages/${messageId}/confirm-send`,
      { senderParticipantId: s.participantId, expectedMessageVersion, recipientIds, confirmed: true, assisted },
    ),
  submitReport: (s: Session, reportedActorId: string, category: string, description: string) =>
    post<{ data: { id: string; meta: { moderationCaseId: string } } }>(s, '/v1/reports', {
      reporterId: s.participantId,
      reportedActorId,
      category,
      description,
    }),
  /**
   * Reporting a post rather than a person (decision D-4's main path). Who
   * is being reported is not sent: the server takes the author from the
   * post, so a report cannot open a case against somebody the reporter
   * names. It also means the feed never has to carry an identifier for
   * the author, which is the handle D-12 keeps off the screen.
   */
  reportPost: (s: Session, postId: string, category: string, description: string) =>
    post<{ data: { id: string; meta: { moderationCaseId: string } } }>(s, '/v1/reports', {
      reporterId: s.participantId,
      reportedActorId: '',
      reportedContentId: postId,
      category,
      description,
    }),
  createBlock: (s: Session, blockedActorId: string, confirmed: boolean) =>
    post<{ data: { id: string } }>(s, '/v1/blocks', { blockerId: s.participantId, blockedActorId, confirmed }),
  listMyBlocks: (s: Session) =>
    get<{ data: { id: string; attributes: MyBlock }[] }>(s, `/v1/participants/${s.participantId}/blocks`),
  /**
   * No blocker is sent. Who placed the block is read from the block
   * itself — a request that names its own authority is not authority.
   */
  revokeBlock: (s: Session, blockId: string) => post(s, `/v1/blocks/${blockId}/revoke`, { confirmed: true }),
  recordSafetySignal: (s: Session, category: string, severity: string, description: string) =>
    post<{ data: { id: string } }>(s, '/v1/safety-signals', {
      sourceType: 'Participant',
      category,
      severity,
      description,
    }),
  deactivateMatching: (s: Session, confirmed: boolean) =>
    post<{ data: { id: string; meta: { changed: boolean } } }>(s, '/v1/match-preferences/deactivate', {
      participantId: s.participantId,
      confirmed,
    }),
  activateMatching: (s: Session, declaredAttributes: Record<string, unknown>, confirmed: boolean) =>
    post<{ data: { id: string } }>(s, '/v1/match-preferences', {
      participantId: s.participantId,
      declaredAttributes,
      confirmed,
    }),
  matchDecision: (
    s: Session,
    candidateId: string,
    expectedCandidateVersion: number,
    decision: 'Interested' | 'Not Now' | 'Dismissed',
    confirmed: boolean,
  ) =>
    post<{ data: { id: string; meta: { mutualAcceptanceId?: string } } }>(
      s,
      `/v1/match-candidates/${candidateId}/decision`,
      { participantId: s.participantId, expectedCandidateVersion, decision, confirmed },
    ),
  /**
   * Starting a conversation with a supporter. Refused unless the
   * relationship itself allows messages — being trusted to see what you
   * share is not being allowed to write to you (D-29).
   */
  startRelationshipThread: (s: Session, relationshipId: string) =>
    post<{ data: { id: string } }>(s, `/v1/relationships/${relationshipId}/conversation-thread`, {
      creatorId: s.participantId,
    }),
  /** Ending a connection. This is not blocking, and the screen says so. */
  endConnection: (s: Session, connectionId: string) =>
    post<{ data: { id: string } }>(s, `/v1/connections/${connectionId}/end`, {
      participantId: s.participantId,
      confirmed: true,
    }),
  activateConnection: (s: Session, mutualAcceptanceId: string, confirmed: boolean) =>
    post<{ data: { id: string } }>(s, `/v1/mutual-acceptances/${mutualAcceptanceId}/activate-connection`, {
      participantId: s.participantId,
      confirmed,
    }),
  listConnections: (s: Session) =>
    get<{ data: { id: string; attributes: ConnectionSummary }[] }>(
      s,
      `/v1/participants/${s.participantId}/connections`,
    ),
  listThreads: (s: Session) =>
    get<{ data: { id: string; attributes: ThreadSummary }[] }>(
      s,
      `/v1/participants/${s.participantId}/conversation-threads`,
    ),
  listMatchCandidates: (s: Session) =>
    get<{ data: { id: string; attributes: MatchCandidateSummary }[] }>(
      s,
      `/v1/participants/${s.participantId}/match-candidates`,
    ),
  listThreadMessages: (s: Session, threadId: string) =>
    get<{ data: { id: string; attributes: ThreadMessage }[] }>(
      s,
      `/v1/conversation-threads/${threadId}/messages?participantId=${encodeURIComponent(s.participantId)}`,
    ),
  createThread: (s: Session, connectionId: string) =>
    post<{ data: { id: string } }>(s, '/v1/conversation-threads', {
      connectionId,
      creatorParticipantId: s.participantId,
    }),
  listCommunitySpaces: (s: Session) =>
    get<{ data: { id: string; attributes: CommunitySpaceSummary }[] }>(
      s,
      `/v1/participants/${s.participantId}/community-spaces`,
    ),
  listCommunityFeed: (s: Session, spaceId: string) =>
    get<{ data: { id: string; attributes: CommunityFeedPost }[] }>(
      s,
      `/v1/participants/${s.participantId}/community-spaces/${spaceId}/feed`,
    ),
  listMyPosts: (s: Session) =>
    get<{ data: { id: string; attributes: OwnPostSummary }[] }>(
      s,
      `/v1/participants/${s.participantId}/social-posts`,
    ),
  /**
   * Leaving. Not gated on the consent that joining requires: withdrawing
   * community-participation consent must not trap someone inside the
   * community that consent put them in.
   */
  leaveCommunity: (s: Session, spaceId: string) =>
    post<{ data: { id: string } }>(s, `/v1/community-spaces/${spaceId}/leave`, {
      participantId: s.participantId,
      confirmed: true,
    }),
  joinCommunity: (s: Session, spaceId: string, ruleVersionId: string) =>
    post<{ data: { id: string } }>(s, `/v1/community-spaces/${spaceId}/join`, {
      participantId: s.participantId,
      ruleVersionId,
    }),
  draftSocialPost: (s: Session, spaceId: string, contentText: string) =>
    post<{ data: { id: string } }>(s, '/v1/social-posts', {
      spaceId,
      participantId: s.participantId,
      contentText,
    }),
  publishSocialPost: (s: Session, postId: string) =>
    post<{ data: { id: string } }>(s, `/v1/social-posts/${postId}/publish`, {
      participantId: s.participantId,
      confirmed: true,
    }),
};

/**
 * Truthful delivery-state wording (Doc 20 §161): Provider Accepted is
 * described as accepted by the delivery service, NOT received by the
 * person; Unknown is never shown as success.
 */
export const DELIVERY_STATE_LABELS: Record<string, string> = {
  'Not Submitted': 'Draft — not sent yet',
  Queued: 'Confirmed, queued for sending',
  'Sent to Provider': 'Handed to the delivery service',
  'Provider Accepted': 'Accepted by the delivery service (not received by the person yet)',
  Delivered: 'Delivered to the other person',
  'Delivery Failed': 'Delivery failed — you can try again',
  'Delivery Unknown': 'Delivery status unknown — being checked; this does not mean it arrived',
};
