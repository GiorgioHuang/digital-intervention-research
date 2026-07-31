import { useState } from 'react';
import type { StaffSession } from './staff-api.js';
import { StaffApproverPanel } from './components/StaffApproverPanel.js';
import { StaffCoordinatorPanel } from './components/StaffCoordinatorPanel.js';
import { StaffResearcherPanel } from './components/StaffResearcherPanel.js';
import { StaffModeratorPanel } from './components/StaffModeratorPanel.js';
import { StaffSafetyTriagePanel } from './components/StaffSafetyTriagePanel.js';

type StaffScreen = 'coordinator' | 'researcher' | 'approver' | 'safety' | 'moderation';
const SCREENS: { key: StaffScreen; label: string }[] = [
  { key: 'coordinator', label: '入组协调' },
  { key: 'researcher', label: '研究者' },
  { key: 'approver', label: '批准' },
  { key: 'safety', label: '安全 triage' },
  { key: 'moderation', label: '内容审核' },
];

/**
 * Staff workspace shell. The workspace picker is navigation, not
 * authority: every command is judged server-side by the permission
 * engine, so opening a panel grants nothing. Auth strength is chosen at
 * the dev login stub to mirror the X-Auth-Strength header (OIDC pending
 * ADR-104); MFA-tier actions are labelled in each panel.
 */
export function StaffApp({ onExit }: { onExit: () => void }) {
  const [session, setSession] = useState<StaffSession | null>(null);
  const [screen, setScreen] = useState<StaffScreen>('coordinator');
  const [form, setForm] = useState({ actorId: '', authStrength: 'password' as 'password' | 'mfa' });

  if (session === null) {
    return (
      <main>
        <h1>员工工作区（开发环境）</h1>
        <p>开发登录桩：输入账户标识并选择认证强度。工作区入口不是权限——每个操作都由服务端权限引擎裁决。</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (form.actorId !== '') setSession({ actorId: form.actorId, authStrength: form.authStrength });
          }}
        >
          <p>
            <label htmlFor="staff-actor">账户标识（actor id）</label>{' '}
            <input id="staff-actor" value={form.actorId} onChange={(e) => setForm({ ...form, actorId: e.target.value })} />
          </p>
          <p>
            <label htmlFor="staff-strength">认证强度</label>{' '}
            <select
              id="staff-strength"
              value={form.authStrength}
              onChange={(e) => setForm({ ...form, authStrength: e.target.value as 'password' | 'mfa' })}
            >
              <option value="password">密码（MFA 级操作会被拒绝）</option>
              <option value="mfa">MFA</option>
            </select>
          </p>
          <button type="submit">进入</button> <button type="button" onClick={onExit}>返回参与者入口</button>
        </form>
      </main>
    );
  }

  return (
    <div>
      <a className="skip-link" href="#staff-main">
        跳到主要内容
      </a>
      <nav aria-label="员工导航">
        <ul>
          {SCREENS.map((s) => (
            <li key={s.key}>
              <button aria-current={screen === s.key ? 'page' : undefined} onClick={() => setScreen(s.key)}>
                {s.label}
              </button>
            </li>
          ))}
          <li>
            <button onClick={onExit}>退出员工工作区</button>
          </li>
        </ul>
      </nav>
      <main id="staff-main">
        <p>
          当前身份：{session.actorId}（{session.authStrength === 'mfa' ? 'MFA' : '密码'}级认证）
        </p>
        {screen === 'coordinator' && <StaffCoordinatorPanel session={session} />}
        {screen === 'researcher' && <StaffResearcherPanel session={session} />}
        {screen === 'approver' && <StaffApproverPanel session={session} />}
        {screen === 'safety' && <StaffSafetyTriagePanel session={session} />}
        {screen === 'moderation' && <StaffModeratorPanel session={session} />}
      </main>
    </div>
  );
}
