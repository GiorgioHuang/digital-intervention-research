import { useState } from 'react';
import { PlatformApiError } from '../api.js';
import { staffApi, type EnrolmentItem, type StaffSession } from '../staff-api.js';

/**
 * Enrolment coordination (M05): the chain is explicit — invite against an
 * approved protocol version, screening, a HUMAN eligibility decision with
 * a written reason, consent, enrol, activate. Withdrawal is confirmed and
 * states its consequence honestly.
 */
export function StaffCoordinatorPanel({ session }: { session: StaffSession }) {
  const [invite, setInvite] = useState({ participantId: '', projectId: '', protocolVersionId: '' });
  const [enrolmentId, setEnrolmentId] = useState('');
  const [eligibility, setEligibility] = useState({ decision: 'Eligible' as 'Eligible' | 'Ineligible', reason: '' });
  const [confirmingWithdraw, setConfirmingWithdraw] = useState(false);
  const [listProjectId, setListProjectId] = useState('');
  const [enrolments, setEnrolments] = useState<EnrolmentItem[] | null>(null);
  const [announcement, setAnnouncement] = useState('');

  const loadEnrolments = async () => {
    try {
      const res = await staffApi.listEnrolments(session, listProjectId);
      setEnrolments(res.data.map((i) => i.attributes));
      setAnnouncement('入组列表已更新。');
    } catch (err) {
      setAnnouncement(err instanceof PlatformApiError ? `未能获取列表：${err.error.code}` : '网络错误');
    }
  };

  const run = async (fn: () => Promise<unknown>, done: string) => {
    try {
      await fn();
      setAnnouncement(done);
    } catch (err) {
      setAnnouncement(err instanceof PlatformApiError ? `未成功：${err.error.code}` : '网络错误，未提交');
    }
  };

  return (
    <section aria-labelledby="coord-heading">
      <h2 id="coord-heading">入组协调</h2>

      <section aria-labelledby="invite-heading">
        <h3 id="invite-heading">邀请参与者</h3>
        <p>邀请只能针对已批准/已激活的协议版本——草稿协议不能作为入组依据。</p>
        <p>
          <label htmlFor="inv-pat">参与者标识</label>{' '}
          <input id="inv-pat" value={invite.participantId} onChange={(e) => setInvite({ ...invite, participantId: e.target.value })} />
        </p>
        <p>
          <label htmlFor="inv-proj">项目标识</label>{' '}
          <input id="inv-proj" value={invite.projectId} onChange={(e) => setInvite({ ...invite, projectId: e.target.value })} />
        </p>
        <p>
          <label htmlFor="inv-pv">协议版本标识</label>{' '}
          <input id="inv-pv" value={invite.protocolVersionId} onChange={(e) => setInvite({ ...invite, protocolVersionId: e.target.value })} />
        </p>
        <p>
          <button
            disabled={invite.participantId === '' || invite.projectId === '' || invite.protocolVersionId === ''}
            onClick={() =>
              void run(async () => {
                const res = await staffApi.invite(session, invite.participantId, invite.projectId, invite.protocolVersionId);
                setEnrolmentId(res.data.id);
              }, '邀请已创建。')
            }
          >
            创建邀请
          </button>
        </p>
      </section>

      <section aria-labelledby="list-heading">
        <h3 id="list-heading">入组列表</h3>
        <p>
          <label htmlFor="list-proj">按项目筛选（可留空）</label>{' '}
          <input id="list-proj" value={listProjectId} onChange={(e) => setListProjectId(e.target.value)} />{' '}
          <button onClick={() => void loadEnrolments()}>查看入组列表</button>
        </p>
        {enrolments !== null && (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {enrolments.length === 0 && <li>没有匹配的入组记录。</li>}
            {enrolments.map((e) => (
              <li key={e.enrolmentId}>
                {e.enrolmentId}（参与者 {e.participantId}，项目 {e.researchProjectId}，状态：{e.enrolmentState}）{' '}
                <button onClick={() => setEnrolmentId(e.enrolmentId)}>选择</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="chain-heading">
        <h3 id="chain-heading">入组流转</h3>
        <p>
          <label htmlFor="enr-id">入组标识</label>{' '}
          <input id="enr-id" value={enrolmentId} onChange={(e) => setEnrolmentId(e.target.value)} />
        </p>
        <p>
          {(
            [
              ['start-screening', '开始筛查'],
              ['start-consent', '开始同意流程'],
              ['enrol', '入组'],
              ['activate', '激活'],
            ] as const
          ).map(([step, label]) => (
            <span key={step}>
              <button
                disabled={enrolmentId === ''}
                onClick={() => void run(() => staffApi.enrolmentStep(session, enrolmentId, step), `已执行：${label}`)}
              >
                {label}
              </button>{' '}
            </span>
          ))}
        </p>

        <h4>资格决定（人工职责）</h4>
        <p>资格由你决定并署名——不是系统打分。理由必填。</p>
        <p>
          <select
            aria-label="资格决定"
            value={eligibility.decision}
            onChange={(e) => setEligibility({ ...eligibility, decision: e.target.value as 'Eligible' | 'Ineligible' })}
          >
            <option value="Eligible">符合条件</option>
            <option value="Ineligible">不符合条件</option>
          </select>{' '}
          <input
            aria-label="资格决定理由"
            placeholder="理由（必填）"
            value={eligibility.reason}
            onChange={(e) => setEligibility({ ...eligibility, reason: e.target.value })}
          />{' '}
          <button
            disabled={enrolmentId === '' || eligibility.reason === ''}
            onClick={() =>
              void run(
                () => staffApi.eligibilityDecision(session, enrolmentId, eligibility.decision, eligibility.reason),
                '资格决定已记录（署名为你）。',
              )
            }
          >
            记录资格决定
          </button>
        </p>

        <h4>退出</h4>
        <p>
          <button disabled={enrolmentId === ''} onClick={() => setConfirmingWithdraw(true)}>
            为该参与者办理退出
          </button>
        </p>
        {confirmingWithdraw && (
          <div role="alertdialog" aria-labelledby="wd-confirm">
            <p id="wd-confirm">
              确认办理退出？退出会停止后续数据收集并触发传播；已锁定的研究数据集不会被改写。
            </p>
            <button
              onClick={() => {
                setConfirmingWithdraw(false);
                void run(() => staffApi.withdrawEnrolment(session, enrolmentId, 'participant-request'), '退出已记录并开始传播。');
              }}
            >
              确认退出
            </button>{' '}
            <button onClick={() => setConfirmingWithdraw(false)}>返回</button>
          </div>
        )}
      </section>

      <p aria-live="polite" role="status">
        {announcement}
      </p>
    </section>
  );
}
