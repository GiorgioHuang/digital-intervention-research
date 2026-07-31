import { useState } from 'react';
import { PlatformApiError } from '../api.js';
import { staffApi, type StaffSession } from '../staff-api.js';

type Disposition = 'Closed as Not a Safety Event' | 'Escalated' | 'Converted to Safety Event';
const DISPOSITIONS: { value: Disposition; label: string }[] = [
  { value: 'Closed as Not a Safety Event', label: '关闭：不是安全事件' },
  { value: 'Escalated', label: '升级：需要更高级别审查' },
  { value: 'Converted to Safety Event', label: '转为安全事件（需要 MFA）' },
];

/**
 * Safety triage (ADR-039): dispositions are confirmed human work with a
 * written reason; conversion to a SafetyEvent is the strongest authority
 * (MFA) and the UI says so up front instead of failing late.
 */
export function StaffSafetyTriagePanel({ session }: { session: StaffSession }) {
  const [form, setForm] = useState({ signalId: '', disposition: DISPOSITIONS[0]!.value as Disposition, reason: '' });
  const [confirming, setConfirming] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  const conversionWithoutMfa = form.disposition === 'Converted to Safety Event' && session.authStrength !== 'mfa';

  const submit = async () => {
    setConfirming(false);
    try {
      const res = await staffApi.triageSignal(session, form.signalId, form.disposition, form.reason);
      const eventId = res.data.meta.safetyEventId;
      setAnnouncement(
        eventId === undefined ? '处置已记录。' : `处置已记录，安全事件已创建：${eventId}`,
      );
    } catch (err) {
      setAnnouncement(err instanceof PlatformApiError ? `未成功：${err.error.code}` : '网络错误，未提交');
    }
  };

  return (
    <section aria-labelledby="triage-heading">
      <h2 id="triage-heading">安全信号 triage</h2>
      <p>处置是人工职责：自动系统只能产生信号，永远不能创建安全事件。每个处置都需要书面理由。</p>
      <p>
        <label htmlFor="triage-signal">信号标识</label>{' '}
        <input id="triage-signal" value={form.signalId} onChange={(e) => setForm({ ...form, signalId: e.target.value })} />
      </p>
      <p>
        <label htmlFor="triage-disposition">处置</label>{' '}
        <select
          id="triage-disposition"
          value={form.disposition}
          onChange={(e) => setForm({ ...form, disposition: e.target.value as Disposition })}
        >
          {DISPOSITIONS.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
      </p>
      {conversionWithoutMfa && (
        <p role="note">转为安全事件需要 MFA 级别认证。你当前是密码级别——提交会被服务端拒绝（这是预期行为）。</p>
      )}
      <p>
        <label htmlFor="triage-reason">理由（必填）</label>
      </p>
      <textarea
        id="triage-reason"
        rows={2}
        value={form.reason}
        onChange={(e) => setForm({ ...form, reason: e.target.value })}
      />
      <p>
        <button disabled={form.signalId === '' || form.reason === ''} onClick={() => setConfirming(true)}>
          提交处置
        </button>
      </p>
      {confirming && (
        <div role="alertdialog" aria-labelledby="triage-confirm">
          <p id="triage-confirm">
            确认对信号 {form.signalId} 记录处置「{DISPOSITIONS.find((d) => d.value === form.disposition)?.label}」？
          </p>
          <button onClick={() => void submit()}>确认</button> <button onClick={() => setConfirming(false)}>返回</button>
        </div>
      )}
      <p aria-live="polite" role="status">
        {announcement}
      </p>
    </section>
  );
}
