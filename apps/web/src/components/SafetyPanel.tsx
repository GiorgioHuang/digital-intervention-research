import { useState } from 'react';
import { api, PlatformApiError, type Session } from '../api.js';

/**
 * Block & Report (Doc 20; ADR-037/038): blocking is the participant's own
 * decision behind an explicit confirmation; reporting goes to staff for
 * human review — never adjudicated by automation alone — and a report
 * survives independently of any block. A safety concern raises a
 * SafetySignal reviewed by the safety team.
 */
export function SafetyPanel({ session }: { session: Session }) {
  const [report, setReport] = useState({ actorId: '', category: 'harassment', description: '' });
  const [blockTarget, setBlockTarget] = useState('');
  const [confirmingBlock, setConfirmingBlock] = useState(false);
  const [concern, setConcern] = useState('');
  const [announcement, setAnnouncement] = useState('');

  const run = async (fn: () => Promise<unknown>, done: string) => {
    try {
      await fn();
      setAnnouncement(done);
    } catch (err) {
      setAnnouncement(err instanceof PlatformApiError ? `未成功：${err.error.code}` : '网络错误，未提交');
    }
  };

  return (
    <section aria-labelledby="safety-heading">
      <h2 id="safety-heading">屏蔽与报告</h2>

      <section aria-labelledby="report-heading">
        <h3 id="report-heading">报告让你不适的内容或行为</h3>
        <p>报告会由工作人员查看，不会由自动系统单独决定。即使你之后屏蔽了对方，这份报告仍会被处理。</p>
        <p>
          <label htmlFor="report-actor">对方的标识</label>{' '}
          <input
            id="report-actor"
            value={report.actorId}
            onChange={(e) => setReport({ ...report, actorId: e.target.value })}
          />
        </p>
        <p>
          <label htmlFor="report-category">类型</label>{' '}
          <select
            id="report-category"
            value={report.category}
            onChange={(e) => setReport({ ...report, category: e.target.value })}
          >
            <option value="harassment">骚扰</option>
            <option value="unsafe-content">不安全内容</option>
            <option value="scam">疑似诈骗</option>
            <option value="other">其他</option>
          </select>
        </p>
        <p>
          <label htmlFor="report-description">发生了什么（用你自己的话）</label>
        </p>
        <textarea
          id="report-description"
          rows={3}
          value={report.description}
          onChange={(e) => setReport({ ...report, description: e.target.value })}
        />
        <p>
          <button
            disabled={report.actorId === '' || report.description === ''}
            onClick={() =>
              void run(
                () => api.submitReport(session, report.actorId, report.category, report.description),
                '报告已提交，工作人员会查看。',
              )
            }
          >
            提交报告
          </button>
        </p>
      </section>

      <section aria-labelledby="block-heading">
        <h3 id="block-heading">屏蔽某人</h3>
        <p>屏蔽后，对方将无法与你互发消息，你们也不会再互相出现在匹配中。对方不会收到通知。</p>
        <p>
          <label htmlFor="block-actor">要屏蔽的人的标识</label>{' '}
          <input id="block-actor" value={blockTarget} onChange={(e) => setBlockTarget(e.target.value)} />
        </p>
        <p>
          <button disabled={blockTarget === ''} onClick={() => setConfirmingBlock(true)}>
            屏蔽此人
          </button>
        </p>
        {confirmingBlock && (
          <div role="alertdialog" aria-labelledby="block-confirm-heading">
            <p id="block-confirm-heading">
              确定要屏蔽 {blockTarget} 吗？屏蔽是你自己的决定，随时可以撤销；撤销屏蔽不会恢复已经错过的内容。
            </p>
            <button
              onClick={() => {
                setConfirmingBlock(false);
                void run(() => api.createBlock(session, blockTarget, true), '已屏蔽。');
              }}
            >
              确认屏蔽
            </button>{' '}
            <button onClick={() => setConfirmingBlock(false)}>返回，不屏蔽</button>
          </div>
        )}
      </section>

      <section aria-labelledby="concern-heading">
        <h3 id="concern-heading">我有安全方面的担忧</h3>
        <p>安全团队会查看你的反馈。如果你或他人处于紧急危险中，请直接拨打当地紧急电话——本平台不是紧急求助渠道。</p>
        <textarea
          id="concern-text"
          aria-label="安全担忧内容"
          rows={3}
          value={concern}
          onChange={(e) => setConcern(e.target.value)}
        />
        <p>
          <button
            disabled={concern === ''}
            onClick={() =>
              void run(
                () => api.recordSafetySignal(session, 'wellbeing-concern', 'Moderate', concern),
                '已提交给安全团队。',
              )
            }
          >
            提交安全担忧
          </button>
        </p>
      </section>

      <p aria-live="polite" role="status">
        {announcement}
      </p>
    </section>
  );
}
