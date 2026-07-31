import { useState } from 'react';
import { PlatformApiError } from '../api.js';
import { staffApi, type StaffSession } from '../staff-api.js';

/**
 * Researcher workspace (M04/M14 slice): project + protocol drafting and
 * controlled export requests. There is deliberately NO identifiable
 * option for research exports — the platform cannot produce one.
 */
export function StaffResearcherPanel({ session }: { session: StaffSession }) {
  const [project, setProject] = useState({ organisationId: '', title: '' });
  const [draft, setDraft] = useState({ projectId: '', title: '' });
  const [submitVersionId, setSubmitVersionId] = useState('');
  const [exportForm, setExportForm] = useState({
    purpose: '',
    recipient: '',
    sources: '',
    deIdentification: 'Pseudonymised' as 'Pseudonymised' | 'Anonymised',
  });
  const [announcement, setAnnouncement] = useState('');

  const run = async (fn: () => Promise<{ data: { id: string } }>, done: (id: string) => string) => {
    try {
      const res = await fn();
      setAnnouncement(done(res.data.id));
    } catch (err) {
      setAnnouncement(err instanceof PlatformApiError ? `未成功：${err.error.code}` : '网络错误，未提交');
    }
  };

  return (
    <section aria-labelledby="researcher-heading">
      <h2 id="researcher-heading">研究者工作台</h2>

      <h3>创建研究项目</h3>
      <p>
        <label htmlFor="rp-org">组织标识</label>{' '}
        <input id="rp-org" value={project.organisationId} onChange={(e) => setProject({ ...project, organisationId: e.target.value })} />{' '}
        <label htmlFor="rp-title">标题</label>{' '}
        <input id="rp-title" value={project.title} onChange={(e) => setProject({ ...project, title: e.target.value })} />{' '}
        <button
          disabled={project.organisationId === '' || project.title === ''}
          onClick={() => void run(() => staffApi.createProject(session, project.organisationId, project.title), (id) => `项目已创建：${id}`)}
        >
          创建项目
        </button>
      </p>

      <h3>起草并提交协议版本</h3>
      <p>提交会记录你为提交人——之后你将不能批准这个版本（职责分离）。</p>
      <p>
        <label htmlFor="pv-proj">项目标识</label>{' '}
        <input id="pv-proj" value={draft.projectId} onChange={(e) => setDraft({ ...draft, projectId: e.target.value })} />{' '}
        <label htmlFor="pv-title">版本标题</label>{' '}
        <input id="pv-title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />{' '}
        <button
          disabled={draft.projectId === '' || draft.title === ''}
          onClick={() =>
            void run(
              () => staffApi.draftProtocolVersion(session, draft.projectId, draft.title, { title: draft.title }),
              (id) => `协议版本草稿已创建：${id}`,
            )
          }
        >
          起草协议版本
        </button>
      </p>
      <p>
        <label htmlFor="pv-submit">要提交的版本标识</label>{' '}
        <input id="pv-submit" value={submitVersionId} onChange={(e) => setSubmitVersionId(e.target.value)} />{' '}
        <button
          disabled={submitVersionId === ''}
          onClick={() => void run(() => staffApi.submitProtocolVersion(session, submitVersionId), (id) => `已提交评审：${id}`)}
        >
          提交评审
        </button>
      </p>

      <h3>申请受控导出</h3>
      <p>导出必须写明目的、接收方与精确来源；研究导出没有「可识别」选项——平台不会生成可识别的研究导出。</p>
      <p>
        <label htmlFor="ex-purpose">目的</label>{' '}
        <input id="ex-purpose" value={exportForm.purpose} onChange={(e) => setExportForm({ ...exportForm, purpose: e.target.value })} />
      </p>
      <p>
        <label htmlFor="ex-recipient">接收方</label>{' '}
        <input id="ex-recipient" value={exportForm.recipient} onChange={(e) => setExportForm({ ...exportForm, recipient: e.target.value })} />
      </p>
      <p>
        <label htmlFor="ex-sources">来源（逗号分隔的精确标识）</label>{' '}
        <input id="ex-sources" value={exportForm.sources} onChange={(e) => setExportForm({ ...exportForm, sources: e.target.value })} />
      </p>
      <p>
        <label htmlFor="ex-deid">去标识级别</label>{' '}
        <select
          id="ex-deid"
          value={exportForm.deIdentification}
          onChange={(e) => setExportForm({ ...exportForm, deIdentification: e.target.value as 'Pseudonymised' | 'Anonymised' })}
        >
          <option value="Pseudonymised">假名化</option>
          <option value="Anonymised">匿名化</option>
        </select>{' '}
        <button
          disabled={exportForm.purpose === '' || exportForm.recipient === '' || exportForm.sources === ''}
          onClick={() =>
            void run(
              () =>
                staffApi.requestExport(
                  session,
                  exportForm.purpose,
                  exportForm.recipient,
                  exportForm.sources.split(/[,，]/).map((s) => s.trim()).filter((s) => s !== ''),
                  exportForm.deIdentification,
                ),
              (id) => `导出申请已创建（待批准）：${id}`,
            )
          }
        >
          提交导出申请
        </button>
      </p>

      <p aria-live="polite" role="status">
        {announcement}
      </p>
    </section>
  );
}
