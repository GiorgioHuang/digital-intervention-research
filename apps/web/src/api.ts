/**
 * Thin HTTP client for the platform API (Doc 15 conventions). The web app
 * never imports module packages — it talks to the API boundary only.
 * Dev-header auth mirrors the API's development stub (production OIDC
 * pending ADR-104).
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

export interface Session {
  actorId: string;
  participantId: string;
}

async function post<T>(session: Session, path: string, body: object): Promise<T> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-actor-id': session.actorId },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as T & { error?: ApiError };
  if (!res.ok) throw new PlatformApiError(json.error as ApiError, res.status);
  return json;
}

export const api = {
  recordConsent: (s: Session, scope: string, decision: 'Granted' | 'Declined') =>
    post(s, `/v1/participants/${s.participantId}/consents`, { scope, decision, templateVersion: 'ct_v1' }),
  withdrawConsent: (s: Session, scope: string, confirmed: boolean) =>
    post(s, `/v1/participants/${s.participantId}/consents/withdraw`, { scope, templateVersion: 'ct_v1', confirmed }),
  draftMessage: (s: Session, threadId: string, contentText: string) =>
    post<{ data: { id: string } }>(s, `/v1/conversation-threads/${threadId}/messages`, {
      senderParticipantId: s.participantId,
      contentText,
    }),
  confirmSend: (s: Session, messageId: string, expectedMessageVersion: number, recipientIds: string[]) =>
    post<{ data: { meta: { lifecycleState: string; deliveryState: string } } }>(
      s,
      `/v1/messages/${messageId}/confirm-send`,
      { senderParticipantId: s.participantId, expectedMessageVersion, recipientIds, confirmed: true },
    ),
};

/**
 * Truthful delivery-state wording (Doc 20 §161): Provider Accepted is
 * described as accepted by the delivery service, NOT received by the
 * person; Unknown is never shown as success.
 */
export const DELIVERY_STATE_LABELS: Record<string, string> = {
  'Not Submitted': '草稿 — 尚未发送',
  Queued: '已确认，排队发送中',
  'Sent to Provider': '已提交给发送服务',
  'Provider Accepted': '发送服务已接受（对方尚未收到）',
  Delivered: '已送达对方',
  'Delivery Failed': '发送失败 — 可重试',
  'Delivery Unknown': '送达状态未知 — 正在核实，不代表成功',
};
