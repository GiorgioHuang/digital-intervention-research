import { useState } from 'react';
import { PlatformApiError } from '../api.js';
import { staffApi, type StaffSession } from '../staff-api.js';

type PendingAction =
  | { kind: 'protocol-approve'; id: string }
  | { kind: 'protocol-activate'; id: string }
  | { kind: 'dataset-lock'; id: string }
  | { kind: 'export-decide'; id: string; decision: 'Approved' | 'Rejected' }
  | { kind: 'approval-decide'; id: string; decision: 'Approved' | 'Rejected'; reason: string };

const ACTION_LABELS: Record<PendingAction['kind'], string> = {
  'protocol-approve': '批准协议版本（MFA）',
  'protocol-activate': '激活协议版本',
  'dataset-lock': '锁定数据集版本（MFA，锁定后不可变）',
  'export-decide': '导出决定（MFA）',
  'approval-decide': 'M15 审批决定（MFA）',
};

/**
 * Approver workspace (ADR-051): every decision is an explicit confirmed
 * step naming the exact artefact; MFA-tier actions are labelled so the
 * step-up is expected, not a surprise. You can never approve your own
 * submission — the server refuses it and this UI says so.
 */
export function StaffApproverPanel({ session }: { session: StaffSession }) {
  const [protocolVersionId, setProtocolVersionId] = useState('');
  const [datasetVersionId, setDatasetVersionId] = useState('');
  const [exportRequestId, setExportRequestId] = useState('');
  const [approval, setApproval] = useState({ id: '', reason: '' });
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [announcement, setAnnouncement] = useState('');

  const execute = async () => {
    if (pending === null) return;
    const action = pending;
    setPending(null);
    try {
      if (action.kind === 'protocol-approve') await staffApi.approveProtocolVersion(session, action.id);
      else if (action.kind === 'protocol-activate') await staffApi.activateProtocolVersion(session, action.id);
      else if (action.kind === 'dataset-lock') await staffApi.lockDatasetVersion(session, action.id);
      else if (action.kind === 'export-decide') await staffApi.decideExport(session, action.id, action.decision);
      else await staffApi.decideApproval(session, action.id, action.decision, action.reason);
      setAnnouncement(`已执行：${ACTION_LABELS[action.kind]}（${action.id}）`);
    } catch (err) {
      setAnnouncement(err instanceof PlatformApiError ? `未成功：${err.error.code}` : '网络错误，未提交');
    }
  };

  return (
    <section aria-labelledby="approver-heading">
      <h2 id="approver-heading">批准工作台</h2>
      <p>
        每个决定都署名并绑定精确的工件。你不能批准自己提交的内容——服务端会拒绝（职责分离）。
        {session.authStrength !== 'mfa' && ' 注意：标注 MFA 的操作在当前密码级别下会被拒绝。'}
      </p>

      <h3>协议版本</h3>
      <p>
        <label htmlFor="ap-pv">协议版本标识</label>{' '}
        <input id="ap-pv" value={protocolVersionId} onChange={(e) => setProtocolVersionId(e.target.value)} />{' '}
        <button disabled={protocolVersionId === ''} onClick={() => setPending({ kind: 'protocol-approve', id: protocolVersionId })}>
          批准（MFA）
        </button>{' '}
        <button disabled={protocolVersionId === ''} onClick={() => setPending({ kind: 'protocol-activate', id: protocolVersionId })}>
          激活
        </button>
      </p>

      <h3>数据集锁定</h3>
      <p>锁定是人工 MFA 权威；锁定后的版本不可变，分析只能针对锁定版本运行。</p>
      <p>
        <label htmlFor="ap-dv">数据集版本标识</label>{' '}
        <input id="ap-dv" value={datasetVersionId} onChange={(e) => setDatasetVersionId(e.target.value)} />{' '}
        <button disabled={datasetVersionId === ''} onClick={() => setPending({ kind: 'dataset-lock', id: datasetVersionId })}>
          锁定数据集版本（MFA）
        </button>
      </p>

      <h3>导出决定</h3>
      <p>
        <label htmlFor="ap-ex">导出申请标识</label>{' '}
        <input id="ap-ex" value={exportRequestId} onChange={(e) => setExportRequestId(e.target.value)} />{' '}
        <button
          disabled={exportRequestId === ''}
          onClick={() => setPending({ kind: 'export-decide', id: exportRequestId, decision: 'Approved' })}
        >
          批准导出（MFA）
        </button>{' '}
        <button
          disabled={exportRequestId === ''}
          onClick={() => setPending({ kind: 'export-decide', id: exportRequestId, decision: 'Rejected' })}
        >
          拒绝导出（MFA）
        </button>
      </p>

      <h3>M15 审批记录</h3>
      <p>
        <label htmlFor="ap-apr">审批记录标识</label>{' '}
        <input id="ap-apr" value={approval.id} onChange={(e) => setApproval({ ...approval, id: e.target.value })} />{' '}
        <input
          aria-label="审批理由"
          placeholder="理由（必填）"
          value={approval.reason}
          onChange={(e) => setApproval({ ...approval, reason: e.target.value })}
        />{' '}
        <button
          disabled={approval.id === '' || approval.reason === ''}
          onClick={() => setPending({ kind: 'approval-decide', id: approval.id, decision: 'Approved', reason: approval.reason })}
        >
          批准（MFA）
        </button>{' '}
        <button
          disabled={approval.id === '' || approval.reason === ''}
          onClick={() => setPending({ kind: 'approval-decide', id: approval.id, decision: 'Rejected', reason: approval.reason })}
        >
          拒绝（MFA）
        </button>
      </p>

      {pending !== null && (
        <div role="alertdialog" aria-labelledby="approve-confirm">
          <p id="approve-confirm">
            确认执行「{ACTION_LABELS[pending.kind]}」，对象：<strong>{pending.id}</strong>
            {'decision' in pending ? `，决定：${pending.decision === 'Approved' ? '批准' : '拒绝'}` : ''}？
            此决定将以你的身份署名并写入审计。
          </p>
          <button onClick={() => void execute()}>确认执行</button>{' '}
          <button onClick={() => setPending(null)}>返回</button>
        </div>
      )}

      <p aria-live="polite" role="status">
        {announcement}
      </p>
    </section>
  );
}
