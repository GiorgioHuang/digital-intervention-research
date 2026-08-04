import { useEffect, useRef, useState } from 'react';
import { StaffApp } from './StaffApp.js';
import { SupporterApp } from './SupporterApp.js';
import { AccessTokenGate } from './components/AccessTokenGate.js';
import { CommunityPanel } from './components/CommunityPanel.js';
import { ConsentPanel } from './components/ConsentPanel.js';
import { MatchingPanel } from './components/MatchingPanel.js';
import { MessagesScreen } from './components/MessagesScreen.js';
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
type Screen = 'home' | 'consent' | 'message' | 'matching' | 'community' | 'help';

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
  const [mode, setMode] = useState<'participant' | 'staff' | 'supporter'>('participant');
  const navRef = useRef<HTMLElement | null>(null);

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
    return <StaffApp onExit={() => setMode('participant')} />;
  }
  if (mode === 'supporter') {
    return <SupporterApp onExit={() => setMode('participant')} />;
  }

  if (session === null) {
    return (
      <main>
        <h1>Healthy Ageing Research Platform (development environment)</h1>
        <p>
          Development sign-in stub: enter the identifiers issued for this synthetic environment. Nothing here
          verifies who you are — real authentication is the pending OIDC work (ADR-104).
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (form.actorId && form.participantId) {
              setSession({ actorId: form.actorId, participantId: form.participantId });
            }
          }}
        >
          <p>
            <label htmlFor="actor-id">Account identifier (actor id)</label>{' '}
            <input id="actor-id" value={form.actorId} onChange={(e) => setForm({ ...form, actorId: e.target.value })} />
          </p>
          <p>
            <label htmlFor="participant-id">Participant identifier</label>{' '}
            <input
              id="participant-id"
              value={form.participantId}
              onChange={(e) => setForm({ ...form, participantId: e.target.value })}
            />
          </p>
          <button type="submit">Continue</button>{' '}
          <button type="button" onClick={() => setMode('supporter')}>
            Supporter workspace
          </button>{' '}
          <button type="button" onClick={() => setMode('staff')}>
            Staff workspace
          </button>
        </form>
      </main>
    );
  }

  return (
    <div>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
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
        <AccessTokenGate />
        {screen === 'home' && (
          <section aria-labelledby="home-heading">
            <h1 id="home-heading">What would you like to do today?</h1>
            {/* Task list, not a feed: each entry is one clear action. */}
            <ul>
              <li>
                <button onClick={() => setScreen('consent')}>Review or change my consent choices</button>
              </li>
              <li>
                <button onClick={() => setScreen('message')}>Write to someone you are connected with</button>
              </li>
              <li>
                <button onClick={() => setScreen('matching')}>Meet new people (optional)</button>
              </li>
              <li>
                <button onClick={() => setScreen('community')}>Visit the community (optional)</button>
              </li>
              <li>
                <button onClick={() => setScreen('help')}>Get help or report a problem</button>
              </li>
            </ul>
          </section>
        )}
        {screen === 'consent' && <ConsentPanel session={session} />}
        {screen === 'message' && <MessagesScreen session={session} />}
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
          </section>
        )}
      </main>
    </div>
  );
}
