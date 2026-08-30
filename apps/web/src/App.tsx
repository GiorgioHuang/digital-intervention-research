import { useEffect, useRef, useState } from 'react';
import { StaffApp } from './StaffApp.js';
import { currentSurface } from './surface.js';
import { SupporterApp } from './SupporterApp.js';
import { AccessTokenGate } from './components/AccessTokenGate.js';
import { HelperScreen } from './components/elder/HelperScreen.js';
import { Exercises, Tapping } from './components/elder/Exercises.js';
import { SiteFooter } from './components/elder/SiteFooter.js';
import { AccessibilityToolbar } from './components/elder/AccessibilityToolbar.js';
import { HelperBanner } from './components/elder/HelperBanner.js';
import { ReviewContribution } from './components/ReviewContribution.js';
import { RecentDecisions } from './components/RecentDecisions.js';
import { UnfinishedPhotograph } from './components/UnfinishedPhotograph.js';
import { CaptionPhotograph } from './components/CaptionPhotograph.js';
import { copyrightYear, greetingFor } from './greeting.js';
import type { UncaptionedPhotograph } from './api.js';
import { TabIcon } from './components/elder/TabIcon.js';
import { CommunityPanel } from './components/CommunityPanel.js';
import { ConsentPanel } from './components/ConsentPanel.js';
import { DisplayPreferencesPanel } from './components/DisplayPreferencesPanel.js';
import { MatchingPanel } from './components/MatchingPanel.js';
import { MessagesScreen } from './components/MessagesScreen.js';
import { MyDataCopy } from './components/MyDataCopy.js';
import { MyLifeStory } from './components/MyLifeStory.js';
import { MyResearchPart } from './components/MyResearchPart.js';
import { WhoHasAccess } from './components/WhoHasAccess.js';
import { InviteSomeone } from './components/InviteSomeone.js';
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
 * The session comes from whichever mode the environment is in, and this
 * component asks rather than assumes: `authMode === 'google'` renders Sign
 * in with Google (ADR-104, the deployed environment), `'dev-header'` renders
 * the synthetic-setup identifiers. This comment used to say the stub was
 * the only path and OIDC was pending — it stayed that way after both had
 * stopped being true, which is why it now describes the branch rather than
 * the moment.
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
  | 'review'
  | 'caption'
  | 'exercises'
  | 'tapping'
  | 'helper'
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
/*
 * Five, from the handoff's tab bar: Home · My story · Community · Messages
 * · Help. D-10 settled on four with width arithmetic, and this is the owner
 * ruling that supersedes it — so the arithmetic is redone rather than
 * assumed. Measured at 320px, the narrowest phone this has to serve, each
 * tab has 64px and the longest label ("Messages") sets the floor; see the
 * nav test.
 *
 * Consent leaves the bar and moves into Home's first chevron row, where the
 * handoff puts it ("Your information and who can see it"). Doc 20 §33 wants
 * permanent access to consent and help; help keeps its slot, and consent is
 * one tap from a Home that is itself always in the bar.
 */
const PRIMARY_DESTINATIONS: { key: Screen; label: string; fullLabel: string; icon: string }[] = [
  { key: 'home', label: 'Home', fullLabel: 'Home', icon: 'house' },
  { key: 'life-story', label: 'My story', fullLabel: 'My life story', icon: 'book-open' },
  { key: 'community', label: 'Community', fullLabel: 'Other people’s stories', icon: 'users' },
  { key: 'message', label: 'Messages', fullLabel: 'Messages', icon: 'mail' },
  { key: 'help', label: 'Help', fullLabel: 'Help and safety', icon: 'help-circle' },
];

export function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [screen, setScreen] = useState<Screen>('home');
  /*
   * Which waiting thing is open on the `review` screen. An id, not the
   * object: the screen reloads the list for itself, so it cannot show a
   * decision that has since been made somewhere else.
   */
  const [reviewing, setReviewing] = useState<string | null>(null);
  /*
   * What to call this person. Null until it is known, and null is also the
   * settled answer where there is no profile — so Home greets without a
   * name rather than flashing a nameless greeting and then adding one.
   */
  const [displayName, setDisplayName] = useState<string | null>(null);
  /** The photograph being captioned, carried to the `caption` screen. */
  const [captioning, setCaptioning] = useState<UncaptionedPhotograph | null>(null);
  /** Whether Home has an unfinished thing on it. Decides the second line. */
  const [hasUnfinished, setHasUnfinished] = useState(false);
  /** The design's toast: it persists until the next navigation. */
  const [toast, setToast] = useState('');
  /*
   * The reading controls, from the handoff's global chrome. They live here
   * rather than in the toolbar so that the content region carries them and
   * the toolbar itself does not shrink out of reach along with the text.
   * `zoom` is stepped through an updater so that rapid taps accumulate
   * instead of racing, which the handoff calls out specifically.
   */
  const [zoom, setZoom] = useState(1);
  const [highContrast, setHighContrast] = useState(false);
  const contentRef = useRef<HTMLDivElement | null>(null);
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
   * The name to greet with, fetched once a session exists.
   *
   * A failure is silent on purpose. This is the greeting, not the page —
   * if the name cannot be read, Home says "Good morning" and everything
   * else on the screen still works. Putting an error block above somebody's
   * unfinished photograph because a courtesy failed would be the wrong
   * order of importance.
   */
  useEffect(() => {
    if (session === null) {
      setDisplayName(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const res = await api.getMyProfile(session);
        if (!cancelled) setDisplayName(res.data?.attributes.displayName ?? null);
      } catch {
        if (!cancelled) setDisplayName(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session]);

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
      /*
       * `data-workspace="participant"` — which this screen did not carry.
       * Every Classical token, every face and the whole type scale hang off
       * that attribute, so the first screen anybody sees was the one screen
       * rendered in the platform's plain interface styles while the rest of
       * the app was the design. That is most of why it looked like a
       * different product from the artboards.
       */
      <div data-workspace="participant" className="welcome">
        <main>
          {/*
            The design's opening, in its order: who this is, then what it
            is for, then the way in. The kicker names the study before the
            headline promises anything, because somebody who opened this by
            mistake should be able to tell in one line.
          */}
          <p className="kicker">Canadian Elder Life Story Project</p>
          <h1>Your life, in your own words.</h1>
          <p className="welcome__lede">
            This is where you keep your own story. Nobody else can see it unless you say so, and nothing is added
            unless you accept it.
          </p>
          <hr />
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
            <p className="welcome__note">
              Development sign-in stub: enter the identifiers issued for this synthetic environment. Both belong to the
              same person — the account identifier and the participant identifier are two names for one demo
              participant. Nothing here verifies who you are — this is not authentication (ADR-104).
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
            An enclosure, not a paragraph. This was plain body text in the
            middle of a column of plain body text, which on the one screen
            somebody meets before they are signed in makes the sentence
            that explains why they cannot get in look like more of the
            prose explaining what the app is. `.state--danger` is the
            treatment every other refusal in this app already uses.
          */}
          {signInProblem !== '' && (
            <p role="alert" className="state state--danger">
              {signInProblem}
            </p>
          )}
          {/*
            Nothing is offered until the server has said which entrance
            this deployment has. Drawing one and swapping it a moment
            later would put a button under a person's finger and then
            move it.
          */}
          {authMode === undefined && <p>One moment…</p>}
          {authMode === 'google' && (
            <div className="welcome__way-in">
              <GoogleSignIn registers onError={setSignInProblem} />
            </div>
          )}
          {authMode === 'dev-header' && (
            <>
              {/*
                The one way forward on this screen, so it is the one filled
                button (Doc 20 §13.2: at most one primary action per screen).
                It was drawn as an outline like the other two, which left
                three identical teal outlines side by side and nothing saying
                which was the way in — a screen where every choice looks
                equally likely is a screen that has not been designed.
              */}
              <button type="submit" className="btn-primary" disabled={checking}>
                {checking ? 'Checking…' : 'Continue'}
              </button>{' '}
            </>
          )}
          <hr />
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
          {/*
            Only where one address serves everything. Where the surfaces
            have their own addresses, a participant is never offered a
            way into somebody else's workspace.
          */}
          {surface === 'single-host' && (
            <p className="welcome__elsewhere">
              {/*
                Not ways in for the person this screen is for. They exist
                because one address serves three audiences in development,
                and drawn as full-width outlines they were three identical
                buttons under a headline promising one thing — the same
                failure the dev-header path had fixed and this reintroduced
                for Google. Quiet text links, below the way in, and only
                where the surfaces share an address.
              */}
              <button type="button" className="link-button" onClick={() => setMode('supporter')}>
                Supporter workspace
              </button>{' '}
              <button type="button" className="link-button" onClick={() => setMode('staff')}>
                Staff workspace
              </button>
            </p>
          )}
          </form>
          {/*
            The design's closing line, and it is a promise this platform
            actually keeps: no screen in it is on a timer and nothing
            vanishes while it is being read. Worth saying to somebody who
            reads slowly and has been rushed by software before.

            The one exception is the inactivity sign-out, which is a
            different thing and is announced at the top of this screen when
            it happens rather than warned about here.
          */}
          <p className="welcome__note">There is no time limit on any screen. Nothing disappears while you read.</p>
          <SiteFooter year={copyrightYear(new Date())} />
        </main>
      </div>
    );
  }

  return (
    <div data-workspace="participant">
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
                onClick={() => {
                  setToast('');
                  setScreen(d.key);
                }}
              >
                <TabIcon name={d.icon} />
                {d.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      {/*
        The global chrome, from the handoff. Both sit above the content and
        neither scrolls away: text size and reading aloud are the brief.
      */}
      {helper !== null && (
        <HelperBanner
          helperName={helper}
          participantName="You"
          onStop={() => setHelper(null)}
        />
      )}
      <AccessibilityToolbar
        zoom={zoom}
        onZoom={(next) => setZoom((from) => next(from))}
        highContrast={highContrast}
        onHighContrast={setHighContrast}
        readAloudTarget={contentRef}
      />
      <main
        id="main-content"
        ref={contentRef}
        data-elder-content=""
        data-contrast={highContrast ? 'high' : undefined}
        /*
          An attribute rather than an inline custom property. The zoom is a
          finite set — six steps between 0.9 and 1.4, from the handoff — so
          it can be enumerated in the stylesheet, and the guard against
          inline styles bypassing the token layer stays satisfied rather
          than worked around. It caught this on the first run.
        */
        data-zoom={String(Math.round(zoom * 100))}
      >
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
        {screen === 'home' && (
          <section aria-labelledby="home-heading">
            {/*
              The handoff's greeting, and the real clock read at the one
              place where reading it is the point. The boundaries live in
              `greeting.ts` and are tested at fixed instants, so no test
              asserts a greeting that only holds until lunchtime (D-103).

              The name comes from the participant's own profile, which had
              been in the database since M02's first migration with no way
              for its owner to read it (B-16, now closed). Null while it is
              being fetched and null where there is no profile, and in both
              cases the greeting simply stands on its own — it never greets
              somebody by an identifier or by an invented placeholder.
            */}
            <h1 id="home-heading">{greetingFor(new Date(), displayName)}</h1>
            {/*
              The anti-feed statement, said rather than implied (design
              A1.5), and now in one sentence rather than two. This page
              ends: a participant who has done the things that are their
              turn is finished for the day.
            */}
            {/*
              The handoff's second line is "One thing is unfinished. When it
              is done, it is done." — which is only true when something is,
              so it is said only then. The other line is the anti-feed
              statement said outright (design A1.5), and both end the same
              way on purpose: this page finishes. A participant who has
              done the things that are their turn is done for the day.
            */}
            <p>
              {hasUnfinished
                ? 'One thing is unfinished. When it is done, it is done.'
                : 'Anything that needs a decision from you is below, and when it is done, it is done.'}
            </p>
            {/*
              What is waiting comes first, and everything else folds away.

              A1.6 answered "eight unlabelled buttons are a wall" by putting
              them in three named groups. Grouping was not enough: all eight
              were still on screen at once, and the measurement said so —
              an enrolled participant with one contribution to decide on saw
              191 words and eleven buttons, with the two that actually
              wanted an answer sitting third and fourth in a field of eight
              that wanted nothing. The problem was never the word count. It
              was that the thing to do and the things merely available were
              given the same weight (owner's instruction, D-100).

              So: the decision is the page, and the rest is one line each
              until asked for. Nothing is removed — every destination is
              still here, still reachable by name, and a closed <details>
              is still searched by the browser's find-in-page.
            */}
            {/*
              The handoff's order: greeting, the one unfinished thing, then
              what is waiting. The unfinished thing comes first because it
              is the person's own — something they started — and what is
              waiting came from somebody else.
            */}
            <UnfinishedPhotograph
              session={session}
              onPresence={setHasUnfinished}
              onCaption={(photograph) => {
                setCaptioning(photograph);
                setScreen('caption');
              }}
            />
            <WaitingForYou
              session={session}
              onReview={(contributionId) => {
                setReviewing(contributionId);
                setScreen('review');
              }}
            />
            {/*
              The handoff's order: what is waiting, then what was decided,
              then the places to go. A look back sits between the thing to
              do and the ways out — after the decision, because it is not
              one, and before the destinations, because it is about this
              person rather than about the app.
            */}
            <RecentDecisions session={session} />
            <div className="nav-rows">
            <details>
              <summary>Your information and who can see it</summary>
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
            </details>
            <details>
              <summary>Things you can do any time</summary>
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
            </details>
            {/*
              Where you stand, and the way out. Folded like the rest — it is
              a thing to consult, not a thing to do — but the leaving path
              stays inside it rather than moving somewhere less findable
              (A1.4 made it reachable from here deliberately, after the
              copy had promised it for weeks with no way to act on it).
            */}
            <details>
              <summary>Your part in the research</summary>
              <MyResearchPart session={session} headingLevel={3} />
            </details>
            {/* The design's third row. */}
            <button className="row-summary" onClick={() => setScreen('exercises')}>
              Exercises you can try
            </button>
            </div>
            {/*
              Help is the one thing that does not fold. It is duplicated by
              the bottom bar, which is exactly the redundancy removed
              everywhere else on this page — and kept here on purpose: the
              cost of the duplication is one line, and the cost of being
              wrong is somebody in difficulty having to open a disclosure
              first. That asymmetry decides it.
            */}
            <p>
              <button onClick={() => setScreen('help')}>Get help or report a problem</button>
            </p>
          </section>
        )}
        {/*
          Returning to Home unmounts and remounts it, so the waiting list
          reloads on its own — a decision made here is gone from Home by
          the time Home is next seen, without either screen having to tell
          the other.
        */}
        {screen === 'review' && reviewing !== null && (
          <ReviewContribution
            session={session}
            contributionId={reviewing}
            onDone={() => {
              setReviewing(null);
              setScreen('home');
            }}
          />
        )}
        {/*
          Helper mode is a screen, reached from Help, and not a row above
          the heading of every other screen. It was the latter, which put
          "Someone is helping me use this" ahead of the greeting for
          everybody who has nobody sitting with them — the single largest
          difference between the built Home and the design.
        */}
        {screen === 'helper' && (
          <HelperScreen helper={helper} onChange={setHelper} onDone={() => setScreen('help')} />
        )}
        {screen === 'caption' && captioning !== null && (
          <CaptionPhotograph
            session={session}
            photograph={captioning}
            onDone={() => {
              setCaptioning(null);
              setScreen('home');
            }}
          />
        )}
        {screen === 'exercises' && (
          <Exercises onHome={() => setScreen('home')} onTapping={() => setScreen('tapping')} />
        )}
        {screen === 'tapping' && (
          <Tapping
            onDone={(message) => {
              setToast(message ?? '');
              setScreen('exercises');
            }}
          />
        )}
        {screen === 'consent' && <ConsentPanel session={session} assistedBy={helper} />}
        {screen === 'access' && (
          <>
            <WhoHasAccess session={session} />
            {/*
              Beside who already has access, because they are one question:
              somebody looking at "who can see my things" is exactly the
              person who wants to add or remove one.
            */}
            <InviteSomeone session={session} />
          </>
        )}
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
            {/*
              Where the design puts it: a chevron row on Help. Above the
              safety panel, because somebody who has a person beside them
              is more likely to be here for that than for a report.
            */}
            <div className="nav-rows">
              <button className="row-summary" onClick={() => setScreen('helper')}>
                Someone is helping me use this
              </button>
            </div>
            <SafetyPanel session={session} />
            {/*
              Folded, and it is the biggest thing on this page: 191 words
              and 15 controls against the safety panel's 131 and 8. Two
              people were being failed at once — somebody in difficulty
              waded through text-size settings to reach the thing they came
              for, and somebody who could not read the screen had to guess
              that "make the text bigger" lived under "Help and safety".

              Folding fixes the first. The summary fixes the second, and is
              the reason this is not simply hidden: it says what is inside
              in the words somebody would use looking for it, where the
              heading beneath it ("How this looks and reads") does not.
              A closed disclosure with a plain label is easier to find on
              this page than fifteen controls buried in it.

              Where this ought to live is a larger question than folding it
              — the bottom bar has four slots by D-10's arithmetic and none
              spare — and it is the owner's to answer, not mine.
            */}
            <details>
              <summary>Make the text bigger, or change the colours</summary>
              <DisplayPreferencesPanel />
            </details>
            {/*
              The only way out of a session was to reload the page. Someone
              signed in with identifiers that no longer work — after a demo
              environment is reseeded, for instance — met a 404 on every
              screen and no control that would let them try different ones.
            */}
            {/*
              This block described the dev-header stub — "identifies you by
              the identifiers you typed in" — and rendered unconditionally,
              so the deployed environment, which signs people in with
              Google, told them something untrue about how they got here
              and offered a button that named a thing they had never done.
              The same shape as D-94's ten sites, and this one is on screen
              in front of participants.
            */}
            <section aria-labelledby="signout-heading">
              <h2 id="signout-heading">{authMode === 'google' ? 'Signing out' : 'Signing in as someone else'}</h2>
              {authMode === 'dev-header' && (
                <p>
                  This development environment identifies you by the identifiers you typed in. If they stop working —
                  after this demo environment is set up again, for example — nothing here is broken; the identifiers
                  have changed.
                </p>
              )}
              <p>
                <button
                  onClick={() => {
                    if (shared) endVisit();
                    void signOut();
                    setSession(null);
                    setScreen('home');
                  }}
                >
                  {authMode === 'google' ? 'Sign out' : 'Sign out and enter different identifiers'}
                </button>
              </p>
            </section>
          </section>
        )}
        {/*
          The design's toast: one block at the foot of the content region
          that "persists until the next navigation — nothing in this app
          disappears on a timer".
        */}
        {toast !== '' && (
          <p className="toast" role="status">
            {toast}
          </p>
        )}
        {/*
          Inside `main`, which already reserves the fixed tab bar's measured
          height at its foot — so the footer scrolls with the page and the
          bar never covers it.
        */}
        <SiteFooter year={copyrightYear(new Date())} />
      </main>
    </div>
  );
}
