import { useState } from 'react';
import { staffActionError } from '../../errors.js';
import { staffApi, type StaffSession } from '../../staff-api.js';

/**
 * Telling a participant that the consent text they agreed to has changed.
 *
 * `ReConsentRequired` has been a permitted consent decision since the
 * tables were written. The permission engine reads it and refuses
 * everything the scope gates until the participant answers, and the error
 * catalogue carries a message for the outcome. Nothing anywhere could set
 * it — so a consent text could be revised and every participant would
 * carry on under an agreement to wording that no longer existed, while
 * their own consent screen said "Granted" at them.
 *
 * This is the one thing about somebody else's consent that a member of
 * staff does, and it is the opposite of granting: it stops what the scope
 * permits, immediately, until they agree again. So the screen says that
 * before the control rather than after it, and the note is required —
 * being asked to agree again without being told what changed leaves a
 * person with no way to judge it and no real option but to say yes.
 */
const SCOPES = [
  'study-participation',
  'community-participation',
  'open-matching',
  'participant-messaging',
  'supporter-involvement',
  'supporter-contribution',
];

export function ReConsent({ session }: { session: StaffSession }) {
  const [form, setForm] = useState({
    participantId: '',
    scope: 'study-participation',
    newTemplateVersion: '',
    whatChanged: '',
  });
  const [confirming, setConfirming] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  const ready =
    form.participantId.trim() !== '' && form.newTemplateVersion.trim() !== '' && form.whatChanged.trim() !== '';

  const submit = async () => {
    setConfirming(false);
    try {
      await staffApi.requireReConsent(
        session,
        form.participantId.trim(),
        form.scope,
        form.newTemplateVersion.trim(),
        form.whatChanged.trim(),
      );
      setAnnouncement(
        'Recorded. What that scope permits has stopped for this participant, and their consent screen now shows what changed.',
      );
    } catch (err) {
      setAnnouncement(staffActionError(err, 'That request'));
    }
  };

  return (
    <section aria-labelledby="reconsent-heading">
      <h2 id="reconsent-heading">Ask a participant to agree again</h2>
      {/* Said first: everything below reads differently once this is
          understood, and somebody who misses it will think this is a
          notification. */}
      <p>
        <strong>This stops things, now.</strong> Everything the chosen scope permits is refused for this participant
        from the moment you record it, and stays refused until they agree to the new wording — or until they decline,
        in which case it stays stopped. This is not a reminder or a notice; it is the withdrawal of an agreement on
        the grounds that the thing agreed to has changed.
      </p>
      <p>
        It only works where there is an agreement to supersede. A scope they declined, withdrew, or never decided is
        refused — asking again there would change nothing while telling you that you had acted.
      </p>
      <p>
        <label htmlFor="rc-participant">Participant identifier</label>{' '}
        <input
          id="rc-participant"
          value={form.participantId}
          onChange={(e) => setForm({ ...form, participantId: e.target.value })}
        />
      </p>
      <p>
        <label htmlFor="rc-scope">Which agreement changed</label>{' '}
        <select id="rc-scope" value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value })}>
          {SCOPES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </p>
      <p>
        <label htmlFor="rc-version">The new consent text version</label>{' '}
        <input
          id="rc-version"
          value={form.newTemplateVersion}
          onChange={(e) => setForm({ ...form, newTemplateVersion: e.target.value })}
        />
        <br />
        <small>
          Must differ from the version they agreed to. The same version is refused: it would stop their access and
          give them nothing new to read.
        </small>
      </p>
      <p>
        <label htmlFor="rc-changed">What changed (required — the participant reads this)</label>
        <br />
        <textarea
          id="rc-changed"
          rows={3}
          cols={60}
          value={form.whatChanged}
          onChange={(e) => setForm({ ...form, whatChanged: e.target.value })}
        />
        <br />
        <small>
          Write what is different about the terms, in words they will understand. This is the only thing they will
          have to decide on.
        </small>
      </p>
      <p>
        <button disabled={!ready} onClick={() => setConfirming(true)}>
          Ask this participant to agree again
        </button>
      </p>

      {confirming && (
        <div role="alertdialog" aria-labelledby="rc-confirm">
          <p id="rc-confirm">
            Stop what &ldquo;{form.scope}&rdquo; permits for {form.participantId.trim()} until they agree to{' '}
            {form.newTemplateVersion.trim()}?
          </p>
          <p>
            They are not told by any other means — this platform sends nothing. They will see it the next time they
            open their consent screen, and until then whatever this scope covers will simply be refused.
          </p>
          <p>
            <button onClick={() => void submit()}>Yes, record it</button>{' '}
            <button onClick={() => setConfirming(false)}>Go back</button>
          </p>
        </div>
      )}
      <p aria-live="polite" role="status">
        {announcement}
      </p>
    </section>
  );
}
