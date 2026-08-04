import { useState } from 'react';
import { staffLoadError } from '../errors.js';
import { staffApi, type AdministeredParticipant, type StaffSession } from '../staff-api.js';

/**
 * Administrative participant list for one organisation (decision D-13).
 *
 * Two things this screen is careful about:
 *
 * - It lists; it does not look up. There is no field for typing an
 *   identifier, because a lookup that answers "does this one exist" for a
 *   caller-supplied id is exactly the probe protected existence (ADR-050)
 *   exists to prevent. The organisation comes from the session, and the
 *   server reads it from the request context rather than the URL.
 * - It shows administrative facts only — identifier, name, account state.
 *   No enrolment, no consent, no research content. That is why the action
 *   is not consent-gated: it carries nothing a withdrawal should remove,
 *   and gating it would make someone who withdrew disappear from the
 *   administration they still need.
 */
export function StaffAdminPanel({ session }: { session: StaffSession }) {
  const [participants, setParticipants] = useState<AdministeredParticipant[] | null>(null);
  const [announcement, setAnnouncement] = useState('');

  const load = async () => {
    try {
      const res = await staffApi.listParticipants(session);
      setParticipants(res.data.map((i) => i.attributes));
      setAnnouncement(`Participant list updated (${res.data.length}).`);
    } catch (err) {
      setAnnouncement(staffLoadError(err, 'the participant list'));
    }
  };

  return (
    <section aria-labelledby="admin-heading">
      <h1 id="admin-heading">Participants in this organisation</h1>
      <p>
        Administrative details only: identifier, name and account state. Nothing here shows what anyone is enrolled in,
        what they consented to, or anything they have written.
      </p>
      <p>
        This lists the organisation you are signed in to. A participant registered without a platform account cannot be
        attributed to an organisation, so they do not appear here — this is not a complete roll of everyone in the
        study.
      </p>
      {session.organisationId === undefined || session.organisationId === '' ? (
        <p role="alert">
          You are signed in without an organisation, so there is nothing to scope this list to. Sign in again with the
          organisation identifier filled in.
        </p>
      ) : (
        <p>
          <button onClick={() => void load()}>Show the participant list</button>
        </p>
      )}

      {participants !== null && participants.length === 0 && (
        <p>No participant in this organisation has a platform account yet.</p>
      )}
      {participants !== null && participants.length > 0 && (
        <table>
          <caption>Participants with a platform account in this organisation</caption>
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Participant identifier</th>
              <th scope="col">Account state</th>
              <th scope="col">Registered</th>
            </tr>
          </thead>
          <tbody>
            {participants.map((p) => (
              <tr key={p.participantId}>
                <td>{p.displayName}</td>
                <td>
                  <code>{p.participantId}</code>
                </td>
                <td>{p.participantState}</td>
                <td>{new Date(p.registeredAt).toISOString().slice(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <p aria-live="polite" role="status">
        {announcement}
      </p>
    </section>
  );
}
