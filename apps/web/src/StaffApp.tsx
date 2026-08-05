import { useState } from 'react';
import type { StaffSession } from './staff-api.js';
import { AccessTokenGate } from './components/AccessTokenGate.js';
import { StaffAdminPanel } from './components/StaffAdminPanel.js';
import { StaffApproverPanel } from './components/StaffApproverPanel.js';
import { StaffCoordinatorPanel } from './components/StaffCoordinatorPanel.js';
import { StaffGovernancePanel } from './components/StaffGovernancePanel.js';
import { StaffResearcherPanel } from './components/StaffResearcherPanel.js';
import { StaffModeratorPanel } from './components/StaffModeratorPanel.js';
import { StaffSafetyTriagePanel } from './components/StaffSafetyTriagePanel.js';

type StaffScreen = 'coordinator' | 'researcher' | 'approver' | 'safety' | 'moderation' | 'governance' | 'admin';
const SCREENS: { key: StaffScreen; label: string }[] = [
  { key: 'coordinator', label: 'Enrolment' },
  { key: 'researcher', label: 'Research' },
  { key: 'approver', label: 'Approvals' },
  { key: 'safety', label: 'Safety triage' },
  { key: 'moderation', label: 'Moderation' },
  { key: 'governance', label: 'Emergency access' },
  { key: 'admin', label: 'Administration' },
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
  const [form, setForm] = useState({
    actorId: '',
    organisationId: '',
    authStrength: 'password' as 'password' | 'mfa',
  });

  if (session === null) {
    return (
      <main>
        <h1>Staff workspace (development environment)</h1>
        <p>
          Development sign-in stub: enter an account identifier and choose the authentication strength. Opening a
          workspace is not permission — every action is judged by the server&apos;s permission engine.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (form.actorId !== '')
              setSession({
                actorId: form.actorId,
                authStrength: form.authStrength,
                organisationId: form.organisationId,
              });
          }}
        >
          <p>
            <label htmlFor="staff-actor">Account identifier (actor id)</label>{' '}
            <input id="staff-actor" value={form.actorId} onChange={(e) => setForm({ ...form, actorId: e.target.value })} />
          </p>
          <p>
            <label htmlFor="staff-org">Organisation identifier</label>{' '}
            <input
              id="staff-org"
              value={form.organisationId}
              onChange={(e) => setForm({ ...form, organisationId: e.target.value })}
            />
          </p>
          <p>
            <label htmlFor="staff-strength">Authentication strength</label>{' '}
            <select
              id="staff-strength"
              value={form.authStrength}
              onChange={(e) => setForm({ ...form, authStrength: e.target.value as 'password' | 'mfa' })}
            >
              <option value="password">Password (actions that need strong authentication will be refused)</option>
              <option value="mfa">Strong authentication</option>
            </select>
          </p>
          <button type="submit">Continue</button>{' '}
          <button type="button" onClick={onExit}>
            Back to the participant sign-in
          </button>
        </form>
      </main>
    );
  }

  return (
    <div>
      <a className="skip-link" href="#staff-main">
        Skip to main content
      </a>
      <nav aria-label="Staff navigation">
        <ul>
          {SCREENS.map((s) => (
            <li key={s.key}>
              <button aria-current={screen === s.key ? 'page' : undefined} onClick={() => setScreen(s.key)}>
                {s.label}
              </button>
            </li>
          ))}
          <li>
            <button onClick={onExit}>Leave the staff workspace</button>
          </li>
        </ul>
      </nav>
      <main id="staff-main">
        <AccessTokenGate />
        <p>
          Signed in as {session.actorId} ({session.authStrength === 'mfa' ? 'strong authentication' : 'password'})
        </p>
        {screen === 'coordinator' && <StaffCoordinatorPanel session={session} />}
        {screen === 'researcher' && <StaffResearcherPanel session={session} />}
        {screen === 'approver' && <StaffApproverPanel session={session} />}
        {screen === 'safety' && <StaffSafetyTriagePanel session={session} />}
        {screen === 'moderation' && <StaffModeratorPanel session={session} />}
        {screen === 'governance' && <StaffGovernancePanel session={session} />}
        {screen === 'admin' && <StaffAdminPanel session={session} />}
      </main>
    </div>
  );
}
