import { useEffect, useState } from 'react';
import { api, type Session } from '../../api.js';
import { presentError, type PresentedError } from '../../errors.js';
import { ErrorState, LoadingState } from '../StateBlock.js';

/**
 * "What should we call you?" — the drawing's registration screen, and the
 * screen for changing the answer afterwards.
 *
 * The platform holds two names for a person and they are two different
 * things by hard rule (Doc 20 §354): the one the study office has on the
 * research record, and the one other participants are shown. Until this
 * existed there was only the first, so the research record's name was
 * what appeared on the community feed, on a connection and on a
 * conversation — and somebody who signed in with Google had that name
 * taken from their Google account without ever being asked (D-105).
 *
 * TWO DEPARTURES FROM THE DRAWING, both deliberate.
 *
 * The drawing asks for "your first name" and "your surname" as separate
 * boxes. A first name is not reliably the first part of a name in every
 * culture this study recruits from, and splitting one is how a platform
 * ends up addressing somebody by the wrong half of their name for a year.
 * The two boxes are kept — they are what makes the two tiers legible —
 * but they ask what to call you and what the study office has, which is
 * the distinction the drawing is actually drawing (X-45).
 *
 * And the study-office box is shown, not editable. Rewriting the name on
 * a research record is a change to research data, and a first-run screen
 * is not where that should happen without anybody reviewing it. Somebody
 * whose record is wrong currently has no way to correct it, which is a
 * real gap and is recorded as one (B-33) rather than closed by a write
 * path nobody asked for.
 */
export function WhatOthersCallMe({
  session,
  /** The name on the research record, shown so the two can be told apart. */
  onRecord,
  /** True on a first arrival, which changes the wording and the way out. */
  firstTime,
  onDone,
  onGetHelp,
}: {
  session: Session;
  onRecord: string | null;
  firstTime: boolean;
  onDone: () => void;
  onGetHelp?: () => void;
}) {
  const [loaded, setLoaded] = useState(false);
  const [chosenName, setChosenName] = useState('');
  const [city, setCity] = useState('');
  const [existing, setExisting] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<PresentedError | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const res = await api.myPublicProfile(session);
        const p = res.data?.attributes ?? null;
        if (p !== null) {
          setChosenName(p.chosenName);
          setCity(p.city ?? '');
          setExisting(true);
        }
      } catch (err) {
        setError(presentError(err));
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const save = async () => {
    setError(null);
    setSaving(true);
    try {
      await api.setPublicProfile(session, {
        chosenName,
        city: city.trim() === '' ? null : city.trim(),
      });
      onDone();
    } catch (err) {
      setError(presentError(err));
    } finally {
      setSaving(false);
    }
  };

  const takeDown = async () => {
    setError(null);
    setSaving(true);
    try {
      await api.withdrawPublicProfile(session);
      onDone();
    } catch (err) {
      setError(presentError(err));
    } finally {
      setSaving(false);
    }
  };

  if (!loaded && error === null) return <LoadingState label="Loading…" />;

  return (
    <section className="first-arrival" aria-labelledby="call-me-heading">
      <h1 id="call-me-heading">
        {firstTime ? 'Welcome. What should we call you?' : 'What other people call you'}
      </h1>
      {firstTime && (
        <p className="first-arrival__lede">
          You have not used this before, so there are two or three things to fill in.
        </p>
      )}

      <div className="first-arrival__field">
        <label htmlFor="call-me-name">What would you like to be called?</label>
        <span id="call-me-name-note" className="first-arrival__note">
          This is the name at the top of your screens, and the only name other people ever see.
        </span>
        <input
          id="call-me-name"
          type="text"
          value={chosenName}
          aria-describedby="call-me-name-note"
          placeholder="Margaret"
          onChange={(e) => setChosenName(e.target.value)}
        />
      </div>

      {/*
        Shown rather than typed. The point of this box is the sentence
        under it — a person needs to see that the platform holds a fuller
        name and that it stays with the study office — and that is true
        whether or not this screen can change it.
      */}
      <div className="first-arrival__field">
        <span className="first-arrival__label">What the study office has</span>
        <span className="first-arrival__note">
          Only the study office sees this. It is never shown in the community.
        </span>
        <p className="first-arrival__onrecord">{onRecord ?? 'Nothing recorded'}</p>
      </div>

      <div className="first-arrival__field">
        <label htmlFor="call-me-city">
          Your city or town <span className="first-arrival__optional">— if you like</span>
        </label>
        <span id="call-me-city-note" className="first-arrival__note">
          Shown beside your name when you share a piece of your story. A city or a town, never an address.
        </span>
        <input
          id="call-me-city"
          type="text"
          value={city}
          aria-describedby="call-me-city-note"
          placeholder="Halifax"
          onChange={(e) => setCity(e.target.value)}
        />
      </div>

      <div className="first-arrival__promises">
        <span className="first-arrival__promise first-arrival__promise--kept">
          Your story starts private, and stays that way until you decide otherwise
        </span>
        <span className="first-arrival__promise">
          We never sell your information, and never contact you to sell anything
        </span>
      </div>

      {error !== null && <ErrorState error={error} />}

      <button className="first-arrival__continue" disabled={saving || chosenName.trim() === ''} onClick={() => void save()}>
        {firstTime ? 'Continue' : 'Save this'}
      </button>

      {/*
        Choosing nothing is a real answer, and the screen has to say what
        it costs rather than simply letting somebody past. The ruling is
        that a name nobody chose to show is not shown — so the placeholder
        is what other people get, and this says so in the words they would
        actually see.
      */}
      {firstTime && (
        <button className="first-arrival__skip" onClick={onDone}>
          Not now — other people will see me as &ldquo;a community member&rdquo;
        </button>
      )}

      {!firstTime && existing && !removing && (
        <button className="first-arrival__skip" onClick={() => setRemoving(true)}>
          Take my name down
        </button>
      )}
      {removing && (
        <div role="alertdialog" aria-labelledby="take-down-heading" className="first-arrival__confirm">
          <h2 id="take-down-heading">Take your name down?</h2>
          <p>
            Other people will see you as &ldquo;a community member&rdquo;, the same as somebody who never chose a
            name. Nothing you have already shared is deleted — it stays where you shared it, under a name nobody can
            read any more.
          </p>
          <p>You can choose a name again here at any time.</p>
          <p>
            <button onClick={() => void takeDown()} disabled={saving}>
              Yes, take it down
            </button>{' '}
            <button onClick={() => setRemoving(false)}>Go back</button>
          </p>
        </div>
      )}

      {onGetHelp !== undefined && (
        <button className="first-arrival__telephone" onClick={onGetHelp}>
          I would rather do this on the telephone
        </button>
      )}
    </section>
  );
}
