import { useEffect, useState } from 'react';
import type { StaffSession } from './staff-api.js';
import { beginSignIn, completeRedirect, currentSession, detectAuthMode, signOut, type AuthMode } from './auth.js';
import { staffApi, type OrganisationItem } from './staff-api.js';
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
/**
 * The one organisation to open without asking — if there is one.
 *
 * A choice of one is not a choice, so it used to skip the chooser whenever
 * exactly one organisation came back. That was wrong for the case it most
 * needed to be right for: a platform administrator sees every organisation
 * by platform-wide standing, which is precisely the state of holding NO
 * role inside one. With a single organisation they were dropped straight
 * into a workspace where every screen refuses — and the control that fixes
 * it lives on the chooser they had just been skipped past. The one person
 * who needed that screen was the one person who never saw it.
 *
 * So skipping requires standing INSIDE the organisation, not merely being
 * able to see it.
 */
function soleUsableOrganisation(items: OrganisationItem[]): OrganisationItem | undefined {
  const usable = items.filter((o) => o.standing !== 'platform-administrator');
  return usable.length === 1 ? usable[0] : undefined;
}

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
  /**
   * The organisations this person may act in, asked of the server. Staff
   * used to type an identifier into a box, which meant finding it with a
   * SQL query first — a value the server has always known and nobody
   * should ever have had to look up.
   */
  const [organisations, setOrganisations] = useState<OrganisationItem[] | null>(null);
  const [newOrganisation, setNewOrganisation] = useState('');

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
      const signedIn = {
        actorId: found.actorId,
        authStrength: found.authStrength,
        // Chosen below from what the server says this person may act in,
        // and still re-evaluated by the server on every request rather
        // than taken as a grant (Doc 14).
        organisationId: '',
      };
      setSession(signedIn);
      // One organisation is not a choice, so it is not presented as one.
      try {
        const orgs = await staffApi.listOrganisations(signedIn);
        if (cancelled) return;
        const items = orgs.data.map((o) => o.attributes);
        setOrganisations(items);
        const only = soleUsableOrganisation(items);
        if (only !== undefined) setSession({ ...signedIn, organisationId: only.organisationId });
      } catch {
        setOrganisations([]);
      }
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

  /*
   * Which organisation this person is acting in. Asked once, here, rather
   * than typed into the sign-in screen — and skipped entirely when there
   * is only one, because a choice of one is not a choice.
   *
   * Almost everything staff-side is scoped by organisation and refuses
   * without one (ORGANISATION_CONTEXT_REQUIRED), so entering the workspace
   * without having chosen would be entering a workspace where every panel
   * says the same unhelpful thing.
   */
  if (authMode === 'google' && session.organisationId === '') {
    return (
      <main>
        <h1>Choose an organisation</h1>
        {organisations === null && <p>One moment…</p>}
        {organisations !== null && organisations.length === 0 && (
          <>
            <p>
              You are signed in, but you are not in any organisation yet. Staff work is scoped to one, so there is
              nothing to open until you belong to one or create one.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (newOrganisation.trim() === '') return;
                void staffApi
                  .createOrganisation(session, newOrganisation.trim())
                  .then(async () => {
                    setNewOrganisation('');
                    const orgs = await staffApi.listOrganisations(session);
                    const items = orgs.data.map((o) => o.attributes);
                    setOrganisations(items);
                    const only = soleUsableOrganisation(items);
                    if (only !== undefined) setSession({ ...session, organisationId: only.organisationId });
                  })
                  .catch((err: unknown) =>
                    setSignInProblem(
                      err instanceof Error ? err.message : 'That organisation could not be created.',
                    ),
                  );
              }}
            >
              <p>
                <label htmlFor="new-organisation">Name a new organisation</label>{' '}
                <input
                  id="new-organisation"
                  value={newOrganisation}
                  onChange={(e) => setNewOrganisation(e.target.value)}
                />
              </p>
              {/* Only a platform administrator may; anybody else gets a
                  refusal from the server, which is the honest place for it
                  to come from. */}
              <button type="submit">Create it</button>
            </form>
          </>
        )}
        {(organisations ?? []).length > 0 && (
          <ul>
            {(organisations ?? []).map((o) => (
              <li key={o.organisationId}>
                <button onClick={() => setSession({ ...session, organisationId: o.organisationId })}>
                  {o.name}
                </button>
                {/*
                  Listed by platform-wide standing means holding no role
                  IN it — and a platform administrator's role is narrow by
                  design (administration only): it carries role.assign but
                  not user.view, so opening that organisation would refuse
                  every screen including the one that hands out roles.
                  Organisations created from now on give their creator this
                  automatically; this is for the ones that already exist.
                */}
                {o.standing === 'platform-administrator' && (
                  <>
                    {' '}
                    <button
                      onClick={() => {
                        void staffApi
                          .assignRole(
                            { ...session, organisationId: o.organisationId },
                            session.actorId,
                            'OrganisationAdministrator',
                          )
                          .then(async () => {
                            const orgs = await staffApi.listOrganisations(session);
                            setOrganisations(orgs.data.map((x) => x.attributes));
                            setSession({ ...session, organisationId: o.organisationId });
                          })
                          .catch((err: unknown) =>
                            setSignInProblem(
                              err instanceof Error
                                ? err.message
                                : 'That role could not be given. Nothing changed.',
                            ),
                          );
                      }}
                    >
                      Make me its administrator
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
        {(organisations ?? []).some((o) => o.standing === 'platform-administrator') && (
          <p>
            <small>
              You can see these because you administer the platform, which is not the same as holding a role inside
              one. Opening an organisation you hold no role in will refuse every screen — give yourself the
              administrator role there first.
            </small>
          </p>
        )}
        {signInProblem !== '' && <p role="alert">{signInProblem}</p>}
        <p>
          <button
            type="button"
            onClick={() => {
              void signOut();
              setSession(null);
            }}
          >
            Sign out
          </button>
        </p>
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
            {/*
              The wording carried the rule and not the reason, and the
              first person to use it asked the obvious question: why, when
              I have only just signed in? Because signing in did not
              necessarily ask them anything — Google can and does hand back
              a token from a session opened hours ago without a prompt.
              That proves who holds the account, not who is sitting here.
              Saying so is the difference between a step that looks
              redundant and one that is understood.
            */}
            <small>
              Not needed yet — only before approving or releasing something. Signing in proves you hold this Google
              account; it does not ask Google to check you are here now, because it can hand back a session opened
              hours ago without prompting you. This asks it to. Lasts a few minutes.
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
