import { useState } from 'react';
import { PlatformApiError, type ApiError } from './api.js';

interface SupporterSession {
  actorId: string;
}

async function req<T>(session: SupporterSession, path: string, body?: object): Promise<T> {
  const res = await fetch(path, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { 'content-type': 'application/json', 'x-actor-id': session.actorId },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const json = (await res.json()) as T & { error?: ApiError };
  if (!res.ok) throw new PlatformApiError(json.error as ApiError, res.status);
  return json;
}

interface Contribution {
  contributionId: string;
  archiveId: string;
  contentText: string;
  contributionState: string;
}

const STATE_LABELS: Record<string, string> = {
  Proposed: '已提交，等待本人审阅',
  'In Review': '本人审阅中',
  Accepted: '已被接受（作为你的贡献记录，不是本人证言）',
  Rejected: '未被接受',
  Withdrawn: '已撤回',
  Superseded: '已被新版本取代',
};

/**
 * Supporter workspace (Doc 20): propose life-story contributions and
 * follow their honest states. A contribution needs the participant's
 * approved relationship AND their supporter-contribution consent; the
 * participant decides — acceptance records it as a SUPPORTER
 * contribution, never as the participant's own testimony (ADR-042).
 */
export function SupporterApp({ onExit }: { onExit: () => void }) {
  const [session, setSession] = useState<SupporterSession | null>(null);
  const [actorId, setActorId] = useState('');
  const [form, setForm] = useState({ archiveId: '', itemId: '', contentText: '' });
  const [mine, setMine] = useState<Contribution[] | null>(null);
  const [report, setReport] = useState({ actorId: '', description: '' });
  const [announcement, setAnnouncement] = useState('');

  const run = async (fn: () => Promise<unknown>, done: string) => {
    try {
      await fn();
      setAnnouncement(done);
    } catch (err) {
      setAnnouncement(
        err instanceof PlatformApiError
          ? err.status === 404
            ? '未能提交：需要参与者本人已批准你们的关系并同意「支持者贡献」。'
            : `未成功：${err.error.code}`
          : '网络错误，未提交',
      );
    }
  };

  if (session === null) {
    return (
      <main>
        <h1>支持者工作区（开发环境）</h1>
        <p>你可以为亲友的生命故事提出补充。是否采纳始终由本人决定；被采纳的内容会标注为你的贡献，不会变成本人的证言。</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (actorId !== '') setSession({ actorId });
          }}
        >
          <p>
            <label htmlFor="sup-actor">账户标识（actor id）</label>{' '}
            <input id="sup-actor" value={actorId} onChange={(e) => setActorId(e.target.value)} />
          </p>
          <button type="submit">进入</button> <button type="button" onClick={onExit}>返回</button>
        </form>
      </main>
    );
  }

  return (
    <main>
      <h1>支持者工作区</h1>
      <section aria-labelledby="contrib-heading">
        <h2 id="contrib-heading">提出生命故事贡献</h2>
        <p>提交需要对方已批准你们的关系，且本人同意了「支持者贡献」。内容先到达本人，由本人决定是否采纳。</p>
        <p>
          <label htmlFor="c-archive">档案标识</label>{' '}
          <input id="c-archive" value={form.archiveId} onChange={(e) => setForm({ ...form, archiveId: e.target.value })} />
        </p>
        <p>
          <label htmlFor="c-item">条目标识（可留空，留空为新条目建议）</label>{' '}
          <input id="c-item" value={form.itemId} onChange={(e) => setForm({ ...form, itemId: e.target.value })} />
        </p>
        <p>
          <label htmlFor="c-text">你想补充的内容</label>
        </p>
        <textarea id="c-text" rows={3} value={form.contentText} onChange={(e) => setForm({ ...form, contentText: e.target.value })} />
        <p>
          <button
            disabled={form.archiveId === '' || form.contentText === ''}
            onClick={() =>
              void run(
                () =>
                  req(session, `/v1/life-story/archives/${form.archiveId}/contributions`, {
                    ...(form.itemId === '' ? {} : { itemId: form.itemId }),
                    contentText: form.contentText,
                  }),
                '已提交，等待本人审阅。',
              )
            }
          >
            提交贡献
          </button>
        </p>
      </section>

      <section aria-labelledby="mine-heading">
        <h2 id="mine-heading">我的贡献</h2>
        <p>
          <button
            onClick={() =>
              void run(async () => {
                const res = await req<{ data: { attributes: Contribution }[] }>(session, '/v1/life-story/contributions/mine');
                setMine(res.data.map((c) => c.attributes));
              }, '已更新。')
            }
          >
            查看我的贡献
          </button>
        </p>
        {mine !== null && (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {mine.length === 0 && <li>还没有提交过贡献。</li>}
            {mine.map((c) => (
              <li key={c.contributionId} style={{ border: '1px solid currentColor', padding: '0.5rem', marginBlock: '0.5rem' }}>
                <p>{c.contentText}</p>
                <p>状态:{STATE_LABELS[c.contributionState] ?? c.contributionState}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="sup-report-heading">
        <h2 id="sup-report-heading">报告问题</h2>
        <p>报告由工作人员查看，不会由自动系统单独决定。</p>
        <p>
          <label htmlFor="r-actor">对方的标识</label>{' '}
          <input id="r-actor" value={report.actorId} onChange={(e) => setReport({ ...report, actorId: e.target.value })} />
        </p>
        <p>
          <label htmlFor="r-desc">发生了什么</label>
        </p>
        <textarea id="r-desc" rows={2} value={report.description} onChange={(e) => setReport({ ...report, description: e.target.value })} />
        <p>
          <button
            disabled={report.actorId === '' || report.description === ''}
            onClick={() =>
              void run(
                () =>
                  req(session, '/v1/reports', {
                    reporterId: session.actorId,
                    reportedActorId: report.actorId,
                    category: 'other',
                    description: report.description,
                  }),
                '报告已提交，工作人员会查看。',
              )
            }
          >
            提交报告
          </button>
        </p>
      </section>

      <p>
        <button onClick={onExit}>退出支持者工作区</button>
      </p>
      <p aria-live="polite" role="status">
        {announcement}
      </p>
    </main>
  );
}
