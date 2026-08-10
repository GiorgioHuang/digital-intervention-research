import { useEffect, useState } from 'react';
import { api, PlatformApiError, type Session, type SupporterInvitationItem } from '../api.js';

/**
 * Inviting somebody into your own circle — a daughter, a neighbour, the
 * person who helps with the tablet.
 *
 * Until this existed, the only way to bring in somebody who had never used
 * the platform was for an administrator to write a row into the database.
 * The existing "propose a relationship" screen needs their account
 * identifier, which nobody can know for a person who has not signed in
 * yet, so a participant could only share with people who were already
 * here.
 *
 * Written for the person doing the sharing, not for the model underneath.
 * The choices are named as things ("read my life story"), because
 * `life-story.contribute` is a sentence about the system and not about
 * what a daughter will be able to do.
 */
const SHAREABLE = [
  {
    action: 'life-story.contribute',
    label: 'Add to my life story',
    detail: 'They can add memories and photographs to your life story. Anything they add waits for you to confirm it.',
  },
  {
    action: 'participant.view-shared',
    label: 'See what I share',
    detail: 'They can see the things you have chosen to share, and nothing else.',
  },
  {
    action: 'relationship.message',
    label: 'Send me messages',
    detail: 'They can write to you through this platform.',
  },
] as const;

const RELATIONSHIP_KINDS = [
  { value: 'FamilyMember', label: 'Family' },
  { value: 'Friend', label: 'Friend' },
  { value: 'InformalCaregiver', label: 'Someone who helps care for me' },
  { value: 'CommunityVolunteer', label: 'A volunteer' },
] as const;

export function InviteSomeone({ session }: { session: Session }): JSX.Element {
  const [email, setEmail] = useState('');
  const [kind, setKind] = useState<string>('FamilyMember');
  const [chosen, setChosen] = useState<string[]>([]);
  const [pending, setPending] = useState<SupporterInvitationItem[]>([]);
  const [message, setMessage] = useState('');
  const [problem, setProblem] = useState('');
  const [sending, setSending] = useState(false);

  const load = async (): Promise<void> => {
    try {
      const res = await api.listSupporterInvitations(session);
      setPending(res.data.map((i) => i.attributes));
    } catch {
      setPending([]);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <section aria-labelledby="invite-someone-heading">
      <h2 id="invite-someone-heading">Invite someone to see my things</h2>
      <p>
        You choose who, and you choose what they may do. You can take it back at any time under{' '}
        <strong>Who has access to me</strong>.
      </p>
      {/*
        Said before they type an address, not after. Somebody who expects
        the platform to send the invitation will sit waiting, and so will
        the person they invited.
      */}
      <p>
        <strong>This does not send an email.</strong> Tell them yourself that you have invited them, and ask them to
        open this platform and sign in with that Google account.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (email.trim() === '' || chosen.length === 0) return;
          setSending(true);
          setProblem('');
          setMessage('');
          void api
            .inviteSupporter(session, {
              email: email.trim(),
              relationshipType: kind,
              permittedActions: chosen,
            })
            .then(async (res) => {
              setMessage(
                `You have invited ${res.data.attributes.invitedEmail}. Nothing has been sent — please tell them yourself.`,
              );
              setEmail('');
              setChosen([]);
              await load();
            })
            .catch((err: unknown) => {
              setProblem(
                err instanceof PlatformApiError
                  ? err.error.message
                  : 'That invitation could not be recorded. Nothing has changed.',
              );
            })
            .finally(() => setSending(false));
        }}
      >
        <p>
          <label htmlFor="supporter-email">Their Google account address</label>{' '}
          <input id="supporter-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </p>
        <p>
          <label htmlFor="supporter-kind">Who they are to you</label>{' '}
          <select id="supporter-kind" value={kind} onChange={(e) => setKind(e.target.value)}>
            {RELATIONSHIP_KINDS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </p>
        <fieldset>
          <legend>What they may do</legend>
          {SHAREABLE.map((s) => (
            <p key={s.action}>
              <input
                id={`share-${s.action}`}
                type="checkbox"
                checked={chosen.includes(s.action)}
                onChange={(e) =>
                  setChosen(
                    e.target.checked ? [...chosen, s.action] : chosen.filter((a) => a !== s.action),
                  )
                }
              />{' '}
              <label htmlFor={`share-${s.action}`}>{s.label}</label>
              <br />
              <small>{s.detail}</small>
            </p>
          ))}
        </fieldset>
        {/*
          Nothing chosen is not an invitation — it would create a
          relationship that permits nothing and look like sharing.
        */}
        <button type="submit" disabled={sending || chosen.length === 0 || email.trim() === ''}>
          {sending ? 'Recording…' : 'Invite them'}
        </button>
      </form>

      {message !== '' && <p role="status">{message}</p>}
      {problem !== '' && <p role="alert">{problem}</p>}

      <h3>People you have invited who have not joined yet</h3>
      {pending.length === 0 ? (
        <p>Nobody is waiting.</p>
      ) : (
        <ul>
          {pending.map((i) => (
            <li key={i.invitationId}>
              <strong>{i.invitedEmail}</strong> · expires {new Date(i.expiresAt).toLocaleDateString()}
              <br />
              <small>
                {i.permittedActions
                  .map((a) => SHAREABLE.find((s) => s.action === a)?.label ?? a)
                  .join(', ')}
              </small>{' '}
              <button
                onClick={() => {
                  void api
                    .withdrawSupporterInvitation(session, i.invitationId)
                    .then(async () => {
                      setMessage(`The invitation to ${i.invitedEmail} has been withdrawn.`);
                      await load();
                    })
                    .catch(() => setProblem('That invitation could not be withdrawn.'));
                }}
              >
                Withdraw
              </button>
            </li>
          ))}
        </ul>
      )}
      <p>
        <small>
          Withdrawing only works while they have not joined. Once somebody has accepted, remove their access under
          Who has access to me — that is what actually stops them.
        </small>
      </p>
    </section>
  );
}
