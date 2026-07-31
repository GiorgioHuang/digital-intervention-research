import { useState } from 'react';
import { PlatformApiError } from '../api.js';
import { staffApi, type ModerationCaseItem, type StaffSession } from '../staff-api.js';

type Decision = 'Dismiss' | 'Warn' | 'Restrict' | 'Hide' | 'Remove' | 'Suspend' | 'Disconnect' | 'Ban' | 'Restore' | 'Escalate';
const DECISION_LABELS: Record<Decision, string> = {
  Dismiss: '不成立，关闭',
  Warn: '警告',
  Restrict: '限制功能',
  Hide: '隐藏内容',
  Remove: '移除内容',
  Suspend: '暂停账号',
  Disconnect: '断开连接',
  Ban: '封禁',
  Restore: '恢复',
  Escalate: '升级处理',
};

/**
 * Moderation workspace: cases come from the queue (the reporter's
 * identity is never in it — moderation judges content and behaviour, not
 * reporters). Every decision is a confirmed human act with a written
 * reason, attributed and immutable once recorded.
 */
export function StaffModeratorPanel({ session }: { session: StaffSession }) {
  const [queue, setQueue] = useState<ModerationCaseItem[] | null>(null);
  const [form, setForm] = useState({ caseId: '', decision: 'Warn' as Decision, reason: '' });
  const [confirming, setConfirming] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  const loadQueue = async () => {
    try {
      const res = await staffApi.listOpenModerationCases(session);
      setQueue(res.data.map((c) => c.attributes));
      setAnnouncement(res.data.length === 0 ? '当前没有待处理个案。' : `${res.data.length} 个待处理个案。`);
    } catch (err) {
      setAnnouncement(err instanceof PlatformApiError ? `未能获取队列：${err.error.code}` : '网络错误');
    }
  };

  const decide = async () => {
    setConfirming(false);
    try {
      await staffApi.recordModerationDecision(session, form.caseId, form.decision, form.reason);
      setQueue((q) => (q === null ? q : q.filter((c) => c.moderationCaseId !== form.caseId)));
      setAnnouncement('决定已记录（以你的身份署名，不可更改）。');
    } catch (err) {
      setAnnouncement(err instanceof PlatformApiError ? `未成功：${err.error.code}` : '网络错误，未提交');
    }
  };

  return (
    <section aria-labelledby="mod-heading">
      <h2 id="mod-heading">内容审核</h2>
      <p>队列不显示举报人身份——审核针对内容与行为，不针对举报人。每个决定都需书面理由，署名后不可更改。</p>
      <p>
        <button onClick={() => void loadQueue()}>查看待处理个案</button>
      </p>
      {queue !== null && queue.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {queue.map((c) => (
            <li key={c.moderationCaseId} style={{ border: '1px solid currentColor', padding: '0.5rem', marginBlock: '0.5rem' }}>
              <p>
                [{c.reportCategory ?? '无报告'}] {c.reportDescription ?? ''}（对象：{c.subjectActorId}，状态：{c.caseState}）
              </p>
              <button onClick={() => setForm((f) => ({ ...f, caseId: c.moderationCaseId }))}>处理此个案</button>
            </li>
          ))}
        </ul>
      )}
      <p>
        <label htmlFor="mod-case">个案标识</label>{' '}
        <input id="mod-case" value={form.caseId} onChange={(e) => setForm({ ...form, caseId: e.target.value })} />
      </p>
      <p>
        <label htmlFor="mod-decision">决定</label>{' '}
        <select
          id="mod-decision"
          value={form.decision}
          onChange={(e) => setForm({ ...form, decision: e.target.value as Decision })}
        >
          {(Object.keys(DECISION_LABELS) as Decision[]).map((d) => (
            <option key={d} value={d}>
              {DECISION_LABELS[d]}
            </option>
          ))}
        </select>
      </p>
      <p>
        <label htmlFor="mod-reason">理由（必填）</label>
      </p>
      <textarea id="mod-reason" rows={2} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
      <p>
        <button disabled={form.caseId === '' || form.reason === ''} onClick={() => setConfirming(true)}>
          记录决定
        </button>
      </p>
      {confirming && (
        <div role="alertdialog" aria-labelledby="mod-confirm">
          <p id="mod-confirm">
            确认对个案 {form.caseId} 记录决定「{DECISION_LABELS[form.decision]}」？此决定将以你的身份署名写入审计，且不可更改。
          </p>
          <button onClick={() => void decide()}>确认记录</button> <button onClick={() => setConfirming(false)}>返回</button>
        </div>
      )}
      <p aria-live="polite" role="status">
        {announcement}
      </p>
    </section>
  );
}
