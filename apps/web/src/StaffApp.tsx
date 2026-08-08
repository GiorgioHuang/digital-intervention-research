import { useEffect, useState } from 'react';
import type { StaffSession } from './staff-api.js';
import { beginSignIn, completeRedirect, currentSession, detectAuthMode, signOut, type AuthMode } from './auth.js';
import { GoogleSignIn } from './components/GoogleSignIn.js';
import { AccessTokenGate } from './components/AccessTokenGate.js';
import { AuditAccess } from './components/AuditAccess.js';
import { StaffAdminPanel } from './components/StaffAdminPanel.js';
import { StaffApproverPanel } from './components/StaffApproverPanel.js';
import { StaffCoordinatorPanel } from './components/StaffCoordinatorPanel.js';
import { StaffGovernancePanel } from './components/StaffGovernancePanel.js';
import { StaffResearcherPanel } from './components/StaffResearcherPanel.js';
import { StaffModeratorPanel } from './components/StaffModeratorPanel.js';
import { StaffSafetyTriagePanel } from './components/StaffSafetyTriagePanel.js';

type StaffScreen = 'coordinator' | 'researcher' | 'approver' | 'safety' | 'moderation' | 'governance' | 'audit' | 'admin';
const SCREENS: { key: StaffScreen; label: string }[] = [
  { key: 'coordinator', label: 'Enrolment' },
  { key: 'researcher', label: 'Research' },
  { key: 'approver', label: 'Approvals' },
  { key: 'safety', label: 'Safety triage' },
  { key: 'moderation', label: 'Moderation' },
  { key: 'governance', label: 'Emergency access' },
  { key: 'audit', label: 'Audit' },
  { key: 'admin', label: 'Administration' },
];

/**
 * Staff workspace shell. The workspace picker is navigation, not
 * authority: every command is judged server-side by the permission
 * engine, so opening a panel grants nothing. Auth strength is chosen at
 * the dev login stub to mirror the X-Auth-Strength header (OIDC pending
 * ADR-104); MFA-tier actions are labelled in each panel.
 */
/**
 * `onExit` is absent when this address serves only the staff workspace:
 * there is no participant workspace here to go back to, and a control
 * that took somebody nowhere would be worse than none.
 */
export function StaffApp({ onExit }: { onExit?: (() => void) | undefined }) {
  const [session, setSession] = useState<StaffSession | null>(null);
  const [screen, setScreen] = useState<StaffScreen>('coordinator');
  const [form, setForm] = useState({
    actorId: '',
    organisationId: '',
    authStrength: 'password' as 'password' | 'mfa',
  });
  const [authMode, setAuthMode] = useState<AuthMode | undefined>(undefined);
  const [signInProblem, setSignInProblem] = useState('');

  /** See App.tsx: one pass, because it is one question. */
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const detected = await detectAuthMode();
      if (cancelled) return;
      setAuthMode(detected);
      if (detected !== 'google') return;
      const redirect = await completeRedirect();
      if (cancelled) return;
      if (redirect?.error !== undefined) setSignInProblem(redirect.error);
      const found = redirect?.session ?? (await currentSession().catch(() => undefined));
      if (cancelled || found === undefined) return;
      setSession({
        actorId: found.actorId,
        authStrength: found.authStrength,
        // Staff act inside an organisation. It is not in the sign-in
        // token — membership is the platform's own record — so it stays
        // a field the person sets, and the server re-evaluates it on
        // every request rather than taking it as a grant (Doc 14).
        organisationId: '',
      });
      // A re-authentication that has just landed leaves the session at
      // step-up; nothing else to do but let the screen show it.
      if (redirect?.stepUpStrength !== undefined) {
        setSession((prev) =>
          prev === null ? prev : { ...prev, authStrength: 'step-up' },
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (session === null) {
    return (
      <main>
        <h1>Staff workspace (development environment)</h1>
        <p>
          {authMode === 'google'
            ? 'Opening a workspace is not permission — every action is judged by the server\u2019s permission engine.'
            : 'Development sign-in stub: enter an account identifier and choose the authentication strength. Opening a workspace is not permission — every action is judged by the server\u2019s permission engine.'}
        </p>
        {signInProblem !== '' && <p role="alert">{signInProblem}</p>}
        {authMode === undefined && <p>One moment…</p>}
        {authMode === 'google' && (
          <GoogleSignIn
            description="You will be taken to Google to sign in, then brought straight back here."
            onError={setSignInProblem}
          />
        )}
        {authMode === 'dev-header' && (
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
          <button type="submit">Continue</button>
        </form>
        )}
        {onExit !== undefined && (
          <button type="button" onClick={onExit}>
            Back to the participant sign-in
          </button>
        )}
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
          {onExit !== undefined && (
            <li>
              <button onClick={onExit}>Leave the staff workspace</button>
            </li>
          )}
        </ul>
      </nav>
      <main id="staff-main">
        <AccessTokenGate />
        <p>
          Signed in as {session.actorId} ({strengthLabel(session.authStrength)}){' '}
          {/*
            Staff on a dedicated staff address had no way out at all — the
            only exit was "back to the participant sign-in", which does not
            exist there and would not have ended the session if it did. A
            workstation in a shared office needs one.
          */}
          {authMode === 'google' && (
            <button
              type="button"
              onClick={() => {
                void signOut();
                setSession(null);
              }}
            >
              Sign out
            </button>
          )}
        </p>
        {/*
          Approving an intervention version and deciding an export need
          more than a sign-in from this morning. The button is here rather
          than only inside those screens because a person who has just
          been refused needs the way forward in front of them, not a
          message telling them a thing they cannot act on.
        */}
        {authMode === 'google' && session.authStrength !== 'step-up' && (
          <p>
            <button type="button" onClick={() => void beginSignIn('step-up')}>
              Confirm it is you
            </button>{' '}
            <small>
              Needed before approving or releasing anything. You will be asked to sign in to Google again.
            </small>
          </p>
        )}
        {screen === 'coordinator' && <StaffCoordinatorPanel session={session} />}
        {screen === 'researcher' && <StaffResearcherPanel session={session} />}
        {screen === 'approver' && <StaffApproverPanel session={session} />}
        {screen === 'safety' && <StaffSafetyTriagePanel session={session} />}
        {screen === 'moderation' && <StaffModeratorPanel session={session} />}
        {screen === 'governance' && <StaffGovernancePanel session={session} />}
        {screen === 'audit' && <AuditAccess session={session} />}
        {screen === 'admin' && <StaffAdminPanel session={session} />}
      </main>
    </div>
  );
}

/**
 * Named for what it establishes, not for the mechanism. 'step-up' is a
 * re-authentication that happened minutes ago; 'mfa' is an operator's
 * assertion about how a Google Workspace domain is administered. Calling
 * them both "strong" would hide the difference from the person relying
 * on it.
 */
function strengthLabel(strength: 'password' | 'mfa' | 'step-up'): string {
  if (strength === 'step-up') return 'confirmed just now';
  if (strength === 'mfa') return 'strong authentication';
  return 'password';
}
