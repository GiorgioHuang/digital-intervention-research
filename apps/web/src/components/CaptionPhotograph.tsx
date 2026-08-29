import { useState } from 'react';
import { api, type Session, type UncaptionedPhotograph } from '../api.js';
import { presentError, type PresentedError } from '../errors.js';
import { ErrorState } from './StateBlock.js';

/**
 * Saying who is in a photograph — the handoff's `caption` screen.
 *
 * One question, one field, one button. The screen exists because a
 * photograph in a life story with nobody named in it is the part most
 * likely to be lost: the one person who knows is the one looking at it,
 * and there is a window for asking them.
 *
 * **The photograph itself is not shown here, and that is a gap rather than
 * a choice.** Quarantined bytes are never served to clients, and there is
 * no endpoint that serves a released object's content either — so this
 * screen asks somebody to describe a picture it cannot put in front of
 * them. Recorded as B-19. Until it closes, the screen says what it is
 * asking about rather than pretending to show it.
 */
export function CaptionPhotograph({
  session,
  photograph,
  onDone,
}: {
  session: Session;
  photograph: UncaptionedPhotograph;
  onDone: () => void;
}) {
  const [caption, setCaption] = useState('');
  const [error, setError] = useState<PresentedError | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await api.captionPhotograph(session, photograph.objectId, caption);
      setError(null);
      onDone();
    } catch (err) {
      setError(presentError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section aria-labelledby="caption-heading">
      <p>
        <button className="back-link" onClick={onDone}>
          ‹ Back to Home
        </button>
      </p>
      <h1 id="caption-heading">Who is in this photograph?</h1>
      <p>
        The photograph you added on {addedOn(photograph.addedAt)}. Say who is in it and when it was, in your own
        words — a name and a year is enough.
      </p>
      {/*
        Not shown, and said plainly rather than left as a blank space
        somebody would take for a failure to load. B-19.
      */}
      <p>
        <small>The picture cannot be shown on this screen yet.</small>
      </p>
      <p>
        <label htmlFor="caption-text">Who is in it, and when was it?</label>
      </p>
      <p>
        <textarea
          id="caption-text"
          rows={4}
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
        />
      </p>
      {error !== null && <ErrorState error={error} />}
      <p>
        {/*
          Disabled while empty. Saving nothing is a real thing to want —
          it is how a caption is cleared — but not from here, where nothing
          has been written yet and the button would appear to have done
          something.
        */}
        <button className="primary" disabled={saving || caption.trim() === ''} onClick={() => void save()}>
          Save these words
        </button>
      </p>
    </section>
  );
}

const addedOn = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
