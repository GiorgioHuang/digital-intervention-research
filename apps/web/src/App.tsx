import { useEffect, useRef, useState } from 'react';
import { StaffApp } from './StaffApp.js';
import { currentSurface } from './surface.js';
import { SupporterApp } from './SupporterApp.js';
import { AccessTokenGate } from './components/AccessTokenGate.js';
import { AssistedMode } from './components/AssistedMode.js';
import { CommunityPanel } from './components/CommunityPanel.js';
import { ConsentPanel } from './components/ConsentPanel.js';
import { DisplayPreferencesPanel } from './components/DisplayPreferencesPanel.js';
import { MatchingPanel } from './components/MatchingPanel.js';
import { MessagesScreen } from './components/MessagesScreen.js';
import { MyDataCopy } from './components/MyDataCopy.js';
import { MyLifeStory } from './components/MyLifeStory.js';
import { MyResearchPart } from './components/MyResearchPart.js';
import { WhoHasAccess } from './components/WhoHasAccess.js';
import { WaitingForYou } from './components/WaitingForYou.js';
import { SafetyPanel } from './components/SafetyPanel.js';
import { SessionGuard } from './components/SessionGuard.js';
import { SharedDeviceBar } from './components/SharedDeviceBar.js';
import { api, PlatformApiError, type Session } from './api.js';
import { completeRedirect, currentSession, detectAuthMode, signOut, type AuthMode } from './auth.js';
import { GoogleSignIn } from './components/GoogleSignIn.js';
import { endVisit, isSharedDevice, setSharedDevice } from './device-mode.js';
import { applyPreferences, loadPreferences } from './preferences.js';

/**
 * Task-oriented participant Home (Doc 20 §16): a short list of clear
 * actions — never a feed, never engagement-driven. Consent controls and
 * safety entries stay reachable from every screen via the persistent nav.
 *
 * Session comes from the dev-header stub for now (OIDC pending ADR-104):
 * the participant enters the identifiers issued during synthetic setup.
 */
type Screen =
  | 'home'
  | 'consent'
  | 'access'
  | 'message'
  | 'matching'
  | 'community'
  | 'life-story'
  | 'data-copy'
  | 'help';

/**
 * Four destinations, not five (design decision D-10). Measured at the
 * smallest supported width (320px, the 400%-zoom target in
 * DESIGN_SYSTEM §G): a slot is (320 - 18 outer padding - gaps) / n, and a
 * label rendered at --type-size-0 needs 53–77px. Five slots give 56.8px
 * each while "Community" needs 77px, so it either clips or wraps to
 * "Com/muni/ty" — both were visible in the 390px capture. Four slots give
 * 72px against a 67px worst case ("Messages", bold when current), so every
 * label stays one whole word at every supported width.
 *
 * Community is the slot that gives way because it is the one destination
 * the study explicitly treats as optional; Doc 20 §33 requires permanent
 * access to Consent and Help, not to Community. It stays one tap from
 * Home, which is itself always in the bar.
 */
const PRIMARY_DESTINATIONS: { key: Screen; label: string; fullLabel: string }[] = [
  { key: 'home', label: 'Home', fullLabel: 'Home' },
  { key: 'consent', label: 'Consent', fullLabel: 'My consent choices' },
  { key: 'message', label: 'Messages', fullLabel: 'Messages' },
  { key: 'help', label: 'Help', fullLabel: 'Help and safety' },
];

export function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [screen, setScreen] = useState<Screen>('home');
  const [form, setForm] = useState({ actorId: '', participantId: '' });
  const [signInProblem, setSignInProblem] = useState('');
  const [checking, setChecking] = useState(false);
  /*
   * Which surface this address serves. On a configured deployment the
   * address decides and there is nothing to switch: a participant is
   * never shown a door into somebody else's workspace. With no
   * configuration the app is one address with both doors, which is what
   * local development and the test suite run. See surface.ts for what
   * this separation is and — more importantly — what it is not.
   */
  const surface = currentSurface();
  const [mode, setMode] = useState<'participant' | 'staff' | 'supporter'>(
    surface === 'staff' ? 'staff' : 'participant',
  );
  /**
   * Who is sitting with the participant, if anyone (decision D-15). Held
   * here so the banner is on every screen rather than only where it was
   * switched on — assistance that is easy to forget about is the kind
   * that stops being disclosed.
   */
  const [helper, setHelper] = useState<string | null>(null);
  /**
   * Shared-device mode (DESIGN_SYSTEM §D.6). Never detected — a guess
   * about whether a tablet is communal is wrong often enough to matter and
   * impossible to explain to the person it is wrong about — so it is a
   * checkbox on the way in, and it shortens the idle limits, moves
   * preferences to storage that dies with the tab, and puts identity, a
   * screen cover and a way out on every screen.
   */
  const [shared, setShared] = useState(() => isSharedDevice());
  /**
   * Why the sign-in screen is being shown again. Someone who comes back to
   * a tablet after a cup of tea should be told the session ended on a
   * timer, not left to conclude they were thrown out for something they
   * did.
   */
  const [endedByTimeout, setEndedByTimeout] = useState(false);
  /**
   * How people sign in here, asked of the server (ADR-104). `undefined`
   * while the question is outstanding, and the screen says nothing in the
   * meantime rather than flashing up the wrong entrance and replacing it.
   */
  const [authMode, setAuthMode] = useState<AuthMode | undefined>(undefined);
  const navRef = useRef<HTMLElement | null>(null);

  /*
   * The stylesheet has carried `data-font-scale`, `data-density` and
   * `data-contrast` from the start and nothing ever set them, so four
   * text sizes and three density tiers were defined and unreachable.
   * Applied before anything renders, so a person who chose larger text
   * does not first get a screenful of the size they rejected.
   */
  useEffect(() => {
    applyPreferences(loadPreferences());
  }, []);

  /**
   * Sign-in, on the way in and on the way back from Google.
   *
   * Three things happen here in one pass because they are one question:
   * which entrance does this deployment have, is this page load the return
   * leg of a sign-in, and is there already a session. Asking them
   * separately would let the participant see a sign-in button for a moment
   * while already signed in.
   */
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
      // A staff account with no participant record is not a participant,
      // and giving it an empty participant identifier would send every
      // screen looking for a person who does not exist.
      if (found.participantId === undefined) {
        // Reached by somebody invited as a supporter rather than enrolled
        // as a participant — they have an account and a relationship, but
        // no participant record of their own, so there is no participant
        // workspace to show them. Naming both other entrances beats a dead
        // end that says only "no".
        setSignInProblem(
          'You are signed in, but this account does not have a participant workspace. If you were invited to support someone, use the supporter entrance; if you are staff, use the staff address.',
        );
        return;
      }
      setSession({ actorId: found.actorId, participantId: found.participantId });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * The bottom bar is fixed, so `main` has to reserve exactly as much space
   * as the bar actually occupies — otherwise the last confirm button on a
   * screen sits underneath it permanently. The height is not a constant:
   * at 200%/400% zoom the bar wraps to two rows. Measuring it is the only
   * honest way to keep the reservation correct.
   */
  useEffect(() => {
    const nav = navRef.current;
    if (nav === null || typeof ResizeObserver === 'undefined') return;
    const apply = () =>
      document.documentElement.style.setProperty('--nav-primary-height', `${nav.offsetHeight}px`);
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(nav);
    return () => observer.disconnect();
  }, [session, mode]);

  if (mode === 'staff') {
    return <StaffApp onExit={surface === 'staff' ? undefined : () => setMode('participant')} />;
  }
  if (mode === 'supporter') {
    return <SupporterApp onExit={() => setMode('participant')} />;
  }

  if (session === null) {
    return (
      <main>
        <h1>Healthy Ageing Research Platform (development environment)</h1>
        {/*
          Neutral on purpose (§E.11): it says the clock ran out and nothing
          about what was on the screen, because the reason this exists is
          that the person may not be the one reading it now.
        */}
        {endedByTimeout && (
          <p role="status">
            You were signed out automatically because nothing had been touched for a while. Nothing is wrong. Sign in
            again to carry on.
          </p>
        )}
        {authMode === 'dev-header' && (
          <p>
            Development sign-in stub: enter the identifiers issued for this synthetic environment. Both belong to the
            same person — the account identifier and the participant identifier are two names for one demo participant.
            Nothing here verifies who you are — this is not authentication (ADR-104).
          </p>
        )}
        {/*
          The two identifiers have to belong to the same person. Nothing
          used to check that, so an unpaired combination signed in happily
          and then every screen returned a protected-existence 404 saying
          only "the identifier may be incorrect" — with no way to tell
          which one, and no way back to this form. Checking once here turns
          a dead end into one sentence.
        */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.actorId || !form.participantId) return;
            const candidate = { actorId: form.actorId, participantId: form.participantId };
            setChecking(true);
            setSignInProblem('');
            setEndedByTimeout(false);
            void api
              .listMyConsents(candidate)
              .then(() => setSession(candidate))
              .catch((err: unknown) => {
                if (err instanceof PlatformApiError && err.status === 404) {
                  // Deliberately does not say which identifier is wrong:
                  // that would answer "does this participant exist" for
                  // anyone who asked (ADR-050).
                  setSignInProblem(
                    'These two identifiers do not work together. Either they belong to different people, or one of them is not right. Nothing was signed in.',
                  );
                  return;
                }
                if (err instanceof PlatformApiError && err.status === 401) {
                  setSignInProblem(
                    "This environment needs its access passphrase before anyone can sign in. Open the page again with the ?token=… link you were given.",
                  );
                  return;
                }
                // The check itself failed for some other reason. Refusing
                // to sign in would punish the person for a problem that
                // may have nothing to do with their identifiers.
                setSignInProblem('');
                setSession(candidate);
              })
              .finally(() => setChecking(false));
          }}
        >
          {authMode === 'dev-header' && (
            <>
              <p>
                <label htmlFor="actor-id">Account identifier (actor id)</label>{' '}
                <input
                  id="actor-id"
                  value={form.actorId}
                  onChange={(e) => setForm({ ...form, actorId: e.target.value })}
                />
              </p>
              <p>
                <label htmlFor="participant-id">Participant identifier</label>{' '}
                <input
                  id="participant-id"
                  value={form.participantId}
                  onChange={(e) => setForm({ ...form, participantId: e.target.value })}
                />
              </p>
            </>
          )}
          {/*
            §D.6: switched on by hand, never detected. The consequences are
            listed because "shared device" on its own does not tell anyone
            what changes, and the one that costs them something — losing
            their text size at the end of the visit — is the one they most
            deserve to know before they tick it.
          */}
          <p>
            <input
              id="shared-device"
              type="checkbox"
              checked={shared}
              onChange={(e) => {
                setShared(e.target.checked);
                setSharedDevice(e.target.checked);
              }}
            />{' '}
            <label htmlFor="shared-device">This is a shared device</label>
          </p>
          <p>
            <small>
              Tick this if other people use this tablet or computer — at a community centre, for example. The screen
              then signs itself out after five minutes rather than twenty, shows a way to cover the screen and sign
              out on every page, and keeps nothing on the device after you close the browser, including your text
              size.
            </small>
          </p>
          {signInProblem !== '' && <p role="alert">{signInProblem}</p>}
          {/*
            Nothing is offered until the server has said which entrance
            this deployment has. Drawing one and swapping it a moment
            later would put a button under a person's finger and then
            move it.
          */}
          {authMode === undefined && <p>One moment…</p>}
          {authMode === 'google' && <GoogleSignIn registers onError={setSignInProblem} />}
          {authMode === 'dev-header' && (
            <>
              <button type="submit" disabled={checking}>
                {checking ? 'Checking…' : 'Continue'}
              </button>{' '}
            </>
          )}
          {/*
            Only where one address serves everything. Where the surfaces
            have their own addresses, a participant is never offered a
            way into somebody else's workspace.
          */}
          {surface === 'single-host' && (
            <>
              <button type="button" onClick={() => setMode('supporter')}>
                Supporter workspace
              </button>{' '}
              <button type="button" onClick={() => setMode('staff')}>
                Staff workspace
              </button>
            </>
          )}
        </form>
      </main>
    );
  }

  return (
    <div>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      {shared && (
        <SharedDeviceBar
          identity={session.participantId}
          onSwitchUser={() => {
            // "Switch user" has to mean nothing of this visit is left, not
            // just that the screen changed (§D.6). On a shared tablet at a
            // community centre that includes the session on the SERVER:
            // clearing it only in this tab would leave the next person one
            // back button away from the last person's account.
            endVisit();
            void signOut();
            setSession(null);
            setScreen('home');
            setEndedByTimeout(false);
          }}
        />
      )}
      {/*
        Bottom bar on phones (design decision D-3), four destinations only
        (D-10 — see the width arithmetic above). Doc 20 §33 requires
        persistent access to Consent and Help, so those keep permanent
        slots; matching and community are opt-in and low-frequency, reached
        from the Home task list instead of holding a slot forever. Short
        visible labels with the fuller name as the accessible name — the
        visible text stays contained in it (WCAG 2.5.3 Label in Name).
      */}
      <nav aria-label="Primary" className="nav-primary" ref={navRef}>
        <ul>
          {PRIMARY_DESTINATIONS.map((d) => (
            <li key={d.key}>
              <button
                aria-current={screen === d.key ? 'page' : undefined}
                aria-label={d.fullLabel}
                onClick={() => setScreen(d.key)}
              >
                {d.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <main id="main-content">
        <SessionGuard
          shared={shared}
          onSignOut={() => {
            if (shared) endVisit();
            void signOut();
            setSession(null);
            setScreen('home');
            setEndedByTimeout(true);
          }}
        />
        <AccessTokenGate />
        <AssistedMode helper={helper} onChange={setHelper} />
        {screen === 'home' && (
          <section aria-labelledby="home-heading">
            <h1 id="home-heading">What would you like to do today?</h1>
            {/*
              The anti-feed statement, said rather than implied (design
              A1.5). This page ends. Nothing on it refreshes to keep
              somebody here, and a participant who has done the things
              that are their turn is finished for the day.
            */}
            <p>
              Anything that needs a decision from you is below. When those are done, they are done — nothing here
              keeps going on its own.
            </p>
            {/*
              Where the participant stands, and the way out, before the
              task list. Leaving was already permitted by the server but
              unreachable from here, so in practice it meant asking staff.
            */}
            <MyResearchPart session={session} />
            <WaitingForYou session={session} />
            {/*
              Three groups, not one flat list (design A1.6). The list
              reached eight entries as each unreachable right was given a
              way in, and eight unlabelled buttons is a wall rather than a
              choice. The privacy group is a real cluster and not a tidy-up:
              consent says what may be done, access says by whom, and a copy
              is what you may take away — someone asking "who can see my
              things" is answered by those three together.
            */}
            <section aria-labelledby="home-privacy-heading">
              <h2 id="home-privacy-heading">Your information and who can see it</h2>
              <ul>
                <li>
                  <button onClick={() => setScreen('consent')}>Review or change my consent choices</button>
                </li>
                <li>
                  <button onClick={() => setScreen('access')}>See who has access to me</button>
                </li>
                <li>
                  <button onClick={() => setScreen('data-copy')}>Ask for a copy of my information</button>
                </li>
              </ul>
            </section>
            <section aria-labelledby="home-anytime-heading">
              <h2 id="home-anytime-heading">Things you can do any time</h2>
              <ul>
                <li>
                  <button onClick={() => setScreen('message')}>Write to someone you are connected with</button>
                </li>
                <li>
                  <button onClick={() => setScreen('life-story')}>Write or read my life story</button>
                </li>
                <li>
                  <button onClick={() => setScreen('matching')}>Meet new people (optional)</button>
                </li>
                <li>
                  <button onClick={() => setScreen('community')}>Visit the community (optional)</button>
                </li>
              </ul>
            </section>
            <section aria-labelledby="home-help-heading">
              <h2 id="home-help-heading">Help and safety</h2>
              <ul>
                <li>
                  <button onClick={() => setScreen('help')}>Get help or report a problem</button>
                </li>
              </ul>
            </section>
          </section>
        )}
        {screen === 'consent' && <ConsentPanel session={session} assistedBy={helper} />}
        {screen === 'access' && <WhoHasAccess session={session} />}
        {screen === 'message' && (
          <MessagesScreen session={session} onGetHelp={() => setScreen('help')} assistedBy={helper} />
        )}
        {screen === 'life-story' && <MyLifeStory session={session} />}
        {screen === 'data-copy' && <MyDataCopy session={session} />}
        {screen === 'matching' && <MatchingPanel session={session} />}
        {screen === 'community' && <CommunityPanel session={session} />}
        {screen === 'help' && (
          <section aria-labelledby="help-heading">
            <h1 id="help-heading">Help and safety</h1>
            <p>
              You can contact the research team at any time, or report anything that made you uncomfortable.
              Reports are read by staff — no automated system decides them on its own.
            </p>
            <p>
              If you or someone else is in immediate danger, call your local emergency number. This platform is
              not an emergency service.
            </p>
            <SafetyPanel session={session} />
            <DisplayPreferencesPanel />
            {/*
              The only way out of a session was to reload the page. Someone
              signed in with identifiers that no longer work — after a demo
              environment is reseeded, for instance — met a 404 on every
              screen and no control that would let them try different ones.
            */}
            <section aria-labelledby="signout-heading">
              <h2 id="signout-heading">Signing in as someone else</h2>
              <p>
                This development environment identifies you by the identifiers you typed in. If they stop working —
                after this demo environment is set up again, for example — nothing here is broken; the identifiers
                have changed.
              </p>
              <p>
                <button
                  onClick={() => {
                    if (shared) endVisit();
                    void signOut();
                    setSession(null);
                    setScreen('home');
                  }}
                >
                  Sign out and enter different identifiers
                </button>
              </p>
            </section>
          </section>
        )}
      </main>
    </div>
  );
}
