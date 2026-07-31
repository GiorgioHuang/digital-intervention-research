import { useState } from 'react';
import { ConsentPanel } from './components/ConsentPanel.js';
import { MatchingPanel } from './components/MatchingPanel.js';
import { MessagePanel } from './components/MessagePanel.js';
import { SafetyPanel } from './components/SafetyPanel.js';
import type { Session } from './api.js';

/**
 * Task-oriented participant Home (Doc 20 §16): a short list of clear
 * actions — never a feed, never engagement-driven. Consent controls and
 * safety entries stay reachable from every screen via the persistent nav.
 *
 * Session comes from the dev-header stub for now (OIDC pending ADR-104):
 * the participant enters the identifiers issued during synthetic setup.
 */
type Screen = 'home' | 'consent' | 'message' | 'matching' | 'help';

export function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [screen, setScreen] = useState<Screen>('home');
  const [form, setForm] = useState({ actorId: '', participantId: '', threadId: '', recipientId: '', recipientName: '' });

  if (session === null) {
    return (
      <main>
        <h1>健康老龄化研究平台（开发环境）</h1>
        <p>开发登录桩：输入合成环境分配的标识。此登录方式仅用于开发，正式身份认证待批准（ADR-104）。</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (form.actorId && form.participantId) {
              setSession({ actorId: form.actorId, participantId: form.participantId });
            }
          }}
        >
          <p>
            <label htmlFor="actor-id">账户标识（actor id）</label>{' '}
            <input id="actor-id" value={form.actorId} onChange={(e) => setForm({ ...form, actorId: e.target.value })} />
          </p>
          <p>
            <label htmlFor="participant-id">参与者标识（participant id）</label>{' '}
            <input
              id="participant-id"
              value={form.participantId}
              onChange={(e) => setForm({ ...form, participantId: e.target.value })}
            />
          </p>
          <button type="submit">进入</button>
        </form>
      </main>
    );
  }

  return (
    <div>
      <a className="skip-link" href="#main-content">
        跳到主要内容
      </a>
      <nav aria-label="主导航">
        <ul>
          <li>
            <button aria-current={screen === 'home' ? 'page' : undefined} onClick={() => setScreen('home')}>
              首页
            </button>
          </li>
          <li>
            <button aria-current={screen === 'consent' ? 'page' : undefined} onClick={() => setScreen('consent')}>
              我的同意选择
            </button>
          </li>
          <li>
            <button aria-current={screen === 'message' ? 'page' : undefined} onClick={() => setScreen('message')}>
              消息
            </button>
          </li>
          <li>
            <button aria-current={screen === 'matching' ? 'page' : undefined} onClick={() => setScreen('matching')}>
              认识新朋友
            </button>
          </li>
          <li>
            <button aria-current={screen === 'help' ? 'page' : undefined} onClick={() => setScreen('help')}>
              帮助与安全
            </button>
          </li>
        </ul>
      </nav>
      <main id="main-content">
        {screen === 'home' && (
          <section aria-labelledby="home-heading">
            <h1 id="home-heading">今天想做什么？</h1>
            {/* Task list, not a feed: each entry is one clear action. */}
            <ul>
              <li>
                <button onClick={() => setScreen('consent')}>查看或更改我的同意选择</button>
              </li>
              <li>
                <button onClick={() => setScreen('message')}>给已建立联系的人写消息</button>
              </li>
              <li>
                <button onClick={() => setScreen('matching')}>认识新朋友（可选）</button>
              </li>
              <li>
                <button onClick={() => setScreen('help')}>获取帮助或报告问题</button>
              </li>
            </ul>
          </section>
        )}
        {screen === 'consent' && <ConsentPanel session={session} />}
        {screen === 'message' && (
          <section>
            <h1>消息</h1>
            <p>输入会话与收件人标识（开发环境；正式版本从连接列表进入）。</p>
            <p>
              <label htmlFor="thread-id">会话标识</label>{' '}
              <input id="thread-id" value={form.threadId} onChange={(e) => setForm({ ...form, threadId: e.target.value })} />
            </p>
            <p>
              <label htmlFor="recipient-id">收件人参与者标识</label>{' '}
              <input
                id="recipient-id"
                value={form.recipientId}
                onChange={(e) => setForm({ ...form, recipientId: e.target.value })}
              />
            </p>
            <p>
              <label htmlFor="recipient-name">收件人称呼</label>{' '}
              <input
                id="recipient-name"
                value={form.recipientName}
                onChange={(e) => setForm({ ...form, recipientName: e.target.value })}
              />
            </p>
            {form.threadId && form.recipientId && (
              <MessagePanel
                session={session}
                threadId={form.threadId}
                recipient={{ participantId: form.recipientId, displayName: form.recipientName || form.recipientId }}
              />
            )}
          </section>
        )}
        {screen === 'matching' && <MatchingPanel session={session} />}
        {screen === 'help' && (
          <section aria-labelledby="help-heading">
            <h1 id="help-heading">帮助与安全</h1>
            <p>你可以随时联系研究团队，或报告让你不适的内容。报告会由工作人员查看——不会由自动系统单独决定。</p>
            <p>如果你或他人处于紧急危险中，请直接拨打当地紧急电话。本平台不是紧急求助渠道。</p>
            <SafetyPanel session={session} />
          </section>
        )}
      </main>
    </div>
  );
}
