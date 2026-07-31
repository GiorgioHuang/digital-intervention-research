import { useState } from 'react';
import { api, PlatformApiError, type Session } from '../api.js';

type Decision = 'Interested' | 'Not Now' | 'Dismissed';
const DECISION_LABELS: Record<Decision, string> = {
  Interested: '感兴趣',
  'Not Now': '暂时不',
  Dismissed: '不再显示这个人',
};

/**
 * Opt-in matching (Doc 20; ADR-036): matching is off by default and
 * requires the open-matching consent; each decision is independent and
 * private — choosing "Interested" alone notifies nobody; only when both
 * people independently choose it does a connection opportunity appear,
 * and the connection itself still needs an explicit confirmed step.
 */
export function MatchingPanel({ session }: { session: Session }) {
  const [interests, setInterests] = useState('');
  const [candidate, setCandidate] = useState({ id: '', version: '1' });
  const [pendingDecision, setPendingDecision] = useState<Decision | null>(null);
  const [mutualAcceptanceId, setMutualAcceptanceId] = useState<string | null>(null);
  const [confirmingConnection, setConfirmingConnection] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  const run = async (fn: () => Promise<unknown>, done: string) => {
    try {
      await fn();
      setAnnouncement(done);
    } catch (err) {
      setAnnouncement(err instanceof PlatformApiError ? `未成功：${err.error.code}` : '网络错误，未提交');
    }
  };

  const decide = async (decision: Decision) => {
    setPendingDecision(null);
    try {
      const res = await api.matchDecision(session, candidate.id, Number(candidate.version), decision, true);
      const ma = res.data.meta.mutualAcceptanceId;
      if (ma !== undefined) {
        setMutualAcceptanceId(ma);
        setAnnouncement('你们双方都表示了兴趣。是否建立联系，仍由你决定。');
      } else {
        setAnnouncement(
          decision === 'Interested'
            ? '已记录你的兴趣。对方不会收到通知；只有当对方也表示兴趣时，你们才会看到彼此的意愿。'
            : '已记录你的选择。对方不会收到任何通知。',
        );
      }
    } catch (err) {
      setAnnouncement(err instanceof PlatformApiError ? `未成功：${err.error.code}` : '网络错误，未提交');
    }
  };

  return (
    <section aria-labelledby="matching-heading">
      <h2 id="matching-heading">认识新朋友（可选）</h2>
      <p>匹配默认关闭。开启前需要你在「我的同意选择」中同意「开放匹配」。你随时可以撤回，不影响其他功能。</p>

      <section aria-labelledby="optin-heading">
        <h3 id="optin-heading">开启匹配</h3>
        <p>
          <label htmlFor="interests">我愿意用于匹配的兴趣（用逗号分隔）</label>
        </p>
        <textarea id="interests" rows={2} value={interests} onChange={(e) => setInterests(e.target.value)} />
        <p>
          <button
            onClick={() =>
              void run(
                () =>
                  api.activateMatching(
                    session,
                    { interests: interests.split(/[,，]/).map((s) => s.trim()).filter((s) => s !== '') },
                    true,
                  ),
                '匹配已开启。只有你选择分享的兴趣会被用于推荐。',
              )
            }
          >
            开启匹配
          </button>
        </p>
      </section>

      <section aria-labelledby="candidate-heading">
        <h3 id="candidate-heading">对推荐做决定</h3>
        <p>每个选择都同样正当，「暂时不」不会影响之后的推荐。你的选择不会被告知对方。</p>
        <p>
          <label htmlFor="candidate-id">推荐标识</label>{' '}
          <input
            id="candidate-id"
            value={candidate.id}
            onChange={(e) => setCandidate({ ...candidate, id: e.target.value })}
          />
        </p>
        <p>
          <label htmlFor="candidate-version">推荐版本</label>{' '}
          <input
            id="candidate-version"
            value={candidate.version}
            onChange={(e) => setCandidate({ ...candidate, version: e.target.value })}
          />
        </p>
        <p>
          {(Object.keys(DECISION_LABELS) as Decision[]).map((d) => (
            <span key={d}>
              <button disabled={candidate.id === ''} onClick={() => setPendingDecision(d)}>
                {DECISION_LABELS[d]}
              </button>{' '}
            </span>
          ))}
        </p>
        {pendingDecision !== null && (
          <div role="alertdialog" aria-labelledby="decision-confirm-heading">
            <p id="decision-confirm-heading">
              确认对推荐 {candidate.id}（版本 {candidate.version}）选择「{DECISION_LABELS[pendingDecision]}」？
              对方不会收到通知。
            </p>
            <button onClick={() => void decide(pendingDecision)}>确认</button>{' '}
            <button onClick={() => setPendingDecision(null)}>返回</button>
          </div>
        )}
      </section>

      {mutualAcceptanceId !== null && (
        <section aria-labelledby="mutual-heading">
          <h3 id="mutual-heading">你们互相表示了兴趣</h3>
          <p>是否建立联系仍由你决定。不建立联系也不会通知对方。</p>
          <button onClick={() => setConfirmingConnection(true)}>建立联系</button>
          {confirmingConnection && (
            <div role="alertdialog" aria-labelledby="conn-confirm-heading">
              <p id="conn-confirm-heading">确认建立联系？建立后你们可以互发消息；你随时可以屏蔽对方或断开联系。</p>
              <button
                onClick={() => {
                  setConfirmingConnection(false);
                  void run(
                    () => api.activateConnection(session, mutualAcceptanceId, true),
                    '联系已建立。现在可以在「消息」中互发消息了。',
                  );
                }}
              >
                确认建立联系
              </button>{' '}
              <button onClick={() => setConfirmingConnection(false)}>返回</button>
            </div>
          )}
        </section>
      )}

      <p aria-live="polite" role="status">
        {announcement}
      </p>
    </section>
  );
}
