import { useState } from 'react';
import { api, PlatformApiError, type Session } from '../api.js';

/**
 * Granular consent (Doc 20 consent UX rules): one concept per choice, no
 * preselected options, decline as reachable as accept, withdrawal behind
 * an explicit confirmation step with a plain-language consequence summary.
 */
const SCOPES: { scope: string; label: string; description: string }[] = [
  { scope: 'study-participation', label: '参与研究', description: '允许研究团队在本研究中使用我的参与记录。' },
  { scope: 'community-participation', label: '加入社区', description: '允许我加入受管理的社区空间。' },
  { scope: 'open-matching', label: '开放匹配', description: '允许平台基于我选择的兴趣为我推荐可能认识的人。默认关闭。' },
  { scope: 'participant-messaging', label: '消息交流', description: '允许我与已建立联系的人互发消息。' },
];

export function ConsentPanel({ session }: { session: Session }) {
  const [status, setStatus] = useState<Record<string, string>>({});
  const [pendingWithdrawal, setPendingWithdrawal] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');

  const act = async (scope: string, fn: () => Promise<unknown>, done: string) => {
    try {
      await fn();
      setStatus((s) => ({ ...s, [scope]: done }));
      setAnnouncement(`${scope}：${done}`);
    } catch (err) {
      const msg = err instanceof PlatformApiError ? `未成功：${err.error.code}` : '网络错误，未做任何更改';
      setStatus((s) => ({ ...s, [scope]: msg }));
      setAnnouncement(msg);
    }
  };

  return (
    <section aria-labelledby="consent-heading">
      <h2 id="consent-heading">我的同意选择</h2>
      <p>每一项都是独立的选择。拒绝任何一项不影响其他选择，也不影响你退出研究的权利。</p>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {SCOPES.map(({ scope, label, description }) => (
          <li key={scope} style={{ marginBlock: '1rem', border: '1px solid currentColor', padding: '1rem' }}>
            <h3>{label}</h3>
            <p>{description}</p>
            {/* No preselection: both actions are equal-weight buttons. */}
            <button onClick={() => act(scope, () => api.recordConsent(session, scope, 'Granted'), '已同意')}>
              同意「{label}」
            </button>{' '}
            <button onClick={() => act(scope, () => api.recordConsent(session, scope, 'Declined'), '已拒绝')}>
              拒绝「{label}」
            </button>{' '}
            <button onClick={() => setPendingWithdrawal(scope)}>撤回「{label}」的同意</button>
            {pendingWithdrawal === scope && (
              <div role="alertdialog" aria-labelledby={`wd-${scope}`} style={{ marginTop: '0.5rem' }}>
                <p id={`wd-${scope}`}>
                  撤回后，平台将停止为此目的使用你的信息。已锁定的研究数据集不会被改写，但不会再新增你的数据。
                </p>
                <button
                  onClick={() => {
                    setPendingWithdrawal(null);
                    void act(scope, () => api.withdrawConsent(session, scope, true), '已撤回');
                  }}
                >
                  确认撤回「{label}」
                </button>{' '}
                <button onClick={() => setPendingWithdrawal(null)}>返回，不撤回</button>
              </div>
            )}
            {status[scope] !== undefined && <p aria-live="off">状态：{status[scope]}</p>}
          </li>
        ))}
      </ul>
      <p aria-live="polite" role="status">{announcement}</p>
    </section>
  );
}
